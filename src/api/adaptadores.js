// Traducen las respuestas del backend al formato que ya usan las pantallas del frontend.
// Así las páginas funcionan igual en modo 'local' y en modo 'api'.
import { CATEGORIAS, ESTADO_CITA, ESTADO_PAGO, ESTADO_PLAN, METODO_PAGO } from '../config/reglas'

// El backend usa nombres de enum (POR_CONFIRMAR); la interfaz, etiquetas (Por confirmar).
const desdeEnum = (tabla) => (valor) => tabla[valor] ?? valor
const estadoCita = desdeEnum({
  POR_CONFIRMAR: ESTADO_CITA.POR_CONFIRMAR,
  CONFIRMADA: ESTADO_CITA.CONFIRMADA,
  ATENDIDA: ESTADO_CITA.ATENDIDA,
  CANCELADA: ESTADO_CITA.CANCELADA,
  INASISTENCIA: ESTADO_CITA.INASISTENCIA,
})
const estadoPago = desdeEnum({
  PENDIENTE: ESTADO_PAGO.PENDIENTE,
  PAGADO: ESTADO_PAGO.PAGADO,
  REEMBOLSADO_TOTAL: ESTADO_PAGO.REEMBOLSADO_TOTAL,
  REEMBOLSADO_PARCIAL: ESTADO_PAGO.REEMBOLSADO_PARCIAL,
})
const metodoPago = desdeEnum({ ONLINE: METODO_PAGO.ONLINE, CLINICA: METODO_PAGO.CLINICA })

// ms-citas: GET /api/v1/citas. Las fechas llegan sin zona ("2026-11-18T10:00:00") y se leen como hora local.
export function citaDesdeApi(cita) {
  return {
    ...cita,
    id: String(cita.id),
    estadoCita: estadoCita(cita.estadoCita),
    estadoPago: estadoPago(cita.estadoPago),
    metodoPago: metodoPago(cita.metodoPago),
    precio: Number(cita.precio ?? 0),
    montoPagado: Number(cita.montoPagado ?? 0),
    montoReembolsado: Number(cita.montoReembolsado ?? 0),
    reprogramaciones: cita.reprogramaciones ?? 0,
    planId: cita.planId ? String(cita.planId) : null,
  }
}

// ms-ordenes: GET /api/v1/ordenes → { id, fecha, total, detalles: [...] }.
export function ordenDesdeApi(orden) {
  return {
    id: String(orden.id),
    pacienteCorreo: orden.correoPaciente ?? '',
    fecha: orden.fecha,
    tipoOrden: 'Carrito',
    estado: orden.estado,
    tarjeta: orden.tarjeta,
    total: orden.total,
    detalle: (orden.detalles ?? []).map((linea) => ({
      ...linea,
      citaId: linea.citaId != null ? String(linea.citaId) : null,
      planId: linea.planId != null ? String(linea.planId) : null,
    })),
  }
}

// ms-ordenes: un ítem del carrito. El tipo y las sesiones salen del catálogo (para mostrar "Plan" y sus sesiones).
export function itemCarritoDesdeApi(item, servicio) {
  return {
    ...item,
    id: String(item.id),
    tipo: servicio?.tipo ?? '',
    sesiones: servicio?.sesiones ?? null,
    nutricionista: item.nutricionista ?? '',
    motivo: item.motivo ?? '',
    precio: Number(item.precio ?? 0),
  }
}

// ms-citas: GET /planes → la forma de plan del frontend, con el resumen de sesiones ya calculado.
export function planDesdeApi(plan) {
  return {
    id: String(plan.id),
    pacienteCorreo: plan.pacienteCorreo,
    codigoServicio: plan.codigoServicio,
    nombre: plan.nombre,
    sesionesTotales: plan.sesionesTotales,
    montoPagado: Number(plan.montoPagado ?? 0),
    estadoPlan: desdeEnum({ ACTIVO: ESTADO_PLAN.ACTIVO, FINALIZADO: ESTADO_PLAN.FINALIZADO, CANCELADO: ESTADO_PLAN.CANCELADO })(plan.estadoPlan),
    estadoPago: ESTADO_PAGO.PAGADO,
    montoReembolsado: 0,
    reembolsoPendiente: 0,
    ordenId: plan.ordenId,
    creadoEn: plan.creadoEn,
    resumen: { total: plan.sesionesTotales, atendidas: plan.atendidas, agendadas: plan.agendadas, porAgendar: plan.porAgendar },
  }
}

// ms-clinico: GET /api/v1/fichas/mia → la forma de ficha que usan Mi progreso y ProgresoPaciente.
export function fichaDesdeApi(ficha) {
  return {
    pacienteCorreo: ficha.pacienteCorreo,
    nutricionista: ficha.nutricionistaNombre ?? '',
    objetivo: ficha.objetivo ?? '',
    antecedentes: ficha.antecedentes ?? '',
    mediciones: (ficha.mediciones ?? []).map((medicion) => ({ ...medicion, id: String(medicion.id) })),
    planAlimenticio: ficha.planAlimenticio
      ? { texto: ficha.planAlimenticio, actualizadoEn: ficha.planActualizadoEn, nutricionista: ficha.nutricionistaNombre ?? '' }
      : null,
  }
}

// ms-catalogo: un servicio ya tiene la forma del frontend (tipo = nombre de la categoría).
// Se asegura que los montos sean números y que los campos opcionales vengan vacíos y no null.
export function servicioDesdeApi(servicio) {
  return {
    ...servicio,
    precio: Number(servicio.precio ?? 0),
    descuento: Number(servicio.descuento ?? 0),
    sesiones: servicio.sesiones ?? undefined,
    cupos: servicio.cupos ?? undefined,
    activo: servicio.activo !== false,
  }
}

// ms-catalogo: { id, nombre, descripcion } → la forma de categoría del frontend { slug, tipo, titulo, descripcion }.
// El slug y el título salen de la tabla de categorías conocida; una categoría nueva usa su propio nombre.
export function categoriaDesdeApi(categoria) {
  const conocida = CATEGORIAS.find((candidata) => candidata.tipo === categoria.nombre)
  return {
    id: categoria.id,
    slug: conocida?.slug ?? slugDe(categoria.nombre),
    tipo: categoria.nombre,
    titulo: conocida?.titulo ?? categoria.nombre,
    descripcion: categoria.descripcion ?? conocida?.descripcion ?? '',
  }
}

const slugDe = (texto) => String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
