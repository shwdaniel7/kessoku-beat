import Storage from './storage.js';

class AudioEngine {
    constructor() {
        // Contexto de Áudio (Necessário para análise)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
        
        // Analisador (O cérebro que lê as frequências)
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 256; // Precisão da análise (quanto menor, mais rápido)
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        // Elemento de Áudio HTML5
        this.bgmAudio = new Audio();
        this.bgmAudio.loop = true;
        this.bgmAudio.crossOrigin = "anonymous"; // Necessário para analisar áudio local/web

        // Conecta o Áudio ao Analisador e depois aos Alto-falantes
        this.source = this.context.createMediaElementSource(this.bgmAudio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.context.destination);

        this.currentBgmUrl = '';
        
        const savedMusic = Storage.get('volMusic');
        const savedSfx = Storage.get('volSfx');

        this.volMusic = (savedMusic !== null && !isNaN(savedMusic)) ? parseFloat(savedMusic) : 0.5;
        this.volSfx = (savedSfx !== null && !isNaN(savedSfx)) ? parseFloat(savedSfx) : 0.5;
    }

    playBGM(url, loop = true) {
        // Retoma o contexto se estiver suspenso (comum em navegadores)
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        if (this.currentBgmUrl === url) {
            if (this.bgmAudio.paused) this.bgmAudio.play();
            return;
        }

        this.currentBgmUrl = url;
        this.bgmAudio.src = url;
        this.bgmAudio.loop = loop;
        
        if (isFinite(this.volMusic)) {
            this.bgmAudio.volume = this.volMusic;
        }
        
        const playPromise = this.bgmAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => console.warn("Autoplay bloqueado."));
        }
    }

    pauseBGM() {
        if (!this.bgmAudio.paused) this.bgmAudio.pause();
    }

    resumeBGM() {
        if (this.bgmAudio.paused && this.currentBgmUrl) {
            if (this.context.state === 'suspended') this.context.resume();
            this.bgmAudio.play();
        }
    }

    stopBGM() {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
        this.currentBgmUrl = '';
    }

    playSFX(filename) {
        // SFX não passa pelo analisador para não sujar o visual
        const sfx = new Audio(`./assets/audio/${filename}`);
        if (isFinite(this.volSfx)) sfx.volume = this.volSfx;
        
        const sfxClone = sfx.cloneNode();
        sfxClone.volume = sfx.volume;
        sfxClone.play().catch(() => {});
    }

    setVolume(type, value) {
        const safeValue = parseFloat(value);
        if (isNaN(safeValue)) return;

        if (type === 'music') {
            this.volMusic = safeValue;
            this.bgmAudio.volume = safeValue;
            Storage.set('volMusic', safeValue);
        } else if (type === 'sfx') {
            this.volSfx = safeValue;
            Storage.set('volSfx', safeValue);
        }
    }

    // --- NOVO: Método para pegar a intensidade do grave (Bass) ---
    getBassEnergy() {
        if (this.bgmAudio.paused) return 0;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Pega as primeiras frequências (Graves)
        let sum = 0;
        // Analisa os primeiros 10 bins (frequências baixas)
        for (let i = 0; i < 10; i++) {
            sum += this.dataArray[i];
        }
        
        // Retorna média normalizada (0 a 1)
        return (sum / 10) / 255;
    }
}

export default new AudioEngine();