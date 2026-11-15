import { ESTADO_CITA, ESTADO_PAGO } from '../config/reglas'
import { reembolsoCita } from './reembolsos'

const ACTIVAS = [ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA]

function diaLocal(fecha) {
  const momento = new Date(fecha)
  return `${momento.getFullYear()}-${String(momento.getMonth() + 1).padStart(2, '0')}-${String(momento.getDate()).padStart(2, '0')}`
}

// Citas pagadas online que terminaron Canceladas o en Inasistencia y esperan su reembolso (RN-11).
export function requiereReembolso(cita) {
  return cita.estadoPago === ESTADO_PAGO.PAGADO && reembolsoCita(cita) > 0
}

// Lo que la clínica retiene de un plan: todo si está pagado, o lo no devuelto si hubo reembolso parcial.
export function ingresoDePlan(plan) {
  if (plan.estadoPago === ESTADO_PAGO.PAGADO) return plan.montoPagado
  if (plan.estadoPago === ESTADO_PAGO.REEMBOLSADO_PARCIAL) return plan.montoPagado - (plan.montoReembolsado || 0)
  return 0
}

export function calcularMetricas({ citas, planes = [], totalServicios, totalUsuarios, ahora = new Date() }) {
  const hoy = diaLocal(ahora)
  const porEstado = Object.fromEntries(
    Object.values(ESTADO_CITA).map((estado) => [estado, citas.filter((cita) => cita.estadoCita === estado).length]),
  )
  return {
    totalServicios,
    totalUsuarios,
    totalCitas: citas.length,
    porEstado,
    citasHoy: citas.filter((cita) => ACTIVAS.includes(cita.estadoCita) && diaLocal(cita.fechaHora) === hoy).length,
    ingresos:
      citas.reduce((total, cita) => total + (cita.estadoPago === ESTADO_PAGO.PAGADO ? cita.montoPagado : 0), 0) +
      planes.reduce((total, plan) => total + ingresoDePlan(plan), 0),
    reembolsosPendientes: citas.filter(requiereReembolso).length + planes.filter((plan) => plan.reembolsoPendiente > 0).length,
  }
}
