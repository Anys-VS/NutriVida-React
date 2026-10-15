import { Link, useNavigate } from 'react-router-dom'
import ListaServicios from '../components/ListaServicios'
import { servicios } from '../data/db'
import { precioFinal } from '../domain/precios'

function Ofertas() {
  const navigate = useNavigate()
  const enOferta = servicios.listar().filter((s) => precioFinal(s) < s.precio)

  return (
    <section className="seccion">
      <div className="container">
        <h1 className="titulo-seccion">Ofertas</h1>
        <p className="intro-seccion">Servicios con precio rebajado por tiempo limitado.</p>
        {enOferta.length === 0 ? (
          <p className="mensaje-sin-servicios">
            Por ahora no hay ofertas vigentes. <Link to="/servicios">Revisa todos los servicios</Link>.
          </p>
        ) : (
          <ListaServicios servicios={enOferta} onReservar={(codigo) => navigate(`/reservar?servicio=${codigo}`)} />
        )}
      </div>
    </section>
  )
}

export default Ofertas
