import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp, doc, setDoc, getDoc, updateDoc, increment 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBKL37nBKy6q32GbrTl37bz-2bn0ByVuSM", // Sua chave atual
  authDomain: "kessoku-beat.firebaseapp.com",
  projectId: "kessoku-beat",
  storageBucket: "kessoku-beat.firebasestorage.app",
  messagingSenderId: "332639301846",
  appId: "1:332639301846:web:84072c432f2ed587085977",
  measurementId: "G-RQQQZK3B74"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const SCORES_COLLECTION = "leaderboard";
const USERS_COLLECTION = "users";

export default {
    // --- AUTENTICAÇÃO ---
    
    // Login com Google
    async login() {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Cria/Atualiza documento do usuário no banco
            await this.initUserProfile(user);
            return user;
        } catch (error) {
            console.error("Erro no login:", error);
            return null;
        }
    },

    // Logout
    async logout() {
        try {
            await signOut(auth);
            window.location.reload(); // Recarrega pra limpar estado
        } catch (error) {
            console.error("Erro no logout:", error);
        }
    },

    // Monitorar estado (se está logado ou não)
    onUserChange(callback) {
        onAuthStateChanged(auth, (user) => {
            callback(user);
        });
    },

    // Cria o perfil no banco se não existir (para guardar dinheiro/skins)
    async initUserProfile(user) {
        const userRef = doc(db, USERS_COLLECTION, user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                displayName: user.displayName,
                photoURL: user.photoURL,
                money: 0,
                // --- NOVOS CAMPOS ---
                inventory: ['note_default', 'lane_default'], // Itens iniciais
                equippedNote: 'note_default',
                equippedLane: 'lane_default',
                // --------------------
                createdAt: serverTimestamp()
            });
        }
    },

    // --- DADOS DO JOGADOR ---

    // Pegar dinheiro e skins
    async getUserData(uid) {
        const userRef = doc(db, USERS_COLLECTION, uid);
        const snap = await getDoc(userRef);
        return snap.exists() ? snap.data() : null;
    },

    // Adicionar dinheiro (chamar no fim da música)
    async addMoney(uid, amount) {
        const userRef = doc(db, USERS_COLLECTION, uid);
        await updateDoc(userRef, {
            money: increment(amount)
        });
    },

    // --- LEADERBOARD (Mantido) ---

    async saveScore(name, score, chartId, uid = null) {
        try {
            await addDoc(collection(db, SCORES_COLLECTION), {
                name: name.toUpperCase().substring(0, 10), // Aumentei limite de letras
                score: score,
                chartId: chartId,
                uid: uid, // Salva o ID se for logado (para linkar replay futuro)
                date: serverTimestamp()
            });
            return true;
        } catch (e) {
            console.error("Erro ao salvar score:", e);
            return false;
        }
    },

    async getScores(chartId) {
        try {
            const q = query(
                collection(db, SCORES_COLLECTION),
                where("chartId", "==", chartId),
                orderBy("score", "desc"),
                limit(10) // Aumentei pra Top 10
            );
            const querySnapshot = await getDocs(q);
            const scores = [];
            querySnapshot.forEach((doc) => scores.push(doc.data()));
            return scores;
        } catch (e) {
            console.error("Erro ao buscar scores:", e);
            return [];
        }
    },

    // --- SISTEMA DE LOJA ---

    // Comprar Item
    async buyItem(uid, itemId, price) {
        const userRef = doc(db, USERS_COLLECTION, uid);
        
        try {
            // 1. Busca dados atuais
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return { success: false, msg: "User not found" };
            
            const userData = userSnap.data();
            
            // 2. Verifica dinheiro
            if (userData.money < price) {
                return { success: false, msg: "Not enough Yen!" };
            }

            // 3. Verifica se já tem
            // (Garante que inventory existe, se não, cria array vazio)
            const inventory = userData.inventory || ['note_default', 'lane_default'];
            if (inventory.includes(itemId)) {
                return { success: false, msg: "Already owned!" };
            }

            // 4. Realiza a transação (Desconta dinheiro, Adiciona item)
            await updateDoc(userRef, {
                money: increment(-price),
                inventory: [...inventory, itemId]
            });

            return { success: true, msg: "Purchase successful!" };

        } catch (e) {
            console.error("Erro na compra:", e);
            return { success: false, msg: "Transaction failed." };
        }
    },

    // Equipar Item
    async equipItem(uid, itemId, type) {
        // type deve ser 'equippedNote' ou 'equippedLane'
        const userRef = doc(db, USERS_COLLECTION, uid);
        
        try {
            // Cria o objeto de update dinâmico
            const updateData = {};
            updateData[type] = itemId; // Ex: { equippedNote: 'note_circle' }
            
            await updateDoc(userRef, updateData);
            return true;
        } catch (e) {
            console.error("Erro ao equipar:", e);
            return false;
        }
    }
};

// --- CHEAT DE DESENVOLVEDOR ---
// Isso expõe uma função global no navegador
window.devMoney = async (amount) => {
    const user = auth.currentUser;
    if (!user) {
        console.error("❌ Você precisa estar logado para usar o cheat!");
        return;
    }

    console.log(`💸 Injetando ¥${amount} na conta de ${user.displayName}...`);
    
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await updateDoc(userRef, {
        money: increment(amount)
    });

    console.log("✅ Sucesso! Recarregue a página ou vá para outra tela para atualizar.");
};