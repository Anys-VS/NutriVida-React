import { useState } from 'react'
import EstadoBadge from '../../components/EstadoBadge'
import EstadoCarga from '../../components/EstadoCarga'
import { useCarga } from '../../hooks/useCarga'
import { cargarPlanes, reembolsarPlan } from '../../services/administracion'
import { formatearFechaHora, formatearPrecioCLP } from '../../utils/formato'

// Planes contratados por los pacientes (ms-citas en modo 'api').
function AdminPlanes() {
  const [version, setVersion] = useState(0)
  const { datos, cargando, error, reintentar } = useCarga(cargarPlanes, [version])
  const lista = datos?.planes ?? []
  const nombres = datos?.nombres ?? {}
  const [mensaje, setMensaje] = useState(null)
  const refrescar = () => setVersion((versionAnterior) => versionAnterior + 1)

  const reembolsar = async (id) => {
    const resultado = await reembolsarPlan(id)
    setMensaje(resultado.ok
      ? { tipo: 'success', texto: `Reembolso de ${formatearPrecioCLP(resultado.reembolso)} registrado.` }
      : { tipo: 'danger', texto: resultado.motivo })
    refrescar()
  }

  return (
    <>
      <h1 className="titulo-seccion">Planes contratados</h1>
      <p className="intro-seccion">Seguimiento de los planes de los pacientes y registro de sus reembolsos.</p>
      {mensaje && <div role="status" className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}
      <EstadoCarga cargando={cargando && !datos} error={error} reintentar={reintentar} que="los planes" />
      <div className="table-responsive">
        <table className="table tabla-admin align-middle">
          <caption className="visually-hidden">Planes contratados</caption>
          <thead><tr><th>Paciente</th><th>Plan</th><th>Sesiones</th><th>Estado</th><th>Pago</th><th>Acciones</th></tr></thead>
          <tbody>
            {lista.length === 0 && <tr><td colSpan={6} className="text-center">Aún no hay planes contratados.</td></tr>}
            {lista.map((plan) => {
              const { resumen } = plan
              return (
                <tr key={plan.id}>
                  <td>{nombres[plan.pacienteCorreo.toLowerCase()] ?? plan.pacienteCorreo}</td>
                  <td>{plan.nombre}<br /><small className="texto-ayuda">Contratado el {formatearFechaHora(plan.creadoEn)}</small></td>
                  <td>{resumen.atendidas} de {resumen.total} atendidas<br /><small className="texto-ayuda">{resumen.agendadas} agendadas · {resumen.porAgendar} por agendar</small></td>
                  <td><EstadoBadge estado={plan.estadoPlan} /></td>
                  <td><EstadoBadge estado={plan.estadoPago} /><br /><small>{formatearPrecioCLP(plan.montoPagado)}</small></td>
                  <td>
                    {plan.reembolsoPendiente > 0 && (
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => reembolsar(plan.id)}>
                        Reembolsar {formatearPrecioCLP(plan.reembolsoPendiente)}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default AdminPlanes
