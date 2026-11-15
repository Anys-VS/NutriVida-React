import { useMemo, useState } from 'react'
import { citas, servicios } from '../data/db'
import { nutricionistas } from '../data/nutricionistas'
import { horariosDisponibles } from '../domain/citas'
import { fechaLocalISO } from '../utils/formato'

const horaLocal = (iso) => {
  const momento = new Date(iso)
  return `${String(momento.getHours()).padStart(2, '0')}:${String(momento.getMinutes()).padStart(2, '0')}`
}

// Formulario en línea para cambiar el horario de un ítem del carrito (fecha, hora y nutricionista).
// Muestra solo las horas de la jornada del profesional elegido y marca las ocupadas o muy próximas.
// onGuardar recibe { nutricionista, fechaHora } y devuelve { ok, motivo } del servicio.
function EditarHorario({ item, onGuardar, onCancelar }) {
  const [nutricionista, setNutricionista] = useState(item.nutricionista ?? '')
  // Un plan sin sesión agendada parte con la fecha y la hora vacías.
  const [fecha, setFecha] = useState(item.fechaHora ? fechaLocalISO(new Date(item.fechaHora)) : '')
  const [hora, setHora] = useState(item.fechaHora ? horaLocal(item.fechaHora) : '')
  const [error, setError] = useState('')
  const servicio = servicios.obtener(item.codigoServicio)
  const prefijo = `editar-${item.id}`

  const horarios = useMemo(
    () => (servicio && fecha ? horariosDisponibles({ servicio, nutricionista, fecha, citas: citas.listar() }) : []),
    [servicio, nutricionista, fecha],
  )
  const horaValida = horarios.some((horario) => horario.hora === hora && horario.disponible)

  const guardar = (evento) => {
    evento.preventDefault()
    if (!fecha || !hora || !horaValida) {
      setError('Elige una fecha y un horario disponible.')
      return
    }
    const resultado = onGuardar({ nutricionista, fechaHora: `${fecha}T${hora}:00` })
    if (!resultado.ok) setError(resultado.motivo)
  }

  return (
    <form className="editar-horario mt-3" onSubmit={guardar} noValidate aria-label={`Editar horario de ${item.nombreServicio}`}>
      <div className="row g-2">
        <div className="col-md-5">
          <label htmlFor={`${prefijo}-nutri`} className="form-label small mb-1">Nutricionista</label>
          <select id={`${prefijo}-nutri`} className="form-select form-select-sm" value={nutricionista}
            onChange={(evento) => { setNutricionista(evento.target.value); setHora(''); setError('') }}>
            <option value="">Sin preferencia</option>
            {nutricionistas.map((profesional) => <option key={profesional.id} value={profesional.nombre}>{profesional.nombre}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-4">
          <label htmlFor={`${prefijo}-fecha`} className="form-label small mb-1">Fecha</label>
          <input id={`${prefijo}-fecha`} type="date" className="form-control form-control-sm" min={fechaLocalISO()} value={fecha}
            onChange={(evento) => { setFecha(evento.target.value); setHora(''); setError('') }} />
        </div>
        <div className="col-6 col-md-3">
          <label htmlFor={`${prefijo}-hora`} className="form-label small mb-1">Hora</label>
          <select id={`${prefijo}-hora`} className="form-select form-select-sm" value={hora} disabled={horarios.length === 0}
            onChange={(evento) => { setHora(evento.target.value); setError('') }}>
            <option value="">{horarios.length === 0 ? 'Sin horas' : 'Elige'}</option>
            {horarios.map((horario) => (
              <option key={horario.hora} value={horario.hora} disabled={!horario.disponible}>
                {horario.hora}{horario.disponible ? '' : ` · ${horario.motivo}`}
              </option>
            ))}
          </select>
        </div>
      </div>
      {fecha && horarios.length === 0 && (
        <p className="texto-ayuda small mt-2 mb-0">
          {nutricionista ? `${nutricionista} no atiende ese día.` : 'No hay atención ese día.'} Prueba otra fecha
          {nutricionista ? ' o elige "Sin preferencia"' : ''}.
        </p>
      )}
      {error && <p role="alert" className="text-danger small mt-2 mb-0">{error}</p>}
      <div className="d-flex flex-wrap gap-2 mt-2">
        <button type="submit" className="btn btn-nv-primario btn-sm">Guardar horario</button>
        <button type="button" className="btn btn-nv-secundario btn-sm" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  )
}

export default EditarHorario
