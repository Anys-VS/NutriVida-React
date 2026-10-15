import {
  reservarCita, confirmarAsistencia, cancelarCitasVencidas, cancelarCita, registrarReembolso,
} from './reservas'
import { citas } from '../data/db'
import { ESTADO_CITA, ESTADO_PAGO, METODO_PAGO } from '../config/reglas'
import { crearLocalStorageFalso } from '../test/localStorageFalso'

// Reglas posteriores a la reserva, con localStorage simulado y reloj controlado.
describe('acciones sobre una cita', () => {
  const reservar = (extra) => reservarCita({
    pacienteCorreo: 'paciente@gmail.com',
    codigoServicio: 'CN001',
    fechaHora: '2026-11-13T10:00:00',
    metodoPago: METODO_PAGO.CLINICA,
    ...extra,
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

  // Prueba 11: RN-05
  it('confirmar asistencia pasa una cita Por confirmar a Confirmada', () => {
    const cita = reservar()
    expect(cita.estadoCita).toBe(ESTADO_CITA.POR_CONFIRMAR)

    expect(confirmarAsistencia(cita.id).ok).toBe(true)
    expect(citas.obtener(cita.id)).toMatchObject({ estadoCita: ESTADO_CITA.CONFIRMADA, limiteConfirmacion: null })
  })

  // Prueba 12: RN-06
  it('cancela solo las citas Por confirmar cuyo plazo venció', () => {
    const porConfirmar = reservar()
    const online = reservar({ codigoServicio: 'CN002', metodoPago: METODO_PAGO.ONLINE })

    vi.setSystemTime(new Date('2026-11-12T11:00:00')) // pasó el límite (24 h antes de la cita)

    expect(cancelarCitasVencidas()).toBe(1)
    expect(citas.obtener(porConfirmar.id).estadoCita).toBe(ESTADO_CITA.CANCELADA)
    expect(citas.obtener(online.id).estadoCita).toBe(ESTADO_CITA.CONFIRMADA)
  })

  // Prueba 13: RN-09
  it('el paciente no puede cancelar con menos de 2 h de anticipación', () => {
    const cita = reservar({ metodoPago: METODO_PAGO.ONLINE })

    vi.setSystemTime(new Date('2026-11-13T09:00:00')) // falta 1 h

    const resultado = cancelarCita(cita.id)
    expect(resultado.ok).toBe(false)
    expect(resultado.motivo).toMatch(/2 h/)
    expect(citas.obtener(cita.id).estadoCita).toBe(ESTADO_CITA.CONFIRMADA)
  })

  // Prueba 14: RN-09 y RN-11
  it('al cancelar una cita pagada online el reembolso queda pendiente hasta que el admin lo registra', () => {
    const cita = reservar({ metodoPago: METODO_PAGO.ONLINE })

    const cancelacion = cancelarCita(cita.id)
    expect(cancelacion).toMatchObject({ ok: true, reembolsoPendiente: 35000 })
    expect(citas.obtener(cita.id)).toMatchObject({ estadoCita: ESTADO_CITA.CANCELADA, estadoPago: ESTADO_PAGO.PAGADO })

    expect(registrarReembolso(cita.id)).toMatchObject({ ok: true, reembolso: 35000 })
    expect(citas.obtener(cita.id)).toMatchObject({ estadoPago: ESTADO_PAGO.REEMBOLSADO_TOTAL, montoReembolsado: 35000 })
  })
})
