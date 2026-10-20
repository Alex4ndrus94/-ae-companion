// ======================================
// AE Companion - Valuta (modulo centrale)
//
// Unita' interna canonica: USD (player.goal.incomeTargetUSD e tutti i calcoli di
// rendita sono in USD e NON cambiano mai con lingua o valuta).
// La valuta scelta e' una preferenza di VISUALIZZAZIONE, indipendente dalla lingua.
// Il cambio USD -> EUR e' un valore fisso e INDICATIVO (vedi CONFIG.exchangeRateInfo):
// non e' un tasso corrente ne' ufficiale e non viene aggiornato da nessun servizio remoto.
// ======================================

const CURRENCY_KEY = "aeCurrency";
const SUPPORTED_CURRENCIES = ["EUR", "USD"];

function isValidCurrency(code) {

    return SUPPORTED_CURRENCIES.indexOf(code) !== -1;

}

function detectCurrency() {

    // La migrazione (prefs.js) ha gia' salvato il valore corretto; questo e' solo un fallback.
    try {
        const saved = localStorage.getItem(CURRENCY_KEY);
        if (isValidCurrency(saved)) return saved;
    } catch (e) { /* storage non disponibile */ }

    return (typeof prefsMigrationResult !== "undefined" && prefsMigrationResult && prefsMigrationResult.currency) || "USD";

}

let currentCurrency = detectCurrency();

function getCurrency() {

    return currentCurrency;

}

// Imposta la valuta di visualizzazione. Non tocca lingua, cluster o dati di gioco.
function setCurrency(code) {

    if (!isValidCurrency(code)) return false;

    currentCurrency = code;

    try { localStorage.setItem(CURRENCY_KEY, code); } catch (e) { /* ignora */ }

    if (typeof renderDashboard === "function") renderDashboard();

    return true;

}

// USD interni -> valuta mostrata
function convertToDisplay(usdValue) {

    const rate = (CONFIG.exchangeRateInfo && CONFIG.exchangeRateInfo.usdToEur) || CONFIG.exchangeRate;

    return currentCurrency === "EUR" ? usdValue * rate : usdValue;

}

// valuta mostrata (es. valore digitato dall'utente) -> USD interni
// "currency" e' facoltativo: serve quando l'utente ha cambiato valuta mentre il pannello era aperto
function convertFromDisplay(value, currency) {

    const cur = currency || currentCurrency;
    const rate = (CONFIG.exchangeRateInfo && CONFIG.exchangeRateInfo.usdToEur) || CONFIG.exchangeRate;

    return cur === "EUR" ? value / rate : value;

}

// Locale per i separatori: segue la LINGUA, non la valuta
function getDisplayLocale() {

    return getCurrentLanguage() === "it" ? "it-IT" : "en-US";

}

// ---- Formattazione monetaria (v0.9.5) ----
// Un'unica funzione per tutta l'app: separatori, simbolo/codice e posizione della valuta li decide SOLO
// Intl.NumberFormat in base alla lingua (getDisplayLocale) e alla valuta scelta (currentCurrency).
// Nessun simbolo o codice viene concatenato a mano.
//  - useGrouping "always": it-IT, per CLDR, non raggruppa i numeri a 4 cifre ("1234,56 €" ma "12.345,67 €"):
//    con "always" il separatore delle migliaia compare da 1.000 in su, in modo coerente in tutte le schermate
//    (SRB, dashboard, strategia, assistente, consigli, card di condivisione).
//  - Simbolo/codice e posizione restano quelli di Intl: IT -> "1.234,56 €" / "1.234,56 USD"; EN -> "€1,234.56" / "$1,234.56".
// I motori meno recenti possono non supportare useGrouping "always": si ripiega senza errori
// (vedi buildMoneyFormatter e repairFourDigitGrouping).

let moneyGroupingAlways = null;   // null = non ancora rilevato

function supportsGroupingAlways() {

    if (moneyGroupingAlways === null) {
        try {
            moneyGroupingAlways = new Intl.NumberFormat("en-US", { useGrouping: "always" }).resolvedOptions().useGrouping === "always";
        } catch (e) {
            moneyGroupingAlways = false;
        }
    }

    return moneyGroupingAlways;

}

function buildMoneyFormatter(locale, currency, digits) {

    const base = {
        style: "currency",
        currency: currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    };

    const attempts = [];

    if (supportsGroupingAlways()) attempts.push(Object.assign({ useGrouping: "always" }, base));
    attempts.push(base);

    for (let i = 0; i < attempts.length; i++) {
        try {
            return new Intl.NumberFormat(locale, attempts[i]);
        } catch (e) { /* opzione non supportata: prova la successiva */ }
    }

    return new Intl.NumberFormat(locale, base);

}

// Solo per i motori senza useGrouping "always": se la parte intera ha esattamente 4 cifre e Intl non ha messo
// il separatore, lo inserisce usando quello che la STESSA locale usa per 5+ cifre (preso da Intl, non scritto a mano).
function repairFourDigitGrouping(nf, locale, value) {

    const parts = nf.formatToParts(value);
    const intParts = parts.filter(function (p) { return p.type === "integer"; });
    const hasGroup = parts.some(function (p) { return p.type === "group"; });

    if (hasGroup || intParts.length !== 1 || !/^\d{4}$/.test(intParts[0].value)) {
        return parts.map(function (p) { return p.value; }).join("");
    }

    const probe = new Intl.NumberFormat(locale, { useGrouping: true }).formatToParts(10000000);
    const groupPart = probe.filter(function (p) { return p.type === "group"; })[0];

    if (!groupPart) return parts.map(function (p) { return p.value; }).join("");

    return parts.map(function (p) {
        return p === intParts[0] ? p.value.charAt(0) + groupPart.value + p.value.slice(1) : p.value;
    }).join("");

}

function formatMoneyDigits(value, digits) {

    const locale = getDisplayLocale();
    const nf = buildMoneyFormatter(locale, currentCurrency, digits);

    if (!supportsGroupingAlways() && typeof nf.formatToParts === "function") {
        return repairFourDigitGrouping(nf, locale, value);
    }

    return nf.format(value);

}

// valore GIA' nella valuta mostrata
function formatCurrency(value) {

    return formatMoneyDigits(value, 2);

}

// Piu' decimali: la rendita al secondo e' minuscola
function formatCurrencyPrecise(value) {

    return formatMoneyDigits(value, 8);

}

// True quando la valuta mostrata richiede una conversione dal cambio fisso indicativo
function isCurrencyEstimated() {

    return currentCurrency !== "USD";

}

function getExchangeRateInfo() {

    const info = CONFIG.exchangeRateInfo || {};

    return {
        from: "USD",
        to: "EUR",
        rate: info.usdToEur || CONFIG.exchangeRate,
        isEstimate: true,
        isLive: false,
        source: info.source || "static"
    };

}

// Tasso fisso indicativo scritto con il separatore decimale della lingua corrente
function getCurrencyRateLabel() {

    const info = getExchangeRateInfo();

    return String(info.rate).replace(".", getCurrentLanguage() === "it" ? "," : ".");

}

// Nota trasparente mostrata quando la valuta e' convertita (nessun tasso "corrente")
function getCurrencyNoteText() {

    if (!isCurrencyEstimated()) return "";

    return t("currencyEstimateNote", { rate: getCurrencyRateLabel() });

}
