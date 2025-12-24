// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCigI18xcAV5l72A92PC4fd_ycaJiXL3W0",
  authDomain: "bgmi-esports-panel.firebaseapp.com",
  projectId: "bgmi-esports-panel",
  storageBucket: "bgmi-esports-panel.firebasestorage.app",
  messagingSenderId: "502293304562",
  appId: "1:502293304562:web:96ee481b7c63074f25ec6b",
  measurementId: "G-KBGVFJDD6L",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
