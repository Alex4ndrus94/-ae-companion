// ======================================
// AE Companion - Motore Consigli
// ======================================

function generateAdvice() {

    const tips = [];

    const totalLands = getTotalLands();

    const current = getCurrentBreakpoint(totalLands);

    const next = getNextBreakpoint(totalLands);

    const remaining = getRemainingLandsToNextBreakpoint(totalLands);

    const days = getEstimatedStrategyDays();

    // Nessun dato ancora inserito
    if (totalLands === 0) {

        tips.push(t("tipNoData"));

        return tips;

    }

    // Countdown al prossimo obiettivo
    if (next) {

        tips.push(
            t("tipCountdown", {
                remaining: remaining,
                next: next.min,
                daily: player.settings.dailyLoginAB,
                daysText: formatDays(days)
            })
        );

        if (current && next.boost < current.boost) {

            tips.push(
                t("tipBoostDrop", {
                    current: current.boost,
                    next: next.boost
                })
            );

        }

    } else {

        tips.push(t("tipLastBreakpoint"));

    }

    // Convenienza rarità (costo terreno fisso, resa diversa)
    const commonYield = CONFIG.rentPerSecond.common;
    const legendaryYield = CONFIG.rentPerSecond.legendary;
    const multiplier = Math.round(legendaryYield / commonYield);

    tips.push(
        t("tipRarity", {
            cost: CONFIG.landCostAB,
            mult: multiplier
        })
    );

    // Costo badge
    tips.push(
        t("tipBadge", { cost: CONFIG.badgeCostAB })
    );

    return tips;

}
