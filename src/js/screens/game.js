import Router from '../router.js';
import AudioEngine from '../audioEngine.js';
import NoteSpawner from '../noteSpawner.js';

export default class GameScreen {
    constructor(params) {
        this.songId = params.songId || 'song1';
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0; // <--- NOVO: Guarda o maior combo da partida
        
        // Contadores para precisão real
        this.hits = {
            perfect: 0,
            good: 0,
            miss: 0
        };

        this.isPlaying = false;
        this.spawner = null;
    }

    render() {
        return `
            <div class="screen-container game-screen">
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
                
                <div id="feedback-container"></div>
                
                <div class="track-container">
                    <div class="lane" id="lane-0"><div class="key-hint">D</div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-1"><div class="key-hint">F</div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-2"><div class="key-hint">J</div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-3"><div class="key-hint">K</div><div class="hit-zone"></div></div>
                </div>

                <div class="game-overlay" id="start-overlay">
                    <div class="countdown">READY</div>
                </div>
            </div>
        `;
    }

    init() {
        this.spawner = new NoteSpawner(this.songId, this);
        document.addEventListener('keydown', (e) => this.handleInput(e));
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
        AudioEngine.playBGM(audioPath, false);
        this.spawner.start();
    }

    handleInput(e) {
        if (!this.isPlaying) return;
        const keyMap = { 'KeyD': 0, 'KeyF': 1, 'KeyJ': 2, 'KeyK': 3 };
        if (keyMap[e.code] !== undefined) {
            const laneIndex = keyMap[e.code];
            this.triggerLane(laneIndex);
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
        // Atualiza contadores de precisão
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
            
            // --- CORREÇÃO DO MAX COMBO ---
            // Se o combo atual for maior que o recorde, atualiza o recorde
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }

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
        
        // --- CÁLCULO DE PRECISÃO REAL ---
        // Total de notas tocadas até agora
        const totalPlayed = this.hits.perfect + this.hits.good + this.hits.miss;
        
        // Cálculo ponderado: Perfect vale 100%, Good vale 50%, Miss vale 0%
        // Evita divisão por zero
        let accuracy = 0;
        if (totalPlayed > 0) {
            const weightedScore = (this.hits.perfect * 1) + (this.hits.good * 0.5);
            accuracy = Math.round((weightedScore / totalPlayed) * 100);
        }

        setTimeout(() => {
            Router.navigate('results', { 
                score: this.score, 
                maxCombo: this.maxCombo, // Envia o maior combo atingido
                accuracy: accuracy,      // Envia a porcentagem já calculada
                rank: this.calculateRank(accuracy) // Envia o rank calculado
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