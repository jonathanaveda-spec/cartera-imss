// SDK de Firebase para la plataforma multiusuario (plataforma/vendor/firebase.js). Uso: npm run build:firebase-plataforma
export { initializeApp } from 'firebase/app';
export {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, signOut, reload, deleteUser, useDeviceLanguage,
  reauthenticateWithCredential, EmailAuthProvider,
} from 'firebase/auth';
export {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, query, where, orderBy, limit, onSnapshot, getDoc, getDocs, getDocsFromServer, getCountFromServer,
  setDoc, addDoc, updateDoc, writeBatch, serverTimestamp, terminate, clearIndexedDbPersistence, deleteField,
} from 'firebase/firestore';
// Aviso diario al celular (Firebase Cloud Messaging). El envío lo hace GitHub Actions (tools/enviar-avisos.mjs).
export { getMessaging, getToken, deleteToken, isSupported as avisosSoportados } from 'firebase/messaging';
