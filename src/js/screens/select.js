import Router from '../router.js';
import AudioEngine from '../audioEngine.js';

// --- LISTA DE MÚSICAS ---
const songList = [
    {
        id: 'song1',
        title: 'Guitar, Loneliness...',
        artist: 'Kessoku Band',
        bpm: 190,
        difficulty: 'HARD',
        cover: 'cover1.jpg',
        locked: false
    },
    {
        id: 'song2',
        title: 'Distortion!!',
        artist: 'Kessoku Band',
        bpm: 180,
        difficulty: 'NORMAL',
        cover: 'cover2.jpg',
        locked: false
    },
    {
        id: 'song3',
        title: 'Karakara',
        artist: 'Kessoku Band',
        bpm: 175,
        difficulty: 'EASY',
        cover: 'cover3.jpg',
        locked: false
    },
    // --- NOVO CARD: COMING SOON ---
    {
        id: 'locked',
        title: 'Coming Soon',
        artist: '???',
        bpm: '???',
        difficulty: 'LOCKED',
        cover: '', 
        locked: true // Marcador especial
    }
];

export default class SelectScreen {
    constructor() {
        this.selectedSongId = 'song1';
    }

    render() {
        const cardsHTML = songList.map((song, index) => {
            // Lógica para mostrar Imagem ou Interrogação (?)
            const coverHTML = song.locked 
                ? `<div class="placeholder-art">?</div>`
                : `<img src="./assets/images/${song.cover}" alt="${song.title}">`;

            return `
                <div class="song-card ${index === 0 ? 'active' : ''} ${song.locked ? 'locked' : ''}" 
                     data-id="${song.id}" 
                     data-bg="${song.cover}"
                     data-locked="${song.locked}">
                    <div class="card-inner">
                        <div class="cover-art">
                            ${coverHTML}
                        </div>
                        <div class="song-info">
                            <h3 class="song-title">${song.title}</h3>
                            <p class="artist">${song.artist}</p>
                            <div class="meta-tags">
                                <span class="tag difficulty ${song.locked ? 'gray' : ''}">${song.difficulty}</span>
                                ${!song.locked ? `<span class="tag bpm">BPM ${song.bpm}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="screen-container select-screen">
                <div class="select-bg"></div>
                <div class="select-overlay"></div>

                <div class="content-wrapper">
                    <h2 class="screen-title">SELECT TRACK</h2>

                    <div class="cards-container">
                        ${cardsHTML}
                    </div>

                    <div class="footer-controls">
                        <button id="btn-back" class="btn-text">
                            <span class="arrow">‹</span> BACK
                        </button>
                        
                        <div class="action-buttons">
                            <button id="btn-start" class="btn-primary">START LIVE</button>
                            <small class="edit-hint">PRESS 'E' TO EDIT CHART</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        const bg = document.querySelector('.select-bg');
        const cards = document.querySelectorAll('.song-card');
        const btnStart = document.getElementById('btn-start');

        cards.forEach(card => {
            card.addEventListener('click', () => {
                // Se for bloqueado, não faz nada ou toca som de erro
                if (card.dataset.locked === "true") {
                    // Opcional: AudioEngine.playSFX('error.mp3');
                    return; 
                }

                document.querySelectorAll('.song-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                this.selectedSongId = card.dataset.id;

                // Troca fundo
                const bgImg = card.dataset.bg;
                if (bgImg) {
                    bg.style.backgroundImage = `url('./assets/images/${bgImg}')`;
                }

                AudioEngine.playSFX('hover.mp3');
            });
        });

        document.getElementById('btn-back').addEventListener('click', () => {
            AudioEngine.playSFX('confirm.mp3');
            Router.navigate('menu');
        });

        btnStart.addEventListener('click', () => {
            this.startGame();
        });

        // Atalho Editor
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'e') {
                // Não abre editor se for o card Coming Soon
                if (this.selectedSongId === 'locked') return;
                
                AudioEngine.stopBGM();
                Router.navigate('editor', { songId: this.selectedSongId });
            }
            if (e.key === 'Enter') this.startGame();
        });
    }

    startGame() {
        // Proteção extra para não iniciar card bloqueado
        if (this.selectedSongId === 'locked') return;

        AudioEngine.playSFX('confirm.mp3');
        AudioEngine.stopBGM();
        Router.navigate('game', { songId: this.selectedSongId });
    }
}