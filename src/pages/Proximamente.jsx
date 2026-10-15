import { Link } from 'react-router-dom'

function Proximamente({ titulo = 'Esta vista llega pronto' }) {
  return (
    <section className="seccion">
      <div className="container">
        <h1 className="titulo-seccion">{titulo}</h1>
        <p className="intro-seccion">Esta sección se incorpora en el siguiente bloque del proyecto.</p>
        <Link to="/" className="btn btn-nv-secundario">Volver al inicio</Link>
      </div>
    </section>
  )
}

export default Proximamente
