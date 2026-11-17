import { cliente } from './cliente'

// Endpoints del backend agrupados por recurso. Rutas versionadas bajo /api/v1 (ver config/api.js).
// Cada función devuelve directamente el JSON de la respuesta.
const datos = (respuesta) => respuesta.data

// Operaciones CRUD estándar de un recurso REST.
function crud(ruta) {
  return {
    listar: (filtros) => cliente.get(ruta, { params: filtros }).then(datos), // GET    /ruta
    obtener: (id) => cliente.get(`${ruta}/${id}`).then(datos), //               GET    /ruta/{id}
    crear: (cuerpo) => cliente.post(ruta, cuerpo).then(datos), //               POST   /ruta
    actualizar: (id, cuerpo) => cliente.put(`${ruta}/${id}`, cuerpo).then(datos), // PUT /ruta/{id}
    eliminar: (id) => cliente.delete(`${ruta}/${id}`).then(datos), //           DELETE /ruta/{id}
  }
}

// ms-catalogo
export const serviciosApi = crud('/servicios')
export const categoriasApi = crud('/categorias')

// ms-citas: nutricionistas con su jornada (el buscador filtra en el navegador) y disponibilidad de un día.
export const nutricionistasApi = {
  listar: () => cliente.get('/nutricionistas').then(datos),
  obtener: (id) => cliente.get(`/nutricionistas/${id}`).then(datos),
  disponibilidad: ({ fecha, nutricionista, codigoServicio }) =>
    cliente.get('/citas/disponibilidad', { params: { fecha, nutricionista: nutricionista || undefined, codigoServicio: codigoServicio || undefined } }).then(datos),
}

// ms-citas. GET /citas ya devuelve solo lo que corresponde al rol (paciente: sus citas).
export const citasApi = {
  ...crud('/citas'),
  mias: () => cliente.get('/citas').then(datos),
  confirmar: (id) => cliente.patch(`/citas/${id}/confirmar`).then(datos),
  cancelar: (id) => cliente.patch(`/citas/${id}/cancelar`).then(datos),
  reprogramar: (id, cambios) => cliente.patch(`/citas/${id}/reprogramar`, cambios).then(datos),
  registrarAsistencia: (id, estado) => cliente.patch(`/citas/${id}/asistencia`, { estado }).then(datos), // ATENDIDA | INASISTENCIA
  registrarPagoClinica: (id) => cliente.patch(`/citas/${id}/pago-clinica`).then(datos),
  registrarReembolso: (id) => cliente.patch(`/citas/${id}/reembolso`).then(datos),
}

// ms-citas: planes pagados con el saldo de sesiones; cada sesión se agenda sin volver a pagar.
export const planesApi = {
  listar: () => cliente.get('/planes').then(datos),
  obtener: (id) => cliente.get(`/planes/${id}`).then(datos),
  agendarSesion: (id, { fechaHora, nutricionista }) => cliente.post(`/planes/${id}/sesiones`, { fechaHora, nutricionista }).then(datos),
}

// ms-ordenes. GET /carrito devuelve { items, cantidad, total, maximo }. En un plan, `fechaHora` es opcional
// (null = la primera sesión se agenda después de pagar). Las citas con pago en clínica se pagan en el mismo
// checkout con `citaIds`: ms-ordenes le pide a ms-citas que agende lo pagado, todo o nada.
export const carritoApi = {
  listar: () => cliente.get('/carrito').then(datos),
  agregar: (item) => cliente.post('/carrito/items', item).then(datos),
  editarHorario: (itemId, { nutricionista, fechaHora }) => cliente.put(`/carrito/items/${itemId}`, { nutricionista, fechaHora }).then(datos),
  quitar: (itemId) => cliente.delete(`/carrito/items/${itemId}`).then(datos),
  vaciar: () => cliente.delete('/carrito').then(datos),
  pagar: ({ tarjeta, itemIds, citaIds, correoConfirmacion }) =>
    cliente.post('/carrito/checkout', { ...tarjeta, itemIds, citaIds, correoConfirmacion }).then(datos),
}
// ms-ordenes. GET /ordenes devuelve las del paciente (o todas para el personal).
export const ordenesApi = { mias: () => cliente.get('/ordenes').then(datos), obtener: (id) => cliente.get(`/ordenes/${id}`).then(datos) }

// ms-clinico (fichas: solo el paciente y su nutricionista)
export const fichasApi = {
  mia: () => cliente.get('/fichas/mia').then(datos),
  obtener: (correoPaciente) => cliente.get(`/fichas/${encodeURIComponent(correoPaciente)}`).then(datos),
  actualizar: (correoPaciente, cambios) => cliente.put(`/fichas/${encodeURIComponent(correoPaciente)}`, cambios).then(datos),
  registrarMedicion: (correoPaciente, medicion) =>
    cliente.post(`/fichas/${encodeURIComponent(correoPaciente)}/mediciones`, medicion).then(datos),
}

// ms-usuarios (solo administrador)
export const usuariosApi = {
  ...crud('/usuarios'),
  cambiarEstado: (run, activo) => cliente.patch(`/usuarios/${run}/estado`, { activo }).then(datos),
}
