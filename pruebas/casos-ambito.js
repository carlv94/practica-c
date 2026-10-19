// Casos de las series de ambito: las variables de una funcion, ambito de una
// variable y variables globales (series 2, 3 y 4 de "Funciones y ambito").
// Mismo formato que casos.js.

const serie = (id) => (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: id,
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

const variables = serie('funciones-variables');
const ambito = serie('funciones-ambito');
const globales = serie('funciones-globales');

const FUNCION = (encabezado, cuerpo) => `${encabezado} {\n${cuerpo}\n}`;

export const CASOS_DE_AMBITO = [
  // ===== 2: las variables de una funcion =====
  variables(1, 'cuando se crea: la correcta', '1'),
  variables(1, 'cuando se crea: una sola vez', '0', ['OPCION_UNA_VEZ']),
  variables(1, 'cuando se crea: se reutiliza', '2', ['OPCION_SE_REUTILIZA']),
  variables(2, 'no recuerda: la correcta', '1'),
  variables(2, 'no recuerda: recuerda', '0', ['OPCION_RECUERDA']),
  variables(2, 'no recuerda: ceros', '2', ['OPCION_NO_SUMA']),
  variables(3, 'mismo nombre: la correcta', '1'),
  variables(3, 'mismo nombre: se modifico', '0', ['OPCION_SE_MODIFICO']),
  variables(3, 'mismo nombre: la de afuera', '2', ['OPCION_USA_LA_DE_AFUERA']),

  // ===== 3: ambito de una variable =====
  ambito(1, 'otra funcion: la correcta', '1'),
  ambito(1, 'otra funcion: se ve', '0', ['OPCION_VARIABLE_VISIBLE']),
  ambito(1, 'otra funcion: vale cero', '2', ['OPCION_VALOR_POR_DEFECTO']),
  ambito(2, 'if: la correcta', '1'),
  ambito(2, 'if: se ve', '0', ['OPCION_VARIABLE_VISIBLE']),
  ambito(2, 'if: vale cero', '2', ['OPCION_VALOR_POR_DEFECTO']),
  ambito(3, 'for: la correcta', '1'),
  ambito(3, 'for: se ve', '0', ['OPCION_VARIABLE_VISIBLE']),
  ambito(3, 'for: vale cero', '2', ['OPCION_VALOR_POR_DEFECTO']),
  ambito(4, 'tapa: la correcta', '1'),
  ambito(4, 'tapa: se modifico', '0', ['OPCION_SE_MODIFICO']),
  ambito(4, 'tapa: un error', '2', ['OPCION_ES_UN_ERROR']),
  ambito(5, 'afuera del ciclo', 'int suma = 0;\n\nfor (int i = 1; i <= 5; i++) {\n  suma = suma + i;\n}\nprintf("%d", suma);'),
  ambito(5, 'con el contador afuera', 'int suma = 0;\nint i;\n\nfor (i = 1; i <= 5; i++) {\n  suma = suma + i;\n}\nprintf("%d", suma);'),
  ambito(5, 'con while', 'int suma = 0;\nint i = 1;\n\nwhile (i <= 5) {\n  suma = suma + i;\n  i++;\n}\nprintf("%d", suma);'),
  ambito(5, 'declarada dentro del ciclo', 'for (int i = 1; i <= 5; i++) {\n  int suma = 0;\n  suma = suma + i;\n}\nprintf("%d", suma);', [
    'NOMBRE_FUERA_DE_ALCANCE',
  ], { dice: ['se declaró entre llaves', 'declararla antes del bloque'] }),
  ambito(5, 'el i de afuera', 'int suma = 0;\nfor (int i = 1; i <= 5; i++) {\n  suma = suma + i;\n}\nprintf("%d", suma + i);', [
    'NOMBRE_FUERA_DE_ALCANCE',
  ]),
  ambito(5, 'sin declararla', 'for (int i = 1; i <= 5; i++) {\n  suma = suma + i;\n}\nprintf("%d", suma);', ['NOMBRE_NO_DECLARADO']),
  ambito(5, 'declarada despues del ciclo', 'for (int i = 1; i <= 5; i++) {\n  suma = suma + i;\n}\nint suma = 0;\nprintf("%d", suma);', [
    'NOMBRE_USADO_ANTES',
  ], { dice: ['se usa antes de declararla'] }),
  ambito(5, 'muestra en cada vuelta', 'int suma = 0;\nfor (int i = 1; i <= 5; i++) {\n  suma = suma + i;\n  printf("%d", suma);\n}', ['MUESTRA_DISTINTA']),

  // ===== 4: variables globales =====
  globales(1, 'se ve: la correcta', '1'),
  globales(1, 'se ve: como local', '0', ['OPCION_COMO_LOCAL']),
  globales(1, 'se ve: un error', '2', ['OPCION_ES_UN_ERROR']),
  // ---- 2: una funcion que recuerda ----
  globales(2, 'contar con una global', 'int veces = 0;\n\n' + FUNCION('void contar(void)', '  veces = veces + 1;\n  printf("%d ", veces);')),
  globales(2, 'sin valor inicial', 'int veces;\n\n' + FUNCION('void contar(void)', '  veces = veces + 1;\n  printf("%d ", veces);'), 'ok', {
    notas: ['GLOBAL_SIN_VALOR_INICIAL'],
  }),
  globales(2, 'con otro nombre de variable', 'int cuenta = 0;\n\n' + FUNCION('void contar(void)', '  cuenta++;\n  printf("%d ", cuenta);'), ['GLOBAL_FALTA']),
  globales(2, 'la variable dentro de la funcion', FUNCION('void contar(void)', '  int veces = 0;\n\n  veces = veces + 1;\n  printf("%d ", veces);'), [
    'GLOBAL_DENTRO_DE_FUNCION',
  ], { dice: ['conserve su valor entre una llamada y otra', 'afuera de todas las funciones'] }),
  globales(2, 'otro nombre de funcion', 'int veces = 0;\n\n' + FUNCION('void sumar(void)', '  veces = veces + 1;\n  printf("%d ", veces);'), [
    'FUNCION_NOMBRE',
  ]),
  globales(2, 'no muestra', 'int veces = 0;\n\n' + FUNCION('void contar(void)', '  veces = veces + 1;'), ['MUESTRA_FALTA']),
  globales(2, 'una global de tipo real', 'float veces = 0;\n\n' + FUNCION('void contar(void)', '  veces = veces + 1;\n  printf("%d ", (int) veces);'), [
    'VARIABLE_TIPO',
  ]),
  // ---- 3: un dato que entra por una global ----
  globales(3, 'el doble', FUNCION('void mostrarDoble(void)', '  printf("%d", numero * 2);')),
  globales(3, 'con una suma', FUNCION('void mostrarDoble(void)', '  printf("%d", numero + numero);')),
  globales(3, 'modifica numero', FUNCION('void mostrarDoble(void)', '  numero = numero * 2;\n  printf("%d", numero);'), ['RESULTADO_VALOR_DISTINTO'], {
    dice: ['`numero` termina valiendo `8` y debería valer `4`'],
  }),
  globales(3, 'el triple', FUNCION('void mostrarDoble(void)', '  printf("%d", numero * 3);'), ['MUESTRA_DISTINTA']),
  globales(3, 'con un parametro', FUNCION('void mostrarDoble(int n)', '  printf("%d", n * 2);'), ['PARAMETROS_CANTIDAD']),
  globales(3, 'devuelve en vez de mostrar', FUNCION('int mostrarDoble(void)', '  return numero * 2;'), ['DEVUELVE_EN_VEZ_DE_MOSTRAR']),
  globales(3, 'otro nombre', FUNCION('void doble(void)', '  printf("%d", numero * 2);'), ['FUNCION_NOMBRE']),
  // ---- 4: dos datos distintos ----
  globales(4, 'asignando antes de cada llamada', 'numero = a;\nmostrarDoble();\nnumero = b;\nmostrarDoble();'),
  globales(4, 'sin asignar', 'mostrarDoble();\nmostrarDoble();', ['MUESTRA_DISTINTA']),
  globales(4, 'sin llamar a la funcion', 'printf("%d %d", a * 2, b * 2);', ['FUNCION_EQUIVOCADA']),
  globales(4, 'con un argumento', 'mostrarDoble(a);', ['ARGUMENTOS_CANTIDAD']),
  // ---- 5: un resultado que sale por una global ----
  globales(5, 'cociente y resto', FUNCION('void dividir(void)', '  cociente = dividendo / divisor;\n  resto = dividendo % divisor;')),
  globales(5, 'al reves', FUNCION('void dividir(void)', '  cociente = dividendo % divisor;\n  resto = dividendo / divisor;'), ['MUESTRA_DISTINTA']),
  globales(5, 'solo el cociente', FUNCION('void dividir(void)', '  cociente = dividendo / divisor;'), ['MUESTRA_DISTINTA']),
  globales(5, 'con variables locales', FUNCION('void dividir(void)', '  int cociente = dividendo / divisor;\n  int resto = dividendo % divisor;'), [
    'MUESTRA_DISTINTA',
  ]),
  globales(5, 'devuelve en vez de dejar en las globales', FUNCION('int dividir(void)', '  return dividendo / divisor;'), ['DEVUELVE_EN_VEZ_DE_MOSTRAR']),
  // ---- 6: los datos de un alumno en una global ----
  globales(
    6,
    'lee los tres datos',
    FUNCION('void cargarAlumno(void)', '  scanf("%d", &alumno.legajo);\n  scanf("%d", &alumno.edad);\n  scanf("%f", &alumno.promedio);')
  ),
  globales(
    6,
    'en otro orden',
    FUNCION('void cargarAlumno(void)', '  scanf("%d", &alumno.edad);\n  scanf("%d", &alumno.legajo);\n  scanf("%f", &alumno.promedio);'),
    ['RESULTADO_VALOR_DISTINTO']
  ),
  globales(
    6,
    'sin el promedio',
    FUNCION('void cargarAlumno(void)', '  scanf("%d", &alumno.legajo);\n  scanf("%d", &alumno.edad);'),
    ['RESULTADO_VARIABLE_SIN_VALOR']
  ),
  globales(
    6,
    'con una variable local',
    FUNCION('void cargarAlumno(void)', '  TAlumno a;\n\n  scanf("%d", &a.legajo);\n  scanf("%d", &a.edad);\n  scanf("%f", &a.promedio);'),
    ['RESULTADO_VARIABLE_SIN_VALOR']
  ),
  // ---- 7: una local que tapa a una global ----
  globales(7, 'tapa: la correcta', '1'),
  globales(7, 'tapa: la global', '0', ['OPCION_USA_LA_GLOBAL']),
  globales(7, 'tapa: se modifico', '2', ['OPCION_SE_MODIFICO']),
  // ---- 8: quien cambio la variable ----
  globales(8, 'tres funciones: la correcta', '2'),
  globales(8, 'tres funciones: cargar', '0', ['OPCION_FUNCION_CARGAR']),
  globales(8, 'tres funciones: descontar', '1', ['OPCION_FUNCION_DESCONTAR']),
];
