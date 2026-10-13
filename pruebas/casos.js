// Casos de prueba del corrector.
//
//   serie:     el id de la serie (si falta, "estructuras")
//   paso:      a que consigna de la serie responde (1 = la primera)
//   respuesta: lo que escribe el alumno
//   espera:    'ok', o la lista de codigos de error que tienen que salir
//   avisos:    codigos de aviso que tienen que salir (no hacen fallar la respuesta)
//   mejoras:   si esta, los codigos de mejora que tienen que salir, justo esos
//              ([] = la respuesta es excelente)
//   previas:   respuestas a las consignas anteriores, si no son las de referencia
//
// Sumar un caso cada vez que un alumno escriba algo que el corrector entienda mal.

import { CASOS_DE_CADENAS_NUEVAS } from './casos-cadenas.js';

const TYPEDEF_SIN_ETIQUETA = `typedef struct {
  char nombreFantasia[50];
  char titular[50];
  float montoRecaudado;
  int cantidadVentas;
} Puesto;`;

const campos = (cuerpo) => `struct Puesto {\n${cuerpo}\n};`;

// Las sentencias de la serie de cadenas.
const cadenas = (paso, nombre, respuesta, espera) => ({
  serie: 'cadenas-biblioteca',
  paso: paso + 2,
  nombre,
  respuesta,
  espera,
});

const CASOS_DE_CADENAS = [
  cadenas(1, 'strcpy', 'strcpy(cadena2, cadena1);', 'ok'),
  cadenas(1, 'strcpy con espacios y comentario', '// copio\nstrcpy( cadena2 ,\n        cadena1 ) ;', 'ok'),
  cadenas(1, 'strcpy con el include', '#include <string.h>\nstrcpy(cadena2, cadena1);', 'ok'),
  cadenas(1, 'asignacion directa', 'cadena2 = cadena1;', ['ASIGNACION_DE_ARREGLO']),
  cadenas(1, 'asignacion de un texto', 'cadena2 = "Hola mundo";', ['ASIGNACION_DE_ARREGLO']),
  cadenas(1, 'argumentos al reves', 'strcpy(cadena1, cadena2);', ['ARGUMENTOS_EN_OTRO_ORDEN']),
  cadenas(1, 'argumentos entre comillas', 'strcpy("cadena2", "cadena1");', ['ARGUMENTO_ENTRE_COMILLAS']),
  cadenas(1, 'argumentos con &', 'strcpy(&cadena2, &cadena1);', ['ARGUMENTO_CON_AMPERSAND']),
  cadenas(1, 'argumentos con corchetes', 'strcpy(cadena2[30], cadena1[30]);', ['ARGUMENTO_CON_CORCHETES']),
  cadenas(1, 'variable que no existe', 'strcpy(cadena2, cadena3);', ['VARIABLE_DESCONOCIDA']),
  cadenas(1, 'variable con mayuscula', 'strcpy(Cadena2, cadena1);', ['VARIABLE_DESCONOCIDA']),
  cadenas(1, 'otra variable que si existe', 'strcpy(cadena2, cadena2);', ['ARGUMENTO_EQUIVOCADO']),
  cadenas(1, 'un solo argumento', 'strcpy(cadena2);', ['ARGUMENTOS_CANTIDAD']),
  cadenas(1, 'funcion mal escrita', 'strcopy(cadena2, cadena1);', ['FUNCION_MAL_ESCRITA']),
  cadenas(1, 'funcion con mayuscula', 'Strcpy(cadena2, cadena1);', ['FUNCION_MAL_ESCRITA']),
  cadenas(1, 'otra funcion de la biblioteca', 'strcat(cadena2, cadena1);', ['FUNCION_EQUIVOCADA']),
  cadenas(1, 'strncpy no esta entre las aceptadas', 'strncpy(cadena2, cadena1, 30);', ['FUNCION_EQUIVOCADA']),
  cadenas(
    1,
    'copia a mano con for',
    'int i;\nfor (i = 0; cadena1[i] != \'\\0\'; i++) {\n  cadena2[i] = cadena1[i];\n}\ncadena2[i] = \'\\0\';',
    ['A_MANO']
  ),
  cadenas(
    1,
    'copia a mano con while',
    'int i = 0;\nwhile (cadena1[i] != \'\\0\') {\n  cadena2[i] = cadena1[i];\n  i++;\n}\ncadena2[i] = \'\\0\';',
    ['A_MANO']
  ),
  cadenas(1, 'nada que sea una llamada', 'int x;', ['LLAMADA_FALTA']),
  cadenas(1, 'sin ;', 'strcpy(cadena2, cadena1)', ['FALTA_PUNTO_Y_COMA']),
  cadenas(1, 'sin la coma', 'strcpy(cadena2 cadena1);', ['FALTA_COMA']),
  cadenas(1, 'parentesis sin cerrar', 'strcpy(cadena2, cadena1;', ['FALTA_PARENTESIS']),
  cadenas(1, 'con main', 'int main() {\n  strcpy(cadena2, cadena1);\n  return 0;\n}', ['MAIN_DE_MAS']),

  cadenas(2, 'strcat', 'strcat(saludo, cadena1);', 'ok'),
  cadenas(2, 'la alternativa, con su argumento de mas', 'strncat(saludo, cadena1, 20);', 'ok'),
  cadenas(2, 'la alternativa sin argumentos suficientes', 'strncat(saludo);', ['ARGUMENTOS_CANTIDAD']),
  cadenas(2, 'strcat al reves', 'strcat(cadena1, saludo);', ['ARGUMENTOS_EN_OTRO_ORDEN']),
  cadenas(2, 'strcat con un argumento de mas', 'strcat(saludo, cadena1, 20);', ['ARGUMENTOS_CANTIDAD']),
  cadenas(2, 'la funcion del paso anterior', 'strcpy(saludo, cadena1);', ['FUNCION_EQUIVOCADA']),
];

// Los arreglos, en una serie que pide la buena practica de las constantes:
// "mejoras" es lo que deja la respuesta correcta pero no excelente.
const arreglos = (paso, nombre, respuesta, espera, mejoras = []) => ({
  serie: 'arreglos-declarar',
  paso,
  nombre,
  respuesta,
  espera,
  mejoras,
});

const CASOS_DE_ARREGLOS = [
  arreglos(1, 'con #define es excelente', '#define MAX_ALUMNOS 20\nint notas[MAX_ALUMNOS];', 'ok'),
  arreglos(1, 'con el valor entre parentesis', '#define MAX (20)\nint notas[MAX];', 'ok'),
  arreglos(1, 'numero suelto: correcto pero mejorable', 'int notas[20];', 'ok', ['NUMERO_MAGICO']),
  arreglos(1, 'constante en minuscula', '#define max 20\nint notas[max];', 'ok', ['CONSTANTE_EN_MINUSCULA']),
  arreglos(1, 'const en vez de #define', 'const int MAX = 20;\nint notas[MAX];', 'ok', ['DIMENSION_CON_VARIABLE']),
  arreglos(1, 'una variable comun como dimension', 'int n = 20;\nint notas[n];', 'ok', ['DIMENSION_CON_VARIABLE']),
  arreglos(1, 'constante sin definir', 'int notas[MAX_ALUMNOS];', ['CONSTANTE_SIN_DEFINIR']),
  arreglos(1, 'constante definida despues', 'int notas[MAX];\n#define MAX 20', ['CONSTANTE_DEFINIDA_DESPUES']),
  arreglos(1, 'la constante vale de mas', '#define MAX 30\nint notas[MAX];', ['ARREGLO_GRANDE']),
  arreglos(1, 'la constante vale de menos', '#define MAX 10\nint notas[MAX];', ['ARREGLO_CHICO']),
  arreglos(1, 'un solo elemento', 'int notas[1];', ['ARREGLO_CHICO']),
  // Con un error, la mejora no se dice: primero que quede bien.
  arreglos(1, 'de mas con numero suelto', 'int notas[30];', ['ARREGLO_GRANDE']),
  arreglos(1, 'otro tipo con numero suelto', 'float notas[20];', ['VARIABLE_TIPO']),
  arreglos(1, 'sin corchetes', 'int notas;', ['VARIABLE_NO_ES_ARREGLO']),
  arreglos(1, 'dos dimensiones', '#define F 4\n#define C 5\nint notas[F][C];', ['ARREGLO_DIMENSIONES']),
  arreglos(1, 'otro tipo', '#define MAX 20\nfloat notas[MAX];', ['VARIABLE_TIPO']),
  arreglos(1, 'cualquier nombre sirve', '#define MAX 20\nint nota[MAX];', 'ok'),
  arreglos(1, 'el #define sin el arreglo', '#define MAX 20', ['VARIABLE_FALTA']),
  arreglos(2, 'usa la constante del paso anterior', 'float promedios[MAX_ALUMNOS];', 'ok'),
  arreglos(2, 'double tambien es real', 'double promedios[MAX_ALUMNOS];', 'ok'),
  // Ya definio la constante en el paso anterior: lo que falta es usarla.
  arreglos(2, 'numero suelto habiendo una constante que vale eso', 'float promedios[20];', 'ok', [
    'CONSTANTE_SIN_REUTILIZAR',
  ]),
  arreglos(1, 'numero suelto con la constante en la misma respuesta', '#define MAX 20\nint notas[20];', 'ok', [
    'CONSTANTE_SIN_REUTILIZAR',
  ]),
  arreglos(1, 'la constante que hay vale otra cosa', '#define OTRA 50\nint notas[20];', 'ok', ['NUMERO_MAGICO']),
  arreglos(1, 'la constante esta despues: no la podia usar', 'int notas[20];\n#define MAX 20', 'ok', [
    'NUMERO_MAGICO',
  ]),
  arreglos(2, 'constante mal escrita', 'float promedios[MAX_ALUMNO];', ['CONSTANTE_SIN_DEFINIR']),
  arreglos(2, 'el mismo nombre del paso anterior', 'float notas[MAX_ALUMNOS];', ['VARIABLE_REDEFINIDA']),
  arreglos(2, 'con otro tipo entero', 'int promedios[MAX_ALUMNOS];', ['VARIABLE_TIPO']),
  arreglos(2, 'con otro tamano', 'float promedios[10];', ['ARREGLO_CHICO']),

  // 3: un arreglo de decimales (un programa nuevo)
  arreglos(3, 'con #define es excelente', '#define DIAS_SEMANA 7\nfloat temperaturas[DIAS_SEMANA];', 'ok'),
  arreglos(3, 'double tambien es real', '#define DIAS_SEMANA 7\ndouble temperaturas[DIAS_SEMANA];', 'ok'),
  arreglos(3, 'numero suelto: correcto pero mejorable', 'float temperaturas[7];', 'ok', ['NUMERO_MAGICO']),
  arreglos(3, 'de menos', '#define DIAS_SEMANA 6\nfloat temperaturas[DIAS_SEMANA];', ['ARREGLO_CHICO']),
  arreglos(3, 'de mas', '#define DIAS_SEMANA 8\nfloat temperaturas[DIAS_SEMANA];', ['ARREGLO_GRANDE']),
  arreglos(3, 'de enteros', '#define DIAS_SEMANA 7\nint temperaturas[DIAS_SEMANA];', ['VARIABLE_TIPO']),
  arreglos(3, 'una sola temperatura', 'float temperatura;', ['VARIABLE_NO_ES_ARREGLO']),

  // 4: el tamano sale de una cuenta (sigue de la anterior, que dejo DIAS_SEMANA)
  arreglos(4, 'con dos constantes', '#define SEMANAS 2\nfloat dosSemanas[SEMANAS * DIAS_SEMANA];', 'ok'),
  arreglos(4, 'el total con su propia constante', '#define TOTAL 14\nfloat dosSemanas[TOTAL];', 'ok'),
  arreglos(4, 'con el dos suelto: correcto y mejorable', 'float dosSemanas[2 * DIAS_SEMANA];', 'ok', ['NUMERO_MAGICO']),
  arreglos(4, 'con el catorce suelto: correcto y mejorable', 'float dosSemanas[14];', 'ok', ['NUMERO_MAGICO']),
  arreglos(4, 'solo una semana', 'float dosSemanas[DIAS_SEMANA];', ['ARREGLO_CHICO']),
  arreglos(4, 'tres semanas', '#define SEMANAS 3\nfloat dosSemanas[SEMANAS * DIAS_SEMANA];', ['ARREGLO_GRANDE']),
  arreglos(4, 'el nombre del arreglo anterior', '#define SEMANAS 2\nfloat temperaturas[SEMANAS * DIAS_SEMANA];', ['VARIABLE_REDEFINIDA']),
];

// Guardar un valor en una posicion: el arreglo de notas viene dado.
const posiciones = (paso, nombre, respuesta, espera = 'ok', mejoras = []) => ({
  serie: 'arreglos-elementos',
  paso,
  nombre,
  respuesta,
  espera,
  mejoras,
});

const CASOS_DE_POSICIONES = [
  // 1: las dos primeras posiciones
  posiciones(1, 'las dos notas', 'notas[0] = 8;\nnotas[1] = 5;', 'ok'),
  posiciones(1, 'en otro orden', 'notas[1] = 5;\nnotas[0] = 8;', 'ok'),
  posiciones(1, 'con espacios', 'notas[ 0 ]=8;\nnotas[ 1 ]=5;', 'ok'),
  posiciones(1, 'solo la primera', 'notas[0] = 8;', ['ASIGNACION_FALTA_POSICION']),
  posiciones(1, 'solo la segunda', 'notas[1] = 5;', ['ASIGNACION_FALTA_POSICION']),
  posiciones(1, 'las notas intercambiadas', 'notas[0] = 5;\nnotas[1] = 8;', ['ASIGNACION_VALOR_DISTINTO']),
  posiciones(1, 'contando desde uno', 'notas[1] = 8;\nnotas[2] = 5;', ['ARGUMENTO_OTRA_POSICION', 'ASIGNACION_VALOR_DISTINTO']),
  posiciones(1, 'una posicion que no existe', 'notas[0] = 8;\nnotas[20] = 5;', ['INDICE_FUERA_DE_RANGO']),
  posiciones(1, 'el arreglo completo', 'notas = 8;', ['ASIGNACION_DE_ARREGLO']),
  posiciones(1, 'con dos signos igual', 'notas[0] == 8;\nnotas[1] = 5;', ['ASIGNACION_CON_IGUAL_DOBLE']),
  posiciones(1, 'con una variable de indice', 'int i = 0;\nnotas[i] = 8;\nnotas[1] = 5;', ['ARGUMENTO_POSICION_CON_VARIABLE']),
  posiciones(1, 'sin asignar', 'int x;', ['ASIGNACION_FALTA']),

  // 2: la ultima posicion (sigue de la anterior)
  posiciones(2, 'con la constante', 'notas[MAX_ALUMNOS - 1] = 10;', 'ok'),
  posiciones(2, 'con el numero suelto: correcto y mejorable', 'notas[19] = 10;', 'ok', ['ULTIMO_CON_NUMERO_SUELTO']),
  posiciones(2, 'con una cuenta', 'notas[10 + 9] = 10;', 'ok', ['ULTIMO_CON_NUMERO_SUELTO']),
  posiciones(2, 'el tamano, que no es una posicion', 'notas[MAX_ALUMNOS] = 10;', ['INDICE_FUERA_DE_RANGO']),
  posiciones(2, 'el veinte', 'notas[20] = 10;', ['INDICE_FUERA_DE_RANGO']),
  posiciones(2, 'la anteultima', 'notas[18] = 10;', ['ARGUMENTO_OTRA_POSICION']),
  posiciones(2, 'la primera', 'notas[0] = 10;', ['ARGUMENTO_OTRA_POSICION']),

  // 3: cuestionario, que hay en una posicion
  posiciones(3, 'posicion: el tercer valor', '2'),
  posiciones(3, 'posicion: contando desde uno', '0', ['OPCION_POSICION_DESDE_UNO']),
  posiciones(3, 'posicion: el indice', '1', ['OPCION_EL_INDICE_ES_EL_VALOR']),

  // 4: la suma de dos posiciones, en una variable
  posiciones(4, 'con el tipo', 'int total = notas[0] + notas[MAX_ALUMNOS - 1];', 'ok'),
  posiciones(4, 'con una asignacion', 'int total;\ntotal = notas[0] + notas[19];', 'ok'),
  posiciones(4, 'en otro orden', 'int total = notas[MAX_ALUMNOS - 1] + notas[0];', 'ok'),
  posiciones(4, 'con otro nombre', 'int suma = notas[0] + notas[19];', 'ok'),
  posiciones(4, 'otras posiciones', 'int total = notas[0] + notas[1];', ['SUMA_OTRAS_POSICIONES']),
  posiciones(4, 'una sola posicion', 'int total = notas[0];', ['SUMA_OTRAS_POSICIONES']),
  posiciones(4, 'una resta', 'int total = notas[0] - notas[MAX_ALUMNOS - 1];', ['SUMA_OPERADOR']),
  posiciones(4, 'una multiplicacion', 'int total = notas[0] * notas[MAX_ALUMNOS - 1];', ['SUMA_OPERADOR']),
  posiciones(4, 'los numeros en lugar de las posiciones', 'int total = 8 + 10;', ['SUMA_FALTA']),
  posiciones(4, 'sin guardar', 'notas[0] + notas[MAX_ALUMNOS - 1];', ['SUMA_FALTA']),
  posiciones(4, 'en una posicion del arreglo', 'notas[2] = notas[0] + notas[19];', ['SUMA_EN_UNA_POSICION']),

  // 5: copiar de una posicion a otra
  posiciones(5, 'la segunda recibe la primera', 'notas[1] = notas[0];', 'ok'),
  posiciones(5, 'al reves', 'notas[0] = notas[1];', ['ASIGNACION_AL_REVES']),
  posiciones(5, 'otra posicion de origen', 'notas[1] = notas[2];', ['ASIGNACION_VALOR_DISTINTO']),
  posiciones(5, 'un numero en lugar de la posicion', 'notas[1] = 8;', ['ASIGNACION_VALOR_DISTINTO']),
  posiciones(5, 'a otra posicion', 'notas[2] = notas[0];', ['ARGUMENTO_OTRA_POSICION']),

  // 6: cuestionario, que paso con el valor anterior
  posiciones(6, 'anterior: el valor copiado', '2'),
  posiciones(6, 'anterior: el que tenia', '0', ['OPCION_SIGUE_EL_ANTERIOR']),
  posiciones(6, 'anterior: los dos juntos', '1', ['OPCION_SE_SUMAN']),

  // 7: intercambiar (un programa nuevo, con {8, 5})
  posiciones(7, 'con una auxiliar', 'int auxiliar = notas[0];\nnotas[0] = notas[1];\nnotas[1] = auxiliar;', 'ok'),
  posiciones(7, 'con la auxiliar declarada antes', 'int auxiliar;\nauxiliar = notas[0];\nnotas[0] = notas[1];\nnotas[1] = auxiliar;', 'ok'),
  posiciones(7, 'guardando la otra', 'int auxiliar = notas[1];\nnotas[1] = notas[0];\nnotas[0] = auxiliar;', 'ok'),
  posiciones(7, 'con sumas y restas', 'notas[0] = notas[0] + notas[1];\nnotas[1] = notas[0] - notas[1];\nnotas[0] = notas[0] - notas[1];', 'ok'),
  posiciones(7, 'sin auxiliar', 'notas[0] = notas[1];\nnotas[1] = notas[0];', ['INTERCAMBIO_SIN_AUXILIAR']),
  posiciones(7, 'la auxiliar guardada tarde', 'int auxiliar = notas[0];\nnotas[1] = auxiliar;\nnotas[0] = notas[1];', ['INTERCAMBIO_SIN_AUXILIAR']),
  posiciones(7, 'sin devolver lo guardado', 'int auxiliar = notas[0];\nnotas[0] = notas[1];', ['INTERCAMBIO_INCOMPLETO']),
  posiciones(7, 'sin hacer nada', 'int auxiliar;', ['INTERCAMBIO_FALTA']),
  {
    ...posiciones(7, 'dentro de un ciclo: sin comprobar', 'int auxiliar;\nint i;\nfor (i = 0; i < 1; i++) {\n  auxiliar = notas[0];\n  notas[0] = notas[1];\n  notas[1] = auxiliar;\n}', 'ok'),
    sinVerificar: true,
  },

  // 8, 9 y 10: cuestionarios (la respuesta es el lugar de la opcion)
  posiciones(8, 'sin valor: no se puede saber', '2'),
  posiciones(8, 'sin valor: cero', '0', ['OPCION_SIN_VALOR_ES_CERO']),
  posiciones(8, 'sin valor: copia el anterior', '1', ['OPCION_COPIA_EL_ANTERIOR']),
  posiciones(9, 'fuera: no se puede saber', '2'),
  posiciones(9, 'fuera: la sexta posicion', '0', ['OPCION_LA_SEXTA_POSICION']),
  posiciones(9, 'fuera: el compilador avisa', '1', ['OPCION_EL_COMPILADOR_AVISA']),
  posiciones(10, 'variable: el 20', '2'),
  posiciones(10, 'variable: ignora la cuenta', '0', ['OPCION_IGNORA_LA_CUENTA']),
  posiciones(10, 'variable: resta de mas', '1', ['OPCION_RESTA_DE_MAS']),
];

// Recorrer un arreglo: se corrige siguiendo lo que hace el ciclo.
const recorrer = (paso, nombre, respuesta, espera = 'ok', mejoras = []) => ({
  serie: 'arreglos-recorrer',
  paso,
  nombre,
  respuesta,
  espera,
  mejoras,
});

const CASOS_DE_RECORRER = [
  // 1: dejar todo en cero
  recorrer(1, 'un for con la constante', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  notas[i] = 0;\n}'),
  recorrer(1, 'un while', 'i = 0;\nwhile (i < MAX_ALUMNOS) {\n  notas[i] = 0;\n  i++;\n}'),
  recorrer(1, 'un do while', 'i = 0;\ndo {\n  notas[i] = 0;\n  i++;\n} while (i < MAX_ALUMNOS);'),
  recorrer(1, 'sin llaves', 'for (i = 0; i < MAX_ALUMNOS; i++)\n  notas[i] = 0;'),
  recorrer(1, 'con otra forma de contar', 'for (i = 0; i <= MAX_ALUMNOS - 1; i += 1) {\n  notas[i] = 0;\n}'),
  recorrer(1, 'hacia atras', 'for (i = MAX_ALUMNOS - 1; i >= 0; i--) {\n  notas[i] = 0;\n}'),
  recorrer(1, 'con el numero suelto: correcto y mejorable', 'for (i = 0; i < 20; i++) {\n  notas[i] = 0;\n}', 'ok', ['LIMITE_CON_NUMERO_SUELTO']),
  recorrer(1, 'una vuelta de mas', 'for (i = 0; i <= MAX_ALUMNOS; i++) {\n  notas[i] = 0;\n}', ['INDICE_FUERA_DE_RANGO']),
  recorrer(1, 'sin llegar a la ultima', 'for (i = 0; i < MAX_ALUMNOS - 1; i++) {\n  notas[i] = 0;\n}', ['RESULTADO_POSICION_SIN_VALOR']),
  recorrer(1, 'empezando en uno', 'for (i = 1; i < MAX_ALUMNOS; i++) {\n  notas[i] = 0;\n}', ['RESULTADO_POSICION_SIN_VALOR']),
  recorrer(1, 'otro valor', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  notas[i] = 1;\n}', ['RESULTADO_VALOR_DISTINTO']),
  recorrer(1, 'siempre la misma posicion', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  notas[0] = 0;\n}', ['RESULTADO_POSICION_SIN_VALOR']),
  recorrer(1, 'el indice no avanza', 'for (i = 0; i < MAX_ALUMNOS; ) {\n  notas[i] = 0;\n}', ['CICLO_NO_TERMINA']),
  recorrer(1, 'una condicion que siempre se cumple', 'i = 0;\nwhile (i >= 0) {\n  notas[i % MAX_ALUMNOS] = 0;\n  i++;\n}', ['CICLO_NO_TERMINA']),
  recorrer(1, 'un while sin darle valor al indice', 'while (i < MAX_ALUMNOS) {\n  notas[i] = 0;\n  i++;\n}', ['VARIABLE_SIN_VALOR']),
  recorrer(1, 'sin ciclo', 'notas[0] = 0;', ['CICLO_FALTA']),
  recorrer(1, 'con un solo corchete de mas', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  notas = 0;\n}', ['ASIGNACION_DE_ARREGLO']),
  {
    ...recorrer(1, 'algo que no se sabe seguir: queda sin comprobar', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  notas[i] = 0;\n  printf("%d", notas[i]);\n}'),
    sinVerificar: true,
  },

  // 2: cada posicion con su numero
  recorrer(2, 'el indice', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  notas[i] = i;\n}'),
  recorrer(2, 'sumando uno cada vez', 'int numero = 0;\nfor (i = 0; i < MAX_ALUMNOS; i++) {\n  notas[i] = numero;\n  numero++;\n}'),
  recorrer(2, 'contando desde uno', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  notas[i] = i + 1;\n}', ['RESULTADO_VALOR_DISTINTO']),
  recorrer(2, 'siempre cero', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  notas[i] = 0;\n}', ['RESULTADO_VALOR_DISTINTO']),

  // 3: cuestionario, que queda en una posicion
  recorrer(3, 'queda el doble: la correcta', '2'),
  recorrer(3, 'queda el doble: el indice', '0', ['OPCION_EL_INDICE_ES_EL_VALOR']),
  recorrer(3, 'queda el doble: el ultimo valor', '1', ['OPCION_ULTIMA_VUELTA']),

  // 4: el cuadrado
  recorrer(4, 'el indice por el indice', 'for (i = 0; i < CANTIDAD; i++) {\n  cuadrados[i] = i * i;\n}'),
  recorrer(4, 'con la cuenta al reves', 'for (i = CANTIDAD - 1; i >= 0; i--) {\n  cuadrados[i] = i * i;\n}'),
  recorrer(4, 'el doble', 'for (i = 0; i < CANTIDAD; i++) {\n  cuadrados[i] = i * 2;\n}', ['RESULTADO_VALOR_DISTINTO']),
  recorrer(4, 'el cuadrado de la posicion que sigue', 'for (i = 0; i < CANTIDAD; i++) {\n  cuadrados[i] = (i + 1) * (i + 1);\n}', ['RESULTADO_VALOR_DISTINTO']),

  // 5: cuestionario, cuantas vueltas da
  recorrer(5, 'vueltas: seis', '2'),
  recorrer(5, 'vueltas: cinco', '0', ['OPCION_NO_CUENTA_EL_IGUAL']),
  recorrer(5, 'vueltas: cuatro', '1', ['OPCION_CUENTA_DE_MENOS']),

  // 6: solo las posiciones pares
  recorrer(6, 'de a dos', 'for (i = 0; i < CANTIDAD; i += 2) {\n  notas[i] = 0;\n}'),
  recorrer(6, 'con un if', 'for (i = 0; i < CANTIDAD; i++) {\n  if (i % 2 == 0) {\n    notas[i] = 0;\n  }\n}'),
  recorrer(6, 'todas', 'for (i = 0; i < CANTIDAD; i++) {\n  notas[i] = 0;\n}', ['RESULTADO_VALOR_DISTINTO']),
  recorrer(6, 'las impares', 'for (i = 1; i < CANTIDAD; i += 2) {\n  notas[i] = 0;\n}', ['RESULTADO_VALOR_DISTINTO']),

  // 7: de la ultima a la primera
  recorrer(7, 'hacia atras', 'for (i = CANTIDAD - 1; i >= 0; i--) {\n  cuenta[i] = 10 - i;\n}'),
  recorrer(7, 'hacia atras con while', 'i = CANTIDAD - 1;\nwhile (i >= 0) {\n  cuenta[i] = 10 - i;\n  i--;\n}'),
  recorrer(7, 'hacia adelante: el resultado es el mismo, el sentido no', 'for (i = 0; i < CANTIDAD; i++) {\n  cuenta[i] = 10 - i;\n}', ['RECORRIDO_EN_OTRO_SENTIDO']),
  recorrer(7, 'hacia atras con otro valor', 'for (i = CANTIDAD - 1; i >= 0; i--) {\n  cuenta[i] = i;\n}', ['RESULTADO_VALOR_DISTINTO']),
  recorrer(7, 'hacia atras sin llegar a la primera', 'for (i = CANTIDAD - 1; i > 0; i--) {\n  cuenta[i] = 10 - i;\n}', ['RESULTADO_POSICION_SIN_VALOR']),
];

// Arreglos definidos con sus valores: los del dibujo, 3 6 0 7 1 5.
const valores = (paso, nombre, respuesta, espera, mejoras = []) => ({
  serie: 'arreglos-valores',
  paso,
  nombre,
  respuesta,
  espera,
  mejoras,
});

// Las tablas con sus valores: su serie, todavia sin debatir.
const tablas = (paso, nombre, respuesta, espera, mejoras = []) => ({
  serie: 'arreglos-tablas',
  paso,
  nombre,
  respuesta,
  espera,
  mejoras,
});

const CASOS_DE_VALORES = [
  valores(1, 'corchetes vacios es excelente', 'int v[] = {3, 6, 0, 7, 1, 5};', 'ok'),
  valores(1, 'en varios renglones y con coma al final', 'int v[] = {\n  3, 6, 0,\n  7, 1, 5,\n};', 'ok'),
  valores(1, 'otro tipo entero', 'long v[] = {3, 6, 0, 7, 1, 5};', 'ok'),
  valores(1, 'con main de mas', 'int main() {\n  int v[] = {3, 6, 0, 7, 1, 5};\n  return 0;\n}', ['MAIN_DE_MAS']),
  valores(1, 'con la cantidad justa: correcto y mejorable', 'int v[6] = {3, 6, 0, 7, 1, 5};', 'ok', [
    'DIMENSION_REPETIDA',
  ]),
  valores(1, 'con una constante que vale la cantidad justa', '#define N 6\nint v[N] = {3, 6, 0, 7, 1, 5};', 'ok', [
    'DIMENSION_REPETIDA',
  ]),
  valores(1, 'lugar de mas', 'int v[10] = {3, 6, 0, 7, 1, 5};', ['ARREGLO_GRANDE']),
  valores(1, 'lugar de menos', 'int v[4] = {3, 6, 0, 7, 1, 5};', ['ARREGLO_CHICO']),
  valores(1, 'un valor de menos', 'int v[] = {3, 6, 0, 7, 1};', ['VALORES_DE_MENOS']),
  valores(1, 'un valor de mas', 'int v[] = {3, 6, 0, 7, 1, 5, 9};', ['VALORES_DE_MAS']),
  valores(1, 'un valor distinto', 'int v[] = {3, 6, 0, 2, 1, 5};', ['VALOR_DISTINTO']),
  valores(1, 'los mismos en otro orden', 'int v[] = {5, 1, 7, 0, 6, 3};', ['VALORES_EN_OTRO_ORDEN']),
  valores(1, 'valores entre comillas', "int v[] = {'3', '6', '0', '7', '1', '5'};", ['VALOR_ENTRE_COMILLAS']),
  valores(1, 'sin valores', 'int v[6];', ['VALORES_FALTAN']),
  valores(1, 'valores de a uno, despues', 'int v[6];\nv[0] = 3;\nv[1] = 6;', ['VALORES_APARTE']),
  valores(1, 'un solo valor, sin lista', 'int v[6] = 3;', ['VALORES_SIN_LISTA']),
  valores(1, 'entre parentesis', 'int v[] = (3, 6, 0, 7, 1, 5);', ['VALORES_SIN_LISTA']),
  valores(1, 'llaves de mas', 'int v[] = {{3, 6, 0}, {7, 1, 5}};', ['VALORES_ANIDADOS']),
  valores(1, 'entre corchetes', 'int v[] = [3, 6, 0, 7, 1, 5];', ['CORCHETES_EN_LA_LISTA']),
  valores(1, 'separados con ;', 'int v[] = {3; 6; 0; 7; 1; 5};', ['PUNTO_Y_COMA_EN_LA_LISTA']),
  valores(1, 'sin comas', 'int v[] = {3 6 0 7 1 5};', ['FALTA_COMA_EN_LA_LISTA']),
  valores(1, 'corchetes pegados al tipo', 'int[] v = {3, 6, 0, 7, 1, 5};', ['CORCHETES_ANTES_DEL_NOMBRE']),
  valores(1, 'con decimales donde van enteros', 'float v[] = {3, 6, 0, 7, 1, 5};', ['VARIABLE_TIPO']),
  valores(1, 'sin corchetes', 'int v = {3, 6, 0, 7, 1, 5};', ['VARIABLE_NO_ES_ARREGLO']),
  valores(1, 'dos dimensiones', 'int v[2][3] = {{3, 6, 0}, {7, 1, 5}};', ['ARREGLO_DIMENSIONES']),
  valores(1, 'sin ;', 'int v[] = {3, 6, 0, 7, 1, 5}', ['FALTA_PUNTO_Y_COMA']),
  valores(1, 'llave sin cerrar', 'int v[] = {3, 6, 0, 7, 1, 5;', ['FALTA_LLAVE']),

  valores(2, 'decimales', 'float p[] = {12.5, 8, 99.9, 0.75};', 'ok'),
  valores(2, 'double, con el cero y la f', 'double p[] = {12.50, 8.0, 99.9f, .75};', 'ok'),
  valores(2, 'enteros donde van decimales', 'int p[] = {12.5, 8, 99.9, 0.75};', ['VARIABLE_TIPO']),
  valores(2, 'coma decimal', 'float p[] = {12,5, 8, 99,9, 0,75};', ['VALORES_DE_MAS']),

  // Algunos valores: siete dias y solo cuatro valores, lo demas queda en cero.
  valores(3, 'con una constante es excelente', '#define DIAS_SEMANA 7\nint visitas[DIAS_SEMANA] = {12, 9, 15, 11};', 'ok'),
  valores(3, 'con el numero suelto', 'int visitas[7] = {12, 9, 15, 11};', 'ok', ['NUMERO_MAGICO']),
  valores(3, 'los siete valores escritos', 'int visitas[] = {12, 9, 15, 11, 0, 0, 0};', 'ok'),
  valores(3, 'los siete valores y la cantidad repetida', 'int visitas[7] = {12, 9, 15, 11, 0, 0, 0};', 'ok', ['DIMENSION_REPETIDA']),
  valores(3, 'solo cuatro lugares', 'int visitas[] = {12, 9, 15, 11};', ['VALORES_DE_MENOS']),
  valores(3, 'lugar de menos', 'int visitas[5] = {12, 9, 15, 11};', ['ARREGLO_CHICO']),
  valores(3, 'lugar de mas', 'int visitas[10] = {12, 9, 15, 11};', ['ARREGLO_GRANDE']),
  valores(3, 'un valor distinto', '#define DIAS_SEMANA 7\nint visitas[DIAS_SEMANA] = {12, 9, 15, 10};', ['VALOR_DISTINTO']),
  valores(3, 'falta un valor y no es cero', '#define DIAS_SEMANA 7\nint visitas[DIAS_SEMANA] = {12, 9, 15};', ['VALORES_SIN_NOMBRAR']),

  // La tabla del dibujo: 3 filas por 4 columnas.
  tablas(1, 'tabla sin la cantidad de filas es excelente', 'int t[][4] = {{5, 8, 1, 4}, {0, 2, 9, 6}, {3, 7, 4, 8}};', 'ok'),
  tablas(1, 'tabla en varios renglones sin la cantidad de filas', 'int t[][4] = {\n  {5, 8, 1, 4},\n  {0, 2, 9, 6},\n  {3, 7, 4, 8},\n};', 'ok'),
  tablas(1, 'tabla con sus dos dimensiones: las filas estan repetidas', 'int t[3][4] = {{5, 8, 1, 4}, {0, 2, 9, 6}, {3, 7, 4, 8}};', 'ok', [
    'FILAS_REPETIDAS',
  ]),
  tablas(1, 'tabla con constantes: tambien repetidas', '#define F 3\n#define C 4\nint t[F][C] = {{5, 8, 1, 4}, {0, 2, 9, 6}, {3, 7, 4, 8}};', 'ok', [
    'FILAS_REPETIDAS',
  ]),
  tablas(1, 'todo seguido: dos mejoras a la vez', 'int t[3][4] = {5, 8, 1, 4, 0, 2, 9, 6, 3, 7, 4, 8};', 'ok', [
    'FILAS_REPETIDAS',
    'TABLA_SIN_FILAS',
  ]),
  tablas(1, 'todo seguido sin la cantidad de filas', 'int t[][4] = {5, 8, 1, 4, 0, 2, 9, 6, 3, 7, 4, 8};', 'ok', [
    'TABLA_SIN_FILAS',
  ]),
  tablas(1, 'sin la cantidad de columnas', 'int t[3][] = {{5, 8, 1, 4}, {0, 2, 9, 6}, {3, 7, 4, 8}};', ['TABLA_SIN_COLUMNAS']),
  tablas(1, 'sin ninguna cantidad', 'int t[][] = {{5, 8, 1, 4}, {0, 2, 9, 6}, {3, 7, 4, 8}};', ['TABLA_SIN_COLUMNAS']),
  tablas(1, 'dimensiones al reves', 'int t[4][3] = {{5, 8, 1, 4}, {0, 2, 9, 6}, {3, 7, 4, 8}};', ['DIMENSIONES_AL_REVES']),
  tablas(1, 'cargada por columnas', 'int t[4][3] = {{5, 0, 3}, {8, 2, 7}, {1, 9, 4}, {4, 6, 8}};', ['TABLA_AL_REVES']),
  tablas(1, 'una fila de menos', 'int t[3][4] = {{5, 8, 1, 4}, {0, 2, 9, 6}};', ['FILAS_DE_MENOS']),
  tablas(1, 'una fila de mas', 'int t[4][4] = {{5, 8, 1, 4}, {0, 2, 9, 6}, {3, 7, 4, 8}, {1, 1, 1, 1}};', ['FILAS_DE_MAS']),
  tablas(1, 'una fila con un valor de menos', 'int t[3][4] = {{5, 8, 1, 4}, {0, 2, 9}, {3, 7, 4, 8}};', ['FILA_OTRA_CANTIDAD']),
  tablas(1, 'un valor distinto', 'int t[3][4] = {{5, 8, 1, 4}, {0, 2, 5, 6}, {3, 7, 4, 8}};', ['VALOR_DISTINTO']),
  tablas(1, 'todo seguido con un valor distinto', 'int t[3][4] = {5, 8, 1, 4, 0, 2, 5, 6, 3, 7, 4, 8};', ['VALOR_DISTINTO']),
  tablas(1, 'todo seguido con valores de menos', 'int t[3][4] = {5, 8, 1, 4, 0, 2, 9, 6};', ['VALORES_SIN_NOMBRAR']),
  tablas(1, 'todo seguido con valores de menos y las filas vacias', 'int t[][4] = {5, 8, 1, 4, 0, 2, 9, 6};', ['VALORES_DE_MENOS']),
  tablas(1, 'unas filas con llaves y otras no', 'int t[3][4] = {{5, 8, 1, 4}, 0, 2, 9, 6, {3, 7, 4, 8}};', ['TABLA_LLAVES_MEZCLADAS']),
  tablas(1, 'llaves de mas', 'int t[3][4] = {{{5, 8, 1, 4}}, {{0, 2, 9, 6}}, {{3, 7, 4, 8}}};', ['VALORES_ANIDADOS']),
  tablas(1, 'lugar de mas', 'int t[5][4] = {{5, 8, 1, 4}, {0, 2, 9, 6}, {3, 7, 4, 8}};', ['ARREGLO_GRANDE']),
  tablas(1, 'columnas de menos', 'int t[3][2] = {{5, 8, 1, 4}, {0, 2, 9, 6}, {3, 7, 4, 8}};', ['ARREGLO_CHICO']),
  tablas(1, 'una sola dimension', 'int t[12] = {5, 8, 1, 4, 0, 2, 9, 6, 3, 7, 4, 8};', ['TABLA_UNA_DIMENSION']),
  tablas(1, 'tres dimensiones', 'int t[1][3][4] = {{{5, 8, 1, 4}, {0, 2, 9, 6}, {3, 7, 4, 8}}};', ['TABLA_DIMENSIONES']),
  tablas(1, 'tabla sin valores', 'int t[3][4];', ['VALORES_FALTAN']),
  tablas(1, 'tabla con valores de a uno', 'int t[3][4];\nt[0][0] = 5;\nt[0][1] = 8;', ['VALORES_APARTE']),
  tablas(1, 'tabla con decimales donde van enteros', 'float t[3][4] = {{5, 8, 1, 4}, {0, 2, 9, 6}, {3, 7, 4, 8}};', ['VARIABLE_TIPO']),
  tablas(1, 'filas entre corchetes', 'int t[3][4] = {[5, 8, 1, 4], [0, 2, 9, 6], [3, 7, 4, 8]};', ['CORCHETES_EN_LA_LISTA']),
  tablas(1, 'filas entre parentesis', 'int t[3][4] = {(5, 8, 1, 4), (0, 2, 9, 6), (3, 7, 4, 8)};', ['FILAS_ENTRE_PARENTESIS']),

  // La cuadrada: 4 7 / 2 9. Ahi "al reves" no se nota en la forma, solo en los valores.
  tablas(2, 'cuadrada', 'int c[][2] = {{4, 7}, {2, 9}};', 'ok'),
  tablas(2, 'cuadrada con las filas repetidas', 'int c[2][2] = {{4, 7}, {2, 9}};', 'ok', ['FILAS_REPETIDAS']),
  tablas(2, 'cuadrada cargada por columnas', 'int c[2][2] = {{4, 2}, {7, 9}};', ['TABLA_AL_REVES']),
  tablas(2, 'cuadrada con un valor distinto', 'int c[2][2] = {{4, 7}, {2, 8}};', ['VALOR_DISTINTO']),

  // Todos en cero: {0} alcanza, y el 4 pasa a ser un numero que solo esta en
  // los corchetes. El dibujo no se muestra (dibujo: false).
  valores(4, 'cero con una constante es excelente', '#define TAM 4\nint lista[TAM] = {0};', 'ok'),
  valores(4, 'cero con el numero suelto', 'int lista[4] = {0};', 'ok', ['NUMERO_MAGICO']),
  valores(4, 'cero con el numero suelto habiendo una constante', '#define TAM 4\nint lista[4] = {0};', 'ok', [
    'CONSTANTE_SIN_REUTILIZAR',
  ]),
  valores(4, 'cuatro ceros: alcanza uno', 'int lista[4] = {0, 0, 0, 0};', 'ok', ['CERO_ALCANZA']),
  valores(4, 'cuatro ceros con una constante: alcanza uno', '#define TAM 4\nint lista[TAM] = {0, 0, 0, 0};', 'ok', [
    'CERO_ALCANZA',
  ]),
  // La lista no cubre los cuatro lugares: el 4 ya no se deduce de ella.
  valores(4, 'dos ceros: alcanza uno, y el 4 es un numero suelto', 'int lista[4] = {0, 0};', 'ok', [
    'CERO_ALCANZA',
    'NUMERO_MAGICO',
  ]),
  valores(4, 'cuatro ceros con los corchetes vacios', 'int lista[] = {0, 0, 0, 0};', 'ok', ['CERO_ALCANZA']),
  valores(4, 'un cero con los corchetes vacios', 'int lista[] = {0};', ['VALORES_DE_MENOS']),
  valores(4, 'un cero para dos lugares', 'int lista[2] = {0};', ['ARREGLO_CHICO']),
  valores(4, 'un cero para cinco lugares', 'int lista[5] = {0};', ['ARREGLO_GRANDE']),
  valores(4, 'cinco ceros para cuatro lugares', 'int lista[4] = {0, 0, 0, 0, 0};', ['ARREGLO_CHICO']),
  valores(4, 'lista vacia', 'int lista[4] = {};', ['LISTA_VACIA']),
  valores(4, 'un uno en vez del cero', 'int lista[4] = {1};', ['VALOR_DISTINTO']),

  // Todos en dos: {2} no llena de dos. Lo que la lista no nombra queda en cero.
  valores(5, 'cuatro dos con los corchetes vacios', 'int dos[] = {2, 2, 2, 2};', 'ok'),
  valores(5, 'cuatro dos con la cantidad repetida', 'int dos[4] = {2, 2, 2, 2};', 'ok', ['DIMENSION_REPETIDA']),
  valores(5, 'cuatro dos con la constante repetida', '#define N 4\nint dos[N] = {2, 2, 2, 2};', 'ok', [
    'DIMENSION_REPETIDA',
  ]),
  valores(5, 'un solo dos: no repite', 'int dos[4] = {2};', ['VALORES_SIN_NOMBRAR']),
  valores(5, 'un solo dos con la constante', '#define N 4\nint dos[N] = {2};', ['VALORES_SIN_NOMBRAR']),
  // La consigna anterior no se arrastra: usar el mismo nombre es lo natural.
  {
    serie: 'arreglos-valores',
    paso: 5,
    nombre: 'el mismo nombre que en la consigna anterior no choca',
    previas: [null, null, null, '#define TAM 4\nint lista[TAM] = {0};'],
    respuesta: 'int lista[] = {2, 2, 2, 2};',
    espera: 'ok',
    mejoras: [],
  },
  {
    serie: 'arreglos-valores',
    paso: 5,
    nombre: 'una constante de la consigna anterior no esta: no se puede usar',
    previas: [null, null, null, '#define TAM 4\nint lista[TAM] = {0};'],
    respuesta: 'int dos[TAM] = {2, 2, 2, 2};',
    espera: ['CONSTANTE_SIN_DEFINIR'],
  },
  valores(5, 'dos dos: tampoco', 'int dos[4] = {2, 2};', ['VALORES_SIN_NOMBRAR']),
  valores(5, 'un solo dos con los corchetes vacios', 'int dos[] = {2};', ['VALORES_DE_MENOS']),
  valores(5, 'cero donde van doses', 'int dos[4] = {0};', ['VALOR_DISTINTO']),
  valores(5, 'cinco doses para cuatro lugares', 'int dos[4] = {2, 2, 2, 2, 2};', ['ARREGLO_CHICO']),

  // Ceros al final: {5, 1} con cuatro lugares es el mismo arreglo que {5, 1, 0, 0}.
  valores(6, 'todos los valores escritos', 'int c[] = {5, 1, 0, 0};', 'ok'),
  valores(6, 'ceros al final sin escribir, con una constante', '#define N 4\nint c[N] = {5, 1};', 'ok'),
  valores(6, 'ceros al final sin escribir, con el numero', 'int c[4] = {5, 1};', 'ok', ['NUMERO_MAGICO']),
  valores(6, 'con el numero habiendo una constante en la respuesta', '#define N 4\nint c[4] = {5, 1};', 'ok', [
    'CONSTANTE_SIN_REUTILIZAR',
  ]),
  valores(6, 'ceros al final escritos con la cantidad repetida', 'int c[4] = {5, 1, 0, 0};', 'ok', [
    'DIMENSION_REPETIDA',
  ]),
  valores(6, 'ceros al final sin escribir, con los corchetes vacios', 'int c[] = {5, 1};', ['VALORES_DE_MENOS']),
  valores(6, 'falta el uno', 'int c[4] = {5};', ['VALORES_SIN_NOMBRAR']),

  // Una tabla en cero: 3 filas por 4 columnas. Con {0} los numeros de los
  // corchetes son lo unico que dice la forma: hay que darles nombre.
  tablas(3, 'cero con constantes es excelente', '#define FILAS 3\n#define COLUMNAS 4\nint t[FILAS][COLUMNAS] = {0};', 'ok'),
  tablas(3, 'cero con los numeros sueltos', 'int t[3][4] = {0};', 'ok', ['NUMERO_MAGICO']),
  tablas(3, 'una fila en cero y el resto sin escribir', 'int t[3][4] = {{0}};', 'ok', ['NUMERO_MAGICO']),
  tablas(3, 'una fila por fila, con un cero cada una', 'int t[][4] = {{0}, {0}, {0}};', 'ok', [
    'CERO_ALCANZA',
    'NUMERO_MAGICO',
  ]),
  tablas(3, 'todos los ceros escritos en filas', 'int t[3][4] = {{0, 0, 0, 0}, {0, 0, 0, 0}, {0, 0, 0, 0}};', 'ok', [
    'CERO_ALCANZA',
  ]),
  tablas(3, 'una fila de ceros seguidos', 'int t[3][4] = {0, 0, 0, 0};', 'ok', [
    'CERO_ALCANZA',
    'NUMERO_MAGICO',
  ]),
  tablas(3, 'un cero con las filas vacias: es una sola fila', 'int t[][4] = {0};', ['ARREGLO_CHICO']),
  tablas(3, 'un uno en vez del cero', 'int t[3][4] = {1};', ['VALOR_DISTINTO']),
  tablas(3, 'lugar de menos', 'int t[2][4] = {0};', ['ARREGLO_CHICO']),
  tablas(3, 'dimensiones al reves', 'int t[4][3] = {0};', ['DIMENSIONES_AL_REVES']),
  tablas(3, 'lista vacia', 'int t[3][4] = {};', ['LISTA_VACIA']),
  tablas(3, 'una fila con un valor de mas', 'int t[3][4] = {{0, 0, 0, 0, 0}};', ['FILA_OTRA_CANTIDAD']),
  tablas(3, 'una fila de mas', 'int t[3][4] = {{0}, {0}, {0}, {0}};', ['FILAS_DE_MAS']),

  // Ceros que no se escriben en una tabla con valores: 5 8 0 0 / 1 0 0 0 / 0 0 0 0.
  tablas(4, 'solo lo que no es cero, con constantes', 'int u[FILAS][COLUMNAS] = {{5, 8}, {1}};', 'ok'),
  tablas(4, 'los ceros de las filas escritos', 'int u[FILAS][COLUMNAS] = {{5, 8, 0, 0}, {1}};', 'ok'),
  tablas(4, 'todas las filas escritas: las filas estan repetidas', 'int u[FILAS][COLUMNAS] = {{5, 8, 0, 0}, {1, 0, 0, 0}, {0, 0, 0, 0}};', 'ok', [
    'FILAS_REPETIDAS',
  ]),
  tablas(4, 'con los numeros habiendo constantes', 'int u[3][4] = {{5, 8}, {1}};', 'ok', ['CONSTANTE_SIN_REUTILIZAR']),
  tablas(4, 'seguidos hasta el ultimo distinto de cero', 'int u[FILAS][COLUMNAS] = {5, 8, 0, 0, 1};', 'ok', [
    'TABLA_SIN_FILAS',
  ]),
  tablas(4, 'una fila que se queda corta', 'int u[FILAS][COLUMNAS] = {{5}, {1}};', ['FILA_OTRA_CANTIDAD']),
  tablas(4, 'seguidos que se quedan cortos', 'int u[FILAS][COLUMNAS] = {5, 8};', ['VALORES_SIN_NOMBRAR']),
  tablas(4, 'una fila que falta y no es de ceros', 'int u[FILAS][COLUMNAS] = {{5, 8}};', ['FILAS_DE_MENOS']),

  // La 9 continua la 8: ve su codigo, y por eso no se puede repetir un nombre.
  tablas(4, 'la variable de la consigna anterior otra vez', 'int tablaCeros[FILAS][COLUMNAS] = {{5, 8}, {1}};', [
    'VARIABLE_REDEFINIDA',
  ]),
  tablas(4, 'la constante con otro valor', '#define FILAS 5\nint u[FILAS][COLUMNAS] = {{5, 8}, {1}};', [
    'CONSTANTE_REDEFINIDA',
  ]),
  tablas(4, 'la constante con el mismo valor: mejorable', '#define FILAS 3\nint u[FILAS][COLUMNAS] = {{5, 8}, {1}};', 'ok', [
    'CONSTANTE_REPETIDA',
  ]),
  tablas(4, 'la constante con el mismo valor y parentesis', '#define FILAS (3)\nint u[FILAS][COLUMNAS] = {{5, 8}, {1}};', 'ok', [
    'CONSTANTE_REPETIDA',
  ]),

  // 7: cuestionario, lo que la lista no nombra
  valores(7, 'resto: queda en cero', '2', 'ok'),
  valores(7, 'resto: repite el ultimo', '0', ['OPCION_REPITE_EL_ULTIMO']),
  valores(7, 'resto: no se puede saber', '1', ['OPCION_SIN_VALOR_CON_LISTA']),
];

// Repetir un nombre: en la misma respuesta, o en el codigo que la consigna
// recibe (la serie de estructuras continua toda).
const CASOS_DE_NOMBRES = [
  { paso: 2, nombre: 'dos variables con el mismo nombre', respuesta: 'struct Puesto a;\nstruct Puesto a;', espera: ['VARIABLE_REDEFINIDA'] },
  { paso: 4, nombre: 'el nombre de la variable de mas arriba', respuesta: 'TPuesto unPuesto;', espera: ['VARIABLE_REDEFINIDA'] },
  { paso: 4, nombre: 'otro nombre', respuesta: 'TPuesto otro;', espera: 'ok' },
  {
    serie: 'arreglos-declarar',
    paso: 1,
    nombre: 'dos constantes con otro valor en la misma respuesta',
    respuesta: '#define MAX 20\n#define MAX 30\nint notas[MAX];',
    espera: ['CONSTANTE_REDEFINIDA'],
  },
];

export const CASOS = [
  ...CASOS_DE_NOMBRES,
  ...CASOS_DE_VALORES,
  ...CASOS_DE_ARREGLOS,
  ...CASOS_DE_POSICIONES,
  ...CASOS_DE_RECORRER,
  ...CASOS_DE_CADENAS,
  ...CASOS_DE_CADENAS_NUEVAS,
  // ---- 1: declarar la estructura ----
  {
    nombre: 'otro nombre, otras dimensiones, otro orden, double y unsigned',
    paso: 1,
    respuesta: `struct Local
{
    int unsigned cantidadVentas;
    double montoRecaudado;
    char titular[100], nombreFantasia[64];
};`,
    espera: 'ok',
  },
  { nombre: 'typedef sin etiqueta', paso: 1, respuesta: TYPEDEF_SIN_ETIQUETA, espera: 'ok' },
  {
    nombre: 'todo en un renglon',
    paso: 1,
    respuesta: 'struct P{char nombreFantasia[9];char titular[9];float montoRecaudado;int cantidadVentas;};',
    espera: 'ok',
  },
  {
    nombre: 'dimension con una constante',
    paso: 1,
    respuesta: '#define MAX 40\n' + campos('char nombreFantasia[MAX];\nchar titular[MAX];\nfloat montoRecaudado;\nlong cantidadVentas;'),
    espera: 'ok',
    mejoras: [],
  },
  {
    nombre: 'dimension con una constante que nadie definio',
    paso: 1,
    respuesta: campos('char nombreFantasia[MAX];\nchar titular[MAX];\nfloat montoRecaudado;\nlong cantidadVentas;'),
    espera: ['CONSTANTE_SIN_DEFINIR'],
  },
  {
    nombre: 'un numero suelto no se marca si la serie no pide la practica',
    paso: 1,
    respuesta: campos('char nombreFantasia[20];\nchar titular[20];\nfloat montoRecaudado;\nint cantidadVentas;'),
    espera: 'ok',
    mejoras: [],
  },
  {
    nombre: 'un campo de mas avisa pero vale',
    paso: 1,
    respuesta: campos('char nombreFantasia[20];\nchar titular[20];\nfloat montoRecaudado;\nint cantidadVentas;\nint numero;'),
    espera: 'ok',
    avisos: ['CAMPO_DE_MAS'],
  },
  {
    nombre: 'falta un campo',
    paso: 1,
    respuesta: campos('char nombreFantasia[20];\nfloat montoRecaudado;\nint cantidadVentas;'),
    espera: ['CAMPO_FALTA'],
  },
  {
    nombre: 'campo con mayuscula',
    paso: 1,
    respuesta: campos('char nombreFantasia[20];\nchar Titular[20];\nfloat montoRecaudado;\nint cantidadVentas;'),
    espera: ['CAMPO_NOMBRE'],
  },
  {
    nombre: 'campo mal tipeado',
    paso: 1,
    respuesta: campos('char nombreFantasia[20];\nchar titular[20];\nfloat montoRecaudo;\nint cantidadVentas;'),
    espera: ['CAMPO_NOMBRE'],
  },
  {
    nombre: 'cadena sin corchetes',
    paso: 1,
    respuesta: campos('char nombreFantasia[20];\nchar titular;\nfloat montoRecaudado;\nint cantidadVentas;'),
    espera: ['CAMPO_CADENA_SIN_DIMENSION'],
  },
  {
    nombre: 'cadena como puntero',
    paso: 1,
    respuesta: campos('char nombreFantasia[20];\nchar *titular;\nfloat montoRecaudado;\nint cantidadVentas;'),
    espera: ['CAMPO_CADENA_PUNTERO'],
  },
  {
    nombre: 'cadena de un solo lugar',
    paso: 1,
    respuesta: campos('char nombreFantasia[1];\nchar titular[20];\nfloat montoRecaudado;\nint cantidadVentas;'),
    espera: ['CAMPO_CADENA_CORTA'],
  },
  {
    nombre: 'monto entero y cantidad con decimales',
    paso: 1,
    respuesta: campos('char nombreFantasia[20];\nchar titular[20];\nint montoRecaudado;\nfloat cantidadVentas;'),
    espera: ['CAMPO_TIPO'],
  },
  {
    nombre: 'numero con corchetes',
    paso: 1,
    respuesta: campos('char nombreFantasia[20];\nchar titular[20];\nfloat montoRecaudado[10];\nint cantidadVentas;'),
    espera: ['CAMPO_ES_ARREGLO'],
  },
  {
    nombre: 'string no existe',
    paso: 1,
    respuesta: campos('string nombreFantasia;\nchar titular[20];\nfloat montoRecaudado;\nint cantidadVentas;'),
    espera: ['TIPO_DESCONOCIDO'],
  },
  {
    nombre: 'estructura sin nombre',
    paso: 1,
    respuesta: 'struct {\nchar nombreFantasia[20];\nchar titular[20];\nfloat montoRecaudado;\nint cantidadVentas;\n};',
    espera: ['STRUCT_SIN_NOMBRE'],
  },
  {
    nombre: 'sin el ; del final',
    paso: 1,
    respuesta: 'struct Puesto {\n  char nombreFantasia[20];\n  char titular[20];\n  float montoRecaudado;\n  int cantidadVentas;\n}',
    espera: ['FALTA_PUNTO_Y_COMA'],
  },
  {
    nombre: 'sin el ; de un campo',
    paso: 1,
    respuesta: campos('char nombreFantasia[20];\nchar titular[20]\nfloat montoRecaudado;\nint cantidadVentas;'),
    espera: ['FALTA_PUNTO_Y_COMA'],
  },
  {
    nombre: 'sin la llave de cierre',
    paso: 1,
    respuesta: 'struct Puesto {\n  char nombreFantasia[20];\n  char titular[20];\n  float montoRecaudado;\n  int cantidadVentas;\n;',
    espera: ['FALTA_LLAVE'],
  },
  {
    nombre: 'Struct con mayuscula',
    paso: 1,
    respuesta: 'Struct Puesto {\nchar nombreFantasia[20];\nchar titular[20];\nfloat montoRecaudado;\nint cantidadVentas;\n};',
    espera: ['PALABRA_CON_MAYUSCULA'],
  },
  {
    nombre: 'struc mal tipeado',
    paso: 1,
    respuesta: 'struc Puesto {\nchar nombreFantasia[20];\nchar titular[20];\nfloat montoRecaudado;\nint cantidadVentas;\n};',
    espera: ['PALABRA_MAL_ESCRITA'],
  },
  {
    nombre: 'tipo con mayuscula',
    paso: 1,
    respuesta: campos('char nombreFantasia[20];\nchar titular[20];\nFloat montoRecaudado;\nint cantidadVentas;'),
    espera: ['TIPO_DESCONOCIDO'],
  },
  {
    nombre: 'campos separados con comas',
    paso: 1,
    respuesta: campos('char nombreFantasia[20],\nchar titular[20],\nfloat montoRecaudado,\nint cantidadVentas'),
    espera: ['COMA_POR_PUNTO_Y_COMA'],
  },
  {
    nombre: 'corchetes pegados al tipo',
    paso: 1,
    respuesta: campos('char[20] nombreFantasia;\nchar titular[20];\nfloat montoRecaudado;\nint cantidadVentas;'),
    espera: ['CORCHETES_ANTES_DEL_NOMBRE'],
  },
  {
    nombre: 'parentesis en vez de llaves',
    paso: 1,
    respuesta: 'struct Puesto (\nchar nombreFantasia[20];\nchar titular[20];\nfloat montoRecaudado;\nint cantidadVentas;\n);',
    espera: ['PARENTESIS_POR_LLAVES'],
  },
  {
    nombre: 'campo con valor',
    paso: 1,
    respuesta: campos('char nombreFantasia[20];\nchar titular[20];\nfloat montoRecaudado = 0;\nint cantidadVentas;'),
    espera: ['VALOR_EN_CAMPO'],
  },
  {
    nombre: 'corchete sin cerrar',
    paso: 1,
    respuesta: campos('char nombreFantasia[20;\nchar titular[20];\nfloat montoRecaudado;\nint cantidadVentas;'),
    espera: ['FALTA_CORCHETE'],
  },
  { nombre: 'llave de mas', paso: 2, respuesta: 'struct Puesto p;\n}', espera: ['SOBRA_LLAVE'] },
  { nombre: 'typedef al reves', paso: 3, respuesta: 'typedef PuestoT struct Puesto;', espera: ['TYPEDEF_AL_REVES'] },
  { nombre: 'comentarios alrededor', paso: 2, respuesta: '// la variable { [\nstruct Puesto p; /* listo */', espera: 'ok' },
  { nombre: 'nada escrito', paso: 1, respuesta: '   \n', espera: ['VACIO'] },
  { nombre: 'una variable no es una estructura', paso: 1, respuesta: 'int puesto;', espera: ['STRUCT_FALTA'] },

  // ---- 2: una variable de la estructura ----
  { nombre: 'variable con struct', paso: 2, respuesta: 'struct Puesto p;', espera: 'ok' },
  {
    nombre: 'variable inicializada',
    paso: 2,
    respuesta: 'struct Puesto p = {"La Feria", "Perez Ana", 1500.5, 12};',
    espera: 'ok',
  },
  {
    // La variable es local: el main no se escribe (lo pone la herramienta).
    nombre: 'variable dentro de main',
    paso: 2,
    respuesta: 'int main() {\n  struct Puesto p;\n  return 0;\n}',
    espera: ['MAIN_DE_MAS'],
  },
  {
    nombre: 'con typedef sin etiqueta, la variable usa el alias',
    paso: 2,
    previas: [TYPEDEF_SIN_ETIQUETA],
    respuesta: 'Puesto p;',
    espera: 'ok',
  },
  {
    nombre: 'con typedef sin etiqueta, struct Puesto no existe',
    paso: 2,
    previas: [TYPEDEF_SIN_ETIQUETA],
    respuesta: 'struct Puesto p;',
    espera: ['TIPO_DESCONOCIDO'],
  },
  { nombre: 'sin la palabra struct', paso: 2, respuesta: 'Puesto p;', espera: ['TIPO_DESCONOCIDO'] },
  { nombre: 'etiqueta en minuscula', paso: 2, respuesta: 'struct puesto p;', espera: ['TIPO_DESCONOCIDO'] },
  { nombre: 'puntero en vez de variable', paso: 2, respuesta: 'struct Puesto *p;', espera: ['VARIABLE_PUNTERO'] },
  { nombre: 'arreglo en vez de variable', paso: 2, respuesta: 'struct Puesto p[10];', espera: ['VARIABLE_ARREGLO'] },
  { nombre: 'variable de otro tipo', paso: 2, respuesta: 'int p;', espera: ['VARIABLE_TIPO'] },
  { nombre: 'variable sin ;', paso: 2, respuesta: 'struct Puesto p', espera: ['FALTA_PUNTO_Y_COMA'] },
  { nombre: 'un alias no es una variable', paso: 2, respuesta: 'typedef struct Puesto P;', espera: ['VARIABLE_FALTA'] },
  {
    nombre: 'vuelve a escribir la estructura',
    paso: 2,
    respuesta: campos('char nombreFantasia[20];\nchar titular[20];\nfloat montoRecaudado;\nint cantidadVentas;') + '\nstruct Puesto p;',
    espera: ['STRUCT_REDEFINIDA'],
  },

  // ---- 3: un alias ----
  { nombre: 'alias', paso: 3, respuesta: 'typedef struct Puesto PuestoT;', espera: 'ok' },
  { nombre: 'alias con el mismo nombre que la etiqueta', paso: 3, respuesta: 'typedef struct Puesto Puesto;', espera: 'ok' },
  {
    nombre: 'alias de un alias',
    paso: 3,
    previas: [TYPEDEF_SIN_ETIQUETA, 'Puesto p;'],
    respuesta: 'typedef Puesto Local;',
    espera: 'ok',
  },
  { nombre: 'sin typedef es una variable', paso: 3, respuesta: 'struct Puesto PuestoT;', espera: ['ALIAS_FALTA'] },
  { nombre: 'alias de puntero', paso: 3, respuesta: 'typedef struct Puesto *PPuesto;', espera: ['ALIAS_PUNTERO'] },
  { nombre: 'alias de otro tipo', paso: 3, respuesta: 'typedef int PuestoT;', espera: ['ALIAS_TIPO'] },
  { nombre: 'alias sin ;', paso: 3, respuesta: 'typedef struct Puesto PuestoT', espera: ['FALTA_PUNTO_Y_COMA'] },

  // ---- 4: una variable con el alias ----
  { nombre: 'variable con el alias', paso: 4, respuesta: 'TPuesto p;', espera: 'ok' },
  {
    nombre: 'variable con el alias que eligio el alumno',
    paso: 4,
    previas: [null, null, 'typedef struct Puesto Negocio;'],
    respuesta: 'Negocio n;',
    espera: 'ok',
  },
  { nombre: 'variable con struct cuando se pide el alias', paso: 4, respuesta: 'struct Puesto p;', espera: ['VARIABLE_SIN_ALIAS'] },
  { nombre: 'alias en minuscula', paso: 4, respuesta: 'tpuesto p;', espera: ['TIPO_DESCONOCIDO'] },
];
