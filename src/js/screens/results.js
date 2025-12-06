import Router from '../router.js';
import AudioEngine from '../audioEngine.js';

export default class ResultsScreen {
    constructor(params) {
        // Recebe os dados prontos do game.js
        this.score = params.score || 0;
        this.maxCombo = params.maxCombo || 0;
        this.percentage = params.accuracy || 0;
        this.rank = params.rank || 'C';
        
        this.sticker = this.getSticker(this.rank);
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
                    <div class="rank-section">
                        <div class="rank-letter ${this.rank.toLowerCase()}">${this.rank}</div>
                        <div class="rank-sticker">
                            <img src="./assets/images/${this.sticker}" alt="Rank Sticker" onerror="this.style.display='none'">
                        </div>
                    </div>

                    <div class="stats-panel">
                        <h2>RESULT</h2>
                        
                        <div class="stat-row">
                            <span class="label">SCORE</span>
                            <span class="value score">${this.score}</span>
                        </div>
                        <div class="stat-row">
                            <span class="label">MAX COMBO</span>
                            <!-- Garante que mostre 0 se for undefined -->
                            <span class="value combo">${this.maxCombo}</span>
                        </div>
                        <div class="stat-row">
                            <span class="label">ACCURACY</span>
                            <span class="value accuracy">${this.percentage}%</span>
                        </div>
                    </div>

                    <div class="actions">
                        <button id="btn-retry" class="btn-primary">RETRY</button>
                        <button id="btn-menu" class="btn-primary">MENU</button>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        if (this.rank === 'S' || this.rank === 'SS') {
            AudioEngine.playSFX('confirm.mp3');
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
    }
}