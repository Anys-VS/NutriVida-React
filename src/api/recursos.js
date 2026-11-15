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

// ms-catalogo (profesionales y buscador de especialistas)
export const profesionalesApi = {
  ...crud('/profesionales'),
  buscar: ({ texto, especialidad, dia } = {}) =>
    cliente.get('/profesionales', { params: { q: texto || undefined, especialidad: especialidad || undefined, dia: dia ?? undefined } }).then(datos),
  horariosLibres: (id, fecha) => cliente.get(`/profesionales/${id}/horarios`, { params: { fecha } }).then(datos),
}

// ms-agenda (citas, planes, carrito y órdenes)
export const citasApi = {
  ...crud('/citas'),
  mias: () => cliente.get('/citas/mias').then(datos),
  confirmar: (id) => cliente.patch(`/citas/${id}/confirmar`).then(datos),
  cancelar: (id) => cliente.patch(`/citas/${id}/cancelar`).then(datos),
  reprogramar: (id, cambios) => cliente.patch(`/citas/${id}/reprogramar`, cambios).then(datos),
  registrarAsistencia: (id, estado) => cliente.patch(`/citas/${id}/asistencia`, { estado }).then(datos),
}
export const planesApi = crud('/planes')
export const carritoApi = {
  listar: () => cliente.get('/carrito').then(datos),
  agregar: (item) => cliente.post('/carrito/items', item).then(datos),
  quitar: (itemId) => cliente.delete(`/carrito/items/${itemId}`).then(datos),
  vaciar: () => cliente.delete('/carrito').then(datos),
  pagar: ({ ids, correoConfirmacion }) => cliente.post('/ordenes', { items: ids, correoConfirmacion }).then(datos),
}
export const ordenesApi = { mias: () => cliente.get('/ordenes/mias').then(datos), obtener: (id) => cliente.get(`/ordenes/${id}`).then(datos) }

// ms-clinico (fichas: solo el paciente y su nutricionista)
export const fichasApi = {
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

// ms-agenda (reportes del administrador)
export const reportesApi = { obtener: ({ desde, hasta } = {}) => cliente.get('/reportes', { params: { desde, hasta } }).then(datos) }
