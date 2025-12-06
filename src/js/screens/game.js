import Router from '../router.js';
import AudioEngine from '../audioEngine.js';
import NoteSpawner from '../noteSpawner.js';

export default class GameScreen {
    constructor(params) {
        this.songId = params.songId || 'song1';
        this.score = 0;
        this.combo = 0;
        this.isPlaying = false;
        this.spawner = null;
    }

    render() {
        return `
            <div class="screen-container game-screen">
                <!-- Interface de Pontuação -->
                <div class="game-ui">
                    <div class="score-box">
                        <span class="label">SCORE</span>
                        <span id="score-val">0</span>
                    </div>
                    <div class="combo-box">
                        <span class="label">COMBO</span>
                        <span id="combo-val">0</span>
                    </div>
                </div>
                
                <!-- ZONA DE FEEDBACK (PERFECT / MISS) -->
                <div id="feedback-container"></div>
                
                <!-- Pista das Notas -->
                <div class="track-container">
                    <div class="lane" id="lane-0"><div class="key-hint">D</div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-1"><div class="key-hint">F</div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-2"><div class="key-hint">J</div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-3"><div class="key-hint">K</div><div class="hit-zone"></div></div>
                </div>

                <!-- Overlay de Start -->
                <div class="game-overlay" id="start-overlay">
                    <div class="countdown">READY</div>
                </div>
            </div>
        `;
    }

    init() {
        // Inicializa o Spawner
        this.spawner = new NoteSpawner(this.songId, this);
        
        // Configura input do teclado
        document.addEventListener('keydown', (e) => this.handleInput(e));

        // Inicia contagem regressiva
        this.startCountdown();
    }

    startCountdown() {
        const overlay = document.querySelector('.countdown');
        let count = 3;
        
        const timer = setInterval(() => {
            if (count > 0) {
                overlay.innerText = count;
                AudioEngine.playSFX('hover.mp3');
                count--;
            } else {
                clearInterval(timer);
                document.getElementById('start-overlay').style.display = 'none';
                this.startGame();
            }
        }, 1000);
    }

    startGame() {
        this.isPlaying = true;
        
        const audioPath = `./assets/audio/${this.songId}.mp3`;
        console.log("Tocando música:", audioPath);
        
        AudioEngine.playBGM(audioPath, false); 
        
        this.spawner.start();
    }

    handleInput(e) {
        if (!this.isPlaying) return;
        
        const keyMap = { 'KeyD': 0, 'KeyF': 1, 'KeyJ': 2, 'KeyK': 3 };

        if (keyMap[e.code] !== undefined) {
            const laneIndex = keyMap[e.code];
            
            // Efeito visual na linha (brilho)
            this.triggerLane(laneIndex);
            
            // Verifica com o Spawner se acertou algo
            this.spawner.checkHit(laneIndex);
        }
    }

    triggerLane(index) {
        const lanes = document.querySelectorAll('.lane');
        if (lanes[index]) {
            const hitZone = lanes[index].querySelector('.hit-zone');
            hitZone.classList.add('hit-active');
            setTimeout(() => hitZone.classList.remove('hit-active'), 100);
        }
    }

    // Exibe o texto PERFECT, GOOD ou MISS
    showFeedback(type) {
        const container = document.getElementById('feedback-container');
        
        // Limpa anterior
        container.innerHTML = '';

        const el = document.createElement('div');
        el.innerText = type;
        el.className = `feedback-text ${type.toLowerCase()}`;
        
        container.appendChild(el);

        // Remove do DOM após animação
        setTimeout(() => {
            if (el.parentNode) el.remove();
        }, 500);
    }

    updateScore(points, type) {
        const comboEl = document.getElementById('combo-val');

        if (type === 'MISS') {
            this.combo = 0;
            comboEl.style.color = '#555';
            comboEl.classList.remove('combo-pulse'); // Remove animação se errar
        } else {
            this.score += points + (this.combo * 10);
            this.combo++;
            
            // Efeito de Pulo no Combo
            comboEl.classList.remove('combo-pulse'); // Reseta
            void comboEl.offsetWidth; // Força o navegador a recalcular (hack para reiniciar animação CSS)
            comboEl.classList.add('combo-pulse'); // Adiciona de novo
        }
        
        document.getElementById('score-val').innerText = this.score;
        comboEl.innerText = this.combo;
    }

    endGame() {
        this.isPlaying = false;
        AudioEngine.stopBGM();
        setTimeout(() => {
            Router.navigate('results', { score: this.score, maxCombo: this.combo });
        }, 2000);
    }

    destroy() {
        if (this.spawner) this.spawner.stop();
        AudioEngine.stopBGM();
    }
}