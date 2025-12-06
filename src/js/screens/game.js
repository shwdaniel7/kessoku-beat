import Router from '../router.js';
import AudioEngine from '../audioEngine.js';
import NoteSpawner from '../noteSpawner.js';

export default class GameScreen {
    constructor(params) {
        this.songId = params.songId || 'song1';
        this.chartId = params.chartId || 'song1_hard';
        
        // Recebe a velocidade (ou usa 1.3 padrão)
        this.noteSpeed = params.noteSpeed || 1.3;
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hits = { perfect: 0, good: 0, miss: 0 };
        
        this.isPlaying = false;
        this.isPaused = false;
        this.spawner = null;
        this.startTimeout = null;
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

                <div class="game-overlay" id="pause-overlay" style="display: none;">
                    <div class="pause-menu">
                        <h2>PAUSED</h2>
                        <button id="btn-resume" class="btn-primary">RESUME</button>
                        <button id="btn-retry" class="btn-primary">RETRY</button>
                        <button id="btn-quit" class="btn-primary">QUIT</button>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        // Passa a velocidade para o Spawner
        this.spawner = new NoteSpawner(this.chartId, this, this.noteSpeed);
        
        this.handleKeyDownBound = (e) => {
            if (e.key === 'Escape') this.togglePause();
            else this.handleInput(e);
        };
        this.handleKeyUpBound = (e) => this.handleKeyUp(e);

        document.addEventListener('keydown', this.handleKeyDownBound);
        document.addEventListener('keyup', this.handleKeyUpBound);

        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
        
        document.getElementById('btn-retry').addEventListener('click', () => {
            this.destroy();
            Router.navigate('game', { 
                songId: this.songId, 
                chartId: this.chartId,
                noteSpeed: this.noteSpeed 
            });
        });

        document.getElementById('btn-quit').addEventListener('click', () => {
            this.destroy();
            AudioEngine.playBGM(`./assets/audio/${this.songId}.mp3`, true);
            Router.navigate('select');
        });

        this.startCountdown();
    }

    togglePause() {
        if (document.getElementById('start-overlay').style.display !== 'none') return;

        this.isPaused = !this.isPaused;
        const overlay = document.getElementById('pause-overlay');

        if (this.isPaused) {
            overlay.style.display = 'flex';
            AudioEngine.pauseBGM();
            this.spawner.isPlaying = false;
        } else {
            overlay.style.display = 'none';
            AudioEngine.resumeBGM();
            this.spawner.isPlaying = true;
            this.spawner.loop();
        }
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
        console.log("Preparando...");
        
        this.startTimeout = setTimeout(() => {
            this.isPlaying = true;
            const audioPath = `./assets/audio/${this.songId}.mp3`;
            
            console.log(`🎵 Enviando áudio para Spawner: ${audioPath}`);
            
            // MUDANÇA: Não toca AudioEngine.playBGM aqui!
            // Passamos o caminho para o spawner gerenciar o delay
            this.spawner.start(audioPath);
            
        }, 1500);
    }

    handleInput(e) {
        if (!this.isPlaying || this.isPaused || e.repeat) return;
        const keyMap = { 'KeyD': 0, 'KeyF': 1, 'KeyJ': 2, 'KeyK': 3 };

        if (keyMap[e.code] !== undefined) {
            const laneIndex = keyMap[e.code];
            const hit = this.spawner.checkHit(laneIndex);
            
            if (hit) {
                this.triggerLane(laneIndex, 'hit');
                AudioEngine.playSFX('hit.mp3'); 
            } else {
                this.handleSpam(laneIndex);
            }
        }
    }

    handleKeyUp(e) {
        if (!this.isPlaying || this.isPaused) return;
        const keyMap = { 'KeyD': 0, 'KeyF': 1, 'KeyJ': 2, 'KeyK': 3 };
        
        if (keyMap[e.code] !== undefined) {
            const laneIndex = keyMap[e.code];
            const lanes = document.querySelectorAll('.lane');
            if (lanes[laneIndex]) {
                lanes[laneIndex].querySelector('.hit-zone').classList.remove('hit-active', 'spam-active');
            }
            this.spawner.checkLift(laneIndex);
        }
    }

    triggerLane(index, type = 'hit') {
        const lanes = document.querySelectorAll('.lane');
        if (lanes[index]) {
            const hitZone = lanes[index].querySelector('.hit-zone');
            hitZone.classList.remove('hit-active', 'spam-active');
            void hitZone.offsetWidth;
            if (type === 'hit') hitZone.classList.add('hit-active');
            else hitZone.classList.add('spam-active');
        }
    }

    handleSpam(laneIndex) {
        this.triggerLane(laneIndex, 'spam');
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
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

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
        if (this.startTimeout) clearTimeout(this.startTimeout);
        if (this.spawner) this.spawner.stop();
        AudioEngine.stopBGM();
        document.removeEventListener('keydown', this.handleKeyDownBound);
        document.removeEventListener('keyup', this.handleKeyUpBound);
    }
}   