import { Link, useParams } from 'react-router-dom'
import { articulos } from '../data/blog'

function ArticuloBlog() {
  const { id } = useParams()
  const articulo = articulos.find((a) => a.id === id)

  if (!articulo) {
    return (
      <section className="seccion">
        <div className="container">
          <p className="mensaje-detalle-error">
            No encontramos ese artículo. <Link to="/blog">Volver al blog</Link>.
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
            <li className="breadcrumb-item"><Link to="/blog">Blog</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{articulo.titulo}</li>
          </ol>
        </nav>
        <article className="entrada-blog contenedor-angosto">
          <p className="texto-ayuda">Publicado por el equipo de nutricionistas de NutriVida</p>
          <h1>{articulo.titulo}</h1>
          <p>{articulo.intro}</p>
          {articulo.video && (
            <section aria-label="Video">
              <div className="contenedor-video">
                <iframe src={articulo.video.src} title={articulo.video.titulo} allowFullScreen />
              </div>
            </section>
          )}
          {articulo.secciones.map((seccion) => (
            <section key={seccion.titulo}>
              <h2>{seccion.titulo}</h2>
              <p>{seccion.texto}</p>
            </section>
          ))}
          <p>
            {articulo.cierre} <Link to="/servicios">Ver consultas y planes</Link> · <Link to="/contacto">Contacto</Link>
          </p>
        </article>
      </div>
    </section>
  )
}

export default ArticuloBlog
