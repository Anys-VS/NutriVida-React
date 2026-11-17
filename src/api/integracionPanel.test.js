import { AxiosError } from 'axios'
import { cliente } from './cliente'
import { guardarCategoria, guardarServicio } from '../services/catalogo'
import { cargarCitasPersonal, cargarDatosAdministracion, cargarFicha, nombreDe, registrarMedicion, registrarPagoEnClinica } from '../services/panel'
import { guardarUsuarioAdmin } from '../services/administracion'
import { crearLocalStorageFalso } from '../test/localStorageFalso'

// Modo 'api' del panel interno (recepción, nutricionista y administración), con respuestas que tienen
// exactamente la forma que devuelve el backend.
vi.mock('../config/api', async (original) => ({ ...(await original()), usaApi: () => true }))

function servidorFalso(rutas) {
  const peticiones = []
  cliente.defaults.adapter = async (config) => {
    const clave = `${config.method.toUpperCase()} ${config.url}`
    peticiones.push({ clave, cuerpo: config.data ? JSON.parse(config.data) : null })
    const { status = 200, data } = rutas[clave] ?? { status: 404, data: { status: 404, mensaje: 'No existe.' } }
    const respuesta = { status, data, statusText: '', headers: {}, config }
    if (status >= 400) throw new AxiosError('error', 'ERR_BAD_RESPONSE', config, null, respuesta)
    return respuesta
  }
  return peticiones
}

const RECEPCION = { correo: 'recepcion@gmail.com', tipoUsuario: 'Recepción' }
const NUTRICIONISTA = { correo: 'carolina.fuentes@nutrivida.cl', tipoUsuario: 'Nutricionista' }
const citaBackend = {
  id: 7, pacienteCorreo: 'paciente@gmail.com', codigoServicio: 'CN001', nombreServicio: 'Consulta', nutricionista: 'Carolina Fuentes',
  fechaHora: '2026-11-25T10:00:00', metodoPago: 'CLINICA', estadoCita: 'CONFIRMADA', estadoPago: 'PENDIENTE', precio: 35000,
}

describe('Integración del panel interno con el backend (modo api)', () => {
  const adaptadorOriginal = cliente.defaults.adapter
  beforeEach(() => vi.stubGlobal('localStorage', crearLocalStorageFalso()))
  afterEach(() => {
    cliente.defaults.adapter = adaptadorOriginal
    vi.unstubAllGlobals()
  })

  // Prueba 75: recepción ve todas las citas de ms-citas con el nombre del paciente de ms-identidad
  it('carga las citas de la clínica con el nombre de cada paciente', async () => {
    servidorFalso({
      'GET /citas': { data: [citaBackend] },
      'GET /usuarios': { data: [{ run: '195556660', nombre: 'Javiera', apellidos: 'Soto', correo: 'paciente@gmail.com', tipoUsuario: 'Paciente' }] },
    })

    const { citas, usuarios } = await cargarCitasPersonal(RECEPCION)

    expect(citas[0]).toMatchObject({ id: '7', estadoCita: 'Confirmada', estadoPago: 'Pendiente', metodoPago: 'Clínica' })
    expect(nombreDe(usuarios, 'paciente@gmail.com')).toBe('Javiera Soto')
  })

  // Prueba 76: el pago en clínica se registra en ms-citas
  it('registra el pago en clínica de una cita', async () => {
    const peticiones = servidorFalso({ 'PATCH /citas/7/pago-clinica': { data: { ...citaBackend, estadoPago: 'PAGADO', montoPagado: 35000 } } })

    const resultado = await registrarPagoEnClinica('7')

    expect(peticiones[0].clave).toBe('PATCH /citas/7/pago-clinica')
    expect(resultado).toMatchObject({ ok: true, cita: { estadoPago: 'Pagado', montoPagado: 35000 } })
  })

  // Prueba 77: si el paciente aún no tiene ficha (404), el nutricionista la abre al registrar la primera medición
  it('abre la ficha del paciente antes de la primera medición', async () => {
    const fichaCreada = { pacienteCorreo: 'paciente@gmail.com', nutricionistaNombre: 'Carolina Fuentes', mediciones: [] }
    const peticiones = servidorFalso({
      'POST /fichas': { status: 201, data: fichaCreada },
      'POST /fichas/paciente%40gmail.com/mediciones': { status: 201, data: { ...fichaCreada, mediciones: [{ id: 1, fecha: '2026-11-16', peso: 75.6, talla: 165, imc: 27.8 }] } },
    })

    const ficha = await cargarFicha('paciente@gmail.com', NUTRICIONISTA)
    expect(ficha).toMatchObject({ ok: true, nueva: true, puedeEditar: true })

    const resultado = await registrarMedicion('paciente@gmail.com', { fecha: '2026-11-16', peso: '75.6', talla: '165', cintura: '', nota: '' }, NUTRICIONISTA, ficha.nueva)

    expect(peticiones.map((peticion) => peticion.clave)).toEqual(['GET /fichas/paciente%40gmail.com', 'POST /fichas', 'POST /fichas/paciente%40gmail.com/mediciones'])
    expect(peticiones[2].cuerpo).toEqual({ fecha: '2026-11-16', peso: 75.6, talla: 165, cintura: null, nota: '' })
    expect(resultado.ficha.mediciones).toHaveLength(1)
  })

  // Prueba 78: al guardar un servicio se envía el id de la categoría que pide ms-catalogo
  it('guarda un servicio con el id de su categoría', async () => {
    const peticiones = servidorFalso({
      'GET /categorias': { data: [{ id: 3, nombre: 'Evaluación', descripcion: '' }] },
      'POST /servicios': { status: 201, data: {} },
    })

    const resultado = await guardarServicio({
      codigo: 'EV005', tipo: 'Evaluación', nombre: 'Test de hábitos', duracion: '20 min', modalidad: 'Presencial',
      profesional: 'Nutricionista', precio: 10000, descuento: 0, descripcion: '',
    })

    expect(resultado.ok).toBe(true)
    expect(peticiones[1].cuerpo).toMatchObject({ codigo: 'EV005', categoriaId: 3, precio: 10000, sesiones: null, cupos: null })
  })

  // Prueba 79: los errores de validación de ms-catalogo llegan por campo al formulario
  it('devuelve los errores por campo del backend al guardar un servicio', async () => {
    servidorFalso({
      'GET /categorias': { data: [{ id: 3, nombre: 'Evaluación' }] },
      'POST /servicios': { status: 400, data: { status: 400, mensaje: 'Hay datos inválidos.', campos: { codigo: 'El código debe tener 2 letras y 3 números (ej: CN006).' } } },
    })

    const resultado = await guardarServicio({ codigo: 'EVAL1', tipo: 'Evaluación', nombre: 'X', precio: 1000, descuento: 0 })

    expect(resultado).toMatchObject({ ok: false, errores: { codigo: 'El código debe tener 2 letras y 3 números (ej: CN006).' } })
  })

  // Prueba 80: al editar una categoría se conserva su nombre (es el tipo de servicio) y cambia la descripción
  it('edita la descripción de una categoría sin cambiar su nombre', async () => {
    const peticiones = servidorFalso({ 'PUT /categorias/2': { data: {} } })

    await guardarCategoria({ id: 2, slug: 'plan', tipo: 'Plan especializado' }, { titulo: 'Planes', descripcion: 'Programas de varias sesiones.' })

    expect(peticiones[0].cuerpo).toEqual({ nombre: 'Plan especializado', descripcion: 'Programas de varias sesiones.' })
  })

  // Prueba 81: al crear un usuario los campos opcionales vacíos se envían como null a ms-identidad
  it('crea un usuario enviando null en los campos opcionales vacíos', async () => {
    const peticiones = servidorFalso({ 'POST /usuarios': { status: 201, data: { run: '123456785' } } })

    await guardarUsuarioAdmin({
      run: '12345678-5'.replace('-', ''), nombre: 'Ana', apellidos: 'Pérez', correo: 'ANA@gmail.com', contrasena: 'clave1',
      tipoUsuario: 'Recepción', region: '', comuna: '', direccion: '', fechaNacimiento: '',
    })

    expect(peticiones[0].cuerpo).toMatchObject({ correo: 'ana@gmail.com', tipoUsuario: 'Recepción', region: null, fechaNacimiento: null })
  })

  // Prueba 82: el resumen y los reportes se calculan con los datos de los tres microservicios
  it('reúne citas, planes, servicios y usuarios para las métricas', async () => {
    servidorFalso({
      'GET /citas': { data: [citaBackend] },
      'GET /planes': { data: [{ id: 9, pacienteCorreo: 'paciente@gmail.com', nombre: 'Plan', sesionesTotales: 2, montoPagado: 65000, estadoPlan: 'ACTIVO', atendidas: 0, agendadas: 0, porAgendar: 2 }] },
      'GET /servicios': { data: [{ codigo: 'CN001', nombre: 'Consulta', tipo: 'Consulta', precio: 35000, descuento: 0, activo: true }] },
      'GET /usuarios': { data: [{ correo: 'a@gmail.com' }, { correo: 'b@gmail.com' }] },
    })

    const datos = await cargarDatosAdministracion()

    expect(datos).toMatchObject({ totalUsuarios: 2 })
    expect(datos.citas).toHaveLength(1)
    expect(datos.planes[0]).toMatchObject({ id: '9', montoPagado: 65000 })
    expect(datos.servicios[0].codigo).toBe('CN001')
  })
})
