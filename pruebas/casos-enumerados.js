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
const arreglo = serie('arreglos-enumerados');
const estructura = serie('estructuras-enumerado');
const tabla = serie('arreglos-enumerados-tabla');
const elementos = serie('arreglos-de-enumerados');
const celdas = serie('arreglos-tabla-de-enumerados');

const ENUM = (cuerpo, nombre = 'TTurno') => `typedef enum {\n${cuerpo}\n} ${nombre};`;
const BUCLE = (cuerpo, hasta = 'i < MAX_ALUMNOS') => `for (i = 0; ${hasta}; i++) {\n${cuerpo}\n}`;
const ENUM_TURNO = (cuerpo) => `enum Turno {\n${cuerpo}\n};`;
const MOSTRAR = (casos, salto) =>
  `for (empleado = 0; empleado < EMPLEADOS; empleado++) {\n  for (dia = LUNES; dia <= VIERNES; dia++) {\n    switch (agenda[empleado][dia]) {\n${casos}\n    }\n  }\n${salto}}`;
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

  // ---- arreglos con enumerados ----
  // 1: un lugar por turno
  arreglo(1, 'con la constante', 'int ventas[TURNOS];', 'ok', { mejoras: [] }),
  arreglo(1, 'con NOCHE + 1', 'int ventas[NOCHE + 1];', 'ok', { mejoras: [] }),
  arreglo(1, 'con el numero', 'int ventas[3];', 'ok', { mejoras: ['CONSTANTE_SIN_REUTILIZAR'] }),
  arreglo(1, 'con el ultimo nombre', 'int ventas[NOCHE];', ['ARREGLO_CHICO']),
  arreglo(1, 'de mas', 'int ventas[4];', ['ARREGLO_GRANDE']),
  arreglo(1, 'otro nombre', 'int cantidades[NOCHE + 1];', ['VARIABLE_NOMBRE']),
  // 2: guardar en el lugar de un turno
  arreglo(2, 'con el nombre', 'ventas[TARDE] = 120;', 'ok', { mejoras: [] }),
  arreglo(2, 'con el numero', 'ventas[1] = 120;', 'ok', { mejoras: ['ENUM_CON_NUMERO'] }),
  arreglo(2, 'en el lugar de otro turno', 'ventas[NOCHE] = 120;', ['RESULTADO_VALOR_DISTINTO']),
  arreglo(2, 'sin guardar', 'ventas[TARDE] = 0;', ['RESULTADO_VALOR_DISTINTO']),
  // 3: cuestionario, en que lugar queda
  arreglo(3, 'lugar de NOCHE: el primero', '0', ['OPCION_EL_PRIMERO']),
  arreglo(3, 'lugar de NOCHE: el segundo', '1', ['OPCION_EL_SEGUNDO']),
  arreglo(3, 'lugar de NOCHE: la correcta', '2'),
  arreglo(3, 'lugar de NOCHE: la cantidad', '3', ['OPCION_LA_CANTIDAD']),
  // 4: sumar con un ciclo
  arreglo(4, 'de MANANA a NOCHE', 'for (turno = MANANA; turno <= NOCHE; turno++) {\n  total += ventas[turno];\n}', 'ok', { mejoras: [] }),
  arreglo(4, 'con < NOCHE + 1', 'for (turno = MANANA; turno < NOCHE + 1; turno++) {\n  total += ventas[turno];\n}'),
  arreglo(4, 'con numeros', 'for (turno = 0; turno <= 2; turno++) {\n  total += ventas[turno];\n}', 'ok', { mejoras: ['ENUM_CON_NUMERO'] }),
  arreglo(4, 'sin llegar a NOCHE', 'for (turno = MANANA; turno < NOCHE; turno++) {\n  total += ventas[turno];\n}', ['RECORRIDO_INCOMPLETO']),
  arreglo(4, 'un lugar de mas', 'for (turno = MANANA; turno <= NOCHE + 1; turno++) {\n  total += ventas[turno];\n}', ['INDICE_FUERA_DE_RANGO']),
  arreglo(4, 'sin ciclo', 'total = ventas[MANANA] + ventas[TARDE] + ventas[NOCHE];', ['CICLO_FALTA']),
  // 5: mostrar cada turno con su nombre
  arreglo(
    5,
    'con un switch',
    'for (turno = MANANA; turno <= NOCHE; turno++) {\n  switch (turno) {\n    case MANANA:\n      printf("Manana: ");\n      break;\n    case TARDE:\n      printf("Tarde: ");\n      break;\n    case NOCHE:\n      printf("Noche: ");\n      break;\n  }\n  printf("%d\\n", ventas[turno]);\n}'
  ),
  arreglo(
    5,
    'con tres printf',
    'for (turno = MANANA; turno <= NOCHE; turno++) {\n  switch (turno) {\n    case MANANA:\n      printf("Manana: %d\\n", ventas[turno]);\n      break;\n    case TARDE:\n      printf("Tarde: %d\\n", ventas[turno]);\n      break;\n    case NOCHE:\n      printf("Noche: %d\\n", ventas[turno]);\n      break;\n  }\n}'
  ),
  arreglo(5, 'sin el nombre', 'for (turno = MANANA; turno <= NOCHE; turno++) {\n  printf("%d\\n", ventas[turno]);\n}', ['MUESTRA_DISTINTA']),
  // 6: el turno con mas ventas
  arreglo(
    6,
    'desde TARDE',
    'mejor = MANANA;\nfor (turno = TARDE; turno <= NOCHE; turno++) {\n  if (ventas[turno] > ventas[mejor]) {\n    mejor = turno;\n  }\n}',
    'ok',
    { mejoras: [] }
  ),
  arreglo(
    6,
    'desde MANANA',
    'mejor = MANANA;\nfor (turno = MANANA; turno <= NOCHE; turno++) {\n  if (ventas[turno] > ventas[mejor]) {\n    mejor = turno;\n  }\n}'
  ),
  arreglo(
    6,
    'sin empezar mejor',
    'for (turno = MANANA; turno <= NOCHE; turno++) {\n  if (ventas[turno] > ventas[mejor]) {\n    mejor = turno;\n  }\n}',
    ['VARIABLE_SIN_VALOR']
  ),
  arreglo(
    6,
    'guarda la venta en lugar del turno',
    'mejor = MANANA;\nfor (turno = TARDE; turno <= NOCHE; turno++) {\n  if (ventas[turno] > ventas[mejor]) {\n    mejor = ventas[turno];\n  }\n}',
    ['RESULTADO_VALOR_DISTINTO'],
    { dice: ['`mejor` termina valiendo'] }
  ),

  // ---- estructuras con un enumerado ----
  // 1: declarar la estructura
  estructura(1, 'con TTurno', 'typedef struct {\n  int legajo;\n  char apellidoNombre[50];\n  float promedio;\n  TTurno turno;\n} TAlumno;', 'ok', { mejoras: [] }),
  estructura(1, 'con etiqueta y alias', 'typedef struct Alumno {\n  int legajo;\n  char apellidoNombre[50];\n  float promedio;\n  TTurno turno;\n} TAlumno;'),
  estructura(1, 'con enum Turno', 'struct Alumno {\n  int legajo;\n  char apellidoNombre[50];\n  float promedio;\n  enum Turno turno;\n};', ['ALIAS_FALTA', 'TIPO_DESCONOCIDO']),
  estructura(1, 'el turno como char', 'typedef struct {\n  int legajo;\n  char apellidoNombre[50];\n  float promedio;\n  char turno;\n} TAlumno;', ['CAMPO_TIPO']),
  estructura(1, 'el turno como int', 'typedef struct {\n  int legajo;\n  char apellidoNombre[50];\n  float promedio;\n  int turno;\n} TAlumno;', ['CAMPO_TIPO']),
  estructura(1, 'el turno como arreglo', 'typedef struct {\n  int legajo;\n  char apellidoNombre[50];\n  float promedio;\n  TTurno turno[3];\n} TAlumno;', ['CAMPO_TIPO']),
  estructura(1, 'el turno con puntero', 'typedef struct {\n  int legajo;\n  char apellidoNombre[50];\n  float promedio;\n  TTurno *turno;\n} TAlumno;', ['CAMPO_TIPO']),
  estructura(1, 'otro alias', 'typedef struct {\n  int legajo;\n  char apellidoNombre[50];\n  float promedio;\n  TTurno turno;\n} Alumno;', ['ALIAS_NOMBRE']),
  estructura(1, 'sin un campo', 'typedef struct {\n  int legajo;\n  float promedio;\n  TTurno turno;\n} TAlumno;', ['CAMPO_FALTA']),
  // 2: guardar el turno
  estructura(2, 'con el nombre', 'alumno.legajo = 20431;\nalumno.promedio = 8.45;\nalumno.turno = NOCHE;', 'ok', { mejoras: [] }),
  estructura(2, 'con el numero', 'alumno.legajo = 20431;\nalumno.promedio = 8.45;\nalumno.turno = 2;', 'ok', { mejoras: ['ENUM_CON_NUMERO'] }),
  estructura(2, 'con otro turno', 'alumno.legajo = 20431;\nalumno.promedio = 8.45;\nalumno.turno = TARDE;', ['ASIGNACION_VALOR_DISTINTO']),
  estructura(2, 'con una letra', "alumno.legajo = 20431;\nalumno.promedio = 8.45;\nalumno.turno = 'N';", ['ENUM_COMO_TEXTO']),
  estructura(2, 'con un texto', 'alumno.legajo = 20431;\nalumno.promedio = 8.45;\nalumno.turno = "NOCHE";', ['ENUM_COMO_TEXTO']),
  estructura(2, 'sin el turno', 'alumno.legajo = 20431;\nalumno.promedio = 8.45;', ['CAMPO_SIN_CARGAR']),
  estructura(2, 'vuelve a guardar el legajo con otro valor', 'alumno.legajo = 20431;\nalumno.promedio = 8.45;\nalumno.turno = NOCHE;\nalumno.legajo = 1;', ['ASIGNACION_VALOR_DISTINTO']),
  // 3: leer el turno
  estructura(3, 'con la conversion', 'scanf("%d", &opcion);\nalumno.turno = (TTurno) opcion;', 'ok', { mejoras: [] }),
  estructura(3, 'sin la conversion', 'scanf("%d", &opcion);\nalumno.turno = opcion;'),
  estructura(3, 'directo en el campo', 'scanf("%d", &alumno.turno);', 'ok', { notas: ['SCANF_EN_ENUM'] }),
  estructura(3, 'con if', 'scanf("%d", &opcion);\nif (opcion == 0) {\n  alumno.turno = MANANA;\n} else if (opcion == 1) {\n  alumno.turno = TARDE;\n} else {\n  alumno.turno = NOCHE;\n}'),
  estructura(3, 'sin guardar', 'scanf("%d", &opcion);', ['RESULTADO_VARIABLE_SIN_VALOR']),
  // 4: mostrar el nombre
  estructura(
    4,
    'con un switch',
    'switch (alumno.turno) {\n  case MANANA:\n    printf("Manana");\n    break;\n  case TARDE:\n    printf("Tarde");\n    break;\n  case NOCHE:\n    printf("Noche");\n    break;\n}',
    'ok',
    { mejoras: [] }
  ),
  estructura(
    4,
    'con if',
    'if (alumno.turno == MANANA) {\n  printf("Manana");\n} else if (alumno.turno == TARDE) {\n  printf("Tarde");\n} else {\n  printf("Noche");\n}',
    ['SWITCH_FALTA']
  ),
  estructura(
    4,
    'sin un caso',
    'switch (alumno.turno) {\n  case MANANA:\n    printf("Manana");\n    break;\n  case TARDE:\n    printf("Tarde");\n    break;\n}',
    ['MUESTRA_FALTA']
  ),
  estructura(
    4,
    'sin un break',
    'switch (alumno.turno) {\n  case MANANA:\n    printf("Manana");\n  case TARDE:\n    printf("Tarde");\n    break;\n  case NOCHE:\n    printf("Noche");\n    break;\n}',
    ['SWITCH_SIN_BREAK']
  ),
  // 5: contar los de un turno
  estructura(5, 'con el nombre', BUCLE('  if (alumnos[i].turno == NOCHE) {\n    cantidad++;\n  }'), 'ok', { mejoras: [] }),
  estructura(5, 'con el numero', BUCLE('  if (alumnos[i].turno == 2) {\n    cantidad++;\n  }'), 'ok', { mejoras: ['ENUM_CON_NUMERO'] }),
  estructura(5, 'con un solo =', BUCLE('  if (alumnos[i].turno = NOCHE) {\n    cantidad++;\n  }'), ['ASIGNACION_EN_CONDICION']),
  estructura(5, 'cuenta otro turno', BUCLE('  if (alumnos[i].turno == TARDE) {\n    cantidad++;\n  }'), ['RESULTADO_VALOR_DISTINTO'], {
    dice: ['`cantidad` termina valiendo `0` y debería valer `2`'],
  }),
  estructura(5, 'sin el ultimo', BUCLE('  if (alumnos[i].turno == NOCHE) {\n    cantidad++;\n  }', 'i < MAX_ALUMNOS - 1'), ['RECORRIDO_INCOMPLETO']),
  estructura(5, 'mira otro campo', BUCLE('  if (alumnos[i].legajo == NOCHE) {\n    cantidad++;\n  }'), ['CAMPO_MARCADO_SIN_USAR']),
  estructura(5, 'el arreglo sin indice', BUCLE('  if (alumnos.turno == NOCHE) {\n    cantidad++;\n  }'), ['ARREGLO_SIN_INDICE']),
  // 6: contar los de cada turno
  estructura(6, 'con el enumerado como indice', BUCLE('  porTurno[alumnos[i].turno]++;'), 'ok', { mejoras: [] }),
  estructura(
    6,
    'con un if por turno',
    BUCLE('  if (alumnos[i].turno == MANANA) {\n    porTurno[MANANA]++;\n  } else if (alumnos[i].turno == TARDE) {\n    porTurno[TARDE]++;\n  } else {\n    porTurno[NOCHE]++;\n  }')
  ),
  estructura(6, 'con un switch', BUCLE('  switch (alumnos[i].turno) {\n    case MANANA:\n      porTurno[MANANA]++;\n      break;\n    case TARDE:\n      porTurno[TARDE]++;\n      break;\n    case NOCHE:\n      porTurno[NOCHE]++;\n      break;\n  }')),
  estructura(6, 'con el indice del ciclo', BUCLE('  porTurno[i]++;'), ['CAMPO_MARCADO_SIN_USAR']),
  estructura(6, 'se pisa en lugar de sumar', BUCLE('  porTurno[alumnos[i].turno] = 1;'), ['RESULTADO_VALOR_DISTINTO']),
  estructura(6, 'indexa con otro campo', BUCLE('  porTurno[alumnos[i].legajo]++;'), ['INDICE_FUERA_DE_RANGO']),

  // ---- una tabla con enumerados ----
  // 1: declarar
  tabla(1, 'con las constantes', 'int ventas[DIAS][TURNOS];', 'ok', { mejoras: [] }),
  tabla(1, 'con los numeros', 'int ventas[5][3];', 'ok', { mejoras: ['CONSTANTE_SIN_REUTILIZAR'] }),
  tabla(1, 'con las dimensiones al reves', 'int ventas[TURNOS][DIAS];', ['DIMENSIONES_AL_REVES']),
  tabla(1, 'un arreglo', 'int ventas[DIAS];', ['TABLA_UNA_DIMENSION']),
  tabla(1, 'un turno de mas', 'int ventas[DIAS][TURNOS + 1];', ['ARREGLO_GRANDE']),
  // 2: guardar en una celda
  tabla(2, 'con los nombres', 'ventas[MIERCOLES][TARDE] = 120;', 'ok', { mejoras: [] }),
  tabla(2, 'con los numeros', 'ventas[2][1] = 120;', 'ok', { mejoras: ['ENUM_CON_NUMERO'] }),
  tabla(2, 'con los indices al reves', 'ventas[TARDE][MIERCOLES] = 120;', ['INDICE_DE_OTRO_ENUMERADO'], {
    dice: ['`TARDE` es un turno, pero el primer índice de `ventas` elige los días'],
  }),
  tabla(2, 'con dos turnos', 'ventas[TARDE][NOCHE] = 120;', ['INDICE_DE_OTRO_ENUMERADO']),
  tabla(2, 'con otro turno', 'ventas[MIERCOLES][NOCHE] = 120;', ['RESULTADO_VALOR_DISTINTO']),
  tabla(2, 'con otro dia', 'ventas[JUEVES][TARDE] = 120;', ['RESULTADO_VALOR_DISTINTO']),
  // 3: cuestionario, en que fila y columna
  tabla(3, 'celda: al reves', '0', ['OPCION_AL_REVES']),
  tabla(3, 'celda: la correcta', '1'),
  tabla(3, 'celda: desde uno', '2', ['OPCION_DESDE_UNO']),
  tabla(3, 'celda: toda la fila', '3', ['OPCION_TODA_LA_FILA']),
  // 4: el total de un dia
  tabla(4, 'con MARTES', 'for (turno = MANANA; turno <= NOCHE; turno++) {\n  total += ventas[MARTES][turno];\n}', 'ok', { mejoras: [] }),
  tabla(4, 'con el numero', 'for (turno = MANANA; turno <= NOCHE; turno++) {\n  total += ventas[1][turno];\n}', 'ok', {
    mejoras: ['ENUM_CON_NUMERO'],
  }),
  tabla(4, 'con los indices al reves', 'for (turno = MANANA; turno <= NOCHE; turno++) {\n  total += ventas[turno][MARTES];\n}', [
    'INDICE_DE_OTRO_ENUMERADO',
  ]),
  tabla(4, 'sin el ultimo turno', 'for (turno = MANANA; turno < NOCHE; turno++) {\n  total += ventas[MARTES][turno];\n}', [
    'RESULTADO_VALOR_DISTINTO',
  ]),
  tabla(4, 'con otro dia', 'for (turno = MANANA; turno <= NOCHE; turno++) {\n  total += ventas[LUNES][turno];\n}', [
    'RESULTADO_VALOR_DISTINTO',
  ]),
  tabla(4, 'sin ciclo', 'total = ventas[MARTES][MANANA] + ventas[MARTES][TARDE] + ventas[MARTES][NOCHE];', ['CICLO_FALTA']),
  // 5: el total de un turno
  tabla(5, 'con TARDE', 'for (dia = LUNES; dia <= VIERNES; dia++) {\n  total += ventas[dia][TARDE];\n}', 'ok', { mejoras: [] }),
  tabla(5, 'con los indices al reves', 'for (dia = LUNES; dia <= VIERNES; dia++) {\n  total += ventas[TARDE][dia];\n}', [
    'INDICE_DE_OTRO_ENUMERADO',
  ]),
  tabla(5, 'con otro turno', 'for (dia = LUNES; dia <= VIERNES; dia++) {\n  total += ventas[dia][MANANA];\n}', [
    'RESULTADO_VALOR_DISTINTO',
  ]),
  tabla(5, 'sin el ultimo dia', 'for (dia = LUNES; dia < VIERNES; dia++) {\n  total += ventas[dia][TARDE];\n}', [
    'RESULTADO_VALOR_DISTINTO',
  ]),
  // 6: el total de cada dia
  tabla(
    6,
    'con dos ciclos',
    'for (dia = LUNES; dia <= VIERNES; dia++) {\n  totalDia[dia] = 0;\n  for (turno = MANANA; turno <= NOCHE; turno++) {\n    totalDia[dia] += ventas[dia][turno];\n  }\n}',
    'ok',
    { mejoras: [] }
  ),
  tabla(
    6,
    'sin reiniciar el total de cada dia',
    'for (dia = LUNES; dia <= VIERNES; dia++) {\n  for (turno = MANANA; turno <= NOCHE; turno++) {\n    totalDia[dia] += ventas[dia][turno];\n  }\n}',
    ['VARIABLE_SIN_VALOR']
  ),
  tabla(
    6,
    'con los indices al reves',
    'for (dia = LUNES; dia <= VIERNES; dia++) {\n  totalDia[dia] = 0;\n  for (turno = MANANA; turno <= NOCHE; turno++) {\n    totalDia[dia] += ventas[turno][dia];\n  }\n}',
    ['INDICE_FUERA_DE_RANGO']
  ),
  tabla(
    6,
    'sin llegar al ultimo turno',
    'for (dia = LUNES; dia <= VIERNES; dia++) {\n  totalDia[dia] = 0;\n  for (turno = MANANA; turno < NOCHE; turno++) {\n    totalDia[dia] += ventas[dia][turno];\n  }\n}',
    ['RECORRIDO_INCOMPLETO']
  ),

  // ---- un arreglo de enumerados ----
  // 1: definirlo con los nombres
  elementos(1, 'con los nombres', 'TTurno turnoDelDia[] = {MANANA, MANANA, TARDE, NOCHE, NOCHE};', 'ok', { mejoras: [] }),
  elementos(1, 'con la constante', 'TTurno turnoDelDia[DIAS] = {MANANA, MANANA, TARDE, NOCHE, NOCHE};', 'ok', {
    mejoras: ['DIMENSION_REPETIDA'],
  }),
  elementos(1, 'con los numeros', 'TTurno turnoDelDia[] = {0, 0, 1, 2, 2};', 'ok', { mejoras: ['ENUM_CON_NUMERO'] }),
  elementos(1, 'con un valor de menos', 'TTurno turnoDelDia[] = {MANANA, MANANA, TARDE, NOCHE};', ['VALORES_DE_MENOS']),
  elementos(1, 'con otro turno', 'TTurno turnoDelDia[] = {MANANA, MANANA, TARDE, NOCHE, TARDE};', ['VALOR_DISTINTO']),
  elementos(1, 'con dias en lugar de turnos', 'TTurno turnoDelDia[] = {LUNES, LUNES, MARTES, JUEVES, JUEVES};', [
    'ENUMERADOR_DE_OTRO_ENUMERADO',
    'VALOR_DISTINTO',
  ]),
  elementos(1, 'de tipo int', 'int turnoDelDia[] = {MANANA, MANANA, TARDE, NOCHE, NOCHE};', ['VARIABLE_TIPO']),
  elementos(1, 'los valores de a uno', 'TTurno turnoDelDia[5];\nturnoDelDia[0] = MANANA;', ['VALORES_APARTE']),
  // 2: cuestionario, que muestra printf
  elementos(2, 'printf: el nombre', '0', ['OPCION_MUESTRA_EL_NOMBRE']),
  elementos(2, 'printf: la posicion', '1', ['OPCION_LA_POSICION']),
  elementos(2, 'printf: la correcta', '2'),
  elementos(2, 'printf: el primero', '3', ['OPCION_EL_PRIMER_ELEMENTO']),
  // 3: cambiar un elemento
  elementos(3, 'con los nombres', 'turnoDelDia[JUEVES] = TARDE;', 'ok', { mejoras: [] }),
  elementos(3, 'con el numero de la posicion', 'turnoDelDia[3] = TARDE;', 'ok', { mejoras: ['ENUM_CON_NUMERO'] }),
  elementos(3, 'con el numero del turno', 'turnoDelDia[JUEVES] = 1;', 'ok', { mejoras: ['ENUM_CON_NUMERO'] }),
  elementos(3, 'con el turno y el dia al reves', 'turnoDelDia[TARDE] = JUEVES;', [
    'ENUMERADOR_DE_OTRO_ENUMERADO',
    'INDICE_DE_OTRO_ENUMERADO',
  ]),
  elementos(3, 'con un dia donde va un turno', 'turnoDelDia[JUEVES] = LUNES;', ['ENUMERADOR_DE_OTRO_ENUMERADO']),
  elementos(3, 'con otro turno', 'turnoDelDia[JUEVES] = NOCHE;', ['RESULTADO_VALOR_DISTINTO']),
  elementos(3, 'con otro dia', 'turnoDelDia[VIERNES] = TARDE;', ['RESULTADO_VALOR_DISTINTO']),
  // 4: leer los turnos
  elementos(4, 'con la conversion', 'for (dia = LUNES; dia <= VIERNES; dia++) {\n  scanf("%d", &opcion);\n  turnoDelDia[dia] = (TTurno) opcion;\n}', 'ok', {
    mejoras: [],
  }),
  elementos(4, 'sin la conversion', 'for (dia = LUNES; dia <= VIERNES; dia++) {\n  scanf("%d", &opcion);\n  turnoDelDia[dia] = opcion;\n}'),
  elementos(4, 'directo en el elemento', 'for (dia = LUNES; dia <= VIERNES; dia++) {\n  scanf("%d", &turnoDelDia[dia]);\n}', 'ok', {
    notas: ['SCANF_EN_ENUM'],
  }),
  elementos(4, 'sin el ultimo dia', 'for (dia = LUNES; dia < VIERNES; dia++) {\n  scanf("%d", &opcion);\n  turnoDelDia[dia] = (TTurno) opcion;\n}', [
    'RECORRIDO_INCOMPLETO',
  ]),
  elementos(4, 'siempre en el primer dia', 'for (dia = LUNES; dia <= VIERNES; dia++) {\n  scanf("%d", &opcion);\n  turnoDelDia[LUNES] = (TTurno) opcion;\n}', [
    'RECORRIDO_INCOMPLETO',
  ]),
  // 5: contar los dias de noche
  elementos(5, 'con el nombre', 'for (dia = LUNES; dia <= VIERNES; dia++) {\n  if (turnoDelDia[dia] == NOCHE) {\n    cantidad++;\n  }\n}', 'ok', {
    mejoras: [],
  }),
  elementos(5, 'con el numero', 'for (dia = LUNES; dia <= VIERNES; dia++) {\n  if (turnoDelDia[dia] == 2) {\n    cantidad++;\n  }\n}', 'ok', {
    mejoras: ['ENUM_CON_NUMERO'],
  }),
  elementos(5, 'con el nombre de un dia', 'for (dia = LUNES; dia <= VIERNES; dia++) {\n  if (turnoDelDia[dia] == LUNES) {\n    cantidad++;\n  }\n}', [
    'RESULTADO_VALOR_DISTINTO',
  ]),
  elementos(5, 'sin el ultimo dia', 'for (dia = LUNES; dia < VIERNES; dia++) {\n  if (turnoDelDia[dia] == NOCHE) {\n    cantidad++;\n  }\n}', [
    'RECORRIDO_INCOMPLETO',
  ]),
  // 6: mostrar el turno de cada dia
  elementos(
    6,
    'con un switch',
    'for (dia = LUNES; dia <= VIERNES; dia++) {\n  switch (turnoDelDia[dia]) {\n    case MANANA:\n      printf("Manana\\n");\n      break;\n    case TARDE:\n      printf("Tarde\\n");\n      break;\n    case NOCHE:\n      printf("Noche\\n");\n      break;\n  }\n}',
    'ok',
    { mejoras: [] }
  ),
  elementos(6, 'mostrando el numero', 'for (dia = LUNES; dia <= VIERNES; dia++) {\n  printf("%d\\n", turnoDelDia[dia]);\n}', ['MUESTRA_DISTINTA']),

  // ---- una tabla de enumerados ----
  // 1: definirla con los nombres
  celdas(1, 'con los nombres', 'TTurno agenda[][DIAS] = {\n  {MANANA, MANANA, TARDE, NOCHE, NOCHE},\n  {TARDE, TARDE, TARDE, MANANA, MANANA},\n  {NOCHE, MANANA, NOCHE, NOCHE, TARDE}\n};', 'ok', { mejoras: [] }),
  celdas(1, 'con las dos constantes', 'TTurno agenda[EMPLEADOS][DIAS] = {\n  {MANANA, MANANA, TARDE, NOCHE, NOCHE},\n  {TARDE, TARDE, TARDE, MANANA, MANANA},\n  {NOCHE, MANANA, NOCHE, NOCHE, TARDE}\n};', 'ok', { mejoras: ['FILAS_REPETIDAS'] }),
  celdas(1, 'con una celda distinta', 'TTurno agenda[][DIAS] = {\n  {MANANA, MANANA, TARDE, NOCHE, NOCHE},\n  {TARDE, TARDE, TARDE, MANANA, MANANA},\n  {NOCHE, MANANA, NOCHE, NOCHE, NOCHE}\n};', [
    'VALOR_DISTINTO',
  ]),
  celdas(1, 'con un dia donde va un turno', 'TTurno agenda[][DIAS] = {\n  {MANANA, MANANA, TARDE, NOCHE, NOCHE},\n  {TARDE, TARDE, TARDE, MANANA, MANANA},\n  {NOCHE, MANANA, NOCHE, NOCHE, LUNES}\n};', [
    'ENUMERADOR_DE_OTRO_ENUMERADO',
    'VALOR_DISTINTO',
  ]),
  // 2: cambiar una celda
  celdas(2, 'con el nombre del dia', 'agenda[1][MIERCOLES] = NOCHE;', 'ok', { mejoras: [] }),
  celdas(2, 'con el numero del dia', 'agenda[1][2] = NOCHE;', 'ok', { mejoras: ['ENUM_CON_NUMERO'] }),
  celdas(2, 'con un turno donde va el dia', 'agenda[1][NOCHE] = NOCHE;', ['INDICE_DE_OTRO_ENUMERADO']),
  celdas(2, 'con la fila y la columna al reves', 'agenda[MIERCOLES][1] = NOCHE;', ['RESULTADO_VALOR_DISTINTO']),
  celdas(2, 'en otra fila', 'agenda[2][MIERCOLES] = NOCHE;', ['RESULTADO_VALOR_DISTINTO']),
  // 3: cuantos trabajan de noche un dia
  celdas(
    3,
    'el viernes',
    'for (empleado = 0; empleado < EMPLEADOS; empleado++) {\n  if (agenda[empleado][VIERNES] == NOCHE) {\n    cantidad++;\n  }\n}',
    'ok',
    { mejoras: [] }
  ),
  celdas(
    3,
    'otro dia',
    'for (empleado = 0; empleado < EMPLEADOS; empleado++) {\n  if (agenda[empleado][JUEVES] == NOCHE) {\n    cantidad++;\n  }\n}',
    ['RESULTADO_VALOR_DISTINTO']
  ),
  celdas(
    3,
    'con los indices al reves',
    'for (empleado = 0; empleado < EMPLEADOS; empleado++) {\n  if (agenda[VIERNES][empleado] == NOCHE) {\n    cantidad++;\n  }\n}',
    ['INDICE_FUERA_DE_RANGO']
  ),
  // 4: cuantos dias trabaja de noche un empleado
  celdas(
    4,
    'la fila 2',
    'for (dia = LUNES; dia <= VIERNES; dia++) {\n  if (agenda[2][dia] == NOCHE) {\n    cantidad++;\n  }\n}',
    'ok',
    { mejoras: [] }
  ),
  celdas(
    4,
    'otra fila',
    'for (dia = LUNES; dia <= VIERNES; dia++) {\n  if (agenda[1][dia] == NOCHE) {\n    cantidad++;\n  }\n}',
    ['RESULTADO_VALOR_DISTINTO']
  ),
  // 5: mostrar la agenda
  celdas(
    5,
    'con un switch',
    MOSTRAR(
      '      case MANANA:\n        printf("Manana ");\n        break;\n      case TARDE:\n        printf("Tarde ");\n        break;\n      case NOCHE:\n        printf("Noche ");\n        break;',
      '  printf("\\n");\n'
    ),
    'ok',
    { mejoras: [] }
  ),
  celdas(
    5,
    'sin el salto de renglon',
    MOSTRAR(
      '      case MANANA:\n        printf("Manana ");\n        break;\n      case TARDE:\n        printf("Tarde ");\n        break;\n      case NOCHE:\n        printf("Noche ");\n        break;',
      ''
    ),
    ['MUESTRA_DISTINTA']
  ),
];
