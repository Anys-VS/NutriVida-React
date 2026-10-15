import { citas, servicios } from '../data/db'
import { ESTADO_CITA, ESTADO_PAGO, METODO_PAGO, TIPO_SERVICIO } from '../config/reglas'
import {
  evaluarReserva,
  hayDisponibilidad,
  debeCancelarsePorFaltaDeConfirmacion,
  puedeCancelarPaciente,
} from '../domain/citas'
import { reembolsoCita } from '../domain/reembolsos'
import { precioFinal } from '../domain/precios'
import { actualizarEstadoPlan } from './planes'

function generarId(ahora) {
  return 'C' + new Date(ahora).getTime().toString(36) + Math.random().toString(36).slice(2, 6)
}

// Orquesta la reserva: aplica las reglas del dominio y persiste la cita.
export function reservarCita({
  pacienteCorreo,
  correoConfirmacion = pacienteCorreo,
  codigoServicio,
  nutricionista = '',
  fechaHora,
  metodoPago,
  ahora = new Date(),
}) {
  const servicio = servicios.obtener(codigoServicio)
  if (!servicio) return { ok: false, motivo: 'El servicio no existe.' }

  const evaluacion = evaluarReserva({
    fechaHora,
    metodoPago,
    esPlan: servicio.tipo === TIPO_SERVICIO.PLAN,
    ahora,
  })
  if (!evaluacion.ok) return evaluacion

  if (!hayDisponibilidad({ servicio, nutricionista, fechaHora, citas: citas.listar() })) {
    return { ok: false, motivo: 'Ese horario ya no está disponible.' }
  }

  const precio = precioFinal(servicio)
  const cita = {
    id: generarId(ahora),
    pacienteCorreo,
    correoConfirmacion,
    codigoServicio,
    nombreServicio: servicio.nombre,
    nutricionista,
    fechaHora: new Date(fechaHora).toISOString(),
    metodoPago,
    estadoCita: evaluacion.estadoCita,
    estadoPago: evaluacion.estadoPago,
    limiteConfirmacion: evaluacion.limiteConfirmacion,
    precio,
    montoPagado: evaluacion.estadoPago === ESTADO_PAGO.PAGADO ? precio : 0,
    montoReembolsado: 0,
    creadaEn: new Date(ahora).toISOString(),
  }
  citas.crear(cita)
  return { ok: true, cita }
}

export function citasDePaciente(correo) {
  const buscado = String(correo).toLowerCase()
  return citas
    .listar()
    .filter((c) => c.pacienteCorreo.toLowerCase() === buscado)
    .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
}

// RN-06: cancela las citas "Por confirmar" cuyo plazo venció y libera su horario.
export function cancelarCitasVencidas(ahora = new Date()) {
  let canceladas = 0
  citas.listar().forEach((cita) => {
    if (debeCancelarsePorFaltaDeConfirmacion(cita, ahora)) {
      citas.actualizar(cita.id, { estadoCita: ESTADO_CITA.CANCELADA })
      canceladas += 1
    }
  })
  return canceladas
}

// RN-05: el paciente confirma su asistencia.
export function confirmarAsistencia(id, ahora = new Date()) {
  const cita = citas.obtener(id)
  if (!cita || cita.estadoCita !== ESTADO_CITA.POR_CONFIRMAR) {
    return { ok: false, motivo: 'Esta cita no está pendiente de confirmación.' }
  }
  if (debeCancelarsePorFaltaDeConfirmacion(cita, ahora)) {
    citas.actualizar(id, { estadoCita: ESTADO_CITA.CANCELADA })
    return { ok: false, motivo: 'El plazo para confirmar venció y la cita fue cancelada.' }
  }
  return { ok: true, cita: citas.actualizar(id, { estadoCita: ESTADO_CITA.CONFIRMADA, limiteConfirmacion: null }) }
}

// RN-05 y RN-03: pagar online deja el pago Pagado y confirma la cita.
export function pagarCita(id) {
  const cita = citas.obtener(id)
  if (!cita || cita.estadoPago !== ESTADO_PAGO.PENDIENTE) {
    return { ok: false, motivo: 'Esta cita no tiene un pago pendiente.' }
  }
  if (![ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA].includes(cita.estadoCita)) {
    return { ok: false, motivo: 'No se puede pagar una cita cancelada o finalizada.' }
  }
  const cambios = {
    metodoPago: METODO_PAGO.ONLINE,
    estadoPago: ESTADO_PAGO.PAGADO,
    montoPagado: cita.precio,
    estadoCita: ESTADO_CITA.CONFIRMADA,
    limiteConfirmacion: null,
  }
  return { ok: true, cita: citas.actualizar(id, cambios) }
}

// RN-09 y RN-11: cancelación por el paciente. Si pagó online, el reembolso queda
// pendiente hasta que el administrador lo registre (igual que en una inasistencia).
export function cancelarCita(id, ahora = new Date()) {
  const cita = citas.obtener(id)
  if (!cita) return { ok: false, motivo: 'La cita no existe.' }
  if (!puedeCancelarPaciente(cita, ahora)) {
    return { ok: false, motivo: 'Con menos de 2 h de anticipación no se puede cancelar en línea. Llama a la clínica.' }
  }
  const actualizada = citas.actualizar(id, { estadoCita: ESTADO_CITA.CANCELADA })
  return { ok: true, cita: actualizada, reembolsoPendiente: reembolsoCita(actualizada) }
}

// ---- Acciones del personal (administrador y recepción) ----

function transicion(id, desde, hacia, motivoError) {
  const cita = citas.obtener(id)
  if (!cita || !desde.includes(cita.estadoCita)) return { ok: false, motivo: motivoError }
  return { ok: true, cita: citas.actualizar(id, { estadoCita: hacia }) }
}

// RN-10: recepción marca la asistencia desde el panel.
export function marcarAtendida(id) {
  const resultado = transicion(id, [ESTADO_CITA.CONFIRMADA], ESTADO_CITA.ATENDIDA, 'Solo se puede marcar como atendida una cita confirmada.')
  if (resultado.ok && resultado.cita.planId) actualizarEstadoPlan(resultado.cita.planId)
  return resultado
}

export function marcarInasistencia(id) {
  return transicion(id, [ESTADO_CITA.CONFIRMADA], ESTADO_CITA.INASISTENCIA, 'Solo se puede marcar inasistencia en una cita confirmada.')
}

// RN-09: con menos de 2 h el paciente llama y la recepción cancela.
export function cancelarPorClinica(id) {
  return transicion(id, [ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA], ESTADO_CITA.CANCELADA, 'Esta cita ya no se puede cancelar.')
}

// El paciente paga en la clínica el día de su atención.
export function registrarPagoEnClinica(id) {
  const cita = citas.obtener(id)
  const estadosValidos = [ESTADO_CITA.CONFIRMADA, ESTADO_CITA.ATENDIDA]
  if (!cita || cita.estadoPago !== ESTADO_PAGO.PENDIENTE || !estadosValidos.includes(cita.estadoCita)) {
    return { ok: false, motivo: 'Solo se puede registrar el pago de una cita confirmada o atendida con pago pendiente.' }
  }
  return { ok: true, cita: citas.actualizar(id, { estadoPago: ESTADO_PAGO.PAGADO, montoPagado: cita.precio }) }
}

// RN-11: el admin registra la devolución del 100% de una cita pagada online.
export function registrarReembolso(id) {
  const cita = citas.obtener(id)
  const monto = cita ? reembolsoCita(cita) : 0
  if (monto <= 0) return { ok: false, motivo: 'Esta cita no tiene un reembolso pendiente.' }
  const actualizada = citas.actualizar(id, { estadoPago: ESTADO_PAGO.REEMBOLSADO_TOTAL, montoReembolsado: monto })
  return { ok: true, cita: actualizada, reembolso: monto }
}
