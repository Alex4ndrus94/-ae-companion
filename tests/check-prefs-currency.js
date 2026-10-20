// Test A/B/C/D: migrazione preferenze, indipendenza lingua/valuta, integrita' dei calcoli, cluster.
// Uso: node tests/check-prefs-currency.js
const { load, evalIn, runIn, suite } = require("./lib/sandbox");
const T = suite("prefs-currency");
const DATA = JSON.stringify({ profile: { name: "T" }, lands: { common: 40, rare: 20, epic: 10, legendary: 2 }, badges: 12,
    mayorTarget: 0, passes: { explorer: false, mission: false }, goal: { type: "income", incomeTargetUSD: 5, incomeTargetBoosted: true, landsTarget: 0 },
    settings: { dailyLoginAB: 50, abBalance: 340 } });
const prefs = h => ({ lang: runIn(h, "getCurrentLanguage()"), cur: runIn(h, "getCurrency()") });

// ---- A. Migrazione ----
console.log("== A. Migrazione preferenze");
let h = load({ store: {}, navLang: "it-IT" });
T.eq(prefs(h), { lang: "en", cur: "USD" }, "A1 nuovo utente (browser italiano, nessun dato): inglese + USD");
h = load({ store: {}, navLang: "en-US" });
T.eq(prefs(h), { lang: "en", cur: "USD" }, "A1b nuovo utente (browser inglese): inglese + USD");
h = load({ store: { aeLang: "it", aeCompanionData: DATA }, navLang: "en-US" });
T.eq(prefs(h), { lang: "it", cur: "EUR" }, "A2 lingua italiana salvata preservata; A3 vedeva EUR e continua a vederli");
h = load({ store: { aeLang: "en", aeCompanionData: DATA }, navLang: "it-IT" });
T.eq(prefs(h), { lang: "en", cur: "USD" }, "A4 lingua inglese salvata (browser it): vedeva USD e continua a vederli");
h = load({ store: { aeCompanionData: DATA }, navLang: "it-IT" });
T.eq(prefs(h), { lang: "it", cur: "EUR" }, "A3b utente esistente senza aeLang e browser italiano: vedeva IT/EUR, resta IT/EUR (e viene salvato)");
T.eq([h.store.aeLang, h.store.aeCurrency], ["it", "EUR"], "A3c lingua e valuta ricavate dalla logica vecchia sono state persistite");
h = load({ store: { aeCompanionData: DATA }, navLang: "de-DE" });
T.eq(prefs(h), { lang: "en", cur: "USD" }, "A4b utente esistente senza aeLang e browser non italiano: vedeva EN/USD");
h = load({ store: { aeLang: "it", aeCurrency: "USD", aeCompanionData: DATA }, navLang: "it-IT" });
T.eq(prefs(h), { lang: "it", cur: "USD" }, "A5 preferenza valuta gia' salvata (USD con lingua IT) non sovrascritta");
h = load({ store: { aeLang: "xx", aeCompanionData: DATA }, navLang: "it-IT" });
T.eq(prefs(h), { lang: "it", cur: "EUR" }, "A5b lingua salvata NON valida: fallback alla logica precedente");
h = load({ store: { aeLang: "en", aeCurrency: "EUR", aePrefsMigration: "1", aeCompanionData: DATA }, navLang: "it-IT" });
T.eq(prefs(h), { lang: "en", cur: "EUR" }, "A6 ricaricamento: preferenze non resettate");
h = load({ store: { aeLang: "en", aeCurrency: "EUR", aePrefsMigration: "1", aeCompanionData: DATA } });
T.eq(h.writes.filter(k => k === "aeLang" || k === "aeCurrency"), [], "A7 migrazione gia' eseguita: nessuna scrittura");
let h1 = load({ store: { aeCompanionData: DATA }, navLang: "it-IT" });
let h2 = load({ store: Object.assign({}, h1.store), navLang: "en-US" });
T.eq(prefs(h2), { lang: "it", cur: "EUR" }, "A7b seconda esecuzione (anche con browser diverso) non riscrive le scelte");
h = load({ store: { aeCompanionData: DATA }, navLang: "it-IT" });
runIn(h, "runPrefsMigration()");
T.eq([h.store.aeLang, h.store.aeCurrency], ["it", "EUR"], "A7c runPrefsMigration() ripetuta: valori invariati");

// ---- B. Indipendenza ----
console.log("\n== B. Indipendenza lingua/valuta");
for (const lang of ["it", "en"]) for (const cur of ["EUR", "USD"]) {
    h = load({ store: { aeLang: lang, aeCurrency: cur, aePrefsMigration: "1", aeCompanionData: DATA, aeCountryGroup: "EU_WEST" } });
    T.eq(prefs(h), { lang, cur }, "B " + lang.toUpperCase() + "+" + cur + " caricata correttamente");
    const other = lang === "it" ? "en" : "it";
    runIn(h, "setLanguage('" + other + "')");
    T.eq(prefs(h), { lang: other, cur }, "B cambio solo lingua " + lang + "->" + other + ": valuta " + cur + " invariata");
    const otherCur = cur === "EUR" ? "USD" : "EUR";
    runIn(h, "setCurrency('" + otherCur + "')");
    T.eq(prefs(h), { lang: other, cur: otherCur }, "B cambio solo valuta " + cur + "->" + otherCur + ": lingua " + other + " invariata");
    T.eq([h.store.aeLang, h.store.aeCurrency], [other, otherCur], "B le due preferenze sono salvate separatamente");
}
h = load({ store: { aeLang: "en", aeCurrency: "USD", aePrefsMigration: "1" } });
T.ok(runIn(h, "setCurrency('GBP')") === false && runIn(h, "getCurrency()") === "USD", "B valuta non supportata rifiutata");
const fmt = (lang, cur) => { const x = load({ store: { aeLang: lang, aeCurrency: cur, aePrefsMigration: "1" } }); return runIn(x, "formatCurrency(12345.5)"); };
T.eq([fmt("it", "EUR"), fmt("en", "USD")].map(s => s.replace(/\s/g, " ")), ["12.345,50 €", "$12,345.50"], "B formato IT+EUR e EN+USD identico a v0.8.1");
T.ok(fmt("it", "USD").indexOf("12.345,50") !== -1 && fmt("it", "USD").indexOf("USD") !== -1 && fmt("en", "EUR") === "€12,345.50", "B IT+USD: importo in dollari con separatori italiani (12.345,50 USD); EN+EUR: €12,345.50");

// ---- C. Integrita' dei calcoli (valori interni indipendenti da lingua/valuta) ----
console.log("\n== C. Integrita' dei calcoli");
const INTERNAL = "(function(){return {inc:[getDailyIncome(),getMonthlyIncome(),getYearlyIncome(),getBaseDailyIncome(),getSRBDailyIncomeEstimate()],lands:getTotalLands(),boost:getBoostMultiplier(),goal:player.goal.incomeTargetUSD,strategy:getStrategyModel(),tips:getABSourceTips().length};})()";
let ref = null;
for (const lang of ["it", "en"]) for (const cur of ["EUR", "USD"]) {
    h = load({ store: { aeLang: lang, aeCurrency: cur, aePrefsMigration: "1", aeCompanionData: DATA, aeCountryGroup: "EU_WEST" } });
    const v = JSON.stringify(evalIn(h, INTERNAL).inc) + JSON.stringify(evalIn(h, INTERNAL).lands) + JSON.stringify(evalIn(h, INTERNAL).goal);
    if (ref === null) ref = v;
    T.ok(v === ref, "C valori interni (rendita, terreni, obiettivo) identici per " + lang + "+" + cur);
}
h = load({ store: { aeLang: "it", aeCurrency: "EUR", aePrefsMigration: "1", aeCompanionData: DATA, aeCountryGroup: "EU_WEST" } });
const usd = runIn(h, "getDailyIncome()");
T.ok(Math.abs(runIn(h, "getDailyIncomeConverted()") - usd * 0.86) < 1e-12, "C EUR = USD interno x 0.86 (cambio fisso documentato)");
runIn(h, "setCurrency('USD')");
T.ok(runIn(h, "getDailyIncomeConverted()") === usd, "C USD = valore interno senza conversione");
T.ok(runIn(h, "getDailyIncome()") === usd, "C il valore interno non cambia con la valuta");
T.ok(runIn(h, "convertFromDisplay(convertToDisplay(5, 'x'))") === 5, "C conversione andata/ritorno senza perdita (USD)");
runIn(h, "setCurrency('EUR')");
T.ok(Math.abs(runIn(h, "convertFromDisplay(convertToDisplay(5))") - 5) < 1e-12, "C conversione andata/ritorno senza perdita (EUR)");
T.ok(runIn(h, "isCurrencyEstimated()") === true && runIn(h, "getCurrencyNoteText()").length > 10, "C la nota 'cambio indicativo' compare con EUR");
runIn(h, "setCurrency('USD')");
T.ok(runIn(h, "getCurrencyNoteText()") === "", "C nessuna nota con USD (valuta nativa)");
T.ok(runIn(h, "getExchangeRateInfo().isLive") === false, "C il tasso e' dichiarato non live/non ufficiale");

// ---- D. Cluster ----
console.log("\n== D. Cluster regionale");
h = load({ store: { aeCountryGroup: "BRAZIL", aeLang: "it", aeCurrency: "EUR", aePrefsMigration: "1" }, navLang: "en-US" });
T.ok(runIn(h, "getCurrentCountryGroup()") === "BRAZIL" && runIn(h, "isCountryGroupConfirmed()"), "D1 cluster gia' salvato preservato (nonostante browser en-US)");
runIn(h, "setLanguage('en'); setCurrency('USD')");
T.ok(h.store.aeCountryGroup === "BRAZIL" && runIn(h, "getCurrentCountryGroup()") === "BRAZIL", "D7 cambio lingua e valuta non cambiano il cluster");
h = load({ store: { aeLang: "en", aeCurrency: "USD", aePrefsMigration: "1" }, navLang: "en-GB" });
T.ok(!runIn(h, "isCountryGroupConfirmed()") && h.store.aeCountryGroup === undefined, "D2 senza scelta: non confermato e non salvato automaticamente");
T.eq(evalIn(h, "suggestCountryGroup()"), { group: "UK_CA_AU_ZA_IE_NZ", reliability: "region" }, "D2 suggerimento da en-GB (affidabilita' 'region')");
T.eq(evalIn(h, "suggestCountryGroup('it')"), { group: "EU_WEST", reliability: "language" }, "D2 suggerimento dalla sola lingua marcato 'language' (debole)");
runIn(h, "confirmSuggestedCountryGroup()");
T.ok(h.store.aeCountryGroup === undefined, "D3 'conferma suggerimento' e' solo una bozza finche' non si preme Salva");
runIn(h, "applyPendingCountryGroup()");
T.ok(h.store.aeCountryGroup === "UK_CA_AU_ZA_IE_NZ" && runIn(h, "isCountryGroupConfirmed()"), "D3 suggerimento accettato e salvato dopo Salva");
h = load({ store: { aeLang: "en", aeCurrency: "USD", aePrefsMigration: "1" }, navLang: "en-GB" });
runIn(h, "stageCountryGroup('MEXICO'); applyPendingCountryGroup()");
T.ok(h.store.aeCountryGroup === "MEXICO", "D4 suggerimento rifiutato e scelta alternativa salvata");
h = load({ store: { aeLang: "en", aeCurrency: "USD", aePrefsMigration: "1" }, navLang: "en-GB" });
runIn(h, "stageCountryGroup('NORDIC'); resetPendingCountryGroup()");
T.ok(h.store.aeCountryGroup === undefined && runIn(h, "applyPendingCountryGroup()") === false, "D5 annullamento: nessun salvataggio");
h = load({ store: { aeLang: "en", aeCurrency: "USD", aePrefsMigration: "1" }, navLang: "" });
T.eq(evalIn(h, "suggestCountryGroup()"), { group: null, reliability: "none" }, "D6 rilevamento non disponibile: nessun suggerimento");
T.ok(!runIn(h, "isCountryGroupConfirmed()") && runIn(h, "getCurrentCountryGroup()") === "EU_WEST", "D6 senza rilevamento: valore provvisorio come v0.8.1 (EU_WEST), non confermato");
h = load({ store: { aeLang: "en", aeCurrency: "USD", aePrefsMigration: "1" }, navLang: "zz" });
T.eq(evalIn(h, "suggestCountryGroup()").group, null, "D6b lingua sconosciuta: nessun suggerimento");
T.done();
