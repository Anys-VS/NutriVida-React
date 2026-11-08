// Ficha clínica de demostración: la paciente de prueba (paciente@gmail.com) está asignada a Carolina Fuentes.
// Las tallas van en centímetros y los pesos en kilos.
export const fichasSemilla = [
  {
    pacienteCorreo: 'paciente@gmail.com',
    nutricionista: 'Carolina Fuentes',
    objetivo: 'Bajar 6 kg en 4 meses y mejorar hábitos de colación en el trabajo.',
    antecedentes: 'Derivada por médico general. Resistencia a la insulina. Sin alergias alimentarias.',
    mediciones: [
      { id: 'M1', fecha: '2026-08-20', peso: 78.4, talla: 165, cintura: 92, nota: 'Evaluación inicial.', nutricionista: 'Carolina Fuentes' },
      { id: 'M2', fecha: '2026-09-17', peso: 76.9, talla: 165, cintura: 90, nota: 'Buena adherencia al plan.', nutricionista: 'Carolina Fuentes' },
      { id: 'M3', fecha: '2026-10-15', peso: 75.6, talla: 165, cintura: 88, nota: 'Se ajustan las colaciones de la tarde.', nutricionista: 'Carolina Fuentes' },
    ],
    planAlimenticio: {
      texto: 'Desayuno: avena con fruta y yogur natural.\nColación: un puñado de frutos secos.\nAlmuerzo: medio plato de verduras, legumbres o pescado y una porción de arroz integral.\nOnce: pan integral con palta o quesillo.\nCena: ensalada con proteína magra.\nAgua: 2 litros al día.',
      actualizadoEn: '2026-10-15T12:00:00.000Z',
      nutricionista: 'Carolina Fuentes',
    },
  },
]
