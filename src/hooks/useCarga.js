import { useCallback, useEffect, useState } from 'react'

// Carga datos asíncronos (normalmente una llamada a la API) y expone los estados que la
// interfaz debe mostrar: cargando, error (con el mensaje del backend) o los datos.
export function useCarga(cargar, dependencias = []) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: null })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true // evita actualizar el estado si el usuario ya salió de la página
    setEstado((anterior) => ({ ...anterior, cargando: true, error: null }))
    cargar()
      .then((datos) => vigente && setEstado({ datos, cargando: false, error: null }))
      .catch((error) => vigente && setEstado({ datos: null, cargando: false, error }))
    return () => { vigente = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, intento])

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])
  return { ...estado, reintentar }
}
