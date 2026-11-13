// Los errores del motor de memoria (js/motor/).
//
// Cada uno lleva un codigo estable (en mayusculas, como los del corrector), el
// numero de linea (1 es la primera) y, si hace falta, datos para el mensaje.
// El motor no los lanza hacia afuera: ejecutar() los devuelve en "error".

export const CODIGOS = {
  // Memoria
  DESREFERENCIA_NULA: 'Se llega con * o -> a lo que apunta un puntero que vale NULL.',
  PUNTERO_SIN_INICIALIZAR: 'Se llega a lo que apunta un puntero al que nunca se le dio una direccion.',
  USO_DE_MEMORIA_LIBERADA: 'Se usa un bloque despues de liberarlo con free.',
  VARIABLE_FUERA_DE_ALCANCE: 'Se usa la direccion de una variable local cuando su funcion o su bloque ya terminaron.',
  LIBERACION_DOBLE: 'Se libera con free un bloque que ya estaba liberado.',
  LIBERACION_INVALIDA: 'Se libera con free algo que no es el comienzo de un bloque reservado con malloc.',
  FUERA_DE_BLOQUE: 'Se usa una posicion que esta fuera del bloque reservado.',
  FUERA_DE_RANGO: 'Se usa una posicion que esta fuera del arreglo.',
  ESCRITURA_EN_TEXTO: 'Se escribe en un texto escrito entre comillas, que no se puede cambiar.',
  // Valores
  VARIABLE_SIN_VALOR: 'Se usa el valor de algo que nunca recibio uno.',
  DIVISION_POR_CERO: 'Se divide por cero.',
  SIN_RETORNO: 'Se usa el valor de una funcion que no devuelve nada.',
  AMPERSAND_FALTA: 'scanf recibe el valor de una variable en lugar de su direccion.',
  FORMATO_DISTINTO: 'El formato de printf o scanf no corresponde al tipo del valor.',
  // Ejecucion
  NO_TERMINA: 'El programa no termina: pasa del limite de pasos.',
  RECURSION_SIN_FIN: 'Las llamadas se acumulan sin llegar a un caso base.',
  NO_HAY_MAIN: 'El programa no tiene una funcion main.',
  FUNCION_DESCONOCIDA: 'Se llama a una funcion que no existe.',
  NOMBRE_DESCONOCIDO: 'Se usa un nombre que no esta declarado.',
  CAMPO_DESCONOCIDO: 'Se usa un campo que la estructura no tiene.',
  ASIGNACION_INVALIDA: 'Se asigna a algo que no se puede asignar.',
  // Lo que el motor todavia no sigue
  SIN_VERIFICAR: 'Una construccion que el motor todavia no sabe seguir.',
  INTERNO: 'Un fallo del propio motor.',
};

export class ErrorDelMotor extends Error {
  constructor(codigo, mensaje, fila = null, datos = {}) {
    super(mensaje || CODIGOS[codigo] || codigo);
    this.codigo = codigo;
    this.fila = fila; // 1 es la primera linea
    this.datos = datos;
  }
}

// Una salida limpia del programa (exit): no es un error.
export class Salida extends Error {
  constructor(codigo) {
    super('exit');
    this.codigo = codigo;
  }
}
