import { Link } from 'react-router-dom'
import { categorias, servicios } from '../data/db'

function Categorias() {
  const todos = servicios.listar()

  return (
    <section className="seccion">
      <div className="container">
        <h1 className="titulo-seccion">Categorías</h1>
        <p className="intro-seccion">Explora nuestros servicios según lo que necesitas.</p>
        <ul className="row g-4 list-unstyled">
          {categorias.listar().map((categoria) => {
            const cantidad = todos.filter((s) => s.tipo === categoria.tipo).length
            return (
              <li key={categoria.slug} className="col-md-6 col-lg-3">
                <article className="tarjeta-beneficio">
                  <h2 className="h4">{categoria.titulo}</h2>
                  <p>{categoria.descripcion}</p>
                  <p className="texto-ayuda">{cantidad} servicio(s)</p>
                  <Link to={`/categoria/${categoria.slug}`} className="btn btn-nv-secundario btn-sm">Ver categoría</Link>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default Categorias
