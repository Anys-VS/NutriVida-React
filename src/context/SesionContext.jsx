import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { obtenerSesion, guardarSesion, cerrarSesion as borrarSesion } from '../data/sesion'

const SesionContext = createContext(null)

export function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(() => obtenerSesion())

  const iniciar = useCallback((usuario) => setSesion(guardarSesion(usuario)), [])
  const cerrar = useCallback(() => {
    borrarSesion()
    setSesion(null)
  }, [])

  const valor = useMemo(() => ({ sesion, iniciar, cerrar }), [sesion, iniciar, cerrar])
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSesion() {
  return useContext(SesionContext)
}
