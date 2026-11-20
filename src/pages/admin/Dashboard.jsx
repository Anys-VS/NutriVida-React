import { Link } from 'react-router-dom'
import EstadoCarga from '../../components/EstadoCarga'
import { calcularMetricas } from '../../domain/metricas'
import { useCarga } from '../../hooks/useCarga'
import { cargarDatosAdministracion } from '../../services/panel'
import { formatearPrecioCLP } from '../../utils/formato'

function Metrica({ etiqueta, valor, enlace, textoEnlace }) {
  return (
    <div className="col-md-6 col-xl-4">
      <article className="tarjeta-admin-metrica">
        <span className="metrica-label">{etiqueta}</span>
        <strong>{valor}</strong>
        <Link to={enlace}>{textoEnlace} →</Link>
      </article>
    </div>
  )
}

// Métricas de la clínica calculadas con los datos de ms-citas, ms-catalogo y ms-identidad (modo 'api').
function Dashboard() {
  const { datos, cargando, error, reintentar } = useCarga(cargarDatosAdministracion)
  if (!datos) return <EstadoCarga cargando={cargando} error={error} reintentar={reintentar} que="el resumen" />
  const metricas = calcularMetricas({
    citas: datos.citas,
    planes: datos.planes,
    totalServicios: datos.servicios.length,
    totalUsuarios: datos.totalUsuarios,
  })

  return (
    <>
      <h1 className="titulo-seccion">Panel de administración</h1>
      <p className="intro-seccion">Gestiona las citas, el catálogo y los usuarios de NutriVida desde un solo lugar.</p>

      {metricas.reembolsosPendientes > 0 && (
        <div role="alert" className="alert alert-warning">
          Hay {metricas.reembolsosPendientes} reembolso(s) pendiente(s) de registrar. <Link to="/admin/citas">Ir a citas</Link> · <Link to="/admin/planes">Ir a planes</Link>
        </div>
      )}

      <div className="row g-4 mb-4">
        <Metrica etiqueta="Citas por confirmar" valor={metricas.porEstado['Por confirmar']} enlace="/admin/citas" textoEnlace="Ver citas" />
        <Metrica etiqueta="Citas activas de hoy" valor={metricas.citasHoy} enlace="/admin/citas" textoEnlace="Ver citas" />
        <Metrica etiqueta="Inasistencias" valor={metricas.porEstado['Inasistencia']} enlace="/admin/citas" textoEnlace="Ver citas" />
        <Metrica etiqueta="Pagos recibidos" valor={formatearPrecioCLP(metricas.ingresos)} enlace="/admin/citas" textoEnlace="Ver pagos" />
        <Metrica etiqueta="Servicios publicados" valor={metricas.totalServicios} enlace="/admin/servicios" textoEnlace="Administrar catálogo" />
        <Metrica etiqueta="Usuarios registrados" valor={metricas.totalUsuarios} enlace="/admin/usuarios" textoEnlace="Administrar usuarios" />
      </div>

      <article className="tarjeta-formulario">
        <h2 className="h4">Citas por estado</h2>
        <div className="table-responsive">
          <table className="table tabla-admin align-middle mb-0">
            <caption className="visually-hidden">Cantidad de citas por estado</caption>
            <thead><tr><th>Estado</th><th>Cantidad</th></tr></thead>
            <tbody>
              {Object.entries(metricas.porEstado).map(([estado, cantidad]) => (
                <tr key={estado}><td>{estado}</td><td>{cantidad}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </>
  )
}

export default Dashboard
