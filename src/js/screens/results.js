import Router from '../router.js';
import AudioEngine from '../audioEngine.js';
import Firebase from '../firebase.js';

export default class ResultsScreen {
    constructor(params) {
        this.score = params.score || 0;
        this.maxCombo = params.maxCombo || 0;
        this.percentage = params.accuracy || 0;
        this.rank = params.rank || 'C';
        this.chartId = params.chartId || 'song1_hard';
        
        // --- RECEBE A FLAG DE AUTO PLAY ---
        this.isAuto = params.isAuto || false;
        
        this.sticker = this.getSticker(this.rank);
        this.submitted = false;
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
        // --- LÓGICA DE EXIBIÇÃO DO INPUT ---
        let inputHTML = '';
        
        if (this.isAuto) {
            // Se for Auto Play, mostra aviso
            inputHTML = `
                <div style="text-align: center; color: var(--color-nijika); font-family: var(--font-display); padding: 20px;">
                    <h3 style="font-size: 1.5rem; margin-bottom: 5px;">AUTO PLAY MODE</h3>
                    <p style="font-size: 0.8rem; color: #aaa;">SCORE NOT SAVED</p>
                </div>
            `;
        } else {
            // Se for jogo normal, mostra input
            inputHTML = `
                <div id="input-area">
                    <p class="enter-name">ENTER NAME</p>
                    <div class="input-group">
                        <input type="text" id="player-name" maxlength="3" placeholder="AAA" autocomplete="off">
                        <button id="btn-submit" class="btn-small">SUBMIT</button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="screen-container results-screen">
                <div class="results-bg"></div>
                <div class="results-overlay"></div>

                <div class="results-content">
                    <div class="rank-section">
                        <div class="rank-letter ${this.rank.toLowerCase()}">${this.rank}</div>
                        <div class="rank-sticker">
                            <img src="./assets/images/${this.sticker}" alt="Rank Sticker" onerror="this.style.display='none'">
                        </div>
                    </div>

                    <div class="right-panel">
                        <div class="stats-panel">
                            <h2>RESULT</h2>
                            <div class="stat-row"><span class="label">SCORE</span><span class="value score">${this.score}</span></div>
                            <div class="stat-row"><span class="label">MAX COMBO</span><span class="value combo">${this.maxCombo}</span></div>
                            <div class="stat-row"><span class="label">ACCURACY</span><span class="value accuracy">${this.percentage}%</span></div>
                        </div>

                        <div class="leaderboard-panel">
                            ${inputHTML}
                            
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

        // Só configura o input se NÃO for Auto Play
        if (!this.isAuto) {
            const input = document.getElementById('player-name');
            if (input) {
                input.focus();
                document.getElementById('btn-submit').addEventListener('click', () => this.submitScore());
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') this.submitScore();
                });
            }
        }

        const btnRetry = document.getElementById('btn-retry');
        const btnMenu = document.getElementById('btn-menu');

        [btnRetry, btnMenu].forEach(btn => {
            btn.addEventListener('mouseenter', () => AudioEngine.playSFX('hover.mp3'));
        });

        btnRetry.addEventListener('click', () => {
            AudioEngine.playSFX('confirm.mp3');
            Router.navigate('select');
        });

        btnMenu.addEventListener('click', () => {
            AudioEngine.playSFX('confirm.mp3');
            Router.navigate('menu');
        });
        
        this.loadLeaderboard();
    }

    async submitScore() {
        if (this.submitted || this.isAuto) return;
        
        const nameInput = document.getElementById('player-name');
        const name = nameInput.value.trim();

        if (name.length < 1) return;

        this.submitted = true;
        AudioEngine.playSFX('confirm.mp3');

        document.getElementById('input-area').style.display = 'none';
        document.getElementById('loading-area').style.display = 'block';

        await Firebase.saveScore(name, this.score, this.chartId);
        await this.loadLeaderboard();
    }

    async loadLeaderboard() {
        const list = document.getElementById('score-list');
        const scores = await Firebase.getScores(this.chartId);

        document.getElementById('loading-area').style.display = 'none';
        document.getElementById('table-area').style.display = 'block';
        
        // Se não for Auto e não enviou, mostra input
        if (!this.submitted && !this.isAuto) {
            const inputArea = document.getElementById('input-area');
            if(inputArea) inputArea.style.display = 'block';
        }

        list.innerHTML = scores.map((s, i) => {
            // Verifica se é o score atual do jogador (apenas se não for auto)
            const isMyScore = !this.isAuto && 
                              s.score === this.score && 
                              document.getElementById('player-name') &&
                              s.name === document.getElementById('player-name').value.toUpperCase();

            return `
                <li class="${isMyScore ? 'highlight' : ''}">
                    <span class="rank-num">#${i + 1}</span>
                    <span class="rank-name">${s.name}</span>
                    <span class="rank-score">${s.score}</span>
                </li>
            `;
        }).join('');
        
        if (scores.length === 0) {
            list.innerHTML = '<li style="text-align:center; color:#666;">NO SCORES YET</li>';
        }
    }
}