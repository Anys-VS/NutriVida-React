// Dónde se guardan los tokens:
// - Token de acceso (dura minutos): sessionStorage. Sobrevive a recargar la página y muere al cerrar la pestaña.
// - Token de renovación (dura días): localStorage. Permite recuperar la sesión en otra pestaña o al volver.
// Nunca se guarda la contraseña. Al cerrar sesión se borran ambos y se avisa a las demás pestañas.

export const CLAVE_ACCESO = 'nutrivida_token'
export const CLAVE_RENOVACION = 'nutrivida_renovacion'

const suscriptores = new Set()

function leer(almacen, clave) {
  try { return globalThis[almacen]?.getItem(clave) ?? null } catch { return null }
}
function escribir(almacen, clave, valor) {
  try {
    if (valor) globalThis[almacen]?.setItem(clave, valor)
    else globalThis[almacen]?.removeItem(clave)
  } catch { /* almacenamiento bloqueado: la sesión dura solo mientras la página esté abierta */ }
}

export function obtenerTokens() {
  return { acceso: leer('sessionStorage', CLAVE_ACCESO), renovacion: leer('localStorage', CLAVE_RENOVACION) }
}

function avisar(evento) {
  suscriptores.forEach((fn) => fn(evento))
}

export function guardarTokens({ acceso, renovacion }) {
  escribir('sessionStorage', CLAVE_ACCESO, acceso)
  if (renovacion) escribir('localStorage', CLAVE_RENOVACION, renovacion)
  avisar({ tipo: 'guardado' })
}

// motivo: 'cierre' (el usuario salió) o 'expirada' (no se pudo renovar).
export function borrarTokens(motivo = 'cierre') {
  escribir('sessionStorage', CLAVE_ACCESO, null)
  escribir('localStorage', CLAVE_RENOVACION, null)
  avisar({ tipo: 'borrado', motivo })
}

// Solo el de acceso: se usa cuando otra pestaña inició sesión con otra cuenta.
export function borrarAcceso() {
  escribir('sessionStorage', CLAVE_ACCESO, null)
  avisar({ tipo: 'guardado' })
}

export function suscribir(fn) {
  suscriptores.add(fn)
  return () => suscriptores.delete(fn)
}
