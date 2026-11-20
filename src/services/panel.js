// Datos y acciones del panel interno (recepción, nutricionista y administración).
// Modo 'api': ms-citas (citas, nutricionistas), ms-clinico (fichas) y ms-identidad (usuarios).
// Modo 'local': las reglas del navegador. Todas las funciones son asíncronas y devuelven la misma forma
// en ambos modos; las acciones responden { ok, motivo } igual que las reglas locales.
import { usaApi } from '../config/api'
import { citas, planes, servicios, usuarios } from '../data/db'
import { citasApi, fichasApi, nutricionistasApi, planesApi, usuariosApi } from '../api/recursos'
import { citaDesdeApi, fichaDesdeApi, planDesdeApi } from '../api/adaptadores'
import { listarServiciosAdmin } from './catalogo'
import { ESTADO_CITA, ROL } from '../config/reglas'
import {
  cancelarCitasVencidas, cancelarPorClinica, marcarAtendida, marcarInasistencia,
  registrarPagoEnClinica as registrarPagoLocal, registrarReembolso as registrarReembolsoLocal,
} from './reservas'
import { agendaDe, guardarDatosFicha as guardarDatosLocal, obtenerFicha as obtenerFichaLocal, pacientesDe, profesionalDeSesion, registrarMedicion as registrarMedicionLocal } from './clinico'
import { validarMedicion } from '../domain/clinico'

const mismoCorreo = (correoA, correoB) => String(correoA).toLowerCase() === String(correoB).toLowerCase()
const porFecha = (citaA, citaB) => new Date(citaA.fechaHora) - new Date(citaB.fechaHora)

async function intentar(accion) {
  try {
    return { ok: true, ...(await accion()) }
  } catch (error) {
    return { ok: false, motivo: error.message, errores: error.errores, estado: error.estado }
  }
}

// Usuarios por correo, para mostrar el nombre del paciente. En modo 'api' solo administración y
// recepción pueden listar usuarios: para el nutricionista se muestra el correo.
async function usuariosPorCorreo(sesion) {
  let lista = []
  if (!usaApi()) lista = usuarios.listar()
  else if ([ROL.ADMIN, ROL.RECEPCION].includes(sesion?.tipoUsuario)) lista = await usuariosApi.listar().catch(() => [])
  return Object.fromEntries(lista.map((usuario) => [usuario.correo.toLowerCase(), usuario]))
}

export const nombreDe = (usuariosIndice, correo) => {
  const usuario = usuariosIndice[String(correo).toLowerCase()]
  return usuario ? `${usuario.nombre} ${usuario.apellidos}` : correo
}

// ---------- Gestión de citas (recepción y administración) ----------

// { citas, usuarios, canceladas }. RN-06: en modo local, al entrar se cancelan las citas vencidas
// (en el backend lo hace una tarea programada cada 15 minutos).
export async function cargarCitasPersonal(sesion) {
  if (!usaApi()) {
    const canceladas = cancelarCitasVencidas()
    return { citas: citas.listar(), usuarios: await usuariosPorCorreo(sesion), canceladas }
  }
  const [lista, indice] = await Promise.all([citasApi.listar(), usuariosPorCorreo(sesion)])
  return { citas: lista.map(citaDesdeApi), usuarios: indice, canceladas: 0 }
}

export function registrarAsistencia(id, atendida) {
  if (!usaApi()) return Promise.resolve(atendida ? marcarAtendida(id) : marcarInasistencia(id))
  return intentar(async () => ({ cita: citaDesdeApi(await citasApi.registrarAsistencia(id, atendida ? 'ATENDIDA' : 'INASISTENCIA')) }))
}

export function cancelarComoClinica(id) {
  if (!usaApi()) return Promise.resolve(cancelarPorClinica(id))
  return intentar(async () => ({ cita: citaDesdeApi((await citasApi.cancelar(id)).cita) }))
}

export function registrarPagoEnClinica(id) {
  if (!usaApi()) return Promise.resolve(registrarPagoLocal(id))
  return intentar(async () => ({ cita: citaDesdeApi(await citasApi.registrarPagoClinica(id)) }))
}

export function registrarReembolso(id) {
  if (!usaApi()) return Promise.resolve(registrarReembolsoLocal(id))
  return intentar(async () => {
    const cita = citaDesdeApi(await citasApi.registrarReembolso(id))
    return { cita, reembolso: cita.montoReembolsado }
  })
}

// ---------- Agenda y pacientes del nutricionista ----------

// El profesional de la sesión (se enlaza por correo con el directorio de nutricionistas).
async function profesionalDe(sesion) {
  if (!usaApi()) return profesionalDeSesion(sesion)
  const lista = await nutricionistasApi.listar()
  return lista.find((profesional) => mismoCorreo(profesional.correo, sesion.correo)) ?? null
}

// { profesional, citas, usuarios }. GET /citas ya devuelve solo la agenda del nutricionista de la sesión.
export async function cargarAgenda(sesion) {
  const profesional = await profesionalDe(sesion)
  if (!profesional) return { profesional: null, citas: [], usuarios: {} }
  if (!usaApi()) return { profesional, citas: agendaDe(sesion), usuarios: await usuariosPorCorreo(sesion) }
  const lista = await citasApi.listar()
  return { profesional, citas: lista.map(citaDesdeApi).sort(porFecha), usuarios: {} }
}

// Pacientes del nutricionista: los de sus fichas (ms-clinico) y los que atiende (su agenda en ms-citas).
// [{ correo, nombre, run, proxima }]
export async function cargarPacientes(sesion, ahora = new Date()) {
  if (!usaApi()) return pacientesDe(sesion, ahora)
  const [fichas, agenda] = await Promise.all([fichasApi.listar().catch(() => []), citasApi.listar()])
  const citasAgenda = agenda.map(citaDesdeApi).sort(porFecha)
  const correos = new Set([
    ...fichas.map((ficha) => ficha.pacienteCorreo.toLowerCase()),
    ...citasAgenda.filter((cita) => cita.estadoCita !== ESTADO_CITA.CANCELADA).map((cita) => cita.pacienteCorreo.toLowerCase()),
  ])
  return [...correos].map((correo) => ({
    correo,
    nombre: correo,
    run: '',
    proxima: citasAgenda.find((cita) => mismoCorreo(cita.pacienteCorreo, correo) && new Date(cita.fechaHora) >= ahora
      && [ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA].includes(cita.estadoCita)) ?? null,
  }))
}

// ---------- Ficha clínica ----------

const fichaVacia = (pacienteCorreo) => ({
  pacienteCorreo, nutricionista: '', objetivo: '', antecedentes: '', mediciones: [], planAlimenticio: null,
})

// { ok, ficha, paciente, puedeEditar } o { ok: false, motivo }. `paciente` puede ser null en modo 'api'
// para el nutricionista (no puede leer ms-identidad); la ficha se identifica por el correo.
export async function cargarFicha(pacienteCorreo, sesion) {
  if (!usaApi()) return obtenerFichaLocal(pacienteCorreo, sesion)
  try {
    const ficha = fichaDesdeApi(await fichasApi.obtener(pacienteCorreo))
    return { ok: true, ficha, paciente: null, puedeEditar: sesion.tipoUsuario === ROL.NUTRICIONISTA }
  } catch (error) {
    // Sin ficha todavía: el nutricionista la abre al guardar el primer dato.
    if (error.estado === 404 && sesion.tipoUsuario === ROL.NUTRICIONISTA) {
      return { ok: true, ficha: fichaVacia(pacienteCorreo), paciente: null, puedeEditar: true, nueva: true }
    }
    return { ok: false, motivo: error.message }
  }
}

// En modo 'api' la ficha se crea (POST /fichas) la primera vez que se guarda algo.
async function asegurarFicha(pacienteCorreo, nueva) {
  if (nueva) await fichasApi.crear({ pacienteCorreo })
}

export async function registrarMedicion(pacienteCorreo, valores, sesion, nueva = false) {
  if (!usaApi()) return registrarMedicionLocal(pacienteCorreo, valores, sesion)
  const errores = validarMedicion(valores, new Date())
  if (Object.values(errores).some(Boolean)) return { ok: false, motivo: 'Revisa los datos de la medición.', errores }
  return intentar(async () => {
    await asegurarFicha(pacienteCorreo, nueva)
    const ficha = await fichasApi.registrarMedicion(pacienteCorreo, {
      fecha: valores.fecha,
      peso: Number(valores.peso),
      talla: Number(valores.talla),
      cintura: valores.cintura === '' ? null : Number(valores.cintura),
      nota: String(valores.nota ?? '').trim(),
    })
    return { ficha: fichaDesdeApi(ficha) }
  })
}

export async function guardarDatosFicha(pacienteCorreo, { objetivo, antecedentes, planTexto }, sesion, nueva = false) {
  if (!usaApi()) return guardarDatosLocal(pacienteCorreo, { objetivo, antecedentes, planTexto }, sesion)
  return intentar(async () => {
    await asegurarFicha(pacienteCorreo, nueva)
    const ficha = await fichasApi.actualizar(pacienteCorreo, {
      objetivo: String(objetivo ?? '').trim(),
      antecedentes: String(antecedentes ?? '').trim(),
      planAlimenticio: String(planTexto ?? '').trim() || null,
    })
    return { ficha: fichaDesdeApi(ficha) }
  })
}

// ---------- Resumen, cupos críticos y reportes (administrador) ----------

// Todo lo que necesitan las métricas: citas, planes y servicios de la clínica y la cantidad de usuarios.
// Las métricas se calculan en el navegador con las mismas reglas en ambos modos (src/domain).
export async function cargarDatosAdministracion() {
  if (!usaApi()) {
    cancelarCitasVencidas() // RN-06: deja los datos al día antes de calcular
    return { citas: citas.listar(), planes: planes.listar(), servicios: servicios.listar(), totalUsuarios: usuarios.listar().length }
  }
  const [lista, listaPlanes, catalogo, todos] = await Promise.all([
    citasApi.listar(),
    planesApi.listar().catch(() => []),
    listarServiciosAdmin(),
    usuariosApi.listar().catch(() => []),
  ])
  return { citas: lista.map(citaDesdeApi), planes: listaPlanes.map(planDesdeApi), servicios: catalogo, totalUsuarios: todos.length }
}
