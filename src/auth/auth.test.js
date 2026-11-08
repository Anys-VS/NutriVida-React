import { crearLocalStorageFalso } from '../test/localStorageFalso'
import { estaVigente, leerClaims, sesionDesdeToken } from './jwt'
import { DURACION_ACCESO_S, emitirTokens, servidorLocal } from './servidorLocal'
import { usuarios } from '../data/db'
import { puede } from '../config/permisos'
import { ROL } from '../config/reglas'

const paciente = { run: '195556660', correo: 'paciente@gmail.com', nombre: 'Javiera', apellidos: 'Soto Paredes', tipoUsuario: ROL.PACIENTE }

describe('Tokens JWT y permisos', () => {
  beforeEach(() => vi.stubGlobal('localStorage', crearLocalStorageFalso()))
  afterEach(() => vi.unstubAllGlobals())

  // Prueba 48: la sesión de la interfaz se arma solo desde el token, y vence a los 15 minutos
  it('lee los datos de sesión desde el token de acceso y detecta su vencimiento', () => {
    const ahora = Date.UTC(2026, 10, 10, 12, 0)
    const { acceso, renovacion } = emitirTokens(paciente, ahora)

    expect(sesionDesdeToken(acceso)).toEqual({
      run: '195556660', correo: 'paciente@gmail.com', nombre: 'Javiera', apellidos: 'Soto Paredes',
      tipoUsuario: ROL.PACIENTE, expira: ahora + DURACION_ACCESO_S * 1000,
    })
    expect(leerClaims(renovacion)).toMatchObject({ sub: 'paciente@gmail.com', tipo: 'renovacion' })
    expect(estaVigente(acceso, ahora + 14 * 60 * 1000)).toBe(true)
    expect(estaVigente(acceso, ahora + 16 * 60 * 1000)).toBe(false)
    expect(sesionDesdeToken('esto-no-es-un-jwt')).toBeNull()
  })

  // Prueba 49: renovar vuelve a consultar al usuario; si fue desactivado, pierde el acceso
  it('no renueva la sesión de un usuario desactivado', async () => {
    const { renovacion } = emitirTokens(paciente)
    await expect(servidorLocal.renovar(renovacion)).resolves.toHaveProperty('acceso')

    usuarios.actualizar('195556660', { activo: false })
    await expect(servidorLocal.renovar(renovacion)).rejects.toMatchObject({ estado: 401 })
    await expect(servidorLocal.login('paciente@gmail.com', 'paciente1')).rejects.toMatchObject({ estado: 401 })
  })

  // Prueba 50: la matriz de permisos decide qué rol usa cada funcionalidad
  it('aplica la matriz de permisos por rol y rechaza permisos inexistentes', () => {
    const nutri = { tipoUsuario: ROL.NUTRICIONISTA }
    expect(puede({ tipoUsuario: ROL.PACIENTE }, 'reservas:propias')).toBe(true)
    expect(puede(nutri, 'fichas:gestionar')).toBe(true)
    expect(puede(nutri, 'usuarios:gestionar')).toBe(false)
    expect(puede({ tipoUsuario: ROL.RECEPCION }, 'citas:gestionar')).toBe(true)
    expect(puede(null, 'reservas:propias')).toBe(false)
    expect(() => puede(nutri, 'permiso:inventado')).toThrow('Permiso desconocido')
  })
})
