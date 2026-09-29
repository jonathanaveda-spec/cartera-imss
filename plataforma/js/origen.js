// ¿La app se abrió desde la versión de Google Play?
// La app de Play abre la web con ?origen=play (y Chrome manda referrer android-app://com.carteraasesor.app).
// Se recuerda en el teléfono, porque después se navega sin el parámetro.
// En esa versión no se muestran precios ni medios de pago: Google Play no permite cobrar por fuera dentro de la app.
const CLAVE = 'cartera:origen';
let play = false;
try {
  if (new URLSearchParams(location.search).get('origen') === 'play' || document.referrer.startsWith('android-app://com.carteraasesor')) {
    localStorage.setItem(CLAVE, 'play');
  }
  play = localStorage.getItem(CLAVE) === 'play';
} catch { /* sin almacenamiento: se trata como web */ }

export const enPlay = () => play;
