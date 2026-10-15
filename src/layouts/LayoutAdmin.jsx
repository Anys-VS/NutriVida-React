import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSesion } from '../context/SesionContext'
import { ROL } from '../config/reglas'

const claseMenu = ({ isActive }) => (isActive ? 'activo' : undefined)

function LayoutAdmin() {
  const { sesion, cerrar } = useSesion()
  const navigate = useNavigate()
  const esAdmin = sesion.tipoUsuario === ROL.ADMIN

  const salir = () => {
    cerrar()
    navigate('/login')
  }

  return (
    <>
      <header className="encabezado-admin">
        <div className="container py-3 d-flex justify-content-between align-items-center gap-3">
          <Link className="marca-nv" to={esAdmin ? '/admin' : '/admin/citas'}>
            <span className="hoja-icono">◆</span> NutriVida <small className="etiqueta-admin">Administración</small>
          </Link>
          <div className="d-flex align-items-center gap-3">
            <span className="texto-sesion">{sesion.nombre} · {sesion.tipoUsuario}</span>
            <button type="button" className="btn btn-sm btn-outline-light" onClick={salir}>Cerrar sesión</button>
          </div>
        </div>
      </header>
      <main className="seccion">
        <div className="container">
          <div className="row g-4">
            <aside className="col-lg-3">
              <nav className="menu-admin" aria-label="Menú administrativo">
                <p className="menu-admin-titulo">Gestión del sistema</p>
                {esAdmin && <NavLink to="/admin" end className={claseMenu}>Resumen</NavLink>}
                <NavLink to="/admin/citas" className={claseMenu}>Citas</NavLink>
                {esAdmin && <NavLink to="/admin/planes" className={claseMenu}>Planes</NavLink>}
                {esAdmin && <NavLink to="/admin/servicios" className={claseMenu}>Productos y servicios</NavLink>}
                {esAdmin && <NavLink to="/admin/categorias" className={claseMenu}>Categorías</NavLink>}
                {esAdmin && <NavLink to="/admin/criticos" className={claseMenu}>Cupos críticos</NavLink>}
                {esAdmin && <NavLink to="/admin/reportes" className={claseMenu}>Reportes</NavLink>}
                {esAdmin && <NavLink to="/admin/usuarios" className={claseMenu}>Usuarios</NavLink>}
                <NavLink to="/admin/perfil" className={claseMenu}>Mi perfil</NavLink>
                <Link to="/">Ver tienda pública</Link>
              </nav>
            </aside>
            <section className="col-lg-9">
              <Outlet />
            </section>
          </div>
        </div>
      </main>
    </>
  )
}

export default LayoutAdmin
