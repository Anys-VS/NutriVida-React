import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Campo from '../../components/Campo'
import EstadoCarga from '../../components/EstadoCarga'
import ProgresoPaciente from '../../components/ProgresoPaciente'
import { useSesion } from '../../context/SesionContext'
import { calcularIMC, clasificarIMC } from '../../domain/clinico'
import { useCarga } from '../../hooks/useCarga'
import { cargarFicha, guardarDatosFicha, registrarMedicion } from '../../services/panel'
import { fechaLocalISO } from '../../utils/formato'

const MEDICION_VACIA = { fecha: fechaLocalISO(), peso: '', talla: '', cintura: '', nota: '' }

// Ficha clínica de un paciente (ms-clinico en modo 'api'). Solo la abre el nutricionista asignado o que lo atiende.
// La ruta lleva el correo del paciente: es lo que identifica la ficha en ambos modos.
function FichaPaciente() {
  const { correo } = useParams()
  const { sesion } = useSesion()
  const [version, setVersion] = useState(0)
  const [aviso, setAviso] = useState(null) // mensaje de lo último que se guardó
  const { datos: resultado, cargando, error, reintentar } = useCarga(() => cargarFicha(correo, sesion), [correo, version])

  // Después de guardar se vuelve a cargar la ficha, para mostrar lo que quedó en el servidor.
  if (cargando || !resultado) return <EstadoCarga cargando={cargando} error={error} reintentar={reintentar} que="la ficha" />
  if (!resultado.ok) {
    return (
      <>
        <div role="alert" className="alert alert-danger">{resultado.motivo}</div>
        <Link to="/admin/pacientes">Volver a mis pacientes</Link>
      </>
    )
  }
  return <FormularioFicha key={version} correo={correo} resultado={resultado} sesion={sesion} aviso={aviso}
    alGuardar={(texto) => { setAviso(texto); setVersion((versionAnterior) => versionAnterior + 1) }} />
}

function FormularioFicha({ correo, resultado, sesion, aviso, alGuardar }) {
  const { ficha, paciente } = resultado

  const ultimaTalla = ficha?.mediciones.at(-1)?.talla ?? ''
  const [medicion, setMedicion] = useState({ ...MEDICION_VACIA, talla: ultimaTalla })
  const [erroresMedicion, setErroresMedicion] = useState({})
  const [datos, setDatos] = useState({
    objetivo: ficha?.objetivo ?? '', antecedentes: ficha?.antecedentes ?? '', planTexto: ficha?.planAlimenticio?.texto ?? '',
  })
  const [mensaje, setMensaje] = useState(aviso ? { tipo: 'success', texto: aviso } : null)
  const [guardando, setGuardando] = useState(false)

  const cambiarMedicion = (campo) => (evento) => setMedicion((medicionAnterior) => ({ ...medicionAnterior, [campo]: evento.target.value }))
  const cambiarDatos = (campo) => (evento) => setDatos((datosAnteriores) => ({ ...datosAnteriores, [campo]: evento.target.value }))
  const imcPrevio = calcularIMC(medicion.peso, medicion.talla)

  const terminar = (respuesta, textoOk) => {
    setGuardando(false)
    setErroresMedicion(respuesta.errores ?? {})
    if (!respuesta.ok) return setMensaje({ tipo: 'danger', texto: respuesta.motivo })
    return alGuardar(textoOk)
  }

  const guardarMedicion = async (evento) => {
    evento.preventDefault()
    setGuardando(true)
    terminar(await registrarMedicion(correo, medicion, sesion, resultado.nueva), 'Medición registrada. El paciente ya la ve en "Mi progreso".')
  }

  const guardarDatos = async (evento) => {
    evento.preventDefault()
    setGuardando(true)
    terminar(await guardarDatosFicha(correo, datos, sesion, resultado.nueva), 'Ficha y plan alimenticio guardados.')
  }

  return (
    <div>
      <nav aria-label="breadcrumb" className="mb-2">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/admin/pacientes">Mis pacientes</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Ficha</li>
        </ol>
      </nav>
      <h1 className="titulo-seccion">{paciente ? `${paciente.nombre} ${paciente.apellidos}` : correo}</h1>
      <p className="intro-seccion">
        {paciente ? `RUN ${paciente.run} · ${paciente.correo}` : 'Ficha clínica'}
        {paciente?.fechaNacimiento && <> · nacimiento {new Date(`${paciente.fechaNacimiento}T00:00:00`).toLocaleDateString('es-CL')}</>}
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
              <button type="submit" className="btn btn-nv-primario w-100" disabled={guardando}>Registrar medición</button>
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
              <button type="submit" className="btn btn-nv-primario w-100" disabled={guardando}>Guardar ficha</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FichaPaciente
