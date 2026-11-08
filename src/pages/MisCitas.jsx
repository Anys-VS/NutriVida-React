import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import EstadoBadge from '../components/EstadoBadge'
import PagoEnLinea from '../components/PagoEnLinea'
import { useSesion } from '../context/SesionContext'
import { ESTADO_CITA, ESTADO_PLAN } from '../config/reglas'
import { citaTienePagoPendiente, necesitaRecordatorio, puedeCancelarPaciente } from '../domain/citas'
import { requiereReembolso } from '../domain/metricas'
import { cancelarPlan, planesDePaciente, reembolsoPorCancelar } from '../services/planes'
import { ordenesDePaciente, pagarCitasPendientes } from '../services/carrito'
import {
  cancelarCita, cancelarCitasVencidas, citasDePaciente, confirmarAsistencia, pagarCita,
} from '../services/reservas'
import { formatearFechaHora, formatearPrecioCLP } from '../utils/formato'

function MisCitas() {
  const { sesion } = useSesion()
  const ubicacion = useLocation()
  const navigate = useNavigate()
  const [lista, setLista] = useState(() => citasDePaciente(sesion.correo))
  const [misPlanes, setMisPlanes] = useState(() => planesDePaciente(sesion.correo))
  const [mensaje, setMensaje] = useState(
    ubicacion.state?.mensaje ? { tipo: 'success', texto: ubicacion.state.mensaje } : null,
  )
  const [pagandoId, setPagandoId] = useState(null)
  const [porPagar, setPorPagar] = useState(() => new Set())
  const [pagandoVarias, setPagandoVarias] = useState(false)
  const misOrdenes = ordenesDePaciente(sesion.correo)

  const refrescar = useCallback(() => {
    setLista(citasDePaciente(sesion.correo))
    setMisPlanes(planesDePaciente(sesion.correo))
  }, [sesion.correo])

  // RN-06: al entrar se cancelan las citas cuyo plazo de confirmación venció.
  useEffect(() => {
    const canceladas = cancelarCitasVencidas()
    if (canceladas > 0) {
      setMensaje({ tipo: 'warning', texto: `Se cancelaron ${canceladas} cita(s) por falta de confirmación a tiempo.` })
    }
    refrescar()
  }, [refrescar])

  const resolver = (resultado, textoOk) => {
    setMensaje(resultado.ok ? { tipo: 'success', texto: textoOk(resultado) } : { tipo: 'danger', texto: resultado.motivo })
    setPagandoId(null)
    refrescar()
  }

  const confirmar = (id) => resolver(confirmarAsistencia(id), () => 'Asistencia confirmada. ¡Te esperamos!')
  const pagado = (id) => resolver(pagarCita(id), () => 'Pago recibido. Tu cita quedó confirmada.')

  const pendientes = lista.filter(citaTienePagoPendiente)
  const elegidas = pendientes.filter((c) => porPagar.has(c.id))
  const totalElegidas = elegidas.reduce((suma, c) => suma + c.precio, 0)
  const alternarPago = (id) => {
    setPagandoVarias(false)
    setPorPagar((actual) => {
      const nuevo = new Set(actual)
      if (nuevo.has(id)) nuevo.delete(id)
      else nuevo.add(id)
      return nuevo
    })
  }
  const pagarVarias = () => {
    const resultado = pagarCitasPendientes({ pacienteCorreo: sesion.correo, ids: elegidas.map((c) => c.id) })
    if (!resultado.ok) {
      resolver(resultado, () => '')
      return
    }
    navigate(`/orden/${resultado.orden.id}`)
  }

  const cancelar = (cita) => {
    if (!window.confirm('¿Quieres cancelar esta cita?')) return
    resolver(cancelarCita(cita.id), ({ reembolsoPendiente }) => {
      if (cita.planId) return 'Sesión cancelada. Vuelve al saldo de tu plan para que la reagendes.'
      return reembolsoPendiente > 0
        ? `Cita cancelada. Tu reembolso de ${formatearPrecioCLP(reembolsoPendiente)} quedó pendiente: la clínica lo registrará.`
        : 'Cita cancelada.'
    })
  }

  const cancelarElPlan = (plan) => {
    const reembolso = reembolsoPorCancelar(plan.id)
    const detalle = reembolso > 0
      ? `Se te devolverá el 80% del plan: ${formatearPrecioCLP(reembolso)}.`
      : 'No habrá reembolso porque ya tuviste al menos una sesión atendida.'
    if (!window.confirm(`¿Cancelar el plan? ${detalle} Las sesiones agendadas se cancelarán.`)) return
    resolver(cancelarPlan(plan.id), ({ reembolsoPendiente }) =>
      reembolsoPendiente > 0
        ? `Plan cancelado. Tu reembolso de ${formatearPrecioCLP(reembolsoPendiente)} quedó pendiente: la clínica lo registrará.`
        : 'Plan cancelado. No corresponde reembolso.')
  }

  return (
    <section className="seccion">
      <div className="container">
        <h1 className="titulo-seccion">Mis citas</h1>
        <p className="intro-seccion">Confirma tu asistencia, paga o cancela tus citas y planes desde aquí.</p>
        {mensaje && <div role="status" className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

        {misPlanes.length > 0 && (
          <section aria-labelledby="titulo-planes" className="mb-5">
            <h2 id="titulo-planes" className="h3 mb-3">Mis planes</h2>
            <ul className="list-unstyled d-flex flex-column gap-3">
              {misPlanes.map((plan) => {
                const { atendidas, agendadas, porAgendar, total } = plan.resumen
                const activo = plan.estadoPlan === ESTADO_PLAN.ACTIVO
                return (
                  <li key={plan.id}>
                    <article className="tarjeta-formulario">
                      <div className="d-flex flex-wrap justify-content-between gap-2">
                        <div>
                          <h3 className="h5 mb-1">{plan.nombre}</h3>
                          <p className="texto-ayuda mb-0">
                            {atendidas} de {total} sesiones atendidas · {agendadas} agendadas · {porAgendar} por agendar
                          </p>
                        </div>
                        <p className="mb-0">
                          <EstadoBadge estado={plan.estadoPlan} /> <EstadoBadge estado={plan.estadoPago} />{' '}
                          <strong>{formatearPrecioCLP(plan.montoPagado)}</strong>
                        </p>
                      </div>
                      <div className="progress my-3" role="progressbar" aria-label="Sesiones atendidas"
                        aria-valuenow={atendidas} aria-valuemin={0} aria-valuemax={total}>
                        <div className="progress-bar" style={{ width: `${(atendidas / total) * 100}%` }} />
                      </div>
                      {plan.reembolsoPendiente > 0 && (
                        <p className="texto-ayuda">Reembolso pendiente: {formatearPrecioCLP(plan.reembolsoPendiente)}</p>
                      )}
                      {plan.montoReembolsado > 0 && (
                        <p className="texto-ayuda">Reembolsado: {formatearPrecioCLP(plan.montoReembolsado)}</p>
                      )}
                      {activo && (
                        <div className="d-flex flex-wrap gap-2">
                          {porAgendar > 0 && (
                            <Link to={`/reservar?plan=${plan.id}`} className="btn btn-nv-primario btn-sm">Agendar sesión</Link>
                          )}
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => cancelarElPlan(plan)}>
                            Cancelar plan
                          </button>
                        </div>
                      )}
                    </article>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <h2 className="h3 mb-3">Mis citas y sesiones</h2>
        {pendientes.length > 1 && (
          <div className="tarjeta-formulario mb-3">
            <p className="mb-2">
              Tienes {pendientes.length} citas con pago pendiente. Márcalas abajo y págalas juntas en un solo pago.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <button type="button" className="btn btn-nv-primario btn-sm" disabled={elegidas.length === 0}
                onClick={() => setPagandoVarias(true)}>
                Pagar seleccionadas ({elegidas.length}) · {formatearPrecioCLP(totalElegidas)}
              </button>
              <button type="button" className="btn btn-nv-secundario btn-sm"
                onClick={() => { setPorPagar(new Set(pendientes.map((c) => c.id))); setPagandoVarias(true) }}>
                Pagar todas las pendientes · {formatearPrecioCLP(pendientes.reduce((s, c) => s + c.precio, 0))}
              </button>
            </div>
            {pagandoVarias && elegidas.length > 0 && (
              <PagoEnLinea textoBoton={`Pagar ${formatearPrecioCLP(totalElegidas)}`} onPagado={pagarVarias}
                onCancelar={() => setPagandoVarias(false)} />
            )}
          </div>
        )}
        {lista.length === 0 ? (
          <div className="tarjeta-formulario text-center">
            <h3 className="h4">Aún no tienes citas</h3>
            <p className="mb-3">Reserva tu primera hora con uno de nuestros nutricionistas.</p>
            <Link to="/servicios" className="btn btn-nv-primario">Ver servicios</Link>
          </div>
        ) : (
          <ul className="list-unstyled d-flex flex-column gap-3">
            {lista.map((cita) => {
              const puedeCancelar = puedeCancelarPaciente(cita)
              const activa = [ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA].includes(cita.estadoCita)
              return (
                <li key={cita.id}>
                  <article className="tarjeta-formulario">
                    <div className="d-flex flex-wrap justify-content-between gap-2">
                      <div>
                        <h3 className="h5 mb-1">{cita.nombreServicio}</h3>
                        <p className="mb-1">{formatearFechaHora(cita.fechaHora)}</p>
                        <p className="texto-ayuda mb-0">Nutricionista: {cita.nutricionista || 'Por asignar'}</p>
                        {cita.motivo && <p className="texto-ayuda mb-0">Motivo: {cita.motivo}</p>}
                        {cita.reprogramaciones > 0 && (
                          <p className="texto-ayuda mb-0">Reprogramada (antes: {formatearFechaHora(cita.fechaHoraAnterior)})</p>
                        )}
                        {pendientes.length > 1 && citaTienePagoPendiente(cita) && (
                          <div className="form-check mt-2">
                            <input id={`pagar-${cita.id}`} type="checkbox" className="form-check-input"
                              checked={porPagar.has(cita.id)} onChange={() => alternarPago(cita.id)} />
                            <label htmlFor={`pagar-${cita.id}`} className="form-check-label">Incluir en el pago</label>
                          </div>
                        )}
                      </div>
                      <div className="text-md-end">
                        {cita.planId ? (
                          <p className="mb-1"><EstadoBadge estado={cita.estadoCita} /></p>
                        ) : (
                          <p className="mb-1"><EstadoBadge estado={cita.estadoCita} /> <EstadoBadge estado={cita.estadoPago} /></p>
                        )}
                        <p className="mb-0"><strong>{cita.planId ? 'Incluida en tu plan' : formatearPrecioCLP(cita.precio)}</strong></p>
                        {requiereReembolso(cita) && (
                          <p className="texto-ayuda mb-0">Reembolso pendiente: {formatearPrecioCLP(cita.montoPagado)}</p>
                        )}
                        {cita.montoReembolsado > 0 && (
                          <p className="texto-ayuda mb-0">Reembolsado: {formatearPrecioCLP(cita.montoReembolsado)}</p>
                        )}
                      </div>
                    </div>

                    {cita.estadoCita === ESTADO_CITA.POR_CONFIRMAR && (
                      <div className={`alert alert-${necesitaRecordatorio(cita) ? 'warning' : 'info'} mt-3 mb-0`}>
                        Confirma tu asistencia antes del {formatearFechaHora(cita.limiteConfirmacion)}; si no, la cita se
                        cancela automáticamente.
                      </div>
                    )}

                    <div className="d-flex flex-wrap gap-2 mt-3">
                      {cita.estadoCita === ESTADO_CITA.POR_CONFIRMAR && (
                        <button type="button" className="btn btn-nv-primario btn-sm" onClick={() => confirmar(cita.id)}>
                          Confirmar asistencia
                        </button>
                      )}
                      {citaTienePagoPendiente(cita) && (
                        <button type="button" className="btn btn-nv-secundario btn-sm" onClick={() => setPagandoId(cita.id)}>
                          Pagar ahora
                        </button>
                      )}
                      {puedeCancelar && (
                        <Link to={`/reservar?reprogramar=${cita.id}`} className="btn btn-outline-secondary btn-sm">Reprogramar</Link>
                      )}
                      {puedeCancelar && (
                        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => cancelar(cita)}>
                          {cita.planId ? 'Cancelar sesión' : 'Cancelar cita'}
                        </button>
                      )}
                      {activa && !puedeCancelar && (
                        <span className="texto-ayuda align-self-center">Para cancelar o reprogramar, llama a la clínica.</span>
                      )}
                    </div>

                    {pagandoId === cita.id && (
                      <PagoEnLinea onPagado={() => pagado(cita.id)} onCancelar={() => setPagandoId(null)} />
                    )}
                  </article>
                </li>
              )
            })}
          </ul>
        )}

        {misOrdenes.length > 0 && (
          <section aria-labelledby="titulo-ordenes" className="mt-5">
            <h2 id="titulo-ordenes" className="h3 mb-3">Mis compras</h2>
            <div className="table-responsive">
              <table className="table tabla-admin tabla-compacta align-middle">
                <thead><tr><th>Orden</th><th>Fecha</th><th>Ítems</th><th className="text-end">Total</th><th></th></tr></thead>
                <tbody>
                  {misOrdenes.map((o) => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{formatearFechaHora(o.fecha)}</td>
                      <td>{o.detalle.length}</td>
                      <td className="text-end">{formatearPrecioCLP(o.total)}</td>
                      <td><Link to={`/orden/${o.id}`}>Ver detalle</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </section>
  )
}

export default MisCitas
