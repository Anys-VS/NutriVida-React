import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import LayoutPublico from './layouts/LayoutPublico'
import { rutaInicialPorRol } from './services/auth'
import RutaProtegida from './components/RutaProtegida'
import Inicio from './pages/Inicio'
import Servicios from './pages/Servicios'
import DetalleServicio from './pages/DetalleServicio'
import Reservar from './pages/Reservar'
import Checkout from './pages/Checkout'
import ReservaConfirmada from './pages/ReservaConfirmada'
import PagoError from './pages/PagoError'
import Login from './pages/Login'
import Registro from './pages/Registro'
import MisCitas from './pages/MisCitas'
import Proximamente from './pages/Proximamente'
import Categorias from './pages/Categorias'
import Categoria from './pages/Categoria'
import Ofertas from './pages/Ofertas'
import Nosotros from './pages/Nosotros'
import Contacto from './pages/Contacto'
import Blog from './pages/Blog'
import ArticuloBlog from './pages/ArticuloBlog'
import Carrito from './pages/Carrito'
import OrdenConfirmada from './pages/OrdenConfirmada'
import Especialistas from './pages/Especialistas'
import MiProgreso from './pages/MiProgreso'

// El panel interno se descarga solo cuando alguien del personal entra (los pacientes no lo bajan).
const LayoutAdmin = lazy(() => import('./layouts/LayoutAdmin'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminCitas = lazy(() => import('./pages/admin/AdminCitas'))
const AdminServicios = lazy(() => import('./pages/admin/AdminServicios'))
const AdminUsuarios = lazy(() => import('./pages/admin/AdminUsuarios'))
const AdminCategorias = lazy(() => import('./pages/admin/AdminCategorias'))
const Criticos = lazy(() => import('./pages/admin/Criticos'))
const Reportes = lazy(() => import('./pages/admin/Reportes'))
const AdminPlanes = lazy(() => import('./pages/admin/AdminPlanes'))
const Perfil = lazy(() => import('./pages/admin/Perfil'))
const Historial = lazy(() => import('./pages/admin/Historial'))
const Agenda = lazy(() => import('./pages/admin/Agenda'))
const Pacientes = lazy(() => import('./pages/admin/Pacientes'))
const FichaPaciente = lazy(() => import('./pages/admin/FichaPaciente'))

// Cada ruta privada declara el permiso que necesita (ver config/permisos.js).
const protegida = (permiso, pagina) => <RutaProtegida permiso={permiso}>{pagina}</RutaProtegida>

function AppRoutes() {
  return (
    <Routes>
      <Route element={<LayoutPublico />}>
        <Route index element={<Inicio />} />
        <Route path="servicios" element={<Servicios />} />
        <Route path="servicio/:codigo" element={<DetalleServicio />} />
        <Route path="categorias" element={<Categorias />} />
        <Route path="categoria/:slug" element={<Categoria />} />
        <Route path="ofertas" element={<Ofertas />} />
        <Route path="nosotros" element={<Nosotros />} />
        <Route path="contacto" element={<Contacto />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:id" element={<ArticuloBlog />} />
        <Route path="reservar" element={<Reservar />} />
        <Route path="checkout" element={protegida('reservas:propias', <Checkout />)} />
        <Route path="reserva-confirmada/:id" element={protegida('reservas:propias', <ReservaConfirmada />)} />
        <Route path="pago-error" element={<PagoError />} />
        <Route path="login" element={<Login />} />
        <Route path="registro" element={<Registro />} />
        <Route path="especialistas" element={<Especialistas />} />
        <Route path="mis-citas" element={protegida('reservas:propias', <MisCitas />)} />
        <Route path="mi-progreso" element={protegida('reservas:propias', <MiProgreso />)} />
        <Route path="carrito" element={protegida('reservas:propias', <Carrito />)} />
        <Route path="orden/:id" element={protegida('reservas:propias', <OrdenConfirmada />)} />
        <Route path="*" element={<Proximamente />} />
      </Route>

      <Route path="admin" element={protegida('panel:acceder', <Suspense fallback={<p className="container seccion texto-ayuda" role="status">Cargando panel…</p>}><LayoutAdmin /></Suspense>)}>
        {/* El resumen es del administrador; los demás roles del panel entran directo a su página inicial. */}
        <Route index element={<RutaProtegida permiso="panel:resumen" redirigir={(s) => rutaInicialPorRol(s.tipoUsuario)}><Dashboard /></RutaProtegida>} />
        <Route path="citas" element={protegida('citas:gestionar', <AdminCitas />)} />
        <Route path="agenda" element={protegida('agenda:propia', <Agenda />)} />
        <Route path="pacientes" element={protegida('fichas:gestionar', <Pacientes />)} />
        <Route path="pacientes/:run" element={protegida('fichas:gestionar', <FichaPaciente />)} />
        <Route path="servicios" element={protegida('catalogo:gestionar', <AdminServicios />)} />
        <Route path="categorias" element={protegida('catalogo:gestionar', <AdminCategorias />)} />
        <Route path="criticos" element={protegida('catalogo:gestionar', <Criticos />)} />
        <Route path="reportes" element={protegida('reportes:ver', <Reportes />)} />
        <Route path="planes" element={protegida('catalogo:gestionar', <AdminPlanes />)} />
        <Route path="usuarios" element={protegida('usuarios:gestionar', <AdminUsuarios />)} />
        <Route path="usuarios/:run/historial" element={protegida('usuarios:gestionar', <Historial />)} />
        <Route path="perfil" element={<Perfil />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
