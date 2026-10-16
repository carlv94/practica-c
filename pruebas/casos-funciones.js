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

const declarar = serie('funciones-declarar');

const FUNCION = (encabezado, cuerpo) => `${encabezado} {\n${cuerpo}\n}`;
const CAMBIAR = (encabezado, cuerpo) => FUNCION(encabezado, cuerpo);

export const CASOS_DE_FUNCIONES = [
  // ---- 1: una funcion que no recibe ni devuelve nada ----
  declarar(1, 'void con el mensaje', FUNCION('void saludar(void)', '  printf("Bienvenido");'), 'ok', { mejoras: [] }),
  declarar(1, 'sin la palabra void en los parentesis', FUNCION('void saludar()', '  printf("Bienvenido");')),
  declarar(1, 'otro nombre', FUNCION('void mensaje(void)', '  printf("Bienvenido");')),
  declarar(1, 'devuelve un int', FUNCION('int saludar(void)', '  printf("Bienvenido");\n  return 0;'), ['FUNCION_TIPO_RETORNO'], {
    dice: ['es `void`'],
  }),
  declarar(1, 'recibe un parametro', FUNCION('void saludar(int x)', '  printf("Bienvenido");'), ['PARAMETROS_CANTIDAD'], {
    dice: ['no reciba ningún parámetro'],
  }),
  declarar(1, 'otro mensaje', FUNCION('void saludar(void)', '  printf("Hola");'), ['MUESTRA_DISTINTA']),
  declarar(1, 'no muestra nada', FUNCION('void saludar(void)', '  int x = 1;'), ['MUESTRA_FALTA']),
  declarar(1, 'solo la llamada', 'saludar();', ['FUNCION_FALTA']),
  // ---- 2: llamarla ----
  declarar(2, 'la llamada', 'saludar();', 'ok', { mejoras: [] }),
  declarar(2, 'con un argumento de mas', 'saludar(5);', ['LLAMADA_ARGUMENTOS_CANTIDAD'], {
    dice: ['no recibe ningún argumento'],
  }),
  declarar(2, 'otra funcion', 'hola();', ['FUNCION_EQUIVOCADA']),
  declarar(2, 'con una mayuscula', 'Saludar();', ['FUNCION_MAL_ESCRITA']),
  declarar(2, 'sin llamarla', 'printf("Bienvenido");', ['FUNCION_EQUIVOCADA']),
  // ---- 3: parametros y retorno ----
  declarar(3, 'la suma', FUNCION('int sumar(int a, int b)', '  return a + b;'), 'ok', { mejoras: [] }),
  declarar(3, 'con otros nombres', FUNCION('int total(int x, int y)', '  return x + y;')),
  declarar(3, 'con una variable', FUNCION('int sumar(int a, int b)', '  int resultado;\n\n  resultado = a + b;\n  return resultado;')),
  declarar(3, 'multiplica', FUNCION('int sumar(int a, int b)', '  return a * b;'), ['DEVUELVE_DISTINTO'], {
    dice: ['`sumar(3, 4)` devuelve `12` y debería devolver `7`'],
  }),
  declarar(3, 'sin return', FUNCION('int sumar(int a, int b)', '  int c = a + b;'), ['RETORNO_FALTA']),
  declarar(3, 'muestra en vez de devolver', FUNCION('void sumar(int a, int b)', '  printf("%d", a + b);'), [
    'MUESTRA_EN_VEZ_DE_DEVOLVER',
  ]),
  declarar(3, 'un parametro', FUNCION('int sumar(int a)', '  return a;'), ['PARAMETROS_CANTIDAD']),
  declarar(3, 'devuelve un float', FUNCION('float sumar(int a, int b)', '  return a + b;'), ['FUNCION_TIPO_RETORNO']),
  declarar(3, 'un parametro float', FUNCION('int sumar(float a, int b)', '  return a + b;'), ['PARAMETRO_TIPO']),
  declarar(3, 'parametros con asterisco', FUNCION('int sumar(int *a, int *b)', '  return *a + *b;'), [
    'PARAMETRO_ASTERISCO_DE_MAS',
  ]),
  // ---- 4: el prototipo ----
  declarar(4, 'el prototipo', 'int sumar(int a, int b);', 'ok', { mejoras: [] }),
  declarar(4, 'sin nombres de parametros', 'int sumar(int, int);'),
  declarar(4, 'la funcion y no el prototipo', FUNCION('int sumar(int a, int b)', '  return a + b;'), ['PROTOTIPO_FALTA']),
  declarar(4, 'con un parametro', 'int sumar(int a);', ['PROTOTIPO_NO_COINCIDE']),
  declarar(4, 'con otro tipo', 'void sumar(int a, int b);', ['PROTOTIPO_NO_COINCIDE']),
  declarar(4, 'de otra funcion', 'int otra(int a, int b);', ['PROTOTIPO_NOMBRE']),
  // ---- 5: cuestionario, que vale la variable de afuera ----
  declarar(5, 'la variable no cambia: la correcta', '1'),
  declarar(5, 'la variable no cambia: el doble', '0', ['OPCION_SE_MODIFICO']),
  declarar(5, 'la variable no cambia: un error', '2', ['OPCION_ES_UN_ERROR']),
  // ---- 6: modificar las variables de afuera ----
  declarar(
    6,
    'intercambia con aux',
    CAMBIAR('void cambiar(int *a, int *b)', '  int aux;\n\n  aux = *a;\n  *a = *b;\n  *b = aux;'),
    'ok',
    { mejoras: [] }
  ),
  declarar(6, 'sin asteriscos en la declaracion', CAMBIAR('void cambiar(int a, int b)', '  int aux;\n\n  aux = a;\n  a = b;\n  b = aux;'), [
    'PARAMETRO_REFERENCIA_FALTA',
  ], { dice: ['`&` al llamarla', '`*` en la declaración'] }),
  declarar(6, 'sin asterisco al usarlos', CAMBIAR('void cambiar(int *a, int *b)', '  int aux;\n\n  aux = a;\n  a = b;\n  b = aux;'), [
    'PARAMETRO_SIN_ASTERISCO_AL_USARLO',
  ], { dice: ['`*a` cada vez que se lo usa'] }),
  declarar(6, 'sin aux', CAMBIAR('void cambiar(int *a, int *b)', '  *a = *b;\n  *b = *a;'), ['RESULTADO_VALOR_DISTINTO']),
  declarar(6, 'uno por valor', CAMBIAR('void cambiar(int *a, int b)', '  int aux;\n\n  aux = *a;\n  *a = b;'), [
    'PARAMETRO_REFERENCIA_FALTA',
  ]),
  declarar(6, 'devuelve algo', CAMBIAR('void cambiar(int *a, int *b)', '  int aux;\n\n  aux = *a;\n  *a = *b;\n  *b = aux;\n  return aux;'), [
    'RETORNO_EN_VOID',
  ]),
];
