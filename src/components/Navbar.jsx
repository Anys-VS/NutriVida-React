import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useSesion } from '../context/SesionContext'
import { useCarrito } from '../context/CarritoContext'
import { ROL } from '../config/reglas'
import { puede } from '../config/permisos'
import { rutaInicialPorRol } from '../services/auth'

const claseEnlace = ({ isActive }) => 'nav-link' + (isActive ? ' active' : '')

// Botón destacado del menú: el paciente (o visitante) agenda; el personal va a su panel.
function accionPrincipal(sesion) {
  if (!sesion || sesion.tipoUsuario === ROL.PACIENTE) return { ruta: '/reservar', texto: 'Agendar hora' }
  if (sesion.tipoUsuario === ROL.NUTRICIONISTA) return { ruta: rutaInicialPorRol(sesion.tipoUsuario), texto: 'Mi agenda' }
  return { ruta: rutaInicialPorRol(sesion.tipoUsuario), texto: 'Ir al panel' }
}

// Enlace al carrito: solo el ícono y el contador. El nombre lo lee el lector de pantalla (aria-label).
function EnlaceCarrito({ cantidad, onClick, className = '' }) {
  return (
    <NavLink className={({ isActive }) => `nav-link enlace-carrito ${className}${isActive ? ' active' : ''}`}
      to="/carrito" onClick={onClick} aria-label={`Carrito, ${cantidad} ítem(s)`} title="Carrito">
      <span className="icono-carrito" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" focusable="false">
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="18" cy="20" r="1.4" />
          <path d="M2.5 3.5h2.6l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2l1.7-7.3H6.2" />
        </svg>
        {cantidad > 0 && <span className="contador-carrito">{cantidad > 9 ? '9+' : cantidad}</span>}
      </span>
    </NavLink>
  )
}

function Navbar() {
  const [abierto, setAbierto] = useState(false)
  const [cuentaAbierta, setCuentaAbierta] = useState(false)
  const { sesion, cerrar } = useSesion()
  const { cantidad } = useCarrito()
  const esPaciente = puede(sesion, 'reservas:propias')
  const verCarrito = !sesion || esPaciente
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const refEncabezado = useRef(null)
  const refCuenta = useRef(null)
  const refBotonCuenta = useRef(null)
  const refBotonMenu = useRef(null)

  const cerrarMenu = () => {
    setAbierto(false)
    setCuentaAbierta(false)
  }

  // Al cambiar de página (también con atrás/adelante del navegador) se cierran los menús.
  const [rutaAnterior, setRutaAnterior] = useState(pathname)
  if (rutaAnterior !== pathname) {
    setRutaAnterior(pathname)
    setAbierto(false)
    setCuentaAbierta(false)
  }

  // Escape cierra el menú abierto y devuelve el foco a su botón; un clic fuera también lo cierra.
  useEffect(() => {
    if (!abierto && !cuentaAbierta) return undefined
    const alPresionar = (evento) => {
      if (evento.key !== 'Escape') return
      if (cuentaAbierta) {
        setCuentaAbierta(false)
        refBotonCuenta.current?.focus()
      } else {
        setAbierto(false)
        refBotonMenu.current?.focus()
      }
    }
    const alHacerClic = (evento) => {
      if (cuentaAbierta && !refCuenta.current?.contains(evento.target)) setCuentaAbierta(false)
      if (abierto && !refEncabezado.current?.contains(evento.target)) setAbierto(false)
    }
    document.addEventListener('keydown', alPresionar)
    document.addEventListener('mousedown', alHacerClic)
    return () => {
      document.removeEventListener('keydown', alPresionar)
      document.removeEventListener('mousedown', alHacerClic)
    }
  }, [abierto, cuentaAbierta])

  const salir = () => {
    cerrar()
    cerrarMenu()
    navigate('/')
  }

  const principal = accionPrincipal(sesion)

  return (
    <header className="encabezado-nv" ref={refEncabezado}>
      <nav className="navbar navbar-expand-xl container" aria-label="Navegación principal">
        <Link className="navbar-brand marca-nv" to="/" onClick={cerrarMenu}>
          <img src="/imagenes/banner-top.svg" alt="NutriVida, ir al inicio" width="175" height="48" />
        </Link>
        {/* En celular y tablet el carrito queda siempre a la vista, junto al botón del menú. */}
        {verCarrito && <EnlaceCarrito cantidad={cantidad} onClick={cerrarMenu} className="carrito-barra d-xl-none ms-auto" />}
        <button
          ref={refBotonMenu}
          className="navbar-toggler"
          type="button"
          aria-controls="navegacionPrincipal"
          aria-expanded={abierto}
          aria-label={abierto ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          onClick={() => setAbierto(!abierto)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse${abierto ? ' show' : ''}`} id="navegacionPrincipal">
          <ul className="navbar-nav ms-auto mb-2 mb-xl-0 align-items-xl-center">
            <li className="nav-item"><NavLink className={claseEnlace} to="/" end onClick={cerrarMenu}>Inicio</NavLink></li>
            <li className="nav-item"><NavLink className={claseEnlace} to="/nosotros" onClick={cerrarMenu}>Nosotros</NavLink></li>
            <li className="nav-item"><NavLink className={claseEnlace} to="/servicios" onClick={cerrarMenu}>Servicios</NavLink></li>
            <li className="nav-item"><NavLink className={claseEnlace} to="/especialistas" onClick={cerrarMenu}>Especialistas</NavLink></li>
            <li className="nav-item"><NavLink className={claseEnlace} to="/ofertas" onClick={cerrarMenu}>Ofertas</NavLink></li>
            <li className="nav-item"><NavLink className={claseEnlace} to="/blog" onClick={cerrarMenu}>Blog</NavLink></li>
            <li className="nav-item"><NavLink className={claseEnlace} to="/contacto" onClick={cerrarMenu}>Contacto</NavLink></li>
            {verCarrito && (
              <li className="nav-item d-none d-xl-block">
                <EnlaceCarrito cantidad={cantidad} onClick={cerrarMenu} />
              </li>
            )}
            {sesion ? (
              <li className="nav-item dropdown" ref={refCuenta}>
                <button ref={refBotonCuenta} type="button" className="nav-link btn btn-link dropdown-toggle"
                  aria-expanded={cuentaAbierta} aria-controls="menu-cuenta" onClick={() => setCuentaAbierta(!cuentaAbierta)}>
                  {sesion.nombre}
                </button>
                <ul id="menu-cuenta" data-bs-popper="static" hidden={!cuentaAbierta}
                  className={`dropdown-menu dropdown-menu-end${cuentaAbierta ? ' show' : ''}`}>
                  <li><span className="dropdown-item-text texto-ayuda">{sesion.tipoUsuario}</span></li>
                  {esPaciente ? (
                    <>
                      <li><Link className="dropdown-item" to="/mis-citas" onClick={cerrarMenu}>Mis citas</Link></li>
                      <li><Link className="dropdown-item" to="/mi-progreso" onClick={cerrarMenu}>Mi progreso</Link></li>
                      <li><Link className="dropdown-item" to="/carrito" onClick={cerrarMenu}>Mi carrito</Link></li>
                    </>
                  ) : (
                    <li>
                      <Link className="dropdown-item" to={rutaInicialPorRol(sesion.tipoUsuario)} onClick={cerrarMenu}>
                        {sesion.tipoUsuario === ROL.NUTRICIONISTA ? 'Mi agenda' : 'Administración'}
                      </Link>
                    </li>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li><button type="button" className="dropdown-item" onClick={salir}>Cerrar sesión</button></li>
                </ul>
              </li>
            ) : (
              <li className="nav-item"><NavLink className={claseEnlace} to="/login" onClick={cerrarMenu}>Ingresar</NavLink></li>
            )}
            <li className="nav-item ms-xl-2 mt-2 mt-xl-0">
              <Link to={principal.ruta} className="btn btn-nv-primario btn-sm" onClick={cerrarMenu}>{principal.texto}</Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
