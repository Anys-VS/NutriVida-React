import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SesionProvider, useSesion } from './SesionContext'
import RutaProtegida from '../components/RutaProtegida'
import { crearLocalStorageFalso } from '../test/localStorageFalso'
import { guardarTokens, obtenerTokens } from '../auth/almacenTokens'
import { emitirTokens } from '../auth/servidorLocal'
import { ROL } from '../config/reglas'

const paciente = { run: '195556660', correo: 'paciente@gmail.com', nombre: 'Javiera', apellidos: 'Soto Paredes', tipoUsuario: ROL.PACIENTE }

function QuienSoy() {
  const { sesion } = useSesion()
  return <p>{sesion ? `Hola, ${sesion.nombre} (${sesion.tipoUsuario})` : 'Sin sesión'}</p>
}

function dibujar(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <SesionProvider>
        <Routes>
          <Route path="/login" element={<p>Pantalla de login</p>} />
          <Route path="/mis-citas" element={<RutaProtegida permiso="reservas:propias"><QuienSoy /></RutaProtegida>} />
          <Route path="/admin/usuarios" element={<RutaProtegida permiso="usuarios:gestionar"><p>Gestión de usuarios</p></RutaProtegida>} />
        </Routes>
      </SesionProvider>
    </MemoryRouter>,
  )
}

describe('Sesión en el frontend', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', crearLocalStorageFalso())
    sessionStorage.clear()
  })
  afterEach(() => vi.unstubAllGlobals())

  // Prueba 54: al recargar la página la sesión sigue activa (se lee desde el token guardado)
  it('mantiene la sesión después de recargar la página', () => {
    guardarTokens(emitirTokens(paciente))
    dibujar('/mis-citas')
    expect(screen.getByText('Hola, Javiera (Paciente)')).toBeInTheDocument()
  })

  // Prueba 55: con el token de acceso vencido, se recupera la sesión con el token de renovación
  it('recupera la sesión con el token de renovación cuando el de acceso venció', async () => {
    const haceUnaHora = Date.now() - 60 * 60 * 1000
    const { acceso } = emitirTokens(paciente, haceUnaHora) // acceso vencido
    const { renovacion } = emitirTokens(paciente) // renovación vigente
    guardarTokens({ acceso, renovacion })

    dibujar('/mis-citas')
    expect(screen.getByRole('status')).toHaveTextContent('Recuperando tu sesión')
    expect(await screen.findByText('Hola, Javiera (Paciente)')).toBeInTheDocument()
    expect(obtenerTokens().acceso).not.toBe(acceso)
  })

  // Prueba 56: sin sesión se va al login; con sesión pero sin permiso se muestra "No tienes permiso"
  it('manda al login sin sesión y bloquea a un rol sin permiso', () => {
    const { unmount } = dibujar('/mis-citas')
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument()
    unmount()

    guardarTokens(emitirTokens(paciente))
    dibujar('/admin/usuarios')
    expect(screen.getByRole('heading', { name: 'No tienes permiso para ver esta página' })).toBeInTheDocument()
    expect(screen.queryByText('Gestión de usuarios')).not.toBeInTheDocument()
  })
})
