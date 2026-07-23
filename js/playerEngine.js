// ======================================
// AE Companion - Player Engine
// ======================================

// Totale terreni
function getTotalLands() {

    return (
        player.lands.common +
        player.lands.rare +
        player.lands.epic +
        player.lands.legendary
    );

}

// Boost attuale
function getBoostMultiplier() {

    return getCurrentBoost(getTotalLands());

}

// Percentuale boost
function getBoostPercent() {

    return (getBoostMultiplier() - 1) * 100;

}

// AB necessari per acquistare N terreni
function getABNeeded(lands) {

    return lands * CONFIG.landCostAB;

}

// Giorni necessari
function getEstimatedDays(lands) {

    return Math.ceil(
        getABNeeded(lands) /
        player.settings.dailyLoginAB
    );

}
