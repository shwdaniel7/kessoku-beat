import Router from '../router.js';
import AudioEngine from '../audioEngine.js';

export default class EditorScreen {
    constructor(params) {
        this.songId = params.songId || 'song1';
        this.recordedNotes = [];
        this.isPlaying = false;
        
        // Armazena o tempo que a tecla foi apertada { lane: timestamp }
        this.activeHolds = {}; 

        // Bindings
        this.handleKeyDownBound = this.handleKeyDown.bind(this);
        this.handleKeyUpBound = this.handleKeyUp.bind(this);
        this.handleStartBound = this.handleStart.bind(this);
    }

    render() {
        return `
            <div class="screen-container game-screen">
                <div class="game-ui">
                    <div class="score-box" style="width: 100%; text-align: center;">
                        <span class="label" style="color: red;">🔴 REC MODE (HOLD SUPPORT)</span>
                        <span id="rec-count" style="font-size: 2rem; display: block;">0 NOTES</span>
                    </div>
                </div>
                
                <button id="btn-export" style="position: absolute; top: 20px; right: 20px; z-index: 200; padding: 10px 20px; background: var(--color-bocchi); border: none; color: white; font-family: var(--font-display); cursor: pointer;">
                    EXPORT JSON
                </button>

                <div class="track-container">
                    <div class="lane" id="lane-0"><div class="key-hint">D</div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-1"><div class="key-hint">F</div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-2"><div class="key-hint">J</div><div class="hit-zone"></div></div>
                    <div class="lane" id="lane-3"><div class="key-hint">K</div><div class="hit-zone"></div></div>
                </div>

                <div class="game-overlay" id="start-overlay">
                    <div class="countdown">PRESS SPACE</div>
                </div>
            </div>
        `;
    }

    init() {
        document.addEventListener('keydown', this.handleKeyDownBound);
        document.addEventListener('keyup', this.handleKeyUpBound);
        document.addEventListener('keydown', this.handleStartBound);
        
        document.getElementById('btn-export').addEventListener('click', () => this.exportJSON());
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
        // Tenta carregar o áudio base (assumindo que o nome do arquivo é o começo do ID)
        // Ex: song1_hard -> carrega song1.mp3. 
        // Se seus arquivos de audio e chart tiverem nomes muito diferentes, precisará ajustar aqui.
        const audioFile = this.songId.split('_')[0]; 
        AudioEngine.playBGM(`./assets/audio/${audioFile}.mp3`);
        console.log("🔴 GRAVANDO...");
    }

    handleKeyDown(e) {
        if (!this.isPlaying || e.repeat) return;

        const keyMap = { 'KeyD': 0, 'KeyF': 1, 'KeyJ': 2, 'KeyK': 3 };
        if (keyMap[e.code] !== undefined) {
            const lane = keyMap[e.code];
            const time = AudioEngine.bgmAudio.currentTime;
            
            // Marca o início do aperto
            this.activeHolds[lane] = time;
            
            // Feedback visual (Início)
            this.triggerLane(lane, true);
        }
    }

    handleKeyUp(e) {
        if (!this.isPlaying) return;

        const keyMap = { 'KeyD': 0, 'KeyF': 1, 'KeyJ': 2, 'KeyK': 3 };
        if (keyMap[e.code] !== undefined) {
            const lane = keyMap[e.code];
            
            // Se não tiver um início registrado, ignora
            if (this.activeHolds[lane] === undefined) return;

            const startTime = this.activeHolds[lane];
            const endTime = AudioEngine.bgmAudio.currentTime;
            const duration = endTime - startTime;

            // Limpa o registro
            delete this.activeHolds[lane];

            // Feedback visual (Fim)
            this.triggerLane(lane, false);

            // Salva a nota
            // Se for muito curto (< 0.15s), considera nota normal (duration 0)
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