// ======================================
// AE Companion - Dashboard
// ======================================

console.log(player);

// Totale terreni
const totalLands = getTotalLands();

// Inserimento dati
setText("player-name", player.profile.name);

setText("parcels", totalLands);

setText("common-count", player.lands.common);

setText("rare-count", player.lands.rare);

setText("epic-count", player.lands.epic);

setText("legendary-count", player.lands.legendary);

setText("badges", player.badges);

setText("boost", "x" + getBoostMultiplier());

setText("mayor", player.mayorTarget);

// ======================================
// AE Core
// ======================================

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

setWidth(
    "progress-fill",
    percentage + "%"
);

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

const boostMultiplier =
    getBoostMultiplier();

const boostPercent =
    getBoostPercent();

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
    settings.dailyLoginAB + " AB";

const daysRemaining =
    Math.ceil(
        (remaining * CONFIG.landCostAB) /
        settings.dailyLoginAB
    );

document.getElementById("daysRemaining").textContent =
    daysRemaining + " giorno" +
    (daysRemaining > 1 ? "i" : "");
