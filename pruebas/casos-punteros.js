// Casos de las series de punteros.
// Mismo formato que casos.js.

const serie = (id) => (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: id,
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

const direcciones = serie('punteros-direcciones');
const variables = serie('punteros-variables');
const referencia = serie('punteros-referencia');
const acceso = serie('punteros-acceso');
const aritmetica = serie('punteros-aritmetica');
const arreglos = serie('punteros-arreglos');

const FUNCION = (encabezado, cuerpo) => `${encabezado} {\n${cuerpo}\n}`;

export const CASOS_DE_PUNTEROS = [
  // ===== Donde vive una variable =====
  direcciones(1, 'la direccion de b', '2'),
  direcciones(1, 'el valor de b', '0', ['OPCION_ES_EL_VALOR']),
  direcciones(1, 'la direccion de a', '1', ['OPCION_ES_LA_DE_OTRA']),
  direcciones(2, 'el valor', '1'),
  direcciones(2, 'la direccion', '0', ['OPCION_MUESTRA_LA_DIRECCION']),
  direcciones(2, 'cambia en cada ejecucion', '2', ['OPCION_CAMBIA_CADA_VEZ']),
  direcciones(3, 'la direccion de b', '1'),
  direcciones(3, 'el valor de b', '0', ['OPCION_ES_EL_VALOR']),
  direcciones(3, 'una copia', '2', ['OPCION_ES_UNA_COPIA']),
  direcciones(4, 'para saber donde guardar', '0'),
  direcciones(4, 'solo numeros', '1', ['OPCION_SOLO_NUMEROS']),
  direcciones(4, 'para mostrarlo', '2', ['OPCION_SE_MUESTRA']),
  direcciones(5, 'un int ocupa cuatro', '1'),
  direcciones(5, 'deja libres', '0', ['OPCION_DEJA_LIBRES']),
  direcciones(5, 'siempre multiplo de cuatro', '2', ['OPCION_SIEMPRE_CUATRO']),

  // ===== Variables puntero =====
  // ---- 1: que guarda un puntero ----
  variables(1, 'la direccion de x', '1'),
  variables(1, 'el valor de x', '0', ['OPCION_GUARDA_EL_VALOR']),
  variables(1, 'su propia direccion', '2', ['OPCION_GUARDA_SU_DIRECCION']),
  // ---- 2: declarar y apuntar ----
  variables(2, 'declarar y despues apuntar', 'int *p;\n\np = &n;', 'ok', { mejoras: [] }),
  variables(2, 'declarar y apuntar juntos', 'int *p = &n;', 'ok', { mejoras: [] }),
  variables(2, 'otro nombre', 'int *dir;\ndir = &n;'),
  variables(2, 'con el asterisco pegado al tipo', 'int* p;\np = &n;'),
  variables(2, 'sin apuntar', 'int *p;', ['PUNTERO_SIN_APUNTAR']),
  variables(2, 'sin el ampersand', 'int *p;\np = n;', ['PUNTERO_SIN_AMPERSAND'], { dice: ['La dirección de una variable se escribe con un `&`'] }),
  variables(2, 'un numero en lugar de la direccion', 'int *p;\np = 5;', ['PUNTERO_CON_UN_VALOR']),
  variables(2, 'apunta a otra variable', 'int m = 3;\nint *p;\np = &m;', ['PUNTERO_APUNTA_A_OTRO']),
  variables(2, 'sin el asterisco', 'int p;\np = &n;', ['PUNTERO_FALTA_ASTERISCO']),
  variables(2, 'un puntero a otro tipo', 'float *p;\np = &n;', ['PUNTERO_TIPO']),
  variables(2, 'no declara nada', 'n = 5;', ['PUNTERO_FALTA']),
  // ---- 3: que es *p ----
  variables(3, 'la variable a la que apunta', '1'),
  variables(3, 'la direccion', '0', ['OPCION_ES_LA_DIRECCION']),
  variables(3, 'una copia', '2', ['OPCION_ES_UNA_COPIA']),
  // ---- 4: leer a traves del puntero ----
  variables(4, 'con el asterisco', 'printf("%d", *p);', 'ok', { mejoras: [] }),
  variables(4, 'con un salto de linea', 'printf("%d\\n", *p);'),
  variables(4, 'nombrando a n', 'printf("%d", n);', ['CONTENIDO_FALTA']),
  variables(4, 'sin el asterisco', 'printf("%d", p);', ['PUNTERO_SIN_ASTERISCO'], { dice: ['guarda la dirección de una variable y no su valor'] }),
  variables(4, 'otro valor', 'printf("%d", *p + 1);', ['MUESTRA_DISTINTA']),
  // ---- 5: cambiar a traves del puntero ----
  variables(5, 'con el asterisco', '*p = 10;', 'ok', { mejoras: [] }),
  variables(5, 'nombrando a n', 'n = 10;', ['CONTENIDO_FALTA']),
  variables(5, 'sin el asterisco', 'p = 10;', ['PUNTERO_CON_UN_VALOR'], { dice: ['*p = 10;'] }),
  variables(5, 'otro valor', '*p = 11;', ['RESULTADO_VALOR_DISTINTO']),
  variables(5, 'con una cuenta', '*p = *p + 5;'),
  variables(5, 'apuntando a otra variable', 'int otra = 0;\np = &otra;\n*p = 10;', ['RESULTADO_VALOR_DISTINTO']),
  // ---- 6: seguir el puntero ----
  variables(6, 'seis', '1'),
  variables(6, 'cinco', '0', ['OPCION_NO_CAMBIA']),
  variables(6, 'la direccion', '2', ['OPCION_MUESTRA_LA_DIRECCION']),
  // ---- 7: que vale cada expresion ----
  variables(7, 'el contenido no es una direccion', '1'),
  variables(7, 'p vale mil', '0', ['OPCION_P_VALE_MIL']),
  variables(7, 'la direccion vale mil', '2', ['OPCION_DIRECCION_VALE_MIL']),
  // ---- 8: dos punteros ----
  variables(8, 'nueve', '1'),
  variables(8, 'uno', '0', ['OPCION_SOLO_CAMBIA_Q']),
  variables(8, 'la direccion', '2', ['OPCION_MUESTRA_LA_DIRECCION']),
  // ---- 9: los dos significados del * ----
  variables(9, 'declarar y llegar', '1'),
  variables(9, 'multiplicar', '0', ['OPCION_MULTIPLICAR']),
  variables(9, 'siempre puntero', '2', ['OPCION_SIEMPRE_PUNTERO']),
  // ---- 10: un puntero para cada tipo ----
  variables(10, 'tiene que ser del mismo tipo', '1'),
  variables(10, 'funciona', '0', ['OPCION_FUNCIONA']),
  variables(10, 'se trunca', '2', ['OPCION_SE_TRUNCA']),

  // ===== Parametros por referencia =====
  // ---- 1: intercambiar con parametros por valor ----
  referencia(1, 'no se intercambia', '1'),
  referencia(1, 'se intercambia', '0', ['OPCION_SE_INTERCAMBIAN']),
  referencia(1, 'en cero', '2', ['OPCION_SE_PONEN_EN_CERO']),
  // ---- 2: que recibe el parametro ----
  referencia(2, 'la direccion', '1'),
  referencia(2, 'el valor', '0', ['OPCION_GUARDA_EL_VALOR']),
  referencia(2, 'el nuevo valor', '2', ['OPCION_GUARDA_EL_NUEVO']),
  // ---- 3: declarar el parametro con * ----
  referencia(3, 'sumar uno', FUNCION('void sumarUno(int *n)', '  *n = *n + 1;'), 'ok', { mejoras: [] }),
  referencia(3, 'con otro nombre', FUNCION('void subir(int *x)', '  *x = *x + 1;')),
  referencia(3, 'con ++', FUNCION('void subir(int *x)', '  (*x)++;')),
  referencia(3, 'sin asterisco en la declaracion', FUNCION('void sumarUno(int n)', '  n = n + 1;'), [
    'PARAMETRO_REFERENCIA_FALTA',
  ], { dice: ['tiene que ser un puntero'] }),
  referencia(3, 'sin asterisco al usarlo', FUNCION('void sumarUno(int *n)', '  n = n + 1;'), [
    'PARAMETRO_SIN_ASTERISCO_AL_USARLO',
  ], { dice: ['`*n` cada vez que se usa'] }),
  referencia(3, 'suma dos', FUNCION('void sumarUno(int *n)', '  *n = *n + 2;'), ['RESULTADO_VALOR_DISTINTO']),
  referencia(3, 'devuelve en vez de modificar', FUNCION('int sumarUno(int n)', '  return n + 1;'), ['DEVUELVE_EN_VEZ_DE_MOSTRAR'], {
    dice: ['no que lo devuelva con `return`'],
  }),
  // ---- 4: llamarla con & ----
  referencia(4, 'la llamada', 'sumarUno(&contador);', 'ok', { mejoras: [] }),
  referencia(4, 'sin el &', 'sumarUno(contador);', ['LLAMADA_SIN_AMPERSAND'], { dice: ['hay que pasarle su dirección'] }),
  referencia(4, 'otra variable', 'sumarUno(&otra);', ['VARIABLE_DESCONOCIDA']),
  // ---- 5: un puntero en vez de & ----
  referencia(5, 'cambia', '1'),
  referencia(5, 'no cambia', '0', ['OPCION_NO_CAMBIA']),
  referencia(5, 'solo con ampersand', '2', ['OPCION_SOLO_CON_AMPERSAND']),
  // ---- 6: intercambiar ----
  referencia(
    6,
    'intercambia con aux',
    FUNCION('void cambiar(int *a, int *b)', '  int aux;\n\n  aux = *a;\n  *a = *b;\n  *b = aux;'),
    'ok',
    { mejoras: [] }
  ),
  referencia(6, 'sin asteriscos en la declaracion', FUNCION('void cambiar(int a, int b)', '  int aux;\n\n  aux = a;\n  a = b;\n  b = aux;'), [
    'PARAMETRO_REFERENCIA_FALTA',
  ], { dice: ['tiene que ser un puntero'] }),
  referencia(6, 'sin asterisco al usarlos', FUNCION('void cambiar(int *a, int *b)', '  int aux;\n\n  aux = a;\n  a = b;\n  b = aux;'), [
    'PARAMETRO_SIN_ASTERISCO_AL_USARLO',
  ], { dice: ['`*a` cada vez que se usa'] }),
  referencia(6, 'sin aux', FUNCION('void cambiar(int *a, int *b)', '  *a = *b;\n  *b = *a;'), ['RESULTADO_VALOR_DISTINTO']),
  referencia(6, 'uno por valor', FUNCION('void cambiar(int *a, int b)', '  int aux;\n\n  aux = *a;\n  *a = b;'), [
    'PARAMETRO_REFERENCIA_FALTA',
  ]),
  referencia(6, 'devuelve algo', FUNCION('void cambiar(int *a, int *b)', '  int aux;\n\n  aux = *a;\n  *a = *b;\n  *b = aux;\n  return aux;'), [
    'RETORNO_EN_VOID',
  ]),
  // ---- 7: dos resultados ----
  referencia(
    7,
    'cociente y resto',
    FUNCION('void dividir(int dividendo, int divisor, int *cociente, int *resto)', '  *cociente = dividendo / divisor;\n  *resto = dividendo % divisor;'),
    'ok',
    { mejoras: [] }
  ),
  referencia(
    7,
    'con otros nombres',
    FUNCION('void dividir(int a, int b, int *c, int *r)', '  *c = a / b;\n  *r = a % b;')
  ),
  referencia(
    7,
    'resto por valor',
    FUNCION('void dividir(int a, int b, int *c, int r)', '  *c = a / b;\n  r = a % b;'),
    ['PARAMETRO_REFERENCIA_FALTA']
  ),
  referencia(
    7,
    'cociente y resto al reves',
    FUNCION('void dividir(int a, int b, int *c, int *r)', '  *c = a % b;\n  *r = a / b;'),
    ['RESULTADO_VALOR_DISTINTO']
  ),
  referencia(
    7,
    'devuelve el cociente',
    FUNCION('int dividir(int a, int b, int *r)', '  *r = a % b;\n  return a / b;'),
    ['DEVUELVE_EN_VEZ_DE_MOSTRAR']
  ),

  // ---- 8: usar la funcion con las dos variables ----
  referencia(8, 'la llamada y el printf', 'dividir(17, 5, &cociente, &resto);\nprintf("%d %d", cociente, resto);', 'ok', { mejoras: [] }),
  referencia(8, 'sin el ampersand', 'dividir(17, 5, cociente, resto);\nprintf("%d %d", cociente, resto);', ['LLAMADA_SIN_AMPERSAND']),
  referencia(8, 'sin mostrar', 'dividir(17, 5, &cociente, &resto);', ['MUESTRA_FALTA']),
  referencia(8, 'el resto primero', 'dividir(17, 5, &cociente, &resto);\nprintf("%d %d", resto, cociente);', ['MUESTRA_DISTINTA']),
  referencia(8, 'los argumentos cambiados', 'dividir(17, 5, &resto, &cociente);\nprintf("%d %d", cociente, resto);', ['ARGUMENTOS_EN_OTRO_ORDEN']),
  // ---- 9: acumular sin la global ----
  referencia(9, 'modifica por referencia', FUNCION('void acumular(int *total, int n)', '  *total = *total + n;')),
  referencia(9, 'con otros nombres', FUNCION('void sumar(int *t, int x)', '  *t = *t + x;')),
  referencia(9, 'sin asterisco en la declaracion', FUNCION('void acumular(int total, int n)', '  total = total + n;'), [
    'PARAMETRO_REFERENCIA_FALTA',
  ]),
  referencia(9, 'sin asterisco al usarlo', FUNCION('void acumular(int *total, int n)', '  total = total + n;'), [
    'PARAMETRO_SIN_ASTERISCO_AL_USARLO',
  ]),
  referencia(9, 'con una global', 'int total = 0;\n' + FUNCION('void acumular(int n)', '  total = total + n;'), [
    'GLOBAL_DE_MAS',
    'PARAMETROS_CANTIDAD',
  ]),
  referencia(9, 'suma de menos', FUNCION('void acumular(int *total, int n)', '  *total = *total + 1;'), ['RESULTADO_VALOR_DISTINTO']),
  // ---- 10: leer un alumno ----
  referencia(
    10,
    'tres scanf',
    FUNCION('void leerAlumno(int *legajo, int *edad, float *promedio)', '  scanf("%d", legajo);\n  scanf("%d", edad);\n  scanf("%f", promedio);'),
    'ok',
    { mejoras: [] }
  ),
  referencia(
    10,
    'un solo scanf',
    FUNCION('void leerAlumno(int *legajo, int *edad, float *promedio)', '  scanf("%d %d %f", legajo, edad, promedio);')
  ),
  referencia(
    10,
    'con ampersand en el scanf',
    FUNCION('void leerAlumno(int *legajo, int *edad, float *promedio)', '  scanf("%d", &legajo);\n  scanf("%d", edad);\n  scanf("%f", promedio);'),
    ['PUNTERO_EN_SCANF'],
    { dice: ['sin `&` ni `*`'] }
  ),
  referencia(
    10,
    'con asterisco en el scanf',
    FUNCION('void leerAlumno(int *legajo, int *edad, float *promedio)', '  scanf("%d", *legajo);\n  scanf("%d", edad);\n  scanf("%f", promedio);'),
    ['PUNTERO_EN_SCANF']
  ),
  referencia(
    10,
    'el legajo por valor',
    FUNCION('void leerAlumno(int legajo, int *edad, float *promedio)', '  scanf("%d", &legajo);\n  scanf("%d", edad);\n  scanf("%f", promedio);'),
    ['PARAMETRO_REFERENCIA_FALTA']
  ),
  referencia(
    10,
    'promedio entero',
    FUNCION('void leerAlumno(int *legajo, int *edad, int *promedio)', '  scanf("%d", legajo);\n  scanf("%d", edad);\n  scanf("%d", promedio);'),
    ['PARAMETRO_TIPO']
  ),
  referencia(
    10,
    'en otro orden',
    FUNCION('void leerAlumno(int *legajo, int *edad, float *promedio)', '  scanf("%d", edad);\n  scanf("%d", legajo);\n  scanf("%f", promedio);'),
    ['RESULTADO_VALOR_DISTINTO']
  ),
  // ---- 11: tres formas de llamar ----
  referencia(11, 'siete', '2'),
  referencia(11, 'seis', '0', ['OPCION_FALTA_LA_DEVUELTA']),
  referencia(11, 'ocho', '1', ['OPCION_TODAS_CAMBIAN']),

  // ===== Dar el menor acceso =====
  // ---- 1: quien puede cambiar la variable ----
  acceso(1, 'solo sumar', '1'),
  acceso(1, 'las dos', '0', ['OPCION_LAS_DOS']),
  acceso(1, 'ninguna', '2', ['OPCION_NINGUNA']),
  // ---- 2: recibir un puntero no es cambiar el valor ----
  acceso(2, 'duplicar', '2'),
  acceso(2, 'mostrar', '0', ['OPCION_MUESTRA']),
  acceso(2, 'las dos', '1', ['OPCION_LAS_DOS']),
  // ---- 3: el costo de pedir de mas ----
  acceso(3, 'con una constante', '1'),
  acceso(3, 'con una variable', '0', ['OPCION_COMPILA_VARIABLE']),
  acceso(3, 'con una posicion', '2', ['OPCION_COMPILA_POSICION']),
  // ---- 4: recibir el numero por valor ----
  acceso(4, 'por valor', FUNCION('void mostrar(int n)', '  printf("%d", n);'), 'ok', { mejoras: [] }),
  acceso(4, 'con otro nombre del parametro', FUNCION('void mostrar(int numero)', '  printf("%d", numero);')),
  acceso(4, 'con puntero', FUNCION('void mostrar(int *n)', '  printf("%d", *n);'), ['PARAMETRO_ASTERISCO_DE_MAS'], {
    dice: ['cambie el valor de la variable de afuera'],
  }),
  acceso(4, 'otro nombre de funcion', FUNCION('void imprimir(int n)', '  printf("%d", n);'), ['FUNCION_NOMBRE']),
  acceso(4, 'muestra otra cosa', FUNCION('void mostrar(int n)', '  printf("%d", n + 1);'), ['MUESTRA_DISTINTA']),
  // ---- 5: llamarla con el valor ----
  acceso(5, 'con el valor', 'mostrar(a);\nmostrar(b);', 'ok', { mejoras: [] }),
  acceso(5, 'con el ampersand', 'mostrar(&a);\nmostrar(&b);', ['LLAMADA_CON_AMPERSAND']),
  acceso(5, 'solo una', 'mostrar(a);', ['MUESTRA_DISTINTA']),
  acceso(5, 'al reves', 'mostrar(b);\nmostrar(a);', ['MUESTRA_DISTINTA']),
  // ---- 6, 7 y 8: que conviene ----
  acceso(6, 'las globales no convienen', '1'),
  acceso(6, 'la estructura conviene', '0', ['OPCION_ESTRUCTURA_SIRVE']),
  acceso(6, 'la referencia conviene', '2', ['OPCION_REFERENCIA_SIRVE']),
  acceso(7, 'la estructura', '2'),
  acceso(7, 'las globales', '0', ['OPCION_GLOBALES']),
  acceso(7, 'tres referencias', '1', ['OPCION_TRES_REFERENCIAS']),
  acceso(8, 'return', '0'),
  acceso(8, 'una global', '1', ['OPCION_GLOBAL']),
  acceso(8, 'una referencia', '2', ['OPCION_REFERENCIA']),
  // ---- 9: elegir como recibir los numeros ----
  acceso(9, 'por valor', FUNCION('void sumar(int a, int b)', '  printf("%d", a + b);'), 'ok', { mejoras: [] }),
  acceso(9, 'las dos por referencia sin cambiarlas', FUNCION('void sumar(int *a, int *b)', '  printf("%d", *a + *b);'), 'ok', {
    mejoras: ['REFERENCIA_INNECESARIA'],
    dice: ['recibe por referencia a `a` y `b`'],
  }),
  acceso(9, 'una por referencia sin cambiarla', FUNCION('void sumar(int *a, int b)', '  printf("%d", *a + b);'), 'ok', {
    mejoras: ['REFERENCIA_INNECESARIA'],
  }),
  acceso(9, 'una por referencia que cambia', FUNCION('void sumar(int *a, int b)', '  *a = *a + b;\n  printf("%d", *a);'), 'ok', {
    mejoras: [],
  }),
  acceso(9, 'suma mal', FUNCION('void sumar(int a, int b)', '  printf("%d", a - b);'), ['MUESTRA_DISTINTA']),
  acceso(9, 'devuelve en vez de mostrar', FUNCION('int sumar(int a, int b)', '  return a + b;'), ['DEVUELVE_EN_VEZ_DE_MOSTRAR'], { dice: ['muestre el resultado con `printf`'] }),
  acceso(9, 'con un solo parametro', FUNCION('void sumar(int a)', '  printf("%d", a);'), ['PARAMETROS_CANTIDAD']),

  // ===== Arreglos y punteros =====
  // ---- 1: el nombre de un arreglo ----
  aritmetica(1, 'la direccion del primero', '1'),
  aritmetica(1, 'el valor', '0', ['OPCION_ES_EL_VALOR']),
  aritmetica(1, 'la del ultimo', '2', ['OPCION_EL_ULTIMO']),
  // ---- 2: un puntero a un arreglo ----
  aritmetica(2, 'v[0]', '1'),
  aritmetica(2, 'el arreglo entero', '0', ['OPCION_EL_ARREGLO']),
  aritmetica(2, 'la direccion', '2', ['OPCION_ES_LA_DIRECCION']),
  // ---- 3: sumarle uno a un puntero ----
  aritmetica(3, 'mil cuatro', '1'),
  aritmetica(3, 'mil uno', '0', ['OPCION_UN_CASILLERO']),
  aritmetica(3, 'once', '2', ['OPCION_SUMA_AL_VALOR']),
  // ---- 4: llegar al elemento siguiente ----
  aritmetica(4, 'el segundo elemento', '1'),
  aritmetica(4, 'la direccion', '0', ['OPCION_ES_LA_DIRECCION']),
  aritmetica(4, 'sumando al valor', '2', ['OPCION_SUMA_AL_VALOR']),
  // ---- 5: v[2] y *(v + 2) ----
  aritmetica(5, 'con los parentesis', '2'),
  aritmetica(5, 'la direccion', '0', ['OPCION_ES_LA_DIRECCION']),
  aritmetica(5, 'sumando al valor', '1', ['OPCION_SUMA_AL_VALOR']),
  // ---- 6: llegar a un elemento sumando ----
  aritmetica(6, 'con v + 3', 'printf("%d", *(v + 3));', 'ok', { mejoras: [] }),
  aritmetica(6, 'con 3 + v', 'printf("%d", *(3 + v));'),
  aritmetica(6, 'con corchetes', 'printf("%d", v[3]);', ['CONTENIDO_FALTA'], {
    dice: ['hay que llegar a la variable con `*`', 'sin usar corchetes'],
  }),
  aritmetica(6, 'sumando al valor', 'printf("%d", *v + 3);', ['MUESTRA_DISTINTA']),
  aritmetica(6, 'el tercero', 'printf("%d", *(v + 2));', ['MUESTRA_DISTINTA']),
  aritmetica(6, 'cuenta desde uno', 'printf("%d", *(v + 4));', ['INDICE_FUERA_DE_RANGO']),
  // ---- 7: recorrer sumando el indice ----
  aritmetica(7, 'con *(v + i)', 'for (i = 0; i < 3; i++) {\n  suma = suma + *(v + i);\n}', 'ok', { mejoras: [] }),
  aritmetica(7, 'con *(i + v)', 'for (i = 0; i < 3; i++) {\n  suma = suma + *(i + v);\n}'),
  aritmetica(7, 'con un while', 'i = 0;\nwhile (i < 3) {\n  suma = suma + *(v + i);\n  i++;\n}'),
  aritmetica(7, 'con corchetes', 'for (i = 0; i < 3; i++) {\n  suma = suma + v[i];\n}', ['CONTENIDO_FALTA']),
  aritmetica(7, 'sin sumar el indice', 'for (i = 0; i < 3; i++) {\n  suma = suma + *v;\n}', ['RESULTADO_VALOR_DISTINTO']),
  aritmetica(7, 'se pasa del arreglo', 'for (i = 0; i < 4; i++) {\n  suma = suma + *(v + i);\n}', ['INDICE_FUERA_DE_RANGO']),
  // ---- 8: corchetes con un puntero ----
  aritmetica(8, 'tercer elemento', '1'),
  aritmetica(8, 'cuenta desde uno', '0', ['OPCION_CUENTA_DESDE_UNO']),
  aritmetica(8, 'no compila', '2', ['OPCION_NO_COMPILA']),
  // ---- 9: sumarle uno al nombre del arreglo ----
  aritmetica(9, 'no compila', '1'),
  aritmetica(9, 'v avanza', '0', ['OPCION_V_AVANZA']),
  aritmetica(9, 'el primero vale once', '2', ['OPCION_SUMA_AL_ELEMENTO']),
  // ---- 10: recorrer con un puntero que avanza ----
  aritmetica(10, 'con p++', 'for (i = 0; i < 3; i++) {\n  suma = suma + *p;\n  p++;\n}', 'ok', { mejoras: [] }),
  aritmetica(10, 'con p += 1', 'for (i = 0; i < 3; i++) {\n  suma = suma + *p;\n  p += 1;\n}'),
  aritmetica(10, 'leyendo y avanzando juntos', 'for (i = 0; i < 3; i++) {\n  suma = suma + *p++;\n}'),
  aritmetica(10, 'con un while', 'i = 0;\nwhile (i < 3) {\n  suma = suma + *p;\n  p++;\n  i++;\n}'),
  aritmetica(10, 'con los indices', 'for (i = 0; i < 3; i++) {\n  suma = suma + v[i];\n}', ['CONTENIDO_FALTA']),
  aritmetica(10, 'sin avanzar', 'suma = *p + *(p + 1) + *(p + 2);', ['AVANCE_FALTA']),
  aritmetica(10, 'una sola vuelta', 'suma = suma + *p;\np++;', ['RESULTADO_VALOR_DISTINTO']),
  aritmetica(10, 'sin sumar el valor', 'for (i = 0; i < 3; i++) {\n  suma = suma + 1;\n  p++;\n}', ['RESULTADO_VALOR_DISTINTO']),

  // ===== Arreglos que cambian dentro de una funcion =====
  // ---- 1: un entero y un arreglo ----
  arreglos(1, 'cambia solo el arreglo', '1'),
  arreglos(1, 'cambian los dos', '0', ['OPCION_CAMBIAN_LOS_DOS']),
  arreglos(1, 'no cambia ninguno', '2', ['OPCION_NO_CAMBIA_NINGUNO']),
  // ---- 2: int v[] es int *v ----
  arreglos(2, 'el puntero', '1'),
  arreglos(2, 'un entero', '0', ['OPCION_UN_ENTERO']),
  arreglos(2, 'la cantidad con puntero', '2', ['OPCION_CANTIDAD_PUNTERO']),
  // ---- 3: poner un arreglo en cero ----
  arreglos(3, 'con un ciclo', FUNCION('void ponerEnCero(int v[], int n)', '  int i;\n\n  for (i = 0; i < n; i++) {\n    v[i] = 0;\n  }'), 'ok', { mejoras: [] }),
  arreglos(3, 'con un puntero en el parametro', FUNCION('void ponerEnCero(int *v, int n)', '  int i;\n\n  for (i = 0; i < n; i++) {\n    *(v + i) = 0;\n  }')),
  arreglos(3, 'avanzando con un puntero', FUNCION('void ponerEnCero(int v[], int n)', '  int *p = v;\n  int i;\n\n  for (i = 0; i < n; i++) {\n    *p = 0;\n    p++;\n  }')),
  arreglos(3, 'con un while', FUNCION('void ponerEnCero(int v[], int n)', '  int i = 0;\n\n  while (i < n) {\n    v[i] = 0;\n    i++;\n  }')),
  arreglos(3, 'solo el primero', FUNCION('void ponerEnCero(int v[], int n)', '  v[0] = 0;'), ['RESULTADO_VALOR_DISTINTO']),
  arreglos(3, 'sin la cantidad', FUNCION('void ponerEnCero(int v[])', '  v[0] = 0;'), ['PARAMETROS_CANTIDAD']),
  arreglos(3, 'un entero en lugar del arreglo', FUNCION('void ponerEnCero(int v, int n)', '  v = 0;'), ['PARAMETRO_TIPO']),
  arreglos(3, 'pasa de la cantidad', FUNCION('void ponerEnCero(int v[], int n)', '  int i;\n\n  for (i = 0; i <= n; i++) {\n    v[i] = 0;\n  }'), ['INDICE_FUERA_DE_RANGO']),
  // ---- 4: duplicar los elementos ----
  arreglos(4, 'multiplicando', FUNCION('void duplicar(int v[], int n)', '  int i;\n\n  for (i = 0; i < n; i++) {\n    v[i] = v[i] * 2;\n  }'), 'ok', { mejoras: [] }),
  arreglos(4, 'con *=', FUNCION('void duplicar(int v[], int n)', '  int i;\n\n  for (i = 0; i < n; i++) {\n    v[i] *= 2;\n  }')),
  arreglos(4, 'sumando el mismo', FUNCION('void duplicar(int v[], int n)', '  int i;\n\n  for (i = 0; i < n; i++) {\n    v[i] = v[i] + v[i];\n  }')),
  arreglos(4, 'con un puntero', FUNCION('void duplicar(int *v, int n)', '  int i;\n\n  for (i = 0; i < n; i++) {\n    *(v + i) = *(v + i) * 2;\n  }')),
  arreglos(4, 'sumando dos', FUNCION('void duplicar(int v[], int n)', '  int i;\n\n  for (i = 0; i < n; i++) {\n    v[i] = v[i] + 2;\n  }'), ['RESULTADO_VALOR_DISTINTO']),
  arreglos(4, 'devuelve el arreglo', FUNCION('int duplicar(int v[], int n)', '  return v[0] * 2;'), ['DEVUELVE_EN_VEZ_DE_MOSTRAR'], {
    dice: ['deje el resultado en el arreglo que recibe'],
  }),
  // ---- 5: el tamano de un arreglo recibido ----
  arreglos(5, 'cuarenta y ocho', '1'),
  arreglos(5, 'cuarenta y cuarenta', '0', ['OPCION_TAMANO_DEL_ARREGLO']),
  arreglos(5, 'siempre ocho', '2', ['OPCION_SIEMPRE_OCHO']),
  // ---- 6: contar las letras de una cadena ----
  arreglos(
    6,
    'con un puntero que avanza',
    FUNCION('int contarLetras(char *texto)', "  char *p = texto;\n  int cantidad = 0;\n\n  while (*p != '\\0') {\n    cantidad++;\n    p++;\n  }\n  return cantidad;"),
    'ok',
    { mejoras: [] }
  ),
  arreglos(
    6,
    'con un parametro con corchetes',
    FUNCION('int contarLetras(char texto[])', "  char *p = texto;\n  int cantidad = 0;\n\n  while (*p != '\\0') {\n    cantidad++;\n    p++;\n  }\n  return cantidad;")
  ),
  arreglos(
    6,
    'avanzando el propio parametro',
    FUNCION('int contarLetras(char *texto)', "  int cantidad = 0;\n\n  while (*texto != '\\0') {\n    cantidad++;\n    texto++;\n  }\n  return cantidad;")
  ),
  arreglos(
    6,
    'con indices',
    FUNCION('int contarLetras(char texto[])', "  int i = 0;\n\n  while (texto[i] != '\\0') {\n    i++;\n  }\n  return i;"),
    ['AVANCE_FALTA']
  ),
  arreglos(
    6,
    'cuenta una de mas',
    FUNCION('int contarLetras(char *texto)', "  char *p = texto;\n  int cantidad = 1;\n\n  while (*p != '\\0') {\n    cantidad++;\n    p++;\n  }\n  return cantidad;"),
    ['DEVUELVE_DISTINTO']
  ),
  arreglos(
    6,
    'muestra en vez de devolver',
    FUNCION('void contarLetras(char *texto)', "  char *p = texto;\n  int cantidad = 0;\n\n  while (*p != '\\0') {\n    cantidad++;\n    p++;\n  }\n  printf(\"%d\", cantidad);"),
    ['MUESTRA_EN_VEZ_DE_DEVOLVER']
  ),
];
