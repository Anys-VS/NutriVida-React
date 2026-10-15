import { Link } from 'react-router-dom'
import { articulos } from '../data/blog'

function Blog() {
  return (
    <section className="seccion">
      <div className="container">
        <h1 className="titulo-seccion">Blog NutriVida</h1>
        <p className="intro-seccion">Notas breves de nuestro equipo sobre alimentación, hábitos y mitos frecuentes en consulta.</p>
        <ul className="row g-4 list-unstyled lista-blog">
          {articulos.map((articulo) => (
            <li key={articulo.id} className="col-md-6">
              <article className="tarjeta-blog">
                <figure className="portada-blog" style={{ backgroundColor: articulo.color }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M8 2v4M16 2v4M3 10h18M8 15h.01M12 15h.01M16 15h.01" />
                  </svg>
                </figure>
                <div className="cuerpo-blog">
                  <h3>{articulo.titulo}</h3>
                  <p>{articulo.resumen}</p>
                  <Link to={`/blog/${articulo.id}`} className="btn btn-nv-secundario btn-sm">Leer artículo</Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Blog
