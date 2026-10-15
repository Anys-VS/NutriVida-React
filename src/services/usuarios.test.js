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
