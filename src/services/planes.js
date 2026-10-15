import { citas, planes, servicios } from '../data/db'
import { ESTADO_CITA, ESTADO_PAGO, ESTADO_PLAN, METODO_PAGO, TIPO_SERVICIO } from '../config/reglas'
import { evaluarReserva, hayDisponibilidad } from '../domain/citas'
import { planCompletado, resumenSesiones } from '../domain/planes'
import { precioFinal } from '../domain/precios'
import { reembolsoPlan } from '../domain/reembolsos'

function generarId(prefijo, ahora) {
  return prefijo + new Date(ahora).getTime().toString(36) + Math.random().toString(36).slice(2, 6)
}

const sesionesDe = (planId) => citas.listar().filter((c) => c.planId === planId)

// Una sesión de plan está cubierta por el pago del plan: no tiene precio propio (RN-13).
function crearSesion(plan, { correoConfirmacion, nutricionista, fechaHora, ahora, primera = false }) {
  const sesion = {
    id: generarId('C', ahora),
    planId: plan.id,
    primeraSesion: primera,
    pacienteCorreo: plan.pacienteCorreo,
    correoConfirmacion,
    codigoServicio: plan.codigoServicio,
    nombreServicio: `${plan.nombre} (sesión)`,
    nutricionista,
    fechaHora: new Date(fechaHora).toISOString(),
    metodoPago: METODO_PAGO.ONLINE,
    estadoCita: ESTADO_CITA.CONFIRMADA,
    estadoPago: ESTADO_PAGO.PAGADO,
    limiteConfirmacion: null,
    precio: 0,
    montoPagado: 0,
    montoReembolsado: 0,
    creadaEn: new Date(ahora).toISOString(),
  }
  citas.crear(sesion)
  return sesion
}

// Contrata el plan (pago online) y agenda su primera sesión.
export function contratarPlan({ pacienteCorreo, correoConfirmacion = pacienteCorreo, codigoServicio, nutricionista = '', fechaHora, ahora = new Date() }) {
  const servicio = servicios.obtener(codigoServicio)
  if (!servicio || servicio.tipo !== TIPO_SERVICIO.PLAN) return { ok: false, motivo: 'El plan no existe.' }
  if (!servicio.sesiones) return { ok: false, motivo: 'Este plan aún no tiene sesiones definidas. Consulta con la clínica.' }

  const evaluacion = evaluarReserva({ fechaHora, metodoPago: METODO_PAGO.ONLINE, esPlan: true, ahora })
  if (!evaluacion.ok) return evaluacion
  if (!hayDisponibilidad({ servicio, nutricionista, fechaHora, citas: citas.listar() })) {
    return { ok: false, motivo: 'Ese horario ya no está disponible.' }
  }

  const precio = precioFinal(servicio)
  const plan = {
    id: generarId('P', ahora),
    pacienteCorreo,
    codigoServicio,
    nombre: servicio.nombre,
    sesionesTotales: servicio.sesiones,
    precio,
    montoPagado: precio,
    estadoPlan: ESTADO_PLAN.ACTIVO,
    estadoPago: ESTADO_PAGO.PAGADO,
    montoReembolsado: 0,
    reembolsoPendiente: 0,
    creadoEn: new Date(ahora).toISOString(),
  }
  planes.crear(plan)
  const cita = crearSesion(plan, { correoConfirmacion, nutricionista, fechaHora, ahora, primera: true })
  return { ok: true, plan, cita }
}

// Agenda otra sesión del plan, sin volver a pagar, mientras haya saldo.
export function agendarSesion({ planId, nutricionista = '', fechaHora, ahora = new Date() }) {
  const plan = planes.obtener(planId)
  if (!plan || plan.estadoPlan !== ESTADO_PLAN.ACTIVO) return { ok: false, motivo: 'Este plan no está activo.' }
  if (resumenSesiones(plan, sesionesDe(planId)).porAgendar === 0) {
    return { ok: false, motivo: 'Ya agendaste todas las sesiones de tu plan.' }
  }

  const evaluacion = evaluarReserva({ fechaHora, metodoPago: METODO_PAGO.ONLINE, esPlan: true, ahora })
  if (!evaluacion.ok) return evaluacion
  const servicio = servicios.obtener(plan.codigoServicio) ?? { codigo: plan.codigoServicio }
  if (!hayDisponibilidad({ servicio, nutricionista, fechaHora, citas: citas.listar() })) {
    return { ok: false, motivo: 'Ese horario ya no está disponible.' }
  }
  return { ok: true, cita: crearSesion(plan, { correoConfirmacion: plan.pacienteCorreo, nutricionista, fechaHora, ahora }) }
}

// Cuánto se devolvería si se cancelara hoy el plan (RN-15).
export function reembolsoPorCancelar(planId) {
  const plan = planes.obtener(planId)
  return plan ? reembolsoPlan({ montoPagado: plan.montoPagado, sesiones: sesionesDe(planId) }) : 0
}

// RN-15: cancela el plan y libera sus sesiones futuras. El reembolso queda pendiente de registro.
export function cancelarPlan(planId, ahora = new Date()) {
  const plan = planes.obtener(planId)
  if (!plan || plan.estadoPlan !== ESTADO_PLAN.ACTIVO) return { ok: false, motivo: 'Este plan no se puede cancelar.' }

  const reembolso = reembolsoPorCancelar(planId)
  sesionesDe(planId)
    .filter((s) => [ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA].includes(s.estadoCita))
    .forEach((s) => citas.actualizar(s.id, { estadoCita: ESTADO_CITA.CANCELADA }))

  const actualizado = planes.actualizar(planId, {
    estadoPlan: ESTADO_PLAN.CANCELADO,
    reembolsoPendiente: reembolso,
    canceladoEn: new Date(ahora).toISOString(),
  })
  return { ok: true, plan: actualizado, reembolsoPendiente: reembolso }
}

// El administrador registra la devolución del 80% del plan.
export function registrarReembolsoPlan(planId) {
  const plan = planes.obtener(planId)
  if (!plan || !(plan.reembolsoPendiente > 0)) return { ok: false, motivo: 'Este plan no tiene un reembolso pendiente.' }
  const actualizado = planes.actualizar(planId, {
    estadoPago: ESTADO_PAGO.REEMBOLSADO_PARCIAL,
    montoReembolsado: plan.reembolsoPendiente,
    reembolsoPendiente: 0,
  })
  return { ok: true, plan: actualizado, reembolso: plan.reembolsoPendiente }
}

// Al marcar la última sesión como atendida, el plan pasa a Finalizado.
export function actualizarEstadoPlan(planId) {
  const plan = planes.obtener(planId)
  if (plan && plan.estadoPlan === ESTADO_PLAN.ACTIVO && planCompletado(plan, sesionesDe(planId))) {
    planes.actualizar(planId, { estadoPlan: ESTADO_PLAN.FINALIZADO })
  }
}

export function planesDePaciente(correo) {
  const buscado = String(correo).toLowerCase()
  return planes
    .listar()
    .filter((p) => p.pacienteCorreo.toLowerCase() === buscado)
    .map((plan) => ({ ...plan, resumen: resumenSesiones(plan, sesionesDe(plan.id)) }))
}
