import Router from '../router.js';
import AudioEngine from '../audioEngine.js';
import Firebase from '../firebase.js'; // <--- Importe o módulo novo

export default class ResultsScreen {
    constructor(params) {
        this.score = params.score || 0;
        this.maxCombo = params.maxCombo || 0;
        this.percentage = params.accuracy || 0;
        this.rank = params.rank || 'C';
        this.chartId = params.chartId || 'song1_hard'; // ID para o banco de dados
        
        this.sticker = this.getSticker(this.rank);
        this.submitted = false; // Para não enviar duas vezes
    }

    getSticker(rank) {
        switch(rank) {
            case 'SS': return 'sticker_ss.png';
            case 'S': return 'sticker_s.png';
            case 'A': return 'sticker_a.png';
            case 'B': return 'sticker_b.png';
            default: return 'sticker_c.png';
        }
    }

    render() {
        return `
            <div class="screen-container results-screen">
                <div class="results-bg"></div>
                <div class="results-overlay"></div>

                <div class="results-content">
                    <!-- Lado Esquerdo: Rank -->
                    <div class="rank-section">
                        <div class="rank-letter ${this.rank.toLowerCase()}">${this.rank}</div>
                        <div class="rank-sticker">
                            <img src="./assets/images/${this.sticker}" alt="Rank Sticker" onerror="this.style.display='none'">
                        </div>
                    </div>

                    <!-- Lado Direito: Stats e Leaderboard -->
                    <div class="right-panel">
                        
                        <!-- Stats Normais -->
                        <div class="stats-panel">
                            <h2>RESULT</h2>
                            <div class="stat-row"><span class="label">SCORE</span><span class="value score">${this.score}</span></div>
                            <div class="stat-row"><span class="label">MAX COMBO</span><span class="value combo">${this.maxCombo}</span></div>
                            <div class="stat-row"><span class="label">ACCURACY</span><span class="value accuracy">${this.percentage}%</span></div>
                        </div>

                        <!-- Área do Leaderboard (Arcade Style) -->
                        <div class="leaderboard-panel">
                            <div id="input-area">
                                <p class="enter-name">ENTER NAME</p>
                                <div class="input-group">
                                    <input type="text" id="player-name" maxlength="3" placeholder="AAA" autocomplete="off">
                                    <button id="btn-submit" class="btn-small">SUBMIT</button>
                                </div>
                            </div>
                            
                            <div id="loading-area" style="display:none;">LOADING RANKS...</div>
                            
                            <div id="table-area" style="display:none;">
                                <h3>TOP 5 - GLOBAL</h3>
                                <ul id="score-list"></ul>
                            </div>
                        </div>

                        <div class="actions">
                            <button id="btn-retry" class="btn-primary">RETRY</button>
                            <button id="btn-menu" class="btn-primary">MENU</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        if (this.rank === 'S' || this.rank === 'SS') AudioEngine.playSFX('confirm.mp3');

        // Foca no input automaticamente
        const input = document.getElementById('player-name');
        input.focus();

        // Botão Enviar
        document.getElementById('btn-submit').addEventListener('click', () => this.submitScore());
        
        // Enviar com Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.submitScore();
        });

        // Botões de Navegação
        document.getElementById('btn-retry').addEventListener('click', () => {
            AudioEngine.playSFX('confirm.mp3');
            Router.navigate('select');
        });

        document.getElementById('btn-menu').addEventListener('click', () => {
            AudioEngine.playSFX('confirm.mp3');
            Router.navigate('menu');
        });
        
        // Carrega o leaderboard atual (sem o seu score novo ainda)
        this.loadLeaderboard();
    }

    async submitScore() {
        if (this.submitted) return;
        
        const nameInput = document.getElementById('player-name');
        const name = nameInput.value.trim();

        if (name.length < 1) return;

        this.submitted = true;
        AudioEngine.playSFX('confirm.mp3');

        // UI Loading
        document.getElementById('input-area').style.display = 'none';
        document.getElementById('loading-area').style.display = 'block';

        // Salva no Firebase
        await Firebase.saveScore(name, this.score, this.chartId);

        // Recarrega a lista
        await this.loadLeaderboard();
    }

    async loadLeaderboard() {
        const list = document.getElementById('score-list');
        const scores = await Firebase.getScores(this.chartId);

        document.getElementById('loading-area').style.display = 'none';
        document.getElementById('table-area').style.display = 'block';
        
        // Se ainda não enviou, mostra o input, senão esconde
        if (!this.submitted) {
            document.getElementById('input-area').style.display = 'block';
        } else {
            document.getElementById('input-area').style.display = 'none';
        }

        list.innerHTML = scores.map((s, i) => `
            <li class="${s.score === this.score && s.name === document.getElementById('player-name').value.toUpperCase() ? 'highlight' : ''}">
                <span class="rank-num">#${i + 1}</span>
                <span class="rank-name">${s.name}</span>
                <span class="rank-score">${s.score}</span>
            </li>
        `).join('');
        
        if (scores.length === 0) {
            list.innerHTML = '<li style="text-align:center; color:#666;">NO SCORES YET</li>';
        }
    }
}