import { useCallback, useEffect, useMemo, useState } from 'react'
import EstadoBadge from '../../components/EstadoBadge'
import { ESTADO_CITA } from '../../config/reglas'
import { requiereReembolso } from '../../domain/metricas'
import { citas, usuarios } from '../../data/db'
import {
  cancelarCitasVencidas, cancelarPorClinica, marcarAtendida, marcarInasistencia,
  registrarPagoEnClinica, registrarReembolso,
} from '../../services/reservas'
import { formatearFechaHora, formatearPrecioCLP } from '../../utils/formato'

function AdminCitas() {
  const [lista, setLista] = useState(() => citas.listar())
  const [estado, setEstado] = useState('Todas')
  const [busqueda, setBusqueda] = useState('')
  const [mensaje, setMensaje] = useState(null)

  const refrescar = useCallback(() => setLista(citas.listar()), [])

  // RN-06: al entrar se cancelan las citas cuyo plazo de confirmación venció.
  useEffect(() => {
    const canceladas = cancelarCitasVencidas()
    if (canceladas > 0) {
      setMensaje({ tipo: 'warning', texto: `Se cancelaron ${canceladas} cita(s) por falta de confirmación a tiempo.` })
    }
    refrescar()
  }, [refrescar])

  const nombres = useMemo(
    () => Object.fromEntries(usuarios.listar().map((u) => [u.correo.toLowerCase(), `${u.nombre} ${u.apellidos}`])),
    [],
  )

  const ejecutar = (resultado, textoOk) => {
    setMensaje(resultado.ok ? { tipo: 'success', texto: textoOk(resultado) } : { tipo: 'danger', texto: resultado.motivo })
    refrescar()
  }
  const conConfirmacion = (pregunta, accion) => () => {
    if (window.confirm(pregunta)) accion()
  }

  const texto = busqueda.trim().toLowerCase()
  const visibles = lista
    .filter((c) => estado === 'Todas' || c.estadoCita === estado)
    .filter((c) => !texto || `${c.pacienteCorreo} ${nombres[c.pacienteCorreo.toLowerCase()] ?? ''} ${c.nombreServicio}`.toLowerCase().includes(texto))
    .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))

  return (
    <>
      <h1 className="titulo-seccion">Citas</h1>
      <p className="intro-seccion">Marca la asistencia, registra pagos en la clínica y gestiona los reembolsos.</p>
      {mensaje && <div role="status" className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

      <div className="tarjeta-formulario mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <label htmlFor="filtro-estado" className="form-label">Estado</label>
            <select id="filtro-estado" className="form-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option>Todas</option>
              {Object.values(ESTADO_CITA).map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="col-md-8">
            <label htmlFor="filtro-busqueda" className="form-label">Buscar por paciente o servicio</label>
            <input id="filtro-busqueda" className="form-control" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table tabla-admin align-middle">
          <caption className="visually-hidden">Listado de citas</caption>
          <thead>
            <tr><th>Paciente</th><th>Servicio</th><th>Fecha y hora</th><th>Estado</th><th>Pago</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {visibles.length === 0 && <tr><td colSpan={6} className="text-center">No hay citas para mostrar.</td></tr>}
            {visibles.map((c) => (
              <tr key={c.id}>
                <td>{nombres[c.pacienteCorreo.toLowerCase()] ?? c.pacienteCorreo}<br /><small className="texto-ayuda">{c.pacienteCorreo}</small></td>
                <td>{c.nombreServicio}<br /><small className="texto-ayuda">{c.nutricionista || 'Sin preferencia'}</small></td>
                <td>{formatearFechaHora(c.fechaHora)}</td>
                <td><EstadoBadge estado={c.estadoCita} /></td>
                <td><EstadoBadge estado={c.estadoPago} /><br /><small>{c.planId ? 'Incluida en el plan' : `${formatearPrecioCLP(c.precio)} · ${c.metodoPago}`}</small></td>
                <td>
                  <div className="d-flex gap-2 flex-wrap">
                    {c.estadoCita === ESTADO_CITA.CONFIRMADA && (
                      <>
                        <button type="button" className="btn btn-sm btn-nv-primario"
                          onClick={() => ejecutar(marcarAtendida(c.id), () => 'Cita marcada como atendida.')}>Atendida</button>
                        <button type="button" className="btn btn-sm btn-nv-secundario"
                          onClick={conConfirmacion('¿Registrar inasistencia?', () => ejecutar(marcarInasistencia(c.id), () => 'Inasistencia registrada.'))}>Inasistencia</button>
                      </>
                    )}
                    {[ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA].includes(c.estadoCita) && (
                      <button type="button" className="btn btn-sm btn-outline-danger"
                        onClick={conConfirmacion('¿Cancelar esta cita?', () => ejecutar(cancelarPorClinica(c.id), () => 'Cita cancelada.'))}>Cancelar</button>
                    )}
                    {c.estadoPago === 'Pendiente' && [ESTADO_CITA.CONFIRMADA, ESTADO_CITA.ATENDIDA].includes(c.estadoCita) && (
                      <button type="button" className="btn btn-sm btn-outline-success"
                        onClick={() => ejecutar(registrarPagoEnClinica(c.id), () => 'Pago registrado.')}>Registrar pago</button>
                    )}
                    {requiereReembolso(c) && (
                      <button type="button" className="btn btn-sm btn-outline-primary"
                        onClick={() => ejecutar(registrarReembolso(c.id), (r) => `Reembolso de ${formatearPrecioCLP(r.reembolso)} registrado.`)}>
                        Reembolsar {formatearPrecioCLP(c.montoPagado)}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default AdminCitas
