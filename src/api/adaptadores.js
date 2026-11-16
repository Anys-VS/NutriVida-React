// Traducen las respuestas del backend al formato que ya usan las pantallas del frontend.
// Así las páginas funcionan igual en modo 'local' y en modo 'api'.
import { ESTADO_CITA, ESTADO_PAGO, METODO_PAGO } from '../config/reglas'

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
  }
}

// ms-ordenes: GET /api/v1/ordenes → { id, fecha, total, detalles: [...] }.
export function ordenDesdeApi(orden) {
  return {
    id: String(orden.id),
    fecha: orden.fecha,
    tipoOrden: 'Carrito',
    total: orden.total,
    detalle: (orden.detalles ?? []).map((linea) => ({ ...linea, citaId: null, planId: null })),
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
