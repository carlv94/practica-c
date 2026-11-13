// Lo que se le dice al alumno cuando el motor de memoria encuentra un error.
//
// Es el catalogo de mensajes del motor: un texto por codigo (ver errores.js),
// escrito para quien recien empieza, tratando de "usted" y con acento grave
// para el codigo. Todo lo que cambia de un docente a otro (el tono, el idioma)
// esta aca y en ningun otro lado.
//
// "con" es lo que antecede al mensaje cuando se probo con una entrada: "Con la
// entrada `3 1 2`, ". Sin entrada es una cadena vacia.

const BT = '`';

const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

// "Con ..., " + una frase que empieza en minuscula; sin "con", la frase empieza en mayuscula.
const frase = (con, texto) => (con ? con + texto : mayuscula(texto));

const posiciones = (n) => `${n} ${n === 1 ? 'posición' : 'posiciones'}`;
const elementos = (n) => (n === 0 ? 'ningún elemento' : `${n} ${n === 1 ? 'elemento' : 'elementos'}`);

const MENSAJES = {
  DESREFERENCIA_NULA: (con) =>
    frase(
      con,
      `el programa usa lo que hay en la dirección de un puntero que vale ${BT}NULL${BT}. ${BT}NULL${BT} es "no apunta a ningún lugar": no hay nada que leer ni que escribir. Antes de usar un puntero hay que comprobar que no sea ${BT}NULL${BT}.`
    ),
  PUNTERO_SIN_INICIALIZAR: (con) =>
    frase(
      con,
      `el programa usa un puntero al que nunca se le dio una dirección: todavía no apunta a ningún lugar. Hay que darle la dirección de una variable, la de un bloque reservado con ${BT}malloc${BT} o ${BT}NULL${BT} antes de usarlo.`
    ),
  USO_DE_MEMORIA_LIBERADA: (con) =>
    frase(
      con,
      `el programa usa un bloque de memoria después de liberarlo con ${BT}free${BT}: esa memoria ya no es del programa, y lo que había dentro puede haber cambiado. Después de ${BT}free${BT} hay que dejar de usar el bloque, y conviene asignarle ${BT}NULL${BT} al puntero.`
    ),
  VARIABLE_FUERA_DE_ALCANCE: (con) =>
    frase(
      con,
      `el programa usa la dirección de una variable cuando la función (o el bloque) donde estaba declarada ya terminó: la variable desapareció con ella. Lo que tiene que sobrevivir a la función se reserva con ${BT}malloc${BT}, que vive hasta que se lo libera.`
    ),
  LIBERACION_DOBLE: (con) =>
    frase(con, `el programa libera con ${BT}free${BT} un bloque que ya estaba liberado. Cada ${BT}malloc${BT} se libera una sola vez.`),
  LIBERACION_INVALIDA: (con, d) =>
    frase(
      con,
      d.region === 'pila' || d.region === 'global'
        ? `el programa llama a ${BT}free${BT} con la dirección de una variable común. ${BT}free${BT} solo libera lo que se reservó con ${BT}malloc${BT}: las variables comunes desaparecen solas.`
        : d.dir != null
          ? `el programa llama a ${BT}free${BT} con una dirección del medio de un bloque. ${BT}free${BT} tiene que recibir la misma dirección que devolvió ${BT}malloc${BT}, la del comienzo del bloque.`
          : `el programa llama a ${BT}free${BT} con algo que no viene de ${BT}malloc${BT}: ${BT}free${BT} solo libera bloques reservados con ${BT}malloc${BT}.`
    ),
  FUERA_DE_BLOQUE: (con, d) =>
    frase(
      con,
      `el programa usa la posición ${d.indice} de un bloque reservado con ${BT}malloc${BT} que tiene lugar para ${elementos(d.largo)}${d.largo > 0 ? `, numerados de 0 a ${d.largo - 1}` : ''}: esa posición está fuera del bloque. Si el bloque es más chico de lo esperado, revise cuántos bytes se piden: tiene que ser la cantidad de elementos por el tamaño de cada uno, con ${BT}sizeof${BT}.`
    ),
  FUERA_DE_RANGO: (con, d) =>
    frase(
      con,
      `el programa usa la posición ${d.indice} de un arreglo que tiene ${posiciones(d.largo ?? 0)}${d.largo ? `, numeradas de 0 a ${d.largo - 1}` : ''}: esa posición no existe.`
    ),
  ESCRITURA_EN_TEXTO: (con) =>
    frase(
      con,
      `el programa intenta cambiar un texto escrito entre comillas, y esos textos no se pueden modificar. Para poder cambiarlo hay que copiarlo en un arreglo de ${BT}char${BT}.`
    ),
  VARIABLE_SIN_VALOR: (con, d) =>
    d.puntero
      ? frase(con, `${BT}${d.texto}${BT} es un puntero que todavía no tiene una dirección cuando se usa: hay que dársela antes.`)
      : frase(con, `${BT}${d.texto ?? 'una variable'}${BT} todavía no tiene un valor cuando se usa: hay que dárselo antes.`),
  DIVISION_POR_CERO: (con) =>
    frase(con, `el programa divide por ${BT}0${BT}: esa división no se puede calcular. Hay que controlar antes que el divisor no sea cero.`),
  SIN_RETORNO: (con) =>
    frase(con, `el programa usa el valor de una función que no devuelve nada: o le falta el ${BT}return${BT}, o es una función ${BT}void${BT}.`),
  NO_TERMINA: (con) =>
    frase(con, `el programa no termina: repite lo mismo sin parar. Revise que la condición de los ciclos llegue a no cumplirse.`),
  RECURSION_SIN_FIN: (con) =>
    frase(
      con,
      `una función se llama a sí misma sin parar. Hace falta un caso base, un ${BT}if${BT} que devuelva sin llamarse otra vez, y que en cada llamada el argumento se acerque a él.`
    ),
  AMPERSAND_FALTA: (con, d) =>
    frase(con, `a ${BT}${d.texto ?? 'la variable'}${BT} le falta el ${BT}&${BT} adelante: ${BT}scanf${BT} necesita la dirección de la variable, no su valor.`),
  FORMATO_DISTINTO: (con, d) =>
    frase(
      con,
      d.tipo
        ? `el formato ${BT}${d.conv}${BT} no corresponde a una variable de tipo ${BT}${d.tipo}${BT}.`
        : `el formato ${BT}%${d.conv}${BT} no corresponde al tipo de lo que se muestra o se lee (${d.que}).`
    ),
  NO_HAY_MAIN: () => `El programa no tiene una función ${BT}main${BT}, que es por donde empieza.`,
  NOMBRE_DESCONOCIDO: (con, d) => frase(con, `${BT}${d.nombre}${BT} no está declarado: hay que declararlo antes de usarlo.`),
  CAMPO_DESCONOCIDO: (con, d) => frase(con, `la estructura no tiene un campo llamado ${BT}${d.campo}${BT}.`),
  FUNCION_DESCONOCIDA: (con, d) => frase(con, `se llama a ${BT}${d.nombre}${BT}, que no existe: no está declarada ni es de la biblioteca.`),
  ASIGNACION_INVALIDA: (con) => frase(con, `el programa asigna algo que no se puede asignar (por ejemplo, un arreglo entero con ${BT}=${BT}).`),
};

// El mensaje para un error del motor: { nivel, mensaje }. Los que el motor no
// sabe seguir son un aviso, no un error del alumno.
export function mensajeDeError(error, con = '') {
  if (error.codigo === 'SIN_VERIFICAR' || error.codigo === 'INTERNO') {
    return { nivel: 'aviso', codigo: 'EJECUCION_NO_VERIFICADA', mensaje: 'No pude seguir este código para comprobarlo. Verifique que haga lo que pide la consigna.' };
  }
  const texto = MENSAJES[error.codigo];
  return { nivel: 'error', codigo: error.codigo, mensaje: texto ? texto(con, error.datos || {}) : frase(con, error.mensaje) };
}

export const mensajeDeFugas = (con, cantidad) =>
  frase(
    con,
    `el programa termina sin liberar ${cantidad === 1 ? 'un bloque' : `${cantidad} bloques`} de memoria reservados con ${BT}malloc${BT}. Cada ${BT}malloc${BT} tiene que tener su ${BT}free${BT}, cuando ya no se necesita lo que se reservó.`
  );

export const mensajeDeNuloSinComprobar = () =>
  `La consigna pide comprobar el resultado de ${BT}malloc${BT}: el programa no pregunta si el puntero es ${BT}NULL${BT}, con ${BT}== NULL${BT}, ${BT}!= NULL${BT} o ${BT}if (p)${BT}.`;

export const mensajeDeFuncionFalta = (nombre) =>
  `La consigna pide usar ${BT}${nombre}${BT}: el programa no la llama.`;

export const contextoDeEntrada = (entrada) => {
  const una = String(entrada).trim().replace(/\s+/g, ' ');
  if (!una) return '';
  return `Con la entrada ${BT}${una.length > 40 ? una.slice(0, 37) + '...' : una}${BT}, `;
};
