import Router from '../router.js';
import AudioEngine from '../audioEngine.js';
import Firebase from '../firebase.js';
import { shopItems } from '../data/shopItems.js';

export default class ShopScreen {
    constructor() {
        this.activeTab = 'note'; // 'note' ou 'lane'
        this.userData = null;
        this.user = null;
        this.isLoading = true;
    }

    render() {
        return `
            <div class="screen-container shop-screen">
                <div class="shop-bg"></div>
                <div class="shop-overlay"></div>

                <div class="shop-header">
                    <h2>KESSOKU SHOP</h2>
                    <div class="wallet-display">
                        <span class="wallet-label">BALANCE</span>
                        <span class="wallet-amount" id="shop-money">---</span>
                    </div>
                </div>

                <div class="shop-content">
                    <!-- Abas de Categoria -->
                    <div class="shop-tabs">
                        <button class="tab-btn active" data-type="note">NOTE SKINS</button>
                        <button class="tab-btn" data-type="lane">LANE SKINS</button>
                    </div>

                    <!-- Grade de Itens -->
                    <div class="items-grid" id="items-grid">
                        <div class="loading-text">LOADING CATALOG...</div>
                    </div>
                </div>

                <div class="footer-controls">
                    <button id="btn-back" class="btn-text">BACK TO MENU</button>
                </div>

                <!-- Modal de Confirmação (Opcional, mas bom ter) -->
                <div id="msg-overlay" class="msg-overlay hidden">
                    <div class="msg-box">
                        <p id="msg-text">Processing...</p>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        // Verifica Login
        Firebase.onUserChange(async (user) => {
            if (user) {
                this.user = user;
                this.userData = await Firebase.getUserData(user.uid);
                this.isLoading = false;
                this.updateUI();
            } else {
                // Se for visitante, manda voltar pro menu ou mostra aviso
                alert("Please login to access the Shop!");
                Router.navigate('menu');
            }
        });

        // Abas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeTab = btn.dataset.type;
                this.renderItems();
                AudioEngine.playSFX('hover.mp3');
            });
        });

        // Voltar
        document.getElementById('btn-back').addEventListener('click', () => {
            AudioEngine.playSFX('confirm.mp3');
            Router.navigate('menu');
        });
    }

    updateUI() {
        if (!this.userData) return;
        
        // Atualiza Dinheiro
        document.getElementById('shop-money').innerText = `¥ ${this.userData.money}`;
        
        // Renderiza Itens
        this.renderItems();
    }

    renderItems() {
        const grid = document.getElementById('items-grid');
        grid.innerHTML = '';

        // Filtra itens pela aba atual
        const items = shopItems.filter(item => item.type === this.activeTab);

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            
            // Verifica estado do item
            const isOwned = this.userData.inventory && this.userData.inventory.includes(item.id);
            
            // Verifica se está equipado
            let isEquipped = false;
            if (this.activeTab === 'note' && this.userData.equippedNote === item.id) isEquipped = true;
            if (this.activeTab === 'lane' && this.userData.equippedLane === item.id) isEquipped = true;

            // Define o botão
            let btnHTML = '';
            if (isEquipped) {
                btnHTML = `<button class="shop-btn equipped" disabled>EQUIPPED</button>`;
                card.classList.add('equipped-card');
            } else if (isOwned) {
                btnHTML = `<button class="shop-btn equip" data-id="${item.id}">EQUIP</button>`;
            } else {
                const canAfford = this.userData.money >= item.price;
                const disabled = canAfford ? '' : 'disabled';
                btnHTML = `<button class="shop-btn buy" data-id="${item.id}" data-price="${item.price}" ${disabled}>
                    BUY ¥ ${item.price}
                </button>`;
            }

            card.innerHTML = `
                <div class="item-img">
                    <img src="./assets/images/shop/${item.image}" alt="${item.name}" onerror="this.style.display='none'">
                </div>
                <div class="item-info">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                </div>
                <div class="item-action">
                    ${btnHTML}
                </div>
            `;

            grid.appendChild(card);
        });

        // Adiciona eventos aos botões gerados
        this.attachItemEvents();
    }

    attachItemEvents() {
        // Botões de Comprar
        document.querySelectorAll('.shop-btn.buy').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const price = parseInt(e.target.dataset.price);
                await this.buyItem(id, price);
            });
        });

        // Botões de Equipar
        document.querySelectorAll('.shop-btn.equip').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                await this.equipItem(id);
            });
        });
    }

    async buyItem(itemId, price) {
        this.showMsg("Processing...");
        const result = await Firebase.buyItem(this.user.uid, itemId, price);
        
        if (result.success) {
            AudioEngine.playSFX('confirm.mp3'); // Som de caixa registradora seria ideal
            // Atualiza dados locais
            this.userData = await Firebase.getUserData(this.user.uid);
            this.updateUI();
            this.showMsg("PURCHASE SUCCESSFUL!", 1000);
        } else {
            AudioEngine.playSFX('miss.mp3'); // Som de erro
            this.showMsg(result.msg, 1500);
        }
    }

    async equipItem(itemId) {
        const type = this.activeTab === 'note' ? 'equippedNote' : 'equippedLane';
        
        const success = await Firebase.equipItem(this.user.uid, itemId, type);
        
        if (success) {
            AudioEngine.playSFX('hover.mp3'); // Som de equipar
            this.userData = await Firebase.getUserData(this.user.uid);
            this.updateUI();
        }
    }

    showMsg(text, time = 0) {
        const overlay = document.getElementById('msg-overlay');
        const txt = document.getElementById('msg-text');
        txt.innerText = text;
        overlay.classList.remove('hidden');

        if (time > 0) {
            setTimeout(() => {
                overlay.classList.add('hidden');
            }, time);
        }
    }
}