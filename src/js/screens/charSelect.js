import Router from '../router.js';
import AudioEngine from '../audioEngine.js';
import Storage from '../storage.js';
import { characters } from '../data/characters.js';

export default class CharSelectScreen {
    constructor() {
        this.selectedId = Storage.get('selectedCharId') || 'bocchi';
    }

    render() {
        // Encontra o personagem selecionado para definir o fundo inicial
        const currentChar = characters.find(c => c.id === this.selectedId) || characters[0];
        const initialBg = currentChar.bgImage || 'menu_bg.png';

        const cardsHTML = characters.map(char => {
            const isSelected = this.selectedId === char.id ? 'active' : '';
            return `
                <div class="char-card ${isSelected}" data-id="${char.id}" style="--char-color: ${char.color}">
                    <div class="char-img">
                        <img src="./assets/images/${char.image}" alt="${char.name}" onerror="this.style.display='none'">
                    </div>
                    <div class="char-info">
                        <h3 class="char-name">${char.name}</h3>
                        <span class="char-role">${char.role}</span>
                        <p class="char-desc">${char.description}</p>
                    </div>
                    <div class="char-bg"></div>
                </div>
            `;
        }).join('');

        return `
            <div class="screen-container char-select-screen">
                <!-- Fundo Dinâmico -->
                <div class="char-select-bg" style="background-image: url('./assets/images/${initialBg}')"></div>
                <div class="screen-overlay"></div>

                <div class="content-wrapper">
                    <h2 class="screen-title">CHOOSE YOUR MEMBER</h2>
                    
                    <div class="char-container">
                        ${cardsHTML}
                    </div>

                    <div class="footer-controls">
                        <button id="btn-back" class="btn-text">BACK</button>
                        <button id="btn-confirm" class="btn-primary">CONFIRM</button>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        const cards = document.querySelectorAll('.char-card');
        const bgElement = document.querySelector('.char-select-bg');
        
        // Variável para impedir cliques múltiplos
        let isConfirming = false;

        cards.forEach(card => {
            card.addEventListener('click', () => {
                if (isConfirming) return; // Bloqueia se já estiver confirmando

                cards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                this.selectedId = card.dataset.id;
                
                const charData = characters.find(c => c.id === this.selectedId);
                if (charData && charData.bgImage) {
                    bgElement.style.backgroundImage = `url('./assets/images/${charData.bgImage}')`;
                }

                AudioEngine.playSFX('hover.mp3');
            });
        });

        document.getElementById('btn-back').addEventListener('click', () => {
            if (isConfirming) return;
            AudioEngine.playSFX('confirm.mp3');
            Router.navigate('menu');
        });

        // --- LÓGICA DE CONFIRMAÇÃO COM ANIMAÇÃO ---
        document.getElementById('btn-confirm').addEventListener('click', () => {
            if (isConfirming) return;
            isConfirming = true; // Trava a tela

            // 1. Salva a escolha
            Storage.set('selectedCharId', this.selectedId);
            
            // 2. Pega dados do personagem
            const charData = characters.find(c => c.id === this.selectedId);
            
            // 3. Aplica classes visuais (Animação)
            const selectedCard = document.querySelector(`.char-card[data-id="${this.selectedId}"]`);
            const otherCards = document.querySelectorAll(`.char-card:not([data-id="${this.selectedId}"])`);
            const uiElements = document.querySelectorAll('.screen-title, .footer-controls');

            if (selectedCard) selectedCard.classList.add('confirmed');
            otherCards.forEach(c => c.classList.add('dimmed'));
            uiElements.forEach(el => el.classList.add('ui-hidden')); // Esconde botões e título

            // 4. Toca a voz
            if (charData && charData.voiceLine) {
                AudioEngine.playSFX(charData.voiceLine);
            } else {
                AudioEngine.playSFX('confirm.mp3');
            }

            // 5. Define o tempo de espera (Padrão 2s se não tiver no JSON)
            const waitTime = charData.voiceDuration || 2000;

            // 6. Navega depois do tempo
            setTimeout(() => {
                Router.navigate('select');
            }, waitTime);
        });
    }
}