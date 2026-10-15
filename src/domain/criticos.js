import { ESTADO_CITA, REGLAS } from '../config/reglas'

const ACTIVAS = [ESTADO_CITA.POR_CONFIRMAR, ESTADO_CITA.CONFIRMADA]

// Talleres futuros con pocos cupos restantes (reemplaza al "stock crítico" del template).
export function talleresCriticos({ citas, servicios, ahora = new Date(), umbral = REGLAS.UMBRAL_CUPOS_CRITICOS }) {
  const sesiones = new Map()

  citas
    .filter((c) => ACTIVAS.includes(c.estadoCita) && new Date(c.fechaHora) > new Date(ahora))
    .forEach((c) => {
      const taller = servicios.find((s) => s.codigo === c.codigoServicio && s.cupos)
      if (!taller) return
      const clave = `${c.codigoServicio}|${c.fechaHora}`
      const sesion = sesiones.get(clave) ?? { codigoServicio: taller.codigo, nombre: taller.nombre, fechaHora: c.fechaHora, cupos: taller.cupos, ocupados: 0 }
      sesion.ocupados += 1
      sesiones.set(clave, sesion)
    })

  return [...sesiones.values()]
    .map((s) => ({ ...s, restantes: s.cupos - s.ocupados }))
    .filter((s) => s.restantes <= umbral)
    .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
}
