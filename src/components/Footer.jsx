import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="pie-nv">
      <div className="container">
        <div className="row g-4">
          <div className="col-md-4">
            <p className="marca-pie mb-2">NutriVida</p>
            <p>Asesoría nutricional personalizada en Temuco, Región de La Araucanía.</p>
          </div>
          <nav className="col-md-4" aria-label="Enlaces del pie de página">
            <h4>Navegación</h4>
            <ul className="list-unstyled d-flex flex-column gap-2">
              <li><Link to="/nosotros">Nosotros</Link></li>
              <li><Link to="/servicios">Servicios</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
            </ul>
          </nav>
          <div className="col-md-4">
            <h4>Atención</h4>
            <address className="mb-0">
              Lunes a viernes · 08:00–19:00<br />
              <a href="mailto:contacto@nutrivida.cl">contacto@nutrivida.cl</a>
            </address>
          </div>
        </div>
        <div className="linea-pie">© 2026 Clínica Nutricional NutriVida. Proyecto académico DSY1104.</div>
      </div>
    </footer>
  )
}

export default Footer
