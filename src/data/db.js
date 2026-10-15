// "Base de datos" simulada sobre localStorage. Cada colección ofrece el mismo CRUD:
// listar, obtener, crear, actualizar, eliminar. Si la clave no existe aún, parte de una semilla.
import { catalogoServicios } from './catalogo'
import { usuariosSemilla } from './usuariosSemilla'
import { CATEGORIAS } from '../config/reglas'

export const CLAVES = {
  servicios: 'nutrivida_servicios',
  usuarios: 'nutrivida_usuarios',
  citas: 'nutrivida_citas',
  categorias: 'nutrivida_categorias',
  planes: 'nutrivida_planes',
  mensajes: 'nutrivida_mensajes',
}

export function leer(clave, porDefecto) {
  try {
    const valor = localStorage.getItem(clave)
    return valor ? JSON.parse(valor) : porDefecto
  } catch {
    return porDefecto
  }
}

export function escribir(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor))
}

const copiar = (valor) => JSON.parse(JSON.stringify(valor))

function crearRepositorio({ clave, semilla, campoId }) {
  const listar = () => {
    const guardado = leer(clave, null)
    return Array.isArray(guardado) ? guardado : copiar(semilla)
  }

  const obtener = (id) => listar().find((item) => item[campoId] === id) ?? null

  const crear = (item) => {
    const lista = listar()
    if (lista.some((existente) => existente[campoId] === item[campoId])) {
      throw new Error(`Ya existe un registro con ${campoId} ${item[campoId]}`)
    }
    escribir(clave, [...lista, item])
    return item
  }

  const actualizar = (id, cambios) => {
    const lista = listar()
    const indice = lista.findIndex((item) => item[campoId] === id)
    if (indice === -1) return null
    const actualizado = { ...lista[indice], ...cambios }
    lista[indice] = actualizado
    escribir(clave, lista)
    return actualizado
  }

  const eliminar = (id) => {
    const lista = listar()
    const restantes = lista.filter((item) => item[campoId] !== id)
    escribir(clave, restantes)
    return restantes.length !== lista.length
  }

  return { listar, obtener, crear, actualizar, eliminar }
}

export const servicios = crearRepositorio({ clave: CLAVES.servicios, semilla: catalogoServicios, campoId: 'codigo' })
export const usuarios = crearRepositorio({ clave: CLAVES.usuarios, semilla: usuariosSemilla, campoId: 'run' })
export const citas = crearRepositorio({ clave: CLAVES.citas, semilla: [], campoId: 'id' })
export const categorias = crearRepositorio({ clave: CLAVES.categorias, semilla: CATEGORIAS, campoId: 'slug' })
export const mensajes = crearRepositorio({ clave: CLAVES.mensajes, semilla: [], campoId: 'id' })
export const planes = crearRepositorio({ clave: CLAVES.planes, semilla: [], campoId: 'id' })
