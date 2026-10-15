import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Campo from '../components/Campo'
import CamposTarjeta from '../components/CamposTarjeta'
import { useSesion } from '../context/SesionContext'
import { servicios } from '../data/db'
import { leerBorrador, limpiarBorrador } from '../data/sesion'
import { METODO_PAGO, TIPO_SERVICIO } from '../config/reglas'
import { evaluarReserva } from '../domain/citas'
import { hayErrores, procesarPagoSimulado, validarTarjeta } from '../domain/pagos'
import { precioFinal } from '../domain/precios'
import { validarCorreoReserva } from '../domain/validaciones'
import { reservarCita } from '../services/reservas'
import { contratarPlan } from '../services/planes'
import { formatearFechaHora, formatearPrecioCLP } from '../utils/formato'

const TARJETA_VACIA = { titular: '', numero: '', vencimiento: '', cvv: '' }
const SIN_ERRORES = { titular: '', numero: '', vencimiento: '', cvv: '' }

function Checkout() {
  const { sesion } = useSesion()
  const navigate = useNavigate()
  // Se lee una sola vez: al limpiarlo tras reservar, la página no debe creer que se perdió.
  const [borrador] = useState(leerBorrador)
  const servicio = borrador ? servicios.obtener(borrador.codigoServicio) : null

  const [correo, setCorreo] = useState(sesion.correo)
  const [metodo, setMetodo] = useState(METODO_PAGO.ONLINE)
  const [tarjeta, setTarjeta] = useState(TARJETA_VACIA)
  const [erroresTarjeta, setErroresTarjeta] = useState(SIN_ERRORES)
  const [errorCorreo, setErrorCorreo] = useState('')
  const [errorGeneral, setErrorGeneral] = useState('')

  if (!borrador || !servicio) return <Navigate to="/servicios" replace />

  const esPlan = servicio.tipo === TIPO_SERVICIO.PLAN
  const total = precioFinal(servicio)

  const confirmar = (evento) => {
    evento.preventDefault()
    setErrorGeneral('')

    const errCorreo = validarCorreoReserva(correo)
    setErrorCorreo(errCorreo)
    const errTarjeta = metodo === METODO_PAGO.ONLINE ? validarTarjeta(tarjeta) : SIN_ERRORES
    setErroresTarjeta(errTarjeta)
    if (errCorreo || hayErrores(errTarjeta)) return
    if (esPlan && !servicio.sesiones) {
      setErrorGeneral('Este plan aún no tiene sesiones definidas. Consulta con la clínica.')
      return
    }

    const evaluacion = evaluarReserva({ fechaHora: borrador.fechaHora, metodoPago: metodo, esPlan })
    if (!evaluacion.ok) {
      setErrorGeneral(evaluacion.motivo)
      return
    }

    if (metodo === METODO_PAGO.ONLINE) {
      const pago = procesarPagoSimulado(tarjeta.numero)
      if (!pago.aprobado) {
        navigate('/pago-error', { state: { motivo: pago.motivo } })
        return
      }
    }

    const datosReserva = {
      pacienteCorreo: sesion.correo,
      correoConfirmacion: correo.trim(),
      codigoServicio: servicio.codigo,
      nutricionista: borrador.nutricionista,
      fechaHora: borrador.fechaHora,
    }
    const resultado = esPlan ? contratarPlan(datosReserva) : reservarCita({ ...datosReserva, metodoPago: metodo })
    if (!resultado.ok) {
      setErrorGeneral(resultado.motivo)
      return
    }
    limpiarBorrador()
    navigate(`/reserva-confirmada/${resultado.cita.id}`, { replace: true })
  }

  return (
    <section className="seccion">
      <div className="container">
        <h1 className="titulo-seccion">Confirma tu reserva</h1>
        <p className="intro-seccion">Revisa el resumen, confirma tu correo y elige cómo quieres pagar.</p>
        <div className="row g-4 align-items-start">
          <div className="col-lg-7">
            <form className="tarjeta-formulario" onSubmit={confirmar} noValidate>
              <h2 className="h4">Tus datos</h2>
              <p className="mb-3">{sesion.nombre} {sesion.apellidos}</p>
              <Campo id="checkout-correo" etiqueta="Correo de confirmación" type="email" value={correo}
                onChange={(evento) => setCorreo(evento.target.value)} error={errorCorreo} maxLength={100}
                ayuda="Solo dominios @duoc.cl, @profesor.duoc.cl o @gmail.com. Aquí enviaremos la confirmación." />

              <h2 className="h4 mt-4">Método de pago</h2>
              <div className="form-check mb-2">
                <input className="form-check-input" type="radio" name="metodo" id="metodo-online"
                  checked={metodo === METODO_PAGO.ONLINE} onChange={() => setMetodo(METODO_PAGO.ONLINE)} />
                <label className="form-check-label" htmlFor="metodo-online">Pagar ahora (online)</label>
              </div>
              <div className="form-check mb-3">
                <input className="form-check-input" type="radio" name="metodo" id="metodo-clinica"
                  checked={metodo === METODO_PAGO.CLINICA} disabled={esPlan}
                  onChange={() => setMetodo(METODO_PAGO.CLINICA)} />
                <label className="form-check-label" htmlFor="metodo-clinica">Pagar en la clínica</label>
                {esPlan && <span className="texto-ayuda d-block">Los planes solo se pagan online.</span>}
              </div>

              {metodo === METODO_PAGO.ONLINE && (
                <CamposTarjeta valores={tarjeta} errores={erroresTarjeta} onChange={setTarjeta} />
              )}

              {errorGeneral && <div role="alert" className="alert alert-danger">{errorGeneral}</div>}
              <button type="submit" className="btn btn-nv-primario w-100 mt-2">
                {metodo === METODO_PAGO.ONLINE ? `Pagar ${formatearPrecioCLP(total)}` : 'Confirmar reserva'}
              </button>
            </form>
          </div>
          <aside className="col-lg-5">
            <div className="tarjeta-formulario resumen-carrito">
              <h2 className="h4">Resumen</h2>
              <p className="mb-1"><strong>{servicio.nombre}</strong></p>
              <p className="mb-1">{formatearFechaHora(borrador.fechaHora)}</p>
              <p className="mb-1">Nutricionista: {borrador.nutricionista || 'Sin preferencia'}</p>
              {servicio.sesiones && (
                <p className="mb-1">Incluye {servicio.sesiones} sesiones: agendas la primera ahora y las demás desde Mis citas.</p>
              )}
              <hr />
              <p className="d-flex justify-content-between total-carrito mb-0">
                <span>Total</span><strong>{formatearPrecioCLP(total)}</strong>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default Checkout
