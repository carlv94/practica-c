// Casos de la serie "Seguir una recursion a mano" (tablas de llamadas), y la
// comprobacion de que cada tabla coincide con lo que hace el programa.
// Mismo formato que casos.js.

import { analizar, evaluar } from '../js/pila.js';

const serie = (paso, nombre, respuesta, espera = 'ok', extra = {}) => ({
  serie: 'recursion-a-mano',
  paso,
  nombre,
  respuesta,
  espera,
  ...extra,
});

// La respuesta de una tabla: las celdas fila por fila, [ida, vuelta], y el texto de la salida.
const tabla = (celdas, salida) => JSON.stringify({ celdas, salida });
// La misma tabla con una celda cambiada.
const con = (celdas, i, j, texto) => celdas.map((fila, k) => (k === i ? fila.map((c, m) => (m === j ? texto : c)) : fila));

const FACTORIAL_3 = [
  ['factorial(3)', '6'],
  ['3 * factorial(2)', '3 * 2'],
  ['2 * factorial(1)', '2 * 1'],
  ['1 * factorial(0)', '1 * 1'],
  ['1', '1'],
];
const FACTORIAL_4 = [
  ['factorial(4)', '24'],
  ['4 * factorial(3)', '4 * 6'],
  ['3 * factorial(2)', '3 * 2'],
  ['2 * factorial(1)', '2 * 1'],
  ['1 * factorial(0)', '1 * 1'],
  ['1', '1'],
];
const SUMA_4 = [
  ['suma(4)', '10'],
  ['4 + suma(3)', '4 + 6'],
  ['3 + suma(2)', '3 + 3'],
  ['2 + suma(1)', '2 + 1'],
  ['1 + suma(0)', '1 + 0'],
  ['0', '0'],
];
const POTENCIA = [
  ['potencia(2, 3)', '8'],
  ['2 * potencia(2, 2)', '2 * 4'],
  ['2 * potencia(2, 1)', '2 * 2'],
  ['2 * potencia(2, 0)', '2 * 1'],
  ['1', '1'],
];
const CUENTA = [
  ['(nada)', '(nada)'],
  ['3', '3'],
  ['2', '2'],
  ['1', '1'],
  ['(nada)', '(nada)'],
];
const DIGITOS = [
  ['digitos(1234)', '4'],
  ['1 + digitos(123)', '1 + 3'],
  ['1 + digitos(12)', '1 + 2'],
  ['1 + digitos(1)', '1 + 1'],
  ['1', '1'],
];

export const CASOS_DE_PILA = [
  // ---- 1: la ida de factorial(3) ----
  serie(1, 'la ida bien escrita', tabla(FACTORIAL_3), 'ok'),
  serie(1, 'la fila de ejemplo no se corrige', tabla(con(FACTORIAL_3, 1, 0, 'lo que sea'))),
  serie(1, 'sin espacios', tabla(con(FACTORIAL_3, 2, 0, '2*factorial(1)'))),
  serie(1, 'con una x en lugar del asterisco', tabla(con(FACTORIAL_3, 2, 0, '2 x factorial(1)'))),
  serie(1, 'con una cruz en lugar del asterisco', tabla(con(FACTORIAL_3, 2, 0, '2 × factorial(1)'))),
  serie(1, 'con los operandos al reves', tabla(con(FACTORIAL_3, 2, 0, 'factorial(1) * 2')), ['PILA_ORDEN_DISTINTO'], {
    dice: ['los operandos van en el mismo orden'],
  }),
  serie(1, 'sin reemplazar n', tabla(con(FACTORIAL_3, 2, 0, 'n * factorial(n - 1)')), ['PILA_IDA_INCORRECTA']),
  serie(1, 'con el argumento sin calcular', tabla(con(FACTORIAL_3, 2, 0, '2 * factorial(2 - 1)')), ['PILA_ARGUMENTO_SIN_CALCULAR'], {
    dice: ['ya calculado'],
  }),
  serie(1, 'la llamada de otra fila', tabla(con(FACTORIAL_3, 2, 0, '2 * factorial(0)')), ['PILA_IDA_INCORRECTA']),
  serie(1, 'el caso base con una cuenta', tabla(con(FACTORIAL_3, 4, 0, '0 * factorial(-1)')), ['PILA_IDA_INCORRECTA']),
  serie(1, 'una cuenta incompleta', tabla(con(FACTORIAL_3, 2, 0, '2 *')), ['PILA_EXPRESION_ILEGIBLE']),
  serie(1, 'una celda sin completar', tabla(con(FACTORIAL_3, 3, 0, '')), ['PILA_CELDA_VACIA'], { dice: ['Falta completar 1 celda'] }),
  serie(1, 'la tabla vacia', tabla(FACTORIAL_3.map((f, i) => (i === 0 ? f : ['', f[1]]))), ['PILA_CELDA_VACIA'], {
    dice: ['Faltan completar 3 celdas'],
  }),
  serie(1, 'una respuesta que no es una tabla', 'hola', ['PILA_CELDA_VACIA']),
  // ---- 2: la vuelta de factorial(3) ----
  serie(2, 'la vuelta bien escrita', tabla(FACTORIAL_3)),
  serie(2, 'con el resultado al lado', tabla(con(FACTORIAL_3, 1, 1, '3 * 2 = 6'))),
  serie(2, 'solo el resultado', tabla(con(FACTORIAL_3, 1, 1, '6')), ['PILA_VUELTA_SIN_CUENTA'], { dice: ['escribir solo el resultado no alcanza'] }),
  serie(2, 'con los operandos al reves', tabla(con(FACTORIAL_3, 2, 1, '1 * 2')), ['PILA_ORDEN_DISTINTO']),
  serie(2, 'con otro valor de la llamada de abajo', tabla(con(FACTORIAL_3, 1, 1, '3 * 3')), ['PILA_VUELTA_INCORRECTA']),
  serie(2, 'la cuenta donde va el valor de main', tabla(con(FACTORIAL_3, 0, 1, '3 * 2')), ['PILA_VUELTA_INCORRECTA']),
  serie(2, 'el valor de main equivocado', tabla(con(FACTORIAL_3, 0, 1, '3')), ['PILA_VUELTA_INCORRECTA']),
  serie(2, 'una cuenta incompleta', tabla(con(FACTORIAL_3, 3, 1, '1 * ')), ['PILA_EXPRESION_ILEGIBLE']),
  serie(2, 'todo vacio', tabla(FACTORIAL_3.map((f) => [f[0], ''])), ['PILA_CELDA_VACIA']),
  // ---- 3: ida y vuelta de factorial(4) ----
  serie(3, 'la tabla completa', tabla(FACTORIAL_4)),
  serie(3, 'una ida mal y una vuelta mal', tabla(con(con(FACTORIAL_4, 1, 0, '4 * factorial(2)'), 2, 1, '3 * 3')), [
    'PILA_IDA_INCORRECTA',
    'PILA_VUELTA_INCORRECTA',
  ]),
  serie(3, 'la vuelta con los operandos al reves', tabla(con(FACTORIAL_4, 1, 1, '6 * 4')), ['PILA_ORDEN_DISTINTO']),
  // ---- 4: cual termina primero ----
  serie(4, 'la que no llama a nadie', '1'),
  serie(4, 'la primera en llamarse', '0', ['OPCION_TERMINA_LA_PRIMERA_EN_LLAMARSE']),
  serie(4, 'la de uno', '2', ['OPCION_TERMINA_LA_DE_UNO']),
  // ---- 5: suma ----
  serie(5, 'la tabla completa', tabla(SUMA_4)),
  serie(5, 'la suma con los operandos al reves', tabla(con(SUMA_4, 1, 1, '6 + 4')), ['PILA_ORDEN_DISTINTO']),
  serie(5, 'el caso base con un uno', tabla(con(SUMA_4, 5, 1, '1')), ['PILA_VUELTA_INCORRECTA']),
  serie(5, 'con un asterisco en lugar del mas', tabla(con(SUMA_4, 2, 0, '3 * suma(2)')), ['PILA_IDA_INCORRECTA']),
  // ---- 6: potencia ----
  serie(6, 'la tabla completa', tabla(POTENCIA)),
  serie(6, 'con el argumento sin calcular', tabla(con(POTENCIA, 1, 0, '2 * potencia(2, 3 - 1)')), ['PILA_ARGUMENTO_SIN_CALCULAR']),
  serie(6, 'bajando la base', tabla(con(POTENCIA, 1, 0, '2 * potencia(1, 3)')), ['PILA_IDA_INCORRECTA']),
  // ---- 7: mostrar antes y despues ----
  serie(7, 'la tabla completa', tabla(CUENTA, '3 2 1 1 2 3')),
  serie(7, 'la salida sin espacios', tabla(CUENTA, '321123')),
  serie(7, 'la salida a medias', tabla(CUENTA, '3 2 1'), ['PILA_SALIDA_INCORRECTA']),
  serie(7, 'sin la salida', tabla(CUENTA, ''), ['PILA_CELDA_VACIA']),
  serie(7, 'lo que muestra antes equivocado', tabla(con(CUENTA, 2, 0, '1'), '3 2 1 1 2 3'), ['PILA_TEXTO_INCORRECTO'], {
    dice: ['Muestra antes de llamar'],
  }),
  serie(7, 'lo que muestra al volver equivocado', tabla(con(CUENTA, 1, 1, '(nada)'), '3 2 1 1 2 3'), ['PILA_TEXTO_INCORRECTO']),
  // ---- 8: digitos ----
  serie(8, 'la tabla completa', tabla(DIGITOS)),
  serie(8, 'con la division sin calcular', tabla(con(DIGITOS, 1, 0, '1 + digitos(1234 / 10)')), ['PILA_ARGUMENTO_SIN_CALCULAR']),
  serie(8, 'con decimales', tabla(con(DIGITOS, 1, 0, '1 + digitos(123.4)')), ['PILA_IDA_INCORRECTA']),
  serie(8, 'la vuelta con los operandos al reves', tabla(con(DIGITOS, 2, 1, '2 + 1')), ['PILA_ORDEN_DISTINTO']),
];

const sinEspacios = (t) => String(t ?? '').replace(/\s+/g, '');

// Los numeros que aparecen en una expresion.
const numerosDe = (n) => {
  if (!n) return [];
  if (n.t === 'num') return [n.v];
  if (n.t === 'bin') return [...numerosDe(n.a), ...numerosDe(n.b)];
  if (n.t === 'neg') return numerosDe(n.a);
  if (n.t === 'call') return n.args.flatMap(numerosDe);
  return [];
};

// La tabla de una consigna tiene que coincidir con lo que hace el programa: la
// salida es la que dice la tabla, cada vuelta da el valor que le toca, usa lo que
// devolvio la llamada de abajo, y cada ida nombra la llamada de la fila siguiente.
// "salida" es lo que muestra el programa al correrlo con el simulador.
export function problemasDeLaTabla(consigna, salida) {
  const { columnas, filas } = consigna.pila;
  const problemas = [];
  const valores = [];
  columnas.forEach((columna) => {
    if (columna.tipo === 'texto') return;
    filas.forEach((fila, i) => {
      const arbol = analizar(fila[columna.id]);
      if (!arbol) problemas.push(`${fila.llamada}: no se puede leer «${fila[columna.id]}»`);
      if (columna.tipo === 'cuenta') valores[i] = arbol && evaluar(arbol) ? evaluar(arbol).v : null;
    });
  });
  const cuenta = columnas.find((c) => c.tipo === 'cuenta');
  const llamada = columnas.find((c) => c.tipo === 'llamada');
  if (cuenta) {
    // El valor que recibe main es lo que muestra el programa.
    const mostrado = Number(String(salida).trim());
    if (valores[0] !== mostrado) problemas.push(`main recibe ${valores[0]} y el programa muestra ${mostrado}`);
    if (valores[0] !== valores[1]) problemas.push(`main recibe ${valores[0]} y ${filas[1].llamada} devuelve ${valores[1]}`);
    filas.forEach((fila, i) => {
      if (i === 0 || i === filas.length - 1) return;
      const debajo = valores[i + 1];
      if (!numerosDe(analizar(fila[cuenta.id])).includes(debajo)) {
        problemas.push(`${fila.llamada}: la vuelta no usa lo que devolvió ${filas[i + 1].llamada} (${debajo})`);
      }
    });
  }
  if (llamada) {
    filas.forEach((fila, i) => {
      if (i === filas.length - 1) return;
      if (!sinEspacios(fila[llamada.id]).includes(sinEspacios(filas[i + 1].llamada))) {
        problemas.push(`${fila.llamada}: la ida no nombra ${filas[i + 1].llamada}`);
      }
    });
  }
  if (consigna.pila.salida && sinEspacios(consigna.pila.salida.esperada) !== sinEspacios(salida)) {
    problemas.push(`la salida de la tabla es «${consigna.pila.salida.esperada}» y el programa muestra «${salida}»`);
  }
  return problemas;
}
