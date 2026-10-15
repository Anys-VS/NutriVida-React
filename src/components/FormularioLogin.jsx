import { useState } from 'react'
import { validarCorreo, validarContrasena } from '../domain/validaciones'
import Campo from './Campo'

function FormularioLogin({ onSubmit, errorExterno = '' }) {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')

  const manejarEnvio = (evento) => {
    evento.preventDefault()
    const mensaje = validarCorreo(correo) || validarContrasena(contrasena)
    if (mensaje) {
      setError(mensaje)
      return
    }
    setError('')
    onSubmit({ correo: correo.trim(), contrasena })
  }

  const mensajeVisible = error || errorExterno

  return (
    <form className="tarjeta-formulario" onSubmit={manejarEnvio} noValidate>
      <Campo id="login-correo" etiqueta="Correo electrónico" type="email" value={correo}
        onChange={(evento) => setCorreo(evento.target.value)} placeholder="nombre@correo.com" maxLength={100} />
      <Campo id="login-contrasena" etiqueta="Contraseña" type="password" value={contrasena}
        onChange={(evento) => setContrasena(evento.target.value)} placeholder="Entre 4 y 10 caracteres" maxLength={10} />
      {mensajeVisible && (
        <div role="alert" className="alert alert-danger">
          {mensajeVisible}
        </div>
      )}
      <button type="submit" className="btn btn-nv-primario w-100 mt-2">Ingresar</button>
    </form>
  )
}

export default FormularioLogin
