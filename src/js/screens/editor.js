import Router from '../router.js';
import AudioEngine from '../audioEngine.js';
import Storage from '../storage.js'; // <--- Importante

export default class EditorScreen {
    constructor(params) {
        this.songId = params.songId || 'song1';
        this.recordedNotes = [];
        this.isPlaying = false;
        this.activeHolds = {}; 
        
        // Carrega teclas
        this.keybinds = Storage.get('keybinds') || ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];

        this.handleKeyDownBound = this.handleKeyDown.bind(this);
        this.handleKeyUpBound = this.handleKeyUp.bind(this);
        this.handleStartBound = this.handleStart.bind(this);
    }

    render() {
        return `
            <div class="screen-container game-screen">
                <div class="game-ui">
                    <div class="score-box" style="width: 100%; text-align: center;">
                        <span class="label" style="color: red;">🔴 REC MODE</span>
                        <span id="rec-count" style="font-size: 2rem; display: block;">0 NOTES</span>
                    </div>
                </div>
                
                <button id="btn-export" style="position: absolute; top: 20px; right: 20px; z-index: 200; padding: 10px 20px; background: var(--color-bocchi); border: none; color: white; font-family: var(--font-display); cursor: pointer;">
                    EXPORT JSON
                </button>

                <div class="track-container">
                    <div class="lane" id="lane-0"><div class="key-hint"></div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-1"><div class="key-hint"></div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-2"><div class="key-hint"></div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-3"><div class="key-hint"></div><div class="hit-zone"></div></div>
                </div>

                <div class="game-overlay" id="start-overlay">
                    <div class="countdown">PRESS SPACE</div>
                </div>
            </div>
        `;
    }

    init() {
        this.updateKeyHints();

        document.addEventListener('keydown', this.handleKeyDownBound);
        document.addEventListener('keyup', this.handleKeyUpBound);
        document.addEventListener('keydown', this.handleStartBound);
        
        document.getElementById('btn-export').addEventListener('click', () => this.exportJSON());
    }

    updateKeyHints() {
        const hints = document.querySelectorAll('.key-hint');
        this.keybinds.forEach((code, index) => {
            if (hints[index]) {
                hints[index].innerText = code.replace('Key', '').replace('Digit', '');
            }
        });
    }

    handleStart(e) {
        if (e.code === 'Space' && !this.isPlaying) {
            document.removeEventListener('keydown', this.handleStartBound);
            this.startRecording();
        }
    }

    startRecording() {
        document.getElementById('start-overlay').style.display = 'none';
        this.isPlaying = true;
        
        // Tenta pegar o nome base do arquivo de áudio
        const audioFile = this.songId.split('_')[0]; 
        AudioEngine.playBGM(`./assets/audio/${audioFile}.mp3`);
        console.log("🔴 GRAVANDO...");
    }

    handleKeyDown(e) {
        if (!this.isPlaying || e.repeat) return;

        // --- MAPEAMENTO DINÂMICO ---
        const lane = this.keybinds.indexOf(e.code);

        if (lane !== -1) {
            const time = AudioEngine.bgmAudio.currentTime;
            this.activeHolds[lane] = time;
            this.triggerLane(lane, true);
        }
    }

    handleKeyUp(e) {
        if (!this.isPlaying) return;

        // --- MAPEAMENTO DINÂMICO ---
        const lane = this.keybinds.indexOf(e.code);

        if (lane !== -1) {
            if (this.activeHolds[lane] === undefined) return;

            const startTime = this.activeHolds[lane];
            const endTime = AudioEngine.bgmAudio.currentTime;
            const duration = endTime - startTime;

            delete this.activeHolds[lane];
            this.triggerLane(lane, false);

            const finalDuration = duration > 0.15 ? duration : 0;

            this.recordedNotes.push({
                time: Math.round(startTime * 1000) / 1000,
                lane: lane,
                duration: Math.round(finalDuration * 1000) / 1000
            });

            this.updateCounter();
        }
    }

    triggerLane(index, isActive) {
        const lanes = document.querySelectorAll('.lane');
        if (lanes[index]) {
            const hitZone = lanes[index].querySelector('.hit-zone');
            if (isActive) hitZone.classList.add('hit-active');
            else hitZone.classList.remove('hit-active');
            
            if (isActive) {
                const ghost = document.createElement('div');
                ghost.className = 'note';
                ghost.style.bottom = '50px';
                ghost.style.background = 'rgba(255,255,255,0.5)';
                ghost.style.transition = 'none';
                lanes[index].appendChild(ghost);
                setTimeout(() => ghost.remove(), 100);
            }
        }
    }

    updateCounter() {
        const el = document.getElementById('rec-count');
        if(el) el.innerText = `${this.recordedNotes.length} NOTES`;
    }

    exportJSON() {
        this.isPlaying = false;
        AudioEngine.stopBGM();
        this.recordedNotes.sort((a, b) => a.time - b.time);

        const jsonOutput = {
            title: "Chart Gravado",
            bpm: 0, 
            offset: 0,
            notes: this.recordedNotes
        };

        console.clear();
        console.log(JSON.stringify(jsonOutput, null, 4));
        alert("JSON gerado no Console! Copie e salve no arquivo correto.");
        Router.navigate('select');
    }

    destroy() {
        this.isPlaying = false;
        AudioEngine.stopBGM();
        document.removeEventListener('keydown', this.handleKeyDownBound);
        document.removeEventListener('keyup', this.handleKeyUpBound);
        document.removeEventListener('keydown', this.handleStartBound);
    }
}