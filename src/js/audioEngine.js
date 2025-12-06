import Storage from './storage.js';

class AudioEngine {
    constructor() {
        this.bgmAudio = new Audio();
        this.bgmAudio.loop = true;
        this.currentBgmUrl = '';
        
        const savedMusic = Storage.get('volMusic');
        const savedSfx = Storage.get('volSfx');

        this.volMusic = (savedMusic !== null && !isNaN(savedMusic)) ? parseFloat(savedMusic) : 0.5;
        this.volSfx = (savedSfx !== null && !isNaN(savedSfx)) ? parseFloat(savedSfx) : 0.5;
    }

    playBGM(url, loop = true) {
        // Se for a mesma música, só garante que está tocando
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

    // --- NOVOS MÉTODOS PARA O PAUSE ---
    pauseBGM() {
        if (!this.bgmAudio.paused) {
            this.bgmAudio.pause();
        }
    }

    resumeBGM() {
        if (this.bgmAudio.paused && this.currentBgmUrl) {
            this.bgmAudio.play();
        }
    }
    // ----------------------------------

    stopBGM() {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
        this.currentBgmUrl = '';
    }

    playSFX(filename) {
        // Cria o objeto de áudio
        const sfx = new Audio(`./assets/audio/${filename}`);
        
        // Ajusta volume
        if (isFinite(this.volSfx)) {
            sfx.volume = this.volSfx;
        }

        // O segredo para sons rápidos (tiros, hits):
        // Clona o nó de áudio para permitir sobreposição
        // (Tocar vários ao mesmo tempo sem cortar)
        const sfxClone = sfx.cloneNode();
        sfxClone.volume = sfx.volume;
        
        sfxClone.play().catch(() => {
            // Ignora erros de autoplay (comuns se o user não interagiu)
        });
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
}

export default new AudioEngine();