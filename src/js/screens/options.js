import Router from '../router.js';
import Storage from '../storage.js';
import AudioEngine from '../audioEngine.js';

export default class OptionsScreen {
    constructor() {
        this.waitingForKey = null; // Índice da lane que está esperando input (0-3)
        this.currentKeys = Storage.get('keybinds'); // Carrega teclas salvas
    }

    render() {
        const currentVol = Storage.get('volMusic') || 0.5;
        const isAnxiety = Storage.get('anxietyMode') ? 'checked' : '';
        const isLowSpec = Storage.get('lowSpecMode') ? 'checked' : '';

        // Gera o HTML dos 4 botões de tecla
        // Removemos o prefixo "Key" para ficar bonito (ex: "KeyD" vira "D")
        const keysHTML = this.currentKeys.map((key, index) => {
            const displayKey = key.replace('Key', '').replace('Digit', '');
            return `<button class="keybind-btn" data-index="${index}">${displayKey}</button>`;
        }).join('');

        return `
            <div class="screen-container options-screen">
                <div class="options-bg"></div>
                <div class="screen-overlay"></div>

                <div class="options-panel">
                    <h2>SYSTEM SETTINGS</h2>
                    
                    <div class="option-group">
                        <!-- CONTROLS (NOVO) -->
                        <div class="option-row column">
                            <label>Key Config (Click to rebind)</label>
                            <div class="keybinds-container">
                                ${keysHTML}
                            </div>
                        </div>

                        <div class="option-row">
                            <label>Anxiety Mode</label>
                            <label class="switch">
                                <input type="checkbox" id="chk-anxiety" ${isAnxiety}>
                                <span class="slider"></span>
                            </label>
                        </div>

                        <div class="option-row">
                            <label>Low Spec Mode</label>
                            <label class="switch">
                                <input type="checkbox" id="chk-lowspec" ${isLowSpec}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <div class="option-row">
                            <label>Music Volume</label>
                            <input type="range" id="vol-music" class="range-slider" 
                                   min="0" max="1" step="0.1" value="${currentVol}">
                        </div>
                    </div>

                    <button id="btn-save" class="btn-primary">SAVE & BACK</button>
                </div>
            </div>
        `;
    }

    init() {
        // --- LÓGICA DE KEYBIND ---
        const keyBtns = document.querySelectorAll('.keybind-btn');
        
        keyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Se já estiver esperando, cancela o anterior
                if (this.waitingForKey !== null) {
                    this.updateKeyButton(this.waitingForKey, this.currentKeys[this.waitingForKey]);
                }

                const index = parseInt(btn.dataset.index);
                this.waitingForKey = index;
                
                // Feedback visual
                btn.innerText = "PRESS...";
                btn.classList.add('waiting');
                AudioEngine.playSFX('hover.mp3');
            });
        });

        // Escuta global para capturar a nova tecla
        document.addEventListener('keydown', (e) => {
            if (this.waitingForKey !== null) {
                e.preventDefault(); // Evita scroll ou atalhos do navegador
                
                const newCode = e.code;
                const index = this.waitingForKey;

                // Salva na memória
                this.currentKeys[index] = newCode;
                
                // Atualiza visual
                this.updateKeyButton(index, newCode);
                
                // Toca som e limpa estado
                AudioEngine.playSFX('confirm.mp3');
                this.waitingForKey = null;
            }
        });

        // --- RESTO DO CÓDIGO (IGUAL ANTES) ---
        const volSlider = document.getElementById('vol-music');
        volSlider.addEventListener('input', (e) => {
            AudioEngine.setVolume('music', parseFloat(e.target.value));
        });

        document.getElementById('btn-save').addEventListener('click', () => {
            // Salva as teclas no Storage
            Storage.set('keybinds', this.currentKeys);

            const anxiety = document.getElementById('chk-anxiety').checked;
            Storage.set('anxietyMode', anxiety);
            if (anxiety) document.body.classList.add('anxiety-active');
            else document.body.classList.remove('anxiety-active');

            const lowSpec = document.getElementById('chk-lowspec').checked;
            Storage.set('lowSpecMode', lowSpec);
            if (lowSpec) document.body.classList.add('low-spec');
            else document.body.classList.remove('low-spec');

            AudioEngine.playSFX('confirm.mp3');
            Router.navigate('menu');
        });
    }

    updateKeyButton(index, code) {
        const btn = document.querySelector(`.keybind-btn[data-index="${index}"]`);
        if (btn) {
            btn.innerText = code.replace('Key', '').replace('Digit', '');
            btn.classList.remove('waiting');
        }
    }
}