import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useSesion } from './SesionContext'
import { ROL } from '../config/reglas'
import { itemsDelCarrito } from '../services/carrito'

const CarritoContext = createContext(null)

// Expone los ítems del carrito del paciente con sesión para que el menú muestre el contador.
export function CarritoProvider({ children }) {
  const { sesion } = useSesion()
  const correo = sesion?.tipoUsuario === ROL.PACIENTE ? sesion.correo : null
  const [version, setVersion] = useState(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => (correo ? itemsDelCarrito(correo) : []), [correo, version])
  const refrescar = useCallback(() => setVersion((v) => v + 1), [])

  const valor = useMemo(() => ({ items, cantidad: items.length, refrescar }), [items, refrescar])
  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCarrito() {
  return useContext(CarritoContext) ?? { items: [], cantidad: 0, refrescar: () => {} }
}
