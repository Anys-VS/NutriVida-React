import { Link, useParams } from 'react-router-dom'
import EstadoBadge from '../components/EstadoBadge'
import { useSesion } from '../context/SesionContext'
import { citas, planes } from '../data/db'
import { resumenSesiones } from '../domain/planes'
import { ESTADO_CITA, ESTADO_PAGO } from '../config/reglas'
import { formatearFechaHora, formatearPrecioCLP } from '../utils/formato'

function mensajeDePlan(cita) {
  const plan = planes.obtener(cita.planId)
  if (!plan) return 'Tu sesión quedó confirmada.'
  const r = resumenSesiones(plan, citas.listar().filter((c) => c.planId === plan.id))
  const inicio = cita.primeraSesion
    ? `Tu plan "${plan.nombre}" quedó contratado y pagado (${formatearPrecioCLP(plan.montoPagado)}). `
    : `Tu sesión del plan "${plan.nombre}" quedó confirmada. `
  return `${inicio}Te quedan ${r.porAgendar} sesión(es) por agendar desde Mis citas.`
}

function mensajeDeEstado(cita) {
  if (cita.planId) return mensajeDePlan(cita)
  if (cita.estadoCita === ESTADO_CITA.POR_CONFIRMAR) {
    return `Tu reserva quedó por confirmar. Confirma tu asistencia desde Mis citas antes del ${formatearFechaHora(cita.limiteConfirmacion)}; si no lo haces, se cancelará automáticamente y se liberará el horario.`
  }
  if (cita.estadoPago === ESTADO_PAGO.PAGADO) return 'Tu reserva está confirmada y el pago fue recibido.'
  return 'Tu reserva está confirmada. Pagas en la clínica el día de tu atención.'
}

function ReservaConfirmada() {
  const { id } = useParams()
  const { sesion } = useSesion()
  const cita = citas.obtener(id)

  if (!cita || cita.pacienteCorreo !== sesion.correo) {
    return (
      <section className="seccion">
        <div className="container">
          <p className="mensaje-detalle-error">
            No encontramos esa reserva. <Link to="/mis-citas">Ver mis citas</Link>.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="seccion">
      <div className="container">
        <div className="tarjeta-formulario contenedor-angosto mx-auto">
          <h1 className="h3">Reserva registrada</h1>
          <p className="texto-ayuda mb-3">Comprobante N° {cita.id}</p>
          <div role="status" className="alert alert-success">{mensajeDeEstado(cita)}</div>
          <dl className="mb-3">
            <dt>Servicio</dt><dd>{cita.nombreServicio}</dd>
            <dt>Fecha y hora</dt><dd>{formatearFechaHora(cita.fechaHora)}</dd>
            <dt>Nutricionista</dt><dd>{cita.nutricionista || 'Sin preferencia'}</dd>
            <dt>Estado de la cita</dt><dd><EstadoBadge estado={cita.estadoCita} /></dd>
            <dt>Estado del pago</dt><dd><EstadoBadge estado={cita.estadoPago} /></dd>
            <dt>Total</dt><dd>{cita.planId ? 'Incluida en el plan' : formatearPrecioCLP(cita.precio)}</dd>
            <dt>Confirmación enviada a</dt><dd>{cita.correoConfirmacion}</dd>
          </dl>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/mis-citas" className="btn btn-nv-primario">Ver mis citas</Link>
            <button type="button" className="btn btn-nv-secundario" onClick={() => window.print()}>
              Imprimir comprobante
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ReservaConfirmada
