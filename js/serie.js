// Recorrer una serie: que codigo tiene delante cada consigna y como queda
// despues de resolverla. Lo usan la pantalla y las pruebas, para que las dos
// armen el contexto igual.
//
// El "avance" es lo que deja lo ya resuelto:
//   { contexto, capturas }
// y el codigo que tiene delante una consigna es, si continua, ese contexto, mas
// su "dado": el codigo que la consigna trae escrito y el alumno no tiene que
// tipear (las variables sobre las que se le pide trabajar).

import { corregir } from './corrector.js';

const unir = (...partes) => partes.filter((p) => p && p.trim()).join('\n\n');

export const inicio = () => ({ contexto: '', capturas: {} });

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
export const capturasPrevias = (serie, indice, avance) =>
  continuaLaAnterior(serie, indice) ? avance.capturas : {};

// El codigo que se ve arriba de la respuesta en la consigna numero "indice".
export function codigoPrevio(serie, indice, avance) {
  return unir(contextoPrevio(serie, indice, avance), serie.consignas[indice].dado);
}

export function corregirPaso(analizador, serie, indice, avance, respuesta) {
  return corregir(analizador, serie.consignas[indice], {
    contexto: codigoPrevio(serie, indice, avance),
    respuesta,
    capturas: capturasPrevias(serie, indice, avance),
    dentroDeMain: Boolean(serie.dentroDeMain),
    practicas: serie.buenasPracticas || [],
  });
}

// Si la serie pide buenas practicas, una respuesta puede ser excelente.
export const pidePracticas = (serie) => Boolean(serie.buenasPracticas?.length);

// El avance despues de aceptar una respuesta correcta. Si la consigna no
// continuaba, el codigo y las capturas arrancan de ella.
export function despuesDe(serie, indice, avance, respuesta, resultado) {
  return {
    contexto: unir(codigoPrevio(serie, indice, avance), respuesta.trim()),
    capturas: resultado.capturas,
  };
}
