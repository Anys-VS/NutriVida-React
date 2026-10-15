import { Link, useNavigate, useParams } from 'react-router-dom'
import ListaServicios from '../components/ListaServicios'
import { categorias, servicios } from '../data/db'

function Categoria() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const categoria = categorias.obtener(slug)

  if (!categoria) {
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
        <ListaServicios
          servicios={servicios.listar().filter((s) => s.tipo === categoria.tipo)}
          onReservar={(codigo) => navigate(`/reservar?servicio=${codigo}`)}
        />
      </div>
    </section>
  )
}

export default Categoria
