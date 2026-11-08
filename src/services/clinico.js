// Fichas clínicas: mediciones, objetivo, antecedentes y plan alimenticio de cada paciente.
// Toda operación recibe la sesión y aplica la regla de privacidad antes de leer o escribir.
import { citas, fichas, usuarios } from '../data/db'
import { nutricionistas } from '../data/nutricionistas'
import { ESTADO_CITA, ROL } from '../config/reglas'
import { calcularIMC, puedeEditarFicha, puedeVerFicha, validarMedicion } from '../domain/clinico'

const SIN_PERMISO = { ok: false, motivo: 'No tienes permiso para ver los datos clínicos de este paciente.' }
const mismoCorreo = (a, b) => String(a).toLowerCase() === String(b).toLowerCase()

// Nombre del profesional que corresponde a la cuenta del nutricionista (se enlazan por correo).
export function profesionalDeSesion(sesion) {
  if (sesion?.tipoUsuario !== ROL.NUTRICIONISTA) return null
  return nutricionistas.find((p) => mismoCorreo(p.correo, sesion.correo)) ?? null
}

const fichaVacia = (pacienteCorreo) => ({
  pacienteCorreo, nutricionista: '', objetivo: '', antecedentes: '', mediciones: [], planAlimenticio: null,
})

function contexto(pacienteCorreo, sesion) {
  const ficha = fichas.listar().find((f) => mismoCorreo(f.pacienteCorreo, pacienteCorreo)) ?? null
  const datos = { sesion, pacienteCorreo, ficha, citas: citas.listar(), nombreProfesional: profesionalDeSesion(sesion)?.nombre ?? '' }
  return { ficha, datos }
}

export function obtenerFicha(pacienteCorreo, sesion) {
  const { ficha, datos } = contexto(pacienteCorreo, sesion)
  if (!puedeVerFicha(datos)) return SIN_PERMISO
  const paciente = usuarios.listar().find((u) => mismoCorreo(u.correo, pacienteCorreo)) ?? null
  return { ok: true, ficha: ficha ?? fichaVacia(pacienteCorreo), paciente, puedeEditar: puedeEditarFicha(datos) }
}

// Crea la ficha la primera vez que el nutricionista guarda algo; queda asignada a él.
function guardar(pacienteCorreo, sesion, cambiar) {
  const { ficha, datos } = contexto(pacienteCorreo, sesion)
  if (!puedeEditarFicha(datos)) return SIN_PERMISO
  const base = ficha ?? { ...fichaVacia(pacienteCorreo), nutricionista: datos.nombreProfesional }
  const actualizada = cambiar(base, datos.nombreProfesional)
  if (ficha) fichas.actualizar(ficha.pacienteCorreo, actualizada)
  else fichas.crear(actualizada)
  return { ok: true, ficha: actualizada }
}

export function registrarMedicion(pacienteCorreo, valores, sesion, ahora = new Date()) {
  const errores = validarMedicion(valores, ahora)
  if (Object.values(errores).some(Boolean)) return { ok: false, motivo: 'Revisa los datos de la medición.', errores }
  return guardar(pacienteCorreo, sesion, (ficha, nutricionista) => ({
    ...ficha,
    mediciones: [
      ...ficha.mediciones,
      {
        id: 'M' + new Date(ahora).getTime().toString(36) + Math.random().toString(36).slice(2, 5),
        fecha: valores.fecha,
        peso: Number(valores.peso),
        talla: Number(valores.talla),
        cintura: valores.cintura === '' ? null : Number(valores.cintura),
        imc: calcularIMC(valores.peso, valores.talla),
        nota: String(valores.nota ?? '').trim(),
        nutricionista,
      },
    ],
  }))
}

export function guardarDatosFicha(pacienteCorreo, { objetivo, antecedentes, planTexto }, sesion, ahora = new Date()) {
  return guardar(pacienteCorreo, sesion, (ficha, nutricionista) => ({
    ...ficha,
    objetivo: String(objetivo ?? '').trim(),
    antecedentes: String(antecedentes ?? '').trim(),
    planAlimenticio: String(planTexto ?? '').trim()
      ? { texto: planTexto.trim(), actualizadoEn: new Date(ahora).toISOString(), nutricionista }
      : ficha.planAlimenticio,
  }))
}

// Agenda del nutricionista: solo sus citas, ordenadas por fecha.
export function agendaDe(sesion) {
  const profesional = profesionalDeSesion(sesion)
  if (!profesional) return []
  return citas
    .listar()
    .filter((c) => c.nutricionista === profesional.nombre)
    .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
}

// Pacientes del nutricionista: los que tiene asignados en su ficha o que atiende o atendió.
export function pacientesDe(sesion, ahora = new Date()) {
  const profesional = profesionalDeSesion(sesion)
  if (!profesional) return []
  const correos = new Set([
    ...fichas.listar().filter((f) => f.nutricionista === profesional.nombre).map((f) => f.pacienteCorreo.toLowerCase()),
    ...agendaDe(sesion).filter((c) => c.estadoCita !== ESTADO_CITA.CANCELADA).map((c) => c.pacienteCorreo.toLowerCase()),
  ])
  const todos = usuarios.listar()
  return [...correos].map((correo) => {
    const usuario = todos.find((u) => mismoCorreo(u.correo, correo))
    const proxima = agendaDe(sesion).find(
      (c) => mismoCorreo(c.pacienteCorreo, correo) && new Date(c.fechaHora) >= ahora
        && [ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA].includes(c.estadoCita),
    )
    return { correo, nombre: usuario ? `${usuario.nombre} ${usuario.apellidos}` : correo, run: usuario?.run ?? '', proxima: proxima ?? null }
  })
}
