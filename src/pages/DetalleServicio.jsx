import { Link, useParams } from 'react-router-dom'
import { servicios } from '../data/db'
import { precioFinal } from '../domain/precios'
import { formatearPrecioCLP } from '../utils/formato'

function DetalleServicio() {
  const { codigo } = useParams()
  const servicio = servicios.obtener(codigo)

  if (!servicio) {
    return (
      <section className="seccion">
        <div className="container">
          <p className="mensaje-detalle-error">
            No encontramos ese servicio. <Link to="/servicios">Vuelve al listado completo</Link>.
          </p>
        </div>
      </section>
    )
  }

  const final = precioFinal(servicio)
  const tieneDescuento = final < servicio.precio

  return (
    <section className="seccion">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/servicios">Servicios</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Detalle</li>
          </ol>
        </nav>
        <article className="contenedor-angosto">
          <span className="franja-tipo">{servicio.tipo}</span>
          <img className="imagen-servicio imagen-detalle" src="/imagenes/servicio-placeholder.svg"
            alt={`Ilustración del servicio ${servicio.nombre}`} />
          <h1 className="titulo-detalle-servicio">{servicio.nombre}</h1>
          <p className="meta-detalle-servicio">
            {servicio.duracion} · {servicio.modalidad} · Atiende: {servicio.profesional}
          </p>
          <p>{servicio.descripcion}</p>
          {servicio.tipo === 'Plan especializado' && (servicio.sesiones
            ? <p><strong>Incluye {servicio.sesiones} sesiones.</strong> Se paga completo y online.</p>
            : <p className="texto-ayuda">Este plan aún no tiene sus sesiones definidas. Consulta con la clínica.</p>)}
          {servicio.cupos && <p><strong>Cupos por taller: {servicio.cupos}.</strong></p>}
          <p className="precio-detalle-servicio">
            {tieneDescuento && <s className="me-2">{formatearPrecioCLP(servicio.precio)}</s>}
            {formatearPrecioCLP(final)}
          </p>
          <div className="acciones-detalle-servicio">
            <Link to={`/reservar?servicio=${servicio.codigo}`} className="btn btn-nv-primario boton-detalle">
              Reservar esta hora
            </Link>
            <Link to="/servicios" className="btn btn-nv-secundario boton-detalle">Ver otros servicios</Link>
          </div>
        </article>
      </div>
    </section>
  )
}

export default DetalleServicio
