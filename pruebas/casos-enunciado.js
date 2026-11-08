// Como se parte un enunciado en texto, listas ("- ") y formulas ("> ").
// Cada caso: el enunciado y los bloques que tienen que salir.

export const CASOS_DE_ENUNCIADO = [
  {
    nombre: 'solo texto',
    enunciado: 'Una linea.\nOtra linea.',
    bloques: [{ texto: 'Una linea.\nOtra linea.' }],
  },
  {
    nombre: 'una lista entre dos textos',
    enunciado: 'Antes:\n- uno\n- dos\n\nDespues.',
    bloques: [{ texto: 'Antes:' }, { items: ['uno', 'dos'] }, { texto: 'Despues.' }],
  },
  {
    nombre: 'una formula suelta, sin las lineas en blanco que sobran',
    enunciado: 'La distancia es:\n> a + b\n\nListo.',
    bloques: [{ texto: 'La distancia es:' }, { formula: 'a + b' }, { texto: 'Listo.' }],
  },
  {
    nombre: 'dos formulas, cada una con su texto',
    enunciado: 'La primera es:\n> a + b\ny la segunda:\n> c / 2',
    bloques: [{ texto: 'La primera es:' }, { formula: 'a + b' }, { texto: 'y la segunda:' }, { formula: 'c / 2' }],
  },
  {
    nombre: 'formulas seguidas: cada una en su renglon',
    enunciado: '> a\n> b',
    bloques: [{ formula: 'a' }, { formula: 'b' }],
  },
  {
    nombre: 'una lista y una formula juntas',
    enunciado: '- uno\n- dos\n\nLa formula:\n> x \u00B2\n\nFin.',
    bloques: [{ items: ['uno', 'dos'] }, { texto: 'La formula:' }, { formula: 'x \u00B2' }, { texto: 'Fin.' }],
  },
  {
    nombre: 'un mayor que en medio de una linea no es una formula',
    enunciado: 'Si a > b se muestra a.',
    bloques: [{ texto: 'Si a > b se muestra a.' }],
  },
];

export function resultadoDelEnunciado(bloquesDeEnunciado, caso) {
  const sale = JSON.stringify(bloquesDeEnunciado(caso.enunciado));
  const debe = JSON.stringify(caso.bloques);
  return { bien: sale === debe, detalle: `salio ${sale}\nesperaba ${debe}` };
}
