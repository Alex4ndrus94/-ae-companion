// ======================================
// AE Companion - Storage (localStorage)
// ======================================

const STORAGE_KEY = "aeCompanionData";

// Carica eventuali dati salvati e li applica sopra i default di player.js
function loadPlayerData() {

    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return;

    try {

        const saved = JSON.parse(raw);

        if (saved.lands) Object.assign(player.lands, saved.lands);

        if (typeof saved.badges === "number") player.badges = saved.badges;

        if (typeof saved.mayorTarget === "number") player.mayorTarget = saved.mayorTarget;

        if (saved.settings) Object.assign(player.settings, saved.settings);

    } catch (e) {

        console.error("AE Companion: impossibile leggere i dati salvati", e);

    }

}

// Salva lo stato attuale di player.* in localStorage
function savePlayerData() {

    const data = {
        lands: player.lands,
        badges: player.badges,
        mayorTarget: player.mayorTarget,
        settings: player.settings
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

}

loadPlayerData();
