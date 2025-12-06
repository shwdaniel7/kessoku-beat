import Router from '../router.js';

export default class TutorialScreen {
    render() {
        return `
            <div class="screen-container tutorial-screen">
                <!-- CAMADA 1: Fundo Específico -->
                <div class="tutorial-bg"></div>
                <div class="screen-overlay"></div>

                <!-- CAMADA 2: Painel Estilo Nijika -->
                <div class="tutorial-panel">
                    <h2>HOW TO PLAY</h2>
                    
                    <div class="key-guide">
                        <div class="key-box">
                            <div class="key">D</div>
                            <div class="key">F</div>
                        </div>
                        <div class="key-box">
                            <div class="key">J</div>
                            <div class="key">K</div>
                        </div>
                    </div>

                    <div class="instructions">
                        <p>Press the keys to the rhythm of the music.</p>
                        <p class="highlight">Use headphones for better experience!</p>
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