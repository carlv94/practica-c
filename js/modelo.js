// Del arbol que arma el analizador a un modelo de lo declarado: que estructuras
// hay, que alias y que variables. Las reglas de las consignas miran este
// modelo, nunca el texto: por eso da igual como se llame la estructura, que
// dimension tengan las cadenas o como este acomodado el codigo.
//
//   struct:   { id, etiqueta, campos, nuevo, fila }
//   campo:    { nombre, tipo, arreglo, punteros, fila }
//   enum:     { id, etiqueta, enumeradores: [{ nombre, valor, explicito, fila }], nuevo, fila }
//   alias:    { nombre, tipo, arreglo, punteros, nuevo, fila }
//   switch:   { condicion, casos: [{ valor, vacio, cierra, fila }], conDefault, posicion, fin, nuevo, fila }
//   variable: { nombre, tipo, arreglo, punteros, local, esConst, inicializada, inicial, nuevo, fila }
//   constante: { nombre, valor, clase: 'define' | 'enum', nuevo, fila }
//
// "arreglo" son las dimensiones como estan escritas (['20'], ['MAX']), y lo
// declarado lleva tambien "indice", su lugar en el codigo, para saber que
// esta antes de que.
//
// y de las sentencias, lo que hace falta para las consignas de "escriba el
// codigo que...": las llamadas a funciones con sus argumentos, las
// asignaciones y si hay algun ciclo.
//   llamada:    { funcion, argumentos, destino, uso, enIf, posicion, fin, nuevo, fila }
//   asignacion: { izquierda, derecha, posicion, nuevo, fila }
//   ciclo:      { tipo, condicion, texto, posicion, fin, nuevo, fila }
//   si:         { condicion, posicion, fin, nuevo, fila }             un if
//   include:    { ruta, sistema, nuevo, fila }       #include <string.h>: sistema es < >
//   comparacion: { operador, izquierda, derecha, enIf, nuevo, fila }  a == b, a != b
//   campoUsado: { variable, campo, nuevo, fila }       alumno.legajo, alumnos[i].legajo (variable: "alumnos[i]")
//   sizeof:     { argumento, nuevo, fila }
//   contenido:  { nombre, nuevo, fila }                 *p, *(p + 2): los nombres que estan despues del *
//   avance:     { nombre, nuevo, fila }                 p++, p--, p += 1, p -= 1
// Un argumento (o un lado de una asignacion) es:
//   { clase: 'nombre', nombre }               cadena1
//   { clase: 'cadena', contenido }            "cadena1"
//   { clase: 'direccion', nombre }            &cadena1
//   { clase: 'indice', nombre, indices }      cadena1[0], t[2][1] (indices: ['2', '1'])
//   { clase: 'caracter', valor }              'a', '\0' (valor: su codigo)
//   { clase: 'numero', valor }                0, 25
//   { clase: 'campo', variable, campo, operador }   alumno.legajo (operador: '.' o '->')
//   { clase: 'otro' }                         cualquier otra expresion
// todos con "texto", que es como esta escrito.
//
// De una llamada: "destino" es la variable donde se guarda lo que devuelve
// (n = strlen(s); o int n = strlen(s);) y "uso" lo que se hace con eso cuando
// es parte de una comparacion: 'igual-cero' (f(...) == 0), 'distinto-cero',
// 'negada' (!f(...)), 'sola' (if (f(...))) u 'otro'.
//
// "tipo" es el tipo tal como esta escrito:
//   { clase: 'primitivo', nombre: 'unsigned int' }
//   { clase: 'struct', etiqueta: 'Puesto', defId }   defId si trae el cuerpo ahi mismo
//   { clase: 'enum', etiqueta: 'Turno', defId }      igual, para un enumerado
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

// Con que se inicializa una variable:
//   { clase: 'lista', elementos: [...] }    { 3, 6, 0 }, y adentro puede haber otras
//   { clase: 'numero', valor }              3, -1.5, 2.5f
//   { clase: 'caracter' | 'cadena' | 'otro' }
// todos con "texto", que es como esta escrito.
function leerInicial(n) {
  if (!n) return null;
  const texto = n.text;
  if (n.type === 'initializer_list') {
    return {
      clase: 'lista',
      elementos: n.namedChildren.filter((h) => h.type !== 'comment').map(leerInicial),
      texto,
    };
  }
  const limpio = texto.replace(/\s+/g, '');
  if (/^[-+]?(\d+\.?\d*|\.\d+)[fFlLuU]*$/.test(limpio)) {
    return { clase: 'numero', valor: parseFloat(limpio), texto };
  }
  if (n.type === 'char_literal') return { clase: 'caracter', valor: codigoDeCaracter(texto), texto };
  if (n.type === 'string_literal') return { clase: 'cadena', contenido: texto.slice(1, -1), texto };
  return { clase: 'otro', texto };
}

// De "*nombre[20] = ..." saca el nombre y lo que lo rodea.
function desenvolver(nodo) {
  const d = {
    nombre: null,
    arreglo: [],
    punteros: 0,
    esFuncion: false,
    inicializada: false,
    inicial: null,
  };
  let n = nodo;
  while (n) {
    switch (n.type) {
      case 'init_declarator':
        d.inicializada = true;
        d.inicial = leerInicial(n.childForFieldName('value'));
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

// El codigo de un caracter escrito entre comillas simples: 'a' -> 97, '\0' -> 0.
function codigoDeCaracter(texto) {
  const c = texto.slice(1, -1);
  if ([...c].length === 1) return c.codePointAt(0);
  const m = /^\\(?:x([0-9a-fA-F]+)|([0-7]{1,3})|(.))$/.exec(c);
  if (!m) return null;
  if (m[1]) return parseInt(m[1], 16);
  if (m[2]) return parseInt(m[2], 8);
  const ESCAPES = { n: 10, t: 9, r: 13, a: 7, b: 8, f: 12, v: 11, '\\': 92, "'": 39, '"': 34, '?': 63 };
  return ESCAPES[m[3]] ?? null;
}

// Una variable de un tipo definido con typedef sobre un arreglo
// (typedef char Nombre[26]; Nombre alumno;) es un arreglo de esos caracteres:
// se la expande para que las reglas la vean asi. "dimsDeAlias" son las
// dimensiones que vienen del alias: las que el alumno escribio en esa
// sentencia son las demas.
function expandirAlias(lista, modelo) {
  for (const d of lista) {
    if (d.tipo.clase !== 'nombre' || d.punteros) continue;
    const alias = modelo.aliases.find(
      (a) => a !== d && a.nombre === d.tipo.nombre && a.indice < d.indice
    );
    if (!alias || !alias.arreglo.length || alias.punteros) continue;
    d.deAlias = alias.nombre;
    d.dimsDeAlias = alias.arreglo.length;
    d.arreglo = [...d.arreglo, ...alias.arreglo];
    d.tipo = alias.tipo;
  }
}

export function construirModelo(arbol, desde) {
  const modelo = {
    // Donde empieza lo que escribio el alumno (lo de antes es lo que le dieron).
    desde,
    structs: [],
    // Las funciones definidas y los prototipos: { nombre, tipo, punteros,
    // parametros: [{ nombre, tipo, arreglo, punteros, fila }], retornos:
    // [{ conValor, fila }], prototipo, posicion, fin, nuevo, fila }.
    funciones: [],
    enums: [],
    switches: [],
    aliases: [],
    variables: [],
    constantes: [],
    llamadas: [],
    asignaciones: [],
    camposUsados: [],
    ciclos: [],
    // Cada acceso a una posicion (ventas[MARTES][t]): el nombre y cada indice.
    indexaciones: [],
    ifs: [],
    includes: [],
    comparaciones: [],
    sizeofs: [],
    contenidos: [],
    avances: [],
  };

  // Un argumento, o un lado de una asignacion.
  function leerValor(n) {
    const texto = n.text;
    switch (n.type) {
      case 'identifier':
        return { clase: 'nombre', nombre: texto, texto };
      case 'string_literal':
        return { clase: 'cadena', contenido: texto.slice(1, -1), texto };
      case 'char_literal':
        return { clase: 'caracter', valor: codigoDeCaracter(texto), texto };
      case 'number_literal': {
        const valor = Number(texto.replace(/[uUlL]+$/, ''));
        return { clase: 'numero', valor: Number.isNaN(valor) ? null : valor, texto };
      }
      case 'pointer_expression': {
        const de = n.childForFieldName('argument');
        if (texto.startsWith('&') && de && de.type === 'field_expression') {
          // &alumno.legajo: la direccion de un campo (nombre: "alumno.legajo")
          return { clase: 'direccion', nombre: de.text, campo: true, texto };
        }
        return texto.startsWith('&') && de && de.type === 'identifier'
          ? { clase: 'direccion', nombre: de.text, texto }
          : { clase: 'otro', texto };
      }
      case 'subscript_expression': {
        // En t[0][1] el nombre esta dos niveles adentro.
        const indices = [];
        let de = n;
        while (de && de.type === 'subscript_expression') {
          const indice = de.childForFieldName('index') || de.childForFieldName('indices');
          indices.unshift(indice ? indice.text : '');
          de = de.childForFieldName('argument');
        }
        return { clase: 'indice', nombre: de ? de.text : null, indices, texto };
      }
      case 'field_expression': {
        // alumno.legajo, alumno->legajo: la variable (lo que esta a la izquierda
        // del punto, tal como esta escrito), el campo y si se llego con . o con ->.
        const de = n.childForFieldName('argument');
        const campo = n.childForFieldName('field');
        if (!de || !campo) return { clase: 'otro', texto };
        const flecha = texto.slice(de.text.length).trimStart().startsWith('->');
        return {
          clase: 'campo',
          variable: de.text,
          campo: campo.text,
          operador: flecha ? '->' : '.',
          texto,
        };
      }
      default:
        return { clase: 'otro', texto };
    }
  }

  // De una llamada: donde se guarda lo que devuelve, que se hace con eso en
  // una comparacion, y si esta en la condicion de un if.
  function contextoDeLlamada(n) {
    const contexto = { destino: null, uso: 'otro', enIf: false };
    let hijo = n;
    let padre = n.parent;
    while (padre && padre.type === 'parenthesized_expression') {
      hijo = padre;
      padre = padre.parent;
    }
    if (padre) {
      if (padre.type === 'assignment_expression' && padre.childForFieldName('right')?.id === hijo.id) {
        const izquierda = padre.childForFieldName('left');
        contexto.destino = izquierda && izquierda.type === 'identifier' ? izquierda.text : null;
      } else if (padre.type === 'init_declarator' && padre.childForFieldName('value')?.id === hijo.id) {
        contexto.destino = desenvolver(padre.childForFieldName('declarator')).nombre;
      } else if (padre.type === 'binary_expression') {
        const operador = padre.childForFieldName('operator')?.text;
        const otro =
          padre.childForFieldName('left')?.id === hijo.id
            ? padre.childForFieldName('right')
            : padre.childForFieldName('left');
        const esCero = otro && otro.type === 'number_literal' && Number(otro.text) === 0;
        if (esCero && operador === '==') contexto.uso = 'igual-cero';
        else if (esCero && operador === '!=') contexto.uso = 'distinto-cero';
      } else if (padre.type === 'unary_expression' && padre.text.startsWith('!')) {
        contexto.uso = 'negada';
      } else if (padre.type === 'if_statement' && padre.childForFieldName('condition')?.id === hijo.id) {
        contexto.uso = 'sola';
      }
    }
    contexto.enIf = estaEnCondicion(n);
    return contexto;
  }

  // Si el nodo esta dentro de la condicion de algun if.
  function estaEnCondicion(n) {
    for (let a = n, p = n.parent; p; a = p, p = p.parent) {
      if (p.type === 'if_statement' && p.childForFieldName('condition')?.id === a.id) return true;
      if (p.type === 'function_definition') return false;
    }
    return false;
  }
  const structDeNodo = new Map();

  function registrarStruct(n) {
    if (structDeNodo.has(n.id)) return structDeNodo.get(n.id);
    const nombre = n.childForFieldName('name');
    const def = {
      id: modelo.structs.length,
      etiqueta: nombre ? nombre.text : null,
      // Una union se sigue como una estructura (campos, alias, variables), marcada:
      // sus miembros comparten el mismo lugar.
      union: n.type === 'union_specifier',
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

  // Un enumerado: sus nombres en orden, con el valor de cada uno (el escrito, o
  // el que sigue al anterior).
  const enumDeNodo = new Map();
  function registrarEnum(n) {
    if (enumDeNodo.has(n.id)) return enumDeNodo.get(n.id);
    const nombre = n.childForFieldName('name');
    const def = {
      id: modelo.enums.length,
      etiqueta: nombre ? nombre.text : null,
      enumeradores: [],
      nuevo: n.startIndex >= desde,
      fila: n.startPosition.row,
    };
    enumDeNodo.set(n.id, def);
    modelo.enums.push(def);
    let anterior = -1;
    for (const e of n.childForFieldName('body').namedChildren) {
      if (e.type !== 'enumerator') continue;
      const valor = e.childForFieldName('value');
      const escrito = valor ? valor.text.trim() : null;
      // Un valor escrito como numero; con otra expresion no se sabe cual es.
      const numero = escrito != null && /^-?\d+$/.test(escrito) ? Number(escrito) : escrito != null ? null : anterior + 1;
      def.enumeradores.push({
        nombre: e.childForFieldName('name')?.text || '',
        valor: numero,
        explicito: escrito != null,
        fila: e.startPosition.row,
      });
      anterior = numero ?? anterior + 1;
      valoresDeEnumerador.set(e.id, numero);
    }
    return def;
  }
  const valoresDeEnumerador = new Map();

  function leerTipo(n) {
    if (!n) return { clase: 'otro', texto: '' };
    switch (n.type) {
      case 'enum_specifier': {
        const nombre = n.childForFieldName('name');
        const def = n.childForFieldName('body') ? registrarEnum(n) : null;
        return { clase: 'enum', etiqueta: nombre ? nombre.text : null, defId: def ? def.id : null };
      }
      case 'union_specifier':
      case 'struct_specifier': {
        const nombre = n.childForFieldName('name');
        const def = n.childForFieldName('body') ? registrarStruct(n) : null;
        return {
          clase: 'struct',
          union: n.type === 'union_specifier',
          etiqueta: nombre ? nombre.text : null,
          defId: def ? def.id : null,
        };
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

  // Una funcion, definida o solo declarada (un prototipo): como se llama, que
  // devuelve, sus parametros y cada "return" de su cuerpo.
  function leerFuncion(declarador, tipoNodo, cuerpo, prototipo, nodo) {
    if (!declarador) return;
    const d = desenvolver(declarador);
    let f = declarador;
    while (f && f.type !== 'function_declarator') f = f.childForFieldName('declarator');
    const lista = f && f.childForFieldName('parameters');
    const parametros = [];
    for (const p of lista ? lista.namedChildren : []) {
      if (p.type !== 'parameter_declaration') continue;
      const tipo = leerTipo(p.childForFieldName('type'));
      const dec = p.childForFieldName('declarator');
      // "(void)": ninguno.
      if (!dec && tipo.clase === 'primitivo' && tipo.nombre === 'void') continue;
      const dp = dec ? desenvolver(dec) : { nombre: null, arreglo: [], punteros: 0 };
      parametros.push({
        nombre: dp.nombre,
        tipo,
        arreglo: dp.arreglo,
        punteros: dp.punteros,
        fila: p.startPosition.row,
      });
    }
    const retornos = [];
    (function buscar(x) {
      if (x.type === 'return_statement') {
        retornos.push({
          conValor: x.namedChildren.some((h) => h.type !== 'comment'),
          fila: x.startPosition.row,
        });
      }
      for (const h of x.namedChildren) buscar(h);
    })(cuerpo || { type: '', namedChildren: [] });
    // Si muestra algo con printf, puts o putchar (para distinguir "muestra" de "devuelve").
    let muestra = false;
    (function buscar(x) {
      if (x.type === 'call_expression') {
        const g = x.childForFieldName('function');
        if (g && ['printf', 'puts', 'putchar'].includes(g.text)) muestra = true;
      }
      for (const h of x.namedChildren) buscar(h);
    })(cuerpo || { type: '', namedChildren: [] });
    modelo.funciones.push({
      nombre: d.nombre,
      tipo: leerTipo(tipoNodo),
      punteros: d.punteros,
      parametros,
      retornos,
      muestra,
      prototipo,
      posicion: nodo.startIndex,
      fin: nodo.endIndex,
      nuevo: nodo.startIndex >= desde,
      fila: nodo.startPosition.row,
    });
  }

  (function visitar(n, local) {
    switch (n.type) {
      case 'struct_specifier':
      case 'union_specifier':
      case 'enum_specifier':
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
          if (d.esFuncion && d.nombre && n.type === 'declaration') {
            leerFuncion(declarador, n.childForFieldName('type'), null, true, n);
            continue;
          }
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
            valor: valor ? valor.text.trim() : valoresDeEnumerador.has(n.id) && valoresDeEnumerador.get(n.id) != null ? String(valoresDeEnumerador.get(n.id)) : '',
            clase: n.type === 'preproc_def' ? 'define' : 'enum',
            nuevo: n.startIndex >= desde,
            fila: n.startPosition.row,
            indice: n.startIndex,
          });
        }
        break;
      }
      case 'function_definition':
        leerFuncion(n.childForFieldName('declarator'), n.childForFieldName('type'), n.childForFieldName('body'), false, n);
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
          ...contextoDeLlamada(n),
          posicion: n.startIndex,
          fin: n.endIndex,
          nuevo: n.startIndex >= desde,
          fila: n.startPosition.row,
        });
        break;
      }
      case 'assignment_expression': {
        const izquierda = n.childForFieldName('left');
        const derecha = n.childForFieldName('right');
        if (izquierda && izquierda.type === 'identifier' && /^[+-]=$/.test(n.childForFieldName('operator')?.text || '')) {
          modelo.avances.push({ nombre: izquierda.text, nuevo: n.startIndex >= desde, fila: n.startPosition.row });
        }
        if (izquierda && derecha) {
          modelo.asignaciones.push({
            izquierda: leerValor(izquierda),
            derecha: leerValor(derecha),
            operador: n.childForFieldName('operator')?.text || '=',
            posicion: n.startIndex,
            nuevo: n.startIndex >= desde,
            fila: n.startPosition.row,
          });
        }
        break;
      }
      case 'binary_expression': {
        const operador = n.childForFieldName('operator')?.text;
        const izquierda = n.childForFieldName('left');
        const derecha = n.childForFieldName('right');
        if ((operador === '==' || operador === '!=') && izquierda && derecha) {
          modelo.comparaciones.push({
            operador,
            izquierda: leerValor(izquierda),
            derecha: leerValor(derecha),
            enIf: estaEnCondicion(n),
            nuevo: n.startIndex >= desde,
            fila: n.startPosition.row,
          });
        }
        break;
      }
      case 'subscript_expression': {
        // Solo el acceso entero: los de adentro (ventas[a] de ventas[a][b]) son parte de el.
        const padre = n.parent;
        const esParte =
          padre && padre.type === 'subscript_expression' && padre.childForFieldName('argument')?.id === n.id;
        if (!esParte) {
          const v = leerValor(n);
          if (v.nombre) {
            modelo.indexaciones.push({
              nombre: v.nombre,
              indices: v.indices,
              nuevo: n.startIndex >= desde,
              fila: n.startPosition.row,
            });
          }
        }
        break;
      }
      case 'pointer_expression': {
        // *p, *(p + 2) (y no &p): los nombres de la direccion a la que se llega.
        const de = n.childForFieldName('argument');
        if (n.text.startsWith('*') && de) {
          const nombres = [];
          const juntar = (x) => {
            if (x.type === 'identifier') nombres.push(x.text);
            else for (const h of x.namedChildren) juntar(h);
          };
          juntar(de);
          for (const nombre of nombres) {
            modelo.contenidos.push({ nombre, nuevo: n.startIndex >= desde, fila: n.startPosition.row });
          }
        }
        break;
      }
      case 'update_expression': {
        // p++, p--, ++p
        const de = n.childForFieldName('argument');
        if (de && de.type === 'identifier') {
          modelo.avances.push({ nombre: de.text, nuevo: n.startIndex >= desde, fila: n.startPosition.row });
        }
        break;
      }
      case 'sizeof_expression':
        modelo.sizeofs.push({
          argumento: n.text.replace(/^sizeof\s*\(?\s*/, '').replace(/\s*\)?\s*$/, ''),
          nuevo: n.startIndex >= desde,
          fila: n.startPosition.row,
        });
        break;
      case 'preproc_include': {
        const camino = n.childForFieldName('path');
        if (camino) {
          modelo.includes.push({
            ruta: camino.text.slice(1, -1),
            sistema: camino.text.startsWith('<'),
            nuevo: n.startIndex >= desde,
            fila: n.startPosition.row,
          });
        }
        break;
      }
      case 'field_expression': {
        // Cada acceso a un campo, donde sea que este (en una condicion, una
        // cuenta, un argumento): la variable tal como esta escrita y el campo.
        const de = n.childForFieldName('argument');
        const campo = n.childForFieldName('field');
        if (de && campo) {
          modelo.camposUsados.push({
            variable: de.text,
            campo: campo.text,
            nuevo: n.startIndex >= desde,
            fila: n.startPosition.row,
          });
        }
        break;
      }
      case 'switch_statement': {
        // Cada "case" con su valor, si no tiene nada adentro (queda pegado al que
        // sigue) y si termina con break o return.
        const cuerpo = n.childForFieldName('body');
        const casos = [];
        let conDefault = false;
        for (const c of cuerpo ? cuerpo.namedChildren : []) {
          if (c.type !== 'case_statement') continue;
          const valor = c.childForFieldName('value');
          if (!valor) conDefault = true;
          const sentencias = c.namedChildren.filter((h) => h.id !== valor?.id && h.type !== 'comment');
          const ultima = sentencias[sentencias.length - 1];
          const cierra = Boolean(ultima) && (ultima.type === 'break_statement' || ultima.type === 'return_statement');
          casos.push({
            valor: valor ? valor.text.trim() : null,
            vacio: sentencias.length === 0,
            cierra,
            fila: c.startPosition.row,
          });
        }
        const condicion = n.childForFieldName('condition');
        modelo.switches.push({
          condicion: condicion ? condicion.text.replace(/^\(\s*([\s\S]*?)\s*\)$/, '$1') : '',
          casos,
          conDefault,
          posicion: n.startIndex,
          fin: n.endIndex,
          nuevo: n.startIndex >= desde,
          fila: n.startPosition.row,
        });
        break;
      }
      case 'if_statement':
        modelo.ifs.push({
          condicion: (n.childForFieldName('condition')?.text || '').replace(/^\(\s*([\s\S]*?)\s*\)$/, '$1'),
          posicion: n.startIndex,
          fin: n.endIndex,
          nuevo: n.startIndex >= desde,
          fila: n.startPosition.row,
        });
        break;
      case 'for_statement':
      case 'while_statement':
      case 'do_statement': {
        // La condicion tal como esta escrita, sin el parentesis de afuera
        // (while, do) ni el ";" (for).
        const condicion = n.childForFieldName('condition');
        modelo.ciclos.push({
          tipo: n.type.replace('_statement', ''),
          condicion: !condicion
            ? ''
            : (condicion.type === 'parenthesized_expression'
                ? condicion.text.slice(1, -1)
                : condicion.text
              )
                .replace(/;\s*$/, '')
                .trim(),
          texto: n.text,
          posicion: n.startIndex,
          fin: n.endIndex,
          nuevo: n.startIndex >= desde,
          fila: n.startPosition.row,
        });
        break;
      }
    }
    for (const hijo of n.namedChildren) visitar(hijo, local);
  })(arbol.rootNode, false);

  // Un enumerador en una lista de valores ({MANANA, TARDE}) vale su numero:
  // se lo anota como numero, con el nombre y el enumerado al que pertenece.
  const enumeradores = new Map();
  for (const def of modelo.enums) {
    for (const e of def.enumeradores) if (e.valor != null) enumeradores.set(e.nombre, { valor: e.valor, def });
  }
  const traducir = (el) => {
    if (el.clase === 'lista') return { ...el, elementos: el.elementos.map(traducir) };
    const e = el.clase === 'otro' ? enumeradores.get(el.texto.trim()) : null;
    return e ? { clase: 'numero', valor: e.valor, texto: el.texto, enumerador: el.texto.trim(), enumDe: e.def.id } : el;
  };
  for (const v of modelo.variables) if (v.inicial && v.inicial.clase === 'lista') v.inicial = traducir(v.inicial);

  // Los typedef de un arreglo, en el orden en que estan escritos.
  expandirAlias(modelo.aliases, modelo);
  expandirAlias(modelo.variables, modelo);
  expandirAlias(
    modelo.structs.flatMap((s) => s.campos),
    modelo
  );

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
        : modelo.structs.find((s) => s.etiqueta === tipo.etiqueta && Boolean(s.union) === Boolean(tipo.union));
    return def
      ? { clase: 'struct', def }
      : { clase: 'desconocido', que: 'etiqueta', nombre: tipo.etiqueta, union: Boolean(tipo.union) };
  }

  if (tipo.clase === 'enum') {
    const def =
      tipo.defId != null
        ? modelo.enums[tipo.defId]
        : modelo.enums.find((e) => e.etiqueta === tipo.etiqueta);
    return def
      ? { clase: 'enum', def }
      : { clase: 'desconocido', que: 'etiqueta', de: 'enum', nombre: tipo.etiqueta };
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
  if (partes[0] === 'union') return { clase: 'struct', union: true, etiqueta: partes[1], defId: null };
  if (partes[0] === 'enum') return { clase: 'enum', etiqueta: partes[1], defId: null };
  if (partes.every((p) => BASICOS.includes(p))) return { clase: 'primitivo', nombre: partes.join(' ') };
  return { clase: 'nombre', nombre: partes[0] };
}

export function textoDeTipo(tipo) {
  switch (tipo.clase) {
    case 'primitivo':
      return tipo.nombre;
    case 'struct':
      return (tipo.union ? 'union' : 'struct') + (tipo.etiqueta ? ' ' + tipo.etiqueta : '');
    case 'enum':
      return tipo.etiqueta ? 'enum ' + tipo.etiqueta : 'enum';
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
