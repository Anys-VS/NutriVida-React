import { reservarCita } from './reservas'
import { citas } from '../data/db'
import { ESTADO_CITA, ESTADO_PAGO, METODO_PAGO } from '../config/reglas'
import { crearLocalStorageFalso } from '../test/localStorageFalso'

describe('reservarCita (localStorage simulado y reloj controlado)', () => {
  let almacenamiento

  beforeEach(() => {
    almacenamiento = crearLocalStorageFalso()
    vi.stubGlobal('localStorage', almacenamiento)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-10T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  // Prueba 2: RN-04
  it('pago en clínica con 72 h de anticipación queda Por confirmar y se guarda', () => {
    const resultado = reservarCita({
      pacienteCorreo: 'paciente@gmail.com',
      codigoServicio: 'CN001',
      fechaHora: '2026-11-13T10:00:00',
      metodoPago: METODO_PAGO.CLINICA,
    })

    expect(resultado.ok).toBe(true)
    expect(resultado.cita).toMatchObject({
      estadoCita: ESTADO_CITA.POR_CONFIRMAR,
      estadoPago: ESTADO_PAGO.PENDIENTE,
      montoPagado: 0,
    })
    expect(almacenamiento.setItem).toHaveBeenCalledTimes(1)
    expect(citas.listar()).toHaveLength(1)
  })

  // Prueba 3: RN-08
  it('con 1 h de anticipación rechaza la reserva y no guarda nada', () => {
    const resultado = reservarCita({
      pacienteCorreo: 'paciente@gmail.com',
      codigoServicio: 'CN001',
      fechaHora: '2026-11-10T11:00:00',
      metodoPago: METODO_PAGO.ONLINE,
    })

    expect(resultado.ok).toBe(false)
    expect(resultado.motivo).toMatch(/anticipación/)
    expect(almacenamiento.setItem).not.toHaveBeenCalled()
  })
})
