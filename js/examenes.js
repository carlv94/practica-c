// La página de exámenes resueltos, en tres niveles como las series: la lista de exámenes (una tarjeta cada uno), la página de un examen con
// una tarjeta por ejercicio y la página de un ejercicio, con su enunciado general y, en solapas, la solución de cada módulo con una
// explicación breve y, debajo, el paso a paso del reproductor (con la figura y todas las ayudas) del programa completo.
//
// Qué exámenes hay lo dice examenes/indice.json; cada uno es un archivo (examenes/2026-c2-parcial-2.json) con esta forma:
//   { id, titulo, detalle, fecha, visibleDesde,
//     ejercicios: [{ id, titulo, puntos, resumen?, enunciado, codigoDado?, continua?, dibujos?: [{ titulo, valores }],
//                    modulos: [{ id, titulo, puntos, enunciado, solucion, explicacion, tituloDibujos?, introDibujos?, dibujos?: [{ titulo, valores | digitos, indices?, marca?, texto? }] }],
//                    programa, entrada, salida?, nota? }] }
// "programa" es el programa completo que se ejecuta paso a paso, y cada "solucion" tiene que estar escrita igual adentro (lo comprueba
// pruebas/index.html). "visibleDesde" (AAAA-MM-DD) esconde el examen de la lista hasta esa fecha, salvo en el modo docente o en esta PC.
//
// En la dirección: #/ es la lista, #/2026-c2-parcial-2 es un examen, #/2026-c2-parcial-2/ej2 es un ejercicio y #/2026-c2-parcial-2/ej2/b abre su
// solapa b. Cambiar de solapa no suma una entrada al historial; cambiar de página, sí.

import { cargarAnalizador } from './analizador.js';
import { pintar } from './editor.js';
import { bloquesDeEnunciado } from './enunciado.js';
import { esLocal, esDocente } from './estadisticas.js';

const CARPETA = 'examenes/';
const VE_TODO = esLocal() || esDocente();

const $ = (id) => document.getElementById(id);

function nodo(etiqueta, clase, texto) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
}

// Texto con `codigo` entre acentos graves, a nodos: nunca como HTML.
function conCodigo(texto) {
  const fragmento = document.createDocumentFragment();
  texto.split('`').forEach((parte, i) => {
    if (!parte) return;
    if (i % 2) fragmento.appendChild(nodo('code', null, parte));
    else fragmento.appendChild(document.createTextNode(parte));
  });
  return fragmento;
}

function conTexto(etiqueta, clase, texto) {
  const e = nodo(etiqueta, clase);
  e.appendChild(conCodigo(texto));
  return e;
}

// Un enunciado a nodos: párrafos (los renglones en blanco los separan), listas con "- " y advertencias con "! ".
function enunciadoA(contenedor, texto) {
  for (const b of bloquesDeEnunciado(texto)) {
    if (b.texto != null) {
      for (const parrafo of b.texto.split(/\n\s*\n/)) if (parrafo.trim()) contenedor.appendChild(conTexto('p', null, parrafo.trim()));
    } else if (b.items) {
      const lista = nodo('ul');
      for (const item of b.items) lista.appendChild(conTexto('li', null, item));
      contenedor.appendChild(lista);
    } else if (b.formula != null) {
      contenedor.appendChild(nodo('pre', null, b.formula));
    } else if (b.advertencia != null) {
      contenedor.appendChild(conTexto('p', 'mensaje aviso', b.advertencia));
    }
  }
}

function codigoA(contenedor, texto) {
  const pre = nodo('pre');
  pintar(pre, texto);
  contenedor.appendChild(pre);
}

// Un arreglo como una fila de casilleros con su índice arriba (los mismos estilos que el de las consignas).
// Una ficha de datos (una estructura): su título y, por cada campo, el nombre y el valor de ejemplo (o una línea, donde iría). "resaltar" son
// los campos que se marcan. Usa las mismas clases que las fichas de las consignas.
function fichaA(ficha) {
  const tarjeta = nodo('div', 'ficha');
  if (ficha.titulo) tarjeta.appendChild(nodo('p', 'ficha-titulo', ficha.titulo));
  const cuerpo = nodo('dl', 'ficha-cuerpo');
  for (const campo of ficha.campos) {
    const nombre = nodo('dt');
    nombre.appendChild(nodo('code', null, campo.nombre));
    const sinValor = campo.ejemplo == null;
    const marcado = (ficha.resaltar || []).includes(campo.nombre);
    cuerpo.append(nombre, nodo('dd', sinValor ? 'ficha-linea' : marcado ? 'ficha-nuevo' : null, sinValor ? '' : String(campo.ejemplo)));
  }
  tarjeta.appendChild(cuerpo);
  return tarjeta;
}

// Un dibujo del seguimiento de un módulo: el título, el dibujo y, si hay, el texto que lo explica. El dibujo es un arreglo ("valores", con
// "indices" opcional que reemplaza a 0, 1, 2...; un valor "?" es una posición sin valor y "…" las posiciones que no se dibujan) o los dígitos
// o fichas de datos ("fichas": [{ titulo, campos: [{ nombre, ejemplo? }], resaltar? }], una al lado de la otra si caben) o los dígitos
// de un número ("digitos": '4732', sin casillas, con "aportes" opcional: lo que suma cada dígito, debajo de él). "marca" (un número o una lista)
// son las casillas o los dígitos que se están tocando.
function arregloA(contenedor, dibujo) {
  const caja = nodo('div', 'dibujo-arreglo');
  if (dibujo.titulo) caja.appendChild(conTexto('p', 'titulo-figura', dibujo.titulo));
  const marcadas = [].concat(dibujo.marca ?? []);
  const fila = nodo('div', dibujo.fichas ? (dibujo.fichas.length > 1 ? 'fichas-en-fila' : 'fichas-solas') : dibujo.digitos != null ? 'digitos' : 'arreglo');
  const sinTildes = (dibujo.titulo || (dibujo.fichas ? 'Fichas' : dibujo.digitos != null ? 'Dígitos' : 'Arreglo')).replace(/`/g, '');
  if (dibujo.fichas) {
    for (const f of dibujo.fichas) fila.appendChild(fichaA(f));
    fila.setAttribute('aria-label', `${sinTildes} ${dibujo.fichas.map((f) => `${f.titulo}: ${f.campos.map((c) => c.nombre + (c.ejemplo != null ? ' ' + c.ejemplo : '')).join(', ')}`).join('; ')}`);
  } else if (dibujo.digitos != null) {
    const digitos = [...String(dibujo.digitos)];
    digitos.forEach((digito, i) => {
      const celda = nodo('span', marcadas.includes(i) ? 'digito digito-marcado' : 'digito', digito);
      if (!dibujo.aportes) return fila.appendChild(celda);
      // "aportes" (opcional): lo que suma cada dígito, debajo de él
      const columna = nodo('span', marcadas.includes(i) ? 'digito-columna digito-columna-marcada' : 'digito-columna');
      columna.append(celda, nodo('span', 'aporte', '+' + dibujo.aportes[i]));
      fila.appendChild(columna);
    });
    fila.setAttribute(
      'aria-label',
      `${sinTildes} ${digitos.join(' ')}${marcadas.length ? '; evaluados: ' + marcadas.map((i) => digitos[i]).join(', ') : ''}${dibujo.aportes ? '; aportes: ' + dibujo.aportes.join(', ') : ''}`
    );
  } else {
    dibujo.valores.forEach((valor, i) => {
      const salto = valor === '…';
      const casillero = nodo('div', salto ? 'casillero casillero-salto' : 'casillero');
      const clases = ['valor', marcadas.includes(i) ? 'resaltado' : '', valor === '?' ? 'sin-valor' : ''].filter(Boolean).join(' ');
      casillero.append(nodo('span', 'indice', dibujo.indices ? dibujo.indices[i] : i), nodo('span', clases, valor));
      fila.appendChild(casillero);
    });
    fila.setAttribute('aria-label', `${sinTildes} ${dibujo.valores.join(', ')}`);
  }
  fila.setAttribute('role', 'img');
  caja.appendChild(fila);
  if (dibujo.texto) caja.appendChild(conTexto('p', 'texto-figura', dibujo.texto));
  contenedor.appendChild(caja);
}

const puntosDe = (e) => e.ejercicios.reduce((s, x) => s + x.puntos, 0);

function formatoFecha(fecha) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

// ¿Ya se puede mostrar a los alumnos? Sin fecha, sí.
function paraAlumnos(examen, hoy = new Date()) {
  if (!examen.visibleDesde) return true;
  return hoy >= new Date(examen.visibleDesde + 'T00:00:00');
}

// En el modo docente (o en esta PC) también se ven los que todavía no están publicados.
const publicado = (examen) => VE_TODO || paraAlumnos(examen);

async function leerJson(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error(`No se pudo leer ${ruta}`);
  return r.json();
}

// ------------------------------------------------------------------ solapas

// Desplaza la tira (solo la tira, nunca la página) hasta dejar el botón elegido entero a la vista, en el centro si se puede: en el
// celular la tira se desliza hacia el costado y la solapa elegida podía quedar cortada.
function centrar(boton, lista, animar, repetida = false) {
  const centro = boton.offsetLeft - (lista.clientWidth - boton.offsetWidth) / 2;
  const izquierda = Math.max(0, Math.min(centro, lista.scrollWidth - lista.clientWidth));
  const quieto = !animar || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  lista.scrollTo({ left: izquierda, behavior: quieto ? 'auto' : 'smooth' });
  // Al abrir la página (enlace directo) los estilos y las tipografías pueden no haber llegado todavía y las medidas cambian: se
  // vuelve a centrar cuando todo cargó, si la solapa sigue siendo la elegida.
  if (!animar) {
    const otraVez = () => {
      if (boton.getAttribute('aria-selected') === 'true') centrar(boton, lista, false, true);
    };
    if (!repetida) requestAnimationFrame(otraVez);
    if (!repetida && document.readyState !== 'complete') window.addEventListener('load', otraVez, { once: true });
  }
}

// Una tira de solapas con sus paneles (de a uno por vez): items = [{ id, etiqueta (nodos), panel }]. Se maneja con el teclado
// (izquierda, derecha, inicio y fin). "alElegir(id)" se llama cada vez que se elige una (también por el teclado o el clic). Al elegir a
// mano la tira se desliza con suavidad hasta mostrar entera la solapa; al abrir un enlace directo, de una vez.
function solapas(descripcion, items, clase, alElegir) {
  const lista = nodo('div', 'solapas ' + clase);
  lista.setAttribute('role', 'tablist');
  lista.setAttribute('aria-label', descripcion);
  const botones = items.map((it, i) => {
    const b = nodo('button', 'solapa');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.id = it.panel.id + '-solapa';
    b.setAttribute('aria-controls', it.panel.id);
    b.append(...it.etiqueta);
    b.addEventListener('click', () => elegir(it.id, false, true));
    b.addEventListener('keydown', (e) => {
      const destino = { ArrowRight: (i + 1) % items.length, ArrowLeft: (i - 1 + items.length) % items.length, Home: 0, End: items.length - 1 }[e.key];
      if (destino == null) return;
      e.preventDefault();
      elegir(items[destino].id, true, true);
    });
    it.panel.setAttribute('role', 'tabpanel');
    it.panel.setAttribute('aria-labelledby', b.id);
    return b;
  });
  lista.append(...botones);
  const elegir = (id, enfocar = false, animar = false) => {
    items.forEach((it, i) => {
      const si = it.id === id;
      botones[i].setAttribute('aria-selected', String(si));
      botones[i].tabIndex = si ? 0 : -1;
      it.panel.hidden = !si;
      if (si) {
        if (enfocar) botones[i].focus({ preventScroll: true });
        centrar(botones[i], lista, animar);
      }
    });
    if (alElegir) alElegir(id);
  };
  return { lista, elegir, ids: items.map((it) => it.id) };
}

// ----------------------------------------------------------------- un ejercicio

// El paso a paso del programa completo, en su sección (fuera de las solapas): el reproductor con la figura y todas las ayudas.
async function armarPaso(ejercicio, lugar) {
  lugar.replaceChildren(nodo('p', 'mensaje aviso', 'Preparando el paso a paso...'));
  try {
    const [analizador, { ejecutar }, { crearReproductor }, { mensajeDeError }] = await Promise.all([
      cargarAnalizador(),
      import('./motor/interprete.js'),
      import('./motor/reproductor.js'),
      import('./motor/mensajes.js'),
    ]);
    const res = ejecutar(analizador, ejercicio.programa, { entrada: ejercicio.entrada || '', traza: true, preguntas: true });
    const error = res.error ? { ...res.error, ...mensajeDeError(res.error) } : null;
    lugar.replaceChildren(
      crearReproductor({
        codigo: ejercicio.programa,
        traza: res.traza,
        error,
        titulo: ejercicio.titulo,
        funciones: res.funciones,
        entrada: res.entrada,
        llamadas: res.llamadas,
      })
    );
  } catch (e) {
    lugar.replaceChildren(nodo('p', 'mensaje error', 'No se pudo preparar el paso a paso de este ejercicio.'));
  }
}

// El contenido de la página de un ejercicio: el título, el enunciado general, las solapas de los módulos (enunciado, resolución y
// explicación de cada uno) y, debajo, el paso a paso del programa completo. "alCambiar(solapa)" se llama cada vez que se elige una solapa.
function ejercicioA(ejercicio, alCambiar) {
  const pagina = nodo('section', 'ejercicio');

  const titulo = nodo('h2');
  titulo.append(`${ejercicio.titulo} `, nodo('span', 'puntos', `(${ejercicio.puntos} puntos)`));
  pagina.appendChild(titulo);

  // El enunciado general: lo que hace falta para entender cualquier módulo (los tipos, el ejemplo).
  const enunciado = nodo('div', 'enunciado-general');
  enunciadoA(enunciado, ejercicio.enunciado);
  if (ejercicio.codigoDado) codigoA(enunciado, ejercicio.codigoDado);
  for (const d of ejercicio.dibujos || []) arregloA(enunciado, d);
  if (ejercicio.continua) enunciadoA(enunciado, ejercicio.continua);
  pagina.appendChild(enunciado);

  const items = ejercicio.modulos.map((m) => {
    const p = nodo('div', 'solapa-panel');
    p.id = `panel-${ejercicio.id}-${m.id}`;
    p.hidden = true;
    const rotuloEnunciado = nodo('h4', 'rotulo rotulo-primero', 'Enunciado');
    rotuloEnunciado.appendChild(nodo('span', 'rotulo-puntos', ` · ${m.puntos} puntos`));
    p.appendChild(rotuloEnunciado);
    p.appendChild(conTexto('p', 'modulo-enunciado', m.enunciado));
    p.appendChild(nodo('h4', 'rotulo', 'Resolución'));
    codigoA(p, m.solucion);
    if (m.explicacion) {
      p.appendChild(nodo('h4', 'rotulo', 'Explicación'));
      p.appendChild(conTexto('p', 'modulo-explicacion', m.explicacion));
    }
    // El seguimiento del módulo (cómo cambia el vector, los dígitos...): un desplegable, abierto en pantallas anchas y cerrado en el teléfono.
    if (m.dibujos && m.dibujos.length) {
      const seguimiento = nodo('details', 'seguimiento');
      seguimiento.appendChild(nodo('summary', 'rotulo', `${m.tituloDibujos || 'Seguimiento'} (${m.dibujos.length})`));
      if (m.introDibujos) seguimiento.appendChild(conTexto('p', 'seguimiento-intro', m.introDibujos));
      for (const d of m.dibujos) arregloA(seguimiento, d);
      seguimiento.open = typeof matchMedia === 'function' && matchMedia('(min-width: 700px)').matches;
      p.appendChild(seguimiento);
    }
    return { id: m.id, etiqueta: [`${m.id}) `, nodo('span', 'solapa-nombre', m.titulo)], panel: p };
  });
  const interior = solapas('Módulos del ejercicio', items, 'solapas-partes', alCambiar);
  pagina.appendChild(interior.lista);
  for (const it of items) pagina.appendChild(it.panel);

  // El programa completo, paso a paso, fuera de las solapas (lo arma ahora, sin trabar la página).
  const paso = nodo('section', 'ejercicio-paso');
  paso.appendChild(nodo('h3', null, 'Ejecución paso a paso del programa completo'));
  if (ejercicio.nota) paso.appendChild(conTexto('p', 'ejercicio-nota', ejercicio.nota));
  const lugar = nodo('div', 'ejercicio-pasoapaso');
  paso.appendChild(lugar);
  pagina.appendChild(paso);
  armarPaso(ejercicio, lugar);

  const primera = ejercicio.modulos[0].id;
  return { pagina, ir: (solapa) => interior.elegir(interior.ids.includes(solapa) ? solapa : primera) };
}

// ------------------------------------------------------------------ las páginas

const hashDe = (...partes) => '#/' + partes.map(encodeURIComponent).join('/');

// El enlace de arriba (el de volver a la página de un nivel más arriba), o escondido en la lista.
function volverA(texto, hash) {
  const volver = $('volver');
  volver.hidden = !texto;
  if (texto) {
    volver.textContent = texto;
    volver.href = hash;
  }
}

function ponerTitulo(texto) {
  $('titulo').textContent = texto;
  document.title = texto === 'Exámenes resueltos' ? texto : texto + ' · Exámenes resueltos';
}

// Una tarjeta es un enlace entero (los mismos estilos que las tarjetas de las series).
function tarjeta(hash, titulo, descripcion, estado, oculta) {
  const enlace = nodo('a', 'tarjeta');
  enlace.href = hash;
  enlace.appendChild(nodo('h3', null, titulo));
  if (descripcion) enlace.appendChild(nodo('p', null, descripcion));
  enlace.appendChild(nodo('span', 'estado sin-empezar', estado));
  if (oculta) enlace.appendChild(nodo('span', 'oculta', 'Oculto para los alumnos'));
  return enlace;
}

const cuantos = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

function listaA(contenedor, examenes) {
  ponerTitulo('Exámenes resueltos');
  volverA(null);
  contenedor.replaceChildren(
    conTexto('p', null, 'Los ejercicios de los exámenes con su solución, para ver cómo se resolvían. Cada programa se puede ver paso a paso, con la figura de la memoria y todas las ayudas.')
  );
  if (!examenes.length) contenedor.appendChild(nodo('p', 'mensaje aviso', 'Todavía no hay exámenes publicados.'));
  for (const e of examenes) {
    contenedor.appendChild(
      tarjeta(
        hashDe(e.id),
        e.titulo,
        e.detalle,
        `${formatoFecha(e.fecha)} · ${cuantos(e.ejercicios.length, 'ejercicio', 'ejercicios')} · ${puntosDe(e)} puntos`,
        !paraAlumnos(e)
      )
    );
  }
}

function examenA(contenedor, examen) {
  ponerTitulo(examen.titulo);
  volverA('← Exámenes', '#/');
  const grupo = nodo('div', 'grupo');
  if (examen.detalle) grupo.appendChild(nodo('p', 'grupo-descripcion', examen.detalle));
  grupo.appendChild(nodo('p', 'grupo-resumen', `${formatoFecha(examen.fecha)} · ${cuantos(examen.ejercicios.length, 'ejercicio', 'ejercicios')} · ${puntosDe(examen)} puntos`));
  examen.ejercicios.forEach((x, i) => {
    const modulos = cuantos(x.modulos.length, 'ítem', 'ítems');
    grupo.appendChild(tarjeta(hashDe(examen.id, x.id), `${i + 1}. ${x.titulo}`, x.resumen || x.modulos.map((m) => m.titulo).join(', '), `${x.puntos} puntos · ${modulos}`));
  });
  contenedor.replaceChildren(grupo);
}

let abierto = null; // { examen, ejercicio, ir } la página de ejercicio que se ve

function paginaDeEjercicio(contenedor, examen, ejercicio, solapa) {
  const numero = examen.ejercicios.indexOf(ejercicio) + 1;
  ponerTitulo(`Ejercicio ${numero}`);
  volverA('← ' + examen.titulo, hashDe(examen.id));
  const alCambiar = (id) => {
    // La dirección sigue a lo que se ve (sin sumar una entrada al historial por cada solapa).
    const hash = hashDe(examen.id, ejercicio.id, id);
    if (location.hash !== hash) history.replaceState(null, '', hash);
  };
  const { pagina, ir } = ejercicioA(ejercicio, alCambiar);
  contenedor.replaceChildren(pagina);
  ir(solapa);
  abierto = { examen: examen.id, ejercicio: ejercicio.id, ir };
}

function rutaDeLaDireccion() {
  const m = location.hash.match(/^#\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?/);
  const d = (x) => (x ? decodeURIComponent(x) : null);
  return { examen: m ? d(m[1]) : null, ejercicio: m ? d(m[2]) : null, solapa: m ? d(m[3]) : null };
}

function mostrar(examenes) {
  const contenedor = $('contenido');
  const ruta = rutaDeLaDireccion();
  const examen = ruta.examen && examenes.find((e) => e.id === ruta.examen);
  const ejercicio = examen && ruta.ejercicio && examen.ejercicios.find((x) => x.id === ruta.ejercicio);
  if (ruta.examen && !examen) {
    abierto = null;
    ponerTitulo('Exámenes resueltos');
    volverA('← Exámenes', '#/');
    contenedor.replaceChildren(nodo('p', 'mensaje aviso', 'Ese examen no existe (o todavía no está publicado).'));
    return;
  }
  if (ruta.ejercicio && !ejercicio) {
    abierto = null;
    ponerTitulo(examen.titulo);
    volverA('← ' + examen.titulo, hashDe(examen.id));
    contenedor.replaceChildren(nodo('p', 'mensaje aviso', 'Ese ejercicio no existe.'));
    return;
  }
  // El mismo ejercicio con otra solapa (la dirección cambió a mano o con atrás y adelante): se va a ella sin armar la página de nuevo.
  if (ejercicio && abierto && abierto.examen === examen.id && abierto.ejercicio === ejercicio.id) {
    abierto.ir(ruta.solapa);
    return;
  }
  abierto = null;
  if (ejercicio) paginaDeEjercicio(contenedor, examen, ejercicio, ruta.solapa);
  else if (examen) examenA(contenedor, examen);
  else listaA(contenedor, examenes);
  window.scrollTo(0, 0);
}

async function iniciar() {
  $('modo-docente').hidden = !esDocente();
  try {
    const indice = await leerJson(CARPETA + 'indice.json');
    const todos = await Promise.all(indice.examenes.map((archivo) => leerJson(CARPETA + archivo)));
    const visibles = todos.filter((e) => publicado(e)).sort((a, b) => b.fecha.localeCompare(a.fecha));
    window.addEventListener('hashchange', () => mostrar(visibles));
    mostrar(visibles);
  } catch (e) {
    $('contenido').replaceChildren(nodo('p', 'mensaje error', 'No se pudieron cargar los exámenes.'));
  }
}

iniciar();
