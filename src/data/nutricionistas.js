// Directorio de nutricionistas (hoja "Nutricionistas" del catálogo de NutriVida).
// `dias` usa la numeración de Date#getDay(): 0 = domingo, 1 = lunes … 6 = sábado.
// `desde` y `hasta` delimitan la jornada: el último bloque empieza una hora antes de `hasta`.
// Las citas guardan el `nombre` del profesional, por eso no debe cambiar.
export const nutricionistas = [
  {
    id: 'NUT001',
    nombre: 'Carolina Fuentes',
    especialidad: 'Obesidad y síndrome metabólico',
    etiquetas: ['pérdida de peso', 'obesidad', 'diabetes', 'hipertensión', 'metabólico'],
    dias: [1, 3, 5],
    desde: '09:00',
    hasta: '17:00',
    correo: 'carolina.fuentes@nutrivida.cl',
    resena: 'Acompaña procesos de baja de peso y control de enfermedades metabólicas con planes realistas.',
  },
  {
    id: 'NUT002',
    nombre: 'Rodrigo Sepúlveda',
    especialidad: 'Nutrición deportiva y rendimiento',
    etiquetas: ['deporte', 'deportistas', 'rendimiento', 'masa muscular', 'suplementación'],
    dias: [2, 4, 6],
    desde: '09:00',
    hasta: '14:00',
    correo: 'rodrigo.sepulveda@nutrivida.cl',
    resena: 'Calcula requerimientos energéticos y proteicos para deportistas y personas activas.',
  },
  {
    id: 'NUT003',
    nombre: 'Daniela Morales',
    especialidad: 'Alimentación vegetariana, vegana y trastornos alimentarios',
    etiquetas: ['vegetariana', 'vegana', 'vegetariano', 'vegano', 'tca', 'trastornos alimentarios'],
    dias: [1, 2, 3, 4, 5],
    desde: '08:00',
    hasta: '13:00',
    correo: 'daniela.morales@nutrivida.cl',
    resena: 'Diseña dietas sin productos animales con aporte adecuado de proteínas, hierro y vitamina B12.',
  },
  {
    id: 'NUT004',
    nombre: 'Felipe Araya',
    especialidad: 'Nutrición pediátrica y familiar',
    etiquetas: ['niños', 'infantil', 'pediátrica', 'familia', 'adolescentes'],
    dias: [2, 3, 4, 5],
    desde: '14:00',
    hasta: '19:00',
    correo: 'felipe.araya@nutrivida.cl',
    resena: 'Evalúa a niños de 2 a 12 años y orienta a la familia completa en sus hábitos.',
  },
]
