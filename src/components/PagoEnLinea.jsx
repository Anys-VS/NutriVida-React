import { useState } from 'react'
import CamposTarjeta from './CamposTarjeta'
import { hayErrores, procesarPagoSimulado, validarTarjeta } from '../domain/pagos'
import { usaApi } from '../config/api'

const VACIA = { titular: '', numero: '', vencimiento: '', cvv: '' }

// Formulario de pago online. Valida la tarjeta y entrega sus datos a onPagado(tarjeta).
// En modo local el rechazo (tarjeta terminada en 0000) se simula aquí; en modo 'api' lo decide ms-ordenes.
function PagoEnLinea({ onPagado, onCancelar, textoBoton = 'Pagar ahora', ocupado = false }) {
  const [tarjeta, setTarjeta] = useState(VACIA)
  const [errores, setErrores] = useState(VACIA)
  const [errorPago, setErrorPago] = useState('')

  const pagar = (evento) => {
    evento.preventDefault()
    const nuevos = validarTarjeta(tarjeta)
    setErrores(nuevos)
    if (hayErrores(nuevos)) return
    const pago = usaApi() ? { aprobado: true } : procesarPagoSimulado(tarjeta.numero)
    if (!pago.aprobado) {
      setErrorPago(`${pago.motivo} Intenta con otra tarjeta.`)
      return
    }
    setErrorPago('')
    onPagado(tarjeta)
  }

  return (
    <form className="mt-3" onSubmit={pagar} noValidate>
      <CamposTarjeta valores={tarjeta} errores={errores} onChange={setTarjeta} />
      {errorPago && <div role="alert" className="alert alert-danger">{errorPago}</div>}
      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-nv-primario btn-sm" disabled={ocupado}>{ocupado ? 'Procesando…' : textoBoton}</button>
        <button type="button" className="btn btn-nv-secundario btn-sm" onClick={onCancelar}>Cerrar</button>
      </div>
    </form>
  )
}

export default PagoEnLinea
