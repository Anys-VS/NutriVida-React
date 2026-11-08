import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import FormularioLogin from '../components/FormularioLogin'
import { useSesion } from '../context/SesionContext'
import { rutaInicialPorRol } from '../services/auth'
import { iniciarSesion } from '../auth/servicioAuth'

// Solo se aceptan rutas internas para evitar redirecciones a otros sitios.
export function destinoSeguro(desde) {
  return desde && desde.startsWith('/') && !desde.startsWith('//') ? desde : null
}

function Login() {
  const { aviso } = useSesion()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [errorAuth, setErrorAuth] = useState('')
  const desde = params.get('desde')

  // El login pide los tokens (al backend o a la simulación local) y la sesión se arma desde el token.
  const entrar = async ({ correo, contrasena }) => {
    setErrorAuth('')
    const resultado = await iniciarSesion(correo, contrasena)
    if (!resultado.ok) {
      setErrorAuth(resultado.motivo)
      return
    }
    navigate(destinoSeguro(desde) ?? rutaInicialPorRol(resultado.sesion.tipoUsuario), { replace: true })
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
            {aviso && <div role="status" className="alert alert-warning">{aviso}</div>}
            <FormularioLogin onSubmit={entrar} errorExterno={errorAuth} />
            <p className="text-center mt-3 mb-0">
              ¿Aún no tienes cuenta?{' '}
              <Link to={desde ? `/registro?desde=${encodeURIComponent(desde)}` : '/registro'}>Regístrate aquí</Link>
            </p>
            <p className="texto-ayuda text-center mt-2 mb-0">
              Cuentas de demostración: admin@gmail.com · admin123 · paciente@gmail.com · paciente1 ·
              carolina.fuentes@nutrivida.cl · nutri123
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Login
