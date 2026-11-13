// Casos de las series de memoria dinamica (consignas/dinamica-memoria.json).
// Mismo formato que casos.js.

const serie = (id) => (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: id,
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

const memoria = serie('dinamica-memoria');

// Lo que cada consigna de codigo tiene que dar, para armar variantes.
const RESERVAR = 'int main() {\n  int *p = malloc(sizeof(int));\n\n  scanf("%d", p);\n  printf("%d", *p * 2);\n  free(p);\n  return 0;\n}';
// La consigna 6: pregunta es la condicion con que se pregunta por NULL; "sinMemoria" dice si es verdadera cuando no hay.
const COMPROBAR = (pregunta, sinMemoria) =>
  sinMemoria
    ? `int main() {\n  int n;\n\n  scanf("%d", &n);\n  int *p = malloc(n * sizeof(int));\n\n  if (${pregunta}) {\n    printf("Sin memoria");\n  } else {\n    printf("Memoria reservada");\n    free(p);\n  }\n  return 0;\n}`
    : `int main() {\n  int n;\n\n  scanf("%d", &n);\n  int *p = malloc(n * sizeof(int));\n\n  if (${pregunta}) {\n    printf("Memoria reservada");\n    free(p);\n  } else {\n    printf("Sin memoria");\n  }\n  return 0;\n}`;
const CON_NULL = '';
const ARREGLO = (reserva, hasta, promedio) =>
  `int main() {\n  int n;\n\n  scanf("%d", &n);\n  int *notas = ${reserva};\n  int suma = 0;\n\n  for (int i = 0; i ${hasta} n; i++) {\n    scanf("%d", &notas[i]);\n    suma += notas[i];\n  }\n  printf("Promedio: %.1f", ${promedio});\n  free(notas);\n  return 0;\n}`;
const ESTRUCTURA = (reserva, cuerpo) => `TAlumno *crearAlumno(int legajo, float promedio) {\n  TAlumno *a = ${reserva};\n\n${cuerpo}  return a;\n}`;
const DEVOLVER = (cuerpo) => `int *crearArreglo(int n) {\n  int *v = malloc(n * sizeof(int));\n\n${cuerpo}  return v;\n}`;
const CARGA = '  for (int i = 0; i < n; i++) {\n    v[i] = i * 2;\n  }\n';

const errores = serie('dinamica-errores');

// Serie 2: errores tipicos.
const FUGA = (cuerpoFinal) =>
  `int main() {
  int n;

  scanf("%d", &n);
  for (int i = 0; i < n; i++) {
    int *p = malloc(sizeof(int));

    scanf("%d", p);
    printf("%d ", *p * 2);
${cuerpoFinal}  }
  return 0;
}`;
const SUMA = (reserva, hasta) =>
  `int main() {
  int n;

  scanf("%d", &n);
  int *v = ${reserva};
  int suma = 0;

  for (int i = 0; i ${hasta} n; i++) {
    scanf("%d", &v[i]);
    suma += v[i];
  }
  printf("Suma: %d", suma);
  free(v);
  return 0;
}`;
const CREAR = (cuerpo) => `int *crearNumero(int valor) {
${cuerpo}}`;

export const CASOS_DE_DINAMICA = [
  // ===== 1. un arreglo de tamano fijo
  memoria(1, 'ninguno sirve: se pide al ejecutar', '1'),
  memoria(1, 'un numero fijo grande', '0', ['OPCION_UN_NUMERO_FIJO']),
  memoria(1, 'la variable leida', '2', ['OPCION_LA_VARIABLE']),

  // ===== 2. donde vive cada cosa
  memoria(2, 'en el monticulo', '1'),
  memoria(2, 'en p', '0', ['OPCION_EN_P']),
  memoria(2, 'en n', '2', ['OPCION_EN_N']),

  // ===== 3. cuantos bytes pedir
  memoria(3, 'sizeof del tipo', '0'),
  memoria(3, 'el ocho escrito a mano', '1', ['OPCION_UN_NUMERO']),
  memoria(3, 'sizeof de otro tipo', '2', ['OPCION_SIZEOF_OTRO_TIPO']),

  // ===== 4. reservar, usar y liberar un entero
  memoria(4, 'la referencia', RESERVAR),
  memoria(4, 'sin liberar', RESERVAR.replace('  free(p);\n', ''), ['FREE_FALTA']),
  memoria(4, 'sin malloc', 'int main() {\n  int n;\n\n  scanf("%d", &n);\n  printf("%d", n * 2);\n  return 0;\n}', ['MALLOC_FALTA']),
  memoria(4, 'scanf con la direccion del puntero', RESERVAR.replace('scanf("%d", p);', 'scanf("%d", &p);'), ['FORMATO_DISTINTO']),
  memoria(4, 'usa el bloque despues de liberarlo', RESERVAR.replace('  free(p);\n', '').replace('  return 0;', '  free(p);\n  printf("%d", *p);\n  return 0;'), ['USO_DE_MEMORIA_LIBERADA']),
  memoria(4, 'muestra el numero y no el doble', RESERVAR.replace('*p * 2', '*p'), ['MUESTRA_DISTINTA']),

  // ===== 5. cuando no hay memoria
  memoria(5, 'NULL', '2'),
  memoria(5, 'un bloque mas chico', '0', ['OPCION_BLOQUE_MAS_CHICO']),
  memoria(5, 'termina el programa', '1', ['OPCION_TERMINA']),

  // ===== 6. comprobar el resultado de malloc
  memoria(6, 'la referencia', COMPROBAR('p == NULL', true)),
  memoria(6, 'con una pregunta por NULL de otra forma', COMPROBAR('!p', true)),
  memoria(6, 'con != NULL', COMPROBAR('p != NULL', false)),
  memoria(6, 'con n por cuatro bytes tambien', COMPROBAR('p == NULL', true).replace('malloc(n * sizeof(int))', 'malloc(n * 4)')),
  memoria(6, 'comprueba con un numero escrito a mano', COMPROBAR('p == NULL', true).replace('p == NULL', 'n > 1000000000'), ['NULL_SIN_COMPROBAR']),
  memoria(6, 'no comprueba nada', 'int main() {\n  int n;\n\n  scanf("%d", &n);\n  int *p = malloc(n * sizeof(int));\n\n  printf("Memoria reservada");\n  free(p);\n  return 0;\n}', ['NULL_SIN_COMPROBAR']),
  memoria(6, 'otro mensaje', COMPROBAR('p == NULL', true).replace('Sin memoria', 'Sin Memoria'), ['MUESTRA_CASI_IGUAL']),
  memoria(6, 'sin liberar', COMPROBAR('p == NULL', true).replace('    free(p);\n', ''), ['FREE_FALTA']),
  memoria(6, 'sin malloc', 'int main() {\n  int n;\n\n  scanf("%d", &n);\n  if (n > 0) {\n    printf("Memoria reservada");\n  }\n  return 0;\n}', ['MALLOC_FALTA']),

  // ===== 7. un bloque se usa como un arreglo
  memoria(7, 'la incorrecta es la suma sin parentesis', '1'),
  memoria(7, 'con corchetes es valida', '0', ['OPCION_VALIDA_CON_CORCHETES']),
  memoria(7, 'con asterisco y parentesis es valida', '2', ['OPCION_VALIDA_CON_ASTERISCO']),

  // ===== 8. un arreglo dinamico
  memoria(8, 'la referencia', ARREGLO('malloc(n * sizeof(int))', '<', '(float) suma / n')),
  memoria(8, 'con la division de decimales de otra forma', ARREGLO('malloc(n * sizeof(int))', '<', 'suma / (float) n')),
  memoria(8, 'division entera', ARREGLO('malloc(n * sizeof(int))', '<', 'suma / n'), ['FORMATO_DISTINTO']),
  memoria(8, 'una posicion de mas', ARREGLO('malloc(n * sizeof(int))', '<=', '(float) suma / n'), ['FUERA_DE_BLOQUE']),
  memoria(8, 'pide los bytes sin sizeof', ARREGLO('malloc(n)', '<', '(float) suma / n'), ['FUERA_DE_BLOQUE']),
  memoria(8, 'sin liberar', ARREGLO('malloc(n * sizeof(int))', '<', '(float) suma / n').replace('  free(notas);\n', ''), ['FREE_FALTA']),

  // ===== 9. una estructura en el monticulo
  memoria(9, 'la referencia', ESTRUCTURA('malloc(sizeof(TAlumno))', '  a->legajo = legajo;\n  a->promedio = promedio;\n')),
  memoria(9, 'con la forma del puntero sin flecha', ESTRUCTURA('malloc(sizeof(TAlumno))', '  (*a).legajo = legajo;\n  (*a).promedio = promedio;\n')),
  memoria(9, 'sin cargar el promedio', ESTRUCTURA('malloc(sizeof(TAlumno))', '  a->legajo = legajo;\n'), ['VARIABLE_SIN_VALOR']),
  memoria(9, 'pide el tamano de un entero', ESTRUCTURA('malloc(sizeof(int))', '  a->legajo = legajo;\n  a->promedio = promedio;\n'), ['FUERA_DE_BLOQUE']),
  memoria(9, 'otro nombre de funcion', ESTRUCTURA('malloc(sizeof(TAlumno))', '  a->legajo = legajo;\n  a->promedio = promedio;\n').replace('crearAlumno', 'nuevoAlumno'), ['FUNCION_DESCONOCIDA']),
  memoria(9, 'sin malloc', 'TAlumno *crearAlumno(int legajo, float promedio) {\n  TAlumno a;\n\n  a.legajo = legajo;\n  a.promedio = promedio;\n  return &a;\n}', ['MALLOC_FALTA']),

  // ===== 10. devolver un bloque reservado
  memoria(10, 'la referencia', DEVOLVER(CARGA)),
  memoria(10, 'libera antes de devolver', DEVOLVER(CARGA).replace('  return v;', '  free(v);\n  return v;'), ['USO_DE_MEMORIA_LIBERADA']),
  memoria(10, 'guarda el numero de posicion y no el doble', DEVOLVER(CARGA.replace('i * 2', 'i')), ['MUESTRA_DISTINTA']),
  memoria(10, 'sin malloc', 'int *crearArreglo(int n) {\n  int v[3];\n\n  return v;\n}', ['MALLOC_FALTA']),

  // ===== serie 2. 1. una fuga de memoria
  errores(1, 'sigue reservado pero nadie lo apunta', '1'),
  errores(1, 'se libera solo', '0', ['OPCION_SE_LIBERA_SOLO']),
  errores(1, 'apunta a los dos', '2', ['OPCION_APUNTA_A_LOS_DOS']),

  // ===== 2. arreglar una fuga
  errores(2, 'la referencia', FUGA('    free(p);\n')),
  errores(2, 'el programa con la fuga', FUGA(''), ['FUGA_DE_MEMORIA']),
  errores(2, 'libera antes de usar', FUGA('').replace('    scanf("%d", p);', '    free(p);\n    scanf("%d", p);'), ['USO_DE_MEMORIA_LIBERADA']),
  errores(2, 'sin malloc', 'int main() {\n  int n;\n\n  scanf("%d", &n);\n  for (int i = 0; i < n; i++) {\n    int x;\n\n    scanf("%d", &x);\n    printf("%d ", x * 2);\n  }\n  return 0;\n}', ['MALLOC_FALTA']),

  // ===== 3. un puntero a un bloque liberado
  errores(3, 'la misma direccion de antes', '0'),
  errores(3, 'queda en NULL', '1', ['OPCION_QUEDA_EN_NULL']),
  errores(3, 'un bloque nuevo', '2', ['OPCION_BLOQUE_NUEVO']),

  // ===== 4. liberar dos veces
  errores(4, 'es un error', '2'),
  errores(4, 'se ignora', '0', ['OPCION_SE_IGNORA']),
  errores(4, 'libera otro', '1', ['OPCION_LIBERA_OTRO']),

  // ===== 5. escribir fuera del bloque
  errores(5, 'escribe fuera del bloque', '1'),
  errores(5, 'agranda el bloque', '0', ['OPCION_AGRANDA']),
  errores(5, 'es el ultimo', '2', ['OPCION_ES_EL_ULTIMO']),

  // ===== 6. una posicion de mas
  errores(6, 'la referencia', SUMA('malloc(n * sizeof(int))', '<')),
  errores(6, 'el programa con una posicion de mas', SUMA('malloc(n * sizeof(int))', '<='), ['FUERA_DE_BLOQUE']),
  errores(6, 'un lugar de mas en el bloque y el mismo limite', SUMA('malloc((n + 1) * sizeof(int))', '<='), ['VARIABLE_SIN_VALOR']),
  errores(6, 'sin liberar', SUMA('malloc(n * sizeof(int))', '<').replace('  free(v);\n', ''), ['FREE_FALTA']),

  // ===== 7. la direccion de una variable local
  errores(7, 'x desaparece', '2'),
  errores(7, 'return no devuelve punteros', '0', ['OPCION_RETURN_NO_DEVUELVE_PUNTEROS']),
  errores(7, 'no se apunta a un int', '1', ['OPCION_NO_SE_APUNTA_A_UN_INT']),

  // ===== 8. corregir la funcion
  errores(8, 'la referencia', CREAR('  int *p = malloc(sizeof(int));\n\n  *p = valor;\n  return p;\n')),
  errores(8, 'el programa con la direccion de una local', CREAR('  int x = valor;\n\n  return &x;\n'), ['MALLOC_FALTA']),
  errores(8, 'con malloc pero devuelve la direccion de una local', CREAR('  int *p = malloc(sizeof(int));\n  int x = valor;\n\n  free(p);\n  return &x;\n'), ['VARIABLE_FUERA_DE_ALCANCE']),
  errores(8, 'sin cargar el valor', CREAR('  int *p = malloc(sizeof(int));\n\n  return p;\n'), ['VARIABLE_SIN_VALOR']),
  errores(8, 'libera dentro de la funcion', CREAR('  int *p = malloc(sizeof(int));\n\n  *p = valor;\n  free(p);\n  return p;\n'), ['USO_DE_MEMORIA_LIBERADA']),
];
