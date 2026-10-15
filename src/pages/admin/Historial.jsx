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
            {planes.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td><td>{p.resumen.atendidas} de {p.resumen.total}</td>
                <td><EstadoBadge estado={p.estadoPlan} /></td>
                <td><EstadoBadge estado={p.estadoPago} /> {formatearPrecioCLP(p.montoPagado)}</td>
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
            {citas.map((c) => (
              <tr key={c.id}>
                <td>{c.nombreServicio}</td><td>{formatearFechaHora(c.fechaHora)}</td>
                <td><EstadoBadge estado={c.estadoCita} /></td>
                <td>{c.planId ? 'Incluida en el plan' : <><EstadoBadge estado={c.estadoPago} /> {formatearPrecioCLP(c.precio)}</>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Historial
