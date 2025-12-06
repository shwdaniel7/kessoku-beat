import Router from '../router.js';
import AudioEngine from '../audioEngine.js';

export default class MenuScreen {
    render() {
        return `
            <div class="screen-container menu-screen">
                <div class="menu-bg"></div>
                <div class="menu-overlay"></div>
                <div class="character-container">
                    <!-- Se sua imagem for jpg, mude aqui -->
                    <img src="./assets/images/bocchi_char.png" alt="Bocchi">
                </div>
                <div class="ui-layer">
                    <div class="logo-container">
                        <h1 class="game-title">KESSOKU <span class="neon-pink">BEAT</span></h1>
                        <p class="subtitle">RHYTHM ACTION GAME</p>
                    </div>
                    <div class="menu-options">
                        <button id="btn-play" class="btn-primary">PLAY LIVE</button>
                        <button id="btn-tutorial" class="btn-primary">TUTORIAL</button>
                        <button id="btn-options" class="btn-primary">OPTIONS</button>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        // Música de fundo
        AudioEngine.playBGM('./assets/audio/menu.mp3');

        const buttons = document.querySelectorAll('.btn-primary');

        buttons.forEach(btn => {
            // Mudei de .wav para .mp3 aqui
            btn.addEventListener('mouseenter', () => {
                AudioEngine.playSFX('hover.mp3'); 
            });

            // Mudei de .wav para .mp3 aqui
            btn.addEventListener('click', () => {
                AudioEngine.playSFX('confirm.mp3');
            });
        });

        document.getElementById('btn-play').addEventListener('click', () => Router.navigate('select'));
        document.getElementById('btn-tutorial').addEventListener('click', () => Router.navigate('tutorial'));
        document.getElementById('btn-options').addEventListener('click', () => Router.navigate('options'));
        
                document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'e') {
                Router.navigate('editor', { songId: 'song1' });
            }
        });
    
    
    }


    
    
}

