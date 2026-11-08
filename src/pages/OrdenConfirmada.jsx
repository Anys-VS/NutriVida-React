import { Link, useParams } from 'react-router-dom'
import { useSesion } from '../context/SesionContext'
import { ordenes } from '../data/db'
import { formatearFechaHora, formatearPrecioCLP } from '../utils/formato'

// Comprobante de una orden: una boleta con el detalle de cada cita o plan pagado.
function OrdenConfirmada() {
  const { id } = useParams()
  const { sesion } = useSesion()
  const orden = ordenes.obtener(id)

  if (!orden || orden.pacienteCorreo.toLowerCase() !== sesion.correo.toLowerCase()) {
    return (
      <section className="seccion">
        <div className="container">
          <p className="mensaje-detalle-error">No encontramos esa orden. <Link to="/mis-citas">Ver mis citas</Link>.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="seccion">
      <div className="container contenedor-angosto">
        <h1 className="titulo-seccion">¡Pago recibido!</h1>
        <p className="texto-ayuda mb-3">Orden N° {orden.id} · {formatearFechaHora(orden.fecha)} · {orden.tipoOrden}</p>
        <div role="status" className="alert alert-success">
          Pagaste {orden.detalle.length} atención(es). Todas quedaron confirmadas; te enviamos el detalle por correo.
        </div>
        <div className="table-responsive">
          <table className="table tabla-admin tabla-compacta align-middle">
            <caption className="visually-hidden">Detalle de la orden</caption>
            <thead>
              <tr><th>Servicio</th><th>Fecha y hora</th><th>Nutricionista</th><th className="text-end">Precio</th></tr>
            </thead>
            <tbody>
              {orden.detalle.map((linea) => (
                <tr key={linea.citaId}>
                  <td>{linea.nombreServicio}{linea.planId && <><br /><small className="texto-ayuda">Plan: primera sesión</small></>}</td>
                  <td>{formatearFechaHora(linea.fechaHora)}</td>
                  <td>{linea.nutricionista || 'Por asignar'}</td>
                  <td className="text-end">{formatearPrecioCLP(linea.precio)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><th colSpan={3}>Total pagado</th><th className="text-end">{formatearPrecioCLP(orden.total)}</th></tr>
            </tfoot>
          </table>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/mis-citas" className="btn btn-nv-primario">Ver mis citas</Link>
          <Link to="/servicios" className="btn btn-nv-secundario">Seguir explorando</Link>
        </div>
      </div>
    </section>
  )
}

export default OrdenConfirmada
