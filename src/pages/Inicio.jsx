import { Link, useNavigate } from 'react-router-dom'
import ListaServicios from '../components/ListaServicios'
import { servicios } from '../data/db'
import { nutricionistas } from '../data/nutricionistas'

const CODIGOS_DESTACADOS = ['CN001', 'PL001', 'EV002', 'TG002']

const BENEFICIOS = [
  {
    titulo: 'Agenda tu hora sin llamar',
    texto: 'Solicita, cambia o cancela tu cita en línea, indicando el nutricionista y el motivo de consulta.',
    icono: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  },
  {
    titulo: 'Tu progreso siempre visible',
    texto: 'Mediciones y planes alimenticios digitales, disponibles entre sesiones desde cualquier dispositivo.',
    icono: <><path d="M3 3v18h18" /><path d="M7 15l4-6 3 4 5-8" /></>,
  },
  {
    titulo: 'Datos clínicos protegidos',
    texto: 'Solo tú y tu nutricionista asignado pueden ver tus mediciones, diagnósticos y avances.',
    icono: <path d="M12 22s8-4.5 8-11V5l-8-3-8 3v6c0 6.5 8 11 8 11z" />,
  },
]

function Inicio() {
  const navigate = useNavigate()
  const destacados = CODIGOS_DESTACADOS.map((codigo) => servicios.obtener(codigo)).filter(Boolean)

  return (
    <>
      <section className="hero-nv">
        <div className="container">
          <div className="row align-items-center g-5">
            <article className="col-lg-6">
              <p className="eyebrow-libre mb-2">Clínica Nutricional NutriVida · Temuco</p>
              <h1>Nutrición con seguimiento real, no con fichas de papel</h1>
              <p className="subcopia">
                Agenda tu hora, revisa tu progreso y conserva tu plan alimenticio siempre a mano. Cuatro
                nutricionistas, un solo lugar para seguir tu proceso completo.
              </p>
              <p className="d-flex flex-wrap gap-3 mt-4">
                <Link to="/reservar" className="btn btn-nv-primario">Agendar mi hora</Link>
                <Link to="/servicios" className="btn btn-nv-secundario">Ver servicios y planes</Link>
              </p>
              <dl className="row mt-5 gx-4 mb-0">
                <div className="col-4 estadistica-hero">
                  <dt className="numero">4</dt>
                  <dd className="etiqueta mb-0">Nutricionistas</dd>
                </div>
                <div className="col-4 estadistica-hero">
                  <dt className="numero">~60</dt>
                  <dd className="etiqueta mb-0">Pacientes / semana</dd>
                </div>
                <div className="col-4 estadistica-hero">
                  <dt className="numero">2016</dt>
                  <dd className="etiqueta mb-0">Año de fundación</dd>
                </div>
              </dl>
            </article>
            <div className="col-lg-6">
              <img src="/imagenes/atencion.svg" alt="Ilustración de nutricionista y paciente" className="img-fluid" />
            </div>
          </div>
        </div>
      </section>

      <section className="seccion seccion-alterna">
        <div className="container">
          <h2 className="titulo-seccion">Lo que cambia cuando tu proceso queda registrado</h2>
          <p className="intro-seccion">
            Hoy la clínica agenda a mano y el 20% de las citas termina en inasistencia. Estos son los problemas
            concretos que buscamos resolver.
          </p>
          <ul className="row g-4 list-unstyled">
            {BENEFICIOS.map((beneficio) => (
              <li key={beneficio.titulo} className="col-md-4">
                <article className="tarjeta-beneficio">
                  <svg className="icono-beneficio" width="30" height="30" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    {beneficio.icono}
                  </svg>
                  <h3>{beneficio.titulo}</h3>
                  <p>{beneficio.texto}</p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="seccion">
        <div className="container">
          <h2 className="titulo-seccion">Servicios más solicitados</h2>
          <p className="intro-seccion">
            Una muestra de nuestro catálogo. Puedes revisar el listado completo, con filtros por tipo de
            servicio, en la sección Servicios.
          </p>
          <ListaServicios
            servicios={destacados}
            destacados
            onReservar={(codigo) => navigate(`/reservar?servicio=${codigo}`)}
          />
          <p className="text-center mt-4">
            <Link to="/servicios" className="btn btn-nv-primario">Ver todos los servicios</Link>
          </p>
        </div>
      </section>

      <section className="seccion seccion-alterna">
        <div className="container">
          <h2 className="titulo-seccion">Conoce a nuestro equipo</h2>
          <p className="intro-seccion">Cuatro nutricionistas, cada uno con su propia especialidad.</p>
          <ul className="row g-4 list-unstyled">
            {nutricionistas.map((nutricionista) => (
              <li key={nutricionista.id} className="col-sm-6 col-lg-3">
                <article className="tarjeta-nutricionista">
                  <div className="avatar-iniciales">{nutricionista.id}</div>
                  <div>
                    <h3>{nutricionista.nombre}</h3>
                    <p className="especialidad">{nutricionista.especialidad}</p>
                    <p className="horario">{nutricionista.horario}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
          <p className="text-center mt-4">
            <Link to="/nosotros" className="btn btn-nv-secundario">Conocer más sobre nosotros</Link>
          </p>
        </div>
      </section>
    </>
  )
}

export default Inicio
