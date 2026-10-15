import { ESTADO_CITA, ESTADO_PAGO } from '../config/reglas'
import { reembolsoCita } from './reembolsos'

const ACTIVAS = [ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA]

function diaLocal(fecha) {
  const f = new Date(fecha)
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
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
    Object.values(ESTADO_CITA).map((estado) => [estado, citas.filter((c) => c.estadoCita === estado).length]),
  )
  return {
    totalServicios,
    totalUsuarios,
    totalCitas: citas.length,
    porEstado,
    citasHoy: citas.filter((c) => ACTIVAS.includes(c.estadoCita) && diaLocal(c.fechaHora) === hoy).length,
    ingresos:
      citas.reduce((total, c) => total + (c.estadoPago === ESTADO_PAGO.PAGADO ? c.montoPagado : 0), 0) +
      planes.reduce((total, plan) => total + ingresoDePlan(plan), 0),
    reembolsosPendientes: citas.filter(requiereReembolso).length + planes.filter((p) => p.reembolsoPendiente > 0).length,
  }
}
