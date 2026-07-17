// ======================================
// AE Companion - Dashboard
// ======================================

console.log(player);

// Totale terreni
const totalLands =
    player.lands.common +
    player.lands.rare +
    player.lands.epic +
    player.lands.legendary;

// Inserimento dati
document.getElementById("player-name").textContent = player.name;
document.getElementById("parcels").textContent = totalLands;
document.getElementById("common-count").textContent =
    player.lands.common;

document.getElementById("rare-count").textContent =
    player.lands.rare;

document.getElementById("epic-count").textContent =
    player.lands.epic;

document.getElementById("legendary-count").textContent =
    player.lands.legendary;
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
// ======================================
// Rendita
// ======================================

document.getElementById("dailyIncome").textContent =
    formatCurrency(getDailyIncomeEUR());

document.getElementById("monthlyIncome").textContent =
    formatCurrency(getMonthlyIncomeEUR());

document.getElementById("yearlyIncome").textContent =
    formatCurrency(getYearlyIncomeEUR());
// ======================================
// Informazioni Boost
// ======================================

const boostMultiplier = getCurrentBoost(totalLands);
const boostPercent = (boostMultiplier - 1) * 100;

document.getElementById("boost-info").textContent =
    `⚡ Boost attivo x${boostMultiplier} (+${boostPercent}%)`;
// ======================================
// Strategia
// ======================================

document.getElementById("landsRemaining").textContent =
    remaining;

document.getElementById("abNeeded").textContent =
    (remaining * CONFIG.landCostAB) + " AB";

document.getElementById("dailyAB").textContent =
    player.dailyAB + " AB";

const daysRemaining =
    Math.ceil((remaining * CONFIG.landCostAB) / player.dailyAB);

document.getElementById("daysRemaining").textContent =
    daysRemaining + " giorno" + (daysRemaining > 1 ? "i" : "");
