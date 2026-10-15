import { useMemo } from 'react'
import { citas, planes, servicios } from '../../data/db'
import { calcularReportes } from '../../domain/reportes'
import { formatearPrecioCLP } from '../../utils/formato'

function TablaGrupo({ titulo, primeraColumna, datos }) {
  return (
    <article className="tarjeta-formulario mb-4">
      <h2 className="h4">{titulo}</h2>
      <div className="table-responsive">
        <table className="table tabla-admin align-middle mb-0">
          <caption className="visually-hidden">{titulo}</caption>
          <thead>
            <tr><th>{primeraColumna}</th><th>Citas</th><th>Atendidas</th><th>Inasistencias</th><th>Ingresos</th><th>Reembolsado</th></tr>
          </thead>
          <tbody>
            {Object.keys(datos).length === 0 && <tr><td colSpan={6} className="text-center">Aún no hay datos.</td></tr>}
            {Object.entries(datos).map(([nombre, g]) => (
              <tr key={nombre}>
                <td>{nombre}</td><td>{g.citas}</td><td>{g.atendidas}</td><td>{g.inasistencias}</td>
                <td>{formatearPrecioCLP(g.ingresos)}</td><td>{formatearPrecioCLP(g.reembolsado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}

function Reportes() {
  const r = useMemo(() => calcularReportes({ citas: citas.listar(), servicios: servicios.listar(), planes: planes.listar() }), [])

  return (
    <>
      <h1 className="titulo-seccion">Reportes</h1>
      <p className="intro-seccion">Indicadores para seguir el objetivo del proyecto: reducir las inasistencias.</p>

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-xl-3"><article className="tarjeta-admin-metrica"><span className="metrica-label">Citas totales</span><strong>{r.totalCitas}</strong></article></div>
        <div className="col-md-6 col-xl-3"><article className="tarjeta-admin-metrica"><span className="metrica-label">Atendidas</span><strong>{r.atendidas}</strong></article></div>
        <div className="col-md-6 col-xl-3"><article className="tarjeta-admin-metrica"><span className="metrica-label">Canceladas</span><strong>{r.canceladas}</strong></article></div>
        <div className="col-md-6 col-xl-3">
          <article className="tarjeta-admin-metrica">
            <span className="metrica-label">Tasa de inasistencia</span>
            <strong>{(r.tasaInasistencia * 100).toFixed(1)}%</strong>
            <small className="texto-ayuda">Sobre citas atendidas e inasistencias</small>
          </article>
        </div>
      </div>

      <TablaGrupo titulo="Por categoría" primeraColumna="Categoría" datos={r.porCategoria} />
      <TablaGrupo titulo="Por nutricionista" primeraColumna="Nutricionista" datos={r.porNutricionista} />
    </>
  )
}

export default Reportes
