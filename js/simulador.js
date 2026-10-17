// Un interprete minimo de C, para corregir lo que hace un ciclo mirando el
// resultado y no la forma en que esta escrito.
//
// Sabe seguir una funcion con enteros y decimales, arreglos de cualquier
// dimension, asignaciones (=, +=, -=, *=, /=, %=), ++ y --, la aritmetica, las
// comparaciones, && y ||, el cambio de tipo ((float) suma), if / else, for,
// while, do while, break y continue, y
// sizeof, las funciones pow, scanf (con datos de entrada que se le dan) y
// printf (que anota lo que muestra).
// No tiene otras llamadas a funciones ni punteros: si encuentra algo
// que no sabe seguir, dice "SinVerificar" y la respuesta se deja como correcta
// pero sin comprobar.
//
//   ejecutar(arbol, constante, entrada) -> { variables, escrituras, mostrados,
//                                            delArreglo, salida, lecturas, leidos }
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
  // "escrito" es si el indice es un numero escrito: notas[6]. "dimension" es
  // cual de los indices (0 es la fila) y "dimensiones", cuantos tiene el arreglo.
  constructor(nombre, indice, tamano, fila, escrito = false, dimension = 0, dimensiones = 1) {
    super(`${nombre}[${indice}] fuera de rango`);
    Object.assign(this, { nombre, indice, tamano, fila, escrito, dimension, dimensiones });
  }
}

// Un nombre que no es una variable ni una constante conocida: casi siempre, un
// error de tipeo.
export class NombreDesconocido extends Error {
  // "indice" es donde se uso el nombre, para saber si se declaro mas arriba
  // pero en un lugar que ya no existe (otra funcion, un bloque que termino).
  constructor(nombre, fila, indice = null) {
    super(`${nombre} no esta declarado`);
    Object.assign(this, { nombre, fila, indice });
  }
}

// Nombres de la biblioteca que valen sin declararse: no se pueden seguir, pero
// tampoco son un error.
const DE_LA_BIBLIOTECA = ['NULL', 'EOF', 'stdin', 'stdout', 'stderr', 'RAND_MAX', 'INT_MAX', 'INT_MIN', 'true', 'false'];

// Una variable (o una posicion) que se usa sin que nadie le haya dado un valor.
export class SinValor extends Error {
  constructor(nombre, fila) {
    super(`${nombre} sin valor`);
    Object.assign(this, { nombre, fila });
  }
}

// Un miembro de una union que se lee despues de escribir otro: comparten el
// mismo lugar, y lo que habia en este se perdio. "texto" es lo leido tal como
// esta escrito (lectura.entero) y "vigente" el miembro que si tiene el valor.
export class MiembroNoVigente extends Error {
  constructor(texto, miembro, vigente, fila) {
    super(`${texto} no es el miembro que tiene el valor`);
    Object.assign(this, { texto, miembro, vigente, fila });
  }
}

// Un ciclo que no termina (o que da demasiadas vueltas para ser lo que se pide).
export class NoTermina extends Error {
  constructor(fila) {
    super('el ciclo no termina');
    this.fila = fila;
  }
}

// Una division (o un resto) por cero.
// Un texto entre comillas dobles ("A") donde va una letra ('A'): al compararlo o
// asignarlo se usa el lugar donde esta el texto, no la letra.
export class TextoComoLetra extends Error {
  constructor(texto, fila) {
    super('un texto donde va una letra');
    Object.assign(this, { texto, fila });
  }
}

// Una estructura entera (alumno.ingreso) donde va un numero: tiene que ser uno
// de sus campos.
export class EstructuraEntera extends Error {
  // "esUnion": lo que se uso entero es una union (lectura, lectura.medida).
  constructor(texto, fila, esUnion = false) {
    super('una estructura donde va un numero');
    Object.assign(this, { texto, fila, esUnion });
  }
}

// ---- funciones propias -----------------------------------------------------

// Se llama a una funcion con otra cantidad de argumentos que parametros.
export class ArgumentosDistintos extends Error {
  constructor(funcion, esperados, recibidos, fila) {
    super(`${funcion} recibe ${esperados} argumentos`);
    Object.assign(this, { funcion, esperados, recibidos, fila });
  }
}

// Un parametro que se declara con * y al que se le pasa el valor, sin &.
export class LlamadaSinAmpersand extends Error {
  constructor(funcion, parametro, texto, fila) {
    super('falta el & al llamar');
    Object.assign(this, { funcion, parametro, texto, fila });
  }
}

// Un parametro comun al que se le pasa una direccion, con &.
export class LlamadaConAmpersand extends Error {
  constructor(funcion, parametro, texto, fila) {
    super('sobra el & al llamar');
    Object.assign(this, { funcion, parametro, texto, fila });
  }
}

// Un parametro declarado con * que se usa sin el * (x = 5; en vez de *x = 5;).
export class PunteroSinAsterisco extends Error {
  constructor(nombre, fila) {
    super(`${nombre} se usa sin el *`);
    Object.assign(this, { nombre, fila });
  }
}

// Un * delante de algo que no esta declarado con * (*x, con x un int).
export class AsteriscoDeMas extends Error {
  constructor(nombre, fila) {
    super(`${nombre} no esta declarado con *`);
    Object.assign(this, { nombre, fila });
  }
}

// Se usa el valor de una funcion que termina sin devolver nada.
export class SinRetorno extends Error {
  constructor(funcion, fila) {
    super(`${funcion} no devuelve nada`);
    Object.assign(this, { funcion, fila });
  }
}

// Se usa como valor lo que devuelve una funcion void.
export class VoidComoValor extends Error {
  constructor(funcion, fila) {
    super(`${funcion} es void`);
    Object.assign(this, { funcion, fila });
  }
}

// Los ambitos de una funcion: sus variables, y detras las globales.
class Ambito extends Map {
  constructor(padre = null) {
    super();
    this.padre = padre;
  }

  get(clave) {
    return super.has(clave) ? super.get(clave) : this.padre ? this.padre.get(clave) : undefined;
  }

  has(clave) {
    return super.has(clave) || Boolean(this.padre && this.padre.has(clave));
  }
}

export class DivisionPorCero extends Error {
  constructor(fila) {
    super('division por cero');
    this.fila = fila;
  }
}

// Lo que ocupa un tipo, en una maquina de uso comun: char 1, short 2, int y
// float 4, long y double 8.
function bytesDe(texto) {
  if (/double|long/.test(texto)) return 8;
  if (/char/.test(texto)) return 1;
  if (/short/.test(texto)) return 2;
  return 4;
}

// scanf pide un dato y no hay mas para darle.
export class SinEntrada extends Error {
  constructor(fila) {
    super('no hay mas datos para leer');
    this.fila = fila;
  }
}

// scanf recibe el valor de una variable en lugar de su direccion: "notas[0]".
export class AmpersandFalta extends Error {
  constructor(texto, fila) {
    super('falta el &');
    Object.assign(this, { texto, fila });
  }
}

// printf recibe la direccion de una variable: "&notas[0]".
export class AmpersandDeMas extends Error {
  constructor(texto, fila) {
    super('sobra el &');
    Object.assign(this, { texto, fila });
  }
}

// Un arreglo nombrado sin decir cual de sus posiciones: printf("%d", notas).
export class ArregloSinPosicion extends Error {
  constructor(nombre, fila) {
    super(`${nombre} es un arreglo`);
    Object.assign(this, { nombre, fila });
  }
}

// El formato no es el del tipo de lo que se lee o se muestra: %d con un float.
//   funcion: "scanf" | "printf"; formato: "%d"; texto: lo que esta escrito;
//   tipo: "int" | "float" | "double" | "decimal" (un valor decimal sin variable).
export class FormatoDistinto extends Error {
  constructor(funcion, formato, texto, tipo, fila) {
    super(`${formato} no corresponde a ${texto}`);
    Object.assign(this, { funcion, formato, texto, tipo, fila });
  }
}

// Hay mas (o menos) conversiones en el formato que valores para ellas.
export class ConversionesDistintas extends Error {
  constructor(funcion, conversiones, valores, fila) {
    super('conversiones y valores distintos');
    Object.assign(this, { funcion, conversiones, valores, fila });
  }
}

const PASOS_MAXIMOS = 100000;

// Las estructuras definidas en el programa, por su etiqueta y por su alias:
//   Map { 'Alumno' => [{ nombre, texto, soportado }], 'TAlumno' => [...] }
// Un campo es "soportado" si es un numero o una letra suelta. Las cadenas y lo
// demas no se siguen: tocarlos deja la verificacion sin hacer.
function recogerEstructuras(arbol) {
  const porNombre = new Map();
  const camposDe = (cuerpo) => {
    const lista = [];
    for (const f of cuerpo.namedChildren) {
      if (f.type !== 'field_declaration') continue;
      const tipo = f.childForFieldName('type');
      if (!tipo) continue;
      for (const d of f.namedChildren) {
        if (d === tipo || !['field_identifier', 'array_declarator', 'pointer_declarator'].includes(d.type)) continue;
        let nombre = d;
        let simple = true;
        while (nombre && nombre.type !== 'field_identifier') {
          simple = false;
          nombre = nombre.childForFieldName('declarator');
        }
        if (!nombre) continue;
        const numerico = ['primitive_type', 'sized_type_specifier'].includes(tipo.type);
        // Un campo que es otra estructura (TFecha nacimiento;): se sigue por dentro.
        const deEstructura =
          simple && tipo.type === 'type_identifier'
            ? tipo.text
            : simple && (tipo.type === 'struct_specifier' || tipo.type === 'union_specifier')
              ? tipo.childForFieldName('name')?.text
              : simple && tipo.type === 'enum_specifier' && tipo.childForFieldName('name')
                ? 'enum ' + tipo.childForFieldName('name').text
                : null;
        lista.push({
          nombre: nombre.text,
          texto: tipo.text,
          soportado: simple && numerico,
          estructura: deEstructura || null,
        });
      }
    }
    return lista;
  };
  // Una union es una lista de campos marcada: "esUnion". Sus miembros comparten
  // el lugar, y lo que ocupa es lo del mas grande ("bytes", o null si alguno no
  // se sabe cuanto mide).
  const deUnion = (nodo, lista) => {
    if (nodo.type !== 'union_specifier') return lista;
    lista.esUnion = true;
    lista.bytes = lista.every((c) => c.soportado)
      ? Math.max(...lista.map((c) => bytesDe(c.texto)))
      : null;
    return lista;
  };
  const visitar = (n) => {
    if (n.type === 'struct_specifier' || n.type === 'union_specifier') {
      const cuerpo = n.childForFieldName('body');
      const nombre = n.childForFieldName('name');
      if (cuerpo && nombre) porNombre.set(nombre.text, deUnion(n, camposDe(cuerpo)));
    }
    if (n.type === 'type_definition') {
      const tipo = n.childForFieldName('type');
      const alias = n.childForFieldName('declarator');
      if (tipo && alias && ['struct_specifier', 'union_specifier'].includes(tipo.type) && alias.type === 'type_identifier') {
        const cuerpo = tipo.childForFieldName('body');
        const nombre = tipo.childForFieldName('name');
        const lista = cuerpo ? deUnion(tipo, camposDe(cuerpo)) : nombre ? porNombre.get(nombre.text) : null;
        if (lista) porNombre.set(alias.text, lista);
      }
    }
    for (const h of n.namedChildren) visitar(h);
  };
  visitar(arbol.rootNode);
  return porNombre;
}

const ESCAPES = { n: 10, t: 9, r: 13, '0': 0, "'": 39, '"': 34, '\\': 92 };

// "entrada" es lo que el usuario escribe, un numero por cada dato que se lee;
// sin ella, cualquier scanf queda sin verificar.
// "prueba" cambia los valores con que se declaran arreglos de una dimension:
// { ventas: [5, 3, 8] } deja a "ventas" con esos valores, aunque diga otros.
// "desde" es donde empieza lo que escribio el alumno: una asignacion del codigo
// que le dieron a una variable con valor de prueba no lo cambia (el valor de
// prueba es el que vale en ese caso).
export function ejecutar(arbol, constante, entrada = null, prueba = null, desde = null) {
  // Las funciones del programa, por nombre. Se empieza por la de prueba que arma
  // el corrector (__prueba), la envoltura de las series (practica) o main.
  const definidas = new Map();
  for (const n of arbol.rootNode.namedChildren) {
    if (n.type !== 'function_definition') continue;
    let d = n.childForFieldName('declarator');
    while (d && d.type !== 'function_declarator') d = d.childForFieldName('declarator');
    const nombre = d && d.childForFieldName('declarator');
    if (nombre && !definidas.has(nombre.text)) definidas.set(nombre.text, { nodo: n, declarador: d, nombre: nombre.text });
  }
  const entradaDelPrograma =
    definidas.get('__prueba') ||
    definidas.get('practica') ||
    definidas.get('main') ||
    [...definidas.values()][0];
  const funcion = entradaDelPrograma && entradaDelPrograma.nodo;
  const cuerpo = funcion && funcion.childForFieldName('body');
  if (!cuerpo) throw new SinVerificar('no hay una funcion que seguir');

  // Un enumerado es un entero: sus nombres de tipo ("TTurno", "enum Turno") se
  // declaran y se convierten como un int.
  const tiposEnum = new Set();
  (function buscarEnums(nodo) {
    if (nodo.type === 'enum_specifier') {
      const nombre = nodo.childForFieldName('name');
      if (nombre) tiposEnum.add('enum ' + nombre.text);
    }
    if (nodo.type === 'type_definition') {
      const tipo = nodo.childForFieldName('type');
      const alias = nodo.childForFieldName('declarator');
      if (tipo && alias && tipo.type === 'enum_specifier' && alias.type === 'type_identifier') tiposEnum.add(alias.text);
    }
    for (const h of nodo.namedChildren) buscarEnums(h);
  })(arbol.rootNode);
  const esTipoEnum = (dado) => {
    // En un cast el tipo viene envuelto en un type_descriptor.
    const nodo = dado && dado.type === 'type_descriptor' ? dado.childForFieldName('type') : dado;
    return (
    Boolean(nodo) &&
    ((nodo.type === 'type_identifier' && tiposEnum.has(nodo.text)) ||
      (nodo.type === 'enum_specifier' && nodo.childForFieldName('name') && tiposEnum.has('enum ' + nodo.childForFieldName('name').text))));
  };

  // Cada funcion tiene su ambito: sus parametros y variables, y detras las
  // globales. "variables" es el de la funcion que se esta siguiendo.
  const globales = new Ambito();
  const globalesDeEstructuras = new Ambito();
  let variables = new Ambito(globales);
  // Una variable de estructura se sigue "aplanada": cada campo numerico es una
  // variable con el nombre "alumno.promedio" (o un arreglo, si la variable lo es).
  const definiciones = recogerEstructuras(arbol);
  let estructurasVivas = new Ambito(globalesDeEstructuras); // nombre de la variable -> sus campos
  let retorno = null; // lo que devolvio el ultimo "return"
  let profundidad = 0;
  const escrituras = [];
  const mostrados = []; // los numeros que muestra printf, en orden
  const delArreglo = []; // de esos, los que salen de una posicion de un arreglo
  const origenes = []; // de cada uno de esos, { nombre, indices } o null
  const visitas = new Map(); // arreglo -> un conjunto de indices tocados por cada dimension
  const lecturasPorPosicion = new Map(); // lo mismo, solo las posiciones que se leyeron
  const lineas = []; // los numeros que salen en cada renglon, uno por renglon
  let renglon = [];
  const leidos = new Set(); // los arreglos de los que se leyo alguna posicion
  let salida = '';
  let lecturas = 0;
  let siguiente = 0;
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
    // El analizador entrega un numero negativo escrito, "-1", como un solo numero.
    if (!/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t)) sinVerificar(n);
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
      if (!variable && estructurasVivas.has(n.text)) {
        if (estructurasVivas.get(n.text).esUnion) throw new EstructuraEntera(n.text, fila(n), true);
        sinVerificar(n, `la estructura ${n.text} entera`);
      }
      if (!variable) {
        const valor = constante(n.text);
        if (valor == null) {
          if (DE_LA_BIBLIOTECA.includes(n.text)) sinVerificar(n, `el nombre ${n.text}`);
          throw new NombreDesconocido(n.text, fila(n), n.startIndex);
        }
        return { constante: valor };
      }
      return { variable, nombre: n.text, indices: [] };
    }
    if (n.type === 'subscript_expression') {
      const base = posicion(n.childForFieldName('argument'));
      if (!base.variable || !base.variable.dims) sinVerificar(n);
      const nodoIndice = n.childForFieldName('index') || n.childForFieldName('indices');
      const indice = evaluar(nodoIndice);
      const k = base.indices.length;
      if (k >= base.variable.dims.length) sinVerificar(n);
      const tamano = base.variable.dims[k];
      if (!Number.isInteger(indice.v) || indice.v < 0 || indice.v >= tamano) {
        throw new FueraDeRango(
          base.nombre,
          indice.v,
          tamano,
          fila(n),
          nodoIndice.type === 'number_literal',
          k,
          base.variable.dims.length
        );
      }
      return { ...base, indices: [...base.indices, indice.v] };
    }
    if (n.type === 'parenthesized_expression') return posicion(n.namedChildren[0]);
    if (n.type === 'field_expression') return posicionDeCampo(n);
    // *x: lo que apunta un parametro declarado con * (la variable que llego con &).
    if (n.type === 'pointer_expression' && /^\*/.test(n.text.trimStart())) {
      const argumento = n.childForFieldName('argument') || n.namedChildren[n.namedChildren.length - 1];
      if (!argumento || argumento.type !== 'identifier') return sinVerificar(n);
      const variable = variables.get(argumento.text);
      if (!variable) {
        if (constante(argumento.text) != null || DE_LA_BIBLIOTECA.includes(argumento.text)) return sinVerificar(n);
        throw new NombreDesconocido(argumento.text, fila(n), argumento.startIndex);
      }
      if (variable.puntero) return variable.destino;
      // *v en un arreglo es su primera posicion.
      if (variable.dims && variable.dims.length === 1) return { variable, nombre: argumento.text, indices: [0] };
      throw new AsteriscoDeMas(argumento.text, fila(n));
    }
    return sinVerificar(n);
  }

  // Un campo de una variable de estructura: "alumno.promedio" es esa variable
  // aplanada, y "alumnos[i].promedio" una de las posiciones de "alumnos.promedio".
  function posicionDeCampo(n) {
    if (n.text.includes('->')) return sinVerificar(n);
    // El camino de afuera hacia adentro: campos e indices, hasta la variable.
    const partes = [];
    let actual = n;
    while (['field_expression', 'subscript_expression', 'parenthesized_expression'].includes(actual.type)) {
      if (actual.type === 'field_expression') {
        const campo = actual.childForFieldName('field');
        if (!campo) return sinVerificar(n);
        partes.unshift({ campo: campo.text });
        actual = actual.childForFieldName('argument');
      } else if (actual.type === 'subscript_expression') {
        partes.unshift({ indice: actual.childForFieldName('index') || actual.childForFieldName('indices') });
        actual = actual.childForFieldName('argument');
      } else {
        actual = actual.namedChildren[0];
      }
    }
    const base = actual;
    if (base.type !== 'identifier') return sinVerificar(n);
    if (!estructurasVivas.has(base.text)) {
      if (variables.has(base.text) || constante(base.text) != null) return sinVerificar(n);
      throw new NombreDesconocido(base.text, fila(n), base.startIndex);
    }
    const clave = [base.text, ...partes.filter((p) => p.campo).map((p) => p.campo)].join('.');
    const variable = variables.get(clave);
    if (!variable) {
      const esEstructura = [...variables.keys()].some((k) => k.startsWith(clave + '.'));
      if (esEstructura) {
        const esUnion = [...variables.values()].some((v) => v.union && v.union.grupo === clave);
        throw new EstructuraEntera(n.text, fila(n), esUnion);
      }
      return sinVerificar(n, `el campo ${clave}`);
    }
    const posiciones = [];
    partes
      .filter((p) => p.indice)
      .forEach((p, k) => {
        const indice = evaluar(p.indice);
        const tamano = variable.dims ? variable.dims[k] : undefined;
        if (tamano === undefined) sinVerificar(n);
        if (!Number.isInteger(indice.v) || indice.v < 0 || indice.v >= tamano) {
          throw new FueraDeRango(
            base.text,
            indice.v,
            tamano,
            fila(n),
            p.indice.type === 'number_literal',
            k,
            variable.dims.length
          );
        }
        posiciones.push(indice.v);
      });
    if (variable.dims && posiciones.length !== variable.dims.length) sinVerificar(n, `${base.text} sin todos sus indices`);
    if (!variable.dims && posiciones.length) sinVerificar(n);
    return { variable, nombre: clave, indices: posiciones };
  }

  function leer(n) {
    const p = posicion(n);
    if (p.constante != null) return { v: p.constante, f: false };
    const { variable, nombre, indices } = p;
    if (variable.puntero) throw new PunteroSinAsterisco(nombre, fila(n));
    if (!variable.dims) {
      if (variable.valor === undefined) throw faltaValor(variable, nombre, '', n);
      return { v: variable.valor, f: variable.flotante };
    }
    if (indices.length !== variable.dims.length) sinVerificar(n, `el arreglo ${nombre} entero`);
    leidos.add(nombre);
    visitar(nombre, variable.dims.length, indices);
    if (!lecturasPorPosicion.has(nombre)) {
      lecturasPorPosicion.set(nombre, Array.from({ length: variable.dims.length }, () => new Set()));
    }
    indices.forEach((i, k) => lecturasPorPosicion.get(nombre)[k].add(i));
    let dato = variable.datos;
    for (const i of indices) dato = dato[i];
    if (dato === undefined) {
      throw faltaValor(variable, `${nombre}${indices.map((i) => `[${i}]`).join('')}`, indices.join(','), n);
    }
    return { v: dato, f: variable.flotante };
  }

  // Sin valor porque nadie se lo dio, o porque otro miembro de la union lo piso.
  function faltaValor(variable, nombre, lugar, n) {
    const vigente = variable.pisado && variable.pisado.get(lugar);
    if (!vigente) return new SinValor(nombre, fila(n));
    return new MiembroNoVigente(n.text, nombre.split('.').pop().replace(/\[.*$/, ''), vigente, fila(n));
  }

  function escribir(n, valor) {
    guardar(posicion(n), valor, n);
  }

  // Anota las posiciones tocadas: cada indice, en el conjunto de su dimension.
  function visitar(nombre, dimensiones, indices) {
    if (!visitas.has(nombre)) visitas.set(nombre, Array.from({ length: dimensiones }, () => new Set()));
    indices.forEach((i, k) => visitas.get(nombre)[k].add(i));
  }

  function guardar(p, valor, n) {
    if (p.constante != null) sinVerificar(n, 'una constante');
    const { variable, nombre, indices } = p;
    if (variable.puntero) throw new PunteroSinAsterisco(nombre, fila(n));
    const v = variable.flotante ? valor.v : Math.trunc(valor.v);
    if (!variable.dims) {
      variable.valor = v;
      if (variable.union) pisarOtrosMiembros(variable, nombre, []);
      return;
    }
    if (indices.length !== variable.dims.length) sinVerificar(n);
    visitar(nombre, variable.dims.length, indices);
    let dato = variable.datos;
    for (const i of indices.slice(0, -1)) dato = dato[i];
    dato[indices[indices.length - 1]] = v;
    escrituras.push({ nombre, indices });
    if (variable.union) pisarOtrosMiembros(variable, nombre, indices);
  }

  // Los miembros de una union comparten el lugar: al guardar en uno, los otros
  // ya no tienen valor. Se anota cual es el que lo tiene, para decirlo si despues
  // se lee uno de los pisados. "indices" es la posicion, si la union es de un arreglo.
  function pisarOtrosMiembros(variable, nombre, indices) {
    const { grupo, miembros } = variable.union;
    const propio = nombre.slice(grupo.length + 1);
    const lugar = indices.join(',');
    if (variable.pisado) variable.pisado.delete(lugar);
    for (const m of miembros) {
      if (m === propio) continue;
      const otro = variables.get(`${grupo}.${m}`);
      if (!otro) continue;
      if (!otro.dims) {
        otro.valor = undefined;
      } else {
        let dato = otro.datos;
        for (const i of indices.slice(0, -1)) dato = dato[i];
        dato[indices[indices.length - 1]] = undefined;
      }
      if (!otro.pisado) otro.pisado = new Map();
      otro.pisado.set(lugar, propio);
    }
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
        if (b.v === 0) throw new DivisionPorCero(fila(n));
        return { v: f ? a.v / b.v : Math.trunc(a.v / b.v), f };
      case '%':
        if (b.v === 0) throw new DivisionPorCero(fila(n));
        if (f) sinVerificar(n);
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

  // Lo que ocupa una variable (todo el arreglo) o un elemento: sizeof(v) y
  // sizeof(v[0]).
  function bytesDeNodo(x, n) {
    while (x && (x.type === 'parenthesized_expression' || x.type === 'type_descriptor')) x = x.namedChildren[0];
    if (!x) return sinVerificar(n);
    const producto = (dims) => dims.reduce((a, b) => a * b, 1);
    // De una union (su tipo, o una variable) es lo del miembro mas grande. De una
    // estructura no se sabe: depende de como la acomoda cada maquina.
    const deUnion = (campos, conDims) => {
      if (!campos || !campos.esUnion || campos.bytes == null || conDims) return sinVerificar(n, 'sizeof de una estructura');
      return campos.bytes;
    };
    if (x.type === 'union_specifier' || x.type === 'struct_specifier') {
      const nombre = x.childForFieldName('name');
      return deUnion(nombre && definiciones.get(nombre.text), false);
    }
    if ((x.type === 'identifier' || x.type === 'type_identifier') && estructurasVivas.has(x.text)) {
      const campos = estructurasVivas.get(x.text);
      return deUnion(campos, Boolean(variables.get(`${x.text}.${campos[0] && campos[0].nombre}`)?.dims));
    }
    if (x.type === 'type_identifier' && !variables.has(x.text) && definiciones.has(x.text)) {
      return deUnion(definiciones.get(x.text), false);
    }
    if (x.type === 'identifier' && !variables.has(x.text) && definiciones.has(x.text)) {
      return deUnion(definiciones.get(x.text), false);
    }
    if (x.type === 'identifier' || x.type === 'type_identifier') {
      const v = variables.get(x.text);
      if (!v) return sinVerificar(n, `sizeof de ${x.text}`);
      return v.dims ? producto(v.dims) * v.bytes : v.bytes;
    }
    if (x.type === 'subscript_expression') {
      let k = 0;
      let base = x;
      while (base.type === 'subscript_expression') {
        k++;
        base = base.childForFieldName('argument');
      }
      const v = base.type === 'identifier' ? variables.get(base.text) : null;
      if (!v || !v.dims || k > v.dims.length) return sinVerificar(n);
      return producto(v.dims.slice(k)) * v.bytes;
    }
    return sinVerificar(n);
  }

  // ---- printf y scanf --------------------------------------------------------

  const DESESCAPE = { n: '\n', t: '\t', r: '\r', '"': '"', '\\': '\\', "'": "'", '0': '\0' };

  // El texto de un formato, sin las comillas y con sus escapes.
  function textoDe(n) {
    if (n.type !== 'string_literal') sinVerificar(n, 'un formato que no es un texto escrito');
    const crudo = n.text.slice(1, -1);
    return crudo.replace(/\\(.)/g, (todo, c) => (c in DESESCAPE ? DESESCAPE[c] : sinVerificar(n)));
  }

  // Las partes de un formato: texto fijo y conversiones (%d, %i, %f, %lf, %c).
  function partes(texto, n) {
    const lista = [];
    const re = /%([-0]*)(\d*)(?:\.(\d+))?(l?)([a-zA-Z%])/g;
    let desde = 0;
    let m;
    while ((m = re.exec(texto))) {
      if (m.index > desde) lista.push({ texto: texto.slice(desde, m.index) });
      desde = m.index + m[0].length;
      if (m[5] === '%' && !m[1] && !m[2] && !m[3] && !m[4]) {
        lista.push({ texto: '%' });
        continue;
      }
      const formato = `%${m[4]}${m[5]}`;
      if (!['%d', '%i', '%f', '%lf', '%c'].includes(formato)) sinVerificar(n, `la conversion ${m[0]}`);
      if (m[4] && m[5] !== 'f') sinVerificar(n, `la conversion ${m[0]}`);
      lista.push({ formato, relleno: m[1], ancho: Number(m[2] || 0), decimales: m[3] === undefined ? null : Number(m[3]) });
    }
    if (desde < texto.length) lista.push({ texto: texto.slice(desde) });
    if (lista.some((p) => p.texto != null && p.texto.includes('%'))) sinVerificar(n, 'un formato que no se sabe seguir');
    return lista;
  }

  const conversiones = (lista) => lista.filter((p) => p.formato);

  // Un nombre, y el tipo con que se declaro: lo unico que importa para el formato.
  function tipoDe(n) {
    if (['identifier', 'subscript_expression', 'field_expression'].includes(n.type)) {
      const p = posicion(n);
      if (p.variable) return p.variable.tipo;
    }
    return null;
  }

  function imprimir(n, lista) {
    const partesDelFormato = partes(textoDe(lista[0]), n);
    const convs = conversiones(partesDelFormato);
    const valores = lista.slice(1);
    if (convs.length !== valores.length) {
      throw new ConversionesDistintas('printf', convs.length, valores.length, fila(n));
    }
    const mostrado = [];
    const calculados = valores.map((a) => {
      if (/^&/.test(a.text) && a.type !== 'binary_expression') throw new AmpersandDeMas(a.text, fila(a));
      if (a.type === 'identifier') {
        const variable = variables.get(a.text);
        if (variable && variable.dims) throw new ArregloSinPosicion(a.text, fila(a));
      }
      return { valor: evaluar(a), tipo: tipoDe(a), nodo: a };
    });
    let k = 0;
    for (const p of partesDelFormato) {
      if (p.texto != null) {
        mostrado.push(p.texto);
        // Cada salto de linea cierra un renglon.
        p.texto.split('\n').forEach((parte, idx) => {
          if (idx > 0) {
            lineas.push(renglon);
            renglon = [];
          }
        });
        continue;
      }
      const { valor, tipo, nodo } = calculados[k++];
      const decimal = valor.f;
      const esDecimal = p.formato === '%f' || p.formato === '%lf';
      const esLetra = p.formato === '%c';
      // Una letra se muestra con %c: con %d saldria su numero.
      const letraComoEntero = (p.formato === '%d' || p.formato === '%i') && tipo === 'char';
      if (decimal !== esDecimal || letraComoEntero) {
        throw new FormatoDistinto('printf', p.formato, nodo.text, tipo || (decimal ? 'decimal' : 'int'), fila(nodo));
      }
      mostrados.push(valor.v);
      renglon.push(valor.v);
      if (/[A-Za-z_]\w*\s*\[/.test(nodo.text)) {
        delArreglo.push(valor.v);
        const p = ['subscript_expression', 'field_expression'].includes(nodo.type) ? posicion(nodo) : null;
        origenes.push(p && p.variable ? { nombre: p.nombre, indices: p.indices } : null);
      }
      let texto = esDecimal
        ? valor.v.toFixed(p.decimales ?? 6)
        : esLetra
          ? String.fromCodePoint(Math.trunc(valor.v))
          : String(Math.trunc(valor.v));
      if (texto.length < p.ancho) {
        if (p.relleno.includes('-')) texto = texto.padEnd(p.ancho);
        else texto = texto.padStart(p.ancho, p.relleno.includes('0') ? '0' : ' ');
      }
      mostrado.push(texto);
    }
    const texto = mostrado.join('');
    salida += texto;
    return { v: texto.length, f: false };
  }

  function leerDelTeclado(n, lista) {
    if (entrada === null) sinVerificar(n, 'scanf sin datos para darle');
    const convs = conversiones(partes(textoDe(lista[0]), n));
    const destinos = lista.slice(1);
    if (convs.length !== destinos.length) {
      throw new ConversionesDistintas('scanf', convs.length, destinos.length, fila(n));
    }
    let leidosAhora = 0;
    convs.forEach((conv, k) => {
      const a = destinos[k];
      if (a.type === 'identifier' && variables.get(a.text)?.dims) throw new ArregloSinPosicion(a.text, fila(a));
      // Un parametro declarado con * ya es una direccion: se pasa tal cual.
      const apuntado = a.type === 'identifier' ? variables.get(a.text) : null;
      const esPuntero = Boolean(apuntado && apuntado.puntero);
      if (!esPuntero && (!/^&/.test(a.text) || a.type === 'binary_expression')) {
        throw new AmpersandFalta(a.text, fila(a));
      }
      const destino = esPuntero ? a : a.childForFieldName('argument') || a.namedChildren[a.namedChildren.length - 1];
      if (!esPuntero && destino.type === 'identifier' && variables.get(destino.text)?.dims) {
        throw new ArregloSinPosicion(destino.text, fila(destino));
      }
      const p = esPuntero ? apuntado.destino : posicion(destino);
      if (p.constante != null || !p.variable) sinVerificar(a);
      if (p.variable.dims && p.indices.length !== p.variable.dims.length) sinVerificar(a);
      const tipo = p.variable.tipo;
      // Una letra llega como su numero (el usuario escribe 'T' y entra 84).
      const correcto = tipo === 'int' ? '%d' : tipo === 'char' ? '%c' : tipo === 'float' ? '%f' : '%lf';
      const igual = conv.formato === correcto || (conv.formato === '%i' && tipo === 'int');
      if (!igual) throw new FormatoDistinto('scanf', conv.formato, destino.text, tipo, fila(a));
      if (siguiente >= entrada.length) throw new SinEntrada(fila(n));
      guardar(p, { v: entrada[siguiente++], f: tipo !== 'int' }, a);
      lecturas++;
      leidosAhora++;
    });
    return { v: leidosAhora, f: false };
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
      case 'field_expression':
        return leer(n);
      case 'pointer_expression':
        // *x se lee; &x suelto no se sigue (solo como argumento de una llamada).
        if (/^\*/.test(n.text.trimStart())) return leer(n);
        return sinVerificar(n);
      case 'parenthesized_expression':
        return evaluar(n.namedChildren[0]);
      case 'sizeof_expression': {
        // sizeof(int), sizeof(v), sizeof(v[0]): lo que ocupa, en bytes.
        const tipoNodo = n.childForFieldName('type');
        const valorNodo = n.childForFieldName('value');
        const texto = tipoNodo ? tipoNodo.text.replace(/\s+/g, ' ').trim() : null;
        // "sizeof(v)" a veces se lee como un tipo llamado v.
        const sinPalabra = texto != null ? texto.replace(/^(union|struct)\s+/, '') : null;
        if (texto != null && !variables.has(texto) && !estructurasVivas.has(texto) && !definiciones.has(sinPalabra)) {
          if (/^(char|short|int|long|long long|unsigned|unsigned int|float|double)$/.test(texto)) {
            return { v: bytesDe(texto), f: false };
          }
          return sinVerificar(n);
        }
        return { v: bytesDeNodo(valorNodo || tipoNodo, n), f: false };
      }
      case 'cast_expression': {
        // (float) suma: lo que cambia es si la cuenta que sigue es decimal o entera.
        const tipo = n.childForFieldName('type');
        const valor = evaluar(n.childForFieldName('value'));
        const texto = tipo ? tipo.text.replace(/\s+/g, ' ').trim() : '';
        if (esTipoEnum(tipo)) return { v: Math.trunc(valor.v), f: false };
        if (/^(float|double)$/.test(texto)) return { v: valor.v, f: true };
        if (/^(int|long|short|long long|unsigned|unsigned int)$/.test(texto)) {
          return { v: Math.trunc(valor.v), f: false };
        }
        return sinVerificar(n);
      }
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
        for (const lado of ['left', 'right']) {
          const hijo = n.childForFieldName(lado);
          if (hijo && hijo.type === 'string_literal') throw new TextoComoLetra(hijo.text, fila(hijo));
        }
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
      case 'call_expression': {
        // pow (una funcion pura, que da un decimal), printf y scanf.
        const funcion = n.childForFieldName('function');
        const argumentos = n.childForFieldName('arguments');
        const lista = argumentos ? argumentos.namedChildren.filter((a) => a.type !== 'comment') : [];
        if (funcion && funcion.text === 'printf' && lista.length >= 1) return imprimir(n, lista);
        if (funcion && funcion.text === 'scanf' && lista.length >= 2) return leerDelTeclado(n, lista);
        if (funcion && funcion.type === 'identifier' && definidas.has(funcion.text)) {
          return llamarFuncion(definidas.get(funcion.text), lista, n);
        }
        if (!funcion || funcion.text !== 'pow' || lista.length !== 2) return sinVerificar(n);
        const base = evaluar(lista[0]);
        const exponente = evaluar(lista[1]);
        const v = Math.pow(base.v, exponente.v);
        if (!Number.isFinite(v)) return sinVerificar(n, 'una potencia que no se sabe calcular');
        return { v, f: true };
      }
      case 'assignment_expression': {
        const izquierda = n.childForFieldName('left');
        const operador = n.childForFieldName('operator').text;
        const nodoDerecha = n.childForFieldName('right');
        if (
          desde != null &&
          n.startIndex < desde &&
          operador === '=' &&
          (izquierda.type === 'identifier' || izquierda.type === 'field_expression') &&
          prueba &&
          typeof prueba[izquierda.text] === 'number'
        ) {
          return leer(izquierda);
        }
        // Una union con valor de prueba en un miembro: lo que el codigo dado guarda en
        // otro de sus miembros no se hace, porque pisaria al de la prueba.
        if (
          desde != null &&
          n.startIndex < desde &&
          operador === '=' &&
          izquierda.type === 'field_expression' &&
          prueba
        ) {
          const clave = izquierda.text.replace(/\s+|\[[^\]]*\]/g, '');
          const grupo = clave.slice(0, clave.lastIndexOf('.') + 1);
          const miembro = clave.slice(grupo.length);
          const base = variables.get(clave);
          const hermanos = base && base.union ? base.union.miembros.filter((m) => m !== miembro) : [];
          if (hermanos.some((m) => prueba[`${grupo}${m}`] != null)) return { v: 0, f: false };
        }
        if (nodoDerecha.type === 'string_literal' && ['subscript_expression', 'field_expression'].includes(izquierda.type)) {
          throw new TextoComoLetra(nodoDerecha.text, fila(nodoDerecha));
        }
        let derecha;
        try {
          derecha = evaluar(nodoDerecha);
        } catch (e) {
          // Copiar una estructura entera en otra es valido: solo no se sigue.
          const esCopia = ['field_expression', 'identifier'].includes(nodoDerecha.type);
          if (e instanceof EstructuraEntera && operador === '=' && esCopia) {
            sinVerificar(n, 'la copia de una estructura');
          }
          throw e;
        }
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
    // Una tabla con menos llaves ({0}): los valores la llenan en orden, fila por
    // fila, y lo que falta queda en cero.
    if (resto.length && elementos.length && elementos.every((e) => e.type !== 'initializer_list')) {
      const valores = elementos.map((e) => (flotante ? evaluar(e).v : Math.trunc(evaluar(e).v)));
      if (valores.length > dims.reduce((x, y) => x * y, 1)) sinVerificar(lista, 'mas valores que posiciones');
      let p = 0;
      const armar = (d) => {
        const [m, ...r] = d;
        return Array.from({ length: m }, () => (r.length ? armar(r) : (valores[p++] ?? 0)));
      };
      return armar(dims);
    }
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

  // "struct Alumno alumno;", "TAlumno alumnos[MAX];": cada campo numerico pasa
  // a ser una variable (o un arreglo) con el nombre "variable.campo".
  function declararEstructura(n, campos) {
    for (const d of n.namedChildren) {
      if (!['identifier', 'init_declarator', 'array_declarator', 'pointer_declarator'].includes(d.type)) continue;
      if (d.type === 'init_declarator') sinVerificar(d, 'una estructura con valores iniciales');
      const dims = [];
      let nombre = d;
      while (nombre.type === 'array_declarator') {
        const tamano = nombre.childForFieldName('size');
        if (!tamano) sinVerificar(d);
        dims.unshift(evaluar(tamano).v);
        nombre = nombre.childForFieldName('declarator');
      }
      if (nombre.type !== 'identifier') sinVerificar(d, 'un puntero');
      if (dims.some((k) => !Number.isInteger(k) || k < 0)) sinVerificar(d);
      estructurasVivas.set(nombre.text, campos);
      crearCampos(nombre.text, campos, dims, d, 0);
    }
  }

  // Los campos de una variable de estructura, con el nombre que lleva el camino
  // ("alumno.nacimiento.anio"): cada uno numerico es una variable (o un
  // arreglo, si la variable lo es) y cada uno que es otra estructura se sigue por dentro.
  function crearCampos(prefijo, campos, dims, d, nivel) {
    if (nivel > 5) sinVerificar(d, 'estructuras muy anidadas');
    // En una union, escribir un miembro deja sin valor a los otros.
    const enUnion = campos.esUnion ? { grupo: prefijo, miembros: campos.map((c) => c.nombre) } : null;
    for (const campo of campos) {
      const clave = `${prefijo}.${campo.nombre}`;
      const deEnum = !campo.soportado && Boolean(campo.estructura) && tiposEnum.has(campo.estructura);
      if (!campo.soportado && !deEnum) {
        const dentro = campo.estructura ? definiciones.get(campo.estructura) : null;
        if (dentro) crearCampos(clave, dentro, dims, d, nivel + 1);
        continue;
      }
      const textoCampo = deEnum ? 'int' : campo.texto;
      const flotante = /float|double/.test(textoCampo);
      const tipoCampo = /double/.test(textoCampo) ? 'double' : flotante ? 'float' : /char/.test(textoCampo) ? 'char' : 'int';
      const bytes = bytesDe(textoCampo);
      if (!dims.length) {
        const dado = prueba && typeof prueba[clave] === 'number' ? prueba[clave] : undefined;
        variables.set(clave, {
          flotante,
          tipo: tipoCampo,
          bytes,
          valor: dado === undefined ? undefined : flotante ? dado : Math.trunc(dado),
          union: enUnion,
        });
        continue;
      }
      let datos = sinLista(dims);
      if (prueba && Array.isArray(prueba[clave])) {
        const forma = (x) => (Array.isArray(x) ? [x.length, ...forma(x[0])] : []);
        const otraForma = forma(prueba[clave]);
        if (otraForma.length !== dims.length || otraForma.some((k, i) => k !== dims[i])) {
          sinVerificar(d, 'valores de otro tamano');
        }
        // Un null es una posicion sin valor (el miembro de una union que no es el vigente).
        const copia = (x) =>
          Array.isArray(x) ? x.map(copia) : x === null ? undefined : flotante ? x : Math.trunc(x);
        datos = copia(prueba[clave]);
      }
      variables.set(clave, { flotante, tipo: tipoCampo, bytes, dims: [...dims], datos, union: enUnion });
    }
    if (enUnion) anotarPisados(enUnion, dims);
  }

  // Con valores de prueba, en cada posicion de una union solo uno de sus miembros
  // trae valor: ese es el vigente, y los otros quedan "pisados" por el.
  function anotarPisados({ grupo, miembros }, dims) {
    const propios = miembros.map((m) => [m, variables.get(`${grupo}.${m}`)]).filter(([, v]) => v);
    const posiciones = [];
    const recorrer = (nivel, indices) => {
      if (nivel === dims.length) return posiciones.push(indices);
      for (let i = 0; i < dims[nivel]; i++) recorrer(nivel + 1, [...indices, i]);
    };
    recorrer(0, []);
    const valorEn = (v, indices) => {
      if (!v.dims) return v.valor;
      let dato = v.datos;
      for (const i of indices) dato = dato && dato[i];
      return dato;
    };
    for (const indices of posiciones) {
      const con = propios.find(([, v]) => valorEn(v, indices) !== undefined);
      if (!con) continue;
      for (const [m, v] of propios) {
        if (m === con[0] || valorEn(v, indices) !== undefined) continue;
        if (!v.pisado) v.pisado = new Map();
        v.pisado.set(indices.join(','), con[0]);
      }
    }
  }

  function declarar(n) {
    const tipo = n.childForFieldName('type');
    const campos =
      tipo && ['struct_specifier', 'union_specifier', 'type_identifier'].includes(tipo.type)
        ? definiciones.get(tipo.type === 'type_identifier' ? tipo.text : tipo.childForFieldName('name')?.text)
        : null;
    if (campos) return declararEstructura(n, campos);
    const deEnum = esTipoEnum(tipo);
    if (!deEnum && (!tipo || !['primitive_type', 'sized_type_specifier'].includes(tipo.type))) sinVerificar(n, 'un tipo que no se sabe seguir');
    // Un enumerado se sigue como un int.
    const textoTipo = deEnum ? 'int' : tipo.text;
    const flotante = /float|double/.test(textoTipo);
    const nombreDeTipo = /double/.test(textoTipo) ? 'double' : flotante ? 'float' : /char/.test(textoTipo) ? 'char' : 'int';
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
        let valor = inicial ? evaluar(inicial) : null;
        // La prueba tambien puede cambiar el valor con que empieza una variable.
        if (prueba && typeof prueba[nombre.text] === 'number') valor = { v: prueba[nombre.text], f: flotante };
        variables.set(nombre.text, {
          flotante,
          tipo: nombreDeTipo,
          bytes: bytesDe(textoTipo),
          valor: valor ? (flotante ? valor.v : Math.trunc(valor.v)) : undefined,
        });
        continue;
      }
      // "int v[] = {...}": la cantidad sale de la lista
      const sinTamano = dims[0] === null;
      if (dims[0] === null) {
        if (!inicial || inicial.type !== 'initializer_list') sinVerificar(d);
        dims[0] = inicial.namedChildren.filter((h) => h.type !== 'comment').length;
      }
      if (dims.some((k) => !Number.isInteger(k) || k < 0)) sinVerificar(d);
      let datos =
        inicial && inicial.type === 'initializer_list' ? llenar(dims, inicial, flotante) : sinLista(dims);
      if (inicial && inicial.type !== 'initializer_list') sinVerificar(inicial);
      if (prueba && Array.isArray(prueba[nombre.text])) {
        const otros = prueba[nombre.text];
        // Una lista de listas para una tabla: la forma tiene que ser la misma.
        const forma = (x) => (Array.isArray(x) ? [x.length, ...forma(x[0])] : []);
        const otraForma = forma(otros);
        // Sin tamano escrito, la prueba puede traer otra cantidad de valores.
        if (sinTamano) dims[0] = otraForma[0];
        if (otraForma.length !== dims.length || otraForma.some((k, i) => k !== dims[i])) {
          sinVerificar(d, 'valores de otro tamano');
        }
        const copia = (x) => (Array.isArray(x) ? x.map(copia) : flotante ? x : Math.trunc(x));
        datos = copia(otros);
      }
      variables.set(nombre.text, { flotante, tipo: nombreDeTipo, bytes: bytesDe(textoTipo), dims, datos });
    }
  }

  // ---- funciones del programa --------------------------------------------------

  // Los parametros de una funcion tal como se los sigue, o null si alguno no se
  // sabe seguir (una estructura, un puntero a otra cosa):
  //   { nombre, clase: 'valor' | 'referencia' | 'arreglo', flotante, tipo, bytes }
  function parametrosDe(def) {
    if (def.parametros !== undefined) return def.parametros;
    def.parametros = null;
    const lista = def.declarador.childForFieldName('parameters');
    const salidaDe = [];
    for (const p of lista ? lista.namedChildren : []) {
      if (p.type !== 'parameter_declaration') continue;
      const tipoNodo = p.childForFieldName('type');
      const dec = p.childForFieldName('declarator');
      const textoTipo = tipoNodo ? tipoNodo.text.replace(/\s+/g, ' ').trim() : '';
      if (!dec) {
        if (textoTipo === 'void') continue;
        return null;
      }
      let nombre = dec;
      let puntero = false;
      let arreglo = false;
      while (nombre && nombre.type !== 'identifier') {
        if (nombre.type === 'pointer_declarator') puntero = true;
        else if (nombre.type === 'array_declarator') arreglo = true;
        else return null;
        nombre = nombre.childForFieldName('declarator');
      }
      const deEnum = esTipoEnum(tipoNodo);
      if (!nombre || (!deEnum && !['primitive_type', 'sized_type_specifier'].includes(tipoNodo.type))) return null;
      const textoBase = deEnum ? 'int' : textoTipo;
      const flotante = /float|double/.test(textoBase);
      salidaDe.push({
        nombre: nombre.text,
        clase: arreglo ? 'arreglo' : puntero ? 'referencia' : 'valor',
        flotante,
        tipo: /double/.test(textoBase) ? 'double' : flotante ? 'float' : /char/.test(textoBase) ? 'char' : 'int',
        bytes: bytesDe(textoBase),
      });
    }
    def.parametros = salidaDe;
    return salidaDe;
  }

  // Una llamada a una funcion del programa. Los argumentos se resuelven en el
  // ambito de quien llama; el cuerpo corre en uno nuevo, con los parametros:
  // por valor una copia, con * la variable que llego con &, y un arreglo es el
  // mismo arreglo.
  function llamarFuncion(def, lista, n) {
    const parametros = parametrosDe(def);
    const tipoNodo = def.nodo.childForFieldName('type');
    const textoRetorno = tipoNodo ? tipoNodo.text.replace(/\s+/g, ' ').trim() : '';
    const conPuntero = def.nodo.childForFieldName('declarator').type === 'pointer_declarator';
    if (parametros === null || conPuntero) sinVerificar(n, `la funcion ${def.nombre}`);
    if (lista.length !== parametros.length) {
      throw new ArgumentosDistintos(def.nombre, parametros.length, lista.length, fila(n));
    }
    if (profundidad >= 100) throw new NoTermina(fila(n));

    const local = new Ambito(globales);
    parametros.forEach((p, k) => {
      const a = lista[k];
      const texto = a.text.replace(/\s+/g, ' ').trim();
      const conAmpersand = a.type === 'pointer_expression' && /^&/.test(a.text.trimStart());
      const deArreglo = a.type === 'identifier' ? variables.get(a.text) : null;
      if (p.clase === 'arreglo') {
        if (!deArreglo || !deArreglo.dims) sinVerificar(a, `un argumento que no es un arreglo para ${p.nombre}`);
        local.set(p.nombre, deArreglo);
        return;
      }
      if (p.clase === 'referencia') {
        if (deArreglo && (deArreglo.dims || deArreglo.puntero)) {
          local.set(p.nombre, deArreglo);
          return;
        }
        if (!conAmpersand) throw new LlamadaSinAmpersand(def.nombre, p.nombre, texto, fila(a));
        const objetivo = a.childForFieldName('argument') || a.namedChildren[a.namedChildren.length - 1];
        const destino = posicion(objetivo);
        if (destino.constante != null || !destino.variable) sinVerificar(a);
        if (destino.variable.dims && destino.indices.length !== destino.variable.dims.length) sinVerificar(a);
        local.set(p.nombre, { puntero: true, destino, flotante: p.flotante, tipo: p.tipo, bytes: p.bytes });
        return;
      }
      if (conAmpersand) throw new LlamadaConAmpersand(def.nombre, p.nombre, texto, fila(a));
      if (deArreglo && deArreglo.dims) throw new ArregloSinPosicion(a.text, fila(a));
      const valor = evaluar(a);
      local.set(p.nombre, {
        flotante: p.flotante,
        tipo: p.tipo,
        bytes: p.bytes,
        valor: p.flotante ? valor.v : Math.trunc(valor.v),
      });
    });

    const anteriores = { variables, estructurasVivas, retorno };
    variables = local;
    estructurasVivas = new Ambito(globalesDeEstructuras);
    retorno = null;
    profundidad++;
    let devuelto = null;
    try {
      bloque(def.nodo.childForFieldName('body'));
      devuelto = retorno;
    } finally {
      ({ variables, estructurasVivas, retorno } = anteriores);
      profundidad--;
    }

    // El valor solo importa si se lo usa (f(); lo descarta).
    const usado = !n.parent || n.parent.type !== 'expression_statement';
    if (textoRetorno === 'void') {
      if (usado) throw new VoidComoValor(def.nombre, fila(n));
      return { v: 0, f: false };
    }
    if (!devuelto) {
      if (usado) throw new SinRetorno(def.nombre, fila(n));
      return { v: 0, f: false };
    }
    const flotante = /float|double/.test(textoRetorno);
    return { v: flotante ? devuelto.v : Math.trunc(devuelto.v), f: flotante };
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
      case 'compound_statement': {
        // Lo que se declara entre llaves vive hasta la llave que cierra.
        const afuera = variables;
        variables = new Ambito(afuera);
        try {
          return bloque(n);
        } finally {
          variables = afuera;
        }
      }
      case 'break_statement':
        return 'break';
      case 'continue_statement':
        return 'continue';
      case 'return_statement': {
        const valor = n.namedChildren.find((h) => h.type !== 'comment');
        retorno = valor ? evaluar(valor) : null;
        return 'return';
      }
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
        // Lo declarado en el encabezado del for vive solo mientras dura el ciclo.
        const afuera = variables;
        variables = new Ambito(afuera);
        try {
          if (inicio) (inicio.type === 'declaration' ? declarar : evaluar)(inicio);
          while (!prueba || condicion(prueba)) {
            contar(n);
            const salida = sentencia(n.childForFieldName('body'));
            if (salida === 'break') break;
            if (salida === 'return') return 'return';
            if (avance) evaluar(avance);
          }
          return null;
        } finally {
          variables = afuera;
        }
      }
      case 'switch_statement': {
        // Se busca el "case" con ese valor (o el default) y se sigue desde ahi,
        // pasando de uno al otro hasta un break.
        const valor = evaluar(n.childForFieldName('condition')).v;
        const cuerpo = n.childForFieldName('body');
        const casos = cuerpo ? cuerpo.namedChildren.filter((c) => c.type === 'case_statement') : [];
        let desde = casos.findIndex((c) => {
          const v = c.childForFieldName('value');
          return v && evaluar(v).v === valor;
        });
        if (desde < 0) desde = casos.findIndex((c) => !c.childForFieldName('value'));
        if (desde < 0) return null;
        for (const c of casos.slice(desde)) {
          const v = c.childForFieldName('value');
          for (const hijo of c.namedChildren) {
            if (hijo.id === v?.id) continue;
            const salida = sentencia(hijo);
            if (salida === 'break') return null;
            if (salida) return salida;
          }
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

  // Las variables que se declaran fuera de toda funcion, y despues la funcion
  // por la que se empieza. Un prototipo no es una variable, y lo que no se sabe
  // seguir se deja de lado.
  const contiene = (nodo, tipo) => nodo.type === tipo || nodo.namedChildren.some((h) => contiene(h, tipo));
  const delArchivo = variables;
  const delArchivoEstructuras = estructurasVivas;
  variables = globales;
  estructurasVivas = globalesDeEstructuras;
  for (const n of arbol.rootNode.namedChildren) {
    if (n.type !== 'declaration' || contiene(n, 'function_declarator')) continue;
    try {
      declarar(n);
    } catch (e) {
      if (!(e instanceof SinVerificar)) throw e;
    }
  }
  variables = delArchivo;
  estructurasVivas = delArchivoEstructuras;

  bloque(cuerpo);
  if (renglon.length) lineas.push(renglon);
  // Para quien mira el resultado, las globales y las de la funcion de entrada, juntas.
  const finales = new Map([...globales, ...variables]);
  return { variables: finales, escrituras, mostrados, delArreglo, origenes, lineas, salida, lecturas, leidos, visitas, lecturasPorPosicion };
}
