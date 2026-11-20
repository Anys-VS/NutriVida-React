import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSesion } from './SesionContext'
import { ROL } from '../config/reglas'
import { usaApi } from '../config/api'
import { citasPorPagar, itemsDelCarrito } from '../services/carrito'
import { cargarCarrito } from '../services/miCarrito'

const CarritoContext = createContext(null)
const VACIO = { items: [], pendientes: [] }

// Expone lo que el paciente tiene por pagar para que el menú muestre el contador:
// los ítems por reservar y las citas ya agendadas con pago pendiente.
// Modo 'local': se lee del navegador al instante. Modo 'api': se pide a ms-ordenes y ms-citas.
export function CarritoProvider({ children }) {
  const { sesion } = useSesion()
  const { pathname } = useLocation()
  const correo = sesion?.tipoUsuario === ROL.PACIENTE ? sesion.correo : null
  const [version, setVersion] = useState(0)
  const [remoto, setRemoto] = useState({ correo: null, ...VACIO })

  // Se recalcula al cambiar de página (p. ej. después de reservar con pago en clínica) o al llamar a refrescar.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const local = useMemo(() => (correo && !usaApi() ? { items: itemsDelCarrito(correo), pendientes: citasPorPagar(correo) } : VACIO), [correo, version, pathname])

  useEffect(() => {
    if (!correo || !usaApi()) return undefined
    let vigente = true
    cargarCarrito(correo)
      .then((datos) => vigente && setRemoto({ correo, ...datos }))
      .catch(() => {}) // si el servidor no responde, el contador queda como estaba
    return () => { vigente = false }
  }, [correo, version, pathname])

  const refrescar = useCallback(() => setVersion((versionAnterior) => versionAnterior + 1), [])
  // En modo 'api' solo se usa lo cargado para el paciente de la sesión actual (no el de una sesión anterior).
  const { items, pendientes } = usaApi() ? (remoto.correo === correo ? remoto : VACIO) : local

  const valor = useMemo(
    () => ({ items, pendientes, cantidad: items.length + pendientes.length, refrescar }),
    [items, pendientes, refrescar],
  )
  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCarrito() {
  return useContext(CarritoContext) ?? { items: [], pendientes: [], cantidad: 0, refrescar: () => {} }
}
