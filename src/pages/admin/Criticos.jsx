import EstadoCarga from '../../components/EstadoCarga'
import { REGLAS } from '../../config/reglas'
import { talleresCriticos } from '../../domain/criticos'
import { useCarga } from '../../hooks/useCarga'
import { cargarDatosAdministracion } from '../../services/panel'
import { formatearFechaHora } from '../../utils/formato'

// Talleres próximos con pocos cupos, calculados con las citas de ms-citas y los cupos de ms-catalogo.
function Criticos() {
  const { datos, cargando, error, reintentar } = useCarga(cargarDatosAdministracion)
  if (!datos) return <EstadoCarga cargando={cargando} error={error} reintentar={reintentar} que="los cupos" />
  const lista = talleresCriticos({ citas: datos.citas, servicios: datos.servicios })

  return (
    <>
      <h1 className="titulo-seccion">Cupos críticos</h1>
      <p className="intro-seccion">
        Talleres próximos con {REGLAS.UMBRAL_CUPOS_CRITICOS} cupos o menos disponibles.
      </p>
      <div className="table-responsive">
        <table className="table tabla-admin align-middle">
          <caption className="visually-hidden">Talleres con cupos críticos</caption>
          <thead><tr><th>Taller</th><th>Fecha y hora</th><th>Ocupados</th><th>Cupos restantes</th></tr></thead>
          <tbody>
            {lista.length === 0 && <tr><td colSpan={4} className="text-center">No hay talleres con cupos críticos.</td></tr>}
            {lista.map((taller) => (
              <tr key={`${taller.codigoServicio}${taller.fechaHora}`}>
                <td>{taller.nombre}</td>
                <td>{formatearFechaHora(taller.fechaHora)}</td>
                <td>{taller.ocupados} de {taller.cupos}</td>
                <td><span className={`badge text-bg-${taller.restantes === 0 ? 'danger' : 'warning'}`}>
                  {taller.restantes === 0 ? 'Sin cupos' : `${taller.restantes} restante(s)`}
                </span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Criticos
