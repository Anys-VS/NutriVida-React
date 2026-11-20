// Ficha clínica del paciente de la sesión para "Mi progreso".
// Modo 'api': ms-clinico (GET /api/v1/fichas/mia; 404 = aún no tiene ficha). Modo 'local': services/clinico.
import { usaApi } from '../config/api'
import { fichasApi } from '../api/recursos'
import { fichaDesdeApi } from '../api/adaptadores'
import { obtenerFicha } from './clinico'

export async function cargarMiFicha(sesion) {
  if (!usaApi()) {
    const resultado = obtenerFicha(sesion.correo, sesion)
    return resultado.ok ? resultado.ficha : null
  }
  try {
    return fichaDesdeApi(await fichasApi.mia())
  } catch (error) {
    if (error.estado === 404) return null // todavía no tiene ficha: la página muestra "Aún no tienes registros"
    throw error
  }
}
