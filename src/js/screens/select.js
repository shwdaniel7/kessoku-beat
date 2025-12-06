import Router from '../router.js';
import AudioEngine from '../audioEngine.js';

// --- NOVA ESTRUTURA DE DADOS ---
const songList = [
    {
        id: 'song1',
        title: 'Guitar, Loneliness...',
        artist: 'Kessoku Band',
        cover: 'cover1.jpg',
        // Agora temos um array de dificuldades
        charts: [
            { label: 'EASY', file: 'song1_easy', level: 5 },
            { label: 'HARD', file: 'song1_hard', level: 12 }
        ]
    },
    {
        id: 'song2',
        title: 'Distortion!!',
        artist: 'Kessoku Band',
        cover: 'cover2.jpg',
        charts: [
            { label: 'NORMAL', file: 'song2_medium', level: 7 }
        ]
    },
    {
        id: 'song3',
        title: 'Karakara',
        artist: 'Kessoku Band',
        cover: 'cover3.jpg',
        charts: [
            { label: 'EASY', file: 'song3_easy', level: 4 },
            { label: 'NORMAL', file: 'song3_medium', level: 7 }
        ]
    },
    {
        id: 'locked',
        title: 'Coming Soon',
        artist: '???',
        cover: '',
        locked: true,
        charts: []
    }
];

export default class SelectScreen {
    constructor() {
        this.selectedSongIndex = 0;
        this.selectedDifficultyIndex = 0;
    }

    render() {
        const cardsHTML = songList.map((song, index) => {
            const coverHTML = song.locked 
                ? `<div class="placeholder-art">?</div>`
                : `<img src="./assets/images/${song.cover}" alt="${song.title}">`;

            return `
                <div class="song-card ${index === 0 ? 'active' : ''} ${song.locked ? 'locked' : ''}" 
                     data-index="${index}" 
                     data-bg="${song.cover}">
                    <div class="card-inner">
                        <div class="cover-art">${coverHTML}</div>
                        <div class="song-info">
                            <h3 class="song-title">${song.title}</h3>
                            <p class="artist">${song.artist}</p>
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

                    <!-- PAINEL DE DIFICULDADES (NOVO) -->
                    <div class="difficulty-selector" id="diff-selector">
                        <!-- Botões injetados via JS -->
                    </div>

                    <div class="footer-controls">
                        <button id="btn-back" class="btn-text"><span class="arrow">‹</span> BACK</button>
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
        const cards = document.querySelectorAll('.song-card');
        
        // Seleção de Música
        cards.forEach(card => {
            card.addEventListener('click', () => {
                if (card.classList.contains('locked')) return;

                document.querySelectorAll('.song-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                this.selectedSongIndex = parseInt(card.dataset.index);
                this.selectedDifficultyIndex = 0; // Reseta para a primeira dificuldade
                
                this.updateBackground(card.dataset.bg);
                this.renderDifficulties(); // Atualiza botões de dificuldade
                AudioEngine.playSFX('hover.mp3');
            });
        });

        document.getElementById('btn-back').addEventListener('click', () => Router.navigate('menu'));
        
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());

        // Atalho Editor
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'e') {
                const song = songList[this.selectedSongIndex];
                if (song.locked) return;
                
                const chart = song.charts[this.selectedDifficultyIndex];
                AudioEngine.stopBGM();
                // Passa o arquivo específico da dificuldade
                Router.navigate('editor', { songId: chart.file });
            }
            if (e.key === 'Enter') this.startGame();
        });

        // Renderiza dificuldades iniciais
        this.renderDifficulties();
    }

    updateBackground(img) {
        const bg = document.querySelector('.select-bg');
        if (img) bg.style.backgroundImage = `url('./assets/images/${img}')`;
    }

    renderDifficulties() {
        const container = document.getElementById('diff-selector');
        const song = songList[this.selectedSongIndex];
        
        if (song.locked) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = song.charts.map((chart, index) => `
            <button class="diff-btn ${index === this.selectedDifficultyIndex ? 'active' : ''}" 
                    data-index="${index}">
                <span class="diff-name">${chart.label}</span>
                <span class="diff-level">LV ${chart.level}</span>
            </button>
        `).join('');

        // Adiciona eventos aos botões novos
        container.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedDifficultyIndex = parseInt(btn.dataset.index);
                this.renderDifficulties(); // Re-renderiza para atualizar classe active
                AudioEngine.playSFX('hover.mp3');
            });
        });
    }

    startGame() {
        const song = songList[this.selectedSongIndex];
        if (song.locked) return;

        const chart = song.charts[this.selectedDifficultyIndex];
        
        AudioEngine.playSFX('confirm.mp3');
        AudioEngine.stopBGM();
        
        // Passa o ID do arquivo de áudio (song1) E o ID do chart (song1_hard)
        // Assumindo que o áudio tem o mesmo nome do ID da música
        Router.navigate('game', { 
            songId: song.id,      // Para carregar o audio (song1.mp3)
            chartId: chart.file   // Para carregar o json (song1_hard.json)
        });
    }
}