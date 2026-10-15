import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ListaServicios from './ListaServicios'
import { catalogoServicios } from '../data/catalogo'

describe('ListaServicios', () => {
  // Prueba 7: renderizado
  it('renderiza una tarjeta por cada servicio recibido', () => {
    const servicios = catalogoServicios.slice(0, 5)

    render(
      <MemoryRouter>
        <ListaServicios servicios={servicios} onReservar={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getAllByRole('article')).toHaveLength(5)
    servicios.forEach((servicio) => {
      expect(screen.getByRole('heading', { name: servicio.nombre })).toBeInTheDocument()
    })
  })
})
