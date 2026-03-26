import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA4W2Pw9YI14XuFRtjiwZjO-8L8xFxJ6Og',
  authDomain: 'kameroun-438de.firebaseapp.com',
  projectId: 'kameroun-438de',
  storageBucket: 'kameroun-438de.firebasestorage.app',
  messagingSenderId: '674467457235',
  appId: '1:674467457235:web:2ca5c815644a00b336cc26',
  measurementId: 'G-9T8XZL6V23',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { collection, doc, getDoc, getDocs, orderBy, query, where };
