import { usuarios } from '../data/db'
import { ROL } from '../config/reglas'

export function autenticar(correo, contrasena) {
  const buscado = String(correo).trim().toLowerCase()
  return (
    usuarios.listar().find((u) => u.correo.toLowerCase() === buscado && u.contrasena === contrasena) ?? null
  )
}

export function registrarPaciente(datos) {
  const correo = datos.correo.trim().toLowerCase()
  const run = datos.run.trim().toUpperCase()

  if (usuarios.listar().some((u) => u.correo.toLowerCase() === correo)) {
    return { ok: false, motivo: 'Ya existe una cuenta con ese correo.' }
  }
  if (usuarios.obtener(run)) return { ok: false, motivo: 'Ya existe una cuenta con ese RUN.' }

  const usuario = { ...datos, run, correo, tipoUsuario: ROL.PACIENTE }
  usuarios.crear(usuario)
  return { ok: true, usuario }
}

export function rutaInicialPorRol(tipoUsuario) {
  if (tipoUsuario === ROL.PACIENTE) return '/mis-citas'
  return tipoUsuario === ROL.RECEPCION ? '/admin/citas' : '/admin'
}
