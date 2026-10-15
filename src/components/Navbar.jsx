import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useSesion } from '../context/SesionContext'
import { ROL } from '../config/reglas'
import { rutaInicialPorRol } from '../services/auth'

const claseEnlace = ({ isActive }) => 'nav-link' + (isActive ? ' active' : '')

function Navbar() {
  const [abierto, setAbierto] = useState(false)
  const { sesion, cerrar } = useSesion()
  const navigate = useNavigate()
  const cerrarMenu = () => setAbierto(false)

  const salir = () => {
    cerrar()
    cerrarMenu()
    navigate('/')
  }

  return (
    <header className="encabezado-nv">
      <nav className="navbar navbar-expand-lg container py-8">
        <Link className="navbar-brand marca-nv" to="/" onClick={cerrarMenu}>
          <img src="/imagenes/banner-top.svg" alt="Logo NutriVida" width="200" height="150" />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navegacionPrincipal"
          aria-expanded={abierto}
          aria-label="Abrir menú de navegación"
          onClick={() => setAbierto(!abierto)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse${abierto ? ' show' : ''}`} id="navegacionPrincipal">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
            <li className="nav-item"><NavLink className={claseEnlace} to="/" end onClick={cerrarMenu}>Inicio</NavLink></li>
            <li className="nav-item"><NavLink className={claseEnlace} to="/nosotros" onClick={cerrarMenu}>Nosotros</NavLink></li>
            <li className="nav-item"><NavLink className={claseEnlace} to="/servicios" onClick={cerrarMenu}>Servicios</NavLink></li>
            <li className="nav-item"><NavLink className={claseEnlace} to="/ofertas" onClick={cerrarMenu}>Ofertas</NavLink></li>
            <li className="nav-item"><NavLink className={claseEnlace} to="/blog" onClick={cerrarMenu}>Blog</NavLink></li>
            <li className="nav-item"><NavLink className={claseEnlace} to="/contacto" onClick={cerrarMenu}>Contacto</NavLink></li>
            {sesion?.tipoUsuario === ROL.PACIENTE && (
              <li className="nav-item"><NavLink className={claseEnlace} to="/mis-citas" onClick={cerrarMenu}>Mis citas</NavLink></li>
            )}
            {sesion && sesion.tipoUsuario !== ROL.PACIENTE && (
              <li className="nav-item"><NavLink className={claseEnlace} to={rutaInicialPorRol(sesion.tipoUsuario)} onClick={cerrarMenu}>Administración</NavLink></li>
            )}
            {sesion ? (
              <li className="nav-item">
                <button type="button" className="nav-link btn btn-link" onClick={salir}>Cerrar sesión</button>
              </li>
            ) : (
              <li className="nav-item"><NavLink className={claseEnlace} to="/login" onClick={cerrarMenu}>Ingresar</NavLink></li>
            )}
            <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
              <Link to="/reservar" className="btn btn-nv-primario btn-sm" onClick={cerrarMenu}>Agendar hora</Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
