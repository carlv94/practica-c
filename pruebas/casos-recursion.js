// Casos de las series de recursion en que se escribe codigo.
// Mismo formato que casos.js.

const serie = (id) => (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: id,
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

const escribir = serie('recursion-escribir');
const conArreglos = serie('recursion-arreglos');

const FUNCION = (encabezado, cuerpo) => `${encabezado} {\n${cuerpo}\n}`;

export const CASOS_DE_RECURSION = [
  // ===== Escribir funciones recursivas =====
  // ---- 1: una funcion sin caso base ----
  escribir(1, 'se llama sin parar', '1'),
  escribir(1, 'muestra seis', '0', ['OPCION_MUESTRA_SEIS']),
  escribir(1, 'no compila', '2', ['OPCION_NO_COMPILA']),
  // ---- 2: un caso base que no se alcanza ----
  escribir(2, 'no se alcanza', '2'),
  escribir(2, 'muestra seis', '0', ['OPCION_MUESTRA_SEIS']),
  escribir(2, 'muestra cero', '1', ['OPCION_MUESTRA_CERO']),
  // ---- 3: sumar hasta n ----
  escribir(3, 'con n == 0', FUNCION('int suma(int n)', '  if (n == 0) {\n    return 0;\n  }\n  return n + suma(n - 1);'), 'ok', { mejoras: [] }),
  escribir(3, 'con n <= 0', FUNCION('int suma(int n)', '  if (n <= 0) {\n    return 0;\n  }\n  return n + suma(n - 1);')),
  escribir(3, 'con la llamada primero', FUNCION('int suma(int n)', '  if (n == 0) {\n    return 0;\n  }\n  return suma(n - 1) + n;')),
  escribir(3, 'otro nombre', FUNCION('int sumarHasta(int cantidad)', '  if (cantidad == 0) {\n    return 0;\n  }\n  return cantidad + sumarHasta(cantidad - 1);')),
  escribir(3, 'con un ciclo', FUNCION('int suma(int n)', '  int total = 0;\n  for (int i = 1; i <= n; i++) {\n    total = total + i;\n  }\n  return total;'), ['FUNCION_NO_RECURSIVA'], {
    dice: ['resuelve el problema con un ciclo'],
  }),
  escribir(3, 'con la formula', FUNCION('int suma(int n)', '  return n * (n + 1) / 2;'), ['FUNCION_NO_RECURSIVA']),
  escribir(3, 'sin caso base', FUNCION('int suma(int n)', '  return n + suma(n - 1);'), ['RECURSION_SIN_FIN'], {
    dice: ['se llama a sí misma sin parar'],
  }),
  escribir(3, 'se aleja del caso base', FUNCION('int suma(int n)', '  if (n == 0) {\n    return 0;\n  }\n  return n + suma(n + 1);'), ['RECURSION_SIN_FIN']),
  escribir(3, 'el caso base devuelve uno', FUNCION('int suma(int n)', '  if (n == 0) {\n    return 1;\n  }\n  return n + suma(n - 1);'), ['DEVUELVE_DISTINTO']),
  escribir(3, 'no devuelve nada', FUNCION('void suma(int n)', '  if (n == 0) {\n    return;\n  }\n  suma(n - 1);'), ['FUNCION_TIPO_RETORNO']),
  // ---- 4: factorial ----
  escribir(4, 'con n == 0', FUNCION('int factorial(int n)', '  if (n == 0) {\n    return 1;\n  }\n  return n * factorial(n - 1);'), 'ok', { mejoras: [] }),
  escribir(4, 'con n <= 1', FUNCION('int factorial(int n)', '  if (n <= 1) {\n    return 1;\n  }\n  return n * factorial(n - 1);')),
  escribir(4, 'con un ciclo', FUNCION('int factorial(int n)', '  int p = 1;\n  for (int i = 2; i <= n; i++) {\n    p = p * i;\n  }\n  return p;'), ['FUNCION_NO_RECURSIVA']),
  escribir(4, 'el caso base devuelve cero', FUNCION('int factorial(int n)', '  if (n == 0) {\n    return 0;\n  }\n  return n * factorial(n - 1);'), ['DEVUELVE_DISTINTO']),
  escribir(4, 'sin caso base', FUNCION('int factorial(int n)', '  return n * factorial(n - 1);'), ['RECURSION_SIN_FIN']),
  // ---- 5: potencia ----
  escribir(5, 'con exp == 0', FUNCION('int potencia(int base, int exp)', '  if (exp == 0) {\n    return 1;\n  }\n  return base * potencia(base, exp - 1);'), 'ok', { mejoras: [] }),
  escribir(5, 'con un ciclo', FUNCION('int potencia(int base, int exp)', '  int r = 1;\n  for (int i = 0; i < exp; i++) {\n    r = r * base;\n  }\n  return r;'), ['FUNCION_NO_RECURSIVA']),
  escribir(5, 'baja la base en lugar del exponente: nunca llega al caso base', FUNCION('int potencia(int base, int exp)', '  if (exp == 0) {\n    return 1;\n  }\n  return base * potencia(base - 1, exp);'), ['RECURSION_SIN_FIN']),
  escribir(5, 'con un parametro', FUNCION('int potencia(int base)', '  if (base == 0) {\n    return 1;\n  }\n  return base * potencia(base - 1);'), ['PARAMETROS_CANTIDAD']),
  // ---- 6: contar digitos ----
  escribir(6, 'con n < 10', FUNCION('int digitos(int n)', '  if (n < 10) {\n    return 1;\n  }\n  return 1 + digitos(n / 10);'), 'ok', { mejoras: [] }),
  escribir(6, 'con el cero aparte', FUNCION('int digitos(int n)', '  if (n == 0) {\n    return 1;\n  }\n  if (n < 10) {\n    return 1;\n  }\n  return 1 + digitos(n / 10);')),
  escribir(6, 'el cero sin digitos', FUNCION('int digitos(int n)', '  if (n == 0) {\n    return 0;\n  }\n  return 1 + digitos(n / 10);'), ['DEVUELVE_DISTINTO']),
  escribir(6, 'sin caso base', FUNCION('int digitos(int n)', '  return 1 + digitos(n / 10);'), ['RECURSION_SIN_FIN']),
  // ---- 7: sumar los digitos ----
  escribir(7, 'con el resto', FUNCION('int sumaDigitos(int n)', '  if (n == 0) {\n    return 0;\n  }\n  return n % 10 + sumaDigitos(n / 10);'), 'ok', { mejoras: [] }),
  escribir(7, 'con n < 10', FUNCION('int sumaDigitos(int n)', '  if (n < 10) {\n    return n;\n  }\n  return n % 10 + sumaDigitos(n / 10);')),
  escribir(7, 'sin el resto', FUNCION('int sumaDigitos(int n)', '  if (n == 0) {\n    return 0;\n  }\n  return n / 10 + sumaDigitos(n / 10);'), ['DEVUELVE_DISTINTO']),
  // ---- 8: mostrar de n a 1 ----
  escribir(8, 'mostrando antes de llamar', FUNCION('void mostrar(int n)', '  if (n == 0) {\n    return;\n  }\n  printf("%d ", n);\n  mostrar(n - 1);'), 'ok', { mejoras: [] }),
  escribir(8, 'mostrando despues de llamar', FUNCION('void mostrar(int n)', '  if (n == 0) {\n    return;\n  }\n  mostrar(n - 1);\n  printf("%d ", n);'), ['MUESTRA_DISTINTA']),
  escribir(8, 'con un ciclo', FUNCION('void mostrar(int n)', '  for (int i = n; i >= 1; i--) {\n    printf("%d ", i);\n  }'), ['FUNCION_NO_RECURSIVA']),
  escribir(8, 'sin caso base', FUNCION('void mostrar(int n)', '  printf("%d ", n);\n  mostrar(n - 1);'), ['RECURSION_SIN_FIN']),
  // ---- 9: mostrar de 1 a n ----
  escribir(9, 'mostrando despues de llamar', FUNCION('void mostrar(int n)', '  if (n == 0) {\n    return;\n  }\n  mostrar(n - 1);\n  printf("%d ", n);'), 'ok', { mejoras: [] }),
  escribir(9, 'mostrando antes de llamar', FUNCION('void mostrar(int n)', '  if (n == 0) {\n    return;\n  }\n  printf("%d ", n);\n  mostrar(n - 1);'), ['MUESTRA_DISTINTA']),

  // ===== Recursion con arreglos y cadenas =====
  // ---- 1: sumar un arreglo ----
  conArreglos(1, 'con el ultimo elemento', FUNCION('int sumar(int v[], int n)', '  if (n == 0) {\n    return 0;\n  }\n  return v[n - 1] + sumar(v, n - 1);'), 'ok', { mejoras: [] }),
  conArreglos(1, 'con la llamada primero', FUNCION('int sumar(int v[], int n)', '  if (n == 0) {\n    return 0;\n  }\n  return sumar(v, n - 1) + v[n - 1];')),
  conArreglos(1, 'con un ciclo', FUNCION('int sumar(int v[], int n)', '  int t = 0;\n  for (int i = 0; i < n; i++) {\n    t = t + v[i];\n  }\n  return t;'), ['FUNCION_NO_RECURSIVA']),
  conArreglos(1, 'un lugar de mas', FUNCION('int sumar(int v[], int n)', '  if (n == 0) {\n    return 0;\n  }\n  return v[n] + sumar(v, n - 1);'), ['INDICE_FUERA_DE_RANGO']),
  conArreglos(1, 'sin caso base', FUNCION('int sumar(int v[], int n)', '  return v[n - 1] + sumar(v, n - 1);'), ['INDICE_FUERA_DE_RANGO']),
  // ---- 2: buscar un valor ----
  conArreglos(
    2,
    'devolviendo al encontrarlo',
    FUNCION('int esta(int v[], int n, int valor)', '  if (n == 0) {\n    return 0;\n  }\n  if (v[n - 1] == valor) {\n    return 1;\n  }\n  return esta(v, n - 1, valor);'),
    'ok',
    { mejoras: [] }
  ),
  conArreglos(
    2,
    'con || en la llamada',
    FUNCION('int esta(int v[], int n, int valor)', '  if (n == 0) {\n    return 0;\n  }\n  return v[n - 1] == valor || esta(v, n - 1, valor);')
  ),
  conArreglos(
    2,
    'el caso base devuelve uno',
    FUNCION('int esta(int v[], int n, int valor)', '  if (n == 0) {\n    return 1;\n  }\n  if (v[n - 1] == valor) {\n    return 1;\n  }\n  return esta(v, n - 1, valor);'),
    ['DEVUELVE_DISTINTO']
  ),
  // ---- 3: mostrar al reves ----
  conArreglos(3, 'mostrando antes de llamar', FUNCION('void mostrar(int v[], int n)', '  if (n == 0) {\n    return;\n  }\n  printf("%d ", v[n - 1]);\n  mostrar(v, n - 1);'), 'ok', { mejoras: [] }),
  conArreglos(3, 'mostrando en orden', FUNCION('void mostrar(int v[], int n)', '  if (n == 0) {\n    return;\n  }\n  mostrar(v, n - 1);\n  printf("%d ", v[n - 1]);'), ['MUESTRA_DISTINTA']),
  // ---- 4: el largo de una cadena ----
  conArreglos(4, 'con el fin de la cadena', FUNCION('int largo(char s[], int i)', "  if (s[i] == '\\0') {\n    return 0;\n  }\n  return 1 + largo(s, i + 1);"), 'ok', { mejoras: [] }),
  conArreglos(4, 'con cero en lugar de la letra', FUNCION('int largo(char s[], int i)', '  if (s[i] == 0) {\n    return 0;\n  }\n  return 1 + largo(s, i + 1);')),
  conArreglos(4, 'sin avanzar', FUNCION('int largo(char s[], int i)', "  if (s[i] == '\\0') {\n    return 0;\n  }\n  return 1 + largo(s, i);"), ['RECURSION_SIN_FIN']),
  conArreglos(4, 'con un ciclo', FUNCION('int largo(char s[], int i)', "  int n = 0;\n  while (s[i + n] != '\\0') {\n    n++;\n  }\n  return n;"), ['FUNCION_NO_RECURSIVA']),
  // ---- 5: contar una letra ----
  conArreglos(
    5,
    'sumando uno si coincide',
    FUNCION('int contar(char s[], int i, char letra)', "  if (s[i] == '\\0') {\n    return 0;\n  }\n  if (s[i] == letra) {\n    return 1 + contar(s, i + 1, letra);\n  }\n  return contar(s, i + 1, letra);"),
    'ok',
    { mejoras: [] }
  ),
  conArreglos(
    5,
    'con una cuenta aparte',
    FUNCION('int contar(char s[], int i, char letra)', "  if (s[i] == '\\0') {\n    return 0;\n  }\n  int cuenta = 0;\n  if (s[i] == letra) {\n    cuenta = 1;\n  }\n  return cuenta + contar(s, i + 1, letra);")
  ),
  conArreglos(
    5,
    'sin sumar nunca',
    FUNCION('int contar(char s[], int i, char letra)', "  if (s[i] == '\\0') {\n    return 0;\n  }\n  return contar(s, i + 1, letra);"),
    ['DEVUELVE_DISTINTO']
  ),
  // ---- 6: recursion o ciclo ----
  conArreglos(6, 'mas memoria', '2'),
  conArreglos(6, 'mas rapida', '0', ['OPCION_MAS_RAPIDA']),
  conArreglos(6, 'sin diferencia', '1', ['OPCION_SIN_DIFERENCIA']),
  // ---- 7: un palindromo ----
  conArreglos(
    7,
    'comparando los extremos',
    FUNCION('int esPalindromo(char s[], int i, int j)', '  if (i >= j) {\n    return 1;\n  }\n  if (s[i] != s[j]) {\n    return 0;\n  }\n  return esPalindromo(s, i + 1, j - 1);'),
    'ok',
    { mejoras: [] }
  ),
  conArreglos(
    7,
    'con una sola condicion',
    FUNCION('int esPalindromo(char s[], int i, int j)', '  if (i >= j) {\n    return 1;\n  }\n  return s[i] == s[j] && esPalindromo(s, i + 1, j - 1);')
  ),
  conArreglos(
    7,
    'sin comparar',
    FUNCION('int esPalindromo(char s[], int i, int j)', '  if (i >= j) {\n    return 1;\n  }\n  return esPalindromo(s, i + 1, j - 1);'),
    ['DEVUELVE_DISTINTO']
  ),
];
