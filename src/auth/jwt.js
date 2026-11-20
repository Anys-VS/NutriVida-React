// Lectura de tokens JWT en el navegador.
// Ojo: el frontend solo LEE el contenido (para mostrar el nombre o decidir qué menú dibujar).
// La firma la verifica el backend en cada petición; un token alterado a mano es rechazado allá.

const aBase64 = (texto) => texto.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(texto.length / 4) * 4, '=')

function decodificarBase64Url(texto) {
  const binario = atob(aBase64(texto))
  const bytes = Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function codificarBase64Url(objeto) {
  const bytes = new TextEncoder().encode(JSON.stringify(objeto))
  const binario = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Contenido (claims) del token, o null si no tiene formato JWT.
export function leerClaims(token) {
  try {
    const partes = String(token ?? '').split('.')
    if (partes.length !== 3) return null
    return JSON.parse(decodificarBase64Url(partes[1]))
  } catch {
    return null
  }
}

export function msHastaVencer(token, ahora = Date.now()) {
  const claims = leerClaims(token)
  return claims?.exp ? claims.exp * 1000 - ahora : -1
}

export const estaVigente = (token, ahora = Date.now()) => msHastaVencer(token, ahora) > 0

// ms-identidad envía el rol como nombre del enum (PACIENTE); la interfaz usa la etiqueta (Paciente).
const ROL_DESDE_BACKEND = {
  ADMINISTRADOR: 'Administrador',
  RECEPCION: 'Recepción',
  NUTRICIONISTA: 'Nutricionista',
  PACIENTE: 'Paciente',
}

// Datos de sesión que usa la interfaz, tomados del token de acceso. Acepta los dos formatos:
// - ms-identidad (modo api): sub = RUN, claim "correo", claim "nombre", rol = PACIENTE.
// - simulación local:        sub = correo, claims "run" y "apellidos", rol = Paciente.
export function sesionDesdeToken(token) {
  const claims = leerClaims(token)
  if (!claims?.sub || !claims?.rol) return null
  const correo = claims.correo ?? claims.sub
  return {
    run: claims.run ?? (claims.correo ? claims.sub : undefined),
    correo,
    nombre: claims.nombre,
    apellidos: claims.apellidos ?? '',
    tipoUsuario: ROL_DESDE_BACKEND[claims.rol] ?? claims.rol,
    expira: claims.exp * 1000,
  }
}
