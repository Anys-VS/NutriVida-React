// Carrito del paciente para la página Carrito, el contador del menú y el botón "Agregar al carrito".
// Modo 'api': ms-ordenes (ítems por reservar y pago) y ms-citas (citas con pago en clínica pendiente).
// Modo 'local': las reglas del navegador (services/carrito). Ambos modos devuelven la misma forma.
import { usaApi } from '../config/api'
import { carritoApi, citasApi, ordenesApi } from '../api/recursos'
import { citaDesdeApi, itemCarritoDesdeApi, ordenDesdeApi } from '../api/adaptadores'
import { ordenes } from '../data/db'
import { citaTienePagoPendiente } from '../domain/citas'
import { listarServicios } from './catalogo'
import {
  agregarAlCarrito, citasPorPagar, editarItemCarrito, itemsDelCarrito, pagarCarrito,
  quitarDelCarrito, revisarAntesDePagar, vaciarCarrito,
} from './carrito'

async function intentar(accion) {
  try {
    return { ok: true, ...(await accion()) }
  } catch (error) {
    return { ok: false, motivo: error.message, estado: error.estado }
  }
}

const porFecha = (citaA, citaB) => new Date(citaA.fechaHora) - new Date(citaB.fechaHora)

// { items: [...por reservar], pendientes: [...citas agendadas con pago pendiente] }
export async function cargarCarrito(correo) {
  if (!usaApi()) return { items: itemsDelCarrito(correo), pendientes: citasPorPagar(correo) }
  const [carrito, misCitas, servicios] = await Promise.all([carritoApi.listar(), citasApi.mias(), listarServicios()])
  const porCodigo = new Map(servicios.map((servicio) => [servicio.codigo, servicio]))
  return {
    items: carrito.items.map((item) => itemCarritoDesdeApi(item, porCodigo.get(item.codigoServicio))),
    pendientes: misCitas.map(citaDesdeApi).filter(citaTienePagoPendiente).sort(porFecha),
  }
}

export function agregarItem({ correo, codigoServicio, nutricionista, fechaHora, motivo }) {
  if (!usaApi()) return Promise.resolve(agregarAlCarrito({ pacienteCorreo: correo, codigoServicio, nutricionista, fechaHora, motivo }))
  return intentar(async () => ({ item: await carritoApi.agregar({ codigoServicio, fechaHora, nutricionista, motivo }) }))
}

export function editarItem({ correo, id, nutricionista, fechaHora }) {
  if (!usaApi()) return Promise.resolve(editarItemCarrito({ pacienteCorreo: correo, id, nutricionista, fechaHora }))
  return intentar(async () => ({ item: await carritoApi.editarHorario(id, { nutricionista, fechaHora }) }))
}

export function quitarItem(correo, id) {
  if (!usaApi()) return Promise.resolve(quitarDelCarrito(correo, id))
  return intentar(() => carritoApi.quitar(id).then(() => ({})))
}

export function vaciar(correo) {
  if (!usaApi()) return Promise.resolve(vaciarCarrito(correo))
  return intentar(() => carritoApi.vaciar().then(() => ({})))
}

// Revisión previa al pago: [{ id, nombreServicio, motivo }] con lo que ya no se puede pagar.
// En modo 'api' la revisión la hace el backend al cobrar (todo o nada), así que aquí no hay nada que revisar.
export async function revisarPago(correo, itemIds, citaIds) {
  return usaApi() ? [] : revisarAntesDePagar(correo, itemIds, new Date(), citaIds)
}

// Paga los ítems y citas elegidos en una sola orden. Devuelve { ok, orden } o { ok: false, motivo, problemas?, rechazado? }.
export function pagar({ correo, itemIds, citaIds, correoConfirmacion, tarjeta }) {
  if (!usaApi()) return Promise.resolve(pagarCarrito({ pacienteCorreo: correo, ids: itemIds, citaIds, correoConfirmacion }))
  return intentar(async () => ({
    orden: ordenDesdeApi(await carritoApi.pagar({
      tarjeta,
      itemIds: itemIds.map(Number),
      citaIds: citaIds.map(Number),
      correoConfirmacion,
    })),
  })).then((resultado) => (resultado.ok ? resultado : { ...resultado, rechazado: resultado.estado === 402 }))
}

// Comprobante de una orden. null si no existe o no es del paciente.
export async function obtenerOrden(id, correo) {
  if (!usaApi()) {
    const orden = ordenes.obtener(id)
    return orden && orden.pacienteCorreo.toLowerCase() === String(correo).toLowerCase() ? orden : null
  }
  try {
    return ordenDesdeApi(await ordenesApi.obtener(id))
  } catch (error) {
    if (error.estado === 404 || error.estado === 403) return null
    throw error
  }
}
