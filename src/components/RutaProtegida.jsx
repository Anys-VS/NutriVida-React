import { Navigate, useLocation } from 'react-router-dom'
import { useSesion } from '../context/SesionContext'
import { puede } from '../config/permisos'
import SinPermiso from '../pages/SinPermiso'

// Protege una ruta:
// - Mientras se recupera la sesión (token de renovación), espera en vez de mandar al login.
// - Sin sesión: lleva al login y después vuelve a la página pedida.
// - Con sesión pero sin el permiso: muestra "No tienes permiso", o redirige si se indica `redirigir`.
function RutaProtegida({ permiso, redirigir, children }) {
  const { sesion, restaurando } = useSesion()
  const ubicacion = useLocation()

  if (restaurando) {
    return <p className="container seccion texto-ayuda" role="status">Recuperando tu sesión…</p>
  }
  if (!sesion) {
    return <Navigate to={`/login?desde=${encodeURIComponent(ubicacion.pathname + ubicacion.search)}`} replace />
  }
  if (permiso && !puede(sesion, permiso)) {
    return redirigir ? <Navigate to={redirigir(sesion)} replace /> : <SinPermiso />
  }
  return children
}

export default RutaProtegida
