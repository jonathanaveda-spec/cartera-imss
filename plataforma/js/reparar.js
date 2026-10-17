// Si la app no logra arrancar (p. ej. archivos a medio actualizar), ofrece repararla SIN borrar los datos de clientes.
(function () {
  function mostrar() {
    if (document.getElementById('reparar')) return;
    var d = document.createElement('div');
    d.id = 'reparar';
    d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;background:#fff8e1;border:1px solid #f3dc8a;color:#5c4400;border-radius:12px;padding:14px;font:16px system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.25)';
    d.innerHTML = '<b>La app no cargó bien.</b> Tus datos no se han borrado. <button id="btn-reparar" style="display:block;width:100%;margin-top:10px;min-height:44px;border:0;border-radius:10px;background:#0b2a6f;color:#fff;font-size:16px;font-weight:600">Reparar</button>';
    document.body.appendChild(d);
    document.getElementById('btn-reparar').onclick = async function () {
      this.textContent = 'Reparando…';
      try {
        var r = await navigator.serviceWorker.getRegistrations();
        for (var i = 0; i < r.length; i++) await r[i].unregister();
        var k = await caches.keys();
        for (var j = 0; j < k.length; j++) await caches.delete(k[j]);
      } catch (e) {}
      location.reload();
    };
  }
  window.addEventListener('error', function () { setTimeout(function () { if (!window.__cartera_ok) mostrar(); }, 300); }, true);
  setTimeout(function () { if (!window.__cartera_ok) mostrar(); }, 5000);
})();
