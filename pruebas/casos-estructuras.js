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

// Copiar y comparar variables de estructura.
const copiar = (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
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
