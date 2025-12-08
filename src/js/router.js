import MenuScreen from './screens/menu.js';
import SelectScreen from './screens/select.js';
import GameScreen from './screens/game.js';
import OptionsScreen from './screens/options.js';
import TutorialScreen from './screens/tutorial.js';
import ResultsScreen from './screens/results.js';
import EditorScreen from './screens/editor.js';
import RankingScreen from './screens/ranking.js';
import CharSelectScreen from './screens/charSelect.js';
import ShopScreen from './screens/shop.js';

const routes = {
    'menu': MenuScreen,
    'select': SelectScreen,
    'game': GameScreen,
    'options': OptionsScreen,
    'tutorial': TutorialScreen,
    'results': ResultsScreen,
    'editor': EditorScreen,
    'charSelect': CharSelectScreen,
    'ranking': RankingScreen,
    'shop': ShopScreen
};

class Router {
    constructor() {
        this.app = document.getElementById('app');
        this.currentScreen = null;
        
        // Cria o elemento de transição se não existir
        if (!document.getElementById('transition-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'transition-overlay';
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: #000; z-index: 9999; pointer-events: none;
                opacity: 0; transition: opacity 0.3s ease-in-out;
            `;
            // Adiciona logo ou spinner aqui se quiser
            document.body.appendChild(overlay);
        }
    }

    async navigate(route, params = {}) {
        const overlay = document.getElementById('transition-overlay');
        
        // 1. Fade Out (Tela fica preta)
        overlay.style.opacity = '1';
        
        // Espera a animação (300ms)
        await new Promise(r => setTimeout(r, 300));

        // 2. Troca a tela (enquanto está preto)
        if (this.currentScreen && this.currentScreen.destroy) {
            this.currentScreen.destroy();
        }

        const ScreenClass = routes[route];
        if (!ScreenClass) {
            console.error(`Route ${route} not found`);
            overlay.style.opacity = '0';
            return;
        }

        this.app.innerHTML = ''; 
        this.currentScreen = new ScreenClass(params);
        this.app.innerHTML = this.currentScreen.render();
        
        // Inicializa a nova tela
        setTimeout(() => {
            this.currentScreen.init();
            
            // 3. Fade In (Tela aparece)
            // Pequeno delay para garantir que o DOM carregou imagens pesadas
            setTimeout(() => {
                overlay.style.opacity = '0';
            }, 100);
        }, 0);
    }
}

export default new Router();