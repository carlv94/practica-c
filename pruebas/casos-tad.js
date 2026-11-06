// Casos de las series de tipos abstractos de datos: usar un TAD, escribir el .h
// y escribir el .c. Mismo formato que casos.js.

const serie = (id) => (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: id,
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

const usar = serie('tad-usar');
const escribirH = serie('tad-escribir-h');
const escribirC = serie('tad-escribir-c');

const lineas = (...l) => l.join('\n');

// main.c con lo que va adentro de main.
const MAIN = (...cuerpo) =>
  lineas('#include <stdio.h>', '#include "contador.h"', '', 'int main() {', ...cuerpo.map((l) => (l ? '  ' + l : l)), '  return 0;', '}');

const CONTADOR_H = lineas(
  '#ifndef CONTADOR_H',
  '#define CONTADOR_H',
  '',
  'typedef struct {',
  '  int valor;',
  '} TContador;',
  '',
  'void inicializar(TContador *c);',
  'void contar(TContador *c);',
  'int obtener(TContador c);',
  '',
  '#endif'
);

// El .h del contador con una parte cambiada.
const H = (cambio) => cambio(CONTADOR_H);

const CONTADOR_C = lineas(
  '#include "contador.h"',
  '',
  'void inicializar(TContador *c) {',
  '  c->valor = 0;',
  '}',
  '',
  'void contar(TContador *c) {',
  '  c->valor = c->valor + 1;',
  '}',
  '',
  'int obtener(TContador c) {',
  '  return c.valor;',
  '}'
);

const FRACCION_C = lineas(
  '#include <stdio.h>',
  '#include "fraccion.h"',
  '',
  'TFraccion crear(int numerador, int denominador) {',
  '  TFraccion f;',
  '',
  '  f.numerador = numerador;',
  '  f.denominador = denominador;',
  '  return f;',
  '}',
  '',
  'TFraccion sumar(TFraccion a, TFraccion b) {',
  '  TFraccion r;',
  '',
  '  r.numerador = a.numerador * b.denominador + b.numerador * a.denominador;',
  '  r.denominador = a.denominador * b.denominador;',
  '  return r;',
  '}',
  '',
  'void mostrar(TFraccion f) {',
  '  printf("%d/%d", f.numerador, f.denominador);',
  '}'
);

const usarPila = serie('tad-pila-usar');
const pilaH = serie('tad-pila-h');
const pilaC = serie('tad-pila-c');
const repr = serie('tad-representacion');
const fecha = serie('tad-fecha');

// main.c de las pilas con lo que va adentro de main.
const MAIN_PILA = (...cuerpo) =>
  lineas('#include <stdio.h>', '#include "pila.h"', '', 'int main() {', ...cuerpo.map((l) => (l ? '  ' + l : l)), '  return 0;', '}');

const PILA_H = lineas(
  '#ifndef PILA_H',
  '#define PILA_H',
  '',
  '#define MAX 8',
  '',
  'typedef enum {',
  '  FALSO,',
  '  VERDADERO',
  '} TBool;',
  '',
  'typedef struct {',
  '  int datos[MAX];',
  '  int tope;',
  '} TPila;',
  '',
  'void inicializar(TPila *p);',
  'void apilar(TPila *p, int x);',
  'int desapilar(TPila *p);',
  'int cima(TPila p);',
  'TBool vacia(TPila p);',
  'TBool llena(TPila p);',
  '',
  '#endif'
);
const HP = (cambio) => cambio(PILA_H);

const PILA_C = lineas(
  '#include "pila.h"',
  '',
  'void inicializar(TPila *p) {',
  '  p->tope = 0;',
  '}',
  '',
  'void apilar(TPila *p, int x) {',
  '  p->datos[p->tope] = x;',
  '  p->tope = p->tope + 1;',
  '}',
  '',
  'int desapilar(TPila *p) {',
  '  p->tope = p->tope - 1;',
  '  return p->datos[p->tope];',
  '}',
  '',
  'int cima(TPila p) {',
  '  return p.datos[p.tope - 1];',
  '}',
  '',
  'TBool vacia(TPila p) {',
  '  if (p.tope == 0) {',
  '    return VERDADERO;',
  '  }',
  '  return FALSO;',
  '}',
  '',
  'TBool llena(TPila p) {',
  '  if (p.tope == MAX) {',
  '    return VERDADERO;',
  '  }',
  '  return FALSO;',
  '}'
);

const REPR_C = lineas(
  '#include "pila.h"',
  '',
  'void inicializar(TPila *p) {',
  '  p->tope = -1;',
  '}',
  '',
  'void apilar(TPila *p, int x) {',
  '  p->tope = p->tope + 1;',
  '  p->datos[p->tope] = x;',
  '}',
  '',
  'int desapilar(TPila *p) {',
  '  int x;',
  '',
  '  x = p->datos[p->tope];',
  '  p->tope = p->tope - 1;',
  '  return x;',
  '}',
  '',
  'int cima(TPila p) {',
  '  return p.datos[p.tope];',
  '}',
  '',
  'TBool vacia(TPila p) {',
  '  if (p.tope == -1) {',
  '    return VERDADERO;',
  '  }',
  '  return FALSO;',
  '}',
  '',
  'TBool llena(TPila p) {',
  '  if (p.tope == MAX - 1) {',
  '    return VERDADERO;',
  '  }',
  '  return FALSO;',
  '}'
);

const FECHA_H = lineas(
  '#ifndef FECHA_H',
  '#define FECHA_H',
  '',
  'typedef struct {',
  '  int dia;',
  '  int mes;',
  '  int anio;',
  '} TFecha;',
  '',
  'TFecha crear(int dia, int mes, int anio);',
  'int diasDelMes(int mes, int anio);',
  'TFecha sumarDias(TFecha f, int n);',
  'void mostrar(TFecha f);',
  '',
  '#endif'
);

const FECHA_C = lineas(
  '#include <stdio.h>',
  '#include "fecha.h"',
  '',
  'TFecha crear(int dia, int mes, int anio) {',
  '  TFecha f;',
  '',
  '  f.dia = dia;',
  '  f.mes = mes;',
  '  f.anio = anio;',
  '  return f;',
  '}',
  '',
  'int diasDelMes(int mes, int anio) {',
  '  int dias;',
  '',
  '  if (mes == 2) {',
  '    if ((anio % 4 == 0 && anio % 100 != 0) || anio % 400 == 0) {',
  '      dias = 29;',
  '    } else {',
  '      dias = 28;',
  '    }',
  '  } else if (mes == 4 || mes == 6 || mes == 9 || mes == 11) {',
  '    dias = 30;',
  '  } else {',
  '    dias = 31;',
  '  }',
  '  return dias;',
  '}',
  '',
  'TFecha sumarDias(TFecha f, int n) {',
  '  for (int i = 0; i < n; i++) {',
  '    f.dia = f.dia + 1;',
  '    if (f.dia > diasDelMes(f.mes, f.anio)) {',
  '      f.dia = 1;',
  '      f.mes = f.mes + 1;',
  '      if (f.mes > 12) {',
  '        f.mes = 1;',
  '        f.anio = f.anio + 1;',
  '      }',
  '    }',
  '  }',
  '  return f;',
  '}',
  '',
  'void mostrar(TFecha f) {',
  '  printf("%d/%d/%d", f.dia, f.mes, f.anio);',
  '}'
);

const FECHA_MAIN = lineas(
  '#include <stdio.h>',
  '#include "fecha.h"',
  '',
  'int main() {',
  '  int dia, mes, anio, n;',
  '  TFecha f;',
  '',
  '  scanf("%d", &dia);',
  '  scanf("%d", &mes);',
  '  scanf("%d", &anio);',
  '  scanf("%d", &n);',
  '  f = crear(dia, mes, anio);',
  '  f = sumarDias(f, n);',
  '  mostrar(f);',
  '  return 0;',
  '}'
);

export const CASOS_DE_TAD = [
  // ===== Usar un TAD =====
  // ---- 1: tocar los campos ----
  usar(1, 'se salta las operaciones', '1'),
  usar(1, 'el campo es comun', '0', ['OPCION_TAD_CAMPO_COMUN']),
  usar(1, 'no compila', '2', ['OPCION_TAD_NO_COMPILA']),
  // ---- 2: contar con el contador ----
  usar(2, 'tres llamadas', MAIN('TContador c;', '', 'inicializar(&c);', 'contar(&c);', 'contar(&c);', 'contar(&c);', 'printf("%d", obtener(c));')),
  usar(
    2,
    'con un ciclo',
    MAIN('TContador c;', '', 'inicializar(&c);', 'for (int i = 0; i < 3; i++) {', '  contar(&c);', '}', 'printf("%d", obtener(c));')
  ),
  usar(
    2,
    'tocando el campo',
    MAIN('TContador c;', '', 'inicializar(&c);', 'contar(&c);', 'c.valor = c.valor + 2;', 'printf("%d", obtener(c));'),
    ['TAD_ACCESO_DIRECTO'],
    { dice: ['inicializar', 'contar', 'obtener'] }
  ),
  usar(
    2,
    'mostrando el campo',
    MAIN('TContador c;', '', 'inicializar(&c);', 'contar(&c);', 'contar(&c);', 'contar(&c);', 'printf("%d", c.valor);'),
    ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR']
  ),
  usar(
    2,
    'el encabezado entre menor y mayor',
    lineas('#include <stdio.h>', '#include <contador.h>', '', 'int main() {', '  TContador c;', '', '  inicializar(&c);', '  contar(&c);', '  printf("%d", obtener(c));', '  return 0;', '}'),
    ['INCLUDE_PROPIO_CON_MENOR_MAYOR']
  ),
  usar(
    2,
    'incluyendo el .c',
    lineas('#include <stdio.h>', '#include "contador.c"', '', 'int main() {', '  TContador c;', '', '  inicializar(&c);', '  contar(&c);', '  printf("%d", obtener(c));', '  return 0;', '}'),
    ['INCLUYE_UN_C']
  ),
  usar(
    2,
    'sin incluir el encabezado',
    lineas('#include <stdio.h>', '', 'int main() {', '  TContador c;', '', '  inicializar(&c);', '  contar(&c);', '  printf("%d", obtener(c));', '  return 0;', '}'),
    ['INCLUDE_PROPIO_FALTA']
  ),
  usar(
    2,
    'sin inicializar el contador',
    MAIN('TContador c;', '', 'contar(&c);', 'contar(&c);', 'contar(&c);', 'printf("%d", obtener(c));'),
    ['TAD_OPERACION_SIN_USAR'],
    { dice: ['inicializar'] }
  ),
  usar(2, 'contando de menos', MAIN('TContador c;', '', 'inicializar(&c);', 'contar(&c);', 'contar(&c);', 'printf("%d", obtener(c));'), ['MUESTRA_DISTINTA']),
  usar(
    2,
    'sin las operaciones',
    lineas('#include <stdio.h>', '#include "contador.h"', '', 'int main() {', '  TContador c;', '', '  printf("3");', '  return 0;', '}'),
    ['TAD_OPERACION_SIN_USAR']
  ),
  // ---- 3: contar los pares ----
  usar(
    3,
    'con un ciclo',
    MAIN(
      'TContador pares;',
      'int n;',
      '',
      'inicializar(&pares);',
      'for (int i = 0; i < 5; i++) {',
      '  scanf("%d", &n);',
      '  if (n % 2 == 0) {',
      '    contar(&pares);',
      '  }',
      '}',
      'printf("%d", obtener(pares));'
    )
  ),
  usar(
    3,
    'contando los impares',
    MAIN(
      'TContador c;',
      'int n;',
      '',
      'inicializar(&c);',
      'for (int i = 0; i < 5; i++) {',
      '  scanf("%d", &n);',
      '  if (n % 2 != 0) {',
      '    contar(&c);',
      '  }',
      '}',
      'printf("%d", obtener(c));'
    ),
    ['MUESTRA_DISTINTA']
  ),
  usar(
    3,
    'con un entero y sin el contador',
    MAIN(
      'int cuenta = 0;',
      'int n;',
      '',
      'for (int i = 0; i < 5; i++) {',
      '  scanf("%d", &n);',
      '  if (n % 2 == 0) {',
      '    cuenta++;',
      '  }',
      '}',
      'printf("%d", cuenta);'
    ),
    ['TAD_OPERACION_SIN_USAR']
  ),
  // ---- 4: dos contadores ----
  usar(
    4,
    'dos contadores',
    MAIN(
      'TContador a;',
      'TContador b;',
      '',
      'inicializar(&a);',
      'inicializar(&b);',
      'for (int i = 0; i < 5; i++) {',
      '  contar(&a);',
      '}',
      'for (int i = 0; i < 2; i++) {',
      '  contar(&b);',
      '}',
      'printf("%d %d", obtener(a), obtener(b));'
    )
  ),
  // Dos for seguidos con su propia i son validos; la misma variable declarada dos veces en el mismo bloque, no.
  usar(
    4,
    'la misma variable dos veces en el mismo bloque',
    MAIN(
      'TContador a;',
      'TContador b;',
      'int i;',
      'int i;',
      '',
      'inicializar(&a);',
      'inicializar(&b);',
      'for (i = 0; i < 5; i++) {',
      '  contar(&a);',
      '}',
      'for (i = 0; i < 2; i++) {',
      '  contar(&b);',
      '}',
      'printf("%d %d", obtener(a), obtener(b));'
    ),
    ['VARIABLE_REDEFINIDA']
  ),
  usar(
    4,
    'sin inicializar el segundo',
    MAIN(
      'TContador a;',
      'TContador b;',
      '',
      'inicializar(&a);',
      'for (int i = 0; i < 5; i++) {',
      '  contar(&a);',
      '}',
      'for (int i = 0; i < 2; i++) {',
      '  contar(&b);',
      '}',
      'printf("%d %d", obtener(a), obtener(b));'
    ),
    ['TAD_SIN_INICIALIZAR'],
    { dice: ['Falta llamar a `inicializar`'] }
  ),
  usar(
    4,
    'en el orden contrario',
    MAIN(
      'TContador a;',
      'TContador b;',
      '',
      'inicializar(&a);',
      'inicializar(&b);',
      'for (int i = 0; i < 5; i++) {',
      '  contar(&a);',
      '}',
      'for (int i = 0; i < 2; i++) {',
      '  contar(&b);',
      '}',
      'printf("%d %d", obtener(b), obtener(a));'
    ),
    ['MUESTRA_DISTINTA']
  ),
  usar(
    4,
    'con un solo contador',
    MAIN('TContador a;', '', 'inicializar(&a);', 'for (int i = 0; i < 7; i++) {', '  contar(&a);', '}', 'printf("%d %d", obtener(a), obtener(a));'),
    ['MUESTRA_DISTINTA']
  ),

  // ===== Escribir el archivo .h =====
  // ---- 1: que va en cada archivo ----
  escribirH(1, 'el tipo y los prototipos', '1'),
  escribirH(1, 'al reves', '0', ['OPCION_TADH_AL_REVES']),
  escribirH(1, 'lo mismo en los dos', '2', ['OPCION_TADH_COPIA']),
  // ---- 2: para que sirven las guardas ----
  escribirH(2, 'se declara dos veces', '1'),
  escribirH(2, 'se ignora', '0', ['OPCION_GUARDAS_SE_IGNORA']),
  escribirH(2, 'dos tipos distintos', '2', ['OPCION_GUARDAS_DOS_TIPOS']),
  // ---- 3: el archivo del contador ----
  escribirH(3, 'completo', CONTADOR_H),
  escribirH(3, 'sin guardas', H((t) => t.replace('#ifndef CONTADOR_H\n#define CONTADOR_H\n\n', '').replace('\n\n#endif', '')), ['ENCABEZADO_SIN_GUARDA']),
  escribirH(3, 'con un define distinto', H((t) => t.replace('#define CONTADOR_H', '#define CONTADOR')), ['ENCABEZADO_GUARDA_INCOMPLETA']),
  escribirH(
    3,
    'con otro nombre de guarda',
    H((t) => t.replaceAll('CONTADOR_H', 'CONTADOR')),
    ['ENCABEZADO_GUARDA_NOMBRE'],
    { dice: ['CONTADOR_H'] }
  ),
  escribirH(
    3,
    'con el cuerpo de una funcion',
    H((t) => t.replace('int obtener(TContador c);', 'int obtener(TContador c) {\n  return c.valor;\n}')),
    ['ENCABEZADO_CON_CUERPO', 'PROTOTIPO_FALTA']
  ),
  escribirH(3, 'con una variable', H((t) => t.replace('void inicializar', 'TContador general;\n\nvoid inicializar')), ['ENCABEZADO_CON_VARIABLE']),
  escribirH(3, 'con algo afuera', H((t) => t + '\n\nvoid reiniciar(TContador *c);'), ['ENCABEZADO_FUERA_DE_LA_GUARDA']),
  escribirH(3, 'sin un prototipo', H((t) => t.replace('int obtener(TContador c);\n', '')), ['PROTOTIPO_FALTA']),
  escribirH(3, 'inicializar devuelve un entero', H((t) => t.replace('void inicializar', 'int inicializar')), ['FUNCION_TIPO_RETORNO']),
  escribirH(3, 'contar con el contador por valor', H((t) => t.replace('void contar(TContador *c);', 'void contar(TContador c);')), ['PARAMETRO_REFERENCIA_FALTA']),
  escribirH(3, 'contar con un numero de mas', H((t) => t.replace('void contar(TContador *c);', 'void contar(TContador *c, int n);')), ['PARAMETROS_CANTIDAD']),
  escribirH(3, 'el campo con otro nombre', H((t) => t.replace('int valor;', 'int cuenta;')), ['CAMPO_FALTA']),
  // ---- 4: el archivo de la fraccion ----
  escribirH(
    4,
    'completo',
    lineas(
      '#ifndef FRACCION_H',
      '#define FRACCION_H',
      '',
      'typedef struct {',
      '  int numerador;',
      '  int denominador;',
      '} TFraccion;',
      '',
      'TFraccion crear(int numerador, int denominador);',
      'TFraccion sumar(TFraccion a, TFraccion b);',
      'void mostrar(TFraccion f);',
      '',
      '#endif'
    )
  ),
  escribirH(
    4,
    'mostrar devuelve un entero',
    lineas(
      '#ifndef FRACCION_H',
      '#define FRACCION_H',
      '',
      'typedef struct {',
      '  int numerador;',
      '  int denominador;',
      '} TFraccion;',
      '',
      'TFraccion crear(int numerador, int denominador);',
      'TFraccion sumar(TFraccion a, TFraccion b);',
      'int mostrar(TFraccion f);',
      '',
      '#endif'
    ),
    ['FUNCION_TIPO_RETORNO']
  ),
  escribirH(
    4,
    'sumar con tres fracciones',
    lineas(
      '#ifndef FRACCION_H',
      '#define FRACCION_H',
      '',
      'typedef struct {',
      '  int numerador;',
      '  int denominador;',
      '} TFraccion;',
      '',
      'TFraccion crear(int numerador, int denominador);',
      'TFraccion sumar(TFraccion a, TFraccion b, TFraccion c);',
      'void mostrar(TFraccion f);',
      '',
      '#endif'
    ),
    ['PARAMETROS_CANTIDAD']
  ),

  // ===== Escribir el archivo .c =====
  // ---- 1: el contador ----
  escribirC(1, 'completo', CONTADOR_C),
  escribirC(1, 'contar con otra cuenta', CONTADOR_C.replace('c->valor = c->valor + 1;', 'c->valor++;')),
  escribirC(1, 'sin incluir el encabezado', CONTADOR_C.replace('#include "contador.h"\n\n', ''), ['INCLUDE_PROPIO_FALTA']),
  escribirC(1, 'incluyendo con menor y mayor', CONTADOR_C.replace('"contador.h"', '<contador.h>'), ['INCLUDE_PROPIO_CON_MENOR_MAYOR']),
  escribirC(
    1,
    'repitiendo el tipo',
    CONTADOR_C.replace('#include "contador.h"\n', '#include "contador.h"\n\ntypedef struct {\n  int valor;\n} TContador;\n'),
    ['TIPO_REPETIDO_EN_EL_C']
  ),
  escribirC(
    1,
    'sin definir una operacion',
    lineas('#include "contador.h"', '', 'void inicializar(TContador *c) {', '  c->valor = 0;', '}', '', 'int obtener(TContador c) {', '  return c.valor;', '}'),
    ['PROTOTIPO_SIN_DEFINICION'],
    { dice: ['contar'] }
  ),
  escribirC(
    1,
    'con otra firma',
    CONTADOR_C.replace('void contar(TContador *c)', 'void contar(TContador *c, int n)').replace('c->valor + 1', 'c->valor + n'),
    ['FIRMA_DISTINTA_DEL_PROTOTIPO']
  ),
  escribirC(
    1,
    'contar deja siempre uno',
    CONTADOR_C.replace('c->valor = c->valor + 1;', 'c->valor = 1;'),
    ['DEVUELVE_DISTINTO'],
    { dice: ['Después de inicializar un contador y contar tres veces'] }
  ),
  escribirC(1, 'inicializar no deja el valor en cero', CONTADOR_C.replace('  c->valor = 0;\n', ''), ['VARIABLE_SIN_VALOR']),
  // ---- 2: la fraccion ----
  escribirC(2, 'completa', FRACCION_C),
  escribirC(
    2,
    'sumar sin cruzar',
    FRACCION_C.replace(
      'r.numerador = a.numerador * b.denominador + b.numerador * a.denominador;',
      'r.numerador = a.numerador + b.numerador;'
    ).replace('r.denominador = a.denominador * b.denominador;', 'r.denominador = a.denominador + b.denominador;'),
    ['DEVUELVE_DISTINTO'],
    { dice: ['Al sumar 1/2 y 1/3'] }
  ),
  escribirC(2, 'mostrar con otro separador', FRACCION_C.replace('"%d/%d"', '"%d-%d"'), ['MUESTRA_DISTINTA']),
  escribirC(
    2,
    'crear con los campos al reves',
    FRACCION_C.replace('f.numerador = numerador;', 'f.numerador = denominador;').replace('f.denominador = denominador;', 'f.denominador = numerador;'),
    ['DEVUELVE_DISTINTO']
  ),
  escribirC(2, 'sin incluir el encabezado', FRACCION_C.replace('#include "fraccion.h"\n', ''), ['INCLUDE_PROPIO_FALTA']),
  // ===== Usar una pila =====
  // ---- 1: el orden de salida ----
  usarPila(1, 'sale primero lo que entro ultimo', '1'),
  usarPila(1, 'sale primero lo que entro primero', '0', ['OPCION_PILA_PRIMERO_QUE_ENTRA']),
  usarPila(1, 'desapilar vacia la pila', '2', ['OPCION_PILA_SACA_TODO']),
  // ---- 2: invertir tres numeros ----
  usarPila(
    2,
    'con dos ciclos',
    MAIN_PILA(
      'TPila p;',
      'int n;',
      '',
      'inicializar(&p);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  apilar(&p, n);',
      '}',
      'for (int i = 0; i < 3; i++) {',
      '  printf("%d ", desapilar(&p));',
      '}'
    )
  ),
  usarPila(
    2,
    'preguntando con VERDADERO y FALSO',
    MAIN_PILA(
      'TPila p;',
      'int n;',
      '',
      'inicializar(&p);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  if (llena(p) == FALSO) {',
      '    apilar(&p, n);',
      '  }',
      '}',
      'while (vacia(p) == FALSO) {',
      '  printf("%d ", desapilar(&p));',
      '}'
    )
  ),
  usarPila(
    2,
    'sin ciclos',
    MAIN_PILA(
      'TPila p;',
      'int a;',
      'int b;',
      'int c;',
      '',
      'inicializar(&p);',
      'scanf("%d %d %d", &a, &b, &c);',
      'apilar(&p, a);',
      'apilar(&p, b);',
      'apilar(&p, c);',
      'printf("%d ", desapilar(&p));',
      'printf("%d ", desapilar(&p));',
      'printf("%d", desapilar(&p));'
    )
  ),
  usarPila(
    2,
    'desapilando hasta que este vacia',
    MAIN_PILA(
      'TPila p;',
      'int n;',
      '',
      'inicializar(&p);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  apilar(&p, n);',
      '}',
      'while (!vacia(p)) {',
      '  printf("%d ", desapilar(&p));',
      '}'
    )
  ),
  usarPila(
    2,
    'mostrando solo dos',
    MAIN_PILA(
      'TPila p;',
      'int n;',
      '',
      'inicializar(&p);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  apilar(&p, n);',
      '}',
      'printf("%d ", desapilar(&p));',
      'printf("%d", desapilar(&p));'
    ),
    ['MUESTRA_DISTINTA']
  ),
  usarPila(
    2,
    'tocando los campos',
    MAIN_PILA(
      'TPila p;',
      'int n;',
      '',
      'inicializar(&p);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  apilar(&p, n);',
      '}',
      'for (int i = p.tope - 1; i >= 0; i--) {',
      '  printf("%d ", p.datos[i]);',
      '}'
    ),
    ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR'],
    { dice: ['desapilar'] }
  ),
  usarPila(
    2,
    'sin inicializar la pila',
    MAIN_PILA(
      'TPila p;',
      'int n;',
      '',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  apilar(&p, n);',
      '}',
      'for (int i = 0; i < 3; i++) {',
      '  printf("%d ", desapilar(&p));',
      '}'
    ),
    ['TAD_OPERACION_SIN_USAR'],
    { dice: ['inicializar'] }
  ),
  usarPila(
    2,
    'apilando de mas',
    MAIN_PILA(
      'TPila p;',
      '',
      'inicializar(&p);',
      'for (int i = 0; i < 9; i++) {',
      '  apilar(&p, i);',
      '}',
      'while (!vacia(p)) {',
      '  printf("%d ", desapilar(&p));',
      '}'
    ),
    ['TAD_USO_INCORRECTO'],
    { dice: ['llena'] }
  ),
  usarPila(
    2,
    'desapilando de mas',
    MAIN_PILA(
      'TPila p;',
      '',
      'inicializar(&p);',
      'apilar(&p, 1);',
      'apilar(&p, 2);',
      'for (int i = 0; i < 3; i++) {',
      '  printf("%d ", desapilar(&p));',
      '}'
    ),
    ['TAD_USO_INCORRECTO'],
    { dice: ['vacia'] }
  ),
  usarPila(
    2,
    'sin incluir el encabezado',
    lineas('#include <stdio.h>', '', 'int main() {', '  TPila p;', '', '  inicializar(&p);', '  apilar(&p, 1);', '  printf("%d", desapilar(&p));', '  return 0;', '}'),
    ['INCLUDE_PROPIO_FALTA']
  ),
  // ---- 3: de decimal a binario ----
  usarPila(
    3,
    'con un ciclo hasta que este vacia',
    MAIN_PILA(
      'TPila bits;',
      'int n;',
      '',
      'inicializar(&bits);',
      'scanf("%d", &n);',
      'while (n > 0) {',
      '  apilar(&bits, n % 2);',
      '  n = n / 2;',
      '}',
      'while (!vacia(bits)) {',
      '  printf("%d", desapilar(&bits));',
      '}'
    )
  ),
  usarPila(
    3,
    'sin tocar la entrada',
    MAIN_PILA(
      'TPila bits;',
      'int n;',
      'int resto;',
      '',
      'inicializar(&bits);',
      'scanf("%d", &n);',
      'while (n != 0) {',
      '  resto = n % 2;',
      '  apilar(&bits, resto);',
      '  n = n / 2;',
      '}',
      'while (!vacia(bits)) {',
      '  printf("%d", desapilar(&bits));',
      '}'
    )
  ),
  usarPila(
    3,
    'mostrando los restos sin la pila',
    MAIN_PILA(
      'TPila bits;',
      'int n;',
      '',
      'inicializar(&bits);',
      'scanf("%d", &n);',
      'while (n > 0) {',
      '  apilar(&bits, n % 2);',
      '  printf("%d", n % 2);',
      '  n = n / 2;',
      '}'
    ),
    ['TAD_OPERACION_SIN_USAR']
  ),
  usarPila(
    3,
    'tocando el tope',
    MAIN_PILA(
      'TPila bits;',
      'int n;',
      '',
      'inicializar(&bits);',
      'scanf("%d", &n);',
      'while (n > 0) {',
      '  apilar(&bits, n % 2);',
      '  n = n / 2;',
      '}',
      'while (bits.tope > 0) {',
      '  printf("%d", desapilar(&bits));',
      '}'
    ),
    ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR']
  ),
  // ---- 4: pasar de una pila a otra ----
  usarPila(
    4,
    'pasando con una variable',
    MAIN_PILA(
      'TPila a;',
      'TPila b;',
      'int n;',
      '',
      'inicializar(&a);',
      'inicializar(&b);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  apilar(&a, n);',
      '}',
      'while (!vacia(a)) {',
      '  n = desapilar(&a);',
      '  apilar(&b, n);',
      '}',
      'while (!vacia(b)) {',
      '  printf("%d ", desapilar(&b));',
      '}'
    )
  ),
  usarPila(
    4,
    'pasando sin variable',
    MAIN_PILA(
      'TPila a;',
      'TPila b;',
      'int n;',
      '',
      'inicializar(&a);',
      'inicializar(&b);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  apilar(&a, n);',
      '}',
      'while (!vacia(a)) {',
      '  apilar(&b, desapilar(&a));',
      '}',
      'while (!vacia(b)) {',
      '  printf("%d ", desapilar(&b));',
      '}'
    )
  ),
  usarPila(
    4,
    'mostrando los de la primera pila',
    MAIN_PILA(
      'TPila a;',
      'TPila b;',
      'int n;',
      '',
      'inicializar(&a);',
      'inicializar(&b);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  apilar(&a, n);',
      '}',
      'while (!vacia(a)) {',
      '  printf("%d ", desapilar(&a));',
      '}'
    ),
    ['MUESTRA_DISTINTA']
  ),
  usarPila(
    4,
    'sin inicializar la segunda pila',
    MAIN_PILA(
      'TPila a;',
      'TPila b;',
      'int n;',
      '',
      'inicializar(&a);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  apilar(&a, n);',
      '}',
      'while (!vacia(a)) {',
      '  apilar(&b, desapilar(&a));',
      '}',
      'while (!vacia(b)) {',
      '  printf("%d ", desapilar(&b));',
      '}'
    ),
    ['TAD_SIN_INICIALIZAR'],
    { dice: ['inicializar'] }
  ),

  // ===== Escribir pila.h =====
  // ---- 1: donde se define MAX ----
  pilaH(1, 'se define antes del tipo', '1'),
  pilaH(1, 'vale cero', '0', ['OPCION_MAX_VALE_CERO']),
  pilaH(1, 'ya esta definido', '2', ['OPCION_MAX_YA_DEFINIDO']),
  // ---- 2: el archivo de la pila ----
  pilaH(2, 'completo', PILA_H),
  pilaH(2, 'sin guardas', HP((t) => t.replace('#ifndef PILA_H\n#define PILA_H\n\n', '').replace('\n\n#endif', '')), ['ENCABEZADO_SIN_GUARDA']),
  pilaH(2, 'con otro nombre de guarda', HP((t) => t.replaceAll('PILA_H', 'PILA')), ['ENCABEZADO_GUARDA_NOMBRE'], { dice: ['PILA_H'] }),
  pilaH(2, 'el tamano con un numero', HP((t) => t.replace('datos[MAX]', 'datos[8]')), ['CAMPO_ARREGLO_SIN_CONSTANTE'], { dice: ['MAX'] }),
  pilaH(2, 'sin definir MAX', HP((t) => t.replace('#define MAX 8\n\n', '')), ['CONSTANTE_SIN_DEFINIR']),
  pilaH(2, 'MAX de menos', HP((t) => t.replace('#define MAX 8', '#define MAX 4')), ['ARREGLO_CHICO']),
  pilaH(2, 'MAX de mas', HP((t) => t.replace('#define MAX 8', '#define MAX 16')), ['ARREGLO_GRANDE']),
  pilaH(2, 'datos no es un arreglo', HP((t) => t.replace('int datos[MAX];', 'int datos;')), ['CAMPO_NO_ES_ARREGLO']),
  pilaH(2, 'datos es una tabla', HP((t) => t.replace('int datos[MAX];', 'int datos[MAX][2];')), ['CAMPO_ARREGLO_DIMENSIONES']),
  pilaH(2, 'datos de otro tipo', HP((t) => t.replace('int datos[MAX];', 'float datos[MAX];')), ['CAMPO_TIPO']),
  pilaH(2, 'sin el tope', HP((t) => t.replace('  int tope;\n', '')), ['CAMPO_FALTA']),
  pilaH(2, 'el tope con otro nombre', HP((t) => t.replace('int tope;', 'int cantidad;')), ['CAMPO_FALTA']),
  pilaH(2, 'sin el enumerado', HP((t) => t.replace('typedef enum {\n  FALSO,\n  VERDADERO\n} TBool;\n\n', '').replaceAll('TBool', 'int')), ['ENUM_FALTA']),
  pilaH(2, 'el enumerado al reves', HP((t) => t.replace('  FALSO,\n  VERDADERO', '  VERDADERO,\n  FALSO')), ['ENUMERADOR_ORDEN']),
  pilaH(2, 'vacia devuelve un entero', HP((t) => t.replace('TBool vacia(TPila p);', 'int vacia(TPila p);')), ['FUNCION_TIPO_RETORNO'], { dice: ['un enumerado'] }),
  pilaH(2, 'llena devuelve un entero', HP((t) => t.replace('TBool llena(TPila p);', 'int llena(TPila p);')), ['FUNCION_TIPO_RETORNO'], { dice: ['un enumerado'] }),
  pilaH(2, 'con el cuerpo de una funcion', HP((t) => t.replace('TBool llena(TPila p);', 'TBool llena(TPila p) {\n  return VERDADERO;\n}')), ['ENCABEZADO_CON_CUERPO', 'PROTOTIPO_FALTA']),
  pilaH(2, 'con algo afuera', HP((t) => t + '\n\nvoid vaciar(TPila *p);'), ['ENCABEZADO_FUERA_DE_LA_GUARDA']),
  pilaH(2, 'sin un prototipo', HP((t) => t.replace('TBool llena(TPila p);\n', '')), ['PROTOTIPO_FALTA']),
  pilaH(2, 'apilar sin el numero', HP((t) => t.replace('void apilar(TPila *p, int x);', 'void apilar(TPila *p);')), ['PARAMETROS_CANTIDAD']),
  pilaH(2, 'apilar con la pila por valor', HP((t) => t.replace('void apilar(TPila *p, int x);', 'void apilar(TPila p, int x);')), ['PARAMETRO_REFERENCIA_FALTA']),
  pilaH(2, 'desapilar no devuelve nada', HP((t) => t.replace('int desapilar(TPila *p);', 'void desapilar(TPila *p);')), ['FUNCION_TIPO_RETORNO']),
  pilaH(2, 'vacia con la pila por referencia', HP((t) => t.replace('TBool vacia(TPila p);', 'TBool vacia(TPila *p);')), ['PARAMETRO_ASTERISCO_DE_MAS']),

  // ===== Escribir pila.c =====
  pilaC(1, 'completa', PILA_C),
  pilaC(1, 'desapilar con otra cuenta', PILA_C.replace('p->tope = p->tope - 1;', 'p->tope--;')),
  pilaC(1, 'sin incluir el encabezado', PILA_C.replace('#include "pila.h"\n\n', ''), ['INCLUDE_PROPIO_FALTA']),
  pilaC(1, 'repitiendo el tipo', PILA_C.replace('#include "pila.h"\n', '#include "pila.h"\n\ntypedef struct {\n  int datos[MAX];\n  int tope;\n} TPila;\n'), ['TIPO_REPETIDO_EN_EL_C']),
  pilaC(
    1,
    'sin definir una operacion',
    PILA_C.replace('\n\nTBool llena(TPila p) {\n  if (p.tope == MAX) {\n    return VERDADERO;\n  }\n  return FALSO;\n}', ''),
    ['PROTOTIPO_SIN_DEFINICION']
  ),
  pilaC(
    1,
    'vacia devuelve numeros',
    PILA_C.replace('if (p.tope == 0) {\n    return VERDADERO;\n  }\n  return FALSO;', 'if (p.tope == 0) {\n    return 1;\n  }\n  return 0;'),
    ['RETORNO_NUMERO_EN_ENUMERADO']
  ),
  pilaC(
    1,
    'llena devuelve numeros',
    PILA_C.replace('if (p.tope == MAX) {\n    return VERDADERO;\n  }\n  return FALSO;', 'if (p.tope == MAX) {\n    return 1;\n  }\n  return 0;'),
    ['RETORNO_NUMERO_EN_ENUMERADO']
  ),
  pilaC(
    1,
    'vacia con un return directo',
    PILA_C.replace('if (p.tope == 0) {\n    return VERDADERO;\n  }\n  return FALSO;', 'return p.tope == 0;')
  ),
  pilaC(1, 'apilar con otra firma', PILA_C.replace('void apilar(TPila *p, int x) {', 'int apilar(TPila *p, int x) {'), ['FIRMA_DISTINTA_DEL_PROTOTIPO']),
  pilaC(1, 'inicializar no deja el tope en cero', PILA_C.replace('  p->tope = 0;\n', ''), ['VARIABLE_SIN_VALOR']),
  pilaC(
    1,
    'apilar sin sumar al tope',
    PILA_C.replace('  p->tope = p->tope + 1;\n', ''),
    ['DEVUELVE_DISTINTO']
  ),
  pilaC(
    1,
    'desapilar devuelve el de abajo',
    PILA_C.replace('  return p->datos[p->tope];', '  return p->datos[0];'),
    ['DEVUELVE_DISTINTO']
  ),
  pilaC(1, 'cima devuelve la posicion del tope', PILA_C.replace('return p.datos[p.tope - 1];', 'return p.datos[p.tope];'), ['VARIABLE_SIN_VALOR'], { dice: ['`p.datos[2]`'] }),
  pilaC(1, 'llena con la pila a medias', PILA_C.replace('if (p.tope == MAX) {', 'if (p.tope == MAX - 1) {'), ['DEVUELVE_DISTINTO']),
  pilaC(1, 'vacia al reves', PILA_C.replace('if (p.tope == 0) {', 'if (p.tope != 0) {'), ['DEVUELVE_DISTINTO']),
  // ===== Cambiar la representacion =====
  repr(1, 'solo el .c', '1'),
  repr(1, 'solo el main', '2', ['OPCION_REPR_SOLO_MAIN']),
  repr(1, 'solo el .h', '0', ['OPCION_REPR_SOLO_H']),
  repr(2, 'con el tope en -1', REPR_C),
  repr(2, 'con otra cuenta al desapilar', REPR_C.replace('  x = p->datos[p->tope];\n  p->tope = p->tope - 1;\n  return x;', '  x = p->datos[p->tope];\n  p->tope--;\n  return x;')),
  repr(2, 'con la cuenta de antes (el tope cuenta elementos)', PILA_C, ['DEVUELVE_DISTINTO'], { dice: ['p.tope'] }),
  repr(2, 'inicializar deja el tope en cero', REPR_C.replace('p->tope = -1;', 'p->tope = 0;'), ['DEVUELVE_DISTINTO']),
  repr(2, 'vacia sigue mirando el cero', REPR_C.replace('if (p.tope == -1) {', 'if (p.tope == 0) {'), ['DEVUELVE_DISTINTO']),
  repr(2, 'llena sigue mirando MAX', REPR_C.replace('if (p.tope == MAX - 1) {', 'if (p.tope == MAX) {'), ['DEVUELVE_DISTINTO']),
  repr(2, 'cima devuelve la posicion de abajo', REPR_C.replace('return p.datos[p.tope];', 'return p.datos[p.tope - 1];'), ['DEVUELVE_DISTINTO']),
  repr(2, 'vacia devuelve numeros', REPR_C.replace('if (p.tope == -1) {\n    return VERDADERO;\n  }\n  return FALSO;', 'if (p.tope == -1) {\n    return 1;\n  }\n  return 0;'), ['RETORNO_NUMERO_EN_ENUMERADO']),
  repr(2, 'sin incluir el encabezado', REPR_C.replace('#include "pila.h"\n\n', ''), ['INCLUDE_PROPIO_FALTA']),
  repr(2, 'repitiendo el tipo', REPR_C.replace('#include "pila.h"\n', '#include "pila.h"\n\ntypedef struct {\n  int datos[MAX];\n  int tope;\n} TPila;\n'), ['TIPO_REPETIDO_EN_EL_C']),
  // ===== Un TAD completo: la fecha (tres archivos encadenados) =====
  fecha(1, 'el .h correcto', FECHA_H),
  fecha(1, 'el .h sin las guardas', FECHA_H.replace('#ifndef FECHA_H\n#define FECHA_H\n\n', '').replace('\n\n#endif', ''), ['ENCABEZADO_SIN_GUARDA']),
  fecha(1, 'diasDelMes sin el anio', FECHA_H.replace('int diasDelMes(int mes, int anio);', 'int diasDelMes(int mes);'), ['PARAMETROS_CANTIDAD']),
  fecha(1, 'sumarDias sin la cantidad', FECHA_H.replace('TFecha sumarDias(TFecha f, int n);', 'TFecha sumarDias(TFecha f);'), ['PARAMETROS_CANTIDAD']),
  fecha(1, 'sin mostrar', FECHA_H.replace('void mostrar(TFecha f);\n', ''), ['PROTOTIPO_FALTA']),
  fecha(2, 'el .c correcto', FECHA_C),
  fecha(2, 'sin incluir el encabezado', FECHA_C.replace('#include "fecha.h"\n', ''), ['INCLUDE_PROPIO_FALTA']),
  fecha(2, 'repitiendo el tipo', FECHA_C.replace('#include "fecha.h"\n', '#include "fecha.h"\n\ntypedef struct {\n  int dia;\n  int mes;\n  int anio;\n} TFecha;\n'), ['TIPO_REPETIDO_EN_EL_C']),
  fecha(2, 'bisiesto solo por multiplo de 4', FECHA_C.replace('(anio % 4 == 0 && anio % 100 != 0) || anio % 400 == 0', 'anio % 4 == 0'), ['DEVUELVE_DISTINTO']),
  fecha(2, 'sumarDias que no cambia de anio', FECHA_C.replace('        f.anio = f.anio + 1;\n', ''), ['DEVUELVE_DISTINTO']),
  fecha(2, 'sumarDias que no pasa al mes siguiente', FECHA_C.replace('      f.mes = f.mes + 1;\n', ''), ['DEVUELVE_DISTINTO']),
  fecha(2, 'mostrar con otro formato', FECHA_C.replace('"%d/%d/%d"', '"%d-%d-%d"'), ['MUESTRA_DISTINTA']),
  fecha(3, 'el main correcto', FECHA_MAIN),
  fecha(3, 'el main que arma la fecha a mano', FECHA_MAIN.replace('f = crear(dia, mes, anio);', 'f.dia = dia;\n  f.mes = mes;\n  f.anio = anio;'), ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR']),
  fecha(3, 'el main sin sumar dias', FECHA_MAIN.replace('  f = sumarDias(f, n);\n', ''), ['TAD_OPERACION_SIN_USAR']),
];
