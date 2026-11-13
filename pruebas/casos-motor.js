// Casos del motor de memoria (js/motor/interprete.js).
//
//   nombre:  que se prueba
//   codigo:  el programa (con main)
//   entrada: el texto que se escribe por teclado, si lee
//   espera:  { salida, retorno, error: 'CODIGO', fila, fugas: cantidad, lineas: [...] }
//            "lineas" son las lineas que recorre la traza, en orden, sin la final.

const LISTA = `#include <stdio.h>
#include <stdlib.h>
typedef struct nodo {
  int dato;
  struct nodo *sig;
} TNodo;
`;

const MOSTRAR = `void mostrar(TNodo *p) {
  while (p != NULL) {
    printf("%d ", p->dato);
    p = p->sig;
  }
  printf("\\n");
}
`;

export const CASOS_DEL_MOTOR = [
  // ------------------------------------------------------------ lo basico
  { nombre: 'printf con numeros y texto', codigo: `int main() { printf("Hola %d y %c y %s", 42, 'x', "mundo"); return 0; }`, espera: { salida: 'Hola 42 y x y mundo', retorno: 0 } },
  { nombre: 'decimales con printf', codigo: `int main() { float f = 2.5; double d = 1.0 / 3; printf("%.2f %f %5.1f|%-6d|%04d", f, d, 3.14159, 7, 42); return 0; }`, espera: { salida: '2.50 0.333333   3.1|7     |0042' } },
  { nombre: 'aritmetica entera trunca y respeta el signo', codigo: `int main() { printf("%d %d %d %d", 7 / 2, -7 / 2, 7 % 3, -7 % 3); return 0; }`, espera: { salida: '3 -3 1 -1' } },
  { nombre: 'int y decimal se mezclan', codigo: `int main() { int a = 7; float b = a / 2; float c = a / 2.0; printf("%.1f %.1f", b, c); return 0; }`, espera: { salida: '3.0 3.5' } },
  { nombre: 'un int se pasa de rango y da la vuelta', codigo: `int main() { int a = 2147483647; a = a + 1; printf("%d", a); return 0; }`, espera: { salida: '-2147483648' } },
  { nombre: 'un char guarda numeros chicos', codigo: `int main() { char c = 'A'; c = c + 1; printf("%c %d", c, c); return 0; }`, espera: { salida: 'B 66' } },
  { nombre: 'una constante con define', codigo: `#define MAX 5\nint main() { int v[MAX]; printf("%d", (int) sizeof(v) / (int) sizeof(v[0])); return 0; }`, espera: { salida: '5' } },
  { nombre: 'un enumerado', codigo: `enum Color { ROJO, VERDE = 5, AZUL };\nint main() { printf("%d %d %d", ROJO, VERDE, AZUL); return 0; }`, espera: { salida: '0 5 6' } },
  { nombre: 'devuelve lo que devuelve main', codigo: `int main() { return 7; }`, espera: { retorno: 7 } },

  // ----------------------------------------------------- control de flujo
  { nombre: 'if else', codigo: `int main() { int n = 5; if (n > 3) printf("a"); else printf("b"); if (n > 9) printf("c"); else if (n > 4) printf("d"); else printf("e"); return 0; }`, espera: { salida: 'ad' } },
  { nombre: 'for con break y continue', codigo: `int main() { for (int i = 0; i < 10; i++) { if (i == 2) continue; if (i == 5) break; printf("%d", i); } return 0; }`, espera: { salida: '0134' } },
  { nombre: 'while y do while', codigo: `int main() { int i = 3; while (i > 0) { printf("%d", i); i--; } do { printf("x"); } while (i > 0); return 0; }`, espera: { salida: '321x' } },
  { nombre: 'switch con break y sin break', codigo: `int main() { for (int i = 0; i < 4; i++) { switch (i) { case 0: printf("a"); break; case 1: printf("b"); case 2: printf("c"); break; default: printf("d"); } } return 0; }`, espera: { salida: 'abccd' } },
  { nombre: 'un ciclo que no termina', codigo: `int main() { while (1) { } return 0; }`, espera: { error: 'NO_TERMINA' } },

  // -------------------------------------------------------------- funciones
  { nombre: 'una funcion con parametros', codigo: `int suma(int a, int b) { return a + b; }\nint main() { printf("%d", suma(3, 4)); return 0; }`, espera: { salida: '7' } },
  { nombre: 'recursion: factorial', codigo: `int fact(int n) { if (n <= 1) return 1; return n * fact(n - 1); }\nint main() { printf("%d", fact(5)); return 0; }`, espera: { salida: '120' } },
  { nombre: 'recursion sin fin', codigo: `int f(int n) { return f(n + 1); }\nint main() { return f(0); }`, espera: { error: 'RECURSION_SIN_FIN' } },
  { nombre: 'un parametro por valor no cambia el de afuera', codigo: `void cambiar(int x) { x = 99; }\nint main() { int n = 1; cambiar(n); printf("%d", n); return 0; }`, espera: { salida: '1' } },
  { nombre: 'un parametro por referencia cambia el de afuera', codigo: `void cambiar(int *x) { *x = 99; }\nint main() { int n = 1; cambiar(&n); printf("%d", n); return 0; }`, espera: { salida: '99' } },
  { nombre: 'intercambiar dos variables', codigo: `void swap(int *a, int *b) { int t = *a; *a = *b; *b = t; }\nint main() { int x = 1, y = 2; swap(&x, &y); printf("%d %d", x, y); return 0; }`, espera: { salida: '2 1' } },
  { nombre: 'una variable local no se ve en otra funcion', codigo: `void f() { x = 1; }\nint main() { int x = 0; f(); return 0; }`, espera: { error: 'NOMBRE_DESCONOCIDO' } },
  { nombre: 'una variable global', codigo: `int total = 10;\nvoid sumar(int n) { total += n; }\nint main() { sumar(5); printf("%d", total); return 0; }`, espera: { salida: '15' } },

  // --------------------------------------------------------------- lectura
  { nombre: 'scanf de enteros y decimales', codigo: `int main() { int a; float b; double c; scanf("%d %f %lf", &a, &b, &c); printf("%d %.1f %.2f", a, b, c); return 0; }`, entrada: '4 2.5 7.25', espera: { salida: '4 2.5 7.25' } },
  { nombre: 'scanf de una cadena', codigo: `int main() { char nombre[20]; scanf("%s", nombre); printf("Hola %s", nombre); return 0; }`, entrada: 'Ana', espera: { salida: 'Hola Ana' } },
  { nombre: 'scanf sin el ampersand', codigo: `int main() { int n; scanf("%d", n); return 0; }`, entrada: '5', espera: { error: 'AMPERSAND_FALTA' } },
  { nombre: 'scanf con el formato de otro tipo', codigo: `int main() { double d; scanf("%f", &d); return 0; }`, entrada: '5', espera: { error: 'FORMATO_DISTINTO' } },
  { nombre: 'printf con el formato de otro tipo', codigo: `int main() { float f = 1.5; printf("%d", f); return 0; }`, espera: { error: 'FORMATO_DISTINTO' } },
  { nombre: 'usar una variable sin valor', codigo: `int main() { int a; printf("%d", a + 1); return 0; }`, espera: { error: 'VARIABLE_SIN_VALOR', fila: 1 } },

  // ----------------------------------------------- arreglos, cadenas y structs
  { nombre: 'un arreglo con valores iniciales', codigo: `int main() { int v[5] = {1, 2, 3}; int s = 0; for (int i = 0; i < 5; i++) s += v[i]; printf("%d", s); return 0; }`, espera: { salida: '6' } },
  { nombre: 'una posicion fuera del arreglo', codigo: `int main() { int v[3] = {1, 2, 3}; v[3] = 9; return 0; }`, espera: { error: 'FUERA_DE_RANGO' } },
  { nombre: 'una tabla', codigo: `int main() { int m[2][3] = {{1, 2, 3}, {4, 5, 6}}; printf("%d %d", m[1][2], m[0][1]); return 0; }`, espera: { salida: '6 2' } },
  { nombre: 'strlen, strcpy y strcmp', codigo: `#include <string.h>\nint main() { char a[10]; strcpy(a, "hola"); printf("%d %d %d", (int) strlen(a), strcmp(a, "hola"), strcmp(a, "zzz")); return 0; }`, espera: { salida: '4 0 -1' } },
  { nombre: 'un texto que no entra', codigo: `#include <string.h>\nint main() { char a[3]; strcpy(a, "hola"); return 0; }`, espera: { error: 'FUERA_DE_RANGO' } },
  { nombre: 'escribir en un texto entre comillas', codigo: `int main() { char *s = "hola"; s[0] = 'H'; return 0; }`, espera: { error: 'ESCRITURA_EN_TEXTO' } },
  { nombre: 'una estructura y sus campos', codigo: `typedef struct { int dia; int mes; } TFecha;\nint main() { TFecha f; f.dia = 3; f.mes = 4; TFecha g = f; g.dia = 9; printf("%d %d %d", f.dia, g.dia, g.mes); return 0; }`, espera: { salida: '3 9 4' } },
  { nombre: 'una estructura dentro de otra, por valor', codigo: `typedef struct { int d; } TF;\ntypedef struct { int n; TF f; } TT;\nTF dame(TT t) { return t.f; }\nint main() { TT t = {1, {7}}; TF f = dame(t); f.d = 8; printf("%d %d", t.f.d, f.d); return 0; }`, espera: { salida: '7 8' } },
  { nombre: 'sizeof de una estructura con alineacion', codigo: `typedef struct { char c; int n; } T;\ntypedef struct nodo { int d; struct nodo *s; } N;\nint main() { printf("%d %d", (int) sizeof(T), (int) sizeof(N)); return 0; }`, espera: { salida: '8 16' } },

  // ----------------------------------------------------------------- punteros
  { nombre: 'un puntero a un entero', codigo: `int main() { int n = 5; int *p = &n; *p = *p + 1; printf("%d", n); return 0; }`, espera: { salida: '6' } },
  { nombre: 'dos punteros a lo mismo se comparan', codigo: `int main() { int a = 1, b = 1; int *p = &a, *q = &a, *r = &b; printf("%d %d", p == q, p == r); return 0; }`, espera: { salida: '1 0' } },
  { nombre: 'aritmetica de punteros en un arreglo', codigo: `int main() { int v[4] = {10, 20, 30, 40}; int *p = v; p++; printf("%d %d %d", *p, *(p + 2), p[1]); return 0; }`, espera: { salida: '20 40 30' } },
  { nombre: 'un puntero a una estructura', codigo: `typedef struct { int edad; } TA;\nint main() { TA a; TA *p = &a; p->edad = 20; (*p).edad += 1; printf("%d", a.edad); return 0; }`, espera: { salida: '21' } },
  { nombre: 'un puntero NULL', codigo: `int main() { int *p = NULL; printf("%d", *p); return 0; }`, espera: { error: 'DESREFERENCIA_NULA' } },
  { nombre: 'un puntero sin inicializar', codigo: `int main() { int *p; *p = 3; return 0; }`, espera: { error: 'VARIABLE_SIN_VALOR' } },
  { nombre: 'una variable local que ya termino', codigo: `int *dame() { int x = 5; return &x; }\nint main() { int *p = dame(); printf("%d", *p); return 0; }`, espera: { error: 'VARIABLE_FUERA_DE_ALCANCE' } },
  { nombre: 'una variable de un bloque que ya termino', codigo: `int main() { int *p; { int x = 5; p = &x; } printf("%d", *p); return 0; }`, espera: { error: 'VARIABLE_FUERA_DE_ALCANCE' } },

  // ------------------------------------------------------- memoria dinamica
  { nombre: 'malloc de un entero', codigo: `#include <stdlib.h>\nint main() { int *p = malloc(sizeof(int)); *p = 5; printf("%d", *p); free(p); return 0; }`, espera: { salida: '5', fugas: 0 } },
  { nombre: 'malloc con cast', codigo: `#include <stdlib.h>\nint main() { int *p = (int *) malloc(sizeof(int)); *p = 6; printf("%d", *p); free(p); return 0; }`, espera: { salida: '6', fugas: 0 } },
  { nombre: 'un arreglo dinamico', codigo: `#include <stdlib.h>\nint main() { int n = 4; int *v = malloc(n * sizeof(int)); for (int i = 0; i < n; i++) v[i] = i * i; int s = 0; for (int i = 0; i < n; i++) s += v[i]; printf("%d", s); free(v); return 0; }`, espera: { salida: '14', fugas: 0 } },
  { nombre: 'calloc deja todo en cero', codigo: `#include <stdlib.h>\nint main() { int *v = calloc(3, sizeof(int)); printf("%d%d%d", v[0], v[1], v[2]); free(v); return 0; }`, espera: { salida: '000' } },
  { nombre: 'una estructura en el monticulo', codigo: `#include <stdlib.h>\ntypedef struct { int edad; } TA;\nint main() { TA *a = malloc(sizeof(TA)); a->edad = 30; printf("%d", a->edad); free(a); return 0; }`, espera: { salida: '30', fugas: 0 } },
  { nombre: 'realloc agranda y conserva', codigo: `#include <stdlib.h>\nint main() { int *v = malloc(2 * sizeof(int)); v[0] = 1; v[1] = 2; v = realloc(v, 4 * sizeof(int)); v[3] = 4; printf("%d %d %d", v[0], v[1], v[3]); free(v); return 0; }`, espera: { salida: '1 2 4', fugas: 0 } },
  { nombre: 'una fuga: se pierde la unica direccion', codigo: `#include <stdlib.h>\nint main() { int *p = malloc(sizeof(int)); p = NULL; return 0; }`, espera: { fugas: 1 } },
  { nombre: 'usar un bloque despues de liberarlo', codigo: `#include <stdlib.h>\nint main() { int *p = malloc(sizeof(int)); *p = 1; free(p); printf("%d", *p); return 0; }`, espera: { error: 'USO_DE_MEMORIA_LIBERADA' } },
  { nombre: 'liberar dos veces', codigo: `#include <stdlib.h>\nint main() { int *p = malloc(sizeof(int)); free(p); free(p); return 0; }`, espera: { error: 'LIBERACION_DOBLE' } },
  { nombre: 'liberar algo que no viene de malloc', codigo: `#include <stdlib.h>\nint main() { int n = 1; free(&n); return 0; }`, espera: { error: 'LIBERACION_INVALIDA' } },
  { nombre: 'liberar desde el medio del bloque', codigo: `#include <stdlib.h>\nint main() { int *v = malloc(3 * sizeof(int)); free(v + 1); return 0; }`, espera: { error: 'LIBERACION_INVALIDA' } },
  { nombre: 'escribir mas alla del bloque', codigo: `#include <stdlib.h>\nint main() { int *v = malloc(3 * sizeof(int)); v[3] = 1; return 0; }`, espera: { error: 'FUERA_DE_BLOQUE' } },
  { nombre: 'malloc con la cantidad de bytes mal calculada', codigo: `#include <stdlib.h>\nint main() { int n = 4; int *v = malloc(n); v[1] = 7; return 0; }`, espera: { error: 'FUERA_DE_BLOQUE' } },
  { nombre: 'free(NULL) no hace nada', codigo: `#include <stdlib.h>\nint main() { free(NULL); return 0; }`, espera: { salida: '', fugas: 0 } },
  { nombre: 'un bloque nunca liberado de una funcion', codigo: `#include <stdlib.h>\nvoid f() { int *p = malloc(sizeof(int)); *p = 1; }\nint main() { f(); f(); return 0; }`, espera: { fugas: 2 } },

  // --------------------------------------------------------- listas enlazadas
  {
    nombre: 'insertar al inicio devolviendo la cabeza',
    codigo: `${LISTA}${MOSTRAR}TNodo *insertar(TNodo *lista, int x) {
  TNodo *nuevo = malloc(sizeof(TNodo));
  nuevo->dato = x;
  nuevo->sig = lista;
  return nuevo;
}
int main() {
  TNodo *lista = NULL;
  for (int i = 1; i <= 3; i++) lista = insertar(lista, i);
  mostrar(lista);
  return 0;
}`,
    espera: { salida: '3 2 1 \n', fugas: 3 },
  },
  {
    nombre: 'insertar al inicio con un doble puntero',
    codigo: `${LISTA}${MOSTRAR}void insertar(TNodo **lista, int x) {
  TNodo *nuevo = malloc(sizeof(TNodo));
  nuevo->dato = x;
  nuevo->sig = *lista;
  *lista = nuevo;
}
int main() {
  TNodo *lista = NULL;
  insertar(&lista, 1);
  insertar(&lista, 2);
  mostrar(lista);
  return 0;
}`,
    espera: { salida: '2 1 \n', fugas: 2 },
  },
  {
    nombre: 'insertar al final recorriendo hasta el ultimo',
    codigo: `${LISTA}${MOSTRAR}void agregar(TNodo **lista, int x) {
  TNodo *nuevo = malloc(sizeof(TNodo));
  nuevo->dato = x;
  nuevo->sig = NULL;
  if (*lista == NULL) {
    *lista = nuevo;
  } else {
    TNodo *p = *lista;
    while (p->sig != NULL) p = p->sig;
    p->sig = nuevo;
  }
}
int main() {
  TNodo *lista = NULL;
  agregar(&lista, 1);
  agregar(&lista, 2);
  agregar(&lista, 3);
  mostrar(lista);
  return 0;
}`,
    espera: { salida: '1 2 3 \n' },
  },
  {
    nombre: 'liberar toda la lista',
    codigo: `${LISTA}void liberar(TNodo **lista) {
  while (*lista != NULL) {
    TNodo *p = *lista;
    *lista = p->sig;
    free(p);
  }
}
int main() {
  TNodo *lista = NULL;
  for (int i = 0; i < 4; i++) {
    TNodo *n = malloc(sizeof(TNodo));
    n->dato = i;
    n->sig = lista;
    lista = n;
  }
  liberar(&lista);
  printf("%d", lista == NULL);
  return 0;
}`,
    espera: { salida: '1', fugas: 0 },
  },
  {
    nombre: 'liberar un nodo y seguir usandolo para avanzar',
    codigo: `${LISTA}int main() {
  TNodo *lista = malloc(sizeof(TNodo));
  lista->dato = 1;
  lista->sig = NULL;
  TNodo *p = lista;
  free(p);
  p = p->sig;
  return 0;
}`,
    espera: { error: 'USO_DE_MEMORIA_LIBERADA', fila: 13 },
  },
  {
    nombre: 'recorrer una lista cuyo ultimo nodo no apunta a NULL',
    codigo: `${LISTA}int main() {
  TNodo *a = malloc(sizeof(TNodo));
  a->dato = 1;
  TNodo *p = a;
  while (p != NULL) p = p->sig;
  return 0;
}`,
    espera: { error: 'VARIABLE_SIN_VALOR' },
  },
  {
    nombre: 'pasar la cabeza por valor no la cambia de afuera',
    codigo: `${LISTA}void agregar(TNodo *lista, int x) {
  TNodo *n = malloc(sizeof(TNodo));
  n->dato = x;
  n->sig = lista;
  lista = n;
}
int main() {
  TNodo *lista = NULL;
  agregar(lista, 1);
  printf("%d", lista == NULL);
  return 0;
}`,
    espera: { salida: '1', fugas: 1 },
  },

  // --------------------------------------------------------------------- traza
  {
    nombre: 'la traza recorre las lineas en orden',
    codigo: `int main() {
  int a = 1;
  int b = 2;
  a = a + b;
  return 0;
}`,
    espera: { lineas: [2, 3, 4, 5] },
  },
  {
    nombre: 'la traza de un ciclo repite la linea del for',
    codigo: `int main() {
  int s = 0;
  for (int i = 0; i < 2; i++) {
    s += i;
  }
  return 0;
}`,
    espera: { lineas: [2, 3, 4, 3, 4, 3, 6] },
  },
  {
    nombre: 'la traza guarda el montículo y los marcos',
    codigo: `#include <stdlib.h>
int main() {
  int *p = malloc(sizeof(int));
  *p = 7;
  free(p);
  return 0;
}`,
    espera: { lineas: [3, 4, 5, 6], traza: (t) => {
      const antesDeLiberar = t[2];
      const bloque = antesDeLiberar.monticulo[0];
      const p = antesDeLiberar.marcos[0].variables.find((v) => v.nombre === 'p');
      const final = t[t.length - 1];
      return bloque && bloque.vivo && bloque.valor.elems[0].v === 7 && p.valor.k === 'ptr' && p.valor.a === bloque.id && final.monticulo[0].vivo === false
        ? '' : 'la traza no muestra el bloque, el puntero o la liberacion';
    } },
  },
  {
    nombre: 'un error deja la traza con el estado y la linea del error',
    codigo: `int main() {
  int *p = 0;
  *p = 1;
  return 0;
}`,
    espera: { error: 'DESREFERENCIA_NULA', fila: 3, lineas: [2, 3], traza: (t) => (t[t.length - 1].error === 'DESREFERENCIA_NULA' && t[t.length - 1].linea === 3 ? '' : 'falta el error en la ultima fotografia') },
  },
  {
    nombre: 'las variables del cuerpo estan desde el comienzo, sin valor, hasta que se las declara',
    codigo: `int main() {
  int a = 1;
  int b = 2;
  for (int i = 0; i < 1; i++) {
    a = a + b;
  }
  return a;
}`,
    espera: { lineas: [2, 3, 4, 5, 4, 7], traza: (t) => {
      const nombres = (f, pendiente) => f.marcos[0].variables.filter((v) => Boolean(v.pendiente) === pendiente).map((v) => v.nombre).join();
      if (nombres(t[0], true) !== 'a,b' || nombres(t[0], false) !== '') return 'al comenzar a y b tienen que estar pendientes';
      if (nombres(t[1], true) !== 'b' || nombres(t[1], false) !== 'a') return 'despues de declarar a, solo b esta pendiente';
      if (nombres(t[2], true) !== '' || nombres(t[2], false) !== 'a,b') return 'despues de declarar b no queda ninguna pendiente';
      if (nombres(t[3], false) !== 'a,b,i') return 'la i del for aparece al entrar al ciclo';
      if (nombres(t[t.length - 2], false).includes('i')) return 'la i desaparece al salir del ciclo';
      return '';
    } },
  },
  {
    nombre: 'una estructura pendiente ya tiene la forma que va a tener',
    codigo: `typedef struct { int dia; int mes; } TFecha;
int main() {
  TFecha f;
  f.dia = 1;
  return 0;
}`,
    espera: { lineas: [3, 4, 5], traza: (t) => {
      const v = t[0].marcos[0].variables[0];
      return v.pendiente && v.valor.k === 'est' && v.valor.campos.length === 2 && v.valor.campos[0].v.k === 'sinvalor' ? '' : 'la estructura pendiente no tiene sus campos';
    } },
  },
  {
    nombre: 'una funcion sin return muestra su llave de cierre antes de salir',
    codigo: `void marcar(int *p) {
  *p = 1;
}

int main() {
  int n = 0;
  marcar(&n);
  return n;
}`,
    espera: { lineas: [6, 7, 2, 3, 8] },
  },
  {
    nombre: 'el resultado dice donde empieza y termina cada funcion',
    codigo: `int doble(int n) {
  return n * 2;
}

int main() {
  return doble(2);
}`,
    espera: { resultado: (r) => (JSON.stringify(r.funciones) === JSON.stringify([{ nombre: 'doble', desde: 1, hasta: 3 }, { nombre: 'main', desde: 5, hasta: 7 }]) ? '' : 'funciones: ' + JSON.stringify(r.funciones)) },
  },
];

export function resultadoDelMotor(analizador, ejecutar, caso) {
  const r = ejecutar(analizador, caso.codigo, { entrada: caso.entrada, traza: Boolean(caso.espera.lineas || caso.espera.traza) });
  if (caso.espera.resultado) {
    const m = caso.espera.resultado(r);
    if (m) return { bien: false, detalle: m };
  }
  const esp = caso.espera;
  const problemas = [];
  if (esp.error) {
    if (!r.error) problemas.push(`esperaba el error ${esp.error} y corrio sin error`);
    else if (r.error.codigo !== esp.error) problemas.push(`esperaba ${esp.error} y salio ${r.error.codigo}: ${r.error.mensaje}${r.error.datos && r.error.datos.pila ? '\n' + r.error.datos.pila : ''}`);
    else if (esp.fila != null && r.error.fila !== esp.fila) problemas.push(`el error tenia que estar en la linea ${esp.fila} y esta en la ${r.error.fila}`);
  } else if (r.error) {
    problemas.push(`no esperaba error y salio ${r.error.codigo}: ${r.error.mensaje} (linea ${r.error.fila})${r.error.datos && r.error.datos.pila ? '\n' + r.error.datos.pila : ''}`);
  }
  if (esp.salida != null && r.salida !== esp.salida) problemas.push(`salida: esperaba ${JSON.stringify(esp.salida)} y salio ${JSON.stringify(r.salida)}`);
  if (esp.retorno != null && r.retorno !== esp.retorno) problemas.push(`retorno: esperaba ${esp.retorno} y devolvio ${r.retorno}`);
  if (esp.fugas != null && !r.error && r.fugas.length !== esp.fugas) problemas.push(`fugas: esperaba ${esp.fugas} y hay ${r.fugas.length}`);
  if (esp.lineas) {
    const tiene = r.traza.filter((f) => f.linea != null && !f.error).map((f) => f.linea);
    if (JSON.stringify(tiene) !== JSON.stringify(esp.lineas)) problemas.push(`lineas: esperaba ${JSON.stringify(esp.lineas)} y recorrio ${JSON.stringify(tiene)}`);
  }
  if (esp.traza) {
    const m = esp.traza(r.traza);
    if (m) problemas.push(m);
  }
  return { bien: !problemas.length, detalle: problemas.join('\n') };
}

// ------------------------------------------------------------ la regla "memoria"
//
// Se prueba el corrector completo con una consigna armada en el momento:
//   regla:     lo que va dentro de { "memoria": ... }
//   respuesta: el programa del alumno
//   espera:    { ok: true } o { errores: [codigos], dice: [textos], linea, avisos: [codigos] }

const PROGRAMA_BUENO = `#include <stdio.h>
#include <stdlib.h>
int main() {
  int n;
  scanf("%d", &n);
  int *v = malloc(n * sizeof(int));
  for (int i = 0; i < n; i++) {
    v[i] = i * 2;
  }
  int s = 0;
  for (int i = 0; i < n; i++) {
    s += v[i];
  }
  printf("Suma: %d", s);
  free(v);
  return 0;
}`;

export const CASOS_DE_LA_REGLA = [
  { nombre: 'un programa correcto', regla: { casos: [{ entrada: '4', salida: 'Suma: 12' }, { entrada: '1', salida: 'Suma: 0' }], sinFugas: true, usa: ['malloc', 'free'] }, respuesta: PROGRAMA_BUENO, espera: { ok: true } },
  { nombre: 'sin free hay una fuga', regla: { casos: [{ entrada: '3', salida: 'Suma: 6' }], sinFugas: true }, respuesta: PROGRAMA_BUENO.replace('  free(v);\n', ''), espera: { errores: ['FUGA_DE_MEMORIA'], dice: ['Con la entrada `3`', 'sin liberar un bloque'] } },
  { nombre: 'sin malloc cuando la consigna lo pide', regla: { usa: ['malloc'] }, respuesta: `#include <stdio.h>\nint main() { int v[3]; v[0] = 1; printf("%d", v[0]); return 0; }`, espera: { errores: ['MALLOC_FALTA'] } },
  { nombre: 'un texto distinto', regla: { casos: [{ entrada: '4', salida: 'Suma: 12' }] }, respuesta: PROGRAMA_BUENO.replace('Suma: %d', 'Total: %d'), espera: { errores: ['MUESTRA_DISTINTA'] } },
  { nombre: 'un texto casi igual', regla: { casos: [{ entrada: '4', salida: 'Suma: 12' }] }, respuesta: PROGRAMA_BUENO.replace('Suma: %d', 'suma:  %d'), espera: { errores: ['MUESTRA_CASI_IGUAL'] } },
  { nombre: 'un programa que no muestra nada', regla: { casos: [{ entrada: '4', salida: 'Suma: 12' }] }, respuesta: PROGRAMA_BUENO.replace('  printf("Suma: %d", s);\n', ''), espera: { errores: ['MUESTRA_FALTA'] } },
  { nombre: 'usar un bloque liberado dice la linea', regla: { casos: [{ entrada: '2', salida: 'Suma: 2' }] }, respuesta: PROGRAMA_BUENO.replace('  free(v);\n', '  free(v);\n  s = v[1];\n'), espera: { errores: ['USO_DE_MEMORIA_LIBERADA'], linea: 16 } },
  { nombre: 'escribir mas alla del bloque', regla: { casos: [{ entrada: '3' }] }, respuesta: PROGRAMA_BUENO.replace('i < n; i++) {\n    v[i]', 'i <= n; i++) {\n    v[i]'), espera: { errores: ['FUERA_DE_BLOQUE'], dice: ['posición 3', '3 elementos'] } },
  { nombre: 'un programa que usa una construccion que no se sigue da un aviso', regla: { casos: [{ entrada: '2' }] }, respuesta: `#include <stdio.h>\nint main() { int x = 1; goto fin; fin: printf("%d", x); return 0; }`, espera: { ok: true, avisos: ['EJECUCION_NO_VERIFICADA'] } },
];

export function resultadoDeLaRegla(analizador, corregir, caso) {
  const consigna = { id: 'prueba-memoria', en: 'archivo', requiere: [{ memoria: caso.regla }] };
  const r = corregir(analizador, consigna, { respuesta: caso.respuesta });
  const esp = caso.espera;
  const errores = r.diagnosticos.filter((d) => d.nivel === 'error');
  const problemas = [];
  if (esp.ok && errores.length) problemas.push(`no esperaba errores y salio ${errores.map((d) => d.codigo)}: ${errores[0].mensaje}`);
  if (esp.errores) {
    const tiene = errores.map((d) => d.codigo).sort().join();
    if (tiene !== [...esp.errores].sort().join()) problemas.push(`esperaba [${esp.errores}] y salio [${tiene}]${errores[0] ? ': ' + errores[0].mensaje : ''}`);
  }
  for (const t of esp.dice || []) {
    if (!r.diagnosticos.some((d) => d.mensaje.includes(t))) problemas.push(`el mensaje no dice "${t}": ${r.diagnosticos.map((d) => d.mensaje).join(' | ')}`);
  }
  if (esp.linea != null && errores[0] && errores[0].linea !== esp.linea) problemas.push(`la linea tenia que ser ${esp.linea} y es ${errores[0].linea}`);
  for (const a of esp.avisos || []) {
    if (!r.diagnosticos.some((d) => d.codigo === a)) problemas.push(`falta el aviso ${a}`);
  }
  return { bien: !problemas.length, detalle: problemas.join('\n') };
}
