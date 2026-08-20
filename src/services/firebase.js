import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  increment
} from 'firebase/firestore';
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  push,
  update,
  remove,
  onValue,
  off,
  onDisconnect,
  serverTimestamp as rtdbTimestamp
} from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyForVortexChatPWA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vortex-chat-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vortex-chat-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vortex-chat-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:demo123456",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://mychat-72524-default-rtdb.firebaseio.com"
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// Enable persistent auth state
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Auth persistence error:", error);
});

export {
  app,
  auth,
  db,
  rtdb,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  ref,
  set,
  get,
  child,
  push,
  update,
  remove,
  onValue,
  off,
  onDisconnect,
  rtdbTimestamp
};

