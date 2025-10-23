// Importe as bibliotecas necessárias
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // Importe getDatabase para o Realtime Database

// Seu objeto firebaseConfig que você copiou
const firebaseConfig = {
  apiKey: "SEU_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Inicialize e exporte o Realtime Database
export const database = getDatabase(app);
