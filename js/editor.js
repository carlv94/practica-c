// El editor de la respuesta: colores, numeros de linea y sangria.
//
// Es la caja de texto de siempre con el mismo codigo pintado justo debajo: la
// caja queda con la letra transparente y solo se le ve el cursor y la
// seleccion. Asi se escribe, se copia y se deshace como en cualquier caja de
// texto, y lo de color es solo un dibujo. Para que coincidan, la caja y el
// dibujo comparten letra, margenes y alto de linea (ver .editor en el CSS), y
// la caja crece con el texto en vez de desplazarse hacia abajo.
//
// Los colores salen de un reconocedor propio y simple, no del analizador: al
// escribir hay que pintar tambien el codigo a medio terminar, y rapido.

const LINEAS_MINIMAS = 8;
const SANGRIA = '  ';

const CLAVES = new Set([
  'struct', 'typedef', 'union', 'enum', 'const', 'static', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'default', 'break', 'continue', 'return', 'sizeof',
]);
const TIPOS = new Set(['char', 'int', 'float', 'double', 'long', 'short', 'unsigned', 'signed', 'void']);

// comentario | texto o caracter | #include y compania | numero | palabra
const PARTES =
  /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(^[ \t]*#[^\n]*)|(\b\d[\w.]*)|([A-Za-z_]\w*)/gm;

// Pinta codigo C dentro de un elemento. Arma nodos, nunca HTML.
export function pintar(elemento, codigo) {
  const nodos = [];
  let hasta = 0;
  for (const m of codigo.matchAll(PARTES)) {
    let clase = null;
    if (m[1] != null) clase = 'com';
    else if (m[2] != null) clase = 'cad';
    else if (m[3] != null) clase = 'pre';
    else if (m[4] != null) clase = 'num';
    else if (CLAVES.has(m[5])) clase = 'clave';
    else if (TIPOS.has(m[5])) clase = 'tipo';
    if (!clase) continue;

    if (m.index > hasta) nodos.push(codigo.slice(hasta, m.index));
    const parte = document.createElement('span');
    parte.className = clase;
    parte.textContent = m[0];
    nodos.push(parte);
    hasta = m.index + m[0].length;
  }
  if (hasta < codigo.length) nodos.push(codigo.slice(hasta));
  elemento.replaceChildren(...nodos);
}

// Convierte una <textarea> en el editor. Devuelve:
//   poner(texto)        cambia el contenido desde el programa
//   marcar(diagnosticos) senala en los numeros las lineas con error o aviso
export function crearEditor(caja) {
  const marco = document.createElement('div');
  marco.className = 'editor';
  const numeros = document.createElement('div');
  numeros.className = 'numeros';
  numeros.setAttribute('aria-hidden', 'true');
  const area = document.createElement('div');
  area.className = 'area';
  const pintado = document.createElement('pre');
  pintado.className = 'pintado';
  pintado.setAttribute('aria-hidden', 'true');

  caja.replaceWith(marco);
  area.append(pintado, caja);
  marco.append(numeros, area);
  caja.wrap = 'off';

  let lineas = 0;
  let salirConTab = false;

  function actualizar() {
    const texto = caja.value;
    // El renglon de mas es para que el ultimo, si esta vacio, tenga alto.
    pintar(pintado, texto + '\n');

    const cuantas = texto.split('\n').length;
    caja.rows = Math.max(LINEAS_MINIMAS, cuantas + 1);
    if (cuantas !== lineas) {
      lineas = cuantas;
      numeros.replaceChildren(
        ...Array.from({ length: cuantas }, (_, i) => {
          const numero = document.createElement('div');
          numero.textContent = i + 1;
          return numero;
        })
      );
    }
    // Lo marcado era de la correccion anterior: al cambiar el texto ya no vale.
    for (const numero of numeros.children) {
      numero.className = '';
      numero.removeAttribute('title');
    }
    pintado.scrollLeft = caja.scrollLeft;
  }

  // Por execCommand para que entre en el "deshacer" de la caja; si el
  // navegador no lo tiene, a mano.
  function reemplazar(texto) {
    const hecho = texto
      ? document.execCommand('insertText', false, texto)
      : document.execCommand('delete');
    if (!hecho) {
      caja.setRangeText(texto, caja.selectionStart, caja.selectionEnd, 'end');
      actualizar();
    }
  }

  function tecla(evento) {
    if (caja.readOnly || evento.ctrlKey || evento.metaKey || evento.altKey) return;
    const cursor = caja.selectionStart;
    const inicioLinea = caja.value.lastIndexOf('\n', cursor - 1) + 1;
    const antes = caja.value.slice(inicioLinea, cursor);

    if (evento.key === 'Escape') {
      salirConTab = true;
      return;
    }
    if (evento.key === 'Tab' && salirConTab) {
      salirConTab = false;
      return;
    }
    salirConTab = false;

    if (evento.key === 'Tab' && !evento.shiftKey) {
      evento.preventDefault();
      reemplazar(SANGRIA);
    } else if (evento.key === 'Tab') {
      // Shift + Tab saca una sangria del principio de la linea.
      evento.preventDefault();
      const sobra = /^ {1,2}/.exec(caja.value.slice(inicioLinea));
      if (!sobra) return;
      const fin = caja.selectionEnd;
      caja.setSelectionRange(inicioLinea, inicioLinea + sobra[0].length);
      reemplazar('');
      const mover = (p) => Math.max(inicioLinea, p - sobra[0].length);
      caja.setSelectionRange(mover(cursor), mover(fin));
    } else if (evento.key === 'Enter' && !evento.shiftKey) {
      // La linea nueva arranca con la sangria de la anterior, y una mas si abre llave.
      evento.preventDefault();
      const sangria = /^[ \t]*/.exec(antes)[0];
      reemplazar('\n' + sangria + (antes.trimEnd().endsWith('{') ? SANGRIA : ''));
    }
  }

  // La llave que cierra vuelve una sangria atras. Se mira lo que se va a
  // escribir y no la tecla: en un teclado en castellano la llave sale con
  // AltGr, que llega como Ctrl + Alt.
  function porEscribir(evento) {
    if (evento.inputType !== 'insertText' || evento.data !== '}') return;
    const cursor = caja.selectionStart;
    const inicioLinea = caja.value.lastIndexOf('\n', cursor - 1) + 1;
    const antes = caja.value.slice(inicioLinea, cursor);
    if (antes.length < SANGRIA.length || antes.trim()) return;
    evento.preventDefault();
    caja.setSelectionRange(cursor - SANGRIA.length, caja.selectionEnd);
    reemplazar('}');
  }

  caja.addEventListener('input', actualizar);
  caja.addEventListener('keydown', tecla);
  caja.addEventListener('beforeinput', porEscribir);
  caja.addEventListener('scroll', () => {
    pintado.scrollLeft = caja.scrollLeft;
  });
  actualizar();

  return {
    poner(texto) {
      caja.value = texto;
      caja.scrollLeft = 0;
      actualizar();
    },
    marcar(diagnosticos) {
      for (const d of diagnosticos) {
        const numero = d.linea == null ? null : numeros.children[d.linea - 1];
        if (!numero) continue;
        // Si en la linea hay un error y un aviso, se ve el error.
        if (numero.className !== 'error') numero.className = d.nivel;
        numero.title = d.mensaje.replaceAll('`', '');
      }
    },
  };
}
