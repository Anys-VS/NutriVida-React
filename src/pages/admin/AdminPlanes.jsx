import { useCallback, useState } from 'react'
import EstadoBadge from '../../components/EstadoBadge'
import { citas, planes, usuarios } from '../../data/db'
import { registrarReembolsoPlan } from '../../services/planes'
import { resumenSesiones } from '../../domain/planes'
import { formatearFechaHora, formatearPrecioCLP } from '../../utils/formato'

function AdminPlanes() {
  const [lista, setLista] = useState(() => planes.listar())
  const [mensaje, setMensaje] = useState(null)
  const refrescar = useCallback(() => setLista(planes.listar()), [])

  const nombres = Object.fromEntries(usuarios.listar().map((usuario) => [usuario.correo.toLowerCase(), `${usuario.nombre} ${usuario.apellidos}`]))
  const todasLasCitas = citas.listar()

  const reembolsar = (id) => {
    const resultado = registrarReembolsoPlan(id)
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
      <div className="table-responsive">
        <table className="table tabla-admin align-middle">
          <caption className="visually-hidden">Planes contratados</caption>
          <thead><tr><th>Paciente</th><th>Plan</th><th>Sesiones</th><th>Estado</th><th>Pago</th><th>Acciones</th></tr></thead>
          <tbody>
            {lista.length === 0 && <tr><td colSpan={6} className="text-center">Aún no hay planes contratados.</td></tr>}
            {lista.map((plan) => {
              const resumen = resumenSesiones(plan, todasLasCitas.filter((cita) => cita.planId === plan.id))
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
