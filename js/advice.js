// ======================================
// AE Companion - Motore Strategico
// Il consiglio principale cambia in base all'obiettivo scelto
// ======================================

// Rendita media attesa per un nuovo terreno (mix ponderato sulle probabilità di rarità)
function getExpectedRentPerSecondPerLand() {

    const odds = CONFIG.rarityOdds;

    return (
        (odds.common / 100) * CONFIG.rentPerSecond.common +
        (odds.rare / 100) * CONFIG.rentPerSecond.rare +
        (odds.epic / 100) * CONFIG.rentPerSecond.epic +
        (odds.legendary / 100) * CONFIG.rentPerSecond.legendary
    );

}

// ======================================
// Confronto efficienza: Terreni vs Badge
// (usato come consiglio principale per l'obiettivo "efficienza",
//  e come motore di supporto per l'obiettivo "rendita")
// ======================================

function getEfficiencyComparison(totalLands) {

    const boostMultiplier = getCurrentBoost(totalLands);
    const currentBadgePercent = getBadgeBoostPercent(player.badges);
    const nextBadgeTier = getNextBadgeTier(player.badges);

    const landDailyGain =
        getExpectedRentPerSecondPerLand() *
        (1 + currentBadgePercent / 100) *
        boostMultiplier * 86400;

    const landEfficiency = landDailyGain / CONFIG.landCostAB;

    let badgeEfficiency = 0;
    let badgeDailyGain = 0;
    let abToNextBadgeTier = 0;

    if (nextBadgeTier) {

        abToNextBadgeTier = (nextBadgeTier.min - player.badges) * CONFIG.badgeCostAB;

        const percentGain = nextBadgeTier.percent - currentBadgePercent;

        badgeDailyGain =
            getRawIncomePerSecond() *
            (percentGain / 100) *
            boostMultiplier * 86400;

        badgeEfficiency = badgeDailyGain / abToNextBadgeTier;

    }

    return {
        landDailyGain: landDailyGain,
        landEfficiency: landEfficiency,
        badgeDailyGain: badgeDailyGain,
        badgeEfficiency: badgeEfficiency,
        abToNextBadgeTier: abToNextBadgeTier,
        nextBadgeTier: nextBadgeTier
    };

}

function convertToDisplay(usdValue) {

    return getCurrentLanguage() === "it"
        ? usdValue * CONFIG.exchangeRate
        : usdValue;

}

function getEfficiencyTip(totalLands) {

    const c = getEfficiencyComparison(totalLands);

    if (c.landEfficiency <= 0 && c.badgeEfficiency <= 0) {

        return t("tipAccumulate");

    }

    if (c.badgeEfficiency > c.landEfficiency) {

        return t("tipRecommendBadge", {
            abNeeded: c.abToNextBadgeTier,
            percent: c.nextBadgeTier.percent,
            gainFormatted: formatCurrency(convertToDisplay(c.badgeDailyGain))
        });

    }

    return t("tipRecommendLand", {
        abCost: CONFIG.landCostAB,
        gainFormatted: formatCurrency(convertToDisplay(c.landDailyGain))
    });

}

// ======================================
// Consiglio principale per obiettivo "rendita specifica"
// ======================================

function getIncomeGoalTip(totalLands) {

    const boosted = player.goal.incomeTargetBoosted;

    const currentUSD = boosted ? getDailyIncome() : getBaseDailyIncome();

    const targetUSD = player.goal.incomeTargetUSD;

    if (currentUSD >= targetUSD) {

        return t("tipGoalIncomeReached", {
            targetFormatted: formatCurrency(convertToDisplay(targetUSD))
        });

    }

    const gapUSD = targetUSD - currentUSD;

    const c = getEfficiencyComparison(totalLands);

    // Stima approssimativa di quanti terreni servono per colmare il gap
    // (assume che l'efficienza per terreno resti costante: approssimazione,
    //  non tiene conto di eventuali cambi di fascia boost nel frattempo)
    const bestDailyGainPerAB = Math.max(c.landEfficiency, c.badgeEfficiency, 0.000001);

    const abNeeded = Math.ceil(gapUSD / bestDailyGainPerAB);

    const daysNeeded = player.settings.dailyLoginAB > 0
        ? Math.ceil(abNeeded / player.settings.dailyLoginAB)
        : null;

    return t("tipGoalIncomeGap", {
        targetFormatted: formatCurrency(convertToDisplay(targetUSD)),
        gapFormatted: formatCurrency(convertToDisplay(gapUSD)),
        abNeeded: abNeeded,
        daysText: daysNeeded !== null ? formatDays(daysNeeded) : "—"
    });

}

// ======================================
// Consiglio principale per obiettivo "numero di terreni"
// ======================================

function getLandsGoalTip(totalLands) {

    const target = player.goal.landsTarget;

    if (totalLands >= target) {

        return t("tipGoalLandsReached", { target: target });

    }

    const remaining = target - totalLands;

    const abNeeded = remaining * CONFIG.landCostAB;

    const daysNeeded = player.settings.dailyLoginAB > 0
        ? Math.ceil(abNeeded / player.settings.dailyLoginAB)
        : null;

    return t("tipGoalLandsGap", {
        target: target,
        remaining: remaining,
        abNeeded: abNeeded,
        daysText: daysNeeded !== null ? formatDays(daysNeeded) : "—"
    });

}

// ======================================
// Motore principale
// ======================================

function generateAdvice() {

    const tips = [];

    const totalLands = getTotalLands();

    if (totalLands === 0) {

        tips.push(t("tipNoData"));

        return tips;

    }

    const goalType = player.goal.type;

    // ======================================
    // 1. Consiglio principale, in base all'obiettivo
    // ======================================

    if (goalType === "income") {

        tips.push(getIncomeGoalTip(totalLands));

    } else if (goalType === "lands") {

        tips.push(getLandsGoalTip(totalLands));

    } else if (goalType === "mayor") {

        tips.push(t("tipMayorStrategy"));

    } else {

        tips.push(getEfficiencyTip(totalLands));

    }

    // ======================================
    // 2. Margine boost (sempre utile, qualsiasi obiettivo)
    // ======================================

    const current = getCurrentBreakpoint(totalLands);
    const next = getNextBreakpoint(totalLands);
    const remaining = getRemainingLandsToNextBreakpoint(totalLands);

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
    // 3. Rarità: informativa (assegnata casualmente, non scelta dal player)
    // ======================================

    const legendaryMultiplier = Math.round(
        CONFIG.rentPerSecond.legendary / CONFIG.rentPerSecond.common
    );

    tips.push(
        t("tipRarity", {
            cost: CONFIG.landCostAB,
            mult: legendaryMultiplier,
            legendaryOdds: CONFIG.rarityOdds.legendary
        })
    );

    // ======================================
    // 4. Mayor: consiglio educativo, solo se non è già l'obiettivo primario
    // ======================================

    if (goalType !== "mayor") {

        tips.push(t("tipMayorStrategy"));

    }

    return tips;

}
