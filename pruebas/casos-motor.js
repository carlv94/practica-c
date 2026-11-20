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
  { nombre: 'malloc con un tamano que se pasa de entero da NULL', codigo: `#include <stdlib.h>
int main() { int n = 2000000000; int *v = malloc(n * 4); printf("%d", v == NULL); return 0; }`, espera: { salida: '1' } },
  { nombre: 'malloc con una cantidad enorme de enteros da NULL', codigo: `#include <stdlib.h>
int main() { int n = 2000000000; int *v = malloc(n * sizeof(int)); printf("%d", v == NULL); return 0; }`, espera: { salida: '1' } },
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

  // ------------------------------------------------------------ los accesos por puntero (para animarlos)
  {
    nombre: 'un acceso con ** pasa por el puntero del medio',
    codigo: String.raw`#include <stdio.h>
int main() {
  int n = 3;
  int *p = &n;
  int **pp = &p;

  **pp = 8;
  return 0;
}`,
    espera: {
      salida: '',
      traza: (traza) => {
        const dobles = traza.filter((x) => x.accesos && x.accesos.length === 2);
        if (dobles.length !== 1) return 'tenia que haber un paso con dos saltos y hay ' + dobles.length;
        const [uno, dos] = dobles[0].accesos;
        if (uno.a.a !== dos.de.a) return 'el segundo salto tiene que salir de donde llego el primero';
        return null;
      },
    },
  },
  {
    nombre: 'una recursion saca una fotografia "por devolver" por cada llamada que devuelve un valor (tambien la base); las funciones comunes no',
    codigo: String.raw`#include <stdio.h>
int doble(int x) {
  return x * 2;
}
int quitar(int n, int d) {
  if (n == 0) {
    return 0;
  }
  if (n % 10 == d) {
    return quitar(n / 10, d);
  }
  return quitar(n / 10, d) * 10 + n % 10;
}
int main() {
  int a = doble(4);
  printf("%d", quitar(2132, 1));
  return 0;
}`,
    espera: {
      salida: '232',
      traza: (traza) => {
        const con = traza.filter((f) => f.retorno);
        // quitar(0) (la base), quitar(2), quitar(21), quitar(213), quitar(2132): cinco llamadas que devuelven un valor
        if (con.length !== 5) return 'tenia que haber 5 retornos y hay ' + con.length;
        const valores = con.map((f) => f.retorno.texto).join();
        // el primero en cerrarse es el de la base, que devuelve 0; el ultimo, el de quitar(2132), que devuelve 232
        if (valores !== '0,2,2,23,232') return 'los valores de los retornos tenian que ser 0,2,2,23,232 y son ' + valores;
        // en cada una, la caja que esta por cerrarse es la de arriba y las de abajo siguen
        const hondos = con.map((f) => f.marcos.length).join();
        if (hondos !== '6,5,4,3,2') return 'la pila de cada retorno tenia que tener 6,5,4,3,2 cajas y tiene ' + hondos;
        return null;
      },
    },
  },
  {
    nombre: 'el registro de llamadas de una recursion: cada llamada con su ida, su vuelta y desde que fotografia se conocen',
    codigo: String.raw`#include <stdio.h>
int doble(int x) {
  return x * 2;
}
int quitar(int n, int d) {
  if (n == 0) {
    return 0;
  }
  if (n % 10 == d) {
    return quitar(n / 10, d);
  }
  return quitar(n / 10, d) * 10 + n % 10;
}
int main() {
  int a = doble(4);
  printf("%d", quitar(2132, 1));
  return 0;
}`,
    espera: {
      salida: '232',
      traza: (traza, r) => {
        const filas = r.llamadas.map((l) => `${l.llamada} | ${l.ida && l.ida.texto} | ${l.vuelta && l.vuelta.texto} = ${l.vuelta && l.vuelta.valor}`);
        const esperadas = [
          'quitar(2132, 1) | quitar(213, 1) * 10 + 2 | 23 * 10 + 2 = 232',
          'quitar(213, 1) | quitar(21, 1) * 10 + 3 | 2 * 10 + 3 = 23',
          'quitar(21, 1) | quitar(2, 1) | 2 = 2',
          'quitar(2, 1) | quitar(0, 1) * 10 + 2 | 0 * 10 + 2 = 2',
          'quitar(0, 1) | 0 | 0 = 0',
        ];
        if (filas.join('\n') !== esperadas.join('\n')) return 'el registro tenia que ser\n' + esperadas.join('\n') + '\ny es\n' + filas.join('\n');
        // la funcion comun (doble) no se registra, y cada llamada tiene caja desde su "desde" hasta su "hasta"
        const l = r.llamadas;
        if (l.some((x) => x.funcion !== 'quitar')) return 'solo se registran las funciones recursivas';
        for (const x of l) {
          const hondo = (i) => traza[i].marcos.filter((m) => m.funcion === 'quitar').length;
          if (hondo(x.desde) < x.nivel) return `la llamada ${x.llamada} tenia que tener caja desde la fotografia ${x.desde}`;
          if (x.vuelta.paso < x.desde) return `la vuelta de ${x.llamada} no puede conocerse antes de empezar`;
        }
        // la ida de una llamada se conoce cuando empieza la que hace; la vuelta, cuando se cierra su caja (su fotografia de retorno)
        if (l[0].ida.paso !== l[1].desde) return 'la ida de la primera tenia que conocerse cuando empieza la segunda';
        if (!traza[l[0].vuelta.paso].retorno) return 'la vuelta de la primera tenia que conocerse en su fotografia de retorno';
        // la ida en partes: el texto y, en cada llamada, lo que va a devolver (para reemplazarla por su valor)
        const partes = JSON.stringify(l[1].ida.partes);
        if (partes !== '[{"llamada":"quitar(21, 1)","valor":"2","id":2}," * 10 + 3"]') return 'las partes de la ida de la segunda no son las esperadas: ' + partes;
        if (JSON.stringify(l[4].ida.partes) !== '["0"]') return 'la ida de la ultima tenia que ser solo el texto 0';
        // el caso base: la unica llamada que no hace otra a la funcion, en la fotografia de su return
        if (l.map((x) => x.base).join() !== ',,,,' + l[4].ida.paso) return 'solo la ultima llamada tenia que tener caso base, en la fotografia de su return: ' + l.map((x) => x.base).join();
        return null;
      },
    },
  },
  {
    nombre: 'un enumerado recuerda los nombres de sus valores: la traza y el trazado los escriben (FALSO y no 0)',
    codigo: String.raw`#include <stdio.h>
typedef enum {
  FALSO,
  VERDADERO
} TBool;
TBool pares(int n) {
  if (n == 0) {
    return VERDADERO;
  }
  return n % 2 == 0 && pares(n / 10);
}
int main() {
  TBool r = pares(24);
  printf("%d", r);
  return 0;
}`,
    espera: {
      salida: '1',
      traza: (traza, r) => {
        const filas = r.llamadas.map((l) => `${l.llamada} | ${l.ida.texto} | ${l.vuelta ? l.vuelta.texto + ' = ' + l.vuelta.valor : '-'}`);
        const esperadas = ['pares(24) | n % 2 == 0 && pares(2) | pares(2) = VERDADERO', 'pares(2) | n % 2 == 0 && pares(0) | pares(0) = VERDADERO', 'pares(0) | VERDADERO | VERDADERO = VERDADERO'];
        // (la ida y la vuelta de una cuenta con enumerados: lo que se sustituye es el valor de cada llamada)
        const reales = r.llamadas.map((l) => `${l.vuelta.valor}`);
        if (reales.join() !== 'VERDADERO,VERDADERO,VERDADERO') return 'los valores de las vueltas tenian que ser VERDADERO y son ' + reales + ' (' + filas.join(' // ') + ')';
        const retornos = traza.filter((f) => f.retorno).map((f) => f.retorno.texto);
        if (retornos.join() !== 'VERDADERO,VERDADERO,VERDADERO') return 'los carteles de retorno tenian que ser VERDADERO,VERDADERO,VERDADERO y son ' + retornos;
        // la variable de tipo enumerado lleva el nombre del valor
        const fin = traza.filter((f) => f.marcos.length === 1 && f.marcos[0].variables.some((v) => v.nombre === 'r' && v.valor.k === 'num'));
        const ultima = fin[fin.length - 1];
        const valorDeR = ultima && ultima.marcos[0].variables.find((v) => v.nombre === 'r').valor;
        if (!valorDeR || valorDeR.v !== 1 || valorDeR.enum !== 'VERDADERO') return 'la variable r tenia que valer 1 con el nombre VERDADERO y es ' + JSON.stringify(valorDeR);
        void esperadas;
        return null;
      },
    },
  },
  {
    nombre: 'una recursion que llama en una linea y devuelve despues: la ida es la linea, la vuelta la linea con el valor y lo que devuelve va aparte',
    codigo: String.raw`#include <stdio.h>
int mayorDigito(int n) {
  if (n < 10) {
    return n;
  }
  int resto = mayorDigito(n / 10);
  if (n % 10 > resto) {
    return n % 10;
  }
  return resto;
}
int main() {
  printf("%d\n", mayorDigito(4172));
  return 0;
}`,
    espera: {
      salida: '7\n',
      traza: (traza, r) => {
        const filas = r.llamadas.map((l) => `${l.llamada} | ${l.ida.texto} | ${l.vuelta.texto} | ${l.vuelta.valor} ${l.vuelta.flecha ? '(→)' : ''}`);
        const esperadas = [
          'mayorDigito(4172) | resto = mayorDigito(417) | resto = 7 | 7 (→)',
          'mayorDigito(417) | resto = mayorDigito(41) | resto = 4 | 7 (→)',
          'mayorDigito(41) | resto = mayorDigito(4) | resto = 4 | 4 (→)',
          'mayorDigito(4) | 4 | 4 | 4 ',
        ];
        if (filas.join('\n') !== esperadas.join('\n')) return 'las filas tenian que ser\n' + esperadas.join('\n') + '\ny son\n' + filas.join('\n');
        const l = r.llamadas;
        // la vuelta de la linea se conoce cuando vuelve la llamada de abajo; lo que devuelve, en el return (mas tarde)
        for (const x of l.slice(0, 3)) {
          if (!(x.vuelta.paso < x.vuelta.pasoValor)) return `en ${x.llamada} la vuelta (${x.vuelta.paso}) tenia que conocerse antes que lo que devuelve (${x.vuelta.pasoValor})`;
        }
        if (l[0].vuelta.paso !== l[1].hasta) return 'la vuelta de la primera tenia que conocerse cuando termina la segunda';
        if (traza[l[1].vuelta.pasoValor].linea !== 8) return 'lo que devuelve mayorDigito(417) tenia que conocerse en la linea 8 (return n % 10) y es la ' + traza[l[1].vuelta.pasoValor].linea;
        if (traza[l[2].vuelta.pasoValor].linea !== 10) return 'lo que devuelve mayorDigito(41) tenia que conocerse en la linea 10 (return resto) y es la ' + traza[l[2].vuelta.pasoValor].linea;
        return null;
      },
    },
  },
  {
    nombre: 'las preguntas de cada llamada de una recursion: el texto con los valores puestos, lo que dio y en que fotografias se ve y se responde',
    opciones: { preguntas: true },
    codigo: String.raw`#include <stdio.h>
int mayorDigito(int n) {
  if (n < 10) {
    return n;
  }
  int resto = mayorDigito(n / 10);
  if (n % 10 > resto) {
    return n % 10;
  }
  return resto;
}
int main() {
  printf("%d\n", mayorDigito(417));
  return 0;
}`,
    espera: {
      salida: '7\n',
      traza: (traza, r) => {
        const filas = r.llamadas.map((l) => l.llamada + ': ' + l.preguntas.map((q) => `${q.texto} ${q.valor ? 'V' : 'F'} ${q.fase}`).join(' ; '));
        const esperadas = [
          'mayorDigito(417): 417 < 10 F ida ; 7 > 4 V vuelta',
          'mayorDigito(41): 41 < 10 F ida ; 1 > 4 F vuelta',
          'mayorDigito(4): 4 < 10 V ida',
        ];
        if (filas.join('\n') !== esperadas.join('\n')) return 'las preguntas tenian que ser\n' + esperadas.join('\n') + '\ny son\n' + filas.join('\n');
        for (const l of r.llamadas) {
          for (const q of l.preguntas) {
            const p = traza[q.pregunta];
            const respuesta = traza[q.respuesta];
            if (!p || !p.pregunta || p.pregunta.texto !== q.simbolico) return `la pregunta ${q.simbolico} de ${l.llamada} tenia que verse en la fotografia ${q.pregunta}`;
            if (!respuesta || !respuesta.condicion || respuesta.condicion.valor !== q.valor) return `la respuesta de ${q.simbolico} en ${l.llamada} tenia que conocerse en la fotografia ${q.respuesta}`;
            if (!(q.pregunta < q.respuesta)) return 'la pregunta se ve antes que su respuesta';
          }
        }
        return null;
      },
    },
  },
  {
    nombre: 'una recursion con varias lineas que llaman: cada sentencia en su renglon, sin tocar las funciones void',
    codigo: String.raw`#include <stdio.h>
int fib(int n) {
  if (n < 2) {
    return n;
  }
  int a = fib(n - 1);
  int b = fib(n - 2);
  return a + b;
}
void bajar(int n) {
  if (n == 0) {
    return;
  }
  bajar(n - 1);
}
int main() {
  printf("%d\n", fib(3));
  bajar(2);
  return 0;
}`,
    espera: {
      salida: '2\n',
      traza: (traza, r) => {
        const fibs = r.llamadas.filter((x) => x.funcion === 'fib');
        const primera = fibs[0];
        if (primera.ida.texto !== 'a = fib(2)\nb = fib(1)') return 'la ida de fib(3) tenia que ser dos renglones y es ' + JSON.stringify(primera.ida.texto);
        if (primera.vuelta.texto !== 'a = 1\nb = 1') return 'la vuelta de fib(3) tenia que ser "a = 1\\nb = 1" y es ' + JSON.stringify(primera.vuelta.texto);
        if (primera.vuelta.valor !== '2') return 'fib(3) devuelve 2 y la vuelta dice ' + primera.vuelta.valor;
        // una funcion void no tiene ida ni vuelta
        const bajan = r.llamadas.filter((x) => x.funcion === 'bajar');
        if (bajan.some((x) => x.ida || x.vuelta)) return 'bajar (void) no tiene ida ni vuelta';
        return null;
      },
    },
  },
  {
    nombre: 'el llamador de la llamada de mas arriba: la llamada sola, o la cuenta algebraica que la rodea',
    codigo: String.raw`#include <stdio.h>
int fact(int n) {
  if (n == 0) {
    return 1;
  }
  return n * fact(n - 1);
}
int main() {
  printf("%d\n", fact(3));
  int r = fact(3) * 2 + 1;
  int s = fact(2) + fact(3);
  if (fact(3) > 5) {
    r = 0;
  }
  return 0;
}`,
    espera: {
      salida: '6\n',
      traza: (traza, r) => {
        const raices = r.llamadas.filter((x) => x.llamador);
        if (raices.length !== 5) return 'tenia que haber 5 llamadas de mas arriba (fact(3), fact(3), fact(2), fact(3), fact(3)) y hay ' + raices.length;
        if (raices.some((x) => x.llamador.funcion !== 'main')) return 'quien las hace tenia que ser main';
        if (r.llamadas.filter((x) => !x.llamador).length !== r.llamadas.length - 5) return 'solo las de mas arriba llevan llamador';
        const filas = raices.map((x) => `${x.llamador.ida.texto} | ${x.llamador.vuelta.texto} = ${x.llamador.valorFinal}`);
        const esperadas = [
          'fact(3) | 6 = 6', // printf("%d\n", fact(3)): la llamada sola
          'fact(3) * 2 + 1 | 6 * 2 + 1 = 13', // una cuenta algebraica: se muestra entera
          'fact(2) | 2 = 2', // otra llamada en la misma cuenta: cada una sola
          'fact(3) | 6 = 6',
          'fact(3) | 6 = 6', // una comparacion no es una cuenta algebraica
        ];
        if (filas.join('\n') !== esperadas.join('\n')) return 'el llamador tenia que ser\n' + esperadas.join('\n') + '\ny es\n' + filas.join('\n');
        return null;
      },
    },
  },
  {
    nombre: 'el registro de una recursion sin valores (void): sin ida ni vuelta, y el caso base es la llamada que no se llama a si misma',
    codigo: String.raw`#include <stdio.h>
void binario(int n) {
  if (n == 0) {
    return;
  }
  binario(n / 2);
  printf("%d", n % 2);
}
int main() {
  binario(6);
  return 0;
}`,
    espera: {
      salida: '110',
      traza: (traza, r) => {
        const l = r.llamadas;
        if (l.map((x) => x.llamada).join() !== 'binario(6),binario(3),binario(1),binario(0)') return 'las llamadas no son las esperadas: ' + l.map((x) => x.llamada);
        if (l.some((x) => x.ida || x.vuelta)) return 'una funcion void no tiene ida ni vuelta';
        // solo binario(0) no se llama a si misma: su caso base es el return; de la fotografia (la linea del return)
        const bases = l.map((x) => x.base);
        if (bases.slice(0, 3).some((b) => b !== null) || bases[3] === null) return 'solo la ultima llamada tenia que tener caso base: ' + bases.join();
        if (traza[bases[3]].linea !== 4) return 'el caso base tenia que estar en la linea del return (4) y esta en la ' + traza[bases[3]].linea;
        return null;
      },
    },
  },
  {
    nombre: 'un valor que no sale de otra casilla anota la casilla donde se guarda (el que sale de una casilla es una copia)',
    codigo: String.raw`#include <stdio.h>
int main() {
  int x = 5;
  int y = x;
  x = y + 2;
  x++;
  int *p = NULL;
  int a[2] = {1, 2};
  return 0;
}`,
    espera: {
      salida: '',
      traza: (traza) => {
        const con = traza.filter((f) => f.escrituras && f.escrituras.length);
        if (con.length !== 4) return 'tenia que haber 4 pasos con una casilla escrita (x = 5, x = y + 2, x++, p = NULL) y hay ' + con.length;
        if (con.some((f) => f.escrituras.length !== 1)) return 'cada paso escribe una sola casilla';
        const copia = traza.filter((f) => (f.accesos || []).some((h) => h.tipo === 'valor'));
        if (copia.length !== 1) return 'tenia que haber una copia de valor (y = x) y hay ' + copia.length;
        if (copia[0].escrituras) return 'una copia no se anota tambien como escritura';
        return null;
      },
    },
  },
  {
    nombre: 'un acceso a un arreglo comun no se anota, el de un bloque con malloc si',
    codigo: String.raw`#include <stdlib.h>
int main() {
  int a[2] = {1, 2};
  int *v = malloc(2 * sizeof(int));

  a[0] = 5;
  v[1] = 7;
  free(v);
  return 0;
}`,
    espera: {
      traza: (traza) => {
        // (el free recorre su flecha hasta el bloque entero: no cuenta)
        const con = traza.filter((x) => x.accesos && x.accesos.some((a) => a.de && a.a.ruta.length > 0));
        if (con.length !== 1) return 'tenia que haber un paso con acceso y hay ' + con.length;
        if (JSON.stringify(con[0].accesos[0].a.ruta) !== '[1]') return 'el acceso tenia que llegar a la posicion 1';
        return null;
      },
    },
  },
  {
    nombre: 'con la flecha el acceso llega hasta el campo',
    codigo: String.raw`#include <stdlib.h>
typedef struct nodo { int dato; struct nodo *sig; } TNodo;
int main() {
  TNodo *q = malloc(sizeof(TNodo));

  q->dato = 5;
  free(q);
  return 0;
}`,
    espera: {
      traza: (traza) => {
        const con = traza.filter((x) => x.accesos && x.accesos.some((a) => a.de && a.a.ruta.length > 0));
        if (con.length !== 1) return 'tenia que haber un paso con acceso y hay ' + con.length;
        if (con[0].accesos[0].a.ruta.at(-1) !== 'dato') return 'el acceso tenia que llegar al campo dato';
        return null;
      },
    },
  },
  {
    nombre: 'preguntar por un puntero resalta su casilla, sin flecha; liberarlo, ademas, recorre su flecha',
    codigo: String.raw`#include <stdlib.h>
int main() {
  int n = 3;
  int *p = malloc(sizeof(int));

  if (p == NULL) {
    return 1;
  }
  while (n > 0 && p != NULL) {
    n--;
  }
  free(p);
  return 0;
}`,
    espera: {
      traza: (traza) => {
        const lecturas = traza.filter((x) => x.accesos && x.accesos.length >= 1 && x.accesos.every((a) => !a.de));
        if (lecturas.length < 3) return 'tenia que resaltar el puntero en el if y en el while y hay ' + lecturas.length;
        const conFlecha = traza.filter((x) => x.accesos && x.accesos.some((a) => a.de));
        if (conFlecha.length !== 1) return 'solo el free sigue una flecha y hay ' + conFlecha.length;
        if (!conFlecha[0].accesos.some((a) => !a.de)) return 'el free resalta ademas la casilla del puntero';
        return null;
      },
    },
  },
  {
    nombre: 'guardar el puntero que devuelve una funcion propia es una copia sin casilla de origen; con NULL o con malloc no',
    codigo: String.raw`#include <stdlib.h>
int *crear(int v) {
  int *n = malloc(sizeof(int));
  *n = v;
  return n;
}
int *nada(void) {
  return NULL;
}
int main() {
  int *p;
  p = crear(5);
  int *q = crear(7);
  int *r = malloc(sizeof(int));
  p = nada();
  free(q);
  free(r);
  return 0;
}`,
    espera: {
      traza: (traza) => {
        const copias = traza.flatMap((x) => (x.accesos || []).filter((h) => h.tipo === 'copia'));
        if (copias.length !== 2) return 'tenia que haber dos copias (p = crear, q = crear) y hay ' + copias.length;
        if (copias.some((c) => c.de !== null || !c.para)) return 'la copia no lleva origen y si la casilla que recibe';
        return null;
      },
    },
  },
  {
    nombre: 'free(p) anota la casilla de p, el recorrido de su flecha y el bloque; free(NULL) no senala nada',
    codigo: String.raw`#include <stdlib.h>
int main() {
  int *p = malloc(sizeof(int));
  int *q = NULL;
  free(p);
  free(q);
  return 0;
}`,
    espera: {
      traza: (traza) => {
        const conLectura = traza.filter((x) => (x.accesos || []).some((h) => !h.de));
        const recorridos = traza.flatMap((x) => (x.accesos || []).filter((h) => h.de && !h.tipo));
        if (recorridos.length !== 1) return 'tenia que haber un recorrido (free(p)) y hay ' + recorridos.length;
        if (recorridos[0].a.ruta.length !== 0) return 'el recorrido tenia que llegar al bloque entero';
        if (conLectura.length < 2) return 'se resalta la casilla del puntero en cada free';
        return null;
      },
    },
  },
  {
    nombre: 'al llamar a una funcion se anota, por cada argumento, la casilla de la que sale (si sale de una) y la del parametro',
    codigo: String.raw`#include <stdlib.h>
int sumar(int a, int b) {
  return a + b;
}
void poner(int *dato, int valor) {
  *dato = valor;
}
int main() {
  int x = 4;
  int *p = malloc(sizeof(int));
  int r = sumar(x, 9);
  poner(p, r);
  poner(&x, 1);
  free(p);
  return 0;
}`,
    espera: {
      traza: (traza) => {
        const forma = (x) => (x.accesos || []).filter((h) => h.tipo === 'valor' || h.tipo === 'copia' || h.tipo === 'parametro').map((h) => h.tipo);
        const llamadas = traza.map(forma).filter((f) => f.includes('parametro'));
        // sumar(x, 9): x sale de una casilla y 9 no; poner(p, r): p es un puntero y r una variable; poner(&x, 1): &x sale de x.
        const esperadas = ['valor,parametro,parametro', 'copia,parametro,valor,parametro', 'valor,parametro,parametro'];
        const reales = llamadas.map((f) => f.join(','));
        if (JSON.stringify(reales) !== JSON.stringify(esperadas)) return 'esperaba ' + esperadas.join(' | ') + ' y salio ' + reales.join(' | ');
        // Solo el argumento &x pasa una direccion en lugar del contenido de la casilla: lo marca la figura con un &.
        const conDireccion = traza.flatMap((x) => (x.accesos || []).filter((h) => h.direccion));
        if (conDireccion.length !== 1) return 'tenia que haber un solo argumento con direccion (&x) y hay ' + conDireccion.length;
        return null;
      },
    },
  },
  {
    nombre: 'copiar un puntero anota la flecha y lo que senala; recibir una direccion nueva no es una copia',
    codigo: String.raw`#include <stdlib.h>
int main() {
  int n = 3;
  int *p = &n;
  int *q;
  int *r;

  q = p;
  r = malloc(sizeof(int));
  free(r);
  return 0;
}`,
    espera: {
      traza: (traza) => {
        const copias = traza.flatMap((x) => (x.accesos || []).filter((h) => h.tipo === 'copia'));
        if (copias.length !== 1) return 'tenia que haber una copia (q = p) y hay ' + copias.length;
        const [c] = copias;
        if (!c.de || c.a.ruta.length !== 0) return 'la copia tenia que salir de la casilla de p y llegar a la variable n';
        return null;
      },
    },
  },
  {
    nombre: 'en una asignacion de punteros la traza muestra primero lo que se guarda y despues donde se guarda',
    codigo: String.raw`#include <stdlib.h>
typedef struct nodo { int dato; struct nodo *sig; } TNodo;
void insertar(TNodo **lista, int dato) {
  TNodo *nuevo = malloc(sizeof(TNodo));

  nuevo->dato = dato;
  nuevo->sig = *lista;
  *lista = nuevo;
}
int main() {
  TNodo *lista = NULL;

  insertar(&lista, 5);
  insertar(&lista, 8);
  return 0;
}`,
    espera: {
      traza: (traza) => {
        const forma = (x) => (x.accesos || []).map((h) => (h.tipo === 'copia' ? 'copia' : h.tipo === 'vieja' ? 'vieja' : 'ir')).join(',');
        const conCopia = traza.filter((x) => (x.accesos || []).some((h) => h.tipo === 'copia'));
        // 1a insercion: *lista = nuevo (lista valia NULL: no hay flecha vieja); 2a: nuevo->sig = *lista y *lista = nuevo (la flecha vieja de lista destella)
        const formas = conCopia.map(forma);
        if (JSON.stringify(formas) !== JSON.stringify(['copia,ir', 'ir,copia,ir', 'copia,ir,vieja'])) return 'el orden tenia que ser valor y despues destino y es ' + JSON.stringify(formas);
        return null;
      },
    },
  },
  {
    nombre: 'copiar el contenido de una variable en otra anota el origen y el destino',
    codigo: String.raw`int main() {
  int a = 3;
  int b = 0;
  int c = a;

  b = a;
  b = b + 1;
  return 0;
}`,
    espera: {
      traza: (traza) => {
        const copias = traza.flatMap((x) => (x.accesos || []).filter((h) => h.tipo === 'valor'));
        // int c = a (el destino todavia no existe en la figura anterior) y b = a; b = b + 1 no es una copia
        if (copias.length !== 2) return 'tenia que haber dos copias (int c = a; b = a;) y hay ' + copias.length;
        const [declaracion, asignacion] = copias;
        if (!declaracion.para || !asignacion.para) return 'cada copia tenia que decir que casilla recibe el valor';
        if (asignacion.de.a === asignacion.para.a) return 'el origen y el destino de b = a tienen que ser distintos';
        return null;
      },
    },
  },
  {
    nombre: 'copiar un puntero dice tambien que casilla recibe la direccion',
    codigo: String.raw`int main() {
  int n = 3;
  int *p = &n;
  int *q = NULL;

  q = p;
  return 0;
}`,
    espera: {
      traza: (traza) => {
        const copias = traza.flatMap((x) => (x.accesos || []).filter((h) => h.tipo === 'copia'));
        if (copias.length !== 1) return 'tenia que haber una copia (q = p) y hay ' + copias.length;
        if (!copias[0].para) return 'la copia tenia que decir que casilla recibe la direccion';
        return null;
      },
    },
  },
  {
    nombre: 'una condicion queda en la traza con su texto, su resultado y las casillas que lee',
    codigo: String.raw`int main() {
  int n = 0;
  int *p = &n;
  if (p != NULL && n < 2) {
    n = 5;
  }
  while (n > 3) {
    n = n - 1;
  }
  for (int i = 0; i < 1; i++) {
    n = n + 1;
  }
  return 0;
}`,
    espera: {
      traza: (traza) => {
        const conds = traza.filter((x) => x.condicion).map((x) => x.condicion);
        const textos = conds.map((c) => c.texto + '=' + c.valor).join(' | ');
        const esperado = 'p != NULL && n < 2=true | n > 3=true | n > 3=true | n > 3=false | i < 1=true | i < 1=false';
        if (textos !== esperado) return 'las condiciones eran ' + textos;
        const primera = traza.find((x) => x.condicion);
        const lecturas = (primera.accesos || []).filter((h) => h.cond && !h.de);
        if (lecturas.length !== 2) return 'tenia que leer p y n y leyo ' + lecturas.length + ' casillas';
        return null;
      },
    },
  },
  {
    nombre: 'el detalle de la ida: la linea escrita, con los valores y con los argumentos resueltos, desde la fotografia en que el cursor llega a ella',
    codigo: String.raw`#include <stdio.h>
int quitar(int n, int d) {
  if (n == 0) {
    return 0;
  }
  if (n % 10 == d) {
    return quitar(n / 10, d);
  }
  return quitar(n / 10, d) * 10 + n % 10;
}
int mayor(int n) {
  if (n < 10) {
    return n;
  }
  int resto = mayor(n / 10);
  if (n % 10 > resto) {
    return n % 10;
  }
  return resto;
}
int main() {
  printf("%d", quitar(2132, 1));
  printf("%d", mayor(4172));
  return 0;
}`,
    espera: {
      traza: (traza, r) => {
        const dice = (l) => (l.ida && l.ida.detalle ? l.ida.detalle.pasos.join(' => ') : 'sin detalle');
        const casos = [
          ['quitar(2132, 1)', 'quitar(n / 10, d) * 10 + n % 10 => quitar(2132 / 10, 1) * 10 + 2132 % 10 => quitar(213, 1) * 10 + 2', 9],
          ['quitar(21, 1)', 'quitar(n / 10, d) => quitar(21 / 10, 1) => quitar(2, 1)', 7],
          ['mayor(4172)', 'resto = mayor(n / 10) => resto = mayor(4172 / 10) => resto = mayor(417)', 15],
        ];
        for (const [llamada, esperado, linea] of casos) {
          const l = r.llamadas.find((x) => x.llamada === llamada);
          if (!l) return 'no hay la llamada ' + llamada;
          if (dice(l) !== esperado) return llamada + ' tenia que decir\n' + esperado + '\ny dice\n' + dice(l);
          // el cursor esta en la linea que llama, antes de que se abra la llamada
          const { paso0 } = l.ida.detalle;
          if (traza[paso0].linea !== linea) return llamada + ': el cursor estaba en la linea ' + traza[paso0].linea + ' y era la ' + linea;
          if (!(paso0 < l.ida.paso)) return llamada + ': el detalle empieza en ' + paso0 + ' y la ida en ' + l.ida.paso;
        }
        // lo que cambia en cada estado: las variables y despues la cuenta
        const partes = r.llamadas.find((x) => x.llamada === 'mayor(4172)').ida.detalle.partes.map((p) => p.filter((x) => x.nuevo).map((x) => x.antes + '>' + x.t).join(','));
        if (partes.join(' | ') !== ' | n>4172 | 4172 / 10>417') return 'las partes que cambian eran "' + partes.join(' | ') + '"';
        // una llamada sin nada que reemplazar (el caso base) no lleva detalle
        const base = r.llamadas.find((x) => x.llamada === 'quitar(0, 1)');
        if (base && base.ida.detalle) return 'el caso base no tiene que llevar detalle';
        return null;
      },
    },
  },
  {
    nombre: 'el detalle de la ida de quienes llaman a la recursion (main, la que prepara) y del caso base que devuelve una variable',
    codigo: String.raw`#include <stdio.h>
int sumaAux(int n, int suma) {
  if (n == 0) {
    return suma;
  }
  return sumaAux(n / 10, suma + n % 10);
}
int sumaDigitos(int n) {
  return sumaAux(n, 0);
}
int main() {
  int x = 123;
  printf("%d", sumaDigitos(x));
  return 0;
}`,
    espera: {
      traza: (traza, r) => {
        const dice = (d) => (d ? d.pasos.join(' => ') : 'sin detalle');
        const primera = r.llamadas.find((x) => x.llamada === 'sumaAux(123, 0)');
        const base = r.llamadas.find((x) => x.llamada === 'sumaAux(0, 6)');
        if (!primera || !base) return 'faltan llamadas del registro';
        const casos = [
          ['la fila de sumaDigitos', primera.llamador.detalle, 'sumaAux(n, 0) => sumaAux(123, 0)', 9],
          ['la fila de main', primera.llamador.anteriores[0].detalle, 'sumaDigitos(x) => sumaDigitos(123)', 13],
          ['la ida de sumaAux(123, 0)', primera.ida.detalle, 'sumaAux(n / 10, suma + n % 10) => sumaAux(123 / 10, 0 + 123 % 10) => sumaAux(12, 0 + 3) => sumaAux(12, 3)', 6],
          ['el caso base', base.ida.detalle, 'suma => 6', 4],
        ];
        for (const [que, detalle, esperado, linea] of casos) {
          if (dice(detalle) !== esperado) return que + ' tenia que decir\n' + esperado + '\ny dice\n' + dice(detalle);
          if (traza[detalle.paso0].linea !== linea) return que + ': el cursor estaba en la linea ' + traza[detalle.paso0].linea + ' y era la ' + linea;
        }
        // lo que ya estaba escrito con numeros (la llamada a sumaAux del caso base no existe) no lleva detalle donde no hay nada que reemplazar
        return null;
      },
    },
  },
  {
    nombre: 'el detalle de una condicion: escrita, con los valores y con las cuentas hechas (sin efectos, con cortocircuito)',
    codigo: String.raw`typedef struct nodo { int dato; struct nodo *sig; } Nodo;
int main() {
  int n = 127;
  int d = 5;
  Nodo *lista = NULL;
  Nodo b = { 7, NULL };
  Nodo *p = &b;
  if (n % 10 == d) {
    n = 0;
  }
  if (lista == NULL) {
    n = 1;
  }
  if (p != NULL && p->dato > 3) {
    n = 2;
  }
  if (lista != NULL && lista->dato > 3) {
    n = 3;
  }
  if (!(n > 100) || d) {
    n = 4;
  }
  return 0;
}`,
    espera: {
      traza: (traza) => {
        const porTexto = new Map(traza.filter((x) => x.condicion).map((x) => [x.condicion.texto, x.condicion.pasos]));
        const dice = (t) => (porTexto.get(t) || ['sin detalle']).join(' => ');
        const casos = [
          ['n % 10 == d', 'n % 10 == d => 127 % 10 == 5 => 7 == 5'],
          ['lista == NULL', 'lista == NULL => NULL == NULL'],
          ['p != NULL && p->dato > 3', 'p != NULL && p->dato > 3 => 1 && 7 > 3 => 1 && 1'],
          ['lista != NULL && lista->dato > 3', 'lista != NULL && lista->dato > 3 => NULL != NULL && lista->dato > 3 => 0 && lista->dato > 3'],
          ['!(n > 100) || d', '!(n > 100) || d => !(2 > 100) || d => !0 || d => 1 || d'],
        ];
        // lo que cambia en cada paso: n y d pasan a sus valores y despues 127 % 10 a 7
        const partes = (traza.find((x) => x.condicion && x.condicion.texto === 'n % 10 == d').condicion.partes || []).map((l) => l.filter((p) => p.nuevo).map((p) => p.antes + '>' + p.t).join(','));
        if (partes.join(' | ') !== ' | n>127,d>5 | 127 % 10>7') return 'las partes que cambian eran "' + partes.join(' | ') + '"';
        for (const [t, esperado] of casos) {
          let real = dice(t);
          // (el valor de un puntero a una variable es su direccion: no se compara entero)
          if (t.startsWith('p != NULL')) real = real.replace(/\d{3,} != NULL/, 'P != NULL');
          const quiero = t.startsWith('p != NULL') ? 'p != NULL && p->dato > 3 => P != NULL && 7 > 3 => 1 && 1' : esperado;
          if (real !== quiero) return 'el detalle de ' + t + ' era "' + real + '" y tenia que ser "' + quiero + '"';
        }
        return null;
      },
    },
  },
  {
    nombre: 'con "preguntas", cada condicion es un paso con la pregunta y el siguiente trae la respuesta',
    opciones: { preguntas: true },
    codigo: String.raw`int main() {
  int n = 0;
  int *p = &n;
  if (p != NULL && n < 2) {
    n = 5;
  }
  while (n > 3) {
    n = n - 1;
  }
  for (int i = 0; i < 1; i++) {
    n = n + 1;
  }
  return 0;
}`,
    espera: {
      traza: (traza) => {
        const preguntas = traza.filter((x) => x.pregunta);
        const textos = preguntas.map((x) => x.pregunta.texto).join(' | ');
        const esperado = 'p != NULL && n < 2 | n > 3 | n > 3 | n > 3 | i < 1 | i < 1';
        if (textos !== esperado) return 'las preguntas eran ' + textos;
        if (traza.some((x) => (x.accesos || []).some((h) => h.cond))) return 'las lecturas de una condicion van en la pregunta, no en los accesos';
        const primera = preguntas[0];
        if (primera.linea !== 4) return 'la pregunta del if tenia que estar en la fotografia de su linea (4) y esta en la ' + primera.linea;
        if (primera.pregunta.celdas.length !== 2) return 'tenia que leer p y n y leyo ' + primera.pregunta.celdas.length + ' casillas';
        // el enfoque: solo la casilla del puntero (p), no la del numero (n); y ninguna en una condicion de numeros
        if (primera.pregunta.enfoque.length !== 1) return 'el enfoque de p != NULL && n < 2 tenia que ser la casilla de p y es de ' + primera.pregunta.enfoque.length;
        const numerica = traza.find((x) => x.pregunta && x.pregunta.texto === 'n > 3');
        if (numerica.pregunta.enfoque.length !== 0) return 'una condicion de numeros no tiene enfoque';
        const respuestas = traza.filter((x) => x.condicion).length;
        if (respuestas !== 6) return 'tenia que haber 6 respuestas y hay ' + respuestas;
        // despues de cada pregunta viene su respuesta (sin otra fotografia en el medio, salvo la del for)
        for (const q of preguntas) {
          const k = traza.indexOf(q);
          if (!traza[k + 1] || !traza[k + 1].condicion || traza[k + 1].condicion.texto !== q.pregunta.texto) return 'a la pregunta ' + q.pregunta.texto + ' le tenia que seguir su respuesta';
        }
        // la inicializacion del for va antes de su pregunta: ahi la pregunta es una fotografia propia (misma linea que la anterior)
        const delFor = preguntas.find((x) => x.pregunta.texto === 'i < 1');
        const antes = traza[traza.indexOf(delFor) - 1];
        if (!antes || antes.linea !== delFor.linea || antes.pregunta) return 'la primera pregunta del for tenia que ser un paso aparte, despues de la inicializacion';
        return null;
      },
    },
  },
  {
    nombre: 'una condicion dentro de una funcion llamada desde otra condicion tambien tiene su pregunta y su respuesta',
    opciones: { preguntas: true },
    codigo: String.raw`int analizar(int x) {
  if (x > 1) {
    return 1;
  }
  return 0;
}

int main() {
  if (analizar(2) == 1) {
    return 0;
  }
  return 1;
}`,
    espera: {
      traza: (traza) => {
        const preguntas = traza.filter((x) => x.pregunta).map((x) => x.pregunta.texto).join(' | ');
        if (preguntas !== 'analizar(2) == 1 | x > 1') return 'las preguntas eran ' + preguntas;
        const respuestas = traza.filter((x) => x.condicion).map((x) => x.condicion.texto + '=' + x.condicion.valor).join(' | ');
        if (respuestas !== 'x > 1=true | analizar(2) == 1=true') return 'las respuestas eran ' + respuestas;
        return null;
      },
    },
  },
  {
    nombre: 'con "preguntas", el printf anota las casillas de las que salen los valores que muestra',
    opciones: { preguntas: true },
    codigo: String.raw`int main() {
  int n = 3;
  int m = 4;
  int *p = &n;
  printf("%d %d %d\n", n, *p, m * 2);
  printf("hola\n");
  return 0;
}`,
    espera: {
      traza: (traza) => {
        const conMuestra = traza.filter((x) => x.muestra);
        if (conMuestra.length !== 1) return 'tenia que haber una sola fotografia con valores a mostrar y hay ' + conMuestra.length;
        const m = conMuestra[0];
        // va en la fotografia siguiente al printf (la que ya tiene el texto en la salida)
        if (m.linea !== 6) return 'los valores mostrados tenian que estar en la fotografia siguiente al printf (linea 6) y estan en la ' + m.linea;
        if (!m.salida || !m.salida.startsWith('3 3 8')) return 'esa fotografia tenia que tener el texto ya mostrado y tiene ' + JSON.stringify(m.salida);
        // n (y *p, que es la misma casilla) y m * 2 (que usa m): dos casillas
        if (m.muestra.celdas.length !== 2) return 'tenia que haber 2 casillas (n y m) y hay ' + m.muestra.celdas.length;
        return null;
      },
    },
  },
  {
    nombre: 'con "preguntas", el scanf anota el trozo de la entrada que leyo y las casillas que reciben los valores',
    opciones: { preguntas: true },
    entrada: '3 5',
    codigo: String.raw`int main() {
  int a;
  int b;
  int c = 9;
  scanf("%d %d", &a, &b);
  scanf("%d", &c);
  return 0;
}`,
    espera: {
      traza: (traza) => {
        const lecturas = traza.filter((x) => x.lectura);
        if (lecturas.length !== 2) return 'tenia que haber dos lecturas (los dos scanf) y hay ' + lecturas.length;
        const [primera, segunda] = lecturas;
        // va en la fotografia siguiente al scanf
        if (primera.linea !== 6) return 'la lectura del primer scanf tenia que estar en la fotografia de la linea 6 y esta en la ' + primera.linea;
        if (primera.lectura.desde !== 0 || primera.lectura.hasta !== 3) return 'el primer scanf tenia que leer "3 5" (0 a 3) y leyo ' + primera.lectura.desde + ' a ' + primera.lectura.hasta;
        if (primera.lectura.celdas.length !== 2) return 'tenia que haber 2 casillas (a y b) y hay ' + primera.lectura.celdas.length;
        if (primera.lectura.agotada) return 'el primer scanf no agota la entrada';
        // el segundo ya no tiene nada que leer
        if (!segunda.lectura.agotada || segunda.lectura.celdas.length !== 0) return 'el segundo scanf tenia que quedar con la entrada agotada y sin casillas';
        return null;
      },
    },
  },
  {
    nombre: 'con "preguntas", un scanf con un puntero anota tambien el recorrido por su flecha',
    opciones: { preguntas: true },
    entrada: '5',
    codigo: String.raw`int main() {
  int n;
  int *p = &n;
  scanf("%d", p);
  scanf("%d", &n);
  return 0;
}`,
    espera: {
      traza: (traza) => {
        const lecturas = traza.filter((x) => x.lectura);
        if (lecturas.length !== 2) return 'tenia que haber dos lecturas y hay ' + lecturas.length;
        const conFlecha = (x) => (x.accesos || []).filter((h) => h.de && !h.tipo).length;
        if (conFlecha(lecturas[0]) !== 1) return 'el scanf con p tenia que recorrer la flecha de p y recorre ' + conFlecha(lecturas[0]);
        return null;
      },
    },
  },
];

export function resultadoDelMotor(analizador, ejecutar, caso) {
  const r = ejecutar(analizador, caso.codigo, { entrada: caso.entrada, traza: Boolean(caso.espera.lineas || caso.espera.traza), ...(caso.opciones || {}) });
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
    const m = esp.traza(r.traza, r);
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
  { nombre: 'guardar un numero en un puntero es un error de tipos', regla: { casos: [{}] }, respuesta: `#include <stdio.h>\nint main() {\n  int n = 3;\n  int *p = &n;\n\n  p = n;\n  return 0;\n}`, espera: { errores: ['TIPOS_INCOMPATIBLES'], linea: 6, dice: ['`int`', '`int *`', 'direcciones, no números'] } },
  { nombre: 'guardar una direccion en un numero es un error de tipos', regla: { casos: [{}] }, respuesta: `#include <stdio.h>\nint main() {\n  int n = 3;\n  int *p = &n;\n  int m = p;\n\n  return 0;\n}`, espera: { errores: ['TIPOS_INCOMPATIBLES'], linea: 5, dice: ['`int *`', '`int`', 'guarda números'] } },
  { nombre: 'el 0 se acepta como NULL en un puntero', regla: { casos: [{}] }, respuesta: `#include <stdio.h>\nint main() {\n  int *p = 0;\n\n  if (p == NULL) {\n    printf("nulo");\n  }\n  return 0;\n}`, espera: { ok: true } },
  { nombre: 'una conversion explicita de un numero a puntero no se sigue', regla: { casos: [{}] }, respuesta: `#include <stdio.h>\nint main() {\n  int *p = (int *) 8;\n\n  return 0;\n}`, espera: { ok: true, avisos: ['EJECUCION_NO_VERIFICADA'] } },
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
