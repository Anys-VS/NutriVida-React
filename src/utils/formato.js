const formatoPesos = new Intl.NumberFormat('es-CL')

export function formatearPrecioCLP(valor) {
  return '$' + formatoPesos.format(Number(valor) || 0)
}

export function formatearFechaHora(iso) {
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'short' })
}

export function fechaLocalISO(fecha = new Date()) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}
