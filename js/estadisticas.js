// Envio anonimo de los errores de cada intento, para saber cuales son los mas
// comunes. Solo salen datos que no identifican a nadie: la consigna, los
// codigos de diagnostico y un numero al azar propio de este navegador. El
// codigo que escribio el alumno nunca se envia.
//
// DIRECCION es la direccion de la aplicacion web de Google Apps Script que
// recibe los datos (ver estadisticas/LEEME.md). Vacia, no se envia nada. Es
// publica a proposito: la practica es una pagina estatica, no hay donde ocultarla.
//
// Tampoco se envia desde localhost ni desde la pagina de pruebas, ni en el modo
// docente, para que las pruebas del docente no ensucien la estadistica.

const DIRECCION =
  'https://script.google.com/macros/s/AKfycbxuUYWGXihrFaEXiGv_o4ljbAJMXC_-bdApYH5RzI-5gyOaRlxMnZmhL0bT7wyPkyQWdA/exec';
const VERSION = 1;
const CLAVE_ANONIMO = 'practica-c:anonimo';

let anonimoDeSesion = null;

export function esLocal() {
  const { hostname, protocol, pathname } = location;
  return (
    protocol === 'file:' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.localhost') ||
    pathname.includes('/pruebas/')
  );
}

// El modo docente: "?docente" en la direccion lo enciende y queda guardado en
// este navegador (para no ensuciar la estadistica la proxima vez que se entre
// sin recordarlo); "?docente=no" lo apaga. Muestra las series ocultas y no
// envia nada. La direccion se limpia: el modo ya quedo guardado.
const CLAVE_DOCENTE = 'practica-c:docente';
let docente = null;

export function esDocente() {
  if (docente !== null) return docente;
  let guardado = false;
  try {
    guardado = localStorage.getItem(CLAVE_DOCENTE) === '1';
  } catch {
    // sin almacenamiento: vale solo para esta visita
  }
  const pedido = new URLSearchParams(location.search).get('docente');
  docente = pedido === null ? guardado : pedido !== 'no';
  if (pedido !== null) {
    try {
      if (docente) localStorage.setItem(CLAVE_DOCENTE, '1');
      else localStorage.removeItem(CLAVE_DOCENTE);
    } catch {
      // sin almacenamiento
    }
    const parametros = new URLSearchParams(location.search);
    parametros.delete('docente');
    const resto = parametros.toString();
    history.replaceState(null, '', location.pathname + (resto ? '?' + resto : '') + location.hash);
  }
  return docente;
}

// Un numero al azar que se genera una vez y queda en el navegador. No dice
// quien es el alumno: solo permite contar alumnos distintos y no intentos.
function anonimo() {
  try {
    let id = localStorage.getItem(CLAVE_ANONIMO);
    if (!id) {
      id = azar();
      localStorage.setItem(CLAVE_ANONIMO, id);
    }
    return id;
  } catch {
    anonimoDeSesion ??= azar();
    return anonimoDeSesion;
  }
}

function azar() {
  const a = new Uint32Array(3);
  crypto.getRandomValues(a);
  return Array.from(a, (n) => n.toString(36)).join('');
}

// Si esta pagina manda datos: es lo que decide si se muestra el aviso.
export function enviaEstadisticas() {
  return Boolean(DIRECCION) && !esLocal() && !esDocente();
}

// Si falla (sin conexion, direccion caida), el alumno ni se entera: no se
// reintenta ni se guarda para despues.
function enviar(datos) {
  if (!enviaEstadisticas()) return;
  try {
    fetch(DIRECCION, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ version: VERSION, ...datos }),
    }).catch(() => {});
  } catch {
    // sin red o sin permiso
  }
}

// Un intento igual al anterior, enseguida (el clic repetido, la tecla
// mantenida), no dice nada nuevo: se cuenta una sola vez. Mientras siga la
// rafaga, la ventana se corre, asi que una rafaga larga tambien es uno.
const VENTANA_DE_REPETIDOS = 5000;
let ultimoIntento = null;

export function enviarIntento({ serie, consigna, resultado, conAyuda, codigos }) {
  const clave = JSON.stringify([serie, consigna, resultado, Boolean(conAyuda), codigos]);
  const ahora = Date.now();
  const repetido = ultimoIntento && ultimoIntento.clave === clave && ahora - ultimoIntento.hora < VENTANA_DE_REPETIDOS;
  ultimoIntento = { clave, hora: ahora };
  if (repetido) return;
  enviar({
    tipo: 'intento',
    anonimo: anonimo(),
    serie,
    consigna,
    resultado,
    conAyuda: Boolean(conAyuda),
    codigos,
  });
}

// Un informe del alumno: algo que le parece mal del corrector o de un mensaje.
// Sin el identificador anonimo: lo que lo une a quien lo manda es el numero que
// el alumno ve al enviarlo, y puede mencionarlo al docente si quiere.
// `respuesta` y `previo` son null si no dio permiso para enviar su codigo.
export function enviarInforme(informe) {
  enviar({ tipo: 'informe', ...informe });
}

// Un numero corto para decir "el informe I-4K7Q2": sin letras ni cifras que se
// confundan (0/O, 1/I).
export function numeroDeInforme() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const a = new Uint8Array(5);
  crypto.getRandomValues(a);
  return 'I-' + Array.from(a, (n) => letras[n % letras.length]).join('');
}
