import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSesion } from './SesionContext'
import { ROL } from '../config/reglas'
import { citasPorPagar, itemsDelCarrito } from '../services/carrito'

const CarritoContext = createContext(null)

// Expone lo que el paciente tiene por pagar para que el menú muestre el contador:
// los ítems por reservar y las citas ya agendadas con pago pendiente.
export function CarritoProvider({ children }) {
  const { sesion } = useSesion()
  const { pathname } = useLocation()
  const correo = sesion?.tipoUsuario === ROL.PACIENTE ? sesion.correo : null
  const [version, setVersion] = useState(0)

  // Se recalcula al cambiar de página (p. ej. después de reservar con pago en clínica) o al llamar a refrescar.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => (correo ? itemsDelCarrito(correo) : []), [correo, version, pathname])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pendientes = useMemo(() => (correo ? citasPorPagar(correo) : []), [correo, version, pathname])
  const refrescar = useCallback(() => setVersion((versionAnterior) => versionAnterior + 1), [])

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
