// La figura de la memoria: dibuja una fotografia de la traza (ver traza.js) como un
// SVG. A la izquierda la pila, con una caja por cada funcion en curso y una casilla
// por variable; a la derecha el montículo, con los bloques en tres grupos:
//
//   la lista       lo que se alcanza desde las "cabezas" (en el orden en que se llega,
//                  asi una lista queda de izquierda a derecha)
//   sin enlazar    bloques que solo senalan variables de la funcion en curso (el nodo que
//                  se acaba de crear): se unen a la lista cuando algo de afuera los senala.
//                  Van en una fila aparte, sin titulo (los rotulos son para lo anomalo)
//   inalcanzable   bloques a los que no llega ninguna variable, aunque otro bloque (tambien perdido) los senale
//                  (una fuga), en punteado
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
// puntero pasa a NULL, se desvanece), una pausa con todo quieto, y los bloques se reubican; tambien las
// cajas de la pila: la de una funcion que termina se cierra (de abajo hacia arriba) y las de abajo suben, y la de una
// llamada se abre (de arriba hacia abajo) y las de abajo bajan. mostrar() devuelve
// cuanto dura todo, para que quien reproduce espere. Los nombres de las flechas se ven si se
// pide (fijarNombres), o al senalar una flecha, una variable o un bloque; un clic en una flecha la deja fija. Adonde apuntaba antes un
// puntero que cambio se dice en la descripcion al pasar el cursor. Los colores salen de las
// variables de css/estilo.css.

const NS = 'http://www.w3.org/2000/svg';
let contadorDeCortes = 0; // para dar un id distinto a cada recorte de una caja que se abre o se cierra
// Lo que no interviene en un paso (las flechas de afuera) se atenua hasta esta opacidad.
import { tiempo } from './tiempo.js';

const ATENUADO = 0.38;
// Un parpadeo: aparece, casi se apaga y vuelve a aparecer.
// Algo que aparece, se queda y se va (el & de la direccion de una variable).
const APARECE = [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }];
// Un pulso: se enciende, se queda un momento y se apaga. Los de una llamada (planDeLlamada) usan este y no el parpadeo.
const PULSO = [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }];
const PARPADEO = [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0.1, offset: 0.45 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }];
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
      if (v.enum) return v.enum;
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

// Una casilla de puntero mide siempre lo mismo (CW), guarde una direccion (el punto), NULL o nada: asi no cambia de
// tamano, ni el bloque que la contiene, cuando el puntero recibe una direccion.
const anchoDeCasilla = (v) => (v.k === 'ptr' ? CW : Math.max(CW, etiqueta(v).length * LETRA + 14));

// Una cadena: todo el texto en una sola casilla.
const esCadena = (v) => v.k === 'arr' && v.texto !== undefined;
const anchoDeCadena = (v) => Math.max(CW, (v.texto.length + 2) * LETRA + 14);

// Un bloque de una sola posicion (lo que da malloc(sizeof(T))) se dibuja sin el arreglo.
function sinEnvoltura(valor) {
  return valor.k === 'arr' && valor.elems.length === 1 && !esCadena(valor) ? { v: valor.elems[0], ruta: [0] } : { v: valor, ruta: [] };
}

// ---- un arreglo de estructuras se dibuja como una tabla: una fila por elemento, con su indice a la izquierda, y los nombres de los campos una sola
// vez, arriba (una estructura dentro de otra es un grupo de columnas con su nombre encima). Asi ocupa el ancho de UNA estructura y crece hacia abajo.
const ANCHO_INDICE = 22;
const FILAS_MINIMAS = 8; // las filas que se dibujan aunque no tengan valor (si hay mas elementos, un "…")
const LINEA_ROTULO = 13; // lo que ocupa una linea de nombres de campos
const esTabla = (v) => v.k === 'arr' && !esCadena(v) && v.elems.length > 0 && v.elems.every((e) => e.k === 'est');
// Una cadena sin valor (todas sus letras sin valor) se dibuja en la tabla como una sola casilla "?": si no, ensancharia la columna entera.
const esCadenaSinValor = (v) => v.k === 'arr' && !esCadena(v) && v.elems.length > 0 && v.elems.every((e) => e.k === 'sinvalor' && e.t === 'char');
const hojaDeTabla = (v) => (esCadenaSinValor(v) ? { k: 'sinvalor', t: 'char' } : v);
// ¿Alguna parte de este valor ya recibio un valor?
const tieneValor = (v) => (v.k === 'sinvalor' ? false : v.k === 'est' ? v.campos.some((c) => tieneValor(c.v)) : v.k === 'arr' ? v.elems.some(tieneValor) : true);
// Cuantas filas se dibujan: 8 (casi nunca se usan mas) o hasta la ultima que ya recibio algun valor, con un tope.
const filasDeTabla = (v) => {
  let ultima = -1;
  v.elems.forEach((e, i) => {
    if (tieneValor(e)) ultima = i;
  });
  return Math.min(v.elems.length, MAX_ELEMENTOS, Math.max(FILAS_MINIMAS, ultima + 1));
};

// Las columnas de las estructuras de una tabla: [{ n, j, hoja, w }] o, si el campo es una estructura, [{ n, j, hijos }]. "elems" son los valores de ese nivel.
function columnasDe(elems) {
  return elems[0].campos.map((c, j) => {
    if (c.v.k === 'est') return { n: c.n, j, hijos: columnasDe(elems.map((e) => e.campos[j].v)) };
    const medidas = elems.map((e) => medir(hojaDeTabla(e.campos[j].v)));
    return { n: c.n, j, hoja: true, w: Math.max(c.n.length * 6 + 8, ...medidas.map((m) => m.w)), h: Math.max(...medidas.map((m) => m.h)) };
  });
}
const altoDeColumna = (c) => (c.hoja ? 1 : 1 + Math.max(...c.hijos.map(altoDeColumna)));
function anchoDeColumna(c) {
  if (c.hoja) return c.w;
  const suma = c.hijos.reduce((s, h) => s + anchoDeColumna(h), 0) + (c.hijos.length - 1) * (PAD / 2);
  const falta = c.n.length * 6 + 8 - suma;
  if (falta > 0) {
    // el nombre del grupo es mas ancho que sus columnas: la ultima columna se ensancha
    let u = c.hijos[c.hijos.length - 1];
    while (!u.hoja) u = u.hijos[u.hijos.length - 1];
    u.w += falta;
    return suma + falta;
  }
  return suma;
}
const alturaDeFila = (columnas) => Math.max(CH, ...columnas.map((c) => (c.hoja ? c.h : alturaDeFila(c.hijos))));

function disenoDeTabla(v) {
  const n = filasDeTabla(v);
  const columnas = columnasDe(v.elems.slice(0, n));
  const lineas = Math.max(...columnas.map(altoDeColumna));
  const ancho = columnas.reduce((s, c) => s + anchoDeColumna(c), 0) + (columnas.length - 1) * (PAD / 2);
  const fila = alturaDeFila(columnas) + 4;
  return { n, columnas, lineas, ancho, fila };
}

function medirTabla(v) {
  const t = disenoDeTabla(v);
  return { w: Math.max(ANCHO_INDICE + t.ancho, CW), h: t.lineas * LINEA_ROTULO + t.n * t.fila - 4 + (v.elems.length > t.n ? 16 : 0) };
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
  if (esTabla(v)) return medirTabla(v);
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
    else if (esCadena(v)) plano.set(clave(id, ruta), `c${v.texto}`); // (una cadena es una sola casilla: cambia cuando cambia su texto)
    else if (v.k === 'arr') {
      // (una cadena sin valor, dentro de una tabla, tambien es una sola casilla)
      if (esCadenaSinValor(v)) plano.set(clave(id, ruta), 'cs');
      v.elems.forEach((e, i) => recorrer(e, id, [...ruta, i]));
    }
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
    else if (v.k === 'ptr') mapa.set(clave(id, ruta), { a: v.a, ruta: v.ruta, muerto: Boolean(v.muerto) });
  };
  for (const r of [...foto.globales, ...foto.marcos.flatMap((m) => m.variables), ...foto.monticulo]) recorrer(r.valor, r.id, []);
  return mapa;
}

// Las casillas de punteros que no tienen direccion (se dibujan con su flecha a un "?" si la ayuda esta encendida).
function inciertosDe(foto) {
  const conjunto = new Set();
  const recorrer = (v, id, ruta) => {
    if (v.k === 'est') v.campos.forEach((c) => recorrer(c.v, id, [...ruta, c.n]));
    else if (v.k === 'arr') v.elems.forEach((e, i) => recorrer(e, id, [...ruta, i]));
    else if (v.k === 'sinvalor' && v.ptr) conjunto.add(clave(id, ruta));
  };
  for (const r of [...foto.globales, ...foto.marcos.flatMap((m) => m.variables), ...foto.monticulo]) recorrer(r.valor, r.id, []);
  return conjunto;
}

// ¿Hay algun puntero (con direccion, NULL o sin direccion) en este valor?
function tienePuntero(v) {
  if (v.k === 'ptr' || v.k === 'nulo' || (v.k === 'sinvalor' && v.ptr)) return true;
  if (v.k === 'est') return v.campos.some((c) => tienePuntero(c.v));
  if (v.k === 'arr') return v.elems.some(tienePuntero);
  return false;
}

// La clave de una casilla (id|ruta) de vuelta como id y ruta.
function desdeClave(k) {
  const [id, ruta] = k.split('|');
  return { id: Number(id), ruta: ruta ? ruta.split('/').map((x) => (/^\d+$/.test(x) ? Number(x) : x)) : [] };
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

// Un valor sin contenido (para una variable que todavia no se declaro): conserva la forma.
function vaciar(v) {
  if (v.k === 'est') return { ...v, campos: v.campos.map((c) => ({ n: c.n, v: vaciar(c.v) })) };
  if (v.k === 'arr') return { ...v, elems: v.elems.map(vaciar), texto: undefined };
  return { k: 'sinvalor', t: v.t || 'puntero' };
}

// Cuando en este paso una caja de la pila gana variables (se entra a un bloque y se declara una local), la fotografia
// anterior con esas variables ya en su caja, todavia sin declarar (atenuadas): la caja se agranda y las de abajo se
// corren antes de cualquier otra animacion. Si ninguna caja gana variables (o hay otros cambios en la pila), null.
function fotoConLugar(foto, anterior) {
  if (foto.marcos.length !== anterior.marcos.length) return null;
  let crece = false;
  const marcos = [];
  for (let i = 0; i < foto.marcos.length; i++) {
    const nuevo = foto.marcos[i];
    const viejo = anterior.marcos[i];
    if (nuevo.funcion !== viejo.funcion) return null;
    if (nuevo.variables.length < viejo.variables.length) return null;
    const delViejo = new Map(viejo.variables.map((v) => [v.nombre, v]));
    if (viejo.variables.some((v) => !nuevo.variables.some((x) => x.nombre === v.nombre))) return null;
    if (nuevo.variables.length > viejo.variables.length) crece = true;
    const variables = nuevo.variables.map((v) =>
      delViejo.get(v.nombre) || { ...v, id: -(v.id + 1000000), pendiente: true, vivo: true, dir: null, tam: null, valor: vaciar(v.valor) }
    );
    marcos.push({ ...viejo, variables });
  }
  if (!crece) return null;
  return { ...anterior, marcos, accesos: undefined, escrituras: undefined, condicion: undefined, muestra: undefined, lectura: undefined, error: undefined };
}

// Las casillas que se encienden en violeta en este paso: de las que salieron los valores de un printf y las que recibieron los de
// un scanf.
function enciende(foto) {
  const celdas = [...(foto.muestra ? foto.muestra.celdas : []), ...(foto.lectura ? foto.lectura.celdas : [])];
  return celdas.length ? { celdas } : null;
}

// Cuando en este paso se reserva un bloque (malloc) y ademas se recorre una flecha (*p = malloc(...), p->sig = malloc(...)):
// la fotografia anterior con el bloque ya puesto y sin ninguna flecha nueva. El bloque aparece primero (es lo que C hace
// primero: malloc, y despues busca donde guardar la direccion) y, desde ahi, el paso de verdad: el recorrido y la flecha,
// que si el puntero ya apuntaba a algo se redirige (el bloque ya existe en la figura de partida). Si no, null.
function fotoConBloque(foto, anterior) {
  const antes = new Set(anterior.monticulo.map((b) => b.id));
  const nuevos = foto.monticulo.filter((b) => b.vivo && !antes.has(b.id));
  if (!nuevos.length) return null;
  if (!(foto.accesos || []).some((h) => h.de)) return null;
  // ("enCamino": los bloques recien reservados, que van a recibir su flecha en el paso de verdad: todavia no estan "inalcanzables")
  return { ...anterior, monticulo: [...anterior.monticulo, ...nuevos], enCamino: nuevos.map((b) => b.id), accesos: undefined, escrituras: undefined, condicion: undefined, pregunta: undefined, muestra: undefined, lectura: undefined, error: undefined };
}

// Cuando en este paso algo sale de su ambito (termina una funcion, o un bloque { } con variables que tienen punteros) a la vez que la
// sentencia hace algo, el efecto va primero: la fotografia de ahora con lo que sale todavia en su lugar (la caja de la funcion que
// termina, las variables del bloque). Desde ahi, el paso siguiente las desvanece y la pila se acomoda. Los pasos con una condicion
// (pregunta o condicion) y los que no sacan nada, o solo numeros, se animan de una vez: null.
function fotoConSalida(foto, anterior) {
  if (foto.pregunta || foto.condicion || foto.error) return null;
  let sale = false;
  // Las variables a las que apunta algun puntero: si una de ellas sale (la local de un bloque o de una funcion), se ve
  // primero que el puntero la alcanza y despues que ella se va.
  const apuntados = new Set();
  for (const r of [...foto.globales, ...foto.marcos.flatMap((m) => m.variables), ...foto.monticulo.filter((b) => b.vivo)]) for (const p of punterosDe(r.valor)) apuntados.add(p.a);
  // Lo ultimo que valian las que salen (la sentencia pudo cambiarlas justo antes: y = 4;), y ahi siguen vivas.
  const ultimos = new Map((foto.salieron || []).map((v) => [v.id, { ...v, vivo: true, muerte: null }]));
  const vuelven = new Set();
  const reponer = (v) => {
    vuelven.add(v.id);
    return ultimos.get(v.id) || v;
  };
  const marcos = [];
  for (let i = 0; i < anterior.marcos.length; i++) {
    const viejo = anterior.marcos[i];
    const nuevo = foto.marcos[i];
    if (!nuevo) {
      marcos.push({ ...viejo, variables: viejo.variables.map((v) => (v.pendiente ? v : reponer(v))) }); // la caja de una funcion que termina
      sale = true;
      continue;
    }
    if (nuevo.funcion !== viejo.funcion) return null;
    const idsNuevos = new Set(nuevo.variables.map((v) => v.id));
    const salen = viejo.variables.filter((v) => !v.pendiente && !idsNuevos.has(v.id));
    if (!salen.length) {
      marcos.push(nuevo);
      continue;
    }
    if (salen.some((v) => tienePuntero(v.valor) || apuntados.has(v.id))) sale = true;
    const variables = nuevo.variables.slice();
    for (const v of salen) {
      // en su lugar: despues de la que la precedia en la caja de antes
      let lugar = 0;
      for (let k = viejo.variables.indexOf(v) - 1; k >= 0; k--) {
        const en = variables.findIndex((x) => x.id === viejo.variables[k].id);
        if (en >= 0) {
          lugar = en + 1;
          break;
        }
      }
      variables.splice(lugar, 0, reponer(v));
    }
    marcos.push({ ...nuevo, variables });
  }
  if (!sale) return null;
  // Un puntero a una de las que vuelven apunta a algo que, en este momento, todavia esta: no es "muerto" (rojo) hasta el segundo tiempo.
  const reviva = (v) => {
    if (v.k === 'ptr') return v.muerto && vuelven.has(v.a) ? { ...v, muerto: false } : v;
    if (v.k === 'est') return { ...v, campos: v.campos.map((c) => ({ ...c, v: reviva(c.v) })) };
    if (v.k === 'arr') return { ...v, elems: v.elems.map(reviva) };
    return v;
  };
  const conValor = (r) => ({ ...r, valor: reviva(r.valor) });
  return {
    ...foto,
    globales: foto.globales.map(conValor),
    marcos: marcos.map((m) => ({ ...m, variables: m.variables.map(conValor) })),
    monticulo: foto.monticulo.map(conValor),
  };
}

// Los bloques que se ven: los reservados, el que se libera en este paso, los liberados que algun
// puntero (de una variable o de un bloque en uso) todavia senala y los ultimos liberados, que quedan
// a la vista (con su aviso) aunque el puntero ya sea NULL: la memoria liberada no desaparece.
const MAX_LIBERADOS = 4;
function bloquesVisibles(foto, anterior) {
  const apuntados = new Set();
  const fuentes = [...foto.globales, ...foto.marcos.flatMap((m) => m.variables), ...foto.monticulo.filter((b) => b.vivo)];
  for (const r of fuentes) for (const p of punterosDe(r.valor)) apuntados.add(p.a);
  const vivosAntes = new Set(anterior ? anterior.monticulo.filter((b) => b.vivo).map((b) => b.id) : []);
  const recientes = new Set(foto.monticulo.filter((b) => !b.vivo).slice(-MAX_LIBERADOS).map((b) => b.id));
  return foto.monticulo.filter((b) => b.vivo || apuntados.has(b.id) || vivosAntes.has(b.id) || recientes.has(b.id));
}

// Reparte los bloques visibles en la lista, los sin enlazar y los inalcanzables.
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
  constructor(foto, anterior, ayudas = {}) {
    this.ayudas = ayudas; // las ayudas visuales (ver js/ajustes.js): aqui, las que cambian como se dibuja una casilla
    this.capa = el('g');
    this.anclas = new Map();
    this.flechas = [];
    this.cambios = new Set();
    this.enTabla = 0; // cuantas tablas (arreglos de estructuras) se estan dibujando
    this.rectas = new Map(); // el rectangulo de cada casilla, por su clave (para marcar a la que apunta una flecha de la pila)
    this.bloque = null; // el bloque que se esta dibujando (las coordenadas son locales)
    this.marco = null; // la caja de la pila que se esta dibujando (las coordenadas son locales a ella)
    this.dueno = null;
    this.previos = anterior ? destinosDe(anterior) : new Map();
    this.eraNulo = new Set(); // las casillas que en el paso anterior valian NULL
    this.ahoraNulo = new Set(); // y las que valen NULL ahora
    this.eraIncierto = new Set(); // las casillas de punteros que antes no tenian direccion (con la ayuda, su flecha iba a un "?")
    if (anterior) {
      const antes = planoDe(anterior);
      for (const [k, v] of planoDe(foto)) {
        if (antes.get(k) !== v) this.cambios.add(k);
        if (v === 'nulo') this.ahoraNulo.add(k);
      }
      for (const [k, v] of antes) if (v === 'nulo') this.eraNulo.add(k);
      if (ayudas.punterosSinValor) this.eraIncierto = inciertosDe(anterior);
    }
  }

  ancla(id, ruta, x, y, w, h) {
    // "lateral": una parte de una tabla; una flecha de la pila llega a ella por el costado, no desde arriba (cruzaria las filas de arriba)
    this.anclas.set(clave(id, ruta), { bloque: this.bloque, marco: this.marco, x, y, w, h, lateral: this.enTabla > 0 });
  }

  // Un arreglo de estructuras: una fila por elemento (ver disenoDeTabla).
  tabla(v, x, y, id, ruta) {
    const t = disenoDeTabla(v);
    const xc = x + ANCHO_INDICE;
    this.enTabla++;
    // los nombres de los campos, una sola vez, alineados abajo (los de un grupo, una linea mas arriba que los de sus columnas)
    const rotular = (columnas, cx) => {
      for (const c of columnas) {
        const w = anchoDeColumna(c);
        this.capa.append(texto(cx + w / 2, y + 9 + LINEA_ROTULO * (t.lineas - altoDeColumna(c)), c.n, 'rep-campo', { 'text-anchor': 'middle' }));
        if (!c.hoja) rotular(c.hijos, cx);
        cx += w + PAD / 2;
      }
    };
    rotular(t.columnas, xc);
    const y0 = y + t.lineas * LINEA_ROTULO;
    const celdas = (columnas, campos, cx, ry, rr) => {
      for (const c of columnas) {
        const w = anchoDeColumna(c);
        const campo = campos[c.j].v;
        if (c.hoja) {
          const valor = hojaDeTabla(campo);
          const mc = medir(valor);
          this.valor(valor, cx + (w - mc.w) / 2, ry, id, [...rr, c.n]);
        } else {
          this.ancla(id, [...rr, c.n], cx, ry, w, CH);
          celdas(c.hijos, campo.campos, cx, ry, [...rr, c.n]);
        }
        cx += w + PAD / 2;
      }
    };
    for (let i = 0; i < t.n; i++) {
      const ry = y0 + i * t.fila;
      this.ancla(id, [...ruta, i], xc, ry, t.ancho, CH);
      // el recuadro de la fila: solo se ve cuando una flecha llega a ella (rep-apuntada)
      const recuadro = el('rect', { x: xc - 3, y: ry - 3, width: t.ancho + 6, height: CH + 6, rx: 5, class: 'rep-celda rep-fila-tabla' });
      this.capa.append(recuadro);
      this.rectas.set(clave(id, [...ruta, i]), recuadro);
      this.capa.append(texto(xc - 5, ry + CH / 2 + 4, String(i), 'rep-indice', { 'text-anchor': 'end', 'data-i': clave(id, [...ruta, i]) }));
      celdas(t.columnas, v.elems[i].campos, xc, ry, [...ruta, i]);
    }
    if (v.elems.length > t.n) this.capa.append(texto(xc, y0 + t.n * t.fila + 8, '…', 'rep-campo'));
    this.enTabla--;
  }

  // Dibuja un valor con su esquina en (x, y) y registra donde quedo cada parte.
  valor(v, x, y, id, ruta) {
    const m = medir(v);
    this.ancla(id, ruta, x, y, m.w, m.h);
    if (esTabla(v)) {
      this.tabla(v, x, y, id, ruta);
      return m;
    }
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
        this.capa.append(texto(cx + mi.w / 2, y + m.h - 2, String(i), 'rep-indice', { 'text-anchor': 'middle', 'data-i': clave(id, [...ruta, i]) }));
        cx += mi.w + 2;
      }
      if (v.elems.length > n) this.capa.append(texto(cx + 8, y + CH / 2 + 4, '…', 'rep-campo'));
      return m;
    }
    const k = clave(id, ruta);
    if (v.k === 'ptr') {
      this.casilla(x, y, m.w, CH, '', 'rep-puntero', k);
      this.capa.append(el('circle', { cx: x + m.w / 2, cy: y + CH / 2, r: 4, class: 'rep-punto' + (v.muerto ? ' rep-muerto' : ''), 'data-k': k }));
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
    // Un puntero que nunca recibio una direccion (ayuda "Punteros sin inicializar"): casilla vacia, un punto hueco y una flecha
    // punteada hacia un "?" (apunta a algun lado, pero no se sabe adonde). Sin la ayuda, la casilla dice "?".
    if (v.k === 'sinvalor' && v.ptr && this.ayudas.punterosSinValor) {
      this.casilla(x, y, m.w, CH, '', 'rep-puntero rep-vacia', k);
      this.capa.append(el('circle', { cx: x + m.w / 2, cy: y + CH / 2, r: 4, class: 'rep-punto rep-punto-incierto', 'data-k': k }));
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
        a: null,
        ruta: [],
        muerto: false,
        fuera: false,
        incierta: true,
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
    const rect = el('rect', { x, y, width: w, height: h, rx: 3, class: `rep-celda ${clase}${cambio}` });
    this.capa.append(rect);
    this.rectas.set(k, rect);
    if (contenido) this.capa.append(texto(x + w / 2, y + h / 2 + 4, contenido, 'rep-texto', { 'text-anchor': 'middle', 'data-k': k }));
  }
}

// Cuanto mide la cabeza de una flecha (y de que grosor es su trazo) segun como se dibuja (ver grupoDeFlecha): la que llega (ambar), la que se
// retira y la que acaba de pasar a rojo son mas gruesas (3), y la cabeza escala con el grosor (6 o 7 veces).
function medidasDeCabeza(f) {
  const llega = Boolean(f.cambio) && !f.retirada;
  const gruesa = llega || Boolean(f.retirada) || Boolean(f.recienLiberada && f.muerto);
  const grosor = gruesa ? 3 : 1.6;
  return { grosor, cabeza: (llega ? 6 : 7) * grosor };
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

// Lo que dice el rotulo de una condicion compuesta sobre el 0 y el 1 (mientras hay un numero suelto como operando de && o ||) y sobre un cortocircuito.
const LEYENDA_LOGICA = '0 es falso; cualquier otro valor es verdadero';
const hayNumeroLogico = (partes) => partes.some((p) => p.logico && /^-?\d+(\.\d+)?$/.test(p.t));
// "corto": { ordinal (la condicion simple que decidio), verdad, quedan (las que no se evaluan) }
const notaDelCorto = (corto) => {
  const resto = corto.quedan === 1 ? `la ${corto.ordinal + 1}.ª no se evalúa` : 'las que siguen no se evalúan';
  return `la ${corto.ordinal}.ª es ${corto.verdad ? 'verdadera' : 'falsa'}: ${resto}`;
};

// El texto de "nodo" pasa a las "partes" de un paso (ver pasosDeCondicion) a partir de "cuando" (ms): solo lo que cambio se contrae hasta
// desaparecer y de ahi emerge lo nuevo, con un destello; el resto del texto no se mueve. "antes" y "despues" rodean al texto (la
// pregunta: "¿ " y " ?"). Una parte vieja sale en 0,6 u y la nueva emerge en 1,1 u, con un rebote suave.
export function textoPorPartes(nodo, partes, cuando, u, { antes = '¿ ', despues = ' ?', halo = '#3b82f6' } = {}) {
  const construir = (nuevo) => {
    const cambiantes = [];
    nodo.replaceChildren(document.createTextNode(antes));
    for (const p of partes) {
      if (!p.nuevo && !p.logico) {
        nodo.append(document.createTextNode(p.t));
        continue;
      }
      const parte = document.createElement('span');
      parte.className = 'rep-pregunta-parte' + (p.logico && (nuevo || !p.nuevo) ? ' rep-logico-' + p.logico : '');
      parte.textContent = nuevo || !p.nuevo ? p.t : p.antes;
      nodo.append(parte);
      if (p.nuevo) cambiantes.push([parte, p]);
    }
    nodo.append(document.createTextNode(despues));
    return cambiantes;
  };
  if (sinMovimiento() || !nodo.animate) {
    tiempo.esperar(() => construir(true), cuando);
    return;
  }
  const sale = 0.6 * u;
  let cambiantes = [];
  tiempo.esperar(() => {
    cambiantes = construir(false);
    for (const [parte] of cambiantes) parte.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.2)' }], { duration: sale, easing: 'ease-in', fill: 'both' });
  }, cuando);
  tiempo.esperar(() => {
    const destello = `color-mix(in srgb, ${halo} 45%, transparent)`;
    for (const [parte, p] of cambiantes) {
      for (const a of parte.getAnimations()) a.cancel();
      parte.textContent = p.t;
      if (p.logico) parte.classList.add('rep-logico-' + p.logico);
      parte.animate(
        [
          { opacity: 0, transform: 'scale(0.2)', backgroundColor: destello },
          // crece un poco de mas, se hunde un poco y se asienta: un rebote suave (cada tramo con su suavizado)
          { opacity: 1, transform: 'scale(1.12)', backgroundColor: destello, offset: 0.4, easing: 'ease-in-out' },
          { opacity: 1, transform: 'scale(0.97)', backgroundColor: destello, offset: 0.65, easing: 'ease-in-out' },
          { opacity: 1, transform: 'scale(1)', backgroundColor: destello, offset: 0.85 },
          { opacity: 1, transform: 'scale(1)', backgroundColor: 'transparent' },
        ],
        { duration: 1.1 * u, easing: 'ease-out' }
      );
    }
  }, cuando + sale);
}

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
    this.dDestello = 0; // lo que dura la expansion de las flechas que pasan a rojo
    this.nulosAnimados = new Set(); // los NULL que aparecen o se van durante el tiempo A (se les devuelve su estado al terminar)
    this.puntosAnimados = new Set(); // y los puntos que crecen o se achican
    this.retrasoFlechas = 0; // cuando empiezan, contado desde que el bloque empieza a cambiar
    this.animandoA = false; // las flechas que cambiaron se estan animando, cuadro por cuadro
    this.kA = 1; // cuanto de esa animacion (0 a 1)
    this.mostrarNombres = false;
    this.ayudas = { brilloCopias: true, brilloAsignaciones: false, brilloCondiciones: false, detalleCondiciones: false }; // ayudas visuales que se pueden apagar (ver js/ajustes.js)
    this.enfoqueFlecha = null; // la flecha que se esta senalando
    this.fijada = null; // la flecha a la que se le hizo clic
    contenedor.classList.add('rep-figura-base');
    // Si se la desplaza a mano, la figura deja de seguir la accion hasta el paso siguiente (ver seguirAccion).
    this.tocada = false;
    const alTocar = () => (this.tocada = true);
    contenedor.addEventListener('wheel', alTocar, { passive: true });
    contenedor.addEventListener('touchmove', alTocar, { passive: true });
    this.tip = document.createElement('div');
    this.tip.className = 'rep-tip';
    this.tip.hidden = true;
    this.tip.setAttribute('role', 'tooltip');
  }

  get svg() {
    return this.escena ? this.escena.svg : null;
  }

  // "duracion" es la unidad de movimiento. Devuelve cuanto dura la animacion de este paso (0 si no hay).
  // "flujo": el paso viene de avanzar uno (se animan los accesos por puntero que hizo la sentencia, si los hubo).
  // Muestra la fotografia (ver mostrarBase) y, aparte, lo que se ve fijo en este paso: la pregunta de una condicion o
  // su respuesta (ver fijarEstado). Devuelve lo que dura la animacion.
  mostrar(foto, anterior = null, opciones = {}) {
    if (this.recolectando) return this.mostrarInterno(foto, anterior, opciones);
    // Las animaciones de la figura nueva se crean sobre elementos que todavia no estan en la pagina (la figura vieja se
    // sigue viendo mientras corre el recorrido) y el navegador no las lista en ninguna parte: se las junta aca para que
    // el reproductor pueda detenerlas cuando detiene el reloj ("animacionesDelPaso").
    const original = Element.prototype.animate;
    const lista = [];
    Element.prototype.animate = function (...args) {
      const animacion = original.apply(this, args);
      lista.push(animacion);
      return animacion;
    };
    this.recolectando = true;
    try {
      return this.mostrarInterno(foto, anterior, opciones);
    } finally {
      Element.prototype.animate = original;
      this.recolectando = false;
      this.animacionesDelPaso = lista;
    }
  }

  mostrarInterno(foto, anterior = null, opciones = {}) {
    this.etapas = [];
    this.destello = null;
    this.nodoFijo = null;
    // "omitirRotulo": lo pide quien ya muestra la pregunta de este paso en otro lado (la tabla del trazado): no se arma el rotulo.
    this.sinRotulo = Boolean(this.omitirRotulo && this.omitirRotulo(foto));
    if (this.franja) this.franja.replaceChildren();
    tiempo.cancelar(this.finEnfoque);
    tiempo.cancelar(this.relojRespuesta);
    // Las flechas que salen de estas casillas quedan a la vista en el paso de una pregunta; las demas se atenuan.
    const enfoque = foto.pregunta && foto.pregunta.enfoque ? foto.pregunta.enfoque : [];
    this.enfoquePregunta = enfoque.length ? new Set(enfoque.map((e) => clave(e.a, e.ruta))) : null;
    const dur = this.mostrarBase(foto, anterior, opciones);
    // Si la expansion de una caja va primero, lo fijo lo pone la segunda parte del paso.
    if (!this.expansionPendiente) this.fijarEstado(foto, opciones.animar ? dur : 0, Boolean(opciones.animar && opciones.flujo));
    return dur;
  }

  // Una etapa de la animacion de este paso: algo con nombre que empieza en el momento "t" (en ms, desde que empieza el
  // paso). El reproductor las lee de "etapas" apenas termina mostrar() para detenerse entre una y otra.
  // Si lo anterior fue un resalte que termina justo ahora, la pausa de esta etapa cae en la meseta de ese resalte (cuando
  // esta del todo encendido: "pausa"), no cuando ya se apago: asi se ve en que estado quedo la etapa anterior.
  anotar(t, nombre) {
    if (!this.etapas) return;
    const e = { t, nombre };
    const d = this.destello;
    if (d && Math.abs(d.fin - t) < 30 && d.meseta < t) e.pausa = d.meseta;
    this.destello = null;
    this.etapas.push(e);
  }

  // Como se llama una casilla (a: id de su variable o bloque, ruta: donde dentro de ella): «lista» de «main»,
  // «sig» del bloque en 5000.
  nombreCelda(escena, a, ruta = []) {
    const d = escena && escena.datos ? escena.datos.get(a) : null;
    if (!d || !d.reserva) return 'una casilla';
    const r = d.reserva;
    let rr = ruta || [];
    if (d.bloque && r.valor && r.valor.k === 'arr' && r.valor.elems.length === 1 && typeof rr[0] === 'number') rr = rr.slice(1);
    const camino = rr.map((x) => (typeof x === 'number' ? `[${x}]` : `.${x}`)).join('');
    if (d.bloque) return camino ? `«${camino.replace(/^\./, '')}» del bloque en ${r.dir}` : `el bloque en ${r.dir}`;
    return `«${r.nombre}${camino}»` + (d.funcion ? ` de «${d.funcion.replace(/\(\)$/, '')}»` : '');
  }

  // Lo que dura mostrar "foto" desde "intermedia" (que se alcanza desde "anterior"), medido en una figura de prueba
  // (fuera de la pagina) que repite los pasos. Las etapas de esa figura quedan en "etapasMedidas".
  medirPaso(anterior, intermedia, foto, opciones) {
    const sombra = new Figura(document.createElement('div'), { cabezas: this.cabezas });
    sombra.mostrar(intermedia, anterior, { animar: false });
    const dura = sombra.mostrar(foto, intermedia, opciones);
    this.etapasMedidas = sombra.etapas || [];
    sombra.terminarFlujo();
    if (sombra.raf) cancelAnimationFrame(sombra.raf);
    for (const reloj of [sombra.finAtenuado, sombra.finAparte, sombra.finEnfoque, sombra.expansionPendiente]) tiempo.cancelar(reloj);
    return dura;
  }

  // "expandir": false cuando ya se hizo la fase de expansion de este paso (ver fotoConLugar); "bloquePrimero": false
  // cuando ya se hizo la del bloque nuevo (ver fotoConBloque).
  mostrarBase(foto, anterior = null, { animar = false, duracion = 450, flujo = false, expandir = true, bloquePrimero = true, salidaDespues = true } = {}) {
    this.terminarFlujo();
    tiempo.cancelar(this.expansionPendiente);
    this.expansionPendiente = null;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    const previa = this.escena;
    // La caja de una funcion que gana una variable se expande antes que cualquier otra animacion: primero se muestra
    // la fotografia con el lugar ya hecho y despues, desde ahi, el paso de verdad.
    if (expandir && flujo && animar && previa && anterior && duracion > 0 && !sinMovimiento()) {
      const intermedia = fotoConLugar(foto, anterior);
      if (intermedia) {
        const expansion = this.mostrar(intermedia, anterior, { animar: true, duracion, flujo: false, expandir: false });
        const resto = this.medirPaso(anterior, intermedia, foto, { animar, duracion, flujo, expandir: false });
        this.etapas = [{ t: 0, nombre: 'Se agranda la caja de la función' }, ...this.etapasMedidas.map((m) => ({ ...m, t: m.t + expansion, ...(m.pausa != null ? { pausa: m.pausa + expansion } : {}) }))];
        this.expansionPendiente = tiempo.esperar(() => {
          this.expansionPendiente = null;
          this.mostrar(foto, intermedia, { animar, duracion, flujo, expandir: false });
        }, expansion);
        return expansion + resto;
      }
    }
    // Un bloque que se reserva en un paso con recorrido aparece antes que el recorrido (y una pausa corta despues).
    if (bloquePrimero && flujo && animar && previa && anterior && duracion > 0 && !sinMovimiento()) {
      const intermedia = fotoConBloque(foto, anterior);
      if (intermedia) {
        const aparicion = this.mostrar(intermedia, anterior, { animar: true, duracion, flujo: false, expandir: false, bloquePrimero: false });
        const espera = aparicion + 0.3 * duracion;
        const resto = this.medirPaso(anterior, intermedia, foto, { animar, duracion, flujo, expandir: false, bloquePrimero: false });
        this.etapas = [{ t: 0, nombre: 'Aparece el bloque reservado' }, ...this.etapasMedidas.map((m) => ({ ...m, t: m.t + espera, ...(m.pausa != null ? { pausa: m.pausa + espera } : {}) }))];
        this.expansionPendiente = tiempo.esperar(() => {
          this.expansionPendiente = null;
          this.mostrar(foto, intermedia, { animar, duracion, flujo, expandir: false, bloquePrimero: false });
        }, espera);
        return espera + resto;
      }
    }
    // Lo que sale de su ambito (la caja de una funcion que termina, las variables con punteros de un bloque que termina) va despues
    // del efecto de la sentencia: primero se ve ese efecto (las flechas que cambian, los bloques que se reubican) con lo que va a salir
    // todavia en su lugar, y recien despues se desvanece y la pila se acomoda (main sube, la caja se achica).
    if (salidaDespues && flujo && animar && previa && anterior && duracion > 0 && !sinMovimiento()) {
      const intermedia = fotoConSalida(foto, anterior);
      if (intermedia) {
        this.intermediaFoto = intermedia; // (la fotografia de en medio del paso encadenado; la usan las pruebas)
        const siguiente = { animar, duracion, flujo: false, expandir: false, bloquePrimero: false, salidaDespues: false };
        const efecto = this.mostrar(intermedia, anterior, { animar: true, duracion, flujo: true, salidaDespues: false });
        // Si la sentencia no hizo nada que se vea, no hay nada que esperar: se desvanece de una vez.
        if (efecto <= 1) return this.mostrar(foto, intermedia, siguiente);
        const etapasDelEfecto = this.etapas || [];
        const espera = efecto + 0.3 * duracion;
        const resto = this.medirPaso(anterior, intermedia, foto, siguiente);
        this.etapas = [...etapasDelEfecto, ...this.etapasMedidas.map((m) => ({ ...m, t: m.t + espera, ...(m.pausa != null ? { pausa: m.pausa + espera } : {}) }))];
        this.expansionPendiente = tiempo.esperar(() => {
          this.expansionPendiente = null;
          this.mostrar(foto, intermedia, siguiente);
        }, espera);
        return espera + resto;
      }
    }
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
    this.involucradas = new Set((foto.accesos || []).filter((h) => h.de).map((h) => clave(h.de.a, h.de.ruta)));
    tiempo.cancelar(this.finAtenuado);
    this.finAtenuado = null;
    tiempo.cancelar(this.finAparte);
    this.finAparte = null;
    // Antes de que cambie nada, se ve por donde se llega a lo que la sentencia toca.
    // (los accesos de una llamada, argumento y parametro, se animan al final, con la caja de la funcion ya abierta)
    // (los de un elemento de un arreglo solo se animan con la ayuda que marca su indice)
    // (en una condicion tambien se animan, con el brillo de las condiciones: el valor del elemento o del campo que se lee se expande)
    const conBrilloDeCondicion = Boolean(foto.condicion) && this.ayudas.brilloCondiciones;
    const accesosDelFlujo = (foto.accesos || []).filter(
      (h) => !h.llamada && (h.tipo === 'elemento' ? this.ayudas.resaltarIndice || conBrilloDeCondicion : h.tipo === 'campo' ? conBrilloDeCondicion : true)
    );
    const retardo =
      flujo && animar && !sinMovimiento() && u > 0 && previa && (accesosDelFlujo.length || foto.condicion || foto.muestra || foto.lectura)
        ? this.iniciarFlujo(previa, accesosDelFlujo, u, escena, foto.condicion, enciende(foto), foto.indices || [])
        : 0;
    const mueve = animar && !sinMovimiento() && u > 0 && Boolean(previa);
    this.fundir = mueve;
    // El fundido de lo que se acaba de liberar (la flecha, el borde del bloque y su aviso) dura una unidad y
    // empieza cuando termina el flujo; cuenta como parte de lo que dura el paso.
    const fundidosDeBloque = [...escena.svg.querySelectorAll('.rep-fundido-bloque, .rep-aviso-nuevo')];
    const hayFundido = mueve && (fundidosDeBloque.length > 0 || escena.flechas.some((f) => f.recienLiberada));
    // El borde y el aviso de un bloque que se queda sin nadie que lo apunte aparecen cuando la flecha termina de irse.
    const huerfanosNuevos = mueve ? [...escena.svg.querySelectorAll('.rep-huerfano-nuevo')] : [];
    const aparecerHuerfanos = (demora) => {
      for (const e of huerfanosNuevos) if (e.animate) e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 0.5 * u, delay: demora, easing: 'ease-in-out', fill: 'both' });
    };
    // Primero cambia el bloque (el borde y su aviso, en el flujo que termino de recorrer la flecha de quien lo libera) y,
    // cuando va por la mitad, las flechas que lo apuntaban se expanden y pasan al rojo: se ve que quedaron colgando
    // como consecuencia.
    this.dDestello = mueve && escena.flechas.some((f) => f.recienLiberada && f.muerto) ? 0.9 * u : 0;
    this.retrasoFlechas = this.dDestello && fundidosDeBloque.length ? 0.5 * u : 0;
    for (const e of fundidosDeBloque) {
      const sale = e.classList.contains('rep-fundido-bloque');
      if (!mueve) {
        if (sale) e.remove();
      } else if (e.animate) {
        e.animate(sale ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }], { duration: u, delay: retardo, easing: 'ease-in-out', fill: 'both' });
      }
    }
    // Lo que acaba de recibir la direccion (un bloque que reservo malloc, una variable con &) parpadea cuando la flecha llego.
    // Los que reciben una flecha que se anima en el tiempo A parpadean apenas ella termina de llegar (antes de que los
    // bloques se reubiquen); los de una flecha hacia un bloque que acaba de aparecer, cuando se termina de dibujar.
    const objetivos = mueve ? this.objetivosDeParpadeo(escena) : { alLlegar: [], alFinal: [] };
    // Los argumentos de una llamada y sus parametros (ver planDeLlamada): lo que señalan sus flechas lo resalta el plan.
    const plan = mueve ? this.planDeLlamada(escena, foto, u) : null;
    if (plan) {
      objetivos.alFinal = objetivos.alFinal.filter((k) => !plan.destinos.has(k));
      // La caja se abre con los parametros todavia sin valor: lo reciben despues de su pulso.
      plan.ocultarParametros();
    }
    // Una copia de valor (de una casilla a otra): cuando llega la figura nueva, el valor ya puesto resplandece en las dos casillas.
    // (Con un puntero a un bloque no: ahi estan la flecha y el bloque; con una cuenta tampoco: no sale de una casilla.)
    const copiasDeValor = this.ayudas.brilloCopias && flujo && mueve ? (foto.accesos || []).filter((h) => !h.llamada && h.tipo === 'valor' && h.de && h.para) : [];
    // Un valor nuevo que no sale de otra casilla (un literal, una cuenta, NULL): resplandece solo el destino.
    const escrituras = this.ayudas.brilloAsignaciones && flujo && mueve ? foto.escrituras || [] : [];
    const dBrillo = copiasDeValor.length || escrituras.length ? 0.8 * u : 0;
    for (const h of copiasDeValor) this.brillar(escena, [clave(h.de.a, h.de.ruta), clave(h.para.a, h.para.ruta)], retardo, dBrillo);
    for (const c of escrituras) this.brillar(escena, [clave(c.a, c.ruta)], retardo, dBrillo);
    const dLlegar = objetivos.alLlegar.length ? 0.9 * u : 0;
    const dFinal = objetivos.alFinal.length ? 0.9 * u : 0;
    const dPlan = plan ? plan.duracion : 0;
    this.dFundido = mueve ? u : 450;
    this.retardoFundido = retardo;
    let seMueven = false;
    for (const b of escena.bloques.values()) {
      const antes = posiciones.get(b.id);
      b.desde = mueve && antes ? { x: escena.x0 + antes.rx, y: antes.y } : { ...b.hasta };
      b.actual = { ...b.desde };
      b.nuevo = mueve && !antes;
      // Un bloque nuevo aparece (fundido) aunque nada mas se mueva: asi se lo ve antes de que llegue la flecha que lo apunta.
      if (Math.abs(b.desde.x - b.hasta.x) > 0.5 || Math.abs(b.desde.y - b.hasta.y) > 0.5 || b.nuevo) seMueven = true;
      b.g.setAttribute('transform', `translate(${b.actual.x},${b.actual.y})`);
    }
    // Las cajas de la pila: las que siguen suben o bajan, las nuevas se abren y las que ya no estan
    // se ven (quietas) hasta el tiempo B, en que se cierran.
    for (const m of escena.marcosG.values()) {
      const antes = posicionesMarcos.get(m.clave);
      m.desde = mueve && antes != null ? { y: antes } : { y: m.hasta.y };
      m.actual = { ...m.desde };
      m.nuevo = mueve && antes == null;
      // Una caja que ya estaba y ahora es mas alta (gano una variable): crece desde el alto que tenia.
      const antesDeLaCaja = previa && previa.marcosG.get(m.clave);
      m.crece = mueve && antesDeLaCaja && m.alto > antesDeLaCaja.alto + 0.5 ? antesDeLaCaja.alto / m.alto : null;
      if (Math.abs(m.desde.y - m.hasta.y) > 0.5 || m.nuevo || m.crece != null) seMueven = true;
      m.g.setAttribute('transform', `translate(0,${m.actual.y})`);
    }
    // Las variables con punteros que se van de una caja que sigue (termina un bloque { } o el cuerpo de un for): su casilla y su
    // flecha se desvanecen en su lugar, y la caja conserva su alto hasta que todo se reubica.
    const variablesQueSalen = [];
    // (tambien las que no tienen punteros pero a las que apunta una flecha que las sobrevive: se ven irse antes de que la flecha retroceda)
    const objetivosQueSeVan = new Set(escena.flechas.filter((f) => f.destinoSeVa).map((f) => f.a));
    if (mueve && previa) {
      for (const [k, mp] of previa.marcosG) {
        const m = escena.marcosG.get(k);
        if (!m) continue;
        let salen = 0;
        for (const g of mp.g.querySelectorAll('.rep-var')) {
          const id = Number(g.getAttribute('data-id'));
          const d = previa.datos.get(id);
          if (escena.datos.has(id) || g.classList.contains('rep-pendiente') || !d || !d.reserva || (!tienePuntero(d.reserva.valor) && !objetivosQueSeVan.has(id))) continue;
          variablesQueSalen.push({ g, y: mp.actual.y });
          salen++;
        }
        if (salen && m.alto < mp.alto - 0.5) {
          m.encoge = mp.alto;
          m.rect.setAttribute('height', mp.alto);
        }
      }
      if (variablesQueSalen.length) seMueven = true;
    }
    // Las cajas de funciones que terminan: se desvanecen en su lugar (con sus flechas) y despues la pila se acomoda.
    const cajasQueSalen = mueve && previa ? [...previa.marcosG].filter(([k]) => !escena.marcosG.has(k)).map(([, m]) => m) : [];
    if (cajasQueSalen.length) seMueven = true;
    // Si el paso nuevo es mas bajo (se fue una caja de la pila), lo que todavia esta donde estaba
    // quedaria cortado: se conserva el alto del paso anterior y se ajusta mientras todo se reubica.
    escena.altoFinal = escena.alto + 10;
    escena.altoActual = escena.altoFinal;
    escena.altoDesde = previa && previa.altoActual ? previa.altoActual : escena.altoFinal;
    if (mueve && seMueven && escena.altoDesde > escena.altoFinal) this.ponerAlto(escena.altoDesde);
    if (seMueven) {
      for (const b of escena.bloques.values()) if (b.nuevo) b.g.style.opacity = '0';
      for (const m of escena.marcosG.values()) {
        if (m.nuevo) this.abrirCaja(m, 0, escena);
        else if (m.crece != null) this.abrirCaja(m, m.crece, escena);
      }
    }
    // Tiempo A: las flechas que cambiaron se animan (se dibujan, se redirigen o se retraen o se desvanecen) con los
    // bloques todavia donde estaban; despues, una pausa. Tiempo B: los bloques se reubican. FIN: todo
    // en su lugar. Si nada se mueve, solo hay tiempo A.
    const hayRetiradas = escena.retiradas.some((r) => r.viejo);
    const hayA = escena.flechas.some((f) => f.cambio && !f.tarde) || hayRetiradas || variablesQueSalen.length > 0 || cajasQueSalen.length > 0 || escena.destinoSeVa;
    const conFlechaAntes = mueve && seMueven && hayA;
    this.fase = !mueve || !seMueven ? 'FIN' : conFlechaAntes ? 'A' : 'B';
    for (const b of escena.bloques.values()) if (b.nuevo && !seMueven) b.nuevo = false;
    const animA = mueve && (seMueven ? hayA : escena.flechas.some((f) => f.cambio) || hayRetiradas);
    this.animandoA = animA;
    this.kA = animA ? 0 : 1;
    // Lo que no interviene se atenua mientras dura el paso (hay flechas que se animan o que cambian).
    const quitarAtenuado = () => escena.svg.classList.remove('rep-atenua');
    const atenuar = mueve && (seMueven || animA) && (this.involucradas.size > 0 || escena.flechas.some((f) => f.cambio) || escena.retiradas.length > 0);
    if (atenuar) escena.svg.classList.add('rep-atenua');
    if (animA && previa) {
      for (const [id, b] of previa.bloques) {
        if (escena.bloques.has(id) || !escena.retiradas.some((r) => r.desvanece && r.a === id)) continue;
        const clon = b.g.cloneNode(true);
        clon.style.pointerEvents = 'none';
        for (const e of clon.querySelectorAll('[data-id]')) e.removeAttribute('data-id');
        clon.setAttribute('transform', `translate(${b.actual.x},${b.actual.y})`);
        escena.raiz.append(clon);
        escena.desvanecen.push({ g: clon });
      }
      for (const s of variablesQueSalen) {
        const clon = s.g.cloneNode(true);
        clon.style.pointerEvents = 'none';
        clon.removeAttribute('data-id');
        for (const e of clon.querySelectorAll('[data-id]')) e.removeAttribute('data-id');
        clon.setAttribute('transform', `translate(0,${s.y})`);
        escena.raiz.append(clon);
        escena.desvanecen.push({ g: clon });
      }
      for (const m of cajasQueSalen) {
        const clon = m.g.cloneNode(true);
        clon.style.pointerEvents = 'none';
        for (const e of clon.querySelectorAll('[data-id]')) e.removeAttribute('data-id');
        clon.setAttribute('transform', `translate(0,${m.actual.y})`);
        escena.raiz.append(clon);
        clon.removeAttribute('clip-path');
        const borde = clon.querySelector('.rep-marco');
        if (borde) borde.setAttribute('height', m.alto);
        escena.desvanecen.push({ g: clon });
      }
    }
    this.pintarFlechas();
    this.retardoFundido = 0;
    // Las etapas del cambio de la figura (despues del flujo, que ya anoto las suyas): lo que se libera, las flechas
    // que cambian de destino y los bloques y cajas que se mueven. "tFlecha" y "tTarde": cuando se dibujan las flechas.
    const marcarCambio = (tFlecha, tTarde, tMover) => {
      if (!mueve) return;
      let algo = false;
      let acomodo = false;
      if (hayFundido && (escena.flechas.some((x) => x.recienLiberada) || fundidosDeBloque.some((e) => e.classList.contains('rep-fundido-bloque')))) {
        this.anotar(retardo, 'Se libera el bloque: queda marcado como liberado');
        algo = true;
        if (this.dDestello) this.anotar(retardo + this.retrasoFlechas, 'Las flechas que apuntaban al bloque quedan colgando');
      }
      for (const x of escena.flechas) {
        if (!x.cambio || !x.final || x.muerto || x.fuera) continue;
        if (x.tarde && plan && plan.flechas.has(clave(x.deId, x.rutaOrigen))) continue;
        this.anotar(x.tarde ? tTarde : tFlecha, `La flecha de ${this.nombreCelda(escena, x.deId, x.rutaOrigen)} pasa a apuntar ${this.nombreCelda(escena, x.a, x.ruta).replace(/^el /, 'al ').replace(/^(?!al )/, 'a ')}`);
        algo = true;
      }
      // Un puntero que pasa a NULL: su flecha se recoge hasta su casilla. Las variables con punteros de un bloque que termina se desvanecen.
      for (const r of escena.retiradas) {
        if (!r.viejo || !r.haciaNulo) continue;
        const { id, ruta } = desdeClave(r.claveOrigen);
        this.anotar(tFlecha, `La flecha de ${this.nombreCelda(escena, id, ruta)} se recoge: el puntero pasa a NULL`);
        algo = true;
      }
      if (variablesQueSalen.length) {
        this.anotar(tFlecha, 'Se desvanecen las variables del bloque que termina');
        algo = true;
      }
      for (const x of escena.flechas) {
        if (!x.destinoSeVa) continue;
        this.anotar(tFlecha + 0.8 * u, `La flecha de ${this.nombreCelda(escena, x.deId, x.rutaOrigen)} retrocede: lo que señalaba ya no existe`);
        algo = true;
      }
      if (seMueven) {
        const nueva = [...escena.marcosG.values()].some((m) => m.nuevo);
        const sale = cajasQueSalen.length > 0;
        const bloqueNuevo = [...escena.bloques.values()].some((b) => b.nuevo);
        if (nueva) this.anotar(tMover, 'Se abre la caja de la función que empieza');
        if (sale) this.anotar(tFlecha, 'Se desvanece la caja de la función que termina');
        if (bloqueNuevo && !nueva) this.anotar(tMover, 'Aparece el bloque nuevo');
        acomodo = !nueva && !sale && !bloqueNuevo;
        if (!acomodo) algo = true;
      }
      // El valor que llega a una casilla (a = b, nuevo->dato = x): resplandece en las dos (con la ayuda de las copias) o en el destino.
      const brilla = this.ayudas.brilloCopias ? ': brillan las dos casillas' : '';
      for (const h of (foto.accesos || []).filter((y) => !y.llamada && y.tipo === 'valor' && y.de && y.para)) {
        this.anotar(retardo, `Se guarda el valor de ${this.nombreCelda(escena, h.de.a, h.de.ruta)} en ${this.nombreCelda(escena, h.para.a, h.para.ruta)}${brilla}`);
        algo = true;
      }
      for (const c of foto.escrituras || []) {
        this.anotar(retardo, `Se guarda un valor nuevo en ${this.nombreCelda(escena, c.a, c.ruta)}${this.ayudas.brilloAsignaciones ? ': brilla la casilla' : ''}`);
        algo = true;
      }
      if (!algo && acomodo) this.anotar(tMover, 'Se acomodan los bloques y las cajas');
      else if (!algo) this.anotar(retardo, 'Cambia la figura');
    };
    if (!mueve || (!animA && !seMueven)) {
      // Cambio el valor de una casilla (no un puntero) a la que llega alguna flecha: las flechas quedan difuminadas un
      // momento, para que se vea la casilla en ambar, y despues recuperan su color con un fundido.
      const aparte = mueve && this.valorApuntadoCambio(escena, foto) ? 0.6 * u : 0;
      if (aparte) {
        const svg = escena.svg;
        svg.classList.add('rep-aparte');
        this.finAparte = tiempo.esperar(() => {
          svg.classList.remove('rep-aparte');
          svg.classList.add('rep-vuelve');
          this.finAparte = tiempo.esperar(() => svg.classList.remove('rep-vuelve'), 400);
        }, retardo + aparte);
      }
      marcarCambio(retardo, retardo, retardo);
      aparecerHuerfanos(retardo);
      const dura = Math.max(hayFundido ? u : 0, this.dDestello ? this.retrasoFlechas + this.dDestello : 0, dBrillo);
      this.dDestello = 0;
      return retardo + dura + aparte;
    }
    // Si habia una flecha antes (se va a redirigir o a desvanecer), primero se la ve resaltada y quieta.
    // (solo las flechas que se contraen o se redirigen se ven antes, resaltadas y quietas; lo que se desvanece no)
    const hayFlechaPrevia = escena.flechas.some((f) => f.cambio && f.viejo) || escena.retiradas.some((r) => r.viejo && !r.seVa);
    const hayVieja = retardo > 0 && (foto.accesos || []).some((h) => h.tipo === 'vieja');
    const retencion = animA && hayFlechaPrevia && !hayVieja ? u * 0.6 : 0;
    // Si en el tiempo A solo se desvanece lo que sale (no se dibuja, contrae ni redirige nada), es mas corto.
    const soloSalidas = animA && !hayFlechaPrevia && !escena.flechas.some((f) => f.cambio && !f.tarde);
    // La flecha cuyo destino se va: primero se desvanece lo que se va (hasta el 40 %) y despues la flecha retrocede (desde el 50 %).
    const dA = animA && escena.destinoSeVa ? 1.6 * u : soloSalidas ? 0.7 * u : u;
    const duracionA = animA ? retencion + dA : 0;
    aparecerHuerfanos(retardo + duracionA);
    // La pausa entre la flecha y la reubicacion es tambien el lugar del parpadeo de lo que la flecha acaba de alcanzar.
    const pausa = conFlechaAntes ? (soloSalidas ? 0.2 * u : Math.max(u * 1.1, dLlegar + u * 0.2)) : 0;
    const espera = duracionA + pausa;
    const duracionB = seMueven ? u : 0;
    const hayTarde = seMueven && escena.flechas.some((f) => f.tarde);
    // Entre que aparece el bloque y se dibuja la flecha que lo apunta, una pausa corta.
    const pausaNuevo = 0.2 * u;
    marcarCambio(retardo + retencion, retardo + espera + duracionB + pausaNuevo, retardo + espera);
    if (plan) for (const e of plan.etapas) this.anotar(retardo + espera + duracionB + e.t, e.nombre);
    const inicio = tiempo.ahora() + retardo;
    const paso = (ahora) => {
      const t = tiempo.ahora(ahora) - inicio;
      if (this.animandoA && t < duracionA) {
        this.kA = suavizar(Math.max(0, t - retencion) / dA);
        this.pintarFlechas();
        this.raf = requestAnimationFrame(paso);
        return;
      }
      if (this.animandoA) {
        this.animandoA = false;
        this.kA = 1;
        this.pintarFlechas();
        this.parpadear(escena, objetivos.alLlegar, dLlegar, 0);
      }
      if (!seMueven) {
        this.raf = null;
        this.finAtenuado = tiempo.esperar(quitarAtenuado, dLlegar + 50);
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
      this.dDestello = 0;
      this.retrasoFlechas = 0;
      // Las flechas hacia bloques que acaban de aparecer se dibujan al final.
      this.dibujarNuevas('.rep-tarde', u, hayTarde ? pausaNuevo : 0, plan ? plan.flechas : null);
      this.parpadear(escena, objetivos.alFinal, dFinal, hayTarde ? pausaNuevo + u : 0);
      if (plan) plan.ejecutar();
      // Si el reloj se detuvo justo aca (una pausa de etapa), lo que se acaba de crear nace detenido tambien.
      if (tiempo.pausado && escena.svg.getAnimations) for (const a of escena.svg.getAnimations({ subtree: true })) if (a.playState === 'running') a.pause();
      this.finAtenuado = tiempo.esperar(quitarAtenuado, Math.max((hayTarde ? pausaNuevo + u : 0) + dFinal, dPlan) + 50);
    };
    this.raf = requestAnimationFrame(paso);
    return retardo + espera + duracionB + Math.max((hayTarde ? pausaNuevo + u : 0) + dFinal, dPlan) + (seMueven ? 0 : dLlegar);
  }

  // ¿Cambio en este paso el valor de una casilla que no es un puntero y a la que llega alguna flecha (a ella, a la
  // variable que la contiene o a algo que ella contiene)?
  valorApuntadoCambio(escena, foto) {
    const plano = planoDe(foto);
    for (const k of escena.cambios) {
      const [id, ruta] = k.split('|');
      if (ruta === '#vivo') continue;
      const valor = plano.get(k);
      if (valor === undefined || valor.startsWith('p') || valor === 'sinvalor') continue;
      const relacionada = (r) => r === ruta || r === '' || ruta === '' || ruta.startsWith(r + '/') || r.startsWith(ruta + '/');
      if (escena.flechas.some((f) => !f.fuera && !f.muerto && String(f.a) === id && relacionada(f.ruta.join('/')))) return true;
    }
    return false;
  }

  // La casilla o el bloque que se resalta cuando un puntero recibe su direccion: un bloque del montículo entero
  // (el puntero a su comienzo), si no la casilla a la que apunta.
  claveDeResalte(escena, id, ruta) {
    const entero = escena.bloques.has(id) && (ruta.length === 0 || (ruta.length === 1 && ruta[0] === 0));
    return clave(id, entero ? [] : ruta);
  }

  // Los destinos de las flechas que cambiaron en este paso: lo que acaba de recibir una direccion (tambien si la
  // direccion era la de otro puntero: antes parpadeo con la flecha copiada, y ahora, al llegar la flecha nueva).
  // "alLlegar": la flecha se anima en el tiempo A; "alFinal": va hacia un bloque que recien aparece (se dibuja al final).
  objetivosDeParpadeo(escena) {
    const salida = { alLlegar: [], alFinal: [] };
    for (const f of escena.flechas) {
      if (!f.cambio || !f.final || f.muerto || f.fuera || f.incierta) continue;
      const k = this.claveDeResalte(escena, f.a, f.ruta);
      if (!escena.anclas.get(k)) continue;
      const lista = f.tarde ? salida.alFinal : salida.alLlegar;
      if (!salida.alLlegar.includes(k) && !salida.alFinal.includes(k)) lista.push(k);
    }
    return salida;
  }

  parpadear(escena, objetivos, duracion, retraso, cuadros = PARPADEO) {
    if (!escena.capaResalte || !duracion || sinMovimiento()) return;
    for (const k of objetivos) {
      const ancla = escena.anclas.get(k);
      const caja = ancla ? this.absolutoDe(escena, ancla) : null;
      if (caja) this.parpadeo(escena.capaResalte, caja, duracion, retraso, cuadros);
    }
  }

  // Un & junto a una casilla: lo que se pasa de ella no es su contenido sino su direccion.
  marcaDeDireccion(escena, k, duracion, retraso) {
    if (!escena.capaResalte || !duracion || sinMovimiento()) return;
    const ancla = escena.anclas.get(k);
    const caja = ancla ? this.absolutoDe(escena, ancla) : null;
    if (!caja) return;
    const marca = el('g', { class: 'rep-ampersand' });
    marca.style.opacity = '0';
    marca.append(el('rect', { x: caja.x + caja.w - 19, y: caja.y - 13, width: 22, height: 19, rx: 4 }));
    marca.append(texto(caja.x + caja.w - 8, caja.y + 2, '&', 'rep-ampersand-texto', { 'text-anchor': 'middle' }));
    escena.capaResalte.append(marca);
    if (marca.animate) {
      const a = marca.animate(APARECE, { duration: duracion, delay: retraso, fill: 'both' });
      a.onfinish = () => marca.remove();
    }
  }

  // El indice (el numero de debajo) de un elemento de un arreglo, o de una matriz sus dos indices, pulsa un instante: crece y toma el color de
  // acento. "raiz" es el dibujo donde estan los indices; devuelve cuantos animo.
  pulsarIndice(raiz, objetivo, retraso, duracion) {
    if (!raiz || !objetivo || !objetivo.ruta || !duracion || sinMovimiento()) return 0;
    const halo = getComputedStyle(this.contenedor).getPropertyValue('--acento').trim() || '#3b82f6';
    const sin = { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 transparent)' };
    const con = { transform: 'scale(1.9)', fill: halo, filter: `drop-shadow(0 0 4px ${halo})` };
    let animados = 0;
    for (let n = 1; n <= objetivo.ruta.length; n++) {
      if (typeof objetivo.ruta[n - 1] !== 'number') continue;
      const k = clave(objetivo.a, objetivo.ruta.slice(0, n));
      for (const x of raiz.querySelectorAll('text.rep-indice')) {
        if (x.getAttribute('data-i') !== k || !x.animate) continue;
        animados++;
        x.style.transformBox = 'fill-box';
        x.style.transformOrigin = 'center';
        x.animate([{ ...sin }, { ...con, offset: 0.3 }, { ...con, offset: 0.7 }, { ...sin }], { duration: duracion, delay: retraso, easing: 'ease-in-out' });
      }
    }
    return animados;
  }

  // El texto del valor de estas casillas (por su clave) resplandece y crece un instante: el valor que se acaba de copiar,
  // en el origen y en el destino a la vez. El resplandor se ve poco sobre el fondo ambar de lo que cambio; el cambio de
  // tamaño se nota igual (tambien con la figura chica o sin distinguir colores).
  brillar(escena, claves, retraso, duracion) {
    let animados = 0;
    if (!escena.svg || !duracion || sinMovimiento()) return animados;
    for (const k of claves) {
      for (const t of escena.svg.querySelectorAll(`text[data-k="${k}"]`)) {
        if (!t.animate) continue;
        animados++;
        t.style.transformBox = 'fill-box';
        t.style.transformOrigin = 'center';
        const halo = getComputedStyle(this.contenedor).getPropertyValue('--acento').trim() || '#3b82f6';
        const sin = { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 transparent)' };
        const con = { transform: 'scale(1.4)', filter: `drop-shadow(0 0 5px ${halo})` };
        t.animate([{ ...sin }, { ...con, offset: 0.3 }, { ...con, offset: 0.6 }, { ...sin }], { duration: duracion, delay: retraso, easing: 'ease-in-out' });
      }
    }
    return animados;
  }

  // El trazo de una flecha que parpadea (como cuando un acceso la recorre).
  parpadeoDeFlecha(escena, flecha, duracion, retraso, cuadros = PARPADEO) {
    if (!escena.capaResalte || !duracion || sinMovimiento()) return;
    const trazo = el('path', { d: camino(this.rutaPuntos(flecha, flecha.final, escena.filas, escena)), class: 'rep-flujo' });
    trazo.style.opacity = '0';
    escena.capaResalte.append(trazo);
    if (trazo.animate) {
      const a = trazo.animate(cuadros, { duration: duracion, delay: retraso, fill: 'both' });
      a.onfinish = () => trazo.remove();
    }
  }

  // Lo que se ve al pasar los argumentos de una llamada, con la caja de la funcion ya abierta. Por cada argumento, de a
  // uno: parpadea la casilla de la que sale (si sale de una; con un puntero tambien su flecha y el bloque, como en
  // q = p), parpadea la del parametro y, si el parametro es un puntero, se dibuja su flecha y parpadea lo que señala
  // (salvo que ya haya parpadeado). Con mas de tres argumentos, cada paso se hace para todos a la vez.
  // Devuelve null si no es una llamada, o { acciones, duracion, destinos, flechas, ejecutar }: "destinos" son las casillas
  // que señalan las flechas de los parametros (el plan las resalta) y "flechas", las claves de esas flechas (se dibujan aparte).
  planDeLlamada(escena, foto, u) {
    const parejas = [];
    let origen = null;
    for (const h of (foto.accesos || []).filter((x) => x.llamada)) {
      if (h.tipo === 'parametro') {
        parejas.push({ origen, param: clave(h.a.a, h.a.ruta), nombre: this.nombreCelda(escena, h.a.a, h.a.ruta) });
        origen = null;
      } else origen = h;
    }
    if (!parejas.length || !escena.capaResalte) return null;
    const juntos = parejas.length > 3;
    // Cada pulso dura una unidad; el siguiente empieza un poco antes de que termine el anterior (lo que se copia "pasa" de
    // una casilla a la otra) y el & de una direccion queda hasta que ya empezo el del parametro.
    const dPulso = u;
    const adelanto = 0.8 * u;
    const acciones = [];
    const destinos = new Set();
    const flechas = new Set();
    const resaltado = new Set();
    let fin = 0;
    const dura = (en, d) => {
      fin = Math.max(fin, en + d);
    };

    // Cada uno devuelve cuanto hay que esperar para que empiece lo que sigue.
    const origenDe = (p, en) => {
      const h = p.origen;
      if (!h) return 0;
      const celda = clave(h.de.a, h.de.ruta);
      resaltado.add(celda);
      dura(en, dPulso);
      if (h.tipo !== 'copia') {
        acciones.push(() => {
          this.parpadear(escena, [celda], dPulso, en, PULSO);
          if (h.direccion) this.marcaDeDireccion(escena, celda, 1.4 * u, en);
        });
        if (h.direccion) dura(en, 1.4 * u);
        return adelanto;
      }
      const flecha = escena.flechas.find((f) => f.claveOrigen === celda && f.final);
      const bloque = this.claveDeResalte(escena, h.a.a, h.a.ruta);
      resaltado.add(bloque);
      acciones.push(() => {
        this.parpadear(escena, [celda, bloque], dPulso, en, PULSO);
        if (flecha) this.parpadeoDeFlecha(escena, flecha, dPulso, en, PULSO);
      });
      return adelanto;
    };
    // El parametro recibe su valor cuando termina de destellar (se va apagando el marco) y ahi resplandece el valor, tambien
    // en la casilla de la que sale si el argumento es un valor (no la direccion de algo, ni un puntero a un bloque).
    const recibe = 0.6 * u;
    const dBrillo = this.ayudas.brilloCopias ? 0.8 * u : 0;
    const parametroDe = (p, en) => {
      resaltado.add(p.param);
      dura(en, recibe + dBrillo);
      const h = p.origen;
      const copiaDeValor = h && h.tipo === 'valor' && !h.direccion;
      acciones.push(() => {
        this.parpadear(escena, [p.param], dPulso, en, PULSO);
        this.revelar(escena, p.param, en + recibe, 0.2 * u);
        this.brillar(escena, copiaDeValor ? [p.param, clave(h.de.a, h.de.ruta)] : [p.param], en + recibe, dBrillo);
      });
      return dPulso;
    };
    const flechaDe = (p, en) => {
      const f = escena.flechas.find((x) => x.claveOrigen === p.param && x.tarde && x.final);
      if (!f) return 0;
      const destino = this.claveDeResalte(escena, f.a, f.ruta);
      destinos.add(destino);
      flechas.add(p.param);
      if (!juntos) etapas.push({ t: en, nombre: `Se dibuja la flecha de ${p.nombre} hasta ${this.nombreCelda(escena, f.a, f.ruta)}` });
      dura(en, u);
      acciones.push(() => this.dibujarNuevas(`.rep-tarde[data-k="${p.param}"]`, u, en));
      if (resaltado.has(destino)) return u;
      resaltado.add(destino);
      dura(en + u, dPulso);
      acciones.push(() => this.parpadear(escena, [destino], dPulso, en + u, PULSO));
      return u + dPulso;
    };

    let t = 0;
    const etapas = [];
    if (juntos) etapas.push({ t: 0, nombre: 'Se pasan los argumentos a los parámetros' });
    if (juntos) {
      for (const hacer of [origenDe, parametroDe, flechaDe]) {
        let mas = 0;
        for (const p of parejas) mas = Math.max(mas, hacer(p, t));
        t += mas;
      }
    } else {
      for (const p of parejas) {
        const h = p.origen;
        etapas.push({ t, nombre: h && h.de ? `Se pasa ${this.nombreCelda(escena, h.de.a, h.de.ruta)} al parámetro ${p.nombre}` : `Se pasa el argumento al parámetro ${p.nombre}` });
        t += origenDe(p, t);
        t += parametroDe(p, t);
        t += flechaDe(p, t);
      }
    }
    // Los valores de los parametros se esconden desde que llega la figura (la caja se abre sin ellos): ver revelar.
    const ocultarParametros = () => {
      for (const p of parejas) {
        for (const e of escena.svg.querySelectorAll(`[data-k^="${p.param.split('|')[0]}|"]`)) e.style.opacity = '0';
      }
    };
    return { acciones, etapas, duracion: Math.max(t, fin), destinos, flechas, ejecutar: () => acciones.forEach((a) => a()), ocultarParametros };
  }

  // El valor de una casilla (y todo lo de su variable) aparece: estaba escondido (opacidad 0) y se muestra con un fundido.
  revelar(escena, k, retraso, duracion) {
    const id = k.split('|')[0];
    for (const e of escena.svg.querySelectorAll(`[data-k^="${id}|"]`)) {
      if (!e.animate || sinMovimiento()) {
        e.style.opacity = '';
        continue;
      }
      const a = e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duracion, delay: retraso, fill: 'both' });
      a.onfinish = () => {
        e.style.opacity = '';
        a.cancel();
      };
    }
  }

  // Un marco que parpadea alrededor de una casilla o de un bloque (y se quita al terminar).
  parpadeo(capa, caja, duracion, retraso, cuadros = PARPADEO) {
    const marco = el('rect', { x: caja.x - 3, y: caja.y - 3, width: caja.w + 6, height: caja.h + 6, rx: 4, class: 'rep-acceso' });
    marco.style.opacity = '0';
    capa.append(marco);
    if (marco.animate) {
      const a = marco.animate(cuadros, { duration: duracion, delay: retraso, fill: 'both' });
      a.onfinish = () => marco.remove();
    }
    return marco;
  }

  // ------------------------------------------------------------------ flujo de un acceso

  // Donde esta ahora una casilla de una escena (ver rutaPuntos).
  absolutoDe(escena, a) {
    if (a.bloque != null) {
      const b = escena.bloques.get(a.bloque);
      return b ? { x: b.actual.x + a.x, y: b.actual.y + a.y, w: a.w, h: a.h } : null;
    }
    if (a.marco != null) {
      const m = escena.marcosG.get(a.marco);
      return m ? { x: a.x, y: a.y + m.actual.y, w: a.w, h: a.h } : null;
    }
    return a;
  }

  // Sobre la figura del paso anterior (todavia como estaba), por cada acceso: un destello que viaja por la
  // flecha del puntero hasta lo que alcanza, y esa casilla se resalta un instante. En un acceso de dos
  // saltos (**pp) el destello pasa por el puntero del medio. Devuelve lo que dura (0 si no hay nada que ver).
  // Mientras tanto la figura nueva queda esperando: se la pone cuando termina.
  // Si el paso evaluo una condicion ("condicion": { texto, valor }), se ve la pregunta (un rotulo con la condicion), las
  // casillas que se leen (con borde discontinuo) y, despues de una pausa para leer, la respuesta.
  iniciarFlujo(previa, accesos, u, escena, condicion = null, muestra = null, indices = []) {
    const dFlecha = 0.8 * u;
    const dResalte = 0.5 * u;
    const clon = previa.svg.cloneNode(true);
    // Los velos de un fundido que ya termino no se copian: la figura anterior se ve como quedo.
    for (const e of clon.querySelectorAll('.rep-fundido, .rep-fundido-bloque, .rep-acceso:not(.rep-consulta)')) e.remove();
    // Lo que cambio en el paso anterior (en ambar) ya no es novedad: en este paso se ve con el color de siempre.
    for (const g of clon.querySelectorAll('.rep-flecha-g.rep-nueva')) {
      g.classList.remove('rep-nueva');
      for (const p of g.querySelectorAll('[marker-end="url(#rep-punta-nueva)"]')) p.setAttribute('marker-end', 'url(#rep-punta)');
    }
    for (const e of clon.querySelectorAll('.rep-etiqueta-nueva')) e.classList.remove('rep-etiqueta-nueva');
    for (const e of clon.querySelectorAll('.rep-celda.rep-cambio')) e.classList.remove('rep-cambio');
    // Tampoco lo es el grosor 3 de una flecha que se retiro o que acababa de pasar a rojo: vuelven al grosor de siempre
    // (con una transicion corta, antes de que empiece el recorrido) y conservan su color.
    const gruesas = [...clon.querySelectorAll('.rep-flecha-g.rep-retirada, .rep-flecha-g.rep-roja-nueva')];
    for (const g of gruesas) {
      g.classList.remove('rep-retirada', 'rep-roja-nueva');
      for (const trazo of g.querySelectorAll('.rep-flecha')) {
        if (trazo.animate) trazo.animate([{ strokeWidth: '3px' }, { strokeWidth: '1.6px' }], { duration: 0.2 * u, easing: 'ease-out' });
      }
    }
    // Si algun acceso recorre una flecha, todas arrancan atenuadas (una entrada breve) y cada una se enciende, con su destello,
    // cuando le toca, y sigue encendida: queda el rastro de lo que intervino. Sin flechas que recorrer no se atenua nada.
    const grupos = new Map();
    for (const g of clon.querySelectorAll('.rep-flecha-g')) grupos.set(g.getAttribute('data-k'), g);
    const conFlecha = accesos.some((h) => h.de && grupos.has(clave(h.de.a, h.de.ruta)));
    // Si el paso anterior era la pregunta de una condicion, las flechas que no intervienen ya estan atenuadas y las
    // que intervienen a la vista: no se vuelve a atenuar todo (se veria un parpadeo).
    const enFoco = previa.svg.classList.contains('rep-foco-pregunta');
    const entrada = enFoco ? 0 : 0.2 * u;
    if (conFlecha && !enFoco) {
      for (const g of grupos.values()) if (g.animate) g.animate([{ opacity: 1 }, { opacity: ATENUADO }], { duration: entrada, fill: 'both' });
    }
    const encendidas = new Set();
    const encender = (h, cuando) => {
      const k = clave(h.de.a, h.de.ruta);
      const g = grupos.get(k);
      if (!conFlecha || enFoco || !g || encendidas.has(k)) return;
      encendidas.add(k);
      if (g.animate) g.animate([{ opacity: ATENUADO }, { opacity: 1 }], { duration: 0.2 * u, delay: cuando, fill: 'both' });
    };
    const capa = el('g');
    clon.append(capa);
    let t = Math.max(conFlecha ? entrada : 0, gruesas.length ? 0.2 * u : 0);
    // Deja encendido un resalte de un recorrido (la casilla de destino) un rato mas.
    const extender = (ultimo, extra) => {
      const { marco, animacion, delay, duracion } = ultimo;
      animacion.cancel();
      const largo = duracion + extra;
      const borde = (0.25 * duracion) / largo;
      marco.animate([{ opacity: 0 }, { opacity: 1, offset: borde }, { opacity: 1, offset: 1 - borde }, { opacity: 0 }], { duration: largo, delay, fill: 'both' });
      this.destello = { fin: delay + largo, meseta: delay + largo * (1 - borde) };
    };
    // El ultimo resalte de un recorrido: si es el de la casilla donde se va a guardar una copia (despues de mostrar lo
    // que se guarda), queda encendido una pausa corta antes de que se dibuje la flecha nueva.
    let ultimoResalte = null;
    const hayCopia = accesos.some((h) => h.tipo === 'copia' || h.tipo === 'valor');
    // Una copia termina resaltando la casilla que recibe el valor (si no la resalto ya el recorrido hasta ella).
    let pendientePara = null;
    const resaltadas = new Set();
    // "dura": lo que dura el resalte (una condicion con brillo lo alarga hasta lo que dura el brillo, para que terminen juntos).
    const pulso = (casilla, consulta = false, dura = dResalte) => {
      const marco = el('rect', { x: casilla.x - 3, y: casilla.y - 3, width: casilla.w + 6, height: casilla.h + 6, rx: 4, class: 'rep-acceso' + (consulta ? ' rep-consulta' : '') });
      marco.style.opacity = '0';
      capa.append(marco);
      if (marco.animate) {
        const animacion = marco.animate(
          [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }],
          { duration: dura, delay: t, fill: 'both' }
        );
        ultimoResalte = { marco, animacion, delay: t, duracion: dura };
      }
      this.destello = { fin: t + dura, meseta: t + 0.75 * dura };
      t += dura;
    };
    // Antes de resaltar la casilla de un elemento de un arreglo (v[i]), su indice (el numero que esta debajo) se marca un instante: es lo que
    // dice cual es dentro del arreglo, sobre todo cuando la flecha llega al primero y se toca otro. Con matrices se marcan los dos indices.
    const dIndice = 0.5 * u;
    const marcados = new Set(); // las casillas cuyo indice ya se marco en este recorrido
    const origenes = new Map(indices.map((x) => [clave(x.a, x.ruta), x.de]));
    const pulsoDeIndice = (objetivo) => {
      if (!this.ayudas.resaltarIndice || !objetivo || !objetivo.ruta || sinMovimiento()) return;
      if (marcados.has(clave(objetivo.a, objetivo.ruta))) return;
      // Antes del indice, se expande el valor de las variables de las que sale (i en v[i], n en v[n - 1]); en una condicion ya se hizo al
      // comienzo (con las demas variables que se leen).
      if (!condicion) {
        const celdasFuente = [];
        for (let n = 1; n <= objetivo.ruta.length; n++) celdasFuente.push(...(origenes.get(clave(objetivo.a, objetivo.ruta.slice(0, n))) || []));
        const fuentes = celdasFuente.map((c) => clave(c.a, c.ruta));
        if (fuentes.length && this.brillar({ svg: clon }, fuentes, t, dIndice)) {
          this.anotar(t, `Se expande el valor de ${celdasFuente.map((c) => this.nombreCelda(previa, c.a, c.ruta)).join(' y ')}, de donde sale el índice`);
          this.destello = { fin: t + dIndice, meseta: t + 0.7 * dIndice };
          t += dIndice;
        }
      }
      if (!this.pulsarIndice(clon, objetivo, t, dIndice)) return;
      marcados.add(clave(objetivo.a, objetivo.ruta));
      const indice = objetivo.ruta[objetivo.ruta.length - 1];
      this.anotar(t, `Se marca el índice ${indice}${typeof indice === 'number' ? ' de ' + this.nombreCelda(previa, objetivo.a, objetivo.ruta.slice(0, -1)).replace(/^el /, '') : ''}`);
      this.destello = { fin: t + dIndice, meseta: t + 0.7 * dIndice };
      t += dIndice;
    };
    const resaltarDestino = () => {
      if (!pendientePara) return;
      const pendiente = pendientePara;
      const k = clave(pendiente.a, pendiente.ruta);
      pendientePara = null;
      if (resaltadas.has(k)) return;
      const ancla = previa.anclas && previa.anclas.get(k);
      const casilla = ancla ? this.absolutoDe(previa, ancla) : null;
      if (casilla) {
        pulsoDeIndice(pendiente);
        this.anotar(t, `Se resalta ${this.nombreCelda(previa, pendiente.a, pendiente.ruta)}, que va a recibir el valor`);
        pulso(casilla);
      }
    };
    // El rotulo de la condicion (si hay uno) y su detalle: las etapas en que pasa por la condicion con los valores puestos y las cuentas hechas.
    let r = null;
    let pregunta = null;
    let detalle = null;
    if (condicion && !this.sinRotulo) {
      // La respuesta no ocupa lugar hasta que le toca aparecer: el rotulo se ensancha recien entonces, no mientras corre el flujo.
      r = this.crearRotulo(condicion.completo || condicion.texto, condicion.valor, false);
      pregunta = r.caja;
      detalle = this.ayudas.detalleCondiciones && condicion.pasos && condicion.partes && condicion.pasos.length > 1 ? condicion.pasos : null;
    }
    // La leyenda del 0 y el 1 (solo mientras se ve un numero suelto como operando de && o ||) y la nota del cortocircuito.
    let leyendaVista = false;
    const poner = (nodo, texto, cuando) => {
      tiempo.esperar(() => {
        nodo.textContent = texto || '';
        nodo.hidden = !texto;
      }, cuando);
    };
    // Una etapa del detalle: el rotulo cambia (lo que cambia emerge, ver textoPorPartes) y se queda dos unidades.
    const etapa = (i, texto) => {
      this.anotar(t, texto);
      this.cambiarPartes(r.texto, condicion.partes[i], t, u);
      const leyenda = hayNumeroLogico(condicion.partes[i]);
      if (leyenda !== leyendaVista) {
        poner(r.leyenda, leyenda ? LEYENDA_LOGICA : '', t + 0.6 * u);
        leyendaVista = leyenda;
      }
      t += 2 * u;
    };
    // Las etapas de la condicion simple "j" (todas, si la condicion no es compuesta) y, si ella decidio el resultado, la nota del cortocircuito.
    const etapasDe = (j, ultimo) => {
      const gruposDePaso = condicion.grupoDePaso;
      for (let i = 1; i < detalle.length; i++) {
        if ((gruposDePaso ? gruposDePaso[i] : ultimo) !== j) continue;
        etapa(i, i === 1 ? `Se ponen los valores en la condición: ${detalle[i]}` : `Se resuelve la condición: ${detalle[i]}`);
      }
      const corto = (condicion.cortos || []).find((c) => c.ordinal === j + 1);
      if (corto) {
        // La nota tiene una etapa propia: el rotulo se queda quieto el tiempo de leerla (segun lo que dice, no menos de 2 unidades).
        const nota = notaDelCorto(corto);
        poner(r.nota, nota, t);
        this.anotar(t, `Se explica el cortocircuito: ${nota}`);
        t += Math.max(2 * u, 0.07 * u * nota.length);
      }
    };
    // Los valores que se leen para responder una condicion resplandecen primero (los punteros a un bloque no tienen texto: no
    // se ven); despues viene el recorrido por las flechas y, al final, el resultado.
    const brillarCeldas = (celdas) => {
      if (!condicion || !celdas || !celdas.length || !this.ayudas.brilloCondiciones) return;
      const claves = celdas.map((c) => clave(c.a, c.ruta));
      if (this.brillar({ svg: clon }, claves, t, 0.8 * u)) {
        this.anotar(t, 'Brillan los valores de la condición');
        this.destello = { fin: t + 0.8 * u, meseta: t + 0.6 * 0.8 * u };
        t += 0.8 * u;
      }
    };
    // Recorre una lista de accesos (los de un paso, o los de una condicion simple de una condicion compuesta).
    const recorrer = (lista) => {
      // Los argumentos de una llamada (mas de tres: todos a la vez): cada resalte empieza donde empezo el primero.
      let juntoDesde = null;
      let juntoFin = 0;
      for (const h of lista) {
        if (h.junto) {
          if (juntoDesde === null) juntoDesde = t;
          else {
            juntoFin = Math.max(juntoFin, t);
            t = juntoDesde;
          }
        } else if (juntoDesde !== null) {
          t = Math.max(juntoFin, t);
          juntoDesde = null;
        }
        const copia = h.tipo === 'copia';
        const destino = previa.anclas && previa.anclas.get(copia ? this.claveDeResalte(previa, h.a.a, h.a.ruta) : clave(h.a.a, h.a.ruta));
        const casilla = destino ? this.absolutoDe(previa, destino) : null;
        if (!casilla) continue;
        const flecha = h.de ? previa.flechas.find((f) => f.claveOrigen === clave(h.de.a, h.de.ruta) && f.final) : null;
        if (h.tipo === 'vieja') {
          // La flecha que tenia el puntero que se sobrescribe destella antes de que cambie; la casilla de destino
          // sigue encendida mientras tanto (no se resalta el bloque al que apuntaba: no interviene).
          if (!flecha) continue;
          resaltarDestino();
          this.anotar(t, `Se ve la flecha que tenía ${this.nombreCelda(previa, h.de.a, h.de.ruta)} antes de cambiar`);
          encender(h, t);
          const dDestello = 0.8 * u;
          const trazo = el('path', { d: camino(this.rutaPuntos(flecha, flecha.final, previa.filas, previa)), class: 'rep-flujo' });
          trazo.style.opacity = '0';
          capa.append(trazo);
          if (trazo.animate) trazo.animate(PARPADEO, { duration: dDestello, delay: t, fill: 'both' });
          if (ultimoResalte) {
            extender(ultimoResalte, dDestello);
            ultimoResalte = null;
          }
          t += dDestello;
          continue;
        }
        if (copia) {
          // Un puntero que se copia: parpadean su flecha y lo que senala.
          ultimoResalte = null;
          pendientePara = h.para;
          const dParpadeo = 0.9 * u;
          // El origen de la copia (la casilla del puntero) parpadea junto con su flecha y el bloque.
          const origen = h.de && previa.anclas && previa.anclas.get(clave(h.de.a, h.de.ruta));
          const cajaOrigen = origen ? this.absolutoDe(previa, origen) : null;
          this.anotar(t, h.de ? `Se copia el puntero ${this.nombreCelda(previa, h.de.a, h.de.ruta)}: parpadean su flecha y lo que señala` : 'Se recibe el puntero que devolvió la función');
          if (cajaOrigen) this.parpadeo(capa, cajaOrigen, dParpadeo, t);
          if (flecha) {
            encender(h, t);
            const trazo = el('path', { d: camino(this.rutaPuntos(flecha, flecha.final, previa.filas, previa)), class: 'rep-flujo' });
            trazo.style.opacity = '0';
            capa.append(trazo);
            if (trazo.animate) trazo.animate(PARPADEO, { duration: dParpadeo, delay: t, fill: 'both' });
          }
          this.parpadeo(capa, casilla, dParpadeo, t);
          t += dParpadeo;
          continue;
        }
        if (flecha) {
          this.anotar(t, `Se recorre la flecha de ${this.nombreCelda(previa, h.de.a, h.de.ruta)} hasta ${this.nombreCelda(previa, h.a.a, h.a.ruta)}`);
          encender(h, t);
          const puntos = this.rutaPuntos(flecha, flecha.final, previa.filas, previa);
          const largo = largoDe(puntos);
          const trozo = Math.min(28, largo * 0.4);
          const destello = el('path', { d: camino(puntos), class: 'rep-flujo' });
          destello.setAttribute('stroke-dasharray', `${trozo} ${largo + trozo}`);
          destello.style.opacity = '0';
          capa.append(destello);
          if (destello.animate) {
            destello.animate(
              [
                { strokeDashoffset: trozo, opacity: 1 },
                { strokeDashoffset: -largo, opacity: 1 },
              ],
              { duration: dFlecha, delay: t, easing: 'ease-in-out', fill: 'both' }
            );
          }
          t += dFlecha;
        }
        pulsoDeIndice(h.a);
        if (h.tipo === 'valor') {
          // Se copia el valor de una casilla en otra: primero se resalta el origen.
          pendientePara = h.para;
          if (!flecha) this.anotar(t, `Se lee el valor de ${this.nombreCelda(previa, h.a.a, h.a.ruta)}`);
          pulso(casilla);
          continue;
        }
        resaltadas.add(clave(h.a.a, h.a.ruta));
        if (!flecha) this.anotar(t, `${h.tipo === 'elemento' || h.tipo === 'campo' ? 'Se accede a' : 'Se lee'} ${this.nombreCelda(previa, h.a.a, h.a.ruta)}`);
        // En una condicion, el valor de la casilla a la que se llego siguiendo un puntero (p->dato, *p) tambien resplandece.
        const brilla = condicion && (h.de || h.tipo === 'elemento' || h.tipo === 'campo') && this.ayudas.brilloCondiciones ? this.brillar({ svg: clon }, [clave(h.a.a, h.a.ruta)], t, 0.8 * u) : 0;
        pulso(casilla, Boolean(h.cond), brilla ? 0.8 * u : dResalte);
      }
      if (juntoDesde !== null) t = Math.max(juntoFin, t);
      resaltarDestino();
      if (hayCopia && ultimoResalte) {
        extender(ultimoResalte, 0.3 * u);
        t += 0.3 * u;
      }
    };
    // Una condicion compuesta se recorre condicion simple por condicion simple, en el orden de C: las casillas que lee, sus accesos y sus
    // etapas del detalle; una condicion simple, o cualquier otro paso, todo junto.
    const porGrupos = Boolean(condicion && condicion.grupos && condicion.grupos.length > 1);
    if (porGrupos) {
      condicion.grupos.forEach((g, j) => {
        brillarCeldas(g.celdas);
        recorrer(accesos.filter((h) => (h.g === undefined ? 0 : h.g) === j));
        if (r && detalle) etapasDe(j, condicion.grupos.length - 1);
      });
    } else {
      brillarCeldas(condicion && condicion.celdas);
      recorrer(accesos);
    }
    // Los valores que acaba de mostrar un printf: sus casillas se encienden en violeta, quedan un rato y se apagan (el texto de
    // la consola se resalta a la vez: ver alMuestra).
    if (muestra && muestra.celdas.length) {
      const dura = 2 * u;
      let hay = false;
      for (const celda of muestra.celdas) {
        const ancla = previa.anclas && previa.anclas.get(clave(celda.a, celda.ruta));
        const caja = ancla ? this.absolutoDe(previa, ancla) : null;
        if (!caja) continue;
        hay = true;
        const marco = el('rect', { x: caja.x - 3, y: caja.y - 3, width: caja.w + 6, height: caja.h + 6, rx: 4, class: 'rep-acceso rep-muestra' });
        marco.style.opacity = '0';
        capa.append(marco);
        if (marco.animate) {
          marco.animate([{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.9 }, { opacity: 0 }], { duration: dura, delay: t, fill: 'both' });
        }
      }
      if (hay) {
        this.anotar(t, 'Se muestran en la consola los valores impresos');
        if (this.alMuestra) this.alMuestra(t, t + dura);
        t += dura;
      }
    }
    // La respuesta de una condicion: el rotulo con la pregunta (que ya se veia en el paso anterior) se completa con
    // "verdadero" o "falso" despues de los accesos que haya, y se deja un momento a la vista.
    if (r) {
      if (detalle && !porGrupos) etapasDe(0, 0);
      this.anotar(t, `La condición da ${condicion.valor ? 'verdadero' : 'falso'}`);
      tiempo.cancelar(this.relojRespuesta);
      this.relojRespuesta = tiempo.esperar(() => {
        r.respuesta.hidden = false;
        r.caja.querySelector('.rep-pregunta').classList.add(condicion.valor ? 'rep-pregunta-si' : 'rep-pregunta-no');
        this.llamarLaAtencion(r.caja, 0, false);
        if (r.respuesta.animate) r.respuesta.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 0.2 * u, fill: 'both' });
      }, t + 30);
      // (con el detalle, la respuesta se deja mas tiempo a la vista: el rotulo explica lo que se acaba de resolver)
      t += detalle ? 1.5 * u : 0.8 * u;
    }
    if (!t) return 0;
    const total = t + 0.1 * u;
    // El flujo termina un poco despues de su ultimo resalte: lo que sigue (la figura nueva) empieza en "total".
    if (this.destello && Math.abs(this.destello.fin - t) < 1) this.destello.fin = total;
    this.contenedor.replaceChildren(clon);
    if (pregunta) this.ponerRotulo(pregunta);
    this.flujoActivo = { svg: escena.svg, temporizador: tiempo.esperar(() => this.terminarFlujo(), total) };
    return total;
  }

  // La figura nueva reemplaza a la del paso anterior, que se mostraba mientras corria el flujo.
  terminarFlujo() {
    const f = this.flujoActivo;
    if (!f) return;
    this.flujoActivo = null;
    tiempo.cancelar(f.temporizador);
    this.contenedor.replaceChildren(f.svg);
    if (this.nodoFijo) this.ponerRotulo(this.nodoFijo);
  }

  // El rotulo de una condicion: "¿ condicion ?" y, si ya se sabe, "→ verdadero" o "→ falso" (visible o por aparecer).
  // Con "detalle" ({ partes, cortos }) el texto se arma con las partes de la ultima etapa (los operandos de && y || con su color) y se
  // ven la leyenda del 0 y el 1 y la nota del cortocircuito que correspondan.
  crearRotulo(texto, valor, visible = true, detalle = null) {
    const caja = document.createElement('div');
    caja.className = 'rep-pregunta-g';
    caja.setAttribute('aria-hidden', 'true');
    const rotulo = document.createElement('span');
    rotulo.className = 'rep-pregunta';
    const letras = document.createElement('span');
    letras.className = 'rep-pregunta-texto';
    if (detalle) {
      letras.append(document.createTextNode('¿ '));
      for (const p of detalle.partes) {
        if (!p.logico) letras.append(document.createTextNode(p.t));
        else {
          const parte = document.createElement('span');
          parte.className = 'rep-pregunta-parte rep-logico-' + p.logico;
          parte.textContent = p.t;
          letras.append(parte);
        }
      }
      letras.append(document.createTextNode(' ?'));
    } else letras.textContent = '¿ ' + texto + ' ?';
    rotulo.append(letras);
    // Dos avisos debajo de la condicion, escondidos hasta que corresponden.
    const leyenda = document.createElement('span');
    leyenda.className = 'rep-pregunta-aviso';
    const nota = document.createElement('span');
    nota.className = 'rep-pregunta-aviso';
    leyenda.hidden = !(detalle && hayNumeroLogico(detalle.partes));
    leyenda.textContent = leyenda.hidden ? '' : LEYENDA_LOGICA;
    const corto = detalle && detalle.cortos && detalle.cortos.length ? detalle.cortos[detalle.cortos.length - 1] : null;
    nota.hidden = !corto;
    nota.textContent = corto ? notaDelCorto(corto) : '';
    const respuesta = document.createElement('span');
    respuesta.className = 'rep-pregunta-resp ' + (valor ? 'rep-si' : 'rep-no');
    if (valor === undefined || valor === null) respuesta.hidden = true;
    else {
      respuesta.textContent = valor ? ' → ✓ verdadero' : ' → ✗ falso';
      respuesta.hidden = !visible;
      // El borde (y el fondo de la franja) toman el color del resultado cuando se sabe.
      if (visible) rotulo.classList.add(valor ? 'rep-pregunta-si' : 'rep-pregunta-no');
    }
    rotulo.append(respuesta, leyenda, nota);
    caja.append(rotulo);
    return { caja, respuesta, texto: letras, leyenda, nota };
  }

  // El texto del rotulo de una condicion pasa a las "partes" de un paso (ver textoPorPartes).
  cambiarPartes(nodo, partes, cuando, u) {
    textoPorPartes(nodo, partes, cuando, u, { halo: getComputedStyle(this.contenedor).getPropertyValue('--acento').trim() || '#3b82f6' });
  }

  // Donde queda una casilla cuando termina el paso (ver absolutoDe).
  absolutoFinal(escena, a) {
    if (a.bloque != null) {
      const b = escena.bloques.get(a.bloque);
      return b ? { x: b.hasta.x + a.x, y: b.hasta.y + a.y, w: a.w, h: a.h } : null;
    }
    if (a.marco != null) {
      const m = escena.marcosG.get(a.marco);
      return m ? { x: a.x, y: a.y + m.hasta.y, w: a.w, h: a.h } : null;
    }
    return a;
  }

  // Lo que se ve fijo mientras se esta en este paso: la pregunta de una condicion (el rotulo y las casillas que se
  // leen, con borde discontinuo; aparecen cuando termina la animacion del paso, "retraso") o, en el paso siguiente,
  // el rotulo con la respuesta.
  fijarEstado(foto, retraso, adelante = false) {
    this.nodoFijo = null;
    const escena = this.escena;
    if (!escena || (!foto.pregunta && !foto.condicion)) return;
    const aparecer = (e) => {
      if (retraso > 0 && e.animate) {
        e.style.opacity = '0';
        e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: retraso, fill: 'both' });
      }
    };
    let nodo = null;
    if (foto.pregunta) {
      if (!this.sinRotulo) {
        nodo = this.crearRotulo(foto.pregunta.completo || foto.pregunta.texto, null).caja;
        // Al avanzar, el rotulo llama la atencion: baja desde arriba y destella (al terminar la animacion del paso).
        if (adelante) this.llamarLaAtencion(nodo, retraso, true);
        else aparecer(nodo);
      }
      // Las flechas que no intervienen en la pregunta se atenuan cuando termina la animacion del paso.
      if (this.enfoquePregunta) {
        const svg = escena.svg;
        if (retraso > 0) this.finEnfoque = tiempo.esperar(() => svg.classList.add('rep-foco-pregunta'), retraso);
        else svg.classList.add('rep-foco-pregunta');
      }
      for (const c of foto.pregunta.celdas) {
        const ancla = escena.anclas.get(clave(c.a, c.ruta));
        const caja = ancla ? this.absolutoFinal(escena, ancla) : null;
        if (!caja) continue;
        const marco = el('rect', { x: caja.x - 3, y: caja.y - 3, width: caja.w + 6, height: caja.h + 6, rx: 4, class: 'rep-acceso rep-consulta' });
        escena.capaResalte.append(marco);
        aparecer(marco);
      }
    } else if (!this.sinRotulo) {
      // Con el detalle de las condiciones, el rotulo de la respuesta dice la condicion ya resuelta (la que se vio al final de la animacion).
      const pasos = this.ayudas.detalleCondiciones && foto.condicion.pasos && foto.condicion.pasos.length > 1 ? foto.condicion.pasos : null;
      const detalle = pasos && foto.condicion.partes ? { partes: foto.condicion.partes[pasos.length - 1], cortos: foto.condicion.cortos } : null;
      nodo = this.crearRotulo(pasos ? pasos[pasos.length - 1] : foto.condicion.completo || foto.condicion.texto, foto.condicion.valor, true, detalle).caja;
    }
    this.nodoFijo = nodo;
    // Si el paso muestra todavia la figura anterior (el recorrido previo), el rotulo se pone cuando termina.
    if (nodo && !this.flujoActivo) this.ponerRotulo(nodo);
  }

  // El rotulo de una condicion llama la atencion: llega desde la izquierda como un resorte (se pasa, vuelve, rebota dos veces y
  // queda fijo) y despues su borde destella una vez ("entrada"); si ya estaba (llega la respuesta), un empujon corto. Con
  // "retraso" ms de demora y sin movimiento reducido.
  // Una animacion de CSS empieza cuando el elemento entra en la pagina, y el rotulo puede entrar despues de lo previsto (si
  // antes corre el recorrido por las flechas): por eso se anota cuando tiene que empezar y la demora se calcula al ponerlo.
  llamarLaAtencion(caja, retraso, entrada) {
    if (sinMovimiento()) return;
    caja.atencion = { cuando: tiempo.ahora() + retraso, entrada };
    if (caja.isConnected) this.empezarAtencion(caja);
  }

  empezarAtencion(caja) {
    const a = caja.atencion;
    if (!a) return;
    caja.atencion = null;
    const espera = Math.max(0, a.cuando - tiempo.ahora());
    const rotulo = caja.querySelector('.rep-pregunta');
    if (a.entrada) {
      caja.classList.add('rep-pregunta-entra');
      caja.style.animationDelay = espera + 'ms';
    }
    if (rotulo) {
      // Al entrar: el resorte del rotulo y, cuando queda quieto (1,1 s), un destello suave. Si ya estaba (llega la respuesta
      // y se ensancha): un empujon corto.
      rotulo.classList.remove('rep-pregunta-llama', 'rep-pregunta-empuja');
      rotulo.style.animationDelay = espera + (a.entrada ? 1100 : 0) + 'ms';
      void rotulo.offsetWidth; // reinicia la animacion si ya estaba
      rotulo.classList.add(a.entrada ? 'rep-pregunta-llama' : 'rep-pregunta-empuja');
    }
  }

  // El rotulo de una condicion va en la franja reservada arriba de la figura (pantallas grandes: ahi no tapa nada y queda
  // cerca del codigo) y, si no hay franja a la vista, flotando arriba de la figura.
  // El rotulo con la respuesta de una condicion se retira (con un fundido) cuando el cursor pasa a la linea siguiente: el reproductor lo
  // pide al terminar la animacion de ese paso.
  retirarRotulo(ms = 250) {
    const n = this.nodoFijo;
    if (!n || !n.isConnected) return;
    this.nodoFijo = null;
    const quitar = () => n.remove();
    if (!n.animate || sinMovimiento() || ms <= 0) quitar();
    else n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, fill: 'both' }).onfinish = quitar;
  }

  ponerRotulo(nodo) {
    this.empezarAtencion(nodo); // antes de ponerlo: la animacion empieza al entrar en la pagina
    if (this.franja && this.franja.offsetParent !== null) this.franja.replaceChildren(nodo);
    else this.contenedor.prepend(nodo);
  }

  // Las ayudas visuales que se pueden apagar: { brilloCopias }. Valen desde el proximo paso que se muestre.
  fijarAyudas(ayudas) {
    this.ayudas = { ...this.ayudas, ...ayudas };
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

  // La figura sigue la accion: se desplaza (con el scroll del contenedor) para que lo que pasa en este paso quede a la vista: las casillas que
  // cambian, la fila o el bloque al que llega una flecha y los extremos de las flechas nuevas. Si todo junto entra, se muestra todo; si no, lo
  // ultimo (el destino). "nuevoPaso" vuelve a empezar (una figura que se desplazo a mano se deja en paz hasta el paso siguiente).
  seguirAccion({ nuevoPaso = false, suave = true } = {}) {
    if (nuevoPaso) this.tocada = false;
    const cont = this.contenedor;
    const svg = this.svg;
    if (this.tocada || !svg || !cont.clientHeight || !cont.clientWidth) return;
    if (cont.scrollHeight <= cont.clientHeight + 1 && cont.scrollWidth <= cont.clientWidth + 1) return; // entra entera: no hay nada que seguir
    const rc = cont.getBoundingClientRect();
    const aContenido = (r) => ({ x: r.left - rc.left + cont.scrollLeft, y: r.top - rc.top + cont.scrollTop, w: r.width, h: r.height });
    // las puntas de las flechas nuevas (en unidades del dibujo; el dibujo se escala con la figura) y las casillas que cambian
    const rs = svg.getBoundingClientRect();
    const k = this.escalaActual || 1;
    const puntas = [];
    for (const g of svg.querySelectorAll('.rep-flecha-g.rep-nueva')) {
      const pts = g.puntosCompletos;
      if (!pts || !pts.length) continue;
      for (const p of [pts[0], pts[pts.length - 1]]) puntas.push({ x: rs.left - rc.left + cont.scrollLeft + p.x * k - 4, y: rs.top - rc.top + cont.scrollTop + p.y * k - 4, w: 8, h: 8 });
    }
    const celdas = [...svg.querySelectorAll('.rep-celda.rep-cambio')].map((e) => aContenido(e.getBoundingClientRect()));
    const objetivos = [...puntas, ...celdas];
    if (!objetivos.length) return;
    const margen = 14;
    const caja = (lista) => {
      const x0 = Math.min(...lista.map((o) => o.x));
      const y0 = Math.min(...lista.map((o) => o.y));
      return { x: x0, y: y0, w: Math.max(...lista.map((o) => o.x + o.w)) - x0, h: Math.max(...lista.map((o) => o.y + o.h)) - y0 };
    };
    const cabe = (c) => c.w <= cont.clientWidth - 2 * margen && c.h <= cont.clientHeight - 2 * margen;
    let r = caja(objetivos);
    // No entra todo junto: con flechas, las dos puntas (de donde sale y adonde llega) y, si tampoco, solo adonde llega; sin flechas (una funcion
    // nueva, una fila entera que cambia), el comienzo de lo que cambia.
    if (!cabe(r) && puntas.length) {
      r = caja(puntas);
      if (!cabe(r)) r = puntas[puntas.length - 1];
    }
    const ajustar = (desde, tam, vista, actual) => {
      if (tam > vista - 2 * margen) return desde - margen;
      if (desde < actual + margen) return desde - margen;
      if (desde + tam > actual + vista - margen) return desde + tam - vista + margen;
      return actual;
    };
    const left = Math.max(0, Math.min(ajustar(r.x, r.w, cont.clientWidth, cont.scrollLeft), cont.scrollWidth - cont.clientWidth));
    const top = Math.max(0, Math.min(ajustar(r.y, r.h, cont.clientHeight, cont.scrollTop), cont.scrollHeight - cont.clientHeight));
    if (Math.abs(left - cont.scrollLeft) < 1 && Math.abs(top - cont.scrollTop) < 1) return;
    cont.scrollTo({ left, top, behavior: suave && !sinMovimiento() ? 'smooth' : 'auto' });
  }

  // Las flechas (sus grupos) que cumplen el selector se van dibujando desde su origen hasta su destino. La punta
  // viaja con el extremo del trazo: un trazo punteado que avanza dejaria la punta ya puesta en el destino.
  // "excluir": las claves (data-k) de las flechas que se dibujan aparte.
  dibujarNuevas(selector, milisegundos, retraso = 0, excluir = null) {
    if (!this.escena || sinMovimiento()) return;
    const grupos = [...this.escena.capaFlechas.querySelectorAll(selector)].filter((g) => g.puntosCompletos && !(excluir && excluir.has(g.getAttribute('data-k'))));
    if (!grupos.length) return;
    const inicio = tiempo.ahora() + retraso;
    // Devuelve si todavia queda algo por dibujar.
    const dibujar = (k) => {
      const avance = 1 - (1 - k) * (1 - k);
      let vivas = false;
      for (const g of grupos) {
        if (!g.isConnected) continue;
        vivas = true;
        const trozo = k < 1 ? recortar(g.puntosCompletos, largoDe(g.puntosCompletos) * avance) : g.puntosCompletos;
        g.style.visibility = trozo ? '' : 'hidden';
        // El nombre de la flecha aparece cuando ya llego.
        for (const r of g.querySelectorAll('.rep-etiqueta-g')) r.style.visibility = k < 1 ? 'hidden' : '';
        if (trozo) for (const trazo of g.querySelectorAll('.rep-flecha')) trazo.setAttribute('d', camino(trozo));
      }
      return vivas && k < 1;
    };
    // El primer estado (sin dibujar) se pone ya: si se esperara al proximo cuadro, se veria un instante la flecha completa.
    if (!dibujar(0)) return;
    const paso = (ahora) => {
      if (dibujar(Math.min(1, Math.max(0, (tiempo.ahora(ahora) - inicio) / milisegundos)))) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  // Una caja de la pila que llega se abre (y una que se va se cierra) de arriba hacia abajo: su borde crece o se achica
  // y el contenido se va mostrando con el. "k" va de 0 (cerrada) a 1 (abierta). Se mueve junto con las de abajo, asi no se pisan.
  abrirCaja(caja, k, escena = this.escena) {
    if (!caja.rect) return;
    if (k >= 1) {
      if (caja.clip) {
        caja.g.removeAttribute('clip-path');
        caja.clip.parentNode.remove();
        caja.clip = null;
      }
      caja.rect.setAttribute('height', caja.alto);
      return;
    }
    if (!caja.clip) {
      const id = 'rep-clip-' + (++contadorDeCortes);
      const corte = el('clipPath', { id });
      caja.clip = el('rect', { x: -4, y: -4, width: caja.ancho + 24, height: 0 });
      corte.append(caja.clip);
      escena.svg.querySelector('defs').append(corte);
      caja.g.setAttribute('clip-path', `url(#${id})`);
    }
    const alto = Math.max(0, caja.alto * k);
    caja.rect.setAttribute('height', alto);
    caja.clip.setAttribute('height', alto > 0 ? alto + 6 : 0);
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
      if (m.nuevo) this.abrirCaja(m, e);
      else if (m.crece != null) this.abrirCaja(m, m.crece + (1 - m.crece) * e);
      else if (m.encoge != null) m.rect.setAttribute('height', m.encoge + (m.alto - m.encoge) * e);
    }
    // La caja que se va se cierra, de abajo hacia arriba, a la vez que la de abajo sube a su lugar.
    for (const sa of this.escena.salientes) this.abrirCaja(sa, 1 - e);
    this.pintarFlechas();
  }

  // ---------------------------------------------------------- construccion

  construir(foto, anterior, previa = null) {
    const p = new Pintor(foto, anterior, this.ayudas);
    const raiz = p.capa;
    const datos = new Map();
    this.datos = datos;
    const defs = el('defs');
    defs.innerHTML =
      '<marker id="rep-punta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="rep-cabeza"/></marker>' +
      '<marker id="rep-punta-mala" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="rep-cabeza-mala"/></marker>' +
      '<marker id="rep-punta-incierta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="rep-cabeza-incierta"/></marker>' +
      '<marker id="rep-punta-nueva" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="rep-cabeza-nueva"/></marker>' +
      '<marker id="rep-punta-vieja" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="rep-cabeza-vieja"/></marker>' +
      // El rayado de los bloques liberados: lineas diagonales, para que no dependa solo del color.
      '<pattern id="rep-rayado" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" class="rep-rayado-linea"/></pattern>';

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
    // Una flecha de la pila que apunta dentro de una variable de la pila (un elemento de un arreglo, un campo) llega desde arriba, por un
    // carril encima de su fila, y no cruzando las demas casillas: la fila reserva un poco de lugar encima para ese carril.
    const variablesDePila = [...foto.globales, ...foto.marcos.flatMap((m) => m.variables)];
    const idsDePila = new Set(variablesDePila.map((v) => v.id));
    const haciaFila = new Map();
    for (const v of variablesDePila) for (const q of punterosDe(v.valor)) if (q.ruta.length && idsDePila.has(q.a)) haciaFila.set(q.a, (haciaFila.get(q.a) || 0) + 1);
    const lugarDelCarril = (n) => (n ? 14 + 4 * Math.min(n - 1, 2) : 0);
    for (const caja of cajas) {
      const etiquetaAncho = Math.max(0, ...caja.variables.map((v) => v.nombre.length)) * LETRA + 12;
      // (una tabla recibe las flechas por el costado: no necesita el carril de encima)
      const filas = caja.variables.map((v) => ({ v, m: medir(v.valor), extra: esTabla(v.valor) ? 0 : lugarDelCarril(haciaFila.get(v.id) || 0) }));
      const ancho = Math.max(120, etiquetaAncho + Math.max(0, ...filas.map((f) => f.m.w)) + 22, caja.titulo.length * LETRA + 22);
      const alto = 22 + filas.reduce((s, f) => s + f.extra + f.m.h + 8, 0) + (filas.length ? 2 : 6);
      // Cada caja es un grupo con coordenadas propias: asi se la puede mover.
      const gm = el('g', { class: 'rep-marco-g' });
      raiz.append(gm);
      const bordeMarco = el('rect', { x: 8, y: 0, width: ancho, height: alto, rx: 6, class: 'rep-marco' + (caja.actual ? ' rep-actual' : '') });
      gm.append(bordeMarco);
      gm.append(texto(16, 15, caja.titulo, 'rep-funcion'));
      p.marco = caja.clave;
      let fy = 22;
      for (const f of filas) {
        fy += f.extra;
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
      marcosG.set(caja.clave, { clave: caja.clave, g: gm, rect: bordeMarco, alto, ancho, hasta: { y } });
      anchoPila = Math.max(anchoPila, ancho + 8);
      y += alto + 10;
    }
    const derechaPila = anchoPila;
    let alto = y;

    // ---- el montículo: tres grupos, cada uno en filas
    const visibles = bloquesVisibles(foto, anterior);
    const { lista, sueltos, sinPuntero } = repartir(foto, visibles, this.cabezas);
    // Al terminar el programa (ya no hay funciones) los bloques se quedan donde estaban: reubicarlos
    // por el orden de las direcciones confundiria. Solo cambia su marca ("inalcanzable").
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
    if (fijo) {
      for (const f of previa.filas) filas.push({ ...f });
      for (const b of visibles) {
        const pb = previa.bloques.get(b.id);
        lugares.set(b.id, { x: pb.hasta.x, y: pb.hasta.y, w: pb.w, h: pb.h, fila: pb.fila, columna: pb.columna });
      }
      by = previa.alto;
    } else {
      // Cada grupo va en su fila; los sin enlazar no llevan titulo: el bloque aparte y la flecha de la variable local bastan.
      colocar(lista);
      colocar(sueltos);
      colocar(sinPuntero);
    }
    alto = Math.max(alto, by);
    const ancho = Math.max(limite + 20, ...[...lugares.values()].map((l) => l.x + l.w + 20));

    // ---- dibujar cada bloque con su origen en (0, 0): despues se lo mueve
    const bloques = new Map();
    const enLista = new Set(lista.map((b) => b.id));
    const enSueltos = new Set(sueltos.map((b) => b.id));
    const vivosPrevios = new Set(anterior ? anterior.monticulo.filter((x) => x.vivo).map((x) => x.id) : []);
    const huerfanos = new Set(); // los que ahora ya nadie apunta
    for (const b of visibles) {
      const lugar = lugares.get(b.id);
      if (!lugar) continue;
      const { v, ruta } = sinEnvoltura(b.valor);
      const g = el('g', { class: 'rep-bloque-g' + (b.vivo ? '' : ' rep-g-liberado'), 'data-id': b.id });
      raiz.append(g);
      p.capa = g;
      p.bloque = b.id;
      p.dueno = { id: b.id, nombre: null, pila: false };
      const huerfano = b.vivo && !enLista.has(b.id) && !enSueltos.has(b.id) && !(foto.enCamino && foto.enCamino.includes(b.id));
      if (huerfano) huerfanos.add(b.id);
      // Si hasta recien alguien lo apuntaba: se queda sin nadie cuando la flecha termina de irse, no antes (el borde de
      // "inalcanzable" y su aviso aparecen despues de que la flecha se va; ver mostrar).
      const recienHuerfano = huerfano && Boolean(previa && previa.bloques.has(b.id) && previa.huerfanos && !previa.huerfanos.has(b.id));
      const clases = 'rep-bloque' + (b.vivo ? '' : ' rep-liberado') + (huerfano && !recienHuerfano ? ' rep-huerfano' : '');
      g.append(el('rect', { x: 0, y: ENCABEZADO, width: lugar.w, height: lugar.h, rx: 5, class: clases }));
      if (recienHuerfano) g.append(el('rect', { x: 0, y: ENCABEZADO, width: lugar.w, height: lugar.h, rx: 5, class: 'rep-bloque rep-huerfano rep-huerfano-nuevo' }));
      // Recien liberado: encima va el borde de antes, que se desvanece (ver mostrar).
      const recienLiberado = !b.vivo && vivosPrevios.has(b.id);
      if (recienLiberado) g.append(el('rect', { x: 0, y: ENCABEZADO, width: lugar.w, height: lugar.h, rx: 5, class: 'rep-bloque rep-fundido-bloque' }));
      g.append(texto(2, 8, String(b.dir), 'rep-direccion'));
      p.ancla(b.id, [], 0, ENCABEZADO, lugar.w, lugar.h);
      p.valor(v, PAD, ENCABEZADO + PAD, b.id, ruta);
      // El aviso va a la derecha de la direccion; si el bloque es tan chico que no entran los dos
      // (6 px por cifra, 5,6 por letra), va debajo del bloque, centrado. Como las flechas se dibujan encima, si de una
      // casilla del bloque sale una flecha que pasaria por el aviso, este se corre a la izquierda (junto a la direccion).
      const aviso = !b.vivo ? 'liberado' : huerfano ? 'inalcanzable' : '';
      if (aviso) {
        const claseAviso = 'rep-aviso' + (recienLiberado ? ' rep-aviso-nuevo' : '') + (recienHuerfano ? ' rep-huerfano-nuevo' : '');
        const anchoDir = String(b.dir).length * 6;
        const anchoAviso = aviso.length * 5.6;
        const entra = lugar.w >= anchoDir + anchoAviso + 10;
        const salidas = p.flechas.filter((f) => f.origen.bloque === b.id).map((f) => f.origen.x + f.origen.w / 2);
        const cruza = (desde, hasta) => salidas.some((cx) => cx >= desde - 6 && cx <= hasta + 6);
        if (!entra) g.append(texto(lugar.w / 2, ENCABEZADO + lugar.h + 11, aviso, claseAviso, { 'text-anchor': 'middle' }));
        else if (!cruza(lugar.w - 2 - anchoAviso, lugar.w - 2)) g.append(texto(lugar.w - 2, 8, aviso, claseAviso, { 'text-anchor': 'end' }));
        else g.append(texto(2 + anchoDir + 6, 8, aviso, claseAviso, { 'text-anchor': 'start' }));
      }
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
      else if (!lo) tipo = ld ? (ld.columna === 0 ? 'pila-izquierda' : 'pila-arriba') : ancla.marco != null && f.ruta.length && !ancla.lateral ? 'pila-sobre' : 'pila-pila';
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
      if (tipo === 'pila-sobre') {
        d.canal = ct.canales++;
        d.carril = carril('sobre', f.a);
      }
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
    const liberadosVisibles = new Set(visibles.filter((b) => !b.vivo).map((b) => b.id));
    const ctFinal = contador();
    const ctPrevio = contador();
    for (const f of p.flechas) {
      const final = describirEn(f, bloques, ctFinal, marcosG);
      const previo = previa && anterior ? describirEn(f, previa.bloques, ctPrevio, previa.marcosG) : null;
      // Una flecha nueva hacia un bloque que acaba de aparecer espera al final del movimiento.
      flechas.push({
        ...f,
        final,
        previo,
        tarde: Boolean(f.cambio && !previo),
        desdeNulo: p.eraNulo.has(f.claveOrigen),
        recienLiberada: Boolean(f.muerto && vivosAntes.has(f.a)),
        // Sale de un bloque liberado: es un dato viejo que quedo en la memoria, no un enlace que valga.
        deLiberado: f.origen.bloque != null && liberadosVisibles.has(f.origen.bloque),
      });
    }

    // Una flecha que seguia a una variable de un bloque o de una funcion que ya no esta: antes iba a esa variable (en la escena
    // anterior) y ahora termina en una "×". Se ve la caja desvanecerse y, despues, la flecha retroceder hasta la cruz.
    if (previa && anterior) {
      for (const fl of flechas) {
        if (fl.cambio || !fl.final || fl.final.tipo !== 'perdida' || fl.incierta) continue;
        const fp = previa.flechas.find((x) => x.claveOrigen === fl.claveOrigen && x.a === fl.a && x.final && x.final.tipo !== 'perdida' && x.final.destino && x.final.destino.marco != null);
        if (!fp) continue;
        fl.destinoSeVa = true;
        fl.destinoViejo = { f: fp, d: fp.final, escena: previa };
      }
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
    const capaResalte = el('g', { 'pointer-events': 'none' }); // los parpadeos de lo que acaba de recibir una direccion
    svg.append(defs, raiz, capaFlechas, capaResalte);
    this.alAire(svg);
    // La casilla a la que llega una flecha desde arriba (el primer elemento de un arreglo, por ejemplo) se marca con un borde de color.
    for (const fl of flechas) {
      if (fl.final && (fl.final.tipo === 'pila-sobre' || (fl.final.tipo === 'pila-pila' && fl.final.destino && fl.final.destino.lateral))) {
        const rect = p.rectas.get(clave(fl.a, fl.ruta));
        if (rect) rect.classList.add('rep-apuntada');
      }
    }
    // Un puntero que cambio de destino: como iba hacia el viejo (para deslizar la flecha). Un puntero
    // que dejo de apuntar (paso a NULL): una flecha que solo se ve retrayendose.
    const ctViejo = contador();
    const bloquesViejos = previa ? previa.bloques : bloques;
    const marcosViejos = previa ? previa.marcosG : marcosG;
    for (const fl of flechas) {
      if (!fl.cambio) continue;
      const prev = p.previos.get(fl.claveOrigen);
      // Un puntero que no tenia direccion (su flecha iba a un "?") y ahora apunta a algo: la punta se desliza del "?" al destino.
      if (!prev && p.eraIncierto.has(fl.claveOrigen)) {
        fl.viejo = describirEn({ ...fl, a: null, ruta: [] }, bloquesViejos, ctViejo, marcosViejos);
        fl.desdeIncierto = true;
        continue;
      }
      if (!prev || (prev.a === fl.a && prev.ruta.join('/') === fl.ruta.join('/'))) continue;
      if (!p.anclas.get(clave(prev.a, prev.ruta))) continue; // el destino viejo ya no esta a la vista
      fl.viejo = describirEn({ ...fl, a: prev.a, ruta: prev.ruta }, bloquesViejos, ctViejo, marcosViejos);
    }
    const retiradas = [];
    const conFlecha = new Set(p.flechas.map((f) => f.claveOrigen));
    for (const [llave, prev] of p.previos) {
      if (!p.cambios.has(llave) || conFlecha.has(llave)) continue;
      const origen = p.anclas.get(llave);
      // Un bloque liberado que ya nadie senala deja de dibujarse: se lo ve desvanecerse junto con la flecha.
      const seVaDeLaVista = Boolean(previa && previa.bloques.has(prev.a) && !bloques.has(prev.a));
      if (!origen || !(p.anclas.get(clave(prev.a, prev.ruta)) || seVaDeLaVista)) continue;
      // El puntero sigue ahi y su flecha termina (pasa a NULL): la flecha se contrae hasta su casilla.
      const r = { origen, deId: null, nombre: null, a: prev.a, ruta: prev.ruta, muerto: Boolean(prev.muerto), fuera: false, cambio: true, tarde: false, retirada: true, claveOrigen: llave, haciaNulo: p.ahoraNulo.has(llave) };
      if (seVaDeLaVista) Object.assign(r, { escenaOrigen: previa, desvanece: true });
      r.viejo = describirEn(r, bloquesViejos, ctViejo, marcosViejos);
      retiradas.push(r);
    }
    // Un puntero que no tenia direccion (su flecha iba a un "?") y ahora es NULL: esa flecha tambien se contrae.
    for (const llave of p.eraIncierto) {
      if (!p.cambios.has(llave) || conFlecha.has(llave)) continue;
      const origen = p.anclas.get(llave);
      if (!origen) continue;
      const r = { origen, deId: null, nombre: null, a: null, ruta: [], muerto: false, fuera: false, cambio: true, tarde: false, retirada: true, incierta: true, marcaFija: true, claveOrigen: llave, haciaNulo: p.ahoraNulo.has(llave) };
      r.viejo = describirEn(r, bloquesViejos, ctViejo, marcosViejos);
      retiradas.push(r);
    }
    // Un puntero que desaparece (se va la caja de su funcion, o termina el bloque { } donde estaba declarado): su flecha se
    // desvanece en su lugar, en el mismo tiempo en que se dibujan las nuevas (la de main que recibe la direccion).
    if (previa && anterior) {
      for (const fp of previa.flechas) {
        if (fp.origen.marco == null || p.anclas.has(fp.claveOrigen) || !fp.final) continue;
        // Con retirada: si apuntaba a un bloque liberado se desvanece toda en rojo (y no con el cuerpo ambar de lo nuevo).
        retiradas.push({ ...fp, deId: null, nombre: null, cambio: true, retirada: true, tarde: false, previo: null, viejo: fp.final, escenaOrigen: previa, seVa: true });
      }
    }

    return {
      svg,
      bloques,
      filas,
      retiradas,
      desvanecen: [],
      destinoSeVa: flechas.some((f) => f.destinoSeVa),
      huerfanos,
      capaResalte,
      anclas: p.anclas,
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
      case 'pila-sobre': {
        // A un elemento (o un campo) de una variable de la pila: por un carril encima de su fila y hacia abajo, sobre la casilla.
        // La bajada final es lo que mide la cabeza (menos medio trazo): asi la base de la cabeza queda a la altura del borde de arriba del carril.
        const { grosor, cabeza } = medidasDeCabeza(f);
        const cx = derechaPila + 8 + 6 * d.canal;
        const lane = T.y - (cabeza - grosor / 2) - (grosor + 1.5) * Math.min(d.carril, 2);
        const xx = tx + 6 * Math.min(d.ranura, 3);
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
    // Una flecha que se retira (el puntero pasa a NULL, el bloque se va de la vista o termina la funcion) conserva su
    // color, azul o rojo segun adonde apuntaba, y va mas gruesa para que se vea que cambia: el ambar es solo de lo que llega.
    const retirada = Boolean(f.retirada);
    // La que acaba de pasar a rojo porque se libero el bloque que apunta: queda mas gruesa mientras se ve este paso.
    const rojaNueva = f.recienLiberada && f.muerto && d.tipo !== 'perdida' && !retirada;
    const g = el('g', {
      class: 'rep-flecha-g' + (f.cambio && !retirada ? ' rep-nueva' : '') + (retirada ? ' rep-retirada' : '') + (rojaNueva ? ' rep-roja-nueva' : '') + (f.tarde ? ' rep-tarde' : ''),
      'data-o': f.deId,
      'data-d': f.a,
      'data-i': indice,
      'data-k': f.claveOrigen || '',
    });
    // Mientras se atenuan las flechas que no intervienen: la que cambia o la que recorre un acceso queda como estaba.
    if (f.cambio || f.retirada || (this.involucradas && this.involucradas.has(f.claveOrigen))) g.classList.add('rep-activa');
    if (this.enfoquePregunta && this.enfoquePregunta.has(f.claveOrigen)) g.classList.add('rep-enfocada');
    g.puntosCompletos = puntos;
    // Una flecha nueva hacia un bloque que acaba de aparecer espera a que termine el movimiento.
    if (f.tarde && this.fase !== 'FIN') g.style.opacity = '0';
    // Punteada y roja: apunta a algo que no esta (una variable que ya no existe) o fuera del arreglo.
    // Continua y roja: apunta a un bloque liberado (el puntero sigue apuntando, pero la memoria ya no es suya).
    // Punteada y de otro color: un puntero que nunca recibio una direccion (hacia un "?"): no es un error, es algo que no se sabe.
    const incierta = Boolean(f.incierta);
    const punteada = !incierta && (f.fuera || d.tipo === 'perdida');
    const liberada = f.muerto && d.tipo !== 'perdida';
    // La que sale de un bloque liberado (y no apunta a otro liberado ni a algo que no esta) se apaga en gris: el dato sigue
    // ahi, pero ya no es un enlace de la lista.
    const vieja = Boolean(f.deLiberado) && !liberada && !punteada && !f.cambio && !retirada;
    if (vieja) g.classList.add('rep-de-liberado');
    const marcaNormal = vieja ? 'url(#rep-punta-vieja)' : f.cambio && !retirada ? 'url(#rep-punta-nueva)' : 'url(#rep-punta)';
    const trazado = camino(puntos);
    // Un trazo invisible y ancho, para poder senalarla con el cursor o con el dedo.
    g.append(el('path', { d: trazado, class: 'rep-flecha-zona' }));
    g.append(
      el('path', {
        d: trazado,
        class: 'rep-flecha' + (incierta ? ' rep-flecha-incierta' : punteada ? ' rep-flecha-mala' : liberada ? ' rep-flecha-liberada' : ''),
        'marker-end': incierta ? 'url(#rep-punta-incierta)' : punteada || liberada ? 'url(#rep-punta-mala)' : marcaNormal,
      })
    );
    // En el paso en que se libera el bloque, la flecha pasa de azul a rojo con un fundido.
    if (liberada && f.recienLiberada && this.fundir && this.fase === 'FIN') {
      g.append(el('path', { d: trazado, class: 'rep-flecha rep-fundido', 'marker-end': 'url(#rep-punta)' }));
    }
    // Al final de la que no sabe adonde va, un "?" (magenta); al final de la que apunta a algo que ya no esta, una "×" (roja):
    // no se sabe frente a no hay nada. El "✗" queda para el falso de una condicion.
    if (d.tipo === 'perdida' && !f.marcaFija) g.append(incierta ? texto(fin.x + 6, fin.y + 4, '?', 'rep-incierto-texto') : texto(fin.x + 6, fin.y + 4, '×', 'rep-perdida-texto'));
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

  // El texto (data-k) de una casilla de la escena de ahora, o null.
  textoDeCasilla(k) {
    for (const t of this.escena.svg.querySelectorAll('text[data-k]')) if (t.getAttribute('data-k') === k) return t;
    return null;
  }

  // El punto de una casilla de puntero de la escena de ahora, o null.
  puntoDeCasilla(k) {
    for (const c of this.escena.svg.querySelectorAll('circle[data-k]')) if (c.getAttribute('data-k') === k) return c;
    return null;
  }

  // Lo que la animacion le hizo a las casillas (el NULL que aparece, el punto que crece) vuelve a como esta en la figura.
  restaurarCasillas() {
    for (const t of this.nulosAnimados) {
      t.style.opacity = '';
      t.style.transform = '';
    }
    this.nulosAnimados.clear();
    for (const c of this.puntosAnimados) c.setAttribute('r', '4');
    this.puntosAnimados.clear();
  }

  // Un puntero pasa a NULL: cuando la flecha termino de contraerse (hasta 0,7 del tiempo), el punto se achica y la palabra emerge.
  puntoANulo(r, k, hijos) {
    const e = Math.max(0, (k - 0.7) / 0.3);
    const caja = this.absolutoDe(this.escena, r.origen);
    if (caja && e < 1) {
      hijos.push(el('circle', { cx: caja.x + caja.w / 2, cy: caja.y + caja.h / 2, r: 4 * (1 - e), class: 'rep-punto' + (r.incierta ? ' rep-punto-incierto' : '') }));
    }
    const t = this.textoDeCasilla(r.claveOrigen);
    if (t) {
      t.style.opacity = String(e);
      t.style.transformBox = 'fill-box';
      t.style.transformOrigin = 'center';
      t.style.transform = `scale(${0.6 + 0.4 * e})`;
      this.nulosAnimados.add(t);
    }
  }

  // Un puntero pasa de NULL a una direccion: la palabra se retira y el punto crece, antes de que la flecha empiece a salir.
  nuloQueSale(f, e, hijos) {
    const caja = this.absolutoDe(this.escena, f.origen);
    if (caja && e < 1) {
      const t = texto(caja.x + caja.w / 2, caja.y + caja.h / 2 + 4, 'NULL', 'rep-nulo-saliente', { 'text-anchor': 'middle' });
      t.style.opacity = String(1 - e);
      hijos.push(t);
    }
    const c = this.puntoDeCasilla(f.claveOrigen);
    if (c) {
      c.setAttribute('r', String(4 * e));
      this.puntosAnimados.add(c);
    }
  }

  // La flecha de un puntero que sigue ahi pero cuyo destino se va (la variable de un bloque o de una funcion que termina): quieta y
  // roja mientras lo que se va se desvanece (primer 40 % del tiempo A) y, desde el 50 %, la punta retrocede hasta el muñon de la
  // "×" mientras se vuelve punteada.
  flechaQueRetrocede(f, filas, indice, hijos) {
    const viejo = f.destinoViejo;
    const completa = this.rutaPuntos(viejo.f, viejo.d, viejo.escena.filas, viejo.escena);
    const corta = this.rutaPuntos(f, f.final, filas);
    const retro = Math.max(0, (this.kA - 0.5) / 0.5);
    const color = Math.min(1, retro * 2);
    const puntos = unir(completa, corta, retro);
    const sinNombre = { ...f, nombre: null, retirada: false };
    // Desde que empieza este tiempo el cuerpo ya es rojo (continuo: sigue yendo a la variable que se desvanece); al retroceder
    // se vuelve punteado.
    const continua = this.grupoDeFlecha({ ...sinNombre, cambio: false, muerto: true }, viejo.d, puntos, indice);
    continua.classList.add('rep-activa');
    continua.style.opacity = String(1 - color);
    hijos.push(continua);
    if (color > 0) {
      const roja = this.grupoDeFlecha({ ...sinNombre, cambio: false, marcaFija: true }, f.final, puntos, indice);
      roja.classList.add('rep-activa');
      const punta = puntos[puntos.length - 1];
      roja.append(texto(punta.x + 6, punta.y + 4, '×', 'rep-perdida-texto'));
      roja.style.opacity = String(color);
      hijos.push(roja);
    }
  }

  pintarFlechas() {
    const { flechas, capaFlechas } = this.escena;
    // Los bloques que se van de la vista se desvanecen en el tiempo A, a la vez que la flecha que los senalaba.
    // (si hay una flecha cuyo destino se va, lo que se va se desvanece en el primer 40 % del tiempo A y la flecha retrocede despues)
    const velo = Math.max(0, 1 - this.kA / (this.escena.destinoSeVa ? 0.4 : 1));
    for (const d of this.escena.desvanecen) {
      if (this.animandoA) d.g.style.opacity = String(velo);
      else d.g.remove();
    }
    if (!this.animandoA) this.escena.desvanecen = [];
    const antes = this.fase === 'A';
    const filas = antes ? this.escena.filasPrevias : this.escena.filas;
    const hijos = [];
    flechas.forEach((f, indice) => {
      const d = antes ? f.previo : f.final;
      if (!d) return;
      if (this.animandoA && f.destinoSeVa) {
        this.flechaQueRetrocede(f, filas, indice, hijos);
        return;
      }
      let puntos = this.rutaPuntos(f, d, filas);
      if (this.animandoA && f.cambio) {
        // La flecha que cambio: si iba a otro lado, la punta se desliza del destino viejo al nuevo;
        // si no iba a ninguno, se va dibujando (si el puntero era NULL, primero la palabra da paso al punto).
        if (f.viejo) puntos = unir(this.rutaPuntos(f, f.viejo, filas), puntos, this.kA);
        else if (f.desdeNulo && !f.tarde) {
          this.nuloQueSale(f, Math.min(1, this.kA / 0.25), hijos);
          puntos = recortar(puntos, largoDe(puntos) * Math.max(0, (this.kA - 0.25) / 0.75));
        } else puntos = recortar(puntos, largoDe(puntos) * this.kA);
        if (!puntos) return;
      }
      const grupo = this.grupoDeFlecha(f, d, puntos, indice);
      // La flecha que iba a un "?": el "?" se queda donde estaba y se desvanece mientras la punta se desliza.
      if (this.animandoA && f.desdeIncierto && f.viejo) {
        const vieja = this.rutaPuntos(f, f.viejo, filas);
        const marca = texto(vieja[vieja.length - 1].x + 6, vieja[vieja.length - 1].y + 4, '?', 'rep-incierto-texto');
        marca.style.opacity = String(Math.max(0, 1 - this.kA));
        grupo.append(marca);
      }
      hijos.push(grupo);
    });
    // Las flechas que se retiran, resaltadas antes (ver "retencion" en mostrar). Si el puntero sigue ahi y su flecha termina
    // (pasa a NULL), se contrae hasta su casilla y, si es NULL, el punto se achica y la palabra emerge. Si el puntero mismo
    // desaparece (se va la caja de su funcion o termina el bloque donde estaba), la flecha se desvanece en su lugar.
    if (!this.animandoA) this.restaurarCasillas();
    if (this.animandoA) {
      for (const r of this.escena.retiradas) {
        if (!r.viejo) continue;
        const completa = this.rutaPuntos(r, r.viejo, filas, r.escenaOrigen || this.escena);
        if (r.seVa) {
          const g = this.grupoDeFlecha(r, r.viejo, completa, -1);
          g.style.opacity = String(velo);
          hijos.push(g);
          continue;
        }
        const contraccion = r.haciaNulo ? Math.min(1, this.kA / 0.7) : this.kA;
        const puntos = recortar(completa, largoDe(completa) * (1 - contraccion));
        if (puntos) hijos.push(this.grupoDeFlecha(r, r.viejo, puntos, -1));
        // El "?" se queda donde estaba y se desvanece de a poco mientras la flecha se contrae.
        if (r.incierta) {
          const punta = completa[completa.length - 1];
          const marca = texto(punta.x + 6, punta.y + 4, '?', 'rep-incierto-texto');
          marca.style.opacity = String(Math.max(0, 1 - contraccion));
          hijos.push(marca);
        }
        if (r.haciaNulo) this.puntoANulo(r, this.kA, hijos);
      }
    }
    capaFlechas.replaceChildren(...hijos);
    for (const trazo of capaFlechas.querySelectorAll('.rep-fundido')) {
      if (!trazo.animate) continue;
      const fundido = this.dFundido || 450;
      const destello = this.dDestello || 0;
      // La roja (que queda mas gruesa) se ve recien cuando la azul se desvanece: si no, asomaria por los costados.
      const roja = trazo.parentNode.querySelector('.rep-flecha-liberada');
      if (!destello) {
        trazo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fundido, delay: this.retardoFundido || 0, easing: 'ease-in-out', fill: 'both' });
        if (roja) roja.animate([{ opacity: 0 }, { opacity: 1 }], { duration: fundido, delay: this.retardoFundido || 0, easing: 'ease-in-out', fill: 'both' });
        continue;
      }
      // Una expansion: la azul se engrosa y, desde el punto mas ancho, se desvanece hasta el grosor 3 mientras aparece la
      // roja (que se queda en ese grosor hasta el paso siguiente).
      const demora = (this.retardoFundido || 0) + (this.retrasoFlechas || 0);
      trazo.animate(
        [
          { opacity: 1, strokeWidth: '1.6px', offset: 0 },
          { opacity: 1, strokeWidth: '4.2px', offset: 0.4 },
          { opacity: 0, strokeWidth: '3px', offset: 1 },
        ],
        { duration: destello, delay: demora, easing: 'ease-in-out', fill: 'both' }
      );
      if (roja) {
        roja.animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.4 }, { opacity: 1, offset: 1 }], { duration: destello, delay: demora, easing: 'ease-in-out', fill: 'both' });
      }
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
          if (c.enum) return c.enum + ' (' + c.v + ')';
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
