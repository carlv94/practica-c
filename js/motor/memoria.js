// La memoria del programa: variables y bloques, cada uno con su direccion.
//
// Todo lo que vive en memoria es un "almacen":
//   escalar:    { t, v }                v: un numero, un puntero, null (NULL) o undefined (sin valor)
//   estructura: { t, campos }           campos: Map nombre -> almacen
//   arreglo:    { t, elems }            elems: [almacen]
//
// Una "reserva" es un trozo de memoria con identidad: una variable (de la pila o
// global) o un bloque del montículo. Guarda su almacen en "raiz".
//
// Un puntero es { reserva, st, arr, i }: "st" es el almacen al que apunta; si es
// una posicion de un arreglo, "arr" es ese arreglo e "i" la posicion (que puede
// valer el largo, una posicion pasada del final, a la que no se puede llegar con *).
// NULL es null y un puntero sin valor es undefined.

import { tamano, alineacion, arreglo, puntero as tipoPuntero } from './tipos.js';

export function almacen(tipo) {
  switch (tipo.k) {
    case 'struct': {
      const campos = new Map();
      for (const c of tipo.campos || []) campos.set(c.nombre, almacen(c.tipo));
      return { t: tipo, campos };
    }
    case 'arr':
      return { t: tipo, elems: Array.from({ length: tipo.n }, () => almacen(tipo.de)) };
    default:
      return { t: tipo, v: undefined };
  }
}

// Todo en cero: lo que tienen las variables globales y lo que da calloc.
export function ceros(st) {
  if (st.campos) st.campos.forEach(ceros);
  else if (st.elems) st.elems.forEach(ceros);
  else st.v = st.t.k === 'ptr' ? null : 0;
}

// Copia los valores de "origen" en "destino" (dos almacenes del mismo tipo).
export function copiar(destino, origen) {
  if (destino.campos) {
    for (const [nombre, c] of destino.campos) copiar(c, origen.campos.get(nombre));
  } else if (destino.elems) {
    destino.elems.forEach((e, i) => copiar(e, origen.elems[i]));
  } else {
    destino.v = origen.v;
  }
}

export const punteroA = (reserva, st) => ({ reserva, st, arr: null, i: 0 });
export const punteroEnArreglo = (reserva, arr, i) => ({ reserva, st: arr.elems[i], arr, i });

export const mismoDestino = (a, b) => {
  if (a === null || b === null) return a === b;
  if (a.reserva !== b.reserva) return false;
  if (a.arr || b.arr) return a.arr === b.arr && a.i === b.i;
  return a.st === b.st;
};

// Los corrimientos (en bytes) de cada campo de una estructura.
function corrimientos(t) {
  if (t._offs) return t._offs;
  let fin = 0;
  t._offs = (t.campos || []).map((c) => {
    if (t.esUnion) return 0;
    const a = alineacion(c.tipo);
    const inicio = Math.ceil(fin / a) * a;
    fin = inicio + tamano(c.tipo);
    return inicio;
  });
  return t._offs;
}

// Donde esta "objetivo" dentro de "st", en bytes desde el comienzo; null si no esta.
export function corrimientoDe(st, objetivo, base = 0) {
  if (st === objetivo) return base;
  if (st.elems) {
    const paso = tamano(st.t.de);
    for (let i = 0; i < st.elems.length; i++) {
      const r = corrimientoDe(st.elems[i], objetivo, base + i * paso);
      if (r != null) return r;
    }
  } else if (st.campos) {
    const offs = corrimientos(st.t);
    let k = 0;
    for (const c of st.campos.values()) {
      const r = corrimientoDe(c, objetivo, base + offs[k++]);
      if (r != null) return r;
    }
  }
  return null;
}

// La direccion (numero) a la que apunta un puntero.
export function direccionDe(p) {
  if (p === null) return 0;
  if (p.arr) {
    const base = corrimientoDe(p.reserva.raiz, p.arr) ?? 0;
    return p.reserva.dir + base + p.i * tamano(p.arr.t.de);
  }
  return p.reserva.dir + (corrimientoDe(p.reserva.raiz, p.st) ?? 0);
}

const DIRECCION_GLOBALES = 200;
const DIRECCION_PILA = 1000;
const DIRECCION_MONTICULO = 5000;
const MEMORIA_MAXIMA = 1 << 20; // bytes vivos en el montículo antes de que malloc devuelva NULL

export class Memoria {
  constructor() {
    this.sigId = 1;
    this.globales = [];
    this.monticulo = [];
    this.sp = DIRECCION_PILA;
    this.dirGlobal = DIRECCION_GLOBALES;
    this.dirMonticulo = DIRECCION_MONTICULO;
    this.vivos = 0; // bytes del montículo sin liberar
  }

  // Una variable. "region": 'pila' o 'global'.
  variable(region, nombre, tipo) {
    const tam = tamano(tipo);
    const al = alineacion(tipo);
    let dir;
    if (region === 'global') {
      dir = Math.ceil(this.dirGlobal / al) * al;
      this.dirGlobal = dir + tam;
    } else {
      dir = Math.ceil(this.sp / al) * al;
      this.sp = dir + tam;
    }
    const reserva = { id: this.sigId++, region, nombre, tipo, dir, tam, vivo: true, muerte: null, raiz: almacen(tipo) };
    if (region === 'global') {
      ceros(reserva.raiz);
      this.globales.push(reserva);
    }
    return reserva;
  }

  // Un texto escrito entre comillas: vive en una zona que no se puede cambiar.
  texto(codigos) {
    const tipo = arreglo({ k: 'int', nombre: 'char', bytes: 1, sinSigno: false, esChar: true }, codigos.length + 1);
    const dir = Math.ceil(this.dirGlobal / 1) * 1;
    this.dirGlobal = dir + tipo.n;
    const reserva = { id: this.sigId++, region: 'texto', nombre: null, tipo, dir, tam: tipo.n, vivo: true, muerte: null, raiz: almacen(tipo), soloLectura: true };
    reserva.raiz.elems.forEach((e, i) => (e.v = i < codigos.length ? codigos[i] : 0));
    this.globales.push(reserva);
    return reserva;
  }

  marcaDePila() {
    return this.sp;
  }

  soltarPila(marca) {
    this.sp = marca;
  }

  matar(reserva, motivo) {
    reserva.vivo = false;
    reserva.muerte = motivo;
  }

  // Un bloque del montículo, todavia sin tipo (lo toma al asignarlo a un puntero).
  reservar(bytes, enCeros = false) {
    if (this.vivos + bytes > MEMORIA_MAXIMA) return null;
    const dir = Math.ceil(this.dirMonticulo / 8) * 8;
    this.dirMonticulo = dir + Math.max(bytes, 1);
    this.vivos += bytes;
    const reserva = { id: this.sigId++, region: 'monticulo', nombre: null, tipo: null, dir, tam: bytes, vivo: true, muerte: null, raiz: null, enCeros };
    this.monticulo.push(reserva);
    return reserva;
  }

  liberar(reserva) {
    this.vivos -= reserva.tam;
    this.matar(reserva, 'liberado');
  }

  // El bloque pasa a ser un arreglo de elementos de ese tipo (los que entren).
  tiparBloque(reserva, tipoElemento) {
    if (reserva.raiz) return;
    const n = Math.floor(reserva.tam / tamano(tipoElemento));
    reserva.tipoElemento = tipoElemento;
    reserva.raiz = almacen(arreglo(tipoElemento, n));
    if (reserva.enCeros) ceros(reserva.raiz);
  }

  fugas() {
    return this.monticulo.filter((r) => r.vivo);
  }
}

export { tipoPuntero };
