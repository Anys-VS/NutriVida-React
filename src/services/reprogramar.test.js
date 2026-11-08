import { reprogramarCita, reservarCita } from './reservas'
import { ESTADO_CITA, ESTADO_PAGO, METODO_PAGO } from '../config/reglas'
import { crearLocalStorageFalso } from '../test/localStorageFalso'

describe('reprogramar una cita', () => {
  const reservar = (extra) => reservarCita({
    pacienteCorreo: 'paciente@gmail.com', codigoServicio: 'CN002', nutricionista: 'Carolina Fuentes',
    fechaHora: '2026-11-13T10:00:00', metodoPago: METODO_PAGO.ONLINE, motivo: 'Control', ...extra,
  }).cita

  beforeEach(() => {
    vi.stubGlobal('localStorage', crearLocalStorageFalso())
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-10T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  // Prueba 36: reprogramar mantiene el pago y valida el nuevo horario
  it('cambia la fecha manteniendo el pago, y rechaza horarios ocupados o fuera de jornada', () => {
    const cita = reservar()
    reservar({ pacienteCorreo: 'otro@gmail.com', fechaHora: '2026-11-16T10:00:00' })

    expect(reprogramarCita(cita.id, { fechaHora: '2026-11-16T10:00:00', nutricionista: 'Carolina Fuentes' }))
      .toMatchObject({ ok: false, motivo: 'Ese horario ya no está disponible.' })
    expect(reprogramarCita(cita.id, { fechaHora: '2026-11-17T10:00:00', nutricionista: 'Carolina Fuentes' }).ok)
      .toBe(false) // martes: Carolina no atiende

    const resultado = reprogramarCita(cita.id, { fechaHora: '2026-11-16T11:00:00', nutricionista: 'Carolina Fuentes' })
    expect(resultado.ok).toBe(true)
    expect(resultado.cita).toMatchObject({
      estadoCita: ESTADO_CITA.CONFIRMADA, estadoPago: ESTADO_PAGO.PAGADO, reprogramaciones: 1, motivo: 'Control',
    })
  })

  // Prueba 37: RN-09 y RN-02 al reprogramar
  it('no reprograma con menos de 2 h y recalcula el plazo de una cita pagadera en clínica', () => {
    const cercana = reservar({ fechaHora: '2026-11-10T11:00:00', metodoPago: METODO_PAGO.CLINICA })
    expect(cercana).toBeUndefined() // ni siquiera se puede reservar con 1 h

    const enClinica = reservar({ metodoPago: METODO_PAGO.CLINICA, fechaHora: '2026-11-11T09:00:00' })
    expect(enClinica.estadoCita).toBe(ESTADO_CITA.CONFIRMADA) // menos de 24 h: RN-07

    const movida = reprogramarCita(enClinica.id, { fechaHora: '2026-11-13T09:00:00', nutricionista: 'Carolina Fuentes' })
    expect(movida.cita).toMatchObject({ estadoCita: ESTADO_CITA.POR_CONFIRMAR, estadoPago: ESTADO_PAGO.PENDIENTE })

    vi.setSystemTime(new Date('2026-11-13T08:00:00'))
    expect(reprogramarCita(enClinica.id, { fechaHora: '2026-11-16T09:00:00', nutricionista: '' }))
      .toMatchObject({ ok: false, motivo: expect.stringMatching(/2 h/) })
  })
})
