import { leer, escribir } from './db'

const CLAVE_SESION = 'nutrivida_sesion'
const CLAVE_BORRADOR = 'nutrivida_borrador'

export const obtenerSesion = () => leer(CLAVE_SESION, null)

export function guardarSesion(usuario) {
  const sesion = {
    run: usuario.run,
    correo: usuario.correo,
    nombre: usuario.nombre,
    apellidos: usuario.apellidos,
    tipoUsuario: usuario.tipoUsuario,
  }
  escribir(CLAVE_SESION, sesion)
  return sesion
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE_SESION)
}

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
