// Recorrer una serie: que codigo tiene delante cada consigna y como queda
// despues de resolverla. Lo usan la pantalla y las pruebas, para que las dos
// armen el contexto igual.
//
// El "avance" es lo que deja lo ya resuelto:
//   { contexto, archivo, capturas, base }
// y el codigo que tiene delante una consigna es la "base", si continua el
// contexto, y su "dado": el codigo que la consigna trae escrito y el alumno no
// tiene que tipear (las variables sobre las que se le pide trabajar).
//
// La "base" es lo que dejan las consignas con "persiste": true (el #include de
// la biblioteca): lo ven todas las que siguen, continuen o no, y no se mezcla
// con el contexto acumulado de las que continuan.
//
// En una serie de sentencias ("dentroDeMain") hay dos lugares donde vive el
// codigo: el "archivo" (lo que va fuera de main: typedef, struct, union, enum)
// y el "contexto" (lo que va dentro: variables y sentencias). Una consigna
// dice dónde va su respuesta con "en": "archivo"; si no dice nada, va en main.
// Solo cuando una serie mezcla las dos cosas se le muestra al alumno el marco
// con main: en las demas, lo que escribe es todo del mismo lugar.

import { corregir, corregirOpcion } from './corrector.js';
import { sustituir } from './enunciado.js';

const unir = (...partes) => partes.filter((p) => p && p.trim()).join('\n\n');

export const inicio = () => ({ contexto: '', archivo: '', capturas: {}, base: '' });

// Si la consigna "indice" ve el codigo (y los nombres capturados) de las
// anteriores. Por defecto no: cada consigna es un programa nuevo. La que
// depende de lo anterior lo dice con "continua": true, o la serie entera con
// "continua": true y la excepcion se marca consigna por consigna con false.
//
// Que sea asi por defecto es a proposito: si se olvida marcar una que
// continua, su solucion de referencia no pasa y las pruebas lo avisan; si fuera
// al reves, el que se olvidara de cortar le daria al alumno un error de nombre
// repetido por algo que no tenia por que saber, y nada lo detectaria.
export function continuaLaAnterior(serie, indice) {
  if (indice === 0) return false;
  return serie.consignas[indice].continua ?? Boolean(serie.continua);
}

// Lo que se hereda de las consignas anteriores, o nada si esta no continua.
export const contextoPrevio = (serie, indice, avance) =>
  continuaLaAnterior(serie, indice) ? avance.contexto : '';
export const archivoPrevio = (serie, indice, avance) =>
  continuaLaAnterior(serie, indice) ? avance.archivo || '' : '';
export const capturasPrevias = (serie, indice, avance) =>
  continuaLaAnterior(serie, indice) ? avance.capturas : {};

// Si la respuesta de la consigna va fuera de main.
export const enArchivo = (consigna) => consigna.en === 'archivo';

// Una serie mezcla las dos zonas cuando sus sentencias van dentro de main y
// alguna de sus consignas pide una definicion fuera de ella.
export const esMixta = (serie) =>
  Boolean(serie.dentroDeMain) && serie.consignas.some((c) => enArchivo(c));

// Lo que tiene delante la consigna "indice", separado por lugar: lo que va
// fuera de main (con la base) y lo que va dentro.
export function partesPrevias(serie, indice, avance) {
  const consigna = serie.consignas[indice];
  const afuera = enArchivo(consigna);
  return {
    archivo: unir(avance.base, archivoPrevio(serie, indice, avance), afuera ? consigna.dado : ''),
    main: unir(contextoPrevio(serie, indice, avance), afuera ? '' : consigna.dado),
  };
}

// Las lineas del preprocesador (#define, #include) se ven arriba de todo, aunque
// esten entre las sentencias: no pertenecen a main.
function separarPreprocesador(codigo) {
  const arriba = [];
  const resto = [];
  for (const linea of codigo.split('\n')) (/^\s*#/.test(linea) ? arriba : resto).push(linea.trim());
  return { arriba: arriba.join('\n'), resto: resto.join('\n').replace(/^\n+|\n+$/g, '') };
}

// El marco que se le muestra al alumno: lo de afuera arriba, y lo de adentro
// en main, con un comentario donde va su respuesta.
function marco(serie, indice, avance) {
  const consigna = serie.consignas[indice];
  const { archivo, main } = partesPrevias(serie, indice, avance);
  const { arriba, resto } = separarPreprocesador(main);
  const aqui = '/* su respuesta va aquí */';
  const afuera = enArchivo(consigna);
  // Si no hay nada antes y la respuesta va afuera, no hay marco que mostrar.
  if (afuera && !arriba && !archivo && !resto) return '';
  const interior = [resto, afuera ? '' : aqui].filter(Boolean).join('\n');
  const sangrado = interior
    .split('\n')
    .map((l) => (l ? '  ' + l : l))
    .join('\n');
  return unir(
    arriba,
    archivo,
    afuera ? aqui : '',
    interior ? 'int main(void) {\n' + sangrado + '\n}' : ''
  );
}

// El codigo que se ve arriba de la respuesta en la consigna numero "indice".
export function codigoPrevio(serie, indice, avance) {
  if (esMixta(serie)) return marco(serie, indice, avance);
  return unir(avance.base, contextoPrevio(serie, indice, avance), serie.consignas[indice].dado);
}

export function corregirPaso(analizador, serie, indice, avance, respuesta) {
  const consigna = serie.consignas[indice];
  const capturas = capturasPrevias(serie, indice, avance);
  // Una consigna de opciones: la "respuesta" es el lugar de la opcion elegida,
  // y lo que se explica puede nombrar lo que el alumno escribio antes.
  if (consigna.opciones) {
    const r = corregirOpcion(consigna, respuesta);
    return {
      ...r,
      diagnosticos: r.diagnosticos.map((d) => ({ ...d, mensaje: sustituir(d.mensaje, capturas) })),
    };
  }
  const { archivo, main } = partesPrevias(serie, indice, avance);
  return corregir(analizador, consigna, {
    archivo,
    contexto: main,
    respuesta,
    capturas,
    dentroDeMain: Boolean(serie.dentroDeMain),
    enArchivo: enArchivo(consigna),
    // Una consigna puede pedir otras practicas que las de la serie.
    practicas: consigna.buenasPracticas ?? serie.buenasPracticas ?? [],
  });
}

// La respuesta modelo de una consigna: lo que escribiria quien la resuelve
// bien. En una de opciones es el lugar de la correcta.
export const respuestaDeReferencia = (consigna) =>
  consigna.opciones ? String(consigna.opciones.findIndex((o) => o.correcta)) : consigna.referencia;

// Si la serie pide buenas practicas, una respuesta puede ser excelente.
export const pidePracticas = (serie) =>
  Boolean(serie.buenasPracticas?.length) || serie.consignas.some((c) => c.buenasPracticas?.length);

// El avance despues de aceptar una respuesta correcta. Si la consigna no
// continuaba, el codigo y las capturas arrancan de ella.
export function despuesDe(serie, indice, avance, respuesta, resultado) {
  // Elegir una opcion no agrega codigo, salvo que la consigna diga que el suyo
  // "queda": lo que sigue lo ve entre lo ya escrito.
  const consigna = serie.consignas[indice];
  if (consigna.opciones) {
    if (!consigna.queda) return avance;
    const codigo = sustituir(consigna.codigo || '', capturasPrevias(serie, indice, avance));
    return { ...avance, contexto: unir(avance.contexto, codigo) };
  }
  // Lo que persiste pasa a ser de todas las que siguen, y no toca la cadena de
  // las que continuan.
  if (consigna.persiste) {
    return { ...avance, base: unir(avance.base, respuesta.trim()) };
  }
  const afuera = enArchivo(consigna);
  return {
    contexto: unir(contextoPrevio(serie, indice, avance), afuera ? '' : consigna.dado, afuera ? '' : respuesta.trim()),
    archivo: unir(archivoPrevio(serie, indice, avance), afuera ? consigna.dado : '', afuera ? respuesta.trim() : ''),
    capturas: resultado.capturas,
    base: avance.base,
  };
}
