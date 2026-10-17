// Casos de las series de ambito de las variables.
// Mismo formato que casos.js.

const serie = (id) => (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: id,
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

const locales = serie('ambito-locales');
const bloques = serie('ambito-bloques');
const globales = serie('ambito-globales');

const FUNCION = (encabezado, cuerpo) => `${encabezado} {\n${cuerpo}\n}`;

export const CASOS_DE_AMBITO = [
  // ===== Variables locales =====
  // ---- 1: una variable de otra funcion ----
  locales(1, 'otra funcion: la correcta', '1'),
  locales(1, 'otra funcion: se ve', '0', ['OPCION_VARIABLE_VISIBLE']),
  locales(1, 'otra funcion: vale cero', '2', ['OPCION_VALOR_POR_DEFECTO']),
  // ---- 2: el mismo nombre en dos funciones ----
  locales(2, 'mismo nombre: la correcta', '1'),
  locales(2, 'mismo nombre: se modifico', '0', ['OPCION_SE_MODIFICO']),
  locales(2, 'mismo nombre: la de afuera', '2', ['OPCION_USA_LA_DE_AFUERA']),
  // ---- 3: una local no recuerda ----
  locales(3, 'no recuerda: la correcta', '1'),
  locales(3, 'no recuerda: recuerda', '0', ['OPCION_RECUERDA']),
  locales(3, 'no recuerda: ceros', '2', ['OPCION_NO_SUMA']),
  // ---- 4: pasar por parametro ----
  locales(4, 'dos parametros', FUNCION('void mostrarPromedio(int suma, int cantidad)', '  printf("%.1f", (float) suma / cantidad);'), 'ok'),
  locales(4, 'otros nombres', FUNCION('void promedio(int a, int b)', '  printf("%.1f", (float) a / b);')),
  locales(4, 'con un cast del otro lado', FUNCION('void promedio(int a, int b)', '  printf("%.1f", a / (float) b);')),
  locales(4, 'sin parametros', FUNCION('void mostrarPromedio(void)', '  printf("%.1f", (float) suma / cantidad);'), ['PARAMETROS_CANTIDAD'], {
    dice: ['reciba 2 parámetros'],
  }),
  locales(4, 'un solo parametro', FUNCION('void mostrarPromedio(int suma)', '  printf("%.1f", (float) suma / cantidad);'), ['PARAMETROS_CANTIDAD']),
  locales(4, 'division entera', FUNCION('void promedio(int a, int b)', '  printf("%.1f", a / b);'), ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  locales(4, 'devuelve en vez de mostrar', FUNCION('float promedio(int a, int b)', '  return (float) a / b;'), ['DEVUELVE_EN_VEZ_DE_MOSTRAR']),
  // ---- 5: como sale un valor ----
  locales(5, 'como sale un valor: la correcta', '1'),
  locales(5, 'como sale un valor: otra variable', '0', ['OPCION_OTRA_VARIABLE']),
  locales(5, 'como sale un valor: global', '2', ['OPCION_GLOBAL']),
  // ---- 6: usar lo que devuelve ----
  locales(6, 'directo en el printf', 'printf("%d", calcular());'),
  locales(6, 'con una variable', 'int t = calcular();\nprintf("%d", t);'),
  locales(6, 'la variable de la otra funcion', 'calcular();\nprintf("%d", total);', ['NOMBRE_FUERA_DE_ALCANCE'], {
    dice: ['está declarada dentro de `calcular`', 'las demás no la ven'],
  }),
  locales(6, 'solo la variable de la otra funcion', 'printf("%d", total);', ['NOMBRE_FUERA_DE_ALCANCE']),
  locales(6, 'un nombre que no existe en ninguna', 'printf("%d", resultado);', ['NOMBRE_NO_DECLARADO']),

  // ===== Ambito de bloque =====
  // ---- 1: dentro de un if ----
  bloques(1, 'if: la correcta', '1'),
  bloques(1, 'if: se ve', '0', ['OPCION_VARIABLE_VISIBLE']),
  bloques(1, 'if: vale cero', '2', ['OPCION_VALOR_POR_DEFECTO']),
  // ---- 2: la variable del for ----
  bloques(2, 'for: la correcta', '1'),
  bloques(2, 'for: se ve', '0', ['OPCION_VARIABLE_VISIBLE']),
  bloques(2, 'for: vale cero', '2', ['OPCION_VALOR_POR_DEFECTO']),
  // ---- 3: una variable que tapa a otra ----
  bloques(3, 'tapa: la correcta', '1'),
  bloques(3, 'tapa: se modifico', '0', ['OPCION_SE_MODIFICO']),
  bloques(3, 'tapa: un error', '2', ['OPCION_ES_UN_ERROR']),
  // ---- 4: declarar donde se la necesita ----
  bloques(4, 'afuera del ciclo', 'int suma = 0;\n\nfor (int i = 1; i <= 5; i++) {\n  suma = suma + i;\n}\nprintf("%d", suma);'),
  bloques(4, 'con el contador afuera', 'int suma = 0;\nint i;\n\nfor (i = 1; i <= 5; i++) {\n  suma = suma + i;\n}\nprintf("%d", suma);'),
  bloques(4, 'con while', 'int suma = 0;\nint i = 1;\n\nwhile (i <= 5) {\n  suma = suma + i;\n  i++;\n}\nprintf("%d", suma);'),
  bloques(4, 'declarada dentro del ciclo', 'for (int i = 1; i <= 5; i++) {\n  int suma = 0;\n  suma = suma + i;\n}\nprintf("%d", suma);', [
    'NOMBRE_FUERA_DE_ALCANCE',
  ], { dice: ['se declaró entre llaves', 'declararla antes del bloque'] }),
  bloques(4, 'el i de afuera', 'int suma = 0;\nfor (int i = 1; i <= 5; i++) {\n  suma = suma + i;\n}\nprintf("%d", suma + i);', [
    'NOMBRE_FUERA_DE_ALCANCE',
  ]),
  bloques(4, 'sin declararla', 'for (int i = 1; i <= 5; i++) {\n  suma = suma + i;\n}\nprintf("%d", suma);', ['NOMBRE_NO_DECLARADO']),
  bloques(4, 'declarada despues del ciclo', 'for (int i = 1; i <= 5; i++) {\n  suma = suma + i;\n}\nint suma = 0;\nprintf("%d", suma);', [
    'NOMBRE_USADO_ANTES',
  ], { dice: ['se usa antes de declararla'] }),
  bloques(4, 'muestra en cada vuelta', 'int suma = 0;\nfor (int i = 1; i <= 5; i++) {\n  suma = suma + i;\n  printf("%d", suma);\n}', ['MUESTRA_DISTINTA']),

  // ===== Variables globales =====
  // ---- 1: una variable que ven todas ----
  globales(1, 'se ve: la correcta', '1'),
  globales(1, 'se ve: como local', '0', ['OPCION_COMO_LOCAL']),
  globales(1, 'se ve: un error', '2', ['OPCION_ES_UN_ERROR']),
  // ---- 2: una local que tapa ----
  globales(2, 'tapa: la correcta', '1'),
  globales(2, 'tapa: la global', '0', ['OPCION_USA_LA_GLOBAL']),
  globales(2, 'tapa: se modifico', '2', ['OPCION_SE_MODIFICO']),
  // ---- 3: por que se desaconsejan ----
  globales(3, 'por que: la correcta', '1'),
  globales(3, 'por que: memoria', '0', ['OPCION_MEMORIA']),
  globales(3, 'por que: no se pueden usar', '2', ['OPCION_ES_UN_ERROR']),
  // ---- 4: reescribir con return ----
  globales(4, 'devuelve el total nuevo', FUNCION('int acumular(int total, int n)', '  return total + n;')),
  globales(4, 'con una variable', FUNCION('int acumular(int total, int n)', '  int nuevo = total + n;\n\n  return nuevo;')),
  globales(4, 'con otros nombres', FUNCION('int sumar(int a, int b)', '  return a + b;')),
  globales(4, 'con una global', 'int total = 0;\n' + FUNCION('int acumular(int n)', '  total = total + n;\n  return total;'), [
    'GLOBAL_DE_MAS',
    'PARAMETROS_CANTIDAD',
  ], { dice: ['es una variable global'] }),
  globales(4, 'una global con dos parametros', 'int total;\n' + FUNCION('int acumular(int a, int n)', '  total = a + n;\n  return total;'), [
    'GLOBAL_DE_MAS',
  ]),
  globales(4, 'sin return', FUNCION('int acumular(int total, int n)', '  total = total + n;'), ['RETORNO_FALTA']),
  globales(4, 'usa un total que no existe', FUNCION('int acumular(int a, int n)', '  return total + n;'), ['NOMBRE_NO_DECLARADO']),
  // ---- 5: reescribir por referencia ----
  globales(5, 'modifica por referencia', FUNCION('void acumular(int *total, int n)', '  *total = *total + n;')),
  globales(5, 'con otros nombres', FUNCION('void sumar(int *t, int x)', '  *t = *t + x;')),
  globales(5, 'sin asterisco en la declaracion', FUNCION('void acumular(int total, int n)', '  total = total + n;'), [
    'PARAMETRO_REFERENCIA_FALTA',
  ]),
  globales(5, 'sin asterisco al usarlo', FUNCION('void acumular(int *total, int n)', '  total = total + n;'), [
    'PARAMETRO_SIN_ASTERISCO_AL_USARLO',
  ]),
  globales(5, 'con una global', 'int total = 0;\n' + FUNCION('void acumular(int n)', '  total = total + n;'), [
    'GLOBAL_DE_MAS',
    'PARAMETROS_CANTIDAD',
  ]),
  globales(5, 'suma de menos', FUNCION('void acumular(int *total, int n)', '  *total = *total + 1;'), ['RESULTADO_VALOR_DISTINTO']),
];
