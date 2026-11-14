// La figura de la memoria: dibuja una fotografia de la traza (ver traza.js) como un
// SVG. A la izquierda la pila, con una caja por cada funcion en curso y una casilla
// por variable; a la derecha el montículo, con los bloques en tres grupos:
//
//   la lista       lo que se alcanza desde las "cabezas" (en el orden en que se llega,
//                  asi una lista queda de izquierda a derecha)
//   sin enlazar    bloques que solo senalan variables de la funcion en curso (el nodo que
//                  se acaba de crear): se unen a la lista cuando algo de afuera los senala
//   sin puntero    bloques que nadie senala (una fuga), en punteado
//
// De cada puntero sale una flecha que va por canales y carriles, sin cruzar los bloques.
// Un bloque liberado se ve mientras algo lo siga senalando, y esa flecha sigue con su punta,
// continua pero en rojo (el puntero todavia apunta; lo que ya no vale es la memoria). Al pasar el cursor por una variable o un bloque se describe lo que tiene y se
// resaltan sus flechas.
//
//   const figura = new Figura(contenedor, { cabezas: ['lista'] });
//   figura.mostrar(foto, anterior, { animar: true, duracion: 450 });
//
// "cabezas" son los nombres de las variables que guardan el comienzo de la estructura. Sin
// ellas, la lista es lo que alcanzan las variables de las funciones que llamaron a la
// que esta en curso (con una sola funcion, todo es la lista).
//
// "anterior" es la fotografia del paso anterior: lo que cambio desde entonces se
// resalta, tambien la flecha que salio de una casilla que cambio (en ambar y mas gruesa).
// Un paso con movimiento tiene tres tiempos: se anima la flecha (se dibuja hacia el bloque, que
// todavia esta donde estaba, o se redirige: la punta se desliza del destino viejo al nuevo; si el
// puntero pasa a NULL, se retrae), una pausa con todo quieto, y los bloques se reubican; tambien las
// cajas de la pila: la de una funcion que termina se desvanece y las de abajo suben, y la de una
// llamada aparece y las de abajo bajan. mostrar() devuelve
// cuanto dura todo, para que quien reproduce espere. Los nombres de las flechas se ven si se
// pide (fijarNombres), o al senalar una flecha, una variable o un bloque; un clic en una flecha la deja fija. Adonde apuntaba antes un
// puntero que cambio se dice en la descripcion al pasar el cursor. Los colores salen de las
// variables de css/estilo.css.

const NS = 'http://www.w3.org/2000/svg';
const CW = 52; // ancho de una casilla
const CH = 26; // alto de una casilla
const PAD = 6;
const LETRA = 7.4; // ancho aproximado de una letra
const MAX_ELEMENTOS = 14;
const ENCABEZADO = 12; // lo que ocupa la direccion sobre un bloque
const HUECO_FILAS = 54; // entre una fila de bloques y la que sigue: lugar para los carriles
const RADIO = 7;

function el(nombre, atributos = {}, hijos = []) {
  const e = document.createElementNS(NS, nombre);
  for (const [k, v] of Object.entries(atributos)) if (v != null) e.setAttribute(k, v);
  for (const h of hijos) e.append(h);
  return e;
}

const texto = (x, y, contenido, clase, extra = {}) => {
  const t = el('text', { x, y, class: clase, ...extra });
  t.textContent = contenido;
  return t;
};

const clave = (id, ruta) => `${id}|${ruta.join('/')}`;

// ------------------------------------------------------------------ medidas

// Lo que dice una casilla con un valor.
function etiqueta(v) {
  switch (v.k) {
    case 'num': {
      if (v.t === 'char' && v.v >= 32 && v.v < 127) return `'${String.fromCharCode(v.v)}'`;
      return Number.isInteger(v.v) ? String(v.v) : String(Number(v.v.toFixed(4)));
    }
    case 'sinvalor':
      return '?';
    case 'nulo':
      return 'NULL';
    default:
      return '';
  }
}

const anchoDeCasilla = (v) => (v.k === 'ptr' ? 36 : Math.max(CW, etiqueta(v).length * LETRA + 14));

// Una cadena: todo el texto en una sola casilla.
const esCadena = (v) => v.k === 'arr' && v.texto !== undefined;
const anchoDeCadena = (v) => Math.max(CW, (v.texto.length + 2) * LETRA + 14);

// Un bloque de una sola posicion (lo que da malloc(sizeof(T))) se dibuja sin el arreglo.
function sinEnvoltura(valor) {
  return valor.k === 'arr' && valor.elems.length === 1 && !esCadena(valor) ? { v: valor.elems[0], ruta: [0] } : { v: valor, ruta: [] };
}

function medir(v) {
  if (v.k === 'est') {
    let w = 0;
    let h = 0;
    for (const c of v.campos) {
      const m = medir(c.v);
      w += Math.max(m.w, c.n.length * 6 + 8) + PAD / 2;
      h = Math.max(h, m.h);
    }
    return { w: Math.max(w - PAD / 2, CW), h: h + 13 };
  }
  if (esCadena(v)) return { w: anchoDeCadena(v), h: CH };
  if (v.k === 'arr') {
    const n = Math.min(v.elems.length, MAX_ELEMENTOS);
    let w = 0;
    let h = CH;
    for (let i = 0; i < n; i++) {
      const m = medir(v.elems[i]);
      w += m.w + 2;
      h = Math.max(h, m.h);
    }
    if (v.elems.length > n) w += 22;
    return { w: Math.max(w - 2, CW), h: h + 12 };
  }
  return { w: anchoDeCasilla(v), h: CH };
}

// ------------------------------------------------------------ lo que cambio

// Una clave por casilla y su contenido, para saber que cambio entre dos pasos.
function planoDe(foto) {
  const plano = new Map();
  const recorrer = (v, id, ruta) => {
    if (v.k === 'est') v.campos.forEach((c) => recorrer(c.v, id, [...ruta, c.n]));
    else if (v.k === 'arr') v.elems.forEach((e, i) => recorrer(e, id, [...ruta, i]));
    else plano.set(clave(id, ruta), v.k === 'num' ? `n${v.v}` : v.k === 'ptr' ? `p${v.a}:${v.ruta.join('/')}` : v.k);
  };
  const todas = [...foto.globales, ...foto.marcos.flatMap((m) => m.variables), ...foto.monticulo];
  for (const r of todas) {
    plano.set(clave(r.id, ['#vivo']), r.vivo ? 'v' : 'x');
    recorrer(r.valor, r.id, []);
  }
  return plano;
}

// A donde apuntaba cada casilla de puntero: clave de la casilla -> { a, ruta }.
function destinosDe(foto) {
  const mapa = new Map();
  const recorrer = (v, id, ruta) => {
    if (v.k === 'est') v.campos.forEach((c) => recorrer(c.v, id, [...ruta, c.n]));
    else if (v.k === 'arr') v.elems.forEach((e, i) => recorrer(e, id, [...ruta, i]));
    else if (v.k === 'ptr') mapa.set(clave(id, ruta), { a: v.a, ruta: v.ruta });
  };
  for (const r of [...foto.globales, ...foto.marcos.flatMap((m) => m.variables), ...foto.monticulo]) recorrer(r.valor, r.id, []);
  return mapa;
}

// Las variables y bloques de una fotografia por su id: id -> { reserva, bloque }.
function indexar(foto) {
  const mapa = new Map();
  for (const r of [...foto.globales, ...foto.marcos.flatMap((m) => m.variables)]) mapa.set(r.id, { reserva: r, bloque: false });
  for (const b of foto.monticulo) mapa.set(b.id, { reserva: b, bloque: true });
  return mapa;
}

// ------------------------------------------------------ que bloques y donde

// Los punteros que hay en un valor.
function punterosDe(v, salida = []) {
  if (v.k === 'ptr') salida.push(v);
  else if (v.k === 'est') v.campos.forEach((c) => punterosDe(c.v, salida));
  else if (v.k === 'arr') v.elems.forEach((e) => punterosDe(e, salida));
  return salida;
}

// Los bloques que se ven: los reservados, el que se libera en este paso y los
// liberados que algun puntero (de una variable o de un bloque en uso) todavia senala.
function bloquesVisibles(foto, anterior) {
  const apuntados = new Set();
  const fuentes = [...foto.globales, ...foto.marcos.flatMap((m) => m.variables), ...foto.monticulo.filter((b) => b.vivo)];
  for (const r of fuentes) for (const p of punterosDe(r.valor)) apuntados.add(p.a);
  const vivosAntes = new Set(anterior ? anterior.monticulo.filter((b) => b.vivo).map((b) => b.id) : []);
  return foto.monticulo.filter((b) => b.vivo || apuntados.has(b.id) || vivosAntes.has(b.id));
}

// Reparte los bloques visibles en la lista, los sin enlazar y los sin puntero.
function repartir(foto, visibles, cabezas) {
  const nodos = new Map();
  const todas = [
    ...foto.globales.map((v) => ({ v, marco: -1 })),
    ...foto.marcos.flatMap((m, i) => m.variables.filter((v) => !v.pendiente).map((v) => ({ v, marco: i }))),
  ];
  for (const x of todas) nodos.set(x.v.id, { valor: x.v.valor, bloque: null });
  for (const b of visibles) nodos.set(b.id, { valor: b.valor, bloque: b });
  const vistos = new Set();
  const orden = [];
  const visitar = (id) => {
    const n = nodos.get(id);
    if (!n || vistos.has(id)) return;
    vistos.add(id);
    if (n.bloque) orden.push(n.bloque);
    for (const p of punterosDe(n.valor)) visitar(p.a);
  };
  let raices;
  if (cabezas && cabezas.length) raices = todas.filter((x) => cabezas.includes(x.v.nombre));
  else if (foto.marcos.length > 1) raices = todas.filter((x) => x.marco < foto.marcos.length - 1);
  else raices = todas;
  for (const x of raices) visitar(x.v.id);
  const lista = orden.slice();
  for (const x of todas) visitar(x.v.id);
  const nuevos = orden.slice(lista.length);
  // Un bloque liberado que ya no esta en la lista no es un nodo sin enlazar: va con los de afuera.
  const sueltos = nuevos.filter((b) => b.vivo);
  const sinPuntero = [...nuevos.filter((b) => !b.vivo), ...visibles.filter((b) => !vistos.has(b.id))];
  return { lista, sueltos, sinPuntero };
}

// ------------------------------------------------------------------ pintor

class Pintor {
  constructor(foto, anterior) {
    this.capa = el('g');
    this.anclas = new Map();
    this.flechas = [];
    this.cambios = new Set();
    this.bloque = null; // el bloque que se esta dibujando (las coordenadas son locales)
    this.marco = null; // la caja de la pila que se esta dibujando (las coordenadas son locales a ella)
    this.dueno = null;
    this.previos = anterior ? destinosDe(anterior) : new Map();
    if (anterior) {
      const antes = planoDe(anterior);
      for (const [k, v] of planoDe(foto)) if (antes.get(k) !== v) this.cambios.add(k);
    }
  }

  ancla(id, ruta, x, y, w, h) {
    this.anclas.set(clave(id, ruta), { bloque: this.bloque, marco: this.marco, x, y, w, h });
  }

  // Dibuja un valor con su esquina en (x, y) y registra donde quedo cada parte.
  valor(v, x, y, id, ruta) {
    const m = medir(v);
    this.ancla(id, ruta, x, y, m.w, m.h);
    if (v.k === 'est') {
      let cx = x;
      for (const c of v.campos) {
        const mc = medir(c.v);
        const ancho = Math.max(mc.w, c.n.length * 6 + 8);
        this.capa.append(texto(cx + ancho / 2, y + 9, c.n, 'rep-campo', { 'text-anchor': 'middle' }));
        this.valor(c.v, cx + (ancho - mc.w) / 2, y + 13, id, [...ruta, c.n]);
        cx += ancho + PAD / 2;
      }
      return m;
    }
    if (esCadena(v)) {
      this.casilla(x, y, m.w, CH, `"${v.texto}"`, 'rep-cadena', clave(id, ruta));
      return m;
    }
    if (v.k === 'arr') {
      let cx = x;
      const n = Math.min(v.elems.length, MAX_ELEMENTOS);
      for (let i = 0; i < n; i++) {
        const mi = medir(v.elems[i]);
        this.valor(v.elems[i], cx, y, id, [...ruta, i]);
        this.capa.append(texto(cx + mi.w / 2, y + m.h - 2, String(i), 'rep-indice', { 'text-anchor': 'middle' }));
        cx += mi.w + 2;
      }
      if (v.elems.length > n) this.capa.append(texto(cx + 8, y + CH / 2 + 4, '…', 'rep-campo'));
      return m;
    }
    const k = clave(id, ruta);
    if (v.k === 'ptr') {
      this.casilla(x, y, m.w, CH, '', 'rep-puntero', k);
      this.capa.append(el('circle', { cx: x + m.w / 2, cy: y + CH / 2, r: 4, class: 'rep-punto' + (v.muerto ? ' rep-muerto' : '') }));
      const nombre =
        this.dueno && this.dueno.nombre
          ? ruta.reduce((s, r) => (typeof r === 'number' ? `${s}[${r}]` : `${s}.${r}`), this.dueno.nombre)
          : null;
      this.flechas.push({
        origen: { bloque: this.bloque, marco: this.marco, x, y, w: m.w, h: CH },
        deId: this.dueno ? this.dueno.id : null,
        nombre: this.dueno && this.dueno.pila ? nombre : null,
        claveOrigen: k,
        rutaOrigen: ruta,
        a: v.a,
        ruta: v.ruta,
        muerto: v.muerto,
        fuera: v.fuera,
        cambio: this.cambios.has(k),
      });
      return m;
    }
    const clase = v.k === 'sinvalor' ? 'rep-vacia' : v.k === 'nulo' ? 'rep-nulo' : '';
    this.casilla(x, y, m.w, CH, etiqueta(v), clase, k);
    return m;
  }

  casilla(x, y, w, h, contenido, clase, k) {
    const cambio = this.cambios.has(k) ? ' rep-cambio' : '';
    this.capa.append(el('rect', { x, y, width: w, height: h, rx: 3, class: `rep-celda ${clase}${cambio}` }));
    if (contenido) this.capa.append(texto(x + w / 2, y + h / 2 + 4, contenido, 'rep-texto', { 'text-anchor': 'middle' }));
  }
}

const largoDe = (puntos) => puntos.slice(1).reduce((suma, p, i) => suma + Math.hypot(p.x - puntos[i].x, p.y - puntos[i].y), 0);

// Los primeros "largo" pixeles de una linea quebrada (null si es casi nada).
function recortar(puntos, largo) {
  if (largo < 1) return null;
  const salida = [puntos[0]];
  let resto = largo;
  for (let i = 1; i < puntos.length; i++) {
    const a = puntos[i - 1];
    const b = puntos[i];
    const tramo = Math.hypot(b.x - a.x, b.y - a.y);
    if (tramo >= resto) {
      const k = tramo === 0 ? 0 : resto / tramo;
      salida.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
      return salida.length > 1 ? salida : null;
    }
    salida.push(b);
    resto -= tramo;
  }
  return salida;
}

// Una linea quebrada entre dos: se igualan en cantidad de puntos (repitiendo uno del medio, para
// no dejar la punta con una direccion indefinida) y se mezclan, de la primera (k = 0) a la segunda (k = 1).
function unir(a, b, k) {
  const igualar = (p, n) => {
    const q = [...p];
    while (q.length < n) q.splice(1, 0, q[1] || q[0]);
    return q;
  };
  const n = Math.max(a.length, b.length);
  const x = igualar(a, n);
  const y = igualar(b, n);
  return x.map((p, i) => ({ x: p.x + (y[i].x - p.x) * k, y: p.y + (y[i].y - p.y) * k }));
}

// Una linea quebrada con las esquinas redondeadas.
function camino(puntos) {
  let d = `M${puntos[0].x},${puntos[0].y}`;
  for (let i = 1; i < puntos.length - 1; i++) {
    const a = puntos[i - 1];
    const b = puntos[i];
    const c = puntos[i + 1];
    const antes = Math.hypot(b.x - a.x, b.y - a.y);
    const despues = Math.hypot(c.x - b.x, c.y - b.y);
    const r = Math.min(RADIO, antes / 2, despues / 2);
    if (r < 1) {
      d += ` L${b.x},${b.y}`;
      continue;
    }
    const p1 = { x: b.x - ((b.x - a.x) / antes) * r, y: b.y - ((b.y - a.y) / antes) * r };
    const p2 = { x: b.x + ((c.x - b.x) / despues) * r, y: b.y + ((c.y - b.y) / despues) * r };
    d += ` L${p1.x},${p1.y} Q${b.x},${b.y} ${p2.x},${p2.y}`;
  }
  const u = puntos[puntos.length - 1];
  return d + ` L${u.x},${u.y}`;
}

// ------------------------------------------------------------------ figura

const sinMovimiento = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const suavizar = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

export class Figura {
  constructor(contenedor, opciones = {}) {
    this.contenedor = contenedor;
    this.cabezas = opciones.cabezas || null;
    this.previas = new Map(); // id de bloque -> donde estaba
    this.raf = null;
    this.enfoque = null;
    this.escena = null;
    this.datos = new Map();
    this.escalaModo = { modo: 'ajustar', zoom: 1, alto: false };
    this.escalaActual = 1;
    this.fase = 'FIN';
    this.fundir = false; // se hacen los fundidos de color (cuando hay animacion)
    this.animandoA = false; // las flechas que cambiaron se estan animando, cuadro por cuadro
    this.kA = 1; // cuanto de esa animacion (0 a 1)
    this.mostrarNombres = false;
    this.enfoqueFlecha = null; // la flecha que se esta senalando
    this.fijada = null; // la flecha a la que se le hizo clic
    contenedor.classList.add('rep-figura-base');
    this.tip = document.createElement('div');
    this.tip.className = 'rep-tip';
    this.tip.hidden = true;
    this.tip.setAttribute('role', 'tooltip');
  }

  get svg() {
    return this.escena ? this.escena.svg : null;
  }

  // "duracion" es la unidad de movimiento. Devuelve cuanto dura la animacion de este paso (0 si no hay).
  mostrar(foto, anterior = null, { animar = false, duracion = 450 } = {}) {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    const previa = this.escena;
    // Donde estaban los bloques (ahora, aunque se estuvieran moviendo), contados desde el borde del monticulo.
    const posiciones = previa ? new Map([...previa.bloques].map(([id, b]) => [id, { rx: b.actual.x - previa.x0, y: b.actual.y }])) : new Map();
    // Y donde estaban las cajas de la pila.
    const posicionesMarcos = previa ? new Map([...previa.marcosG].map(([k, m]) => [k, m.actual.y])) : new Map();
    const escena = this.construir(foto, anterior, previa);
    this.escena = escena;
    this.contenedor.replaceChildren(escena.svg);
    escena.svg.classList.toggle('rep-con-nombres', this.mostrarNombres);
    this.aplicarEscala();
    this.tip.hidden = true;
    this.enfoque = null;
    this.enfoqueFlecha = null;
    this.fijada = null;

    const u = duracion;
    const mueve = animar && !sinMovimiento() && u > 0 && Boolean(previa);
    this.fundir = mueve;
    let seMueven = false;
    for (const b of escena.bloques.values()) {
      const antes = posiciones.get(b.id);
      b.desde = mueve && antes ? { x: escena.x0 + antes.rx, y: antes.y } : { ...b.hasta };
      b.actual = { ...b.desde };
      b.nuevo = mueve && !antes;
      if (Math.abs(b.desde.x - b.hasta.x) > 0.5 || Math.abs(b.desde.y - b.hasta.y) > 0.5) seMueven = true;
      b.g.setAttribute('transform', `translate(${b.actual.x},${b.actual.y})`);
    }
    // Las cajas de la pila: las que siguen suben o bajan, las nuevas aparecen y las que ya no estan
    // se ven (quietas) hasta el tiempo B, en que se desvanecen.
    for (const m of escena.marcosG.values()) {
      const antes = posicionesMarcos.get(m.clave);
      m.desde = mueve && antes != null ? { y: antes } : { y: m.hasta.y };
      m.actual = { ...m.desde };
      m.nuevo = mueve && antes == null;
      if (Math.abs(m.desde.y - m.hasta.y) > 0.5 || m.nuevo) seMueven = true;
      m.g.setAttribute('transform', `translate(0,${m.actual.y})`);
    }
    if (mueve && previa) {
      for (const [k, m] of previa.marcosG) {
        if (escena.marcosG.has(k)) continue;
        const clon = m.g.cloneNode(true);
        clon.style.pointerEvents = 'none';
        for (const e of clon.querySelectorAll('[data-id]')) e.removeAttribute('data-id');
        clon.setAttribute('transform', `translate(0,${m.actual.y})`);
        escena.raiz.append(clon);
        escena.salientes.push({ g: clon });
        seMueven = true;
      }
    }
    // Si el paso nuevo es mas bajo (se fue una caja de la pila), lo que todavia esta donde estaba
    // quedaria cortado: se conserva el alto del paso anterior y se ajusta mientras todo se reubica.
    escena.altoFinal = escena.alto + 10;
    escena.altoActual = escena.altoFinal;
    escena.altoDesde = previa && previa.altoActual ? previa.altoActual : escena.altoFinal;
    if (mueve && seMueven && escena.altoDesde > escena.altoFinal) this.ponerAlto(escena.altoDesde);
    if (seMueven) {
      for (const b of escena.bloques.values()) if (b.nuevo) b.g.style.opacity = '0';
      for (const m of escena.marcosG.values()) if (m.nuevo) m.g.style.opacity = '0';
    }
    // Tiempo A: las flechas que cambiaron se animan (se dibujan, se redirigen o se retraen) con los
    // bloques todavia donde estaban; despues, una pausa. Tiempo B: los bloques se reubican. FIN: todo
    // en su lugar. Si nada se mueve, solo hay tiempo A.
    const hayRetiradas = escena.retiradas.some((r) => r.viejo);
    const hayA = escena.flechas.some((f) => f.cambio && !f.tarde) || hayRetiradas;
    const conFlechaAntes = mueve && seMueven && hayA;
    this.fase = !mueve || !seMueven ? 'FIN' : conFlechaAntes ? 'A' : 'B';
    for (const b of escena.bloques.values()) if (b.nuevo && !seMueven) b.nuevo = false;
    const animA = mueve && (seMueven ? hayA : escena.flechas.some((f) => f.cambio) || hayRetiradas);
    this.animandoA = animA;
    this.kA = animA ? 0 : 1;
    this.pintarFlechas();
    if (!mueve || (!animA && !seMueven)) return 0;
    // Si habia una flecha antes (se va a redirigir o a retraer), primero se la ve resaltada y quieta.
    const hayFlechaPrevia = escena.flechas.some((f) => f.cambio && f.viejo) || hayRetiradas;
    const retencion = animA && hayFlechaPrevia ? u * 0.6 : 0;
    const duracionA = animA ? retencion + u : 0;
    const pausa = conFlechaAntes ? u * 1.1 : 0;
    const espera = duracionA + pausa;
    const duracionB = seMueven ? u : 0;
    const hayTarde = seMueven && escena.flechas.some((f) => f.tarde);
    const inicio = performance.now();
    const paso = (ahora) => {
      const t = ahora - inicio;
      if (this.animandoA && t < duracionA) {
        this.kA = suavizar(Math.max(0, t - retencion) / u);
        this.pintarFlechas();
        this.raf = requestAnimationFrame(paso);
        return;
      }
      if (this.animandoA) {
        this.animandoA = false;
        this.kA = 1;
        this.pintarFlechas();
      }
      if (!seMueven) {
        this.raf = null;
        return;
      }
      if (t < espera) {
        this.raf = requestAnimationFrame(paso);
        return;
      }
      if (this.fase === 'A') this.fase = 'B';
      const k = Math.min(1, (t - espera) / duracionB);
      this.fotograma(suavizar(k));
      if (k < 1) {
        this.raf = requestAnimationFrame(paso);
        return;
      }
      this.raf = null;
      this.fase = 'FIN';
      for (const sa of this.escena.salientes) sa.g.remove();
      this.escena.salientes = [];
      this.pintarFlechas();
      // Las flechas hacia bloques que acaban de aparecer se dibujan al final.
      this.dibujarNuevas('.rep-tarde .rep-flecha', u);
    };
    this.raf = requestAnimationFrame(paso);
    return espera + duracionB + (hayTarde ? u : 0);
  }

  // Los nombres de las flechas (de las que salen de una variable) se ven siempre, o solo al senalarlas.
  fijarNombres(si) {
    this.mostrarNombres = Boolean(si);
    if (this.svg) this.svg.classList.toggle('rep-con-nombres', this.mostrarNombres);
  }

  // La escala del dibujo. "ajustar": que entre en el ancho (y en el alto, si "alto"), hasta
  // 1,5 veces su tamano natural y sin bajar de 0,7 (mas chico no se lee: se desplaza). "fijo": "zoom" veces.
  fijarEscala(opciones) {
    this.escalaModo = { ...this.escalaModo, ...opciones };
    this.aplicarEscala();
  }

  aplicarEscala() {
    const svg = this.svg;
    if (!svg) return;
    const [, , nw, nh] = svg.getAttribute('viewBox').split(' ').map(Number);
    const { modo, zoom, alto } = this.escalaModo;
    let k = zoom;
    if (modo === 'ajustar') {
      k = Math.min((this.contenedor.clientWidth - 14) / nw, 1.5);
      if (alto && this.contenedor.clientHeight > 40) k = Math.min(k, (this.contenedor.clientHeight - 14) / nh);
      k = Math.max(k, 0.7);
    }
    if (!(k > 0)) k = 1;
    svg.setAttribute('width', nw * k);
    svg.setAttribute('height', nh * k);
    this.escalaActual = k;
  }

  // Las flechas que cumplen el selector se van dibujando desde su origen hasta su destino.
  dibujarNuevas(selector, milisegundos) {
    if (!this.escena || sinMovimiento()) return;
    for (const trazo of this.escena.capaFlechas.querySelectorAll(selector)) {
      if (!trazo.getTotalLength || !trazo.animate) continue;
      const largo = trazo.getTotalLength();
      trazo.animate(
        [
          { strokeDasharray: `${largo}`, strokeDashoffset: `${largo}` },
          { strokeDasharray: `${largo}`, strokeDashoffset: '0' },
        ],
        { duration: milisegundos, easing: 'ease-out' }
      );
    }
  }

  // Cambia el alto que se ve (sin tocar la escala): el area visible es mas alta que el paso nuevo mientras se anima.
  ponerAlto(h) {
    const escena = this.escena;
    const svg = escena.svg;
    const [, , nw] = svg.getAttribute('viewBox').split(' ').map(Number);
    escena.altoActual = h;
    svg.setAttribute('viewBox', `0 0 ${nw} ${h}`);
    svg.setAttribute('height', h * this.escalaActual);
  }

  fotograma(e) {
    const { altoDesde, altoFinal } = this.escena;
    if (altoDesde > altoFinal) this.ponerAlto(altoDesde + (altoFinal - altoDesde) * e);
    for (const b of this.escena.bloques.values()) {
      b.actual = { x: b.desde.x + (b.hasta.x - b.desde.x) * e, y: b.desde.y + (b.hasta.y - b.desde.y) * e };
      b.g.setAttribute('transform', `translate(${b.actual.x},${b.actual.y})`);
      if (b.nuevo) b.g.style.opacity = String(e);
    }
    for (const m of this.escena.marcosG.values()) {
      m.actual = { y: m.desde.y + (m.hasta.y - m.desde.y) * e };
      m.g.setAttribute('transform', `translate(0,${m.actual.y})`);
      if (m.nuevo) m.g.style.opacity = String(e);
    }
    // La caja que se va se desvanece en la primera mitad, antes de que la de abajo llegue a su lugar.
    for (const sa of this.escena.salientes) sa.g.style.opacity = String(Math.max(0, 1 - 2 * e));
    this.pintarFlechas();
  }

  // ---------------------------------------------------------- construccion

  construir(foto, anterior, previa = null) {
    const p = new Pintor(foto, anterior);
    const raiz = p.capa;
    const datos = new Map();
    this.datos = datos;
    const defs = el('defs');
    defs.innerHTML =
      '<marker id="rep-punta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="rep-cabeza"/></marker>' +
      '<marker id="rep-punta-mala" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="rep-cabeza-mala"/></marker>' +
      '<marker id="rep-punta-nueva" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="rep-cabeza-nueva"/></marker>';

    // ---- la pila: la funcion en curso arriba
    let y = 24;
    let anchoPila = 150;
    raiz.append(texto(8, 14, 'Pila', 'rep-titulo'));
    const cajas = [];
    if (foto.globales.length) cajas.push({ clave: 'globales', titulo: 'globales', variables: foto.globales });
    for (let i = foto.marcos.length - 1; i >= 0; i--) {
      cajas.push({ clave: `${i}:${foto.marcos[i].funcion}`, titulo: `${foto.marcos[i].funcion}()`, variables: foto.marcos[i].variables, actual: i === foto.marcos.length - 1 });
    }
    const marcosG = new Map();
    for (const caja of cajas) {
      const etiquetaAncho = Math.max(0, ...caja.variables.map((v) => v.nombre.length)) * LETRA + 12;
      const filas = caja.variables.map((v) => ({ v, m: medir(v.valor) }));
      const ancho = Math.max(120, etiquetaAncho + Math.max(0, ...filas.map((f) => f.m.w)) + 22, caja.titulo.length * LETRA + 22);
      const alto = 22 + filas.reduce((s, f) => s + f.m.h + 8, 0) + (filas.length ? 2 : 6);
      // Cada caja es un grupo con coordenadas propias: asi se la puede mover.
      const gm = el('g', { class: 'rep-marco-g' });
      raiz.append(gm);
      gm.append(el('rect', { x: 8, y: 0, width: ancho, height: alto, rx: 6, class: 'rep-marco' + (caja.actual ? ' rep-actual' : '') }));
      gm.append(texto(16, 15, caja.titulo, 'rep-funcion'));
      p.marco = caja.clave;
      let fy = 22;
      for (const f of filas) {
        const g = el('g', { class: 'rep-var' + (f.v.pendiente ? ' rep-pendiente' : ''), 'data-id': f.v.id });
        if (f.v.pendiente) g.append(el('title', {}, ['todavía no declarada']));
        gm.append(g);
        p.capa = g;
        p.dueno = { id: f.v.id, nombre: f.v.nombre, pila: true };
        // Una zona que recibe el cursor, aunque entre casilla y casilla no haya nada.
        g.append(el('rect', { x: 10, y: fy - 3, width: ancho - 4, height: f.m.h + 6, class: 'rep-zona' }));
        g.append(texto(16, fy + f.m.h / 2 + (f.v.valor.k === 'est' ? 10 : 4), f.v.nombre, 'rep-nombre' + (!f.v.vivo ? ' rep-liberado' : '')));
        p.ancla(f.v.id, [], 16 + etiquetaAncho, fy, f.m.w, f.m.h);
        p.valor(f.v.valor, 16 + etiquetaAncho, fy, f.v.id, []);
        p.capa = raiz;
        datos.set(f.v.id, { reserva: f.v, funcion: caja.titulo, bloque: false });
        fy += f.m.h + 8;
      }
      p.marco = null;
      gm.setAttribute('transform', `translate(0,${y})`);
      marcosG.set(caja.clave, { clave: caja.clave, g: gm, hasta: { y } });
      anchoPila = Math.max(anchoPila, ancho + 8);
      y += alto + 10;
    }
    const derechaPila = anchoPila;
    let alto = y;

    // ---- el montículo: tres grupos, cada uno en filas
    const visibles = bloquesVisibles(foto, anterior);
    const { lista, sueltos, sinPuntero } = repartir(foto, visibles, this.cabezas);
    // Al terminar el programa (ya no hay funciones) los bloques se quedan donde estaban: reubicarlos
    // por el orden de las direcciones confundiria. Solo cambia su marca ("sin puntero").
    const fijo = Boolean(previa) && foto.marcos.length === 0 && visibles.every((b) => previa.bloques.has(b.id));
    const x0 = fijo ? previa.x0 : derechaPila + 70;
    const limite = x0 + 460;
    const lugares = new Map(); // id -> { x, y, w, h, fila, columna }
    const filas = []; // { y, fondo }
    let by = 36; // arriba queda lugar para los carriles que pasan sobre la primera fila
    const colocar = (grupo) => {
      let bx = x0;
      let fila = null;
      let columna = 0;
      let altoFila = 0;
      const cerrar = () => {
        if (fila) fila.fondo = fila.y + ENCABEZADO + altoFila;
      };
      for (const b of grupo) {
        const { v } = sinEnvoltura(b.valor);
        const m = medir(v);
        const w = m.w + 2 * PAD;
        const h = m.h + 2 * PAD;
        if (!fila || (bx > x0 && bx + w > limite)) {
          if (fila) {
            cerrar();
            by = fila.fondo + HUECO_FILAS;
          }
          fila = { y: by, fondo: by };
          filas.push(fila);
          bx = x0;
          columna = 0;
          altoFila = 0;
        }
        lugares.set(b.id, { x: bx, y: fila.y, w, h, fila: filas.length - 1, columna });
        altoFila = Math.max(altoFila, h);
        bx += w + 40;
        columna++;
      }
      cerrar();
      if (fila) by = fila.fondo + HUECO_FILAS;
    };
    raiz.append(texto(x0, 14, 'Montículo', 'rep-titulo'));
    let tituloSueltos = null;
    if (fijo) {
      for (const f of previa.filas) filas.push({ ...f });
      for (const b of visibles) {
        const pb = previa.bloques.get(b.id);
        lugares.set(b.id, { x: pb.hasta.x, y: pb.hasta.y, w: pb.w, h: pb.h, fila: pb.fila, columna: pb.columna });
      }
      by = previa.alto;
    } else {
      colocar(lista);
      if (sueltos.length) {
        tituloSueltos = by - 34;
        colocar(sueltos);
      }
      colocar(sinPuntero);
    }
    alto = Math.max(alto, by);
    const ancho = Math.max(limite + 20, ...[...lugares.values()].map((l) => l.x + l.w + 20));
    if (tituloSueltos != null) raiz.append(texto(x0, tituloSueltos, 'Sin enlazar', 'rep-subgrupo'));

    // ---- dibujar cada bloque con su origen en (0, 0): despues se lo mueve
    const bloques = new Map();
    const enLista = new Set(lista.map((b) => b.id));
    const enSueltos = new Set(sueltos.map((b) => b.id));
    for (const b of visibles) {
      const lugar = lugares.get(b.id);
      if (!lugar) continue;
      const { v, ruta } = sinEnvoltura(b.valor);
      const g = el('g', { class: 'rep-bloque-g', 'data-id': b.id });
      raiz.append(g);
      p.capa = g;
      p.bloque = b.id;
      p.dueno = { id: b.id, nombre: null, pila: false };
      const huerfano = b.vivo && !enLista.has(b.id) && !enSueltos.has(b.id);
      const clases = 'rep-bloque' + (b.vivo ? '' : ' rep-liberado') + (huerfano ? ' rep-huerfano' : '');
      g.append(el('rect', { x: 0, y: ENCABEZADO, width: lugar.w, height: lugar.h, rx: 5, class: clases }));
      g.append(texto(2, 8, String(b.dir), 'rep-direccion'));
      // El aviso va a la derecha de la direccion; si el bloque es tan chico que no entran los dos
      // (6 px por cifra, 5,6 por letra), va debajo del bloque, centrado.
      const aviso = !b.vivo ? 'liberado' : huerfano ? 'sin puntero' : '';
      if (aviso) {
        const entra = lugar.w >= String(b.dir).length * 6 + aviso.length * 5.6 + 10;
        g.append(
          entra
            ? texto(lugar.w - 2, 8, aviso, 'rep-aviso', { 'text-anchor': 'end' })
            : texto(lugar.w / 2, ENCABEZADO + lugar.h + 11, aviso, 'rep-aviso', { 'text-anchor': 'middle' })
        );
      }
      p.ancla(b.id, [], 0, ENCABEZADO, lugar.w, lugar.h);
      p.valor(v, PAD, ENCABEZADO + PAD, b.id, ruta);
      p.bloque = null;
      p.capa = raiz;
      bloques.set(b.id, { id: b.id, g, hasta: { x: lugar.x, y: lugar.y }, ...lugar });
      datos.set(b.id, { reserva: b, funcion: null, bloque: true });
    }

    // ---- las flechas: para cada una, como va en la disposicion de ahora y, si los bloques que une
    // ya estaban en el paso anterior, como iba en esa (asi se la dibuja antes de que se muevan)
    const contador = () => ({ canales: 0, carriles: new Map(), llegadas: new Map() });
    const describirEn = (f, bloquesDe, ct, marcosDe) => {
      let ancla = p.anclas.get(clave(f.a, f.ruta));
      let corrido = 0;
      // Un puntero a la posicion que sigue a la ultima: se apunta al borde de la ultima.
      if (!ancla && typeof f.ruta[f.ruta.length - 1] === 'number' && f.ruta[f.ruta.length - 1] > 0) {
        ancla = p.anclas.get(clave(f.a, [...f.ruta.slice(0, -1), f.ruta[f.ruta.length - 1] - 1]));
        corrido = ancla ? ancla.w : 0;
      }
      const lo = f.origen.bloque != null ? bloquesDe.get(f.origen.bloque) : null;
      const ld = ancla && ancla.bloque != null ? bloquesDe.get(ancla.bloque) : null;
      // Un extremo que no estaba en esa disposicion: no hay como dibujarla.
      if ((f.origen.bloque != null && !lo) || (ancla && ancla.bloque != null && !ld)) return null;
      if ((f.origen.marco != null && !marcosDe.has(f.origen.marco)) || (ancla && ancla.marco != null && !marcosDe.has(ancla.marco))) return null;
      let tipo;
      if (!ancla) tipo = 'perdida';
      else if (!lo) tipo = ld ? (ld.columna === 0 ? 'pila-izquierda' : 'pila-arriba') : 'pila-pila';
      else if (!ld) tipo = 'recta';
      else if (ld.fila === lo.fila && ld.columna === lo.columna + 1) tipo = 'recta';
      else if (ld.fila > lo.fila) tipo = 'bajo';
      else if (ld.fila < lo.fila) tipo = 'alto';
      else tipo = 'mismo';
      const d = { tipo, destino: ancla, corrido, lo, ld, ranura: 0, corrimientoEtiqueta: 0 };
      const carril = (clase, fila) => {
        const k = `${clase}:${fila}`;
        const n = ct.carriles.get(k) || 0;
        ct.carriles.set(k, n + 1);
        return n % 6;
      };
      // Varias flechas al mismo lugar: cada una entra en su ranura y su etiqueta se corre.
      if (ancla) {
        const llave = clave(f.a, f.ruta);
        const ya = ct.llegadas.get(llave) || { n: 0, etiquetas: 0 };
        d.ranura = ya.n;
        d.corrimientoEtiqueta = ya.etiquetas;
        ct.llegadas.set(llave, { n: ya.n + 1, etiquetas: ya.etiquetas + (f.nombre ? f.nombre.length * 6 + 12 : 0) });
      }
      if (tipo === 'pila-izquierda' || tipo === 'pila-pila') d.canal = ct.canales++;
      if (tipo === 'pila-arriba') {
        d.canal = ct.canales++;
        d.carril = carril('arriba', ld.fila);
      }
      if (tipo === 'bajo' || tipo === 'mismo') d.carril = carril('abajo', lo.fila);
      if (tipo === 'alto') d.carril = carril('arribaDe', lo.fila);
      return d;
    };
    const flechas = [];
    const vivosAntes = new Set(anterior ? anterior.monticulo.filter((b) => b.vivo).map((b) => b.id) : []);
    const ctFinal = contador();
    const ctPrevio = contador();
    for (const f of p.flechas) {
      const final = describirEn(f, bloques, ctFinal, marcosG);
      const previo = previa && anterior ? describirEn(f, previa.bloques, ctPrevio, previa.marcosG) : null;
      // Una flecha nueva hacia un bloque que acaba de aparecer espera al final del movimiento.
      flechas.push({ ...f, final, previo, tarde: Boolean(f.cambio && !previo), recienLiberada: Boolean(f.muerto && vivosAntes.has(f.a)) });
    }

    const svg = el('svg', {
      viewBox: `0 0 ${ancho} ${alto + 10}`,
      width: ancho,
      height: alto + 10,
      class: 'rep-svg',
      role: 'img',
      'aria-label': describir(foto),
    });
    const capaFlechas = el('g');
    svg.append(defs, raiz, capaFlechas);
    this.alAire(svg);
    // Un puntero que cambio de destino: como iba hacia el viejo (para deslizar la flecha). Un puntero
    // que dejo de apuntar (paso a NULL): una flecha que solo se ve retrayendose.
    const ctViejo = contador();
    const bloquesViejos = previa ? previa.bloques : bloques;
    const marcosViejos = previa ? previa.marcosG : marcosG;
    for (const fl of flechas) {
      if (!fl.cambio) continue;
      const prev = p.previos.get(fl.claveOrigen);
      if (!prev || (prev.a === fl.a && prev.ruta.join('/') === fl.ruta.join('/'))) continue;
      if (!p.anclas.get(clave(prev.a, prev.ruta))) continue; // el destino viejo ya no esta a la vista
      fl.viejo = describirEn({ ...fl, a: prev.a, ruta: prev.ruta }, bloquesViejos, ctViejo, marcosViejos);
    }
    const retiradas = [];
    const conFlecha = new Set(p.flechas.map((f) => f.claveOrigen));
    for (const [llave, prev] of p.previos) {
      if (!p.cambios.has(llave) || conFlecha.has(llave)) continue;
      const origen = p.anclas.get(llave);
      if (!origen || !p.anclas.get(clave(prev.a, prev.ruta))) continue;
      const r = { origen, deId: null, nombre: null, a: prev.a, ruta: prev.ruta, muerto: false, fuera: false, cambio: true, tarde: false };
      r.viejo = describirEn(r, bloquesViejos, ctViejo, marcosViejos);
      retiradas.push(r);
    }
    // Una caja de la pila que se va (termino una funcion): sus flechas se contraen hacia la casilla en
    // el mismo tiempo en que se dibujan las nuevas (la de main que recibe la direccion), y no desaparecen antes.
    if (previa && anterior) {
      for (const fp of previa.flechas) {
        const m = fp.origen.marco;
        if (m == null || marcosG.has(m) || !previa.marcosG.has(m) || !fp.final) continue;
        retiradas.push({ ...fp, deId: null, nombre: null, cambio: true, tarde: false, previo: null, viejo: fp.final, escenaOrigen: previa });
      }
    }

    return {
      svg,
      bloques,
      filas,
      retiradas,
      alto,
      marcosG,
      raiz,
      salientes: [],
      filasPrevias: previa ? previa.filas : filas,
      flechas,
      capaFlechas,
      derechaPila,
      x0,
      datos,
      cambios: p.cambios,
      previos: p.previos,
      datosAnterior: anterior ? indexar(anterior) : new Map(),
    };
  }

  // ----------------------------------------------------------------- flechas

  // Los puntos de la ruta de una flecha, con los bloques donde estan ahora.
  // "escena" es la del paso anterior para la flecha de una caja que ya se fue.
  rutaPuntos(f, d, filas, escena = this.escena) {
    const { bloques, marcosG, derechaPila } = escena;
    const absoluto = (a) => {
      if (a.bloque != null) {
        const pos = bloques.get(a.bloque).actual;
        return { x: pos.x + a.x, y: pos.y + a.y, w: a.w, h: a.h };
      }
      // Una casilla de la pila va con su caja, que puede estar subiendo o bajando.
      if (a.marco != null) return { x: a.x, y: a.y + marcosG.get(a.marco).actual.y, w: a.w, h: a.h };
      return a;
    };
    const S = absoluto(f.origen);
    const sx = S.x + S.w / 2;
    const sy = S.y + S.h / 2;
    if (d.tipo === 'perdida') {
      // Apunta a algo que ya no esta (una variable de una funcion que termino).
      return [{ x: sx, y: sy }, { x: sx + 34, y: sy }];
    }
    const t0 = absoluto(d.destino);
    const T = { x: t0.x + d.corrido, y: t0.y, w: t0.w, h: t0.h };
    const tx = T.x + T.w / 2;
    const ty = T.y + T.h / 2;
    switch (d.tipo) {
      case 'pila-izquierda': {
        const cx = derechaPila + 10 + 6 * d.canal;
        const yy = ty + 6 * Math.min(d.ranura, 4);
        return [{ x: S.x + S.w, y: sy }, { x: cx, y: sy }, { x: cx, y: yy }, { x: T.x, y: yy }];
      }
      case 'pila-arriba': {
        const cx = derechaPila + 10 + 6 * d.canal;
        const lane = filas[d.ld.fila].y - 6 - 6 * d.carril;
        const xx = tx + 8 * Math.min(d.ranura, 3);
        return [{ x: S.x + S.w, y: sy }, { x: cx, y: sy }, { x: cx, y: lane }, { x: xx, y: lane }, { x: xx, y: T.y }];
      }
      case 'pila-pila': {
        const cx = derechaPila + 8 + 6 * d.canal;
        const yy = ty + 6 * Math.min(d.ranura, 4);
        return [{ x: S.x + S.w, y: sy }, { x: cx, y: sy }, { x: cx, y: yy }, { x: T.x + T.w, y: yy }];
      }
      case 'recta': {
        const x1 = S.x + S.w;
        return Math.abs(ty - sy) < 3 ? [{ x: x1, y: sy }, { x: T.x, y: sy }] : [{ x: x1, y: sy }, { x: x1 + 16, y: sy }, { x: T.x - 16, y: ty }, { x: T.x, y: ty }];
      }
      case 'bajo': {
        const lane = filas[d.lo.fila].fondo + 10 + 6 * d.carril;
        return [{ x: sx, y: S.y + S.h }, { x: sx, y: lane }, { x: tx, y: lane }, { x: tx, y: T.y }];
      }
      case 'mismo': {
        const lane = filas[d.lo.fila].fondo + 10 + 6 * d.carril;
        return [{ x: sx, y: S.y + S.h }, { x: sx, y: lane }, { x: tx, y: lane }, { x: tx, y: T.y + T.h }];
      }
      default: {
        // 'alto': hacia una fila de arriba
        const lane = filas[d.lo.fila].y - 6 - 6 * d.carril;
        return [{ x: sx, y: S.y }, { x: sx, y: lane }, { x: tx, y: lane }, { x: tx, y: T.y + T.h }];
      }
    }
  }

  // El grupo de dibujo de una flecha: la zona para senalarla, el trazo y, si corresponde, su nombre.
  grupoDeFlecha(f, d, puntos, indice) {
    const fin = puntos[puntos.length - 1];
    const g = el('g', { class: 'rep-flecha-g' + (f.cambio ? ' rep-nueva' : '') + (f.tarde ? ' rep-tarde' : ''), 'data-o': f.deId, 'data-d': f.a, 'data-i': indice });
    // Una flecha nueva hacia un bloque que acaba de aparecer espera a que termine el movimiento.
    if (f.tarde && this.fase !== 'FIN') g.style.opacity = '0';
    // Punteada y roja: apunta a algo que no esta (una variable que ya no existe) o fuera del arreglo.
    // Continua y roja: apunta a un bloque liberado (el puntero sigue apuntando, pero la memoria ya no es suya).
    const punteada = f.fuera || d.tipo === 'perdida';
    const liberada = f.muerto && d.tipo !== 'perdida';
    const marcaNormal = f.cambio ? 'url(#rep-punta-nueva)' : 'url(#rep-punta)';
    const trazado = camino(puntos);
    // Un trazo invisible y ancho, para poder senalarla con el cursor o con el dedo.
    g.append(el('path', { d: trazado, class: 'rep-flecha-zona' }));
    g.append(
      el('path', {
        d: trazado,
        class: 'rep-flecha' + (punteada ? ' rep-flecha-mala' : liberada ? ' rep-flecha-liberada' : ''),
        'marker-end': punteada || liberada ? 'url(#rep-punta-mala)' : marcaNormal,
      })
    );
    // En el paso en que se libera el bloque, la flecha pasa de azul a rojo con un fundido.
    if (liberada && f.recienLiberada && this.fundir && this.fase === 'FIN') {
      g.append(el('path', { d: trazado, class: 'rep-flecha rep-fundido', 'marker-end': 'url(#rep-punta)' }));
    }
    if (d.tipo === 'perdida') g.append(texto(fin.x + 6, fin.y + 4, '?', 'rep-aviso'));
    // El nombre de la variable de la que sale, junto a la punta.
    if (f.nombre && d.tipo !== 'perdida') {
      const w = f.nombre.length * 6 + 8;
      const previoPunto = puntos[puntos.length - 2];
      const vertical = Math.abs(previoPunto.x - fin.x) < 1;
      // Si la flecha llega desde la derecha, el nombre va a la derecha de la punta; si no, a la izquierda.
      const deLaDerecha = !vertical && previoPunto.x > fin.x;
      const corr = d.corrimientoEtiqueta;
      const bx = vertical ? fin.x + 5 + corr : deLaDerecha ? fin.x + 8 + corr : fin.x - w - 8 - corr;
      const by = vertical ? fin.y - (previoPunto.y < fin.y ? 20 : -8) : fin.y - 17;
      const rotulo = el('g', { class: 'rep-etiqueta-g' });
      rotulo.append(el('rect', { x: bx, y: by, width: w, height: 13, rx: 3, class: 'rep-etiqueta' + (f.cambio ? ' rep-etiqueta-nueva' : '') }));
      rotulo.append(texto(bx + w / 2, by + 10, f.nombre, 'rep-etiqueta-texto', { 'text-anchor': 'middle' }));
      g.append(rotulo);
    }
    return g;
  }

  pintarFlechas() {
    const { flechas, capaFlechas } = this.escena;
    const antes = this.fase === 'A';
    const filas = antes ? this.escena.filasPrevias : this.escena.filas;
    const hijos = [];
    flechas.forEach((f, indice) => {
      const d = antes ? f.previo : f.final;
      if (!d) return;
      let puntos = this.rutaPuntos(f, d, filas);
      if (this.animandoA && f.cambio) {
        // La flecha que cambio: si iba a otro lado, la punta se desliza del destino viejo al nuevo;
        // si no iba a ninguno, se va dibujando.
        if (f.viejo) puntos = unir(this.rutaPuntos(f, f.viejo, filas), puntos, this.kA);
        else puntos = recortar(puntos, largoDe(puntos) * this.kA);
        if (!puntos) return;
      }
      hijos.push(this.grupoDeFlecha(f, d, puntos, indice));
    });
    // Un puntero que paso a NULL: su flecha se retrae hacia la casilla.
    if (this.animandoA) {
      for (const r of this.escena.retiradas) {
        if (!r.viejo) continue;
        const completa = this.rutaPuntos(r, r.viejo, filas, r.escenaOrigen || this.escena);
        const puntos = recortar(completa, largoDe(completa) * (1 - this.kA));
        if (puntos) hijos.push(this.grupoDeFlecha(r, r.viejo, puntos, -1));
      }
    }
    capaFlechas.replaceChildren(...hijos);
    for (const trazo of capaFlechas.querySelectorAll('.rep-fundido')) {
      if (trazo.animate) trazo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: 'ease-in', fill: 'forwards' });
    }
    this.aplicarEnfoque();
  }

  // ------------------------------------------------------------------ cursor

  alAire(svg) {
    const idDe = (e) => {
      const g = e.target.closest ? e.target.closest('[data-id]') : null;
      return g ? Number(g.getAttribute('data-id')) : null;
    };
    const flechaDe = (e) => {
      const g = e.target.closest ? e.target.closest('.rep-flecha-g') : null;
      return g ? Number(g.getAttribute('data-i')) : null;
    };
    // Con el dedo no hay cursor: un toque describe y otro toque (o fuera) cierra.
    svg.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      const i = flechaDe(e);
      if (i != null) {
        this.enfocarFlecha(i === this.enfoqueFlecha ? null : i, e);
        return;
      }
      const id = idDe(e);
      if (id == null || id === this.enfoque) this.enfocar(null);
      else this.enfocar(id, e);
    });
    svg.addEventListener('pointerover', (e) => {
      if (e.pointerType === 'touch') return;
      const i = flechaDe(e);
      if (i != null) {
        if (i !== this.enfoqueFlecha) this.enfocarFlecha(i, e);
        return;
      }
      const id = idDe(e);
      if (id != null && id !== this.enfoque) this.enfocar(id, e);
    });
    svg.addEventListener('pointermove', (e) => {
      if (this.enfoque != null || this.enfoqueFlecha != null) this.ubicarTip(e);
    });
    svg.addEventListener('pointerout', (e) => {
      if (e.pointerType === 'touch') return;
      const a = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('[data-id], .rep-flecha-g') : null;
      if (!a) this.enfocar(null);
    });
    svg.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'touch') this.enfocar(null);
    });
    // Un clic en una flecha la deja fija (con su nombre y resaltada) hasta otro clic.
    svg.addEventListener('click', (e) => {
      const i = flechaDe(e);
      this.fijada = i != null && i !== this.fijada ? i : null;
      this.aplicarEnfoque();
    });
  }

  enfocar(id, e = null) {
    this.enfoque = id;
    this.enfoqueFlecha = null;
    this.aplicarEnfoque();
    if (id == null) {
      this.tip.hidden = true;
      return;
    }
    const d = this.datos.get(id);
    if (!d) return;
    // El cuadro va sobre la pagina, no dentro del recuadro de la figura (que se desplaza).
    if (!this.tip.isConnected) document.body.append(this.tip);
    this.tip.replaceChildren(...this.descripcionLarga(d));
    this.tip.hidden = false;
    if (e) this.ubicarTip(e);
  }

  enfocarFlecha(i, e = null) {
    this.enfoque = null;
    this.enfoqueFlecha = i;
    this.aplicarEnfoque();
    if (i == null) {
      this.tip.hidden = true;
      return;
    }
    if (!this.tip.isConnected) document.body.append(this.tip);
    this.tip.replaceChildren(...this.descripcionFlecha(this.escena.flechas[i]));
    this.tip.hidden = false;
    if (e) this.ubicarTip(e);
  }

  aplicarEnfoque() {
    const { svg, capaFlechas } = this.escena;
    const hay = this.enfoque != null || this.enfoqueFlecha != null || this.fijada != null;
    svg.classList.toggle('rep-enfoque', hay);
    for (const g of svg.querySelectorAll('.rep-foco, .rep-relacionado')) g.classList.remove('rep-foco', 'rep-relacionado');
    const propio = this.enfoque != null ? svg.querySelector(`[data-id="${this.enfoque}"]`) : null;
    if (propio) propio.classList.add('rep-foco');
    for (const g of capaFlechas.children) {
      const i = Number(g.getAttribute('data-i'));
      const o = g.getAttribute('data-o');
      const d = g.getAttribute('data-d');
      const deLoEnfocado = this.enfoque != null && (Number(o) === this.enfoque || Number(d) === this.enfoque);
      const viva = deLoEnfocado || i === this.enfoqueFlecha || i === this.fijada;
      g.classList.toggle('rep-viva', viva);
      if (viva) {
        // Lo que la flecha une tambien se marca.
        for (const id of [o, d]) {
          const otro = svg.querySelector(`[data-id="${id}"]`);
          if (otro && otro !== propio) otro.classList.add('rep-relacionado');
        }
      }
    }
  }

  ubicarTip(e) {
    const margen = 14;
    const ancho = this.tip.offsetWidth;
    const alto = this.tip.offsetHeight;
    let x = e.clientX + margen;
    let y = e.clientY + margen;
    // Si se sale de la ventana, pasa al otro lado del cursor.
    if (x + ancho > window.innerWidth - 8) x = Math.max(8, e.clientX - ancho - margen);
    if (y + alto > window.innerHeight - 8) y = Math.max(8, e.clientY - alto - margen);
    this.tip.style.left = `${x}px`;
    this.tip.style.top = `${y}px`;
  }

  // Lo que se dice de una flecha: de donde sale y a donde va.
  descripcionFlecha(f) {
    const datos = this.escena.datos;
    const nodo = (clase, contenido) => {
      const e = document.createElement('div');
      e.className = clase;
      e.textContent = contenido;
      return e;
    };
    const camino = (ruta) => ruta.map((x) => (typeof x === 'number' ? `[${x}]` : `.${x}`)).join('');
    const origen = datos.get(f.deId);
    let desde;
    if (!origen) desde = 'un puntero';
    else if (!origen.bloque) desde = `${f.nombre || origen.reserva.nombre}${origen.funcion ? ` de ${origen.funcion}` : ''}`;
    else {
      const r = origen.reserva.valor && origen.reserva.valor.k === 'arr' && origen.reserva.valor.elems.length === 1 ? f.rutaOrigen.slice(1) : f.rutaOrigen;
      desde = `${camino(r).replace(/^\./, '') || 'el puntero'} del bloque en ${origen.reserva.dir}`;
    }
    const destino = datos.get(f.a);
    const nombreDe = (d) => (d ? (d.bloque ? `el bloque en ${d.reserva.dir}` : `la variable ${d.reserva.nombre}${d.funcion ? ` de ${d.funcion}` : ''}`) : 'algo que ya no existe');
    const lineas = [nodo('rep-tip-titulo', `${desde} → ${nombreDe(destino)}`)];
    if (destino && destino.bloque && !destino.reserva.vivo) lineas.push(nodo('rep-tip-valor', 'El bloque ya está liberado.'));
    if (f.cambio) {
      const llave = f.deId != null ? clave(f.deId, f.rutaOrigen) : null;
      const previo = llave ? this.escena.previos.get(llave) : null;
      lineas.push(nodo('rep-tip-valor', 'Cambió con la línea anterior' + (previo ? `; antes apuntaba a ${nombreDe(this.escena.datosAnterior.get(previo.a))}` : '') + '.'));
    }
    return lineas;
  }

  // Lo que se dice de una variable o un bloque: el nombre, el tipo, la direccion y el contenido.
  descripcionLarga(d) {
    const r = d.reserva;
    const nodo = (clase, contenido) => {
      const e = document.createElement('div');
      e.className = clase;
      e.textContent = contenido;
      return e;
    };
    const titulo = d.bloque ? `Bloque reservado con malloc${r.vivo ? '' : ' (liberado)'}` : `${r.nombre}${r.pendiente ? ' (todavía no declarada)' : ''}`;
    const datosTexto = [];
    if (r.tipo) datosTexto.push(r.tipo);
    if (r.dir != null) datosTexto.push(`dirección ${r.dir}`);
    if (r.tam != null) datosTexto.push(`${r.tam} ${r.tam === 1 ? 'byte' : 'bytes'}`);
    if (d.funcion && !d.bloque) datosTexto.push(`en ${d.funcion}`);
    return [nodo('rep-tip-titulo', titulo), nodo('rep-tip-datos', datosTexto.join(' · ')), ...this.contenido(r.valor, '', r.id, []).map((l) => nodo('rep-tip-valor', l))];
  }

  // El contenido de un valor, una linea por parte: "dato: 20", "sig: apunta al bloque en 5000".
  // Un puntero que cambio con la linea anterior dice adonde apuntaba antes.
  contenido(v, sangria, id = null, ruta = []) {
    const caminoTexto = (r) => r.map((x) => (typeof x === 'number' ? `[${x}]` : `.${x}`)).join('');
    // Con la preposicion: "al bloque en 5016", "a la variable lista".
    const nombreDe = (d) => (d ? (d.bloque ? `al bloque en ${d.reserva.dir}` : `a la variable ${d.reserva.nombre}`) : 'a algo que ya no existe');
    const antes = (r) => {
      const llave = id != null ? clave(id, r) : null;
      const previo = llave && this.escena.cambios.has(llave) ? this.escena.previos.get(llave) : null;
      return previo ? ` (antes apuntaba ${nombreDe(this.escena.datosAnterior.get(previo.a))})` : '';
    };
    const decir = (c, r) => {
      switch (c.k) {
        case 'num':
          return c.t === 'char' && c.v >= 32 && c.v < 127 ? `'${String.fromCharCode(c.v)}' (código ${c.v})` : String(Number.isInteger(c.v) ? c.v : Number(c.v.toFixed(6)));
        case 'sinvalor':
          return 'todavía sin valor';
        case 'nulo':
          return `NULL: no apunta a nada${antes(r)}`;
        case 'ptr': {
          const dest = this.escena.datos.get(c.a);
          const campo = c.ruta.length && dest && !dest.bloque ? ` (${caminoTexto(c.ruta)})` : '';
          return `apunta ${nombreDe(dest)}${campo}${dest && dest.bloque && !dest.reserva.vivo ? ', que ya está liberado' : ''}${antes(r)}`;
        }
        default:
          return '';
      }
    };
    if (esCadena(v)) return [`${sangria}"${v.texto}"`];
    if (v.k === 'est') {
      return v.campos.flatMap((c) => {
        const r = [...ruta, c.n];
        return c.v.k === 'est' || (c.v.k === 'arr' && !esCadena(c.v)) ? [`${sangria}${c.n}:`, ...this.contenido(c.v, sangria + '  ', id, r)] : [`${sangria}${c.n}: ${esCadena(c.v) ? `"${c.v.texto}"` : decir(c.v, r)}`];
      });
    }
    if (v.k === 'arr') {
      const lineas = v.elems.slice(0, 20).flatMap((e, i) => {
        const r = [...ruta, i];
        return e.k === 'est' ? [`${sangria}[${i}]:`, ...this.contenido(e, sangria + '  ', id, r)] : [`${sangria}[${i}]: ${decir(e, r)}`];
      });
      if (v.elems.length > 20) lineas.push(`${sangria}… (${v.elems.length} posiciones)`);
      return lineas;
    }
    return [`${sangria}${decir(v, ruta)}`];
  }
}

// Una figura suelta, sin animacion ni recuerdo del paso anterior: para probar y para usos simples.
export function dibujarFotografia(foto, anterior = null, opciones = {}) {
  const contenedor = document.createElement('div');
  const figura = new Figura(contenedor, opciones);
  figura.mostrar(foto, anterior, { animar: false });
  return figura.svg;
}

// El texto que lee un lector de pantalla: las variables y sus valores.
export function describir(foto) {
  const decir = (v) => {
    switch (v.k) {
      case 'num':
        return etiqueta(v);
      case 'sinvalor':
        return 'sin valor';
      case 'nulo':
        return 'NULL';
      case 'ptr':
        return `apunta a la reserva ${v.a}${v.muerto ? ' que ya no existe' : ''}`;
      case 'est':
        return v.campos.map((c) => `${c.n}: ${decir(c.v)}`).join(', ');
      default:
        return esCadena(v) ? `"${v.texto}"` : v.elems.map(decir).join(', ');
    }
  };
  const partes = [];
  for (const m of foto.marcos) {
    partes.push(`En ${m.funcion}: ` + (m.variables.filter((v) => !v.pendiente).map((v) => `${v.nombre} ${decir(v.valor)}`).join('; ') || 'sin variables'));
  }
  if (foto.monticulo.length) partes.push('Montículo: ' + foto.monticulo.map((b) => `${b.dir} ${b.vivo ? '' : '(liberado) '}${decir(b.valor)}`).join('; '));
  return partes.join('. ');
}
