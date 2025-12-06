import AudioEngine from './audioEngine.js';

export default class NoteSpawner {
    constructor(chartId, gameInstance) {
        this.chartId = chartId;
        this.game = gameInstance;
        
        this.chartNotes = [];
        this.activeNotes = [];
        
        // --- CONFIGURAÇÕES DE BALANCEAMENTO ---
        this.noteSpeed = 1.3; 
        this.hitWindow = 0.15; // 150ms (Padrão Rhythm Game)
        this.perfectWindow = 0.05; // 50ms (Exige precisão)
        
        // --- POOLING ---
        this.notePool = []; 
        this.poolSize = 50;
        
        this.isPlaying = false;

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
        
        // Limpa cauda se tiver
        const tail = el.querySelector('.note-hold-body');
        if (tail) tail.remove();

        el.style.visibility = 'hidden';
        el.style.transform = 'translate3d(0, -200px, 0)';
        
        if (el.parentNode) el.parentNode.removeChild(el);
        this.notePool.push(el);
    }

    async start() {
        const path = `./assets/charts/${this.chartId}.json`;
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error("Chart não encontrado");
            
            const data = await response.json();
            
            this.chartNotes = data.notes.map(n => ({
                ...n,
                spawnTime: n.time - this.noteSpeed,
                hit: false,
                isHolding: false,
                endTime: n.duration ? n.time + n.duration : n.time
            })).sort((a, b) => a.spawnTime - b.spawnTime);

            // Calcula fim do jogo
            if (this.chartNotes.length > 0) {
                const lastNote = this.chartNotes[this.chartNotes.length - 1];
                this.endTime = lastNote.endTime + 3.0; 
            } else {
                this.endTime = 10.0;
            }

            this.isPlaying = true;
            this.loop();
        } catch (e) {
            console.error("Erro chart:", e);
            this.game.endGame();
        }
    }

    loop() {
        if (!this.isPlaying) return;

        const currentTime = AudioEngine.bgmAudio ? AudioEngine.bgmAudio.currentTime : 0;
        const audioEnded = AudioEngine.bgmAudio ? AudioEngine.bgmAudio.ended : false;

        // Verifica Fim de Jogo
        if ((currentTime > this.endTime || audioEnded) && this.activeNotes.length === 0) {
            this.stop();
            this.game.endGame();
            return;
        }

        // 1. SPAWN
        while (this.chartNotes.length > 0 && currentTime >= this.chartNotes[0].spawnTime) {
            const noteData = this.chartNotes.shift();
            this.spawnNote(noteData);
        }

        // 2. MOVER E PROCESSAR
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const noteObj = this.activeNotes[i];
            
            // --- LÓGICA DE HOLD (SEGURANDO) ---
            if (noteObj.data.isHolding) {
                if (currentTime >= noteObj.data.endTime) {
                    this.completeHold(i);
                    continue;
                }

                // Visual: Consome a cauda
                noteObj.el.style.transform = `translate3d(0, ${this.hitLineY}px, 0)`;
                
                const tail = noteObj.el.querySelector('.note-hold-body');
                if (tail) {
                    const remainingTime = noteObj.data.endTime - currentTime;
                    const newHeight = (remainingTime / this.noteSpeed) * this.hitLineY;
                    tail.style.height = `${newHeight}px`;
                    tail.style.top = `-${newHeight}px`;
                }

            } else {
                // --- LÓGICA NORMAL (CAINDO) ---
                const timeUntilHit = noteObj.data.time - currentTime;
                const progress = 1 - (timeUntilHit / this.noteSpeed);
                const y = progress * this.hitLineY;

                noteObj.el.style.transform = `translate3d(0, ${y}px, 0)`;

                // MISS (Passou da linha)
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
        
        // Desenha Cauda
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

    // CHAMADO NO KEYDOWN
    checkHit(laneIndex) {
        const currentTime = AudioEngine.bgmAudio.currentTime;

        const noteIndex = this.activeNotes.findIndex(n => 
            n.data.lane === laneIndex && 
            !n.data.isHolding && 
            Math.abs(n.data.time - currentTime) <= this.hitWindow
        );

        if (noteIndex !== -1) {
            const note = this.activeNotes[noteIndex];
            
            // Nota Normal
            if (!note.data.duration || note.data.duration <= 0) {
                this.processNormalHit(note, noteIndex, currentTime);
                return true;
            } 
            
            // Nota Longa (Início)
            else {
                note.data.hit = true;
                note.data.isHolding = true;
                
                // Aplica estado visual de segurar (Branco/Brilhante)
                note.el.classList.add('note-holding'); 
                
                this.game.showFeedback('HOLD'); 
                return true;
            }
        }
        return false; // Retorna false para ativar o Anti-Spam no game.js
    }

    // CHAMADO NO KEYUP
    checkLift(laneIndex) {
        const currentTime = AudioEngine.bgmAudio.currentTime;

        const noteIndex = this.activeNotes.findIndex(n => 
            n.data.lane === laneIndex && n.data.isHolding
        );

        if (noteIndex !== -1) {
            const note = this.activeNotes[noteIndex];
            const timeRemaining = note.data.endTime - currentTime;
            
            // Soltou muito cedo (> 0.2s sobrando)
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
        
        const diff = Math.abs(note.data.time - currentTime);
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