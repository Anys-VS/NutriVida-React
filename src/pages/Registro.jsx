import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Campo from '../components/Campo'
import { useSesion } from '../context/SesionContext'
import { regionesComunas } from '../data/regiones'
import {
  validarRUN, validarCorreo, validarContrasena, validarTexto,
} from '../domain/validaciones'
import { registrarPaciente, rutaInicialPorRol } from '../services/auth'
import { destinoSeguro } from './Login'

const INICIAL = {
  run: '', fechaNacimiento: '', nombre: '', apellidos: '', correo: '',
  region: '', comuna: '', direccion: '', contrasena: '',
}

function validar(v) {
  return {
    run: validarRUN(v.run),
    nombre: validarTexto(v.nombre, { etiqueta: 'El nombre', maximo: 50 }),
    apellidos: validarTexto(v.apellidos, { etiqueta: 'Los apellidos', maximo: 100 }),
    correo: validarCorreo(v.correo),
    region: v.region ? '' : 'Selecciona una región.',
    comuna: v.comuna ? '' : 'Selecciona una comuna.',
    direccion: validarTexto(v.direccion, { etiqueta: 'La dirección', maximo: 300 }),
    contrasena: validarContrasena(v.contrasena),
  }
}

function Registro() {
  const { iniciar } = useSesion()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [valores, setValores] = useState(INICIAL)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')

  const cambiar = (campo) => (evento) => {
    const valor = evento.target.value
    setValores((anterior) => ({ ...anterior, [campo]: valor, ...(campo === 'region' ? { comuna: '' } : {}) }))
  }

  const enviar = (evento) => {
    evento.preventDefault()
    const nuevos = validar(valores)
    setErrores(nuevos)
    if (Object.values(nuevos).some(Boolean)) {
      setErrorGeneral('Revisa los campos marcados antes de continuar.')
      return
    }
    const resultado = registrarPaciente(valores)
    if (!resultado.ok) {
      setErrorGeneral(resultado.motivo)
      return
    }
    iniciar(resultado.usuario)
    navigate(destinoSeguro(params.get('desde')) ?? rutaInicialPorRol(resultado.usuario.tipoUsuario), { replace: true })
  }

  return (
    <section className="seccion">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-9 col-lg-7">
            <h1 className="text-center mb-2">Crea tu cuenta de paciente</h1>
            <p className="text-center intro-seccion mx-auto">
              Regístrate para agendar tus horas y llevar el historial de tus consultas en un solo lugar.
            </p>
            <form className="tarjeta-formulario" onSubmit={enviar} noValidate>
              <div className="row">
                <Campo id="registro-run" etiqueta="RUN" value={valores.run} onChange={cambiar('run')}
                  error={errores.run} claseWrapper="col-md-6 mb-3" placeholder="Ej: 761920839" maxLength={9}
                  ayuda="Sin puntos ni guion, entre 7 y 9 caracteres." />
                <Campo id="registro-fecha" etiqueta="Fecha de nacimiento" type="date" value={valores.fechaNacimiento}
                  onChange={cambiar('fechaNacimiento')} claseWrapper="col-md-6 mb-3" ayuda="Opcional." />
              </div>
              <div className="row">
                <Campo id="registro-nombre" etiqueta="Nombre" value={valores.nombre} onChange={cambiar('nombre')}
                  error={errores.nombre} claseWrapper="col-md-6 mb-3" placeholder="Ingresa tu nombre" maxLength={50} />
                <Campo id="registro-apellidos" etiqueta="Apellidos" value={valores.apellidos} onChange={cambiar('apellidos')}
                  error={errores.apellidos} claseWrapper="col-md-6 mb-3" placeholder="Ingresa tus apellidos" maxLength={100} />
              </div>
              <Campo id="registro-correo" etiqueta="Correo electrónico" type="email" value={valores.correo}
                onChange={cambiar('correo')} error={errores.correo} placeholder="nombre@correo.com" maxLength={100} />
              <div className="row">
                <Campo id="registro-region" etiqueta="Región" as="select" value={valores.region}
                  onChange={cambiar('region')} error={errores.region} claseWrapper="col-md-6 mb-3">
                  <option value="">Selecciona una región</option>
                  {Object.keys(regionesComunas).map((region) => <option key={region} value={region}>{region}</option>)}
                </Campo>
                <Campo id="registro-comuna" etiqueta="Comuna" as="select" value={valores.comuna}
                  onChange={cambiar('comuna')} error={errores.comuna} claseWrapper="col-md-6 mb-3" disabled={!valores.region}>
                  <option value="">Selecciona una comuna</option>
                  {(regionesComunas[valores.region] ?? []).map((comuna) => <option key={comuna} value={comuna}>{comuna}</option>)}
                </Campo>
              </div>
              <Campo id="registro-direccion" etiqueta="Dirección" value={valores.direccion} onChange={cambiar('direccion')}
                error={errores.direccion} placeholder="Calle y número" maxLength={300} />
              <Campo id="registro-contrasena" etiqueta="Contraseña" type="password" value={valores.contrasena}
                onChange={cambiar('contrasena')} error={errores.contrasena} placeholder="Entre 4 y 10 caracteres"
                maxLength={10} ayuda="Debe tener entre 4 y 10 caracteres." />
              {errorGeneral && <div role="alert" className="alert alert-danger">{errorGeneral}</div>}
              <button type="submit" className="btn btn-nv-primario w-100 mt-2">Crear cuenta</button>
              <p className="text-center mt-3 mb-0">¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link></p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Registro
