import Router from '../router.js';
import AudioEngine from '../audioEngine.js';
import NoteSpawner from '../noteSpawner.js';

export default class GameScreen {
    constructor(params) {
        // Identificadores para carregar áudio e chart separadamente
        this.songId = params.songId || 'song1';
        this.chartId = params.chartId || (params.songId ? params.songId + '_hard' : 'song1_hard');
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        
        // Contadores para precisão
        this.hits = { perfect: 0, good: 0, miss: 0 };
        
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
                
                <!-- Feedback Visual (Perfect/Miss) -->
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
        this.spawner = new NoteSpawner(this.chartId, this);
        
        // Listeners de Input
        document.addEventListener('keydown', (e) => this.handleInput(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

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
        console.log(`🎵 Tocando: ${audioPath} | 🗺️ Chart: ${this.chartId}`);
        
        // false = Não loopar a música no gameplay
        AudioEngine.playBGM(audioPath, false);
        
        this.spawner.start();
    }

    handleInput(e) {
        if (!this.isPlaying || e.repeat) return; // Ignora se segurar a tecla (repeat nativo)
        
        const keyMap = { 'KeyD': 0, 'KeyF': 1, 'KeyJ': 2, 'KeyK': 3 };

        if (keyMap[e.code] !== undefined) {
            const laneIndex = keyMap[e.code];
            
            // Verifica se acertou algo
            const hit = this.spawner.checkHit(laneIndex);
            
            if (hit) {
                // Acertou: Feedback normal
                this.triggerLane(laneIndex, 'hit');
            } else {
                // Errou (Spam/Ghost Tap): Punição
                this.handleSpam(laneIndex);
            }
        }
    }

    handleKeyUp(e) {
        if (!this.isPlaying) return;
        
        const keyMap = { 'KeyD': 0, 'KeyF': 1, 'KeyJ': 2, 'KeyK': 3 };
        
        if (keyMap[e.code] !== undefined) {
            const laneIndex = keyMap[e.code];
            
            // Remove brilho da tecla
            const lanes = document.querySelectorAll('.lane');
            if (lanes[laneIndex]) {
                lanes[laneIndex].querySelector('.hit-zone').classList.remove('hit-active', 'spam-active');
            }

            // Avisa o Spawner que soltou (para Hold Notes)
            this.spawner.checkLift(laneIndex);
        }
    }

    triggerLane(index, type = 'hit') {
        const lanes = document.querySelectorAll('.lane');
        if (lanes[index]) {
            const hitZone = lanes[index].querySelector('.hit-zone');
            
            // Reset visual
            hitZone.classList.remove('hit-active', 'spam-active');
            void hitZone.offsetWidth; // Force reflow

            if (type === 'hit') {
                hitZone.classList.add('hit-active');
            } else {
                hitZone.classList.add('spam-active'); // Vermelho
            }
        }
    }

    handleSpam(laneIndex) {
        this.triggerLane(laneIndex, 'spam');
        
        // Reseta combo (Punição)
        this.combo = 0;
        
        const comboEl = document.getElementById('combo-val');
        comboEl.innerText = 0;
        comboEl.style.color = '#555';
        comboEl.classList.remove('combo-pulse');
    }

    showFeedback(type) {
        const container = document.getElementById('feedback-container');
        container.innerHTML = '';
        const el = document.createElement('div');
        el.innerText = type;
        el.className = `feedback-text ${type.toLowerCase()}`;
        container.appendChild(el);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 500);
    }

    updateScore(points, type) {
        // Estatísticas
        if (type === 'PERFECT') this.hits.perfect++;
        if (type === 'GOOD') this.hits.good++;
        if (type === 'MISS') this.hits.miss++;

        if (type === 'MISS') {
            this.combo = 0;
            const comboEl = document.getElementById('combo-val');
            comboEl.style.color = '#555';
            comboEl.classList.remove('combo-pulse');
        } else {
            this.score += points + (this.combo * 10);
            this.combo++;
            
            // Atualiza Max Combo
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

            // Animação de pulo
            const comboEl = document.getElementById('combo-val');
            comboEl.classList.remove('combo-pulse');
            void comboEl.offsetWidth;
            comboEl.classList.add('combo-pulse');
            comboEl.style.color = 'var(--color-nijika)';
        }
        
        document.getElementById('score-val').innerText = this.score;
        document.getElementById('combo-val').innerText = this.combo;
    }

    endGame() {
        this.isPlaying = false;
        AudioEngine.stopBGM();
        
        // Cálculo de Accuracy Ponderada
        const totalPlayed = this.hits.perfect + this.hits.good + this.hits.miss;
        let accuracy = 0;
        if (totalPlayed > 0) {
            const weightedScore = (this.hits.perfect * 1) + (this.hits.good * 0.5);
            accuracy = Math.round((weightedScore / totalPlayed) * 100);
        }

        setTimeout(() => {
            Router.navigate('results', { 
                score: this.score, 
                maxCombo: this.maxCombo,
                accuracy: accuracy,
                rank: this.calculateRank(accuracy)
            });
        }, 2000);
    }

    calculateRank(acc) {
        if (acc >= 100) return 'SS';
        if (acc >= 90) return 'S';
        if (acc >= 80) return 'A';
        if (acc >= 60) return 'B';
        return 'C';
    }

    destroy() {
        if (this.spawner) this.spawner.stop();
        AudioEngine.stopBGM();
    }
}