// ======================================
// AE Companion - UI Components
// ======================================

// Abbrevia i numeri grandi in stile gioco: 1900 -> "1.9k", 23000 -> "23k"
// Sotto i 1000 mostra il numero esatto, senza arrotondamenti
function formatK(n) {

    n = Number(n) || 0;

    if (n < 1000) return String(n);

    const value = n / 1000;

    const rounded = Math.round(value * 10) / 10;

    const text = (rounded % 1 === 0) ? rounded.toFixed(0) : rounded.toFixed(1);

    return text + "k";

}

// Crea una Stat Box
function createStatBox(title, value, id = "") {

    return `
        <div class="stat-box">
            <span class="stat-title">${title}</span>
            <span class="stat-value" ${id ? `id="${id}"` : ""}>
                ${value}
            </span>
        </div>
    `;

}
