// Carrito de citas y planes. Cada paciente tiene su propio carrito y paga en una sola orden
// lo que elija (uno, varios o todo). La orden equivale a la BOLETA y sus líneas al DETALLE.
// El carrito reúne dos cosas:
// - Ítems por reservar: servicio + horario elegidos, que se reservan recién al pagar.
// - Citas ya agendadas con pago pendiente (pago en clínica), que se pueden pagar aquí junto con lo demás.
import { carrito, citas, ordenes, planes, servicios } from '../data/db'
import { ESTADO_CITA, ESTADO_PAGO, METODO_PAGO, REGLAS, TIPO_SERVICIO } from '../config/reglas'
import { citaTienePagoPendiente, evaluarReserva, hayDisponibilidad } from '../domain/citas'
import { carritoLleno, choqueDeHorario, seleccionarItems, totalDe } from '../domain/carrito'
import { precioFinal } from '../domain/precios'
import { pagarCita, reservarCita } from './reservas'
import { contratarPlan } from './planes'

const generarId = (prefijo, ahora) =>
  prefijo + new Date(ahora).getTime().toString(36) + Math.random().toString(36).slice(2, 6)

const mismoCorreo = (correoA, correoB) => String(correoA).toLowerCase() === String(correoB).toLowerCase()
const ACTIVAS = [ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA]

export function itemsDelCarrito(pacienteCorreo) {
  return carrito
    .listar()
    .filter((item) => mismoCorreo(item.pacienteCorreo, pacienteCorreo))
    .sort(porFecha)
}

// Ordena por fecha; los planes sin sesión agendada quedan al final.
function porFecha(itemA, itemB) {
  if (!itemA.fechaHora || !itemB.fechaHora) return Number(!itemA.fechaHora) - Number(!itemB.fechaHora)
  return new Date(itemA.fechaHora) - new Date(itemB.fechaHora)
}

// Citas ya agendadas del paciente que aún no se pagan (aparecen en el carrito para pagarlas).
export function citasPorPagar(pacienteCorreo) {
  return citas
    .listar()
    .filter((cita) => mismoCorreo(cita.pacienteCorreo, pacienteCorreo) && citaTienePagoPendiente(cita))
    .sort((citaA, citaB) => new Date(citaA.fechaHora) - new Date(citaB.fechaHora))
}

const citasActivasDe = (pacienteCorreo) =>
  citas.listar().filter((cita) => mismoCorreo(cita.pacienteCorreo, pacienteCorreo) && ACTIVAS.includes(cita.estadoCita))

// Revisa un ítem con las mismas reglas que una reserva pagada online (RN-03, RN-08, RN-12, RN-14).
// Un plan puede ir sin horario: su primera sesión se agenda después, así que no hay fecha que revisar.
function revisarItem({ servicio, nutricionista, fechaHora, pacienteCorreo, items, excluirId, ahora }) {
  if (!servicio) return 'El servicio ya no existe.'
  const esPlan = servicio.tipo === TIPO_SERVICIO.PLAN
  if (esPlan && !servicio.sesiones) return 'Este plan aún no tiene sesiones definidas.'
  if (!fechaHora) return esPlan ? '' : 'Elige una fecha y un horario para esta atención.'
  const evaluacion = evaluarReserva({ fechaHora, metodoPago: METODO_PAGO.ONLINE, esPlan, ahora })
  if (!evaluacion.ok) return evaluacion.motivo
  const choque = choqueDeHorario({ fechaHora, items, citasDelPaciente: citasActivasDe(pacienteCorreo), excluirId })
  if (choque) return choque
  if (!hayDisponibilidad({ servicio, nutricionista, fechaHora, citas: citas.listar() })) {
    return 'Ese horario ya no está disponible.'
  }
  return ''
}

export function agregarAlCarrito({ pacienteCorreo, codigoServicio, nutricionista = '', fechaHora = null, motivo = '', ahora = new Date() }) {
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
    nutricionista: fechaHora ? nutricionista : '',
    fechaHora: fechaHora ? new Date(fechaHora).toISOString() : null,
    motivo: motivo.trim(),
    precio: precioFinal(servicio),
    agregadoEn: new Date(ahora).toISOString(),
  }
  carrito.crear(item)
  return { ok: true, item }
}

// Cambia el horario (fecha, hora y nutricionista) de un ítem del carrito, con las mismas reglas
// que al agregarlo. El ítem no choca consigo mismo; con los demás ítems y citas, sí.
export function editarItemCarrito({ pacienteCorreo, id, nutricionista = '', fechaHora, ahora = new Date() }) {
  const item = carrito.obtener(id)
  if (!item || !mismoCorreo(item.pacienteCorreo, pacienteCorreo)) return { ok: false, motivo: 'Ese ítem no está en tu carrito.' }
  if (!fechaHora) return { ok: false, motivo: 'Elige una fecha y un horario.' }
  const mismoHorario = Boolean(item.fechaHora) && new Date(fechaHora).getTime() === new Date(item.fechaHora).getTime() && nutricionista === item.nutricionista
  if (mismoHorario) return { ok: false, motivo: 'Elige una fecha, hora o nutricionista distinto al actual.' }

  const problema = revisarItem({
    servicio: servicios.obtener(item.codigoServicio),
    nutricionista,
    fechaHora,
    pacienteCorreo,
    items: itemsDelCarrito(pacienteCorreo),
    excluirId: id,
    ahora,
  })
  if (problema) return { ok: false, motivo: problema }
  return { ok: true, item: carrito.actualizar(id, { nutricionista, fechaHora: new Date(fechaHora).toISOString() }) }
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

// Qué se va a pagar. Sin indicar nada se paga todo (ítems y citas pendientes);
// si se indica una lista, solo lo que está en ella.
function elegirParaPagar(pacienteCorreo, ids, citaIds) {
  const items = itemsDelCarrito(pacienteCorreo)
  const pendientes = citasPorPagar(pacienteCorreo)
  if (ids === undefined && citaIds === undefined) return { items, citasElegidas: pendientes }
  return {
    items: ids?.length ? seleccionarItems(items, ids) : [],
    citasElegidas: citaIds?.length ? pendientes.filter((cita) => citaIds.includes(cita.id)) : [],
  }
}

// Antes de cobrar se revisa cada ítem elegido: si alguno ya no se puede reservar no se cobra nada.
// Las citas elegidas deben seguir con pago pendiente (no canceladas ni pagadas en otra pestaña).
export function revisarAntesDePagar(pacienteCorreo, ids, ahora = new Date(), citaIds = []) {
  const elegidos = ids?.length ? seleccionarItems(itemsDelCarrito(pacienteCorreo), ids) : []
  const pendientes = new Set(citasPorPagar(pacienteCorreo).map((cita) => cita.id))
  const citasCaducadas = citaIds
    .filter((id) => !pendientes.has(id))
    .map((id) => ({ id, nombreServicio: citas.obtener(id)?.nombreServicio ?? 'Cita', motivo: 'Esta cita ya no tiene un pago pendiente.' }))
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
    .concat(citasCaducadas)
}

// Paga en una sola orden los ítems y citas pendientes elegidos (o todo). Todo o nada: si algo
// falla a mitad de camino se deshacen las citas y planes ya creados y no se cobra.
export function pagarCarrito({ pacienteCorreo, ids, citaIds, correoConfirmacion = pacienteCorreo, ahora = new Date() }) {
  const { items: elegidos, citasElegidas } = elegirParaPagar(pacienteCorreo, ids, citaIds)
  if (elegidos.length === 0 && citasElegidas.length === 0) return { ok: false, motivo: 'No hay nada seleccionado para pagar.' }
  if (citaIds?.length && citasElegidas.length !== citaIds.length) {
    return { ok: false, motivo: 'Una de las citas elegidas ya no tiene pago pendiente.' }
  }

  const problemas = revisarAntesDePagar(pacienteCorreo, elegidos.map((item) => item.id), ahora, citasElegidas.map((cita) => cita.id))
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
        if (cita) citas.eliminar(cita.id)
        if (plan) planes.eliminar(plan.id)
      })
      return { ok: false, motivo: `No se pudo reservar "${item.nombreServicio}": ${resultado.motivo} No se realizó ningún cobro.` }
    }
    creados.push({ item, cita: resultado.cita, plan: resultado.plan })
  }
  // Las citas pendientes ya se revisaron arriba, así que su pago no puede fallar aquí.
  const citasPagadas = citasElegidas.map((cita) => citas.actualizar(pagarCita(cita.id).cita.id, { ordenId }))

  const orden = {
    id: ordenId,
    pacienteCorreo,
    tipoOrden: 'Carrito',
    fecha: new Date(ahora).toISOString(),
    metodoPago: METODO_PAGO.ONLINE,
    estadoPago: ESTADO_PAGO.PAGADO,
    detalle: [
      // Un plan pagado sin sesión agendada no tiene fecha ni cita todavía.
      ...creados.map(({ item, cita, plan }) => ({
        codigoServicio: item.codigoServicio,
        nombreServicio: item.nombreServicio,
        fechaHora: cita?.fechaHora ?? null,
        nutricionista: cita?.nutricionista ?? '',
        precio: item.precio,
        citaId: cita?.id ?? null,
        planId: plan?.id ?? null,
      })),
      ...citasPagadas.map((cita) => ({
        codigoServicio: cita.codigoServicio,
        nombreServicio: cita.nombreServicio,
        fechaHora: cita.fechaHora,
        nutricionista: cita.nutricionista,
        precio: cita.precio,
        citaId: cita.id,
        planId: null,
      })),
    ],
    total: totalDe(elegidos) + citasPagadas.reduce((suma, cita) => suma + cita.precio, 0),
  }
  ordenes.crear(orden)
  elegidos.forEach((item) => carrito.eliminar(item.id))
  return { ok: true, orden }
}

// Paga en una sola orden una o varias citas que quedaron con pago pendiente (pago en clínica).
// Es el mismo pago del carrito, solo con citas.
export function pagarCitasPendientes({ pacienteCorreo, ids, ahora = new Date() }) {
  if (!ids?.length) return { ok: false, motivo: 'Selecciona citas tuyas con pago pendiente.' }
  return pagarCarrito({ pacienteCorreo, ids: [], citaIds: ids, ahora })
}

export function ordenesDePaciente(pacienteCorreo) {
  return ordenes
    .listar()
    .filter((orden) => mismoCorreo(orden.pacienteCorreo, pacienteCorreo))
    .sort((ordenA, ordenB) => new Date(ordenB.fecha) - new Date(ordenA.fecha))
}
