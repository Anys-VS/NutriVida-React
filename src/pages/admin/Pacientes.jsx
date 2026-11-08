import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSesion } from '../../context/SesionContext'
import { pacientesDe } from '../../services/clinico'
import { normalizar } from '../../domain/profesionales'
import { formatearFechaHora } from '../../utils/formato'

// Pacientes del nutricionista: solo los que tiene asignados o atiende.
function Pacientes() {
  const { sesion } = useSesion()
  const [busqueda, setBusqueda] = useState('')
  const lista = pacientesDe(sesion)
  const visibles = lista.filter((p) => normalizar(`${p.nombre} ${p.correo}`).includes(normalizar(busqueda)))

  return (
    <>
      <h1 className="titulo-seccion">Mis pacientes</h1>
      <p className="intro-seccion">Abre la ficha para registrar mediciones, el objetivo y el plan alimenticio.</p>
      <div className="mb-3">
        <label htmlFor="buscar-paciente" className="form-label">Buscar paciente</label>
        <input id="buscar-paciente" type="search" className="form-control" value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre o correo" />
      </div>
      {visibles.length === 0 ? (
        <p className="tarjeta-formulario">No hay pacientes que coincidan.</p>
      ) : (
        <div className="table-responsive">
          <table className="table tabla-admin align-middle">
            <caption className="visually-hidden">Mis pacientes</caption>
            <thead><tr><th>Paciente</th><th>Correo</th><th>Próxima cita</th><th></th></tr></thead>
            <tbody>
              {visibles.map((p) => (
                <tr key={p.correo}>
                  <td>{p.nombre}</td>
                  <td>{p.correo}</td>
                  <td>{p.proxima ? formatearFechaHora(p.proxima.fechaHora) : '—'}</td>
                  <td>{p.run && <Link className="btn btn-sm btn-nv-primario" to={`/admin/pacientes/${p.run}`}>Ver ficha</Link>}</td>
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
