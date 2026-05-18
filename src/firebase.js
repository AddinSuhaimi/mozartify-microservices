// src/firebase.js
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirestore } from "firebase/firestore"; // Add Firestore import

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwdW3h8j1MuS3dJyiMGR4sVA4gwuLETho",
  authDomain: "mozartify-msa.firebaseapp.com",
  projectId: "mozartify-msa",
  storageBucket: "mozartify-msa.firebasestorage.app",
  messagingSenderId: "288015855448",
  appId: "1:288015855448:web:d44fc228c147750f61bf2d",
  measurementId: "G-2LC2VRY7QH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
const storage = getStorage(app);

// Initialize Firestore
const db = getFirestore(app); // Initialize Firestore

// Export Firestore and Storage
export { storage, db, ref, uploadBytesResumable, getDownloadURL };