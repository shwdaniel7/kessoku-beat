import Router from '../router.js';
import AudioEngine from '../audioEngine.js';

// --- LISTA DE MÚSICAS ---
const songList = [
    {
        id: 'song1',
        title: 'Guitar, Loneliness...',
        artist: 'Kessoku Band',
        bpm: 190,
        cover: 'cover1.jpg',
        locked: false,
        charts: [
            { label: 'HARD', file: 'song1_hard', level: 12, color: '#E86CA6', speed: 1.1 }
        ]
    },
    {
        id: 'song2',
        title: 'Distortion!!',
        artist: 'Kessoku Band',
        bpm: 180,
        cover: 'cover2.jpg',
        locked: false,
        charts: [
            { label: 'NORMAL', file: 'song2_normal', level: 8, color: '#2196F3', speed: 1.4 }
        ]
    },
    {
        id: 'song3',
        title: 'Karakara',
        artist: 'Kessoku Band',
        bpm: 175,
        cover: 'cover3.jpg',
        locked: false,
        charts: [
            { label: 'EASY', file: 'song3_easy', level: 4, color: '#4CAF50', speed: 1.7 },
            { label: 'NORMAL', file: 'song3_medium', level: 7, color: '#2196F3', speed: 1.4 }
        ]
    },
    // --- NOVAS MÚSICAS (PLACEHOLDERS) ---
    {
        id: 'song4',
        title: 'Seisyun Complex(tv ver.)',
        artist: 'Kessoku Band',
        bpm: '190',
        cover: 'cover4.jpg', // Coloque cover4.jpg quando tiver
        locked: false, // Mude para false quando adicionar os arquivos
        charts: [
            { label: 'EASY', file: 'song4_easy', level: 4, color: '#4CAF50', speed: 1.7 },
            { label: 'NORMAL', file: 'song4_medium', level: 7, color: '#2196F3', speed: 1.5 },
            { label: 'HARD', file: 'song4_hard', level: 11, color: '#E86CA6', speed: 1.2 }
        ]
    },
    {
        id: 'song5',
        title: 'Nani ga Warui(tv ver.)',
        artist: 'Kessoku Band',
        bpm: '180',
        cover: 'cover5.jpg', // Coloque cover5.jpg quando tiver
        locked: false, // Mude para false quando adicionar os arquivos
        charts: [
            { label: 'EASY', file: 'song5_easy', level: 4, color: '#4CAF50', speed: 1.7 },
            { label: 'NORMAL', file: 'song5_medium', level: 7, color: '#2196F3', speed: 1.5 },
            { label: 'HARD', file: 'song5_hard', level: 11, color: '#E86CA6', speed: 1.2 }
        ]
    },
    // --- SLOT FINAL ---
    {
        id: 'locked_final',
        title: 'Coming Soon',
        artist: '???',
        bpm: '',
        cover: '', 
        locked: true,
        charts: []
    }
];

export default class SelectScreen {
    constructor() {
        this.currentIndex = 0;
        this.selectedDifficultyIndex = 0;
    }

    render() {
        const cardsHTML = songList.map((song, index) => {
            const coverHTML = song.locked 
                ? `<div class="placeholder-art">?</div>`
                : `<img src="./assets/images/${song.cover}" alt="${song.title}">`;

            return `
                <div class="song-card ${song.locked ? 'locked' : ''}" 
                     data-index="${index}" 
                     data-id="${song.id}">
                    <div class="card-inner">
                        <div class="cover-art">${coverHTML}</div>
                        <div class="song-info">
                            <h3 class="song-title">${song.title}</h3>
                            <p class="artist">${song.artist}</p>
                            <div class="meta-tags">
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

                    <div class="difficulty-selector" id="diff-selector"></div>

                    <div class="footer-controls">
                        <button id="btn-back" class="btn-text"><span class="arrow">‹</span> BACK</button>
                        <div class="action-buttons">
                            <button id="btn-start" class="btn-primary">START LIVE</button>
                            <small class="edit-hint">ARROWS TO NAVIGATE • 'E' TO EDIT</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        this.updateCarousel();

        document.querySelectorAll('.song-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                if (index === this.currentIndex) return;
                this.navigate(index - this.currentIndex);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.navigate(1);
            if (e.key === 'ArrowLeft') this.navigate(-1);
            
            if (e.key.toLowerCase() === 'e') {
                const song = songList[this.currentIndex];
                if (song.locked) return;
                const chart = song.charts[this.selectedDifficultyIndex];
                AudioEngine.stopBGM();
                Router.navigate('editor', { songId: chart.file });
            }
            
            if (e.key === 'Enter') this.startGame();
        });

        document.getElementById('btn-back').addEventListener('click', () => {
            AudioEngine.playSFX('confirm.mp3');
            AudioEngine.playBGM('./assets/audio/menu.mp3');
            Router.navigate('menu');
        });

        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
    }

    navigate(direction) {
        const newIndex = this.currentIndex + direction;
        if (newIndex < 0 || newIndex >= songList.length) return;

        this.currentIndex = newIndex;
        if (this.selectedDifficultyIndex >= songList[this.currentIndex].charts.length) {
            this.selectedDifficultyIndex = 0;
        }
        
        AudioEngine.playSFX('hover.mp3');
        this.updateCarousel();
    }

    updateCarousel() {
        const cards = document.querySelectorAll('.song-card');
        const bg = document.querySelector('.select-bg');
        const currentSong = songList[this.currentIndex];

        cards.forEach((card, index) => {
            card.className = 'song-card';
            if (currentSong.locked) card.classList.add('locked');

            if (index === this.currentIndex) card.classList.add('active');
            else if (index === this.currentIndex - 1) card.classList.add('prev');
            else if (index === this.currentIndex + 1) card.classList.add('next');
        });

        if (currentSong.cover) {
            bg.style.backgroundImage = `url('./assets/images/${currentSong.cover}')`;
        }

        this.renderDifficulties();

        if (!currentSong.locked) {
            if (this.previewTimeout) clearTimeout(this.previewTimeout);
            this.previewTimeout = setTimeout(() => {
                AudioEngine.playBGM(`./assets/audio/${currentSong.id}.mp3`, true);
            }, 200);
        } else {
            AudioEngine.stopBGM();
        }
    }

    renderDifficulties() {
        const container = document.getElementById('diff-selector');
        const song = songList[this.currentIndex];
        
        if (song.locked) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = song.charts.map((chart, index) => {
            const color = chart.color || '#fff';
            const isActive = index === this.selectedDifficultyIndex;
            const style = isActive 
                ? `background: ${color}; border-color: ${color}; color: white; box-shadow: 0 0 15px ${color};` 
                : '';

            return `
                <button class="diff-btn ${isActive ? 'active' : ''}" 
                        data-index="${index}"
                        style="${style}">
                    <span class="diff-name">${chart.label}</span>
                    <span class="diff-level">LV ${chart.level}</span>
                </button>
            `;
        }).join('');

        container.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedDifficultyIndex = parseInt(btn.dataset.index);
                this.renderDifficulties();
                AudioEngine.playSFX('hover.mp3');
            });
        });
    }

    startGame() {
        const song = songList[this.currentIndex];
        if (song.locked) return;

        const chart = song.charts[this.selectedDifficultyIndex];
        
        AudioEngine.playSFX('confirm.mp3');
        AudioEngine.stopBGM();
        
        Router.navigate('game', { 
            songId: song.id,
            chartId: chart.file,
            noteSpeed: chart.speed // <--- ENVIA A VELOCIDADE
        });
    }
}