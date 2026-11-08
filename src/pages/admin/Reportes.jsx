import { useMemo, useState } from 'react'
import { citas, planes, servicios } from '../../data/db'
import { calcularReportes } from '../../domain/reportes'
import { fechaLocalISO, formatearPrecioCLP } from '../../utils/formato'

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

// Atajos de período más usados por la clínica.
function rangoDe(atajo, hoy = new Date()) {
  const iso = fechaLocalISO
  if (atajo === 'mes') return { desde: iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: iso(hoy) }
  if (atajo === '30') return { desde: iso(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 29)), hasta: iso(hoy) }
  if (atajo === 'anio') return { desde: iso(new Date(hoy.getFullYear(), 0, 1)), hasta: iso(hoy) }
  return { desde: '', hasta: '' }
}

function Reportes() {
  const [periodo, setPeriodo] = useState({ desde: '', hasta: '' })
  const periodoInvalido = Boolean(periodo.desde && periodo.hasta && periodo.desde > periodo.hasta)
  const r = useMemo(
    () => calcularReportes({ citas: citas.listar(), servicios: servicios.listar(), planes: planes.listar(), periodo: periodoInvalido ? {} : periodo }),
    [periodo, periodoInvalido],
  )
  const cambiar = (campo) => (e) => setPeriodo((p) => ({ ...p, [campo]: e.target.value }))

  return (
    <>
      <h1 className="titulo-seccion">Reportes</h1>
      <p className="intro-seccion">Indicadores para seguir el objetivo del proyecto: reducir las inasistencias.</p>

      <form className="tarjeta-formulario mb-4" onSubmit={(e) => e.preventDefault()} aria-label="Período del reporte">
        <div className="row g-3 align-items-end">
          <div className="col-sm-6 col-lg-3">
            <label htmlFor="reporte-desde" className="form-label">Desde</label>
            <input id="reporte-desde" type="date" className="form-control" value={periodo.desde} onChange={cambiar('desde')} />
          </div>
          <div className="col-sm-6 col-lg-3">
            <label htmlFor="reporte-hasta" className="form-label">Hasta</label>
            <input id="reporte-hasta" type="date" className="form-control" value={periodo.hasta} onChange={cambiar('hasta')}
              aria-invalid={periodoInvalido} />
          </div>
          <div className="col-lg-6 d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm btn-nv-secundario" onClick={() => setPeriodo(rangoDe('mes'))}>Este mes</button>
            <button type="button" className="btn btn-sm btn-nv-secundario" onClick={() => setPeriodo(rangoDe('30'))}>Últimos 30 días</button>
            <button type="button" className="btn btn-sm btn-nv-secundario" onClick={() => setPeriodo(rangoDe('anio'))}>Este año</button>
            <button type="button" className="btn btn-sm btn-link" onClick={() => setPeriodo(rangoDe('todo'))}>Todo</button>
          </div>
        </div>
        <p className="texto-ayuda mt-2 mb-0" role="status">
          {periodoInvalido
            ? 'La fecha "Desde" debe ser anterior a "Hasta". Se muestran todos los datos.'
            : periodo.desde || periodo.hasta
              ? `Mostrando ${periodo.desde ? `desde el ${periodo.desde.split('-').reverse().join('-')}` : ''}${periodo.desde && periodo.hasta ? ' ' : ''}${periodo.hasta ? `hasta el ${periodo.hasta.split('-').reverse().join('-')}` : ''}.`
              : 'Mostrando todo el historial.'}
        </p>
      </form>

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
