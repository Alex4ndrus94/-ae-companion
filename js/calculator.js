// ======================================
// AE Core - Calculator
// Versione 1.0
// ======================================

function getCurrentBreakpoint(lands) {

    return CONFIG.breakpoints.find(bp =>
        lands >= bp.min && lands <= bp.max
    );

}

function getNextBreakpoint(lands) {

    return CONFIG.breakpoints.find(bp =>
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
