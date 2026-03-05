import { useState, useEffect } from 'react';
import {
  collection, doc, onSnapshot, query, orderBy, setDoc, deleteDoc, updateDoc, writeBatch,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from './config';

// Auth hooks
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    getRedirectResult(auth).catch(() => {});
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      return await signInWithPopup(auth, provider);
    } catch (err) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        return signInWithRedirect(auth, provider);
      }
      throw err;
    }
  };
  const logout = () => signOut(auth);

  return { user, loading, login, loginWithGoogle, logout };
}

// Site config hook
export function useSiteConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'siteConfig', 'main'), (snap) => {
      setConfig(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const updateConfig = (data) => setDoc(doc(db, 'siteConfig', 'main'), data, { merge: true });

  return { config, loading, updateConfig };
}

// Sections hook (for landing page)
export function useSections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'sections'), orderBy('order'));
    const unsub = onSnapshot(q, (snap) => {
      setSections(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addSection = (data) => {
    const docRef = doc(collection(db, 'sections'));
    return setDoc(docRef, { ...data, order: sections.length, links: [] });
  };

  const updateSection = (id, data) => updateDoc(doc(db, 'sections', id), data);

  const deleteSection = (id) => deleteDoc(doc(db, 'sections', id));

  const reorderSections = async (orderedIds) => {
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      batch.update(doc(db, 'sections', id), { order: index });
    });
    return batch.commit();
  };

  return { sections, loading, addSection, updateSection, deleteSection, reorderSections };
}

// Portfolio hook (for /actress page)
export function usePortfolio() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'portfolio'), orderBy('order'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addItem = (data) => {
    const docRef = doc(collection(db, 'portfolio'));
    return setDoc(docRef, { ...data, order: items.length });
  };

  const updateItem = (id, data) => updateDoc(doc(db, 'portfolio', id), data);

  const deleteItem = (id) => deleteDoc(doc(db, 'portfolio', id));

  const reorderItems = async (orderedIds) => {
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      batch.update(doc(db, 'portfolio', id), { order: index });
    });
    return batch.commit();
  };

  return { items, loading, addItem, updateItem, deleteItem, reorderItems };
}

// Photo upload helper
export async function uploadPhoto(file) {
  const storageRef = ref(storage, `photos/${Date.now()}-${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deletePhoto(url) {
  const storageRef = ref(storage, url);
  return deleteObject(storageRef);
}
