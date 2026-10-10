// Casos de prueba del corrector, sobre la serie consignas/estructuras.json.
//
//   paso:      a que consigna de la serie responde (1 = la primera)
//   respuesta: lo que escribe el alumno
//   espera:    'ok', o la lista de codigos de error que tienen que salir
//   avisos:    codigos de aviso que tienen que salir (no hacen fallar la respuesta)
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

export const SERIE = '../consignas/estructuras.json';

export const CASOS = [
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
    respuesta: campos('char nombreFantasia[MAX];\nchar titular[MAX];\nfloat montoRecaudado;\nlong cantidadVentas;'),
    espera: 'ok',
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
