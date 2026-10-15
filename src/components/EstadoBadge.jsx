import { ESTADO_CITA, ESTADO_PAGO, ESTADO_PLAN } from '../config/reglas'

const COLORES = {
  [ESTADO_CITA.POR_CONFIRMAR]: 'warning',
  [ESTADO_CITA.CONFIRMADA]: 'success',
  [ESTADO_CITA.ATENDIDA]: 'primary',
  [ESTADO_CITA.CANCELADA]: 'danger',
  [ESTADO_CITA.INASISTENCIA]: 'dark',
  [ESTADO_PLAN.ACTIVO]: 'success',
  [ESTADO_PLAN.FINALIZADO]: 'primary',
  [ESTADO_PLAN.CANCELADO]: 'danger',
  [ESTADO_PAGO.PENDIENTE]: 'warning',
  [ESTADO_PAGO.PAGADO]: 'success',
  [ESTADO_PAGO.REEMBOLSADO_TOTAL]: 'info',
  [ESTADO_PAGO.REEMBOLSADO_PARCIAL]: 'info',
}

function EstadoBadge({ estado }) {
  return <span className={`badge text-bg-${COLORES[estado] ?? 'secondary'}`}>{estado}</span>
}

export default EstadoBadge
