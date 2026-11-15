import { ROL } from './reglas'

const { ADMIN, RECEPCION, NUTRICIONISTA, PACIENTE } = ROL

// Matriz de permisos: qué roles pueden usar cada funcionalidad.
// La usan las rutas (RutaProtegida), los menús y los botones, así una regla se cambia en un solo lugar.
// El backend aplica las mismas reglas en cada endpoint; esto solo decide qué ve cada usuario.
export const PERMISOS = {
  'reservas:propias': [PACIENTE], // pagar, ver sus citas, carrito, órdenes y progreso
  'panel:acceder': [ADMIN, RECEPCION, NUTRICIONISTA],
  'panel:resumen': [ADMIN],
  'citas:gestionar': [ADMIN, RECEPCION], // confirmar, cancelar y ver todas las citas
  'agenda:propia': [NUTRICIONISTA],
  'fichas:gestionar': [NUTRICIONISTA], // solo de sus pacientes (lo valida services/clinico)
  'catalogo:gestionar': [ADMIN], // servicios, categorías, planes y cupos
  'reportes:ver': [ADMIN],
  'usuarios:gestionar': [ADMIN],
}

export function puede(sesion, permiso) {
  const roles = PERMISOS[permiso]
  if (!roles) throw new Error(`Permiso desconocido: ${permiso}`)
  return Boolean(sesion) && roles.includes(sesion.tipoUsuario)
}
