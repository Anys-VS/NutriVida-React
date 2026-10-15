import { REGLAS, ESTADO_CITA, ESTADO_PAGO, METODO_PAGO } from '../config/reglas'

// RN-11: cita individual pagada online que termina Cancelada o en Inasistencia.
export function reembolsoCita({ metodoPago, estadoPago, estadoCita, montoPagado }) {
  const terminoSinAtencion = [ESTADO_CITA.CANCELADA, ESTADO_CITA.INASISTENCIA].includes(estadoCita)
  const pagadaOnline = metodoPago === METODO_PAGO.ONLINE && estadoPago === ESTADO_PAGO.PAGADO
  return pagadaOnline && terminoSinAtencion ? montoPagado : 0
}

// RN-15: 80% del monto pagado si ninguna sesión fue Atendida; si no, nada.
export function reembolsoPlan({ montoPagado, sesiones = [] }) {
  const hayAtendida = sesiones.some((sesion) => sesion.estadoCita === ESTADO_CITA.ATENDIDA)
  return hayAtendida ? 0 : Math.round(montoPagado * REGLAS.PORCENTAJE_REEMBOLSO_PLAN)
}
