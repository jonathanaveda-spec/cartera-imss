document.getElementById('anio').textContent = new Date().getFullYear();
(function () {
  var reducir = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var elementos = document.querySelectorAll('[data-revelar]');
  if (reducir || !('IntersectionObserver' in window)) {
    elementos.forEach(function (el) { el.classList.add('visto'); });
    return;
  }
  // Las secciones aparecen una sola vez, al entrar en pantalla.
  var observando = false;
  var io = new IntersectionObserver(function (entradas) {
    observando = true;
    entradas.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -60px 0px' });
  // Seguro: si el navegador nunca avisa, todo se muestra igual (el contenido nunca queda oculto).
  setTimeout(function () {
    if (observando) return;
    elementos.forEach(function (el) { el.classList.add('visto'); });
    document.querySelector('.escena').classList.add('animar');
  }, 3000);
  elementos.forEach(function (el) { io.observe(el); });

  // El teléfono de muestra se anima al entrar en pantalla (en el celular está más abajo) y sus números cuentan hacia arriba.
  var suave = function (t) { return 1 - Math.pow(1 - t, 4); };
  var contar = function () {
    document.querySelectorAll('[data-contar]').forEach(function (el) {
      var fin = Number(el.dataset.contar), inicio = null;
      var paso = function (ts) {
        if (inicio === null) inicio = ts;
        var t = Math.min(1, (ts - inicio - 350) / 1100);
        el.textContent = t <= 0 ? '0' : String(Math.round(fin * suave(t)));
        if (t < 1) requestAnimationFrame(paso);
      };
      el.textContent = '0';
      requestAnimationFrame(paso);
    });
  };
  var escena = document.querySelector('.escena');
  var ioEscena = new IntersectionObserver(function (entradas) {
    if (!entradas[0].isIntersecting) return;
    escena.classList.add('animar');
    contar();
    ioEscena.disconnect();
  }, { threshold: 0.3 });
  ioEscena.observe(escena);
})();
