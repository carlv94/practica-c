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

const TYPEDEF_SIN_ETIQUETA = `typedef struct {
  char nombreFantasia[50];
  char titular[50];
  float montoRecaudado;
  int cantidadVentas;
} Puesto;`;

const campos = (cuerpo) => `struct Puesto {\n${cuerpo}\n};`;

// Las sentencias de la serie de cadenas.
const cadenas = (paso, nombre, respuesta, espera) => ({ serie: 'cadenas', paso, nombre, respuesta, espera });

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
  serie: 'arreglos',
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
  arreglos(1, 'otro nombre', '#define MAX 20\nint nota[MAX];', ['VARIABLE_NOMBRE']),
  arreglos(1, 'el #define sin el arreglo', '#define MAX 20', ['VARIABLE_FALTA']),
  arreglos(2, 'usa la constante del paso anterior', 'float promedios[MAX_ALUMNOS];', 'ok'),
  arreglos(2, 'double tambien es real', 'double promedios[MAX_ALUMNOS];', 'ok'),
  arreglos(2, 'numero suelto en el segundo paso', 'float promedios[20];', 'ok', ['NUMERO_MAGICO']),
  arreglos(2, 'constante mal escrita', 'float promedios[MAX_ALUMNO];', ['CONSTANTE_SIN_DEFINIR']),
];

export const CASOS = [
  ...CASOS_DE_ARREGLOS,
  ...CASOS_DE_CADENAS,
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
    nombre: 'variable dentro de main',
    paso: 2,
    respuesta: 'int main() {\n  struct Puesto p;\n  return 0;\n}',
    espera: 'ok',
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
