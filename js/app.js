const player = {
    name: "Alexandrus94",
    parcels: 135,
    badges: 6,
    boost: "x10",
    mayorTarget: 217
};

// Inserisce automaticamente i dati nella dashboard
document.getElementById("player-name").textContent = player.name;
document.getElementById("parcels").textContent = player.parcels;
document.getElementById("badges").textContent = player.badges;
document.getElementById("boost").textContent = player.boost;
document.getElementById("mayor").textContent = player.mayorTarget;

// Barra di avanzamento verso 150 terreni
const target = 150;
const progress = (player.parcels / target) * 100;

document.getElementById("progress-fill").style.width =
    Math.min(progress, 100) + "%";

document.getElementById("progress-text").textContent =
    `${player.parcels} / ${target} terreni`;
