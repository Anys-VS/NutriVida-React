import { useState } from 'react'
import Campo from '../../components/Campo'
import EstadoCarga from '../../components/EstadoCarga'
import { useSesion } from '../../context/SesionContext'
import { validarContrasena, validarTexto } from '../../domain/validaciones'
import { useCarga } from '../../hooks/useCarga'
import { cargarPerfil, guardarPerfil } from '../../services/administracion'

// Datos de la cuenta de la sesión (GET /auth/me en modo 'api').
function Perfil() {
  const { sesion } = useSesion()
  const { datos, cargando, error, reintentar } = useCarga(() => cargarPerfil(sesion))
  if (!datos) return <EstadoCarga cargando={cargando} error={error} reintentar={reintentar} que="tu perfil" />
  return <FormularioPerfil actual={datos.usuario} editable={datos.editable} />
}

function FormularioPerfil({ actual, editable }) {
  const { renovar } = useSesion()
  const [valores, setValores] = useState({ nombre: actual?.nombre ?? '', apellidos: actual?.apellidos ?? '', contrasena: '' })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState(null)

  if (!actual) return <p className="mensaje-detalle-error">No encontramos tu cuenta.</p>

  const cambiar = (campo) => (evento) => setValores((anteriores) => ({ ...anteriores, [campo]: evento.target.value }))

  const guardar = async (evento) => {
    evento.preventDefault()
    const nuevos = {
      nombre: validarTexto(valores.nombre, { etiqueta: 'El nombre', maximo: 50 }),
      apellidos: validarTexto(valores.apellidos, { etiqueta: 'Los apellidos', maximo: 100 }),
      contrasena: valores.contrasena ? validarContrasena(valores.contrasena) : '',
    }
    setErrores(nuevos)
    if (Object.values(nuevos).some(Boolean)) return
    const cambios = { nombre: valores.nombre.trim(), apellidos: valores.apellidos.trim() }
    if (valores.contrasena) cambios.contrasena = valores.contrasena
    const resultado = await guardarPerfil(actual, cambios)
    if (!resultado.ok) {
      setErrores(resultado.errores ?? {})
      setMensaje({ tipo: 'danger', texto: resultado.motivo })
      return
    }
    await renovar() // el token nuevo trae el nombre actualizado que se muestra en la sesión
    setValores((anteriores) => ({ ...anteriores, contrasena: '' }))
    setMensaje({ tipo: 'success', texto: 'Perfil actualizado correctamente.' })
  }

  return (
    <>
      <h1 className="titulo-seccion">Mi perfil</h1>
      <p className="intro-seccion">
        {editable ? 'Actualiza tus datos de acceso al panel.' : 'Tus datos de acceso. Para cambiarlos, pídeselo a un administrador.'}
      </p>
      {mensaje && <div role="status" className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}
      <form className="tarjeta-formulario" onSubmit={guardar} noValidate>
        <div className="row">
          <Campo id="perfil-run" etiqueta="RUN" value={actual.run} readOnly claseWrapper="col-md-6 mb-3" />
          <Campo id="perfil-correo" etiqueta="Correo" value={actual.correo} readOnly claseWrapper="col-md-6 mb-3"
            ayuda="El correo y el rol los gestiona un administrador desde Usuarios." />
        </div>
        <div className="row">
          <Campo id="perfil-nombre" etiqueta="Nombre" value={valores.nombre} onChange={cambiar('nombre')} readOnly={!editable}
            error={errores.nombre} claseWrapper="col-md-6 mb-3" maxLength={50} />
          <Campo id="perfil-apellidos" etiqueta="Apellidos" value={valores.apellidos} onChange={cambiar('apellidos')} readOnly={!editable}
            error={errores.apellidos} claseWrapper="col-md-6 mb-3" maxLength={100} />
        </div>
        {editable && (
          <>
            <Campo id="perfil-contrasena" etiqueta="Nueva contraseña" type="password" value={valores.contrasena}
              onChange={cambiar('contrasena')} error={errores.contrasena} maxLength={10}
              ayuda="Déjala vacía para conservar la actual." />
            <button type="submit" className="btn btn-nv-primario">Guardar perfil</button>
          </>
        )}
      </form>
    </>
  )
}

export default Perfil
