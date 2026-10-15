import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import FormularioLogin from '../components/FormularioLogin'
import { useSesion } from '../context/SesionContext'
import { autenticar, rutaInicialPorRol } from '../services/auth'

// Solo se aceptan rutas internas para evitar redirecciones a otros sitios.
export function destinoSeguro(desde) {
  return desde && desde.startsWith('/') && !desde.startsWith('//') ? desde : null
}

function Login() {
  const { iniciar } = useSesion()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [errorAuth, setErrorAuth] = useState('')
  const desde = params.get('desde')

  const entrar = ({ correo, contrasena }) => {
    const usuario = autenticar(correo, contrasena)
    if (!usuario) {
      setErrorAuth('Correo o contraseña incorrectos.')
      return
    }
    iniciar(usuario)
    navigate(destinoSeguro(desde) ?? rutaInicialPorRol(usuario.tipoUsuario), { replace: true })
  }

  return (
    <section className="seccion">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            <h1 className="text-center mb-2">Inicia sesión</h1>
            <p className="text-center intro-seccion mx-auto">
              Accede para revisar tus citas, tu historial y tu plan alimenticio.
            </p>
            <FormularioLogin onSubmit={entrar} errorExterno={errorAuth} />
            <p className="text-center mt-3 mb-0">
              ¿Aún no tienes cuenta?{' '}
              <Link to={desde ? `/registro?desde=${encodeURIComponent(desde)}` : '/registro'}>Regístrate aquí</Link>
            </p>
            <p className="texto-ayuda text-center mt-2 mb-0">
              Administrador de demostración: admin@gmail.com · admin123
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Login
