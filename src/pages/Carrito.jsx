import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Campo from '../components/Campo'
import EditarHorario from '../components/EditarHorario'
import PagoEnLinea from '../components/PagoEnLinea'
import { useSesion } from '../context/SesionContext'
import { useCarrito } from '../context/CarritoContext'
import { REGLAS, TIPO_SERVICIO } from '../config/reglas'
import { totalDe } from '../domain/carrito'
import { horasHastaCita, puedeCancelarPaciente } from '../domain/citas'
import { validarCorreoReserva } from '../domain/validaciones'
import { useCarga } from '../hooks/useCarga'
import { listarServicios } from '../services/catalogo'
import { listarNutricionistas } from '../services/especialistas'
import { editarItem, pagar, quitarItem, revisarPago, vaciar as vaciarCarrito } from '../services/miCarrito'
import { formatearFechaHora, formatearPrecioCLP } from '../utils/formato'

// Líneas de detalle de un ítem; un plan sin sesión agendada no muestra nutricionista.
function detalleDeItem(item) {
  const lineas = []
  if (item.fechaHora) lineas.push(`Nutricionista: ${item.nutricionista || 'Sin preferencia (se asigna al pagar)'}`)
  if (item.motivo) lineas.push(`Motivo: ${item.motivo}`)
  if (item.tipo === TIPO_SERVICIO.PLAN && item.sesiones) {
    lineas.push(item.fechaHora
      ? `Incluye ${item.sesiones} sesiones: esta es la primera; las demás se agendan desde Mis citas.`
      : `Incluye ${item.sesiones} sesiones. Puedes agendar la primera ahora o todas después de pagar.`)
  }
  return lineas
}

// Carrito del paciente: ítems por reservar (se pueden editar o quitar) y citas ya agendadas con
// pago pendiente (se pueden reprogramar). Se paga lo marcado o todo, en un solo pago online.
function Carrito() {
  const { sesion } = useSesion()
  const { items, pendientes, refrescar } = useCarrito()
  const navigate = useNavigate()
  const [marcados, setMarcados] = useState(() => new Set([...items, ...pendientes].map((elemento) => elemento.id)))
  const [vistos, setVistos] = useState(() => new Set([...items, ...pendientes].map((elemento) => elemento.id)))
  const [procesando, setProcesando] = useState(false)
  // Servicios y nutricionistas para editar horarios (ms-catalogo y ms-citas en modo 'api').
  const { datos: catalogo } = useCarga(() => Promise.all([listarServicios(), listarNutricionistas()]))
  const [servicios, nutricionistas] = catalogo ?? [[], []]
  const [pagando, setPagando] = useState(null) // null | 'seleccionados' | 'todo'
  const [editando, setEditando] = useState(null) // id del ítem cuyo horario se edita
  const [correo, setCorreo] = useState(sesion.correo)
  const [errorCorreo, setErrorCorreo] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [problemas, setProblemas] = useState({})

  const todos = useMemo(() => [...items, ...pendientes], [items, pendientes])

  // En modo 'api' el carrito llega después de cargar la página: lo nuevo que aparece queda marcado.
  useEffect(() => {
    const nuevos = todos.map((elemento) => elemento.id).filter((id) => !vistos.has(id))
    if (nuevos.length === 0) return
    setVistos((actual) => new Set([...actual, ...nuevos]))
    setMarcados((actual) => new Set([...actual, ...nuevos]))
  }, [todos, vistos])
  // Solo cuentan los marcados que siguen en el carrito.
  const seleccion = useMemo(() => ({
    items: items.filter((item) => marcados.has(item.id)),
    citas: pendientes.filter((cita) => marcados.has(cita.id)),
  }), [items, pendientes, marcados])
  const cantidadSeleccion = seleccion.items.length + seleccion.citas.length
  const totalSeleccion = totalDe(seleccion.items) + totalDe(seleccion.citas)
  const totalTodo = totalDe(todos)
  const aPagar = pagando === 'todo' ? { items, citas: pendientes } : seleccion
  const totalAPagar = totalDe(aPagar.items) + totalDe(aPagar.citas)

  const alternar = (id) => {
    setPagando(null)
    setMarcados((actual) => {
      const nuevo = new Set(actual)
      if (nuevo.has(id)) nuevo.delete(id)
      else nuevo.add(id)
      return nuevo
    })
  }
  const marcarTodos = (marcar) => {
    setPagando(null)
    setMarcados(new Set(marcar ? todos.map((elemento) => elemento.id) : []))
  }

  const quitar = async (item) => {
    const resultado = await quitarItem(sesion.correo, item.id)
    refrescar()
    setPagando(null)
    setMensaje(resultado.ok
      ? { tipo: 'info', texto: `Quitaste "${item.nombreServicio}" del carrito.` }
      : { tipo: 'danger', texto: resultado.motivo })
  }

  const vaciar = async () => {
    if (!window.confirm('¿Quitar del carrito todos los ítems por reservar? Tus citas ya agendadas no se tocan.')) return
    const resultado = await vaciarCarrito(sesion.correo)
    refrescar()
    setPagando(null)
    setMensaje(resultado.ok
      ? { tipo: 'info', texto: 'Quitaste los ítems por reservar. Tus citas agendadas siguen igual.' }
      : { tipo: 'danger', texto: resultado.motivo })
  }

  const guardarHorario = async (item, cambios) => {
    const resultado = await editarItem({ correo: sesion.correo, id: item.id, ...cambios })
    if (resultado.ok) {
      refrescar()
      setEditando(null)
      setPagando(null)
      setProblemas(({ [item.id]: _resuelto, ...resto }) => resto)
      const accion = item.fechaHora ? 'Nuevo horario de' : 'Primera sesión agendada para'
      setMensaje({ tipo: 'success', texto: `${accion} "${item.nombreServicio}": ${formatearFechaHora(resultado.item.fechaHora)}` })
    }
    return resultado
  }

  // Antes de pedir la tarjeta se revisa que todo siga disponible (RN-08, RN-14) y que las citas sigan pendientes.
  const iniciarPago = async (modo) => {
    const lista = modo === 'todo' ? { items, citas: pendientes } : seleccion
    if (lista.items.length + lista.citas.length === 0) {
      setMensaje({ tipo: 'warning', texto: 'Marca al menos un ítem para pagar.' })
      return
    }
    const revision = await revisarPago(sesion.correo, lista.items.map((item) => item.id), lista.citas.map((cita) => cita.id))
    setProblemas(Object.fromEntries(revision.map((problema) => [problema.id, problema.motivo])))
    if (revision.length > 0) {
      setMensaje({ tipo: 'danger', texto: 'Algunos ítems ya no se pueden pagar. Edita su horario o quítalos antes de pagar.' })
      return
    }
    setEditando(null)
    setMensaje(null)
    setPagando(modo)
  }

  const pagado = async (tarjeta) => {
    const errCorreo = validarCorreoReserva(correo)
    setErrorCorreo(errCorreo)
    if (errCorreo) return
    setProcesando(true)
    const resultado = await pagar({
      correo: sesion.correo,
      itemIds: aPagar.items.map((item) => item.id),
      citaIds: aPagar.citas.map((cita) => cita.id),
      correoConfirmacion: correo.trim(),
      tarjeta,
    })
    setProcesando(false)
    refrescar()
    setPagando(null)
    if (resultado.rechazado) {
      navigate('/pago-error', { state: { motivo: resultado.motivo } })
      return
    }
    if (!resultado.ok) {
      setProblemas(Object.fromEntries((resultado.problemas ?? []).map((problema) => [problema.id, problema.motivo])))
      setMensaje({ tipo: 'danger', texto: resultado.motivo })
      return
    }
    navigate(`/orden/${resultado.orden.id}`, { replace: true })
  }

  // Un ítem cuyo horario ya pasó (o falta menos de lo mínimo) no se puede pagar: se avisa de entrada.
  const horarioVencido = (item) => Boolean(item.fechaHora) && horasHastaCita(item.fechaHora) < REGLAS.ANTICIPACION_MINIMA_HORAS

  const casilla = (elemento) => (
    <input id={`marcar-${elemento.id}`} type="checkbox" className="form-check-input mt-1 flex-shrink-0"
      checked={marcados.has(elemento.id)} onChange={() => alternar(elemento.id)} aria-label={`Seleccionar ${elemento.nombreServicio}`} />
  )

  return (
    <section className="seccion">
      <div className="container">
        <h1 className="titulo-seccion">Mi carrito</h1>
        <p className="intro-seccion">
          Reúne lo que tienes por pagar: atenciones nuevas y citas que ya agendaste con pago en clínica.
          Paga solo lo que marques o todo de una vez, con un único pago online.
        </p>
        {mensaje && <div role="status" className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

        {todos.length === 0 ? (
          <div className="tarjeta-formulario text-center">
            <h2 className="h4">Tu carrito está vacío</h2>
            <p className="mb-3">Elige un servicio y un horario, y usa “Agregar al carrito”.</p>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <Link to="/reservar" className="btn btn-nv-primario">Reservar una hora</Link>
              <Link to="/especialistas" className="btn btn-nv-secundario">Buscar especialistas</Link>
            </div>
          </div>
        ) : (
          <div className="row g-4 align-items-start">
            <div className="col-lg-8">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div className="form-check">
                  <input id="marcar-todos" type="checkbox" className="form-check-input"
                    checked={cantidadSeleccion === todos.length} onChange={(evento) => marcarTodos(evento.target.checked)} />
                  <label htmlFor="marcar-todos" className="form-check-label">Marcar todo ({todos.length})</label>
                </div>
                {items.length > 0 && <button type="button" className="btn btn-link text-danger p-0" onClick={vaciar}>Quitar ítems por reservar</button>}
              </div>

              {items.length > 0 && (
                <section aria-labelledby="titulo-por-reservar" className="mb-4">
                  <h2 id="titulo-por-reservar" className="h5">Por reservar ({items.length})</h2>
                  <p className="texto-ayuda">El horario se reserva al pagar. Puedes cambiarlo aquí mismo antes.</p>
                  <ul className="list-unstyled d-flex flex-column gap-3" aria-label="Ítems por reservar">
                    {items.map((item) => (
                      <li key={item.id}>
                        <article className={`tarjeta-formulario item-carrito${problemas[item.id] ? ' item-con-problema' : ''}`}>
                          <div className="d-flex gap-3">
                            {casilla(item)}
                            <div className="flex-grow-1">
                              <div className="d-flex flex-wrap justify-content-between gap-2">
                                <div>
                                  <span className="franja-tipo position-static d-inline-block mb-1">{item.tipo}</span>
                                  <h3 className="h5 mb-1"><label htmlFor={`marcar-${item.id}`}>{item.nombreServicio}</label></h3>
                                  <p className="mb-1">{item.fechaHora ? formatearFechaHora(item.fechaHora) : 'Primera sesión: por agendar'}</p>
                                  <p className="texto-ayuda mb-0">
                                    {detalleDeItem(item).map((linea, posicion) => (
                                      <span key={linea}>{posicion > 0 && <br />}{linea}</span>
                                    ))}
                                  </p>
                                </div>
                                <div className="text-sm-end">
                                  <p className="precio-servicio mb-2">{formatearPrecioCLP(item.precio)}</p>
                                  <div className="d-flex flex-wrap gap-2 justify-content-sm-end">
                                    {editando !== item.id && (
                                      <button type="button" className="btn btn-nv-secundario btn-sm"
                                        onClick={() => { setEditando(item.id); setPagando(null) }}>
                                        {item.fechaHora ? 'Editar horario' : 'Agendar sesión'}
                                      </button>
                                    )}
                                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => quitar(item)}>Quitar</button>
                                  </div>
                                </div>
                              </div>
                              {editando === item.id && (
                                <EditarHorario item={item} servicio={servicios.find((servicio) => servicio.codigo === item.codigoServicio)}
                                  nutricionistas={nutricionistas} onGuardar={(cambios) => guardarHorario(item, cambios)}
                                  onCancelar={() => setEditando(null)} />
                              )}
                              {problemas[item.id] && <p role="alert" className="text-danger small mt-2 mb-0">{problemas[item.id]}</p>}
                              {!problemas[item.id] && editando !== item.id && horarioVencido(item) && (
                                <p className="text-warning-emphasis small mt-2 mb-0">
                                  Este horario ya pasó o está muy próximo. Usa “Editar horario” para elegir otro antes de pagar.
                                </p>
                              )}
                            </div>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                  <p className="texto-ayuda">Máximo {REGLAS.MAXIMO_ITEMS_CARRITO} ítems. <Link to="/reservar">Agregar otra atención</Link></p>
                </section>
              )}

              {pendientes.length > 0 && (
                <section aria-labelledby="titulo-agendadas">
                  <h2 id="titulo-agendadas" className="h5">Agendadas con pago pendiente ({pendientes.length})</h2>
                  <p className="texto-ayuda">Ya tienen su horario. Págalas aquí junto con lo demás, o en la clínica el día de la cita.</p>
                  <ul className="list-unstyled d-flex flex-column gap-3" aria-label="Citas agendadas con pago pendiente">
                    {pendientes.map((cita) => (
                      <li key={cita.id}>
                        <article className={`tarjeta-formulario item-carrito${problemas[cita.id] ? ' item-con-problema' : ''}`}>
                          <div className="d-flex gap-3">
                            {casilla(cita)}
                            <div className="flex-grow-1">
                              <div className="d-flex flex-wrap justify-content-between gap-2">
                                <div>
                                  <span className="badge text-bg-warning mb-1">Agendada · {cita.estadoCita}</span>
                                  <h3 className="h5 mb-1"><label htmlFor={`marcar-${cita.id}`}>{cita.nombreServicio}</label></h3>
                                  <p className="mb-1">{formatearFechaHora(cita.fechaHora)}</p>
                                  <p className="texto-ayuda mb-0">
                                    Nutricionista: {cita.nutricionista || 'Por asignar'}
                                    {cita.motivo && <><br />Motivo: {cita.motivo}</>}
                                  </p>
                                </div>
                                <div className="text-sm-end">
                                  <p className="precio-servicio mb-2">{formatearPrecioCLP(cita.precio)}</p>
                                  {puedeCancelarPaciente(cita) && (
                                    <Link to={`/reservar?reprogramar=${cita.id}`} className="btn btn-nv-secundario btn-sm">Reprogramar</Link>
                                  )}
                                </div>
                              </div>
                              {problemas[cita.id] && <p role="alert" className="text-danger small mt-2 mb-0">{problemas[cita.id]}</p>}
                            </div>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="col-lg-4">
              <div className="tarjeta-formulario resumen-carrito">
                <h2 className="h4">Resumen</h2>
                <p className="d-flex justify-content-between mb-1">
                  <span>Seleccionados ({cantidadSeleccion})</span><strong>{formatearPrecioCLP(totalSeleccion)}</strong>
                </p>
                <p className="d-flex justify-content-between mb-3">
                  <span>Todo ({todos.length})</span><strong>{formatearPrecioCLP(totalTodo)}</strong>
                </p>
                <div className="d-grid gap-2">
                  <button type="button" className="btn btn-nv-primario" disabled={cantidadSeleccion === 0}
                    onClick={() => iniciarPago('seleccionados')}>
                    Pagar seleccionados ({formatearPrecioCLP(totalSeleccion)})
                  </button>
                  <button type="button" className="btn btn-nv-secundario" onClick={() => iniciarPago('todo')}>
                    Pagar todo ({formatearPrecioCLP(totalTodo)})
                  </button>
                </div>

                {pagando && (
                  <div className="mt-4">
                    <hr />
                    <h3 className="h5">Pago online</h3>
                    <p className="texto-ayuda">
                      {aPagar.items.length + aPagar.citas.length} ítem(s) · total <strong>{formatearPrecioCLP(totalAPagar)}</strong>.
                      Las citas quedan confirmadas y pagadas de inmediato.
                    </p>
                    <Campo id="carrito-correo" etiqueta="Correo de confirmación" type="email" value={correo}
                      onChange={(evento) => setCorreo(evento.target.value)} error={errorCorreo} maxLength={100}
                      ayuda="Solo dominios @duoc.cl, @profesor.duoc.cl o @gmail.com." />
                    <PagoEnLinea textoBoton={`Pagar ${formatearPrecioCLP(totalAPagar)}`} ocupado={procesando}
                      onPagado={pagado} onCancelar={() => setPagando(null)} />
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}

export default Carrito
