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
  continuaLaAnterior,
} from './serie.js';
import { crearEditor, pintar } from './editor.js';
import { enviarIntento, enviarInforme, numeroDeInforme, enviaEstadisticas, esLocal, esDocente } from './estadisticas.js';
import { partesDeEnunciado, enunciadoEnDos, fichasDe, figuraDe, sustituir } from './enunciado.js';
import { analizar, evaluar, mostrar, pilaComoTexto } from './pila.js';

// La vista del docente: lista tambien las series y los grupos ocultos (en el
// modo docente, o abriendo la pagina en esta PC).
const VE_LAS_OCULTAS = esLocal() || esDocente();

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
let antes = []; // el avance que habia antes de cada consigna resuelta: para repasarla
let repasando = null; // el lugar de la consigna resuelta que se esta repasando, o null
let borrador = ''; // lo que habia escrito en la consigna de la que salio para repasar
let cajasDeOpcion = new Map(); // lugar de la opcion -> { etiqueta, caja } en una consigna de opciones
let pendiente = null; // la respuesta correcta que espera el "Siguiente"
let pidioSolucion = false;
let informable = null; // lo ultimo que se comprobo: lo que se informa si el alumno dice que esta mal

// En el modo docente el avance se guarda aparte: los saltos entre consignas lo
// llenan con soluciones de referencia, y no tienen que mezclarse con el real.
const claveAvance = (s) => (VE_LAS_OCULTAS ? 'practica-c:avance-docente:' : 'practica-c:avance:') + s.id;
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
    codigos: codigosDe(resultado),
  });
  guardar(CLAVE_INTENTOS, intentos.slice(-MAX_INTENTOS));
}

function codigosDe(resultado) {
  return resultado.diagnosticos.filter((d) => d.nivel !== 'explicacion').map((d) => d.codigo);
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
  const previos = [];
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
    const antesDeEsta = hasta;
    hasta = despuesDe(s, i, hasta, hecha.codigo, r);
    // Si quedo excelente se calcula de nuevo, igual que si sigue valiendo.
    validas.push({ ...hecha, excelente: !r.mejorable, capturas });
    previos.push(antesDeEsta);
  }
  return { hechas: validas, avance: hasta, antes: previos };
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
  if (consigna.pila) return pilaComoTexto(consigna, hecha.codigo);
  if (!consigna.opciones) return hecha.codigo;
  const opcion = consigna.opciones[Number(hecha.codigo)];
  const capturas = hecha.capturas || {};
  const dicho = sustituir(opcion.texto, capturas);
  return '// Respuesta: ' + (opcion.valor != null ? `${sustituir(opcion.valor, capturas)} — ${dicho}` : dicho);
}

function dibujarOpciones(consigna, capturas) {
  const caja = $('opciones');
  caja.replaceChildren(elemento('legend', null, 'Elija una opción'));
  cajasDeOpcion = new Map();
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
    cajasDeOpcion.set(lugar, { etiqueta, caja: null });
  }
}

// El mensaje de una opcion queda pegado a ella: asi se sabe de cual habla, no
// se pierde al probar otra y se puede volver a leer despues de acertar.
function mensajeDeOpcion(lugar, clase, texto, marca) {
  const { etiqueta, caja: anterior } = cajasDeOpcion.get(lugar);
  const caja = mensaje(clase, texto);
  if (anterior) anterior.remove();
  etiqueta.after(caja);
  if (marca) etiqueta.classList.add(marca);
  cajasDeOpcion.get(lugar).caja = caja;
  return caja;
}

// Al acertar se explican tambien las que no probo.
function explicarLasDemas(consigna, capturas, elegida) {
  for (const [lugar, { caja }] of cajasDeOpcion) {
    const texto = consigna.opciones[lugar].explicacion;
    if (lugar === elegida || caja || !texto) continue;
    mensajeDeOpcion(lugar, 'explicacion', sustituir(texto, capturas));
  }
}

// ---- consignas con una tabla de llamadas (recursion a mano) ----------------------

// Una fila por llamada. En una pantalla ancha es una tabla; en el celular cada
// llamada es una tarjeta con sus campos uno debajo del otro.
function dibujarPila(consigna) {
  const pila = consigna.pila;
  const caja = $('pila');
  const esDada = (fila, columna) => (pila.dadas || []).includes(columna.id) || (fila.dadas || []).includes(columna.id);
  const tabla = elemento('table', 'pila');
  const cabeza = elemento('tr');
  for (const titulo of ['Llamada', ...pila.columnas.map((c) => c.titulo)]) cabeza.appendChild(elemento('th', null, titulo));
  tabla.appendChild(elemento('thead')).appendChild(cabeza);
  const cuerpo = elemento('tbody');
  pila.filas.forEach((fila, i) => {
    const tr = elemento('tr');
    const primera = elemento('td', 'llamada');
    primera.dataset.rotulo = 'Llamada';
    primera.appendChild(elemento('code', null, fila.llamada));
    tr.appendChild(primera);
    pila.columnas.forEach((columna, j) => {
      const td = elemento('td');
      td.dataset.rotulo = columna.titulo;
      if (esDada(fila, columna)) {
        td.classList.add('dada');
        td.dataset.valor = fila[columna.id];
        td.appendChild(elemento('code', null, fila[columna.id]));
      } else {
        const campo = document.createElement('input');
        campo.type = 'text';
        campo.autocomplete = 'off';
        campo.autocapitalize = 'off';
        campo.spellcheck = false;
        campo.setAttribute('aria-label', `${columna.titulo} de ${fila.llamada}`);
        campo.dataset.fila = i;
        campo.dataset.columna = j;
        td.appendChild(campo);
        // El resultado de la cuenta, mientras la escribe.
        if (columna.tipo === 'cuenta') td.appendChild(elemento('span', 'vivo'));
      }
      tr.appendChild(td);
    });
    cuerpo.appendChild(tr);
  });
  tabla.appendChild(cuerpo);
  caja.replaceChildren(tabla);
  if (pila.salida) {
    const etiqueta = elemento('label', 'salida-pila');
    etiqueta.appendChild(elemento('span', null, pila.salida.titulo));
    const campo = document.createElement('input');
    campo.type = 'text';
    campo.id = 'pila-salida';
    campo.autocomplete = 'off';
    campo.spellcheck = false;
    etiqueta.appendChild(campo);
    caja.appendChild(etiqueta);
  }
}

// Lo que hay en la tabla, como lo espera el corrector: todas las celdas, las
// dadas con su texto.
function respuestaDePila(consigna) {
  const pila = consigna.pila;
  const celdas = pila.filas.map((fila) => pila.columnas.map(() => ''));
  for (const td of $('pila').querySelectorAll('td[data-rotulo]')) {
    const tr = td.parentElement;
    const j = [...tr.children].indexOf(td) - 1;
    if (j < 0) continue;
    const i = [...tr.parentElement.children].indexOf(tr);
    celdas[i][j] = td.classList.contains('dada') ? td.dataset.valor : (td.querySelector('input')?.value ?? '');
  }
  const salida = $('pila-salida');
  return JSON.stringify({ celdas, salida: salida ? salida.value : undefined });
}

// Cada cuenta muestra lo que da, apenas se puede calcular. No dice si esta bien.
function alEscribirEnPila(evento) {
  const campo = evento.target;
  if (!(campo instanceof HTMLInputElement)) return;
  campo.classList.remove('mal');
  const vivo = campo.parentElement.querySelector('.vivo');
  if (vivo) {
    const arbol = analizar(campo.value);
    const r = arbol && arbol.t !== 'num' ? evaluar(arbol) : null;
    vivo.textContent = r ? '= ' + mostrar(r) : '';
  }
  alEscribir();
}

// Las celdas con error quedan marcadas; la marca se va al volver a escribir en ella.
function marcarPila(consigna, diagnosticos) {
  const tabla = $('pila');
  for (const campo of tabla.querySelectorAll('input.mal')) campo.classList.remove('mal');
  for (const d of diagnosticos) {
    if (!d.celda) continue;
    const campo = d.celda.salida
      ? $('pila-salida')
      : tabla.querySelector(`input[data-fila="${d.celda.fila}"][data-columna="${d.celda.columna}"]`);
    if (campo) campo.classList.add('mal');
  }
}

function bloquearPila() {
  for (const campo of $('pila').querySelectorAll('input')) campo.readOnly = true;
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
    if (s.oculta) enlace.appendChild(elemento('span', 'oculta', 'Oculta para los alumnos'));
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
    if (g.oculto) enlace.appendChild(elemento('span', 'oculta', 'Oculto para los alumnos'));
    caja.appendChild(enlace);
    return caja;
  };

  // Las series ocultas no se listan (salvo en la vista del docente), aunque se
  // abren por su direccion. Un grupo oculto, abierto por la suya, muestra todo.
  const aVer = (s) => VE_LAS_OCULTAS || !s.oculta;
  const conLoVisible = (g, todo) => ({ ...g, series: g.series.filter((s) => todo || aVer(s)) });
  const visibles = grupos.filter((g) => VE_LAS_OCULTAS || !g.oculto).map((g) => conLoVisible(g, false)).filter((g) => g.series.length);
  const pedido = deGrupo && grupos.find((g) => g.id === deGrupo);
  const aparte = pedido && conLoVisible(pedido, pedido.oculto);
  $('lista').replaceChildren(
    ...(aparte ? [cajaDe(aparte)] : visibles.map((g) => (g.agrupar ? tarjetaDeGrupo(g) : cajaDe(g))))
  );
  if (!series.length) {
    $('lista').replaceChildren(mensaje('aviso', 'Todavía no hay ninguna serie cargada.'));
  }
}

// ---- una serie ----------------------------------------------------------------

function abrirSerie(s) {
  serie = s;
  ({ hechas, avance, antes } = recorrer(s));
  repasando = null;
  borrador = '';
  $('lista').hidden = true;
  $('vista-serie').hidden = false;
  $('volver').hidden = false;
  $('volver').textContent = '← ' + s.grupo.titulo;
  $('volver').href = '#/grupo/' + encodeURIComponent(s.grupo.id);
  // Al terminar la serie, el boton vuelve a las series de su mismo grupo.
  $('volver-final').href = '#/grupo/' + encodeURIComponent(s.grupo.id);
  $('pasos').hidden = false;
  mostrarConsigna();
}

function mostrarConsigna() {
  // Repasando, la consigna es una ya resuelta y se ve con lo que habia antes
  // de ella; el avance guardado no cambia.
  const actual = repasando ?? hechas.length;
  const avanceVisto = avanceMostrado();
  // Lo que habia escrito antes de salir a repasar, si vuelve a esa consigna.
  const textoGuardado = repasando == null ? borrador : '';
  if (repasando == null) borrador = '';
  const consigna = serie.consignas[actual];
  pendiente = null;
  pidioSolucion = false;
  $('aviso-salto').hidden = true;
  $('aviso-repaso').hidden = repasando == null;
  if (repasando != null) {
    const donde = hechas.length >= serie.consignas.length ? 'al final de la serie' : `a la consigna ${hechas.length + 1}`;
    $('texto-repaso').textContent = `Está repasando la consigna ${actual + 1}: su avance no cambia.`;
    $('salir-repaso').textContent = `Volver ${donde}`;
  }

  const nombre = `${serie.grupo.titulo} › ${serie.numero}. ${serie.titulo}`;
  document.title = `${nombre} · ${TITULO}`;
  $('titulo-serie').textContent = nombre;
  $('pasos').replaceChildren(
    ...serie.consignas.map((c, i) => {
      const estrella = i < hechas.length && pidePracticas(serie) && hechas[i].excelente ? ' ★' : '';
      const paso = elemento('li', null, `${i + 1}. ${c.titulo}${estrella}`);
      if (estrella) paso.title = 'Excelente';
      if (i < hechas.length) paso.className = 'hecho';
      if (i === actual) paso.className = 'actual';
      // Una consigna resuelta se puede repasar. Desde el repaso, la que sigue
      // vuelve a donde estaba. En el modo docente se puede saltar a cualquiera.
      let accion = null;
      if (i === actual) accion = null;
      else if (i < hechas.length) accion = () => repasar(i);
      else if (repasando != null && i === hechas.length) accion = salirDelRepaso;
      else if (VE_LAS_OCULTAS) accion = () => irA(i);
      if (accion) {
        paso.classList.add('salto');
        paso.tabIndex = 0;
        paso.setAttribute('role', 'button');
        paso.title =
          i < hechas.length ? 'Volver a resolver esta consigna' : accion === salirDelRepaso ? 'Volver a donde estaba' : 'Ir a esta consigna';
        paso.addEventListener('click', accion);
        paso.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            accion();
          }
        });
      }
      return paso;
    })
  );

  const termino = !consigna;
  const esCuestionario = Boolean(consigna?.opciones);
  const esPila = Boolean(consigna?.pila);
  // Sin editor: se responde eligiendo una opcion o completando una tabla.
  const sinEditor = esCuestionario || esPila;
  const capturas = termino ? {} : capturasPrevias(serie, actual, avanceVisto);
  // Lo ya resuelto mas lo que esta consigna trae escrito.
  // En una consigna de opciones el codigo es un programa completo, de una sola
  // pieza: no hay un "codigo hasta aca" aparte.
  const previo = termino || sinEditor ? '' : codigoPrevio(serie, actual, avanceVisto);
  const programa = !termino && sinEditor ? programaDeOpciones(serie, actual, avanceVisto) : '';
  $('consigna').hidden = termino;
  $('bloque-contexto').hidden = !previo;
  $('bloque-respuesta').hidden = termino;
  $('zona-codigo').hidden = sinEditor;
  $('opciones').hidden = !esCuestionario;
  $('pila').hidden = !esPila;
  $('atajo').hidden = sinEditor;
  $('bloque-codigo').hidden = !programa;
  $('final').hidden = !termino;
  $('resultado').replaceChildren();
  ocultarInforme();

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
    esMixta(serie) && !sinEditor
      ? enArchivo(consigna)
        ? consigna.despues
          ? 'Esta respuesta va arriba de todo, antes de main.'
          : 'Esta respuesta va fuera de main, antes de la función.'
        : 'Esta respuesta va dentro de main.'
      : '';
  ambito.hidden = !ambito.textContent;
  $('comprobar').hidden = false;
  $('siguiente').hidden = true;
  $('usar-anterior').hidden = true;
  if (sinEditor) {
    pintar($('codigo-consigna'), programa);
    if (esCuestionario) dibujarOpciones(consigna, capturas);
    else dibujarPila(consigna);
    $('ver-solucion').hidden = true;
    return;
  }
  editor.poner(textoGuardado);
  $('respuesta').readOnly = false;
  $('ver-solucion').hidden = false;
  // Repasando, se puede traer lo que se habia respondido.
  $('usar-anterior').hidden = repasando == null;
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
  if (figura.clase === 'union') {
    dibujarUnion(caja, figura.union);
    dibujarSalida(caja, figura.salida);
    return;
  }
  if (figura.clase === 'escalera') {
    dibujarEscalera(caja, figura.escalones);
    dibujarSalida(caja, figura.salida);
    return;
  }
  if (figura.clase === 'memoria') {
    dibujarMemoria(caja, figura.celdas);
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

// Una union: un solo lugar que comparten sus miembros. Arriba, los nombres de
// los miembros (el que tiene el valor, marcado) y abajo el lugar con el valor.
function dibujarUnion(caja, u) {
  const vacio = u.valor == null;
  caja.setAttribute(
    'aria-label',
    `Unión ${u.nombre}: un solo lugar compartido por ${u.miembros.join(', ')}. ` +
      (vacio ? 'Todavía sin valor.' : `Tiene el valor ${u.valor}, guardado en ${u.vigente}.`)
  );
  const bloque = elemento('div', 'union');
  const nombres = elemento('div', 'union-miembros');
  for (const m of u.miembros) {
    nombres.appendChild(elemento('span', 'miembro' + (m === u.vigente && !vacio ? ' vigente' : ''), m));
  }
  bloque.append(
    elemento('span', 'union-nombre', u.nombre),
    nombres,
    elemento('span', 'valor' + (vacio ? ' vacio' : ' resaltado'), vacio ? ' ' : u.valor)
  );
  caja.appendChild(bloque);
}

// La escalera de acceso: cada escalon da mas acceso que el anterior.
function dibujarEscalera(caja, escalones) {
  caja.setAttribute(
    'aria-label',
    'Escalera de acceso, de menos a más: ' + escalones.map((e) => `${e.nombre} (${e.detalle.replace(/\`/g, '')})`).join('; ')
  );
  const escalera = elemento('div', 'escalera');
  escalones.forEach((e, i) => {
    const escalon = elemento('div', `escalon escalon-${i + 1}`);
    escalon.append(elemento('span', 'escalon-nombre', e.nombre), elementoConCodigo('span', 'escalon-detalle', e.detalle));
    escalera.appendChild(escalon);
  });
  caja.appendChild(escalera);
}

// La memoria: un casillero por variable, con su direccion arriba y su nombre
// abajo. De cada puntero sale una flecha, por debajo, hasta la variable a la
// que apunta.
function dibujarMemoria(caja, celdas) {
  const texto = (v) => (v == null ? '?' : v);
  caja.setAttribute(
    'aria-label',
    'La memoria. ' +
      celdas
        .map((c) => {
          const decl = c.elemento ? c.nombre : `${c.tipo}${c.puntero ? ' *' : ' '}${c.nombre}`;
          return `${decl} en la dirección ${c.direccion}, ` +
            (c.apunta ? `guarda ${c.valor} y apunta a ${c.destino}` : c.valor == null ? 'sin valor' : `vale ${c.valor}`);
        })
        .join('. ')
  );
  const bloque = elemento('div', 'memoria');
  const fila = elemento('div', 'memoria-fila');
  const casilleros = new Map();
  for (const c of celdas) {
    const celda = elemento('div', 'celda');
    celda.append(
      elemento('span', 'direccion', c.direccion),
      elemento('span', 'valor' + (c.valor == null ? ' vacio' : '') + (c.apunta ? ' puntero' : ''), texto(c.valor)),
      elemento('span', 'nombre-de-celda', c.elemento ? c.nombre : `${c.tipo}${c.puntero ? ' *' : ' '}${c.nombre}`)
    );
    casilleros.set(c.nombre, celda);
    fila.appendChild(celda);
  }
  bloque.appendChild(fila);
  caja.appendChild(bloque);

  // Las flechas: una curva por debajo de los casilleros, de cada puntero a su destino.
  const flechas = celdas.filter((c) => c.apunta);
  if (!flechas.length) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'memoria-flechas');
  svg.setAttribute('aria-hidden', 'true');
  bloque.appendChild(svg);
  const trazar = () => {
    svg.replaceChildren();
    const origen = bloque.getBoundingClientRect();
    const alto = 14 + 10 * flechas.length;
    svg.setAttribute('width', origen.width);
    svg.setAttribute('height', alto);
    const punta = document.createElementNS(ns, 'defs');
    punta.innerHTML =
      '<marker id="punta-memoria" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker>';
    svg.appendChild(punta);
    flechas.forEach((c, k) => {
      const desde = casilleros.get(c.nombre).querySelector('.valor').getBoundingClientRect();
      const hasta = casilleros.get(c.destino).querySelector('.valor').getBoundingClientRect();
      const x1 = desde.left + desde.width / 2 - origen.left;
      const x2 = hasta.left + hasta.width / 2 - origen.left;
      const profundidad = 10 + 10 * k + (Math.abs(x1 - x2) > 0 ? 6 : 0);
      const camino = document.createElementNS(ns, 'path');
      camino.setAttribute('d', `M${x1},0 C${x1},${profundidad + 12} ${x2},${profundidad + 12} ${x2},2`);
      camino.setAttribute('class', 'flecha');
      camino.setAttribute('marker-end', 'url(#punta-memoria)');
      svg.appendChild(camino);
    });
  };
  requestAnimationFrame(trazar);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(trazar).observe(fila);
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
  // Los nombres de un enumerado: uno junto al indice de cada fila y de cada columna.
  const conNombresFilas = Array.isArray(figura.nombresFilas);
  const conNombresColumnas = Array.isArray(figura.nombresColumnas);
  const resultado = figura.arreglo;
  const alLado = Boolean(resultado && resultado.vertical);
  caja.setAttribute(
    'aria-label',
    `Tabla de ${filas.length} filas y ${columnas} columnas` +
      (conRotuloFilas ? `: las filas son ${figura.rotuloFilas}` : '') +
      (conRotuloColumnas ? `, las columnas son ${figura.rotuloColumnas}` : '') +
      (conNombresFilas ? `. Filas: ${figura.nombresFilas.join(', ')}` : '') +
      (conNombresColumnas ? `. Columnas: ${figura.nombresColumnas.join(', ')}` : '') +
      (figura.resaltar === 'diagonal' ? ', con la diagonal principal resaltada' : '') +
      '. ' +
      filas.map((fila, i) => `Fila ${i}: ${fila.join(', ')}`).join('. ') +
      (resultado ? `. Arreglo ${resultado.nombre}: ${resultado.valores.join(', ')}` : '')
  );
  const tabla = elemento('div', 'tabla');
  // Lineas de la grilla (desde 1): [rotulo de filas] indice, valores y, si el
  // resultado va al lado, un espacio, sus indices y sus valores.
  const desfase = (conRotuloFilas ? 1 : 0) + (conNombresFilas ? 1 : 0);
  const colIndice = desfase + 1;
  const colEspacio = colIndice + columnas + 1;
  const colIndiceResultado = colEspacio + 1;
  const colResultado = colEspacio + 2;
  const ancho = Array(desfase).fill('auto').concat(['auto'], Array(columnas).fill('auto'));
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
  // Los nombres de las columnas, y debajo sus indices.
  if (conNombresColumnas) {
    figura.nombresColumnas.forEach((nombre, j) =>
      poner(elemento('span', 'nombre-de-indice', nombre), r, colIndice + 1 + j)
    );
    r++;
  }
  for (let j = 0; j < columnas; j++) poner(elemento('span', 'indice', j), r, colIndice + 1 + j);
  const primeraFila = r + 1;
  if (conRotuloFilas) {
    poner(elemento('span', 'rotulo rotulo-filas', figura.rotuloFilas), primeraFila, 1, 1, filas.length);
  }
  filas.forEach((fila, i) => {
    if (conNombresFilas) {
      poner(elemento('span', 'nombre-de-indice de-fila', figura.nombresFilas[i]), primeraFila + i, colIndice - 1);
    }
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
  const indice = repasando ?? hechas.length;
  const consigna = serie?.consignas[indice];
  const esCuestionario = Boolean(consigna?.opciones);
  const esPila = Boolean(consigna?.pila);
  if (!consigna || (!esCuestionario && !esPila && $('respuesta').readOnly)) return;
  pendiente = null;
  // En una de opciones la respuesta es el lugar de la opcion elegida.
  const elegida = esCuestionario ? document.querySelector('#opciones input:checked') : null;
  if (esCuestionario && !elegida) {
    mostrarResultado([mensaje('aviso', 'Elija una de las opciones para comprobar.')]);
    return;
  }
  const respuesta = esCuestionario ? elegida.value : esPila ? respuestaDePila(consigna) : $('respuesta').value;
  let r;
  try {
    r = corregirPaso(analizador, serie, indice, avanceMostrado(), respuesta);
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
  // Un repaso no cuenta como intento: la serie ya estaba resuelta.
  if (repasando == null) {
    registrarIntento(consigna, r);
    enviarIntento({
      serie: serie.id,
      consigna: consigna.id,
      resultado: r.correcto ? (r.mejorable ? 'mejorable' : 'correcto') : 'incorrecto',
      conAyuda: pidioSolucion,
      codigos: codigosDe(r),
    });
  }
  ofrecerInforme(consigna, esCuestionario, respuesta, r);
  if (esPila) marcarPila(consigna, r.diagnosticos);
  else if (!esCuestionario) editor.marcar(r.diagnosticos);

  // En un cuestionario el mensaje de la opcion va debajo de ella.
  let cajas = r.diagnosticos.map((d) => mensaje(d.nivel, d.mensaje, d.linea, d.bloques));
  let delaOpcion = null;
  if (esCuestionario) {
    const lugar = Number(respuesta);
    const d = r.diagnosticos[0];
    cajas = [];
    if (d) delaOpcion = mensajeDeOpcion(lugar, r.correcto ? 'bien' : 'error', d.mensaje, r.correcto ? 'correcta' : 'incorrecta');
    else cajasDeOpcion.get(lugar).etiqueta.classList.add('correcta');
    if (r.correcto) explicarLasDemas(consigna, capturasPrevias(serie, indice, avanceMostrado()), lugar);
  }
  $('siguiente').hidden = !r.correcto;
  if (r.correcto) {
    pendiente = {
      hecha: { codigo: respuesta.trim(), conAyuda: pidioSolucion, excelente: !r.mejorable },
      resultado: r,
    };
    const ultima = repasando == null && hechas.length + 1 >= serie.consignas.length;
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
      $('siguiente').textContent = repasando != null ? 'Volver así' : ultima ? 'Terminar así' : 'Seguir así';
    } else {
      cajas.unshift(mensaje('bien', pidePracticas(serie) ? 'Excelente.' : 'Correcto.'));
      $('respuesta').readOnly = true;
      for (const radio of document.querySelectorAll('#opciones input')) radio.disabled = true;
      if (esPila) bloquearPila();
      $('comprobar').hidden = true;
      // "Ver una solucion" queda: con la respuesta bien, es otra forma de resolver lo mismo.
      $('siguiente').textContent = repasando != null ? 'Volver' : ultima ? 'Terminar' : 'Siguiente';
      $('siguiente').focus({ preventScroll: true });
    }
  }
  mostrarResultado(cajas, delaOpcion);
}

// Los mensajes quedan debajo del editor, y con el codigo previo arriba suelen
// caer fuera de la pantalla: sin esto, comprobar parece no hacer nada. Se
// desplaza lo justo para que entren, sin llevarse el editor si no hace falta.
// "destino" es el mensaje de una opcion, si lo que hay que ver esta ahi.
function mostrarResultado(cajas, destino) {
  const resultado = $('resultado');
  resultado.replaceChildren(...cajas);
  const sinAnimar = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  (cajas.length ? resultado : destino || resultado).scrollIntoView({ behavior: sinAnimar ? 'auto' : 'smooth', block: 'nearest' });
}

// Lo comprobado vale para el texto que se comprobo: si despues lo cambia, hay
// que comprobar de nuevo antes de seguir.
function alEscribir() {
  if (!pendiente) return;
  pendiente = null;
  $('siguiente').hidden = true;
  $('resultado').replaceChildren();
  ocultarInforme();
}

// ---- informar un problema -------------------------------------------------------

const MAX_RESPUESTA = 5000;
const MAX_PREVIO = 15000;
const MAX_MENSAJES = 4000;

function recortar(texto, largo) {
  return texto.length > largo ? texto.slice(0, largo) + '\n// ...(recortado)' : texto;
}

// Los mensajes tal como se le mostraron, con su codigo: el texto puede haber
// cambiado cuando se lea el informe, y el codigo dice de que regla venian.
function mensajesComoTexto(r) {
  return r.diagnosticos
    .map((d) => {
      const donde = d.linea != null ? ` linea ${d.linea}` : '';
      const bloques = (d.bloques || []).map((b) => (b.titulo ? b.titulo + '\n' : '') + b.lineas.join('\n'));
      return [`[${d.nivel}${d.codigo ? ' ' + d.codigo : ''}${donde}] ${d.mensaje}`, ...bloques].join('\n');
    })
    .join('\n');
}

// Se ofrece despues de cada comprobacion, tambien cuando dijo "Correcto": a veces
// el alumno cree justamente que no lo es.
function ofrecerInforme(consigna, esCuestionario, respuesta, r) {
  if (!enviaEstadisticas()) return;
  const indice = repasando ?? hechas.length;
  const avanceVisto = avanceMostrado();
  const capturas = capturasPrevias(serie, indice, avanceVisto);
  informable = {
    serie: serie.id,
    consigna: consigna.id,
    resultado: r.correcto ? (r.mejorable ? 'mejorable' : 'correcto') : 'incorrecto',
    mensajes: recortar(mensajesComoTexto(r), MAX_MENSAJES),
    respuesta: recortar(
      consigna.opciones ? sustituir(consigna.opciones[Number(respuesta)].texto, capturas) : respuesta,
      MAX_RESPUESTA
    ),
    previo: recortar(
      esCuestionario || consigna.pila ? programaDeOpciones(serie, indice, avanceVisto) : codigoPrevio(serie, indice, avanceVisto),
      MAX_PREVIO
    ),
  };
  $('informar').hidden = false;
  $('abrir-informe').hidden = false;
  $('informe').hidden = true;
  $('informe-enviado').hidden = true;
}

function ocultarInforme() {
  informable = null;
  $('informar').hidden = true;
  $('informe').hidden = true;
  $('informe-enviado').hidden = true;
}

function abrirInforme(abierto) {
  $('informe').hidden = !abierto;
  $('abrir-informe').hidden = abierto;
  if (abierto) $('informe-texto').focus();
}

function alInformar(evento) {
  evento.preventDefault();
  if (!informable) return;
  const conCodigo = $('informe-codigo').checked;
  const numero = numeroDeInforme();
  enviarInforme({
    numero,
    motivo: $('informe-tipo').value,
    comentario: $('informe-texto').value.trim().slice(0, 1000),
    serie: informable.serie,
    consigna: informable.consigna,
    resultado: informable.resultado,
    mensajes: informable.mensajes,
    respuesta: conCodigo ? informable.respuesta : null,
    previo: conCodigo ? informable.previo : null,
  });
  $('informe').reset();
  $('informe').hidden = true;
  $('informe-enviado').textContent =
    `Gracias, el informe se envió. Su número es ${numero}: si quiere, puede mencionárselo al docente en clase.`;
  $('informe-enviado').hidden = false;
}

// Modo docente: va a la consigna "destino" completando las anteriores con sus
// soluciones de referencia, como si se hubieran resuelto, para que el codigo
// que ve sea el que corresponde. Se guarda en el avance del modo docente.
function irA(destino) {
  const nuevas = [];
  let hasta = inicio();
  for (let i = 0; i < destino; i++) {
    const consigna = serie.consignas[i];
    const codigo = respuestaDeReferencia(consigna, capturasPrevias(serie, i, hasta));
    let r;
    try {
      r = corregirPaso(analizador, serie, i, hasta, codigo);
    } catch (e) {
      console.error(`La serie "${serie.id}" esta mal armada:`, e);
      break;
    }
    // Si la referencia no pasa, el salto se queda ahi: asi se ve que algo anda mal.
    if (!r.correcto) break;
    hasta = despuesDe(serie, i, hasta, codigo, r);
    nuevas.push({ codigo: codigo.trim(), conAyuda: false, excelente: !r.mejorable });
  }
  guardar(claveAvance(serie), nuevas);
  abrirSerie(serie);
  window.scrollTo(0, 0);
  const encadenada = continuaLaAnterior(serie, nuevas.length) || serie.consignas[nuevas.length]?.sigueDe || serie.consignas[nuevas.length]?.parteDe;
  const aviso = $('aviso-salto');
  if (nuevas.length < destino) {
    aviso.textContent = `La solución de referencia de la consigna ${nuevas.length + 1} no pasa: el salto se detuvo ahí.`;
  } else if (destino > 0 && encadenada) {
    aviso.textContent = 'Esta consigna sigue de las anteriores: se completaron con sus soluciones de referencia.';
  } else {
    aviso.textContent = '';
  }
  aviso.hidden = !aviso.textContent;
}

// El avance que corresponde a la consigna que se ve: el de ahora, o el que
// habia antes de la que se repasa.
function avanceMostrado() {
  return repasando != null ? antes[repasando] : avance;
}

// Volver a resolver una consigna ya resuelta. No toca lo guardado: la respuesta
// y la estrella quedan como estaban y se vuelve a donde se estaba.
function repasar(lugar) {
  if (lugar >= hechas.length) return;
  if (repasando == null && !$('respuesta').readOnly) borrador = $('respuesta').value;
  repasando = lugar;
  mostrarConsigna();
  window.scrollTo(0, 0);
}

function salirDelRepaso() {
  repasando = null;
  mostrarConsigna();
  window.scrollTo(0, 0);
}

function siguiente() {
  if (!pendiente) return;
  if (repasando != null) {
    salirDelRepaso();
    return;
  }
  const { hecha, resultado } = pendiente;
  hecha.capturas = capturasPrevias(serie, hechas.length, avance);
  antes[hechas.length] = avance;
  avance = despuesDe(serie, hechas.length, avance, hecha.codigo, resultado);
  hechas.push(hecha);
  guardar(claveAvance(serie), hechas);
  mostrarConsigna();
  // La consigna nueva se lee desde el principio, no desde donde quedo el editor.
  window.scrollTo(0, 0);
}

function verSolucion() {
  const indice = repasando ?? hechas.length;
  const consigna = serie?.consignas[indice];
  if (!consigna || consigna.opciones || consigna.pila) return;
  // La referencia nombra las cosas a su manera ("struct Puesto"): solo sirve
  // tal cual si el alumno viene siguiendo las referencias. Si no, se le
  // muestra como ejemplo y la adapta a sus nombres.
  pidioSolucion = true;
  // Con los nombres que el alumno uso antes, cuando la referencia los nombra.
  const referencia = respuestaDeReferencia(consigna, capturasPrevias(serie, indice, avanceMostrado()));
  const r = corregirPaso(analizador, serie, indice, avanceMostrado(), referencia);
  // Con la respuesta ya bien, la solucion es otra forma de resolver lo mismo y
  // se muestra debajo del resultado, que se queda.
  const yaResuelta = Boolean(pendiente);
  const nota = yaResuelta
    ? 'Esta es una solución posible: otra forma de resolver lo mismo, para que la compare con la suya.'
    : r.correcto
      ? 'Esta es una solución posible. Puede escribirla o copiarla, y comprobar.'
      : 'Esta es una solución posible, escrita con otros nombres: hay que adaptarla a los que usó usted.';
  const ejemplo = document.createElement('pre');
  pintar(ejemplo, referencia);
  if (!yaResuelta) $('respuesta').focus({ preventScroll: true });
  const anteriores = yaResuelta ? [...$('resultado').children].filter((c) => !c.dataset.solucion) : [];
  const caja = mensaje('aviso', nota);
  caja.dataset.solucion = '1';
  ejemplo.dataset.solucion = '1';
  mostrarResultado([...anteriores, caja, ejemplo]);
}

function reiniciar() {
  guardar(claveAvance(serie), []);
  abrirSerie(serie);
}

// Las teclas de escribir codigo (Tab, la sangria) las maneja el editor.
function teclaEnRespuesta(evento) {
  if (evento.key === 'Enter' && (evento.ctrlKey || evento.metaKey)) {
    evento.preventDefault();
    // Con la tecla mantenida el navegador repite el evento: es un solo intento.
    if (evento.repeat) return;
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
    const grupo = {
      id: g.id,
      titulo: g.titulo,
      descripcion: g.descripcion,
      agrupar: !!g.agrupar,
      oculto: !!g.oculto,
      series: [],
    };
    leidas[k].forEach((leida, i) => {
      if (leida.status === 'rejected') {
        console.error(`No se pudo cargar la serie ${g.series[i]}:`, leida.reason);
      } else if (buenas.some((s) => s.id === leida.value.id)) {
        console.error(`La serie ${g.series[i]} repite el id "${leida.value.id}" y no se muestra.`);
      } else {
        const s = leida.value;
        // "oculto" en el grupo, u "ocultas" con los archivos de las series: no se
        // listan para los alumnos, pero se abren por su direccion.
        s.oculta = grupo.oculto || (g.ocultas || []).includes(g.series[i]);
        // El numero cuenta lo que se ve en la lista; en la vista del docente, todo.
        const antes = grupo.series.filter((x) => VE_LAS_OCULTAS || !x.oculta).length;
        grupo.series.push(s);
        s.numero = VE_LAS_OCULTAS || !s.oculta ? antes + 1 : grupo.series.length;
        s.grupo = { id: grupo.id, titulo: grupo.titulo };
        buenas.push(s);
      }
    });
    if (grupo.series.length) delIndice.push(grupo);
  });
  return { series: buenas, grupos: delIndice };
}
async function iniciar() {
  $('aviso-estadisticas').hidden = !enviaEstadisticas();
  // Se nota que es el modo docente: no se envia nada y se ven las series ocultas.
  $('modo-docente').hidden = !VE_LAS_OCULTAS;
  $('salir-docente').hidden = !esDocente();
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
  $('salir-repaso').addEventListener('click', salirDelRepaso);
  $('usar-anterior').addEventListener('click', () => {
    if (repasando == null || !hechas[repasando]) return;
    editor.poner(hechas[repasando].codigo);
    $('respuesta').focus({ preventScroll: true });
  });
  $('ver-solucion').addEventListener('click', verSolucion);
  $('reiniciar').addEventListener('click', reiniciar);
  $('respuesta').addEventListener('keydown', teclaEnRespuesta);
  $('respuesta').addEventListener('input', alEscribir);
  $('pila').addEventListener('input', alEscribirEnPila);
  // Cambiar la opcion elegida deja sin efecto lo que se habia dicho de la anterior.
  $('opciones').addEventListener('change', () => {
    pendiente = null;
    $('siguiente').hidden = true;
    $('resultado').replaceChildren();
    ocultarInforme();
  });
  $('abrir-informe').addEventListener('click', () => abrirInforme(true));
  $('cancelar-informe').addEventListener('click', () => abrirInforme(false));
  $('informe').addEventListener('submit', alInformar);
  window.addEventListener('hashchange', navegar);
  navegar();
}

iniciar();
