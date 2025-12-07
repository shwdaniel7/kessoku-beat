import MenuScreen from './screens/menu.js';
import SelectScreen from './screens/select.js';
import GameScreen from './screens/game.js';
import OptionsScreen from './screens/options.js';
import TutorialScreen from './screens/tutorial.js';
import ResultsScreen from './screens/results.js';
import EditorScreen from './screens/editor.js';
import RankingScreen from './screens/ranking.js';

const routes = {
    'menu': MenuScreen,
    'select': SelectScreen,
    'game': GameScreen,
    'options': OptionsScreen,
    'tutorial': TutorialScreen,
    'results': ResultsScreen,
    'editor': EditorScreen,
    'ranking': RankingScreen
};

class Router {
    constructor() {
        this.app = document.getElementById('app');
        this.currentScreen = null;
    }

    navigate(route, params = {}) {
        if (this.currentScreen && this.currentScreen.destroy) {
            this.currentScreen.destroy();
        }

        const ScreenClass = routes[route];
        if (!ScreenClass) {
            console.error(`Route ${route} not found`);
            return;
        }

        this.app.innerHTML = ''; // Limpa tela anterior
        this.currentScreen = new ScreenClass(params);
        this.app.innerHTML = this.currentScreen.render();
        
        // Aguarda renderização do DOM para anexar eventos
        setTimeout(() => {
            this.currentScreen.init();
        }, 0);
    }
}

export default new Router();