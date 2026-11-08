import { useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Campo from '../components/Campo'
import { useSesion } from '../context/SesionContext'
import { useCarrito } from '../context/CarritoContext'
import { citas, planes, servicios } from '../data/db'
import { nutricionistas } from '../data/nutricionistas'
import { leerBorrador, guardarBorrador } from '../data/sesion'
import { ESTADO_PLAN, METODO_PAGO, MOTIVOS_CONSULTA, REGLAS, ROL, TIPO_SERVICIO } from '../config/reglas'
import { evaluarReserva, horariosDisponibles, horasHastaCita } from '../domain/citas'
import { resumenSesiones } from '../domain/planes'
import { buscarPorNombre, describirHorario, diaDeLaSemana, NOMBRES_DIAS } from '../domain/profesionales'
import { agendarSesion } from '../services/planes'
import { agregarAlCarrito } from '../services/carrito'
import { reprogramarCita } from '../services/reservas'
import { formatearFechaHora, fechaLocalISO } from '../utils/formato'

// Separa "Bajar de peso: detalle" en el motivo elegido y su detalle.
function separarMotivo(texto = '') {
  const tipo = MOTIVOS_CONSULTA.find((m) => texto === m || texto.startsWith(`${m}: `))
  if (!tipo) return { tipo: texto ? 'Otro' : '', detalle: texto }
  return { tipo, detalle: texto.slice(tipo.length + 2) }
}

function Reservar() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const ubicacion = useLocation()
  const { sesion } = useSesion()
  const { refrescar: refrescarCarrito } = useCarrito()
  const [borrador] = useState(leerBorrador)
  const catalogo = servicios.listar()

  const planId = params.get('plan') // modo "sesión de un plan ya contratado"
  const plan = planId ? planes.obtener(planId) : null
  const reprogramarId = params.get('reprogramar') // modo "cambiar fecha u hora de una cita"
  const citaOriginal = reprogramarId ? citas.obtener(reprogramarId) : null
  const modoNormal = !planId && !reprogramarId

  const motivoInicial = separarMotivo(borrador?.motivo)
  const [codigo, setCodigo] = useState(
    plan?.codigoServicio ?? citaOriginal?.codigoServicio ?? params.get('servicio') ?? borrador?.codigoServicio ?? '',
  )
  const [nutricionista, setNutricionista] = useState(
    params.get('nutricionista') ?? (citaOriginal?.nutricionistaPreferido ? citaOriginal.nutricionista : null) ?? borrador?.nutricionista ?? '',
  )
  const [fecha, setFecha] = useState(modoNormal && borrador ? borrador.fechaHora.slice(0, 10) : '')
  const [hora, setHora] = useState(modoNormal && borrador ? borrador.fechaHora.slice(11, 16) : '')
  const [motivoTipo, setMotivoTipo] = useState(motivoInicial.tipo)
  const [motivoDetalle, setMotivoDetalle] = useState(motivoInicial.detalle)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [exito, setExito] = useState('')

  const servicio = catalogo.find((item) => item.codigo === codigo)
  const hoy = fechaLocalISO()
  const profesional = nutricionista ? buscarPorNombre(nutricionistas, nutricionista) : null

  const horarios = useMemo(() => {
    if (!servicio || !fecha) return []
    return horariosDisponibles({ servicio, nutricionista, fecha, citas: citas.listar(), excluirId: reprogramarId })
  }, [servicio, nutricionista, fecha, reprogramarId])

  const desdeAqui = `/login?desde=${encodeURIComponent(ubicacion.pathname + ubicacion.search)}`
  if ((planId || reprogramarId) && !sesion) return <Navigate to={desdeAqui} replace />

  const noEncontrado = (texto) => (
    <section className="seccion">
      <div className="container">
        <p className="mensaje-detalle-error">{texto} <Link to="/mis-citas">Ver mis citas</Link>.</p>
      </div>
    </section>
  )
  if (planId && (!plan || plan.pacienteCorreo !== sesion.correo)) return noEncontrado('No encontramos ese plan.')
  if (reprogramarId && (!citaOriginal || citaOriginal.pacienteCorreo !== sesion.correo)) return noEncontrado('No encontramos esa cita.')

  const resumen = plan ? resumenSesiones(plan, citas.listar().filter((c) => c.planId === plan.id)) : null
  const planSinSesiones = modoNormal && servicio?.tipo === TIPO_SERVICIO.PLAN && !servicio.sesiones
  const sinSaldo = plan && (plan.estadoPlan !== ESTADO_PLAN.ACTIVO || resumen.porAgendar === 0)
  const bloqueado = planSinSesiones || sinSaldo
  const puedeUsarCarrito = !sesion || sesion.tipoUsuario === ROL.PACIENTE

  const cambiarYReiniciarHora = (setter) => (evento) => {
    setter(evento.target.value)
    setHora('')
    setExito('')
  }

  // Aviso según la anticipación elegida (RN-04 y RN-07).
  let aviso = ''
  if (plan) {
    aviso = 'Esta sesión está incluida en tu plan: queda confirmada de inmediato y no se vuelve a pagar.'
  } else if (citaOriginal) {
    aviso = `Horario actual: ${formatearFechaHora(citaOriginal.fechaHora)} con ${citaOriginal.nutricionista || 'el nutricionista asignado'}. El pago se mantiene.`
  } else if (fecha && hora) {
    const fechaHora = `${fecha}T${hora}:00`
    if (horasHastaCita(fechaHora) >= REGLAS.PLAZO_CONFIRMACION_HORAS) {
      const limite = new Date(new Date(fechaHora).getTime() - REGLAS.PLAZO_CONFIRMACION_HORAS * 3600000)
      aviso = `Si pagas online (o desde el carrito), tu cita queda confirmada de inmediato. Si pagas en la clínica, quedará por confirmar: deberás confirmar tu asistencia hasta el ${formatearFechaHora(limite)}.`
    } else {
      aviso = `Con menos de ${REGLAS.PLAZO_CONFIRMACION_HORAS} h de anticipación tu cita queda confirmada al reservar, pagues online o en la clínica.`
    }
  }

  const sinJornada = servicio && fecha && horarios.length === 0
  const motivo = motivoDetalle.trim() ? `${motivoTipo}: ${motivoDetalle.trim()}` : motivoTipo

  // Valida el formulario y devuelve la fecha y hora elegidas, o null si hay errores.
  const validar = () => {
    const nuevos = {}
    if (!servicio) nuevos.servicio = 'Selecciona el servicio que necesitas.'
    if (!fecha) nuevos.fecha = 'La fecha es obligatoria.'
    else if (fecha < hoy) nuevos.fecha = 'Elige una fecha de hoy en adelante.'
    if (!hora) nuevos.hora = 'Selecciona un horario disponible.'
    if (modoNormal) {
      if (!motivoTipo) nuevos.motivo = 'Indica el motivo de tu consulta.'
      else if (motivoTipo === 'Otro' && !motivoDetalle.trim()) nuevos.motivo = 'Cuéntanos brevemente el motivo.'
    }
    setErrores(nuevos)
    setExito('')
    if (Object.keys(nuevos).length > 0) {
      setErrorGeneral('Revisa los campos marcados antes de continuar.')
      return null
    }
    setErrorGeneral('')
    return `${fecha}T${hora}:00`
  }

  const enviar = (evento) => {
    evento.preventDefault()
    const fechaHora = validar()
    if (!fechaHora) return

    if (plan) {
      const resultado = agendarSesion({ planId: plan.id, nutricionista, fechaHora })
      if (!resultado.ok) return setErrorGeneral(resultado.motivo)
      return navigate(`/reserva-confirmada/${resultado.cita.id}`)
    }
    if (citaOriginal) {
      const resultado = reprogramarCita(citaOriginal.id, { fechaHora, nutricionista })
      if (!resultado.ok) return setErrorGeneral(resultado.motivo)
      return navigate('/mis-citas', { state: { mensaje: `Cita reprogramada para el ${formatearFechaHora(resultado.cita.fechaHora)}.` } })
    }

    const evaluacion = evaluarReserva({ fechaHora, metodoPago: METODO_PAGO.ONLINE })
    if (!evaluacion.ok) return setErrorGeneral(evaluacion.motivo)
    guardarBorrador({ codigoServicio: servicio.codigo, nutricionista, fechaHora, motivo })
    navigate('/checkout')
  }

  const alCarrito = () => {
    const fechaHora = validar()
    if (!fechaHora) return
    if (!sesion) {
      guardarBorrador({ codigoServicio: servicio.codigo, nutricionista, fechaHora, motivo })
      navigate(`/login?desde=${encodeURIComponent('/reservar')}`)
      return
    }
    const resultado = agregarAlCarrito({ pacienteCorreo: sesion.correo, codigoServicio: servicio.codigo, nutricionista, fechaHora, motivo })
    if (!resultado.ok) return setErrorGeneral(resultado.motivo)
    refrescarCarrito()
    setHora('')
    setExito(`"${servicio.nombre}" quedó en tu carrito para el ${formatearFechaHora(resultado.item.fechaHora)}.`)
  }

  let titulo = 'Reserva tu hora'
  let intro = 'Elige el servicio, el nutricionista de tu preferencia y un horario disponible. Puedes agregar varias atenciones al carrito y pagarlas juntas, o reservar y pagar solo esta.'
  if (plan) {
    titulo = 'Agenda una sesión de tu plan'
    intro = `Te quedan ${resumen.porAgendar} sesión(es) por agendar en "${plan.nombre}".`
  } else if (citaOriginal) {
    titulo = 'Reprograma tu cita'
    intro = `Elige una nueva fecha u hora para "${citaOriginal.nombreServicio}". Puedes hacerlo hasta ${REGLAS.ANTICIPACION_MINIMA_HORAS} h antes.`
  }

  return (
    <section className="seccion">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-7">
            <h1 className="text-center mb-2">{titulo}</h1>
            <p className="text-center intro-seccion mx-auto">{intro}</p>
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
            <form className="tarjeta-formulario" onSubmit={enviar} noValidate>
              <Campo id="reservar-servicio" etiqueta="Servicio" as="select" value={codigo} error={errores.servicio}
                disabled={!modoNormal} onChange={cambiarYReiniciarHora(setCodigo)}>
                <option value="">Selecciona un servicio</option>
                {catalogo.map((item) => <option key={item.codigo} value={item.codigo}>{item.nombre}</option>)}
              </Campo>
              <Campo id="reservar-nutricionista" etiqueta="Nutricionista" as="select" value={nutricionista}
                onChange={cambiarYReiniciarHora(setNutricionista)}
                ayuda={servicio?.cupos
                  ? `Taller con ${servicio.cupos} cupos por horario.`
                  : profesional ? `Atiende ${describirHorario(profesional)}.` : '¿No sabes a quién elegir? Revisa nuestros especialistas.'}>
                <option value="">Sin preferencia / cualquiera disponible</option>
                {nutricionistas.map((item) => (
                  <option key={item.id} value={item.nombre}>{item.nombre} — {item.especialidad}</option>
                ))}
              </Campo>
              {!servicio?.cupos && !profesional && (
                <p className="texto-ayuda mt-n2 mb-3"><Link to="/especialistas">Buscar especialistas y sus horarios</Link></p>
              )}
              <div className="row">
                <Campo id="reservar-fecha" etiqueta="Fecha" type="date" min={hoy} value={fecha} error={errores.fecha}
                  claseWrapper="col-md-6 mb-3" onChange={cambiarYReiniciarHora(setFecha)} />
                <Campo id="reservar-horario" etiqueta="Horario" as="select" value={hora} error={errores.hora}
                  claseWrapper="col-md-6 mb-3" disabled={!servicio || !fecha || sinJornada} onChange={(evento) => setHora(evento.target.value)}>
                  <option value="">{servicio && fecha ? 'Selecciona un horario' : 'Elige servicio y fecha'}</option>
                  {horarios.map((item) => (
                    <option key={item.hora} value={item.hora} disabled={!item.disponible}>
                      {item.hora} horas{item.disponible ? '' : ` (${item.motivo.toLowerCase()})`}
                    </option>
                  ))}
                </Campo>
              </div>
              {sinJornada && (
                <div role="status" className="alert alert-warning">
                  {profesional
                    ? `${profesional.nombre} no atiende los ${NOMBRES_DIAS[diaDeLaSemana(fecha)].toLowerCase()}. Atiende ${describirHorario(profesional)}.`
                    : 'La clínica no atiende ese día. Elige otra fecha.'}
                </div>
              )}

              {modoNormal && (
                <>
                  <Campo id="reservar-motivo" etiqueta="Motivo de la consulta" as="select" value={motivoTipo}
                    error={errores.motivo} onChange={(evento) => setMotivoTipo(evento.target.value)}>
                    <option value="">Selecciona un motivo</option>
                    {MOTIVOS_CONSULTA.map((m) => <option key={m}>{m}</option>)}
                  </Campo>
                  <Campo id="reservar-motivo-detalle" etiqueta="Cuéntanos más (opcional)" as="textarea" rows={2}
                    value={motivoDetalle} maxLength={200} onChange={(evento) => setMotivoDetalle(evento.target.value)}
                    ayuda="Por ejemplo: derivación médica, exámenes recientes o tu objetivo." />
                </>
              )}

              {aviso && <div role="status" className="alert alert-info">{aviso}</div>}
              {exito && (
                <div role="status" className="alert alert-success">
                  {exito} <Link to="/carrito">Ir al carrito</Link> o agrega otra atención.
                </div>
              )}
              {errorGeneral && <div role="alert" className="alert alert-danger">{errorGeneral}</div>}

              {modoNormal ? (
                <div className="d-flex flex-column flex-sm-row gap-2 mt-2">
                  {puedeUsarCarrito && (
                    <button type="button" className="btn btn-nv-primario flex-fill" disabled={bloqueado} onClick={alCarrito}>
                      Agregar al carrito
                    </button>
                  )}
                  <button type="submit" className="btn btn-nv-secundario flex-fill" disabled={bloqueado}>
                    Reservar y pagar solo esta
                  </button>
                </div>
              ) : (
                <button type="submit" className="btn btn-nv-primario w-100 mt-2" disabled={bloqueado}>
                  {plan ? 'Confirmar sesión' : 'Confirmar nuevo horario'}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Reservar
