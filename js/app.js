// ======================================
// AE Companion - App
// Versione 1.0
// ======================================

// Dati del giocatore
const player = {

    name: "Alexandrus94",

    lands: 135,

    badges: 6,

    mayorTarget: 217,

    dailyAB: 91

};

// Inserimento dati dashboard
document.getElementById("player-name").textContent = player.name;
document.getElementById("parcels").textContent = player.lands;
document.getElementById("badges").textContent = player.badges;
document.getElementById("mayor").textContent = player.mayorTarget;

// =========================
// AE CORE
// =========================

const current = getCurrentBreakpoint(player.lands);

const next = getNextBreakpoint(player.lands);

const remaining = getRemainingLandsToNextBreakpoint(player.lands);

document.getElementById("boost").textContent =
    "x" + getCurrentBoost(player.lands);

// Calcolo barra progresso
let percentage = 100;

if (next) {

    percentage =
        ((player.lands - current.min) /
        (current.max - current.min)) * 100;

}

document.getElementById("progress-fill").style.width =
    percentage + "%";

document.getElementById("progress-text").textContent =
    `${player.lands} / ${next ? next.min : current.max} terreni • Mancano ${remaining}`;
