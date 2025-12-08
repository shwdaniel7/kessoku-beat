import Router from '../router.js';
import AudioEngine from '../audioEngine.js';
import NoteSpawner from '../noteSpawner.js';
import Storage from '../storage.js';
import { characters } from '../data/characters.js';
import { songList } from './select.js';
import Firebase from '../firebase.js';

export default class GameScreen {
    constructor(params) {
        // Identificadores
        this.songId = params.songId || 'song1';
        this.chartId = params.chartId || 'song1_hard';
        this.noteSpeed = params.noteSpeed || 1.3;
        this.mods = params.mods || { auto: false, sudden: false, speedUp: false };
        
        // Dados da Música
        this.songData = songList.find(s => s.id === this.songId) || { title: 'Unknown', artist: 'Unknown', cover: '' };

        // Estado do Jogo
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hits = { perfect: 0, good: 0, miss: 0 };
        
        // HP System
        this.hp = 100;
        this.maxHp = 100;
        
        // Personagem
        const charId = Storage.get('selectedCharId') || 'bocchi';
        this.character = characters.find(c => c.id === charId) || characters[0];
        
        // Buffs
        this.nijikaSafetyCount = 3; 
        
        // Fever
        this.fever = 0;
        this.maxFever = 100;
        this.isFeverActive = false;
        this.feverDuration = (this.character.buffId === 'long_fever') ? 15000 : 8000;

        this.isPlaying = false;
        this.isPaused = false;
        this.spawner = null;
        this.startTimeout = null;
        this.visualLoopActive = false;
        
        this.keybinds = Storage.get('keybinds') || ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];

        // Multiplicador
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
        modsText += ` | CHAR: ${this.character.name.split(' ')[0].toUpperCase()}`;

        return `
            <div class="screen-container game-screen" id="game-screen-el">
                
                <!-- INTRO (Apenas Imagem) -->
                <div class="cinematic-intro" id="cinematic-intro">
                    <div class="intro-content">
                        <div class="intro-cover">
                            <img src="./assets/images/${this.songData.cover}" alt="Cover">
                        </div>
                        <div class="intro-text">
                            <h1 class="intro-title">${this.songData.title}</h1>
                            <h2 class="intro-artist">${this.songData.artist}</h2>
                            <div class="intro-line"></div>
                        </div>
                    </div>
                    <div class="intro-ready" id="intro-ready">READY</div>
                </div>

                <!-- UI -->
                <div class="game-ui fade-in-target">
                    <div class="score-box">
                        <span class="label">SCORE</span>
                        <span id="score-val">0</span>
                    </div>
                    <div class="combo-box">
                        <span class="label">COMBO</span>
                        <span id="combo-val">0</span>
                    </div>
                </div>
                
                <!-- HP BAR -->
                <div class="hp-container fade-in-target">
                    <div class="hp-label">LIFE</div>
                    <div class="hp-bar-bg">
                        <div class="hp-bar-fill" id="hp-fill" style="height: 100%;"></div>
                    </div>
                </div>

                <!-- FEVER -->
                <div class="kita-cutin" id="kita-cutin">
                    <img src="./assets/images/kita_fever.gif" alt="Kita Aura">
                </div>

                <div class="fever-container fade-in-target" id="fever-container">
                    <div class="fever-fill" id="fever-fill"></div>
                    <div class="fever-text">SPACE!</div>
                </div>

                <div class="mods-indicator fade-in-target" style="position: absolute; top: 10px; width: 100%; text-align: center; color: #aaa; font-family: var(--font-display); font-size: 0.8rem; letter-spacing: 2px; z-index: 50;">
                    ${modsText}
                </div>

                <div id="feedback-container"></div>
                
                <!-- PARTÍCULAS -->
                <div id="particles-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 60;"></div>

                <!-- PISTA -->
                <div class="track-container fade-in-target">
                    <div class="lane" id="lane-0"><div class="lane-beam"></div><div class="key-hint"></div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-1"><div class="lane-beam"></div><div class="key-hint"></div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-2"><div class="lane-beam"></div><div class="key-hint"></div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-3"><div class="lane-beam"></div><div class="key-hint"></div><div class="hit-zone"></div></div>
                </div>

                <!-- OVERLAYS -->
                <div class="game-overlay" id="pause-overlay" style="display: none;">
                    <div class="pause-menu">
                        <h2>PAUSED</h2>
                        <button id="btn-resume" class="btn-primary">RESUME</button>
                        <button id="btn-retry" class="btn-primary">RETRY</button>
                        <button id="btn-quit" class="btn-primary">QUIT</button>
                    </div>
                </div>

                <div class="game-overlay" id="fail-overlay" style="display: none;">
                    <div class="pause-menu" style="border-color: red; box-shadow: 0 0 50px red;">
                        <h2 style="color: red; text-shadow: none;">FAILED</h2>
                        <p style="color: white; margin-bottom: 20px; font-family: var(--font-display);" id="fail-reason">HP DEPLETED</p>
                        <button id="btn-fail-retry" class="btn-primary">TRY AGAIN</button>
                        <button id="btn-fail-quit" class="btn-primary">GIVE UP</button>
                    </div>
                </div>
            </div>
        `;
    }

    async init() {
        this.applyTheme();

        // --- CARREGA SKINS DO USUÁRIO ---
        let userNoteSkin = 'note_default';
        let userLaneSkin = 'lane_default';
        
        const user = await new Promise(resolve => {
            const unsubscribe = Firebase.onUserChange(u => {
                resolve(u);
            });
        });
        
        if (user) {
            const userData = await Firebase.getUserData(user.uid);
            if (userData) {
                if (userData.equippedNote) userNoteSkin = userData.equippedNote;
                if (userData.equippedLane) userLaneSkin = userData.equippedLane;
            }
        }

        // --- APLICA SKIN DA PISTA ---
        const track = document.querySelector('.track-container');
        if (track) {
            track.className = 'track-container fade-in-target'; 
            track.classList.add(`skin-${userLaneSkin}`);
        }

        // --- INICIALIZA SPAWNER ---
        this.spawner = new NoteSpawner(this.chartId, this, this.noteSpeed, this.mods, userNoteSkin);
        
        this.updateKeyHints();

        // Bindings
        this.handleKeyDownBound = (e) => {
            if (e.key === 'Escape') this.togglePause();
            else if (e.code === 'Space') this.activateFever();
            else this.handleInput(e);
        };
        this.handleKeyUpBound = (e) => this.handleKeyUp(e);

        document.addEventListener('keydown', this.handleKeyDownBound);
        document.addEventListener('keyup', this.handleKeyUpBound);

        // Botões
        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-retry').addEventListener('click', () => this.restart());
        document.getElementById('btn-fail-retry').addEventListener('click', () => this.restart());
        document.getElementById('btn-quit').addEventListener('click', () => this.quit());
        document.getElementById('btn-fail-quit').addEventListener('click', () => this.quit());

        // Visual Loop (Bass Pulse)
        this.visualLoopActive = true;
        this.updateVisuals();

        // Start
        this.playCinematicIntro();
    }

    applyTheme() {
        const themeColor = this.character.color;
        document.documentElement.style.setProperty('--theme-color', themeColor);
    }

    updateVisuals() {
        if (!this.visualLoopActive) return;
        if (!document.body.classList.contains('low-spec')) {
            const bass = AudioEngine.getBassEnergy();
            const bg = document.querySelector('.game-screen');
            if (bg) {
                // Zoom sutil no fundo com a batida
                bg.style.backgroundSize = `${100 + (bass * 5)}%`; 
            }
        }
        requestAnimationFrame(() => this.updateVisuals());
    }

    playCinematicIntro() {
        const intro = document.getElementById('cinematic-intro');
        const readyText = document.getElementById('intro-ready');
        const gameElements = document.querySelectorAll('.fade-in-target');

        this.startTimeout = setTimeout(() => {
            readyText.style.opacity = '1';
            readyText.style.transform = 'scale(1)';
            AudioEngine.playSFX('hover.mp3');
        }, 1500);

        setTimeout(() => {
            intro.style.opacity = '0';
            intro.style.pointerEvents = 'none';
            gameElements.forEach(el => el.classList.add('visible'));
        }, 2500);

        setTimeout(() => {
            this.startGame();
        }, 3000);
    }

    startGame() {
        console.log("GO!");
        this.isPlaying = true;
        const audioPath = `./assets/audio/${this.songId}.mp3`;
        this.spawner.start(audioPath);
    }

    updateHP(amount) {
        if (this.mods.auto) return;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        
        const hpFill = document.getElementById('hp-fill');
        const screen = document.getElementById('game-screen-el');

        if (hpFill) {
            hpFill.style.height = `${this.hp}%`;
            
            // --- BOCCHI GLITCH (CRITICAL HP) ---
            if (this.hp < 20) {
                hpFill.classList.add('danger');
                screen.classList.add('critical-hp-effect'); // Ativa o glitch
            } else {
                hpFill.classList.remove('danger');
                screen.classList.remove('critical-hp-effect');
            }
        }

        if (this.hp <= 0) {
            this.failGame("HP DEPLETED");
        }
    }

    activateFever() {
        if (this.isPaused || !this.isPlaying) return;
        if (this.fever >= this.maxFever && !this.isFeverActive) {
            this.isFeverActive = true;
            const screen = document.getElementById('game-screen-el');
            const container = document.getElementById('fever-container');
            const kitaCutin = document.getElementById('kita-cutin');
            
            screen.classList.add('fever-active', 'fever-mode-visual');
            container.classList.remove('fever-ready');
            
            if (kitaCutin) kitaCutin.classList.add('active');
            
            AudioEngine.playSFX('kita_aura.mp3'); 
            this.showFeedback('FEVER!');
            this.triggerShake();

            const fill = document.getElementById('fever-fill');
            fill.style.transition = `height ${this.feverDuration}ms linear`;
            fill.style.height = '0%';

            setTimeout(() => {
                this.isFeverActive = false;
                this.fever = 0;
                
                screen.classList.remove('fever-active', 'fever-mode-visual');
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
        if (this.fever >= this.maxFever) container.classList.add('fever-ready');
        else container.classList.remove('fever-ready');
    }

    updateScore(points, type) {
        if (type === 'PERFECT') this.hits.perfect++;
        if (type === 'GOOD') this.hits.good++;
        if (type === 'MISS') this.hits.miss++;

        if (type === 'MISS') {
            if (this.character.buffId === 'safety_net' && this.nijikaSafetyCount > 0) {
                this.nijikaSafetyCount--;
                this.showFeedback('SAVED!');
                return;
            }
            this.combo = 0;
            const comboEl = document.getElementById('combo-val');
            comboEl.style.color = '#555';
            comboEl.classList.remove('combo-pulse');
            const screen = document.getElementById('game-screen-el');
            if (screen) screen.classList.remove('aura-1', 'aura-2');
            this.updateFever(-10);
            this.updateHP(-10);
        } else {
            let hitScore = points + (this.combo * 10);
            if (this.character.buffId === 'score_boost') hitScore = Math.round(hitScore * 1.1);
            hitScore = Math.round(hitScore * this.scoreMultiplier);
            if (this.isFeverActive) hitScore *= 2;
            this.score += hitScore;
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
            let feverGain = (type === 'PERFECT') ? 2 : 1;
            if (this.character.buffId === 'fever_boost') feverGain = Math.round(feverGain * 1.5);
            this.updateFever(feverGain);
            const heal = (type === 'PERFECT') ? 2 : 1;
            this.updateHP(heal);
            const comboEl = document.getElementById('combo-val');
            comboEl.classList.remove('combo-pulse');
            void comboEl.offsetWidth;
            comboEl.classList.add('combo-pulse');
            comboEl.style.color = 'var(--theme-color)';
            const screen = document.getElementById('game-screen-el');
            if (screen) {
                if (this.combo >= 100) {
                    screen.classList.add('aura-2');
                    screen.classList.remove('aura-1');
                } else if (this.combo >= 50) {
                    screen.classList.add('aura-1');
                }
            }
            
            // Shake apenas no Perfect (removido conforme pedido, mas mantido no Fever)
        }
        document.getElementById('score-val').innerText = this.score;
        document.getElementById('combo-val').innerText = this.combo;
    }

    spawnParticles(laneIndex) {
        if (document.body.classList.contains('low-spec')) return;
        const lanes = document.querySelectorAll('.lane');
        if (!lanes[laneIndex]) return;
        const hitZone = lanes[laneIndex].querySelector('.hit-zone');
        const rect = hitZone.getBoundingClientRect();
        const container = document.getElementById('particles-container');
        for (let i = 0; i < 6; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            p.style.left = `${x}px`;
            p.style.top = `${y}px`;
            const angle = Math.random() * Math.PI * 2;
            const velocity = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity - 50;
            p.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
            ], { duration: 500, easing: 'cubic-bezier(0, .9, .57, 1)' }).onfinish = () => p.remove();
            container.appendChild(p);
        }
    }

    triggerShake() {
        if (document.body.classList.contains('low-spec')) return;
        const screen = document.getElementById('game-screen-el');
        screen.classList.remove('shake-effect');
        void screen.offsetWidth;
        screen.classList.add('shake-effect');
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
                this.spawnParticles(index);
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

    updateKeyHints() {
        const hints = document.querySelectorAll('.key-hint');
        this.keybinds.forEach((code, index) => {
            if (hints[index]) hints[index].innerText = code.replace('Key', '').replace('Digit', '');
        });
    }

    failGame(reason = "SUDDEN DEATH") {
        this.isPlaying = false;
        AudioEngine.stopBGM();
        const reasonEl = document.getElementById('fail-reason');
        if (reasonEl) reasonEl.innerText = reason;
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

        let yenEarned = 0;
        yenEarned += Math.floor(this.maxCombo * 2); 
        const rank = this.calculateRank(accuracy);
        if (rank === 'SS') yenEarned += 500;
        else if (rank === 'S') yenEarned += 300;
        else if (rank === 'A') yenEarned += 150;
        else if (rank === 'B') yenEarned += 50;
        if (this.mods.speedUp) yenEarned = Math.round(yenEarned * 1.2);
        if (this.mods.sudden) yenEarned = Math.round(yenEarned * 1.5);
        if (this.mods.auto) yenEarned = 0;

        setTimeout(() => {
            Router.navigate('results', { 
                score: this.score, 
                maxCombo: this.maxCombo,
                accuracy: accuracy,
                rank: rank,
                chartId: this.chartId,
                isAuto: this.mods.auto,
                yen: yenEarned
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

    restart() {
        this.destroy();
        Router.navigate('game', { songId: this.songId, chartId: this.chartId, noteSpeed: this.noteSpeed, mods: this.mods });
    }

    quit() {
        this.destroy();
        AudioEngine.playBGM(`./assets/audio/${this.songId}.mp3`, true);
        Router.navigate('select');
    }

togglePause() {
        if (document.getElementById('cinematic-intro').style.opacity !== '0') return;
        if (document.getElementById('fail-overlay').style.display !== 'none') return;

        this.isPaused = !this.isPaused;
        const overlay = document.getElementById('pause-overlay');

        if (this.isPaused) {
            overlay.style.display = 'flex';
            AudioEngine.pauseBGM();
            
            // --- CORREÇÃO ---
            if (this.spawner) this.spawner.pause(); 
            // ----------------
        } else {
            overlay.style.display = 'none';
            AudioEngine.resumeBGM();
            
            // --- CORREÇÃO ---
            if (this.spawner) this.spawner.resume();
            // ----------------
        }
    }

    destroy() {
        this.visualLoopActive = false;
        document.documentElement.style.setProperty('--theme-color', '#E86CA6');
        if (this.startTimeout) clearTimeout(this.startTimeout);
        if (this.spawner) this.spawner.stop();
        AudioEngine.stopBGM();
        document.removeEventListener('keydown', this.handleKeyDownBound);
        document.removeEventListener('keyup', this.handleKeyUpBound);
    }
}