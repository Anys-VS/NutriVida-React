// Simulación del servicio de autenticación (ms-usuarios) para el modo 'local'.
// Emite tokens con el mismo formato y los mismos datos que emitirá el backend, para que el
// frontend funcione igual en ambos modos. Estos tokens NO van firmados: la seguridad real la
// da el backend con Spring Security, BCrypt y la firma del JWT.
import { usuarios } from '../data/db'
import { iniciarSesion, registrarPaciente } from '../services/auth'
import { ErrorApi } from '../api/errores'
import { codificarBase64Url, estaVigente, leerClaims } from './jwt'

export const DURACION_ACCESO_S = 15 * 60 // 15 minutos
export const DURACION_RENOVACION_S = 7 * 24 * 60 * 60 // 7 días

function firmar(claims, segundos, ahora = Date.now()) {
  const iat = Math.floor(ahora / 1000)
  const cabecera = codificarBase64Url({ alg: 'none', typ: 'JWT' })
  const cuerpo = codificarBase64Url({ ...claims, iat, exp: iat + segundos })
  return `${cabecera}.${cuerpo}.local`
}

export function emitirTokens(usuario, ahora = Date.now()) {
  const datos = { sub: usuario.correo, run: usuario.run, nombre: usuario.nombre, apellidos: usuario.apellidos, rol: usuario.tipoUsuario }
  return {
    acceso: firmar({ ...datos, tipo: 'acceso' }, DURACION_ACCESO_S, ahora),
    renovacion: firmar({ sub: usuario.correo, tipo: 'renovacion' }, DURACION_RENOVACION_S, ahora),
  }
}

const simularRed = (fn) => new Promise((resolver, rechazar) => {
  try { resolver(fn()) } catch (error) { rechazar(error) }
})

export const servidorLocal = {
  login: (correo, contrasena) => simularRed(() => {
    const resultado = iniciarSesion(correo, contrasena)
    if (!resultado.ok) throw new ErrorApi(401, resultado.motivo, { delServidor: true })
    return emitirTokens(resultado.usuario)
  }),

  registrar: (datos) => simularRed(() => {
    const resultado = registrarPaciente(datos)
    if (!resultado.ok) throw new ErrorApi(409, resultado.motivo, { delServidor: true })
    return emitirTokens(resultado.usuario)
  }),

  // Renovar vuelve a leer al usuario: si fue desactivado o cambió su rol, el nuevo token lo refleja.
  renovar: (renovacion) => simularRed(() => {
    const claims = leerClaims(renovacion)
    if (claims?.tipo !== 'renovacion' || !estaVigente(renovacion)) {
      throw new ErrorApi(401, 'Tu sesión expiró. Vuelve a iniciar sesión.', { delServidor: true })
    }
    const usuario = usuarios.listar().find((u) => u.correo.toLowerCase() === String(claims.sub).toLowerCase())
    if (!usuario || usuario.activo === false) {
      throw new ErrorApi(401, 'Tu cuenta ya no tiene acceso. Comunícate con la clínica.', { delServidor: true })
    }
    return emitirTokens(usuario)
  }),

  cerrar: () => Promise.resolve(),
}
