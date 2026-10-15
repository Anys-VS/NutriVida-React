import { validarRUN } from './validaciones'

describe('validarRUN', () => {
  // Prueba 6
  it('acepta un RUN con dígito verificador correcto y rechaza uno incorrecto', () => {
    expect(validarRUN('761920839')).toBe('')
    expect(validarRUN('761920830')).toBe('El dígito verificador del RUN no es válido.')
  })
})
