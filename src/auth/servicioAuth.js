// Autenticación del frontend: login, registro, renovación y cierre de sesión con JWT.
// En modo 'api' habla con ms-usuarios por HTTP; en modo 'local' usa la simulación del navegador.
import { cliente, alRenovar } from '../api/cliente'
import { ErrorApi, normalizarError } from '../api/errores'
import { usaApi } from '../config/api'
import { borrarTokens, guardarTokens, obtenerTokens } from './almacenTokens'
import { sesionDesdeToken } from './jwt'
import { servidorLocal } from './servidorLocal'

// Respuesta esperada del backend: { "accessToken": "...", "refreshToken": "..." }
const tokensDe = ({ data }) => ({ acceso: data.accessToken, renovacion: data.refreshToken })

const servidorApi = {
  login: (correo, contrasena) => cliente.post('/auth/login', { correo, contrasena }, { sinToken: true }).then(tokensDe),
  registrar: (datos) => cliente.post('/auth/registro', datos, { sinToken: true }).then(tokensDe),
  renovar: (renovacion) => cliente.post('/auth/refresh', { refreshToken: renovacion }, { sinToken: true }).then(tokensDe),
  cerrar: (renovacion) => cliente.post('/auth/logout', { refreshToken: renovacion }, { sinToken: true }),
}

const servidor = () => (usaApi() ? servidorApi : servidorLocal)

function resultadoError(error, mensaje401) {
  const e = normalizarError(error)
  const motivo = e.estado === 401 && !e.delServidor ? mensaje401 : e.message
  return { ok: false, motivo, errores: e.errores }
}

export async function iniciarSesion(correo, contrasena) {
  try {
    const tokens = await servidor().login(correo, contrasena)
    guardarTokens(tokens)
    return { ok: true, sesion: sesionDesdeToken(tokens.acceso) }
  } catch (error) {
    return resultadoError(error, 'Correo o contraseña incorrectos.')
  }
}

export async function registrar(datos) {
  try {
    const tokens = await servidor().registrar(datos)
    guardarTokens(tokens)
    return { ok: true, sesion: sesionDesdeToken(tokens.acceso) }
  } catch (error) {
    return resultadoError(error, 'No pudimos crear la cuenta.')
  }
}

// Una sola renovación a la vez: si varias peticiones reciben 401 juntas, todas esperan la misma.
let renovacionEnCurso = null
export function renovarSesion() {
  if (!renovacionEnCurso) {
    const { renovacion } = obtenerTokens()
    const pedido = renovacion
      ? servidor().renovar(renovacion)
      : Promise.reject(new ErrorApi(401, 'No hay una sesión que renovar.'))
    renovacionEnCurso = pedido
      .then((tokens) => {
        guardarTokens(tokens)
        return tokens
      })
      .finally(() => {
        renovacionEnCurso = null
      })
  }
  return renovacionEnCurso
}
alRenovar(renovarSesion)

// Cierra la sesión aquí y avisa al backend para que invalide el token de renovación.
export async function cerrarSesion() {
  const { renovacion } = obtenerTokens()
  borrarTokens('cierre')
  if (renovacion) await servidor().cerrar(renovacion).catch(() => {})
}
