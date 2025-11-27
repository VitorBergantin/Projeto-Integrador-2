// firebase-config.js
// Importar as funções necessárias do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { getFirestore, enableNetwork } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-analytics.js";

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDX9ozw8vCbujgwSLlSNXmFLch5zeoXF6k",
  authDomain: "projeto-integrador-ii---9c0ce.firebaseapp.com",
  projectId: "projeto-integrador-ii---9c0ce",
    storageBucket: "projeto-integrador-ii---9c0ce.appspot.com",
  messagingSenderId: "1075511810637",
  appId: "1:1075511810637:web:5d4195bd873422ca339a04",
  measurementId: "G-X9YB6C5T23"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar as instâncias para uso em outros arquivos
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Inicializar analytics com segurança (apenas em ambiente suportado)
let analyticsInstance = null;
try {
    analyticsInstance = getAnalytics(app);
} catch (err) {
    // getAnalytics pode falhar em ambientes sem window/https
    console.warn('⚠️ Analytics não inicializado:', err && err.message ? err.message : err);
}
export const analytics = analyticsInstance;

// Habilitar rede do Firestore (se necessário) usando API modular
enableNetwork(db)
    .then(() => console.log('📡 Conectado ao Firestore'))
    .catch((err) => console.error('❌ Erro ao conectar ao Firestore:', err));

// Tornar disponível globalmente (para compatibilidade)
window.firebaseApp = app;