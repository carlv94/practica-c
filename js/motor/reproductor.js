// El reproductor paso a paso: el codigo con la linea que esta por ejecutarse y, al
// lado, la figura de la memoria (figura.js) en ese momento. Se avanza y se retrocede
// con los botones, la barra o las flechas del teclado, y se elige la velocidad.
//
//   crearReproductor({ codigo, traza, error, titulo, funciones })   devuelve un elemento
//
//   codigo     el programa, tal como se ejecuto
//   traza      r.traza de ejecutar(..., { traza: true, preguntas: true }) (sin "preguntas" las condiciones no tienen su paso)
//   error      r.error, ya con su mensaje para el alumno: { mensaje }, o null
//   titulo     un titulo opcional
//   cabezas    nombres de las variables que guardan el comienzo de la estructura (ver figura.js)
//   funciones  r.funciones: donde empieza y termina cada funcion; el codigo de afuera de
//              la que se esta ejecutando se ve atenuado
//   llamadas   r.llamadas: el registro de las llamadas de las funciones recursivas, para el trazado (ver el motor)

import { Figura } from './figura.js';
import { tiempo } from './tiempo.js';
import { pintar } from '../editor.js';
import { ajustes, montarAjustes } from '../ajustes.js';

const VELOCIDADES = [
  { nombre: 'Cámara lenta', ms: 4800 },
  { nombre: 'Muy lenta', ms: 2400 },
  { nombre: 'Lenta', ms: 1500 },
  { nombre: 'Normal', ms: 900 },
  { nombre: 'Rápida', ms: 450 },
  { nombre: 'Muy rápida', ms: 200 },
];
const sinMovimiento = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const CLAVE_VELOCIDAD = 'reproductor-velocidad';
const CLAVE_VELOCIDAD_NOMBRE = 'reproductor-velocidad-nombre';
const CLAVE_ZOOM = 'reproductor-zoom';
const NIVELES_DE_ZOOM = [0.4, 0.5, 0.6, 0.8, 1, 1.25, 1.5, 2];

function nodo(etiqueta, clase, contenido) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (contenido != null) e.textContent = contenido;
  return e;
}

// Un texto con partes entre acentos graves: esas partes van como codigo.
function conCodigo(contenedor, texto) {
  contenedor.replaceChildren();
  texto.split('`').forEach((parte, i) => {
    if (i % 2) contenedor.append(nodo('code', '', parte));
    else contenedor.append(parte);
  });
}

// El codigo pintado (ver editor.js) partido en lineas: una lista de listas de nodos.
// Un comentario de varias lineas se parte con su color.
function lineasPintadas(codigo) {
  const entero = document.createElement('div');
  pintar(entero, codigo);
  const lineas = [[]];
  for (const n of entero.childNodes) {
    const partes = n.textContent.split('\n');
    partes.forEach((trozo, i) => {
      if (i > 0) lineas.push([]);
      if (trozo === '') return;
      if (n.nodeType === Node.TEXT_NODE) lineas[lineas.length - 1].push(document.createTextNode(trozo));
      else {
        const copia = n.cloneNode(false);
        copia.textContent = trozo;
        lineas[lineas.length - 1].push(copia);
      }
    });
  }
  return lineas;
}

// La velocidad se guardaba por su posicion; con la lista de antes de "Cámara lenta", la posicion 0 era "Muy lenta".
const VELOCIDADES_ANTES = ['Muy lenta', 'Lenta', 'Normal', 'Rápida', 'Muy rápida'];
const POR_DEFECTO = VELOCIDADES.findIndex((v) => v.nombre === 'Normal');
const leerVelocidad = () => {
  try {
    const nombre = localStorage.getItem(CLAVE_VELOCIDAD_NOMBRE);
    let i = VELOCIDADES.findIndex((v) => v.nombre === nombre);
    if (i < 0 && nombre == null) {
      const antes = VELOCIDADES_ANTES[Number(localStorage.getItem(CLAVE_VELOCIDAD))];
      i = VELOCIDADES.findIndex((v) => v.nombre === antes);
    }
    return i >= 0 ? i : POR_DEFECTO;
  } catch (e) {
    return POR_DEFECTO;
  }
};
const leerZoom = () => {
  try {
    const v = localStorage.getItem(CLAVE_ZOOM);
    return NIVELES_DE_ZOOM.includes(Number(v)) ? Number(v) : 'ajustar';
  } catch (e) {
    return 'ajustar';
  }
};
const guardarZoom = (z) => {
  try {
    localStorage.setItem(CLAVE_ZOOM, String(z));
  } catch (e) {
    // sin almacenamiento: no se recuerda
  }
};
// Los botones para explicar un paso (detener y repetir) se ven solo si se pide.
const CLAVE_EXPLICAR = 'reproductor-explicar';
const leerExplicar = () => {
  try {
    return localStorage.getItem(CLAVE_EXPLICAR) === '1';
  } catch (e) {
    return false;
  }
};
const guardarExplicar = (si) => {
  try {
    localStorage.setItem(CLAVE_EXPLICAR, si ? '1' : '0');
  } catch (e) {
    // sin almacenamiento: no se recuerda
  }
};
const guardarVelocidad = (v) => {
  try {
    localStorage.setItem(CLAVE_VELOCIDAD_NOMBRE, VELOCIDADES[v].nombre);
  } catch (e) {
    // sin almacenamiento: no se recuerda la eleccion
  }
};

export function crearReproductor({ codigo, traza, error = null, titulo = '', funciones = [], cabezas = null, entrada = '', llamadas = [] }) {
  const raiz = nodo('section', 'rep');
  raiz.tabIndex = 0;
  raiz.setAttribute('aria-label', titulo ? `Paso a paso: ${titulo}` : 'Paso a paso');
  if (titulo) raiz.append(nodo('h3', 'rep-titulo-general', titulo));

  const barra = nodo('div', 'rep-barra');
  const boton = (texto, ayuda) => {
    const b = nodo('button', 'rep-boton', texto);
    b.type = 'button';
    b.title = ayuda;
    return b;
  };
  // Un boton con su simbolo y su texto: en una pantalla angosta (vertical en el telefono) solo se ve el simbolo (ver el CSS).
  // El nombre del boton para quien no lo ve (lector de pantalla) es el de la ayuda.
  // Los iconos que dependen de la tipografia del aparato (el emoji de avanzar, la flecha fina de ampliar) se dibujan como
  // imagen: se ven igual en todos los celulares.
  const ICONOS = {
    avanzar: '<path d="M3 4l9 8-9 8zM12 4l9 8-9 8z"/>',
    pausa: '<rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/>',
    detener: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    seguir: '<path d="M7 4l13 8-13 8z"/>',
    repetir: '<path d="M20 12a8 8 0 1 1-2.6-5.9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M20 3.5V9h-5.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    ampliar: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    cerrar: '<path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  };
  const rotular = (b, simbolo, texto, simboloDespues = false) => {
    const s = nodo('span', 'rep-simbolo');
    if (ICONOS[simbolo]) s.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${ICONOS[simbolo]}</svg>`;
    else s.textContent = simbolo;
    s.setAttribute('aria-hidden', 'true');
    const t = nodo('span', 'rep-texto-boton', texto);
    if (simboloDespues) b.replaceChildren(t, ' ', s);
    else b.replaceChildren(s, ' ', t);
  };
  const conSimbolo = (simbolo, texto, ayuda, despues = false) => {
    const b = boton('', ayuda);
    b.setAttribute('aria-label', ayuda);
    rotular(b, simbolo, texto, despues);
    return b;
  };
  const inicio = conSimbolo('⏮', 'Inicio', 'Volver al primer paso');
  const anterior = conSimbolo('◀', 'Anterior', 'Paso anterior (flecha izquierda)');
  const reproducir = conSimbolo('avanzar', 'Reproducir', 'Avanzar solo');
  const siguiente = conSimbolo('▶', 'Siguiente', 'Paso siguiente (flecha derecha)', true);
  const final = conSimbolo('⏭', 'Final', 'Ir al último paso', true);
  // Detener la animacion del paso en el momento en que esta (y seguir despues), y volver a verla desde el principio.
  const detener = conSimbolo('detener', 'Detener', 'Detener la animación (barra espaciadora)');
  const repetir = conSimbolo('repetir', 'Repetir', 'Repetir la animación de este paso (tecla R)');
  detener.classList.add('rep-explicar');
  repetir.classList.add('rep-explicar');
  const barraPasos = document.createElement('input');
  barraPasos.type = 'range';
  barraPasos.className = 'rep-barra-pasos';
  barraPasos.min = '0';
  barraPasos.max = String(traza.length - 1);
  barraPasos.value = '0';
  barraPasos.setAttribute('aria-label', 'Paso');
  const cuenta = nodo('span', 'rep-cuenta');
  const etiquetaVelocidad = nodo('label', 'rep-velocidad');
  etiquetaVelocidad.append(nodo('span', 'rep-velocidad-rotulo', 'Velocidad'));
  const velocidad = document.createElement('select');
  velocidad.setAttribute('aria-label', 'Velocidad de reproducción');
  VELOCIDADES.forEach((v, i) => velocidad.append(new Option(v.nombre, String(i))));
  velocidad.value = String(leerVelocidad());
  etiquetaVelocidad.append(velocidad);
  const ampliarBoton = conSimbolo('ampliar', 'Ampliar', 'Ver el paso a paso en toda la pantalla');
  ampliarBoton.classList.add('rep-ampliar');
  barra.append(inicio, anterior, reproducir, siguiente, final, detener, repetir, barraPasos, cuenta, etiquetaVelocidad, ampliarBoton);
  const giro = nodo('div', 'rep-giro');
  giro.hidden = true;
  const giroTexto = nodo('span', '', 'Gire el teléfono para ver mejor la figura.');
  const giroCerrar = boton('✕', 'Cerrar el aviso');
  giro.append(giroTexto, giroCerrar);

  const cuerpo = nodo('div', 'rep-cuerpo');
  const columnaCodigo = nodo('div', 'rep-columna-codigo');
  const panelCodigo = nodo('div', 'rep-codigo');
  const cerrarCodigo = boton('✕ Cerrar', 'Volver al paso a paso');
  cerrarCodigo.classList.add('rep-cerrar-codigo');
  const verCodigo = boton('Ver todo el código', 'Abrir el programa completo');
  verCodigo.classList.add('rep-ver-codigo');
  const bloqueCodigo = nodo('div', 'rep-lineas');
  panelCodigo.append(bloqueCodigo);
  columnaCodigo.append(panelCodigo, verCodigo);
  const lineas = lineasPintadas(codigo.replace(/\s+$/, '')).map((trozos, i) => {
    const fila = nodo('div', 'rep-linea');
    const fuente = nodo('span', 'rep-fuente');
    if (trozos.length) fuente.append(...trozos);
    else fuente.append(' ');
    fila.append(nodo('span', 'rep-numero', String(i + 1)), fuente);
    bloqueCodigo.append(fila);
    return fila;
  });
  const lado = nodo('div', 'rep-lado');
  const estado = nodo('div', 'rep-estado');
  const figura = nodo('div', 'rep-figura');
  const dibujo = new Figura(figura, { cabezas });
  // En pantallas grandes la condicion que se evalua se muestra en esta franja, arriba de la figura (ver el CSS).
  const franjaPregunta = nodo('div', 'rep-franja-pregunta');
  dibujo.franja = franjaPregunta;
  const consola = nodo('pre', 'rep-consola');
  const nota = nodo('p', 'rep-nota', 'La línea resaltada es la que está por ejecutarse. Lo que cambió con la línea anterior se marca en amarillo, también la flecha nueva.');
  const herramientas = nodo('div', 'rep-herramientas');
  const menos = boton('−', 'Achicar la figura');
  const mas = boton('+', 'Agrandar la figura');
  const ajustar = boton('Ajustar', 'Que la figura entre en el espacio disponible');
  const etiquetaZoom = nodo('span', 'rep-zoom-valor');
  // Las ayudas visuales (nombres de las flechas, brillo de los valores) se eligen en el panel de ajustes (ver js/ajustes.js).
  const aplicarAyudas = () => {
    dibujo.fijarNombres(ajustes.valor('nombresFlechas'));
    dibujo.fijarAyudas(ajustes.todos());
  };
  aplicarAyudas();
  const olvidarAyudas = ajustes.alCambiar(() => {
    if (!raiz.isConnected) {
      olvidarAyudas(); // este reproductor ya no esta en la pagina
      return;
    }
    aplicarAyudas();
    pintarTrazado(paso);
    dibujo.fijarEscala({}); // la figura puede haber vuelto a aparecer
  });
  // Explicar: detener y repetir (la barra espaciadora y la tecla R funcionan siempre) en lugar de inicio, reproducir y final
  // (las teclas Inicio y Fin y la barra de pasos siguen). Asi la barra se queda con cuatro botones.
  const etiquetaExplicar = nodo('label', 'rep-nombres');
  etiquetaExplicar.title =
    'Para explicar un paso con calma: muestra los botones Detener y Repetir y oculta Inicio, Reproducir y Final. La barra espaciadora, la tecla R y las teclas Inicio y Fin funcionan siempre.';
  const casillaExplicar = document.createElement('input');
  casillaExplicar.type = 'checkbox';
  casillaExplicar.checked = leerExplicar();
  etiquetaExplicar.append(casillaExplicar, ' Explicar');
  const mostrarExplicar = () => {
    const si = casillaExplicar.checked;
    detener.hidden = repetir.hidden = !si;
    inicio.hidden = reproducir.hidden = final.hidden = si;
    raiz.classList.toggle('rep-explicando', si);
  };
  mostrarExplicar();
  casillaExplicar.onchange = () => {
    guardarExplicar(casillaExplicar.checked);
    if (casillaExplicar.checked) parar(); // el avance solo no va con explicar
    mostrarExplicar();
  };
  // El engranaje abre el panel de ayudas visuales (perfiles y casillas), debajo de esta fila.
  const abrirAjustes = boton('⚙', 'Ayudas visuales');
  abrirAjustes.classList.add('rep-ajustes-boton');
  abrirAjustes.setAttribute('aria-label', 'Ayudas visuales');
  const panelAjustes = nodo('section', 'ajustes');
  panelAjustes.hidden = true;
  montarAjustes(panelAjustes, abrirAjustes);
  herramientas.append(nodo('span', '', 'Figura'), menos, mas, ajustar, etiquetaZoom, etiquetaExplicar, abrirAjustes, panelAjustes);
  // Lo que ingresa el usuario: el texto de la entrada, con lo que ya se leyo atenuado (solo si el programa tiene entrada).
  const textoDeEntrada = entrada || '';
  const cajaDeEntrada = nodo('pre', 'rep-entrada');
  const conEntrada = textoDeEntrada.length > 0;
  // Hasta donde se leyo de la entrada y si se agoto, en cada paso.
  const leidoEn = [];
  const agotadaEn = [];
  {
    let leido = 0;
    let agotada = false;
    for (const f of traza) {
      if (f.lectura) {
        leido = Math.max(leido, f.lectura.hasta);
        if (f.lectura.agotada) agotada = true;
      }
      leidoEn.push(leido);
      agotadaEn.push(agotada);
    }
  }
  // "resaltar": { desde, hasta } es lo que se acaba de leer (blanco sobre violeta); lo anterior se ve atenuado.
  const pintarEntrada = (indice, resaltar = null) => {
    if (!conEntrada) return;
    const hasta = resaltar ? resaltar.desde : leidoEn[indice];
    const partes = [];
    if (hasta > 0) partes.push(nodo('span', 'rep-entrada-leida', textoDeEntrada.slice(0, hasta)));
    if (resaltar) {
      partes.push(nodo('span', 'rep-salida-nueva', textoDeEntrada.slice(resaltar.desde, resaltar.hasta)));
      partes.push(textoDeEntrada.slice(resaltar.hasta));
    } else partes.push(textoDeEntrada.slice(hasta));
    if (agotadaEn[indice]) partes.push(nodo('span', 'rep-entrada-leida', ' ⏎'));
    cajaDeEntrada.replaceChildren(...partes);
  };
  // El trazado de las llamadas recursivas (ver el registro de llamadas del motor): una tabla con cada llamada que se completa con
  // los pasos. Dos modos (panel de ajustes): la ida y la vuelta en dos columnas, o una sola donde la cuenta se va transformando
  // (la llamada se reemplaza por su valor y despues se resuelve). Si el programa no usa memoria dinamica, reemplaza a la figura.
  const registros = Array.isArray(llamadas) ? llamadas : [];
  const conValores = registros.some((r) => r.ida);
  const sinMonticulo = traza.every((f) => !(f.monticulo && f.monticulo.length));
  const nivelBase = registros.length ? Math.min(...registros.map((r) => r.nivel)) : 0;
  // Con dos llamadas en el mismo return (un arbol) la sangria ayuda a ver que cuelga de que; si no, todo va a la izquierda.
  const ramifica = registros.some((r) => r.ida && r.ida.texto.split(r.funcion + '(').length > 2);
  const trazado = nodo('div', 'rep-trazado');
  trazado.hidden = true;
  const trazadoActivo = () => registros.length > 0 && ajustes.valor('trazado');
  const enUnaColumna = () => conValores && ajustes.valor('trazadoUnaColumna');
  const partesDe = (r) => (r.ida.partes && r.ida.partes.length ? r.ida.partes : [r.ida.texto]);
  const llamadasDe = (r) => partesDe(r).filter((p) => typeof p === 'object');
  const textoDePartes = (r, conValor) =>
    partesDe(r)
      .map((p) => (typeof p === 'string' ? p : conValor ? p.valor : p.llamada))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  // Los tres estados de la cuenta de una fila: la ida (con la llamada), la llamada reemplazada por su valor y el resultado.
  // Un estado que no cambia nada (la llamada sola, o un caso base) es null.
  const estadosDe = (r) => {
    const e1 = textoDePartes(r, false);
    const e2 = llamadasDe(r).length ? textoDePartes(r, true) : null;
    const e3 = r.vuelta.valor;
    return { e1, e2: e2 !== null && e2 !== e1 ? e2 : null, e3: e3 !== (e2 ?? e1) ? e3 : null };
  };
  // Lo que se ve en esa fila, quieta, en el paso k.
  const textoQuieto = (r, k) => {
    if (!r.ida || r.ida.paso > k) return '';
    const { e1, e2, e3 } = estadosDe(r);
    return r.vuelta && r.vuelta.paso <= k ? e3 ?? e2 ?? e1 : e1;
  };
  // Lo que dura la transicion de una fila al llegar su vuelta: la llamada se reemplaza (1,3 unidades), el valor queda un momento
  // en su lugar (0,8) y la cuenta se resuelve (0,8).
  const duracionDeFila = (r, u) => {
    const { e2, e3 } = estadosDe(r);
    return (e2 ? 1.3 * u : 0) + (e2 && e3 ? 0.8 * u : 0) + (e3 ? 0.8 * u : 0);
  };
  // Un fundido es corto, pero no tanto que no se vea con las velocidades rapidas.
  const fundidoDe = (u) => Math.max(0.4 * u, 150);
  // La fila que hace cada llamada (la que la tiene en su ida): de ahi sale la llamada, y la resaltamos al abrirse.
  const padreDe = new Map();
  for (const p of registros) if (p.ida) for (const x of partesDe(p)) if (typeof x === 'object') padreDe.set(x.id, p);
  // Cuanto dura que se abra una llamada: su ida aparece (1 fundido) y respira (1,5) si recien se escribe y despues la llamada brilla
  // (2) mientras aparece el texto de la fila nueva; sin fila que la haga (la primera llamada), solo el fundido de su texto.
  const duracionApertura = (r, k, d) => {
    const padre = padreDe.get(r.id);
    if (!conValores || !padre || !padre.ida) return d;
    return (padre.ida.paso === k ? 2.5 * d : 0) + 2 * d;
  };
  // Cuanto dura el caso base: el foco sobre su fila (3,5 fundidos: el resto de la tabla se atenua, rebotan el valor de la ida y la
  // etiqueta y todo vuelve) y, en tres columnas, despues de una espera (1) el rebote de la vuelta (1,5): 5,5 en total.
  const duracionBase = (r, d, unaColumna) => (conValores && r.ida && !unaColumna ? 5.5 : 3.5) * d;
  // Lo que dura todo lo que se anima al llegar al paso k: llamadas que se abren, lo que aparece de golpe (1 fundido), el caso base
  // y las transiciones del modo de una columna.
  const duracionTrazado = (k, u) => {
    if (!trazadoActivo() || sinMovimiento()) return 0;
    const d = fundidoDe(u);
    const unaColumna = enUnaColumna();
    let total = 0;
    for (const r of registros) {
      const apertura = r.desde === k ? duracionApertura(r, k, d) : 0;
      if (r.desde === k) total = Math.max(total, apertura);
      if (r.base === k) total = Math.max(total, apertura + duracionBase(r, d, unaColumna));
      if (!r.ida) continue;
      if (r.ida.paso === k && r.desde !== k && r.base !== k) total = Math.max(total, d);
      if (r.vuelta && r.vuelta.paso === k && r.desde <= k && r.base !== k) total = Math.max(total, unaColumna ? duracionDeFila(r, u) : d);
    }
    return total;
  };
  // Un texto que resplandece y crece un instante (como el valor que se copia en la figura).
  const resplandor = (el, retraso, duracion, escala = 1.4) => {
    if (!el || !el.animate || !duracion) return;
    el.classList.add('rep-traz-brilla');
    const halo = getComputedStyle(raiz).getPropertyValue('--acento').trim() || '#3b82f6';
    const sin = { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 transparent)' };
    const con = { transform: 'scale(' + escala + ')', filter: 'drop-shadow(0 0 5px ' + halo + ')' };
    el.animate([{ ...sin }, { ...con, offset: 0.3 }, { ...con, offset: 0.6 }, { ...sin }], { duration: duracion, delay: retraso, easing: 'ease-in-out' });
  };
  // El texto de una fila nueva aparece ya expandido, en lo mas alto del brillo de la llamada de la ida, y se contrae con ella: es la
  // misma animacion que la del resplandor, pero invisible hasta ahi. Anclado a la izquierda para que se achique hacia el margen.
  const resplandorQueAparece = (el, retraso, duracion, escala) => {
    if (!el || !el.animate || !duracion) return;
    el.classList.add('rep-traz-brilla');
    el.style.transformOrigin = 'left center';
    const halo = getComputedStyle(raiz).getPropertyValue('--acento').trim() || '#3b82f6';
    const sin = { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 transparent)' };
    const con = { transform: 'scale(' + escala + ')', filter: 'drop-shadow(0 0 5px ' + halo + ')', opacity: 1 };
    el.animate([{ ...sin, opacity: 0 }, { ...con, offset: 0.3 }, { ...con, offset: 0.6 }, { ...sin, opacity: 1 }], { duration: duracion, delay: retraso, easing: 'ease-in-out', fill: 'backwards' });
  };
  // La cuenta de una fila que cambia: la llamada brilla (y el valor de la fila de la que sale, a la vez), se reemplaza por su
  // valor y lo de la derecha se corre de a poco; despues la cuenta se resuelve. Se arma con la tabla ya en la pagina para medir.
  const transformar = (td, r, u, celdasDeValor) => {
    const { e2, e3 } = estadosDe(r);
    const contenedor = nodo('span', 'rep-traz-cuenta');
    const capaA = nodo('span', 'rep-traz-capa');
    const llamadasEnCapa = [];
    for (const p of partesDe(r)) {
      if (typeof p === 'string') {
        capaA.append(p);
        continue;
      }
      const w = nodo('span', 'rep-traz-llamada');
      const a = nodo('span', 'rep-traz-a', p.llamada);
      const b = nodo('span', 'rep-traz-b', p.valor);
      w.append(a, b);
      capaA.append(w);
      llamadasEnCapa.push({ w, a, b, id: p.id });
    }
    contenedor.append(capaA);
    const capaB = e3 ? nodo('span', 'rep-traz-capa rep-traz-fin', e3) : null;
    if (capaB) contenedor.append(capaB);
    td.replaceChildren(contenedor);
    let t = 0;
    if (e2) {
      for (const c of llamadasEnCapa) {
        const ancho = c.a.offsetWidth;
        const nuevo = c.b.offsetWidth;
        c.w.style.width = ancho + 'px';
        resplandor(c.a, 0, 0.6 * u);
        c.a.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 0.3 * u, delay: 0.6 * u, fill: 'forwards' });
        c.b.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 0.3 * u, delay: 0.6 * u, fill: 'forwards' });
        c.w.animate([{ width: ancho + 'px' }, { width: nuevo + 'px' }], { duration: 0.7 * u, delay: 0.6 * u, easing: 'ease-in-out', fill: 'forwards' });
        resplandor(celdasDeValor.get(c.id), 0, 0.8 * u);
      }
      t = 1.3 * u;
    }
    if (capaB) {
      if (e2) t += 0.8 * u;
      capaA.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 0.4 * u, delay: t, fill: 'forwards' });
      capaB.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 0.4 * u, delay: t, fill: 'forwards' });
      resplandor(capaB, t + 0.2 * u, 0.6 * u);
    }
  };
  // Los espacios de adentro de una llamada no se parten: quitar(213, 1) no pasa a dos renglones.
  const sinCortes = (texto) => texto.replace(/\([^)]*\)/g, (m) => m.replace(/ /g, '\u00a0'));
  // La ida de una fila con cada llamada como un fragmento propio (para resaltar la que se abre).
  const idaConPiezas = (r) => {
    const codigo = nodo('code', '');
    for (const p of partesDe(r)) {
      if (typeof p === 'string') codigo.append(sinCortes(p));
      else {
        const pieza = nodo('span', 'rep-traz-pieza', sinCortes(p.llamada));
        pieza.dataset.id = String(p.id);
        codigo.append(pieza);
      }
    }
    return codigo;
  };
  // El texto de una celda aparece con un fundido (y, si es una celda nueva en amarillo, el color tambien).
  const aparecerCelda = (td, retraso, duracion) => {
    if (!td || !td.animate || !duracion) return;
    const texto = td.firstElementChild;
    if (texto) texto.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duracion, delay: retraso, fill: 'backwards' });
    if (td.classList.contains('rep-traz-nuevo')) {
      td.animate([{ backgroundColor: 'transparent' }, { backgroundColor: getComputedStyle(td).backgroundColor }], { duration: duracion, delay: retraso, fill: 'backwards' });
    }
  };
  // La llamada que se abre se resalta en la ida de la fila que la hace: el resalte sube, se queda y se apaga.
  const resaltar = (pieza, retraso, duracion) => {
    if (!pieza || !pieza.animate) return;
    const color = getComputedStyle(raiz).getPropertyValue('--aviso-fondo').trim() || '#fff4d6';
    pieza.animate(
      [{ backgroundColor: 'transparent' }, { backgroundColor: color, offset: 0.23 }, { backgroundColor: color, offset: 0.77 }, { backgroundColor: 'transparent' }],
      { duration: duracion, delay: retraso }
    );
  };
  // La vuelta del caso base aparece con un rebote: chica, crece de mas y se acomoda.
  const rebote = (el, retraso, duracion) => {
    if (!el || !el.animate) return;
    if (!el.classList.contains('rep-traz-base')) el.classList.add('rep-traz-brilla'); // (la etiqueta ya es un bloque)
    el.animate(
      [{ transform: 'scale(0.5)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: duracion, delay: retraso, easing: 'ease-out', fill: 'backwards' }
    );
  };
  // El golpe del caso base: la etiqueta y el valor de la ida aparecen chicos, crecen mucho y rebotan con oscilaciones cada vez
  // menores (como una pelota que pica en el piso) hasta acomodarse.
  const reboteAmortiguado = (el, retraso, duracion) => {
    if (!el || !el.animate) return;
    if (!el.classList.contains('rep-traz-base')) el.classList.add('rep-traz-brilla'); // (la etiqueta ya es un bloque)
    const cuadro = (escala, offset, opacidad = 1) => ({ transform: 'scale(' + escala + ')', opacity: opacidad, offset, easing: 'ease-in-out' });
    el.animate([cuadro(0.5, 0, 0), cuadro(1.5, 0.25), cuadro(0.9, 0.45), cuadro(1.25, 0.62), cuadro(0.97, 0.78), cuadro(1.08, 0.9), cuadro(1, 1)], {
      duration: duracion,
      delay: retraso,
      fill: 'backwards',
    });
  };
  // El foco: mientras ocurre el caso base, el resto de las filas se atenua (medio fundido), se queda y vuelve a la normalidad.
  const focoEnFila = (cuerpoTabla, fila, retraso, d) => {
    const total = 3.5 * d;
    for (const otra of cuerpoTabla.rows) {
      if (otra === fila || !otra.animate) continue;
      otra.animate([{ opacity: 1 }, { opacity: 0.35, offset: (0.5 * d) / total }, { opacity: 0.35, offset: (3 * d) / total }, { opacity: 1 }], { duration: total, delay: retraso });
    }
  };
  // "animar": se llego avanzando un paso. Entonces lo que aparece lo hace con un fundido; una llamada que se abre sigue una
  // secuencia (su ida aparece, respira, la llamada brilla en ella y aparece el texto de la fila nueva), el caso base muestra su valor,
  // se marca y recien despues da la vuelta, y las filas cuya vuelta llega justo ahora hacen sus transiciones (modo de una columna).
  // "u" es la unidad de movimiento (ver pintarPaso).
  const pintarTrazado = (k, { animar = false, u = 0 } = {}) => {
    const activo = trazadoActivo();
    trazado.hidden = !activo;
    raiz.classList.toggle('rep-sin-figura', activo && sinMonticulo);
    if (!activo) return;
    const unaColumna = enUnaColumna();
    const visibles = registros.filter((r) => r.desde <= k);
    const abiertas = visibles.filter((r) => r.hasta == null || k < r.hasta);
    const actual = abiertas.length ? abiertas[abiertas.length - 1] : null;
    const tabla = nodo('table', 'rep-tabla-trazado');
    const cabeza = tabla.createTHead().insertRow();
    for (const t of unaColumna ? ['Llamada', 'Devuelve'] : conValores ? ['Llamada', 'Ida', 'Vuelta'] : ['Llamada']) cabeza.append(nodo('th', '', t));
    const cuerpoTabla = tabla.createTBody();
    const celdasDeValor = new Map(); // el texto de la cuenta de cada llamada, por su numero
    const celdasDeIda = new Map(); // la celda donde esta su ida (o su cuenta, en una columna)
    const celdasDeLlamada = new Map();
    const celdasQueAparecen = []; // [celda, retraso]: lo que aparece de golpe y entra con un fundido
    const bases = []; // las llamadas que llegan a su caso base justo ahora
    const porTransformar = [];
    const conMovimiento = animar && u > 0 && !sinMovimiento();
    const d = fundidoDe(u);
    for (const r of visibles) {
      const fila = cuerpoTabla.insertRow();
      if (r === actual) fila.classList.add('rep-traz-actual');
      else if (r.hasta != null && k >= r.hasta) fila.classList.add('rep-traz-cerrada');
      const celda = (contenido, nuevo = false, sangria = 0) => {
        const td = fila.insertCell();
        td.append(typeof contenido === 'string' ? nodo('code', '', sinCortes(contenido)) : contenido);
        if (nuevo) td.classList.add('rep-traz-nuevo');
        if (sangria) td.style.paddingLeft = 6 + sangria * 10 + 'px';
        return td;
      };
      // El texto de la llamada que se abre no se marca en amarillo: brilla (temporalmente) en la ida de quien la hace.
      const tdLlamada = celda(r.llamada, false, ramifica ? r.nivel - nivelBase : 0);
      celdasDeLlamada.set(r.id, tdLlamada);
      // Una llamada que llego a su caso base lleva una etiqueta (en su propio renglon, para no ensanchar la columna).
      let pastilla = null;
      if (r.base != null && r.base <= k) {
        pastilla = nodo('span', 'rep-traz-base', '↩ caso base');
        tdLlamada.append(pastilla);
      }
      const base = { r, fila, pastilla, tdIda: null, tdVuelta: null };
      if (r.base === k) bases.push(base);
      if (!conValores) continue;
      const sinLlamadas = r.ida ? llamadasDe(r).length === 0 : true;
      if (unaColumna) {
        const llega = r.vuelta && r.vuelta.paso === k && r.ida && r.ida.paso <= k;
        const transiciona = conMovimiento && llega && duracionDeFila(r, u) > 0;
        const vueltaHecha = r.vuelta && r.vuelta.paso <= k;
        const contenido = !r.ida || r.ida.paso > k ? '' : vueltaHecha ? textoQuieto(r, k) : idaConPiezas(r);
        const nuevo = r.base !== k && (Boolean(r.ida && r.ida.paso === k && sinLlamadas) || (llega && !transiciona));
        const td = celda(contenido, nuevo);
        celdasDeIda.set(r.id, td);
        celdasDeValor.set(r.id, td.querySelector('code'));
        base.tdIda = td;
        if (transiciona) porTransformar.push([td, r]);
        else if (r.ida && r.ida.paso === k && r.desde !== k && r.base !== k && sinLlamadas) celdasQueAparecen.push([td, 0]);
        continue;
      }
      const ida = r.ida && r.ida.paso <= k;
      const tdIda = celda(ida ? idaConPiezas(r) : '', Boolean(ida && r.ida.paso === k && sinLlamadas && r.base !== k));
      celdasDeIda.set(r.id, tdIda);
      const vuelta = r.vuelta && r.vuelta.paso <= k;
      const textoVuelta = vuelta ? (r.vuelta.texto === r.vuelta.valor ? r.vuelta.texto : r.vuelta.texto + ' = ' + r.vuelta.valor) : '';
      const tdVuelta = celda(textoVuelta, Boolean(vuelta && r.vuelta.paso === k && r.base !== k));
      base.tdIda = tdIda;
      base.tdVuelta = tdVuelta;
      if (r.ida && r.ida.paso === k && r.desde !== k && r.base !== k && sinLlamadas) celdasQueAparecen.push([tdIda, 0]);
      if (vuelta && r.vuelta.paso === k && r.base !== k) celdasQueAparecen.push([tdVuelta, 0]);
    }
    trazado.replaceChildren(tabla);
    if (conMovimiento) {
      for (const r of visibles) {
        if (r.desde !== k) continue;
        const padre = conValores ? padreDe.get(r.id) : null;
        const tdPadre = padre && padre.ida && padre.ida.paso <= k ? celdasDeIda.get(padre.id) : null;
        if (!tdPadre) {
          aparecerCelda(celdasDeLlamada.get(r.id), 0, d);
          continue;
        }
        // La ida de quien la hace aparece sola (si recien se escribe), hay un respiro, la llamada brilla y, en lo mas alto del brillo,
        // aparece el texto de la fila nueva.
        let t = 0;
        if (padre.ida.paso === k) {
          aparecerCelda(tdPadre, 0, d);
          t = 2.5 * d;
        }
        resplandor(tdPadre.querySelector('[data-id="' + r.id + '"]'), t, 2 * d, 1.12);
        resplandorQueAparece(celdasDeLlamada.get(r.id).firstElementChild, t, 2 * d, 1.12);
      }
      // El caso base: el resto de la tabla se atenua; el valor de la ida y la etiqueta rebotan a la vez (con oscilaciones cada vez
      // menores); la tabla vuelve a la normalidad y, despues de una espera, rebota la vuelta.
      for (const b of bases) {
        const t = b.r.desde === k ? duracionApertura(b.r, k, d) : 0;
        focoEnFila(cuerpoTabla, b.fila, t, d);
        if (b.tdIda && b.r.ida) reboteAmortiguado(b.tdIda.firstElementChild, t + 0.5 * d, 2.5 * d);
        reboteAmortiguado(b.pastilla, t + 0.5 * d, 2.5 * d);
        if (b.tdVuelta) rebote(b.tdVuelta.firstElementChild, t + 4 * d, 1.5 * d);
      }
      for (const [td, retraso] of celdasQueAparecen) aparecerCelda(td, retraso, d);
    }
    for (const [td, r] of porTransformar) transformar(td, r, u, celdasDeValor);
  };
  lado.append(estado, herramientas, franjaPregunta, trazado, figura, nodo('p', 'rep-subtitulo', 'Lo que muestra el programa'), consola);
  if (conEntrada) lado.append(nodo('p', 'rep-subtitulo', 'Lo que ingresa el usuario'), cajaDeEntrada);
  lado.append(nota);
  cuerpo.append(columnaCodigo, lado);
  raiz.append(giro, cuerpo, barra);
  panelCodigo.append(cerrarCodigo);

  let paso = 0;
  let marcada = null;
  let reloj = null;
  let ultimaAnimacion = 0; // lo que dura la animacion del paso que se esta mostrando
  let relojTrazado = null; // el trazado que espera a que termine la animacion de la figura
  let relojEditor = null; // el resalte de la funcion que espera a que termine lo anterior
  let funcionAnterior = null;
  let zoom = leerZoom();
  let ampliado = false;
  let usoPantallaCompleta = false;
  let giroCerrado = false;

  // La funcion que se esta ejecutando en esa fotografia, con sus lineas.
  const funcionDe = (foto) => {
    const marco = foto.marcos[foto.marcos.length - 1];
    return marco ? funciones.find((f) => f.nombre === marco.funcion) || null : null;
  };

  function mostrarEstado(foto) {
    estado.className = 'rep-estado' + (foto.error ? ' rep-estado-error' : '');
    estado.replaceChildren();
    if (foto.error) {
      const mensaje = nodo('p', 'rep-estado-texto');
      conCodigo(mensaje, error && error.mensaje ? error.mensaje : 'El programa se detiene con un error.');
      estado.append(mensaje);
      return;
    }
    if (foto.linea == null) {
      estado.append(nodo('p', 'rep-estado-texto', 'Fin del programa.'));
      return;
    }
    const f = funcionDe(foto);
    const cabecera = nodo('p', 'rep-estado-texto');
    cabecera.append(f ? `En ` : 'Por ejecutar, ');
    if (f) cabecera.append(nodo('code', '', `${f.nombre}()`), foto.retorno ? ', por devolver ' : ', por ejecutar ');
    else if (foto.retorno) cabecera.append('por devolver ');
    if (foto.retorno) cabecera.append(nodo('code', '', foto.retorno.texto), ', ');
    cabecera.append(`línea ${foto.linea}:`);
    const linea = nodo('pre', 'rep-estado-linea');
    const trozos = lineasPintadas((codigo.split('\n')[foto.linea - 1] || '').trim());
    const vacia = [];
    for (const t of trozos[0] || vacia) linea.append(t);
    estado.append(cabecera, linea);
  }

  // El codigo sigue a la ejecucion sin marear. Al cambiar de funcion, se baja hasta que su primera
  // linea queda arriba (y si no cabe entera, se centra la linea que sigue). Dentro de la misma
  // funcion no se mueve, salvo que la linea salga de lo visible: entonces lo minimo, con margen.
  function seguirLinea(cambioDeFuncion = false, suave = false, fotoActual = traza[paso]) {
    if (!marcada) return;
    const alto = panelCodigo.clientHeight;
    if (!alto) return;
    const altoLinea = marcada.offsetHeight || 20;
    const visibles = alto / altoLinea;
    const margen = (visibles >= 9 ? 2 : visibles >= 5 ? 1 : 0) * altoLinea;
    const arriba = marcada.offsetTop;
    const abajo = arriba + altoLinea;
    const ir = (y) => {
      const tope = Math.max(0, Math.min(y, panelCodigo.scrollHeight - alto));
      if (Math.abs(tope - panelCodigo.scrollTop) < 1) return;
      panelCodigo.scrollTo({ top: tope, behavior: suave && !sinMovimiento() ? 'smooth' : 'auto' });
    };
    if (cambioDeFuncion) {
      const f = funcionDe(fotoActual);
      const cabecera = f ? lineas[f.desde - 1] : null;
      let destino = cabecera ? cabecera.offsetTop - 4 : arriba - alto / 2;
      // La funcion no cabe y la linea queda abajo de lo visible: se centra la linea.
      if (abajo > destino + alto) destino = arriba - alto / 2 + altoLinea / 2;
      ir(destino);
      return;
    }
    const desde = panelCodigo.scrollTop;
    if (arriba < desde + margen) ir(arriba - margen);
    else if (abajo > desde + alto - margen) ir(abajo + margen - alto);
  }

  // Al entrar en una funcion (tambien en cada llamada de una recursion) se lleva la vista a su comienzo y se resalta todo su
  // codigo (el fondo sube, se queda y se apaga) antes de que aparezca el cursor en su primera linea. "d" es un fundido.
  function resaltarFuncion(f, d) {
    lineas.forEach((fila, i) => fila.classList.toggle('rep-fuera', i + 1 < f.desde || i + 1 > f.hasta));
    if (marcada) marcada.classList.remove('rep-ahora', 'rep-error'); // el cursor vuelve cuando termina el resalte
    const cabecera = lineas[f.desde - 1];
    if (cabecera) panelCodigo.scrollTo({ top: Math.max(0, cabecera.offsetTop - 4), behavior: sinMovimiento() ? 'auto' : 'smooth' });
    // El color del cursor (ver .rep-ahora en el CSS), resuelto con un elemento de prueba para poder animarlo.
    const prueba = nodo('div', '');
    prueba.style.cssText = 'position:absolute;visibility:hidden;background:color-mix(in srgb, var(--acento) 24%, var(--codigo))';
    raiz.append(prueba);
    const color = getComputedStyle(prueba).backgroundColor || '#cfe0fb';
    prueba.remove();
    const total = 3.5 * d;
    for (let i = f.desde - 1; i <= f.hasta - 1; i++) {
      if (!lineas[i] || !lineas[i].animate) continue;
      lineas[i].animate(
        [{ backgroundColor: 'transparent' }, { backgroundColor: color, offset: d / total }, { backgroundColor: color, offset: (2.5 * d) / total }, { backgroundColor: 'transparent' }],
        { duration: total }
      );
    }
  }

  // La marca de la linea (y lo que la acompana: el cuadro "por ejecutar" y lo que muestra el programa)
  // espera a que termine la animacion de lo que hizo la linea anterior; si se avanza antes, se pone ya.
  let marcaPendiente = null;
  let relojesDeSalida = [];

  // "animar": se mueven los bloques del paso anterior al de ahora (si no, aparecen en su lugar).
  // "adelante": se llego avanzando un paso (la unica vez que se espera a la animacion).
  function pintarPaso(animar = false, adelante = false) {
    if (marcaPendiente) {
      tiempo.cancelar(marcaPendiente.reloj);
      const pendiente = marcaPendiente;
      marcaPendiente = null;
      pendiente.aplicar();
    }
    const foto = traza[paso];
    const antes = paso > 0 ? traza[paso - 1] : null;
    cuenta.textContent = `Paso ${paso + 1} de ${traza.length}`;
    barraPasos.value = String(paso);
    anterior.disabled = inicio.disabled = paso === 0;
    siguiente.disabled = final.disabled = paso === traza.length - 1;

    // El texto nuevo de la consola (un printf) aparece, en violeta y negrita, a la vez que se encienden las casillas de las que
    // salio, y vuelve a ser normal cuando se apagan (la figura avisa cuando: alMuestra).
    for (const r of relojesDeSalida) tiempo.cancelar(r);
    relojesDeSalida = [];
    const antesDeSalida = antes && antes.salida ? antes.salida : '';
    const nuevoEnSalida = adelante && animar && foto.salida && foto.salida.length > antesDeSalida.length && foto.salida.startsWith(antesDeSalida) ? foto.salida.slice(antesDeSalida.length) : '';
    const lectura = adelante && animar && foto.lectura && foto.lectura.hasta > foto.lectura.desde ? foto.lectura : null;
    dibujo.alMuestra =
      nuevoEnSalida || lectura
        ? (desde, hasta) => {
            relojesDeSalida.push(
              tiempo.esperar(() => {
                if (nuevoEnSalida) consola.replaceChildren(antesDeSalida, nodo('span', 'rep-salida-nueva', nuevoEnSalida));
                if (lectura) pintarEntrada(paso, lectura);
              }, desde)
            );
            relojesDeSalida.push(
              tiempo.esperar(() => {
                if (nuevoEnSalida) consola.textContent = foto.salida || ' ';
                if (lectura) pintarEntrada(paso);
              }, hasta)
            );
          }
        : null;
    // La unidad de movimiento sale de la velocidad: lo que dura dibujar una flecha o mover los nodos.
    const unidad = VELOCIDADES[Number(velocidad.value)].ms * 0.5;
    tiempo.cancelar(relojTrazado);
    relojTrazado = null;
    tiempo.cancelar(relojEditor);
    relojEditor = null;
    // Sin memoria dinamica el trazado reemplaza a la figura: no se la anima (nadie la ve) y las transiciones de la tabla empiezan ya.
    const sinFigura = trazadoActivo() && sinMonticulo;
    const dFigura = dibujo.mostrar(foto, antes, { animar: animar && !sinFigura, duracion: unidad, flujo: adelante });
    const dTrazado = adelante && animar ? duracionTrazado(paso, unidad) : 0;
    // Una llamada nueva (la pila crece): si se pide, se resalta toda su funcion antes de que aparezca el cursor.
    const entrando = adelante && animar && !sinMovimiento() && antes && foto.marcos.length > antes.marcos.length && ajustes.valor('resaltarFuncion') ? funcionDe(foto) : null;
    const dEditor = entrando ? 3.5 * fundidoDe(unidad) : 0;
    ultimaAnimacion = dFigura + dTrazado + dEditor;
    if (entrando) relojEditor = tiempo.esperar(() => resaltarFuncion(entrando, fundidoDe(unidad)), dFigura + dTrazado);
    if (dTrazado > 0) {
      const arrancar = () => pintarTrazado(paso, { animar: true, u: unidad });
      if (dFigura > 0) relojTrazado = tiempo.esperar(arrancar, dFigura);
      else arrancar();
    }
    etiquetaZoom.textContent = `${Math.round(dibujo.escalaActual * 100)} %`;

    const aplicar = () => {
      // El codigo de afuera de la funcion en curso se atenua.
      const f = funcionDe(foto);
      const cambioDeFuncion = Boolean(f) && (!funcionAnterior || funcionAnterior.nombre !== f.nombre);
      lineas.forEach((fila, i) => fila.classList.toggle('rep-fuera', Boolean(f) && (i + 1 < f.desde || i + 1 > f.hasta)));
      if (marcada) marcada.classList.remove('rep-ahora', 'rep-error');
      marcada = foto.linea != null ? lineas[foto.linea - 1] : null;
      if (marcada) {
        marcada.classList.add(foto.error ? 'rep-error' : 'rep-ahora');
        seguirLinea(cambioDeFuncion, animar, foto);
      }
      funcionAnterior = f;
      mostrarEstado(foto);
      pintarTrazado(paso); // al terminar, la tabla queda quieta en su estado final
      consola.textContent = foto.salida || ' ';
      pintarEntrada(paso);
    };
    if (adelante && animar && ultimaAnimacion > 0) {
      const reloj = tiempo.esperar(() => {
        marcaPendiente = null;
        aplicar();
      }, ultimaAnimacion);
      marcaPendiente = { reloj, aplicar };
    } else {
      aplicar();
    }
  }

  function ir(n) {
    tiempo.continuar();
    const nuevo = Math.max(0, Math.min(traza.length - 1, n));
    const animar = Math.abs(nuevo - paso) === 1;
    const adelante = nuevo === paso + 1;
    paso = nuevo;
    pintarPaso(animar, adelante);
  }

  // Detener la animacion es detener el reloj (los temporizadores y lo que se calcula cuadro a cuadro, ver tiempo.js) y las
  // animaciones del navegador que estaban corriendo; seguir las reanuda desde donde quedaron. Avanzar, retroceder o repetir
  // un paso lo reanuda.
  let congeladas = [];
  tiempo.alCambiar((pausado) => {
    if (pausado) {
      congeladas = raiz.getAnimations ? raiz.getAnimations({ subtree: true }).filter((a) => a.playState === 'running') : [];
      congeladas.forEach((a) => a.pause());
    } else {
      congeladas.forEach((a) => a.play());
      congeladas = [];
    }
    rotular(detener, pausado ? 'seguir' : 'detener', pausado ? 'Seguir' : 'Detener');
    detener.setAttribute('aria-label', pausado ? 'Seguir con la animación (barra espaciadora)' : 'Detener la animación (barra espaciadora)');
    detener.title = detener.getAttribute('aria-label');
  });
  function alternarPausa() {
    if (tiempo.pausado) tiempo.continuar();
    else tiempo.pausar();
  }
  function repetirPaso() {
    tiempo.continuar();
    if (paso > 0) {
      paso -= 1;
      pintarPaso(false, false);
      paso += 1;
    }
    pintarPaso(true, true);
  }
  detener.onclick = alternarPausa;
  repetir.onclick = () => {
    parar();
    repetirPaso();
  };

  function parar() {
    if (reloj) tiempo.cancelar(reloj);
    reloj = null;
    rotular(reproducir, 'avanzar', 'Reproducir');
    reproducir.setAttribute('aria-label', 'Avanzar solo');
  }

  // El ritmo es el de la velocidad, pero un paso con animacion larga (la flecha, la pausa y el
  // movimiento) se espera a que termine, con un descanso, antes de pasar al que sigue.
  function programar() {
    const base = VELOCIDADES[Number(velocidad.value)].ms;
    reloj = tiempo.esperar(() => {
      if (paso >= traza.length - 1) {
        parar();
        return;
      }
      ir(paso + 1);
      programar();
    }, Math.max(base, ultimaAnimacion + base * 0.45));
  }

  function arrancar() {
    if (reloj) tiempo.cancelar(reloj);
    programar();
  }

  // ---- el espacio: el panel se acomoda a lo que tiene (en la pagina o en toda la pantalla)
  function adaptar() {
    const ancho = raiz.clientWidth;
    if (!ancho) return; // todavia no esta en la pagina
    const apaisado = ampliado && window.innerWidth > window.innerHeight;
    const bajo = ampliado && window.innerHeight < 520;
    raiz.classList.toggle('rep-ancho', ancho >= 900);
    raiz.classList.toggle('rep-chico', ancho < 560);
    raiz.classList.toggle('rep-compacto', ancho < 560 || bajo);
    raiz.classList.toggle('rep-apaisado', apaisado);
    giro.hidden = !(ampliado && !apaisado && window.innerWidth < 700 && !giroCerrado);
    dibujo.fijarEscala({ alto: ampliado });
    seguirLinea(true);
  }

  function aplicarZoom() {
    dibujo.fijarEscala({ modo: zoom === 'ajustar' ? 'ajustar' : 'fijo', zoom: typeof zoom === 'number' ? zoom : 1, alto: ampliado });
    etiquetaZoom.textContent = `${Math.round(dibujo.escalaActual * 100)} %`;
  }
  function moverZoom(hacia) {
    const base = zoom === 'ajustar' ? dibujo.escalaActual : zoom;
    const siguienteNivel =
      hacia > 0 ? NIVELES_DE_ZOOM.find((n) => n > base + 0.01) : [...NIVELES_DE_ZOOM].reverse().find((n) => n < base - 0.01);
    if (siguienteNivel == null) return;
    zoom = siguienteNivel;
    guardarZoom(zoom);
    aplicarZoom();
  }
  menos.onclick = () => moverZoom(-1);
  mas.onclick = () => moverZoom(1);
  ajustar.onclick = () => {
    zoom = 'ajustar';
    guardarZoom(zoom);
    aplicarZoom();
  };

  // ---- ver el codigo completo cuando la ventana es chica
  function abrirCodigo() {
    raiz.classList.add('rep-codigo-abierto');
    cerrarCodigo.focus();
    seguirLinea(true);
  }
  function cerrarElCodigo() {
    raiz.classList.remove('rep-codigo-abierto');
    verCodigo.focus();
  }
  verCodigo.onclick = abrirCodigo;
  cerrarCodigo.onclick = cerrarElCodigo;
  giroCerrar.onclick = () => {
    giroCerrado = true;
    giro.hidden = true;
  };

  // ---- toda la pantalla: una capa sobre la pagina y, donde se puede, la pantalla completa del navegador
  function ampliar(si) {
    ampliado = si;
    raiz.classList.toggle('rep-ampliado', si);
    document.documentElement.classList.toggle('rep-sin-scroll', si);
    rotular(ampliarBoton, si ? 'cerrar' : 'ampliar', si ? 'Cerrar' : 'Ampliar');
    ampliarBoton.setAttribute('aria-label', si ? 'Salir de la pantalla completa' : 'Ver el paso a paso en toda la pantalla');
    if (si) {
      if (raiz.requestFullscreen) {
        raiz
          .requestFullscreen()
          .then(() => {
            usoPantallaCompleta = true;
            // Un teléfono se pone apaisado donde el navegador lo permite (Android).
            if (window.innerWidth < 900 && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
          })
          .catch(() => {});
      }
      raiz.focus();
    } else {
      raiz.classList.remove('rep-codigo-abierto');
      if (usoPantallaCompleta && document.fullscreenElement === raiz) document.exitFullscreen().catch(() => {});
      usoPantallaCompleta = false;
      try {
        if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
      } catch (e) {
        // sin control de orientacion
      }
    }
    adaptar();
    aplicarZoom();
    seguirLinea(true);
  }
  ampliarBoton.onclick = () => ampliar(!ampliado);
  const alCambiarPantallaCompleta = () => {
    if (!raiz.isConnected) {
      document.removeEventListener('fullscreenchange', alCambiarPantallaCompleta);
      return;
    }
    if (ampliado && usoPantallaCompleta && !document.fullscreenElement) ampliar(false);
  };
  document.addEventListener('fullscreenchange', alCambiarPantallaCompleta);
  window.addEventListener('resize', () => {
    if (raiz.isConnected) {
      adaptar();
      aplicarZoom();
    }
  });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      adaptar();
      aplicarZoom();
    }).observe(raiz);
  }

  // ---- un deslizamiento horizontal sobre la figura pasa de paso (si la figura entra entera)
  let toque = null;
  figura.addEventListener(
    'touchstart',
    (e) => {
      toque = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    },
    { passive: true }
  );
  figura.addEventListener(
    'touchend',
    (e) => {
      if (!toque) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - toque.x;
      const dy = t.clientY - toque.y;
      toque = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy) && figura.scrollWidth <= figura.clientWidth + 2) {
        parar();
        ir(paso + (dx < 0 ? 1 : -1));
      }
    },
    { passive: true }
  );

  inicio.onclick = () => (parar(), ir(0));
  anterior.onclick = () => (parar(), ir(paso - 1));
  siguiente.onclick = () => (parar(), ir(paso + 1));
  final.onclick = () => (parar(), ir(traza.length - 1));
  barraPasos.oninput = () => (parar(), ir(Number(barraPasos.value)));
  reproducir.onclick = () => {
    if (reloj) return parar();
    if (paso === traza.length - 1) ir(0);
    rotular(reproducir, 'pausa', 'Pausa');
    reproducir.setAttribute('aria-label', 'Detener la reproducción');
    arrancar();
  };
  velocidad.onchange = () => {
    guardarVelocidad(Number(velocidad.value));
    if (reloj) arrancar();
  };
  raiz.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (raiz.classList.contains('rep-codigo-abierto')) cerrarElCodigo();
      else if (ampliado) ampliar(false);
      return;
    }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === ' ') (alternarPausa(), e.preventDefault());
    else if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) (parar(), repetirPaso(), e.preventDefault());
    else if (e.key === 'Home') (parar(), ir(0), e.preventDefault());
    else if (e.key === 'End') (parar(), ir(traza.length - 1), e.preventDefault());
    else if (e.key === 'ArrowRight') (parar(), ir(paso + 1), e.preventDefault());
    else if (e.key === 'ArrowLeft') (parar(), ir(paso - 1), e.preventDefault());
  });

  // La barra espaciadora sobre un boton lo activaria al soltarla: aca detiene la animacion y nada mas.
  raiz.addEventListener('keyup', (e) => {
    if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') e.preventDefault();
  });
  tiempo.continuar();
  pintarPaso();
  // El panel todavia no esta en la pagina: se adapta cuando se lo pueda medir.
  requestAnimationFrame(() => {
    adaptar();
    aplicarZoom();
  });
  return raiz;
}
