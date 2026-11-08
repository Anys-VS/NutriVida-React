import { useState } from 'react'
import { Link } from 'react-router-dom'
import EstadoBadge from '../../components/EstadoBadge'
import { useSesion } from '../../context/SesionContext'
import { usuarios } from '../../data/db'
import { ESTADO_CITA } from '../../config/reglas'
import { agendaDe, profesionalDeSesion } from '../../services/clinico'
import { marcarAtendida, marcarInasistencia } from '../../services/reservas'
import { describirHorario } from '../../domain/profesionales'
import { fechaLocalISO, formatearFechaHora } from '../../utils/formato'

const FILTROS = { HOY: 'Hoy', PROXIMAS: 'Próximas', PASADAS: 'Pasadas', TODAS: 'Todas' }

// Agenda del nutricionista: solo ve sus propias citas (caso NutriVida, rol Nutricionista).
function Agenda() {
  const { sesion } = useSesion()
  const profesional = profesionalDeSesion(sesion)
  const [lista, setLista] = useState(() => agendaDe(sesion))
  const [filtro, setFiltro] = useState(FILTROS.PROXIMAS)
  const [mensaje, setMensaje] = useState(null)

  const usuariosPorCorreo = Object.fromEntries(usuarios.listar().map((u) => [u.correo.toLowerCase(), u]))
  const hoy = fechaLocalISO()
  const ahora = new Date()

  const visibles = lista.filter((c) => {
    const fecha = fechaLocalISO(new Date(c.fechaHora))
    if (filtro === FILTROS.HOY) return fecha === hoy
    if (filtro === FILTROS.PROXIMAS) return new Date(c.fechaHora) >= ahora && c.estadoCita !== ESTADO_CITA.CANCELADA
    if (filtro === FILTROS.PASADAS) return new Date(c.fechaHora) < ahora
    return true
  })

  const ejecutar = (resultado, texto) => {
    setMensaje(resultado.ok ? { tipo: 'success', texto } : { tipo: 'danger', texto: resultado.motivo })
    setLista(agendaDe(sesion))
  }

  if (!profesional) {
    return <div role="alert" className="alert alert-warning">Tu cuenta no está enlazada a un profesional del directorio.</div>
  }

  return (
    <>
      <h1 className="titulo-seccion">Mi agenda</h1>
      <p className="intro-seccion">{profesional.nombre} · {profesional.especialidad} · Atiende {describirHorario(profesional)}</p>
      {mensaje && <div role="status" className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

      <div className="btn-group mb-3 flex-wrap" role="group" aria-label="Filtrar agenda">
        {Object.values(FILTROS).map((f) => (
          <button key={f} type="button" className={`btn btn-sm ${filtro === f ? 'btn-nv-primario' : 'btn-nv-secundario'}`}
            aria-pressed={filtro === f} onClick={() => setFiltro(f)}>{f}</button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="tarjeta-formulario">No tienes citas en este filtro.</p>
      ) : (
        <div className="table-responsive">
          <table className="table tabla-admin align-middle">
            <caption className="visually-hidden">Citas de mi agenda</caption>
            <thead><tr><th>Fecha y hora</th><th>Paciente</th><th>Servicio y motivo</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {visibles.map((c) => {
                const paciente = usuariosPorCorreo[c.pacienteCorreo.toLowerCase()]
                return (
                  <tr key={c.id}>
                    <td>{formatearFechaHora(c.fechaHora)}</td>
                    <td>{paciente ? `${paciente.nombre} ${paciente.apellidos}` : c.pacienteCorreo}</td>
                    <td>{c.nombreServicio}{c.motivo && <><br /><small className="texto-ayuda">{c.motivo}</small></>}</td>
                    <td><EstadoBadge estado={c.estadoCita} /></td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        {paciente && <Link className="btn btn-sm btn-outline-secondary" to={`/admin/pacientes/${paciente.run}`}>Ficha</Link>}
                        {c.estadoCita === ESTADO_CITA.CONFIRMADA && (
                          <>
                            <button type="button" className="btn btn-sm btn-nv-primario"
                              onClick={() => ejecutar(marcarAtendida(c.id), 'Cita marcada como atendida.')}>Atendida</button>
                            <button type="button" className="btn btn-sm btn-outline-danger"
                              onClick={() => ejecutar(marcarInasistencia(c.id), 'Inasistencia registrada.')}>Inasistencia</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default Agenda
