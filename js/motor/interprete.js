// El intérprete del motor de memoria: recorre el arbol de un programa en C
// (tree-sitter) y lo ejecuta sobre una memoria con direcciones, montículo y
// marcos de funcion (ver memoria.js).
//
//   const r = ejecutar(analizador, fuente, { entrada, traza, funcion, maxPasos });
//   r.salida   lo que el programa mostro
//   r.error    null, o { codigo, mensaje, fila, datos } (ver errores.js)
//   r.retorno  lo que devolvio main
//   r.fugas    los bloques que quedaron sin liberar
//   r.traza    una fotografia por paso, si se pidio (ver traza.js)
//
// El programa nunca se ejecuta de verdad: se interpreta, asi que un error del
// alumno (un puntero NULL, un bloque liberado) se informa en lugar de colgar nada.

import { ErrorDelMotor, Salida } from './errores.js';
import {
  VOID, CHAR, INT, LONG, FLOAT, DOUBLE, puntero, arreglo, nuevaEstructura, tipoDePalabras, tamano, textoDeTipo,
} from './tipos.js';
import {
  Memoria, almacen, ceros, copiar, punteroA, punteroEnArreglo, mismoDestino, direccionDe,
} from './memoria.js';
import { formatear, Entrada, piezasDeScanf } from './biblioteca.js';
import { deLaReserva, fotografia, rutaDe, serializarPuntero } from './traza.js';

const TAMANO_T = { k: 'int', nombre: 'unsigned long', bytes: 8, sinSigno: true };
const MAX_PASOS = 200000;
const MAX_MARCOS = 200;
const MAX_TRAZA = 5000;
const MAX_SALIDA = 1000000;

// Un valor escrito para una tabla o un cartel: un numero tal cual, NULL, o (un puntero a algo) "una dirección".
function textoEscalar(rv) {
  if (!rv || !rv.t) return null;
  // El valor de un enumerado se escribe con su nombre (si tiene).
  if (rv.t.enumerados && typeof rv.v === 'number' && rv.t.enumerados.has(rv.v)) return rv.t.enumerados.get(rv.v);
  // Una letra se escribe como letra ('a'); el 0 del final de una cadena, '\0'.
  if (rv.t.esChar && typeof rv.v === 'number') {
    if (rv.v === 0) return "'\\0'";
    if (rv.v === 10) return "'\\n'";
    if (rv.v > 31 && rv.v < 127 && rv.v !== 39 && rv.v !== 92) return `'${String.fromCharCode(rv.v)}'`;
  }
  if ((rv.t.k === 'int' || rv.t.k === 'float') && typeof rv.v === 'number') return rv.v < 0 ? `(${rv.v})` : String(rv.v);
  if (rv.t.k === 'ptr') return rv.v === null ? 'NULL' : null;
  return null;
}
function textoDeValor(rv) {
  if (rv && rv.t && rv.t.k === 'ptr' && rv.v !== null) return 'una dirección';
  const t = textoEscalar(rv);
  return t === null ? '' : t.replace(/^\((-?\d+(?:\.\d+)?)\)$/, '$1');
}

// Las sentencias en las que puede estar una llamada (ver sentenciaDe).
const SENTENCIAS = new Set(['declaration', 'expression_statement', 'return_statement', 'if_statement', 'while_statement', 'do_statement', 'for_statement', 'switch_statement']);

class Retorno {
  constructor(valor) {
    this.valor = valor;
  }
}
const ROMPER = { control: 'break' };
const CONTINUAR = { control: 'continue' };
const esControl = (e) => e instanceof Retorno || e === ROMPER || e === CONTINUAR;

const ESCAPES = { n: 10, t: 9, r: 13, '0': 0, a: 7, b: 8, f: 12, v: 11, "'": 39, '"': 34, '\\': 92, '?': 63 };

function decodificar(texto) {
  const codigos = [];
  for (let i = 0; i < texto.length; i++) {
    if (texto[i] !== '\\') {
      codigos.push(texto.charCodeAt(i));
      continue;
    }
    i++;
    if (/[0-7]/.test(texto[i])) {
      let octal = texto[i];
      while (octal.length < 3 && /[0-7]/.test(texto[i + 1] || '')) octal += texto[++i];
      codigos.push(parseInt(octal, 8));
    } else if (texto[i] === 'x') {
      let hex = '';
      while (/[0-9a-fA-F]/.test(texto[i + 1] || '')) hex += texto[++i];
      codigos.push(parseInt(hex, 16) & 255);
    } else {
      codigos.push(ESCAPES[texto[i]] ?? texto.charCodeAt(i));
    }
  }
  return codigos;
}

function ajustar(v, t) {
  const n = Math.trunc(v);
  if (t.bytes >= 8) return n;
  if (t.bytes === 4) return t.sinSigno ? n >>> 0 : n | 0;
  if (t.bytes === 2) return t.sinSigno ? n & 0xffff : (n << 16) >> 16;
  return t.sinSigno ? n & 0xff : (n << 24) >> 24;
}

const promover = (a, b) => {
  const ta = a.bytes < 4 ? INT : a;
  const tb = b.bytes < 4 ? INT : b;
  if (ta.bytes !== tb.bytes) return ta.bytes > tb.bytes ? ta : tb;
  return ta.sinSigno ? ta : tb;
};

// Junta las partes sin cambio que quedaron una al lado de otra y arregla los espacios (los textos de un detalle, ver detalleDeIda).
function juntarPartes(partes) {
  const lista = [];
  for (const p of partes) {
    const q = { ...p, t: p.t.replace(/\s+/g, ' ') };
    const ultima = lista[lista.length - 1];
    if (ultima && !ultima.nuevo && !q.nuevo) ultima.t += q.t;
    else lista.push(q);
  }
  if (lista.length && !lista[0].nuevo) lista[0].t = lista[0].t.replace(/^ /, '');
  if (lista.length && !lista[lista.length - 1].nuevo) lista[lista.length - 1].t = lista[lista.length - 1].t.replace(/ $/, '');
  return lista.filter((p) => p.t !== '' || p.nuevo);
}

class Interprete {
  constructor(analizador, arbol, opciones) {
    this.analizador = analizador;
    this.arbol = arbol;
    this.opciones = opciones;
    this.memoria = new Memoria();
    this.tipos = new Map();
    this.etiquetas = new Map();
    this.constantes = new Map();
    this.macros = new Map();
    this.macrosHechas = new Map();
    this.funciones = new Map();
    this.globalesPorNombre = new Map();
    this.textos = new Map();
    this.marcos = [];
    this.salida = '';
    this.entrada = new Entrada(opciones.entrada);
    this.maxPasos = opciones.maxPasos ?? MAX_PASOS;
    this.pasos = 0;
    this.fila = 1;
    this.enMacro = 0;
    this.traza = [];
    this.accesos = []; // los accesos por puntero desde la ultima fotografia
    this.salidas = []; // las variables que salieron de su ambito desde la ultima fotografia, con el ultimo valor que tuvieron
    this.escrituras = []; // las casillas donde se guardo un valor que no sale de otra casilla (un literal, una cuenta), idem
    this.llamadasDe = new Map(); // cuantas veces se llamo a cada funcion (para saber si un return llamo a la suya)
    this.registroLlamadas = []; // las llamadas de las funciones recursivas, para el trazado (ver abrirRegistro)
    this.seguidas = new Map(); // expresion algebraica que rodea una llamada de mas arriba -> su registro (ver anotarLlamador)
    this.enCondicion = 0; // cuantas condiciones se estan evaluando (una dentro de otra: a && b)
    this.condicionHecha = null; // la ultima condicion que se evaluo, para la proxima fotografia
    this.fotoDePaso = null; // la fotografia con que empezo la ultima sentencia (la pregunta de una condicion se le suma)
    this.muestraHecha = null; // las casillas de los valores que acaba de mostrar un printf, para la proxima fotografia
    this.lecturaHecha = null; // lo que acaba de leer un scanf (el trozo de la entrada y las casillas), para la proxima fotografia
    this.error = null;
    this.retorno = null;
    this.finales = new Map(); // las variables de main, con lo que valian cuando termino: nombre -> reserva
  }

  // ---------------------------------------------------------------- carga

  correr() {
    try {
      this.cargar(this.arbol.rootNode);
      const f = this.funciones.get(this.opciones.funcion || 'main');
      if (!f) throw new ErrorDelMotor('NO_HAY_MAIN', null, null);
      const r = this.ejecutarFuncion(f, []);
      this.retorno = r && r.t.k !== 'void' ? r.v : 0;
      if (this.opciones.traza) this.instantanea(null);
    } catch (e) {
      if (e instanceof Salida) {
        this.retorno = e.codigo;
        if (this.opciones.traza) this.instantanea(null);
      } else if (e instanceof ErrorDelMotor) {
        this.error = { codigo: e.codigo, mensaje: e.message, fila: e.fila ?? this.fila, datos: e.datos };
        if (this.opciones.traza) this.instantanea(this.error.fila, this.error.codigo);
      } else {
        this.error = { codigo: 'INTERNO', mensaje: String(e && e.message), fila: this.fila, datos: { pila: e && e.stack } };
      }
    }
  }

  resultado() {
    return {
      salida: this.salida,
      error: this.error,
      retorno: this.retorno,
      fugas: this.error ? [] : this.memoria.fugas().map((r) => ({ id: r.id, dir: r.dir, tam: r.tam })),
      finales: this.finales,
      traza: this.traza,
      llamadas: this.registroLlamadas,
      entrada: this.entrada.texto,
      pasos: this.pasos,
      funciones: [...this.funciones.values()].map((f) => ({ nombre: f.nombre, desde: f.desde, hasta: f.hasta })),
    };
  }

  instantanea(linea, error = null, pregunta = null) {
    if (this.traza.length >= MAX_TRAZA) {
      this.accesos = [];
      this.escrituras = [];
      this.salidas = [];
      this.condicionHecha = null;
      this.muestraHecha = null;
      this.lecturaHecha = null;
      return;
    }
    const foto = fotografia(this, linea);
    if (this.accesos.length) foto.accesos = this.accesos;
    this.accesos = [];
    if (this.escrituras.length) foto.escrituras = this.escrituras;
    this.escrituras = [];
    // Lo ultimo que valian las variables que salieron de su ambito (la figura lo muestra antes de que se vayan).
    if (this.salidas.length) foto.salieron = this.salidas;
    this.salidas = [];
    if (this.condicionHecha) foto.condicion = this.condicionHecha;
    this.condicionHecha = null;
    if (pregunta) foto.pregunta = pregunta;
    if (this.muestraHecha) foto.muestra = this.muestraHecha;
    this.muestraHecha = null;
    if (this.lecturaHecha) foto.lectura = this.lecturaHecha;
    this.lecturaHecha = null;
    if (error) foto.error = error;
    this.traza.push(foto);
  }

  cargar(raiz) {
    for (const n of raiz.namedChildren) {
      this.fila = n.startPosition.row + 1;
      switch (n.type) {
        case 'preproc_def': {
          const nombre = n.childForFieldName('name').text;
          const valor = n.childForFieldName('value');
          this.macros.set(nombre, valor ? valor.text.trim() : '1');
          break;
        }
        case 'type_definition':
          this.definirTipo(n);
          break;
        case 'declaration':
          this.declarar(n, true);
          break;
        case 'function_definition':
          this.registrarFuncion(n);
          break;
        case 'struct_specifier':
        case 'union_specifier':
        case 'enum_specifier':
          this.tipoDeEspecificador(n);
          break;
        default:
          break; // include, comentarios y demas
      }
    }
  }

  definirTipo(n) {
    const nodoTipo = n.childForFieldName('type');
    const base = this.tipoDeEspecificador(nodoTipo);
    for (const d of n.namedChildren) {
      if (d.id === nodoTipo.id) continue;
      if (!['type_identifier', 'pointer_declarator', 'array_declarator', 'parenthesized_declarator', 'function_declarator'].includes(d.type)) continue;
      const r = this.aplicar(d, base);
      if (r.funcion) continue;
      if (r.tipo.k === 'struct' && !r.tipo.alias) r.tipo.alias = r.nombre;
      this.tipos.set(r.nombre, r.tipo);
    }
  }

  registrarFuncion(n) {
    let d = n.childForFieldName('declarator');
    let tipoRetorno = this.tipoDeEspecificador(n.childForFieldName('type'));
    while (d && d.type === 'pointer_declarator') {
      tipoRetorno = puntero(tipoRetorno);
      d = d.childForFieldName('declarator');
    }
    if (!d || d.type !== 'function_declarator') return;
    const nombre = d.childForFieldName('declarator').text;
    const params = [];
    const lista = d.childForFieldName('parameters');
    for (const p of lista ? lista.namedChildren : []) {
      if (p.type !== 'parameter_declaration') continue;
      const base = this.tipoDeEspecificador(p.childForFieldName('type'));
      const dec = p.childForFieldName('declarator');
      if (!dec) {
        if (base.k !== 'void') params.push({ nombre: null, tipo: base });
        continue;
      }
      const r = this.aplicar(dec, base);
      params.push({ nombre: r.nombre, tipo: r.tipo.k === 'arr' ? puntero(r.tipo.de) : r.tipo });
    }
    const cuerpo = n.childForFieldName('body');
    this.funciones.set(nombre, {
      nombre,
      tipoRetorno,
      params,
      cuerpo,
      desde: n.startPosition.row + 1,
      hasta: n.endPosition.row + 1,
      declaraciones: this.declaracionesDe(cuerpo),
    });
  }

  // Las variables que una funcion declara directamente en su cuerpo (no en un bloque
  // de adentro), en el orden en que aparecen: la traza las muestra desde el comienzo,
  // sin valor, hasta que se ejecuta su declaracion. [{ nombre, tipo, id }]
  declaracionesDe(cuerpo) {
    const lista = [];
    for (const n of cuerpo ? cuerpo.namedChildren : []) {
      if (n.type !== 'declaration') continue;
      let base;
      try {
        base = this.tipoDeEspecificador(n.childForFieldName('type'));
      } catch (e) {
        continue;
      }
      for (const d of n.namedChildren) {
        if (!['identifier', 'init_declarator', 'pointer_declarator', 'array_declarator', 'parenthesized_declarator'].includes(d.type)) continue;
        try {
          const r = this.aplicar(d.type === 'init_declarator' ? d.childForFieldName('declarator') : d, base);
          if (!r.funcion && r.nombre) lista.push({ nombre: r.nombre, tipo: r.tipo, id: d.startIndex });
        } catch (e) {
          // un tamano que todavia no se puede calcular: se muestra cuando se declare
        }
      }
    }
    return lista;
  }

  // ---------------------------------------------------------------- tipos

  tipoDeEspecificador(n) {
    switch (n.type) {
      case 'primitive_type':
      case 'sized_type_specifier':
        return tipoDePalabras(n.text);
      case 'type_identifier': {
        const t = this.tipos.get(n.text);
        if (t) return t;
        if (n.text === 'bool') return INT;
        if (n.text === 'size_t') return TAMANO_T;
        throw new ErrorDelMotor('NOMBRE_DESCONOCIDO', `${n.text} no es un tipo`, n.startPosition.row + 1, { nombre: n.text });
      }
      case 'struct_specifier':
      case 'union_specifier': {
        const esUnion = n.type === 'union_specifier';
        const nombre = n.childForFieldName('name');
        const cuerpo = n.childForFieldName('body');
        const clave = nombre ? `${esUnion ? 'union' : 'struct'} ${nombre.text}` : null;
        let t = clave ? this.etiquetas.get(clave) : null;
        if (!t) {
          t = nuevaEstructura(nombre ? nombre.text : null, esUnion);
          if (clave) this.etiquetas.set(clave, t);
        }
        if (cuerpo) {
          t.campos = [];
          for (const f of cuerpo.namedChildren) {
            if (f.type !== 'field_declaration') continue;
            const base = this.tipoDeEspecificador(f.childForFieldName('type'));
            for (const d of f.namedChildren) {
              if (!['field_identifier', 'pointer_declarator', 'array_declarator', 'parenthesized_declarator'].includes(d.type)) continue;
              const r = this.aplicar(d, base);
              t.campos.push({ nombre: r.nombre, tipo: r.tipo });
            }
          }
          t._tam = null;
          t._offs = null;
        }
        return t;
      }
      case 'enum_specifier': {
        // Un enumerado es un int que recuerda como se llama cada valor (el primer nombre, si dos valen lo mismo): asi la traza
        // puede escribir FALSO y no 0. Sin cuerpo (enum Color c;), es el que se declaro antes con esa etiqueta.
        const nombre = n.childForFieldName('name');
        const cuerpo = n.childForFieldName('body');
        const clave = nombre ? 'enum ' + nombre.text : null;
        if (!cuerpo) return (clave && this.etiquetas.get(clave)) || INT;
        const enumerados = new Map();
        let valor = 0;
        for (const e of cuerpo.namedChildren) {
          if (e.type !== 'enumerator') continue;
          const v = e.childForFieldName('value');
          if (v) valor = this.constante(v);
          const nom = e.childForFieldName('name').text;
          this.constantes.set(nom, valor);
          if (!enumerados.has(valor)) enumerados.set(valor, nom);
          valor++;
        }
        const t = { ...INT, enumerados };
        if (clave) this.etiquetas.set(clave, t);
        return t;
      }
      default:
        throw new ErrorDelMotor('SIN_VERIFICAR', `el tipo ${n.type}`, n.startPosition.row + 1);
    }
  }

  tipoDeDescriptor(td) {
    let t = this.tipoDeEspecificador(td.childForFieldName('type'));
    const asteriscos = (td.text.match(/\*/g) || []).length;
    for (let i = 0; i < asteriscos; i++) t = puntero(t);
    return t;
  }

  // Aplica un declarador (int *p, v[5], (*f)) a un tipo base: { nombre, tipo }.
  aplicar(d, tipo) {
    switch (d.type) {
      case 'identifier':
      case 'field_identifier':
      case 'type_identifier':
        return { nombre: d.text, tipo };
      case 'pointer_declarator':
        return this.aplicar(d.childForFieldName('declarator'), puntero(tipo));
      case 'array_declarator': {
        const s = d.childForFieldName('size');
        return this.aplicar(d.childForFieldName('declarator'), arreglo(tipo, s ? this.constante(s) : null));
      }
      case 'parenthesized_declarator':
        return this.aplicar(d.namedChildren[0], tipo);
      case 'function_declarator':
        return { nombre: null, tipo, funcion: d };
      default:
        throw new ErrorDelMotor('SIN_VERIFICAR', `el declarador ${d.type}`, d.startPosition.row + 1);
    }
  }

  constante(n) {
    return this.evaluar(n).v;
  }

  // El tipo de una expresion, sin evaluarla (para sizeof).
  tipoDe(n) {
    switch (n.type) {
      case 'parenthesized_expression':
        return this.tipoDe(n.namedChildren[0]);
      case 'identifier': {
        const v = this.buscar(n.text);
        if (v) return v.tipo;
        // sizeof(TNodo): el analizador lee un tipo con nombre como si fuera una expresion.
        if (this.tipos.has(n.text)) return this.tipos.get(n.text);
        return this.evaluar(n).t;
      }
      case 'pointer_expression': {
        const arg = n.childForFieldName('argument');
        const t = this.tipoDe(arg);
        if (n.children[0].text === '&') return puntero(t);
        return t.k === 'ptr' ? t.a : t.de;
      }
      case 'subscript_expression': {
        const t = this.tipoDe(n.childForFieldName('argument'));
        return t.k === 'ptr' ? t.a : t.de;
      }
      case 'field_expression': {
        let t = this.tipoDe(n.childForFieldName('argument'));
        if (n.children.some((h) => h.type === '->')) t = t.a;
        const campo = (t.campos || []).find((c) => c.nombre === n.childForFieldName('field').text);
        if (!campo) throw new ErrorDelMotor('CAMPO_DESCONOCIDO', null, n.startPosition.row + 1, { campo: n.childForFieldName('field').text });
        return campo.tipo;
      }
      case 'cast_expression':
        return this.tipoDeDescriptor(n.childForFieldName('type'));
      case 'call_expression': {
        const f = this.funciones.get(n.childForFieldName('function').text);
        if (f) return f.tipoRetorno;
        return this.evaluar(n).t;
      }
      default:
        return this.evaluar(n).t;
    }
  }

  // ------------------------------------------------------------ variables

  abrirAmbito() {
    const a = new Map();
    a.marca = this.memoria.marcaDePila();
    this.marcos[this.marcos.length - 1].ambitos.push(a);
  }

  cerrarAmbito() {
    const a = this.marcos[this.marcos.length - 1].ambitos.pop();
    if (this.marcos.length === 1) for (const v of a.values()) this.finales.set(v.reserva.nombre, v.reserva);
    if (this.opciones.traza) for (const v of a.values()) this.salidas.push(deLaReserva(v.reserva));
    for (const v of a.values()) this.memoria.matar(v.reserva, 'marco');
    this.memoria.soltarPila(a.marca);
  }

  buscar(nombre) {
    const marco = this.marcos[this.marcos.length - 1];
    if (marco) {
      for (let i = marco.ambitos.length - 1; i >= 0; i--) {
        if (marco.ambitos[i].has(nombre)) return marco.ambitos[i].get(nombre);
      }
    }
    return this.globalesPorNombre.get(nombre);
  }

  nuevaLocal(nombre, tipo) {
    const reserva = this.memoria.variable('pila', nombre, tipo);
    const marco = this.marcos[this.marcos.length - 1];
    marco.ambitos[marco.ambitos.length - 1].set(nombre, { reserva, tipo });
    return reserva;
  }

  declarar(n, global) {
    const base = this.tipoDeEspecificador(n.childForFieldName('type'));
    for (const d of n.namedChildren) {
      if (!['identifier', 'init_declarator', 'pointer_declarator', 'array_declarator', 'function_declarator', 'parenthesized_declarator'].includes(d.type)) continue;
      let dec = d;
      let init = null;
      if (d.type === 'init_declarator') {
        dec = d.childForFieldName('declarator');
        init = d.childForFieldName('value');
      }
      const r = this.aplicar(dec, base);
      if (r.funcion) continue; // un prototipo
      let tipo = r.tipo;
      if (tipo.k === 'arr' && tipo.n === null) {
        if (!init) throw new ErrorDelMotor('SIN_VERIFICAR', `el arreglo ${r.nombre} sin tamano`, n.startPosition.row + 1);
        const cantidad =
          init.type === 'initializer_list'
            ? init.namedChildren.filter((h) => h.type !== 'comment').length
            : this.textoLiteral(init).length + 1;
        tipo = arreglo(tipo.de, cantidad);
      }
      let reserva;
      if (global) {
        reserva = this.memoria.variable('global', r.nombre, tipo);
        this.globalesPorNombre.set(r.nombre, { reserva, tipo });
      } else {
        reserva = this.nuevaLocal(r.nombre, tipo);
        reserva.declId = d.startIndex;
      }
      if (init) this.inicializar(reserva.raiz, init, reserva);
    }
  }

  textoLiteral(n) {
    if (n.type === 'string_literal') return decodificar(n.text.slice(1, -1));
    if (n.type === 'concatenated_string') return n.namedChildren.flatMap((h) => this.textoLiteral(h));
    throw new ErrorDelMotor('SIN_VERIFICAR', 'un arreglo de letras que no se inicializa con un texto', n.startPosition.row + 1);
  }

  inicializar(st, init, reserva = null) {
    const tipo = st.t;
    if (init.type === 'initializer_list') {
      ceros(st);
      const items = init.namedChildren.filter((h) => h.type !== 'comment');
      if (items.some((h) => h.type === 'initializer_pair')) {
        throw new ErrorDelMotor('SIN_VERIFICAR', 'una lista con indices o campos nombrados', init.startPosition.row + 1);
      }
      const destinos = st.elems ? st.elems : st.campos ? [...st.campos.values()] : [st];
      if (items.length > destinos.length) throw new ErrorDelMotor('SIN_VERIFICAR', 'mas valores que lugares en la lista', init.startPosition.row + 1);
      items.forEach((h, i) => this.inicializar(destinos[i], h));
      return;
    }
    if (tipo.k === 'arr' && tipo.de.esChar && (init.type === 'string_literal' || init.type === 'concatenated_string')) {
      const codigos = this.textoLiteral(init);
      if (codigos.length + 1 > tipo.n && codigos.length > tipo.n) {
        throw new ErrorDelMotor('FUERA_DE_RANGO', 'el texto no entra en el arreglo', init.startPosition.row + 1, { largo: tipo.n });
      }
      st.elems.forEach((e, i) => (e.v = i < codigos.length ? codigos[i] : 0));
      return;
    }
    if (tipo.k === 'ptr' || reserva) {
      const { rv, origen, celda, devuelto } = this.evaluarConOrigen(init, true);
      this.asignarAlmacen(st, rv);
      if (devuelto) this.copiaDevuelta(st, reserva ? this.ubicar(reserva, st) : null);
      else this.registrarCopia(st, origen, celda, reserva ? this.ubicar(reserva, st) : null);
      if (!celda && !devuelto) this.escritura(reserva, st);
      return;
    }
    this.asignarAlmacen(st, this.evaluar(init));
  }

  asignarAlmacen(st, rv) {
    this.usable(rv);
    if (st.t.k === 'struct') {
      if (rv.t.k !== 'struct') throw new ErrorDelMotor('ASIGNACION_INVALIDA', 'se asigna algo que no es una estructura a una estructura');
      copiar(st, rv.v);
    } else if (st.t.k === 'arr') {
      throw new ErrorDelMotor('ASIGNACION_INVALIDA', 'un arreglo no se puede asignar');
    } else {
      st.v = this.convertir(rv, st.t).v;
    }
  }

  usable(rv) {
    if (rv.t.k === 'void') throw new ErrorDelMotor('SIN_RETORNO', 'se usa el valor de una funcion que no devuelve nada');
  }

  // ------------------------------------------------------------ valores

  // "explicita": viene de una conversion escrita por el programa, (int *) 8, que en C si se permite: eso el motor no lo sigue.
  convertir(rv, destino, explicita = false) {
    this.usable(rv);
    // Sin conversion explicita, un numero en un puntero (salvo el 0, que es NULL) o una direccion en un numero es un error de tipos.
    const incompatibles = (haciaPuntero) => {
      if (explicita) throw new ErrorDelMotor('SIN_VERIFICAR', haciaPuntero ? 'un numero guardado en un puntero' : 'una direccion guardada en un numero');
      throw new ErrorDelMotor('TIPOS_INCOMPATIBLES', null, null, { de: textoDeTipo(rv.t), a: textoDeTipo(destino), haciaPuntero });
    };
    switch (destino.k) {
      case 'int':
        if (rv.t.k === 'ptr') incompatibles(false);
        if (rv.t.k === 'struct') throw new ErrorDelMotor('ASIGNACION_INVALIDA', 'una estructura en un numero');
        return { t: destino, v: ajustar(rv.v, destino) };
      case 'float':
        if (rv.t.k === 'ptr') incompatibles(false);
        return { t: destino, v: destino.bytes === 4 ? Math.fround(rv.v) : rv.v };
      case 'ptr': {
        if (rv.t.k === 'int') {
          if (rv.v === 0) return { t: destino, v: null };
          incompatibles(true);
        }
        if (rv.t.k === 'float') incompatibles(true);
        if (rv.t.k !== 'ptr') throw new ErrorDelMotor('SIN_VERIFICAR', 'algo que no es una direccion guardado en un puntero');
        const v = rv.v;
        if (v && v.sinTipo && destino.a.k !== 'void') {
          this.memoria.tiparBloque(v.reserva, destino.a);
          return { t: destino, v: punteroEnArreglo(v.reserva, v.reserva.raiz, 0) };
        }
        return { t: destino, v };
      }
      case 'struct':
        if (rv.t.k !== 'struct') throw new ErrorDelMotor('ASIGNACION_INVALIDA', 'se asigna algo que no es una estructura a una estructura');
        return rv;
      default:
        return rv;
    }
  }

  valorDe(lv, texto) {
    const st = lv.st;
    const t = st.t;
    if (t.k === 'arr') return { t: puntero(t.de), v: punteroEnArreglo(lv.reserva, st, 0) };
    if (t.k === 'struct') return { t, v: st };
    if (st.v === undefined) throw new ErrorDelMotor('VARIABLE_SIN_VALOR', null, null, { texto, puntero: t.k === 'ptr' });
    return { t, v: st.v };
  }

  deref(p) {
    if (p === undefined) throw new ErrorDelMotor('PUNTERO_SIN_INICIALIZAR');
    if (p === null) throw new ErrorDelMotor('DESREFERENCIA_NULA');
    if (p.sinTipo) throw new ErrorDelMotor('SIN_VERIFICAR', 'un bloque al que todavia no se le dio tipo');
    const r = p.reserva;
    if (!r.vivo) throw new ErrorDelMotor(r.muerte === 'liberado' ? 'USO_DE_MEMORIA_LIBERADA' : 'VARIABLE_FUERA_DE_ALCANCE', null, null, { dir: r.dir, nombre: r.nombre });
    if (p.st === undefined) {
      const largo = p.arr ? p.arr.elems.length : 1;
      throw new ErrorDelMotor(r.region === 'monticulo' ? 'FUERA_DE_BLOQUE' : 'FUERA_DE_RANGO', null, null, { indice: p.i, largo });
    }
    return { st: p.st, reserva: r, arr: p.arr, i: p.i };
  }

  // Donde esta una parte de un almacen: { a: id de la variable o del bloque, ruta } (ver traza.js).
  ubicar(reserva, st) {
    const ruta = reserva && reserva.raiz ? rutaDe(reserva.raiz, st) : null;
    return ruta ? { a: reserva.id, ruta } : null;
  }

  // Un acceso por puntero: de la casilla donde esta el puntero ("origen") a lo que alcanza ("destino").
  // Solo se anotan los que parten de un puntero (no los de un arreglo comun) y para la traza.
  acceso(origen, destino) {
    if (!this.opciones.traza || !origen || this.accesos.length >= 8) return;
    const a = this.ubicar(destino.reserva, destino.st);
    if (!a) return;
    // Si ya se habia resaltado esa casilla como una lectura, ahora es el comienzo de la flecha: no se repite.
    const mismo = (x, y) => x.a === y.a && x.ruta.join('/') === y.ruta.join('/');
    const lectura = this.accesos.findIndex((x) => !x.de && mismo(x.a, origen));
    if (lectura >= 0) this.accesos.splice(lectura, 1);
    const ultimo = this.accesos[this.accesos.length - 1];
    if (ultimo && ultimo.de && ultimo.de.a === origen.a && ultimo.a.a === a.a && ultimo.de.ruta.join('/') === origen.ruta.join('/') && ultimo.a.ruta.join('/') === a.ruta.join('/')) return;
    this.accesos.push({ de: origen, a });
  }

  // Se copio un puntero a otro (q = p, q = p->sig): se anota de que casilla salia la flecha y a donde iba.
  copia(origen, p, para) {
    if (!this.opciones.traza || !origen || !p || !p.reserva || this.accesos.length >= 8) return;
    const s = serializarPuntero(p);
    if (s.k !== 'ptr') return;
    this.accesos.push({ de: origen, a: { a: s.a, ruta: s.ruta }, tipo: 'copia', para: para || null });
  }

  // Una funcion devolvio un puntero y se guardo en una casilla: es una copia sin casilla de origen (la de la funcion ya
  // no esta): parpadean el bloque al que apunta y la casilla que lo recibe. Con NULL no hay nada que senalar.
  copiaDevuelta(st, para) {
    if (!this.opciones.traza || !st || st.t.k !== 'ptr' || !st.v || !st.v.reserva || this.accesos.length >= 8) return;
    const s = serializarPuntero(st.v);
    if (s.k !== 'ptr') return;
    this.accesos.push({ de: null, a: { a: s.a, ruta: s.ruta }, tipo: 'copia', para: para || null });
  }

  // Se guardo en esta casilla un valor que no sale de otra casilla (un literal, una cuenta, NULL): la figura puede hacer
  // resplandecer el valor nuevo. Un arreglo o una estructura no tienen un valor que mostrar.
  escritura(reserva, st) {
    if (!this.opciones.traza || !reserva || !st || !st.t || this.escrituras.length >= 8) return;
    if (st.t.k === 'struct' || st.t.k === 'arr') return;
    const c = this.ubicar(reserva, st);
    if (c) this.escrituras.push(c);
  }

  // Se copio el valor de una casilla en otra (a = b, int c = a): se resalta el origen y despues el destino.
  copiaValor(celda, para) {
    if (!this.opciones.traza || !celda || this.accesos.length >= 8) return;
    this.accesos.push({ de: celda, a: celda, tipo: 'valor', para: para || null });
  }

  // Despues de guardar el valor: si venia de otra casilla (una variable, un campo, un elemento, lo que apunta un puntero)
  // se anota la copia: de un puntero a un bloque, con su flecha; de cualquier otra cosa, solo las dos casillas.
  registrarCopia(st, origen, celda, para) {
    if (!celda) return;
    if (st.t.k === 'ptr' && origen && st.v) this.copia(origen, st.v, para);
    else this.copiaValor(celda, para);
  }

  // La lectura de una variable que no sigue ninguna flecha: la de un puntero que se libera, o (en una condicion, "cond")
  // la de cualquier variable que se pregunta (un puntero o un numero). Solo se resalta su casilla.
  lectura(n, cond = false) {
    if (!this.opciones.traza || this.accesos.length >= 8) return;
    while (n.type === 'parenthesized_expression') n = n.namedChildren[0];
    if (n.type !== 'identifier') return;
    const v = this.buscar(n.text);
    const k = v && v.reserva.raiz && v.reserva.raiz.t ? v.reserva.raiz.t.k : null;
    if (k !== 'ptr' && !(cond && (k === 'int' || k === 'float'))) return;
    const a = this.ubicar(v.reserva, v.reserva.raiz);
    if (!a) return;
    if (this.accesos.some((x) => (x.de ? x.de : x.a).a === a.a && (x.de ? x.de : x.a).ruta.join('/') === a.ruta.join('/'))) return;
    this.accesos.push(cond ? { de: null, a, cond: true, ptr: k === 'ptr' } : { de: null, a });
  }

  // Los punteros que se preguntan en una condicion (p == NULL, !p, if (p)); no se entra en las llamadas ni en &x.
  lecturasEnCondicion(n) {
    if (!this.opciones.traza) return;
    switch (n.type) {
      case 'identifier':
        this.lectura(n, true);
        return;
      case 'call_expression':
      case 'sizeof_expression':
        return;
      case 'pointer_expression':
        if (n.children[0].text === '&') return;
        break;
      default:
        break;
    }
    for (const h of n.namedChildren) this.lecturasEnCondicion(h);
  }

  // Las casillas de las variables que usa una expresion (sin entrar en llamadas, sizeof ni &x).
  celdasDeExpresion(n, salida) {
    switch (n.type) {
      case 'identifier': {
        const v = this.buscar(n.text);
        const celda = v && v.reserva.raiz ? this.ubicar(v.reserva, v.reserva.raiz) : null;
        if (celda) salida.push(celda);
        return;
      }
      case 'call_expression':
      case 'sizeof_expression':
      case 'string_literal':
      case 'char_literal':
        return;
      case 'pointer_expression':
        if (n.children[0].text === '&') return;
        break;
      default:
        break;
    }
    for (const h of n.namedChildren) this.celdasDeExpresion(h, salida);
  }

  // Evalua una expresion y, si es una casilla que guarda un puntero (una variable, un campo, un elemento,
  // lo que apunta otro puntero), dice donde esta: es de donde sale el acceso que sigue.
  // "copia": se lo va a guardar tal cual en otra casilla (int *q = p; q = p;): un puntero que nunca recibio una direccion se copia
  // (en C la basura se copia; el problema aparece despues, cuando se la usa) y la otra casilla queda igual de sin valor.
  evaluarConOrigen(n, copia = false) {
    if (!this.enMacro) this.fila = n.startPosition.row + 1;
    let lv = null;
    switch (n.type) {
      case 'identifier': {
        const v = this.buscar(n.text);
        if (v) lv = { st: v.reserva.raiz, reserva: v.reserva };
        break;
      }
      case 'parenthesized_expression':
        return this.evaluarConOrigen(n.namedChildren[0], copia);
      case 'pointer_expression':
        if (n.children[0].text === '*') lv = this.lvalor(n);
        break;
      case 'subscript_expression':
      case 'field_expression':
        lv = this.lvalor(n);
        break;
      default:
        break;
    }
    if (!lv) {
      const rv = this.evaluar(n);
      // Un puntero que devuelve una funcion propia: la casilla de la que salio ya no esta (se retiro el marco), pero
      // al guardarlo se muestra como una copia.
      const devuelto = n.type === 'call_expression' && this.funciones.has(n.childForFieldName('function').text) && Boolean(rv) && Boolean(rv.t) && rv.t.k === 'ptr';
      return { rv, origen: null, celda: null, devuelto };
    }
    const sinDireccion = copia && lv.st.t && lv.st.t.k === 'ptr' && lv.st.v === undefined;
    const rv = sinDireccion ? { t: lv.st.t, v: undefined } : this.valorDe(lv, n.text);
    const celda = this.ubicar(lv.reserva, lv.st);
    return { rv, origen: lv.st.t && lv.st.t.k === 'ptr' ? celda : null, celda };
  }

  mover(p, k) {
    if (p === undefined) throw new ErrorDelMotor('PUNTERO_SIN_INICIALIZAR');
    if (p === null) {
      if (k === 0) return null;
      throw new ErrorDelMotor('SIN_VERIFICAR', 'una cuenta con NULL');
    }
    if (p.sinTipo) throw new ErrorDelMotor('SIN_VERIFICAR', 'una cuenta con un bloque sin tipo');
    if (p.arr) return punteroEnArreglo(p.reserva, p.arr, p.i + k);
    if (k === 0) return p;
    return { reserva: p.reserva, st: undefined, arr: null, i: k };
  }

  escribir(lv, rv) {
    if (lv.reserva && lv.reserva.soloLectura) throw new ErrorDelMotor('ESCRITURA_EN_TEXTO');
    this.asignarAlmacen(lv.st, rv);
  }

  // "modo": 'paso' si es la condicion de una sentencia (if, while, do, for) y esta justo despues de la fotografia con que
  // empezo; 'nuevo' si antes se hizo algo (la inicializacion de un for): la pregunta es entonces una fotografia propia.
  // Sin modo (el ?: o una parte de a && b) es solo una expresion. Con la opcion "preguntas" la fotografia de la
  // sentencia lleva la pregunta (el texto y las casillas que se leen) y la siguiente la respuesta.
  condicion(n, modo) {
    const afuera = Boolean(this.opciones.traza) && this.enCondicion === 0 && modo !== undefined;
    let textoPregunta = null;
    let preguntaHecha = null;
    let pasoPregunta = null; // la fotografia que lleva la pregunta (ver anotarPregunta)
    if (afuera) {
      textoPregunta = (n.type === 'parenthesized_expression' ? n.namedChildren[0] : n).text.replace(/\s+/g, ' ').trim();
      if (textoPregunta.length > 42) textoPregunta = textoPregunta.slice(0, 41) + '…';
    }
    if (afuera && this.opciones.preguntas) {
      const previos = this.accesos;
      this.accesos = [];
      this.lecturasEnCondicion(n);
      const lecturas = this.accesos.filter((h) => !h.de && h.cond);
      const celdas = lecturas.map((h) => h.a);
      this.accesos = previos;
      // "enfoque": las casillas de punteros de las que salen las flechas que importan para responder (las que se
      // leen, y despues las que la evaluacion recorre); las demas flechas se atenuan mientras se ve la pregunta.
      const pregunta = { texto: textoPregunta, celdas, enfoque: lecturas.filter((h) => h.ptr).map((h) => h.a) };
      const ultima = this.traza[this.traza.length - 1];
      if (modo === 'paso' && ultima && ultima === this.fotoDePaso) ultima.pregunta = pregunta;
      else this.instantanea(n.startPosition.row + 1, null, pregunta);
      preguntaHecha = pregunta;
      pasoPregunta = this.traza.length - 1;
    } else if (!(this.opciones.preguntas && this.enCondicion > 0)) this.lecturasEnCondicion(n); // (dentro de una condicion ya se leyeron)
    this.enCondicion++;
    const listaDeAccesos = this.accesos;
    let rv;
    try {
      rv = this.evaluar(n);
    } finally {
      this.enCondicion--;
    }
    if (preguntaHecha && this.accesos === listaDeAccesos) {
      // Las flechas que la evaluacion recorrio (p->sig, *lista): tambien quedan a la vista.
      for (const h of this.accesos) {
        if (!h.de || h.tipo || preguntaHecha.enfoque.some((e) => e.a === h.de.a && e.ruta.join('/') === h.de.ruta.join('/'))) continue;
        preguntaHecha.enfoque.push(h.de);
      }
    }
    this.usable(rv);
    if (rv.t.k === 'struct') throw new ErrorDelMotor('ASIGNACION_INVALIDA', 'una estructura como condicion');
    const valor = rv.t.k === 'ptr' ? rv.v !== null : rv.v !== 0;
    // Para la traza: la condicion que se acaba de evaluar (la de mas afuera) y que dio.
    const pasos = afuera ? this.pasosDeCondicion(n) : null;
    if (afuera) this.condicionHecha = { texto: textoPregunta, valor, ...(preguntaHecha ? { celdas: preguntaHecha.celdas } : {}), ...(pasos ? { pasos: pasos.pasos, partes: pasos.partes } : {}) };
    if (afuera) this.anotarPregunta(n, textoPregunta, valor, pasoPregunta, pasos);
    return valor;
  }

  // La condicion de mas afuera paso a paso, para el detalle del rotulo de la figura: [escrita, con los valores puestos, con las
  // cuentas hechas...], sin la respuesta. Cada paso resuelve un nivel mas del arbol, de abajo hacia arriba: primero las variables y
  // lo que se lee (*p, p->x, a[i]) pasan a su valor (un puntero, a NULL o a su direccion) y despues cada operacion a su resultado.
  // En a && b y a || b que se deciden con la izquierda, la derecha no se evalua (y se queda escrita). Devuelve null si no se sabe
  // hacer sin efectos (llamadas, asignaciones, ++, ?:, conversiones) o si hay menos de dos pasos. Con los textos devuelve, de cada
  // paso, sus partes ({ t } o, la que acaba de cambiar en ese paso, { t, antes, nuevo }) para animar solo lo que cambia.
  pasosDeCondicion(expr) {
    let raiz = expr;
    while (raiz.type === 'parenthesized_expression') raiz = raiz.namedChildren[0];
    if (!/^[\x00-\x7f]*$/.test(raiz.text)) return null;
    const accesos = [...this.accesos];
    const escrituras = this.escrituras.length;
    const valorDe = (n) => {
      const rv = this.evaluar(n);
      if (rv.t.k === 'ptr') return rv.v === null ? 'NULL' : String(direccionDe(rv.v));
      const t = textoEscalar(rv);
      if (t === null) throw new Error('un valor sin texto');
      return t;
    };
    const hay = (rv) => (rv.t.k === 'ptr' ? rv.v !== null : rv.v !== 0);
    // "s": en que paso ya esta resuelto el nodo (0: un literal, que nunca cambia).
    const analizar = (n) => {
      switch (n.type) {
        case 'number_literal':
        case 'char_literal':
        case 'string_literal':
        case 'null':
        case 'true':
        case 'false':
          return { n, s: 0, hijos: [] };
        case 'identifier':
        case 'subscript_expression':
        case 'field_expression':
        case 'pointer_expression':
          return { n, s: 1, valor: valorDe(n), hijos: [] };
        case 'parenthesized_expression': {
          const h = analizar(n.namedChildren[0]);
          return { n, s: h.s, ...(h.s > 0 ? { valor: valorDe(n) } : {}), hijos: [h] };
        }
        case 'unary_expression': {
          const h = analizar(n.childForFieldName('argument'));
          return { n, s: 1 + h.s, valor: valorDe(n), hijos: [h] };
        }
        case 'binary_expression': {
          const op = n.childForFieldName('operator').text;
          const izq = analizar(n.childForFieldName('left'));
          if (op === '&&' || op === '||') {
            const verdad = hay(this.evaluar(n.childForFieldName('left')));
            if (op === '&&' ? !verdad : verdad) return { n, s: 1 + izq.s, valor: valorDe(n), hijos: [izq] };
          }
          const der = analizar(n.childForFieldName('right'));
          return { n, s: 1 + Math.max(izq.s, der.s), valor: valorDe(n), hijos: [izq, der] };
        }
        default:
          throw new Error('algo que no se sabe hacer sin efectos');
      }
    };
    const dibujar = (a, k) => {
      if (a.s > 0 && a.s <= k) return a.valor;
      let t = a.n.text;
      for (const h of [...a.hijos].sort((x, y) => y.n.startIndex - x.n.startIndex)) {
        t = t.slice(0, h.n.startIndex - a.n.startIndex) + dibujar(h, k) + t.slice(h.n.endIndex - a.n.startIndex);
      }
      return t;
    };
    // Las partes del texto del paso k: las que se resolvieron justo en ese paso llevan lo que decian antes.
    const partesDe = (a, k) => {
      if (a.s > 0 && a.s <= k) return [a.s === k ? { t: a.valor, antes: dibujar(a, k - 1).replace(/\s+/g, ' '), nuevo: true } : { t: a.valor }];
      const texto = a.n.text;
      const base = a.n.startIndex;
      const salida = [];
      let cursor = 0;
      for (const h of [...a.hijos].sort((x, y) => x.n.startIndex - y.n.startIndex)) {
        const desde = h.n.startIndex - base;
        if (desde > cursor) salida.push({ t: texto.slice(cursor, desde) });
        salida.push(...partesDe(h, k));
        cursor = h.n.endIndex - base;
      }
      if (cursor < texto.length) salida.push({ t: texto.slice(cursor) });
      return salida;
    };
    // Junta las partes sin cambio que quedaron una al lado de otra y arregla los espacios.
    const juntar = (partes) => {
      const lista = [];
      for (const p of partes) {
        const q = { ...p, t: p.t.replace(/\s+/g, ' ') };
        const ultima = lista[lista.length - 1];
        if (ultima && !ultima.nuevo && !q.nuevo) ultima.t += q.t;
        else lista.push(q);
      }
      if (lista.length && !lista[0].nuevo) lista[0].t = lista[0].t.replace(/^ /, '');
      if (lista.length && !lista[lista.length - 1].nuevo) lista[lista.length - 1].t = lista[lista.length - 1].t.replace(/ $/, '');
      return lista.filter((p) => p.t !== '' || p.nuevo);
    };
    try {
      const arbol = analizar(raiz);
      const pasos = [];
      const partes = [];
      for (let k = 0; k < arbol.s; k++) {
        const lista = juntar(partesDe(arbol, k));
        const t = lista.map((p) => p.t).join('');
        if (t.length > 110) return null;
        if (pasos[pasos.length - 1] !== t) {
          pasos.push(t);
          partes.push(lista);
        }
      }
      return pasos.length >= 2 ? { pasos, partes } : null;
    } catch (e) {
      return null;
    } finally {
      this.accesos.splice(0, this.accesos.length, ...accesos);
      this.escrituras.length = escrituras;
    }
  }

  // El texto C de una cadena a la que apunta un puntero (hasta el 0 final).
  cadenaDe(p) {
    if (p === null) throw new ErrorDelMotor('DESREFERENCIA_NULA');
    if (p === undefined) throw new ErrorDelMotor('PUNTERO_SIN_INICIALIZAR');
    const d = this.deref(p);
    if (!p.arr) return String.fromCharCode(d.st.v);
    let texto = '';
    for (let i = p.i; ; i++) {
      const e = p.arr.elems[i];
      if (!e) throw new ErrorDelMotor(p.reserva.region === 'monticulo' ? 'FUERA_DE_BLOQUE' : 'FUERA_DE_RANGO', 'la cadena no termina en un 0', null, { indice: i, largo: p.arr.elems.length });
      if (e.v === undefined) throw new ErrorDelMotor('VARIABLE_SIN_VALOR', 'la cadena tiene posiciones sin valor', null, { texto: 'cadena' });
      if (e.v === 0) return texto;
      texto += String.fromCharCode(e.v & 255);
    }
  }

  escribirCadena(p, texto) {
    const d = this.deref(p);
    if (d.reserva.soloLectura) throw new ErrorDelMotor('ESCRITURA_EN_TEXTO');
    if (!p.arr) throw new ErrorDelMotor('SIN_VERIFICAR', 'guardar una cadena en una sola letra');
    const lugar = p.arr.elems.length - p.i;
    if (texto.length + 1 > lugar) {
      throw new ErrorDelMotor(d.reserva.region === 'monticulo' ? 'FUERA_DE_BLOQUE' : 'FUERA_DE_RANGO', 'la cadena no entra', null, { indice: p.i + texto.length, largo: p.arr.elems.length });
    }
    for (let i = 0; i < texto.length; i++) p.arr.elems[p.i + i].v = texto.charCodeAt(i) & 255;
    p.arr.elems[p.i + texto.length].v = 0;
  }

  // -------------------------------------------------------------- lvalor

  lvalor(n) {
    switch (n.type) {
      case 'identifier': {
        const v = this.buscar(n.text);
        if (!v) throw new ErrorDelMotor('NOMBRE_DESCONOCIDO', `${n.text} no esta declarado`, n.startPosition.row + 1, { nombre: n.text });
        return { st: v.reserva.raiz, reserva: v.reserva };
      }
      case 'parenthesized_expression':
        return this.lvalor(n.namedChildren[0]);
      case 'pointer_expression': {
        if (n.children[0].text !== '*') break;
        const { rv: p, origen } = this.evaluarConOrigen(n.childForFieldName('argument'));
        if (p.t.k !== 'ptr') throw new ErrorDelMotor('SIN_VERIFICAR', 'un * sobre algo que no es un puntero');
        if (p.t.a.k === 'void') throw new ErrorDelMotor('SIN_VERIFICAR', 'un * sobre un puntero void');
        const d = this.deref(p.v);
        this.acceso(origen, d);
        return d;
      }
      case 'subscript_expression': {
        const { rv: base, origen } = this.evaluarConOrigen(n.childForFieldName('argument'));
        const indice = this.evaluar(n.childForFieldName('index') || n.childForFieldName('indices'));
        if (base.t.k !== 'ptr') throw new ErrorDelMotor('SIN_VERIFICAR', 'corchetes sobre algo que no es un arreglo ni un puntero');
        if (indice.t.k !== 'int') throw new ErrorDelMotor('SIN_VERIFICAR', 'un indice que no es entero');
        const d = this.deref(this.mover(base.v, indice.v));
        this.acceso(origen, d);
        return d;
      }
      case 'field_expression': {
        const flecha = n.children.some((h) => h.type === '->');
        const nombre = n.childForFieldName('field').text;
        let sobre;
        let origen = null;
        if (flecha) {
          const { rv: p, origen: o } = this.evaluarConOrigen(n.childForFieldName('argument'));
          origen = o;
          if (p.t.k !== 'ptr' || p.t.a.k !== 'struct') throw new ErrorDelMotor('SIN_VERIFICAR', 'una flecha sobre algo que no apunta a una estructura');
          sobre = this.deref(p.v);
        } else {
          sobre = this.lvalor(n.childForFieldName('argument'));
          if (sobre.st.t.k !== 'struct') throw new ErrorDelMotor('SIN_VERIFICAR', 'un punto sobre algo que no es una estructura');
        }
        const campo = sobre.st.campos.get(nombre);
        if (!campo) throw new ErrorDelMotor('CAMPO_DESCONOCIDO', `la estructura no tiene un campo ${nombre}`, n.startPosition.row + 1, { campo: nombre });
        // Con la flecha el acceso llega hasta el campo, no a toda la estructura.
        if (flecha) this.acceso(origen, { st: campo, reserva: sobre.reserva });
        return { st: campo, reserva: sobre.reserva };
      }
      default:
        break;
    }
    // Una estructura que devuelve una funcion: se puede leer, no asignar.
    const rv = this.evaluar(n);
    if (rv.t.k === 'struct') return { st: rv.v, reserva: { vivo: true, soloLectura: true } };
    throw new ErrorDelMotor('ASIGNACION_INVALIDA', 'eso no se puede asignar', n.startPosition.row + 1);
  }

  // ----------------------------------------------------------- expresiones

  evaluar(n) {
    if (!this.enMacro) this.fila = n.startPosition.row + 1;
    switch (n.type) {
      case 'number_literal':
        return this.numero(n.text);
      case 'char_literal':
        return { t: INT, v: decodificar(n.text.slice(1, -1))[0] };
      case 'string_literal':
      case 'concatenated_string': {
        let r = this.textos.get(n.startIndex);
        if (!r) {
          r = this.memoria.texto(this.textoLiteral(n));
          this.textos.set(n.startIndex, r);
        }
        return { t: puntero(CHAR), v: punteroEnArreglo(r, r.raiz, 0) };
      }
      case 'identifier':
        return this.identificador(n);
      case 'null':
        return { t: puntero(VOID), v: null };
      case 'true':
      case 'false':
        return { t: INT, v: n.type === 'true' ? 1 : 0 };
      case 'parenthesized_expression':
        return this.evaluar(n.namedChildren[0]);
      case 'unary_expression':
        return this.unaria(n);
      case 'pointer_expression':
        return this.direccion(n);
      case 'update_expression':
        return this.actualizacion(n);
      case 'assignment_expression':
        return this.asignacion(n);
      case 'binary_expression': {
        const rv = this.binaria(n);
        // La cuenta algebraica que rodea una llamada de mas arriba: se anota lo que vale cuando termina de evaluarse.
        const registro = this.seguidas.size ? this.seguidas.get(n.id) : null;
        if (registro && registro.llamador) registro.llamador.valorFinal = textoDeValor(rv);
        return rv;
      }
      case 'call_expression':
        return this.llamada(n);
      case 'field_expression':
      case 'subscript_expression':
        return this.valorDe(this.lvalor(n), n.text);
      case 'cast_expression': {
        const t = this.tipoDeDescriptor(n.childForFieldName('type'));
        const rv = this.evaluar(n.childForFieldName('value'));
        if (t.k === 'void') return { t: VOID, v: null };
        if (t.k === 'ptr' && rv.t.k === 'ptr' && rv.v && !rv.v.sinTipo && t.a.k !== 'void' && rv.t.a.k !== 'void' && textoDeTipo(t.a) !== textoDeTipo(rv.t.a)) {
          throw new ErrorDelMotor('SIN_VERIFICAR', 'un cambio de tipo de puntero entre tipos distintos');
        }
        return this.convertir(rv, t, true);
      }
      case 'sizeof_expression': {
        const td = n.childForFieldName('type');
        const t = td ? this.tipoDeDescriptor(td) : this.tipoDe(n.childForFieldName('value'));
        return { t: TAMANO_T, v: tamano(t) };
      }
      case 'conditional_expression':
        return this.condicion(n.childForFieldName('condition'))
          ? this.evaluar(n.childForFieldName('consequence'))
          : this.evaluar(n.childForFieldName('alternative'));
      case 'comma_expression':
        this.evaluar(n.childForFieldName('left'));
        return this.evaluar(n.childForFieldName('right'));
      default:
        throw new ErrorDelMotor('SIN_VERIFICAR', `la expresion ${n.type}`, n.startPosition.row + 1);
    }
  }

  numero(texto) {
    const esHex = /^0[xX]/.test(texto);
    const limpio = texto.replace(esHex ? /[uUlL]+$/ : /[uUlLfF]+$/, '');
    if (!esHex && /[.eE]/.test(texto)) {
      const flotante = /[fF]$/.test(texto);
      return { t: flotante ? FLOAT : DOUBLE, v: flotante ? Math.fround(parseFloat(limpio)) : parseFloat(limpio) };
    }
    const v = esHex ? parseInt(limpio, 16) : /^0\d/.test(limpio) ? parseInt(limpio, 8) : parseInt(limpio, 10);
    const largo = /[lL]/.test(texto) || v > 2147483647;
    return { t: largo ? LONG : INT, v };
  }

  identificador(n) {
    const v = this.buscar(n.text);
    if (v) return this.valorDe({ st: v.reserva.raiz, reserva: v.reserva }, n.text);
    if (this.constantes.has(n.text)) return { t: INT, v: this.constantes.get(n.text) };
    if (n.text === 'NULL') return { t: puntero(VOID), v: null };
    if (n.text === 'true' || n.text === 'false') return { t: INT, v: n.text === 'true' ? 1 : 0 };
    if (this.macros.has(n.text)) return this.macro(n.text);
    throw new ErrorDelMotor('NOMBRE_DESCONOCIDO', `${n.text} no esta declarado`, n.startPosition.row + 1, { nombre: n.text });
  }

  macro(nombre) {
    if (this.macrosHechas.has(nombre)) return this.macrosHechas.get(nombre);
    const arbol = this.analizador.parse(`int __m = ${this.macros.get(nombre)};`);
    this.enMacro++;
    try {
      const d = arbol.rootNode.namedChildren[0].namedChildren.find((h) => h.type === 'init_declarator');
      const r = this.evaluar(d.childForFieldName('value'));
      if (r.t.k === 'int' || r.t.k === 'float') this.macrosHechas.set(nombre, r);
      return r;
    } finally {
      this.enMacro--;
      arbol.delete();
    }
  }

  unaria(n) {
    const op = n.children[0].text;
    const rv = this.evaluar(n.childForFieldName('argument'));
    this.usable(rv);
    if (op === '!') {
      if (rv.t.k === 'struct') throw new ErrorDelMotor('ASIGNACION_INVALIDA', 'un ! sobre una estructura');
      return { t: INT, v: (rv.t.k === 'ptr' ? rv.v === null : rv.v === 0) ? 1 : 0 };
    }
    if (rv.t.k !== 'int' && rv.t.k !== 'float') throw new ErrorDelMotor('SIN_VERIFICAR', `el operador ${op} sobre algo que no es un numero`);
    const t = rv.t.k === 'int' ? promover(rv.t, INT) : rv.t;
    if (op === '-') return { t, v: t.k === 'int' ? ajustar(-rv.v, t) : -rv.v };
    if (op === '+') return { t, v: rv.v };
    if (op === '~') return { t, v: ajustar(~rv.v, t) };
    throw new ErrorDelMotor('SIN_VERIFICAR', `el operador ${op}`, n.startPosition.row + 1);
  }

  direccion(n) {
    const op = n.children[0].text;
    const arg = n.childForFieldName('argument');
    if (op === '&') {
      const lv = this.lvalor(arg);
      if (lv.reserva && lv.reserva.soloLectura && lv.reserva.region !== 'texto') throw new ErrorDelMotor('SIN_VERIFICAR', 'la direccion de un valor temporal');
      const p = lv.arr ? punteroEnArreglo(lv.reserva, lv.arr, lv.i) : punteroA(lv.reserva, lv.st);
      return { t: puntero(lv.st.t), v: p };
    }
    return this.valorDe(this.lvalor(n), n.text);
  }

  actualizacion(n) {
    const arg = n.childForFieldName('argument');
    const mas = n.text.includes('++');
    const prefijo = n.children[0].type === '++' || n.children[0].type === '--';
    const lv = this.lvalor(arg);
    const antes = this.valorDe(lv, arg.text);
    let despues;
    if (antes.t.k === 'ptr') despues = { t: antes.t, v: this.mover(antes.v, mas ? 1 : -1) };
    else if (antes.t.k === 'int' || antes.t.k === 'float') despues = this.convertir({ t: antes.t, v: antes.v + (mas ? 1 : -1) }, antes.t);
    else throw new ErrorDelMotor('SIN_VERIFICAR', 'un ++ sobre algo que no es un numero ni un puntero');
    this.escribir(lv, despues);
    if (antes.t.k !== 'ptr') this.escritura(lv.reserva, lv.st);
    return prefijo ? despues : antes;
  }

  asignacion(n) {
    const op = n.childForFieldName('operator').text;
    const inicio = this.accesos.length;
    const lv = this.lvalor(n.childForFieldName('left'));
    const finDestino = this.accesos.length;
    let rv;
    let origenCopiado = null;
    let celdaCopiada = null;
    let devuelto = false;
    if (op === '=') ({ rv, origen: origenCopiado, celda: celdaCopiada, devuelto } = this.evaluarConOrigen(n.childForFieldName('right'), true));
    else rv = this.evaluar(n.childForFieldName('right'));
    if (op !== '=') {
      const actual = this.valorDe(lv, n.childForFieldName('left').text);
      rv = this.operar(op.slice(0, -1), actual, rv);
    }
    if (lv.st.t.k !== 'struct') rv = this.convertir(rv, lv.st.t);
    const viejo = lv.st.t.k === 'ptr' ? lv.st.v : undefined;
    this.escribir(lv, rv);
    if (devuelto) this.copiaDevuelta(lv.st, this.ubicar(lv.reserva, lv.st));
    else this.registrarCopia(lv.st, origenCopiado, celdaCopiada, this.ubicar(lv.reserva, lv.st));
    if ((op !== '=' || !celdaCopiada) && !devuelto) this.escritura(lv.reserva, lv.st);
    const sobrescrito = op === '=' && lv.st.t.k === 'ptr' ? viejo : undefined;
    // Para la traza: primero lo que se guarda (el recorrido que lleva al valor y su copia) y despues donde se guarda
    // (el recorrido hasta la casilla de destino), aunque C evalue primero el lado izquierdo.
    if (op === '=' && this.opciones.traza && finDestino > inicio && this.accesos.length > finDestino) {
      const destino = this.accesos.slice(inicio, finDestino);
      const valor = this.accesos.slice(finDestino);
      this.accesos.splice(inicio, this.accesos.length - inicio, ...valor, ...destino);
    }
    // La flecha que tenia el puntero sobrescrito (si apuntaba a algo vivo): destella antes de que cambie.
    if (this.opciones.traza && sobrescrito && sobrescrito.reserva && this.accesos.length < 8) {
      const s = serializarPuntero(sobrescrito);
      const de = this.ubicar(lv.reserva, lv.st);
      if (s.k === 'ptr' && !s.muerto && de) this.accesos.push({ de, a: { a: s.a, ruta: s.ruta }, tipo: 'vieja' });
    }
    return lv.st.t.k === 'struct' ? { t: lv.st.t, v: lv.st } : { t: lv.st.t, v: lv.st.v };
  }

  binaria(n) {
    const op = n.childForFieldName('operator').text;
    if (op === '&&') {
      return { t: INT, v: this.condicion(n.childForFieldName('left')) && this.condicion(n.childForFieldName('right')) ? 1 : 0 };
    }
    if (op === '||') {
      return { t: INT, v: this.condicion(n.childForFieldName('left')) || this.condicion(n.childForFieldName('right')) ? 1 : 0 };
    }
    const a = this.evaluar(n.childForFieldName('left'));
    const b = this.evaluar(n.childForFieldName('right'));
    if (!this.enMacro) this.fila = n.startPosition.row + 1;
    return this.operar(op, a, b);
  }

  operar(op, a, b) {
    this.usable(a);
    this.usable(b);
    if (a.t.k === 'struct' || b.t.k === 'struct') throw new ErrorDelMotor('SIN_VERIFICAR', `el operador ${op} con una estructura`);
    if (a.t.k === 'ptr' || b.t.k === 'ptr') return this.operarPunteros(op, a, b);
    const comparacion = { '==': (x, y) => x === y, '!=': (x, y) => x !== y, '<': (x, y) => x < y, '>': (x, y) => x > y, '<=': (x, y) => x <= y, '>=': (x, y) => x >= y }[op];
    if (comparacion) return { t: INT, v: comparacion(a.v, b.v) ? 1 : 0 };
    const flotante = a.t.k === 'float' || b.t.k === 'float';
    const t = flotante ? (a.t.k === 'float' && b.t.k === 'float' ? (a.t.bytes >= b.t.bytes ? a.t : b.t) : a.t.k === 'float' ? a.t : b.t) : promover(a.t, b.t);
    let v;
    switch (op) {
      case '+': v = a.v + b.v; break;
      case '-': v = a.v - b.v; break;
      case '*': v = a.v * b.v; break;
      case '/':
        if (!flotante && b.v === 0) throw new ErrorDelMotor('DIVISION_POR_CERO');
        v = flotante ? a.v / b.v : Math.trunc(a.v / b.v);
        break;
      case '%':
        if (flotante) throw new ErrorDelMotor('SIN_VERIFICAR', 'un % con decimales');
        if (b.v === 0) throw new ErrorDelMotor('DIVISION_POR_CERO');
        v = a.v % b.v;
        break;
      case '&': v = a.v & b.v; break;
      case '|': v = a.v | b.v; break;
      case '^': v = a.v ^ b.v; break;
      case '<<': v = a.v << b.v; break;
      case '>>': v = a.v >> b.v; break;
      default:
        throw new ErrorDelMotor('SIN_VERIFICAR', `el operador ${op}`);
    }
    return flotante ? { t, v: t.bytes === 4 ? Math.fround(v) : v } : { t, v: ajustar(v, t) };
  }

  operarPunteros(op, a, b) {
    const esNulo = (x) => x.t.k === 'int' && x.v === 0;
    if (op === '==' || op === '!=') {
      const pa = a.t.k === 'ptr' ? a.v : esNulo(a) ? null : undefined;
      const pb = b.t.k === 'ptr' ? b.v : esNulo(b) ? null : undefined;
      if (pa === undefined || pb === undefined) throw new ErrorDelMotor('SIN_VERIFICAR', 'comparar una direccion con algo que no lo es');
      const iguales = mismoDestino(pa, pb);
      return { t: INT, v: iguales === (op === '==') ? 1 : 0 };
    }
    if (['<', '>', '<=', '>='].includes(op) && a.t.k === 'ptr' && b.t.k === 'ptr') {
      const x = direccionDe(a.v);
      const y = direccionDe(b.v);
      const r = { '<': x < y, '>': x > y, '<=': x <= y, '>=': x >= y }[op];
      return { t: INT, v: r ? 1 : 0 };
    }
    if ((op === '+' || op === '-') && a.t.k === 'ptr' && b.t.k === 'int') {
      return { t: a.t, v: this.mover(a.v, op === '-' ? -b.v : b.v) };
    }
    if (op === '+' && a.t.k === 'int' && b.t.k === 'ptr') return { t: b.t, v: this.mover(b.v, a.v) };
    if (op === '-' && a.t.k === 'ptr' && b.t.k === 'ptr') {
      if (!a.v || !b.v || a.v.arr !== b.v.arr || !a.v.arr) throw new ErrorDelMotor('SIN_VERIFICAR', 'restar direcciones que no son del mismo arreglo');
      return { t: LONG, v: a.v.i - b.v.i };
    }
    throw new ErrorDelMotor('SIN_VERIFICAR', `el operador ${op} con una direccion`);
  }

  // ---------------------------------------------------------- funciones

  llamada(n) {
    const f = n.childForFieldName('function');
    if (f.type !== 'identifier') throw new ErrorDelMotor('SIN_VERIFICAR', 'una llamada que no es a una funcion por su nombre', n.startPosition.row + 1);
    const nodos = n.childForFieldName('arguments').namedChildren.filter((h) => h.type !== 'comment');
    const propia = this.funciones.get(f.text);
    if (propia) {
      const args = nodos.map((h) => this.evaluar(h));
      const origenes = this.opciones.traza ? nodos.map((h) => this.origenDeArgumento(h)) : [];
      this.fila = n.startPosition.row + 1;
      const texto = this.opciones.traza ? this.textoDeLlamada(propia, nodos, args) : null;
      // La funcion que llama (si no es una recursiva, que ya tiene sus filas) anota que llamo y el detalle de esa llamada, para su fila
      // en el trazado: de main a sumaDigitos(x), de sumaDigitos a sumaAux(n, 0) (ver cadenaDeLlamadores).
      const quien = this.marcos[this.marcos.length - 1];
      if (this.opciones.traza && quien && !quien.registro) {
        const st = this.sentenciaDe(n);
        quien.llamando = { detalle: st ? this.detalleDeIda(n, new Map(), '', quien.fotos && quien.fotos.get(st.id), texto, n.id) : null };
      }
      const registro = this.opciones.traza && this.esRecursiva(propia) ? this.abrirRegistro(propia, nodos, args) : null;
      const resultado = this.ejecutarFuncion(propia, args, origenes, registro, texto);
      if (registro) this.cerrarRegistro(registro, n, resultado);
      return resultado;
    }
    return this.biblioteca(f.text, nodos, n);
  }

  // La casilla de la que sale un argumento, para la traza: una variable (x) o la variable de la que se toma la direccion (&x).
  // Cualquier otra cosa (un numero, una cuenta) no sale de ninguna casilla.
  origenDeArgumento(n) {
    while (n.type === 'parenthesized_expression') n = n.namedChildren[0];
    let porDireccion = false;
    if (n.type === 'pointer_expression' && n.children[0].text === '&') {
      porDireccion = true;
      n = n.namedChildren[0];
      while (n.type === 'parenthesized_expression') n = n.namedChildren[0];
    }
    if (n.type !== 'identifier') return null;
    const v = this.buscar(n.text);
    const celda = v && v.reserva.raiz ? this.ubicar(v.reserva, v.reserva.raiz) : null;
    return celda ? { celda, puntero: !porDireccion && v.reserva.raiz.t.k === 'ptr', porDireccion } : null;
  }

  // Lo que se ve al pasar un argumento, ya con la caja de la funcion abierta: se resalta la casilla de la que sale (con su
  // flecha y el bloque, si es un puntero), despues la del parametro y, si el parametro es un puntero, se dibuja su flecha.
  // Con mas de tres argumentos se resaltan todos a la vez (ver planDeLlamada en figura.js).
  anotarArgumento(origen, argumento, para, total) {
    if (!this.opciones.traza || !para) return;
    // Con la marca "llamada" la figura no los anima antes de abrir la caja: lo hace despues, pareja por pareja.
    const junto = total > 3;
    if (origen) {
      const antes = this.accesos.length;
      if (origen.puntero && argumento.v && argumento.v.reserva) this.copia(origen.celda, argumento.v, para);
      else this.copiaValor(origen.celda, para);
      // "direccion": lo que se pasa no es lo que hay en la casilla sino su direccion (&x): la figura lo marca con un &.
      if (this.accesos.length > antes) Object.assign(this.accesos[this.accesos.length - 1], { llamada: true, ...(origen.porDireccion ? { direccion: true } : {}) });
    }
    if (this.accesos.length < 8) this.accesos.push({ de: null, a: para, tipo: 'parametro', llamada: true, ...(junto ? { junto: true } : {}) });
  }

  // ------------------------------------------------- el trazado de una recursion
  //
  // Por cada llamada a una funcion recursiva (una que se llama a si misma en su cuerpo) se anota un registro con lo que hace la
  // llamada: { funcion, llamada: "quitar(213, 1)", nivel, desde, hasta, ida, vuelta }. "desde" y "hasta" son lugares de la traza
  // (la llamada tiene caja desde la fotografia "desde" y hasta antes de la "hasta"; "hasta" es null si no termino). "ida" es el
  // return con lo que vale cada variable y con las llamadas que hace (quitar(21, 1) * 10 + 3) y "vuelta", con el valor que
  // devolvio cada una (23 * 10 + 3); cada uno con el lugar de la traza desde el que se conoce ("paso"), y la vuelta con el
  // valor que devuelve. Una llamada sin return (void, o sin valor) no tiene ida ni vuelta.

  esRecursiva(f) {
    if (f.recursiva === undefined) {
      const busca = (n) => (n.type === 'call_expression' && n.childForFieldName('function').text === f.nombre) || n.namedChildren.some(busca);
      f.recursiva = Boolean(f.cuerpo) && busca(f.cuerpo);
    }
    return f.recursiva;
  }

  // La llamada escrita con lo que valen sus argumentos: quitar(213, 1).
  textoDeLlamada(f, nodos, args) {
    // (un argumento que recibe un parametro de un enumerado se escribe con el nombre del valor)
    const deParametro = (a, i) => (f.params[i] && f.params[i].tipo.enumerados && a && typeof a.v === 'number' ? { t: f.params[i].tipo, v: a.v } : a);
    const textos = args.map((a, i) => (nodos[i].type === 'char_literal' ? nodos[i].text : textoEscalar(deParametro(a, i))) ?? nodos[i].text.replace(/\s+/g, ' '));
    return `${f.nombre}(${textos.join(', ')})`;
  }

  abrirRegistro(f, nodos, args) {
    if (this.registroLlamadas.length >= 300) return null;
    // Quien la llama (casi siempre main), si no es la misma funcion: es una llamada de mas arriba de la recursion.
    const llamador = this.marcos[this.marcos.length - 1].funcion;
    const registro = {
      id: this.registroLlamadas.length,
      preguntas: [], // lo que pregunto la llamada (ver anotarPregunta)
      llamador: llamador !== f.nombre ? this.cadenaDeLlamadores() : null,
      base: null, // la fotografia donde esta llamada llega a su caso base (no hace otra llamada a la funcion), o null
      funcion: f.nombre,
      llamada: this.textoDeLlamada(f, nodos, args),
      nivel: this.marcos.length,
      desde: this.traza.length,
      hasta: null,
      ida: null,
      vuelta: null,
    };
    this.registroLlamadas.push(registro);
    return registro;
  }

  // Quien llama a una recursion: { funcion, llamada, desde, anteriores }. "funcion" es la que la llama (casi siempre main, o la que no es
  // recursiva y la prepara: sumaDigitos, que llama a sumaAux con el valor inicial), con "llamada" (como se la llamo) y "desde" (la
  // fotografia en que se abrio su caja). "anteriores" son las que llamaron a esa, de la primera (main) para adelante, con lo mismo:
  // cada una tiene su fila en el trazado. Se corta en la primera que es recursiva (esa ya tiene sus filas). Cada una recibe, al
  // terminar, "valor" (lo que devolvio) y "hasta" (la fotografia en que termina): ver ejecutarFuncion.
  cadenaDeLlamadores() {
    const marcos = this.marcos;
    const entrada = (m) => {
      const e = { funcion: m.funcion, llamada: m.llamadaTexto ?? null, desde: m.desde };
      // (el detalle de la llamada que hace a la que sigue)
      if (m.llamando && m.llamando.detalle) e.detalle = m.llamando.detalle;
      (m.cadenas ||= []).push(e);
      return e;
    };
    const inmediato = entrada(marcos[marcos.length - 1]);
    const anteriores = [];
    if (!marcos[marcos.length - 1].registro) {
      for (let i = marcos.length - 2; i >= 0 && !marcos[i].registro; i--) anteriores.unshift(entrada(marcos[i]));
    }
    inmediato.anteriores = anteriores;
    return inmediato;
  }

  // Termino la llamada: se anota donde (para que la funcion que la hizo arme su ida y su vuelta) y lo que devolvio.
  cerrarRegistro(registro, n, resultado) {
    registro.hasta = this.traza.length;
    const marco = this.marcos[this.marcos.length - 1];
    if (!marco.hechas) marco.hechas = new Map();
    marco.hechas.set(n.id, { registro, valor: textoDeValor(resultado) });
    if (registro.llamador) this.anotarLlamador(registro, n, marco);
    if (marco.registro) this.anotarLineaDeLlamada(marco, n);
  }

  // Una pregunta (if, while...) que hace una llamada de una funcion recursiva, para el trazado: { texto (con los valores puestos: 4172 < 10),
  // simbolico (n < 10), valor, fase ('ida': antes de la primera llamada que vuelve; 'vuelta': despues), pregunta (la fotografia en que se la ve, con el cursor sobre el if), respuesta (la fotografia en
  // que se sabe lo que dio) }.
  anotarPregunta(n, simbolico, valor, pasoPregunta, pasos = null) {
    const marco = this.marcos[this.marcos.length - 1];
    const r = marco && marco.registro;
    if (!r) return;
    if (!r.preguntas) r.preguntas = [];
    if (r.preguntas.length >= 8) return;
    const interna = n.type === 'parenthesized_expression' ? n.namedChildren[0] : n;
    let texto = simbolico;
    try {
      texto = this.sustituir(interna, marco.hechas || new Map(), 'vuelta').texto;
    } catch (e) {
      // se deja escrita como esta
    }
    // De la ida si todavia no volvio ninguna llamada de esta funcion; de la vuelta si ya volvio alguna (o si la pregunta la lleva).
    const fase = marco.hechas && marco.hechas.size ? 'vuelta' : 'ida';
    // "pasos" y "partes": el detalle de la pregunta (ver pasosDeCondicion), si se pudo hacer.
    r.preguntas.push({ texto, simbolico, valor, fase, pregunta: pasoPregunta ?? this.traza.length, respuesta: this.traza.length, ...(pasos ? { pasos: pasos.pasos, partes: pasos.partes } : {}) });
  }

  // La sentencia en la que esta una llamada (declaration, expression_statement, if...).
  sentenciaDe(n) {
    for (let p = n.parent; p; p = p.parent) if (SENTENCIAS.has(p.type)) return p;
    return null;
  }

  contieneLlamadaHecha(n, hechas) {
    return (n.type === 'call_expression' && hechas.has(n.id)) || n.namedChildren.some((h) => this.contieneLlamadaHecha(h, hechas));
  }

  // La linea que hace la llamada, para la ida y la vuelta de una funcion recursiva cuya llamada no esta en el return (int resto =
  // f(n / 10);, a = f(x);, if (f(x) > 3)): { texto, partes } con las llamadas (ida) o con lo que devolvieron (vuelta); null si no.
  lineaDeLlamada(st, hechas, modo) {
    const con = (prefijo, s) => ({ texto: prefijo + s.texto, partes: [prefijo, ...s.partes] });
    switch (st.type) {
      case 'declaration': {
        for (const d of st.namedChildren) {
          if (d.type !== 'init_declarator') continue;
          const valor = d.childForFieldName('value');
          if (valor && this.contieneLlamadaHecha(valor, hechas)) return con(d.childForFieldName('declarator').text + ' = ', this.sustituir(valor, hechas, modo));
        }
        return null;
      }
      case 'expression_statement': {
        const e = st.namedChildren.find((h) => h.type !== 'comment');
        if (!e) return null;
        if (e.type === 'assignment_expression') {
          const derecha = e.childForFieldName('right');
          if (!this.contieneLlamadaHecha(derecha, hechas)) return null;
          return con(e.childForFieldName('left').text + ' ' + e.childForFieldName('operator').text + ' ', this.sustituir(derecha, hechas, modo));
        }
        return this.contieneLlamadaHecha(e, hechas) ? this.sustituir(e, hechas, modo) : null;
      }
      case 'if_statement':
      case 'while_statement':
      case 'do_statement':
      case 'switch_statement': {
        const condicion = st.childForFieldName('condition');
        if (!condicion || !this.contieneLlamadaHecha(condicion, hechas)) return null;
        return con(st.type.replace('_statement', '') + ' ', this.sustituir(condicion, hechas, modo));
      }
      default:
        return null;
    }
  }

  // Una llamada que no esta en un return (esta en una declaracion, una asignacion, una condicion...): la ida de la fila pasa a ser
  // esa linea (una por sentencia, cada una en su renglon) y la vuelta, la misma con lo que devolvieron las llamadas; lo que devuelve
  // la funcion (el valor final) se agrega en su return (ver el return_statement).
  anotarLineaDeLlamada(marco, n) {
    if (marco.hechas.get(n.id).valor === '') return; // una funcion sin valor: nada que mostrar
    const st = this.sentenciaDe(n);
    if (!st || st.type === 'return_statement') return;
    if (!marco.lineas) marco.lineas = new Map();
    marco.lineas.set(st.id, st);
    marco.pasoCuenta = this.traza.length;
    this.armarFilaConLineas(marco, null);
  }

  // "retorno": null (todavia no devolvio) o { expr, devuelto, conLlamada, paso }: el return de la funcion, con su valor y la
  // fotografia desde la que se conoce; si el return tambien llama a la funcion, es una linea mas.
  armarFilaConLineas(marco, retorno) {
    const r = marco.registro;
    const idas = [];
    const vueltas = [];
    for (const st of marco.lineas.values()) {
      const ida = this.lineaDeLlamada(st, marco.hechas, 'ida');
      if (!ida) continue;
      idas.push(ida);
      vueltas.push(this.lineaDeLlamada(st, marco.hechas, 'vuelta'));
    }
    if (retorno && retorno.conLlamada) {
      const ida = this.sustituir(retorno.expr, marco.hechas, 'ida');
      idas.push({ texto: 'return ' + ida.texto, partes: ['return ', ...ida.partes] });
      vueltas.push({ texto: 'return ' + this.sustituir(retorno.expr, marco.hechas, 'vuelta').texto });
    }
    if (!idas.length) return;
    const partes = [];
    idas.forEach((l, i) => {
      if (i) partes.push('\n');
      partes.push(...l.partes);
    });
    const desde = Math.min(...partes.filter((p) => typeof p === 'object').map((p) => this.registroLlamadas[p.id].desde));
    // La vuelta se conoce cuando vuelve la ultima llamada; el valor final, en el return (si no llama, en su propia fotografia).
    const pasoCuenta = retorno ? (retorno.conLlamada ? retorno.paso : Math.min(marco.pasoCuenta ?? retorno.paso, retorno.paso)) : marco.pasoCuenta;
    r.ida = { texto: idas.map((l) => l.texto).join('\n'), paso: desde, partes };
    // Con una sola linea (sin return que llame) tambien se detalla la ida.
    if (idas.length === 1 && !(retorno && retorno.conLlamada)) {
      const st = [...marco.lineas.values()].find((x) => this.exprDeLinea(x, marco.hechas));
      const l = st ? this.exprDeLinea(st, marco.hechas) : null;
      const detalle = l ? this.detalleDeIda(l.expr, marco.hechas, l.prefijo, marco.fotos && marco.fotos.get(st.id), idas[0].texto) : null;
      if (detalle && detalle.paso0 < desde) r.ida.detalle = detalle;
    }
    r.vuelta = {
      texto: vueltas.map((l) => l.texto).join('\n'),
      valor: retorno ? textoDeValor(retorno.devuelto) : null,
      paso: pasoCuenta,
      pasoValor: retorno ? retorno.paso : null,
      flecha: !(retorno && retorno.conLlamada),
    };
  }

  // La fila de quien hace la llamada de mas arriba: su ida es la llamada (o, si esta dentro de una cuenta algebraica, la cuenta
  // entera: fact(3) * 2 + 1) y su vuelta, la misma con lo que devolvio la llamada (6 * 2 + 1) y lo que vale al resolverla
  // ("valorFinal", que se anota cuando termina de evaluarse la cuenta: ver el hook de binary_expression).
  anotarLlamador(registro, n, marco) {
    const valor = marco.hechas.get(n.id).valor;
    const L = registro.llamador;
    L.valorFinal = valor;
    L.ida = { texto: registro.llamada, partes: [{ llamada: registro.llamada, valor, id: registro.id }] };
    L.vuelta = { texto: valor };
    // La cuenta algebraica (+ - * / %) mas grande que rodea a la llamada, si no tiene otras llamadas.
    let externa = null;
    let actual = n;
    while (actual.parent) {
      const p = actual.parent;
      if (p.type === 'parenthesized_expression' || (p.type === 'unary_expression' && p.children[0].text === '-')) {
        actual = p;
        continue;
      }
      if (p.type === 'binary_expression' && ['+', '-', '*', '/', '%'].includes(p.childForFieldName('operator').text)) {
        externa = p;
        actual = p;
        continue;
      }
      break;
    }
    if (!externa || this.tieneOtraLlamada(externa, n)) return;
    const ida = this.sustituir(externa, marco.hechas, 'ida');
    const vuelta = this.sustituir(externa, marco.hechas, 'vuelta');
    L.ida = { texto: ida.texto, partes: ida.partes };
    L.vuelta = { texto: vuelta.texto };
    L.valorFinal = null;
    delete L.detalle;
    this.seguidas.set(externa.id, registro);
  }

  tieneOtraLlamada(nodo, llamada) {
    if (nodo.type === 'call_expression') return nodo.id !== llamada.id;
    return nodo.namedChildren.some((h) => this.tieneOtraLlamada(h, llamada));
  }

  // El valor de una variable escalar, para escribirla en una cuenta (null si no es un numero).
  textoDeVariable(nombre) {
    const v = this.buscar(nombre);
    const raiz = v && v.reserva.raiz;
    if (!raiz || !raiz.t || (raiz.t.k !== 'int' && raiz.t.k !== 'float') || typeof raiz.v !== 'number') return null;
    return textoEscalar({ t: raiz.t, v: raiz.v });
  }

  // Una cuenta hecha solo de numeros, variables escalares y operadores (sin llamadas ni asignaciones).
  cuentaSinLlamadas(n) {
    switch (n.type) {
      case 'number_literal':
        return true;
      case 'identifier':
        return this.textoDeVariable(n.text) !== null;
      case 'parenthesized_expression':
      case 'binary_expression':
        return n.namedChildren.every((h) => this.cuentaSinLlamadas(h));
      default:
        return false;
    }
  }

  // Un elemento de un arreglo o un campo (v[2], p->dato, a.x) que se elige sin llamar a nada.
  lecturaSinLlamadas(n) {
    switch (n.type) {
      case 'identifier':
        return true;
      case 'number_literal':
        return true;
      case 'parenthesized_expression':
      case 'binary_expression':
        return this.cuentaSinLlamadas(n);
      case 'subscript_expression':
        return n.namedChildren.every((h) => this.lecturaSinLlamadas(h));
      case 'field_expression':
        return this.lecturaSinLlamadas(n.childForFieldName('argument'));
      default:
        return false;
    }
  }

  // La expresion de un return escrita con lo que valen las variables y, en "ida", las llamadas que hizo con sus argumentos (o,
  // en "vuelta", con lo que devolvieron). Devuelve { texto, registros }: las llamadas que se reemplazaron.
  sustituir(expr, hechas, modo) {
    const original = expr.text;
    if (!/^[\x00-\x7f]*$/.test(original)) return { texto: original.replace(/\s+/g, ' '), registros: [], partes: [original.replace(/\s+/g, ' ')] };
    const cambios = [];
    const registros = [];
    const recorrer = (n) => {
      if (n.type === 'call_expression') {
        const h = hechas.get(n.id);
        if (h) {
          cambios.push([n.startIndex, n.endIndex, modo === 'ida' ? h.registro.llamada : h.valor, h]);
          registros.push(h.registro);
          return;
        }
        const nombre = n.childForFieldName('function');
        for (const x of n.namedChildren) if (x.id !== nombre.id) recorrer(x);
        return;
      }
      if (n.type === 'identifier') {
        const t = this.textoDeVariable(n.text);
        if (t !== null) cambios.push([n.startIndex, n.endIndex, t]);
        return;
      }
      // Una cuenta que no llama a nada (n % 10) se escribe ya hecha: 3, y no 213 % 10. La expresion entera no: se queda
      // como cuenta (3 * 2) y su resultado se escribe aparte.
      const cuenta = n.type === 'binary_expression' && this.cuentaSinLlamadas(n);
      const lectura = (n.type === 'subscript_expression' || n.type === 'field_expression') && this.lecturaSinLlamadas(n);
      if (n.id !== expr.id && (cuenta || lectura)) {
        // Se evalua sin dejar rastro: lo que anota una lectura (flechas recorridas) es de la sentencia, no de este cartel.
        const accesos = [...this.accesos];
        const escrituras = this.escrituras.length;
        try {
          const t = textoEscalar(this.evaluar(n));
          if (t !== null) {
            cambios.push([n.startIndex, n.endIndex, t]);
            return;
          }
        } catch (e) {
          // no se pudo hacer: queda como esta escrita
        } finally {
          this.accesos.splice(0, this.accesos.length, ...accesos);
          this.escrituras.length = escrituras;
        }
      }
      for (const x of n.namedChildren) recorrer(x);
    };
    recorrer(expr);
    // La expresion en partes: el texto de siempre y, en cada llamada, { llamada, valor, id }; con eso la vista puede reemplazar
    // una llamada por su valor sin buscarla en el texto.
    const partes = [];
    let cursor = 0;
    for (const [desde, hasta, nuevo, h] of [...cambios].sort((a, b) => a[0] - b[0])) {
      const antes = original.slice(cursor, desde - expr.startIndex);
      if (antes) partes.push(antes);
      partes.push(h ? { llamada: h.registro.llamada, valor: h.valor, id: h.registro.id } : nuevo);
      cursor = hasta - expr.startIndex;
    }
    if (cursor < original.length) partes.push(original.slice(cursor));
    const juntas = [];
    for (const p of partes) {
      const t = typeof p === 'string' ? p.replace(/\s+/g, ' ') : null;
      if (t !== null && typeof juntas[juntas.length - 1] === 'string') juntas[juntas.length - 1] += t;
      else juntas.push(t !== null ? t : p);
    }
    if (typeof juntas[0] === 'string') juntas[0] = juntas[0].replace(/^ /, '');
    if (typeof juntas[juntas.length - 1] === 'string') juntas[juntas.length - 1] = juntas[juntas.length - 1].replace(/ $/, '');
    let texto = original;
    for (const [desde, hasta, nuevo] of cambios.sort((a, b) => b[0] - a[0])) {
      texto = texto.slice(0, desde - expr.startIndex) + nuevo + texto.slice(hasta - expr.startIndex);
    }
    return { texto: texto.replace(/\s+/g, ' '), registros, partes: juntas.filter((p) => p !== '') };
  }

  // El detalle de la ida de una fila (ayuda "Detallar la ida de las llamadas"): la linea tal cual esta en el codigo, con las variables
  // reemplazadas por su valor y con las cuentas resueltas ("resto = mayorDigito(n / 10)", "resto = mayorDigito(2132 / 10)", "resto =
  // mayorDigito(213)"). Es lo mismo que hace pasosDeCondicion con una pregunta, pero las llamadas que se hicieron son un tope: se
  // resuelven sus argumentos y la llamada queda escrita (se reemplaza por su valor en la vuelta). Devuelve { paso0, pasos, partes }, con
  // "paso0" la fotografia en que el cursor esta en esa linea, o null si no se sabe hacer (algo que no es un numero, una llamada que no se
  // anoto) o si el ultimo estado no es la ida que ya se muestra ("esperado").
  // "extraId": una llamada que se detalla aunque no se registro (la de main a sumaDigitos: ver llamada).
  detalleDeIda(expr, hechas, prefijo, paso0, esperado, extraId = null) {
    if (!this.opciones.traza || paso0 == null || !/^[\x00-\x7f]*$/.test(expr.text)) return null;
    const accesos = [...this.accesos];
    const escrituras = this.escrituras.length;
    const sinComentarios = (n) => n.namedChildren.filter((x) => x.type !== 'comment');
    const valorDe = (n) => {
      const t = textoEscalar(this.evaluar(n));
      if (t === null) throw new Error('un valor sin texto');
      return t;
    };
    const conocida = (n) => n.type === 'call_expression' && (hechas.has(n.id) || n.id === extraId);
    const conLlamada = (n) => conocida(n) || n.namedChildren.some(conLlamada);
    // "s": en que estado ya esta resuelto el nodo (0: no cambia; Infinity: una llamada o lo que la rodea, que no se resuelve en la ida).
    const analizar = (n) => {
      if (n.type === 'call_expression') {
        if (!conocida(n)) throw new Error('una llamada que no se anoto');
        return { n, s: Infinity, llamada: true, hijos: sinComentarios(n.childForFieldName('arguments')).map(analizar) };
      }
      if (conLlamada(n)) {
        if (!['parenthesized_expression', 'unary_expression', 'binary_expression'].includes(n.type)) throw new Error('algo que no se sabe detallar');
        return { n, s: Infinity, hijos: sinComentarios(n).map(analizar) };
      }
      switch (n.type) {
        case 'number_literal':
        case 'char_literal':
        case 'string_literal':
          return { n, s: 0, hijos: [] };
        case 'identifier':
          return this.textoDeVariable(n.text) !== null ? { n, s: 1, valor: valorDe(n), hijos: [] } : { n, s: 0, hijos: [] };
        case 'subscript_expression':
        case 'field_expression':
          if (!this.lecturaSinLlamadas(n)) throw new Error('una lectura que no se sabe detallar');
          return { n, s: 1, valor: valorDe(n), hijos: [] };
        case 'parenthesized_expression': {
          const h = analizar(n.namedChildren[0]);
          return { n, s: h.s, ...(h.s > 0 ? { valor: valorDe(n) } : {}), hijos: [h] };
        }
        case 'unary_expression': {
          const h = analizar(n.childForFieldName('argument'));
          return { n, s: 1 + h.s, valor: valorDe(n), hijos: [h] };
        }
        case 'binary_expression': {
          const izq = analizar(n.childForFieldName('left'));
          const der = analizar(n.childForFieldName('right'));
          // La cuenta de toda la expresion (n + 1) se queda como cuenta: su resultado va en la vuelta.
          if (n.id === expr.id) return { n, s: Infinity, hijos: [izq, der] };
          return { n, s: 1 + Math.max(izq.s, der.s), valor: valorDe(n), hijos: [izq, der] };
        }
        default:
          throw new Error('algo que no se sabe detallar');
      }
    };
    const nombreDe = (a) => a.n.childForFieldName('function').text;
    const dibujar = (a, k) => {
      if (a.s > 0 && a.s <= k) return a.valor;
      if (a.llamada) return nombreDe(a) + '(' + a.hijos.map((h) => dibujar(h, k)).join(', ') + ')';
      let t = a.n.text;
      for (const h of [...a.hijos].sort((x, y) => y.n.startIndex - x.n.startIndex)) {
        t = t.slice(0, h.n.startIndex - a.n.startIndex) + dibujar(h, k) + t.slice(h.n.endIndex - a.n.startIndex);
      }
      return t;
    };
    const partesDe = (a, k) => {
      if (a.s > 0 && a.s <= k) return [a.s === k ? { t: a.valor, antes: dibujar(a, k - 1).replace(/\s+/g, ' '), nuevo: true } : { t: a.valor }];
      if (a.llamada) {
        const salida = [{ t: nombreDe(a) + '(' }];
        a.hijos.forEach((h, i) => {
          if (i) salida.push({ t: ', ' });
          salida.push(...partesDe(h, k));
        });
        salida.push({ t: ')' });
        return salida;
      }
      const texto = a.n.text;
      const base = a.n.startIndex;
      const salida = [];
      let cursor = 0;
      for (const h of [...a.hijos].sort((x, y) => x.n.startIndex - y.n.startIndex)) {
        const desde = h.n.startIndex - base;
        if (desde > cursor) salida.push({ t: texto.slice(cursor, desde) });
        salida.push(...partesDe(h, k));
        cursor = h.n.endIndex - base;
      }
      if (cursor < texto.length) salida.push({ t: texto.slice(cursor) });
      return salida;
    };
    const ultimo = (a) => Math.max(0, ...(Number.isFinite(a.s) ? [a.s] : []), ...a.hijos.map(ultimo));
    try {
      const arbol = analizar(expr);
      const pasos = [];
      const partes = [];
      for (let k = 0; k <= ultimo(arbol); k++) {
        const lista = juntarPartes([{ t: prefijo }, ...partesDe(arbol, k)]);
        // el primero es la linea tal cual esta escrita
        const t = k === 0 ? (prefijo + expr.text).replace(/\s+/g, ' ') : lista.map((p) => p.t).join('');
        if (t.length > 110) return null;
        if (pasos[pasos.length - 1] !== t) {
          pasos.push(t);
          partes.push(lista);
        }
      }
      if (pasos.length < 2 || pasos[pasos.length - 1] !== esperado.replace(/\s+/g, ' ')) return null;
      return { paso0, pasos, partes };
    } catch (e) {
      return null;
    } finally {
      this.accesos.splice(0, this.accesos.length, ...accesos);
      this.escrituras.length = escrituras;
    }
  }

  // Lo que escribe la fila de una linea con una llamada hecha (ver lineaDeLlamada): { prefijo, expr }, o null.
  exprDeLinea(st, hechas) {
    switch (st.type) {
      case 'declaration':
        for (const d of st.namedChildren) {
          if (d.type !== 'init_declarator') continue;
          const valor = d.childForFieldName('value');
          if (valor && this.contieneLlamadaHecha(valor, hechas)) return { prefijo: d.childForFieldName('declarator').text + ' = ', expr: valor };
        }
        return null;
      case 'expression_statement': {
        const e = st.namedChildren.find((h) => h.type !== 'comment');
        if (!e) return null;
        if (e.type === 'assignment_expression') {
          const derecha = e.childForFieldName('right');
          return this.contieneLlamadaHecha(derecha, hechas) ? { prefijo: e.childForFieldName('left').text + ' ' + e.childForFieldName('operator').text + ' ', expr: derecha } : null;
        }
        return this.contieneLlamadaHecha(e, hechas) ? { prefijo: '', expr: e } : null;
      }
      case 'if_statement':
      case 'while_statement':
      case 'do_statement':
      case 'switch_statement': {
        const condicion = st.childForFieldName('condition');
        return condicion && this.contieneLlamadaHecha(condicion, hechas) ? { prefijo: st.type.replace('_statement', '') + ' ', expr: condicion } : null;
      }
      default:
        return null;
    }
  }

  // El return de una llamada registrada: su ida y su vuelta, y desde que fotografia se conocen.
  anotarRetorno(marco, expr, devuelto, conLlamada, retorno = null) {
    const r = marco.registro;
    const hechas = marco.hechas || new Map();
    const ida = this.sustituir(expr, hechas, 'ida');
    const vuelta = this.sustituir(expr, hechas, 'vuelta');
    // La ida se conoce cuando empieza la primera llamada que hace; sin llamadas, en la fotografia de retorno ("por devolver").
    const primera = ida.registros.length ? Math.min(...ida.registros.map((x) => x.desde)) : this.traza.length;
    r.ida = { texto: ida.texto, paso: primera, partes: ida.partes };
    const detalle = retorno ? this.detalleDeIda(expr, hechas, '', marco.fotos && marco.fotos.get(retorno.id), ida.texto) : null;
    if (detalle && detalle.paso0 < primera) r.ida.detalle = detalle;
    // La vuelta, cuando la caja esta por cerrarse (la fotografia de retorno que se saca a continuacion).
    r.vuelta = { texto: vuelta.texto, valor: textoDeValor(devuelto), paso: this.traza.length };
  }

  // "texto": la llamada escrita con lo que valen sus argumentos (sumaDigitos(1234)), para la fila de quien la hace en el trazado.
  ejecutarFuncion(f, args, origenes = [], registro = null, texto = null) {
    if (this.marcos.length >= MAX_MARCOS) throw new ErrorDelMotor('RECURSION_SIN_FIN', null, null, { profundidad: this.marcos.length });
    if (args.length !== f.params.length) {
      throw new ErrorDelMotor('SIN_VERIFICAR', `${f.nombre} recibe ${f.params.length} valores y se la llama con ${args.length}`);
    }
    this.llamadasDe.set(f.nombre, (this.llamadasDe.get(f.nombre) || 0) + 1);
    const marca = this.memoria.marcaDePila();
    const marco = { funcion: f.nombre, ambitos: [new Map()], declaraciones: f.declaraciones, cuerpoId: f.cuerpo ? f.cuerpo.id : null, registro, llamadaTexto: texto, desde: this.traza.length };
    marco.ambitos[0].marca = marca;
    this.marcos.push(marco);
    f.params.forEach((p, i) => {
      const reserva = this.nuevaLocal(p.nombre, p.tipo);
      this.asignarAlmacen(reserva.raiz, args[i]);
      this.anotarArgumento(origenes[i], args[i], this.ubicar(reserva, reserva.raiz), f.params.length);
    });
    let valor = null;
    // Las condiciones de la funcion no son parte de la condicion (a && b) que la llamo: cuentan por separado.
    const condicionesAfuera = this.enCondicion;
    this.enCondicion = 0;
    try {
      this.ejecutar(f.cuerpo);
    } catch (e) {
      if (!(e instanceof Retorno)) throw e;
      valor = e.valor;
    } finally {
      this.enCondicion = condicionesAfuera;
    }
    // Una funcion que termina sin return (void) y no hizo ninguna llamada a si misma: su caso base es el cierre de la llave.
    if (registro && registro.base === null && !(marco.hechas && marco.hechas.size)) registro.base = Math.max(0, this.traza.length - 1);
    let resultado;
    if (f.tipoRetorno.k === 'void') resultado = { t: VOID, v: null };
    else if (valor === null) resultado = { t: VOID, v: null, sinValor: true };
    else if (f.tipoRetorno.k === 'struct') {
      const copia = almacen(f.tipoRetorno);
      copiar(copia, valor.v);
      resultado = { t: f.tipoRetorno, v: copia };
    } else resultado = this.convertir(valor, f.tipoRetorno);
    // Una funcion que esta en la cadena de quienes llaman a una recursion (ver abrirRegistro): lo que devolvio y cuando termino.
    for (const e of marco.cadenas || []) {
      e.valor = resultado && !resultado.sinValor && resultado.t.k !== 'void' ? textoDeValor(resultado) : null;
      e.hasta = this.traza.length;
    }
    while (marco.ambitos.length) this.cerrarAmbito();
    this.marcos.pop();
    this.memoria.soltarPila(marca);
    return resultado;
  }

  // La fotografia de una funcion que esta por devolver un valor (solo la de una recursion; ver el return): lleva "retorno"
  // con el valor escrito. No toca los accesos ni lo demas que espera la proxima fotografia.
  fotoDeRetorno(n, rv) {
    if (!this.opciones.traza || this.traza.length >= MAX_TRAZA || rv.t.k === 'struct' || rv.t.k === 'void') return;
    const foto = fotografia(this, n.startPosition.row + 1);
    foto.retorno = { texto: textoDeValor(rv) };
    this.traza.push(foto);
  }

  // ----------------------------------------------------------- sentencias

  paso(n) {
    if (++this.pasos > this.maxPasos) throw new ErrorDelMotor('NO_TERMINA', null, n.startPosition.row + 1);
    this.fila = n.startPosition.row + 1;
    if (this.opciones.traza) {
      this.instantanea(this.fila);
      this.fotoDePaso = this.traza[this.traza.length - 1] || null;
      // La fotografia de cada sentencia de la funcion en curso (el cursor esta en ella): ver detalleDeIda.
      const marco = this.marcos[this.marcos.length - 1];
      if (marco && n.id != null) (marco.fotos ||= new Map()).set(n.id, this.traza.length - 1);
    }
  }

  // Ejecuta "cuerpo" en un ambito propio.
  conAmbito(cuerpo) {
    this.abrirAmbito();
    try {
      cuerpo();
    } catch (e) {
      if (esControl(e)) this.cerrarAmbito();
      throw e;
    }
    this.cerrarAmbito();
  }

  ejecutar(n) {
    switch (n.type) {
      case 'compound_statement':
        this.conAmbito(() => {
          for (const h of n.namedChildren) if (h.type !== 'comment') this.ejecutar(h);
          // El cuerpo de una funcion (que no es la primera) que termina sin return: la traza
          // muestra la llave de cierre, con sus variables todavia en la pila.
          const marco = this.marcos[this.marcos.length - 1];
          if (this.opciones.traza && this.marcos.length > 1 && marco.cuerpoId === n.id) this.instantanea(n.endPosition.row + 1);
        });
        return;
      case 'comment':
        return;
      case 'expression_statement':
        this.paso(n);
        if (n.namedChildren.length) this.evaluar(n.namedChildren[0]);
        return;
      case 'declaration':
        this.paso(n);
        this.declarar(n, false);
        return;
      case 'return_statement': {
        this.paso(n);
        const fotoDelReturn = this.traza.length - 1;
        const v = n.namedChildren.find((h) => h.type !== 'comment');
        const nombre = this.marcos[this.marcos.length - 1].funcion;
        const antes = this.llamadasDe.get(nombre) || 0;
        const devuelto = v ? this.evaluar(v) : null;
        // Una funcion que devuelve algo calculado con una llamada a si misma (una recursion): antes de cerrar su caja se
        // muestra lo que devuelve, asi las cajas se cierran de a una y se ve el valor que sube.
        const conLlamada = Boolean(devuelto) && (this.llamadasDe.get(nombre) || 0) > antes;
        const actual = this.marcos[this.marcos.length - 1];
        // Lo que devuelve se escribe con el tipo de retorno de la funcion (un enumerado: FALSO y no 0, aunque la cuenta sea de int).
        const tipoDeRetorno = this.funciones.get(nombre) && this.funciones.get(nombre).tipoRetorno;
        const escrito = devuelto && tipoDeRetorno && tipoDeRetorno.enumerados && typeof devuelto.v === 'number' ? { t: tipoDeRetorno, v: devuelto.v } : devuelto;
        // Toda llamada de una funcion recursiva que devuelve un valor termina con un paso "por devolver X" (la fotografia de retorno,
        // con el cursor sobre el return): ahi se conoce lo que devuelve y, si es el caso base, se anuncia.
        // (tambien la de una funcion que prepara una recursion, como sumaDigitos: asi su fila vuelve en su propio paso)
        const conRetorno = Boolean(devuelto) && (conLlamada || Boolean(actual.registro) || Boolean(actual.cadenas && actual.llamadaTexto != null));
        const pasoRetorno = conRetorno ? this.traza.length : fotoDelReturn;
        // Un return de una llamada registrada que no hizo ninguna otra llamada a la funcion es su caso base.
        if (actual.registro && actual.registro.base === null && !(actual.hechas && actual.hechas.size)) actual.registro.base = pasoRetorno;
        if (devuelto && actual.registro && v && this.opciones.traza) {
          if (actual.lineas && actual.lineas.size) this.armarFilaConLineas(actual, { expr: v, devuelto: escrito, conLlamada, paso: pasoRetorno });
          else this.anotarRetorno(actual, v, escrito, conLlamada, n);
        }
        if (conRetorno) this.fotoDeRetorno(n, escrito);
        throw new Retorno(devuelto);
      }
      case 'break_statement':
        this.paso(n);
        throw ROMPER;
      case 'continue_statement':
        this.paso(n);
        throw CONTINUAR;
      case 'if_statement': {
        this.paso(n);
        if (this.condicion(n.childForFieldName('condition'), 'paso')) this.ejecutar(n.childForFieldName('consequence'));
        else {
          const alt = n.childForFieldName('alternative');
          if (alt) this.ejecutar(alt.type === 'else_clause' ? alt.namedChildren[0] : alt);
        }
        return;
      }
      case 'while_statement':
        this.paso(n);
        while (this.condicion(n.childForFieldName('condition'), 'paso')) {
          if (this.cuerpoDeCiclo(n.childForFieldName('body'))) break;
          this.paso(n);
        }
        return;
      case 'do_statement': {
        this.paso(n);
        do {
          if (this.cuerpoDeCiclo(n.childForFieldName('body'))) break;
          this.paso(n.childForFieldName('condition'));
        } while (this.condicion(n.childForFieldName('condition'), 'paso'));
        return;
      }
      case 'for_statement':
        this.paso(n);
        this.conAmbito(() => {
          const ini = n.childForFieldName('initializer');
          if (ini) {
            if (ini.type === 'declaration') this.declarar(ini, false);
            else this.evaluar(ini);
          }
          const cond = n.childForFieldName('condition');
          const act = n.childForFieldName('update');
          let trasInicio = Boolean(ini); // la primera pregunta viene despues de la inicializacion
          while (!cond || this.condicion(cond, trasInicio ? 'nuevo' : 'paso')) {
            trasInicio = false;
            if (this.cuerpoDeCiclo(n.childForFieldName('body'))) break;
            if (act) this.evaluar(act);
            this.paso(n);
          }
        });
        return;
      case 'switch_statement':
        this.paso(n);
        this.cambiar(n);
        return;
      default:
        throw new ErrorDelMotor('SIN_VERIFICAR', `la sentencia ${n.type}`, n.startPosition.row + 1);
    }
  }

  // Ejecuta el cuerpo de un ciclo; devuelve true si hubo un break.
  cuerpoDeCiclo(cuerpo) {
    try {
      this.ejecutar(cuerpo);
    } catch (e) {
      if (e === ROMPER) return true;
      if (e !== CONTINUAR) throw e;
    }
    return false;
  }

  cambiar(n) {
    const valor = this.evaluar(n.childForFieldName('condition'));
    const casos = n.childForFieldName('body').namedChildren.filter((h) => h.type === 'case_statement');
    let desde = casos.findIndex((c) => c.childForFieldName('value') && this.evaluar(c.childForFieldName('value')).v === valor.v);
    if (desde < 0) desde = casos.findIndex((c) => !c.childForFieldName('value'));
    if (desde < 0) return;
    this.conAmbito(() => {
      try {
        for (let i = desde; i < casos.length; i++) {
          const v = casos[i].childForFieldName('value');
          for (const h of casos[i].namedChildren) {
            if (v && h.id === v.id) continue;
            if (h.type !== 'comment') this.ejecutar(h);
          }
        }
      } catch (e) {
        if (e !== ROMPER) throw e;
      }
    });
  }

  // --------------------------------------------------------- biblioteca

  biblioteca(nombre, nodos, n) {
    const arg = (i) => this.evaluar(nodos[i]);
    const entero = (v) => ({ t: INT, v });
    this.fila = n.startPosition.row + 1;
    switch (nombre) {
      case 'printf': {
        const formato = this.cadenaDe(arg(0).v);
        // Para el reproductor: las casillas de las que salen los valores que se van a mostrar, anotadas para la fotografia
        // siguiente (la que ya tiene el texto en la salida).
        const detalle = Boolean(this.opciones.traza && this.opciones.preguntas);
        const celdas = [];
        const args = nodos.slice(1).map((h) => {
          if (!detalle) return this.evaluar(h);
          const { rv, celda } = this.evaluarConOrigen(h);
          if (celda) celdas.push(celda);
          else this.celdasDeExpresion(h, celdas);
          return rv;
        });
        if (detalle) {
          const unicas = celdas.filter((x, i) => celdas.findIndex((y) => y.a === x.a && y.ruta.join('/') === x.ruta.join('/')) === i).slice(0, 8);
          if (unicas.length) this.muestraHecha = { celdas: unicas };
        }
        const texto = formatear(formato, args, { cadenaDe: (p) => this.cadenaDe(p), direccionDe });
        this.escribirSalida(texto);
        return entero(texto.length);
      }
      case 'puts':
        this.escribirSalida(this.cadenaDe(arg(0).v) + '\n');
        return entero(1);
      case 'putchar': {
        const c = arg(0).v;
        this.escribirSalida(String.fromCharCode(c & 255));
        return entero(c);
      }
      case 'scanf':
        return this.leer(nodos);
      case 'malloc': {
        const bytes = this.bytesPedidos(this.entero(arg(0), 'malloc'));
        const r = this.memoria.reservar(bytes);
        return { t: puntero(VOID), v: r ? { reserva: r, st: undefined, arr: null, i: 0, sinTipo: true } : null };
      }
      case 'calloc': {
        const bytes = this.bytesPedidos(this.entero(arg(0), 'calloc') * this.entero(arg(1), 'calloc'));
        const r = this.memoria.reservar(bytes, true);
        return { t: puntero(VOID), v: r ? { reserva: r, st: undefined, arr: null, i: 0, sinTipo: true } : null };
      }
      case 'realloc':
        return this.reasignar(arg(0), this.bytesPedidos(this.entero(arg(1), 'realloc')));
      case 'free':
        this.lectura(nodos[0]);
        const liberado = arg(0).v;
        this.liberar(liberado);
        // Se ve la casilla del puntero, el recorrido de su flecha hasta el bloque y el bloque, que es lo que se libera.
        const origen = this.casillaDeLiberacion(nodos[0]);
        // (la lectura de la casilla se deja: es el primer resalte, antes de que parta el flujo)
        const bloque = origen && liberado && this.opciones.traza ? this.ubicar(liberado.reserva, liberado.reserva.raiz) : null;
        if (bloque && this.accesos.length < 8) this.accesos.push({ de: origen, a: bloque });
        return { t: VOID, v: null };
      case 'strlen':
        return { t: TAMANO_T, v: this.cadenaDe(arg(0).v).length };
      case 'strcpy': {
        const destino = arg(0);
        this.escribirCadena(destino.v, this.cadenaDe(arg(1).v));
        return destino;
      }
      case 'strcat': {
        const destino = arg(0);
        this.escribirCadena(destino.v, this.cadenaDe(destino.v) + this.cadenaDe(arg(1).v));
        return destino;
      }
      case 'strcmp': {
        const a = this.cadenaDe(arg(0).v);
        const b = this.cadenaDe(arg(1).v);
        return entero(a < b ? -1 : a > b ? 1 : 0);
      }
      case 'abs':
        return entero(Math.abs(arg(0).v));
      case 'sqrt':
        return { t: DOUBLE, v: Math.sqrt(arg(0).v) };
      case 'pow':
        return { t: DOUBLE, v: Math.pow(arg(0).v, arg(1).v) };
      case 'exit':
        throw new Salida(arg(0).v);
      case 'fflush':
      case 'srand':
        return entero(0);
      default:
        throw new ErrorDelMotor('FUNCION_DESCONOCIDA', `${nombre} no existe`, n.startPosition.row + 1, { nombre });
    }
  }

  entero(rv, nombre) {
    if (rv.t.k !== 'int') throw new ErrorDelMotor('SIN_VERIFICAR', `${nombre} con un valor que no es entero`);
    return rv.v;
  }

  // La cantidad de bytes que se pide a malloc: un numero negativo es, para el lenguaje, uno enorme
  // (el parametro es sin signo), asi que no se puede reservar.
  bytesPedidos(v) {
    return v < 0 ? 2 ** 64 + v : v;
  }

  escribirSalida(texto) {
    this.salida += texto;
    if (this.salida.length > MAX_SALIDA) throw new ErrorDelMotor('NO_TERMINA', 'el programa muestra demasiado texto');
  }

  // La casilla del puntero que se le da a free, cuando es una variable (free(p)).
  casillaDeLiberacion(n) {
    while (n && n.type === 'parenthesized_expression') n = n.namedChildren[0];
    if (!n || n.type !== 'identifier') return null;
    const v = this.buscar(n.text);
    if (!v || !v.reserva.raiz || !v.reserva.raiz.t || v.reserva.raiz.t.k !== 'ptr') return null;
    return this.ubicar(v.reserva, v.reserva.raiz);
  }

  liberar(p) {
    if (p === undefined) throw new ErrorDelMotor('PUNTERO_SIN_INICIALIZAR');
    if (p === null) return;
    const r = p.reserva;
    if (r.region !== 'monticulo') throw new ErrorDelMotor('LIBERACION_INVALIDA', 'free recibe algo que no viene de malloc', null, { nombre: r.nombre, region: r.region });
    if (!r.vivo) throw new ErrorDelMotor('LIBERACION_DOBLE', null, null, { dir: r.dir });
    const alComienzo = p.sinTipo || (p.arr === r.raiz && p.i === 0);
    if (!alComienzo) throw new ErrorDelMotor('LIBERACION_INVALIDA', 'free recibe una direccion del medio del bloque', null, { dir: direccionDe(p) });
    this.memoria.liberar(r);
  }

  reasignar(rp, bytes) {
    const p = rp.v;
    if (p === null) {
      const r = this.memoria.reservar(bytes);
      return { t: puntero(VOID), v: r ? { reserva: r, st: undefined, arr: null, i: 0, sinTipo: true } : null };
    }
    if (p === undefined) throw new ErrorDelMotor('PUNTERO_SIN_INICIALIZAR');
    const vieja = p.reserva;
    if (vieja.region !== 'monticulo') throw new ErrorDelMotor('LIBERACION_INVALIDA', 'realloc recibe algo que no viene de malloc');
    if (!vieja.vivo) throw new ErrorDelMotor('USO_DE_MEMORIA_LIBERADA', null, null, { dir: vieja.dir });
    const nueva = this.memoria.reservar(bytes);
    if (!nueva) return { t: puntero(VOID), v: null };
    if (vieja.raiz) {
      this.memoria.tiparBloque(nueva, vieja.tipoElemento);
      const cuantos = Math.min(vieja.raiz.elems.length, nueva.raiz.elems.length);
      for (let i = 0; i < cuantos; i++) copiar(nueva.raiz.elems[i], vieja.raiz.elems[i]);
    }
    this.memoria.liberar(vieja);
    if (nueva.raiz) return { t: puntero(vieja.tipoElemento), v: punteroEnArreglo(nueva, nueva.raiz, 0) };
    return { t: puntero(VOID), v: { reserva: nueva, st: undefined, arr: null, i: 0, sinTipo: true } };
  }

  leer(nodos) {
    const formato = this.cadenaDe(this.evaluar(nodos[0]).v);
    const destinos = nodos.slice(1).map((h) => {
      // scanf("%d", n): falta el &. Se avisa antes de leer n, que todavia no tiene valor.
      const t = this.tipoDe(h);
      if (t.k === 'int' || t.k === 'float' || t.k === 'struct') {
        throw new ErrorDelMotor('AMPERSAND_FALTA', 'scanf recibe el valor de una variable en lugar de su direccion', h.startPosition.row + 1, { texto: h.text });
      }
      // Si el destino es una variable puntero (scanf("%d", p)), se anota de donde sale: el valor se guarda siguiendo su flecha.
      if (this.opciones.traza && this.opciones.preguntas) {
        const { rv, origen } = this.evaluarConOrigen(h);
        return { ...rv, origen };
      }
      return this.evaluar(h);
    });
    const piezas = piezasDeScanf(formato);
    let k = 0;
    let asignados = 0;
    const inicioDeLectura = this.entrada.pos;
    const celdasLeidas = []; // las casillas que reciben los valores (para el reproductor)
    const bytesDe = { '': 4, h: 2, hh: 1, l: 8, ll: 8, L: 8 };
    for (const p of piezas) {
      if (p.blanco) {
        this.entrada.saltarBlancos();
        continue;
      }
      if (p.literal) {
        this.entrada.saltarBlancos();
        if (!this.entrada.coincide(p.literal)) break;
        continue;
      }
      let valor;
      if (p.conv === 'c') {
        valor = this.entrada.caracter();
        if (valor === null) break;
      } else if (p.conv === 's') {
        valor = this.entrada.palabra(p.ancho);
        if (valor === '') break;
      } else {
        const decimal = 'feEgG'.includes(p.conv);
        valor = this.entrada.numero(decimal);
        if (valor === null) break;
      }
      if (p.ignorar) continue;
      if (k >= destinos.length) throw new ErrorDelMotor('SIN_VERIFICAR', 'scanf tiene mas conversiones que variables');
      const d = destinos[k++];
      if (d.t.k !== 'ptr') throw new ErrorDelMotor('AMPERSAND_FALTA', 'scanf recibe el valor de una variable en lugar de su direccion', null, { conv: p.conv });
      if (d.origen && d.v) this.acceso(d.origen, this.deref(d.v)); // el recorrido por la flecha del puntero
      if (p.conv === 's') {
        this.escribirCadena(d.v, valor);
      } else {
        const lv = this.deref(d.v);
        const t = lv.st.t;
        const decimal = 'feEgG'.includes(p.conv);
        const concuerda =
          p.conv === 'c'
            ? t.k === 'int' && t.bytes === 1
            : decimal
              ? t.k === 'float' && t.bytes === (p.largo === 'l' || p.largo === 'L' ? 8 : 4)
              : t.k === 'int' && t.bytes === bytesDe[p.largo];
        if (!concuerda) throw new ErrorDelMotor('FORMATO_DISTINTO', `%${p.largo}${p.conv} no corresponde a ${textoDeTipo(t)}`, null, { conv: `%${p.largo}${p.conv}`, tipo: textoDeTipo(t) });
        if (lv.reserva.soloLectura) throw new ErrorDelMotor('ESCRITURA_EN_TEXTO');
        lv.st.v = p.conv === 'c' ? valor.charCodeAt(0) : t.k === 'int' ? ajustar(valor, t) : t.bytes === 4 ? Math.fround(valor) : valor;
      }
      asignados++;
      if (this.opciones.traza && this.opciones.preguntas) {
        const s = serializarPuntero(d.v);
        if (s.k === 'ptr') celdasLeidas.push({ a: s.a, ruta: s.ruta });
      }
    }
    if (this.opciones.traza && this.opciones.preguntas) {
      // Para el reproductor: el trozo de la entrada que se leyo (sin los blancos del comienzo) y adonde fue a parar.
      let desde = inicioDeLectura;
      while (desde < this.entrada.pos && /\s/.test(this.entrada.texto[desde])) desde++;
      const agotada = asignados === 0 && this.entrada.agotada;
      if (celdasLeidas.length || agotada) this.lecturaHecha = { desde, hasta: this.entrada.pos, celdas: celdasLeidas, agotada };
    }
    return { t: INT, v: asignados === 0 && this.entrada.agotada ? -1 : asignados };
  }
}

export function ejecutar(analizador, fuente, opciones = {}) {
  const arbol = analizador.parse(fuente);
  try {
    const motor = new Interprete(analizador, arbol, opciones);
    motor.correr();
    return motor.resultado();
  } finally {
    arbol.delete();
  }
}
