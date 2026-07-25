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
            ? t("progressText", { total: totalLands, next: next.min, remaining: remaining })
            : t("progressTextLast", { total: totalLands })
    );

    // ======================================
    // Rendita (con boost + senza boost)
    // ======================================

    setText(
        "dailyIncome",
        formatCurrency(getDailyIncomeConverted())
    );

    setText(
        "dailyIncomeBase",
        t("withoutBoost") + ": " + formatCurrency(getBaseDailyIncomeConverted())
    );

    setText(
        "monthlyIncome",
        formatCurrency(getMonthlyIncomeConverted())
    );

    setText(
        "monthlyIncomeBase",
        t("withoutBoost") + ": " + formatCurrency(getBaseMonthlyIncomeConverted())
    );

    setText(
        "yearlyIncome",
        formatCurrency(getYearlyIncomeConverted())
    );

    setText(
        "yearlyIncomeBase",
        t("withoutBoost") + ": " + formatCurrency(getBaseYearlyIncomeConverted())
    );

    // ======================================
    // Boost (etichetta sintetica)
    // ======================================

    const boostMultiplier = getBoostMultiplier();

    const boostPercent = getBoostPercent();

    setText(
        "boost-info",
        t("boostActive", { mult: boostMultiplier, percent: boostPercent })
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
        formatDays(daysRemaining)
    );

    // ======================================
    // Consigli
    // ======================================

    const adviceList = document.getElementById("advice-list");

    if (adviceList) {

        adviceList.innerHTML = "";

        generateAdvice().forEach(function (tip) {

            const li = document.createElement("li");
            li.textContent = tip;
            adviceList.appendChild(li);

        });

    }

}

applyTranslations();

renderDashboard();
