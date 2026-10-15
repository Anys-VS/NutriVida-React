// Artículos del blog. El de hábitos es el de la Evaluación 1; el de mitos se recreó para completar los dos detalles.
export const articulos = [
  {
    id: 'habitos-trabajo',
    titulo: 'Cómo mantener hábitos saludables en el trabajo',
    resumen: 'Ideas prácticas para ordenar tus comidas cuando pasas la mayor parte del día fuera de casa, sin depender de la fuerza de voluntad.',
    color: 'var(--ocre)',
    intro: 'Buena parte de nuestros pacientes pasa entre ocho y diez horas fuera de casa. En ese contexto, esperar fuerza de voluntad para "comer bien" suele fallar. Lo que funciona en consulta es rediseñar el entorno para que la opción saludable sea también la más simple.',
    video: { src: 'https://www.youtube.com/embed/4pN_f2tq-_o', titulo: 'Video sobre hábitos saludables en el trabajo' },
    secciones: [
      { titulo: 'Prepara solo dos o tres cosas, no un menú completo', texto: 'No es necesario cocinar cinco preparaciones distintas cada domingo. Con una proteína, una fuente de carbohidrato y verduras ya preparadas, puedes armar combinaciones distintas durante la semana sin perder variedad.' },
      { titulo: 'Ten una colación de respaldo siempre a mano', texto: 'Fruta, frutos secos o yogur en tu bolso o cajón del trabajo evitan que una reunión que se alarga termine en la máquina expendedora. La decisión ya está tomada antes de que aparezca el hambre.' },
      { titulo: 'Ordena el horario de tus comidas, no solo el contenido', texto: 'Saltarse el almuerzo por una reunión y compensar con una cena abundante suele generar más malestar digestivo que beneficio. Bloquear conscientemente 20 minutos para comer, aunque sea corto, ayuda a sostener el resto del día.' },
      { titulo: 'El agua también es parte del hábito', texto: 'La sed se confunde fácilmente con hambre. Tener una botella visible en el escritorio es un recordatorio simple que reduce el picoteo innecesario durante la jornada.' },
    ],
    cierre: 'Si quieres un plan ajustado a tu rutina laboral específica, revisa nuestras consultas y planes o agenda una evaluación inicial con el equipo.',
  },
  {
    id: 'mitos-dietas',
    titulo: '5 mitos sobre las dietas restrictivas',
    resumen: 'Revisamos las creencias más comunes que escuchamos en consulta sobre "dietas milagro" y por qué casi siempre terminan en efecto rebote.',
    color: 'var(--verde-bosque)',
    intro: 'En consulta escuchamos casi las mismas frases todas las semanas: "dejé de comer arroz y pan", "ya no como después de las seis" o "tomo solo agua con limón en ayunas". Ninguna de estas prácticas tiene, por sí sola, un respaldo sólido, y varias pueden ser contraproducentes.',
    secciones: [
      { titulo: '1. "Eliminar un grupo de alimentos completo acelera la baja de peso"', texto: 'Quitar los carbohidratos o las grasas de forma total suele generar una baja de peso inicial, principalmente por pérdida de agua y masa muscular, no de grasa. A mediano plazo, el cuerpo compensa y el proceso se estanca, además de aumentar el riesgo de deficiencias nutricionales.' },
      { titulo: '2. "Comer después de cierta hora engorda más"', texto: 'Lo que determina el balance energético es la cantidad total de calorías consumidas en el día, no el horario exacto de la comida. Cenar tarde no es el problema; comer en exceso o elegir opciones poco saciantes sí puede serlo.' },
      { titulo: '3. "Los jugos detox limpian el organismo"', texto: 'El hígado y los riñones ya cumplen esa función de manera continua. Los jugos "detox" no eliminan toxinas adicionales y, al ser líquidos, suelen generar más hambre en las horas siguientes por la falta de fibra y proteína.' },
      { titulo: '4. "Si no hay resultados inmediatos, la dieta no sirve"', texto: 'Un proceso nutricional sostenible se mide en semanas y meses, no en días. Los cambios muy rápidos suelen depender de restricciones severas difíciles de mantener, lo que explica buena parte del efecto rebote que vemos en consulta.' },
      { titulo: '5. "Todas las personas necesitan el mismo plan"', texto: 'La edad, el nivel de actividad física, las condiciones de salud preexistentes y hasta el horario laboral cambian por completo lo que un plan alimenticio debería incluir. Por eso la primera consulta siempre parte con una evaluación individual.' },
    ],
    cierre: 'Si te identificas con alguno de estos mitos y quieres una evaluación real de tu caso, revisa nuestras consultas y planes o escríbenos desde la sección de contacto.',
  },
]
