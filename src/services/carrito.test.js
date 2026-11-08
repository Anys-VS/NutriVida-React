import { agregarAlCarrito, itemsDelCarrito, pagarCarrito, pagarCitasPendientes, quitarDelCarrito } from './carrito'
import { reservarCita } from './reservas'
import { citas, ordenes, planes } from '../data/db'
import { ESTADO_CITA, ESTADO_PAGO, METODO_PAGO } from '../config/reglas'
import { crearLocalStorageFalso } from '../test/localStorageFalso'

describe('carrito (localStorage simulado y reloj controlado)', () => {
  const correo = 'paciente@gmail.com'
  const agregar = (extra) => agregarAlCarrito({ pacienteCorreo: correo, codigoServicio: 'CN002', fechaHora: '2026-11-13T10:00:00', motivo: 'Control', ...extra })

  beforeEach(() => {
    vi.stubGlobal('localStorage', crearLocalStorageFalso())
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-10T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  // Prueba 31: agregar y quitar, sin choques de horario para el mismo paciente
  it('agrega citas y planes, rechaza dos atenciones a la misma hora y permite quitar', () => {
    const cita = agregar()
    const plan = agregar({ codigoServicio: 'PL001', fechaHora: '2026-11-16T09:00:00' })
    expect(cita.ok && plan.ok).toBe(true)
    expect(agregar({ codigoServicio: 'EV001' })).toMatchObject({ ok: false, motivo: expect.stringMatching(/misma hora/) })
    expect(agregar({ fechaHora: '2026-11-10T11:00:00' })).toMatchObject({ ok: false, motivo: expect.stringMatching(/anticipación/) })

    expect(quitarDelCarrito(correo, cita.item.id).ok).toBe(true)
    expect(itemsDelCarrito(correo).map((i) => i.codigoServicio)).toEqual(['PL001'])
  })

  // Prueba 32: pagar solo lo seleccionado
  it('paga solo los ítems seleccionados en una orden y deja el resto en el carrito', () => {
    const consulta = agregar().item // $25.000
    agregar({ codigoServicio: 'PL001', fechaHora: '2026-11-16T09:00:00' }) // $65.000, queda en el carrito
    const evaluacion = agregar({ codigoServicio: 'EV002', fechaHora: '2026-11-13T11:00:00' }).item // $12.000

    const resultado = pagarCarrito({ pacienteCorreo: correo, ids: [consulta.id, evaluacion.id] })

    expect(resultado.ok).toBe(true)
    expect(resultado.orden).toMatchObject({ total: 37000, estadoPago: ESTADO_PAGO.PAGADO })
    expect(resultado.orden.detalle).toHaveLength(2)
    expect(citas.listar().every((c) => c.estadoCita === ESTADO_CITA.CONFIRMADA && c.ordenId === resultado.orden.id)).toBe(true)
    expect(citas.listar().every((c) => c.nutricionista)).toBe(true) // sin preferencia, la clínica asigna
    expect(itemsDelCarrito(correo).map((i) => i.codigoServicio)).toEqual(['PL001'])
  })

  // Prueba 33: pagar todo, incluido un plan
  it('pagar todo contrata el plan con su primera sesión y vacía el carrito', () => {
    agregar()
    agregar({ codigoServicio: 'PL001', fechaHora: '2026-11-16T09:00:00' })

    const resultado = pagarCarrito({ pacienteCorreo: correo })

    expect(resultado).toMatchObject({ ok: true, orden: { total: 90000 } })
    expect(planes.listar()).toHaveLength(1)
    expect(citas.listar()).toHaveLength(2)
    expect(itemsDelCarrito(correo)).toEqual([])
  })

  // Prueba 34: todo o nada
  it('si un horario se ocupó mientras estaba en el carrito, no cobra nada', () => {
    const item = agregar({ nutricionista: 'Carolina Fuentes' }).item
    agregar({ codigoServicio: 'EV002', fechaHora: '2026-11-13T11:00:00' })
    // Otro paciente toma la hora de Carolina antes del pago.
    reservarCita({ pacienteCorreo: 'otro@gmail.com', codigoServicio: 'CN002', nutricionista: 'Carolina Fuentes', fechaHora: '2026-11-13T10:00:00', metodoPago: METODO_PAGO.ONLINE })

    const resultado = pagarCarrito({ pacienteCorreo: correo })

    expect(resultado.ok).toBe(false)
    expect(resultado.problemas).toEqual([expect.objectContaining({ id: item.id, motivo: 'Ese horario ya no está disponible.' })])
    expect(ordenes.listar()).toHaveLength(0)
    expect(citas.listar()).toHaveLength(1) // solo la del otro paciente
    expect(itemsDelCarrito(correo)).toHaveLength(2)
  })

  // Prueba 35: pagar juntas varias citas que quedaron con pago en clínica
  it('paga en una sola orden varias citas con pago pendiente', () => {
    const a = reservarCita({ pacienteCorreo: correo, codigoServicio: 'CN002', fechaHora: '2026-11-13T10:00:00', metodoPago: METODO_PAGO.CLINICA }).cita
    const b = reservarCita({ pacienteCorreo: correo, codigoServicio: 'EV002', fechaHora: '2026-11-16T09:00:00', metodoPago: METODO_PAGO.CLINICA }).cita

    const resultado = pagarCitasPendientes({ pacienteCorreo: correo, ids: [a.id, b.id] })

    expect(resultado).toMatchObject({ ok: true, orden: { total: 37000 } })
    expect(citas.listar().map((c) => c.estadoPago)).toEqual([ESTADO_PAGO.PAGADO, ESTADO_PAGO.PAGADO])
    expect(pagarCitasPendientes({ pacienteCorreo: correo, ids: [a.id] }).ok).toBe(false) // ya pagada
  })
})
