import { usuarios } from '../data/db'
import { ROL } from '../config/reglas'

// Busca un usuario local por correo y comprueba su contraseña.
export function autenticar(correo, contrasena) {
  const buscado = String(correo).trim().toLowerCase()

  return (
    usuarios.listar().find(
      (usuario) =>
        usuario.correo.toLowerCase() === buscado &&
        usuario.contrasena === contrasena
    ) ?? null
  )
}

// Valida las credenciales y comprueba que la cuenta esté activa.
export function iniciarSesion(correo, contrasena) {
  const usuario = autenticar(correo, contrasena)

  if (!usuario) {
    return { ok: false, motivo: 'Correo o contraseña incorrectos.' }
  }

  if (usuario.activo === false) {
    return {
      ok: false,
      motivo: 'Tu cuenta está desactivada. Comunícate con la clínica.',
    }
  }

  return { ok: true, usuario }
}

// Registra un paciente en la base de datos local.
export function registrarPaciente(datos) {
  const correo = String(datos.correo).trim().toLowerCase()
  const run = String(datos.run).trim().toUpperCase()

  if (usuarios.listar().some(
    (existente) => existente.correo.toLowerCase() === correo
  )) {
    return { ok: false, motivo: 'Ya existe una cuenta con ese correo.' }
  }

  if (usuarios.obtener(run)) {
    return { ok: false, motivo: 'Ya existe una cuenta con ese RUN.' }
  }

  const usuario = {
    ...datos,
    run,
    correo,
    tipoUsuario: ROL.PACIENTE,
    activo: true,
  }

  try {
    usuarios.crear(usuario)
    return { ok: true, usuario }
  } catch {
    return { ok: false, motivo: 'No pudimos crear la cuenta.' }
  }
}

// Define la ruta inicial según el rol del usuario.
export function rutaInicialPorRol(tipoUsuario) {
  if (tipoUsuario === ROL.PACIENTE) return '/mis-citas'
  if (tipoUsuario === ROL.NUTRICIONISTA) return '/admin/agenda'

  return tipoUsuario === ROL.RECEPCION ? '/admin/citas' : '/admin'
}
