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
const compuestos = serie('funciones-parametros-compuestos');
const devolver = serie('funciones-devolver');
const referencia = serie('funciones-referencia');

const FUNCION = (encabezado, cuerpo) => `${encabezado} {\n${cuerpo}\n}`;

export const CASOS_DE_FUNCIONES = [
  // ===== Definir y llamar =====
  // ---- 1: una funcion que no recibe ni devuelve nada ----
  definir(1, 'void con el mensaje', FUNCION('void saludar(void)', '  printf("Bienvenido");'), 'ok', { mejoras: [] }),
  definir(1, 'sin la palabra void en los parentesis', FUNCION('void saludar()', '  printf("Bienvenido");')),
  definir(1, 'con salto de linea', FUNCION('void saludar(void)', '  printf("Bienvenido\\n");')),
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
  definir(3, 'tres llamadas', 'reirse();\nreirse();\nreirse();', 'ok', { mejoras: [] }),
  definir(3, 'en un ciclo', 'for (int i = 0; i < 3; i++) {\n  reirse();\n}'),
  definir(3, 'solo dos', 'reirse();\nreirse();', ['MUESTRA_DISTINTA']),
  definir(3, 'una sola', 'reirse();', ['MUESTRA_DISTINTA']),
  // ---- 4: cuestionario, definir no es ejecutar ----
  definir(4, 'orden de las llamadas: la correcta', '1'),
  definir(4, 'orden de definicion', '0', ['OPCION_ORDEN_DE_DEFINICION']),
  definir(4, 'se ejecuta sola', '2', ['OPCION_SE_EJECUTA_SOLA']),
  // ---- 5: el prototipo ----
  definir(5, 'el prototipo', 'void muestraA(void);', 'ok', { mejoras: [] }),
  definir(5, 'sin la palabra void', 'void muestraA();'),
  definir(5, 'sin nada', 'int x;', ['LLAMADA_ANTES_DE_DEFINIR', 'PROTOTIPO_FALTA']),
  definir(5, 'la funcion y no el prototipo', FUNCION('void muestraA(void)', '  printf("A");'), ['PROTOTIPO_FALTA']),
  definir(5, 'con un parametro', 'void muestraA(int x);', ['PROTOTIPO_NO_COINCIDE']),
  definir(5, 'con otro tipo', 'int muestraA(void);', ['PROTOTIPO_NO_COINCIDE']),
  definir(5, 'de otra funcion', 'void otra(void);', ['LLAMADA_ANTES_DE_DEFINIR', 'PROTOTIPO_NOMBRE']),

  // ===== Parametros por valor =====
  // ---- 1: asignar a una global o pasar un parametro ----
  parametros(1, 'la analogia: la correcta', '1'),
  parametros(1, 'la analogia: se modificaron', '0', ['OPCION_SE_MODIFICARON']),
  parametros(1, 'la analogia: solo la global', '2', ['OPCION_SOLO_LA_GLOBAL']),
  // ---- 2: reemplazar la global por un parametro ----
  parametros(2, 'con parametro', FUNCION('void mostrarDoble(int n)', '  printf("%d", n * 2);'), 'ok', { mejoras: [] }),
  parametros(2, 'con otro nombre de parametro', FUNCION('void mostrarDoble(int numero)', '  printf("%d", numero * 2);')),
  parametros(2, 'con una variable', FUNCION('void mostrarDoble(int n)', '  int d = n * 2;\n\n  printf("%d", d);')),
  parametros(2, 'sigue con la global', 'int numero;\n' + FUNCION('void mostrarDoble(void)', '  printf("%d", numero * 2);'), [
    'GLOBAL_DE_MAS',
    'PARAMETROS_CANTIDAD',
  ]),
  parametros(2, 'sin parametros', FUNCION('void mostrarDoble(void)', '  printf("%d", numero * 2);'), ['PARAMETROS_CANTIDAD'], {
    dice: ['reciba un parámetro'],
  }),
  parametros(2, 'el triple', FUNCION('void mostrarDoble(int n)', '  printf("%d", n * 3);'), ['MUESTRA_DISTINTA']),
  parametros(2, 'devuelve en vez de mostrar', FUNCION('int mostrarDoble(int n)', '  return n * 2;'), ['DEVUELVE_EN_VEZ_DE_MOSTRAR'], {
    dice: ['muestre el resultado con `printf`, no que lo devuelva'],
  }),
  parametros(2, 'otro nombre de funcion', FUNCION('void doble(int n)', '  printf("%d", n * 2);'), ['FUNCION_NOMBRE']),
  parametros(2, 'un parametro real', FUNCION('void mostrarDoble(float n)', '  printf("%d", n * 2);'), ['PARAMETRO_TIPO']),
  // ---- 3: reemplazar la asignacion por el argumento ----
  parametros(3, 'llamadas con a y con b', 'mostrarDoble(a);\nmostrarDoble(b);', 'ok', { mejoras: [] }),
  parametros(3, 'al reves', 'mostrarDoble(b);\nmostrarDoble(a);', ['MUESTRA_DISTINTA']),
  parametros(3, 'una sola llamada', 'mostrarDoble(a);', ['MUESTRA_DISTINTA']),
  parametros(3, 'sin argumento', 'mostrarDoble();\nmostrarDoble();', ['ARGUMENTOS_CANTIDAD']),
  parametros(3, 'sin la funcion', 'printf("%d %d", a * 2, b * 2);', ['FUNCION_EQUIVOCADA']),
  // ---- 4: pasar por parametro lo que la funcion necesita ----
  parametros(4, 'dos parametros', FUNCION('void mostrarPromedio(int suma, int cantidad)', '  printf("%.1f", (float) suma / cantidad);'), 'ok'),
  parametros(4, 'otros nombres', FUNCION('void promedio(int a, int b)', '  printf("%.1f", (float) a / b);')),
  parametros(4, 'con un cast del otro lado', FUNCION('void promedio(int a, int b)', '  printf("%.1f", a / (float) b);')),
  parametros(4, 'sin parametros', FUNCION('void mostrarPromedio(void)', '  printf("%.1f", (float) suma / cantidad);'), ['PARAMETROS_CANTIDAD'], {
    dice: ['reciba 2 parámetros'],
  }),
  parametros(4, 'un solo parametro', FUNCION('void mostrarPromedio(int suma)', '  printf("%.1f", (float) suma / cantidad);'), ['PARAMETROS_CANTIDAD']),
  parametros(4, 'division entera', FUNCION('void promedio(int a, int b)', '  printf("%.1f", a / b);'), ['FORMATO_NO_CORRESPONDE_AL_TIPO']),
  parametros(4, 'devuelve en vez de mostrar', FUNCION('float promedio(int a, int b)', '  return (float) a / b;'), ['DEVUELVE_EN_VEZ_DE_MOSTRAR']),
  // ---- 5: llamarla con un valor ----
  parametros(5, 'la llamada', 'mostrarDoble(21);', 'ok', { mejoras: [] }),
  parametros(5, 'sin argumento', 'mostrarDoble();', ['ARGUMENTOS_CANTIDAD']),
  parametros(5, 'otro valor', 'mostrarDoble(10);', ['ARGUMENTO_EQUIVOCADO']),
  parametros(5, 'dos argumentos', 'mostrarDoble(21, 2);', ['ARGUMENTOS_CANTIDAD']),
  // ---- 6: una expresion como argumento ----
  parametros(6, 'a mas uno', 'mostrarDoble(a + 1);', 'ok', { mejoras: [] }),
  parametros(6, 'sin espacios', 'mostrarDoble(a+1);'),
  parametros(6, 'solo a', 'mostrarDoble(a);', ['ARGUMENTO_EQUIVOCADO']),
  parametros(6, 'calculado antes', 'int b = a + 1;\nmostrarDoble(b);', ['ARGUMENTO_EQUIVOCADO']),
  // ---- 7: el orden de los parametros importa ----
  parametros(7, 'la resta', FUNCION('void mostrarResta(int a, int b)', '  printf("%d", a - b);'), 'ok', { mejoras: [] }),
  parametros(7, 'con otros nombres', FUNCION('void restar(int x, int y)', '  printf("%d", x - y);')),
  parametros(7, 'al reves', FUNCION('void mostrarResta(int a, int b)', '  printf("%d", b - a);'), ['MUESTRA_DISTINTA']),
  parametros(7, 'la suma', FUNCION('void mostrarResta(int a, int b)', '  printf("%d", a + b);'), ['MUESTRA_DISTINTA']),
  parametros(7, 'un solo parametro', FUNCION('void mostrarResta(int a)', '  printf("%d", a);'), ['PARAMETROS_CANTIDAD']),
  // ---- 8: parametros de distinto tipo ----
  parametros(8, 'la moneda y el monto', FUNCION('void mostrarPrecio(char moneda, float monto)', '  printf("%c%.2f", moneda, monto);'), 'ok', { mejoras: [] }),
  parametros(8, 'en otro orden', FUNCION('void mostrarPrecio(float monto, char moneda)', '  printf("%c%.2f", moneda, monto);'), ['PARAMETRO_TIPO']),
  parametros(8, 'con un decimal', FUNCION('void mostrarPrecio(char moneda, float monto)', '  printf("%c%.1f", moneda, monto);'), ['MUESTRA_DISTINTA']),
  parametros(8, 'el monto entero', FUNCION('void mostrarPrecio(char moneda, int monto)', '  printf("%c%d", moneda, monto);'), ['PARAMETRO_TIPO']),
  // ---- 9: cuestionario, el nombre del argumento ----
  parametros(9, 'nombres distintos: la correcta', '0'),
  parametros(9, 'nombres distintos: error', '1', ['OPCION_ES_UN_ERROR']),
  parametros(9, 'nombres distintos: cero', '2', ['OPCION_NO_SE_COPIA']),

  // ===== Parametros: estructuras, arreglos, cadenas y tablas =====
  // ---- 1: una estructura se copia ----
  compuestos(1, 'copia: la correcta', '1'),
  compuestos(1, 'copia: se modifico', '0', ['OPCION_SE_MODIFICO']),
  compuestos(1, 'copia: un error', '2', ['OPCION_ES_UN_ERROR']),
  // ---- 2: recibir una estructura ----
  compuestos(2, 'fecha', FUNCION('void mostrarFecha(TFecha f)', '  printf("%d/%d/%d", f.dia, f.mes, f.anio);'), 'ok', { mejoras: [] }),
  compuestos(2, 'con otro nombre de parametro', FUNCION('void mostrar(TFecha fecha)', '  printf("%d/%d/%d", fecha.dia, fecha.mes, fecha.anio);')),
  compuestos(2, 'con guiones', FUNCION('void mostrarFecha(TFecha f)', '  printf("%d-%d-%d", f.dia, f.mes, f.anio);'), ['MUESTRA_DISTINTA']),
  compuestos(2, 'un entero en vez de la estructura', FUNCION('void mostrarFecha(int f)', '  printf("%d", f);'), ['PARAMETRO_TIPO']),
  compuestos(2, 'con asterisco', FUNCION('void mostrarFecha(TFecha *f)', '  printf("%d", f->dia);'), ['PARAMETRO_ASTERISCO_DE_MAS']),
  // ---- 3: recibir un arreglo ----
  compuestos(3, 'con guiones', FUNCION('void mostrarGuiones(int v[], int n)', '  int i;\n\n  for (i = 0; i < n; i++) {\n    if (i > 0) {\n      printf("-");\n    }\n    printf("%d", v[i]);\n  }'), 'ok', { mejoras: [] }),
  compuestos(3, 'con el guion despues', FUNCION('void mostrarGuiones(int v[], int n)', '  int i;\n\n  for (i = 0; i < n; i++) {\n    printf("%d", v[i]);\n    if (i < n - 1) {\n      printf("-");\n    }\n  }')),
  compuestos(3, 'sin la cantidad', FUNCION('void mostrarGuiones(int v[])', '  printf("%d", v[0]);'), ['PARAMETROS_CANTIDAD']),
  compuestos(3, 'con espacios', FUNCION('void mostrarGuiones(int v[], int n)', '  int i;\n\n  for (i = 0; i < n; i++) {\n    printf("%d ", v[i]);\n  }'), ['MUESTRA_DISTINTA']),
  compuestos(3, 'un entero en vez del arreglo', FUNCION('void mostrarGuiones(int v, int n)', '  printf("%d", v);'), ['PARAMETRO_TIPO']),
  // ---- 4: mostrar solo algunos elementos ----
  compuestos(4, 'solo los pares', FUNCION('void mostrarPares(int v[], int n)', '  int i;\n\n  for (i = 0; i < n; i++) {\n    if (v[i] % 2 == 0) {\n      printf("%d ", v[i]);\n    }\n  }'), 'ok', { mejoras: [] }),
  compuestos(4, 'los impares', FUNCION('void mostrarPares(int v[], int n)', '  int i;\n\n  for (i = 0; i < n; i++) {\n    if (v[i] % 2 != 0) {\n      printf("%d ", v[i]);\n    }\n  }'), ['MUESTRA_DISTINTA']),
  compuestos(4, 'todos', FUNCION('void mostrarPares(int v[], int n)', '  int i;\n\n  for (i = 0; i < n; i++) {\n    printf("%d ", v[i]);\n  }'), ['MUESTRA_DISTINTA']),
  // ---- 5: cuestionario, el tamano de un arreglo recibido ----
  compuestos(5, 'tamano: la correcta', '1'),
  compuestos(5, 'tamano: el del arreglo', '0', ['OPCION_TAMANO_DEL_ARREGLO']),
  compuestos(5, 'tamano: la cantidad', '2', ['OPCION_CANTIDAD']),
  // ---- 6: recibir una cadena ----
  compuestos(6, 'con guiones', FUNCION('void mostrarConGuiones(char texto[])', "  int i;\n\n  for (i = 0; texto[i] != '\\0'; i++) {\n    if (i > 0) {\n      printf(\"-\");\n    }\n    printf(\"%c\", texto[i]);\n  }"), 'ok', { mejoras: [] }),
  compuestos(6, 'con un tamano escrito', FUNCION('void mostrarConGuiones(char texto[20])', "  int i;\n\n  for (i = 0; texto[i] != '\\0'; i++) {\n    if (i > 0) {\n      printf(\"-\");\n    }\n    printf(\"%c\", texto[i]);\n  }")),
  compuestos(6, 'sin guiones', FUNCION('void mostrarConGuiones(char texto[])', "  int i;\n\n  for (i = 0; texto[i] != '\\0'; i++) {\n    printf(\"%c\", texto[i]);\n  }"), ['MUESTRA_DISTINTA']),
  compuestos(6, 'un entero en vez de la cadena', FUNCION('void mostrarConGuiones(int texto)', '  printf("%d", texto);'), ['PARAMETRO_TIPO']),
  // ---- 7: recibir una tabla ----
  compuestos(7, 'una fila por renglon', FUNCION('void mostrarTabla(int t[][3], int filas)', '  int i;\n  int j;\n\n  for (i = 0; i < filas; i++) {\n    for (j = 0; j < 3; j++) {\n      printf("%d ", t[i][j]);\n    }\n    printf("\\n");\n  }'), 'ok', { mejoras: [] }),
  compuestos(7, 'todo en un renglon', FUNCION('void mostrarTabla(int t[][3], int filas)', '  int i;\n  int j;\n\n  for (i = 0; i < filas; i++) {\n    for (j = 0; j < 3; j++) {\n      printf("%d ", t[i][j]);\n    }\n  }'), ['MUESTRA_DISTINTA']),
  compuestos(7, 'un arreglo en vez de una tabla', FUNCION('void mostrarTabla(int t[], int filas)', '  printf("%d", t[0]);'), ['PARAMETRO_TIPO']),

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
  devolver(2, 'con division entera', FUNCION('float promedio(int a, int b)', '  return (a + b) / 2;'), ['DEVUELVE_DISTINTO'], {
    dice: ['Dividir dos enteros da un entero'],
  }),
  devolver(2, 'float como funcion', FUNCION('float promedio(int a, int b)', '  return float(a + b) / 2;'), ['CONVERSION_COMO_FUNCION'], {
    dice: ['(float) (a + b)'],
  }),
  devolver(2, 'devuelve un int',FUNCION('int promedio(int a, int b)', '  return (a + b) / 2;'), ['FUNCION_TIPO_RETORNO']),
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
  referencia(2, 'devuelve en vez de modificar', FUNCION('int sumarUno(int n)', '  return n + 1;'), ['DEVUELVE_EN_VEZ_DE_MOSTRAR'], {
    dice: ['no que lo devuelva con `return`'],
  }),
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
    ['DEVUELVE_EN_VEZ_DE_MOSTRAR']
  ),

  // ===== consignas que vinieron de las series de ambito =====
  // ---- devolver: como sale un valor ----
  devolver(6, 'como sale un valor: la correcta', '1'),
  devolver(6, 'como sale un valor: otra variable', '0', ['OPCION_OTRA_VARIABLE']),
  devolver(6, 'como sale un valor: global', '2', ['OPCION_GLOBAL']),
  // ---- devolver: usar lo que devuelve ----
  devolver(7, 'directo en el printf', 'printf("%d", calcular());'),
  devolver(7, 'con una variable', 'int t = calcular();\nprintf("%d", t);'),
  devolver(7, 'la variable de la otra funcion', 'calcular();\nprintf("%d", total);', ['NOMBRE_FUERA_DE_ALCANCE'], {
    dice: ['está declarada dentro de `calcular`', 'las demás no la ven'],
  }),
  devolver(7, 'solo la variable de la otra funcion', 'printf("%d", total);', ['NOMBRE_FUERA_DE_ALCANCE']),
  devolver(7, 'un nombre que no existe en ninguna', 'printf("%d", resultado);', ['NOMBRE_NO_DECLARADO']),
  // ---- devolver: reescribir sin global ----
  devolver(8, 'devuelve el total nuevo', FUNCION('int acumular(int total, int n)', '  return total + n;')),
  devolver(8, 'con una variable', FUNCION('int acumular(int total, int n)', '  int nuevo = total + n;\n\n  return nuevo;')),
  devolver(8, 'con otros nombres', FUNCION('int sumar(int a, int b)', '  return a + b;')),
  devolver(8, 'con una global', 'int total = 0;\n' + FUNCION('int acumular(int n)', '  total = total + n;\n  return total;'), [
    'GLOBAL_DE_MAS',
    'PARAMETROS_CANTIDAD',
  ], { dice: ['es una variable global'] }),
  devolver(8, 'una global con dos parametros', 'int total;\n' + FUNCION('int acumular(int a, int n)', '  total = a + n;\n  return total;'), [
    'GLOBAL_DE_MAS',
  ]),
  devolver(8, 'sin return', FUNCION('int acumular(int total, int n)', '  total = total + n;'), ['RETORNO_FALTA']),
  devolver(8, 'usa un total que no existe', FUNCION('int acumular(int a, int n)', '  return total + n;'), ['NOMBRE_NO_DECLARADO']),
  // ---- referencia: reescribir por referencia ----
  referencia(6, 'modifica por referencia', FUNCION('void acumular(int *total, int n)', '  *total = *total + n;')),
  referencia(6, 'con otros nombres', FUNCION('void sumar(int *t, int x)', '  *t = *t + x;')),
  referencia(6, 'sin asterisco en la declaracion', FUNCION('void acumular(int total, int n)', '  total = total + n;'), [
    'PARAMETRO_REFERENCIA_FALTA',
  ]),
  referencia(6, 'sin asterisco al usarlo', FUNCION('void acumular(int *total, int n)', '  total = total + n;'), [
    'PARAMETRO_SIN_ASTERISCO_AL_USARLO',
  ]),
  referencia(6, 'con una global', 'int total = 0;\n' + FUNCION('void acumular(int n)', '  total = total + n;'), [
    'GLOBAL_DE_MAS',
    'PARAMETROS_CANTIDAD',
  ]),
  referencia(6, 'suma de menos', FUNCION('void acumular(int *total, int n)', '  *total = *total + 1;'), ['RESULTADO_VALOR_DISTINTO']),
];
