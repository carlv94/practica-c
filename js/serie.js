// Recorrer una serie: que codigo tiene delante cada consigna y como queda
// despues de resolverla. Lo usan la pantalla y las pruebas, para que las dos
// armen el contexto igual.
//
// El "avance" es lo que deja lo ya resuelto:
//   { contexto, archivo, capturas, base, avisados }
// "avisados" son los codigos de las notas que ya se le dijeron: una nota se
// dice una sola vez en toda la serie, continuen o no las consignas.
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
// con main: en las demas, lo que escribe es todo del mismo lugar. Una consigna
// de opciones, en cambio, muestra siempre un programa completo para leer.
// La serie puede traer una "cabecera" (un #include) que se ve arriba de todo.
//
// Una consigna puede "partirDe" otra (parteDe: "id"): arranca con el codigo que
// esa consigna veia antes de ser respondida (su "visto"), en lugar de seguir
// la cadena de las anteriores. Y la serie puede traer un "dado" propio: codigo
// de main que ven todas sus consignas, continuen o no (el arreglo sobre el que
// trabajan todas).
//   avance.vistos: { [id]: { archivo, contexto, capturas } }

import { corregir, corregirOpcion } from './corrector.js';
import { sustituir } from './enunciado.js';

const unir = (...partes) => partes.filter((p) => p && p.trim()).join('\n\n');
// Lo que va dentro de main: una respuesta tras otra, sin lineas en blanco de por medio
// (las que el alumno escribio dentro de la suya se quedan).
const unirEnMain = (...partes) => partes.filter((p) => p && p.trim()).join('\n');

export const inicio = () => ({ contexto: '', archivo: '', capturas: {}, base: '', avisados: [], vistos: {} });

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

// Lo que veia la consigna de la que esta parte ("parteDe"), si lo dice.
// "parteDe": lo que veia esa consigna antes de responderla. "sigueDe": lo que
// quedo despues de su respuesta (el codigo que dejo, con lo que escribio el alumno).
const visto = (serie, indice, avance) => {
  const consigna = serie.consignas[indice];
  if (consigna.parteDe) return avance.vistos?.[consigna.parteDe] || null;
  if (consigna.sigueDe) return avance.vistos?.[consigna.sigueDe]?.quedo || null;
  return null;
};

// Lo que se hereda de las consignas anteriores, o nada si esta no continua.
export const contextoPrevio = (serie, indice, avance) => {
  const origen = visto(serie, indice, avance);
  if (origen) return origen.contexto;
  return continuaLaAnterior(serie, indice) ? avance.contexto : '';
};
export const archivoPrevio = (serie, indice, avance) => {
  const origen = visto(serie, indice, avance);
  if (origen) return origen.archivo;
  return continuaLaAnterior(serie, indice) ? avance.archivo || '' : '';
};
export const capturasPrevias = (serie, indice, avance) => {
  const origen = visto(serie, indice, avance);
  if (origen) return origen.capturas;
  return continuaLaAnterior(serie, indice) ? avance.capturas : {};
};

// Si la respuesta de la consigna va fuera de main.
export const enArchivo = (consigna) => consigna.en === 'archivo';

// Una serie mezcla las dos zonas cuando sus sentencias van dentro de main y
// alguna de sus consignas pide una definicion fuera de ella, o su cabecera
// trae una (una estructura ya declarada, ademas del #include).
const cabeceraConCodigo = (serie) =>
  (serie.cabecera || '').split('\n').some((l) => l.trim() && !l.trim().startsWith('#'));
export const esMixta = (serie) =>
  Boolean(serie.dentroDeMain) && (cabeceraConCodigo(serie) || serie.consignas.some((c) => enArchivo(c)));

// Lo que tiene delante la consigna "indice", separado por lugar: lo que va
// fuera de main (con la base) y lo que va dentro.
export function partesPrevias(serie, indice, avance) {
  const consigna = serie.consignas[indice];
  const afuera = enArchivo(consigna);
  return {
    archivo: unir(
      serie.cabecera,
      avance.base,
      archivoPrevio(serie, indice, avance),
      afuera ? consigna.dado : ''
    ),
    main: unirEnMain(serie.dado, contextoPrevio(serie, indice, avance), afuera ? '' : consigna.dado),
  };
}

// Sin espacios al final, y nunca mas de una linea en blanco seguida.
const limpiar = (t) =>
  t
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '');

// Las lineas del preprocesador (#define, #include) no pertenecen a main ni a
// ningun bloque: se ven juntas arriba de todo.
function sacarPreprocesador(codigo) {
  const pre = [];
  const resto = [];
  const lineas = codigo.split('\n');
  for (let i = 0; i < lineas.length; i++) {
    if (/^\s*#/.test(lineas[i])) {
      pre.push(lineas[i].trim());
      // La linea en blanco que le seguia (el #define y despues un espacio) se va con ella.
      if (i + 1 < lineas.length && !lineas[i + 1].trim()) i++;
    } else {
      resto.push(lineas[i]);
    }
  }
  return { pre, resto: limpiar(resto.join('\n')) };
}

// Un main con lo que va adentro, sangrado, y su return 0; al final. Los
// parentesis quedan vacios hasta que se vean las funciones.
function conMain(interior) {
  const lineas = [interior, 'return 0;'].filter(Boolean).join('\n');
  const sangrado = lineas
    .split('\n')
    .map((l) => (l ? '  ' + l : l))
    .join('\n');
  return 'int main() {\n' + sangrado + '\n}';
}

// El programa que se muestra: el preprocesador arriba (los #include primero),
// lo de afuera, y main con lo de adentro. "aqui" es el lugar de la respuesta.
function armar(archivo, main, { aquiAfuera = false, aquiAdentro = false } = {}) {
  const a = sacarPreprocesador(archivo);
  const m = sacarPreprocesador(main);
  const pre = [...new Set([...a.pre, ...m.pre])];
  const arriba = [...pre.filter((l) => /^#\s*include/.test(l)), ...pre.filter((l) => !/^#\s*include/.test(l))];
  const aqui = '/* su respuesta va aquí */';
  // El comentario con una linea en blanco antes y despues, para que se ubique
  // enseguida entre el resto del codigo.
  const interior = aquiAdentro ? (m.resto ? m.resto + '\n\n' : '') + aqui + '\n' : m.resto;
  return unir(arriba.join('\n'), a.resto, aquiAfuera ? aqui : '', interior ? conMain(interior) : '');
}

// El marco que se le muestra al alumno: lo de afuera arriba, y lo de adentro
// en main, con un comentario donde va su respuesta.
function marco(serie, indice, avance) {
  const afuera = enArchivo(serie.consignas[indice]);
  const { archivo, main } = partesPrevias(serie, indice, avance);
  // Si no hay nada antes y la respuesta va afuera, no hay marco que mostrar.
  if (afuera && !archivo.trim() && !main.trim()) return '';
  return armar(archivo, main, { aquiAfuera: afuera, aquiAdentro: !afuera });
}

// El programa que se le muestra en una consigna de opciones: el "archivo" y
// el "codigo" de la consigna (con lo que dejaron las anteriores, si continua),
// dentro de un main. Es para leer: no lleva el lugar de la respuesta.
// Un cuestionario puede no traer codigo propio ("codigo": ""): muestra lo que
// dejaron las consignas anteriores, si continua.
export function programaDeOpciones(serie, indice, avance) {
  const consigna = serie.consignas[indice];
  if (consigna.codigo == null) return '';
  const capturas = capturasPrevias(serie, indice, avance);
  const archivo = unir(
    serie.cabecera,
    avance.base,
    archivoPrevio(serie, indice, avance),
    sustituir(consigna.archivo || '', capturas)
  );
  const main = unirEnMain(contextoPrevio(serie, indice, avance), sustituir(consigna.codigo, capturas));
  return armar(archivo, main);
}

// El codigo que se ve arriba de la respuesta en la consigna numero "indice".
export function codigoPrevio(serie, indice, avance) {
  if (esMixta(serie)) return marco(serie, indice, avance);
  return unir(avance.base, serie.dado, contextoPrevio(serie, indice, avance), serie.consignas[indice].dado);
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
    avisados: avance.avisados || [],
  });
}

// La respuesta modelo de una consigna: lo que escribiria quien la resuelve
// bien. En una de opciones es el lugar de la correcta.
// La referencia puede nombrar con {C} lo que el alumno nombro en una consigna
// anterior (igual que el enunciado): con las capturas, queda con sus nombres.
export const respuestaDeReferencia = (consigna, capturas = {}) =>
  consigna.opciones
    ? String(consigna.opciones.findIndex((o) => o.correcta))
    : sustituir(consigna.referencia, capturas);

// Si la serie pide buenas practicas, una respuesta puede ser excelente.
export const pidePracticas = (serie) =>
  Boolean(serie.buenasPracticas?.length) || serie.consignas.some((c) => c.buenasPracticas?.length);

// El avance despues de aceptar una respuesta correcta. Si la consigna no
// continuaba, el codigo y las capturas arrancan de ella.
export function despuesDe(serie, indice, avance, respuesta, resultado) {
  const siguiente = despuesDeBase(serie, indice, avance, respuesta, resultado);
  const id = serie.consignas[indice].id;
  // Ademas de lo que veia, lo que quedo despues (para "sigueDe").
  return {
    ...siguiente,
    vistos: {
      ...siguiente.vistos,
      [id]: {
        ...siguiente.vistos[id],
        quedo: {
          archivo: siguiente.archivo || '',
          contexto: siguiente.contexto || '',
          capturas: siguiente.capturas || {},
        },
      },
    },
  };
}

function despuesDeBase(serie, indice, avance, respuesta, resultado) {
  // Elegir una opcion no agrega codigo, salvo que la consigna diga que el suyo
  // "queda": lo que sigue lo ve entre lo ya escrito.
  const consigna = serie.consignas[indice];
  // Lo que veia esta consigna antes de responderla, por si otra parte de ahi.
  const vistos = {
    ...(avance.vistos || {}),
    [consigna.id]: {
      archivo: unir(archivoPrevio(serie, indice, avance), enArchivo(consigna) ? consigna.dado : ''),
      contexto: unirEnMain(contextoPrevio(serie, indice, avance), enArchivo(consigna) ? '' : consigna.dado),
      capturas: capturasPrevias(serie, indice, avance),
    },
  };
  if (consigna.opciones) {
    if (!consigna.queda) return { ...avance, vistos };
    const capturas = capturasPrevias(serie, indice, avance);
    return {
      ...avance,
      vistos,
      // Si el cuestionario no continua, lo que queda arranca de su codigo.
      contexto: unirEnMain(contextoPrevio(serie, indice, avance), sustituir(consigna.codigo || '', capturas)),
      archivo: unir(archivoPrevio(serie, indice, avance), sustituir(consigna.archivo || '', capturas)),
    };
  }
  // Lo que persiste pasa a ser de todas las que siguen, y no toca la cadena de
  // las que continuan.
  if (consigna.persiste) {
    return { ...avance, vistos, base: unir(avance.base, respuesta.trim()) };
  }
  const afuera = enArchivo(consigna);
  const notas = resultado.diagnosticos.filter((d) => d.nivel === 'nota').map((d) => d.codigo);
  return {
    avisados: [...new Set([...(avance.avisados || []), ...notas])],
    contexto: unirEnMain(
      contextoPrevio(serie, indice, avance),
      afuera ? '' : consigna.dado,
      afuera ? '' : respuesta.trim()
    ),
    archivo: unir(archivoPrevio(serie, indice, avance), afuera ? consigna.dado : '', afuera ? respuesta.trim() : ''),
    capturas: resultado.capturas,
    base: avance.base,
    vistos,
  };
}
