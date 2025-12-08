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
        
        // Flag de Auto Play (Bloqueia ranking)
        this.isAuto = params.isAuto || false;
        
        // Dinheiro ganho na partida
        this.yen = params.yen || 0;
        
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
        // --- HTML DO DINHEIRO ---
        const moneyHTML = this.yen > 0 ? `
            <div class="money-reward">
                <span class="money-label">EARNED</span>
                <span class="money-value">+ ¥ ${this.yen}</span>
            </div>
        ` : '';

        // --- HTML DO PAINEL DE LEADERBOARD ---
        // Preparamos os containers ocultos para a lógica do init() revelar
        let leaderboardContent = '';

        if (this.isAuto) {
            leaderboardContent = `
                <div style="text-align: center; color: var(--color-nijika); font-family: var(--font-display); padding: 20px;">
                    <h3 style="font-size: 1.5rem; margin-bottom: 5px;">AUTO PLAY MODE</h3>
                    <p style="font-size: 0.8rem; color: #aaa;">SCORE NOT SAVED</p>
                </div>
            `;
        } else {
            leaderboardContent = `
                <!-- Modo Visitante: Input Manual -->
                <div id="arcade-input" style="display:none;">
                    <p class="enter-name">ENTER NAME</p>
                    <div class="input-group">
                        <input type="text" id="player-name" maxlength="3" placeholder="AAA" autocomplete="off">
                        <button id="btn-submit" class="btn-small">SUBMIT</button>
                    </div>
                </div>

                <!-- Modo Logado: Mensagem Automática -->
                <div id="logged-msg" style="display:none; text-align:center; color:var(--color-bocchi); padding: 10px;">
                    <p style="font-family: var(--font-display); font-size: 0.9rem;">SAVING SCORE AS</p>
                    <p id="logged-name" style="font-family: var(--font-display); font-size: 1.5rem; color:white; margin-top:5px;">...</p>
                </div>
                
                <!-- Loading -->
                <div id="loading-area" style="display:none;">LOADING RANKS...</div>
                
                <!-- Tabela -->
                <div id="table-area" style="display:none;">
                    <h3>TOP 5 - GLOBAL</h3>
                    <ul id="score-list"></ul>
                </div>
            `;
        }

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
                            
                            <!-- RECOMPENSA -->
                            ${moneyHTML}
                        </div>

                        <!-- Área do Leaderboard -->
                        <div class="leaderboard-panel">
                            ${leaderboardContent}
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
        // Som de Sucesso
        if (this.rank === 'S' || this.rank === 'SS') AudioEngine.playSFX('confirm.mp3');

        // --- LÓGICA HÍBRIDA (LOGADO vs VISITANTE) ---
        if (!this.isAuto) {
            Firebase.onUserChange(async (user) => {
                if (user) {
                    // --- USUÁRIO LOGADO ---
                    document.getElementById('logged-msg').style.display = 'block';
                    document.getElementById('logged-name').innerText = user.displayName.toUpperCase();
                    
                    // 1. Salva Dinheiro
                    if (this.yen > 0) {
                        await Firebase.addMoney(user.uid, this.yen);
                    }
                    
                    // 2. Salva Score Automaticamente
                    if (!this.submitted) {
                        await this.submitScore(user.displayName, user.uid);
                    } else {
                        this.loadLeaderboard();
                    }

                } else {
                    // --- VISITANTE (GUEST) ---
                    document.getElementById('arcade-input').style.display = 'block';
                    
                    const input = document.getElementById('player-name');
                    if (input) {
                        input.focus();
                        
                        document.getElementById('btn-submit').addEventListener('click', () => {
                            const name = input.value.trim();
                            if(name) this.submitScore(name, null);
                        });
                        
                        input.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter' && input.value.trim()) this.submitScore(input.value.trim(), null);
                        });
                    }
                    
                    // Carrega o ranking para ele ver
                    this.loadLeaderboard();
                }
            });
        } else {
            // Se for Auto Play, só carrega a lista (sem salvar nada)
            this.loadLeaderboard();
        }

        // Botões de Navegação
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

    async submitScore(name, uid) {
        if (this.submitted || this.isAuto) return;
        this.submitted = true;

        // UI Feedback
        const arcadeInput = document.getElementById('arcade-input');
        const loggedMsg = document.getElementById('logged-msg');
        const loadingArea = document.getElementById('loading-area');

        if(arcadeInput) arcadeInput.style.display = 'none';
        if(loggedMsg) loggedMsg.style.display = 'none';
        if(loadingArea) loadingArea.style.display = 'block';

        // Salva no Firebase
        await Firebase.saveScore(name, this.score, this.chartId, uid);
        
        // Recarrega lista
        await this.loadLeaderboard();
    }

    async loadLeaderboard() {
        const list = document.getElementById('score-list');
        const loadingArea = document.getElementById('loading-area');
        const tableArea = document.getElementById('table-area');

        // Se não tiver os elementos (ex: auto play mode), aborta
        if (!list) return;

        const scores = await Firebase.getScores(this.chartId);

        if(loadingArea) loadingArea.style.display = 'none';
        if(tableArea) tableArea.style.display = 'block';
        
        // Se não enviou e não é auto e não está logado, mostra input de volta
        // (Lógica complexa simplificada: se a lista carregou e o user ainda não enviou, o input já deve estar visível pelo init)

        list.innerHTML = scores.map((s, i) => {
            // Destaca o score se for igual ao atual e o nome bater
            // (Funciona tanto para Guest quanto Logado se o nome bater)
            const isMyScore = !this.isAuto && s.score === this.score; 
            // Nota: Comparação por score é "arriscada" se tiver empate, mas serve para arcade.
            // Se tiver UID, seria melhor comparar UID.

            let rankClass = '';
            if (i === 0) rankClass = 'gold'; 

            return `
                <li class="${isMyScore ? 'highlight' : ''} ${rankClass}">
                    <span class="rank-num">#${i + 1}</span>
                    <span class="rank-name">${s.name}</span>
                    <span class="rank-score">${s.score.toLocaleString()}</span>
                </li>
            `;
        }).join('');
        
        if (scores.length === 0) {
            list.innerHTML = '<li style="text-align:center; color:#666;">NO SCORES YET</li>';
        }
    }
}