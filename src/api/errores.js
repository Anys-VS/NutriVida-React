// Errores de la API con una forma única, venga del backend, de la red o del modo local.
// El backend responde los errores en JSON: { "mensaje": "...", "errores": { "campo": "detalle" } }.

const MENSAJES_POR_ESTADO = {
  400: 'Revisa los datos enviados.',
  401: 'Necesitas iniciar sesión para continuar.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos lo que buscas.',
  409: 'La operación entra en conflicto con datos existentes.',
  500: 'El servidor tuvo un problema. Intenta nuevamente en unos minutos.',
}

export class ErrorApi extends Error {
  constructor(estado, mensaje, { errores = {}, delServidor = false } = {}) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.estado = estado // código HTTP (0 si no hubo respuesta)
    this.errores = errores // errores por campo, para mostrarlos junto a cada input
    this.delServidor = delServidor // true si el mensaje lo escribió el backend
  }
}

export function normalizarError(error) {
  if (error instanceof ErrorApi) return error
  if (error?.response) {
    const { status, data } = error.response
    const mensajeServidor = data?.mensaje ?? data?.message
    return new ErrorApi(status, mensajeServidor ?? MENSAJES_POR_ESTADO[status] ?? 'Ocurrió un error inesperado.', {
      errores: data?.errores ?? {},
      delServidor: Boolean(mensajeServidor),
    })
  }
  if (error?.code === 'ECONNABORTED') return new ErrorApi(0, 'El servidor tardó demasiado en responder. Intenta de nuevo.')
  return new ErrorApi(0, 'No pudimos conectar con el servidor. Revisa tu conexión.')
}
