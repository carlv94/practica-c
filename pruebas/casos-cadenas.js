// Casos de las series de cadenas (ver casos.js para el formato).
//
// "mejoras" es lo que deja una respuesta correcta pero no excelente; sin eso,
// una respuesta correcta tiene que ser excelente.

const caso = (serie, paso, nombre, respuesta, espera = 'ok', mejoras = []) => ({
  serie,
  paso,
  nombre,
  respuesta,
  espera,
  mejoras,
});

// Una cadena de hasta 10 letras: con el lugar del fin son 11.
const fin = (paso, nombre, respuesta, espera, mejoras) => caso('cadenas-fin', paso, nombre, respuesta, espera, mejoras);
const HOLA = "saludo[0] = 'H';\nsaludo[1] = 'o';\nsaludo[2] = 'l';\nsaludo[3] = 'a';\n";

const CASOS_DE_FIN = [
  // 1: declarar, para el texto "Hola"
  fin(1, 'justo para el fin', 'char saludo[5];'),
  fin(1, 'con la cuenta escrita', 'char saludo[4 + 1];'),
  fin(1, 'con una constante y la cuenta', '#define LETRAS 4\nchar saludo[LETRAS + 1];'),
  // Con el tamano justo, un numero cualquiera no alcanza: hay que haber pensado en el fin.
  fin(1, 'de mas', 'char saludo[20];', ['ARREGLO_GRANDE']),
  fin(1, 'mucho de mas', 'char saludo[100];', ['ARREGLO_GRANDE']),
  fin(1, 'sin el lugar del fin', 'char saludo[4];', ['CADENA_SIN_FIN']),
  fin(1, 'sin el lugar del fin, con constante', '#define LETRAS 4\nchar saludo[LETRAS];', ['CADENA_SIN_FIN']),
  fin(1, 'no alcanza', 'char saludo[3];', ['ARREGLO_CHICO']),
  fin(1, 'un solo caracter', 'char saludo;', ['VARIABLE_NO_ES_ARREGLO']),
  fin(1, 'otro tipo', 'int saludo[5];', ['VARIABLE_TIPO']),
  fin(1, 'con * en vez de corchetes', 'char *saludo;', ['VARIABLE_PUNTERO']),
  fin(1, 'sin la cantidad', 'char saludo[];', ['ARREGLO_SIN_DIMENSION']),

  // 2: caracter por caracter
  fin(2, 'las cinco posiciones', HOLA + "saludo[4] = '\\0';"),
  fin(2, 'en otro orden', "saludo[4] = '\\0';\nsaludo[3] = 'a';\nsaludo[2] = 'l';\nsaludo[1] = 'o';\nsaludo[0] = 'H';"),
  fin(2, 'el fin como 0: correcto y mejorable', HOLA + 'saludo[4] = 0;', 'ok', ['FIN_CON_CERO']),
  fin(2, 'sin el fin', HOLA, ['CADENA_SIN_FIN']),
  fin(2, 'el fin como el caracter 0', HOLA + "saludo[4] = '0';", ['FIN_CON_DIGITO']),
  fin(2, 'el fin como espacio', HOLA + "saludo[4] = ' ';", ['FIN_CON_ESPACIO']),
  fin(2, 'una letra con comillas dobles', "saludo[0] = \"H\";\nsaludo[1] = 'o';\nsaludo[2] = 'l';\nsaludo[3] = 'a';\nsaludo[4] = '\\0';", [
    'ELEMENTO_ENTRE_COMILLAS_DOBLES',
  ]),
  fin(2, 'una minuscula por una mayuscula', "saludo[0] = 'h';\nsaludo[1] = 'o';\nsaludo[2] = 'l';\nsaludo[3] = 'a';\nsaludo[4] = '\\0';", [
    'ELEMENTO_MAYUSCULA',
  ]),
  fin(2, 'una letra distinta', "saludo[0] = 'H';\nsaludo[1] = 'o';\nsaludo[2] = 'l';\nsaludo[3] = 'b';\nsaludo[4] = '\\0';", [
    'ELEMENTO_DISTINTO',
  ]),
  fin(2, 'una posicion salteada', "saludo[0] = 'H';\nsaludo[1] = 'o';\nsaludo[3] = 'a';\nsaludo[4] = '\\0';", ['ELEMENTO_FALTA']),
  fin(2, 'todo corrido un lugar', "saludo[1] = 'H';\nsaludo[2] = 'o';\nsaludo[3] = 'l';\nsaludo[4] = 'a';", [
    'ELEMENTOS_CORRIDOS',
  ]),
  fin(2, 'asignar el texto entero', 'saludo = "Hola";', ['ASIGNACION_DE_ARREGLO']),
  fin(2, 'con strcpy', 'strcpy(saludo, "Hola");', ['ELEMENTOS_CON_FUNCION']),
  fin(2, 'una posicion que no existe', HOLA + "saludo[4] = '\\0';\nsaludo[11] = 'x';", ['INDICE_FUERA_DE_RANGO']),
  fin(2, 'con un ciclo', "int i;\nfor (i = 0; i < 4; i++) {\n  saludo[i] = 'a';\n}", ['ELEMENTO_POSICION']),
  fin(2, 'sin asignaciones', 'int x;', ['ELEMENTOS_FALTAN']),


  // 10: una letra (al final: se aprende en la 9)
  fin(8, 'una letra', 'char letra[2];'),
  fin(8, 'sin el lugar del fin', 'char letra[1];', ['CADENA_SIN_FIN']),
  fin(8, 'de mas', 'char letra[10];', ['ARREGLO_GRANDE']),
  fin(8, 'un solo caracter', 'char letra;', ['VARIABLE_NO_ES_ARREGLO']),

  // 6: con su texto
  fin(3, 'corchetes vacios', 'char saludo[] = "Hola";'),
  fin(3, 'con el lugar justo: correcto y mejorable', 'char saludo[5] = "Hola";', 'ok', ['CADENA_DIMENSION_INNECESARIA']),
  fin(3, 'con lugar de mas: correcto y mejorable', 'char saludo[20] = "Hola";', 'ok', ['CADENA_DIMENSION_INNECESARIA']),
  fin(3, 'justo para las letras: C lo deja, pero no es una cadena', 'char saludo[4] = "Hola";', ['CADENA_SIN_FIN']),
  fin(3, 'no entra', 'char saludo[3] = "Hola";', ['ARREGLO_CHICO']),
  fin(3, 'otro texto', 'char saludo[] = "hola";', ['TEXTO_DISTINTO']),
  fin(3, 'entre comillas simples', "char saludo[] = 'Hola';", ['CADENA_CON_COMILLAS_SIMPLES']),
  fin(3, 'una letra entre comillas simples', "char saludo[] = 'H';", ['CADENA_CON_COMILLAS_SIMPLES']),
  // Es el mismo texto: el fin escrito de mas es una mejora.
  fin(3, 'con el fin escrito de mas: correcta y mejorable', 'char saludo[] = "Hola\\0";', 'ok', ['FIN_EN_EL_TEXTO']),
  fin(3, 'con el fin escrito y el lugar justo', 'char saludo[5] = "Hola\\0";', 'ok', [
    'FIN_EN_EL_TEXTO',
    'CADENA_DIMENSION_INNECESARIA',
  ]),
  fin(3, 'con el fin escrito y sin lugar', 'char saludo[4] = "Hola\\0";', ['ARREGLO_CHICO']),
  fin(3, 'el texto despues', 'char saludo[10];\nstrcpy(saludo, "Hola");', ['CADENA_SIN_TEXTO']),
  fin(3, 'con una lista de caracteres: correcta y mejorable', "char saludo[] = {'H', 'o', 'l', 'a', '\\0'};", 'ok', [
    'CADENA_COMO_TEXTO',
  ]),
  fin(3, 'con una lista sin el fin', "char saludo[] = {'H', 'o', 'l', 'a'};", ['CADENA_SIN_FIN']),

  // 7: letra por letra
  fin(5, 'la lista con su fin', "char saludo[] = {'H', 'o', 'l', 'a', '\\0'};"),
  fin(5, 'la lista sin el fin pero con lugar', "char saludo[5] = {'H', 'o', 'l', 'a'};"),
  fin(5, 'la lista sin el fin ni lugar', "char saludo[] = {'H', 'o', 'l', 'a'};", ['CADENA_SIN_FIN']),
  fin(5, 'con comillas dobles', 'char saludo[] = "Hola";', ['CADENA_NO_ES_LISTA']),
  fin(5, 'letras con comillas dobles', 'char saludo[] = {"H", "o", "l", "a"};', ['LISTA_DE_CARACTERES']),
  fin(5, 'una letra distinta', "char saludo[] = {'H', 'o', 'l', 'b', '\\0'};", ['VALOR_DISTINTO']),
];

const vacia = (paso, nombre, respuesta, espera, mejoras) =>
  caso('cadenas-vacia', paso, nombre, respuesta, espera, mejoras);

const CASOS_DE_VACIA = [
  // 1: declararla vacia
  vacia(1, 'con comillas', 'char nombre[21] = "";'),
  vacia(1, 'con un cero', 'char nombre[21] = {0};'),
  vacia(1, 'con el caracter de fin', "char nombre[21] = {'\\0'};"),
  vacia(1, 'con muchos ceros: correcta y mejorable', 'char nombre[21] = {0, 0, 0};', 'ok', ['VACIA_DE_MAS']),
  vacia(1, 'sin valor inicial', 'char nombre[21];', ['CADENA_SIN_INICIAL']),
  vacia(1, 'vaciarla despues no es declararla vacia', "char nombre[21];\nnombre[0] = '\\0';", ['CADENA_SIN_INICIAL']),
  vacia(1, 'con un espacio', 'char nombre[21] = " ";', ['CADENA_NO_VACIA']),
  vacia(1, 'con una letra', 'char nombre[21] = "a";', ['CADENA_NO_VACIA']),
  vacia(1, 'una lista con un espacio', "char nombre[21] = {' '};", ['CADENA_NO_VACIA']),
  vacia(1, 'sin lugar para el fin', 'char nombre[20] = "";', ['CADENA_SIN_FIN']),
  vacia(1, 'de mas', 'char nombre[30] = "";', ['ARREGLO_GRANDE']),

  vacia(3, 'el fin en la primera posicion', "nombre[0] = '\\0';"),
  vacia(3, 'con 0: correcta y mejorable', 'nombre[0] = 0;', 'ok', ['FIN_CON_CERO']),
  vacia(3, 'copiando una cadena vacia: correcta y mejorable', 'strcpy(nombre, "");', 'ok', ['VACIAR_CON_FUNCION']),
  vacia(3, 'con un ciclo: correcta y mejorable', "int i;\nfor (i = 0; i < 21; i++) {\n  nombre[i] = '\\0';\n}", 'ok', [
    'VACIAR_DE_MAS',
  ]),
  vacia(3, 'asignando una cadena vacia', 'nombre = "";', ['ASIGNACION_DE_ARREGLO']),
  vacia(3, 'con un espacio', "nombre[0] = ' ';", ['FIN_CON_ESPACIO']),
  vacia(3, 'con el caracter 0', "nombre[0] = '0';", ['FIN_CON_DIGITO']),
  vacia(3, 'una cadena vacia en la posicion', 'nombre[0] = "";', ['ELEMENTO_ENTRE_COMILLAS_DOBLES']),
  vacia(3, 'el fin en la ultima posicion', "nombre[20] = '\\0';", ['VACIAR_OTRA_POSICION']),
  vacia(3, 'el fin en la segunda posicion', "nombre[1] = '\\0';", ['VACIAR_OTRA_POSICION']),
  vacia(3, 'otro caracter en la primera', "nombre[0] = 'x';", ['FIN_DISTINTO']),
  vacia(3, 'nada que la vacie', 'int x;', ['VACIAR_FALTA']),

  vacia(2, 'el primer caracter: el fin', '1'),
  vacia(2, 'el primer caracter: un espacio', '0', ['OPCION_VACIA_ES_UN_ESPACIO']),
  vacia(2, 'el primer caracter: lo que hubiera', '2', ['OPCION_LO_QUE_HUBIERA']),
  vacia(4, 'el resto de la cadena: la correcta', '1'),
  vacia(4, 'el resto de la cadena: todo borrado', '0', ['OPCION_VACIAR_BORRA_TODO']),
  vacia(5, 'cadena sin iniciar: no se puede saber', '2'),
  vacia(5, 'cadena sin iniciar: el fin', '0', ['OPCION_SIN_INICIAR_ES_VACIA']),
  vacia(5, 'cadena sin iniciar: un espacio', '1', ['OPCION_SIN_INICIAR_ES_ESPACIO']),

];

const biblioteca = (paso, nombre, respuesta, espera, mejoras) =>
  caso('cadenas-biblioteca', paso, nombre, respuesta, espera, mejoras);

// Los pasos 4 y 5 (copiar y agregar) estan en casos.js, como CASOS_DE_CADENAS.
const CASOS_DE_BIBLIOTECA = [
  // 1: agregar la biblioteca
  biblioteca(1, 'la biblioteca de cadenas', '#include <string.h>'),
  biblioteca(1, 'con espacios', '#  include <string.h>'),
  biblioteca(1, 'entre comillas: correcta y mejorable', '#include "string.h"', 'ok', ['INCLUDE_ENTRE_COMILLAS']),
  biblioteca(1, 'sin la extension', '#include <string>', ['INCLUDE_SIN_EXTENSION']),
  biblioteca(1, 'otra biblioteca', '#include <stdio.h>', ['INCLUDE_OTRA_BIBLIOTECA']),
  biblioteca(1, 'una que no existe', '#include <otracosa.h>', ['INCLUDE_OTRA_BIBLIOTECA']),
  biblioteca(1, 'con punto y coma: correcta y mejorable', '#include <string.h>;', 'ok', ['INCLUDE_CON_PUNTO_Y_COMA']),
  biblioteca(1, 'con define', '#define <string.h>', ['INCLUDE_ES_DEFINE']),
  biblioteca(1, 'sin el numeral', 'include <string.h>', ['INCLUDE_SIN_NUMERAL']),
  biblioteca(1, 'sin el numeral y entre comillas', 'include "string.h"', ['INCLUDE_SIN_NUMERAL']),
  biblioteca(1, 'con define y entre comillas', '#define "string.h"', ['INCLUDE_ES_DEFINE']),
  biblioteca(1, 'nada', 'int x;', ['INCLUDE_FALTA']),
  // 1: una letra
  fin(6, 'la letra entre comillas simples', "char letra = 'A';"),
  fin(6, 'la letra como numero: correcta y mejorable', 'char letra = 65;', 'ok', ['CARACTER_COMO_NUMERO']),
  fin(6, 'con comillas dobles', 'char letra = "A";', ['CARACTER_CON_COMILLAS_DOBLES']),
  fin(6, 'una minuscula', "char letra = 'a';", ['CARACTER_DISTINTO']),
  fin(6, 'otra letra', "char letra = 'B';", ['CARACTER_DISTINTO']),
  fin(6, 'sin valor', 'char letra;', ['CARACTER_SIN_VALOR']),
  fin(6, 'como arreglo', 'char letra[2] = "A";', ['VARIABLE_ARREGLO']),
  fin(6, 'otro tipo', "int letra = 'A';", ['VARIABLE_TIPO']),
  fin(7, 'sizeof de un texto de una letra: la correcta', '1'),
  fin(7, 'sizeof de un texto de una letra: lo mismo que la letra', '0', ['OPCION_TEXTO_COMO_LETRA']),

  // 3: guardar un texto
  biblioteca(2, 'strcpy', 'strcpy(nombre, "Juan");'),
  biblioteca(2, 'strncpy con la cantidad de la cadena', 'strncpy(nombre, "Juan", 20);'),
  biblioteca(2, 'strncpy con el lugar del fin', 'strncpy(nombre, "Juan", 5);'),
  biblioteca(2, 'strncpy sin el lugar del fin', 'strncpy(nombre, "Juan", 4);', ['COPIA_SIN_FIN']),
  biblioteca(2, 'a mano, caracter por caracter: correcta y mejorable', "nombre[0] = 'J';\nnombre[1] = 'u';\nnombre[2] = 'a';\nnombre[3] = 'n';\nnombre[4] = '\\0';", 'ok', [
    'COPIA_A_MANO',
  ]),
  biblioteca(2, 'a mano, sin el fin', "nombre[0] = 'J';\nnombre[1] = 'u';\nnombre[2] = 'a';\nnombre[3] = 'n';", ['CADENA_SIN_FIN']),
  biblioteca(2, 'a mano, con un ciclo', 'int i;\nfor (i = 0; i < 4; i++) {\n  nombre[i] = "Juan"[i];\n}', ['A_MANO']),
  biblioteca(2, 'argumentos al reves', 'strcpy("Juan", nombre);', ['ARGUMENTOS_EN_OTRO_ORDEN']),
  biblioteca(2, 'comillas simples', "strcpy(nombre, 'Juan');", ['ARGUMENTO_COMILLAS_SIMPLES']),
  biblioteca(2, 'sin comillas', 'strcpy(nombre, Juan);', ['ARGUMENTO_SIN_COMILLAS']),
  biblioteca(2, 'otro texto', 'strcpy(nombre, "Pedro");', ['TEXTO_DISTINTO']),
  biblioteca(2, 'con el fin escrito de mas: correcta y mejorable', 'strcpy(nombre, "Juan\\0");', 'ok', [
    'FIN_EN_EL_TEXTO',
  ]),
  biblioteca(2, 'otras mayusculas', 'strcpy(nombre, "juan");', ['TEXTO_DISTINTO']),
  biblioteca(2, 'asignacion directa', 'nombre = "Juan";', ['ASIGNACION_DE_ARREGLO']),
  biblioteca(2, 'otra funcion', 'strcat(nombre, "Juan");', ['FUNCION_EQUIVOCADA']),

  // 6: cuantas letras tiene
  biblioteca(5, 'strlen guardado en la variable', 'largo = strlen(nombre);'),
  biblioteca(5, 'strlen sin guardar', 'strlen(nombre);', ['RESULTADO_PERDIDO']),
  biblioteca(5, 'strlen guardado en otra variable', 'int otro;\notro = strlen(nombre);', ['RESULTADO_EN_OTRA']),
  biblioteca(5, 'con sizeof', 'largo = sizeof(nombre);', ['SIZEOF_NO_CUENTA']),
  biblioteca(5, 'con sizeof menos uno', 'largo = sizeof(nombre) - 1;', ['SIZEOF_NO_CUENTA']),
  biblioteca(5, 'a mano con un ciclo', "int i;\nfor (i = 0; nombre[i] != '\\0'; i++) {\n}\nlargo = i;", ['A_MANO']),
  biblioteca(5, 'el nombre entre comillas', 'largo = strlen("nombre");', ['ARGUMENTO_ENTRE_COMILLAS']),
  biblioteca(5, 'con &', 'largo = strlen(&nombre);', ['ARGUMENTO_CON_AMPERSAND']),

  // 7: comparar
  biblioteca(11, 'strcmp con cero', 'if (strcmp(nombre, "Ana") == 0) {\n  iguales = 1;\n}'),
  biblioteca(11, 'con las cadenas al reves: da lo mismo', 'if (strcmp("Ana", nombre) == 0) {\n  iguales = 1;\n}'),
  biblioteca(11, 'con la negacion: correcta y mejorable', 'if (!strcmp(nombre, "Ana")) {\n  iguales = 1;\n}', 'ok', [
    'STRCMP_SIN_COMPARAR',
  ]),
  biblioteca(11, 'strcmp solo: se cumple al reves', 'if (strcmp(nombre, "Ana")) {\n  iguales = 1;\n}', ['STRCMP_AL_REVES']),
  biblioteca(11, 'comparado con distinto de cero', 'if (strcmp(nombre, "Ana") != 0) {\n  iguales = 1;\n}', ['STRCMP_AL_REVES']),
  // El resultado guardado en una variable y comparado despues.
  biblioteca(11, 'guardado y comparado con 0', 'int respuesta = strcmp(nombre, "Ana");\nif (respuesta == 0) {\n  iguales = 1;\n}'),
  biblioteca(11, 'guardado en una variable ya declarada', 'int respuesta;\nrespuesta = strcmp(nombre, "Ana");\nif (respuesta == 0) {\n  iguales = 1;\n}'),
  biblioteca(11, 'guardado y negado: correcta y mejorable', 'int respuesta = strcmp(nombre, "Ana");\nif (!respuesta) {\n  iguales = 1;\n}', 'ok', ['STRCMP_SIN_COMPARAR']),
  biblioteca(11, 'guardado, y el if se cumple al reves', 'int respuesta = strcmp(nombre, "Ana");\nif (respuesta) {\n  iguales = 1;\n}', ['STRCMP_AL_REVES']),
  biblioteca(11, 'guardado, y comparado con distinto de 0', 'int respuesta = strcmp(nombre, "Ana");\nif (respuesta != 0) {\n  iguales = 1;\n}', ['STRCMP_AL_REVES']),
  biblioteca(11, 'guardado y nunca comparado', 'int respuesta = strcmp(nombre, "Ana");', ['RESULTADO_SIN_COMPARAR']),
  biblioteca(11, 'con ==', 'if (nombre == "Ana") {\n  iguales = 1;\n}', ['COMPARAR_CON_IGUAL']),
  biblioteca(11, 'fuera de un if', 'iguales = strcmp(nombre, "Ana") == 0;', ['COMPARACION_FUERA_DEL_IF']),
  biblioteca(11, 'otro texto', 'if (strcmp(nombre, "ana") == 0) {\n  iguales = 1;\n}', ['TEXTO_DISTINTO']),
  biblioteca(11, 'mayor o menor', 'if (strcmp(nombre, "Ana") < 0) {\n  iguales = 1;\n}', ['STRCMP_USO']),
  biblioteca(10, 'que devuelve strcmp: la correcta', '1'),
  biblioteca(10, 'que devuelve strcmp: uno', '0', ['OPCION_STRCMP_IGUALES_ES_UNO']),
  biblioteca(10, 'que devuelve strcmp: verdadero', '2', ['OPCION_STRCMP_ES_BOOLEANO']),

];

const recorrer = (paso, nombre, respuesta, espera, mejoras, avisos) => ({
  ...caso('cadenas-recorrer', paso, nombre, respuesta, espera, mejoras),
  ...(avisos ? { avisos } : {}),
});

const CASOS_DE_RECORRER = [
  recorrer(1, 'while con el caracter de fin', "while (nombre[i] != '\\0') {\n  i++;\n}"),
  recorrer(1, 'while con 0', 'while (nombre[i] != 0) {\n  i++;\n}'),
  recorrer(1, 'while con el elemento solo', 'while (nombre[i]) {\n  i++;\n}'),
  recorrer(1, 'for', "for (i = 0; nombre[i] != '\\0'; i++) {\n}"),
  recorrer(1, 'con strlen', 'while (i < strlen(nombre)) {\n  i++;\n}'),
  // El cuerpo corre antes de mirar la condicion: con una cadena vacia avanzaria de mas.
  recorrer(1, 'do while: correcta y mejorable', "do {\n  i++;\n} while (nombre[i] != '\\0');", 'ok', ['CICLO_DO_WHILE']),
  recorrer(1, 'con strlen y <=', 'while (i <= strlen(nombre)) {\n  i++;\n}', ['CICLO_UNO_DE_MAS']),
  recorrer(1, 'hasta el tamano declarado', 'while (i < 21) {\n  i++;\n}', ['CICLO_HASTA_EL_TAMANO']),
  recorrer(1, 'hasta sizeof', 'while (i < sizeof(nombre)) {\n  i++;\n}', ['CICLO_HASTA_EL_TAMANO']),
  recorrer(1, 'al reves', "while (nombre[i] == '\\0') {\n  i++;\n}", ['CICLO_AL_REVES']),
  recorrer(1, 'sin avanzar', "while (nombre[i] != '\\0') {\n}", ['CICLO_SIN_AVANCE']),
  recorrer(1, 'sin ciclo', 'i++;', ['CICLO_FALTA']),
  // Una condicion que no mira la cadena no puede estar viendo el final.
  recorrer(1, 'el indice contra el fin', "while (i != '\\0') {\n  i += 1;\n}", ['CICLO_INDICE_CONTRA_FIN']),
  recorrer(1, 'el indice contra 0', 'while (i != 0) {\n  i++;\n}', ['CICLO_INDICE_CONTRA_FIN']),
  recorrer(1, 'la cadena completa contra el fin', "while (nombre != '\\0') {\n  i++;\n}", ['CICLO_CADENA_COMPLETA']),
  recorrer(1, 'el caracter contra un texto', 'while (nombre[i] != "\\0") {\n  i++;\n}', ['CICLO_CARACTER_CON_TEXTO']),
  recorrer(1, 'el caracter contra otro caracter', "while (nombre[i] != 'a') {\n  i++;\n}", ['CICLO_OTRO_CARACTER']),
  recorrer(1, 'el caracter contra un espacio', "while (nombre[i] != ' ') {\n  i++;\n}", ['CICLO_OTRO_CARACTER']),
  recorrer(1, 'sin mirar la cadena', 'while (i != 5) {\n  i++;\n}', ['CICLO_NO_MIRA_LA_CADENA']),
  // Mira la cadena pero de una forma que no se reconoce: se avisa, y no es excelente.
  {
    ...caso('cadenas-recorrer', 1, 'una condicion que no se reconoce', "while (nombre[i] != '\\0' && i < 100) {\n  i++;\n}", 'ok', []),
    avisos: ['CICLO_NO_VERIFICADO'],
    sinVerificar: true,
  },
  recorrer(2, 'seguimiento: la correcta', '1'),
  recorrer(2, 'seguimiento: todas las letras', '0', ['OPCION_CUENTA_TODAS_LAS_LETRAS']),
  recorrer(2, 'seguimiento: la primera', '2', ['OPCION_CUENTA_UNA_SOLA']),
];

const arreglos = (paso, nombre, respuesta, espera, mejoras) =>
  caso('cadenas-arreglos', paso, nombre, respuesta, espera, mejoras);
const tablas = (paso, nombre, respuesta, espera, mejoras) =>
  caso('cadenas-tablas', paso, nombre, respuesta, espera, mejoras);

const DIAS = '"lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"';

const CASOS_DE_ARREGLOS_Y_TABLAS = [
  // la tabla de nombres
  arreglos(1, 'con constantes y el lugar del fin', '#define MAX_ESTUDIANTES 30\n#define LARGO_NOMBRE 25\nchar nombres[MAX_ESTUDIANTES][LARGO_NOMBRE + 1];'),
  arreglos(1, 'con numeros sueltos: correcta y mejorable', 'char nombres[30][26];', 'ok', ['NUMERO_MAGICO']),
  arreglos(1, 'con una sola constante', '#define N 30\nchar nombres[N][26];', 'ok', ['NUMERO_MAGICO']),
  arreglos(1, 'estudiantes de mas', 'char nombres[40][26];', ['ARREGLO_GRANDE']),
  arreglos(1, 'ancho de mas', 'char nombres[30][40];', ['ARREGLO_GRANDE']),
  arreglos(1, 'sin el lugar del fin', '#define MAX_ESTUDIANTES 30\n#define LARGO_NOMBRE 25\nchar nombres[MAX_ESTUDIANTES][LARGO_NOMBRE];', ['CADENA_SIN_FIN']),
  arreglos(1, 'sin el lugar del fin, con numeros', 'char nombres[30][25];', ['CADENA_SIN_FIN']),
  arreglos(1, 'faltan estudiantes', 'char nombres[20][26];', ['ARREGLO_CHICO']),
  arreglos(1, 'las dimensiones al reves', 'char nombres[26][30];', ['DIMENSIONES_AL_REVES']),
  arreglos(1, 'un arreglo', 'char nombres[30];', ['TABLA_UNA_DIMENSION']),
  arreglos(1, 'tres dimensiones', 'char nombres[30][26][3];', ['TABLA_DIMENSIONES']),
  arreglos(1, 'otro tipo', 'int nombres[30][26];', ['VARIABLE_TIPO']),

  // los dias
  arreglos(8, 'con una constante para el ancho', `#define LARGO_DIA 10\nchar dias[][LARGO_DIA] = {${DIAS}};`),
  arreglos(8, 'con el ancho suelto: correcta y mejorable', `char dias[][10] = {${DIAS}};`, 'ok', ['NUMERO_MAGICO']),
  arreglos(8, 'con la cantidad de filas repetida', `char dias[7][10] = {${DIAS}};`, 'ok', ['NUMERO_MAGICO', 'FILAS_REPETIDAS']),
  arreglos(8, 'ancho justo: C lo deja, pero el texto no termina', `char dias[][9] = {${DIAS}};`, ['CADENA_SIN_FIN']),
  arreglos(8, 'con el fin escrito en cada texto: correcta y mejorable', '#define LARGO_DIA 10\nchar dias[][LARGO_DIA] = {"lunes\\0", "martes\\0", "miercoles\\0", "jueves\\0", "viernes\\0", "sabado\\0", "domingo\\0"};', 'ok', ['FIN_EN_EL_TEXTO']),
  arreglos(8, 'ancho que no alcanza', `char dias[][8] = {${DIAS}};`, ['ARREGLO_CHICO']),
  arreglos(8, 'sin el ancho', `char dias[][] = {${DIAS}};`, ['TABLA_SIN_COLUMNAS']),
  arreglos(8, 'con pocas filas', `char dias[5][10] = {${DIAS}};`, ['ARREGLO_CHICO']),
  arreglos(8, 'falta un dia', 'char dias[][10] = {"lunes", "martes", "miercoles", "jueves", "viernes", "sabado"};', ['TEXTOS_DE_MENOS']),
  // Los dias no se dictan: da lo mismo como se escriban las mayusculas.
  arreglos(8, 'con la inicial en mayuscula', 'char dias[][10] = {"Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"};', 'ok', ['NUMERO_MAGICO']),
  arreglos(8, 'todo en mayuscula', 'char dias[][10] = {"LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"};', 'ok', ['NUMERO_MAGICO']),
  arreglos(8, 'con las mayusculas mezcladas', 'char dias[][10] = {"Lunes", "martes", "MIERCOLES", "jueves", "Viernes", "sabado", "domingo"};', 'ok', ['NUMERO_MAGICO']),
  arreglos(8, 'otro texto', 'char dias[][10] = {"lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingos"};', ['TEXTO_DISTINTO']),
  // Los mensajes del tamaño dicen el texto mas largo tal como lo escribio el alumno.
  {
    ...arreglos(8, 'ancho justo con mayuscula', 'char dias[][9] = {"lunes", "martes", "Miercoles", "jueves", "viernes", "sabado", "domingo"};', ['CADENA_SIN_FIN']),
    dice: ['`"Miercoles"`'],
  },
  {
    ...arreglos(8, 'ancho que no alcanza con mayuscula', 'char dias[][8] = {"lunes", "martes", "MIERCOLES", "jueves", "viernes", "sabado", "domingo"};', ['ARREGLO_CHICO']),
    dice: ['`"MIERCOLES"`', 'ocupa 9 caracteres'],
  },
  arreglos(8, 'dias en otro orden', 'char dias[][10] = {"lunes", "martes", "jueves", "miercoles", "viernes", "sabado", "domingo"};', ['TEXTO_DISTINTO']),
  arreglos(8, 'comillas simples', `char dias[][10] = {'lunes', "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"};`, ['TEXTO_CON_COMILLAS_SIMPLES']),
  arreglos(8, 'cada texto entre llaves', 'char dias[][10] = {{"lunes"}, {"martes"}, {"miercoles"}, {"jueves"}, {"viernes"}, {"sabado"}, {"domingo"}};', ['VALORES_ANIDADOS']),
  arreglos(8, 'los textos despues', 'char dias[7][10];\nstrcpy(dias[0], "lunes");', ['VALORES_FALTAN']),

  // una posicion
  arreglos(2, 'strcpy a la primera fila', 'strcpy(nombres[0], "Ana");'),
  arreglos(2, 'con espacios en el indice', 'strcpy(nombres[ 0 ], "Ana");'),
  arreglos(2, 'la tabla entera', 'strcpy(nombres, "Ana");', ['ARGUMENTO_TABLA_ENTERA']),
  arreglos(2, 'una fila asignada con =', 'nombres[0] = "Ana";', ['ASIGNACION_DE_ARREGLO']),
  arreglos(2, 'un solo caracter', 'strcpy(nombres[0][0], "Ana");', ['ARGUMENTO_CON_CORCHETES']),
  arreglos(2, 'otra fila', 'strcpy(nombres[1], "Ana");', ['ARGUMENTO_OTRA_POSICION']),
  arreglos(2, 'una fila que no existe', 'strcpy(nombres[30], "Ana");', ['INDICE_FUERA_DE_RANGO']),
  arreglos(2, 'un texto en un caracter', 'nombres[0][0] = "Ana";', ['ELEMENTO_ENTRE_COMILLAS_DOBLES']),

  // vaciar todas las cadenas
  arreglos(7, 'for con la constante', "for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  nombres[i][0] = '\\0';\n}"),
  arreglos(7, 'for con el numero', "for (i = 0; i < 30; i++) {\n  nombres[i][0] = '\\0';\n}"),
  arreglos(7, 'con strcpy', 'for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  strcpy(nombres[i], "");\n}'),
  arreglos(7, 'while', "i = 0;\nwhile (i < MAX_ESTUDIANTES) {\n  nombres[i][0] = '\\0';\n  i++;\n}"),
  arreglos(7, 'una fila de mas', "for (i = 0; i <= MAX_ESTUDIANTES; i++) {\n  nombres[i][0] = '\\0';\n}", ['CICLO_SE_PASA']),
  arreglos(7, 'una fila de menos', "for (i = 0; i < 29; i++) {\n  nombres[i][0] = '\\0';\n}", ['CICLO_NO_LLEGA']),
  arreglos(7, 'siempre la misma fila', "for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  nombres[0][0] = '\\0';\n}", ['CICLO_NO_VACIA']),
  arreglos(7, 'el fin en la segunda posicion', "for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  nombres[i][1] = '\\0';\n}", ['CICLO_NO_VACIA']),
  arreglos(7, 'asignando la fila entera', 'for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  nombres[i] = "";\n}', ['ASIGNACION_DE_ARREGLO']),
  arreglos(7, 'sin avanzar', "for (i = 0; i < MAX_ESTUDIANTES; ) {\n  nombres[i][0] = '\\0';\n}", ['CICLO_SIN_AVANCE']),
  arreglos(7, 'sin ciclo', "nombres[0][0] = '\\0';", ['CICLO_FALTA']),

  // una posicion es una cadena
  arreglos(3, 'fila: la correcta', '1'),
  arreglos(3, 'fila: el texto', '0', ['OPCION_FILA_ES_EL_TEXTO']),
  arreglos(3, 'fila: el fin', '2', ['OPCION_FIN_EN_LA_PRIMERA']),

  // una tabla de cadenas, con un texto en cada celda
  tablas(1, 'con constantes y el lugar del fin', '#define MAX_ESTUDIANTES 30\n#define CAMPOS 3\n#define LARGO_TEXTO 25\nchar datos[MAX_ESTUDIANTES][CAMPOS][LARGO_TEXTO + 1];'),
  tablas(1, 'con numeros sueltos: correcta y mejorable', 'char datos[30][3][26];', 'ok', ['NUMERO_MAGICO']),
  tablas(1, 'sin el lugar del fin', 'char datos[30][3][25];', ['CADENA_SIN_FIN']),
  tablas(1, 'textos que no alcanzan', 'char datos[30][3][24];', ['ARREGLO_CHICO']),
  tablas(1, 'faltan columnas', 'char datos[30][2][26];', ['ARREGLO_CHICO']),
  tablas(1, 'estudiantes de mas', 'char datos[40][3][26];', ['ARREGLO_GRANDE']),
  tablas(1, 'filas y columnas al reves', 'char datos[3][30][26];', ['DIMENSIONES_AL_REVES']),
  tablas(1, 'columnas y tamaño al reves', 'char datos[30][26][3];', ['DIMENSIONES_AL_REVES']),
  tablas(1, 'dos dimensiones', 'char datos[30][26];', ['TABLA_DIMENSIONES']),
  tablas(1, 'cuatro dimensiones', 'char datos[30][3][26][2];', ['TABLA_DIMENSIONES']),
  tablas(1, 'una sola dimension', 'char datos[26];', ['TABLA_UNA_DIMENSION']),
  tablas(1, 'otro tipo', 'int datos[30][3][26];', ['VARIABLE_TIPO']),

  // guardar un texto en una celda
  tablas(2, 'strcpy a la celda', 'strcpy(datos[0][1], "Perez");'),
  tablas(2, 'la tabla entera', 'strcpy(datos, "Perez");', ['ARGUMENTO_TABLA_ENTERA']),
  tablas(2, 'solo la fila', 'strcpy(datos[0], "Perez");', ['ARGUMENTO_FALTA_INDICE']),
  tablas(2, 'un solo caracter', 'strcpy(datos[0][1][0], "Perez");', ['ARGUMENTO_CON_CORCHETES']),
  tablas(2, 'otra columna', 'strcpy(datos[0][2], "Perez");', ['ARGUMENTO_COLUMNA_DISTINTA']),
  tablas(2, 'otra fila', 'strcpy(datos[1][1], "Perez");', ['ARGUMENTO_FILA_DISTINTA']),
  tablas(2, 'una fila que no existe', 'strcpy(datos[30][1], "Perez");', ['INDICE_FUERA_DE_RANGO']),
  tablas(2, 'una fila asignada con =', 'datos[0] = "Perez";', ['ASIGNACION_DE_ARREGLO']),
  tablas(2, 'una celda asignada con =', 'datos[0][1] = "Perez";', ['ASIGNACION_DE_ARREGLO']),

  // lo mismo, caracter por caracter, tambien llega
  arreglos(2, 'a mano: correcta y mejorable', "nombres[0][0] = 'A';\nnombres[0][1] = 'n';\nnombres[0][2] = 'a';\nnombres[0][3] = '\\0';", 'ok', ['COPIA_A_MANO']),
  arreglos(2, 'a mano: falta una letra', "nombres[0][0] = 'A';\nnombres[0][2] = 'a';\nnombres[0][3] = '\\0';", ['ELEMENTO_FALTA']),
  arreglos(2, 'a mano: sin el fin', "nombres[0][0] = 'A';\nnombres[0][1] = 'n';\nnombres[0][2] = 'a';", ['CADENA_SIN_FIN']),

  // una posicion, caracter por caracter
  arreglos(6, 'la correcta', "nombres[1][0] = 'L';\nnombres[1][1] = 'u';\nnombres[1][2] = 'i';\nnombres[1][3] = 's';\nnombres[1][4] = '\\0';"),
  arreglos(6, 'con espacios en los indices', "nombres[ 1 ][ 0 ] = 'L';\nnombres[ 1 ][ 1 ] = 'u';\nnombres[ 1 ][ 2 ] = 'i';\nnombres[ 1 ][ 3 ] = 's';\nnombres[ 1 ][ 4 ] = '\\0';"),
  arreglos(6, 'con strcpy', 'strcpy(nombres[1], "Luis");', ['ELEMENTOS_CON_FUNCION']),
  arreglos(6, 'en otra posicion', "nombres[0][0] = 'L';\nnombres[0][1] = 'u';\nnombres[0][2] = 'i';\nnombres[0][3] = 's';\nnombres[0][4] = '\\0';", ['ELEMENTOS_OTRA_POSICION']),
  arreglos(6, 'sin el fin', "nombres[1][0] = 'L';\nnombres[1][1] = 'u';\nnombres[1][2] = 'i';\nnombres[1][3] = 's';", ['CADENA_SIN_FIN']),
  arreglos(6, 'falta una letra', "nombres[1][0] = 'L';\nnombres[1][1] = 'u';\nnombres[1][3] = 's';\nnombres[1][4] = '\\0';", ['ELEMENTO_FALTA']),
  arreglos(6, 'una letra equivocada', "nombres[1][0] = 'L';\nnombres[1][1] = 'u';\nnombres[1][2] = 'y';\nnombres[1][3] = 's';\nnombres[1][4] = '\\0';", ['ELEMENTO_DISTINTO']),
  arreglos(6, 'una mayuscula de mas', "nombres[1][0] = 'L';\nnombres[1][1] = 'U';\nnombres[1][2] = 'i';\nnombres[1][3] = 's';\nnombres[1][4] = '\\0';", ['ELEMENTO_MAYUSCULA']),
  arreglos(6, 'la primera letra en la posicion 1', "nombres[1][1] = 'L';\nnombres[1][2] = 'u';\nnombres[1][3] = 'i';\nnombres[1][4] = 's';\nnombres[1][5] = '\\0';", ['ELEMENTOS_CORRIDOS']),
  arreglos(6, 'letras entre comillas dobles', 'nombres[1][0] = "L";', ['ELEMENTO_ENTRE_COMILLAS_DOBLES']),
  arreglos(6, 'el fin con cero: correcta y mejorable', "nombres[1][0] = 'L';\nnombres[1][1] = 'u';\nnombres[1][2] = 'i';\nnombres[1][3] = 's';\nnombres[1][4] = 0;", 'ok', ['FIN_CON_CERO']),
  arreglos(6, 'el texto completo con =', 'nombres[1] = "Luis";', ['ASIGNACION_DE_ARREGLO']),

  // una celda, con strcpy o a mano
  tablas(2, 'a mano: correcta y mejorable', "datos[0][1][0] = 'P';\ndatos[0][1][1] = 'e';\ndatos[0][1][2] = 'r';\ndatos[0][1][3] = 'e';\ndatos[0][1][4] = 'z';\ndatos[0][1][5] = '\\0';", 'ok', ['COPIA_A_MANO']),

  // una celda es una cadena
  tablas(3, 'celda: la correcta', '1'),
  tablas(3, 'celda: el texto', '0', ['OPCION_CELDA_ES_EL_TEXTO']),
  tablas(3, 'celda: el fin', '2', ['OPCION_FIN_EN_LA_PRIMERA']),

  // una celda, caracter por caracter
  tablas(7, 'la correcta', "datos[1][0][0] = 'A';\ndatos[1][0][1] = 'n';\ndatos[1][0][2] = 'a';\ndatos[1][0][3] = '\\0';"),
  tablas(7, 'con strcpy', 'strcpy(datos[1][0], "Ana");', ['ELEMENTOS_CON_FUNCION']),
  tablas(7, 'en otra fila', "datos[0][0][0] = 'A';\ndatos[0][0][1] = 'n';\ndatos[0][0][2] = 'a';\ndatos[0][0][3] = '\\0';", ['ELEMENTOS_FILA_DISTINTA']),
  tablas(7, 'en otra columna', "datos[1][1][0] = 'A';\ndatos[1][1][1] = 'n';\ndatos[1][1][2] = 'a';\ndatos[1][1][3] = '\\0';", ['ELEMENTOS_COLUMNA_DISTINTA']),
  tablas(7, 'sin el fin', "datos[1][0][0] = 'A';\ndatos[1][0][1] = 'n';\ndatos[1][0][2] = 'a';", ['CADENA_SIN_FIN']),
  tablas(7, 'una letra equivocada', "datos[1][0][0] = 'A';\ndatos[1][0][1] = 'm';\ndatos[1][0][2] = 'a';\ndatos[1][0][3] = '\\0';", ['ELEMENTO_DISTINTO']),

  // vaciar todos los textos de la tabla
  tablas(8, 'dos for con constantes', "for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  for (j = 0; j < CAMPOS; j++) {\n    datos[i][j][0] = '\\0';\n  }\n}"),
  tablas(8, 'con strcpy', 'for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  for (j = 0; j < CAMPOS; j++) {\n    strcpy(datos[i][j], "");\n  }\n}'),
  tablas(8, 'dos while', "i = 0;\nwhile (i < MAX_ESTUDIANTES) {\n  j = 0;\n  while (j < CAMPOS) {\n    datos[i][j][0] = '\\0';\n    j++;\n  }\n  i++;\n}"),
  tablas(8, 'una fila de mas', "for (i = 0; i <= MAX_ESTUDIANTES; i++) {\n  for (j = 0; j < CAMPOS; j++) {\n    datos[i][j][0] = '\\0';\n  }\n}", ['CICLO_SE_PASA']),
  tablas(8, 'una columna de menos', "for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  for (j = 0; j < 2; j++) {\n    datos[i][j][0] = '\\0';\n  }\n}", ['CICLO_NO_LLEGA']),
  tablas(8, 'una columna de mas', "for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  for (j = 0; j <= CAMPOS; j++) {\n    datos[i][j][0] = '\\0';\n  }\n}", ['CICLO_SE_PASA']),
  tablas(8, 'los indices al reves', "for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  for (j = 0; j < CAMPOS; j++) {\n    datos[j][i][0] = '\\0';\n  }\n}", ['CICLO_NO_VACIA']),
  tablas(8, 'siempre la misma columna', "for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  for (j = 0; j < CAMPOS; j++) {\n    datos[i][0][0] = '\\0';\n  }\n}", ['CICLO_NO_VACIA']),
  tablas(8, 'un solo ciclo', "for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  datos[i][0][0] = '\\0';\n}", ['CICLO_INTERNO_FALTA']),
  tablas(8, 'sin avanzar el de adentro', "for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  for (j = 0; j < CAMPOS; ) {\n    datos[i][j][0] = '\\0';\n  }\n}", ['CICLO_SIN_AVANCE']),
  tablas(8, 'sin ciclos', "datos[0][0][0] = '\\0';", ['CICLO_FALTA']),

  // Una letra con un solo indice, o un caracter a una cadena completa
  {
    ...arreglos(2, 'las letras con un solo indice', "nombres[0] = 'A';\nnombres[1] = 'n';\nnombres[2] = 'a';\nnombres[3] = '\\0';", ['ELEMENTOS_COMO_UNA_SOLA_CADENA']),
    dice: ['guarda varias cadenas', 'dos índices'],
  },
  arreglos(6, 'las letras con un solo indice', "nombres[0] = 'L';\nnombres[1] = 'u';\nnombres[2] = 'i';\nnombres[3] = 's';\nnombres[4] = '\\0';", ['ELEMENTOS_COMO_UNA_SOLA_CADENA']),
  arreglos(6, 'una letra con un solo indice entre las demas', "nombres[1][0] = 'L';\nnombres[1][1] = 'u';\nnombres[1] = 'i';\nnombres[1][3] = 's';\nnombres[1][4] = '\\0';", ['ASIGNACION_CARACTER_A_CADENA', 'ELEMENTO_FALTA']),
  {
    ...arreglos(7, 'un caracter a la cadena completa', "for (i = 0; i < MAX_ESTUDIANTES; i++)\n  nombres[i] = '\\0';", ['ASIGNACION_CARACTER_A_CADENA']),
    dice: ['es una cadena completa', 'no se le puede asignar un carácter', 'primera posición'],
  },
  {
    ...arreglos(7, 'cualquier caracter a la cadena completa', "for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  nombres[i] = 'x';\n}", ['ASIGNACION_CARACTER_A_CADENA']),
    dice: ['no se le puede asignar un carácter'],
  },
  {
    ...tablas(7, 'las letras con un solo indice', "datos[0] = 'A';\ndatos[1] = 'n';\ndatos[2] = 'a';\ndatos[3] = '\\0';", ['ELEMENTOS_COMO_UNA_SOLA_CADENA']),
    dice: ['tres índices'],
  },

  // El texto, en otra posicion (o en otra fila o columna)
  {
    ...arreglos(6, 'el texto, en la tercera posicion', "nombres[2][0] = 'L';\nnombres[2][1] = 'u';\nnombres[2][2] = 'i';\nnombres[2][3] = 's';\nnombres[2][4] = '\\0';", ['ELEMENTOS_OTRA_POSICION']),
    dice: ['El texto está bien escrito', 'la posición 2 es la tercera'],
  },
  {
    ...arreglos(6, 'otro texto, en la primera posicion', "nombres[0][0] = 'L';\nnombres[0][1] = 'o';\nnombres[0][2] = 'l';\nnombres[0][3] = 'a';\nnombres[0][4] = '\\0';", ['ELEMENTOS_OTRA_POSICION']),
    dice: ['Los caracteres están asignados a `nombres[0]`'],
  },
  {
    ...tablas(7, 'otra fila y otra columna', "datos[0][1][0] = 'A';\ndatos[0][1][1] = 'n';\ndatos[0][1][2] = 'a';\ndatos[0][1][3] = '\\0';", ['ELEMENTOS_FILA_Y_COLUMNA_DISTINTAS']),
    dice: ['El texto está bien escrito'],
  },

  // Los argumentos de una llamada: que parte de la posicion no es la que pide la consigna
  {
    ...arreglos(2, 'la segunda posicion es la 1', 'strcpy(nombres[1], "Ana");', ['ARGUMENTO_OTRA_POSICION']),
    dice: ['la posición 1 es la segunda'],
  },
  arreglos(2, 'dos posiciones de mas', 'strcpy(nombres[2], "Ana");', ['ARGUMENTO_OTRA_POSICION']),
  tablas(2, 'la fila de mas', 'strcpy(datos[2][1], "Perez");', ['ARGUMENTO_FILA_DISTINTA']),
  {
    ...tablas(2, 'la fila contada desde 1', 'strcpy(datos[1][1], "Perez");', ['ARGUMENTO_FILA_DISTINTA']),
    dice: ['la columna es la que pide la consigna, pero la fila no', 'la fila 1 es la segunda'],
  },
  {
    ...tablas(2, 'la columna contada desde 1', 'strcpy(datos[0][2], "Perez");', ['ARGUMENTO_COLUMNA_DISTINTA']),
    dice: ['la fila es la que pide la consigna, pero la columna no', 'la columna 2 es la tercera'],
  },
  {
    ...tablas(2, 'fila y columna distintas', 'strcpy(datos[3][0], "Perez");', ['ARGUMENTO_FILA_Y_COLUMNA_DISTINTAS']),
    dice: ['ni la fila ni la columna'],
  },
  {
    ...tablas(2, 'solo la fila', 'strcpy(datos[2], "Perez");', ['ARGUMENTO_FALTA_INDICE']),
    dice: ['es un arreglo de cadenas', 'segundo índice'],
  },

  // La fila con una cuenta o con una variable, y los argumentos al reves con otra celda
  tablas(2, 'la fila con una cuenta', 'strcpy(datos[1 + 1][1], "Perez");', ['ARGUMENTO_FILA_DISTINTA']),
  {
    ...tablas(2, 'la fila con una variable', 'strcpy(datos[i][1], "Perez");', ['ARGUMENTO_POSICION_CON_VARIABLE']),
    dice: ['no es un número', 'una posición concreta'],
  },
  {
    ...tablas(2, 'los argumentos al reves, con otra celda', 'strcpy("Perez", datos[2][1]);', ['ARGUMENTOS_EN_OTRO_ORDEN']),
    dice: ['primero va la cadena donde se guarda'],
  },

  // 4 y 5 de los arreglos: que hay en una posicion y en todo el arreglo
  arreglos(4, 'texto: el de la tercera posicion', '1'),
  arreglos(4, 'texto: contando desde uno', '0', ['OPCION_POSICION_DESDE_UNO']),
  arreglos(4, 'texto: una letra', '2', ['OPCION_CADENA_ES_UNA_LETRA']),
  arreglos(5, 'todo: los tres textos', '2'),
  arreglos(5, 'todo: el primero', '0', ['OPCION_ARREGLO_ES_EL_PRIMERO']),
  arreglos(5, 'todo: una sola cadena', '1', ['OPCION_ARREGLO_ES_UNA_CADENA']),

  // 4 a 6 de las tablas: que hay en una celda, una fila y toda la tabla
  tablas(4, 'celda: la del segundo estudiante', '1'),
  tablas(4, 'celda: contando desde uno', '0', ['OPCION_POSICION_DESDE_UNO']),
  tablas(4, 'celda: una letra', '2', ['OPCION_CADENA_ES_UNA_LETRA']),
  { ...tablas(5, 'fila: los tres textos del segundo estudiante', '2'), dice: ['`datos[1]` es la segunda'] },
  tablas(5, 'fila: contando desde uno', '0', ['OPCION_POSICION_DESDE_UNO']),
  tablas(5, 'fila: la columna', '1', ['OPCION_FILA_ES_COLUMNA']),
  tablas(5, 'fila: un solo texto', '3', ['OPCION_FILA_ES_UNA_CELDA']),
  tablas(6, 'toda la tabla: las dos filas', '2'),
  tablas(6, 'toda la tabla: la primera fila', '0', ['OPCION_ARREGLO_ES_EL_PRIMERO']),
  tablas(6, 'toda la tabla: una sola cadena', '1', ['OPCION_ARREGLO_ES_UNA_CADENA']),
];

const typedef = (paso, nombre, respuesta, espera, mejoras) =>
  caso('cadenas-typedef', paso, nombre, respuesta, espera, mejoras);

const CASOS_DE_TYPEDEF = [
  // el tipo (fuera de main)
  typedef(1, 'un tipo con la constante', '#define LARGO_TEXTO 25\ntypedef char Texto[LARGO_TEXTO + 1];'),
  typedef(1, 'con el numero suelto: correcto y mejorable', 'typedef char Texto[26];', 'ok', ['NUMERO_MAGICO']),
  typedef(1, 'con espacio de mas', 'typedef char Texto[100];', ['ARREGLO_GRANDE']),
  typedef(1, 'sin el lugar del fin', 'typedef char Texto[25];', ['CADENA_SIN_FIN']),
  typedef(1, 'de pocas letras', 'typedef char Texto[10];', ['ARREGLO_CHICO']),
  typedef(1, 'de un solo caracter', 'typedef char Texto;', ['ALIAS_NO_ES_CADENA']),
  typedef(1, 'de otro tipo', 'typedef int Texto[26];', ['ALIAS_TIPO']),
  typedef(1, 'con *', 'typedef char *Texto;', ['ALIAS_PUNTERO']),
  typedef(1, 'sin typedef', 'char Texto[26];', ['ALIAS_FALTA']),
  typedef(1, 'el nombre y el tipo al reves', 'typedef Texto char[26];', ['TYPEDEF_AL_REVES']),

  // la misma variable, con el tipo
  typedef(2, 'la variable del tipo', 'Texto nombre;'),
  typedef(2, 'con otro nombre', 'Texto estudiante;', ['VARIABLE_NOMBRE']),
  typedef(2, 'sin usar el tipo', 'char nombre[26];', ['VARIABLE_SIN_ALIAS']),
  typedef(2, 'varias en vez de una', 'Texto nombre[5];', ['VARIABLE_ARREGLO']),
  typedef(2, 'el tipo con otra mayuscula', 'texto nombre;', ['TIPO_DESCONOCIDO']),

  // un arreglo del tipo
  typedef(3, 'con la constante', '#define MAX_ESTUDIANTES 30\nTexto curso[MAX_ESTUDIANTES];'),
  typedef(3, 'con el numero suelto: correcto y mejorable', 'Texto curso[30];', 'ok', ['NUMERO_MAGICO']),
  typedef(3, 'y llenar una', '#define MAX_ESTUDIANTES 30\nTexto curso[MAX_ESTUDIANTES];\nstrcpy(curso[0], "Ana");'),
  typedef(3, 'con pocos', 'Texto curso[20];', ['ARREGLO_CHICO']),
  typedef(3, 'con de mas', 'Texto curso[40];', ['ARREGLO_GRANDE']),
  typedef(3, 'una sola', 'Texto curso;', ['VARIABLE_NO_ES_ARREGLO']),
  typedef(3, 'sin el tipo', 'char curso[30][26];', ['VARIABLE_SIN_ALIAS']),

  // que hay en una letra, con el tipo
  typedef(4, 'letra: la primera', '2'),
  typedef(4, 'letra: el texto completo', '0', ['OPCION_FILA_ES_EL_TEXTO']),
  typedef(4, 'letra: un error', '1', ['OPCION_ALIAS_UN_INDICE']),

  // una tabla del tipo
  typedef(5, 'con constantes', '#define CAMPOS 3\nTexto datos[MAX_ESTUDIANTES][CAMPOS];'),
  // El 30 ya es una constante del codigo de arriba: se avisa que conviene usarla.
  typedef(5, 'con numeros sueltos: correcta y mejorable', 'Texto datos[30][3];', 'ok', ['NUMERO_MAGICO', 'CONSTANTE_SIN_REUTILIZAR']),
  typedef(5, 'estudiantes de mas', 'Texto datos[40][3];', ['ARREGLO_GRANDE']),
  typedef(5, 'faltan columnas', 'Texto datos[30][2];', ['ARREGLO_CHICO']),
  typedef(5, 'filas y columnas al reves', 'Texto datos[3][30];', ['DIMENSIONES_AL_REVES']),
  typedef(5, 'un arreglo', 'Texto datos[30];', ['TABLA_UNA_DIMENSION']),
  typedef(5, 'una dimension de mas', 'Texto datos[30][3][2];', ['TABLA_DIMENSIONES']),
  typedef(5, 'una sola variable', 'Texto datos;', ['VARIABLE_NO_ES_ARREGLO']),
  typedef(5, 'sin el tipo', 'char datos[30][3][26];', ['VARIABLE_SIN_ALIAS']),

  // que hay en una fila y en una letra de la tabla, con el tipo
  typedef(6, 'fila: los textos del segundo estudiante', '2'),
  typedef(6, 'fila: contando desde uno', '0', ['OPCION_POSICION_DESDE_UNO']),
  typedef(6, 'fila: un solo texto', '1', ['OPCION_FILA_ES_UNA_CELDA']),
  typedef(6, 'fila: la columna', '3', ['OPCION_FILA_ES_COLUMNA']),
  typedef(7, 'letra: la primera', '2'),
  typedef(7, 'letra: el texto completo', '0', ['OPCION_CELDA_ES_EL_TEXTO']),
  typedef(7, 'letra: un error', '1', ['OPCION_ALIAS_DOS_INDICES']),

  // guardar un texto en una celda, con los tres indices
  typedef(8, 'strcpy a la celda', 'strcpy(datos[0][1], "Perez");'),
  typedef(8, 'a mano: correcta y mejorable', "datos[0][1][0] = 'P';\ndatos[0][1][1] = 'e';\ndatos[0][1][2] = 'r';\ndatos[0][1][3] = 'e';\ndatos[0][1][4] = 'z';\ndatos[0][1][5] = '\\0';", 'ok', ['COPIA_A_MANO']),
  typedef(8, 'con dos indices', 'strcpy(datos[0], "Perez");', ['ARGUMENTO_FALTA_INDICE']),
  typedef(8, 'otra fila', 'strcpy(datos[2][1], "Perez");', ['ARGUMENTO_FILA_DISTINTA']),
  typedef(8, 'otra columna', 'strcpy(datos[0][2], "Perez");', ['ARGUMENTO_COLUMNA_DISTINTA']),
  typedef(8, 'un solo caracter', 'strcpy(datos[0][1][0], "Perez");', ['ARGUMENTO_CON_CORCHETES']),
  typedef(8, 'la tabla entera', 'strcpy(datos, "Perez");', ['ARGUMENTO_TABLA_ENTERA']),
];

const lectura = (paso, nombre, respuesta, espera, mejoras) =>
  caso('cadenas-lectura', paso, nombre, respuesta, espera, mejoras);

const CASOS_DE_LECTURA = [
  // 1: declarar
  lectura(1, 'el tamano justo', '#define LARGO_NOMBRE 25\nchar nombre[LARGO_NOMBRE + 1];'),
  lectura(1, 'con el numero suelto: correcto y mejorable', 'char nombre[26];', 'ok', ['NUMERO_MAGICO']),
  lectura(1, 'sin el lugar del fin', 'char nombre[25];', ['CADENA_SIN_FIN']),
  lectura(1, 'de pocas letras', 'char nombre[10];', ['ARREGLO_CHICO']),
  lectura(1, 'con de mas', 'char nombre[100];', ['ARREGLO_GRANDE']),

  // 2: leer una palabra
  lectura(2, 'con el limite', 'scanf("%25s", nombre);'),
  lectura(2, 'con un espacio antes del formato', 'scanf(" %25s", nombre);'),
  lectura(2, 'sin limite: correcto y mejorable', 'scanf("%s", nombre);', 'ok', ['LECTURA_SIN_LIMITE']),
  {
    ...lectura(2, 'la mejora dice cuanto', 'scanf("%s", nombre);', 'ok', ['LECTURA_SIN_LIMITE']),
    dice: ['sería `%25s`'],
  },
  lectura(2, 'un limite que no deja lugar para el fin', 'scanf("%26s", nombre);', ['LECTURA_SIN_LUGAR_PARA_FIN']),
  {
    ...lectura(2, 'con el ampersand', 'scanf("%s", &nombre);', ['ARGUMENTO_CON_AMPERSAND']),
    dice: ['le sobra el `&`'],
  },
  lectura(2, 'el formato de un entero', 'scanf("%d", nombre);', ['FORMATO_NO_ES_TEXTO']),
  lectura(2, 'el formato de un caracter', 'scanf("%c", nombre);', ['FORMATO_NO_ES_TEXTO']),
  lectura(2, 'los argumentos al reves', 'scanf(nombre, "%s");', ['FORMATO_NO_ES_TEXTO']),
  lectura(2, 'sin el formato', 'scanf(nombre);', ['ARGUMENTOS_CANTIDAD']),
  lectura(2, 'una variable que no existe', 'scanf("%s", apellido);', ['VARIABLE_DESCONOCIDA']),
  lectura(2, 'con la linea completa', 'scanf("%[^\\n]", nombre);', ['LECTURA_LEE_LA_LINEA']),
  lectura(2, 'con gets', 'gets(nombre);', ['LECTURA_LEE_LA_LINEA']),
  lectura(2, 'con otra funcion', 'strcpy(nombre, "Ana");', ['FUNCION_EQUIVOCADA']),
  lectura(2, 'sin leer', 'int x;', ['LECTURA_FALTA']),

  // 3: mostrar
  lectura(3, 'printf con %s', 'printf("%s", nombre);'),
  lectura(3, 'con salto de linea', 'printf("%s\\n", nombre);'),
  lectura(3, 'con puts', 'puts(nombre);'),
  lectura(3, 'el formato de un entero', 'printf("%d", nombre);', ['FORMATO_NO_ES_TEXTO']),
  lectura(3, 'el formato de un caracter', 'printf("%c", nombre);', ['FORMATO_NO_ES_TEXTO']),
  lectura(3, 'el nombre como formato', 'printf(nombre);', ['PRINTF_SIN_FORMATO']),
  lectura(3, 'el texto tal cual', 'printf("nombre");', ['MUESTRA_TEXTO_FIJO']),
  lectura(3, 'sin el valor', 'printf("%s");', ['ARGUMENTOS_CANTIDAD']),
  lectura(3, 'con valores de mas', 'printf("%s", nombre, nombre);', ['ARGUMENTOS_CANTIDAD']),
  lectura(3, 'con el ampersand', 'printf("%s", &nombre);', ['ARGUMENTO_CON_AMPERSAND']),
  lectura(3, 'el nombre entre comillas', 'printf("%s", "nombre");', ['ARGUMENTO_ENTRE_COMILLAS']),
  lectura(3, 'una sola letra', 'printf("%s", nombre[0]);', ['ARGUMENTO_CON_CORCHETES']),
  lectura(3, 'una variable que no existe', 'printf("%s", apellido);', ['VARIABLE_DESCONOCIDA']),
  lectura(3, 'leyendo en lugar de mostrar', 'scanf("%25s", nombre);', ['MUESTRA_FALTA']),
  lectura(3, 'con otra funcion', 'strlen(nombre);', ['FUNCION_EQUIVOCADA']),

  // 4: cuestionario, con un espacio
  { ...lectura(5, 'espacio: la primera palabra', '1'), dice: ['guarda `Ana`'] },
  lectura(5, 'espacio: el nombre completo', '0', ['OPCION_LEE_TODA_LA_LINEA']),
  lectura(5, 'espacio: la ultima palabra', '2', ['OPCION_LEE_LA_ULTIMA']),
  lectura(5, 'espacio: con el espacio', '3', ['OPCION_INCLUYE_EL_ESPACIO']),

  // 5: leer una linea completa
  {
    ...lectura(6, 'con gets: correcto, con la nota', 'gets(nombre);'),
    notas: ['USO_DE_GETS'],
    dice: ['Su respuesta es correcta', 'para practicar', '`fgets`'],
  },
  lectura(6, 'con fgets', 'fgets(nombre, sizeof nombre, stdin);'),
  lectura(6, 'con fgets y el tamano con la constante', 'fgets(nombre, LARGO_NOMBRE + 1, stdin);'),
  lectura(6, 'con fgets y un limite de mas', 'fgets(nombre, 100, stdin);', ['LECTURA_SIN_LUGAR']),
  lectura(6, 'con fgets sin stdin', 'fgets(nombre, 26, nombre);', ['FGETS_SIN_STDIN']),
  lectura(6, 'con fgets y dos argumentos', 'fgets(nombre, stdin);', ['ARGUMENTOS_CANTIDAD']),
  lectura(6, 'con scanf y la linea completa', 'scanf("%[^\\n]", nombre);'),
  lectura(6, 'con scanf, un espacio y la linea completa', 'scanf(" %[^\\n]", nombre);'),
  {
    ...lectura(6, 'con scanf y %s', 'scanf("%s", nombre);', ['LECTURA_CORTA_EN_ESPACIO']),
    dice: ['`Ana Maria`', '`gets`'],
  },
  lectura(6, 'gets con el ampersand', 'gets(&nombre);', ['ARGUMENTO_CON_AMPERSAND']),
  lectura(6, 'gets de otra variable', 'gets(apellido);', ['VARIABLE_DESCONOCIDA']),
  lectura(6, 'gets con dos argumentos', 'gets(nombre, 25);', ['ARGUMENTOS_CANTIDAD']),

  // 6: leer y mostrar
  { ...lectura(7, 'gets y el saludo: la nota ya se dijo antes', 'gets(nombre);\nprintf("Hola, %s\\n", nombre);'), notas: [] },
  {
    ...lectura(7, 'gets y el saludo: la primera vez', 'gets(nombre);\nprintf("Hola, %s\\n", nombre);'),
    previas: ['', '', '', '', '', 'fgets(nombre, sizeof(nombre), stdin);'],
    notas: ['USO_DE_GETS'],
  },
  lectura(7, 'fgets y el saludo', 'fgets(nombre, sizeof nombre, stdin);\nprintf("Hola, %s", nombre);'),
  lectura(7, 'otro saludo', 'gets(nombre);\nprintf("Buen dia, %s", nombre);', ['TEXTO_DISTINTO']),
  {
    ...lectura(7, 'el saludo con otra mayuscula', 'gets(nombre);\nprintf("hola, %s", nombre);', ['TEXTO_DISTINTO']),
    dice: ['mayúsculas y las minúsculas'],
  },
  lectura(7, 'mostrar antes de leer', 'printf("Hola, %s\\n", nombre);\ngets(nombre);', ['MUESTRA_ANTES_DE_LEER']),
  lectura(7, 'puts no alcanza para el saludo', 'gets(nombre);\nputs(nombre);', ['FUNCION_EQUIVOCADA']),
  lectura(7, 'el saludo sin el nombre', 'gets(nombre);\nprintf("Hola, ");', ['MUESTRA_FALTA_EL_NOMBRE']),
  // el saludo y el nombre en dos llamadas: en pantalla es lo mismo
  lectura(7, 'el saludo y despues puts', 'gets(nombre);\nprintf("Hola, ");\nputs(nombre);'),
  lectura(7, 'el saludo y despues printf con %s', 'gets(nombre);\nprintf("Hola, ");\nprintf("%s", nombre);'),
  lectura(7, 'el saludo y despues printf con %s y salto', 'gets(nombre);\nprintf("Hola, ");\nprintf("%s\\n", nombre);'),
  lectura(7, 'el saludo cortado sin el espacio', 'gets(nombre);\nprintf("Hola,");\nputs(nombre);', ['TEXTO_DISTINTO']),
  lectura(7, 'el saludo con otra mayuscula', 'gets(nombre);\nprintf("hola, ");\nputs(nombre);', ['TEXTO_DISTINTO']),
  {
    ...lectura(7, 'un salto de linea entre el saludo y el nombre', 'gets(nombre);\nprintf("Hola, \\n");\nputs(nombre);', ['MUESTRA_SALTO_ENTRE_MEDIO']),
    dice: ['en otra línea'],
  },
  lectura(7, 'puts para el saludo', 'gets(nombre);\nputs("Hola, ");\nputs(nombre);', ['FUNCION_EQUIVOCADA']),
  {
    ...lectura(7, 'el nombre antes que el saludo', 'gets(nombre);\nputs(nombre);\nprintf("Hola, ");', ['MUESTRA_EN_OTRO_ORDEN']),
    dice: ['El saludo va primero'],
  },
  lectura(7, 'el saludo y despues un texto cualquiera', 'gets(nombre);\nprintf("Hola, ");\nputs("Ana");', ['ARGUMENTO_EQUIVOCADO']),
  lectura(7, 'el saludo y despues el nombre entre comillas', 'gets(nombre);\nprintf("Hola, ");\nputs("nombre");', ['ARGUMENTO_ENTRE_COMILLAS']),
  lectura(7, 'el saludo y despues el nombre como formato', 'gets(nombre);\nprintf("Hola, ");\nprintf(nombre);', ['PRINTF_SIN_FORMATO']),
  lectura(7, 'el saludo y mostrar antes de leer', 'printf("Hola, ");\nputs(nombre);\ngets(nombre);', ['MUESTRA_ANTES_DE_LEER']),
  lectura(7, 'sin leer', 'printf("Hola, %s\\n", nombre);', ['LECTURA_FALTA']),
  lectura(7, 'sin mostrar', 'gets(nombre);', ['MUESTRA_FALTA']),

  // 7: una posicion del arreglo
  lectura(8, 'la primera posicion', 'scanf("%25s", curso[0]);'),
  lectura(8, 'sin limite: correcto y mejorable', 'scanf("%s", curso[0]);', 'ok', ['LECTURA_SIN_LIMITE']),
  lectura(8, 'el arreglo completo', 'scanf("%25s", curso);', ['ARGUMENTO_TABLA_ENTERA']),
  lectura(8, 'una sola letra', 'scanf("%25s", curso[0][0]);', ['ARGUMENTO_CON_CORCHETES']),
  lectura(8, 'con un limite que no deja lugar para el fin', 'scanf("%26s", curso[0]);', ['LECTURA_SIN_LUGAR_PARA_FIN']),
  // en una variable y despues copiada
  lectura(8, 'en una variable y strcpy: correcto y mejorable', 'char nombre[LARGO_NOMBRE + 1];\nscanf("%25s", nombre);\nstrcpy(curso[0], nombre);', 'ok', ['LECTURA_CON_INTERMEDIA']),
  lectura(8, 'en una variable y strncpy', 'char nombre[LARGO_NOMBRE + 1];\nscanf("%25s", nombre);\nstrncpy(curso[0], nombre, LARGO_NOMBRE);', 'ok', ['LECTURA_CON_INTERMEDIA']),
  lectura(8, 'en una variable, sin limite', 'char nombre[LARGO_NOMBRE + 1];\nscanf("%s", nombre);\nstrcpy(curso[0], nombre);', 'ok', ['LECTURA_CON_INTERMEDIA', 'LECTURA_SIN_LIMITE']),
  {
    ...lectura(8, 'en una variable mas grande que la posicion', 'char nombre[100];\nscanf("%25s", nombre);\nstrcpy(curso[0], nombre);', ['LECTURA_MAS_GRANDE_QUE_LA_POSICION']),
    dice: ['100', '26'],
  },
  lectura(8, 'en una variable, sin lugar para el fin', 'char nombre[LARGO_NOMBRE + 1];\nscanf("%26s", nombre);\nstrcpy(curso[0], nombre);', ['LECTURA_SIN_LUGAR_PARA_FIN']),
  lectura(8, 'en una variable, sin copiarla', 'char nombre[LARGO_NOMBRE + 1];\nscanf("%25s", nombre);', ['LECTURA_FALTA_COPIAR']),
  lectura(8, 'en una variable, copiada a otra posicion', 'char nombre[LARGO_NOMBRE + 1];\nscanf("%25s", nombre);\nstrcpy(curso[1], nombre);', ['LECTURA_FALTA_COPIAR']),

  // 8: todas las posiciones
  lectura(9, 'un ciclo for', 'for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  scanf("%25s", curso[i]);\n}'),
  lectura(9, 'un ciclo while', 'i = 0;\nwhile (i < MAX_ESTUDIANTES) {\n  scanf("%25s", curso[i]);\n  i++;\n}'),
  lectura(9, 'sin limite: correcto y mejorable', 'for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  scanf("%s", curso[i]);\n}', 'ok', ['LECTURA_SIN_LIMITE']),
  lectura(9, 'sin llegar al final', 'for (i = 0; i < 20; i++) {\n  scanf("%25s", curso[i]);\n}', ['CICLO_NO_LLEGA']),
  lectura(9, 'pasandose', 'for (i = 0; i <= MAX_ESTUDIANTES; i++) {\n  scanf("%25s", curso[i]);\n}', ['CICLO_SE_PASA']),
  lectura(9, 'siempre la misma posicion', 'for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  scanf("%25s", curso[0]);\n}', ['CICLO_NO_LEE']),
  lectura(9, 'sin leer en el ciclo', 'for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  printf("%s", curso[i]);\n}', ['CICLO_NO_LEE']),
  lectura(9, 'el indice no avanza', 'for (i = 0; i < MAX_ESTUDIANTES; ) {\n  scanf("%25s", curso[i]);\n}', ['CICLO_SIN_AVANCE']),
  lectura(9, 'el formato de un entero', 'for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  scanf("%d", curso[i]);\n}', ['FORMATO_NO_ES_TEXTO']),
  lectura(9, 'sin ciclo', 'scanf("%25s", curso[0]);', ['CICLO_FALTA']),
  lectura(9, 'en una variable y strcpy: correcto y mejorable', 'char nombre[LARGO_NOMBRE + 1];\nfor (i = 0; i < MAX_ESTUDIANTES; i++) {\n  scanf("%25s", nombre);\n  strcpy(curso[i], nombre);\n}', 'ok', ['LECTURA_CON_INTERMEDIA']),
  lectura(9, 'en una variable y siempre la misma posicion', 'char nombre[LARGO_NOMBRE + 1];\nfor (i = 0; i < MAX_ESTUDIANTES; i++) {\n  scanf("%25s", nombre);\n  strcpy(curso[0], nombre);\n}', ['CICLO_NO_LEE']),
  lectura(9, 'en una variable mas grande que la posicion', 'char nombre[100];\nfor (i = 0; i < MAX_ESTUDIANTES; i++) {\n  scanf("%25s", nombre);\n  strcpy(curso[i], nombre);\n}', ['LECTURA_MAS_GRANDE_QUE_LA_POSICION']),

  // 9: cuestionario, con el Enter
  { ...lectura(10, 'enter: la cadena vacia', '1'), dice: ['deja el Enter sin leer'] },
  lectura(10, 'enter: el nombre', '0', ['OPCION_LEE_EL_NOMBRE']),
  lectura(10, 'enter: el numero', '2', ['OPCION_NOMBRE_RECIBE_LA_EDAD']),
  lectura(10, 'enter: un error', '3', ['OPCION_LECTURA_VACIA_ES_ERROR']),

  // 10: descartar el Enter
  { ...lectura(11, 'el ciclo y gets: la nota ya se dijo antes', "while (getchar() != '\\n');\ngets(nombre);"), notas: [] },
  {
    ...lectura(11, 'el ciclo y gets: la primera vez', "while (getchar() != '\\n');\ngets(nombre);"),
    previas: ['', '', '', '', '', 'fgets(nombre, sizeof(nombre), stdin);', 'fgets(nombre, sizeof(nombre), stdin);\nprintf("Hola, %s", nombre);'],
    notas: ['USO_DE_GETS'],
  },
  lectura(11, 'el ciclo y fgets', "while (getchar() != '\\n');\nfgets(nombre, sizeof nombre, stdin);"),
  lectura(11, 'el ciclo con llaves vacias', "while (getchar() != '\\n') {\n}\nfgets(nombre, sizeof nombre, stdin);"),
  lectura(11, 'el ciclo con una variable', "int c;\nwhile ((c = getchar()) != '\\n');\nfgets(nombre, sizeof nombre, stdin);"),
  lectura(11, 'el ciclo con el codigo del Enter', 'while (getchar() != 10);\nfgets(nombre, sizeof nombre, stdin);', 'ok', ['LIMPIEZA_CON_CODIGO']),
  lectura(11, 'un solo getchar', 'getchar();\nfgets(nombre, sizeof nombre, stdin);', 'ok', ['GETCHAR_UN_SOLO_CARACTER']),
  lectura(11, 'fflush', 'fflush(stdin);\nfgets(nombre, sizeof nombre, stdin);', 'ok', ['FFLUSH_ENTRADA']),
  lectura(11, 'sin descartar nada', 'gets(nombre);', ['FALTA_LIMPIAR_ENTRADA']),
  lectura(11, 'sin descartar, con fgets', 'fgets(nombre, sizeof nombre, stdin);', ['FALTA_LIMPIAR_ENTRADA']),
  lectura(11, 'fflush de otra cosa', 'fflush(stdout);\ngets(nombre);', ['FALTA_LIMPIAR_ENTRADA']),
  lectura(11, 'descartar despues de leer', "gets(nombre);\nwhile (getchar() != '\\n');", ['LIMPIEZA_DESPUES']),
  lectura(11, 'el ciclo al reves', "while (getchar() == '\\n');\ngets(nombre);", ['LIMPIEZA_AL_REVES']),
  lectura(11, 'el ciclo que no se detiene en el Enter', 'while (getchar() != EOF);\ngets(nombre);', ['LIMPIEZA_SIN_ENTER']),
  lectura(11, 'leer con %s', "while (getchar() != '\\n');\nscanf(\"%s\", nombre);", ['LECTURA_CORTA_EN_ESPACIO']),
];

// Arreglo de caracteres y cadena: lo que las distingue.
const CASOS_DE_DIFERENCIAS = [
  fin(9, 'no es cadena: la lista sin fin', '2'),
  fin(9, 'no es cadena: el texto entre comillas', '0', ['OPCION_COMILLAS_SON_CADENA']),
  fin(9, 'no es cadena: la lista con fin', '1', ['OPCION_LISTA_CON_FIN_ES_CADENA']),
  // los cuestionarios que vienen de Cadenas 1
  { ...biblioteca(6, 'strlen: la correcta', '2'), dice: ['`Maria` tiene 5'] },
  biblioteca(6, 'strlen: el lugar declarado', '0', ['OPCION_TAMANO_DECLARADO']),
  biblioteca(6, 'strlen: cuenta el fin', '1', ['OPCION_CUENTA_EL_FIN']),
  biblioteca(6, 'strlen: sin elegir', '', ['OPCION_FALTA']),
  biblioteca(7, 'sizeof: la correcta', '2'),
  biblioteca(7, 'sizeof: las letras', '0', ['OPCION_SIZEOF_CUENTA_LETRAS']),
  biblioteca(7, 'sizeof: las letras y el fin', '1', ['OPCION_SIZEOF_CUENTA_FIN']),
  fin(4, 'que contiene la variable: la correcta', '2'),
  fin(4, 'que contiene la variable: la ultima letra', '0', ['OPCION_ULTIMA_LETRA']),
  fin(4, 'que contiene la variable: no existe', '1', ['OPCION_POSICION_NO_EXISTE']),
  biblioteca(8, 'largo de una cadena vaciada: la correcta', '2'),
  biblioteca(8, 'largo de una cadena vaciada: lo que tenia', '0', ['OPCION_VACIAR_NO_CAMBIA']),
  biblioteca(8, 'largo de una cadena vaciada: el tamano', '1', ['OPCION_TAMANO_DECLARADO']),
  biblioteca(9, 'strlen sin fin: no se puede saber', '2'),
  biblioteca(9, 'strlen sin fin: las letras', '0', ['OPCION_STRLEN_CUENTA_LAS_LETRAS']),
  biblioteca(9, 'strlen sin fin: cero', '1', ['OPCION_STRLEN_DA_CERO']),
  recorrer(3, 'dos formas: las de los dos textos', '2'),
  recorrer(3, 'dos formas: los tamanos', '0', ['OPCION_CUENTA_EL_TAMANO']),
  recorrer(3, 'dos formas: un solo texto', '1', ['OPCION_CUENTA_UN_SOLO_CICLO']),
  lectura(4, 'cuantas letras muestra: las del texto', '2'),
  lectura(4, 'cuantas letras muestra: las posiciones', '0', ['OPCION_MUESTRA_EL_TAMANO']),
  lectura(4, 'cuantas letras muestra: con el fin', '1', ['OPCION_MUESTRA_EL_FIN']),
];

export const CASOS_DE_CADENAS_NUEVAS = [
  ...CASOS_DE_DIFERENCIAS,
  ...CASOS_DE_FIN,
  ...CASOS_DE_VACIA,
  ...CASOS_DE_BIBLIOTECA,
  ...CASOS_DE_RECORRER,
  ...CASOS_DE_ARREGLOS_Y_TABLAS,
  ...CASOS_DE_TYPEDEF,
  ...CASOS_DE_LECTURA,
];
