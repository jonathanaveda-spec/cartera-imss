// Alto y posición del área REALMENTE visible de la pantalla, en variables CSS (--alto-visible, --tope-visible).
// En iPhone la capa fija de las ventanas puede quedar más alta que lo que se ve (barras del sistema, teclado),
// y entonces los botones de abajo quedaban escondidos y costaba llegar al final con el dedo.
const vv = globalThis.visualViewport;

function ajustar() {
  const raiz = document.documentElement.style;
  raiz.setProperty('--alto-visible', `${Math.round(vv ? vv.height : window.innerHeight)}px`);
  raiz.setProperty('--tope-visible', `${Math.round(vv ? vv.offsetTop : 0)}px`);
}

ajustar();
if (vv) {
  vv.addEventListener('resize', ajustar);
  vv.addEventListener('scroll', ajustar);
} else {
  window.addEventListener('resize', ajustar);
}
window.addEventListener('orientationchange', () => setTimeout(ajustar, 300));
