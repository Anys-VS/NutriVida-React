import { bloquesDeJornada, buscarProfesionales, describirHorario } from './profesionales'
import { asignarNutricionista, hayDisponibilidad, proximosHorarios } from './citas'
import { nutricionistas } from '../data/nutricionistas'
import { ESTADO_CITA } from '../config/reglas'

describe('buscador de especialistas', () => {
  // Prueba 27: búsqueda sin tildes, por especialidad y por día de atención
  it('filtra por texto libre, especialidad y día', () => {
    const nombres = (filtros) => buscarProfesionales(nutricionistas, filtros).map((p) => p.nombre)

    expect(nombres({ texto: 'PEDIATRICA' })).toEqual(['Felipe Araya'])
    expect(nombres({ texto: 'vegana' })).toEqual(['Daniela Morales'])
    expect(nombres({ texto: 'deporte' })).toEqual(['Rodrigo Sepúlveda'])
    expect(nombres({ dia: '6' })).toEqual(['Rodrigo Sepúlveda']) // solo él atiende los sábados
    expect(nombres({ especialidad: 'Obesidad y síndrome metabólico', dia: '2' })).toEqual([]) // Carolina no atiende martes
    expect(nombres({ texto: 'xyz' })).toEqual([])
  })

  // Prueba 28: jornada real de cada profesional
  it('arma los bloques y el texto del horario desde la jornada', () => {
    const rodrigo = nutricionistas.find((p) => p.nombre === 'Rodrigo Sepúlveda')
    expect(bloquesDeJornada(rodrigo)).toEqual(['09:00', '10:00', '11:00', '12:00', '13:00'])
    expect(describirHorario(rodrigo)).toBe('Mar, jue y sáb · 09:00–14:00')
  })
})

describe('disponibilidad con horarios reales', () => {
  const servicio = { codigo: 'CN002' }

  // Prueba 29: RN-14 con la jornada de cada nutricionista
  it('no permite reservar fuera de la jornada y asigna un nutricionista libre si no hay preferencia', () => {
    // 10-11-2026 es martes: Carolina no atiende, Rodrigo sí.
    expect(hayDisponibilidad({ servicio, nutricionista: 'Carolina Fuentes', fechaHora: '2026-11-10T10:00:00', citas: [] })).toBe(false)
    expect(hayDisponibilidad({ servicio, nutricionista: 'Rodrigo Sepúlveda', fechaHora: '2026-11-10T10:00:00', citas: [] })).toBe(true)

    // A las 18:00 del martes solo atiende Felipe; si está ocupado, no hay nadie.
    const ocupada = { id: 'X', nutricionista: 'Felipe Araya', estadoCita: ESTADO_CITA.CONFIRMADA, fechaHora: '2026-11-10T18:00:00' }
    expect(asignarNutricionista({ servicio, nutricionista: '', fechaHora: '2026-11-10T18:00:00', citas: [] })).toBe('Felipe Araya')
    expect(hayDisponibilidad({ servicio, nutricionista: '', fechaHora: '2026-11-10T18:00:00', citas: [ocupada] })).toBe(false)
  })

  // Prueba 30: próximos horarios para el buscador
  it('entrega los próximos horarios libres saltando los días en que no atiende', () => {
    const carolina = nutricionistas.find((p) => p.nombre === 'Carolina Fuentes')
    const libres = proximosHorarios({ profesional: carolina, citas: [], ahora: new Date('2026-11-10T08:00:00') })
    expect(libres).toEqual([
      { fecha: '2026-11-11', hora: '09:00' },
      { fecha: '2026-11-11', hora: '10:00' },
      { fecha: '2026-11-11', hora: '11:00' },
    ])
  })
})
