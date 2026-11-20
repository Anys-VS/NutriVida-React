import { AxiosError } from 'axios'
import { cliente } from './cliente'
import { listarCategorias, listarServicios } from '../services/catalogo'
import { horariosDelDia, reservarAtencion } from '../services/agenda'
import { cargarCarrito, pagar } from '../services/miCarrito'
import { cargarMisCitas } from '../services/misCitas'
import { crearLocalStorageFalso } from '../test/localStorageFalso'

// Modo 'api' del flujo de reserva: catálogo, horarios, carrito, pago y planes, con respuestas que tienen
// exactamente la forma que devuelve el backend (ms-catalogo, ms-citas y ms-ordenes).
vi.mock('../config/api', async (original) => ({ ...(await original()), usaApi: () => true }))

// Servidor simulado: responde según "MÉTODO /ruta" y guarda cada petición para revisarla.
function servidorFalso(rutas) {
  const peticiones = []
  cliente.defaults.adapter = async (config) => {
    const clave = `${config.method.toUpperCase()} ${config.url}`
    peticiones.push({ clave, cuerpo: config.data ? JSON.parse(config.data) : null, params: config.params })
    const { status = 200, data } = rutas[clave] ?? { status: 404, data: { status: 404, mensaje: 'No existe.' } }
    const respuesta = { status, data, statusText: '', headers: {}, config }
    if (status >= 400) throw new AxiosError('error', 'ERR_BAD_RESPONSE', config, null, respuesta)
    return respuesta
  }
  return peticiones
}

const servicioBackend = (codigo, tipo, extra = {}) => ({
  codigo, nombre: `Servicio ${codigo}`, categoriaId: 1, tipo, duracion: '30 min', modalidad: 'Presencial',
  profesional: 'Nutricionista', precio: 35000, descuento: 0, precioFinal: 35000, sesiones: null, cupos: null,
  descripcion: '', activo: true, ...extra,
})
const SERVICIOS = [servicioBackend('CN001', 'Consulta'), servicioBackend('PL001', 'Plan especializado', { sesiones: 2, precio: 65000, precioFinal: 65000 })]
const TARJETA = { titular: 'Javiera Soto', numero: '4111111111111111', vencimiento: '12/30', cvv: '123' }

describe('Integración del flujo de reserva con el backend (modo api)', () => {
  const adaptadorOriginal = cliente.defaults.adapter
  beforeEach(() => vi.stubGlobal('localStorage', crearLocalStorageFalso()))
  afterEach(() => {
    cliente.defaults.adapter = adaptadorOriginal
    vi.unstubAllGlobals()
  })

  // Prueba 68: el catálogo de ms-catalogo llega con la forma del frontend (categorías con slug y título)
  it('carga servicios y categorías desde ms-catalogo', async () => {
    const peticiones = servidorFalso({
      'GET /servicios': { data: SERVICIOS },
      'GET /categorias': { data: [{ id: 2, nombre: 'Plan especializado', descripcion: 'Programas de varias sesiones' }] },
    })

    const [servicios, categorias] = await Promise.all([listarServicios(), listarCategorias()])

    expect(servicios[1]).toMatchObject({ codigo: 'PL001', tipo: 'Plan especializado', sesiones: 2, precio: 65000 })
    expect(categorias[0]).toMatchObject({ slug: 'plan', tipo: 'Plan especializado', titulo: 'Planes especializados' })
    expect(peticiones.find((peticion) => peticion.clave === 'GET /servicios').params).toEqual({ soloActivos: true })
  })

  // Prueba 69: los horarios del día los calcula ms-citas (jornada, ocupados y muy próximos)
  it('pide la disponibilidad del día a ms-citas', async () => {
    const peticiones = servidorFalso({
      'GET /citas/disponibilidad': { data: [{ hora: '09:00', disponible: true, motivo: '' }, { hora: '10:00', disponible: false, motivo: 'Ocupado' }] },
    })

    const horarios = await horariosDelDia({ servicio: { codigo: 'CN001' }, nutricionista: 'Carolina Fuentes', fecha: '2026-11-25' })

    expect(horarios).toEqual([{ hora: '09:00', disponible: true, motivo: '' }, { hora: '10:00', disponible: false, motivo: 'Ocupado' }])
    expect(peticiones[0].params).toEqual({ fecha: '2026-11-25', nutricionista: 'Carolina Fuentes', codigoServicio: 'CN001' })
  })

  // Prueba 70: el carrito junta los ítems de ms-ordenes (con su tipo del catálogo) y las citas con pago pendiente de ms-citas
  it('arma el carrito con ítems por reservar y citas con pago pendiente', async () => {
    servidorFalso({
      'GET /carrito': { data: { items: [{ id: 4, codigoServicio: 'PL001', nombreServicio: 'Plan', precio: 65000, fechaHora: null, nutricionista: null, motivo: 'Bajar de peso' }], cantidad: 1, total: 65000, maximo: 10 } },
      'GET /citas': { data: [
        { id: 7, codigoServicio: 'CN001', nombreServicio: 'Consulta', fechaHora: '2026-11-25T10:00:00', estadoCita: 'POR_CONFIRMAR', estadoPago: 'PENDIENTE', metodoPago: 'CLINICA', precio: 35000 },
        { id: 8, codigoServicio: 'CN001', nombreServicio: 'Consulta', fechaHora: '2026-11-26T10:00:00', estadoCita: 'CONFIRMADA', estadoPago: 'PAGADO', metodoPago: 'ONLINE', precio: 35000 },
      ] },
      'GET /servicios': { data: SERVICIOS },
    })

    const { items, pendientes } = await cargarCarrito('paciente@gmail.com')

    expect(items[0]).toMatchObject({ id: '4', tipo: 'Plan especializado', sesiones: 2, fechaHora: null, nutricionista: '' })
    expect(pendientes.map((cita) => cita.id)).toEqual(['7']) // la pagada no aparece
  })

  // Prueba 71: el pago va a /carrito/checkout con la tarjeta, los ítems y las citas; la orden trae las citas creadas
  it('paga el carrito en ms-ordenes y recibe las citas agendadas', async () => {
    const peticiones = servidorFalso({
      'POST /carrito/checkout': { status: 201, data: {
        id: 15, correoPaciente: 'paciente@gmail.com', fecha: '2026-11-17T12:00:00', estado: 'PAGADA', total: 100000, tarjeta: '**** 1111',
        detalles: [
          { codigoServicio: 'PL001', nombreServicio: 'Plan', precio: 65000, fechaHora: null, nutricionista: null, citaId: null, planId: 9 },
          { codigoServicio: 'CN001', nombreServicio: 'Consulta', precio: 35000, fechaHora: '2026-11-25T10:00:00', nutricionista: 'Carolina Fuentes', citaId: 7, planId: null },
        ],
      } },
    })

    const resultado = await pagar({ correo: 'paciente@gmail.com', itemIds: ['4'], citaIds: ['7'], correoConfirmacion: 'paciente@gmail.com', tarjeta: TARJETA })

    expect(peticiones[0].cuerpo).toEqual({ ...TARJETA, itemIds: [4], citaIds: [7], correoConfirmacion: 'paciente@gmail.com' })
    expect(resultado.ok).toBe(true)
    expect(resultado.orden.detalle.map((linea) => [linea.planId, linea.citaId])).toEqual([['9', null], [null, '7']])
  })

  // Prueba 72: una tarjeta rechazada (402) se informa como rechazo, para mostrar la página de pago rechazado
  it('marca como rechazado el pago que el banco no aprueba', async () => {
    servidorFalso({ 'POST /carrito/checkout': { status: 402, data: { status: 402, mensaje: 'El banco rechazó la tarjeta. No se realizó ningún cobro.' } } })

    const resultado = await pagar({ correo: 'paciente@gmail.com', itemIds: ['4'], citaIds: [], correoConfirmacion: 'paciente@gmail.com', tarjeta: TARJETA })

    expect(resultado).toMatchObject({ ok: false, rechazado: true, motivo: 'El banco rechazó la tarjeta. No se realizó ningún cobro.' })
  })

  // Prueba 73: "reservar y pagar solo esta" pasa por el carrito; si la agenda la rechaza, se quita del carrito
  it('quita del carrito la atención que no se pudo pagar', async () => {
    const peticiones = servidorFalso({
      'POST /carrito/items': { status: 201, data: { id: 21, codigoServicio: 'CN001', fechaHora: '2026-11-25T10:00:00' } },
      'POST /carrito/checkout': { status: 409, data: { status: 409, mensaje: 'No se realizó ningún cobro: el horario ya no está disponible.' } },
      'DELETE /carrito/items/21': { status: 204 },
    })

    const resultado = await reservarAtencion({
      pacienteCorreo: 'paciente@gmail.com', correoConfirmacion: 'paciente@gmail.com', servicio: { codigo: 'CN001', tipo: 'Consulta' },
      nutricionista: 'Carolina Fuentes', fechaHora: '2026-11-25T10:00:00', motivo: 'Control', metodoPago: 'Online', tarjeta: TARJETA,
    })

    expect(resultado).toMatchObject({ ok: false, rechazado: false })
    expect(peticiones.map((peticion) => peticion.clave)).toEqual(['POST /carrito/items', 'POST /carrito/checkout', 'DELETE /carrito/items/21'])
  })

  // Prueba 74: Mis citas muestra los planes de ms-citas con su saldo de sesiones
  it('carga los planes con su saldo de sesiones', async () => {
    servidorFalso({
      'GET /citas': { data: [] },
      'GET /ordenes': { data: [] },
      'GET /planes': { data: [{ id: 9, pacienteCorreo: 'paciente@gmail.com', codigoServicio: 'PL001', nombre: 'Plan pérdida de peso', sesionesTotales: 2, montoPagado: 65000, estadoPlan: 'ACTIVO', atendidas: 1, agendadas: 0, porAgendar: 1 }] },
    })

    const { planes } = await cargarMisCitas('paciente@gmail.com')

    expect(planes[0]).toMatchObject({ id: '9', estadoPlan: 'Activo', montoPagado: 65000, resumen: { total: 2, atendidas: 1, agendadas: 0, porAgendar: 1 } })
  })
})
