import Router from '../router.js';
import Storage from '../storage.js';
import AudioEngine from '../audioEngine.js';

export default class OptionsScreen {
    render() {
        const currentVol = Storage.get('volMusic') || 0.5;
        const isAnxiety = Storage.get('anxietyMode') ? 'checked' : '';
        // Verifica se está ativo
        const isLowSpec = Storage.get('lowSpecMode') ? 'checked' : '';

        return `
            <div class="screen-container options-screen">
                <div class="options-bg"></div>
                <div class="screen-overlay"></div>

                <div class="options-panel">
                    <h2>SYSTEM SETTINGS</h2>
                    
                    <div class="option-group">
                        <!-- MODO ANSIEDADE -->
                        <div class="option-row">
                            <label>Anxiety Mode (Shake UI)</label>
                            <label class="switch">
                                <input type="checkbox" id="chk-anxiety" ${isAnxiety}>
                                <span class="slider"></span>
                            </label>
                        </div>

                        <!-- MODO LEVE (NOVO) -->
                        <div class="option-row">
                            <label>Low Spec Mode (2D / No Glow)</label>
                            <label class="switch">
                                <input type="checkbox" id="chk-lowspec" ${isLowSpec}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <!-- VOLUME -->
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
        const volSlider = document.getElementById('vol-music');
        volSlider.addEventListener('input', (e) => {
            AudioEngine.setVolume('music', parseFloat(e.target.value));
        });

        document.getElementById('btn-save').addEventListener('click', () => {
            // Salva Ansiedade
            const anxiety = document.getElementById('chk-anxiety').checked;
            Storage.set('anxietyMode', anxiety);
            if (anxiety) document.body.classList.add('anxiety-active');
            else document.body.classList.remove('anxiety-active');

            // Salva Low Spec (Modo Leve)
            const lowSpec = document.getElementById('chk-lowspec').checked;
            Storage.set('lowSpecMode', lowSpec);
            
            // Aplica a classe imediatamente no body
            if (lowSpec) document.body.classList.add('low-spec');
            else document.body.classList.remove('low-spec');

            AudioEngine.playSFX('confirm.mp3');
            Router.navigate('menu');
        });
    }
}