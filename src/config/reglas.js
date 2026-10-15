// Parámetros de las reglas de negocio (documento "Reglas de negocio v1").
// Se cambian aquí y se aplican en todo el sistema.
export const REGLAS = {
  PLAZO_CONFIRMACION_HORAS: 24,
  RECORDATORIO_HORAS: 48,
  ANTICIPACION_MINIMA_HORAS: 2,
  PORCENTAJE_REEMBOLSO_PLAN: 0.8,
  UMBRAL_CUPOS_CRITICOS: 2,
}

export const ESTADO_CITA = {
  POR_CONFIRMAR: 'Por confirmar',
  CONFIRMADA: 'Confirmada',
  ATENDIDA: 'Atendida',
  CANCELADA: 'Cancelada',
  INASISTENCIA: 'Inasistencia',
}

export const ESTADO_PAGO = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  REEMBOLSADO_TOTAL: 'Reembolsado total',
  REEMBOLSADO_PARCIAL: 'Reembolsado parcial',
}

export const ESTADO_PLAN = {
  ACTIVO: 'Activo',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
}

export const METODO_PAGO = {
  ONLINE: 'Online',
  CLINICA: 'Clínica',
}

export const TIPO_SERVICIO = {
  CONSULTA: 'Consulta',
  PLAN: 'Plan especializado',
  EVALUACION: 'Evaluación',
  TALLER: 'Taller grupal',
}

export const HORARIOS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00']

export const ROL = {
  PACIENTE: 'Paciente',
  ADMIN: 'Administrador',
  RECEPCION: 'Recepción',
}

// Las categorías corresponden a los tipos de servicio, de los que dependen las reglas
// (planes solo online, talleres con cupos). Por eso se pueden editar sus textos, no crear ni borrar.
export const CATEGORIAS = [
  { slug: 'consulta', tipo: TIPO_SERVICIO.CONSULTA, titulo: 'Consultas', descripcion: 'Primeras evaluaciones y controles de seguimiento con tu nutricionista.' },
  { slug: 'plan', tipo: TIPO_SERVICIO.PLAN, titulo: 'Planes especializados', descripcion: 'Procesos de varias sesiones, pagados online, para objetivos específicos.' },
  { slug: 'evaluacion', tipo: TIPO_SERVICIO.EVALUACION, titulo: 'Evaluaciones', descripcion: 'Mediciones y análisis para conocer tu punto de partida.' },
  { slug: 'taller', tipo: TIPO_SERVICIO.TALLER, titulo: 'Talleres grupales', descripcion: 'Aprende en comunidad, con cupos limitados por horario.' },
]
