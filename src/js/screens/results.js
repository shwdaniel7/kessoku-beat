import Router from '../router.js';

export default class ResultsScreen {
    constructor(params) {
        this.score = params.score || 0;
        this.maxCombo = params.maxCombo || 0;
    }

    render() {
        return `
            <div class="screen-container results-screen">
                <h2>RESULT</h2>
                <div class="stats">
                    <div class="stat-item">
                        <span>SCORE</span>
                        <span class="stat-value neon-text">${this.score}</span>
                    </div>
                    <div class="stat-item">
                        <span>MAX COMBO</span>
                        <span class="stat-value">${this.maxCombo}</span>
                    </div>
                </div>
                <div class="actions">
                    <button id="btn-retry" class="btn-primary">Retry</button>
                    <button id="btn-menu" class="btn-primary">Menu</button>
                </div>
            </div>
        `;
    }

    init() {
        document.getElementById('btn-retry').addEventListener('click', () => Router.navigate('select'));
        document.getElementById('btn-menu').addEventListener('click', () => Router.navigate('menu'));
    }
}