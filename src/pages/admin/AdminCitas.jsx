import { useEffect, useState } from 'react'
import EstadoBadge from '../../components/EstadoBadge'
import EstadoCarga from '../../components/EstadoCarga'
import { useSesion } from '../../context/SesionContext'
import { ESTADO_CITA, ESTADO_PAGO } from '../../config/reglas'
import { requiereReembolso } from '../../domain/metricas'
import { useCarga } from '../../hooks/useCarga'
import {
  cancelarComoClinica, cargarCitasPersonal, nombreDe, registrarAsistencia, registrarPagoEnClinica, registrarReembolso,
} from '../../services/panel'
import { formatearFechaHora, formatearPrecioCLP } from '../../utils/formato'

// Todas las citas de la clínica (ms-citas en modo 'api'): asistencia, cancelación, pago en clínica y reembolsos.
function AdminCitas() {
  const { sesion } = useSesion()
  const [version, setVersion] = useState(0)
  const { datos, cargando, error, reintentar } = useCarga(() => cargarCitasPersonal(sesion), [version])
  const lista = datos?.citas ?? []
  const usuariosIndice = datos?.usuarios ?? {}
  const [estado, setEstado] = useState('Todas')
  const [busqueda, setBusqueda] = useState('')
  const [mensaje, setMensaje] = useState(null)

  // RN-06 en modo local: al entrar se cancelan las citas cuyo plazo de confirmación venció.
  useEffect(() => {
    if (datos?.canceladas > 0) {
      setMensaje({ tipo: 'warning', texto: `Se cancelaron ${datos.canceladas} cita(s) por falta de confirmación a tiempo.` })
    }
  }, [datos])

  const ejecutar = async (accion, textoOk) => {
    const resultado = await accion
    setMensaje(resultado.ok ? { tipo: 'success', texto: textoOk(resultado) } : { tipo: 'danger', texto: resultado.motivo })
    setVersion((versionAnterior) => versionAnterior + 1)
  }
  const conConfirmacion = (pregunta, accion) => () => {
    if (window.confirm(pregunta)) accion()
  }

  const texto = busqueda.trim().toLowerCase()
  const visibles = lista
    .filter((cita) => estado === 'Todas' || cita.estadoCita === estado)
    .filter((cita) => !texto || `${cita.pacienteCorreo} ${nombreDe(usuariosIndice, cita.pacienteCorreo)} ${cita.nombreServicio}`.toLowerCase().includes(texto))
    .sort((citaA, citaB) => new Date(citaA.fechaHora) - new Date(citaB.fechaHora))

  return (
    <>
      <h1 className="titulo-seccion">Citas</h1>
      <p className="intro-seccion">Marca la asistencia, registra pagos en la clínica y gestiona los reembolsos.</p>
      {mensaje && <div role="status" className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}
      <EstadoCarga cargando={cargando && !datos} error={error} reintentar={reintentar} que="las citas" />

      <div className="tarjeta-formulario mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <label htmlFor="filtro-estado" className="form-label">Estado</label>
            <select id="filtro-estado" className="form-select" value={estado} onChange={(evento) => setEstado(evento.target.value)}>
              <option>Todas</option>
              {Object.values(ESTADO_CITA).map((estadoOpcion) => <option key={estadoOpcion}>{estadoOpcion}</option>)}
            </select>
          </div>
          <div className="col-md-8">
            <label htmlFor="filtro-busqueda" className="form-label">Buscar por paciente o servicio</label>
            <input id="filtro-busqueda" className="form-control" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} />
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
            {visibles.map((cita) => (
              <tr key={cita.id}>
                <td>{nombreDe(usuariosIndice, cita.pacienteCorreo)}<br /><small className="texto-ayuda">{cita.pacienteCorreo}</small></td>
                <td>{cita.nombreServicio}<br /><small className="texto-ayuda">{cita.nutricionista || 'Sin preferencia'}</small></td>
                <td>{formatearFechaHora(cita.fechaHora)}</td>
                <td><EstadoBadge estado={cita.estadoCita} /></td>
                <td><EstadoBadge estado={cita.estadoPago} /><br /><small>{cita.planId ? 'Incluida en el plan' : `${formatearPrecioCLP(cita.precio)} · ${cita.metodoPago}`}</small></td>
                <td>
                  <div className="d-flex gap-2 flex-wrap">
                    {cita.estadoCita === ESTADO_CITA.CONFIRMADA && (
                      <>
                        <button type="button" className="btn btn-sm btn-nv-primario"
                          onClick={() => ejecutar(registrarAsistencia(cita.id, true), () => 'Cita marcada como atendida.')}>Atendida</button>
                        <button type="button" className="btn btn-sm btn-nv-secundario"
                          onClick={conConfirmacion('¿Registrar inasistencia?', () => ejecutar(registrarAsistencia(cita.id, false), () => 'Inasistencia registrada.'))}>Inasistencia</button>
                      </>
                    )}
                    {[ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA].includes(cita.estadoCita) && (
                      <button type="button" className="btn btn-sm btn-outline-danger"
                        onClick={conConfirmacion('¿Cancelar esta cita?', () => ejecutar(cancelarComoClinica(cita.id), () => 'Cita cancelada.'))}>Cancelar</button>
                    )}
                    {cita.estadoPago === ESTADO_PAGO.PENDIENTE && [ESTADO_CITA.CONFIRMADA, ESTADO_CITA.ATENDIDA].includes(cita.estadoCita) && (
                      <button type="button" className="btn btn-sm btn-outline-success"
                        onClick={() => ejecutar(registrarPagoEnClinica(cita.id), () => 'Pago registrado.')}>Registrar pago</button>
                    )}
                    {requiereReembolso(cita) && (
                      <button type="button" className="btn btn-sm btn-outline-primary"
                        onClick={() => ejecutar(registrarReembolso(cita.id), (resultado) => `Reembolso de ${formatearPrecioCLP(resultado.reembolso)} registrado.`)}>
                        Reembolsar {formatearPrecioCLP(cita.montoPagado)}
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
