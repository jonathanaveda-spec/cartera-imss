// Punto de entrada para empaquetar SOLO lo que usa la app del SDK de Firebase en app/vendor/firebase.js
// (así funciona sin internet y sin cargar código desde otros servidores). Uso: npm run build:firebase
export { initializeApp } from 'firebase/app';
export { getAuth, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
export {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, query, orderBy, limit, onSnapshot, getDocsFromServer, writeBatch,
  terminate, clearIndexedDbPersistence,
} from 'firebase/firestore';
