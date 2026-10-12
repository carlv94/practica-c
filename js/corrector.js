// Corrige una respuesta contra las reglas de su consigna.
//
//   corregir(analizador, consigna, { archivo, contexto, respuesta, capturas, dentroDeMain, enArchivo, practicas })
//     -> { correcto, mejorable, diagnosticos, capturas }
//
// Un diagnostico es un error (la respuesta no vale), un aviso (vale, pero hay
// algo raro) o una mejora (vale, pero hay una forma mejor: solo en las series
// que piden esa buena practica). "mejorable" es correcta con alguna mejora; si
// la serie pide practicas y no queda ninguna, la respuesta es excelente.
//
// Desde la pantalla y las pruebas se llama por js/serie.js, que sabe armar el
// contexto de cada paso.
//
// "contexto" es el codigo que el alumno ya resolvio en las consignas anteriores
// de la serie: se analiza junto con la respuesta, para que "la estructura
// anterior" sea la que escribio el, se llame como se llame.
//
// Las capturas son los nombres que una consigna deja para las que siguen
// ("S" = "struct Puesto"). Una regla las usa con "$S".
//
// Cada diagnostico lleva un codigo fijo (CAMPO_FALTA, FALTA_PUNTO_Y_COMA...)
// ademas del mensaje: el mensaje se puede reescribir, el codigo es lo que
// sirve para contar cuales son los errores mas comunes.
//
// Reglas que entiende "requiere" (ver LEEME.md):
//   { "struct":   { "campos": [{ "nombre", "tipo" }], "capturar": "S" } }
//   { "variable": { "tipo": "$S", "conAlias": true } }
//   { "variable": { "nombre": "notas", "tipo": "entero", "arreglo": 20 } }
//   { "variable": { "tipo": "entero", "valores": [3, 6, 0], "capturar": "V" } }
//   { "alias":    { "de": "$S", "capturar": "A" } }
//   { "llamada":  { "funcion": "strcpy", "argumentos": ["cadena2", "cadena1"] } }
//   { "variable": { "tipo": "caracter", "arreglo": { "alMenos": 11, "letras": 10 } } }
//   { "variable": { "tipo": "caracter", "arreglo": true, "texto": "Hola" } }
//   { "elementos": { "de": "$C", "texto": "Hola" } }
//   { "vaciar":   "nombre" }
//   { "ciclo":    { "indice": "i", "hastaElFinDe": "nombre" } }
//   { "usaAlias": { "alias": "$T", "arreglo": { "alMenos": 30 } } }

import {
  construirModelo,
  erroresDeSintaxis,
  resolver,
  tipoDesdeTexto,
  textoDeTipo,
  enPalabras,
} from './modelo.js';

// Las palabras de un tipo entero van en cualquier orden: "unsigned int", "int unsigned".
const DE_ENTERO = ['unsigned', 'signed', 'short', 'int', 'long'];
const esEntero = (t) => t.split(' ').every((palabra) => DE_ENTERO.includes(palabra));
const esReal = (t) => ['float', 'double', 'double long'].includes(t.split(' ').sort().join(' '));

// Lo que puede pedir una consigna como tipo de un campo, ademas de "cadena".
const CATEGORIAS = {
  entero: { es: esEntero, pide: 'un número entero', pideVarios: 'números enteros' },
  real: { es: esReal, pide: 'un número con decimales', pideVarios: 'números con decimales' },
  caracter: { es: (t) => t === 'char', pide: 'un solo carácter', pideVarios: 'caracteres' },
};

const PALABRAS_DE_C = [
  'struct', 'typedef', 'char', 'int', 'float', 'double', 'long', 'short', 'unsigned', 'signed',
  'void', 'const', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break',
];
const TIPOS_BASICOS = ['char', 'int', 'float', 'double', 'long', 'short', 'unsigned', 'void'];

function distancia(a, b) {
  const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const arriba = fila[j];
      fila[j] = Math.min(arriba + 1, fila[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = arriba;
    }
  }
  return fila[b.length];
}

// El tipo que pide una regla, para un mensaje: "de la estructura `Puesto`".
// De una estructura se dice el nombre y no "struct Puesto", que es justo lo
// que el alumno tiene que saber escribir.
function nombrarPedido(pedido) {
  const partes = pedido.trim().split(/\s+/);
  return partes[0] === 'struct' ? `de la estructura \`${partes[1]}\`` : `del tipo \`${pedido}\``;
}

const ORDINALES = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto', 'sexto', 'séptimo', 'octavo', 'noveno', 'décimo'];
const ordinal = (indice) => ORDINALES[indice] || `${indice + 1}.º`;
const ORDINALES_FEMENINOS = ['primera', 'segunda', 'tercera', 'cuarta', 'quinta', 'sexta', 'séptima', 'octava', 'novena', 'décima'];
const ordinalFemenino = (indice) => ORDINALES_FEMENINOS[indice] || `${indice + 1}.ª`;

function mismoTipo(a, b) {
  if (a.clase !== b.clase) return false;
  if (a.clase === 'struct') return a.def === b.def;
  if (a.clase === 'primitivo') return a.nombre === b.nombre;
  return false;
}

// Un texto entre comillas dobles ya termina en '\0': a veces se lo escribe de
// mas ("Hola\0"). Devuelve el texto sin esos fines y cuantos habia: es el mismo
// texto, y lo de mas es una mejora, no un error.
function sinFinEscrito(contenido) {
  const fin = /(\\0{1,3}|\\x0+)$/;
  let texto = contenido;
  let ceros = 0;
  while (fin.test(texto)) {
    texto = texto.replace(fin, '');
    ceros++;
  }
  return { texto, ceros };
}

const MEJORA_FIN_EN_EL_TEXTO =
  'Está bien, pero un texto entre comillas dobles ya termina en el carácter `\'\\0\'`: lo agrega el compilador, no hace falta escribirlo.';

// Las funciones de la biblioteca que un alumno puede llegar a escribir: sirve
// para distinguir "se equivoco de funcion" de "la escribio mal".
const DE_LA_BIBLIOTECA = [
  'strcpy', 'strncpy', 'strcat', 'strncat', 'strcmp', 'strncmp', 'strlen', 'strchr', 'strstr',
  'printf', 'scanf', 'puts', 'gets', 'fgets', 'sprintf', 'memcpy', 'getchar', 'fflush',
];

// Con que funciones se lee del teclado, y cual es el argumento donde se guarda.
const LECTURAS = ['scanf', 'gets', 'fgets'];
const MUESTRAS = ['printf', 'puts'];
const destinoDeLectura = (l) => (l.funcion === 'scanf' ? l.argumentos[1] : l.argumentos[0]);

// Una consigna de opciones: elegir la respuesta en vez de escribirla. Cada
// opcion equivocada tiene su codigo y su explicacion, asi se sabe cual es el
// error de concepto que cometio. "respuesta" es el lugar de la opcion elegida,
// como esta en el archivo de la serie.
export function corregirOpcion(consigna, respuesta) {
  const lugar = respuesta === "" || respuesta == null ? NaN : Number(respuesta);
  const opcion = consigna.opciones[lugar];
  const resultado = (correcto, diagnosticos) => ({ correcto, mejorable: false, diagnosticos, capturas: {} });
  if (!Number.isInteger(lugar) || !opcion) {
    return resultado(false, [
      { nivel: 'error', codigo: 'OPCION_FALTA', mensaje: 'Elija una de las opciones.', linea: null },
    ]);
  }
  if (opcion.correcta) return resultado(true, []);
  return resultado(false, [
    { nivel: 'error', codigo: opcion.codigo, mensaje: opcion.explicacion, linea: null },
  ]);
}

export function corregir(
  analizador,
  consigna,
  { archivo = '', contexto = '', respuesta = '', capturas = {}, dentroDeMain = false, enArchivo = false, practicas = [] }
) {
  // Una sentencia suelta ("strcpy(a, b);") solo vale dentro de una funcion:
  // en las series de sentencias el codigo se analiza envuelto en una, que el
  // alumno no ve ni escribe. Lo que va fuera de ella (un typedef, un struct)
  // se analiza a nivel de archivo: antes, y si la respuesta es de afuera, la
  // respuesta va despues de la funcion para que sea siempre lo ultimo.
  const juntar = (t) => (t.trim() ? t.replace(/\s+$/, '') + '\n\n' : '');
  const afuera = juntar(archivo);
  const adentro = juntar(contexto);
  let previo;
  let fuente;
  if (!dentroDeMain) {
    previo = afuera + adentro;
    fuente = previo + respuesta;
  } else if (enArchivo) {
    previo = afuera + (adentro ? 'void practica(void) {\n' + adentro + '}\n\n' : '');
    fuente = previo + respuesta;
  } else {
    previo = afuera + 'void practica(void) {\n' + adentro;
    fuente = previo + respuesta + '\n}';
  }
  const desde = previo.length;
  const filaBase = previo.split('\n').length - 1;

  const diagnosticos = [];
  const nuevas = { ...capturas };

  // "fila" es la del codigo completo; al alumno se le dice la linea de SU respuesta.
  function diag(nivel, codigo, mensaje, fila) {
    diagnosticos.push({
      nivel,
      codigo,
      mensaje,
      linea: fila == null ? null : fila - filaBase + 1,
    });
  }
  const error = (codigo, mensaje, fila) => diag('error', codigo, mensaje, fila);
  const aviso = (codigo, mensaje, fila) => diag('aviso', codigo, mensaje, fila);
  // Una mejora no invalida: la respuesta esta bien, pero hay una forma mejor.
  const mejora = (codigo, mensaje, fila) => diag('mejora', codigo, mensaje, fila);

  function terminar() {
    const correcto = !diagnosticos.some((d) => d.nivel === 'error');
    // Las mejoras son para una respuesta que ya esta bien: con un error, lo
    // unico que importa es el error.
    const informados = correcto ? diagnosticos : diagnosticos.filter((d) => d.nivel !== 'mejora');
    // Una condicion que no se pudo comprobar deja la respuesta como correcta,
    // pero no como excelente: excelente es "lo verifique y no hay nada que mejorar".
    const sinVerificar = correcto && diagnosticos.some((d) => d.codigo === 'CICLO_NO_VERIFICADO');
    return {
      correcto,
      mejorable: correcto && (sinVerificar || diagnosticos.some((d) => d.nivel === 'mejora')),
      sinVerificar,
      diagnosticos: informados,
      capturas: correcto ? nuevas : capturas,
    };
  }

  if (!respuesta.trim()) {
    error('VACIO', 'Todavía no hay nada escrito.');
    return terminar();
  }
  if (dentroDeMain && /\bmain\s*\(/.test(respuesta)) {
    error(
      'MAIN_DE_MAS',
      'No hace falta escribir `main`: alcanza con las sentencias que pide la consigna.',
      filaBase + respuesta.slice(0, respuesta.search(/\bmain\s*\(/)).split('\n').length - 1
    );
    return terminar();
  }

  const arbol = analizador.parse(fuente);
  try {
    // Con la sintaxis rota, lo demas saldria de un arbol a medio armar y los
    // mensajes confundirian: primero se arregla esto.
    const rotos = erroresDeSintaxis(arbol, desde);
    if (rotos.length) {
      // Primero los errores que se reconocen, con su explicacion; si no es
      // ninguno de esos, lo que diga el analizador.
      const conocidos = erroresConocidos(respuesta);
      for (const c of conocidos) error(c.codigo, c.mensaje, filaBase + c.fila);
      if (!conocidos.length) for (const roto of rotos) informarSintaxis(roto, fuente, error);
      return terminar();
    }

    const modelo = construirModelo(arbol, desde);
    revisarNombres(modelo, error);
    revisarRedefiniciones(modelo, error, practicas.includes('constantes') ? mejora : null);
    // Cuando la consigna pide los caracteres de a uno, o vaciar la cadena,
    // aconsejarle una funcion de la biblioteca seria mandarlo a otra cosa.
    const sinFuncion = consigna.requiere.some((r) => r.elementos || r.vaciar || r.ciclo);
    revisarAsignaciones(modelo, error, !sinFuncion);
    revisarIndices(modelo, error);
    revisarDimensiones(modelo, error, practicas.includes('constantes') ? mejora : null);
    for (const regla of consigna.requiere) aplicarRegla(regla, modelo);
    return terminar();
  } finally {
    arbol.delete();
  }

  function valorDe(referencia) {
    // "$D" es el nombre capturado; "$D[0][1]", ese nombre con sus indices.
    const partes = /^\$([A-Za-z_]\w*)([\s\S]*)$/.exec(referencia);
    if (!partes) return referencia;
    const valor = nuevas[partes[1]];
    if (!valor) {
      throw new Error(
        `La consigna "${consigna.id}" usa ${referencia}, que ninguna consigna anterior capturó.`
      );
    }
    return valor + partes[2];
  }

  function aplicarRegla(regla, modelo) {
    if (regla.struct) return reglaStruct(regla.struct, modelo);
    if (regla.variable) return reglaVariable(regla.variable, modelo);
    if (regla.alias) return reglaAlias(regla.alias, modelo);
    if (regla.llamada) return reglaLlamada(regla.llamada, modelo);
    if (regla.elementos) return reglaElementos(regla.elementos, modelo);
    if (regla.vaciar) return reglaVaciar(regla.vaciar, modelo);
    if (regla.ciclo) return reglaCiclo(regla.ciclo, modelo);
    if (regla.usaAlias) return reglaUsaAlias(regla.usaAlias, modelo);
    if (regla.incluye) return reglaIncluye(regla.incluye, modelo);
    if (regla.lee) return reglaLee(regla.lee, modelo);
    if (regla.muestra) return reglaMuestra(regla.muestra, modelo);
    if (regla.limpiaEntrada) return reglaLimpiaEntrada(regla.limpiaEntrada, modelo);
    throw new Error(`La consigna "${consigna.id}" tiene una regla que no conozco.`);
  }

  // ---- struct ---------------------------------------------------------------

  function reglaStruct(regla, modelo) {
    const candidatos = modelo.structs.filter((s) => s.nuevo);
    if (!candidatos.length) {
      error(
        'STRUCT_FALTA',
        'No encontré la declaración de una estructura.'
      );
      return;
    }

    // Si hay mas de una, la que mas se parece a lo pedido.
    const pedidos = regla.campos.map((c) => c.nombre);
    const aciertos = (s) => s.campos.filter((c) => pedidos.includes(c.nombre)).length;
    const def = candidatos.reduce((mejor, s) => (aciertos(s) > aciertos(mejor) ? s : mejor));

    const sinUsar = new Set(def.campos);
    for (const esperado of regla.campos) {
      const campo = def.campos.find((c) => c.nombre === esperado.nombre);
      if (campo) {
        sinUsar.delete(campo);
        verificarCampo(campo, esperado, modelo);
        continue;
      }

      const parecido = [...sinUsar].find(
        (c) =>
          !pedidos.includes(c.nombre) &&
          (c.nombre.toLowerCase() === esperado.nombre.toLowerCase() ||
            distancia(c.nombre, esperado.nombre) <= 2)
      );
      if (!parecido) {
        error('CAMPO_FALTA', `Falta el campo \`${esperado.nombre}\`.`, def.fila);
        continue;
      }
      sinUsar.delete(parecido);
      const soloMayusculas = parecido.nombre.toLowerCase() === esperado.nombre.toLowerCase();
      error(
        'CAMPO_NOMBRE',
        `El campo \`${parecido.nombre}\` tendría que llamarse \`${esperado.nombre}\`` +
          (soloMayusculas ? ': en C las mayúsculas y las minúsculas son letras distintas.' : '.'),
        parecido.fila
      );
      verificarCampo(parecido, esperado, modelo);
    }

    for (const campo of sinUsar) {
      aviso('CAMPO_DE_MAS', `La consigna no pide el campo \`${campo.nombre}\`.`, campo.fila);
    }

    // Sin etiqueta y sin alias, la estructura no se puede volver a nombrar.
    const alias = modelo.aliases.find(
      (a) => a.tipo.defId === def.id && !a.punteros && !a.arreglo.length
    );
    if (!def.etiqueta && !alias) {
      error(
        'STRUCT_SIN_NOMBRE',
        'La estructura no tiene nombre, así que después no se la va a poder usar. ' +
          'El nombre va entre `struct` y la llave.',
        def.fila
      );
      return;
    }
    if (regla.capturar) {
      nuevas[regla.capturar] = def.etiqueta ? 'struct ' + def.etiqueta : alias.nombre;
    }
  }

  function verificarCampo(campo, esperado, modelo) {
    const real = resolver(campo.tipo, modelo);
    if (real.clase === 'desconocido') return; // ya lo dijo revisarNombres
    const base = real.clase === 'primitivo' ? real.nombre : null;
    const n = campo.nombre;
    const declarado = `Está declarado como ${enPalabras(campo)}.`;

    if (esperado.tipo === 'cadena') {
      if (base !== 'char') {
        error(
          'CAMPO_TIPO',
          `\`${n}\` guarda un texto: tiene que ser una cadena de caracteres. ${declarado}`,
          campo.fila
        );
      } else if (campo.punteros) {
        error(
          'CAMPO_CADENA_PUNTERO',
          `\`${n}\` está declarado con \`*\`: así no reserva espacio para guardar el texto. Tiene que ser un arreglo de caracteres, con su dimensión.`,
          campo.fila
        );
      } else if (campo.arreglo.length === 0) {
        error(
          'CAMPO_CADENA_SIN_DIMENSION',
          `\`${n}\` así guarda un solo carácter. Para un texto hace falta un arreglo de caracteres, con su dimensión.`,
          campo.fila
        );
      } else if (campo.arreglo.length > 1) {
        error(
          'CAMPO_CADENA_DIMENSIONES',
          `\`${n}\` tiene ${campo.arreglo.length} dimensiones: así guardaría varios textos. Para un solo texto alcanza con una.`,
          campo.fila
        );
      } else if (campo.arreglo[0].trim() === '') {
        error(
          'CAMPO_CADENA_SIN_DIMENSION',
          `A \`${n}\` le falta la dimensión entre los corchetes.`,
          campo.fila
        );
      } else if (/^\d+$/.test(campo.arreglo[0].trim()) && Number(campo.arreglo[0]) < 2) {
        error(
          'CAMPO_CADENA_CORTA',
          `En \`${n}\` no entra ningún texto: una cadena necesita un espacio más que sus letras, para el carácter \`'\\0'\` del final.`,
          campo.fila
        );
      }
      return;
    }

    const categoria = CATEGORIAS[esperado.tipo];
    if (!categoria) {
      throw new Error(`La consigna "${consigna.id}" pide un tipo que no conozco: ${esperado.tipo}`);
    }
    if (campo.arreglo.length) {
      error(
        'CAMPO_ES_ARREGLO',
        `\`${n}\` tiene que ser ${categoria.pide}, no un arreglo: sobran los corchetes.`,
        campo.fila
      );
    } else if (campo.punteros) {
      error(
        'CAMPO_ES_PUNTERO',
        `\`${n}\` tiene que ser ${categoria.pide}: sobra el \`*\`.`,
        campo.fila
      );
    } else if (!base || !categoria.es(base)) {
      error('CAMPO_TIPO', `\`${n}\` tiene que ser ${categoria.pide}. ${declarado}`, campo.fila);
    }
  }

  // ---- variable -------------------------------------------------------------

  function reglaVariable(regla, modelo) {
    // El tipo pedido es uno concreto ("$S", "int") o una categoria ("entero").
    const pedido = valorDe(regla.tipo);
    const categoria = CATEGORIAS[pedido];
    const objetivo = categoria ? null : resolver(tipoDesdeTexto(pedido), modelo);
    const esDelTipo = (v) => {
      const real = resolver(v.tipo, modelo);
      return categoria
        ? real.clase === 'primitivo' && categoria.es(real.nombre)
        : mismoTipo(real, objetivo);
    };
    // Con "valores" se pide un arreglo definido con esos valores.
    const quiereArreglo =
      Boolean(regla.valores) || Boolean(regla.textos) || (regla.arreglo != null && regla.arreglo !== false);
    let candidatas = modelo.variables.filter((v) => v.nuevo);

    if (!candidatas.length) {
      const esAlias = modelo.aliases.some((a) => a.nuevo);
      error(
        'VARIABLE_FALTA',
        (esAlias
          ? 'Eso define un alias (un nombre nuevo para un tipo), no una variable. '
          : 'No encontré la declaración de una variable. ') +
          'Una variable se declara con el tipo y después el nombre: `tipo nombre;`'
      );
      return;
    }

    if (regla.nombre) {
      const conNombre = candidatas.filter((v) => v.nombre === regla.nombre);
      if (!conNombre.length) {
        // Con la palabra del enunciado: sale de lo que pide la consigna, no
        // de lo que escribio el alumno.
        const [que, declarado] = quiereArreglo
          ? ['el arreglo', 'El que está declarado']
          : ['la variable', 'La que está declarada'];
        error(
          'VARIABLE_NOMBRE',
          `La consigna pide que ${que} se llame \`${regla.nombre}\`.` +
            (candidatas.length === 1 ? ` ${declarado} se llama \`${candidatas[0].nombre}\`.` : ''),
          candidatas[0].fila
        );
        return;
      }
      candidatas = conNombre;
    }

    // Valores en filas ([[5, 8], [0, 2]]) piden una tabla: dos dimensiones.
    const esTabla =
      Array.isArray(regla.valores?.[0]) || Array.isArray(regla.arreglo?.alMenos) || Array.isArray(regla.arreglo?.tamano) || Boolean(regla.textos);
    // Con letras, el ultimo corchete es el de cada texto: dos corchetes son un
    // arreglo de cadenas y tres, una tabla de cadenas.
    const medidas = regla.arreglo ? [].concat(regla.arreglo.tamano ?? regla.arreglo.alMenos ?? []) : [];
    const conLetras = regla.arreglo?.letras != null;
    const deCadenas = Boolean(regla.textos) || (conLetras && medidas.length > 1);
    const dimensiones = !quiereArreglo ? 0 : !esTabla ? 1 : conLetras ? medidas.length : 2;
    const forma = deCadenas
      ? dimensiones === 3
        ? 'una tabla de cadenas'
        : 'un arreglo de cadenas'
      : esTabla
        ? 'una tabla'
        : 'un arreglo';

    const delTipo = candidatas.filter(esDelTipo);
    const exacta = delTipo.find((v) => !v.punteros && v.arreglo.length === dimensiones);

    if (exacta) {
      if (regla.conAlias && exacta.tipo.clase !== 'nombre') {
        const alias = nuevas.A ? ` (\`${nuevas.A}\`)` : '';
        error(
          'VARIABLE_SIN_ALIAS',
          `\`${exacta.nombre}\` está bien declarada, pero con \`${textoDeTipo(exacta.tipo)}\`. La consigna pide usar el alias${alias}.`,
          exacta.fila
        );
      }
      if (regla.valores) {
        if (esTabla) verificarTabla(exacta, regla.valores, modelo);
        else verificarValores(exacta, regla.valores, modelo);
        if (regla.capturar) nuevas[regla.capturar] = exacta.nombre;
        return;
      }
      if (regla.capturar) nuevas[regla.capturar] = exacta.nombre;

      // Una lista de textos (la tabla de los dias), o un texto para una cadena.
      if (regla.textos) return verificarTextos(exacta, regla, modelo);
      if (regla.texto != null) return verificarCadenaInicial(exacta, regla, modelo);
      if (regla.caracter != null) return verificarCaracter(exacta, regla);
      // Un arreglo "de al menos" tantos elementos (la cadena de hasta N letras).
      if (regla.arreglo && typeof regla.arreglo === 'object') {
        if (regla.capturarDimension) {
          const lugar = valorDeDimension(exacta.arreglo[0], modelo);
          nuevas[regla.capturarDimension] = String(lugar ?? exacta.arreglo[0].trim());
        }
        if (verificarAlMenos(exacta, regla.arreglo, modelo) && regla.vacia) {
          verificarVacia(exacta, modelo);
        }
        return;
      }

      // Con un numero, el arreglo tiene que tener justo esa cantidad, este
      // escrita como numero o con una constante que valga eso.
      if (typeof regla.arreglo === 'number' && !exacta.arreglo[0].trim()) {
        error(
          'ARREGLO_SIN_DIMENSION',
          `A \`${exacta.nombre}\` le falta la cantidad de elementos entre los corchetes.`,
          exacta.fila
        );
        return;
      }
      const tiene = typeof regla.arreglo === 'number' ? valorDeDimension(exacta.arreglo[0], modelo) : null;
      // Los dos son error, pero no son el mismo: de menos no entra lo que hay
      // que guardar; de mas entra, y no es lo que pide el problema.
      const elementos = (n) => (n === 1 ? '1 elemento' : `${n} elementos`);
      if (tiene != null && tiene < regla.arreglo) {
        error(
          'ARREGLO_CHICO',
          `\`${exacta.nombre}\` puede guardar ${elementos(tiene)} y hay que guardar ${regla.arreglo}: no alcanza.`,
          exacta.fila
        );
      } else if (tiene != null && tiene > regla.arreglo) {
        error(
          'ARREGLO_GRANDE',
          `\`${exacta.nombre}\` puede guardar ${elementos(tiene)} y la consigna pide ${regla.arreglo}: sobra espacio.`,
          exacta.fila
        );
      }
      return;
    }

    const v = delTipo[0] || candidatas[0];
    if (!delTipo.length) {
      if (resolver(v.tipo, modelo).clase !== 'desconocido') {
        error(
          'VARIABLE_TIPO',
          `\`${v.nombre}\` es ${enPalabras(v)}. ` +
            (!categoria
              ? `Tiene que ser ${nombrarPedido(pedido)}.`
              : !quiereArreglo
                ? `Tiene que ser ${categoria.pide}.`
                : v.arreglo.length
                  ? `Sus elementos tienen que ser ${categoria.pideVarios}.`
                  : `Tiene que ser ${forma} de ${categoria.pideVarios}.`),
          v.fila
        );
      }
    } else if (v.punteros) {
      error(
        'VARIABLE_PUNTERO',
        `A \`${v.nombre}\` le sobra el \`*\`: la consigna pide ${quiereArreglo ? forma : 'una variable'} común.`,
        v.fila
      );
    } else if (!quiereArreglo) {
      error(
        'VARIABLE_ARREGLO',
        `\`${v.nombre}\` es un arreglo. La consigna pide una sola variable: sobran los corchetes.`,
        v.fila
      );
    } else if (!v.arreglo.length) {
      error(
        'VARIABLE_NO_ES_ARREGLO',
        `\`${v.nombre}\` es una sola variable. La consigna pide ${forma}` +
          (regla.valores ? '.' : ': falta indicar cuántos elementos tiene.'),
        v.fila
      );
    } else if (esTabla && v.arreglo.length === 1) {
      error(
        'TABLA_UNA_DIMENSION',
        deCadenas
          ? `\`${v.nombre}\` tiene una sola dimensión: guarda un solo texto. La consigna pide ${forma}.`
          : `\`${v.nombre}\` tiene una sola dimensión: es un arreglo. La consigna pide una tabla, con filas y columnas.`,
        v.fila
      );
    } else if (esTabla) {
      error(
        'TABLA_DIMENSIONES',
        deCadenas
          ? `\`${v.nombre}\` tiene ${v.arreglo.length} dimensiones. La consigna pide ${forma}, que tiene ${dimensiones === 3 ? 'tres: las filas, las columnas y el tamaño de cada texto' : 'dos: la cantidad de textos y el tamaño de cada uno'}.`
          : `\`${v.nombre}\` tiene ${v.arreglo.length} dimensiones. Una tabla tiene dos: las filas y las columnas.`,
        v.fila
      );
    } else {
      error(
        'ARREGLO_DIMENSIONES',
        `\`${v.nombre}\` tiene ${v.arreglo.length} dimensiones: eso es una tabla. La consigna pide un arreglo de una sola.`,
        v.fila
      );
    }
  }

  // Una tabla definida con sus valores: los del dibujo, fila por fila.
  function verificarTabla(v, filas, modelo) {
    const n = v.nombre;
    const inicial = v.inicial;
    const F = filas.length;
    const C = filas[0].length;

    if (!inicial) {
      const aparte = modelo.asignaciones.some(
        (a) => a.nuevo && a.izquierda.clase === 'indice' && a.izquierda.nombre === n
      );
      error(
        aparte ? 'VALORES_APARTE' : 'VALORES_FALTAN',
        aparte
          ? `La consigna pide darle los valores a \`${n}\` en la misma sentencia en que se la define, no de a uno después.`
          : `\`${n}\` está definida, pero sin sus valores: la consigna pide dárselos en esa misma sentencia.`,
        v.fila
      );
      return;
    }
    if (inicial.clase !== 'lista') {
      error('VALORES_SIN_LISTA', 'Los valores de una tabla van todos juntos, en una lista.', v.fila);
      return;
    }

    const escritos = inicial.elementos;
    if (escritos.length === 0) {
      error('LISTA_VACIA', 'La lista está vacía: tiene que traer al menos un valor.', v.fila);
      return;
    }
    const enFilas = escritos.filter((e) => e.clase === 'lista').length;
    if (enFilas && enFilas < escritos.length) {
      error(
        'TABLA_LLAVES_MEZCLADAS',
        'Algunas filas están entre llaves y otras no: cada fila va entre sus propias llaves.',
        v.fila
      );
      return;
    }

    const coincide = (e, valor) => e.clase === 'numero' && e.valor === valor;
    const entreComillas = (e) => e.clase === 'caracter' || e.clase === 'cadena';
    const cuantos = (c) => (c === 1 ? '1 valor' : `${c} valores`);
    // Lo que la lista no nombra queda en cero: no escribirlo es correcto si el
    // dibujo tiene ahi un cero. Para saberlo, lo que sigue de una posicion.
    const hayDistintoDeCero = (desdeFila, desdeColumna) =>
      filas.some((fila, i) =>
        fila.some((x, j) => (i > desdeFila || (i === desdeFila && j >= desdeColumna)) && x !== 0)
      );
    const [deFilas, deColumnas] = v.arreglo.map((d) => d.trim());

    if (!enFilas) {
      // (5, 8, 1, 4) es C valido, pero es otra cosa: vale solo el ultimo numero.
      if (escritos.some((e) => e.clase === 'otro' && e.texto.trim().startsWith('('))) {
        error('FILAS_ENTRE_PARENTESIS', 'Las filas de una tabla no se encierran entre paréntesis.', v.fila);
        return;
      }
      // Todo seguido, sin llaves por fila: C lo reparte igual, de a C valores.
      const total = F * C;
      if (escritos.length > total) {
        error(
          'VALORES_DE_MAS',
          `La lista tiene ${cuantos(escritos.length)} y la tabla del dibujo tiene ${total}.`,
          v.fila
        );
        return;
      }
      if (escritos.length < total && hayDistintoDeCero(Math.floor(escritos.length / C), escritos.length % C)) {
        // Con la cantidad de filas escrita, lo que falta se completa con ceros;
        // con los corchetes vacios, simplemente hay menos filas.
        error(
          deFilas ? 'VALORES_SIN_NOMBRAR' : 'VALORES_DE_MENOS',
          deFilas
            ? escritos.length === 1
              ? `Así solo el primer elemento vale \`${escritos[0].texto.trim()}\`: los que la lista no nombra quedan en cero, no repiten el último valor.`
              : `Así solo los primeros ${escritos.length} elementos tienen los valores de la lista: los que no nombra quedan en cero.`
            : `La lista tiene ${cuantos(escritos.length)} y la tabla del dibujo tiene ${total}.`,
          v.fila
        );
        return;
      }
      const distinto = escritos.findIndex((e, i) => !coincide(e, filas[Math.floor(i / C)][i % C]));
      if (distinto >= 0) {
        const e = escritos[distinto];
        if (entreComillas(e)) {
          error('VALOR_ENTRE_COMILLAS', `\`${e.texto}\` con comillas no es un número: los números van sin comillas.`, v.fila);
        } else {
          error(
            'VALOR_DISTINTO',
            `El ${ordinal(distinto)} valor de la lista (\`${e.texto.trim()}\`) no coincide con el del dibujo.`,
            v.fila
          );
        }
        return;
      }
    } else {
      if (escritos.some((fila) => fila.elementos.some((e) => e.clase === 'lista'))) {
        error(
          'VALORES_ANIDADOS',
          `\`${n}\` tiene dos dimensiones: una lista con las filas, y adentro de cada fila los valores sueltos. Sobran llaves.`,
          v.fila
        );
        return;
      }
      // Una fila por columna del dibujo: la cargo al reves.
      const alReves =
        escritos.length === C &&
        escritos.every((fila) => fila.elementos.length === F) &&
        escritos.every((fila, j) => fila.elementos.every((e, i) => coincide(e, filas[i][j])));
      if (alReves && (F !== C || !escritos.every((fila, i) => fila.elementos.every((e, j) => coincide(e, filas[i][j]))))) {
        error(
          'TABLA_AL_REVES',
          'Los valores están cargados por columnas. En la lista, cada grupo entre llaves es una fila del dibujo, de izquierda a derecha.',
          v.fila
        );
        return;
      }
      // Filas que la lista no escribe: quedan en cero, y vale si en el dibujo
      // tambien lo son.
      const conFilas = escritos.length === 1 ? '1 fila' : `${escritos.length} filas`;
      if (escritos.length > F || (escritos.length < F && hayDistintoDeCero(escritos.length, 0))) {
        error(
          escritos.length < F ? 'FILAS_DE_MENOS' : 'FILAS_DE_MAS',
          `La lista tiene ${conFilas} y la tabla del dibujo tiene ${F}.` +
            (escritos.length < F && deFilas ? ' Las filas que la lista no nombra quedan en cero.' : ''),
          v.fila
        );
        return;
      }
      // Lo mismo dentro de una fila: de mas no entra; de menos, el resto queda
      // en cero.
      const filaMal = escritos.findIndex(
        (fila, i) =>
          fila.elementos.length > C || (fila.elementos.length < C && hayDistintoDeCero(i, fila.elementos.length) && filas[i].slice(fila.elementos.length).some((x) => x !== 0))
      );
      if (filaMal >= 0) {
        const cantidad = escritos[filaMal].elementos.length;
        error(
          'FILA_OTRA_CANTIDAD',
          `La ${ordinalFemenino(filaMal)} fila tiene ${cuantos(cantidad)} y en el dibujo tiene ${C}.` +
            (cantidad < C ? ' Los valores que la fila no nombra quedan en cero.' : ''),
          v.fila
        );
        return;
      }
      for (let i = 0; i < escritos.length; i++) {
        const j = escritos[i].elementos.findIndex((e, k) => !coincide(e, filas[i][k]));
        if (j < 0) continue;
        const e = escritos[i].elementos[j];
        if (entreComillas(e)) {
          error('VALOR_ENTRE_COMILLAS', `\`${e.texto}\` con comillas no es un número: los números van sin comillas.`, v.fila);
        } else {
          error(
            'VALOR_DISTINTO',
            `El ${ordinal(j)} valor de la ${ordinalFemenino(i)} fila (\`${e.texto.trim()}\`) no coincide con el del dibujo.`,
            v.fila
          );
        }
        return;
      }
    }

    // Los corchetes: primero las filas, que se pueden dejar vacias, y despues
    // las columnas, que no.
    if (!deColumnas) {
      error(
        'TABLA_SIN_COLUMNAS',
        'En una tabla solo se puede dejar vacía la cantidad de filas: la de columnas hay que escribirla.',
        v.fila
      );
      return;
    }
    const lugarColumnas = valorDeDimension(deColumnas, modelo);
    // Con las filas vacias, el compilador cuenta las que se escribieron: si
    // faltan filas en cero, no son las del dibujo.
    const filasEscritas = enFilas ? escritos.length : Math.ceil(escritos.length / (lugarColumnas ?? C));
    const lugarFilas = deFilas ? valorDeDimension(deFilas, modelo) : filasEscritas;
    if (lugarFilas == null || lugarColumnas == null) return;

    if (F !== C && lugarFilas === C && lugarColumnas === F) {
      error(
        'DIMENSIONES_AL_REVES',
        `Las dimensiones de \`${n}\` están al revés: entre los primeros corchetes va la cantidad de filas y entre los segundos la de columnas.`,
        v.fila
      );
    } else if (lugarFilas !== F || lugarColumnas !== C) {
      const chica = lugarFilas < F || lugarColumnas < C;
      error(
        chica ? 'ARREGLO_CHICO' : 'ARREGLO_GRANDE',
        `\`${n}\` está definida de ${lugarFilas} por ${lugarColumnas} y la tabla del dibujo es de ${F} filas por ${C} columnas: ` +
          (chica ? 'no entra.' : 'sobra espacio.'),
        v.fila
      );
    } else {
      // Para llenar de ceros alcanza un solo cero. Es lo unico que se le dice:
      // lo demas (la cantidad de filas, las llaves por fila) no se puede
      // aplicar junto con eso.
      const todosCeros = filas.every((fila) => fila.every((x) => x === 0));
      const cuantosEscritos = enFilas
        ? escritos.reduce((suma, fila) => suma + fila.elementos.length, 0)
        : escritos.length;
      if (todosCeros && practicas.includes('claridad') && cuantosEscritos > 1) {
        mejora(
          'CERO_ALCANZA',
          'Está bien, pero para llenar de ceros alcanza con escribir uno solo, `{0}`' +
            (deFilas ? '' : ', indicando la cantidad de filas entre los corchetes') +
            ': los elementos que la lista no nombra quedan en cero.',
          v.fila
        );
      } else {
        // Seguidos, y con mas de una fila de valores: no se ve donde termina
        // cada una. Con los de una sola fila no hay limite que mirar.
        if (!enFilas && escritos.length > C && practicas.includes('claridad')) {
          mejora(
            'TABLA_SIN_FILAS',
            'Con todos los valores seguidos funciona, pero no se ve dónde termina cada fila. Lo ideal es que cada fila vaya entre sus propias llaves.',
            v.fila
          );
        }
        // Igual que en el arreglo: la cantidad de filas ya la dicen los
        // valores, si estan todas escritas. La de columnas no, porque C la
        // exige.
        const filasCompletas = enFilas ? escritos.length === F : escritos.length === F * C;
        if (deFilas && filasCompletas && practicas.includes('constantes')) {
          mejora(
            'FILAS_REPETIDAS',
            'La cantidad de filas ya la dicen los valores: si deja vacíos los primeros corchetes, el compilador la cuenta solo, y no hay que acordarse de cambiarla el día de mañana si se agrega o se quita una fila.',
            v.fila
          );
        }
      }
    }
  }

  // Un arreglo definido con sus valores, en la misma sentencia: los del dibujo
  // del enunciado, en ese orden y ni uno mas.
  function verificarValores(v, valores, modelo) {
    const n = v.nombre;
    const inicial = v.inicial;

    if (!inicial) {
      const aparte = modelo.asignaciones.some(
        (a) => a.nuevo && a.izquierda.clase === 'indice' && a.izquierda.nombre === n
      );
      error(
        aparte ? 'VALORES_APARTE' : 'VALORES_FALTAN',
        aparte
          ? `La consigna pide darle los valores a \`${n}\` en la misma sentencia en que se lo define, no de a uno después.`
          : `\`${n}\` está definido, pero sin sus valores: la consigna pide dárselos en esa misma sentencia.`,
        v.fila
      );
      return;
    }
    if (inicial.clase !== 'lista') {
      error(
        'VALORES_SIN_LISTA',
        `Los valores de un arreglo van todos juntos, en una lista` +
          (inicial.texto.trim().startsWith('(') ? ', y esa lista no se encierra entre paréntesis.' : '.'),
        v.fila
      );
      return;
    }
    const escritos = inicial.elementos;
    if (escritos.some((e) => e.clase === 'lista')) {
      error(
        'VALORES_ANIDADOS',
        `\`${n}\` tiene una sola dimensión: adentro de la lista van los valores sueltos, sin otras llaves.`,
        v.fila
      );
      return;
    }

    if (escritos.length === 0) {
      error('LISTA_VACIA', 'La lista está vacía: tiene que traer al menos un valor.', v.fila);
      return;
    }

    const cuantos = (c) => (c === 1 ? '1 valor' : `${c} valores`);
    const elementos = (c) => (c === 1 ? '1 elemento' : `${c} elementos`);
    const coincide = (e, valor) => e.clase === 'numero' && e.valor === valor;

    // Lo que el arreglo termina teniendo es la lista completada con ceros hasta
    // la cantidad de los corchetes: C pone en cero lo que la lista no nombra.
    // Con los corchetes vacios la cantidad es la de la lista, y si no se puede
    // calcular (N + 1) tampoco se puede opinar sobre ella.
    const dimension = v.arreglo[0].trim();
    const lugar = dimension ? valorDeDimension(dimension, modelo) : escritos.length;
    const total = lugar ?? escritos.length;

    if (escritos.length > total) {
      error(
        'ARREGLO_CHICO',
        `\`${n}\` puede guardar ${elementos(total)} y la lista trae ${cuantos(escritos.length)}: no entran.`,
        v.fila
      );
      return;
    }
    // Sin nada que completar, lo escrito es el arreglo entero.
    const completa = escritos.length === total;

    const errorDeCantidad = () => {
      // Con coma decimal, 12,5 se lee como dos valores. El ejemplo sale del
      // primer decimal del dibujo, escrito como no hay que escribirlo.
      const decimal = valores.find((x) => !Number.isInteger(x));
      const [entera, fraccion] = decimal == null ? [] : String(decimal).split('.');
      error(
        escritos.length < valores.length ? 'VALORES_DE_MENOS' : 'VALORES_DE_MAS',
        `La lista tiene ${cuantos(escritos.length)} y el arreglo del dibujo tiene ${valores.length}.` +
          (escritos.length > valores.length && decimal != null
            ? ` Ojo con los decimales: en C se escriben con punto. Acá la coma separa un valor del siguiente, así que \`${entera},${fraccion}\` son dos valores: el ${entera} y el ${Number(fraccion)}.`
            : ''),
        v.fila
      );
    };

    if (completa) {
      if (escritos.length !== valores.length) return errorDeCantidad();
    } else if (total < valores.length) {
      error(
        'ARREGLO_CHICO',
        `\`${n}\` puede guardar ${elementos(total)} y hay que guardar ${valores.length}: no alcanza.`,
        v.fila
      );
      return;
    }

    // El contenido, elemento por elemento. Un elemento que la lista no nombra
    // vale cero.
    const distinto = valores.findIndex((valor, i) =>
      i < escritos.length ? !coincide(escritos[i], valor) : valor !== 0
    );
    if (distinto >= 0) {
      if (distinto >= escritos.length) {
        error(
          'VALORES_SIN_NOMBRAR',
          escritos.length === 1
            ? `Así solo el primer elemento vale \`${escritos[0].texto.trim()}\`: los que la lista no nombra quedan en cero, no repiten el último valor.`
            : `Así solo los primeros ${escritos.length} elementos tienen los valores de la lista: los que no nombra quedan en cero.`,
          v.fila
        );
        return;
      }
      const e = escritos[distinto];
      const numeros = escritos.map((x) => (x.clase === 'numero' ? x.valor : NaN));
      const ordenar = (lista) => [...lista].sort((a, b) => a - b).join();
      if (e.clase === 'caracter' || e.clase === 'cadena') {
        error(
          'VALOR_ENTRE_COMILLAS',
          `\`${e.texto}\` con comillas no es un número: los números van sin comillas.`,
          v.fila
        );
      } else if (
        escritos.length === valores.length &&
        !numeros.some(Number.isNaN) &&
        ordenar(numeros) === ordenar(valores)
      ) {
        error('VALORES_EN_OTRO_ORDEN', 'Los valores son los del dibujo, pero están en otro orden.', v.fila);
      } else {
        error(
          'VALOR_DISTINTO',
          `El ${ordinal(distinto)} valor de la lista (\`${e.texto.trim()}\`) no coincide con el del dibujo.`,
          v.fila
        );
      }
      return;
    }

    // Lo del dibujo ya esta; lo que falta ver es lo que sobra.
    if (escritos.length > valores.length) return errorDeCantidad();
    if (total > valores.length) {
      error(
        'ARREGLO_GRANDE',
        `\`${n}\` puede guardar ${elementos(total)} y el arreglo del dibujo tiene ${valores.length}: sobra espacio.`,
        v.fila
      );
      return;
    }

    // Respuesta correcta. Para llenar de ceros alcanza un solo cero: es lo que
    // se le propone en lugar de dejar los corchetes vacios, porque seria
    // aconsejarle dos formas que no se pueden aplicar juntas.
    const todosCeros = valores.every((x) => x === 0);
    if (todosCeros && practicas.includes('claridad') && escritos.length > 1) {
      mejora(
        'CERO_ALCANZA',
        'Está bien, pero para llenar de ceros alcanza con escribir uno solo, `{0}`' +
          (dimension ? '' : ', indicando la cantidad entre los corchetes') +
          ': los elementos que la lista no nombra quedan en cero.',
        v.fila
      );
    } else if (completa && dimension && lugar != null && practicas.includes('constantes')) {
      // No es un numero magico: es la cantidad de valores que estan ahi
      // mismo. Lo que sobra es repetirla.
      mejora(
        'DIMENSION_REPETIDA',
        'La cantidad ya la dicen los valores: si deja los corchetes vacíos, el compilador la cuenta solo, y no hay que acordarse de cambiarla el día de mañana si se agrega o se quita un elemento.',
        v.fila
      );
    }
  }

  // ---- llamada a una funcion -------------------------------------------------

  // Lo que se le dice a quien escribio mal un argumento: esperado es el nombre
  // de una variable, un texto entre comillas dobles ("Juan") o una posicion de
  // un arreglo o de una tabla (nombres[0]).
  function esTexto(e) {
    return e.startsWith('"');
  }
  function esIndexado(e) {
    return /^[A-Za-z_]\w*\s*(\[[^\]]*\]\s*)+$/.test(e);
  }
  function sinEspacios(t) {
    return t.replace(/\s+/g, '');
  }

  function diagnosticarArgumento(llamada, i, esperado, real, modelo) {

    if (esTexto(esperado)) {
      const pedido = esperado.slice(1, -1);
      if (real.clase === 'cadena') {
        error(
          'TEXTO_DISTINTO',
          sinFinEscrito(real.contenido).texto.toLowerCase() === pedido.toLowerCase()
            ? `El texto no es el de la consigna: en C las mayúsculas y las minúsculas son letras distintas.`
            : 'El texto no es el que pide la consigna.',
          llamada.fila
        );
      } else if ((real.clase === 'otro' || real.clase === 'caracter') && real.texto.startsWith("'")) {
        error(
          'ARGUMENTO_COMILLAS_SIMPLES',
          `\`${real.texto}\` entre comillas simples: un texto va entre comillas dobles, las simples son para un solo carácter.`,
          llamada.fila
        );
      } else if (real.clase === 'nombre') {
        error(
          'ARGUMENTO_SIN_COMILLAS',
          `\`${real.nombre}\` sin comillas es el nombre de una variable, no un texto: un texto va entre comillas dobles.`,
          llamada.fila
        );
      } else {
        error(
          'ARGUMENTO_EQUIVOCADO',
          `El argumento ${i + 1} de \`${llamada.funcion}\` (\`${real.texto}\`) no es el que corresponde.`,
          llamada.fila
        );
      }
      return;
    }

    if (esIndexado(esperado)) {
      const base = /^[A-Za-z_]\w*/.exec(esperado)[0];
      const cantidad = (esperado.match(/\[/g) || []).length;
      if (real.clase === 'nombre' && real.nombre === base) {
        error(
          'ARGUMENTO_TABLA_ENTERA',
          `\`${base}\` contiene todos los textos: para guardar uno hay que elegir cuál, con ${cantidad === 1 ? 'un índice' : `${cantidad} índices`}.`,
          llamada.fila
        );
      } else if (real.clase === 'indice' && real.nombre === base && real.indices.length > cantidad) {
        error(
          'ARGUMENTO_CON_CORCHETES',
          `\`${real.texto}\` es un solo carácter de la cadena. Para pasar la cadena completa hay que quitar el último índice.`,
          llamada.fila
        );
      } else if (real.clase === 'indice' && real.nombre === base && diagnosticos.some((d) => d.codigo === 'INDICE_FUERA_DE_RANGO')) {
        // ya se dijo que esa fila no existe
      } else if (real.clase === 'indice' && real.nombre === base && real.indices.length < cantidad) {
        const variable = modelo.variables.findLast((v) => v.nombre === base);
        const quedan = variable ? variable.arreglo.length - real.indices.length : 2;
        error(
          'ARGUMENTO_FALTA_INDICE',
          `\`${real.texto}\` es ${quedan > 2 ? 'una tabla de cadenas' : 'un arreglo de cadenas'}, así que tiene varias adentro: falta indicar cuál con un ${ordinal(real.indices.length)} índice.`,
          llamada.fila
        );
      } else if (real.clase === 'indice' && real.nombre === base) {
        const [codigo, mensaje] = distintaPosicion(real, esperado, modelo);
        error(codigo, mensaje, llamada.fila);
      } else {
        error(
          'ARGUMENTO_EQUIVOCADO',
          `El argumento ${i + 1} de \`${llamada.funcion}\` (\`${real.texto}\`) no es el que corresponde.`,
          llamada.fila
        );
      }
      return;
    }

    if (real.clase === 'cadena' && real.contenido === esperado) {
      error(
        'ARGUMENTO_ENTRE_COMILLAS',
        `\`${real.texto}\` con comillas es un texto, no la variable \`${esperado}\`: el nombre de una variable va sin comillas.`,
        llamada.fila
      );
    } else if (real.clase === 'direccion' && real.nombre === esperado) {
      error(
        'ARGUMENTO_CON_AMPERSAND',
        `A \`${esperado}\` le sobra el \`&\`: una cadena se pasa con su nombre solo.`,
        llamada.fila
      );
    } else if (real.clase === 'indice' && real.nombre === esperado) {
      error(
        'ARGUMENTO_CON_CORCHETES',
        `\`${real.texto}\` es un solo carácter de la cadena. Para pasar la cadena completa va el nombre solo, sin corchetes.`,
        llamada.fila
      );
    } else if (real.clase === 'nombre' && !modelo.variables.some((v) => v.nombre === real.nombre)) {
      const parecida = modelo.variables.find((v) => v.nombre.toLowerCase() === real.nombre.toLowerCase());
      error(
        'VARIABLE_DESCONOCIDA',
        `No hay ninguna variable llamada \`${real.nombre}\`.` +
          (parecida
            ? ` La que está declarada es \`${parecida.nombre}\`: en C las mayúsculas y las minúsculas son letras distintas.`
            : ''),
        llamada.fila
      );
    } else {
      error(
        'ARGUMENTO_EQUIVOCADO',
        `El argumento ${i + 1} de \`${llamada.funcion}\` (\`${real.texto}\`) no es el que corresponde.`,
        llamada.fila
      );
    }
  }

  function reglaLlamada(regla, modelo) {
    const aceptadas = [regla.funcion, ...(regla.alternativas || [])];
    const esperados = (regla.argumentos || []).map(valorDe);
    const llamadas = modelo.llamadas.filter((l) => l.nuevo);
    const llamada = llamadas.find((l) => aceptadas.includes(l.funcion));


    if (!llamada) {
      // Los caracteres de a uno tambien llegan al mismo texto: vale, pero hay
      // una funcion que lo hace de una vez.
      if (regla.aMano) {
        const nombre = valorDe(regla.aMano.variable);
        const en = regla.aMano.en || [];
        const propias = alElementoDe(modelo, nombre, en).filter(
          (a) => valorDeDimension(a.izquierda.indices[en.length], modelo) != null
        );
        if (propias.length) {
          // Si ya se dijo que un texto no va en un caracter, o que esa posicion no existe, alcanza.
          if (diagnosticos.some((d) => ['INDICE_FUERA_DE_RANGO', 'ELEMENTO_ENTRE_COMILLAS_DOBLES'].includes(d.codigo))) return;
          const hallazgos = verificarElementos(nombre, regla.aMano.texto, propias, modelo, en);
          decir(hallazgos);
          if (!hallazgos.some((h) => h.nivel === 'error') && practicas.includes('claridad')) {
            mejora(
              'COPIA_A_MANO',
              'Está bien, pero la biblioteca de cadenas tiene una función que copia un texto de una vez.',
              propias[0].fila
            );
          }
          return;
        }
      }

      // Si ya se le dijo que un arreglo no se asigna con "=", o que un texto
      // no va en un caracter, con eso alcanza.
      if (
        diagnosticos.some((d) => [...CODIGOS_DE_ASIGNACION, 'ELEMENTO_ENTRE_COMILLAS_DOBLES'].includes(d.codigo))
      ) {
        return;
      }

      if (regla.funcion === 'strlen') {
        const tamano = modelo.sizeofs.find((s) => s.nuevo);
        if (tamano) {
          error(
            'SIZEOF_NO_CUENTA',
            '`sizeof` dice el tamaño de la cadena declarada, no cuántas letras tiene guardadas.',
            tamano.fila
          );
          return;
        }
      }
      if (regla.comparar) {
        const esDeTexto = (v) =>
          v.clase === 'cadena' ||
          (v.clase === 'nombre' &&
            modelo.variables.some((x) => x.nombre === v.nombre && x.arreglo.length > 0));
        const igual = modelo.comparaciones.find(
          (c) => c.nuevo && (esDeTexto(c.izquierda) || esDeTexto(c.derecha))
        );
        if (igual) {
          error(
            'COMPARAR_CON_IGUAL',
            'Con `==` no se comparan los textos de dos cadenas: hace falta una función de la biblioteca de cadenas.',
            igual.fila
          );
          return;
        }
      }

      const ciclo = modelo.ciclos.find((c) => c.nuevo);
      const otra = llamadas[0];
      const parecida =
        otra &&
        !DE_LA_BIBLIOTECA.includes(otra.funcion) &&
        aceptadas.find(
          (a) => a.toLowerCase() === otra.funcion.toLowerCase() || distancia(a, otra.funcion) <= 2
        );
      if (ciclo) {
        error(
          'A_MANO',
          'Hacerlo a mano, recorriendo carácter por carácter, puede funcionar, pero la consigna pide usar la función de la biblioteca.',
          ciclo.fila
        );
      } else if (parecida) {
        error(
          'FUNCION_MAL_ESCRITA',
          `No existe ninguna función llamada \`${otra.funcion}\`. ¿Quiso escribir \`${parecida}\`?`,
          otra.fila
        );
      } else if (otra) {
        error('FUNCION_EQUIVOCADA', `\`${otra.funcion}\` no es la función que pide esta consigna.`, otra.fila);
      } else {
        error(
          'LLAMADA_FALTA',
          'No encontré la llamada a una función. Una función se usa con su nombre y, entre paréntesis, sus argumentos: `funcion(a, b);`'
        );
      }
      return;
    }

    // La funcion pedida lleva justo esos argumentos; una alternativa puede
    // llevar alguno mas al final (strncpy y su cantidad).
    const reales = llamada.argumentos;
    const justos = llamada.funcion === regla.funcion;
    if (justos ? reales.length !== esperados.length : reales.length < esperados.length) {
      error(
        'ARGUMENTOS_CANTIDAD',
        `\`${llamada.funcion}\` lleva ${esperados.length} argumentos, separados por coma, y acá hay ${reales.length}.`,
        llamada.fila
      );
      return;
    }

    const libre = (i) => esperados[i] === '*';
    const acierta = (i) => libre(i) || coincide(esperados[i], reales[i]);
    if (esperados.every((_, i) => acierta(i))) {
      verificarLlamada(llamada);
      return;
    }

    // Lo mismo, en otro lugar.
    const escritos = esperados.map((_, i) => sinEspacios(reales[i].texto));
    const pedidos = esperados.map(sinEspacios);
    // Para saber si dos cadenas son iguales, el orden da lo mismo.
    if (regla.comparar && esperados.length === 2 && escritos[0] === pedidos[1] && escritos[1] === pedidos[0]) {
      verificarLlamada(llamada);
      return;
    }
    if (
      !esperados.includes('*') &&
      [...escritos].sort().join('\n') === [...pedidos].sort().join('\n')
    ) {
      error(
        'ARGUMENTOS_EN_OTRO_ORDEN',
        'Los argumentos están en otro orden.' +
          (regla.orden ? ` En \`${llamada.funcion}\` ${regla.orden}.` : ''),
        llamada.fila
      );
      return;
    }

    // El texto primero y la cadena despues: el orden es lo primero que hay que
    // decir, aunque la posicion tampoco sea la que pide la consigna.
    if (
      esperados.length === 2 &&
      !esTexto(esperados[0]) &&
      esTexto(esperados[1]) &&
      reales[0]?.clase === 'cadena' &&
      reales[1] &&
      reales[1].clase !== 'cadena'
    ) {
      error(
        'ARGUMENTOS_EN_OTRO_ORDEN',
        'Los argumentos están en otro orden.' +
          (regla.orden ? ` En \`${llamada.funcion}\` ${regla.orden}.` : ''),
        llamada.fila
      );
      return;
    }

    esperados.forEach((esperado, i) => {
      if (!acierta(i)) diagnosticarArgumento(llamada, i, esperado, reales[i], modelo);
    });

    // Con los argumentos bien: lo que se hace con la llamada.
    function verificarLlamada(l) {
      const argumentos = l.argumentos;

      // "Juan\0": el mismo texto, con un fin que ya estaba puesto.
      const conFin = esperados.findIndex(
        (e, i) => esTexto(e) && argumentos[i].clase === 'cadena' && sinFinEscrito(argumentos[i].contenido).ceros > 0
      );
      if (conFin >= 0 && practicas.includes('claridad')) {
        mejora('FIN_EN_EL_TEXTO', MEJORA_FIN_EN_EL_TEXTO, l.fila);
      }

      // Donde queda lo que devuelve: n = strlen(s);
      if (regla.resultadoEn && l.destino !== regla.resultadoEn) {
        if (l.destino == null) {
          error(
            'RESULTADO_PERDIDO',
            `\`${l.funcion}\` devuelve un valor, pero acá no se guarda en ninguna variable.`,
            l.fila
          );
        } else {
          error(
            'RESULTADO_EN_OTRA',
            `El valor que devuelve \`${l.funcion}\` se guarda en \`${l.destino}\`, y la consigna pide \`${regla.resultadoEn}\`.`,
            l.fila
          );
        }
        return;
      }

      // Comparar dos cadenas: en la condicion de un if, y mirando el cero.
      if (regla.comparar) {
        if (!l.enIf && l.destino) {
          // int r = strcmp(a, b);  y despues  if (r == 0)
          const x = l.destino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const condiciones = modelo.ifs.filter((i) => i.nuevo).map((i) => i.condicion.replace(/\s+/g, ''));
          const esta = (patron) => condiciones.some((c) => new RegExp(patron).test(c));
          if (esta('^' + x + '==0$|^0==' + x + '$')) {
            // lo de siempre
          } else if (esta('^!' + x + '$')) {
            if (practicas.includes('claridad')) {
              mejora(
                'STRCMP_SIN_COMPARAR',
                'Está bien, pero `strcmp` devuelve `0` cuando las cadenas son iguales, y compararlo con `0` deja a la vista qué se está preguntando.',
                l.fila
              );
            }
          } else if (esta('^' + x + '$|^' + x + '!=0$|^0!=' + x + '$')) {
            error(
              'STRCMP_AL_REVES',
              '`strcmp` devuelve `0` cuando las cadenas son iguales: así la condición se cumple cuando son distintas.',
              l.fila
            );
          } else {
            error(
              'RESULTADO_SIN_COMPARAR',
              `El valor que devuelve \`strcmp\` se guarda en \`${l.destino}\`, pero ninguna condición de un \`if\` lo compara con \`0\`.`,
              l.fila
            );
          }
        } else if (!l.enIf) {
          error('COMPARACION_FUERA_DEL_IF', 'La comparación tiene que estar en la condición de un `if`.', l.fila);
        } else if (l.uso === 'negada') {
          if (practicas.includes('claridad')) {
            mejora(
              'STRCMP_SIN_COMPARAR',
              'Está bien, pero `strcmp` devuelve `0` cuando las cadenas son iguales, y compararlo con `0` deja a la vista qué se está preguntando.',
              l.fila
            );
          }
        } else if (l.uso === 'sola' || l.uso === 'distinto-cero') {
          error(
            'STRCMP_AL_REVES',
            '`strcmp` devuelve `0` cuando las cadenas son iguales: así la condición se cumple cuando son distintas.',
            l.fila
          );
        } else if (l.uso !== 'igual-cero') {
          error(
            'STRCMP_USO',
            'Para saber si dos cadenas son iguales hay que mirar si `strcmp` devuelve `0`.',
            l.fila
          );
        }
      }

      // strncpy con un limite que no deja lugar para el '\0'.
      if (l.funcion === 'strncpy' && esperados.length >= 2 && esTexto(esperados[1]) && argumentos[2]) {
        const tope =
          argumentos[2].clase === 'numero' ? argumentos[2].valor : valorDeDimension(argumentos[2].texto, modelo);
        if (tope != null && tope < esperados[1].length - 2 + 1) {
          error(
            'COPIA_SIN_FIN',
            'Con ese límite no se copia el `\'\\0\'`: el texto queda sin terminar.',
            l.fila
          );
        }
      }
    }
  }

  // ---- leer y mostrar ---------------------------------------------------------

  // Si un argumento es justo lo que pedia la consigna, escrito como sea.
  function coincide(esperado, real) {
    if (!real) return false;
    if (esTexto(esperado)) {
      return real.clase === 'cadena' && sinFinEscrito(real.contenido).texto === esperado.slice(1, -1);
    }
    if (esIndexado(esperado)) {
      return real.clase === 'indice' && sinEspacios(real.texto) === sinEspacios(esperado);
    }
    return real.clase === 'nombre' && real.nombre === esperado;
  }

  // Lo que se hace con una lectura ya encontrada: "esperado" es donde tiene que
  // guardarse ("nombre", "curso[0]") y "formato" es "palabra" (scanf con %s) o
  // "linea" (hasta el Enter, con sus espacios).
  function verificarLectura(l, esperado, formato, modelo) {
    const base = /^[A-Za-z_]\w*/.exec(esperado)[0];
    const indices = (esperado.match(/\[/g) || []).length;
    const variable = modelo.variables.findLast((v) => v.nombre === base);
    const lugar = variable ? valorDeDimension(variable.arreglo[indices] ?? '', modelo) : null;
    const palabra = formato === 'palabra';

    if (l.funcion === 'gets' || l.funcion === 'fgets') {
      if (palabra) {
        error(
          'LECTURA_LEE_LA_LINEA',
          `\`${l.funcion}\` lee la línea completa, con sus espacios, y la consigna pide una palabra: para eso se usa \`scanf\` con \`%s\`.`,
          l.fila
        );
        return;
      }
      const cantidad = l.funcion === 'gets' ? 1 : 3;
      if (l.argumentos.length !== cantidad) {
        error(
          'ARGUMENTOS_CANTIDAD',
          l.funcion === 'gets'
            ? '`gets` lleva un solo argumento: la cadena donde se guarda lo que se lee.'
            : '`fgets` lleva tres argumentos, separados por coma: la cadena donde se guarda, cuántos caracteres leer como máximo y de dónde se lee.',
          l.fila
        );
        return;
      }
      if (!coincide(esperado, l.argumentos[0])) {
        diagnosticarArgumento(l, 0, esperado, l.argumentos[0], modelo);
        return;
      }
      if (l.funcion === 'gets') {
        // Un aviso y no una mejora: la respuesta esta completa, y es lo que se usa
        // para practicar. Siempre, y no solo con la practica de claridad.
        aviso(
          'USO_DE_GETS',
          '`gets` no controla cuánto texto se escribe, y por eso se lo considera peligroso: sirve para practicar, pero no se usa en programas reales. Una alternativa más segura es la función `fgets`.',
          l.fila
        );
        return;
      }
      const [, maximo, de] = l.argumentos;
      if (de.clase !== 'nombre' || de.nombre !== 'stdin') {
        error(
          'FGETS_SIN_STDIN',
          'El tercer argumento de `fgets` dice de dónde se lee: para leer del teclado es `stdin`.',
          l.fila
        );
      } else if (maximo.clase === 'numero' && lugar != null && maximo.valor > lugar) {
        error(
          'LECTURA_SIN_LUGAR',
          `Con ese límite se pueden guardar ${maximo.valor} caracteres, y \`${esperado}\` tiene lugar para ${lugar}: lo que sobra pisa la memoria que sigue.`,
          l.fila
        );
      }
      return;
    }

    // scanf
    if (l.argumentos.length !== 2) {
      error(
        'ARGUMENTOS_CANTIDAD',
        '`scanf` lleva el formato y, separada con una coma, la variable donde se guarda lo que se lee.',
        l.fila
      );
      return;
    }
    const formatoReal = l.argumentos[0];
    const m = formatoReal.clase === 'cadena' ? /^\s*%(\d*)(s|\[\^\\n\])$/.exec(formatoReal.contenido) : null;
    if (!m) {
      error(
        'FORMATO_NO_ES_TEXTO',
        'El primer argumento no es el formato de lectura de un texto: cada tipo de dato tiene el suyo.',
        l.fila
      );
      return;
    }
    if (palabra && m[2] !== 's') {
      error(
        'LECTURA_LEE_LA_LINEA',
        'Ese formato lee la línea completa, con sus espacios, y la consigna pide una palabra: para eso alcanza `%s`.',
        l.fila
      );
      return;
    }
    if (!palabra && m[2] === 's') {
      error(
        'LECTURA_CORTA_EN_ESPACIO',
        'El formato `%s` deja de leer al llegar a un espacio: con un nombre como `Ana Maria` solo guardaría `Ana`. Para leer la línea completa, con sus espacios, se usa `gets`.',
        l.fila
      );
      return;
    }
    if (!coincide(esperado, l.argumentos[1])) {
      diagnosticarArgumento(l, 1, esperado, l.argumentos[1], modelo);
      return;
    }
    if (m[1] === '') {
      if (palabra && practicas.includes('claridad')) {
        mejora(
          'LECTURA_SIN_LIMITE',
          'Está bien, pero si se escribe más texto del que entra, se pisa lo que sigue en memoria. El formato `%s` permite indicar, con un número entre el `%` y la `s`, cuántos caracteres leer como máximo.' +
            (lugar != null ? ` Para \`${esperado}\`, que puede guardar ${lugar - 1} letras, sería \`%${lugar - 1}s\`.` : ''),
          l.fila
        );
      }
    } else if (lugar != null && Number(m[1]) >= lugar) {
      error(
        'LECTURA_SIN_LUGAR_PARA_FIN',
        `Con ese límite se pueden leer ${m[1]} caracteres, y \`${esperado}\` puede guardar ${lugar}: falta el espacio del \`'\\0'\` del final.`,
        l.fila
      );
    }
  }

  // Leer del teclado el texto de una variable (o de una posicion de un arreglo).
  function reglaLee(regla, modelo) {
    const esperado = valorDe(regla.destino);
    const base = /^[A-Za-z_]\w*/.exec(esperado)[0];
    const lecturas = modelo.llamadas.filter((l) => l.nuevo && LECTURAS.includes(l.funcion));

    if (!lecturas.length) {
      const otra = modelo.llamadas.find((l) => l.nuevo && !MUESTRAS.includes(l.funcion));
      if (otra) {
        error('FUNCION_EQUIVOCADA', `\`${otra.funcion}\` no es la función que pide esta consigna.`, otra.fila);
      } else {
        error(
          'LECTURA_FALTA',
          'No encontré la lectura desde el teclado. Una función se usa con su nombre y, entre paréntesis, sus argumentos: `funcion(a, b);`'
        );
      }
      return;
    }
    const l = lecturas.find((x) => destinoDeLectura(x)?.nombre === base) || lecturas[0];
    verificarLectura(l, esperado, regla.formato, modelo);
  }

  // Mostrar en pantalla el texto de una variable.
  function reglaMuestra(regla, modelo) {
    const esperado = valorDe(regla.destino);
    const salidas = modelo.llamadas.filter((l) => l.nuevo && MUESTRAS.includes(l.funcion));

    if (!salidas.length) {
      const otra = modelo.llamadas.find((l) => l.nuevo && !LECTURAS.includes(l.funcion) && l.funcion !== 'getchar');
      if (otra) {
        error('FUNCION_EQUIVOCADA', `\`${otra.funcion}\` no es la función que pide esta consigna.`, otra.fila);
      } else {
        error(
          'MUESTRA_FALTA',
          'No encontré la llamada que muestra el texto en pantalla. Una función se usa con su nombre y, entre paréntesis, sus argumentos: `funcion(a, b);`'
        );
      }
      return;
    }
    const l = salidas[0];

    if (l.funcion === 'puts') {
      if (regla.formato) {
        error(
          'FUNCION_EQUIVOCADA',
          '`puts` muestra solo la cadena, sin nada más: para escribir el saludo hace falta `printf`.',
          l.fila
        );
        return;
      }
      if (l.argumentos.length !== 1) {
        error('ARGUMENTOS_CANTIDAD', '`puts` lleva un solo argumento: la cadena que se muestra.', l.fila);
        return;
      }
      if (!coincide(esperado, l.argumentos[0])) {
        diagnosticarArgumento(l, 0, esperado, l.argumentos[0], modelo);
        return;
      }
    } else {
      const formato = l.argumentos[0];
      if (!formato) {
        error(
          'ARGUMENTOS_CANTIDAD',
          '`printf` lleva, como mínimo, el formato: un texto entre comillas dobles.',
          l.fila
        );
        return;
      }
      if (formato.clase !== 'cadena') {
        error(
          'PRINTF_SIN_FORMATO',
          'El primer argumento de `printf` es el formato: un texto entre comillas dobles que lleva `%s` en el lugar donde va el contenido de la cadena.',
          l.fila
        );
        return;
      }
      const conversiones = formato.contenido.replace(/%%/g, '').match(/%[-+ #0]*\d*(?:\.\d+)?[a-zA-Z]/g) || [];
      if (!conversiones.length) {
        error(
          'MUESTRA_TEXTO_FIJO',
          `Eso escribe en pantalla el texto tal cual: para mostrar lo que guarda \`${esperado}\` el formato lleva \`%s\`, que se reemplaza por el contenido de la cadena.`,
          l.fila
        );
        return;
      }
      const mala = conversiones.find((c) => !c.endsWith('s'));
      if (mala) {
        error(
          'FORMATO_NO_ES_TEXTO',
          `\`${mala}\` no es el formato de un texto: cada tipo de dato tiene el suyo, y el de una cadena es \`%s\`.`,
          l.fila
        );
        return;
      }
      const valores = l.argumentos.length - 1;
      if (valores !== conversiones.length) {
        error(
          'ARGUMENTOS_CANTIDAD',
          `El formato pide ${conversiones.length === 1 ? '1 valor' : `${conversiones.length} valores`} y \`printf\` recibe ${valores}: hace falta uno por cada \`%s\`, separados por coma.`,
          l.fila
        );
        return;
      }
      for (let i = 1; i < l.argumentos.length; i++) {
        if (!coincide(esperado, l.argumentos[i])) {
          diagnosticarArgumento(l, i, esperado, l.argumentos[i], modelo);
          return;
        }
      }
      if (regla.formato) {
        // El salto de linea del final es un detalle: no cambia el mensaje.
        const escrito = formato.contenido.replace(/(\\n)+$/, '');
        if (escrito !== regla.formato) {
          error(
            'TEXTO_DISTINTO',
            escrito.toLowerCase() === regla.formato.toLowerCase()
              ? 'El texto no es el de la consigna: en C las mayúsculas y las minúsculas son letras distintas.'
              : 'El texto que se muestra no es el que pide la consigna.',
            l.fila
          );
          return;
        }
      }
    }

    if (regla.despuesDeLeer) {
      const leyo = modelo.llamadas.some((x) => LECTURAS.includes(x.funcion) && x.fin <= l.posicion);
      const hayLectura = modelo.llamadas.some((x) => LECTURAS.includes(x.funcion));
      if (hayLectura && !leyo) {
        error(
          'MUESTRA_ANTES_DE_LEER',
          `Se muestra \`${esperado}\` antes de leerla: en ese momento todavía no tiene el texto que se escribe.`,
          l.fila
        );
      }
    }
  }

  // Despues de leer con scanf queda el Enter sin leer, y gets lo toma como una
  // linea vacia: entre las dos lecturas hay que descartarlo. Vale cualquiera de
  // las tres formas (la unica que anda en todos lados es el ciclo).
  function reglaLimpiaEntrada(regla, modelo) {
    const lectura = modelo.llamadas.find((l) => l.nuevo && (l.funcion === 'gets' || l.funcion === 'fgets'));
    if (!lectura) return; // lo dice la regla de la lectura
    const anterior = modelo.llamadas.filter((l) => l.funcion === 'scanf' && l.fin <= lectura.posicion).pop();
    if (!anterior) return;

    const entre = (x) => x.nuevo && x.posicion >= anterior.fin && x.fin <= lectura.posicion;
    const sinEsp = (t) => t.replace(/\s+/g, '');
    const limpiadores = modelo.ciclos.filter((c) => entre(c) && /getchar\(\)/.test(sinEsp(c.texto)));
    const hastaElEnter = (c) => /!=(?:'\\n'|10)(?![\d])|(?:'\\n'|10)!=/.test(sinEsp(c.condicion));
    const bien = limpiadores.find(hastaElEnter);

    if (bien) {
      if (/(?:!=10(?![\d])|10!=)/.test(sinEsp(bien.condicion)) && practicas.includes('claridad')) {
        mejora(
          'LIMPIEZA_CON_CODIGO',
          "Está bien, pero `'\\n'` dice qué carácter es: con `10` hay que saber su código.",
          bien.fila
        );
      }
      return;
    }
    if (limpiadores.length) {
      const c = limpiadores[0];
      if (/==(?:'\\n'|10)/.test(sinEsp(c.condicion))) {
        error(
          'LIMPIEZA_AL_REVES',
          'El ciclo tiene que repetirse mientras lo leído no sea el Enter: con `==` termina en cuanto lee un carácter distinto y no descarta lo que quedó sin leer.',
          c.fila
        );
      } else {
        error(
          'LIMPIEZA_SIN_ENTER',
          "El ciclo lee caracteres, pero no se detiene al llegar al Enter (`'\\n'`): así sigue esperando más texto.",
          c.fila
        );
      }
      return;
    }

    const fuera = (x) => !limpiadores.some((c) => x.posicion >= c.posicion && x.fin <= c.fin);
    const sueltas = modelo.llamadas.filter((l) => entre(l) && l.funcion === 'getchar' && fuera(l));
    if (sueltas.length) {
      mejora(
        'GETCHAR_UN_SOLO_CARACTER',
        "Está bien, pero `getchar()` descarta un solo carácter: alcanza si no se escribió nada más antes del Enter. Para que funcione siempre, use `while (getchar() != '\\n');`, que descarta todo hasta el Enter.",
        sueltas[0].fila
      );
      return;
    }
    const vaciadas = modelo.llamadas.filter(
      (l) => entre(l) && l.funcion === 'fflush' && l.argumentos[0]?.clase === 'nombre' && l.argumentos[0].nombre === 'stdin'
    );
    if (vaciadas.length) {
      mejora(
        'FFLUSH_ENTRADA',
        "Está bien, pero `fflush` con una entrada funciona en algunos compiladores y en otros no: el estándar no define qué hace. Para que ande en cualquier plataforma, use `while (getchar() != '\\n');`.",
        vaciadas[0].fila
      );
      return;
    }

    const despues = modelo.llamadas.find(
      (l) => l.nuevo && ['getchar', 'fflush'].includes(l.funcion) && l.posicion >= lectura.fin
    );
    if (despues || modelo.ciclos.some((c) => c.nuevo && c.posicion >= lectura.fin && /getchar\(\)/.test(sinEsp(c.texto)))) {
      error(
        'LIMPIEZA_DESPUES',
        `Eso descarta el Enter, pero va después de \`${lectura.funcion}\`: para que sirva tiene que estar antes, porque \`${lectura.funcion}\` ya tomó el Enter que había quedado.`,
        (despues || lectura).fila
      );
      return;
    }
    error(
      'FALTA_LIMPIAR_ENTRADA',
      `Después de leer con \`scanf\` queda el Enter sin leer, y \`${lectura.funcion}\` lo toma como si fuera lo escrito: el texto queda vacío. Antes de leer hay que descartarlo.`,
      lectura.fila
    );
  }

  // ---- cadenas --------------------------------------------------------------

  // (funciones y no constantes: las reglas se aplican antes de llegar a esta parte)
  function letrasDe(n) {
    return n === 1 ? '1 letra' : `${n} letras`;
  }
  function caracteresDe(n) {
    return n === 1 ? '1 carácter' : `${n} caracteres`;
  }
  function esFinDeCadena(v) {
    return (v.clase === 'caracter' || v.clase === 'numero') && v.valor === 0;
  }

  // El tamano de un arreglo de caracteres. Una cadena de hasta N letras
  // necesita N + 1 espacios, el ultimo para el '\0', y cuando falta justo uno
  // se dice por que. Con una tabla, cada numero es una dimension. Devuelve si
  // quedo bien.
  //   minimo: { tamano: 11 | [30, 26], letras: 10 | 25 }   justo ese tamano
  //           { alMenos: 11 | [30, 26], letras: 10 | 25 }  ese o mas
  function verificarAlMenos(declarado, minimo, modelo) {
    const n = declarado.nombre;
    const exacto = minimo.tamano != null;
    const pedidos = [].concat(exacto ? minimo.tamano : minimo.alMenos);
    const esTabla = pedidos.length > 1;
    const letras = minimo.letras;
    // Lo que cuenta cada corchete que no es el de las letras.
    const unidad = (k) => (pedidos.length === 3 ? (k === 0 ? 'filas' : 'columnas') : esTabla ? 'textos' : 'elementos');
    let bien = true;

    // Dos numeros de una tabla, uno por otro.
    if (esTabla) {
      const escritos = pedidos.map((_, k) => valorDeDimension(declarado.arreglo[k] ?? '', modelo));
      const lugares = pedidos.length === 3 ? ['primeros', 'segundos', 'últimos'] : ['primeros', 'segundos'];
      const que =
        pedidos.length === 3
          ? ['la cantidad de filas', 'la de columnas', 'el tamaño de cada texto']
          : ['la cantidad de textos', 'el tamaño de cada uno'];
      for (let k = 0; k + 1 < pedidos.length; k++) {
        if (pedidos[k] !== pedidos[k + 1] && escritos[k] === pedidos[k + 1] && escritos[k + 1] === pedidos[k]) {
          error(
            'DIMENSIONES_AL_REVES',
            `Las dimensiones de \`${n}\` están al revés: entre los ${lugares[k]} corchetes va ${que[k]} y entre los ${lugares[k + 1]} ${que[k + 1]}.`,
            declarado.fila
          );
          return false;
        }
      }
    }

    for (const [k, pedido] of pedidos.entries()) {
      const escrito = (declarado.arreglo[k] ?? '').trim();
      if (!escrito) {
        error('ARREGLO_SIN_DIMENSION', `A \`${n}\` le falta la cantidad entre los corchetes.`, declarado.fila);
        return false;
      }
      const tiene = valorDeDimension(escrito, modelo);
      if (tiene == null) continue;
      const esDeLetras = letras != null && k === pedidos.length - 1;
      if (tiene > pedido && exacto) {
        // Entra, pero no es lo que se pide: con el tamano justo, un numero
        // cualquiera no alcanza para mostrar que se penso en el fin.
        bien = false;
        error(
          'ARREGLO_GRANDE',
          esDeLetras
            ? esTabla
              ? `En \`${n}\`, cada texto puede tener ${caracteresDe(tiene)}, más de los que hacen falta para uno de ${letrasDe(letras)}.`
              : `\`${n}\` puede guardar ${caracteresDe(tiene)}, más de los que hacen falta para un texto de ${letrasDe(letras)}.`
            : `\`${n}\` puede guardar ${tiene} ${unidad(k)} y la consigna pide ${pedido}: sobra espacio.`,
          declarado.fila
        );
        continue;
      }
      if (tiene >= pedido) continue;
      bien = false;
      if (esDeLetras && tiene === pedido - 1) {
        error(
          'CADENA_SIN_FIN',
          (esTabla
            ? `En \`${n}\`, cada texto puede tener ${caracteresDe(tiene)}, y uno de ${letrasDe(letras)} los ocupa todos`
            : `\`${n}\` puede guardar ${caracteresDe(tiene)}, y un texto de ${letrasDe(letras)} los ocupa todos`) +
            ': no queda espacio para el carácter `\'\\0\'` que marca el final de la cadena.',
          declarado.fila
        );
      } else if (esDeLetras) {
        error(
          'ARREGLO_CHICO',
          esTabla
            ? `En \`${n}\`, cada texto puede tener ${caracteresDe(tiene)} y no alcanza para uno de ${letrasDe(letras)}.`
            : `\`${n}\` puede guardar ${caracteresDe(tiene)} y no alcanza para un texto de ${letrasDe(letras)}.`,
          declarado.fila
        );
      } else {
        error(
          'ARREGLO_CHICO',
          `\`${n}\` puede guardar ${tiene} ${unidad(k)} y hay que guardar ${pedido}: no alcanza.`,
          declarado.fila
        );
      }
    }
    return bien;
  }

  // Una variable de un solo caracter con su valor: 'A', no "A".
  function verificarCaracter(v, regla) {
    const n = v.nombre;
    const inicial = v.inicial;
    const esperado = regla.caracter.codePointAt(0);
    if (!inicial) {
      error(
        'CARACTER_SIN_VALOR',
        `\`${n}\` está declarada, pero sin valor: la consigna pide dárselo en la misma sentencia.`,
        v.fila
      );
      return;
    }
    if (inicial.clase === 'cadena') {
      error(
        'CARACTER_CON_COMILLAS_DOBLES',
        `\`${inicial.texto}\` entre comillas dobles es un texto: un solo carácter va entre comillas simples.`,
        v.fila
      );
      return;
    }
    if (inicial.clase === 'caracter' && inicial.valor === esperado) return;
    if (inicial.clase === 'numero' && inicial.valor === esperado) {
      if (practicas.includes('claridad')) {
        mejora(
          'CARACTER_COMO_NUMERO',
          'Funciona, porque cada carácter tiene un código numérico, pero la letra entre comillas simples se lee mejor.',
          v.fila
        );
      }
      return;
    }
    const mismo =
      inicial.clase === 'caracter' &&
      inicial.valor != null &&
      String.fromCodePoint(inicial.valor).toLowerCase() === regla.caracter.toLowerCase();
    error(
      'CARACTER_DISTINTO',
      mismo
        ? `\`${inicial.texto}\` no es la letra de la consigna: en C las mayúsculas y las minúsculas son letras distintas.`
        : `\`${n}\` no guarda la letra que pide la consigna.`,
      v.fila
    );
  }

  // Una cadena que tiene que empezar vacia: con "", con {0} o con {'\0'}.
  function verificarVacia(v) {
    const n = v.nombre;
    const inicial = v.inicial;
    if (!inicial) {
      error(
        'CADENA_SIN_INICIAL',
        `\`${n}\` está declarada pero sin valor inicial: lo que tiene adentro es lo que hubiera en esa memoria, no una cadena vacía.`,
        v.fila
      );
      return;
    }
    if (inicial.clase === 'cadena') {
      if (inicial.texto.length > 2) {
        error('CADENA_NO_VACIA', `\`${n}\` empieza con texto: no es una cadena vacía.`, v.fila);
      }
      return;
    }
    if (inicial.clase === 'lista') {
      const e = inicial.elementos;
      if (!e.length || !esFinDeCadena(e[0])) {
        error(
          'CADENA_NO_VACIA',
          e.length && e[0].clase === 'caracter'
            ? `\`${e[0].texto}\` no es el carácter de fin de la cadena: así \`${n}\` no empieza vacía.`
            : `\`${n}\` no empieza vacía: el primer carácter tiene que ser el que marca el final de la cadena.`,
          v.fila
        );
      } else if (e.length > 1 && e.every(esFinDeCadena) && practicas.includes('claridad')) {
        mejora(
          'VACIA_DE_MAS',
          'Está bien, pero para que la cadena quede vacía alcanza con el primer carácter: lo que la lista no nombra queda en cero.',
          v.fila
        );
      }
      return;
    }
    error('CADENA_NO_VACIA', `\`${n}\` tiene que empezar como una cadena vacía.`, v.fila);
  }

  // Una cadena declarada con su texto en la misma sentencia: "Hola", o sus
  // caracteres uno por uno entre llaves ("como": "lista").
  function verificarCadenaInicial(v, regla, modelo) {
    const n = v.nombre;
    const texto = regla.texto;
    const inicial = v.inicial;
    if (!inicial) {
      const aparte = modelo.asignaciones.some(
        (a) => a.nuevo && a.izquierda.clase === 'indice' && a.izquierda.nombre === n
      );
      error(
        aparte ? 'VALORES_APARTE' : 'CADENA_SIN_TEXTO',
        aparte
          ? `La consigna pide darle el texto a \`${n}\` en la misma sentencia en que se la declara, no de a una posición después.`
          : `\`${n}\` está declarada, pero sin el texto: la consigna pide dárselo en esa misma sentencia.`,
        v.fila
      );
      return;
    }
    const dimension = v.arreglo[0].trim();
    const lugar = dimension ? valorDeDimension(dimension, modelo) : null;

    if (inicial.clase === 'cadena') {
      if (regla.como === 'lista') {
        error(
          'CADENA_NO_ES_LISTA',
          'La consigna pide los caracteres uno por uno: cada uno entre comillas simples, y todos entre llaves.',
          v.fila
        );
        return;
      }
      // "Hola\0" es el mismo texto: el fin escrito de mas no es un error.
      const { texto: contenido, ceros } = sinFinEscrito(inicial.contenido ?? inicial.texto.slice(1, -1));
      if (contenido !== texto) {
        error(
          'TEXTO_DISTINTO',
          contenido.toLowerCase() === texto.toLowerCase()
            ? 'El texto no es el de la consigna: en C las mayúsculas y las minúsculas son letras distintas.'
            : 'El texto no es el que pide la consigna.',
          v.fila
        );
        return;
      }
      // Lo que ocupa lo escrito: sus letras y los fines que se escribieron. Sin
      // ninguno, tiene que quedar un espacio mas para el que pone el compilador.
      const antes = diagnosticos.length;
      if (lugar != null) {
        if (lugar < texto.length + ceros) {
          error(
            'ARREGLO_CHICO',
            `\`${n}\` puede guardar ${caracteresDe(lugar)} y el texto ocupa ${caracteresDe(texto.length + ceros)}: no entra.`,
            v.fila
          );
        } else if (ceros === 0 && lugar === texto.length) {
          error(
            'CADENA_SIN_FIN',
            `El texto ocupa todo el espacio de \`${n}\`: no queda espacio para el carácter \`'\\0'\` del final. C lo permite, pero la cadena queda sin terminar.`,
            v.fila
          );
        }
      }
      if (diagnosticos.length === antes && practicas.includes('claridad')) {
        if (ceros > 0) {
          mejora('FIN_EN_EL_TEXTO', MEJORA_FIN_EN_EL_TEXTO, v.fila);
        }
        if (lugar != null) {
          mejora(
            'CADENA_DIMENSION_INNECESARIA',
            'Está bien, pero si deja los corchetes vacíos el compilador reserva justo el espacio que hace falta, incluido el carácter `\'\\0\'` del final.',
            v.fila
          );
        }
      }
      return;
    }

    // 'Hola' entre comillas simples: el analizador lo lee como un caracter.
    if (inicial.clase === 'caracter') {
      error(
        'CADENA_CON_COMILLAS_SIMPLES',
        `\`${inicial.texto.trim()}\` entre comillas simples: un texto va entre comillas dobles, las simples son para un solo carácter.`,
        v.fila
      );
      return;
    }

    if (inicial.clase === 'lista') {
      const elementos = inicial.elementos;
      const esperados = [...texto].map((c) => c.codePointAt(0));
      const noEsCaracter = elementos.find(
        (e) => e.clase !== 'caracter' && !(e.clase === 'numero' && e.valor === 0)
      );
      if (noEsCaracter) {
        error(
          'LISTA_DE_CARACTERES',
          `\`${noEsCaracter.texto.trim()}\` no es un carácter: los de la lista van cada uno entre comillas simples.`,
          v.fila
        );
        return;
      }
      const distinto = elementos.findIndex((e, i) => i < esperados.length && e.valor !== esperados[i]);
      if (distinto >= 0) {
        error('VALOR_DISTINTO', `El ${ordinal(distinto)} carácter de la lista no es el del texto.`, v.fila);
        return;
      }
      const total = lugar ?? elementos.length;
      if (elementos.length < esperados.length || total < esperados.length) {
        error(
          'ARREGLO_CHICO',
          `La lista tiene ${elementos.length} caracteres y el texto tiene ${letrasDe(esperados.length)}: faltan letras.`,
          v.fila
        );
        return;
      }
      if (elementos.slice(esperados.length).some((e) => !esFinDeCadena(e))) {
        error('VALORES_DE_MAS', 'Después de las letras del texto sobra algún carácter en la lista.', v.fila);
        return;
      }
      // Termina en '\0' si lo escribe o si queda lugar: lo que no se nombra vale cero.
      const terminada = elementos.length > esperados.length || total > esperados.length;
      if (!terminada) {
        error(
          'CADENA_SIN_FIN',
          `Esa lista termina en la última letra: así \`${n}\` es un arreglo de caracteres, pero no una cadena, porque falta el carácter que marca el final.`,
          v.fila
        );
        return;
      }
      if (regla.como !== 'lista' && practicas.includes('claridad')) {
        mejora(
          'CADENA_COMO_TEXTO',
          'Está bien, pero un texto entre comillas dobles se escribe más corto y deja puesto el carácter `\'\\0\'` del final.',
          v.fila
        );
      }
      return;
    }

    error('CADENA_INICIAL_NO_TEXTO', `\`${n}\` tiene que empezar con el texto que pide la consigna.`, v.fila);
  }

  // Una tabla definida con textos: una cadena por fila.
  function verificarTextos(v, regla, modelo) {
    const n = v.nombre;
    const textos = regla.textos;
    const inicial = v.inicial;
    if (!inicial) {
      const aparte = modelo.asignaciones.some(
        (a) => a.nuevo && a.izquierda.clase === 'indice' && a.izquierda.nombre === n
      );
      error(
        aparte ? 'VALORES_APARTE' : 'VALORES_FALTAN',
        aparte
          ? `La consigna pide darle los textos a \`${n}\` en la misma sentencia en que se la define.`
          : `\`${n}\` está definida, pero sin sus textos: la consigna pide dárselos en esa misma sentencia.`,
        v.fila
      );
      return;
    }
    if (inicial.clase !== 'lista') {
      error('VALORES_SIN_LISTA', 'Los textos van todos juntos, en una lista entre llaves.', v.fila);
      return;
    }
    const escritos = inicial.elementos;
    if (!escritos.length) {
      error('LISTA_VACIA', 'La lista está vacía: tiene que traer los textos.', v.fila);
      return;
    }
    if (escritos.some((e) => e.clase === 'lista')) {
      error('VALORES_ANIDADOS', 'Cada texto va entre sus comillas dobles, sin llaves propias.', v.fila);
      return;
    }
    const noTexto = escritos.find((e) => e.clase !== 'cadena');
    if (noTexto) {
      const simples = noTexto.texto.trim().startsWith("'");
      error(
        simples ? 'TEXTO_CON_COMILLAS_SIMPLES' : 'VALOR_NO_ES_TEXTO',
        simples
          ? `\`${noTexto.texto.trim()}\` entre comillas simples: un texto va entre comillas dobles, las simples son para un solo carácter.`
          : `\`${noTexto.texto.trim()}\` no es un texto: cada texto va entre comillas dobles.`,
        v.fila
      );
      return;
    }
    if (escritos.length !== textos.length) {
      error(
        escritos.length < textos.length ? 'TEXTOS_DE_MENOS' : 'TEXTOS_DE_MAS',
        `La lista tiene ${escritos.length} textos y la consigna pide ${textos.length}.`,
        v.fila
      );
      return;
    }
    // "lunes\0" es el mismo texto, con el fin escrito de mas.
    const leidos = escritos.map((e) => sinFinEscrito(e.contenido));
    // Cuando la consigna no dicta como se escriben, las mayusculas no cuentan.
    const igual = (a, b) => (regla.sinDistinguirMayusculas ? a.toLowerCase() === b.toLowerCase() : a === b);
    const noCoincide = leidos.findIndex((e, i) => !igual(e.texto, textos[i]));
    if (noCoincide >= 0) {
      const e = escritos[noCoincide];
      const mismo = leidos[noCoincide].texto.toLowerCase() === textos[noCoincide].toLowerCase();
      error(
        'TEXTO_DISTINTO',
        `El ${ordinal(noCoincide)} texto de la lista (\`${e.texto.trim()}\`) no es el que corresponde` +
          (mismo ? ': en C las mayúsculas y las minúsculas son letras distintas.' : '.'),
        v.fila
      );
      return;
    }

    const antes = diagnosticos.length;
    const deFilas = v.arreglo[0].trim();
    const deColumnas = v.arreglo[1].trim();
    if (!deColumnas) {
      error(
        'TABLA_SIN_COLUMNAS',
        'Solo se puede dejar vacía la cantidad de textos: el tamaño de cada texto hay que escribirlo.',
        v.fila
      );
      return;
    }
    // Lo que ocupa cada texto: sus letras y los fines que se escribieron.
    const ocupan = leidos.map((e) => e.texto.length + e.ceros);
    const mayor = Math.max(...ocupan);
    // El mas largo, tal como lo escribio el alumno; si hay varios, el que no tiene su fin.
    const sinFinEnElMayor = leidos.findIndex((e, i) => ocupan[i] === mayor && e.ceros === 0);
    const elMayor = escritos[sinFinEnElMayor >= 0 ? sinFinEnElMayor : ocupan.indexOf(mayor)].texto.trim();
    const columnas = valorDeDimension(deColumnas, modelo);
    if (columnas != null && columnas < mayor) {
      error(
        'ARREGLO_CHICO',
        `Cada texto de \`${n}\` puede tener ${caracteresDe(columnas)}, el más largo es \`${elMayor}\` y ocupa ${caracteresDe(mayor)}: no entra.`,
        v.fila
      );
    } else if (columnas === mayor && sinFinEnElMayor >= 0) {
      error(
        'CADENA_SIN_FIN',
        `En \`${n}\`, el texto más largo es \`${elMayor}\` y ocupa todo el tamaño declarado para cada texto: no queda espacio para el carácter \`'\\0'\` del final. C lo permite, pero ese texto queda sin terminar.`,
        v.fila
      );
    }
    const filas = deFilas ? valorDeDimension(deFilas, modelo) : escritos.length;
    if (filas != null && filas < textos.length) {
      error(
        'ARREGLO_CHICO',
        `\`${n}\` puede guardar ${filas} textos y la consigna pide ${textos.length}: no alcanza.`,
        v.fila
      );
    } else if (filas != null && filas > textos.length) {
      error(
        'ARREGLO_GRANDE',
        `\`${n}\` puede guardar ${filas} textos y la consigna pide ${textos.length}: sobra espacio.`,
        v.fila
      );
    }
    if (diagnosticos.length === antes && leidos.some((e) => e.ceros > 0) && practicas.includes('claridad')) {
      mejora('FIN_EN_EL_TEXTO', MEJORA_FIN_EN_EL_TEXTO, v.fila);
    }
    if (diagnosticos.length === antes && deFilas && practicas.includes('constantes')) {
      mejora(
        'FILAS_REPETIDAS',
        'La cantidad de textos ya la dice la lista: si deja vacíos los primeros corchetes, el compilador la cuenta solo, y no hay que acordarse de cambiarla el día de mañana si se agrega o se quita un texto.',
        v.fila
      );
    }
  }

  // ---- los caracteres de una cadena, de a uno ---------------------------------

  // Las asignaciones a los elementos de una cadena ("frase[0] = 'H';") contra
  // el texto que tienen que formar, con su fin. Devuelve los hallazgos, sin
  // decirlos: la consigna que lo usa decide que hacer con ellos.
  function verificarElementos(nombre, texto, asignaciones, modelo, en = []) {
    // Como se nombra el texto: nombres, nombres[1], datos[1][0].
    const etiqueta = nombre + en.map((n) => '[' + n + ']').join('');
    const esperados = [...texto].map((c) => c.codePointAt(0));
    esperados.push(0);
    const ultimo = esperados.length - 1;
    const hallazgos = [];
    const dice = (nivel, codigo, mensaje, fila) => hallazgos.push({ nivel, codigo, mensaje, fila });

    const porPosicion = new Map();
    for (const a of asignaciones) {
      const posicion = valorDeDimension(a.izquierda.indices[en.length], modelo);
      if (posicion == null) {
        dice('error', 'ELEMENTO_POSICION', `En \`${a.izquierda.texto}\` la posición tiene que ser un número.`, a.fila);
        continue;
      }
      if (!porPosicion.has(posicion)) porPosicion.set(posicion, []);
      porPosicion.get(posicion).push(a);
    }

    // Todo corrido unos lugares (se empezo en la posicion 1): un solo mensaje.
    if (hallazgos.length) return hallazgos;
    const asignados = [...porPosicion.entries()].map(([posicion, lista]) => [posicion, lista[lista.length - 1]]);
    for (const corrido of [1, 2, 3]) {
      if (
        asignados.length > 1 &&
        asignados.every(
          ([posicion, a]) => a.derecha.clase === 'caracter' && esperados[posicion - corrido] === a.derecha.valor
        )
      ) {
        dice(
          'error',
          'ELEMENTOS_CORRIDOS',
          `Los caracteres están corridos de posición: el primer carácter del texto va en la posición 0, porque las posiciones se numeran desde 0.`,
          asignados[0][1].fila
        );
        return hallazgos;
      }
    }

    // Con una posicion que no es un numero (un ciclo), lo demas no se puede juzgar.
    if (hallazgos.length) return hallazgos;

    for (const [posicion, lista] of [...porPosicion.entries()].sort((a, b) => a[0] - b[0])) {
      const a = lista[lista.length - 1];
      if (lista.some((x) => x.derecha.texto !== a.derecha.texto)) {
        dice(
          'error',
          'ELEMENTO_REPETIDO',
          `La posición ${posicion} de \`${etiqueta}\` se asigna más de una vez, con valores distintos: queda solo el último.`,
          a.fila
        );
      }
      if (posicion > ultimo) {
        dice(
          'error',
          'ELEMENTO_DE_MAS',
          `Sobra \`${a.izquierda.texto}\`: el texto y su fin ocupan las posiciones de 0 a ${ultimo}.`,
          a.fila
        );
        continue;
      }
      const esperado = esperados[posicion];
      const v = a.derecha;
      if (v.clase === 'caracter' && v.valor === esperado) continue;

      if (esperado === 0 && v.clase === 'numero' && v.valor === 0) {
        dice(
          'mejora',
          'FIN_CON_CERO',
          'Está bien, pero `\'\\0\'` dice con claridad que es el carácter de fin de la cadena, y `0` se lee como un número.',
          a.fila
        );
      } else if (v.clase === 'cadena') {
        // ya lo dice revisarAsignaciones
        continue;
      } else if (esperado === 0 && v.clase === 'caracter' && v.valor === 48) {
        dice(
          'error',
          'FIN_CON_DIGITO',
          `\`${v.texto}\` es el carácter del dígito cero; el que marca el final de la cadena es \`'\\0'\`.`,
          a.fila
        );
      } else if (esperado === 0 && v.clase === 'caracter' && v.valor === 32) {
        dice('error', 'FIN_CON_ESPACIO', 'Un espacio es un carácter más del texto: no marca el final de la cadena.', a.fila);
      } else if (esperado === 0) {
        dice(
          'error',
          'FIN_DISTINTO',
          `En la posición ${posicion} tiene que ir el carácter que marca el final de la cadena.`,
          a.fila
        );
      } else if (
        v.clase === 'caracter' &&
        v.valor != null &&
        String.fromCodePoint(v.valor).toLowerCase() === String.fromCodePoint(esperado).toLowerCase()
      ) {
        dice(
          'error',
          'ELEMENTO_MAYUSCULA',
          `\`${v.texto}\` no es el carácter del texto: en C las mayúsculas y las minúsculas son letras distintas.`,
          a.fila
        );
      } else if (v.clase === 'numero') {
        dice('error', 'ELEMENTO_NUMERO', `\`${v.texto}\` es un número: un carácter se escribe entre comillas simples.`, a.fila);
      } else {
        dice(
          'error',
          'ELEMENTO_DISTINTO',
          `En la posición ${posicion} no va \`${v.texto}\`: ese no es el carácter que corresponde del texto.`,
          a.fila
        );
      }
    }

    const faltan = esperados.map((_, i) => i).filter((i) => !porPosicion.has(i));
    for (const i of faltan.filter((x) => x !== ultimo)) {
      dice(
        'error',
        'ELEMENTO_FALTA',
        `Falta asignar la posición ${i} de \`${etiqueta}\`: las posiciones se numeran desde 0 y cada una necesita su carácter.`,
        null
      );
    }
    if (faltan.includes(ultimo)) {
      dice('error', 'CADENA_SIN_FIN', `Falta marcar dónde termina el texto: sin eso \`${etiqueta}\` no es una cadena.`, null);
    }
    return hallazgos;
  }

  function decir(hallazgos) {
    for (const h of hallazgos) {
      if (h.nivel === 'mejora' && !practicas.includes('claridad')) continue;
      diag(h.nivel, h.codigo, h.mensaje, h.fila);
    }
  }

  // Las asignaciones a una posicion de una cadena, por su nombre.
  // "en" son los indices de adelante, cuando el texto es un elemento de un
  // arreglo de cadenas (nombres[1][k]) o de una tabla (datos[1][0][k]).
  function alElementoDe(modelo, nombre, en = []) {
    return modelo.asignaciones.filter(
      (a) =>
        a.nuevo &&
        a.operador === '=' &&
        a.izquierda.clase === 'indice' &&
        a.izquierda.nombre === nombre &&
        a.izquierda.indices.length === en.length + 1 &&
        en.every((n, k) => valorDeDimension(a.izquierda.indices[k], modelo) === n)
    );
  }

  function reglaElementos(regla, modelo) {
    const nombre = valorDe(regla.de);
    const en = regla.en || [];
    const etiqueta = nombre + en.map((n) => '[' + n + ']').join('');
    const propias = alElementoDe(modelo, nombre, en);
    if (!propias.length) {
      if (diagnosticos.some((d) => CODIGOS_DE_ASIGNACION.includes(d.codigo))) return;
      const funcion = modelo.llamadas.find(
        (l) => l.nuevo && ['strcpy', 'strncpy', 'sprintf', 'memcpy'].includes(l.funcion)
      );
      // Los caracteres estan, pero en otra posicion (o en otra fila o columna).
      const otraPosicion = () => {
        const otras = modelo.asignaciones.filter(
          (a) =>
            a.nuevo &&
            a.operador === '=' &&
            a.izquierda.clase === 'indice' &&
            a.izquierda.nombre === nombre &&
            a.izquierda.indices.length === en.length + 1
        );
        if (!otras.length || !en.length) return false;
        const prefijos = otras.map((a) => a.izquierda.indices.slice(0, en.length).map((x) => valorDeDimension(x, modelo)));
        const hay = prefijos[0];
        if (hay.some((n) => n == null) || prefijos.some((p) => p.join() !== hay.join())) return false;
        const donde = nombre + hay.map((n) => '[' + n + ']').join('');
        const bien = !verificarElementos(nombre, regla.texto, otras, modelo, hay).some((h) => h.nivel === 'error');
        const difieren = hay.map((_, k) => k).filter((k) => hay[k] !== en[k]);
        const dimension = (k) => (en.length === 1 ? ['posición', 'posiciones'] : k === 0 ? ['fila', 'filas'] : ['columna', 'columnas']);
        let codigo;
        let que;
        if (en.length === 1) {
          codigo = 'ELEMENTOS_OTRA_POSICION';
          que = ', y la consigna pide otra posición del arreglo.';
        } else if (difieren.length === 2) {
          codigo = 'ELEMENTOS_FILA_Y_COLUMNA_DISTINTAS';
          que = ': ni la fila ni la columna son las que pide la consigna.';
        } else if (difieren[0] === 0) {
          codigo = 'ELEMENTOS_FILA_DISTINTA';
          que = ': la columna es la que pide la consigna, pero la fila no.';
        } else {
          codigo = 'ELEMENTOS_COLUMNA_DISTINTA';
          que = ': la fila es la que pide la consigna, pero la columna no.';
        }
        const corridas = difieren
          .filter((k) => hay[k] === en[k] + 1)
          .map((k) => {
            const [uno, varias] = dimension(k);
            return ` Las ${varias} se numeran desde 0: la ${uno} ${hay[k]} es la ${ordinalFemenino(hay[k])}.`;
          })
          .join('');
        error(
          codigo,
          (bien ? 'El texto está bien escrito, pero está asignado a ' : 'Los caracteres están asignados a ') +
            `\`${donde}\`` +
            que +
            corridas,
          otras[0].fila
        );
        return true;
      };
      if (funcion) {
        error(
          'ELEMENTOS_CON_FUNCION',
          `La consigna pide guardar los caracteres de a uno, no copiar el texto con \`${funcion.funcion}\`.`,
          funcion.fila
        );
      } else if (!otraPosicion()) {
        error(
          'ELEMENTOS_FALTAN',
          `No encontré asignaciones a las posiciones de \`${etiqueta}\`: cada carácter se guarda en la posición que le corresponde.`
        );
      }
      return;
    }
    if (diagnosticos.some((d) => ['INDICE_FUERA_DE_RANGO', 'ELEMENTO_ENTRE_COMILLAS_DOBLES'].includes(d.codigo))) return;
    decir(verificarElementos(nombre, regla.texto, propias, modelo, en));
  }

  // Dejar vacia una cadena que ya tiene texto: el fin en la primera posicion.
  function reglaVaciar(referencia, modelo) {
    const nombre = valorDe(referencia);
    const propias = alElementoDe(modelo, nombre);
    const esPrimera = (a) => valorDeDimension(a.izquierda.indices[0], modelo) === 0;
    const enCiclo = (a) => modelo.ciclos.some((c) => c.nuevo && a.posicion >= c.posicion && a.posicion <= c.fin);

    const alInicio = propias.find((a) => esPrimera(a) && esFinDeCadena(a.derecha));
    if (alInicio) {
      if (alInicio.derecha.clase === 'numero' && practicas.includes('claridad')) {
        mejora(
          'FIN_CON_CERO',
          'Está bien, pero `\'\\0\'` dice con claridad que es el carácter de fin de la cadena, y `0` se lee como un número.',
          alInicio.fila
        );
      }
      return;
    }
    const conCiclo = propias.find(
      (a) => esFinDeCadena(a.derecha) && valorDeDimension(a.izquierda.indices[0], modelo) == null && enCiclo(a)
    );
    if (conCiclo) {
      if (practicas.includes('claridad')) {
        mejora(
          'VACIAR_DE_MAS',
          'Está bien, pero para vaciar una cadena alcanza con poner el `\'\\0\'` en su primera posición: lo que hay después ya no se lee.',
          conCiclo.fila
        );
      }
      return;
    }
    const copia = modelo.llamadas.find(
      (l) =>
        l.nuevo &&
        l.funcion === 'strcpy' &&
        l.argumentos[0]?.clase === 'nombre' &&
        l.argumentos[0].nombre === nombre &&
        l.argumentos[1]?.clase === 'cadena' &&
        l.argumentos[1].contenido === ''
    );
    if (copia) {
      if (practicas.includes('claridad')) {
        mejora(
          'VACIAR_CON_FUNCION',
          'Está bien, pero para vaciar una cadena no hace falta copiar nada: alcanza con poner el `\'\\0\'` en su primera posición.',
          copia.fila
        );
      }
      return;
    }

    if (diagnosticos.some((d) => [...CODIGOS_DE_ASIGNACION, 'ELEMENTO_ENTRE_COMILLAS_DOBLES'].includes(d.codigo))) return;
    const otra = propias[0];
    if (!otra) {
      error('VACIAR_FALTA', `No encontré nada que deje vacía a \`${nombre}\`.`);
      return;
    }
    const v = otra.derecha;
    if (v.clase === 'caracter' && v.valor === 48) {
      error('FIN_CON_DIGITO', `\`${v.texto}\` es el carácter del dígito cero; el que marca el final de la cadena es \`'\\0'\`.`, otra.fila);
    } else if (v.clase === 'caracter' && v.valor === 32) {
      error('FIN_CON_ESPACIO', 'Un espacio es un carácter más del texto: no marca el final de la cadena.', otra.fila);
    } else if (esFinDeCadena(v)) {
      error(
        'VACIAR_OTRA_POSICION',
        'La cadena termina en el primer carácter `\'\\0\'` que aparece: para que no tenga ninguna letra, el `\'\\0\'` tiene que estar en la primera posición.',
        otra.fila
      );
    } else {
      error(
        'FIN_DISTINTO',
        `En la posición ${otra.izquierda.indices[0]} tiene que ir el carácter que marca el final de la cadena.`,
        otra.fila
      );
    }
  }

  // ---- ciclos -----------------------------------------------------------------

  // Un ciclo que recorre una cadena hasta su fin, o las filas de una tabla.
  // Sin ejecutarlo: se reconocen las condiciones de siempre, y una que no se
  // reconoce no es un error, solo no se puede comprobar.
  function reglaCiclo(regla, modelo) {
    const ciclos = modelo.ciclos.filter((c) => c.nuevo);
    if (!ciclos.length) {
      error('CICLO_FALTA', 'La consigna pide un ciclo: una sentencia que se repite, como `for` o `while`.');
      return;
    }
    const ciclo = ciclos[0];
    const escapar = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const I = escapar(regla.indice);
    const condicion = ciclo.condicion.replace(/\s+/g, '');
    const texto = ciclo.texto.replace(/\s+/g, '');
    const avanza = new RegExp(`\\b${I}\\+\\+|\\+\\+${I}\\b|\\b${I}\\+=1\\b|\\b${I}=${I}\\+1\\b`).test(texto);
    const sinAvance = () =>
      error('CICLO_SIN_AVANCE', `El índice \`${regla.indice}\` nunca avanza dentro del ciclo: así no termina.`, ciclo.fila);
    const noVerificado = () =>
      aviso(
        'CICLO_NO_VERIFICADO',
        'No pude comprobar esta condición. Verifique que el ciclo se repita hasta llegar al final y no más.',
        ciclo.fila
      );

    if (regla.hastaElFinDe) {
      const nombre = valorDe(regla.hastaElFinDe);
      const N = escapar(nombre);
      const elemento = `${N}\\[${I}\\]`;
      const cero = `(?:0|'\\\\0'|'\\\\x0+'|'\\\\0{1,3}')`;
      const patron = (p) => new RegExp(p).test(condicion);
      const bien = [
        `^${elemento}$`,
        `^${elemento}!=${cero}$`,
        `^${cero}!=${elemento}$`,
        `^${elemento}>0$`,
        `^${I}<strlen\\(${N}\\)$`,
        `^strlen\\(${N}\\)>${I}$`,
        `^${I}!=strlen\\(${N}\\)$`,
      ].some(patron);

      if (bien) {
        // Con do while el cuerpo corre antes de mirar la condicion: con una
        // cadena vacia, el indice avanzaria de mas. Con "Maria" anda: mejora.
        if (ciclo.tipo === 'do' && practicas.includes('claridad')) {
          mejora(
            'CICLO_DO_WHILE',
            'Está bien, pero con `do while` el ciclo avanza antes de mirar la condición: si la cadena estuviera vacía, `' +
              regla.indice +
              '` pasaría de largo el final.',
            ciclo.fila
          );
        }
      } else if (patron(`^${I}<=strlen\\(${N}\\)$`)) {
        error(
          'CICLO_UNO_DE_MAS',
          `Con \`<=\` el ciclo llega también al \`'\\0'\` del final: el índice pasa una vez más de las letras de \`${nombre}\`.`,
          ciclo.fila
        );
      } else if (patron(`^${I}<(?:\\d+|[A-Z_][A-Z_0-9]*|sizeof\\(${N}\\))$`)) {
        error(
          'CICLO_HASTA_EL_TAMANO',
          `El ciclo recorre todo el tamaño de \`${nombre}\` y no solo su texto: la cadena termina en el primer \`'\\0'\`, que puede estar antes.`,
          ciclo.fila
        );
      } else if (patron(`^${elemento}==${cero}$`)) {
        error(
          'CICLO_AL_REVES',
          'El ciclo tiene que repetirse mientras no se haya llegado al final, y esa condición se cumple justo al llegar.',
          ciclo.fila
        );
      } else if (patron('^' + I + '(?:!=|==)' + cero + '$|^' + cero + '(?:!=|==)' + I + '$')) {
        // el indice contra el fin: se confunde la posicion con lo que hay en ella
        error(
          'CICLO_INDICE_CONTRA_FIN',
          'La condición compara el índice `' +
            regla.indice +
            '` con `\'\\0\'`, pero el `\'\\0\'` es un carácter de la cadena, no una posición: hay que mirar el carácter que está en la posición `' +
            regla.indice +
            '`.',
          ciclo.fila
        );
      } else if (patron('^' + N + '(?:!=|==)' + cero + '$|^' + cero + '(?:!=|==)' + N + '$')) {
        error(
          'CICLO_CADENA_COMPLETA',
          'La condición compara la cadena completa con `\'\\0\'`: para mirar un carácter hay que indicar su posición.',
          ciclo.fila
        );
      } else if (patron('^' + elemento + '(?:!=|==)"')) {
        error(
          'CICLO_CARACTER_CON_TEXTO',
          'Un carácter se compara con un carácter entre comillas simples, no con un texto.',
          ciclo.fila
        );
      } else if (patron('^' + elemento + "(?:!=|==)(?:'[^']*'|\\d+)$")) {
        error(
          'CICLO_OTRO_CARACTER',
          'El ciclo se detiene al encontrar otro carácter, no al llegar al final de la cadena.',
          ciclo.fila
        );
      } else if (!new RegExp('\\b' + N + '\\b').test(condicion) && !/strlen/.test(condicion)) {
        // ni la cadena ni su largo: no hay forma de que mire el final
        error(
          'CICLO_NO_MIRA_LA_CADENA',
          'La condición no mira la cadena `' +
            nombre +
            '`: para saber si se llegó al final hay que mirar lo que hay en ella.',
          ciclo.fila
        );
      } else {
        noVerificado();
      }
      if (!avanza) sinAvance();
      return;
    }

    if (regla.filasDe && regla.columnas) {
      // Una tabla de cadenas: un ciclo por las filas y, adentro, uno por las columnas.
      const tabla = valorDe(regla.filasDe);
      const variable = modelo.variables.findLast((v) => v.nombre === tabla);
      const i = regla.indice;
      const j = regla.columnas.indice;
      const interno = ciclos.find((c) => c !== ciclo && c.posicion >= ciclo.posicion && c.fin <= ciclo.fin);
      if (!interno) {
        error(
          'CICLO_INTERNO_FALTA',
          `Hace falta otro ciclo adentro del primero: uno recorre las filas de \`${tabla}\` y el de adentro, las columnas de cada fila.`,
          ciclo.fila
        );
        return;
      }
      const limites = (c, indice, dimension, uno, varios) => {
        const cantidad = variable ? valorDeDimension(variable.arreglo[dimension] ?? '', modelo) : null;
        const hasta = new RegExp('^' + escapar(indice) + '(<=|<)(.+)$').exec(c.condicion.replace(/\s+/g, ''));
        const tope = hasta ? valorDeDimension(hasta[2], modelo) : null;
        if (cantidad != null && tope != null) {
          const ultima = hasta[1] === '<' ? tope - 1 : tope;
          if (ultima >= cantidad) {
            error(
              'CICLO_SE_PASA',
              `El ciclo de \`${indice}\` llega hasta la ${uno} ${ultima} y \`${tabla}\` tiene ${cantidad} ${varios}, numeradas de 0 a ${cantidad - 1}.`,
              c.fila
            );
          } else if (ultima < cantidad - 1) {
            error(
              'CICLO_NO_LLEGA',
              `El ciclo de \`${indice}\` llega hasta la ${uno} ${ultima}, pero \`${tabla}\` tiene ${cantidad} ${varios}: quedan ${varios} sin recorrer.`,
              c.fila
            );
          }
        } else {
          aviso(
            'CICLO_NO_VERIFICADO',
            'No pude comprobar esta condición. Verifique que el ciclo se repita hasta llegar al final y no más.',
            c.fila
          );
        }
        const J = escapar(indice);
        const cuerpo = c.texto.replace(/\s+/g, '');
        if (!new RegExp(`\\b${J}\\+\\+|\\+\\+${J}\\b|\\b${J}\\+=1\\b|\\b${J}=${J}\\+1\\b`).test(cuerpo)) {
          error('CICLO_SIN_AVANCE', `El índice \`${indice}\` nunca avanza dentro del ciclo: así no termina.`, c.fila);
        }
      };
      limites(ciclo, i, 0, 'fila', 'filas');
      limites(interno, j, 1, 'columna', 'columnas');

      const dentro = (x) => x.posicion >= interno.posicion && x.posicion <= interno.fin;
      const es = (texto, nombre) => texto.trim() === nombre;
      const vacia =
        modelo.asignaciones.some(
          (a) =>
            a.nuevo &&
            dentro(a) &&
            a.operador === '=' &&
            a.izquierda.clase === 'indice' &&
            a.izquierda.nombre === tabla &&
            a.izquierda.indices.length === 3 &&
            es(a.izquierda.indices[0], i) &&
            es(a.izquierda.indices[1], j) &&
            valorDeDimension(a.izquierda.indices[2], modelo) === 0 &&
            esFinDeCadena(a.derecha)
        ) ||
        modelo.llamadas.some(
          (l) =>
            l.nuevo &&
            dentro(l) &&
            l.funcion === 'strcpy' &&
            l.argumentos[0]?.clase === 'indice' &&
            l.argumentos[0].nombre === tabla &&
            l.argumentos[0].indices.length === 2 &&
            es(l.argumentos[0].indices[0], i) &&
            es(l.argumentos[0].indices[1], j) &&
            l.argumentos[1]?.clase === 'cadena' &&
            l.argumentos[1].contenido === ''
        );
      if (!vacia && !diagnosticos.some((d) => CODIGOS_DE_ASIGNACION.includes(d.codigo))) {
        error(
          'CICLO_NO_VACIA',
          `Lo que hace el ciclo no deja vacío cada texto de \`${tabla}\`: en cada vuelta hay que vaciar el texto de la fila \`${i}\` y la columna \`${j}\`.`,
          interno.fila
        );
      }
      return;
    }

    if (regla.filasDe) {
      const tabla = valorDe(regla.filasDe);
      const variable = modelo.variables.findLast((v) => v.nombre === tabla);
      const filas = variable ? valorDeDimension(variable.arreglo[0] ?? '', modelo) : null;
      const m = new RegExp(`^${I}(<=|<)(.+)$`).exec(condicion);
      const tope = m ? valorDeDimension(m[2], modelo) : null;
      if (filas != null && tope != null) {
        const ultimaFila = m[1] === '<' ? tope - 1 : tope;
        if (ultimaFila >= filas) {
          error(
            'CICLO_SE_PASA',
            `El ciclo llega hasta la posición ${ultimaFila} y \`${tabla}\` tiene ${filas} textos, numerados de 0 a ${filas - 1}.`,
            ciclo.fila
          );
        } else if (ultimaFila < filas - 1) {
          error(
            'CICLO_NO_LLEGA',
            `El ciclo llega hasta la posición ${ultimaFila}, pero \`${tabla}\` tiene ${filas} textos: quedan textos sin recorrer.`,
            ciclo.fila
          );
        }
      } else {
        noVerificado();
      }

      const dentro = (x) => x.posicion >= ciclo.posicion && x.posicion <= ciclo.fin;
      const indice = regla.indice;
      if (regla.lee) {
        const aqui = `${tabla}[${indice}]`;
        const propia = modelo.llamadas.find((l) => {
          const d = l.nuevo && dentro(l) && LECTURAS.includes(l.funcion) ? destinoDeLectura(l) : null;
          return d && d.clase === 'indice' && d.nombre === tabla && d.indices.length === 1 && d.indices[0].trim() === indice;
        });
        if (!propia) {
          error(
            'CICLO_NO_LEE',
            `Lo que hace el ciclo no lee el texto de la posición \`${indice}\` de \`${tabla}\`: en cada vuelta hay que leer en la posición que corresponde al índice.`,
            ciclo.fila
          );
        } else {
          verificarLectura(propia, aqui, regla.lee, modelo);
        }
        if (!avanza) sinAvance();
        return;
      }
      const vacia =
        modelo.asignaciones.some(
          (a) =>
            a.nuevo &&
            dentro(a) &&
            a.operador === '=' &&
            a.izquierda.clase === 'indice' &&
            a.izquierda.nombre === tabla &&
            a.izquierda.indices.length === 2 &&
            a.izquierda.indices[0].trim() === indice &&
            valorDeDimension(a.izquierda.indices[1], modelo) === 0 &&
            esFinDeCadena(a.derecha)
        ) ||
        modelo.llamadas.some(
          (l) =>
            l.nuevo &&
            dentro(l) &&
            l.funcion === 'strcpy' &&
            l.argumentos[0]?.clase === 'indice' &&
            l.argumentos[0].nombre === tabla &&
            l.argumentos[0].indices.length === 1 &&
            l.argumentos[0].indices[0].trim() === indice &&
            l.argumentos[1]?.clase === 'cadena' &&
            l.argumentos[1].contenido === ''
        );
      if (!vacia && !diagnosticos.some((d) => CODIGOS_DE_ASIGNACION.includes(d.codigo))) {
        error(
          'CICLO_NO_VACIA',
          `Lo que hace el ciclo no deja vacía cada cadena de \`${tabla}\`: en cada vuelta hay que vaciar la cadena que corresponde al índice.`,
          ciclo.fila
        );
      }
      if (!avanza) sinAvance();
      return;
    }

    throw new Error(`La consigna "${consigna.id}" tiene una regla de ciclo que no conozco.`);
  }

  // ---- incluir una biblioteca -------------------------------------------------

  // "#include <string.h>": el archivo de cabecera de la biblioteca. Los mensajes
  // dicen que hace falta, no como se escribe.
  function reglaIncluye(esperado, modelo) {
    const propios = modelo.includes.filter((i) => i.nuevo);
    const bien = propios.find((i) => i.ruta === esperado);
    if (bien) {
      // Una directiva no es una sentencia: no termina con ";". Compila, porque
      // dentro de una funcion queda una sentencia vacia, y por eso es una mejora.
      if (/#[ \t]*include[^\n]*;/.test(respuesta) && practicas.includes('claridad')) {
        mejora(
          'INCLUDE_CON_PUNTO_Y_COMA',
          'Está bien, pero una directiva del preprocesador no termina con `;`.',
          bien.fila
        );
      }
      if (!bien.sistema && practicas.includes('claridad')) {
        mejora(
          'INCLUDE_ENTRE_COMILLAS',
          'Está bien, pero el nombre de una biblioteca del sistema va entre `<` y `>`, y no entre comillas: las comillas son para archivos propios.',
          bien.fila
        );
      }
      return;
    }
    const otro = propios[0];
    if (otro) {
      error(
        otro.ruta.replace(/\.h$/, '') === esperado.replace(/\.h$/, '')
          ? 'INCLUDE_SIN_EXTENSION'
          : 'INCLUDE_OTRA_BIBLIOTECA',
        otro.ruta.replace(/\.h$/, '') === esperado.replace(/\.h$/, '')
          ? `\`${otro.ruta}\` no es un archivo de cabecera de C: los de C terminan en \`.h\`.`
          : `\`${otro.ruta}\` no es la biblioteca de cadenas.`,
        otro.fila
      );
      return;
    }
    if (modelo.constantes.some((c) => c.nuevo && c.clase === 'define')) {
      error('INCLUDE_ES_DEFINE', 'Eso define una constante: no agrega una biblioteca.');
      return;
    }
    error(
      'INCLUDE_FALTA',
      'No encontré la directiva que agrega una biblioteca. Para usar las funciones de una biblioteca hay que agregar su archivo de cabecera, con una directiva del preprocesador. Las directivas del preprocesador comienzan con `#`.'
    );
  }

  // ---- un tipo definido con typedef -------------------------------------------

  // Una variable declarada con el alias que el alumno definio antes.
  function reglaUsaAlias(regla, modelo) {
    const alias = valorDe(regla.alias);
    const variables = modelo.variables.filter((v) => v.nuevo);
    if (!variables.length) {
      error(
        'VARIABLE_FALTA',
        'No encontré la declaración de una variable. Una variable se declara con el tipo y después el nombre: `tipo nombre;`'
      );
      return;
    }
    const delAlias = variables.filter((v) => v.deAlias === alias);
    if (!delAlias.length) {
      if (diagnosticos.some((d) => d.codigo === 'TIPO_DESCONOCIDO')) return;
      const v = variables[0];
      error(
        'VARIABLE_SIN_ALIAS',
        `\`${v.nombre}\` no está declarada con el tipo \`${alias}\` que se definió antes: la consigna pide usarlo.`,
        v.fila
      );
      return;
    }
    const v = delAlias[0];
    if (regla.nombre && v.nombre !== regla.nombre) {
      error(
        'VARIABLE_NOMBRE',
        `La consigna pide que la variable se llame \`${regla.nombre}\`. La que está declarada se llama \`${v.nombre}\`.`,
        v.fila
      );
      return;
    }
    if (regla.capturar) nuevas[regla.capturar] = v.nombre;
    const propias = v.arreglo.length - (v.dimsDeAlias || 0);
    if (!regla.arreglo) {
      if (propias > 0) {
        error(
          'VARIABLE_ARREGLO',
          `\`${v.nombre}\` es un arreglo de ese tipo. La consigna pide una sola variable: sobran los corchetes.`,
          v.fila
        );
      }
      return;
    }
    if (propias === 0) {
      error(
        'VARIABLE_NO_ES_ARREGLO',
        `\`${v.nombre}\` es una sola variable de ese tipo. La consigna pide varias: falta indicar cuántas.`,
        v.fila
      );
      return;
    }
    // Un tamano pide un arreglo de ese tipo; dos, una tabla (filas y columnas).
    const exacto = regla.arreglo.tamano != null;
    const pedidos = [].concat(exacto ? regla.arreglo.tamano : regla.arreglo.alMenos);
    if (propias < pedidos.length) {
      error(
        'TABLA_UNA_DIMENSION',
        `\`${v.nombre}\` es un arreglo de ese tipo, con una sola dimensión propia. La consigna pide una tabla, con filas y columnas.`,
        v.fila
      );
      return;
    }
    if (propias > pedidos.length) {
      error(
        pedidos.length === 2 ? 'TABLA_DIMENSIONES' : 'ARREGLO_DIMENSIONES',
        pedidos.length === 2
          ? `\`${v.nombre}\` tiene ${propias} dimensiones propias. La consigna pide una tabla, con dos: las filas y las columnas.`
          : `\`${v.nombre}\` tiene ${propias} dimensiones propias. La consigna pide un arreglo de ese tipo, con una sola.`,
        v.fila
      );
      return;
    }
    const tienen = pedidos.map((_, k) => valorDeDimension(v.arreglo[k] ?? '', modelo));
    if (pedidos.length === 2 && pedidos[0] !== pedidos[1] && tienen[0] === pedidos[1] && tienen[1] === pedidos[0]) {
      error(
        'DIMENSIONES_AL_REVES',
        `Las dimensiones de \`${v.nombre}\` están al revés: entre los primeros corchetes va la cantidad de filas y entre los segundos la de columnas.`,
        v.fila
      );
      return;
    }
    for (const [k, pedido] of pedidos.entries()) {
      const tiene = tienen[k];
      const unidad = pedidos.length === 2 ? (k === 0 ? 'filas' : 'columnas') : 'textos';
      if (tiene != null && tiene < pedido) {
        error(
          'ARREGLO_CHICO',
          `\`${v.nombre}\` puede guardar ${tiene} ${unidad} y hay que guardar ${pedido}: no alcanza.`,
          v.fila
        );
      } else if (tiene != null && exacto && tiene > pedido) {
        error(
          'ARREGLO_GRANDE',
          `\`${v.nombre}\` puede guardar ${tiene} ${unidad} y la consigna pide ${pedido}: sobra espacio.`,
          v.fila
        );
      }
    }
  }

  // Un alias de un arreglo de caracteres: un tipo para guardar un texto.
  function reglaAliasDeCadena(regla, modelo) {
    const candidatos = modelo.aliases.filter((a) => a.nuevo);
    if (!candidatos.length && /\btypedef\s+\w+\s+(?:char|int|float|double|long|short|unsigned)\s*\[/.test(respuesta)) {
      error(
        'TYPEDEF_AL_REVES',
        'En un `typedef` va primero el tipo que ya existe y después el nombre nuevo, y los corchetes van después del nombre.'
      );
      return;
    }
    if (!candidatos.length) {
      error(
        'ALIAS_FALTA',
        (modelo.variables.some((v) => v.nuevo)
          ? 'Eso declara una variable, no un alias. '
          : 'No encontré la definición de un alias. ') +
          'Un alias es un nombre nuevo para un tipo que ya existe.'
      );
      return;
    }
    const a = candidatos[0];
    if (regla.capturar) nuevas[regla.capturar] = a.nombre;
    const real = resolver(a.tipo, modelo);
    if (a.punteros) {
      error('ALIAS_PUNTERO', `A \`${a.nombre}\` le sobra el \`*\`: el alias tiene que ser de un arreglo de caracteres.`, a.fila);
    } else if (real.clase !== 'primitivo' || real.nombre !== 'char') {
      error(
        'ALIAS_TIPO',
        `\`${a.nombre}\` es un alias de ${enPalabras(a)}. Para guardar un texto tiene que ser un alias de un arreglo de caracteres.`,
        a.fila
      );
    } else if (!a.arreglo.length) {
      error(
        'ALIAS_NO_ES_CADENA',
        `\`${a.nombre}\` es un alias de un solo carácter. Para guardar un texto tiene que ser un alias de un arreglo de caracteres, con su dimensión.`,
        a.fila
      );
    } else {
      verificarAlMenos(a, regla.arreglo, modelo);
    }
  }

  // ---- alias ----------------------------------------------------------------

  function reglaAlias(regla, modelo) {
    if (regla.arreglo) return reglaAliasDeCadena(regla, modelo);
    const pedido = valorDe(regla.de);
    const objetivo = resolver(tipoDesdeTexto(pedido), modelo);
    const candidatos = modelo.aliases.filter((a) => a.nuevo);

    if (!candidatos.length) {
      const esVariable = modelo.variables.some((v) => v.nuevo);
      error(
        'ALIAS_FALTA',
        (esVariable
          ? 'Eso declara una variable, no un alias. '
          : 'No encontré la definición de un alias. ') +
          'Un alias es un nombre nuevo para un tipo que ya existe.'
      );
      return;
    }

    const delTipo = candidatos.filter((a) => mismoTipo(resolver(a.tipo, modelo), objetivo));
    const exacto = delTipo.find((a) => !a.punteros && !a.arreglo.length);
    if (exacto) {
      if (regla.capturar) nuevas[regla.capturar] = exacto.nombre;
      return;
    }

    const a = delTipo[0] || candidatos[0];
    if (delTipo.length && a.punteros) {
      error(
        'ALIAS_PUNTERO',
        `A \`${a.nombre}\` le sobra el \`*\`: así no queda como alias de la estructura.`,
        a.fila
      );
    } else if (delTipo.length) {
      error(
        'ALIAS_ARREGLO',
        `\`${a.nombre}\` queda como alias de un arreglo de estructuras: sobran los corchetes.`,
        a.fila
      );
    } else if (resolver(a.tipo, modelo).clase !== 'desconocido') {
      error(
        'ALIAS_TIPO',
        `\`${a.nombre}\` es un alias de ${enPalabras(a)}. Tiene que ser un alias ${nombrarPedido(pedido)}.`,
        a.fila
      );
    }
  }
}

// Lo que vale para cualquier consigna: tipos que no existen y cosas que se
// vuelven a declarar.
function revisarNombres(modelo, error) {
  const usos = [
    ...modelo.variables.filter((v) => v.nuevo),
    ...modelo.aliases.filter((a) => a.nuevo),
    ...modelo.structs.filter((s) => s.nuevo).flatMap((s) => s.campos),
  ];
  const avisados = new Set();

  for (const uso of usos) {
    const real = resolver(uso.tipo, modelo);
    if (real.clase !== 'desconocido' || avisados.has(real.que + real.nombre)) continue;
    avisados.add(real.que + real.nombre);
    const nombre = real.nombre;
    const enMinuscula = nombre.toLowerCase();

    if (real.que === 'etiqueta') {
      let mensaje = `No hay ninguna estructura llamada \`${nombre}\`.`;
      const parecida = modelo.structs.find((s) => s.etiqueta && s.etiqueta.toLowerCase() === enMinuscula);
      if (parecida) {
        mensaje += ` La que está declarada es \`${parecida.etiqueta}\`: en C las mayúsculas y las minúsculas son letras distintas.`;
      } else if (modelo.aliases.some((a) => a.nombre === nombre)) {
        mensaje += ` \`${nombre}\` es un alias: se usa solo, sin la palabra \`struct\`.`;
      }
      error('TIPO_DESCONOCIDO', mensaje, uso.fila);
      continue;
    }

    let mensaje = `\`${nombre}\` no es un tipo que exista.`;
    const alias = modelo.aliases.find((a) => a.nombre.toLowerCase() === enMinuscula);
    const parecido = TIPOS_BASICOS.find((t) => t.length > 3 && distancia(t, enMinuscula) === 1);
    if (TIPOS_BASICOS.includes(enMinuscula)) {
      mensaje += ` Las palabras de C van todas en minúscula: \`${enMinuscula}\`.`;
    } else if (modelo.structs.some((s) => s.etiqueta === nombre)) {
      mensaje = `\`${nombre}\` es el nombre de una estructura, pero así solo no es un tipo: falta indicar que se trata de una estructura.`;
    } else if (alias) {
      mensaje += ` El alias está definido como \`${alias.nombre}\`: en C las mayúsculas y las minúsculas son letras distintas.`;
    } else if (enMinuscula === 'string') {
      mensaje += ' En C no hay un tipo para los textos: se guardan en un arreglo de caracteres.';
    } else if (enMinuscula === 'boolean' || enMinuscula === 'integer' || enMinuscula === 'real') {
      mensaje += ' Ese nombre es de otro lenguaje: en C los tipos básicos se llaman distinto.';
    } else if (parecido) {
      mensaje += ` ¿Quiso escribir \`${parecido}\`?`;
    }
    error('TIPO_DESCONOCIDO', mensaje, uso.fila);
  }

  for (const s of modelo.structs.filter((x) => x.nuevo && x.etiqueta)) {
    if (modelo.structs.some((otro) => otro !== s && otro.id < s.id && otro.etiqueta === s.etiqueta)) {
      error(
        'STRUCT_REDEFINIDA',
        `La estructura \`${s.etiqueta}\` ya está declarada: no hay que escribirla de nuevo, solo lo que pide esta consigna.`,
        s.fila
      );
    }
  }

  const aliasVistos = new Set();
  for (const a of modelo.aliases) {
    if (a.nuevo && aliasVistos.has(a.nombre)) {
      error('ALIAS_REDEFINIDO', `Ya hay un alias llamado \`${a.nombre}\`: hay que elegir otro nombre.`, a.fila);
    }
    aliasVistos.add(a.nombre);
  }
}

// Cuanto vale una dimension: 20 si dice "20", o si dice "MAX" y hay un
// "#define MAX 20", o una cuenta sencilla con eso ("MAX + 1", "10 + 1").
// null si no se puede saber.
function valorDeDimension(texto, modelo, vistos = new Set()) {
  const escrito = texto.trim();
  if (!escrito) return null;
  const partes = escrito.match(/[A-Za-z_]\w*|\d+|[()+\-*/]/g);
  if (!partes || partes.join('') !== escrito.replace(/\s+/g, '')) return null;

  let i = 0;
  const falla = () => {
    throw new Error('no se puede calcular');
  };
  function primario() {
    const t = partes[i++];
    if (t === undefined) falla();
    if (t === '(') {
      const v = suma();
      if (partes[i++] !== ')') falla();
      return v;
    }
    if (/^\d+$/.test(t)) return Number(t);
    if (/^[A-Za-z_]\w*$/.test(t)) {
      const constante = modelo.constantes.find((c) => c.nombre === t);
      if (!constante || vistos.has(t)) falla();
      const v = valorDeDimension(constante.valor, modelo, new Set([...vistos, t]));
      if (v == null) falla();
      return v;
    }
    return falla();
  }
  function producto() {
    let v = primario();
    while (partes[i] === '*' || partes[i] === '/') {
      const op = partes[i++];
      const w = primario();
      if (op === '/' && w === 0) falla();
      v = op === '*' ? v * w : Math.trunc(v / w);
    }
    return v;
  }
  function suma() {
    let v = producto();
    while (partes[i] === '+' || partes[i] === '-') {
      v = partes[i++] === '+' ? v + producto() : v - producto();
    }
    return v;
  }
  try {
    const v = suma();
    return i === partes.length ? v : null;
  } catch {
    return null;
  }
}

// Un nombre que ya existe mas arriba (en el codigo que la consigna recibe o en
// la misma respuesta) no se puede volver a declarar: no compilaria. Si la
// consigna no continua el codigo anterior, no hay nada con que chocar.
//
// Variables: error. Constantes: con otro valor es un error (el programa diria
// dos cosas); con el mismo valor compila, asi que no es un error sino una
// mejora, y solo donde se pide la practica de las constantes.
function revisarRedefiniciones(modelo, error, mejora) {
  for (const v of modelo.variables.filter((x) => x.nuevo)) {
    const antes = modelo.variables.find(
      (w) => w !== v && w.nombre === v.nombre && w.local === v.local && w.indice < v.indice
    );
    if (!antes) continue;
    error(
      'VARIABLE_REDEFINIDA',
      antes.nuevo
        ? `La variable \`${v.nombre}\` ya está declarada más arriba en esta misma respuesta: hay que elegir otro nombre.`
        : `Ya hay una variable llamada \`${v.nombre}\` en el código de arriba: hay que elegir otro nombre.`,
      v.fila
    );
  }

  const sinAdornos = (valor) => valor.replace(/[\s()]/g, '');
  const defines = modelo.constantes.filter((c) => c.clase === 'define');
  for (const c of defines.filter((x) => x.nuevo)) {
    const antes = defines.find((w) => w !== c && w.nombre === c.nombre && w.indice < c.indice);
    if (!antes) continue;
    const donde = antes.nuevo ? 'más arriba en esta misma respuesta' : 'en el código de arriba';
    if (sinAdornos(antes.valor) !== sinAdornos(c.valor)) {
      error(
        'CONSTANTE_REDEFINIDA',
        `\`${c.nombre}\` ya está definida ${donde}, con otro valor (\`${antes.valor}\`): una constante no puede valer dos cosas.`,
        c.fila
      );
    } else if (mejora) {
      mejora(
        'CONSTANTE_REPETIDA',
        `\`${c.nombre}\` ya está definida ${donde}: no hace falta volver a definirla.`,
        c.fila
      );
    }
  }
}

// Si un numero de los corchetes ya se ve en la lista de valores que lo
// acompana (la dimension "d" de "declarado"):
//   arreglo: la lista tiene al menos tantos elementos.
//   tabla con las filas entre llaves: la cantidad de filas, o alguna fila con
//     tantos valores como columnas.
//   tabla con los valores seguidos: la lista llena la tabla, o por lo menos una
//     fila (las llaves por fila ya tienen su propia mejora).
function seDeduceDeLaLista(lista, declarado, d, numero, modelo) {
  const cuantos = lista.elementos.length;
  if (declarado.arreglo.length === 1) return cuantos >= numero;
  if (declarado.arreglo.length > 2) return true; // no se opina sobre mas dimensiones

  // Una tabla de textos: la cantidad de filas la dicen los textos; el ancho no
  // esta en ningun lado (es el del mas largo, mas el lugar del fin).
  if (lista.elementos.length && lista.elementos.every((e) => e.clase === 'cadena')) {
    return d === 0 ? cuantos >= numero : false;
  }

  if (lista.elementos.some((e) => e.clase === 'lista')) {
    return d === 0
      ? cuantos >= numero
      : lista.elementos.some((fila) => fila.clase === 'lista' && fila.elementos.length >= numero);
  }
  const columnas = valorDeDimension(declarado.arreglo[1], modelo);
  if (columnas == null) return true;
  const filas = declarado.arreglo[0].trim() ? valorDeDimension(declarado.arreglo[0], modelo) : null;
  return cuantos >= (filas != null ? filas * columnas : columnas);
}

// Las dimensiones de los arreglos nuevos.
//
// Para cualquier consigna: un nombre como dimension tiene que estar definido,
// y antes. "int lista[MAX];" sin un #define en la respuesta ni en el codigo
// hasta aca es un error, como lo seria al compilar.
//
// Y si la serie pide la practica "constantes" (llega "mejora"): un numero
// suelto vale, pero lo ideal es una constante con nombre. La respuesta queda
// correcta y no excelente.
function revisarDimensiones(modelo, error, mejora) {
  const arreglos = [
    ...modelo.variables.filter((v) => v.nuevo),
    ...modelo.aliases.filter((a) => a.nuevo),
    ...modelo.structs.filter((s) => s.nuevo).flatMap((s) => s.campos),
  ].filter((d) => d.arreglo.length);
  const dichos = new Set();
  const unaVez = (clave) => !dichos.has(clave) && dichos.add(clave);

  for (const declarado of arreglos) {
    // Solo las dimensiones que escribio el alumno en esta sentencia: las que
    // vienen de un alias ya se revisaron donde se lo definio. De una cuenta
    // ("LARGO + 1") se miran las partes: cada nombre tiene que estar definido
    // y cada numero, salvo el 1, es un numero suelto.
    const propias = declarado.arreglo.slice(0, declarado.arreglo.length - (declarado.dimsDeAlias || 0));
    const partes = propias.flatMap((dimension, d) => {
      const texto = dimension.trim();
      if (/^\d+$/.test(texto) || /^[A-Za-z_]\w*$/.test(texto)) return [[d, texto]];
      return (texto.match(/[A-Za-z_]\w*|\d+/g) || []).filter((t) => t !== '1').map((t) => [d, t]);
    });
    for (const [d, escrito] of partes) {
      if (/^\d+$/.test(escrito)) {
        // Un numero es magico cuando lleva informacion que no esta escrita en
        // otro lugar de la misma sentencia. Con la lista de valores al lado,
        // si se deduce de ella (es la cantidad de valores) no lo es: lo que
        // sobra es repetirlo, y eso lo mira la regla. Si la lista nombra
        // menos elementos que los corchetes ({0} con [4]), el numero es lo
        // unico que dice cuantos son.
        const lista = declarado.inicial?.clase === 'lista' ? declarado.inicial : null;
        if (lista && seDeduceDeLaLista(lista, declarado, d, Number(escrito), modelo)) continue;
        // Una vez por numero distinto y por linea: {0} con [3][4] los tiene a los dos.
        if (!mejora || !unaVez('numero' + declarado.fila + ':' + escrito)) continue;
        // Si ya hay una constante con ese valor, lo que falta no es saber que
        // es un #define sino usar el que esta. Que valga lo mismo no asegura
        // que sea la misma cantidad: eso lo decide el alumno.
        const yaDefinidas = modelo.constantes.filter(
          (c) =>
            c.clase === 'define' &&
            c.indice < declarado.indice &&
            valorDeDimension(c.nombre, modelo) === Number(escrito)
        );
        if (yaDefinidas.length) {
          const nombres = yaDefinidas.map((c) => `\`${c.nombre}\``).join(' y ');
          mejora(
            'CONSTANTE_SIN_REUTILIZAR',
            (yaDefinidas.length === 1
              ? `Ya hay una constante que vale \`${escrito}\`: ${nombres}. Si representa esta misma cantidad, conviene usarla en lugar del número.`
              : `Ya hay constantes que valen \`${escrito}\`: ${nombres}. Si alguna representa esta misma cantidad, conviene usarla en lugar del número.`) +
              ' Si es otra cosa que vale lo mismo, conviene darle su propio nombre.',
            declarado.fila
          );
        } else {
          mejora(
            'NUMERO_MAGICO',
            `\`${escrito}\` es un número suelto: no dice qué representa, y si el día de mañana el tamaño cambia hay que buscarlo por todo el programa. Lo ideal es darle un nombre con \`#define\` y usar ese nombre.`,
            declarado.fila
          );
        }
        continue;
      }
      if (!/^[A-Za-z_]\w*$/.test(escrito)) continue;

      const constante = modelo.constantes.find((c) => c.nombre === escrito);
      const variable = modelo.variables.find((v) => v.nombre === escrito);
      if (constante) {
        if (constante.indice > declarado.indice && unaVez('despues' + escrito)) {
          error(
            'CONSTANTE_DEFINIDA_DESPUES',
            `\`${escrito}\` está definida más abajo: tiene que estar antes de la línea que la usa.`,
            declarado.fila
          );
        }
      } else if (variable) {
        if (mejora && unaVez('variable' + escrito)) {
          mejora(
            'DIMENSION_CON_VARIABLE',
            `\`${escrito}\` es una variable${variable.esConst ? ', aunque sea `const`' : ''}, no una constante. Para la dimensión de un arreglo lo ideal es una constante definida con \`#define\`.`,
            declarado.fila
          );
        }
      } else if (unaVez('falta' + escrito)) {
        error(
          'CONSTANTE_SIN_DEFINIR',
          `\`${escrito}\` no está definida: una constante hay que definirla antes de usarla.`,
          declarado.fila
        );
      }
    }
  }

  if (!mejora) return;
  for (const c of modelo.constantes) {
    if (c.nuevo && c.clase === 'define' && c.nombre !== c.nombre.toUpperCase()) {
      mejora(
        'CONSTANTE_EN_MINUSCULA',
        `Por convención, las constantes se escriben en mayúscula, para distinguirlas de las variables: \`${c.nombre.toUpperCase()}\`.`,
        c.fila
      );
    }
  }
}

// Los codigos con que se dice que una cadena (o un arreglo de cadenas) completa
// no se asigna con "=": las consignas que ya lo dijeron no suman otros errores.
const CODIGOS_DE_ASIGNACION = ['ASIGNACION_DE_ARREGLO', 'ASIGNACION_CARACTER_A_CADENA', 'ELEMENTOS_COMO_UNA_SOLA_CADENA'];

// Un arreglo no se asigna entero con "=": vale para cualquier consigna, porque
// en C nunca es valido. Con una cadena, es el error de quien todavia no sabe
// que para copiarla hay una funcion; con un caracter, el de quien confunde la
// cadena con una de sus letras. Lo mismo repetido en varias lineas se dice una vez.
function revisarAsignaciones(modelo, error, aconsejarFuncion = true) {
  const esChar = (v) => v.tipo.clase === 'primitivo' && v.tipo.nombre === 'char';
  // Una letra con un solo indice en un arreglo de cadenas: nombres[0] = 'L';
  const variableDeLetraSuelta = (a) => {
    if (!a.nuevo || a.operador !== '=' || a.izquierda.clase !== 'indice') return null;
    if (a.izquierda.indices.length !== 1 || a.derecha.clase !== 'caracter') return null;
    const v = modelo.variables.findLast((x) => x.nombre === a.izquierda.nombre);
    return v && !v.punteros && esChar(v) && v.arreglo.length >= 2 ? v : null;
  };
  // Si las posiciones son 0, 1, 2...: escribio el texto como si fuera una sola cadena.
  const posiciones = new Map();
  for (const a of modelo.asignaciones) {
    const v = variableDeLetraSuelta(a);
    const indice = v ? a.izquierda.indices[0].trim() : '';
    if (!v || !/^\d+$/.test(indice)) continue;
    if (!posiciones.has(v.nombre)) posiciones.set(v.nombre, new Set());
    posiciones.get(v.nombre).add(Number(indice));
  }
  const comoUnaSola = (nombre) => {
    const p = [...(posiciones.get(nombre) || [])].sort((x, y) => x - y);
    return p.length >= 2 && p.every((n, i) => n === i);
  };

  const repetidas = new Map();
  for (const a of modelo.asignaciones) {
    if (!a.nuevo || a.operador !== '=') continue;
    const izquierda = a.izquierda;
    if (izquierda.clase !== 'nombre' && izquierda.clase !== 'indice') continue;
    const variable = modelo.variables.findLast((v) => v.nombre === izquierda.nombre);
    if (!variable || variable.punteros) continue;
    const esCadena = esChar(variable);

    if (izquierda.clase === 'nombre') {
      if (!variable.arreglo.length) continue;
      error(
        'ASIGNACION_DE_ARREGLO',
        `\`${variable.nombre}\` es un arreglo: no se puede asignar completo con \`=\`.` +
          (esCadena && aconsejarFuncion
            ? ' Para copiar una cadena en otra se usa una función de la biblioteca de cadenas.'
            : ''),
        a.fila
      );
    } else if (esCadena && a.derecha.clase === 'cadena' && izquierda.indices.length === variable.arreglo.length) {
      error(
        'ELEMENTO_ENTRE_COMILLAS_DOBLES',
        `\`${a.derecha.texto}\` entre comillas dobles es un texto, no un carácter: un carácter va entre comillas simples.`,
        a.fila
      );
    } else if (variable.arreglo.length > izquierda.indices.length) {
      // Una fila de una tabla: con t[0] queda una cadena (o un arreglo).
      const quedan = variable.arreglo.length - izquierda.indices.length;
      let codigo = 'ASIGNACION_DE_ARREGLO';
      let mensaje;
      if (esCadena && a.derecha.clase === 'caracter') {
        const esFin = a.derecha.valor === 0;
        if (variableDeLetraSuelta(a) && comoUnaSola(variable.nombre)) {
          codigo = 'ELEMENTOS_COMO_UNA_SOLA_CADENA';
          mensaje =
            quedan === 1
              ? `\`${variable.nombre}\` guarda varias cadenas, y \`${izquierda.texto}\` es una cadena completa: no se le puede asignar un carácter. Para escribir el texto letra por letra hay que indicar dos índices: primero cuál cadena y después la posición de la letra dentro de ella.`
              : `\`${izquierda.texto}\` es un arreglo de cadenas: no se le puede asignar un carácter. Para escribir un texto letra por letra hay que indicar tres índices: la fila, la columna y la posición de la letra dentro del texto.`;
        } else {
          codigo = 'ASIGNACION_CARACTER_A_CADENA';
          mensaje =
            quedan === 1
              ? `\`${izquierda.texto}\` es una cadena completa: no se le puede asignar un carácter. El carácter va en una posición de esa cadena.` +
                (esFin ? ` Para dejarla vacía, el \`'\\0'\` va en su primera posición.` : '')
              : `\`${izquierda.texto}\` es un arreglo de cadenas: no se le puede asignar un carácter. El carácter va en una posición de una de sus cadenas.`;
        }
      } else {
        mensaje =
          `\`${izquierda.texto}\` es ${esCadena ? (quedan === 1 ? 'una cadena' : 'un arreglo de cadenas') : 'una fila de la tabla'}: no se puede asignar completa con \`=\`.` +
          (esCadena && quedan === 1 && aconsejarFuncion
            ? ' Para copiar un texto en una cadena se usa una función de la biblioteca de cadenas.'
            : '');
      }
      const clave = codigo + ':' + variable.nombre + ':' + quedan;
      if (repetidas.has(clave)) repetidas.get(clave).veces++;
      else repetidas.set(clave, { codigo, mensaje, fila: a.fila, veces: 1 });
    }
  }
  for (const r of repetidas.values()) {
    const otras = r.veces - 1;
    const suma =
      otras > 0 && r.codigo !== 'ELEMENTOS_COMO_UNA_SOLA_CADENA'
        ? ' Lo mismo ocurre en ' + (otras === 1 ? 'la otra asignación.' : 'las otras ' + otras + ' asignaciones.')
        : '';
    error(r.codigo, r.mensaje + suma, r.fila);
  }
}

// Una posicion que no es la que pide la consigna, dicha con precision: cual de
// los indices no lo es, y si es el que sigue (se conto desde 1). Los indices
// pueden ser cuentas sencillas (1 + 1) o constantes; una variable no se sabe.
function distintaPosicion(real, esperado, modelo) {
  const general = ['ARGUMENTO_OTRA_FILA', `\`${real.texto}\` no es la posición que pide la consigna.`];
  const pedidos = [...esperado.matchAll(/\[([^\]]*)\]/g)].map((m) => valorDeDimension(m[1], modelo));
  const escritos = real.indices.map((x) => x.trim());
  if (escritos.length !== pedidos.length || escritos.length > 2 || pedidos.some((n) => n == null)) return general;
  const valores = escritos.map((x) => valorDeDimension(x, modelo));
  const sueltos = escritos.filter((_, k) => valores[k] == null).map((x) => '\`' + x + '\`');
  if (sueltos.length) {
    const quienes = sueltos.length === 1 ? sueltos[0] + ' no es un número' : sueltos.join(' y ') + ' no son números';
    return [
      'ARGUMENTO_POSICION_CON_VARIABLE',
      `En \`${real.texto}\`, ${quienes}: la consigna pide una posición concreta, no una que dependa de una variable.`,
    ];
  }
  const difieren = valores.map((_, k) => k).filter((k) => valores[k] !== pedidos[k]);
  if (!difieren.length) return general;
  const corrida = (k, uno, varias) =>
    valores[k] === pedidos[k] + 1
      ? ` Las ${varias} se numeran desde 0: la ${uno} ${valores[k]} es la ${ordinalFemenino(valores[k])}.`
      : '';
  if (escritos.length === 1) {
    return ['ARGUMENTO_OTRA_POSICION', `\`${real.texto}\` no es la posición que pide la consigna.` + corrida(0, 'posición', 'posiciones')];
  }
  if (difieren.length === 2) {
    return [
      'ARGUMENTO_FILA_Y_COLUMNA_DISTINTAS',
      `En \`${real.texto}\` ni la fila ni la columna son las que pide la consigna.` + corrida(0, 'fila', 'filas') + corrida(1, 'columna', 'columnas'),
    ];
  }
  if (difieren[0] === 0) {
    return [
      'ARGUMENTO_FILA_DISTINTA',
      `En \`${real.texto}\` la columna es la que pide la consigna, pero la fila no.` + corrida(0, 'fila', 'filas'),
    ];
  }
  return [
    'ARGUMENTO_COLUMNA_DISTINTA',
    `En \`${real.texto}\` la fila es la que pide la consigna, pero la columna no.` + corrida(1, 'columna', 'columnas'),
  ];
}

// Una posicion que no existe: con 30 filas van de 0 a 29. Solo cuando el
// numero esta escrito y se sabe cuantas posiciones tiene el arreglo.
function revisarIndices(modelo, error) {
  const dichos = new Set();
  const revisar = (valor, fila, argumento = false) => {
    if (!valor || valor.clase !== 'indice') return;
    const variable = modelo.variables.findLast((v) => v.nombre === valor.nombre);
    if (!variable) return;
    // Una cadena pasada con un indice (f(cadena[30])) ya tiene su propio
    // mensaje: el problema es pasar un caracter, no la posicion.
    if (argumento && variable.arreglo.length === 1) return;
    for (const [k, indice] of valor.indices.entries()) {
      if (k >= variable.arreglo.length || !/^\d+$/.test(indice.trim())) continue;
      const lugar = valorDeDimension(variable.arreglo[k], modelo);
      if (lugar == null || Number(indice) < lugar) continue;
      const clave = valor.texto + ':' + k;
      if (dichos.has(clave)) continue;
      dichos.add(clave);
      // En char, el ultimo corchete son las letras de un texto, y con dos
      // corchetes el primero cuenta los textos: en los dos casos, posiciones.
      const esChar = variable.tipo.clase === 'primitivo' && variable.tipo.nombre === 'char';
      const largo = variable.arreglo.length;
      const que = largo === 1 || (esChar && (largo === 2 || k === largo - 1)) ? 'posiciones' : k === 0 ? 'filas' : 'columnas';
      error(
        'INDICE_FUERA_DE_RANGO',
        `\`${variable.nombre}\` tiene ${lugar} ${que}, numeradas de 0 a ${lugar - 1}: la ${Number(indice)} no existe.`,
        fila
      );
    }
  };
  for (const l of modelo.llamadas) {
    if (l.nuevo) l.argumentos.forEach((a) => revisar(a, l.fila, true));
  }
  for (const a of modelo.asignaciones) {
    if (!a.nuevo) continue;
    revisar(a.izquierda, a.fila);
    revisar(a.derecha, a.fila);
  }
}

// Los errores de sintaxis de siempre, buscados en el texto de la respuesta. El
// analizador avisa que algo esta roto pero no siempre donde ni por que: una
// llave sin cerrar la informa en el primer renglon. Solo se llama cuando ya se
// sabe que la sintaxis esta mal, asi que no puede marcar algo que estaba bien.
//   -> [{ codigo, mensaje, fila }]   fila contada desde 0 dentro de la respuesta
function erroresConocidos(respuesta) {
  // Sin comentarios ni textos entre comillas, que pueden traer cualquier cosa.
  const codigo = respuesta.replace(
    /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g,
    (tramo) => tramo.replace(/[^\n]/g, ' ')
  );
  const filaDe = (indice) => codigo.slice(0, indice).split('\n').length - 1;
  const hallados = [];
  const hallar = (codigoError, mensaje, indice) =>
    hallados.push({ codigo: codigoError, mensaje, fila: filaDe(indice) });

  // Llaves, corchetes y parentesis que no cierran.
  const PARES = { '{': '}', '[': ']', '(': ')' };
  const NOMBRES = {
    '{': ['LLAVE', 'La llave `{`'],
    '[': ['CORCHETE', 'El corchete `[`'],
    '(': ['PARENTESIS', 'El paréntesis `(`'],
  };
  const abiertos = [];
  for (let i = 0; i < codigo.length; i++) {
    const c = codigo[i];
    if (PARES[c]) {
      abiertos.push({ c, i });
    } else if (c === '}' || c === ']' || c === ')') {
      const ultimo = abiertos[abiertos.length - 1];
      if (ultimo && PARES[ultimo.c] === c) {
        abiertos.pop();
      } else if (abiertos.some((a) => PARES[a.c] === c)) {
        // Cierra algo de mas afuera: lo que quedo sin cerrar es lo de adentro.
        break;
      } else {
        const abre = Object.keys(PARES).find((k) => PARES[k] === c);
        hallar('SOBRA_' + NOMBRES[abre][0], `Sobra este \`${c}\`: no hay ningún \`${abre}\` abierto que le corresponda.`, i);
        return hallados;
      }
    }
  }
  if (abiertos.length) {
    const { c, i } = abiertos[abiertos.length - 1];
    hallar('FALTA_' + NOMBRES[c][0], `${NOMBRES[c][1]} que se abre en esta línea no se cierra: falta un \`${PARES[c]}\`.`, i);
    return hallados;
  }

  // Una palabra de C con mayuscula o mal tipeada.
  for (const m of codigo.matchAll(/[A-Za-z_]\w*/g)) {
    const palabra = m[0];
    if (PALABRAS_DE_C.includes(palabra)) continue;
    const enMinuscula = palabra.toLowerCase();
    if (PALABRAS_DE_C.includes(enMinuscula)) {
      hallar('PALABRA_CON_MAYUSCULA', `\`${palabra}\` se escribe \`${enMinuscula}\`: las palabras de C van todas en minúscula.`, m.index);
    } else {
      const parecida = ['struct', 'typedef', 'float', 'double', 'unsigned'].find(
        (p) => distancia(p, enMinuscula) === 1
      );
      if (parecida) hallar('PALABRA_MAL_ESCRITA', `\`${palabra}\` no es una palabra de C. ¿Quiso escribir \`${parecida}\`?`, m.index);
    }
  }
  if (hallados.length) return hallados;

  const TIPO = '(?:char|int|float|double|long|short|unsigned|struct)';
  const FORMAS = [
    [
      new RegExp(`\\bstruct\\s+\\w*\\s*\\(`),
      'PARENTESIS_POR_LLAVES',
      'Los campos de una estructura van entre llaves `{ }`, no entre paréntesis.',
    ],
    [
      new RegExp(`,\\s*${TIPO}\\b`),
      'COMA_POR_PUNTO_Y_COMA',
      'Cada declaración termina con `;`. La coma solo separa varios nombres del mismo tipo: `tipo a, b;`',
    ],
    [
      new RegExp(`\\b${TIPO}\\s*\\[`),
      'CORCHETES_ANTES_DEL_NOMBRE',
      'En C los corchetes van después del nombre, no del tipo: `tipo nombre[cantidad];`',
    ],
    [
      // Toda la lista entre corchetes, o las filas de una tabla.
      /=\s*\[|=\s*\{\s*\[\s*[\d.'-]+\s*,/,
      'CORCHETES_EN_LA_LISTA',
      'La lista de valores de un arreglo no va entre corchetes: los corchetes son para la cantidad de elementos y para elegir uno.',
    ],
    [
      /=\s*\{[^{}]*[\w.']\s*;\s*[\w.'-]/,
      'PUNTO_Y_COMA_EN_LA_LISTA',
      'Los valores de la lista se separan con coma, no con `;`.',
    ],
    [/=\s*\{[^{}]*\d\s+[\d-]/, 'FALTA_COMA_EN_LA_LISTA', 'Los valores de la lista se separan con coma.'],
    [
      new RegExp(`\\w\\s*\\(\\s*(?!${TIPO}\\b)\\w+\\s+\\w`),
      'FALTA_COMA',
      'Los argumentos de una función se separan con coma: `funcion(a, b);`',
    ],
    // Estas dos buscan sobre el texto original: lo que va entre comillas (el
    // nombre del archivo) esta tapado en "codigo".
    [
      /^[ \t]*#[ \t]*define[ \t]*[<"]/m,
      'INCLUDE_ES_DEFINE',
      'Eso define una constante: no agrega una biblioteca.',
      true,
    ],
    [
      /^[ \t]*include[ \t]*[<"]/m,
      'INCLUDE_SIN_NUMERAL',
      'Las directivas del preprocesador comienzan con `#`.',
      true,
    ],
    [
      /\btypedef\s+\w+\s+struct\b/,
      'TYPEDEF_AL_REVES',
      'En un `typedef` va primero el tipo que ya existe y al final el nombre nuevo: `typedef tipoQueYaExiste nombreNuevo;`',
    ],
    [
      new RegExp(`\\btypedef\\s+\\w+\\s+${TIPO}\\s*\\[`),
      'TYPEDEF_AL_REVES',
      'En un `typedef` va primero el tipo que ya existe y después el nombre nuevo, y los corchetes van después del nombre.',
    ],
    [
      /\bstruct\s+\w*\s*\{[^}]*=/,
      'VALOR_EN_CAMPO',
      'Dentro de una estructura solo se declaran los campos: no se les puede dar un valor ahí. El valor se pone después, en cada variable.',
    ],
  ];
  for (const [forma, codigoError, mensaje, enElTextoOriginal] of FORMAS) {
    const m = forma.exec(enElTextoOriginal ? respuesta : codigo);
    if (m) hallar(codigoError, mensaje, m.index + m[0].length - 1);
  }
  return hallados;
}

const QUE_FALTA = {
  ';': ['FALTA_PUNTO_Y_COMA', 'Falta un `;`'],
  '}': ['FALTA_LLAVE', 'Falta cerrar una llave con `}`'],
  ']': ['FALTA_CORCHETE', 'Falta cerrar un corchete con `]`'],
  ')': ['FALTA_PARENTESIS', 'Falta cerrar un paréntesis con `)`'],
  identifier: ['FALTA_NOMBRE', 'Falta un nombre'],
  type_identifier: ['FALTA_NOMBRE', 'Falta un nombre'],
  field_identifier: ['FALTA_NOMBRE', 'Falta el nombre del campo'],
};

function informarSintaxis(roto, fuente, error) {
  // Lo que falta, falta al final de lo ultimo que se escribio antes: ahi es
  // donde hay que mirar, no donde arranca lo que sigue.
  let indice = roto.indice;
  if (roto.clase === 'falta') {
    while (indice > 0 && /\s/.test(fuente[indice - 1])) indice--;
    indice = Math.max(indice - 1, 0);
  }
  const fila = fuente.slice(0, indice).split('\n').length - 1;

  if (roto.clase === 'falta') {
    const [codigo, texto] = QUE_FALTA[roto.que] || ['FALTA_ALGO', `Falta \`${roto.que}\``];
    error(codigo, `${texto} al final de esta línea.`, fila);
    return;
  }

  const fragmento = roto.texto.trim().split('\n')[0].slice(0, 40);
  error(
    'NO_SE_ENTIENDE',
    `No se entiende \`${fragmento}\`. Revise que no falte un \`;\`, una llave o un corchete, y que cada palabra esté bien escrita.`,
    fila
  );
}
