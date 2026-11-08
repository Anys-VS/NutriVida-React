import { calcularIMC, clasificarIMC, puedeVerFicha, resumenProgreso, validarMedicion } from './clinico'
import { ESTADO_CITA } from '../config/reglas'

describe('ficha clínica', () => {
  // Prueba 38: IMC y validación de mediciones
  it('calcula el IMC y valida rangos de peso, talla y fecha', () => {
    expect(calcularIMC(75.6, 165)).toBe(27.8)
    expect(clasificarIMC(27.8)).toBe('Sobrepeso')
    expect(validarMedicion({ fecha: '2026-11-01', peso: 70, talla: 170, cintura: '' }, new Date('2026-11-10'))).toEqual({
      fecha: '', peso: '', talla: '', cintura: '',
    })
    const errores = validarMedicion({ fecha: '2026-12-01', peso: 0, talla: 300, cintura: 10 }, new Date('2026-11-10'))
    expect(Object.values(errores).every(Boolean)).toBe(true)
  })

  // Prueba 39: progreso entre la primera y la última medición
  it('resume la variación de peso y cintura', () => {
    const resumen = resumenProgreso([
      { id: 'b', fecha: '2026-10-15', peso: 75.6, talla: 165, cintura: 88 },
      { id: 'a', fecha: '2026-08-20', peso: 78.4, talla: 165, cintura: 92 },
    ])
    expect(resumen).toMatchObject({ controles: 2, variacionPeso: -2.8, variacionCintura: -4, imcActual: 27.8 })
  })

  // Prueba 40: privacidad de los datos de salud
  it('solo el paciente y su nutricionista pueden ver la ficha', () => {
    const ficha = { pacienteCorreo: 'paciente@gmail.com', nutricionista: 'Carolina Fuentes' }
    const citas = [{ pacienteCorreo: 'paciente@gmail.com', nutricionista: 'Felipe Araya', estadoCita: ESTADO_CITA.CONFIRMADA }]
    const base = { pacienteCorreo: 'paciente@gmail.com', ficha, citas }

    expect(puedeVerFicha({ ...base, sesion: { tipoUsuario: 'Paciente', correo: 'paciente@gmail.com' } })).toBe(true)
    expect(puedeVerFicha({ ...base, sesion: { tipoUsuario: 'Paciente', correo: 'otro@gmail.com' } })).toBe(false)
    expect(puedeVerFicha({ ...base, sesion: { tipoUsuario: 'Nutricionista' }, nombreProfesional: 'Carolina Fuentes' })).toBe(true)
    expect(puedeVerFicha({ ...base, sesion: { tipoUsuario: 'Nutricionista' }, nombreProfesional: 'Felipe Araya' })).toBe(true) // lo atiende
    expect(puedeVerFicha({ ...base, sesion: { tipoUsuario: 'Nutricionista' }, nombreProfesional: 'Rodrigo Sepúlveda' })).toBe(false)
    expect(puedeVerFicha({ ...base, sesion: { tipoUsuario: 'Administrador' } })).toBe(false)
  })
})
