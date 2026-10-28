// Test v0.10.0: conversione valutaria automatica (js/fx.js + js/money.js).
// Uso: node tests/check-fx.js
// NESSUN test usa la rete: ogni risposta dell'API e' simulata con una funzione fetch deterministica (opts.fetch);
// la sandbox NON ha fetch di default (verificato qui sotto). Tassi simulati = numeri di prova, NON tassi reali.
const fs = require("fs"), path = require("path");
const { load, runIn, evalIn, suite, FIXED, FX_KEY } = require("./lib/sandbox");
const T = suite("fx");
const root = path.join(__dirname, "..");
const nb = s => String(s).replace(/[\u00a0\u202f]/g, " ");
const H = 3600 * 1000;

// ---- tassi SIMULATI (unita' per 1 USD) ----
const SIM = { EUR: 0.8512, JPY: 151.23, GBP: 0.7421, CAD: 1.3801, AUD: 1.5412, CHF: 0.8123, KWD: 0.3052 };
const SIM_DATE = "2026-10-09";
const records = (rates, date) => Object.keys(rates).map(q => ({ date: date || SIM_DATE, base: "USD", quote: q, rate: rates[q] }))
    .concat([{ date: date || SIM_DATE, base: "USD", quote: "USD", rate: 1 }]);
const okResponse = (body) => ({ ok: true, status: 200, json: async () => body });

// fetch simulato con contatore
function mkFetch(behavior) {
    const f = async (url, opts) => { f.calls.push(String(url)); return behavior(url, opts, f.calls.length); };
    f.calls = [];
    return f;
}
const seed = (rates, dates, ageMs) => ({ rates: rates, dates: dates, fetchedAt: FIXED - (ageMs || 0) });
const datesOf = (rates, d) => Object.keys(rates).reduce((a, k) => { a[k] = d || SIM_DATE; return a; }, {});
const cache = (rates, ageMs, d) => seed(rates, datesOf(rates, d), ageMs);
// profilo di prova: 152 terreni, 12 badge, gruppo EU_WEST
const DATA = JSON.stringify({ profile: { name: "T" }, lands: { common: 100, rare: 40, epic: 10, legendary: 2 }, badges: 12, mayorTarget: 0,
    passes: { explorer: false, mission: false }, goal: { type: "income", incomeTargetUSD: 5, incomeTargetBoosted: true, landsTarget: 0 },
    settings: { dailyLoginAB: 50, abBalance: 340 } });
const mkBase = (lang, cur, o) => load(Object.assign({ store: { aeLang: lang, aeCurrency: cur, aePrefsMigration: "1", aeCountryGroup: "EU_WEST", aeCompanionData: DATA } }, o || {}));
const mk = mkBase;
const expFmt = (lang, cur, v, digits) => nb(new Intl.NumberFormat(lang === "it" ? "it-IT" : "en-US", { style: "currency", currency: cur, minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: "always" }).format(v));

(async function main() {

    console.log("== A. Nessuna rete nei test");
    T.ok(runIn(mk("en", "USD"), "typeof fetch") === "undefined", "A1 la sandbox non ha fetch: i test non possono raggiungere internet");
    T.ok(!/fetch\(\s*["'`]https?:/.test(fs.readFileSync(__filename, "utf8")) && !/require\(["'](https?|net)["']\)/.test(fs.readFileSync(__filename, "utf8")), "A2 questo file non chiama URL reali ne' moduli di rete");

    console.log("\n== B. Validazione della risposta (fxParseResponse)");
    {
        const h = mk("en", "USD");
        const P = j => evalIn(h, "fxParseResponse(" + JSON.stringify(j) + ")");
        let r = P(records({ EUR: 0.85, JPY: 150 }));
        T.ok(r.ok && r.rates.EUR === 0.85 && r.rates.JPY === 150 && !("USD" in r.rates) && r.dates.EUR === SIM_DATE, "B1 risposta valida: tassi e date per valuta, il record USD->USD ignorato");
        T.eq(P({ status: 422, message: "invalid currency: ABC" }).error, "malformed", "B2 corpo di errore (oggetto, non array) -> malformato");
        T.eq(P([]).ok, false, "B3 array vuoto -> non valido");
        T.eq(P("<html>").ok, false, "B4 non-JSON/stringa -> non valido");
        T.eq(P([{ date: SIM_DATE, base: "USD", quote: "EUR", rate: 0 }, { date: SIM_DATE, base: "USD", quote: "GBP", rate: -1 }, { date: SIM_DATE, base: "USD", quote: "JPY", rate: "151" }, { date: SIM_DATE, base: "USD", quote: "CAD", rate: null }]).ok, false, "B5 tassi 0, negativi, stringa o null scartati");
        T.eq(P([{ date: "oggi", base: "USD", quote: "EUR", rate: 0.9 }]).ok, false, "B6 data non ISO scartata");
        T.eq(P([{ date: SIM_DATE, base: "EUR", quote: "USD", rate: 1.1 }]).ok, false, "B7 base diversa da USD scartata (nessun tasso invertito inventato)");
        r = P([{ date: SIM_DATE, base: "USD", quote: "ZZZ", rate: 3 }, { date: SIM_DATE, base: "USD", quote: "eur", rate: 0.9 }, null, 5]);
        T.ok(r.ok && Object.keys(r.rates).join() === "EUR", "B8 valute non supportate e righe spazzatura ignorate, codice normalizzato in maiuscolo");
    }

    console.log("\n== C. Calcolo manuale con tassi fissi simulati (USD -> EUR, JPY, GBP, CAD, AUD, CHF, KWD)");
    const X = [0, 0.004, 1, 123.45, 1234.56, 54321.09];
    for (const cur of Object.keys(SIM)) {
        const h = mk("en", cur, { fx: cache(SIM) });
        const conv = X.map(v => runIn(h, "convertToDisplay(" + v + ")"));
        T.eq(conv, X.map(v => v * SIM[cur]), "C USD -> " + cur + ": convertToDisplay = USD x " + SIM[cur]);
        const back = X.map(v => runIn(h, "convertFromDisplay(" + (v * SIM[cur]) + ")"));
        T.ok(back.every((b, i) => Math.abs(b - X[i]) <= Math.abs(X[i]) * 1e-12), "C " + cur + ": conversione inversa = USD originale");
        T.eq(runIn(h, "getFxStatus('" + cur + "').state"), "ok", "C " + cur + ": stato ok (cache fresca)");
    }

    console.log("\n== D. Valuta di riferimento = valuta di visualizzazione (USD): nessuna conversione, nessuna rete");
    {
        const f = mkFetch(async () => okResponse(records(SIM)));
        const h = mk("en", "USD", { fetch: f, fx: false });
        T.eq(runIn(h, "convertToDisplay(123.45)"), 123.45, "D1 USD -> USD invariato anche senza alcuna cache");
        T.eq(runIn(h, "getFxStatus('USD').state"), "identity", "D2 stato 'identity'");
        await runIn(h, "fxRefresh(true)");
        await runIn(h, "fxInit()");
        T.eq(f.calls.length, 0, "D3 con valuta USD non parte nessuna richiesta di rete");
        T.eq(runIn(h, "getCurrencyNoteText()"), "", "D4 nessuna nota con USD");
        T.eq(nb(runIn(h, "formatCurrency(1234.5)")), "$1,234.50", "D5 importo in USD formattato");
    }

    console.log("\n== E. Valute con 0, 2 e 3 decimali");
    for (const [cur, d] of [["JPY", 0], ["EUR", 2], ["KWD", 3]]) {
        for (const lang of ["en", "it"]) {
            const h = mk(lang, cur, { fx: cache(SIM) });
            const usd = 1234.5678, shown = usd * SIM[cur];
            const got = nb(runIn(h, "formatCurrency(convertToDisplay(" + usd + "))"));
            T.eq(got, expFmt(lang, cur, shown, d), "E " + lang.toUpperCase() + "/" + cur + " " + d + " decimali -> " + got);
            T.eq(runIn(h, "getCurrencyDigits('" + cur + "')"), d, "E getCurrencyDigits(" + cur + ") = " + d);
        }
    }
    {
        const h = mk("en", "JPY", { fx: cache(SIM) });
        T.ok(!/[.,]\d{2}$/.test(nb(runIn(h, "formatCurrency(convertToDisplay(1.5))"))) && /^¥\d+$/.test(nb(runIn(h, "formatCurrency(convertToDisplay(1.5))"))), "E JPY: nessun decimale (¥227)");
        const s = nb(runIn(h, "formatStrategyMoney(0.003)"));
        T.ok(/^¥0\.\d{2}$/.test(s) && /[1-9]/.test(s.split(".")[1]), "E JPY: importo < 1 yen nella strategia usa 2 decimali per non sparire (" + s + ")");
        const k = mk("en", "KWD", { fx: cache(SIM) });
        T.ok(/\.\d{3}$/.test(nb(runIn(k, "formatStrategyMoney(10)"))), "E KWD: la strategia usa 3 decimali (" + nb(runIn(k, "formatStrategyMoney(10)")) + ")");
        const e = mk("en", "EUR", { fx: cache(SIM) });
        T.eq(nb(runIn(e, "formatStrategyMoney(0.003)")), nb(runIn(e, "formatMoneyDigits(convertToDisplay(0.003), 4)")), "E EUR: sotto 1 centesimo 4 decimali, come in v0.9.5");
    }

    console.log("\n== F. Aggiornamento, cache valida/scaduta, rete assente, risposta malformata, valuta non supportata");
    {   // F1 niente cache -> scarica, salva, mostra data e fonte
        const f = mkFetch(async () => okResponse(records(SIM)));
        const h = mk("it", "EUR", { fetch: f, fx: false, extra: "var __renders = 0; renderDashboard = function(){ __renders++; };" });
        T.eq(runIn(h, "getFxStatus('EUR').state"), "unavailable", "F1 prima del download: nessun tasso (niente 0,86 di ripiego)");
        await runIn(h, "fxInit()");
        T.eq(f.calls.length, 1, "F1 una sola richiesta");
        T.ok(/^https:\/\/api\.frankfurter\.dev\/v2\/rates\?base=USD$/.test(f.calls[0]), "F1 endpoint documentato: " + f.calls[0]);
        T.eq([runIn(h, "getFxStatus('EUR').state"), runIn(h, "getFxRate('EUR')"), runIn(h, "getFxStatus('EUR').date")], ["ok", SIM.EUR, SIM_DATE], "F1 tasso aggiornato, data = quella della fonte");
        const saved = JSON.parse(h.store[FX_KEY]);
        T.ok(saved.v === 1 && saved.base === "USD" && saved.rates.EUR === SIM.EUR && saved.dates.EUR === SIM_DATE && saved.source === "Frankfurter" && saved.fetchedAt === FIXED, "F1 cache salvata nella chiave nuova " + FX_KEY);
        T.ok(runIn(h, "__renders") >= 2, "F1 la schermata viene aggiornata (stato di caricamento e risultato)");
        const note = nb(runIn(h, "getCurrencyNoteText()"));
        T.ok(/Frankfurter/.test(note) && /0,8512/.test(note) && /ott 2026|9 ott/.test(note), "F1 la nota mostra fonte, tasso e data: " + note);
    }
    {   // F2 cache valida -> nessuna richiesta
        const f = mkFetch(async () => okResponse(records({ EUR: 0.5 })));
        const h = mk("en", "EUR", { fetch: f, fx: cache(SIM, 2 * H) });
        await runIn(h, "fxInit()");
        T.eq(f.calls.length, 0, "F2 cache valida (2 h < 12 h): nessuna richiesta");
        T.eq(runIn(h, "getFxRate('EUR')"), SIM.EUR, "F2 si usa il tasso in cache");
    }
    {   // F3 cache scaduta + rete ok -> aggiorna
        const f = mkFetch(async () => okResponse(records({ EUR: 0.9001, JPY: 150 }, "2026-10-09")));
        const h = mk("en", "EUR", { fetch: f, fx: cache({ EUR: 0.8 }, 13 * H, "2026-10-08") });
        T.eq(runIn(h, "getFxStatus('EUR').state"), "stale", "F3 cache di 13 h: dato scaduto (segnalato come non aggiornato se l'aggiornamento fallisse)");
        await runIn(h, "fxInit()");
        T.eq([f.calls.length, runIn(h, "getFxRate('EUR')"), runIn(h, "getFxStatus('EUR').state")], [1, 0.9001, "ok"], "F3 cache scaduta: riscaricato, nuovo tasso usato");
    }
    {   // F4 cache scaduta + rete assente -> ultimo tasso valido + avviso
        const f = mkFetch(async () => { throw new TypeError("Failed to fetch"); });
        const h = mk("it", "EUR", { fetch: f, fx: cache({ EUR: 0.8 }, 30 * H, "2026-10-08") });
        const before = h.store[FX_KEY];
        await runIn(h, "fxInit()");
        T.eq([runIn(h, "getFxStatus('EUR').state"), runIn(h, "getFxRate('EUR')")], ["stale", 0.8], "F4 rete assente: si usa l'ULTIMO tasso valido, stato 'stale'");
        T.ok(/NON aggiornato/.test(runIn(h, "getCurrencyNoteText()")) && /8 ott/.test(nb(runIn(h, "getCurrencyNoteText()"))), "F4 avviso 'cambio NON aggiornato' con la data dell'ultimo dato");
        T.ok(/NON aggiornato/.test(runIn(h, "getAssistantCurrencyNote()")), "F4 anche l'assistente avvisa che il cambio non e' aggiornato");
        T.ok(/NON aggiornato/.test(runIn(h, "getAssistantReply('quanto guadagno?')")) && !/NON aggiornato/.test(runIn(h, "getAssistantReply('ciao')")), "F4 avviso 'non aggiornato' su ogni risposta con importi, non sulle risposte senza importi");
        T.eq(h.store[FX_KEY], before, "F4 la cache valida non viene toccata dall'errore");
        T.ok(nb(runIn(h, "formatCurrency(convertToDisplay(10))")) === "8,00 €", "F4 importi convertiti con 0,8 (ultimo tasso valido)");
    }
    {   // F5 nessuna cache + rete assente -> nessun importo spacciato per convertito
        const f = mkFetch(async () => { throw new TypeError("offline"); });
        const h = mk("it", "EUR", { fetch: f, fx: false });
        await runIn(h, "fxInit()");
        T.eq(runIn(h, "getFxStatus('EUR').state"), "unavailable", "F5 stato esplicito: non disponibile");
        T.ok(runIn(h, "Number.isNaN(convertToDisplay(10))"), "F5 convertToDisplay senza tasso restituisce NaN (non 10, non 8,6)");
        T.eq([runIn(h, "formatCurrency(convertToDisplay(10))"), runIn(h, "formatCurrencyPrecise(convertToDisplay(10) / 86400)"), runIn(h, "formatStrategyMoney(10)")], ["—", "—", "—"], "F5 gli importi sono «—» (mai 10 € ne' 8,60 €)");
        T.ok(!/8,6|10,00/.test(runIn(h, "getCurrencyNoteText()")) && /non disponibile/.test(runIn(h, "getCurrencyNoteText()")), "F5 nota 'cambio non disponibile', nessun 0,86");
        T.ok(!(FX_KEY in h.store), "F5 nessuna cache scritta");
        T.ok(/non sono stati convertiti/.test(runIn(h, "getAssistantReply('quanto guadagno?')")) && /—/.test(runIn(h, "getAssistantReply('quanto guadagno?')")), "F5 l'assistente non da' importi convertiti e lo dichiara");
        T.eq(runIn(h, "getDailyIncome() > 0"), true, "F5 i calcoli di gioco in USD restano disponibili");
    }
    {   // F6 risposta malformata
        for (const [label, body] of [["oggetto di errore", { status: 422, message: "invalid currency: ABC" }], ["array di spazzatura", [{ foo: 1 }, "x", null]], ["array vuoto", []]]) {
            const f = mkFetch(async () => okResponse(body));
            const h = mk("en", "EUR", { fetch: f, fx: cache({ EUR: 0.8 }, 20 * H) });
            const before = h.store[FX_KEY];
            await runIn(h, "fxRefresh(true)");
            T.ok(runIn(h, "getFxRate('EUR')") === 0.8 && runIn(h, "getFxStatus('EUR').state") === "stale" && h.store[FX_KEY] === before, "F6 " + label + " con cache scaduta: cache NON sovrascritta, tasso vecchio segnalato come non aggiornato");
        }
        const h2 = mk("en", "EUR", { fetch: mkFetch(async () => okResponse({ message: "nope" })), fx: false });
        await runIn(h2, "fxRefresh(true)");
        T.eq([runIn(h2, "getFxStatus('EUR').state"), runIn(h2, "fxState.lastError")], ["unavailable", "malformed"], "F6 malformata senza cache: non disponibile (errore 'malformed')");
        const h3 = mk("en", "EUR", { fetch: mkFetch(async () => ({ ok: true, json: async () => { throw new SyntaxError("Unexpected token <"); } })), fx: false });
        await runIn(h3, "fxRefresh(true)");
        T.eq(runIn(h3, "fxState.lastError"), "malformed", "F6 JSON non valido -> 'malformed'");
    }
    {   // F7 errore HTTP
        const h = mk("en", "EUR", { fetch: mkFetch(async () => ({ ok: false, status: 422, json: async () => ({ status: 422, message: "invalid currency: ABC" }) })), fx: false });
        await runIn(h, "fxRefresh(true)");
        T.eq([runIn(h, "getFxStatus('EUR').state"), runIn(h, "fxState.lastError")], ["unavailable", "http"], "F7 HTTP 422 -> non disponibile (errore 'http'), l'app non si blocca");
    }
    {   // F8 valuta non supportata dalla fonte
        const f = mkFetch(async () => okResponse(records({ EUR: 0.85, GBP: 0.74 })));
        const h = mk("en", "JPY", { fetch: f, fx: false });
        await runIn(h, "fxInit()");
        T.eq(runIn(h, "getFxStatus('JPY').state"), "unsupported", "F8 la fonte risponde ma senza JPY -> 'unsupported'");
        T.eq([runIn(h, "formatCurrency(convertToDisplay(10))"), runIn(h, "getFxRate('JPY')")], ["—", null], "F8 nessuna conversione simulata: importo «—»");
        T.ok(/does not provide JPY/.test(runIn(h, "getCurrencyNoteText()")), "F8 messaggio chiaro: " + runIn(h, "getCurrencyNoteText()"));
        runIn(h, "setCurrency('GBP')");
        await runIn(h, "fxRefresh(true)");
        T.eq(runIn(h, "getFxRate('GBP')"), 0.74, "F8 le altre valute continuano a funzionare");
    }
    {   // F9 pausa dopo errore, richiesta forzata, richieste in parallelo
        let n = 0;
        const f = mkFetch(async () => { n++; if (n < 3) throw new TypeError("offline"); return okResponse(records(SIM)); });
        const h = mk("en", "EUR", { fetch: f, fx: false });
        const p1 = runIn(h, "fxRefresh(false)"), p2 = runIn(h, "fxRefresh(false)");
        await Promise.all([p1, p2]);
        T.eq(f.calls.length, 1, "F9 due richieste contemporanee = una sola chiamata di rete");
        await runIn(h, "fxRefresh(false)");
        T.eq(f.calls.length, 1, "F9 dopo un errore non si riprova subito (pausa di 60 s)");
        await runIn(h, "fxRefresh(true)");
        T.eq(f.calls.length, 2, "F9 il ritorno online / il cambio valuta forzano un nuovo tentativo");
        await runIn(h, "fxRefresh(true)");
        T.eq([f.calls.length, runIn(h, "getFxStatus('EUR').state")], [3, "ok"], "F9 al tentativo riuscito il tasso torna disponibile");
        await runIn(h, "fxRefresh(false)");
        T.eq(f.calls.length, 3, "F9 con dato fresco non si riscarica");
    }
    {   // F10 data del tasso troppo vecchia anche con cache fresca
        const h = mk("en", "EUR", { fx: cache({ EUR: 0.8 }, 1 * H, "2026-09-20") });
        T.eq(runIn(h, "getFxStatus('EUR').state"), "stale", "F10 data del tasso di 19 giorni fa -> segnalata come non aggiornata");
    }
    {   // F11 cache corrotta o con valori non validi: ignorata, nessun crash
        for (const bad of ["{non json", "null", JSON.stringify({ v: 2, base: "USD", fetchedAt: FIXED, rates: { EUR: 0.8 }, dates: { EUR: SIM_DATE } }), JSON.stringify({ v: 1, base: "USD", fetchedAt: FIXED, rates: { EUR: -3, JPY: "x" }, dates: { EUR: SIM_DATE, JPY: SIM_DATE } })]) {
            const h = mk("en", "EUR", { store: { aeLang: "en", aeCurrency: "EUR", aePrefsMigration: "1", [FX_KEY]: bad }, fx: false });
            T.eq(runIn(h, "getFxStatus('EUR').state"), "unavailable", "F11 cache non valida ignorata (" + bad.slice(0, 22) + "…)");
        }
    }
    {   // F12 cambio valuta a runtime scarica il tasso mancante e salva solo la chiave della valuta + cache
        const f = mkFetch(async () => okResponse(records(SIM)));
        const h = mk("en", "EUR", { fetch: f, fx: cache({ EUR: 0.85 }, 1 * H) });
        const rec = runIn(h, "(function(){ var r = []; return r; })()");
        h.writes.length = 0;
        runIn(h, "setCurrency('JPY')");
        T.eq(runIn(h, "getFxStatus('JPY').state"), "loading", "F12 subito dopo il cambio: JPY in caricamento (importi «—», non 0 ne' importi USD)");
        T.eq(runIn(h, "formatCurrency(convertToDisplay(10))"), "—", "F12 durante il caricamento l'importo non e' mostrato");
        await runIn(h, "fxRefresh(true)");
        T.eq(runIn(h, "getFxRate('JPY')"), SIM.JPY, "F12 dopo il download: tasso JPY disponibile");
        T.eq(h.writes.filter((k, i, a) => a.indexOf(k) === i).sort(), ["aeCurrency", FX_KEY].sort(), "F12 scritte solo " + FX_KEY + " e aeCurrency: " + h.writes.join(","));
        T.eq(h.store.aeLang, "en", "F12 la lingua non e' cambiata");
    }

    console.log("\n== G. Conversione inversa degli input e assenza di doppia conversione");
    {
        const files = require("./lib/sandbox").ALL_FILES.concat(["settings"]);
        const els = h => h.nodes;
        const open = h => { runIn(h, "openSettings(false)"); return h.nodes; };
        const mk = (lang, cur, o) => mkBase(lang, cur, Object.assign({ extra: "renderDashboard = function(){};" }, o));   // saveSettings() chiama renderDashboard (app.js non e' caricato qui)
        // G1 il valore mostrato e' USD x tasso; se NON modificato il target USD salvato resta identico anche con tasso cambiato
        let h = mk("en", "EUR", { files, fx: cache({ EUR: 0.8 }) });
        let n = open(h);
        T.eq(n["goal-income-target-input"].value, "4.00", "G1 obiettivo 5 USD mostrato come 4.00 EUR (tasso 0,8)");
        T.eq(n["goal-income-target-input"].step, "0.01", "G1 step 0.01 per EUR");
        runIn(h, "fxState.rates.EUR = 0.9");   // il tasso cambia mentre il pannello e' aperto
        runIn(h, "saveSettings()");
        T.eq(runIn(h, "player.goal.incomeTargetUSD"), 5, "G2 campo non toccato: il target USD resta ESATTAMENTE 5 (nessun ricalcolo con un tasso diverso)");
        // G3 campo modificato: inversione con il tasso con cui il valore e' stato mostrato (0,8), non con quello nuovo (0,9)
        h = mk("en", "EUR", { files, fx: cache({ EUR: 0.8 }) });
        n = open(h);
        n["goal-income-target-input"].value = "10.00";
        runIn(h, "fxState.rates.EUR = 0.9");
        runIn(h, "saveSettings()");
        T.ok(Math.abs(runIn(h, "player.goal.incomeTargetUSD") - 12.5) < 1e-12, "G3 10 EUR digitati con tasso mostrato 0,8 -> 12,5 USD (non 11,11)");
        // G4 JPY: 0 decimali e step 1
        h = mk("en", "JPY", { files, fx: cache(SIM) });
        n = open(h);
        T.eq([n["goal-income-target-input"].value, n["goal-income-target-input"].step], [String(Math.round(5 * SIM.JPY)), "1"], "G4 JPY: obiettivo senza decimali (" + n["goal-income-target-input"].value + "), step 1");
        n["goal-income-target-input"].value = "1000";
        runIn(h, "saveSettings()");
        T.ok(Math.abs(runIn(h, "player.goal.incomeTargetUSD") - 1000 / SIM.JPY) < 1e-12, "G4 1000 JPY -> USD = 1000 / tasso");
        // G5 senza tasso: campo vuoto, invariato = nessuna modifica, digitato = rifiutato
        h = mk("it", "EUR", { files, fx: false });
        n = open(h);
        T.eq(n["goal-income-target-input"].value, "", "G5 senza tasso il campo obiettivo e' vuoto (non un valore USD travestito)");
        runIn(h, "saveSettings()");
        T.eq(runIn(h, "player.goal.incomeTargetUSD"), 5, "G5 salvando senza toccare il campo il target USD non cambia");
        h = mk("it", "EUR", { files, fx: false });
        n = open(h);
        n["goal-income-target-input"].value = "7";
        runIn(h, "saveSettings()");
        T.eq(runIn(h, "player.goal.incomeTargetUSD"), 5, "G5 con importo digitato ma senza tasso: rifiutato, target invariato");
        T.ok(/non posso convertire/.test(n["currency-note"].textContent), "G5 messaggio all'utente: " + n["currency-note"].textContent);
        // G6 USD: nessuna conversione
        h = mk("en", "USD", { files, fx: false });
        n = open(h);
        n["goal-income-target-input"].value = "12.34";
        runIn(h, "saveSettings()");
        T.eq(runIn(h, "player.goal.incomeTargetUSD"), 12.34, "G6 USD: valore digitato = valore salvato");
        // G7 cambio valuta nel pannello: il valore digitato e' nella valuta mostrata all'apertura, convertita UNA volta
        h = mk("en", "EUR", { files, fx: cache(SIM) });
        n = open(h);
        n["goal-income-target-input"].value = "8.512";
        n["currency-input"].value = "JPY";
        runIn(h, "saveSettings()");
        T.ok(Math.abs(runIn(h, "player.goal.incomeTargetUSD") - 8.512 / SIM.EUR) < 1e-12 && runIn(h, "getCurrency()") === "JPY", "G7 8,512 EUR digitati e valuta cambiata in JPY: USD = 10 (convertito una sola volta, col tasso EUR)");
    }
    {   // G8 nessuna doppia conversione nelle schermate
        const h = mk("en", "EUR", { fx: cache(SIM) });
        const usd = runIn(h, "getDailyIncome()");
        const once = expFmt("en", "EUR", usd * SIM.EUR, 2), twice = expFmt("en", "EUR", usd * SIM.EUR * SIM.EUR, 2);
        T.eq(nb(runIn(h, "formatCurrency(getDailyIncomeConverted())")), once, "G8 rendita giornaliera convertita una volta: " + once);
        T.ok(once !== twice, "G8 (controllo: una e due conversioni sarebbero distinguibili)");
        T.eq(nb(runIn(h, "formatStrategyMoney(" + usd + ")")), once, "G8 formatStrategyMoney converte una volta (e formatCurrency NON riconverte)");
        T.eq(nb(runIn(h, "formatCurrency(" + usd + ")")), expFmt("en", "EUR", usd, 2), "G8 formatCurrency formatta soltanto (nessuna conversione implicita)");
    }

    console.log("\n== G2. Regressione post-audit v0.10.1: tasso assente all'apertura delle impostazioni");
    {
        const files = require("./lib/sandbox").ALL_FILES.concat(["settings"]);
        const mkS = (lang, cur, o) => mkBase(lang, cur, Object.assign({ files, extra: "renderDashboard = function(){};" }, o));
        const open = h => { runIn(h, "openSettings(false)"); return h.nodes; };
        const arrive = (h, rate) => runIn(h, "(function(){ fxState.rates = { EUR: " + rate + " }; fxState.dates = { EUR: '2026-10-09' }; fxState.fetchedAt = Date.now(); fxState.validated = true; fxState.lastError = ''; })()");
        const snap = h => JSON.stringify([runIn(h, "player.profile.name"), runIn(h, "player.lands"), runIn(h, "player.goal"), runIn(h, "player.settings"), h.store.aeCompanionData, h.store.aeCurrency, h.store.aeLang]);
        // 1-3. EUR senza tasso all'apertura, tasso valido arriva a pannello aperto, obiettivo modificato -> rifiutato
        let h = mkS("it", "EUR", { fx: false });
        let n = open(h);
        T.eq([n["goal-income-target-input"].value, runIn(h, "Number.isNaN(settingsOpenRate)")], ["", true], "G2a apertura senza tasso EUR: campo obiettivo vuoto, tasso memorizzato NaN");
        arrive(h, 0.8);
        T.eq(runIn(h, "getFxRate('EUR')"), 0.8, "G2b il tasso valido arriva mentre il pannello e' aperto");
        const before = snap(h);
        n["goal-income-target-input"].value = "10";
        n["name-input"].value = "Mario";
        n["common-input"].value = "999";
        n["ab-balance-input"].value = "1";
        h.writes.length = 0;
        runIn(h, "saveSettings()");
        T.eq(runIn(h, "player.goal.incomeTargetUSD"), 5, "G2c obiettivo modificato rifiutato: USD originale invariato (non 12,5 col tasso arrivato dopo)");
        T.eq(snap(h), before, "G2d in caso di rifiuto nessun altro dato del profilo e' alterato (nome, terreni, AB, obiettivo, preferenze)");
        T.eq(h.writes.filter(k => k !== FX_KEY), [], "G2e nessuna scrittura in localStorage (profilo non salvato parzialmente): " + h.writes.join(","));
        T.ok(/non posso convertire/.test(n["currency-note"].textContent), "G2f messaggio di errore previsto mostrato");
        // 4. obiettivo NON modificato: salva gli altri dati, USD originale identico
        h = mkS("it", "EUR", { fx: false });
        n = open(h);
        arrive(h, 0.8);
        n["name-input"].value = "Mario";
        n["common-input"].value = "999";
        runIn(h, "saveSettings()");
        T.eq([runIn(h, "player.goal.incomeTargetUSD"), runIn(h, "player.profile.name"), runIn(h, "player.lands.common")], [5, "Mario", 999], "G2g obiettivo non toccato: salvati gli altri dati, USD originale identico (5)");
        T.ok(JSON.parse(h.store.aeCompanionData).profile.name === "Mario", "G2h il profilo e' stato scritto in localStorage");
        // 5. tasso valido all'apertura, il tasso corrente cambia: inversione con il tasso di apertura
        h = mkS("en", "EUR", { fx: cache({ EUR: 0.8 }) });
        n = open(h);
        arrive(h, 0.9);
        n["goal-income-target-input"].value = "10";
        runIn(h, "saveSettings()");
        T.ok(Math.abs(runIn(h, "player.goal.incomeTargetUSD") - 12.5) < 1e-12, "G2i tasso valido all'apertura (0,8), tasso corrente 0,9: 10 EUR -> 12,5 USD");
        // 5b. tasso valido ma NON aggiornato (cache di 30 h, data vecchia): resta utilizzabile
        h = mkS("en", "EUR", { fx: cache({ EUR: 0.8 }, 30 * H, "2026-10-01") });
        T.eq(runIn(h, "getFxStatus('EUR').state"), "stale", "G2j (controllo) il tasso e' valido ma non aggiornato");
        n = open(h);
        n["goal-income-target-input"].value = "10";
        runIn(h, "saveSettings()");
        T.ok(Math.abs(runIn(h, "player.goal.incomeTargetUSD") - 12.5) < 1e-12, "G2k tasso valido ma non aggiornato all'apertura: obiettivo modificato salvato con quel tasso");
        // 6. USD invariato, anche se un tasso EUR arriva nel frattempo
        h = mkS("en", "USD", { fx: false });
        n = open(h);
        arrive(h, 0.8);
        n["goal-income-target-input"].value = "12.34";
        runIn(h, "saveSettings()");
        T.eq(runIn(h, "player.goal.incomeTargetUSD"), 12.34, "G2l USD: obiettivo modificato salvato senza conversione");
        // 7. tasso di apertura non valido in altre forme (0, negativo, Infinity): rifiutato
        for (const bad of ["0", "-1", "Infinity"]) {
            h = mkS("en", "EUR", { fx: cache({ EUR: 0.8 }) });
            n = open(h);
            runIn(h, "settingsOpenRate = " + bad);
            n["goal-income-target-input"].value = "10";
            runIn(h, "saveSettings()");
            T.eq(runIn(h, "player.goal.incomeTargetUSD"), 5, "G2m tasso di apertura " + bad + ": obiettivo modificato rifiutato");
        }
    }

    console.log("\n== H. Lingua e valuta indipendenti");
    {
        const raw = {};
        for (const lang of ["it", "en"]) for (const cur of ["USD", "EUR", "JPY", "GBP"]) {
            const h = mk(lang, cur, { fx: cache(SIM) });
            raw[lang + cur] = evalIn(h, "[getDailyIncome(), getYearlyIncome(), getSRBView().estimateUSD, player.lands, player.badges, player.goal.incomeTargetUSD, getBoostMultiplier()]");
            const conv = runIn(h, "getDailyIncomeConverted()");
            T.eq(conv, cur === "USD" ? raw[lang + cur][0] : raw[lang + cur][0] * SIM[cur], "H " + lang.toUpperCase() + "/" + cur + ": importo mostrato = USD x tasso (la lingua non cambia il valore)");
        }
        T.eq(["itUSD", "itEUR", "itJPY", "itGBP", "enUSD", "enEUR", "enJPY", "enGBP"].map(k => JSON.stringify(raw[k])).filter((v, i, a) => a.indexOf(v) === i).length, 1, "H dati di gioco (rendita USD, terreni, badge, obiettivo, boost) identici in tutte le 8 combinazioni lingua x valuta");
        const h = mk("it", "JPY", { fx: cache(SIM) });
        runIn(h, "setLanguage('en')");
        T.eq([runIn(h, "getCurrentLanguage()"), runIn(h, "getCurrency()"), h.store.aeLang, h.store.aeCurrency], ["en", "JPY", "en", "JPY"], "H cambio lingua: la valuta resta JPY");
        runIn(h, "setCurrency('GBP')");
        T.eq([runIn(h, "getCurrentLanguage()"), runIn(h, "getCurrency()")], ["en", "GBP"], "H cambio valuta: la lingua resta EN");
        const e = nb(runIn(h, "getCurrencyNoteText()")), eIt = (runIn(h, "setLanguage('it')"), nb(runIn(h, "getCurrencyNoteText()")));
        T.ok(/Exchange|rate|Amounts/i.test(e) && /Importi/.test(eIt) && /0,7421/.test(eIt) && /0\.7421/.test(e), "H la nota cambia lingua e separatore decimale, non il tasso");
    }

    console.log("\n== I. Importi nelle schermate: dashboard, SRB, strategia, obiettivi, assistente, condivisione");
    for (const [lang, cur] of [["it", "EUR"], ["en", "JPY"], ["en", "GBP"], ["it", "USD"]]) {
        const files = require("./lib/sandbox").ALL_FILES.concat(["ui", "settings", "strategy-ui", "explorer-ui", "app"]);
        const h = mk(lang, cur, { files, fx: cache(SIM) });
        const rate = cur === "USD" ? 1 : SIM[cur], d = cur === "JPY" ? 0 : 2, tag = lang.toUpperCase() + "/" + cur;
        const f = (usd, digits) => expFmt(lang, cur, usd * rate, digits === undefined ? d : digits);
        const usdDaily = runIn(h, "getDailyIncome()");
        // dashboard (app.js scrive nei nodi DOM)
        T.eq(nb(h.nodes["dailyIncome"].textContent), f(usdDaily), "I " + tag + " dashboard: rendita giornaliera");
        T.eq(nb(h.nodes["yearlyIncome"].textContent), f(runIn(h, "getYearlyIncome()")), "I " + tag + " dashboard: rendita annua");
        T.ok(nb(h.nodes["dailyIncomeBase"].textContent).endsWith(f(runIn(h, "getBaseDailyIncome()"))), "I " + tag + " dashboard: rendita senza boost");
        const srb = evalIn(h, "getSRBView()");
        T.ok(nb(h.nodes["srb-estimate"].textContent).startsWith(f(srb.estimateUSD)), "I " + tag + " SRB: stima centrale");
        T.eq(nb(runIn(h, "getSRBDisplay().estimate")), f(srb.estimateUSD), "I " + tag + " SRB: getSRBDisplay");
        T.ok(/Frankfurter/.test(h.nodes["currency-estimate-note"].textContent) === (cur !== "USD"), "I " + tag + " dashboard: nota del cambio (fonte) solo se la valuta e' convertita");
        // strategia (obiettivo di rendita: il testo contiene il target convertito)
        const model = runIn(h, "JSON.stringify(getStrategyModel())");
        const base = cur === "JPY" ? 0 : 2, tgt = nb(runIn(h, "formatStrategyMoney(5)"));
        T.eq(tgt, f(5, d), "I " + tag + " strategia: formatStrategyMoney(5 USD)");
        T.ok(nb(model).indexOf(tgt.replace(/"/g, '\\"')) !== -1 || nb(model).indexOf(tgt) !== -1, "I " + tag + " strategia: il modello contiene l'obiettivo convertito " + tgt);
        // obiettivi (consigli)
        const tip = nb(runIn(h, "getIncomeGoalTip(getTotalLands())"));
        T.ok(tip.indexOf(f(5, d)) !== -1, "I " + tag + " obiettivi: il consiglio mostra l'obiettivo convertito " + f(5, d));
        // assistente
        const ans = nb(runIn(h, "getAssistantReply(" + JSON.stringify(lang === "it" ? "quanto guadagno?" : "how much do I earn?") + ")"));
        T.ok(ans.indexOf(f(usdDaily)) !== -1, "I " + tag + " assistente: rendita giornaliera convertita");
        const srbAns = nb(runIn(h, "getAssistantReply(" + JSON.stringify(lang === "it" ? "SRB con 200.000 terreni" : "SRB with 200,000 parcels") + ")"));
        T.eq(/cambio del|rate of/.test(srbAns), cur !== "USD", "I " + tag + " assistente (SRB): avviso di conversione con data del cambio solo se la valuta e' convertita");
        const hyp = nb(runIn(h, "getAssistantReply(" + JSON.stringify(lang === "it" ? "e se avessi 300 terreni?" : "what if I had 300 lands?") + ")"));
        T.ok(hyp.indexOf(f(runIn(h, "computeLandsWhatIf(300)"))) !== -1, "I " + tag + " assistente: what-if convertito una volta");
        // condivisione: la card usa la stessa funzione (nessun importo scritto a mano)
        const src = fs.readFileSync(path.join(root, "js/sharecard.js"), "utf8");
        T.ok(/formatCurrency\(getDailyIncomeConverted\(\)\)/.test(src) && !/toFixed|"\$"|"€"/.test(src.replace(/\/\/.*$/gm, "")), "I " + tag + " condivisione: usa formatCurrency(getDailyIncomeConverted()), nessun simbolo a mano");
        T.eq(nb(runIn(h, "formatCurrency(getDailyIncomeConverted())")), f(usdDaily), "I " + tag + " condivisione: testo della card = importo convertito");
    }
    {   // senza tasso: ogni schermata mostra «—», non importi USD con simbolo di altra valuta
        const files = require("./lib/sandbox").ALL_FILES.concat(["ui", "settings", "strategy-ui", "explorer-ui", "app"]);
        const h = mk("it", "EUR", { files, fx: false });
        const n = h.nodes;
        T.ok(["dailyIncome", "monthlyIncome", "yearlyIncome"].every(k => nb(n[k].textContent) === "—") && /^— \//.test(nb(n["srb-estimate"].textContent)), "I senza tasso: dashboard e SRB mostrano «—»");
        T.ok(/non disponibile/.test(n["currency-estimate-note"].textContent), "I senza tasso: la dashboard dichiara «cambio non disponibile»");
        const m = nb(runIn(h, "JSON.stringify(getStrategyModel())"));
        T.ok(/—\/giorno/.test(m) && !/€|\d[.,]\d{2}\s?(€|EUR)/.test(m), "I senza tasso: la strategia mostra «—/giorno» e nessun importo in euro");
        T.ok(/—/.test(nb(runIn(h, "getIncomeGoalTip(getTotalLands())"))), "I senza tasso: il consiglio obiettivo usa «—»");
    }

    console.log("\n== J. Profilo e preferenze preesistenti conservati");
    {
        const store = { aeLang: "it", aeCurrency: "EUR", aePrefsMigration: "1", aeCountryGroup: "NORDIC", aeActiveTab: "strategy", aeInstallBannerDismissed: "1", aeCompanionData: DATA };
        const snapshot = JSON.stringify(store);
        const f = mkFetch(async () => okResponse(records(SIM)));
        const h = load({ store: Object.assign({}, store), fetch: f, fx: false });
        await runIn(h, "fxInit()");
        const after = Object.assign({}, h.store); delete after[FX_KEY];
        T.eq(JSON.stringify(after), snapshot, "J utente esistente (IT/EUR): dopo avvio e download tutte le chiavi preesistenti sono identiche, aeCompanionData compresa");
        T.ok(FX_KEY in h.store && h.store[FX_KEY] !== undefined, "J l'unica chiave nuova e' " + FX_KEY);
        T.ok(runIn(h, "getCurrency()") === "EUR" && runIn(h, "getCurrentLanguage()") === "it", "J lingua e valuta salvate invariate");
        // utente con valuta salvata nuova (JPY): la migrazione NON la sovrascrive
        const h2 = load({ store: { aeLang: "en", aeCurrency: "JPY", aePrefsMigration: "1", aeCompanionData: DATA }, fx: cache(SIM) });
        T.eq(runIn(h2, "getCurrency()"), "JPY", "J valuta salvata JPY riconosciuta (non riportata a USD)");
        // utente v0.9.5 senza cache fx e senza rete: valuta EUR mantenuta (ma importi «—» fino al primo download)
        const h3 = load({ store: Object.assign({}, store), fx: false, fetch: mkFetch(async () => { throw new TypeError("offline"); }) });
        await runIn(h3, "fxInit()");
        T.eq([runIn(h3, "getCurrency()"), runIn(h3, "formatCurrency(convertToDisplay(1))")], ["EUR", "—"], "J utente EUR senza rete e senza cache: preferenza conservata, importi «—» (non 0,86)");
        T.eq(h3.store.aeCompanionData, DATA, "J il profilo non viene riscritto");
        // migrazione dei nuovi utenti invariata
        const h4 = load({ store: {}, navLang: "it-IT", fx: false });
        T.eq([runIn(h4, "getCurrentLanguage()"), runIn(h4, "getCurrency()")], ["en", "USD"], "J nuovo utente: inglese + USD (invariato)");
    }

    console.log("\n== L. v0.10.2: date dei tassi (oggi, passato, limite, futuro)");
    {   // orologio simulato: 2026-10-09T10:00Z => oggi = 2026-10-09 (UTC). Tolleranza futura = 1 giorno (CONFIG.fx.futureToleranceDays)
        const one = async (date, extra, cur) => {
            const h = mk("en", cur || "EUR", { fetch: mkFetch(async () => okResponse([{ date, base: "USD", quote: cur || "EUR", rate: 0.9 }])), fx: false, extra });
            await runIn(h, "fxRefresh(true)");
            return h;
        };
        const st = (h, c) => runIn(h, "getFxStatus('" + (c || "EUR") + "').state");
        let h = await one("2026-10-09");
        T.eq([st(h), runIn(h, "getFxStatus('EUR').date")], ["ok", "2026-10-09"], "L1 data = oggi: tasso 'ok'");
        T.eq(st(await one("2026-10-08")), "ok", "L2 ieri: ok");
        T.eq(st(await one("2026-10-02")), "ok", "L3 7 giorni fa (limite incluso): ok");
        T.eq(st(await one("2026-10-01")), "stale", "L4 8 giorni fa (oltre il limite): 'non aggiornato'");
        h = await one("2026-10-10");
        T.eq([st(h), runIn(h, "getFxRate('EUR')")], ["provisional", 0.9], "L5 data futura di 1 giorno (entro la tolleranza): tasso usato ma PROVVISORIO, non 'ok' (aspettativa v0.10.2 'ok' cambiata per l'audit v0.10.3)");
        h = await one("2026-10-10", "CONFIG.fx.futureToleranceDays = 0;");
        T.eq([st(h), runIn(h, "formatCurrency(convertToDisplay(10))"), runIn(h, "fxState.lastError"), FX_KEY in h.store], ["unavailable", "—", "future", false], "L6 stessa data con tolleranza 0: scartata, importi «—», nessuna cache scritta");
        for (const d of ["2026-10-11", "2026-10-20", "2027-01-01"]) {
            h = await one(d);
            T.eq([st(h), runIn(h, "getFxStatus('EUR').futureDate"), runIn(h, "formatCurrency(convertToDisplay(10))"), FX_KEY in h.store], ["unavailable", d, "—", false], "L7 data futura di piu' giorni (" + d + "): scartata, mai 'ok', nessun ripiego");
        }
        T.ok(/data nel futuro/.test(runIn(h, "(setLanguage('it'), getCurrencyNoteText())")) && /in the future/.test(runIn(h, "(setLanguage('en'), getCurrencyNoteText())")), "L7b messaggio esplicito «data nel futuro» in IT e EN");
        T.eq(runIn(h, "fxState.lastError"), "future", "L7c errore registrato come 'future' (pausa di 60 s applicata)");
        // confine del giorno: 23:59:59 UTC e mezzanotte
        const edge = (iso, date) => mk("en", "EUR", { now: Date.parse(iso), fx: { rates: { EUR: 0.8 }, dates: { EUR: date }, fetchedAt: Date.parse(iso) } });
        T.eq([st(edge("2026-10-09T23:59:59Z", "2026-10-10")), st(edge("2026-10-09T23:59:59Z", "2026-10-11"))], ["provisional", "unavailable"], "L8 23:59:59 UTC: +1 giorno provvisorio (era 'ok' in v0.10.2), +2 scartato");
        T.eq([st(edge("2026-10-10T00:00:00Z", "2026-10-10")), st(edge("2026-10-10T00:00:00Z", "2026-10-09"))], ["ok", "ok"], "L9 dopo mezzanotte UTC la stessa data e' 'oggi' e la precedente 'ieri'");
        // cache con data futura (orologio spostato indietro): non usata
        h = mk("en", "EUR", { fx: cache({ EUR: 0.8 }, 1 * H, "2026-10-20") });
        T.eq([st(h), runIn(h, "formatCurrency(convertToDisplay(1))")], ["unavailable", "—"], "L10 cache con data futura non giustificata: ignorata, «—»");
    }
    {   // risposta mista: valute valide + un record futuro anomalo
        const mixed = [{ date: "2026-10-09", base: "USD", quote: "JPY", rate: 150 }, { date: "2026-10-08", base: "USD", quote: "GBP", rate: 0.74 },
            { date: "2026-10-20", base: "USD", quote: "EUR", rate: 0.01 }, { date: "2026-10-09", base: "USD", quote: "USD", rate: 1 }];
        const f = mkFetch(async () => okResponse(mixed));
        let h = mk("en", "EUR", { fetch: f, fx: false });
        await runIn(h, "fxRefresh(true)");
        T.eq([runIn(h, "getFxStatus('JPY').state"), runIn(h, "getFxStatus('GBP').state"), runIn(h, "getFxStatus('EUR').state")], ["ok", "ok", "unavailable"], "L11 risposta mista: JPY e GBP restano utilizzabili, solo EUR e' scartato");
        const saved = JSON.parse(h.store[FX_KEY]);
        T.ok(saved.rates.JPY === 150 && saved.rates.GBP === 0.74 && !("EUR" in saved.rates) && !JSON.stringify(saved).includes("0.01"), "L11b la cache contiene i record validi e NON quello anomalo");
        T.eq(runIn(h, "formatCurrency(convertToDisplay(10))"), "—", "L11c EUR selezionata senza tasso utilizzabile: «—» (mai 0,86, mai 0,01)");
        T.eq(runIn(h, "(setCurrency('JPY'), getFxRate('JPY'))"), 150, "L11d cambiando in JPY l'app funziona");
        // cache precedente valida durante una risposta anomala (scaduta): tasso vecchio conservato, segnalato non aggiornato
        h = mk("it", "EUR", { fetch: mkFetch(async () => okResponse(mixed)), fx: cache({ EUR: 0.8 }, 13 * H, "2026-10-08") });
        await runIn(h, "fxRefresh(true)");
        T.eq([runIn(h, "getFxStatus('EUR').state"), runIn(h, "getFxRate('EUR')"), runIn(h, "getFxStatus('EUR').date")], ["stale", 0.8, "2026-10-08"], "L12 cache precedente valida + record EUR anomalo: tasso 0,8 conservato, 'non aggiornato'");
        T.ok(/NON aggiornato/.test(runIn(h, "getCurrencyNoteText()")) && nb(runIn(h, "formatCurrency(convertToDisplay(10))")) === "8,00 €", "L12b avviso 'non aggiornato' e importi con l'ultimo tasso valido");
        T.eq([runIn(h, "getFxRate('JPY')"), JSON.parse(h.store[FX_KEY]).held], [150, ["EUR"]], "L12c le altre valute si aggiornano; il tasso conservato e' marcato (held) anche nella cache");
        // cache ancora fresca (2 h): non si scarica nulla, quindi nessuna risposta anomala puo' alterarla
        { const fq = mkFetch(async () => okResponse(mixed));
          h = mk("it", "EUR", { fetch: fq, fx: cache({ EUR: 0.8 }, 2 * H, "2026-10-08") });
          await runIn(h, "fxRefresh(true)");
          T.eq([fq.calls.length, runIn(h, "getFxStatus('EUR').state")], [0, "ok"], "L12d cache fresca (2 h): nessuna richiesta, tasso invariato e 'ok'"); }
        // pausa, poi risposta corretta: il tasso torna 'ok' e la marcatura sparisce
        const fm = mkFetch(async () => okResponse(fm.calls.length < 2 ? mixed : records({ EUR: 0.85 })));
        h = mk("it", "EUR", { fetch: fm, fx: cache({ EUR: 0.8 }, 13 * H, "2026-10-08") });
        await runIn(h, "fxRefresh(false)"); await runIn(h, "fxRefresh(false)");
        T.eq(fm.calls.length, 1, "L12e dopo la risposta anomala non si riprova subito (pausa 60 s)");
        await runIn(h, "fxRefresh(true)");
        T.eq([runIn(h, "getFxStatus('EUR').state"), runIn(h, "getFxRate('EUR')"), JSON.parse(h.store[FX_KEY]).held], ["ok", 0.85, []], "L12f risposta corretta al tentativo successivo: tasso nuovo 'ok', marcatura rimossa");
        // tutte le date future: risposta intera non utilizzabile, cache intatta
        const allFuture = [{ date: "2026-12-01", base: "USD", quote: "EUR", rate: 0.5 }, { date: "2026-12-01", base: "USD", quote: "JPY", rate: 1 }];
        h = mk("en", "EUR", { fetch: mkFetch(async () => okResponse(allFuture)), fx: cache({ EUR: 0.8 }, 13 * H, "2026-10-08") });
        const before = h.store[FX_KEY];
        await runIn(h, "fxRefresh(true)");
        T.eq([h.store[FX_KEY] === before, runIn(h, "getFxStatus('EUR').state"), runIn(h, "getFxRate('EUR')")], [true, "stale", 0.8], "L13 tutte le date future + cache valida: cache intatta, 0,8 'non aggiornato'");
        h = mk("en", "EUR", { fetch: mkFetch(async () => okResponse(allFuture)), fx: false });
        await runIn(h, "fxRefresh(true)");
        T.eq([runIn(h, "getFxStatus('EUR').state"), runIn(h, "formatCurrency(convertToDisplay(10))"), FX_KEY in h.store], ["unavailable", "—", false], "L14 tutte le date future senza cache: «—», nessuna cache, nessun 0,86");
    }
    {   // risposta REALE osservata il 2026-10-24 (web_fetch di https://api.frankfurter.dev/v2/rates?base=USD), sottoinsieme fedele
        const real = [["AED", "25", 3.6725], ["AUD", "25", 1.4254], ["BHD", "23", 0.376], ["CAD", "25", 1.4011], ["CHF", "25", 0.82269], ["EUR", "25", 0.89113],
            ["GBP", "25", 0.74683], ["ILS", "24", 3.1087], ["JPY", "25", 157.13], ["KWD", "25", 0.3089], ["MXN", "24", 18.7416], ["USD", "25", 1.0]]
            .map(([q, d, r]) => ({ date: "2026-10-" + d, base: "USD", quote: q, rate: r }));
        const now = Date.parse("2026-10-24T17:46:00Z");
        let h = mk("en", "EUR", { now, fx: false, fetch: mkFetch(async () => okResponse(real)) });
        await runIn(h, "fxRefresh(true)");
        T.eq(["EUR", "JPY", "GBP", "CAD", "AUD", "CHF", "KWD", "BHD", "ILS", "MXN"].map(c => runIn(h, "getFxStatus('" + c + "').state")), ["provisional", "provisional", "provisional", "provisional", "provisional", "provisional", "provisional", "ok", "ok", "ok"], "L15 dati reali (oggi 24/10): le valute datate 25/10 sono utilizzabili ma PROVVISORIE (in v0.10.2 'ok'), quelle del 23-24/10 'ok'");
        T.eq(["EUR", "JPY", "BHD"].map(c => runIn(h, "getFxRate('" + c + "')")), [0.89113, 157.13, 0.376], "L15c tutte le valute restano convertibili con il tasso della fonte (data non riscritta)");
        T.eq(runIn(h, "getFxStatus('EUR').date"), "2026-10-25", "L15b la data mostrata e' quella dichiarata dalla fonte");
        h = mk("en", "EUR", { now, fx: false, fetch: mkFetch(async () => okResponse(real)), extra: "CONFIG.fx.futureToleranceDays = 0;" });
        await runIn(h, "fxRefresh(true)");
        T.eq([runIn(h, "getFxStatus('EUR').state"), runIn(h, "getFxStatus('JPY').state"), runIn(h, "getFxStatus('BHD').state"), runIn(h, "getFxStatus('ILS').state")], ["unavailable", "unavailable", "ok", "ok"], "L16 stessi dati reali con tolleranza 0: EUR/JPY (datate 25/10) scartate, BHD/ILS (23-24/10) usabili: dimostra l'effetto della regola");
    }

    console.log("\n== M. v0.10.3: calendario rigoroso delle date e tasso provvisorio (data futura entro tolleranza)");
    {
        const h = mk("en", "USD");
        const D = d => evalIn(h, "fxIsDate(" + JSON.stringify(d) + ")");
        const valid = ["2026-02-28", "2024-02-29", "2000-02-29", "2026-12-31", "2026-04-30", "2026-01-01"];
        const invalid = ["2026-02-29", "2026-02-30", "2026-02-31", "2026-04-31", "2026-13-01", "2026-00-10", "2026-01-00", "2026-01-32", "1900-02-29", "2026-06-31", "2026-11-31",
            "", " ", "2026-1-5", "26-01-05", "2026/01/05", "05-01-2026", "2026-01-05T10:00:00Z", "2026-01-05 ", " 2026-01-05", "oggi", "20260105", "2026-01-5"];
        valid.forEach(d => T.eq(D(d), true, "M1 data valida: " + d));
        invalid.forEach(d => T.eq(D(d), false, "M1 data NON valida: " + JSON.stringify(d)));
        T.eq([D(null), D(undefined), D(20260105), D({}), D([])], [false, false, false, false, false], "M1 valori non stringa non validi");
        T.eq(runIn(h, "new Date('2026-02-30T00:00:00Z').toISOString().slice(0,10)"), "2026-03-02", "M1 (controllo) JavaScript normalizzerebbe 2026-02-30 in 2026-03-02: per questo serve la verifica rigorosa");
        // risposta mista con data impossibile
        const mixed = [{ date: "2026-10-09", base: "USD", quote: "JPY", rate: 150 }, { date: "2026-10-08", base: "USD", quote: "GBP", rate: 0.74 },
            { date: "2026-02-30", base: "USD", quote: "EUR", rate: 0.01 }, { date: "2026-10-09", base: "USD", quote: "CAD", rate: 1.4 }];
        let g = mk("it", "EUR", { fetch: mkFetch(async () => okResponse(mixed)), fx: false });
        await runIn(g, "fxRefresh(true)");
        const saved = JSON.parse(g.store[FX_KEY]);
        T.ok(!("EUR" in saved.rates) && !("EUR" in saved.dates) && !g.store[FX_KEY].includes("2026-02-30") && !g.store[FX_KEY].includes("0.01"), "M2 la data impossibile NON entra nella cache");
        T.eq([runIn(g, "getFxStatus('JPY').state"), runIn(g, "getFxStatus('GBP').state"), runIn(g, "getFxStatus('CAD').state"), runIn(g, "getFxStatus('EUR').state")], ["ok", "ok", "ok", "unavailable"], "M2b gli altri record validi funzionano; EUR non disponibile (non 'valuta non supportata')");
        T.eq([runIn(g, "formatCurrency(convertToDisplay(10))"), runIn(g, "fxState.lastError")], ["—", "malformed"], "M2c EUR senza tasso utilizzabile: «—», mai 0,86 ne' 0,01");
        // con cache precedente valida: conservata e segnalata non aggiornata
        g = mk("it", "EUR", { fetch: mkFetch(async () => okResponse(mixed)), fx: cache({ EUR: 0.8 }, 13 * H, "2026-10-08") });
        await runIn(g, "fxRefresh(true)");
        T.eq([runIn(g, "getFxStatus('EUR').state"), runIn(g, "getFxRate('EUR')"), runIn(g, "getFxRate('JPY')")], ["stale", 0.8, 150], "M2d data impossibile + cache precedente valida: 0,8 conservato 'non aggiornato', JPY aggiornato");
        // data impossibile in cache: ignorata
        g = mkBase("en", "EUR", { store: { aeLang: "en", aeCurrency: "EUR", aePrefsMigration: "1", [FX_KEY]: JSON.stringify({ v: 1, base: "USD", source: "Frankfurter", fetchedAt: FIXED, rates: { EUR: 0.8 }, dates: { EUR: "2026-02-30" } }) }, fx: false });
        T.eq(runIn(g, "getFxStatus('EUR').state"), "unavailable", "M2e cache con data impossibile: ignorata");
    }
    {   // tasso con data futura entro la tolleranza: PROVVISORIO
        const rec = (date, rate) => [{ date, base: "USD", quote: "EUR", rate: rate || 0.9 }, { date: "2026-10-09", base: "USD", quote: "JPY", rate: 150 }];
        const files = require("./lib/sandbox").ALL_FILES.concat(["ui", "settings", "strategy-ui", "explorer-ui", "app"]);
        let h = mk("it", "EUR", { fetch: mkFetch(async () => okResponse(rec("2026-10-10"))), fx: false, files });
        await runIn(h, "fxRefresh(true)");
        const info = evalIn(h, "getExchangeRateInfo()");
        T.eq([info.state, info.isProvisional, info.isLive, info.date, info.rate], ["provisional", true, false, "2026-10-10", 0.9], "M3 domani entro tolleranza: stato 'provisional', non 'live', data della fonte NON riscritta (2026-10-10)");
        T.eq(runIn(h, "getFxStatus('JPY').state"), "ok", "M3b una valuta con data odierna nella stessa risposta resta 'ok'");
        const note = nb(runIn(h, "getCurrencyNoteText()"));
        T.ok(/PROVVISORIO/.test(note) && /10 ott/.test(note) && /nel futuro/.test(note) && !/Cambio NON aggiornato/.test(note), "M3c avviso visibile in italiano con la data futura: " + note);
        T.ok(/PROVVISORIO/.test(nb(h.nodes["currency-estimate-note"].textContent)), "M3d l'avviso e' mostrato nella dashboard");
        T.ok(nb(runIn(h, "formatCurrency(convertToDisplay(10))")) === "9,00 €", "M3e gli importi restano convertiti con il tasso della fonte (9,00 €)");
        T.ok(/PROVVISORIO/.test(runIn(h, "getAssistantReply('quanto guadagno?')")) && /PROVVISORIO/.test(runIn(h, "getAssistantReply('srb')")), "M3f l'assistente avvisa su ogni risposta con importi");
        runIn(h, "setLanguage('en')");
        T.ok(/PROVISIONAL/.test(runIn(h, "getCurrencyNoteText()")) && /in the future/.test(runIn(h, "getCurrencyNoteText()")) && /PROVISIONAL/.test(h.nodes["currency-estimate-note"].textContent) && /PROVISIONAL/.test(runIn(h, "getAssistantReply('how much do I earn?')")), "M3g avviso in inglese (nota, dashboard, assistente)");
        // la marcatura sopravvive a cache e ricaricamento
        const reload = (store, now) => load({ store: Object.assign({}, store), now: now, fx: false, files });
        let r = reload(h.store);
        T.eq([runIn(r, "getFxStatus('EUR').state"), runIn(r, "getFxStatus('EUR').date"), runIn(r, "getFxRate('EUR')")], ["provisional", "2026-10-10", 0.9], "M4 dopo ricaricamento (cache): ancora 'provisional', stessa data e tasso");
        T.eq(JSON.parse(r.store[FX_KEY]).dates.EUR, "2026-10-10", "M4b la data nella cache e' quella della fonte, non riscritta");
        // ritorno a una data valida: il giorno dopo la stessa data e' "oggi" -> ok (cache ancora valida < 12 h)
        const next = reload(h.store, FIXED + 4 * H);   // 14:00 dello stesso giorno: ancora provvisorio
        T.eq(runIn(next, "getFxStatus('EUR').state"), "provisional", "M5 stesso giorno, cache valida: ancora provvisorio");
        const tomorrow = reload(Object.assign({}, h.store, { [FX_KEY]: JSON.stringify(Object.assign(JSON.parse(h.store[FX_KEY]), { fetchedAt: Date.parse("2026-10-10T08:00:00Z") })) }), Date.parse("2026-10-10T10:00:00Z"));
        T.eq([runIn(tomorrow, "getFxStatus('EUR').state"), runIn(tomorrow, "getFxStatus('EUR').date")], ["ok", "2026-10-10"], "M5b il giorno dopo la data coincide con oggi: torna 'ok' da sola, data invariata");
        T.ok(!/PROVVISORIO|PROVISIONAL/.test(runIn(tomorrow, "getCurrencyNoteText()")), "M5c e l'avviso di provvisorio sparisce");
        // aggiornamento riuscito con data valida: ok
        const f2 = mkFetch(async () => okResponse(rec("2026-10-09", 0.91)));
        h = mk("it", "EUR", { fetch: f2, fx: cache({ EUR: 0.9 }, 13 * H, "2026-10-10") });
        T.eq(runIn(h, "getFxStatus('EUR').state"), "stale", "M6 (controllo) cache scaduta con data futura: prevale 'non aggiornato'");
        await runIn(h, "fxRefresh(true)");
        T.eq([runIn(h, "getFxStatus('EUR').state"), runIn(h, "getFxRate('EUR')"), runIn(h, "getFxStatus('EUR').date")], ["ok", 0.91, "2026-10-09"], "M6b aggiornamento riuscito con data valida: 'ok'");
        // stesso provvisorio, poi risposta con data valida
        const f3 = mkFetch(async () => okResponse(f3.calls.length === 1 ? rec("2026-10-10", 0.9) : rec("2026-10-09", 0.92)));
        h = mk("en", "EUR", { fetch: f3, fx: false });
        await runIn(h, "fxRefresh(true)");
        T.eq(runIn(h, "getFxStatus('EUR').state"), "provisional", "M7 prima risposta: provvisorio");
        runIn(h, "fxState.fetchedAt = Date.now() - 13 * 3600 * 1000");
        await runIn(h, "fxRefresh(true)");
        T.eq([runIn(h, "getFxStatus('EUR').state"), runIn(h, "getFxRate('EUR')")], ["ok", 0.92], "M7b risposta successiva con data valida: 'ok' (marcatura rimossa)");
        // cambio valuta: ogni valuta ha il proprio stato
        h = mk("en", "EUR", { fetch: mkFetch(async () => okResponse(rec("2026-10-10"))), fx: false });
        await runIn(h, "fxRefresh(true)");
        runIn(h, "setCurrency('JPY')");
        T.eq([runIn(h, "getFxStatus('JPY').state"), runIn(h, "getCurrencyNoteText()").indexOf("PROVISIONAL") === -1], ["ok", true], "M8 passando a JPY (data odierna): 'ok', nessun avviso di provvisorio");
        runIn(h, "setCurrency('EUR')");
        T.eq([runIn(h, "getFxStatus('EUR').state"), /PROVISIONAL/.test(runIn(h, "getCurrencyNoteText()"))], ["provisional", true], "M8b tornando a EUR: di nuovo provvisorio con avviso");
        runIn(h, "setCurrency('USD')");
        T.eq([runIn(h, "getCurrencyNoteText()"), runIn(h, "convertToDisplay(7)")], ["", 7], "M8c USD invariato (nessuna nota, nessuna conversione)");
        // tolleranza 0 e oltre tolleranza: comportamento invariato (scarto)
        h = mk("en", "EUR", { fetch: mkFetch(async () => okResponse(rec("2026-10-10"))), fx: false, extra: "CONFIG.fx.futureToleranceDays = 0;" });
        await runIn(h, "fxRefresh(true)");
        T.eq([runIn(h, "getFxStatus('EUR').state"), runIn(h, "formatCurrency(convertToDisplay(10))")], ["unavailable", "—"], "M9 tolleranza 0: scarto come in v0.10.2");
        h = mk("en", "EUR", { fetch: mkFetch(async () => okResponse(rec("2026-10-11"))), fx: cache({ EUR: 0.8 }, 13 * H, "2026-10-08") });
        await runIn(h, "fxRefresh(true)");
        T.eq([runIn(h, "getFxStatus('EUR').state"), runIn(h, "getFxRate('EUR')")], ["stale", 0.8], "M9b oltre tolleranza con cache valida: 0,8 'non aggiornato' (invariato)");
        // un tasso provvisorio gia' in cache non blocca l'inversione dell'obiettivo (settings): usa il tasso mostrato
        const fs2 = require("./lib/sandbox").ALL_FILES.concat(["settings"]);
        h = mk("en", "EUR", { files: fs2, extra: "renderDashboard = function(){};", fx: { rates: { EUR: 0.8 }, dates: { EUR: "2026-10-10" } } });
        T.eq(runIn(h, "getFxStatus('EUR').state"), "provisional", "M10 (controllo) cache con tasso provvisorio");
        runIn(h, "openSettings(false)");
        h.nodes["goal-income-target-input"].value = "10";
        runIn(h, "saveSettings()");
        T.ok(Math.abs(runIn(h, "player.goal.incomeTargetUSD") - 12.5) < 1e-12, "M10b tasso provvisorio valido all'apertura: obiettivo convertito con quel tasso (correzione v0.10.1 intatta)");
    }

    console.log("\n== N. v0.10.4: persistenza dei record rifiutati e stato 'non aggiornato' durante il caricamento");
    const tick = () => new Promise(r => setImmediate(r));
    const deferred = () => { let ok, ko; const p = new Promise((a, b) => { ok = a; ko = b; }); const f = async () => { f.calls.push(1); return p; }; f.calls = []; f.resolve = v => ok(okResponse(v)); f.reject = e => ko(e); return f; };
    const reloadOffline = (store, files) => load({ store: Object.assign({}, store), fx: false, files, fetch: mkFetch(async () => { throw new TypeError("offline"); }) });
    {
        // 1-2. risposta mista: EUR futuro oltre tolleranza, JPY valido -> ricaricamento senza rete
        const mixed = [{ date: "2026-10-20", base: "USD", quote: "EUR", rate: 0.01 }, { date: "2026-10-09", base: "USD", quote: "JPY", rate: 150 }, { date: "2026-10-09", base: "USD", quote: "CAD", rate: 1.4 }];
        let h = mk("it", "EUR", { fetch: mkFetch(async () => okResponse(mixed)), fx: false });
        await runIn(h, "fxRefresh(true)");
        const saved = JSON.parse(h.store[FX_KEY]);
        T.ok(saved.future && saved.future.EUR === "2026-10-20" && !("EUR" in saved.rates) && !h.store[FX_KEY].includes("0.01"), "N1 la cache salva il rifiuto (future.EUR) ma NON il tasso anomalo");
        let r = reloadOffline(h.store);
        T.eq([runIn(r, "getFxStatus('EUR').state"), runIn(r, "getFxStatus('EUR').futureDate")], ["unavailable", "2026-10-20"], "N2 dopo ricaricamento (prima di ogni rete): EUR 'unavailable' con la data futura, NON 'unsupported'");
        await runIn(r, "fxInit()");
        T.eq([runIn(r, "getFxStatus('EUR').state"), runIn(r, "getFxStatus('EUR').futureDate"), runIn(r, "formatCurrency(convertToDisplay(10))")], ["unavailable", "2026-10-20", "—"], "N2b dopo ricaricamento e tentativo di rete fallito: ancora 'unavailable' + data futura, importo «—»");
        T.ok(/data nel futuro/.test(runIn(r, "getCurrencyNoteText()")), "N2c motivazione appropriata nella nota: " + runIn(r, "getCurrencyNoteText()"));
        T.eq([runIn(r, "getFxStatus('JPY').state"), runIn(r, "getFxRate('JPY')"), runIn(r, "getFxStatus('CAD').state")], ["ok", 150, "ok"], "N2d gli altri tassi validi continuano a funzionare dopo il ricaricamento");
        T.eq(runIn(r, "getFxStatus('GBP').state"), "unsupported", "N2e (contrasto) una valuta assente dalla risposta resta 'unsupported'");
        // 3. stesso scenario con data impossibile
        const bad = [{ date: "2026-02-30", base: "USD", quote: "EUR", rate: 0.01 }, { date: "2026-10-09", base: "USD", quote: "JPY", rate: 150 }];
        h = mk("it", "EUR", { fetch: mkFetch(async () => okResponse(bad)), fx: false });
        await runIn(h, "fxRefresh(true)");
        const sb = JSON.parse(h.store[FX_KEY]);
        T.ok(Array.isArray(sb.invalid) && sb.invalid.join() === "EUR" && !("EUR" in sb.rates) && !h.store[FX_KEY].includes("2026-02-30") && !h.store[FX_KEY].includes("0.01"), "N3 data impossibile: nella cache solo il codice in 'invalid', mai la data ne' il tasso");
        r = reloadOffline(h.store);
        await runIn(r, "fxInit()");
        T.eq([runIn(r, "getFxStatus('EUR').state"), runIn(r, "getFxStatus('EUR').futureDate"), runIn(r, "formatCurrency(convertToDisplay(10))"), runIn(r, "getFxRate('JPY')")], ["unavailable", null, "—", 150], "N3b dopo ricaricamento senza rete: EUR 'unavailable' (non 'unsupported', mai usato), JPY funziona");
        // 4. cache precedente valida per EUR: usabile ma stale, anche dopo il ricaricamento
        h = mk("it", "EUR", { fetch: mkFetch(async () => okResponse(mixed)), fx: cache({ EUR: 0.8 }, 13 * H, "2026-10-08") });
        await runIn(h, "fxRefresh(true)");
        const s4 = JSON.parse(h.store[FX_KEY]);
        T.ok(s4.rates.EUR === 0.8 && (s4.held || []).join() === "EUR" && (s4.future || {}).EUR === "2026-10-20", "N4 cache: tasso 0,8 conservato, 'held' e rifiuto registrati");
        r = reloadOffline(h.store);
        await runIn(r, "fxInit()");
        T.eq([runIn(r, "getFxStatus('EUR').state"), runIn(r, "getFxRate('EUR')"), nb(runIn(r, "formatCurrency(convertToDisplay(10))")), runIn(r, "getFxRate('JPY')")], ["stale", 0.8, "8,00 €", 150], "N4b dopo ricaricamento senza rete: EUR utilizzabile ma 'stale' (0,8), JPY ok");
        T.ok(/NON aggiornato/.test(runIn(r, "getCurrencyNoteText()")), "N4c avviso 'non aggiornato' mostrato");
    }
    {   // 5. cache con campi di stato malformati o mancanti
        const mkCache = extra => ({ aeLang: "en", aeCurrency: "EUR", aePrefsMigration: "1", [FX_KEY]: JSON.stringify(Object.assign({ v: 1, base: "USD", source: "Frankfurter", fetchedAt: FIXED, rates: { EUR: 0.8, JPY: 150 }, dates: { EUR: SIM_DATE, JPY: SIM_DATE } }, extra)) });
        const L = (extra, o) => mkBase("en", "EUR", Object.assign({ store: mkCache(extra), fx: false }, o));
        const stt = (h, c) => runIn(h, "getFxStatus('" + c + "').state");
        let h = L({});
        T.eq([stt(h, "EUR"), stt(h, "JPY"), runIn(h, "fxState.future"), runIn(h, "fxState.invalid")], ["ok", "ok", {}, {}], "N5a cache senza i campi nuovi (formato v0.10.0-v0.10.3): accettata, nessun rifiuto");
        for (const [label, extra] of [["future stringa", { future: "EUR" }], ["future array", { future: ["EUR"] }], ["future numero", { future: 5 }], ["future null", { future: null }],
            ["invalid oggetto", { invalid: { EUR: true } }], ["invalid stringa", { invalid: "EUR" }], ["invalid numero", { invalid: 3 }], ["held stringa", { held: "EUR" }], ["held oggetto", { held: { EUR: true } }]]) {
            h = L(extra);
            T.eq([stt(h, "EUR"), stt(h, "JPY"), runIn(h, "getFxRate('EUR')"), runIn(h, "getFxRate('JPY')")], ["ok", "ok", 0.8, 150], "N5b campo malformato (" + label + "): ignorato, tassi validi invariati");
        }
        // voci non valide dentro campi ben formati: ignorate, mai trasformate in tassi
        h = L({ future: { EUR: "2026-10-20", XXX: "2026-10-20", JPY: "2026-10-30", GBP: "2026-02-30", CAD: "oggi", USD: "2026-10-20", __proto__: "2026-10-20", constructor: "2026-10-20" }, invalid: ["EUR", "XXX", 7, null, "USD", "__proto__", "AUD"] });
        T.eq([stt(h, "EUR"), stt(h, "JPY")], ["ok", "ok"], "N5c rifiuti riferiti a valute che hanno un tasso valido: ignorati (il tasso validato prevale)");
        T.eq([runIn(h, "Object.keys(fxState.future)"), runIn(h, "Object.keys(fxState.invalid)")], [[], ["AUD"]], "N5d solo voci valide e supportate restano: future vuoto (date impossibili/non ISO scartate), invalid = AUD");
        T.eq([stt(h, "GBP"), stt(h, "CAD"), stt(h, "AUD")], ["unsupported", "unsupported", "unavailable"], "N5e GBP/CAD (voci scartate) 'unsupported'; AUD ('invalid' valido) 'unavailable'; nessuno ha un tasso");
        T.eq(["GBP", "CAD", "AUD", "XXX"].map(c => runIn(h, "getFxRate('" + c + "')")), [null, null, null, null], "N5f nessun tasso utilizzabile creato da dati di stato");
        // tassi o date non validi dentro rates/dates restano esclusi
        h = L({ rates: { EUR: "0.8", JPY: 150, GBP: -1, CAD: 0, AUD: null, CHF: 0.8, XXX: 3 }, dates: { EUR: SIM_DATE, JPY: "2026-02-30", GBP: SIM_DATE, CAD: SIM_DATE, AUD: SIM_DATE, CHF: "2026-10-20", XXX: SIM_DATE } });
        T.eq(["EUR", "JPY", "GBP", "CAD", "AUD"].map(c => runIn(h, "getFxRate('" + c + "')")), [null, null, null, null, null], "N5g tassi stringa/negativi/zero/null o con data impossibile: mai accettati");
        T.eq([stt(h, "CHF"), runIn(h, "getFxStatus('CHF').futureDate")], ["unavailable", "2026-10-20"], "N5h tasso con data futura oltre tolleranza in cache: 'unavailable', identificato come futuro");
        // persistenza completa: un 'future' valido sopravvive al ciclo salva/ricarica senza alterazioni
        h = L({ future: { GBP: "2026-10-20" }, invalid: ["AUD"] });
        T.eq([stt(h, "GBP"), runIn(h, "getFxStatus('GBP').futureDate"), stt(h, "AUD")], ["unavailable", "2026-10-20", "unavailable"], "N5i future/invalid validi caricati correttamente");
    }
    {   // 6-8. stato 'stale' prima, durante e dopo la richiesta
        const start = async (cacheAge, held) => {
            const f = deferred();
            const h = mk("it", "EUR", { fetch: f, fx: Object.assign(cache({ EUR: 0.8 }, cacheAge, "2026-10-08")) });
            if (held) runIn(h, "fxState.held = { EUR: true }");
            return { f, h };
        };
        // 6. cache scaduta: stale prima e durante
        let { f, h } = await start(13 * H);
        const info = () => [runIn(h, "getFxStatus('EUR').state"), runIn(h, "getFxStatus('EUR').refreshing"), runIn(h, "getFxRate('EUR')")];
        T.eq(info(), ["stale", false, 0.8], "N6 cache scaduta, nessuna richiesta: stale");
        const p = runIn(h, "fxRefresh(true)");
        await tick();
        T.eq([f.calls.length, runIn(h, "fxState.loading")], [1, true], "N6b la richiesta e' in sospeso");
        T.eq(info(), ["stale", true, 0.8], "N6c DURANTE la richiesta: ancora stale (con indicatore 'refreshing' a parte), tasso invariato");
        T.ok(/NON aggiornato/.test(runIn(h, "getCurrencyNoteText()")), "N6d l'avviso 'non aggiornato' resta durante il caricamento");
        f.resolve(records({ EUR: 0.85 }, "2026-10-09"));
        await p;
        T.eq([runIn(h, "getFxStatus('EUR').state"), runIn(h, "getFxStatus('EUR').refreshing"), runIn(h, "getFxRate('EUR')")], ["ok", false, 0.85], "N8 richiesta riuscita con tasso valido: 'ok' col nuovo tasso (0,85)");
        // 7. richiesta fallita: resta stale
        ({ f, h } = await start(13 * H));
        const p2 = runIn(h, "fxRefresh(true)");
        await tick();
        f.reject(new TypeError("offline"));
        await p2;
        T.eq([runIn(h, "getFxStatus('EUR').state"), runIn(h, "getFxStatus('EUR').refreshing"), runIn(h, "getFxRate('EUR')")], ["stale", false, 0.8], "N7 richiesta fallita: stale, tasso 0,8 invariato");
        // held (marcato non aggiornato) durante la richiesta, anche con cache fresca
        ({ f, h } = await start(1 * H, true));
        T.eq(runIn(h, "getFxStatus('EUR').state"), "stale", "N6e tasso 'held' con cache fresca: stale");
        const p3 = runIn(h, "fxRefresh(true)");
        await tick();
        T.eq([f.calls.length, runIn(h, "getFxStatus('EUR').state")], [1, "stale"], "N6f 'held' durante la richiesta: ancora stale");
        f.resolve(records({ EUR: 0.86 }, "2026-10-09"));
        await p3;
        T.eq([runIn(h, "getFxStatus('EUR').state"), runIn(h, "getFxRate('EUR')")], ["ok", 0.86], "N8b al tasso valido la marcatura 'held' sparisce");
        // provvisorio + scaduto durante la richiesta: stale (non provvisorio)
        ({ f, h } = await start(13 * H));
        runIn(h, "fxState.dates.EUR = '2026-10-10'");
        T.eq(runIn(h, "getFxStatus('EUR').state"), "stale", "N6g scaduto con data futura: stale prevale su provvisorio");
        const p4 = runIn(h, "fxRefresh(true)");
        await tick();
        T.eq(runIn(h, "getFxStatus('EUR').state"), "stale", "N6h ... anche durante la richiesta");
        f.reject(new TypeError("x")); await p4;
        // nessuna cache: durante la richiesta 'loading' (invariato)
        const f5 = deferred();
        h = mk("it", "EUR", { fetch: f5, fx: false });
        const p5 = runIn(h, "fxRefresh(true)");
        await tick();
        T.eq(runIn(h, "getFxStatus('EUR').state"), "loading", "N6i senza cache durante la richiesta: 'loading' (invariato)");
        f5.reject(new TypeError("x")); await p5;
        T.eq(runIn(h, "getFxStatus('EUR').state"), "unavailable", "N7b senza cache e richiesta fallita: 'unavailable'");
    }

    console.log("\n== O. v0.10.5: coerenza del campo refreshing (getFxStatus e getExchangeRateInfo)");
    {
        // [stato, getFxStatus.refreshing, getExchangeRateInfo.refreshing, fxState.loading] per la valuta selezionata (EUR)
        const snap = (h, c) => [runIn(h, "getFxStatus('" + (c || "EUR") + "').state"), runIn(h, "getFxStatus('" + (c || "EUR") + "').refreshing"), runIn(h, "getExchangeRateInfo().refreshing"), runIn(h, "fxState.loading")];
        // 1-3. senza cache
        let f = deferred();
        let h = mk("it", "EUR", { fetch: f, fx: false });
        T.eq(snap(h), ["unavailable", false, false, false], "O1 senza cache, prima della richiesta: unavailable, refreshing false (status e info)");
        let p = runIn(h, "fxRefresh(true)");
        await tick();
        T.eq([f.calls.length].concat(snap(h)), [1, "loading", true, true, true], "O2 senza cache, richiesta pendente: loading, refreshing true (status e info), fxState.loading true");
        T.eq([runIn(h, "getFxRate('EUR')"), runIn(h, "formatCurrency(convertToDisplay(10))")], [null, "—"], "O2b durante la richiesta nessun tasso e importi «—»");
        f.reject(new TypeError("offline")); await p;
        T.eq(snap(h), ["unavailable", false, false, false], "O3 dopo il fallimento senza cache: unavailable, refreshing false");
        // 4. tasso scaduto durante la richiesta
        f = deferred();
        h = mk("it", "EUR", { fetch: f, fx: cache({ EUR: 0.8 }, 13 * H, "2026-10-08") });
        T.eq(snap(h), ["stale", false, false, false], "O4a tasso scaduto, nessuna richiesta: stale, refreshing false");
        p = runIn(h, "fxRefresh(true)");
        await tick();
        T.eq(snap(h), ["stale", true, true, true], "O4 tasso scaduto durante la richiesta: stale con refreshing true (status e info)");
        T.ok(/Cambio NON aggiornato/.test(runIn(h, "getCurrencyNoteText()")), "O4b avviso «Cambio NON aggiornato» presente durante la richiesta");
        // 6. successo
        f.resolve(records({ EUR: 0.85 }, "2026-10-09")); await p;
        T.eq(snap(h).concat([runIn(h, "getFxRate('EUR')")]), ["ok", false, false, false, 0.85], "O6 richiesta riuscita: ok, refreshing false, nuovo tasso 0,85");
        // 6b. successo con data futura entro tolleranza: provisional
        f = deferred();
        h = mk("it", "EUR", { fetch: f, fx: false });
        p = runIn(h, "fxRefresh(true)"); await tick();
        f.resolve([{ date: "2026-10-10", base: "USD", quote: "EUR", rate: 0.9 }]); await p;
        T.eq(snap(h), ["provisional", false, false, false], "O6b richiesta riuscita con data +1 giorno: provisional, refreshing false");
        // 5. record rifiutati (futuro oltre tolleranza / non valido) durante la richiesta
        for (const [label, rec] of [["data futura oltre tolleranza", { date: "2026-10-20", base: "USD", quote: "EUR", rate: 0.01 }], ["data impossibile", { date: "2026-02-30", base: "USD", quote: "EUR", rate: 0.01 }], ["tasso non valido", { date: "2026-10-09", base: "USD", quote: "EUR", rate: -5 }]]) {
            const resp = [rec, { date: "2026-10-09", base: "USD", quote: "JPY", rate: 150 }];
            // a) prima risposta (rifiuto) senza cache, poi nuova richiesta pendente: nessun tasso creato, refreshing true
            let g = mk("it", "EUR", { fetch: mkFetch(async () => okResponse(resp)), fx: false });
            await runIn(g, "fxRefresh(true)");
            T.eq(snap(g).slice(0, 2).concat([snap(g)[2]]), ["unavailable", false, false], "O5 " + label + ": dopo la risposta EUR unavailable, refreshing false");
            const f2 = deferred();
            g = mk("it", "EUR", { fetch: f2, fx: false, store: Object.assign({}, g.store, { aeLang: "it", aeCurrency: "EUR" }) });
            T.eq(runIn(g, "getFxStatus('EUR').state"), "unavailable", "O5a " + label + ": dopo ricaricamento EUR unavailable");
            const p2 = runIn(g, "fxRefresh(true)"); await tick();
            T.eq([snap(g), runIn(g, "getFxRate('EUR')"), runIn(g, "formatCurrency(convertToDisplay(10))")], [["loading", true, true, true], null, "—"], "O5b " + label + ": richiesta pendente: loading, refreshing true, NESSUN tasso creato o usato (importo «—»)");
            f2.resolve(resp); await p2;
            T.eq([snap(g), runIn(g, "getFxRate('EUR')"), runIn(g, "getFxRate('JPY')")], [["unavailable", false, false, false], null, 150], "O5c " + label + ": a richiesta conclusa EUR resta unavailable (refreshing false), JPY usabile");
            // b) con tasso precedente valido: stale durante la richiesta, poi conservato stale
            const f3 = deferred();
            g = mk("it", "EUR", { fetch: f3, fx: cache({ EUR: 0.8 }, 13 * H, "2026-10-08") });
            const p3 = runIn(g, "fxRefresh(true)"); await tick();
            T.eq(snap(g), ["stale", true, true, true], "O5d " + label + " con tasso precedente: stale durante la richiesta, refreshing true");
            f3.resolve(resp); await p3;
            T.eq([snap(g), runIn(g, "getFxRate('EUR')")], [["stale", false, false, false], 0.8], "O5e " + label + ": a richiesta conclusa tasso 0,8 conservato stale, refreshing false");
        }
        // held durante la richiesta
        f = deferred();
        h = mk("it", "EUR", { fetch: f, fx: cache({ EUR: 0.8 }, 1 * H, "2026-10-08") });
        runIn(h, "fxState.held = { EUR: true }");
        p = runIn(h, "fxRefresh(true)"); await tick();
        T.eq(snap(h), ["stale", true, true, true], "O5f tasso 'held' durante la richiesta: stale, refreshing true");
        f.resolve(records({ EUR: 0.86 }, "2026-10-09")); await p;
        T.eq(snap(h), ["ok", false, false, false], "O5g richiesta riuscita: ok, refreshing false");
        // unsupported / loading con tassi presenti per altre valute
        f = deferred();
        h = mk("it", "GBP", { fetch: f, fx: cache({ EUR: 0.8 }, 1 * H) });
        runIn(h, "fxState.validated = true");
        T.eq(snap(h, "GBP"), ["unsupported", false, false, false], "O7a valuta assente dalla risposta: unsupported, refreshing false");
        runIn(h, "fxState.loading = true");
        T.eq(snap(h, "GBP"), ["loading", true, true, true], "O7b ... durante una richiesta: loading, refreshing true");
        // 7. coerenza status/info per tutte le valute convertite e USD sempre false
        const all = evalIn(mk("en", "USD"), "CONFIG.fx.currencies");
        let bad = [];
        for (const loading of [false, true]) for (const cur of all) {
            const g = mk("en", cur, { fx: cache({ EUR: 0.8, JPY: 150 }, 13 * H, "2026-10-08") });
            runIn(g, "fxState.loading = " + loading);
            const a = runIn(g, "getFxStatus(getCurrency()).refreshing"), b = runIn(g, "getExchangeRateInfo().refreshing");
            if (typeof a !== "boolean" || a !== b || a !== (cur === "USD" ? false : loading)) bad.push(cur + "/" + loading + ":" + a + "/" + b);
        }
        T.eq(bad, [], "O8 per tutte le " + all.length + " valute (con e senza richiesta): getFxStatus().refreshing === getExchangeRateInfo().refreshing, booleano; USD sempre false");
        T.eq(runIn(mk("en", "USD", { fx: false }), "(fxState.loading = true, [getFxStatus('USD').refreshing, getExchangeRateInfo().refreshing, getFxStatus('USD').state])"), [false, false, "identity"], "O8b USD con una richiesta di altra valuta in corso: refreshing false, identity");
    }

    console.log("\n== K. Nessun tasso scritto nel codice");
    {
        const files = fs.readdirSync(path.join(root, "js")).filter(f => f.endsWith(".js"));
        const hits = files.filter(f => /\b0[.,]86\b/.test(fs.readFileSync(path.join(root, "js", f), "utf8").replace(/\/\/.*$/gm, "")));
        T.eq(hits, [], "K nessun file js/ contiene il tasso 0,86 fuori dai commenti");
        T.ok(!/exchangeRate|usdToEur/.test(fs.readFileSync(path.join(root, "js/config.js"), "utf8")) && runIn(mk("en", "USD"), "typeof CONFIG.exchangeRate") === "undefined", "K CONFIG non ha piu' exchangeRate/usdToEur");
        const m = fs.readFileSync(path.join(root, "js/money.js"), "utf8") + fs.readFileSync(path.join(root, "js/fx.js"), "utf8");
        T.ok(!/\|\|\s*0\.\d+|\?\s*0\.\d+\s*:/.test(m), "K nessun tasso di ripiego numerico in money.js / fx.js");
    }

    T.done();

})().catch(e => { console.log("FAIL eccezione nel test: " + (e && e.stack || e)); process.exit(1); });
