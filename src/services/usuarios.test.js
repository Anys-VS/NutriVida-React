import { eliminarUsuario } from './usuarios'
import { crearLocalStorageFalso } from '../test/localStorageFalso'

describe('eliminarUsuario', () => {
  beforeEach(() => vi.stubGlobal('localStorage', crearLocalStorageFalso()))
  afterEach(() => vi.unstubAllGlobals())

  // Prueba 15
  it('no deja eliminar la propia cuenta ni al único administrador', () => {
    const propia = eliminarUsuario('761920839', { correo: 'admin@gmail.com' })
    expect(propia).toEqual({ ok: false, motivo: 'No puedes eliminar tu propia cuenta.' })

    const unico = eliminarUsuario('761920839', { correo: 'recepcion@gmail.com' })
    expect(unico).toEqual({ ok: false, motivo: 'Debe existir al menos un administrador.' })
  })
})

describe('desactivar usuarios', () => {
  beforeEach(() => vi.stubGlobal('localStorage', crearLocalStorageFalso()))
  afterEach(() => vi.unstubAllGlobals())

  // Prueba 43: desactivar en lugar de eliminar
  it('un usuario desactivado no puede iniciar sesión y se puede reactivar', async () => {
    const { cambiarEstadoUsuario } = await import('./usuarios')
    const { iniciarSesion } = await import('./auth')
    const admin = { correo: 'admin@gmail.com' }

    expect(cambiarEstadoUsuario('195556660', false, admin).ok).toBe(true)
    expect(iniciarSesion('paciente@gmail.com', 'paciente1')).toMatchObject({ ok: false, motivo: expect.stringMatching(/desactivada/) })
    expect(cambiarEstadoUsuario('195556660', true, admin).ok).toBe(true)
    expect(iniciarSesion('paciente@gmail.com', 'paciente1').ok).toBe(true)

    expect(cambiarEstadoUsuario('761920839', false, admin)).toMatchObject({ ok: false, motivo: 'No puedes desactivar tu propia cuenta.' })
  })
})
