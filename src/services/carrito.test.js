import {
  agregarAlCarrito, citasPorPagar, editarItemCarrito, itemsDelCarrito, pagarCarrito, pagarCitasPendientes, quitarDelCarrito,
} from './carrito'
import { cancelarCita, reservarCita } from './reservas'
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
    expect(itemsDelCarrito(correo).map((item) => item.codigoServicio)).toEqual(['PL001'])
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
    expect(citas.listar().every((cita) => cita.estadoCita === ESTADO_CITA.CONFIRMADA && cita.ordenId === resultado.orden.id)).toBe(true)
    expect(citas.listar().every((cita) => cita.nutricionista)).toBe(true) // sin preferencia, la clínica asigna
    expect(itemsDelCarrito(correo).map((item) => item.codigoServicio)).toEqual(['PL001'])
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
    const primera = reservarCita({ pacienteCorreo: correo, codigoServicio: 'CN002', fechaHora: '2026-11-13T10:00:00', metodoPago: METODO_PAGO.CLINICA }).cita
    const segunda = reservarCita({ pacienteCorreo: correo, codigoServicio: 'EV002', fechaHora: '2026-11-16T09:00:00', metodoPago: METODO_PAGO.CLINICA }).cita

    const resultado = pagarCitasPendientes({ pacienteCorreo: correo, ids: [primera.id, segunda.id] })

    expect(resultado).toMatchObject({ ok: true, orden: { total: 37000 } })
    expect(citas.listar().map((cita) => cita.estadoPago)).toEqual([ESTADO_PAGO.PAGADO, ESTADO_PAGO.PAGADO])
    expect(pagarCitasPendientes({ pacienteCorreo: correo, ids: [primera.id] }).ok).toBe(false) // ya pagada
  })

  // Prueba 58: editar el horario de un ítem desde el carrito, con las mismas reglas que al agregarlo
  it('edita el horario de un ítem y rechaza horarios muy próximos o que chocan', () => {
    const consulta = agregar().item
    const otra = agregar({ codigoServicio: 'EV002', fechaHora: '2026-11-16T09:00:00' }).item

    const editar = (fechaHora, nutricionista = '') => editarItemCarrito({ pacienteCorreo: correo, id: consulta.id, nutricionista, fechaHora })
    expect(editar('2026-11-10T11:00:00')).toMatchObject({ ok: false }) // a 1 h: menos de 2 h de anticipación
    expect(editar(otra.fechaHora).motivo).toMatch('otra atención a esa misma hora')
    expect(editar(consulta.fechaHora).motivo).toMatch('distinto al actual')

    const resultado = editar('2026-11-12T15:00:00', 'Felipe Araya')
    expect(resultado.ok).toBe(true)
    expect(itemsDelCarrito(correo).find((item) => item.id === consulta.id))
      .toMatchObject({ nutricionista: 'Felipe Araya', fechaHora: new Date('2026-11-12T15:00:00').toISOString() })
  })

  // Prueba 59: una cita ya agendada (pago en clínica) se paga desde el carrito junto con un ítem nuevo
  it('paga en una sola orden un ítem nuevo y una cita agendada con pago pendiente', () => {
    const item = agregar().item
    const agendada = reservarCita({ pacienteCorreo: correo, codigoServicio: 'EV002', fechaHora: '2026-11-16T09:00:00', metodoPago: METODO_PAGO.CLINICA }).cita
    expect(citasPorPagar(correo).map((cita) => cita.id)).toEqual([agendada.id])

    const resultado = pagarCarrito({ pacienteCorreo: correo, ids: [item.id], citaIds: [agendada.id] })

    expect(resultado.ok).toBe(true)
    expect(resultado.orden.detalle).toHaveLength(2)
    expect(resultado.orden.total).toBe(item.precio + agendada.precio)
    expect(citas.obtener(agendada.id)).toMatchObject({ estadoPago: ESTADO_PAGO.PAGADO, ordenId: resultado.orden.id })
    expect(citasPorPagar(correo)).toHaveLength(0)
    expect(itemsDelCarrito(correo)).toHaveLength(0)
  })

  // Prueba 60: una cita cancelada mientras estaba en el carrito ya no se cobra
  it('no cobra una cita que se canceló antes de pagar', () => {
    const agendada = reservarCita({ pacienteCorreo: correo, codigoServicio: 'EV002', fechaHora: '2026-11-16T09:00:00', metodoPago: METODO_PAGO.CLINICA }).cita
    cancelarCita(agendada.id)

    expect(pagarCarrito({ pacienteCorreo: correo, ids: [], citaIds: [agendada.id] })).toMatchObject({ ok: false })
    expect(ordenes.listar()).toHaveLength(0)
  })

  // Prueba 62: un plan entra al carrito sin horario (una consulta no) y se paga junto con lo demás
  it('agrega un plan sin horario, rechaza una consulta sin horario y paga ambos ítems en una orden', () => {
    expect(agregar({ fechaHora: null })).toMatchObject({ ok: false }) // CN002 es una consulta: necesita horario
    const plan = agregarAlCarrito({ pacienteCorreo: correo, codigoServicio: 'PL001', motivo: 'Bajar de peso' }).item
    const consulta = agregar().item
    expect(plan.fechaHora).toBeNull()
    expect(itemsDelCarrito(correo).map((item) => item.id)).toEqual([consulta.id, plan.id]) // sin horario, al final

    const resultado = pagarCarrito({ pacienteCorreo: correo, ids: [plan.id, consulta.id] })

    expect(resultado.ok).toBe(true)
    expect(resultado.orden.detalle.find((linea) => linea.planId)).toMatchObject({ fechaHora: null, citaId: null })
    expect(planes.listar()).toHaveLength(1)
    expect(citas.listar()).toHaveLength(1) // solo la consulta; el plan aún no tiene sesiones
  })
})

