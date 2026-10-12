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
  capturasPrevias,
  corregirPaso,
  despuesDe,
  pidePracticas,
} from './serie.js';
import { crearEditor, pintar } from './editor.js';
import { partesDeEnunciado, figuraDe, sustituir } from './enunciado.js';

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
      const validas = recorrer(s).hechas;
      const resueltas = validas.length;
      const excelentes = validas.filter((h) => h.excelente).length;

      const tarjeta = elemento('a', 'tarjeta');
      tarjeta.href = '#/serie/' + encodeURIComponent(s.id);
      tarjeta.appendChild(elemento('h2', null, s.titulo));
      if (s.descripcion) tarjeta.appendChild(elemento('p', null, s.descripcion));

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
  const previo = termino ? '' : codigoPrevio(serie, actual, avance);
  $('consigna').hidden = termino;
  $('bloque-contexto').hidden = !previo;
  $('bloque-respuesta').hidden = termino;
  $('zona-codigo').hidden = esCuestionario;
  $('opciones').hidden = !esCuestionario;
  $('atajo').hidden = esCuestionario;
  $('bloque-codigo').hidden = !(esCuestionario && consigna.codigo);
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
  $('enunciado').replaceChildren(
    ...partesDeEnunciado(consigna.enunciado, capturas).map((parte) =>
      parte.nombre ? elemento('code', null, parte.nombre) : parte.texto
    )
  );
  dibujar(figuraDe(consigna));
  pintar($('contexto'), previo);
  $('comprobar').hidden = false;
  $('siguiente').hidden = true;
  if (esCuestionario) {
    pintar($('codigo-consigna'), sustituir(consigna.codigo || '', capturas));
    dibujarOpciones(consigna, capturas);
    $('ver-solucion').hidden = true;
    return;
  }
  editor.poner('');
  $('respuesta').readOnly = false;
  $('ver-solucion').hidden = false;
  $('respuesta').focus();
}

// El arreglo del enunciado, como una fila de casilleros con su indice arriba.
function dibujar(figura) {
  const caja = $('figura');
  caja.hidden = !figura;
  caja.replaceChildren();
  if (!figura) return;

  if (figura.clase === 'tabla') {
    dibujarTabla(caja, figura.filas);
    return;
  }

  // Para quien no ve el dibujo, lo mismo dicho en una frase.
  caja.setAttribute(
    'aria-label',
    `Arreglo de ${figura.valores.length} elementos: ${figura.valores.join(', ')}`
  );
  const fila = elemento('div', 'arreglo');
  figura.valores.forEach((valor, i) => {
    const casillero = elemento('div', 'casillero');
    casillero.append(elemento('span', 'indice', i), elemento('span', 'valor', valor));
    fila.appendChild(casillero);
  });
  caja.appendChild(fila);
}

// La tabla: los indices de las columnas arriba y los de las filas a la izquierda.
function dibujarTabla(caja, filas) {
  const columnas = filas[0].length;
  caja.setAttribute(
    'aria-label',
    `Tabla de ${filas.length} filas y ${columnas} columnas. ` +
      filas.map((fila, i) => `Fila ${i}: ${fila.join(', ')}`).join('. ')
  );
  const tabla = elemento('div', 'tabla');
  tabla.style.gridTemplateColumns = `auto repeat(${columnas}, auto)`;
  tabla.appendChild(elemento('span', 'indice'));
  for (let j = 0; j < columnas; j++) tabla.appendChild(elemento('span', 'indice', j));
  filas.forEach((fila, i) => {
    tabla.appendChild(elemento('span', 'indice de-fila', i));
    for (const valor of fila) tabla.appendChild(elemento('span', 'valor', valor));
  });
  caja.appendChild(tabla);
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

  const cajas = r.diagnosticos.map((d) => mensaje(d.nivel, d.mensaje, d.linea));
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
      cajas.unshift(
        mensaje('bien', 'Correcto, y se puede mejorar. Puede cambiarlo y comprobar de nuevo, o seguir así.')
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
}

function verSolucion() {
  const consigna = serie?.consignas[hechas.length];
  if (!consigna || consigna.opciones) return;
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
