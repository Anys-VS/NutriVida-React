import { useState } from 'react'
import Campo from '../../components/Campo'
import { servicios } from '../../data/db'
import { TIPO_SERVICIO } from '../../config/reglas'
import { precioFinal } from '../../domain/precios'
import { validarNumero, validarTexto } from '../../domain/validaciones'
import { formatearPrecioCLP } from '../../utils/formato'

const VACIO = {
  codigo: '', tipo: '', nombre: '', duracion: '', modalidad: 'Presencial', profesional: 'Nutricionista',
  precio: '', descuento: '0', sesiones: '', cupos: '', descripcion: '',
}

function validar(v) {
  const esPlan = v.tipo === TIPO_SERVICIO.PLAN
  const esTaller = v.tipo === TIPO_SERVICIO.TALLER
  return {
    codigo: validarTexto(v.codigo, { etiqueta: 'El código', minimo: 3, maximo: 10 }),
    tipo: v.tipo ? '' : 'Selecciona una categoría.',
    nombre: validarTexto(v.nombre, { etiqueta: 'El nombre', maximo: 100 }),
    duracion: validarTexto(v.duracion, { etiqueta: 'La duración', maximo: 30, requerido: false }),
    modalidad: validarTexto(v.modalidad, { etiqueta: 'La modalidad', maximo: 80 }),
    profesional: validarTexto(v.profesional, { etiqueta: 'El profesional', maximo: 100 }),
    precio: validarNumero(v.precio, { etiqueta: 'El precio', entero: true }),
    descuento: validarNumero(v.descuento, { etiqueta: 'El descuento', entero: true, maximo: 100, requerido: false }),
    sesiones: esPlan ? validarNumero(v.sesiones, { etiqueta: 'La cantidad de sesiones', entero: true, minimo: 1, requerido: false }) : '',
    cupos: esTaller ? validarNumero(v.cupos, { etiqueta: 'La cantidad de cupos', entero: true, minimo: 1 }) : '',
    descripcion: validarTexto(v.descripcion, { etiqueta: 'La descripción', maximo: 500, requerido: false }),
  }
}

function detalleDe(s) {
  if (s.tipo === TIPO_SERVICIO.PLAN) return s.sesiones ? `${s.sesiones} sesiones` : 'Sesiones sin definir'
  if (s.tipo === TIPO_SERVICIO.TALLER) return `${s.cupos} cupos`
  return '—'
}

function AdminServicios() {
  const [lista, setLista] = useState(() => servicios.listar())
  const [valores, setValores] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [enEdicion, setEnEdicion] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  const refrescar = () => setLista(servicios.listar())
  const cambiar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }))

  const limpiar = () => {
    setValores(VACIO)
    setErrores({})
    setEnEdicion(null)
  }

  const cargar = (s) => {
    setEnEdicion(s.codigo)
    setErrores({})
    setValores({
      codigo: s.codigo, tipo: s.tipo, nombre: s.nombre, duracion: s.duracion === '—' ? '' : s.duracion ?? '',
      modalidad: s.modalidad ?? '', profesional: s.profesional ?? '', precio: String(s.precio),
      descuento: String(s.descuento ?? 0), sesiones: s.sesiones ? String(s.sesiones) : '',
      cupos: s.cupos ? String(s.cupos) : '', descripcion: s.descripcion ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const guardar = (evento) => {
    evento.preventDefault()
    const nuevos = validar(valores)
    setErrores(nuevos)
    if (Object.values(nuevos).some(Boolean)) {
      setMensaje({ tipo: 'danger', texto: 'Revisa los campos marcados antes de guardar.' })
      return
    }
    const codigo = valores.codigo.trim().toUpperCase()
    if (!enEdicion && servicios.obtener(codigo)) {
      setErrores({ ...nuevos, codigo: 'Ya existe un servicio con ese código.' })
      setMensaje({ tipo: 'danger', texto: 'No se puede guardar un código repetido.' })
      return
    }
    const esPlan = valores.tipo === TIPO_SERVICIO.PLAN
    const esTaller = valores.tipo === TIPO_SERVICIO.TALLER
    const servicio = {
      codigo,
      tipo: valores.tipo,
      nombre: valores.nombre.trim(),
      duracion: valores.duracion.trim() || '—',
      modalidad: valores.modalidad.trim(),
      profesional: valores.profesional.trim(),
      precio: Number(valores.precio),
      descuento: Number(valores.descuento) || 0,
      sesiones: esPlan && valores.sesiones ? Number(valores.sesiones) : undefined,
      cupos: esTaller ? Number(valores.cupos) : undefined,
      descripcion: valores.descripcion.trim(),
    }
    if (enEdicion) servicios.actualizar(enEdicion, servicio)
    else servicios.crear(servicio)
    refrescar()
    limpiar()
    setMensaje({ tipo: 'success', texto: 'Servicio guardado correctamente.' })
  }

  const eliminar = (s) => {
    if (!window.confirm(`¿Eliminar "${s.nombre}" del catálogo?`)) return
    servicios.eliminar(s.codigo)
    refrescar()
    if (enEdicion === s.codigo) limpiar()
    setMensaje({ tipo: 'success', texto: 'Servicio eliminado correctamente.' })
  }

  return (
    <>
      <h1 className="titulo-seccion">Productos y servicios</h1>
      <p className="intro-seccion">Mantén actualizado el catálogo visible para los pacientes.</p>
      {mensaje && <div role="status" className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

      <form className="tarjeta-formulario mb-4" onSubmit={guardar} noValidate>
        <h2 className="h4 mb-3">{enEdicion ? 'Editar servicio o plan' : 'Nuevo servicio o plan'}</h2>
        <div className="row">
          <Campo id="admin-servicio-codigo" etiqueta="Código" value={valores.codigo} onChange={cambiar('codigo')}
            error={errores.codigo} claseWrapper="col-md-4 mb-3" readOnly={Boolean(enEdicion)} maxLength={10} />
          <Campo id="admin-servicio-tipo" etiqueta="Categoría" as="select" value={valores.tipo} onChange={cambiar('tipo')}
            error={errores.tipo} claseWrapper="col-md-4 mb-3">
            <option value="">Selecciona una categoría</option>
            {Object.values(TIPO_SERVICIO).map((tipo) => <option key={tipo}>{tipo}</option>)}
          </Campo>
          <Campo id="admin-servicio-nombre" etiqueta="Nombre" value={valores.nombre} onChange={cambiar('nombre')}
            error={errores.nombre} claseWrapper="col-md-4 mb-3" maxLength={100} />
        </div>
        <div className="row">
          <Campo id="admin-servicio-duracion" etiqueta="Duración" value={valores.duracion} onChange={cambiar('duracion')}
            error={errores.duracion} claseWrapper="col-md-4 mb-3" placeholder="Ej: 30 min" maxLength={30} />
          <Campo id="admin-servicio-modalidad" etiqueta="Modalidad" value={valores.modalidad} onChange={cambiar('modalidad')}
            error={errores.modalidad} claseWrapper="col-md-4 mb-3" maxLength={80} />
          <Campo id="admin-servicio-profesional" etiqueta="Profesional" value={valores.profesional} onChange={cambiar('profesional')}
            error={errores.profesional} claseWrapper="col-md-4 mb-3" maxLength={100} />
        </div>
        <div className="row">
          <Campo id="admin-servicio-precio" etiqueta="Precio (CLP)" type="number" min="0" step="1" value={valores.precio}
            onChange={cambiar('precio')} error={errores.precio} claseWrapper="col-md-4 mb-3" />
          <Campo id="admin-servicio-descuento" etiqueta="Descuento (%)" type="number" min="0" max="100" step="1"
            value={valores.descuento} onChange={cambiar('descuento')} error={errores.descuento} claseWrapper="col-md-4 mb-3"
            ayuda="Mayor a 0 lo muestra con precio rebajado." />
          {valores.tipo === TIPO_SERVICIO.PLAN && (
            <Campo id="admin-servicio-sesiones" etiqueta="Sesiones del plan" type="number" min="1" step="1"
              value={valores.sesiones} onChange={cambiar('sesiones')} error={errores.sesiones} claseWrapper="col-md-4 mb-3"
              ayuda="Obligatoria para poder vender el plan." />
          )}
          {valores.tipo === TIPO_SERVICIO.TALLER && (
            <Campo id="admin-servicio-cupos" etiqueta="Cupos por taller" type="number" min="1" step="1"
              value={valores.cupos} onChange={cambiar('cupos')} error={errores.cupos} claseWrapper="col-md-4 mb-3" />
          )}
        </div>
        <Campo id="admin-servicio-descripcion" etiqueta="Descripción" as="textarea" rows={3} value={valores.descripcion}
          onChange={cambiar('descripcion')} error={errores.descripcion} maxLength={500} />
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-nv-primario">Guardar servicio</button>
          {enEdicion && <button type="button" className="btn btn-nv-secundario" onClick={limpiar}>Cancelar edición</button>}
        </div>
      </form>

      <div className="table-responsive">
        <table className="table tabla-admin align-middle">
          <caption className="visually-hidden">Listado de servicios del catálogo</caption>
          <thead>
            <tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Detalle</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {lista.map((s) => (
              <tr key={s.codigo}>
                <td>{s.codigo}</td>
                <td>{s.nombre}</td>
                <td>{s.tipo}</td>
                <td>
                  {formatearPrecioCLP(precioFinal(s))}
                  {s.descuento > 0 && <small className="texto-ayuda d-block">{s.descuento}% de descuento</small>}
                </td>
                <td className={s.tipo === TIPO_SERVICIO.PLAN && !s.sesiones ? 'text-warning-emphasis' : undefined}>{detalleDe(s)}</td>
                <td>
                  <div className="d-flex gap-2 flex-wrap">
                    <button type="button" className="btn btn-sm btn-nv-secundario" onClick={() => cargar(s)}>Editar</button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => eliminar(s)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default AdminServicios
