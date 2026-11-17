// Punto de acceso a los datos del catálogo (servicios y categorías) para las páginas.
// La página no sabe de dónde vienen los datos: en modo 'api' llegan de ms-catalogo por HTTP
// y en modo 'local' desde el navegador. Ambos modos devuelven la misma forma.
import { usaApi } from '../config/api'
import { categorias, servicios } from '../data/db'
import { categoriasApi, serviciosApi } from '../api/recursos'
import { categoriaDesdeApi, servicioDesdeApi } from '../api/adaptadores'

export async function listarServicios() {
  if (!usaApi()) return servicios.listar()
  return (await serviciosApi.listar({ soloActivos: true })).map(servicioDesdeApi)
}

// null si el servicio no existe (la página muestra "No encontramos ese servicio").
export async function obtenerServicio(codigo) {
  if (!usaApi()) return servicios.obtener(codigo) ?? null
  try {
    return servicioDesdeApi(await serviciosApi.obtener(codigo))
  } catch (error) {
    if (error.estado === 404) return null
    throw error
  }
}

export async function listarCategorias() {
  if (!usaApi()) return categorias.listar()
  return (await categoriasApi.listar()).map(categoriaDesdeApi)
}

// Una categoría (por su slug) con sus servicios. null si no existe.
export async function obtenerCategoria(slug) {
  const [todas, catalogo] = await Promise.all([listarCategorias(), listarServicios()])
  const categoria = todas.find((candidata) => candidata.slug === slug)
  if (!categoria) return null
  return { categoria, servicios: catalogo.filter((servicio) => servicio.tipo === categoria.tipo) }
}

// ---------- Administración del catálogo (solo administrador) ----------

async function intentar(accion) {
  try {
    return { ok: true, ...(await accion()) }
  } catch (error) {
    return { ok: false, motivo: error.message, errores: error.errores ?? {} }
  }
}

// El administrador ve también los servicios desactivados.
export async function listarServiciosAdmin() {
  if (!usaApi()) return servicios.listar()
  return (await serviciosApi.listar({ soloActivos: false })).map(servicioDesdeApi)
}

// Crea o edita un servicio. `servicio` tiene la forma del frontend (tipo = nombre de la categoría);
// ms-catalogo pide el id de la categoría, que se busca por su nombre.
export async function guardarServicio(servicio, codigoEnEdicion = null) {
  if (!usaApi()) {
    if (!codigoEnEdicion && servicios.obtener(servicio.codigo)) {
      return { ok: false, motivo: 'No se puede guardar un código repetido.', errores: { codigo: 'Ya existe un servicio con ese código.' } }
    }
    if (codigoEnEdicion) servicios.actualizar(codigoEnEdicion, servicio)
    else servicios.crear(servicio)
    return { ok: true }
  }
  return intentar(async () => {
    const categoria = (await listarCategorias()).find((candidata) => candidata.tipo === servicio.tipo)
    if (!categoria) throw Object.assign(new Error('La categoría no existe en el catálogo.'), { errores: { tipo: 'Selecciona una categoría válida.' } })
    const cuerpo = {
      codigo: servicio.codigo,
      nombre: servicio.nombre,
      categoriaId: categoria.id,
      duracion: servicio.duracion,
      modalidad: servicio.modalidad,
      profesional: servicio.profesional,
      precio: servicio.precio,
      descuento: servicio.descuento,
      sesiones: servicio.sesiones ?? null,
      cupos: servicio.cupos ?? null,
      descripcion: servicio.descripcion,
      activo: true,
    }
    if (codigoEnEdicion) await serviciosApi.actualizar(codigoEnEdicion, cuerpo)
    else await serviciosApi.crear(cuerpo)
    return {}
  })
}

export function eliminarServicio(codigo) {
  if (!usaApi()) {
    servicios.eliminar(codigo)
    return Promise.resolve({ ok: true })
  }
  return intentar(() => serviciosApi.eliminar(codigo).then(() => ({})))
}

// El nombre de la categoría define el tipo de servicio (y con él las reglas), por eso en ms-catalogo
// solo se edita la descripción; el título visible sale de la tabla de categorías del frontend.
export function guardarCategoria(categoria, { titulo, descripcion }) {
  if (!usaApi()) {
    categorias.actualizar(categoria.slug, { titulo, descripcion })
    return Promise.resolve({ ok: true })
  }
  return intentar(() => categoriasApi.actualizar(categoria.id, { nombre: categoria.tipo, descripcion }).then(() => ({})))
}
