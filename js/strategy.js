// ======================================
// AE Companion - Strategy Engine
// ======================================

// Terreni mancanti al prossimo breakpoint
function getRemainingLands() {

    return getRemainingLandsToNextBreakpoint(
        getTotalLands()
    );

}

// AB necessari
function getRequiredAB() {

    return getABNeeded(
        getRemainingLands()
    );

}

// Giorni stimati
function getEstimatedStrategyDays() {

    return getEstimatedDays(
        getRemainingLands()
    );

}

// Prossimo breakpoint
function getNextBreakpointTarget() {

    const next =
        getNextBreakpoint(getTotalLands());

    return next ? next.min : null;

}
