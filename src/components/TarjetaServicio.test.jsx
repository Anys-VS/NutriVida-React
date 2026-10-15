import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TarjetaServicio from './TarjetaServicio'
import { catalogoServicios } from '../data/catalogo'

describe('TarjetaServicio', () => {
  // Prueba 9: props y eventos
  it('muestra los datos recibidos por props y llama a onReservar con el código', async () => {
    const servicio = catalogoServicios[0]
    const onReservar = vi.fn()

    render(
      <MemoryRouter>
        <TarjetaServicio servicio={servicio} onReservar={onReservar} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: servicio.nombre })).toBeInTheDocument()
    expect(screen.getByText('$35.000')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))

    expect(onReservar).toHaveBeenCalledTimes(1)
    expect(onReservar).toHaveBeenCalledWith('CN001')
  })
})
