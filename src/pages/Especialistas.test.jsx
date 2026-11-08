import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Especialistas from './Especialistas'
import { crearLocalStorageFalso } from '../test/localStorageFalso'

describe('Especialistas', () => {
  beforeEach(() => vi.stubGlobal('localStorage', crearLocalStorageFalso()))
  afterEach(() => vi.unstubAllGlobals())

  // Prueba 44: el buscador filtra mientras se escribe y enlaza a la reserva con ese profesional
  it('filtra por texto y ofrece reservar con el especialista encontrado', async () => {
    render(<MemoryRouter initialEntries={['/especialistas']}><Especialistas /></MemoryRouter>)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4)

    await userEvent.type(screen.getByLabelText('Buscar'), 'ninos')

    expect(screen.getByText('1 especialista encontrado')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Felipe Araya' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reservar con Felipe' })).toHaveAttribute('href', '/reservar?nutricionista=Felipe%20Araya')
  })
})
