import { REGLAS, ESTADO_CITA, ESTADO_PAGO, METODO_PAGO, HORARIOS } from '../config/reglas'

const MS_POR_HORA = 60 * 60 * 1000
const ESTADOS_ACTIVOS = [ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA]

export function horasHastaCita(fechaHora, ahora = new Date()) {
  return (new Date(fechaHora).getTime() - new Date(ahora).getTime()) / MS_POR_HORA
}

// RN-02, RN-03, RN-04, RN-07, RN-08: define en qué estado nace una cita.
export function evaluarReserva({ fechaHora, metodoPago, esPlan = false, ahora = new Date() }) {
  const horas = horasHastaCita(fechaHora, ahora)

  if (Number.isNaN(horas)) {
    return { ok: false, motivo: 'La fecha u hora de la cita no es válida.' }
  }
  if (horas < REGLAS.ANTICIPACION_MINIMA_HORAS) {
    return {
      ok: false,
      motivo: `Con menos de ${REGLAS.ANTICIPACION_MINIMA_HORAS} h de anticipación no se puede reservar en línea. Llama a la clínica.`,
    }
  }
  if (esPlan && metodoPago !== METODO_PAGO.ONLINE) {
    return { ok: false, motivo: 'Los planes solo se pagan online.' }
  }

  if (metodoPago === METODO_PAGO.ONLINE) {
    return { ok: true, estadoCita: ESTADO_CITA.CONFIRMADA, estadoPago: ESTADO_PAGO.PAGADO, limiteConfirmacion: null }
  }

  if (horas >= REGLAS.PLAZO_CONFIRMACION_HORAS) {
    const limite = new Date(new Date(fechaHora).getTime() - REGLAS.PLAZO_CONFIRMACION_HORAS * MS_POR_HORA)
    return {
      ok: true,
      estadoCita: ESTADO_CITA.POR_CONFIRMAR,
      estadoPago: ESTADO_PAGO.PENDIENTE,
      limiteConfirmacion: limite.toISOString(),
    }
  }

  // Menos de 24 h: reservar ya es la confirmación (RN-07).
  return { ok: true, estadoCita: ESTADO_CITA.CONFIRMADA, estadoPago: ESTADO_PAGO.PENDIENTE, limiteConfirmacion: null }
}

// RN-06: una cita "Por confirmar" se cancela si pasó su límite de confirmación.
export function debeCancelarsePorFaltaDeConfirmacion(cita, ahora = new Date()) {
  return (
    cita.estadoCita === ESTADO_CITA.POR_CONFIRMAR &&
    Boolean(cita.limiteConfirmacion) &&
    new Date(ahora) > new Date(cita.limiteConfirmacion)
  )
}

// RN-09: el paciente puede cancelar hasta 2 h antes.
export function puedeCancelarPaciente(cita, ahora = new Date()) {
  return (
    ESTADOS_ACTIVOS.includes(cita.estadoCita) &&
    horasHastaCita(cita.fechaHora, ahora) >= REGLAS.ANTICIPACION_MINIMA_HORAS
  )
}

// RN-12 y RN-14: talleres por cupos; el resto, un nutricionista por horario.
export function hayDisponibilidad({ servicio, nutricionista, fechaHora, citas }) {
  const momento = new Date(fechaHora).getTime()
  const ocupadas = citas.filter(
    (c) => ESTADOS_ACTIVOS.includes(c.estadoCita) && new Date(c.fechaHora).getTime() === momento,
  )

  if (servicio.cupos) {
    return ocupadas.filter((c) => c.codigoServicio === servicio.codigo).length < servicio.cupos
  }
  if (!nutricionista) return true
  return !ocupadas.some((c) => c.nutricionista === nutricionista)
}

// Horarios de un día con su disponibilidad (RN-08, RN-12 y RN-14).
export function horariosDisponibles({ servicio, nutricionista, fecha, citas, ahora = new Date() }) {
  return HORARIOS.map((hora) => {
    const fechaHora = `${fecha}T${hora}:00`
    if (horasHastaCita(fechaHora, ahora) < REGLAS.ANTICIPACION_MINIMA_HORAS) {
      return { hora, disponible: false, motivo: 'Muy próximo' }
    }
    if (!hayDisponibilidad({ servicio, nutricionista, fechaHora, citas })) {
      return { hora, disponible: false, motivo: 'Ocupado' }
    }
    return { hora, disponible: true, motivo: '' }
  })
}

// RN-04: recordatorio cuando faltan 48 h o menos y la cita sigue Por confirmar.
export function necesitaRecordatorio(cita, ahora = new Date()) {
  return (
    cita.estadoCita === ESTADO_CITA.POR_CONFIRMAR &&
    horasHastaCita(cita.fechaHora, ahora) <= REGLAS.RECORDATORIO_HORAS
  )
}

export function citaTienePagoPendiente(cita) {
  return cita.estadoPago === ESTADO_PAGO.PENDIENTE && ESTADOS_ACTIVOS.includes(cita.estadoCita)
}
