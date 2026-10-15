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

  const nombres = Object.fromEntries(usuarios.listar().map((u) => [u.correo.toLowerCase(), `${u.nombre} ${u.apellidos}`]))
  const todasLasCitas = citas.listar()

  const reembolsar = (id) => {
    const r = registrarReembolsoPlan(id)
    setMensaje(r.ok
      ? { tipo: 'success', texto: `Reembolso de ${formatearPrecioCLP(r.reembolso)} registrado.` }
      : { tipo: 'danger', texto: r.motivo })
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
            {lista.map((p) => {
              const r = resumenSesiones(p, todasLasCitas.filter((c) => c.planId === p.id))
              return (
                <tr key={p.id}>
                  <td>{nombres[p.pacienteCorreo.toLowerCase()] ?? p.pacienteCorreo}</td>
                  <td>{p.nombre}<br /><small className="texto-ayuda">Contratado el {formatearFechaHora(p.creadoEn)}</small></td>
                  <td>{r.atendidas} de {r.total} atendidas<br /><small className="texto-ayuda">{r.agendadas} agendadas · {r.porAgendar} por agendar</small></td>
                  <td><EstadoBadge estado={p.estadoPlan} /></td>
                  <td><EstadoBadge estado={p.estadoPago} /><br /><small>{formatearPrecioCLP(p.montoPagado)}</small></td>
                  <td>
                    {p.reembolsoPendiente > 0 && (
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => reembolsar(p.id)}>
                        Reembolsar {formatearPrecioCLP(p.reembolsoPendiente)}
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
