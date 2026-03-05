# Erika Retiz Portfolio Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a portfolio/linktree site for Erika Retiz with a public landing page, actor portfolio page, and admin CMS — all backed by Firebase.

**Architecture:** React SPA (Vite) with React Router for `/`, `/actress`, and `/admin/*` routes. Firebase Auth for admin login, Firestore for all content (sections, links, portfolio), Firebase Storage for photo uploads, Firebase Hosting for deployment. All public content is fetched from Firestore at runtime so Erika can edit everything from the admin panel.

**Tech Stack:** React 18, Vite, React Router v6, Firebase (Auth, Firestore, Storage, Hosting), @dnd-kit (drag-and-drop), react-icons, Google Fonts (Playfair Display + Lato)

---

## Task 1: Project Scaffolding & Firebase Setup

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`
- Create: `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`
- Create: `src/firebase/config.js`

**Step 1: Create Vite React project**

```bash
cd "/Users/markdesmith/Documents/App Development/erikaretiz"
npm create vite@latest . -- --template react
```

If prompted about existing files, choose to overwrite (the only files are assets and docs).

**Step 2: Install dependencies**

```bash
npm install
npm install react-router-dom firebase @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-icons
```

**Step 3: Move assets to public folder**

```bash
mkdir -p public/assets/images/photos
cp assets/images/bg.jpg public/assets/images/bg.jpg
cp assets/images/photos/* public/assets/images/photos/
```

**Step 4: ⚠️ USER ACTION — Firebase Login & Project Setup**

The user needs to log into the correct Firebase account for the `erikaretiz` project:

```bash
firebase logout
firebase login
# User logs into the account that owns the erikaretiz project
firebase use erikaretiz
```

If the project doesn't exist yet:
```bash
firebase projects:create erikaretiz --display-name "Erika Retiz"
firebase use erikaretiz
```

**Step 5: Initialize Firebase services**

```bash
firebase init firestore hosting storage
```

Choose:
- Firestore rules: `firestore.rules`
- Firestore indexes: `firestore.indexes.json`
- Hosting public dir: `dist`
- Single-page app: Yes
- Storage rules: `storage.rules`

**Step 6: Enable Firebase Auth**

In the Firebase Console (https://console.firebase.google.com), navigate to the erikaretiz project:
1. Go to Authentication → Sign-in method
2. Enable Email/Password provider
3. Go to Authentication → Users → Add user
4. Add Erika's admin email and a password

**Step 7: Get Firebase config**

In Firebase Console → Project Settings → General → Your apps → Add app (Web):
1. Register app name: "erikaretiz-web"
2. Copy the firebaseConfig object

Create `src/firebase/config.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // PASTE CONFIG FROM FIREBASE CONSOLE
  apiKey: "",
  authDomain: "",
  projectId: "erikaretiz",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

**Step 8: Write Firestore security rules**

`firestore.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for all content
    match /{document=**} {
      allow read: if true;
    }
    // Admin write only for authenticated users
    match /siteConfig/{doc} {
      allow write: if request.auth != null;
    }
    match /sections/{doc} {
      allow write: if request.auth != null;
    }
    match /portfolio/{doc} {
      allow write: if request.auth != null;
    }
  }
}
```

**Step 9: Write Storage security rules**

`storage.rules`:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Step 10: Set up vite.config.js**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

**Step 11: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server on http://localhost:5173

**Step 12: Commit**

```bash
git init
echo "node_modules\ndist\n.firebase\n*.log\n.DS_Store" > .gitignore
git add -A
git commit -m "feat: scaffold Vite + React project with Firebase config"
```

---

## Task 2: Firebase Hooks & Data Layer

**Files:**
- Create: `src/firebase/hooks.js`
- Create: `src/firebase/seed.js` (one-time seed script)

**Step 1: Create Firebase hooks**

`src/firebase/hooks.js`:
```javascript
import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
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

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return { user, loading, login, logout };
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
```

**Step 2: Create seed script for initial data**

`src/firebase/seed.js`:
```javascript
import { db } from './config';
import { doc, setDoc, collection } from 'firebase/firestore';

export async function seedDatabase() {
  // Site config
  await setDoc(doc(db, 'siteConfig', 'main'), {
    title: 'Erika Retiz',
    subtitle: 'Artist & Holistic Therapist',
    tagline: 'In Service, Love and Gratitude',
    bgImage: '/assets/images/bg.jpg',
  });

  // Main links section
  const mainRef = doc(collection(db, 'sections'));
  await setDoc(mainRef, {
    name: '',
    order: 0,
    links: [
      { label: 'ACTOR PORTFOLIO', url: '/actress', icon: '🎭', order: 0, isInternal: true },
      { label: 'PAXKAN', url: 'https://paxkan.com/store/', icon: '🌿', order: 1 },
      { label: 'MY ART SHOP- BOHEMIANS MINDS', url: 'https://www.bohemiansminds.com/tefavento/', icon: '🎨', order: 2 },
      { label: 'HABITAT TEATRO', url: 'https://www.instagram.com/habitat_teatro/', icon: '🎭', order: 3 },
      { label: 'INSTAGRAM', url: 'https://www.instagram.com/eriretiz', icon: '📸', order: 4 },
      { label: 'INSIDE-Performance', url: 'https://www.youtube.com/watch?v=7R00ipZlj3A', icon: '🎬', order: 5 },
      { label: 'Worthy: A Radical Self-Love Journal', url: '#', icon: '💜', order: 6 },
    ],
  });

  // Supporting section
  const supportRef = doc(collection(db, 'sections'));
  await setDoc(supportRef, {
    name: 'Supporting:',
    order: 1,
    links: [
      { label: 'Wixarika Art by Miguel Carrillo', url: '#', icon: '', order: 0 },
      { label: 'Support Paxkan', url: '#', icon: '', order: 1 },
    ],
  });

  // Book Me section
  const bookRef = doc(collection(db, 'sections'));
  await setDoc(bookRef, {
    name: '',
    order: 2,
    links: [
      { label: 'BOOK ME', url: '#', icon: '', order: 0, isBookMe: true },
    ],
  });

  // Portfolio - Demo Reel
  const reelRef = doc(collection(db, 'portfolio'));
  await setDoc(reelRef, {
    sectionName: 'Demo Reel',
    order: 0,
    type: 'video',
    content: 'https://www.youtube.com/embed/h8F48CARa-I?si=BJiYYHSQLdtcKcch',
    visible: true,
  });

  // Portfolio - Contact
  const contactRef = doc(collection(db, 'portfolio'));
  await setDoc(contactRef, {
    sectionName: 'Contact',
    order: 1,
    type: 'contact',
    content: 'actress_erikaretiz@outlook.com',
    visible: true,
  });

  // Portfolio - Photos
  const photosRef = doc(collection(db, 'portfolio'));
  await setDoc(photosRef, {
    sectionName: 'Headshots',
    order: 2,
    type: 'photos',
    content: JSON.stringify([
      '/assets/images/photos/headshot_Eri-scaled.jpg',
      '/assets/images/photos/WES_4620-2048x1365.jpg',
      '/assets/images/photos/WES_4804-2048x1365.jpg',
      '/assets/images/photos/WES_4969-2048x1365.jpg',
      '/assets/images/photos/WES_4913-1365x2048.jpg',
      '/assets/images/photos/IMG_4568-scaled.jpeg',
      '/assets/images/photos/IMG_4579-scaled.jpeg',
      '/assets/images/photos/15012023-IMG_5169-scaled.jpg',
      '/assets/images/photos/15012023-IMG_5173-scaled.jpeg',
      '/assets/images/photos/2C950A74-1154-4D40-BD57-D6CA64965A29-1365x2048.jpeg',
      '/assets/images/photos/72E0C1B7-55A0-4AFF-BBE0-24ADD4FBC3DC.jpeg',
      '/assets/images/photos/891A37FB-7736-4813-9E58-6E178D946561-1365x2048.jpeg',
    ]),
    visible: true,
  });

  console.log('Database seeded!');
}
```

**Step 3: Commit**

```bash
git add src/firebase/hooks.js src/firebase/seed.js
git commit -m "feat: add Firebase hooks and seed data"
```

---

## Task 3: App Router & Shared Components

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/main.jsx`
- Create: `src/components/shared/ProtectedRoute.jsx`
- Create: `src/components/shared/Loading.jsx`

**Step 1: Set up main.jsx with router**

`src/main.jsx`:
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

**Step 2: Set up App.jsx with routes**

`src/App.jsx`:
```jsx
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Actress from './pages/Actress';
import AdminLogin from './pages/AdminLogin';
import AdminLinks from './pages/AdminLinks';
import AdminPortfolio from './pages/AdminPortfolio';
import ProtectedRoute from './components/shared/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/actress" element={<Actress />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route
        path="/admin/links"
        element={
          <ProtectedRoute>
            <AdminLinks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/portfolio"
        element={
          <ProtectedRoute>
            <AdminPortfolio />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

**Step 3: Create ProtectedRoute**

`src/components/shared/ProtectedRoute.jsx`:
```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../firebase/hooks';
import Loading from './Loading';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/admin" replace />;
  return children;
}
```

**Step 4: Create Loading component**

`src/components/shared/Loading.jsx`:
```jsx
export default function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
    </div>
  );
}
```

**Step 5: Create placeholder pages**

Create these placeholder files so the app compiles:

`src/pages/Home.jsx`:
```jsx
export default function Home() {
  return <div>Home - TODO</div>;
}
```

`src/pages/Actress.jsx`:
```jsx
export default function Actress() {
  return <div>Actress - TODO</div>;
}
```

`src/pages/AdminLogin.jsx`:
```jsx
export default function AdminLogin() {
  return <div>Admin Login - TODO</div>;
}
```

`src/pages/AdminLinks.jsx`:
```jsx
export default function AdminLinks() {
  return <div>Admin Links - TODO</div>;
}
```

`src/pages/AdminPortfolio.jsx`:
```jsx
export default function AdminPortfolio() {
  return <div>Admin Portfolio - TODO</div>;
}
```

**Step 6: Verify app compiles and routes work**

```bash
npm run dev
# Visit /, /actress, /admin in browser
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add router, protected routes, and page placeholders"
```

---

## Task 4: Global Styles & Fonts

**Files:**
- Modify: `src/index.css`
- Modify: `index.html`

**Step 1: Add Google Fonts to index.html**

In `index.html`, add inside `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
<title>Erika Retiz</title>
```

**Step 2: Write global CSS with theme variables**

`src/index.css`:
```css
:root {
  --purple-dark: #5B4A7A;
  --purple-main: #7B6B9E;
  --purple-light: #A594C6;
  --purple-faint: #E8E0F0;
  --white: #FFFFFF;
  --off-white: #F5F3F7;
  --text-dark: #2D2440;
  --text-muted: #8A7FA0;
  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-border: rgba(255, 255, 255, 0.4);
  --shadow: 0 4px 20px rgba(91, 74, 122, 0.12);
  --shadow-hover: 0 8px 30px rgba(91, 74, 122, 0.2);
  --radius: 16px;
  --radius-sm: 10px;
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Lato', -apple-system, sans-serif;
  --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  color: var(--text-dark);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

a {
  text-decoration: none;
  color: inherit;
}

img {
  max-width: 100%;
  display: block;
}

button {
  cursor: pointer;
  border: none;
  background: none;
  font-family: inherit;
}

/* Loading */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--off-white);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--purple-faint);
  border-top-color: var(--purple-main);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
}
```

**Step 3: Commit**

```bash
git add src/index.css index.html
git commit -m "feat: add global styles, CSS variables, and Google Fonts"
```

---

## Task 5: Landing Page (Home)

**Files:**
- Modify: `src/pages/Home.jsx`
- Create: `src/pages/Home.css`
- Create: `src/components/Landing/LinkButton.jsx`

**Step 1: Create LinkButton component**

`src/components/Landing/LinkButton.jsx`:
```jsx
import { Link } from 'react-router-dom';

export default function LinkButton({ label, url, icon, isBookMe, isInternal }) {
  const className = `link-button ${isBookMe ? 'link-button--book' : ''}`;

  if (isInternal) {
    return (
      <Link to={url} className={className}>
        {icon && <span className="link-button__icon">{icon}</span>}
        <span className="link-button__label">{label}</span>
      </Link>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {icon && <span className="link-button__icon">{icon}</span>}
      <span className="link-button__label">{label}</span>
    </a>
  );
}
```

**Step 2: Build Home page**

`src/pages/Home.jsx`:
```jsx
import { useSiteConfig, useSections } from '../firebase/hooks';
import LinkButton from '../components/Landing/LinkButton';
import Loading from '../components/shared/Loading';
import './Home.css';

export default function Home() {
  const { config, loading: configLoading } = useSiteConfig();
  const { sections, loading: sectionsLoading } = useSections();

  if (configLoading || sectionsLoading) return <Loading />;

  return (
    <div className="home" style={{ backgroundImage: `url(${config?.bgImage || '/assets/images/bg.jpg'})` }}>
      <div className="home__overlay">
        <div className="home__content">
          <h1 className="home__title fade-in-up">{config?.title || 'Erika Retiz'}</h1>
          <p className="home__subtitle fade-in-up" style={{ animationDelay: '0.1s' }}>
            {config?.subtitle || 'Artist & Holistic Therapist'}
          </p>

          <div className="home__links">
            {sections.map((section, si) => {
              const visibleLinks = section.links?.filter(Boolean) || [];
              if (visibleLinks.length === 0) return null;

              return (
                <div key={section.id} className="home__section fade-in-up" style={{ animationDelay: `${0.2 + si * 0.1}s` }}>
                  {section.name && <h2 className="home__section-title">{section.name}</h2>}
                  {visibleLinks
                    .sort((a, b) => a.order - b.order)
                    .map((link, li) => (
                      <LinkButton key={li} {...link} />
                    ))}
                </div>
              );
            })}
          </div>

          {config?.tagline && (
            <p className="home__tagline fade-in-up" style={{ animationDelay: '0.6s' }}>
              {config.tagline}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Style the landing page**

`src/pages/Home.css`:
```css
.home {
  min-height: 100vh;
  background-size: cover;
  background-position: right center;
  background-attachment: fixed;
  background-repeat: no-repeat;
  background-color: #e8e4ec;
}

.home__overlay {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 60px 20px;
}

.home__content {
  max-width: 520px;
  width: 100%;
  text-align: center;
  padding-bottom: 60px;
}

.home__title {
  font-family: var(--font-display);
  font-size: clamp(3rem, 8vw, 5.5rem);
  color: var(--purple-dark);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 8px;
  text-shadow: 0 2px 10px rgba(255,255,255,0.5);
}

.home__subtitle {
  font-family: var(--font-display);
  font-style: italic;
  font-size: clamp(1rem, 2.5vw, 1.3rem);
  color: var(--text-muted);
  margin-bottom: 40px;
  font-weight: 400;
}

.home__links {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.home__section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.home__section-title {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.8rem;
  color: var(--purple-dark);
  font-weight: 400;
  margin-top: 10px;
}

/* Link buttons */
.link-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  max-width: 440px;
  padding: 16px 28px;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  color: var(--purple-dark);
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: all var(--transition);
}

.link-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
  background: rgba(255, 255, 255, 0.95);
}

.link-button--book {
  background: var(--purple-dark);
  color: var(--white);
  border-color: var(--purple-dark);
  font-size: 1.2rem;
  padding: 18px 36px;
  letter-spacing: 0.1em;
}

.link-button--book:hover {
  background: var(--purple-main);
  border-color: var(--purple-main);
}

.link-button__icon {
  font-size: 1.2em;
}

.home__tagline {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1rem;
  color: var(--text-muted);
  margin-top: 24px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .home {
    background-position: right bottom;
    background-attachment: scroll;
  }

  .home__overlay {
    padding: 40px 16px;
  }

  .link-button {
    padding: 14px 20px;
    font-size: 0.9rem;
  }
}
```

**Step 4: Verify landing page looks correct in browser**

```bash
npm run dev
# Visit http://localhost:5173
```

Note: Data won't load yet until Firebase is connected. The page should render with fallback defaults.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: build landing page with link sections and glass-morphism buttons"
```

---

## Task 6: Actress Portfolio Page

**Files:**
- Modify: `src/pages/Actress.jsx`
- Create: `src/pages/Actress.css`
- Create: `src/components/Portfolio/DemoReel.jsx`
- Create: `src/components/Portfolio/PhotoGallery.jsx`
- Create: `src/components/Portfolio/PortfolioSection.jsx`

**Step 1: Create DemoReel component**

`src/components/Portfolio/DemoReel.jsx`:
```jsx
export default function DemoReel({ url }) {
  return (
    <div className="demo-reel">
      <div className="demo-reel__wrapper">
        <iframe
          src={url}
          title="Demo Reel"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
}
```

**Step 2: Create PhotoGallery component**

`src/components/Portfolio/PhotoGallery.jsx`:
```jsx
import { useState } from 'react';

export default function PhotoGallery({ photos }) {
  const [selected, setSelected] = useState(null);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div className="photo-gallery">
        {photos.map((photo, i) => (
          <div key={i} className="photo-gallery__item" onClick={() => setSelected(photo)}>
            <img src={photo} alt={`Portfolio ${i + 1}`} loading="lazy" />
          </div>
        ))}
      </div>

      {selected && (
        <div className="photo-lightbox" onClick={() => setSelected(null)}>
          <img src={selected} alt="Full size" />
          <button className="photo-lightbox__close" onClick={() => setSelected(null)}>×</button>
        </div>
      )}
    </>
  );
}
```

**Step 3: Create PortfolioSection component**

`src/components/Portfolio/PortfolioSection.jsx`:
```jsx
import DemoReel from './DemoReel';
import PhotoGallery from './PhotoGallery';

export default function PortfolioSection({ item }) {
  if (!item.visible) return null;

  const renderContent = () => {
    switch (item.type) {
      case 'video':
        return <DemoReel url={item.content} />;
      case 'photos':
        return <PhotoGallery photos={JSON.parse(item.content || '[]')} />;
      case 'contact':
        return (
          <p className="portfolio-contact">
            Contact: <a href={`mailto:${item.content}`}>{item.content}</a>
          </p>
        );
      case 'text':
        return <div className="portfolio-text" dangerouslySetInnerHTML={{ __html: item.content }} />;
      default:
        return <p>{item.content}</p>;
    }
  };

  return (
    <div className="portfolio-section">
      {item.sectionName && <h2 className="portfolio-section__title">{item.sectionName}</h2>}
      {renderContent()}
    </div>
  );
}
```

**Step 4: Build Actress page**

`src/pages/Actress.jsx`:
```jsx
import { Link } from 'react-router-dom';
import { usePortfolio, useSiteConfig } from '../firebase/hooks';
import PortfolioSection from '../components/Portfolio/PortfolioSection';
import Loading from '../components/shared/Loading';
import './Actress.css';

export default function Actress() {
  const { config } = useSiteConfig();
  const { items, loading } = usePortfolio();

  if (loading) return <Loading />;

  return (
    <div className="actress">
      <div className="actress__header">
        <Link to="/" className="actress__back">← Back</Link>
        <h1 className="actress__title">{config?.title || 'Erika Retiz'}</h1>
        <h2 className="actress__page-title">ACTOR PORTFOLIO</h2>
      </div>

      <div className="actress__content">
        {items.map((item) => (
          <PortfolioSection key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
```

**Step 5: Style the actress page**

`src/pages/Actress.css`:
```css
.actress {
  min-height: 100vh;
  background: var(--off-white);
}

.actress__header {
  text-align: center;
  padding: 40px 20px 30px;
  position: relative;
}

.actress__back {
  position: absolute;
  left: 20px;
  top: 40px;
  font-size: 0.95rem;
  color: var(--purple-main);
  transition: color var(--transition);
}

.actress__back:hover {
  color: var(--purple-dark);
}

.actress__title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, 4rem);
  color: var(--purple-dark);
  font-weight: 700;
  margin-bottom: 4px;
}

.actress__page-title {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-dark);
  letter-spacing: 0.1em;
}

.actress__content {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 20px 60px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

/* Portfolio sections */
.portfolio-section__title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  color: var(--purple-dark);
  margin-bottom: 16px;
  font-weight: 600;
}

.portfolio-contact {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--text-dark);
}

.portfolio-contact a {
  color: var(--purple-main);
  text-decoration: underline;
}

/* Demo reel */
.demo-reel__wrapper {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.demo-reel__wrapper iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Photo gallery */
.photo-gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.photo-gallery__item {
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 1;
  transition: transform var(--transition);
}

.photo-gallery__item:hover {
  transform: scale(1.02);
}

.photo-gallery__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Lightbox */
.photo-lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.photo-lightbox img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}

.photo-lightbox__close {
  position: absolute;
  top: 20px;
  right: 20px;
  color: white;
  font-size: 2rem;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .photo-gallery {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .photo-gallery {
    grid-template-columns: 1fr;
  }
}
```

**Step 6: Verify actress page renders**

```bash
npm run dev
# Visit http://localhost:5173/actress
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: build actress portfolio page with demo reel, photo gallery, and lightbox"
```

---

## Task 7: Admin Login Page

**Files:**
- Modify: `src/pages/AdminLogin.jsx`
- Create: `src/pages/AdminLogin.css`

**Step 1: Build AdminLogin page**

`src/pages/AdminLogin.jsx`:
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../firebase/hooks';
import './AdminLogin.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/admin/links', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/admin/links');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="admin-login">
      <form className="admin-login__form" onSubmit={handleSubmit}>
        <h1 className="admin-login__title">Admin</h1>
        {error && <p className="admin-login__error">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}
```

**Step 2: Style AdminLogin**

`src/pages/AdminLogin.css`:
```css
.admin-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--off-white);
  padding: 20px;
}

.admin-login__form {
  background: var(--white);
  padding: 48px 40px;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-login__title {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--purple-dark);
  text-align: center;
  margin-bottom: 8px;
}

.admin-login__error {
  color: #d32f2f;
  font-size: 0.9rem;
  text-align: center;
  background: #ffeaea;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
}

.admin-login__form input {
  padding: 14px 16px;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-family: var(--font-body);
  transition: border-color var(--transition);
}

.admin-login__form input:focus {
  outline: none;
  border-color: var(--purple-main);
}

.admin-login__form button {
  padding: 14px;
  background: var(--purple-dark);
  color: var(--white);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: background var(--transition);
}

.admin-login__form button:hover {
  background: var(--purple-main);
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: build admin login page"
```

---

## Task 8: Admin Links Page (Landing Page CMS)

**Files:**
- Modify: `src/pages/AdminLinks.jsx`
- Create: `src/pages/AdminLinks.css`
- Create: `src/components/Admin/AdminNav.jsx`
- Create: `src/components/Admin/SectionEditor.jsx`
- Create: `src/components/Admin/LinkEditor.jsx`
- Create: `src/components/Admin/SortableItem.jsx`

**Step 1: Create AdminNav**

`src/components/Admin/AdminNav.jsx`:
```jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../firebase/hooks';
import './Admin.css';

export default function AdminNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  return (
    <nav className="admin-nav">
      <span className="admin-nav__brand">Erika Admin</span>
      <div className="admin-nav__links">
        <NavLink to="/admin/links" className={({ isActive }) => isActive ? 'active' : ''}>Links</NavLink>
        <NavLink to="/admin/portfolio" className={({ isActive }) => isActive ? 'active' : ''}>Portfolio</NavLink>
        <a href="/" target="_blank" rel="noopener">View Site</a>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
```

**Step 2: Create SortableItem wrapper**

`src/components/Admin/SortableItem.jsx`:
```jsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </div>
  );
}
```

**Step 3: Create LinkEditor**

`src/components/Admin/LinkEditor.jsx`:
```jsx
import { useState } from 'react';

export default function LinkEditor({ link, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(link);

  const handleSave = () => {
    onSave(form);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="link-editor link-editor--editing">
        <input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="Label"
        />
        <input
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          placeholder="URL"
        />
        <input
          value={form.icon || ''}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
          placeholder="Emoji icon"
          style={{ width: '80px' }}
        />
        <label className="link-editor__checkbox">
          <input
            type="checkbox"
            checked={form.isInternal || false}
            onChange={(e) => setForm({ ...form, isInternal: e.target.checked })}
          />
          Internal link
        </label>
        <label className="link-editor__checkbox">
          <input
            type="checkbox"
            checked={form.isBookMe || false}
            onChange={(e) => setForm({ ...form, isBookMe: e.target.checked })}
          />
          Book Me style
        </label>
        <div className="link-editor__actions">
          <button className="btn btn--save" onClick={handleSave}>Save</button>
          <button className="btn btn--cancel" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="link-editor">
      <span className="link-editor__icon">{link.icon}</span>
      <span className="link-editor__label">{link.label}</span>
      <div className="link-editor__actions">
        <button className="btn btn--sm" onClick={() => setEditing(true)}>Edit</button>
        <button className="btn btn--sm btn--danger" onClick={onDelete}>×</button>
      </div>
    </div>
  );
}
```

**Step 4: Create SectionEditor**

`src/components/Admin/SectionEditor.jsx`:
```jsx
import { useState } from 'react';
import LinkEditor from './LinkEditor';

export default function SectionEditor({ section, onUpdate, onDelete, dragHandleProps }) {
  const [sectionName, setSectionName] = useState(section.name || '');
  const [editingName, setEditingName] = useState(false);

  const updateLink = (index, updatedLink) => {
    const links = [...(section.links || [])];
    links[index] = updatedLink;
    onUpdate({ links });
  };

  const deleteLink = (index) => {
    const links = (section.links || []).filter((_, i) => i !== index);
    onUpdate({ links });
  };

  const addLink = () => {
    const links = [...(section.links || []), { label: 'New Link', url: '#', icon: '', order: section.links?.length || 0 }];
    onUpdate({ links });
  };

  const saveName = () => {
    onUpdate({ name: sectionName });
    setEditingName(false);
  };

  return (
    <div className="section-editor">
      <div className="section-editor__header">
        <span className="section-editor__drag" {...dragHandleProps}>⠿</span>
        {editingName ? (
          <div className="section-editor__name-edit">
            <input
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="Section name (empty = no heading)"
            />
            <button className="btn btn--sm" onClick={saveName}>✓</button>
          </div>
        ) : (
          <h3 className="section-editor__name" onClick={() => setEditingName(true)}>
            {section.name || '(No heading)'}
          </h3>
        )}
        <button className="btn btn--sm btn--danger" onClick={onDelete}>Delete Section</button>
      </div>

      <div className="section-editor__links">
        {(section.links || [])
          .sort((a, b) => a.order - b.order)
          .map((link, i) => (
            <LinkEditor
              key={i}
              link={link}
              onSave={(updated) => updateLink(i, updated)}
              onDelete={() => deleteLink(i)}
            />
          ))}
      </div>

      <button className="btn btn--add" onClick={addLink}>+ Add Link</button>
    </div>
  );
}
```

**Step 5: Build AdminLinks page**

`src/pages/AdminLinks.jsx`:
```jsx
import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSiteConfig, useSections } from '../firebase/hooks';
import AdminNav from '../components/Admin/AdminNav';
import SectionEditor from '../components/Admin/SectionEditor';
import SortableItem from '../components/Admin/SortableItem';
import Loading from '../components/shared/Loading';
import './AdminLinks.css';

export default function AdminLinks() {
  const { config, loading: configLoading, updateConfig } = useSiteConfig();
  const { sections, loading: sectionsLoading, addSection, updateSection, deleteSection, reorderSections } = useSections();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [configEditing, setConfigEditing] = useState(false);

  if (configLoading || sectionsLoading) return <Loading />;

  const startEditConfig = () => {
    setTitle(config?.title || '');
    setSubtitle(config?.subtitle || '');
    setTagline(config?.tagline || '');
    setConfigEditing(true);
  };

  const saveConfig = async () => {
    await updateConfig({ title, subtitle, tagline });
    setConfigEditing(false);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(sections, oldIndex, newIndex);
      reorderSections(newOrder.map((s) => s.id));
    }
  };

  return (
    <div className="admin-page">
      <AdminNav />
      <div className="admin-page__content">
        <h1 className="admin-page__title">Landing Page Links</h1>

        {/* Site Config */}
        <div className="admin-card">
          <h2>Site Settings</h2>
          {configEditing ? (
            <div className="admin-card__form">
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
              <label>Subtitle</label>
              <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              <label>Tagline</label>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} />
              <div className="admin-card__actions">
                <button className="btn btn--save" onClick={saveConfig}>Save</button>
                <button className="btn btn--cancel" onClick={() => setConfigEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="admin-card__preview">
              <p><strong>Title:</strong> {config?.title}</p>
              <p><strong>Subtitle:</strong> {config?.subtitle}</p>
              <p><strong>Tagline:</strong> {config?.tagline}</p>
              <button className="btn" onClick={startEditConfig}>Edit</button>
            </div>
          )}
        </div>

        {/* Sections */}
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((section) => (
              <SortableItem key={section.id} id={section.id}>
                {({ dragHandleProps }) => (
                  <SectionEditor
                    section={section}
                    onUpdate={(data) => updateSection(section.id, data)}
                    onDelete={() => {
                      if (window.confirm('Delete this section and all its links?')) {
                        deleteSection(section.id);
                      }
                    }}
                    dragHandleProps={dragHandleProps}
                  />
                )}
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>

        <button className="btn btn--primary btn--full" onClick={() => addSection({ name: '', links: [] })}>
          + Add Section
        </button>
      </div>
    </div>
  );
}
```

**Step 6: Style admin pages**

`src/components/Admin/Admin.css`:
```css
.admin-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--white);
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.admin-nav__brand {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--purple-dark);
  font-weight: 700;
}

.admin-nav__links {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-nav__links a, .admin-nav__links button {
  font-size: 0.9rem;
  color: var(--text-muted);
  transition: color var(--transition);
  padding: 6px 12px;
  border-radius: 6px;
}

.admin-nav__links a:hover, .admin-nav__links button:hover {
  color: var(--purple-dark);
}

.admin-nav__links a.active {
  color: var(--purple-dark);
  background: var(--purple-faint);
}
```

`src/pages/AdminLinks.css`:
```css
.admin-page {
  min-height: 100vh;
  background: var(--off-white);
}

.admin-page__content {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 20px 60px;
}

.admin-page__title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  color: var(--purple-dark);
  margin-bottom: 24px;
}

/* Admin card */
.admin-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.admin-card h2 {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--purple-dark);
  margin-bottom: 16px;
}

.admin-card__form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-card__form label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.admin-card__form input, .admin-card__form textarea {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-family: var(--font-body);
}

.admin-card__form input:focus, .admin-card__form textarea:focus {
  outline: none;
  border-color: var(--purple-main);
}

.admin-card__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.admin-card__preview p {
  margin-bottom: 6px;
  font-size: 0.95rem;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  transition: all var(--transition);
  background: var(--purple-faint);
  color: var(--purple-dark);
}

.btn:hover {
  background: var(--purple-light);
  color: var(--white);
}

.btn--sm {
  padding: 4px 10px;
  font-size: 0.8rem;
}

.btn--save {
  background: var(--purple-dark);
  color: var(--white);
}

.btn--save:hover {
  background: var(--purple-main);
}

.btn--cancel {
  background: #eee;
  color: #666;
}

.btn--cancel:hover {
  background: #ddd;
}

.btn--danger {
  background: #fee;
  color: #d32f2f;
}

.btn--danger:hover {
  background: #d32f2f;
  color: white;
}

.btn--add {
  padding: 8px 16px;
  color: var(--purple-main);
  font-weight: 600;
  font-size: 0.9rem;
}

.btn--add:hover {
  color: var(--purple-dark);
}

.btn--primary {
  background: var(--purple-dark);
  color: var(--white);
  padding: 14px;
  font-size: 1rem;
}

.btn--primary:hover {
  background: var(--purple-main);
}

.btn--full {
  width: 100%;
  margin-top: 16px;
}

/* Section editor */
.section-editor {
  background: var(--white);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.section-editor__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-editor__drag {
  cursor: grab;
  font-size: 1.2rem;
  color: var(--text-muted);
  user-select: none;
}

.section-editor__name {
  flex: 1;
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--text-dark);
  cursor: pointer;
}

.section-editor__name:hover {
  color: var(--purple-main);
}

.section-editor__name-edit {
  flex: 1;
  display: flex;
  gap: 8px;
}

.section-editor__name-edit input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}

.section-editor__links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

/* Link editor */
.link-editor {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--off-white);
  border-radius: var(--radius-sm);
}

.link-editor--editing {
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px;
}

.link-editor--editing input {
  flex: 1;
  min-width: 120px;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

.link-editor__icon {
  font-size: 1.1rem;
}

.link-editor__label {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 500;
}

.link-editor__actions {
  display: flex;
  gap: 6px;
}

.link-editor__checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-muted);
}
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: build admin links page with drag-and-drop section/link management"
```

---

## Task 9: Admin Portfolio Page (Actress CMS)

**Files:**
- Modify: `src/pages/AdminPortfolio.jsx`
- Create: `src/pages/AdminPortfolio.css`
- Create: `src/components/Admin/PortfolioItemEditor.jsx`

**Step 1: Create PortfolioItemEditor**

`src/components/Admin/PortfolioItemEditor.jsx`:
```jsx
import { useState } from 'react';
import { uploadPhoto } from '../../firebase/hooks';

export default function PortfolioItemEditor({ item, onUpdate, onDelete, dragHandleProps }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(item);
  const [uploading, setUploading] = useState(false);

  const save = () => {
    onUpdate(form);
    setEditing(false);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const currentPhotos = JSON.parse(form.content || '[]');
      const urls = await Promise.all(files.map((f) => uploadPhoto(f)));
      const updated = { ...form, content: JSON.stringify([...currentPhotos, ...urls]) };
      setForm(updated);
      onUpdate(updated);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
  };

  const removePhoto = (index) => {
    const photos = JSON.parse(form.content || '[]');
    photos.splice(index, 1);
    const updated = { ...form, content: JSON.stringify(photos) };
    setForm(updated);
    onUpdate(updated);
  };

  return (
    <div className="portfolio-editor">
      <div className="portfolio-editor__header">
        <span className="section-editor__drag" {...dragHandleProps}>⠿</span>
        <h3>{item.sectionName || 'Untitled'}</h3>
        <span className="portfolio-editor__type">{item.type}</span>
        <label className="portfolio-editor__toggle">
          <input
            type="checkbox"
            checked={item.visible}
            onChange={(e) => onUpdate({ visible: e.target.checked })}
          />
          Visible
        </label>
        <button className="btn btn--sm" onClick={() => setEditing(!editing)}>
          {editing ? 'Close' : 'Edit'}
        </button>
        <button className="btn btn--sm btn--danger" onClick={() => {
          if (window.confirm('Delete this portfolio section?')) onDelete();
        }}>×</button>
      </div>

      {editing && (
        <div className="portfolio-editor__body">
          <label>Section Name</label>
          <input
            value={form.sectionName}
            onChange={(e) => setForm({ ...form, sectionName: e.target.value })}
          />

          <label>Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="video">Video Embed</option>
            <option value="photos">Photo Gallery</option>
            <option value="contact">Contact Info</option>
            <option value="text">Text/HTML</option>
          </select>

          {form.type === 'photos' ? (
            <div className="portfolio-editor__photos">
              <div className="portfolio-editor__photo-grid">
                {JSON.parse(form.content || '[]').map((url, i) => (
                  <div key={i} className="portfolio-editor__photo-thumb">
                    <img src={url} alt="" />
                    <button onClick={() => removePhoto(i)}>×</button>
                  </div>
                ))}
              </div>
              <label className="btn btn--add">
                {uploading ? 'Uploading...' : '+ Upload Photos'}
                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} hidden />
              </label>
            </div>
          ) : form.type === 'text' ? (
            <>
              <label>Content (HTML supported)</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={6}
              />
            </>
          ) : (
            <>
              <label>{form.type === 'video' ? 'Embed URL' : 'Content'}</label>
              <input
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </>
          )}

          <button className="btn btn--save" onClick={save}>Save Changes</button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Build AdminPortfolio page**

`src/pages/AdminPortfolio.jsx`:
```jsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { usePortfolio } from '../firebase/hooks';
import AdminNav from '../components/Admin/AdminNav';
import PortfolioItemEditor from '../components/Admin/PortfolioItemEditor';
import SortableItem from '../components/Admin/SortableItem';
import Loading from '../components/shared/Loading';
import './AdminPortfolio.css';

export default function AdminPortfolio() {
  const { items, loading, addItem, updateItem, deleteItem, reorderItems } = usePortfolio();

  if (loading) return <Loading />;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newOrder = arrayMove(items, oldIndex, newIndex);
      reorderItems(newOrder.map((i) => i.id));
    }
  };

  const handleAdd = (type) => {
    addItem({
      sectionName: 'New Section',
      type,
      content: type === 'photos' ? '[]' : '',
      visible: true,
    });
  };

  return (
    <div className="admin-page">
      <AdminNav />
      <div className="admin-page__content">
        <h1 className="admin-page__title">Actor Portfolio</h1>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <SortableItem key={item.id} id={item.id}>
                {({ dragHandleProps }) => (
                  <PortfolioItemEditor
                    item={item}
                    onUpdate={(data) => updateItem(item.id, data)}
                    onDelete={() => deleteItem(item.id)}
                    dragHandleProps={dragHandleProps}
                  />
                )}
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>

        <div className="admin-add-buttons">
          <button className="btn btn--primary" onClick={() => handleAdd('video')}>+ Video</button>
          <button className="btn btn--primary" onClick={() => handleAdd('photos')}>+ Photos</button>
          <button className="btn btn--primary" onClick={() => handleAdd('contact')}>+ Contact</button>
          <button className="btn btn--primary" onClick={() => handleAdd('text')}>+ Text</button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Style admin portfolio**

`src/pages/AdminPortfolio.css`:
```css
.portfolio-editor {
  background: var(--white);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.portfolio-editor__header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.portfolio-editor__header h3 {
  flex: 1;
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--text-dark);
}

.portfolio-editor__type {
  font-size: 0.8rem;
  padding: 2px 8px;
  background: var(--purple-faint);
  color: var(--purple-dark);
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.portfolio-editor__toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.portfolio-editor__body {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.portfolio-editor__body label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.portfolio-editor__body input,
.portfolio-editor__body select,
.portfolio-editor__body textarea {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-family: var(--font-body);
}

.portfolio-editor__body input:focus,
.portfolio-editor__body select:focus,
.portfolio-editor__body textarea:focus {
  outline: none;
  border-color: var(--purple-main);
}

.portfolio-editor__photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.portfolio-editor__photo-thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
}

.portfolio-editor__photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portfolio-editor__photo-thumb button {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 22px;
  height: 22px;
  background: rgba(211, 47, 47, 0.9);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-add-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.admin-add-buttons .btn {
  flex: 1;
  min-width: 120px;
  text-align: center;
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: build admin portfolio page with photo upload and section management"
```

---

## Task 10: Seed Database & Connect Firebase

**Step 1: ⚠️ USER ACTION — Firebase login and config**

User must:
1. Run `firebase logout && firebase login` to log into the correct account
2. Run `firebase use erikaretiz` (or create the project if needed)
3. Enable Email/Password auth in Firebase Console
4. Create admin user in Firebase Console
5. Copy the web app config into `src/firebase/config.js`

**Step 2: Create a seed button in admin (temporary)**

Add to `src/pages/AdminLogin.jsx` a temporary seed button after the form:

```jsx
import { seedDatabase } from '../firebase/seed';

// Inside the component, after the form:
<button onClick={seedDatabase} style={{ marginTop: 20, opacity: 0.5 }}>
  Seed Database (one-time)
</button>
```

**Step 3: Test the full flow**

1. Visit `/` — landing page should load sections and links from Firestore
2. Visit `/actress` — portfolio should show demo reel, contact, photos
3. Visit `/admin` — login with credentials
4. `/admin/links` — edit sections, drag to reorder, add/remove links
5. `/admin/portfolio` — edit portfolio sections, upload photos, toggle visibility

**Step 4: Remove seed button after data is populated**

**Step 5: Deploy**

```bash
npm run build
firebase deploy
```

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: connect Firebase, seed initial data, deploy"
```

---

## Summary

| Task | Description | Depends On |
|------|-------------|------------|
| 1 | Project scaffolding & Firebase setup | - |
| 2 | Firebase hooks & data layer | 1 |
| 3 | App router & shared components | 1 |
| 4 | Global styles & fonts | 1 |
| 5 | Landing page (Home) | 2, 3, 4 |
| 6 | Actress portfolio page | 2, 3, 4 |
| 7 | Admin login page | 2, 3, 4 |
| 8 | Admin links page (CMS) | 2, 3, 7 |
| 9 | Admin portfolio page (CMS) | 2, 3, 7 |
| 10 | Seed database, connect, deploy | All |
