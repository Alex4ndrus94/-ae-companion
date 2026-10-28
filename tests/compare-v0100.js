// Confronto tra la v0.9.5 ORIGINALE e la v0.10.0 (conversione valutaria automatica).
// Uso: node tests/compare-v0100.js <cartella-v0.9.5> [<cartella-v0.10.0>]
// Nessuna rete: la v0.10.0 gira con una cache dei cambi SIMULATA e FISSA (USD->EUR 0,86 = il valore che la v0.9.5 aveva nel codice;
// JPY/GBP/CAD/AUD/KWD con numeri di prova). Dimostra che:
//  1. i file di calcolo/dati sono byte-identici e gli altri file cambiati differiscono SOLO nei punti attesi (patch inverse);
//  2. i risultati GREZZI del motore (rendita USD, boost, SRB, terreni, badge, AB, obiettivi, profilo, modello strategia numerico) sono === identici;
//  3. gli importi MOSTRATI con EUR/USD sono identici carattere per carattere (salvo la nota sul cambio, che e' cambiata per scelta);
//  4. con le nuove valute gli importi sono esattamente USD x tasso, formattati con le cifre della valuta;
//  5. cambiare lingua non cambia nessun risultato economico e cambiare valuta non cambia nessun dato di gioco.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const { load, runIn, evalIn, FIXED, FX_KEY } = require("./lib/sandbox");
const A = path.resolve(process.argv[2] || ""), B = path.resolve(process.argv[3] || path.join(__dirname, ".."));
if (!process.argv[2]) { console.error("Uso: node tests/compare-v0100.js <v0.9.5> [<v0.10.0>]"); process.exit(2); }
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL " + m); } };
const nb = s => String(s).replace(/[\u00a0\u202f]/g, " ");
const rd = (root, f) => fs.readFileSync(path.join(root, f), "utf8");
const sha = s => crypto.createHash("sha256").update(s).digest("hex");

// ---------- 1. File ----------
console.log("== 1. File");
const IDENTICAL = ["js/income.js", "js/countries.js", "js/player.js", "js/storage.js", "js/calculator.js", "js/playerEngine.js", "js/advice.js", "js/explorer.js",
    "js/abtips.js", "js/sharecard.js", "js/ui.js", "js/strategy-ui.js", "js/explorer-ui.js", "js/components.js", "js/navigation.js", "js/install-banner.js"];
for (const f of IDENTICAL) ok(sha(rd(A, f)) === sha(rd(B, f)), "file di calcolo/dati/UI modificato: " + f);
console.log("byte-identici: " + IDENTICAL.filter(f => sha(rd(A, f)) === sha(rd(B, f))).length + "/" + IDENTICAL.length + " (" + IDENTICAL.map(f => f.replace("js/", "")).join(", ") + ")");

// patch inverse: riportando la nuova versione al vecchio testo nei SOLI punti attesi si deve ottenere la vecchia, byte per byte
function reverse(name, file, edits) {
    let s = rd(B, file);
    for (const [from, to] of edits) { ok(s.indexOf(from) !== -1, name + ": blocco atteso non trovato"); s = s.replace(from, to); }
    ok(sha(s) === sha(rd(A, file)), name + ": " + file + " differisce dalla v0.9.5 anche fuori dai punti attesi");
    console.log((sha(s) === sha(rd(A, file)) ? "OK   " : "FAIL ") + file + ": differenze limitate a " + edits.length + " punto/i dichiarato/i");
}
reverse("strategy.js", "js/strategy.js", [[`    // cifre della valuta (2 per EUR/USD: identico a prima; 0 per JPY; 3 per KWD); sotto la sua unita' minima +2 cifre
    const base = getCurrencyDigits(getCurrency());
    const digits = (value === 0 || Math.abs(value) >= Math.pow(10, -base)) ? base : base + 2;
`, `    const digits = (value === 0 || Math.abs(value) >= 0.01) ? 2 : 4;
`]]);
reverse("app.js", "js/app.js", [[`// v0.10.0: carica la cache dei cambi e, se serve (valuta diversa da USD e dato scaduto), li aggiorna in rete
fxInit();

`, ""]]);
reverse("prefs.js", "js/prefs.js", [[`const PREFS_CURRENCIES = CONFIG.fx.currencies;   // v0.10.0: stesso elenco di js/money.js (config.js e' caricato prima)`, `const PREFS_CURRENCIES = ["EUR", "USD"];`]]);
{
    const nw = rd(B, "js/assistant.js");
    const wrapStart = nw.indexOf("// v0.10.0: se la risposta contiene importi"), wrapEnd = nw.indexOf("function getAssistantReplyCore(userText) {");
    ok(wrapStart > 0 && wrapEnd > wrapStart, "assistant.js: wrapper atteso non trovato");
    reverse("assistant.js", "js/assistant.js", [
        [nw.slice(wrapStart, wrapEnd) + "function getAssistantReplyCore(userText) {", "function getAssistantReply(userText) {"],
        [`getAssistantCurrencyNote()`, `t("assistantCurrencyNote", { rate: getCurrencyRateLabel() })`]]);
}
// config.js: costanti di gioco identiche; cambiano solo i campi del cambio fisso (rimossi) e il blocco fx (nuovo)
{
    const cfg = root => { const h = load({ root, files: ["config"] }); return evalIn(h, "CONFIG"); };
    const a = cfg(A), b = cfg(B);
    const strip = o => { const c = JSON.parse(JSON.stringify(o)); ["exchangeRate", "exchangeRateInfo", "fx"].forEach(k => delete c[k]); return c; };
    ok(JSON.stringify(strip(a)) === JSON.stringify(strip(b)), "config.js: costanti di gioco (rendite al secondo, rarita', badge, SRB, costi AB, pass) cambiate");
    console.log("OK   js/config.js: costanti di gioco identiche; rimossi exchangeRate/exchangeRateInfo (0,86), aggiunto CONFIG.fx");
    ok(a.exchangeRate === 0.86 && !("exchangeRate" in b) && !("exchangeRateInfo" in b), "config.js: la v0.9.5 aveva 0,86 e la v0.10.0 non lo ha piu'");
}
// i18n: stesse stringhe tranne quelle monetarie
{
    const tr = root => evalIn(load({ root, files: ["config", "prefs", "i18n"] }), "translations");
    const a = tr(A), b = tr(B), changed = [], removed = [], added = [];
    for (const lang of ["it", "en"]) {
        for (const k of Object.keys(a[lang])) { if (!(k in b[lang])) removed.push(lang + "." + k); else if (a[lang][k] !== b[lang][k]) changed.push(lang + "." + k); }
        for (const k of Object.keys(b[lang])) if (!(k in a[lang])) added.push(lang + "." + k);
    }
    const allowed = k => /\.(assistantCurrencyNote|currencyEstimateNote|currencySettingNote|fx[A-Z]\w*|assistantCurrencyNote\w+)$/.test(k);
    ok(changed.concat(removed, added).every(allowed), "i18n: modificate stringhe non monetarie: " + changed.concat(removed, added).filter(k => !allowed(k)).join(", "));
    console.log("OK   js/i18n.js: modificate " + changed.length + ", rimosse " + removed.length + ", aggiunte " + added.length + " stringhe, tutte relative al cambio");
}
console.log("Modificati con revisione dedicata (coperti da test): js/money.js, js/settings.js, js/fx.js (nuovo), index.html (script fx.js, versione), tools/build-pages.js (testo guida/privacy)");

// ---------- 2-5. Scenari ----------
console.log("\n== 2-5. Scenari (cambio simulato fisso, nessuna rete)");
const SIM = { EUR: 0.86, JPY: 151.23, GBP: 0.7421, CAD: 1.3801, AUD: 1.5412, KWD: 0.3052 };
const simFx = { rates: SIM, dates: Object.keys(SIM).reduce((o, k) => { o[k] = "2026-10-09"; return o; }, {}) };
const base = { profile: { name: "Test" }, badges: 12, mayorTarget: 0, passes: { explorer: false, mission: false }, settings: { dailyLoginAB: 50, abBalance: 340 } };
const mkGoal = (type, extra) => Object.assign({ type, incomeTargetUSD: 1, incomeTargetBoosted: true, landsTarget: 0 }, extra || {});
const profiles = [
    { n: "40 terreni", lands: { common: 40, rare: 20, epic: 10, legendary: 2 }, goal: mkGoal("efficiency") },
    { n: "1.014 (caso Reddit)", lands: { common: 502, rare: 310, epic: 152, legendary: 50 }, badges: 101, goal: mkGoal("income", { incomeTargetUSD: 5 }) },
    { n: "5.000", lands: { common: 2500, rare: 1500, epic: 750, legendary: 250 }, goal: mkGoal("lands", { landsTarget: 6000, incomeTargetBoosted: false }) },
    { n: "30.000", lands: { common: 15000, rare: 9000, epic: 4500, legendary: 1500 }, goal: mkGoal("efficiency") },
    { n: "150.000", lands: { common: 75000, rare: 45000, epic: 22500, legendary: 7500 }, goal: mkGoal("income", { incomeTargetUSD: 1000 }) },
    { n: "200.000", lands: { common: 100000, rare: 60000, epic: 30000, legendary: 10000 }, goal: mkGoal("efficiency") },
    { n: "Mayor", lands: { common: 30, rare: 15, epic: 8, legendary: 1 }, goal: mkGoal("mayor"), mayorTarget: 220 }
];
const groups = ["US", "UK_CA_AU_ZA_IE_NZ", "EU_WEST", "NORDIC", "SE_ASIA", "ASIA_GULF", "BRAZIL", "MEXICO"];
const Q_IT = ["Cosa conviene comprare?", "Quanto manca al mio obiettivo?", "Quanto guadagno?", "e se avessi 150 badge?", "e se avessi 300 terreni?", "quanto rendo con il super potenziamento (srb)?", "quanto renderei con 200.000 terreni durante l'srb?"];
const Q_EN = ["What should I buy?", "How much do I earn?", "What if I had 80 badges?", "What if I had 700 lands?", "what would my rent be during srb with 200,000 parcels?", "srb"];

// Risultati GREZZI (USD e dati di gioco): non dipendono ne' dalla lingua ne' dalla valuta
const RAW = `(function(){
  const b = getCurrentBoost(getTotalLands());
  return {
    income: [getDailyIncome(), getMonthlyIncome(), getYearlyIncome(), getBaseDailyIncome(), getBaseMonthlyIncome(), getBaseYearlyIncome(), getSRBDailyIncomeEstimate()],
    boost: [getBoostMultiplier(), getBoostPercent(), getTotalLands(), getBadgeBoostPercent(player.badges)],
    srb: (function(){ const v = getSRBView(); return [v.estimateUSD, v.lowUSD, v.highUSD, v.overLimit]; })(),
    srbDetails: getSRBBreakdown(getTotalLands(), player.badges, b),
    ab: [convertRentUSDToAB(getDailyIncome()), player.settings.abBalance, player.settings.dailyLoginAB],
    game: [player.lands, player.badges, player.mayorTarget, player.passes, player.goal],
    profile: JSON.stringify(player)
  };
})()`;
// Importi MOSTRATI (dipendono da lingua e valuta)
const SHOWN = `(function(){
  const ds = getSRBDisplay();
  return {
    conv: [getDailyIncomeConverted(), getMonthlyIncomeConverted(), getYearlyIncomeConverted(), getBaseDailyIncomeConverted(), getBaseMonthlyIncomeConverted(), getBaseYearlyIncomeConverted(), getIncomePerSecondConverted()],
    shown: [formatCurrency(getDailyIncomeConverted()), formatCurrency(getMonthlyIncomeConverted()), formatCurrency(getYearlyIncomeConverted()), formatCurrencyPrecise(getIncomePerSecondConverted()),
            formatStrategyMoney(getDailyIncome()), formatStrategyMoney(getYearlyIncome()), formatStrategyMoney(0.003),
            formatCurrency(convertToDisplay(getSRBDailyIncomeEstimate() * 30)), formatCurrency(convertToDisplay(getSRBDailyIncomeEstimate() * 365))],
    srb: [ds.estimate, ds.low, ds.high, ds.hasRange],
    strategy: JSON.stringify(getStrategyModel()),
    tip: [getIncomeGoalTip(getTotalLands()), getEfficiencyTip(getTotalLands())],
    assistant: QUESTIONS.map(function (q) { return getAssistantReply(q); })
  };
})()`;
const strategyNums = json => { const out = []; (function w(o, p) { if (Array.isArray(o)) o.forEach((v, i) => w(v, p + "[" + i + "]")); else if (o && typeof o === "object") Object.keys(o).forEach(k => w(o[k], p + "." + k)); else if (typeof o === "number") out.push([p, o]); })(JSON.parse(json), ""); return out; };
const stripNote = s => String(s).replace(/\s(?:Importi in (?:euro|EUR)|Euro amounts|Amounts in EUR):.*$/, "");

function run(root, sc, withShown) {
    const data = Object.assign({}, base, { badges: sc.p.badges || base.badges, mayorTarget: sc.p.mayorTarget || 0 }, { lands: sc.p.lands, goal: sc.p.goal });
    const h = load({ root, store: { aeLang: sc.lang, aeCurrency: sc.cur, aePrefsMigration: "1", aeCountryGroup: sc.group, aeCompanionData: JSON.stringify(data) }, navLang: sc.lang, fx: simFx });
    const out = { raw: evalIn(h, RAW) };
    if (withShown) out.shown = evalIn(h, SHOWN.replace("QUESTIONS", JSON.stringify(sc.lang === "it" ? Q_IT : Q_EN)));
    out.store = JSON.parse(JSON.stringify(h.store)); delete out.store[FX_KEY];
    return out;
}

let n = 0, rawLeaves = 0, shownStrings = 0, errors = 0;
const sameJSON = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// 2+3. v0.9.5 vs v0.10.0 con EUR/USD e lingua IT/EN
for (const group of groups) for (const [lang, cur] of [["it", "EUR"], ["it", "USD"], ["en", "EUR"], ["en", "USD"]]) for (const p of profiles) {
    const sc = { group, lang, cur, p }, tag = group + " " + lang + "/" + cur + " " + p.n;
    let a, b;
    try { a = run(A, sc, true); b = run(B, sc, true); } catch (e) { errors++; ok(false, "errore sandbox " + tag + ": " + e.message); continue; }
    n++;
    // risultati grezzi: identici con ===, nessuna tolleranza (JSON conserva i double esattamente)
    ok(sameJSON(a.raw, b.raw), tag + ": risultati grezzi del motore diversi");
    rawLeaves += JSON.stringify(a.raw).length;
    // importi convertiti (numeri): v0.9.5 = USD x 0,86 codice; v0.10.0 = USD x 0,86 simulato -> identici
    ok(sameJSON(a.shown.conv, b.shown.conv), tag + ": importi convertiti (numeri) diversi con lo stesso tasso");
    // importi mostrati: identici carattere per carattere
    for (const k of ["shown", "srb", "tip"]) { shownStrings += a.shown[k].length; ok(sameJSON(a.shown[k], b.shown[k]), tag + ": testo mostrato diverso in " + k + ": " + a.shown[k] + " -> " + b.shown[k]); }
    ok(a.shown.strategy === b.shown.strategy, tag + ": modello strategia (testi inclusi) diverso");
    a.shown.assistant.forEach((x, i) => { shownStrings++; ok(stripNote(x) === stripNote(b.shown.assistant[i]), tag + ": risposta assistente " + i + " diversa oltre alla nota sul cambio"); });
    ok(sameJSON(a.store, b.store), tag + ": localStorage diverso (oltre alla chiave dei cambi)");
}
console.log("2-3. v0.9.5 vs v0.10.0: " + n + " scenari, errori " + errors + "; risultati grezzi identici (===) e importi mostrati EUR/USD identici (" + shownStrings + " testi) salvo la nota sul cambio");

// 4+5. Solo v0.10.0: tutte le valute, lingua e valuta indipendenti
const CURS = ["USD", "EUR", "JPY", "GBP", "CAD", "AUD", "KWD"];
const expFmt = (lang, cur, v, d) => nb(new Intl.NumberFormat(lang === "it" ? "it-IT" : "en-US", { style: "currency", currency: cur, minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: "always" }).format(v));
const digits = c => new Intl.NumberFormat("en", { style: "currency", currency: c }).resolvedOptions().maximumFractionDigits;
let m = 0, fmtChecks = 0;
for (const group of ["EU_WEST", "US", "ASIA_GULF"]) for (const p of profiles) {
    const rows = {};
    for (const lang of ["it", "en"]) for (const cur of CURS) {
        const sc = { group, lang, cur, p };
        rows[lang + cur] = { out: run(B, sc, true), sc };
    }
    const ref = rows.enUSD.out;
    for (const key of Object.keys(rows)) {
        const { out, sc } = rows[key], tag = group + " " + sc.lang + "/" + sc.cur + " " + p.n;
        m++;
        // 5a. cambiare lingua o valuta non cambia NESSUN dato di gioco ne' risultato grezzo (terreni, badge, AB, obiettivo, boost, SRB USD)
        ok(sameJSON(out.raw, ref.raw), tag + ": risultati grezzi/dati di gioco diversi da en/USD");
        // 4. importi mostrati = USD x tasso, cifre della valuta
        const r = sc.cur === "USD" ? 1 : SIM[sc.cur], d = digits(sc.cur), raw = out.raw.income;
        const exp = [raw[0] * r, raw[1] * r, raw[2] * r, raw[3] * r, raw[4] * r, raw[5] * r, raw[0] * r / 86400];
        ok(sameJSON(out.shown.conv, exp), tag + ": importi convertiti != USD x tasso");
        ok(nb(out.shown.shown[0]) === expFmt(sc.lang, sc.cur, raw[0] * r, d) && nb(out.shown.shown[1]) === expFmt(sc.lang, sc.cur, raw[1] * r, d) && nb(out.shown.shown[2]) === expFmt(sc.lang, sc.cur, raw[2] * r, d), tag + ": importi formattati (" + out.shown.shown.slice(0, 3).join(" | ") + ") != atteso");
        fmtChecks += 3;
        // 5b. cambiare LINGUA a parita' di valuta: stessi numeri convertiti e stessa parte numerica grezza della strategia
        const other = rows[(sc.lang === "it" ? "en" : "it") + sc.cur].out;
        ok(sameJSON(out.shown.conv, other.shown.conv), tag + ": la lingua cambia gli importi convertiti");
        ok(sameJSON(strategyNums(out.shown.strategy), strategyNums(other.shown.strategy)), tag + ": la lingua cambia i numeri della strategia");
        // 5c. cambiare VALUTA a parita' di lingua: stessi numeri della strategia (sono tutti USD/terreni/AB/giorni)
        const usdSame = rows[sc.lang + "USD"].out;
        ok(sameJSON(strategyNums(out.shown.strategy), strategyNums(usdSame.shown.strategy)), tag + ": la valuta cambia i numeri della strategia (terreni, AB, giorni, percentuali)");
    }
}
console.log("4-5. v0.10.0, " + CURS.length + " valute x 2 lingue x 3 gruppi x " + profiles.length + " profili: " + m + " combinazioni, " + fmtChecks + " importi verificati con una formula indipendente");

console.log((fail ? "FAIL" : "PASS") + " confronto v0.9.5 -> v0.10.0: " + pass + " controlli superati, " + fail + " falliti");
process.exit(fail ? 1 : 0);
