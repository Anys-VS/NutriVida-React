import { Link, useNavigate } from 'react-router-dom'
import EstadoCarga from '../components/EstadoCarga'
import ListaServicios from '../components/ListaServicios'
import { useCarga } from '../hooks/useCarga'
import { listarServicios } from '../services/catalogo'
import { precioFinal } from '../domain/precios'

function Ofertas() {
  const navigate = useNavigate()
  const { datos, cargando, error, reintentar } = useCarga(listarServicios)
  const enOferta = (datos ?? []).filter((servicio) => precioFinal(servicio) < servicio.precio)

  return (
    <section className="seccion">
      <div className="container">
        <h1 className="titulo-seccion">Ofertas</h1>
        <p className="intro-seccion">Servicios con precio rebajado por tiempo limitado.</p>
        <EstadoCarga cargando={cargando} error={error} reintentar={reintentar} que="las ofertas" />
        {datos && (enOferta.length === 0 ? (
          <p className="mensaje-sin-servicios">
            Por ahora no hay ofertas vigentes. <Link to="/servicios">Revisa todos los servicios</Link>.
          </p>
        ) : (
          <ListaServicios servicios={enOferta} onReservar={(codigo) => navigate(`/reservar?servicio=${codigo}`)} />
        ))}
      </div>
    </section>
  )
}

export default Ofertas
