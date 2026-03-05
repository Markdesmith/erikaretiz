import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDaRndwrhNLDoLReyizEGcTu6O9mmgRfso",
  authDomain: "erikaretiz.firebaseapp.com",
  projectId: "erikaretiz",
  storageBucket: "erikaretiz.firebasestorage.app",
  messagingSenderId: "435893393139",
  appId: "1:435893393139:web:e7270851aff4af97000986",
  measurementId: "G-8KHVES83TK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
