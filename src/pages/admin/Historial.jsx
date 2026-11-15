import { Link, useParams } from 'react-router-dom'
import EstadoBadge from '../../components/EstadoBadge'
import { usuarios } from '../../data/db'
import { citasDePaciente } from '../../services/reservas'
import { planesDePaciente } from '../../services/planes'
import { formatearFechaHora, formatearPrecioCLP } from '../../utils/formato'

function Historial() {
  const { run } = useParams()
  const usuario = usuarios.obtener(run)

  if (!usuario) {
    return <p className="mensaje-detalle-error">No encontramos ese usuario. <Link to="/admin/usuarios">Volver a Usuarios</Link>.</p>
  }

  const citas = citasDePaciente(usuario.correo)
  const planes = planesDePaciente(usuario.correo)

  return (
    <>
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/admin/usuarios">Usuarios</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Historial</li>
        </ol>
      </nav>
      <h1 className="titulo-seccion">Historial de {usuario.nombre} {usuario.apellidos}</h1>
      <p className="intro-seccion">{usuario.correo} · {usuario.tipoUsuario}</p>

      <h2 className="h4">Planes</h2>
      <div className="table-responsive mb-4">
        <table className="table tabla-admin align-middle">
          <caption className="visually-hidden">Planes del usuario</caption>
          <thead><tr><th>Plan</th><th>Sesiones atendidas</th><th>Estado</th><th>Pago</th></tr></thead>
          <tbody>
            {planes.length === 0 && <tr><td colSpan={4} className="text-center">Sin planes contratados.</td></tr>}
            {planes.map((plan) => (
              <tr key={plan.id}>
                <td>{plan.nombre}</td><td>{plan.resumen.atendidas} de {plan.resumen.total}</td>
                <td><EstadoBadge estado={plan.estadoPlan} /></td>
                <td><EstadoBadge estado={plan.estadoPago} /> {formatearPrecioCLP(plan.montoPagado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h4">Citas</h2>
      <div className="table-responsive">
        <table className="table tabla-admin align-middle">
          <caption className="visually-hidden">Citas del usuario</caption>
          <thead><tr><th>Servicio</th><th>Fecha y hora</th><th>Estado</th><th>Pago</th></tr></thead>
          <tbody>
            {citas.length === 0 && <tr><td colSpan={4} className="text-center">Sin citas registradas.</td></tr>}
            {citas.map((cita) => (
              <tr key={cita.id}>
                <td>{cita.nombreServicio}</td><td>{formatearFechaHora(cita.fechaHora)}</td>
                <td><EstadoBadge estado={cita.estadoCita} /></td>
                <td>{cita.planId ? 'Incluida en el plan' : <><EstadoBadge estado={cita.estadoPago} /> {formatearPrecioCLP(cita.precio)}</>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Historial
