// Casos del simulador (js/simulador.js), que sigue el codigo de una respuesta.
//
//   nombre:  que se prueba
//   codigo:  el programa (con main)
//   entrada: los numeros que se escriben por teclado, si lee
//   prueba:  datos de prueba para variables y arreglos
//   espera:  { variables: { nombre: valor }, salida: "texto", error: 'NombreDeLaClase' }
//            "variables" compara solo las que se nombran; un arreglo, con su lista.

const CABECERA = `#define MAX 3
typedef struct {
  int legajo;
  char apellidoNombre[50];
  float promedio;
  char turno;
} TAlumno;
struct Curso {
  int cantidad;
  float nota;
};
typedef struct {
  int dia;
  int mes;
  int anio;
} TFecha;
typedef struct {
  int legajo;
  TFecha nacimiento;
  TFecha ingreso;
} TPersona;
typedef enum {
  MANANA,
  TARDE,
  NOCHE
} TTurno;
enum Nivel {
  BAJO = 1,
  MEDIO = 5,
  ALTO
};
typedef struct {
  int legajo;
  TTurno turno;
} TCursante;
typedef enum {
  ENTERO,
  REAL,
  LETRA
} TTipo;
typedef union {
  int entero;
  double real;
  char letra;
} TMedida;
union Dato {
  int a;
  int b;
};
typedef struct {
  TTipo tipo;
  TMedida medida;
} TLectura;
typedef struct {
  int datos[MAX];
  int tope;
} TPila;
typedef struct {
  double x;
  double y;
} TPunto;
`;

// Los enumeradores, con el valor que les da la cabecera.
const ENUMERADORES = { MAX: 3, MANANA: 0, TARDE: 1, NOCHE: 2, BAJO: 1, MEDIO: 5, ALTO: 6, ENTERO: 0, REAL: 1, LETRA: 2 };

const con = (cuerpo) => `${CABECERA}int main() {\n${cuerpo}\nreturn 0;\n}`;
// Con funciones del programa definidas antes de main.
const conFunciones = (funciones, cuerpo) => `${CABECERA}${funciones}\nint main() {\n${cuerpo}\nreturn 0;\n}`;

export const CASOS_DEL_SIMULADOR = [
  {
    nombre: 'estructuras: una variable suelta con alias',
    codigo: con(
      "TAlumno alumno;\nalumno.legajo = 20431;\nalumno.promedio = 8.5;\nalumno.turno = 'T';\nprintf(\"%d %.1f %c\", alumno.legajo, alumno.promedio, alumno.turno);"
    ),
    espera: {
      variables: { 'alumno.legajo': 20431, 'alumno.promedio': 8.5, 'alumno.turno': 84 },
      salida: '20431 8.5 T',
    },
  },
  {
    nombre: 'estructuras: una variable con etiqueta',
    codigo: con('struct Curso curso;\ncurso.cantidad = 4;\ncurso.nota = curso.cantidad * 2;'),
    espera: { variables: { 'curso.cantidad': 4, 'curso.nota': 8 } },
  },
  {
    nombre: 'estructuras: un arreglo y un ciclo',
    codigo: con(
      'TAlumno alumnos[MAX];\nint i;\nfloat total = 0;\nfor (i = 0; i < MAX; i++) {\n  alumnos[i].promedio = i * 2;\n  total += alumnos[i].promedio;\n}'
    ),
    espera: { variables: { 'alumnos.promedio': [0, 2, 4], total: 6 } },
  },
  {
    nombre: 'estructuras: un arreglo con datos de prueba',
    codigo: con(
      'TAlumno alumnos[MAX];\nint i;\nfloat total = 0;\nfor (i = 0; i < MAX; i++) {\n  total += alumnos[i].promedio;\n}'
    ),
    prueba: { 'alumnos.promedio': [7, 9, 5] },
    espera: { variables: { total: 21 } },
  },
  {
    nombre: 'estructuras: leer con scanf en cada elemento',
    codigo: con('TAlumno alumnos[MAX];\nint i;\nfor (i = 0; i < MAX; i++) {\n  scanf("%d", &alumnos[i].legajo);\n}'),
    entrada: [11, 22, 33],
    espera: { variables: { 'alumnos.legajo': [11, 22, 33] } },
  },
  {
    nombre: 'estructuras: el formato no corresponde al campo',
    codigo: con('TAlumno alumno;\nalumno.promedio = 8.5;\nprintf("%d", alumno.promedio);'),
    espera: { error: 'FormatoDistinto' },
  },
  {
    nombre: 'estructuras: una posicion que no existe',
    codigo: con('TAlumno alumnos[MAX];\nalumnos[3].legajo = 5;'),
    espera: { error: 'FueraDeRango' },
  },
  {
    nombre: 'estructuras: un campo sin valor',
    codigo: con('TAlumno alumno;\nint x;\nx = alumno.legajo;'),
    espera: { error: 'SinValor' },
  },
  {
    nombre: "estructuras: un campo cadena se sigue letra por letra",
    codigo: con("TAlumno alumno;\nalumno.apellidoNombre[0] = 'P';\nprintf(\"%c\", alumno.apellidoNombre[0]);"),
    espera: {"salida":"P"},
  },
  {
    nombre: "cadenas: un texto escrito en un arreglo de char",
    codigo: con("char s[10] = \"hola\";\nprintf(\"%s %d\", s, strlen(s));"),
    espera: {"salida":"hola 4"},
  },
  {
    nombre: "cadenas: sin tamano, entra el texto y su fin",
    codigo: con("char s[] = \"ab\";\nprintf(\"%s\", s);"),
    espera: {"salida":"ab"},
  },
  {
    nombre: "cadenas: strcpy en un campo de una estructura",
    codigo: con("TAlumno a;\nstrcpy(a.apellidoNombre, \"Perez\");\nprintf(\"%s\", a.apellidoNombre);"),
    espera: {"salida":"Perez"},
  },
  {
    nombre: "cadenas: strcpy que no entra se sale del arreglo",
    codigo: con("char s[3];\nstrcpy(s, \"hola\");"),
    espera: {"error":"FueraDeRango"},
  },
  {
    nombre: "cadenas: strcmp de iguales y de distintas",
    codigo: con("printf(\"%d %d %d\", strcmp(\"ab\", \"ab\") == 0, strcmp(\"ab\", \"ac\") < 0, strcmp(\"b\", \"a\") > 0);"),
    espera: {"salida":"1 1 1"},
  },
  {
    nombre: "cadenas: strcmp entre un campo y un texto",
    codigo: con("TAlumno a;\nstrcpy(a.apellidoNombre, \"Luna\");\nif (strcmp(a.apellidoNombre, \"Luna\") == 0) {\n  printf(\"igual\");\n}"),
    espera: {"salida":"igual"},
  },
  {
    nombre: "cadenas: scanf lee una palabra",
    codigo: con("char s[10];\nscanf(\"%s\", s);\nprintf(\"[%s]\", s);"),
    entrada: ["ana"],
    espera: {"salida":"[ana]"},
  },
  {
    nombre: "cadenas: scanf con una sola letra",
    codigo: con("char s[10];\nscanf(\"%s\", s);\nprintf(\"[%s]\", s);"),
    entrada: [120],
    espera: {"salida":"[x]"},
  },
  {
    nombre: "cadenas: gets lee la linea entera",
    codigo: con("char s[20];\ngets(s);\nprintf(\"[%s]\", s);"),
    entrada: ["ana maria"],
    espera: {"salida":"[ana maria]"},
  },
  {
    nombre: "cadenas: scanf con una palabra que no entra",
    codigo: con("char s[4];\nscanf(\"%s\", s);"),
    entrada: ["abcdef"],
    espera: {"error":"FueraDeRango"},
  },
  {
    nombre: "cadenas: una cadena como parametro",
    codigo: conFunciones("void copiar(char destino[], char origen[]) {\n  strcpy(destino, origen);\n}", "char a[10];\ncopiar(a, \"Gomez\");\nprintf(\"%s\", a);"),
    espera: {"salida":"Gomez"},
  },
  {
    nombre: "cadenas: un campo de un elemento de un arreglo como argumento",
    codigo: conFunciones("void mostrar(char t[]) {\n  printf(\"%s\", t);\n}", "TAlumno alumnos[MAX];\nstrcpy(alumnos[1].apellidoNombre, \"Gomez\");\nmostrar(alumnos[1].apellidoNombre);"),
    espera: {"salida":"Gomez"},
  },
  {
    nombre: "cadenas: char * como parametro",
    codigo: conFunciones("void mostrar(char *t) {\n  printf(\"%s\", t);\n}", "mostrar(\"hola\");"),
    espera: {"salida":"hola"},
  },
  {
    nombre: "cadenas: copiar el nombre dentro de una estructura por puntero",
    codigo: conFunciones("void poner(TAlumno *a, char nombre[]) {\n  strcpy(a->apellidoNombre, nombre);\n}", "TAlumno alumno;\nponer(&alumno, \"Luna\");\nprintf(\"%s\", alumno.apellidoNombre);"),
    espera: {"salida":"Luna"},
  },
  {
    nombre: "cadenas: una estructura por valor lleva su cadena",
    codigo: conFunciones("int mismo(TAlumno a) {\n  strcpy(a.apellidoNombre, \"Otro\");\n  return strcmp(a.apellidoNombre, \"Otro\");\n}", "TAlumno alumno;\nstrcpy(alumno.apellidoNombre, \"Luna\");\nprintf(\"%d %s\", mismo(alumno), alumno.apellidoNombre);"),
    espera: {"salida":"0 Luna"},
  },
  {
    nombre: "cadenas: un long se lee y se muestra con %ld",
    codigo: con("long t;\nscanf(\"%ld\", &t);\nprintf(\"%ld\", t + 1);"),
    entrada: [7],
    espera: {"salida":"8"},
  },
  {
    nombre: "cadenas: un texto leido como numero queda sin verificar",
    codigo: con("int n;\nscanf(\"%d\", &n);"),
    entrada: ["ana"],
    espera: {"error":"SinVerificar"},
  },
  {
    nombre: 'estructuras: una estructura entera se copia en otra',
    codigo: con('TAlumno alumno;\nTAlumno copia;\nalumno.legajo = 5;\ncopia = alumno;\nalumno.legajo = 9;'),
    espera: { variables: { 'copia.legajo': 5, 'alumno.legajo': 9 } },
  },
  {
    nombre: 'estructuras: una funcion devuelve una estructura',
    codigo: conFunciones(
      'typedef struct {\n  int dia;\n  int mes;\n} TF;\n\nTF crear(void) {\n  TF f;\n\n  f.dia = 4;\n  f.mes = 12;\n  return f;\n}',
      'TF hoy;\nint r;\nhoy = crear();\nr = hoy.mes;'
    ),
    espera: { variables: { r: 12, 'hoy.dia': 4 } },
  },
  {
    nombre: 'estructuras: se declara con lo que devuelve una funcion',
    codigo: conFunciones(
      'typedef struct {\n  int dia;\n  int mes;\n} TF;\n\nTF crear(void) {\n  TF f;\n\n  f.dia = 4;\n  f.mes = 12;\n  return f;\n}',
      'TF hoy = crear();\nint r;\nr = hoy.dia;'
    ),
    espera: { variables: { r: 4 } },
  },
  {
    nombre: 'estructuras anidadas: un campo de adentro',
    codigo: con('TPersona p;\np.nacimiento.anio = 2004;\np.ingreso.anio = 2022;\nint edad = p.ingreso.anio - p.nacimiento.anio;'),
    espera: { variables: { 'p.nacimiento.anio': 2004, 'p.ingreso.anio': 2022, edad: 18 } },
  },
  {
    nombre: 'estructuras anidadas: con datos de prueba',
    codigo: con('TPersona p;\nint edad = p.ingreso.anio - p.nacimiento.anio;'),
    prueba: { 'p.nacimiento.anio': 1985, 'p.ingreso.anio': 2005 },
    espera: { variables: { edad: 20 } },
  },
  {
    nombre: 'estructuras anidadas: en un arreglo',
    codigo: con(
      'TPersona gente[MAX];\nint i;\nint antes = 0;\nfor (i = 0; i < MAX; i++) {\n  if (gente[i].nacimiento.anio < 2000) {\n    antes++;\n  }\n}'
    ),
    prueba: { 'gente.nacimiento.anio': [2004, 1998, 1990] },
    espera: { variables: { antes: 2 } },
  },
  {
    nombre: 'estructuras anidadas: leer con scanf',
    codigo: con('TPersona gente[MAX];\nint i;\nfor (i = 0; i < MAX; i++) {\n  scanf("%d", &gente[i].ingreso.anio);\n}'),
    entrada: [2010, 2015, 2020],
    espera: { variables: { 'gente.ingreso.anio': [2010, 2015, 2020] } },
  },
  {
    nombre: 'estructuras anidadas: una posicion que no existe',
    codigo: con('TPersona gente[MAX];\ngente[3].nacimiento.anio = 1;'),
    espera: { error: 'FueraDeRango' },
  },
  {
    nombre: 'estructuras anidadas: la fecha entera en una cuenta',
    codigo: con('TPersona p;\nint x;\nx = 3 + p.ingreso;'),
    espera: { error: 'EstructuraEntera' },
  },
  {
    nombre: 'estructuras anidadas: copiar la fecha no se sigue',
    codigo: con('TPersona p;\nTFecha otra;\notra = p.ingreso;'),
    espera: { error: 'SinVerificar' },
  },
  {
    nombre: 'enumerados: los nombres son enteros',
    codigo: con('TTurno t;\nt = TARDE;\nint x = NOCHE;\nenum Nivel n = ALTO;'),
    espera: { variables: { t: 1, x: 2, n: 6 } },
  },
  {
    nombre: 'enumerados: una variable se compara con un nombre',
    codigo: con('TTurno t = NOCHE;\nint r = 0;\nif (t == NOCHE) {\n  r = 1;\n}'),
    espera: { variables: { r: 1 } },
  },
  {
    nombre: 'switch: cada caso con su break',
    codigo: con(
      'TTurno t = NOCHE;\nint r = 0;\nswitch (t) {\n  case MANANA:\n    r = 1;\n    break;\n  case TARDE:\n    r = 2;\n    break;\n  case NOCHE:\n    r = 3;\n    break;\n  default:\n    r = 9;\n}'
    ),
    espera: { variables: { r: 3 } },
  },
  {
    nombre: 'switch: sin break sigue con el que viene',
    codigo: con('TTurno t = TARDE;\nint r = 0;\nswitch (t) {\n  case TARDE:\n    r += 1;\n  case NOCHE:\n    r += 10;\n    break;\n  default:\n    r = 99;\n}'),
    espera: { variables: { r: 11 } },
  },
  {
    nombre: 'switch: un valor sin caso va al default',
    codigo: con('TTurno t = (TTurno) 7;\nint r = 0;\nswitch (t) {\n  case MANANA:\n    r = 1;\n    break;\n  default:\n    r = 9;\n}'),
    espera: { variables: { r: 9 } },
  },
  {
    nombre: 'switch: sin default y sin coincidencia no hace nada',
    codigo: con('int r = 5;\nswitch (4) {\n  case 1:\n    r = 1;\n    break;\n}'),
    espera: { variables: { r: 5 } },
  },
  {
    nombre: 'switch: muestra un texto por caso',
    codigo: con('TTurno t = TARDE;\nswitch (t) {\n  case MANANA:\n    printf("Manana");\n    break;\n  case TARDE:\n    printf("Tarde");\n    break;\n}'),
    espera: { salida: 'Tarde' },
  },
  {
    nombre: 'leer: una letra con %c',
    codigo: con('char letra;\nscanf(" %c", &letra);'),
    entrada: [84],
    espera: { variables: { letra: 84 } },
  },
  {
    nombre: 'leer: una letra con otro formato',
    codigo: con('char letra;\nscanf("%d", &letra);'),
    entrada: [84],
    espera: { error: 'FormatoDistinto' },
  },
  {
    nombre: 'enumerados: un campo de una estructura',
    codigo: con('TCursante c;\nc.legajo = 5;\nc.turno = NOCHE;'),
    espera: { variables: { 'c.legajo': 5, 'c.turno': 2 } },
  },
  {
    nombre: 'valor de prueba: pisa la asignacion del codigo dado',
    codigo: con('TTurno t;\nt = TARDE;\n/*alumno*/\nint r = t;'),
    desdeEn: '/*alumno*/',
    prueba: { t: 2 },
    espera: { variables: { t: 2, r: 2 } },
  },
  {
    nombre: 'valor de prueba: no pisa lo que escribe el alumno',
    codigo: con('TTurno t;\n/*alumno*/\nt = TARDE;\nint r = t;'),
    desdeEn: '/*alumno*/',
    prueba: { t: 2 },
    espera: { variables: { t: 1, r: 1 } },
  },
  {
    nombre: 'estructuras: una variable que no existe',
    codigo: con('alumn.legajo = 5;'),
    espera: { error: 'NombreDesconocido' },
  },
  {
    nombre: 'estructuras: un texto donde va una letra',
    codigo: con('TAlumno alumno;\nalumno.turno = "T";'),
    espera: { error: 'TextoComoLetra' },
  },
  // ---- uniones ----
  {
    nombre: 'uniones: se guarda y se lee el mismo miembro',
    codigo: con('TMedida m;\nm.real = 36.5;\nprintf("%.1f", m.real);'),
    espera: { variables: { 'm.real': 36.5 }, salida: '36.5' },
  },
  {
    nombre: 'uniones: guardar en otro miembro pisa al primero',
    codigo: con('TMedida m;\nm.entero = 7;\nm.real = 2.5;\nint x = m.entero;'),
    espera: { error: 'MiembroNoVigente' },
  },
  {
    nombre: 'uniones: el miembro que se guardo ultimo se lee',
    codigo: con('TMedida m;\nm.real = 2.5;\nm.entero = 7;\nint x = m.entero;'),
    espera: { variables: { x: 7 } },
  },
  {
    nombre: 'uniones: sin ningun valor no es un miembro pisado',
    codigo: con('TMedida m;\nint x = m.entero;'),
    espera: { error: 'SinValor' },
  },
  {
    nombre: 'uniones: dentro de una estructura, con la etiqueta',
    codigo: con('TLectura l;\nl.tipo = REAL;\nl.medida.real = 36.5;\nif (l.tipo == REAL) {\n  printf("%.1f", l.medida.real);\n}'),
    espera: { variables: { 'l.tipo': 1, 'l.medida.real': 36.5 }, salida: '36.5' },
  },
  {
    nombre: 'uniones: leer el miembro equivocado dentro de una estructura',
    codigo: con('TLectura l;\nl.tipo = REAL;\nl.medida.real = 36.5;\nint x = l.medida.entero;'),
    espera: { error: 'MiembroNoVigente' },
  },
  {
    nombre: 'uniones: una union entera donde va un numero',
    codigo: con('TMedida m;\nm.real = 1.5;\nprintf("%.1f", m);'),
    espera: { error: 'EstructuraEntera' },
  },
  {
    nombre: 'uniones: sizeof del tipo es el del miembro mas grande',
    codigo: con('int n = sizeof(TMedida);'),
    espera: { variables: { n: 8 } },
  },
  {
    nombre: 'uniones: sizeof de una variable',
    codigo: con('TMedida m;\nint n = sizeof(m);\nint c = sizeof(union Dato);'),
    espera: { variables: { n: 8, c: 4 } },
  },
  {
    nombre: 'uniones: sizeof de una estructura no se sabe',
    codigo: con('int n = sizeof(TLectura);'),
    espera: { error: 'SinVerificar' },
  },
  {
    nombre: 'uniones: con valores de prueba por posicion, solo uno vale',
    codigo: con(
      'TLectura ls[MAX];\nint i;\ndouble total = 0;\nfor (i = 0; i < MAX; i++) {\n  if (ls[i].tipo == REAL) {\n    total += ls[i].medida.real;\n  }\n}'
    ),
    prueba: { 'ls.tipo': [1, 0, 1], 'ls.medida.real': [36.5, null, 18.5], 'ls.medida.entero': [null, 7, null] },
    espera: { variables: { total: 55 } },
  },
  {
    nombre: 'uniones: con valores de prueba, leer el miembro sin valor',
    codigo: con('TLectura ls[MAX];\nint i;\nint total = 0;\nfor (i = 0; i < MAX; i++) {\n  total += ls[i].medida.entero;\n}'),
    prueba: { 'ls.tipo': [1, 0, 1], 'ls.medida.real': [36.5, null, 18.5], 'ls.medida.entero': [null, 7, null] },
    espera: { error: 'MiembroNoVigente' },
  },
  // ---- funciones del programa ----
  {
    nombre: 'funciones: devuelve un valor',
    codigo: conFunciones('int sumar(int a, int b) {\n  return a + b;\n}', 'int r;\nr = sumar(3, 4);'),
    espera: { variables: { r: 7 } },
  },
  {
    nombre: 'funciones: se puede llamar a una definida despues (con su prototipo)',
    codigo: `${CABECERA}int doble(int n);\nint main() {\nint r;\nr = doble(4);\nreturn 0;\n}\nint doble(int n) {\n  return 2 * n;\n}`,
    espera: { variables: { r: 8 } },
  },
  {
    nombre: 'funciones: un parametro por valor no cambia la variable de afuera',
    codigo: conFunciones('void duplicar(int n) {\n  n = n * 2;\n}', 'int numero = 5;\nduplicar(numero);'),
    espera: { variables: { numero: 5 } },
  },
  {
    nombre: 'funciones: con & y * cambia la variable de afuera',
    codigo: conFunciones('void duplicar(int *n) {\n  *n = *n * 2;\n}', 'int numero = 5;\nduplicar(&numero);'),
    espera: { variables: { numero: 10 } },
  },
  {
    nombre: 'funciones: intercambiar dos variables',
    codigo: conFunciones(
      'void intercambiar(int *a, int *b) {\n  int aux;\n  aux = *a;\n  *a = *b;\n  *b = aux;\n}',
      'int x = 3;\nint y = 8;\nintercambiar(&x, &y);'
    ),
    espera: { variables: { x: 8, y: 3 } },
  },
  {
    nombre: 'funciones: un arreglo se pasa sin & y se modifica',
    codigo: conFunciones(
      'void llenar(int v[], int n) {\n  int i;\n  for (i = 0; i < n; i++) {\n    v[i] = i * 10;\n  }\n}',
      'int notas[MAX];\nllenar(notas, MAX);'
    ),
    espera: { variables: { notas: [0, 10, 20] } },
  },
  {
    nombre: 'funciones: la direccion de un elemento del arreglo',
    codigo: conFunciones('void duplicar(int *n) {\n  *n = *n * 2;\n}', 'int notas[MAX] = {1, 2, 3};\nduplicar(&notas[1]);'),
    espera: { variables: { notas: [1, 4, 3] } },
  },
  {
    nombre: 'funciones: sin el & al llamar',
    codigo: conFunciones('void duplicar(int *n) {\n  *n = *n * 2;\n}', 'int numero = 5;\nduplicar(numero);'),
    espera: { error: 'LlamadaSinAmpersand' },
  },
  {
    nombre: 'funciones: con & donde se recibe un valor',
    codigo: conFunciones('void duplicar(int n) {\n  n = n * 2;\n}', 'int numero = 5;\nduplicar(&numero);'),
    espera: { error: 'LlamadaConAmpersand' },
  },
  {
    nombre: 'funciones: el parametro con * se usa sin el *',
    codigo: conFunciones('void poner(int *n) {\n  n = 7;\n}', 'int numero = 5;\nponer(&numero);'),
    espera: { error: 'PunteroSinAsterisco' },
  },
  {
    nombre: 'funciones: un * donde no hay direccion',
    codigo: conFunciones('void poner(int n) {\n  *n = 7;\n}', 'int numero = 5;\nponer(numero);'),
    espera: { error: 'AsteriscoDeMas' },
  },
  {
    nombre: 'funciones: otra cantidad de argumentos',
    codigo: conFunciones('int sumar(int a, int b) {\n  return a + b;\n}', 'int r;\nr = sumar(3);'),
    espera: { error: 'ArgumentosDistintos' },
  },
  {
    nombre: 'funciones: usar el valor de una funcion que no devuelve nada',
    codigo: conFunciones('int sumar(int a, int b) {\n  int c = a + b;\n}', 'int r;\nr = sumar(3, 4);'),
    espera: { error: 'SinRetorno' },
  },
  {
    nombre: 'funciones: usar el valor de una funcion void',
    codigo: conFunciones('void hola(void) {\n  printf("hola");\n}', 'int r;\nr = hola();'),
    espera: { error: 'VoidComoValor' },
  },
  {
    nombre: 'funciones: una variable de adentro no es la de afuera',
    codigo: conFunciones('int mas(int n) {\n  int r = n + 1;\n  return r;\n}', 'int r = 100;\nint s;\ns = mas(1);'),
    espera: { variables: { r: 100, s: 2 } },
  },
  // ---- estructuras, arreglos y tablas como parametros ----
  {
    nombre: 'estructuras: por valor, la funcion modifica una copia',
    codigo: conFunciones(
      'typedef struct {\n  int dia;\n} TF;\n\nvoid adelantar(TF f) {\n  f.dia = f.dia + 1;\n}',
      'TF hoy;\nint r;\nhoy.dia = 10;\nadelantar(hoy);\nr = hoy.dia;'
    ),
    espera: { variables: { r: 10 } },
  },
  {
    nombre: 'estructuras: la funcion lee los campos de lo que recibe',
    codigo: conFunciones(
      'typedef struct {\n  int dia;\n  int mes;\n} TF;\n\nint sumar(TF f) {\n  return f.dia + f.mes;\n}',
      'TF hoy;\nint r;\nhoy.dia = 10;\nhoy.mes = 5;\nr = sumar(hoy);'
    ),
    espera: { variables: { r: 15 } },
  },
  {
    nombre: 'tablas: una tabla recibida es la misma',
    codigo: conFunciones(
      'void poner(int t[][2]) {\n  t[1][0] = 9;\n}',
      'int t[2][2] = {{1, 2}, {3, 4}};\nint r;\nponer(t);\nr = t[1][0];'
    ),
    espera: { variables: { r: 9 } },
  },
  // ---- printf con %s ----
  {
    nombre: 'cadenas: printf con %s muestra la cadena hasta su fin',
    codigo: con("char t[5];\nt[0] = 'A';\nt[1] = 'n';\nt[2] = 'a';\nt[3] = 0;\nprintf(\"[%s]\", t);"),
    espera: { salida: '[Ana]' },
  },
  {
    nombre: 'cadenas: printf con %s y un texto escrito',
    codigo: con('printf("<%s>", "hola");'),
    espera: { salida: '<hola>' },
  },
  {
    nombre: 'cadenas: una cadena sin su fin no se sigue',
    codigo: con("char t[2];\nt[0] = 'A';\nt[1] = 'b';\nprintf(\"%s\", t);"),
    espera: { error: 'SinVerificar' },
  },
  // ---- globales ----
  {
    nombre: 'globales: sin valor empiezan en cero',
    codigo: `${CABECERA}int g;\nint main() {\nint r;\nr = g + 1;\nreturn 0;\n}`,
    espera: { variables: { r: 1 } },
  },
  {
    nombre: 'globales: una funcion cambia la que ve main',
    codigo: `${CABECERA}int veces = 0;\nvoid contar(void) {\n  veces = veces + 1;\n}\nint main() {\ncontar();\ncontar();\nreturn 0;\n}`,
    espera: { variables: { veces: 2 } },
  },
  // ---- ambito de bloque ----
  {
    nombre: 'bloques: una variable de un if no existe despues',
    codigo: conFunciones('', 'int r = 1;\nif (r == 1) {\n  int d = 10;\n}\nr = d;'),
    espera: { error: 'NombreDesconocido' },
  },
  {
    nombre: 'bloques: el i de un for no existe despues',
    codigo: conFunciones('', 'int r = 0;\nfor (int i = 0; i < 3; i++) {\n  r = r + i;\n}\nr = i;'),
    espera: { error: 'NombreDesconocido' },
  },
  {
    nombre: 'bloques: una variable de adentro tapa a la de afuera',
    codigo: conFunciones('', 'int x = 1;\nint y = 0;\nif (x == 1) {\n  int x = 5;\n  y = x;\n}'),
    espera: { variables: { x: 1, y: 5 } },
  },
  {
    nombre: 'bloques: lo declarado antes del bloque se ve y se modifica adentro',
    codigo: conFunciones('', 'int suma = 0;\nfor (int i = 1; i <= 3; i++) {\n  suma = suma + i;\n}'),
    espera: { variables: { suma: 6 } },
  },
  {
    nombre: 'funciones: una recursion',
    codigo: conFunciones(
      'int factorial(int n) {\n  if (n <= 1) {\n    return 1;\n  }\n  return n * factorial(n - 1);\n}',
      'int r;\nr = factorial(5);'
    ),
    espera: { variables: { r: 120 } },
  },
  {
    nombre: 'funciones: una recursion que no termina',
    codigo: conFunciones('int f(int n) {\n  return f(n + 1);\n}', 'int r;\nr = f(1);'),
    espera: { error: 'RecursionSinFin' },
  },
  {
    nombre: 'funciones: devuelve un decimal',
    codigo: conFunciones('float mitad(int n) {\n  return n / 2.0;\n}', 'float r;\nr = mitad(5);'),
    espera: { variables: { r: 2.5 } },
  },
  {
    nombre: 'funciones: una variable global',
    codigo: `${CABECERA}int total = 10;\nvoid sumar(int n) {\n  total = total + n;\n}\nint main() {\nsumar(5);\nreturn 0;\n}`,
    espera: { variables: { total: 15 } },
  },
  {
    nombre: 'funciones: lo que muestra una funcion sale en la salida',
    codigo: conFunciones('void saludar(void) {\n  printf("hola");\n}', 'saludar();\nsaludar();'),
    espera: { salida: 'holahola' },
  },
  {
    nombre: 'uniones: el valor de prueba de un miembro no lo pisa el codigo dado',
    codigo: con('TMedida m;\nm.real = 1.5;\nprintf("%d", m.entero);'),
    prueba: { 'm.entero': 9 },
    desdeEn: 'printf',
    espera: { salida: '9' },
  },
  // ---- variables puntero ----
  {
    nombre: 'punteros: se escribe en la variable a traves del puntero',
    codigo: conFunciones('', 'int n = 5;\nint *p = &n;\n*p = 10;'),
    espera: { variables: { n: 10 } },
  },
  {
    nombre: 'punteros: declarar primero y apuntar despues',
    codigo: conFunciones('', 'int n = 5;\nint *p;\np = &n;\n*p = *p + 1;'),
    espera: { variables: { n: 6 } },
  },
  {
    nombre: 'punteros: se lee la variable a traves del puntero',
    codigo: conFunciones('', 'int n = 7;\nint r;\nint *p = &n;\nr = *p;'),
    espera: { variables: { r: 7 } },
  },
  {
    nombre: 'punteros: dos punteros a la misma variable',
    codigo: conFunciones('', 'int n = 1;\nint r;\nint *p = &n;\nint *q = p;\n*q = 9;\nr = *p;'),
    espera: { variables: { n: 9, r: 9 } },
  },
  {
    nombre: 'punteros: apuntar a otra variable',
    codigo: conFunciones('', 'int a = 1;\nint b = 2;\nint *p = &a;\np = &b;\n*p = 7;'),
    espera: { variables: { a: 1, b: 7 } },
  },
  {
    nombre: 'punteros: un puntero a float',
    codigo: conFunciones('', 'float x = 1.5;\nfloat *p = &x;\n*p = *p * 2;'),
    espera: { variables: { x: 3 } },
  },
  {
    nombre: 'punteros: un puntero a un elemento de un arreglo',
    codigo: conFunciones('', 'int v[MAX] = {1, 2, 3};\nint *p = &v[1];\n*p = 20;'),
    espera: { variables: { v: [1, 20, 3] } },
  },
  {
    nombre: 'punteros: el puntero se pasa a una funcion',
    codigo: conFunciones('void poner(int *x) {\n  *x = 4;\n}', 'int n = 1;\nint *p = &n;\nponer(p);'),
    espera: { variables: { n: 4 } },
  },
  {
    nombre: 'punteros: scanf con un puntero',
    codigo: conFunciones('', 'int n = 0;\nint *p = &n;\nscanf("%d", p);'),
    entrada: [5],
    espera: { variables: { n: 5 } },
  },
  {
    nombre: 'punteros: se muestra lo que apunta',
    codigo: conFunciones('', 'int n = 8;\nint *p = &n;\nprintf("%d", *p);'),
    espera: { salida: '8' },
  },
  {
    nombre: 'punteros: sin el & el puntero no recibe una direccion',
    codigo: conFunciones('', 'int n = 5;\nint *p;\np = n;'),
    espera: { error: 'PunteroSinAmpersand' },
  },
  {
    nombre: 'punteros: sin el & al declararlo',
    codigo: conFunciones('', 'int n = 5;\nint *p = n;'),
    espera: { error: 'PunteroSinAmpersand' },
  },
  {
    nombre: 'punteros: un numero donde va una direccion',
    codigo: conFunciones('', 'int n = 5;\nint *p = &n;\np = 10;'),
    espera: { error: 'PunteroConUnValor' },
  },
  {
    nombre: 'punteros: el puntero se muestra sin el *',
    codigo: conFunciones('', 'int n = 5;\nint *p = &n;\nprintf("%d", p);'),
    espera: { error: 'PunteroSinAsterisco' },
  },
  {
    nombre: 'punteros: un puntero a otro tipo',
    codigo: conFunciones('', 'float x = 1.5;\nint *p = &x;'),
    espera: { error: 'PunteroTipoDistinto' },
  },
  {
    nombre: 'punteros: una direccion en una variable comun',
    codigo: conFunciones('', 'int n = 5;\nint m = 0;\nm = &n;'),
    espera: { error: 'DireccionEnVariable' },
  },
  {
    nombre: 'punteros: una direccion donde va el valor',
    codigo: conFunciones('', 'int n = 5;\nint *p = &n;\n*p = &n;'),
    espera: { error: 'DireccionEnVariable' },
  },
  {
    nombre: 'punteros: sin apuntar a nada',
    codigo: conFunciones('', 'int *p;\n*p = 3;'),
    espera: { error: 'PunteroSinDestino' },
  },
  {
    nombre: 'punteros: NULL no apunta a nada',
    codigo: conFunciones('', 'int *p = NULL;\n*p = 3;'),
    espera: { error: 'PunteroSinDestino' },
  },
  {
    nombre: 'punteros: scanf con el puntero tal cual',
    codigo: conFunciones('void leer(int *x) {\n  scanf("%d", x);\n}', 'int n = 0;\nleer(&n);'),
    entrada: [4],
    espera: { variables: { n: 4 } },
  },
  {
    nombre: 'punteros: scanf con & sobre el puntero',
    codigo: conFunciones('void leer(int *x) {\n  scanf("%d", &x);\n}', 'int n = 0;\nleer(&n);'),
    entrada: [4],
    espera: { error: 'PunteroEnScanf' },
  },
  {
    nombre: 'punteros: scanf con * sobre el puntero',
    codigo: conFunciones('void leer(int *x) {\n  scanf("%d", *x);\n}', 'int n = 0;\nleer(&n);'),
    entrada: [4],
    espera: { error: 'PunteroEnScanf' },
  },
  {
    nombre: 'punteros: la aritmetica fuera de un arreglo no se sigue',
    codigo: conFunciones('', 'int n = 1;\nint *p = &n;\np = p + 1;'),
    espera: { error: 'SinVerificar' },
  },
  {
    nombre: 'punteros: una cuenta con un puntero no es un numero',
    codigo: conFunciones('', 'int v[MAX] = {1, 2, 3};\nint *p = v;\nprintf("%d", p + 1);'),
    espera: { error: 'SinVerificar' },
  },
  // ---- punteros y arreglos ----
  {
    nombre: 'arreglos: el nombre del arreglo es la direccion de su primer elemento',
    codigo: conFunciones('', 'int v[MAX] = {10, 20, 30};\nint *p = v;\nint r;\nr = *p;'),
    espera: { variables: { r: 10 } },
  },
  {
    nombre: 'arreglos: p + 2 apunta al tercer elemento',
    codigo: conFunciones('', 'int v[MAX] = {10, 20, 30};\nint *p = v;\nint r;\nr = *(p + 2);'),
    espera: { variables: { r: 30 } },
  },
  {
    nombre: 'arreglos: *(v + 1) con el nombre del arreglo',
    codigo: conFunciones('', 'int v[MAX] = {10, 20, 30};\n*(v + 1) = 8;'),
    espera: { variables: { v: [10, 8, 30] } },
  },
  {
    nombre: 'arreglos: un puntero a una posicion',
    codigo: conFunciones('', 'int v[MAX] = {10, 20, 30};\nint *p = &v[1];\n*p = 99;'),
    espera: { variables: { v: [10, 99, 30] } },
  },
  {
    nombre: 'arreglos: p[i] es *(p + i)',
    codigo: conFunciones('', 'int v[MAX] = {10, 20, 30};\nint *p = v;\nint r;\nr = p[1];\np[2] = 7;'),
    espera: { variables: { r: 20, v: [10, 20, 7] } },
  },
  {
    nombre: 'arreglos: p++ pasa al elemento siguiente',
    codigo: conFunciones('', 'int v[MAX] = {10, 20, 30};\nint *p = v;\nint r;\np++;\nr = *p;'),
    espera: { variables: { r: 20 } },
  },
  {
    nombre: 'arreglos: p += 2 y p--',
    codigo: conFunciones('', 'int v[MAX] = {10, 20, 30};\nint *p = v;\np += 2;\n*p = 1;\np--;\n*p = 2;'),
    espera: { variables: { v: [10, 2, 1] } },
  },
  {
    nombre: 'arreglos: recorrer con un puntero que avanza',
    codigo: conFunciones(
      '',
      'int v[MAX] = {10, 20, 30};\nint *p = v;\nint s = 0;\nint i;\nfor (i = 0; i < MAX; i++) {\n  s = s + *p;\n  p++;\n}'
    ),
    espera: { variables: { s: 60 } },
  },
  {
    nombre: 'arreglos: *p++ lee y avanza',
    codigo: conFunciones('', 'int v[MAX] = {10, 20, 30};\nint *p = v;\nint a;\nint b;\na = *p++;\nb = *p;'),
    espera: { variables: { a: 10, b: 20 } },
  },
  {
    nombre: 'arreglos: un puntero que se pasa del arreglo',
    codigo: conFunciones('', 'int v[MAX] = {10, 20, 30};\nint *p = v;\nint r;\nr = *(p + 3);'),
    espera: { error: 'FueraDeRango' },
  },
  {
    nombre: 'arreglos: una posicion despues del final se puede tener pero no leer',
    codigo: conFunciones('', 'int v[MAX] = {10, 20, 30};\nint *p = v + MAX;\nint r;\nr = *p;'),
    espera: { error: 'FueraDeRango' },
  },
  {
    nombre: 'arreglos: un puntero a otro tipo de arreglo',
    codigo: conFunciones('', 'float x[MAX] = {1.5, 2.5, 3.5};\nint *p = x;'),
    espera: { error: 'PunteroTipoDistinto' },
  },
  {
    nombre: 'arreglos: un puntero a un arreglo se pasa a una funcion',
    codigo: conFunciones(
      'void ponerEnCero(int *v, int n) {\n  int i;\n\n  for (i = 0; i < n; i++) {\n    *(v + i) = 0;\n  }\n}',
      'int v[MAX] = {1, 2, 3};\nponerEnCero(v, MAX);'
    ),
    espera: { variables: { v: [0, 0, 0] } },
  },
  {
    nombre: 'arreglos: un parametro arreglo se recorre con un puntero',
    codigo: conFunciones(
      'void duplicar(int v[], int n) {\n  int *p = v;\n  int i;\n\n  for (i = 0; i < n; i++) {\n    *p = *p * 2;\n    p++;\n  }\n}',
      'int v[MAX] = {1, 2, 3};\nduplicar(v, MAX);'
    ),
    espera: { variables: { v: [2, 4, 6] } },
  },
  {
    nombre: 'arreglos: un parametro arreglo con indices',
    codigo: conFunciones(
      'void poner(int v[]) {\n  v[1] = 5;\n}',
      'int v[MAX] = {1, 2, 3};\nponer(v);'
    ),
    espera: { variables: { v: [1, 5, 3] } },
  },
  {
    nombre: 'arreglos: sizeof de un parametro arreglo es lo que ocupa un puntero',
    codigo: conFunciones('void tamano(int v[]) {\n  printf("%d", (int) sizeof(v));\n}', 'int v[MAX] = {1, 2, 3};\ntamano(v);'),
    espera: { salida: '8' },
  },
  {
    nombre: 'arreglos: sizeof del arreglo en main es lo que ocupa el arreglo',
    codigo: conFunciones('', 'int v[MAX] = {1, 2, 3};\nprintf("%d", (int) sizeof(v));'),
    espera: { salida: '12' },
  },
  {
    nombre: 'cadenas: recorrer una cadena con un puntero hasta el fin',
    codigo: conFunciones('', 'char texto[3];\nchar *p = texto;\nint n = 0;\nwhile (*p != \'\\0\') {\n  n++;\n  p++;\n}'),
    prueba: { texto: [72, 105, 0] },
    espera: { variables: { n: 2 } },
  },
  // ---- punteros a estructuras ----
  {
    nombre: 'punteros a estructuras: la flecha escribe en los campos',
    codigo: conFunciones('', 'TFecha f;\nTFecha *p = &f;\np->dia = 10;\np->mes = 5;'),
    espera: { variables: { 'f.dia': 10, 'f.mes': 5 } },
  },
  {
    nombre: 'punteros a estructuras: declarar primero y apuntar despues',
    codigo: conFunciones('', 'TFecha f;\nTFecha *p;\np = &f;\np->anio = 2026;'),
    espera: { variables: { 'f.anio': 2026 } },
  },
  {
    nombre: 'punteros a estructuras: (*p).campo lee',
    codigo: conFunciones('', 'TFecha f;\nint r;\nf.anio = 2026;\nTFecha *p = &f;\nr = (*p).anio;'),
    espera: { variables: { r: 2026 } },
  },
  {
    nombre: 'punteros a estructuras: (*p).campo escribe',
    codigo: conFunciones('', 'TFecha f;\nTFecha *p = &f;\n(*p).mes = 12;'),
    espera: { variables: { 'f.mes': 12 } },
  },
  {
    nombre: 'punteros a estructuras: se muestra un campo con la flecha',
    codigo: conFunciones('', 'TFecha f;\nf.dia = 3;\nTFecha *p = &f;\nprintf("%d", p->dia);'),
    espera: { salida: '3' },
  },
  {
    nombre: 'punteros a estructuras: una funcion cambia la estructura de afuera',
    codigo: conFunciones('void siguienteAnio(TFecha *x) {\n  x->anio = x->anio + 1;\n}', 'TFecha f;\nf.anio = 2026;\nsiguienteAnio(&f);'),
    espera: { variables: { 'f.anio': 2027 } },
  },
  {
    nombre: 'punteros a estructuras: el puntero se pasa a otra funcion',
    codigo: conFunciones(
      'void poner(TFecha *x) {\n  x->dia = 1;\n}\nvoid inicio(TFecha *y) {\n  poner(y);\n}',
      'TFecha f;\nTFecha *p = &f;\ninicio(p);'
    ),
    espera: { variables: { 'f.dia': 1 } },
  },
  {
    nombre: 'punteros a estructuras: scanf con &p->campo',
    codigo: conFunciones('void leer(TFecha *x) {\n  scanf("%d", &x->dia);\n  scanf("%d", &x->mes);\n}', 'TFecha f;\nleer(&f);'),
    entrada: [7, 9],
    espera: { variables: { 'f.dia': 7, 'f.mes': 9 } },
  },
  {
    nombre: 'punteros a estructuras: una estructura de adentro',
    codigo: conFunciones('', 'TPersona a;\nTPersona *p = &a;\np->legajo = 5;\np->nacimiento.anio = 2004;'),
    espera: { variables: { 'a.legajo': 5, 'a.nacimiento.anio': 2004 } },
  },
  {
    nombre: 'punteros a estructuras: dos punteros a la misma estructura',
    codigo: conFunciones('', 'TFecha f;\nint r;\nTFecha *p = &f;\nTFecha *q = p;\nq->dia = 9;\nr = p->dia;'),
    espera: { variables: { r: 9 } },
  },
  {
    nombre: 'punteros a estructuras: el punto con un puntero',
    codigo: conFunciones('', 'TFecha f;\nTFecha *p = &f;\np.dia = 1;'),
    espera: { error: 'PuntoConPuntero' },
  },
  {
    nombre: 'punteros a estructuras: el asterisco antes del punto',
    codigo: conFunciones('', 'TFecha f;\nTFecha *p = &f;\n*p.dia = 1;'),
    espera: { error: 'PuntoConPuntero' },
  },
  {
    nombre: 'punteros a estructuras: la flecha con una estructura comun',
    codigo: conFunciones('', 'TFecha f;\nf->dia = 1;'),
    espera: { error: 'FlechaConEstructura' },
  },
  {
    nombre: 'punteros a estructuras: llamar sin el &',
    codigo: conFunciones('void poner(TFecha *x) {\n  x->dia = 1;\n}', 'TFecha f;\nponer(f);'),
    espera: { error: 'LlamadaSinAmpersand' },
  },
  {
    nombre: 'punteros a estructuras: sin el & al apuntar',
    codigo: conFunciones('', 'TFecha f;\nTFecha *p = f;'),
    espera: { error: 'PunteroSinAmpersand' },
  },
  {
    nombre: 'punteros a estructuras: apuntar a una variable de otro tipo',
    codigo: conFunciones('', 'int n = 1;\nTFecha *p = &n;'),
    espera: { error: 'PunteroTipoDistinto' },
  },
  {
    nombre: 'punteros a estructuras: apuntar a otra estructura',
    codigo: conFunciones('', 'TPersona a;\nTFecha *p = &a;'),
    espera: { error: 'PunteroTipoDistinto' },
  },
  {
    nombre: 'punteros a estructuras: un puntero que todavia no apunta a nada',
    codigo: conFunciones('', 'TFecha *p;\np->dia = 1;'),
    espera: { error: 'PunteroSinDestino' },
  },
  {
    nombre: 'punteros a estructuras: un puntero NULL',
    codigo: conFunciones('', 'TFecha *p = NULL;\np->dia = 1;'),
    espera: { error: 'PunteroSinDestino' },
  },
  {
    nombre: "NULL y direcciones: if (p != NULL) con un puntero que apunta",
    codigo: conFunciones('', 'int n = 5;\nint *p = &n;\nint r = 0;\nif (p != NULL) {\n  r = 1;\n}'),
    espera: { variables: { r: 1 } },
  },
  {
    nombre: "NULL y direcciones: if (p != NULL) con NULL",
    codigo: conFunciones('', 'int *p = NULL;\nint r = 0;\nif (p != NULL) {\n  r = 1;\n}'),
    espera: { variables: { r: 0 } },
  },
  {
    nombre: "NULL y direcciones: if (p == NULL) con NULL",
    codigo: conFunciones('', 'int *p = NULL;\nint r = 0;\nif (p == NULL) {\n  r = 1;\n}'),
    espera: { variables: { r: 1 } },
  },
  {
    nombre: "NULL y direcciones: if (p) y if (!p)",
    codigo: conFunciones('', 'int n = 5;\nint *p = &n;\nint *q = NULL;\nint r = 0;\nif (p) {\n  r = r + 1;\n}\nif (!q) {\n  r = r + 10;\n}\nif (q) {\n  r = r + 100;\n}'),
    espera: { variables: { r: 11 } },
  },
  {
    nombre: "NULL y direcciones: p && *p con NULL no llega al asterisco",
    codigo: conFunciones('', 'int *p = NULL;\nint r = 0;\nif (p != NULL && *p > 0) {\n  r = 1;\n}'),
    espera: { variables: { r: 0 } },
  },
  {
    nombre: "NULL y direcciones: una condicion con un puntero que no apunta a nada no se sigue",
    codigo: conFunciones('', 'int *p;\nint r = 0;\nif (p != NULL) {\n  r = 1;\n}'),
    espera: { error: 'SinVerificar' },
  },
  {
    nombre: "NULL y direcciones: p == q con el mismo destino",
    codigo: conFunciones('', 'int n = 5;\nint *p = &n;\nint *q = &n;\nprintf("%d", p == q);'),
    espera: { salida: '1' },
  },
  {
    nombre: "NULL y direcciones: p == q con dos variables que valen lo mismo",
    codigo: conFunciones('', 'int n = 5;\nint m = 5;\nint *p = &n;\nint *q = &m;\nprintf("%d %d %d", p == q, p != q, *p == *q);'),
    espera: { salida: '0 1 1' },
  },
  {
    nombre: "NULL y direcciones: dos posiciones de un arreglo",
    codigo: conFunciones('', 'int v[3] = {1, 1, 1};\nint *p = &v[0];\nint *q = &v[1];\nint *r = v;\nprintf("%d %d", p == q, p == r);'),
    espera: { salida: '0 1' },
  },
  {
    nombre: "NULL y direcciones: comparar con 0",
    codigo: conFunciones('', 'int *p = NULL;\nprintf("%d", p == 0);'),
    espera: { salida: '1' },
  },
  {
    nombre: "NULL y direcciones: pasar NULL a una funcion que lo comprueba",
    codigo: conFunciones("void sumarUno(int *x) {\n  if (x != NULL) {\n    *x = *x + 1;\n  }\n}", 'int n = 5;\nsumarUno(&n);\nsumarUno(NULL);'),
    espera: { variables: { n: 6 } },
  },
  {
    nombre: "NULL y direcciones: pasar NULL a una funcion que no lo comprueba",
    codigo: conFunciones("void sumarUno(int *x) {\n  *x = *x + 1;\n}", 'int n = 5;\nsumarUno(NULL);'),
    espera: { error: 'PunteroSinDestino' },
  },
  {
    nombre: "NULL y direcciones: pasar NULL a una funcion con un puntero a estructura",
    codigo: conFunciones('void poner(TFecha *x) {\n  if (x != NULL) {\n    x->dia = 1;\n  }\n}', 'TFecha f;\nf.dia = 7;\nponer(NULL);'),
    espera: { variables: { 'f.dia': 7 } },
  },
  {
    nombre: "NULL y direcciones: pasar NULL a una funcion con un puntero a estructura, sin comprobar",
    codigo: conFunciones('void poner(TFecha *x) {\n  x->dia = 1;\n}', 'TFecha f;\nponer(NULL);'),
    espera: { error: 'PunteroSinDestino' },
  },
  {
    nombre: "recursion: factorial",
    codigo: conFunciones("int factorial(int n) {\n  if (n == 0) {\n    return 1;\n  }\n  return n * factorial(n - 1);\n}", "int r = factorial(5);"),
    espera: { variables: { r: 120 } },
  },
  {
    nombre: "recursion: el caso base solo",
    codigo: conFunciones("int factorial(int n) {\n  if (n == 0) {\n    return 1;\n  }\n  return n * factorial(n - 1);\n}", "int r = factorial(0);"),
    espera: { variables: { r: 1 } },
  },
  {
    nombre: "recursion: sin caso base",
    codigo: conFunciones("int suma(int n) {\n  return n + suma(n - 1);\n}", "int r = suma(3);"),
    espera: { error: 'RecursionSinFin' },
  },
  {
    nombre: "recursion: un caso base que no se alcanza",
    codigo: conFunciones("int suma(int n) {\n  if (n == 0) {\n    return 0;\n  }\n  return n + suma(n + 1);\n}", "int r = suma(3);"),
    espera: { error: 'RecursionSinFin' },
  },
  {
    nombre: "recursion: muestra antes y despues de llamarse",
    codigo: conFunciones("void cuenta(int n) {\n  if (n == 0) {\n    return;\n  }\n  printf(\"%d \", n);\n  cuenta(n - 1);\n  printf(\"%d \", n);\n}", "cuenta(3);"),
    espera: { salida: '3 2 1 1 2 3 ' },
  },
  {
    nombre: "recursion: sobre un arreglo con un indice",
    codigo: conFunciones("int sumar(int v[], int n) {\n  if (n == 0) {\n    return 0;\n  }\n  return v[n - 1] + sumar(v, n - 1);\n}", "int v[4] = {1, 2, 3, 4};\nint r = sumar(v, 4);"),
    espera: { variables: { r: 10 } },
  },
  {
    nombre: 'punteros a estructuras: un campo que no existe no se sigue',
    codigo: conFunciones('', 'TFecha f;\nTFecha *p = &f;\np->hora = 1;'),
    espera: { error: 'SinVerificar' },
  },
  {
    nombre: "arreglo en una estructura: se escribe y se lee por el campo",
    codigo: con("TPila p;\nint i;\np.tope = 0;\nfor (i = 0; i < MAX; i++) {\n  p.datos[i] = i * 3;\n  p.tope++;\n}\nprintf(\"%d %d\", p.datos[2], p.tope);"),
    espera: { variables: { 'p.datos': [0, 3, 6], 'p.tope': 3 }, salida: '6 3' },
  },
  {
    nombre: "arreglo en una estructura: con datos de prueba",
    codigo: con("TPila p;\nint total = 0;\nint i;\nfor (i = 0; i < p.tope; i++) {\n  total += p.datos[i];\n}"),
    prueba: { 'p.datos': [4, 5, 6], 'p.tope': 2 },
    espera: { variables: { total: 9 } },
  },
  {
    nombre: "arreglo en una estructura: una pila con funciones y puntero",
    codigo: conFunciones("void inicializar(TPila *p) {\n  p->tope = 0;\n}\nvoid apilar(TPila *p, int x) {\n  p->datos[p->tope] = x;\n  p->tope++;\n}\nint desapilar(TPila *p) {\n  p->tope--;\n  return p->datos[p->tope];\n}\nint cima(TPila p) {\n  return p.datos[p.tope - 1];\n}", "TPila p;\ninicializar(&p);\napilar(&p, 4);\napilar(&p, 7);\nint a = desapilar(&p);\nint b = cima(p);\nprintf(\"%d %d\", a, b);"),
    espera: { variables: { a: 7, b: 4, 'p.tope': 1 }, salida: '7 4' },
  },
  {
    nombre: "arreglo en una estructura: la copia por valor no cambia la original",
    codigo: conFunciones("void inicializar(TPila *p) {\n  p->tope = 0;\n}\nvoid apilar(TPila *p, int x) {\n  p->datos[p->tope] = x;\n  p->tope++;\n}\nint desapilar(TPila *p) {\n  p->tope--;\n  return p->datos[p->tope];\n}\nint cima(TPila p) {\n  return p.datos[p.tope - 1];\n}", "TPila p;\nTPila q;\ninicializar(&p);\napilar(&p, 4);\nq = p;\napilar(&q, 9);\nprintf(\"%d %d\", p.tope, q.tope);"),
    espera: { variables: { 'p.datos': [4, null, null], 'q.datos': [4, 9, null] }, salida: '1 2' },
  },
  {
    nombre: "arreglo en una estructura: una funcion que recibe la pila por valor trabaja con una copia",
    codigo: conFunciones("int sacar(TPila p) {\n  p.tope--;\n  return p.datos[p.tope];\n}", "TPila p;\np.tope = 1;\np.datos[0] = 8;\nint x = sacar(p);"),
    espera: { variables: { x: 8, 'p.tope': 1 } },
  },
  {
    nombre: "arreglo en una estructura: dentro de un arreglo de estructuras",
    codigo: con("TPila pilas[2];\npilas[0].datos[0] = 1;\npilas[1].datos[0] = 5;\npilas[1].datos[2] = 6;"),
    espera: { variables: { 'pilas.datos': [[1, null, null], [5, null, 6]] } },
  },
  {
    nombre: "arreglo en una estructura: apilar de mas sale del arreglo",
    codigo: conFunciones("void inicializar(TPila *p) {\n  p->tope = 0;\n}\nvoid apilar(TPila *p, int x) {\n  p->datos[p->tope] = x;\n  p->tope++;\n}\nint desapilar(TPila *p) {\n  p->tope--;\n  return p->datos[p->tope];\n}\nint cima(TPila p) {\n  return p.datos[p.tope - 1];\n}", "TPila p;\ninicializar(&p);\napilar(&p, 1);\napilar(&p, 2);\napilar(&p, 3);\napilar(&p, 4);"),
    espera: { error: 'FueraDeRango' },
  },
  {
    nombre: "arreglo en una estructura: la posicion no existe",
    codigo: con("TPila p;\np.datos[3] = 1;"),
    espera: { error: 'FueraDeRango' },
  },
  {
    nombre: "arreglo en una estructura: sin inicializar el tope",
    codigo: conFunciones("void inicializar(TPila *p) {\n  p->tope = 0;\n}\nvoid apilar(TPila *p, int x) {\n  p->datos[p->tope] = x;\n  p->tope++;\n}\nint desapilar(TPila *p) {\n  p->tope--;\n  return p->datos[p->tope];\n}\nint cima(TPila p) {\n  return p.datos[p.tope - 1];\n}", "TPila p;\napilar(&p, 1);"),
    espera: { error: 'SinValor' },
  },
  {
    nombre: "arreglo en una estructura: una posicion que nunca se escribio",
    codigo: con("TPila p;\nint x;\np.datos[0] = 1;\nx = p.datos[1];"),
    espera: { error: 'SinValor' },
  },
  {
    nombre: 'sqrt: una raiz exacta',
    codigo: con('double d = sqrt(25.0);'),
    espera: { variables: { d: 5 } },
  },
  {
    nombre: 'sqrt: de un entero',
    codigo: con('int n = 9;\ndouble d = sqrt(n);'),
    espera: { variables: { d: 3 } },
  },
  {
    nombre: 'sqrt: de un numero negativo no se sigue',
    codigo: con('double d = sqrt(-4.0);'),
    espera: { error: 'SinVerificar' },
  },
  {
    nombre: 'estructura como argumento: un elemento de un arreglo de estructuras',
    codigo: conFunciones("TPunto crear(double x, double y) {\n  TPunto p;\n  p.x = x;\n  p.y = y;\n  return p;\n}\nTPunto origen() {\n  return crear(0, 0);\n}\ndouble distancia(TPunto a, TPunto b) {\n  double dx = a.x - b.x;\n  double dy = a.y - b.y;\n  return sqrt(dx * dx + dy * dy);\n}\nvoid correr(TPunto a) {\n  a.x = 99;\n}", "TPunto pts[2];\npts[0] = crear(0, 0);\npts[1] = crear(6, 8);\ndouble d = distancia(pts[0], pts[1]);"),
    espera: { variables: { d: 10 } },
  },
  {
    nombre: 'estructura como argumento: el elemento se copia, el original no cambia',
    codigo: conFunciones("TPunto crear(double x, double y) {\n  TPunto p;\n  p.x = x;\n  p.y = y;\n  return p;\n}\nTPunto origen() {\n  return crear(0, 0);\n}\ndouble distancia(TPunto a, TPunto b) {\n  double dx = a.x - b.x;\n  double dy = a.y - b.y;\n  return sqrt(dx * dx + dy * dy);\n}\nvoid correr(TPunto a) {\n  a.x = 99;\n}", "TPunto pts[2];\npts[0] = crear(0, 0);\npts[1] = crear(6, 8);\ncorrer(pts[1]);"),
    espera: { variables: { 'pts.x': [0, 6] } },
  },
  {
    nombre: 'estructura como argumento: con el indice de un ciclo',
    codigo: conFunciones("TPunto crear(double x, double y) {\n  TPunto p;\n  p.x = x;\n  p.y = y;\n  return p;\n}\nTPunto origen() {\n  return crear(0, 0);\n}\ndouble distancia(TPunto a, TPunto b) {\n  double dx = a.x - b.x;\n  double dy = a.y - b.y;\n  return sqrt(dx * dx + dy * dy);\n}\nvoid correr(TPunto a) {\n  a.x = 99;\n}", "TPunto pts[2];\npts[0] = crear(0, 0);\npts[1] = crear(6, 8);\ndouble t = 0;\nfor (int i = 0; i < 2; i++) {\n  t = t + distancia(pts[i], origen());\n}"),
    espera: { variables: { t: 10 } },
  },
  {
    nombre: 'estructura como argumento: un elemento que no existe',
    codigo: conFunciones("TPunto crear(double x, double y) {\n  TPunto p;\n  p.x = x;\n  p.y = y;\n  return p;\n}\nTPunto origen() {\n  return crear(0, 0);\n}\ndouble distancia(TPunto a, TPunto b) {\n  double dx = a.x - b.x;\n  double dy = a.y - b.y;\n  return sqrt(dx * dx + dy * dy);\n}\nvoid correr(TPunto a) {\n  a.x = 99;\n}", "TPunto pts[2];\npts[0] = crear(0, 0);\npts[1] = crear(6, 8);\ndouble d = distancia(pts[0], pts[2]);"),
    espera: { error: 'FueraDeRango' },
  },
  {
    nombre: 'estructura como argumento: un elemento sin valores',
    codigo: conFunciones("TPunto crear(double x, double y) {\n  TPunto p;\n  p.x = x;\n  p.y = y;\n  return p;\n}\nTPunto origen() {\n  return crear(0, 0);\n}\ndouble distancia(TPunto a, TPunto b) {\n  double dx = a.x - b.x;\n  double dy = a.y - b.y;\n  return sqrt(dx * dx + dy * dy);\n}\nvoid correr(TPunto a) {\n  a.x = 99;\n}", "TPunto pts[2];\npts[0] = crear(0, 0);\ndouble d = distancia(pts[0], pts[1]);"),
    espera: { error: 'SinValor' },
  },
  {
    nombre: 'estructura como argumento: lo que devuelve otra funcion',
    codigo: conFunciones("TPunto crear(double x, double y) {\n  TPunto p;\n  p.x = x;\n  p.y = y;\n  return p;\n}\nTPunto origen() {\n  return crear(0, 0);\n}\ndouble distancia(TPunto a, TPunto b) {\n  double dx = a.x - b.x;\n  double dy = a.y - b.y;\n  return sqrt(dx * dx + dy * dy);\n}\nvoid correr(TPunto a) {\n  a.x = 99;\n}", "double d = distancia(crear(3, 4), origen());"),
    espera: { variables: { d: 5 } },
  },
  {
    nombre: "arreglo de estructuras: guardar lo que devuelve una funcion en cada elemento",
    codigo: conFunciones("TPunto crear(double x, double y) {\n  TPunto p;\n  p.x = x;\n  p.y = y;\n  return p;\n}", "TPunto pts[3];\nfor (int i = 0; i < 3; i++) {\n  pts[i] = crear(i, i * 2);\n}"),
    espera: { variables: { 'pts.x': [0, 1, 2], 'pts.y': [0, 2, 4] } },
  },
  {
    nombre: "arreglo de estructuras: copiar un elemento en otro",
    codigo: conFunciones("TPunto crear(double x, double y) {\n  TPunto p;\n  p.x = x;\n  p.y = y;\n  return p;\n}", "TPunto pts[2];\npts[0] = crear(1, 2);\npts[1] = pts[0];\npts[0].x = 7;"),
    espera: { variables: { 'pts.x': [7, 1], 'pts.y': [2, 2] } },
  },
  {
    nombre: "arreglo de estructuras: copiar un elemento en una variable",
    codigo: conFunciones("TPunto crear(double x, double y) {\n  TPunto p;\n  p.x = x;\n  p.y = y;\n  return p;\n}", "TPunto pts[2];\nTPunto p;\npts[0] = crear(1, 2);\npts[1] = crear(3, 4);\np = pts[1];\np.x = 9;"),
    espera: { variables: { 'pts.x': [1, 3], 'p.x': 9, 'p.y': 4 } },
  },
  {
    nombre: "arreglo de estructuras: guardar en un elemento que no existe",
    codigo: conFunciones("TPunto crear(double x, double y) {\n  TPunto p;\n  p.x = x;\n  p.y = y;\n  return p;\n}", "TPunto pts[2];\npts[2] = crear(1, 2);"),
    espera: { error: 'FueraDeRango' },
  },
  {
    nombre: 'arreglo de estructuras: declarar una variable con un elemento',
    codigo: conFunciones("TPunto crear(double x, double y) {\n  TPunto p;\n  p.x = x;\n  p.y = y;\n  return p;\n}", "TPunto pts[2];\npts[0] = crear(1, 2);\npts[1] = crear(3, 4);\nTPunto m = pts[1];\nm.x = 9;"),
    espera: { variables: { 'pts.x': [1, 3], 'm.x': 9, 'm.y': 4 } },
  },
  {
    nombre: "puntero a un elemento de un arreglo de estructuras: cambia solo ese elemento",
    codigo: conFunciones("void mover(TPunto *p, double dx) {\n  p->x = p->x + dx;\n}", "TPunto pts[MAX];\nint i;\nfor (i = 0; i < MAX; i++) {\n  pts[i].x = i;\n  pts[i].y = 0;\n}\nmover(&pts[1], 10);\nprintf(\"%.0f %.0f %.0f\", pts[0].x, pts[1].x, pts[2].x);"),
    espera: {"salida":"0 11 2"},
  },
  {
    nombre: "puntero a un elemento de un arreglo de estructuras: el indice es una variable de un ciclo",
    codigo: conFunciones("void mover(TPunto *p, double dx) {\n  p->x = p->x + dx;\n}", "TPunto pts[MAX];\nint i;\nfor (i = 0; i < MAX; i++) {\n  pts[i].x = 1;\n  pts[i].y = 0;\n}\nfor (i = 0; i < MAX; i++) {\n  mover(&pts[i], i);\n}\nprintf(\"%.0f %.0f %.0f\", pts[0].x, pts[1].x, pts[2].x);"),
    espera: {"salida":"1 2 3"},
  },
  {
    nombre: "puntero a un elemento de un arreglo de estructuras: se lee a traves del puntero",
    codigo: conFunciones("double leerY(TPunto *p) {\n  return p->y;\n}", "TPunto pts[MAX];\nint i;\nfor (i = 0; i < MAX; i++) {\n  pts[i].x = 0;\n  pts[i].y = i * 2;\n}\nprintf(\"%.0f\", leerY(&pts[2]));"),
    espera: {"salida":"4"},
  },
  {
    nombre: "puntero a un elemento de un arreglo de estructuras: con un arreglo adentro (una pila por elemento)",
    codigo: conFunciones("void apilar(TPila *p, int x) {\n  p->datos[p->tope] = x;\n  p->tope++;\n}", "TPila ps[MAX];\nint i;\nfor (i = 0; i < MAX; i++) {\n  ps[i].tope = 0;\n}\napilar(&ps[1], 4);\napilar(&ps[1], 7);\napilar(&ps[2], 9);\nprintf(\"%d %d %d\", ps[0].tope, ps[1].tope, ps[1].datos[1]);"),
    espera: {"salida":"0 2 7"},
  },
  {
    nombre: "puntero a un elemento de un arreglo de estructuras: una posicion fuera del arreglo",
    codigo: conFunciones("void mover(TPunto *p, double dx) {\n  p->x = p->x + dx;\n}", "TPunto pts[MAX];\nmover(&pts[5], 1);"),
    espera: {"error":"FueraDeRango"},
  },
  {
    nombre: "*p como argumento por valor: una estructura a la que apunta un puntero",
    codigo: conFunciones("int cuantos(TPila p) {\n  return p.tope;\n}\nint doble(TPila *p) {\n  return cuantos(*p) * 2;\n}", "TPila p;\np.tope = 3;\nprintf(\"%d\", doble(&p));"),
    espera: {"salida":"6"},
  },
  {
    nombre: "*p como argumento por valor: un elemento de un arreglo de estructuras",
    codigo: conFunciones("int cuantos(TPila p) {\n  return p.tope;\n}\nint doble(TPila *p) {\n  return cuantos(*p) * 2;\n}", "TPila ps[MAX];\nint i;\nfor (i = 0; i < MAX; i++) {\n  ps[i].tope = i;\n}\nprintf(\"%d %d\", doble(&ps[1]), doble(&ps[2]));"),
    espera: {"salida":"2 4"},
  },
  {
    nombre: "*p como argumento por valor: la funcion recibe una copia",
    codigo: conFunciones("void ponerEnCero(TPila p) {\n  p.tope = 0;\n}\nvoid llamar(TPila *p) {\n  ponerEnCero(*p);\n}", "TPila p;\np.tope = 3;\nllamar(&p);\nprintf(\"%d\", p.tope);"),
    espera: {"salida":"3"},
  },
  {
    nombre: "*p como argumento por valor: con un arreglo adentro",
    codigo: conFunciones("int primero(TPila p) {\n  return p.datos[0];\n}\nint desdePuntero(TPila *p) {\n  return primero(*p);\n}", "TPila p;\np.datos[0] = 7;\nprintf(\"%d\", desdePuntero(&p));"),
    espera: {"salida":"7"},
  },
  {
    nombre: "*p como argumento por valor: un puntero sin direccion",
    codigo: conFunciones("int cuantos(TPila p) {\n  return p.tope;\n}\nint doble(TPila *p) {\n  return cuantos(*p) * 2;\n}", "TPila *p;\nprintf(\"%d\", cuantos(*p));"),
    espera: {"error":"PunteroSinDestino"},
  },
  {
    nombre: "un campo que es un arreglo de enumerados: se escribe y se lee",
    codigo: conFunciones("typedef struct {\n  TTurno dia[MAX];\n  int cantidad;\n} TSemana;", "TSemana s;\ns.dia[0] = NOCHE;\ns.dia[2] = TARDE;\nprintf(\"%d %d\", s.dia[0], s.dia[2]);"),
    espera: {"salida":"2 1"},
  },
  {
    nombre: "un campo que es un arreglo de enumerados: se cambia por puntero",
    codigo: conFunciones("typedef struct {\n  TTurno dia[MAX];\n  int cantidad;\n} TSemana;\nvoid poner(TSemana *s, int i, TTurno t) {\n  s->dia[i] = t;\n}", "TSemana s;\nponer(&s, 1, TARDE);\nprintf(\"%d\", s.dia[1]);"),
    espera: {"salida":"1"},
  },
  {
    nombre: "un campo que es un arreglo de enumerados: por valor la funcion recibe una copia",
    codigo: conFunciones("typedef struct {\n  TTurno dia[MAX];\n  int cantidad;\n} TSemana;\nint cambiar(TSemana s, int i) {\n  s.dia[i] = NOCHE;\n  return s.dia[i];\n}", "TSemana s;\ns.dia[0] = MANANA;\nprintf(\"%d %d\", cambiar(s, 0), s.dia[0]);"),
    espera: {"salida":"2 0"},
  },
  {
    nombre: "un campo que es un arreglo de enumerados: se compara con un enumerador",
    codigo: conFunciones("typedef struct {\n  TTurno dia[MAX];\n  int cantidad;\n} TSemana;", "TSemana s;\ns.dia[1] = TARDE;\nif (s.dia[1] == TARDE) {\n  printf(\"si\");\n}"),
    espera: {"salida":"si"},
  },
  {
    nombre: "un campo que es un arreglo de enumerados: una posicion fuera del arreglo",
    codigo: conFunciones("typedef struct {\n  TTurno dia[MAX];\n  int cantidad;\n} TSemana;", "TSemana s;\ns.dia[5] = NOCHE;"),
    espera: {"error":"FueraDeRango"},
  },
  {
    nombre: "un campo que es un arreglo de enumerados: una casilla sin valor",
    codigo: conFunciones("typedef struct {\n  TTurno dia[MAX];\n  int cantidad;\n} TSemana;", "TSemana s;\nprintf(\"%d\", s.dia[0]);"),
    espera: {"error":"SinValor"},
  },
  {
    nombre: "cadenas: == entre dos cadenas compara direcciones, no letras",
    codigo: con("char a[5] = \"ab\";\nchar b[5] = \"ab\";\nprintf(\"%d %d\", a == b, a == a);"),
    espera: {"salida":"0 1"},
  },
  {
    nombre: "cadenas: != entre dos cadenas iguales da verdadero",
    codigo: con("char a[5] = \"ab\";\nchar b[5] = \"ab\";\nif (a != b) {\n  printf(\"distintas\");\n}"),
    espera: {"salida":"distintas"},
  },
  {
    nombre: "cadenas: un arreglo no se copia con =",
    codigo: con("char a[5];\nchar b[5] = \"ab\";\na = b;"),
    espera: {"error":"CadenaConIgual"},
  },
  {
    nombre: "cadenas: un campo cadena no se copia con =",
    codigo: con("TAlumno alumno;\nchar t[10] = \"x\";\nalumno.apellidoNombre = t;"),
    espera: {"error":"CadenaConIgual"},
  },
  {
    nombre: "cadenas: strncmp compara solo el principio",
    codigo: con("printf(\"%d %d\", strncmp(\"abcd\", \"abxx\", 2) == 0, strncmp(\"abcd\", \"abxx\", 3) == 0);"),
    espera: {"salida":"1 0"},
  },
  {
    nombre: "cadenas: strlen de una cadena que nadie escribio",
    codigo: con("char s[5];\nprintf(\"%d\", strlen(s));"),
    espera: {"error":"SinValor"},
  },
  {
    nombre: "cadenas: un long con %d no corresponde",
    codigo: con("long t = 5;\nprintf(\"%d\", t);"),
    espera: {"error":"FormatoDistinto"},
  },
  {
    nombre: "cadenas: leer un long con %d no corresponde",
    codigo: con("long t;\nscanf(\"%d\", &t);"),
    entrada: [7],
    espera: {"error":"FormatoDistinto"},
  },
  {
    nombre: "cadenas: un indice con ++ no se evalua dos veces",
    codigo: con("int v[3];\nint n = 0;\nv[n++] = 5;\nprintf(\"%d\", n);"),
    espera: {"salida":"1"},
  },
  {
    nombre: "sin signo: un unsigned long se muestra con %lu",
    codigo: con("unsigned long t = 3878551234;\nprintf(\"%lu\", t);"),
    espera: {"salida":"3878551234"},
  },
  {
    nombre: "sin signo: un unsigned long con %ld no corresponde",
    codigo: con("unsigned long t = 5;\nprintf(\"%ld\", t);"),
    espera: {"error":"FormatoDistinto"},
  },
  {
    nombre: "sin signo: un unsigned long con %d no corresponde",
    codigo: con("unsigned long t = 5;\nprintf(\"%d\", t);"),
    espera: {"error":"FormatoDistinto"},
  },
  {
    nombre: "sin signo: un long con %lu no corresponde",
    codigo: con("long t = 5;\nprintf(\"%lu\", t);"),
    espera: {"error":"FormatoDistinto"},
  },
  {
    nombre: "sin signo: un int con %lu no corresponde",
    codigo: con("int t = 5;\nprintf(\"%lu\", t);"),
    espera: {"error":"FormatoDistinto"},
  },
  {
    nombre: "sin signo: se lee un unsigned long con %lu",
    codigo: con("unsigned long t;\nscanf(\"%lu\", &t);\nprintf(\"%lu\", t);"),
    entrada: [3878551234],
    espera: {"salida":"3878551234"},
  },
  {
    nombre: "sin signo: leer un unsigned long con %ld no corresponde",
    codigo: con("unsigned long t;\nscanf(\"%ld\", &t);"),
    entrada: [7],
    espera: {"error":"FormatoDistinto"},
  },
  {
    nombre: "sin signo: leer un long con %lu no corresponde",
    codigo: con("long t;\nscanf(\"%lu\", &t);"),
    entrada: [7],
    espera: {"error":"FormatoDistinto"},
  },
  {
    nombre: "estructura dentro de otra: guardar, devolver y pasar el campo",
    codigo: conFunciones(
      "typedef struct {\n  int dia;\n  int mes;\n} TF;\ntypedef struct {\n  TF vence;\n  int hecha;\n} TT;\nTT crearT(TF f) {\n  TT t;\n  t.vence = f;\n  t.hecha = 0;\n  return t;\n}\nTF venc(TT t) {\n  return t.vence;\n}\nint mesDe(TF f) {\n  return f.mes;\n}",
      "TF f;\nf.dia = 3;\nf.mes = 7;\nTT t = crearT(f);\nTF g = venc(t);\nint m = mesDe(t.vence);"
    ),
    espera: { variables: { m: 7, 'g.dia': 3, 'g.mes': 7, 't.vence.dia': 3 } },
  },
  {
    nombre: "estructura dentro de otra: guardar una copia, no la misma",
    codigo: conFunciones(
      "typedef struct {\n  int dia;\n  int mes;\n} TF;\ntypedef struct {\n  TF vence;\n  int hecha;\n} TT;",
      "TF f;\nf.dia = 3;\nf.mes = 7;\nTT t;\nt.vence = f;\nf.dia = 99;"
    ),
    espera: { variables: { 't.vence.dia': 3, 'f.dia': 99 } },
  },
];

// Corre un caso y dice si salio lo esperado. "ejecutar" es la funcion del
// simulador y "analizador" el de C; asi sirve igual en la pagina y en Node.
export function resultadoDelSimulador(analizador, ejecutar, caso) {
  const arbol = analizador.parse(caso.codigo);
  try {
    let corrida;
    try {
      const desde = caso.desdeEn ? caso.codigo.indexOf(caso.desdeEn) : null;
      corrida = ejecutar(arbol, (n) => ENUMERADORES[n] ?? null, caso.entrada ?? null, caso.prueba ?? null, desde);
    } catch (e) {
      const bien = caso.espera.error === e.constructor.name;
      return { bien, detalle: bien ? '' : `esperaba ${caso.espera.error ?? 'que corriera'} y salió ${e.constructor.name}: ${e.message}` };
    }
    if (caso.espera.error) return { bien: false, detalle: `esperaba ${caso.espera.error} y corrió sin error` };
    const problemas = [];
    for (const [nombre, esperado] of Object.entries(caso.espera.variables || {})) {
      const v = corrida.variables.get(nombre);
      const tiene = !v ? undefined : v.dims ? v.datos : v.valor;
      if (JSON.stringify(tiene) !== JSON.stringify(esperado)) {
        problemas.push(`${nombre}: esperaba ${JSON.stringify(esperado)} y tiene ${JSON.stringify(tiene)}`);
      }
    }
    if (caso.espera.salida != null && corrida.salida !== caso.espera.salida) {
      problemas.push(`salida: esperaba ${JSON.stringify(caso.espera.salida)} y salió ${JSON.stringify(corrida.salida)}`);
    }
    return { bien: !problemas.length, detalle: problemas.join('\n') };
  } finally {
    arbol.delete();
  }
}
