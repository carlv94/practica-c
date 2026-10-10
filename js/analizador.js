// Carga el analizador de C (tree-sitter compilado a WebAssembly).
//
// Es lo unico del proyecto que viene de afuera, y va copiado en
// vendor/tree-sitter para no depender de internet ni de un tercero: de donde
// salio cada archivo y como actualizarlo esta en el LEEME.md de esa carpeta.
const CARPETA = new URL('../vendor/tree-sitter/', import.meta.url).href;

let cargando = null;

function cargarScript(direccion) {
  return new Promise((listo, fallo) => {
    const script = document.createElement('script');
    script.src = direccion;
    script.onload = listo;
    script.onerror = () => fallo(new Error('No se pudo cargar ' + direccion));
    document.head.appendChild(script);
  });
}

// Devuelve siempre el mismo analizador: se carga una sola vez por pagina.
export function cargarAnalizador() {
  if (!cargando) {
    cargando = (async () => {
      await cargarScript(CARPETA + 'tree-sitter.js');
      const TreeSitter = window.TreeSitter;
      await TreeSitter.init({ locateFile: (archivo) => CARPETA + archivo });
      const lenguajeC = await TreeSitter.Language.load(CARPETA + 'tree-sitter-c.wasm');
      const analizador = new TreeSitter();
      analizador.setLanguage(lenguajeC);
      return analizador;
    })();
  }
  return cargando;
}
