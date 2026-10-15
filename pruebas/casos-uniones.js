// Casos de las series de uniones.
// Mismo formato que casos.js.

const serie = (id) => (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: id,
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

const declarar = serie('uniones-declarar');
const estructuras = serie('estructuras-alumno');
const enumerados = serie('enumerados-declarar');
const etiqueta = serie('uniones-etiqueta');

const UNION = (cuerpo, nombre = 'Medida') => `union ${nombre} {\n${cuerpo}\n};`;
const TRES = '  int entero;\n  double real;\n  char letra;';
const CICLO = (cuerpo) => `for (i = 0; i < MAX_LECTURAS; i++) {\n${cuerpo}\n}`;
const SWITCH = (entero, real, letra) =>
  `switch (lectura.tipo) {\n  case ENTERO:\n    printf("%d", lectura.medida.${entero});\n    break;\n  case REAL:\n    printf("%.1f", lectura.medida.${real});\n    break;\n  case LETRA:\n    printf("%c", lectura.medida.${letra});\n    break;\n}`;

export const CASOS_DE_UNIONES = [
  // ---- declarar y usar ----
  // 1: la union
  declarar(1, 'los tres miembros', UNION(TRES), 'ok', { mejoras: [] }),
  declarar(1, 'con float', UNION('  int entero;\n  float real;\n  char letra;')),
  declarar(1, 'en una sola linea', 'union Medida { int entero; double real; char letra; };'),
  declarar(1, 'otro nombre', UNION(TRES, 'Dato')),
  declarar(1, 'con typedef', 'typedef union Medida {\n' + TRES + '\n} TMedida;'),
  declarar(1, 'una estructura', 'struct Medida {\n' + TRES + '\n};', ['UNION_FALTA'], {
    dice: ['una estructura con `struct`', 'se declara con la palabra `union`'],
  }),
  declarar(1, 'sin nada', 'int entero;', ['UNION_FALTA']),
  declarar(1, 'sin nombre', 'union {\n' + TRES + '\n};', ['UNION_SIN_NOMBRE']),
  declarar(1, 'sin un miembro', UNION('  int entero;\n  double real;'), ['CAMPO_FALTA'], {
    dice: ['Falta el miembro `letra`'],
  }),
  declarar(1, 'un miembro mal escrito', UNION('  int entero;\n  double Real;\n  char letra;'), ['CAMPO_NOMBRE'], {
    dice: ['El miembro `Real`'],
  }),
  declarar(1, 'el real es un entero', UNION('  int entero;\n  int real;\n  char letra;'), ['CAMPO_TIPO']),
  declarar(1, 'la letra es una cadena', UNION('  int entero;\n  double real;\n  char letra[10];'), ['CAMPO_ES_ARREGLO']),
  declarar(1, 'un miembro de mas', UNION(TRES + '\n  int otro;'), 'ok', { avisos: ['CAMPO_DE_MAS'] }),
  // 2: la variable
  declarar(2, 'con union', 'union Medida unaMedida;', 'ok', { mejoras: [] }),
  declarar(2, 'sin la palabra union', 'Medida unaMedida;', ['TIPO_DESCONOCIDO'], {
    dice: ['es el nombre de una unión', 'falta la palabra `union`'],
  }),
  declarar(2, 'con struct', 'struct Medida unaMedida;', ['TIPO_DESCONOCIDO'], {
    dice: ['No hay ninguna estructura llamada', 'es una unión'],
  }),
  declarar(2, 'otro nombre', 'union Medida medida;', ['VARIABLE_NOMBRE']),
  declarar(2, 'un double', 'double unaMedida;', ['VARIABLE_TIPO']),
  declarar(2, 'una union que no existe', 'union Dato unaMedida;', ['TIPO_DESCONOCIDO'], {
    dice: ['No hay ninguna unión llamada `Dato`'],
  }),
  // 3: el alias
  declarar(3, 'el alias', 'typedef union Medida TMedida;', 'ok', { mejoras: [] }),
  declarar(3, 'otro nombre', 'typedef union Medida Medicion;', ['ALIAS_NOMBRE']),
  declarar(3, 'sin typedef', 'union Medida TMedida;', ['ALIAS_FALTA']),
  // 4: una variable con el alias
  declarar(4, 'con el alias', 'TMedida otraMedida;', 'ok', { mejoras: [] }),
  declarar(4, 'con union y el alias', 'union TMedida otraMedida;', ['TIPO_DESCONOCIDO'], {
    dice: ['es un alias', 'sin la palabra `union`'],
  }),
  declarar(4, 'otro nombre', 'TMedida medida;', ['VARIABLE_NOMBRE']),
  // 5: la union y su alias en una sola sentencia
  declarar(5, 'junto', 'typedef union {\n  int porcentaje;\n  char nivel;\n} TBateria;', 'ok', { mejoras: [] }),
  declarar(5, 'con nombre y alias', 'typedef union Bateria {\n  int porcentaje;\n  char nivel;\n} TBateria;'),
  declarar(5, 'sin el alias', 'union {\n  int porcentaje;\n  char nivel;\n};', ['UNION_SIN_NOMBRE']),
  declarar(5, 'otro alias', 'typedef union {\n  int porcentaje;\n  char nivel;\n} TEstado;', ['ALIAS_NOMBRE']),
  declarar(5, 'una estructura', 'typedef struct {\n  int porcentaje;\n  char nivel;\n} TBateria;', ['UNION_FALTA']),
  // 6: guardar un valor
  declarar(6, 'en real', 'lectura.real = 36.5;', 'ok', { mejoras: [] }),
  declarar(6, 'en el entero', 'lectura.entero = 36;', ['CAMPO_SIN_CARGAR']),
  declarar(6, 'el valor sin decimales', 'lectura.real = 36;', ['ASIGNACION_VALOR_DISTINTO']),
  declarar(6, 'en dos miembros', 'lectura.entero = 7;\nlectura.real = 36.5;', ['CAMPO_NO_PEDIDO']),
  declarar(6, 'sin la variable', 'real = 36.5;', ['CAMPO_SIN_VARIABLE'], { dice: ['miembro de la unión'] }),
  declarar(6, 'un miembro que no existe', 'lectura.reales = 36.5;', ['CAMPO_NO_EXISTE'], {
    dice: ['La unión no tiene ningún miembro llamado `reales`'],
  }),
  declarar(6, 'la union entera', 'lectura = 36.5;', ['CAMPO_SIN_CARGAR']),
  declarar(6, 'con flecha', 'lectura->real = 36.5;', ['FLECHA_CON_VARIABLE']),
  declarar(6, 'con igual doble', 'lectura.real == 36.5;', ['ASIGNACION_CON_IGUAL_DOBLE']),
  // 7: cuestionario, que miembro tiene el valor
  declarar(7, 'el miembro que tiene el valor: la correcta', '1'),
  declarar(7, 'el miembro que tiene el valor: el primero', '0', ['OPCION_EL_PRIMERO_QUE_SE_GUARDO']),
  declarar(7, 'el miembro que tiene el valor: los dos', '2', ['OPCION_LOS_DOS']),
  declarar(7, 'el miembro que tiene el valor: ninguno', '3', ['OPCION_NINGUNO']),
  // 8: mostrar el valor
  declarar(8, 'el real', 'printf("%.1f", lectura.real);', 'ok', { mejoras: [] }),
  declarar(8, 'con dos decimales', 'printf("%.2f", lectura.real);', ['MUESTRA_DISTINTA']),
  declarar(8, 'el miembro que no tiene el valor', 'printf("%.1f", lectura.entero);', ['UNION_MIEMBRO_NO_VIGENTE'], {
    dice: ['`lectura.entero` no tiene el valor', 'lo último que se guardó fue en `real`'],
  }),
  declarar(8, 'la letra', 'printf("%c", lectura.letra);', ['UNION_MIEMBRO_NO_VIGENTE']),
  declarar(8, 'la union entera', 'printf("%.1f", lectura);', ['CAMPO_ES_UNA_ESTRUCTURA'], {
    dice: ['es una unión entera'],
  }),
  declarar(8, 'con el formato de un entero', 'printf("%d", lectura.real);', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  declarar(8, 'sin mostrar nada', 'lectura.real = 36.5;', ['MUESTRA_FALTA']),
  // 9: cuestionario, cuanto ocupa
  declarar(9, 'cuanto ocupa: la correcta', '1'),
  declarar(9, 'cuanto ocupa: la suma', '0', ['OPCION_LA_SUMA']),
  declarar(9, 'cuanto ocupa: el entero', '2', ['OPCION_EL_ENTERO']),
  declarar(9, 'cuanto ocupa: el char', '3', ['OPCION_EL_CHAR']),

  // ---- una union con etiqueta ----
  // 1: la estructura con la etiqueta
  etiqueta(1, 'etiqueta y medida', 'typedef struct {\n  TTipo tipo;\n  TMedida medida;\n} TLectura;', 'ok', { mejoras: [] }),
  etiqueta(1, 'sin typedef, con etiqueta', 'struct TLectura {\n  TTipo tipo;\n  TMedida medida;\n};', ['ALIAS_FALTA']),
  etiqueta(1, 'la etiqueta es un int', 'typedef struct {\n  int tipo;\n  TMedida medida;\n} TLectura;', ['CAMPO_TIPO'], {
    dice: ['es un enumerado'],
  }),
  etiqueta(1, 'la medida es un double', 'typedef struct {\n  TTipo tipo;\n  double medida;\n} TLectura;', ['CAMPO_TIPO'], {
    dice: ['es una unión dentro de la estructura'],
  }),
  etiqueta(1, 'falta la etiqueta', 'typedef struct {\n  TMedida medida;\n} TLectura;', ['CAMPO_FALTA']),
  etiqueta(1, 'otro alias', 'typedef struct {\n  TTipo tipo;\n  TMedida medida;\n} TRegistro;', ['ALIAS_NOMBRE']),
  etiqueta(1, 'una union en vez de la estructura', 'typedef union {\n  TTipo tipo;\n  TMedida medida;\n} TLectura;', ['STRUCT_FALTA'], {
    dice: ['Declaró una unión con `union`'],
  }),
  // 2: guardar el valor
  etiqueta(2, 'en real, dentro de medida', 'lectura.medida.real = 36.5;', 'ok', { mejoras: [] }),
  etiqueta(2, 'en el entero', 'lectura.medida.entero = 36;', ['CAMPO_SIN_CARGAR']),
  etiqueta(2, 'saltando la union', 'lectura.real = 36.5;', ['CAMPO_DE_OTRO_NIVEL']),
  etiqueta(2, 'la union entera', 'lectura.medida = 36.5;', ['CAMPO_ES_UNA_ESTRUCTURA'], {
    dice: ['es una unión entera'],
  }),
  etiqueta(2, 'tambien la etiqueta', 'lectura.tipo = REAL;\nlectura.medida.real = 36.5;', ['CAMPO_NO_PEDIDO']),
  // 3: guardar la etiqueta
  etiqueta(3, 'REAL', 'lectura.tipo = REAL;', 'ok', { mejoras: [] }),
  etiqueta(3, 'con el numero', 'lectura.tipo = 1;', 'ok', { mejoras: ['ENUM_CON_NUMERO'] }),
  etiqueta(3, 'otra etiqueta', 'lectura.tipo = ENTERO;', ['ASIGNACION_VALOR_DISTINTO']),
  etiqueta(3, 'entre comillas', 'lectura.tipo = "REAL";', ['ENUM_COMO_TEXTO']),
  etiqueta(3, 'el valor otra vez', 'lectura.medida.real = 36.5;', ['CAMPO_SIN_CARGAR']),
  // 4: mostrar segun la etiqueta
  etiqueta(4, 'un switch', SWITCH('entero', 'real', 'letra'), 'ok', { mejoras: [] }),
  etiqueta(4, 'cada caso con el miembro de otro', SWITCH('real', 'real', 'letra'), ['UNION_MIEMBRO_NO_VIGENTE']),
  etiqueta(4, 'el real con el entero', SWITCH('entero', 'entero', 'letra'), ['UNION_MIEMBRO_NO_VIGENTE'], {
    dice: ['`lectura.medida.entero` no tiene el valor'],
  }),
  etiqueta(4, 'sin switch', 'printf("%.1f", lectura.medida.real);', ['SWITCH_FALTA']),
  etiqueta(4, 'con if en vez de switch', 'if (lectura.tipo == REAL) {\n  printf("%.1f", lectura.medida.real);\n}', ['SWITCH_FALTA']),
  etiqueta(4, 'sin break', 'switch (lectura.tipo) {\n  case ENTERO:\n    printf("%d", lectura.medida.entero);\n  case REAL:\n    printf("%.1f", lectura.medida.real);\n    break;\n  case LETRA:\n    printf("%c", lectura.medida.letra);\n    break;\n}', ['SWITCH_SIN_BREAK']),
  // 5: contar las lecturas de un tipo
  etiqueta(5, 'cuenta los reales', CICLO('  if (lecturas[i].tipo == REAL) {\n    cantidad++;\n  }'), 'ok', { mejoras: [] }),
  etiqueta(5, 'cuenta los enteros', CICLO('  if (lecturas[i].tipo == ENTERO) {\n    cantidad++;\n  }'), ['RESULTADO_VALOR_DISTINTO']),
  etiqueta(5, 'con el numero', CICLO('  if (lecturas[i].tipo == 1) {\n    cantidad++;\n  }'), 'ok', { mejoras: ['ENUM_CON_NUMERO'] }),
  etiqueta(5, 'se pasa del arreglo', `for (i = 0; i <= MAX_LECTURAS; i++) {\n  if (lecturas[i].tipo == REAL) {\n    cantidad++;\n  }\n}`, ['INDICE_FUERA_DE_RANGO']),
  etiqueta(5, 'sin el indice', CICLO('  if (lecturas.tipo == REAL) {\n    cantidad++;\n  }'), ['ARREGLO_SIN_INDICE']),
  // 6: sumar los valores reales
  etiqueta(6, 'suma los reales', CICLO('  if (lecturas[i].tipo == REAL) {\n    total += lecturas[i].medida.real;\n  }'), 'ok', { mejoras: [] }),
  etiqueta(6, 'suma sin mirar la etiqueta', CICLO('  total += lecturas[i].medida.real;'), ['UNION_MIEMBRO_NO_VIGENTE']),
  etiqueta(6, 'suma el miembro que no es', CICLO('  if (lecturas[i].tipo == REAL) {\n    total += lecturas[i].medida.entero;\n  }'), ['UNION_MIEMBRO_NO_VIGENTE']),
  etiqueta(6, 'suma los enteros', CICLO('  if (lecturas[i].tipo == ENTERO) {\n    total += lecturas[i].medida.entero;\n  }'), ['RESULTADO_VALOR_DISTINTO']),

  // ---- typedef sin la palabra struct, union o enum ----
  // Se dice cual falta cuando la consigna pide la estructura, la union o el enumerado.
  estructuras(5, 'typedef sin struct', 'typedef {\n  int codigo;\n  char nombre[40];\n  int cupo;\n} TMateria;', ['TYPEDEF_SIN_TIPO'], {
    dice: ['falta la palabra `struct`', 'typedef struct { ... } Nombre;'],
  }),
  declarar(5, 'typedef sin union', 'typedef {\n  int porcentaje;\n  char nivel;\n} TBateria;', ['TYPEDEF_SIN_TIPO'], {
    dice: ['falta la palabra `union`'],
  }),
  enumerados(8, 'typedef sin enum', 'typedef {\n  MANANA,\n  TARDE,\n  NOCHE\n} TTurno;', ['TYPEDEF_SIN_TIPO'], {
    dice: ['falta la palabra `enum`'],
  }),
  // Si la consigna pide solo el alias, no hay llave: sigue el mensaje general.
  estructuras(3, 'typedef con llaves donde se pide solo el alias', 'typedef {\n  int a;\n} TAlumno;', ['NO_SE_ENTIENDE']),
];
