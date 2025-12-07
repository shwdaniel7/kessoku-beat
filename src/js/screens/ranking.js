import Router from '../router.js';
import AudioEngine from '../audioEngine.js';
import Firebase from '../firebase.js';
import { songList } from './select.js'; // Importa a lista de músicas

export default class RankingScreen {
    constructor() {
        this.currentSongIndex = 0;
        this.currentDiffIndex = 0;
        // Filtra apenas músicas desbloqueadas
        this.availableSongs = songList.filter(s => !s.locked);
    }

    render() {
        // Gera opções do Dropdown de Músicas
        const songOptions = this.availableSongs.map((song, index) => 
            `<option value="${index}">${song.title}</option>`
        ).join('');

        return `
            <div class="screen-container ranking-screen">
                <div class="ranking-bg"></div>
                <div class="ranking-overlay"></div>

                <div class="ranking-panel">
                    <h2>GLOBAL RANKING</h2>
                    
                    <div class="filters">
                        <div class="filter-group">
                            <label>TRACK</label>
                            <select id="song-select">${songOptions}</select>
                        </div>
                        
                        <div class="filter-group">
                            <label>DIFFICULTY</label>
                            <div id="diff-tabs" class="diff-tabs">
                                <!-- Botões gerados via JS -->
                            </div>
                        </div>
                    </div>

                    <div class="table-container">
                        <div class="table-header">
                            <span>RANK</span>
                            <span>NAME</span>
                            <span>SCORE</span>
                            <span>DATE</span>
                        </div>
                        <ul id="global-score-list">
                            <li class="loading">LOADING DATA...</li>
                        </ul>
                    </div>

                    <button id="btn-back" class="btn-primary">BACK TO MENU</button>
                </div>
            </div>
        `;
    }

    init() {
        const songSelect = document.getElementById('song-select');
        const diffTabs = document.getElementById('diff-tabs');
        const bg = document.querySelector('.ranking-bg');

        // Atualiza background inicial
        this.updateBackground(bg);
        this.renderDiffTabs(diffTabs);
        this.loadScores();

        // Evento: Trocar Música
        songSelect.addEventListener('change', (e) => {
            this.currentSongIndex = parseInt(e.target.value);
            this.currentDiffIndex = 0; // Reseta para a primeira dificuldade
            this.updateBackground(bg);
            this.renderDiffTabs(diffTabs);
            this.loadScores();
            AudioEngine.playSFX('hover.mp3');
        });

        // Botão Voltar
        document.getElementById('btn-back').addEventListener('click', () => {
            AudioEngine.playSFX('confirm.mp3');
            Router.navigate('menu');
        });
    }

    updateBackground(bgElement) {
        const song = this.availableSongs[this.currentSongIndex];
        if (song && song.cover) {
            bgElement.style.backgroundImage = `url('./assets/images/${song.cover}')`;
        }
    }

    renderDiffTabs(container) {
        const song = this.availableSongs[this.currentSongIndex];
        
        container.innerHTML = song.charts.map((chart, index) => {
            const activeClass = index === this.currentDiffIndex ? 'active' : '';
            // Usa a cor da dificuldade
            const style = index === this.currentDiffIndex 
                ? `background: ${chart.color}; border-color: ${chart.color}; box-shadow: 0 0 10px ${chart.color};` 
                : '';
                
            return `<button class="tab-btn ${activeClass}" data-index="${index}" style="${style}">${chart.label}</button>`;
        }).join('');

        // Eventos das abas
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentDiffIndex = parseInt(btn.dataset.index);
                this.renderDiffTabs(container); // Re-renderiza para atualizar visual
                this.loadScores();
                AudioEngine.playSFX('hover.mp3');
            });
        });
    }

    async loadScores() {
        const list = document.getElementById('global-score-list');
        list.innerHTML = '<li class="loading">LOADING...</li>';

        const song = this.availableSongs[this.currentSongIndex];
        const chart = song.charts[this.currentDiffIndex];
        
        // Busca no Firebase usando o ID do chart (ex: song1_hard)
        // Isso garante que as dificuldades sejam separadas!
        const scores = await Firebase.getScores(chart.file);

        if (scores.length === 0) {
            list.innerHTML = '<li class="empty">NO SCORES YET</li>';
            return;
        }

        list.innerHTML = scores.map((s, i) => {
            // Formata data (opcional)
            const date = s.date ? new Date(s.date.seconds * 1000).toLocaleDateString() : '-';
            
            let rankClass = '';
            if (i === 0) rankClass = 'gold';
            if (i === 1) rankClass = 'silver';
            if (i === 2) rankClass = 'bronze';

            return `
                <li class="${rankClass}">
                    <span class="col-rank">#${i + 1}</span>
                    <span class="col-name">${s.name}</span>
                    <span class="col-score">${s.score.toLocaleString()}</span>
                    <span class="col-date">${date}</span>
                </li>
            `;
        }).join('');
    }
}