import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_l8w6yBkm6Eckd8N3P9-XUIhL-1ZMXnQ",
  authDomain: "search-tracking-system.firebaseapp.com",
  projectId: "search-tracking-system",
  storageBucket: "search-tracking-system.firebasestorage.app",
  messagingSenderId: "688517878325",
  appId: "1:688517878325:web:09e1650d4f80874860d77c",
  measurementId: "G-6VW27CPN9M"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);