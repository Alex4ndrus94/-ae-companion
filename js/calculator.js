// ======================================
// AE Core - Calculator
// Versione 2.0 - Multi-paese
// ======================================

function getCurrentBreakpoint(lands) {

    return getActiveBreakpoints().find(bp =>
        lands >= bp.min && lands <= bp.max
    );

}

function getNextBreakpoint(lands) {

    return getActiveBreakpoints().find(bp =>
        lands < bp.min
    );

}

function getRemainingLandsToNextBreakpoint(lands) {

    const next = getNextBreakpoint(lands);

    if (!next) return 0;

    return next.min - lands;

}

function getCurrentBoost(lands) {

    const current = getCurrentBreakpoint(lands);

    return current ? current.boost : 1;

}

// Bonus passaporto (%) in base al numero di badge posseduti
function getBadgeBoostPercent(badges) {

    const tier = CONFIG.badgeBoostTiers.find(t =>
        badges >= t.min && badges <= t.max
    );

    return tier ? tier.percent : 0;

}

// Prossima soglia badge (per i consigli)
function getNextBadgeTier(badges) {

    return CONFIG.badgeBoostTiers.find(t => badges < t.min);

}

// ======================================
// "Punto morto" nel passaggio tra due fasce boost.
// Superare il tetto della fascia attuale senza arrivare
// abbastanza lontano nella fascia successiva fa scendere
// la rendita invece di farla salire. Calcola la soglia
// minima di terreni necessaria per "recuperare" il livello
// di rendita che si aveva al tetto della fascia attuale.
// ======================================

function getBracketTransitionRecovery(totalLands) {

    const current = getCurrentBreakpoint(totalLands);
    const next = getNextBreakpoint(totalLands);

    if (!current || !next) return null;

    // Terreni necessari nella nuova fascia per eguagliare
    // la rendita che si aveva al tetto della fascia attuale
    const recoveryLands = Math.ceil((current.max * current.boost) / next.boost);

    const hasDeadZone = recoveryLands > next.min;

    return {
        current: current,
        next: next,
        recoveryLands: recoveryLands,
        hasDeadZone: hasDeadZone
    };

}
