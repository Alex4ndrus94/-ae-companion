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

    // Icone dei Pass: mostrate solo se il Pass è realmente attivo nei dati
    // del player (player.passes). Nessun Pass attivo = nessuna icona e
    // nessun contenitore vuoto.
    const explorerBadge = document.getElementById("badge-explorer");
    const missionBadge = document.getElementById("badge-mission");
    const passRow = document.getElementById("pass-badges-row");

    const explorerActive = player.passes.explorer === true;
    const missionActive = player.passes.mission === true;

    if (explorerBadge) {

        explorerBadge.style.display = explorerActive ? "block" : "none";
        explorerBadge.alt = explorerActive ? t("passBadgeExplorerAlt") : "";

    }

    if (missionBadge) {

        missionBadge.style.display = missionActive ? "block" : "none";
        missionBadge.alt = missionActive ? t("passBadgeMissionAlt") : "";

    }

    if (passRow) {

        passRow.style.display = (explorerActive || missionActive) ? "flex" : "none";

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
    // Strategia: il Goal Engine calcola, la UI disegna
    // ======================================

    renderStrategy(getStrategyModel());

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
