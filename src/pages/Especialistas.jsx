import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { citas } from '../data/db'
import { nutricionistas } from '../data/nutricionistas'
import { proximosHorarios } from '../domain/citas'
import { buscarProfesionales, describirHorario, iniciales, NOMBRES_DIAS } from '../domain/profesionales'

const formatoDia = new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
const fechaCorta = (fecha) => {
  const [a, m, d] = fecha.split('-').map(Number)
  return formatoDia.format(new Date(a, m - 1, d))
}

// Buscador de especialistas: filtra por texto, especialidad y día, y muestra los próximos horarios libres.
function Especialistas() {
  const [params, setParams] = useSearchParams()
  const texto = params.get('q') ?? ''
  const especialidad = params.get('especialidad') ?? ''
  const dia = params.get('dia') ?? ''

  const cambiar = (campo) => (evento) => {
    const nuevos = new URLSearchParams(params)
    if (evento.target.value) nuevos.set(campo, evento.target.value)
    else nuevos.delete(campo)
    setParams(nuevos, { replace: true })
  }
  const limpiar = () => setParams({}, { replace: true })

  const especialidades = [...new Set(nutricionistas.map((n) => n.especialidad))]
  const resultados = useMemo(
    () => buscarProfesionales(nutricionistas, { texto, especialidad, dia }),
    [texto, especialidad, dia],
  )
  const todasLasCitas = citas.listar()

  return (
    <section className="seccion">
      <div className="container">
        <h1 className="titulo-seccion">Nuestros especialistas</h1>
        <p className="intro-seccion">
          Busca por nombre, especialidad u objetivo (por ejemplo “deporte”, “vegana” o “niños”) y reserva directo con
          quien prefieras.
        </p>

        <form className="tarjeta-formulario mb-4" role="search" onSubmit={(e) => e.preventDefault()}>
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label htmlFor="buscar-texto" className="form-label">Buscar</label>
              <input id="buscar-texto" type="search" className="form-control" value={texto} onChange={cambiar('q')}
                placeholder="Nombre, especialidad u objetivo" maxLength={60} />
            </div>
            <div className="col-md-4">
              <label htmlFor="buscar-especialidad" className="form-label">Especialidad</label>
              <select id="buscar-especialidad" className="form-select" value={especialidad} onChange={cambiar('especialidad')}>
                <option value="">Todas</option>
                {especialidades.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="buscar-dia" className="form-label">Día de atención</label>
              <select id="buscar-dia" className="form-select" value={dia} onChange={cambiar('dia')}>
                <option value="">Cualquier día</option>
                {[1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{NOMBRES_DIAS[d]}</option>)}
              </select>
            </div>
          </div>
        </form>

        <p className="texto-ayuda" aria-live="polite">
          {resultados.length === 1 ? '1 especialista encontrado' : `${resultados.length} especialistas encontrados`}
        </p>

        {resultados.length === 0 ? (
          <div className="tarjeta-formulario text-center">
            <h2 className="h4">No encontramos especialistas con esos filtros</h2>
            <button type="button" className="btn btn-nv-secundario mt-2" onClick={limpiar}>Limpiar filtros</button>
          </div>
        ) : (
          <ul className="row g-4 list-unstyled">
            {resultados.map((p) => {
              const libres = proximosHorarios({ profesional: p, citas: todasLasCitas })
              return (
                <li key={p.id} className="col-md-6">
                  <article className="tarjeta-formulario h-100 d-flex flex-column">
                    <div className="d-flex gap-3 align-items-center mb-2">
                      <div className="avatar-iniciales flex-shrink-0">{iniciales(p.nombre)}</div>
                      <div>
                        <h2 className="h5 mb-0">{p.nombre}</h2>
                        <p className="especialidad mb-0">{p.especialidad}</p>
                      </div>
                    </div>
                    <p className="mb-2">{p.resena}</p>
                    <p className="texto-ayuda mb-2">Atiende {describirHorario(p)}</p>
                    <p className="mb-1"><strong>Próximos horarios libres</strong></p>
                    {libres.length === 0 ? (
                      <p className="texto-ayuda">Sin horarios libres en las próximas dos semanas.</p>
                    ) : (
                      <ul className="list-unstyled d-flex flex-wrap gap-2 mb-3">
                        {libres.map((h) => (
                          <li key={`${h.fecha}-${h.hora}`}>
                            <span className="badge text-bg-light border">{fechaCorta(h.fecha)} · {h.hora}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-auto">
                      <Link to={`/reservar?nutricionista=${encodeURIComponent(p.nombre)}`} className="btn btn-nv-primario">
                        Reservar con {p.nombre.split(' ')[0]}
                      </Link>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

export default Especialistas
