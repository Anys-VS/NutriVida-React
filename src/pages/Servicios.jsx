import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ListaServicios from '../components/ListaServicios'
import { servicios } from '../data/db'

const FILTROS = [
  { tipo: 'Todos', etiqueta: 'Todos' },
  { tipo: 'Consulta', etiqueta: 'Consultas' },
  { tipo: 'Plan especializado', etiqueta: 'Planes especializados' },
  { tipo: 'Evaluación', etiqueta: 'Evaluaciones' },
  { tipo: 'Taller grupal', etiqueta: 'Talleres grupales' },
]

function Servicios() {
  const navigate = useNavigate()
  const [tipo, setTipo] = useState('Todos')
  const todos = servicios.listar()
  const visibles = tipo === 'Todos' ? todos : todos.filter((servicio) => servicio.tipo === tipo)

  return (
    <section className="seccion">
      <div className="container">
        <h1 className="titulo-seccion">Servicios y planes</h1>
        <p className="intro-seccion">
          Filtra por tipo de servicio, revisa el detalle y reserva tu hora directamente.{' '}
          <Link to="/categorias">Explorar por categoría</Link>
        </p>
        <div className="d-flex flex-wrap gap-2 mb-4" role="group" aria-label="Filtrar servicios por categoría">
          {FILTROS.map((filtro) => (
            <button
              key={filtro.tipo}
              type="button"
              className={`filtro-categoria${tipo === filtro.tipo ? ' activo' : ''}`}
              onClick={() => setTipo(filtro.tipo)}
            >
              {filtro.etiqueta}
            </button>
          ))}
        </div>
        <ListaServicios servicios={visibles} onReservar={(codigo) => navigate(`/reservar?servicio=${codigo}`)} />
      </div>
    </section>
  )
}

export default Servicios
