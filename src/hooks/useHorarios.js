import { useEffect, useState } from 'react'
import { horariosDelDia } from '../services/agenda'

// Horarios de un día con su disponibilidad (ms-citas en modo 'api', reglas locales en modo 'local').
// Se vuelven a pedir al cambiar el servicio, el nutricionista o la fecha.
export function useHorarios({ servicio, nutricionista, fecha, excluirId = null }) {
  const [estado, setEstado] = useState({ horarios: [], cargando: false, error: null })
  const codigo = servicio?.codigo

  useEffect(() => {
    if (!servicio || !fecha) {
      setEstado({ horarios: [], cargando: false, error: null })
      return undefined
    }
    let vigente = true
    setEstado((anterior) => ({ ...anterior, cargando: true, error: null }))
    horariosDelDia({ servicio, nutricionista, fecha, excluirId })
      .then((horarios) => vigente && setEstado({ horarios, cargando: false, error: null }))
      .catch((error) => vigente && setEstado({ horarios: [], cargando: false, error }))
    return () => { vigente = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo, nutricionista, fecha, excluirId])

  return estado
}
