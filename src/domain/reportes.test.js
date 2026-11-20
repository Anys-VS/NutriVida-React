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

  // Prueba 57: atenciones por período (el caso pide estadísticas por período)
  it('cuenta solo las citas y planes del período elegido', () => {
    const cita = (fechaHora, estadoCita) => ({ codigoServicio: 'CN001', nutricionista: 'Carolina Fuentes', estadoPago: 'Pagado', montoPagado: 35000, fechaHora, estadoCita })
    const citas = [
      cita('2026-10-15T13:00:00.000Z', 'Atendida'),
      cita('2026-11-03T13:00:00.000Z', 'Atendida'),
      cita('2026-11-20T13:00:00.000Z', 'Inasistencia'),
    ]

    const noviembre = calcularReportes({ citas, servicios: catalogoServicios, periodo: { desde: '2026-11-01', hasta: '2026-11-30' } })
    expect(noviembre.totalCitas).toBe(2)
    expect(noviembre.tasaInasistencia).toBeCloseTo(0.5)

    const hastaOctubre = calcularReportes({ citas, servicios: catalogoServicios, periodo: { hasta: '2026-10-31' } })
    expect(hastaOctubre.totalCitas).toBe(1)
    expect(calcularReportes({ citas, servicios: catalogoServicios }).totalCitas).toBe(3)
  })
})
