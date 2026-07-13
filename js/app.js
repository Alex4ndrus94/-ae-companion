alert("app.js caricato!");
alert("Player: " + player.name);
// ======================================
// AE Companion - Dashboard
// ======================================

// Totale terreni
const totalLands =
    player.lands.common +
    player.lands.rare +
    player.lands.epic +
    player.lands.legendary;

// Inserimento dati
document.getElementById("player-name").textContent = player.name;
document.getElementById("parcels").textContent = totalLands;
document.getElementById("badges").textContent = player.badges;
document.getElementById("mayor").textContent = player.mayorTarget;

// AE Core
const current = getCurrentBreakpoint(totalLands);
const next = getNextBreakpoint(totalLands);
const remaining = getRemainingLandsToNextBreakpoint(totalLands);

// Boost
document.getElementById("boost").textContent =
    "x" + getCurrentBoost(totalLands);

// Barra di avanzamento
const percentage =
    ((totalLands - current.min) /
    (current.max - current.min)) * 100;

document.getElementById("progress-fill").style.width =
    percentage + "%";

document.getElementById("progress-text").textContent =
    next
        ? `${totalLands} / ${next.min} terreni • Ne manca ${remaining}`
        : `${totalLands} terreni • Ultimo breakpoint`;
