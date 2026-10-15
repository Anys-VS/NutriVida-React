import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Campo from '../components/Campo'
import { useSesion } from '../context/SesionContext'
import { citas, planes, servicios } from '../data/db'
import { nutricionistas } from '../data/nutricionistas'
import { leerBorrador, guardarBorrador } from '../data/sesion'
import { ESTADO_PLAN, METODO_PAGO, REGLAS, TIPO_SERVICIO } from '../config/reglas'
import { evaluarReserva, horariosDisponibles, horasHastaCita } from '../domain/citas'
import { resumenSesiones } from '../domain/planes'
import { agendarSesion } from '../services/planes'
import { formatearFechaHora, fechaLocalISO } from '../utils/formato'

function Reservar() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { sesion } = useSesion()
  const [borrador] = useState(leerBorrador)
  const catalogo = servicios.listar()
  const planId = params.get('plan') // modo "sesión de un plan ya contratado"
  const plan = planId ? planes.obtener(planId) : null

  const [codigo, setCodigo] = useState(plan?.codigoServicio ?? params.get('servicio') ?? borrador?.codigoServicio ?? '')
  const [nutricionista, setNutricionista] = useState(borrador?.nutricionista ?? '')
  const [fecha, setFecha] = useState(!plan && borrador ? borrador.fechaHora.slice(0, 10) : '')
  const [hora, setHora] = useState(!plan && borrador ? borrador.fechaHora.slice(11, 16) : '')
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')

  const servicio = catalogo.find((item) => item.codigo === codigo)
  const hoy = fechaLocalISO()

  const horarios = useMemo(() => {
    if (!servicio || !fecha) return []
    return horariosDisponibles({ servicio, nutricionista, fecha, citas: citas.listar() })
  }, [servicio, nutricionista, fecha])

  if (planId && !sesion) {
    return <Navigate to={`/login?desde=${encodeURIComponent(`/reservar?plan=${planId}`)}`} replace />
  }
  if (planId && (!plan || plan.pacienteCorreo !== sesion.correo)) {
    return (
      <section className="seccion">
        <div className="container">
          <p className="mensaje-detalle-error">No encontramos ese plan. <Link to="/mis-citas">Ver mis citas</Link>.</p>
        </div>
      </section>
    )
  }

  const resumen = plan ? resumenSesiones(plan, citas.listar().filter((c) => c.planId === plan.id)) : null
  const planSinSesiones = !plan && servicio?.tipo === TIPO_SERVICIO.PLAN && !servicio.sesiones
  const sinSaldo = plan && (plan.estadoPlan !== ESTADO_PLAN.ACTIVO || resumen.porAgendar === 0)
  const bloqueado = planSinSesiones || sinSaldo

  const cambiarYReiniciarHora = (setter) => (evento) => {
    setter(evento.target.value)
    setHora('')
  }

  // Aviso según la anticipación elegida (RN-04 y RN-07).
  let aviso = ''
  if (plan) {
    aviso = 'Esta sesión está incluida en tu plan: queda confirmada de inmediato y no se vuelve a pagar.'
  } else if (fecha && hora) {
    const fechaHora = `${fecha}T${hora}:00`
    if (horasHastaCita(fechaHora) >= REGLAS.PLAZO_CONFIRMACION_HORAS) {
      const limite = new Date(new Date(fechaHora).getTime() - REGLAS.PLAZO_CONFIRMACION_HORAS * 3600000)
      aviso = `Si pagas online, tu cita queda confirmada de inmediato. Si pagas en la clínica, quedará por confirmar: deberás confirmar tu asistencia hasta el ${formatearFechaHora(limite)}.`
    } else {
      aviso = `Con menos de ${REGLAS.PLAZO_CONFIRMACION_HORAS} h de anticipación tu cita queda confirmada al reservar, pagues online o en la clínica.`
    }
  }

  const continuar = (evento) => {
    evento.preventDefault()
    const nuevos = {}
    if (!servicio) nuevos.servicio = 'Selecciona el servicio que necesitas.'
    if (!fecha) nuevos.fecha = 'La fecha es obligatoria.'
    else if (fecha < hoy) nuevos.fecha = 'Elige una fecha de hoy en adelante.'
    if (!hora) nuevos.hora = 'Selecciona un horario disponible.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) {
      setErrorGeneral('Revisa los campos marcados antes de continuar.')
      return
    }

    const fechaHora = `${fecha}T${hora}:00`
    if (plan) {
      const resultado = agendarSesion({ planId: plan.id, nutricionista, fechaHora })
      if (!resultado.ok) {
        setErrorGeneral(resultado.motivo)
        return
      }
      navigate(`/reserva-confirmada/${resultado.cita.id}`)
      return
    }

    const evaluacion = evaluarReserva({ fechaHora, metodoPago: METODO_PAGO.ONLINE })
    if (!evaluacion.ok) {
      setErrorGeneral(evaluacion.motivo)
      return
    }
    guardarBorrador({ codigoServicio: servicio.codigo, nutricionista, fechaHora })
    navigate('/checkout')
  }

  return (
    <section className="seccion">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-7">
            <h1 className="text-center mb-2">{plan ? 'Agenda una sesión de tu plan' : 'Reserva tu hora'}</h1>
            <p className="text-center intro-seccion mx-auto">
              {plan
                ? `Te quedan ${resumen.porAgendar} sesión(es) por agendar en "${plan.nombre}".`
                : 'Elige el servicio, el nutricionista de tu preferencia y un horario disponible. En el siguiente paso confirmas tus datos y el método de pago.'}
            </p>
            {planSinSesiones && (
              <div role="alert" className="alert alert-danger">
                Este plan aún no tiene sus sesiones definidas, por eso todavía no se puede contratar. Consulta con la clínica.
              </div>
            )}
            {sinSaldo && (
              <div role="alert" className="alert alert-warning">
                {plan.estadoPlan === ESTADO_PLAN.ACTIVO ? 'Ya agendaste todas las sesiones de tu plan.' : 'Este plan ya no está activo.'}
              </div>
            )}
            <form className="tarjeta-formulario" onSubmit={continuar} noValidate>
              <Campo id="reservar-servicio" etiqueta="Servicio" as="select" value={codigo} error={errores.servicio}
                disabled={Boolean(plan)} onChange={cambiarYReiniciarHora(setCodigo)}>
                <option value="">Selecciona un servicio</option>
                {catalogo.map((item) => <option key={item.codigo} value={item.codigo}>{item.nombre}</option>)}
              </Campo>
              <Campo id="reservar-nutricionista" etiqueta="Nutricionista" as="select" value={nutricionista}
                onChange={cambiarYReiniciarHora(setNutricionista)}
                ayuda={servicio?.cupos ? `Taller con ${servicio.cupos} cupos por horario.` : undefined}>
                <option value="">Sin preferencia / cualquiera disponible</option>
                {nutricionistas.map((item) => (
                  <option key={item.id} value={item.nombre}>{item.nombre} — {item.especialidad}</option>
                ))}
              </Campo>
              <div className="row">
                <Campo id="reservar-fecha" etiqueta="Fecha" type="date" min={hoy} value={fecha} error={errores.fecha}
                  claseWrapper="col-md-6 mb-3" onChange={cambiarYReiniciarHora(setFecha)} />
                <Campo id="reservar-horario" etiqueta="Horario" as="select" value={hora} error={errores.hora}
                  claseWrapper="col-md-6 mb-3" disabled={!servicio || !fecha} onChange={(evento) => setHora(evento.target.value)}>
                  <option value="">{servicio && fecha ? 'Selecciona un horario' : 'Elige servicio y fecha'}</option>
                  {horarios.map((item) => (
                    <option key={item.hora} value={item.hora} disabled={!item.disponible}>
                      {item.hora} horas{item.disponible ? '' : ` (${item.motivo.toLowerCase()})`}
                    </option>
                  ))}
                </Campo>
              </div>
              {aviso && <div role="status" className="alert alert-info">{aviso}</div>}
              {errorGeneral && <div role="alert" className="alert alert-danger">{errorGeneral}</div>}
              <button type="submit" className="btn btn-nv-primario w-100 mt-2" disabled={bloqueado}>
                {plan ? 'Confirmar sesión' : 'Continuar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Reservar
