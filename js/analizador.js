// Carga el analizador de C (tree-sitter compilado a WebAssembly).
//
// Es lo unico del proyecto que viene de afuera. Hoy se baja de un CDN cada vez
// que se abre la pagina; para no depender de eso, alcanza con copiar los tres
// archivos a una carpeta del proyecto y cambiar estas dos direcciones.
const ORIGEN = {
  // tree-sitter.js y tree-sitter.wasm
  motor: 'https://cdn.jsdelivr.net/npm/web-tree-sitter@0.24.7/',
  gramatica: 'https://cdn.jsdelivr.net/npm/tree-sitter-wasms@0.1.12/out/tree-sitter-c.wasm',
};

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
      await cargarScript(ORIGEN.motor + 'tree-sitter.js');
      const TreeSitter = window.TreeSitter;
      await TreeSitter.init({ locateFile: (archivo) => ORIGEN.motor + archivo });
      const lenguajeC = await TreeSitter.Language.load(ORIGEN.gramatica);
      const analizador = new TreeSitter();
      analizador.setLanguage(lenguajeC);
      return analizador;
    })();
  }
  return cargando;
}
