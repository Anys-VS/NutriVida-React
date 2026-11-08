import { Link } from 'react-router-dom'
import ProgresoPaciente from '../components/ProgresoPaciente'
import { useSesion } from '../context/SesionContext'
import { obtenerFicha } from '../services/clinico'

// El paciente consulta su progreso y su plan alimenticio en cualquier momento (solo lectura).
function MiProgreso() {
  const { sesion } = useSesion()
  const resultado = obtenerFicha(sesion.correo, sesion)
  const ficha = resultado.ok ? resultado.ficha : null

  return (
    <section className="seccion">
      <div className="container">
        <h1 className="titulo-seccion">Mi progreso</h1>
        <p className="intro-seccion">
          Revisa tus mediciones y tu plan alimenticio cuando quieras. Los registra tu nutricionista en cada control.
        </p>
        {!ficha || (ficha.mediciones.length === 0 && !ficha.planAlimenticio) ? (
          <div className="tarjeta-formulario text-center">
            <h2 className="h4">Aún no tienes registros</h2>
            <p className="mb-3">Después de tu primer control verás aquí tu evolución y tu plan alimenticio.</p>
            <Link to="/reservar" className="btn btn-nv-primario">Reservar una hora</Link>
          </div>
        ) : (
          <div className="row g-4">
            <div className="col-lg-8">
              <article className="tarjeta-formulario">
                <h2 className="h4">Mis mediciones</h2>
                {ficha.nutricionista && <p className="texto-ayuda">Nutricionista a cargo: {ficha.nutricionista}</p>}
                {ficha.objetivo && <p><strong>Objetivo:</strong> {ficha.objetivo}</p>}
                <ProgresoPaciente mediciones={ficha.mediciones} />
              </article>
            </div>
            <div className="col-lg-4">
              <article className="tarjeta-formulario">
                <h2 className="h4">Mi plan alimenticio</h2>
                {ficha.planAlimenticio ? (
                  <>
                    <p className="plan-alimenticio">{ficha.planAlimenticio.texto}</p>
                    <p className="texto-ayuda mb-0">
                      Actualizado el {new Date(ficha.planAlimenticio.actualizadoEn).toLocaleDateString('es-CL')} por{' '}
                      {ficha.planAlimenticio.nutricionista}.
                    </p>
                    <button type="button" className="btn btn-nv-secundario btn-sm mt-3" onClick={() => window.print()}>
                      Imprimir plan
                    </button>
                  </>
                ) : (
                  <p className="texto-ayuda">Tu nutricionista aún no publica tu plan.</p>
                )}
              </article>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default MiProgreso
