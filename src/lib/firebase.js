// firebase-config.js
// Importar as funções necessárias do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-analytics.js";

// Sua configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAV8cgruzRw_WHAtVBjBm2FYRqSp4Ps60A",
    authDomain: "teste-site-b58d5.firebaseapp.com",
    projectId: "teste-site-b58d5",
    storageBucket: "teste-site-b58d5.firebasestorage.app",
    messagingSenderId: "90201089059",
    appId: "1:90201089059:web:78eddc1ed353099f71bd96",
    measurementId: "G-4Q7QBDJDCS"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar as instâncias para uso em outros arquivos
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Verificar conexão com Firestore
getFirestore(app)
    .enableNetwork()
    .then(() => {
        console.log('📡 Conectado ao Firestore');
    })
    .catch(err => {
        console.error('❌ Erro ao conectar ao Firestore:', err);
    });

// Tornar disponível globalmente (para compatibilidade)
window.firebaseApp = app;