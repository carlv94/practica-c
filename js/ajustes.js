// Las ayudas visuales del reproductor paso a paso: cada una se puede activar o no, y se guardan en este navegador.
// No cambian nada de lo que corrige el motor: solo lo que se dibuja. Hay tres perfiles ("Practica", "Explicacion" y "Detallado") que fijan
// todas de una vez, y cada ayuda se puede cambiar por separado ("Personalizado").
//
//   import { ajustes, montarAjustes } from './ajustes.js';
//   ajustes.valor('brilloCopias');            // true o false
//   const olvidar = ajustes.alCambiar(fn);    // fn() se llama cuando cambia alguna; devuelve como dejar de escuchar
//
// Para sumar una ayuda: una entrada en AYUDAS (con su valor en cada perfil) y listo; el panel la muestra solo.

export const AYUDAS = [
  {
    clave: 'brilloCopias',
    almacen: 'ajuste-brillo-copias',
    porDefecto: true,
    titulo: 'Brillo de los valores que se copian',
    detalle: 'Cuando un valor pasa de una variable a otra, o a un parámetro, resplandece en las dos casillas.',
  },
  {
    clave: 'brilloAsignaciones',
    almacen: 'ajuste-brillo-asignaciones',
    porDefecto: false,
    titulo: 'Brillo del valor que se asigna',
    detalle: 'Cuando se guarda un valor nuevo que no sale de otra variable (un número, una cuenta, NULL), resplandece en su casilla.',
  },
  {
    clave: 'brilloCondiciones',
    almacen: 'ajuste-brillo-condiciones',
    porDefecto: false,
    titulo: 'Brillo de los valores de una condición',
    detalle: 'Cuando se evalúa una condición, resplandecen los valores de las variables que se leen.',
  },
  {
    clave: 'detalleCondiciones',
    almacen: 'ajuste-detalle-condiciones',
    porDefecto: false,
    titulo: 'Detallar las condiciones',
    detalle: 'El rótulo de una condición la muestra escrita, con los valores puestos y resolviéndose parte por parte (127 % 10 == 5, 7 == 5) hasta la respuesta. Las condiciones con && y || van de a una condición simple, con el cortocircuito.',
  },
  {
    clave: 'resaltarFuncion',
    almacen: 'ajuste-resaltar-funcion',
    porDefecto: false,
    titulo: 'Resaltar la función cuando se la llama',
    detalle: 'Al entrar en una función (también en cada llamada de una recursión), se resalta todo su código un momento antes de que aparezca el cursor en su primera línea.',
  },
  {
    clave: 'trazado',
    almacen: 'ajuste-trazado',
    porDefecto: false,
    titulo: 'Trazado de las llamadas recursivas',
    detalle: 'En una recursión que devuelve valores, una tabla con cada llamada, su ida y su vuelta (una recursión que no devuelve nada, como la que cambia un arreglo, se ve en la figura). Cada recursión empieza con la tabla limpia. Si el programa no usa memoria dinámica, la tabla ocupa el lugar de la figura mientras se ejecuta la recursión (la figura se ve antes y después, en el resto del programa); si el main no declara nada, la tabla se ve siempre. Con memoria dinámica se ven las dos.',
  },
  {
    clave: 'trazadoUnaColumna',
    almacen: 'ajuste-trazado-una-columna',
    porDefecto: false,
    depende: 'trazado',
    titulo: 'Reemplazar la llamada por su valor, en una sola columna',
    detalle: 'En lugar de la ida y la vuelta una al lado de la otra, una columna donde la llamada se reemplaza por lo que devolvió y la cuenta se resuelve.',
  },
  {
    clave: 'preguntasTabla',
    almacen: 'ajuste-preguntas-tabla',
    porDefecto: false,
    depende: 'trazado',
    titulo: 'Preguntas de las llamadas',
    detalle: 'Muestra, en cada llamada, lo que preguntó (los if) y lo que dio: ✓ verdadero, ✗ falso. Pasada la pregunta queda el símbolo; al tocar la fila se ve el texto.',
  },
  {
    clave: 'preguntasTexto',
    almacen: 'ajuste-preguntas-texto',
    porDefecto: false,
    depende: 'preguntasTabla',
    titulo: 'Mostrar siempre el texto de cada pregunta',
    detalle: 'En lugar del símbolo solo, el texto completo de todas las preguntas, siempre a la vista.',
  },
  {
    clave: 'detalleCondicionesTabla',
    almacen: 'ajuste-detalle-condiciones-tabla',
    porDefecto: false,
    depende: 'preguntasTabla',
    titulo: 'Detallar las preguntas de las llamadas',
    detalle: 'Cada pregunta de la tabla del trazado se muestra escrita, con los valores puestos y resolviéndose parte por parte (n % 10 == d, 127 % 10 == 5, 7 == 5) antes de dar ✓ o ✗.',
  },
  {
    clave: 'detalleIda',
    almacen: 'ajuste-detalle-ida',
    porDefecto: false,
    depende: 'trazado',
    titulo: 'Detallar la ida de las llamadas',
    detalle: 'La columna Ida (o Devuelve) muestra la línea tal cual está en el código cuando el cursor llega a ella y, al abrirse la llamada, se reemplazan las variables por sus valores y se resuelven las cuentas (resto = mayorDigito(n / 10), mayorDigito(2132 / 10), mayorDigito(213)).',
  },
  {
    clave: 'punterosSinValor',
    almacen: 'ajuste-punteros-sin-valor',
    porDefecto: false,
    titulo: 'Punteros sin inicializar',
    detalle: 'Un puntero que todavía no recibió una dirección se dibuja con una flecha punteada de otro color que apunta a un «?»: apunta a algún lado, pero no se sabe adónde. Copiarlo (int *q = p;) copia esa incógnita.',
  },
  {
    clave: 'resaltarIndice',
    almacen: 'ajuste-resaltar-indice',
    porDefecto: false,
    titulo: 'Resaltar el índice al acceder a un arreglo',
    detalle: 'Al leer o escribir un elemento (v[i]), después de recorrer la flecha hasta el arreglo se marca el índice del elemento, y recién entonces se resalta su casilla.',
  },
  {
    clave: 'nombresFlechas',
    almacen: 'reproductor-nombres', // la clave de antes, para no perder lo que cada uno ya tenia elegido
    porDefecto: false,
    titulo: 'Nombres de las flechas',
    detalle: 'Cada flecha lleva escrito el nombre de la variable de la que sale (si no, se ve al señalarla).',
  },
];

// Las herramientas de reproducción: no cambian lo que se dibuja sino cómo se maneja el reproductor (los botones, las paradas, el avance). Se
// encienden y apagan a mano, no dependen del perfil y se ven siempre a mano (ver montarHerramientas). "nombre" es el del botón; el
// "detalle", su descripción.
export const HERRAMIENTAS = [
  {
    clave: 'explicar',
    almacen: 'reproductor-explicar', // la clave de antes, para no perder lo que cada uno ya tenia elegido
    porDefecto: false,
    nombre: 'Detener y repetir',
    titulo: 'Detener y repetir',
    detalle: 'Cambia Inicio, Reproducir y Final por Detener y Repetir, para frenar la animación de un paso y volver a verla las veces que haga falta mientras se explica. La barra espaciadora, la tecla R y las teclas Inicio y Fin funcionan siempre.',
  },
  {
    clave: 'puntosDeParada',
    almacen: 'ajuste-puntos-de-parada',
    porDefecto: false,
    nombre: 'Puntos de parada',
    titulo: 'Puntos de parada',
    detalle: 'Tocar el número de una línea del código le pone un punto de parada: Reproducir se detiene cuando el cursor llega a ella, y dos botones saltan al punto de parada anterior o al siguiente. Un punto vacío es una línea que no se ejecuta con estos valores.',
  },
  {
    clave: 'avanzarPorEtapas',
    almacen: 'ajuste-avanzar-por-etapas',
    porDefecto: false,
    nombre: 'Avanzar por etapas',
    titulo: 'Avanzar por etapas',
    detalle: 'Siguiente (y la flecha derecha) avanza etapa por etapa dentro de cada paso, deteniéndose entre una y otra y diciendo cuál es. La reproducción automática las ignora.',
  },
];

const TODAS = [...AYUDAS, ...HERRAMIENTAS];

export const PERFILES = [
  { id: 'practica', nombre: 'Práctica', valores: { brilloCopias: true, brilloAsignaciones: false, brilloCondiciones: false, detalleCondiciones: false, resaltarFuncion: false, trazado: false, trazadoUnaColumna: false, preguntasTabla: false, detalleCondicionesTabla: false, detalleIda: false, preguntasTexto: false, punterosSinValor: false, resaltarIndice: false, nombresFlechas: false } },
  { id: 'explicacion', nombre: 'Explicación', valores: { brilloCopias: true, brilloAsignaciones: true, brilloCondiciones: true, detalleCondiciones: false, resaltarFuncion: true, trazado: true, trazadoUnaColumna: false, preguntasTabla: true, detalleCondicionesTabla: false, detalleIda: false, preguntasTexto: false, punterosSinValor: true, resaltarIndice: true, nombresFlechas: false } },
  // Lo de Explicación, más todo lo que muestra el detalle de las cuentas: las condiciones, las preguntas y la ida de las llamadas.
  { id: 'detallado', nombre: 'Detallado', valores: { brilloCopias: true, brilloAsignaciones: true, brilloCondiciones: true, detalleCondiciones: true, resaltarFuncion: true, trazado: true, trazadoUnaColumna: false, preguntasTabla: true, detalleCondicionesTabla: true, detalleIda: true, preguntasTexto: false, punterosSinValor: true, resaltarIndice: true, nombresFlechas: false } },
];

const estado = new Map();
const oyentes = new Set();
let cargado = false;

function cargar() {
  if (cargado) return;
  cargado = true;
  for (const a of TODAS) {
    let v = a.porDefecto;
    try {
      const guardado = localStorage.getItem(a.almacen);
      if (guardado === '1') v = true;
      else if (guardado === '0') v = false;
    } catch (e) {
      // sin almacenamiento: queda lo de fabrica
    }
    estado.set(a.clave, v);
  }
}

function guardar(a) {
  try {
    localStorage.setItem(a.almacen, estado.get(a.clave) ? '1' : '0');
  } catch (e) {
    // sin almacenamiento: no se recuerda
  }
}

const avisar = () => {
  for (const f of [...oyentes]) f();
};

export const ajustes = {
  valor(clave) {
    cargar();
    return estado.get(clave) ?? false;
  },
  // Todas las ayudas con su valor, como un objeto.
  todos() {
    cargar();
    return Object.fromEntries(AYUDAS.map((a) => [a.clave, estado.get(a.clave)]));
  },
  fijar(clave, valor) {
    cargar();
    const a = TODAS.find((x) => x.clave === clave);
    if (!a || estado.get(clave) === Boolean(valor)) return;
    estado.set(clave, Boolean(valor));
    guardar(a);
    avisar();
  },
  // El perfil que coincide con lo elegido, o null si es una combinacion propia.
  perfil() {
    cargar();
    const p = PERFILES.find((p) => AYUDAS.every((a) => Boolean(p.valores[a.clave]) === estado.get(a.clave)));
    return p ? p.id : null;
  },
  fijarPerfil(id) {
    cargar();
    const p = PERFILES.find((x) => x.id === id);
    if (!p) return;
    let cambio = false;
    for (const a of AYUDAS) {
      const v = Boolean(p.valores[a.clave]);
      if (estado.get(a.clave) !== v) {
        estado.set(a.clave, v);
        guardar(a);
        cambio = true;
      }
    }
    if (cambio) avisar();
  },
  alCambiar(f) {
    oyentes.add(f);
    return () => oyentes.delete(f);
  },
};

// Una ayuda que depende de otra se puede tocar solo si la otra (y la de la que ella depende) esta encendida.
function habilitada(a) {
  if (!a.depende) return true;
  const padre = AYUDAS.find((x) => x.clave === a.depende);
  return ajustes.valor(a.depende) && habilitada(padre);
}

function nodo(etiqueta, clase, texto) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
}

// El panel: un boton (el engranaje del reproductor) que abre y cierra una tarjeta con el perfil y, debajo, cada ayuda.
export function montarAjustes(panel, abrir) {
  panel.replaceChildren();
  const cabeza = nodo('div', 'ajustes-cabeza');
  const cerrarBoton = nodo('button', 'ajustes-cerrar', '✕');
  cerrarBoton.type = 'button';
  cerrarBoton.title = 'Cerrar';
  cerrarBoton.setAttribute('aria-label', 'Cerrar');
  cabeza.append(nodo('h4', 'ajustes-titulo-panel', 'Ayudas visuales'), cerrarBoton);
  panel.append(cabeza);
  panel.append(
    nodo('p', 'ayuda', 'Cambian lo que se resalta en el paso a paso, no lo que se corrige. Se recuerdan en este navegador.')
  );

  const etiquetaPerfil = nodo('label', 'ajustes-perfil');
  etiquetaPerfil.append(nodo('span', '', 'Perfil'));
  const selector = document.createElement('select');
  for (const p of PERFILES) {
    const o = nodo('option', '', p.nombre);
    o.value = p.id;
    selector.append(o);
  }
  const propio = nodo('option', '', 'Personalizado');
  propio.value = '';
  propio.disabled = true;
  selector.append(propio);
  etiquetaPerfil.append(selector);
  panel.append(etiquetaPerfil);

  const detalle = nodo('details', 'ajustes-detalle');
  detalle.append(nodo('summary', '', 'Personalizar'));
  const casillas = new Map();
  for (const a of AYUDAS) {
    const fila = nodo('label', 'casilla' + (a.depende ? ' ajustes-sub' : '') + (a.depende && AYUDAS.find((x) => x.clave === a.depende).depende ? ' ajustes-sub-2' : ''));
    const c = document.createElement('input');
    c.type = 'checkbox';
    c.onchange = () => ajustes.fijar(a.clave, c.checked);
    casillas.set(a.clave, c);
    const textos = nodo('span', 'ajustes-texto');
    textos.append(nodo('span', 'ajustes-titulo', a.titulo), nodo('span', 'ajustes-ayuda', a.detalle));
    fila.append(c, textos);
    detalle.append(fila);
  }
  panel.append(detalle);

  selector.onchange = () => ajustes.fijarPerfil(selector.value);
  const mostrar = () => {
    const id = ajustes.perfil();
    selector.value = id ?? '';
    for (const [clave, c] of casillas) {
      c.checked = ajustes.valor(clave);
      const a = AYUDAS.find((x) => x.clave === clave);
      // Una casilla que depende de otra (el trazado por columnas) no se puede tocar si la otra esta apagada.
      c.disabled = !habilitada(a);
    }
    if (id == null) detalle.open = true;
  };
  mostrar();
  const olvidar = ajustes.alCambiar(() => {
    if (panel.isConnected) mostrar();
    else olvidar(); // el reproductor ya no esta en la pagina
  });

  const cerrar = () => {
    panel.hidden = true;
    abrir.setAttribute('aria-expanded', 'false');
  };
  cerrarBoton.onclick = () => {
    cerrar();
    abrir.focus();
  };
  abrir.setAttribute('aria-expanded', 'false');
  abrir.setAttribute('aria-controls', panel.id);
  abrir.onclick = () => {
    panel.hidden = !panel.hidden;
    abrir.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) selector.focus();
  };
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrar();
      abrir.focus();
    }
  });
  const alHacerClic = (e) => {
    if (!panel.isConnected) document.removeEventListener('click', alHacerClic);
    else if (!panel.hidden && !panel.contains(e.target) && !abrir.contains(e.target)) cerrar();
  };
  document.addEventListener('click', alHacerClic);
}

// Las herramientas de reproducción de un reproductor: una franja con un botón por herramienta (se enciende y se apaga; la descripción está en su
// ayuda) y, en una pantalla angosta, un solo botón «Herramientas» que abre una tarjeta con cada una y su descripción (ver el CSS: qué se ve
// en cada ancho). Devuelve la franja. Lo elegido es de todo el navegador: si hay varios reproductores, cambian a la vez.
let contadorDeFranjas = 0;
export function montarHerramientas() {
  const franja = nodo('div', 'rep-tools');
  franja.setAttribute('role', 'group');
  franja.setAttribute('aria-label', 'Herramientas de reproducción');

  const botones = new Map();
  for (const h of HERRAMIENTAS) {
    const b = nodo('button', 'rep-tool', h.nombre);
    b.type = 'button';
    b.title = h.detalle;
    b.onclick = () => ajustes.fijar(h.clave, !ajustes.valor(h.clave));
    botones.set(h.clave, b);
    franja.append(b);
  }

  // en pantallas angostas: un solo botón (con la cuenta de las que están encendidas) y la tarjeta
  const menu = nodo('button', 'rep-tools-menu');
  menu.type = 'button';
  const cuentaMenu = nodo('span', 'rep-tools-cuenta');
  const panel = nodo('section', 'ajustes rep-tools-panel');
  panel.id = 'rep-tools-panel-' + ++contadorDeFranjas;
  panel.hidden = true;
  const cabeza = nodo('div', 'ajustes-cabeza');
  const cerrarBoton = nodo('button', 'ajustes-cerrar', '✕');
  cerrarBoton.type = 'button';
  cerrarBoton.title = 'Cerrar';
  cerrarBoton.setAttribute('aria-label', 'Cerrar');
  cabeza.append(nodo('h4', 'ajustes-titulo-panel', 'Herramientas de reproducción'), cerrarBoton);
  panel.append(cabeza);
  panel.append(nodo('p', 'ayuda', 'Cambian cómo se maneja el paso a paso, no lo que se dibuja. Se recuerdan en este navegador.'));
  const casillas = new Map();
  for (const h of HERRAMIENTAS) {
    const fila = nodo('label', 'casilla');
    const c = document.createElement('input');
    c.type = 'checkbox';
    c.onchange = () => ajustes.fijar(h.clave, c.checked);
    casillas.set(h.clave, c);
    const textos = nodo('span', 'ajustes-texto');
    textos.append(nodo('span', 'ajustes-titulo', h.titulo), nodo('span', 'ajustes-ayuda', h.detalle));
    fila.append(c, textos);
    panel.append(fila);
  }
  menu.append('Herramientas', cuentaMenu);
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-controls', panel.id);

  const mostrar = () => {
    let encendidas = 0;
    for (const h of HERRAMIENTAS) {
      const si = ajustes.valor(h.clave);
      if (si) encendidas++;
      botones.get(h.clave).setAttribute('aria-pressed', String(si));
      casillas.get(h.clave).checked = si;
    }
    cuentaMenu.textContent = encendidas ? ` · ${encendidas}` : '';
    menu.setAttribute('aria-label', 'Herramientas de reproducción' + (encendidas ? `, ${encendidas} encendidas` : ''));
  };
  mostrar();
  const olvidar = ajustes.alCambiar(() => {
    if (franja.isConnected) mostrar();
    else olvidar(); // el reproductor ya no esta en la pagina
  });

  const cerrar = () => {
    panel.hidden = true;
    menu.setAttribute('aria-expanded', 'false');
  };
  cerrarBoton.onclick = () => {
    cerrar();
    menu.focus();
  };
  menu.onclick = () => {
    panel.hidden = !panel.hidden;
    menu.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) casillas.get(HERRAMIENTAS[0].clave).focus();
  };
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      cerrar();
      menu.focus();
    }
  });
  const alHacerClic = (e) => {
    if (!franja.isConnected) document.removeEventListener('click', alHacerClic);
    else if (!panel.hidden && !panel.contains(e.target) && !menu.contains(e.target)) cerrar();
  };
  document.addEventListener('click', alHacerClic);

  franja.append(menu, panel);
  return franja;
}
