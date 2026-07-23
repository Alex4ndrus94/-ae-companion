// ======================================
// AE Companion - Dashboard
// ======================================

function renderDashboard() {

    // ======================================
    // Totale terreni
    // ======================================

    const totalLands = getTotalLands();

    // ======================================
    // Player
    // ======================================

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

    const remaining =
        getRemainingLandsToNextBreakpoint(totalLands);

    // ======================================
    // Barra progresso
    // ======================================

    const percentage =
        ((totalLands - current.min) /
        (current.max - current.min)) * 100;

    setWidth(
        "progress-fill",
        percentage + "%"
    );

    setText(
        "progress-text",
        next
            ? `${totalLands} / ${next.min} terreni • Ne manca ${remaining}`
            : `${totalLands} terreni • Ultimo breakpoint`
    );

    // ======================================
    // Rendita
    // ======================================

    setText(
        "dailyIncome",
        formatCurrency(getDailyIncomeEUR())
    );

    setText(
        "monthlyIncome",
        formatCurrency(getMonthlyIncomeEUR())
    );

    setText(
        "yearlyIncome",
        formatCurrency(getYearlyIncomeEUR())
    );

    // ======================================
    // Boost
    // ======================================

    const boostMultiplier = getBoostMultiplier();

    const boostPercent = getBoostPercent();

    setText(
        "boost-info",
        `⚡ Boost attivo x${boostMultiplier} (+${boostPercent}%)`
    );

    // ======================================
    // Strategia
    // ======================================

    setText(
        "landsRemaining",
        remaining
    );

    setText(
        "abNeeded",
        (remaining * CONFIG.landCostAB) + " AB"
    );

    setText(
        "dailyAB",
        player.settings.dailyLoginAB + " AB"
    );

    const daysRemaining =
        Math.ceil(
            (remaining * CONFIG.landCostAB) /
            player.settings.dailyLoginAB
        );

    setText(
        "daysRemaining",
        daysRemaining +
        " giorno" +
        (daysRemaining > 1 ? "i" : "")
    );

}

renderDashboard();
