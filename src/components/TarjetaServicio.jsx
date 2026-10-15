import { Link } from 'react-router-dom'
import { precioFinal } from '../domain/precios'
import { formatearPrecioCLP } from '../utils/formato'

function TarjetaServicio({ servicio, onReservar }) {
  const { codigo, tipo, nombre, duracion, modalidad, descripcion } = servicio
  const final = precioFinal(servicio)
  const enOferta = final < servicio.precio

  return (
    <article className="tarjeta-servicio">
      <span className="franja-tipo">{tipo}</span>
      <img className="imagen-servicio" src="/imagenes/servicio-placeholder.svg" alt={`Ilustración del servicio ${nombre}`} />
      <div className="cuerpo-servicio">
        <h3>{nombre}</h3>
        <p className="meta-servicio">{duracion} · {modalidad}</p>
        <p className="descripcion-servicio">{descripcion}</p>
        <p className="precio-servicio">
          {enOferta && <s className="text-muted fs-6 me-2">{formatearPrecioCLP(servicio.precio)}</s>}
          {formatearPrecioCLP(final)}
          {enOferta && <span className="badge text-bg-danger ms-2">-{servicio.descuento}%</span>}
        </p>
        <div className="acciones-servicio">
          <Link to={`/servicio/${codigo}`} className="btn btn-nv-secundario boton-servicio">Ver detalle</Link>
          <button type="button" className="btn btn-nv-primario boton-servicio" onClick={() => onReservar(codigo)}>
            Reservar
          </button>
        </div>
      </div>
    </article>
  )
}

export default TarjetaServicio
