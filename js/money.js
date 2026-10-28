// ======================================
// AE Companion - Valuta (modulo centrale)
//
// Unita' interna canonica: USD (player.goal.incomeTargetUSD e tutti i calcoli di
// rendita sono in USD e NON cambiano mai con lingua o valuta).
// La valuta scelta e' una preferenza di VISUALIZZAZIONE, indipendente dalla lingua.
// v0.10.0: il cambio USD -> valuta mostrata arriva da js/fx.js (API Frankfurter + cache locale).
// Ogni importo viene convertito UNA volta, qui, al confine tra calcolo e visualizzazione
// (convertToDisplay). Senza un tasso valido la conversione restituisce NaN e l'importo
// viene mostrato come "\u2014": non si usa mai un tasso inventato ne' si mostra un importo non convertito.
// ======================================

const CURRENCY_KEY = "aeCurrency";
const SUPPORTED_CURRENCIES = CONFIG.fx.currencies;

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

    // La nuova valuta puo' richiedere un tasso: lo si scarica (se serve) e la schermata si aggiorna da sola
    if (typeof fxRefresh === "function") fxRefresh(true);

    return true;

}

// USD interni -> valuta mostrata. Con valuta USD restituisce il valore invariato.
// Senza un tasso valido restituisce NaN (propaga fino a formatMoneyDigits, che mostra "\u2014").
function convertToDisplay(usdValue) {

    if (currentCurrency === "USD") return usdValue;

    return usdValue * getFxRate(currentCurrency);

}

// valuta mostrata (es. valore digitato dall'utente) -> USD interni
// "currency" e' facoltativo: serve quando l'utente ha cambiato valuta mentre il pannello era aperto.
// "rate" e' facoltativo: tasso (unita' per 1 USD) con cui il valore e' stato MOSTRATO; garantisce che
// l'inversione usi lo stesso tasso della visualizzazione anche se nel frattempo il tasso e' stato aggiornato.
function convertFromDisplay(value, currency, rate) {

    const cur = currency || currentCurrency;

    if (cur === "USD") return value;

    const r = (typeof rate === "number" && isFinite(rate) && rate > 0) ? rate : getFxRate(cur);

    return value / r;

}

// Etichetta nel selettore: testo tradotto se esiste (EUR/USD), altrimenti nome da Intl.DisplayNames nella lingua corrente
function getCurrencyOptionLabel(code) {

    const key = "currencyOption" + code;
    const txt = t(key);

    if (txt !== key) return txt;

    let name = code;

    try {
        if (typeof Intl.DisplayNames === "function") name = new Intl.DisplayNames([getDisplayLocale()], { type: "currency" }).of(code) || code;
    } catch (e) { /* motore senza DisplayNames: si mostra il codice */ }

    return name === code ? code : name + " (" + code + ")";

}

// Cifre decimali della valuta secondo ISO 4217 / Intl (JPY 0, EUR 2, KWD 3, ...)
const currencyDigitsCache = {};

function getCurrencyDigits(code) {

    const c = code || currentCurrency;

    if (!(c in currencyDigitsCache)) {
        try {
            currencyDigitsCache[c] = new Intl.NumberFormat("en", { style: "currency", currency: c }).resolvedOptions().maximumFractionDigits;
        } catch (e) {
            currencyDigitsCache[c] = 2;
        }
    }

    return currencyDigitsCache[c];

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

// Conta gli importi formattati: l'assistente lo usa per sapere se una risposta contiene importi
let moneyFormatCounter = 0;

function formatMoneyDigits(value, digits) {

    moneyFormatCounter++;

    // Nessun tasso valido (valore NaN/Infinity): segnaposto esplicito, mai un importo non convertito
    if (typeof value !== "number" || !isFinite(value)) return "\u2014";

    const locale = getDisplayLocale();
    const nf = buildMoneyFormatter(locale, currentCurrency, digits);

    if (!supportsGroupingAlways() && typeof nf.formatToParts === "function") {
        return repairFourDigitGrouping(nf, locale, value);
    }

    return nf.format(value);

}

// valore GIA' nella valuta mostrata
function formatCurrency(value) {

    return formatMoneyDigits(value, getCurrencyDigits(currentCurrency));

}

// Piu' decimali: la rendita al secondo e' minuscola
function formatCurrencyPrecise(value) {

    return formatMoneyDigits(value, 8);

}

// True quando la valuta mostrata richiede una conversione dal tasso di cambio (tutto tranne USD)
function isCurrencyEstimated() {

    return currentCurrency !== "USD";

}

function getExchangeRateInfo() {

    const s = getFxStatus(currentCurrency);

    return {
        from: "USD",
        to: currentCurrency,
        rate: s.rate,
        date: s.date,
        futureDate: s.futureDate || null,
        state: s.state,
        isLive: s.state === "ok",
        isStale: s.state === "stale",
        isProvisional: s.state === "provisional",
        refreshing: !!s.refreshing,
        source: s.source || CONFIG.fx.sourceName
    };

}

// Tasso scritto con le cifre e il separatore della lingua corrente (fino a 6 cifre significative)
function getCurrencyRateLabel() {

    const info = getExchangeRateInfo();

    if (!isFinite(info.rate)) return "\u2014";

    return new Intl.NumberFormat(getDisplayLocale(), { maximumSignificantDigits: 6, useGrouping: false }).format(info.rate);

}

// Una data "YYYY-MM-DD" nella lingua corrente (e' un giorno di calendario: si formatta in UTC)
function formatRateDate(dateStr) {

    if (!dateStr) return "";

    try {
        return new Intl.DateTimeFormat(getDisplayLocale(), { dateStyle: "medium", timeZone: "UTC" }).format(new Date(dateStr + "T00:00:00Z"));
    } catch (e) {
        return dateStr;
    }

}

function getCurrencyRateDateLabel() {

    return formatRateDate(getExchangeRateInfo().date);

}

// Nota trasparente sul cambio: fonte, data e stato (aggiornato / non aggiornato / non disponibile / non supportato)
function getCurrencyNoteText() {

    if (!isCurrencyEstimated()) return "";

    const info = getExchangeRateInfo();
    const vars = { currency: currentCurrency, rate: getCurrencyRateLabel(), date: getCurrencyRateDateLabel(), source: info.source };

    if (info.state === "unavailable" && info.futureDate) return t("fxNoteFutureDate", Object.assign({}, vars, { date: formatRateDate(info.futureDate) }));
    if (info.state === "ok") return t("fxNoteOk", vars);
    if (info.state === "stale") return t("fxNoteStale", vars);
    if (info.state === "provisional") return t("fxNoteProvisional", vars);
    if (info.state === "loading") return t("fxNoteLoading", vars);
    if (info.state === "unsupported") return t("fxNoteUnsupported", vars);

    return t("fxNoteUnavailable", vars);

}

// Avviso breve per le risposte dell'assistente quando gli importi sono convertiti
function getAssistantCurrencyNote() {

    const info = getExchangeRateInfo();
    const vars = { currency: currentCurrency, rate: getCurrencyRateLabel(), date: getCurrencyRateDateLabel(), source: info.source };

    if (info.state === "ok") return t("assistantCurrencyNote", vars);
    if (info.state === "stale") return t("assistantCurrencyNoteStale", vars);
    if (info.state === "provisional") return t("assistantCurrencyNoteProvisional", vars);

    return t("assistantCurrencyNoteMissing", vars);

}

// Aggiunge l'avviso sul cambio a una risposta con importi quando il tasso non e' valido e aggiornato
function appendAssistantCurrencyStatus(reply, hadAmounts) {

    if (!hadAmounts || !isCurrencyEstimated()) return reply;

    const state = getExchangeRateInfo().state;

    if (state === "ok") return reply;

    const note = getAssistantCurrencyNote();

    return reply.indexOf(note) !== -1 ? reply : reply + " " + note;

}
