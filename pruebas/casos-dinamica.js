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

const puntero = serie('dinamica-puntero');

const nodo = serie('dinamica-nodo');

// Serie 4: el nodo de una lista.
const NODO = (campo = 'struct nodo *sig;', alias = 'TNodo', etiqueta = ' nodo') => `typedef struct${etiqueta} {\n  int dato;\n  ${campo}\n} ${alias};`;
const TRES_NODOS = (cuerpo) => `int main() {\n  TNodo a;\n  TNodo b;\n  TNodo c;\n  TNodo *p;\n\n${cuerpo}  return 0;\n}`;
const ENLACES = '  a.dato = 5;\n  b.dato = 8;\n  c.dato = 2;\n  a.sig = &b;\n  b.sig = &c;\n  c.sig = NULL;\n  p = &a;\n';
const RECORRER = '  while (p != NULL) {\n    printf("%d ", p->dato);\n    p = p->sig;\n  }\n';

// Serie 3: cambiar un puntero desde una funcion.
const RESERVAR_PP = (cuerpo, tipo = 'int **p') => 'void reservar(' + tipo + ', int valor) {\n' + cuerpo + '}';
const TBOOL = 'typedef enum {\n  FALSO,\n  VERDADERO\n} TBool;\n\n';
const ENTEROS = (cuerpo) => TBOOL + 'TBool reservarEnteros(int **v, int n) {\n' + cuerpo + '}';
const LIBERAR = (cuerpo, tipo = 'int **p') => 'void liberar(' + tipo + ') {\n' + cuerpo + '}';

const lista = serie('dinamica-lista');
const quitar = serie('dinamica-lista-quitar');

// Series 5 y 6: la lista enlazada. Las funciones que cada consigna da hechas y las que escribe el alumno.
const L_CREAR = (cuerpo) => `TNodo *crearNodo(int dato) {\n${cuerpo}}`;
const CREAR_REF = '  TNodo *nuevo = malloc(sizeof(TNodo));\n\n  if (nuevo == NULL) {\n    return NULL;\n  }\n  nuevo->dato = dato;\n  nuevo->sig = NULL;\n  return nuevo;\n';
const L_MOSTRAR = (cuerpo) => `void mostrar(TNodo *lista) {\n${cuerpo}}`;
const MOSTRAR_REF = '  TNodo *aux = lista;\n\n  while (aux != NULL) {\n    printf("%d ", aux->dato);\n    aux = aux->sig;\n  }\n';
const L_INICIO = (cuerpo, parametro = 'TNodo **lista') => `void insertarInicio(${parametro}, int dato) {\n  TNodo *nuevo = crearNodo(dato);\n\n  if (nuevo == NULL) {\n    return;\n  }\n${cuerpo}}`;
const L_FINAL = (cuerpo) => `void insertarFinal(TNodo **lista, int dato) {\n  TNodo *nuevo = crearNodo(dato);\n  TNodo *aux;\n\n  if (nuevo == NULL) {\n    return;\n  }\n${cuerpo}}`;
const FINAL_REF = '  if (*lista == NULL) {\n    *lista = nuevo;\n    return;\n  }\n  aux = *lista;\n  while (aux->sig != NULL) {\n    aux = aux->sig;\n  }\n  aux->sig = nuevo;\n';
const L_LIBERAR = (cuerpo) => `void liberarLista(TNodo **lista) {\n${cuerpo}}`;
const LIBERAR_REF = '  TNodo *aux;\n\n  while (*lista != NULL) {\n    aux = *lista;\n    *lista = aux->sig;\n    free(aux);\n  }\n';
const L_BUSCAR = (cuerpo) => `TNodo *buscar(TNodo *lista, int valor) {\n  TNodo *aux = lista;\n\n${cuerpo}}`;
const L_PRIMERO = (cuerpo) => `void eliminarPrimero(TNodo **lista) {\n  TNodo *aux;\n\n${cuerpo}}`;
const L_VALOR = (cuerpo) => `void eliminarValor(TNodo **lista, int valor) {\n  TNodo *aux = *lista;\n  TNodo *anterior = NULL;\n\n${cuerpo}}`;
const VALOR_REF = '  while (aux != NULL && aux->dato != valor) {\n    anterior = aux;\n    aux = aux->sig;\n  }\n  if (aux == NULL) {\n    return;\n  }\n  if (anterior == NULL) {\n    *lista = aux->sig;\n  } else {\n    anterior->sig = aux->sig;\n  }\n  free(aux);\n';
const VALOR_SIN_LIBERAR = VALOR_REF.replace('  free(aux);\n', '');

// Serie 5: armar la lista.
const casosLista = [
  // ===== 1. crear un nodo
  lista(1, 'la referencia', L_CREAR(CREAR_REF)),
  lista(1, 'sin dejar sig en NULL', L_CREAR('  TNodo *nuevo = malloc(sizeof(TNodo));\n\n  if (nuevo == NULL) {\n    return NULL;\n  }\n  nuevo->dato = dato;\n  return nuevo;\n'), ['VARIABLE_SIN_VALOR']),
  lista(1, 'sin preguntar por NULL', L_CREAR('  TNodo *nuevo = malloc(sizeof(TNodo));\n\n  nuevo->dato = dato;\n  nuevo->sig = NULL;\n  return nuevo;\n'), ['NULL_SIN_COMPROBAR']),
  lista(1, 'reserva lo de un entero', L_CREAR('  TNodo *nuevo = malloc(sizeof(int));\n\n  if (nuevo == NULL) {\n    return NULL;\n  }\n  nuevo->dato = dato;\n  nuevo->sig = NULL;\n  return nuevo;\n'), ['FUERA_DE_BLOQUE']),
  lista(1, 'sin malloc', L_CREAR('  return NULL;\n'), ['MALLOC_FALTA']),

  // ===== 2. mostrar la lista
  lista(2, 'la referencia', L_MOSTRAR(MOSTRAR_REF)),
  lista(2, 'con un for', L_MOSTRAR('  for (TNodo *aux = lista; aux != NULL; aux = aux->sig) {\n    printf("%d ", aux->dato);\n  }\n')),
  lista(2, 'avanzando con la copia que recibe', L_MOSTRAR('  while (lista != NULL) {\n    printf("%d ", lista->dato);\n    lista = lista->sig;\n  }\n')),
  lista(2, 'se detiene en el ultimo nodo', L_MOSTRAR('  TNodo *aux = lista;\n\n  while (aux->sig != NULL) {\n    printf("%d ", aux->dato);\n    aux = aux->sig;\n  }\n'), ['DESREFERENCIA_NULA']),
  lista(2, 'sin avanzar', L_MOSTRAR('  TNodo *aux = lista;\n\n  while (aux != NULL) {\n    printf("%d ", aux->dato);\n  }\n'), ['NO_TERMINA']),
  lista(2, 'sin el espacio', L_MOSTRAR('  TNodo *aux = lista;\n\n  while (aux != NULL) {\n    printf("%d", aux->dato);\n    aux = aux->sig;\n  }\n'), ['MUESTRA_DISTINTA']),

  // ===== 3. insertar con una copia del puntero
  lista(3, 'solo 7', '0'),
  lista(3, 'cuatro y siete', '1', ['OPCION_INSERTA_ADELANTE']),
  lista(3, 'siete y cuatro', '2', ['OPCION_INSERTA_ATRAS']),

  // ===== 4. insertar al inicio
  lista(4, 'la referencia', L_INICIO('  nuevo->sig = *lista;\n  *lista = nuevo;\n')),
  lista(4, 'con malloc directo', 'void insertarInicio(TNodo **lista, int dato) {\n  TNodo *nuevo = malloc(sizeof(TNodo));\n\n  if (nuevo == NULL) {\n    return;\n  }\n  nuevo->dato = dato;\n  nuevo->sig = *lista;\n  *lista = nuevo;\n}'),
  lista(4, 'las dos lineas al reves', L_INICIO('  *lista = nuevo;\n  nuevo->sig = *lista;\n'), ['NO_TERMINA']),
  lista(4, 'sin enlazar con lo que habia', L_INICIO('  *lista = nuevo;\n'), ['MUESTRA_DISTINTA']),
  lista(4, 'lo deja al final', L_INICIO('  if (*lista == NULL) {\n    *lista = nuevo;\n    return;\n  }\n  TNodo *aux = *lista;\n\n  while (aux->sig != NULL) {\n    aux = aux->sig;\n  }\n  aux->sig = nuevo;\n'), ['MUESTRA_DISTINTA']),

  // ===== 5. el orden de las dos lineas
  lista(5, 'da igual', '0', ['OPCION_DA_IGUAL']),
  lista(5, 'al final', '1', ['OPCION_QUEDA_AL_FINAL']),
  lista(5, 'se apunta a si mismo', '2'),

  // ===== 6. recorrer hasta el ultimo
  lista(6, 'queda en el ultimo', '0', ['OPCION_QUEDA_EN_EL_ULTIMO']),
  lista(6, 'queda en NULL', '1'),
  lista(6, 'queda en el nuevo', '2', ['OPCION_QUEDA_EN_EL_NUEVO']),

  // ===== 7. insertar al final
  lista(7, 'la referencia', L_FINAL(FINAL_REF)),
  lista(7, 'con un for', L_FINAL('  if (*lista == NULL) {\n    *lista = nuevo;\n    return;\n  }\n  for (aux = *lista; aux->sig != NULL; aux = aux->sig) {\n  }\n  aux->sig = nuevo;\n')),
  lista(7, 'recorriendo hasta NULL', L_FINAL('  if (*lista == NULL) {\n    *lista = nuevo;\n    return;\n  }\n  aux = *lista;\n  while (aux != NULL) {\n    aux = aux->sig;\n  }\n  aux->sig = nuevo;\n'), ['DESREFERENCIA_NULA']),
  lista(7, 'sin el caso de la lista vacia', L_FINAL('  aux = *lista;\n  while (aux->sig != NULL) {\n    aux = aux->sig;\n  }\n  aux->sig = nuevo;\n'), ['DESREFERENCIA_NULA']),
  lista(7, 'lo inserta al principio', L_FINAL('  nuevo->sig = *lista;\n  *lista = nuevo;\n'), ['MUESTRA_DISTINTA']),
  lista(7, 'sin enlazar el nodo nuevo', L_FINAL('  if (*lista == NULL) {\n    *lista = nuevo;\n    return;\n  }\n  aux = *lista;\n  while (aux->sig != NULL) {\n    aux = aux->sig;\n  }\n'), ['MUESTRA_DISTINTA']),
];

// Serie 6: buscar, eliminar y liberar.
const casosQuitar = [
  // ===== 1. liberar y leer despues
  quitar(1, 'solo el primero', '0', ['OPCION_SOLO_EL_PRIMERO']),
  quitar(1, 'liberar aux', '1', ['OPCION_LIBERAR_AUX']),
  quitar(1, 'lee sig despues de liberar', '2'),

  // ===== 2. liberar toda la lista
  quitar(2, 'la referencia', L_LIBERAR(LIBERAR_REF)),
  quitar(2, 'con un puntero al siguiente', L_LIBERAR('  TNodo *aux = *lista;\n  TNodo *siguiente;\n\n  while (aux != NULL) {\n    siguiente = aux->sig;\n    free(aux);\n    aux = siguiente;\n  }\n  *lista = NULL;\n')),
  quitar(2, 'lee sig despues de liberar', L_LIBERAR('  TNodo *aux = *lista;\n\n  while (aux != NULL) {\n    free(aux);\n    aux = aux->sig;\n  }\n  *lista = NULL;\n'), ['USO_DE_MEMORIA_LIBERADA']),
  quitar(2, 'sin dejar la lista en NULL', L_LIBERAR('  TNodo *aux = *lista;\n  TNodo *siguiente;\n\n  while (aux != NULL) {\n    siguiente = aux->sig;\n    free(aux);\n    aux = siguiente;\n  }\n'), ['MUESTRA_DISTINTA']),
  quitar(2, 'solo el primero', L_LIBERAR('  if (*lista != NULL) {\n    free(*lista);\n  }\n  *lista = NULL;\n'), ['FUGA_DE_MEMORIA']),

  // ===== 3. buscar
  quitar(3, 'la referencia', L_BUSCAR('  while (aux != NULL && aux->dato != valor) {\n    aux = aux->sig;\n  }\n  return aux;\n')),
  quitar(3, 'con un for', 'TNodo *buscar(TNodo *lista, int valor) {\n  for (TNodo *aux = lista; aux != NULL; aux = aux->sig) {\n    if (aux->dato == valor) {\n      return aux;\n    }\n  }\n  return NULL;\n}'),
  quitar(3, 'sin comprobar el final', L_BUSCAR('  while (aux->dato != valor) {\n    aux = aux->sig;\n  }\n  return aux;\n'), ['DESREFERENCIA_NULA']),
  quitar(3, 'devuelve siempre el primero', L_BUSCAR('  return lista;\n'), ['MUESTRA_DISTINTA']),

  // ===== 4. cual recibe la direccion del puntero
  quitar(4, 'quitarPrimero', '0'),
  quitar(4, 'contar', '1', ['OPCION_CONTAR']),
  quitar(4, 'buscar', '2', ['OPCION_BUSCAR']),

  // ===== 5. eliminar el primero
  quitar(5, 'la referencia', L_PRIMERO('  if (*lista == NULL) {\n    return;\n  }\n  aux = *lista;\n  *lista = aux->sig;\n  free(aux);\n')),
  quitar(5, 'lee sig despues de liberar', L_PRIMERO('  if (*lista == NULL) {\n    return;\n  }\n  aux = *lista;\n  free(aux);\n  *lista = aux->sig;\n'), ['USO_DE_MEMORIA_LIBERADA']),
  quitar(5, 'sin la lista vacia', L_PRIMERO('  aux = *lista;\n  *lista = aux->sig;\n  free(aux);\n'), ['DESREFERENCIA_NULA']),
  quitar(5, 'sin liberar', L_PRIMERO('  if (*lista == NULL) {\n    return;\n  }\n  aux = *lista;\n  *lista = aux->sig;\n'), ['FREE_FALTA']),
  quitar(5, 'libera sin mover la lista', L_PRIMERO('  if (*lista == NULL) {\n    return;\n  }\n  free(*lista);\n'), ['USO_DE_MEMORIA_LIBERADA']),

  // ===== 6. eliminar uno del medio
  quitar(6, 'free enlaza', '0', ['OPCION_FREE_ENLAZA']),
  quitar(6, 'sig de a guarda un liberado', '1'),
  quitar(6, 'se liberan todos', '2', ['OPCION_SE_LIBERAN_TODOS']),

  // ===== 7. eliminar un valor
  quitar(7, 'la referencia', L_VALOR(VALOR_REF)),
  quitar(7, 'con el siguiente en una variable', 'void eliminarValor(TNodo **lista, int valor) {\n  TNodo *aux = *lista;\n  TNodo *anterior = NULL;\n\n  while (aux != NULL) {\n    if (aux->dato == valor) {\n      if (anterior == NULL) {\n        *lista = aux->sig;\n      } else {\n        anterior->sig = aux->sig;\n      }\n      free(aux);\n      return;\n    }\n    anterior = aux;\n    aux = aux->sig;\n  }\n}'),
  quitar(7, 'sin el caso del primero', L_VALOR(VALOR_REF.replace('  if (anterior == NULL) {\n    *lista = aux->sig;\n  } else {\n    anterior->sig = aux->sig;\n  }\n', '  anterior->sig = aux->sig;\n')), ['DESREFERENCIA_NULA']),
  quitar(7, 'sin el caso de que no este', L_VALOR(VALOR_REF.replace('aux != NULL && aux->dato', 'aux->dato').replace('  if (aux == NULL) {\n    return;\n  }\n', '')), ['DESREFERENCIA_NULA']),
  quitar(7, 'sin liberar el nodo', L_VALOR(VALOR_SIN_LIBERAR), ['FREE_FALTA']),
  quitar(7, 'libera antes de enlazar', L_VALOR(VALOR_SIN_LIBERAR.replace('  if (anterior == NULL) {', '  free(aux);\n  if (anterior == NULL) {')), ['USO_DE_MEMORIA_LIBERADA']),
];

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

  // ===== serie 3. 1. una funcion que reserva y no alcanza
  puntero(1, 'NULL, igual que antes', '0'),
  puntero(1, 'la direccion del bloque', '1', ['OPCION_DIRECCION_DEL_BLOQUE']),
  puntero(1, 'sin inicializar', '2', ['OPCION_SIN_INICIALIZAR']),

  // ===== 2. la direccion de un puntero
  puntero(2, 'int **', '2'),
  puntero(2, 'int *', '1', ['OPCION_INT_PUNTERO']),
  puntero(2, 'int', '0', ['OPCION_INT']),

  // ===== 3. que hay detras de cada asterisco
  puntero(3, 'la variable p', '2'),
  puntero(3, 'el entero n', '0', ['OPCION_EL_ENTERO']),
  puntero(3, 'la direccion de p', '1', ['OPCION_LA_DIRECCION']),

  // ===== 4. escribir con dos asteriscos
  puntero(4, 'el entero n', '1'),
  puntero(4, 'en pp', '0', ['OPCION_GUARDA_EN_PP']),
  puntero(4, 'en p', '2', ['OPCION_GUARDA_EN_P']),

  // ===== 4. corregir la funcion que reserva
  puntero(5, 'la referencia', RESERVAR_PP('  *p = malloc(sizeof(int));\n  **p = valor;\n')),
  puntero(5, 'con un puntero auxiliar', RESERVAR_PP('  int *x = malloc(sizeof(int));\n\n  *x = valor;\n  *p = x;\n')),
  puntero(5, 'la funcion con el error', RESERVAR_PP('  p = malloc(sizeof(int));\n  *p = valor;\n', 'int *p'), ['DESREFERENCIA_NULA']),
  puntero(5, 'recibe la direccion pero asigna a la copia', RESERVAR_PP('  p = malloc(sizeof(int));\n  **p = valor;\n'), ['FUERA_DE_BLOQUE']),
  puntero(5, 'sin malloc', RESERVAR_PP('  **p = valor;\n'), ['MALLOC_FALTA']),

  // ===== 5. reservar y avisar si se pudo
  puntero(6, 'la referencia', ENTEROS('  *v = malloc(n * sizeof(int));\n  if (*v == NULL) {\n    return FALSO;\n  }\n  return VERDADERO;\n')),
  puntero(6, 'con la pregunta por NULL de otra forma', ENTEROS('  *v = malloc(n * sizeof(int));\n  if (!*v) {\n    return FALSO;\n  }\n  return VERDADERO;\n')),
  puntero(6, 'devuelve siempre 1', ENTEROS('  *v = malloc(n * sizeof(int));\n  return VERDADERO;\n'), ['NULL_SIN_COMPROBAR']),
  puntero(6, 'pide los bytes sin sizeof', ENTEROS('  *v = malloc(n);\n  if (*v == NULL) {\n    return FALSO;\n  }\n  return VERDADERO;\n'), ['FUERA_DE_BLOQUE']),
  puntero(6, 'sin malloc', ENTEROS('  return FALSO;\n'), ['MALLOC_FALTA']),

  // ===== 6. liberar y dejar en NULL
  puntero(7, 'la referencia', LIBERAR('  free(*p);\n  *p = NULL;\n')),
  puntero(7, 'sin dejar en NULL', LIBERAR('  free(*p);\n'), ['LIBERACION_DOBLE']),
  puntero(7, 'sin liberar', LIBERAR('  *p = NULL;\n'), ['FREE_FALTA']),
  puntero(7, 'con un puntero comun', LIBERAR('  free(p);\n  p = NULL;\n', 'int *p'), ['LIBERACION_INVALIDA']),

  // ===== 7. que forma conviene
  puntero(8, 'return', '2'),
  puntero(8, 'un puntero a puntero', '0', ['OPCION_RECIBIR_PUNTERO_A_PUNTERO']),
  puntero(8, 'una global', '1', ['OPCION_GLOBAL']),


  // ===== 9. cual es la incorrecta
  puntero(9, 'dos asteriscos con p', '1'),
  puntero(9, 'dos asteriscos con pp', '0', ['OPCION_DOBLE_ASTERISCO_PP']),
  puntero(9, 'pp en NULL', '2', ['OPCION_PP_NULL']),

  // ===== 1. por que un puntero
  nodo(1, 'cada nodo contendria otro', '1'),
  nodo(1, 'una estructura no puede tener otra adentro', '0', ['OPCION_NO_PUEDE_ANIDAR']),
  nodo(1, 'hay que usar un alias', '2', ['OPCION_FALTA_TYPEDEF']),

  // ===== 2. como se nombra el tipo
  nodo(2, 'struct nodo', '2'),
  nodo(2, 'el alias', '0', ['OPCION_ALIAS']),
  nodo(2, 'la etiqueta sola', '1', ['OPCION_ETIQUETA_SOLA']),

  // ===== 3. declarar el nodo
  nodo(3, 'la referencia', NODO()),
  nodo(3, 'con otra etiqueta', NODO('struct elemento *sig;', 'TNodo', ' elemento')),
  nodo(3, 'con el typedef adelantado', 'typedef struct nodo TNodo;\n\nstruct nodo {\n  int dato;\n  TNodo *sig;\n};'),
  nodo(3, 'sin el alias', 'struct nodo {\n  int dato;\n  struct nodo *sig;\n};', ['ALIAS_FALTA']),
  nodo(3, 'sin el asterisco', NODO('struct nodo sig;'), ['CAMPO_NO_ES_PUNTERO']),
  nodo(3, 'con el alias adentro', NODO('TNodo *sig;'), ['CAMPO_ALIAS_ADENTRO']),
  nodo(3, 'sin etiqueta', NODO('TNodo *sig;', 'TNodo', ''), ['CAMPO_ALIAS_ADENTRO']),
  nodo(3, 'dos asteriscos', NODO('struct nodo **sig;'), ['CAMPO_PUNTEROS_DE_MAS']),
  nodo(3, 'apunta a un entero', NODO('int *sig;'), ['CAMPO_PUNTERO_OTRO']),
  nodo(3, 'sin el campo sig', 'typedef struct nodo {\n  int dato;\n} TNodo;', ['CAMPO_FALTA']),
  nodo(3, 'el dato como real', NODO().replace('int dato;', 'float dato;'), ['CAMPO_TIPO']),

  // ===== 4. corregir la declaracion
  nodo(4, 'con la etiqueta', NODO()),
  nodo(4, 'la declaracion con el error', NODO('TNodo *sig;', 'TNodo', ''), ['CAMPO_ALIAS_ADENTRO']),
  nodo(4, 'con etiqueta pero con el alias adentro', NODO('TNodo *sig;'), ['CAMPO_ALIAS_ADENTRO']),
  nodo(4, 'con la etiqueta pero sin el asterisco', NODO('struct nodo sig;'), ['CAMPO_NO_ES_PUNTERO']),

  // ===== 5. cuanto ocupa un nodo
  nodo(5, 'dieciseis', '0'),
  nodo(5, 'la suma de los campos', '1', ['OPCION_SUMA']),
  nodo(5, 'solo la direccion', '2', ['OPCION_SOLO_DIRECCION']),

  // ===== 6. enlazar dos nodos
  nodo(6, 'guarda la direccion', '2'),
  nodo(6, 'copia el nodo', '0', ['OPCION_COPIA_EL_NODO']),
  nodo(6, 'guarda el dato', '1', ['OPCION_GUARDA_EL_DATO']),

  // ===== 7. enlazar tres nodos y recorrerlos
  nodo(7, 'la referencia', TRES_NODOS(ENLACES + RECORRER)),
  nodo(7, 'recorriendo con un for', TRES_NODOS(ENLACES + '  for (; p != NULL; p = p->sig) {\n    printf("%d ", p->dato);\n  }\n')),
  nodo(7, 'sin marcar el ultimo nodo', TRES_NODOS(ENLACES.replace('  c.sig = NULL;\n', '') + RECORRER), ['VARIABLE_SIN_VALOR']),
  nodo(7, 'los nodos enlazados en otro orden', TRES_NODOS(ENLACES.replace('a.sig = &b;\n  b.sig = &c;', 'a.sig = &c;\n  c.sig = &b;').replace('  c.sig = NULL;', '  b.sig = NULL;') + RECORRER), ['MUESTRA_DISTINTA']),
  nodo(7, 'sin recorrer', TRES_NODOS(ENLACES), ['MUESTRA_FALTA']),

  // ===== 8. como se marca el final
  nodo(8, 'un valor que nadie asigno', '0'),
  nodo(8, 'toma NULL', '1', ['OPCION_SIG_NULL']),
  nodo(8, 'el ciclo se detiene solo', '2', ['OPCION_SE_DETIENE_SOLO']),

  ...casosLista,
  ...casosQuitar,
];
