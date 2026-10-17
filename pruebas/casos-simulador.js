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
    nombre: 'estructuras: un campo cadena no se sigue',
    codigo: con("TAlumno alumno;\nalumno.apellidoNombre[0] = 'P';"),
    espera: { error: 'SinVerificar' },
  },
  {
    nombre: 'estructuras: la estructura entera no se sigue',
    codigo: con('TAlumno alumno;\nTAlumno copia;\ncopia = alumno;'),
    espera: { error: 'SinVerificar' },
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
    espera: { error: 'NoTermina' },
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
