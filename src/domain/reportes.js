import { ESTADO_CITA, ESTADO_PAGO } from '../config/reglas'
import { ingresoDePlan } from './metricas'

function agrupar(citas, claveDe) {
  const grupos = {}
  citas.forEach((c) => {
    const clave = claveDe(c)
    grupos[clave] ??= { citas: 0, atendidas: 0, inasistencias: 0, ingresos: 0, reembolsado: 0 }
    const g = grupos[clave]
    g.citas += 1
    if (c.estadoCita === ESTADO_CITA.ATENDIDA) g.atendidas += 1
    if (c.estadoCita === ESTADO_CITA.INASISTENCIA) g.inasistencias += 1
    if (c.estadoPago === ESTADO_PAGO.PAGADO) g.ingresos += c.montoPagado
    g.reembolsado += c.montoReembolsado || 0
  })
  return grupos
}

// Reportes a partir de las citas: tasa de inasistencia y desglose por categoría y nutricionista.
export function calcularReportes({ citas, servicios, planes = [] }) {
  const tipoDe = (codigo) => servicios.find((s) => s.codigo === codigo)?.tipo ?? 'Servicio eliminado'
  const atendidas = citas.filter((c) => c.estadoCita === ESTADO_CITA.ATENDIDA).length
  const inasistencias = citas.filter((c) => c.estadoCita === ESTADO_CITA.INASISTENCIA).length
  const canceladas = citas.filter((c) => c.estadoCita === ESTADO_CITA.CANCELADA).length
  const cerradas = atendidas + inasistencias
  const porCategoria = agrupar(citas, (c) => tipoDe(c.codigoServicio))
  // El dinero de un plan se registra en el contrato, no en sus sesiones.
  planes.forEach((plan) => {
    const tipo = tipoDe(plan.codigoServicio)
    porCategoria[tipo] ??= { citas: 0, atendidas: 0, inasistencias: 0, ingresos: 0, reembolsado: 0 }
    porCategoria[tipo].ingresos += ingresoDePlan(plan)
    porCategoria[tipo].reembolsado += plan.montoReembolsado || 0
  })

  return {
    totalCitas: citas.length,
    atendidas,
    inasistencias,
    canceladas,
    // Inasistencias sobre las citas ya cerradas (atendidas + inasistencias).
    tasaInasistencia: cerradas === 0 ? 0 : inasistencias / cerradas,
    porCategoria,
    porNutricionista: agrupar(citas, (c) => c.nutricionista || 'Sin preferencia'),
  }
}
