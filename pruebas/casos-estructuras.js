// Casos de las series de estructuras que leen y muestran sus campos.
// Mismo formato que casos.js.

// Leer y mostrar los campos de una variable de estructura.
const leer = (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: 'estructuras-leer',
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

// Las respuestas de referencia que cada paso necesita antes: el legajo y su
// lectura, y el apellido y nombre con la limpieza del Enter.
const LEGAJO = 'scanf("%d", &alumno.legajo);';
const APELLIDO = "while (getchar() != '\\n');\ngets(alumno.apellidoNombre);";
const LIMPIAR = "while (getchar() != '\\n');";

export const CASOS_DE_LEER_CAMPOS = [
  // 1: el legajo
  leer(1, 'legajo', LEGAJO),
  leer(1, 'legajo, con espacios', 'scanf( "%d" , & alumno.legajo );'),
  leer(1, 'sin el &', 'scanf("%d", alumno.legajo);', ['AMPERSAND_FALTA']),
  leer(1, 'el formato de un decimal', 'scanf("%f", &alumno.legajo);', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  leer(1, 'el formato de un texto', 'scanf("%s", &alumno.legajo);', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  leer(1, 'el formato de una letra', 'scanf("%c", &alumno.legajo);', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  leer(1, 'el campo sin la variable', 'scanf("%d", &legajo);', ['CAMPO_SIN_VARIABLE']),
  leer(1, 'el tipo en vez de la variable', 'scanf("%d", &Alumno.legajo);', ['TIPO_EN_VEZ_DE_VARIABLE']),
  leer(1, 'la flecha', 'scanf("%d", &alumno->legajo);', ['FLECHA_CON_VARIABLE']),
  leer(1, 'otro campo que existe', 'scanf("%f", &alumno.promedio);', ['LECTURA_OTRO_CAMPO']),
  leer(1, 'un campo que no existe', 'scanf("%d", &alumno.codigo);', ['CAMPO_NO_EXISTE']),
  leer(1, 'una variable que no existe', 'scanf("%d", &alumn.legajo);', ['VARIABLE_DESCONOCIDA']),
  leer(1, 'con un argumento de mas', 'scanf("%d", &alumno.legajo, 5);', ['ARGUMENTOS_CANTIDAD']),
  leer(1, 'otra funcion', 'printf("%d", alumno.legajo);', ['LECTURA_FALTA']),
  leer(1, 'una asignacion en vez de leer', 'alumno.legajo = 20431;', ['LECTURA_FALTA']),
  // 2: el apellido y nombre
  leer(2, 'gets despues de limpiar el Enter', APELLIDO, 'ok', { notas: ['USO_DE_GETS'] }),
  leer(2, 'fgets despues de limpiar el Enter', LIMPIAR + '\nfgets(alumno.apellidoNombre, 50, stdin);'),
  leer(2, 'fgets con un limite menor', LIMPIAR + '\nfgets(alumno.apellidoNombre, 40, stdin);'),
  leer(2, 'sin limpiar el Enter', 'gets(alumno.apellidoNombre);', ['FALTA_LIMPIAR_ENTRADA']),
  leer(2, 'limpiar despues de leer', 'gets(alumno.apellidoNombre);\n' + LIMPIAR, ['LIMPIEZA_DESPUES']),
  leer(2, 'fgets con un limite que no entra', LIMPIAR + '\nfgets(alumno.apellidoNombre, 100, stdin);', ['LECTURA_SIN_LUGAR']),
  leer(2, 'fgets sin stdin', LIMPIAR + '\nfgets(alumno.apellidoNombre, 50, 0);', ['FGETS_SIN_STDIN']),
  leer(2, 'una palabra con scanf', 'scanf("%s", alumno.apellidoNombre);', ['LECTURA_CORTA_EN_ESPACIO']),
  leer(2, 'con &', LIMPIAR + '\ngets(&alumno.apellidoNombre);', ['ARGUMENTO_CON_AMPERSAND']),
  leer(2, 'la variable entera', LIMPIAR + '\ngets(alumno);', ['ARGUMENTO_SIN_CAMPO']),
  leer(2, 'el campo sin la variable', LIMPIAR + '\ngets(apellidoNombre);', ['CAMPO_SIN_VARIABLE']),
  leer(2, 'otro campo', LIMPIAR + '\ngets(alumno.turno);', ['ARGUMENTO_OTRO_CAMPO']),
  // 3: el promedio
  leer(3, 'promedio', 'scanf("%f", &alumno.promedio);'),
  leer(3, 'el formato de un entero', 'scanf("%d", &alumno.promedio);', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  leer(3, 'sin el &', 'scanf("%f", alumno.promedio);', ['AMPERSAND_FALTA']),
  leer(3, 'el campo de otra consigna', 'scanf("%d", &alumno.legajo);', ['LECTURA_OTRO_CAMPO']),
  // 4 a 7: el turno, el cuestionario y mostrar
  leer(4, 'el Enter: la correcta', '1'),
  leer(4, 'el Enter: la letra', '0', ['OPCION_LETRA_ESCRITA']),
  leer(4, 'el Enter: no se puede saber', '2', ['OPCION_NO_SE_SABE_LETRA']),
  leer(5, 'turno con el espacio', 'scanf(" %c", &alumno.turno);'),
  leer(5, 'turno limpiando el Enter antes', LIMPIAR + '\nscanf("%c", &alumno.turno);'),
  leer(5, 'turno sin el espacio ni la limpieza', 'scanf("%c", &alumno.turno);', ['LECTURA_LETRA_TOMA_EL_ENTER']),
  leer(5, 'turno limpiando despues de leer', 'scanf("%c", &alumno.turno);\n' + LIMPIAR, ['LIMPIEZA_DESPUES']),
  leer(
    5,
    'turno con un ciclo al reves',
    "while (getchar() == '\\n');\nscanf(\"%c\", &alumno.turno);",
    ['LIMPIEZA_AL_REVES']
  ),
  leer(5, 'turno con un ciclo que no se detiene', 'while (getchar());\nscanf("%c", &alumno.turno);', ['LIMPIEZA_SIN_ENTER']),
  leer(5, 'turno sin el &', 'scanf(" %c", alumno.turno);', ['AMPERSAND_FALTA']),
  leer(5, 'turno con el formato de un entero', 'scanf(" %d", &alumno.turno);', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  leer(5, 'turno con el formato de un texto', 'scanf("%s", &alumno.turno);', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  leer(6, 'un printf con todo', 'printf("%d %s %.2f %c\\n", alumno.legajo, alumno.apellidoNombre, alumno.promedio, alumno.turno);'),
  leer(
    6,
    'un printf por campo',
    'printf("%d\\n", alumno.legajo);\nputs(alumno.apellidoNombre);\nprintf("%f\\n", alumno.promedio);\nprintf("%c\\n", alumno.turno);'
  ),
  leer(
    6,
    'el promedio con el formato de un entero',
    'printf("%d %s %d %c\\n", alumno.legajo, alumno.apellidoNombre, alumno.promedio, alumno.turno);',
    ['FORMATO_NO_CORRESPONDE_AL_TIPO']
  ),
  leer(
    6,
    'el turno con el formato de un entero',
    'printf("%d %s %.2f %d\\n", alumno.legajo, alumno.apellidoNombre, alumno.promedio, alumno.turno);',
    ['FORMATO_NO_CORRESPONDE_AL_TIPO']
  ),
  leer(
    6,
    'el apellido con el formato de una letra',
    'printf("%d %c %.2f %c\\n", alumno.legajo, alumno.apellidoNombre, alumno.promedio, alumno.turno);',
    ['FORMATO_NO_CORRESPONDE_AL_TIPO']
  ),
  leer(
    6,
    'con &',
    'printf("%d %s %.2f %c\\n", &alumno.legajo, alumno.apellidoNombre, alumno.promedio, alumno.turno);',
    ['AMPERSAND_DE_MAS']
  ),
  leer(
    6,
    'faltan valores',
    'printf("%d %s %.2f %c\\n", alumno.legajo, alumno.apellidoNombre);',
    ['FORMATO_CANTIDAD_DISTINTA']
  ),
  leer(6, 'falta el turno', 'printf("%d %s %.2f\\n", alumno.legajo, alumno.apellidoNombre, alumno.promedio);', ['MUESTRA_CAMPO_FALTA']),
  leer(6, 'la variable entera', 'printf("%d", alumno);', ['ARGUMENTO_SIN_CAMPO']),
  leer(
    6,
    'un campo sin la variable',
    'printf("%d %s %.2f %c\\n", legajo, alumno.apellidoNombre, alumno.promedio, alumno.turno);',
    ['CAMPO_SIN_VARIABLE']
  ),
  leer(6, 'sin mostrar nada', 'int i;', ['MUESTRA_FALTA']),
];

// Un arreglo de estructuras.
const arreglo = (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: 'estructuras-arreglo',
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

const GUARDAR_ALUMNO =
  'alumnos[1].legajo = 30872;\nstrcpy(alumnos[1].apellidoNombre, "Lopez, Juan");\nalumnos[1].promedio = 9.10;\nalumnos[1].turno = \'M\';';

export const CASOS_DE_ARREGLO_DE_ESTRUCTURAS = [
  // 1: declarar
  arreglo(1, 'con la constante', 'TAlumno alumnos[MAX_ALUMNOS];', 'ok', { mejoras: [] }),
  arreglo(1, 'con el numero suelto', 'TAlumno alumnos[3];'),
  arreglo(1, 'otro nombre', 'TAlumno curso[MAX_ALUMNOS];', ['VARIABLE_NOMBRE']),
  arreglo(1, 'sin arreglo', 'TAlumno alumnos;', ['VARIABLE_NO_ES_ARREGLO']),
  arreglo(1, 'de enteros', 'int alumnos[MAX_ALUMNOS];', ['VARIABLE_TIPO']),
  arreglo(1, 'con otro tamano', 'TAlumno alumnos[5];', ['ARREGLO_GRANDE']),
  arreglo(1, 'sin tamano', 'TAlumno alumnos[];', ['ARREGLO_SIN_DIMENSION']),
  // 2: el legajo del primero
  arreglo(2, 'legajo', 'alumnos[0].legajo = 20431;'),
  arreglo(2, 'guarda tambien el promedio', 'alumnos[0].legajo = 20431;\nalumnos[0].promedio = 8.45;', ['CAMPO_NO_PEDIDO']),
  arreglo(2, 'otra posicion', 'alumnos[1].legajo = 20431;', ['ARGUMENTO_OTRA_POSICION']),
  arreglo(2, 'el arreglo sin indice', 'alumnos.legajo = 20431;', ['ARREGLO_SIN_INDICE']),
  arreglo(2, 'una posicion que no existe', 'alumnos[3].legajo = 20431;', ['INDICE_FUERA_DE_RANGO']),
  arreglo(2, 'el campo sin el arreglo', 'legajo = 20431;', ['CAMPO_SIN_VARIABLE']),
  arreglo(2, 'otro valor', 'alumnos[0].legajo = 1;', ['ASIGNACION_VALOR_DISTINTO']),
  arreglo(2, 'un campo que no existe', 'alumnos[0].codigo = 20431;', ['CAMPO_NO_EXISTE']),
  arreglo(2, 'la flecha', 'alumnos[0]->legajo = 20431;', ['FLECHA_CON_VARIABLE']),
  // 3: los datos de un alumno
  arreglo(3, 'los cuatro datos', GUARDAR_ALUMNO),
  arreglo(
    3,
    'con strncpy',
    GUARDAR_ALUMNO.replace('strcpy(alumnos[1].apellidoNombre, "Lopez, Juan")', 'strncpy(alumnos[1].apellidoNombre, "Lopez, Juan", 50)')
  ),
  arreglo(3, 'en otra posicion', GUARDAR_ALUMNO.split('alumnos[1]').join('alumnos[0]'), ['ARGUMENTO_OTRA_POSICION']),
  arreglo(
    3,
    'el apellido con =',
    'alumnos[1].legajo = 30872;\nalumnos[1].apellidoNombre = "Lopez, Juan";\nalumnos[1].promedio = 9.10;\nalumnos[1].turno = \'M\';',
    ['ASIGNACION_DE_ARREGLO']
  ),
  arreglo(3, 'otro apellido', GUARDAR_ALUMNO.replace('Lopez, Juan', 'Lopez Juan'), ['TEXTO_DISTINTO']),
  arreglo(3, 'el turno entre comillas dobles', GUARDAR_ALUMNO.replace("'M'", '"M"'), ['LETRA_ENTRE_COMILLAS_DOBLES']),
  arreglo(3, 'falta el promedio', GUARDAR_ALUMNO.replace('alumnos[1].promedio = 9.10;\n', ''), ['CAMPO_SIN_CARGAR']),
  arreglo(3, 'falta el apellido', GUARDAR_ALUMNO.replace('strcpy(alumnos[1].apellidoNombre, "Lopez, Juan");\n', ''), ['LLAMADA_FALTA']),
  arreglo(
    3,
    'el apellido letra por letra',
    "alumnos[1].legajo = 30872;\nalumnos[1].apellidoNombre[0] = 'L';\nalumnos[1].promedio = 9.10;\nalumnos[1].turno = 'M';",
    ['A_MANO']
  ),
  // 4: el cuestionario
  arreglo(4, 'sin cargar: no se puede saber', '2'),
  arreglo(4, 'sin cargar: cero', '0', ['OPCION_ELEMENTO_SIN_CARGAR_ES_CERO']),
  arreglo(4, 'sin cargar: el anterior', '1', ['OPCION_ELEMENTO_REPITE_EL_ANTERIOR']),
  // 5: leer los legajos
  arreglo(5, 'con la constante', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  scanf("%d", &alumnos[i].legajo);\n}', 'ok', { mejoras: [] }),
  arreglo(5, 'con el numero suelto', 'for (i = 0; i < 3; i++) {\n  scanf("%d", &alumnos[i].legajo);\n}', 'ok', {
    mejoras: ['LIMITE_CON_NUMERO_SUELTO'],
  }),
  arreglo(5, 'con while', 'i = 0;\nwhile (i < MAX_ALUMNOS) {\n  scanf("%d", &alumnos[i].legajo);\n  i++;\n}'),
  arreglo(5, 'sin el ultimo', 'for (i = 0; i < MAX_ALUMNOS - 1; i++) {\n  scanf("%d", &alumnos[i].legajo);\n}', ['RECORRIDO_INCOMPLETO']),
  arreglo(5, 'sin el &','for (i = 0; i < MAX_ALUMNOS; i++) {\n  scanf("%d", alumnos[i].legajo);\n}', ['AMPERSAND_FALTA']),
  arreglo(5, 'el arreglo sin indice', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  scanf("%d", &alumnos.legajo[i]);\n}', ['ARREGLO_SIN_INDICE']),
  arreglo(5, 'el campo antes del indice', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  scanf("%d", &alumnos.legajo);\n}', ['ARREGLO_SIN_INDICE']),
  arreglo(5, 'una posicion de mas', 'for (i = 0; i <= MAX_ALUMNOS; i++) {\n  scanf("%d", &alumnos[i].legajo);\n}', ['INDICE_FUERA_DE_RANGO']),
  arreglo(5, 'el formato de un decimal', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  scanf("%f", &alumnos[i].legajo);\n}', ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  arreglo(5, 'otro campo', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  scanf("%d", &alumnos[i].turno);\n}', ['LECTURA_OTRO_CAMPO']),
  arreglo(5, 'sin ciclo', 'scanf("%d", &alumnos[0].legajo);\nscanf("%d", &alumnos[1].legajo);\nscanf("%d", &alumnos[2].legajo);', ['CICLO_FALTA']),
  // 6: mostrar
  arreglo(6, 'con la constante', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  printf("%d %.2f\\n", alumnos[i].legajo, alumnos[i].promedio);\n}', 'ok', {
    mejoras: [],
  }),
  arreglo(6, 'con %f', 'for (i = 0; i < MAX_ALUMNOS; i++) {\n  printf("%d %f\\n", alumnos[i].legajo, alumnos[i].promedio);\n}'),
  arreglo(
    6,
    'el legajo con el formato de un decimal',
    'for (i = 0; i < MAX_ALUMNOS; i++) {\n  printf("%f %f\\n", alumnos[i].legajo, alumnos[i].promedio);\n}',
    ['FORMATO_NO_CORRESPONDE_AL_TIPO']
  ),
  arreglo(
    6,
    'el promedio con el formato de un entero',
    'for (i = 0; i < MAX_ALUMNOS; i++) {\n  printf("%d %d\\n", alumnos[i].legajo, alumnos[i].promedio);\n}',
    ['FORMATO_NO_CORRESPONDE_AL_TIPO']
  ),
  arreglo(
    6,
    'el arreglo sin indice',
    'for (i = 0; i < MAX_ALUMNOS; i++) {\n  printf("%d %.2f\\n", alumnos.legajo, alumnos.promedio);\n}',
    ['ARREGLO_SIN_INDICE']
  ),
  arreglo(
    6,
    'falta un valor',
    'for (i = 0; i < MAX_ALUMNOS; i++) {\n  printf("%d %.2f\\n", alumnos[i].legajo);\n}',
    ['FORMATO_CANTIDAD_DISTINTA']
  ),
  arreglo(
    6,
    'solo el legajo',
    'for (i = 0; i < MAX_ALUMNOS; i++) {\n  printf("%d\\n", alumnos[i].legajo);\n}',
    ['MUESTRA_DISTINTA']
  ),
  arreglo(
    6,
    'sin ciclo',
    'printf("%d %.2f\\n", alumnos[0].legajo, alumnos[0].promedio);',
    ['CICLO_FALTA']
  ),
];

// Recorrer un arreglo de estructuras.
const recorrer = (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: 'estructuras-recorrer',
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

const BUCLE = (cuerpo, desde = '0', hasta = 'i < MAX_ALUMNOS') =>
  `for (i = ${desde}; ${hasta}; i++) {\n${cuerpo}\n}`;

export const CASOS_DE_RECORRER_ESTRUCTURAS = [
  // 1: sumar los promedios
  recorrer(1, 'suma', BUCLE('  total += alumnos[i].promedio;'), 'ok', { mejoras: [] }),
  recorrer(1, 'suma con el numero suelto', BUCLE('  total += alumnos[i].promedio;', '0', 'i < 3'), 'ok', {
    mejoras: ['LIMITE_CON_NUMERO_SUELTO'],
  }),
  recorrer(1, 'suma con total = total + ...', BUCLE('  total = total + alumnos[i].promedio;')),
  recorrer(1, 'se pisa el total', BUCLE('  total = alumnos[i].promedio;'), ['ACUMULADOR_SE_PISA']),
  recorrer(1, 'el total se reinicia', BUCLE('  total = 0;\n  total += alumnos[i].promedio;'), ['ACUMULADOR_REINICIADO']),
  recorrer(1, 'suma el legajo', BUCLE('  total += alumnos[i].legajo;'), ['CAMPO_MARCADO_SIN_USAR']),
  recorrer(1, 'sin el ultimo', BUCLE('  total += alumnos[i].promedio;', '0', 'i < MAX_ALUMNOS - 1'), ['RECORRIDO_INCOMPLETO']),
  recorrer(1, 'una posicion de mas', BUCLE('  total += alumnos[i].promedio;', '0', 'i <= MAX_ALUMNOS'), ['INDICE_FUERA_DE_RANGO']),
  recorrer(1, 'el arreglo sin indice', BUCLE('  total += alumnos.promedio;'), ['ARREGLO_SIN_INDICE']),
  recorrer(1, 'sin ciclo', 'total = alumnos[0].promedio + alumnos[1].promedio + alumnos[2].promedio;', ['CICLO_FALTA']),
  // 2: contar el turno
  recorrer(2, 'cuenta', BUCLE("  if (alumnos[i].turno == 'T') {\n    cantidad++;\n  }"), 'ok', { mejoras: [] }),
  recorrer(2, 'cuenta con += 1', BUCLE("  if (alumnos[i].turno == 'T') {\n    cantidad += 1;\n  }")),
  recorrer(2, 'un = en el if', BUCLE("  if (alumnos[i].turno = 'T') {\n    cantidad++;\n  }"), ['ASIGNACION_EN_CONDICION']),
  recorrer(2, 'un += en el if', BUCLE("  if (cantidad += 1) {\n    cantidad++;\n  }"), ['ASIGNACION_EN_CONDICION']),
  recorrer(2, 'un = en la condicion del for', BUCLE("  if (alumnos[i].turno == 'T') {\n    cantidad++;\n  }", '0', 'i = MAX_ALUMNOS'), ['ASIGNACION_EN_CONDICION']),
  recorrer(2, 'sin el ultimo', BUCLE("  if (alumnos[i].turno == 'T') {\n    cantidad++;\n  }", '0', 'i < MAX_ALUMNOS - 1'), ['RECORRIDO_INCOMPLETO']),
  recorrer(2, 'cuenta todos',BUCLE('  cantidad++;'), ['CAMPO_MARCADO_SIN_USAR']),
  recorrer(2, 'cuenta otro turno', BUCLE("  if (alumnos[i].turno == 'M') {\n    cantidad++;\n  }"), ['RESULTADO_VALOR_DISTINTO']),
  recorrer(2, 'la letra entre comillas dobles', BUCLE('  if (alumnos[i].turno == "T") {\n    cantidad++;\n  }'), ['LETRA_ENTRE_COMILLAS_DOBLES']),
  recorrer(2, 'sin la letra entre comillas', BUCLE('  if (alumnos[i].turno == T) {\n    cantidad++;\n  }'), ['NOMBRE_NO_DECLARADO']),
  recorrer(2, 'solo la primera posicion', "if (alumnos[0].turno == 'T') {\n  cantidad++;\n}", ['CICLO_FALTA']),
  // 3: el legajo del mayor promedio
  recorrer(
    3,
    'el mayor',
    'mayorPromedio = alumnos[0].promedio;\nlegajoMayor = alumnos[0].legajo;\nfor (i = 1; i < MAX_ALUMNOS; i++) {\n  if (alumnos[i].promedio > mayorPromedio) {\n    mayorPromedio = alumnos[i].promedio;\n    legajoMayor = alumnos[i].legajo;\n  }\n}'
  ),
  recorrer(
    3,
    'empezando en cero',
    'mayorPromedio = 0;\nlegajoMayor = 0;\nfor (i = 0; i < MAX_ALUMNOS; i++) {\n  if (alumnos[i].promedio > mayorPromedio) {\n    mayorPromedio = alumnos[i].promedio;\n    legajoMayor = alumnos[i].legajo;\n  }\n}'
  ),
  recorrer(
    3,
    'el menor en vez del mayor',
    'mayorPromedio = alumnos[0].promedio;\nlegajoMayor = alumnos[0].legajo;\nfor (i = 1; i < MAX_ALUMNOS; i++) {\n  if (alumnos[i].promedio < mayorPromedio) {\n    mayorPromedio = alumnos[i].promedio;\n    legajoMayor = alumnos[i].legajo;\n  }\n}',
    ['RESULTADO_VALOR_DISTINTO']
  ),
  recorrer(
    3,
    'el legajo no se actualiza',
    'mayorPromedio = alumnos[0].promedio;\nlegajoMayor = alumnos[0].legajo;\nfor (i = 1; i < MAX_ALUMNOS; i++) {\n  if (alumnos[i].promedio > mayorPromedio) {\n    mayorPromedio = alumnos[i].promedio;\n  }\n}',
    ['RESULTADO_VALOR_DISTINTO']
  ),
  recorrer(
    3,
    'guarda el promedio en lugar del legajo',
    'mayorPromedio = alumnos[0].promedio;\nlegajoMayor = alumnos[0].promedio;\nfor (i = 1; i < MAX_ALUMNOS; i++) {\n  if (alumnos[i].promedio > mayorPromedio) {\n    mayorPromedio = alumnos[i].promedio;\n    legajoMayor = alumnos[i].promedio;\n  }\n}',
    ['RESULTADO_VALOR_DISTINTO']
  ),
  recorrer(
    3,
    'sin el mayor inicial',
    'for (i = 0; i < MAX_ALUMNOS; i++) {\n  if (alumnos[i].promedio > mayorPromedio) {\n    mayorPromedio = alumnos[i].promedio;\n    legajoMayor = alumnos[i].legajo;\n  }\n}',
    ['VARIABLE_SIN_VALOR']
  ),
  // 4: buscar un legajo
  recorrer(4, 'busca', BUCLE('  if (alumnos[i].legajo == legajoBuscado) {\n    promedioBuscado = alumnos[i].promedio;\n  }'), 'ok', {
    mejoras: [],
  }),
  recorrer(
    4,
    'busca y corta',
    BUCLE('  if (alumnos[i].legajo == legajoBuscado) {\n    promedioBuscado = alumnos[i].promedio;\n    break;\n  }')
  ),
  recorrer(
    4,
    'devuelve el legajo',
    BUCLE('  if (alumnos[i].legajo == legajoBuscado) {\n    promedioBuscado = alumnos[i].legajo;\n  }'),
    ['RESULTADO_VALOR_DISTINTO']
  ),
  recorrer(
    4,
    'compara con la posicion',
    BUCLE('  if (i == legajoBuscado) {\n    promedioBuscado = alumnos[i].promedio;\n  }'),
    ['RESULTADO_VALOR_DISTINTO']
  ),
  recorrer(
    4,
    'busca por un campo equivocado',
    BUCLE('  if (alumnos[i].promedio == legajoBuscado) {\n    promedioBuscado = alumnos[i].promedio;\n  }'),
    ['RESULTADO_VALOR_DISTINTO']
  ),
  recorrer(
    4,
    'cero si no esta',
    'promedioBuscado = 0;\n' +
      BUCLE('  if (alumnos[i].legajo == legajoBuscado) {\n    promedioBuscado = alumnos[i].promedio;\n  }'),
    ['RESULTADO_VALOR_DISTINTO']
  ),
  recorrer(
    4,
    'solo mira el primero',
    'if (alumnos[0].legajo == legajoBuscado) {\n  promedioBuscado = alumnos[0].promedio;\n}',
    ['CICLO_FALTA']
  ),
];

// El arreglo de estructuras sin decir cual elemento, donde sea que este: se dice
// una vez y no se sigue el codigo (nada de "no pude verificarlo" encima).
const sinIndice = (serie, paso, nombre, respuesta, espera) => ({
  serie,
  paso,
  nombre,
  respuesta,
  espera,
  sinAvisos: true,
});

export const CASOS_DE_ARREGLO_SIN_INDICE = [
  sinIndice(
    'estructuras-recorrer',
    2,
    'sin indice en la condicion de un if',
    "for (i = 0; i < MAX_ALUMNOS; i++) {\n  if (alumnos.turno == 'T') {\n    cantidad++;\n  }\n}",
    ['ARREGLO_SIN_INDICE']
  ),
  sinIndice(
    'estructuras-recorrer',
    3,
    'sin indice en una comparacion con >',
    'mayorPromedio = alumnos[0].promedio;\nlegajoMayor = alumnos[0].legajo;\nfor (i = 1; i < MAX_ALUMNOS; i++) {\n  if (alumnos.promedio > mayorPromedio) {\n    mayorPromedio = alumnos[i].promedio;\n    legajoMayor = alumnos[i].legajo;\n  }\n}',
    ['ARREGLO_SIN_INDICE']
  ),
  sinIndice(
    'estructuras-recorrer',
    4,
    'sin indice en la comparacion de la busqueda',
    'for (i = 0; i < MAX_ALUMNOS; i++) {\n  if (alumnos.legajo == legajoBuscado) {\n    promedioBuscado = alumnos[i].promedio;\n  }\n}',
    ['ARREGLO_SIN_INDICE']
  ),
  sinIndice(
    'estructuras-recorrer',
    4,
    'sin indice afuera y el ciclo bien escrito',
    'promedioBuscado = alumnos.promedio;\nfor (i = 0; i < MAX_ALUMNOS; i++) {\n  if (alumnos[i].legajo == legajoBuscado) {\n    promedioBuscado = alumnos[i].promedio;\n  }\n}',
    ['ARREGLO_SIN_INDICE']
  ),
  sinIndice(
    'estructuras-recorrer',
    1,
    'una posicion que no existe afuera y el ciclo bien escrito',
    'total = alumnos[3].promedio;\nfor (i = 0; i < MAX_ALUMNOS; i++) {\n  total += alumnos[i].promedio;\n}',
    ['INDICE_FUERA_DE_RANGO']
  ),
  sinIndice(
    'estructuras-arreglo',
    5,
    'sin indice afuera y la lectura bien escrita',
    'alumnos.legajo = 20431;\nfor (i = 0; i < MAX_ALUMNOS; i++) {\n  scanf("%d", &alumnos[i].legajo);\n}',
    ['ARREGLO_SIN_INDICE']
  ),
  sinIndice(
    'estructuras-arreglo',
    6,
    'sin indice en la condicion y el printf bien escrito',
    'for (i = 0; i < MAX_ALUMNOS; i++) {\n  if (alumnos.legajo != 0) {\n    printf("%d %.2f\\n", alumnos[i].legajo, alumnos[i].promedio);\n  }\n}',
    ['ARREGLO_SIN_INDICE']
  ),
];

// Estructuras dentro de estructuras.
const anidadas = (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: 'estructuras-anidadas',
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

const TIPO_ALUMNO = (campos) => `typedef struct {\n${campos}\n} TAlumno;`;
const CAMPO_LEGAJO = '  int legajo;';
const CAMPO_APELLIDO = '  char apellidoNombre[50];';
const CAMPOS_FECHAS = '  TFecha nacimiento;\n  TFecha ingreso;';
const BUCLE_ANIO = (condicion) =>
  `for (i = 0; i < MAX_ALUMNOS; i++) {\n  if (${condicion}) {\n    cantidad++;\n  }\n}`;

export const CASOS_DE_ANIDADAS = [
  // 1: declarar
  anidadas(1, 'las dos fechas', TIPO_ALUMNO([CAMPO_LEGAJO, CAMPO_APELLIDO, CAMPOS_FECHAS].join('\n'))),
  anidadas(1, 'en otro orden', TIPO_ALUMNO(['  TFecha ingreso;', CAMPO_APELLIDO, '  TFecha nacimiento;', CAMPO_LEGAJO].join('\n'))),
  anidadas(
    1,
    'con otro alias',
    'typedef struct {\n  int legajo;\n  char apellidoNombre[50];\n  TFecha nacimiento;\n  TFecha ingreso;\n} Alumno;',
    ['ALIAS_NOMBRE']
  ),
  anidadas(1, 'una fecha de menos', TIPO_ALUMNO([CAMPO_LEGAJO, CAMPO_APELLIDO, '  TFecha nacimiento;'].join('\n')), ['CAMPO_FALTA']),
  anidadas(
    1,
    'las fechas como enteros',
    TIPO_ALUMNO([CAMPO_LEGAJO, CAMPO_APELLIDO, '  int nacimiento;', '  int ingreso;'].join('\n')),
    ['CAMPO_TIPO']
  ),
  anidadas(
    1,
    'las fechas como arreglos',
    TIPO_ALUMNO([CAMPO_LEGAJO, CAMPO_APELLIDO, '  TFecha nacimiento[1];', '  TFecha ingreso;'].join('\n')),
    ['CAMPO_TIPO']
  ),
  anidadas(
    1,
    'la fecha escrita campo por campo',
    TIPO_ALUMNO([CAMPO_LEGAJO, CAMPO_APELLIDO, '  int dia;', '  int mes;', '  int anio;'].join('\n')),
    ['CAMPO_FALTA']
  ),
  // 2: el año de nacimiento
  anidadas(2, 'el anio', 'alumno.nacimiento.anio = 2004;'),
  anidadas(2, 'guarda el dia en vez del anio', 'alumno.nacimiento.dia = 2004;', ['CAMPO_SIN_CARGAR'], {
    dice: ['El programa guarda en `alumno.nacimiento.dia`, pero la consigna pide `alumno.nacimiento.anio`.'],
  }),
  anidadas(2, 'guarda tambien el mes', 'alumno.nacimiento.anio = 2004;\nalumno.nacimiento.mes = 3;', ['CAMPO_NO_PEDIDO']),
  anidadas(2, 'guarda tambien la otra fecha', 'alumno.nacimiento.anio = 2004;\nalumno.ingreso.anio = 2022;', ['CAMPO_OTRA_ESTRUCTURA']),
  anidadas(2, 'saltando el nivel', 'alumno.anio = 2004;', ['CAMPO_DE_OTRO_NIVEL']),
  anidadas(2, 'sin la variable', 'nacimiento.anio = 2004;', ['VARIABLE_DESCONOCIDA']),
  anidadas(2, 'la otra fecha', 'alumno.ingreso.anio = 2004;', ['CAMPO_OTRA_ESTRUCTURA']),
  anidadas(2, 'otro valor', 'alumno.nacimiento.anio = 2005;', ['ASIGNACION_VALOR_DISTINTO']),
  anidadas(2, 'un campo que no existe', 'alumno.nacimiento.year = 2004;', ['CAMPO_NO_EXISTE']),
  anidadas(2, 'la fecha entera', 'alumno.nacimiento = 2004;', ['CAMPO_ES_UNA_ESTRUCTURA']),
  // 3: la fecha de ingreso
  anidadas(3, 'los tres', 'alumno.ingreso.dia = 1;\nalumno.ingreso.mes = 3;\nalumno.ingreso.anio = 2022;'),
  anidadas(3, 'guarda tambien el nacimiento', 'alumno.ingreso.dia = 1;\nalumno.ingreso.mes = 3;\nalumno.ingreso.anio = 2022;\nalumno.nacimiento.anio = 2004;', ['CAMPO_OTRA_ESTRUCTURA']),
  anidadas(3, 'en otro orden', 'alumno.ingreso.anio = 2022;\nalumno.ingreso.mes = 3;\nalumno.ingreso.dia = 1;'),
  anidadas(3, 'falta el mes', 'alumno.ingreso.dia = 1;\nalumno.ingreso.anio = 2022;', ['CAMPO_SIN_CARGAR']),
  anidadas(
    3,
    'la fecha de nacimiento',
    'alumno.nacimiento.dia = 1;\nalumno.nacimiento.mes = 3;\nalumno.nacimiento.anio = 2022;',
    ['CAMPO_OTRA_ESTRUCTURA']
  ),
  anidadas(3, 'un valor distinto', 'alumno.ingreso.dia = 1;\nalumno.ingreso.mes = 4;\nalumno.ingreso.anio = 2022;', [
    'ASIGNACION_VALOR_DISTINTO',
  ]),
  // 4: cada campo en su nivel
  anidadas(4, 'cada campo en su nivel: la correcta', '1'),
  anidadas(4, 'cada campo en su nivel: salta el nivel', '0', ['OPCION_SALTA_EL_NIVEL']),
  anidadas(4, 'cada campo en su nivel: sin la variable', '2', ['OPCION_SIN_LA_VARIABLE']),
  anidadas(4, 'cada campo en su nivel: la otra fecha', '3', ['OPCION_OTRA_FECHA']),
  // 5: la edad de ingreso
  anidadas(5, 'la edad', 'edad = alumno.ingreso.anio - alumno.nacimiento.anio;', 'ok', { sinAvisos: true }),
  anidadas(5, 'la edad, al reves', 'edad = alumno.nacimiento.anio - alumno.ingreso.anio;', ['RESULTADO_VALOR_DISTINTO']),
  anidadas(5, 'el resultado escrito', 'edad = 18;', ['RESULTADO_VALOR_DISTINTO']),
  anidadas(5, 'solo el anio de ingreso', 'edad = alumno.ingreso.anio;', ['RESULTADO_VALOR_DISTINTO']),
  anidadas(
    5,
    'la fecha entera en la cuenta',
    'edad = alumno.ingreso.anio - alumno.nacimiento;',
    ['CAMPO_ES_UNA_ESTRUCTURA'],
    { sinAvisos: true }
  ),
  anidadas(5, 'saltando el nivel', 'edad = alumno.anio - alumno.nacimiento.anio;', ['CAMPO_DE_OTRO_NIVEL'], {
    sinAvisos: true,
  }),
  anidadas(5, 'sin el campo', 'edad = alumno.ingreso.year - alumno.nacimiento.anio;', ['CAMPO_NO_EXISTE'], {
    sinAvisos: true,
  }),
  // 6: copiar la fecha
  anidadas(6, 'copia entera', 'otraFecha = alumno.ingreso;', 'ok', { mejoras: [] }),
  anidadas(
    6,
    'campo por campo, con mejora',
    'otraFecha.dia = alumno.ingreso.dia;\notraFecha.mes = alumno.ingreso.mes;\notraFecha.anio = alumno.ingreso.anio;',
    'ok',
    { mejoras: ['COPIA_CAMPO_POR_CAMPO'] }
  ),
  anidadas(
    6,
    'campo por campo, falta uno',
    'otraFecha.dia = alumno.ingreso.dia;\notraFecha.anio = alumno.ingreso.anio;',
    ['COPIA_INCOMPLETA']
  ),
  anidadas(6, 'al reves', 'alumno.ingreso = otraFecha;', ['ASIGNACION_AL_REVES']),
  anidadas(6, 'la otra fecha', 'otraFecha = alumno.nacimiento;', ['COPIA_FALTA']),
  anidadas(6, 'con igual doble', 'otraFecha == alumno.ingreso;', ['ASIGNACION_CON_IGUAL_DOBLE']),
  anidadas(6, 'con strcpy', 'strcpy(otraFecha, alumno.ingreso);', ['FUNCION_EQUIVOCADA']),
  // 7: contar los nacidos antes del 2000
  anidadas(7, 'contar', BUCLE_ANIO('alumnos[i].nacimiento.anio < 2000'), 'ok', { mejoras: [] }),
  anidadas(7, 'con el numero suelto en el ciclo', 'for (i = 0; i < 3; i++) {\n  if (alumnos[i].nacimiento.anio < 2000) {\n    cantidad++;\n  }\n}', 'ok', {
    mejoras: ['LIMITE_CON_NUMERO_SUELTO'],
  }),
  anidadas(
    7,
    'sin el ultimo alumno',
    'for (i = 0; i < MAX_ALUMNOS - 1; i++) {\n  if (alumnos[i].nacimiento.anio < 2000) {\n    cantidad++;\n  }\n}',
    ['RECORRIDO_INCOMPLETO']
  ),
  anidadas(7, 'con <=',BUCLE_ANIO('alumnos[i].nacimiento.anio <= 2000'), ['RESULTADO_VALOR_DISTINTO']),
  anidadas(7, 'con >', BUCLE_ANIO('alumnos[i].nacimiento.anio > 2000'), ['RESULTADO_VALOR_DISTINTO']),
  anidadas(7, 'la fecha de ingreso', BUCLE_ANIO('alumnos[i].ingreso.anio < 2000'), ['CAMPO_MARCADO_SIN_USAR']),
  {
    ...anidadas(7, 'el mes en vez del anio', BUCLE_ANIO('alumnos[i].nacimiento.mes < 2000'), ['CAMPO_MARCADO_SIN_USAR']),
    dice: ['nunca usa `alumnos[i].nacimiento.anio`'],
  },
  anidadas(7, 'usa otro campo ademas del anio', BUCLE_ANIO('alumnos[i].nacimiento.anio < 2000 && alumnos[i].nacimiento.mes > 0')),
  anidadas(7, 'sin el indice', BUCLE_ANIO('alumnos.nacimiento.anio < 2000'), ['ARREGLO_SIN_INDICE'], { sinAvisos: true }),
  anidadas(7, 'saltando el nivel', BUCLE_ANIO('alumnos[i].anio < 2000'), ['CAMPO_DE_OTRO_NIVEL'], { sinAvisos: true }),
  anidadas(7, 'sin ciclo', "if (alumnos[0].nacimiento.anio < 2000) {\n  cantidad++;\n}", ['CICLO_FALTA']),
];

// Copiar y comparar variables de estructura.
const copiar =(paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: 'estructuras-copiar',
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

export const CASOS_DE_COPIAR = [
  // 1: copiar todo
  copiar(1, 'copia entera', 'copia = alumno;', 'ok', { mejoras: [] }),
  copiar(1, 'copia entera, sin espacios', 'copia=alumno;', 'ok', { mejoras: [] }),
  copiar(1, 'al reves', 'alumno = copia;', ['ASIGNACION_AL_REVES']),
  copiar(1, 'con igual doble', 'copia == alumno;', ['ASIGNACION_CON_IGUAL_DOBLE']),
  copiar(1, 'con strcpy', 'strcpy(copia, alumno);', ['FUNCION_EQUIVOCADA']),
  copiar(1, 'con memcpy', 'memcpy(&copia, &alumno, sizeof(copia));', ['FUNCION_EQUIVOCADA']),
  copiar(1, 'sin copiar nada', 'int i;', ['COPIA_FALTA']),
  copiar(
    1,
    'campo por campo, valido con mejora',
    'copia.legajo = alumno.legajo;\nstrcpy(copia.apellidoNombre, alumno.apellidoNombre);\ncopia.promedio = alumno.promedio;\ncopia.turno = alumno.turno;',
    'ok',
    { mejoras: ['COPIA_CAMPO_POR_CAMPO'] }
  ),
  copiar(
    1,
    'campo por campo, falta uno',
    'copia.legajo = alumno.legajo;\nstrcpy(copia.apellidoNombre, alumno.apellidoNombre);\ncopia.promedio = alumno.promedio;',
    ['COPIA_INCOMPLETA']
  ),
  copiar(
    1,
    'campo por campo, la cadena con =',
    'copia.legajo = alumno.legajo;\ncopia.apellidoNombre = alumno.apellidoNombre;\ncopia.promedio = alumno.promedio;\ncopia.turno = alumno.turno;',
    ['ASIGNACION_DE_ARREGLO']
  ),
  // 2 y 3: los cuestionarios
  copiar(2, 'despues de copiar: el legajo copiado', '0'),
  copiar(2, 'despues de copiar: el nuevo', '1', ['OPCION_COPIA_SIGUE_AL_ORIGINAL']),
  copiar(2, 'despues de copiar: no se puede saber', '2', ['OPCION_NO_SE_SABE_COPIA']),
  copiar(3, 'comparar estructuras: no compila', '0'),
  copiar(3, 'comparar estructuras: muestra Iguales', '1', ['OPCION_IGUAL_COMPARA_TODO']),
  copiar(3, 'comparar estructuras: muestra No son iguales', '2', ['OPCION_IGUAL_DA_FALSO']),
  // 4: los legajos
  copiar(4, 'legajos', 'if (alumno.legajo == copia.legajo) {\n  iguales = 1;\n}'),
  copiar(4, 'legajos, al reves', 'if (copia.legajo == alumno.legajo) {\n  iguales = 1;\n}'),
  copiar(4, 'las estructuras enteras', 'if (alumno == copia) {\n  iguales = 1;\n}', ['COMPARA_ESTRUCTURAS']),
  copiar(4, 'con un solo igual', 'if (alumno.legajo = copia.legajo) {\n  iguales = 1;\n}', ['ASIGNACION_EN_CONDICION']),
  copiar(4, 'otro campo', 'if (alumno.promedio == copia.promedio) {\n  iguales = 1;\n}', ['COMPARA_OTRO_CAMPO']),
  copiar(4, 'sin comparar', 'iguales = 1;', ['COMPARACION_FALTA']),
  // 5: los apellidos y nombres
  copiar(5, 'strcmp de los campos', 'if (strcmp(alumno.apellidoNombre, copia.apellidoNombre) == 0) {\n  iguales = 1;\n}', 'ok', {
    mejoras: [],
  }),
  copiar(
    5,
    'con igual doble',
    'if (alumno.apellidoNombre == copia.apellidoNombre) {\n  iguales = 1;\n}',
    ['COMPARAR_CON_IGUAL']
  ),
  copiar(
    5,
    'otro campo',
    'if (strcmp(alumno.apellidoNombre, copia.turno) == 0) {\n  iguales = 1;\n}',
    ['ARGUMENTO_OTRO_CAMPO']
  ),
  copiar(
    5,
    'el campo sin la variable',
    'if (strcmp(apellidoNombre, copia.apellidoNombre) == 0) {\n  iguales = 1;\n}',
    ['CAMPO_SIN_VARIABLE']
  ),
];
