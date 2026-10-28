// ======================================
// AE Companion - Pannello Impostazioni / Onboarding
// ======================================

function onGoalTypeChange() {

    const type = document.getElementById("goal-input").value;

    document.getElementById("goal-income-fields").classList.toggle("visible", type === "income");
    document.getElementById("goal-lands-fields").classList.toggle("visible", type === "lands");

}

// Con Explorer Club attivo compaiono le date e sparisce l'AB/day manuale
function updateExplorerSettingsVisibility() {

    const active = document.getElementById("explorer-pass-input").checked;
    const hasStart = !!document.getElementById("explorer-start-input").value;

    document.getElementById("explorer-settings-fields").style.display = active ? "block" : "none";
    document.getElementById("dailyab-field").style.display = (active && hasStart) ? "none" : "";

}

let settingsOpenCurrency = null;
// v0.10.0: tasso (unita' per 1 USD) e testo con cui l'obiettivo e' stato MOSTRATO all'apertura del pannello.
// L'inversione al salvataggio usa lo stesso tasso (anche se nel frattempo il cambio e' stato aggiornato) e,
// se l'utente non tocca il campo, il valore USD salvato resta esattamente com'e'.
let settingsOpenRate = NaN;
let settingsOpenTargetText = "";

function openSettings(isOnboarding) {

    // Ogni apertura parte senza modifiche provvisorie (Annulla non salva nulla)
    resetPendingCountryGroup();

    document.getElementById("name-input").value = player.profile.name;
    document.getElementById("common-input").value = player.lands.common;
    document.getElementById("rare-input").value = player.lands.rare;
    document.getElementById("epic-input").value = player.lands.epic;
    document.getElementById("legendary-input").value = player.lands.legendary;
    document.getElementById("badges-input").value = player.badges;
    document.getElementById("mayorTarget-input").value = player.mayorTarget;
    document.getElementById("dailyAB-input").value = player.settings.dailyLoginAB;
    document.getElementById("ab-balance-input").value = player.settings.abBalance;

    document.getElementById("explorer-pass-input").checked = player.passes.explorer;
    document.getElementById("mission-pass-input").checked = player.passes.mission;

    document.getElementById("explorer-start-input").value = player.explorer.startDate || "";
    document.getElementById("explorer-end-input").value = player.explorer.endDate || "";
    updateExplorerSettingsVisibility();

    // Obiettivo
    document.getElementById("goal-input").value = player.goal.type;

    // Valuta con cui il valore viene mostrato ora (serve al salvataggio se la valuta cambia nel pannello)
    settingsOpenCurrency = getCurrency();
    settingsOpenRate = getFxRate(settingsOpenCurrency);
    const displayedTarget = convertToDisplay(player.goal.incomeTargetUSD);
    const targetDigits = getCurrencyDigits(settingsOpenCurrency);
    const targetInput = document.getElementById("goal-income-target-input");

    targetInput.step = String(Math.pow(10, -targetDigits));
    targetInput.value = isFinite(displayedTarget) ? displayedTarget.toFixed(targetDigits) : "";
    settingsOpenTargetText = targetInput.value;
    document.getElementById("goal-income-boosted-input").checked = player.goal.incomeTargetBoosted;
    document.getElementById("goal-lands-target-input").value = player.goal.landsTarget;

    onGoalTypeChange();

    populateCountrySelect();
    populateCurrencySelect(true);

    const title = document.getElementById("settings-title");
    const cancelBtn = document.getElementById("settings-cancel");
    const intro = document.getElementById("settings-intro");

    if (isOnboarding) {
        title.textContent = t("settingsTitleOnboarding");
        intro.style.display = "block";
        cancelBtn.style.display = "none";
    } else {
        title.textContent = t("settingsTitleEdit");
        intro.style.display = "none";
        cancelBtn.style.display = "block";
    }

    document.getElementById("settings-overlay").classList.add("open");

}

// Selettore valuta (indipendente dalla lingua). Nel pannello e' una scelta in bozza:
// viene applicata solo con Salva.
function populateCurrencySelect(resetToCurrent) {

    const select = document.getElementById("currency-input");

    if (!select) return;

    const keep = (!resetToCurrent && select.value) || getCurrency();

    select.innerHTML = "";

    SUPPORTED_CURRENCIES.forEach(function (code) {

        const option = document.createElement("option");
        option.value = code;
        option.textContent = getCurrencyOptionLabel(code);
        if (code === keep) option.selected = true;
        select.appendChild(option);

    });

    const note = document.getElementById("currency-note");
    if (note) note.textContent = t("currencySettingNote");

}

function closeSettings() {

    resetPendingCountryGroup();

    document.getElementById("settings-overlay").classList.remove("open");

}

function saveSettings() {

    // Obiettivo di rendita: digitato nella valuta mostrata all'apertura del pannello. Se non e' stato modificato resta
    // il valore USD salvato (nessun ricalcolo); se e' stato modificato si inverte con lo stesso tasso usato per mostrarlo.
    const targetText = document.getElementById("goal-income-target-input").value;
    let newTargetUSD = null;

    if (targetText !== settingsOpenTargetText) {

        const openCur = settingsOpenCurrency || getCurrency();
        // v0.10.1: con valuta diversa da USD serve il tasso con cui il campo e' stato MOSTRATO all'apertura.
        // Se allora non esisteva (NaN), un tasso arrivato dopo non viene usato: l'obiettivo modificato e' rifiutato.
        const rateOk = openCur === "USD" || (typeof settingsOpenRate === "number" && isFinite(settingsOpenRate) && settingsOpenRate > 0);
        const converted = rateOk ? convertFromDisplay(Number(targetText) || 0, openCur, settingsOpenRate) : NaN;

        if (!isFinite(converted)) {
            // nessun tasso valido all'apertura: non si salva nulla (ne' l'obiettivo ne' gli altri campi, che restano nel pannello)
            const note = document.getElementById("currency-note");
            if (note) note.textContent = t("fxTargetNeedsRate", { currency: openCur });
            return;
        }

        newTargetUSD = converted;

    }

    const name = document.getElementById("name-input").value.trim();

    player.profile.name = name || "Player";
    player.lands.common = Number(document.getElementById("common-input").value) || 0;
    player.lands.rare = Number(document.getElementById("rare-input").value) || 0;
    player.lands.epic = Number(document.getElementById("epic-input").value) || 0;
    player.lands.legendary = Number(document.getElementById("legendary-input").value) || 0;
    player.badges = Number(document.getElementById("badges-input").value) || 0;
    player.mayorTarget = Number(document.getElementById("mayorTarget-input").value) || 0;
    player.settings.dailyLoginAB = Number(document.getElementById("dailyAB-input").value) || 0;
    player.settings.abBalance = Number(document.getElementById("ab-balance-input").value) || 0;

    player.passes.explorer = document.getElementById("explorer-pass-input").checked;
    player.passes.mission = document.getElementById("mission-pass-input").checked;

    // Explorer Club: nuova data di Day 1 = nuovo ciclo (lo storico viene archiviato)
    if (player.passes.explorer) {

        const exStart = document.getElementById("explorer-start-input").value;
        const exEnd = document.getElementById("explorer-end-input").value;

        if (explorerValidKey(exStart)) {
            restartExplorerStreak(exStart, exEnd || null, { skipSync: true });
        }

    }

    // Obiettivo
    player.goal.type = document.getElementById("goal-input").value;

    if (newTargetUSD !== null) player.goal.incomeTargetUSD = newTargetUSD;

    player.goal.incomeTargetBoosted = document.getElementById("goal-income-boosted-input").checked;
    player.goal.landsTarget = Number(document.getElementById("goal-lands-target-input").value) || 0;

    savePlayerData();

    // Valuta e cluster: salvati solo ora, e solo se l'utente li ha scelti/confermati
    const currencySelect = document.getElementById("currency-input");
    if (currencySelect && isValidCurrency(currencySelect.value) && currencySelect.value !== getCurrency()) {
        setCurrency(currencySelect.value);
    }

    applyPendingCountryGroup();

    renderDashboard();
    closeSettings();

}

// Se non ci sono dati salvati sul dispositivo, parte l'onboarding
window.addEventListener("DOMContentLoaded", function () {

    if (isFirstRun) {
        openSettings(true);
    }

});
