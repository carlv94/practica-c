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

import { Figura, textoPorPartes } from './figura.js';
import { tiempo } from './tiempo.js';
import { ECO_ABRE, ECO_CIERRA } from './traza.js';
import { pintar } from '../editor.js';
import { ajustes, montarAjustes, montarHerramientas } from '../ajustes.js';
import { ICONOS, iconoSvg } from './iconos.js';
import { montarLeyenda } from './leyenda.js';

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
const guardarVelocidad = (v) => {
  try {
    localStorage.setItem(CLAVE_VELOCIDAD_NOMBRE, VELOCIDADES[v].nombre);
  } catch (e) {
    // sin almacenamiento: no se recuerda la eleccion
  }
};

// "archivos" (opcional): un programa de varios archivos que se ejecuta unido en un solo texto, [{ nombre, desde, hasta }] con las líneas de cada
// uno. El código se ve por pestañas, uno por archivo, con la numeración propia de cada uno; la pestaña sigue al cursor.
export function crearReproductor({ codigo, traza, error = null, titulo = '', funciones = [], cabezas = null, entrada = '', llamadas = [], puntos = null, archivos = null }) {
  const raiz = nodo('div', 'rep'); // (un div: un section tendría el marco y el relleno globales de estilo.css)
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
  const rotular = (b, simbolo, texto, simboloDespues = false) => {
    const s = nodo('span', 'rep-simbolo');
    if (ICONOS[simbolo]) s.innerHTML = iconoSvg(simbolo);
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
  // Un boton solo con su icono (el nombre para quien no lo ve es el de la ayuda).
  const botonIcono = (nombre, ayuda) => {
    const b = boton('', ayuda);
    b.setAttribute('aria-label', ayuda);
    b.classList.add('rep-boton-icono');
    b.innerHTML = iconoSvg(nombre);
    return b;
  };
  const inicio = conSimbolo('⏮', 'Inicio', 'Volver al primer paso');
  const anterior = conSimbolo('◀', 'Anterior', 'Paso anterior (flecha izquierda)');
  const reproducir = conSimbolo('avanzar', 'Reproducir', 'Avanzar solo');
  const siguiente = conSimbolo('▶', 'Siguiente', 'Paso siguiente (flecha derecha)', true);
  const final = conSimbolo('⏭', 'Final', 'Ir al último paso', true);
  // Los puntos de parada (ayuda visual): saltar a la parada anterior o a la siguiente.
  const paradaAnterior = conSimbolo('paradaAnterior', 'Parada', 'Ir al punto de parada anterior');
  const paradaSiguiente = conSimbolo('paradaSiguiente', 'Parada', 'Ir al punto de parada siguiente', true);
  // El atajo de la recursion (con los puntos de parada): ir a donde la primera llamada llega a su caso base.
  const irCasoBase = conSimbolo('casoBase', 'Caso base', 'Ir al caso base: la primera llamada que no vuelve a llamarse');
  for (const b of [paradaAnterior, paradaSiguiente, irCasoBase]) b.classList.add('rep-boton-parada');
  paradaAnterior.hidden = paradaSiguiente.hidden = irCasoBase.hidden = true;
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
  barra.append(inicio, anterior, reproducir, siguiente, final, paradaAnterior, paradaSiguiente, irCasoBase, detener, repetir, barraPasos, cuenta, etiquetaVelocidad, ampliarBoton);
  const giro = nodo('div', 'rep-giro');
  giro.hidden = true;
  const giroTexto = nodo('span', '', 'Gire el teléfono para ver mejor la figura.');
  const giroCerrar = botonIcono('cerrar', 'Cerrar el aviso');
  giro.append(giroTexto, giroCerrar);

  const cuerpo = nodo('div', 'rep-cuerpo');
  const columnaCodigo = nodo('div', 'rep-columna-codigo');
  const panelCodigo = nodo('div', 'rep-codigo');
  const cerrarCodigo = conSimbolo('cerrar', 'Cerrar', 'Volver al paso a paso');
  cerrarCodigo.classList.add('rep-cerrar-codigo');
  const verCodigo = boton('Ver todo el código', 'Abrir el programa completo');
  verCodigo.classList.add('rep-ver-codigo');
  const bloqueCodigo = nodo('div', 'rep-lineas');
  panelCodigo.append(bloqueCodigo);
  columnaCodigo.append(panelCodigo, verCodigo);
  const numeros = []; // el numero de cada linea (con los puntos de parada, se toca para ponerlos)
  const lineas = lineasPintadas(codigo.replace(/\s+$/, '')).map((trozos, i) => {
    const fila = nodo('div', 'rep-linea');
    const fuente = nodo('span', 'rep-fuente');
    if (trozos.length) fuente.append(...trozos);
    else fuente.append(' ');
    const numero = nodo('span', 'rep-numero', String(i + 1));
    numeros.push(numero);
    fila.append(numero, fuente);
    bloqueCodigo.append(fila);
    return fila;
  });
  // ---- varios archivos: una pestaña por archivo (solo se ven las lineas del activo, numeradas desde 1) y una linea en blanco entre ellos que no se ve.
  const multi = Array.isArray(archivos) && archivos.length > 1;
  let archivoActivo = 0;
  const tramoDe = (n) => (multi ? archivos.findIndex((t) => n >= t.desde && n <= t.hasta) : -1);
  const numeroLocal = (n) => (multi && tramoDe(n) >= 0 ? n - archivos[tramoDe(n)].desde + 1 : n);
  const pestanas = nodo('div', 'rep-pestanas');
  const botonesDePestana = [];
  function mostrarArchivo(k, alPrincipio = true) {
    archivoActivo = k;
    lineas.forEach((fila, i) => fila.classList.toggle('rep-sin-archivo', tramoDe(i + 1) !== k));
    botonesDePestana.forEach((b, j) => {
      b.setAttribute('aria-selected', String(j === k));
      b.tabIndex = j === k ? 0 : -1;
    });
    if (alPrincipio) panelCodigo.scrollTop = 0;
  }
  if (multi) {
    pestanas.setAttribute('role', 'tablist');
    pestanas.setAttribute('aria-label', 'Archivos del programa');
    archivos.forEach((t, k) => {
      const b = nodo('button', 'rep-pestana', t.nombre);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.onclick = () => mostrarArchivo(k);
      b.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        e.stopPropagation(); // (las flechas del reproductor avanzan y retroceden el paso)
        const j = (k + (e.key === 'ArrowRight' ? 1 : archivos.length - 1)) % archivos.length;
        mostrarArchivo(j);
        botonesDePestana[j].focus();
      });
      botonesDePestana.push(b);
      pestanas.append(b);
    });
    columnaCodigo.insertBefore(pestanas, panelCodigo);
    raiz.classList.add('rep-con-pestanas');
    numeros.forEach((numero, i) => (numero.textContent = String(numeroLocal(i + 1))));
    mostrarArchivo(0, false);
  }
  // Pasa a la pestaña del archivo al que pertenece una linea (el cursor entro en otro archivo).
  const verLinea = (n) => {
    const k = tramoDe(n);
    if (multi && k >= 0 && k !== archivoActivo) mostrarArchivo(k);
  };
  const lado = nodo('div', 'rep-lado');
  const estado = nodo('div', 'rep-estado');
  const figura = nodo('div', 'rep-figura');
  // La caja de la figura no cambia nada de la disposicion (ver el CSS: "display: contents"); en pantalla completa apaisada en un telefono sostiene
  // los controles que flotan sobre la figura, con su manija (ver colocarControles).
  const cajaFigura = nodo('div', 'rep-figura-caja');
  const manija = botonIcono('controles', 'Controles de la figura: zoom y ayudas');
  manija.classList.add('rep-manija');
  cajaFigura.append(figura, manija);
  const dibujo = new Figura(figura, { cabezas });
  // En pantallas grandes la condicion que se evalua se muestra en esta franja, arriba de la figura (ver el CSS).
  const franjaPregunta = nodo('div', 'rep-franja-pregunta');
  dibujo.franja = franjaPregunta;
  // La consola: lo que se veria en una de verdad (la salida del programa con lo que se tipeo intercalado, ver traza.js). Muestra pocas filas, siempre
  // la ultima, y un boton abre una ventana con todo.
  const consola = nodo('pre', 'rep-consola');
  const cajaConsola = nodo('div', 'rep-consola-caja');
  const ampliarConsola = botonIcono('expandir', 'Ver toda la consola');
  ampliarConsola.classList.add('rep-consola-ampliar');
  const ventanaConsola = nodo('div', 'rep-consola-ventana');
  ventanaConsola.hidden = true;
  const consolaCompleta = nodo('pre', 'rep-consola-completa');
  const cerrarConsola = conSimbolo('cerrar', 'Cerrar', 'Volver al paso a paso');
  ventanaConsola.append(nodo('div', 'rep-consola-tarjeta'));
  ventanaConsola.firstChild.append(nodo('p', 'rep-consola-titulo', 'Consola'), consolaCompleta, cerrarConsola);
  cajaConsola.append(consola, ampliarConsola);
  const textoDeConsola = (f) => (f && (f.consola ?? f.salida)) || '';
  const sinMarcas = (t) => t.split(ECO_ABRE).join('').split(ECO_CIERRA).join('');
  // El texto de la consola en trozos: lo que muestra el programa y, aparte, lo que se tipeo (el eco).
  const trozosDeConsola = (texto) => {
    const trozos = [];
    let eco = false;
    let actual = '';
    for (const c of texto) {
      if (c === ECO_ABRE || c === ECO_CIERRA) {
        if (actual) trozos.push({ t: actual, eco });
        actual = '';
        eco = c === ECO_ABRE;
      } else actual += c;
    }
    if (actual) trozos.push({ t: actual, eco });
    return trozos;
  };
  // Pinta la consola; los ultimos "nuevas" caracteres (lo que acaba de llegar) en violeta.
  const pintarConsola = (texto, nuevas = 0) => {
    const trozos = trozosDeConsola(texto);
    let faltan = trozos.reduce((n, x) => n + x.t.length, 0) - nuevas;
    const pintados = [];
    for (const x of trozos) {
      const corte = Math.max(0, Math.min(faltan, x.t.length));
      faltan -= x.t.length;
      for (const [t, nuevo] of [[x.t.slice(0, corte), false], [x.t.slice(corte), true]]) {
        if (!t) continue;
        if (!x.eco && !nuevo) pintados.push(t);
        else pintados.push(nodo('span', [x.eco ? 'rep-eco' : '', nuevo ? 'rep-salida-nueva' : ''].filter(Boolean).join(' '), t));
      }
    }
    if (!pintados.length) pintados.push(' ');
    consola.replaceChildren(...pintados);
    consolaCompleta.replaceChildren(...pintados.map((p) => (typeof p === 'string' ? p : p.cloneNode(true))));
    consola.scrollTop = consola.scrollHeight;
    consolaCompleta.scrollTop = consolaCompleta.scrollHeight;
  };
  ampliarConsola.onclick = () => {
    ventanaConsola.hidden = false;
    consolaCompleta.scrollTop = consolaCompleta.scrollHeight;
    cerrarConsola.focus();
  };
  cerrarConsola.onclick = () => {
    ventanaConsola.hidden = true;
    ampliarConsola.focus();
  };
  ventanaConsola.onclick = (e) => {
    if (e.target === ventanaConsola) cerrarConsola.onclick();
  };
  ventanaConsola.onkeydown = (e) => {
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    cerrarConsola.onclick();
  };
  const nota =nodo('p', 'rep-nota', 'La línea resaltada es la que está por ejecutarse. Lo que cambió con la línea anterior se marca en amarillo, también la flecha nueva.');
  const herramientas = nodo('div', 'rep-herramientas');
  const menos = botonIcono('menos', 'Achicar la figura');
  const mas = botonIcono('mas', 'Agrandar la figura');
  const ajustar = boton('Ajustar', 'Que la figura entre en el espacio disponible');
  const etiquetaZoom = nodo('span', 'rep-zoom-valor');
  // Las ayudas visuales (nombres de las flechas, brillo de los valores) se eligen en el panel de ajustes (ver js/ajustes.js).
  const aplicarAyudas = () => {
    dibujo.fijarNombres(ajustes.valor('nombresFlechas'));
    dibujo.fijarAyudas(ajustes.todos());
  };
  aplicarAyudas();
  let sinValorVisto = ajustes.valor('punterosSinValor');
  const olvidarAyudas = ajustes.alCambiar(() => {
    if (!raiz.isConnected) {
      olvidarAyudas(); // este reproductor ya no esta en la pagina
      return;
    }
    aplicarAyudas();
    if (ajustes.valor('explicar') && !raiz.classList.contains('rep-explicando')) parar(); // el avance solo no va con explicar
    mostrarExplicar();
    requestAnimationFrame(medirDesborde); // (los botones de la fila pudieron cambiar)
    // Las que cambian como se dibuja una casilla (no solo como se anima) se ven al instante: se vuelve a dibujar el paso de ahora.
    if (ajustes.valor('punterosSinValor') !== sinValorVisto) {
      sinValorVisto = ajustes.valor('punterosSinValor');
      pintarPaso(false, false);
    }
    aplicarPuntos();
    actualizarParadas();
    pintarTrazado(paso);
    dibujo.fijarEscala({}); // la figura puede haber vuelto a aparecer
  });

  // ---- los puntos de parada (ayuda "Puntos de parada"): el numero de una linea los pone y los saca; Reproducir se detiene cuando el cursor llega a
  // una linea marcada (antes de ejecutarla) y dos botones saltan a la parada anterior o a la siguiente. "puntos" (opcional) es un Set de
  // lineas que quien arma el reproductor conserva entre un caso y otro.
  const paradas = puntos || new Set();
  // El atajo de la recursion sale del registro de llamadas: el caso base es el primer paso en que una llamada llega al suyo (no vuelve a
  // llamarse). -1 si no hay (no es recursiva). (Una "primera vuelta" no hace falta: es el paso que sigue al caso base.)
  const minimo = (lista) => (lista.length ? Math.min(...lista) : -1);
  const registrosDeAtajos = Array.isArray(llamadas) ? llamadas : [];
  const pasoCasoBase = minimo(registrosDeAtajos.filter((r) => r.base != null).map((r) => r.base));
  const ejecutadas = new Set(traza.map((f) => f.linea));
  const textoDeLaNota = nota.textContent;
  const conParadas = () => ajustes.valor('puntosDeParada');
  const esParada = (k) => conParadas() && Boolean(traza[k]) && traza[k].linea != null && paradas.has(traza[k].linea);
  const siguienteParada = (desde) => {
    for (let k = desde + 1; k < traza.length; k++) if (esParada(k)) return k;
    return -1;
  };
  const anteriorParada = (desde) => {
    for (let k = desde - 1; k >= 0; k--) if (esParada(k)) return k;
    return -1;
  };
  // El punto de una linea: lleno si la linea se ejecuta con estos valores y vacio si no (asi el alumno ve que esa rama no pasa).
  const marcarNumero = (i) => {
    const n = i + 1;
    const puesta = paradas.has(n);
    lineas[i].classList.toggle('rep-parada-puesta', conParadas() && puesta);
    lineas[i].classList.toggle('rep-parada-sin-uso', conParadas() && puesta && !ejecutadas.has(n));
    numeros[i].setAttribute('aria-pressed', String(puesta));
    numeros[i].setAttribute('aria-label', 'Punto de parada en la línea ' + numeroLocal(n));
    numeros[i].title = !puesta ? 'Poner un punto de parada' : ejecutadas.has(n) ? 'Quitar el punto de parada' : 'Punto de parada: esta línea no se ejecuta con estos valores';
  };
  const aplicarPuntos = () => {
    const activo = conParadas();
    raiz.classList.toggle('rep-con-puntos', activo);
    paradaAnterior.hidden = paradaSiguiente.hidden = !activo;
    irCasoBase.hidden = !activo || pasoCasoBase < 0;
    nota.textContent = textoDeLaNota + (activo ? ' Toca el número de una línea para ponerle un punto de parada.' : '');
    numeros.forEach((numero, i) => {
      if (activo) {
        numero.setAttribute('role', 'button');
        numero.tabIndex = 0;
        marcarNumero(i);
      } else {
        for (const a of ['role', 'tabindex', 'aria-pressed', 'aria-label', 'title']) numero.removeAttribute(a);
        lineas[i].classList.remove('rep-parada-puesta', 'rep-parada-sin-uso');
      }
    });
  };
  const actualizarParadas = () => {
    paradaAnterior.disabled = anteriorParada(paso) < 0;
    paradaSiguiente.disabled = siguienteParada(paso) < 0;
    irCasoBase.disabled = paso === pasoCasoBase;
  };
  const alternarParada = (i) => {
    if (!conParadas()) return;
    if (paradas.has(i + 1)) paradas.delete(i + 1);
    else paradas.add(i + 1);
    marcarNumero(i);
    actualizarParadas();
  };
  numeros.forEach((numero, i) => {
    numero.addEventListener('click', () => alternarParada(i));
    numero.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      e.stopPropagation(); // (la barra espaciadora del reproductor detiene la animacion)
      alternarParada(i);
    });
  });
  aplicarPuntos();
  // Detener y repetir (herramienta de reproduccion, ver js/ajustes.js): detener y repetir (la barra espaciadora y la tecla R funcionan siempre)
  // en lugar de inicio, reproducir y final (las teclas Inicio y Fin y la barra de pasos siguen). Asi la barra se queda con cuatro botones.
  const mostrarExplicar = () => {
    const si = ajustes.valor('explicar');
    detener.hidden = repetir.hidden = !si;
    inicio.hidden = reproducir.hidden = final.hidden = si;
    raiz.classList.toggle('rep-explicando', si);
  };
  mostrarExplicar();
  // El engranaje abre el panel de ayudas visuales (perfiles y casillas), debajo de esta fila.
  const abrirAjustes = botonIcono('engranaje', 'Ayudas visuales');
  abrirAjustes.classList.add('rep-ajustes-boton');
  abrirAjustes.setAttribute('aria-label', 'Ayudas visuales');
  const panelAjustes = nodo('section', 'ajustes');
  panelAjustes.hidden = true;
  montarAjustes(panelAjustes, abrirAjustes);
  // El «ⓘ» abre las referencias de la figura (que significa cada flecha, casilla y bloque, y de que ayuda depende cada una).
  const abrirLeyenda = botonIcono('info', 'Referencias de la figura');
  abrirLeyenda.classList.add('rep-leyenda-boton');
  abrirLeyenda.setAttribute('aria-label', 'Referencias de la figura');
  const panelLeyenda = nodo('section', 'ajustes leyenda');
  panelLeyenda.hidden = true;
  montarLeyenda(panelLeyenda, abrirLeyenda);
  // Los dos botones de ayuda van juntos y a la derecha; si no entran en la fila, bajan juntos.
  const grupoAyuda = nodo('span', 'rep-herramientas-ayuda');
  grupoAyuda.append(abrirAjustes, abrirLeyenda);
  herramientas.append(nodo('span', 'rep-herramientas-rotulo', 'Figura'), menos, mas, ajustar, etiquetaZoom, grupoAyuda, panelAjustes, panelLeyenda);
  // Lo que ingresa el usuario, como una cinta de una sola linea (solo si el programa tiene entrada): a la izquierda, la zona de lectura (lo que el
  // scanf esta leyendo) y a la derecha, desvanecido, lo que falta leer. Al leer, los valores se desplazan hasta la zona de lectura, quedan un
  // momento y desaparecen: pasan a la consola.
  const textoDeEntrada = entrada || '';
  const cajaDeEntrada = nodo('div', 'rep-cinta');
  const zonaAhora = nodo('div', 'rep-cinta-ahora');
  zonaAhora.title = 'Lo que se está leyendo';
  const zonaDespues = nodo('div', 'rep-cinta-despues');
  zonaDespues.title = 'Lo que falta leer';
  const pista = nodo('div', 'rep-cinta-pista');
  zonaDespues.append(pista);
  cajaDeEntrada.append(zonaAhora, zonaDespues);
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
  // Las celdas de la cinta: cada valor (o cada salto de linea, con un ⏎) del texto de la entrada entre dos posiciones.
  const MAX_CELDAS = 14;
  const celdasDe = (desde, hasta, conSaltos) =>
    [...textoDeEntrada.slice(desde, hasta).matchAll(conSaltos ? /\S+|\n/g : /\S+/g)].map((m) => ({
      ini: desde + m.index,
      el: nodo('span', m[0] === '\n' ? 'rep-cinta-celda rep-cinta-salto' : 'rep-cinta-celda', m[0] === '\n' ? '⏎' : m[0]),
    }));
  const alFinal = (celdas) => {
    const partes = celdas.slice(0, MAX_CELDAS).map((c) => c.el);
    // El Enter que un scanf dejo sin leer espera a la cabeza de la cinta (resaltado): lo toma la lectura que sigue (un getchar, un %c) o lo salta (un %d).
    if (partes.length && partes[0].classList.contains('rep-cinta-salto')) partes[0].classList.add('rep-cinta-pendiente');
    return partes;
  };
  // La cinta en reposo: nada se lee ahora y lo que falta leer espera, desvanecido a la derecha.
  const pintarEntrada = (indice) => {
    if (!conEntrada) return;
    for (const a of [...zonaAhora.getAnimations(), ...pista.getAnimations()]) a.cancel();
    const faltan = celdasDe(leidoEn[indice], textoDeEntrada.length, true);
    const partes = alFinal(faltan);
    if (faltan.length > MAX_CELDAS) partes.push(nodo('span', 'rep-cinta-celda rep-cinta-salto', '…'));
    if (agotadaEn[indice]) partes.push(nodo('span', 'rep-cinta-celda rep-cinta-salto', 'fin'));
    zonaAhora.replaceChildren();
    pista.replaceChildren(...partes);
  };
  // Una lectura (un scanf): los valores que lee se desplazan por la cinta hasta la zona de lectura (se funden ahi), quedan "dura" ms y desaparecen
  // (a continuacion llegan a la consola). Devuelve los relojes para cancelarlos si el paso se interrumpe.
  const leerEnLaCinta = (indice, lectura, dura, u) => {
    const antes = leidoEn[indice - 1] || 0;
    const delante = celdasDe(antes, textoDeEntrada.length, true);
    const saltados = celdasDe(lectura.inicio ?? lectura.desde, lectura.desde, true).filter((c) => c.el.classList.contains('rep-cinta-salto'));
    const leidos = celdasDe(lectura.desde, lectura.hasta, true);
    const comoValor = !(lectura.celdas && lectura.celdas.length); // un getchar: el Enter que lee es el valor; un scanf lo salta
    for (const a of [...zonaAhora.getAnimations(), ...pista.getAnimations()]) a.cancel();
    zonaAhora.replaceChildren();
    const partes = alFinal(delante);
    if (delante.length > MAX_CELDAS) partes.push(nodo('span', 'rep-cinta-celda rep-cinta-salto', '…'));
    pista.replaceChildren(...partes);
    const resto = delante.slice(0, MAX_CELDAS).find((c) => c.ini >= lectura.hasta);
    const desplazar = resto ? resto.el.offsetLeft - pista.firstChild.offsetLeft : pista.scrollWidth;
    const ahora = [
      ...saltados.map(() => nodo('span', 'rep-cinta-celda rep-cinta-salto rep-cinta-saltada', '⏎')),
      ...leidos.map((c) => nodo('span', c.el.classList.contains('rep-cinta-salto') && !comoValor ? 'rep-cinta-celda rep-cinta-salto rep-cinta-saltada' : 'rep-cinta-celda rep-cinta-leida', c.el.textContent)),
    ];
    const sale = 0.7 * u;
    const relojes = [];
    if (sinMovimiento() || !pista.animate) {
      zonaAhora.replaceChildren(...ahora);
      pista.replaceChildren(...alFinal(delante.filter((c) => c.ini >= lectura.hasta)));
    } else {
      pista.animate([{ transform: 'translateX(0)' }, { transform: `translateX(-${desplazar}px)` }], { duration: sale, easing: 'ease-in-out', fill: 'forwards' });
      for (const c of delante) if (c.ini < lectura.hasta) c.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: sale, fill: 'forwards' });
      zonaAhora.replaceChildren(...ahora);
      zonaAhora.animate([{ opacity: 0, transform: 'translateX(30px)' }, { opacity: 1, transform: 'none' }], { duration: sale, easing: 'ease-out', fill: 'both' });
      relojes.push(
        tiempo.esperar(() => {
          zonaAhora.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 0.3 * u, fill: 'forwards' });
        }, Math.max(0, dura - 0.3 * u))
      );
    }
    relojes.push(tiempo.esperar(() => pintarEntrada(indice), dura));
    return relojes;
  };
  // El trazado de las llamadas recursivas (ver el registro de llamadas del motor): una tabla con cada llamada que se completa con
  // los pasos. Dos modos (panel de ajustes): la ida y la vuelta en dos columnas, o una sola donde la cuenta se va transformando
  // (la llamada se reemplaza por su valor y despues se resuelve). Si el programa no usa memoria dinamica, reemplaza a la figura.
  const registros = Array.isArray(llamadas) ? llamadas : [];
  // Las filas de la tabla: la de quien hace la llamada de mas arriba (casi siempre main; ida: la llamada, o la cuenta que la rodea;
  // vuelta: lo que vale cuando la llamada devuelve) va antes de esa llamada.
  const filas = [];
  const origenDe = new Map(); // de que llamada (registro) salio cada fila: la suya y las de quienes la llaman
  for (const r of registros) {
    const desdeAqui = filas.length;
    if (r.llamador) {
      const L = r.llamador;
      // Las funciones que llamaron a la que prepara la recursion (main llama a sumaDigitos, que llama a sumaAux): una fila por cada
      // una, que aparece cuando se abre la llamada que hace (su ida es esa llamada) y vuelve cuando esa llamada devuelve.
      const cadena = L.anteriores || [];
      cadena.forEach((e, i) => {
        const sig = i + 1 < cadena.length ? cadena[i + 1] : L;
        const sigId = i + 1 < cadena.length ? 'c' + r.id + '_' + (i + 1) : 'l' + r.id;
        const llamadaSig = sig.llamada || sig.funcion;
        filas.push({
          id: 'c' + r.id + '_' + i,
          llamada: e.llamada || e.funcion,
          nivel: r.nivel - 1 - (cadena.length - i),
          desde: sig.desde,
          hasta: null,
          base: null,
          ida: { texto: llamadaSig, paso: sig.desde, partes: [{ llamada: llamadaSig, valor: sig.valor ?? null, id: sigId }], ...(e.detalle ? { detalle: e.detalle } : {}) },
          vuelta: sig.valor != null && sig.hasta != null ? { texto: sig.valor, valor: sig.valor, paso: sig.hasta } : null,
        });
      });
      filas.push({
        id: 'l' + r.id,
        llamada: L.llamada || L.funcion,
        nivel: r.nivel - 1,
        // La fila de una funcion llamada (sumaDigitos(1234)) aparece cuando se abre su caja, como la de cualquier llamada, y su ida
        // cuando hace la llamada a la recursion; la de main, recien con esa llamada.
        desde: L.llamada && L.desde != null ? L.desde : r.desde,
        hasta: null,
        base: null,
        ida: L.ida ? { texto: L.ida.texto, paso: r.desde, partes: L.ida.partes, ...(L.detalle ? { detalle: L.detalle } : {}) } : null,
        vuelta: L.ida && r.hasta != null && L.valorFinal ? { texto: L.vuelta.texto, valor: L.valorFinal, paso: r.hasta } : null,
      });
    }
    filas.push(r);
    for (let i = desdeAqui; i < filas.length; i++) origenDe.set(filas[i], r);
  }
  const conValores = registros.some((r) => r.ida);
  // Los tramos del trazado: cada recursion con valores (desde que se entra a la llamada de mas afuera hasta que vuelve; si una recursion
  // llama a otra adentro, es un solo tramo). La tabla muestra solo las filas del tramo del paso, y la de la recursion anterior se limpia.
  const tramos = [];
  for (const r of registros.filter((x) => x.ida).sort((a, b) => a.desde - b.desde)) {
    const hasta = r.hasta == null ? traza.length : r.hasta;
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && r.desde < ultimo.hasta) ultimo.hasta = Math.max(ultimo.hasta, hasta);
    else tramos.push({ desde: r.desde, hasta });
  }
  const filasPorTramo = tramos.map((t) => filas.filter((fila) => {
    const r = origenDe.get(fila);
    return Boolean(r) && r.desde >= t.desde && r.desde < t.hasta;
  }));
  // El tramo de la tabla en el paso k: el ultimo que ya empezo (entre dos recursiones, la ultima queda a la vista, ya terminada, hasta que
  // empieza la siguiente: solo se nota con memoria dinamica, donde la tabla se ve siempre). Antes de la primera, ninguno.
  const filasDelPaso = (k) => {
    for (let i = tramos.length - 1; i >= 0; i--) if (tramos[i].desde <= k) return filasPorTramo[i];
    return [];
  };
  const sinMonticulo = traza.every((f) => !(f.monticulo && f.monticulo.length));
  const nivelBase = registros.length ? Math.min(...registros.map((r) => r.nivel)) : 0;
  // Con dos llamadas en el mismo return (un arbol) la sangria ayuda a ver que cuelga de que; si no, todo va a la izquierda.
  const ramifica = registros.some((r) => r.ida && r.ida.texto.split(r.funcion + '(').length > 2);
  const trazado = nodo('div', 'rep-trazado');
  trazado.hidden = true;
  const expandidas = new Set(); // las filas cuyas preguntas el alumno amplio (con el texto a la vista)
  // (la tabla solo sirve para recursiones con valores, con ida y vuelta: una recursion que no devuelve nada, como una que cambia un
  // arreglo, solo daria una lista de llamadas que la pila de la figura ya muestra)
  const trazadoActivo = () => conValores && ajustes.valor('trazado');
  // Con el trazado, la tabla de llamadas ocupa el lugar de la figura mientras se ejecuta una recursion (desde que se entra a la primera
  // llamada hasta que vuelve la de mas afuera) y la figura se ve el resto del programa. Solo si el programa no usa memoria dinamica (con
  // ella se ven las dos a la vez) y si su main tiene algo que mostrar (si solo hace la llamada, la figura estaria vacia: la tabla se ve
  // siempre).
  const principalConVariables = traza.some((f) => f.marcos.length > 0 && f.marcos[0].variables.length > 0);
  const alternaConLaFigura = () => trazadoActivo() && sinMonticulo && principalConVariables;
  const enRecursion = (k) => tramos.some((t) => t.desde <= k && k < t.hasta);
  const tablaEnEstePaso = (k) => trazadoActivo() && (!alternaConLaFigura() || enRecursion(k));
  const figuraEnEstePaso = (k) => !trazadoActivo() || !sinMonticulo || (alternaConLaFigura() && !enRecursion(k));
  // Al terminar la recursion, la tabla se queda un momento (con su ultima vuelta) y despues vuelve la figura: mientras tanto se fuerza.
  let tablaForzada = false;
  const tablaVisible = (k) => tablaForzada || tablaEnEstePaso(k);
  const figuraVisible = (k) => !tablaForzada && figuraEnEstePaso(k);
  raiz.pestanaActiva = () => (multi ? archivos[archivoActivo].nombre : null); // (para las pruebas)
  raiz.modoDelPaso =(k) => ({ tabla: tablaEnEstePaso(k), figura: figuraEnEstePaso(k) }); // (para las pruebas)
  raiz.llamadasDeLaTabla = (k) => filasDelPaso(k).filter((r) => r.desde <= k).map((r) => r.llamada); // (para las pruebas)
  // La pregunta que la figura mostraria en el paso k (el cursor sobre el if y, despues, su respuesta) y que la tabla del trazado ya muestra:
  // el rotulo de la franja se omite (no se ve dos veces, cada una con su animacion).
  const preguntaEnLaTabla = (k) => tablaEnEstePaso(k) && ajustes.valor('preguntasTabla') && filas.some((r) => (r.preguntas || []).some((q) => q.pregunta === k || q.respuesta === k));
  // La franja de la pregunta solo hace falta si algun paso tiene una pregunta que la tabla no muestra (un if de main, de una funcion que
  // no es recursiva, un bucle). Si no, no se reserva su espacio.
  const franjasDeCache = new Map();
  const franjaNecesaria = () => {
    const clave = String(trazadoActivo() && ajustes.valor('preguntasTabla'));
    if (!franjasDeCache.has(clave)) franjasDeCache.set(clave, traza.some((f, k) => Boolean(f.pregunta || f.condicion) && !preguntaEnLaTabla(k)));
    return franjasDeCache.get(clave);
  };
  dibujo.omitirRotulo = (foto) => preguntaEnLaTabla(traza.indexOf(foto));
  const enUnaColumna = () => conValores && ajustes.valor('trazadoUnaColumna');
  const partesDe = (r) => (r.ida.partes && r.ida.partes.length ? r.ida.partes : [r.ida.texto]);
  const llamadasDe = (r) => partesDe(r).filter((p) => typeof p === 'object');
  const textoDePartes = (r, conValor) =>
    partesDe(r)
      .map((p) => (typeof p === 'string' ? p : conValor ? p.valor : p.llamada))
      .join('')
      .replace(/[ \t]+/g, ' ')
      .replace(/ ?\n ?/g, '\n')
      .trim();
  // Los pasos en que se conoce cada cosa de la vuelta: cuando vuelven las llamadas (p1) y cuando se sabe lo que devuelve la
  // llamada (p3: el mismo paso si el return es la llamada; mas tarde, en su return, si la llamada estaba en otra linea).
  const pasosDe = (r) => ({ p1: r.vuelta.paso, p3: r.vuelta.pasoValor ?? (r.vuelta.valor === null ? Infinity : r.vuelta.paso) });
  // Que llega a la vuelta en el paso k: 'todo' (las llamadas y el valor a la vez), 'cuenta' (solo las llamadas se reemplazan),
  // 'resultado' (solo el valor que devuelve) o null.
  const faseDe = (r, k) => {
    const { p1, p3 } = pasosDe(r);
    if (k === p1 && k === p3) return 'todo';
    if (k === p1) return 'cuenta';
    if (k === p3) return 'resultado';
    return null;
  };
  // Los tres estados de la cuenta de una fila: la ida (con la llamada), la llamada reemplazada por su valor y el resultado.
  // Un estado que no cambia nada (la llamada sola, o un caso base) es null.
  const estadosDe = (r) => {
    const e1 = textoDePartes(r, false);
    const e2 = llamadasDe(r).length ? textoDePartes(r, true) : null;
    const e3 = r.vuelta ? r.vuelta.valor : null;
    return { e1, e2: e2 !== null && e2 !== e1 ? e2 : null, e3: e3 !== null && e3 !== (e2 ?? e1) ? e3 : null };
  };
  // Lo que se ve en esa fila, quieta, en el paso k.
  const textoQuieto = (r, k) => {
    if (!r.ida || pasoDeIda(r) > k) return '';
    if (k < r.ida.paso) return detalleIdaDe(r).pasos[0];
    const { e1, e2, e3 } = estadosDe(r);
    if (!r.vuelta) return e1;
    const { p1, p3 } = pasosDe(r);
    if (k >= p3) return e3 ?? e2 ?? e1;
    return k >= p1 ? e2 ?? e1 : e1;
  };
  // Lo que dura la transicion de una fila al llegar su vuelta: la llamada se reemplaza por su valor (1,9 unidades: brilla, se
  // contrae, el valor emerge y lo de la derecha cierra el hueco), el valor queda un momento en su lugar (0,8) y la cuenta se
  // resuelve (0,9: se contrae y emerge el resultado).
  const duracionDeFila = (r, u, fase = 'todo') => {
    const { e2, e3 } = estadosDe(r);
    const cuenta = fase !== 'resultado' && e2 ? 1.9 * u : 0;
    const resultado = fase !== 'cuenta' && e3 ? 0.9 * u : 0;
    return cuenta + (cuenta && resultado ? 0.8 * u : 0) + resultado;
  };
  // Un fundido es corto, pero no tanto que no se vea con las velocidades rapidas.
  const fundidoDe = (u) => Math.max(0.4 * u, 150);
  // Lo que dura la vuelta en tres columnas: aparece la misma expresion de la ida (un fundido), la llamada se reemplaza por su valor
  // (1,9 unidades), una pausa (0,3) y entra el "= valor" (0,5). Sin llamada que reemplazar, solo el fundido.
  const duracionVuelta3 = (r, u, d, fase = 'todo') => {
    if (fase === 'resultado') return 1.5 * d; // solo entra lo que devuelve, con un rebote
    const base = estadosDe(r).e2 === null ? d : d + 1.9 * u;
    const hayIgual = fase === 'todo' && r.vuelta.valor !== null && (r.vuelta.flecha || r.vuelta.texto !== r.vuelta.valor);
    return base + (hayIgual ? 0.8 * u : 0);
  };
  // El detalle de una pregunta de la tabla (ayuda "Detallar las preguntas de las llamadas"): sus estados, o null si no se pide o no se pudo.
  // En el paso de la respuesta, el texto pasa por cada uno (2 unidades cada uno) y despues entra el simbolo.
  const detalleDe = (q) => (ajustes.valor('detalleCondicionesTabla') && q.pasos && q.partes && q.pasos.length > 1 ? q : null);
  const duracionRespuesta = (q, u, d) => {
    const detalle = detalleDe(q);
    if (detalle) return 2 * u * (detalle.pasos.length - 1) + 1.5 * d;
    return (ajustes.valor('brilloCondiciones') ? 0.6 * u : 0) + 1.5 * d;
  };
  // La fila que hace cada llamada (la que la tiene en su ida): de ahi sale la llamada, y la resaltamos al abrirse.
  const padreDe = new Map();
  for (const p of filas) if (p.ida) for (const x of partesDe(p)) if (typeof x === 'object') padreDe.set(x.id, p);
  // Cuanto dura que se abra una llamada: su ida aparece (1 fundido) y respira (1,5) si recien se escribe y despues la llamada brilla
  // (2) mientras aparece el texto de la fila nueva; sin fila que la haga (la primera llamada), solo el fundido de su texto.
  const duracionApertura = (r, k, d, u = 0) => {
    const padre = padreDe.get(r.id);
    if (!conValores || !padre || !padre.ida) return d;
    const detalle = padre.ida.paso === k ? duracionDetalleIda(padre, u) : 0;
    return (padre.ida.paso === k ? (detalle ? detalle + d : 2.5 * d) : 0) + 2 * d;
  };
  // Cuanto dura el caso base: el foco sobre su fila (3,5 fundidos: el resto de la tabla se atenua, rebotan el valor de la ida y la
  // etiqueta y todo vuelve) y, en tres columnas, despues de una espera (1) el rebote de la vuelta (1,5): 5,5 en total.
  const duracionBase = (r, d, unaColumna) => (conValores && r.ida && !unaColumna ? 5.5 : 3.5) * d;
  // Cuando una fila se atenua porque su llamada termino en el paso k (despues de lo que pasa en su vuelta), o null; y si en k vuelven a su
  // color las que ya estaban atenuadas (el fin del programa).
  const atenuacionDe = (r, k, u, d) => {
    if (k >= traza.length - 1 || r.hasta !== k || r.desde > k) return null;
    const fase = r.vuelta ? faseDe(r, k) : null;
    return fase ? (enUnaColumna() ? duracionDeFila(r, u, fase) : duracionVuelta3(r, u, d, fase)) : 0;
  };
  const vuelveAlColor = (r, k) => k >= traza.length - 1 && r.hasta != null && r.hasta < k;
  // Lo que dura todo lo que se anima al llegar al paso k: llamadas que se abren, lo que aparece de golpe (1 fundido), el caso base
  // y las transiciones del modo de una columna.
  const duracionTrazado = (k, u) => {
    if (!tablaVisible(k) || sinMovimiento()) return 0;
    const d = fundidoDe(u);
    const unaColumna = enUnaColumna();
    let total = 0;
    for (const r of filasDelPaso(k)) {
      const apertura = r.desde === k ? duracionApertura(r, k, d, u) : 0;
      if (r.desde === k) total = Math.max(total, apertura);
      const atenuada = atenuacionDe(r, k, u, d);
      if (atenuada !== null) total = Math.max(total, atenuada + 1.5 * d);
      if (vuelveAlColor(r, k)) total = Math.max(total, 2 * d);
      // La linea que llega con el cursor (con el detalle de la ida) entra despues de las respuestas de la fila.
      const detalleIda = detalleIdaDe(r);
      if (detalleIda && detalleIda.paso0 === k && r.desde !== k && !esDeBase(r)) total = Math.max(total, retrasoDeEscrita(r, k, u, d) + d);
      if (r.base === k) total = Math.max(total, apertura + (r.ida && r.ida.paso === k ? duracionDetalleIda(r, u) : 0) + duracionBase(r, d, unaColumna));
      if (!r.ida) continue;
      if (r.ida.paso === k && r.desde !== k && r.base !== k) total = Math.max(total, d);
      // La respuesta de una pregunta de la llamada: el valor que se leyo brilla y despues entra "verdadero" o "falso" con un rebote.
      for (const q of ajustes.valor('preguntasTabla') ? r.preguntas || [] : []) if (q.respuesta === k && r.desde <= k) total = Math.max(total, duracionRespuesta(q, u, d));
      const fase = r.vuelta ? faseDe(r, k) : null;
      if (fase && r.desde <= k && r.base !== k) total = Math.max(total, unaColumna ? duracionDeFila(r, u, fase) : duracionVuelta3(r, u, d, fase));
    }
    return total;
  };
  // Las ETAPAS de la animacion del trazado en el paso k: [{ t, nombre }], con t en ms desde que empieza (ver pintarPaso). Repite la
  // estructura de los tiempos de pintarTrazado (duracionApertura, duracionBase, duracionVuelta3...): cada vez que algo de la animacion
  // empieza en otro momento, es una etapa.
  const etapasDelTrazado = (k, u) => {
    if (!tablaVisible(k) || sinMovimiento()) return [];
    const d = fundidoDe(u);
    const unaColumna = enUnaColumna();
    const marcas = [];
    const poner = (t, nombre) => marcas.push({ t, nombre });
    for (const r of filasDelPaso(k)) {
      if (r.desde > k) continue;
      const apertura = r.desde === k ? duracionApertura(r, k, d, u) : 0;
      const atenuada = atenuacionDe(r, k, u, d);
      if (atenuada !== null) poner(atenuada, 'La fila de «' + r.llamada + '» queda atrás: se atenúa');
      if (vuelveAlColor(r, k) && !marcas.some((x) => x.nombre === 'Las filas vuelven a su color')) poner(0, 'Las filas vuelven a su color');
      const detalleIda = detalleIdaDe(r);
      if (detalleIda && detalleIda.paso0 === k && r.desde !== k && !esDeBase(r)) poner(retrasoDeEscrita(r, k, u, d), 'Se escribe «' + detalleIda.pasos[0] + '», tal cual está en el código');
      if (r.desde === k) {
        const padre = conValores ? padreDe.get(r.id) : null;
        if (padre && padre.ida) {
          const detallePadre = padre.ida.paso === k ? detalleIdaDe(padre) : null;
          if (detallePadre) {
            for (let i = 1; i < detallePadre.pasos.length; i++) poner(2 * u * (i - 1), rotuloDeEstadoIda(i, detallePadre.pasos.length) + ': ' + detallePadre.pasos[i]);
            poner(duracionDetalleIda(padre, u) + d, 'La llamada brilla y se abre su fila');
          } else if (padre.ida.paso === k) {
            poner(0, 'Se escribe lo que hace «' + padre.llamada + '»');
            poner(2.5 * d, 'La llamada brilla y se abre su fila');
          } else poner(0, 'La llamada brilla y se abre su fila');
        } else poner(0, typeof r.id === 'string' ? 'Aparece la fila de «' + r.llamada + '»' : 'Aparece la llamada «' + r.llamada + '»');
      } else if (r.ida && r.ida.paso === k && r.base !== k && llamadasDe(r).length === 0) poner(0, 'Se escribe lo que devuelve «' + r.llamada + '»');
      if (r.base === k) {
        // (con el detalle de la ida, la linea se ve tal cual y, cuando termina el foco, pasa a su valor; recien despues vuelve el valor)
        const detalleBase = r.ida && r.ida.paso === k ? detalleIdaDe(r) : null;
        poner(apertura, 'Se anuncia el caso base de «' + r.llamada + '»' + (detalleBase ? ' con «' + detalleBase.pasos[0] + '», tal cual está en el código' : ''));
        if (detalleBase) for (let i = 1; i < detalleBase.pasos.length; i++) poner(apertura + 3.5 * d + 2 * u * (i - 1), rotuloDeEstadoIda(i, detalleBase.pasos.length) + ': ' + detalleBase.pasos[i]);
        const demora = detalleBase ? duracionDetalleIda(r, u) : 0;
        if (conValores && r.ida && !unaColumna) poner(apertura + demora + 4 * d, 'Vuelve el valor del caso base');
      }
      for (const q of ajustes.valor('preguntasTabla') ? r.preguntas || [] : []) {
        if (q.respuesta !== k) continue;
        const detalle = detalleDe(q);
        if (detalle) {
          for (let i = 1; i < detalle.pasos.length; i++) poner(2 * u * (i - 1), (i === 1 ? 'Se ponen los valores en la pregunta: ¿' : 'Se resuelve la pregunta: ¿') + detalle.pasos[i] + '?');
          poner(2 * u * (detalle.pasos.length - 1), 'La pregunta se responde: ' + (q.valor ? 'verdadero' : 'falso'));
        } else if (ajustes.valor('brilloCondiciones')) {
          poner(0, 'Brillan los valores de la pregunta ¿' + q.texto + '?');
          poner(0.6 * u, 'La pregunta se responde: ' + (q.valor ? 'verdadero' : 'falso'));
        } else poner(0, 'La pregunta ¿' + q.texto + '? se responde: ' + (q.valor ? 'verdadero' : 'falso'));
      }
      const fase = r.vuelta && r.base !== k ? faseDe(r, k) : null;
      if (fase) {
        const { e2, e3 } = estadosDe(r);
        const hayIgual = fase === 'todo' && r.vuelta.valor !== null && (r.vuelta.flecha || r.vuelta.texto !== r.vuelta.valor);
        if (unaColumna) {
          if (fase !== 'resultado' && e2) poner(0, 'La llamada de «' + r.llamada + '» se reemplaza por su valor');
          if (fase !== 'cuenta' && e3) poner(fase === 'resultado' ? 0 : e2 ? 1.9 * u + 0.8 * u : 0, 'La cuenta de «' + r.llamada + '» se resuelve');
        } else if (fase === 'resultado') poner(0, 'Se agrega lo que devuelve «' + r.llamada + '»');
        else {
          poner(0, 'Aparece en la Vuelta la expresión de la Ida');
          if (e2) poner(d, 'La llamada se reemplaza por su valor');
          if (hayIgual) poner(e2 ? d + 1.9 * u + 0.3 * u : d, 'Se agrega lo que devuelve «' + r.llamada + '»');
        }
      }
    }
    return marcas;
  };
  raiz.marcasDelTrazado = (k, u = 400) => etapasDelTrazado(k, u); // (para las pruebas)
  raiz.siguienteParada = (k) => siguienteParada(k); // (para las pruebas)
  raiz.anteriorParada = (k) => anteriorParada(k); // (para las pruebas)
  raiz.franjaNecesaria = () => franjaNecesaria(); // (para las pruebas)
  raiz.preguntaEnLaTabla = (k) => preguntaEnLaTabla(k); // (para las pruebas)
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
  // Lo que se resuelve se contrae hasta desaparecer y de ahi emerge el valor nuevo (crece de mas y se acomoda).
  const contraer = (el, retraso, duracion) => el.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }], { duration: duracion, delay: retraso, easing: 'ease-in', fill: 'forwards' });
  const emerger = (el, retraso, duracion) =>
    el.animate(
      [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: duracion, delay: retraso, easing: 'ease-out', fill: 'forwards' }
    );
  // La cuenta de una fila que cambia: la llamada brilla (y el valor de la fila de la que sale, a la vez), se contrae hasta
  // desaparecer y en su lugar emerge el valor, y lo de la derecha se corre para cerrar el hueco; despues la cuenta entera se
  // contrae hacia su borde izquierdo y emerge el resultado. Se arma con la tabla ya en la pagina para medir.
  // "fase": 'todo', o solo 'cuenta' (la llamada se reemplaza por su valor) o 'resultado' (la cuenta se resuelve), cuando la funcion
  // llama en una linea y devuelve despues, en otro paso.
  const transformar = (td, r, u, celdasDeValor, fase = 'todo') => {
    const { e1, e2: e2Real, e3: e3Real } = estadosDe(r);
    const e2 = fase === 'resultado' ? null : e2Real;
    const e3 = fase === 'cuenta' ? null : e3Real;
    const contenedor = nodo('span', 'rep-traz-cuenta');
    const capaA = nodo('span', 'rep-traz-capa');
    const llamadasEnCapa = [];
    if (fase === 'resultado') capaA.append(e2Real ?? e1); // ya con las llamadas reemplazadas
    else {
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
    }
    contenedor.append(capaA);
    const capaB = e3 ? nodo('span', 'rep-traz-capa rep-traz-fin', e3) : null;
    if (capaB) contenedor.append(capaB);
    td.lastElementChild.replaceWith(contenedor);
    let t = 0;
    if (e2) {
      for (const c of llamadasEnCapa) {
        const ancho = c.a.offsetWidth;
        const nuevo = c.b.offsetWidth;
        c.w.style.width = ancho + 'px';
        resplandor(c.a, 0, 0.6 * u, 1.12);
        contraer(c.a, 0.6 * u, 0.4 * u); // la llamada se contrae sobre su centro...
        emerger(c.b, 1.0 * u, 0.5 * u); // ...y de ahi emerge el valor (centrado en el hueco)
        c.w.animate([{ width: ancho + 'px' }, { width: nuevo + 'px' }], { duration: 0.6 * u, delay: 1.3 * u, easing: 'ease-in-out', fill: 'forwards' });
        resplandor(celdasDeValor.get(c.id), 0, 0.8 * u, 1.12);
      }
      t = 1.9 * u;
    }
    if (capaB) {
      if (e2) t += 0.8 * u;
      contraer(capaA, t, 0.4 * u); // la cuenta se contrae hacia su borde izquierdo...
      emerger(capaB, t + 0.4 * u, 0.5 * u); // ...y de ahi emerge el resultado
    }
  };
  // El texto de una celda: en la ida, la vuelta y la cuenta, las preguntas van arriba (un contenedor aparte) y el texto, ultimo.
  // (lo que acompaña al texto, las preguntas y la etiqueta del caso base, va arriba de el)
  const textoDeCelda = (td) => [...td.children].find((e) => !e.classList.contains('rep-traz-preguntas') && !e.classList.contains('rep-traz-base')) || null;
  // El simbolo de lo que dio una pregunta: ✓ (verdadero, verde) o ✗ (falso, gris pizarra: no es un error). Lleva su significado en el
  // aviso y para los lectores de pantalla.
  const iconoDe = (valor) => {
    const e = nodo('span', 'rep-traz-icono ' + (valor ? 'rep-traz-si' : 'rep-traz-no'), valor ? '✓' : '✗');
    e.title = valor ? 'verdadero' : 'falso';
    e.setAttribute('role', 'img');
    e.setAttribute('aria-label', valor ? 'verdadero' : 'falso');
    return e;
  };
  // Un renglon (una pregunta) aparece con un fundido.
  const aparecerLinea = (linea, retraso, duracion) => {
    if (linea && linea.animate && duracion) linea.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duracion, delay: retraso, easing: 'ease-in-out', fill: 'backwards' });
  };
  // El fondo de "lo nuevo" (amarillo) entra al final de la animacion de una celda y se queda.
  const ambarEn = (td, retraso, duracion) => {
    if (!td || !td.animate) return;
    const color = getComputedStyle(raiz).getPropertyValue('--aviso-fondo').trim() || '#fff4d6';
    td.animate([{ backgroundColor: 'transparent' }, { backgroundColor: color }], { duration: duracion, delay: retraso, fill: 'forwards' });
  };
  // La vuelta en tres columnas: aparece la misma expresion que en la ida; la llamada brilla (y el valor de la fila de la que sale),
  // se contrae hasta desaparecer y emerge su valor, lo de la derecha cierra el hueco y, despues de una pausa, entra el "= valor".
  // El fondo amarillo entra al final. Se arma con la tabla ya en la pagina para medir.
  const transformarVuelta = (td, r, u, d, celdasDeValor, fase = 'todo') => {
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
    const hayIgual = fase === 'todo' && r.vuelta.valor !== null && (r.vuelta.flecha || r.vuelta.texto !== r.vuelta.valor);
    const igual = hayIgual ? nodo('span', 'rep-traz-igual', (r.vuelta.flecha ? ' → ' : ' = ') + r.vuelta.valor) : null;
    if (igual) contenedor.append(igual);
    td.lastElementChild.replaceWith(contenedor);
    contenedor.animate([{ opacity: 0 }, { opacity: 1 }], { duration: d, easing: 'ease-in-out', fill: 'backwards' });
    // El "= valor" (invisible hasta el final) no ocupa lugar: si no cupiera a la par de la cuenta con las llamadas todavia sin reemplazar, bajaria a
    // un renglon propio y el texto quedaria arriba hasta que termina la animacion. Va fuera del flujo, donde quedara cuando se cierren los huecos.
    if (igual && capaA.offsetHeight <= igual.offsetHeight) {
      igual.style.position = 'absolute';
      igual.style.top = '0';
      igual.style.left = capaA.offsetWidth - llamadasEnCapa.reduce((suma, c) => suma + c.a.offsetWidth - c.b.offsetWidth, 0) + 'px';
    }
    for (const c of llamadasEnCapa) {
      const ancho = c.a.offsetWidth;
      const nuevo = c.b.offsetWidth;
      c.w.style.width = ancho + 'px';
      resplandor(c.a, d, 0.6 * u, 1.12);
      contraer(c.a, d + 0.6 * u, 0.4 * u);
      emerger(c.b, d + 1.0 * u, 0.5 * u);
      c.w.animate([{ width: ancho + 'px' }, { width: nuevo + 'px' }], { duration: 0.6 * u, delay: d + 1.3 * u, easing: 'ease-in-out', fill: 'forwards' });
      resplandor(celdasDeValor.get(c.id), d, 0.8 * u, 1.12);
    }
    if (igual) emerger(igual, d + 1.9 * u + 0.3 * u, 0.5 * u);
    const total = duracionVuelta3(r, u, d, fase);
    ambarEn(td, total - 0.5 * u, 0.5 * u);
  };
  // La vuelta de una fila quieta: la cuenta con sus valores y, si es distinta del valor, "= valor" (el valor como fragmento propio,
  // para poder hacerlo brillar cuando sube a la fila de arriba).
  const vueltaConValor = (r, k) => {
    const codigo = nodo('code', '');
    const texto = sinCortes(r.vuelta.texto);
    // Si la llamada esta en otra linea y todavia no devolvio, solo la linea con lo que devolvieron las llamadas.
    if (r.vuelta.valor === null || k < pasosDe(r).p3) {
      codigo.append(texto);
      return codigo;
    }
    if (!r.vuelta.flecha && r.vuelta.texto === r.vuelta.valor) codigo.append(nodo('span', 'rep-traz-valor', texto));
    else {
      // lo que devuelve va en su propio fragmento (para que entre con su rebote y para hacerlo brillar al subir)
      const final = nodo('span', 'rep-traz-final');
      final.append(r.vuelta.flecha ? ' → ' : ' = ', nodo('span', 'rep-traz-valor', r.vuelta.valor));
      codigo.append(texto, final);
    }
    return codigo;
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
  // El detalle de la ida de una fila (ayuda "Detallar la ida de las llamadas"): la linea tal cual esta en el codigo cuando el cursor llega
  // a ella ("paso0") y, al abrirse la llamada, sus estados (las variables por su valor, las cuentas resueltas), o null si no se pide o no hay.
  const detalleIdaDe = (r) => (conValores && ajustes.valor('detalleIda') && r.ida && r.ida.detalle && r.ida.detalle.pasos.length > 1 && r.ida.detalle.paso0 < r.ida.paso ? r.ida.detalle : null);
  // El caso base: la llamada que llega a su return sin hacer otra llamada, en el paso en que ese return se ejecuta.
  const esDeBase = (r) => Boolean(r.ida && r.base != null && r.ida.paso === r.base);
  // El primer paso en que la ida se ve en la tabla.
  const pasoDeIda = (r) => {
    const detalle = detalleIdaDe(r);
    // (la fila de quien llama puede aparecer despues de que el cursor llega a su linea: entonces entra con la linea escrita)
    // (la del caso base, en cambio, cuando el return se ejecuta: no antes)
    return detalle ? (esDeBase(r) ? r.ida.paso : Math.max(detalle.paso0, r.desde)) : r.ida.paso;
  };
  // La ida escrita tal cual, antes de que se abra la llamada.
  const idaEscrita = (r) => nodo('code', '', sinCortes(detalleIdaDe(r).pasos[0]));
  // Lo que dura pasar por los estados de la ida al abrirse la llamada: dos unidades cada uno.
  const duracionDetalleIda = (r, u) => {
    const detalle = detalleIdaDe(r);
    return detalle ? 2 * u * (detalle.pasos.length - 1) : 0;
  };
  // En el paso en que el cursor llega a la linea, la ida entra despues de las respuestas de las preguntas de esa fila (si las hay).
  const retrasoDeEscrita = (r, k, u, d) => {
    let retraso = 0;
    if (ajustes.valor('preguntasTabla')) for (const q of r.preguntas || []) if (q.respuesta === k) retraso = Math.max(retraso, duracionRespuesta(q, u, d));
    return retraso;
  };
  const rotuloDeEstadoIda = (i, n) => (n === 2 ? 'Se reemplazan las variables y se resuelven las cuentas' : i === 1 ? 'Se reemplazan las variables por su valor' : 'Se resuelven las cuentas');
  // El texto de una celda aparece con un fundido (y, si es una celda nueva en amarillo, el color tambien).
  const aparecerCelda = (td, retraso, duracion) => {
    if (!td || !td.animate || !duracion) return;
    const texto = textoDeCelda(td);
    if (texto) texto.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duracion, delay: retraso, fill: 'backwards' });
    if (td.classList.contains('rep-traz-nuevo')) {
      td.animate([{ backgroundColor: 'transparent' }, { backgroundColor: getComputedStyle(td).backgroundColor }], { duration: duracion, delay: retraso, fill: 'backwards' });
    }
  };
  // La ida pasa por sus estados (solo cambia lo que se reemplaza: ver textoPorPartes) y, al final, vuelve a su forma de siempre (con cada
  // llamada como un fragmento, para resaltar la que se abre).
  const animarDetalleIda = (td, r, u, retraso = 0) => {
    const detalle = detalleIdaDe(r);
    const codigo = td && textoDeCelda(td);
    if (!detalle || !codigo) return;
    const finales = [...idaConPiezas(r).childNodes];
    const halo = getComputedStyle(raiz).getPropertyValue('--acento').trim() || '#3b82f6';
    // (como en la ida quieta, los espacios de adentro de una llamada no se parten: el texto de cada estado se arma entero y se reparte)
    const sinPartirLlamadas = (partes) => {
      const total = sinCortes(partes.map((p) => p.t).join(''));
      let i = 0;
      return partes.map((p) => {
        const t = total.slice(i, i + p.t.length);
        i += p.t.length;
        return { ...p, t };
      });
    };
    for (let i = 1; i < detalle.pasos.length; i++) textoPorPartes(codigo, sinPartirLlamadas(detalle.partes[i]), retraso + 2 * u * (i - 1), u, { antes: '', despues: '', halo });
    tiempo.esperar(() => codigo.replaceChildren(...finales), retraso + duracionDetalleIda(r, u));
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
  // El pulso de la linea del cursor cuando el paso no la cambia: el fondo sube un instante y vuelve a su color (la linea no desaparece).
  const pulsarLinea = (fila, color, d) => {
    if (!fila || !fila.animate) return;
    const mezcla = (p) => `color-mix(in srgb, var(${color}) ${p}%, var(--codigo))`;
    fila.animate([{ backgroundColor: mezcla(24) }, { backgroundColor: mezcla(60), offset: 0.3 }, { backgroundColor: mezcla(24) }], { duration: 2 * d, easing: 'ease-in-out' });
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
  // "preguntaNueva": la pregunta que se ve en este paso (con el cursor sobre el if) entra con un fundido; se pide al poner el cursor, que
  // es cuando aparece (en la primera pasada de un paso animado no se dibuja todavia).
  let modoPintado = null; // lo ultimo que se vio: 'tabla' o 'figura' (con el trazado)
  const pintarTrazado = (k, { animar = false, u = 0, preguntaNueva = false, sinDesplazar = false } = {}) => {
    const activo = tablaVisible(k);
    trazado.hidden = !activo;
    raiz.classList.toggle('rep-sin-figura', !figuraVisible(k));
    // Al pasar de la figura a la tabla (o al reves), lo que aparece entra con un fundido.
    const modo = activo ? 'tabla' : 'figura';
    if (modoPintado !== null && modoPintado !== modo && !sinMovimiento()) {
      const entra = activo ? trazado : figura;
      entra.classList.remove('rep-entra-modo');
      void entra.offsetWidth; // (reinicia la animacion)
      entra.classList.add('rep-entra-modo');
    }
    modoPintado = modo;
    if (!activo) return;
    const unaColumna = enUnaColumna();
    const visibles = filasDelPaso(k).filter((r) => r.desde <= k);
    const abiertas = visibles.filter((r) => r.hasta == null || k < r.hasta);
    const actual = abiertas.length ? abiertas[abiertas.length - 1] : null;
    const tabla = nodo('table', 'rep-tabla-trazado');
    const cabeza = tabla.createTHead().insertRow();
    for (const t of unaColumna ? ['Llamada', 'Devuelve'] : conValores ? ['Llamada', 'Ida', 'Vuelta'] : ['Llamada']) cabeza.append(nodo('th', '', t));
    const cuerpoTabla = tabla.createTBody();
    const filasDom = new Map(); // la fila de cada llamada, por su numero
    const celdasDeValor = new Map(); // el texto de la cuenta de cada llamada, por su numero
    const celdasDeIda = new Map(); // la celda donde esta su ida (o su cuenta, en una columna)
    const celdasDeLlamada = new Map();
    const celdasQueAparecen = []; // [celda, retraso]: lo que aparece de golpe y entra con un fundido
    const bases = []; // las llamadas que llegan a su caso base justo ahora
    const filasNuevas = new Map(); // las filas de las llamadas que se abren justo ahora, todavia ocultas
    const porTransformar = [];
    const porTransformarVuelta = [];
    const valoresQueLlegan = [];
    const respuestasQueLlegan = []; // las respuestas que se conocen justo ahora
    const preguntasNuevas = []; // las preguntas que se ven justo ahora (entran con el cursor)
    const conMovimiento = animar && u > 0 && !sinMovimiento();
    const d = fundidoDe(u);
    const finDelPrograma = k >= traza.length - 1; // (ahi las filas que quedaron atras vuelven a su color)
    for (const r of visibles) {
      const fila = cuerpoTabla.insertRow();
      filasDom.set(r.id, fila);
      // Tocar una fila con preguntas amplia (o vuelve a achicar) el texto de todas las suyas, en todas sus celdas.
      if (r.preguntas && r.preguntas.length && ajustes.valor('preguntasTabla') && !ajustes.valor('preguntasTexto')) {
        fila.classList.add('rep-traz-ampliable');
        fila.addEventListener('click', () => {
          const seleccion = typeof getSelection === 'function' ? getSelection() : null;
          if (seleccion && !seleccion.isCollapsed) return; // el alumno esta seleccionando texto
          if (expandidas.has(r.id)) expandidas.delete(r.id);
          else expandidas.add(r.id);
          const arriba = trazado.scrollTop; // la tabla no se mueve: el alumno esta mirando esa fila
          pintarTrazado(paso, { u: 0, sinDesplazar: true });
          trazado.scrollTop = arriba;
        });
      }
      // Una fila nueva se agrega en el momento en que aparece su texto (ver mostrarFila), no antes.
      if (conMovimiento && r.desde === k) {
        fila.style.display = 'none';
        filasNuevas.set(r.id, fila);
      }
      if (r === actual) fila.classList.add('rep-traz-actual');
      else if (r.hasta != null && k >= r.hasta && !finDelPrograma) fila.classList.add('rep-traz-cerrada');
      const celda = (contenido, nuevo = false, sangria = 0, preguntas = null) => {
        const td = fila.insertCell();
        if (preguntas) td.append(preguntas); // (arriba del texto)
        td.append(typeof contenido === 'string' ? nodo('code', '', sinCortes(contenido)) : contenido);
        if (nuevo) td.classList.add('rep-traz-nuevo');
        if (sangria) td.style.paddingLeft = 6 + sangria * 10 + 'px';
        return td;
      };
      // El texto de la llamada que se abre no se marca en amarillo: brilla (temporalmente) en la ida de quien la hace.
      const tdLlamada = celda(r.llamada, false, ramifica ? r.nivel - nivelBase : 0);
      celdasDeLlamada.set(r.id, tdLlamada);
      // Las preguntas que hizo la llamada, de las fases pedidas (cada una en su renglon, con los valores puestos y lo que dio): la
      // pregunta se ve con el cursor sobre el if y la respuesta en el paso siguiente. En tres columnas, las de la ida van arriba
      // de la ida y las de la vuelta arriba de la vuelta; en una, todas arriba, con una flecha (baja: ida; sube: vuelta); en una
      // funcion sin ida ni vuelta (void), bajo la llamada.
      const armarPreguntas = (fases, conFlecha) => {
        if (!ajustes.valor('preguntasTabla')) return null;
        // Con el texto siempre a la vista, o con la fila ampliada, todas con su texto; si no, la pregunta se ve con su texto mientras
        // pasa (el paso de la pregunta y el de su respuesta) y despues queda solo su simbolo.
        const conTexto = ajustes.valor('preguntasTexto') || expandidas.has(r.id);
        const contenedor = nodo('div', 'rep-traz-preguntas');
        const pasadas = [];
        const lineas = [];
        for (const q of (r.preguntas || []).filter((x) => fases.includes(x.fase || 'ida'))) {
          const separada = q.pregunta !== q.respuesta;
          if (q.pregunta > k || (animar && separada && q.pregunta === k)) continue; // todavia no (o llega junto con el cursor)
          if (!conTexto && k > q.respuesta) {
            pasadas.push(q);
            continue;
          }
          const linea = nodo('div', 'rep-traz-pregunta');
          if (conFlecha) {
            const fase = nodo('span', 'rep-traz-fase', q.fase === 'vuelta' ? '↑' : '↓');
            fase.title = q.fase === 'vuelta' ? 'Pregunta de la vuelta' : 'Pregunta de la ida';
            linea.append(fase);
          }
          // Con el detalle, la pregunta se ve escrita como en el codigo hasta el paso de su respuesta, en que va pasando por sus estados.
          const detalle = detalleDe(q);
          const escrita = detalle && (k < q.respuesta || (q.respuesta === k && conMovimiento));
          const texto = nodo('code', 'rep-traz-pregunta-texto', sinCortes('¿' + (escrita ? detalle.pasos[0] : q.texto) + '?'));
          texto.title = q.simbolico;
          linea.append(texto);
          let resp = null;
          if (q.respuesta <= k) {
            resp = iconoDe(q.valor);
            linea.append(resp);
          }
          lineas.push(linea);
          if (conMovimiento && q.respuesta === k) respuestasQueLlegan.push({ texto, linea, resp, sola: !separada, detalle });
          else if (preguntaNueva && separada && q.pregunta === k) preguntasNuevas.push(linea);
        }
        if (pasadas.length) {
          // Las que ya pasaron: una fila de simbolos (un boton: tocarlo amplia la fila).
          const resumen = nodo('button', 'rep-traz-resumen');
          resumen.type = 'button';
          resumen.setAttribute('aria-expanded', 'false');
          resumen.setAttribute('aria-label', 'Preguntas de la llamada: ' + pasadas.map((q) => (q.valor ? 'verdadero' : 'falso')).join(', ') + '. Activar para ver el texto.');
          let faseAnterior = null;
          for (const q of pasadas) {
            if (conFlecha && q.fase !== faseAnterior) {
              const fase = nodo('span', 'rep-traz-fase', q.fase === 'vuelta' ? '↑' : '↓');
              resumen.append(fase);
              faseAnterior = q.fase;
            }
            resumen.append(iconoDe(q.valor));
          }
          contenedor.append(resumen);
          // los que acaban de pasar (este paso es el siguiente a su respuesta) entran con un fundido
          if (preguntaNueva && pasadas.some((q) => q.respuesta + 1 === k)) preguntasNuevas.push(resumen);
        }
        for (const linea of lineas) contenedor.append(linea);
        return contenedor.childElementCount ? contenedor : null;
      };
      if (!conValores) {
        const preguntas = armarPreguntas(['ida', 'vuelta'], false);
        if (preguntas) tdLlamada.append(preguntas);
      }
      // Una llamada que llego a su caso base lleva una etiqueta (en su propio renglon, para no ensanchar la columna).
      let pastilla = null;
      if (r.base != null && r.base <= k) {
        pastilla = nodo('span', 'rep-traz-base', '↩ caso base');
        tdLlamada.prepend(pastilla); // (arriba del texto: el texto de las tres columnas queda alineado al pie)
      }
      const base = { r, fila, pastilla, tdIda: null, tdVuelta: null };
      if (r.base === k) bases.push(base);
      if (!conValores) continue;
      const sinLlamadas = r.ida ? llamadasDe(r).length === 0 : true;
      if (unaColumna) {
        const fase = r.vuelta && r.ida && r.ida.paso <= k ? faseDe(r, k) : null;
        const llega = fase !== null;
        const transiciona = conMovimiento && llega && r.base !== k && duracionDeFila(r, u, fase) > 0;
        const vueltaHecha = r.vuelta && r.vuelta.paso <= k;
        // (con el detalle, la ida se ve escrita tal cual desde que el cursor llega a la linea, y al abrirse la llamada pasa por sus estados)
        const idaEscritaAun = Boolean(r.ida && detalleIdaDe(r) && pasoDeIda(r) <= k && (k < r.ida.paso || (conMovimiento && r.ida.paso === k)));
        const contenido = !r.ida || pasoDeIda(r) > k ? '' : idaEscritaAun ? idaEscrita(r) : vueltaHecha ? textoQuieto(r, k) : idaConPiezas(r);
        const nuevo = r.base !== k && (Boolean(r.ida && r.ida.paso === k && sinLlamadas) || (llega && !transiciona));
        const td = celda(contenido, nuevo, 0, armarPreguntas(['ida', 'vuelta'], true));
        celdasDeIda.set(r.id, td);
        celdasDeValor.set(r.id, td.lastElementChild);
        base.tdIda = td;
        if (transiciona) porTransformar.push([td, r, fase]);
        else if (r.ida && r.ida.paso === k && r.desde !== k && r.base !== k && sinLlamadas) celdasQueAparecen.push([td, 0]);
        else if (conMovimiento && r.ida && detalleIdaDe(r) && detalleIdaDe(r).paso0 === k && r.desde !== k && !esDeBase(r)) celdasQueAparecen.push([td, retrasoDeEscrita(r, k, u, d)]);
        continue;
      }
      const ida = r.ida && r.ida.paso <= k;
      const idaVisible = Boolean(r.ida && pasoDeIda(r) <= k);
      const idaEscritaAun = Boolean(idaVisible && detalleIdaDe(r) && (k < r.ida.paso || (conMovimiento && r.ida.paso === k)));
      const tdIda = celda(idaVisible ? (idaEscritaAun ? idaEscrita(r) : idaConPiezas(r)) : '', Boolean(ida && r.ida.paso === k && sinLlamadas && r.base !== k), 0, armarPreguntas(['ida'], false));
      celdasDeIda.set(r.id, tdIda);
      const vuelta = r.vuelta && r.vuelta.paso <= k;
      const faseVuelta = r.vuelta ? faseDe(r, k) : null;
      const llegaVuelta = faseVuelta !== null;
      // La vuelta con llamadas se anima en su lugar (ver transformarVuelta); el amarillo de "lo nuevo" entra al final de la animacion.
      const animaVuelta = conMovimiento && (faseVuelta === 'todo' || faseVuelta === 'cuenta') && r.base !== k && estadosDe(r).e2 !== null;
      const animaValor = conMovimiento && faseVuelta === 'resultado';
      const amarilloYa = llegaVuelta && (!conMovimiento || (r.base !== k && !animaVuelta && !animaValor));
      const tdVuelta = celda(vuelta ? vueltaConValor(r, k) : '', amarilloYa, 0, armarPreguntas(['vuelta'], false));
      celdasDeValor.set(r.id, tdVuelta.querySelector('.rep-traz-valor'));
      base.tdIda = tdIda;
      base.tdVuelta = tdVuelta;
      if (r.ida && r.ida.paso === k && r.desde !== k && r.base !== k && sinLlamadas) celdasQueAparecen.push([tdIda, 0]);
      else if (conMovimiento && r.ida && detalleIdaDe(r) && detalleIdaDe(r).paso0 === k && r.desde !== k && !esDeBase(r)) celdasQueAparecen.push([tdIda, retrasoDeEscrita(r, k, u, d)]);
      if (animaVuelta) porTransformarVuelta.push([tdVuelta, r, faseVuelta]);
      else if (animaValor && r.base !== k) valoresQueLlegan.push([tdVuelta, r]);
      else if (llegaVuelta && r.base !== k) celdasQueAparecen.push([tdVuelta, 0]);
    }
    trazado.replaceChildren(tabla);
    // La zona de la tabla tiene un alto maximo y se desplaza sola: la fila a la que se refiere el paso queda a la vista (lo
    // minimo que haga falta, con un margen de una fila); el encabezado, fijo arriba, no la tapa.
    const aLaVista = (fila, suave) => {
      if (!fila || !fila.isConnected || fila.style.display === 'none') return;
      const caja = trazado.getBoundingClientRect();
      const r = fila.getBoundingClientRect();
      const cabecera = tabla.tHead ? tabla.tHead.getBoundingClientRect().height : 0;
      const arriba = r.top - r.height - (caja.top + cabecera);
      const abajo = r.bottom + r.height - caja.bottom;
      const delta = arriba < 0 ? arriba : abajo > 0 ? abajo : 0;
      if (Math.abs(delta) < 1) return;
      // Una fila que esta del todo fuera de la zona visible (la vuelta de una recursion profunda, que sube por la tabla) se lleva de golpe: con
      // un desplazamiento suave su texto nuevo se veria recien cuando termina; si esta a medias, se mueve suave.
      const fuera = r.top >= caja.bottom || r.bottom <= caja.top + cabecera;
      trazado.scrollBy({ top: delta, behavior: suave && !fuera && !sinMovimiento() ? 'smooth' : 'auto' });
    };
    // La fila de una llamada que se abre entra (con un fundido) cuando empieza a aparecer su texto.
    const mostrarFila = (id, retraso, duracion) => {
      const fila = filasNuevas.get(id);
      if (!fila) return;
      const entrar = () => {
        fila.style.display = '';
        if (fila.animate) fila.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duracion, easing: 'ease-in-out' });
        aLaVista(fila, true); // la fila nueva (y la etiqueta del caso base, que ya ocupa su lugar) quedan a la vista
      };
      if (retraso > 0) tiempo.esperar(entrar, retraso);
      else entrar();
    };
    // Las filas que quedaron atras (su llamada ya termino) se atenuan, menos lo que devolvieron: la llamada y la ida bajan a una opacidad
    // menor (ver .rep-traz-atras) y la vuelta queda como estaba. Al llegar a su cierre lo hacen con un fundido, cuando termina lo que
    // pasa en su vuelta; al terminar el programa todo vuelve a su color.
    for (const r of visibles) {
      const fila = filasDom.get(r.id);
      if (!fila) continue;
      const celdas = [...fila.cells].slice(0, conValores && !unaColumna ? 2 : 1);
      if (fila.classList.contains('rep-traz-cerrada')) {
        for (const td of celdas) td.classList.add('rep-traz-atras');
        const espera = atenuacionDe(r, k, u, d);
        if (conMovimiento && espera !== null) for (const td of celdas) if (td.animate) td.animate([{ opacity: 1 }, { opacity: 0.55 }], { duration: 1.5 * d, delay: espera, fill: 'backwards' });
      } else if (conMovimiento && vuelveAlColor(r, k)) {
        for (const td of celdas) if (td.animate) td.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 2 * d });
      }
    }
    if (conMovimiento) {
      for (const r of visibles) {
        if (r.desde !== k) continue;
        const padre = conValores ? padreDe.get(r.id) : null;
        const tdPadre = padre && padre.ida && padre.ida.paso <= k ? celdasDeIda.get(padre.id) : null;
        if (!tdPadre) {
          aparecerCelda(celdasDeLlamada.get(r.id), 0, d);
          mostrarFila(r.id, 0, d);
          continue;
        }
        // La ida de quien la hace aparece sola (si recien se escribe), hay un respiro, la llamada brilla y, en lo mas alto del brillo,
        // aparece el texto de la fila nueva.
        let t = 0;
        const detallePadre = padre.ida.paso === k ? detalleIdaDe(padre) : null;
        if (padre.ida.paso === k) {
          if (detallePadre) {
            animarDetalleIda(tdPadre, padre, u);
            t = duracionDetalleIda(padre, u) + d;
          } else {
            aparecerCelda(tdPadre, 0, d);
            t = 2.5 * d;
          }
          // Esa ida agranda la fila de quien la hace, que puede quedar fuera de la zona visible: se la lleva a la vista ya, sin esperar a
          // que entre la fila nueva (que despues hace su propio desplazamiento).
          aLaVista(filasDom.get(padre.id), true);
        }
        // (con el detalle, la llamada se busca cuando la ida ya volvio a su forma de siempre)
        if (detallePadre) tiempo.esperar(() => resplandor(tdPadre.querySelector('[data-id="' + r.id + '"]'), 0, 2 * d, 1.12), t);
        else resplandor(tdPadre.querySelector('[data-id="' + r.id + '"]'), t, 2 * d, 1.12);
        resplandorQueAparece(textoDeCelda(celdasDeLlamada.get(r.id)), t, 2 * d, 1.12);
        mostrarFila(r.id, t, 0.6 * d); // la fila entra a la vez que su texto (que llega a verse del todo a los 0,6 fundidos)
      }
      // El caso base: el resto de la tabla se atenua; el valor de la ida y la etiqueta rebotan a la vez (con oscilaciones cada vez
      // menores); la tabla vuelve a la normalidad y, despues de una espera, rebota la vuelta.
      for (const b of bases) {
        const t = b.r.desde === k ? duracionApertura(b.r, k, d, u) : 0;
        // (con el detalle de la ida, el nombre se ve durante el foco; cuando termina pasa a su valor y recien despues vuelve el valor)
        const detalleBase = b.r.ida && b.r.ida.paso === k ? detalleIdaDe(b.r) : null;
        if (detalleBase) animarDetalleIda(b.tdIda, b.r, u, t + 3.5 * d);
        const espera = detalleBase ? duracionDetalleIda(b.r, u) : 0;
        focoEnFila(cuerpoTabla, b.fila, t, d);
        if (b.tdIda && b.r.ida) reboteAmortiguado(textoDeCelda(b.tdIda), t + 0.5 * d, 2.5 * d);
        reboteAmortiguado(b.pastilla, t + 0.5 * d, 2.5 * d);
        if (b.tdVuelta) {
          rebote(textoDeCelda(b.tdVuelta), t + espera + 4 * d, 1.5 * d);
          ambarEn(b.tdVuelta, t + espera + 4.5 * d, d); // el amarillo entra cuando el rebote termina
        }
      }
      for (const [td, retraso] of celdasQueAparecen) aparecerCelda(td, retraso, d);
    }
    for (const [td, r, fase] of porTransformar) transformar(td, r, u, celdasDeValor, fase);
    for (const [td, r, fase] of porTransformarVuelta) transformarVuelta(td, r, u, d, celdasDeValor, fase);
    // Las preguntas: la nueva entra con un fundido; en una respuesta, el texto de la pregunta (con los valores que se leyeron) brilla y
    // despues entra "verdadero" o "falso" con un rebote.
    for (const linea of preguntasNuevas) aparecerLinea(linea, 0, d);
    for (const { texto, linea, resp, sola, detalle } of respuestasQueLlegan) {
      if (sola) aparecerLinea(linea, 0, d);
      if (detalle) {
        // Cada estado de la pregunta (solo lo que cambia se contrae y emerge) y, despues del ultimo, entra el simbolo.
        const halo = getComputedStyle(raiz).getPropertyValue('--acento').trim() || '#3b82f6';
        for (let i = 1; i < detalle.pasos.length; i++) textoPorPartes(texto, detalle.partes[i], 2 * u * (i - 1), u, { antes: '¿', despues: '?', halo });
        rebote(resp, 2 * u * (detalle.pasos.length - 1), 1.5 * d);
        continue;
      }
      const brilla = ajustes.valor('brilloCondiciones');
      if (brilla) resplandor(texto, 0, 0.8 * u, 1.1);
      rebote(resp, brilla ? 0.6 * u : 0, 1.5 * d);
    }
    // Lo que devuelve la llamada, cuando se agrega a una vuelta que ya estaba: entra con su rebote y el amarillo al final.
    for (const [td] of valoresQueLlegan) {
      rebote(td.querySelector('.rep-traz-final'), 0, 1.5 * d);
      ambarEn(td, d, d);
    }
    // La fila de la que trata el paso (la ultima abierta) a la vista; si es nueva, lo hace mostrarFila cuando entra.
    if (actual && !filasNuevas.has(actual.id) && !sinDesplazar) aLaVista(filasDom.get(actual.id), conMovimiento);
  };
  const etiquetaEtapa = nodo('p', 'rep-estado-etapa'); // "Etapa 2 de 5: ..." (con la ayuda "Avanzar por etapas")
  etiquetaEtapa.hidden = true;
  etiquetaEtapa.setAttribute('aria-live', 'polite');
  lado.append(estado, etiquetaEtapa, herramientas, franjaPregunta, trazado, cajaFigura, nodo('p', 'rep-subtitulo', 'Consola'), cajaConsola);
  if (conEntrada) lado.append(nodo('p', 'rep-subtitulo', 'Lo que ingresa el usuario'), cajaDeEntrada);
  lado.append(nota);
  cuerpo.append(columnaCodigo, lado);
  const barraEtapas = nodo('div', 'rep-etapas'); // una barra fina dividida en las etapas del paso
  barraEtapas.hidden = true;
  barraEtapas.setAttribute('aria-hidden', 'true');
  const avisoZoom = nodo('div', 'rep-aviso-zoom');
  avisoZoom.setAttribute('role', 'status');
  const franjaHerramientas = montarHerramientas();
  raiz.append(giro, cuerpo, franjaHerramientas, barra, barraEtapas, ventanaConsola, avisoZoom);
  panelCodigo.append(cerrarCodigo);

  let paso = 0;
  let marcada = null;
  let reloj = null;
  let ultimaAnimacion = 0; // lo que dura la animacion del paso que se esta mostrando
  let relojModo = null; // el cambio de la tabla a la figura al terminar una recursion
  let relojTrazado = null; // el trazado que espera a que termine la animacion de la figura
  let relojesEtapas = []; // las pausas entre etapa y etapa del paso (ver programarEtapas)
  let etapasDelPaso = []; // [{ t, nombre }] del paso en curso, si se avanza por etapas
  let etapaActual = -1;
  let pausaDeEtapa = false; // el reloj esta detenido porque termino una etapa (Siguiente sigue con la que viene)
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
    if (multi) cabecera.append(`línea ${numeroLocal(foto.linea)} de `, nodo('code', '', archivos[tramoDe(foto.linea)] ? archivos[tramoDe(foto.linea)].nombre : ''), ':');
    else cabecera.append(`línea ${foto.linea}:`);
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
    verLinea(f.desde); // (varios archivos: la funcion puede estar en otro)
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

  // ---- avanzar por etapas: el paso se anima hasta el comienzo de la proxima etapa, ahi se detiene el reloj (y con el, todo lo que
  // se mueve) y Siguiente sigue con la que viene; la ultima etapa es la llegada del cursor a la linea.
  function mostrarEtapa(i, terminada) {
    if (!etapasDelPaso.length) return;
    etapaActual = i;
    const n = etapasDelPaso.length;
    etiquetaEtapa.hidden = false;
    etiquetaEtapa.textContent =
      'Etapa ' + (i + 1) + ' de ' + n + ': ' + etapasDelPaso[i].nombre + (terminada ? (i + 1 < n ? ' ✓. Sigue: ' + etapasDelPaso[i + 1].nombre : ' ✓') : '');
    barraEtapas.hidden = false;
    barraEtapas.replaceChildren(
      ...etapasDelPaso.map((e, j) => nodo('span', 'rep-etapa-seg' + (j < i || (j === i && terminada) ? ' rep-etapa-hecha' : '') + (j === i ? ' rep-etapa-actual' : '')))
    );
  }
  function limpiarEtapas() {
    for (const e of relojesEtapas) tiempo.cancelar(e);
    relojesEtapas = [];
    etapasDelPaso = [];
    etapaActual = -1;
    pausaDeEtapa = false;
    etiquetaEtapa.hidden = true;
    barraEtapas.hidden = true;
  }
  // Une las marcas que caen casi juntas, las ordena y programa la pausa al comienzo de cada etapa (menos la primera). Con una sola
  // etapa no hay nada que separar.
  // "inicio": la hora (del reloj) en que empezo el paso: las pausas se cuentan desde ahi y no desde ahora (dibujar la figura
  // tarda unos milisegundos, y la pausa de una etapa tiene que ir antes que lo que la figura programo para el mismo momento).
  function programarEtapas(marcas, inicio = tiempo.ahora()) {
    const ordenadas = [...marcas].sort((a, b) => a.t - b.t);
    const etapas = [];
    for (const m of ordenadas) {
      const ultima = etapas[etapas.length - 1];
      if (ultima && m.t - ultima.t < 25) {
        if (!ultima.nombre.includes(m.nombre)) ultima.nombre += ' y ' + m.nombre.charAt(0).toLowerCase() + m.nombre.slice(1);
      } else etapas.push({ ...m });
    }
    if (etapas.length < 2) return;
    etapasDelPaso = etapas;
    mostrarEtapa(0, false);
    etapas.forEach((e, i) => {
      if (i === 0) return;
      relojesEtapas.push(
        tiempo.esperar(() => {
          pausaDeEtapa = true;
          tiempo.pausar();
          mostrarEtapa(i - 1, true);
        }, Math.max(0, (e.pausa != null ? e.pausa : e.t) - (tiempo.ahora() - inicio)))
      );
    });
  }
  // Siguiente: si el reloj esta detenido al final de una etapa, sigue con la que viene; si no, pasa al paso que sigue (por etapas, si se pide).
  function avanzar() {
    parar();
    if (pausaDeEtapa) {
      pausaDeEtapa = false;
      mostrarEtapa(etapaActual + 1, false);
      tiempo.continuar();
      return;
    }
    ir(paso + 1, true);
  }

  // "animar": se mueven los bloques del paso anterior al de ahora (si no, aparecen en su lugar).
  // "adelante": se llego avanzando un paso (la unica vez que se espera a la animacion).
  function pintarPaso(animar = false, adelante = false, porEtapas = false) {
    limpiarEtapas();
    if (marcaPendiente) {
      tiempo.cancelar(marcaPendiente.reloj);
      const pendiente = marcaPendiente;
      marcaPendiente = null;
      pendiente.aplicar();
    }
    const foto = traza[paso];
    const antes = paso > 0 ? traza[paso - 1] : null;
    raiz.classList.toggle('rep-sin-franja', !franjaNecesaria());
    cuenta.textContent = `Paso ${paso + 1} de ${traza.length}`;
    barraPasos.value = String(paso);
    anterior.disabled = inicio.disabled = paso === 0;
    siguiente.disabled = final.disabled = paso === traza.length - 1;
    actualizarParadas();

    // El texto nuevo de la consola (un printf) aparece, en violeta y negrita, a la vez que se encienden las casillas de las que
    // salio, y vuelve a ser normal cuando se apagan (la figura avisa cuando: alMuestra). Lo que se tipeo (el eco de una lectura) llega
    // despues de que los valores recorren la cinta.
    for (const r of relojesDeSalida) tiempo.cancelar(r);
    relojesDeSalida = [];
    const textoAhora = textoDeConsola(foto);
    const textoAntes = textoDeConsola(antes);
    const nuevoEnSalida = adelante && animar && textoAhora.length > textoAntes.length && textoAhora.startsWith(textoAntes) ? textoAhora.slice(textoAntes.length) : '';
    const nuevas = sinMarcas(nuevoEnSalida).length;
    const lectura = adelante && animar && foto.lectura && foto.lectura.hasta > foto.lectura.desde ? foto.lectura : null;
    let muestraDeLaFigura = false; // la figura enciende las casillas de lo que se imprimio (y avisa para resaltar el texto)
    dibujo.alMuestra =
      nuevoEnSalida || lectura
        ? (desde, hasta) => {
            muestraDeLaFigura = true;
            if (lectura) {
              relojesDeSalida.push(tiempo.esperar(() => relojesDeSalida.push(...leerEnLaCinta(paso, lectura, hasta - desde, unidad)), desde));
              if (nuevoEnSalida) {
                relojesDeSalida.push(tiempo.esperar(() => pintarConsola(textoAhora, nuevas), hasta));
                relojesDeSalida.push(tiempo.esperar(() => pintarConsola(textoAhora), hasta + 1.5 * unidad));
              }
              return;
            }
            relojesDeSalida.push(tiempo.esperar(() => pintarConsola(textoAhora, nuevas), desde));
            relojesDeSalida.push(tiempo.esperar(() => pintarConsola(textoAhora), hasta));
          }
        : null;
    // La unidad de movimiento sale de la velocidad: lo que dura dibujar una flecha o mover los nodos.
    const unidad = VELOCIDADES[Number(velocidad.value)].ms * 0.5;
    tiempo.cancelar(relojTrazado);
    relojTrazado = null;
    tiempo.cancelar(relojEditor);
    relojEditor = null;
    tiempo.cancelar(relojModo);
    relojModo = null;
    // Mientras la tabla ocupa el lugar de la figura (sin memoria dinamica) no se la anima (nadie la ve) y las transiciones de la tabla
    // empiezan ya. El paso en que termina la recursion es distinto: primero la tabla (con la vuelta de la llamada de mas afuera) y,
    // despues de una pausa, la figura, que se anima ahi (la caja se cierra y el valor llega a su variable).
    const vuelve = adelante && animar && !sinMovimiento() && alternaConLaFigura() && !enRecursion(paso) && enRecursion(paso - 1);
    tablaForzada = vuelve;
    let figuraPendiente = vuelve;
    const sinFigura = !figuraVisible(paso);
    const inicioPaso = tiempo.ahora();
    const dFigura = vuelve ? 0 : dibujo.mostrar(foto, antes, { animar: animar && !sinFigura, duracion: unidad, flujo: adelante });
    const dTrazado = adelante && animar ? duracionTrazado(paso, unidad) : 0;
    const pausaVuelta = vuelve ? 0.5 * unidad : 0;
    const dFiguraVuelta = vuelve ? 3.5 * unidad : 0; // (lo que se calcula de verdad cuando la figura aparece)
    // Una llamada nueva (la pila crece): si se pide, se resalta toda su funcion antes de que aparezca el cursor.
    const entrando = adelante && animar && !sinMovimiento() && antes && foto.marcos.length > antes.marcos.length && ajustes.valor('resaltarFuncion') ? funcionDe(foto) : null;
    const dEditor = entrando ? 3.5 * fundidoDe(unidad) : 0;
    // Una lectura que no guarda en ninguna casilla (getchar) no tiene recorrido por la figura: la cinta y la consola siguen su propio tiempo.
    const soloCinta = Boolean(lectura && !(lectura.celdas && lectura.celdas.length));
    const dLectura = soloCinta ? 2.4 * unidad : 0;
    if (soloCinta) {
      muestraDeLaFigura = true;
      relojesDeSalida.push(tiempo.esperar(() => relojesDeSalida.push(...leerEnLaCinta(paso, lectura, 2 * unidad, unidad)), 0));
      if (nuevoEnSalida) {
        relojesDeSalida.push(tiempo.esperar(() => pintarConsola(textoAhora, nuevas), 2 * unidad));
        relojesDeSalida.push(tiempo.esperar(() => pintarConsola(textoAhora), 3.5 * unidad));
      }
    }
    ultimaAnimacion = Math.max(dFigura + dTrazado + dEditor + pausaVuelta + dFiguraVuelta, dLectura);
    // Las etapas (antes de programar lo demas: a la misma hora, la pausa va primero)
    if (porEtapas) {
      const marcas = [];
      if (dFigura > 0) {
        const deLaFigura = dibujo.etapas && dibujo.etapas.length ? dibujo.etapas : [{ t: 0, nombre: 'Cambia la figura' }];
        for (const m of deLaFigura) marcas.push({ t: m.t, nombre: m.nombre, ...(m.pausa != null ? { pausa: m.pausa } : {}) });
      }
      if (dLectura > 0 && !(dFigura > 0)) marcas.push({ t: 0, nombre: 'El valor pasa por la cinta hasta la zona de lectura y llega a la consola' });
      if (dTrazado > 0) for (const m of etapasDelTrazado(paso, unidad)) marcas.push({ t: dFigura + m.t, nombre: m.nombre });
      if (entrando) marcas.push({ t: dFigura + dTrazado, nombre: 'Se resalta la función' });
      if (vuelve) marcas.push({ t: dTrazado + pausaVuelta, nombre: 'Vuelve la figura: termina la recursión' });
      if (ultimaAnimacion > 0 && foto.linea != null) marcas.push({ t: ultimaAnimacion, nombre: marcada && marcada === lineas[foto.linea - 1] ? 'El cursor sigue en la línea ' + numeroLocal(foto.linea) + ': la línea pulsa' : 'Llega el cursor a la línea ' + numeroLocal(foto.linea) });
      programarEtapas(marcas, inicioPaso);
    }
    if (entrando) relojEditor = tiempo.esperar(() => resaltarFuncion(entrando, fundidoDe(unidad)), dFigura + dTrazado);
    if (vuelve) {
      relojModo = tiempo.esperar(() => {
        tablaForzada = false;
        figuraPendiente = false;
        pintarTrazado(paso, { u: unidad }); // esconde la tabla y muestra la figura
        const d = dibujo.mostrar(foto, antes, { animar: true, duracion: unidad, flujo: adelante });
        etiquetaZoom.textContent = `${Math.round(dibujo.escalaActual * 100)} %`;
        // El paso termina cuando termina de verdad la figura (antes se esperaba una estimacion).
        if (marcaPendiente && marcaPendiente.aplicar === aplicar) {
          tiempo.cancelar(marcaPendiente.reloj);
          const reloj = tiempo.esperar(() => {
            marcaPendiente = null;
            aplicar();
          }, d);
          marcaPendiente = { reloj, aplicar };
        }
      }, dTrazado + pausaVuelta);
    }
    if (dTrazado > 0) {
      const arrancar = () => pintarTrazado(paso, { animar: true, u: unidad });
      if (dFigura > 0) relojTrazado = tiempo.esperar(arrancar, dFigura);
      else arrancar();
    }
    etiquetaZoom.textContent = `${Math.round(dibujo.escalaActual * 100)} %`;

    const aplicar = () => {
      // Si el paso se interrumpio antes de que volviera la figura, se la deja al dia (sin animar).
      tablaForzada = false;
      if (figuraPendiente) {
        figuraPendiente = false;
        dibujo.mostrar(foto, antes, { animar: false });
      }
      // El codigo de afuera de la funcion en curso se atenua.
      const f = funcionDe(foto);
      const cambioDeFuncion = Boolean(f) && (!funcionAnterior || funcionAnterior.nombre !== f.nombre);
      lineas.forEach((fila, i) => fila.classList.toggle('rep-fuera', Boolean(f) && (i + 1 < f.desde || i + 1 > f.hasta)));
      const anterior = marcada;
      if (marcada) marcada.classList.remove('rep-ahora', 'rep-error');
      marcada = foto.linea != null ? lineas[foto.linea - 1] : null;
      if (foto.linea != null) verLinea(foto.linea); // (varios archivos: la pestaña del cursor)
      if (marcada) {
        marcada.classList.add(foto.error ? 'rep-error' : 'rep-ahora');
        seguirLinea(cambioDeFuncion, animar, foto);
        // Si el paso deja el cursor en la misma linea (la vuelta de una funcion con un solo return), la linea pulsa: avisa que se avanzo.
        if (animar && marcada === anterior && unidad > 0) pulsarLinea(marcada, foto.error ? '--error' : '--acento', fundidoDe(unidad));
      }
      funcionAnterior = f;
      mostrarEstado(foto);
      // La respuesta de una condicion se ve mientras se la anima y se retira cuando el cursor pasa a la linea siguiente (si se llega al
      // paso sin animacion, queda a la vista: es lo unico que dice como se resolvio).
      // (si el mismo paso trae ya la pregunta de la condicion que sigue -un if falso seguido de otro if-, lo que queda fijo es esa pregunta: no se retira)
      if (adelante && animar && foto.condicion && !foto.pregunta) dibujo.retirarRotulo(fundidoDe(unidad));
      pintarTrazado(paso, { u: unidad, preguntaNueva: adelante && animar }); // al terminar, la tabla queda quieta en su estado final
      pintarConsola(textoAhora);
      // Un texto que no sale de ninguna casilla (un printf o un puts con solo texto) se resalta igual, cuando llega, y despues vuelve a ser normal.
      if (nuevoEnSalida && !muestraDeLaFigura) {
        pintarConsola(textoAhora, nuevas);
        relojesDeSalida.push(tiempo.esperar(() => pintarConsola(textoAhora), 2 * unidad));
      }
      pintarEntrada(paso);
      etiquetaEtapa.hidden = true; // (el paso terminado: ya no hay etapa en curso)
      barraEtapas.hidden = true;
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

  // "porEtapas": se llego con Siguiente (o la flecha derecha): con la ayuda "Avanzar por etapas", el paso se detiene entre etapa y etapa.
  function ir(n, porEtapas = false) {
    tiempo.continuar();
    const nuevo = Math.max(0, Math.min(traza.length - 1, n));
    const animar = Math.abs(nuevo - paso) === 1;
    const adelante = nuevo === paso + 1;
    paso = nuevo;
    pintarPaso(animar, adelante, porEtapas && animar && adelante && ajustes.valor('avanzarPorEtapas'));
  }

  // Detener la animacion es detener el reloj (los temporizadores y lo que se calcula cuadro a cuadro, ver tiempo.js) y las
  // animaciones del navegador que estaban corriendo; seguir las reanuda desde donde quedaron. Avanzar, retroceder o repetir
  // un paso lo reanuda.
  let congeladas = [];
  tiempo.alCambiar((pausado) => {
    if (pausado) {
      congeladas = raiz.getAnimations ? raiz.getAnimations({ subtree: true }).filter((a) => a.playState === 'running') : [];
      // Y las de la figura nueva, que espera (fuera de la pagina) a que termine el recorrido de la anterior: si no, correrian durante
      // la pausa y se habrian gastado cuando aparezca (el navegador no las lista: las junta la figura).
      for (const a of dibujo.animacionesDelPaso || []) if (a.playState === 'running' && !congeladas.includes(a)) congeladas.push(a);
      congeladas.forEach((a) => a.pause());
    } else {
      congeladas.forEach((a) => a.play());
      congeladas = [];
      // (y las que nacieron ya detenidas, ver Figura.mostrarBase)
      if (raiz.getAnimations) for (const a of raiz.getAnimations({ subtree: true })) if (a.playState === 'paused') a.play();
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
    pintarPaso(true, true, ajustes.valor('avanzarPorEtapas'));
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
      // (un punto de parada: la reproduccion se detiene con el cursor en esa linea, antes de ejecutarla)
      if (esParada(paso)) {
        parar();
        return;
      }
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
    const flota = ampliado && apaisado && bajo;
    if (flota !== raiz.classList.contains('rep-flota')) colocarControles(flota);
    giro.hidden = !(ampliado && !apaisado && window.innerWidth < 700 && !giroCerrado);
    dibujo.fijarEscala({ alto: ampliado });
    seguirLinea(true);
    medirDesborde();
  }

  // ---- en pantalla completa apaisada en un telefono (la pantalla baja) cada renglon vale: los botones del zoom y de ayuda salen de su fila, flotan
  // sobre la esquina de abajo a la derecha de la figura y se esconden solos. Una manija (una lupa) siempre a la vista los abre; se esconden a los
  // 4 segundos sin tocarlos, salvo que haya un panel abierto. Las herramientas de reproduccion pasan a un solo boton, en la fila de la barra.
  let relojControles = null;
  function armarControles() {
    clearTimeout(relojControles);
    relojControles = setTimeout(() => {
      if (!panelAjustes.hidden || !panelLeyenda.hidden) armarControles(); // (un panel abierto: se espera a que se cierre)
      else raiz.classList.remove('rep-controles-abiertos');
    }, 4000);
  }
  // La fila se desplaza si no entra: mientras quede algo por ver a la derecha, el contenido se difumina junto al boton de cerrar (que se queda quieto).
  function medirDesborde() {
    barra.classList.toggle('rep-desborda', barra.scrollLeft + barra.clientWidth < barra.scrollWidth - 2);
  }
  barra.addEventListener('scroll', medirDesborde, { passive: true });
  function colocarControles(flota) {
    raiz.classList.toggle('rep-flota', flota);
    clearTimeout(relojControles);
    raiz.classList.remove('rep-controles-abiertos');
    if (flota) {
      cajaFigura.append(herramientas);
      barra.insertBefore(franjaHerramientas, ampliarBoton); // (cerrar, el ultimo de la fila)
    } else {
      lado.insertBefore(herramientas, franjaPregunta);
      raiz.insertBefore(franjaHerramientas, barra);
    }
    requestAnimationFrame(medirDesborde);
  }
  manija.onclick = () => {
    raiz.classList.add('rep-controles-abiertos');
    armarControles();
  };
  for (const evento of ['pointerdown', 'keydown']) {
    herramientas.addEventListener(evento, () => {
      if (raiz.classList.contains('rep-controles-abiertos')) armarControles(); // (cada toque da otros 4 segundos)
    });
  }

  function aplicarZoom() {
    dibujo.fijarEscala({ modo: zoom === 'ajustar' ? 'ajustar' : 'fijo', zoom: typeof zoom === 'number' ? zoom : 1, alto: ampliado });
    etiquetaZoom.textContent = `${Math.round(dibujo.escalaActual * 100)} %`;
  }
  // El porcentaje del zoom en un aviso al pie de la pantalla (solo en pantallas tactiles, donde la fila de la figura no lo muestra: ver el CSS).
  let relojAvisoZoom = null;
  function avisarZoom(limite = '') {
    const escala = typeof zoom === 'number' ? zoom : dibujo.escalaActual; // (la elegida, aunque la figura todavia no la haya aplicado)
    avisoZoom.textContent = `Zoom ${Math.round(escala * 100)} %${limite}`;
    avisoZoom.classList.add('rep-aviso-zoom-visible');
    clearTimeout(relojAvisoZoom);
    relojAvisoZoom = setTimeout(() => avisoZoom.classList.remove('rep-aviso-zoom-visible'), 1400);
  }
  function moverZoom(hacia) {
    const base = zoom === 'ajustar' ? dibujo.escalaActual : zoom;
    const siguienteNivel =
      hacia > 0 ? NIVELES_DE_ZOOM.find((n) => n > base + 0.01) : [...NIVELES_DE_ZOOM].reverse().find((n) => n < base - 0.01);
    if (siguienteNivel == null) {
      avisarZoom(hacia > 0 ? ' (máximo)' : ' (mínimo)');
      return;
    }
    zoom = siguienteNivel;
    guardarZoom(zoom);
    aplicarZoom();
    avisarZoom();
  }
  menos.onclick = () => moverZoom(-1);
  mas.onclick = () => moverZoom(1);
  ajustar.onclick = () => {
    zoom = 'ajustar';
    guardarZoom(zoom);
    aplicarZoom();
    avisarZoom();
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

  // Saltar a una parada: el paso de llegada se anima (se muestra quieto el anterior y se avanza uno), si se viene de adelante.
  function irAParada(k) {
    if (k < 0) return;
    parar();
    if (k > paso + 1) {
      tiempo.continuar();
      paso = k - 1;
      pintarPaso(false, false);
    }
    ir(k);
  }
  paradaAnterior.onclick = () => irAParada(anteriorParada(paso));
  paradaSiguiente.onclick = () => irAParada(siguienteParada(paso));
  irCasoBase.onclick = () => irAParada(pasoCasoBase);
  raiz.pasoDelCasoBase = () => pasoCasoBase; // (para las pruebas)
  inicio.onclick = () => (parar(), ir(0));
  anterior.onclick = () => (parar(), ir(paso - 1));
  siguiente.onclick = avanzar;
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
    else if (e.key === 'ArrowRight') (avanzar(), e.preventDefault());
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
