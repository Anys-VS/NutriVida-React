// Carrito de citas y planes. Cada paciente tiene su propio carrito y paga en una sola orden
// los ítems que elija (uno, varios o todos). La orden equivale a la BOLETA y sus ítems al DETALLE.
import { carrito, citas, ordenes, planes, servicios } from '../data/db'
import { ESTADO_CITA, ESTADO_PAGO, METODO_PAGO, REGLAS, TIPO_SERVICIO } from '../config/reglas'
import { citaTienePagoPendiente, evaluarReserva, hayDisponibilidad } from '../domain/citas'
import { carritoLleno, choqueDeHorario, seleccionarItems, totalDe } from '../domain/carrito'
import { precioFinal } from '../domain/precios'
import { pagarCita, reservarCita } from './reservas'
import { contratarPlan } from './planes'

const generarId = (prefijo, ahora) =>
  prefijo + new Date(ahora).getTime().toString(36) + Math.random().toString(36).slice(2, 6)

const mismoCorreo = (a, b) => String(a).toLowerCase() === String(b).toLowerCase()
const ACTIVAS = [ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA]

export function itemsDelCarrito(pacienteCorreo) {
  return carrito
    .listar()
    .filter((item) => mismoCorreo(item.pacienteCorreo, pacienteCorreo))
    .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
}

const citasActivasDe = (pacienteCorreo) =>
  citas.listar().filter((c) => mismoCorreo(c.pacienteCorreo, pacienteCorreo) && ACTIVAS.includes(c.estadoCita))

// Revisa un ítem con las mismas reglas que una reserva pagada online (RN-03, RN-08, RN-12, RN-14).
function revisarItem({ servicio, nutricionista, fechaHora, pacienteCorreo, items, excluirId, ahora }) {
  if (!servicio) return 'El servicio ya no existe.'
  const esPlan = servicio.tipo === TIPO_SERVICIO.PLAN
  if (esPlan && !servicio.sesiones) return 'Este plan aún no tiene sesiones definidas.'
  const evaluacion = evaluarReserva({ fechaHora, metodoPago: METODO_PAGO.ONLINE, esPlan, ahora })
  if (!evaluacion.ok) return evaluacion.motivo
  const choque = choqueDeHorario({ fechaHora, items, citasDelPaciente: citasActivasDe(pacienteCorreo), excluirId })
  if (choque) return choque
  if (!hayDisponibilidad({ servicio, nutricionista, fechaHora, citas: citas.listar() })) {
    return 'Ese horario ya no está disponible.'
  }
  return ''
}

export function agregarAlCarrito({ pacienteCorreo, codigoServicio, nutricionista = '', fechaHora, motivo = '', ahora = new Date() }) {
  const items = itemsDelCarrito(pacienteCorreo)
  if (carritoLleno(items)) {
    return { ok: false, motivo: `El carrito admite hasta ${REGLAS.MAXIMO_ITEMS_CARRITO} ítems. Paga o quita alguno antes de agregar otro.` }
  }
  const servicio = servicios.obtener(codigoServicio)
  const problema = revisarItem({ servicio, nutricionista, fechaHora, pacienteCorreo, items, ahora })
  if (problema) return { ok: false, motivo: problema }

  const item = {
    id: generarId('I', ahora),
    pacienteCorreo,
    codigoServicio,
    nombreServicio: servicio.nombre,
    tipo: servicio.tipo,
    sesiones: servicio.sesiones ?? null,
    nutricionista,
    fechaHora: new Date(fechaHora).toISOString(),
    motivo: motivo.trim(),
    precio: precioFinal(servicio),
    agregadoEn: new Date(ahora).toISOString(),
  }
  carrito.crear(item)
  return { ok: true, item }
}

export function quitarDelCarrito(pacienteCorreo, id) {
  const item = carrito.obtener(id)
  if (!item || !mismoCorreo(item.pacienteCorreo, pacienteCorreo)) return { ok: false, motivo: 'Ese ítem no está en tu carrito.' }
  carrito.eliminar(id)
  return { ok: true }
}

export function vaciarCarrito(pacienteCorreo) {
  itemsDelCarrito(pacienteCorreo).forEach((item) => carrito.eliminar(item.id))
  return { ok: true }
}

// Antes de cobrar se revisa cada ítem elegido: si alguno ya no se puede reservar no se cobra nada.
export function revisarAntesDePagar(pacienteCorreo, ids, ahora = new Date()) {
  const todos = itemsDelCarrito(pacienteCorreo)
  const elegidos = seleccionarItems(todos, ids)
  return elegidos
    .map((item) => ({
      id: item.id,
      nombreServicio: item.nombreServicio,
      motivo: revisarItem({
        servicio: servicios.obtener(item.codigoServicio),
        nutricionista: item.nutricionista,
        fechaHora: item.fechaHora,
        pacienteCorreo,
        items: elegidos,
        excluirId: item.id,
        ahora,
      }),
    }))
    .filter((revision) => revision.motivo)
}

// Paga los ítems elegidos (o todos) en una sola orden. Todo o nada: si algo falla a mitad
// de camino se deshacen las citas y planes ya creados.
export function pagarCarrito({ pacienteCorreo, ids = [], correoConfirmacion = pacienteCorreo, ahora = new Date() }) {
  const elegidos = seleccionarItems(itemsDelCarrito(pacienteCorreo), ids)
  if (elegidos.length === 0) return { ok: false, motivo: 'No hay ítems seleccionados para pagar.' }

  const problemas = revisarAntesDePagar(pacienteCorreo, elegidos.map((i) => i.id), ahora)
  if (problemas.length > 0) {
    return { ok: false, motivo: 'Algunos ítems ya no se pueden reservar. Cámbialos o quítalos y vuelve a intentar.', problemas }
  }

  const ordenId = generarId('O', ahora)
  const creados = []
  for (const item of elegidos) {
    const datos = {
      pacienteCorreo,
      correoConfirmacion,
      codigoServicio: item.codigoServicio,
      nutricionista: item.nutricionista,
      fechaHora: item.fechaHora,
      motivo: item.motivo,
      ordenId,
      ahora,
    }
    const resultado = item.tipo === TIPO_SERVICIO.PLAN
      ? contratarPlan(datos)
      : reservarCita({ ...datos, metodoPago: METODO_PAGO.ONLINE })
    if (!resultado.ok) {
      creados.forEach(({ cita, plan }) => {
        citas.eliminar(cita.id)
        if (plan) planes.eliminar(plan.id)
      })
      return { ok: false, motivo: `No se pudo reservar "${item.nombreServicio}": ${resultado.motivo} No se realizó ningún cobro.` }
    }
    creados.push({ item, cita: resultado.cita, plan: resultado.plan })
  }

  const orden = {
    id: ordenId,
    pacienteCorreo,
    tipoOrden: 'Carrito',
    fecha: new Date(ahora).toISOString(),
    metodoPago: METODO_PAGO.ONLINE,
    estadoPago: ESTADO_PAGO.PAGADO,
    detalle: creados.map(({ item, cita, plan }) => ({
      codigoServicio: item.codigoServicio,
      nombreServicio: item.nombreServicio,
      fechaHora: cita.fechaHora,
      nutricionista: cita.nutricionista,
      precio: item.precio,
      citaId: cita.id,
      planId: plan?.id ?? null,
    })),
    total: totalDe(elegidos),
  }
  ordenes.crear(orden)
  elegidos.forEach((item) => carrito.eliminar(item.id))
  return { ok: true, orden }
}

// Paga en una sola orden una o varias citas que quedaron con pago pendiente (pago en clínica).
export function pagarCitasPendientes({ pacienteCorreo, ids, ahora = new Date() }) {
  const elegidas = citas.listar().filter((c) => ids.includes(c.id) && mismoCorreo(c.pacienteCorreo, pacienteCorreo))
  if (elegidas.length === 0 || elegidas.length !== ids.length) return { ok: false, motivo: 'Selecciona citas tuyas con pago pendiente.' }
  if (!elegidas.every(citaTienePagoPendiente)) return { ok: false, motivo: 'Una de las citas elegidas ya no tiene pago pendiente.' }

  const ordenId = generarId('O', ahora)
  const pagadas = elegidas.map((cita) => pagarCita(cita.id).cita)
  pagadas.forEach((cita) => citas.actualizar(cita.id, { ordenId }))
  const orden = {
    id: ordenId,
    pacienteCorreo,
    tipoOrden: 'Pago de citas pendientes',
    fecha: new Date(ahora).toISOString(),
    metodoPago: METODO_PAGO.ONLINE,
    estadoPago: ESTADO_PAGO.PAGADO,
    detalle: pagadas.map((cita) => ({
      codigoServicio: cita.codigoServicio,
      nombreServicio: cita.nombreServicio,
      fechaHora: cita.fechaHora,
      nutricionista: cita.nutricionista,
      precio: cita.precio,
      citaId: cita.id,
      planId: null,
    })),
    total: pagadas.reduce((suma, cita) => suma + cita.precio, 0),
  }
  ordenes.crear(orden)
  return { ok: true, orden }
}

export function ordenesDePaciente(pacienteCorreo) {
  return ordenes
    .listar()
    .filter((o) => mismoCorreo(o.pacienteCorreo, pacienteCorreo))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}
