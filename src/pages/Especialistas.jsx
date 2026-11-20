import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { citas } from '../data/db'
import { usaApi } from '../config/api'
import { proximosHorarios } from '../domain/citas'
import { useCarga } from '../hooks/useCarga'
import { listarNutricionistas } from '../services/especialistas'
import { buscarProfesionales, describirHorario, iniciales, NOMBRES_DIAS } from '../domain/profesionales'

const formatoDia = new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
const fechaCorta = (fecha) => {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return formatoDia.format(new Date(anio, mes - 1, dia))
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

  // Modo 'api': GET /api/v1/nutricionistas en ms-citas. Modo 'local': catálogo del navegador.
  const { datos, cargando, error, reintentar } = useCarga(listarNutricionistas)
  const nutricionistas = useMemo(() => datos ?? [], [datos])
  const especialidades = [...new Set(nutricionistas.map((profesional) => profesional.especialidad))]
  const resultados = useMemo(
    () => buscarProfesionales(nutricionistas, { texto, especialidad, dia }),
    [nutricionistas, texto, especialidad, dia],
  )
  // En modo api el paciente no ve las citas de otros: los próximos horarios se calculan según la jornada
  // y la disponibilidad real se confirma al reservar (GET /citas/disponibilidad).
  const todasLasCitas = usaApi() ? [] : citas.listar()

  return (
    <section className="seccion">
      <div className="container">
        <h1 className="titulo-seccion">Nuestros especialistas</h1>
        <p className="intro-seccion">
          Busca por nombre, especialidad u objetivo (por ejemplo “deporte”, “vegana” o “niños”) y reserva directo con
          quien prefieras.
        </p>

        <form className="tarjeta-formulario mb-4" role="search" onSubmit={(evento) => evento.preventDefault()}>
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
                {especialidades.map((especialidad) => <option key={especialidad}>{especialidad}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="buscar-dia" className="form-label">Día de atención</label>
              <select id="buscar-dia" className="form-select" value={dia} onChange={cambiar('dia')}>
                <option value="">Cualquier día</option>
                {[1, 2, 3, 4, 5, 6].map((numeroDia) => <option key={numeroDia} value={numeroDia}>{NOMBRES_DIAS[numeroDia]}</option>)}
              </select>
            </div>
          </div>
        </form>

        {cargando && <p className="texto-ayuda" role="status">Cargando especialistas…</p>}
        {error && (
          <div role="alert" className="alert alert-danger d-flex flex-wrap align-items-center gap-2">
            <span>No pudimos cargar los especialistas: {error.message}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={reintentar}>Reintentar</button>
          </div>
        )}
        {!cargando && !error && <p className="texto-ayuda" aria-live="polite">
          {resultados.length === 1 ? '1 especialista encontrado' : `${resultados.length} especialistas encontrados`}
        </p>}

        {cargando || error ? null : resultados.length === 0 ? (
          <div className="tarjeta-formulario text-center">
            <h2 className="h4">No encontramos especialistas con esos filtros</h2>
            <button type="button" className="btn btn-nv-secundario mt-2" onClick={limpiar}>Limpiar filtros</button>
          </div>
        ) : (
          <ul className="row g-4 list-unstyled">
            {resultados.map((profesional) => {
              const libres = proximosHorarios({ profesional: profesional, citas: todasLasCitas })
              return (
                <li key={profesional.id} className="col-md-6">
                  <article className="tarjeta-formulario h-100 d-flex flex-column">
                    <div className="d-flex gap-3 align-items-center mb-2">
                      <div className="avatar-iniciales flex-shrink-0">{iniciales(profesional.nombre)}</div>
                      <div>
                        <h2 className="h5 mb-0">{profesional.nombre}</h2>
                        <p className="especialidad mb-0">{profesional.especialidad}</p>
                      </div>
                    </div>
                    <p className="mb-2">{profesional.resena}</p>
                    <p className="texto-ayuda mb-2">Atiende {describirHorario(profesional)}</p>
                    <p className="mb-1"><strong>Próximos horarios libres</strong></p>
                    {libres.length === 0 ? (
                      <p className="texto-ayuda">Sin horarios libres en las próximas dos semanas.</p>
                    ) : (
                      <ul className="list-unstyled d-flex flex-wrap gap-2 mb-3">
                        {libres.map((horario) => (
                          <li key={`${horario.fecha}-${horario.hora}`}>
                            <span className="badge text-bg-light border">{fechaCorta(horario.fecha)} · {horario.hora}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-auto">
                      <Link to={`/reservar?nutricionista=${encodeURIComponent(profesional.nombre)}`} className="btn btn-nv-primario">
                        Reservar con {profesional.nombre.split(' ')[0]}
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
