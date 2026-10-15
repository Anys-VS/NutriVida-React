import { useState } from 'react'
import { Link } from 'react-router-dom'
import Campo from '../../components/Campo'
import { useSesion } from '../../context/SesionContext'
import { usuarios } from '../../data/db'
import { regionesComunas } from '../../data/regiones'
import { ROL } from '../../config/reglas'
import { validarContrasena, validarCorreo, validarRUN, validarTexto } from '../../domain/validaciones'
import { eliminarUsuario, guardarUsuario } from '../../services/usuarios'

const VACIO = {
  run: '', nombre: '', apellidos: '', correo: '', fechaNacimiento: '', tipoUsuario: '',
  region: '', comuna: '', direccion: '', contrasena: '',
}

function validar(v, enEdicion) {
  return {
    run: enEdicion ? '' : validarRUN(v.run),
    nombre: validarTexto(v.nombre, { etiqueta: 'El nombre', maximo: 50 }),
    apellidos: validarTexto(v.apellidos, { etiqueta: 'Los apellidos', maximo: 100 }),
    correo: validarCorreo(v.correo),
    tipoUsuario: v.tipoUsuario ? '' : 'Selecciona un tipo de usuario.',
    region: v.region ? '' : 'Selecciona una región.',
    comuna: v.comuna ? '' : 'Selecciona una comuna.',
    direccion: validarTexto(v.direccion, { etiqueta: 'La dirección', maximo: 300 }),
    // Al editar, la contraseña vacía conserva la actual.
    contrasena: enEdicion && !v.contrasena ? '' : validarContrasena(v.contrasena),
  }
}

function AdminUsuarios() {
  const { sesion } = useSesion()
  const [lista, setLista] = useState(() => usuarios.listar())
  const [valores, setValores] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [enEdicion, setEnEdicion] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  const refrescar = () => setLista(usuarios.listar())

  const cambiar = (campo) => (e) => {
    const valor = e.target.value
    setValores((v) => ({ ...v, [campo]: valor, ...(campo === 'region' ? { comuna: '' } : {}) }))
  }

  const limpiar = () => {
    setValores(VACIO)
    setErrores({})
    setEnEdicion(null)
  }

  const cargar = (u) => {
    setEnEdicion(u.run)
    setErrores({})
    setValores({
      run: u.run, nombre: u.nombre, apellidos: u.apellidos, correo: u.correo, fechaNacimiento: u.fechaNacimiento ?? '',
      tipoUsuario: u.tipoUsuario, region: u.region ?? '', comuna: u.comuna ?? '', direccion: u.direccion ?? '', contrasena: '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const guardar = (evento) => {
    evento.preventDefault()
    const nuevos = validar(valores, Boolean(enEdicion))
    setErrores(nuevos)
    if (Object.values(nuevos).some(Boolean)) {
      setMensaje({ tipo: 'danger', texto: 'Revisa los campos marcados antes de guardar.' })
      return
    }
    const resultado = guardarUsuario(valores, enEdicion)
    if (!resultado.ok) {
      setMensaje({ tipo: 'danger', texto: resultado.motivo })
      return
    }
    refrescar()
    limpiar()
    setMensaje({ tipo: 'success', texto: 'Usuario guardado correctamente.' })
  }

  const eliminar = (u) => {
    if (!window.confirm(`¿Eliminar a ${u.nombre} ${u.apellidos}?`)) return
    const resultado = eliminarUsuario(u.run, sesion)
    setMensaje(resultado.ok
      ? { tipo: 'success', texto: 'Usuario eliminado correctamente.' }
      : { tipo: 'danger', texto: resultado.motivo })
    refrescar()
    if (resultado.ok && enEdicion === u.run) limpiar()
  }

  return (
    <>
      <h1 className="titulo-seccion">Usuarios</h1>
      <p className="intro-seccion">Gestiona las cuentas, sus roles y datos de contacto.</p>
      {mensaje && <div role="status" className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

      <form className="tarjeta-formulario mb-4" onSubmit={guardar} noValidate>
        <h2 className="h4 mb-3">{enEdicion ? 'Editar usuario' : 'Nuevo usuario'}</h2>
        <div className="row">
          <Campo id="admin-usuario-run" etiqueta="RUN" value={valores.run} onChange={cambiar('run')} error={errores.run}
            claseWrapper="col-md-4 mb-3" readOnly={Boolean(enEdicion)} maxLength={9} ayuda="Sin puntos ni guion." />
          <Campo id="admin-usuario-nombre" etiqueta="Nombre" value={valores.nombre} onChange={cambiar('nombre')}
            error={errores.nombre} claseWrapper="col-md-4 mb-3" maxLength={50} />
          <Campo id="admin-usuario-apellidos" etiqueta="Apellidos" value={valores.apellidos} onChange={cambiar('apellidos')}
            error={errores.apellidos} claseWrapper="col-md-4 mb-3" maxLength={100} />
        </div>
        <div className="row">
          <Campo id="admin-usuario-correo" etiqueta="Correo" type="email" value={valores.correo} onChange={cambiar('correo')}
            error={errores.correo} claseWrapper="col-md-4 mb-3" maxLength={100} />
          <Campo id="admin-usuario-fecha" etiqueta="Fecha de nacimiento" type="date" value={valores.fechaNacimiento}
            onChange={cambiar('fechaNacimiento')} claseWrapper="col-md-4 mb-3" />
          <Campo id="admin-usuario-tipo" etiqueta="Tipo de usuario" as="select" value={valores.tipoUsuario}
            onChange={cambiar('tipoUsuario')} error={errores.tipoUsuario} claseWrapper="col-md-4 mb-3">
            <option value="">Selecciona un tipo</option>
            {Object.values(ROL).map((rol) => <option key={rol}>{rol}</option>)}
          </Campo>
        </div>
        <div className="row">
          <Campo id="admin-usuario-region" etiqueta="Región" as="select" value={valores.region} onChange={cambiar('region')}
            error={errores.region} claseWrapper="col-md-4 mb-3">
            <option value="">Selecciona una región</option>
            {Object.keys(regionesComunas).map((region) => <option key={region}>{region}</option>)}
          </Campo>
          <Campo id="admin-usuario-comuna" etiqueta="Comuna" as="select" value={valores.comuna} onChange={cambiar('comuna')}
            error={errores.comuna} claseWrapper="col-md-4 mb-3" disabled={!valores.region}>
            <option value="">Selecciona una comuna</option>
            {(regionesComunas[valores.region] ?? []).map((comuna) => <option key={comuna}>{comuna}</option>)}
          </Campo>
          <Campo id="admin-usuario-contrasena" etiqueta="Contraseña" type="password" value={valores.contrasena}
            onChange={cambiar('contrasena')} error={errores.contrasena} claseWrapper="col-md-4 mb-3" maxLength={10}
            ayuda={enEdicion ? 'Déjala vacía para conservar la actual.' : 'Entre 4 y 10 caracteres.'} />
        </div>
        <Campo id="admin-usuario-direccion" etiqueta="Dirección" value={valores.direccion} onChange={cambiar('direccion')}
          error={errores.direccion} maxLength={300} />
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-nv-primario">Guardar usuario</button>
          {enEdicion && <button type="button" className="btn btn-nv-secundario" onClick={limpiar}>Cancelar edición</button>}
        </div>
      </form>

      <div className="table-responsive">
        <table className="table tabla-admin align-middle">
          <caption className="visually-hidden">Listado de usuarios</caption>
          <thead>
            <tr><th>RUN</th><th>Nombre</th><th>Correo</th><th>Tipo</th><th>Ubicación</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.run}>
                <td>{u.run}</td>
                <td>{u.nombre} {u.apellidos}</td>
                <td>{u.correo}</td>
                <td>{u.tipoUsuario}</td>
                <td>{u.region} · {u.comuna}</td>
                <td>
                  <div className="d-flex gap-2 flex-wrap">
                    <Link className="btn btn-sm btn-outline-secondary" to={`/admin/usuarios/${u.run}/historial`}>Historial</Link>
                    <button type="button" className="btn btn-sm btn-nv-secundario" onClick={() => cargar(u)}>Editar</button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => eliminar(u)}>Eliminar</button>
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

export default AdminUsuarios
