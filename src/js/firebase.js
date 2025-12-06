// Importando direto da CDN para funcionar no navegador sem instalação
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Sua configuração
const firebaseConfig = {
  apiKey: "AIzaSyBKL37nBKy6q32GbrTl37bz-2bn0ByVuSM",
  authDomain: "kessoku-beat.firebaseapp.com",
  projectId: "kessoku-beat",
  storageBucket: "kessoku-beat.firebasestorage.app",
  messagingSenderId: "332639301846",
  appId: "1:332639301846:web:84072c432f2ed587085977",
  measurementId: "G-RQQQZK3B74"
};

// Inicializa
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SCORES_COLLECTION = "leaderboard";

export default {
    // Salvar pontuação
    async saveScore(name, score, chartId) {
        try {
            await addDoc(collection(db, SCORES_COLLECTION), {
                name: name.toUpperCase().substring(0, 3), // Garante 3 letras maiúsculas
                score: score,
                chartId: chartId, // Ex: song1_hard
                date: serverTimestamp()
            });
            return true;
        } catch (e) {
            console.error("Erro ao salvar score:", e);
            return false;
        }
    },

    // Buscar Top 5 de uma música específica
    async getScores(chartId) {
        try {
            const q = query(
                collection(db, SCORES_COLLECTION),
                where("chartId", "==", chartId),
                orderBy("score", "desc"),
                limit(5)
            );

            const querySnapshot = await getDocs(q);
            const scores = [];
            querySnapshot.forEach((doc) => {
                scores.push(doc.data());
            });
            return scores;
        } catch (e) {
            console.error("Erro ao buscar scores:", e);
            // Se der erro (ex: falta de índice no firebase), retorna vazio
            return [];
        }
    }
};