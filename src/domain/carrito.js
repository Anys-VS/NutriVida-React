// Reglas puras del carrito. Un ítem es una cita o un plan con su fecha, hora y nutricionista.
import { REGLAS } from '../config/reglas'

const mismoMomento = (a, b) => new Date(a).getTime() === new Date(b).getTime()

export function totalDe(items) {
  return items.reduce((suma, item) => suma + (Number(item.precio) || 0), 0)
}

// Un paciente no puede estar en dos atenciones a la misma hora: ni dos ítems del carrito
// ni un ítem que choque con una cita suya que ya esté activa.
export function choqueDeHorario({ fechaHora, items = [], citasDelPaciente = [], excluirId = null }) {
  if (items.some((item) => item.id !== excluirId && mismoMomento(item.fechaHora, fechaHora))) {
    return 'Ya tienes en el carrito otra atención a esa misma hora.'
  }
  if (citasDelPaciente.some((cita) => mismoMomento(cita.fechaHora, fechaHora))) {
    return 'Ya tienes una cita agendada a esa misma hora.'
  }
  return ''
}

export function carritoLleno(items) {
  return items.length >= REGLAS.MAXIMO_ITEMS_CARRITO
}

// Separa los ítems elegidos para pagar; si no se indica ninguno, se paga todo.
export function seleccionarItems(items, ids) {
  if (!ids || ids.length === 0) return items
  const elegidos = new Set(ids)
  return items.filter((item) => elegidos.has(item.id))
}
