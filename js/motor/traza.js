// La traza: una fotografia del estado del programa por cada paso.
//
// Una fotografia es un objeto simple (se puede guardar como JSON) con:
//   linea:     la linea que esta por ejecutarse (1 es la primera), o null al terminar
//   salida:    lo que el programa mostro hasta ahora
//   globales:  las variables globales
//   marcos:    las funciones en curso, de la primera llamada a la ultima, con sus variables
//   monticulo: los bloques reservados con malloc (los liberados siguen, marcados)
//
// Cada variable o bloque es { id, nombre, tipo, dir, tam, vivo, valor }. Un valor es:
//   { k: 'num', v, t }                un numero (t: el tipo)
//   { k: 'sinvalor', t }              todavia sin valor
//   { k: 'nulo' }                     un puntero NULL
//   { k: 'ptr', a, ruta, fuera }      un puntero al bloque o variable "a"; "ruta" es el camino
//                                     (campos y posiciones) hasta lo que apunta
//   { k: 'est', t, campos: [{ n, v }] }
//   { k: 'arr', t, elems: [...], texto }   "texto" si es una cadena de letras

import { textoDeTipo } from './tipos.js';
import { almacen } from './memoria.js';

function rutaDe(st, objetivo) {
  if (st === objetivo) return [];
  if (st.elems) {
    for (let i = 0; i < st.elems.length; i++) {
      const r = rutaDe(st.elems[i], objetivo);
      if (r) return [i, ...r];
    }
  } else if (st.campos) {
    for (const [nombre, c] of st.campos) {
      const r = rutaDe(c, objetivo);
      if (r) return [nombre, ...r];
    }
  }
  return null;
}

function serializarPuntero(p) {
  if (p === undefined) return { k: 'sinvalor', t: 'puntero' };
  if (p === null) return { k: 'nulo' };
  const raiz = p.reserva.raiz;
  if (p.arr) {
    const base = rutaDe(raiz, p.arr) ?? [];
    return { k: 'ptr', a: p.reserva.id, ruta: [...base, p.i], fuera: p.i < 0 || p.i >= p.arr.elems.length, muerto: !p.reserva.vivo };
  }
  return { k: 'ptr', a: p.reserva.id, ruta: (raiz && rutaDe(raiz, p.st)) || [], fuera: false, muerto: !p.reserva.vivo };
}

export function serializar(st) {
  const tipo = st.t;
  if (st.campos) {
    return { k: 'est', t: textoDeTipo(tipo), campos: [...st.campos].map(([n, c]) => ({ n, v: serializar(c) })) };
  }
  if (st.elems) {
    const salida = { k: 'arr', t: textoDeTipo(tipo), elems: st.elems.map(serializar) };
    if (tipo.de.esChar) {
      const codigos = [];
      for (const e of st.elems) {
        if (e.v === 0 || e.v === undefined) break;
        codigos.push(e.v);
      }
      if (st.elems.some((e) => e.v === 0)) salida.texto = String.fromCharCode(...codigos);
    }
    return salida;
  }
  if (tipo.k === 'ptr') return serializarPuntero(st.v);
  if (st.v === undefined) return { k: 'sinvalor', t: textoDeTipo(tipo) };
  return { k: 'num', v: st.v, t: tipo.nombre };
}

const deLaReserva = (r) => ({
  id: r.id,
  nombre: r.nombre,
  tipo: r.tipo ? textoDeTipo(r.tipo) : r.tipoElemento ? textoDeTipo(r.tipoElemento) : null,
  dir: r.dir,
  tam: r.tam,
  vivo: r.vivo,
  muerte: r.muerte,
  valor: r.raiz ? serializar(r.raiz) : { k: 'sinvalor', t: 'bloque sin tipo' },
});

// Una variable que su funcion todavia no declaro: existe en el marco, sin valor.
// Tiene la forma que va a tener (los campos de una estructura, con "?"), asi la
// caja de la funcion no cambia de tamano cuando se la declara.
function pendiente(d) {
  let valor;
  try {
    valor = d.tipo.k === 'arr' && d.tipo.n == null ? { k: 'sinvalor', t: textoDeTipo(d.tipo) } : serializar(almacen(d.tipo));
  } catch (e) {
    valor = { k: 'sinvalor', t: textoDeTipo(d.tipo) };
  }
  return { id: -(d.id + 1), nombre: d.nombre, tipo: textoDeTipo(d.tipo), dir: null, tam: null, vivo: true, muerte: null, pendiente: true, valor };
}

// Las variables de un marco: los parametros, las declaradas en el cuerpo de la funcion
// (desde el comienzo, las que faltan como pendientes) y las de los bloques en curso.
function variablesDelMarco(m) {
  const vivas = m.ambitos.flatMap((a) => [...a.values()]);
  const porDeclaracion = new Map(vivas.filter((v) => v.reserva.declId != null).map((v) => [v.reserva.declId, v]));
  const lista = vivas.filter((v) => v.reserva.declId == null).map((v) => deLaReserva(v.reserva));
  const delCuerpo = new Set();
  for (const d of m.declaraciones || []) {
    delCuerpo.add(d.id);
    const v = porDeclaracion.get(d.id);
    lista.push(v ? deLaReserva(v.reserva) : pendiente(d));
  }
  for (const v of vivas) if (v.reserva.declId != null && !delCuerpo.has(v.reserva.declId)) lista.push(deLaReserva(v.reserva));
  return lista;
}

export function fotografia(motor, linea) {
  return {
    linea,
    salida: motor.salida,
    globales: motor.memoria.globales.filter((r) => r.region === 'global' && r.nombre).map(deLaReserva),
    marcos: motor.marcos.map((m) => ({
      funcion: m.funcion,
      variables: variablesDelMarco(m),
    })),
    monticulo: motor.memoria.monticulo.map(deLaReserva),
  };
}
