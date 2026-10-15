import { evaluarReserva, horariosDisponibles } from './citas'
import { ESTADO_CITA, ESTADO_PAGO, METODO_PAGO } from '../config/reglas'

describe('evaluarReserva', () => {
  const ahora = new Date('2026-11-10T10:00:00')

  // Prueba 1: RN-03
  it('con pago online la cita nace Confirmada y el pago Pagado', () => {
    const resultado = evaluarReserva({
      fechaHora: '2026-11-13T10:00:00',
      metodoPago: METODO_PAGO.ONLINE,
      ahora,
    })

    expect(resultado).toMatchObject({
      ok: true,
      estadoCita: ESTADO_CITA.CONFIRMADA,
      estadoPago: ESTADO_PAGO.PAGADO,
      limiteConfirmacion: null,
    })
  })
})

describe('horariosDisponibles', () => {
  // Prueba 21: RN-08 y RN-14
  it('marca como no disponibles los horarios muy próximos y los ya ocupados', () => {
    const ahora = new Date('2026-11-10T09:00:00')
    const servicio = { codigo: 'CN001' }
    const ocupada = { nutricionista: 'Carolina Fuentes', estadoCita: ESTADO_CITA.CONFIRMADA, fechaHora: new Date('2026-11-10T14:00:00').toISOString() }

    const horarios = horariosDisponibles({
      servicio, nutricionista: 'Carolina Fuentes', fecha: '2026-11-10', citas: [ocupada], ahora,
    })
    const estado = (hora) => horarios.find((h) => h.hora === hora)

    expect(estado('10:00')).toMatchObject({ disponible: false, motivo: 'Muy próximo' }) // falta 1 h
    expect(estado('14:00')).toMatchObject({ disponible: false, motivo: 'Ocupado' })
    expect(estado('15:00')).toMatchObject({ disponible: true })
  })
})
