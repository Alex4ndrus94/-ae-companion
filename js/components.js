// ======================================
// AE Companion - UI Components
// ======================================

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
