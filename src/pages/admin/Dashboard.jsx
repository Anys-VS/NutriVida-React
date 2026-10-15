import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { citas, planes, servicios, usuarios } from '../../data/db'
import { calcularMetricas } from '../../domain/metricas'
import { cancelarCitasVencidas } from '../../services/reservas'
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

function Dashboard() {
  const m = useMemo(() => {
    cancelarCitasVencidas() // RN-06: deja los datos al día antes de mostrar las métricas
    return calcularMetricas({
      citas: citas.listar(),
      planes: planes.listar(),
      totalServicios: servicios.listar().length,
      totalUsuarios: usuarios.listar().length,
    })
  }, [])

  return (
    <>
      <h1 className="titulo-seccion">Panel de administración</h1>
      <p className="intro-seccion">Gestiona las citas, el catálogo y los usuarios de NutriVida desde un solo lugar.</p>

      {m.reembolsosPendientes > 0 && (
        <div role="alert" className="alert alert-warning">
          Hay {m.reembolsosPendientes} reembolso(s) pendiente(s) de registrar. <Link to="/admin/citas">Ir a citas</Link> · <Link to="/admin/planes">Ir a planes</Link>
        </div>
      )}

      <div className="row g-4 mb-4">
        <Metrica etiqueta="Citas por confirmar" valor={m.porEstado['Por confirmar']} enlace="/admin/citas" textoEnlace="Ver citas" />
        <Metrica etiqueta="Citas activas de hoy" valor={m.citasHoy} enlace="/admin/citas" textoEnlace="Ver citas" />
        <Metrica etiqueta="Inasistencias" valor={m.porEstado['Inasistencia']} enlace="/admin/citas" textoEnlace="Ver citas" />
        <Metrica etiqueta="Pagos recibidos" valor={formatearPrecioCLP(m.ingresos)} enlace="/admin/citas" textoEnlace="Ver pagos" />
        <Metrica etiqueta="Servicios publicados" valor={m.totalServicios} enlace="/admin/servicios" textoEnlace="Administrar catálogo" />
        <Metrica etiqueta="Usuarios registrados" valor={m.totalUsuarios} enlace="/admin/usuarios" textoEnlace="Administrar usuarios" />
      </div>

      <article className="tarjeta-formulario">
        <h2 className="h4">Citas por estado</h2>
        <div className="table-responsive">
          <table className="table tabla-admin align-middle mb-0">
            <caption className="visually-hidden">Cantidad de citas por estado</caption>
            <thead><tr><th>Estado</th><th>Cantidad</th></tr></thead>
            <tbody>
              {Object.entries(m.porEstado).map(([estado, cantidad]) => (
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
