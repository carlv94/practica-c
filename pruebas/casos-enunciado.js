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
    nombre: 'una advertencia al final, sin la linea en blanco que sobra',
    enunciado: 'Texto.\n\n! Cuidado con `x`.',
    bloques: [{ texto: 'Texto.' }, { advertencia: 'Cuidado con `x`.' }],
  },
  {
    nombre: 'varias lineas de advertencia seguidas son una sola',
    enunciado: '! Uno.\n! Dos.',
    bloques: [{ advertencia: 'Uno. Dos.' }],
  },
  {
    nombre: 'una advertencia entre una lista y un texto',
    enunciado: '- a\n! Ojo.\nFin.',
    bloques: [{ items: ['a'] }, { advertencia: 'Ojo.' }, { texto: 'Fin.' }],
  },
  {
    nombre: 'una advertencia pegada a una formula',
    enunciado: '> a\n! Ojo.',
    bloques: [{ formula: 'a' }, { advertencia: 'Ojo.' }],
  },
  {
    nombre: 'dos advertencias separadas por un texto',
    enunciado: '! Uno.\nEntre.\n! Dos.',
    bloques: [{ advertencia: 'Uno.' }, { texto: 'Entre.' }, { advertencia: 'Dos.' }],
  },
  {
    nombre: 'un signo de exclamacion en medio de una linea no es una advertencia',
    enunciado: 'Ojo! Cuidado.\n!Pegado.',
    bloques: [{ texto: 'Ojo! Cuidado.\n!Pegado.' }],
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

// El plano dibujado: el rango, los rotulos y los estilos que salen de cada descripcion,
// y los errores de una descripcion mal escrita. "plano" es lo que lleva "dibujo.plano".
export const CASOS_DE_PLANO = [
  {
    nombre: 'un punto suelto lleva sus coordenadas y el rango incluye el cero y un margen',
    plano: { puntos: [[3, 4]] },
    sale: (r) =>
      r.puntos[0].rotulo === '(3, 4)' &&
      r.puntos[0].estilo === 'normal' &&
      r.xmin === -1 &&
      r.xmax === 4 &&
      r.ymin === -1 &&
      r.ymax === 5 &&
      r.paso === 1,
  },
  {
    nombre: 'un rotulo propio y un estilo',
    plano: { puntos: [{ en: [1, 2], rotulo: 'A', estilo: 'fuera' }] },
    sale: (r) => r.puntos[0].rotulo === 'A' && r.puntos[0].estilo === 'fuera',
  },
  {
    nombre: 'el lado del rotulo de un punto: derecha por defecto, o izquierda y abajo',
    plano: { puntos: [[1, 1], { en: [2, 2], lado: 'izquierda' }, { en: [3, 3], lado: 'abajo' }] },
    sale: (r) => r.puntos.map((q) => q.lado).join() === 'derecha,izquierda,abajo',
  },
  {
    nombre: 'un rotulo vacio no se dibuja pero se conserva vacio',
    plano: { puntos: [{ en: [1, 2], rotulo: '' }] },
    sale: (r) => r.puntos[0].rotulo === '',
  },
  {
    nombre: 'una coordenada negativa ensancha el rango',
    plano: { puntos: [[-2, 2], [1, 1]] },
    sale: (r) => r.xmin === -3 && r.ymin === -1,
  },
  {
    nombre: 'la circunferencia entra en el rango y el paso crece con el tamano',
    plano: { circulo: { centro: [0, 0], radio: 5 }, puntos: [[6, 8]] },
    sale: (r) => r.xmin === -6 && r.xmax === 7 && r.ymin === -6 && r.ymax === 9 && r.paso === 2,
  },
  {
    nombre: 'un rango muy grande cuadricula de a cinco',
    plano: { puntos: [[0, 0], [20, 0]] },
    sale: (r) => r.xmax === 21 && r.paso === 5,
  },
  {
    nombre: 'un segmento: estilo y lado por defecto, y sus extremos cuentan para el rango',
    plano: { segmentos: [{ desde: [1, 2], hasta: [4, 6], rotulo: '5' }] },
    sale: (r) => r.segmentos[0].estilo === 'normal' && r.segmentos[0].lado === 1 && r.xmax === 5 && r.ymax === 7,
  },
  {
    nombre: 'un segmento del otro lado',
    plano: { segmentos: [{ desde: [0, 0], hasta: [3, 0], estilo: 'guia', lado: -1 }] },
    sale: (r) => r.segmentos[0].lado === -1 && r.segmentos[0].estilo === 'guia' && r.segmentos[0].rotulo === '',
  },
  {
    nombre: 'un punto sin las dos coordenadas',
    plano: { puntos: [[1]] },
    error: 'dos coordenadas',
  },
  {
    nombre: 'un estilo de punto que no existe',
    plano: { puntos: [{ en: [1, 1], estilo: 'rojo' }] },
    error: 'no existe',
  },
  {
    nombre: 'un lado de punto que no existe',
    plano: { puntos: [{ en: [1, 1], lado: 'arriba' }] },
    error: 'no existe',
  },
  {
    nombre: 'un estilo de segmento que no existe',
    plano: { segmentos: [{ desde: [0, 0], hasta: [1, 1], estilo: 'punteado' }] },
    error: 'no existe',
  },
  {
    nombre: 'una circunferencia sin radio positivo',
    plano: { circulo: { centro: [0, 0], radio: 0 } },
    error: 'radio',
  },
  {
    nombre: 'un plano vacio',
    plano: {},
    error: 'vacio',
  },
];

export function resultadoDelPlano(planoDe, caso) {
  try {
    const r = planoDe(caso.plano);
    if (caso.error) return { bien: false, detalle: `esperaba el error "${caso.error}" y salio ${JSON.stringify(r)}` };
    return { bien: Boolean(caso.sale(r)), detalle: JSON.stringify(r) };
  } catch (e) {
    return caso.error
      ? { bien: e.message.includes(caso.error), detalle: e.message }
      : { bien: false, detalle: 'error: ' + e.message };
  }
}
