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

    setText("parcels", formatK(totalLands));

    setText("common-count", formatK(player.lands.common));

    setText("rare-count", formatK(player.lands.rare));

    setText("epic-count", formatK(player.lands.epic));

    setText("legendary-count", formatK(player.lands.legendary));

    setText("badges", formatK(player.badges));

    setText("boost", "x" + getBoostMultiplier());

    setText("mayor", formatK(player.mayorTarget));

    setText("ab-balance-display", formatK(player.settings.abBalance) + " AB");

    // ======================================
    // AE Core
    // ======================================

    const current = getCurrentBreakpoint(totalLands) || { min: 0, max: totalLands || 1, boost: 1 };

    const next = getNextBreakpoint(totalLands);

    const remaining =
        getRemainingLandsToNextBreakpoint(totalLands);

    // ======================================
    // Target "intelligente" per Strategia e barra di progresso
    // Deve essere coerente con quello che dicono i Consigli:
    // - se sei in zona morta ed è urgente, punta al recupero (non al breakpoint immediato)
    // - se l'obiettivo scelto è "terreni", punta a quello
    // - altrimenti, punta al prossimo breakpoint boost normale
    // ======================================

    const recovery = getBracketTransitionRecovery(totalLands);

    let nearBoostThreshold = false;

    if (next) {

        const bracketSize = next.min - current.min;
        const urgentThreshold = Math.max(5, Math.round(bracketSize * 0.2));

        nearBoostThreshold = remaining <= urgentThreshold;

    }

    const deadZoneUrgent = !!(recovery && recovery.hasDeadZone && nearBoostThreshold);

    let strategyTargetLands = null;

    if (player.goal.type === "lands" && player.goal.landsTarget > totalLands) {

        strategyTargetLands = player.goal.landsTarget;

    } else if (deadZoneUrgent) {

        strategyTargetLands = recovery.recoveryLands;

    } else if (next) {

        strategyTargetLands = next.min;

    }

    const remainingToTarget = strategyTargetLands
        ? Math.max(0, strategyTargetLands - totalLands)
        : 0;

    // ======================================
    // Barra progresso (riempimento della fascia boost attuale)
    // ======================================

    const percentage =
        ((totalLands - current.min) /
        (current.max - current.min)) * 100;

    setWidth(
        "progress-fill",
        percentage + "%"
    );

    document.getElementById("progress-fill")
        .classList.toggle("warning", nearBoostThreshold);

    setText(
        "progress-text",
        strategyTargetLands
            ? t("progressText", { total: totalLands, next: strategyTargetLands, remaining: remainingToTarget })
            : t("progressTextLast", { total: totalLands })
    );

    const warningLine = document.getElementById("breakpoint-warning-line");

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
        "per-second-income",
        t("perSecondIncome", { value: formatCurrencyPrecise(getIncomePerSecondConverted()) })
    );

    setText(
        "srb-estimate",
        formatCurrency(getSRBDailyIncomeEstimateConverted()) + " / " + (getCurrentLanguage() === "it" ? "giorno" : "day")
    );

    // ======================================
    // Strategia (si adatta: terreni o badge, in base
    // a cosa conviene davvero in questo momento)
    // ======================================

    const plan = getStrategyPlan(totalLands);

    setText(
        "strategy-metric-label",
        plan.metric === "badge" ? t("badgeLabel") : t("landsLabel")
    );

    setText(
        "landsRemaining",
        formatK(plan.remaining)
    );

    setText(
        "abNeeded",
        formatK(plan.remaining * plan.unitCostAB) + " AB"
    );

    setText(
        "dailyAB",
        formatK(player.settings.dailyLoginAB) + " AB"
    );

    setText(
        "daysRemaining",
        getAcquisitionTimeText(plan.remaining * plan.unitCostAB)
    );

    // ======================================
    // Come guadagnare più AB
    // ======================================

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
