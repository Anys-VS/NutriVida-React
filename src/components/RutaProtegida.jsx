import { Navigate, useLocation } from 'react-router-dom'
import { useSesion } from '../context/SesionContext'

function RutaProtegida({ roles, fallback = '/', children }) {
  const { sesion } = useSesion()
  const ubicacion = useLocation()

  if (!sesion) {
    return <Navigate to={`/login?desde=${encodeURIComponent(ubicacion.pathname)}`} replace />
  }
  if (roles && !roles.includes(sesion.tipoUsuario)) return <Navigate to={fallback} replace />
  return children
}

export default RutaProtegida
