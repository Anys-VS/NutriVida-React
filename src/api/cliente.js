import axios from 'axios'
import { API_URL, TIEMPO_ESPERA_MS } from '../config/api'
import { borrarTokens, obtenerTokens } from '../auth/almacenTokens'
import { normalizarError } from './errores'

// Cliente HTTP único para hablar con el API Gateway. Todas las llamadas del frontend pasan por aquí.
export const cliente = axios.create({
  baseURL: API_URL,
  timeout: TIEMPO_ESPERA_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// Quién renueva el token cuando el backend responde 401. Lo registra servicioAuth al cargarse
// (así se evita una importación circular entre el cliente y la autenticación).
let renovar = null
export function alRenovar(fn) {
  renovar = fn
}

// 1) Antes de cada petición se agrega el token de acceso, salvo en login, registro y renovación.
cliente.interceptors.request.use((config) => {
  const { acceso } = obtenerTokens()
  if (acceso && !config.sinToken) config.headers.Authorization = `Bearer ${acceso}`
  return config
})

// 2) Si el backend responde 401 (token vencido), se renueva una sola vez y se repite la petición.
//    Si la renovación falla, la sesión se cierra con el aviso "Tu sesión expiró".
//    Cualquier otro error se convierte en ErrorApi con un mensaje para mostrar en pantalla.
cliente.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    const original = error.config
    const puedeReintentar = error.response?.status === 401 && original && !original.sinToken && !original._reintentado
    if (puedeReintentar && renovar) {
      original._reintentado = true
      try {
        await renovar()
        return cliente(original)
      } catch (errorRenovacion) {
        borrarTokens('expirada')
        return Promise.reject(normalizarError(errorRenovacion))
      }
    }
    return Promise.reject(normalizarError(error))
  },
)
