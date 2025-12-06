import Storage from './storage.js';

class AudioEngine {
    constructor() {
        this.bgmAudio = new Audio();
        this.bgmAudio.loop = true;
        this.currentBgmUrl = '';
        
        // Tenta pegar do storage, se der erro ou vier lixo, usa 0.5
        const savedMusic = Storage.get('volMusic');
        const savedSfx = Storage.get('volSfx');

        // Validação de segurança (Isso corrige o seu erro do console)
        this.volMusic = (savedMusic !== null && !isNaN(savedMusic)) ? parseFloat(savedMusic) : 0.5;
        this.volSfx = (savedSfx !== null && !isNaN(savedSfx)) ? parseFloat(savedSfx) : 0.5;
    }

    playBGM(url) {
        if (this.currentBgmUrl === url && !this.bgmAudio.paused) return;

        this.currentBgmUrl = url;
        this.bgmAudio.src = url;
        
        // Garante que o volume é um número finito antes de atribuir
        if (isFinite(this.volMusic)) {
            this.bgmAudio.volume = this.volMusic;
        } else {
            this.bgmAudio.volume = 0.5; // Fallback de segurança
        }
        
        const playPromise = this.bgmAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Autoplay bloqueado. Interaja com a tela.");
            });
        }
    }

    stopBGM() {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
        this.currentBgmUrl = '';
    }

    playSFX(filename) {
        const sfx = new Audio(`./assets/audio/${filename}`);
        
        if (isFinite(this.volSfx)) {
            sfx.volume = this.volSfx;
        } else {
            sfx.volume = 0.5;
        }

        sfx.play().catch(() => {});
    }

    setVolume(type, value) {
        // Garante que value é número
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
}

export default new AudioEngine();