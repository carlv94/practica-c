// Seguir una recursion a mano: una tabla con una fila por llamada, donde el
// alumno escribe lo que pasa en la ida (la llamada que queda esperando) y en la
// vuelta (la cuenta con lo que devolvio la llamada de abajo).
//
// Una consigna con "pila" no lleva codigo para escribir:
//   "pila": {
//     "columnas": [ { "id": "ida", "titulo": "Ida", "tipo": "llamada" },
//                   { "id": "vuelta", "titulo": "Vuelta", "tipo": "cuenta" } ],
//     "filas": [ { "llamada": "main", "ida": "factorial(3)", "vuelta": "6" }, ... ],
//     "dadas": ["ida"],                 // columnas que vienen escritas en todas las filas
//     "pistas": { "ida": "...", "vuelta": "..." },
//     "salida": { "titulo": "...", "esperada": "3 2 1", "pista": "..." }   // opcional
//   }
// Una fila puede traer "dadas": ["ida"] para las celdas que vienen escritas solo en ella.
//
// Los tipos de columna: "llamada" y "cuenta" se escriben como expresiones, que se
// comparan por su estructura (no por el resultado): los operandos van en el orden del
// codigo; "texto" es lo que muestra el programa y se compara sin los espacios.
// La respuesta es un JSON: { "celdas": [[ida, vuelta], ...], "salida": "..." }, con
// todas las celdas (las dadas, con su texto).

const num = (v, f = false) => ({ t: 'num', v, f });
const bin = (op, a, b) => ({ t: 'bin', op, a, b });

// "4 x 6" y "4 × 6" se leen como "4 * 6": en el celular la x se escribe sin cambiar de teclado.
const X_POR_VECES = /(?<=[\d)])\s*[x×·]\s*(?=[\d(A-Za-z_])/g;

function fichas(texto) {
  const t = texto.replace(X_POR_VECES, ' * ');
  const re = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|([-+*/%(),]))/y;
  const lista = [];
  let pos = 0;
  while (pos < t.length) {
    if (/^\s*$/.test(t.slice(pos))) break;
    re.lastIndex = pos;
    const m = re.exec(t);
    if (!m) return null;
    lista.push(m[1] !== undefined ? { n: m[1] } : m[2] !== undefined ? { id: m[2] } : { s: m[3] });
    pos = re.lastIndex;
  }
  return lista;
}

// El arbol de una expresion (numeros, + - * / %, parentesis y llamadas), o null si
// no se puede leer. "4 * 6 = 24" cuenta solo hasta el igual. Los parentesis no
// dejan marca en el arbol: (n - 1) y n - 1 son lo mismo.
export function analizar(texto) {
  const igual = texto.indexOf('=');
  const lista = fichas(igual >= 0 ? texto.slice(0, igual) : texto);
  if (!lista || !lista.length) return null;
  let i = 0;
  const es = (s) => lista[i] && lista[i].s === s;
  function suma() {
    let a = producto();
    while (a && (es('+') || es('-'))) {
      const op = lista[i++].s;
      const b = producto();
      a = b && bin(op, a, b);
    }
    return a;
  }
  function producto() {
    let a = unario();
    while (a && (es('*') || es('/') || es('%'))) {
      const op = lista[i++].s;
      const b = unario();
      a = b && bin(op, a, b);
    }
    return a;
  }
  function unario() {
    if (es('-')) {
      i++;
      const a = unario();
      if (!a) return null;
      return a.t === 'num' ? num(-a.v, a.f) : { t: 'neg', a };
    }
    return primario();
  }
  function primario() {
    const f = lista[i];
    if (!f) return null;
    if (f.n !== undefined) {
      i++;
      return num(Number(f.n), f.n.includes('.'));
    }
    if (f.id !== undefined) {
      i++;
      if (!es('(')) return { t: 'var', nombre: f.id };
      i++;
      const args = [];
      if (es(')')) {
        i++;
        return { t: 'call', nombre: f.id, args };
      }
      for (;;) {
        const a = suma();
        if (!a) return null;
        args.push(a);
        if (es(',')) {
          i++;
          continue;
        }
        if (!es(')')) return null;
        i++;
        return { t: 'call', nombre: f.id, args };
      }
    }
    if (f.s === '(') {
      i++;
      const a = suma();
      if (!a || !es(')')) return null;
      i++;
      return a;
    }
    return null;
  }
  const arbol = suma();
  return arbol && i === lista.length ? arbol : null;
}

// Lo que vale una cuenta con solo numeros: { v, f } (f: es decimal), o null si tiene
// llamadas o variables, o divide por cero. La division entre enteros trunca, como en C.
export function evaluar(n) {
  switch (n.t) {
    case 'num':
      return { v: n.v, f: n.f };
    case 'neg': {
      const a = evaluar(n.a);
      return a && { v: -a.v, f: a.f };
    }
    case 'bin': {
      const a = evaluar(n.a);
      const b = evaluar(n.b);
      if (!a || !b) return null;
      const f = a.f || b.f;
      switch (n.op) {
        case '+':
          return { v: a.v + b.v, f };
        case '-':
          return { v: a.v - b.v, f };
        case '*':
          return { v: a.v * b.v, f };
        case '/':
          return b.v === 0 ? null : { v: f ? a.v / b.v : Math.trunc(a.v / b.v), f };
        default:
          return b.v === 0 || f ? null : { v: a.v % b.v, f: false };
      }
    }
    default:
      return null;
  }
}

export const mostrar = (r) => (r.f ? String(Number(r.v.toFixed(6))) : String(r.v));

const clave = (n) => JSON.stringify(n);
const iguales = (a, b) => clave(a) === clave(b);

// El mismo arbol con los operandos de + y * en un orden fijo: sirve para saber si
// dos expresiones son lo mismo salvo el orden.
function canonica(n) {
  switch (n.t) {
    case 'bin': {
      const a = canonica(n.a);
      const b = canonica(n.b);
      return (n.op === '+' || n.op === '*') && clave(a) > clave(b) ? bin(n.op, b, a) : bin(n.op, a, b);
    }
    case 'neg':
      return { t: 'neg', a: canonica(n.a) };
    case 'call':
      return { ...n, args: n.args.map(canonica) };
    default:
      return n;
  }
}

// Los argumentos de las llamadas ya calculados: factorial(4 - 1) pasa a factorial(3).
function conArgumentosCalculados(n) {
  switch (n.t) {
    case 'bin':
      return bin(n.op, conArgumentosCalculados(n.a), conArgumentosCalculados(n.b));
    case 'neg':
      return { t: 'neg', a: conArgumentosCalculados(n.a) };
    case 'call':
      return {
        ...n,
        args: n.args.map((a) => {
          const c = conArgumentosCalculados(a);
          const r = evaluar(c);
          return r ? num(r.v, r.f) : c;
        }),
      };
    default:
      return n;
  }
}

const sinEspacios = (t) => String(t ?? '').replace(/\s+/g, '');
const esDada = (pila, fila, columna) => (pila.dadas || []).includes(columna.id) || (fila.dadas || []).includes(columna.id);

// Corrige la tabla. Cada error lleva la celda ({ fila, columna }) para marcarla.
export function corregirPila(consigna, respuesta) {
  const pila = consigna.pila;
  let dada = null;
  try {
    dada = JSON.parse(respuesta);
  } catch {
    dada = null;
  }
  const celdas = Array.isArray(dada?.celdas) ? dada.celdas : [];
  const diagnosticos = [];
  const error = (codigo, mensaje, celda) => diagnosticos.push({ nivel: 'error', codigo, mensaje, linea: null, celda });
  const con = (pista) => (pista ? ` ${pista}` : '');
  let vacias = 0;

  pila.filas.forEach((fila, i) => {
    pila.columnas.forEach((columna, j) => {
      if (esDada(pila, fila, columna)) return;
      const escrito = String(celdas[i]?.[j] ?? '').trim();
      if (!escrito) {
        vacias++;
        return;
      }
      const donde = { fila: i, columna: j };
      const llamada = `\`${fila.llamada}\``;
      const pista = con(pila.pistas?.[columna.id]);
      const esperado = fila[columna.id];
      if (columna.tipo === 'texto') {
        if (sinEspacios(escrito) !== sinEspacios(esperado)) {
          error(
            'PILA_TEXTO_INCORRECTO',
            `Lo que escribió para ${llamada} en «${columna.titulo}» no es lo que muestra el programa.${pista}`,
            donde
          );
        }
        return;
      }
      const cuenta = columna.tipo === 'cuenta';
      const nombre = cuenta ? 'la vuelta' : 'la ida';
      const suyo = analizar(escrito);
      if (!suyo) {
        error(
          'PILA_EXPRESION_ILEGIBLE',
          `No pude leer lo que escribió en ${nombre} de ${llamada}: revise que la expresión esté completa.`,
          donde
        );
        return;
      }
      const buscado = analizar(esperado);
      if (iguales(suyo, buscado)) return;
      if (cuenta && suyo.t === 'num' && buscado.t !== 'num') {
        error(
          'PILA_VUELTA_SIN_CUENTA',
          `La vuelta de ${llamada} es una cuenta con lo que devolvió la llamada de abajo: escribir solo el resultado no alcanza.${pista}`,
          donde
        );
      } else if (!cuenta && iguales(conArgumentosCalculados(suyo), buscado)) {
        error(
          'PILA_ARGUMENTO_SIN_CALCULAR',
          `En la ida de ${llamada} el argumento de la llamada hay que escribirlo ya calculado, con su valor.${pista}`,
          donde
        );
      } else if (iguales(canonica(suyo), canonica(buscado))) {
        error(
          'PILA_ORDEN_DISTINTO',
          `En ${nombre} de ${llamada} los operandos van en el mismo orden que en el código, y acá están en otro.${pista}`,
          donde
        );
      } else {
        error(cuenta ? 'PILA_VUELTA_INCORRECTA' : 'PILA_IDA_INCORRECTA', `${cuenta ? 'La vuelta' : 'La ida'} de ${llamada} no es esa.${pista}`, donde);
      }
    });
  });

  if (pila.salida) {
    const escrito = String(dada?.salida ?? '').trim();
    if (!escrito) vacias++;
    else if (sinEspacios(escrito) !== sinEspacios(pila.salida.esperada)) {
      error('PILA_SALIDA_INCORRECTA', `Lo que muestra el programa en total no es eso.${con(pila.salida.pista)}`, { salida: true });
    }
  }
  if (vacias) {
    diagnosticos.push({
      nivel: 'error',
      codigo: 'PILA_CELDA_VACIA',
      mensaje: vacias === 1 ? 'Falta completar 1 celda.' : `Faltan completar ${vacias} celdas.`,
      linea: null,
    });
  }
  if (diagnosticos.length) return { correcto: false, mejorable: false, diagnosticos, capturas: {} };
  return {
    correcto: true,
    mejorable: false,
    diagnosticos: consigna.explicacion
      ? [{ nivel: 'explicacion', codigo: 'PILA_CORRECTA', mensaje: consigna.explicacion, linea: null }]
      : [],
    capturas: {},
  };
}

// La respuesta correcta, en el formato de la respuesta del alumno.
export function respuestaModelo(pila) {
  return JSON.stringify({
    celdas: pila.filas.map((fila) => pila.columnas.map((columna) => fila[columna.id])),
    salida: pila.salida ? pila.salida.esperada : undefined,
  });
}

// La tabla como texto, para la pantalla final.
export function pilaComoTexto(consigna, respuesta) {
  let dada = null;
  try {
    dada = JSON.parse(respuesta);
  } catch {
    dada = null;
  }
  const pila = consigna.pila;
  const lineas = pila.filas.map((fila, i) =>
    [fila.llamada, ...pila.columnas.map((_, j) => dada?.celdas?.[i]?.[j] ?? '')].join(' | ')
  );
  if (pila.salida) lineas.push(`${pila.salida.titulo} ${dada?.salida ?? ''}`.trim());
  return ['// Respuesta: ' + ['llamada', ...pila.columnas.map((c) => c.titulo.toLowerCase())].join(' | '), ...lineas.map((l) => '// ' + l)].join('\n');
}
