// Agenda del paciente para las pantallas Reservar, Checkout y Reserva confirmada.
// Modo 'api': ms-citas (disponibilidad, citas y planes) y ms-ordenes (pago). Modo 'local': las reglas del navegador.
// Todas las funciones son asíncronas y devuelven la misma forma en ambos modos; las acciones
// responden { ok, motivo } como las reglas locales, así la página no sabe de dónde vienen los datos.
import { usaApi } from '../config/api'
import { citas, planes } from '../data/db'
import { carritoApi, citasApi, nutricionistasApi, planesApi } from '../api/recursos'
import { citaDesdeApi, ordenDesdeApi, planDesdeApi } from '../api/adaptadores'
import { METODO_PAGO, TIPO_SERVICIO } from '../config/reglas'
import { horariosDisponibles } from '../domain/citas'
import { resumenSesiones } from '../domain/planes'
import { listarServicios } from './catalogo'
import { listarNutricionistas } from './especialistas'
import { agendarSesion, contratarPlan } from './planes'
import { reprogramarCita, reservarCita } from './reservas'

const mismoCorreo = (correoA, correoB) => String(correoA).toLowerCase() === String(correoB).toLowerCase()

// Ejecuta una acción del backend y la traduce a { ok, ... } o { ok: false, motivo, estado }.
async function intentar(accion) {
  try {
    return { ok: true, ...(await accion()) }
  } catch (error) {
    return { ok: false, motivo: error.message, estado: error.estado }
  }
}

// 404 o 403 = "no encontramos" (la página muestra un mensaje); otros errores se propagan.
async function oNulo(cargar) {
  try {
    return await cargar()
  } catch (error) {
    if (error.estado === 404 || error.estado === 403) return null
    throw error
  }
}

// ---------- Consultas ----------

export async function obtenerPlan(planId, correo) {
  if (!usaApi()) {
    const plan = planes.obtener(planId)
    if (!plan || !mismoCorreo(plan.pacienteCorreo, correo)) return null
    return { ...plan, resumen: resumenSesiones(plan, citas.listar().filter((cita) => cita.planId === plan.id)) }
  }
  return oNulo(async () => planDesdeApi(await planesApi.obtener(planId)))
}

export async function obtenerCita(id, correo) {
  if (!usaApi()) {
    const cita = citas.obtener(id)
    return cita && mismoCorreo(cita.pacienteCorreo, correo) ? cita : null
  }
  return oNulo(async () => citaDesdeApi(await citasApi.obtener(id)))
}

// Todo lo que necesita la página Reservar según su modo: reserva nueva, sesión de un plan o reprogramación.
export async function cargarReserva({ planId, reprogramarId, correo }) {
  const [servicios, nutricionistas, plan, citaOriginal] = await Promise.all([
    listarServicios(),
    listarNutricionistas(),
    planId && correo ? obtenerPlan(planId, correo) : null,
    reprogramarId && correo ? obtenerCita(reprogramarId, correo) : null,
  ])
  return { servicios, nutricionistas, plan, citaOriginal }
}

// Bloques de una hora del día con su disponibilidad: [{ hora, disponible, motivo }].
export async function horariosDelDia({ servicio, nutricionista, fecha, excluirId = null }) {
  if (!servicio || !fecha) return []
  if (!usaApi()) return horariosDisponibles({ servicio, nutricionista, fecha, citas: citas.listar(), excluirId })
  const bloques = await nutricionistasApi.disponibilidad({ fecha, nutricionista, codigoServicio: servicio.codigo })
  return bloques.map((bloque) => ({ hora: bloque.hora.slice(0, 5), disponible: bloque.disponible, motivo: bloque.motivo ?? '' }))
}

// Reserva confirmada: la cita y, si es una sesión, su plan (para el mensaje de saldo).
export async function cargarReservaConfirmada(id, correo) {
  const cita = await obtenerCita(id, correo)
  const plan = cita?.planId ? await obtenerPlan(cita.planId, correo) : null
  return cita ? { cita, plan } : null
}

// ---------- Acciones ----------

export function agendarSesionDePlan({ planId, nutricionista, fechaHora }) {
  if (!usaApi()) return Promise.resolve(agendarSesion({ planId, nutricionista, fechaHora }))
  return intentar(async () => ({ cita: citaDesdeApi(await planesApi.agendarSesion(planId, { fechaHora, nutricionista })) }))
}

export function reprogramar(id, { fechaHora, nutricionista }) {
  if (!usaApi()) return Promise.resolve(reprogramarCita(id, { fechaHora, nutricionista }))
  return intentar(async () => ({ cita: citaDesdeApi(await citasApi.reprogramar(id, { fechaHora, nutricionista })) }))
}

// Reserva de una sola atención desde el Checkout.
// - Pago en clínica: la cita queda agendada con pago pendiente (POST /citas).
// - Pago online: en modo 'api' la atención pasa por el carrito y se paga sola (el mismo checkout que agenda
//   en ms-citas). Si el pago falla, se quita del carrito para no dejarla duplicada.
// Devuelve { ok, cita?, orden?, rechazado? }. `rechazado` = el banco rechazó la tarjeta.
export async function reservarAtencion({ pacienteCorreo, correoConfirmacion, servicio, nutricionista, fechaHora, motivo, metodoPago, tarjeta }) {
  const esPlan = servicio.tipo === TIPO_SERVICIO.PLAN
  if (!usaApi()) {
    const datos = { pacienteCorreo, correoConfirmacion, codigoServicio: servicio.codigo, nutricionista, fechaHora, motivo }
    return esPlan ? contratarPlan(datos) : reservarCita({ ...datos, metodoPago })
  }

  if (metodoPago === METODO_PAGO.CLINICA) {
    return intentar(async () => ({
      cita: citaDesdeApi(await citasApi.crear({ codigoServicio: servicio.codigo, nutricionista, fechaHora, motivo, correoConfirmacion })),
    }))
  }

  const agregado = await intentar(async () => ({
    item: await carritoApi.agregar({ codigoServicio: servicio.codigo, fechaHora, nutricionista, motivo }),
  }))
  if (!agregado.ok) return agregado
  const pago = await intentar(async () => ({
    orden: ordenDesdeApi(await carritoApi.pagar({ tarjeta, itemIds: [agregado.item.id], citaIds: [], correoConfirmacion })),
  }))
  if (!pago.ok) {
    await carritoApi.quitar(agregado.item.id).catch(() => {})
    return { ...pago, rechazado: pago.estado === 402 }
  }
  const linea = pago.orden.detalle[0]
  return { ok: true, orden: pago.orden, cita: linea?.citaId ? { id: linea.citaId } : null }
}
