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

        tips.push("Inserisci i tuoi terreni dal pannello ✏️ per ricevere consigli personalizzati.");

        return tips;

    }

    // Countdown al prossimo obiettivo
    if (next) {

        tips.push(
            `Ti mancano ${remaining} terreni per il prossimo obiettivo (${next.min} terreni). ` +
            `Al tuo ritmo attuale (${player.settings.dailyLoginAB} AB/giorno) ci arrivi in circa ${days} giorno${days === 1 ? "" : "i"}.`
        );

        if (current && next.boost < current.boost) {

            tips.push(
                `Attenzione: superata questa soglia il tuo boost scenderà da x${current.boost} a x${next.boost}. ` +
                `Se puoi, conviene accelerare gli acquisti ora mentre il boost è più alto.`
            );

        }

    } else {

        tips.push("Hai raggiunto l'ultimo breakpoint disponibile: il tuo boost è ormai fisso.");

    }

    // Convenienza rarità (costo terreno fisso, resa diversa)
    const commonYield = CONFIG.rentPerSecond.common;
    const legendaryYield = CONFIG.rentPerSecond.legendary;
    const multiplier = Math.round(legendaryYield / commonYield);

    tips.push(
        `A parità di costo (${CONFIG.landCostAB} AB a terreno), un Legendary rende circa ${multiplier}x un Common. ` +
        `Se puoi scegliere la rarità, punta sempre al livello più alto disponibile.`
    );

    // Costo badge
    tips.push(
        `Ogni badge costa ${CONFIG.badgeCostAB} AB, il doppio di un terreno: valuta se ti conviene ora in base ai tuoi obiettivi.`
    );

    return tips;

}
