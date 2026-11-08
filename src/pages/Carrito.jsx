import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Campo from '../components/Campo'
import PagoEnLinea from '../components/PagoEnLinea'
import { useSesion } from '../context/SesionContext'
import { useCarrito } from '../context/CarritoContext'
import { REGLAS, TIPO_SERVICIO } from '../config/reglas'
import { totalDe } from '../domain/carrito'
import { validarCorreoReserva } from '../domain/validaciones'
import { pagarCarrito, quitarDelCarrito, revisarAntesDePagar, vaciarCarrito } from '../services/carrito'
import { formatearFechaHora, formatearPrecioCLP } from '../utils/formato'

function Carrito() {
  const { sesion } = useSesion()
  const { items, refrescar } = useCarrito()
  const navigate = useNavigate()
  const [marcados, setMarcados] = useState(() => new Set(items.map((i) => i.id)))
  const [pagando, setPagando] = useState(null) // null | 'seleccionados' | 'todo'
  const [correo, setCorreo] = useState(sesion.correo)
  const [errorCorreo, setErrorCorreo] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [problemas, setProblemas] = useState({})

  // Solo cuentan los marcados que siguen en el carrito.
  const seleccionados = useMemo(() => items.filter((i) => marcados.has(i.id)), [items, marcados])
  const aPagar = pagando === 'todo' ? items : seleccionados

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
    setMarcados(new Set(marcar ? items.map((i) => i.id) : []))
  }

  const quitar = (item) => {
    quitarDelCarrito(sesion.correo, item.id)
    refrescar()
    setPagando(null)
    setMensaje({ tipo: 'info', texto: `Quitaste "${item.nombreServicio}" del carrito.` })
  }

  const vaciar = () => {
    if (!window.confirm('¿Quitar todos los ítems del carrito?')) return
    vaciarCarrito(sesion.correo)
    refrescar()
    setPagando(null)
    setMensaje({ tipo: 'info', texto: 'Vaciaste el carrito.' })
  }

  // Antes de pedir la tarjeta se revisa que cada ítem siga disponible (RN-08, RN-14).
  const iniciarPago = (modo) => {
    const lista = modo === 'todo' ? items : seleccionados
    if (lista.length === 0) {
      setMensaje({ tipo: 'warning', texto: 'Marca al menos un ítem para pagar.' })
      return
    }
    const revision = revisarAntesDePagar(sesion.correo, lista.map((i) => i.id))
    setProblemas(Object.fromEntries(revision.map((r) => [r.id, r.motivo])))
    if (revision.length > 0) {
      setMensaje({ tipo: 'danger', texto: 'Algunos ítems ya no se pueden reservar. Quítalos o cámbialos antes de pagar.' })
      return
    }
    setMensaje(null)
    setPagando(modo)
  }

  const pagado = () => {
    const errCorreo = validarCorreoReserva(correo)
    setErrorCorreo(errCorreo)
    if (errCorreo) return
    const resultado = pagarCarrito({ pacienteCorreo: sesion.correo, ids: aPagar.map((i) => i.id), correoConfirmacion: correo.trim() })
    refrescar()
    setPagando(null)
    if (!resultado.ok) {
      setProblemas(Object.fromEntries((resultado.problemas ?? []).map((r) => [r.id, r.motivo])))
      setMensaje({ tipo: 'danger', texto: resultado.motivo })
      return
    }
    navigate(`/orden/${resultado.orden.id}`, { replace: true })
  }

  return (
    <section className="seccion">
      <div className="container">
        <h1 className="titulo-seccion">Mi carrito</h1>
        <p className="intro-seccion">
          Reúne citas y planes y paga solo los que marques o todo de una vez, con un único pago online.
          Los horarios se confirman al pagar.
        </p>
        {mensaje && <div role="status" className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

        {items.length === 0 ? (
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
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                <div className="form-check">
                  <input id="marcar-todos" type="checkbox" className="form-check-input"
                    checked={seleccionados.length === items.length} onChange={(e) => marcarTodos(e.target.checked)} />
                  <label htmlFor="marcar-todos" className="form-check-label">Marcar todos ({items.length})</label>
                </div>
                <button type="button" className="btn btn-link text-danger p-0" onClick={vaciar}>Vaciar carrito</button>
              </div>
              <ul className="list-unstyled d-flex flex-column gap-3" aria-label="Ítems del carrito">
                {items.map((item) => (
                  <li key={item.id}>
                    <article className={`tarjeta-formulario item-carrito${problemas[item.id] ? ' item-con-problema' : ''}`}>
                      <div className="d-flex gap-3">
                        <input id={`marcar-${item.id}`} type="checkbox" className="form-check-input mt-1 flex-shrink-0"
                          checked={marcados.has(item.id)} onChange={() => alternar(item.id)}
                          aria-label={`Seleccionar ${item.nombreServicio}`} />
                        <div className="flex-grow-1">
                          <div className="d-flex flex-wrap justify-content-between gap-2">
                            <div>
                              <span className="franja-tipo position-static d-inline-block mb-1">{item.tipo}</span>
                              <h2 className="h5 mb-1"><label htmlFor={`marcar-${item.id}`}>{item.nombreServicio}</label></h2>
                              <p className="mb-1">{formatearFechaHora(item.fechaHora)}</p>
                              <p className="texto-ayuda mb-0">
                                Nutricionista: {item.nutricionista || 'Sin preferencia (se asigna al pagar)'}
                                {item.motivo && <><br />Motivo: {item.motivo}</>}
                                {item.tipo === TIPO_SERVICIO.PLAN && item.sesiones && (
                                  <><br />Incluye {item.sesiones} sesiones: esta es la primera; las demás se agendan desde Mis citas.</>
                                )}
                              </p>
                            </div>
                            <div className="text-sm-end">
                              <p className="precio-servicio mb-2">{formatearPrecioCLP(item.precio)}</p>
                              <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => quitar(item)}>Quitar</button>
                            </div>
                          </div>
                          {problemas[item.id] && <p role="alert" className="text-danger small mt-2 mb-0">{problemas[item.id]}</p>}
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
              <p className="texto-ayuda">Máximo {REGLAS.MAXIMO_ITEMS_CARRITO} ítems. <Link to="/reservar">Agregar otra atención</Link></p>
            </div>

            <aside className="col-lg-4">
              <div className="tarjeta-formulario resumen-carrito">
                <h2 className="h4">Resumen</h2>
                <p className="d-flex justify-content-between mb-1">
                  <span>Seleccionados ({seleccionados.length})</span><strong>{formatearPrecioCLP(totalDe(seleccionados))}</strong>
                </p>
                <p className="d-flex justify-content-between mb-3">
                  <span>Todo el carrito ({items.length})</span><strong>{formatearPrecioCLP(totalDe(items))}</strong>
                </p>
                <div className="d-grid gap-2">
                  <button type="button" className="btn btn-nv-primario" disabled={seleccionados.length === 0}
                    onClick={() => iniciarPago('seleccionados')}>
                    Pagar seleccionados ({formatearPrecioCLP(totalDe(seleccionados))})
                  </button>
                  <button type="button" className="btn btn-nv-secundario" onClick={() => iniciarPago('todo')}>
                    Pagar todo ({formatearPrecioCLP(totalDe(items))})
                  </button>
                </div>

                {pagando && (
                  <div className="mt-4">
                    <hr />
                    <h3 className="h5">Pago online</h3>
                    <p className="texto-ayuda">
                      {aPagar.length} ítem(s) · total <strong>{formatearPrecioCLP(totalDe(aPagar))}</strong>. Las citas quedan
                      confirmadas y pagadas de inmediato.
                    </p>
                    <Campo id="carrito-correo" etiqueta="Correo de confirmación" type="email" value={correo}
                      onChange={(e) => setCorreo(e.target.value)} error={errorCorreo} maxLength={100}
                      ayuda="Solo dominios @duoc.cl, @profesor.duoc.cl o @gmail.com." />
                    <PagoEnLinea textoBoton={`Pagar ${formatearPrecioCLP(totalDe(aPagar))}`}
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
