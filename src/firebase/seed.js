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
