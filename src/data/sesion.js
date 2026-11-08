// La sesión de usuario ahora vive en los tokens JWT (ver src/auth/almacenTokens.js).
const CLAVE_BORRADOR = 'nutrivida_borrador'

// Borrador de la reserva en curso: dura mientras la pestaña esté abierta.
export function guardarBorrador(borrador) {
  try { sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador)) } catch { /* sin almacenamiento */ }
}

export function leerBorrador() {
  try {
    const valor = sessionStorage.getItem(CLAVE_BORRADOR)
    return valor ? JSON.parse(valor) : null
  } catch {
    return null
  }
}

export function limpiarBorrador() {
  try { sessionStorage.removeItem(CLAVE_BORRADOR) } catch { /* sin almacenamiento */ }
}
