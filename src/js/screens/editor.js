import Router from '../router.js';
import AudioEngine from '../audioEngine.js';

export default class EditorScreen {
    constructor(params) {
        this.songId = params.songId || 'song1';
        this.recordedNotes = [];
        this.isPlaying = false;
        
        // BINDING: Precisamos disso para poder remover o evento depois
        // Se não fizermos isso, o removeEventListener não funciona
        this.handleInputBound = this.handleInput.bind(this);
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
        // Adiciona os ouvintes de evento usando as referências salvas
        document.addEventListener('keydown', this.handleInputBound);
        document.addEventListener('keydown', this.handleStartBound);
        
        document.getElementById('btn-export').addEventListener('click', () => {
            this.exportJSON();
        });
    }

    handleStart(e) {
        if (e.code === 'Space' && !this.isPlaying) {
            // Remove o listener de espaço para não reiniciar sem querer
            document.removeEventListener('keydown', this.handleStartBound);
            this.startRecording();
        }
    }

    startRecording() {
        const overlay = document.getElementById('start-overlay');
        if(overlay) overlay.style.display = 'none';
        
        this.isPlaying = true;
        
        const audioPath = `./assets/audio/${this.songId}.mp3`;
        AudioEngine.playBGM(audioPath);
        console.log("🔴 GRAVANDO...");
    }

    handleInput(e) {
        if (!this.isPlaying) return;

        // CORREÇÃO 1: Ignora se a tecla estiver sendo segurada (auto-repeat)
        if (e.repeat) return;

        const keyMap = { 'KeyD': 0, 'KeyF': 1, 'KeyJ': 2, 'KeyK': 3 };

        if (keyMap[e.code] !== undefined) {
            const lane = keyMap[e.code];
            const time = AudioEngine.bgmAudio.currentTime;

            // Arredonda para evitar números gigantes
            const cleanTime = Math.round(time * 1000) / 1000;
            
            this.recordedNotes.push({
                time: cleanTime,
                lane: lane
            });

            this.triggerLane(lane);
            this.updateCounter();
        }
    }

    triggerLane(index) {
        const lanes = document.querySelectorAll('.lane');
        if (lanes[index]) {
            const hitZone = lanes[index].querySelector('.hit-zone');
            hitZone.classList.add('hit-active');
            
            const ghost = document.createElement('div');
            ghost.className = 'note';
            ghost.style.bottom = '50px';
            ghost.style.background = 'rgba(255,255,255,0.5)';
            // Remove transição para feedback instantâneo
            ghost.style.transition = 'none'; 
            
            lanes[index].appendChild(ghost);

            setTimeout(() => {
                hitZone.classList.remove('hit-active');
                ghost.remove();
            }, 100);
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

        // Tenta pegar o BPM da lista se possível, senão usa padrão
        const jsonOutput = {
            title: "Minha Musica Gravada",
            bpm: 180, 
            offset: 0,
            notes: this.recordedNotes
        };

        console.clear();
        console.log("%c COPIE O OBJETO ABAIXO:", "color: lime; font-size: 20px;");
        console.log(JSON.stringify(jsonOutput, null, 4));
        
        alert("JSON gerado no Console (F12)! Copie e cole no arquivo da música.");
        
        // Volta para o menu ou seleção
        Router.navigate('select');
    }

    // CORREÇÃO 2: Limpeza de memória
    destroy() {
        this.isPlaying = false;
        AudioEngine.stopBGM();
        
        // Remove os eventos globais para não duplicar na próxima vez
        document.removeEventListener('keydown', this.handleInputBound);
        document.removeEventListener('keydown', this.handleStartBound);
        
        console.log("Editor destruído e eventos limpos.");
    }
}