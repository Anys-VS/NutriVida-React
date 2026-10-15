// Pago online simulado. Los datos de la tarjeta no se guardan en ninguna parte.

export function validarTarjeta({ titular, numero, vencimiento, cvv }, ahora = new Date()) {
  const errores = { titular: '', numero: '', vencimiento: '', cvv: '' }

  if (!String(titular ?? '').trim()) errores.titular = 'El nombre del titular es obligatorio.'

  const digitos = String(numero ?? '').replace(/\s/g, '')
  if (!/^\d{16}$/.test(digitos)) errores.numero = 'El número de tarjeta debe tener 16 dígitos.'

  const partes = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(String(vencimiento ?? '').trim())
  if (!partes) {
    errores.vencimiento = 'Usa el formato MM/AA.'
  } else {
    const finDeMes = new Date(2000 + Number(partes[2]), Number(partes[1]), 0, 23, 59, 59)
    if (finDeMes < ahora) errores.vencimiento = 'La tarjeta está vencida.'
  }

  if (!/^\d{3}$/.test(String(cvv ?? '').trim())) errores.cvv = 'El CVV debe tener 3 dígitos.'

  return errores
}

export function hayErrores(errores) {
  return Object.values(errores).some(Boolean)
}

// Para demostrar la vista de pago con error: las tarjetas que terminan en 0000 son rechazadas.
export function procesarPagoSimulado(numero) {
  const digitos = String(numero ?? '').replace(/\s/g, '')
  return digitos.endsWith('0000')
    ? { aprobado: false, motivo: 'El banco rechazó la tarjeta.' }
    : { aprobado: true, motivo: '' }
}
