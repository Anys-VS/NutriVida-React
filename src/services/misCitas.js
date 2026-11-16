// Datos y acciones de "Mis citas" para el paciente de la sesión.
// Modo 'api': ms-citas (citas, confirmar, cancelar) y ms-ordenes (compras).
// Modo 'local': las reglas del navegador (services/reservas, planes y carrito).
// Ambos devuelven la misma forma, así la página no sabe de dónde vienen los datos.
import { usaApi } from '../config/api'
import { citasApi, ordenesApi } from '../api/recursos'
import { citaDesdeApi, ordenDesdeApi } from '../api/adaptadores'
import { cancelarCita, cancelarCitasVencidas, citasDePaciente, confirmarAsistencia } from './reservas'
import { planesDePaciente } from './planes'
import { ordenesDePaciente } from './carrito'

const porFecha = (citaA, citaB) => new Date(citaA.fechaHora) - new Date(citaB.fechaHora)

export async function cargarMisCitas(correo) {
  if (!usaApi()) {
    // RN-06: en modo local, al entrar se cancelan las citas cuyo plazo de confirmación venció
    // (en el backend lo hace una tarea programada cada 15 minutos).
    const canceladas = cancelarCitasVencidas()
    return { citas: citasDePaciente(correo), planes: planesDePaciente(correo), ordenes: ordenesDePaciente(correo), canceladas }
  }
  const [citas, ordenes] = await Promise.all([
    citasApi.mias(),
    ordenesApi.mias().catch(() => []), // si ms-ordenes no responde, igual se muestran las citas
  ])
  return { citas: citas.map(citaDesdeApi).sort(porFecha), planes: [], ordenes: ordenes.map(ordenDesdeApi), canceladas: 0 }
}

// Las acciones devuelven { ok, motivo } igual que las reglas locales.
async function intentar(accion) {
  try {
    return { ok: true, ...(await accion()) }
  } catch (error) {
    return { ok: false, motivo: error.message }
  }
}

export function confirmarMiCita(id) {
  if (!usaApi()) return Promise.resolve(confirmarAsistencia(id))
  return intentar(async () => ({ cita: citaDesdeApi(await citasApi.confirmar(id)) }))
}

export function cancelarMiCita(id) {
  if (!usaApi()) return Promise.resolve(cancelarCita(id))
  return intentar(async () => {
    const respuesta = await citasApi.cancelar(id) // { cita, reembolsoPendiente }
    return { cita: citaDesdeApi(respuesta.cita), reembolsoPendiente: Number(respuesta.reembolsoPendiente ?? 0) }
  })
}
