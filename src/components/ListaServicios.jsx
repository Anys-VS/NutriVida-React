import TarjetaServicio from './TarjetaServicio'

// `destacados` usa 4 columnas (inicio); por defecto usa la grilla del catálogo.
function ListaServicios({ servicios, onReservar, destacados = false }) {
  if (servicios.length === 0) {
    return <p className="mensaje-sin-servicios">No hay servicios disponibles en esta categoría.</p>
  }

  return (
    <ul id={destacados ? undefined : 'grilla-servicios'} className="row g-4 list-unstyled">
      {servicios.map((servicio) => (
        <li key={servicio.codigo} className={destacados ? 'col-sm-6 col-lg-3' : 'servicio-columna'}>
          <TarjetaServicio servicio={servicio} onReservar={onReservar} />
        </li>
      ))}
    </ul>
  )
}

export default ListaServicios
