import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
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
// Long polling skips the slow streaming check on phone networks.
// The local cache shows the last saved page at once on repeat visits.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const storage = getStorage(app);
