// El reproductor paso a paso: el codigo con la linea que esta por ejecutarse y, al
// lado, la figura de la memoria (figura.js) en ese momento. Se avanza y se retrocede
// con los botones, la barra o las flechas del teclado, y se elige la velocidad.
//
//   crearReproductor({ codigo, traza, error, titulo, funciones })   devuelve un elemento
//
//   codigo     el programa, tal como se ejecuto
//   traza      r.traza de ejecutar(..., { traza: true })
//   error      r.error, ya con su mensaje para el alumno: { mensaje }, o null
//   titulo     un titulo opcional
//   cabezas    nombres de las variables que guardan el comienzo de la estructura (ver figura.js)
//   funciones  r.funciones: donde empieza y termina cada funcion; el codigo de afuera de
//              la que se esta ejecutando se ve atenuado

import { Figura } from './figura.js';
import { pintar } from '../editor.js';

const VELOCIDADES = [
  { nombre: 'Muy lenta', ms: 2400 },
  { nombre: 'Lenta', ms: 1500 },
  { nombre: 'Normal', ms: 900 },
  { nombre: 'Rápida', ms: 450 },
  { nombre: 'Muy rápida', ms: 200 },
];
const sinMovimiento = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const CLAVE_VELOCIDAD = 'reproductor-velocidad';
const CLAVE_ZOOM = 'reproductor-zoom';
const CLAVE_NOMBRES = 'reproductor-nombres';
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

const leerVelocidad = () => {
  try {
    const v = Number(localStorage.getItem(CLAVE_VELOCIDAD));
    return Number.isInteger(v) && v >= 0 && v < VELOCIDADES.length ? v : 2;
  } catch (e) {
    return 2;
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
const leerNombres = () => {
  try {
    return localStorage.getItem(CLAVE_NOMBRES) === '1';
  } catch (e) {
    return false;
  }
};
const guardarNombres = (si) => {
  try {
    localStorage.setItem(CLAVE_NOMBRES, si ? '1' : '0');
  } catch (e) {
    // sin almacenamiento: no se recuerda
  }
};
const guardarVelocidad = (v) => {
  try {
    localStorage.setItem(CLAVE_VELOCIDAD, String(v));
  } catch (e) {
    // sin almacenamiento: no se recuerda la eleccion
  }
};

export function crearReproductor({ codigo, traza, error = null, titulo = '', funciones = [], cabezas = null }) {
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
  const inicio = boton('⏮ Inicio', 'Volver al primer paso');
  const anterior = boton('◀ Anterior', 'Paso anterior (flecha izquierda)');
  const reproducir = boton('▶ Reproducir', 'Avanzar solo');
  const siguiente = boton('Siguiente ▶', 'Paso siguiente (flecha derecha)');
  const final = boton('Final ⏭', 'Ir al último paso');
  const barraPasos = document.createElement('input');
  barraPasos.type = 'range';
  barraPasos.className = 'rep-barra-pasos';
  barraPasos.min = '0';
  barraPasos.max = String(traza.length - 1);
  barraPasos.value = '0';
  barraPasos.setAttribute('aria-label', 'Paso');
  const cuenta = nodo('span', 'rep-cuenta');
  const etiquetaVelocidad = nodo('label', 'rep-velocidad', 'Velocidad ');
  const velocidad = document.createElement('select');
  velocidad.setAttribute('aria-label', 'Velocidad de reproducción');
  VELOCIDADES.forEach((v, i) => velocidad.append(new Option(v.nombre, String(i))));
  velocidad.value = String(leerVelocidad());
  etiquetaVelocidad.append(velocidad);
  const ampliarBoton = boton('⤢ Ampliar', 'Ver el paso a paso en toda la pantalla');
  barra.append(inicio, anterior, reproducir, siguiente, final, barraPasos, cuenta, etiquetaVelocidad, ampliarBoton);
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
  const consola = nodo('pre', 'rep-consola');
  const nota = nodo('p', 'rep-nota', 'La línea resaltada es la que está por ejecutarse. Lo que cambió con la línea anterior se marca en amarillo, también la flecha nueva.');
  const herramientas = nodo('div', 'rep-herramientas');
  const menos = boton('−', 'Achicar la figura');
  const mas = boton('+', 'Agrandar la figura');
  const ajustar = boton('Ajustar', 'Que la figura entre en el espacio disponible');
  const etiquetaZoom = nodo('span', 'rep-zoom-valor');
  const etiquetaNombres = nodo('label', 'rep-nombres');
  const casillaNombres = document.createElement('input');
  casillaNombres.type = 'checkbox';
  casillaNombres.checked = leerNombres();
  dibujo.fijarNombres(casillaNombres.checked);
  etiquetaNombres.append(casillaNombres, ' Nombres de las flechas');
  casillaNombres.onchange = () => {
    guardarNombres(casillaNombres.checked);
    dibujo.fijarNombres(casillaNombres.checked);
  };
  herramientas.append(nodo('span', '', 'Figura'), menos, mas, ajustar, etiquetaZoom, etiquetaNombres);
  lado.append(estado, herramientas, figura, nodo('p', 'rep-subtitulo', 'Lo que muestra el programa'), consola, nota);
  cuerpo.append(columnaCodigo, lado);
  raiz.append(giro, cuerpo, barra);
  panelCodigo.append(cerrarCodigo);

  let paso = 0;
  let marcada = null;
  let reloj = null;
  let ultimaAnimacion = 0; // lo que dura la animacion del paso que se esta mostrando
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
    if (f) cabecera.append(nodo('code', '', `${f.nombre}()`), ', por ejecutar ');
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
  function seguirLinea(cambioDeFuncion = false, suave = false) {
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
      const f = funcionDe(traza[paso]);
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

  // "animar": se mueven los bloques del paso anterior al de ahora (si no, aparecen en su lugar).
  function pintarPaso(animar = false) {
    const foto = traza[paso];
    const antes = paso > 0 ? traza[paso - 1] : null;
    cuenta.textContent = `Paso ${paso + 1} de ${traza.length}`;
    barraPasos.value = String(paso);
    anterior.disabled = inicio.disabled = paso === 0;
    siguiente.disabled = final.disabled = paso === traza.length - 1;

    // El codigo de afuera de la funcion en curso se atenua.
    const f = funcionDe(foto);
    const cambioDeFuncion = Boolean(f) && (!funcionAnterior || funcionAnterior.nombre !== f.nombre);
    lineas.forEach((fila, i) => fila.classList.toggle('rep-fuera', Boolean(f) && (i + 1 < f.desde || i + 1 > f.hasta)));

    if (marcada) marcada.classList.remove('rep-ahora', 'rep-error');
    marcada = foto.linea != null ? lineas[foto.linea - 1] : null;
    if (marcada) {
      marcada.classList.add(foto.error ? 'rep-error' : 'rep-ahora');
      seguirLinea(cambioDeFuncion, animar);
    }
    funcionAnterior = f;

    mostrarEstado(foto);
    // La unidad de movimiento sale de la velocidad: lo que dura dibujar una flecha o mover los nodos.
    ultimaAnimacion = dibujo.mostrar(foto, antes, { animar, duracion: VELOCIDADES[Number(velocidad.value)].ms * 0.5 });
    consola.textContent = foto.salida || ' ';
    etiquetaZoom.textContent = `${Math.round(dibujo.escalaActual * 100)} %`;
  }

  function ir(n) {
    const nuevo = Math.max(0, Math.min(traza.length - 1, n));
    const animar = Math.abs(nuevo - paso) === 1;
    paso = nuevo;
    pintarPaso(animar);
  }

  function parar() {
    if (reloj) clearTimeout(reloj);
    reloj = null;
    reproducir.textContent = '▶ Reproducir';
  }

  // El ritmo es el de la velocidad, pero un paso con animacion larga (la flecha, la pausa y el
  // movimiento) se espera a que termine, con un descanso, antes de pasar al que sigue.
  function programar() {
    const base = VELOCIDADES[Number(velocidad.value)].ms;
    reloj = setTimeout(() => {
      if (paso >= traza.length - 1) {
        parar();
        return;
      }
      ir(paso + 1);
      programar();
    }, Math.max(base, ultimaAnimacion + base * 0.45));
  }

  function arrancar() {
    if (reloj) clearTimeout(reloj);
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
    ampliarBoton.textContent = si ? '✕ Cerrar' : '⤢ Ampliar';
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
    reproducir.textContent = '⏸ Pausa';
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
    if (e.key === 'ArrowRight') (parar(), ir(paso + 1), e.preventDefault());
    else if (e.key === 'ArrowLeft') (parar(), ir(paso - 1), e.preventDefault());
  });

  pintarPaso();
  // El panel todavia no esta en la pagina: se adapta cuando se lo pueda medir.
  requestAnimationFrame(() => {
    adaptar();
    aplicarZoom();
  });
  return raiz;
}
