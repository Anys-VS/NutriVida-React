import { ESTADO_CITA, REGLAS } from '../config/reglas'

const ACTIVAS = [ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA]

// Talleres futuros con pocos cupos restantes (reemplaza al "stock crítico" del template).
export function talleresCriticos({ citas, servicios, ahora = new Date(), umbral = REGLAS.UMBRAL_CUPOS_CRITICOS }) {
  const sesiones = new Map()

  citas
    .filter((cita) => ACTIVAS.includes(cita.estadoCita) && new Date(cita.fechaHora) > new Date(ahora))
    .forEach((cita) => {
      const taller = servicios.find((servicio) => servicio.codigo === cita.codigoServicio && servicio.cupos)
      if (!taller) return
      const clave = `${cita.codigoServicio}|${cita.fechaHora}`
      const sesion = sesiones.get(clave) ?? { codigoServicio: taller.codigo, nombre: taller.nombre, fechaHora: cita.fechaHora, cupos: taller.cupos, ocupados: 0 }
      sesion.ocupados += 1
      sesiones.set(clave, sesion)
    })

  return [...sesiones.values()]
    .map((taller) => ({ ...taller, restantes: taller.cupos - taller.ocupados }))
    .filter((taller) => taller.restantes <= umbral)
    .sort((tallerA, tallerB) => new Date(tallerA.fechaHora) - new Date(tallerB.fechaHora))
}
