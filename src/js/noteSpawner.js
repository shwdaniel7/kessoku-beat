import AudioEngine from './audioEngine.js';

export default class NoteSpawner {
    constructor(chartId, gameInstance, speed) {
        this.chartId = chartId;
        this.game = gameInstance;
        
        this.chartNotes = [];
        this.activeNotes = [];
        
        this.noteSpeed = speed || 1.3; 
        this.hitWindow = 0.15;
        this.perfectWindow = 0.05;
        
        this.notePool = []; 
        this.poolSize = 50;
        
        this.isPlaying = false;
        
        // Variáveis para o Delay Inicial
        this.audioDelay = 0;     // Quanto tempo esperar (vem do JSON offset)
        this.startTime = 0;      // Quando o jogo começou visualmente
        this.audioStarted = false; // Se a música já começou
        this.audioPath = '';     // Caminho do arquivo de som

        const trackEl = document.querySelector('.track-container');
        this.trackHeight = trackEl ? trackEl.offsetHeight : window.innerHeight; 
        this.hitLineY = this.trackHeight - 50; 

        this.initPool();
    }

    initPool() {
        for (let i = 0; i < this.poolSize; i++) {
            const el = document.createElement('div');
            el.classList.add('note');
            el.style.visibility = 'hidden';
            el.style.transform = 'translate3d(0, -200px, 0)';
            this.notePool.push(el);
        }
    }

    getNoteFromPool() {
        if (this.notePool.length > 0) return this.notePool.pop();
        const el = document.createElement('div');
        el.classList.add('note');
        return el;
    }

    returnNoteToPool(el) {
        el.className = 'note'; 
        const tail = el.querySelector('.note-hold-body');
        if (tail) tail.remove();
        el.style.visibility = 'hidden';
        el.style.transform = 'translate3d(0, -200px, 0)';
        if (el.parentNode) el.parentNode.removeChild(el);
        this.notePool.push(el);
    }

    // --- MUDANÇA: Recebe o caminho do áudio para tocar depois ---
    async start(audioPath) {
        this.audioPath = audioPath;
        const path = `./assets/charts/${this.chartId}.json`;
        
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error("Chart não encontrado");
            
            const data = await response.json();
            
            // Pega o offset do JSON (se não tiver, usa 0)
            this.audioDelay = data.offset || 0;

            this.chartNotes = data.notes.map(n => ({
                ...n,
                // AQUI É O TRUQUE: Somamos o delay ao tempo da nota
                // Se a nota é em 0.5s e delay é 2.0s, ela vira 2.5s
                realTime: n.time + this.audioDelay, 
                
                // SpawnTime considera a velocidade de queda
                spawnTime: (n.time + this.audioDelay) - this.noteSpeed,
                
                hit: false,
                isHolding: false,
                endTime: n.duration ? (n.time + this.audioDelay) + n.duration : (n.time + this.audioDelay)
            })).sort((a, b) => a.spawnTime - b.spawnTime);

            // Calcula fim do jogo
            if (this.chartNotes.length > 0) {
                const lastNote = this.chartNotes[this.chartNotes.length - 1];
                this.endTime = lastNote.endTime + 3.0; 
            } else {
                this.endTime = 10.0;
            }

            // Inicia o relógio visual
            this.startTime = performance.now();
            this.audioStarted = false;
            this.isPlaying = true;
            this.loop();
            
        } catch (e) {
            console.error("Erro chart:", e);
            this.game.endGame();
        }
    }

    loop() {
        if (!this.isPlaying) return;

        // --- LÓGICA HÍBRIDA DE TEMPO ---
        let currentTime;

        if (!this.audioStarted) {
            // Se a música ainda não começou, usamos o relógio do sistema
            const rawTime = (performance.now() - this.startTime) / 1000;
            
            // Verifica se já deu o tempo do delay
            if (rawTime >= this.audioDelay) {
                // HORA DE TOCAR A MÚSICA!
                console.log("🎧 Iniciando Áudio Sincronizado!");
                AudioEngine.playBGM(this.audioPath, false);
                this.audioStarted = true;
                
                // Pequeno ajuste para evitar pulo visual na troca de relógio
                currentTime = this.audioDelay + AudioEngine.bgmAudio.currentTime;
            } else {
                // Ainda estamos no silêncio (Pre-roll)
                currentTime = rawTime;
            }
        } else {
            // Música tocando: O mestre é o AudioEngine (mais preciso)
            // Somamos o delay porque as notas foram empurradas pra frente
            currentTime = this.audioDelay + AudioEngine.bgmAudio.currentTime;
        }

        // Verifica Fim de Jogo
        const audioEnded = AudioEngine.bgmAudio ? AudioEngine.bgmAudio.ended : false;
        if ((currentTime > this.endTime || (this.audioStarted && audioEnded)) && this.activeNotes.length === 0) {
            this.stop();
            this.game.endGame();
            return;
        }

        // 1. SPAWN
        while (this.chartNotes.length > 0 && currentTime >= this.chartNotes[0].spawnTime) {
            const noteData = this.chartNotes.shift();
            this.spawnNote(noteData);
        }

        // 2. MOVER
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const noteObj = this.activeNotes[i];
            
            // Usa realTime (que já tem o offset somado)
            const targetTime = noteObj.data.realTime; 

            if (noteObj.data.isHolding) {
                // Lógica de Hold
                const noteEndTime = noteObj.data.endTime;
                
                if (currentTime >= noteEndTime) {
                    this.completeHold(i);
                    continue;
                }
                noteObj.el.style.transform = `translate3d(0, ${this.hitLineY}px, 0)`;
                const tail = noteObj.el.querySelector('.note-hold-body');
                if (tail) {
                    const remainingTime = noteEndTime - currentTime;
                    const newHeight = (remainingTime / this.noteSpeed) * this.hitLineY;
                    tail.style.height = `${newHeight}px`;
                    tail.style.top = `-${newHeight}px`;
                }
            } else {
                // Lógica Normal
                const timeUntilHit = targetTime - currentTime;
                const progress = 1 - (timeUntilHit / this.noteSpeed);
                const y = progress * this.hitLineY;

                noteObj.el.style.transform = `translate3d(0, ${y}px, 0)`;

                if (timeUntilHit < -this.hitWindow && !noteObj.data.hit) {
                    this.handleMiss(i);
                }
            }
        }

        requestAnimationFrame(this.loop.bind(this));
    }

    spawnNote(noteData) {
        const laneEl = document.getElementById(`lane-${noteData.lane}`);
        if (!laneEl) return;

        const el = this.getNoteFromPool();
        if (noteData.lane === 1 || noteData.lane === 2) el.classList.add('note-center');
        
        if (noteData.duration && noteData.duration > 0) {
            const tail = document.createElement('div');
            tail.className = 'note-hold-body';
            const heightPixels = (noteData.duration / this.noteSpeed) * this.hitLineY;
            tail.style.height = `${heightPixels}px`;
            tail.style.top = `-${heightPixels}px`;
            el.appendChild(tail);
        }

        el.style.visibility = 'visible';
        laneEl.appendChild(el);
        this.activeNotes.push({ el, data: noteData });
    }

    checkHit(laneIndex) {
        // Precisamos usar o tempo ajustado (com delay) para verificar o hit
        let currentTime;
        if (this.audioStarted) {
            currentTime = this.audioDelay + AudioEngine.bgmAudio.currentTime;
        } else {
            currentTime = (performance.now() - this.startTime) / 1000;
        }

        const noteIndex = this.activeNotes.findIndex(n => 
            n.data.lane === laneIndex && 
            !n.data.isHolding && 
            Math.abs(n.data.realTime - currentTime) <= this.hitWindow
        );

        if (noteIndex !== -1) {
            const note = this.activeNotes[noteIndex];
            
            if (!note.data.duration || note.data.duration <= 0) {
                this.processNormalHit(note, noteIndex, currentTime);
                return true;
            } else {
                note.data.hit = true;
                note.data.isHolding = true;
                note.el.classList.add('note-holding'); 
                this.game.showFeedback('HOLD'); 
                return true;
            }
        }
        return false;
    }

    checkLift(laneIndex) {
        let currentTime;
        if (this.audioStarted) {
            currentTime = this.audioDelay + AudioEngine.bgmAudio.currentTime;
        } else {
            currentTime = (performance.now() - this.startTime) / 1000;
        }

        const noteIndex = this.activeNotes.findIndex(n => 
            n.data.lane === laneIndex && n.data.isHolding
        );

        if (noteIndex !== -1) {
            const note = this.activeNotes[noteIndex];
            const timeRemaining = note.data.endTime - currentTime;
            
            if (timeRemaining > 0.2) {
                this.handleMiss(noteIndex);
            } else {
                this.completeHold(noteIndex);
            }
        }
    }

    processNormalHit(note, index, currentTime) {
        note.data.hit = true;
        note.el.classList.add('note-hit');
        this.activeNotes.splice(index, 1);
        setTimeout(() => this.returnNoteToPool(note.el), 100);
        
        const diff = Math.abs(note.data.realTime - currentTime);
        let scoreType = 'GOOD';
        let points = 50;
        if (diff < this.perfectWindow) { scoreType = 'PERFECT'; points = 100; }

        this.game.showFeedback(scoreType);
        this.game.updateScore(points, scoreType);
    }

    completeHold(index) {
        const note = this.activeNotes[index];
        note.el.classList.remove('note-holding');
        note.el.classList.add('note-hit');
        this.activeNotes.splice(index, 1);
        setTimeout(() => this.returnNoteToPool(note.el), 100);
        this.game.showFeedback('PERFECT');
        this.game.updateScore(200, 'PERFECT');
    }

    handleMiss(index) {
        const note = this.activeNotes[index];
        note.el.classList.remove('note-holding');
        note.el.classList.add('note-miss');
        this.activeNotes.splice(index, 1);
        setTimeout(() => this.returnNoteToPool(note.el), 200);
        this.game.showFeedback('MISS');
        this.game.updateScore(0, 'MISS');
    }

    stop() {
        this.isPlaying = false;
        this.activeNotes.forEach(n => this.returnNoteToPool(n.el));
        this.activeNotes = [];
    }
}