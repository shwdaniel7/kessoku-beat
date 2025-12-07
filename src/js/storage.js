export default {
    init() {
        const defaultData = {
            anxietyMode: false,
            lowSpecMode: false,
            volMusic: 0.5,
            volSfx: 0.5,
            // --- NOVO: Teclas Padrão (Códigos do Teclado) ---
            keybinds: ['KeyD', 'KeyF', 'KeyJ', 'KeyK'], 
            scores: {}
        };

        if (!localStorage.getItem('kessoku_data')) {
            localStorage.setItem('kessoku_data', JSON.stringify(defaultData));
        } else {
            // Migração: Garante que saves antigos recebam as novas chaves
            const currentData = JSON.parse(localStorage.getItem('kessoku_data'));
            let updated = false;

            if (!currentData.keybinds) {
                currentData.keybinds = defaultData.keybinds;
                updated = true;
            }
            // (Adicione outras verificações de migração aqui se precisar no futuro)

            if (updated) {
                localStorage.setItem('kessoku_data', JSON.stringify(currentData));
            }
        }
    },

    get(key) {
        const data = JSON.parse(localStorage.getItem('kessoku_data'));
        return data ? data[key] : null;
    },

    set(key, value) {
        const current = localStorage.getItem('kessoku_data');
        const data = current ? JSON.parse(current) : {};
        data[key] = value;
        localStorage.setItem('kessoku_data', JSON.stringify(data));
    }
};