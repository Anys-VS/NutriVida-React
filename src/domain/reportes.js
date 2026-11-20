import { ESTADO_CITA, ESTADO_PAGO } from '../config/reglas'
import { ingresoDePlan } from './metricas'
import { fechaLocalISO } from '../utils/formato'

// Deja solo los registros cuya fecha (día local) cae entre `desde` y `hasta`, ambos incluidos.
// Las fechas vienen como 'AAAA-MM-DD'; si falta una, ese extremo queda abierto.
export function filtrarPorPeriodo(registros, { desde, hasta } = {}, fechaDe = (registro) => registro.fechaHora) {
  return registros.filter((registro) => {
    const valor = fechaDe(registro)
    if (!valor) return !desde && !hasta
    const dia = fechaLocalISO(new Date(valor))
    return (!desde || dia >= desde) && (!hasta || dia <= hasta)
  })
}

function agrupar(citas, claveDe) {
  const grupos = {}
  citas.forEach((cita) => {
    const clave = claveDe(cita)
    grupos[clave] ??= { citas: 0, atendidas: 0, inasistencias: 0, ingresos: 0, reembolsado: 0 }
    const grupo = grupos[clave]
    grupo.citas += 1
    if (cita.estadoCita === ESTADO_CITA.ATENDIDA) grupo.atendidas += 1
    if (cita.estadoCita === ESTADO_CITA.INASISTENCIA) grupo.inasistencias += 1
    if (cita.estadoPago === ESTADO_PAGO.PAGADO) grupo.ingresos += cita.montoPagado
    grupo.reembolsado += cita.montoReembolsado || 0
  })
  return grupos
}

// Reportes a partir de las citas: tasa de inasistencia y desglose por categoría y nutricionista.
// Con `periodo` solo cuentan las citas de esas fechas y los planes contratados en ellas.
export function calcularReportes({ citas: todasLasCitas, servicios, planes: todosLosPlanes = [], periodo }) {
  const citas = filtrarPorPeriodo(todasLasCitas, periodo)
  const planes = filtrarPorPeriodo(todosLosPlanes, periodo, (plan) => plan.creadoEn)
  const tipoDe = (codigo) => servicios.find((servicio) => servicio.codigo === codigo)?.tipo ?? 'Servicio eliminado'
  const atendidas = citas.filter((cita) => cita.estadoCita === ESTADO_CITA.ATENDIDA).length
  const inasistencias = citas.filter((cita) => cita.estadoCita === ESTADO_CITA.INASISTENCIA).length
  const canceladas = citas.filter((cita) => cita.estadoCita === ESTADO_CITA.CANCELADA).length
  const cerradas = atendidas + inasistencias
  const porCategoria = agrupar(citas, (cita) => tipoDe(cita.codigoServicio))
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
    porNutricionista: agrupar(citas, (cita) => cita.nutricionista || 'Sin preferencia'),
  }
}
