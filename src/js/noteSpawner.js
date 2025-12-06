import AudioEngine from './audioEngine.js';

export default class NoteSpawner {
    constructor(songId, gameInstance) {
        this.songId = songId;
        this.game = gameInstance;
        
        this.chartNotes = []; // Dados brutos do JSON
        this.activeNotes = []; // Notas que estão na tela
        
        // --- CONFIGURAÇÕES ---
        this.noteSpeed = 1.3; // Velocidade (Menor = Mais rápido). 1.3 é um bom ritmo.
        this.hitWindow = 0.15; // Tolerância de erro (150ms)
        
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
            
            // Prepara as notas
            this.chartNotes = data.notes.map(n => ({
                ...n,
                spawnTime: n.time - this.noteSpeed,
                hit: false
            })).sort((a, b) => a.spawnTime - b.spawnTime);

            this.isPlaying = true;
            this.loop();
        } catch (e) {
            console.error("Erro ao carregar chart:", e);
        }
    }

    loop() {
        if (!this.isPlaying) return;

        const currentTime = AudioEngine.bgmAudio ? AudioEngine.bgmAudio.currentTime : 0;

        // 1. SPAWNAR NOTAS
        while (this.chartNotes.length > 0 && currentTime >= this.chartNotes[0].spawnTime) {
            const noteData = this.chartNotes.shift();
            this.spawnNote(noteData);
        }

        // 2. MOVER NOTAS (GPU ACCELERATED)
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const noteObj = this.activeNotes[i];
            const timeUntilHit = noteObj.data.time - currentTime;
            
            // Calcula posição Y
            const progress = 1 - (timeUntilHit / this.noteSpeed);
            const y = progress * this.hitLineY;

            // Move usando placa de vídeo
            noteObj.el.style.transform = `translate3d(0, ${y}px, 0)`;

            // MISS (Passou da linha)
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

        // Procura nota na lane correta dentro da janela de tempo
        const noteIndex = this.activeNotes.findIndex(n => 
            n.data.lane === laneIndex && 
            Math.abs(n.data.time - currentTime) <= this.hitWindow
        );

        if (noteIndex !== -1) {
            const note = this.activeNotes[noteIndex];
            note.data.hit = true;
            
            // Visual Hit
            note.el.classList.add('note-hit');
            this.activeNotes.splice(noteIndex, 1);
            
            // Devolve pro pool rápido
            setTimeout(() => this.returnNoteToPool(note.el), 100);
            
            // Calcula Pontos e Feedback
            const diff = Math.abs(note.data.time - currentTime);
            let scoreType = 'GOOD';
            let points = 50;

            if (diff < 0.05) { // 50ms para Perfect
                scoreType = 'PERFECT';
                points = 100;
            }

            // Chama o feedback na tela
            this.game.showFeedback(scoreType);
            this.game.updateScore(points, scoreType);
            
            return true;
        }
        return false;
    }

    handleMiss(index) {
        const note = this.activeNotes[index];
        
        // Visual Miss
        note.el.classList.add('note-miss');
        this.activeNotes.splice(index, 1);
        
        // Devolve pro pool um pouco mais devagar pra ver o erro
        setTimeout(() => this.returnNoteToPool(note.el), 200);

        // Chama o feedback na tela
        this.game.showFeedback('MISS');
        this.game.updateScore(0, 'MISS');
    }

    stop() {
        this.isPlaying = false;
        // Limpa a tela devolvendo tudo pro pool
        this.activeNotes.forEach(n => this.returnNoteToPool(n.el));
        this.activeNotes = [];
    }
}