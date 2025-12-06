export default {
    init() {
        if (!localStorage.getItem('kessoku_data')) {
            localStorage.setItem('kessoku_data', JSON.stringify({
                anxietyMode: false,
                lowSpecMode: false, // <--- NOVO
                volMusic: 0.5,
                volSfx: 0.5,
                scores: {}
            }));
        } else {
            // Garante que chaves novas existam em saves antigos
            const data = JSON.parse(localStorage.getItem('kessoku_data'));
            if (data.lowSpecMode === undefined) {
                data.lowSpecMode = false;
                localStorage.setItem('kessoku_data', JSON.stringify(data));
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