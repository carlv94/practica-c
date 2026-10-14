// Casos de prueba del corrector.
//
//   serie:     el id de la serie (si falta, "estructuras")
//   paso:      a que consigna de la serie responde (1 = la primera)
//   respuesta: lo que escribe el alumno
//   espera:    'ok', o la lista de codigos de error que tienen que salir
//   avisos:    codigos de aviso que tienen que salir (no hacen fallar la respuesta)
//   sinAvisos: true si no tiene que salir ningun aviso (por ejemplo, "no pude
//              seguir este codigo" cuando ya hay un error)
//   mejoras:   si esta, los codigos de mejora que tienen que salir, justo esos
//              ([] = la respuesta es excelente)
//   previas:   respuestas a las consignas anteriores, si no son las de referencia
//
// Sumar un caso cada vez que un alumno escriba algo que el corrector entienda mal.

import { CASOS_DE_CADENAS_NUEVAS } from './casos-cadenas.js';
import {
  CASOS_DE_LEER_CAMPOS,
  CASOS_DE_COPIAR,
  CASOS_DE_ARREGLO_DE_ESTRUCTURAS,
  CASOS_DE_RECORRER_ESTRUCTURAS,
  CASOS_DE_ARREGLO_SIN_INDICE,
} from './casos-estructuras.js';

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

  cadenas(2, 'strcat', 'strcat(cadena1, cadena2);', 'ok'),
  cadenas(2, 'la alternativa, con su argumento de mas', 'strncat(cadena1, cadena2, 10);', 'ok'),
  cadenas(2, 'la alternativa sin argumentos suficientes', 'strncat(cadena1);', ['ARGUMENTOS_CANTIDAD']),
  cadenas(2, 'strcat al reves', 'strcat(cadena2, cadena1);', ['ARGUMENTOS_EN_OTRO_ORDEN']),
  cadenas(2, 'strcat con un argumento de mas', 'strcat(cadena1, cadena2, 20);', ['ARGUMENTOS_CANTIDAD']),
  cadenas(2, 'la funcion del paso anterior', 'strcpy(cadena1, cadena2);', ['FUNCION_EQUIVOCADA']),
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
    ...recorrer(1, 'algo que no se sabe seguir: queda sin comprobar', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  notas[i] = 0;\n  putchar(notas[i]);\n}'),
    sinVerificar: true,
  },

  // 2: cada posicion con su numero
  recorrer(2, 'el indice', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  alumnos[i] = i;\n}'),
  recorrer(2, 'sumando uno cada vez', 'int numero = 0;\nfor (i = 0; i < MAX_ALUMNOS; i++) {\n  alumnos[i] = numero;\n  numero++;\n}'),
  recorrer(2, 'contando desde uno', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  alumnos[i] = i + 1;\n}', ['RESULTADO_VALOR_DISTINTO']),
  recorrer(2, 'siempre cero', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  alumnos[i] = 0;\n}', ['RESULTADO_VALOR_DISTINTO']),

  // 3: cuestionario, que queda en una posicion
  recorrer(3, 'queda el doble: la correcta', '2'),
  recorrer(3, 'queda el doble: el indice', '0', ['OPCION_EL_INDICE_ES_EL_VALOR']),
  recorrer(3, 'queda el doble: el ultimo valor', '1', ['OPCION_ULTIMA_VUELTA']),

  // 4: el cuadrado
  recorrer(4, 'el indice por el indice', 'for (i = 0; i < CANTIDAD; i++) {\n  cuadrados[i] = i * i;\n}'),
  recorrer(4, 'con la cuenta al reves', 'for (i = CANTIDAD - 1; i >= 0; i--) {\n  cuadrados[i] = i * i;\n}'),
  {
    ...recorrer(4, 'con pow y la biblioteca: correcto, con la nota', '#include <math.h>\nfor (i = 0; i < CANTIDAD; i++) {\n  cuadrados[i] = pow(i, 2);\n}'),
    notas: ['USO_DE_POW'],
    dice: ['Su respuesta es correcta', '`pow` trabaja con decimales'],
  },
  {
    ...recorrer(4, 'con pow sin la biblioteca', 'for (i = 0; i < CANTIDAD; i++) {\n  cuadrados[i] = pow(i, 2);\n}', ['INCLUDE_FALTA_PARA_FUNCION']),
    dice: ['`pow`', '`math.h`', '`#include <math.h>`'],
  },
  recorrer(4, 'con la biblioteca de mas y sin pow', '#include <math.h>\nfor (i = 0; i < CANTIDAD; i++) {\n  cuadrados[i] = i * i;\n}'),
  recorrer(4, 'con pow y un exponente equivocado', '#include <math.h>\nfor (i = 0; i < CANTIDAD; i++) {\n  cuadrados[i] = pow(i, 3);\n}', ['RESULTADO_VALOR_DISTINTO']),
  recorrer(4, 'el doble', 'for (i = 0; i < CANTIDAD; i++) {\n  cuadrados[i] = i * 2;\n}', ['RESULTADO_VALOR_DISTINTO']),
  recorrer(4, 'el cuadrado de la posicion que sigue', 'for (i = 0; i < CANTIDAD; i++) {\n  cuadrados[i] = (i + 1) * (i + 1);\n}', ['RESULTADO_VALOR_DISTINTO']),

  // 5: cuestionario, donde queda el indice
  recorrer(5, 'indice final: cinco', '2'),
  recorrer(5, 'indice final: cuatro', '0', ['OPCION_ULTIMA_VUELTA']),
  recorrer(5, 'indice final: no se puede saber', '1', ['OPCION_INDICE_SOLO_EN_EL_CICLO']),

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

// Leer y mostrar un arreglo: se corrige ejecutando con datos de prueba.
const leer = (paso, nombre, respuesta, espera = 'ok', mejoras = []) => ({
  serie: 'arreglos-leer',
  paso,
  nombre,
  respuesta,
  espera,
  mejoras,
});

const CASOS_DE_LEER = [
  // 1: leer una nota
  leer(1, 'scanf con el ampersand', 'scanf("%d", &notas[0]);'),
  leer(1, 'con %i', 'scanf("%i", &notas[0]);'),
  leer(1, 'sin el ampersand', 'scanf("%d", notas[0]);', ['AMPERSAND_FALTA']),
  leer(1, 'con el arreglo entero', 'scanf("%d", &notas);', ['ARREGLO_SIN_POSICION']),
  leer(1, 'con el formato de un decimal', 'scanf("%f", &notas[0]);', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  leer(1, 'en otra posicion', 'scanf("%d", &notas[1]);', ['RESULTADO_POSICION_SIN_VALOR']),
  leer(1, 'la nota escrita en el programa', 'notas[0] = 8;', ['LECTURA_FALTA']),
  leer(1, 'una posicion que no existe', 'scanf("%d", &notas[5]);', ['INDICE_FUERA_DE_RANGO']),
  leer(1, 'dos conversiones y una sola posicion', 'scanf("%d %d", &notas[0]);', ['FORMATO_CANTIDAD_DISTINTA']),
  {
    ...leer(1, 'el ampersand que falta dice por que', 'scanf("%d", notas[0]);', ['AMPERSAND_FALTA']),
    dice: ['A `notas[0]` le falta el `&` adelante'],
  },

  // 2: mostrar una nota
  leer(2, 'printf con la posicion', 'printf("%d\\n", notas[2]);'),
  leer(2, 'con un texto antes', 'printf("La nota es %d\\n", notas[2]);'),
  leer(2, 'en dos printf', 'printf("La nota es ");\nprintf("%d", notas[2]);'),
  {
    ...leer(2, 'otra posicion: dice de cual salio', 'printf("%d\\n", notas[3]);', ['MUESTRA_DISTINTA']),
    dice: ['muestra `6`', 'la posición 3 de `notas`'],
  },
  {
    ...leer(2, 'una posicion que no existe: dice cuales hay', 'printf("%d\\n", notas[6]);', ['INDICE_FUERA_DE_RANGO']),
    dice: ['`notas` tiene 5 posiciones, numeradas de 0 a 4', 'la posición 6 no existe'],
  },
  leer(2, 'el numero escrito en el programa', 'printf("%d\\n", 9);', ['MUESTRA_SIN_EL_ARREGLO']),
  leer(2, 'sin mostrar nada', 'int nota = notas[2];', ['MUESTRA_FALTA']),
  leer(2, 'con el ampersand', 'printf("%d\\n", &notas[2]);', ['AMPERSAND_DE_MAS']),
  leer(2, 'con el arreglo entero', 'printf("%d\\n", notas);', ['ARREGLO_SIN_POSICION']),
  leer(2, 'con el formato de un decimal', 'printf("%f\\n", notas[2]);', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  leer(2, 'sin el formato', 'printf("notas[2]");', ['MUESTRA_FALTA']),
  leer(2, 'un formato y ningun valor', 'printf("%d\\n");', ['FORMATO_CANTIDAD_DISTINTA']),

  // 3: cuestionario, siempre la misma posicion
  leer(3, 'la misma posicion: el ultimo', '2'),
  leer(3, 'la misma posicion: el primero', '0', ['OPCION_PRIMERA_LECTURA']),
  leer(3, 'la misma posicion: la suma', '1', ['OPCION_SUMA_DE_LAS_LECTURAS']),

  // 4: cargar las notas
  leer(4, 'un for', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  scanf("%d", &notas[i]);\n}'),
  leer(4, 'un while', 'i = 0;\nwhile (i < MAX_ALUMNOS) {\n  scanf("%d", &notas[i]);\n  i++;\n}'),
  leer(4, 'sin llaves', 'for (i = 0; i < MAX_ALUMNOS; i++)\n  scanf("%d", &notas[i]);'),
  leer(4, 'con el numero suelto: correcto y mejorable', 'for (i = 0; i < 20; i++) {\n  scanf("%d", &notas[i]);\n}', 'ok', ['LIMITE_CON_NUMERO_SUELTO']),
  leer(4, 'sin ciclo', 'scanf("%d", &notas[0]);', ['CICLO_FALTA']),
  leer(4, 'sin el ampersand', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  scanf("%d", notas[i]);\n}', ['AMPERSAND_FALTA']),
  leer(4, 'siempre en la misma posicion', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  scanf("%d", &notas[0]);\n}', ['RESULTADO_VALOR_DISTINTO']),
  leer(4, 'una vuelta de mas', 'for (i = 0; i <= MAX_ALUMNOS; i++) {\n  scanf("%d", &notas[i]);\n}', ['INDICE_FUERA_DE_RANGO']),
  leer(4, 'sin llegar a la ultima', 'for (i = 0; i < MAX_ALUMNOS - 1; i++) {\n  scanf("%d", &notas[i]);\n}', ['RESULTADO_POSICION_SIN_VALOR']),
  leer(4, 'leyendo en el indice', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  scanf("%d", &i);\n}', ['LECTURA_DE_MAS']),

  // 5: mostrar todas
  leer(5, 'un for', 'for (i = 0; i < CANTIDAD; i++) {\n  printf("%d\\n", notas[i]);\n}'),
  leer(5, 'en una linea, con espacios', 'for (i = 0; i < CANTIDAD; i++) {\n  printf("%d ", notas[i]);\n}'),
  leer(5, 'con el numero de cada una', 'for (i = 0; i < CANTIDAD; i++) {\n  printf("Alumno %d: %d\\n", i + 1, notas[i]);\n}'),
  leer(5, 'sin ciclo', 'printf("%d", notas[0]);', ['CICLO_FALTA']),
  leer(5, 'sin llegar a la ultima', 'for (i = 0; i < CANTIDAD - 1; i++) {\n  printf("%d\\n", notas[i]);\n}', ['MUESTRA_DISTINTA']),
  leer(5, 'de atras', 'for (i = CANTIDAD - 1; i >= 0; i--) {\n  printf("%d\\n", notas[i]);\n}', ['MUESTRA_DISTINTA']),
  leer(5, 'con el arreglo entero', 'for (i = 0; i < CANTIDAD; i++) {\n  printf("%d\\n", notas);\n}', ['ARREGLO_SIN_POSICION']),
  leer(5, 'el indice en lugar de la nota', 'for (i = 0; i < CANTIDAD; i++) {\n  printf("%d\\n", i);\n}', ['MUESTRA_SIN_EL_ARREGLO']),
  leer(5, 'una vuelta de mas', 'for (i = 0; i <= CANTIDAD; i++) {\n  printf("%d\\n", notas[i]);\n}', ['INDICE_FUERA_DE_RANGO']),

  // 6: temperaturas
  leer(6, 'dos ciclos', 'for (i = 0; i < CANTIDAD; i++) {\n  scanf("%f", &temperaturas[i]);\n}\nfor (i = 0; i < CANTIDAD; i++) {\n  printf("%f\\n", temperaturas[i]);\n}'),
  leer(6, 'un solo ciclo', 'for (i = 0; i < CANTIDAD; i++) {\n  scanf("%f", &temperaturas[i]);\n  printf("%.2f\\n", temperaturas[i]);\n}'),
  leer(6, 'leer con %d', 'for (i = 0; i < CANTIDAD; i++) {\n  scanf("%d", &temperaturas[i]);\n}\nfor (i = 0; i < CANTIDAD; i++) {\n  printf("%f\\n", temperaturas[i]);\n}', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  leer(6, 'mostrar con %d', 'for (i = 0; i < CANTIDAD; i++) {\n  scanf("%f", &temperaturas[i]);\n}\nfor (i = 0; i < CANTIDAD; i++) {\n  printf("%d\\n", temperaturas[i]);\n}', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  leer(6, 'leer con %lf un float', 'for (i = 0; i < CANTIDAD; i++) {\n  scanf("%lf", &temperaturas[i]);\n}\nfor (i = 0; i < CANTIDAD; i++) {\n  printf("%f\\n", temperaturas[i]);\n}', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  leer(6, 'sin mostrar', 'for (i = 0; i < CANTIDAD; i++) {\n  scanf("%f", &temperaturas[i]);\n}', ['MUESTRA_FALTA']),
  {
    ...leer(6, 'el formato dice cual corresponde', 'for (i = 0; i < CANTIDAD; i++) {\n  scanf("%d", &temperaturas[i]);\n}\nfor (i = 0; i < CANTIDAD; i++) {\n  printf("%f\\n", temperaturas[i]);\n}', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
    dice: ['`%d`', '`temperaturas[i]`', '`float`', '`%f`'],
  },

  // 7: de atras
  leer(7, 'leer y mostrar al reves', 'for (i = 0; i < CANTIDAD; i++) {\n  scanf("%d", &ventas[i]);\n}\nfor (i = CANTIDAD - 1; i >= 0; i--) {\n  printf("%d\\n", ventas[i]);\n}'),
  leer(7, 'mostrar en el mismo orden', 'for (i = 0; i < CANTIDAD; i++) {\n  scanf("%d", &ventas[i]);\n}\nfor (i = 0; i < CANTIDAD; i++) {\n  printf("%d\\n", ventas[i]);\n}', ['MUESTRA_DISTINTA']),
  leer(7, 'leer al reves tambien', 'for (i = CANTIDAD - 1; i >= 0; i--) {\n  scanf("%d", &ventas[i]);\n}\nfor (i = CANTIDAD - 1; i >= 0; i--) {\n  printf("%d\\n", ventas[i]);\n}', ['RESULTADO_VALOR_DISTINTO']),

  // 8: con mensaje
  leer(8, 'el mensaje con el numero', 'for (i = 0; i < CANTIDAD; i++) {\n  printf("Ingrese la nota %d: ", i + 1);\n  scanf("%d", &notas[i]);\n}'),
  leer(8, 'con salto de linea', 'for (i = 0; i < CANTIDAD; i++) {\n  printf("Ingrese la nota %d:\\n", i + 1);\n  scanf("%d", &notas[i]);\n}'),
  leer(8, 'sin mensaje', 'for (i = 0; i < CANTIDAD; i++) {\n  scanf("%d", &notas[i]);\n}', ['TEXTO_DISTINTO']),
  leer(8, 'otro mensaje', 'for (i = 0; i < CANTIDAD; i++) {\n  printf("Nota %d: ", i + 1);\n  scanf("%d", &notas[i]);\n}', ['TEXTO_DISTINTO']),
  leer(8, 'siempre la nota 1', 'for (i = 0; i < CANTIDAD; i++) {\n  printf("Ingrese la nota 1: ");\n  scanf("%d", &notas[i]);\n}', ['TEXTO_DISTINTO']),
  leer(8, 'numerado desde cero', 'for (i = 0; i < CANTIDAD; i++) {\n  printf("Ingrese la nota %d: ", i);\n  scanf("%d", &notas[i]);\n}', ['TEXTO_DISTINTO']),
];

// Acumular y contar: se corre con varios conjuntos de valores.
const acumular = (paso, nombre, respuesta, espera = 'ok', mejoras = []) => ({
  serie: 'arreglos-acumular',
  paso,
  nombre,
  respuesta,
  espera,
  mejoras,
});

const CASOS_DE_ACUMULAR = [
  // 1: sumar las ventas
  acumular(1, 'un for con +=', 'total = 0;\nfor (i = 0; i < DIAS; i++) {\n  total += ventas[i];\n}'),
  acumular(1, 'total = total + ...', 'total = 0;\nfor (i = 0; i < DIAS; i++) {\n  total = total + ventas[i];\n}'),
  acumular(1, 'un while', 'total = 0;\ni = 0;\nwhile (i < DIAS) {\n  total += ventas[i];\n  i++;\n}'),
  acumular(1, 'de atras', 'total = 0;\nfor (i = DIAS - 1; i >= 0; i--) {\n  total += ventas[i];\n}'),
  acumular(1, 'con el numero suelto: correcto y mejorable', 'total = 0;\nfor (i = 0; i < 7; i++) {\n  total += ventas[i];\n}', 'ok', ['LIMITE_CON_NUMERO_SUELTO']),
  acumular(1, 'sin iniciar el acumulador', 'for (i = 0; i < DIAS; i++) {\n  total += ventas[i];\n}', ['VARIABLE_SIN_VALOR']),
  {
    ...acumular(1, 'el acumulador vuelve a empezar', 'for (i = 0; i < DIAS; i++) {\n  total = 0;\n  total += ventas[i];\n}', ['ACUMULADOR_REINICIADO']),
    dice: ['`ventas` valiendo `120`, `85`', '`90` y `310`, `total`', 'se vuelve a poner en `0`', 'antes del ciclo'],
  },
  {
    ...acumular(1, 'se reemplaza en lugar de sumar', 'total = 0;\nfor (i = 0; i < DIAS; i++) {\n  total = ventas[i];\n}', ['ACUMULADOR_SE_PISA']),
    dice: ['termina valiendo `310`', 'se reemplaza el valor anterior'],
  },
  acumular(1, 'el resultado escrito a mano', 'total = 1080;', ['CICLO_FALTA']),
  acumular(1, 'el resultado escrito a mano dentro de un ciclo', 'for (i = 0; i < DIAS; i++) {\n  total = 1080;\n}', ['RESULTADO_VALOR_DISTINTO']),
  acumular(1, 'sin llegar al ultimo dia', 'total = 0;\nfor (i = 0; i < DIAS - 1; i++) {\n  total += ventas[i];\n}', ['RESULTADO_VALOR_DISTINTO']),
  acumular(1, 'una vuelta de mas', 'total = 0;\nfor (i = 0; i <= DIAS; i++) {\n  total += ventas[i];\n}', ['INDICE_FUERA_DE_RANGO']),

  // 2: cuestionario, el acumulador reiniciado
  acumular(2, 'reiniciado: el ultimo', '2'),
  acumular(2, 'reiniciado: la suma', '0', ['OPCION_SUMA_COMPLETA']),
  acumular(2, 'reiniciado: cero', '1', ['OPCION_QUEDA_EN_CERO']),

  // 3: contar los aprobados
  acumular(3, 'con if y ++', 'aprobados = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] >= 6) {\n    aprobados++;\n  }\n}'),
  acumular(3, 'con += 1', 'aprobados = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] > 5) {\n    aprobados += 1;\n  }\n}'),
  acumular(3, 'con un if sin llaves', 'aprobados = 0;\nfor (i = 0; i < CANTIDAD; i++)\n  if (notas[i] >= 6)\n    aprobados++;'),
  acumular(3, 'con > en lugar de >=', 'aprobados = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] > 6) {\n    aprobados++;\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  acumular(3, 'cuenta a todos', 'aprobados = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  aprobados++;\n}', ['RESULTADO_VALOR_DISTINTO']),
  acumular(3, 'suma las notas en lugar de contar', 'aprobados = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] >= 6) {\n    aprobados += notas[i];\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  acumular(3, 'sin iniciar el contador', 'for (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] >= 6) {\n    aprobados++;\n  }\n}', ['VARIABLE_SIN_VALOR']),
  acumular(3, 'el contador no cuenta si no hay aprobados', 'aprobados = 7;', ['CICLO_FALTA']),

  // 4: sumar solo los dias fuertes
  acumular(4, 'con if', 'total = 0;\nfor (i = 0; i < DIAS; i++) {\n  if (ventas[i] > 100) {\n    total += ventas[i];\n  }\n}'),
  acumular(4, 'con >= en lugar de >', 'total = 0;\nfor (i = 0; i < DIAS; i++) {\n  if (ventas[i] >= 100) {\n    total += ventas[i];\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  acumular(4, 'suma todos', 'total = 0;\nfor (i = 0; i < DIAS; i++) {\n  total += ventas[i];\n}', ['RESULTADO_VALOR_DISTINTO']),
  acumular(4, 'cuenta en lugar de sumar', 'total = 0;\nfor (i = 0; i < DIAS; i++) {\n  if (ventas[i] > 100) {\n    total++;\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),

  // 5: cuestionario, la division de enteros
  acumular(5, 'division: la correcta', '2'),
  acumular(5, 'division: con decimales', '0', ['OPCION_DIVISION_CON_DECIMALES']),
  acumular(5, 'division: redondeada', '1', ['OPCION_REDONDEA_HACIA_ARRIBA']),

  // 6: el promedio
  acumular(6, 'con la conversion de tipo', 'suma = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  suma += notas[i];\n}\npromedio = (float) suma / CANTIDAD;'),
  acumular(6, 'con la conversion en el otro lado', 'suma = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  suma += notas[i];\n}\npromedio = suma / (float) CANTIDAD;'),
  acumular(6, 'multiplicando por 1.0', 'suma = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  suma += notas[i];\n}\npromedio = 1.0 * suma / CANTIDAD;'),
  acumular(6, 'acumulando en el promedio', 'promedio = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  promedio += notas[i];\n}\npromedio = promedio / CANTIDAD;'),
  {
    ...acumular(6, 'la division de enteros', 'suma = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  suma += notas[i];\n}\npromedio = suma / CANTIDAD;', ['DIVISION_ENTERA']),
    dice: ['termina valiendo `6` y debería valer `6.5`', 'dividir dos enteros da un entero'],
  },
  acumular(6, 'sin dividir', 'suma = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  suma += notas[i];\n}\npromedio = suma;', ['RESULTADO_VALOR_DISTINTO']),
  acumular(6, 'dividiendo por uno menos', 'suma = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  suma += notas[i];\n}\npromedio = (float) suma / (CANTIDAD - 1);', ['RESULTADO_VALOR_DISTINTO']),

  // 7: contar y sumar a la vez
  acumular(7, 'las dos cosas con un if', 'mayores = 0;\nsuma = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (edades[i] >= 18) {\n    mayores++;\n    suma += edades[i];\n  }\n}'),
  acumular(7, 'en dos ciclos', 'mayores = 0;\nsuma = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (edades[i] >= 18) {\n    mayores++;\n  }\n}\nfor (i = 0; i < CANTIDAD; i++) {\n  if (edades[i] >= 18) {\n    suma += edades[i];\n  }\n}'),
  acumular(7, 'suma a todos', 'mayores = 0;\nsuma = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  suma += edades[i];\n  if (edades[i] >= 18) {\n    mayores++;\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  acumular(7, 'sin iniciar la suma', 'mayores = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (edades[i] >= 18) {\n    mayores++;\n    suma += edades[i];\n  }\n}', ['VARIABLE_SIN_VALOR']),
  acumular(7, 'sin tocar la suma', 'mayores = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (edades[i] >= 18) {\n    mayores++;\n  }\n}', ['RESULTADO_VARIABLE_SIN_VALOR']),

  // 8: el porcentaje
  acumular(8, 'con la conversion', 'aprobados = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] >= 6) {\n    aprobados++;\n  }\n}\nporcentaje = (float) aprobados * 100 / CANTIDAD;\nprintf("%f\\n", porcentaje);'),
  acumular(8, 'con un formato corto', 'aprobados = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] >= 6) {\n    aprobados++;\n  }\n}\nporcentaje = aprobados * 100.0 / CANTIDAD;\nprintf("%.1f%%\\n", porcentaje);'),
  acumular(8, 'directo en el printf, entero', 'aprobados = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] >= 6) {\n    aprobados++;\n  }\n}\nprintf("%d\\n", aprobados * 100 / CANTIDAD);'),
  acumular(8, 'sin multiplicar por 100', 'aprobados = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] >= 6) {\n    aprobados++;\n  }\n}\nporcentaje = (float) aprobados / CANTIDAD;\nprintf("%f\\n", porcentaje);', ['MUESTRA_DISTINTA']),
  acumular(8, 'la division de enteros da cero', 'aprobados = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] >= 6) {\n    aprobados++;\n  }\n}\nporcentaje = aprobados / CANTIDAD * 100;\nprintf("%f\\n", porcentaje);', ['MUESTRA_DISTINTA']),
  acumular(8, 'sin mostrar', 'aprobados = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] >= 6) {\n    aprobados++;\n  }\n}\nporcentaje = (float) aprobados * 100 / CANTIDAD;', ['MUESTRA_FALTA']),
  acumular(8, 'mostrar un decimal con %d', 'aprobados = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] >= 6) {\n    aprobados++;\n  }\n}\nporcentaje = (float) aprobados * 100 / CANTIDAD;\nprintf("%d\\n", porcentaje);', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
];

// Buscar en un arreglo: se corre con varios conjuntos de valores.
const buscar = (paso, nombre, respuesta, espera = 'ok', mejoras = []) => ({
  serie: 'arreglos-buscar',
  paso,
  nombre,
  respuesta,
  espera,
  mejoras,
});

const CASOS_DE_BUSCAR = [
  // 1: hubo algun dia sin ventas
  buscar(1, 'una bandera', 'encontrado = 0;\nfor (i = 0; i < DIAS; i++) {\n  if (ventas[i] == 0) {\n    encontrado = 1;\n  }\n}'),
  buscar(1, 'un while que corta', 'i = 0;\nwhile (i < DIAS && ventas[i] != 0) {\n  i++;\n}\nif (i < DIAS) {\n  encontrado = 1;\n} else {\n  encontrado = 0;\n}'),
  buscar(1, 'contando', 'encontrado = 0;\nfor (i = 0; i < DIAS; i++) {\n  if (ventas[i] == 0) {\n    encontrado++;\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  buscar(1, 'sin iniciar la bandera', 'for (i = 0; i < DIAS; i++) {\n  if (ventas[i] == 0) {\n    encontrado = 1;\n  }\n}', ['RESULTADO_VARIABLE_SIN_VALOR']),
  buscar(1, 'la bandera vuelve a cero en cada vuelta', 'for (i = 0; i < DIAS; i++) {\n  if (ventas[i] == 0) {\n    encontrado = 1;\n  } else {\n    encontrado = 0;\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  buscar(1, 'solo mira el primero', 'encontrado = 0;\nif (ventas[0] == 0) {\n  encontrado = 1;\n}', ['CICLO_FALTA']),
  buscar(1, 'el resultado escrito a mano', 'encontrado = 1;', ['CICLO_FALTA']),

  // 2: cuestionario, donde queda el indice
  buscar(2, 'indice: la primera vez', '2'),
  buscar(2, 'indice: la ultima vez', '0', ['OPCION_ULTIMA_APARICION']),
  buscar(2, 'indice: la cantidad', '1', ['OPCION_RECORRE_TODO']),

  // 3: la primera posicion
  buscar(3, 'con while y condicion doble', 'i = 0;\nwhile (i < CANTIDAD && notas[i] != 7) {\n  i++;\n}\nif (i < CANTIDAD) {\n  posicion = i;\n} else {\n  posicion = -1;\n}'),
  buscar(3, 'con un for que corta', 'posicion = -1;\nfor (i = 0; i < CANTIDAD && posicion == -1; i++) {\n  if (notas[i] == 7) {\n    posicion = i;\n  }\n}'),
  buscar(3, 'con break', 'posicion = -1;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] == 7) {\n    posicion = i;\n    break;\n  }\n}'),
  {
    ...buscar(3, 'sin cortar queda la ultima', 'posicion = -1;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] == 7) {\n    posicion = i;\n  }\n}', ['BUSQUEDA_SIN_CORTAR']),
    dice: ['`posicion` termina valiendo `4`', 'es la última vez que aparece', 'dejar de buscar'],
  },
  buscar(3, 'sin el menos uno cuando no esta', 'posicion = 0;\nfor (i = CANTIDAD - 1; i >= 0; i--) {\n  if (notas[i] == 7) {\n    posicion = i;\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  buscar(3, 'la posicion de la nota y no del 7', 'posicion = -1;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] == 7) {\n    posicion = notas[i];\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  buscar(3, 'sin ciclo', 'posicion = 2;', ['CICLO_FALTA']),

  // 4: cuestionario, el maximo que empieza en cero
  buscar(4, 'maximo en cero: cero', '2'),
  buscar(4, 'maximo en cero: el mayor', '0', ['OPCION_EL_MAYOR_DEL_ARREGLO']),
  buscar(4, 'maximo en cero: la primera', '1', ['OPCION_LA_PRIMERA']),

  // 5: la mayor temperatura
  buscar(5, 'empezando con el primero', 'mayor = temperaturas[0];\nfor (i = 1; i < CANTIDAD; i++) {\n  if (temperaturas[i] > mayor) {\n    mayor = temperaturas[i];\n  }\n}'),
  buscar(5, 'recorriendo desde el primero', 'mayor = temperaturas[0];\nfor (i = 0; i < CANTIDAD; i++) {\n  if (temperaturas[i] > mayor) {\n    mayor = temperaturas[i];\n  }\n}'),
  buscar(5, 'con un while', 'mayor = temperaturas[0];\ni = 1;\nwhile (i < CANTIDAD) {\n  if (temperaturas[i] > mayor) {\n    mayor = temperaturas[i];\n  }\n  i++;\n}'),
  {
    ...buscar(5, 'empezando en cero: falla con negativas', 'mayor = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (temperaturas[i] > mayor) {\n    mayor = temperaturas[i];\n  }\n}', ['EXTREMO_FUERA_DEL_ARREGLO']),
    dice: ['`temperaturas` valiendo `-3`', 'ese valor no es ninguno de los de `temperaturas`', 'uno de los del arreglo'],
  },
  buscar(5, 'el menor en lugar del mayor', 'mayor = temperaturas[0];\nfor (i = 1; i < CANTIDAD; i++) {\n  if (temperaturas[i] < mayor) {\n    mayor = temperaturas[i];\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  buscar(5, 'la ultima temperatura', 'mayor = temperaturas[CANTIDAD - 1];', ['CICLO_FALTA']),
  buscar(5, 'sin iniciar', 'for (i = 0; i < CANTIDAD; i++) {\n  if (temperaturas[i] > mayor) {\n    mayor = temperaturas[i];\n  }\n}', ['VARIABLE_SIN_VALOR']),

  // 6: la menor y la mayor
  buscar(6, 'las dos con un ciclo', 'menor = temperaturas[0];\nmayor = temperaturas[0];\nfor (i = 1; i < CANTIDAD; i++) {\n  if (temperaturas[i] < menor) {\n    menor = temperaturas[i];\n  }\n  if (temperaturas[i] > mayor) {\n    mayor = temperaturas[i];\n  }\n}'),
  buscar(6, 'con dos ciclos', 'menor = temperaturas[0];\nfor (i = 1; i < CANTIDAD; i++) {\n  if (temperaturas[i] < menor) {\n    menor = temperaturas[i];\n  }\n}\nmayor = temperaturas[0];\nfor (i = 1; i < CANTIDAD; i++) {\n  if (temperaturas[i] > mayor) {\n    mayor = temperaturas[i];\n  }\n}'),
  buscar(6, 'con un else if', 'menor = temperaturas[0];\nmayor = temperaturas[0];\nfor (i = 1; i < CANTIDAD; i++) {\n  if (temperaturas[i] < menor) {\n    menor = temperaturas[i];\n  } else if (temperaturas[i] > mayor) {\n    mayor = temperaturas[i];\n  }\n}'),
  buscar(6, 'el menor empezando en cero', 'menor = 0;\nmayor = temperaturas[0];\nfor (i = 1; i < CANTIDAD; i++) {\n  if (temperaturas[i] < menor) {\n    menor = temperaturas[i];\n  }\n  if (temperaturas[i] > mayor) {\n    mayor = temperaturas[i];\n  }\n}', ['EXTREMO_FUERA_DEL_ARREGLO']),
  buscar(6, 'los dos al reves', 'menor = temperaturas[0];\nmayor = temperaturas[0];\nfor (i = 1; i < CANTIDAD; i++) {\n  if (temperaturas[i] > menor) {\n    menor = temperaturas[i];\n  }\n  if (temperaturas[i] < mayor) {\n    mayor = temperaturas[i];\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  buscar(6, 'solo el mayor', 'mayor = temperaturas[0];\nfor (i = 1; i < CANTIDAD; i++) {\n  if (temperaturas[i] > mayor) {\n    mayor = temperaturas[i];\n  }\n}', ['RESULTADO_VARIABLE_SIN_VALOR']),

  // 7: en que dia se vendio mas
  buscar(7, 'comparando con el elemento', 'dia = 0;\nfor (i = 1; i < DIAS; i++) {\n  if (ventas[i] > ventas[dia]) {\n    dia = i;\n  }\n}'),
  buscar(7, 'con una variable para el mayor', 'int mayorVenta = ventas[0];\ndia = 0;\nfor (i = 1; i < DIAS; i++) {\n  if (ventas[i] > mayorVenta) {\n    mayorVenta = ventas[i];\n    dia = i;\n  }\n}'),
  buscar(7, 'el valor y no la posicion', 'dia = ventas[0];\nfor (i = 1; i < DIAS; i++) {\n  if (ventas[i] > dia) {\n    dia = ventas[i];\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  buscar(7, 'la posicion del menor', 'dia = 0;\nfor (i = 1; i < DIAS; i++) {\n  if (ventas[i] < ventas[dia]) {\n    dia = i;\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  buscar(7, 'la ultima posicion', 'dia = DIAS - 1;', ['CICLO_FALTA']),

  // 8: aprobaron todos
  buscar(8, 'la bandera que baja', 'todos = 1;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] < 6) {\n    todos = 0;\n  }\n}'),
  buscar(8, 'contando los que no aprobaron', 'int desaprobados = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] < 6) {\n    desaprobados++;\n  }\n}\nif (desaprobados == 0) {\n  todos = 1;\n} else {\n  todos = 0;\n}'),
  buscar(8, 'con while que corta', 'i = 0;\nwhile (i < CANTIDAD && notas[i] >= 6) {\n  i++;\n}\ntodos = i == CANTIDAD;'),
  buscar(8, 'la bandera vuelve a subir', 'for (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] < 6) {\n    todos = 0;\n  } else {\n    todos = 1;\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  buscar(8, 'solo mira el ultimo', 'todos = 1;\nif (notas[CANTIDAD - 1] < 6) {\n  todos = 0;\n}', ['CICLO_FALTA']),
  buscar(8, 'sin iniciar', 'for (i = 0; i < CANTIDAD; i++) {\n  if (notas[i] < 6) {\n    todos = 0;\n  }\n}', ['RESULTADO_VARIABLE_SIN_VALOR']),
];

// Tamano fisico y logico: se corre con datos y valores de prueba.
const tamano = (paso, nombre, respuesta, espera = 'ok', mejoras = []) => ({
  serie: 'arreglos-tamano',
  paso,
  nombre,
  respuesta,
  espera,
  mejoras,
});

const CASOS_DE_TAMANO = [
  // 1: cuestionario, fisico y logico
  tamano(1, 'fisico y logico: las cargadas', '2'),
  tamano(1, 'fisico y logico: el fisico', '0', ['OPCION_TAMANO_FISICO']),
  tamano(1, 'fisico y logico: la ultima posicion', '1', ['OPCION_ULTIMA_POSICION']),

  // 2: cargar hasta el -1
  tamano(2, 'con una nota de arranque', 'cantidad = 0;\nnota = 0;\nwhile (cantidad < MAX_NOTAS && nota != -1) {\n  scanf("%d", &nota);\n  if (nota != -1) {\n    notas[cantidad] = nota;\n    cantidad++;\n  }\n}'),
  tamano(2, 'leyendo antes del ciclo', 'cantidad = 0;\nscanf("%d", &nota);\nwhile (cantidad < MAX_NOTAS && nota != -1) {\n  notas[cantidad] = nota;\n  cantidad++;\n  if (cantidad < MAX_NOTAS) {\n    scanf("%d", &nota);\n  }\n}'),
  tamano(2, 'con un for', 'cantidad = 0;\nnota = 0;\nfor (cantidad = 0; cantidad < MAX_NOTAS && nota != -1; ) {\n  scanf("%d", &nota);\n  if (nota != -1) {\n    notas[cantidad] = nota;\n    cantidad++;\n  }\n}'),
  {
    ...tamano(2, 'cuenta tambien el -1', 'cantidad = 0;\nnota = 0;\nwhile (cantidad < MAX_NOTAS && nota != -1) {\n  scanf("%d", &nota);\n  notas[cantidad] = nota;\n  cantidad++;\n}', ['CENTINELA_CONTADO']),
    dice: ['`cantidad` termina valiendo `4`', 'el `-1` que marca el final'],
  },
  {
    ...tamano(2, 'no corta con el -1', 'cantidad = 0;\nwhile (cantidad < MAX_NOTAS) {\n  scanf("%d", &nota);\n  if (nota != -1) {\n    notas[cantidad] = nota;\n    cantidad++;\n  }\n}', ['LECTURA_DE_MAS']),
    dice: ['sigue pidiendo datos', 'el `-1` que marca el final'],
  },
  tamano(2, 'no corta cuando se llena', 'cantidad = 0;\nnota = 0;\nwhile (nota != -1) {\n  scanf("%d", &nota);\n  if (nota != -1) {\n    notas[cantidad] = nota;\n    cantidad++;\n  }\n}', ['LECTURA_DE_MAS']),
  tamano(2, 'sin iniciar la nota', 'cantidad = 0;\nwhile (cantidad < MAX_NOTAS && nota != -1) {\n  scanf("%d", &nota);\n  if (nota != -1) {\n    notas[cantidad] = nota;\n    cantidad++;\n  }\n}', ['VARIABLE_SIN_VALOR']),
  tamano(2, 'sin ciclo', 'cantidad = 0;\nscanf("%d", &nota);\nnotas[0] = nota;\ncantidad = 1;', ['CICLO_FALTA']),

  // 3: mostrar solo las cargadas
  tamano(3, 'hasta cantidad', 'for (i = 0; i < cantidad; i++) {\n  printf("%d\\n", notas[i]);\n}'),
  tamano(3, 'con un while', 'i = 0;\nwhile (i < cantidad) {\n  printf("%d ", notas[i]);\n  i++;\n}'),
  {
    ...tamano(3, 'hasta el fisico', 'for (i = 0; i < MAX_NOTAS; i++) {\n  printf("%d\\n", notas[i]);\n}', ['MUESTRA_DISTINTA']),
    dice: ['`7`, `4`, `9`, `6`, `0`', 'cuando debería mostrar `7`, `4`, `9` y `6`'],
  },
  tamano(3, 'una de menos', 'for (i = 0; i < cantidad - 1; i++) {\n  printf("%d\\n", notas[i]);\n}', ['MUESTRA_DISTINTA']),
  tamano(3, 'una de mas', 'for (i = 0; i <= cantidad; i++) {\n  printf("%d\\n", notas[i]);\n}', ['MUESTRA_DISTINTA']),
  tamano(3, 'sin ciclo', 'printf("%d\\n", notas[0]);', ['CICLO_FALTA']),

  // 4: cuestionario, recorrer hasta el fisico
  tamano(4, 'recorrer el fisico: no se sabe', '2'),
  tamano(4, 'recorrer el fisico: la suma', '0', ['OPCION_SOLO_LAS_CARGADAS']),
  tamano(4, 'recorrer el fisico: da error', '1', ['OPCION_DA_ERROR']),

  // 5: el promedio de las cargadas
  tamano(5, 'con la guarda', 'suma = 0;\nfor (i = 0; i < cantidad; i++) {\n  suma += notas[i];\n}\nif (cantidad > 0) {\n  promedio = (float) suma / cantidad;\n} else {\n  promedio = 0;\n}'),
  tamano(5, 'con la guarda adelante', 'promedio = 0;\nif (cantidad > 0) {\n  suma = 0;\n  for (i = 0; i < cantidad; i++) {\n    suma += notas[i];\n  }\n  promedio = (float) suma / cantidad;\n}'),
  {
    ...tamano(5, 'sin la guarda divide por cero', 'suma = 0;\nfor (i = 0; i < cantidad; i++) {\n  suma += notas[i];\n}\npromedio = (float) suma / cantidad;', ['DIVISION_POR_CERO']),
    dice: ['`cantidad` valiendo `0`', 'divide por `0`'],
  },
  tamano(5, 'la division de enteros', 'suma = 0;\nfor (i = 0; i < cantidad; i++) {\n  suma += notas[i];\n}\nif (cantidad > 0) {\n  promedio = suma / cantidad;\n} else {\n  promedio = 0;\n}', ['DIVISION_ENTERA']),
  tamano(5, 'dividiendo por el fisico', 'suma = 0;\nfor (i = 0; i < cantidad; i++) {\n  suma += notas[i];\n}\npromedio = (float) suma / MAX_NOTAS;', ['RESULTADO_VALOR_DISTINTO']),
  tamano(5, 'sumando hasta el fisico', 'suma = 0;\nfor (i = 0; i < MAX_NOTAS; i++) {\n  suma += notas[i];\n}\nif (cantidad > 0) {\n  promedio = (float) suma / cantidad;\n} else {\n  promedio = 0;\n}', ['RESULTADO_VALOR_DISTINTO']),
  tamano(5, 'sin dar valor al promedio cuando no hay', 'suma = 0;\nfor (i = 0; i < cantidad; i++) {\n  suma += notas[i];\n}\nif (cantidad > 0) {\n  promedio = (float) suma / cantidad;\n}', ['RESULTADO_VARIABLE_SIN_VALOR']),

  // 6: agregar al final
  tamano(6, 'con la guarda', 'if (cantidad < MAX_NOTAS) {\n  notas[cantidad] = 8;\n  cantidad++;\n}'),
  tamano(6, 'con la guarda y ++ adentro', 'if (cantidad < MAX_NOTAS) {\n  notas[cantidad++] = 8;\n}'),
  tamano(6, 'sin la guarda: no hay lugar', 'notas[cantidad] = 8;\ncantidad++;', ['INDICE_FUERA_DE_RANGO']),
  tamano(6, 'con <= en la guarda', 'if (cantidad <= MAX_NOTAS) {\n  notas[cantidad] = 8;\n  cantidad++;\n}', ['INDICE_FUERA_DE_RANGO']),
  tamano(6, 'sin actualizar la cantidad', 'if (cantidad < MAX_NOTAS) {\n  notas[cantidad] = 8;\n}', ['RESULTADO_VALOR_DISTINTO']),
  tamano(6, 'actualizando antes', 'if (cantidad < MAX_NOTAS) {\n  cantidad++;\n  notas[cantidad] = 8;\n}', ['RESULTADO_VALOR_DISTINTO']),
  tamano(6, 'en la ultima posicion del fisico', 'notas[MAX_NOTAS - 1] = 8;\ncantidad++;', ['RESULTADO_VALOR_DISTINTO']),

  // 7: quitar el ultimo
  tamano(7, 'con la guarda', 'if (cantidad > 0) {\n  cantidad--;\n}'),
  tamano(7, 'con la guarda y cantidad = cantidad - 1', 'if (cantidad != 0) {\n  cantidad = cantidad - 1;\n}'),
  tamano(7, 'sin la guarda: queda negativa', 'cantidad--;', ['RESULTADO_VALOR_DISTINTO']),
  tamano(7, 'borrando el valor y no la cuenta', 'if (cantidad > 0) {\n  notas[cantidad - 1] = 0;\n}', ['RESULTADO_VALOR_DISTINTO']),

  // 8: cuestionario, sizeof
  tamano(8, 'sizeof: la cantidad', '2'),
  tamano(8, 'sizeof: los bytes', '0', ['OPCION_SON_BYTES']),
  tamano(8, 'sizeof: un elemento', '1', ['OPCION_UN_ELEMENTO']),

  // 9: recorrer sin conocer el tamano
  tamano(9, 'con sizeof del elemento', 'cantidad = sizeof(notas) / sizeof(notas[0]);\ntotal = 0;\nfor (i = 0; i < cantidad; i++) {\n  total += notas[i];\n}'),
  tamano(9, 'con sizeof del tipo', 'cantidad = sizeof(notas) / sizeof(int);\ntotal = 0;\nfor (i = 0; i < cantidad; i++) {\n  total += notas[i];\n}'),
  tamano(9, 'recorriendo con la expresion', 'total = 0;\nfor (i = 0; i < sizeof(notas) / sizeof(notas[0]); i++) {\n  total += notas[i];\n}\ncantidad = sizeof(notas) / sizeof(notas[0]);'),
  {
    ...tamano(9, 'el numero escrito', 'cantidad = 5;\ntotal = 0;\nfor (i = 0; i < cantidad; i++) {\n  total += notas[i];\n}', ['INDICE_FUERA_DE_RANGO']),
    dice: ['Con `notas` valiendo `1`, `2` y `3`', 'tiene 3 posiciones'],
  },
  tamano(9, 'los bytes en lugar de la cantidad', 'cantidad = sizeof(notas);\ntotal = 0;\nfor (i = 0; i < cantidad; i++) {\n  total += notas[i];\n}', ['INDICE_FUERA_DE_RANGO']),
  tamano(9, 'sin sumar', 'cantidad = sizeof(notas) / sizeof(notas[0]);', ['CICLO_FALTA']),
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
const tablas = (paso, nombre, respuesta, espera = 'ok', mejoras = []) => ({
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
  tablas(3, 'cero con constantes es excelente', '#define SALAS 3\n#define FUNCIONES 4\nint t[SALAS][FUNCIONES] = {0};', 'ok'),
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
  tablas(4, 'solo lo que no es cero, con constantes', 'int u[SALAS][FUNCIONES] = {{5, 8}, {1}};', 'ok'),
  tablas(4, 'los ceros de las filas escritos', 'int u[SALAS][FUNCIONES] = {{5, 8, 0, 0}, {1}};', 'ok'),
  tablas(4, 'todas las filas escritas: las filas estan repetidas', 'int u[SALAS][FUNCIONES] = {{5, 8, 0, 0}, {1, 0, 0, 0}, {0, 0, 0, 0}};', 'ok', [
    'FILAS_REPETIDAS',
  ]),
  tablas(4, 'con los numeros habiendo constantes', 'int u[3][4] = {{5, 8}, {1}};', 'ok', ['CONSTANTE_SIN_REUTILIZAR']),
  tablas(4, 'seguidos hasta el ultimo distinto de cero', 'int u[SALAS][FUNCIONES] = {5, 8, 0, 0, 1};', 'ok', [
    'TABLA_SIN_FILAS',
  ]),
  tablas(4, 'una fila que se queda corta', 'int u[SALAS][FUNCIONES] = {{5}, {1}};', ['FILA_OTRA_CANTIDAD']),
  tablas(4, 'seguidos que se quedan cortos', 'int u[SALAS][FUNCIONES] = {5, 8};', ['VALORES_SIN_NOMBRAR']),
  tablas(4, 'una fila que falta y no es de ceros', 'int u[SALAS][FUNCIONES] = {{5, 8}};', ['FILAS_DE_MENOS']),

  // La 9 continua la 8: ve su codigo, y por eso no se puede repetir un nombre.
  tablas(4, 'la variable de la consigna anterior otra vez', 'int entradas[SALAS][FUNCIONES] = {{5, 8}, {1}};', [
    'VARIABLE_REDEFINIDA',
  ]),
  tablas(4, 'la constante con otro valor', '#define SALAS 5\nint u[SALAS][FUNCIONES] = {{5, 8}, {1}};', [
    'CONSTANTE_REDEFINIDA',
  ]),
  tablas(4, 'la constante con el mismo valor: mejorable', '#define SALAS 3\nint u[SALAS][FUNCIONES] = {{5, 8}, {1}};', 'ok', [
    'CONSTANTE_REPETIDA',
  ]),
  tablas(4, 'la constante con el mismo valor y parentesis', '#define SALAS (3)\nint u[SALAS][FUNCIONES] = {{5, 8}, {1}};', 'ok', [
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

// Tablas: acceder a un elemento con su fila y su columna.
const CASOS_DE_TABLAS = [
  // 5: cuestionario, fila y columna
  tablas(5, 'fila y columna: la correcta', '2'),
  tablas(5, 'fila y columna: cambiadas', '0', ['OPCION_FILA_Y_COLUMNA_CAMBIADAS']),
  tablas(5, 'fila y columna: contando desde uno', '1', ['OPCION_CUENTA_DESDE_UNO']),

  // 6: corregir un elemento
  tablas(6, 'el elemento correcto', 'notas[2][1] = 9;'),
  tablas(6, 'el elemento con una cuenta', 'notas[2][1] = 4 + 5;'),
  tablas(6, 'la fila y la columna cambiadas', 'notas[1][2] = 9;', ['RESULTADO_VALOR_DISTINTO']),
  tablas(6, 'contando desde uno', 'notas[3][2] = 9;', ['INDICE_FUERA_DE_RANGO']),
  tablas(6, 'otro elemento', 'notas[2][0] = 9;', ['RESULTADO_VALOR_DISTINTO']),
  {
    ...tablas(6, 'otro valor', 'notas[2][1] = 8;', ['RESULTADO_VALOR_DISTINTO']),
    dice: ['`notas[2][1]` termina valiendo `8` y debería valer `9`'],
  },
  tablas(6, 'una columna que no existe', 'notas[2][4] = 9;', ['INDICE_FUERA_DE_RANGO']),

  // 7: sumar dos elementos de una fila
  tablas(7, 'los dos de la fila', 'suma = notas[2][0] + notas[2][2];'),
  tablas(7, 'en el otro orden', 'suma = notas[2][2] + notas[2][0];'),
  tablas(7, 'en dos pasos', 'suma = notas[2][0];\nsuma += notas[2][2];'),
  tablas(7, 'la fila equivocada', 'suma = notas[1][0] + notas[1][2];', ['RESULTADO_VALOR_DISTINTO']),
  {
    ...tablas(7, 'la fila y la columna cambiadas', 'suma = notas[0][2] + notas[2][2];', ['RESULTADO_VALOR_DISTINTO']),
    dice: ['`suma` termina valiendo `5` y debería valer `7`'],
  },
  tablas(7, 'el resultado escrito a mano', 'suma = 7;', ['RESULTADO_VALOR_DISTINTO']),
  tablas(7, 'una fila que no existe', 'suma = notas[3][0] + notas[3][2];', ['INDICE_FUERA_DE_RANGO']),
];

// Recorrer una tabla: ciclos anidados, con valores de prueba.
const rtablas = (paso, nombre, respuesta, espera = 'ok', mejoras = []) => ({
  serie: 'arreglos-recorrer-tablas',
  paso,
  nombre,
  respuesta,
  espera,
  mejoras,
});

const CASOS_DE_RECORRER_TABLAS = [
  // 1: una tabla de multiplicar
  rtablas(1, 'con dos for', 'for (i = 0; i < MULTIPLICANDOS; i++) {\n  for (j = 0; j < MULTIPLICADORES; j++) {\n    tabla[i][j] = (i + 1) * (j + 1);\n  }\n}'),
  rtablas(1, 'con dos while', 'i = 0;\nwhile (i < MULTIPLICANDOS) {\n  j = 0;\n  while (j < MULTIPLICADORES) {\n    tabla[i][j] = (i + 1) * (j + 1);\n    j++;\n  }\n  i++;\n}'),
  rtablas(1, 'con la columna afuera', 'for (j = 0; j < MULTIPLICADORES; j++) {\n  for (i = 0; i < MULTIPLICANDOS; i++) {\n    tabla[i][j] = (i + 1) * (j + 1);\n  }\n}'),
  rtablas(1, 'con los numeros sueltos: correcto y mejorable', 'for (i = 0; i < 4; i++) {\n  for (j = 0; j < 5; j++) {\n    tabla[i][j] = (i + 1) * (j + 1);\n  }\n}', 'ok', ['LIMITE_CON_NUMERO_SUELTO']),
  rtablas(1, 'sin sumarle uno', 'for (i = 0; i < MULTIPLICANDOS; i++) {\n  for (j = 0; j < MULTIPLICADORES; j++) {\n    tabla[i][j] = i * j;\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  rtablas(1, 'con los limites al reves', 'for (i = 0; i < MULTIPLICADORES; i++) {\n  for (j = 0; j < MULTIPLICANDOS; j++) {\n    tabla[i][j] = (i + 1) * (j + 1);\n  }\n}', ['INDICE_FUERA_DE_RANGO']),
  {
    ...rtablas(1, 'con la fila y la columna cambiadas', 'for (i = 0; i < MULTIPLICANDOS; i++) {\n  for (j = 0; j < MULTIPLICADORES; j++) {\n    tabla[j][i] = (i + 1) * (j + 1);\n  }\n}', ['INDICE_FUERA_DE_RANGO']),
    dice: ['`tabla` tiene 4 filas, numeradas de 0 a 3', 'la fila 4'],
  },
  rtablas(1, 'con un solo ciclo', 'for (i = 0; i < MULTIPLICANDOS; i++) {\n  tabla[i][0] = i + 1;\n}', ['RECORRIDO_INCOMPLETO']),
  rtablas(1, 'sin ciclos', 'tabla[0][0] = 1;', ['CICLO_FALTA']),

  // 2: cuestionario, cuantas veces
  rtablas(2, 'veces: el producto', '2'),
  rtablas(2, 'veces: la suma', '0', ['OPCION_SUMA_DE_LAS_VUELTAS']),
  rtablas(2, 'veces: las filas', '1', ['OPCION_SOLO_LAS_FILAS']),

  // 3: mostrar la tabla fila por fila
  rtablas(3, 'un renglon por fila', 'for (i = 0; i < SUCURSALES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    printf("%d ", ventas[i][j]);\n  }\n  printf("\\n");\n}'),
  rtablas(3, 'con tabuladores', 'for (i = 0; i < SUCURSALES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    printf("%d\\t", ventas[i][j]);\n  }\n  printf("\\n");\n}'),
  rtablas(3, 'una fila en un solo printf', 'for (i = 0; i < SUCURSALES; i++) {\n  printf("%d %d %d %d\\n", ventas[i][0], ventas[i][1], ventas[i][2], ventas[i][3]);\n}'),
  rtablas(3, 'con el salto antes de cada fila', 'for (i = 0; i < SUCURSALES; i++) {\n  printf("\\n");\n  for (j = 0; j < DIAS; j++) {\n    printf("%d ", ventas[i][j]);\n  }\n}'),
  {
    ...rtablas(3, 'todo en un renglon', 'for (i = 0; i < SUCURSALES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    printf("%d ", ventas[i][j]);\n  }\n}', ['TABLA_SIN_RENGLONES']),
    dice: ['en 1 renglón', 'la tabla tiene 3 filas', 'cada fila tiene que ir en su propio renglón'],
  },
  rtablas(3, 'un valor por renglon', 'for (i = 0; i < SUCURSALES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    printf("%d\\n", ventas[i][j]);\n  }\n}', ['TABLA_SIN_RENGLONES']),
  rtablas(3, 'solo la primera fila', 'for (j = 0; j < DIAS; j++) {\n  printf("%d ", ventas[0][j]);\n}\nprintf("\\n");', ['RECORRIDO_INCOMPLETO']),
  rtablas(3, 'las columnas como renglones', 'for (j = 0; j < DIAS; j++) {\n  for (i = 0; i < SUCURSALES; i++) {\n    printf("%d ", ventas[i][j]);\n  }\n  printf("\\n");\n}', ['MUESTRA_DISTINTA']),
  rtablas(3, 'con la tabla entera', 'for (i = 0; i < SUCURSALES; i++) {\n  printf("%d\\n", ventas);\n}', ['ARREGLO_SIN_POSICION']),

  // 4: el total de la cadena
  rtablas(4, 'con dos for', 'total = 0;\nfor (i = 0; i < SUCURSALES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    total += ventas[i][j];\n  }\n}'),
  rtablas(4, 'con la columna afuera', 'total = 0;\nfor (j = 0; j < DIAS; j++) {\n  for (i = 0; i < SUCURSALES; i++) {\n    total += ventas[i][j];\n  }\n}'),
  rtablas(4, 'sin iniciar el total', 'for (i = 0; i < SUCURSALES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    total += ventas[i][j];\n  }\n}', ['VARIABLE_SIN_VALOR']),
  rtablas(4, 'el total vuelve a cero en cada fila', 'for (i = 0; i < SUCURSALES; i++) {\n  total = 0;\n  for (j = 0; j < DIAS; j++) {\n    total += ventas[i][j];\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  rtablas(4, 'sin llegar a la ultima columna', 'total = 0;\nfor (i = 0; i < SUCURSALES; i++) {\n  for (j = 0; j < DIAS - 1; j++) {\n    total += ventas[i][j];\n  }\n}', ['RECORRIDO_INCOMPLETO']),

  // 5: cuestionario, el acumulador
  rtablas(5, 'acumulador: el de las dos filas', '2'),
  rtablas(5, 'acumulador: la fila sola', '0', ['OPCION_SOLO_LA_FILA']),
  rtablas(5, 'acumulador: el ultimo elemento', '1', ['OPCION_ULTIMO_ELEMENTO']),

  // 6: el total de cada sucursal
  rtablas(6, 'con el total en el arreglo', 'for (i = 0; i < SUCURSALES; i++) {\n  totales[i] = 0;\n  for (j = 0; j < DIAS; j++) {\n    totales[i] += ventas[i][j];\n  }\n}'),
  rtablas(6, 'con una variable de apoyo', 'int suma;\nfor (i = 0; i < SUCURSALES; i++) {\n  suma = 0;\n  for (j = 0; j < DIAS; j++) {\n    suma += ventas[i][j];\n  }\n  totales[i] = suma;\n}'),
  {
    ...rtablas(6, 'la variable de apoyo no vuelve a cero', 'int suma = 0;\nfor (i = 0; i < SUCURSALES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    suma += ventas[i][j];\n  }\n  totales[i] = suma;\n}', ['ACUMULADOR_SIN_REINICIAR_POR_FILA']),
    dice: ['`totales` termina con `505`, `1125` y `1600`', 'cada total arrastra lo de las filas anteriores', 'volver a `0`'],
  },
  rtablas(6, 'sin iniciar el total de cada fila', 'for (i = 0; i < SUCURSALES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    totales[i] += ventas[i][j];\n  }\n}', ['VARIABLE_SIN_VALOR']),
  rtablas(6, 'sumando por columna', 'for (j = 0; j < DIAS; j++) {\n  totales[j] = 0;\n  for (i = 0; i < SUCURSALES; i++) {\n    totales[j] += ventas[i][j];\n  }\n}', ['INDICE_FUERA_DE_RANGO']),

  // 7: el total de cada dia
  rtablas(7, 'con la columna afuera', 'for (j = 0; j < DIAS; j++) {\n  totales[j] = 0;\n  for (i = 0; i < SUCURSALES; i++) {\n    totales[j] += ventas[i][j];\n  }\n}'),
  rtablas(7, 'con la fila afuera', 'for (j = 0; j < DIAS; j++) {\n  totales[j] = 0;\n}\nfor (i = 0; i < SUCURSALES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    totales[j] += ventas[i][j];\n  }\n}'),
  {
    ...rtablas(7, 'sumando por fila', 'for (i = 0; i < SUCURSALES; i++) {\n  totales[i] = 0;\n  for (j = 0; j < DIAS; j++) {\n    totales[i] += ventas[i][j];\n  }\n}', ['FILAS_Y_COLUMNAS_CAMBIADAS']),
    dice: ['`totales` termina con `505`, `620` y `475`', 'la fila y la columna cambiadas'],
  },
  rtablas(7, 'sin iniciar los totales', 'for (i = 0; i < SUCURSALES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    totales[j] += ventas[i][j];\n  }\n}', ['VARIABLE_SIN_VALOR']),

  // 8: la diagonal
  rtablas(8, 'con un ciclo', 'suma = 0;\nfor (i = 0; i < LADO; i++) {\n  suma += puntos[i][i];\n}'),
  rtablas(8, 'con dos ciclos y un if', 'int j;\nsuma = 0;\nfor (i = 0; i < LADO; i++) {\n  for (j = 0; j < LADO; j++) {\n    if (i == j) {\n      suma += puntos[i][j];\n    }\n  }\n}'),
  rtablas(8, 'la otra diagonal', 'suma = 0;\nfor (i = 0; i < LADO; i++) {\n  suma += puntos[i][LADO - 1 - i];\n}', ['RESULTADO_VALOR_DISTINTO']),
  rtablas(8, 'una columna', 'suma = 0;\nfor (i = 0; i < LADO; i++) {\n  suma += puntos[i][0];\n}', ['RESULTADO_VALOR_DISTINTO']),
  rtablas(8, 'una posicion que no existe', 'suma = 0;\nfor (i = 0; i <= LADO; i++) {\n  suma += puntos[i][i];\n}', ['INDICE_FUERA_DE_RANGO']),

  // 9: la temperatura mas alta y donde
  rtablas(9, 'con la posicion', 'mayor = temperaturas[0][0];\nfila = 0;\ncolumna = 0;\nfor (i = 0; i < CIUDADES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    if (temperaturas[i][j] > mayor) {\n      mayor = temperaturas[i][j];\n      fila = i;\n      columna = j;\n    }\n  }\n}'),
  {
    ...rtablas(9, 'empezando en cero con negativas', 'mayor = 0;\nfila = 0;\ncolumna = 0;\nfor (i = 0; i < CIUDADES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    if (temperaturas[i][j] > mayor) {\n      mayor = temperaturas[i][j];\n      fila = i;\n      columna = j;\n    }\n  }\n}', ['EXTREMO_FUERA_DEL_ARREGLO']),
    dice: ['ese valor no es ninguno de los de `temperaturas`'],
  },
  rtablas(9, 'la fila y la columna cambiadas', 'mayor = temperaturas[0][0];\nfila = 0;\ncolumna = 0;\nfor (i = 0; i < CIUDADES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    if (temperaturas[i][j] > mayor) {\n      mayor = temperaturas[i][j];\n      fila = j;\n      columna = i;\n    }\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),
  rtablas(9, 'sin guardar la posicion', 'mayor = temperaturas[0][0];\nfor (i = 0; i < CIUDADES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    if (temperaturas[i][j] > mayor) {\n      mayor = temperaturas[i][j];\n    }\n  }\n}', ['RESULTADO_VARIABLE_SIN_VALOR']),
  rtablas(9, 'el menor en lugar del mayor', 'mayor = temperaturas[0][0];\nfila = 0;\ncolumna = 0;\nfor (i = 0; i < CIUDADES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    if (temperaturas[i][j] < mayor) {\n      mayor = temperaturas[i][j];\n      fila = i;\n      columna = j;\n    }\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),

  // 10: cuantas filas y cuantas columnas
  rtablas(10, 'con sizeof de la fila y del elemento', 'filas = sizeof(temperaturas) / sizeof(temperaturas[0]);\ncolumnas = sizeof(temperaturas[0]) / sizeof(temperaturas[0][0]);'),
  rtablas(10, 'con sizeof del tipo', 'filas = sizeof(temperaturas) / sizeof(temperaturas[0]);\ncolumnas = sizeof(temperaturas[0]) / sizeof(int);'),
  rtablas(10, 'las filas escritas', 'filas = 4;\ncolumnas = sizeof(temperaturas[0]) / sizeof(temperaturas[0][0]);', ['RESULTADO_VALOR_DISTINTO']),
  rtablas(10, 'todos los elementos como filas', 'filas = sizeof(temperaturas) / sizeof(temperaturas[0][0]);\ncolumnas = sizeof(temperaturas[0]) / sizeof(temperaturas[0][0]);', ['RESULTADO_VALOR_DISTINTO']),
  rtablas(10, 'los bytes como filas', 'filas = sizeof(temperaturas);\ncolumnas = sizeof(temperaturas[0]) / sizeof(temperaturas[0][0]);', ['RESULTADO_VALOR_DISTINTO']),
  // los nombres, y el recorrido
  {
    ...rtablas(1, 'un nombre mal escrito', 'for (i = 0; i < MULTIPLICADOS; i++) {\n  for (j = 0; j < MULTIPLICADORES; j++) {\n    tabla[i][j] = (i + 1) * (j + 1);\n  }\n}', ['NOMBRE_NO_DECLARADO']),
    dice: ['`MULTIPLICADOS` no está declarado', '¿Quiso decir `MULTIPLICANDOS`?'],
  },
  {
    ...rtablas(1, 'un nombre que no existe', 'for (i = 0; i < LIMITE; i++) {\n  for (j = 0; j < MULTIPLICADORES; j++) {\n    tabla[i][j] = (i + 1) * (j + 1);\n  }\n}', ['NOMBRE_NO_DECLARADO']),
    dice: ['`LIMITE` no está declarado: hay que declararlo antes de usarlo'],
  },
  {
    ...rtablas(1, 'un limite que se queda corto', 'for (i = 0; i < MULTIPLICANDOS - 1; i++) {\n  for (j = 0; j < MULTIPLICADORES; j++) {\n    tabla[i][j] = (i + 1) * (j + 1);\n  }\n}', ['RECORRIDO_INCOMPLETO']),
    dice: ['`tabla` tiene 4 filas y el ciclo no llega a recorrerlas todas.'],
  },
  {
    ...rtablas(1, 'un limite que se pasa', 'for (i = 0; i <= MULTIPLICANDOS; i++) {\n  for (j = 0; j < MULTIPLICADORES; j++) {\n    tabla[i][j] = (i + 1) * (j + 1);\n  }\n}', ['INDICE_FUERA_DE_RANGO']),
    dice: ['`tabla` tiene 4 filas, numeradas de 0 a 3, y el ciclo llega hasta la fila 4, que no existe'],
  },
  {
    ...rtablas(4, 'sin tocar la tabla', 'total = 0;\nfor (i = 0; i < SUCURSALES; i++) {\n  total += i;\n}', ['RECORRIDO_INCOMPLETO']),
    dice: ['`ventas` tiene 3 filas y el programa no las recorre'],
  },
  {
    ...rtablas(3, 'todo en un renglon: muestra lo que sale', 'for (i = 0; i < SUCURSALES; i++) {\n  for (j = 0; j < DIAS; j++) {\n    printf("%d ", ventas[i][j]);\n  }\n}', ['TABLA_SIN_RENGLONES']),
    bloques: ['120 85 240 60 175 90 310 45 50 130 95 200'],
  },
  {
    ...rtablas(3, 'las columnas: muestra lo que sale', 'for (j = 0; j < DIAS; j++) {\n  for (i = 0; i < SUCURSALES; i++) {\n    printf("%d ", ventas[i][j]);\n  }\n  printf("\\n");\n}', ['MUESTRA_DISTINTA']),
    dice: ['El programa muestra:'],
    bloques: ['120 175 50\n85 90 130\n240 310 95\n60 45 200'],
  },
];

// Mas de dos dimensiones: tres indices, tres ciclos.
const dimensiones = (paso, nombre, respuesta, espera = 'ok', mejoras = []) => ({
  serie: 'arreglos-dimensiones',
  paso,
  nombre,
  respuesta,
  espera,
  mejoras,
});

const CASOS_DE_DIMENSIONES = [
  // 1: declarar con el tamano justo
  dimensiones(1, 'con constantes', '#define CURSOS 3\n#define MAX_ALUMNOS 30\n#define PARCIALES 4\n\nint notas[CURSOS][MAX_ALUMNOS][PARCIALES];'),
  dimensiones(1, 'con los numeros: correcto y mejorable', 'int notas[3][30][4];', 'ok', ['NUMERO_MAGICO']),
  {
    ...dimensiones(1, 'los cursos y los alumnos al reves', 'int notas[30][3][4];', ['DIMENSIONES_AL_REVES']),
    dice: ['entre los primeros corchetes va la cantidad de cursos', 'la de alumnos'],
  },
  {
    ...dimensiones(1, 'un parcial de menos', 'int notas[3][30][3];', ['ARREGLO_CHICO']),
    dice: ['`notas` puede guardar 3 parciales y hay que guardar 4'],
  },
  {
    ...dimensiones(1, 'lugar de mas para los alumnos', 'int notas[3][40][4];', ['ARREGLO_GRANDE']),
    dice: ['40 alumnos', 'la consigna pide 30'],
  },
  {
    ...dimensiones(1, 'solo dos dimensiones', 'int notas[30][4];', ['TABLA_DIMENSIONES']),
    dice: ['tiene 2 dimensiones', 'un arreglo de tres dimensiones: una para los cursos, otra para los alumnos y otra para los parciales'],
  },
  dimensiones(1, 'una sola dimension', 'int notas[30];', ['TABLA_UNA_DIMENSION']),
  dimensiones(1, 'con decimales', 'float notas[3][30][4];', ['VARIABLE_TIPO']),
  dimensiones(1, 'sin la cantidad de parciales', 'int notas[3][30][];', ['ARREGLO_SIN_DIMENSION']),

  // 2: cuestionario, que hay en una posicion
  dimensiones(2, 'posicion: la correcta', '2'),
  dimensiones(2, 'posicion: curso y alumno cambiados', '0', ['OPCION_CURSO_Y_ALUMNO_CAMBIADOS']),
  dimensiones(2, 'posicion: alumno y parcial cambiados', '1', ['OPCION_ALUMNO_Y_PARCIAL_CAMBIADOS']),

  // 3: cuestionario, que hay en un nivel
  dimensiones(3, 'nivel: la lista del alumno', '2'),
  dimensiones(3, 'nivel: el curso y el alumno cambiados', '0', ['OPCION_CURSO_Y_ALUMNO_CAMBIADOS']),
  dimensiones(3, 'nivel: una nota de cada alumno', '1', ['OPCION_UNA_COLUMNA']),

  // 4: corregir una nota
  dimensiones(4, 'la posicion', 'notas[1][2][3] = 9;'),
  dimensiones(4, 'con una cuenta', 'notas[1][2][3] = 4 + 5;'),
  dimensiones(4, 'el parcial equivocado', 'notas[1][2][2] = 9;', ['RESULTADO_VALOR_DISTINTO']),
  dimensiones(4, 'el curso equivocado', 'notas[0][2][3] = 9;', ['RESULTADO_VALOR_DISTINTO']),
  {
    ...dimensiones(4, 'contando desde uno', 'notas[2][3][4] = 9;', ['INDICE_FUERA_DE_RANGO']),
    dice: ['`notas` tiene 2'],
  },
  dimensiones(4, 'otro valor', 'notas[1][2][3] = 8;', ['RESULTADO_VALOR_DISTINTO']),

  // 5: todas en cero
  dimensiones(5, 'con tres for', 'for (i = 0; i < CURSOS; i++) {\n  for (j = 0; j < ALUMNOS; j++) {\n    for (k = 0; k < PARCIALES; k++) {\n      notas[i][j][k] = 0;\n    }\n  }\n}'),
  dimensiones(5, 'con otro orden', 'for (k = 0; k < PARCIALES; k++) {\n  for (j = 0; j < ALUMNOS; j++) {\n    for (i = 0; i < CURSOS; i++) {\n      notas[i][j][k] = 0;\n    }\n  }\n}'),
  dimensiones(5, 'con los numeros sueltos: correcto y mejorable', 'for (i = 0; i < 2; i++) {\n  for (j = 0; j < 3; j++) {\n    for (k = 0; k < 4; k++) {\n      notas[i][j][k] = 0;\n    }\n  }\n}', 'ok', ['LIMITE_CON_NUMERO_SUELTO']),
  dimensiones(5, 'sin el ultimo parcial', 'for (i = 0; i < CURSOS; i++) {\n  for (j = 0; j < ALUMNOS; j++) {\n    for (k = 0; k < PARCIALES - 1; k++) {\n      notas[i][j][k] = 0;\n    }\n  }\n}', ['RECORRIDO_INCOMPLETO']),
  dimensiones(5, 'con los limites cambiados', 'for (i = 0; i < PARCIALES; i++) {\n  for (j = 0; j < ALUMNOS; j++) {\n    for (k = 0; k < CURSOS; k++) {\n      notas[i][j][k] = 0;\n    }\n  }\n}', ['INDICE_FUERA_DE_RANGO']),
  dimensiones(5, 'con un cero que no es de cada posicion', 'for (i = 0; i < CURSOS; i++) {\n  for (j = 0; j < ALUMNOS; j++) {\n    for (k = 0; k < PARCIALES; k++) {\n      notas[i][j][k] = 1;\n    }\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),

  // 6: la suma de todas las notas
  dimensiones(6, 'con tres for', 'total = 0;\nfor (i = 0; i < CURSOS; i++) {\n  for (j = 0; j < ALUMNOS; j++) {\n    for (k = 0; k < PARCIALES; k++) {\n      total += notas[i][j][k];\n    }\n  }\n}'),
  dimensiones(6, 'con el curso adentro', 'total = 0;\nfor (k = 0; k < PARCIALES; k++) {\n  for (j = 0; j < ALUMNOS; j++) {\n    for (i = 0; i < CURSOS; i++) {\n      total += notas[i][j][k];\n    }\n  }\n}'),
  dimensiones(6, 'sin iniciar el total', 'for (i = 0; i < CURSOS; i++) {\n  for (j = 0; j < ALUMNOS; j++) {\n    for (k = 0; k < PARCIALES; k++) {\n      total += notas[i][j][k];\n    }\n  }\n}', ['VARIABLE_SIN_VALOR']),
  dimensiones(6, 'sin recorrer el ultimo curso', 'total = 0;\nfor (i = 0; i < CURSOS - 1; i++) {\n  for (j = 0; j < ALUMNOS; j++) {\n    for (k = 0; k < PARCIALES; k++) {\n      total += notas[i][j][k];\n    }\n  }\n}', ['RECORRIDO_INCOMPLETO']),

  // 7: la suma de cada curso
  dimensiones(7, 'con el total en el arreglo', 'for (i = 0; i < CURSOS; i++) {\n  totales[i] = 0;\n  for (j = 0; j < ALUMNOS; j++) {\n    for (k = 0; k < PARCIALES; k++) {\n      totales[i] += notas[i][j][k];\n    }\n  }\n}'),
  {
    ...dimensiones(7, 'el acumulador no vuelve a cero', 'int suma = 0;\nfor (i = 0; i < CURSOS; i++) {\n  for (j = 0; j < ALUMNOS; j++) {\n    for (k = 0; k < PARCIALES; k++) {\n      suma += notas[i][j][k];\n    }\n  }\n  totales[i] = suma;\n}', ['ACUMULADOR_SIN_REINICIAR_POR_FILA']),
    dice: ['`totales` termina con `57` y `110`', 'cada total arrastra lo de las filas anteriores'],
  },
  dimensiones(7, 'sin iniciar los totales', 'for (i = 0; i < CURSOS; i++) {\n  for (j = 0; j < ALUMNOS; j++) {\n    for (k = 0; k < PARCIALES; k++) {\n      totales[i] += notas[i][j][k];\n    }\n  }\n}', ['VARIABLE_SIN_VALOR']),
  dimensiones(7, 'sumando todo en el primero', 'totales[0] = 0;\nfor (i = 0; i < CURSOS; i++) {\n  for (j = 0; j < ALUMNOS; j++) {\n    for (k = 0; k < PARCIALES; k++) {\n      totales[0] += notas[i][j][k];\n    }\n  }\n}', ['RESULTADO_VALOR_DISTINTO']),

  // 8: mostrar un curso como tabla
  dimensiones(8, 'un renglon por alumno', 'for (j = 0; j < ALUMNOS; j++) {\n  for (k = 0; k < PARCIALES; k++) {\n    printf("%d ", notas[1][j][k]);\n  }\n  printf("\\n");\n}'),
  dimensiones(8, 'con tabuladores', 'for (j = 0; j < ALUMNOS; j++) {\n  for (k = 0; k < PARCIALES; k++) {\n    printf("%d\\t", notas[1][j][k]);\n  }\n  printf("\\n");\n}'),
  dimensiones(8, 'el primer curso en lugar del segundo', 'for (j = 0; j < ALUMNOS; j++) {\n  for (k = 0; k < PARCIALES; k++) {\n    printf("%d ", notas[0][j][k]);\n  }\n  printf("\\n");\n}', ['MUESTRA_DISTINTA']),
  dimensiones(8, 'todo en un renglon', 'for (j = 0; j < ALUMNOS; j++) {\n  for (k = 0; k < PARCIALES; k++) {\n    printf("%d ", notas[1][j][k]);\n  }\n}', ['TABLA_SIN_RENGLONES']),
  dimensiones(8, 'los parciales como renglones', 'for (k = 0; k < PARCIALES; k++) {\n  for (j = 0; j < ALUMNOS; j++) {\n    printf("%d ", notas[1][j][k]);\n  }\n  printf("\\n");\n}', ['MUESTRA_DISTINTA']),
];

// Arreglos de caracteres: letras en un arreglo, sin cadenas.
const caracteres = (paso, nombre, respuesta, espera = 'ok', mejoras = []) => ({
  serie: 'arreglos-caracteres',
  paso,
  nombre,
  respuesta,
  espera,
  mejoras,
});

const CICLO_DE_LETRAS = (cuerpo) => `for (i = 0; i < CANTIDAD; i++) {\n${cuerpo}\n}`;

const CASOS_DE_CARACTERES = [

  // 1: definir con valores
  caracteres(1, "letras entre comillas simples", "char calificaciones[] = {'B', 'A', 'C', 'A', 'E', 'B'};", 'ok'),
  caracteres(1, 'con la cantidad justa: correcto y mejorable', "char calificaciones[6] = {'B', 'A', 'C', 'A', 'E', 'B'};", 'ok', [
    'DIMENSION_REPETIDA',
  ]),
  caracteres(1, 'una letra de menos', "char calificaciones[] = {'B', 'A', 'C', 'A', 'E'};", ['VALORES_DE_MENOS']),
  caracteres(1, 'una letra de mas', "char calificaciones[] = {'B', 'A', 'C', 'A', 'E', 'B', 'D'};", ['VALORES_DE_MAS']),
  {
    ...caracteres(1, 'una letra distinta', "char calificaciones[] = {'B', 'A', 'C', 'A', 'D', 'B'};", ['VALOR_DISTINTO']),
    dice: ["El quinto valor de la lista (`'D'`) no coincide con el del dibujo."],
  },
  caracteres(1, 'las mismas en otro orden', "char calificaciones[] = {'A', 'B', 'A', 'C', 'B', 'E'};", ['VALORES_EN_OTRO_ORDEN']),
  {
    ...caracteres(1, 'sin comillas', 'char calificaciones[] = {B, A, C, A, E, B};', ['LETRA_SIN_COMILLAS']),
    dice: ["`B` sin comillas se lee como el nombre de una variable: cada letra va entre comillas simples, como `'B'`."],
  },
  {
    ...caracteres(1, 'con comillas dobles', 'char calificaciones[] = {"B", "A", "C", "A", "E", "B"};', ['LETRA_ENTRE_COMILLAS_DOBLES']),
    dice: ['`"B"` entre comillas dobles es un texto, no una letra'],
  },
  caracteres(1, 'con numeros', 'char calificaciones[] = {66, 65, 67, 65, 69, 66};', ['LETRA_ES_NUMERO']),
  caracteres(1, 'un texto entre comillas dobles', 'char calificaciones[] = "BACAEB";', ['VALORES_SIN_LISTA']),
  caracteres(1, 'sin valores', 'char calificaciones[6];', ['VALORES_FALTAN']),
  caracteres(1, 'de a una, despues', "char calificaciones[6];\ncalificaciones[0] = 'B';", ['VALORES_APARTE']),
  caracteres(1, 'de enteros', "int calificaciones[] = {'B', 'A', 'C', 'A', 'E', 'B'};", ['VARIABLE_TIPO']),


  // 2: mostrar las letras
  caracteres(2, 'con for', CICLO_DE_LETRAS('  printf("%c ", calificaciones[i]);')),
  {
    ...caracteres(2, 'sin separar', CICLO_DE_LETRAS('  printf("%c", calificaciones[i]);'), ['MUESTRA_SIN_SEPARAR']),
    dice: ['las letras que corresponden, pero la consigna las pide separadas por un espacio y nada más'],
    bloques: ['BACAEB|B A C A E B'],
  },
  caracteres(2, 'con un espacio', CICLO_DE_LETRAS('  printf("%c ", calificaciones[i]);')),
  caracteres(2, 'un renglon por letra', CICLO_DE_LETRAS('  printf("%c\\n", calificaciones[i]);'), ['MUESTRA_SIN_SEPARAR']),
  caracteres(2, 'con un salto al final: se perdona', CICLO_DE_LETRAS('  printf("%c ", calificaciones[i]);') + '\nprintf("\\n");'),
  caracteres(2, 'con while', 'i = 0;\nwhile (i < CANTIDAD) {\n  printf("%c ", calificaciones[i]);\n  i++;\n}'),
  caracteres(2, 'con el numero suelto: correcto y mejorable', 'for (i = 0; i < 6; i++) {\n  printf("%c ", calificaciones[i]);\n}', 'ok', [
    'LIMITE_CON_NUMERO_SUELTO',
  ]),
  {
    ...caracteres(2, 'de atras', 'for (i = CANTIDAD - 1; i >= 0; i--) {\n  printf("%c ", calificaciones[i]);\n}', ['MUESTRA_DISTINTA']),
    dice: ["El programa muestra `'B'`, `'E'`, `'A'`, `'C'`, `'A'` y `'B'` cuando debería mostrar"],
  },
  caracteres(2, 'sin la ultima', 'for (i = 0; i < CANTIDAD - 1; i++) {\n  printf("%c ", calificaciones[i]);\n}', ['MUESTRA_DISTINTA']),
  caracteres(2, 'una sola letra', 'printf("%c ", calificaciones[0]);', ['CICLO_FALTA']),
  {
    ...caracteres(2, 'con el formato de un entero', CICLO_DE_LETRAS('  printf("%d ", calificaciones[i]);'), [
      'FORMATO_NO_CORRESPONDE_AL_TIPO',
    ]),
    dice: ['`%d` es el formato de un entero (`int`), y `calificaciones[i]` es un `char`: el formato que le corresponde es `%c`.'],
  },
  caracteres(2, 'el arreglo entero', CICLO_DE_LETRAS('  printf("%c ", calificaciones);'), ['ARREGLO_SIN_POSICION']),
  caracteres(2, 'un indice de mas', 'for (i = 0; i <= CANTIDAD; i++) {\n  printf("%c ", calificaciones[i]);\n}', ['INDICE_FUERA_DE_RANGO']),
  caracteres(2, 'sin mostrar', CICLO_DE_LETRAS('  i = i;'), ['MUESTRA_FALTA']),

  // 3: contar una letra
  caracteres(3, 'con if', 'cantidad = 0;\n' + CICLO_DE_LETRAS("  if (calificaciones[i] == 'A') {\n    cantidad++;\n  }")),
  caracteres(3, 'con la suma', 'cantidad = 0;\n' + CICLO_DE_LETRAS("  if (calificaciones[i] == 'A') {\n    cantidad = cantidad + 1;\n  }")),
  caracteres(3, 'con while', "cantidad = 0;\ni = 0;\nwhile (i < CANTIDAD) {\n  if (calificaciones[i] == 'A') {\n    cantidad++;\n  }\n  i++;\n}"),
  caracteres(3, 'sin iniciar la cuenta', CICLO_DE_LETRAS("  if (calificaciones[i] == 'A') {\n    cantidad++;\n  }"), ['VARIABLE_SIN_VALOR']),
  caracteres(3, 'cuenta todas', 'cantidad = 0;\n' + CICLO_DE_LETRAS('  cantidad++;'), ['RESULTADO_VALOR_DISTINTO']),
  {
    ...caracteres(3, 'otra letra', 'cantidad = 0;\n' + CICLO_DE_LETRAS("  if (calificaciones[i] == 'B') {\n    cantidad++;\n  }"), [
      'RESULTADO_VALOR_DISTINTO',
    ]),
    dice: ['`cantidad` termina valiendo `2` y debería valer `3`'],
  },
  caracteres(3, 'sin llegar al final', "cantidad = 0;\nfor (i = 0; i < CANTIDAD - 1; i++) {\n  if (calificaciones[i] == 'A') {\n    cantidad++;\n  }\n}", [
    'RESULTADO_VALOR_DISTINTO',
  ]),
  {
    ...caracteres(3, 'con comillas dobles', 'cantidad = 0;\n' + CICLO_DE_LETRAS('  if (calificaciones[i] == "A") {\n    cantidad++;\n  }'), [
      'LETRA_ENTRE_COMILLAS_DOBLES',
    ]),
    dice: ['`"A"` entre comillas dobles es un texto, no una letra: una sola letra va entre comillas simples, como `\'A\'`.'],
  },
  caracteres(3, 'sin ciclo', "cantidad = 0;\nif (calificaciones[0] == 'A') {\n  cantidad++;\n}", ['CICLO_FALTA']),
  caracteres(3, 'con el numero suelto: correcto y mejorable', "cantidad = 0;\nfor (i = 0; i < 8; i++) {\n  if (calificaciones[i] == 'A') {\n    cantidad++;\n  }\n}", 'ok', [
    'LIMITE_CON_NUMERO_SUELTO',
  ]),

  // 4: la primera posicion de una letra
  caracteres(4, 'con while', "i = 0;\nwhile (i < CANTIDAD && calificaciones[i] != 'E') {\n  i++;\n}\nif (i < CANTIDAD) {\n  posicion = i;\n} else {\n  posicion = -1;\n}"),
  caracteres(4, 'con for y break', "posicion = -1;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (calificaciones[i] == 'E') {\n    posicion = i;\n    break;\n  }\n}"),
  caracteres(4, 'con for y la marca', "posicion = -1;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (calificaciones[i] == 'E' && posicion == -1) {\n    posicion = i;\n  }\n}"),
  caracteres(4, 'sin cortar', "posicion = -1;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (calificaciones[i] == 'E') {\n    posicion = i;\n  }\n}", ['BUSQUEDA_SIN_CORTAR']),
  caracteres(4, 'sin el -1', "for (i = 0; i < CANTIDAD; i++) {\n  if (calificaciones[i] == 'E') {\n    posicion = i;\n    break;\n  }\n}", ['RESULTADO_VARIABLE_SIN_VALOR']),
  caracteres(4, 'contando desde uno', "posicion = -1;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (calificaciones[i] == 'E') {\n    posicion = i + 1;\n    break;\n  }\n}", ['RESULTADO_VALOR_DISTINTO']),
  caracteres(4, 'con cero cuando no esta', "posicion = 0;\nfor (i = 0; i < CANTIDAD; i++) {\n  if (calificaciones[i] == 'E') {\n    posicion = i;\n    break;\n  }\n}", ['RESULTADO_VALOR_DISTINTO']),

  // 5: reemplazar una letra por otra
  caracteres(5, 'con if', CICLO_DE_LETRAS("  if (calificaciones[i] == 'E') {\n    calificaciones[i] = 'D';\n  }")),
  caracteres(5, 'con while', "i = 0;\nwhile (i < CANTIDAD) {\n  if (calificaciones[i] == 'E') {\n    calificaciones[i] = 'D';\n  }\n  i++;\n}"),
  {
    ...caracteres(5, 'todas pasan a D', CICLO_DE_LETRAS("  calificaciones[i] = 'D';"), ['RESULTADO_VALOR_DISTINTO']),
    dice: ["`calificaciones[0]` termina valiendo `'D'` y debería valer `'B'`"],
  },
  caracteres(5, 'otra letra', CICLO_DE_LETRAS("  if (calificaciones[i] == 'E') {\n    calificaciones[i] = 'C';\n  }"), ['RESULTADO_VALOR_DISTINTO']),
  caracteres(5, 'sin llegar al final', "for (i = 0; i < CANTIDAD - 1; i++) {\n  if (calificaciones[i] == 'E') {\n    calificaciones[i] = 'D';\n  }\n}", ['RESULTADO_VALOR_DISTINTO']),
  caracteres(5, 'con comillas dobles', CICLO_DE_LETRAS("  if (calificaciones[i] == 'E') {\n    calificaciones[i] = \"D\";\n  }"), ['ELEMENTO_ENTRE_COMILLAS_DOBLES']),
  caracteres(5, 'sin ciclo', "calificaciones[1] = 'D';\ncalificaciones[3] = 'D';", ['CICLO_FALTA']),

  // 6: cuestionario, cuantas letras hay cargadas
  caracteres(6, 'cantidad: las cargadas', '2'),
  caracteres(6, 'cantidad: el tamano del arreglo', '0', ['OPCION_TAMANO_FISICO']),
  caracteres(6, 'cantidad: la ultima posicion', '1', ['OPCION_ULTIMA_POSICION']),
  // 7: mostrar solo las cargadas (sigue de la anterior)
  caracteres(7, 'hasta cantidad', 'for (i = 0; i < cantidad; i++) {\n  printf("%c ", letras[i]);\n}'),
  caracteres(7, 'con while', 'i = 0;\nwhile (i < cantidad) {\n  printf("%c ", letras[i]);\n  i++;\n}'),
  caracteres(7, 'con el cuatro suelto: correcto y mejorable', 'for (i = 0; i < 4; i++) {\n  printf("%c ", letras[i]);\n}', 'ok', ['LIMITE_SIN_LA_CANTIDAD']),
  {
    ...caracteres(7, 'hasta el tamano del arreglo', 'for (i = 0; i < MAX_LETRAS; i++) {\n  printf("%c ", letras[i]);\n}', ['VARIABLE_SIN_VALOR']),
    dice: ['\`letras[4]\` todavía no tiene un valor cuando se usa'],
  },
  caracteres(7, 'el texto escrito a mano', 'printf("h o l a ");\nfor (i = 0; i < 0; i++) {\n  i++;\n}', ['MUESTRA_FALTA']),
  caracteres(7, 'las letras escritas a mano', 'printf("%c %c %c %c ", \'h\', \'o\', \'l\', \'a\');\nfor (i = 0; i < 0; i++) {\n  i++;\n}', ['MUESTRA_SIN_EL_ARREGLO']),
  caracteres(7, 'sin separar', 'for (i = 0; i < cantidad; i++) {\n  printf("%c", letras[i]);\n}', ['MUESTRA_SIN_SEPARAR']),
  caracteres(7, 'una letra de menos', 'for (i = 0; i < cantidad - 1; i++) {\n  printf("%c ", letras[i]);\n}', ['MUESTRA_DISTINTA']),
  caracteres(7, 'con el formato de un entero', 'for (i = 0; i < cantidad; i++) {\n  printf("%d ", letras[i]);\n}', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  caracteres(7, 'sin mostrar nada', 'for (i = 0; i < cantidad; i++) {\n  i = i;\n}', ['MUESTRA_FALTA']),
  caracteres(7, 'sin ciclo', 'printf("%c ", letras[0]);', ['CICLO_FALTA']),
];

// Usar los campos de una variable de estructura.
const usar = (paso, nombre, respuesta, espera = 'ok') => ({
  serie: 'estructuras-campos',
  paso,
  nombre,
  respuesta,
  espera,
});

const CASOS_DE_USAR_CAMPOS = [
  // 1: el legajo
  usar(1, 'legajo', 'alumno.legajo = 20431;', 'ok'),
  usar(1, 'legajo, sin espacios', 'alumno.legajo=20431;', 'ok'),
  usar(1, 'legajo, en dos pasos que dan lo mismo', 'alumno.legajo = 1;\nalumno.legajo = 20431;', 'ok'),
  usar(1, 'el campo sin la variable', 'legajo = 20431;', ['CAMPO_SIN_VARIABLE']),
  usar(1, 'el tipo en vez de la variable', 'Alumno.legajo = 20431;', ['TIPO_EN_VEZ_DE_VARIABLE']),
  usar(1, 'la flecha', 'alumno->legajo = 20431;', ['FLECHA_CON_VARIABLE']),
  usar(1, 'una variable que no existe', 'alumn.legajo = 20431;', ['VARIABLE_DESCONOCIDA']),
  usar(1, 'la variable con mayuscula', 'Alumno1.legajo = 20431;', ['VARIABLE_DESCONOCIDA']),
  usar(1, 'un campo que no existe', 'alumno.codigo = 20431;', ['CAMPO_NO_EXISTE']),
  usar(1, 'el campo con mayuscula', 'alumno.Legajo = 20431;', ['CAMPO_NO_EXISTE']),
  usar(1, 'con igual doble', 'alumno.legajo == 20431;', ['ASIGNACION_CON_IGUAL_DOBLE']),
  usar(1, 'otro valor', 'alumno.legajo = 20341;', ['ASIGNACION_VALOR_DISTINTO']),
  usar(1, 'el numero entre comillas', 'alumno.legajo = "20431";', ['VALOR_ENTRE_COMILLAS']),
  usar(1, 'el campo de otra consigna', 'alumno.promedio = 8.45;', ['CAMPO_SIN_CARGAR']),
  usar(1, 'sin el punto y coma', 'alumno.legajo = 20431', ['FALTA_PUNTO_Y_COMA']),
  // 3: el promedio y el turno
  usar(3, 'promedio y turno', "alumno.promedio = 8.45;\nalumno.turno = 'T';", 'ok'),
  usar(3, 'turno y promedio', "alumno.turno = 'T';\nalumno.promedio = 8.45;", 'ok'),
  usar(3, 'el promedio con f', "alumno.promedio = 8.45f;\nalumno.turno = 'T';", 'ok'),
  usar(3, 'el turno entre comillas dobles', 'alumno.promedio = 8.45;\nalumno.turno = "T";', ['LETRA_ENTRE_COMILLAS_DOBLES']),
  usar(3, 'el turno sin comillas', 'alumno.promedio = 8.45;\nalumno.turno = T;', ['LETRA_SIN_COMILLAS']),
  usar(3, 'el turno como numero', 'alumno.promedio = 8.45;\nalumno.turno = 84;', ['LETRA_ES_NUMERO']),
  usar(3, 'otra letra', "alumno.promedio = 8.45;\nalumno.turno = 'M';", ['ASIGNACION_VALOR_DISTINTO']),
  usar(3, 'la minuscula', "alumno.promedio = 8.45;\nalumno.turno = 't';", ['ASIGNACION_VALOR_DISTINTO']),
  usar(3, 'otro promedio', "alumno.promedio = 8;\nalumno.turno = 'T';", ['ASIGNACION_VALOR_DISTINTO']),
  usar(3, 'el promedio entre comillas', "alumno.promedio = \"8.45\";\nalumno.turno = 'T';", ['VALOR_ENTRE_COMILLAS']),
  usar(3, 'solo el promedio', 'alumno.promedio = 8.45;', ['CAMPO_SIN_CARGAR']),
  usar(3, 'solo el turno', "alumno.turno = 'T';", ['CAMPO_SIN_CARGAR']),
  usar(3, 'el campo sin la variable', "promedio = 8.45;\nturno = 'T';", ['CAMPO_SIN_VARIABLE']),
  // 2: el apellido y nombre
  usar(2, 'strcpy', 'strcpy(alumno.apellidoNombre, "Perez, Ana");', 'ok'),
  usar(2, 'strncpy', 'strncpy(alumno.apellidoNombre, "Perez, Ana", 50);', 'ok'),
  usar(2, 'asignacion directa', 'alumno.apellidoNombre = "Perez, Ana";', ['ASIGNACION_DE_ARREGLO']),
  usar(2, 'la variable entera', 'strcpy(alumno, "Perez, Ana");', ['ARGUMENTO_SIN_CAMPO']),
  usar(2, 'otro campo', 'strcpy(alumno.promedio, "Perez, Ana");', ['ARGUMENTO_OTRO_CAMPO']),
  usar(2, 'el campo sin la variable', 'strcpy(apellidoNombre, "Perez, Ana");', ['CAMPO_SIN_VARIABLE']),
  usar(2, 'el tipo en vez de la variable', 'strcpy(Alumno.apellidoNombre, "Perez, Ana");', ['TIPO_EN_VEZ_DE_VARIABLE']),
  usar(2, 'la flecha', 'strcpy(alumno->apellidoNombre, "Perez, Ana");', ['FLECHA_CON_VARIABLE']),
  usar(2, 'argumentos al reves', 'strcpy("Perez, Ana", alumno.apellidoNombre);', ['ARGUMENTOS_EN_OTRO_ORDEN']),
  usar(2, 'otro texto', 'strcpy(alumno.apellidoNombre, "Perez Ana");', ['TEXTO_DISTINTO']),
  usar(2, 'otra funcion', 'strcat(alumno.apellidoNombre, "Perez, Ana");', ['FUNCION_EQUIVOCADA']),
  usar(2, 'a mano', "alumno.apellidoNombre[0] = 'P';\nalumno.apellidoNombre[1] = 'e';", ['A_MANO']),
  // 4 a 6: los cuestionarios
  usar(4, 'sin cargar: no se puede saber', '2'),
  usar(4, 'sin cargar: cero', '0', ['OPCION_SIN_CARGAR_ES_CERO']),
  usar(4, 'sin cargar: ninguno', '1', ['OPCION_SIN_CARGAR_ES_NADA']),
  usar(5, 'dos variables: la primera', '0'),
  usar(5, 'dos variables: la segunda', '1', ['OPCION_CAMPOS_COMPARTIDOS']),
  usar(5, 'dos variables: no se puede saber', '2', ['OPCION_NO_SE_SABE_CAMPO']),
  usar(6, 'primera letra: la P', '0'),
  usar(6, 'primera letra: la e', '1', ['OPCION_CUENTA_DESDE_UNO']),
  usar(6, 'primera letra: el campo completo', '2', ['OPCION_CAMPO_COMPLETO']),
];

export const CASOS = [
  ...CASOS_DE_NOMBRES,
  ...CASOS_DE_VALORES,
  ...CASOS_DE_ARREGLOS,
  ...CASOS_DE_POSICIONES,
  ...CASOS_DE_RECORRER,
  ...CASOS_DE_LEER,
  ...CASOS_DE_ACUMULAR,
  ...CASOS_DE_BUSCAR,
  ...CASOS_DE_TAMANO,
  ...CASOS_DE_TABLAS,
  ...CASOS_DE_RECORRER_TABLAS,
  ...CASOS_DE_DIMENSIONES,
  ...CASOS_DE_CARACTERES,
  ...CASOS_DE_CADENAS,
  ...CASOS_DE_CADENAS_NUEVAS,
  ...CASOS_DE_USAR_CAMPOS,
  ...CASOS_DE_LEER_CAMPOS,
  ...CASOS_DE_COPIAR,
  ...CASOS_DE_ARREGLO_DE_ESTRUCTURAS,
  ...CASOS_DE_RECORRER_ESTRUCTURAS,
  ...CASOS_DE_ARREGLO_SIN_INDICE,
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
