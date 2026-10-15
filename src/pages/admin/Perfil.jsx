import { useState } from 'react'
import Campo from '../../components/Campo'
import { useSesion } from '../../context/SesionContext'
import { usuarios } from '../../data/db'
import { validarContrasena, validarTexto } from '../../domain/validaciones'

function Perfil() {
  const { sesion, iniciar } = useSesion()
  const actual = usuarios.obtener(sesion.run)
  const [valores, setValores] = useState({ nombre: actual?.nombre ?? '', apellidos: actual?.apellidos ?? '', contrasena: '' })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState(null)

  if (!actual) return <p className="mensaje-detalle-error">No encontramos tu cuenta.</p>

  const cambiar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }))

  const guardar = (evento) => {
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
    iniciar(usuarios.actualizar(actual.run, cambios)) // refresca el nombre mostrado en la sesión
    setValores((v) => ({ ...v, contrasena: '' }))
    setMensaje({ tipo: 'success', texto: 'Perfil actualizado correctamente.' })
  }

  return (
    <>
      <h1 className="titulo-seccion">Mi perfil</h1>
      <p className="intro-seccion">Actualiza tus datos de acceso al panel.</p>
      {mensaje && <div role="status" className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}
      <form className="tarjeta-formulario" onSubmit={guardar} noValidate>
        <div className="row">
          <Campo id="perfil-run" etiqueta="RUN" value={actual.run} readOnly claseWrapper="col-md-6 mb-3" />
          <Campo id="perfil-correo" etiqueta="Correo" value={actual.correo} readOnly claseWrapper="col-md-6 mb-3"
            ayuda="El correo y el rol los gestiona un administrador desde Usuarios." />
        </div>
        <div className="row">
          <Campo id="perfil-nombre" etiqueta="Nombre" value={valores.nombre} onChange={cambiar('nombre')}
            error={errores.nombre} claseWrapper="col-md-6 mb-3" maxLength={50} />
          <Campo id="perfil-apellidos" etiqueta="Apellidos" value={valores.apellidos} onChange={cambiar('apellidos')}
            error={errores.apellidos} claseWrapper="col-md-6 mb-3" maxLength={100} />
        </div>
        <Campo id="perfil-contrasena" etiqueta="Nueva contraseña" type="password" value={valores.contrasena}
          onChange={cambiar('contrasena')} error={errores.contrasena} maxLength={10}
          ayuda="Déjala vacía para conservar la actual." />
        <button type="submit" className="btn btn-nv-primario">Guardar perfil</button>
      </form>
    </>
  )
}

export default Perfil
