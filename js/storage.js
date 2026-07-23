// ======================================
// AE Companion - Storage (localStorage)
// ======================================

const STORAGE_KEY = "aeCompanionData";

// true finché non troviamo dati salvati sul dispositivo
let isFirstRun = true;

// Carica eventuali dati salvati e li applica sopra i default di player.js
function loadPlayerData() {

    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return;

    try {

        const saved = JSON.parse(raw);

        if (saved.profile && saved.profile.name) player.profile.name = saved.profile.name;

        if (saved.lands) Object.assign(player.lands, saved.lands);

        if (typeof saved.badges === "number") player.badges = saved.badges;

        if (typeof saved.mayorTarget === "number") player.mayorTarget = saved.mayorTarget;

        if (saved.settings) Object.assign(player.settings, saved.settings);

        isFirstRun = false;

    } catch (e) {

        console.error("AE Companion: impossibile leggere i dati salvati", e);

    }

}

// Salva lo stato attuale di player.* in localStorage
function savePlayerData() {

    const data = {
        profile: player.profile,
        lands: player.lands,
        badges: player.badges,
        mayorTarget: player.mayorTarget,
        settings: player.settings
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    isFirstRun = false;

}

loadPlayerData();
