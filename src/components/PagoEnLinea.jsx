import { useState } from 'react'
import CamposTarjeta from './CamposTarjeta'
import { hayErrores, procesarPagoSimulado, validarTarjeta } from '../domain/pagos'

const VACIA = { titular: '', numero: '', vencimiento: '', cvv: '' }

// Pago online de una cita ya reservada (RN-05: "Pagar ahora").
function PagoEnLinea({ onPagado, onCancelar }) {
  const [tarjeta, setTarjeta] = useState(VACIA)
  const [errores, setErrores] = useState(VACIA)
  const [errorPago, setErrorPago] = useState('')

  const pagar = (evento) => {
    evento.preventDefault()
    const nuevos = validarTarjeta(tarjeta)
    setErrores(nuevos)
    if (hayErrores(nuevos)) return
    const pago = procesarPagoSimulado(tarjeta.numero)
    if (!pago.aprobado) {
      setErrorPago(`${pago.motivo} Intenta con otra tarjeta.`)
      return
    }
    setErrorPago('')
    onPagado()
  }

  return (
    <form className="mt-3" onSubmit={pagar} noValidate>
      <CamposTarjeta valores={tarjeta} errores={errores} onChange={setTarjeta} />
      {errorPago && <div role="alert" className="alert alert-danger">{errorPago}</div>}
      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-nv-primario btn-sm">Pagar ahora</button>
        <button type="button" className="btn btn-nv-secundario btn-sm" onClick={onCancelar}>Cerrar</button>
      </div>
    </form>
  )
}

export default PagoEnLinea
