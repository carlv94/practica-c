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
import { fotografia } from './traza.js';

const TAMANO_T = { k: 'int', nombre: 'unsigned long', bytes: 8, sinSigno: true };
const MAX_PASOS = 200000;
const MAX_MARCOS = 200;
const MAX_TRAZA = 5000;
const MAX_SALIDA = 1000000;

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
    this.error = null;
    this.retorno = null;
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
      traza: this.traza,
      pasos: this.pasos,
      funciones: [...this.funciones.values()].map((f) => ({ nombre: f.nombre, desde: f.desde, hasta: f.hasta })),
    };
  }

  instantanea(linea, error = null) {
    if (this.traza.length >= MAX_TRAZA) return;
    const foto = fotografia(this, linea);
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
        const cuerpo = n.childForFieldName('body');
        if (cuerpo) {
          let valor = 0;
          for (const e of cuerpo.namedChildren) {
            if (e.type !== 'enumerator') continue;
            const v = e.childForFieldName('value');
            if (v) valor = this.constante(v);
            this.constantes.set(e.childForFieldName('name').text, valor++);
          }
        }
        return INT;
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
      if (init) this.inicializar(reserva.raiz, init);
    }
  }

  textoLiteral(n) {
    if (n.type === 'string_literal') return decodificar(n.text.slice(1, -1));
    if (n.type === 'concatenated_string') return n.namedChildren.flatMap((h) => this.textoLiteral(h));
    throw new ErrorDelMotor('SIN_VERIFICAR', 'un arreglo de letras que no se inicializa con un texto', n.startPosition.row + 1);
  }

  inicializar(st, init) {
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

  convertir(rv, destino) {
    this.usable(rv);
    switch (destino.k) {
      case 'int':
        if (rv.t.k === 'ptr') throw new ErrorDelMotor('SIN_VERIFICAR', 'una direccion guardada en un entero');
        if (rv.t.k === 'struct') throw new ErrorDelMotor('ASIGNACION_INVALIDA', 'una estructura en un numero');
        return { t: destino, v: ajustar(rv.v, destino) };
      case 'float':
        if (rv.t.k === 'ptr') throw new ErrorDelMotor('SIN_VERIFICAR', 'una direccion guardada en un decimal');
        return { t: destino, v: destino.bytes === 4 ? Math.fround(rv.v) : rv.v };
      case 'ptr': {
        if (rv.t.k === 'int') {
          if (rv.v === 0) return { t: destino, v: null };
          throw new ErrorDelMotor('SIN_VERIFICAR', 'un numero guardado en un puntero');
        }
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

  condicion(n) {
    const rv = this.evaluar(n);
    this.usable(rv);
    if (rv.t.k === 'struct') throw new ErrorDelMotor('ASIGNACION_INVALIDA', 'una estructura como condicion');
    if (rv.t.k === 'ptr') return rv.v !== null;
    return rv.v !== 0;
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
        const p = this.evaluar(n.childForFieldName('argument'));
        if (p.t.k !== 'ptr') throw new ErrorDelMotor('SIN_VERIFICAR', 'un * sobre algo que no es un puntero');
        if (p.t.a.k === 'void') throw new ErrorDelMotor('SIN_VERIFICAR', 'un * sobre un puntero void');
        return this.deref(p.v);
      }
      case 'subscript_expression': {
        const base = this.evaluar(n.childForFieldName('argument'));
        const indice = this.evaluar(n.childForFieldName('index') || n.childForFieldName('indices'));
        if (base.t.k !== 'ptr') throw new ErrorDelMotor('SIN_VERIFICAR', 'corchetes sobre algo que no es un arreglo ni un puntero');
        if (indice.t.k !== 'int') throw new ErrorDelMotor('SIN_VERIFICAR', 'un indice que no es entero');
        return this.deref(this.mover(base.v, indice.v));
      }
      case 'field_expression': {
        const flecha = n.children.some((h) => h.type === '->');
        const nombre = n.childForFieldName('field').text;
        let sobre;
        if (flecha) {
          const p = this.evaluar(n.childForFieldName('argument'));
          if (p.t.k !== 'ptr' || p.t.a.k !== 'struct') throw new ErrorDelMotor('SIN_VERIFICAR', 'una flecha sobre algo que no apunta a una estructura');
          sobre = this.deref(p.v);
        } else {
          sobre = this.lvalor(n.childForFieldName('argument'));
          if (sobre.st.t.k !== 'struct') throw new ErrorDelMotor('SIN_VERIFICAR', 'un punto sobre algo que no es una estructura');
        }
        const campo = sobre.st.campos.get(nombre);
        if (!campo) throw new ErrorDelMotor('CAMPO_DESCONOCIDO', `la estructura no tiene un campo ${nombre}`, n.startPosition.row + 1, { campo: nombre });
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
      case 'binary_expression':
        return this.binaria(n);
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
        return this.convertir(rv, t);
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
    return prefijo ? despues : antes;
  }

  asignacion(n) {
    const op = n.childForFieldName('operator').text;
    const lv = this.lvalor(n.childForFieldName('left'));
    let rv = this.evaluar(n.childForFieldName('right'));
    if (op !== '=') {
      const actual = this.valorDe(lv, n.childForFieldName('left').text);
      rv = this.operar(op.slice(0, -1), actual, rv);
    }
    if (lv.st.t.k !== 'struct') rv = this.convertir(rv, lv.st.t);
    this.escribir(lv, rv);
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
      this.fila = n.startPosition.row + 1;
      return this.ejecutarFuncion(propia, args);
    }
    return this.biblioteca(f.text, nodos, n);
  }

  ejecutarFuncion(f, args) {
    if (this.marcos.length >= MAX_MARCOS) throw new ErrorDelMotor('RECURSION_SIN_FIN', null, null, { profundidad: this.marcos.length });
    if (args.length !== f.params.length) {
      throw new ErrorDelMotor('SIN_VERIFICAR', `${f.nombre} recibe ${f.params.length} valores y se la llama con ${args.length}`);
    }
    const marca = this.memoria.marcaDePila();
    const marco = { funcion: f.nombre, ambitos: [new Map()], declaraciones: f.declaraciones, cuerpoId: f.cuerpo ? f.cuerpo.id : null };
    marco.ambitos[0].marca = marca;
    this.marcos.push(marco);
    f.params.forEach((p, i) => {
      const reserva = this.nuevaLocal(p.nombre, p.tipo);
      this.asignarAlmacen(reserva.raiz, args[i]);
    });
    let valor = null;
    try {
      this.ejecutar(f.cuerpo);
    } catch (e) {
      if (!(e instanceof Retorno)) throw e;
      valor = e.valor;
    }
    let resultado;
    if (f.tipoRetorno.k === 'void') resultado = { t: VOID, v: null };
    else if (valor === null) resultado = { t: VOID, v: null, sinValor: true };
    else if (f.tipoRetorno.k === 'struct') {
      const copia = almacen(f.tipoRetorno);
      copiar(copia, valor.v);
      resultado = { t: f.tipoRetorno, v: copia };
    } else resultado = this.convertir(valor, f.tipoRetorno);
    while (marco.ambitos.length) this.cerrarAmbito();
    this.marcos.pop();
    this.memoria.soltarPila(marca);
    return resultado;
  }

  // ----------------------------------------------------------- sentencias

  paso(n) {
    if (++this.pasos > this.maxPasos) throw new ErrorDelMotor('NO_TERMINA', null, n.startPosition.row + 1);
    this.fila = n.startPosition.row + 1;
    if (this.opciones.traza) this.instantanea(this.fila);
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
        const v = n.namedChildren.find((h) => h.type !== 'comment');
        throw new Retorno(v ? this.evaluar(v) : null);
      }
      case 'break_statement':
        this.paso(n);
        throw ROMPER;
      case 'continue_statement':
        this.paso(n);
        throw CONTINUAR;
      case 'if_statement': {
        this.paso(n);
        if (this.condicion(n.childForFieldName('condition'))) this.ejecutar(n.childForFieldName('consequence'));
        else {
          const alt = n.childForFieldName('alternative');
          if (alt) this.ejecutar(alt.type === 'else_clause' ? alt.namedChildren[0] : alt);
        }
        return;
      }
      case 'while_statement':
        this.paso(n);
        while (this.condicion(n.childForFieldName('condition'))) {
          if (this.cuerpoDeCiclo(n.childForFieldName('body'))) break;
          this.paso(n);
        }
        return;
      case 'do_statement': {
        this.paso(n);
        do {
          if (this.cuerpoDeCiclo(n.childForFieldName('body'))) break;
          this.paso(n.childForFieldName('condition'));
        } while (this.condicion(n.childForFieldName('condition')));
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
          while (!cond || this.condicion(cond)) {
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
        const args = nodos.slice(1).map((h) => this.evaluar(h));
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
        const bytes = this.entero(arg(0), 'malloc');
        const r = this.memoria.reservar(bytes);
        return { t: puntero(VOID), v: r ? { reserva: r, st: undefined, arr: null, i: 0, sinTipo: true } : null };
      }
      case 'calloc': {
        const bytes = this.entero(arg(0), 'calloc') * this.entero(arg(1), 'calloc');
        const r = this.memoria.reservar(bytes, true);
        return { t: puntero(VOID), v: r ? { reserva: r, st: undefined, arr: null, i: 0, sinTipo: true } : null };
      }
      case 'realloc':
        return this.reasignar(arg(0), this.entero(arg(1), 'realloc'));
      case 'free':
        this.liberar(arg(0).v);
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

  escribirSalida(texto) {
    this.salida += texto;
    if (this.salida.length > MAX_SALIDA) throw new ErrorDelMotor('NO_TERMINA', 'el programa muestra demasiado texto');
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
      return this.evaluar(h);
    });
    const piezas = piezasDeScanf(formato);
    let k = 0;
    let asignados = 0;
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
