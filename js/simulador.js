// Un interprete minimo de C, para corregir lo que hace un ciclo mirando el
// resultado y no la forma en que esta escrito.
//
// Sabe seguir una funcion con enteros y decimales, arreglos de cualquier
// dimension, asignaciones (=, +=, -=, *=, /=, %=), ++ y --, la aritmetica, las
// comparaciones, && y ||, if / else, for, while, do while, break y continue.
// No tiene entrada, salida, llamadas a funciones ni punteros: si encuentra algo
// que no sabe seguir, dice "SinVerificar" y la respuesta se deja como correcta
// pero sin comprobar.
//
//   ejecutar(arbol, constante) -> { variables, escrituras }
//
//   variables:  Map nombre -> { flotante, valor }                (una variable)
//                           | { flotante, dims, datos }          (un arreglo)
//   escrituras: [{ nombre, indices }] en el orden en que se escribio cada
//               posicion de un arreglo: sirve para saber si se recorrio hacia
//               atras.
//
// "constante(nombre)" devuelve el valor de un #define, o null.

// Algo que el interprete no sabe seguir.
export class SinVerificar extends Error {}

// Un indice que no existe: v[5] en un arreglo de 5.
export class FueraDeRango extends Error {
  constructor(nombre, indice, tamano, fila) {
    super(`${nombre}[${indice}] fuera de rango`);
    Object.assign(this, { nombre, indice, tamano, fila });
  }
}

// Una variable (o una posicion) que se usa sin que nadie le haya dado un valor.
export class SinValor extends Error {
  constructor(nombre, fila) {
    super(`${nombre} sin valor`);
    Object.assign(this, { nombre, fila });
  }
}

// Un ciclo que no termina (o que da demasiadas vueltas para ser lo que se pide).
export class NoTermina extends Error {
  constructor(fila) {
    super('el ciclo no termina');
    this.fila = fila;
  }
}

const PASOS_MAXIMOS = 100000;

const ESCAPES = { n: 10, t: 9, r: 13, '0': 0, "'": 39, '"': 34, '\\': 92 };

export function ejecutar(arbol, constante) {
  const funcion = arbol.rootNode.namedChildren.find((n) => n.type === 'function_definition');
  const cuerpo = funcion && funcion.childForFieldName('body');
  if (!cuerpo) throw new SinVerificar('no hay una funcion que seguir');

  const variables = new Map();
  const escrituras = [];
  let pasos = 0;

  const fila = (n) => n.startPosition.row;
  const sinVerificar = (n, que) => {
    throw new SinVerificar(`${que || n.type} en la linea ${fila(n) + 1}`);
  };
  const contar = (n) => {
    if (++pasos > PASOS_MAXIMOS) throw new NoTermina(fila(n));
  };

  // ---- expresiones: { v, f } con f = si es un decimal ---------------------

  function numero(texto, n) {
    const t = texto.replace(/[uUlLfF]+$/, '');
    if (/^0[xX][0-9a-fA-F]+$/.test(t)) return { v: parseInt(t, 16), f: false };
    if (!/^(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t)) sinVerificar(n);
    return { v: Number(t), f: /[.eE]/.test(t) || /[fF]$/.test(texto) };
  }

  function caracter(texto, n) {
    const c = texto.slice(1, -1);
    if ([...c].length === 1) return c.codePointAt(0);
    const m = /^\\(.)$/.exec(c);
    if (m && m[1] in ESCAPES) return ESCAPES[m[1]];
    return sinVerificar(n);
  }

  // Un arreglo, o lo que queda de el al indexarlo.
  function posicion(n) {
    if (n.type === 'identifier') {
      const variable = variables.get(n.text);
      if (!variable) {
        const valor = constante(n.text);
        if (valor == null) sinVerificar(n, `el nombre ${n.text}`);
        return { constante: valor };
      }
      return { variable, nombre: n.text, indices: [] };
    }
    if (n.type === 'subscript_expression') {
      const base = posicion(n.childForFieldName('argument'));
      if (!base.variable || !base.variable.dims) sinVerificar(n);
      const indice = evaluar(n.childForFieldName('index') || n.childForFieldName('indices'));
      const k = base.indices.length;
      if (k >= base.variable.dims.length) sinVerificar(n);
      const tamano = base.variable.dims[k];
      if (!Number.isInteger(indice.v) || indice.v < 0 || indice.v >= tamano) {
        throw new FueraDeRango(base.nombre, indice.v, tamano, fila(n));
      }
      return { ...base, indices: [...base.indices, indice.v] };
    }
    if (n.type === 'parenthesized_expression') return posicion(n.namedChildren[0]);
    return sinVerificar(n);
  }

  function leer(n) {
    const p = posicion(n);
    if (p.constante != null) return { v: p.constante, f: false };
    const { variable, nombre, indices } = p;
    if (!variable.dims) {
      if (variable.valor === undefined) throw new SinValor(nombre, fila(n));
      return { v: variable.valor, f: variable.flotante };
    }
    if (indices.length !== variable.dims.length) sinVerificar(n, `el arreglo ${nombre} entero`);
    let dato = variable.datos;
    for (const i of indices) dato = dato[i];
    if (dato === undefined) {
      throw new SinValor(`${nombre}${indices.map((i) => `[${i}]`).join('')}`, fila(n));
    }
    return { v: dato, f: variable.flotante };
  }

  function escribir(n, valor) {
    const p = posicion(n);
    if (p.constante != null) sinVerificar(n, 'una constante');
    const { variable, nombre, indices } = p;
    const v = variable.flotante ? valor.v : Math.trunc(valor.v);
    if (!variable.dims) {
      variable.valor = v;
      return;
    }
    if (indices.length !== variable.dims.length) sinVerificar(n);
    let dato = variable.datos;
    for (const i of indices.slice(0, -1)) dato = dato[i];
    dato[indices[indices.length - 1]] = v;
    escrituras.push({ nombre, indices });
  }

  function aplicar(operador, a, b, n) {
    const f = a.f || b.f;
    switch (operador) {
      case '+':
        return { v: a.v + b.v, f };
      case '-':
        return { v: a.v - b.v, f };
      case '*':
        return { v: a.v * b.v, f };
      case '/':
        if (b.v === 0) sinVerificar(n, 'una division por cero');
        return { v: f ? a.v / b.v : Math.trunc(a.v / b.v), f };
      case '%':
        if (f || b.v === 0) sinVerificar(n);
        return { v: a.v % b.v, f: false };
      case '<':
        return { v: a.v < b.v ? 1 : 0, f: false };
      case '<=':
        return { v: a.v <= b.v ? 1 : 0, f: false };
      case '>':
        return { v: a.v > b.v ? 1 : 0, f: false };
      case '>=':
        return { v: a.v >= b.v ? 1 : 0, f: false };
      case '==':
        return { v: a.v === b.v ? 1 : 0, f: false };
      case '!=':
        return { v: a.v !== b.v ? 1 : 0, f: false };
      default:
        return sinVerificar(n, `el operador ${operador}`);
    }
  }

  function evaluar(n) {
    contar(n);
    switch (n.type) {
      case 'number_literal':
        return numero(n.text, n);
      case 'char_literal':
        return { v: caracter(n.text, n), f: false };
      case 'identifier':
      case 'subscript_expression':
        return leer(n);
      case 'parenthesized_expression':
        return evaluar(n.namedChildren[0]);
      case 'unary_expression': {
        const operador = n.childForFieldName('operator').text;
        const a = evaluar(n.childForFieldName('argument'));
        if (operador === '-') return { v: -a.v, f: a.f };
        if (operador === '+') return a;
        if (operador === '!') return { v: a.v === 0 ? 1 : 0, f: false };
        return sinVerificar(n);
      }
      case 'binary_expression': {
        const operador = n.childForFieldName('operator').text;
        const izquierda = evaluar(n.childForFieldName('left'));
        // && y || no evaluan el segundo lado si no hace falta
        if (operador === '&&') {
          return { v: izquierda.v !== 0 && evaluar(n.childForFieldName('right')).v !== 0 ? 1 : 0, f: false };
        }
        if (operador === '||') {
          return { v: izquierda.v !== 0 || evaluar(n.childForFieldName('right')).v !== 0 ? 1 : 0, f: false };
        }
        return aplicar(operador, izquierda, evaluar(n.childForFieldName('right')), n);
      }
      case 'conditional_expression': {
        const condicion = evaluar(n.childForFieldName('condition'));
        return evaluar(n.childForFieldName(condicion.v !== 0 ? 'consequence' : 'alternative'));
      }
      case 'assignment_expression': {
        const izquierda = n.childForFieldName('left');
        const operador = n.childForFieldName('operator').text;
        const derecha = evaluar(n.childForFieldName('right'));
        const nuevo = operador === '=' ? derecha : aplicar(operador.slice(0, -1), leer(izquierda), derecha, n);
        escribir(izquierda, nuevo);
        return nuevo;
      }
      case 'update_expression': {
        const argumento = n.childForFieldName('argument');
        const antes = leer(argumento);
        const despues = { v: antes.v + (n.text.includes('++') ? 1 : -1), f: antes.f };
        escribir(argumento, despues);
        return /^(\+\+|--)/.test(n.text) ? despues : antes;
      }
      default:
        return sinVerificar(n);
    }
  }

  // ---- declaraciones -------------------------------------------------------

  // Los valores de una lista entre llaves, completada con ceros.
  function llenar(dims, lista, flotante) {
    const [k, ...resto] = dims;
    const datos = new Array(k).fill(resto.length ? undefined : 0);
    const elementos = lista ? lista.namedChildren.filter((h) => h.type !== 'comment') : [];
    elementos.forEach((e, i) => {
      if (i >= k) sinVerificar(lista, 'mas valores que posiciones');
      if (resto.length) datos[i] = e.type === 'initializer_list' ? llenar(resto, e, flotante) : sinVerificar(e);
      else datos[i] = flotante ? evaluar(e).v : Math.trunc(evaluar(e).v);
    });
    if (resto.length) {
      for (let i = 0; i < k; i++) if (datos[i] === undefined) datos[i] = llenar(resto, null, flotante);
    }
    return datos;
  }

  function sinLista(dims) {
    const [k, ...resto] = dims;
    return Array.from({ length: k }, () => (resto.length ? sinLista(resto) : undefined));
  }

  function declarar(n) {
    const tipo = n.childForFieldName('type');
    if (!tipo || !['primitive_type', 'sized_type_specifier'].includes(tipo.type)) sinVerificar(n, 'un tipo que no se sabe seguir');
    const flotante = /float|double/.test(tipo.text);
    for (const d of n.namedChildren) {
      if (!['identifier', 'init_declarator', 'array_declarator', 'pointer_declarator'].includes(d.type)) continue;
      let declarador = d;
      let inicial = null;
      if (d.type === 'init_declarator') {
        declarador = d.childForFieldName('declarator');
        inicial = d.childForFieldName('value');
      }
      const dims = [];
      let nombre = declarador;
      while (nombre.type === 'array_declarator') {
        const tamano = nombre.childForFieldName('size');
        dims.unshift(tamano ? evaluar(tamano).v : null);
        nombre = nombre.childForFieldName('declarator');
      }
      if (nombre.type !== 'identifier') sinVerificar(declarador, 'un puntero');
      if (!dims.length) {
        const valor = inicial ? evaluar(inicial) : null;
        variables.set(nombre.text, {
          flotante,
          valor: valor ? (flotante ? valor.v : Math.trunc(valor.v)) : undefined,
        });
        continue;
      }
      // "int v[] = {...}": la cantidad sale de la lista
      if (dims[0] === null) {
        if (!inicial || inicial.type !== 'initializer_list') sinVerificar(d);
        dims[0] = inicial.namedChildren.filter((h) => h.type !== 'comment').length;
      }
      if (dims.some((k) => !Number.isInteger(k) || k < 0)) sinVerificar(d);
      const datos =
        inicial && inicial.type === 'initializer_list' ? llenar(dims, inicial, flotante) : sinLista(dims);
      if (inicial && inicial.type !== 'initializer_list') sinVerificar(inicial);
      variables.set(nombre.text, { flotante, dims, datos });
    }
  }

  // ---- sentencias: devuelven 'break', 'continue', 'return' o null ---------

  function condicion(n) {
    return evaluar(n).v !== 0;
  }

  function sentencia(n) {
    contar(n);
    switch (n.type) {
      case 'comment':
      case 'preproc_def':
      case 'preproc_include':
        return null;
      case 'declaration':
        declarar(n);
        return null;
      case 'expression_statement':
        if (n.namedChildren.length) evaluar(n.namedChildren[0]);
        return null;
      case 'compound_statement':
        return bloque(n);
      case 'break_statement':
        return 'break';
      case 'continue_statement':
        return 'continue';
      case 'return_statement':
        return 'return';
      case 'if_statement': {
        const alternativa = n.childForFieldName('alternative');
        if (condicion(n.childForFieldName('condition'))) return sentencia(n.childForFieldName('consequence'));
        if (!alternativa) return null;
        return sentencia(alternativa.type === 'else_clause' ? alternativa.namedChildren[0] : alternativa);
      }
      case 'for_statement': {
        const inicio = n.childForFieldName('initializer');
        const prueba = n.childForFieldName('condition');
        const avance = n.childForFieldName('update');
        if (inicio) (inicio.type === 'declaration' ? declarar : evaluar)(inicio);
        while (!prueba || condicion(prueba)) {
          contar(n);
          const salida = sentencia(n.childForFieldName('body'));
          if (salida === 'break') break;
          if (salida === 'return') return 'return';
          if (avance) evaluar(avance);
        }
        return null;
      }
      case 'while_statement': {
        while (condicion(n.childForFieldName('condition'))) {
          contar(n);
          const salida = sentencia(n.childForFieldName('body'));
          if (salida === 'break') break;
          if (salida === 'return') return 'return';
        }
        return null;
      }
      case 'do_statement': {
        do {
          contar(n);
          const salida = sentencia(n.childForFieldName('body'));
          if (salida === 'break') break;
          if (salida === 'return') return 'return';
        } while (condicion(n.childForFieldName('condition')));
        return null;
      }
      default:
        return sinVerificar(n);
    }
  }

  function bloque(n) {
    for (const hijo of n.namedChildren) {
      const salida = sentencia(hijo);
      if (salida) return salida;
    }
    return null;
  }

  bloque(cuerpo);
  return { variables, escrituras };
}
