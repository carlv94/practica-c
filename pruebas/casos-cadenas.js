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
const HOLA = "frase[0] = 'H';\nfrase[1] = 'o';\nfrase[2] = 'l';\nfrase[3] = 'a';\n";

const CASOS_DE_FIN = [
  // 1: declarar
  fin(1, 'justo para el fin', 'char frase[11];'),
  fin(1, 'con la cuenta escrita', 'char frase[10 + 1];'),
  fin(1, 'con una constante y la cuenta', '#define MAX 10\nchar frase[MAX + 1];'),
  fin(1, 'de mas, tambien entra', 'char frase[20];'),
  fin(1, 'sin el lugar del fin', 'char frase[10];', ['CADENA_SIN_FIN']),
  fin(1, 'sin el lugar del fin, con constante', '#define MAX 10\nchar frase[MAX];', ['CADENA_SIN_FIN']),
  fin(1, 'no alcanza', 'char frase[5];', ['ARREGLO_CHICO']),
  fin(1, 'un solo caracter', 'char frase;', ['VARIABLE_NO_ES_ARREGLO']),
  fin(1, 'otro tipo', 'int frase[11];', ['VARIABLE_TIPO']),
  fin(1, 'con * en vez de corchetes', 'char *frase;', ['VARIABLE_PUNTERO']),
  fin(1, 'sin la cantidad', 'char frase[];', ['ARREGLO_SIN_DIMENSION']),

  // 2: caracter por caracter
  fin(2, 'las cinco posiciones', HOLA + "frase[4] = '\\0';"),
  fin(2, 'en otro orden', "frase[4] = '\\0';\nfrase[3] = 'a';\nfrase[2] = 'l';\nfrase[1] = 'o';\nfrase[0] = 'H';"),
  fin(2, 'el fin como 0: correcto y mejorable', HOLA + 'frase[4] = 0;', 'ok', ['FIN_CON_CERO']),
  fin(2, 'sin el fin', HOLA, ['CADENA_SIN_FIN']),
  fin(2, 'el fin como el caracter 0', HOLA + "frase[4] = '0';", ['FIN_CON_DIGITO']),
  fin(2, 'el fin como espacio', HOLA + "frase[4] = ' ';", ['FIN_CON_ESPACIO']),
  fin(2, 'una letra con comillas dobles', "frase[0] = \"H\";\nfrase[1] = 'o';\nfrase[2] = 'l';\nfrase[3] = 'a';\nfrase[4] = '\\0';", [
    'ELEMENTO_ENTRE_COMILLAS_DOBLES',
  ]),
  fin(2, 'una minuscula por una mayuscula', "frase[0] = 'h';\nfrase[1] = 'o';\nfrase[2] = 'l';\nfrase[3] = 'a';\nfrase[4] = '\\0';", [
    'ELEMENTO_MAYUSCULA',
  ]),
  fin(2, 'una letra distinta', "frase[0] = 'H';\nfrase[1] = 'o';\nfrase[2] = 'l';\nfrase[3] = 'b';\nfrase[4] = '\\0';", [
    'ELEMENTO_DISTINTO',
  ]),
  fin(2, 'una posicion salteada', "frase[0] = 'H';\nfrase[1] = 'o';\nfrase[3] = 'a';\nfrase[4] = '\\0';", ['ELEMENTO_FALTA']),
  fin(2, 'todo corrido un lugar', "frase[1] = 'H';\nfrase[2] = 'o';\nfrase[3] = 'l';\nfrase[4] = 'a';\nfrase[5] = '\\0';", [
    'ELEMENTOS_CORRIDOS',
  ]),
  fin(2, 'asignar el texto entero', 'frase = "Hola";', ['ASIGNACION_DE_ARREGLO']),
  fin(2, 'con strcpy', 'strcpy(frase, "Hola");', ['ELEMENTOS_CON_FUNCION']),
  fin(2, 'una posicion que no existe', HOLA + "frase[4] = '\\0';\nfrase[11] = 'x';", ['INDICE_FUERA_DE_RANGO']),
  fin(2, 'con un ciclo', "int i;\nfor (i = 0; i < 4; i++) {\n  frase[i] = 'a';\n}", ['ELEMENTO_POSICION']),
  fin(2, 'sin asignaciones', 'int x;', ['ELEMENTOS_FALTAN']),

  // 3 a 5: cuestionarios (la respuesta es el lugar de la opcion)
  fin(3, 'strlen: la correcta', '2'),
  fin(3, 'strlen: el lugar declarado', '0', ['OPCION_TAMANO_DECLARADO']),
  fin(3, 'strlen: cuenta el fin', '1', ['OPCION_CUENTA_EL_FIN']),
  fin(3, 'sin elegir', '', ['OPCION_FALTA']),
  fin(4, 'sizeof: la correcta', '2'),
  fin(4, 'sizeof: las letras', '0', ['OPCION_SIZEOF_CUENTA_LETRAS']),
  fin(5, 'que contiene la variable: la correcta', '1'),
  fin(5, 'que contiene la variable: la ultima letra', '0', ['OPCION_ULTIMA_LETRA']),
  fin(5, 'que contiene la variable: no se sabe', '2', ['OPCION_NO_SE_SABE_FIN']),

  // 6: una letra
  fin(6, 'una letra', 'char letra[2];'),
  fin(6, 'sin el lugar del fin', 'char letra[1];', ['CADENA_SIN_FIN']),
  fin(6, 'un solo caracter', 'char letra;', ['VARIABLE_NO_ES_ARREGLO']),

  // 7: con su texto
  fin(7, 'corchetes vacios', 'char saludo[] = "Hola";'),
  fin(7, 'con el lugar justo: correcto y mejorable', 'char saludo[5] = "Hola";', 'ok', ['CADENA_DIMENSION_INNECESARIA']),
  fin(7, 'con lugar de mas: correcto y mejorable', 'char saludo[20] = "Hola";', 'ok', ['CADENA_DIMENSION_INNECESARIA']),
  fin(7, 'justo para las letras: C lo deja, pero no es una cadena', 'char saludo[4] = "Hola";', ['CADENA_SIN_FIN']),
  fin(7, 'no entra', 'char saludo[3] = "Hola";', ['ARREGLO_CHICO']),
  fin(7, 'otro texto', 'char saludo[] = "hola";', ['TEXTO_DISTINTO']),
  fin(7, 'el texto despues', 'char saludo[10];\nstrcpy(saludo, "Hola");', ['CADENA_SIN_TEXTO']),
  fin(7, 'con una lista de caracteres: correcta y mejorable', "char saludo[] = {'H', 'o', 'l', 'a', '\\0'};", 'ok', [
    'CADENA_COMO_TEXTO',
  ]),
  fin(7, 'con una lista sin el fin', "char saludo[] = {'H', 'o', 'l', 'a'};", ['CADENA_SIN_FIN']),

  // 8: letra por letra
  fin(8, 'la lista con su fin', "char saludo[] = {'H', 'o', 'l', 'a', '\\0'};"),
  fin(8, 'la lista sin el fin pero con lugar', "char saludo[5] = {'H', 'o', 'l', 'a'};"),
  fin(8, 'la lista sin el fin ni lugar', "char saludo[] = {'H', 'o', 'l', 'a'};", ['CADENA_SIN_FIN']),
  fin(8, 'con comillas dobles', 'char saludo[] = "Hola";', ['CADENA_NO_ES_LISTA']),
  fin(8, 'letras con comillas dobles', 'char saludo[] = {"H", "o", "l", "a"};', ['LISTA_DE_CARACTERES']),
  fin(8, 'una letra distinta', "char saludo[] = {'H', 'o', 'l', 'b', '\\0'};", ['VALOR_DISTINTO']),
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

  // 2: vaciar una cadena que tiene texto
  vacia(2, 'el fin en la primera posicion', "nombre[0] = '\\0';"),
  vacia(2, 'con 0: correcta y mejorable', 'nombre[0] = 0;', 'ok', ['FIN_CON_CERO']),
  vacia(2, 'copiando una cadena vacia: correcta y mejorable', 'strcpy(nombre, "");', 'ok', ['VACIAR_CON_FUNCION']),
  vacia(2, 'con un ciclo: correcta y mejorable', "int i;\nfor (i = 0; i < 21; i++) {\n  nombre[i] = '\\0';\n}", 'ok', [
    'VACIAR_DE_MAS',
  ]),
  vacia(2, 'asignando una cadena vacia', 'nombre = "";', ['ASIGNACION_DE_ARREGLO']),
  vacia(2, 'con un espacio', "nombre[0] = ' ';", ['FIN_CON_ESPACIO']),
  vacia(2, 'con el caracter 0', "nombre[0] = '0';", ['FIN_CON_DIGITO']),
  vacia(2, 'una cadena vacia en la posicion', 'nombre[0] = "";', ['ELEMENTO_ENTRE_COMILLAS_DOBLES']),
  vacia(2, 'el fin en la ultima posicion', "nombre[20] = '\\0';", ['VACIAR_OTRA_POSICION']),
  vacia(2, 'el fin en la segunda posicion', "nombre[1] = '\\0';", ['VACIAR_OTRA_POSICION']),
  vacia(2, 'otro caracter en la primera', "nombre[0] = 'x';", ['FIN_DISTINTO']),
  vacia(2, 'nada que la vacie', 'int x;', ['VACIAR_FALTA']),

  // 3 a 5: cuestionarios
  vacia(3, 'largo de una cadena vaciada: la correcta', '2'),
  vacia(3, 'largo de una cadena vaciada: lo que tenia', '0', ['OPCION_VACIAR_NO_CAMBIA']),
  vacia(4, 'el resto de la cadena: la correcta', '1'),
  vacia(4, 'el resto de la cadena: todo borrado', '0', ['OPCION_VACIAR_BORRA_TODO']),
  vacia(5, 'cadena sin iniciar: la correcta', '2'),
  vacia(5, 'cadena sin iniciar: cero', '0', ['OPCION_SIN_INICIAR_ES_VACIA']),
];

const biblioteca = (paso, nombre, respuesta, espera, mejoras) =>
  caso('cadenas-biblioteca', paso, nombre, respuesta, espera, mejoras);

// Los pasos 4 y 5 (copiar y agregar) estan en casos.js, como CASOS_DE_CADENAS.
const CASOS_DE_BIBLIOTECA = [
  // 1: una letra
  biblioteca(1, 'la letra entre comillas simples', "char letra = 'A';"),
  biblioteca(1, 'la letra como numero: correcta y mejorable', 'char letra = 65;', 'ok', ['CARACTER_COMO_NUMERO']),
  biblioteca(1, 'con comillas dobles', 'char letra = "A";', ['CARACTER_CON_COMILLAS_DOBLES']),
  biblioteca(1, 'una minuscula', "char letra = 'a';", ['CARACTER_DISTINTO']),
  biblioteca(1, 'otra letra', "char letra = 'B';", ['CARACTER_DISTINTO']),
  biblioteca(1, 'sin valor', 'char letra;', ['CARACTER_SIN_VALOR']),
  biblioteca(1, 'como arreglo', 'char letra[2] = "A";', ['VARIABLE_ARREGLO']),
  biblioteca(1, 'otro tipo', "int letra = 'A';", ['VARIABLE_TIPO']),
  biblioteca(2, 'sizeof de un texto de una letra: la correcta', '1'),
  biblioteca(2, 'sizeof de un texto de una letra: lo mismo que la letra', '0', ['OPCION_TEXTO_COMO_LETRA']),

  // 3: guardar un texto
  biblioteca(3, 'strcpy', 'strcpy(nombre, "Juan");'),
  biblioteca(3, 'strncpy con la cantidad de la cadena', 'strncpy(nombre, "Juan", 20);'),
  biblioteca(3, 'strncpy con el lugar del fin', 'strncpy(nombre, "Juan", 5);'),
  biblioteca(3, 'strncpy sin el lugar del fin', 'strncpy(nombre, "Juan", 4);', ['COPIA_SIN_FIN']),
  biblioteca(3, 'a mano, caracter por caracter: correcta y mejorable', "nombre[0] = 'J';\nnombre[1] = 'u';\nnombre[2] = 'a';\nnombre[3] = 'n';\nnombre[4] = '\\0';", 'ok', [
    'COPIA_A_MANO',
  ]),
  biblioteca(3, 'a mano, sin el fin', "nombre[0] = 'J';\nnombre[1] = 'u';\nnombre[2] = 'a';\nnombre[3] = 'n';", ['CADENA_SIN_FIN']),
  biblioteca(3, 'a mano, con un ciclo', 'int i;\nfor (i = 0; i < 4; i++) {\n  nombre[i] = "Juan"[i];\n}', ['A_MANO']),
  biblioteca(3, 'argumentos al reves', 'strcpy("Juan", nombre);', ['ARGUMENTOS_EN_OTRO_ORDEN']),
  biblioteca(3, 'comillas simples', "strcpy(nombre, 'Juan');", ['ARGUMENTO_COMILLAS_SIMPLES']),
  biblioteca(3, 'sin comillas', 'strcpy(nombre, Juan);', ['ARGUMENTO_SIN_COMILLAS']),
  biblioteca(3, 'otro texto', 'strcpy(nombre, "Pedro");', ['TEXTO_DISTINTO']),
  biblioteca(3, 'otras mayusculas', 'strcpy(nombre, "juan");', ['TEXTO_DISTINTO']),
  biblioteca(3, 'asignacion directa', 'nombre = "Juan";', ['ASIGNACION_DE_ARREGLO']),
  biblioteca(3, 'otra funcion', 'strcat(nombre, "Juan");', ['FUNCION_EQUIVOCADA']),

  // 6: cuantas letras tiene
  biblioteca(6, 'strlen guardado en la variable', 'largo = strlen(nombre);'),
  biblioteca(6, 'strlen sin guardar', 'strlen(nombre);', ['RESULTADO_PERDIDO']),
  biblioteca(6, 'strlen guardado en otra variable', 'int otro;\notro = strlen(nombre);', ['RESULTADO_EN_OTRA']),
  biblioteca(6, 'con sizeof', 'largo = sizeof(nombre);', ['SIZEOF_NO_CUENTA']),
  biblioteca(6, 'con sizeof menos uno', 'largo = sizeof(nombre) - 1;', ['SIZEOF_NO_CUENTA']),
  biblioteca(6, 'a mano con un ciclo', "int i;\nfor (i = 0; nombre[i] != '\\0'; i++) {\n}\nlargo = i;", ['A_MANO']),
  biblioteca(6, 'el nombre entre comillas', 'largo = strlen("nombre");', ['ARGUMENTO_ENTRE_COMILLAS']),
  biblioteca(6, 'con &', 'largo = strlen(&nombre);', ['ARGUMENTO_CON_AMPERSAND']),

  // 7: comparar
  biblioteca(7, 'strcmp con cero', 'if (strcmp(nombre, "Ana") == 0) {\n  iguales = 1;\n}'),
  biblioteca(7, 'con las cadenas al reves: da lo mismo', 'if (strcmp("Ana", nombre) == 0) {\n  iguales = 1;\n}'),
  biblioteca(7, 'con la negacion: correcta y mejorable', 'if (!strcmp(nombre, "Ana")) {\n  iguales = 1;\n}', 'ok', [
    'STRCMP_SIN_COMPARAR',
  ]),
  biblioteca(7, 'strcmp solo: se cumple al reves', 'if (strcmp(nombre, "Ana")) {\n  iguales = 1;\n}', ['STRCMP_AL_REVES']),
  biblioteca(7, 'comparado con distinto de cero', 'if (strcmp(nombre, "Ana") != 0) {\n  iguales = 1;\n}', ['STRCMP_AL_REVES']),
  biblioteca(7, 'con ==', 'if (nombre == "Ana") {\n  iguales = 1;\n}', ['COMPARAR_CON_IGUAL']),
  biblioteca(7, 'fuera de un if', 'iguales = strcmp(nombre, "Ana") == 0;', ['COMPARACION_FUERA_DEL_IF']),
  biblioteca(7, 'otro texto', 'if (strcmp(nombre, "ana") == 0) {\n  iguales = 1;\n}', ['TEXTO_DISTINTO']),
  biblioteca(7, 'mayor o menor', 'if (strcmp(nombre, "Ana") < 0) {\n  iguales = 1;\n}', ['STRCMP_USO']),
  biblioteca(8, 'que devuelve strcmp: la correcta', '1'),
  biblioteca(8, 'que devuelve strcmp: uno', '0', ['OPCION_STRCMP_IGUALES_ES_UNO']),
  biblioteca(8, 'que devuelve strcmp: verdadero', '2', ['OPCION_STRCMP_ES_BOOLEANO']),

  // 9: leer un texto
  biblioteca(9, 'con el limite', 'scanf("%20s", nombre);'),
  biblioteca(9, 'sin limite: correcta y mejorable', 'scanf("%s", nombre);', 'ok', ['LECTURA_SIN_LIMITE']),
  biblioteca(9, 'con un limite que no deja lugar para el fin', 'scanf("%21s", nombre);', ['LECTURA_SIN_LUGAR_PARA_FIN']),
  biblioteca(9, 'con &', 'scanf("%s", &nombre);', ['ARGUMENTO_CON_AMPERSAND']),
  biblioteca(9, 'con otro formato', 'scanf("%d", nombre);', ['FORMATO_NO_ES_TEXTO']),
  biblioteca(9, 'un solo caracter', 'scanf("%s", nombre[0]);', ['ARGUMENTO_CON_CORCHETES']),
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
  recorrer(1, 'do while', "do {\n  i++;\n} while (nombre[i] != '\\0');"),
  recorrer(1, 'con strlen y <=', 'while (i <= strlen(nombre)) {\n  i++;\n}', ['CICLO_UNO_DE_MAS']),
  recorrer(1, 'hasta el tamano declarado', 'while (i < 21) {\n  i++;\n}', ['CICLO_HASTA_EL_TAMANO']),
  recorrer(1, 'hasta sizeof', 'while (i < sizeof(nombre)) {\n  i++;\n}', ['CICLO_HASTA_EL_TAMANO']),
  recorrer(1, 'al reves', "while (nombre[i] == '\\0') {\n  i++;\n}", ['CICLO_AL_REVES']),
  recorrer(1, 'sin avanzar', "while (nombre[i] != '\\0') {\n}", ['CICLO_SIN_AVANCE']),
  recorrer(1, 'sin ciclo', 'i++;', ['CICLO_FALTA']),
  // No se la reconoce: no se la da por mala, se avisa.
  recorrer(1, 'otra condicion', "while (nombre[i] != 'a') {\n  i++;\n}", 'ok', [], ['CICLO_NO_VERIFICADO']),
  recorrer(2, 'seguimiento: la correcta', '1'),
  recorrer(2, 'seguimiento: todas las letras', '0', ['OPCION_CUENTA_TODAS_LAS_LETRAS']),
  recorrer(2, 'seguimiento: la primera', '2', ['OPCION_CUENTA_UNA_SOLA']),
];

const tablas = (paso, nombre, respuesta, espera, mejoras) =>
  caso('cadenas-tablas', paso, nombre, respuesta, espera, mejoras);

const DIAS = '"lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"';

const CASOS_DE_TABLAS = [
  // 1: la tabla de nombres
  tablas(1, 'con constantes y el lugar del fin', '#define MAX_ESTUDIANTES 30\n#define LARGO_NOMBRE 25\nchar nombres[MAX_ESTUDIANTES][LARGO_NOMBRE + 1];'),
  tablas(1, 'con numeros sueltos: correcta y mejorable', 'char nombres[30][26];', 'ok', ['NUMERO_MAGICO']),
  tablas(1, 'con una sola constante', '#define N 30\nchar nombres[N][26];', 'ok', ['NUMERO_MAGICO']),
  tablas(1, 'de mas', 'char nombres[40][30];', 'ok', ['NUMERO_MAGICO']),
  tablas(1, 'sin el lugar del fin', '#define MAX_ESTUDIANTES 30\n#define LARGO_NOMBRE 25\nchar nombres[MAX_ESTUDIANTES][LARGO_NOMBRE];', ['CADENA_SIN_FIN']),
  tablas(1, 'sin el lugar del fin, con numeros', 'char nombres[30][25];', ['CADENA_SIN_FIN']),
  tablas(1, 'faltan estudiantes', 'char nombres[20][26];', ['ARREGLO_CHICO']),
  tablas(1, 'las dimensiones al reves', 'char nombres[26][30];', ['ARREGLO_CHICO']),
  tablas(1, 'un arreglo', 'char nombres[30];', ['TABLA_UNA_DIMENSION']),
  tablas(1, 'tres dimensiones', 'char nombres[30][26][3];', ['TABLA_DIMENSIONES']),
  tablas(1, 'otro tipo', 'int nombres[30][26];', ['VARIABLE_TIPO']),

  // 2: los dias
  tablas(2, 'con una constante para el ancho', `#define LARGO_DIA 10\nchar dias[][LARGO_DIA] = {${DIAS}};`),
  tablas(2, 'con el ancho suelto: correcta y mejorable', `char dias[][10] = {${DIAS}};`, 'ok', ['NUMERO_MAGICO']),
  tablas(2, 'con la cantidad de filas repetida', `char dias[7][10] = {${DIAS}};`, 'ok', ['NUMERO_MAGICO', 'FILAS_REPETIDAS']),
  tablas(2, 'ancho justo: C lo deja, pero el texto no termina', `char dias[][9] = {${DIAS}};`, ['CADENA_SIN_FIN']),
  tablas(2, 'ancho que no alcanza', `char dias[][8] = {${DIAS}};`, ['ARREGLO_CHICO']),
  tablas(2, 'sin el ancho', `char dias[][] = {${DIAS}};`, ['TABLA_SIN_COLUMNAS']),
  tablas(2, 'con pocas filas', `char dias[5][10] = {${DIAS}};`, ['ARREGLO_CHICO']),
  tablas(2, 'falta un dia', 'char dias[][10] = {"lunes", "martes", "miercoles", "jueves", "viernes", "sabado"};', ['TEXTOS_DE_MENOS']),
  tablas(2, 'otra mayuscula', 'char dias[][10] = {"lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "Domingo"};', ['TEXTO_DISTINTO']),
  tablas(2, 'dias en otro orden', 'char dias[][10] = {"lunes", "martes", "jueves", "miercoles", "viernes", "sabado", "domingo"};', ['TEXTO_DISTINTO']),
  tablas(2, 'comillas simples', `char dias[][10] = {'lunes', "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"};`, ['TEXTO_CON_COMILLAS_SIMPLES']),
  tablas(2, 'cada texto entre llaves', 'char dias[][10] = {{"lunes"}, {"martes"}, {"miercoles"}, {"jueves"}, {"viernes"}, {"sabado"}, {"domingo"}};', ['VALORES_ANIDADOS']),
  tablas(2, 'los textos despues', 'char dias[7][10];\nstrcpy(dias[0], "lunes");', ['VALORES_FALTAN']),

  // 3: una fila
  tablas(3, 'strcpy a la primera fila', 'strcpy(nombres[0], "Ana");'),
  tablas(3, 'con espacios en el indice', 'strcpy(nombres[ 0 ], "Ana");'),
  tablas(3, 'la tabla entera', 'strcpy(nombres, "Ana");', ['ARGUMENTO_TABLA_ENTERA']),
  tablas(3, 'una fila asignada con =', 'nombres[0] = "Ana";', ['ASIGNACION_DE_ARREGLO']),
  tablas(3, 'un solo caracter', 'strcpy(nombres[0][0], "Ana");', ['ARGUMENTO_CON_CORCHETES']),
  tablas(3, 'otra fila', 'strcpy(nombres[1], "Ana");', ['ARGUMENTO_OTRA_FILA']),
  tablas(3, 'una fila que no existe', 'strcpy(nombres[30], "Ana");', ['INDICE_FUERA_DE_RANGO']),
  tablas(3, 'un texto en un caracter', 'nombres[0][0] = "Ana";', ['ELEMENTO_ENTRE_COMILLAS_DOBLES']),

  // 4: vaciar todas las filas
  tablas(4, 'for con la constante', "for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  nombres[i][0] = '\\0';\n}"),
  tablas(4, 'for con el numero', "for (i = 0; i < 30; i++) {\n  nombres[i][0] = '\\0';\n}"),
  tablas(4, 'con strcpy', 'for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  strcpy(nombres[i], "");\n}'),
  tablas(4, 'while', "i = 0;\nwhile (i < MAX_ESTUDIANTES) {\n  nombres[i][0] = '\\0';\n  i++;\n}"),
  tablas(4, 'una fila de mas', "for (i = 0; i <= MAX_ESTUDIANTES; i++) {\n  nombres[i][0] = '\\0';\n}", ['CICLO_SE_PASA']),
  tablas(4, 'una fila de menos', "for (i = 0; i < 29; i++) {\n  nombres[i][0] = '\\0';\n}", ['CICLO_NO_LLEGA']),
  tablas(4, 'siempre la misma fila', "for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  nombres[0][0] = '\\0';\n}", ['CICLO_NO_VACIA']),
  tablas(4, 'el fin en la segunda posicion', "for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  nombres[i][1] = '\\0';\n}", ['CICLO_NO_VACIA']),
  tablas(4, 'asignando la fila entera', 'for (i = 0; i < MAX_ESTUDIANTES; i++) {\n  nombres[i] = "";\n}', ['ASIGNACION_DE_ARREGLO']),
  tablas(4, 'sin avanzar', "for (i = 0; i < MAX_ESTUDIANTES; ) {\n  nombres[i][0] = '\\0';\n}", ['CICLO_SIN_AVANCE']),
  tablas(4, 'sin ciclo', "nombres[0][0] = '\\0';", ['CICLO_FALTA']),

  // 5: una fila es una cadena
  tablas(5, 'fila: la correcta', '1'),
  tablas(5, 'fila: el texto', '0', ['OPCION_FILA_ES_EL_TEXTO']),
  tablas(5, 'fila: el fin', '2', ['OPCION_FIN_EN_LA_PRIMERA']),
];

const typedef = (paso, nombre, respuesta, espera, mejoras) =>
  caso('cadenas-typedef', paso, nombre, respuesta, espera, mejoras);

const CASOS_DE_TYPEDEF = [
  // 1: el tipo
  typedef(1, 'un tipo con el lugar del fin', 'typedef char Nombre[26];'),
  typedef(1, 'con la cuenta', '#define LARGO 25\ntypedef char Nombre[LARGO + 1];'),
  typedef(1, 'con lugar de mas', 'typedef char Nombre[100];'),
  typedef(1, 'sin el lugar del fin', 'typedef char Nombre[25];', ['CADENA_SIN_FIN']),
  typedef(1, 'de pocas letras', 'typedef char Nombre[10];', ['ARREGLO_CHICO']),
  typedef(1, 'de un solo caracter', 'typedef char Nombre;', ['ALIAS_NO_ES_CADENA']),
  typedef(1, 'de otro tipo', 'typedef int Nombre[26];', ['ALIAS_TIPO']),
  typedef(1, 'con *', 'typedef char *Nombre;', ['ALIAS_PUNTERO']),
  typedef(1, 'sin typedef', 'char Nombre[26];', ['ALIAS_FALTA']),
  typedef(1, 'el nombre y el tipo al reves', 'typedef Nombre char[26];', ['TYPEDEF_AL_REVES']),

  // 2: usarlo
  typedef(2, 'una variable del tipo', 'Nombre estudiante;'),
  typedef(2, 'sin usar el tipo', 'char estudiante[26];', ['VARIABLE_SIN_ALIAS']),
  typedef(2, 'varias en vez de una', 'Nombre estudiante[5];', ['VARIABLE_ARREGLO']),
  typedef(2, 'el tipo con otra mayuscula', 'nombre estudiante;', ['TIPO_DESCONOCIDO']),

  // 3: una tabla con el tipo
  typedef(3, 'un arreglo del tipo', 'Nombre curso[30];'),
  typedef(3, 'y llenar una', 'Nombre curso[30];\nstrcpy(curso[0], "Ana");'),
  typedef(3, 'con pocos', 'Nombre curso[20];', ['ARREGLO_CHICO']),
  typedef(3, 'una sola', 'Nombre curso;', ['VARIABLE_NO_ES_ARREGLO']),
  typedef(3, 'sin el tipo', 'char curso[30][26];', ['VARIABLE_SIN_ALIAS']),
];

export const CASOS_DE_CADENAS_NUEVAS = [
  ...CASOS_DE_FIN,
  ...CASOS_DE_VACIA,
  ...CASOS_DE_BIBLIOTECA,
  ...CASOS_DE_RECORRER,
  ...CASOS_DE_TABLAS,
  ...CASOS_DE_TYPEDEF,
];
