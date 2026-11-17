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
