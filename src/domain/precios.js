// Precio final de un servicio considerando su descuento (porcentaje, 0 a 100).
export function precioFinal(servicio) {
  const descuento = Number(servicio.descuento) || 0
  return Math.round(servicio.precio * (1 - descuento / 100))
}
