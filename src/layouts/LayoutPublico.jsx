import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function LayoutPublico() {
  return (
    <>
      {/* Visible solo al navegar con teclado: salta el menú y va directo al contenido. */}
      <a href="#contenido" className="saltar-contenido">Saltar al contenido</a>
      <Navbar />
      <main id="contenido" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default LayoutPublico
