import { talleresCriticos } from './criticos'
import { catalogoServicios } from '../data/catalogo'

describe('talleresCriticos', () => {
  // Prueba 16: reemplaza al stock crítico del template
  it('lista solo los talleres futuros con pocos cupos restantes', () => {
    const ahora = new Date('2026-11-10T10:00:00')
    const fechaHora = new Date('2026-11-20T10:00:00').toISOString()
    const activas = (codigo, n) => Array.from({ length: n }, () => ({ codigoServicio: codigo, fechaHora, estadoCita: 'Confirmada' }))
    const citas = [
      ...activas('TG002', 7), // taller de 8 cupos: queda 1
      { codigoServicio: 'TG002', fechaHora, estadoCita: 'Cancelada' }, // no ocupa cupo
      ...activas('TG001', 2), // taller de 10 cupos: quedan 8
    ]

    const criticos = talleresCriticos({ citas, servicios: catalogoServicios, ahora })

    expect(criticos).toHaveLength(1)
    expect(criticos[0]).toMatchObject({ codigoServicio: 'TG002', ocupados: 7, cupos: 8, restantes: 1 })
  })
})
