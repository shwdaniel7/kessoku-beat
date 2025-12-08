import AudioEngine from './audioEngine.js';

export default class NoteSpawner {
    constructor(chartId, gameInstance, speed, mods, skin) {
        this.chartId = chartId;
        this.game = gameInstance;
        this.mods = mods || { auto: false, sudden: false, speedUp: false };
        this.skin = skin || 'note_default';

        this.chartNotes = [];
        this.activeNotes = [];
        
        let baseSpeed = speed || 1.3;
        if (this.mods.speedUp) baseSpeed = baseSpeed * 0.7;
        this.noteSpeed = baseSpeed;
        
        this.hitWindow = 0.15;
        this.perfectWindow = 0.05;
        
        this.notePool = []; 
        this.poolSize = 50;
        
        this.isPlaying = false;
        
        // Variáveis de Tempo
        this.startTime = 0;
        this.audioDelay = 0;
        this.audioStarted = false;
        
        // --- CORREÇÃO DO PAUSE ---
        this.pauseStartTime = 0;
        this.totalPausedTime = 0;
        // -------------------------

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

    async start(audioPath) {
        this.audioPath = audioPath;
        const path = `./assets/charts/${this.chartId}.json`;
        
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error("Chart não encontrado");
            
            const data = await response.json();
            this.audioDelay = data.offset || 0;

            this.chartNotes = data.notes.map(n => ({
                ...n,
                realTime: n.time + this.audioDelay, 
                spawnTime: (n.time + this.audioDelay) - this.noteSpeed,
                hit: false,
                isHolding: false,
                endTime: n.duration ? (n.time + this.audioDelay) + n.duration : (n.time + this.audioDelay)
            })).sort((a, b) => a.spawnTime - b.spawnTime);

            if (this.chartNotes.length > 0) {
                const lastNote = this.chartNotes[this.chartNotes.length - 1];
                this.endTime = lastNote.endTime + 3.0; 
            } else {
                this.endTime = 10.0;
            }

            this.startTime = performance.now();
            this.totalPausedTime = 0; // Reseta tempo pausado
            this.audioStarted = false;
            this.isPlaying = true;
            this.loop();
            
        } catch (e) {
            console.error("Erro chart:", e);
            this.game.endGame();
        }
    }

    // --- NOVOS MÉTODOS DE PAUSE ---
    pause() {
        this.isPlaying = false;
        // Marca que horas pausou
        this.pauseStartTime = performance.now();
    }

    resume() {
        if (this.isPlaying) return;
        
        // Calcula quanto tempo ficou parado e adiciona ao total
        const now = performance.now();
        this.totalPausedTime += (now - this.pauseStartTime);
        
        this.isPlaying = true;
        this.loop();
    }
    // ------------------------------

    loop() {
        if (!this.isPlaying) return;

        let currentTime;
        
        if (!this.audioStarted) {
            // Usa o relógio do sistema MENOS o tempo que ficou pausado
            const rawTime = (performance.now() - this.startTime - this.totalPausedTime) / 1000;
            
            if (rawTime >= this.audioDelay) {
                AudioEngine.playBGM(this.audioPath, false);
                this.audioStarted = true;
                currentTime = this.audioDelay + AudioEngine.bgmAudio.currentTime;
            } else {
                currentTime = rawTime;
            }
        } else {
            // Se a música já começou, o AudioContext é o mestre (ele pausa sozinho)
            currentTime = this.audioDelay + AudioEngine.bgmAudio.currentTime;
        }

        const audioEnded = AudioEngine.bgmAudio ? AudioEngine.bgmAudio.ended : false;
        if ((currentTime > this.endTime || (this.audioStarted && audioEnded)) && this.activeNotes.length === 0) {
            this.stop();
            this.game.endGame();
            return;
        }

        while (this.chartNotes.length > 0 && currentTime >= this.chartNotes[0].spawnTime) {
            const noteData = this.chartNotes.shift();
            this.spawnNote(noteData);
        }

        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const noteObj = this.activeNotes[i];
            const targetTime = noteObj.data.realTime; 

            if (this.mods.auto) {
                if (!noteObj.data.hit && currentTime >= targetTime) {
                    this.checkHit(noteObj.data.lane, true);
                    this.game.triggerLane(noteObj.data.lane, 'hit');
                    AudioEngine.playSFX('hit.mp3');
                }
                if (noteObj.data.isHolding && currentTime >= noteObj.data.endTime) {
                    this.completeHold(i);
                    continue;
                }
            }

            if (noteObj.data.isHolding) {
                if (currentTime >= noteObj.data.endTime) {
                    this.completeHold(i);
                    continue;
                }
                noteObj.el.style.transform = `translate3d(0, ${this.hitLineY}px, 0)`;
                const tail = noteObj.el.querySelector('.note-hold-body');
                if (tail) {
                    const remainingTime = noteObj.data.endTime - currentTime;
                    const newHeight = (remainingTime / this.noteSpeed) * this.hitLineY;
                    tail.style.height = `${newHeight}px`;
                    tail.style.top = `-${newHeight}px`;
                }
            } else {
                const timeUntilHit = targetTime - currentTime;
                const progress = 1 - (timeUntilHit / this.noteSpeed);
                const y = progress * this.hitLineY;

                // Correção para skins centralizadas (Osu)
                if (this.skin === 'note_circle') {
                    noteObj.el.style.transform = `translate3d(-50%, ${y}px, 0)`;
                } else {
                    noteObj.el.style.transform = `translate3d(0, ${y}px, 0)`;
                }

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
        
        // Limpa classes antigas
        el.className = 'note';
        if (this.skin !== 'note_default') el.classList.add(`skin-${this.skin}`);

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

    checkHit(laneIndex, force = false) {
        let currentTime;
        if (this.audioStarted) {
            currentTime = this.audioDelay + AudioEngine.bgmAudio.currentTime;
        } else {
            currentTime = (performance.now() - this.startTime - this.totalPausedTime) / 1000;
        }

        const noteIndex = this.activeNotes.findIndex(n => 
            n.data.lane === laneIndex && 
            !n.data.isHolding && 
            (force || Math.abs(n.data.realTime - currentTime) <= this.hitWindow)
        );

        if (noteIndex !== -1) {
            const note = this.activeNotes[noteIndex];
            
            if (!note.data.duration || note.data.duration <= 0) {
                this.processNormalHit(note, noteIndex, currentTime, force);
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
        if (this.mods.auto) return;

        let currentTime;
        if (this.audioStarted) {
            currentTime = this.audioDelay + AudioEngine.bgmAudio.currentTime;
        } else {
            currentTime = (performance.now() - this.startTime - this.totalPausedTime) / 1000;
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

    processNormalHit(note, index, currentTime, force) {
        note.data.hit = true;
        note.el.classList.add('note-hit');
        this.activeNotes.splice(index, 1);
        setTimeout(() => this.returnNoteToPool(note.el), 100);
        
        let scoreType = 'GOOD';
        let points = 50;

        if (force) {
            scoreType = 'PERFECT';
            points = 100;
        } else {
            const diff = Math.abs(note.data.realTime - currentTime);
            if (diff < this.perfectWindow) { scoreType = 'PERFECT'; points = 100; }
        }

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
        if (this.mods.sudden) {
            this.game.failGame();
            return;
        }

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