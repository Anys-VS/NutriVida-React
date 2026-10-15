import { calcularReportes } from './reportes'
import { catalogoServicios } from '../data/catalogo'

describe('calcularReportes', () => {
  // Prueba 17: indicador del objetivo del proyecto (reducir inasistencias)
  it('calcula la tasa de inasistencia y los ingresos por categoría', () => {
    const base = { codigoServicio: 'CN001', nutricionista: 'Carolina Fuentes', estadoPago: 'Pagado', montoPagado: 35000 }
    const citas = [
      { ...base, estadoCita: 'Atendida' },
      { ...base, estadoCita: 'Atendida' },
      { ...base, estadoCita: 'Atendida' },
      { ...base, estadoCita: 'Inasistencia' },
      { ...base, estadoCita: 'Cancelada', estadoPago: 'Pendiente', montoPagado: 0 },
    ]

    const reporte = calcularReportes({ citas, servicios: catalogoServicios })

    expect(reporte.tasaInasistencia).toBeCloseTo(0.25)
    expect(reporte.porCategoria.Consulta).toMatchObject({ citas: 5, ingresos: 140000 })
    expect(reporte.porNutricionista['Carolina Fuentes'].inasistencias).toBe(1)
  })
})
