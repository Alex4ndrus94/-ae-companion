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

    // AB/day automatici se Explorer Club è in corso, altrimenti quelli inseriti dal player
    const daily = getEffectiveDailyAB();

    if (daily <= 0) return Infinity;

    return Math.ceil(getABNeeded(lands) / daily);

}
