import { resumenSesiones } from './planes'
import { ESTADO_CITA } from '../config/reglas'

describe('resumenSesiones', () => {
  // Prueba 22: RN-13
  it('descuenta las sesiones atendidas y devuelve al saldo las canceladas o con inasistencia', () => {
    const plan = { sesionesTotales: 6 }
    const sesiones = [
      { estadoCita: ESTADO_CITA.ATENDIDA },
      { estadoCita: ESTADO_CITA.ATENDIDA },
      { estadoCita: ESTADO_CITA.CANCELADA },
      { estadoCita: ESTADO_CITA.INASISTENCIA },
      { estadoCita: ESTADO_CITA.CONFIRMADA },
    ]

    expect(resumenSesiones(plan, sesiones)).toEqual({ total: 6, atendidas: 2, agendadas: 1, porAgendar: 3 })
  })
})
