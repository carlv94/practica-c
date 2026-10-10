// Servidor de archivos para probar el sitio en esta PC:
//
//   node servidor.js          (queda en http://localhost:8080)
//   node servidor.js 9000     (otro puerto)
//
// Hace falta porque el navegador no deja cargar modulos ni el analizador de C
// abriendo index.html con doble clic. No usa nada fuera de Node.

const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const PUERTO = Number(process.argv[2]) || 8080;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
};

http
  .createServer((pedido, respuesta) => {
    let ruta = decodeURIComponent(pedido.url.split('?')[0]);
    if (ruta.endsWith('/')) ruta += 'index.html';

    const archivo = path.join(RAIZ, path.normalize(ruta));
    if (!archivo.startsWith(RAIZ)) {
      respuesta.writeHead(403).end('No permitido');
      return;
    }

    fs.readFile(archivo, (error, contenido) => {
      if (error) {
        respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        respuesta.end('No existe: ' + ruta);
        return;
      }
      respuesta.writeHead(200, {
        'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream',
        // Sin cache: mientras se edita, cada recarga trae lo ultimo.
        'Cache-Control': 'no-store',
      });
      respuesta.end(contenido);
    });
  })
  .listen(PUERTO, '127.0.0.1', () => {
    console.log('Practica de C en http://localhost:' + PUERTO);
  });
