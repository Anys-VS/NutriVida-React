import { useState } from 'react'
import Campo from '../../components/Campo'
import EstadoCarga from '../../components/EstadoCarga'
import { usaApi } from '../../config/api'
import { validarTexto } from '../../domain/validaciones'
import { useCarga } from '../../hooks/useCarga'
import { guardarCategoria, listarCategorias, listarServiciosAdmin } from '../../services/catalogo'

// Textos de las categorías (ms-catalogo en modo 'api', donde se edita la descripción).
function AdminCategorias() {
  const [version, setVersion] = useState(0)
  const { datos, cargando, error, reintentar } = useCarga(() => Promise.all([listarCategorias(), listarServiciosAdmin()]), [version])
  const [lista, todos] = datos ?? [[], []]
  const [enEdicion, setEnEdicion] = useState(null)
  const [valores, setValores] = useState({ titulo: '', descripcion: '' })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState(null)
  const tituloFijo = usaApi() // en el backend el nombre de la categoría es el tipo de servicio: no se cambia

  const cargar = (categoria) => {
    setEnEdicion(categoria)
    setValores({ titulo: categoria.titulo, descripcion: categoria.descripcion })
    setErrores({})
  }

  const guardar = async (evento) => {
    evento.preventDefault()
    const nuevos = {
      titulo: validarTexto(valores.titulo, { etiqueta: 'El título', maximo: 60 }),
      descripcion: validarTexto(valores.descripcion, { etiqueta: 'La descripción', maximo: 200 }),
    }
    setErrores(nuevos)
    if (Object.values(nuevos).some(Boolean)) return
    const resultado = await guardarCategoria(enEdicion, { titulo: valores.titulo.trim(), descripcion: valores.descripcion.trim() })
    if (!resultado.ok) {
      setMensaje({ tipo: 'danger', texto: resultado.motivo })
      return
    }
    setVersion((versionAnterior) => versionAnterior + 1)
    setEnEdicion(null)
    setMensaje({ tipo: 'success', texto: 'Categoría actualizada correctamente.' })
  }

  return (
    <>
      <h1 className="titulo-seccion">Categorías</h1>
      <p className="intro-seccion">
        Edita los textos que ven los pacientes. No se pueden crear ni eliminar categorías porque las reglas de
        negocio dependen de ellas (planes solo online, talleres con cupos).
      </p>
      {mensaje && <div role="status" className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

      {enEdicion && (
        <form className="tarjeta-formulario mb-4" onSubmit={guardar} noValidate>
          <h2 className="h4 mb-3">Editar categoría</h2>
          <Campo id="admin-categoria-titulo" etiqueta="Título" value={valores.titulo} error={errores.titulo} readOnly={tituloFijo}
            ayuda={tituloFijo ? 'El título identifica el tipo de servicio y no se modifica.' : undefined}
            onChange={(evento) => setValores((anteriores) => ({ ...anteriores, titulo: evento.target.value }))} maxLength={60} />
          <Campo id="admin-categoria-descripcion" etiqueta="Descripción" as="textarea" rows={3} value={valores.descripcion}
            error={errores.descripcion} onChange={(evento) => setValores((anteriores) => ({ ...anteriores, descripcion: evento.target.value }))} maxLength={200} />
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-nv-primario">Guardar categoría</button>
            <button type="button" className="btn btn-nv-secundario" onClick={() => setEnEdicion(null)}>Cancelar edición</button>
          </div>
        </form>
      )}

      <EstadoCarga cargando={cargando && !datos} error={error} reintentar={reintentar} que="las categorías" />
      <div className="table-responsive">
        <table className="table tabla-admin align-middle">
          <caption className="visually-hidden">Categorías de servicios</caption>
          <thead><tr><th>Título</th><th>Tipo de servicio</th><th>Servicios</th><th>Acciones</th></tr></thead>
          <tbody>
            {lista.map((categoria) => (
              <tr key={categoria.slug}>
                <td>{categoria.titulo}<br /><small className="texto-ayuda">{categoria.descripcion}</small></td>
                <td>{categoria.tipo}</td>
                <td>{todos.filter((servicio) => servicio.tipo === categoria.tipo).length}</td>
                <td><button type="button" className="btn btn-sm btn-nv-secundario" onClick={() => cargar(categoria)}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default AdminCategorias
