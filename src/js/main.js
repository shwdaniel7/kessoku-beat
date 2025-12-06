import Router from './router.js';
import Storage from './storage.js';
import AudioEngine from './audioEngine.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎸 Kessoku Beat Initializing...');
    
    Storage.init();
    
    // Aplica Modo Ansiedade
    if (Storage.get('anxietyMode')) {
        document.body.classList.add('anxiety-active');
    }

    // Aplica Low Spec Mode (Modo Leve)
    if (Storage.get('lowSpecMode')) {
        document.body.classList.add('low-spec');
    }

    Router.navigate('menu');
});