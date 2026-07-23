// ======================================
// AE Companion - Pannello Impostazioni
// ======================================

function openSettings() {

    document.getElementById("common-input").value = player.lands.common;
    document.getElementById("rare-input").value = player.lands.rare;
    document.getElementById("epic-input").value = player.lands.epic;
    document.getElementById("legendary-input").value = player.lands.legendary;
    document.getElementById("badges-input").value = player.badges;
    document.getElementById("mayorTarget-input").value = player.mayorTarget;
    document.getElementById("dailyAB-input").value = player.settings.dailyLoginAB;

    document.getElementById("settings-overlay").classList.add("open");

}

function closeSettings() {

    document.getElementById("settings-overlay").classList.remove("open");

}

function saveSettings() {

    player.lands.common = Number(document.getElementById("common-input").value) || 0;
    player.lands.rare = Number(document.getElementById("rare-input").value) || 0;
    player.lands.epic = Number(document.getElementById("epic-input").value) || 0;
    player.lands.legendary = Number(document.getElementById("legendary-input").value) || 0;
    player.badges = Number(document.getElementById("badges-input").value) || 0;
    player.mayorTarget = Number(document.getElementById("mayorTarget-input").value) || 0;
    player.settings.dailyLoginAB = Number(document.getElementById("dailyAB-input").value) || 0;

    savePlayerData();
    renderDashboard();
    closeSettings();

}
