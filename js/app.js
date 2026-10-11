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
import { inicio, codigoPrevio, corregirPaso, despuesDe } from './serie.js';
import { crearEditor, pintar } from './editor.js';
import { partesDeEnunciado } from './enunciado.js';

const CARPETA = 'consignas/';
const INDICE = CARPETA + 'indice.json';
const TITULO = 'Práctica de C';
const MAX_INTENTOS = 500;

const $ = (id) => document.getElementById(id);

const editor = crearEditor($('respuesta'));
let analizador = null;
let series = [];
let serie = null; // la que esta abierta, o null en la lista
let hechas = []; // [{ codigo, conAyuda }], una por consigna resuelta
let avance = inicio(); // el codigo y las capturas que dejan las resueltas
let pendiente = null; // la respuesta correcta que espera el "Siguiente"
let pidioSolucion = false;

const claveAvance = (s) => 'practica-c:avance:' + s.id;
const CLAVE_INTENTOS = 'practica-c:intentos';

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
    conAyuda: pidioSolucion,
    codigos: resultado.diagnosticos.map((d) => d.codigo),
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

function mensaje(clase, texto, linea) {
  const caja = document.createElement('p');
  caja.className = 'mensaje ' + clase;
  if (linea != null) {
    const donde = document.createElement('span');
    donde.className = 'linea';
    donde.textContent = `Línea ${linea}:`;
    caja.appendChild(donde);
  }
  caja.appendChild(conCodigo(texto));
  return caja;
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
    const r = corregirPaso(analizador, s, i, hasta, hecha.codigo);
    if (!r.correcto) break;
    hasta = despuesDe(s, i, hasta, hecha.codigo, r);
    validas.push(hecha);
  }
  return { hechas: validas, avance: hasta };
}

// ---- la lista de series -------------------------------------------------------

function mostrarLista() {
  serie = null;
  document.title = TITULO;
  $('titulo-serie').textContent = TITULO;
  $('volver').hidden = true;
  $('pasos').hidden = true;
  $('vista-serie').hidden = true;
  $('lista').hidden = false;

  $('lista').replaceChildren(
    ...series.map((s) => {
      const total = s.consignas.length;
      const resueltas = recorrer(s).hechas.length;

      const tarjeta = elemento('a', 'tarjeta');
      tarjeta.href = '#/serie/' + encodeURIComponent(s.id);
      tarjeta.appendChild(elemento('h2', null, s.titulo));
      if (s.descripcion) tarjeta.appendChild(elemento('p', null, s.descripcion));

      let estado = 'sin-empezar';
      let texto = total === 1 ? '1 consigna' : `${total} consignas`;
      if (resueltas >= total) {
        estado = 'completa';
        texto = 'Completa';
      } else if (resueltas > 0) {
        estado = 'en-curso';
        texto = `En curso: ${resueltas} de ${total}`;
      }
      tarjeta.appendChild(elemento('span', 'estado ' + estado, texto));
      return tarjeta;
    })
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
  $('pasos').hidden = false;
  mostrarConsigna();
}

function mostrarConsigna() {
  const actual = hechas.length;
  const consigna = serie.consignas[actual];
  pendiente = null;
  pidioSolucion = false;

  document.title = `${serie.titulo} · ${TITULO}`;
  $('titulo-serie').textContent = serie.titulo;
  $('pasos').replaceChildren(
    ...serie.consignas.map((c, i) => {
      const paso = elemento('li', null, `${i + 1}. ${c.titulo}`);
      if (i < actual) paso.className = 'hecho';
      if (i === actual) paso.className = 'actual';
      return paso;
    })
  );

  const termino = !consigna;
  // Lo ya resuelto mas lo que esta consigna trae escrito.
  const previo = termino ? '' : codigoPrevio(serie, actual, avance);
  $('consigna').hidden = termino;
  $('bloque-contexto').hidden = !previo;
  $('bloque-respuesta').hidden = termino;
  $('final').hidden = !termino;
  $('resultado').replaceChildren();

  if (termino) {
    const conAyuda = hechas.filter((h) => h.conAyuda).length;
    $('resumen-final').textContent =
      `Resolvió las ${hechas.length} consignas` +
      (conAyuda ? `, ${conAyuda} de ellas mirando la solución.` : ' sin mirar ninguna solución.');
    pintar($('codigo-final'), avance.contexto);
    return;
  }

  $('titulo-consigna').textContent = `${actual + 1}. ${consigna.titulo}`;
  $('enunciado').replaceChildren(
    ...partesDeEnunciado(consigna.enunciado, avance.capturas).map((parte) =>
      parte.nombre ? elemento('code', null, parte.nombre) : parte.texto
    )
  );
  pintar($('contexto'), previo);
  editor.poner('');
  $('respuesta').readOnly = false;
  $('comprobar').hidden = false;
  $('siguiente').hidden = true;
  $('ver-solucion').hidden = false;
  $('respuesta').focus();
}

function comprobar() {
  const consigna = serie?.consignas[hechas.length];
  if (!consigna || pendiente) return;
  const respuesta = $('respuesta').value;
  const r = corregirPaso(analizador, serie, hechas.length, avance, respuesta);
  registrarIntento(consigna, r);
  editor.marcar(r.diagnosticos);

  const cajas = r.diagnosticos.map((d) => mensaje(d.nivel, d.mensaje, d.linea));
  if (r.correcto) {
    cajas.unshift(mensaje('bien', 'Correcto.'));
    pendiente = { hecha: { codigo: respuesta.trim(), conAyuda: pidioSolucion }, resultado: r };
    $('respuesta').readOnly = true;
    $('comprobar').hidden = true;
    $('ver-solucion').hidden = true;
    $('siguiente').hidden = false;
    $('siguiente').textContent = hechas.length + 1 < serie.consignas.length ? 'Siguiente' : 'Terminar';
    $('siguiente').focus();
  }
  $('resultado').replaceChildren(...cajas);
}

function siguiente() {
  if (!pendiente) return;
  const { hecha, resultado } = pendiente;
  avance = despuesDe(serie, hechas.length, avance, hecha.codigo, resultado);
  hechas.push(hecha);
  guardar(claveAvance(serie), hechas);
  mostrarConsigna();
}

function verSolucion() {
  const consigna = serie?.consignas[hechas.length];
  if (!consigna) return;
  // La referencia nombra las cosas a su manera ("struct Puesto"): solo sirve
  // tal cual si el alumno viene siguiendo las referencias. Si no, se le
  // muestra como ejemplo y la adapta a sus nombres.
  pidioSolucion = true;
  const r = corregirPaso(analizador, serie, hechas.length, avance, consigna.referencia);
  const nota = r.correcto
    ? 'Esta es una solución posible. Puede escribirla o copiarla, y comprobar.'
    : 'Esta es una solución posible, escrita con otros nombres: hay que adaptarla a los que usó usted.';
  const ejemplo = document.createElement('pre');
  pintar(ejemplo, consigna.referencia);
  $('resultado').replaceChildren(mensaje('aviso', nota), ejemplo);
  $('respuesta').focus();
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
  if (s) abrirSerie(s);
  else mostrarLista();
  window.scrollTo(0, 0);
}

async function leerJson(direccion) {
  const r = await fetch(direccion);
  if (!r.ok) throw new Error('No se pudo leer ' + direccion);
  return r.json();
}

// Una serie que no se puede leer no deja sin practica a las demas.
async function cargarSeries() {
  const indice = await leerJson(INDICE);
  const leidas = await Promise.allSettled(indice.series.map((archivo) => leerJson(CARPETA + archivo)));
  const buenas = [];
  leidas.forEach((leida, i) => {
    if (leida.status === 'rejected') {
      console.error(`No se pudo cargar la serie ${indice.series[i]}:`, leida.reason);
    } else if (buenas.some((s) => s.id === leida.value.id)) {
      console.error(`La serie ${indice.series[i]} repite el id "${leida.value.id}" y no se muestra.`);
    } else {
      buenas.push(leida.value);
    }
  });
  return buenas;
}

async function iniciar() {
  try {
    [analizador, series] = await Promise.all([cargarAnalizador(), cargarSeries()]);
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
  window.addEventListener('hashchange', navegar);
  navegar();
}

iniciar();
