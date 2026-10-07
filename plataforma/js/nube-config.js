// Configuración de Firebase de la plataforma (proyecto cartera-asesor).
// Estos valores no son secretos (identifican el proyecto); lo que protege los datos es el inicio de sesión y firestore.rules.
export const firebaseConfig = {
  apiKey: 'AIzaSyBdQ84hWYRDVr89L0sqaf41tJH2I9D3wHY',
  authDomain: 'cartera-asesor.firebaseapp.com',
  projectId: 'cartera-asesor',
  storageBucket: 'cartera-asesor.firebasestorage.app',
  messagingSenderId: '561439338632',
  appId: '1:561439338632:web:2488b5a3e130aed383ef3d',
};

// Clave pública para el aviso diario al celular (Firebase → Configuración del proyecto → Cloud Messaging →
// Certificados push web → «Par de claves»). Es pública. Mientras esté vacía, el aviso diario sale como «muy pronto».
export const vapidKey = '';
