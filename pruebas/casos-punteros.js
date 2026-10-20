// Casos de las series de punteros.
// Mismo formato que casos.js.

const serie = (id) => (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: id,
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

const direcciones = serie('punteros-direcciones');
const variables = serie('punteros-variables');

export const CASOS_DE_PUNTEROS = [
  // ===== Donde vive una variable =====
  direcciones(1, 'la direccion de b', '2'),
  direcciones(1, 'el valor de b', '0', ['OPCION_ES_EL_VALOR']),
  direcciones(1, 'la direccion de a', '1', ['OPCION_ES_LA_DE_OTRA']),
  direcciones(2, 'el valor', '1'),
  direcciones(2, 'la direccion', '0', ['OPCION_MUESTRA_LA_DIRECCION']),
  direcciones(2, 'cambia en cada ejecucion', '2', ['OPCION_CAMBIA_CADA_VEZ']),
  direcciones(3, 'la direccion de b', '1'),
  direcciones(3, 'el valor de b', '0', ['OPCION_ES_EL_VALOR']),
  direcciones(3, 'una copia', '2', ['OPCION_ES_UNA_COPIA']),
  direcciones(4, 'para saber donde guardar', '0'),
  direcciones(4, 'solo numeros', '1', ['OPCION_SOLO_NUMEROS']),
  direcciones(4, 'para mostrarlo', '2', ['OPCION_SE_MUESTRA']),
  direcciones(5, 'un int ocupa cuatro', '1'),
  direcciones(5, 'deja libres', '0', ['OPCION_DEJA_LIBRES']),
  direcciones(5, 'siempre multiplo de cuatro', '2', ['OPCION_SIEMPRE_CUATRO']),

  // ===== Variables puntero =====
  // ---- 1: que guarda un puntero ----
  variables(1, 'la direccion de x', '1'),
  variables(1, 'el valor de x', '0', ['OPCION_GUARDA_EL_VALOR']),
  variables(1, 'su propia direccion', '2', ['OPCION_GUARDA_SU_DIRECCION']),
  // ---- 2: declarar y apuntar ----
  variables(2, 'declarar y despues apuntar', 'int *p;\n\np = &n;', 'ok', { mejoras: [] }),
  variables(2, 'declarar y apuntar juntos', 'int *p = &n;', 'ok', { mejoras: [] }),
  variables(2, 'otro nombre', 'int *dir;\ndir = &n;'),
  variables(2, 'con el asterisco pegado al tipo', 'int* p;\np = &n;'),
  variables(2, 'sin apuntar', 'int *p;', ['PUNTERO_SIN_APUNTAR']),
  variables(2, 'sin el ampersand', 'int *p;\np = n;', ['PUNTERO_SIN_AMPERSAND'], { dice: ['La dirección de una variable se escribe con un `&`'] }),
  variables(2, 'un numero en lugar de la direccion', 'int *p;\np = 5;', ['PUNTERO_CON_UN_VALOR']),
  variables(2, 'apunta a otra variable', 'int m = 3;\nint *p;\np = &m;', ['PUNTERO_APUNTA_A_OTRO']),
  variables(2, 'sin el asterisco', 'int p;\np = &n;', ['PUNTERO_FALTA_ASTERISCO']),
  variables(2, 'un puntero a otro tipo', 'float *p;\np = &n;', ['PUNTERO_TIPO']),
  variables(2, 'no declara nada', 'n = 5;', ['PUNTERO_FALTA']),
  // ---- 3: que es *p ----
  variables(3, 'la variable a la que apunta', '1'),
  variables(3, 'la direccion', '0', ['OPCION_ES_LA_DIRECCION']),
  variables(3, 'una copia', '2', ['OPCION_ES_UNA_COPIA']),
  // ---- 4: leer a traves del puntero ----
  variables(4, 'con el asterisco', 'printf("%d", *p);', 'ok', { mejoras: [] }),
  variables(4, 'con un salto de linea', 'printf("%d\\n", *p);'),
  variables(4, 'nombrando a n', 'printf("%d", n);', ['CONTENIDO_FALTA']),
  variables(4, 'sin el asterisco', 'printf("%d", p);', ['PUNTERO_SIN_ASTERISCO'], { dice: ['guarda la dirección de una variable y no su valor'] }),
  variables(4, 'otro valor', 'printf("%d", *p + 1);', ['MUESTRA_DISTINTA']),
  // ---- 5: cambiar a traves del puntero ----
  variables(5, 'con el asterisco', '*p = 10;', 'ok', { mejoras: [] }),
  variables(5, 'nombrando a n', 'n = 10;', ['CONTENIDO_FALTA']),
  variables(5, 'sin el asterisco', 'p = 10;', ['PUNTERO_CON_UN_VALOR'], { dice: ['*p = 10;'] }),
  variables(5, 'otro valor', '*p = 11;', ['RESULTADO_VALOR_DISTINTO']),
  variables(5, 'con una cuenta', '*p = *p + 5;'),
  variables(5, 'apuntando a otra variable', 'int otra = 0;\np = &otra;\n*p = 10;', ['RESULTADO_VALOR_DISTINTO']),
  // ---- 6: seguir el puntero ----
  variables(6, 'seis', '1'),
  variables(6, 'cinco', '0', ['OPCION_NO_CAMBIA']),
  variables(6, 'la direccion', '2', ['OPCION_MUESTRA_LA_DIRECCION']),
  // ---- 7: que vale cada expresion ----
  variables(7, 'el contenido no es una direccion', '1'),
  variables(7, 'p vale mil', '0', ['OPCION_P_VALE_MIL']),
  variables(7, 'la direccion vale mil', '2', ['OPCION_DIRECCION_VALE_MIL']),
  // ---- 8: dos punteros ----
  variables(8, 'nueve', '1'),
  variables(8, 'uno', '0', ['OPCION_SOLO_CAMBIA_Q']),
  variables(8, 'la direccion', '2', ['OPCION_MUESTRA_LA_DIRECCION']),
  // ---- 9: los dos significados del * ----
  variables(9, 'declarar y llegar', '1'),
  variables(9, 'multiplicar', '0', ['OPCION_MULTIPLICAR']),
  variables(9, 'siempre puntero', '2', ['OPCION_SIEMPRE_PUNTERO']),
  // ---- 10: un puntero para cada tipo ----
  variables(10, 'tiene que ser del mismo tipo', '1'),
  variables(10, 'funciona', '0', ['OPCION_FUNCIONA']),
  variables(10, 'se trunca', '2', ['OPCION_SE_TRUNCA']),
];
