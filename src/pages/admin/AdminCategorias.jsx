import { useState } from 'react'
import Campo from '../../components/Campo'
import { categorias, servicios } from '../../data/db'
import { validarTexto } from '../../domain/validaciones'

function AdminCategorias() {
  const [lista, setLista] = useState(() => categorias.listar())
  const [enEdicion, setEnEdicion] = useState(null)
  const [valores, setValores] = useState({ titulo: '', descripcion: '' })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState(null)
  const todos = servicios.listar()

  const cargar = (c) => {
    setEnEdicion(c.slug)
    setValores({ titulo: c.titulo, descripcion: c.descripcion })
    setErrores({})
  }

  const guardar = (evento) => {
    evento.preventDefault()
    const nuevos = {
      titulo: validarTexto(valores.titulo, { etiqueta: 'El título', maximo: 60 }),
      descripcion: validarTexto(valores.descripcion, { etiqueta: 'La descripción', maximo: 200 }),
    }
    setErrores(nuevos)
    if (Object.values(nuevos).some(Boolean)) return
    categorias.actualizar(enEdicion, { titulo: valores.titulo.trim(), descripcion: valores.descripcion.trim() })
    setLista(categorias.listar())
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
          <Campo id="admin-categoria-titulo" etiqueta="Título" value={valores.titulo} error={errores.titulo}
            onChange={(e) => setValores((v) => ({ ...v, titulo: e.target.value }))} maxLength={60} />
          <Campo id="admin-categoria-descripcion" etiqueta="Descripción" as="textarea" rows={3} value={valores.descripcion}
            error={errores.descripcion} onChange={(e) => setValores((v) => ({ ...v, descripcion: e.target.value }))} maxLength={200} />
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-nv-primario">Guardar categoría</button>
            <button type="button" className="btn btn-nv-secundario" onClick={() => setEnEdicion(null)}>Cancelar edición</button>
          </div>
        </form>
      )}

      <div className="table-responsive">
        <table className="table tabla-admin align-middle">
          <caption className="visually-hidden">Categorías de servicios</caption>
          <thead><tr><th>Título</th><th>Tipo de servicio</th><th>Servicios</th><th>Acciones</th></tr></thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.slug}>
                <td>{c.titulo}<br /><small className="texto-ayuda">{c.descripcion}</small></td>
                <td>{c.tipo}</td>
                <td>{todos.filter((s) => s.tipo === c.tipo).length}</td>
                <td><button type="button" className="btn btn-sm btn-nv-secundario" onClick={() => cargar(c)}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default AdminCategorias
