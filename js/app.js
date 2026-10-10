// La pantalla: una serie de consignas que se resuelven en orden, cada una
// sobre lo que el alumno escribio en las anteriores.
//
// El avance queda en este navegador (localStorage). Solo se guardan las
// respuestas: el contexto y las capturas se rearman corrigiendolas de nuevo al
// abrir, asi que si una consigna cambia sus reglas, el avance se corta donde
// la respuesta vieja deja de valer en vez de seguir con datos que no cierran.

import { cargarAnalizador } from './analizador.js';
import { corregir } from './corrector.js';
import { crearEditor, pintar } from './editor.js';

const SERIE = 'consignas/estructuras.json';
const MAX_INTENTOS = 500;

const $ = (id) => document.getElementById(id);

const editor = crearEditor($('respuesta'));
let analizador = null;
let serie = null;
let hechas = []; // [{ codigo, conAyuda }], una por consigna resuelta
let contexto = '';
let capturas = {};
let pendiente = null; // la respuesta correcta que espera el "Siguiente"
let pidioSolucion = false;

const claveAvance = () => 'practica-c:avance:' + serie.id;
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

// Rearma el contexto y las capturas desde las respuestas guardadas.
function reconstruir(guardadas) {
  hechas = [];
  contexto = '';
  capturas = {};
  for (const [i, hecha] of guardadas.entries()) {
    const consigna = serie.consignas[i];
    if (!consigna) break;
    const r = corregir(analizador, consigna, { contexto, respuesta: hecha.codigo, capturas });
    if (!r.correcto) break;
    aceptar(hecha, r);
  }
}

function aceptar(hecha, resultado) {
  hechas.push(hecha);
  capturas = resultado.capturas;
  contexto += (contexto ? '\n\n' : '') + hecha.codigo;
}

function mostrar() {
  const actual = hechas.length;
  const consigna = serie.consignas[actual];
  pendiente = null;
  pidioSolucion = false;

  $('titulo-serie').textContent = serie.titulo;
  $('pasos').replaceChildren(
    ...serie.consignas.map((c, i) => {
      const paso = document.createElement('li');
      paso.textContent = `${i + 1}. ${c.titulo}`;
      if (i < actual) paso.className = 'hecho';
      if (i === actual) paso.className = 'actual';
      return paso;
    })
  );

  const termino = !consigna;
  $('consigna').hidden = termino;
  $('bloque-contexto').hidden = termino || !contexto;
  $('bloque-respuesta').hidden = termino;
  $('final').hidden = !termino;
  $('resultado').replaceChildren();

  if (termino) {
    const conAyuda = hechas.filter((h) => h.conAyuda).length;
    $('resumen-final').textContent =
      `Resolvió las ${hechas.length} consignas` +
      (conAyuda ? `, ${conAyuda} de ellas mirando la solución.` : ' sin mirar ninguna solución.');
    pintar($('codigo-final'), contexto);
    return;
  }

  $('titulo-consigna').textContent = `${actual + 1}. ${consigna.titulo}`;
  $('enunciado').textContent = consigna.enunciado;
  pintar($('contexto'), contexto);
  editor.poner('');
  $('respuesta').readOnly = false;
  $('comprobar').hidden = false;
  $('siguiente').hidden = true;
  $('ver-solucion').hidden = false;
  $('respuesta').focus();
}

function comprobar() {
  const consigna = serie.consignas[hechas.length];
  if (!consigna || pendiente) return;
  const respuesta = $('respuesta').value;
  const r = corregir(analizador, consigna, { contexto, respuesta, capturas });
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
  aceptar(pendiente.hecha, pendiente.resultado);
  guardar(claveAvance(), hechas);
  mostrar();
}

function verSolucion() {
  const consigna = serie.consignas[hechas.length];
  if (!consigna) return;
  // La referencia nombra las cosas a su manera ("struct Puesto"): solo sirve
  // tal cual si el alumno viene siguiendo las referencias. Si no, se le
  // muestra como ejemplo y la adapta a sus nombres.
  pidioSolucion = true;
  const r = corregir(analizador, consigna, { contexto, respuesta: consigna.referencia, capturas });
  const nota = r.correcto
    ? 'Esta es una solución posible. Puede escribirla o copiarla, y comprobar.'
    : 'Esta es una solución posible, escrita con otros nombres: hay que adaptarla a los que usó usted.';
  const ejemplo = document.createElement('pre');
  pintar(ejemplo, consigna.referencia);
  $('resultado').replaceChildren(mensaje('aviso', nota), ejemplo);
  $('respuesta').focus();
}

function reiniciar() {
  guardar(claveAvance(), []);
  reconstruir([]);
  mostrar();
}

// Las teclas de escribir codigo (Tab, la sangria) las maneja el editor.
function teclaEnRespuesta(evento) {
  if (evento.key === 'Enter' && (evento.ctrlKey || evento.metaKey)) {
    evento.preventDefault();
    comprobar();
  }
}

async function iniciar() {
  try {
    [analizador, serie] = await Promise.all([
      cargarAnalizador(),
      fetch(SERIE).then((r) => {
        if (!r.ok) throw new Error('No se pudo leer ' + SERIE);
        return r.json();
      }),
    ]);
  } catch (e) {
    $('resultado').replaceChildren(
      mensaje('error', 'No se pudo cargar la práctica. Revise la conexión y vuelva a abrir la página.')
    );
    console.error(e);
    return;
  }

  reconstruir(leer(claveAvance(), []));
  $('comprobar').disabled = false;
  $('comprobar').addEventListener('click', comprobar);
  $('siguiente').addEventListener('click', siguiente);
  $('ver-solucion').addEventListener('click', verSolucion);
  $('reiniciar').addEventListener('click', reiniciar);
  $('respuesta').addEventListener('keydown', teclaEnRespuesta);
  mostrar();
}

iniciar();
