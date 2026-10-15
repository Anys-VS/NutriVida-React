import { calcularMetricas, requiereReembolso } from './metricas'

describe('métricas del panel', () => {
  // Prueba 18
  it('detecta los reembolsos pendientes y cuenta las citas por estado', () => {
    const pagadaOnline = { metodoPago: 'Online', estadoPago: 'Pagado', montoPagado: 35000 }
    const citas = [
      { ...pagadaOnline, estadoCita: 'Inasistencia', fechaHora: '2026-11-01T10:00:00' },
      { ...pagadaOnline, estadoCita: 'Atendida', fechaHora: '2026-11-02T10:00:00' },
      { metodoPago: 'Clínica', estadoPago: 'Pendiente', montoPagado: 0, estadoCita: 'Cancelada', fechaHora: '2026-11-03T10:00:00' },
    ]

    const metricas = calcularMetricas({ citas, totalServicios: 18, totalUsuarios: 2, ahora: new Date('2026-11-10T10:00:00') })

    expect(metricas.reembolsosPendientes).toBe(1)
    expect(requiereReembolso(citas[1])).toBe(false)
    expect(metricas.porEstado).toMatchObject({ Inasistencia: 1, Atendida: 1, Cancelada: 1 })
    expect(metricas.ingresos).toBe(70000)
  })
})
