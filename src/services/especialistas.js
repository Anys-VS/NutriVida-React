// Nutricionistas para el buscador de especialistas.
// Modo 'api': ms-citas (GET /api/v1/nutricionistas). Modo 'local': catálogo del navegador.
import { usaApi } from '../config/api'
import { nutricionistas } from '../data/nutricionistas'
import { nutricionistasApi } from '../api/recursos'

export function listarNutricionistas() {
  return usaApi() ? nutricionistasApi.listar() : Promise.resolve(nutricionistas)
}
