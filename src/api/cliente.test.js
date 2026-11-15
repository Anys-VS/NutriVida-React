import { AxiosError } from 'axios'
import { crearLocalStorageFalso } from '../test/localStorageFalso'
import { cliente, alRenovar } from './cliente'
import { ErrorApi } from './errores'
import { guardarTokens, obtenerTokens } from '../auth/almacenTokens'

// Reemplaza la red por un servidor falso: cada petición recibe la respuesta que devuelva `responder`.
function servidorFalso(responder) {
  const peticiones = []
  cliente.defaults.adapter = async (config) => {
    peticiones.push(config)
    const { status, data } = responder(config, peticiones.length)
    const respuesta = { status, data, statusText: '', headers: {}, config }
    if (status >= 400) throw new AxiosError('error', 'ERR_BAD_RESPONSE', config, null, respuesta)
    return respuesta
  }
  return peticiones
}

describe('Cliente HTTP', () => {
  const adaptadorOriginal = cliente.defaults.adapter
  beforeEach(() => {
    vi.stubGlobal('localStorage', crearLocalStorageFalso())
    sessionStorage.clear()
    guardarTokens({ acceso: 'token-viejo', renovacion: 'renovacion-1' })
  })
  afterEach(() => {
    cliente.defaults.adapter = adaptadorOriginal
    vi.unstubAllGlobals()
  })

  // Prueba 51: cada petición lleva el token y los errores JSON del backend llegan como mensaje legible
  it('envía el token Bearer y traduce los errores del backend', async () => {
    const peticiones = servidorFalso((config) => (config.url === '/servicios'
      ? { status: 200, data: [{ codigo: 'CO001' }] }
      : { status: 400, data: { mensaje: 'La fecha ya pasó.', errores: { fechaHora: 'Elige una fecha futura' } } }))

    await expect(cliente.get('/servicios').then((r) => r.data)).resolves.toEqual([{ codigo: 'CO001' }])
    expect(peticiones[0].headers.Authorization).toBe('Bearer token-viejo')

    const error = await cliente.post('/citas', {}).catch((e) => e)
    expect(error).toBeInstanceOf(ErrorApi)
    expect(error).toMatchObject({ estado: 400, message: 'La fecha ya pasó.', errores: { fechaHora: 'Elige una fecha futura' } })
  })

  // Prueba 52: con el token vencido (401) se renueva una sola vez y se repite la petición
  it('renueva el token ante un 401 y repite la petición con el token nuevo', async () => {
    const renovar = vi.fn(async () => guardarTokens({ acceso: 'token-nuevo', renovacion: 'renovacion-2' }))
    alRenovar(renovar)
    const peticiones = servidorFalso((config) => (config.headers.Authorization === 'Bearer token-nuevo'
      ? { status: 200, data: { ok: true } }
      : { status: 401, data: {} }))

    await expect(cliente.get('/citas/mias').then((r) => r.data)).resolves.toEqual({ ok: true })
    expect(renovar).toHaveBeenCalledTimes(1)
    expect(peticiones).toHaveLength(2)
  })

  // Prueba 53: si la renovación falla, la sesión se cierra (se borran los tokens)
  it('cierra la sesión cuando el token no se puede renovar', async () => {
    alRenovar(vi.fn(async () => { throw new ErrorApi(401, 'Tu sesión expiró.') }))
    servidorFalso(() => ({ status: 401, data: {} }))

    await expect(cliente.get('/citas/mias')).rejects.toMatchObject({ estado: 401 })
    expect(obtenerTokens()).toEqual({ acceso: null, renovacion: null })
  })
})
