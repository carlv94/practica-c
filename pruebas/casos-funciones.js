// Casos de las series de funciones.
// Mismo formato que casos.js.

const serie = (id) => (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: id,
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

const definir = serie('funciones-definir');
const parametros = serie('funciones-parametros');
const devolver = serie('funciones-devolver');
const referencia = serie('funciones-referencia');

const FUNCION = (encabezado, cuerpo) => `${encabezado} {\n${cuerpo}\n}`;

export const CASOS_DE_FUNCIONES = [
  // ===== Definir y llamar =====
  // ---- 1: una funcion que no recibe ni devuelve nada ----
  definir(1, 'void con el mensaje', FUNCION('void saludar(void)', '  printf("Bienvenido");'), 'ok', { mejoras: [] }),
  definir(1, 'sin la palabra void en los parentesis', FUNCION('void saludar()', '  printf("Bienvenido");')),
  definir(1, 'otro nombre', FUNCION('void mensaje(void)', '  printf("Bienvenido");')),
  definir(1, 'devuelve un int', FUNCION('int saludar(void)', '  printf("Bienvenido");\n  return 0;'), ['FUNCION_TIPO_RETORNO'], {
    dice: ['es `void`'],
  }),
  definir(1, 'recibe un parametro', FUNCION('void saludar(int x)', '  printf("Bienvenido");'), ['PARAMETROS_CANTIDAD'], {
    dice: ['no reciba ningún parámetro'],
  }),
  definir(1, 'otro mensaje', FUNCION('void saludar(void)', '  printf("Hola");'), ['MUESTRA_DISTINTA']),
  definir(1, 'no muestra nada', FUNCION('void saludar(void)', '  int x = 1;'), ['MUESTRA_FALTA']),
  definir(1, 'solo la llamada', 'saludar();', ['FUNCION_FALTA']),
  // ---- 2: llamarla ----
  definir(2, 'la llamada', 'saludar();', 'ok', { mejoras: [] }),
  definir(2, 'con un argumento de mas', 'saludar(5);', ['LLAMADA_ARGUMENTOS_CANTIDAD'], {
    dice: ['no recibe ningún argumento'],
  }),
  definir(2, 'otra funcion', 'hola();', ['FUNCION_EQUIVOCADA']),
  definir(2, 'con una mayuscula', 'Saludar();', ['FUNCION_MAL_ESCRITA']),
  definir(2, 'sin llamarla', 'printf("Bienvenido");', ['FUNCION_EQUIVOCADA']),
  // ---- 3: llamarla varias veces ----
  definir(3, 'tres llamadas', 'saludar();\nsaludar();\nsaludar();', 'ok', { mejoras: [] }),
  definir(3, 'en un ciclo', 'for (int i = 0; i < 3; i++) {\n  saludar();\n}'),
  definir(3, 'solo dos', 'saludar();\nsaludar();', ['MUESTRA_DISTINTA']),
  definir(3, 'una sola', 'saludar();', ['MUESTRA_DISTINTA']),
  // ---- 4: cuestionario, definir no es ejecutar ----
  definir(4, 'orden de las llamadas: la correcta', '1'),
  definir(4, 'orden de definicion', '0', ['OPCION_ORDEN_DE_DEFINICION']),
  definir(4, 'se ejecuta sola', '2', ['OPCION_SE_EJECUTA_SOLA']),
  // ---- 5: el prototipo ----
  definir(5, 'el prototipo', 'void saludar(void);', 'ok', { mejoras: [] }),
  definir(5, 'sin la palabra void', 'void saludar();'),
  definir(5, 'la funcion y no el prototipo', FUNCION('void saludar(void)', '  printf("Bienvenido");'), ['PROTOTIPO_FALTA']),
  definir(5, 'con un parametro', 'void saludar(int x);', ['PROTOTIPO_NO_COINCIDE']),
  definir(5, 'con otro tipo', 'int saludar(void);', ['PROTOTIPO_NO_COINCIDE']),
  definir(5, 'de otra funcion', 'void otra(void);', ['PROTOTIPO_NOMBRE']),

  // ===== Funciones con parametros =====
  // ---- 1: un parametro ----
  parametros(1, 'el doble', FUNCION('void mostrarDoble(int n)', '  printf("%d", n * 2);'), 'ok', { mejoras: [] }),
  parametros(1, 'con otro nombre', FUNCION('void doble(int x)', '  printf("%d", x + x);')),
  parametros(1, 'con una variable', FUNCION('void doble(int n)', '  int d = n * 2;\n\n  printf("%d", d);')),
  parametros(1, 'el triple', FUNCION('void doble(int n)', '  printf("%d", n * 3);'), ['MUESTRA_DISTINTA']),
  parametros(1, 'sin parametros', FUNCION('void doble(void)', '  printf("%d", 8);'), ['PARAMETROS_CANTIDAD']),
  parametros(1, 'devuelve en vez de mostrar', FUNCION('int doble(int n)', '  return n * 2;'), ['FUNCION_TIPO_RETORNO']),
  parametros(1, 'un parametro float', FUNCION('void doble(float n)', '  printf("%d", n * 2);'), ['PARAMETRO_TIPO']),
  // ---- 2: llamarla con un valor ----
  parametros(2, 'la llamada', 'mostrarDoble(21);', 'ok', { mejoras: [] }),
  parametros(2, 'sin argumento', 'mostrarDoble();', ['ARGUMENTOS_CANTIDAD']),
  parametros(2, 'otro valor', 'mostrarDoble(10);', ['ARGUMENTO_EQUIVOCADO']),
  parametros(2, 'dos argumentos', 'mostrarDoble(21, 2);', ['LLAMADA_ARGUMENTOS_CANTIDAD']),
  // ---- 3: dos parametros ----
  parametros(3, 'la resta', FUNCION('void mostrarResta(int a, int b)', '  printf("%d", a - b);'), 'ok', { mejoras: [] }),
  parametros(3, 'con otros nombres', FUNCION('void restar(int x, int y)', '  printf("%d", x - y);')),
  parametros(3, 'al reves', FUNCION('void mostrarResta(int a, int b)', '  printf("%d", b - a);'), ['MUESTRA_DISTINTA']),
  parametros(3, 'la suma', FUNCION('void mostrarResta(int a, int b)', '  printf("%d", a + b);'), ['MUESTRA_DISTINTA']),
  parametros(3, 'un solo parametro', FUNCION('void mostrarResta(int a)', '  printf("%d", a);'), ['PARAMETROS_CANTIDAD']),
  // ---- 4: cuestionario, el nombre del argumento ----
  parametros(4, 'nombres distintos: la correcta', '0'),
  parametros(4, 'nombres distintos: error', '1', ['OPCION_ES_UN_ERROR']),
  parametros(4, 'nombres distintos: cero', '2', ['OPCION_NO_SE_COPIA']),
  // ---- 5: cuestionario, la variable de afuera ----
  parametros(5, 'la variable no cambia: la correcta', '1'),
  parametros(5, 'la variable no cambia: el doble', '0', ['OPCION_SE_MODIFICO']),
  parametros(5, 'la variable no cambia: un error', '2', ['OPCION_ES_UN_ERROR']),

  // ===== Funciones que devuelven un valor =====
  // ---- 1: la suma ----
  devolver(1, 'la suma', FUNCION('int sumar(int a, int b)', '  return a + b;'), 'ok', { mejoras: [] }),
  devolver(1, 'con otros nombres', FUNCION('int total(int x, int y)', '  return x + y;')),
  devolver(1, 'con una variable', FUNCION('int sumar(int a, int b)', '  int resultado;\n\n  resultado = a + b;\n  return resultado;')),
  devolver(1, 'multiplica', FUNCION('int sumar(int a, int b)', '  return a * b;'), ['DEVUELVE_DISTINTO'], {
    dice: ['`sumar(3, 4)` devuelve `12` y debería devolver `7`'],
  }),
  devolver(1, 'sin return', FUNCION('int sumar(int a, int b)', '  int c = a + b;'), ['RETORNO_FALTA']),
  devolver(1, 'muestra en vez de devolver', FUNCION('void sumar(int a, int b)', '  printf("%d", a + b);'), [
    'MUESTRA_EN_VEZ_DE_DEVOLVER',
  ], { dice: ['la consigna pide que lo devuelva'] }),
  devolver(1, 'void sin mostrar', FUNCION('void sumar(int a, int b)', '  int c = a + b;'), ['FUNCION_TIPO_RETORNO']),
  devolver(1, 'un parametro', FUNCION('int sumar(int a)', '  return a;'), ['PARAMETROS_CANTIDAD']),
  devolver(1, 'devuelve un float', FUNCION('float sumar(int a, int b)', '  return a + b;'), ['FUNCION_TIPO_RETORNO']),
  devolver(1, 'un parametro float', FUNCION('int sumar(float a, int b)', '  return a + b;'), ['PARAMETRO_TIPO']),
  devolver(1, 'parametros con asterisco', FUNCION('int sumar(int *a, int *b)', '  return *a + *b;'), [
    'PARAMETRO_ASTERISCO_DE_MAS',
  ]),
  // ---- 2: el promedio ----
  devolver(2, 'el promedio', FUNCION('float promedio(int a, int b)', '  return (a + b) / 2.0;'), 'ok', { mejoras: [] }),
  devolver(2, 'con una variable real', FUNCION('float promedio(int a, int b)', '  float p = (a + b) / 2.0;\n\n  return p;')),
  devolver(2, 'con un cast', FUNCION('float promedio(int a, int b)', '  return (float)(a + b) / 2;')),
  devolver(2, 'con division entera', FUNCION('float promedio(int a, int b)', '  return (a + b) / 2;'), ['DEVUELVE_DISTINTO']),
  devolver(2, 'devuelve un int', FUNCION('int promedio(int a, int b)', '  return (a + b) / 2;'), ['FUNCION_TIPO_RETORNO']),
  devolver(2, 'muestra en vez de devolver', FUNCION('void promedio(int a, int b)', '  printf("%f", (a + b) / 2.0);'), [
    'MUESTRA_EN_VEZ_DE_DEVOLVER',
  ]),
  // ---- 3: una funcion que decide ----
  devolver(3, 'par con if', FUNCION('int esPar(int n)', '  if (n % 2 == 0) {\n    return 1;\n  }\n  return 0;'), 'ok', { mejoras: [] }),
  devolver(3, 'par con return directo', FUNCION('int esPar(int n)', '  return n % 2 == 0;')),
  devolver(3, 'par con if y else', FUNCION('int esPar(int n)', '  if (n % 2 == 0) {\n    return 1;\n  } else {\n    return 0;\n  }')),
  devolver(3, 'al reves', FUNCION('int esPar(int n)', '  return n % 2;'), ['DEVUELVE_DISTINTO']),
  devolver(3, 'muestra en vez de devolver', FUNCION('void esPar(int n)', '  if (n % 2 == 0) {\n    printf("1");\n  }'), [
    'MUESTRA_EN_VEZ_DE_DEVOLVER',
  ]),
  devolver(3, 'sin return en todos los caminos', FUNCION('int esPar(int n)', '  if (n % 2 == 0) {\n    return 1;\n  }'), ['FUNCION_SIN_RETORNO']),
  // ---- 4: usar lo que devuelve ----
  devolver(4, 'con if', 'if (esPar(8) == 1) {\n  printf("par");\n}', 'ok', { mejoras: [] }),
  devolver(4, 'con if sin comparar', 'if (esPar(8)) {\n  printf("par");\n}'),
  devolver(4, 'sin llamar a la funcion', 'printf("par");', ['FUNCION_EQUIVOCADA']),
  // ---- 5: cuestionario, el return termina la funcion ----
  devolver(5, 'el return termina: la correcta', '1'),
  devolver(5, 'el return termina: sigue', '0', ['OPCION_SIGUE_DESPUES_DEL_RETURN']),
  devolver(5, 'el return termina: orden', '2', ['OPCION_ORDEN_EQUIVOCADO']),

  // ===== Funciones que modifican las variables de afuera =====
  // ---- 1: cuestionario con & ----
  referencia(1, 'con &: la correcta', '0'),
  referencia(1, 'con &: no cambia', '1', ['OPCION_SE_MODIFICO']),
  referencia(1, 'con &: el nombre', '2', ['OPCION_ES_UN_ERROR']),
  // ---- 2: declarar el parametro con * ----
  referencia(2, 'sumar uno', FUNCION('void sumarUno(int *n)', '  *n = *n + 1;'), 'ok', { mejoras: [] }),
  referencia(2, 'con otro nombre', FUNCION('void subir(int *x)', '  *x = *x + 1;')),
  referencia(2, 'con ++', FUNCION('void subir(int *x)', '  (*x)++;')),
  referencia(2, 'sin asterisco en la declaracion', FUNCION('void sumarUno(int n)', '  n = n + 1;'), [
    'PARAMETRO_REFERENCIA_FALTA',
  ], { dice: ['`&` al llamarla', '`*` en la declaración'] }),
  referencia(2, 'sin asterisco al usarlo', FUNCION('void sumarUno(int *n)', '  n = n + 1;'), [
    'PARAMETRO_SIN_ASTERISCO_AL_USARLO',
  ], { dice: ['`*n` cada vez que se lo usa'] }),
  referencia(2, 'suma dos', FUNCION('void sumarUno(int *n)', '  *n = *n + 2;'), ['RESULTADO_VALOR_DISTINTO']),
  referencia(2, 'devuelve en vez de modificar', FUNCION('int sumarUno(int n)', '  return n + 1;'), ['FUNCION_TIPO_RETORNO']),
  // ---- 3: llamarla con & ----
  referencia(3, 'la llamada', 'sumarUno(&contador);', 'ok', { mejoras: [] }),
  referencia(3, 'sin el &', 'sumarUno(contador);', ['LLAMADA_SIN_AMPERSAND'], { dice: ['`&` al llamar'] }),
  referencia(3, 'otra variable', 'sumarUno(&otra);', ['VARIABLE_DESCONOCIDA']),
  // ---- 4: intercambiar ----
  referencia(
    4,
    'intercambia con aux',
    FUNCION('void cambiar(int *a, int *b)', '  int aux;\n\n  aux = *a;\n  *a = *b;\n  *b = aux;'),
    'ok',
    { mejoras: [] }
  ),
  referencia(4, 'sin asteriscos en la declaracion', FUNCION('void cambiar(int a, int b)', '  int aux;\n\n  aux = a;\n  a = b;\n  b = aux;'), [
    'PARAMETRO_REFERENCIA_FALTA',
  ], { dice: ['`&` al llamarla', '`*` en la declaración'] }),
  referencia(4, 'sin asterisco al usarlos', FUNCION('void cambiar(int *a, int *b)', '  int aux;\n\n  aux = a;\n  a = b;\n  b = aux;'), [
    'PARAMETRO_SIN_ASTERISCO_AL_USARLO',
  ], { dice: ['`*a` cada vez que se lo usa'] }),
  referencia(4, 'sin aux', FUNCION('void cambiar(int *a, int *b)', '  *a = *b;\n  *b = *a;'), ['RESULTADO_VALOR_DISTINTO']),
  referencia(4, 'uno por valor', FUNCION('void cambiar(int *a, int b)', '  int aux;\n\n  aux = *a;\n  *a = b;'), [
    'PARAMETRO_REFERENCIA_FALTA',
  ]),
  referencia(4, 'devuelve algo', FUNCION('void cambiar(int *a, int *b)', '  int aux;\n\n  aux = *a;\n  *a = *b;\n  *b = aux;\n  return aux;'), [
    'RETORNO_EN_VOID',
  ]),
  // ---- 5: dos resultados ----
  referencia(
    5,
    'cociente y resto',
    FUNCION('void dividir(int dividendo, int divisor, int *cociente, int *resto)', '  *cociente = dividendo / divisor;\n  *resto = dividendo % divisor;'),
    'ok',
    { mejoras: [] }
  ),
  referencia(
    5,
    'con otros nombres',
    FUNCION('void dividir(int a, int b, int *c, int *r)', '  *c = a / b;\n  *r = a % b;')
  ),
  referencia(
    5,
    'resto por valor',
    FUNCION('void dividir(int a, int b, int *c, int r)', '  *c = a / b;\n  r = a % b;'),
    ['PARAMETRO_REFERENCIA_FALTA']
  ),
  referencia(
    5,
    'cociente y resto al reves',
    FUNCION('void dividir(int a, int b, int *c, int *r)', '  *c = a % b;\n  *r = a / b;'),
    ['RESULTADO_VALOR_DISTINTO']
  ),
  referencia(
    5,
    'devuelve el cociente',
    FUNCION('int dividir(int a, int b, int *r)', '  *r = a % b;\n  return a / b;'),
    ['FUNCION_TIPO_RETORNO']
  ),
];
