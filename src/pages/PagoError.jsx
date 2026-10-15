import { Link, useLocation } from 'react-router-dom'

function PagoError() {
  const { state } = useLocation()
  const motivo = state?.motivo ?? 'No pudimos procesar el pago.'

  return (
    <section className="seccion">
      <div className="container">
        <div className="tarjeta-formulario contenedor-angosto mx-auto text-center">
          <h1 className="h3">No se pudo realizar el pago</h1>
          <div role="alert" className="alert alert-danger mt-3">{motivo}</div>
          <p>Tu reserva todavía no fue registrada, no se hizo ningún cobro y tus datos se mantienen.</p>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            <Link to="/checkout" className="btn btn-nv-primario">Volver a intentar</Link>
            <Link to="/servicios" className="btn btn-nv-secundario">Ver otros servicios</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PagoError
