// Las referencias de la figura del paso a paso: un panel (lo abre el botón «ⓘ» del reproductor) que explica cada tipo de flecha y de
// casilla o bloque que se dibuja, con una muestra hecha con las mismas clases de la figura (así cambia con el tema y no se desfasa
// cuando se cambia un estilo) y, en las que dependen de una ayuda visual, cuál es (con un interruptor).
//
// Para sumar una flecha nueva: una entrada en FLECHAS (con las clases que usa en `clases`). La prueba de cobertura de pruebas/index.html
// compara esas clases con las que figura.js escribe, y avisa si falta una.

import { ajustes, AYUDAS } from '../ajustes.js';

const SVG = 'http://www.w3.org/2000/svg';

// La punta de cada tipo de flecha: clase del triangulo y tamaño (iguales a los de la figura).
const PUNTAS = {
  punta: ['rep-cabeza', 7],
  mala: ['rep-cabeza-mala', 7],
  incierta: ['rep-cabeza-incierta', 7],
  nueva: ['rep-cabeza-nueva', 6],
  vieja: ['rep-cabeza-vieja', 7],
};

// Las flechas. "clases": las que se usan para dibujarla (la prueba de cobertura las mira). "requiere": la ayuda visual de la que depende.
export const FLECHAS = [
  {
    id: 'normal',
    titulo: 'Apunta a algo que existe',
    texto: 'Sale de un puntero y llega a la variable o al bloque cuya dirección guarda.',
    clases: ['rep-flecha'],
    punta: 'punta',
  },
  {
    id: 'nueva',
    titulo: 'Llegó en este paso',
    texto: 'Ámbar y más gruesa: es la flecha que acaba de crearse o de cambiar de destino. En el paso siguiente vuelve a ser azul.',
    clases: ['rep-nueva'],
    grupo: 'rep-nueva',
    punta: 'nueva',
  },
  {
    id: 'retirada',
    titulo: 'Se va en este paso',
    texto:
      'Conserva su color y se engrosa mientras se retira. Se contrae hasta su casilla si el puntero sigue ahí pero deja de apuntar (p = NULL;), y se desvanece si el puntero mismo desaparece (termina su función o su bloque).',
    clases: ['rep-retirada'],
    grupo: 'rep-retirada',
    punta: 'punta',
  },
  {
    id: 'liberada',
    titulo: 'Apunta a un bloque liberado',
    texto: 'Roja y continua: el puntero sigue guardando la dirección, pero el bloque ya se liberó con free (un puntero colgante).',
    clases: ['rep-flecha-liberada'],
    trazo: 'rep-flecha-liberada',
    punta: 'mala',
    punto: 'rep-muerto',
  },
  {
    id: 'perdida',
    titulo: 'Apunta a algo que ya no existe',
    texto:
      'Roja, punteada y con una ×: la variable a la que apuntaba pertenecía a una función o a un bloque que terminó. Antes de quedar así, la flecha llega a la variable, esta se desvanece y la flecha retrocede hasta la ×.',
    clases: ['rep-flecha-mala', 'rep-perdida-texto'],
    trazo: 'rep-flecha-mala',
    punta: 'mala',
    punto: 'rep-muerto',
    simbolo: { texto: '×', clase: 'rep-perdida-texto' },
  },
  {
    id: 'fuera',
    titulo: 'Se sale del arreglo',
    texto: 'Roja y punteada, sin símbolo: apunta a una posición que no pertenece al arreglo.',
    clases: ['rep-flecha-mala'],
    trazo: 'rep-flecha-mala',
    punta: 'mala',
  },
  {
    id: 'incierta',
    titulo: 'Puntero sin dirección',
    texto:
      'Magenta, punteada y hacia un «?», con un punto hueco en su casilla: el puntero todavía no recibió una dirección, así que apunta a algún lado pero no se sabe adónde. Copiarlo copia esa incógnita. Sin la ayuda, la casilla solo dice «?».',
    clases: ['rep-flecha-incierta', 'rep-cabeza-incierta', 'rep-punto-incierto', 'rep-incierto-texto'],
    trazo: 'rep-flecha-incierta',
    punta: 'incierta',
    punto: 'rep-punto-incierto',
    simbolo: { texto: '?', clase: 'rep-incierto-texto' },
    requiere: 'punterosSinValor',
  },
  {
    id: 'deLiberado',
    titulo: 'Sale de un bloque liberado',
    texto: 'Gris y tenue: el dato sigue en la memoria, pero ya no es un enlace de la lista.',
    clases: ['rep-de-liberado'],
    grupo: 'rep-de-liberado',
    punta: 'vieja',
  },
  {
    id: 'nombre',
    titulo: 'Nombre de la flecha',
    texto: 'Un rótulo junto a la punta con el nombre de la variable de la que sale. Sin la ayuda, se ve al señalar la flecha.',
    clases: ['rep-etiqueta', 'rep-etiqueta-texto'],
    punta: 'punta',
    nombre: 'p',
    requiere: 'nombresFlechas',
  },
];

// Las casillas y los bloques.
export const FIGURAS = [
  {
    id: 'nulo',
    titulo: 'NULL',
    texto: 'El puntero vale NULL: a propósito, no apunta a nada. Al pasar a NULL la flecha se recoge y la palabra aparece; al revés, la palabra se retira.',
    celda: { clase: 'rep-nulo', texto: 'NULL' },
  },
  {
    id: 'sinvalor',
    titulo: 'Sin valor',
    texto: 'La variable ya existe pero todavía no se le asignó nada: su casilla, punteada, dice «?».',
    celda: { clase: 'rep-vacia', texto: '?' },
  },
  {
    id: 'cambio',
    titulo: 'Cambió en este paso',
    texto: 'La casilla donde la sentencia guardó un valor nuevo queda en ámbar.',
    celda: { clase: 'rep-cambio', texto: '4' },
  },
  {
    id: 'liberado',
    titulo: 'Bloque liberado',
    texto: 'Rayado y con el aviso «liberado»: su memoria ya no es del programa, aunque algún puntero siga guardando su dirección.',
    bloque: { clase: 'rep-liberado', aviso: 'liberado' },
  },
  {
    id: 'inalcanzable',
    titulo: 'Bloque inalcanzable',
    texto: 'Borde punteado y el aviso «inalcanzable»: está reservado pero ya nadie lo apunta, así que no se puede liberar (una fuga de memoria).',
    bloque: { clase: 'rep-huerfano', aviso: 'inalcanzable' },
  },
];

// Qué le pasa a una flecha cuando algo cambia, sin dibujo (se ve en movimiento).
export const MOVIMIENTOS = [
  {
    titulo: 'Se contrae',
    texto: 'El puntero sigue ahí pero su flecha termina (p = NULL;, también free(p); p = NULL;, o un puntero sin dirección que pasa a NULL): la flecha se recoge hasta su casilla y aparece la palabra NULL.',
  },
  {
    titulo: 'Se desvanece',
    texto: 'El puntero mismo desaparece (termina la función, o el bloque { } donde estaba): se desvanecen su flecha y su casilla.',
  },
  {
    titulo: 'Retrocede',
    texto: 'El puntero sigue pero lo que apuntaba se va (la variable de una función o bloque que termina): primero la flecha llega, después lo apuntado se desvanece y, por último, la flecha, ya roja, retrocede hasta la ×.',
  },
  {
    titulo: 'Se desliza',
    texto: 'Un puntero que ya apuntaba a algo y pasa a apuntar a otra cosa (o uno sin dirección que recibe una): la punta de la flecha se desliza del destino viejo al nuevo.',
  },
];

function nodo(etiqueta, clase, texto) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
}

function svgDe(ancho, alto) {
  const s = document.createElementNS(SVG, 'svg');
  s.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
  s.setAttribute('width', ancho);
  s.setAttribute('height', alto);
  s.setAttribute('class', 'rep-svg leyenda-muestra');
  s.setAttribute('aria-hidden', 'true');
  return s;
}

let contador = 0;

// La muestra de una flecha: un puntito de origen, la flecha con su punta y, si lleva, su símbolo o su nombre.
function muestraDeFlecha(e) {
  const s = svgDe(132, 26);
  const id = `ley-punta-${++contador}`;
  const [clasePunta, tam] = PUNTAS[e.punta];
  const defs = document.createElementNS(SVG, 'defs');
  defs.innerHTML = `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="${tam}" markerHeight="${tam}" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="${clasePunta}"/></marker>`;
  s.append(defs);
  const g = document.createElementNS(SVG, 'g');
  g.setAttribute('class', 'rep-flecha-g' + (e.grupo ? ' ' + e.grupo : ''));
  const punto = document.createElementNS(SVG, 'circle');
  punto.setAttribute('cx', 10);
  punto.setAttribute('cy', 13);
  punto.setAttribute('r', 4);
  punto.setAttribute('class', 'rep-punto' + (e.punto ? ' ' + e.punto : ''));
  const trazo = document.createElementNS(SVG, 'path');
  trazo.setAttribute('d', e.nombre ? 'M16,13 L116,13' : 'M16,13 L110,13');
  trazo.setAttribute('class', 'rep-flecha' + (e.trazo ? ' ' + e.trazo : ''));
  trazo.setAttribute('marker-end', `url(#${id})`);
  g.append(punto, trazo);
  if (e.simbolo) {
    const t = document.createElementNS(SVG, 'text');
    t.setAttribute('x', 116);
    t.setAttribute('y', 18);
    t.setAttribute('class', e.simbolo.clase);
    t.textContent = e.simbolo.texto;
    g.append(t);
  }
  if (e.nombre) {
    const w = e.nombre.length * 6 + 8;
    const r = document.createElementNS(SVG, 'rect');
    r.setAttribute('x', 44);
    r.setAttribute('y', 2);
    r.setAttribute('width', w);
    r.setAttribute('height', 11);
    r.setAttribute('rx', 3);
    r.setAttribute('class', 'rep-etiqueta');
    const t = document.createElementNS(SVG, 'text');
    t.setAttribute('x', 44 + w / 2);
    t.setAttribute('y', 11);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('class', 'rep-etiqueta-texto');
    t.textContent = e.nombre;
    g.append(r, t);
  }
  s.append(g);
  return s;
}

function muestraDeFigura(e) {
  const s = svgDe(132, 38);
  if (e.celda) {
    const r = document.createElementNS(SVG, 'rect');
    r.setAttribute('x', 36);
    r.setAttribute('y', 7);
    r.setAttribute('width', 60);
    r.setAttribute('height', 24);
    r.setAttribute('rx', 3);
    r.setAttribute('class', 'rep-celda ' + e.celda.clase);
    const t = document.createElementNS(SVG, 'text');
    t.setAttribute('x', 66);
    t.setAttribute('y', 23);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('class', 'rep-texto');
    t.textContent = e.celda.texto;
    s.append(r, t);
    return s;
  }
  // un bloque: su borde (el rayado, con su propio patron: no se depende del de la figura) y su aviso
  const id = `ley-rayado-${++contador}`;
  const defs = document.createElementNS(SVG, 'defs');
  defs.innerHTML = `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" class="rep-rayado-linea"/></pattern>`;
  const r = document.createElementNS(SVG, 'rect');
  r.setAttribute('x', 8);
  r.setAttribute('y', 14);
  r.setAttribute('width', 116);
  r.setAttribute('height', 20);
  r.setAttribute('rx', 5);
  r.setAttribute('class', 'rep-bloque ' + e.bloque.clase);
  if (e.bloque.clase === 'rep-liberado') r.style.fill = `url(#${id})`;
  const dir = document.createElementNS(SVG, 'text');
  dir.setAttribute('x', 10);
  dir.setAttribute('y', 9);
  dir.setAttribute('class', 'rep-direccion');
  dir.textContent = '5008';
  const aviso = document.createElementNS(SVG, 'text');
  aviso.setAttribute('x', 122);
  aviso.setAttribute('y', 9);
  aviso.setAttribute('text-anchor', 'end');
  aviso.setAttribute('class', 'rep-aviso');
  aviso.textContent = e.bloque.aviso;
  s.append(defs, r, dir, aviso);
  return s;
}

function fila(muestra, titulo, texto) {
  const f = nodo('div', 'leyenda-fila');
  const cuerpo = nodo('div', 'leyenda-texto');
  cuerpo.append(nodo('strong', 'leyenda-titulo', titulo), nodo('span', 'leyenda-detalle', texto));
  if (muestra) f.append(muestra);
  f.append(cuerpo);
  return { fila: f, cuerpo };
}

// El panel: un botón (el «ⓘ» del reproductor) que abre y cierra una tarjeta con las referencias.
export function montarLeyenda(panel, abrir) {
  panel.replaceChildren();
  const cabeza = nodo('div', 'ajustes-cabeza');
  const cerrarBoton = nodo('button', 'ajustes-cerrar', '✕');
  cerrarBoton.type = 'button';
  cerrarBoton.title = 'Cerrar';
  cerrarBoton.setAttribute('aria-label', 'Cerrar');
  cabeza.append(nodo('h4', 'ajustes-titulo-panel', 'Referencias de la figura'), cerrarBoton);
  panel.append(cabeza);
  panel.append(nodo('p', 'ayuda', 'Qué significa cada dibujo. Los que llevan «Requiere» se ven solo con esa ayuda visual encendida.'));

  // Las que dependen de una ayuda: su interruptor se mantiene al dia si el alumno la cambia desde el otro panel.
  const interruptores = [];
  const agregarRequiere = (cuerpo, clave) => {
    const a = AYUDAS.find((x) => x.clave === clave);
    if (!a) return;
    const linea = nodo('span', 'leyenda-requiere');
    const estado = nodo('span', 'leyenda-estado');
    const boton = nodo('button', 'leyenda-interruptor');
    boton.type = 'button';
    linea.append('Requiere: ', nodo('strong', '', a.titulo), ' · ', estado, ' ', boton);
    boton.onclick = () => ajustes.fijar(clave, !ajustes.valor(clave));
    cuerpo.append(linea);
    interruptores.push(() => {
      const si = ajustes.valor(clave);
      estado.textContent = si ? 'activada' : 'desactivada';
      boton.textContent = si ? 'Desactivar' : 'Activar';
    });
  };

  const seccion = (titulo) => panel.append(nodo('h5', 'leyenda-seccion', titulo));
  seccion('Flechas');
  for (const e of FLECHAS) {
    const { fila: f, cuerpo } = fila(muestraDeFlecha(e), e.titulo, e.texto);
    f.dataset.flecha = e.id;
    if (e.requiere) agregarRequiere(cuerpo, e.requiere);
    panel.append(f);
  }
  seccion('Casillas y bloques');
  for (const e of FIGURAS) {
    const { fila: f } = fila(muestraDeFigura(e), e.titulo, e.texto);
    f.dataset.figura = e.id;
    panel.append(f);
  }
  seccion('Cómo se mueven las flechas');
  for (const m of MOVIMIENTOS) panel.append(fila(null, m.titulo, m.texto).fila);

  const mostrar = () => {
    for (const f of interruptores) f();
  };
  mostrar();
  const olvidar = ajustes.alCambiar(() => {
    if (panel.isConnected) mostrar();
    else olvidar(); // el reproductor ya no esta en la pagina
  });

  const cerrar = () => {
    panel.hidden = true;
    abrir.setAttribute('aria-expanded', 'false');
  };
  cerrarBoton.onclick = () => {
    cerrar();
    abrir.focus();
  };
  abrir.setAttribute('aria-expanded', 'false');
  abrir.onclick = () => {
    panel.hidden = !panel.hidden;
    abrir.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) cerrarBoton.focus();
  };
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrar();
      abrir.focus();
    }
  });
  const alHacerClic = (e) => {
    if (!panel.isConnected) document.removeEventListener('click', alHacerClic);
    else if (!panel.hidden && !panel.contains(e.target) && !abrir.contains(e.target)) cerrar();
  };
  document.addEventListener('click', alHacerClic);
}
