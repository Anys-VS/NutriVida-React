// Lectura de tokens JWT en el navegador.
// Ojo: el frontend solo LEE el contenido (para mostrar el nombre o decidir qué menú dibujar).
// La firma la verifica el backend en cada petición; un token alterado a mano es rechazado allá.

const aBase64 = (texto) => texto.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(texto.length / 4) * 4, '=')

function decodificarBase64Url(texto) {
  const binario = atob(aBase64(texto))
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function codificarBase64Url(objeto) {
  const bytes = new TextEncoder().encode(JSON.stringify(objeto))
  const binario = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
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

// Datos de sesión que usa la interfaz, tomados del token de acceso.
// Contrato con el backend (ms-usuarios): sub = correo, run, nombre, apellidos, rol, exp.
export function sesionDesdeToken(token) {
  const claims = leerClaims(token)
  if (!claims?.sub || !claims?.rol) return null
  return {
    run: claims.run,
    correo: claims.sub,
    nombre: claims.nombre,
    apellidos: claims.apellidos,
    tipoUsuario: claims.rol,
    expira: claims.exp * 1000,
  }
}
