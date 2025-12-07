import Router from '../router.js';
import AudioEngine from '../audioEngine.js';

export default class MenuScreen {
    constructor() {
        // --- CORREÇÃO CRÍTICA: BINDING ---
        // Cria uma referência fixa da função para poder remover o ouvinte depois
        this.handleInputBound = this.handleInput.bind(this);
    }

    render() {
        return `
            <div class="screen-container menu-screen">
                
                <!-- CAMADA 1: Fundo -->
                <div class="menu-bg"></div>
                <div class="menu-overlay"></div>

                <!-- CAMADA 2: Personagem (Bocchi na direita) -->
                <div class="character-container">
                    <img src="./assets/images/bocchi_char.png" alt="Bocchi" class="bocchi-art">
                </div>

                <!-- CAMADA 3: Interface (Menu na esquerda) -->
                <div class="ui-layer">
                    <div class="logo-container">
                        <h1 class="game-title">KESSOKU <span class="neon-pink">BEAT</span></h1>
                        <p class="subtitle">RHYTHM ACTION GAME</p>
                    </div>
                    
                    <div class="menu-options">
                        <button id="btn-play" class="btn-primary">PLAY LIVE</button>
                        <button id="btn-tutorial" class="btn-primary">TUTORIAL</button>
                        <button id="btn-ranking" class="btn-primary">RANKING</button>
                        <button id="btn-options" class="btn-primary">OPTIONS</button>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        // 1. Iniciar Música do Menu
        AudioEngine.playBGM('./assets/audio/menu.mp3');

        // 2. Configurar Efeitos Sonoros (SFX) nos botões
        const buttons = document.querySelectorAll('.btn-primary');

        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                AudioEngine.playSFX('hover.mp3');
            });

            btn.addEventListener('click', () => {
                AudioEngine.playSFX('confirm.mp3');
            });
        });

        // 3. Configurar Navegação
        document.getElementById('btn-play').addEventListener('click', () => {
            Router.navigate('charSelect'); // Mudou aqui
        });

        document.getElementById('btn-tutorial').addEventListener('click', () => {
            Router.navigate('tutorial');
        });

        document.getElementById('btn-ranking').addEventListener('click', () => {
            Router.navigate('ranking');
        });

        document.getElementById('btn-options').addEventListener('click', () => {
            Router.navigate('options');
        });

        // 4. Adiciona ouvinte de teclado (usando a referência fixa)
        document.addEventListener('keydown', this.handleInputBound);
    }

    handleInput(e) {
        // Se você quiser atalhos no menu (ex: Enter para Play), coloque aqui.
        // O atalho 'E' para editor eu removi daqui para evitar conflitos, 
        // já que agora ele fica na tela de Seleção.
        
        /* Exemplo:
        if (e.key === 'Enter') {
            Router.navigate('select');
        }
        */
    }

    destroy() {
        // --- CORREÇÃO CRÍTICA ---
        // Remove o evento de teclado ao sair da tela.
        // Isso impede que apertar teclas no jogo ative coisas do menu.
        document.removeEventListener('keydown', this.handleInputBound);
    }
}