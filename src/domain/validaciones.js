// Cada validador devuelve '' si el valor es válido, o el mensaje de error.

function digitoVerificador(cuerpo) {
  let suma = 0
  let multiplo = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo
    multiplo = multiplo === 7 ? 2 : multiplo + 1
  }
  const resto = 11 - (suma % 11)
  if (resto === 11) return '0'
  if (resto === 10) return 'K'
  return String(resto)
}

export function validarRUN(valor) {
  const run = String(valor ?? '').trim().toUpperCase()
  if (!run) return 'El RUN es obligatorio.'
  if (/[.-]/.test(run)) return 'Ingresa el RUN sin puntos ni guion.'
  if (run.length < 7 || run.length > 9) return 'El RUN debe tener entre 7 y 9 caracteres.'

  const cuerpo = run.slice(0, -1)
  const dv = run.slice(-1)
  if (!/^\d+$/.test(cuerpo) || !/^[0-9K]$/.test(dv)) {
    return 'El RUN solo puede contener números y, al final, un dígito verificador.'
  }
  if (digitoVerificador(cuerpo) !== dv) return 'El dígito verificador del RUN no es válido.'
  return ''
}

export function validarCorreo(valor) {
  const correo = String(valor ?? '').trim()
  if (!correo) return 'El correo es obligatorio.'
  if (correo.length > 100) return 'El correo no puede superar los 100 caracteres.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return 'Ingresa un correo electrónico válido.'
  return ''
}

const DOMINIOS_RESERVA = ['duoc.cl', 'profesor.duoc.cl', 'gmail.com']

// Regla propia de la reserva: el correo de confirmación solo acepta estos dominios.
export function validarCorreoReserva(valor) {
  const error = validarCorreo(valor)
  if (error) return error
  const dominio = String(valor).trim().split('@')[1].toLowerCase()
  return DOMINIOS_RESERVA.includes(dominio)
    ? ''
    : 'Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com.'
}

export function validarContrasena(valor) {
  const contrasena = String(valor ?? '')
  if (!contrasena) return 'La contraseña es obligatoria.'
  if (contrasena.length < 4 || contrasena.length > 10) {
    return 'La contraseña debe tener entre 4 y 10 caracteres.'
  }
  return ''
}

export function validarTexto(valor, { etiqueta, maximo, minimo = 1, requerido = true }) {
  const texto = String(valor ?? '').trim()
  if (!texto) return requerido ? `${etiqueta} es obligatorio.` : ''
  if (texto.length < minimo) return `${etiqueta} debe tener al menos ${minimo} caracteres.`
  if (maximo && texto.length > maximo) return `${etiqueta} no puede superar los ${maximo} caracteres.`
  return ''
}

export function validarNumero(valor, { etiqueta, minimo = 0, maximo, entero = false, requerido = true }) {
  const texto = String(valor ?? '').trim()
  if (texto === '') return requerido ? `${etiqueta} es obligatorio.` : ''
  const numero = Number(texto)
  if (!Number.isFinite(numero)) return `${etiqueta} debe ser un número.`
  if (entero && !Number.isInteger(numero)) return `${etiqueta} debe ser un número entero.`
  if (numero < minimo) return `${etiqueta} debe ser igual o mayor a ${minimo}.`
  if (maximo !== undefined && numero > maximo) return `${etiqueta} no puede superar ${maximo}.`
  return ''
}
