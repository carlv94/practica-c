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
`;

// Los enumeradores, con el valor que les da la cabecera.
const ENUMERADORES = { MAX: 3, MANANA: 0, TARDE: 1, NOCHE: 2, BAJO: 1, MEDIO: 5, ALTO: 6 };

const con = (cuerpo) => `${CABECERA}int main() {\n${cuerpo}\nreturn 0;\n}`;

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
