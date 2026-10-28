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

    // Stima SRB: una sola fonte (getSRBDisplay -> getSRBView -> getSRBBreakdown / getSRBDailyBoundsUSD)
    const srbDisplay = getSRBDisplay();

    setText(
        "srb-estimate",
        srbDisplay.estimate + " / " + t("day")
    );

    // Intervallo teorico: solo oltre 150.000 terreni e solo se gli estremi sono diversi
    const srbRange = document.getElementById("srb-range");
    const srbRangeNote = document.getElementById("srb-range-note");
    if (srbRange) {
        srbRange.textContent = srbDisplay.hasRange ? t("srbRangeLine", { low: srbDisplay.low, high: srbDisplay.high }) : "";
        srbRange.hidden = !srbDisplay.hasRange;
    }
    if (srbRangeNote) {
        srbRangeNote.textContent = srbDisplay.hasRange ? t("srbRangeNote") : "";
        srbRangeNote.hidden = !srbDisplay.hasRange;
    }

    setText("currency-estimate-note", getCurrencyNoteText());

    const srbAssumptions = document.getElementById("srb-assumptions");
    if (srbAssumptions) srbAssumptions.textContent = t("srbAssumptions");

    // Oltre 150.000 terreni: mostra come e' stata ripartita la stima (x50 / boost ordinario)
    const srbLimitNote = document.getElementById("srb-limit-note");
    if (srbLimitNote) {
        const d = srbDisplay.view.details;
        const nf = new Intl.NumberFormat(getDisplayLocale());
        srbLimitNote.textContent = d.overLimit
            ? t("srbLimitNote", { total: nf.format(d.totalLands), srb: nf.format(d.srbLands), boost: d.ordinaryBoost, rest: nf.format(d.ordinaryLands) })
            : "";
    }

    // ======================================
    // Strategia: il Goal Engine calcola, la UI disegna
    // ======================================

    renderExplorerCard();

    if (typeof refreshAssistantMessages === "function") refreshAssistantMessages();

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

populateCurrencySelect(true);

// v0.10.0: carica la cache dei cambi e, se serve (valuta diversa da USD e dato scaduto), li aggiorna in rete
fxInit();

renderDashboard();
