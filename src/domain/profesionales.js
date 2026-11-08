// Reglas puras sobre los nutricionistas: jornada, búsqueda y próximos horarios libres.
export const NOMBRES_DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

const aMinutos = (hora) => {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}
const aHora = (minutos) => `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`

// Quita tildes y mayúsculas para que "vegana" encuentre "Vegana" y "pediatrica" encuentre "pediátrica".
export function normalizar(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// Día de la semana de una fecha "AAAA-MM-DD", sin depender de la zona horaria.
export function diaDeLaSemana(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(anio, mes - 1, dia).getDay()
}

// Bloques de una hora dentro de la jornada: 09:00–14:00 → 09:00, 10:00 … 13:00.
export function bloquesDeJornada(profesional) {
  const bloques = []
  for (let minuto = aMinutos(profesional.desde); minuto + 60 <= aMinutos(profesional.hasta); minuto += 60) {
    bloques.push(aHora(minuto))
  }
  return bloques
}

export function atiendeEnFecha(profesional, fecha) {
  return profesional.dias.includes(diaDeLaSemana(fecha))
}

export function atiendeEn(profesional, fecha, hora) {
  return atiendeEnFecha(profesional, fecha) && bloquesDeJornada(profesional).includes(hora)
}

// "Lun, mié y vie · 09:00–17:00"
export function describirHorario(profesional) {
  const dias = profesional.dias.map((d) => DIAS_CORTOS[d])
  const texto = dias.length > 1 ? `${dias.slice(0, -1).join(', ')} y ${dias.at(-1)}` : dias[0]
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)} · ${profesional.desde}–${profesional.hasta}`
}

export const buscarPorNombre = (lista, nombre) => lista.find((p) => p.nombre === nombre) ?? null

// Filtra por texto libre (nombre, especialidad o etiquetas), especialidad exacta y día de atención.
export function buscarProfesionales(lista, { texto = '', especialidad = '', dia = '' } = {}) {
  const palabras = normalizar(texto).split(/\s+/).filter(Boolean)
  return lista.filter((p) => {
    const campos = normalizar([p.nombre, p.especialidad, ...(p.etiquetas ?? [])].join(' '))
    if (!palabras.every((palabra) => campos.includes(palabra))) return false
    if (especialidad && p.especialidad !== especialidad) return false
    if (dia !== '' && dia !== null && !p.dias.includes(Number(dia))) return false
    return true
  })
}

// "Carolina Fuentes" → "CF"
export const iniciales = (nombre) => nombre.split(/\s+/).map((parte) => parte[0]).join('').slice(0, 2).toUpperCase()
