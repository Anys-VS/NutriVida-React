import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { RENOVAR_ANTES_MS } from '../config/api'
import { CLAVE_RENOVACION, borrarAcceso, borrarTokens, obtenerTokens, suscribir } from '../auth/almacenTokens'
import { estaVigente, msHastaVencer, sesionDesdeToken } from '../auth/jwt'
import { cerrarSesion, renovarSesion } from '../auth/servicioAuth'

const SesionContext = createContext(null)
const AVISO_EXPIRADA = 'Tu sesión expiró. Vuelve a iniciar sesión para continuar.'

// Estado de autenticación de toda la app. La sesión NO se guarda como objeto editable:
// se obtiene leyendo el token de acceso, y se mantiene así:
// - Recarga de página: el token de acceso sigue en sessionStorage y la sesión aparece al instante.
// - Pestaña nueva o token vencido: se usa el token de renovación ("Recuperando tu sesión…").
// - Antes de que venza: se renueva solo, un minuto antes.
// - Si la renovación falla o la cuenta fue desactivada: se cierra con el aviso "Tu sesión expiró".
// - Cerrar sesión en una pestaña la cierra en todas.
export function SesionProvider({ children }) {
  const [tokens, setTokens] = useState(() => {
    try { localStorage.removeItem('nutrivida_sesion') } catch { /* versión anterior sin JWT */ }
    return obtenerTokens()
  })
  const [aviso, setAviso] = useState('')

  const acceso = tokens.acceso && estaVigente(tokens.acceso) ? tokens.acceso : null
  const restaurando = !acceso && Boolean(tokens.renovacion)

  // Cada cambio en el almacén (login, renovación, cierre) actualiza el estado.
  useEffect(() => suscribir((evento) => {
    setTokens(obtenerTokens())
    if (evento.tipo === 'guardado') setAviso('')
    if (evento.tipo === 'borrado') setAviso(evento.motivo === 'expirada' ? AVISO_EXPIRADA : '')
  }), [])

  // Sin token de acceso válido pero con token de renovación: se recupera la sesión.
  useEffect(() => {
    if (restaurando) renovarSesion().catch(() => borrarTokens('expirada'))
  }, [restaurando])

  // Renovación programada antes del vencimiento.
  useEffect(() => {
    if (!acceso) return undefined
    const espera = Math.max(msHastaVencer(acceso) - RENOVAR_ANTES_MS, 0)
    const id = setTimeout(() => renovarSesion().catch(() => borrarTokens('expirada')), espera)
    return () => clearTimeout(id)
  }, [acceso])

  // Otras pestañas: si cierran sesión, aquí también; si entran con otra cuenta, se toma esa.
  useEffect(() => {
    const alCambiar = (evento) => {
      if (evento.key !== CLAVE_RENOVACION) return
      if (!evento.newValue) borrarTokens('cierre')
      else if (evento.newValue !== evento.oldValue) borrarAcceso()
    }
    window.addEventListener('storage', alCambiar)
    return () => window.removeEventListener('storage', alCambiar)
  }, [])

  const sesion = useMemo(() => (acceso ? sesionDesdeToken(acceso) : null), [acceso])
  const cerrar = useCallback(() => { cerrarSesion() }, [])
  // Pide un token nuevo (por ejemplo, después de cambiar el nombre en "Mi perfil").
  const renovar = useCallback(() => renovarSesion(), [])

  const valor = useMemo(() => ({ sesion, restaurando, aviso, cerrar, renovar }), [sesion, restaurando, aviso, cerrar, renovar])
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSesion() {
  return useContext(SesionContext)
}
