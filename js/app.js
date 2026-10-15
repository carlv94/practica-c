// La pantalla: la lista de series y, adentro de una, sus consignas, que se
// resuelven en orden y cada una sobre lo que el alumno escribio en las
// anteriores.
//
// Que series hay lo dice consignas/indice.json. En que pantalla se esta lo
// dice la direccion (#/serie/estructuras), para que anden el boton de volver
// del navegador y un enlace directo a una serie.
//
// El avance queda en este navegador (localStorage), aparte para cada serie.
// Solo se guardan las respuestas: el contexto y las capturas se rearman
// corrigiendolas de nuevo al abrir, asi que si una consigna cambia sus reglas,
// el avance se corta donde la respuesta vieja deja de valer en vez de seguir
// con datos que no cierran.

import { cargarAnalizador } from './analizador.js';
import {
  inicio,
  codigoPrevio,
  enArchivo,
  esMixta,
  programaDeOpciones,
  capturasPrevias,
  respuestaDeReferencia,
  corregirPaso,
  despuesDe,
  pidePracticas,
} from './serie.js';
import { crearEditor, pintar } from './editor.js';
import { partesDeEnunciado, enunciadoEnDos, fichasDe, figuraDe, sustituir } from './enunciado.js';

const CARPETA = 'consignas/';
const INDICE = CARPETA + 'indice.json';
const TITULO = 'Práctica de C';
const MAX_INTENTOS = 500;

const $ = (id) => document.getElementById(id);

const editor = crearEditor($('respuesta'));
let analizador = null;
let series = [];
let grupos = []; // [{ id, titulo, descripcion, series }], en el orden del indice
let serie = null; // la que esta abierta, o null en la lista
let hechas = []; // [{ codigo, conAyuda }], una por consigna resuelta
let avance = inicio(); // el codigo y las capturas que dejan las resueltas
let pendiente = null; // la respuesta correcta que espera el "Siguiente"
let pidioSolucion = false;

const claveAvance = (s) => 'practica-c:avance:' + s.id;
const CLAVE_INTENTOS = 'practica-c:intentos';
const CLAVE_SEMILLA = 'practica-c:semilla';

// El navegador puede negar el almacenamiento (modo privado): se sigue sin guardar.
function leer(clave, porDefecto) {
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? porDefecto;
  } catch {
    return porDefecto;
  }
}

function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // sin lugar o sin permiso
  }
}

// Cada intento con sus codigos de error. Hoy queda en el navegador; es lo que
// habria que mandar a un servidor para saber cuales son los errores mas comunes.
function registrarIntento(consigna, resultado) {
  const intentos = leer(CLAVE_INTENTOS, []);
  intentos.push({
    consigna: consigna.id,
    fecha: new Date().toISOString(),
    correcto: resultado.correcto,
    mejorable: resultado.mejorable,
    conAyuda: pidioSolucion,
    codigos: resultado.diagnosticos.filter((d) => d.nivel !== 'explicacion').map((d) => d.codigo),
  });
  guardar(CLAVE_INTENTOS, intentos.slice(-MAX_INTENTOS));
}

// Texto con `codigo` entre acentos graves, a nodos: nunca como HTML.
function conCodigo(texto) {
  const fragmento = document.createDocumentFragment();
  texto.split('`').forEach((parte, i) => {
    if (!parte) return;
    if (i % 2) {
      const codigo = document.createElement('code');
      codigo.textContent = parte;
      fragmento.appendChild(codigo);
    } else {
      fragmento.appendChild(document.createTextNode(parte));
    }
  });
  return fragmento;
}

// "bloques" es lo que va aparte del texto, como una salida de consola:
// [{ titulo, lineas }].
function mensaje(clase, texto, linea, bloques) {
  const caja = document.createElement(bloques ? 'div' : 'p');
  caja.className = 'mensaje ' + clase;
  const texto_ = bloques ? document.createElement('p') : caja;
  if (linea != null) {
    const donde = document.createElement('span');
    donde.className = 'linea';
    donde.textContent = `Línea ${linea}:`;
    texto_.appendChild(donde);
  }
  texto_.appendChild(conCodigo(texto));
  if (bloques) {
    caja.appendChild(texto_);
    for (const bloque of bloques) {
      if (bloque.titulo) caja.appendChild(elementoConCodigo('p', 'titulo-bloque', bloque.titulo));
      const salida = document.createElement('pre');
      salida.className = 'salida';
      salida.textContent = bloque.lineas.join('\n');
      caja.appendChild(salida);
    }
  }
  return caja;
}

function elementoConCodigo(etiqueta, clase, texto) {
  const e = document.createElement(etiqueta);
  e.className = clase;
  e.appendChild(conCodigo(texto));
  return e;
}

function elemento(etiqueta, clase, texto) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
}

// Las respuestas guardadas de una serie que siguen valiendo, con el contexto
// y las capturas que dejan.
function recorrer(s) {
  const validas = [];
  let hasta = inicio();
  for (const [i, hecha] of leer(claveAvance(s), []).entries()) {
    if (!s.consignas[i] || typeof hecha?.codigo !== 'string') break;
    // Una serie mal armada (por ejemplo, una consigna que usa lo anterior y
    // no dice "continua") no tiene que dejar sin pantalla a las demas.
    let r;
    try {
      r = corregirPaso(analizador, s, i, hasta, hecha.codigo);
    } catch (e) {
      console.error(`La serie "${s.id}" esta mal armada:`, e);
      break;
    }
    if (!r.correcto) break;
    // Los nombres con los que se le mostro la consigna: el resumen final los
    // necesita, y al final de la serie ya no son los mismos.
    const capturas = capturasPrevias(s, i, hasta);
    hasta = despuesDe(s, i, hasta, hecha.codigo, r);
    // Si quedo excelente se calcula de nuevo, igual que si sigue valiendo.
    validas.push({ ...hecha, excelente: !r.mejorable, capturas });
  }
  return { hechas: validas, avance: hasta };
}

// ---- consignas de opciones ----------------------------------------------------

// Las opciones se mezclan para que la correcta no quede siempre en el mismo
// lugar, pero con un orden fijo para cada alumno (y cada consigna): si recarga
// la pagina, las encuentra donde estaban.
function semilla() {
  let n = leer(CLAVE_SEMILLA, null);
  if (typeof n !== 'number') {
    n = Math.floor(Math.random() * 2 ** 31);
    guardar(CLAVE_SEMILLA, n);
  }
  return n;
}

function ordenDeOpciones(consigna) {
  let h = semilla();
  for (const c of consigna.id) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  const azar = () => {
    // mulberry32
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const orden = consigna.opciones.map((_, i) => i);
  for (let i = orden.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  return orden;
}

// Lo que se muestra de una respuesta al final: el codigo escrito, o la opcion
// elegida con los nombres que tenia entonces.
function respuestaEscrita(consigna, hecha) {
  if (!consigna.opciones) return hecha.codigo;
  const opcion = consigna.opciones[Number(hecha.codigo)];
  const capturas = hecha.capturas || {};
  const dicho = sustituir(opcion.texto, capturas);
  return '// Respuesta: ' + (opcion.valor != null ? `${sustituir(opcion.valor, capturas)} — ${dicho}` : dicho);
}

function dibujarOpciones(consigna, capturas) {
  const caja = $('opciones');
  caja.replaceChildren(elemento('legend', null, 'Elija una opción'));
  for (const lugar of ordenDeOpciones(consigna)) {
    const etiqueta = elemento('label', 'opcion');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'opcion';
    radio.value = String(lugar);
    // El valor, aparte de lo que dice: "11" y "el tamaño que usted declaró".
    const opcion = consigna.opciones[lugar];
    const detalle = elemento('span', 'detalle');
    detalle.appendChild(conCodigo(sustituir(opcion.texto, capturas)));
    if (opcion.valor != null) {
      etiqueta.append(radio, elemento('code', 'valor-opcion', sustituir(opcion.valor, capturas)), detalle);
    } else {
      etiqueta.append(radio, detalle);
    }
    caja.appendChild(etiqueta);
  }
}

// ---- la lista de series -------------------------------------------------------

// Un grupo con `agrupar` se ve en la lista como una sola tarjeta; sus series
// estan en su propia pantalla (#/grupo/<id>).
function mostrarLista(deGrupo) {
  serie = null;
  document.title = TITULO;
  $('titulo-serie').textContent = TITULO;
  $('volver').hidden = !deGrupo;
  if (deGrupo) {
    $('volver').textContent = '← Todas las series';
    $('volver').href = '#/';
  }
  $('pasos').hidden = true;
  $('vista-serie').hidden = true;
  $('lista').hidden = false;

  // Cada serie con lo que lleva resuelto; el resumen del grupo sale de lo mismo.
  const estados = new Map(
    series.map((s) => {
      const validas = recorrer(s).hechas;
      return [s, { resueltas: validas.length, excelentes: validas.filter((h) => h.excelente).length }];
    })
  );
  const tarjeta = (s) => {
    const total = s.consignas.length;
    const { resueltas, excelentes } = estados.get(s);

    const enlace = elemento('a', 'tarjeta');
    enlace.href = '#/serie/' + encodeURIComponent(s.id);
    enlace.appendChild(elemento('h3', null, `${s.numero}. ${s.titulo}`));
    if (s.descripcion) enlace.appendChild(elemento('p', null, s.descripcion));

    let estado = 'sin-empezar';
    let texto = total === 1 ? '1 consigna' : `${total} consignas`;
    if (resueltas >= total) {
      estado = 'completa';
      texto = 'Completa';
      // Donde se piden buenas practicas, completa no es lo mismo que excelente.
      if (pidePracticas(s)) {
        texto += excelentes === total ? ', todo excelente' : ` · ${excelentes} de ${total} excelentes`;
      }
    } else if (resueltas > 0) {
      estado = 'en-curso';
      texto = `En curso: ${resueltas} de ${total}`;
    }
    enlace.appendChild(elemento('span', 'estado ' + estado, texto));
    return enlace;
  };

  const resumenDe = (g) => {
    const completas = g.series.filter((s) => estados.get(s).resueltas >= s.consignas.length).length;
    const cuantas = g.series.length;
    return `${completas} de ${cuantas} ${cuantas === 1 ? 'serie completa' : 'series completas'}`;
  };
  const cajaDe = (g) => {
    const caja = elemento('div', 'grupo');
    caja.id = 'grupo-' + g.id;
    caja.appendChild(elemento('h2', null, g.titulo));
    if (g.descripcion) caja.appendChild(elemento('p', 'grupo-descripcion', g.descripcion));
    caja.appendChild(elemento('p', 'grupo-resumen', resumenDe(g)));
    caja.append(...g.series.map(tarjeta));
    return caja;
  };
  const tarjetaDeGrupo = (g) => {
    const caja = elemento('div', 'grupo');
    caja.id = 'grupo-' + g.id;
    const enlace = elemento('a', 'tarjeta');
    enlace.href = '#/grupo/' + encodeURIComponent(g.id);
    enlace.appendChild(elemento('h3', null, g.titulo));
    if (g.descripcion) enlace.appendChild(elemento('p', null, g.descripcion));
    const completas = g.series.filter((s) => estados.get(s).resueltas >= s.consignas.length).length;
    const empezadas = g.series.some((s) => estados.get(s).resueltas > 0);
    const estado = completas === g.series.length ? 'completa' : empezadas ? 'en-curso' : 'sin-empezar';
    enlace.appendChild(elemento('span', 'estado ' + estado, resumenDe(g)));
    caja.appendChild(enlace);
    return caja;
  };

  const aparte = deGrupo && grupos.find((g) => g.id === deGrupo);
  $('lista').replaceChildren(
    ...(aparte ? [cajaDe(aparte)] : grupos.map((g) => (g.agrupar ? tarjetaDeGrupo(g) : cajaDe(g))))
  );
  if (!series.length) {
    $('lista').replaceChildren(mensaje('aviso', 'Todavía no hay ninguna serie cargada.'));
  }
}

// ---- una serie ----------------------------------------------------------------

function abrirSerie(s) {
  serie = s;
  ({ hechas, avance } = recorrer(s));
  $('lista').hidden = true;
  $('vista-serie').hidden = false;
  $('volver').hidden = false;
  $('volver').textContent = '← ' + s.grupo.titulo;
  $('volver').href = '#/grupo/' + encodeURIComponent(s.grupo.id);
  $('pasos').hidden = false;
  mostrarConsigna();
}

function mostrarConsigna() {
  const actual = hechas.length;
  const consigna = serie.consignas[actual];
  pendiente = null;
  pidioSolucion = false;

  const nombre = `${serie.grupo.titulo} › ${serie.numero}. ${serie.titulo}`;
  document.title = `${nombre} · ${TITULO}`;
  $('titulo-serie').textContent = nombre;
  $('pasos').replaceChildren(
    ...serie.consignas.map((c, i) => {
      const estrella = i < actual && pidePracticas(serie) && hechas[i].excelente ? ' ★' : '';
      const paso = elemento('li', null, `${i + 1}. ${c.titulo}${estrella}`);
      if (estrella) paso.title = 'Excelente';
      if (i < actual) paso.className = 'hecho';
      if (i === actual) paso.className = 'actual';
      return paso;
    })
  );

  const termino = !consigna;
  const esCuestionario = Boolean(consigna?.opciones);
  const capturas = termino ? {} : capturasPrevias(serie, actual, avance);
  // Lo ya resuelto mas lo que esta consigna trae escrito.
  // En una consigna de opciones el codigo es un programa completo, de una sola
  // pieza: no hay un "codigo hasta aca" aparte.
  const previo = termino || esCuestionario ? '' : codigoPrevio(serie, actual, avance);
  const programa = !termino && esCuestionario ? programaDeOpciones(serie, actual, avance) : '';
  $('consigna').hidden = termino;
  $('bloque-contexto').hidden = !previo;
  $('bloque-respuesta').hidden = termino;
  $('zona-codigo').hidden = esCuestionario;
  $('opciones').hidden = !esCuestionario;
  $('atajo').hidden = esCuestionario;
  $('bloque-codigo').hidden = !programa;
  $('final').hidden = !termino;
  $('resultado').replaceChildren();

  if (termino) {
    const conAyuda = hechas.filter((h) => h.conAyuda).length;
    $('resumen-final').textContent =
      `Resolvió las ${hechas.length} consignas` +
      (conAyuda ? `, ${conAyuda} de ellas mirando la solución.` : ' sin mirar ninguna solución.') +
      (pidePracticas(serie)
        ? ` ${hechas.filter((h) => h.excelente).length} de ${hechas.length} quedaron excelentes (★).`
        : '');
    // Las respuestas de cada consigna, una atras de otra: con programas
    // independientes no hay un "codigo acumulado" que mostrar.
    pintar(
      $('codigo-final'),
      serie.consignas
        .map((c, i) => `// ${i + 1}. ${c.titulo}\n${respuestaEscrita(c, hechas[i])}`)
        .join('\n\n')
    );
    return;
  }

  $('titulo-consigna').textContent = `${actual + 1}. ${consigna.titulo}`;
  // Lo que va entre acentos graves (y lo que capturo el alumno) en estilo de
  // codigo: que "nombre" no se lea como una palabra mas del enunciado.
  const enParrafo = (texto) =>
    partesDeEnunciado(texto, capturas).map((parte) =>
      parte.nombre ? elemento('code', null, parte.nombre) : conCodigo(parte.texto)
    );
  const { antes, despues } = enunciadoEnDos(consigna);
  $('enunciado').replaceChildren(...enParrafo(antes));
  dibujarFicha(consigna.ficha);
  $('enunciado-cierre').replaceChildren(...enParrafo(despues));
  $('enunciado-cierre').hidden = !despues;
  // Un ejemplo antes del enunciado: lo que se hacia hasta ahora, para compararlo.
  const ejemplo = consigna.ejemplo;
  $('bloque-ejemplo').hidden = !ejemplo;
  if (ejemplo) {
    $('ejemplo-texto').replaceChildren(conCodigo(ejemplo.texto));
    pintar($('ejemplo-codigo'), ejemplo.codigo);
  }
  dibujar(figuraDe(consigna));
  pintar($('contexto'), previo);
  // En una serie que mezcla definiciones y sentencias, se dice donde va lo que se escribe.
  const ambito = $('ambito');
  ambito.textContent =
    esMixta(serie) && !esCuestionario
      ? enArchivo(consigna)
        ? 'Esta respuesta va fuera de main, antes de la función.'
        : 'Esta respuesta va dentro de main.'
      : '';
  ambito.hidden = !ambito.textContent;
  $('comprobar').hidden = false;
  $('siguiente').hidden = true;
  if (esCuestionario) {
    pintar($('codigo-consigna'), programa);
    dibujarOpciones(consigna, capturas);
    $('ver-solucion').hidden = true;
    return;
  }
  editor.poner('');
  $('respuesta').readOnly = false;
  $('ver-solucion').hidden = false;
  $('respuesta').focus({ preventScroll: true });
}

// La ficha de datos: una tarjeta con el nombre de cada campo y, a su lado, el
// valor de ejemplo, o una linea donde iria cuando no lo lleva (como una ficha
// en papel). Los nombres van en una columna y los valores empiezan todos
// en el mismo lugar. Puede ser una ficha o una lista (alumno y copia); cada una
// puede llevar su "leyenda" arriba y "resaltar" los campos que se cargan en
// esta consigna.
function dibujarFicha(fichas) {
  const caja = $('ficha');
  const lista = fichasDe({ ficha: fichas });
  caja.hidden = !lista.length;
  caja.replaceChildren();
  // Un arreglo de estructuras: las fichas una al lado de la otra (o apiladas si no entran).
  const enFila = lista.length > 1 && lista[0].disposicion === 'fila';
  let destino = caja;
  for (const ficha of lista) {
    if (ficha.leyenda) caja.appendChild(elemento('p', 'titulo-figura', ficha.leyenda));
    if (enFila && destino === caja) {
      destino = elemento('div', 'fichas-en-fila');
      caja.appendChild(destino);
    }
    const tarjeta = elemento('div', ficha.destacar ? 'ficha ficha-destacada' : 'ficha');
    if (ficha.titulo) tarjeta.appendChild(elemento('p', 'ficha-titulo', ficha.titulo));
    // Un campo que es otra estructura lleva su propia subficha, por dentro, y
    // sus campos se nombran con el camino (nacimiento.anio).
    const llenar = (cuerpo, campos, prefijo, deMarcada = false) => {
      for (const campo of campos) {
        const camino = prefijo + campo.nombre;
        const nombre = elemento('dt');
        nombre.appendChild(elemento('code', null, campo.nombre));
        const marcado = (lista) => lista === 'todos' || (Array.isArray(lista) && lista.includes(camino));
        const nuevo = deMarcada || marcado(ficha.resaltar) || marcado(ficha.marcar);
        if (campo.campos) {
          const sub = elemento('dl', 'ficha-cuerpo');
          // Marcada entera: la tarjeta y tambien sus valores.
          const entera = deMarcada || (Array.isArray(ficha.marcar) && ficha.marcar.includes(camino));
          llenar(sub, campo.campos, camino + '.', entera);
          const caja = elemento('dd', entera ? 'subficha subficha-destacada' : 'subficha');
          caja.appendChild(sub);
          nombre.classList.add('ficha-nombre-de-sub');
          cuerpo.append(nombre, caja);
          continue;
        }
        const sinValor = campo.ejemplo == null;
        const valor = elemento(
          'dd',
          sinValor ? 'ficha-linea' : nuevo ? 'ficha-nuevo' : null,
          sinValor ? '' : String(campo.ejemplo)
        );
        cuerpo.append(nombre, valor);
      }
    };
    const cuerpo = elemento('dl', 'ficha-cuerpo');
    llenar(cuerpo, ficha.campos, '');
    tarjeta.appendChild(cuerpo);
    destino.appendChild(tarjeta);
  }
}

// El arreglo del enunciado, como una fila de casilleros con su indice arriba.
function dibujar(figura) {
  const caja = $('figura');
  caja.hidden = !figura;
  caja.replaceChildren();
  if (!figura) return;

  if (figura.titulo) caja.appendChild(elementoConCodigo('p', 'titulo-figura', figura.titulo));
  if (figura.clase === 'salida') {
    dibujarSalida(caja, figura.salida);
    return;
  }
  if (figura.clase === 'varias') {
    figura.figuras.forEach((f) => {
      if (f.titulo) caja.appendChild(elementoConCodigo('p', 'titulo-figura', f.titulo));
      dibujarArreglo(caja, f);
    });
    caja.setAttribute('aria-label', figura.figuras.map(descripcionDe).join('. '));
    dibujarSalida(caja, figura.salida);
    return;
  }
  if (figura.clase === 'planos') {
    // Tres dimensiones: una tabla por cada plano, con su nombre.
    figura.valores.forEach((plano, p) => {
      caja.appendChild(elemento('p', 'titulo-figura', `${figura.planos || 'tabla'}[${p}]:`));
      dibujarTabla(caja, { ...figura, filas: plano, arreglo: null });
    });
    dibujarResultado(caja, figura.arreglo);
    dibujarSalida(caja, figura.salida);
    return;
  }
  if (figura.clase === 'tabla') {
    dibujarTabla(caja, figura);
    dibujarSalida(caja, figura.salida);
    return;
  }

  dibujarArreglo(caja, figura);
  dibujarSalida(caja, figura.salida);
}

// Lo mismo que el dibujo, dicho en una frase, para quien no lo ve.
function descripcionDe(figura) {
  const resaltadas = Array.isArray(figura.resaltar) ? figura.resaltar : [];
  return (
    (figura.titulo ? figura.titulo.replace(/`/g, '') + ' ' : '') +
    `Arreglo de ${figura.valores.length} elementos: ${figura.valores
      .map((v, i) => (Array.isArray(figura.nombres) && figura.nombres[i] ? `${figura.nombres[i]}: ` : '') + (v == null ? 'vacío' : v))
      .join(', ')}` +
    (resaltadas.length ? `. Resaltadas las posiciones ${resaltadas.join(', ')}` : '')
  );
}

// Un arreglo en una fila de casilleros, con las posiciones resaltadas y las
// vacias (null) en blanco.
function dibujarArreglo(caja, figura) {
  caja.setAttribute('aria-label', descripcionDe(figura));
  const resaltadas = Array.isArray(figura.resaltar) ? figura.resaltar : [];
  const fila = elemento('div', 'arreglo');
  figura.valores.forEach((valor, i) => {
    const casillero = elemento('div', 'casillero');
    const vacio = valor == null;
    const clase = 'valor' + (vacio ? ' vacio' : '') + (resaltadas.includes(i) ? ' resaltado' : '');
    // Con los nombres de un enumerado, cada uno va bajo su indice.
    const nombre = Array.isArray(figura.nombres) && figura.nombres[i] != null ? figura.nombres[i] : null;
    if (nombre) casillero.classList.add('con-nombre');
    casillero.append(
      elemento('span', 'indice', i),
      ...(nombre ? [elemento('span', 'nombre-de-indice', nombre)] : []),
      elemento('span', clase, vacio ? '\u00A0' : valor)
    );
    fila.appendChild(casillero);
  });
  caja.appendChild(fila);
}

// Lo que tiene que mostrar el programa, en un recuadro de consola.
function dibujarSalida(caja, salida) {
  if (!salida) return;
  caja.appendChild(elemento('p', 'titulo-figura', 'Así tiene que verse la salida:'));
  caja.appendChild(elemento('pre', 'salida', salida));
}

// La tabla: los indices de las columnas arriba y los de las filas a la izquierda.
// Puede llevar el nombre de las filas (en vertical, a la izquierda) y el de las
// columnas (arriba), la diagonal resaltada y, aparte, el arreglo del resultado.
function dibujarTabla(caja, figura) {
  const filas = figura.filas;
  const columnas = filas[0].length;
  const conRotuloFilas = Boolean(figura.rotuloFilas);
  const conRotuloColumnas = Boolean(figura.rotuloColumnas);
  const resultado = figura.arreglo;
  const alLado = Boolean(resultado && resultado.vertical);
  caja.setAttribute(
    'aria-label',
    `Tabla de ${filas.length} filas y ${columnas} columnas` +
      (conRotuloFilas ? `: las filas son ${figura.rotuloFilas}` : '') +
      (conRotuloColumnas ? `, las columnas son ${figura.rotuloColumnas}` : '') +
      (figura.resaltar === 'diagonal' ? ', con la diagonal principal resaltada' : '') +
      '. ' +
      filas.map((fila, i) => `Fila ${i}: ${fila.join(', ')}`).join('. ') +
      (resultado ? `. Arreglo ${resultado.nombre}: ${resultado.valores.join(', ')}` : '')
  );
  const tabla = elemento('div', 'tabla');
  // Lineas de la grilla (desde 1): [rotulo de filas] indice, valores y, si el
  // resultado va al lado, un espacio, sus indices y sus valores.
  const desfase = conRotuloFilas ? 1 : 0;
  const colIndice = desfase + 1;
  const colEspacio = colIndice + columnas + 1;
  const colIndiceResultado = colEspacio + 1;
  const colResultado = colEspacio + 2;
  const ancho = (conRotuloFilas ? ['auto'] : []).concat(['auto'], Array(columnas).fill('auto'));
  if (alLado) ancho.push('28px', 'auto', 'auto');
  tabla.style.gridTemplateColumns = ancho.join(' ');
  const poner = (e, fila, columna, largo = 1, alto = 1) => {
    e.style.gridRow = `${fila} / span ${alto}`;
    e.style.gridColumn = `${columna} / span ${largo}`;
    tabla.appendChild(e);
  };

  let r = 1;
  if (conRotuloColumnas) {
    poner(elemento('span', 'rotulo rotulo-columnas', figura.rotuloColumnas), r, colIndice + 1, columnas);
    if (alLado) poner(elemento('span', 'rotulo rotulo-columnas', resultado.nombre), r, colIndiceResultado, 2);
    r++;
  } else if (alLado) {
    poner(elemento('span', 'rotulo rotulo-columnas', resultado.nombre), r, colIndiceResultado, 2);
    r++;
  }
  // Los indices de las columnas.
  for (let j = 0; j < columnas; j++) poner(elemento('span', 'indice', j), r, colIndice + 1 + j);
  const primeraFila = r + 1;
  if (conRotuloFilas) {
    poner(elemento('span', 'rotulo rotulo-filas', figura.rotuloFilas), primeraFila, 1, 1, filas.length);
  }
  filas.forEach((fila, i) => {
    poner(elemento('span', 'indice de-fila', i), primeraFila + i, colIndice);
    fila.forEach((valor, j) => {
      const resaltado = figura.resaltar === 'diagonal' && i === j ? ' resaltado' : '';
      poner(elemento('span', 'valor' + resaltado, valor), primeraFila + i, colIndice + 1 + j);
    });
    if (alLado) {
      poner(elemento('span', 'indice de-fila', i), primeraFila + i, colIndiceResultado);
      poner(elemento('span', 'valor', resultado.valores[i]), primeraFila + i, colResultado);
    }
  });
  caja.appendChild(tabla);
  if (resultado && !alLado) dibujarResultado(caja, resultado);
}

// El arreglo con el resultado que tiene que quedar, aparte de la tabla, como
// cualquier arreglo: sus indices arriba y los bordes enteros.
function dibujarResultado(caja, resultado) {
  if (!resultado || resultado.vertical) return;
  caja.appendChild(elementoConCodigo('p', 'titulo-figura separado', `Así tiene que quedar \`${resultado.nombre}\`:`));
  const fila = elemento('div', 'arreglo');
  resultado.valores.forEach((valor, i) => {
    const casillero = elemento('div', 'casillero');
    casillero.append(elemento('span', 'indice', i), elemento('span', 'valor', valor));
    fila.appendChild(casillero);
  });
  caja.appendChild(fila);
}

function comprobar() {
  const consigna = serie?.consignas[hechas.length];
  const esCuestionario = Boolean(consigna?.opciones);
  if (!consigna || (!esCuestionario && $('respuesta').readOnly)) return;
  pendiente = null;
  // En una de opciones la respuesta es el lugar de la opcion elegida.
  const elegida = esCuestionario ? document.querySelector('#opciones input:checked') : null;
  if (esCuestionario && !elegida) {
    mostrarResultado([mensaje('aviso', 'Elija una de las opciones para comprobar.')]);
    return;
  }
  const respuesta = esCuestionario ? elegida.value : $('respuesta').value;
  let r;
  try {
    r = corregirPaso(analizador, serie, hechas.length, avance, respuesta);
  } catch (e) {
    // Es un error de como esta armada la consigna, no de la respuesta: no hay
    // nada que el alumno pueda corregir, pero tiene que enterarse de que no es
    // culpa suya.
    console.error(`La consigna "${consigna.id}" esta mal armada:`, e);
    mostrarResultado([
      mensaje('error', 'Esta consigna tiene un problema y no se puede corregir. No es un error de su respuesta: avise al docente.'),
    ]);
    return;
  }
  registrarIntento(consigna, r);
  if (!esCuestionario) editor.marcar(r.diagnosticos);

  const cajas = r.diagnosticos.map((d) => mensaje(d.nivel, d.mensaje, d.linea, d.bloques));
  $('siguiente').hidden = !r.correcto;
  if (r.correcto) {
    pendiente = {
      hecha: { codigo: respuesta.trim(), conAyuda: pidioSolucion, excelente: !r.mejorable },
      resultado: r,
    };
    const ultima = hechas.length + 1 >= serie.consignas.length;
    // Con algo para mejorar, el boton que se destaca sigue siendo "Comprobar".
    $('siguiente').classList.toggle('principal', !r.mejorable);
    if (r.mejorable) {
      // Vale, pero hay una forma mejor: puede arreglarla y comprobar de
      // nuevo, o seguir con lo que tiene. Por eso el editor no se bloquea.
      // Sin nada que mejorar pero con algo que no se pudo comprobar: no es
      // "excelente", y no se dice que haya algo para mejorar.
      const hayMejoras = r.diagnosticos.some((d) => d.nivel === 'mejora');
      cajas.unshift(
        mensaje(
          'bien',
          r.sinVerificar && !hayMejoras
            ? 'Correcto, pero no pude comprobar todo. Puede revisarlo y comprobar de nuevo, o seguir así.'
            : 'Correcto, y se puede mejorar. Puede cambiarlo y comprobar de nuevo, o seguir así.'
        )
      );
      $('siguiente').textContent = ultima ? 'Terminar así' : 'Seguir así';
    } else {
      cajas.unshift(mensaje('bien', pidePracticas(serie) ? 'Excelente.' : 'Correcto.'));
      $('respuesta').readOnly = true;
      for (const radio of document.querySelectorAll('#opciones input')) radio.disabled = true;
      $('comprobar').hidden = true;
      $('ver-solucion').hidden = true;
      $('siguiente').textContent = ultima ? 'Terminar' : 'Siguiente';
      $('siguiente').focus({ preventScroll: true });
    }
  }
  mostrarResultado(cajas);
}

// Los mensajes quedan debajo del editor, y con el codigo previo arriba suelen
// caer fuera de la pantalla: sin esto, comprobar parece no hacer nada. Se
// desplaza lo justo para que entren, sin llevarse el editor si no hace falta.
function mostrarResultado(cajas) {
  const resultado = $('resultado');
  resultado.replaceChildren(...cajas);
  const sinAnimar = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  resultado.scrollIntoView({ behavior: sinAnimar ? 'auto' : 'smooth', block: 'nearest' });
}

// Lo comprobado vale para el texto que se comprobo: si despues lo cambia, hay
// que comprobar de nuevo antes de seguir.
function alEscribir() {
  if (!pendiente) return;
  pendiente = null;
  $('siguiente').hidden = true;
  $('resultado').replaceChildren();
}

function siguiente() {
  if (!pendiente) return;
  const { hecha, resultado } = pendiente;
  hecha.capturas = capturasPrevias(serie, hechas.length, avance);
  avance = despuesDe(serie, hechas.length, avance, hecha.codigo, resultado);
  hechas.push(hecha);
  guardar(claveAvance(serie), hechas);
  mostrarConsigna();
  // La consigna nueva se lee desde el principio, no desde donde quedo el editor.
  window.scrollTo(0, 0);
}

function verSolucion() {
  const consigna = serie?.consignas[hechas.length];
  if (!consigna || consigna.opciones) return;
  // La referencia nombra las cosas a su manera ("struct Puesto"): solo sirve
  // tal cual si el alumno viene siguiendo las referencias. Si no, se le
  // muestra como ejemplo y la adapta a sus nombres.
  pidioSolucion = true;
  // Con los nombres que el alumno uso antes, cuando la referencia los nombra.
  const referencia = respuestaDeReferencia(consigna, capturasPrevias(serie, hechas.length, avance));
  const r = corregirPaso(analizador, serie, hechas.length, avance, referencia);
  const nota = r.correcto
    ? 'Esta es una solución posible. Puede escribirla o copiarla, y comprobar.'
    : 'Esta es una solución posible, escrita con otros nombres: hay que adaptarla a los que usó usted.';
  const ejemplo = document.createElement('pre');
  pintar(ejemplo, referencia);
  $('respuesta').focus({ preventScroll: true });
  mostrarResultado([mensaje('aviso', nota), ejemplo]);
}

function reiniciar() {
  guardar(claveAvance(serie), []);
  abrirSerie(serie);
}

// Las teclas de escribir codigo (Tab, la sangria) las maneja el editor.
function teclaEnRespuesta(evento) {
  if (evento.key === 'Enter' && (evento.ctrlKey || evento.metaKey)) {
    evento.preventDefault();
    comprobar();
  }
}

// ---- arranque -----------------------------------------------------------------

// Muestra lo que diga la direccion: una serie o, si no nombra ninguna que
// exista, la lista.
function navegar() {
  const pedida = /^#\/serie\/(.+)$/.exec(location.hash);
  const s = pedida && series.find((x) => x.id === decodeURIComponent(pedida[1]));
  let caja = null;
  if (s) abrirSerie(s);
  else {
    const pedido = /^#\/grupo\/(.+)$/.exec(location.hash);
    const idGrupo = pedido && decodeURIComponent(pedido[1]);
    const agrupado = idGrupo && grupos.some((g) => g.id === idGrupo && g.agrupar);
    mostrarLista(agrupado ? idGrupo : null);
    caja = idGrupo && !agrupado && document.getElementById('grupo-' + idGrupo);
  }
  if (caja) caja.scrollIntoView();
  else window.scrollTo(0, 0);
}

async function leerJson(direccion) {
  const r = await fetch(direccion);
  if (!r.ok) throw new Error('No se pudo leer ' + direccion);
  return r.json();
}

// Una serie que no se puede leer no deja sin practica a las demas. Cada una
// lleva su grupo y su numero: la posicion que ocupa en el grupo, entre las que
// se pudieron leer.
async function cargarSeries() {
  const indice = await leerJson(INDICE);
  const leidas = await Promise.all(
    indice.grupos.map((g) =>
      Promise.allSettled(g.series.map((archivo) => leerJson(CARPETA + archivo)))
    )
  );
  const buenas = [];
  const delIndice = [];
  indice.grupos.forEach((g, k) => {
    const grupo = { id: g.id, titulo: g.titulo, descripcion: g.descripcion, agrupar: !!g.agrupar, series: [] };
    leidas[k].forEach((leida, i) => {
      if (leida.status === 'rejected') {
        console.error(`No se pudo cargar la serie ${g.series[i]}:`, leida.reason);
      } else if (buenas.some((s) => s.id === leida.value.id)) {
        console.error(`La serie ${g.series[i]} repite el id "${leida.value.id}" y no se muestra.`);
      } else {
        const s = leida.value;
        grupo.series.push(s);
        s.numero = grupo.series.length;
        s.grupo = { id: grupo.id, titulo: grupo.titulo };
        buenas.push(s);
      }
    });
    if (grupo.series.length) delIndice.push(grupo);
  });
  return { series: buenas, grupos: delIndice };
}
async function iniciar() {
  try {
    let cargadas;
    [analizador, cargadas] = await Promise.all([cargarAnalizador(), cargarSeries()]);
    series = cargadas.series;
    grupos = cargadas.grupos;
  } catch (e) {
    $('lista').replaceChildren(
      mensaje('error', 'No se pudo cargar la práctica. Revise la conexión y vuelva a abrir la página.')
    );
    console.error(e);
    return;
  }

  $('comprobar').disabled = false;
  $('comprobar').addEventListener('click', comprobar);
  $('siguiente').addEventListener('click', siguiente);
  $('ver-solucion').addEventListener('click', verSolucion);
  $('reiniciar').addEventListener('click', reiniciar);
  $('respuesta').addEventListener('keydown', teclaEnRespuesta);
  $('respuesta').addEventListener('input', alEscribir);
  // Cambiar la opcion elegida deja sin efecto lo que se habia dicho de la anterior.
  $('opciones').addEventListener('change', () => {
    pendiente = null;
    $('siguiente').hidden = true;
    $('resultado').replaceChildren();
  });
  window.addEventListener('hashchange', navegar);
  navegar();
}

iniciar();
