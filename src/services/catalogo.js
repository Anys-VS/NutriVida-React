import { usaApi } from '../config/api'
import { servicios } from '../data/db'
import { serviciosApi } from '../api/recursos'

// Punto de acceso a los datos del catálogo para las páginas.
// La página no sabe de dónde vienen los datos: en modo 'api' llegan del backend por HTTP
// y en modo 'local' desde el navegador. Al terminar el backend solo se cambia VITE_MODO_DATOS.
export function listarServicios() {
  return usaApi() ? serviciosApi.listar() : Promise.resolve(servicios.listar())
}
