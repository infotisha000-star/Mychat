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

// Production Firebase Configuration with actual project defaults for Netlify build safety
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBU3FsuCnmxZz6qQb82qjgRPop7p0Z2Nx0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mychat-72524.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mychat-72524",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mychat-72524.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "291071978486",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:291071978486:web:ffe2399522fb158780b5d7",
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
