import { calcularIMC, clasificarIMC, ordenarPorFecha, resumenProgreso } from '../domain/clinico'

const fechaCorta = (iso) => {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: '2-digit' })
}
const signo = (valor, unidad) => (valor === null ? '—' : `${valor > 0 ? '+' : ''}${valor} ${unidad}`)

// Gráfico de línea simple (SVG) con la evolución del peso.
function GraficoPeso({ mediciones }) {
  const puntos = ordenarPorFecha(mediciones)
  if (puntos.length < 2) return null
  const ancho = 560
  const alto = 180
  const margen = { x: 44, y: 24 }
  const pesos = puntos.map((punto) => punto.peso)
  const minimo = Math.floor(Math.min(...pesos) - 1)
  const maximo = Math.ceil(Math.max(...pesos) + 1)
  const posicionX = (indice) => margen.x + (indice * (ancho - margen.x * 2)) / (puntos.length - 1)
  const posicionY = (peso) => alto - margen.y - ((peso - minimo) * (alto - margen.y * 2)) / (maximo - minimo)
  const linea = puntos.map((punto, indice) => `${posicionX(indice)},${posicionY(punto.peso)}`).join(' ')

  return (
    <figure className="mb-3">
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="grafico-progreso" role="img"
        aria-label={`Evolución del peso: de ${puntos[0].peso} kg a ${puntos.at(-1).peso} kg`}>
        <line x1={margen.x} y1={alto - margen.y} x2={ancho - margen.x} y2={alto - margen.y} className="eje" />
        <text x={margen.x - 8} y={posicionY(maximo)} className="etiqueta-eje" textAnchor="end">{maximo}</text>
        <text x={margen.x - 8} y={posicionY(minimo)} className="etiqueta-eje" textAnchor="end">{minimo}</text>
        <polyline points={linea} className="linea" />
        {puntos.map((punto, indice) => (
          <g key={punto.id}>
            <circle cx={posicionX(indice)} cy={posicionY(punto.peso)} r="5" className="punto" />
            <text x={posicionX(indice)} y={posicionY(punto.peso) - 10} textAnchor="middle" className="valor">{punto.peso}</text>
            <text x={posicionX(indice)} y={alto - 6} textAnchor="middle" className="etiqueta-eje">{fechaCorta(punto.fecha)}</text>
          </g>
        ))}
      </svg>
      <figcaption className="texto-ayuda">Peso en kilos por control.</figcaption>
    </figure>
  )
}

// Resumen, gráfico e historial de mediciones. Lo usan el paciente y su nutricionista.
function ProgresoPaciente({ mediciones }) {
  const resumen = resumenProgreso(mediciones)
  if (!resumen) return <p className="texto-ayuda">Aún no hay mediciones registradas.</p>

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3"><div className="tarjeta-metrica"><span>Peso actual</span><strong>{resumen.ultima.peso} kg</strong></div></div>
        <div className="col-6 col-md-3"><div className="tarjeta-metrica"><span>Variación de peso</span><strong>{signo(resumen.variacionPeso, 'kg')}</strong></div></div>
        <div className="col-6 col-md-3"><div className="tarjeta-metrica"><span>Variación de cintura</span><strong>{signo(resumen.variacionCintura, 'cm')}</strong></div></div>
        <div className="col-6 col-md-3"><div className="tarjeta-metrica"><span>IMC actual</span><strong>{resumen.imcActual}</strong><small>{clasificarIMC(resumen.imcActual)}</small></div></div>
      </div>
      <GraficoPeso mediciones={mediciones} />
      <div className="table-responsive">
        <table className="table tabla-admin align-middle">
          <caption className="visually-hidden">Historial de mediciones</caption>
          <thead>
            <tr><th>Fecha</th><th>Peso</th><th>Talla</th><th>Cintura</th><th>IMC</th><th>Nota</th><th>Registró</th></tr>
          </thead>
          <tbody>
            {ordenarPorFecha(mediciones).reverse().map((medicion) => (
              <tr key={medicion.id}>
                <td>{fechaCorta(medicion.fecha)}</td>
                <td>{medicion.peso} kg</td>
                <td>{medicion.talla} cm</td>
                <td>{medicion.cintura ? `${medicion.cintura} cm` : '—'}</td>
                <td>{medicion.imc ?? calcularIMC(medicion.peso, medicion.talla)}</td>
                <td>{medicion.nota || '—'}</td>
                <td>{medicion.nutricionista}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default ProgresoPaciente
