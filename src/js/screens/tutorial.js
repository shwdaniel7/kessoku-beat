import Router from '../router.js';
import Storage from '../storage.js'; // <--- Importante para ler as teclas

export default class TutorialScreen {
    render() {
        // 1. Pega as teclas salvas ou usa o padrão
        const rawKeys = Storage.get('keybinds') || ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
        
        // 2. Limpa os nomes (tira "Key", "Digit", etc)
        const keys = rawKeys.map(k => k.replace('Key', '').replace('Digit', ''));

        return `
            <div class="screen-container tutorial-screen">
                <div class="tutorial-bg"></div>
                <div class="screen-overlay"></div>

                <div class="tutorial-panel">
                    <h2>HOW TO PLAY</h2>
                    
                    <!-- GUIA DE TECLAS (DINÂMICO) -->
                    <div class="key-guide">
                        <div class="key-group">
                            <span class="key-label">NOTES</span>
                            <div class="key-row">
                                <div class="key">${keys[0]}</div>
                                <div class="key">${keys[1]}</div>
                                <div class="key">${keys[2]}</div>
                                <div class="key">${keys[3]}</div>
                            </div>
                        </div>

                        <div class="key-group">
                            <span class="key-label">FEVER / OVERDRIVE</span>
                            <div class="key-row">
                                <div class="key key-space">SPACE</div>
                            </div>
                        </div>
                    </div>

                    <div class="instructions">
                        <p>Press the keys to the rhythm of the music.</p>
                        <p>Hold the key for long notes.</p>
                        <p>Press <strong>SPACE</strong> when the bar is full to activate FEVER!</p>
                        <p class="highlight">USE HEADPHONES FOR BETTER EXPERIENCE!</p>
                    </div>

                    <button id="btn-back" class="btn-primary">BACK TO MENU</button>
                </div>
            </div>
        `;
    }

    init() {
        document.getElementById('btn-back').addEventListener('click', () => Router.navigate('menu'));
    }
}