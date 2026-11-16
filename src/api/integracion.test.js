import { AxiosError } from 'axios'
import { cliente } from './cliente'
import { normalizarError } from './errores'
import { codificarBase64Url, sesionDesdeToken } from '../auth/jwt'
import { cancelarMiCita, cargarMisCitas } from '../services/misCitas'
import { cargarMiFicha } from '../services/miProgreso'
import { crearLocalStorageFalso } from '../test/localStorageFalso'

// Estas pruebas simulan el modo 'api': las respuestas tienen exactamente la forma que devuelve el backend.
vi.mock('../config/api', async (original) => ({ ...(await original()), usaApi: () => true }))

function servidorFalso(rutas) {
  cliente.defaults.adapter = async (config) => {
    const { status = 200, data } = rutas[`${config.method.toUpperCase()} ${config.url}`] ?? { status: 404, data: { status: 404, mensaje: 'No existe.' } }
    const respuesta = { status, data, statusText: '', headers: {}, config }
    if (status >= 400) throw new AxiosError('error', 'ERR_BAD_RESPONSE', config, null, respuesta)
    return respuesta
  }
}

const citaBackend = {
  id: 7, pacienteCorreo: 'paciente@gmail.com', codigoServicio: 'CN002', nombreServicio: 'Control nutricional',
  nutricionista: 'Carolina Fuentes', fechaHora: '2026-11-25T10:00:00', metodoPago: 'CLINICA',
  estadoCita: 'POR_CONFIRMAR', estadoPago: 'PENDIENTE', limiteConfirmacion: '2026-11-24T10:00:00',
  precio: 25000, montoPagado: 0, montoReembolsado: 0, reprogramaciones: 0,
}

describe('Integración con el backend (modo api)', () => {
  const adaptadorOriginal = cliente.defaults.adapter
  beforeEach(() => vi.stubGlobal('localStorage', crearLocalStorageFalso()))
  afterEach(() => {
    cliente.defaults.adapter = adaptadorOriginal
    vi.unstubAllGlobals()
  })

  // Prueba 63: el token real de ms-identidad (sub = RUN, rol = PACIENTE) arma la misma sesión que el local
  it('lee la sesión desde el token de ms-identidad', () => {
    const token = `${codificarBase64Url({ alg: 'HS256' })}.${codificarBase64Url({
      sub: '195556660', correo: 'paciente@gmail.com', nombre: 'Javiera', rol: 'PACIENTE', exp: 4102444800,
    })}.firma`

    expect(sesionDesdeToken(token)).toMatchObject({
      run: '195556660', correo: 'paciente@gmail.com', nombre: 'Javiera', tipoUsuario: 'Paciente',
    })
  })

  // Prueba 64: los errores de validación del backend llegan por campo ("campos")
  it('traduce los errores de validación del backend', () => {
    const error = normalizarError({ response: { status: 400, data: { status: 400, mensaje: 'Hay datos inválidos.', campos: { correo: 'Ingresa un correo válido.' } } } })
    expect(error).toMatchObject({ estado: 400, message: 'Hay datos inválidos.', errores: { correo: 'Ingresa un correo válido.' } })
  })

  // Prueba 65: Mis citas toma las citas de ms-citas y las compras de ms-ordenes en el formato de la interfaz
  it('carga Mis citas desde ms-citas y ms-ordenes', async () => {
    servidorFalso({
      'GET /citas': { data: [citaBackend] },
      'GET /ordenes': { data: [{ id: 3, fecha: '2026-11-16T12:00:00', estado: 'PAGADA', total: 35000, detalles: [{ nombreServicio: 'Primera consulta', precio: 35000 }] }] },
    })

    const { citas, ordenes, planes } = await cargarMisCitas('paciente@gmail.com')

    expect(citas[0]).toMatchObject({ id: '7', estadoCita: 'Por confirmar', estadoPago: 'Pendiente', metodoPago: 'Clínica', precio: 25000 })
    expect(ordenes[0]).toMatchObject({ id: '3', total: 35000 })
    expect(ordenes[0].detalle).toHaveLength(1)
    expect(planes).toEqual([])
  })

  // Prueba 66: cancelar usa PATCH /citas/{id}/cancelar y un rechazo del backend llega como motivo legible
  it('cancela una cita en ms-citas e informa el motivo cuando no se puede', async () => {
    servidorFalso({ 'PATCH /citas/7/cancelar': { data: { cita: { ...citaBackend, estadoCita: 'CANCELADA' }, reembolsoPendiente: 0 } } })
    await expect(cancelarMiCita('7')).resolves.toMatchObject({ ok: true, cita: { estadoCita: 'Cancelada' }, reembolsoPendiente: 0 })

    servidorFalso({ 'PATCH /citas/8/cancelar': { status: 409, data: { status: 409, mensaje: 'Con menos de 2 h de anticipación no se puede cancelar en línea.' } } })
    await expect(cancelarMiCita('8')).resolves.toMatchObject({ ok: false, motivo: expect.stringContaining('2 h') })
  })

  // Prueba 67: Mi progreso toma la ficha de ms-clinico; sin ficha (404) muestra que aún no hay registros
  it('carga la ficha de ms-clinico y trata la ficha inexistente', async () => {
    servidorFalso({
      'GET /fichas/mia': { data: {
        pacienteCorreo: 'paciente@gmail.com', nutricionistaNombre: 'Carolina', objetivo: 'Bajar 6 kg',
        planAlimenticio: 'Desayuno: avena.', planActualizadoEn: '2026-10-15T12:00:00',
        mediciones: [{ id: 1, fecha: '2026-08-20', peso: 78.4, talla: 165, cintura: 92, imc: 28.8, clasificacionImc: 'Sobrepeso' }],
      } },
    })
    const sesion = { correo: 'paciente@gmail.com', tipoUsuario: 'Paciente' }

    const ficha = await cargarMiFicha(sesion)
    expect(ficha).toMatchObject({ nutricionista: 'Carolina', planAlimenticio: { texto: 'Desayuno: avena.' } })
    expect(ficha.mediciones[0]).toMatchObject({ id: '1', peso: 78.4 })

    servidorFalso({})
    await expect(cargarMiFicha(sesion)).resolves.toBeNull()
  })
})
