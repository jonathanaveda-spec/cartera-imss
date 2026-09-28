// Servidor local sencillo para probar la app: node serve.js  →  http://localhost:8080/app/
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = __dirname, puerto = process.env.PORT || 8080;
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') { res.writeHead(302, { Location: '/app/' }); return res.end(); }
  // /demo/ = la plataforma con un Firebase SIMULADO (solo pruebas locales; nunca se publica).
  if (p === '/demo') { res.writeHead(302, { Location: '/demo/' }); return res.end(); }
  if (p.startsWith('/demo/')) {
    const resto = p.slice('/demo'.length);
    if (resto === '/sw.js') { res.writeHead(404); return res.end(); } // sin caché sin conexión en pruebas
    if (resto === '/vendor/firebase.js') p = '/tests/fake-firebase.js';
    else if (resto === '/js/nube-config.js') { res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end("export const firebaseConfig = { projectId: 'demo' };"); }
    else p = '/plataforma' + resto;
  }
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(raiz, p);
  if (!f.startsWith(raiz)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(d);
  });
}).listen(puerto, () => console.log('App en http://localhost:' + puerto + '/app/'));
