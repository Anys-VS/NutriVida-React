// Administración de usuarios, historial de un paciente, perfil propio y planes contratados.
// Modo 'api': ms-identidad (usuarios), ms-citas (citas y planes). Modo 'local': las reglas del navegador.
// Las acciones responden { ok, motivo } igual que las reglas locales.
import { usaApi } from '../config/api'
import { citas, planes, usuarios } from '../data/db'
import { cliente } from '../api/cliente'
import { citasApi, planesApi, usuariosApi } from '../api/recursos'
import { citaDesdeApi, planDesdeApi } from '../api/adaptadores'
import { ROL } from '../config/reglas'
import { resumenSesiones } from '../domain/planes'
import { citasDePaciente } from './reservas'
import { planesDePaciente, registrarReembolsoPlan } from './planes'
import { cambiarEstadoUsuario, eliminarUsuario, guardarUsuario } from './usuarios'

async function intentar(accion) {
  try {
    return { ok: true, ...(await accion()) }
  } catch (error) {
    return { ok: false, motivo: error.message, errores: error.errores ?? {} }
  }
}

const mismoCorreo = (correoA, correoB) => String(correoA).toLowerCase() === String(correoB).toLowerCase()
// El backend no acepta textos vacíos en los campos opcionales con formato (fecha): se envían como null.
const vacioANulo = (valor) => (valor === '' || valor === undefined ? null : valor)

// ---------- Usuarios (administrador) ----------

export async function listarUsuarios() {
  return usaApi() ? usuariosApi.listar() : usuarios.listar()
}

export function guardarUsuarioAdmin(datos, runEnEdicion = null) {
  if (!usaApi()) return Promise.resolve(guardarUsuario(datos, runEnEdicion))
  const cuerpo = {
    run: datos.run.trim().toUpperCase(),
    nombre: datos.nombre.trim(),
    apellidos: datos.apellidos.trim(),
    correo: datos.correo.trim().toLowerCase(),
    contrasena: vacioANulo(datos.contrasena), // al editar, vacía = se conserva la actual
    tipoUsuario: datos.tipoUsuario,
    region: vacioANulo(datos.region),
    comuna: vacioANulo(datos.comuna),
    direccion: vacioANulo(datos.direccion),
    fechaNacimiento: vacioANulo(datos.fechaNacimiento),
  }
  return intentar(async () => ({
    usuario: runEnEdicion ? await usuariosApi.actualizar(runEnEdicion, cuerpo) : await usuariosApi.crear(cuerpo),
  }))
}

export function eliminarUsuarioAdmin(run, sesion) {
  if (!usaApi()) return Promise.resolve(eliminarUsuario(run, sesion))
  return intentar(() => usuariosApi.eliminar(run).then(() => ({})))
}

export function cambiarEstadoUsuarioAdmin(run, activo, sesion) {
  if (!usaApi()) return Promise.resolve(cambiarEstadoUsuario(run, activo, sesion))
  return intentar(async () => ({ usuario: await usuariosApi.cambiarEstado(run, activo) }))
}

// ---------- Historial de un paciente ----------

// { usuario, citas, planes } o null si el usuario no existe.
export async function cargarHistorial(run) {
  if (!usaApi()) {
    const usuario = usuarios.obtener(run)
    return usuario ? { usuario, citas: citasDePaciente(usuario.correo), planes: planesDePaciente(usuario.correo) } : null
  }
  let usuario
  try {
    usuario = await usuariosApi.obtener(run)
  } catch (error) {
    if (error.estado === 404) return null
    throw error
  }
  // El personal recibe todas las citas y planes; se filtran los del paciente.
  const [todasLasCitas, todosLosPlanes] = await Promise.all([citasApi.listar(), planesApi.listar().catch(() => [])])
  return {
    usuario,
    citas: todasLasCitas.map(citaDesdeApi).filter((cita) => mismoCorreo(cita.pacienteCorreo, usuario.correo))
      .sort((citaA, citaB) => new Date(citaA.fechaHora) - new Date(citaB.fechaHora)),
    planes: todosLosPlanes.map(planDesdeApi).filter((plan) => mismoCorreo(plan.pacienteCorreo, usuario.correo)),
  }
}

// ---------- Mi perfil ----------

// { usuario, editable }. En modo 'api' solo el administrador puede editar usuarios (PUT /usuarios/{run}),
// así que recepción y nutricionistas ven su perfil en modo lectura.
export async function cargarPerfil(sesion) {
  if (!usaApi()) return { usuario: usuarios.obtener(sesion.run) ?? null, editable: true }
  const usuario = (await cliente.get('/auth/me')).data
  return { usuario, editable: sesion.tipoUsuario === ROL.ADMIN }
}

export function guardarPerfil(usuario, { nombre, apellidos, contrasena }) {
  const cambios = { nombre, apellidos, ...(contrasena ? { contrasena } : {}) }
  if (!usaApi()) {
    usuarios.actualizar(usuario.run, cambios)
    return Promise.resolve({ ok: true })
  }
  return guardarUsuarioAdmin({ ...usuario, ...cambios, contrasena: contrasena ?? '' }, usuario.run)
}

// ---------- Planes contratados (administrador) ----------

// Lista de planes con su resumen de sesiones y el nombre del paciente.
export async function cargarPlanes() {
  if (!usaApi()) {
    const todasLasCitas = citas.listar()
    const nombres = Object.fromEntries(usuarios.listar().map((usuario) => [usuario.correo.toLowerCase(), `${usuario.nombre} ${usuario.apellidos}`]))
    return {
      planes: planes.listar().map((plan) => ({ ...plan, resumen: resumenSesiones(plan, todasLasCitas.filter((cita) => cita.planId === plan.id)) })),
      nombres,
    }
  }
  const [lista, todos] = await Promise.all([planesApi.listar(), usuariosApi.listar().catch(() => [])])
  return {
    planes: lista.map(planDesdeApi),
    nombres: Object.fromEntries(todos.map((usuario) => [usuario.correo.toLowerCase(), `${usuario.nombre} ${usuario.apellidos}`])),
  }
}

// El reembolso del 80 % de un plan cancelado solo existe en modo local (el backend simplificado no cancela planes).
export function reembolsarPlan(id) {
  return Promise.resolve(registrarReembolsoPlan(id))
}
