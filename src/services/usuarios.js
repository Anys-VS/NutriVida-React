import { usuarios } from '../data/db'
import { ROL } from '../config/reglas'

const contarAdmins = (lista) => lista.filter((u) => u.tipoUsuario === ROL.ADMIN).length

// Crea o edita un usuario. Cuida que siempre quede al menos un administrador.
export function guardarUsuario(datos, runEnEdicion = null) {
  const lista = usuarios.listar()
  const run = datos.run.trim().toUpperCase()
  const correo = datos.correo.trim().toLowerCase()

  const duplicado = lista.some(
    (u) => u.run !== runEnEdicion && (u.run === run || u.correo.toLowerCase() === correo),
  )
  if (duplicado) return { ok: false, motivo: 'El RUN o el correo ya están registrados.' }

  if (!runEnEdicion) return { ok: true, usuario: usuarios.crear({ ...datos, run, correo }) }

  const actual = usuarios.obtener(runEnEdicion)
  if (!actual) return { ok: false, motivo: 'El usuario no existe.' }
  if (actual.tipoUsuario === ROL.ADMIN && contarAdmins(lista) === 1 && datos.tipoUsuario !== ROL.ADMIN) {
    return { ok: false, motivo: 'Debe existir al menos un administrador.' }
  }
  const cambios = { ...datos, run, correo }
  if (!datos.contrasena) delete cambios.contrasena // en edición, vacío = conservar la actual
  return { ok: true, usuario: usuarios.actualizar(runEnEdicion, cambios) }
}

export function eliminarUsuario(run, sesion) {
  const lista = usuarios.listar()
  const usuario = usuarios.obtener(run)
  if (!usuario) return { ok: false, motivo: 'El usuario no existe.' }
  if (sesion?.correo?.toLowerCase() === usuario.correo.toLowerCase()) {
    return { ok: false, motivo: 'No puedes eliminar tu propia cuenta.' }
  }
  if (usuario.tipoUsuario === ROL.ADMIN && contarAdmins(lista) === 1) {
    return { ok: false, motivo: 'Debe existir al menos un administrador.' }
  }
  usuarios.eliminar(run)
  return { ok: true }
}
