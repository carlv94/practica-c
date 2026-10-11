// Recorrer una serie: que codigo tiene delante cada consigna y como queda
// despues de resolverla. Lo usan la pantalla y las pruebas, para que las dos
// armen el contexto igual.
//
// El "avance" es lo que deja lo ya resuelto:
//   { contexto, capturas }
// y el codigo que tiene delante una consigna es ese contexto mas su "dado",
// el codigo que la consigna trae escrito y el alumno no tiene que tipear
// (las variables sobre las que se le pide trabajar).

import { corregir } from './corrector.js';

const unir = (...partes) => partes.filter((p) => p && p.trim()).join('\n\n');

export const inicio = () => ({ contexto: '', capturas: {} });

// El codigo que se ve arriba de la respuesta en la consigna numero "indice".
export function codigoPrevio(serie, indice, avance) {
  return unir(avance.contexto, serie.consignas[indice].dado);
}

export function corregirPaso(analizador, serie, indice, avance, respuesta) {
  return corregir(analizador, serie.consignas[indice], {
    contexto: codigoPrevio(serie, indice, avance),
    respuesta,
    capturas: avance.capturas,
    dentroDeMain: Boolean(serie.dentroDeMain),
    practicas: serie.buenasPracticas || [],
  });
}

// Si la serie pide buenas practicas, una respuesta puede ser excelente.
export const pidePracticas = (serie) => Boolean(serie.buenasPracticas?.length);

// El avance despues de aceptar una respuesta correcta.
export function despuesDe(serie, indice, avance, respuesta, resultado) {
  return {
    contexto: unir(codigoPrevio(serie, indice, avance), respuesta.trim()),
    capturas: resultado.capturas,
  };
}
