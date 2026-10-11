// Del arbol que arma el analizador a un modelo de lo declarado: que estructuras
// hay, que alias y que variables. Las reglas de las consignas miran este
// modelo, nunca el texto: por eso da igual como se llame la estructura, que
// dimension tengan las cadenas o como este acomodado el codigo.
//
//   struct:   { id, etiqueta, campos, nuevo, fila }
//   campo:    { nombre, tipo, arreglo, punteros, fila }
//   alias:    { nombre, tipo, arreglo, punteros, nuevo, fila }
//   variable: { nombre, tipo, arreglo, punteros, local, esConst, inicializada, nuevo, fila }
//   constante: { nombre, valor, clase: 'define' | 'enum', nuevo, fila }
//
// "arreglo" son las dimensiones como estan escritas (['20'], ['MAX']), y lo
// declarado lleva tambien "indice", su lugar en el codigo, para saber que
// esta antes de que.
//
// y de las sentencias, lo que hace falta para las consignas de "escriba el
// codigo que...": las llamadas a funciones con sus argumentos, las
// asignaciones y si hay algun ciclo.
//   llamada:    { funcion, argumentos, nuevo, fila }
//   asignacion: { izquierda, derecha, nuevo, fila }
//   ciclo:      { nuevo, fila }
// Un argumento (o un lado de una asignacion) es:
//   { clase: 'nombre', nombre }       cadena1
//   { clase: 'cadena', contenido }    "cadena1"
//   { clase: 'direccion', nombre }    &cadena1
//   { clase: 'indice', nombre }       cadena1[0]
//   { clase: 'otro' }                 cualquier otra expresion
// todos con "texto", que es como esta escrito.
//
// "tipo" es el tipo tal como esta escrito:
//   { clase: 'primitivo', nombre: 'unsigned int' }
//   { clase: 'struct', etiqueta: 'Puesto', defId }   defId si trae el cuerpo ahi mismo
//   { clase: 'nombre', nombre: 'PuestoT' }           un alias, o algo que no existe
//   { clase: 'otro', texto }
//
// "nuevo" separa lo que el alumno escribio en esta consigna de lo que ya traia
// de las anteriores, que se analiza junto para poder resolver los nombres.

// Segun la version del analizador, algunos datos son propiedades y otros metodos.
function dato(objeto, nombre) {
  const valor = objeto[nombre];
  return typeof valor === 'function' ? valor.call(objeto) : valor;
}

// Una declaracion puede traer varios declaradores: int a, b, c;
function hijosDeCampo(nodo, campo) {
  const hijos = [];
  const cursor = nodo.walk();
  if (cursor.gotoFirstChild()) {
    do {
      if (dato(cursor, 'currentFieldName') === campo) hijos.push(dato(cursor, 'currentNode'));
    } while (cursor.gotoNextSibling());
  }
  if (cursor.delete) cursor.delete();
  return hijos;
}

// De "*nombre[20] = ..." saca el nombre y lo que lo rodea.
function desenvolver(nodo) {
  const d = { nombre: null, arreglo: [], punteros: 0, esFuncion: false, inicializada: false };
  let n = nodo;
  while (n) {
    switch (n.type) {
      case 'init_declarator':
        d.inicializada = true;
        n = n.childForFieldName('declarator');
        break;
      case 'array_declarator': {
        const dimension = n.childForFieldName('size');
        d.arreglo.unshift(dimension ? dimension.text : '');
        n = n.childForFieldName('declarator');
        break;
      }
      case 'pointer_declarator':
        d.punteros++;
        n = n.childForFieldName('declarator');
        break;
      case 'function_declarator':
        d.esFuncion = true;
        n = n.childForFieldName('declarator');
        break;
      case 'parenthesized_declarator':
        n = n.namedChild(0);
        break;
      case 'identifier':
      case 'field_identifier':
      case 'type_identifier':
        d.nombre = n.text;
        n = null;
        break;
      default:
        n = null;
    }
  }
  return d;
}

export function construirModelo(arbol, desde) {
  const modelo = {
    structs: [],
    aliases: [],
    variables: [],
    constantes: [],
    llamadas: [],
    asignaciones: [],
    ciclos: [],
  };

  // Un argumento, o un lado de una asignacion.
  function leerValor(n) {
    const texto = n.text;
    switch (n.type) {
      case 'identifier':
        return { clase: 'nombre', nombre: texto, texto };
      case 'string_literal':
        return { clase: 'cadena', contenido: texto.slice(1, -1), texto };
      case 'pointer_expression': {
        const de = n.childForFieldName('argument');
        return texto.startsWith('&') && de && de.type === 'identifier'
          ? { clase: 'direccion', nombre: de.text, texto }
          : { clase: 'otro', texto };
      }
      case 'subscript_expression': {
        const de = n.childForFieldName('argument');
        return { clase: 'indice', nombre: de ? de.text : null, texto };
      }
      default:
        return { clase: 'otro', texto };
    }
  }
  const structDeNodo = new Map();

  function registrarStruct(n) {
    if (structDeNodo.has(n.id)) return structDeNodo.get(n.id);
    const nombre = n.childForFieldName('name');
    const def = {
      id: modelo.structs.length,
      etiqueta: nombre ? nombre.text : null,
      campos: [],
      nuevo: n.startIndex >= desde,
      fila: n.startPosition.row,
    };
    structDeNodo.set(n.id, def);
    modelo.structs.push(def);

    for (const hijo of n.childForFieldName('body').namedChildren) {
      if (hijo.type !== 'field_declaration') continue;
      const tipo = leerTipo(hijo.childForFieldName('type'));
      for (const declarador of hijosDeCampo(hijo, 'declarator')) {
        const d = desenvolver(declarador);
        if (d.nombre) {
          def.campos.push({
            ...d,
            tipo,
            fila: declarador.startPosition.row,
            indice: declarador.startIndex,
          });
        }
      }
    }
    return def;
  }

  function leerTipo(n) {
    if (!n) return { clase: 'otro', texto: '' };
    switch (n.type) {
      case 'struct_specifier': {
        const nombre = n.childForFieldName('name');
        const def = n.childForFieldName('body') ? registrarStruct(n) : null;
        return { clase: 'struct', etiqueta: nombre ? nombre.text : null, defId: def ? def.id : null };
      }
      case 'primitive_type':
      case 'sized_type_specifier':
        return { clase: 'primitivo', nombre: n.text.replace(/\s+/g, ' ').trim() };
      case 'type_identifier':
        return { clase: 'nombre', nombre: n.text };
      default:
        return { clase: 'otro', texto: n.text };
    }
  }

  (function visitar(n, local) {
    switch (n.type) {
      case 'struct_specifier':
        leerTipo(n);
        break;
      case 'declaration':
      case 'type_definition': {
        const tipo = leerTipo(n.childForFieldName('type'));
        const destino = n.type === 'declaration' ? modelo.variables : modelo.aliases;
        const esConst = n.children.some((h) => h.type === 'type_qualifier' && h.text === 'const');
        for (const declarador of hijosDeCampo(n, 'declarator')) {
          const d = desenvolver(declarador);
          // Un prototipo de funcion no es una variable.
          if (!d.nombre || d.esFuncion) continue;
          destino.push({
            ...d,
            tipo,
            local,
            esConst,
            nuevo: n.startIndex >= desde,
            fila: declarador.startPosition.row,
            indice: declarador.startIndex,
          });
        }
        break;
      }
      case 'preproc_def':
      case 'enumerator': {
        const nombre = n.childForFieldName('name');
        const valor = n.childForFieldName('value');
        if (nombre) {
          modelo.constantes.push({
            nombre: nombre.text,
            valor: valor ? valor.text.trim() : '',
            clase: n.type === 'preproc_def' ? 'define' : 'enum',
            nuevo: n.startIndex >= desde,
            fila: n.startPosition.row,
            indice: n.startIndex,
          });
        }
        break;
      }
      case 'function_definition':
        local = true;
        break;
      case 'call_expression': {
        const funcion = n.childForFieldName('function');
        const argumentos = n.childForFieldName('arguments');
        modelo.llamadas.push({
          funcion: funcion ? funcion.text : '',
          argumentos: argumentos
            ? argumentos.namedChildren.filter((a) => a.type !== 'comment').map(leerValor)
            : [],
          nuevo: n.startIndex >= desde,
          fila: n.startPosition.row,
        });
        break;
      }
      case 'assignment_expression': {
        const izquierda = n.childForFieldName('left');
        const derecha = n.childForFieldName('right');
        if (izquierda && derecha) {
          modelo.asignaciones.push({
            izquierda: leerValor(izquierda),
            derecha: leerValor(derecha),
            nuevo: n.startIndex >= desde,
            fila: n.startPosition.row,
          });
        }
        break;
      }
      case 'for_statement':
      case 'while_statement':
      case 'do_statement':
        modelo.ciclos.push({ nuevo: n.startIndex >= desde, fila: n.startPosition.row });
        break;
    }
    for (const hijo of n.namedChildren) visitar(hijo, local);
  })(arbol.rootNode, false);

  return modelo;
}

// Nombres que llegan con los #include y no estan definidos en el codigo.
const DE_LA_BIBLIOTECA = new Set(['size_t', 'FILE', 'bool', 'time_t']);

// Sigue los alias hasta llegar a lo que el tipo es de verdad:
//   { clase: 'struct', def } | { clase: 'primitivo', nombre }
//   { clase: 'desconocido', que: 'etiqueta' | 'nombre', nombre }
//   { clase: 'otro' }
export function resolver(tipo, modelo, vistos = new Set()) {
  if (tipo.clase === 'primitivo') return { clase: 'primitivo', nombre: tipo.nombre };

  if (tipo.clase === 'struct') {
    const def =
      tipo.defId != null
        ? modelo.structs[tipo.defId]
        : modelo.structs.find((s) => s.etiqueta === tipo.etiqueta);
    return def
      ? { clase: 'struct', def }
      : { clase: 'desconocido', que: 'etiqueta', nombre: tipo.etiqueta };
  }

  if (tipo.clase === 'nombre') {
    if (DE_LA_BIBLIOTECA.has(tipo.nombre)) return { clase: 'otro' };
    const alias = modelo.aliases.find((a) => a.nombre === tipo.nombre);
    if (!alias || vistos.has(alias)) {
      return { clase: 'desconocido', que: 'nombre', nombre: tipo.nombre };
    }
    // Un alias de puntero o de arreglo ya no es "el mismo tipo".
    if (alias.punteros || alias.arreglo.length) return { clase: 'otro' };
    vistos.add(alias);
    return resolver(alias.tipo, modelo, vistos);
  }

  return { clase: 'otro' };
}

// "struct Puesto" o "PuestoT", como lo guarda una captura, a un tipo escrito.
// Tambien un tipo basico: "int", "unsigned int".
const BASICOS = ['char', 'int', 'float', 'double', 'long', 'short', 'unsigned', 'signed', 'void'];

export function tipoDesdeTexto(texto) {
  const partes = texto.trim().split(/\s+/);
  if (partes[0] === 'struct') return { clase: 'struct', etiqueta: partes[1], defId: null };
  if (partes.every((p) => BASICOS.includes(p))) return { clase: 'primitivo', nombre: partes.join(' ') };
  return { clase: 'nombre', nombre: partes[0] };
}

export function textoDeTipo(tipo) {
  switch (tipo.clase) {
    case 'primitivo':
      return tipo.nombre;
    case 'struct':
      return tipo.etiqueta ? 'struct ' + tipo.etiqueta : 'struct';
    case 'nombre':
      return tipo.nombre;
    default:
      return tipo.texto || '?';
  }
}

// Lo que es un campo o una variable, dicho en palabras para un mensaje:
// "un `float`", "un arreglo de `float`", "una tabla de `char`".
//
// En palabras y no como "float[20]", que no es algo que se escriba en C (y es
// justo lo que se marca como error cuando alguien pone los corchetes despues
// del tipo). Lo declarado con "*" se describe por lo que se tipeo, sin nombrar
// el concepto: en la materia se ve al final.
export function enPalabras(declarado) {
  let base = '`' + textoDeTipo(declarado.tipo) + '`';
  if (declarado.punteros) base += ' con `' + '*'.repeat(declarado.punteros) + '`';
  if (declarado.arreglo.length === 0) return 'un ' + base;
  return (declarado.arreglo.length === 1 ? 'un arreglo de ' : 'una tabla de ') + base;
}

// Lo que el analizador no pudo entender en la parte nueva del codigo.
//   { clase: 'falta', que: ';', indice }      habia que escribir algo y no esta
//   { clase: 'sobra', texto, indice }         hay algo que no encaja
export function erroresDeSintaxis(arbol, desde) {
  const errores = [];
  (function visitar(n) {
    if (n.endIndex < desde) return;
    if (dato(n, 'isMissing')) {
      errores.push({ clase: 'falta', que: n.type, indice: n.startIndex });
      return;
    }
    if (n.type === 'ERROR') {
      errores.push({ clase: 'sobra', texto: n.text, indice: Math.max(n.startIndex, desde) });
      return;
    }
    if (!dato(n, 'hasError')) return;
    for (let i = 0; i < n.childCount; i++) visitar(n.child(i));
  })(arbol.rootNode);
  return errores;
}
