// ======================================
// AE Companion - Pannello Impostazioni / Onboarding
// ======================================

function onGoalTypeChange() {

    const type = document.getElementById("goal-input").value;

    document.getElementById("goal-income-fields").classList.toggle("visible", type === "income");
    document.getElementById("goal-lands-fields").classList.toggle("visible", type === "lands");

}

function openSettings(isOnboarding) {

    document.getElementById("name-input").value = player.profile.name;
    document.getElementById("common-input").value = player.lands.common;
    document.getElementById("rare-input").value = player.lands.rare;
    document.getElementById("epic-input").value = player.lands.epic;
    document.getElementById("legendary-input").value = player.lands.legendary;
    document.getElementById("badges-input").value = player.badges;
    document.getElementById("mayorTarget-input").value = player.mayorTarget;
    document.getElementById("dailyAB-input").value = player.settings.dailyLoginAB;

    // Obiettivo
    document.getElementById("goal-input").value = player.goal.type;

    const lang = getCurrentLanguage();
    const displayedTarget = lang === "it"
        ? (player.goal.incomeTargetUSD * CONFIG.exchangeRate)
        : player.goal.incomeTargetUSD;

    document.getElementById("goal-income-target-input").value = displayedTarget.toFixed(2);
    document.getElementById("goal-income-boosted-input").checked = player.goal.incomeTargetBoosted;
    document.getElementById("goal-lands-target-input").value = player.goal.landsTarget;

    onGoalTypeChange();

    populateCountrySelect();

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

function closeSettings() {

    document.getElementById("settings-overlay").classList.remove("open");

}

function saveSettings() {

    const name = document.getElementById("name-input").value.trim();

    player.profile.name = name || "Player";
    player.lands.common = Number(document.getElementById("common-input").value) || 0;
    player.lands.rare = Number(document.getElementById("rare-input").value) || 0;
    player.lands.epic = Number(document.getElementById("epic-input").value) || 0;
    player.lands.legendary = Number(document.getElementById("legendary-input").value) || 0;
    player.badges = Number(document.getElementById("badges-input").value) || 0;
    player.mayorTarget = Number(document.getElementById("mayorTarget-input").value) || 0;
    player.settings.dailyLoginAB = Number(document.getElementById("dailyAB-input").value) || 0;

    // Obiettivo
    player.goal.type = document.getElementById("goal-input").value;

    const enteredTarget = Number(document.getElementById("goal-income-target-input").value) || 0;
    const lang = getCurrentLanguage();

    player.goal.incomeTargetUSD = lang === "it"
        ? enteredTarget / CONFIG.exchangeRate
        : enteredTarget;

    player.goal.incomeTargetBoosted = document.getElementById("goal-income-boosted-input").checked;
    player.goal.landsTarget = Number(document.getElementById("goal-lands-target-input").value) || 0;

    savePlayerData();
    renderDashboard();
    closeSettings();

}

// Se non ci sono dati salvati sul dispositivo, parte l'onboarding
window.addEventListener("DOMContentLoaded", function () {

    if (isFirstRun) {
        openSettings(true);
    }

});
