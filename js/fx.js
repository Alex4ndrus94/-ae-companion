// ======================================
// AE Companion - Cambi valutari (v0.10.0)
//
// Fonte: API Frankfurter v2 (https://frankfurter.dev/, nessuna chiave API).
//   GET https://api.frankfurter.dev/v2/rates?base=USD
//   -> array di record { date: "YYYY-MM-DD", base: "USD", quote: "EUR", rate: 0.86 }
//   Errori: JSON { status, message } con HTTP 400/404/422 (503 se il server e' sovraccarico).
// I tassi sono "unita' di valuta X per 1 USD". Nessun valore e' scritto nel codice: se non esiste
// un tasso valido (rete assente e nessuna cache) l'importo NON viene convertito ne' spacciato per tale.
//
// Cache: localStorage, chiave CONFIG.fx.cacheKey ("aeFxRates.v1"). Non tocca profilo, lingua, valuta.
// Questo modulo non conosce le formule di gioco: fornisce solo tassi e stato.
// ======================================

const FX_SUPPORTED = CONFIG.fx.currencies;

const fxState = {
    rates: null,        // { EUR: 0.86, ... } unita' per 1 USD (solo dati validati)
    dates: null,        // { EUR: "2026-10-20", ... } data dichiarata dalla fonte per ogni tasso
    fetchedAt: 0,       // ms: quando la risposta valida e' stata scaricata
    source: "",
    loading: false,
    lastError: "",      // "" | "network" | "http" | "malformed"
    lastAttempt: 0,
    held: {},           // { EUR: true }: tasso conservato dalla cache perche' il record nuovo era sospetto (data futura): sempre "non aggiornato"
    future: {},         // { EUR: "2026-10-30" }: record scartati nell'ultima risposta (data nel futuro non giustificata)
    invalid: {},        // { EUR: true }: record scartati nell'ultima risposta perche' tasso o data non validi (es. 2026-02-30)
    validated: false    // true dopo almeno una risposta valida (permette di dire "valuta non fornita dalla fonte")
};

let fxInflight = null;

function fxNow() {

    return Date.now();

}

function fxIsDate(s) {

    // v0.10.3: validazione rigorosa del calendario. JavaScript normalizza le date impossibili (2026-02-30 -> 2026-03-02):
    // si ricostruisce la data da anno/mese/giorno e deve coincidere ESATTAMENTE con la stringa originale.
    if (typeof s !== "string") return false;

    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return false;

    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    const dt = new Date(0);
    dt.setUTCFullYear(y, mo - 1, d);

    const pad = function (n, len) { return String(n).padStart(len, "0"); };

    return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d
        && pad(dt.getUTCFullYear(), 4) + "-" + pad(dt.getUTCMonth() + 1, 2) + "-" + pad(dt.getUTCDate(), 2) === s;

}

// Giorni di calendario UTC fra OGGI (orologio del dispositivo, in UTC) e la data del tasso:
// > 0 passato, 0 oggi, < 0 futuro. La data del tasso e' un giorno di calendario, senza ora: la si legge come giorno UTC.
function fxDayDiff(dateStr) {

    return Math.floor(fxNow() / 86400000) - Math.floor(Date.parse(dateStr + "T00:00:00Z") / 86400000);

}

// Data futura NON giustificata: oltre la tolleranza di CONFIG.fx.futureToleranceDays giorni (vedi config.js)
function fxIsFutureSuspect(dateStr) {

    return fxDayDiff(dateStr) < -CONFIG.fx.futureToleranceDays;

}

// Valida una risposta dell'API. Restituisce { ok, rates, dates, error }.
// Si tengono solo i record USD -> valuta supportata con tasso finito e > 0 e data ISO valida e non futura.
// Un record con data futura non giustificata NON invalida la risposta: finisce in `future` (scartato, per valuta) e le
// altre valute restano utilizzabili. Se non resta nessun record valido: error "future" (solo date future) o "malformed".
function fxParseResponse(json) {

    if (!Array.isArray(json)) return { ok: false, error: "malformed" };

    const rates = {}, dates = {}, future = {}, invalid = {};
    let n = 0;

    json.forEach(function (rec) {

        if (!rec || typeof rec !== "object") return;

        const base = String(rec.base || "").toUpperCase();
        const quote = String(rec.quote || "").toUpperCase();
        const rate = rec.rate;

        if (base !== "USD" || quote === "USD" || FX_SUPPORTED.indexOf(quote) === -1) return;
        if (typeof rate !== "number" || !isFinite(rate) || rate <= 0 || !fxIsDate(rec.date)) { invalid[quote] = true; return; }

        if (fxIsFutureSuspect(rec.date)) { future[quote] = rec.date; return; }

        rates[quote] = rate;
        dates[quote] = rec.date;
        n++;

    });

    Object.keys(rates).forEach(function (code) { delete future[code]; delete invalid[code]; });   // un altro record valido per la stessa valuta vince

    if (n === 0) return { ok: false, error: Object.keys(future).length ? "future" : "malformed", future: future, invalid: invalid };

    return { ok: true, rates: rates, dates: dates, future: future, invalid: invalid };

}

function fxLoadCache() {

    try {

        const raw = localStorage.getItem(CONFIG.fx.cacheKey);
        if (!raw) return false;

        const c = JSON.parse(raw);

        if (!c || c.v !== 1 || c.base !== "USD" || !c.rates || typeof c.rates !== "object" || !c.dates || typeof c.dates !== "object") return false;
        if (typeof c.fetchedAt !== "number" || !isFinite(c.fetchedAt)) return false;

        const rates = {}, dates = {};

        Object.keys(c.rates).forEach(function (code) {
            const r = c.rates[code];
            if (FX_SUPPORTED.indexOf(code) !== -1 && code !== "USD" && typeof r === "number" && isFinite(r) && r > 0 && fxIsDate(c.dates[code])) {
                rates[code] = r;
                dates[code] = c.dates[code];
            }
        });

        if (Object.keys(rates).length === 0) return false;

        const held = {};
        (Array.isArray(c.held) ? c.held : []).forEach(function (code) { if (code in rates) held[code] = true; });

        // v0.10.4: stato dei record rifiutati (solo per valute SENZA tasso in cache). Dati validati rigorosamente: campi mancanti
        // (cache v0.10.0-v0.10.3) o malformati sono ignorati; non possono mai produrre un tasso, solo "unavailable".
        const future = {}, invalid = {};
        const usable = function (code) { return typeof code === "string" && FX_SUPPORTED.indexOf(code) !== -1 && code !== "USD" && !(code in rates); };

        if (c.future && typeof c.future === "object" && !Array.isArray(c.future)) {
            Object.keys(c.future).forEach(function (code) { if (usable(code) && fxIsDate(c.future[code])) future[code] = c.future[code]; });
        }
        if (Array.isArray(c.invalid)) {
            c.invalid.forEach(function (code) { if (usable(code) && !(code in future)) invalid[code] = true; });
        }

        fxState.rates = rates;
        fxState.dates = dates;
        fxState.held = held;
        fxState.future = future;
        fxState.invalid = invalid;
        fxState.fetchedAt = c.fetchedAt;
        fxState.source = typeof c.source === "string" ? c.source : CONFIG.fx.sourceName;
        fxState.validated = true;

        return true;

    } catch (e) {

        return false;   // cache illeggibile o storage non disponibile: come se non ci fosse

    }

}

function fxSaveCache() {

    try {

        localStorage.setItem(CONFIG.fx.cacheKey, JSON.stringify({
            v: 1, base: "USD", source: fxState.source, fetchedAt: fxState.fetchedAt, rates: fxState.rates, dates: fxState.dates, held: Object.keys(fxState.held), future: fxState.future, invalid: Object.keys(fxState.invalid)
        }));

    } catch (e) { /* storage non disponibile: il tasso resta solo in memoria */ }

}

// Il dato e' scaduto se piu' vecchio del TTL (o con data di scaricamento nel futuro oltre 1 ora: orologio errato)
function fxIsExpired() {

    const age = fxNow() - fxState.fetchedAt;

    return !fxState.rates || age > CONFIG.fx.cacheTtlMs || age < -3600 * 1000;

}

// Stato del tasso per una valuta:
//  identity    USD (valuta di riferimento): nessuna conversione, nessuna rete
//  ok          tasso valido e aggiornato
//  stale       tasso valido ma non aggiornato (cache scaduta / aggiornamento fallito / data troppo vecchia)
//  provisional tasso utilizzabile ma con data FUTURA entro la tolleranza (v0.10.3): non dichiarato "aggiornato"
//  loading     nessun tasso ancora, scaricamento in corso
//  unavailable nessun tasso valido (rete assente o risposta non valida, nessuna cache)
//  unsupported la fonte ha risposto ma non fornisce questa valuta
function getFxStatus(code) {

    if (code === "USD") return { state: "identity", rate: 1, date: null, source: "", currency: code, refreshing: false };

    // v0.10.5: `refreshing` (richiesta in corso) e' presente in OGNI stato, con o senza tasso utilizzabile
    const base = { currency: code, source: fxState.source || CONFIG.fx.sourceName, error: fxState.lastError, refreshing: !!fxState.loading };
    const none = function (state, extra) { return Object.assign(base, { state: state, rate: NaN, date: null }, extra || {}); };

    if (!fxState.rates || !(code in fxState.rates)) {

        // record scartato perche' datato nel futuro: nessun tasso utilizzabile per questa valuta
        if (fxState.future[code]) return none(fxState.loading ? "loading" : "unavailable", { futureDate: fxState.future[code] });

        // record con tasso o data non validi (es. data impossibile): non e' "valuta non fornita", e' una risposta non utilizzabile
        if (fxState.invalid[code]) return none(fxState.loading ? "loading" : "unavailable");

        if (!fxState.rates) return none(fxState.loading ? "loading" : "unavailable");

        return none(fxState.validated && !fxState.loading ? "unsupported" : "loading");

    }

    const date = fxState.dates[code];

    // anche un tasso gia' in cache (orologio spostato indietro) con data futura non giustificata non si usa
    if (fxIsFutureSuspect(date)) return none("unavailable", { futureDate: date });

    const old = fxIsExpired() || fxDayDiff(date) > CONFIG.fx.maxRateAgeDays || !!fxState.held[code];

    // Data futura ENTRO la tolleranza (giustificata solo dai fusi orari): tasso usabile ma NON dichiarato aggiornato.
    // Lo stato e' derivato dalla data e dall'orologio, quindi si mantiene in cache/ricarica e passa a "ok" da solo
    // quando la data diventa oggi, o dopo un aggiornamento riuscito con una data valida. La data della fonte non viene mai modificata.
    // v0.10.4: "non aggiornato" resta tale anche mentre la richiesta e' in corso, finche' il dato non e' sostituito da un
    // tasso valido; il caricamento e' indicato a parte (campo `refreshing`).
    const state = old ? "stale" : (fxDayDiff(date) < 0 ? "provisional" : "ok");

    return Object.assign(base, { state: state, rate: fxState.rates[code], date: date });

}

// Tasso numerico "unita' di `code` per 1 USD", oppure NaN se non esiste un tasso valido
function getFxRate(code) {

    const s = getFxStatus(code);

    return (s.state === "identity" || s.state === "ok" || s.state === "stale" || s.state === "provisional") ? s.rate : NaN;

}

function fxNotify() {

    if (typeof renderDashboard === "function") {
        try { renderDashboard(); } catch (e) { console.error("AE Companion: errore di rendering dopo l'aggiornamento del cambio", e); }
    }

}

function fxNeedsRefresh(currency) {

    return currency && currency !== "USD" && (fxIsExpired() || !(currency in (fxState.rates || {})) || !!fxState.held[currency]);

}

// Scarica i tassi se servono. Non lancia mai: un errore dell'API non blocca l'app.
// force = ignora il periodo di attesa dopo un errore (es. ritorno online, cambio valuta).
function fxRefresh(force) {

    if (fxInflight) return fxInflight;

    const cur = typeof getCurrency === "function" ? getCurrency() : "USD";

    if (cur === "USD") return Promise.resolve(false);
    if (!fxNeedsRefresh(cur)) return Promise.resolve(false);
    if (!force && fxState.lastError && fxNow() - fxState.lastAttempt < CONFIG.fx.retryCooldownMs) return Promise.resolve(false);
    if (typeof fetch !== "function") { fxState.lastError = "network"; fxState.lastAttempt = fxNow(); return Promise.resolve(false); }

    fxState.loading = true;
    fxState.lastAttempt = fxNow();

    const url = CONFIG.fx.endpoint + "?base=USD";
    let timer = null;
    const opts = { headers: { "Accept": "application/json" } };

    if (typeof AbortController === "function") {
        const ctl = new AbortController();
        opts.signal = ctl.signal;
        timer = setTimeout(function () { ctl.abort(); }, CONFIG.fx.timeoutMs);
    }

    fxInflight = Promise.resolve()
        .then(function () { return fetch(url, opts); })
        .then(function (res) {
            if (!res || !res.ok) { const e = new Error("http"); e.fxKind = "http"; throw e; }
            return res.json();
        })
        .then(function (json) {
            const parsed = fxParseResponse(json);
            if (!parsed.ok) { fxState.future = parsed.future || {}; fxState.invalid = parsed.invalid || {}; const e = new Error(parsed.error); e.fxKind = parsed.error; throw e; }

            // Record con data futura non giustificata: scartati per valuta. Se la cache precedente aveva un tasso valido per
            // quella valuta lo si conserva ma marcato "non aggiornato" (held); altrimenti la valuta resta senza tasso.
            const rates = Object.assign({}, parsed.rates), dates = Object.assign({}, parsed.dates), held = {};

            const rejected = Object.assign({}, parsed.invalid, parsed.future);

            Object.keys(rejected).forEach(function (code) {
                if (fxState.rates && code in fxState.rates && !fxIsFutureSuspect(fxState.dates[code])) {
                    rates[code] = fxState.rates[code];
                    dates[code] = fxState.dates[code];
                    held[code] = true;
                }
            });

            fxState.rates = rates;
            fxState.dates = dates;
            fxState.held = held;
            fxState.future = parsed.future;
            fxState.invalid = parsed.invalid;
            fxState.fetchedAt = fxNow();
            fxState.source = CONFIG.fx.sourceName;
            fxState.validated = true;
            fxState.lastError = (cur in parsed.future) ? "future" : ((cur in parsed.invalid) ? "malformed" : "");
            fxSaveCache();
            return true;
        })
        .catch(function (err) {
            // Nessuna sostituzione silenziosa: la cache precedente (se valida) resta com'e', altrimenti nessun tasso
            fxState.lastError = (err && err.fxKind) || (err && err.name === "SyntaxError" ? "malformed" : "network");
            return false;
        })
        .then(function (changed) {
            if (timer) clearTimeout(timer);
            fxState.loading = false;
            fxInflight = null;
            fxNotify();
            return changed;
        });

    // Lo stato "loading" e' visibile subito: aggiorna la schermata senza aspettare la rete
    fxNotify();

    return fxInflight;

}

function fxInit() {

    fxLoadCache();

    try {
        if (typeof document !== "undefined" && document.addEventListener) {
            document.addEventListener("visibilitychange", function () {
                if (document.visibilityState === "visible") fxRefresh(false);
            });
        }
        if (typeof window !== "undefined" && window.addEventListener) {
            window.addEventListener("online", function () { fxRefresh(true); });
        }
    } catch (e) { /* ambiente senza eventi */ }

    return fxRefresh(false);

}

// Cache letta subito al caricamento: il primo rendering usa il tasso salvato (se esiste)
fxLoadCache();
