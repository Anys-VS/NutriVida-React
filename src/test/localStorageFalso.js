// Mock de localStorage en memoria para aislar cada prueba del navegador real.
export function crearLocalStorageFalso() {
  let datos = {}
  return {
    getItem: vi.fn((clave) => (clave in datos ? datos[clave] : null)),
    setItem: vi.fn((clave, valor) => { datos[clave] = String(valor) }),
    removeItem: vi.fn((clave) => { delete datos[clave] }),
    clear: vi.fn(() => { datos = {} }),
  }
}
