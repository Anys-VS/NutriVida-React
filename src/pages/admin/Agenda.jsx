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

  const usuariosPorCorreo = Object.fromEntries(usuarios.listar().map((usuario) => [usuario.correo.toLowerCase(), usuario]))
  const hoy = fechaLocalISO()
  const ahora = new Date()

  const visibles = lista.filter((cita) => {
    const fecha = fechaLocalISO(new Date(cita.fechaHora))
    if (filtro === FILTROS.HOY) return fecha === hoy
    if (filtro === FILTROS.PROXIMAS) return new Date(cita.fechaHora) >= ahora && cita.estadoCita !== ESTADO_CITA.CANCELADA
    if (filtro === FILTROS.PASADAS) return new Date(cita.fechaHora) < ahora
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
        {Object.values(FILTROS).map((opcionFiltro) => (
          <button key={opcionFiltro} type="button" className={`btn btn-sm ${filtro === opcionFiltro ? 'btn-nv-primario' : 'btn-nv-secundario'}`}
            aria-pressed={filtro === opcionFiltro} onClick={() => setFiltro(opcionFiltro)}>{opcionFiltro}</button>
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
              {visibles.map((cita) => {
                const paciente = usuariosPorCorreo[cita.pacienteCorreo.toLowerCase()]
                return (
                  <tr key={cita.id}>
                    <td>{formatearFechaHora(cita.fechaHora)}</td>
                    <td>{paciente ? `${paciente.nombre} ${paciente.apellidos}` : cita.pacienteCorreo}</td>
                    <td>{cita.nombreServicio}{cita.motivo && <><br /><small className="texto-ayuda">{cita.motivo}</small></>}</td>
                    <td><EstadoBadge estado={cita.estadoCita} /></td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        {paciente && <Link className="btn btn-sm btn-outline-secondary" to={`/admin/pacientes/${paciente.run}`}>Ficha</Link>}
                        {cita.estadoCita === ESTADO_CITA.CONFIRMADA && (
                          <>
                            <button type="button" className="btn btn-sm btn-nv-primario"
                              onClick={() => ejecutar(marcarAtendida(cita.id), 'Cita marcada como atendida.')}>Atendida</button>
                            <button type="button" className="btn btn-sm btn-outline-danger"
                              onClick={() => ejecutar(marcarInasistencia(cita.id), 'Inasistencia registrada.')}>Inasistencia</button>
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
