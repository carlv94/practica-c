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
const conDigitos = serie('recursion-digitos');
const conApoyo = serie('recursion-apoyo');

const FUNCION = (encabezado, cuerpo) => `${encabezado} {\n${cuerpo}\n}`;

// Las dos funciones de "Invertir un numero", que repiten varios casos de la serie de apoyo.
const INVERTIR_AUX = FUNCION('int invertirAux(int n, int invertido)', '  if (n == 0) {\n    return invertido;\n  }\n  return invertirAux(n / 10, invertido * 10 + n % 10);');
const INVERTIR = FUNCION('int invertir(int n)', '  return invertirAux(n, 0);');

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
  // ---- 4: potencia ----
  escribir(5, 'con exp == 0', FUNCION('int potencia(int base, int exp)', '  if (exp == 0) {\n    return 1;\n  }\n  return base * potencia(base, exp - 1);'), 'ok', { mejoras: [] }),
  escribir(5, 'con un ciclo', FUNCION('int potencia(int base, int exp)', '  int r = 1;\n  for (int i = 0; i < exp; i++) {\n    r = r * base;\n  }\n  return r;'), ['FUNCION_NO_RECURSIVA']),
  escribir(5, 'baja la base en lugar del exponente: nunca llega al caso base', FUNCION('int potencia(int base, int exp)', '  if (exp == 0) {\n    return 1;\n  }\n  return base * potencia(base - 1, exp);'), ['RECURSION_SIN_FIN']),
  escribir(5, 'con un parametro', FUNCION('int potencia(int base)', '  if (base == 0) {\n    return 1;\n  }\n  return base * potencia(base - 1);'), ['PARAMETROS_CANTIDAD']),
  // ---- 6: contar digitos ----
  escribir(6, 'con n < 10', FUNCION('int digitos(int n)', '  if (n < 10) {\n    return 1;\n  }\n  return 1 + digitos(n / 10);'), 'ok', { mejoras: [] }),
  escribir(6, 'con el cero aparte', FUNCION('int digitos(int n)', '  if (n == 0) {\n    return 1;\n  }\n  if (n < 10) {\n    return 1;\n  }\n  return 1 + digitos(n / 10);')),
  escribir(6, 'el cero sin digitos', FUNCION('int digitos(int n)', '  if (n == 0) {\n    return 0;\n  }\n  return 1 + digitos(n / 10);'), ['DEVUELVE_DISTINTO']),
  escribir(6, 'sin caso base', FUNCION('int digitos(int n)', '  return 1 + digitos(n / 10);'), ['RECURSION_SIN_FIN']),
  // ---- 5: sumar los digitos ----
  escribir(7, 'con el resto', FUNCION('int sumaDigitos(int n)', '  if (n == 0) {\n    return 0;\n  }\n  return n % 10 + sumaDigitos(n / 10);'), 'ok', { mejoras: [] }),
  escribir(7, 'con n < 10', FUNCION('int sumaDigitos(int n)', '  if (n < 10) {\n    return n;\n  }\n  return n % 10 + sumaDigitos(n / 10);')),
  escribir(7, 'sin el resto', FUNCION('int sumaDigitos(int n)', '  if (n == 0) {\n    return 0;\n  }\n  return n / 10 + sumaDigitos(n / 10);'), ['DEVUELVE_DISTINTO']),
  // ---- 6: mostrar de n a 1 ----
  escribir(8, 'mostrando antes de llamar', FUNCION('void mostrar(int n)', '  if (n == 0) {\n    return;\n  }\n  printf("%d ", n);\n  mostrar(n - 1);'), 'ok', { mejoras: [] }),
  escribir(8, 'mostrando despues de llamar', FUNCION('void mostrar(int n)', '  if (n == 0) {\n    return;\n  }\n  mostrar(n - 1);\n  printf("%d ", n);'), ['MUESTRA_DISTINTA']),
  escribir(8, 'con un ciclo', FUNCION('void mostrar(int n)', '  for (int i = n; i >= 1; i--) {\n    printf("%d ", i);\n  }'), ['FUNCION_NO_RECURSIVA']),
  escribir(8, 'sin caso base', FUNCION('void mostrar(int n)', '  printf("%d ", n);\n  mostrar(n - 1);'), ['RECURSION_SIN_FIN']),
  // ---- 7: mostrar de 1 a n ----
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
    FUNCION('TBool esta(int v[], int n, int valor)', '  if (n == 0) {\n    return FALSO;\n  }\n  if (v[n - 1] == valor) {\n    return VERDADERO;\n  }\n  return esta(v, n - 1, valor);'),
    'ok',
    { mejoras: [] }
  ),
  conArreglos(
    2,
    'con || en la llamada',
    FUNCION('TBool esta(int v[], int n, int valor)', '  if (n == 0) {\n    return FALSO;\n  }\n  return v[n - 1] == valor || esta(v, n - 1, valor);')
  ),
  conArreglos(
    2,
    'el caso base devuelve uno',
    FUNCION('TBool esta(int v[], int n, int valor)', '  if (n == 0) {\n    return VERDADERO;\n  }\n  if (v[n - 1] == valor) {\n    return VERDADERO;\n  }\n  return esta(v, n - 1, valor);'),
    ['DEVUELVE_DISTINTO']
  ),
  conArreglos(
    2,
    'devolviendo numeros en lugar del enumerado',
    FUNCION('TBool esta(int v[], int n, int valor)', '  if (n == 0) {\n    return 0;\n  }\n  if (v[n - 1] == valor) {\n    return 1;\n  }\n  return esta(v, n - 1, valor);'),
    ['RETORNO_NUMERO_EN_ENUMERADO']
  ),
  // ---- 3: mostrar al reves ----
  conArreglos(3, 'mostrando antes de llamar', FUNCION('void mostrar(int v[], int n)', '  if (n == 0) {\n    return;\n  }\n  printf("%d ", v[n - 1]);\n  mostrar(v, n - 1);'), 'ok', { mejoras: [] }),
  conArreglos(3, 'mostrando en orden', FUNCION('void mostrar(int v[], int n)', '  if (n == 0) {\n    return;\n  }\n  mostrar(v, n - 1);\n  printf("%d ", v[n - 1]);'), ['MUESTRA_DISTINTA']),
  // ---- 4: el largo de una cadena ----
  conArreglos(4, 'con el fin de la cadena', FUNCION('int largo(char s[], int i)', "  if (s[i] == '\\0') {\n    return 0;\n  }\n  return 1 + largo(s, i + 1);"), 'ok', { mejoras: [] }),
  conArreglos(4, 'con cero en lugar de la letra', FUNCION('int largo(char s[], int i)', '  if (s[i] == 0) {\n    return 0;\n  }\n  return 1 + largo(s, i + 1);')),
  conArreglos(4, 'sin avanzar', FUNCION('int largo(char s[], int i)', "  if (s[i] == '\\0') {\n    return 0;\n  }\n  return 1 + largo(s, i);"), ['RECURSION_SIN_FIN']),
  conArreglos(4, 'con un ciclo', FUNCION('int largo(char s[], int i)', "  int n = 0;\n  while (s[i + n] != '\\0') {\n    n++;\n  }\n  return n;"), ['FUNCION_NO_RECURSIVA']),
  // ---- 4: contar una letra ----
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
  // ---- 5: un palindromo ----
  conArreglos(
    7,
    'comparando los extremos',
    FUNCION('TBool esPalindromo(char s[], int i, int j)', '  if (i >= j) {\n    return VERDADERO;\n  }\n  if (s[i] != s[j]) {\n    return FALSO;\n  }\n  return esPalindromo(s, i + 1, j - 1);'),
    'ok',
    { mejoras: [] }
  ),
  conArreglos(
    7,
    'con una sola condicion',
    FUNCION('TBool esPalindromo(char s[], int i, int j)', '  if (i >= j) {\n    return VERDADERO;\n  }\n  return s[i] == s[j] && esPalindromo(s, i + 1, j - 1);')
  ),
  conArreglos(
    7,
    'sin comparar',
    FUNCION('TBool esPalindromo(char s[], int i, int j)', '  if (i >= j) {\n    return VERDADERO;\n  }\n  return esPalindromo(s, i + 1, j - 1);'),
    ['DEVUELVE_DISTINTO']
  ),

  // ===== Recursion con digitos =====
  // ---- 1: el digito mayor ----
  conDigitos(
    1,
    'comparando con el mayor del resto',
    FUNCION('int mayorDigito(int n)', '  if (n < 10) {\n    return n;\n  }\n  int resto = mayorDigito(n / 10);\n  if (n % 10 > resto) {\n    return n % 10;\n  }\n  return resto;'),
    'ok',
    { mejoras: [] }
  ),
  conDigitos(
    1,
    'con el caso base en cero',
    FUNCION('int mayorDigito(int n)', '  if (n == 0) {\n    return 0;\n  }\n  int resto = mayorDigito(n / 10);\n  if (n % 10 > resto) {\n    return n % 10;\n  }\n  return resto;')
  ),
  conDigitos(1, 'devolviendo el primer digito', FUNCION('int mayorDigito(int n)', '  if (n < 10) {\n    return n;\n  }\n  return mayorDigito(n / 10);'), ['DEVUELVE_DISTINTO']),
  conDigitos(1, 'sin caso base', FUNCION('int mayorDigito(int n)', '  return mayorDigito(n / 10);'), ['RECURSION_SIN_FIN']),
  conDigitos(
    1,
    'con un ciclo',
    FUNCION('int mayorDigito(int n)', '  int mayor = 0;\n  while (n > 0) {\n    if (n % 10 > mayor) {\n      mayor = n % 10;\n    }\n    n = n / 10;\n  }\n  return mayor;'),
    ['FUNCION_NO_RECURSIVA']
  ),
  conDigitos(
    1,
    'con una funcion auxiliar',
    'int ultimo(int n) {\n  return n % 10;\n}\n\n' +
      FUNCION('int mayorDigito(int n)', '  if (n < 10) {\n    return n;\n  }\n  int resto = mayorDigito(n / 10);\n  if (ultimo(n) > resto) {\n    return ultimo(n);\n  }\n  return resto;'),
    ['FUNCION_DE_MAS']
  ),
  // ---- 2: contar las apariciones de un digito ----
  conDigitos(
    2,
    'sumando uno si coincide',
    FUNCION('int contar(int n, int d)', '  if (n == 0) {\n    return 0;\n  }\n  if (n % 10 == d) {\n    return 1 + contar(n / 10, d);\n  }\n  return contar(n / 10, d);'),
    'ok',
    { mejoras: [] }
  ),
  conDigitos(
    2,
    'con una cuenta aparte',
    FUNCION('int contar(int n, int d)', '  if (n == 0) {\n    return 0;\n  }\n  int cuenta = 0;\n  if (n % 10 == d) {\n    cuenta = 1;\n  }\n  return cuenta + contar(n / 10, d);')
  ),
  conDigitos(2, 'sin sumar nunca', FUNCION('int contar(int n, int d)', '  if (n == 0) {\n    return 0;\n  }\n  return contar(n / 10, d);'), ['DEVUELVE_DISTINTO']),
  conDigitos(2, 'contando todos los digitos', FUNCION('int contar(int n, int d)', '  if (n == 0) {\n    return 0;\n  }\n  return 1 + contar(n / 10, d);'), ['DEVUELVE_DISTINTO']),
  // ---- 3: todos los digitos pares ----
  conDigitos(
    3,
    'con el resto de dividir por 2',
    FUNCION('TBool todosPares(int n)', '  if (n == 0) {\n    return VERDADERO;\n  }\n  if (n % 2 == 1) {\n    return FALSO;\n  }\n  return todosPares(n / 10);'),
    'ok',
    { mejoras: [] }
  ),
  conDigitos(
    3,
    'con una sola condicion',
    FUNCION('TBool todosPares(int n)', '  if (n == 0) {\n    return VERDADERO;\n  }\n  return n % 2 == 0 && todosPares(n / 10);')
  ),
  conDigitos(
    3,
    'mirando solo el primer digito',
    FUNCION('TBool todosPares(int n)', '  if (n < 10) {\n    if (n % 2 == 0) {\n      return VERDADERO;\n    }\n    return FALSO;\n  }\n  return todosPares(n / 10);'),
    ['DEVUELVE_DISTINTO']
  ),
  conDigitos(
    3,
    'devolviendo numeros en lugar del enumerado',
    FUNCION('TBool todosPares(int n)', '  if (n == 0) {\n    return 1;\n  }\n  if (n % 2 == 1) {\n    return 0;\n  }\n  return todosPares(n / 10);'),
    ['RETORNO_NUMERO_EN_ENUMERADO']
  ),
  // ---- 4: los digitos en orden creciente ----
  conDigitos(
    4,
    'comparando los dos ultimos digitos',
    FUNCION('TBool enOrden(int n)', '  if (n < 10) {\n    return VERDADERO;\n  }\n  if (n / 10 % 10 > n % 10) {\n    return FALSO;\n  }\n  return enOrden(n / 10);'),
    'ok',
    { mejoras: [] }
  ),
  conDigitos(
    4,
    'con el caso base en cero',
    FUNCION('TBool enOrden(int n)', '  if (n == 0) {\n    return VERDADERO;\n  }\n  if (n / 10 % 10 > n % 10) {\n    return FALSO;\n  }\n  return enOrden(n / 10);')
  ),
  conDigitos(
    4,
    'con una sola condicion',
    FUNCION('TBool enOrden(int n)', '  if (n < 10) {\n    return VERDADERO;\n  }\n  return n / 10 % 10 <= n % 10 && enOrden(n / 10);')
  ),
  conDigitos(
    4,
    'comparando al reves',
    FUNCION('TBool enOrden(int n)', '  if (n < 10) {\n    return VERDADERO;\n  }\n  if (n / 10 % 10 < n % 10) {\n    return FALSO;\n  }\n  return enOrden(n / 10);'),
    ['DEVUELVE_DISTINTO']
  ),
  conDigitos(
    4,
    'rechazando los digitos repetidos',
    FUNCION('TBool enOrden(int n)', '  if (n < 10) {\n    return VERDADERO;\n  }\n  if (n / 10 % 10 >= n % 10) {\n    return FALSO;\n  }\n  return enOrden(n / 10);'),
    ['DEVUELVE_DISTINTO']
  ),
  conDigitos(4, 'solo los dos ultimos', FUNCION('TBool enOrden(int n)', '  if (n / 10 % 10 > n % 10) {\n    return FALSO;\n  }\n  return VERDADERO;'), ['FUNCION_NO_RECURSIVA']),
  conDigitos(
    4,
    'sin caso base',
    FUNCION('TBool enOrden(int n)', '  if (n / 10 % 10 > n % 10) {\n    return FALSO;\n  }\n  return enOrden(n / 10);'),
    ['RECURSION_SIN_FIN']
  ),
  conDigitos(
    4,
    'devolviendo numeros en lugar del enumerado',
    FUNCION('TBool enOrden(int n)', '  if (n < 10) {\n    return 1;\n  }\n  if (n / 10 % 10 > n % 10) {\n    return 0;\n  }\n  return enOrden(n / 10);'),
    ['RETORNO_NUMERO_EN_ENUMERADO']
  ),
  // ---- 5: un numero es sufijo de otro ----
  conDigitos(
    5,
    'con los dos casos base',
    FUNCION('TBool esSufijo(int s, int n)', '  if (s == 0) {\n    return VERDADERO;\n  }\n  if (n == 0) {\n    return FALSO;\n  }\n  if (s % 10 != n % 10) {\n    return FALSO;\n  }\n  return esSufijo(s / 10, n / 10);'),
    'ok',
    { mejoras: [] }
  ),
  conDigitos(
    5,
    'sin el caso de n (comparar con cero alcanza)',
    FUNCION('TBool esSufijo(int s, int n)', '  if (s == 0) {\n    return VERDADERO;\n  }\n  if (s % 10 != n % 10) {\n    return FALSO;\n  }\n  return esSufijo(s / 10, n / 10);')
  ),
  conDigitos(
    5,
    'sin el caso de s',
    FUNCION('TBool esSufijo(int s, int n)', '  if (n == 0) {\n    return FALSO;\n  }\n  if (s % 10 != n % 10) {\n    return FALSO;\n  }\n  return esSufijo(s / 10, n / 10);'),
    ['DEVUELVE_DISTINTO']
  ),
  conDigitos(
    5,
    'devolviendo numeros en lugar del enumerado',
    FUNCION('TBool esSufijo(int s, int n)', '  if (s == 0) {\n    return 1;\n  }\n  if (s % 10 != n % 10) {\n    return 0;\n  }\n  return esSufijo(s / 10, n / 10);'),
    ['RETORNO_NUMERO_EN_ENUMERADO']
  ),
  // ---- 6: eliminar un digito ----
  conDigitos(
    6,
    'multiplicando por diez al volver',
    FUNCION('int quitar(int n, int d)', '  if (n == 0) {\n    return 0;\n  }\n  if (n % 10 == d) {\n    return quitar(n / 10, d);\n  }\n  return quitar(n / 10, d) * 10 + n % 10;'),
    'ok',
    { mejoras: [] }
  ),
  conDigitos(
    6,
    'con el resultado en una variable',
    FUNCION('int quitar(int n, int d)', '  if (n == 0) {\n    return 0;\n  }\n  int resto = quitar(n / 10, d);\n  if (n % 10 == d) {\n    return resto;\n  }\n  return resto * 10 + n % 10;')
  ),
  conDigitos(
    6,
    'sumando en lugar de ubicar el digito',
    FUNCION('int quitar(int n, int d)', '  if (n == 0) {\n    return 0;\n  }\n  if (n % 10 == d) {\n    return quitar(n / 10, d);\n  }\n  return quitar(n / 10, d) + n % 10;'),
    ['DEVUELVE_DISTINTO']
  ),
  conDigitos(
    6,
    'quitando solo la primera aparicion',
    FUNCION('int quitar(int n, int d)', '  if (n == 0) {\n    return 0;\n  }\n  if (n % 10 == d) {\n    return n / 10;\n  }\n  return quitar(n / 10, d) * 10 + n % 10;'),
    ['DEVUELVE_DISTINTO']
  ),
  conDigitos(6, 'sin caso base', FUNCION('int quitar(int n, int d)', '  if (n % 10 == d) {\n    return quitar(n / 10, d);\n  }\n  return quitar(n / 10, d) * 10 + n % 10;'), ['RECURSION_SIN_FIN']),
  // ---- 7: duplicar cada digito ----
  conDigitos(
    7,
    'con cien y once',
    FUNCION('int duplicar(int n)', '  if (n == 0) {\n    return 0;\n  }\n  return duplicar(n / 10) * 100 + n % 10 * 11;'),
    'ok',
    { mejoras: [] }
  ),
  conDigitos(
    7,
    'con el digito en una variable',
    FUNCION('int duplicar(int n)', '  if (n == 0) {\n    return 0;\n  }\n  int u = n % 10;\n  return duplicar(n / 10) * 100 + u * 10 + u;')
  ),
  conDigitos(7, 'sin duplicar', FUNCION('int duplicar(int n)', '  if (n == 0) {\n    return 0;\n  }\n  return duplicar(n / 10) * 10 + n % 10;'), ['DEVUELVE_DISTINTO']),
  conDigitos(7, 'sin correr el resto', FUNCION('int duplicar(int n)', '  if (n == 0) {\n    return 0;\n  }\n  return duplicar(n / 10) + n % 10 * 11;'), ['DEVUELVE_DISTINTO']),
  // ---- 8: mostrar en binario ----
  conDigitos(
    8,
    'mostrando despues de llamar',
    FUNCION('void binario(int n)', '  if (n == 0) {\n    return;\n  }\n  binario(n / 2);\n  printf("%d", n % 2);'),
    'ok',
    { mejoras: [] }
  ),
  conDigitos(8, 'mostrando antes de llamar', FUNCION('void binario(int n)', '  if (n == 0) {\n    return;\n  }\n  printf("%d", n % 2);\n  binario(n / 2);'), ['MUESTRA_DISTINTA']),
  conDigitos(8, 'sin caso base', FUNCION('void binario(int n)', '  binario(n / 2);\n  printf("%d", n % 2);'), ['RECURSION_SIN_FIN']),
  // ===== Recursion con un parametro de apoyo =====
  // ---- 1 y 2: dos cuestionarios con la suma de los digitos ----
  conApoyo(1, 'devuelve cero', '1'),
  conApoyo(1, 'la suma de los digitos', '0', ['OPCION_MUESTRA_DIEZ']),
  conApoyo(1, 'no termina', '2', ['OPCION_NO_TERMINA']),
  conApoyo(2, 'arranca en cinco', '1'),
  conApoyo(2, 'la suma de los digitos', '0', ['OPCION_MUESTRA_DIEZ']),
  conApoyo(2, 'el valor inicial', '2', ['OPCION_MUESTRA_CINCO']),
  // ---- 3: invertir un numero ----
  conApoyo(3, 'la recursiva y la que la usa', INVERTIR_AUX + '\n\n' + INVERTIR, 'ok', { mejoras: [] }),
  conApoyo(
    3,
    'con otros nombres',
    FUNCION('int dar(int numero, int armado)', '  if (numero == 0) {\n    return armado;\n  }\n  return dar(numero / 10, armado * 10 + numero % 10);') + '\n\n' + FUNCION('int alReves(int numero)', '  return dar(numero, 0);')
  ),
  conApoyo(3, 'la que la usa primero, con prototipo', 'int invertirAux(int n, int invertido);\n\n' + INVERTIR + '\n\n' + INVERTIR_AUX),
  conApoyo(3, 'solo la recursiva', INVERTIR_AUX, ['APOYO_CANTIDAD']),
  conApoyo(3, 'solo la que la usa', INVERTIR, ['APOYO_CANTIDAD', 'FUNCION_NO_DECLARADA']),
  conApoyo(3, 'tres funciones', FUNCION('int ultimo(int n)', '  return n % 10;') + '\n\n' + INVERTIR_AUX + '\n\n' + INVERTIR, ['APOYO_CANTIDAD']),
  conApoyo(3, 'las dos con un parametro', FUNCION('int invertirAux(int n)', '  return n;') + '\n\n' + FUNCION('int invertir(int n)', '  return invertirAux(n);'), ['APOYO_PARAMETROS']),
  conApoyo(
    3,
    'la que la usa tambien es recursiva',
    INVERTIR_AUX + '\n\n' + FUNCION('int invertir(int n)', '  if (n == 0) {\n    return 0;\n  }\n  return invertirAux(n, 0) + invertir(n / 100);'),
    ['APOYO_PUBLICA_RECURSIVA']
  ),
  conApoyo(
    3,
    'la del apoyo con un ciclo',
    FUNCION('int invertirAux(int n, int invertido)', '  while (n > 0) {\n    invertido = invertido * 10 + n % 10;\n    n = n / 10;\n  }\n  return invertido;') + '\n\n' + INVERTIR,
    ['FUNCION_NO_RECURSIVA']
  ),
  conApoyo(3, 'sin llamar a la recursiva', INVERTIR_AUX + '\n\n' + FUNCION('int invertir(int n)', '  return n % 10;'), ['APOYO_NO_LLAMA']),
  conApoyo(3, 'con el valor inicial equivocado', INVERTIR_AUX + '\n\n' + FUNCION('int invertir(int n)', '  return invertirAux(n, 1);'), ['DEVUELVE_DISTINTO'], {
    dice: ['Revise el valor con que la primera función llama a la recursiva'],
  }),
  conApoyo(
    3,
    'la recursiva devuelve decimales',
    FUNCION('double invertirAux(int n, int invertido)', '  if (n == 0) {\n    return invertido;\n  }\n  return invertirAux(n / 10, invertido * 10 + n % 10);') + '\n\n' + INVERTIR,
    ['APOYO_RETORNO']
  ),
  conApoyo(
    3,
    'armandolo al reves',
    FUNCION('int invertirAux(int n, int invertido)', '  if (n == 0) {\n    return invertido;\n  }\n  return invertirAux(n / 10, invertido + n % 10);') + '\n\n' + INVERTIR,
    ['DEVUELVE_DISTINTO']
  ),
  // ---- 4: un numero en binario, como entero ----
  conApoyo(4, 'la recursiva y la que la usa', FUNCION('int binarioAux(int n, int lugar)', '  if (n == 0) {\n    return 0;\n  }\n  return n % 2 * lugar + binarioAux(n / 2, lugar * 10);') + '\n\n' + FUNCION('int binario(int n)', '  return binarioAux(n, 1);'), 'ok', { mejoras: [] }),
  conApoyo(4, 'con el lugar inicial en cero', FUNCION('int binarioAux(int n, int lugar)', '  if (n == 0) {\n    return 0;\n  }\n  return n % 2 * lugar + binarioAux(n / 2, lugar * 10);') + '\n\n' + FUNCION('int binario(int n)', '  return binarioAux(n, 0);'), ['DEVUELVE_DISTINTO']),
  conApoyo(4, 'multiplicando por dos', FUNCION('int binarioAux(int n, int lugar)', '  if (n == 0) {\n    return 0;\n  }\n  return n % 2 * lugar + binarioAux(n / 2, lugar * 2);') + '\n\n' + FUNCION('int binario(int n)', '  return binarioAux(n, 1);'), ['DEVUELVE_DISTINTO']),
  // ---- 5: la posicion de un valor ----
  conApoyo(5, 'la recursiva y la que la usa', FUNCION('int posicionDesde(int v[], int n, int valor, int i)', '  if (i == n) {\n    return -1;\n  }\n  if (v[i] == valor) {\n    return i;\n  }\n  return posicionDesde(v, n, valor, i + 1);') + '\n\n' + FUNCION('int posicion(int v[], int n, int valor)', '  return posicionDesde(v, n, valor, 0);'), 'ok', { mejoras: [] }),
  conApoyo(5, 'con la posicion inicial equivocada', FUNCION('int posicionDesde(int v[], int n, int valor, int i)', '  if (i == n) {\n    return -1;\n  }\n  if (v[i] == valor) {\n    return i;\n  }\n  return posicionDesde(v, n, valor, i + 1);') + '\n\n' + FUNCION('int posicion(int v[], int n, int valor)', '  return posicionDesde(v, n, valor, 1);'), ['DEVUELVE_DISTINTO']),
  conApoyo(5, 'sin el parametro de apoyo', FUNCION('int posicionDesde(int v[], int n, int valor)', '  if (n == 0) {\n    return -1;\n  }\n  if (v[n - 1] == valor) {\n    return n - 1;\n  }\n  return posicionDesde(v, n - 1, valor);') + '\n\n' + FUNCION('int posicion(int v[], int n, int valor)', '  return posicionDesde(v, n, valor);'), ['APOYO_PARAMETROS']),
  // ---- 6: es capicua ----
  conApoyo(6, 'la recursiva y la que la usa', FUNCION('TBool capicuaAux(int n, int alReves, int original)', '  if (n == 0) {\n    if (alReves == original) {\n      return VERDADERO;\n    }\n    return FALSO;\n  }\n  return capicuaAux(n / 10, alReves * 10 + n % 10, original);') + '\n\n' + FUNCION('TBool esCapicua(int n)', '  return capicuaAux(n, 0, n);'), 'ok', { mejoras: [] }),
  conApoyo(6, 'con un solo apoyo', FUNCION('TBool capicuaAux(int n, int alReves)', '  if (n == 0) {\n    return VERDADERO;\n  }\n  return capicuaAux(n / 10, alReves * 10 + n % 10);') + '\n\n' + FUNCION('TBool esCapicua(int n)', '  return capicuaAux(n, 0);'), ['APOYO_PARAMETROS']),
  conApoyo(6, 'devolviendo numeros en lugar del enumerado', FUNCION('int capicuaAux(int n, int alReves, int original)', '  if (n == 0) {\n    return alReves == original;\n  }\n  return capicuaAux(n / 10, alReves * 10 + n % 10, original);') + '\n\n' + FUNCION('TBool esCapicua(int n)', '  if (capicuaAux(n, 0, n) == 1) {\n    return 1;\n  }\n  return 0;'), ['RETORNO_NUMERO_EN_ENUMERADO']),
  conApoyo(6, 'con el original equivocado', FUNCION('TBool capicuaAux(int n, int alReves, int original)', '  if (n == 0) {\n    if (alReves == original) {\n      return VERDADERO;\n    }\n    return FALSO;\n  }\n  return capicuaAux(n / 10, alReves * 10 + n % 10, original);') + '\n\n' + FUNCION('TBool esCapicua(int n)', '  return capicuaAux(n, 0, 0);'), ['DEVUELVE_DISTINTO']),
];
