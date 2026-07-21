import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Твои настройки из консоли Firebase (замени на свои актуальные данные)
const firebaseConfig = {
  apiKey: "ТВОЙ_API_KEY",
  authDomain: "ТВОЙ_AUTH_DOMAIN",
  projectId: "ТВОЙ_PROJECT_ID",
  storageBucket: "ТВОЙ_STORAGE_BUCKET",
  messagingSenderId: "ТВОЙ_MESSAGING_SENDER_ID",
  appId: "ТВОЙ_APP_ID"
};

// Инициализируем Firebase
const app = initializeApp(firebaseConfig);

// Экспортируем базу данных для использования в приложении
export const db = getFirestore(app);