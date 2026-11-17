import { useState } from 'react'
import { Link } from 'react-router-dom'
import Campo from '../../components/Campo'
import EstadoCarga from '../../components/EstadoCarga'
import { useSesion } from '../../context/SesionContext'
import { regionesComunas } from '../../data/regiones'
import { ROL } from '../../config/reglas'
import { validarContrasena, validarCorreo, validarRUN, validarTexto } from '../../domain/validaciones'
import { useCarga } from '../../hooks/useCarga'
import { cambiarEstadoUsuarioAdmin, eliminarUsuarioAdmin, guardarUsuarioAdmin, listarUsuarios } from '../../services/administracion'

const VACIO = {
  run: '', nombre: '', apellidos: '', correo: '', fechaNacimiento: '', tipoUsuario: '',
  region: '', comuna: '', direccion: '', contrasena: '',
}

function validar(valores, enEdicion) {
  return {
    run: enEdicion ? '' : validarRUN(valores.run),
    nombre: validarTexto(valores.nombre, { etiqueta: 'El nombre', maximo: 50 }),
    apellidos: validarTexto(valores.apellidos, { etiqueta: 'Los apellidos', maximo: 100 }),
    correo: validarCorreo(valores.correo),
    tipoUsuario: valores.tipoUsuario ? '' : 'Selecciona un tipo de usuario.',
    region: valores.region ? '' : 'Selecciona una región.',
    comuna: valores.comuna ? '' : 'Selecciona una comuna.',
    direccion: validarTexto(valores.direccion, { etiqueta: 'La dirección', maximo: 300 }),
    // Al editar, la contraseña vacía conserva la actual.
    contrasena: enEdicion && !valores.contrasena ? '' : validarContrasena(valores.contrasena),
  }
}

function AdminUsuarios() {
  const { sesion } = useSesion()
  const [version, setVersion] = useState(0)
  const { datos, cargando, error, reintentar } = useCarga(listarUsuarios, [version])
  const lista = datos ?? []
  const [valores, setValores] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [enEdicion, setEnEdicion] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  const refrescar = () => setVersion((versionAnterior) => versionAnterior + 1)

  const cambiar = (campo) => (evento) => {
    const valor = evento.target.value
    setValores((anteriores) => ({ ...anteriores, [campo]: valor, ...(campo === 'region' ? { comuna: '' } : {}) }))
  }

  const limpiar = () => {
    setValores(VACIO)
    setErrores({})
    setEnEdicion(null)
  }

  const cargar = (usuario) => {
    setEnEdicion(usuario.run)
    setErrores({})
    setValores({
      run: usuario.run, nombre: usuario.nombre, apellidos: usuario.apellidos, correo: usuario.correo, fechaNacimiento: usuario.fechaNacimiento ?? '',
      tipoUsuario: usuario.tipoUsuario, region: usuario.region ?? '', comuna: usuario.comuna ?? '', direccion: usuario.direccion ?? '', contrasena: '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const guardar = async (evento) => {
    evento.preventDefault()
    const nuevos = validar(valores, Boolean(enEdicion))
    setErrores(nuevos)
    if (Object.values(nuevos).some(Boolean)) {
      setMensaje({ tipo: 'danger', texto: 'Revisa los campos marcados antes de guardar.' })
      return
    }
    const resultado = await guardarUsuarioAdmin(valores, enEdicion)
    if (!resultado.ok) {
      setErrores({ ...nuevos, ...resultado.errores })
      setMensaje({ tipo: 'danger', texto: resultado.motivo })
      return
    }
    refrescar()
    limpiar()
    setMensaje({ tipo: 'success', texto: 'Usuario guardado correctamente.' })
  }

  const eliminar = async (usuario) => {
    if (!window.confirm(`¿Eliminar a ${usuario.nombre} ${usuario.apellidos}?`)) return
    const resultado = await eliminarUsuarioAdmin(usuario.run, sesion)
    setMensaje(resultado.ok
      ? { tipo: 'success', texto: 'Usuario eliminado correctamente.' }
      : { tipo: 'danger', texto: resultado.motivo })
    refrescar()
    if (resultado.ok && enEdicion === usuario.run) limpiar()
  }

  const alternarEstado = async (usuario) => {
    const activar = usuario.activo === false
    if (!activar && !window.confirm(`¿Desactivar a ${usuario.nombre} ${usuario.apellidos}? No podrá iniciar sesión.`)) return
    const resultado = await cambiarEstadoUsuarioAdmin(usuario.run, activar, sesion)
    setMensaje(resultado.ok
      ? { tipo: 'success', texto: activar ? 'Usuario activado.' : 'Usuario desactivado. Su historial se conserva.' }
      : { tipo: 'danger', texto: resultado.motivo })
    refrescar()
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

      <EstadoCarga cargando={cargando && !datos} error={error} reintentar={reintentar} que="los usuarios" />
      <div className="table-responsive">
        <table className="table tabla-admin align-middle">
          <caption className="visually-hidden">Listado de usuarios</caption>
          <thead>
            <tr><th>RUN</th><th>Nombre</th><th>Correo</th><th>Tipo</th><th>Estado</th><th>Ubicación</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {lista.map((usuario) => (
              <tr key={usuario.run} className={usuario.activo === false ? 'fila-inactiva' : undefined}>
                <td>{usuario.run}</td>
                <td>{usuario.nombre} {usuario.apellidos}</td>
                <td>{usuario.correo}</td>
                <td>{usuario.tipoUsuario}</td>
                <td>
                  <span className={`badge text-bg-${usuario.activo === false ? 'secondary' : 'success'}`}>
                    {usuario.activo === false ? 'Inactivo' : 'Activo'}
                  </span>
                </td>
                <td>{usuario.region} · {usuario.comuna}</td>
                <td>
                  <div className="d-flex gap-2 flex-wrap">
                    <Link className="btn btn-sm btn-outline-secondary" to={`/admin/usuarios/${usuario.run}/historial`}>Historial</Link>
                    <button type="button" className="btn btn-sm btn-nv-secundario" onClick={() => cargar(usuario)}>Editar</button>
                    <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => alternarEstado(usuario)}>
                      {usuario.activo === false ? 'Activar' : 'Desactivar'}
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => eliminar(usuario)}>Eliminar</button>
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
