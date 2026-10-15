// Casos de las series de enumerados.
// Mismo formato que casos.js.

const serie = (id) => (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: id,
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

const declarar = serie('enumerados-declarar');
const leer = serie('enumerados-leer');
const mostrar = serie('enumerados-mostrar');

const ENUM = (cuerpo, nombre = 'TTurno') => `typedef enum {\n${cuerpo}\n} ${nombre};`;
const ENUM_TURNO = (cuerpo) => `enum Turno {\n${cuerpo}\n};`;
const ENUM_ESTADO = (cuerpo) => `typedef enum {\n${cuerpo}\n} TEstado;`;
const SWITCH_TURNO = (casos) => `switch (turno) {\n${casos}\n}`;
const CASO = (nombre, texto, conBreak = true) =>
  `  case ${nombre}:\n    printf("${texto}");${conBreak ? '\n    break;' : ''}`;

export const CASOS_DE_ENUMERADOS = [
  // ---- declarar y usar ----
  // 1: declarar, sin typedef
  declarar(1, 'los tres nombres', ENUM_TURNO('  MANANA,\n  TARDE,\n  NOCHE'), 'ok', { mejoras: [] }),
  declarar(1, 'en una sola linea', 'enum Turno { MANANA, TARDE, NOCHE };'),
  declarar(1, 'con los valores escritos', ENUM_TURNO('  MANANA = 0,\n  TARDE = 1,\n  NOCHE = 2')),
  declarar(1, 'con typedef ademas', 'typedef enum Turno {\n  MANANA,\n  TARDE,\n  NOCHE\n} TTurno;'),
  declarar(1, 'en minuscula', ENUM_TURNO('  manana,\n  tarde,\n  noche'), ['ENUMERADOR_NOMBRE']),
  declarar(1, 'en otro orden', ENUM_TURNO('  TARDE,\n  MANANA,\n  NOCHE'), ['ENUMERADOR_ORDEN']),
  declarar(1, 'sin el ultimo', ENUM_TURNO('  MANANA,\n  TARDE'), ['ENUMERADOR_FALTA']),
  declarar(1, 'uno de mas', ENUM_TURNO('  MANANA,\n  TARDE,\n  NOCHE,\n  MADRUGADA'), 'ok', { avisos: ['ENUMERADOR_DE_MAS'] }),
  declarar(1, 'empieza en uno', ENUM_TURNO('  MANANA = 1,\n  TARDE,\n  NOCHE'), ['ENUMERADOR_VALOR']),
  declarar(1, 'otro nombre', 'enum Horario {\n  MANANA,\n  TARDE,\n  NOCHE\n};', ['ENUM_ETIQUETA']),
  declarar(1, 'sin nombre', 'enum {\n  MANANA,\n  TARDE,\n  NOCHE\n};', ['ENUM_ETIQUETA']),
  declarar(1, 'una estructura', 'struct Turno {\n  int MANANA;\n};', ['ENUM_FALTA']),
  // 2: la variable
  declarar(2, 'con enum', 'enum Turno turno;', 'ok', { mejoras: [] }),
  declarar(2, 'sin la palabra enum', 'Turno turno;', ['TIPO_DESCONOCIDO'], {
    dice: ['es el nombre de un enumerado', 'falta la palabra `enum`'],
  }),
  declarar(2, 'otro nombre', 'enum Turno horario;', ['VARIABLE_NOMBRE']),
  declarar(2, 'un int', 'int turno;', ['VARIABLE_TIPO']),
  // 3: cuestionario, el valor de un nombre
  declarar(3, 'el valor de TARDE: la correcta', '1'),
  declarar(3, 'el valor de TARDE: el primero', '0', ['OPCION_ES_EL_PRIMERO']),
  declarar(3, 'el valor de TARDE: el ultimo', '2', ['OPCION_ES_EL_ULTIMO']),
  declarar(3, 'el valor de TARDE: solo un nombre', '3', ['OPCION_SOLO_UN_NOMBRE']),
  // 4: guardar un valor
  declarar(4, 'con el nombre', 'turno = TARDE;', 'ok', { mejoras: [] }),
  declarar(4, 'con el numero', 'turno = 1;', 'ok', { mejoras: ['ENUM_CON_NUMERO'] }),
  declarar(4, 'con otro nombre', 'turno = NOCHE;', ['RESULTADO_VALOR_DISTINTO'], {
    dice: ['`turno` termina valiendo `NOCHE` y debería valer `TARDE`'],
  }),
  declarar(4, 'sin guardar', 'int x;', ['RESULTADO_VARIABLE_SIN_VALOR']),
  // 5: comparar
  declarar(5, 'if con el nombre', 'if (turno == NOCHE) {\n  printf("Turno noche");\n}', 'ok', { mejoras: [] }),
  declarar(5, 'if con el numero', 'if (turno == 2) {\n  printf("Turno noche");\n}', 'ok', { mejoras: ['ENUM_CON_NUMERO'] }),
  declarar(5, 'con un solo =', 'if (turno = NOCHE) {\n  printf("Turno noche");\n}', ['ASIGNACION_EN_CONDICION']),
  declarar(5, 'otro turno', 'if (turno == TARDE) {\n  printf("Turno noche");\n}', ['MUESTRA_DISTINTA']),
  declarar(5, 'sin if', 'printf("Turno noche");', ['MUESTRA_DISTINTA'], {
    dice: ['no tiene que mostrar nada'],
  }),
  // 6: cuestionario, que muestra printf
  declarar(6, 'printf: el nombre', '0', ['OPCION_MUESTRA_EL_NOMBRE']),
  declarar(6, 'printf: la correcta', '1'),
  declarar(6, 'printf: un texto', '2', ['OPCION_MUESTRA_UN_TEXTO']),
  declarar(6, 'printf: el primero', '3', ['OPCION_ES_EL_PRIMERO']),
  // 7: el alias
  declarar(7, 'el alias', 'typedef enum Turno TTurno;', 'ok', { mejoras: [] }),
  declarar(7, 'otro nombre', 'typedef enum Turno Horario;', ['ALIAS_NOMBRE']),
  declarar(7, 'sin la palabra enum', 'typedef Turno TTurno;', ['TIPO_DESCONOCIDO'], {
    dice: ['es el nombre de un enumerado', 'falta la palabra `enum`'],
  }),
  declarar(7, 'sin typedef', 'enum Turno TTurno;', ['ALIAS_FALTA']),
  // 8: el enumerado y su alias en una sola sentencia
  declarar(8, 'sin etiqueta', ENUM_ESTADO('  PENDIENTE,\n  EN_CURSO,\n  TERMINADA'), 'ok', { mejoras: [] }),
  declarar(8, 'con etiqueta tambien', 'typedef enum Estado {\n  PENDIENTE,\n  EN_CURSO,\n  TERMINADA\n} TEstado;'),
  declarar(8, 'en otro orden', ENUM_ESTADO('  EN_CURSO,\n  PENDIENTE,\n  TERMINADA'), ['ENUMERADOR_ORDEN']),
  declarar(8, 'otro alias', 'typedef enum {\n  PENDIENTE,\n  EN_CURSO,\n  TERMINADA\n} Estado;', ['ALIAS_NOMBRE']),
  declarar(8, 'sin alias', 'enum Estado {\n  PENDIENTE,\n  EN_CURSO,\n  TERMINADA\n};', ['ALIAS_FALTA']),
  declarar(8, 'sin nombre ni alias', 'enum {\n  PENDIENTE,\n  EN_CURSO,\n  TERMINADA\n};', ['ENUM_SIN_NOMBRE']),
  // 9: valores propios
  declarar(9, 'los tres valores', ENUM('  BAJA = 1,\n  MEDIA = 5,\n  ALTA = 10', 'TPrioridad'), 'ok', { mejoras: [] }),
  declarar(9, 'con etiqueta tambien', 'typedef enum Prioridad {\n  BAJA = 1,\n  MEDIA = 5,\n  ALTA = 10\n} TPrioridad;'),
  declarar(9, 'sin valores', ENUM('  BAJA,\n  MEDIA,\n  ALTA', 'TPrioridad'), ['ENUMERADOR_VALOR']),
  declarar(9, 'el ultimo sin valor', ENUM('  BAJA = 1,\n  MEDIA = 5,\n  ALTA', 'TPrioridad'), ['ENUMERADOR_VALOR']),
  declarar(9, 'otro alias', ENUM('  BAJA = 1,\n  MEDIA = 5,\n  ALTA = 10', 'TNivel'), ['ALIAS_NOMBRE']),
  declarar(
    9,
    'sin la palabra enum en el typedef',
    'enum Prioridad {\n  BAJA = 1,\n  MEDIA = 5,\n  ALTA = 10\n};\ntypedef Prioridad TPrioridad;',
    ['TIPO_DESCONOCIDO'],
    { dice: ['`Prioridad` es el nombre de un enumerado', 'falta la palabra `enum`, como en `enum Prioridad`'] }
  ),
  // 10: cuestionario, el nombre que sigue
  declarar(10, 'el que sigue: la correcta', '2'),
  declarar(10, 'el que sigue: repite', '0', ['OPCION_REPITE_EL_ULTIMO']),
  declarar(10, 'el que sigue: el segundo', '1', ['OPCION_ES_EL_SEGUNDO']),
  declarar(10, 'el que sigue: desde cero', '3', ['OPCION_CUENTA_DESDE_CERO']),

  // ---- leer un enumerado ----
  // 1: leer un numero
  leer(1, 'con la conversion', 'scanf("%d", &opcion);\nturno = (TTurno) opcion;', 'ok', { mejoras: [] }),
  leer(1, 'sin la conversion', 'scanf("%d", &opcion);\nturno = opcion;'),
  leer(1, 'con if', 'scanf("%d", &opcion);\nif (opcion == 0) {\n  turno = MANANA;\n} else if (opcion == 1) {\n  turno = TARDE;\n} else {\n  turno = NOCHE;\n}'),
  leer(1, 'con switch', 'scanf("%d", &opcion);\nswitch (opcion) {\n  case 0:\n    turno = MANANA;\n    break;\n  case 1:\n    turno = TARDE;\n    break;\n  case 2:\n    turno = NOCHE;\n    break;\n}'),
  leer(1, 'directo en la variable', 'scanf("%d", &turno);', 'ok', { notas: ['SCANF_EN_ENUM'] }),
  leer(1, 'sin guardar', 'scanf("%d", &opcion);', ['RESULTADO_VARIABLE_SIN_VALOR']),
  leer(1, 'sin el &', 'scanf("%d", opcion);\nturno = (TTurno) opcion;', ['AMPERSAND_FALTA']),
  // 2: cuestionario, un numero que no es ninguno
  leer(2, 'rango: el compilador', '0', ['OPCION_AVISA_EL_COMPILADOR']),
  leer(2, 'rango: se detiene', '1', ['OPCION_SE_DETIENE']),
  leer(2, 'rango: la correcta', '2'),
  leer(2, 'rango: queda en cero', '3', ['OPCION_QUEDA_EN_CERO']),
  // 3: validar
  leer(3, 'con &&', 'scanf("%d", &opcion);\nif (opcion >= 0 && opcion <= 2) {\n  turno = (TTurno) opcion;\n} else {\n  printf("Opcion invalida");\n}'),
  leer(3, 'con < 3', 'scanf("%d", &opcion);\nif (opcion >= 0 && opcion < 3) {\n  turno = opcion;\n} else {\n  printf("Opcion invalida");\n}'),
  leer(3, 'sin validar', 'scanf("%d", &opcion);\nturno = (TTurno) opcion;', ['RESULTADO_VALOR_DISTINTO'], {
    dice: ['`turno` termina valiendo `7` y debería valer `MANANA`'],
  }),
  leer(3, 'con || en vez de &&', 'scanf("%d", &opcion);\nif (opcion >= 0 || opcion <= 2) {\n  turno = opcion;\n} else {\n  printf("Opcion invalida");\n}', ['RESULTADO_VALOR_DISTINTO']),
  leer(3, 'sin el mensaje', 'scanf("%d", &opcion);\nif (opcion >= 0 && opcion <= 2) {\n  turno = (TTurno) opcion;\n}', ['MUESTRA_FALTA']),
  // 4: leer una letra
  leer(4, 'con if', "scanf(\" %c\", &letra);\nif (letra == 'M') {\n  turno = MANANA;\n} else if (letra == 'T') {\n  turno = TARDE;\n} else {\n  turno = NOCHE;\n}"),
  leer(4, 'con switch', "scanf(\" %c\", &letra);\nswitch (letra) {\n  case 'M':\n    turno = MANANA;\n    break;\n  case 'T':\n    turno = TARDE;\n    break;\n  case 'N':\n    turno = NOCHE;\n    break;\n}"),
  leer(4, 'con comillas dobles', "scanf(\" %c\", &letra);\nif (letra == \"M\") {\n  turno = MANANA;\n}", ['LETRA_ENTRE_COMILLAS_DOBLES']),
  leer(4, 'con el formato de un entero', 'scanf("%d", &letra);\nturno = TARDE;', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  leer(4, 'sin guardar', 'scanf(" %c", &letra);', ['RESULTADO_VARIABLE_SIN_VALOR']),

  // ---- mostrar un enumerado ----
  // 1: el nombre con un switch
  mostrar(1, 'con los tres casos', SWITCH_TURNO([CASO('MANANA', 'Manana'), CASO('TARDE', 'Tarde'), CASO('NOCHE', 'Noche')].join('\n')), 'ok', { mejoras: [] }),
  mostrar(1, 'con default en el ultimo', SWITCH_TURNO([CASO('MANANA', 'Manana'), CASO('TARDE', 'Tarde'), '  default:\n    printf("Noche");'].join('\n'))),
  mostrar(1, 'con los numeros', SWITCH_TURNO([CASO('0', 'Manana'), CASO('1', 'Tarde'), CASO('2', 'Noche')].join('\n')), 'ok', { mejoras: ['ENUM_CON_NUMERO'] }),
  mostrar(1, 'sin un break', SWITCH_TURNO([CASO('MANANA', 'Manana', false), CASO('TARDE', 'Tarde'), CASO('NOCHE', 'Noche')].join('\n')), ['SWITCH_SIN_BREAK']),
  mostrar(1, 'con if', 'if (turno == MANANA) {\n  printf("Manana");\n} else if (turno == TARDE) {\n  printf("Tarde");\n} else {\n  printf("Noche");\n}', ['SWITCH_FALTA']),
  mostrar(1, 'con otro texto', SWITCH_TURNO([CASO('MANANA', 'manana'), CASO('TARDE', 'Tarde'), CASO('NOCHE', 'Noche')].join('\n')), ['MUESTRA_DISTINTA']),
  mostrar(1, 'con un caso que falta', SWITCH_TURNO([CASO('MANANA', 'Manana'), CASO('TARDE', 'Tarde')].join('\n')), ['MUESTRA_FALTA']),
  // 2: cuestionario, sin break
  mostrar(2, 'sin break: solo el caso', '0', ['OPCION_SOLO_EL_CASO']),
  mostrar(2, 'sin break: la correcta', '1'),
  mostrar(2, 'sin break: todos', '2', ['OPCION_TODOS']),
  mostrar(2, 'sin break: falta default', '3', ['OPCION_FALTA_EL_DEFAULT']),
  // 3: el valor que no es ninguno
  mostrar(
    3,
    'con default',
    SWITCH_TURNO([CASO('MANANA', 'Manana'), CASO('TARDE', 'Tarde'), CASO('NOCHE', 'Noche'), '  default:\n    printf("Turno invalido");'].join('\n')),
    'ok',
    { mejoras: [] }
  ),
  mostrar(3, 'sin default', SWITCH_TURNO([CASO('MANANA', 'Manana'), CASO('TARDE', 'Tarde'), CASO('NOCHE', 'Noche')].join('\n')), ['SWITCH_SIN_DEFAULT']),
  mostrar(
    3,
    'default con el nombre de otro turno',
    SWITCH_TURNO([CASO('MANANA', 'Manana'), CASO('TARDE', 'Tarde'), '  default:\n    printf("Noche");'].join('\n')),
    ['MUESTRA_DISTINTA']
  ),
  mostrar(
    3,
    'con if y else',
    'if (turno == MANANA) {\n  printf("Manana");\n} else if (turno == TARDE) {\n  printf("Tarde");\n} else if (turno == NOCHE) {\n  printf("Noche");\n} else {\n  printf("Turno invalido");\n}',
    ['SWITCH_FALTA']
  ),
];
