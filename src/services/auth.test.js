import { autenticar, registrarPaciente } from './auth'
import { crearLocalStorageFalso } from '../test/localStorageFalso'

describe('autenticación', () => {
  beforeEach(() => vi.stubGlobal('localStorage', crearLocalStorageFalso()))
  afterEach(() => vi.unstubAllGlobals())

  // Prueba 20
  it('autentica con credenciales correctas y no permite registrar un correo repetido', () => {
    expect(autenticar('ADMIN@gmail.com', 'admin123')).toMatchObject({ tipoUsuario: 'Administrador' })
    expect(autenticar('admin@gmail.com', 'incorrecta')).toBeNull()

    const paciente = { run: '180000003', nombre: 'Ana', apellidos: 'Vidal', correo: 'ana@gmail.com', contrasena: '1234' }
    expect(registrarPaciente(paciente)).toMatchObject({ ok: true, usuario: { tipoUsuario: 'Paciente' } })
    expect(registrarPaciente({ ...paciente, run: '16543210K' })).toEqual({ ok: false, motivo: 'Ya existe una cuenta con ese correo.' })
  })
})
