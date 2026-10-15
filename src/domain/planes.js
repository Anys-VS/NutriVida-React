import { ESTADO_CITA } from '../config/reglas'

const ACTIVAS = [ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA]

// RN-13: una sesión Atendida se descuenta del saldo; una Cancelada o con Inasistencia vuelve a él.
export function resumenSesiones(plan, sesiones) {
  const atendidas = sesiones.filter((s) => s.estadoCita === ESTADO_CITA.ATENDIDA).length
  const agendadas = sesiones.filter((s) => ACTIVAS.includes(s.estadoCita)).length
  return {
    total: plan.sesionesTotales,
    atendidas,
    agendadas,
    porAgendar: Math.max(0, plan.sesionesTotales - atendidas - agendadas),
  }
}

export function planCompletado(plan, sesiones) {
  return resumenSesiones(plan, sesiones).atendidas >= plan.sesionesTotales
}
