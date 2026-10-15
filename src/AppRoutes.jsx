import { Routes, Route } from 'react-router-dom'
import LayoutPublico from './layouts/LayoutPublico'
import LayoutAdmin from './layouts/LayoutAdmin'
import { ROL } from './config/reglas'
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
import Dashboard from './pages/admin/Dashboard'
import AdminCitas from './pages/admin/AdminCitas'
import AdminServicios from './pages/admin/AdminServicios'
import AdminUsuarios from './pages/admin/AdminUsuarios'
import AdminCategorias from './pages/admin/AdminCategorias'
import Criticos from './pages/admin/Criticos'
import Reportes from './pages/admin/Reportes'
import AdminPlanes from './pages/admin/AdminPlanes'
import Perfil from './pages/admin/Perfil'
import Historial from './pages/admin/Historial'

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
        <Route path="checkout" element={<RutaProtegida><Checkout /></RutaProtegida>} />
        <Route path="reserva-confirmada/:id" element={<RutaProtegida><ReservaConfirmada /></RutaProtegida>} />
        <Route path="pago-error" element={<PagoError />} />
        <Route path="login" element={<Login />} />
        <Route path="registro" element={<Registro />} />
        <Route path="mis-citas" element={<RutaProtegida><MisCitas /></RutaProtegida>} />
        <Route path="*" element={<Proximamente />} />
      </Route>

      <Route path="admin" element={<RutaProtegida roles={[ROL.ADMIN, ROL.RECEPCION]}><LayoutAdmin /></RutaProtegida>}>
        <Route index element={<RutaProtegida roles={[ROL.ADMIN]} fallback="/admin/citas"><Dashboard /></RutaProtegida>} />
        <Route path="citas" element={<AdminCitas />} />
        <Route path="servicios" element={<RutaProtegida roles={[ROL.ADMIN]} fallback="/admin/citas"><AdminServicios /></RutaProtegida>} />
        <Route path="categorias" element={<RutaProtegida roles={[ROL.ADMIN]} fallback="/admin/citas"><AdminCategorias /></RutaProtegida>} />
        <Route path="criticos" element={<RutaProtegida roles={[ROL.ADMIN]} fallback="/admin/citas"><Criticos /></RutaProtegida>} />
        <Route path="reportes" element={<RutaProtegida roles={[ROL.ADMIN]} fallback="/admin/citas"><Reportes /></RutaProtegida>} />
        <Route path="planes" element={<RutaProtegida roles={[ROL.ADMIN]} fallback="/admin/citas"><AdminPlanes /></RutaProtegida>} />
        <Route path="usuarios" element={<RutaProtegida roles={[ROL.ADMIN]} fallback="/admin/citas"><AdminUsuarios /></RutaProtegida>} />
        <Route path="usuarios/:run/historial" element={<RutaProtegida roles={[ROL.ADMIN]} fallback="/admin/citas"><Historial /></RutaProtegida>} />
        <Route path="perfil" element={<Perfil />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
