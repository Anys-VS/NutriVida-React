import { useState } from 'react'
import { Link } from 'react-router-dom'
import EstadoCarga from '../../components/EstadoCarga'
import { useSesion } from '../../context/SesionContext'
import { useCarga } from '../../hooks/useCarga'
import { cargarPacientes } from '../../services/panel'
import { normalizar } from '../../domain/profesionales'
import { formatearFechaHora } from '../../utils/formato'

// Pacientes del nutricionista: solo los que tiene asignados o atiende.
function Pacientes() {
  const { sesion } = useSesion()
  const [busqueda, setBusqueda] = useState('')
  const { datos, cargando, error, reintentar } = useCarga(() => cargarPacientes(sesion))
  const lista = datos ?? []
  const visibles = lista.filter((paciente) => normalizar(`${paciente.nombre} ${paciente.correo}`).includes(normalizar(busqueda)))

  return (
    <>
      <h1 className="titulo-seccion">Mis pacientes</h1>
      <p className="intro-seccion">Abre la ficha para registrar mediciones, el objetivo y el plan alimenticio.</p>
      <div className="mb-3">
        <label htmlFor="buscar-paciente" className="form-label">Buscar paciente</label>
        <input id="buscar-paciente" type="search" className="form-control" value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Nombre o correo" />
      </div>
      <EstadoCarga cargando={cargando} error={error} reintentar={reintentar} que="tus pacientes" />
      {!datos ? null : visibles.length === 0 ? (
        <p className="tarjeta-formulario">No hay pacientes que coincidan.</p>
      ) : (
        <div className="table-responsive">
          <table className="table tabla-admin align-middle">
            <caption className="visually-hidden">Mis pacientes</caption>
            <thead><tr><th>Paciente</th><th>Correo</th><th>Próxima cita</th><th></th></tr></thead>
            <tbody>
              {visibles.map((paciente) => (
                <tr key={paciente.correo}>
                  <td>{paciente.nombre}</td>
                  <td>{paciente.correo}</td>
                  <td>{paciente.proxima ? formatearFechaHora(paciente.proxima.fechaHora) : '—'}</td>
                  <td><Link className="btn btn-sm btn-nv-primario" to={`/admin/pacientes/${encodeURIComponent(paciente.correo)}`}>Ver ficha</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default Pacientes
