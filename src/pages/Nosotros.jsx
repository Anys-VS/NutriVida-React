import { nutricionistas } from '../data/nutricionistas'

const DETALLE = {
  CF: 'Lidera los planes de pérdida de peso y control de patologías metabólicas asociadas a la alimentación.',
  RS: 'Trabaja con deportistas amateur y federados, ajustando la ingesta según carga de entrenamiento.',
  DM: 'Se especializa en planes basados en plantas y en el acompañamiento de trastornos de conducta alimentaria.',
  FA: 'Atiende a niños y adolescentes, coordinando el plan alimenticio con padres y apoderados.',
}

function Nosotros() {
  return (
    <>
      <section className="seccion">
        <div className="container">
          <div className="row justify-content-center text-center mb-5">
            <div className="col-lg-8">
              <h1>Diez años acompañando procesos, no solo recetando dietas</h1>
              <p className="intro-seccion mx-auto">
                NutriVida nació en Temuco en 2016 como un consultorio de una sola nutricionista. Hoy somos un equipo
                de cuatro profesionales que atendemos cerca de 60 pacientes por semana, y seguimos creciendo.
              </p>
            </div>
          </div>
          <div className="row g-4 align-items-start">
            <article className="col-md-6">
              <h2>Por qué existimos</h2>
              <p>La mayoría de nuestros pacientes llega después de intentar dietas genéricas que no consideraron su historial ni su rutina real. Nuestro trabajo empieza con una evaluación completa, no con una tabla de calorías.</p>
              <p>Hasta ahora, gran parte de nuestra gestión —agenda, fichas y seguimiento— se hacía en papel o en planillas sueltas. Esta plataforma es el primer paso para que cada paciente tenga su información siempre disponible y ordenada.</p>
            </article>
            <article className="col-md-6">
              <h2>Cómo trabajamos</h2>
              <p>Cada paciente pasa primero por una evaluación antropométrica y una conversación sobre hábitos, rutina y objetivos. Con eso diseñamos un plan realista, que se ajusta en cada control según cómo va avanzando el proceso.</p>
              <p>Trabajamos con consultas individuales, planes de varios meses y talleres grupales para quienes prefieren aprender en comunidad.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="seccion seccion-alterna">
        <div className="container">
          <h2 className="titulo-seccion">Nuestro equipo</h2>
          <p className="intro-seccion">Cuatro nutricionistas, cada uno con su propia área de especialización y horario de atención.</p>
          <ul className="row g-4 list-unstyled">
            {nutricionistas.map((n) => (
              <li key={n.id} className="col-md-6">
                <article className="tarjeta-nutricionista">
                  <div className="avatar-iniciales">{n.id}</div>
                  <div>
                    <h3>{n.nombre}</h3>
                    <p className="especialidad">{n.especialidad}</p>
                    <p>{DETALLE[n.id]}</p>
                    <p className="horario">Atiende {n.horario}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}

export default Nosotros
