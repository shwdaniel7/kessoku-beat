export default {
    init() {
        if (!localStorage.getItem('kessoku_data')) {
            localStorage.setItem('kessoku_data', JSON.stringify({
                anxietyMode: false,
                scores: {}
            }));
        }
    },
    get(key) {
        const data = JSON.parse(localStorage.getItem('kessoku_data'));
        return data[key];
    },
    set(key, value) {
        const data = JSON.parse(localStorage.getItem('kessoku_data'));
        data[key] = value;
        localStorage.setItem('kessoku_data', JSON.stringify(data));
    }
};