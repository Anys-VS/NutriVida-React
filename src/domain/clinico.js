// Reglas puras de la ficha clínica: IMC, validación de mediciones, progreso y privacidad.
import { ESTADO_CITA, ROL } from '../config/reglas'

export function calcularIMC(peso, tallaCm) {
  const metros = Number(tallaCm) / 100
  if (!(Number(peso) > 0) || !(metros > 0)) return null
  return Math.round((Number(peso) / (metros * metros)) * 10) / 10
}

export function clasificarIMC(imc) {
  if (imc === null || imc === undefined) return ''
  if (imc < 18.5) return 'Bajo peso'
  if (imc < 25) return 'Normal'
  if (imc < 30) return 'Sobrepeso'
  return 'Obesidad'
}

const enRango = (valor, minimo, maximo) => Number(valor) >= minimo && Number(valor) <= maximo

// Devuelve un mensaje por campo ('' si está bien), igual que los demás validadores.
export function validarMedicion({ fecha, peso, talla, cintura }, hoy = new Date()) {
  const errores = { fecha: '', peso: '', talla: '', cintura: '' }
  if (!fecha) errores.fecha = 'La fecha es obligatoria.'
  else if (new Date(`${fecha}T00:00:00`) > hoy) errores.fecha = 'La fecha no puede ser futura.'
  if (!enRango(peso, 2, 400)) errores.peso = 'Ingresa un peso entre 2 y 400 kg.'
  if (!enRango(talla, 40, 250)) errores.talla = 'Ingresa una talla entre 40 y 250 cm.'
  if (cintura !== '' && cintura !== undefined && cintura !== null && !enRango(cintura, 30, 250)) {
    errores.cintura = 'Ingresa una cintura entre 30 y 250 cm, o déjala vacía.'
  }
  return errores
}

export const ordenarPorFecha = (mediciones = []) => [...mediciones].sort((a, b) => a.fecha.localeCompare(b.fecha))

// Variación entre la primera y la última medición.
export function resumenProgreso(mediciones = []) {
  const ordenadas = ordenarPorFecha(mediciones)
  if (ordenadas.length === 0) return null
  const primera = ordenadas[0]
  const ultima = ordenadas.at(-1)
  const diferencia = (campo) =>
    primera[campo] && ultima[campo] ? Math.round((ultima[campo] - primera[campo]) * 10) / 10 : null
  return {
    primera,
    ultima,
    controles: ordenadas.length,
    variacionPeso: diferencia('peso'),
    variacionCintura: diferencia('cintura'),
    imcActual: calcularIMC(ultima.peso, ultima.talla),
  }
}

const mismoCorreo = (a, b) => String(a).toLowerCase() === String(b).toLowerCase()

// Privacidad de datos de salud (caso NutriVida, sección 5): solo el paciente y su nutricionista
// pueden ver la ficha. Es "su" nutricionista quien la tiene asignada o quien lo atiende o atendió.
export function puedeVerFicha({ sesion, pacienteCorreo, ficha, citas = [], nombreProfesional = '' }) {
  if (!sesion) return false
  if (sesion.tipoUsuario === ROL.PACIENTE) return mismoCorreo(sesion.correo, pacienteCorreo)
  if (sesion.tipoUsuario !== ROL.NUTRICIONISTA || !nombreProfesional) return false
  if (ficha?.nutricionista === nombreProfesional) return true
  return citas.some(
    (c) => mismoCorreo(c.pacienteCorreo, pacienteCorreo) && c.nutricionista === nombreProfesional && c.estadoCita !== ESTADO_CITA.CANCELADA,
  )
}

// Solo el nutricionista registra o edita la ficha; el paciente solo la consulta.
export function puedeEditarFicha(datos) {
  return datos.sesion?.tipoUsuario === ROL.NUTRICIONISTA && puedeVerFicha(datos)
}
