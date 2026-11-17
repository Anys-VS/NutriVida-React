import { Link } from 'react-router-dom'
import EstadoCarga from '../components/EstadoCarga'
import { useCarga } from '../hooks/useCarga'
import { listarCategorias, listarServicios } from '../services/catalogo'

// Categorías con la cantidad de servicios de cada una (ms-catalogo en modo 'api').
const cargarCategorias = async () => {
  const [categorias, servicios] = await Promise.all([listarCategorias(), listarServicios()])
  return categorias.map((categoria) => ({
    ...categoria,
    cantidad: servicios.filter((servicio) => servicio.tipo === categoria.tipo).length,
  }))
}

function Categorias() {
  const { datos, cargando, error, reintentar } = useCarga(cargarCategorias)

  return (
    <section className="seccion">
      <div className="container">
        <h1 className="titulo-seccion">Categorías</h1>
        <p className="intro-seccion">Explora nuestros servicios según lo que necesitas.</p>
        <EstadoCarga cargando={cargando} error={error} reintentar={reintentar} que="las categorías" />
        {datos && (
          <ul className="row g-4 list-unstyled">
            {datos.map((categoria) => (
              <li key={categoria.slug} className="col-md-6 col-lg-3">
                <article className="tarjeta-beneficio">
                  <h2 className="h4">{categoria.titulo}</h2>
                  <p>{categoria.descripcion}</p>
                  <p className="texto-ayuda">{categoria.cantidad} servicio(s)</p>
                  <Link to={`/categoria/${categoria.slug}`} className="btn btn-nv-secundario btn-sm">Ver categoría</Link>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default Categorias
