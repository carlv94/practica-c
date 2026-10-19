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
//   { "campo":    { "variable": "alumno", "campos": [{ "nombre": "legajo", "tipo": "entero" }] } }
//   { "leeCampo": { "variable": "alumno", "campo": "legajo" } }
//   { "muestraCampos": { "variable": "alumno", "campos": ["legajo", "promedio"] } }
//   { "copia": { "de": "alumno", "en": "copia" } }
//   { "compara": { "izquierda": "alumno.legajo", "derecha": "copia.legajo" } }
//   { "vaciar":   "nombre" }
//   { "ciclo":    { "indice": "i", "hastaElFinDe": "nombre" } }
//   { "usaAlias": { "alias": "$T", "arreglo": { "alMenos": 30 } } }

import { fichasDe } from './enunciado.js';
import {
  construirModelo,
  erroresDeSintaxis,
  resolver,
  tipoDesdeTexto,
  textoDeTipo,
  enPalabras,
} from './modelo.js';
import {
  ejecutar,
  FueraDeRango,
  SinValor,
  MiembroNoVigente,
  ArgumentosDistintos,
  LlamadaSinAmpersand,
  LlamadaConAmpersand,
  PunteroSinAsterisco,
  AsteriscoDeMas,
  SinRetorno,
  VoidComoValor,
  NoTermina,
  SinVerificar,
  SinEntrada,
  AmpersandFalta,
  AmpersandDeMas,
  ArregloSinPosicion,
  FormatoDistinto,
  ConversionesDistintas,
  DivisionPorCero,
  NombreDesconocido,
  TextoComoLetra,
  EstructuraEntera,
} from './simulador.js';

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

// Un acento grave, para armar mensajes con codigo.
const BT = '`';

// La receta de un parametro por referencia, que los mensajes repiten.
const FORMULA_REFERENCIA =
  'Para que la función modifique la variable de afuera: `&` al llamarla, `*` en la declaración del parámetro y `*` cada vez que se lo usa adentro.';
// Las funciones que arma el sistema: no son del alumno.
const NO_ES_DEL_ALUMNO = ['main', 'practica', '__prueba'];

const PALABRAS_DE_C = [
  'struct', 'union', 'typedef', 'char', 'int', 'float', 'double', 'long', 'short', 'unsigned', 'signed',
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
  if (partes[0] === 'enum') return `del enumerado \`${partes[1]}\``;
  if (partes[0] === 'union') return `de la unión \`${partes[1]}\``;
  return partes[0] === 'struct' ? `de la estructura \`${partes[1]}\`` : `del tipo \`${pedido}\``;
}

const ORDINALES = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto', 'sexto', 'séptimo', 'octavo', 'noveno', 'décimo'];
const ordinal = (indice) => ORDINALES[indice] || `${indice + 1}.º`;
const ORDINALES_FEMENINOS = ['primera', 'segunda', 'tercera', 'cuarta', 'quinta', 'sexta', 'séptima', 'octava', 'novena', 'décima'];
const ordinalFemenino = (indice) => ORDINALES_FEMENINOS[indice] || `${indice + 1}.ª`;

function mismoTipo(a, b) {
  if (a.clase !== b.clase) return false;
  if (a.clase === 'struct' || a.clase === 'enum') return a.def === b.def;
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

// La biblioteca que hay que agregar para usar una funcion, en las reglas que la
// controlan (hoy solo la de resultado).
const BIBLIOTECA_DE = { pow: 'math.h' };

// El plural de un nombre de nivel: curso -> cursos, parcial -> parciales.
const enPlural = (s) => (/[aeiou]$/i.test(s) ? `${s}s` : /ón$/i.test(s) ? `${s.slice(0, -2)}ones` : `${s}es`);

// Los valores de una variable en un mensaje, cada uno como esta en el codigo y
// con "y" antes del ultimo: `120`, `85` y `310`.
// Una letra de una consigna ('a') llega al interprete como su numero, y se
// vuelve a mostrar como letra en los mensajes.
const esLetra = (x) => typeof x === 'string' && [...x].length === 1;
const tieneLetras = (x) => (Array.isArray(x) ? x.some(tieneLetras) : esLetra(x));
const enCodigos = (x) => (Array.isArray(x) ? x.map(enCodigos) : esLetra(x) ? x.codePointAt(0) : x);
const deLetra = (v) => `'${String.fromCodePoint(v)}'`;

// El caso con sus letras pasadas a numeros, y anotado cuales eran letras.
function conCodigos(caso) {
  const letrasQueda = new Set(
    Object.entries(caso.queda || {})
      .filter(([, v]) => tieneLetras(v))
      .map(([nombre]) => nombre)
  );
  const letrasMuestra = tieneLetras(caso.muestra);
  const letrasDatos = Object.values(caso.datos || {}).some(tieneLetras);
  if (!letrasQueda.size && !letrasMuestra && !letrasDatos) return caso;
  const codigos = (o) => o && Object.fromEntries(Object.entries(o).map(([k, v]) => [k, enCodigos(v)]));
  return {
    ...caso,
    datos: codigos(caso.datos),
    queda: codigos(caso.queda),
    muestra: enCodigos(caso.muestra),
    letrasQueda,
    letrasMuestra,
    vistos: caso.datos,
  };
}

// El simulador sigue un arreglo de estructuras "aplanado" (alumnos.nacimiento.mes[0]);
// el alumno lo escribe alumnos[0].nacimiento.mes.
const comoLoEscribio = (nombre) => {
  const m = /^([A-Za-z_]\w*)((?:\.\w+)+)\[(\d+)\]$/.exec(nombre);
  return m ? `${m[1]}[${m[3]}]${m[2]}` : nombre;
};
// Un campo de un arreglo de estructuras (alumnos.promedio) es el arreglo "alumnos".
const arregloDe = (nombre) => nombre.split('.')[0];

const enLista = (valores) => {
  // Una fila de una tabla se escribe como en el codigo: {5, 8, 1, 4}.
  const comoEsta = (v) => (Array.isArray(v) ? `{${v.map(comoEsta).join(', ')}}` : esLetra(v) ? `'${v}'` : String(v));
  const cada = valores.map((v) => `\`${comoEsta(v)}\``);
  return cada.length < 2 ? cada.join('') : `${cada.slice(0, -1).join(', ')} y ${cada[cada.length - 1]}`;
};

// Con que funciones se lee del teclado, y cual es el argumento donde se guarda.
const LECTURAS = ['scanf', 'gets', 'fgets'];
const MUESTRAS = ['printf', 'puts'];
const destinoDeLectura = (l) => (l.funcion === 'scanf' ? l.argumentos[1] : l.argumentos[0]);

// El formato que le corresponde a cada clase de campo (leer y mostrar los campos).
const FORMATOS = {
  entero: { buenos: ['d', 'i'], para: '%d', que: 'un entero' },
  real: { buenos: ['f'], para: '%f', que: 'un decimal' },
  letra: { buenos: ['c'], para: '%c', que: 'una letra' },
  cadena: { buenos: ['s'], para: '%s', que: 'un texto' },
};
const DE_QUE_FORMATO = { d: 'un entero', i: 'un entero', f: 'un decimal', c: 'una letra', s: 'un texto', u: 'un entero sin signo' };

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
  // Tambien se explica por que es la correcta: que un acierto no se deba al azar.
  if (opcion.correcta) {
    return resultado(
      true,
      opcion.explicacion
        ? [{ nivel: 'explicacion', codigo: 'OPCION_CORRECTA', mensaje: opcion.explicacion, linea: null }]
        : []
    );
  }
  return resultado(false, [
    { nivel: 'error', codigo: opcion.codigo, mensaje: opcion.explicacion, linea: null },
  ]);
}

export function corregir(
  analizador,
  consigna,
  {
    archivo = '',
    contexto = '',
    respuesta = '',
    capturas = {},
    dentroDeMain = false,
    enArchivo = false,
    practicas = [],
    avisados = [],
    despues = '',
    arriba = false,
  }
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
  } else if (enArchivo && (despues || arriba)) {
    // La respuesta va arriba (un prototipo) y el codigo dado, despues de todo.
    previo = afuera;
    fuente =
      previo + respuesta.replace(/\s+$/, '') + '\n\n' + (adentro ? 'void practica(void) {\n' + adentro + '}\n\n' : '') + despues;
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
  // "bloques" son lo que se muestra aparte del texto, como una salida de consola:
  // [{ titulo, lineas }].
  function diag(nivel, codigo, mensaje, fila, bloques) {
    diagnosticos.push({
      nivel,
      codigo,
      mensaje,
      linea: fila == null ? null : fila - filaBase + 1,
      ...(bloques ? { bloques } : {}),
    });
  }
  const error = (codigo, mensaje, fila, bloques) => diag('error', codigo, mensaje, fila, bloques);
  const aviso = (codigo, mensaje, fila) => diag('aviso', codigo, mensaje, fila);
  // Una mejora no invalida: la respuesta esta bien, pero hay una forma mejor.
  const mejora = (codigo, mensaje, fila) => diag('mejora', codigo, mensaje, fila);
  // Una nota es para algo que conviene saber y que no es para corregir: la
  // respuesta sigue siendo excelente. Se dice una sola vez por serie ("avisados").
  const nota = (codigo, mensaje, fila) => diag('nota', codigo, mensaje, fila);

  function terminar() {
    const correcto = !diagnosticos.some((d) => d.nivel === 'error');
    // Las mejoras y las notas son para una respuesta que ya esta bien: con un
    // error, lo unico que importa es el error.
    const informados = correcto
      ? diagnosticos
      : diagnosticos.filter((d) => d.nivel !== 'mejora' && d.nivel !== 'nota');
    // Una condicion que no se pudo comprobar deja la respuesta como correcta,
    // pero no como excelente: excelente es "lo verifique y no hay nada que mejorar".
    const sinVerificar =
      correcto && diagnosticos.some((d) => ['CICLO_NO_VERIFICADO', 'INTERCAMBIO_NO_VERIFICADO', 'EJECUCION_NO_VERIFICADA'].includes(d.codigo));
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
      // Lo que define la consigna, para decir que palabra falta en un typedef.
      const palabraDeTipo =
        consigna.requiere.map((r) => ['struct', 'union', 'enum'].find((p) => r[p])).find(Boolean) || null;
      const conocidos = erroresConocidos(respuesta, palabraDeTipo);
      for (const c of conocidos) error(c.codigo, c.mensaje, filaBase + c.fila);
      if (!conocidos.length) for (const roto of rotos) informarSintaxis(roto, fuente, error);
      return terminar();
    }

    const modelo = construirModelo(arbol, desde);
    revisarNombres(modelo, error);
    revisarFunciones(modelo, error, consigna.requiere.some((r) => r.llamada), enArchivo && Boolean(arriba || despues));
    revisarConversiones(modelo, error);
    revisarRedefiniciones(modelo, error, practicas.includes('constantes') ? mejora : null);
    // Cuando la consigna pide los caracteres de a uno, o vaciar la cadena,
    // aconsejarle una funcion de la biblioteca seria mandarlo a otra cosa.
    const sinFuncion = consigna.requiere.some((r) => r.elementos || r.vaciar || r.ciclo);
    revisarAsignaciones(modelo, error, !sinFuncion);
    revisarIndices(modelo, error);
    revisarCampos(modelo, error);
    revisarEnumerados(modelo, error, mejora, nota, avisados);
    revisarCondiciones(modelo, error);
    revisarDimensiones(modelo, error, practicas.includes('constantes') ? mejora : null);
    for (const regla of consigna.requiere) {
      try {
        aplicarRegla(regla, modelo);
      } catch (e) {
        // Una regla que usa lo que otra tenia que capturar y no pudo (la
        // estructura o el enumerado sin nombre): el error ya esta dicho.
        const yaHayError = diagnosticos.some((d) => d.nivel === 'error');
        if (yaHayError && /que ninguna consigna anterior capturó/.test(e.message)) break;
        throw e;
      }
    }
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
    if (regla.union) return reglaStruct(regla.union, modelo, true);
    if (regla.funcion) return reglaFuncion(regla.funcion, modelo);
    if (regla.prototipo) return reglaPrototipo(regla.prototipo, modelo);
    if (regla.sinGlobales) return reglaSinGlobales(modelo);
    if (regla.global) return reglaGlobal(regla.global, modelo);
    if (regla.enum) return reglaEnum(regla.enum, modelo);
    if (regla.variable) return reglaVariable(regla.variable, modelo);
    if (regla.alias) return reglaAlias(regla.alias, modelo);
    if (regla.llamada) return reglaLlamada(regla.llamada, modelo);
    if (regla.elementos) return reglaElementos(regla.elementos, modelo);
    if (regla.vaciar) return reglaVaciar(regla.vaciar, modelo);
    if (regla.ciclo) return reglaCiclo(regla.ciclo, modelo);
    if (regla.usaAlias) return reglaUsaAlias(regla.usaAlias, modelo);
    if (regla.incluye) return reglaIncluye(regla.incluye, modelo);
    if (regla.lee) return reglaLee(regla.lee, modelo);
    if (regla.asigna) return reglaAsigna(regla.asigna, modelo);
    if (regla.campo) return reglaCampo(regla.campo, modelo);
    if (regla.leeCampo) return reglaLeeCampo(regla.leeCampo, modelo);
    if (regla.copia) return reglaCopia(regla.copia, modelo);
    if (regla.compara) return reglaCompara(regla.compara, modelo);
    if (regla.muestraCampos) return reglaMuestraCampos(regla.muestraCampos, modelo);
    if (regla.suma) return reglaSuma(regla.suma, modelo);
    if (regla.resultado) return reglaResultado(regla.resultado, modelo);
    if (regla.ejecuta) return reglaEjecuta(regla.ejecuta, modelo);
    if (regla.intercambia) return reglaIntercambia(regla.intercambia, modelo);
    if (regla.muestra) return reglaMuestra(regla.muestra, modelo);
    if (regla.limpiaEntrada) return reglaLimpiaEntrada(regla.limpiaEntrada, modelo);
    throw new Error(`La consigna "${consigna.id}" tiene una regla que no conozco.`);
  }

  // ---- enum -----------------------------------------------------------------

  // Un enumerado: sus nombres, en orden, y con que valores.
  //   { "enum": { "enumeradores": ["MANANA", "TARDE", "NOCHE"],
  //               "valores": { "MEDIA": 5 }, "capturar": "E" } }
  // Sin "valores", cada nombre vale su posicion (el primero 0). Con ellos, los
  // que se nombran valen eso y los que siguen, uno mas que el anterior.
  function reglaEnum(regla, modelo) {
    const candidatos = modelo.enums.filter((e) => e.nuevo);
    if (!candidatos.length) {
      error(
        'ENUM_FALTA',
        'No encontré la declaración de un enumerado. Se escribe con la palabra `enum` y, entre llaves, los nombres separados por comas.'
      );
      return;
    }
    const pedidos = regla.enumeradores;
    const aciertos = (e) => e.enumeradores.filter((x) => pedidos.includes(x.nombre)).length;
    const def = candidatos.reduce((mejor, e) => (aciertos(e) > aciertos(mejor) ? e : mejor));

    const sinUsar = new Set(def.enumeradores);
    for (const esperado of pedidos) {
      const hallado = def.enumeradores.find((x) => x.nombre === esperado);
      if (hallado) {
        sinUsar.delete(hallado);
        continue;
      }
      const parecido = [...sinUsar].find(
        (x) =>
          !pedidos.includes(x.nombre) &&
          (x.nombre.toLowerCase() === esperado.toLowerCase() || distancia(x.nombre, esperado) <= 2)
      );
      if (!parecido) {
        error('ENUMERADOR_FALTA', `Falta el enumerador \`${esperado}\`.`, def.fila);
        continue;
      }
      sinUsar.delete(parecido);
      const soloMayusculas = parecido.nombre.toLowerCase() === esperado.toLowerCase();
      error(
        'ENUMERADOR_NOMBRE',
        `El enumerador \`${parecido.nombre}\` tendría que llamarse \`${esperado}\`` +
          (soloMayusculas ? ': en C las mayúsculas y las minúsculas son letras distintas.' : '.'),
        parecido.fila
      );
    }
    for (const x of sinUsar) {
      aviso('ENUMERADOR_DE_MAS', `La consigna no pide el enumerador \`${x.nombre}\`.`, x.fila);
    }

    // El orden: el primero vale 0 y cada uno, uno mas que el anterior.
    const escritos = def.enumeradores.map((x) => x.nombre).filter((n) => pedidos.includes(n));
    const hechos = pedidos.filter((n) => escritos.includes(n));
    if (escritos.length === hechos.length && escritos.some((n, i) => n !== hechos[i])) {
      error(
        'ENUMERADOR_ORDEN',
        `Los enumeradores van en este orden: ${pedidos.map((n) => `\`${n}\``).join(', ')}. El orden importa: el primero vale 0 y cada uno vale uno más que el anterior.`,
        def.fila
      );
    } else {
      // Los valores: los que pide la consigna o, si no, la posicion de cada uno.
      let esperado = -1;
      for (const nombre of pedidos) {
        const pedidoValor = regla.valores && Object.hasOwn(regla.valores, nombre) ? regla.valores[nombre] : esperado + 1;
        esperado = pedidoValor;
        const x = def.enumeradores.find((e) => e.nombre === nombre);
        if (!x || x.valor == null || x.valor === pedidoValor) continue;
        error(
          'ENUMERADOR_VALOR',
          x.explicito
            ? `\`${nombre}\` vale \`${x.valor}\` y la consigna pide que valga \`${pedidoValor}\`.`
            : `\`${nombre}\` vale \`${x.valor}\` y la consigna pide que valga \`${pedidoValor}\`: se lo escribe con \`= ${pedidoValor}\` después del nombre.`,
          x.fila
        );
        break;
      }
    }

    // Con "etiqueta", el enumerado tiene que llamarse asi (enum Turno { ... }).
    if (regla.etiqueta && def.etiqueta !== regla.etiqueta) {
      // Con typedef el enumerado no lleva nombre despues de enum: lo que pide la consigna es otra cosa.
      const conAlias =
        !def.etiqueta && modelo.aliases.some((a) => a.tipo.defId === def.id && a.tipo.clase === 'enum' && !a.punteros && !a.arreglo.length);
      if (conAlias) {
        error(
          'ENUM_CON_TYPEDEF',
          `En esta consigna se debe declarar el enumerado sin el alias: no use ${BT}typedef${BT}. El nombre ${BT}${regla.etiqueta}${BT} va entre la palabra ${BT}enum${BT} y la llave, como ${BT}enum ${regla.etiqueta} { ... };${BT}.`,
          def.fila
        );
        return;
      }
      error(
        'ENUM_ETIQUETA',
        def.etiqueta
          ? `La consigna pide que el enumerado se llame \`${regla.etiqueta}\`, y acá se llama \`${def.etiqueta}\`.`
          : `Al enumerado le falta el nombre \`${regla.etiqueta}\`: va entre la palabra \`enum\` y la llave.`,
        def.fila
      );
      return;
    }
    // Sin etiqueta y sin alias, el enumerado no se puede volver a nombrar.
    const alias = modelo.aliases.find((a) => a.tipo.defId === def.id && a.tipo.clase === 'enum' && !a.punteros && !a.arreglo.length);
    if (!def.etiqueta && !alias) {
      error(
        'ENUM_SIN_NOMBRE',
        'El enumerado no tiene nombre, así que después no se lo va a poder usar como tipo. El nombre va entre `enum` y la llave, o se le da un alias con `typedef`.',
        def.fila
      );
      return;
    }
    if (regla.capturar) {
      nuevas[regla.capturar] = def.etiqueta ? 'enum ' + def.etiqueta : alias.nombre;
    }
  }

  // ---- funcion y prototipo --------------------------------------------------

  // Una funcion: que devuelve y que parametros recibe. Acepta cualquier nombre
  // (salvo con "nombre").
  //   { "funcion": { "retorna": "entero" | "real" | "caracter" | "void",
  //                  "parametros": [{ "tipo": "entero", "referencia": true }],
  //                  "capturar": "F" } }
  // Un parametro "referencia" se declara con * (el que modifica lo de afuera), y
  // "arreglo": true es un arreglo (v[] o con *).

  function reglaFuncion(regla, modelo) {
    const candidatas = modelo.funciones.filter((f) => f.nuevo && !f.prototipo && !NO_ES_DEL_ALUMNO.includes(f.nombre));
    if (!candidatas.length) {
      error(
        'FUNCION_FALTA',
        'No encontré la definición de una función. Se escribe el tipo que devuelve, el nombre, los parámetros entre paréntesis y, entre llaves, lo que hace.'
      );
      return;
    }
    const pedidoNombre = regla.nombre ? valorDe(regla.nombre) : null;
    const f = (pedidoNombre && candidatas.find((c) => c.nombre === pedidoNombre)) || candidatas[candidatas.length - 1];
    if (pedidoNombre && f.nombre !== pedidoNombre) {
      error('FUNCION_NOMBRE', `La consigna pide que la función se llame ${BT}${pedidoNombre}${BT}, y acá se llama ${BT}${f.nombre}${BT}.`, f.fila);
      return;
    }

    // Lo que devuelve.
    const real = resolver(f.tipo, modelo);
    const escrito = textoDeTipo(f.tipo) + (f.punteros ? ' ' + '*'.repeat(f.punteros) : '');
    if (regla.retorna === 'void') {
      if (!(real.clase === 'primitivo' && real.nombre === 'void' && !f.punteros)) {
        // Devuelve el resultado en vez de mostrarlo (o de dejarlo en la variable de afuera).
        if (f.retornos.some((r) => r.conValor) && !f.muestra) {
          const porReferencia = (regla.parametros || []).some((p) => p.referencia);
          error(
            'DEVUELVE_EN_VEZ_DE_MOSTRAR',
            porReferencia
              ? `La consigna pide que la función deje el resultado en la variable de afuera, no que lo devuelva con ${BT}return${BT}: es ${BT}void${BT}, o sea que no devuelve nada, y modifica lo que recibe por referencia. ${FORMULA_REFERENCIA}`
              : `La consigna pide que la función muestre el resultado con ${BT}printf${BT}, no que lo devuelva: es ${BT}void${BT}, o sea que no devuelve nada, y el resultado se muestra adentro de la función.`,
            f.fila
          );
          return;
        }
        error(
          'FUNCION_TIPO_RETORNO',
          `La función no tiene que devolver ningún valor: el tipo que devuelve es ${BT}void${BT}. Está declarada como ${BT}${escrito}${BT}.`,
          f.fila
        );
        return;
      }
    } else if (regla.retorna) {
      // 'estructura': devolver una estructura (no una union).
      const deEstructura = regla.retorna === 'estructura';
      const deEnumerado = regla.retorna === 'enumerado';
      const categoria = deEstructura ? { pide: 'una estructura' } : deEnumerado ? { pide: 'un enumerado' } : CATEGORIAS[regla.retorna];
      if (!categoria) throw new Error(`La consigna "${consigna.id}" pide un tipo de retorno que no conozco: ${regla.retorna}`);
      if (real.clase === 'primitivo' && real.nombre === 'void' && !f.punteros && f.muestra) {
        error(
          'MUESTRA_EN_VEZ_DE_DEVOLVER',
          `La función muestra el resultado con ${BT}printf${BT}, pero la consigna pide que lo devuelva: el tipo que devuelve tiene que ser ${categoria.pide} y el resultado se entrega con ${BT}return${BT}. Lo que se devuelve lo usa quien llama a la función (lo guarda, lo muestra o lo compara).`,
          f.fila
        );
        return;
      }
      const cumple = deEstructura
        ? real.clase === 'struct' && !real.union && !f.punteros
        : deEnumerado
          ? real.clase === 'enum' && !f.punteros
          : real.clase === 'primitivo' && categoria.es(real.nombre) && !f.punteros;
      if (!cumple) {
        error(
          'FUNCION_TIPO_RETORNO',
          `La función tiene que devolver ${categoria.pide}: ese es el tipo que va antes del nombre. Está declarada como ${BT}${escrito}${BT}.`,
          f.fila
        );
        return;
      }
    }

    // Los parametros.
    const pedidos = regla.parametros || [];
    if (f.parametros.length !== pedidos.length) {
      error(
        'PARAMETROS_CANTIDAD',
        `La consigna pide que la función ${pedidos.length === 0 ? 'no reciba ningún parámetro' : pedidos.length === 1 ? 'reciba un parámetro' : 'reciba ' + pedidos.length + ' parámetros'}, y tiene ${f.parametros.length === 0 ? 'ninguno' : f.parametros.length}.`,
        f.fila
      );
      return;
    }
    for (let k = 0; k < pedidos.length; k++) {
      const p = f.parametros[k];
      const pedido = pedidos[k];
      const tipo = resolver(p.tipo, modelo);
      const categoria = CATEGORIAS[pedido.tipo];
      const que = `El ${ordinal(k)} parámetro${p.nombre ? ' ' + BT + p.nombre + BT : ''}`;
      const declarado = enPalabras(p);
      if (pedido.referencia) {
        if (!p.punteros || p.arreglo.length) {
          error(
            'PARAMETRO_REFERENCIA_FALTA',
            `${que} tiene que modificar la variable de afuera, y para eso se declara con ${BT}*${BT}, como ${BT}${pedido.tipo === 'real' ? 'float' : 'int'} *${p.nombre || 'x'}${BT}. ${FORMULA_REFERENCIA}`,
            p.fila
          );
          return;
        }
      } else if (pedido.arreglo) {
        if (!(p.arreglo.length || p.punteros)) {
          error('PARAMETRO_TIPO', `${que} tiene que ser un arreglo. Está declarado como ${declarado}.`, p.fila);
          return;
        }
        if (pedido.dimensiones && p.arreglo.length && p.arreglo.length !== pedido.dimensiones) {
          error(
            'PARAMETRO_TIPO',
            pedido.dimensiones === 2
              ? `${que} tiene que ser una tabla, con dos pares de corchetes. Está declarado como ${declarado}.`
              : `${que} tiene que ser un arreglo de una dimensión, con un solo par de corchetes. Está declarado como ${declarado}.`,
            p.fila
          );
          return;
        }
      } else if (p.punteros || p.arreglo.length) {
        error(
          'PARAMETRO_ASTERISCO_DE_MAS',
          p.punteros
            ? `${que} tiene un ${BT}*${BT} de más: la consigna no pide que la función modifique la variable de afuera, así que recibe solo el valor.`
            : `${que} tiene que ser un solo valor, no un arreglo.`,
          p.fila
        );
        return;
      }
      if (pedido.tipo === 'estructura' && !(tipo.clase === 'struct' && !tipo.union)) {
        error('PARAMETRO_TIPO', `${que} tiene que ser una estructura. Está declarado como ${declarado}.`, p.fila);
        return;
      }
      if (categoria && !(tipo.clase === 'primitivo' && categoria.es(tipo.nombre))) {
        error(
          'PARAMETRO_TIPO',
          `${que} tiene que ser ${categoria.pide}. Está declarado como ${declarado}.`,
          p.fila
        );
        return;
      }
    }

    // El return.
    const conValor = f.retornos.some((r) => r.conValor);
    if (regla.retorna && regla.retorna !== 'void' && !conValor) {
      error(
        'RETORNO_FALTA',
        `La función tiene que devolver un valor, y no tiene ningún ${BT}return${BT} con un valor: se escribe ${BT}return${BT} y lo que se devuelve.`,
        f.fila
      );
      return;
    }
    if (regla.retorna === 'void' && conValor) {
      const r = f.retornos.find((x) => x.conValor);
      error(
        'RETORNO_EN_VOID',
        `La función es ${BT}void${BT}: no devuelve ningún valor, así que no lleva ${BT}return${BT} con un valor.`,
        r.fila
      );
      return;
    }
    if (regla.capturar) nuevas[regla.capturar] = f.nombre;
  }

  // La consigna pide declarar una variable global: afuera de todas las funciones.
  //   { "global": { "nombre": "veces", "tipo": "entero" } }
  function reglaGlobal(regla, modelo) {
    const nombre = valorDe(regla.nombre);
    const declaradas = modelo.variables.filter((v) => v.nuevo && v.nombre === nombre);
    if (!declaradas.length) {
      error(
        'GLOBAL_FALTA',
        `No encontré la declaración de ${BT}${nombre}${BT}: la consigna pide una variable global con ese nombre, declarada afuera de las funciones.`
      );
      return;
    }
    const global = declaradas.find((v) => !v.local);
    if (!global) {
      const adentro = declaradas[0];
      const f = modelo.funciones.find((x) => !x.prototipo && x.posicion <= adentro.indice && adentro.indice < x.fin);
      error(
        'GLOBAL_DENTRO_DE_FUNCION',
        `${BT}${nombre}${BT} está declarada dentro de ${f ? BT + f.nombre + BT : 'una función'}: ahí es una variable local y desaparece cuando la función termina. Para que conserve su valor entre una llamada y otra, tiene que estar declarada afuera de todas las funciones.`,
        adentro.fila
      );
      return;
    }
    const categoria = regla.tipo && CATEGORIAS[regla.tipo];
    const real = resolver(global.tipo, modelo);
    if (categoria && !(real.clase === 'primitivo' && categoria.es(real.nombre))) {
      error(
        'VARIABLE_TIPO',
        `${BT}${nombre}${BT} tiene que ser ${categoria.pide}. Está declarada como ${textoDeTipo(global.tipo)}.`,
        global.fila
      );
      return;
    }
    // Es correcto (en C una global sin valor empieza en 0), pero conviene escribirlo.
    if (!global.inicializada && !avisados.includes('GLOBAL_SIN_VALOR_INICIAL')) {
      nota(
        'GLOBAL_SIN_VALOR_INICIAL',
        `Su respuesta es correcta. Solo una observación: una variable global empieza valiendo ${BT}0${BT} aunque no se le escriba ningún valor, pero escribir ${BT}= 0${BT} deja clara la intención.`,
        global.fila
      );
    }
  }

  // La consigna pide no usar variables globales: ninguna declaracion fuera de
  // las funciones en lo que escribio el alumno.
  //   { "sinGlobales": true }
  function reglaSinGlobales(modelo) {
    const global = modelo.variables.find((v) => v.nuevo && !v.local);
    if (!global) return;
    error(
      'GLOBAL_DE_MAS',
      `${BT}${global.nombre}${BT} está declarada afuera de las funciones, así que es una variable global: la consigna pide no usarlas. Lo que la función necesita le llega por parámetros, y lo que calcula sale con ${BT}return${BT} o por referencia.`,
      global.fila
    );
  }

  // El prototipo de una funcion: su encabezado seguido de ";", para poder
  // llamarla antes de definirla. Tiene que coincidir con la funcion.
  //   { "prototipo": { "de": "$F" } }   (o el nombre de la funcion)
  function reglaPrototipo(regla, modelo) {
    const nombre = valorDe(regla.de);
    const prototipos = modelo.funciones.filter((f) => f.nuevo && f.prototipo);
    if (!prototipos.length) {
      error(
        'PROTOTIPO_FALTA',
        `No encontré el prototipo de ${BT}${nombre}${BT}: es el encabezado de la función (el tipo que devuelve, el nombre y los parámetros) terminado en ${BT};${BT}, sin el cuerpo.`
      );
      return;
    }
    const p = prototipos.find((x) => x.nombre === nombre);
    if (!p) {
      error(
        'PROTOTIPO_NOMBRE',
        `El prototipo tiene que ser de la función ${BT}${nombre}${BT}, y este es de ${BT}${prototipos[0].nombre}${BT}.`,
        prototipos[0].fila
      );
      return;
    }
    const definicion = modelo.funciones.find((x) => !x.prototipo && x.nombre === nombre);
    if (!definicion) return;
    const mismo = (a, b) => {
      const ra = resolver(a.tipo, modelo);
      const rb = resolver(b.tipo, modelo);
      return mismoTipo(ra, rb) && a.punteros === b.punteros && (a.arreglo || []).length === (b.arreglo || []).length;
    };
    if (!mismo(p, definicion)) {
      error(
        'PROTOTIPO_NO_COINCIDE',
        `El prototipo tiene que decir lo mismo que la función: devuelve ${BT}${textoDeTipo(definicion.tipo)}${BT}, y el prototipo ${BT}${textoDeTipo(p.tipo)}${BT}.`,
        p.fila
      );
      return;
    }
    if (p.parametros.length !== definicion.parametros.length || p.parametros.some((x, i) => !mismo(x, definicion.parametros[i]))) {
      error(
        'PROTOTIPO_NO_COINCIDE',
        `Los parámetros del prototipo tienen que ser los mismos que los de la función, en el mismo orden y con los mismos tipos.`,
        p.fila
      );
    }
  }

  // ---- struct ---------------------------------------------------------------

  // Una union se pide igual que una estructura, con { "union": { ... } }: sus
  // miembros se llaman "campos" en la regla. Se la distingue por la palabra con
  // que se declara: una estructura donde va una union (o al reves) es el error.
  function reglaStruct(regla, modelo, esUnion = false) {
    const candidatos = modelo.structs.filter((s) => s.nuevo && Boolean(s.union) === esUnion);
    const palabra = esUnion ? 'union' : 'struct';
    const miembro = esUnion ? 'miembro' : 'campo';
    if (!candidatos.length) {
      const otra = modelo.structs.find((s) => s.nuevo && Boolean(s.union) !== esUnion);
      if (otra) {
        error(
          esUnion ? 'UNION_FALTA' : 'STRUCT_FALTA',
          esUnion
            ? 'Declaró una estructura con `struct`, y la consigna pide una unión: se declara con la palabra `union`. En una estructura cada campo tiene su propio lugar; en una unión todos los miembros comparten uno solo.'
            : 'Declaró una unión con `union`, y la consigna pide una estructura: se declara con la palabra `struct`.',
          otra.fila
        );
        return;
      }
      error(
        esUnion ? 'UNION_FALTA' : 'STRUCT_FALTA',
        esUnion
          ? 'No encontré la declaración de una unión. Se escribe con la palabra `union` y, entre llaves, sus miembros.'
          : 'No encontré la declaración de una estructura.'
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
        error('CAMPO_FALTA', `Falta el ${miembro} \`${esperado.nombre}\`.`, def.fila);
        continue;
      }
      sinUsar.delete(parecido);
      const soloMayusculas = parecido.nombre.toLowerCase() === esperado.nombre.toLowerCase();
      error(
        'CAMPO_NOMBRE',
        `El ${miembro} \`${parecido.nombre}\` tendría que llamarse \`${esperado.nombre}\`` +
          (soloMayusculas ? ': en C las mayúsculas y las minúsculas son letras distintas.' : '.'),
        parecido.fila
      );
      verificarCampo(parecido, esperado, modelo);
    }

    for (const campo of sinUsar) {
      aviso('CAMPO_DE_MAS', `La consigna no pide el ${miembro} \`${campo.nombre}\`.`, campo.fila);
    }

    // Sin etiqueta y sin alias, la estructura no se puede volver a nombrar.
    const alias = modelo.aliases.find(
      (a) => a.tipo.defId === def.id && a.tipo.clase === 'struct' && !a.punteros && !a.arreglo.length
    );
    if (!def.etiqueta && !alias) {
      error(
        esUnion ? 'UNION_SIN_NOMBRE' : 'STRUCT_SIN_NOMBRE',
        esUnion
          ? 'La unión no tiene nombre, así que después no se la va a poder usar. El nombre va entre `union` y la llave, o se le da un alias con `typedef`.'
          : 'La estructura no tiene nombre, así que después no se la va a poder usar. ' +
              'El nombre va entre `struct` y la llave.',
        def.fila
      );
      return;
    }
    if (regla.capturar) {
      nuevas[regla.capturar] = def.etiqueta ? palabra + ' ' + def.etiqueta : alias.nombre;
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
          `\`${n}\` está declarado con \`*\`: así no reserva espacio para guardar el texto. Tiene que ser una cadena: un \`char\` con su dimensión entre corchetes.`,
          campo.fila
        );
      } else if (campo.arreglo.length === 0) {
        error(
          'CAMPO_CADENA_SIN_DIMENSION',
          `\`${n}\` así guarda un solo carácter. Para un texto hace falta una cadena: un \`char\` con su dimensión entre corchetes.`,
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

    // Un campo que es un enumerado: "tipo": "enumerado", "de": "TTurno".
    if (esperado.tipo === 'enumerado') {
      const pedido = valorDe(esperado.de);
      if (campo.punteros || campo.arreglo.length) {
        error(
          'CAMPO_TIPO',
          `\`${n}\` tiene que ser una sola variable de tipo \`${pedido}\`, no ${campo.punteros ? 'un puntero' : 'un arreglo'}. ${declarado}`,
          campo.fila
        );
      } else if (!mismoTipo(real, resolver(tipoDesdeTexto(pedido), modelo))) {
        error(
          'CAMPO_TIPO',
          `\`${n}\` tiene que ser de tipo \`${pedido}\`: es un enumerado. ${declarado}`,
          campo.fila
        );
      }
      return;
    }

    // Un campo que es otra estructura: "tipo": "estructura", "de": "TFecha". O una
    // union: "tipo": "union", "de": "TDato".
    if (esperado.tipo === 'estructura' || esperado.tipo === 'union') {
      const pedido = valorDe(esperado.de);
      if (campo.punteros || campo.arreglo.length) {
        error(
          'CAMPO_TIPO',
          `\`${n}\` tiene que ser una sola variable de tipo \`${pedido}\`, no ${campo.punteros ? 'un puntero' : 'un arreglo'}. ${declarado}`,
          campo.fila
        );
      } else if (!mismoTipo(real, resolver(tipoDesdeTexto(pedido), modelo))) {
        error(
          'CAMPO_TIPO',
          `\`${n}\` tiene que ser de tipo \`${pedido}\`: es ${esperado.tipo === 'union' ? 'una unión dentro de la estructura' : 'una estructura dentro de otra'}. ${declarado}`,
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
    // Los valores de un arreglo de un enumerado se piden con los nombres de los
    // enumeradores; aca pasan a sus numeros (una letra sola sigue siendo una letra).
    if (regla.valores) {
      const enNumeros = (v) => {
        if (Array.isArray(v)) return v.map(enNumeros);
        if (typeof v !== 'string' || v.length < 2) return v;
        const e = modelo.enums.flatMap((d) => d.enumeradores).find((x) => x.nombre === v);
        return e && e.valor != null ? e.valor : v;
      };
      regla = { ...regla, valores: enNumeros(regla.valores) };
    }
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
    const dimensiones = !quiereArreglo ? 0 : !esTabla ? 1 : conLetras || medidas.length > 2 ? medidas.length : 2;
    const forma = deCadenas
      ? dimensiones === 3
        ? 'una tabla de cadenas'
        : 'un arreglo de cadenas'
      : dimensiones > 2
        ? 'un arreglo de tres dimensiones'
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
          : dimensiones > 2
            ? `\`${v.nombre}\` tiene una sola dimensión: es un arreglo. La consigna pide ${forma}${dimensionesDe(regla.arreglo)}.`
            : `\`${v.nombre}\` tiene una sola dimensión: es un arreglo. La consigna pide una tabla, con filas y columnas.`,
        v.fila
      );
    } else if (esTabla) {
      error(
        'TABLA_DIMENSIONES',
        deCadenas
          ? `\`${v.nombre}\` tiene ${v.arreglo.length} dimensiones. La consigna pide ${forma}, que tiene ${dimensiones === 3 ? 'tres: las filas, las columnas y el tamaño de cada texto' : 'dos: la cantidad de textos y el tamaño de cada uno'}.`
          : dimensiones > 2
            ? `\`${v.nombre}\` tiene ${v.arreglo.length} dimensiones. La consigna pide ${forma}${dimensionesDe(regla.arreglo)}.`
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

  // ": una para los cursos, otra para los alumnos y otra para los parciales".
  function dimensionesDe(arreglo) {
    const u = arreglo && arreglo.unidades;
    if (!Array.isArray(u) || u.length < 2) return '';
    const partes = u.map((nombre, k) => `${k === 0 ? 'una' : 'otra'} para los ${nombre}`);
    return `: ${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
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
    // Con letras ('a'), cada una vale su numero y tiene que ir entre comillas simples.
    const deLetras = valores.some(esLetra);
    const esperados = valores.map((x) => (esLetra(x) ? x.codePointAt(0) : x));
    const coincide = (e, valor) => e.clase === (deLetras ? 'caracter' : 'numero') && e.valor === valor;

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
      const decimal = deLetras ? undefined : valores.find((x) => !Number.isInteger(x));
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
    const distinto = esperados.findIndex((valor, i) =>
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
      const numeros = escritos.map((x) => (x.clase === (deLetras ? 'caracter' : 'numero') ? x.valor : NaN));
      const ordenar = (lista) => [...lista].sort((a, b) => a - b).join();
      if (deLetras && e.clase !== 'caracter') {
        const letra = `'${valores[distinto]}'`;
        if (e.clase === 'cadena') {
          error(
            'LETRA_ENTRE_COMILLAS_DOBLES',
            `\`${e.texto.trim()}\` entre comillas dobles es un texto, no una letra: una sola letra va entre comillas simples, como \`${letra}\`.`,
            v.fila
          );
        } else if (e.clase === 'numero') {
          error(
            'LETRA_ES_NUMERO',
            `\`${e.texto.trim()}\` es un número, no una letra: cada letra va entre comillas simples, como \`${letra}\`.`,
            v.fila
          );
        } else {
          error(
            'LETRA_SIN_COMILLAS',
            `\`${e.texto.trim()}\` sin comillas se lee como el nombre de una variable: cada letra va entre comillas simples, como \`${letra}\`.`,
            v.fila
          );
        }
      } else if (!deLetras && (e.clase === 'caracter' || e.clase === 'cadena')) {
        error(
          'VALOR_ENTRE_COMILLAS',
          `\`${e.texto}\` con comillas no es un número: los números van sin comillas.`,
          v.fila
        );
      } else if (
        escritos.length === valores.length &&
        !numeros.some(Number.isNaN) &&
        ordenar(numeros) === ordenar(esperados)
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
  // El campo ("alumno.promedio") en la definicion de su estructura, o null.
  function campoDeEstructura(esperado, modelo) {
    const [base, nombreDelCampo] = esperado.split('.');
    const sinIndice = base.replace(/\s*\[[\s\S]*$/, '');
    const variable = modelo.variables.findLast((v) => v.nombre === sinIndice);
    const def = variable && estructuraDeVariable(variable, modelo, sinIndice !== base);
    return (def && def.campos.find((c) => c.nombre === nombreDelCampo)) || null;
  }
  function esCampo(e) {
    return /^[A-Za-z_]\w*(?:\s*\[[^\]]*\])*\.[A-Za-z_]\w*$/.test(e);
  }
  function esIndexado(e) {
    return /^[A-Za-z_]\w*\s*(\[[^\]]*\]\s*)+$/.test(e);
  }
  function sinEspacios(t) {
    return t.replace(/\s+/g, '');
  }

  function diagnosticarArgumento(llamada, i, esperado, real, modelo) {
    // Un numero escrito en la llamada: no una variable ni otro numero.
    if (/^-?\d+(\.\d+)?$/.test(esperado) && real) {
      error(
        'ARGUMENTO_NUMERO',
        real.clase === 'nombre'
          ? `La consigna pide pasar el número \`${esperado}\` escrito directamente en la llamada: \`${real.texto}\` es una variable, y acá no hay que usar ninguna.`
          : `El argumento de \`${llamada.funcion}\` es \`${real.texto}\`, y la consigna pide el número \`${esperado}\` escrito directamente en la llamada.`,
        llamada.fila
      );
      return;
    }
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

    if (esCampo(esperado)) {
      const [base, campo] = esperado.split('.');
      const sinIndice = base.replace(/\s*\[[\s\S]*$/, '');
      const variable = modelo.variables.findLast((v) => v.nombre === sinIndice);
      const def = variable ? estructuraDeVariable(variable, modelo, sinIndice !== base) : null;
      const problema = problemaDeCampo(real, base, def, modelo);
      if (problema) {
        error(problema[0], problema[1], llamada.fila);
      } else if (real.clase === 'direccion' && real.nombre === esperado) {
        error(
          'ARGUMENTO_CON_AMPERSAND',
          `A \`${esperado}\` le sobra el \`&\`: una cadena se pasa con su nombre solo.`,
          llamada.fila
        );
      } else if (real.clase === 'nombre' && real.nombre === sinIndice) {
        error(
          'ARGUMENTO_SIN_CAMPO',
          `\`${real.nombre}\` es la variable completa, con todos sus campos: para guardar en uno solo hay que indicar cuál, con un punto: \`${esperado}\`.`,
          llamada.fila
        );
      } else if (real.clase === 'campo' && sinEspacios(real.variable) === sinEspacios(base)) {
        error(
          'ARGUMENTO_OTRO_CAMPO',
          `Lo que pide la consigna va en el campo \`${campo}\`, y acá se usa \`${real.texto}\`.`,
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

    if (esperado.startsWith('&') && real.clase === 'nombre' && real.nombre === esperado.slice(1)) {
      error(
        'LLAMADA_SIN_AMPERSAND',
        `Para que la función modifique ${BT}${real.nombre}${BT} hay que pasarle la variable misma, con ${BT}&${BT} adelante: ${BT}${esperado}${BT}. ${FORMULA_REFERENCIA}`,
        llamada.fila
      );
    } else if (esperado.startsWith('&') && real.clase === 'direccion' && !modelo.variables.some((v) => v.nombre === real.nombre)) {
      error('VARIABLE_DESCONOCIDA', `No hay ninguna variable llamada ${BT}${real.nombre}${BT}.`, llamada.fila);
    } else if (real.clase === 'cadena' && real.contenido === esperado) {
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
    const aceptadas = [valorDe(regla.funcion), ...(regla.alternativas || [])];
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
          // En una serie de la biblioteca, la consigna pide la funcion: a mano no vale.
          if (regla.aMano.prohibida) {
            error(
              'A_MANO',
              'Guardarlo carácter por carácter puede funcionar, pero la consigna pide usar una función de la biblioteca de cadenas.',
              propias[0].fila
            );
            return;
          }
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
          (v.clase === 'campo' && (campoDeEstructura(`${v.variable}.${v.campo}`, modelo)?.arreglo.length ?? 0) > 0) ||
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
        `\`${llamada.funcion}\` lleva ${esperados.length} ${esperados.length === 1 ? 'argumento' : 'argumentos, separados por coma'}, y acá hay ${reales.length}.`,
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

  // ---- guardar un valor en una posicion de un arreglo -------------------------------

  // "notas[0] = 8;": en que posicion y que valor. "indice" es un numero (o una
  // cuenta con constantes: MAX - 1); "valor" es un numero, o el texto de otra
  // posicion ("notas[0]"). Con "ultimo": true, escribir el numero suelto vale
  // con la mejora de usar la constante.
  function reglaAsigna(regla, modelo) {
    const nombre = valorDe(regla.variable);
    const variable = modelo.variables.findLast((v) => v.nombre === nombre);
    const pedida = `${nombre}[${regla.indice}]`;

    // Si ya se le dijo que un arreglo no se asigna completo con "=", alcanza.
    if (diagnosticos.some((d) => CODIGOS_DE_ASIGNACION.includes(d.codigo))) return;

    const propias = modelo.asignaciones.filter(
      (a) =>
        a.nuevo &&
        a.operador === '=' &&
        a.izquierda.clase === 'indice' &&
        a.izquierda.nombre === nombre &&
        a.izquierda.indices.length === 1
    );
    // La consigna puede pedir varias posiciones (una regla por cada una): una
    // asignacion que es de otra de ellas no cuenta como "la posicion equivocada".
    const posicionDe = (a) => valorDeDimension(a.izquierda.indices[0], modelo);
    const deLasOtras = consigna.requiere
      .filter((r) => r.asigna && r.asigna !== regla && valorDe(r.asigna.variable) === nombre)
      .map((r) => r.asigna.indice);
    const exacta = propias.find((x) => posicionDe(x) === regla.indice);
    const libres = propias.filter((x) => !deLasOtras.includes(posicionDe(x)));
    if (!exacta && !libres.length) {
      // "==" pregunta si son iguales: no guarda nada.
      const igual = modelo.comparaciones.find(
        (c) => c.nuevo && !c.enIf && c.izquierda.clase === 'indice' && c.izquierda.nombre === nombre
      );
      if (igual) {
        error(
          'ASIGNACION_CON_IGUAL_DOBLE',
          `\`==\` pregunta si dos valores son iguales y no guarda nada: para guardar un valor en \`${igual.izquierda.texto}\` se usa un solo \`=\`.`,
          igual.fila
        );
      } else if (propias.length) {
        error('ASIGNACION_FALTA_POSICION', 'Falta guardar un valor en una de las posiciones que pide la consigna.');
      } else {
        error(
          'ASIGNACION_FALTA',
          `No encontré la asignación de un valor a una posición de \`${nombre}\`: se escribe el nombre, el índice entre corchetes, \`=\` y el valor.`
        );
      }
      return;
    }

    // Copiar al reves: la posicion de origen a la izquierda y la de destino a la
    // derecha. Se mira antes que la posicion, porque es lo primero que esta mal.
    if (typeof regla.valor === 'string') {
      const origen = sinEspacios(valorDe(regla.valor));
      const alReves = propias.find(
        (x) => sinEspacios(x.izquierda.texto) === origen && sinEspacios(x.derecha.texto) === sinEspacios(pedida)
      );
      if (alReves) {
        error(
          'ASIGNACION_AL_REVES',
          `Está al revés: a la izquierda del \`=\` va la posición donde se guarda (\`${pedida}\`) y a la derecha, de donde se toma el valor.`,
          alReves.fila
        );
        return;
      }
    }

    const a = exacta || libres[0];
    const posicion = posicionDe(a);
    const tamano = variable ? valorDeDimension(variable.arreglo[0] ?? '', modelo) : null;

    if (posicion != null && tamano != null && posicion >= tamano) {
      // Con el numero escrito ya lo dijo la revision general.
      if (!diagnosticos.some((d) => d.codigo === 'INDICE_FUERA_DE_RANGO')) {
        error(
          'INDICE_FUERA_DE_RANGO',
          `\`${nombre}\` tiene ${tamano} posiciones, numeradas de 0 a ${tamano - 1}: la posición ${posicion} no existe.`,
          a.fila
        );
      }
      return;
    }
    if (posicion !== regla.indice) {
      const [codigo, mensaje] = distintaPosicion(a.izquierda, pedida, modelo);
      error(codigo, mensaje, a.fila);
      return;
    }

    // El valor: un numero, o lo que hay en otra posicion.
    const derecha = a.derecha;
    const esperado = typeof regla.valor === 'number' ? null : sinEspacios(valorDe(regla.valor));
    const bien =
      esperado == null
        ? derecha.clase === 'numero' && derecha.valor === regla.valor
        : sinEspacios(derecha.texto) === esperado;
    if (!bien) {
      error(
        'ASIGNACION_VALOR_DISTINTO',
        `El valor que se guarda en \`${a.izquierda.texto}\` no es el que pide la consigna.`,
        a.fila
      );
      return;
    }

    // Con el numero suelto, el ultimo deja de serlo si cambia la cantidad.
    const dimension = variable ? (variable.arreglo[0] ?? '').trim() : '';
    if (
      regla.ultimo &&
      practicas.includes('constantes') &&
      /^[\d\s+\-*/()]+$/.test(a.izquierda.indices[0]) &&
      /^[A-Za-z_]\w*$/.test(dimension)
    ) {
      mejora(
        'ULTIMO_CON_NUMERO_SUELTO',
        `Está bien, pero el ${posicion} solo es la última posición mientras \`${dimension}\` valga ${tamano}: con \`${dimension} - 1\` sigue siéndolo aunque cambie la cantidad.`,
        a.fila
      );
    }
  }

  // ---- guardar un valor en un campo de una variable --------------------------------

  // "alumno.legajo = 20431;": los valores son los que muestra la ficha de la
  // consigna (su "ejemplo"), asi que lo que se ve es lo que se corrige.
  //   { "campo": { "variable": "alumno",
  //                "campos": [{ "nombre": "legajo", "tipo": "entero" }] } }
  // "tipo" es "entero", "real" o "letra". Un texto se guarda con una "llamada"
  // (strcpy(alumno.apellidoNombre, "...")).
  function reglaCampo(regla, modelo) {
    const nombre = valorDe(regla.variable);
    // Una variable, un elemento de un arreglo ("alumnos[0]") o una estructura
    // de adentro ("alumno.nacimiento").
    const def = estructuraDeCamino(nombre, modelo);
    if (!def) {
      error('VARIABLE_FALTA', `No encontré la variable \`${nombre}\`.`);
      return;
    }

    const asignaciones = modelo.asignaciones.filter((a) => a.nuevo && a.operador === '=');
    // Lo primero es llegar bien al campo: la variable, el punto y el nombre.
    for (const a of asignaciones) {
      const problema = problemaDeCampo(a.izquierda, nombre, def, modelo);
      if (problema) {
        // La revision general ya pudo haberlo dicho.
        if (!diagnosticos.some((d) => d.codigo === problema[0])) error(problema[0], problema[1], a.fila);
        return;
      }
    }

    const deLaVariable = (v, campo) =>
      v.clase === 'campo' && sinEspacios(v.variable) === sinEspacios(nombre) && v.campo === campo;

    // "soloEsos": la consigna es cerrada, y guardar otro campo de la estructura
    // (de la variable, o de cualquier parte de ella si no es un elemento de un
    // arreglo) es hacer algo que no se pidio.
    // Con un solo campo sin guardar y uno solo de mas, de la misma estructura:
    // seguramente es el que quiso escribir.
    let pista = null;
    if (regla.soloEsos) {
      const dicha = sinEspacios(nombre);
      const delMismo = modelo.asignaciones
        .filter((a) => a.nuevo && a.izquierda.clase === 'campo' && sinEspacios(a.izquierda.variable) === dicha)
        .map((a) => a.izquierda.campo);
      const sobran = [...new Set(delMismo.filter((c) => !regla.campos.some((p) => p.nombre === c)))];
      const faltan = regla.campos.filter((p) => !delMismo.includes(p.nombre));
      if (faltan.length === 1 && sobran.length === 1) pista = { guardo: `${dicha}.${sobran[0]}` };
      const ambito = dicha.includes('[') ? dicha : dicha.split('.')[0];
      const pedidos = regla.campos.map((c) => `${dicha}.${c.nombre}`);
      // Solo cuando lo pedido ya esta guardado: si falta un campo, eso es lo que
      // importa, y una cadena asignada con "=" ya tiene su error.
      const estanTodos = pedidos.every((p) =>
        asignaciones.some((a) => a.izquierda.clase === 'campo' && `${sinEspacios(a.izquierda.variable)}.${a.izquierda.campo}` === p)
      );
      const deMas = !estanTodos || diagnosticos.some((d) => d.codigo === 'ASIGNACION_DE_ARREGLO') ? null : modelo.asignaciones.find((a) => {
        if (!a.nuevo || a.izquierda.clase !== 'campo') return false;
        const camino = `${sinEspacios(a.izquierda.variable)}.${a.izquierda.campo}`;
        return camino.startsWith(`${ambito}.`) && !pedidos.includes(camino);
      });
      if (deMas) {
        const camino = `${sinEspacios(deMas.izquierda.variable)}.${deMas.izquierda.campo}`;
        const lista = enLista(pedidos);
        error(
          'CAMPO_NO_PEDIDO',
          `La consigna pide guardar solo ${lista}, y el programa también guarda en \`${camino}\`. Quite esa asignación.`,
          deMas.fila
        );
      }
    }

    for (const pedido of regla.campos) {
      const guardadas = asignaciones.filter((a) => deLaVariable(a.izquierda, pedido.nombre));
      const a = guardadas[guardadas.length - 1];
      const lugar = `${nombre}.${pedido.nombre}`;
      if (!a) {
        const igual = modelo.comparaciones.find(
          (c) => c.nuevo && !c.enIf && deLaVariable(c.izquierda, pedido.nombre)
        );
        if (igual) {
          error(
            'ASIGNACION_CON_IGUAL_DOBLE',
            `\`==\` pregunta si dos valores son iguales y no guarda nada: para guardar un valor en \`${lugar}\` se usa un solo \`=\`.`,
            igual.fila
          );
        } else {
          error(
            'CAMPO_SIN_CARGAR',
            `No encontré dónde se guarda el valor de \`${pedido.nombre}\`: se escribe la variable, un punto, el nombre del campo, \`=\` y el valor.` +
              (pista ? ` El programa guarda en \`${pista.guardo}\`, pero la consigna pide \`${lugar}\`.` : '')
          );
        }
        continue;
      }

      const derecha = a.derecha;
      // El valor sale de la ficha de esa variable (alumnos[1]) o, si no hay, de cualquiera.
      const fichas = fichasDe(consigna);
      const deEsaVariable = fichas.filter((f) => f.titulo && sinEspacios(f.titulo) === sinEspacios(nombre));
      // Los campos de adentro de otra estructura llevan su camino: nacimiento.anio.
      const aplanados = (campos, prefijo = '') =>
        campos.flatMap((c) =>
          c.campos ? aplanados(c.campos, `${prefijo}${c.nombre}.`) : [{ ruta: `${prefijo}${c.nombre}`, nombre: c.nombre, ejemplo: c.ejemplo }]
        );
      const dentro = sinEspacios(nombre).replace(/^[A-Za-z_]\w*(?:\[[^\]]*\])*\.?/, '');
      const ruta = dentro ? `${dentro}.${pedido.nombre}` : pedido.nombre;
      const candidatos = (deEsaVariable.length ? deEsaVariable : fichas).flatMap((f) => aplanados(f.campos));
      const ejemplo = (
        candidatos.find((c) => c.ruta === ruta && c.ejemplo != null) ||
        candidatos.find((c) => c.nombre === pedido.nombre && c.ejemplo != null)
      )?.ejemplo ?? pedido.valor;
      // Sin ficha (una union no tiene), el valor lo trae la regla: "valor".
      const deDonde = fichas.length ? 'el que muestra la ficha' : 'el que pide la consigna';
      if (pedido.tipo === 'enumerado') {
        // Con el nombre, o con su numero (esto ultimo se avisa como mejora aparte).
        const buscado = modelo.enums.flatMap((e) => e.enumeradores).find((x) => x.nombre === String(ejemplo));
        const escrita = derecha.texto.trim();
        if (derecha.clase === 'nombre' && derecha.nombre === String(ejemplo)) continue;
        if (derecha.clase === 'numero' && buscado && buscado.valor === derecha.valor) continue;
        if (derecha.clase === 'caracter' || derecha.clase === 'cadena') {
          error(
            'ENUM_COMO_TEXTO',
            `\`${escrita}\` entre comillas es un texto o una letra: los nombres de un enumerado se escriben sin comillas, como \`${ejemplo}\`.`,
            a.fila
          );
        } else {
          error('ASIGNACION_VALOR_DISTINTO', `El valor que se guarda en \`${lugar}\` no es ${deDonde}.`, a.fila);
        }
        continue;
      }
      if (pedido.tipo === 'letra') {
        const letra = [...String(ejemplo)][0];
        if (derecha.clase === 'caracter' && derecha.valor === letra.codePointAt(0)) continue;
        const escrita = derecha.texto.trim();
        if (derecha.clase === 'cadena') {
          error(
            'LETRA_ENTRE_COMILLAS_DOBLES',
            `\`${escrita}\` entre comillas dobles es un texto, no una letra: una sola letra va entre comillas simples, como \`'${letra}'\`.`,
            a.fila
          );
        } else if (derecha.clase === 'numero') {
          error(
            'LETRA_ES_NUMERO',
            `\`${escrita}\` es un número, no una letra: la letra va entre comillas simples, como \`'${letra}'\`.`,
            a.fila
          );
        } else if (derecha.clase === 'nombre') {
          error(
            'LETRA_SIN_COMILLAS',
            `\`${escrita}\` sin comillas se lee como el nombre de una variable: la letra va entre comillas simples, como \`'${letra}'\`.`,
            a.fila
          );
        } else {
          error('ASIGNACION_VALOR_DISTINTO', `El valor que se guarda en \`${lugar}\` no es ${deDonde}.`, a.fila);
        }
        continue;
      }

      if (derecha.clase === 'caracter' || derecha.clase === 'cadena') {
        error(
          'VALOR_ENTRE_COMILLAS',
          `\`${derecha.texto.trim()}\` con comillas no es un número: los números van sin comillas.`,
          a.fila
        );
      } else if (derecha.clase !== 'numero' || Math.abs(parseFloat(derecha.texto) - Number(ejemplo)) > 1e-9) {
        error('ASIGNACION_VALOR_DISTINTO', `El valor que se guarda en \`${lugar}\` no es ${deDonde}.`, a.fila);
      }
    }
  }

  // ---- leer y mostrar los campos de una variable de estructura ------------------

  // De que clase es un campo: "entero", "real", "letra" o "cadena" (null si es
  // otra cosa).
  function claseDeCampo(campo) {
    if (campo.punteros || campo.tipo.clase !== 'primitivo') return null;
    const nombre = campo.tipo.nombre;
    if (nombre === 'char') return campo.arreglo.length ? 'cadena' : 'letra';
    if (campo.arreglo.length) return null;
    if (/(^|\s)(float|double)$/.test(nombre)) return 'real';
    return /(^|\s)(int|short|long)$/.test(nombre) || nombre === 'unsigned' ? 'entero' : null;
  }

  // El campo que nombra un argumento: "alumno.legajo" o "&alumno.legajo", como
  // un valor de clase "campo" (o null si no lo es).
  function comoCampo(valor) {
    if (valor.clase === 'campo') return valor;
    if (valor.clase === 'direccion' && valor.campo) {
      const partes = /^([\s\S]+?)\s*(->|\.)\s*([A-Za-z_]\w*)$/.exec(valor.nombre);
      if (!partes) return null;
      return { clase: 'campo', variable: partes[1], campo: partes[3], operador: partes[2], texto: valor.nombre };
    }
    return null;
  }

  function formatoNoCorresponde(formato, lugar, campo, clase, fila) {
    error(
      'FORMATO_NO_CORRESPONDE_AL_TIPO',
      `\`${formato}\` es el formato de ${DE_QUE_FORMATO[formato.slice(-1)] || 'otro tipo de dato'}, y \`${lugar}\` es ${clase === 'cadena' ? 'una cadena' : `un \`${campo.tipo.nombre}\``}: el formato que le corresponde es \`${FORMATOS[clase].para}\`.`,
      fila
    );
  }

  // "scanf("%d", &alumno.legajo);": lee, con el formato del tipo del campo, en
  // un campo de la variable. El texto de un campo cadena se lee con la regla
  // "lee" (gets, fgets o scanf).
  //   { "leeCampo": { "variable": "alumno", "campo": "legajo" } }
  function reglaLeeCampo(regla, modelo) {
    // "alumnos[*]": un elemento cualquiera de un arreglo de estructuras (el que
    // marque el indice del ciclo).
    const crudo = valorDe(regla.variable);
    const porElemento = /^([A-Za-z_]\w*)\[\*\]$/.exec(crudo);
    const nombre = porElemento ? porElemento[1] : crudo;
    const esLaVariable = (v) =>
      porElemento ? new RegExp(`^${nombre}\\[[^\\]]*\\]$`).test(sinEspacios(v)) : v === nombre;
    const lugar = porElemento ? `${nombre}[i].${regla.campo}` : `${nombre}.${regla.campo}`;
    const variable = modelo.variables.findLast((v) => v.nombre === nombre);
    const def = variable ? estructuraDeVariable(variable, modelo, Boolean(porElemento)) : null;
    const campo = def && def.campos.find((c) => c.nombre === regla.campo);
    const clase = campo && claseDeCampo(campo);
    if (!clase || clase === 'cadena') {
      throw new Error(`La consigna "${consigna.id}" lee ${lugar}, que no es un número ni una letra.`);
    }

    // Si ya se dijo que el arreglo va con su indice, con eso alcanza.
    if (diagnosticos.some((d) => d.codigo === 'ARREGLO_SIN_INDICE')) return;

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

    // Llegar bien al campo: la variable, el punto y el nombre.
    for (const l of lecturas) {
      const destino = destinoDeLectura(l);
      const dicho = destino && comoCampo(destino);
      // &legajo: el campo solo, sin la variable.
      const solo =
        destino && destino.clase === 'direccion' && !destino.campo
          ? { clase: 'nombre', nombre: destino.nombre, texto: destino.nombre }
          : null;
      const delElemento = porElemento && dicho && esLaVariable(dicho.variable);
      const verificado = delElemento ? { ...dicho, variable: nombre } : dicho;
      const problema =
        (verificado && problemaDeCampo(verificado, nombre, def, modelo)) ||
        (solo && problemaDeCampo(solo, nombre, def, modelo)) ||
        (destino && destino.clase !== 'campo' && problemaDeCampo(destino, nombre, def, modelo));
      if (problema) {
        error(problema[0], problema[1], l.fila);
        return;
      }
    }

    const apunta = (l) => {
      const destino = destinoDeLectura(l);
      const dicho = destino && comoCampo(destino);
      return Boolean(dicho && esLaVariable(dicho.variable) && dicho.campo === regla.campo);
    };
    const l = lecturas.find((x) => x.funcion === 'scanf' && apunta(x));
    if (!l) {
      const otra = lecturas.find((x) => {
        const d = destinoDeLectura(x);
        const dicho = d && comoCampo(d);
        return dicho && esLaVariable(dicho.variable);
      });
      if (otra) {
        error(
          'LECTURA_OTRO_CAMPO',
          `Lo que pide la consigna se guarda en \`${lugar}\`, y acá se lee en \`${comoCampo(destinoDeLectura(otra)).texto}\`.`,
          otra.fila
        );
      } else if (lecturas.some((x) => x.funcion !== 'scanf')) {
        const x = lecturas.find((y) => y.funcion !== 'scanf');
        error('FUNCION_EQUIVOCADA', `\`${x.funcion}\` lee un texto: para leer \`${lugar}\` se usa \`scanf\`.`, x.fila);
      } else {
        error(
          'LECTURA_OTRO_CAMPO',
          `No encontré la lectura de \`${lugar}\`: \`scanf\` lleva el formato y, separada con una coma, la dirección del campo donde se guarda.`,
          lecturas[0].fila
        );
      }
      return;
    }

    // El formato: uno solo, el de su tipo.
    if (l.argumentos.length !== 2) {
      error(
        'ARGUMENTOS_CANTIDAD',
        '`scanf` lleva el formato y, separada con una coma, la variable donde se guarda lo que se lee.',
        l.fila
      );
      return;
    }
    const formatoReal = l.argumentos[0];
    const m = formatoReal.clase === 'cadena' ? /^(\s*)%(\*?)(\d*)(l?)([a-zA-Z])\s*$/.exec(formatoReal.contenido) : null;
    if (!m) {
      error(
        'FORMATO_NO_CORRESPONDE_AL_TIPO',
        `El formato de lectura de \`${lugar}\` es \`${FORMATOS[clase].para}\`: cada tipo de dato tiene el suyo.`,
        l.fila
      );
      return;
    }
    const letra = m[5];
    const formato = `%${m[4]}${letra}`;
    const esDouble = /double$/.test(campo.tipo.nombre);
    const correcto = clase === 'real' && esDouble ? m[4] === 'l' && letra === 'f' : FORMATOS[clase].buenos.includes(letra) && !m[4];
    if (!correcto) {
      const para = clase === 'real' && esDouble ? '%lf' : FORMATOS[clase].para;
      error(
        'FORMATO_NO_CORRESPONDE_AL_TIPO',
        `\`${formato}\` es el formato de ${DE_QUE_FORMATO[letra] || 'otro tipo de dato'}, y \`${lugar}\` es un \`${campo.tipo.nombre}\`: el formato que le corresponde es \`${para}\`.`,
        l.fila
      );
      return;
    }
    if (l.argumentos[1].clase === 'campo') {
      error('AMPERSAND_FALTA', `A \`${lugar}\` le falta el \`&\` adelante.`, l.fila);
      return;
    }

    // Una letra despues de un numero: el Enter que quedo sin leer.
    if (clase === 'letra' && m[1] === '') {
      const anterior = modelo.llamadas
        .filter((x) => LECTURAS.includes(x.funcion) && x.fin <= l.posicion)
        .pop();
      if (anterior && anterior.funcion === 'scanf') {
        // Vale descartarlo antes (el ciclo de siempre) o con el espacio en el formato.
        verificarLimpieza(l, anterior, modelo, () =>
          error(
            'LECTURA_LETRA_TOMA_EL_ENTER',
            'Después de leer con `scanf` queda el Enter sin leer, y `%c` lo toma como si fuera la letra escrita. Antes hay que descartarlo: con un espacio delante del `%c`, o con lo que descarta lo que quedó en la línea.',
            l.fila
          )
        );
      }
    }
  }

  // "printf("%d %s", alumno.legajo, alumno.apellidoNombre);": mostrar cada campo
  // con el formato de su tipo, en una o en varias llamadas.
  //   { "muestraCampos": { "variable": "alumno", "campos": ["legajo", "apellidoNombre"] } }
  function reglaMuestraCampos(regla, modelo) {
    const nombre = valorDe(regla.variable);
    const variable = modelo.variables.findLast((v) => v.nombre === nombre);
    const def = variable ? estructuraDeVariable(variable, modelo) : null;
    const salidas = modelo.llamadas.filter((l) => l.nuevo && MUESTRAS.includes(l.funcion));
    if (!salidas.length) {
      const otra = modelo.llamadas.find((l) => l.nuevo && !LECTURAS.includes(l.funcion));
      if (otra) {
        error('FUNCION_EQUIVOCADA', `\`${otra.funcion}\` no es la función que pide esta consigna.`, otra.fila);
      } else {
        error(
          'MUESTRA_FALTA',
          'No encontré la llamada que muestra los datos en pantalla. Una función se usa con su nombre y, entre paréntesis, sus argumentos: `funcion(a, b);`'
        );
      }
      return;
    }

    // Cada valor que se muestra, con el formato que le toca.
    const mostrados = [];
    for (const l of salidas) {
      if (l.funcion === 'puts') {
        if (l.argumentos[0]) mostrados.push({ valor: l.argumentos[0], letra: 's', formato: '%s', fila: l.fila });
        continue;
      }
      const formatoReal = l.argumentos[0];
      if (!formatoReal || formatoReal.clase !== 'cadena') {
        error(
          'PRINTF_SIN_FORMATO',
          'El primer argumento de `printf` es el formato: un texto entre comillas dobles, con una conversión (`%d`, `%f`, `%s`, `%c`) por cada valor que se muestra.',
          l.fila
        );
        return;
      }
      const convs = formatoReal.contenido.replace(/%%/g, '').match(/%[-+ #0]*\d*(?:\.\d+)?l?[a-zA-Z]/g) || [];
      if (convs.length !== l.argumentos.length - 1) {
        error(
          'FORMATO_CANTIDAD_DISTINTA',
          `El formato de \`printf\` tiene ${convs.length} ${convs.length === 1 ? 'conversión' : 'conversiones'} (lo que empieza con \`%\`) y se le pasa${l.argumentos.length - 1 === 1 ? '' : 'n'} ${l.argumentos.length - 1} ${l.argumentos.length - 1 === 1 ? 'valor' : 'valores'}: tiene que haber uno por cada una.`,
          l.fila
        );
        return;
      }
      convs.forEach((c, i) =>
        mostrados.push({ valor: l.argumentos[i + 1], letra: c.slice(-1), formato: c, fila: l.fila })
      );
    }

    for (const x of mostrados) {
      const v = x.valor;
      if (v.clase === 'direccion') {
        error(
          'AMPERSAND_DE_MAS',
          `\`printf\` muestra el valor que tiene la variable, no el lugar donde está: a \`${v.texto.replace(/^&\s*/, '')}\` le sobra el \`&\`.`,
          x.fila
        );
        return;
      }
      if (v.clase === 'nombre' && v.nombre === nombre) {
        error(
          'ARGUMENTO_SIN_CAMPO',
          `\`${nombre}\` es la variable completa, con todos sus campos: para mostrar un dato hay que indicar cuál, con un punto: \`${nombre}.${def?.campos[0]?.nombre || 'campo'}\`.`,
          x.fila
        );
        return;
      }
      const problema = problemaDeCampo(v, nombre, def, modelo);
      if (problema) {
        error(problema[0], problema[1], x.fila);
        return;
      }
    }

    for (const pedido of regla.campos) {
      const lugar = `${nombre}.${pedido}`;
      const campo = def && def.campos.find((c) => c.nombre === pedido);
      const clase = campo && claseDeCampo(campo);
      if (!clase) throw new Error(`La consigna "${consigna.id}" muestra ${lugar}, que no tiene un formato conocido.`);
      const x = mostrados.find((m) => m.valor.clase === 'campo' && m.valor.variable === nombre && m.valor.campo === pedido);
      if (!x) {
        error(
          'MUESTRA_CAMPO_FALTA',
          `No encontré dónde se muestra \`${lugar}\`: es un valor de \`printf\`, con el formato \`${FORMATOS[clase].para}\`.`
        );
        continue;
      }
      if (!FORMATOS[clase].buenos.includes(x.letra)) {
        formatoNoCorresponde(x.formato, lugar, campo, clase, x.fila);
      }
    }
  }

  // ---- copiar y comparar variables de estructura -------------------------------

  // "copia = alumno;": una estructura se copia entera con una asignacion, y se
  // lleva tambien las cadenas de adentro. Copiarla campo por campo es valido (con
  // strcpy en las cadenas) y, con la practica de claridad, tiene su mejora.
  //   { "copia": { "de": "alumno", "en": "copia" } }
  function reglaCopia(regla, modelo) {
    const origen = valorDe(regla.de);
    const destino = valorDe(regla.en);
    const asignaciones = modelo.asignaciones.filter((a) => a.nuevo && a.operador === '=');
    // Una variable o un camino (alumno.ingreso): por como esta escrito.
    const esNombre = (v, n) => ['nombre', 'campo'].includes(v.clase) && sinEspacios(v.texto) === sinEspacios(n);

    if (asignaciones.some((a) => esNombre(a.izquierda, destino) && esNombre(a.derecha, origen))) return;

    const alReves = asignaciones.find((a) => esNombre(a.izquierda, origen) && esNombre(a.derecha, destino));
    if (alReves) {
      error(
        'ASIGNACION_AL_REVES',
        `Está al revés: a la izquierda del \`=\` va la variable donde se guarda (\`${destino}\`) y a la derecha, de donde se toma el valor (\`${origen}\`).`,
        alReves.fila
      );
      return;
    }

    // Campo por campo: "copia.legajo = alumno.legajo;" o strcpy en una cadena.
    const deCampo = (v, variable, campo) => v && v.clase === 'campo' && v.variable === variable && v.campo === campo;
    const copiado = (campo) =>
      asignaciones.some((a) => deCampo(a.izquierda, destino, campo) && deCampo(a.derecha, origen, campo)) ||
      modelo.llamadas.some(
        (l) =>
          l.nuevo &&
          ['strcpy', 'strncpy'].includes(l.funcion) &&
          deCampo(l.argumentos[0], destino, campo) &&
          deCampo(l.argumentos[1], origen, campo)
      );
    const hay = asignaciones.some((a) => a.izquierda.clase === 'campo' && a.izquierda.variable === destino);
    if (hay) {
      // Una cadena asignada con "=" ya recibio su explicacion.
      if (diagnosticos.some((d) => CODIGOS_DE_ASIGNACION.includes(d.codigo))) return;
      const def = estructuraDeCamino(origen, modelo);
      const faltan = def ? def.campos.filter((c) => !copiado(c.nombre)) : [];
      if (faltan.length) {
        error(
          'COPIA_INCOMPLETA',
          `Falta copiar ${faltan.map((c) => '\`' + c.nombre + '\`').join(', ').replace(/, ([^,]*)$/, ' y $1')}: la copia tiene que quedar con todos los datos de \`${origen}\`.`,
          asignaciones.find((a) => a.izquierda.clase === 'campo' && a.izquierda.variable === destino).fila
        );
      } else if (practicas.includes('claridad')) {
        mejora(
          'COPIA_CAMPO_POR_CAMPO',
          `Está bien, pero una estructura se copia entera con una sola asignación: \`${destino} = ${origen};\`, que lleva también la cadena de adentro.`,
          asignaciones.find((a) => a.izquierda.clase === 'campo' && a.izquierda.variable === destino).fila
        );
      }
      return;
    }

    const funcion = modelo.llamadas.find((l) => l.nuevo && ['strcpy', 'strncpy', 'memcpy'].includes(l.funcion));
    if (funcion) {
      error(
        'FUNCION_EQUIVOCADA',
        `\`${funcion.funcion}\` copia el texto de una cadena: una estructura completa se copia con \`=\`.`,
        funcion.fila
      );
      return;
    }
    const igual = modelo.comparaciones.find(
      (c) => c.nuevo && !c.enIf && (esNombre(c.izquierda, destino) || esNombre(c.izquierda, origen))
    );
    if (igual) {
      error(
        'ASIGNACION_CON_IGUAL_DOBLE',
        '`==` pregunta si dos valores son iguales y no guarda nada: para copiar una variable en otra se usa un solo `=`.',
        igual.fila
      );
      return;
    }
    error(
      'COPIA_FALTA',
      `No encontré la asignación que copia \`${origen}\` en \`${destino}\`: a la izquierda del \`=\` va donde se guarda y a la derecha, de donde se toma.`
    );
  }

  // "if (alumno.legajo == copia.legajo)": la comparacion de dos campos, dentro
  // de un if. Las estructuras enteras no se comparan.
  //   { "compara": { "izquierda": "alumno.legajo", "derecha": "copia.legajo" } }
  function reglaCompara(regla, modelo) {
    const a = valorDe(regla.izquierda);
    const b = valorDe(regla.derecha);
    const es = (v, esperado) => v.clase === 'campo' && sinEspacios(v.texto) === sinEspacios(esperado);
    const comparaciones = modelo.comparaciones.filter((c) => c.nuevo && c.operador === '==');
    const dePedidos = (c) => (es(c.izquierda, a) && es(c.derecha, b)) || (es(c.izquierda, b) && es(c.derecha, a));

    const buena = comparaciones.find((c) => dePedidos(c));
    if (buena) {
      if (!buena.enIf) {
        error('COMPARACION_FUERA_DEL_IF', 'La comparación tiene que estar en la condición de un `if`.', buena.fila);
      }
      return;
    }

    const base = (e) => e.split('.')[0];
    const enteras = comparaciones.find(
      (c) =>
        c.izquierda.clase === 'nombre' &&
        c.derecha.clase === 'nombre' &&
        [base(a), base(b)].includes(c.izquierda.nombre) &&
        [base(a), base(b)].includes(c.derecha.nombre)
    );
    if (enteras) {
      error(
        'COMPARA_ESTRUCTURAS',
        'Las estructuras no se comparan enteras con `==`: se comparan los datos de a uno, indicando el campo de cada variable.',
        enteras.fila
      );
      return;
    }
    // (ya dicho por la revision de condiciones)
    if (diagnosticos.some((x) => x.codigo === 'ASIGNACION_EN_CONDICION')) return;
    const conUno = modelo.ifs.find((i) => i.nuevo && /[^=!<>]=[^=]/.test(i.condicion));
    if (conUno) {
      error(
        'ASIGNACION_EN_CONDICION',
        'En la condición de un `if`, un solo `=` guarda un valor y no compara: para preguntar si son iguales se usa `==`.',
        conUno.fila
      );
      return;
    }
    const otros = comparaciones.find((c) => c.izquierda.clase === 'campo' || c.derecha.clase === 'campo');
    if (otros) {
      error(
        'COMPARA_OTRO_CAMPO',
        `La consigna pide comparar \`${a}\` con \`${b}\`, y acá se compara \`${otros.izquierda.texto}\` con \`${otros.derecha.texto}\`.`,
        otros.fila
      );
      return;
    }
    error(
      'COMPARACION_FALTA',
      `No encontré la comparación de \`${a}\` con \`${b}\`: se escribe dentro de un \`if\`, con \`==\` entre los dos.`
    );
  }

  // ---- el resultado de un ciclo: se sigue lo que hace -------------------------------

  // "valores" son los que tiene que tener el arreglo al final: un numero (todos
  // iguales), una formula con el indice ("i * i") o la lista completa. Se
  // corrige siguiendo el codigo (ver simulador.js), asi que vale cualquier
  // forma de escribirlo que llegue al mismo resultado.
  //   { "resultado": { "variable": "notas", "valores": "i * 2", "conCiclo": true,
  //                    "orden": "atras", "limite": true } }
  function reglaResultado(regla, modelo) {
    const nombre = valorDe(regla.variable);
    if (regla.conCiclo && !modelo.ciclos.some((c) => c.nuevo)) {
      error('CICLO_FALTA', 'La consigna pide un ciclo: una sentencia que se repite, como `for` o `while`.');
      return;
    }

    if (bibliotecaFalta(modelo)) return;
    const corrida = correrCodigo(modelo, null);
    if (!corrida) return;

    const variable = corrida.variables.get(nombre);
    if (!variable || !variable.dims) {
      error('RESULTADO_FALTA', `No encontré el arreglo \`${nombre}\`.`);
      return;
    }
    const pedido = (k) => {
      if (Array.isArray(regla.valores)) return regla.valores[k];
      if (typeof regla.valores === 'number') return regla.valores;
      return valorConEntorno(regla.valores, new Map([['i', k]]), modelo);
    };
    for (let k = 0; k < variable.datos.length; k++) {
      const tiene = variable.datos[k];
      const debe = pedido(k);
      if (tiene === undefined) {
        error(
          'RESULTADO_POSICION_SIN_VALOR',
          `\`${nombre}[${k}]\` no llega a recibir un valor: el ciclo no recorre todas las posiciones del arreglo.`
        );
        return;
      }
      if (Math.abs(tiene - debe) > 1e-9) {
        error(
          'RESULTADO_VALOR_DISTINTO',
          `\`${nombre}[${k}]\` termina valiendo \`${tiene}\`, y la consigna pide \`${debe}\`.`
        );
        return;
      }
    }

    // El sentido en que se recorre: las posiciones, en el orden en que se escribieron.
    if (regla.orden === 'atras') {
      const orden = corrida.escrituras
        .filter((x) => x.nombre === nombre && x.indices.length === 1)
        .map((x) => x.indices[0]);
      if (!orden.every((p, k) => k === 0 || p < orden[k - 1])) {
        error(
          'RECORRIDO_EN_OTRO_SENTIDO',
          'La consigna pide recorrer el arreglo de la última posición a la primera.'
        );
        return;
      }
    }

    notasYMejoras(regla, modelo);
  }

  // Una funcion de una biblioteca que no se agrego: no compilaria.
  function bibliotecaFalta(modelo) {
    for (const llamada of modelo.llamadas.filter((l) => l.nuevo && l.funcion in BIBLIOTECA_DE)) {
      const archivo = BIBLIOTECA_DE[llamada.funcion];
      if (!modelo.includes.some((i) => i.sistema && i.ruta === archivo)) {
        error(
          'INCLUDE_FALTA_PARA_FUNCION',
          `\`${llamada.funcion}\` es una función de la biblioteca \`${archivo}\`: para usarla hay que agregar \`#include <${archivo}>\`.`,
          llamada.fila
        );
        return true;
      }
    }
    return false;
  }

  // Sigue el codigo con la entrada dada (los datos que "escribe el usuario").
  // Si algo impide seguirlo lo dice y devuelve null.
  // "opciones": "contexto" (el "Con `cantidad` valiendo `0`" del caso, para los
  // mensajes) y "centinela" (el dato que marca el final de lo que se lee).
  function correrCodigo(modelo, entrada, prueba = null, opciones = {}) {
    const constante = (n) => {
      const c = modelo.constantes.find((x) => x.nombre === n);
      return c ? valorDeDimension(c.valor, modelo) : null;
    };
    // Con valores de prueba, los mensajes dicen con cuales fallo.
    const conContexto = opciones.contexto ? `${opciones.contexto}, ` : '';
    // Si ya hay un error en lo escrito, no se sigue el codigo: el alumno
    // arregla eso primero, y un "no pude verificarlo" encima seria ruido.
    if (diagnosticos.some((d) => d.nivel === 'error')) return null;
    // Para probar una funcion suelta se agrega una funcion que la llama con los
    // datos del caso, y por esa se empieza (__prueba).
    let propio = null;
    if (opciones.llama) {
      try {
        propio = analizador.parse(fuente + '\n\n' + armarLlamada(modelo, opciones.llama, prueba, opciones.antes));
      } catch (e) {
        throw new Error(`La consigna "${consigna.id}" tiene una llamada que no se puede armar: ${e.message}`);
      }
    }
    // Para el simulador, un texto de prueba son los codigos de sus letras y un 0 al final.
    const pruebaSimulada = prueba
      ? Object.fromEntries(
          Object.entries(prueba).map(([k, v]) => [k, typeof v === 'string' ? [...v].map((c) => c.codePointAt(0)).concat(0) : v])
        )
      : prueba;
    try {
      return ejecutar(propio || arbol, constante, entrada, pruebaSimulada, modelo.desde);
    } catch (e) {
      if (e instanceof FueraDeRango) {
        // Con el numero escrito ya lo dijo la revision general.
        if (!diagnosticos.some((d) => d.codigo === 'INDICE_FUERA_DE_RANGO')) {
          // En una tabla, el primer indice cuenta filas y el segundo columnas.
          const [singular, plural] =
            e.dimensiones !== 2 ? ['posición', 'posiciones'] : e.dimension === 0 ? ['fila', 'filas'] : ['columna', 'columnas'];
          error(
            'INDICE_FUERA_DE_RANGO',
            `${conContexto}\`${arregloDe(e.nombre)}\` tiene ${e.tamano} ${plural}, numeradas de 0 a ${e.tamano - 1}${e.escrito ? ': ' : ', y '}${e.escrito ? `la ${singular} ${e.indice} no existe.` : `el ciclo llega hasta la ${singular} ${e.indice}, que no existe.`}`,
            e.fila
          );
        }
      } else if (e instanceof MiembroNoVigente) {
        error(
          'UNION_MIEMBRO_NO_VIGENTE',
          `${conContexto}\`${e.texto}\` no tiene el valor: en una unión todos los miembros comparten el mismo lugar, y lo último que se guardó fue en \`${e.vigente}\`. Solo se puede leer el miembro en el que se guardó el valor.`,
          e.fila
        );
      } else if (e instanceof SinValor) {
        error(
          'VARIABLE_SIN_VALOR',
          `${conContexto}\`${comoLoEscribio(e.nombre)}\` todavía no tiene un valor cuando se usa: hay que dárselo antes.`,
          e.fila
        );
      } else if (e instanceof NoTermina) {
        error(
          'CICLO_NO_TERMINA',
          `${opciones.contexto ? `${opciones.contexto}, el` : 'El'} ciclo no termina: la condición siempre se cumple. Revise que el índice avance hacia el final.`,
          e.fila
        );
      } else if (e instanceof NombreDesconocido) {
        const declarados = [...modelo.constantes.map((c) => c.nombre), ...modelo.variables.map((v) => v.nombre)];
        // Declarada mas arriba, pero en un lugar que ya no existe: otra funcion o
        // un bloque que termino. (Usada antes de declararla es otro caso.)
        const lejana = e.indice != null && modelo.variables.find((v) => v.nombre === e.nombre && v.local && v.indice < e.indice);
        if (lejana) {
          const duena = modelo.funciones.find((f) => !f.prototipo && f.posicion <= lejana.indice && lejana.indice < f.fin);
          const usadaEn = modelo.funciones.find((f) => !f.prototipo && f.posicion <= e.indice && e.indice < f.fin);
          error(
            'NOMBRE_FUERA_DE_ALCANCE',
            duena && usadaEn && duena !== usadaEn
              ? `${conContexto}\`${e.nombre}\` está declarada dentro de \`${duena.nombre}\`: es una variable local de esa función y las demás no la ven. Cada función tiene las suyas; lo que otra necesita le llega por parámetros, y lo que calcula sale con \`return\`.`
              : `${conContexto}\`${e.nombre}\` se declaró entre llaves (un \`if\`, un ciclo) y desaparece cuando el bloque termina: acá ya no existe. Para usarla después, hay que declararla antes del bloque.`,
            e.fila
          );
        } else if (e.indice != null && modelo.variables.some((v) => v.nombre === e.nombre && v.local && v.indice > e.indice)) {
          error(
            'NOMBRE_USADO_ANTES',
            `${conContexto}\`${e.nombre}\` se usa antes de declararla: la declaración tiene que estar más arriba que el primer uso.`,
            e.fila
          );
        } else if (declarados.includes(e.nombre)) {
          // Esta declarado, pero no sabemos su valor: no es un error del alumno.
          aviso('EJECUCION_NO_VERIFICADA', 'No pude seguir este código para comprobarlo. Verifique que haga lo que pide la consigna.');
        } else {
          const parecido = declarados
            .map((nombre) => ({ nombre, d: distancia(e.nombre.toLowerCase(), nombre.toLowerCase()) }))
            .filter((x) => x.d <= Math.max(1, Math.floor(e.nombre.length / 4)))
            .sort((x, y) => x.d - y.d)[0];
          error(
            'NOMBRE_NO_DECLARADO',
            parecido
              ? `${conContexto}\`${e.nombre}\` no está declarado. ¿Quiso decir \`${parecido.nombre}\`?`
              : `${conContexto}\`${e.nombre}\` no está declarado: hay que declararlo antes de usarlo.`,
            e.fila
          );
        }
      } else if (e instanceof EstructuraEntera) {
        error(
          'CAMPO_ES_UNA_ESTRUCTURA',
          e.esUnion
            ? `\`${e.texto}\` es una unión entera, con varios miembros que comparten un lugar: no es un número. Para usarla hay que elegir uno de sus miembros, el que tiene el valor.`
            : `\`${e.texto}\` es una estructura entera, con varios campos adentro: no es un número. Para usarla en una cuenta hay que elegir uno de sus campos.`,
          e.fila
        );
      } else if (e instanceof TextoComoLetra) {
        const contenido = e.texto.slice(1, -1);
        // Si la revision general ya lo dijo, no se repite.
        if (!diagnosticos.some((d) => d.codigo === 'ELEMENTO_ENTRE_COMILLAS_DOBLES')) error(
          'LETRA_ENTRE_COMILLAS_DOBLES',
          `${conContexto}\`${e.texto}\` entre comillas dobles es un texto, no una letra: una sola letra va entre comillas simples` +
            ([...contenido].length === 1 ? `, como \`'${contenido}'\`.` : '.'),
          e.fila
        );
      } else if (e instanceof DivisionPorCero) {
        error(
          'DIVISION_POR_CERO',
          `${opciones.contexto ? `${opciones.contexto}, el` : 'El'} programa divide por \`0\`: esa división no se puede calcular. Hay que controlar antes que el divisor no sea cero.`,
          e.fila
        );
      } else if (e instanceof SinEntrada) {
        error(
          'LECTURA_DE_MAS',
          opciones.centinela !== undefined
            ? `El programa sigue pidiendo datos después de leer el \`${opciones.centinela}\` que marca el final, o con el arreglo ya lleno: tiene que dejar de leer.`
            : `El programa intenta leer más datos de los que se escriben: la consigna dice que son ${entrada.length}.`,
          e.fila
        );
      } else if (e instanceof AmpersandFalta) {
        error(
          'AMPERSAND_FALTA',
          `A \`${e.texto}\` le falta el \`&\` adelante.`,
          e.fila
        );
      } else if (e instanceof AmpersandDeMas) {
        error(
          'AMPERSAND_DE_MAS',
          `\`printf\` muestra el valor que tiene la variable, no el lugar donde está: a \`${e.texto.replace(/^&\s*/, '')}\` le sobra el \`&\`.`,
          e.fila
        );
      } else if (e instanceof ArregloSinPosicion) {
        error(
          'ARREGLO_SIN_POSICION',
          `\`${e.nombre}\` es un arreglo: hay que decir cuál de sus posiciones se usa, por ejemplo \`${e.nombre}[i]\`.`,
          e.fila
        );
      } else if (e instanceof FormatoDistinto) {
        error('FORMATO_NO_CORRESPONDE_AL_TIPO', mensajeDeFormato(e), e.fila);
      } else if (e instanceof ConversionesDistintas) {
        error(
          'FORMATO_CANTIDAD_DISTINTA',
          `El formato de \`${e.funcion}\` tiene ${e.conversiones} ${e.conversiones === 1 ? 'conversión' : 'conversiones'} (lo que empieza con \`%\`) y se le pasa${e.valores === 1 ? '' : 'n'} ${e.valores} ${e.valores === 1 ? 'valor' : 'valores'}: tiene que haber uno por cada una.`,
          e.fila
        );
      } else if (e instanceof ArgumentosDistintos) {
        error(
          'LLAMADA_ARGUMENTOS_CANTIDAD',
          `${conContexto}${BT}${e.funcion}${BT} ${e.esperados === 0 ? 'no recibe ningún argumento' : e.esperados === 1 ? 'recibe un argumento' : 'recibe ' + e.esperados + ' argumentos'}, y acá se la llama con ${e.recibidos === 0 ? 'ninguno' : e.recibidos}: tiene que haber uno por cada parámetro.`,
          e.fila
        );
      } else if (e instanceof LlamadaSinAmpersand) {
        error(
          'LLAMADA_SIN_AMPERSAND',
          `${conContexto}El parámetro ${BT}${e.parametro}${BT} de ${BT}${e.funcion}${BT} está declarado con ${BT}*${BT}, así que hay que pasarle la dirección de la variable: ${BT}&${e.texto}${BT}. ${FORMULA_REFERENCIA}`,
          e.fila
        );
      } else if (e instanceof LlamadaConAmpersand) {
        error(
          'LLAMADA_CON_AMPERSAND',
          `${conContexto}Se le pasa ${BT}${e.texto}${BT} a ${BT}${e.funcion}${BT}, pero el parámetro ${BT}${e.parametro}${BT} no está declarado con ${BT}*${BT}: recibe un valor y no una dirección. Si la función tiene que modificar la variable, al parámetro le falta el ${BT}*${BT}. ${FORMULA_REFERENCIA}`,
          e.fila
        );
      } else if (e instanceof PunteroSinAsterisco) {
        error(
          'PARAMETRO_SIN_ASTERISCO_AL_USARLO',
          `${conContexto}${BT}${e.nombre}${BT} está declarado con ${BT}*${BT}: para llegar a la variable de afuera hay que escribir ${BT}*${e.nombre}${BT} cada vez que se lo usa. Escrito ${BT}${e.nombre}${BT} solo, no es el valor. ${FORMULA_REFERENCIA}`,
          e.fila
        );
      } else if (e instanceof AsteriscoDeMas) {
        error(
          'ASTERISCO_DE_MAS',
          `${conContexto}${BT}${e.nombre}${BT} no está declarado con ${BT}*${BT}: es un valor común, así que se lo usa sin el ${BT}*${BT}.`,
          e.fila
        );
      } else if (e instanceof SinRetorno) {
        error(
          'FUNCION_SIN_RETORNO',
          `${conContexto}${BT}${e.funcion}${BT} termina sin devolver nada: una función que devuelve un valor tiene que terminar con ${BT}return${BT} y ese valor.`,
          e.fila
        );
      } else if (e instanceof VoidComoValor) {
        error(
          'VOID_COMO_VALOR',
          `${conContexto}${BT}${e.funcion}${BT} es ${BT}void${BT}: no devuelve ningún valor, así que no se puede guardar ni usar en una cuenta.`,
          e.fila
        );
      } else if (e instanceof SinVerificar) {
        aviso(
          'EJECUCION_NO_VERIFICADA',
          'No pude seguir este código para comprobarlo. Verifique que haga lo que pide la consigna.'
        );
      } else {
        throw e;
      }
      return null;
    } finally {
      if (propio) propio.delete();
    }
  }

  // La funcion que arma el corrector para probar otra: declara las variables de
  // los datos del caso y hace la llamada, guardando lo que devuelve en
  // __devuelve. Por esa funcion empieza el simulador.
  function armarLlamada(modelo, llama, prueba, antes = '') {
    const m = /^\s*([A-Za-z_]\w*)\s*\(/.exec(llama);
    if (!m) throw new Error(`no se entiende "${llama}"`);
    const f = modelo.funciones.findLast((x) => !x.prototipo && x.nombre === m[1]);
    const lineas = [];
    // Declaraciones que el caso trae escritas (una estructura: sus campos salen de los datos).
    if (antes) lineas.push(...antes.split('\n').map((l) => `  ${l}`));
    for (const [nombre, valor] of Object.entries(prueba || {})) {
      if (!/^[A-Za-z_]\w*$/.test(nombre)) continue;
      // Una global no se declara de nuevo: la prueba le da su valor inicial.
      if (modelo.variables.some((v) => v.nombre === nombre && !v.local)) continue;
      // Un texto es una cadena de caracteres con su fin.
      if (typeof valor === 'string') {
        lineas.push(`  char ${nombre}[${[...valor].length + 1}];`);
        continue;
      }
      const lista = Array.isArray(valor) ? valor.flat(Infinity) : [valor];
      const tipo = lista.every((v) => v === null || Number.isInteger(v)) ? 'int' : 'double';
      // Un arreglo, o una tabla (una lista de listas), con las dimensiones que traen los datos.
      const dimensiones = (x) => (Array.isArray(x) ? [x.length, ...dimensiones(x[0])] : []);
      lineas.push(
        Array.isArray(valor)
          ? `  ${tipo} ${nombre}${dimensiones(valor).map((d) => `[${d}]`).join('')};`
          : `  ${tipo} ${nombre};`
      );
    }
    const devuelve = f ? textoDeTipo(f.tipo) : 'int';
    if (f && !(f.tipo.clase === 'primitivo' && f.tipo.nombre === 'void' && !f.punteros)) {
      lineas.push(`  ${devuelve} __devuelve;`);
      lineas.push(`  __devuelve = ${llama.trim().replace(/;\s*$/, '')};`);
    } else {
      lineas.push(`  ${llama.trim().replace(/;\s*$/, '')};`);
    }
    return `void __prueba(void) {\n${lineas.join('\n')}\n}\n`;
  }

  // "%d" con un decimal, "%f" con un entero: dice cual es el que corresponde.
  function mensajeDeFormato(e) {
    const queEs = { '%d': 'un entero (`int`)', '%i': 'un entero (`int`)', '%f': 'un decimal (`float`)', '%lf': 'un decimal (`double`)', '%c': 'una letra (`char`)' };
    const deTipo = { int: 'un `int`', float: 'un `float`', double: 'un `double`', char: 'un `char`', decimal: 'un valor decimal' };
    const correcto =
      e.funcion === 'scanf'
        ? { int: '%d', float: '%f', double: '%lf', char: '%c' }[e.tipo]
        : e.tipo === 'int'
          ? '%d'
          : e.tipo === 'char'
            ? '%c'
            : '%f';
    const que = e.funcion === 'printf' && e.formato === '%lf' ? 'un decimal' : queEs[e.formato];
    return `\`${e.formato}\` es el formato de ${que}, y \`${e.texto}\` es ${deTipo[e.tipo]}: el formato que le corresponde es \`${correcto}\`.`;
  }

  // Lo que se avisa de una respuesta que esta bien: pow, y el limite con el
  // numero suelto habiendo una constante que vale eso.
  function notasYMejoras(regla, modelo) {
    // pow da lo mismo que el producto, y es una forma valida: se avisa una vez.
    const conPow = modelo.llamadas.find((l) => l.nuevo && l.funcion === 'pow');
    if (conPow && !avisados.includes('USO_DE_POW')) {
      nota(
        'USO_DE_POW',
        'Su respuesta es correcta. Solo una observación: `pow` trabaja con decimales. Para elevar un entero al cuadrado, multiplicarlo por sí mismo es más directo y no tiene redondeos.',
        conPow.fila
      );
    }

    if (regla.limite && practicas.includes('constantes')) {
      for (const ciclo of modelo.ciclos.filter((c) => c.nuevo)) {
        const m = /^\s*[A-Za-z_]\w*\s*(?:<=|<|!=)\s*(\d+)\s*$/.exec(ciclo.condicion);
        const constanteIgual = m && modelo.constantes.find((c) => valorDeDimension(c.valor, modelo) === Number(m[1]));
        if (constanteIgual) {
          mejora(
            'LIMITE_CON_NUMERO_SUELTO',
            `Está bien, pero el ${m[1]} es el valor de \`${constanteIgual.nombre}\`: con la constante, el ciclo sigue siendo correcto si cambia la cantidad.`,
            ciclo.fila
          );
          break;
        }
      }
    }
  }

  // "separadas": los valores van en una sola linea, con un espacio entre cada
  // uno y nada mas (un espacio o un salto al final se perdona).
  function salidaSeparada(corrida, esperados, comoLetras, antes, elPrograma) {
    const texto = (v) => (comoLetras ? String.fromCodePoint(v) : String(v));
    const debe = esperados.map(texto).join(' ');
    const sale = corrida.salida.replace(/\s+$/, '');
    if (sale === debe) return true;
    const cosas = comoLetras ? 'las letras' : 'los valores';
    error(
      'MUESTRA_SIN_SEPARAR',
      `${antes}${elPrograma} muestra ${cosas} que corresponden, pero la consigna las pide separadas por un espacio y nada más.`,
      undefined,
      [
        { lineas: sale.split('\n').map((l) => l.replace(/\s+$/, '')) },
        { titulo: 'Tiene que mostrar:', lineas: [debe] },
      ]
    );
    return false;
  }

  // Lo que muestra el programa, renglon por renglon, y con valores de prueba
  // tambien lo que deberia mostrar (el alumno solo ve la salida esperada de los
  // valores de la consigna).
  function bloquesDeSalida(corrida, pedidas, conOtrosValores) {
    const renglones = corrida.salida.split('\n').map((l) => l.replace(/\s+$/, ''));
    while (renglones.length && !renglones[renglones.length - 1]) renglones.pop();
    const bloques = [{ lineas: renglones.length ? renglones : ['(no muestra nada)'] }];
    if (conOtrosValores) {
      bloques.push({ titulo: 'Debería mostrar:', lineas: pedidas.map((fila) => fila.join(' ')) });
    }
    return bloques;
  }

  // Cada arreglo de "recorre" tiene que tener tocadas todas sus filas y columnas.
  //   "recorre": "tabla" | ["tabla", "ventas"] | { "notas": ["el curso", "el alumno", "el parcial"] }
  // Cada nivel va con su articulo: de ahi sale "recorrerlos todos" o "recorrerlas todas".
  function recorreTodo(corrida, recorre, antes) {
    const pedidos = Array.isArray(recorre)
      ? recorre.map((n) => [n, null])
      : typeof recorre === 'object'
        ? Object.entries(recorre)
        : [[recorre, null]];
    for (const [nombre, niveles] of pedidos) {
      const variable = corrida.variables.get(nombre);
      if (!variable || !variable.dims) continue;
      // "alumnos.promedio" es el arreglo de estructuras "alumnos": una posicion
      // esta recorrida si el ciclo toco cualquiera de sus campos.
      const mostrado = nombre.split('.')[0];
      let visitadas = corrida.visitas.get(nombre);
      if (nombre.includes('.')) {
        const delArreglo = [...corrida.visitas].filter(([otro]) => otro.split('.')[0] === mostrado);
        visitadas = variable.dims.map((_, k) => new Set(delArreglo.flatMap(([, v]) => [...(v[k] || [])])));
      }
      const chico = variable.dims.length === 2 ? ['la fila', 'la columna'] : variable.dims.map(() => 'la posición');
      for (let k = 0; k < variable.dims.length; k++) {
        // Cada nivel con su articulo: "la fila", "el curso".
        const [articulo, ...resto] = ((niveles && niveles[k]) || chico[k]).split(' ');
        const unidad = resto.join(' ');
        const femenino = articulo === 'la';
        const n = variable.dims[k];
        const tocadas = visitadas ? visitadas[k] : new Set();
        if (tocadas.size >= n) continue;
        const toco = tocadas.size > 0;
        // Un arreglo de una dimension que el ciclo ni toca (no muestra nada, usa
        // otro campo): lo dice mejor el error que sigue. Una tabla si dice que no se recorre.
        if (!toco && variable.dims.length === 1) continue;
        error(
          'RECORRIDO_INCOMPLETO',
          !toco
            ? `${antes}\`${mostrado}\` tiene ${n} ${enPlural(unidad)} y el programa no ${femenino ? 'las' : 'los'} recorre: la consigna pide un ciclo que pase por ${femenino ? 'todas' : 'todos'}.`
            : `${antes}\`${mostrado}\` tiene ${n} ${enPlural(unidad)} y el ciclo no llega a ${femenino ? 'recorrerlas todas' : 'recorrerlos todos'}.`
        );
        return false;
      }
    }
    return true;
  }

  // Un arreglo a medio cargar: el ciclo tiene que tocar las primeras `cantidad`
  // posiciones, ni una menos ni una mas.
  //   "recorreHasta": { "notas": "cantidad" }
  // La cantidad sale de los datos del caso (o del valor que tiene la variable).
  function recorreCargadas(corrida, caso, pedido, antes) {
    for (const [nombre, cantidadDe] of Object.entries(pedido)) {
      const variable = corrida.variables.get(nombre);
      if (!variable || !variable.dims) continue;
      const dato = caso && caso.datos ? caso.datos[cantidadDe] : undefined;
      const cargadas = dato !== undefined ? dato : corrida.variables.get(cantidadDe)?.valor;
      if (cargadas === undefined) continue;
      const tocadas = corrida.lecturasPorPosicion.get(nombre);
      const posiciones = tocadas ? tocadas[0] : new Set();
      // Un ciclo que no lee el arreglo: lo dice mejor el error que sigue.
      if (!posiciones.size) continue;
      const faltan = [...Array(cargadas).keys()].some((p) => !posiciones.has(p));
      if (faltan) {
        error(
          'RECORRIDO_INCOMPLETO',
          `${antes}en \`${nombre}\` hay ${cargadas} posiciones cargadas, de la 0 a la ${cargadas - 1}, y el ciclo no llega a recorrerlas todas.`
        );
        return false;
      }
      const ultima = Math.max(...posiciones);
      if (ultima >= cargadas) {
        error(
          'RECORRIDO_SE_PASA',
          `${antes}el ciclo llega hasta la posición ${ultima} de \`${nombre}\`, pero solo hay ${cargadas} cargadas, de la 0 a la ${cargadas - 1}: las demás no tienen nada.`
        );
        return false;
      }
    }
    return true;
  }

  // "con `ventas` valiendo 120, 85 y 240": los valores con que se probo.
  function conLosValores(datos) {
    // Las variables sueltas primero y los arreglos al final, que son los largos.
    const ordenados = Object.entries(datos || {}).sort(
      ([, a], [, b]) => Number(Array.isArray(a)) - Number(Array.isArray(b))
    );
    // Un campo de un arreglo de estructuras ("alumnos.promedio") se dice como se escribe: alumnos[i].promedio.
    // (con estructuras de adentro: alumnos.nacimiento.anio -> alumnos[i].nacimiento.anio)
    const comoSeEscribe = (nombre, esArreglo) =>
      esArreglo ? nombre.replace(/^([A-Za-z_]\w*)\.(\w+)/, '$1[i].$2') : nombre;
    const partes = ordenados.map(
      ([nombre, lista]) =>
        `\`${comoSeEscribe(nombre, Array.isArray(lista))}\` valiendo ${enLista(Array.isArray(lista) ? lista : [lista])}`
    );
    return partes.length ? `Con ${partes.join(' y ')}` : 'Con los datos de la consigna';
  }

  // Un caso: con esos valores, cada variable termina con tal valor y/o se
  // muestra tal cosa. Dice que paso si no. Devuelve si estuvo bien.
  //   { "datos": { "ventas": [120, 85] }, "queda": { "total": 205 }, "muestra": [70] }
  // De la regla se usan "extremo" (el resultado tiene que ser uno de los valores
  // del arreglo: el mayor, el menor) y "busca" (no es una acumulacion). Del
  // caso, "sinCortar": lo que queda si la busqueda sigue despues de encontrarlo.
  // "extremo": true vale para todas las variables que se piden; un nombre, o una
  // lista de nombres, solo para esas.
  function esExtremo(pedido, nombre) {
    return pedido === true || pedido === nombre || (Array.isArray(pedido) && pedido.includes(nombre));
  }

  function revisarCaso(corrida, caso, modelo, regla) {
    // Con los valores que el alumno ve en la consigna no hace falta decirlos.
    const con = caso.visible || !caso.datos ? '' : conLosValores(caso.vistos || caso.datos);
    const antes = con ? `${con}, ` : '';
    // Los valores de una variable que tiene letras se dicen como letras.
    const vista = (nombre, v) =>
      caso.letrasQueda && caso.letrasQueda.has(nombre)
        ? deLetra(v)
        : caso.enumQueda && caso.enumQueda[nombre]
          ? (caso.enumQueda[nombre].enumeradores.find((e) => e.valor === v)?.nombre ?? v)
          : v;
    const vistaMuestra = (v) => (caso.letrasMuestra ? deLetra(v) : v);
    const elPrograma = con ? 'el programa' : 'El programa';
    // Cada arreglo que se tiene que recorrer entero, primero: si el ciclo no
    // llega a todas las filas o columnas, lo demas no importa.
    if (regla.recorre && !recorreTodo(corrida, regla.recorre, antes)) return false;
    if (regla.recorreHasta && !recorreCargadas(corrida, caso, regla.recorreHasta, antes)) return false;
    // Las veces que se le da un valor con "=" a la variable dentro de un ciclo.
    const asignacionesEnCiclo = (nombre) =>
      modelo.asignaciones.filter(
        (a) =>
          a.nuevo &&
          a.operador === '=' &&
          a.izquierda.clase === 'nombre' &&
          a.izquierda.nombre === nombre &&
          modelo.ciclos.some((c) => c.nuevo && c.posicion < a.posicion && a.posicion < c.fin)
      );
    for (const [nombre, debe] of Object.entries(caso.queda || {})) {
      const variable = corrida.variables.get(nombre);
      // Un arreglo: las primeras posiciones tienen que tener esos valores.
      if (Array.isArray(debe)) {
        if (!variable || !variable.dims) {
          error('RESULTADO_FALTA', `No encontré el arreglo \`${nombre}\`.`);
          return false;
        }
        // Las posiciones de una lista, o de una lista de listas (una tabla):
        // con su nombre completo, notas[2][1].
        const posiciones = [];
        const juntar = (lista, camino, real) => {
          lista.forEach((valor, k) => {
            const cual = [...camino, k];
            const que = real ? real[k] : undefined;
            if (Array.isArray(valor)) juntar(valor, cual, Array.isArray(que) ? que : undefined);
            else posiciones.push({ nombre: `${nombre}${cual.map((i) => `[${i}]`).join('')}`, debe: valor, que });
          });
        };
        juntar(debe, [], variable.datos);
        for (const p of posiciones) {
          if (p.que === undefined) {
            error(
              'RESULTADO_POSICION_SIN_VALOR',
              `${antes}\`${p.nombre}\` no llega a recibir un valor: debería valer \`${vista(nombre, p.debe)}\`.`
            );
            return false;
          }
          if (Math.abs(p.que - p.debe) > 1e-9) {
            // Un arreglo de totales que arrastra lo de la fila anterior, o que
            // tiene lo que daria con la fila y la columna cambiadas.
            const tieneEso = (esperado) =>
              Array.isArray(esperado) &&
              Array.isArray(variable.datos) &&
              esperado.every((v, k) => variable.datos[k] !== undefined && Math.abs(variable.datos[k] - v) < 1e-9);
            if (tieneEso(caso.acumulado && caso.acumulado[nombre])) {
              error(
                'ACUMULADOR_SIN_REINICIAR_POR_FILA',
                `${antes}\`${nombre}\` termina con ${enLista(caso.acumulado[nombre])} y debería tener ${enLista(debe)}: cada total arrastra lo de las filas anteriores. El acumulador tiene que volver a \`0\` al empezar cada fila.`
              );
              return false;
            }
            if (tieneEso(caso.cambiadas && caso.cambiadas[nombre])) {
              error(
                'FILAS_Y_COLUMNAS_CAMBIADAS',
                `${antes}\`${nombre}\` termina con ${enLista(caso.cambiadas[nombre])}, que es lo que da con la fila y la columna cambiadas: el primer índice es la fila y el segundo, la columna.`
              );
              return false;
            }
            error(
              'RESULTADO_VALOR_DISTINTO',
              `${antes}\`${p.nombre}\` termina valiendo \`${vista(nombre, p.que)}\` y debería valer \`${vista(nombre, p.debe)}\`.`
            );
            return false;
          }
        }
        continue;
      }
      if (!variable || variable.dims) {
        error('RESULTADO_FALTA', `No encontré la variable \`${nombre}\`.`);
        return false;
      }
      const tiene = variable.valor;
      if (tiene === undefined) {
        error(
          'RESULTADO_VARIABLE_SIN_VALOR',
          `${antes}\`${nombre}\` no llega a recibir un valor: debería valer \`${debe}\`.`
        );
        return false;
      }
      if (Math.abs(tiene - debe) < 1e-9) continue;

      // Sin el ruido de las cuentas con decimales (17.549999999999997).
      const redondeo = (v) => (typeof v === 'number' && !Number.isInteger(v) ? Number(v.toFixed(6)) : v);
      const resumen = `${antes}\`${nombre}\` termina valiendo \`${vista(nombre, redondeo(tiene))}\` y debería valer \`${vista(nombre, redondeo(debe))}\``;
      const ultimos = Object.values(caso.datos || {}).map((lista) => lista[lista.length - 1]);
      const valoresDeLosArreglos = Object.values(caso.datos || {}).flat(Infinity);
      if (variable.flotante && !Number.isInteger(debe) && tiene === Math.trunc(debe)) {
        error(
          'DIVISION_ENTERA',
          `${resumen}: dividir dos enteros da un entero, aunque el resultado se guarde en un \`float\`, y la parte decimal ya se perdió. Alguno de los dos números tiene que ser decimal.`
        );
      } else if (regla.centinela !== undefined && tiene === debe + 1) {
        // Cuenta tambien el dato que marca el final, que no es uno de los cargados.
        error(
          'CENTINELA_CONTADO',
          `${resumen}: está contando también el \`${regla.centinela}\` que marca el final, que no es uno de los datos.`
        );
      } else if (caso.sinCortar !== undefined && tiene === caso.sinCortar) {
        // La busqueda siguio despues de encontrarlo y quedo la ultima vez.
        error(
          'BUSQUEDA_SIN_CORTAR',
          `${resumen}: es la última vez que aparece. Después de encontrarlo el ciclo sigue y lo reemplaza: hay que dejar de buscar cuando lo encuentra.`
        );
      } else if (esExtremo(regla.extremo, nombre) && !valoresDeLosArreglos.includes(tiene)) {
        // El mayor o el menor tiene que ser uno de los del arreglo.
        error(
          'EXTREMO_FUERA_DEL_ARREGLO',
          `${resumen}: ese valor no es ninguno de los de \`${Object.keys(caso.datos || {})[0]}\`. El valor con que se empieza tiene que ser uno de los del arreglo.`
        );
      } else if (!regla.busca && !(caso.enumQueda && caso.enumQueda[nombre]) && ultimos.includes(tiene) && asignacionesEnCiclo(nombre).length) {
        // Lo que quedo es el ultimo elemento: se volvio a empezar en cada
        // vuelta, o se reemplazo el valor en lugar de acumularlo.
        const reinicio = asignacionesEnCiclo(nombre).find((a) => a.derecha.clase === 'numero');
        error(
          reinicio ? 'ACUMULADOR_REINICIADO' : 'ACUMULADOR_SE_PISA',
          reinicio
            ? `${resumen}: dentro del ciclo se vuelve a poner en \`${reinicio.derecha.valor}\` en cada vuelta y lo que se había acumulado se pierde. Esa línea va antes del ciclo.`
            : `${resumen}: en cada vuelta se reemplaza el valor anterior en lugar de agregarle el nuevo.`,
          reinicio ? reinicio.fila : undefined
        );
      } else {
        error('RESULTADO_VALOR_DISTINTO', `${resumen}.`);
      }
      return false;
    }

    // Una tabla: cada fila en su renglon, con sus valores.
    if (caso.muestraEnFilas) {
      if (!corrida.mostrados.length) {
        error('MUESTRA_FALTA', 'La consigna pide mostrar en pantalla, con `printf`: el programa no muestra ningún número.');
        return false;
      }
      const iguales = (a, b) => a.length === b.length && a.every((v, k) => Math.abs(v - b[k]) < 1e-6);
      const filas = corrida.lineas.filter((l) => l.length);
      const pedidas = caso.muestraEnFilas;
      if (!(filas.length === pedidas.length && filas.every((f, k) => iguales(f, pedidas[k])))) {
        if (iguales(corrida.mostrados, pedidas.flat())) {
          error(
            'TABLA_SIN_RENGLONES',
            `${antes}${elPrograma} muestra los valores en ${filas.length} ${filas.length === 1 ? 'renglón' : 'renglones'} y la tabla tiene ${pedidas.length} filas: cada fila tiene que ir en su propio renglón.`,
            undefined,
            bloquesDeSalida(corrida, pedidas, Boolean(con))
          );
        } else {
          error(
            'MUESTRA_DISTINTA',
            `${antes}${elPrograma} muestra:`,
            undefined,
            bloquesDeSalida(corrida, pedidas, Boolean(con))
          );
        }
        return false;
      }
    }

    // El texto que muestra, tal cual (sin los espacios ni saltos del final).
    if (caso.salida != null) {
      const sale = corrida.salida.split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\s+$/, '');
      const debe = String(caso.salida).trim();
      if (sale !== debe) {
        // Igual salvo tildes, mayusculas o espacios: el texto tiene que ser exacto.
        const plano = (t) =>
          t
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .replace(/[ \t]+/g, ' ')
            .trim();
        const casiIgual = sale && debe && plano(sale) === plano(debe);
        error(
          casiIgual ? 'MUESTRA_CASI_IGUAL' : sale ? 'MUESTRA_DISTINTA' : 'MUESTRA_FALTA',
          !sale
            ? `${antes}${elPrograma} no muestra nada: la consigna pide mostrar el texto con \`printf\`.`
            : !debe
              ? `${antes}${elPrograma} muestra un texto, y con ese valor no tiene que mostrar nada:`
              : casiIgual
                ? `${antes}${elPrograma} muestra casi lo pedido, pero el texto tiene que ser exactamente el de la consigna, con las mismas mayúsculas, tildes y espacios:`
                : `${antes}${elPrograma} muestra otro texto:`,
          undefined,
          !sale
            ? [{ titulo: 'Tiene que mostrar:', lineas: [debe] }]
            : !debe
              ? [{ lineas: sale.split('\n') }]
              : [{ lineas: sale.split('\n') }, { titulo: 'Tiene que mostrar:', lineas: [debe] }]
        );
        return false;
      }
    }

    if (caso.muestra) {
      if (!corrida.mostrados.length) {
        error(
          'MUESTRA_FALTA',
          `La consigna pide mostrar en pantalla, con \`printf\`: el programa no muestra ningún ${caso.letrasMuestra ? 'valor' : 'número'}.`
        );
        return false;
      }
      const sale = corrida.mostrados;
      const iguales =
        sale.length === caso.muestra.length && sale.every((v, k) => Math.abs(v - caso.muestra[k]) < 1e-6);
      if (!iguales) {
        error(
          'MUESTRA_DISTINTA',
          `${antes}${elPrograma} muestra ${enLista(sale.map(vistaMuestra))} cuando debería mostrar ${enLista(caso.muestra.map(vistaMuestra))}.`
        );
        return false;
      }
      if (regla.separadas && !salidaSeparada(corrida, caso.muestra, Boolean(caso.letrasMuestra), antes, elPrograma)) {
        return false;
      }
    }
    return true;
  }

  // ---- leer del teclado y mostrar: se sigue con datos de prueba ------------------

  // Se ejecuta el codigo con los datos que "escribe el usuario" y se compara lo
  // que queda en los arreglos y lo que se muestra. Vale cualquier forma de
  // leer o de mostrar que llegue a lo mismo.
  //   { "ejecuta": {
  //       "entrada": [8, 5, 9],             // lo que escribe el usuario
  //       "queda": { "notas": "entrada" },  // o una lista; "entrada" = lo escrito, en orden
  //       "muestra": "entrada",             // o una lista; "alReves": lo escrito, de atras
  //       "deArreglo": "notas",             // lo mostrado tiene que salir de ese arreglo
  //       "pregunta": "Ingrese la nota %d: ",   // el mensaje antes de cada lectura
  //       "conCiclo": true, "limite": true } }
  // Los valores de la ficha de la consigna, con los nombres que usa el simulador:
  // alumnos[1].nacimiento.mes es la posicion 1 de alumnos.nacimiento.mes. Solo los
  // numericos, y un arreglo solo si la ficha trae todas sus posiciones.
  function datosDeLaFicha(modelo) {
    const datos = {};
    const numeroDeEnumerador = (texto) => {
      const x = modelo.enums.flatMap((e) => e.enumeradores).find((e) => e.nombre === String(texto));
      return x && x.valor != null ? x.valor : NaN;
    };
    const incompletos = new Set();
    const hojas = (campos, prefijo = '') =>
      campos.flatMap((c) => (c.campos ? hojas(c.campos, `${prefijo}${c.nombre}.`) : [{ ruta: `${prefijo}${c.nombre}`, ejemplo: c.ejemplo }]));
    for (const ficha of fichasDe(consigna)) {
      if (!ficha.titulo) continue;
      const elemento = /^([A-Za-z_]\w*)\[(\d+)\]$/.exec(ficha.titulo);
      for (const { ruta, ejemplo } of hojas(ficha.campos)) {
        const plano = elemento ? `${elemento[1]}.${ruta}` : `${ficha.titulo}.${ruta}`;
        let numero = ejemplo != null && String(ejemplo).trim() !== '' ? Number(ejemplo) : NaN;
        if (!Number.isFinite(numero) && ejemplo != null) numero = numeroDeEnumerador(ejemplo);
        if (!Number.isFinite(numero)) {
          incompletos.add(plano);
          continue;
        }
        if (elemento) (datos[plano] = datos[plano] || [])[Number(elemento[2])] = numero;
        else datos[plano] = numero;
      }
    }
    for (const plano of incompletos) delete datos[plano];
    for (const [plano, valor] of Object.entries(datos)) {
      if (Array.isArray(valor) && Array.from(valor).some((v) => v === undefined)) delete datos[plano];
    }
    return datos;
  }

  // El campo que la ficha marca es sobre el que se trabaja: un programa que no
  // lo lee nunca esta mirando otra cosa (el mes en vez del anio).
  function usaLosCamposMarcados(corrida) {
    for (const ficha of fichasDe(consigna)) {
      const elemento = /^([A-Za-z_]\w*)\[\d+\]$/.exec(ficha.titulo || '');
      // (una ficha escrita a mano no lleva marcarEnTodas: su marcar es el de todas)
      const marcados = 'marcarEnTodas' in ficha ? ficha.marcarEnTodas : ficha.marcar;
      if (!elemento || !Array.isArray(marcados)) continue;
      for (const ruta of marcados) {
        const plano = `${elemento[1]}.${ruta}`;
        const variable = corrida.variables.get(plano);
        if (!variable || !variable.dims) continue;
        const leidas = corrida.lecturasPorPosicion.get(plano);
        if (leidas && leidas[0].size) continue;
        error(
          'CAMPO_MARCADO_SIN_USAR',
          `El programa nunca usa \`${elemento[1]}[i].${ruta}\`, que es el dato que la consigna pide mirar.`
        );
        return false;
      }
    }
    return true;
  }

  // "indicesConNombre": un arreglo con un lugar por cada nombre de un enumerado
  // se indexa con el nombre (ventas[TARDE]); con el numero (ventas[1]) esta bien,
  // pero es una mejora.
  function sugerirIndices(modelo, regla) {
    const valores = [];
    for (const a of modelo.asignaciones.filter((x) => x.nuevo)) valores.push([a.izquierda, a.fila], [a.derecha, a.fila]);
    for (const l of modelo.llamadas.filter((x) => x.nuevo)) for (const arg of l.argumentos) valores.push([arg, l.fila]);
    for (const [v, fila] of valores) {
      if (v.clase !== 'indice') continue;
      for (let k = 0; k < v.indices.length; k++) {
        const escrito = v.indices[k].trim();
        if (!/^\d+$/.test(escrito)) continue;
        // Un indice que la consigna dice que no es de un enumerado (el empleado).
        const declarados = regla.indicesDe && regla.indicesDe[v.nombre];
        if (declarados && declarados[k] == null) continue;
        const numero = Number(escrito);
        // Con "indicesDe", el enumerado de cada indice es el que dice la consigna.
        const tipo = regla.indicesDe?.[v.nombre]?.[k]?.tipo;
        const real = tipo ? resolver(tipoDesdeTexto(tipo), modelo) : null;
        const candidatos = real && real.clase === 'enum' ? real.def.enumeradores : modelo.enums.flatMap((d) => d.enumeradores);
        const e = candidatos.find((x) => x.valor === numero);
        if (!e) continue;
        mejora(
          'ENUM_CON_NUMERO',
          `Está bien, pero \`${numero}\` es el valor de \`${e.nombre}\`: con el nombre, se entiende de qué lugar se trata sin tener que recordar los números.`,
          fila
        );
        return;
      }
    }
  }

  // Un caso puede decir un valor con el nombre del enumerador ("turno": "TARDE"):
  // aca pasa a su numero, y los mensajes lo dicen con el nombre.
  function conEnumeradores(original, modelo) {
    // "turno", "alumno.turno" o "alumnos.turno" (el arreglo de un campo, aplanado).
    const definicion = (nombre) => {
      const aplanado = /^([A-Za-z_]\w*)\.([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)$/.exec(nombre);
      const variable = aplanado ? modelo.variables.findLast((x) => x.nombre === aplanado[1]) : null;
      if (variable && variable.arreglo.length) return enumDeCamino(`${aplanado[1]}[0].${aplanado[2]}`, modelo);
      return enumDeCamino(nombre, modelo, true);
    };
    let cambio = false;
    const enumQueda = {};
    const convertir = (objeto, esQueda) => {
      if (!objeto) return objeto;
      const salida = {};
      for (const [nombre, valor] of Object.entries(objeto)) {
        const conTextos = (v) => (Array.isArray(v) ? v.some(conTextos) : typeof v === 'string' && v.length > 1);
        const def = conTextos(valor) ? definicion(nombre) : null;
        // Un valor, una lista o una lista de listas (una tabla).
        const convertir1 = (v) => {
          if (Array.isArray(v)) return v.map(convertir1);
          const x = def && typeof v === 'string' && def.enumeradores.find((e) => e.nombre === v);
          if (!x || x.valor == null) return v;
          cambio = true;
          if (esQueda) enumQueda[nombre] = def;
          return x.valor;
        };
        salida[nombre] = convertir1(valor);
      }
      return salida;
    };
    const datos = convertir(original.datos, false);
    const queda = convertir(original.queda, true);
    if (!cambio) return original;
    return { ...original, datos, queda, vistos: original.vistos || original.datos, enumQueda };
  }

  function reglaEjecuta(regla, modelo) {
    if (regla.conCiclo && !modelo.ciclos.some((c) => c.nuevo)) {
      error('CICLO_FALTA', 'La consigna pide un ciclo: una sentencia que se repite, como `for` o `while`.');
      return;
    }
    // "indicesDe": una tabla indexada con dos enumerados, cada indice con el suyo
    // (ventas[MARTES][TARDE]). Un nombre de un enumerado en el lugar de otro es
    // un error aunque compile y quede dentro de la tabla.
    //   "indicesDe": { "ventas": [ { "tipo": "TDia", "uno": "un día", "varios": "los días" },
    //                              { "tipo": "TTurno", "uno": "un turno", "varios": "los turnos" } ] }
    if (regla.indicesDe) {
      for (const [tabla, pedidos] of Object.entries(regla.indicesDe)) {
        const defs = pedidos.map((p) => {
          if (!p) return null; // un indice que no es de un enumerado (el empleado)
          const real = resolver(tipoDesdeTexto(p.tipo), modelo);
          return real.clase === 'enum' ? real.def : null;
        });
        for (const x of modelo.indexaciones.filter((y) => y.nuevo && y.nombre === tabla)) {
          for (let k = 0; k < Math.min(x.indices.length, pedidos.length); k++) {
            if (!pedidos[k]) continue;
            const escrito = x.indices[k].trim();
            const def = modelo.enums.find((e) => e.enumeradores.some((en) => en.nombre === escrito));
            if (!def || def === defs[k]) continue;
            const deQuien = pedidos.find((p, j) => p && defs[j] === def);
            error(
              'INDICE_DE_OTRO_ENUMERADO',
              deQuien
                ? `\`${escrito}\` es ${deQuien.uno}, pero el ${ordinal(k)} índice de \`${tabla}\` elige ${pedidos[k].varios}: los índices están al revés.`
                : `\`${escrito}\` no es ${pedidos[k].uno}: el ${ordinal(k)} índice de \`${tabla}\` elige ${pedidos[k].varios}.`,
              x.fila
            );
            return;
          }
        }
      }
    }
    // Un switch: con "conSwitch" tiene que haber uno, y con "conDefault", un default.
    const switches = modelo.switches.filter((s) => s.nuevo);
    if (regla.conSwitch && !switches.length) {
      error('SWITCH_FALTA', 'La consigna pide un `switch`: elige qué hacer según el valor de una variable, con un `case` por cada valor.');
      return;
    }
    if (regla.conDefault && switches.length && !switches.some((s) => s.conDefault)) {
      error(
        'SWITCH_SIN_DEFAULT',
        'El `switch` no tiene `default`: si el valor no es ninguno de los casos, no hace nada. La consigna pide que en ese caso muestre un mensaje.',
        switches[0].fila
      );
      return;
    }
    if (bibliotecaFalta(modelo)) return;
    const entrada = regla.entrada || [];

    // Varios conjuntos de valores para los arreglos, cada uno con lo que tiene
    // que dar: asi no vale escribir el resultado a mano.
    if (regla.casos) {
      for (const original of regla.casos) {
        const caso = conCodigos(conEnumeradores(original, modelo));
        // Lo que la ficha muestra y el caso no dice tambien tiene valor: si no, el
        // alumno que usa otro campo (el mes en vez del anio) leeria "sin valor".
        if (caso.datos) {
          caso.vistos = caso.vistos || caso.datos;
          caso.datos = { ...datosDeLaFicha(modelo), ...caso.datos };
        }
        // Con "llama", se prueba una funcion: se la llama con esos argumentos y,
        // con "devuelve", lo que da tiene que ser eso.
        const llamada = caso.llama ? valorDe(caso.llama) : null;
        if (llamada && !modelo.funciones.some((x) => !x.prototipo && x.nombre === /^\s*([A-Za-z_]\w*)/.exec(llamada)[1])) {
          // Si ya se dijo que la funcion se llama de otra manera, con eso alcanza.
          if (diagnosticos.some((d) => d.codigo === 'FUNCION_NOMBRE')) return;
          error('FUNCION_FALTA', 'No encontré la definición de la función que pide la consigna.');
          return;
        }
        const hecha = correrCodigo(modelo, enCodigos(caso.entrada || entrada), caso.datos, {
          contexto: caso.visible || !caso.datos ? '' : conLosValores(caso.vistos || caso.datos),
          centinela: regla.centinela,
          llama: llamada,
          antes: caso.antes,
        });
        if (!hecha) return;
        // Una estructura devuelta se compara campo por campo: "devuelve": { "cociente": 3, "resto": 2 }.
        if (llamada && caso.devuelve && typeof caso.devuelve === 'object') {
          const con = caso.visible || !caso.datos ? '' : `${conLosValores(caso.vistos || caso.datos)}, `;
          const pedidos = Object.keys(caso.devuelve);
          for (const [campo, esperado] of Object.entries(caso.devuelve)) {
            const v = hecha.variables.get(`__devuelve.${campo}`);
            if (!v) {
              error(
                'DEVUELVE_CAMPO_FALTA',
                `La estructura que devuelve ${BT}${llamada}${BT} no tiene el campo ${BT}${campo}${BT}: la consigna pide los campos ${enLista(pedidos)}.`
              );
              return;
            }
            // Un campo de texto: sus letras hasta el fin.
            const dio =
              typeof esperado === 'string' && v.dims
                ? String.fromCodePoint(...(v.datos || []).slice(0, Math.max(0, (v.datos || []).indexOf(0) < 0 ? (v.datos || []).length : (v.datos || []).indexOf(0))))
                : v.valor;
            if (dio === undefined) {
              error('DEVUELVE_CAMPO_SIN_VALOR', `${con}el campo ${BT}${campo}${BT} de lo que devuelve ${BT}${llamada}${BT} no llega a tener un valor.`);
              return;
            }
            const igual = typeof esperado === 'string' ? dio === esperado : Math.abs(dio - esperado) < 1e-6;
            if (!igual) {
              error(
                'DEVUELVE_DISTINTO',
                `${con}${BT}${llamada}${BT} devuelve una estructura con ${BT}${campo}${BT} en ${BT}${dio}${BT}, y debería tener ${BT}${esperado}${BT}.`
              );
              return;
            }
          }
        } else if (llamada && caso.devuelve !== undefined) {
          const dio = hecha.variables.get('__devuelve');
          if (!dio || dio.valor === undefined) {
            error('FUNCION_SIN_RETORNO', `${BT}${llamada}${BT} no devuelve ningún valor: la consigna pide que lo devuelva.`);
            return;
          }
          // Un nombre de enumerador ("VERDADERO") vale lo que vale en el enumerado del alumno.
          const enumerador =
            typeof caso.devuelve === 'string' && [...caso.devuelve].length > 1
              ? modelo.constantes.find((c) => c.clase === 'enum' && c.nombre === caso.devuelve)
              : null;
          const debe = enumerador
            ? valorDeDimension(enumerador.valor, modelo)
            : typeof caso.devuelve === 'string' && [...caso.devuelve].length === 1
              ? caso.devuelve.codePointAt(0)
              : caso.devuelve;
          if (Math.abs(dio.valor - debe) > 1e-9) {
            const con = caso.visible || !caso.datos ? '' : `${conLosValores(caso.vistos || caso.datos)}, `;
            const decir = (v) =>
              enumerador
                ? (modelo.constantes.find((c) => c.clase === 'enum' && valorDeDimension(c.valor, modelo) === v)?.nombre ?? v)
                : typeof caso.devuelve === 'string'
                  ? deLetra(v)
                  : v;
            // Un resultado con decimales que llega sin ellos: la division entera.
            const divisionEntera =
              typeof debe === 'number' && !Number.isInteger(debe) && Number.isInteger(dio.valor) && dio.valor === Math.trunc(debe);
            error(
              'DEVUELVE_DISTINTO',
              `${con}${BT}${llamada}${BT} devuelve ${BT}${decir(dio.valor)}${BT} y debería devolver ${BT}${decir(debe)}${BT}.` +
                (divisionEntera
                  ? ' Dividir dos enteros da un entero, sin decimales: para que el resultado los tenga, al menos uno de los dos tiene que ser decimal (por ejemplo `2.0`, o con `(float)` adelante).'
                  : '')
            );
            return;
          }
        }
        if (!usaLosCamposMarcados(hecha)) return;
        if (!revisarCaso(hecha, caso, modelo, regla)) return;
      }
      if (regla.indicesConNombre) sugerirIndices(modelo, regla);
      notasYMejoras(regla, modelo);
      return;
    }

    const corrida = correrCodigo(modelo, entrada);
    if (!corrida) return;

    if (entrada.length && corrida.lecturas === 0) {
      error('LECTURA_FALTA', 'La consigna pide leer los datos del teclado, con `scanf`: el programa no lee nada.');
      return;
    }
    if (regla.recorre && !recorreTodo(corrida, regla.recorre, '')) return;
    if (regla.recorreHasta && !recorreCargadas(corrida, null, regla.recorreHasta, '')) return;

    // Lo que tiene que quedar guardado.
    for (const [nombre, pedido] of Object.entries(regla.queda || {})) {
      const variable = corrida.variables.get(nombre);
      if (!variable || !variable.dims) {
        error('RESULTADO_FALTA', `No encontré el arreglo \`${nombre}\`.`);
        return;
      }
      const debe = pedido === 'entrada' ? entrada : pedido;
      for (let k = 0; k < debe.length; k++) {
        const tiene = variable.datos[k];
        if (tiene === undefined) {
          error(
            'RESULTADO_POSICION_SIN_VALOR',
            `\`${nombre}[${k}]\` no llega a recibir un valor: no se lee ningún dato en esa posición.`
          );
          return;
        }
        if (Math.abs(tiene - debe[k]) > 1e-9) {
          error(
            'RESULTADO_VALOR_DISTINTO',
            `\`${nombre}[${k}]\` termina valiendo \`${tiene}\`, y con los datos de la consigna debería guardar \`${debe[k]}\`.`
          );
          return;
        }
      }
    }

    // Lo que tiene que mostrar: la secuencia de numeros.
    if (regla.muestra != null) {
      const pedido = regla.muestra === 'entrada' ? entrada : regla.muestra === 'alReves' ? [...entrada].reverse() : regla.muestra;
      // Las letras llegan como su numero, y se dicen como letras.
      const comoLetras = tieneLetras(pedido);
      const debe = enCodigos(pedido);
      const ver = (v) => (comoLetras ? deLetra(v) : v);
      if (!corrida.mostrados.length) {
        error(
          'MUESTRA_FALTA',
          `La consigna pide mostrar en pantalla, con \`printf\`: el programa no muestra ningún ${comoLetras ? 'valor' : 'número'}.`
        );
        return;
      }
      // Con el arreglo nombrado, cuentan los valores que salen de sus posiciones:
      // el resto (el numero de alumno, por ejemplo) es lo que el alumno quiera agregar.
      const arreglo = regla.deArreglo ? valorDe(regla.deArreglo) : null;
      if (arreglo && (!corrida.delArreglo.length || !corrida.leidos.has(arreglo))) {
        error(
          'MUESTRA_SIN_EL_ARREGLO',
          `Lo que se muestra no sale de las posiciones de \`${arreglo}\`: la consigna pide mostrar lo que hay en el arreglo.`
        );
        return;
      }
      const sale = arreglo ? corrida.delArreglo : corrida.mostrados;
      const iguales = sale.length === debe.length && sale.every((v, k) => Math.abs(v - debe[k]) < 1e-9);
      if (!iguales) {
        // Un solo valor, de una posicion conocida: se dice de cual.
        const origen = arreglo && sale.length === 1 && debe.length === 1 ? corrida.origenes[0] : null;
        error(
          'MUESTRA_DISTINTA',
          origen && origen.indices.length === 1
            ? `Con los datos de la consigna el programa muestra \`${ver(sale[0])}\`, que es lo que hay en la posición ${origen.indices[0]} de \`${origen.nombre}\`.`
            : `Con los datos de la consigna el programa muestra ${enLista(sale.map(ver))} cuando debería mostrar ${enLista(debe.map(ver))}.`
        );
        return;
      }
      if (regla.separadas && !salidaSeparada(corrida, debe, comoLetras, '', 'El programa')) return;
    }

    // El mensaje antes de cada lectura, con el numero de la que sigue.
    if (regla.pregunta) {
      const sinEspacios = (t) => t.replace(/\s+/g, '');
      const debe = entrada.map((_, k) => regla.pregunta.replace('%d', String(k + 1))).join('');
      if (sinEspacios(corrida.salida) !== sinEspacios(debe)) {
        error(
          'TEXTO_DISTINTO',
          `El programa ${corrida.salida.trim() ? `muestra \`${corrida.salida.trim()}\`` : 'no muestra nada'}, y la consigna pide un mensaje antes de cada dato: \`${regla.pregunta.replace('%d', '1').trim()}\`, \`${regla.pregunta.replace('%d', '2').trim()}\`, y así. Tiene que ser justo ese texto (los espacios no importan).`
        );
        return;
      }
    }

    // "cuenta": la variable que dice cuantos datos hay cargados. Un ciclo hasta
    // ese mismo numero escrito suelto anda hoy, pero no si se carga otra cantidad.
    if (regla.cuenta && practicas.includes('constantes')) {
      const cuenta = corrida.variables.get(regla.cuenta);
      for (const ciclo of modelo.ciclos.filter((c) => c.nuevo)) {
        const m = /^\s*[A-Za-z_]\w*\s*<\s*(\d+)\s*$/.exec(ciclo.condicion);
        if (cuenta && cuenta.valor !== undefined && m && Number(m[1]) === cuenta.valor) {
          mejora(
            'LIMITE_SIN_LA_CANTIDAD',
            `Está bien, pero el ${m[1]} es lo que vale \`${regla.cuenta}\`: con \`${regla.cuenta}\`, el ciclo sigue siendo correcto si se cargan más o menos datos.`,
            ciclo.fila
          );
          break;
        }
      }
    }

    notasYMejoras(regla, modelo);
  }

  // ---- una suma de posiciones, y el intercambio de dos ---------------------------

  // "notas[ 0 + 1 ]" -> "notas[1]": la posicion con su indice calculado, para
  // comparar sin que importe como este escrito. Null si no es una posicion
  // con un indice que se pueda calcular.
  function posicionNormal(texto, modelo) {
    const m = /^([A-Za-z_]\w*)\[(.+)\]$/.exec(texto.replace(/\s+/g, ''));
    if (!m) return null;
    const n = valorDeDimension(m[2], modelo);
    return n == null ? null : `${m[1]}[${n}]`;
  }

  // Los terminos de una cuenta, separados por el operador, sin mirar lo que
  // esta entre corchetes o parentesis: "a[0] + a[1]" -> ["a[0]", "a[1]"].
  // "operadores" son los que separan a ese nivel.
  function terminosDe(texto) {
    const terminos = [];
    const operadores = [];
    let actual = '';
    let profundidad = 0;
    for (const c of texto.replace(/\s+/g, '')) {
      if (c === '[' || c === '(') profundidad++;
      if (c === ']' || c === ')') profundidad--;
      if (profundidad === 0 && '+-*/%'.includes(c) && actual) {
        terminos.push(actual);
        operadores.push(c);
        actual = '';
      } else {
        actual += c;
      }
    }
    terminos.push(actual);
    return { terminos, operadores };
  }

  // "total = notas[0] + notas[19];" (o con el tipo): la suma de esas posiciones,
  // guardada en una variable. "de" son las posiciones, "capturar" el nombre.
  function reglaSuma(regla, modelo) {
    const esperadas = regla.de.map((p) => posicionNormal(valorDe(p), modelo));
    const candidatos = [
      ...modelo.asignaciones
        .filter((a) => a.nuevo && a.operador === '=' && a.izquierda.clase === 'nombre')
        .map((a) => ({ nombre: a.izquierda.nombre, texto: a.derecha.texto, fila: a.fila })),
      ...modelo.variables
        .filter((v) => v.nuevo && v.inicial && !v.arreglo.length)
        .map((v) => ({ nombre: v.nombre, texto: v.inicial.texto, fila: v.fila })),
    ].filter((c) => c.texto.includes('['));

    if (!candidatos.length) {
      const enPosicion = modelo.asignaciones.find(
        (a) => a.nuevo && a.operador === '=' && a.izquierda.clase === 'indice' && a.derecha.texto.includes('+')
      );
      if (enPosicion) {
        error(
          'SUMA_EN_UNA_POSICION',
          'El resultado de la suma va en una variable aparte, no en una posición del arreglo.',
          enPosicion.fila
        );
      } else {
        error(
          'SUMA_FALTA',
          'No encontré la suma guardada en una variable: se escribe la variable, `=` y la suma de las posiciones.'
        );
      }
      return;
    }

    const parecido = (c) => {
      const { terminos, operadores } = terminosDe(c.texto);
      const normales = terminos.map((t) => posicionNormal(t, modelo)).sort();
      return operadores.every((o) => o === '+') && normales.join() === [...esperadas].sort().join();
    };
    const c = candidatos.find(parecido) || candidatos[0];
    const { terminos, operadores } = terminosDe(c.texto);

    if (!parecido(c)) {
      const normales = terminos.map((t) => posicionNormal(t, modelo));
      if (operadores.length && operadores.some((o) => o !== '+')) {
        error(
          'SUMA_OPERADOR',
          `La consigna pide una suma, y acá se usa \`${operadores.find((o) => o !== '+')}\`: el operador de la suma es \`+\`.`,
          c.fila
        );
      } else if (normales.some((n) => n == null)) {
        error(
          'SUMA_OTRAS_POSICIONES',
          'La suma tiene que usar posiciones concretas del arreglo, con su índice entre corchetes.',
          c.fila
        );
      } else {
        error('SUMA_OTRAS_POSICIONES', 'La suma no usa las posiciones que pide la consigna.', c.fila);
      }
      return;
    }
    if (regla.capturar) nuevas[regla.capturar] = c.nombre;
  }

  // El valor de una expresion de enteros ("notas[0] + 1", "aux", "7") con los
  // valores que tienen ahora las posiciones y las variables; null si usa algo
  // que no esta (una variable sin valor, una llamada).
  function valorConEntorno(texto, entorno, modelo) {
    const partes = texto.replace(/\s+/g, '').match(/[A-Za-z_]\w*\[[^\]]*\]|[A-Za-z_]\w*|\d+|[()+\-*/%]/g);
    if (!partes || partes.join('') !== texto.replace(/\s+/g, '')) return null;
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
      if (t === '-') return -primario();
      if (/^\d+$/.test(t)) return Number(t);
      const clave = posicionNormal(t, modelo) ?? t;
      if (!entorno.has(clave)) falla();
      return entorno.get(clave);
    }
    function producto() {
      let v = primario();
      while (partes[i] === '*' || partes[i] === '/' || partes[i] === '%') {
        const op = partes[i++];
        const w = primario();
        if (op !== '*' && w === 0) falla();
        v = op === '*' ? v * w : op === '/' ? Math.trunc(v / w) : v % w;
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

  // Intercambiar dos posiciones. Se sigue lo que escribio, sentencia por
  // sentencia, con dos valores cualquiera (7 y 3): al final cada posicion tiene
  // que tener el de la otra. Asi vale cualquier orden o forma que funcione
  // (con una auxiliar, o con sumas y restas), y se dice por que no, si no anda.
  function reglaIntercambia(regla, modelo) {
    const nombre = valorDe(regla.variable);
    const A = `${nombre}[${regla.posiciones[0]}]`;
    const B = `${nombre}[${regla.posiciones[1]}]`;
    const normal = (t) => posicionNormal(t, modelo) ?? t.replace(/\s+/g, '');
    const pasos = [
      ...modelo.asignaciones
        .filter((a) => a.nuevo && a.operador === '=')
        .map((a) => ({ destino: normal(a.izquierda.texto), origen: a.derecha.texto, posicion: a.posicion, fila: a.fila })),
      ...modelo.variables
        .filter((v) => v.nuevo && v.inicial && !v.arreglo.length)
        .map((v) => ({ destino: v.nombre, origen: v.inicial.texto, posicion: v.indice, fila: v.fila })),
    ].sort((x, y) => x.posicion - y.posicion);

    const toca = pasos.filter((p) => p.destino === A || p.destino === B);
    if (!toca.length) {
      error(
        'INTERCAMBIO_FALTA',
        'No encontré el intercambio: cada una de las dos posiciones tiene que terminar con el valor que tenía la otra.'
      );
      return;
    }

    const entorno = new Map([
      [A, 7],
      [B, 3],
    ]);
    let seguro = modelo.ciclos.every((c) => !c.nuevo) && modelo.ifs.every((s) => !s.nuevo);
    for (const p of seguro ? pasos : []) {
      const v = valorConEntorno(p.origen, entorno, modelo);
      if (v == null) {
        seguro = false;
        break;
      }
      entorno.set(p.destino, v);
    }
    if (!seguro) {
      aviso(
        'INTERCAMBIO_NO_VERIFICADO',
        'No pude comprobar este intercambio. Verifique que cada posición termine con el valor que tenía la otra.',
        toca[0].fila
      );
      return;
    }

    const a = entorno.get(A);
    const b = entorno.get(B);
    if (a === 3 && b === 7) return;
    if (a === b) {
      // El valor que se perdio: si una variable lo tiene guardado, lo que falta es
      // devolverlo; si no, nunca se guardo.
      const perdido = a === 7 ? 3 : 7;
      const guardado = [...entorno.entries()].some(([clave, valor]) => !clave.includes('[') && valor === perdido);
      if (guardado) {
        error(
          'INTERCAMBIO_INCOMPLETO',
          'Falta completar el intercambio: el valor que se guardó en la variable auxiliar tiene que volver a la otra posición.',
          toca[toca.length - 1].fila
        );
      } else {
        error(
          'INTERCAMBIO_SIN_AUXILIAR',
          'Las dos posiciones terminan con el mismo valor: cuando se copia una sobre la otra, el valor que tenía se pierde. Antes de copiarlo hay que guardarlo en otra variable.',
          toca[0].fila
        );
      }
      return;
    }
    error(
      'INTERCAMBIO_INCOMPLETO',
      'Falta completar el intercambio: cada una de las dos posiciones tiene que terminar con el valor que tenía la otra.',
      toca[toca.length - 1].fila
    );
  }

  // ---- leer y mostrar ---------------------------------------------------------

  // Si un argumento es justo lo que pedia la consigna, escrito como sea.
  function coincide(esperado, real) {
    if (!real) return false;
    if (esTexto(esperado)) {
      return real.clase === 'cadena' && sinFinEscrito(real.contenido).texto === esperado.slice(1, -1);
    }
    if (esCampo(esperado)) {
      return real.clase === 'campo' && sinEspacios(real.texto) === sinEspacios(esperado);
    }
    if (esIndexado(esperado)) {
      return real.clase === 'indice' && sinEspacios(real.texto) === sinEspacios(esperado);
    }
    // Un numero escrito o una variable con &.
    if (/^-?\d+(\.\d+)?$/.test(esperado) || esperado.startsWith('&') || /[+\-*/%]/.test(esperado)) {
      return sinEspacios(real.texto) === sinEspacios(esperado);
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
    let lugar = variable ? valorDeDimension(variable.arreglo[indices] ?? '', modelo) : null;
    // Un campo de una estructura: el lugar es el de su arreglo.
    if (esCampo(esperado)) {
      const campo = campoDeEstructura(esperado, modelo);
      lugar = campo ? valorDeDimension(campo.arreglo[0] ?? '', modelo) : null;
    }
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
        // Una nota y no una mejora: la respuesta esta completa, y gets es lo que
        // se usa para practicar. Solo la primera vez, y aunque la serie no
        // tenga la practica de claridad.
        if (!avisados.includes('USO_DE_GETS')) {
          nota(
            'USO_DE_GETS',
            'Su respuesta es correcta. Solo una advertencia: `gets` no controla cuánto texto se escribe, y por eso se lo considera peligroso. Sirve para practicar, pero no se usa en programas reales. Una alternativa más segura es la función `fgets`.',
            l.fila
          );
        }
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

  // Leer en una variable y copiarla despues, con strcpy, a donde pide la consigna
  // (una posicion de un arreglo): vale, con mejora, si lo leido entra. Devuelve
  // true si es lo que escribio el alumno. "dentro" limita donde se busca (un ciclo).
  function lecturaConIntermedia(esperado, formato, modelo, dentro = () => true) {
    const copia = modelo.llamadas.find(
      (c) =>
        c.nuevo &&
        dentro(c) &&
        ['strcpy', 'strncpy'].includes(c.funcion) &&
        coincide(esperado, c.argumentos[0]) &&
        c.argumentos[1]?.clase === 'nombre'
    );
    if (!copia) return false;
    const intermedia = copia.argumentos[1].nombre;
    const lectura = modelo.llamadas.find(
      (x) =>
        x.nuevo &&
        dentro(x) &&
        LECTURAS.includes(x.funcion) &&
        destinoDeLectura(x)?.clase === 'nombre' &&
        destinoDeLectura(x).nombre === intermedia &&
        x.fin <= copia.posicion
    );
    if (!lectura) return false;

    const antes = diagnosticos.length;
    verificarLectura(lectura, intermedia, formato, modelo);
    if (diagnosticos.length > antes && diagnosticos.slice(antes).some((d) => d.nivel === "error")) return true;

    // Lo que se lee tiene que entrar en la posicion donde se copia.
    const base = /^[A-Za-z_]\w*/.exec(esperado)[0];
    const indices = (esperado.match(/\[/g) || []).length;
    const deLaLectura = modelo.variables.findLast((v) => v.nombre === intermedia);
    const deLaPosicion = modelo.variables.findLast((v) => v.nombre === base);
    const cabe = deLaLectura ? valorDeDimension(deLaLectura.arreglo[0] ?? '', modelo) : null;
    const lugar = deLaPosicion ? valorDeDimension(deLaPosicion.arreglo[indices] ?? '', modelo) : null;
    if (cabe != null && lugar != null && cabe > lugar) {
      error(
        'LECTURA_MAS_GRANDE_QUE_LA_POSICION',
        `\`${intermedia}\` puede guardar ${cabe} caracteres y cada texto de \`${base}\` tiene lugar para ${lugar}: al copiarlo puede no entrar.`,
        copia.fila
      );
      return true;
    }
    if (practicas.includes('claridad')) {
      mejora(
        'LECTURA_CON_INTERMEDIA',
        `Está bien, pero \`${lectura.funcion}\` puede guardar el texto directamente en \`${esperado}\`, sin pasar por otra variable.`,
        lectura.fila
      );
    }
    return true;
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
    if (esIndexado(esperado) && lecturaConIntermedia(esperado, regla.formato, modelo)) return;
    const l = lecturas.find((x) => destinoDeLectura(x)?.nombre === base) || lecturas[0];
    // Se leyo en otra variable y no se copio: eso es lo que falta, no que el argumento este mal.
    const destino = destinoDeLectura(l);
    if (esIndexado(esperado) && destino?.clase === 'nombre' && destino.nombre !== base) {
      error(
        'LECTURA_FALTA_COPIAR',
        `Lo que se lee queda en \`${destino.nombre}\`: falta copiarlo a \`${esperado}\`.`,
        l.fila
      );
      return;
    }
    verificarLectura(l, esperado, regla.formato, modelo);
  }

  // Una llamada que muestra la cadena: "formato" es el texto que pide la consigna
  // (sin el salto de linea del final), o nada si alcanza con mostrarla. Dice el
  // error y devuelve false, o devuelve true si esta bien.
  function verificarSalida(l, formato, esperado, modelo) {
    if (l.funcion === 'puts') {
      if (formato && formato !== '%s') {
        error(
          'FUNCION_EQUIVOCADA',
          '`puts` muestra solo la cadena y termina con un salto de línea: para escribir el saludo y el nombre en la misma línea hace falta `printf`.',
          l.fila
        );
        return false;
      }
      if (l.argumentos.length !== 1) {
        error('ARGUMENTOS_CANTIDAD', '`puts` lleva un solo argumento: la cadena que se muestra.', l.fila);
        return false;
      }
      if (!coincide(esperado, l.argumentos[0])) {
        diagnosticarArgumento(l, 0, esperado, l.argumentos[0], modelo);
        return false;
      }
      return true;
    }

    const formatoReal = l.argumentos[0];
    if (!formatoReal) {
      error('ARGUMENTOS_CANTIDAD', '`printf` lleva, como mínimo, el formato: un texto entre comillas dobles.', l.fila);
      return false;
    }
    if (formatoReal.clase !== 'cadena') {
      error(
        'PRINTF_SIN_FORMATO',
        'El primer argumento de `printf` es el formato: un texto entre comillas dobles que lleva `%s` en el lugar donde va el contenido de la cadena.',
        l.fila
      );
      return false;
    }
    const conversiones = formatoReal.contenido.replace(/%%/g, '').match(/%[-+ #0]*\d*(?:\.\d+)?[a-zA-Z]/g) || [];
    if (!conversiones.length) {
      error(
        'MUESTRA_TEXTO_FIJO',
        `Eso escribe en pantalla el texto tal cual: para mostrar lo que guarda \`${esperado}\` el formato lleva \`%s\`, que se reemplaza por el contenido de la cadena.`,
        l.fila
      );
      return false;
    }
    const mala = conversiones.find((c) => !c.endsWith('s'));
    if (mala) {
      error(
        'FORMATO_NO_ES_TEXTO',
        `\`${mala}\` no es el formato de un texto: cada tipo de dato tiene el suyo, y el de una cadena es \`%s\`.`,
        l.fila
      );
      return false;
    }
    const valores = l.argumentos.length - 1;
    if (valores !== conversiones.length) {
      error(
        'ARGUMENTOS_CANTIDAD',
        `El formato pide ${conversiones.length === 1 ? '1 valor' : `${conversiones.length} valores`} y \`printf\` recibe ${valores}: hace falta uno por cada \`%s\`, separados por coma.`,
        l.fila
      );
      return false;
    }
    for (let i = 1; i < l.argumentos.length; i++) {
      if (!coincide(esperado, l.argumentos[i])) {
        diagnosticarArgumento(l, i, esperado, l.argumentos[i], modelo);
        return false;
      }
    }
    if (formato) {
      // El salto de linea del final es un detalle: no cambia el mensaje.
      const escrito = formatoReal.contenido.replace(/(\\n)+$/, '');
      if (escrito !== formato) {
        error(
          'TEXTO_DISTINTO',
          escrito.toLowerCase() === formato.toLowerCase()
            ? 'El texto no es el de la consigna: en C las mayúsculas y las minúsculas son letras distintas.'
            : 'El texto que se muestra no es el que pide la consigna.',
          l.fila
        );
        return false;
      }
    }
    return true;
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

    // Si la consigna pide "Hola, %s", vale un solo printf con ese formato o el
    // saludo en una llamada y el nombre en la que sigue: en pantalla es lo mismo.
    const saludo = regla.formato && /^[^%]+%s$/.test(regla.formato) ? regla.formato.slice(0, -2) : null;
    const soloTexto = (x) =>
      x.funcion === 'printf' &&
      x.argumentos.length === 1 &&
      x.argumentos[0].clase === 'cadena' &&
      !x.argumentos[0].contenido.replace(/%%/g, '').includes('%');
    const muestraLaVariable = (x) =>
      (x.funcion === 'puts' && coincide(esperado, x.argumentos[0])) ||
      (x.funcion === 'printf' &&
        x.argumentos.length === 2 &&
        x.argumentos[0].clase === 'cadena' &&
        /^%s(\\n)*$/.test(x.argumentos[0].contenido) &&
        coincide(esperado, x.argumentos[1]));

    if (saludo && soloTexto(l)) {
      const escrito = l.argumentos[0].contenido;
      if (escrito !== saludo) {
        if (escrito.replace(/(\\n)+$/, '') === saludo) {
          error(
            'MUESTRA_SALTO_ENTRE_MEDIO',
            'Ese `\\n` hace que el nombre se muestre en otra línea: el saludo y el nombre tienen que quedar en la misma.',
            l.fila
          );
        } else {
          error(
            'TEXTO_DISTINTO',
            escrito.toLowerCase() === saludo.toLowerCase()
              ? 'El texto no es el de la consigna: en C las mayúsculas y las minúsculas son letras distintas.'
              : 'El texto que se muestra no es el que pide la consigna.',
            l.fila
          );
        }
        return;
      }
      if (salidas.length < 2) {
        error(
          'MUESTRA_FALTA_EL_NOMBRE',
          `Falta mostrar lo que guarda \`${esperado}\`, a continuación del saludo.`,
          l.fila
        );
        return;
      }
      if (!verificarSalida(salidas[1], '%s', esperado, modelo)) return;
    } else {
      if (saludo && muestraLaVariable(l) && salidas.slice(1).some((x) => soloTexto(x) && x.argumentos[0].contenido === saludo)) {
        error('MUESTRA_EN_OTRO_ORDEN', `El saludo va primero: \`${saludo}\` se escribe antes que el nombre.`, l.fila);
        return;
      }
      if (!verificarSalida(l, regla.formato, esperado, modelo)) return;
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
    verificarLimpieza(lectura, anterior, modelo, () =>
      error(
        'FALTA_LIMPIAR_ENTRADA',
        `Después de leer con \`scanf\` queda el Enter sin leer, y \`${lectura.funcion}\` lo toma como si fuera lo escrito: el texto queda vacío. Antes de leer hay que descartarlo.`,
        lectura.fila
      )
    );
  }

  // Lo que hay entre un scanf y la lectura que sigue para descartar el Enter que
  // quedo sin leer. "faltante" dice el error si no hay nada.
  function verificarLimpieza(lectura, anterior, modelo, faltante) {
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
    faltante();
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
    // Con "unidades" (["cursos", "alumnos", "parciales"]) cada corchete tiene su nombre.
    const unidades = minimo.unidades;
    const unidad = (k) =>
      unidades?.[k] ?? (pedidos.length === 3 ? (k === 0 ? 'filas' : 'columnas') : esTabla ? 'textos' : 'elementos');
    let bien = true;

    // Dos numeros de una tabla, uno por otro.
    if (esTabla) {
      const escritos = pedidos.map((_, k) => valorDeDimension(declarado.arreglo[k] ?? '', modelo));
      const lugares = pedidos.length === 3 ? ['primeros', 'segundos', 'últimos'] : ['primeros', 'segundos'];
      const que = unidades
        ? unidades.map((u, k) => (k === 0 ? `la cantidad de ${u}` : `la de ${u}`))
        : pedidos.length === 3
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
        if (!propia && lecturaConIntermedia(aqui, regla.lee, modelo, dentro)) {
          // leyo en una variable y la copio a la posicion
        } else if (!propia) {
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
      error('ALIAS_PUNTERO', `A \`${a.nombre}\` le sobra el \`*\`: el alias tiene que ser de una cadena, un \`char\` con su dimensión.`, a.fila);
    } else if (real.clase !== 'primitivo' || real.nombre !== 'char') {
      error(
        'ALIAS_TIPO',
        `\`${a.nombre}\` es un alias de ${enPalabras(a)}. Para guardar un texto tiene que ser un alias de una cadena: un \`char\` con su dimensión.`,
        a.fila
      );
    } else if (!a.arreglo.length) {
      error(
        'ALIAS_NO_ES_CADENA',
        `\`${a.nombre}\` es un alias de un solo carácter. Para guardar un texto tiene que ser un alias de una cadena: un \`char\` con su dimensión entre corchetes.`,
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
      // Con "nombre", el alias tiene que llamarse asi (las que siguen lo usan).
      if (regla.nombre && exacto.nombre !== regla.nombre) {
        error(
          'ALIAS_NOMBRE',
          `La consigna pide que el alias se llame \`${regla.nombre}\`, y acá se llama \`${exacto.nombre}\`.`,
          exacto.fila
        );
      }
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
// La estructura de una variable ("struct Alumno alumno;", o con un alias), o null.
// La estructura a la que corresponde un tipo (con etiqueta, con alias o sin nombre).
function estructuraDeTipo(tipo, modelo, vistos = 0) {
  if (vistos > 5) return null;
  if (tipo.clase === 'struct') {
    return tipo.defId != null
      ? modelo.structs.find((s) => s.id === tipo.defId) || null
      : modelo.structs.findLast((s) => s.etiqueta === tipo.etiqueta && Boolean(s.union) === Boolean(tipo.union)) || null;
  }
  if (tipo.clase === 'nombre') {
    const alias = modelo.aliases.findLast((a) => a.nombre === tipo.nombre);
    return alias && !alias.arreglo.length && !alias.punteros ? estructuraDeTipo(alias.tipo, modelo, vistos + 1) : null;
  }
  return null;
}

function estructuraDeVariable(variable, modelo, indexada = false) {
  return variable.punteros || (variable.arreglo.length && !indexada) ? null : estructuraDeTipo(variable.tipo, modelo);
}

// La estructura de un camino ("alumno", "alumnos[0]", "alumno.nacimiento"),
// bajando un nivel por cada campo, o null.
function estructuraDeCamino(texto, modelo) {
  const m = /^([A-Za-z_]\w*)((?:\[[^\]]*\])*)((?:\.[A-Za-z_]\w*)*)$/.exec(texto.replace(/\s+/g, ''));
  if (!m) return null;
  const variable = modelo.variables.findLast((v) => v.nombre === m[1]);
  if (!variable) return null;
  let def = estructuraDeVariable(variable, modelo, Boolean(m[2]));
  for (const nombre of m[3].split('.').filter(Boolean)) {
    const campo = def && def.campos.find((c) => c.nombre === nombre);
    if (!campo || campo.punteros || campo.arreglo.length) return null;
    def = estructuraDeTipo(campo.tipo, modelo);
  }
  return def;
}

// Lo que esta mal en la forma de llegar a un campo ("alumno.legajo"), o null si
// esta bien o no es un campo. "nombre" es la variable que corresponde y "def" su
// estructura. Devuelve [codigo, mensaje].
function problemaDeCampo(valor, nombre, def, modelo) {
  const campos = def ? def.campos.map((c) => c.nombre) : [];
  if (valor.clase === 'nombre' && campos.includes(valor.nombre)) {
    return [
      'CAMPO_SIN_VARIABLE',
      `\`${valor.nombre}\` es un ${def.union ? 'miembro de la unión' : 'campo de la estructura'}, no una variable: para llegar a él hay que decir de qué variable es, con un punto: \`${nombre}.${valor.nombre}\`.`,
    ];
  }
  if (valor.clase !== 'campo') return null;
  const esTipo =
    modelo.structs.some((s) => s.etiqueta === valor.variable) ||
    modelo.aliases.some((a) => a.nombre === valor.variable);
  if (esTipo) {
    return [
      'TIPO_EN_VEZ_DE_VARIABLE',
      `\`${valor.variable}\` es el nombre ${def && def.union ? 'de la unión' : 'de la estructura'}, no el de una variable: los datos se guardan en la variable \`${nombre}\`, así que va \`${nombre}.${valor.campo}\`.`,
    ];
  }
  const sinEsp = (x) => x.replace(/\s+/g, '');
  const elemento = /^([A-Za-z_]\w*)((?:\[[^\]]*\])+)$/.exec(sinEsp(nombre));
  const dado = /^([A-Za-z_]\w*)((?:\[[^\]]*\])*)$/.exec(sinEsp(valor.variable));
  if (elemento && dado && dado[1] === elemento[1]) {
    const arreglo = modelo.variables.findLast((v) => v.nombre === elemento[1]);
    if (!dado[2]) {
      return [
        'ARREGLO_SIN_INDICE',
        `\`${elemento[1]}\` es un arreglo de estructuras: hay que indicar cuál con un índice, como \`${nombre}.${valor.campo}\`.`,
      ];
    }
    const posicion = valorDeDimension(dado[2].slice(1, -1), modelo);
    const tamano = arreglo ? valorDeDimension(arreglo.arreglo[0] ?? '', modelo) : null;
    if (posicion != null && tamano != null && posicion >= tamano) {
      return [
        'INDICE_FUERA_DE_RANGO',
        `\`${elemento[1]}\` tiene ${tamano} posiciones, numeradas de 0 a ${tamano - 1}: la posición ${posicion} no existe.`,
      ];
    }
    if (sinEsp(valor.variable) !== sinEsp(nombre)) {
      return [
        'ARGUMENTO_OTRA_POSICION',
        `\`${valor.variable}\` no es la posición que pide la consigna: acá hay que usar \`${nombre}\`.`,
      ];
    }
  }
  // Un campo de una estructura de adentro, dicho un nivel mas arriba (alumno.anio).
  const dicho = sinEsp(valor.variable);
  const pedido = sinEsp(nombre);
  if (dicho !== pedido && pedido.startsWith(dicho + '.')) {
    const resto = pedido.slice(dicho.length + 1);
    // Se le guarda un numero a la estructura entera (alumno.nacimiento = 2004).
    if (pedido === dicho + '.' + valor.campo) {
      return [
        'CAMPO_ES_UNA_ESTRUCTURA',
        def && def.union
          ? `\`${pedido}\` es una unión entera: no se le guarda un número. Se guarda en uno de sus miembros, como \`${pedido}.${campos[0] || 'miembro'}\`.`
          : `\`${pedido}\` es una estructura entera, con varios campos adentro: no se le guarda un número. Hay que guardar en cada uno de sus campos, como \`${pedido}.${campos[0] || 'campo'}\`.`,
      ];
    }
    // Un campo de la variable de afuera que esta regla no pide (lectura.tipo, cuando
    // la regla es de lectura.medida): no es un error de llegar al campo.
    const afuera = estructuraDeCamino(valor.variable, modelo);
    if (!campos.includes(valor.campo) && afuera && afuera.campos.some((c) => c.nombre === valor.campo)) return null;
    return campos.includes(valor.campo)
      ? [
          'CAMPO_DE_OTRO_NIVEL',
          `\`${valor.campo}\` es un campo de \`${resto}\`, no de \`${valor.variable}\`: hay que bajar un nivel, \`${nombre}.${valor.campo}\`.`,
        ]
      : [
          'CAMPO_NO_EXISTE',
          `\`${nombre}\` no tiene ningún campo llamado \`${valor.campo}\`.${campos.length ? ` Sus campos son ${campos.map((c) => '\`' + c + '\`').join(', ')}.` : ''}`,
        ];
  }
  // Un campo de una estructura de adentro (lectura.medida.real), cuando la regla es
  // de la de afuera (lectura): otro nivel, que esta regla no revisa.
  if (dicho.startsWith(pedido + '.') && def && !campos.includes(valor.campo)) return null;
  // Otra estructura de adentro del mismo lugar (alumno.ingreso en vez de alumno.nacimiento).
  const raiz = (x) => x.split('.')[0].replace(/\[[\s\S]*$/, '');
  if (dicho !== pedido && dicho.includes('.') && pedido.includes('.') && raiz(dicho) === raiz(pedido)) {
    return [
      'CAMPO_OTRA_ESTRUCTURA',
      `La consigna pide \`${nombre}.${valor.campo}\`, y acá se usa \`${valor.variable}.${valor.campo}\`: es otra estructura de adentro.`,
    ];
  }
  if (sinEsp(valor.variable) !== sinEsp(nombre)) {
    return [
      'VARIABLE_DESCONOCIDA',
      `No hay ninguna variable llamada \`${valor.variable}\`.` +
        (valor.variable.toLowerCase() === nombre.toLowerCase()
          ? ` La que está declarada es \`${nombre}\`: en C las mayúsculas y las minúsculas son letras distintas.`
          : ''),
    ];
  }
  if (valor.operador === '->') {
    return [
      'FLECHA_CON_VARIABLE',
      `La flecha \`->\` se usa con punteros. \`${nombre}\` es una variable común: para llegar a un campo se usa el punto, \`${nombre}.${valor.campo}\`.`,
    ];
  }
  if (def && !campos.includes(valor.campo)) {
    const parecido = campos.find(
      (c) => c.toLowerCase() === valor.campo.toLowerCase() || distancia(c, valor.campo) <= 2
    );
    return [
      'CAMPO_NO_EXISTE',
      (def.union ? `La unión no tiene ningún miembro llamado \`${valor.campo}\`.` : `La estructura no tiene ningún campo llamado \`${valor.campo}\`.`) +
        (parecido
          ? ` ¿Quiso escribir \`${parecido}\`? En C las mayúsculas y las minúsculas son letras distintas.`
          : ` Sus ${def.union ? 'miembros' : 'campos'} son ${campos.map((c) => '\`' + c + '\`').join(', ')}.`),
    ];
  }
  return null;
}

// Las funciones de la biblioteca que se usan en las series.
const DE_LA_BIBLIOTECA_C = new Set([
  'printf', 'scanf', 'gets', 'fgets', 'puts', 'putchar', 'getchar', 'strlen', 'strcpy', 'strncpy', 'strcmp',
  'strncmp', 'strcat', 'strncat', 'strchr', 'strstr', 'toupper', 'tolower', 'isalpha', 'isdigit', 'isspace',
  'isupper', 'islower', 'isalnum', 'pow', 'sqrt', 'abs', 'fabs', 'rand', 'srand', 'time', 'exit', 'atoi',
  'atof', 'fflush', 'sprintf', 'sscanf',
]);

// Llamar a lo que no existe, o a una funcion antes de que este definida o
// declarada. Solo cuando el programa define funciones propias.
// Si la consigna tiene la regla "llamada", esa ya dice lo que corresponde.
function revisarFunciones(modelo, error, conReglaDeLlamada = false, conCodigoDelSistema = false) {
  const propias = modelo.funciones.filter((f) => !NO_ES_DEL_ALUMNO.includes(f.nombre));
  if (!propias.length) return;
  const nombres = [...new Set(propias.map((f) => f.nombre))];
  const delSistema = modelo.funciones.filter((f) => NO_ES_DEL_ALUMNO.includes(f.nombre));
  for (const l of modelo.llamadas.filter((x) => x.nuevo)) {
    // Una llamada del codigo que la consigna da (main llamando a lo que el alumno escribe)
    // a una funcion que no existe: lo dice la regla de la funcion, no es un error aparte.
    const enElSistema = conCodigoDelSistema && delSistema.some((f) => f.posicion <= l.posicion && l.posicion < f.fin);
    if (enElSistema && !nombres.includes(l.funcion)) continue;
    if (!/^[A-Za-z_]\w*$/.test(l.funcion) || DE_LA_BIBLIOTECA_C.has(l.funcion)) continue;
    // Un tipo escrito como funcion lo dice revisarConversiones.
    if (TIPOS_PRIMITIVOS.has(l.funcion) || modelo.aliases.some((a) => a.nombre === l.funcion)) continue;
    if (!nombres.includes(l.funcion)) {
      if (conReglaDeLlamada) continue;
      const parecida = nombres.find(
        (n) => n.toLowerCase() === l.funcion.toLowerCase() || distancia(n, l.funcion) <= 2
      );
      error(
        'FUNCION_NO_DECLARADA',
        parecida
          ? `No hay ninguna función llamada \`${l.funcion}\`. ¿Quiso decir \`${parecida}\`? En C las mayúsculas y las minúsculas son letras distintas.`
          : `No hay ninguna función llamada \`${l.funcion}\`: hay que definirla antes de llamarla.`,
        l.fila
      );
      return;
    }
    const definicion = propias.find((f) => !f.prototipo && f.nombre === l.funcion);
    const prototipoAntes = propias.some((f) => f.prototipo && f.nombre === l.funcion && f.posicion < l.posicion);
    if (definicion && definicion.posicion > l.posicion && !prototipoAntes) {
      error(
        'LLAMADA_ANTES_DE_DEFINIR',
        `\`${l.funcion}\` se llama antes de estar definida: hay que definirla más arriba o declarar su prototipo antes de usarla.`,
        l.fila
      );
      return;
    }
  }
}

// Un tipo escrito como una funcion, TTurno(opcion) o float(x): eso es de C++.
// En C la conversion lleva el tipo entre parentesis, delante del valor.
const TIPOS_PRIMITIVOS = new Set(['int', 'float', 'double', 'char', 'long', 'short']);
function revisarConversiones(modelo, error) {
  const tipos = new Set([...modelo.aliases.map((a) => a.nombre), ...TIPOS_PRIMITIVOS]);
  const l = modelo.llamadas.find((x) => x.nuevo && tipos.has(x.funcion));
  if (!l) return;
  const argumentos = l.argumentos.map((a) => a.texto).join(', ');
  // Una cuenta entre parentesis, para que la conversion sea de toda la cuenta.
  const valor = /^[\w.]+$/.test(argumentos) ? argumentos : `(${argumentos})`;
  error(
    'CONVERSION_COMO_FUNCION',
    `${BT}${l.funcion}(${argumentos})${BT} se lee como la llamada a una función, pero ${BT}${l.funcion}${BT} es un tipo. Para convertir un valor a un tipo, el tipo va entre paréntesis y delante del valor: ${BT}(${l.funcion}) ${valor}${BT}.`,
    l.fila
  );
}

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
      if (real.de === 'enum') {
        error('TIPO_DESCONOCIDO', `No hay ningún enumerado llamado \`${nombre}\`.`, uso.fila);
        continue;
      }
      // Una estructura y una union se piden con palabras distintas: no se mezclan.
      const esUnion = Boolean(real.union);
      const palabra = esUnion ? 'union' : 'struct';
      let mensaje = esUnion
        ? `No hay ninguna unión llamada \`${nombre}\`.`
        : `No hay ninguna estructura llamada \`${nombre}\`.`;
      const delMismoTipo = (s) => Boolean(s.union) === esUnion;
      const parecida = modelo.structs.find((s) => delMismoTipo(s) && s.etiqueta && s.etiqueta.toLowerCase() === enMinuscula);
      const deOtroTipo = modelo.structs.find((s) => !delMismoTipo(s) && s.etiqueta === nombre);
      if (parecida) {
        mensaje += ` La que está declarada es \`${parecida.etiqueta}\`: en C las mayúsculas y las minúsculas son letras distintas.`;
      } else if (deOtroTipo) {
        mensaje += esUnion
          ? ` \`${nombre}\` es una estructura: se la nombra con \`struct ${nombre}\`.`
          : ` \`${nombre}\` es una unión: se la nombra con \`union ${nombre}\`.`;
      } else if (modelo.aliases.some((a) => a.nombre === nombre)) {
        mensaje += ` \`${nombre}\` es un alias: se usa solo, sin la palabra \`${palabra}\`.`;
      }
      error('TIPO_DESCONOCIDO', mensaje, uso.fila);
      continue;
    }

    let mensaje = `\`${nombre}\` no es un tipo que exista.`;
    const alias = modelo.aliases.find((a) => a.nombre.toLowerCase() === enMinuscula);
    const parecido = TIPOS_BASICOS.find((t) => t.length > 3 && distancia(t, enMinuscula) === 1);
    if (TIPOS_BASICOS.includes(enMinuscula)) {
      mensaje += ` Las palabras de C van todas en minúscula: \`${enMinuscula}\`.`;
    } else if (modelo.structs.some((s) => s.etiqueta === nombre && s.union)) {
      mensaje = `\`${nombre}\` es el nombre de una unión, pero así solo no es un tipo: falta la palabra \`union\`, como en \`union ${nombre}\`.`;
    } else if (modelo.structs.some((s) => s.etiqueta === nombre)) {
      mensaje = `\`${nombre}\` es el nombre de una estructura, pero así solo no es un tipo: falta indicar que se trata de una estructura.`;
    } else if (modelo.enums.some((e) => e.etiqueta === nombre)) {
      mensaje = `\`${nombre}\` es el nombre de un enumerado, pero así solo no es un tipo: falta la palabra \`enum\`, como en \`enum ${nombre}\`.`;
    } else if (alias) {
      mensaje += ` El alias está definido como \`${alias.nombre}\`: en C las mayúsculas y las minúsculas son letras distintas.`;
    } else if (enMinuscula === 'string') {
      mensaje += ' En C no hay un tipo para los textos: se guardan en una cadena, un arreglo de `char` que termina en `\\0`.';
    } else if (enMinuscula === 'boolean' || enMinuscula === 'integer' || enMinuscula === 'real') {
      mensaje += ' Ese nombre es de otro lenguaje: en C los tipos básicos se llaman distinto.';
    } else if (parecido) {
      mensaje += ` ¿Quiso escribir \`${parecido}\`?`;
    }
    error('TIPO_DESCONOCIDO', mensaje, uso.fila);
  }

  for (const s of modelo.structs.filter((x) => x.nuevo && x.etiqueta)) {
    if (modelo.structs.some((otro) => otro !== s && otro.id < s.id && otro.etiqueta === s.etiqueta && Boolean(otro.union) === Boolean(s.union))) {
      error(
        'STRUCT_REDEFINIDA',
        `${s.union ? 'La unión' : 'La estructura'} \`${s.etiqueta}\` ya está declarada: no hay que escribirla de nuevo, solo lo que pide esta consigna.`,
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
  // Las locales de dos funciones distintas pueden llamarse igual.
  const funcionDe = (x) => modelo.funciones.find((f) => !f.prototipo && f.posicion <= x.indice && x.indice < f.fin);
  for (const v of modelo.variables.filter((x) => x.nuevo)) {
    const antes = modelo.variables.find(
      (w) =>
        w !== v &&
        w.nombre === v.nombre &&
        w.local === v.local &&
        w.indice < v.indice &&
        (!v.local || funcionDe(w) === funcionDe(v))
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
    // Un campo que es una cadena: alumno.apellidoNombre = "Perez";
    if (izquierda.clase === 'campo') {
      // El elemento de un arreglo de estructuras (alumnos[1]): su variable es alumnos.
      const sinIndice = izquierda.variable.replace(/\s*\[[\s\S]*$/, '');
      const dueno = modelo.variables.findLast((v) => v.nombre === sinIndice);
      const def = dueno && estructuraDeVariable(dueno, modelo, sinIndice !== izquierda.variable);
      const campo = def && def.campos.find((c) => c.nombre === izquierda.campo);
      if (campo && !campo.punteros && campo.arreglo.length && esChar(campo)) {
        const clave = 'ASIGNACION_DE_ARREGLO:' + izquierda.texto;
        if (!repetidas.has(clave)) {
          repetidas.set(clave, {
            codigo: 'ASIGNACION_DE_ARREGLO',
            mensaje: aconsejarFuncion
              ? `\`${izquierda.texto}\` es una cadena: no se puede asignar completa con \`=\`. Para guardar un texto o copiar otra cadena se usa una función de la biblioteca de cadenas.`
              : `\`${izquierda.texto}\` es un arreglo: no se puede asignar completo con \`=\`.`,
            fila: a.fila,
            veces: 1,
          });
        } else {
          repetidas.get(clave).veces++;
        }
      }
      continue;
    }
    if (izquierda.clase !== 'nombre' && izquierda.clase !== 'indice') continue;
    const variable = modelo.variables.findLast((v) => v.nombre === izquierda.nombre);
    if (!variable || variable.punteros) continue;
    const esCadena = esChar(variable);

    if (izquierda.clase === 'nombre') {
      if (!variable.arreglo.length) continue;
      error(
        'ASIGNACION_DE_ARREGLO',
        esCadena && aconsejarFuncion
          ? `\`${variable.nombre}\` es una cadena: no se puede asignar completa con \`=\`. Para guardar un texto o copiar otra cadena se usa una función de la biblioteca de cadenas.`
          : `\`${variable.nombre}\` es un arreglo: no se puede asignar completo con \`=\`.`,
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

// Un arreglo de estructuras usado sin decir cual de sus elementos
// (alumnos.legajo, &alumnos.legajo): en C eso no existe.
function revisarCampos(modelo, error) {
  const dichos = new Set();
  const revisar = (valor, fila) => {
    if (!valor) return;
    let variable = null;
    if (valor.clase === 'campo') variable = valor.variable;
    else if (valor.clase === 'direccion' && valor.campo) variable = valor.nombre.replace(/\s*(->|\.)[\s\S]*$/, '');
    else {
      // alumnos.legajo[i], &alumnos.legajo[i]: el indice va en el arreglo de estructuras.
      const m = /^&?\s*([A-Za-z_]\w*)\s*\.\s*[A-Za-z_]\w*\s*\[/.exec(valor.texto || '');
      if (m) variable = m[1];
    }
    if (!variable || !/^[A-Za-z_]\w*$/.test(variable) || dichos.has(variable)) return;
    const declarada = modelo.variables.findLast((v) => v.nombre === variable);
    if (!declarada || declarada.punteros || !declarada.arreglo.length) return;
    const def = estructuraDeVariable(declarada, modelo, true);
    if (!def) return;
    dichos.add(variable);
    error(
      'ARREGLO_SIN_INDICE',
      `\`${variable}\` es un arreglo de estructuras: hay que indicar cuál de sus elementos se usa, con un índice, como \`${variable}[0].${def.campos[0]?.nombre || 'campo'}\`.`,
      fila
    );
  };
  // Cada acceso a un campo, en una condicion, una cuenta o un argumento.
  const sinEncontrar = new Set();
  for (const c of modelo.camposUsados) {
    if (!c.nuevo) continue;
    revisar({ clase: 'campo', variable: c.variable, campo: c.campo, texto: `${c.variable}.${c.campo}` }, c.fila);
    // Un campo que la estructura no tiene (o que esta un nivel mas adentro).
    const def = estructuraDeCamino(c.variable, modelo);
    const clave = `${c.variable}.${c.campo}`;
    if (!def || sinEncontrar.has(clave) || def.campos.some((campo) => campo.nombre === c.campo)) continue;
    sinEncontrar.add(clave);
    const donde = def.campos.filter((campo) => {
      const dentro = estructuraDeTipo(campo.tipo, modelo);
      return dentro && !campo.punteros && !campo.arreglo.length && dentro.campos.some((x) => x.nombre === c.campo);
    });
    if (donde.length) {
      const lista = donde.map((x) => '\`' + x.nombre + '\`').join(' y ');
      error(
        'CAMPO_DE_OTRO_NIVEL',
        `\`${c.campo}\` no es un campo de \`${c.variable}\`: está adentro de ${lista}, así que hay que bajar un nivel, como \`${c.variable}.${donde[0].nombre}.${c.campo}\`.`,
        c.fila
      );
    } else {
      error(
        'CAMPO_NO_EXISTE',
        `${def.union ? 'La unión no tiene ningún miembro' : 'La estructura no tiene ningún campo'} llamado \`${c.campo}\`. Sus ${def.union ? 'miembros' : 'campos'} son ${def.campos.map((x) => '\`' + x.nombre + '\`').join(', ')}.`,
        c.fila
      );
    }
  }
  for (const l of modelo.llamadas) {
    if (!l.nuevo) continue;
    for (const a of l.argumentos) revisar(a, l.fila);
  }
  for (const a of modelo.asignaciones) {
    if (!a.nuevo) continue;
    revisar(a.izquierda, a.fila);
    revisar(a.derecha, a.fila);
  }
}

// Un "=" (o "+=", "-="...) en la condicion de un if o de un ciclo: guarda un
// valor en vez de comparar. Se deja pasar el idioma "(c = getchar()) != '\n'":
// una asignacion simple, entre parentesis y comparada con algo.
function asignacionEnCondicion(condicion) {
  // Sin lo que va entre comillas, que puede tener cualquier signo.
  const t = condicion.replace(/"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/g, '""');
  const pila = [];
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '(') pila.push(i);
    else if (c === ')') pila.pop();
    if (c !== '=') continue;
    const antes = t[i - 1] || '';
    const despues = t[i + 1] || '';
    if (despues === '=' || '=!<>'.includes(antes)) continue; // ==, !=, <=, >=
    const compuesta = /[-+*/%&|^]/.test(antes);
    if (!compuesta && pila.length) {
      // El parentesis que abre mas cerca: si lo que viene despues de cerrarlo
      // es una comparacion, es el idioma de siempre.
      let nivel = 0;
      let cierre = -1;
      for (let j = pila[pila.length - 1]; j < t.length; j++) {
        if (t[j] === '(') nivel++;
        else if (t[j] === ')' && --nivel === 0) {
          cierre = j;
          break;
        }
      }
      if (cierre >= 0 && /^\s*(==|!=|<=|>=|<|>)/.test(t.slice(cierre + 1))) continue;
    }
    return true;
  }
  return false;
}

function revisarCondiciones(modelo, error) {
  const condiciones = [...modelo.ifs, ...modelo.ciclos].filter((x) => x.nuevo && x.condicion);
  const conUna = condiciones.find((x) => asignacionEnCondicion(x.condicion));
  if (!conUna) return;
  error(
    'ASIGNACION_EN_CONDICION',
    'En una condición, un solo `=` guarda un valor y no compara: para preguntar si son iguales se usa `==`.',
    conUna.fila
  );
}

// El enumerado que es la variable o el campo que nombra un texto
// ("turno", "alumno.turno", "alumnos[i].turno"), o null.
function enumDeCamino(texto, modelo, conArreglo = false) {
  const m = /^([A-Za-z_]\w*)((?:\[[^\]]*\])*)((?:\.[A-Za-z_]\w*)*)$/.exec(String(texto).replace(/\s+/g, ''));
  if (!m) return null;
  const variable = modelo.variables.findLast((v) => v.nombre === m[1]);
  if (!variable) return null;
  const deEnum = (declarado) => {
    if (declarado.punteros || declarado.arreglo.length) return null;
    const real = resolver(declarado.tipo, modelo);
    return real.clase === 'enum' ? real.def : null;
  };
  if (!m[3]) {
    // Una variable suelta, un elemento de un arreglo o de una tabla de enumerados
    // y, con "conArreglo", el arreglo o la tabla entera.
    if (variable.punteros) return null;
    const dados = (m[2].match(/\[/g) || []).length;
    if (!(variable.arreglo.length === dados || (conArreglo && dados === 0 && variable.arreglo.length > 0))) return null;
    const real = resolver(variable.tipo, modelo);
    return real.clase === 'enum' ? real.def : null;
  }
  let def = estructuraDeVariable(variable, modelo, Boolean(m[2]));
  const campos = m[3].slice(1).split('.');
  for (let k = 0; def && k < campos.length; k++) {
    const campo = def.campos.find((c) => c.nombre === campos[k]);
    if (!campo) return null;
    if (k === campos.length - 1) return deEnum(campo);
    def = campo.punteros || campo.arreglo.length ? null : estructuraDeTipo(campo.tipo, modelo);
  }
  return null;
}

// Lo que vale para cualquier consigna con un enumerado o un switch:
//  - un numero suelto donde va un nombre (mejora),
//  - leer directo en la variable del enumerado (nota),
//  - un caso del switch que sigue con el siguiente porque falta el break (error).
function revisarEnumerados(modelo, error, mejora, nota, avisados) {
  const definicion = (nombre) => (nombre ? enumDeCamino(nombre, modelo, true) : null);
  // Un nombre suelto, un campo (alumno.turno, alumnos[i].turno) o un elemento
  // de un arreglo o de una tabla (turnoDelDia[3], agenda[1][MARTES]).
  const soloNombre = (valor) =>
    valor && valor.clase === 'nombre'
      ? valor.nombre
      : valor && (valor.clase === 'campo' || valor.clase === 'indice')
        ? valor.texto
        : null;
  const conNombre = (def, numero) => def.enumeradores.find((x) => x.valor === numero);
  let dicho = false;
  const sugerir = (def, valor, fila) => {
    if (dicho || valor.clase !== 'numero') return;
    const x = conNombre(def, valor.valor);
    if (!x) return;
    dicho = true;
    mejora(
      'ENUM_CON_NUMERO',
      `Está bien, pero \`${valor.valor}\` es el valor de \`${x.nombre}\`: con el nombre, el código se entiende sin tener que recordar los números.`,
      fila
    );
  };
  // Un enumerador de otro enumerado donde va uno de este: LUNES en un TTurno.
  const nombreDeTipo = (def) => {
    const alias = modelo.aliases.find((a) => a.tipo.clase === 'enum' && a.tipo.defId === def.id && !a.punteros && !a.arreglo.length);
    return alias ? alias.nombre : def.etiqueta ? `enum ${def.etiqueta}` : 'ese enumerado';
  };
  const deOtro = (def, nombre, dondeVa, fila) => {
    const otro = modelo.enums.find((e) => e !== def && e.enumeradores.some((x) => x.nombre === nombre));
    if (!otro) return false;
    error(
      'ENUMERADOR_DE_OTRO_ENUMERADO',
      `\`${nombre}\` es un valor de \`${nombreDeTipo(otro)}\`, y ${dondeVa} guarda valores de \`${nombreDeTipo(def)}\`.`,
      fila
    );
    return true;
  };
  for (const a of modelo.asignaciones.filter((x) => x.nuevo && x.operador === '=')) {
    const def = definicion(soloNombre(a.izquierda));
    if (!def) continue;
    if (a.derecha.clase === 'nombre' && deOtro(def, a.derecha.nombre, `\`${a.izquierda.texto.trim()}\``, a.fila)) continue;
    sugerir(def, a.derecha, a.fila);
  }
  // Los valores de un arreglo o de una tabla de enumerados, al declararlo.
  for (const v of modelo.variables.filter((x) => x.nuevo && x.arreglo.length && x.inicial && x.inicial.clase === 'lista')) {
    const real = v.punteros ? null : resolver(v.tipo, modelo);
    if (!real || real.clase !== 'enum') continue;
    const planos = [];
    const aplanar = (el) => (el.clase === 'lista' ? el.elementos.forEach(aplanar) : planos.push(el));
    aplanar(v.inicial);
    // "= {0}" es la forma de dejar todo en cero: no se avisa.
    if (planos.length === 1 && planos[0].clase === 'numero' && planos[0].valor === 0) continue;
    for (const el of planos) {
      if (el.enumerador && el.enumDe !== real.def.id) {
        if (deOtro(real.def, el.enumerador, `\`${v.nombre}\``, v.fila)) break;
      } else if (el.clase === 'numero' && !el.enumerador) {
        sugerir(real.def, el, v.fila);
      }
    }
  }
  for (const c of modelo.comparaciones.filter((x) => x.nuevo)) {
    const def = definicion(soloNombre(c.izquierda));
    if (def) sugerir(def, c.derecha, c.fila);
    const otra = definicion(soloNombre(c.derecha));
    if (otra) sugerir(otra, c.izquierda, c.fila);
  }
  for (const s of modelo.switches.filter((x) => x.nuevo)) {
    const def = definicion(s.condicion.trim());
    if (!def) continue;
    for (const c of s.casos) {
      if (c.valor != null && /^\d+$/.test(c.valor)) sugerir(def, { clase: 'numero', valor: Number(c.valor) }, c.fila);
    }
  }
  // Un if o un ciclo que compara la variable del enumerado con un numero: t <= 2.
  for (const x of [...modelo.ifs, ...modelo.ciclos].filter((y) => y.nuevo && y.condicion)) {
    const m = /^\s*([A-Za-z_][\w.\[\]]*)\s*(?:<=|<|>=|>|==|!=)\s*(-?\d+)\s*$/.exec(x.condicion);
    const def = m && definicion(m[1]);
    if (def) sugerir(def, { clase: 'numero', valor: Number(m[2]) }, x.fila);
  }
  // Leer con scanf directo en una variable de enumerado: compila, pero el tipo
  // no controla el rango.
  if (!avisados.includes('SCANF_EN_ENUM')) {
    for (const l of modelo.llamadas.filter((x) => x.nuevo && x.funcion === 'scanf')) {
      const comoElemento = (a) =>
        a.clase === 'otro' && /^&\s*[A-Za-z_]\w*(\s*\[[^\]]*\])+\s*$/.test(a.texto) ? a.texto.replace(/^&\s*/, '').trim() : null;
      const directo = l.argumentos
        .map((a) => (a.clase === 'direccion' && definicion(a.nombre) ? { nombre: a.nombre } : comoElemento(a) && definicion(comoElemento(a)) ? { nombre: comoElemento(a) } : null))
        .find(Boolean);
      if (!directo) continue;
      nota(
        'SCANF_EN_ENUM',
        `Funciona, pero \`${directo.nombre}\` no es un \`int\`: el programa no controla que el número escrito sea uno de los del enumerado. Por eso conviene leer en un \`int\` y validar antes de guardarlo.`,
        l.fila
      );
      break;
    }
  }
  // Un caso con sentencias que no termina en break pasa al que sigue.
  for (const s of modelo.switches.filter((x) => x.nuevo)) {
    s.casos.forEach((c, i) => {
      if (c.vacio || c.cierra || i === s.casos.length - 1) return;
      error(
        'SWITCH_SIN_BREAK',
        `${c.valor != null ? `El caso \`${c.valor}\`` : 'El \`default\`'} sigue con el caso que viene después, porque le falta \`break\`: se ejecutan también sus sentencias.`,
        c.fila
      );
    });
  }
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
        `\`${variable.nombre}\` tiene ${lugar} ${que}, numeradas de 0 a ${lugar - 1}: la ${que === 'posiciones' ? 'posición' : que === 'filas' ? 'fila' : 'columna'} ${Number(indice)} no existe.`,
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
// "palabraDeTipo": struct, union o enum, segun lo que pide la consigna (o null).
function erroresConocidos(respuesta, palabraDeTipo = null) {
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
  // "typedef { ... } Nombre;": falta la palabra que dice que se define. Solo se dice
  // cuando la consigna pide una estructura, una union o un enumerado.
  if (palabraDeTipo) {
    const m = /\btypedef\s*\{/.exec(codigo);
    if (m) {
      hallar(
        'TYPEDEF_SIN_TIPO',
        `Después de \`typedef\` falta la palabra \`${palabraDeTipo}\`: dice qué se está definiendo. Se escribe \`typedef ${palabraDeTipo} { ... } Nombre;\`.`,
        m.index + m[0].length - 1
      );
      return hallados;
    }
  }
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
