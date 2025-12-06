import AudioEngine from './audioEngine.js';

export default class NoteSpawner {
    constructor(songId, gameInstance) {
        this.songId = songId;
        this.game = gameInstance;
        
        this.chartNotes = []; // Dados brutos do JSON
        this.activeNotes = []; // Notas que estão na tela
        
        // --- CONFIGURAÇÕES ---
        this.noteSpeed = 1.3; 
        this.hitWindow = 0.25; // Aumentei de 0.15 para 0.25 (250ms - Bem fácil de acertar)
        this.perfectWindow = 0.08; // Aumentei de 0.05 para 0.08 (80ms - Perfect mais fácil)
        
        // --- OBJECT POOLING (Performance) ---
        this.notePool = []; 
        this.poolSize = 40; // Quantidade de notas recicladas na memória
        
        this.isPlaying = false;

        // Cache da altura da pista
        const trackEl = document.querySelector('.track-container');
        this.trackHeight = trackEl ? trackEl.offsetHeight : window.innerHeight; 
        this.hitLineY = this.trackHeight - 50; // Posição da linha de hit

        this.initPool();
    }

    // Cria as notas na memória para não travar o jogo criando DIVs toda hora
    initPool() {
        for (let i = 0; i < this.poolSize; i++) {
            const el = document.createElement('div');
            el.classList.add('note');
            // Começa invisível e fora da tela
            el.style.visibility = 'hidden';
            el.style.transform = 'translate3d(0, -200px, 0)';
            this.notePool.push(el);
        }
    }

    getNoteFromPool() {
        if (this.notePool.length > 0) {
            return this.notePool.pop();
        }
        // Emergência: cria nova se faltar
        const el = document.createElement('div');
        el.classList.add('note');
        return el;
    }

    returnNoteToPool(el) {
        el.className = 'note'; // Reseta classes (tira hit/miss)
        el.style.visibility = 'hidden';
        el.style.transform = 'translate3d(0, -200px, 0)';
        
        if (el.parentNode) el.parentNode.removeChild(el);
        
        this.notePool.push(el);
    }

async start() {
        const path = `./assets/charts/${this.songId}.json`;
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error("Chart não encontrado");
            
            const data = await response.json();

            this.totalNotes = data.notes.length; 
            
            // Prepara as notas
            this.chartNotes = data.notes.map(n => ({
                ...n,
                spawnTime: n.time - this.noteSpeed,
                hit: false
            })).sort((a, b) => a.spawnTime - b.spawnTime);

            // --- NOVO: Descobre quando a música "acaba" (tempo da última nota) ---
            if (this.chartNotes.length > 0) {
                const lastNote = this.chartNotes[this.chartNotes.length - 1];
                // O jogo acaba 3 segundos depois da última nota
                this.endTime = lastNote.time + 3.0; 
            } else {
                this.endTime = 10.0; // Fallback se não tiver notas
            }

            this.isPlaying = true;
            this.loop();
        } catch (e) {
            console.error("Erro ao carregar chart:", e);
            // Se der erro, volta pro menu pra não travar
            this.game.endGame(); 
        }
    }

    loop() {
        if (!this.isPlaying) return;

        const currentTime = AudioEngine.bgmAudio ? AudioEngine.bgmAudio.currentTime : 0;
        
        // --- VERIFICAÇÃO DE FIM DE JOGO ATUALIZADA ---
        // O jogo acaba se:
        // 1. O tempo passou do final calculado (endTime) OU
        // 2. O áudio terminou de tocar (ended)
        // E TAMBÉM não tem mais notas na tela.
        const audioEnded = AudioEngine.bgmAudio ? AudioEngine.bgmAudio.ended : false;

        if ((currentTime > this.endTime || audioEnded) && this.activeNotes.length === 0) {
            console.log("Fim da música detectado!"); // Debug
            this.stop();
            this.game.endGame();
            return;
        }

        // 1. SPAWNAR NOTAS
        while (this.chartNotes.length > 0 && currentTime >= this.chartNotes[0].spawnTime) {
            const noteData = this.chartNotes.shift();
            this.spawnNote(noteData);
        }

        // 2. MOVER NOTAS
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const noteObj = this.activeNotes[i];
            const timeUntilHit = noteObj.data.time - currentTime;
            
            const progress = 1 - (timeUntilHit / this.noteSpeed);
            const y = progress * this.hitLineY;

            noteObj.el.style.transform = `translate3d(0, ${y}px, 0)`;

            if (timeUntilHit < -this.hitWindow && !noteObj.data.hit) {
                this.handleMiss(i);
            }
        }

        requestAnimationFrame(this.loop.bind(this));
    }

    spawnNote(noteData) {
        const laneEl = document.getElementById(`lane-${noteData.lane}`);
        if (!laneEl) return;

        const el = this.getNoteFromPool();
        
        // Configura visual
        if (noteData.lane === 1 || noteData.lane === 2) el.classList.add('note-center');
        
        el.style.visibility = 'visible';
        laneEl.appendChild(el);
        
        this.activeNotes.push({ el, data: noteData });
    }

        checkHit(laneIndex) {
        const currentTime = AudioEngine.bgmAudio.currentTime;

        const noteIndex = this.activeNotes.findIndex(n => 
            n.data.lane === laneIndex && 
            Math.abs(n.data.time - currentTime) <= this.hitWindow
        );

        if (noteIndex !== -1) {
            const note = this.activeNotes[noteIndex];
            note.data.hit = true;
            
            note.el.classList.add('note-hit');
            this.activeNotes.splice(noteIndex, 1);
            setTimeout(() => this.returnNoteToPool(note.el), 100);
            
            // Calcula Pontos
            const diff = Math.abs(note.data.time - currentTime);
            let scoreType = 'GOOD';
            let points = 50;

            // Usa a nova variável perfectWindow
            if (diff < this.perfectWindow) { 
                scoreType = 'PERFECT';
                points = 100;
            }

            this.game.showFeedback(scoreType);
            this.game.updateScore(points, scoreType);
            
            return true;
        }
        return false;
    }

handleMiss(index) {
        const note = this.activeNotes[index];
        
        // Visual Miss na nota (fica cinza)
        note.el.classList.add('note-miss');
        
        // Remove da lógica
        this.activeNotes.splice(index, 1);
        
        // Devolve pro pool
        setTimeout(() => this.returnNoteToPool(note.el), 200);

        this.game.showFeedback('MISS'); 
        
        // Atualiza pontuação (reseta combo)
        this.game.updateScore(0, 'MISS');
    }

    stop() {
        this.isPlaying = false;
        // Limpa a tela devolvendo tudo pro pool
        this.activeNotes.forEach(n => this.returnNoteToPool(n.el));
        this.activeNotes = [];
    }
}