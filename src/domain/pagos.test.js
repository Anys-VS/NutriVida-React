import { procesarPagoSimulado, validarTarjeta, hayErrores } from './pagos'

describe('pago online simulado', () => {
  // Prueba 19
  it('rechaza las tarjetas terminadas en 0000 y detecta datos de tarjeta inválidos', () => {
    expect(procesarPagoSimulado('4111 1111 1111 0000')).toMatchObject({ aprobado: false })
    expect(procesarPagoSimulado('4111 1111 1111 1111')).toMatchObject({ aprobado: true })

    const ahora = new Date('2026-11-10T10:00:00')
    const errores = validarTarjeta({ titular: 'Ana Vidal', numero: '4111', vencimiento: '01/20', cvv: '12' }, ahora)

    expect(errores.numero).toMatch(/16 dígitos/)
    expect(errores.vencimiento).toMatch(/vencida/)
    expect(errores.cvv).toMatch(/3 dígitos/)
    expect(hayErrores(errores)).toBe(true)
  })
})
