// Configuración de la nube (Firebase). Mientras `firebaseConfig` sea null, la app funciona solo en modo local.
// Estos valores NO son secretos (son identificadores públicos del proyecto): lo que protege los datos es el
// inicio de sesión y las reglas de Firestore (ver firestore.rules y LEEME_NUBE.md).
export const firebaseConfig = null;
/* Ejemplo de cómo se ve cuando se llena:
export const firebaseConfig = {
  apiKey: '...',
  authDomain: 'mi-proyecto.firebaseapp.com',
  projectId: 'mi-proyecto',
  storageBucket: 'mi-proyecto.firebasestorage.app',
  messagingSenderId: '...',
  appId: '...',
};
*/
