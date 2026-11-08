import { Link } from 'react-router-dom'
import { useSesion } from '../context/SesionContext'
import { rutaInicialPorRol } from '../services/auth'

// Se muestra cuando un usuario con sesión entra a una página que su rol no permite.
function SinPermiso() {
  const { sesion } = useSesion()
  return (
    <section className="seccion">
      <div className="container contenedor-angosto text-center">
        <h1 className="titulo-seccion">No tienes permiso para ver esta página</h1>
        <p className="intro-seccion mx-auto">
          Tu cuenta tiene el rol <strong>{sesion?.tipoUsuario}</strong>, que no incluye esta sección.
          Si crees que es un error, comunícate con la administración de la clínica.
        </p>
        <Link to={rutaInicialPorRol(sesion?.tipoUsuario)} className="btn btn-nv-primario">Ir a mi inicio</Link>
      </div>
    </section>
  )
}

export default SinPermiso
