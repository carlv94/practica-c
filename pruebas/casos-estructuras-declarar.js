// Casos de la serie "Declarar estructuras y darles un alias" (estructuras-alumno).
// Mismo formato que casos.js.

const TYPEDEF_SIN_ETIQUETA = `typedef struct {
  char apellidoNombre[50];
  int legajo;
  float promedio;
  char turno;
} Alumno;`;

const campos = (cuerpo) => `struct Alumno {\n${cuerpo}\n};`;
const CAMPOS = 'int legajo;\nchar apellidoNombre[50];\nfloat promedio;\nchar turno;';

const caso = (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: 'estructuras-alumno',
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

const MATERIA = (cuerpo, cierre = 'TMateria') => `typedef struct {\n${cuerpo}\n} ${cierre};`;

export const CASOS_DE_DECLARAR_ESTRUCTURAS = [
  // ---- 1: declarar la estructura ----
  caso(
    1,
    'otro nombre, otras dimensiones, otro orden, double y unsigned',
    'struct Local\n{\n    char turno;\n    double promedio;\n    char apellidoNombre[100];\n    int unsigned legajo;\n};'
  ),
  caso(1, 'typedef sin etiqueta', TYPEDEF_SIN_ETIQUETA.replace('char apellidoNombre[50];\n  int legajo;', 'int legajo;\n  char apellidoNombre[50];')),
  caso(1, 'todo en un renglon', 'struct A{int legajo;char apellidoNombre[9];float promedio;char turno;};'),
  caso(1, 'dimension con una constante', '#define MAX 40\n' + campos('int legajo;\nchar apellidoNombre[MAX];\nfloat promedio;\nchar turno;'), 'ok', {
    mejoras: [],
  }),
  caso(
    1,
    'dimension con una constante que nadie definio',
    campos('int legajo;\nchar apellidoNombre[MAX];\nfloat promedio;\nchar turno;'),
    ['CONSTANTE_SIN_DEFINIR']
  ),
  caso(1, 'un numero suelto no se marca si la serie no pide la practica', campos(CAMPOS), 'ok', { mejoras: [] }),
  caso(1, 'un campo de mas avisa pero vale', campos(CAMPOS + '\nint numero;'), 'ok', { avisos: ['CAMPO_DE_MAS'] }),
  caso(1, 'falta un campo', campos('int legajo;\nfloat promedio;\nchar turno;'), ['CAMPO_FALTA']),
  caso(1, 'campo con mayuscula', campos('int legajo;\nchar apellidoNombre[50];\nfloat Promedio;\nchar turno;'), ['CAMPO_NOMBRE']),
  caso(1, 'campo mal tipeado', campos('int legajo;\nchar apellidoNombre[50];\nfloat promedo;\nchar turno;'), ['CAMPO_NOMBRE']),
  caso(1, 'cadena sin corchetes', campos('int legajo;\nchar apellidoNombre;\nfloat promedio;\nchar turno;'), ['CAMPO_CADENA_SIN_DIMENSION']),
  caso(1, 'cadena como puntero', campos('int legajo;\nchar *apellidoNombre;\nfloat promedio;\nchar turno;'), ['CAMPO_CADENA_PUNTERO']),
  caso(1, 'cadena de un solo lugar', campos('int legajo;\nchar apellidoNombre[1];\nfloat promedio;\nchar turno;'), ['CAMPO_CADENA_CORTA']),
  caso(1, 'promedio entero y legajo con decimales', campos('float legajo;\nchar apellidoNombre[50];\nint promedio;\nchar turno;'), ['CAMPO_TIPO']),
  caso(1, 'numero con corchetes', campos('int legajo;\nchar apellidoNombre[50];\nfloat promedio[10];\nchar turno;'), ['CAMPO_ES_ARREGLO']),
  caso(1, 'el turno como texto', campos('int legajo;\nchar apellidoNombre[50];\nfloat promedio;\nchar turno[2];'), ['CAMPO_ES_ARREGLO']),
  caso(1, 'string no existe', campos('int legajo;\nstring apellidoNombre;\nfloat promedio;\nchar turno;'), ['TIPO_DESCONOCIDO']),
  caso(1, 'estructura sin nombre', 'struct {\nint legajo;\nchar apellidoNombre[50];\nfloat promedio;\nchar turno;\n};', ['STRUCT_SIN_NOMBRE']),
  caso(1, 'sin el ; del final', 'struct Alumno {\n  int legajo;\n  char apellidoNombre[50];\n  float promedio;\n  char turno;\n}', ['FALTA_PUNTO_Y_COMA']),
  caso(1, 'sin el ; de un campo', 'struct Alumno {\nint legajo;\nchar apellidoNombre[50]\nfloat promedio;\nchar turno;\n};', ['FALTA_PUNTO_Y_COMA']),
  caso(1, 'sin la llave de cierre', 'struct Alumno {\n  int legajo;\n  char apellidoNombre[50];\n  float promedio;\n  char turno;\n;', ['FALTA_LLAVE']),
  caso(1, 'Struct con mayuscula', 'Struct Alumno {\n' + CAMPOS + '\n};', ['PALABRA_CON_MAYUSCULA']),
  caso(1, 'struc mal tipeado', 'struc Alumno {\n' + CAMPOS + '\n};', ['PALABRA_MAL_ESCRITA']),
  caso(1, 'tipo con mayuscula', campos('int legajo;\nchar apellidoNombre[50];\nFloat promedio;\nchar turno;'), ['TIPO_DESCONOCIDO']),
  caso(1, 'campos separados con comas', 'struct Alumno {\nint legajo,\nchar apellidoNombre[50],\nfloat promedio,\nchar turno\n};', ['COMA_POR_PUNTO_Y_COMA']),
  caso(1, 'corchetes pegados al tipo', campos('int legajo;\nchar[50] apellidoNombre;\nfloat promedio;\nchar turno;'), ['CORCHETES_ANTES_DEL_NOMBRE']),
  caso(1, 'parentesis en vez de llaves', 'struct Alumno (\n' + CAMPOS + '\n);', ['PARENTESIS_POR_LLAVES']),
  caso(1, 'campo con valor', campos('int legajo;\nchar apellidoNombre[50];\nfloat promedio = 0;\nchar turno;'), ['VALOR_EN_CAMPO']),
  caso(1, 'corchete sin cerrar', campos('int legajo;\nchar apellidoNombre[50;\nfloat promedio;\nchar turno;'), ['FALTA_CORCHETE']),
  caso(1, 'nada escrito', '   \n', ['VACIO']),
  caso(1, 'una variable no es una estructura', 'int alumno;', ['STRUCT_FALTA']),

  // ---- 2: una variable de la estructura ----
  caso(2, 'variable con struct', 'struct Alumno a;'),
  caso(2, 'variable inicializada', 'struct Alumno a = {20431, "Perez, Ana", 8.5, \'T\'};'),
  caso(2, 'variable dentro de main', 'int main() {\n  struct Alumno a;\n  return 0;\n}', ['MAIN_DE_MAS']),
  caso(2, 'comentarios alrededor', '// la variable { [\nstruct Alumno a; /* listo */'),
  caso(2, 'con typedef sin etiqueta, la variable usa el alias', 'Alumno a;', 'ok', { previas: [TYPEDEF_SIN_ETIQUETA] }),
  caso(2, 'con typedef sin etiqueta, struct Alumno no existe', 'struct Alumno a;', ['TIPO_DESCONOCIDO'], {
    previas: [TYPEDEF_SIN_ETIQUETA],
  }),
  caso(2, 'sin la palabra struct', 'Alumno a;', ['TIPO_DESCONOCIDO']),
  caso(2, 'etiqueta en minuscula', 'struct alumno a;', ['TIPO_DESCONOCIDO']),
  caso(2, 'puntero en vez de variable', 'struct Alumno *a;', ['VARIABLE_PUNTERO']),
  caso(2, 'arreglo en vez de variable', 'struct Alumno a[10];', ['VARIABLE_ARREGLO']),
  caso(2, 'variable de otro tipo', 'int a;', ['VARIABLE_TIPO']),
  caso(2, 'variable sin ;', 'struct Alumno a', ['FALTA_PUNTO_Y_COMA']),
  caso(2, 'un alias no es una variable', 'typedef struct Alumno A;', ['VARIABLE_FALTA']),
  caso(2, 'vuelve a escribir la estructura', campos(CAMPOS) + '\nstruct Alumno a;', ['STRUCT_REDEFINIDA']),
  caso(2, 'llave de mas', 'struct Alumno a;\n}', ['SOBRA_LLAVE']),
  caso(2, 'dos variables con el mismo nombre', 'struct Alumno a;\nstruct Alumno a;', ['VARIABLE_REDEFINIDA']),

  // ---- 3: un alias ----
  caso(3, 'alias', 'typedef struct Alumno AlumnoT;'),
  caso(3, 'alias con el mismo nombre que la etiqueta', 'typedef struct Alumno Alumno;'),
  caso(3, 'alias de un alias', 'typedef Alumno Local;', 'ok', { previas: [TYPEDEF_SIN_ETIQUETA, 'Alumno a;'] }),
  caso(3, 'sin typedef es una variable', 'struct Alumno AlumnoT;', ['ALIAS_FALTA']),
  caso(3, 'alias de puntero', 'typedef struct Alumno *PAlumno;', ['ALIAS_PUNTERO']),
  caso(3, 'alias de otro tipo', 'typedef int AlumnoT;', ['ALIAS_TIPO']),
  caso(3, 'alias sin ;', 'typedef struct Alumno AlumnoT', ['FALTA_PUNTO_Y_COMA']),
  caso(3, 'typedef al reves', 'typedef AlumnoT struct Alumno;', ['TYPEDEF_AL_REVES']),

  // ---- 4: una variable con el alias ----
  caso(4, 'variable con el alias', 'TAlumno a;'),
  caso(4, 'variable con el alias que eligio el alumno', 'Estudiante e;', 'ok', {
    previas: [null, null, 'typedef struct Alumno Estudiante;'],
  }),
  caso(4, 'variable con struct cuando se pide el alias', 'struct Alumno a;', ['VARIABLE_SIN_ALIAS']),
  caso(4, 'alias en minuscula', 'talumno a;', ['TIPO_DESCONOCIDO']),
  caso(4, 'otro nombre', 'TAlumno otro;'),
  caso(4, 'el nombre de la variable de mas arriba', 'TAlumno unAlumno;', ['VARIABLE_REDEFINIDA']),

  // ---- 5: la estructura y su alias en una sola sentencia ----
  caso(5, 'sin etiqueta', MATERIA('  int codigo;\n  char nombre[40];\n  int cupo;'), 'ok', { mejoras: [] }),
  caso(5, 'con etiqueta tambien', 'typedef struct Materia {\n  int codigo;\n  char nombre[40];\n  int cupo;\n} TMateria;'),
  caso(5, 'en otro orden', MATERIA('  char nombre[40];\n  int codigo;\n  int cupo;'), 'ok'),
  caso(5, 'otro alias', MATERIA('  int codigo;\n  char nombre[40];\n  int cupo;', 'Materia'), ['ALIAS_NOMBRE']),
  caso(5, 'sin alias', 'struct Materia {\n  int codigo;\n  char nombre[40];\n  int cupo;\n};', ['ALIAS_FALTA']),
  caso(5, 'sin nombre ni alias', 'struct {\n  int codigo;\n  char nombre[40];\n  int cupo;\n};', ['STRUCT_SIN_NOMBRE']),
  caso(5, 'falta un campo', MATERIA('  int codigo;\n  char nombre[40];'), ['CAMPO_FALTA']),
  caso(5, 'campo mal tipeado', MATERIA('  int codgio;\n  char nombre[40];\n  int cupo;'), ['CAMPO_NOMBRE']),
  caso(5, 'nombre sin dimension', MATERIA('  int codigo;\n  char nombre;\n  int cupo;'), ['CAMPO_CADENA_SIN_DIMENSION']),
  caso(5, 'sin el nombre del alias', 'typedef struct {\n  int codigo;\n  char nombre[40];\n  int cupo;\n};', ['FALTA_NOMBRE']),
];
