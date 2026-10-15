import { reembolsoPlan } from './reembolsos'
import { ESTADO_CITA } from '../config/reglas'

describe('reembolsoPlan', () => {
  // Prueba 4: RN-15, sin sesiones atendidas
  it('devuelve el 80% del monto pagado si ninguna sesión fue atendida', () => {
    const sesiones = [{ estadoCita: ESTADO_CITA.CONFIRMADA }, { estadoCita: ESTADO_CITA.CANCELADA }]

    expect(reembolsoPlan({ montoPagado: 65000, sesiones })).toBe(52000)
  })

  // Prueba 5: RN-15, con una sesión atendida
  it('no devuelve nada si al menos una sesión fue atendida', () => {
    const sesiones = [{ estadoCita: ESTADO_CITA.ATENDIDA }, { estadoCita: ESTADO_CITA.CONFIRMADA }]

    expect(reembolsoPlan({ montoPagado: 170000, sesiones })).toBe(0)
  })
})
