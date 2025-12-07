import Router from '../router.js';
import AudioEngine from '../audioEngine.js';
import NoteSpawner from '../noteSpawner.js';
import Storage from '../storage.js';

export default class GameScreen {
    constructor(params) {
        this.songId = params.songId || 'song1';
        this.chartId = params.chartId || 'song1_hard';
        this.noteSpeed = params.noteSpeed || 1.3;
        this.mods = params.mods || { auto: false, sudden: false, speedUp: false };
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hits = { perfect: 0, good: 0, miss: 0 };
        
        // Fever
        this.fever = 0;
        this.maxFever = 100;
        this.isFeverActive = false;
        this.feverDuration = 8000;

        this.isPlaying = false;
        this.isPaused = false;
        this.spawner = null;
        this.startTimeout = null;
        
        this.keybinds = Storage.get('keybinds') || ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];

        // --- CORREÇÃO DO NaN ---
        // Padronizei tudo para 'scoreMultiplier'
        this.scoreMultiplier = 1.0;
        if (!this.mods.auto) {
            if (this.mods.speedUp) this.scoreMultiplier += 0.1;
            if (this.mods.sudden) this.scoreMultiplier += 0.2;
        }
    }

    render() {
        let modsText = "";
        if (this.mods.auto) modsText += " [AUTO]";
        if (this.mods.sudden) modsText += " [SUDDEN]";
        if (this.mods.speedUp) modsText += " [SPEED UP]";

        return `
            <div class="screen-container game-screen" id="game-screen-el">
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
                
                <!-- KITA CUT-IN (GIF) -->
                <div class="kita-cutin" id="kita-cutin">
                    <!-- Mudei para .gif aqui -->
                    <img src="./assets/images/kita_fever.gif" alt="Kita Aura">
                </div>

                <div class="fever-container" id="fever-container">
                    <div class="fever-fill" id="fever-fill"></div>
                    <div class="fever-text">SPACE!</div>
                </div>

                <div style="position: absolute; top: 10px; width: 100%; text-align: center; color: #aaa; font-family: var(--font-display); font-size: 0.8rem; letter-spacing: 2px; z-index: 50;">
                    ${modsText}
                </div>

                <div id="feedback-container"></div>
                
                <div class="track-container">
                    <div class="lane" id="lane-0"><div class="lane-beam"></div><div class="key-hint"></div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-1"><div class="lane-beam"></div><div class="key-hint"></div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-2"><div class="lane-beam"></div><div class="key-hint"></div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-3"><div class="lane-beam"></div><div class="key-hint"></div><div class="hit-zone"></div></div>
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

                <div class="game-overlay" id="fail-overlay" style="display: none; background: rgba(50, 0, 0, 0.9);">
                    <div class="pause-menu" style="border-color: red; box-shadow: 0 0 50px red;">
                        <h2 style="color: red; text-shadow: none;">FAILED</h2>
                        <p style="color: white; margin-bottom: 20px; font-family: var(--font-display);">SUDDEN DEATH</p>
                        <button id="btn-fail-retry" class="btn-primary">TRY AGAIN</button>
                        <button id="btn-fail-quit" class="btn-primary">GIVE UP</button>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        this.spawner = new NoteSpawner(this.chartId, this, this.noteSpeed, this.mods);
        this.updateKeyHints();

        this.handleKeyDownBound = (e) => {
            if (e.key === 'Escape') this.togglePause();
            else if (e.code === 'Space') this.activateFever();
            else this.handleInput(e);
        };
        this.handleKeyUpBound = (e) => this.handleKeyUp(e);

        document.addEventListener('keydown', this.handleKeyDownBound);
        document.addEventListener('keyup', this.handleKeyUpBound);

        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-retry').addEventListener('click', () => this.restart());
        document.getElementById('btn-fail-retry').addEventListener('click', () => this.restart());
        document.getElementById('btn-quit').addEventListener('click', () => this.quit());
        document.getElementById('btn-fail-quit').addEventListener('click', () => this.quit());

        this.startCountdown();
    }

    activateFever() {
        if (this.isPaused || !this.isPlaying) return;

        if (this.fever >= this.maxFever && !this.isFeverActive) {
            this.isFeverActive = true;
            
            const screen = document.getElementById('game-screen-el');
            const container = document.getElementById('fever-container');
            const kitaCutin = document.getElementById('kita-cutin');

            screen.classList.add('fever-active');
            container.classList.remove('fever-ready');
            
            if (kitaCutin) kitaCutin.classList.add('active');
            
            AudioEngine.playSFX('kita_aura.mp3'); 
            this.showFeedback('FEVER!');

            const fill = document.getElementById('fever-fill');
            fill.style.transition = `height ${this.feverDuration}ms linear`;
            fill.style.height = '0%';

            setTimeout(() => {
                this.isFeverActive = false;
                this.fever = 0;
                
                screen.classList.remove('fever-active');
                if (kitaCutin) kitaCutin.classList.remove('active');
                
                fill.style.transition = 'height 0.2s ease-out';
            }, this.feverDuration);
        }
    }

    updateFever(amount) {
        if (this.isFeverActive) return;

        this.fever = Math.min(this.maxFever, this.fever + amount);
        
        const fill = document.getElementById('fever-fill');
        const container = document.getElementById('fever-container');
        
        if (fill) fill.style.height = `${this.fever}%`;

        if (this.fever >= this.maxFever) {
            container.classList.add('fever-ready');
        } else {
            container.classList.remove('fever-ready');
        }
    }

    updateKeyHints() {
        const hints = document.querySelectorAll('.key-hint');
        this.keybinds.forEach((code, index) => {
            if (hints[index]) {
                hints[index].innerText = code.replace('Key', '').replace('Digit', '');
            }
        });
    }

    restart() {
        this.destroy();
        Router.navigate('game', { 
            songId: this.songId, 
            chartId: this.chartId,
            noteSpeed: this.noteSpeed,
            mods: this.mods 
        });
    }

    quit() {
        this.destroy();
        AudioEngine.playBGM(`./assets/audio/${this.songId}.mp3`, true);
        Router.navigate('select');
    }

    togglePause() {
        if (document.getElementById('start-overlay').style.display !== 'none') return;
        if (document.getElementById('fail-overlay').style.display !== 'none') return;

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
            this.spawner.start(audioPath);
        }, 1500);
    }

    handleInput(e) {
        if (this.mods.auto) return;
        if (!this.isPlaying || this.isPaused || e.repeat) return;
        
        const laneIndex = this.keybinds.indexOf(e.code);

        if (laneIndex !== -1) {
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
        if (this.mods.auto) return;
        if (!this.isPlaying || this.isPaused) return;
        
        const laneIndex = this.keybinds.indexOf(e.code);
        
        if (laneIndex !== -1) {
            const lanes = document.querySelectorAll('.lane');
            if (lanes[laneIndex]) {
                lanes[laneIndex].querySelector('.hit-zone').classList.remove('hit-active', 'spam-active');
                const beam = lanes[laneIndex].querySelector('.lane-beam');
                if (beam) beam.classList.remove('beam-active');
            }
            this.spawner.checkLift(laneIndex);
        }
    }

    triggerLane(index, type = 'hit') {
        const lanes = document.querySelectorAll('.lane');
        if (lanes[index]) {
            const hitZone = lanes[index].querySelector('.hit-zone');
            const beam = lanes[index].querySelector('.lane-beam');

            hitZone.classList.remove('hit-active', 'spam-active');
            if (beam) beam.classList.remove('beam-active');
            void hitZone.offsetWidth;

            if (type === 'hit') {
                hitZone.classList.add('hit-active');
                if (beam) beam.classList.add('beam-active');
            } else {
                hitZone.classList.add('spam-active');
            }

            setTimeout(() => {
                if (beam) beam.classList.remove('beam-active');
            }, 150);
        }
    }

    handleSpam(laneIndex) {
        this.triggerLane(laneIndex, 'spam');
        this.combo = 0;
        const comboEl = document.getElementById('combo-val');
        comboEl.innerText = 0;
        comboEl.style.color = '#555';
        comboEl.classList.remove('combo-pulse');
        
        const screen = document.getElementById('game-screen-el');
        if (screen) screen.classList.remove('aura-1', 'aura-2');
        
        this.updateFever(-5);
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
            
            const screen = document.getElementById('game-screen-el');
            if (screen) screen.classList.remove('aura-1', 'aura-2');
            
            this.updateFever(-10);

        } else {
            let hitScore = points + (this.combo * 10);
            
            // --- CORREÇÃO DO NAN ---
            // Agora usamos a variável correta 'scoreMultiplier'
            hitScore = Math.round(hitScore * this.scoreMultiplier);

            if (this.isFeverActive) {
                hitScore *= 2;
            }

            this.score += hitScore;
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

            const feverGain = (type === 'PERFECT') ? 2 : 1;
            this.updateFever(feverGain);

            const comboEl = document.getElementById('combo-val');
            comboEl.classList.remove('combo-pulse');
            void comboEl.offsetWidth;
            comboEl.classList.add('combo-pulse');
            comboEl.style.color = 'var(--color-nijika)';

            const screen = document.getElementById('game-screen-el');
            if (screen) {
                if (this.combo >= 100) {
                    screen.classList.add('aura-2');
                    screen.classList.remove('aura-1');
                } else if (this.combo >= 50) {
                    screen.classList.add('aura-1');
                }
            }
        }
        
        document.getElementById('score-val').innerText = this.score;
        document.getElementById('combo-val').innerText = this.combo;
    }

    failGame() {
        this.isPlaying = false;
        AudioEngine.stopBGM();
        document.getElementById('fail-overlay').style.display = 'flex';
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
                rank: this.calculateRank(accuracy),
                chartId: this.chartId,
                isAuto: this.mods.auto
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