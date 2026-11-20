
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { RENOVAR_ANTES_MS } from '../config/api'
import {
  CLAVE_RENOVACION,
  borrarAcceso,
  borrarTokens,
  obtenerTokens,
  suscribir,
} from '../auth/almacenTokens'
import {
  estaVigente,
  msHastaVencer,
  sesionDesdeToken,
} from '../auth/jwt'
import {
  cerrarSesion,
  renovarSesion,
} from '../auth/servicioAuth'

const SesionContext = createContext(null)

const AVISO_EXPIRADA = 'Tu sesión expiró. Vuelve a iniciar sesión para continuar.'

// Estado de autenticación de toda la aplicación.
export function SesionProvider({ children }) {
  const [tokens, setTokens] = useState(() => {
    try {
      localStorage.removeItem('nutrivida_sesion')
    } catch {
      // Versión anterior sin JWT.
    }

    return obtenerTokens()
  })

  const [aviso, setAviso] = useState('')

  const acceso = tokens.acceso && estaVigente(tokens.acceso)
    ? tokens.acceso
    : null

  const restaurando = !acceso && Boolean(tokens.renovacion)

  // Actualiza el estado cuando cambian los tokens.
  useEffect(() => suscribir((evento) => {
    setTokens(obtenerTokens())

    if (evento.tipo === 'guardado') setAviso('')
    if (evento.tipo === 'borrado') {
      setAviso(evento.motivo === 'expirada' ? AVISO_EXPIRADA : '')
    }
  }), [])

  // Recupera la sesión si el token de acceso venció.
  useEffect(() => {
    if (restaurando) {
      renovarSesion().catch(() => borrarTokens('expirada'))
    }
  }, [restaurando])

  // Renueva automáticamente antes del vencimiento.
  useEffect(() => {
    if (!acceso) return undefined

    const espera = Math.max(
      msHastaVencer(acceso) - RENOVAR_ANTES_MS,
      0
    )

    const id = setTimeout(
      () => renovarSesion().catch(() => borrarTokens('expirada')),
      espera
    )

    return () => clearTimeout(id)
  }, [acceso])

  // Sincroniza los cambios de sesión entre pestañas.
  useEffect(() => {
    const alCambiar = (evento) => {
      if (evento.key !== CLAVE_RENOVACION) return

      if (!evento.newValue) {
        borrarTokens('cierre')
      } else if (evento.newValue !== evento.oldValue) {
        borrarAcceso()
      }
    }

    window.addEventListener('storage', alCambiar)

    return () => window.removeEventListener('storage', alCambiar)
  }, [])

  const sesion = useMemo(
    () => (acceso ? sesionDesdeToken(acceso) : null),
    [acceso]
  )

  const cerrar = useCallback(() => {
    cerrarSesion()
  }, [])

  const renovar = useCallback(() => renovarSesion(), [])

  const valor = useMemo(
    () => ({ sesion, restaurando, aviso, cerrar, renovar }),
    [sesion, restaurando, aviso, cerrar, renovar]
  )

  return (
    <SesionContext.Provider value={valor}>
      {children}
    </SesionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSesion() {
  return useContext(SesionContext)
}
