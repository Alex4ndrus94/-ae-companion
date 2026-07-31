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

    const explorerBadge = document.getElementById("badge-explorer");
    const missionBadge = document.getElementById("badge-mission");

    if (explorerBadge) {

        explorerBadge.style.display = player.passes.explorer ? "block" : "none";
        explorerBadge.alt = t("passBadgeExplorerAlt");

    }

    if (missionBadge) {

        missionBadge.style.display = player.passes.mission ? "block" : "none";
        missionBadge.alt = t("passBadgeMissionAlt");

    }

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

    const current = getCurrentBreakpoint(totalLands) || { min: 0, max: totalLands || 1, boost: 1 };

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

    const warningLine = document.getElementById("breakpoint-warning-line");
    const recovery = getBracketTransitionRecovery(totalLands);

    if (recovery && recovery.hasDeadZone) {

        setText(
            "breakpoint-warning",
            t("breakpointWarningInline", {
                cap: recovery.current.max,
                current: recovery.current.boost,
                next: recovery.next.boost,
                recoveryLands: recovery.recoveryLands
            })
        );

        warningLine.classList.add("visible");

    } else {

        warningLine.classList.remove("visible");

    }

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

    const badgeBonusPercent = getBadgeBoostPercent(player.badges);

    setText(
        "badge-bonus-info",
        t("badgeBonusInfo", { percent: badgeBonusPercent, badges: player.badges })
    );

    setText(
        "srb-estimate",
        formatCurrency(getSRBDailyIncomeEstimateConverted()) + " / " + (getCurrentLanguage() === "it" ? "giorno" : "day")
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
            li.innerHTML =
                '<img src="assets/icons/' + tip.icon + '.svg" class="icon-inline tip-icon" alt="">' +
                '<span>' + tip.text + '</span>';
            adviceList.appendChild(li);

        });

    }

    const abTipsList = document.getElementById("ab-tips-list");

    if (abTipsList) {

        abTipsList.innerHTML = "";

        getABSourceTips().forEach(function (tip) {

            const li = document.createElement("li");
            li.innerHTML =
                '<img src="assets/icons/' + tip.icon + '.svg" class="icon-inline tip-icon" alt="">' +
                '<span>' + tip.text + '</span>';
            abTipsList.appendChild(li);

        });

    }

}

applyTranslations();

renderDashboard();
