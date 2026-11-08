import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'
import { SesionProvider } from '../context/SesionContext'
import { CarritoProvider } from '../context/CarritoContext'
import { ROL } from '../config/reglas'
import { crearLocalStorageFalso } from '../test/localStorageFalso'
import { guardarTokens } from '../auth/almacenTokens'
import { emitirTokens } from '../auth/servidorLocal'

// Deja tokens guardados (como si el usuario ya hubiera iniciado sesión) y dibuja el menú.
function dibujarCon(usuario, carrito = []) {
  if (usuario) guardarTokens(emitirTokens(usuario))
  localStorage.setItem('nutrivida_carrito', JSON.stringify(carrito))
  return render(
    <MemoryRouter initialEntries={['/']}>
      <SesionProvider>
        <CarritoProvider>
          <Navbar />
        </CarritoProvider>
      </SesionProvider>
    </MemoryRouter>,
  )
}

const paciente = { run: '195556660', correo: 'paciente@gmail.com', nombre: 'Javiera', apellidos: 'Soto', tipoUsuario: ROL.PACIENTE }
const nutricionista = { run: '151112226', correo: 'carolina.fuentes@nutrivida.cl', nombre: 'Carolina', apellidos: 'Fuentes', tipoUsuario: ROL.NUTRICIONISTA }

describe('Navbar', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', crearLocalStorageFalso())
    sessionStorage.clear()
  })
  afterEach(() => vi.unstubAllGlobals())

  // Prueba 45: un visitante ve "Ingresar", el carrito vacío y el botón para agendar
  it('muestra a un visitante el acceso, el carrito y "Agendar hora"', () => {
    dibujarCon(null)

    expect(screen.getByRole('link', { name: 'Ingresar' })).toHaveAttribute('href', '/login')
    // Hay dos enlaces (barra de celular y menú de escritorio); el CSS muestra uno según el ancho.
    expect(screen.getAllByRole('link', { name: 'Carrito, 0 ítem(s)' })).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Agendar hora' })).toHaveAttribute('href', '/reservar')
  })

  // Prueba 46: el paciente ve su nombre, el contador del carrito y su menú; Escape lo cierra
  it('muestra al paciente su cuenta y el contador, y cierra el menú con Escape', async () => {
    const user = userEvent.setup()
    dibujarCon(paciente, [
      { id: 'a', pacienteCorreo: 'paciente@gmail.com', fechaHora: '2026-11-20T10:00:00' },
      { id: 'b', pacienteCorreo: 'otra@gmail.com', fechaHora: '2026-11-20T11:00:00' },
    ])

    expect(screen.getAllByRole('link', { name: 'Carrito, 1 ítem(s)' })[0]).toHaveTextContent('1')
    expect(screen.queryByRole('link', { name: 'Ingresar' })).not.toBeInTheDocument()

    const botonCuenta = screen.getByRole('button', { name: 'Javiera' })
    await user.click(botonCuenta)
    expect(botonCuenta).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Mis citas' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(botonCuenta).toHaveAttribute('aria-expanded', 'false')
    expect(botonCuenta).toHaveFocus()
  })

  // Prueba 47: restricción por rol: la nutricionista no ve el carrito y su botón lleva a su agenda
  it('oculta el carrito al personal y cambia "Agendar hora" por su agenda', () => {
    dibujarCon(nutricionista)

    expect(screen.queryByRole('link', { name: /Carrito/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Agendar hora' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mi agenda' })).toHaveAttribute('href', '/admin/agenda')
  })
})
