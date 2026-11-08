import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Campo from '../../components/Campo'
import ProgresoPaciente from '../../components/ProgresoPaciente'
import { useSesion } from '../../context/SesionContext'
import { usuarios } from '../../data/db'
import { calcularIMC, clasificarIMC } from '../../domain/clinico'
import { guardarDatosFicha, obtenerFicha, registrarMedicion } from '../../services/clinico'
import { fechaLocalISO } from '../../utils/formato'

const MEDICION_VACIA = { fecha: fechaLocalISO(), peso: '', talla: '', cintura: '', nota: '' }

// Ficha clínica de un paciente. Solo la abre el nutricionista asignado o que lo atiende.
function FichaPaciente() {
  const { run } = useParams()
  const { sesion } = useSesion()
  const paciente = usuarios.obtener(run)
  const [version, setVersion] = useState(0)
  const resultado = paciente ? obtenerFicha(paciente.correo, sesion) : { ok: false, motivo: 'El paciente no existe.' }
  const ficha = resultado.ok ? resultado.ficha : null

  const ultimaTalla = ficha?.mediciones.at(-1)?.talla ?? ''
  const [medicion, setMedicion] = useState({ ...MEDICION_VACIA, talla: ultimaTalla })
  const [erroresMedicion, setErroresMedicion] = useState({})
  const [datos, setDatos] = useState({
    objetivo: ficha?.objetivo ?? '', antecedentes: ficha?.antecedentes ?? '', planTexto: ficha?.planAlimenticio?.texto ?? '',
  })
  const [mensaje, setMensaje] = useState(null)

  if (!resultado.ok) {
    return (
      <>
        <div role="alert" className="alert alert-danger">{resultado.motivo}</div>
        <Link to="/admin/pacientes">Volver a mis pacientes</Link>
      </>
    )
  }

  const cambiarMedicion = (campo) => (e) => setMedicion((m) => ({ ...m, [campo]: e.target.value }))
  const cambiarDatos = (campo) => (e) => setDatos((d) => ({ ...d, [campo]: e.target.value }))
  const imcPrevio = calcularIMC(medicion.peso, medicion.talla)

  const guardarMedicion = (evento) => {
    evento.preventDefault()
    const r = registrarMedicion(paciente.correo, medicion, sesion)
    setErroresMedicion(r.errores ?? {})
    setMensaje(r.ok ? { tipo: 'success', texto: 'Medición registrada. El paciente ya la ve en "Mi progreso".' } : { tipo: 'danger', texto: r.motivo })
    if (r.ok) {
      setMedicion({ ...MEDICION_VACIA, talla: medicion.talla })
      setVersion((v) => v + 1)
    }
  }

  const guardarDatos = (evento) => {
    evento.preventDefault()
    const r = guardarDatosFicha(paciente.correo, datos, sesion)
    setMensaje(r.ok ? { tipo: 'success', texto: 'Ficha y plan alimenticio guardados.' } : { tipo: 'danger', texto: r.motivo })
    if (r.ok) setVersion((v) => v + 1)
  }

  return (
    <div key={version}>
      <nav aria-label="breadcrumb" className="mb-2">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/admin/pacientes">Mis pacientes</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Ficha</li>
        </ol>
      </nav>
      <h1 className="titulo-seccion">{paciente.nombre} {paciente.apellidos}</h1>
      <p className="intro-seccion">
        RUN {paciente.run} · {paciente.correo}
        {paciente.fechaNacimiento && <> · nacimiento {new Date(`${paciente.fechaNacimiento}T00:00:00`).toLocaleDateString('es-CL')}</>}
        {ficha.nutricionista && <> · a cargo de {ficha.nutricionista}</>}
      </p>
      {mensaje && <div role="status" className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

      <article className="tarjeta-formulario mb-4">
        <h2 className="h4">Progreso</h2>
        <ProgresoPaciente mediciones={ficha.mediciones} />
      </article>

      {resultado.puedeEditar && (
        <div className="row g-4">
          <div className="col-xl-5">
            <form className="tarjeta-formulario" onSubmit={guardarMedicion} noValidate>
              <h2 className="h4">Nueva medición</h2>
              <div className="row">
                <Campo id="med-fecha" etiqueta="Fecha" type="date" max={fechaLocalISO()} value={medicion.fecha}
                  onChange={cambiarMedicion('fecha')} error={erroresMedicion.fecha} claseWrapper="col-6 mb-3" />
                <Campo id="med-peso" etiqueta="Peso (kg)" type="number" step="0.1" value={medicion.peso}
                  onChange={cambiarMedicion('peso')} error={erroresMedicion.peso} claseWrapper="col-6 mb-3" />
                <Campo id="med-talla" etiqueta="Talla (cm)" type="number" value={medicion.talla}
                  onChange={cambiarMedicion('talla')} error={erroresMedicion.talla} claseWrapper="col-6 mb-3" />
                <Campo id="med-cintura" etiqueta="Cintura (cm)" type="number" step="0.5" value={medicion.cintura}
                  onChange={cambiarMedicion('cintura')} error={erroresMedicion.cintura} claseWrapper="col-6 mb-3" />
              </div>
              {imcPrevio && <p className="texto-ayuda">IMC calculado: {imcPrevio} ({clasificarIMC(imcPrevio)})</p>}
              <Campo id="med-nota" etiqueta="Nota del control" as="textarea" rows={2} maxLength={300}
                value={medicion.nota} onChange={cambiarMedicion('nota')} />
              <button type="submit" className="btn btn-nv-primario w-100">Registrar medición</button>
            </form>
          </div>
          <div className="col-xl-7">
            <form className="tarjeta-formulario" onSubmit={guardarDatos} noValidate>
              <h2 className="h4">Objetivo, antecedentes y plan alimenticio</h2>
              <Campo id="ficha-objetivo" etiqueta="Objetivo" as="textarea" rows={2} maxLength={300}
                value={datos.objetivo} onChange={cambiarDatos('objetivo')} />
              <Campo id="ficha-antecedentes" etiqueta="Antecedentes y derivación médica" as="textarea" rows={2} maxLength={500}
                value={datos.antecedentes} onChange={cambiarDatos('antecedentes')} />
              <Campo id="ficha-plan" etiqueta="Plan alimenticio (lo ve el paciente)" as="textarea" rows={7} maxLength={2000}
                value={datos.planTexto} onChange={cambiarDatos('planTexto')} />
              <button type="submit" className="btn btn-nv-primario w-100">Guardar ficha</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FichaPaciente
