import { Link, useNavigate, useParams } from 'react-router-dom'
import EstadoCarga from '../components/EstadoCarga'
import ListaServicios from '../components/ListaServicios'
import { useCarga } from '../hooks/useCarga'
import { obtenerCategoria } from '../services/catalogo'

function Categoria() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { datos, cargando, error, reintentar } = useCarga(() => obtenerCategoria(slug), [slug])

  if (cargando || error) {
    return (
      <section className="seccion">
        <div className="container"><EstadoCarga cargando={cargando} error={error} reintentar={reintentar} que="la categoría" /></div>
      </section>
    )
  }

  if (!datos) {
    return (
      <section className="seccion">
        <div className="container">
          <p className="mensaje-detalle-error">
            No encontramos esa categoría. <Link to="/categorias">Ver todas las categorías</Link>.
          </p>
        </div>
      </section>
    )
  }

  const { categoria, servicios } = datos
  return (
    <section className="seccion">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/categorias">Categorías</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{categoria.titulo}</li>
          </ol>
        </nav>
        <h1 className="titulo-seccion">{categoria.titulo}</h1>
        <p className="intro-seccion">{categoria.descripcion}</p>
        <ListaServicios servicios={servicios} onReservar={(codigo) => navigate(`/reservar?servicio=${codigo}`)} />
      </div>
    </section>
  )
}

export default Categoria
