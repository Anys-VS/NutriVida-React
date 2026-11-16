import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import EstadoBadge from '../components/EstadoBadge'
import PagoEnLinea from '../components/PagoEnLinea'
import { useSesion } from '../context/SesionContext'
import { ESTADO_CITA, ESTADO_PLAN } from '../config/reglas'
import { citaTienePagoPendiente, necesitaRecordatorio, puedeCancelarPaciente } from '../domain/citas'
import { requiereReembolso } from '../domain/metricas'
import { cancelarPlan, reembolsoPorCancelar } from '../services/planes'
import { pagarCita } from '../services/reservas'
import { cancelarMiCita, cargarMisCitas, confirmarMiCita } from '../services/misCitas'
import { useCarga } from '../hooks/useCarga'
import { usaApi } from '../config/api'
import { formatearFechaHora, formatearPrecioCLP } from '../utils/formato'

function MisCitas() {
  const { sesion } = useSesion()
  const ubicacion = useLocation()
  const [mensaje, setMensaje] = useState(
    ubicacion.state?.mensaje ? { tipo: 'success', texto: ubicacion.state.mensaje } : null,
  )
  const [pagandoId, setPagandoId] = useState(null)
  const [version, setVersion] = useState(0)
  // En modo 'api' algunas acciones todavía no existen en el backend (pagar una cita sola, reprogramar
  // desde aquí, planes y detalle de una orden): se ocultan y se mantienen en modo 'local'.
  const modoApi = usaApi()

  // Modo 'api': ms-citas (GET /api/v1/citas) y ms-ordenes (GET /api/v1/ordenes). Modo 'local': el navegador.
  const { datos, cargando, error, reintentar } = useCarga(() => cargarMisCitas(sesion.correo), [sesion.correo, version])
  const lista = datos?.citas ?? []
  const misPlanes = datos?.planes ?? []
  const misOrdenes = datos?.ordenes ?? []
  const refrescar = () => setVersion((versionAnterior) => versionAnterior + 1)

  // RN-06 en modo local: al cargar se cancelan las citas cuyo plazo de confirmación venció.
  useEffect(() => {
    if (datos?.canceladas > 0) {
      setMensaje({ tipo: 'warning', texto: `Se cancelaron ${datos.canceladas} cita(s) por falta de confirmación a tiempo.` })
    }
  }, [datos])

  const resolver = async (accion, textoOk) => {
    const resultado = await accion
    setMensaje(resultado.ok ? { tipo: 'success', texto: textoOk(resultado) } : { tipo: 'danger', texto: resultado.motivo })
    setPagandoId(null)
    refrescar()
  }

  const confirmar = (id) => resolver(confirmarMiCita(id), () => 'Asistencia confirmada. ¡Te esperamos!')
  const pagado = (id) => resolver(Promise.resolve(pagarCita(id)), () => 'Pago recibido. Tu cita quedó confirmada.')

  const pendientes = lista.filter(citaTienePagoPendiente)

  const cancelar = (cita) => {
    if (!window.confirm('¿Quieres cancelar esta cita?')) return
    resolver(cancelarMiCita(cita.id), ({ reembolsoPendiente }) => {
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
    resolver(Promise.resolve(cancelarPlan(plan.id)), ({ reembolsoPendiente }) =>
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
        {cargando && <p className="texto-ayuda" role="status">Cargando tus citas…</p>}
        {error && (
          <div role="alert" className="alert alert-danger d-flex flex-wrap align-items-center gap-2">
            <span>No pudimos cargar tus citas: {error.message}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={reintentar}>Reintentar</button>
          </div>
        )}
        {!cargando && !error && (
        <>

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
        {/* Las citas con pago pendiente también aparecen en el carrito, el único lugar para pagar varias juntas. */}
        {!modoApi && pendientes.length > 0 && (
          <div className="tarjeta-formulario mb-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <p className="mb-0">
              Tienes {pendientes.length} cita(s) con pago pendiente
              ({formatearPrecioCLP(pendientes.reduce((suma, cita) => suma + cita.precio, 0))}). Puedes pagarlas juntas desde tu carrito.
            </p>
            <Link to="/carrito" className="btn btn-nv-primario btn-sm">Pagar en el carrito</Link>
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
                      {!modoApi && citaTienePagoPendiente(cita) && (
                        <button type="button" className="btn btn-nv-secundario btn-sm" onClick={() => setPagandoId(cita.id)}>
                          Pagar ahora
                        </button>
                      )}
                      {!modoApi && puedeCancelar && (
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
                  {misOrdenes.map((orden) => (
                    <tr key={orden.id}>
                      <td>{orden.id}</td>
                      <td>{formatearFechaHora(orden.fecha)}</td>
                      <td>{orden.detalle.length}</td>
                      <td className="text-end">{formatearPrecioCLP(orden.total)}</td>
                      <td>{!modoApi && <Link to={`/orden/${orden.id}`}>Ver detalle</Link>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        </>
        )}
      </div>
    </section>
  )
}

export default MisCitas
