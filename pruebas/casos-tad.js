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
const ampliar = serie('tad-ampliar');
const usarCola = serie('tad-cola-usar');
const colaH = serie('tad-cola-h');
const colaC = serie('tad-cola-c');
const punto = serie('tad-punto');
const puntoUsar = serie('tad-punto-usar');
const cuenta = serie('tad-cuenta');
const cuentaUsar = serie('tad-cuenta-usar');
const conjunto = serie('tad-conjunto');
const conjuntoUsar = serie('tad-conjunto-usar');
const conjuntoAmpliar = serie('tad-conjunto-ampliar');
const conjuntoCompletar = serie('tad-conjunto-completar');
const conjuntoRepr = serie('tad-conjunto-representacion');
const tadLista = serie('tad-lista');
const tadListaAmpliar = serie('tad-lista-ampliar');
const tadListaUsar = serie('tad-lista-usar');

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

// main.c de las colas con lo que va adentro de main.
const MAIN_COLA = (...cuerpo) =>
  lineas('#include <stdio.h>', '#include "cola.h"', '', 'int main() {', ...cuerpo.map((l) => (l ? '  ' + l : l)), '  return 0;', '}');

const COLA_H = lineas(
  '#ifndef COLA_H',
  '#define COLA_H',
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
  '  int inicio;',
  '  int fin;',
  '} TCola;',
  '',
  'void inicializar(TCola *c);',
  'void encolar(TCola *c, int x);',
  'int desencolar(TCola *c);',
  'int primero(TCola c);',
  'TBool vacia(TCola c);',
  'TBool llena(TCola c);',
  '',
  '#endif'
);
const HC = (cambio) => cambio(COLA_H);

const COLA_C = lineas(
  '#include "cola.h"',
  '',
  'void inicializar(TCola *c) {',
  '  c->inicio = 0;',
  '  c->fin = 0;',
  '}',
  '',
  'void encolar(TCola *c, int x) {',
  '  c->datos[c->fin] = x;',
  '  c->fin = c->fin + 1;',
  '}',
  '',
  'int desencolar(TCola *c) {',
  '  int x;',
  '',
  '  x = c->datos[c->inicio];',
  '  c->inicio = c->inicio + 1;',
  '  return x;',
  '}',
  '',
  'int primero(TCola c) {',
  '  return c.datos[c.inicio];',
  '}',
  '',
  'TBool vacia(TCola c) {',
  '  if (c.inicio == c.fin) {',
  '    return VERDADERO;',
  '  }',
  '  return FALSO;',
  '}',
  '',
  'TBool llena(TCola c) {',
  '  if (c.fin == MAX) {',
  '    return VERDADERO;',
  '  }',
  '  return FALSO;',
  '}'
);

const PUNTO_H = lineas(
  '#ifndef PUNTO_H',
  '#define PUNTO_H',
  '',
  'typedef struct {',
  '  double x;',
  '  double y;',
  '} TPunto;',
  '',
  'TPunto crear(double x, double y);',
  'TPunto origen();',
  'double distancia(TPunto a, TPunto b);',
  'TPunto puntoMedio(TPunto a, TPunto b);',
  'void mostrar(TPunto p);',
  '',
  '#endif'
);
const HPU = (cambio) => cambio(PUNTO_H);

const PUNTO_C = lineas(
  '#include <stdio.h>',
  '#include <math.h>',
  '#include "punto.h"',
  '',
  'TPunto crear(double x, double y) {',
  '  TPunto p;',
  '',
  '  p.x = x;',
  '  p.y = y;',
  '  return p;',
  '}',
  '',
  'TPunto origen() {',
  '  return crear(0, 0);',
  '}',
  '',
  'double distancia(TPunto a, TPunto b) {',
  '  double dx = a.x - b.x;',
  '  double dy = a.y - b.y;',
  '',
  '  return sqrt(dx * dx + dy * dy);',
  '}',
  '',
  'TPunto puntoMedio(TPunto a, TPunto b) {',
  '  return crear((a.x + b.x) / 2, (a.y + b.y) / 2);',
  '}',
  '',
  'void mostrar(TPunto p) {',
  '  printf("(%.2f, %.2f)", p.x, p.y);',
  '}'
);

// main.c del punto con lo que va adentro de main (el arreglo y la lectura ya estan).
const MAIN_PUNTO = (...cuerpo) =>
  lineas(
    '#include <stdio.h>',
    '#include "punto.h"',
    '',
    '#define MAX 10',
    '',
    'int main() {',
    '  TPunto pts[MAX];',
    '  double x, y;',
    '  int n;',
    '',
    '  scanf("%d", &n);',
    '  for (int i = 0; i < n; i++) {',
    '    scanf("%lf", &x);',
    '    scanf("%lf", &y);',
    '    pts[i] = crear(x, y);',
    '  }',
    ...cuerpo.map((l) => (l ? '  ' + l : l)),
    '  return 0;',
    '}'
  );
const PUNTO_MAIN = MAIN_PUNTO(
  'TPunto masLejano = pts[0];',
  '',
  'for (int i = 1; i < n; i++) {',
  '  if (distancia(pts[i], origen()) > distancia(masLejano, origen())) {',
  '    masLejano = pts[i];',
  '  }',
  '}',
  'mostrar(masLejano);'
);

// Serie "Usar el punto con un arreglo": main.c con las declaraciones y lo que sigue a la lectura.
const MAIN_PU = (decl, despues) =>
  lineas(
    '#include <stdio.h>',
    '#include "punto.h"',
    '',
    '#define MAX 10',
    '',
    'int main() {',
    '  TPunto pts[MAX];',
    ...decl.map((l) => '  ' + l),
    '',
    '  scanf("%d", &n);',
    '  for (int i = 0; i < n; i++) {',
    '    scanf("%lf", &x);',
    '    scanf("%lf", &y);',
    '    pts[i] = crear(x, y);',
    '  }',
    ...despues.map((l) => (l ? '  ' + l : l)),
    '  return 0;',
    '}'
  );
const PERIMETRO = MAIN_PU(
  ['double x, y;', 'double total = 0;', 'int n;'],
  ['for (int i = 0; i < n - 1; i++) {', '  total = total + distancia(pts[i], pts[i + 1]);', '}', 'printf("%.2f", total);']
);
const RADIO = MAIN_PU(
  ['double x, y, r;', 'int cantidad = 0;', 'int n;'],
  [
    'scanf("%lf", &r);',
    'for (int i = 0; i < n; i++) {',
    '  if (distancia(pts[i], origen()) <= r) {',
    '    cantidad++;',
    '  }',
    '}',
    'printf("%d", cantidad);',
  ]
);
const CERCANOS = MAIN_PU(
  ['double x, y;', 'double menor;', 'int a = 0;', 'int b = 1;', 'int n;'],
  [
    'menor = distancia(pts[0], pts[1]);',
    'for (int i = 0; i < n; i++) {',
    '  for (int j = i + 1; j < n; j++) {',
    '    if (distancia(pts[i], pts[j]) < menor) {',
    '      menor = distancia(pts[i], pts[j]);',
    '      a = i;',
    '      b = j;',
    '    }',
    '  }',
    '}',
    'mostrar(pts[a]);',
    'printf(" ");',
    'mostrar(pts[b]);',
    'printf(" %.2f", menor);',
  ]
);

// Serie de la cuenta bancaria.
const CUENTA_H = lineas(
  '#ifndef CUENTA_H',
  '#define CUENTA_H',
  '',
  'typedef enum {',
  '  OK,',
  '  SALDO_INSUFICIENTE',
  '} TResultado;',
  '',
  'typedef struct {',
  '  int numero;',
  '  double saldo;',
  '} TCuenta;',
  '',
  'TCuenta crear(int numero);',
  'void depositar(TCuenta *c, double monto);',
  'TResultado retirar(TCuenta *c, double monto);',
  'double obtenerSaldo(TCuenta c);',
  'int obtenerNumero(TCuenta c);',
  '',
  '#endif'
);
const HCU = (cambio) => cambio(CUENTA_H);

const CUENTA_C = lineas(
  '#include "cuenta.h"',
  '',
  'TCuenta crear(int numero) {',
  '  TCuenta c;',
  '',
  '  c.numero = numero;',
  '  c.saldo = 0;',
  '  return c;',
  '}',
  '',
  'void depositar(TCuenta *c, double monto) {',
  '  c->saldo = c->saldo + monto;',
  '}',
  '',
  'TResultado retirar(TCuenta *c, double monto) {',
  '  if (monto > c->saldo) {',
  '    return SALDO_INSUFICIENTE;',
  '  }',
  '  c->saldo = c->saldo - monto;',
  '  return OK;',
  '}',
  '',
  'double obtenerSaldo(TCuenta c) {',
  '  return c.saldo;',
  '}',
  '',
  'int obtenerNumero(TCuenta c) {',
  '  return c.numero;',
  '}'
);

const MAIN_MOV = lineas(
  '#include <stdio.h>',
  '#include "cuenta.h"',
  '',
  'int main() {',
  '  TCuenta c;',
  '  double monto;',
  '  int numero;',
  '  int tipo;',
  '  int n;',
  '',
  '  scanf("%d", &numero);',
  '  scanf("%d", &n);',
  '  c = crear(numero);',
  '  for (int i = 0; i < n; i++) {',
  '    scanf("%d", &tipo);',
  '    scanf("%lf", &monto);',
  '    if (tipo == 1) {',
  '      depositar(&c, monto);',
  '    } else {',
  '      if (retirar(&c, monto) == SALDO_INSUFICIENTE) {',
  '        printf("Saldo insuficiente\\n");',
  '      }',
  '    }',
  '  }',
  '  printf("Cuenta %d: %.2f", obtenerNumero(c), obtenerSaldo(c));',
  '  return 0;',
  '}'
);

const MAIN_TRANSF = lineas(
  '#include <stdio.h>',
  '#include "cuenta.h"',
  '',
  'int main() {',
  '  TCuenta origen;',
  '  TCuenta destino;',
  '  double saldo;',
  '  double monto;',
  '  int numero;',
  '',
  '  scanf("%d", &numero);',
  '  origen = crear(numero);',
  '  scanf("%lf", &saldo);',
  '  depositar(&origen, saldo);',
  '  scanf("%d", &numero);',
  '  destino = crear(numero);',
  '  scanf("%lf", &saldo);',
  '  depositar(&destino, saldo);',
  '  scanf("%lf", &monto);',
  '  if (retirar(&origen, monto) == OK) {',
  '    depositar(&destino, monto);',
  '    printf("Transferencia realizada\\n");',
  '  } else {',
  '    printf("Saldo insuficiente\\n");',
  '  }',
  '  printf("Cuenta %d: %.2f\\n", obtenerNumero(origen), obtenerSaldo(origen));',
  '  printf("Cuenta %d: %.2f", obtenerNumero(destino), obtenerSaldo(destino));',
  '  return 0;',
  '}'
);

// main.c de las consignas con un arreglo de cuentas: declaraciones, lectura y lo que sigue.
const MAIN_CUENTAS = (decl, despues) =>
  lineas(
    '#include <stdio.h>',
    '#include "cuenta.h"',
    '',
    '#define MAX 10',
    '',
    'int main() {',
    '  TCuenta cuentas[MAX];',
    '  double saldo;',
    ...decl.map((l) => '  ' + l),
    '  int numero;',
    '  int n;',
    '',
    '  scanf("%d", &n);',
    '  for (int i = 0; i < n; i++) {',
    '    scanf("%d", &numero);',
    '    scanf("%lf", &saldo);',
    '    cuentas[i] = crear(numero);',
    '    depositar(&cuentas[i], saldo);',
    '  }',
    ...despues.map((l) => (l ? '  ' + l : l)),
    '  return 0;',
    '}'
  );
const CUOTA_LEER = ['scanf("%lf", &cuota);'];
const CUOTA_COBRAR = [
  'for (int i = 0; i < n; i++) {',
  '  if (retirar(&cuentas[i], cuota) == OK) {',
  '    cobradas++;',
  '  } else {',
  '    printf("Cuenta %d no pudo pagar\\n", obtenerNumero(cuentas[i]));',
  '  }',
  '}',
  'printf("Cobradas: %d", cobradas);',
];
const MAIN_CUOTA = MAIN_CUENTAS(['double cuota;', 'int cobradas = 0;'], [...CUOTA_LEER, ...CUOTA_COBRAR]);
const MAIN_MAYOR = MAIN_CUENTAS(
  ['double total = 0;', 'int mayor = 0;'],
  [
    'for (int i = 0; i < n; i++) {',
    '  total = total + obtenerSaldo(cuentas[i]);',
    '  if (obtenerSaldo(cuentas[i]) > obtenerSaldo(cuentas[mayor])) {',
    '    mayor = i;',
    '  }',
    '}',
    'printf("Mayor: Cuenta %d\\n", obtenerNumero(cuentas[mayor]));',
    'printf("Total: %.2f", total);',
  ]
);

// Series del conjunto de enteros (los archivos tal como los dejan las referencias).
const CONJ_H = "#ifndef CONJUNTO_H\n#define CONJUNTO_H\n\n#define MAX 10\n\ntypedef enum {\n  FALSO,\n  VERDADERO\n} TBool;\n\ntypedef struct {\n  int elementos[MAX];\n  int cantidad;\n} TConjunto;\n\nvoid inicializar(TConjunto *c);\nvoid agregar(TConjunto *c, int x);\nTBool pertenece(TConjunto c, int x);\nint cardinal(TConjunto c);\n\n#endif";
const CONJ_C = "#include \"conjunto.h\"\n\nvoid inicializar(TConjunto *c) {\n  c->cantidad = 0;\n}\n\nTBool pertenece(TConjunto c, int x) {\n  for (int i = 0; i < c.cantidad; i++) {\n    if (c.elementos[i] == x) {\n      return VERDADERO;\n    }\n  }\n  return FALSO;\n}\n\nvoid agregar(TConjunto *c, int x) {\n  if (pertenece(*c, x) == FALSO) {\n    c->elementos[c->cantidad] = x;\n    c->cantidad = c->cantidad + 1;\n  }\n}\n\nint cardinal(TConjunto c) {\n  return c.cantidad;\n}";
const CONJ_MAIN = "#include <stdio.h>\n#include \"conjunto.h\"\n\nint main() {\n  TConjunto c;\n  int n;\n  int x;\n\n  inicializar(&c);\n  scanf(\"%d\", &n);\n  for (int i = 0; i < n; i++) {\n    scanf(\"%d\", &x);\n    agregar(&c, x);\n  }\n  printf(\"Distintos: %d\", cardinal(c));\n  return 0;\n}";
const CONJ_CONSULTAS = "#include <stdio.h>\n#include \"conjunto.h\"\n\nint main() {\n  TConjunto c;\n  int n;\n  int q;\n  int x;\n\n  inicializar(&c);\n  scanf(\"%d\", &n);\n  for (int i = 0; i < n; i++) {\n    scanf(\"%d\", &x);\n    agregar(&c, x);\n  }\n  scanf(\"%d\", &q);\n  for (int i = 0; i < q; i++) {\n    scanf(\"%d\", &x);\n    if (pertenece(c, x) == VERDADERO) {\n      printf(\"Pertenece\\n\");\n    } else {\n      printf(\"No pertenece\\n\");\n    }\n  }\n  return 0;\n}";
const CONJ_ORDENADOS = "#include <stdio.h>\n#include \"conjunto.h\"\n\nint main() {\n  TConjunto c;\n  int n;\n  int x;\n\n  inicializar(&c);\n  scanf(\"%d\", &n);\n  for (int i = 0; i < n; i++) {\n    scanf(\"%d\", &x);\n    agregar(&c, x);\n  }\n  for (int i = 1; i <= 20; i++) {\n    if (pertenece(c, i) == VERDADERO) {\n      printf(\"%d \", i);\n    }\n  }\n  return 0;\n}";
const CONJ_AMBOS = "#include <stdio.h>\n#include \"conjunto.h\"\n\nint main() {\n  TConjunto a;\n  TConjunto b;\n  int n;\n  int x;\n\n  inicializar(&a);\n  inicializar(&b);\n  scanf(\"%d\", &n);\n  for (int i = 0; i < n; i++) {\n    scanf(\"%d\", &x);\n    agregar(&a, x);\n  }\n  scanf(\"%d\", &n);\n  for (int i = 0; i < n; i++) {\n    scanf(\"%d\", &x);\n    agregar(&b, x);\n  }\n  for (int i = 1; i <= 20; i++) {\n    if (pertenece(a, i) == VERDADERO && pertenece(b, i) == VERDADERO) {\n      printf(\"%d \", i);\n    }\n  }\n  return 0;\n}";
const CONJ_H_AMPLIADO = "#ifndef CONJUNTO_H\n#define CONJUNTO_H\n\n#define MAX 10\n\ntypedef enum {\n  FALSO,\n  VERDADERO\n} TBool;\n\ntypedef struct {\n  int elementos[MAX];\n  int cantidad;\n} TConjunto;\n\nvoid inicializar(TConjunto *c);\nvoid agregar(TConjunto *c, int x);\nTBool pertenece(TConjunto c, int x);\nint cardinal(TConjunto c);\nvoid eliminar(TConjunto *c, int x);\nTConjunto unir(TConjunto a, TConjunto b);\n\n#endif";
const CONJ_C_AMPLIADO = "#include \"conjunto.h\"\n\nvoid inicializar(TConjunto *c) {\n  c->cantidad = 0;\n}\n\nTBool pertenece(TConjunto c, int x) {\n  for (int i = 0; i < c.cantidad; i++) {\n    if (c.elementos[i] == x) {\n      return VERDADERO;\n    }\n  }\n  return FALSO;\n}\n\nvoid agregar(TConjunto *c, int x) {\n  if (pertenece(*c, x) == FALSO) {\n    c->elementos[c->cantidad] = x;\n    c->cantidad = c->cantidad + 1;\n  }\n}\n\nint cardinal(TConjunto c) {\n  return c.cantidad;\n}\n\nvoid eliminar(TConjunto *c, int x) {\n  for (int i = 0; i < c->cantidad; i++) {\n    if (c->elementos[i] == x) {\n      c->elementos[i] = c->elementos[c->cantidad - 1];\n      c->cantidad = c->cantidad - 1;\n      return;\n    }\n  }\n}\n\nTConjunto unir(TConjunto a, TConjunto b) {\n  TConjunto r = a;\n\n  for (int i = 0; i < b.cantidad; i++) {\n    agregar(&r, b.elementos[i]);\n  }\n  return r;\n}";
const CONJ_MAIN_AMPLIADO = "#include <stdio.h>\n#include \"conjunto.h\"\n\nint main() {\n  TConjunto a;\n  TConjunto b;\n  TConjunto u;\n  int n;\n  int x;\n\n  inicializar(&a);\n  inicializar(&b);\n  scanf(\"%d\", &n);\n  for (int i = 0; i < n; i++) {\n    scanf(\"%d\", &x);\n    agregar(&a, x);\n  }\n  scanf(\"%d\", &n);\n  for (int i = 0; i < n; i++) {\n    scanf(\"%d\", &x);\n    agregar(&b, x);\n  }\n  u = unir(a, b);\n  scanf(\"%d\", &x);\n  eliminar(&u, x);\n  for (int i = 1; i <= 20; i++) {\n    if (pertenece(u, i) == VERDADERO) {\n      printf(\"%d \", i);\n    }\n  }\n  return 0;\n}";
const CONJ_H_COMPLETO = "#ifndef CONJUNTO_H\n#define CONJUNTO_H\n\n#define MAX 10\n\ntypedef enum {\n  FALSO,\n  VERDADERO\n} TBool;\n\ntypedef struct {\n  int elementos[MAX];\n  int cantidad;\n} TConjunto;\n\nvoid inicializar(TConjunto *c);\nvoid agregar(TConjunto *c, int x);\nTBool pertenece(TConjunto c, int x);\nint cardinal(TConjunto c);\nvoid eliminar(TConjunto *c, int x);\nTConjunto unir(TConjunto a, TConjunto b);\nTConjunto intersectar(TConjunto a, TConjunto b);\nTConjunto restar(TConjunto a, TConjunto b);\n\n#endif";
const CONJ_C_COMPLETO = "#include \"conjunto.h\"\n\nvoid inicializar(TConjunto *c) {\n  c->cantidad = 0;\n}\n\nTBool pertenece(TConjunto c, int x) {\n  for (int i = 0; i < c.cantidad; i++) {\n    if (c.elementos[i] == x) {\n      return VERDADERO;\n    }\n  }\n  return FALSO;\n}\n\nvoid agregar(TConjunto *c, int x) {\n  if (pertenece(*c, x) == FALSO) {\n    c->elementos[c->cantidad] = x;\n    c->cantidad = c->cantidad + 1;\n  }\n}\n\nint cardinal(TConjunto c) {\n  return c.cantidad;\n}\n\nvoid eliminar(TConjunto *c, int x) {\n  for (int i = 0; i < c->cantidad; i++) {\n    if (c->elementos[i] == x) {\n      c->elementos[i] = c->elementos[c->cantidad - 1];\n      c->cantidad = c->cantidad - 1;\n      return;\n    }\n  }\n}\n\nTConjunto unir(TConjunto a, TConjunto b) {\n  TConjunto r = a;\n\n  for (int i = 0; i < b.cantidad; i++) {\n    agregar(&r, b.elementos[i]);\n  }\n  return r;\n}\n\nTConjunto intersectar(TConjunto a, TConjunto b) {\n  TConjunto r;\n\n  inicializar(&r);\n  for (int i = 0; i < a.cantidad; i++) {\n    if (pertenece(b, a.elementos[i]) == VERDADERO) {\n      agregar(&r, a.elementos[i]);\n    }\n  }\n  return r;\n}\n\nTConjunto restar(TConjunto a, TConjunto b) {\n  TConjunto r;\n\n  inicializar(&r);\n  for (int i = 0; i < a.cantidad; i++) {\n    if (pertenece(b, a.elementos[i]) == FALSO) {\n      agregar(&r, a.elementos[i]);\n    }\n  }\n  return r;\n}";
const CONJ_MAIN_COMPLETO = "#include <stdio.h>\n#include \"conjunto.h\"\n\nint main() {\n  TConjunto a;\n  TConjunto b;\n  TConjunto u;\n  TConjunto i;\n  TConjunto r;\n  int n;\n  int x;\n\n  inicializar(&a);\n  inicializar(&b);\n  scanf(\"%d\", &n);\n  for (int k = 0; k < n; k++) {\n    scanf(\"%d\", &x);\n    agregar(&a, x);\n  }\n  scanf(\"%d\", &n);\n  for (int k = 0; k < n; k++) {\n    scanf(\"%d\", &x);\n    agregar(&b, x);\n  }\n  u = unir(a, b);\n  i = intersectar(a, b);\n  r = restar(a, b);\n  for (int k = 1; k <= 20; k++) {\n    if (pertenece(u, k) == VERDADERO) {\n      printf(\"%d \", k);\n    }\n  }\n  printf(\"\\n\");\n  for (int k = 1; k <= 20; k++) {\n    if (pertenece(i, k) == VERDADERO) {\n      printf(\"%d \", k);\n    }\n  }\n  printf(\"\\n\");\n  for (int k = 1; k <= 20; k++) {\n    if (pertenece(r, k) == VERDADERO) {\n      printf(\"%d \", k);\n    }\n  }\n  return 0;\n}";

// Serie que cambia la representacion del conjunto (presencias, numeros de 0 a 20).
const REPR_H = "#ifndef CONJUNTO_H\n#define CONJUNTO_H\n\n#define TAM 21\n\ntypedef enum {\n  FALSO,\n  VERDADERO\n} TBool;\n\ntypedef struct {\n  TBool presente[TAM];\n  int cantidad;\n} TConjunto;\n\nvoid inicializar(TConjunto *c);\nvoid agregar(TConjunto *c, int x);\nTBool pertenece(TConjunto c, int x);\nint cardinal(TConjunto c);\nvoid eliminar(TConjunto *c, int x);\nTConjunto unir(TConjunto a, TConjunto b);\nTConjunto intersectar(TConjunto a, TConjunto b);\nTConjunto restar(TConjunto a, TConjunto b);\n\n#endif";
const REPR_C1 = "#include \"conjunto.h\"\n\nvoid inicializar(TConjunto *c) {\n  for (int i = 0; i < TAM; i++) {\n    c->presente[i] = FALSO;\n  }\n  c->cantidad = 0;\n}\n\nTBool pertenece(TConjunto c, int x) {\n  return c.presente[x];\n}\n\nvoid agregar(TConjunto *c, int x) {\n  if (c->presente[x] == FALSO) {\n    c->presente[x] = VERDADERO;\n    c->cantidad = c->cantidad + 1;\n  }\n}\n\nvoid eliminar(TConjunto *c, int x) {\n  if (c->presente[x] == VERDADERO) {\n    c->presente[x] = FALSO;\n    c->cantidad = c->cantidad - 1;\n  }\n}\n\nint cardinal(TConjunto c) {\n  return c.cantidad;\n}\n\nTConjunto unir(TConjunto a, TConjunto b) {\n  TConjunto r;\n\n  inicializar(&r);\n  return r;\n}\n\nTConjunto intersectar(TConjunto a, TConjunto b) {\n  TConjunto r;\n\n  inicializar(&r);\n  return r;\n}\n\nTConjunto restar(TConjunto a, TConjunto b) {\n  TConjunto r;\n\n  inicializar(&r);\n  return r;\n}";
const REPR_C2 = "#include \"conjunto.h\"\n\nvoid inicializar(TConjunto *c) {\n  for (int i = 0; i < TAM; i++) {\n    c->presente[i] = FALSO;\n  }\n  c->cantidad = 0;\n}\n\nTBool pertenece(TConjunto c, int x) {\n  return c.presente[x];\n}\n\nvoid agregar(TConjunto *c, int x) {\n  if (c->presente[x] == FALSO) {\n    c->presente[x] = VERDADERO;\n    c->cantidad = c->cantidad + 1;\n  }\n}\n\nvoid eliminar(TConjunto *c, int x) {\n  if (c->presente[x] == VERDADERO) {\n    c->presente[x] = FALSO;\n    c->cantidad = c->cantidad - 1;\n  }\n}\n\nint cardinal(TConjunto c) {\n  return c.cantidad;\n}\n\nTConjunto unir(TConjunto a, TConjunto b) {\n  TConjunto r;\n\n  inicializar(&r);\n  for (int i = 0; i < TAM; i++) {\n    if (a.presente[i] == VERDADERO || b.presente[i] == VERDADERO) {\n      agregar(&r, i);\n    }\n  }\n  return r;\n}\n\nTConjunto intersectar(TConjunto a, TConjunto b) {\n  TConjunto r;\n\n  inicializar(&r);\n  for (int i = 0; i < TAM; i++) {\n    if (a.presente[i] == VERDADERO && b.presente[i] == VERDADERO) {\n      agregar(&r, i);\n    }\n  }\n  return r;\n}\n\nTConjunto restar(TConjunto a, TConjunto b) {\n  TConjunto r;\n\n  inicializar(&r);\n  for (int i = 0; i < TAM; i++) {\n    if (a.presente[i] == VERDADERO && b.presente[i] == FALSO) {\n      agregar(&r, i);\n    }\n  }\n  return r;\n}";

// Series de la lista de enteros (arreglo con posiciones).
const LISTA_H = "#ifndef LISTA_H\n#define LISTA_H\n\n#define MAX 10\n\ntypedef enum {\n  OK,\n  LISTA_LLENA,\n  POSICION_INVALIDA\n} TResultado;\n\ntypedef struct {\n  int elementos[MAX];\n  int cantidad;\n} TLista;\n\nvoid inicializar(TLista *l);\nint longitud(TLista l);\nint obtener(TLista l, int pos);\nTResultado insertar(TLista *l, int pos, int x);\n\n#endif";
const LISTA_C = "#include \"lista.h\"\n\nvoid inicializar(TLista *l) {\n  l->cantidad = 0;\n}\n\nint longitud(TLista l) {\n  return l.cantidad;\n}\n\nint obtener(TLista l, int pos) {\n  return l.elementos[pos];\n}\n\nTResultado insertar(TLista *l, int pos, int x) {\n  if (l->cantidad == MAX) {\n    return LISTA_LLENA;\n  }\n  if (pos < 0 || pos > l->cantidad) {\n    return POSICION_INVALIDA;\n  }\n  for (int i = l->cantidad; i > pos; i--) {\n    l->elementos[i] = l->elementos[i - 1];\n  }\n  l->elementos[pos] = x;\n  l->cantidad = l->cantidad + 1;\n  return OK;\n}";
const LISTA_MAIN = "#include <stdio.h>\n#include \"lista.h\"\n\nint main() {\n  TLista l;\n  int n;\n  int x;\n  int pos;\n\n  inicializar(&l);\n  scanf(\"%d\", &n);\n  for (int i = 0; i < n; i++) {\n    scanf(\"%d\", &x);\n    insertar(&l, longitud(l), x);\n  }\n  scanf(\"%d\", &pos);\n  scanf(\"%d\", &x);\n  if (insertar(&l, pos, x) == OK) {\n    for (int i = 0; i < longitud(l); i++) {\n      printf(\"%d \", obtener(l, i));\n    }\n  } else {\n    printf(\"No se pudo insertar\");\n  }\n  return 0;\n}";
const LISTA_H_AMPLIADO = "#ifndef LISTA_H\n#define LISTA_H\n\n#define MAX 10\n\ntypedef enum {\n  OK,\n  LISTA_LLENA,\n  POSICION_INVALIDA\n} TResultado;\n\ntypedef struct {\n  int elementos[MAX];\n  int cantidad;\n} TLista;\n\nvoid inicializar(TLista *l);\nint longitud(TLista l);\nint obtener(TLista l, int pos);\nTResultado insertar(TLista *l, int pos, int x);\nTResultado eliminar(TLista *l, int pos);\n\n#endif";
const LISTA_C_AMPLIADO = "#include \"lista.h\"\n\nvoid inicializar(TLista *l) {\n  l->cantidad = 0;\n}\n\nint longitud(TLista l) {\n  return l.cantidad;\n}\n\nint obtener(TLista l, int pos) {\n  return l.elementos[pos];\n}\n\nTResultado insertar(TLista *l, int pos, int x) {\n  if (l->cantidad == MAX) {\n    return LISTA_LLENA;\n  }\n  if (pos < 0 || pos > l->cantidad) {\n    return POSICION_INVALIDA;\n  }\n  for (int i = l->cantidad; i > pos; i--) {\n    l->elementos[i] = l->elementos[i - 1];\n  }\n  l->elementos[pos] = x;\n  l->cantidad = l->cantidad + 1;\n  return OK;\n}\n\nTResultado eliminar(TLista *l, int pos) {\n  if (pos < 0 || pos >= l->cantidad) {\n    return POSICION_INVALIDA;\n  }\n  for (int i = pos; i < l->cantidad - 1; i++) {\n    l->elementos[i] = l->elementos[i + 1];\n  }\n  l->cantidad = l->cantidad - 1;\n  return OK;\n}";
const LISTA_MAIN_INTERCAMBIAR = "#include <stdio.h>\n#include \"lista.h\"\n\nint main() {\n  TLista l;\n  int n;\n  int x;\n  int p;\n  int q;\n  int a;\n  int b;\n\n  inicializar(&l);\n  scanf(\"%d\", &n);\n  for (int i = 0; i < n; i++) {\n    scanf(\"%d\", &x);\n    insertar(&l, longitud(l), x);\n  }\n  scanf(\"%d\", &p);\n  scanf(\"%d\", &q);\n  a = obtener(l, p);\n  b = obtener(l, q);\n  eliminar(&l, p);\n  insertar(&l, p, b);\n  eliminar(&l, q);\n  insertar(&l, q, a);\n  for (int i = 0; i < longitud(l); i++) {\n    printf(\"%d \", obtener(l, i));\n  }\n  return 0;\n}";
const LISTA_INVERTIR = "#include <stdio.h>\n#include \"lista.h\"\n\nint main() {\n  TLista l;\n  int n;\n  int x;\n  int j;\n  int a;\n  int b;\n\n  inicializar(&l);\n  scanf(\"%d\", &n);\n  for (int i = 0; i < n; i++) {\n    scanf(\"%d\", &x);\n    insertar(&l, longitud(l), x);\n  }\n  for (int i = 0; i < longitud(l) / 2; i++) {\n    j = longitud(l) - 1 - i;\n    a = obtener(l, i);\n    b = obtener(l, j);\n    eliminar(&l, i);\n    insertar(&l, i, b);\n    eliminar(&l, j);\n    insertar(&l, j, a);\n  }\n  for (int i = 0; i < longitud(l); i++) {\n    printf(\"%d \", obtener(l, i));\n  }\n  return 0;\n}";
const LISTA_ORDENADO = "#include <stdio.h>\n#include \"lista.h\"\n\nint main() {\n  TLista l;\n  int n;\n  int x;\n  int pos;\n\n  inicializar(&l);\n  scanf(\"%d\", &n);\n  for (int i = 0; i < n; i++) {\n    scanf(\"%d\", &x);\n    pos = 0;\n    while (pos < longitud(l) && obtener(l, pos) <= x) {\n      pos = pos + 1;\n    }\n    insertar(&l, pos, x);\n  }\n  for (int i = 0; i < longitud(l); i++) {\n    printf(\"%d \", obtener(l, i));\n  }\n  return 0;\n}";
const LISTA_QUITAR = "#include <stdio.h>\n#include \"lista.h\"\n\nint main() {\n  TLista l;\n  int n;\n  int x;\n  int pos;\n\n  inicializar(&l);\n  scanf(\"%d\", &n);\n  for (int k = 0; k < n; k++) {\n    scanf(\"%d\", &x);\n    insertar(&l, longitud(l), x);\n  }\n  scanf(\"%d\", &x);\n  pos = 0;\n  while (pos < longitud(l)) {\n    if (obtener(l, pos) == x) {\n      eliminar(&l, pos);\n    } else {\n      pos = pos + 1;\n    }\n  }\n  for (int i = 0; i < longitud(l); i++) {\n    printf(\"%d \", obtener(l, i));\n  }\n  return 0;\n}";

const FECHA_H = lineas(
  '#ifndef FECHA_H',
  '#define FECHA_H',
  '',
  'typedef enum {',
  '  FALSO,',
  '  VERDADERO',
  '} TBool;',
  '',
  'typedef struct {',
  '  int dia;',
  '  int mes;',
  '  int anio;',
  '} TFecha;',
  '',
  'TFecha crear(int dia, int mes, int anio);',
  'TBool esBisiesto(TFecha f);',
  'int diasDelMes(TFecha f);',
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
  'TBool esBisiesto(TFecha f) {',
  '  if ((f.anio % 4 == 0 && f.anio % 100 != 0) || f.anio % 400 == 0) {',
  '    return VERDADERO;',
  '  }',
  '  return FALSO;',
  '}',
  '',
  'int diasDelMes(TFecha f) {',
  '  int dias;',
  '',
  '  if (f.mes == 2) {',
  '    if (esBisiesto(f) == VERDADERO) {',
  '      dias = 29;',
  '    } else {',
  '      dias = 28;',
  '    }',
  '  } else if (f.mes == 4 || f.mes == 6 || f.mes == 9 || f.mes == 11) {',
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
  '    if (f.dia > diasDelMes(f)) {',
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

// El .h y el .c de la fecha con sumarMeses y sumarAnios agregados.
const AMPLIADO_H = FECHA_H.replace(
  'void mostrar(TFecha f);',
  'TFecha sumarMeses(TFecha f, int n);\nTFecha sumarAnios(TFecha f, int n);\nvoid mostrar(TFecha f);'
);

const AMPLIADO_C = lineas(
  FECHA_C,
  '',
  'TFecha sumarMeses(TFecha f, int n) {',
  '  f.mes = f.mes + n;',
  '  while (f.mes > 12) {',
  '    f.mes = f.mes - 12;',
  '    f.anio = f.anio + 1;',
  '  }',
  '  if (f.dia > diasDelMes(f)) {',
  '    f.dia = diasDelMes(f);',
  '  }',
  '  return f;',
  '}',
  '',
  'TFecha sumarAnios(TFecha f, int n) {',
  '  f.anio = f.anio + n;',
  '  if (f.dia > diasDelMes(f)) {',
  '    f.dia = diasDelMes(f);',
  '  }',
  '  return f;',
  '}'
);

const AMPLIADO_MAIN = lineas(
  '#include <stdio.h>',
  '#include "fecha.h"',
  '',
  'int main() {',
  '  int dia, mes, anio, meses, anios;',
  '  TFecha f;',
  '',
  '  scanf("%d", &dia);',
  '  scanf("%d", &mes);',
  '  scanf("%d", &anio);',
  '  scanf("%d", &meses);',
  '  scanf("%d", &anios);',
  '  f = crear(dia, mes, anio);',
  '  f = sumarMeses(f, meses);',
  '  f = sumarAnios(f, anios);',
  '  mostrar(f);',
  '  return 0;',
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
  '  if (esBisiesto(f) == VERDADERO) {',
  '    printf("\\nbisiesto");',
  '  } else {',
  '    printf("\\nno bisiesto");',
  '  }',
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
  fecha(1, 'diasDelMes con enteros en vez de la fecha', FECHA_H.replace('int diasDelMes(TFecha f);', 'int diasDelMes(int mes, int anio);'), ['PARAMETROS_CANTIDAD']),
  fecha(1, 'sumarDias sin la cantidad', FECHA_H.replace('TFecha sumarDias(TFecha f, int n);', 'TFecha sumarDias(TFecha f);'), ['PARAMETROS_CANTIDAD']),
  fecha(1, 'sin mostrar', FECHA_H.replace('void mostrar(TFecha f);\n', ''), ['PROTOTIPO_FALTA']),
  fecha(2, 'el .c correcto', FECHA_C),
  fecha(2, 'sin incluir el encabezado', FECHA_C.replace('#include "fecha.h"\n', ''), ['INCLUDE_PROPIO_FALTA']),
  fecha(2, 'repitiendo el tipo', FECHA_C.replace('#include "fecha.h"\n', '#include "fecha.h"\n\ntypedef struct {\n  int dia;\n  int mes;\n  int anio;\n} TFecha;\n'), ['TIPO_REPETIDO_EN_EL_C']),
  fecha(2, 'bisiesto solo por multiplo de 4', FECHA_C.replace('(f.anio % 4 == 0 && f.anio % 100 != 0) || f.anio % 400 == 0', 'f.anio % 4 == 0'), ['DEVUELVE_DISTINTO']),
  fecha(2, 'sumarDias que no cambia de anio', FECHA_C.replace('        f.anio = f.anio + 1;\n', ''), ['DEVUELVE_DISTINTO']),
  fecha(2, 'sumarDias que no pasa al mes siguiente', FECHA_C.replace('      f.mes = f.mes + 1;\n', ''), ['DEVUELVE_DISTINTO']),
  fecha(2, 'mostrar con otro formato', FECHA_C.replace('"%d/%d/%d"', '"%d-%d-%d"'), ['MUESTRA_DISTINTA']),
  fecha(1, 'el .h sin el enumerado', FECHA_H.replace('typedef enum {\n  FALSO,\n  VERDADERO\n} TBool;\n\n', '').replace('TBool esBisiesto', 'int esBisiesto'), ['ENUM_FALTA']),
  fecha(1, 'el .h con el enumerado al reves', FECHA_H.replace('  FALSO,\n  VERDADERO', '  VERDADERO,\n  FALSO'), ['ENUMERADOR_ORDEN']),
  fecha(1, 'sin esBisiesto', FECHA_H.replace('TBool esBisiesto(TFecha f);\n', ''), ['PROTOTIPO_FALTA']),
  fecha(2, 'esBisiesto devuelve numeros', FECHA_C.replace('return VERDADERO;\n  }\n  return FALSO;', 'return 1;\n  }\n  return 0;'), ['RETORNO_NUMERO_EN_ENUMERADO']),
  fecha(2, 'esBisiesto sin la regla de los 400', FECHA_C.replace(' || f.anio % 400 == 0', ''), ['DEVUELVE_DISTINTO']),
  fecha(2, 'esBisiesto al reves', FECHA_C.replace('return VERDADERO;\n  }\n  return FALSO;', 'return FALSO;\n  }\n  return VERDADERO;'), ['DEVUELVE_DISTINTO']),
  fecha(3, 'el main correcto', FECHA_MAIN),
  fecha(3, 'el main que siempre dice bisiesto', FECHA_MAIN.replace('if (esBisiesto(f) == VERDADERO) {', 'if (f.anio > 0) {'), ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR']),
  fecha(3, 'el main sin preguntar si es bisiesto', FECHA_MAIN.replace(/  if \(esBisiesto[\s\S]*?  \}\n/, '  printf("\\nbisiesto");\n'), ['TAD_OPERACION_SIN_USAR']),
  fecha(3, 'el main que arma la fecha a mano', FECHA_MAIN.replace('f = crear(dia, mes, anio);', 'f.dia = dia;\n  f.mes = mes;\n  f.anio = anio;'), ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR']),
  fecha(3, 'el main sin sumar dias', FECHA_MAIN.replace('  f = sumarDias(f, n);\n', ''), ['TAD_OPERACION_SIN_USAR']),
  // ===== Ampliar el TAD (agregar operaciones a la fecha) =====
  ampliar(1, 'fecha.h y fecha.c', '2'),
  ampliar(1, 'solo el .h', '0', ['OPCION_AMPLIAR_SOLO_H']),
  ampliar(1, 'solo el .c', '1', ['OPCION_AMPLIAR_SOLO_C']),
  ampliar(1, 'los tres', '3', ['OPCION_AMPLIAR_LOS_TRES']),
  ampliar(2, 'el .h ampliado', AMPLIADO_H),
  ampliar(2, 'el .h sin tocar', FECHA_H, ['PROTOTIPO_FALTA']),
  ampliar(2, 'solo sumarMeses', AMPLIADO_H.replace('TFecha sumarAnios(TFecha f, int n);\n', ''), ['PROTOTIPO_FALTA']),
  ampliar(2, 'sumarAnios sin la cantidad', AMPLIADO_H.replace('TFecha sumarAnios(TFecha f, int n);', 'TFecha sumarAnios(TFecha f);'), ['PARAMETROS_CANTIDAD']),
  ampliar(2, 'los prototipos despues del endif', FECHA_H.replace('\n#endif', '\n#endif\n\nTFecha sumarMeses(TFecha f, int n);\nTFecha sumarAnios(TFecha f, int n);'), ['ENCABEZADO_FUERA_DE_LA_GUARDA']),
  ampliar(3, 'el .c ampliado', AMPLIADO_C),
  ampliar(3, 'sin las definiciones nuevas', FECHA_C, ['PROTOTIPO_SIN_DEFINICION']),
  ampliar(3, 'sumarMeses con if en vez de while', AMPLIADO_C.replace('while (f.mes > 12) {', 'if (f.mes > 12) {'), ['DEVUELVE_DISTINTO']),
  ampliar(3, 'sumarMeses sin ajustar el dia', AMPLIADO_C.replace('  f.mes = f.mes + n;\n  while (f.mes > 12) {\n    f.mes = f.mes - 12;\n    f.anio = f.anio + 1;\n  }\n  if (f.dia > diasDelMes(f)) {\n    f.dia = diasDelMes(f);\n  }', '  f.mes = f.mes + n;\n  while (f.mes > 12) {\n    f.mes = f.mes - 12;\n    f.anio = f.anio + 1;\n  }'), ['DEVUELVE_DISTINTO']),
  ampliar(3, 'sumarAnios sin ajustar el dia', AMPLIADO_C.replace('  f.anio = f.anio + n;\n  if (f.dia > diasDelMes(f)) {\n    f.dia = diasDelMes(f);\n  }', '  f.anio = f.anio + n;'), ['DEVUELVE_DISTINTO']),
  ampliar(3, 'rompiendo una operacion de antes', AMPLIADO_C.replace(' || f.anio % 400 == 0', ''), ['DEVUELVE_DISTINTO']),
  ampliar(3, 'sin incluir el encabezado', AMPLIADO_C.replace('#include "fecha.h"\n', ''), ['INCLUDE_PROPIO_FALTA']),
  ampliar(4, 'el main correcto', AMPLIADO_MAIN),
  ampliar(4, 'el main sin sumar anios', AMPLIADO_MAIN.replace('  f = sumarAnios(f, anios);\n', ''), ['TAD_OPERACION_SIN_USAR']),
  ampliar(4, 'el main que toca el mes', AMPLIADO_MAIN.replace('  f = sumarMeses(f, meses);', '  f = sumarMeses(f, meses);\n  f.mes = f.mes + 0;'), ['TAD_ACCESO_DIRECTO']),
  // ===== Usar una cola =====
  usarCola(1, 'sale primero lo que entro primero', '1'),
  usarCola(1, 'sale primero lo que entro ultimo', '0', ['OPCION_COLA_COMO_PILA']),
  usarCola(1, 'desencolar vacia la cola', '2', ['OPCION_COLA_SACA_TODO']),
  usarCola(
    2,
    'con dos ciclos',
    MAIN_COLA(
      'TCola c;',
      'int n;',
      '',
      'inicializar(&c);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  encolar(&c, n);',
      '}',
      'for (int i = 0; i < 3; i++) {',
      '  printf("%d ", desencolar(&c));',
      '}'
    )
  ),
  usarCola(
    2,
    'con un ciclo hasta que este vacia',
    MAIN_COLA(
      'TCola c;',
      'int n;',
      '',
      'inicializar(&c);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  encolar(&c, n);',
      '}',
      'while (!vacia(c)) {',
      '  printf("%d ", desencolar(&c));',
      '}'
    )
  ),
  usarCola(
    2,
    'mostrando sin sacar de la cola',
    MAIN_COLA(
      'TCola c;',
      'int n;',
      '',
      'inicializar(&c);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  encolar(&c, n);',
      '  printf("%d ", n);',
      '}'
    ),
    ['TAD_OPERACION_SIN_USAR'],
    { dice: ['desencolar'] }
  ),
  usarCola(
    2,
    'mirando los datos por dentro',
    MAIN_COLA(
      'TCola c;',
      'int n;',
      '',
      'inicializar(&c);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  encolar(&c, n);',
      '}',
      'for (int i = c.inicio; i < c.fin; i++) {',
      '  printf("%d ", c.datos[i]);',
      '}'
    ),
    ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR'],
    { dice: ['desencolar'] }
  ),
  usarCola(
    2,
    'sin inicializar la cola',
    MAIN_COLA(
      'TCola c;',
      'int n;',
      '',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  encolar(&c, n);',
      '}',
      'for (int i = 0; i < 3; i++) {',
      '  printf("%d ", desencolar(&c));',
      '}'
    ),
    ['TAD_OPERACION_SIN_USAR'],
    { dice: ['inicializar'] }
  ),
  usarCola(
    2,
    'encolando de mas',
    MAIN_COLA(
      'TCola c;',
      '',
      'inicializar(&c);',
      'for (int i = 0; i < 9; i++) {',
      '  encolar(&c, i);',
      '}',
      'while (!vacia(c)) {',
      '  printf("%d ", desencolar(&c));',
      '}'
    ),
    ['TAD_USO_INCORRECTO'],
    { dice: ['llena'] }
  ),
  usarCola(
    2,
    'desencolando de mas',
    MAIN_COLA(
      'TCola c;',
      '',
      'inicializar(&c);',
      'encolar(&c, 1);',
      'encolar(&c, 2);',
      'for (int i = 0; i < 3; i++) {',
      '  printf("%d ", desencolar(&c));',
      '}'
    ),
    ['TAD_USO_INCORRECTO'],
    { dice: ['vacia'] }
  ),
  usarCola(
    2,
    'sin incluir el encabezado',
    lineas('#include <stdio.h>', '', 'int main() {', '  TCola c;', '', '  inicializar(&c);', '  encolar(&c, 1);', '  printf("%d", desencolar(&c));', '  return 0;', '}'),
    ['INCLUDE_PROPIO_FALTA']
  ),
  // ---- 3: solo los pares ----
  usarCola(
    3,
    'guardando solo los pares',
    MAIN_COLA(
      'TCola pares;',
      'int n;',
      '',
      'inicializar(&pares);',
      'for (int i = 0; i < 5; i++) {',
      '  scanf("%d", &n);',
      '  if (n % 2 == 0) {',
      '    encolar(&pares, n);',
      '  }',
      '}',
      'while (!vacia(pares)) {',
      '  printf("%d ", desencolar(&pares));',
      '}'
    )
  ),
  usarCola(
    3,
    'guardando todos',
    MAIN_COLA(
      'TCola c;',
      'int n;',
      '',
      'inicializar(&c);',
      'for (int i = 0; i < 5; i++) {',
      '  scanf("%d", &n);',
      '  encolar(&c, n);',
      '}',
      'while (!vacia(c)) {',
      '  printf("%d ", desencolar(&c));',
      '}'
    ),
    ['MUESTRA_DISTINTA']
  ),
  usarCola(
    3,
    'guardando los impares',
    MAIN_COLA(
      'TCola c;',
      'int n;',
      '',
      'inicializar(&c);',
      'for (int i = 0; i < 5; i++) {',
      '  scanf("%d", &n);',
      '  if (n % 2 != 0) {',
      '    encolar(&c, n);',
      '  }',
      '}',
      'while (!vacia(c)) {',
      '  printf("%d ", desencolar(&c));',
      '}'
    ),
    ['MUESTRA_DISTINTA']
  ),
  // ---- 4: pasar de una cola a otra ----
  usarCola(
    4,
    'pasando con una variable',
    MAIN_COLA(
      'TCola a;',
      'TCola b;',
      'int n;',
      '',
      'inicializar(&a);',
      'inicializar(&b);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  encolar(&a, n);',
      '}',
      'while (!vacia(a)) {',
      '  n = desencolar(&a);',
      '  encolar(&b, 2 * n);',
      '}',
      'while (!vacia(b)) {',
      '  printf("%d ", desencolar(&b));',
      '}'
    )
  ),
  usarCola(
    4,
    'pasando sin variable',
    MAIN_COLA(
      'TCola a;',
      'TCola b;',
      'int n;',
      '',
      'inicializar(&a);',
      'inicializar(&b);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  encolar(&a, n);',
      '}',
      'while (!vacia(a)) {',
      '  encolar(&b, 2 * desencolar(&a));',
      '}',
      'while (!vacia(b)) {',
      '  printf("%d ", desencolar(&b));',
      '}'
    )
  ),
  usarCola(
    4,
    'sin inicializar la segunda cola',
    MAIN_COLA(
      'TCola a;',
      'TCola b;',
      'int n;',
      '',
      'inicializar(&a);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  encolar(&a, n);',
      '}',
      'while (!vacia(a)) {',
      '  encolar(&b, desencolar(&a));',
      '}',
      'while (!vacia(b)) {',
      '  printf("%d ", desencolar(&b));',
      '}'
    ),
    ['TAD_SIN_INICIALIZAR'],
    { dice: ['inicializar'] }
  ),
  usarCola(
    4,
    'mostrando los de la primera cola',
    MAIN_COLA(
      'TCola a;',
      'TCola b;',
      'int n;',
      '',
      'inicializar(&a);',
      'inicializar(&b);',
      'for (int i = 0; i < 3; i++) {',
      '  scanf("%d", &n);',
      '  encolar(&a, n);',
      '}',
      'while (!vacia(a)) {',
      '  printf("%d ", desencolar(&a));',
      '}'
    ),
    ['MUESTRA_DISTINTA']
  ),
  // ===== Escribir cola.h =====
  colaH(1, 'inicio 1 y fin 3', '1'),
  colaH(1, 'inicio 0 y fin 3', '0', ['OPCION_COLA_INICIO_CERO']),
  colaH(1, 'inicio 1 y fin 2', '2', ['OPCION_COLA_FIN_DE_MENOS']),
  colaH(2, 'completo', COLA_H),
  colaH(2, 'sin guardas', HC((t) => t.replace('#ifndef COLA_H\n#define COLA_H\n\n', '').replace('\n\n#endif', '')), ['ENCABEZADO_SIN_GUARDA']),
  colaH(2, 'con otro nombre de guarda', HC((t) => t.replaceAll('COLA_H', 'COLA')), ['ENCABEZADO_GUARDA_NOMBRE'], { dice: ['COLA_H'] }),
  colaH(2, 'el tamano con un numero', HC((t) => t.replace('datos[MAX]', 'datos[8]')), ['CAMPO_ARREGLO_SIN_CONSTANTE'], { dice: ['MAX'] }),
  colaH(2, 'sin definir MAX', HC((t) => t.replace('#define MAX 8\n\n', '')), ['CONSTANTE_SIN_DEFINIR']),
  colaH(2, 'MAX de menos', HC((t) => t.replace('#define MAX 8', '#define MAX 4')), ['ARREGLO_CHICO']),
  colaH(2, 'sin el inicio', HC((t) => t.replace('  int inicio;\n', '')), ['CAMPO_FALTA']),
  colaH(2, 'sin el fin', HC((t) => t.replace('  int fin;\n', '')), ['CAMPO_FALTA']),
  colaH(2, 'el fin con otro nombre', HC((t) => t.replace('int fin;', 'int final;')), ['CAMPO_NOMBRE']),
  colaH(2, 'con un solo indice', HC((t) => t.replace('  int inicio;\n  int fin;', '  int tope;')), ['CAMPO_FALTA']),
  colaH(2, 'sin el enumerado', HC((t) => t.replace('typedef enum {\n  FALSO,\n  VERDADERO\n} TBool;\n\n', '').replaceAll('TBool', 'int')), ['ENUM_FALTA']),
  colaH(2, 'vacia devuelve un entero', HC((t) => t.replace('TBool vacia(TCola c);', 'int vacia(TCola c);')), ['FUNCION_TIPO_RETORNO'], { dice: ['un enumerado'] }),
  colaH(2, 'con algo afuera', HC((t) => t + '\n\nvoid vaciar(TCola *c);'), ['ENCABEZADO_FUERA_DE_LA_GUARDA']),
  colaH(2, 'sin un prototipo', HC((t) => t.replace('TBool llena(TCola c);\n', '')), ['PROTOTIPO_FALTA']),
  colaH(2, 'encolar sin el numero', HC((t) => t.replace('void encolar(TCola *c, int x);', 'void encolar(TCola *c);')), ['PARAMETROS_CANTIDAD']),
  colaH(2, 'encolar con la cola por valor', HC((t) => t.replace('void encolar(TCola *c, int x);', 'void encolar(TCola c, int x);')), ['PARAMETRO_REFERENCIA_FALTA']),
  colaH(2, 'desencolar no devuelve nada', HC((t) => t.replace('int desencolar(TCola *c);', 'void desencolar(TCola *c);')), ['FUNCION_TIPO_RETORNO']),
  colaH(2, 'vacia con la cola por referencia', HC((t) => t.replace('TBool vacia(TCola c);', 'TBool vacia(TCola *c);')), ['PARAMETRO_ASTERISCO_DE_MAS']),
  // ===== Escribir cola.c =====
  colaC(1, 'completa', COLA_C),
  colaC(1, 'desencolar con otra cuenta', COLA_C.replace('c->inicio = c->inicio + 1;', 'c->inicio++;')),
  colaC(1, 'vacia con un return directo', COLA_C.replace('if (c.inicio == c.fin) {\n    return VERDADERO;\n  }\n  return FALSO;', 'return c.inicio == c.fin;')),
  colaC(1, 'sin incluir el encabezado', COLA_C.replace('#include "cola.h"\n\n', ''), ['INCLUDE_PROPIO_FALTA']),
  colaC(1, 'repitiendo el tipo', COLA_C.replace('#include "cola.h"\n', '#include "cola.h"\n\ntypedef struct {\n  int datos[MAX];\n  int inicio;\n  int fin;\n} TCola;\n'), ['TIPO_REPETIDO_EN_EL_C']),
  colaC(1, 'sin definir una operacion', COLA_C.replace('\n\nTBool llena(TCola c) {\n  if (c.fin == MAX) {\n    return VERDADERO;\n  }\n  return FALSO;\n}', ''), ['PROTOTIPO_SIN_DEFINICION']),
  colaC(1, 'vacia devuelve numeros', COLA_C.replace('if (c.inicio == c.fin) {\n    return VERDADERO;\n  }\n  return FALSO;', 'if (c.inicio == c.fin) {\n    return 1;\n  }\n  return 0;'), ['RETORNO_NUMERO_EN_ENUMERADO']),
  colaC(1, 'encolar con otra firma', COLA_C.replace('void encolar(TCola *c, int x) {', 'int encolar(TCola *c, int x) {'), ['FIRMA_DISTINTA_DEL_PROTOTIPO']),
  colaC(1, 'inicializar no deja el inicio en cero', COLA_C.replace('  c->inicio = 0;\n', ''), ['VARIABLE_SIN_VALOR']),
  colaC(1, 'inicializar no deja el fin en cero', COLA_C.replace('  c->fin = 0;\n', ''), ['VARIABLE_SIN_VALOR']),
  colaC(1, 'encolar sin avanzar el fin', COLA_C.replace('  c->fin = c->fin + 1;\n', ''), ['DEVUELVE_DISTINTO']),
  colaC(1, 'desencolar sin avanzar el inicio', COLA_C.replace('  c->inicio = c->inicio + 1;\n', ''), ['DEVUELVE_DISTINTO']),
  colaC(1, 'desencolar devuelve el ultimo', COLA_C.replace('x = c->datos[c->inicio];', 'x = c->datos[c->fin - 1];'), ['DEVUELVE_DISTINTO']),
  colaC(1, 'primero devuelve el ultimo', COLA_C.replace('return c.datos[c.inicio];', 'return c.datos[c.fin - 1];'), ['DEVUELVE_DISTINTO']),
  colaC(1, 'vacia al reves', COLA_C.replace('if (c.inicio == c.fin) {', 'if (c.inicio != c.fin) {'), ['DEVUELVE_DISTINTO']),
  colaC(1, 'vacia mirando solo el fin', COLA_C.replace('if (c.inicio == c.fin) {', 'if (c.fin == 0) {'), ['DEVUELVE_DISTINTO']),
  colaC(1, 'llena con la cola a medias', COLA_C.replace('if (c.fin == MAX) {', 'if (c.fin == MAX - 1) {'), ['DEVUELVE_DISTINTO']),
  colaC(2, 'llena', '1'),
  colaC(2, 'hay lugar', '0', ['OPCION_COLA_HAY_LUGAR']),
  // ===== Un TAD con decimales: el punto =====
  punto(3, 'porque punto.c es el que llama a sqrt', '1'),
  punto(3, 'porque un .h no puede incluir bibliotecas', '0', ['OPCION_MATH_H_NO_PUEDE']),
  punto(3, 'porque sqrt solo se usa en archivos .c', '2', ['OPCION_MATH_SQRT_SOLO_C']),
  punto(1, 'completo', PUNTO_H),
  punto(1, 'sin guardas', HPU((t) => t.replace('#ifndef PUNTO_H\n#define PUNTO_H\n\n', '').replace('\n\n#endif', '')), ['ENCABEZADO_SIN_GUARDA']),
  punto(1, 'con otro nombre de guarda', HPU((t) => t.replaceAll('PUNTO_H', 'PUNTO')), ['ENCABEZADO_GUARDA_NOMBRE'], { dice: ['PUNTO_H'] }),
  punto(1, 'las coordenadas enteras', HPU((t) => t.replace('double x;', 'int x;').replace('double y;', 'int y;')), ['CAMPO_TIPO']),
  punto(1, 'sin la coordenada y', HPU((t) => t.replace('  double y;\n', '')), ['CAMPO_FALTA']),
  punto(1, 'la coordenada con otro nombre', HPU((t) => t.replace('double y;', 'double z;')), ['CAMPO_NOMBRE']),
  punto(1, 'sin un prototipo', HPU((t) => t.replace('void mostrar(TPunto p);\n', '')), ['PROTOTIPO_FALTA']),
  punto(1, 'origen con un parametro', HPU((t) => t.replace('TPunto origen();', 'TPunto origen(int x);')), ['PARAMETROS_CANTIDAD']),
  punto(1, 'distancia devuelve un entero', HPU((t) => t.replace('double distancia', 'int distancia')), ['FUNCION_TIPO_RETORNO']),
  punto(1, 'puntoMedio devuelve un decimal', HPU((t) => t.replace('TPunto puntoMedio', 'double puntoMedio')), ['FUNCION_TIPO_RETORNO']),
  punto(1, 'crear con coordenadas enteras', HPU((t) => t.replace('TPunto crear(double x, double y);', 'TPunto crear(int x, int y);')), ['PARAMETRO_TIPO']),
  punto(1, 'distancia con un solo punto', HPU((t) => t.replace('double distancia(TPunto a, TPunto b);', 'double distancia(TPunto a);')), ['PARAMETROS_CANTIDAD']),
  punto(1, 'con algo afuera', HPU((t) => t + '\n\nvoid vaciar(TPunto *p);'), ['ENCABEZADO_FUERA_DE_LA_GUARDA']),
  punto(2, 'completa', PUNTO_C),
  punto(2, 'sin incluir math.h', PUNTO_C.replace('#include <math.h>\n', ''), ['INCLUDE_FALTA_PARA_FUNCION'], { dice: ['math.h'] }),
  punto(2, 'sin incluir el encabezado', PUNTO_C.replace('#include "punto.h"\n', ''), ['INCLUDE_PROPIO_FALTA']),
  punto(
    2,
    'distancia con pow',
    PUNTO_C.replace('return sqrt(dx * dx + dy * dy);', 'return sqrt(pow(dx, 2) + pow(dy, 2));'),
    'ok',
    { notas: [] }
  ),
  punto(
    2,
    'distancia con pow, sin variables intermedias',
    PUNTO_C.replace(/  double dx[\s\S]*?return sqrt\(dx \* dx \+ dy \* dy\);/, '  return sqrt(pow(b.x - a.x, 2) + pow(b.y - a.y, 2));'),
    'ok',
    { notas: [] }
  ),
  punto(
    2,
    'distancia con el ^ de C',
    PUNTO_C.replace('return sqrt(dx * dx + dy * dy);', 'return sqrt(dx ^ 2 + dy ^ 2);'),
    ['OPERADOR_XOR_COMO_POTENCIA'],
    { dice: ['pow(x, 2)'] }
  ),
  punto(2, 'distancia sin la raiz', PUNTO_C.replace('return sqrt(dx * dx + dy * dy);', 'return dx * dx + dy * dy;'), ['DEVUELVE_DISTINTO']),
  punto(2, 'distancia con una sola coordenada', PUNTO_C.replace('return sqrt(dx * dx + dy * dy);', 'return sqrt(dx * dx);'), ['DEVUELVE_DISTINTO']),
  punto(2, 'puntoMedio sin dividir', PUNTO_C.replace('(a.x + b.x) / 2, (a.y + b.y) / 2', 'a.x + b.x, a.y + b.y'), ['DEVUELVE_DISTINTO']),
  punto(2, 'puntoMedio con division entera', PUNTO_C.replace('(a.x + b.x) / 2, (a.y + b.y) / 2', '(int)(a.x + b.x) / 2, (int)(a.y + b.y) / 2'), ['DEVUELVE_DISTINTO']),
  punto(2, 'origen en otro lugar', PUNTO_C.replace('return crear(0, 0);', 'return crear(1, 1);'), ['DEVUELVE_DISTINTO']),
  punto(2, 'crear con las coordenadas cruzadas', PUNTO_C.replace('p.x = x;', 'p.x = y;').replace('p.y = y;', 'p.y = x;'), ['DEVUELVE_DISTINTO']),
  punto(2, 'mostrar con un decimal', PUNTO_C.replace('%.2f, %.2f', '%.1f, %.1f'), ['MUESTRA_DISTINTA']),
  punto(2, 'mostrar sin parentesis', PUNTO_C.replace('"(%.2f, %.2f)"', '"%.2f, %.2f"'), ['MUESTRA_DISTINTA']),
  punto(2, 'sin definir una operacion', PUNTO_C.replace('\n\nvoid mostrar(TPunto p) {\n  printf("(%.2f, %.2f)", p.x, p.y);\n}', ''), ['PROTOTIPO_SIN_DEFINICION']),
  punto(4, 'el main correcto', PUNTO_MAIN),
  punto(
    4,
    'guardando la posicion del mas lejano',
    MAIN_PUNTO(
      'int mejor = 0;',
      '',
      'for (int i = 1; i < n; i++) {',
      '  if (distancia(pts[i], origen()) > distancia(pts[mejor], origen())) {',
      '    mejor = i;',
      '  }',
      '}',
      'mostrar(pts[mejor]);'
    )
  ),
  punto(
    4,
    'guardando la mayor distancia',
    MAIN_PUNTO(
      'int mejor = 0;',
      'double mayor = distancia(pts[0], origen());',
      '',
      'for (int i = 1; i < n; i++) {',
      '  if (distancia(pts[i], origen()) > mayor) {',
      '    mayor = distancia(pts[i], origen());',
      '    mejor = i;',
      '  }',
      '}',
      'mostrar(pts[mejor]);'
    )
  ),
  punto(
    4,
    'con el que llega despues en un empate',
    PUNTO_MAIN.replace('> distancia(masLejano, origen())', '>= distancia(masLejano, origen())'),
    ['MUESTRA_DISTINTA']
  ),
  punto(
    4,
    'mostrando el ultimo punto',
    MAIN_PUNTO('mostrar(pts[n - 1]);'),
    ['TAD_OPERACION_SIN_USAR']
  ),
  punto(
    4,
    'el mas cercano en vez del mas lejano',
    PUNTO_MAIN.replace('> distancia(masLejano, origen())', '< distancia(masLejano, origen())'),
    ['MUESTRA_DISTINTA']
  ),
  punto(
    4,
    'sin usar el origen',
    PUNTO_MAIN.replace('distancia(pts[i], origen()) > distancia(masLejano, origen())', 'distancia(pts[i], crear(0, 0)) > distancia(masLejano, crear(0, 0))'),
    ['TAD_OPERACION_SIN_USAR']
  ),
  punto(
    4,
    'mirando las coordenadas',
    MAIN_PUNTO(
      'TPunto masLejano = pts[0];',
      '',
      'for (int i = 1; i < n; i++) {',
      '  if (pts[i].x * pts[i].x + pts[i].y * pts[i].y > masLejano.x * masLejano.x + masLejano.y * masLejano.y) {',
      '    masLejano = pts[i];',
      '  }',
      '}',
      'mostrar(masLejano);'
    ),
    ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR']
  ),
  punto(
    4,
    'armando los puntos a mano',
    PUNTO_MAIN.replace('    pts[i] = crear(x, y);', '    pts[i].x = x;\n    pts[i].y = y;'),
    ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR']
  ),
  punto(
    4,
    'sin mostrar con la operacion',
    PUNTO_MAIN.replace('mostrar(masLejano);', 'printf("(%.2f, %.2f)", masLejano.x, masLejano.y);'),
    ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR']
  ),
  // ===== Usar el punto con un arreglo =====
  puntoUsar(1, 'el perimetro correcto', PERIMETRO),
  puntoUsar(
    1,
    'cerrando la poligonal',
    PERIMETRO.replace('printf("%.2f", total);', 'total = total + distancia(pts[n - 1], pts[0]);\n  printf("%.2f", total);'),
    ['MUESTRA_DISTINTA']
  ),
  puntoUsar(1, 'con un solo decimal', PERIMETRO.replace('%.2f', '%.1f'), ['MUESTRA_DISTINTA']),
  puntoUsar(1, 'sin la ultima distancia', PERIMETRO.replace('i < n - 1', 'i < n - 2'), ['MUESTRA_DISTINTA']),
  puntoUsar(
    1,
    'armando los puntos a mano',
    PERIMETRO.replace('    pts[i] = crear(x, y);', '    pts[i].x = x;\n    pts[i].y = y;'),
    ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR']
  ),
  puntoUsar(2, 'el conteo correcto', RADIO),
  puntoUsar(2, 'con menor estricto', RADIO.replace('<= r', '< r'), ['MUESTRA_DISTINTA']),
  puntoUsar(2, 'contando los de afuera', RADIO.replace('<= r', '> r'), ['MUESTRA_DISTINTA']),
  puntoUsar(2, 'sin usar el origen', RADIO.replace('origen()', 'crear(0, 0)'), ['TAD_OPERACION_SIN_USAR']),
  puntoUsar(
    2,
    'calculando la distancia a mano',
    RADIO.replace('distancia(pts[i], origen()) <= r', 'pts[i].x * pts[i].x + pts[i].y * pts[i].y <= r * r'),
    ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR']
  ),
  puntoUsar(3, 'el par mas cercano correcto', CERCANOS),
  puntoUsar(3, 'con el que llega despues en un empate', CERCANOS.replace('< menor', '<= menor'), ['MUESTRA_DISTINTA']),
  puntoUsar(
    3,
    'solo los puntos consecutivos',
    CERCANOS.replace(
      'for (int i = 0; i < n; i++) {\n    for (int j = i + 1; j < n; j++) {\n      if (distancia(pts[i], pts[j]) < menor) {\n        menor = distancia(pts[i], pts[j]);\n        a = i;\n        b = j;\n      }\n    }\n  }',
      'for (int i = 0; i < n - 1; i++) {\n    if (distancia(pts[i], pts[i + 1]) < menor) {\n      menor = distancia(pts[i], pts[i + 1]);\n      a = i;\n      b = i + 1;\n    }\n  }'
    ),
    ['MUESTRA_DISTINTA']
  ),
  puntoUsar(3, 'sin la distancia', CERCANOS.replace('printf(" %.2f", menor);', 'printf(" ");'), ['MUESTRA_DISTINTA']),
  puntoUsar(
    3,
    'los puntos en el orden contrario',
    CERCANOS.replace('mostrar(pts[a]);', 'mostrar(pts[b]);').replace('mostrar(pts[b]);\n  printf(" %.2f"', 'mostrar(pts[a]);\n  printf(" %.2f"'),
    ['MUESTRA_DISTINTA']
  ),
  puntoUsar(
    3,
    'sin mostrar con la operacion',
    CERCANOS.replace('mostrar(pts[a]);', 'printf("(%.2f, %.2f)", pts[a].x, pts[a].y);'),
    ['TAD_ACCESO_DIRECTO']
  ),
  puntoUsar(
    3,
    'el punto mas cercano al origen en vez del par mas cercano',
    MAIN_PU(
      ['double x, y;', 'int mejor = 0;', 'int n;'],
      [
        'for (int i = 1; i < n; i++) {',
        '  if (distancia(pts[i], origen()) < distancia(pts[mejor], origen())) {',
        '    mejor = i;',
        '  }',
        '}',
        'mostrar(pts[mejor]);',
        'printf(" ");',
        'mostrar(pts[mejor]);',
        'printf(" %.2f", distancia(pts[mejor], origen()));',
      ]
    ).replace('  scanf("%d", &n);', '  scanf("%d", &n);'),
    ['MUESTRA_DISTINTA']
  ),
  // ===== La cuenta bancaria =====
  cuenta(1, 'completo', CUENTA_H),
  cuenta(1, 'sin guardas', HCU((t) => t.replace('#ifndef CUENTA_H\n#define CUENTA_H\n\n', '').replace('\n\n#endif', '')), ['ENCABEZADO_SIN_GUARDA']),
  cuenta(1, 'con otro nombre de guarda', HCU((t) => t.replaceAll('CUENTA_H', 'CUENTA')), ['ENCABEZADO_GUARDA_NOMBRE'], { dice: ['CUENTA_H'] }),
  cuenta(1, 'el saldo entero', HCU((t) => t.replace('double saldo;', 'int saldo;')), ['CAMPO_TIPO']),
  cuenta(1, 'sin el numero', HCU((t) => t.replace('  int numero;\n', '')), ['CAMPO_FALTA']),
  cuenta(1, 'el saldo con otro nombre', HCU((t) => t.replace('double saldo;', 'double dinero;')), ['CAMPO_FALTA']),
  cuenta(1, 'sin un prototipo', HCU((t) => t.replace('int obtenerNumero(TCuenta c);\n', '')), ['PROTOTIPO_FALTA']),
  cuenta(1, 'crear sin el numero', HCU((t) => t.replace('TCuenta crear(int numero);', 'TCuenta crear();')), ['PARAMETROS_CANTIDAD']),
  cuenta(1, 'depositar con la cuenta por valor', HCU((t) => t.replace('void depositar(TCuenta *c, double monto);', 'void depositar(TCuenta c, double monto);')), ['PARAMETRO_REFERENCIA_FALTA']),
  cuenta(1, 'retirar devuelve un entero', HCU((t) => t.replace('TResultado retirar', 'int retirar')), ['FUNCION_TIPO_RETORNO']),
  cuenta(1, 'obtenerSaldo devuelve un entero', HCU((t) => t.replace('double obtenerSaldo', 'int obtenerSaldo')), ['FUNCION_TIPO_RETORNO']),
  cuenta(1, 'el monto entero', HCU((t) => t.replace('void depositar(TCuenta *c, double monto);', 'void depositar(TCuenta *c, int monto);')), ['PARAMETRO_TIPO']),
  cuenta(1, 'con algo afuera', HCU((t) => t + '\n\nvoid cerrar(TCuenta *c);'), ['ENCABEZADO_FUERA_DE_LA_GUARDA']),
  cuenta(2, 'completa', CUENTA_C),
  cuenta(2, 'sin incluir el encabezado', CUENTA_C.replace('#include "cuenta.h"\n', ''), ['INCLUDE_PROPIO_FALTA']),
  cuenta(2, 'retirar siempre resta', CUENTA_C.replace('  if (monto > c->saldo) {\n    return SALDO_INSUFICIENTE;\n  }\n', ''), ['DEVUELVE_DISTINTO']),
  cuenta(2, 'retirar no deja retirar todo el saldo', CUENTA_C.replace('monto > c->saldo', 'monto >= c->saldo'), ['DEVUELVE_DISTINTO']),
  cuenta(
    2,
    'retirar resta aunque no alcance',
    CUENTA_C.replace('  if (monto > c->saldo) {\n    return SALDO_INSUFICIENTE;\n  }\n  c->saldo = c->saldo - monto;\n  return OK;', '  c->saldo = c->saldo - monto;\n  if (c->saldo < 0) {\n    return SALDO_INSUFICIENTE;\n  }\n  return OK;'),
    ['DEVUELVE_DISTINTO']
  ),
  cuenta(2, 'retirar devuelve numeros', CUENTA_C.replace('return SALDO_INSUFICIENTE;', 'return 1;').replace('return OK;', 'return 0;'), ['RETORNO_NUMERO_EN_ENUMERADO']),
  cuenta(
    2,
    'retirar muestra el mensaje',
    CUENTA_C.replace('#include "cuenta.h"', '#include <stdio.h>\n#include "cuenta.h"').replace('    return SALDO_INSUFICIENTE;', '    printf("Saldo insuficiente");\n    return SALDO_INSUFICIENTE;'),
    ['MUESTRA_DISTINTA']
  ),
  cuenta(2, 'crear con un saldo inicial', CUENTA_C.replace('c.saldo = 0;', 'c.saldo = 100;'), ['DEVUELVE_DISTINTO']),
  cuenta(2, 'crear con el numero cruzado', CUENTA_C.replace('c.numero = numero;', 'c.numero = 0;'), ['DEVUELVE_DISTINTO']),
  cuenta(2, 'depositar resta', CUENTA_C.replace('c->saldo = c->saldo + monto;', 'c->saldo = c->saldo - monto;'), ['DEVUELVE_DISTINTO']),
  cuenta(2, 'depositar reemplaza el saldo', CUENTA_C.replace('c->saldo = c->saldo + monto;', 'c->saldo = monto;'), ['DEVUELVE_DISTINTO']),
  cuenta(2, 'obtenerNumero devuelve el saldo', CUENTA_C.replace('return c.numero;', 'return c.saldo;'), ['DEVUELVE_DISTINTO']),
  cuenta(2, 'sin definir una operacion', CUENTA_C.replace('\n\nint obtenerNumero(TCuenta c) {\n  return c.numero;\n}', ''), ['PROTOTIPO_SIN_DEFINICION']),
  cuenta(3, 'porque la cuenta no sabe quien la usa', '1'),
  cuenta(3, 'porque printf solo va en main', '0', ['OPCION_PRINTF_SOLO_EN_MAIN']),
  cuenta(3, 'porque es mas rapido', '2', ['OPCION_ENUM_MAS_RAPIDO']),
  cuenta(4, 'el main correcto', MAIN_MOV),
  cuenta(4, 'sin avisar que no alcanza', MAIN_MOV.replace('      if (retirar(&c, monto) == SALDO_INSUFICIENTE) {\n        printf("Saldo insuficiente\\n");\n      }', '      retirar(&c, monto);'), ['MUESTRA_DISTINTA']),
  cuenta(4, 'con otro mensaje', MAIN_MOV.replace('Saldo insuficiente', 'No alcanza'), ['MUESTRA_DISTINTA']),
  cuenta(4, 'el saldo con un decimal', MAIN_MOV.replace('%.2f', '%.1f'), ['MUESTRA_DISTINTA']),
  cuenta(4, 'avisando con OK', MAIN_MOV.replace('if (retirar(&c, monto) == SALDO_INSUFICIENTE) {', 'if (retirar(&c, monto) != OK) {')),
  cuenta(4, 'sin el numero de cuenta', MAIN_MOV.replace('"Cuenta %d: %.2f", obtenerNumero(c), obtenerSaldo(c)', '"Cuenta %d: %.2f", numero, obtenerSaldo(c)'), ['TAD_OPERACION_SIN_USAR']),
  cuenta(4, 'tocando el saldo', MAIN_MOV.replace('obtenerSaldo(c)', 'c.saldo'), ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR']),
  cuenta(
    4,
    'restando el retiro a mano',
    MAIN_MOV.replace('      if (retirar(&c, monto) == SALDO_INSUFICIENTE) {', '      c.saldo = c.saldo - monto;\n      if (retirar(&c, 0) == SALDO_INSUFICIENTE) {'),
    ['TAD_ACCESO_DIRECTO']
  ),
  cuentaUsar(2, 'el deposito sin retiro', '1'),
  cuentaUsar(2, 'queda en deuda', '0', ['OPCION_SALDO_NEGATIVO']),
  cuentaUsar(2, 'retira lo que hay', '2', ['OPCION_RETIRA_LO_QUE_HAY']),
  cuentaUsar(1, 'la transferencia correcta', MAIN_TRANSF),
  cuentaUsar(
    1,
    'depositando aunque el retiro no se pudo',
    MAIN_TRANSF.replace('  if (retirar(&origen, monto) == OK) {\n    depositar(&destino, monto);\n    printf("Transferencia realizada\\n");\n  } else {\n    printf("Saldo insuficiente\\n");\n  }', '  if (retirar(&origen, monto) == OK) {\n    printf("Transferencia realizada\\n");\n  } else {\n    printf("Saldo insuficiente\\n");\n  }\n  depositar(&destino, monto);'),
    ['MUESTRA_DISTINTA']
  ),
  cuentaUsar(
    1,
    'sin mirar el resultado de retirar',
    MAIN_TRANSF.replace('  if (retirar(&origen, monto) == OK) {\n    depositar(&destino, monto);\n    printf("Transferencia realizada\\n");\n  } else {\n    printf("Saldo insuficiente\\n");\n  }', '  retirar(&origen, monto);\n  depositar(&destino, monto);\n  printf("Transferencia realizada\\n");'),
    ['MUESTRA_DISTINTA']
  ),
  cuentaUsar(
    1,
    'preguntando el saldo antes de retirar',
    MAIN_TRANSF.replace('if (retirar(&origen, monto) == OK) {', 'if (obtenerSaldo(origen) >= monto) {\n    retirar(&origen, monto);')
  ),
  cuentaUsar(1, 'mostrando los saldos al reves', MAIN_TRANSF.replace('obtenerSaldo(origen));\n  printf("Cuenta %d: %.2f", obtenerNumero(destino), obtenerSaldo(destino)', 'obtenerSaldo(destino));\n  printf("Cuenta %d: %.2f", obtenerNumero(destino), obtenerSaldo(origen)'), ['MUESTRA_DISTINTA']),
  cuentaUsar(1, 'tocando los saldos', MAIN_TRANSF.replace('obtenerSaldo(destino)', 'destino.saldo'), ['TAD_ACCESO_DIRECTO']),
  cuentaUsar(3, 'la cuota correcta', MAIN_CUOTA),
  cuentaUsar(3, 'sin el aviso de la cuenta que no pago', MAIN_CUOTA.replace('    printf("Cuenta %d no pudo pagar\\n", obtenerNumero(cuentas[i]));', '    cobradas = cobradas;'), ['TAD_OPERACION_SIN_USAR']),
  cuentaUsar(3, 'contando las que no pagaron', MAIN_CUOTA.replace('printf("Cobradas: %d", cobradas);', 'printf("Cobradas: %d", n - cobradas);'), ['MUESTRA_DISTINTA']),
  cuentaUsar(3, 'contando todas', MAIN_CUOTA.replace('    cobradas++;', '    cobradas++;\n  }\n  if (retirar(&cuentas[i], 0) == SALDO_INSUFICIENTE) {\n    cobradas = cobradas;'), ['MUESTRA_DISTINTA']),
  cuentaUsar(
    3,
    'cobrando a las que pueden con el saldo',
    MAIN_CUOTA.replace('if (retirar(&cuentas[i], cuota) == OK) {', 'if (obtenerSaldo(cuentas[i]) > cuota) {\n    retirar(&cuentas[i], cuota);'),
    ['MUESTRA_DISTINTA']
  ),
  cuentaUsar(3, 'tocando el saldo', MAIN_CUOTA.replace('retirar(&cuentas[i], cuota) == OK', 'cuentas[i].saldo >= cuota'), ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR']),
  cuentaUsar(4, 'la mayor correcta', MAIN_MAYOR),
  cuentaUsar(4, 'con el que llega despues en un empate', MAIN_MAYOR.replace('obtenerSaldo(cuentas[i]) > obtenerSaldo(cuentas[mayor])', 'obtenerSaldo(cuentas[i]) >= obtenerSaldo(cuentas[mayor])'), ['MUESTRA_DISTINTA']),
  cuentaUsar(4, 'mostrando la posicion y no el numero', MAIN_MAYOR.replace('obtenerNumero(cuentas[mayor])', 'mayor'), ['TAD_OPERACION_SIN_USAR']),
  cuentaUsar(4, 'sin sumar el ultimo saldo', MAIN_MAYOR.replace('for (int i = 0; i < n; i++) {\n    total', 'for (int i = 0; i < n - 1; i++) {\n    total'), ['MUESTRA_DISTINTA']),
  cuentaUsar(4, 'mostrando el saldo de la mayor', MAIN_MAYOR.replace('"Mayor: Cuenta %d\\n", obtenerNumero(cuentas[mayor])', '"Mayor: Cuenta %d\\n", (int)obtenerSaldo(cuentas[mayor])'), ['TAD_OPERACION_SIN_USAR']),
  cuenta(4, 'con un mensaje para pedir el numero', MAIN_MOV.replace('  scanf("%d", &numero);', '  printf("Numero de cuenta: ");\n  scanf("%d", &numero);'), ['MUESTRA_DISTINTA']),
  cuenta(4, 'con un mensaje para pedir cada movimiento', MAIN_MOV.replace('    scanf("%d", &tipo);', '    printf("Tipo: ");\n    scanf("%d", &tipo);'), ['MUESTRA_DISTINTA']),
  cuentaUsar(1, 'con un mensaje para pedir el monto', MAIN_TRANSF.replace('  scanf("%lf", &monto);', '  printf("Monto: ");\n  scanf("%lf", &monto);'), ['MUESTRA_DISTINTA']),
  cuentaUsar(
    1,
    'reemplazando el saldo del destino en vez de sumarle',
    MAIN_TRANSF.replace('    depositar(&destino, monto);', '    destino = crear(obtenerNumero(destino));\n    depositar(&destino, monto);'),
    ['MUESTRA_DISTINTA']
  ),
  cuentaUsar(1, 'sin cargar el saldo inicial del destino', MAIN_TRANSF.replace('  depositar(&destino, saldo);\n', ''), ['MUESTRA_DISTINTA']),
  cuentaUsar(
    1,
    'cargando el saldo inicial del destino a la cuenta de origen',
    MAIN_TRANSF.replace('  depositar(&destino, saldo);\n', '  depositar(&origen, saldo);\n'),
    ['MUESTRA_DISTINTA']
  ),
  // ===== El conjunto =====
  conjunto(1, 'completo', CONJ_H),
  conjunto(1, 'sin guardas', CONJ_H.replace('#ifndef CONJUNTO_H\n#define CONJUNTO_H\n\n', '').replace('\n\n#endif', ''), ['ENCABEZADO_SIN_GUARDA']),
  conjunto(1, 'con otro nombre de guarda', CONJ_H.replaceAll('CONJUNTO_H', 'CONJUNTO'), ['ENCABEZADO_GUARDA_NOMBRE'], { dice: ['CONJUNTO_H'] }),
  conjunto(1, 'sin la cantidad', CONJ_H.replace('  int cantidad;\n', ''), ['CAMPO_FALTA']),
  conjunto(1, 'la cantidad con decimales', CONJ_H.replace('int cantidad;', 'double cantidad;'), ['CAMPO_TIPO']),
  conjunto(1, 'pertenece devuelve un entero', CONJ_H.replace('TBool pertenece', 'int pertenece'), ['FUNCION_TIPO_RETORNO']),
  conjunto(1, 'agregar con el conjunto por valor', CONJ_H.replace('void agregar(TConjunto *c, int x);', 'void agregar(TConjunto c, int x);'), ['PARAMETRO_REFERENCIA_FALTA']),
  conjunto(1, 'sin un prototipo', CONJ_H.replace('int cardinal(TConjunto c);\n', ''), ['PROTOTIPO_FALTA']),
  conjunto(1, 'con algo afuera', CONJ_H + '\n\nvoid vaciar(TConjunto *c);', ['ENCABEZADO_FUERA_DE_LA_GUARDA']),
  conjunto(2, 'completo', CONJ_C),
  conjunto(2, 'sin incluir el encabezado', CONJ_C.replace('#include "conjunto.h"\n', ''), ['INCLUDE_PROPIO_FALTA']),
  conjunto(
    2,
    'agregar sin mirar si ya estaba',
    CONJ_C.replace("  if (pertenece(*c, x) == FALSO) {\n    c->elementos[c->cantidad] = x;\n    c->cantidad = c->cantidad + 1;\n  }", '  c->elementos[c->cantidad] = x;\n  c->cantidad = c->cantidad + 1;'),
    ['DEVUELVE_DISTINTO']
  ),
  conjunto(2, 'agregar sin sumar a la cantidad', CONJ_C.replace('    c->cantidad = c->cantidad + 1;\n', ''), ['DEVUELVE_DISTINTO']),
  conjunto(2, 'agregar que suma la cantidad sin guardar', CONJ_C.replace('    c->elementos[c->cantidad] = x;\n', ''), ['VARIABLE_SIN_VALOR']),
  conjunto(2, 'pertenece solo mira el primero', CONJ_C.replace('i < c.cantidad', 'i < 1'), ['VARIABLE_SIN_VALOR']),
  conjunto(2, 'pertenece siempre falso', CONJ_C.replace('      return VERDADERO;', '      return FALSO;'), ['DEVUELVE_DISTINTO']),
  conjunto(2, 'pertenece devuelve numeros', CONJ_C.replace('return VERDADERO;', 'return 1;').replace('return FALSO;', 'return 0;'), ['RETORNO_NUMERO_EN_ENUMERADO']),
  conjunto(2, 'cardinal devuelve el maximo', CONJ_C.replace('return c.cantidad;', 'return MAX;'), ['DEVUELVE_DISTINTO']),
  conjunto(2, 'inicializar sin dejarlo vacio', CONJ_C.replace('  c->cantidad = 0;', '  c->cantidad = 1;'), ['DEVUELVE_DISTINTO']),
  conjunto(2, 'sin definir una operacion', CONJ_C.replace('\n\nint cardinal(TConjunto c) {\n  return c.cantidad;\n}', ''), ['PROTOTIPO_SIN_DEFINICION']),
  conjunto(3, 'porque se saltea la comprobacion', '1'),
  conjunto(3, 'porque main no ve el arreglo', '0', ['OPCION_CONJUNTO_NO_VE']),
  conjunto(3, 'porque es mas lento', '2', ['OPCION_CONJUNTO_MAS_LENTO']),
  conjunto(4, 'el main correcto', CONJ_MAIN),
  conjunto(4, 'contando los numeros leidos en vez de los distintos', CONJ_MAIN.replace('cardinal(c)', 'n'), ['TAD_OPERACION_SIN_USAR']),
  conjunto(4, 'sin la etiqueta', CONJ_MAIN.replace('Distintos: %d', '%d'), ['MUESTRA_DISTINTA']),
  conjunto(4, 'leyendo un numero de mas', CONJ_MAIN.replace('  printf("Distintos', '  scanf("%d", &x);\n  printf("Distintos'), ['LECTURA_DE_MAS']),
  conjunto(4, 'con un mensaje para pedir los datos', CONJ_MAIN.replace('  scanf("%d", &n);', '  printf("Cantidad: ");\n  scanf("%d", &n);'), ['MUESTRA_DISTINTA']),
  conjunto(4, 'mirando la cantidad del conjunto', CONJ_MAIN.replace('cardinal(c)', 'c.cantidad'), ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR']),
  conjunto(
    4,
    'agregando en el arreglo sin la operacion',
    CONJ_MAIN.replace('    agregar(&c, x);', '    c.elementos[c.cantidad] = x;\n    c.cantidad++;'),
    ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR']
  ),
  conjuntoUsar(1, 'las consultas correctas', CONJ_CONSULTAS),
  conjuntoUsar(1, 'con las respuestas al reves', CONJ_CONSULTAS.replace('== VERDADERO', '== FALSO'), ['MUESTRA_DISTINTA']),
  conjuntoUsar(1, 'sin pasar por el conjunto', CONJ_CONSULTAS.replace('    agregar(&c, x);', '    x = x;'), ['TAD_OPERACION_SIN_USAR']),
  conjuntoUsar(1, 'con un mensaje para pedir los datos', CONJ_CONSULTAS.replace('  scanf("%d", &q);', '  printf("Consultas: ");\n  scanf("%d", &q);'), ['MUESTRA_DISTINTA']),
  conjuntoUsar(2, 'los ordenados correctos', CONJ_ORDENADOS),
  conjuntoUsar(2, 'sin el 20', CONJ_ORDENADOS.replace('i <= 20', 'i < 20'), ['MUESTRA_FALTA']),
  conjuntoUsar(
    2,
    'de mayor a menor',
    CONJ_ORDENADOS.replace('for (int i = 1; i <= 20; i++) {\n    if (pertenece(c, i)', 'for (int i = 20; i >= 1; i--) {\n    if (pertenece(c, i)'),
    ['MUESTRA_DISTINTA']
  ),
  conjuntoUsar(2, 'solo hasta el 10', CONJ_ORDENADOS.replace('i <= 20', 'i <= 10'), ['MUESTRA_DISTINTA']),
  conjuntoUsar(3, 'los comunes correctos', CONJ_AMBOS),
  conjuntoUsar(3, 'los que estan en alguno', CONJ_AMBOS.replace('&&', '||'), ['MUESTRA_DISTINTA']),
  conjuntoUsar(3, 'cargando todo en un solo conjunto', CONJ_AMBOS.replace('    agregar(&b, x);', '    agregar(&a, x);'), ['MUESTRA_FALTA']),
  conjuntoAmpliar(1, 'completo', CONJ_H_AMPLIADO),
  conjuntoAmpliar(1, 'sin declarar unir', CONJ_H_AMPLIADO.replace('TConjunto unir(TConjunto a, TConjunto b);\n', ''), ['PROTOTIPO_FALTA']),
  conjuntoAmpliar(1, 'eliminar con el conjunto por valor', CONJ_H_AMPLIADO.replace('void eliminar(TConjunto *c, int x);', 'void eliminar(TConjunto c, int x);'), ['PARAMETRO_REFERENCIA_FALTA']),
  conjuntoAmpliar(1, 'unir devuelve un entero', CONJ_H_AMPLIADO.replace('TConjunto unir', 'int unir'), ['FUNCION_TIPO_RETORNO']),
  conjuntoAmpliar(2, 'completo', CONJ_C_AMPLIADO),
  conjuntoAmpliar(2, 'eliminar sin restar a la cantidad', CONJ_C_AMPLIADO.replace('      c->cantidad = c->cantidad - 1;\n', ''), ['DEVUELVE_DISTINTO']),
  conjuntoAmpliar(2, 'eliminar que borra siempre el ultimo', CONJ_C_AMPLIADO.replace('    if (c->elementos[i] == x) {', '    if (c->elementos[i] != x) {'), ['DEVUELVE_DISTINTO']),
  conjuntoAmpliar(
    2,
    'unir sin mirar los repetidos',
    CONJ_C_AMPLIADO.replace('    agregar(&r, b.elementos[i]);', '    r.elementos[r.cantidad] = b.elementos[i];\n    r.cantidad = r.cantidad + 1;'),
    ['DEVUELVE_DISTINTO']
  ),
  conjuntoAmpliar(2, 'unir que devuelve solo a', CONJ_C_AMPLIADO.replace('  return r;', '  return a;'), ['DEVUELVE_DISTINTO']),
  conjuntoAmpliar(3, 'el main correcto', CONJ_MAIN_AMPLIADO),
  conjuntoAmpliar(3, 'sin eliminar', CONJ_MAIN_AMPLIADO.replace('  eliminar(&u, x);\n', ''), ['TAD_OPERACION_SIN_USAR']),
  conjuntoAmpliar(3, 'eliminando antes de unir', CONJ_MAIN_AMPLIADO.replace('  u = unir(a, b);\n  scanf("%d", &x);\n  eliminar(&u, x);', '  scanf("%d", &x);\n  eliminar(&a, x);\n  u = unir(a, b);'), ['MUESTRA_DISTINTA']),
  conjuntoCompletar(1, 'completo', CONJ_H_COMPLETO),
  conjuntoCompletar(1, 'sin declarar restar', CONJ_H_COMPLETO.replace('TConjunto restar(TConjunto a, TConjunto b);\n', ''), ['PROTOTIPO_FALTA']),
  conjuntoCompletar(1, 'intersectar con un solo conjunto', CONJ_H_COMPLETO.replace('TConjunto intersectar(TConjunto a, TConjunto b);', 'TConjunto intersectar(TConjunto a);'), ['PARAMETROS_CANTIDAD']),
  conjuntoCompletar(2, 'completo', CONJ_C_COMPLETO),
  conjuntoCompletar(
    2,
    'intersectar que devuelve la union',
    CONJ_C_COMPLETO.replace('    if (pertenece(b, a.elementos[i]) == VERDADERO) {\n      agregar(&r, a.elementos[i]);\n    }', '    agregar(&r, a.elementos[i]);\n    agregar(&r, b.elementos[i]);'),
    ['DEVUELVE_DISTINTO']
  ),
  conjuntoCompletar(2, 'restar que se queda con los que estan en b', CONJ_C_COMPLETO.replace('== FALSO) {\n      agregar(&r, a.elementos[i]);', '== VERDADERO) {\n      agregar(&r, a.elementos[i]);'), ['DEVUELVE_DISTINTO']),
  conjuntoCompletar(
    2,
    'restar con los conjuntos cruzados',
    CONJ_C_COMPLETO.replace('    if (pertenece(b, a.elementos[i]) == FALSO) {\n      agregar(&r, a.elementos[i]);', '    if (pertenece(a, b.elementos[i]) == FALSO) {\n      agregar(&r, b.elementos[i]);').replace('i < a.cantidad; i++) {\n    if (pertenece(a, b', 'i < b.cantidad; i++) {\n    if (pertenece(a, b'),
    ['DEVUELVE_DISTINTO']
  ),
  conjuntoCompletar(3, 'el main correcto', CONJ_MAIN_COMPLETO),
  conjuntoCompletar(3, 'con los renglones cambiados', CONJ_MAIN_COMPLETO.replace('pertenece(u, k)', 'pertenece(r, k)').replace('pertenece(r, k) == VERDADERO) {\n      printf("%d ", k);\n    }\n  }\n  return 0;', 'pertenece(u, k) == VERDADERO) {\n      printf("%d ", k);\n    }\n  }\n  return 0;'), ['MUESTRA_DISTINTA']),
  conjuntoCompletar(3, 'sin usar restar', CONJ_MAIN_COMPLETO.replace('  r = restar(a, b);\n', '  r = i;\n'), ['TAD_OPERACION_SIN_USAR']),
  // ===== Cambiar la representacion del conjunto =====
  conjuntoRepr(1, 'solo cambia el .c', '0', ['OPCION_REPR_SOLO_C']),
  conjuntoRepr(1, 'cambian el .h y el .c', '1'),
  conjuntoRepr(1, 'cambian los tres', '2', ['OPCION_REPR_LOS_TRES']),
  conjuntoRepr(2, 'completo', REPR_H),
  conjuntoRepr(2, 'dejando la constante MAX', REPR_H.replace('#define TAM 21', '#define MAX 10').replace('presente[TAM]', 'presente[MAX]'), ['CAMPO_ARREGLO_SIN_CONSTANTE']),
  conjuntoRepr(2, 'con una casilla de menos', REPR_H.replace('#define TAM 21', '#define TAM 20'), ['ARREGLO_CHICO']),
  conjuntoRepr(2, 'las casillas enteras', REPR_H.replace('TBool presente[TAM];', 'int presente[TAM];'), ['CAMPO_TIPO']),
  conjuntoRepr(2, 'las casillas con un solo valor', REPR_H.replace('TBool presente[TAM];', 'TBool presente;'), ['CAMPO_NO_ES_ARREGLO']),
  conjuntoRepr(2, 'sin la cantidad', REPR_H.replace('  int cantidad;\n', ''), ['CAMPO_FALTA']),
  conjuntoRepr(2, 'agregar con el conjunto por valor', REPR_H.replace('void agregar(TConjunto *c, int x);', 'void agregar(TConjunto c, int x);'), ['PARAMETRO_REFERENCIA_FALTA']),
  conjuntoRepr(2, 'con algo afuera', REPR_H + '\n\nvoid vaciar(TConjunto *c);', ['ENCABEZADO_FUERA_DE_LA_GUARDA']),
  conjuntoRepr(3, 'completo', REPR_C1),
  conjuntoRepr(
    3,
    'agregar que suma aunque ya estuviera',
    REPR_C1.replace('  if (c->presente[x] == FALSO) {\n    c->presente[x] = VERDADERO;\n    c->cantidad = c->cantidad + 1;\n  }', '  c->presente[x] = VERDADERO;\n  c->cantidad = c->cantidad + 1;'),
    ['DEVUELVE_DISTINTO']
  ),
  conjuntoRepr(3, 'eliminar sin restar a la cantidad', REPR_C1.replace('    c->cantidad = c->cantidad - 1;\n', ''), ['DEVUELVE_DISTINTO']),
  conjuntoRepr(3, 'pertenece siempre verdadero', REPR_C1.replace('  return c.presente[x];', '  return VERDADERO;'), ['DEVUELVE_DISTINTO']),
  conjuntoRepr(3, 'inicializar sin recorrer las casillas', REPR_C1.replace('  for (int i = 0; i < TAM; i++) {\n    c->presente[i] = FALSO;\n  }\n', ''), ['VARIABLE_SIN_VALOR']),
  conjuntoRepr(3, 'inicializar que deja el contador sin valor', REPR_C1.replace('  c->cantidad = 0;', '  c->cantidad = c->cantidad;'), ['VARIABLE_SIN_VALOR']),
  conjuntoRepr(3, 'cardinal que devuelve el tamano', REPR_C1.replace('  return c.cantidad;', '  return TAM;'), ['DEVUELVE_DISTINTO']),
  conjuntoRepr(3, 'sin definir eliminar', REPR_C1.replace('void eliminar(TConjunto *c, int x) {\n  if (c->presente[x] == VERDADERO) {\n    c->presente[x] = FALSO;\n    c->cantidad = c->cantidad - 1;\n  }\n}\n\n', ''), ['PROTOTIPO_SIN_DEFINICION']),
  conjuntoRepr(4, 'completo', REPR_C2),
  conjuntoRepr(4, 'con las tres provisorias', REPR_C1, ['DEVUELVE_DISTINTO']),
  conjuntoRepr(4, 'unir con y en vez de o', REPR_C2.replace('a.presente[i] == VERDADERO || b.presente[i] == VERDADERO', 'a.presente[i] == VERDADERO && b.presente[i] == VERDADERO'), ['DEVUELVE_DISTINTO']),
  conjuntoRepr(4, 'intersectar con o en vez de y', REPR_C2.replace('a.presente[i] == VERDADERO && b.presente[i] == VERDADERO) {\n      agregar(&r, i);\n    }\n  }\n  return r;\n}\n\nTConjunto restar', 'a.presente[i] == VERDADERO || b.presente[i] == VERDADERO) {\n      agregar(&r, i);\n    }\n  }\n  return r;\n}\n\nTConjunto restar'), ['DEVUELVE_DISTINTO']),
  conjuntoRepr(4, 'restar sin negar la casilla de b', REPR_C2.replace('a.presente[i] == VERDADERO && b.presente[i] == FALSO', 'a.presente[i] == VERDADERO && b.presente[i] == VERDADERO'), ['DEVUELVE_DISTINTO']),
  conjuntoRepr(4, 'restar con a y b al reves', REPR_C2.replace('a.presente[i] == VERDADERO && b.presente[i] == FALSO', 'b.presente[i] == VERDADERO && a.presente[i] == FALSO'), ['DEVUELVE_DISTINTO']),
  conjuntoRepr(4, 'unir sin llegar a la ultima casilla', REPR_C2.replace('  for (int i = 0; i < TAM; i++) {\n    if (a.presente[i] == VERDADERO || b.presente[i] == VERDADERO)', '  for (int i = 0; i < TAM - 1; i++) {\n    if (a.presente[i] == VERDADERO || b.presente[i] == VERDADERO)'), ['DEVUELVE_DISTINTO']),
  conjuntoRepr(5, 'caben mas pero de 0 a 20', '0'),
  conjuntoRepr(5, 'caben cualquier valor', '1', ['OPCION_REPR_CUALQUIER_VALOR']),
  conjuntoRepr(5, 'hay que cambiar el main', '2', ['OPCION_REPR_CAMBIAR_MAIN']),
  // ===== La lista =====
  tadLista(1, 'completo', LISTA_H),
  tadLista(1, 'el arreglo sin la constante', LISTA_H.replace('elementos[MAX]', 'elementos[10]'), ['CAMPO_ARREGLO_SIN_CONSTANTE']),
  tadLista(1, 'sin la cantidad', LISTA_H.replace('  int cantidad;\n', ''), ['CAMPO_FALTA']),
  tadLista(1, 'insertar con la lista por valor', LISTA_H.replace('TResultado insertar(TLista *l,', 'TResultado insertar(TLista l,'), ['PARAMETRO_REFERENCIA_FALTA']),
  tadLista(1, 'insertar devuelve un entero', LISTA_H.replace('TResultado insertar', 'int insertar'), ['FUNCION_TIPO_RETORNO']),
  tadLista(1, 'sin declarar obtener', LISTA_H.replace('int obtener(TLista l, int pos);\n', ''), ['PROTOTIPO_FALTA']),
  tadLista(1, 'con algo afuera', LISTA_H + '\n\nTResultado eliminar(TLista *l, int pos);', ['ENCABEZADO_FUERA_DE_LA_GUARDA']),
  tadLista(2, 'completo', LISTA_C),
  tadLista(
    2,
    'insertar que corre desde la posicion hacia el final',
    LISTA_C.replace('  for (int i = l->cantidad; i > pos; i--) {\n    l->elementos[i] = l->elementos[i - 1];\n  }', '  for (int i = pos; i < l->cantidad; i++) {\n    l->elementos[i + 1] = l->elementos[i];\n  }'),
    ['DEVUELVE_DISTINTO']
  ),
  tadLista(2, 'insertar sin sumar a la cantidad', LISTA_C.replace('  l->cantidad = l->cantidad + 1;\n', ''), ['DEVUELVE_DISTINTO']),
  tadLista(2, 'insertar sin guardar el numero', LISTA_C.replace('  l->elementos[pos] = x;\n', ''), ['DEVUELVE_DISTINTO']),
  tadLista(2, 'insertar sin correr los elementos', LISTA_C.replace('  for (int i = l->cantidad; i > pos; i--) {\n    l->elementos[i] = l->elementos[i - 1];\n  }\n', ''), ['DEVUELVE_DISTINTO']),
  tadLista(2, 'insertar que no admite el final', LISTA_C.replace('pos > l->cantidad', 'pos >= l->cantidad'), ['DEVUELVE_DISTINTO']),
  tadLista(2, 'insertar sin mirar las posiciones negativas', LISTA_C.replace('pos < 0 || ', ''), ['INDICE_FUERA_DE_RANGO']),
  tadLista(2, 'insertar que confunde los dos errores', LISTA_C.replace('    return LISTA_LLENA;', '    return POSICION_INVALIDA;'), ['DEVUELVE_DISTINTO']),
  tadLista(
    2,
    'insertar que mira la posicion antes que si esta llena',
    LISTA_C.replace(
      '  if (l->cantidad == MAX) {\n    return LISTA_LLENA;\n  }\n  if (pos < 0 || pos > l->cantidad) {\n    return POSICION_INVALIDA;\n  }',
      '  if (pos < 0 || pos > l->cantidad) {\n    return POSICION_INVALIDA;\n  }\n  if (l->cantidad == MAX) {\n    return LISTA_LLENA;\n  }'
    ),
    ['DEVUELVE_DISTINTO']
  ),
  tadLista(2, 'insertar sin controlar si esta llena', LISTA_C.replace('  if (l->cantidad == MAX) {\n    return LISTA_LLENA;\n  }\n', ''), ['INDICE_FUERA_DE_RANGO']),
  tadLista(2, 'obtener que devuelve la posicion siguiente', LISTA_C.replace('return l.elementos[pos];', 'return l.elementos[pos + 1];'), ['DEVUELVE_DISTINTO']),
  tadLista(2, 'longitud que devuelve el maximo', LISTA_C.replace('return l.cantidad;', 'return MAX;'), ['DEVUELVE_DISTINTO']),
  tadLista(2, 'inicializar que no pone la cantidad en 0', LISTA_C.replace('  l->cantidad = 0;', '  l->cantidad = l->cantidad;'), ['DEVUELVE_DISTINTO']),
  tadLista(2, 'sin definir obtener', LISTA_C.replace('int obtener(TLista l, int pos) {\n  return l.elementos[pos];\n}\n\n', ''), ['PROTOTIPO_SIN_DEFINICION']),
  tadLista(3, 'empieza por el ultimo para no pisar', '1'),
  tadLista(3, 'para hacer menos copias', '0', ['OPCION_LISTA_MENOS_COPIAS']),
  tadLista(3, 'solo se recorre hacia atras', '2', ['OPCION_LISTA_SOLO_ATRAS']),
  tadLista(4, 'el main correcto', LISTA_MAIN),
  tadLista(4, 'avisando cuando si pudo', LISTA_MAIN.replace('== OK', '== LISTA_LLENA'), ['MUESTRA_FALTA']),
  tadLista(4, 'cargando al principio en vez de al final', LISTA_MAIN.replace('insertar(&l, longitud(l), x);', 'insertar(&l, 0, x);'), ['MUESTRA_DISTINTA']),
  tadLista(4, 'con un mensaje para pedir los datos', LISTA_MAIN.replace('  scanf("%d", &pos);', '  printf("Posicion: ");\n  scanf("%d", &pos);'), ['MUESTRA_DISTINTA']),
  tadLista(4, 'mirando el arreglo', LISTA_MAIN.replace('obtener(l, i)', 'l.elementos[i]'), ['TAD_ACCESO_DIRECTO', 'TAD_OPERACION_SIN_USAR']),
  tadListaAmpliar(1, 'completo', LISTA_H_AMPLIADO),
  tadListaAmpliar(1, 'sin declarar eliminar', LISTA_H_AMPLIADO.replace('TResultado eliminar(TLista *l, int pos);\n', ''), ['PROTOTIPO_FALTA']),
  tadListaAmpliar(1, 'eliminar con la lista por valor', LISTA_H_AMPLIADO.replace('eliminar(TLista *l,', 'eliminar(TLista l,'), ['PARAMETRO_REFERENCIA_FALTA']),
  tadListaAmpliar(1, 'eliminar devuelve void', LISTA_H_AMPLIADO.replace('TResultado eliminar', 'void eliminar'), ['FUNCION_TIPO_RETORNO']),
  tadListaAmpliar(1, 'eliminar despues del endif', LISTA_H_AMPLIADO.replace('TResultado eliminar(TLista *l, int pos);\n\n#endif', '\n#endif\nTResultado eliminar(TLista *l, int pos);'), ['ENCABEZADO_FUERA_DE_LA_GUARDA']),
  tadListaAmpliar(2, 'completo', LISTA_C_AMPLIADO),
  tadListaAmpliar(2, 'eliminar sin restar a la cantidad', LISTA_C_AMPLIADO.replace('  l->cantidad = l->cantidad - 1;\n', ''), ['DEVUELVE_DISTINTO']),
  tadListaAmpliar(2, 'eliminar sin correr los elementos', LISTA_C_AMPLIADO.replace('  for (int i = pos; i < l->cantidad - 1; i++) {\n    l->elementos[i] = l->elementos[i + 1];\n  }\n', ''), ['DEVUELVE_DISTINTO']),
  tadListaAmpliar(2, 'eliminar que acepta la posicion cantidad', LISTA_C_AMPLIADO.replace('pos >= l->cantidad', 'pos > l->cantidad'), ['DEVUELVE_DISTINTO']),
  tadListaAmpliar(2, 'eliminar sin mirar las posiciones negativas', LISTA_C_AMPLIADO.replace('pos < 0 || pos >= l->cantidad', 'pos >= l->cantidad'), ['INDICE_FUERA_DE_RANGO']),
  tadListaAmpliar(2, 'eliminar que devuelve siempre OK', LISTA_C_AMPLIADO.replace('  if (pos < 0 || pos >= l->cantidad) {\n    return POSICION_INVALIDA;\n  }\n  for (int i = pos;', '  for (int i = pos;'), ['DEVUELVE_DISTINTO']),
  tadListaAmpliar(2, 'sin definir eliminar', LISTA_C_AMPLIADO.slice(0, LISTA_C_AMPLIADO.indexOf('\n\nTResultado eliminar')), ['PROTOTIPO_SIN_DEFINICION']),
  tadListaAmpliar(2, 'insertar roto al agregar eliminar', LISTA_C_AMPLIADO.replace('i > pos; i--', 'i > pos + 1; i--'), ['DEVUELVE_DISTINTO']),
  tadListaAmpliar(3, 'el main correcto', LISTA_MAIN_INTERCAMBIAR),
  tadListaAmpliar(3, 'sin eliminar', LISTA_MAIN_INTERCAMBIAR.replace('  eliminar(&l, p);\n', '').replace('  eliminar(&l, q);\n', ''), ['TAD_OPERACION_SIN_USAR']),
  tadListaAmpliar(3, 'dejando el mismo valor en las dos', LISTA_MAIN_INTERCAMBIAR.replace('insertar(&l, q, a);', 'insertar(&l, q, b);'), ['MUESTRA_DISTINTA']),
  tadListaAmpliar(3, 'cambiando solo una de las dos', LISTA_MAIN_INTERCAMBIAR.replace('  eliminar(&l, q);\n  insertar(&l, q, a);\n', ''), ['MUESTRA_DISTINTA']),
  tadListaAmpliar(
    3,
    'sacando las dos antes de insertar',
    LISTA_MAIN_INTERCAMBIAR.replace('  eliminar(&l, p);\n  insertar(&l, p, b);\n  eliminar(&l, q);\n  insertar(&l, q, a);', '  eliminar(&l, p);\n  eliminar(&l, q);\n  insertar(&l, p, b);\n  insertar(&l, q, a);'),
    ['MUESTRA_DISTINTA']
  ),
  tadListaUsar(1, 'insertar en orden correcto', LISTA_ORDENADO),
  tadListaUsar(1, 'con menor estricto, que da lo mismo', LISTA_ORDENADO.replace('<= x', '< x')),
  tadListaUsar(1, 'siempre al final', LISTA_ORDENADO.replace('    while (pos < longitud(l) && obtener(l, pos) <= x) {\n      pos = pos + 1;\n    }\n', '    pos = longitud(l);\n'), ['MUESTRA_DISTINTA']),
  tadListaUsar(1, 'de mayor a menor', LISTA_ORDENADO.replace('<= x', '>= x'), ['MUESTRA_DISTINTA']),
  tadListaUsar(1, 'sin mirar hasta donde llega la lista', LISTA_ORDENADO.replace('pos < longitud(l) && ', ''), ['TAD_USO_INCORRECTO']),
  tadListaUsar(2, 'quitar correcto', LISTA_QUITAR),
  tadListaUsar(
    2,
    'avanzando siempre, se saltea el que sigue',
    LISTA_QUITAR.replace('      eliminar(&l, pos);\n    } else {\n      pos = pos + 1;\n    }', '      eliminar(&l, pos);\n    }\n    pos = pos + 1;'),
    ['MUESTRA_DISTINTA']
  ),
  tadListaUsar(2, 'sin eliminar', LISTA_QUITAR.replace('      eliminar(&l, pos);\n', '      pos = pos + 1;\n'), ['TAD_OPERACION_SIN_USAR']),
  tadListaUsar(2, 'quitando solo la primera aparicion', LISTA_QUITAR.replace('      eliminar(&l, pos);\n', '      eliminar(&l, pos);\n      pos = longitud(l);\n'), ['MUESTRA_DISTINTA']),
  tadListaUsar(3, 'invertir correcto', LISTA_INVERTIR),
  tadListaUsar(3, 'con una lista auxiliar', LISTA_INVERTIR.replace('  TLista l;\n', '  TLista l;\n  TLista aux;\n'), ['TAD_VARIABLE_AUXILIAR']),
  tadListaUsar(3, 'invirtiendo toda la lista dos veces', LISTA_INVERTIR.replace('longitud(l) / 2', 'longitud(l)'), ['MUESTRA_DISTINTA']),
  tadListaUsar(3, 'sin sacar y volver a meter', LISTA_INVERTIR.replace('  eliminar(&l, i);\n', '').replace('  eliminar(&l, j);\n', ''), ['TAD_OPERACION_SIN_USAR']),
  tadListaUsar(3, 'dejando el mismo valor en las dos posiciones', LISTA_INVERTIR.replace('insertar(&l, j, a);', 'insertar(&l, j, b);'), ['MUESTRA_DISTINTA']),
];
