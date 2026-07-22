// For Firebase JS SDK v7.20.0 and later, measurementId is optional
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDiWBt-tjJ-dsmFsshbZ97To9pgWXmGHMk",
  authDomain: "halil-ice.firebaseapp.com",
  projectId: "halil-ice",
  storageBucket: "halil-ice.firebasestorage.app",
  messagingSenderId: "896191058330",
  appId: "1:896191058330:web:1274d29592bc8233416a23",
  measurementId: "G-PHMF2B3FP5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);