import Router from '../router.js';
import AudioEngine from '../audioEngine.js';
import Firebase from '../firebase.js'; 
import { changelogData, appVersion } from '../data/changelog.js'; // <--- NOVO: Importa os dados

export default class MenuScreen {
    constructor() {
        this.handleInputBound = this.handleInput.bind(this);
        this.currentUser = null;
    }

    render() {
        // --- GERA O HTML DO CHANGELOG ---
        const changelogHTML = changelogData.map(log => `
            <div class="changelog-item">
                <div class="log-header">
                    <span class="log-version">${log.version}</span>
                    <span class="log-date">${log.date}</span>
                </div>
                <h4 class="log-title">${log.title}</h4>
                <ul class="log-list">
                    ${log.changes.map(c => `<li>${c}</li>`).join('')}
                </ul>
            </div>
        `).join('');

        return `
            <div class="screen-container menu-screen">
                
                <!-- PERFIL DO USUÁRIO -->
                <div id="user-profile" class="user-profile">
                    <button id="btn-login" class="btn-login">LOGIN WITH GOOGLE</button>
                    <div id="user-info" class="user-info hidden">
                        <img id="user-avatar" src="" alt="Avatar">
                        <div class="user-details">
                            <span id="user-name">Guest</span>
                            <span id="user-money">¥ 0</span>
                        </div>
                        <button id="btn-logout" class="btn-logout">LOGOUT</button>
                    </div>
                </div>

                <div class="menu-bg"></div>
                <div class="menu-overlay"></div>
                <div class="character-container">
                    <img src="./assets/images/bocchi_char.png" alt="Bocchi" class="bocchi-art">
                </div>

                <div class="ui-layer">
                    <div class="logo-container">
                        <h1 class="game-title">KESSOKU <span class="neon-pink">BEAT</span></h1>
                        <p class="subtitle">RHYTHM ACTION GAME</p>
                    </div>
                    
                    <div class="menu-options">
                        <button id="btn-play" class="btn-primary">PLAY LIVE</button>
                        <button id="btn-shop" class="btn-primary">SHOP</button>
                        <button id="btn-tutorial" class="btn-primary">TUTORIAL</button>
                        <button id="btn-ranking" class="btn-primary">RANKING</button>
                        <button id="btn-options" class="btn-primary">OPTIONS</button>
                    </div>
                </div>

                <!-- BOTÃO DE VERSÃO (NOVO) -->
                <div class="version-tag" id="btn-changelog">
                    ${appVersion}
                </div>

                <!-- MODAL DE CHANGELOG (NOVO) -->
                <div id="changelog-overlay" class="modal-overlay hidden">
                    <div class="modal-panel">
                        <div class="modal-header">
                            <h3>PATCH NOTES</h3>
                            <button id="btn-close-log">×</button>
                        </div>
                        <div class="modal-content">
                            ${changelogHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        AudioEngine.playBGM('./assets/audio/menu.mp3');

                // --- PARALLAX EFFECT ---
        // Só ativa se não for Low Spec (para economizar bateria/cpu)
        if (!document.body.classList.contains('low-spec')) {
            document.addEventListener('mousemove', (e) => {
                const x = (window.innerWidth - e.pageX * 2) / 100;
                const y = (window.innerHeight - e.pageY * 2) / 100;

                // Fundo move mais (está longe)
                const bg = document.querySelector('.menu-bg');
                if (bg) bg.style.transform = `scale(1.1) translate(${x}px, ${y}px)`;

                // Personagem move menos (está perto/foco)
                const char = document.querySelector('.character-container img');
                if (char) char.style.transform = `translate(${-x * 0.5}px, ${-y * 0.5}px)`;
                
                // Logo move um pouco para dar profundidade 3D
                const logo = document.querySelector('.logo-container');
                if (logo) logo.style.transform = `translate(${-x * 1.5}px, ${-y * 1.5}px)`;
            });
        }
        
        // --- LÓGICA DO CHANGELOG (NOVO) ---
        const logOverlay = document.getElementById('changelog-overlay');
        const btnLog = document.getElementById('btn-changelog');
        const btnCloseLog = document.getElementById('btn-close-log');

        btnLog.addEventListener('click', () => {
            logOverlay.classList.remove('hidden');
            AudioEngine.playSFX('hover.mp3');
        });

        btnCloseLog.addEventListener('click', () => {
            logOverlay.classList.add('hidden');
            AudioEngine.playSFX('confirm.mp3');
        });

        // Fecha ao clicar fora do modal
        logOverlay.addEventListener('click', (e) => {
            if (e.target === logOverlay) {
                logOverlay.classList.add('hidden');
            }
        });
        // ----------------------------------

        // --- LÓGICA DE LOGIN ---
        const btnLogin = document.getElementById('btn-login');
        const btnLogout = document.getElementById('btn-logout');
        const userInfo = document.getElementById('user-info');

        document.getElementById('btn-shop').addEventListener('click', () => {
            Router.navigate('shop');
        });
        
        // Verifica se já está logado
        Firebase.onUserChange(async (user) => {
            if (user) {
                this.currentUser = user;
                btnLogin.classList.add('hidden');
                userInfo.classList.remove('hidden');
                
                document.getElementById('user-avatar').src = user.photoURL;
                document.getElementById('user-name').innerText = user.displayName.split(' ')[0]; 
                
                // Busca dinheiro
                const data = await Firebase.getUserData(user.uid);
                if (data) {
                    document.getElementById('user-money').innerText = `¥ ${data.money}`;
                }
            } else {
                this.currentUser = null;
                btnLogin.classList.remove('hidden');
                userInfo.classList.add('hidden');
            }
        });

        btnLogin.addEventListener('click', async () => {
            await Firebase.login();
        });

        btnLogout.addEventListener('click', async () => {
            await Firebase.logout();
        });
        // -----------------------

        const buttons = document.querySelectorAll('.btn-primary');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => AudioEngine.playSFX('hover.mp3'));
            btn.addEventListener('click', () => AudioEngine.playSFX('confirm.mp3'));
        });

        document.getElementById('btn-play').addEventListener('click', () => Router.navigate('charSelect'));
        document.getElementById('btn-tutorial').addEventListener('click', () => Router.navigate('tutorial'));
        document.getElementById('btn-ranking').addEventListener('click', () => Router.navigate('ranking'));
        document.getElementById('btn-options').addEventListener('click', () => Router.navigate('options'));

        document.addEventListener('keydown', this.handleInputBound);
    }

    handleInput(e) {}

    destroy() {
        document.removeEventListener('keydown', this.handleInputBound);
    }
}