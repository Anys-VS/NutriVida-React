import { agendaDe, obtenerFicha, pacientesDe, registrarMedicion } from './clinico'
import { reservarCita } from './reservas'
import { METODO_PAGO } from '../config/reglas'
import { crearLocalStorageFalso } from '../test/localStorageFalso'

describe('fichas y agenda del nutricionista', () => {
  const carolina = { tipoUsuario: 'Nutricionista', correo: 'carolina.fuentes@nutrivida.cl' }
  const rodrigo = { tipoUsuario: 'Nutricionista', correo: 'rodrigo.sepulveda@nutrivida.cl' }
  const paciente = { tipoUsuario: 'Paciente', correo: 'paciente@gmail.com' }

  beforeEach(() => {
    vi.stubGlobal('localStorage', crearLocalStorageFalso())
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-10T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  // Prueba 41: el nutricionista registra y el paciente consulta; otro nutricionista no accede
  it('registra una medición que el paciente ve, y bloquea a otro nutricionista', () => {
    const resultado = registrarMedicion('paciente@gmail.com', { fecha: '2026-11-09', peso: 75, talla: 165, cintura: 87, nota: '' }, carolina)
    expect(resultado.ok).toBe(true)

    const vista = obtenerFicha('paciente@gmail.com', paciente)
    expect(vista).toMatchObject({ ok: true, puedeEditar: false })
    expect(vista.ficha.mediciones).toHaveLength(4) // 3 de la semilla + 1 nueva

    expect(obtenerFicha('paciente@gmail.com', rodrigo)).toMatchObject({ ok: false })
    expect(registrarMedicion('paciente@gmail.com', { fecha: '2026-11-09', peso: 70, talla: 165, cintura: '' }, rodrigo).ok).toBe(false)
    expect(registrarMedicion('paciente@gmail.com', { fecha: '2026-11-09', peso: 75, talla: 165, cintura: '' }, paciente).ok).toBe(false)
  })

  // Prueba 42: agenda y pacientes propios
  it('cada nutricionista ve solo sus citas y sus pacientes', () => {
    reservarCita({ pacienteCorreo: 'nuevo@gmail.com', codigoServicio: 'CN001', nutricionista: 'Rodrigo Sepúlveda', fechaHora: '2026-11-12T10:00:00', metodoPago: METODO_PAGO.ONLINE })

    expect(agendaDe(rodrigo)).toHaveLength(1)
    expect(agendaDe(carolina)).toHaveLength(0)
    expect(pacientesDe(rodrigo).map((p) => p.correo)).toEqual(['nuevo@gmail.com'])
    expect(pacientesDe(carolina).map((p) => p.correo)).toEqual(['paciente@gmail.com']) // asignada en su ficha
    expect(obtenerFicha('nuevo@gmail.com', rodrigo)).toMatchObject({ ok: true, puedeEditar: true })
  })
})
