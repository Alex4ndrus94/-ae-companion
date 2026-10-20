// ======================================
// AE Companion - Migrazione preferenze (lingua / valuta)
// Caricato PRIMA di i18n.js e money.js.
//
// Regole (v0.9):
//  - nuovi utenti (nessun dato salvato e nessuna lingua salvata): lingua "en", valuta "USD"
//  - utenti esistenti: la lingua salvata valida non viene toccata; se manca, si
//    conserva quella che vedevano con la logica di v0.8.1 (lingua del browser it -> it, altrimenti en)
//  - valuta: se esiste una preferenza valida (aeCurrency) resta com'e'; altrimenti si ricava
//    dalla logica di v0.8.1 (lingua effettiva "it" -> EUR, altrimenti USD) e da quel momento
//    viene salvata SEPARATAMENTE dalla lingua
//  - la migrazione e' idempotente: ogni passo scrive solo valori mancanti o non validi
// ======================================

const PREFS_MIGRATION_KEY = "aePrefsMigration";
const PREFS_MIGRATION_VERSION = "1";
const PREFS_LANG_KEY = "aeLang";
const PREFS_CURRENCY_KEY = "aeCurrency";
const PREFS_DATA_KEY = "aeCompanionData";
const PREFS_LANGS = ["it", "en"];
const PREFS_CURRENCIES = ["EUR", "USD"];

// Funzione pura: riceve lo stato letto da localStorage e restituisce cosa scrivere.
// state = { lang, currency, data, migration, navLang }  (stringhe o null)
function computeInitialPrefs(state) {

    const out = { lang: null, currency: null, writes: {}, kind: "" };

    const hasData = state.data !== null && state.data !== undefined && state.data !== "";
    const savedLang = PREFS_LANGS.indexOf(state.lang) !== -1 ? state.lang : null;
    const savedCurrency = PREFS_CURRENCIES.indexOf(state.currency) !== -1 ? state.currency : null;
    const nav = String(state.navLang || "en").toLowerCase();
    const legacyLang = nav.indexOf("it") === 0 ? "it" : "en";   // logica di v0.8.1

    const isExisting = hasData || savedLang !== null || savedCurrency !== null;

    // Lingua
    if (savedLang) {
        out.lang = savedLang;
    } else if (isExisting) {
        out.lang = legacyLang;          // conserva cio' che vedeva prima
        out.writes[PREFS_LANG_KEY] = out.lang;
    } else {
        out.lang = "en";                // nuovo utente: inglese (non serve salvarla)
    }

    // Valuta
    if (savedCurrency) {
        out.currency = savedCurrency;
    } else if (isExisting) {
        const effectiveOldLang = savedLang || legacyLang;
        out.currency = effectiveOldLang === "it" ? "EUR" : "USD";   // logica di v0.8.1
        out.writes[PREFS_CURRENCY_KEY] = out.currency;
    } else {
        out.currency = "USD";           // nuovo utente: coerente con l'inglese predefinito
        out.writes[PREFS_CURRENCY_KEY] = out.currency;
    }

    out.kind = isExisting ? "existing" : "new";
    out.writes[PREFS_MIGRATION_KEY] = PREFS_MIGRATION_VERSION;

    return out;

}

function runPrefsMigration() {

    let result = null;

    try {

        const state = {
            lang: localStorage.getItem(PREFS_LANG_KEY),
            currency: localStorage.getItem(PREFS_CURRENCY_KEY),
            data: localStorage.getItem(PREFS_DATA_KEY),
            migration: localStorage.getItem(PREFS_MIGRATION_KEY),
            navLang: (typeof navigator !== "undefined" && navigator.language) || "en"
        };

        // Gia' eseguita: nessuna scrittura (idempotenza)
        if (state.migration === PREFS_MIGRATION_VERSION &&
            PREFS_CURRENCIES.indexOf(state.currency) !== -1) {
            return null;
        }

        result = computeInitialPrefs(state);

        Object.keys(result.writes).forEach(function (k) {
            localStorage.setItem(k, result.writes[k]);
        });

    } catch (e) {

        // localStorage non disponibile: si usano i valori in memoria (nessun crash)
        console.error("AE Companion: migrazione preferenze non salvata", e);

    }

    return result;

}

const prefsMigrationResult = runPrefsMigration();
