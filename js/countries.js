// ======================================
// AE Companion - Gruppi Boost per Paese
// Origine dei dati: soglie e appartenenze NON sono state riverificate in v0.9 (le tabelle
// ufficiali dell'Help Center sono pubblicate come immagini). Stato per regola: docs/07-AUDIT-FONTI.md.
// Non trattare queste tabelle come "ufficiali" finche' non sono verificate.
// ======================================

const COUNTRY_KEY = "aeCountryGroup";

const countryGroups = {

    US: {
        label: "🇺🇸 Stati Uniti",
        labelEn: "🇺🇸 United States",
        breakpoints: [
            { min: 1,    max: 150,  boost: 30 },
            { min: 151,  max: 220,  boost: 20 },
            { min: 221,  max: 290,  boost: 15 },
            { min: 291,  max: 365,  boost: 12 },
            { min: 366,  max: 435,  boost: 10 },
            { min: 436,  max: 545,  boost: 8 },
            { min: 546,  max: 625,  boost: 7 },
            { min: 626,  max: 730,  boost: 6 },
            { min: 731,  max: 875,  boost: 5 },
            { min: 876,  max: 1100, boost: 4 },
            { min: 1101, max: 1500, boost: 3 },
            { min: 1501, max: Infinity, boost: 2 }
        ]
    },

    UK_CA_AU_ZA_IE_NZ: {
        label: "🇬🇧 UK / 🇨🇦 Canada / 🇦🇺 Australia / 🇿🇦 Sudafrica / 🇮🇪 Irlanda / 🇳🇿 Nuova Zelanda",
        labelEn: "🇬🇧 UK / 🇨🇦 Canada / 🇦🇺 Australia / 🇿🇦 South Africa / 🇮🇪 Ireland / 🇳🇿 New Zealand",
        breakpoints: [
            { min: 1,   max: 60,  boost: 20 },
            { min: 61,  max: 100, boost: 15 },
            { min: 101, max: 150, boost: 10 },
            { min: 151, max: 180, boost: 8 },
            { min: 181, max: 220, boost: 7 },
            { min: 221, max: 250, boost: 6 },
            { min: 251, max: 300, boost: 5 },
            { min: 301, max: 350, boost: 4 },
            { min: 351, max: 450, boost: 3 },
            { min: 451, max: Infinity, boost: 2 }
        ]
    },

    EU_WEST: {
        label: "🇮🇹 Italia / 🇩🇪 Germania / 🇫🇷 Francia / 🇪🇸 Spagna / 🇳🇱 Paesi Bassi / 🇵🇹 Portogallo",
        labelEn: "🇮🇹 Italy / 🇩🇪 Germany / 🇫🇷 France / 🇪🇸 Spain / 🇳🇱 Netherlands / 🇵🇹 Portugal",
        breakpoints: [
            { min: 1,   max: 70,  boost: 20 },
            { min: 71,  max: 100, boost: 15 },
            { min: 101, max: 135, boost: 10 },
            { min: 136, max: 170, boost: 8 },
            { min: 171, max: 200, boost: 7 },
            { min: 201, max: 250, boost: 6 },
            { min: 251, max: 300, boost: 5 },
            { min: 301, max: 350, boost: 4 },
            { min: 351, max: 400, boost: 3 },
            { min: 401, max: Infinity, boost: 2 }
        ]
    },

    NORDIC: {
        label: "🇸🇪 Svezia / 🇫🇮 Finlandia / 🇦🇹 Austria / 🇹🇼 Taiwan / 🇳🇴 Norvegia / 🇩🇰 Danimarca / 🇧🇪 Belgio",
        labelEn: "🇸🇪 Sweden / 🇫🇮 Finland / 🇦🇹 Austria / 🇹🇼 Taiwan / 🇳🇴 Norway / 🇩🇰 Denmark / 🇧🇪 Belgium",
        breakpoints: [
            { min: 1,   max: 30,  boost: 15 },
            { min: 31,  max: 50,  boost: 12 },
            { min: 51,  max: 70,  boost: 8 },
            { min: 71,  max: 105, boost: 5 },
            { min: 106, max: 130, boost: 4 },
            { min: 131, max: 150, boost: 3 },
            { min: 151, max: Infinity, boost: 2 }
        ]
    },

    SE_ASIA: {
        label: "🇹🇭 Thailandia / 🇸🇰 Slovacchia / 🇱🇻 Lettonia / 🇵🇭 Filippine",
        labelEn: "🇹🇭 Thailand / 🇸🇰 Slovakia / 🇱🇻 Latvia / 🇵🇭 Philippines",
        breakpoints: [
            { min: 1,   max: 30,  boost: 8 },
            { min: 31,  max: 50,  boost: 6 },
            { min: 51,  max: 70,  boost: 4 },
            { min: 71,  max: 105, boost: 3 },
            { min: 106, max: Infinity, boost: 2 }
        ]
    },

    ASIA_GULF: {
        label: "🇰🇷 Corea del Sud / 🇯🇵 Giappone / 🇸🇬 Singapore / 🇦🇪 Emirati Arabi / 🇨🇭 Svizzera",
        labelEn: "🇰🇷 South Korea / 🇯🇵 Japan / 🇸🇬 Singapore / 🇦🇪 UAE / 🇨🇭 Switzerland",
        breakpoints: [
            { min: 1,   max: 50,  boost: 20 },
            { min: 51,  max: 70,  boost: 15 },
            { min: 71,  max: 105, boost: 12 },
            { min: 106, max: 130, boost: 8 },
            { min: 131, max: 150, boost: 7 },
            { min: 151, max: 175, boost: 6 },
            { min: 176, max: 200, boost: 5 },
            { min: 201, max: 225, boost: 4 },
            { min: 226, max: 300, boost: 3 },
            { min: 301, max: Infinity, boost: 2 }
        ]
    },

    BRAZIL: {
        label: "🇧🇷 Brasile",
        labelEn: "🇧🇷 Brazil",
        breakpoints: [
            { min: 1,   max: 60,  boost: 20 },
            { min: 61,  max: 75,  boost: 15 },
            { min: 76,  max: 100, boost: 12 },
            { min: 101, max: 120, boost: 10 },
            { min: 121, max: 150, boost: 8 },
            { min: 151, max: 200, boost: 6 },
            { min: 201, max: 250, boost: 5 },
            { min: 251, max: 300, boost: 4 },
            { min: 301, max: 400, boost: 3 },
            { min: 401, max: Infinity, boost: 2 }
        ]
    },

    MEXICO: {
        label: "🇲🇽 Messico",
        labelEn: "🇲🇽 Mexico",
        breakpoints: [
            { min: 1,   max: 50,  boost: 20 },
            { min: 51,  max: 85,  boost: 15 },
            { min: 86,  max: 100, boost: 12 },
            { min: 101, max: 140, boost: 8 },
            { min: 141, max: 175, boost: 7 },
            { min: 176, max: 225, boost: 5 },
            { min: 226, max: 300, boost: 4 },
            { min: 301, max: 400, boost: 3 },
            { min: 401, max: Infinity, boost: 2 }
        ]
    }

};

// Mappa lingua/regione browser -> gruppo paese (per il rilevamento automatico)
const localeToCountryGroup = {

    "it": "EU_WEST",
    "de": "EU_WEST",
    "fr": "EU_WEST",
    "es": "EU_WEST",
    "nl": "EU_WEST",
    "pt-pt": "EU_WEST",

    "en-us": "US",

    "en-gb": "UK_CA_AU_ZA_IE_NZ",
    "en-ca": "UK_CA_AU_ZA_IE_NZ",
    "en-au": "UK_CA_AU_ZA_IE_NZ",
    "en-za": "UK_CA_AU_ZA_IE_NZ",
    "en-ie": "UK_CA_AU_ZA_IE_NZ",
    "en-nz": "UK_CA_AU_ZA_IE_NZ",

    "sv": "NORDIC",
    "fi": "NORDIC",
    "nb": "NORDIC",
    "no": "NORDIC",
    "da": "NORDIC",

    "th": "SE_ASIA",
    "sk": "SE_ASIA",
    "lv": "SE_ASIA",
    "tl": "SE_ASIA",

    "ko": "ASIA_GULF",
    "ja": "ASIA_GULF",
    "ar": "ASIA_GULF",

    "pt-br": "BRAZIL",
    "pt": "BRAZIL",

    "es-mx": "MEXICO"

};

// Gruppo di partenza "provvisorio" per i calcoli quando l'utente non ha ancora CONFERMATO un cluster.
// E' lo stesso comportamento di v0.8.1 (lingua del browser, fallback EU_WEST), cosi' i numeri
// non cambiano: ma NON viene salvato finche' l'utente non lo conferma.
let currentCountryGroup = "EU_WEST";
let countryGroupConfirmed = false;

function getSavedCountryGroup() {

    try {
        const saved = localStorage.getItem(COUNTRY_KEY);
        if (saved && countryGroups[saved]) return saved;
    } catch (e) { /* storage non disponibile */ }

    return null;

}

// Suggerimento dal browser. ATTENZIONE: la lingua del browser NON e' il Paese di residenza.
// reliability: "region" = il browser indica anche una regione (es. en-GB);
//              "language" = solo la lingua (es. it): suggerimento debole;
//              "none" = nessun suggerimento disponibile.
function suggestCountryGroup(navLang) {

    const raw = navLang !== undefined ? navLang
        : ((typeof navigator !== "undefined" && navigator.language) || "");

    const nav = String(raw || "").toLowerCase();

    if (!nav) return { group: null, reliability: "none" };

    if (localeToCountryGroup[nav] && nav.indexOf("-") !== -1) return { group: localeToCountryGroup[nav], reliability: "region" };

    const base = nav.split("-")[0];

    if (localeToCountryGroup[nav]) return { group: localeToCountryGroup[nav], reliability: "language" };

    if (localeToCountryGroup[base]) return { group: localeToCountryGroup[base], reliability: "language" };

    return { group: null, reliability: "none" };

}

// Gruppo usato dai calcoli: salvato (confermato) oppure provvisorio come in v0.8.1
function detectCountryGroup() {

    const saved = getSavedCountryGroup();

    if (saved) return saved;

    const sug = suggestCountryGroup();

    return sug.group || "EU_WEST";

}

function isCountryGroupConfirmed() {

    return countryGroupConfirmed;

}

function getCurrentCountryGroup() {

    return currentCountryGroup;

}

function getActiveBreakpoints() {

    return countryGroups[currentCountryGroup].breakpoints;

}

// Persiste il cluster: da chiamare SOLO quando l'utente lo ha scelto/confermato esplicitamente.
// Non e' mai chiamata da cambi di lingua o di valuta.
function setCountryGroup(group) {

    if (!countryGroups[group]) return;

    currentCountryGroup = group;
    countryGroupConfirmed = true;

    try { localStorage.setItem(COUNTRY_KEY, group); } catch (e) { /* ignora */ }

    if (typeof renderDashboard === "function") renderDashboard();

}

// Selezione "in bozza" nel pannello Impostazioni: non salva nulla finche' non si preme Salva
let pendingCountryGroup = null;

function stageCountryGroup(group) {

    pendingCountryGroup = countryGroups[group] ? group : null;

    updateCountrySuggestionUI();

}

function confirmSuggestedCountryGroup() {

    const sug = suggestCountryGroup();

    if (sug.group) {
        pendingCountryGroup = sug.group;
        const select = document.getElementById("country-input");
        if (select) select.value = sug.group;
    }

    updateCountrySuggestionUI();

}

function resetPendingCountryGroup() {

    pendingCountryGroup = null;

}

function applyPendingCountryGroup() {

    if (pendingCountryGroup) {
        const g = pendingCountryGroup;
        pendingCountryGroup = null;
        setCountryGroup(g);
        return true;
    }

    return false;

}

function updateCountrySuggestionUI() {

    const box = document.getElementById("country-suggestion");

    if (!box) return;

    if (countryGroupConfirmed) {
        box.style.display = "none";
        return;
    }

    const sug = suggestCountryGroup();
    const lang = getCurrentLanguage();
    const text = document.getElementById("country-suggestion-text");
    const btn = document.getElementById("country-suggestion-btn");

    box.style.display = "block";

    if (sug.group) {

        const grp = countryGroups[sug.group];
        const label = (lang === "it" ? grp.label : grp.labelEn) || grp.label;

        if (text) text.textContent = t(sug.reliability === "region" ? "countrySuggestionRegion" : "countrySuggestionLanguage", { group: label })
            + " " + (pendingCountryGroup ? t("countrySuggestionPending") : t("countrySuggestionUnconfirmed"));
        if (btn) btn.style.display = pendingCountryGroup === sug.group ? "none" : "";

    } else {

        if (text) text.textContent = t("countrySuggestionNone");
        if (btn) btn.style.display = "none";

    }

}

function populateCountrySelect() {

    const select = document.getElementById("country-input");

    if (!select) return;

    const lang = getCurrentLanguage();
    const shown = pendingCountryGroup || (countryGroupConfirmed ? currentCountryGroup : "");

    select.innerHTML = "";

    // Nessun cluster confermato e nessuna bozza: scelta esplicita richiesta
    if (!shown) {
        const ph = document.createElement("option");
        ph.value = "";
        ph.textContent = t("countryChoosePlaceholder");
        ph.selected = true;
        select.appendChild(ph);
    }

    Object.keys(countryGroups).forEach(function (key) {

        const group = countryGroups[key];
        const option = document.createElement("option");

        option.value = key;
        option.textContent = (lang === "it" ? group.label : group.labelEn) || group.label;

        if (key === shown) option.selected = true;

        select.appendChild(option);

    });

    updateCountrySuggestionUI();

}

const savedCountryGroupAtLoad = getSavedCountryGroup();

countryGroupConfirmed = savedCountryGroupAtLoad !== null;

currentCountryGroup = detectCountryGroup();
