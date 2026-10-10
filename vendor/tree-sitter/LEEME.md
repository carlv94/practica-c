# tree-sitter

El analizador de C que usa el corrector. Son archivos de terceros, copiados
tal cual: **no se editan**.

| Archivo | De dónde salió |
|---|---|
| `tree-sitter.js` | <https://cdn.jsdelivr.net/npm/web-tree-sitter@0.24.7/tree-sitter.js> |
| `tree-sitter.wasm` | <https://cdn.jsdelivr.net/npm/web-tree-sitter@0.24.7/tree-sitter.wasm> |
| `tree-sitter-c.wasm` | <https://cdn.jsdelivr.net/npm/tree-sitter-wasms@0.1.12/out/tree-sitter-c.wasm> |

Bajados el 2026-10-10. Los dos primeros son el motor (paquete
`web-tree-sitter`, licencia MIT) y el tercero la gramática de C (paquete
`tree-sitter-wasms`, que empaqueta `tree-sitter-c`, licencia MIT).

Para actualizar: bajar los tres de una versión nueva, correr las pruebas
(`/pruebas/`) y anotar acá la versión. El motor y la gramática tienen que ser
compatibles entre sí: una gramática compilada para un motor mucho más nuevo no
carga. Desde la 0.25 el motor cambió su forma de cargarse, así que pasar a esa
obliga a tocar `js/analizador.js`.
