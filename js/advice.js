// ======================================
// AE Companion - Motore Consigli
// (consigli azionabili, non numeri già mostrati altrove)
// ======================================

function generateAdvice() {

    const tips = [];

    const totalLands = getTotalLands();

    // Nessun dato ancora inserito
    if (totalLands === 0) {

        tips.push(t("tipNoData"));

        return tips;

    }

    const current = getCurrentBreakpoint(totalLands);

    const next = getNextBreakpoint(totalLands);

    const remaining = getRemainingLandsToNextBreakpoint(totalLands);

    const dailyAB = player.settings.dailyLoginAB;

    // ======================================
    // 1. Margine boost: urgente o rilassato
    // ======================================

    if (next && current) {

        const bracketSize = next.min - current.min;

        const urgentThreshold = Math.max(5, Math.round(bracketSize * 0.2));

        if (remaining <= urgentThreshold) {

            tips.push(
                t("tipBoostUrgent", {
                    remaining: remaining,
                    current: current.boost,
                    next: next.boost
                })
            );

        } else {

            tips.push(
                t("tipBoostRelaxed", {
                    remaining: remaining,
                    next: next.boost
                })
            );

        }

    } else {

        tips.push(t("tipLastBreakpoint"));

    }

    // ======================================
    // 2. Convenienza rarità (raccomandazione, non solo dato)
    // ======================================

    const commonYield = CONFIG.rentPerSecond.common;
    const legendaryYield = CONFIG.rentPerSecond.legendary;
    const multiplier = Math.round(legendaryYield / commonYield);

    tips.push(
        t("tipRarity", {
            cost: CONFIG.landCostAB,
            mult: multiplier
        })
    );

    // ======================================
    // 3. Simulazione "cosa succederebbe se..."
    // ======================================

    if (next && dailyAB > 0) {

        const increasedAB = Math.round(dailyAB * 1.2);

        const currentDays = Math.ceil((remaining * CONFIG.landCostAB) / dailyAB);

        const fasterDays = Math.ceil((remaining * CONFIG.landCostAB) / increasedAB);

        const daysSaved = currentDays - fasterDays;

        if (daysSaved > 0) {

            tips.push(
                t("tipWhatIf", {
                    daily: dailyAB,
                    increased: increasedAB,
                    daysSaved: formatDays(daysSaved)
                })
            );

        }

    }

    // ======================================
    // 4. Progresso verso la prossima soglia badge
    // ======================================

    const currentBadgePercent = getBadgeBoostPercent(player.badges);

    const nextBadgeTier = getNextBadgeTier(player.badges);

    if (nextBadgeTier) {

        tips.push(
            t("tipBadgeNextTier", {
                remaining: nextBadgeTier.min - player.badges,
                percent: nextBadgeTier.percent,
                current: currentBadgePercent
            })
        );

    } else {

        tips.push(t("tipBadgeMax"));

    }

    return tips;

}
