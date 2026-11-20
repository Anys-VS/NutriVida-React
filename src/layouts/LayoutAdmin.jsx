import { Suspense } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSesion } from '../context/SesionContext'
import { ROL } from '../config/reglas'
import { puede } from '../config/permisos'
import { rutaInicialPorRol } from '../services/auth'

const claseMenu = ({ isActive }) => (isActive ? 'activo' : undefined)

// Íconos de trazo simple para el menú (24x24, heredan el color del enlace).
const TRAZOS = {
  resumen: 'M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-18v6h8V3h-8Z',
  agenda: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  pacientes: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  citas: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
  planes: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14ZM20 17v4H6.5A2.5 2.5 0 0 1 4 18.5',
  servicios: 'M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8',
  categorias: 'M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82ZM7 7h.01',
  criticos: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01',
  reportes: 'M3 3v18h18M18 17V9M13 17V5M8 17v-3',
  usuarios: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-8 10a8 8 0 0 1 16 0',
  perfil: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  tienda: 'M3 9l1.5-5h15L21 9M3 9h18M3 9v11h18V9M9 20v-6h6v6',
}

function Icono({ nombre }) {
  return (
    <svg className="icono-menu" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={TRAZOS[nombre]} />
    </svg>
  )
}

function OpcionMenu({ to, icono, children, end }) {
  return (
    <NavLink to={to} end={end} className={claseMenu}>
      <Icono nombre={icono} />
      <span>{children}</span>
    </NavLink>
  )
}

function LayoutAdmin() {
  const { sesion, cerrar } = useSesion()
  const navigate = useNavigate()
  const esNutricionista = sesion.tipoUsuario === ROL.NUTRICIONISTA
  const inicio = rutaInicialPorRol(sesion.tipoUsuario)
  // Cada opción del menú aparece solo si el rol tiene el permiso (la misma regla que protege la ruta).
  const ver = (permiso) => puede(sesion, permiso)
  // Las cuentas de prueba se llaman igual que su rol (p. ej. "Recepción"); en ese caso no se repite.
  const mostrarRol = sesion.nombre?.trim().toLowerCase() !== sesion.tipoUsuario?.toLowerCase()

  const salir = () => {
    cerrar()
    navigate('/login')
  }

  return (
    <>
      <header className="encabezado-admin">
        <div className="container py-3 d-flex justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <Link className="marca-admin" to={inicio}>
              <img src="/imagenes/banner-top.svg" alt="NutriVida, ir al inicio del panel" width="175" height="48" />
            </Link>
            <span className="etiqueta-admin">{esNutricionista ? 'Panel profesional' : 'Administración'}</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="texto-sesion">
              {sesion.nombre}
              {mostrarRol && <span className="rol-sesion">{sesion.tipoUsuario}</span>}
            </span>
            <button type="button" className="btn btn-sm btn-light" onClick={salir}>Cerrar sesión</button>
          </div>
        </div>
      </header>
      <main className="seccion">
        <div className="container">
          <div className="row g-4">
            <aside className="col-lg-3">
              <nav className="menu-admin" aria-label="Menú administrativo">
                <p className="menu-admin-titulo">{esNutricionista ? 'Mi consulta' : 'Gestión del sistema'}</p>
                <div className="menu-admin-grupo">
                  {ver('panel:resumen') && <OpcionMenu to="/admin" end icono="resumen">Resumen</OpcionMenu>}
                  {ver('agenda:propia') && <OpcionMenu to="/admin/agenda" icono="agenda">Mi agenda</OpcionMenu>}
                  {ver('fichas:gestionar') && <OpcionMenu to="/admin/pacientes" icono="pacientes">Mis pacientes</OpcionMenu>}
                  {ver('citas:gestionar') && <OpcionMenu to="/admin/citas" icono="citas">Citas</OpcionMenu>}
                  {ver('catalogo:gestionar') && <OpcionMenu to="/admin/planes" icono="planes">Planes</OpcionMenu>}
                  {ver('catalogo:gestionar') && <OpcionMenu to="/admin/servicios" icono="servicios">Productos y servicios</OpcionMenu>}
                  {ver('catalogo:gestionar') && <OpcionMenu to="/admin/categorias" icono="categorias">Categorías</OpcionMenu>}
                  {ver('catalogo:gestionar') && <OpcionMenu to="/admin/criticos" icono="criticos">Cupos críticos</OpcionMenu>}
                  {ver('reportes:ver') && <OpcionMenu to="/admin/reportes" icono="reportes">Reportes</OpcionMenu>}
                  {ver('usuarios:gestionar') && <OpcionMenu to="/admin/usuarios" icono="usuarios">Usuarios</OpcionMenu>}
                </div>
                <p className="menu-admin-titulo menu-admin-titulo-cuenta">Mi cuenta</p>
                <div className="menu-admin-grupo">
                  <OpcionMenu to="/admin/perfil" icono="perfil">Mi perfil</OpcionMenu>
                  <Link to="/"><Icono nombre="tienda" /><span>Ver tienda pública</span></Link>
                </div>
              </nav>
            </aside>
            <section className="col-lg-9">
              <Suspense fallback={<p className="texto-ayuda" role="status">Cargando…</p>}>
                <Outlet />
              </Suspense>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}

export default LayoutAdmin
