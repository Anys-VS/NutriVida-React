import { REGLAS, ESTADO_CITA, ESTADO_PAGO, METODO_PAGO, HORARIOS } from '../config/reglas'
import { nutricionistas } from '../data/nutricionistas'
import { atiendeEn, atiendeEnFecha, bloquesDeJornada, buscarPorNombre } from './profesionales'

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

// Fecha local "AAAA-MM-DD" y hora "HH:MM" de un instante, para compararlo con la jornada.
function partesLocales(fechaHora) {
  const d = new Date(fechaHora)
  const dos = (n) => String(n).padStart(2, '0')
  return { fecha: `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`, hora: `${dos(d.getHours())}:${dos(d.getMinutes())}` }
}

function ocupadasEn(fechaHora, citas, excluirId) {
  const momento = new Date(fechaHora).getTime()
  return citas.filter(
    (c) => c.id !== excluirId && ESTADOS_ACTIVOS.includes(c.estadoCita) && new Date(c.fechaHora).getTime() === momento,
  )
}

// Nutricionistas que atienden en ese bloque y no tienen otra cita a esa hora.
export function profesionalesLibres({ fechaHora, citas, profesionales = nutricionistas, excluirId = null }) {
  const { fecha, hora } = partesLocales(fechaHora)
  const ocupadas = ocupadasEn(fechaHora, citas, excluirId)
  return profesionales.filter((p) => atiendeEn(p, fecha, hora) && !ocupadas.some((c) => c.nutricionista === p.nombre))
}

// RN-12 y RN-14: talleres por cupos; el resto, un nutricionista por horario y dentro de su jornada.
export function hayDisponibilidad({ servicio, nutricionista, fechaHora, citas, profesionales = nutricionistas, excluirId = null }) {
  const ocupadas = ocupadasEn(fechaHora, citas, excluirId)

  if (servicio.cupos) {
    return ocupadas.filter((c) => c.codigoServicio === servicio.codigo).length < servicio.cupos
  }
  const libres = profesionalesLibres({ fechaHora, citas, profesionales, excluirId })
  if (!nutricionista) return libres.length > 0 || profesionales.length === 0
  if (!buscarPorNombre(profesionales, nutricionista)) return !ocupadas.some((c) => c.nutricionista === nutricionista)
  return libres.some((p) => p.nombre === nutricionista)
}

// Sin preferencia, la clínica asigna al primer nutricionista libre en ese bloque.
export function asignarNutricionista({ servicio, nutricionista, fechaHora, citas, profesionales = nutricionistas }) {
  if (nutricionista || servicio.cupos) return nutricionista ?? ''
  return profesionalesLibres({ fechaHora, citas, profesionales })[0]?.nombre ?? ''
}

// Bloques posibles de un día: la jornada del nutricionista elegido o la de todos los que atienden ese día.
export function bloquesDelDia({ nutricionista, fecha, profesionales = nutricionistas }) {
  const elegido = nutricionista ? buscarPorNombre(profesionales, nutricionista) : null
  if (nutricionista && !elegido) return HORARIOS
  const quienes = elegido ? [elegido] : profesionales
  const bloques = new Set(quienes.filter((p) => atiendeEnFecha(p, fecha)).flatMap(bloquesDeJornada))
  return [...bloques].sort()
}

// Horarios de un día con su disponibilidad (RN-08, RN-12 y RN-14).
export function horariosDisponibles({ servicio, nutricionista, fecha, citas, ahora = new Date(), profesionales = nutricionistas, excluirId = null }) {
  return bloquesDelDia({ nutricionista, fecha, profesionales }).map((hora) => {
    const fechaHora = `${fecha}T${hora}:00`
    if (horasHastaCita(fechaHora, ahora) < REGLAS.ANTICIPACION_MINIMA_HORAS) {
      return { hora, disponible: false, motivo: 'Muy próximo' }
    }
    if (!hayDisponibilidad({ servicio, nutricionista, fechaHora, citas, profesionales, excluirId })) {
      return { hora, disponible: false, motivo: 'Ocupado' }
    }
    return { hora, disponible: true, motivo: '' }
  })
}

// Próximos bloques libres de un nutricionista, para el buscador de especialistas.
export function proximosHorarios({ profesional, citas, ahora = new Date(), cantidad = 3, diasMaximos = 14 }) {
  const resultado = []
  const servicio = { codigo: '' }
  for (let i = 0; i < diasMaximos && resultado.length < cantidad; i += 1) {
    const dia = new Date(ahora)
    dia.setDate(dia.getDate() + i)
    const { fecha } = partesLocales(dia)
    horariosDisponibles({ servicio, nutricionista: profesional.nombre, fecha, citas, ahora, profesionales: [profesional] })
      .filter((h) => h.disponible)
      .forEach((h) => { if (resultado.length < cantidad) resultado.push({ fecha, hora: h.hora }) })
  }
  return resultado
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
