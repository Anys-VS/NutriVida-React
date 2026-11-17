// Muestra el estado de una carga de datos (ver hooks/useCarga): "Cargando…" o el error con un botón
// para reintentar. Cuando los datos están listos no muestra nada y la página dibuja su contenido.
function EstadoCarga({ cargando, error, reintentar, que = 'los datos' }) {
  if (cargando) return <p className="texto-ayuda" role="status">Cargando {que}…</p>
  if (!error) return null
  return (
    <div role="alert" className="alert alert-danger d-flex flex-wrap align-items-center gap-2">
      <span>No pudimos cargar {que}: {error.message}</span>
      {reintentar && <button type="button" className="btn btn-sm btn-outline-danger" onClick={reintentar}>Reintentar</button>}
    </div>
  )
}

export default EstadoCarga
