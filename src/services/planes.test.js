import { contratarPlan, agendarSesion, cancelarPlan, registrarReembolsoPlan } from './planes'
import { marcarAtendida } from './reservas'
import { citas, planes, servicios } from '../data/db'
import { ESTADO_CITA, ESTADO_PAGO, ESTADO_PLAN } from '../config/reglas'
import { crearLocalStorageFalso } from '../test/localStorageFalso'

describe('planes (localStorage simulado y reloj controlado)', () => {
  const contratar = (extra) => contratarPlan({
    pacienteCorreo: 'paciente@gmail.com',
    codigoServicio: 'PL001', // 2 sesiones, $65.000
    fechaHora: '2026-11-13T10:00:00',
    ...extra,
  })

  beforeEach(() => {
    vi.stubGlobal('localStorage', crearLocalStorageFalso())
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-10T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  // Prueba 23: RN-13
  it('contratar un plan crea el contrato pagado y su primera sesión; sin sesiones definidas no se puede', () => {
    const resultado = contratar()

    expect(resultado.ok).toBe(true)
    expect(resultado.plan).toMatchObject({
      sesionesTotales: 2, montoPagado: 65000, estadoPlan: ESTADO_PLAN.ACTIVO, estadoPago: ESTADO_PAGO.PAGADO,
    })
    expect(resultado.cita).toMatchObject({ planId: resultado.plan.id, estadoCita: ESTADO_CITA.CONFIRMADA, precio: 0 })

    // Un plan creado desde el admin sin cantidad de sesiones no se puede contratar.
    servicios.crear({ codigo: 'PL099', tipo: 'Plan especializado', nombre: 'Plan sin sesiones', precio: 50000, descuento: 0 })
    expect(contratar({ codigoServicio: 'PL099' })).toMatchObject({ ok: false, motivo: expect.stringMatching(/sesiones definidas/) })
  })

  // Prueba 24: RN-13
  it('permite agendar sesiones solo mientras haya saldo', () => {
    const { plan } = contratar()

    expect(agendarSesion({ planId: plan.id, fechaHora: '2026-11-17T10:00:00' }).ok).toBe(true)
    expect(agendarSesion({ planId: plan.id, fechaHora: '2026-11-24T10:00:00' })).toMatchObject({
      ok: false, motivo: 'Ya agendaste todas las sesiones de tu plan.',
    })
  })

  // Prueba 25: RN-15, sin sesiones atendidas
  it('cancelar un plan sin sesiones atendidas deja pendiente el 80% y libera las sesiones', () => {
    const { plan } = contratar()
    agendarSesion({ planId: plan.id, fechaHora: '2026-11-17T10:00:00' })

    expect(cancelarPlan(plan.id)).toMatchObject({ ok: true, reembolsoPendiente: 52000 })
    expect(citas.listar().every((c) => c.estadoCita === ESTADO_CITA.CANCELADA)).toBe(true)

    expect(registrarReembolsoPlan(plan.id)).toMatchObject({ ok: true, reembolso: 52000 })
    expect(planes.obtener(plan.id)).toMatchObject({
      estadoPlan: ESTADO_PLAN.CANCELADO, estadoPago: ESTADO_PAGO.REEMBOLSADO_PARCIAL, montoReembolsado: 52000, reembolsoPendiente: 0,
    })
  })

  // Prueba 26: RN-15, con una sesión atendida
  it('cancelar un plan con una sesión atendida no genera reembolso', () => {
    const { plan, cita } = contratar()
    marcarAtendida(cita.id)

    expect(cancelarPlan(plan.id)).toMatchObject({ ok: true, reembolsoPendiente: 0 })
    expect(planes.obtener(plan.id)).toMatchObject({ estadoPlan: ESTADO_PLAN.CANCELADO, estadoPago: ESTADO_PAGO.PAGADO })
    expect(registrarReembolsoPlan(plan.id).ok).toBe(false)
  })
})
