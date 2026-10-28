// Test v0.9.5: formattazione monetaria condivisa (js/money.js).
// Uso: node tests/check-money-format.js
// Controlla: raggruppamento migliaia (3, 4, 5, 6, 7 cifre), importi < 1, decimali, simbolo/codice e posizione della valuta (come li produce Intl),
// indipendenza lingua/valuta, valori numerici invariati, uso della stessa funzione in strategia/SRB/assistente,
// assenza di simboli concatenati a mano, e percorso di ripiego per motori Intl senza useGrouping "always".
const fs = require("fs"), path = require("path");
const { load, runIn, evalIn, suite } = require("./lib/sandbox");
const T = suite("money-format");
const root = path.join(__dirname, "..");
const nb = s => String(s).replace(/[\u00a0\u202f]/g, " ");
const mk = (lang, cur, extra) => load({ store: { aeLang: lang, aeCurrency: cur, aePrefsMigration: "1", aeCountryGroup: "EU_WEST" }, extra });
const COMBOS = [["it", "EUR"], ["it", "USD"], ["en", "EUR"], ["en", "USD"]];

// Atteso per formatCurrency (2 decimali). IT: separatore migliaia ".", decimale ",", valuta DOPO con spazio.
// EN: migliaia ",", decimale ".", valuta PRIMA senza spazio.
const CASES = [
    [0, "0", "00"], [0.004, "0", "00"], [0.5, "0", "50"], [0.99, "0", "99"], [12.34, "12", "34"],
    [123.45, "123", "45"], [999.99, "999", "99"],
    [1000, "1.000", "00", "1,000"], [1234.56, "1.234", "56", "1,234"], [9999.99, "9.999", "99", "9,999"],
    [12345.67, "12.345", "67", "12,345"], [99999.99, "99.999", "99", "99,999"],
    [123456.78, "123.456", "78", "123,456"], [999999.99, "999.999", "99", "999,999"],
    [1234567.89, "1.234.567", "89", "1,234,567"]
];
// Simbolo/codice deciso da Intl: IT/USD usa il codice "USD" dopo l'importo (CLDR); le altre tre combinazioni il simbolo
const SYM = { EUR: "€", USD: "$" };
const CUR_IT = { EUR: "€", USD: "USD" };
function expected(lang, cur, c) {
    const [, itInt, dec, enInt] = c;
    const intIt = itInt, intEn = enInt || itInt;
    return lang === "it" ? intIt + "," + dec + " " + CUR_IT[cur] : SYM[cur] + intEn + "." + dec;
}

console.log("== A. formatCurrency: 4 combinazioni lingua/valuta x importi a 1-7 cifre, < 1 e decimali");
for (const [lang, cur] of COMBOS) {
    const h = mk(lang, cur);
    for (const c of CASES) {
        T.eq(nb(runIn(h, "formatCurrency(" + c[0] + ")")), expected(lang, cur, c), lang.toUpperCase() + "/" + cur + " formatCurrency(" + c[0] + ")");
    }
}

console.log("\n== B. Valore ricostruito dal testo = valore arrotondato (nessuna perdita o spostamento di cifre)");
function parseBack(lang, s) {
    let x = nb(s).replace(/[^\d.,-]/g, "");
    x = lang === "it" ? x.replace(/\./g, "").replace(",", ".") : x.replace(/,/g, "");
    return Number(x);
}
for (const [lang, cur] of COMBOS) {
    const h = mk(lang, cur);
    const vals = [0, 0.004, 0.5, 0.99, 12.34, 123.45, 999.99, 1234.56, 12345.67, 123456.78, 1234567.89, 0.1 + 0.2, 1e-9, 4321.1];
    const bad = vals.filter(v => Math.abs(parseBack(lang, runIn(h, "formatCurrency(" + v + ")")) - Math.round(v * 100) / 100) > 1e-9);
    T.eq(bad, [], lang.toUpperCase() + "/" + cur + " formatCurrency: testo -> numero coincide con il valore a 2 decimali");
}

console.log("\n== C. Simbolo, posizione e separatori");
for (const [lang, cur] of COMBOS) {
    const h = mk(lang, cur);
    const s = nb(runIn(h, "formatCurrency(1234.5)"));
    T.ok(lang === "it" ? s.endsWith(" " + CUR_IT[cur]) : s.startsWith(SYM[cur]), lang.toUpperCase() + "/" + cur + ": valuta " + (lang === "it" ? "dopo l'importo (con spazio)" : "prima dell'importo") + " -> " + s);
    T.ok(!/[A-Z]{3}/.test(s) === !(lang === "it" && cur === "USD"), lang.toUpperCase() + "/" + cur + ": simbolo/codice esattamente come lo produce Intl (nessun doppione, nessuna mescolanza)");
    T.eq((s.match(/[€$]|USD|EUR/g) || []).length, 1, lang.toUpperCase() + "/" + cur + ": una sola indicazione di valuta per importo");
    T.ok(lang === "it" ? /^\d\.\d{3},\d{2}/.test(s) : /\d,\d{3}\.\d{2}$/.test(s), lang.toUpperCase() + "/" + cur + ": migliaia e decimali secondo la lingua");
}
const hSp = mk("it", "EUR");
T.ok(/\u00a0|\u202f/.test(runIn(hSp, "formatCurrency(5)")), "IT: spazio tra importo e valuta non separabile (l'importo non va a capo dal simbolo)");

console.log("\n== D. Importi molto piccoli e precisi (formatCurrencyPrecise e formatMoneyDigits)");
for (const [lang, cur] of COMBOS) {
    const h = mk(lang, cur);
    const p = nb(runIn(h, "formatCurrencyPrecise(0.00001234)"));
    T.ok(lang === "it" ? p === "0,00001234 " + CUR_IT[cur] : p === SYM[cur] + "0.00001234", lang.toUpperCase() + "/" + cur + " formatCurrencyPrecise(0.00001234) -> " + p);
    const q = nb(runIn(h, "formatCurrencyPrecise(1234.5)"));
    T.ok(lang === "it" ? q === "1.234,50000000 " + CUR_IT[cur] : q === SYM[cur] + "1,234.50000000", lang.toUpperCase() + "/" + cur + " formatCurrencyPrecise(1234.5) raggruppa le migliaia -> " + q);
    const d4 = nb(runIn(h, "formatMoneyDigits(1234.5678, 4)"));
    T.ok(lang === "it" ? d4 === "1.234,5678 " + CUR_IT[cur] : d4 === SYM[cur] + "1,234.5678", lang.toUpperCase() + "/" + cur + " formatMoneyDigits(1234.5678, 4) -> " + d4);
    // 0,003 USD = 0,00258 EUR: sotto 1 centesimo (nella valuta mostrata) servono 4 decimali per non vedere sempre "0,00"
    const sm = nb(runIn(h, "formatStrategyMoney(0.003)"));
    T.eq(sm, nb(runIn(h, "formatMoneyDigits(convertToDisplay(0.003), 4)")), lang.toUpperCase() + "/" + cur + " formatStrategyMoney(0.003): sotto 1 centesimo usa 4 decimali -> " + sm);
    T.ok(/[1-9]/.test(sm.replace(/^[^\d]*/, "").split(/[.,]/)[1] || ""), lang.toUpperCase() + "/" + cur + " formatStrategyMoney(0.003): la parte decimale non si riduce a zeri");
}

console.log("\n== E. Lingua e valuta sono indipendenti");
{
    const h = mk("it", "EUR");
    runIn(h, "setLanguage('en')");
    T.eq([runIn(h, "getCurrentLanguage()"), runIn(h, "getCurrency()")], ["en", "EUR"], "IT/EUR -> cambio lingua: resta EUR");
    T.eq(nb(runIn(h, "formatCurrency(1234.5)")), "€1,234.50", "EN/EUR dopo il cambio lingua");
    runIn(h, "setCurrency('USD')");
    T.eq([runIn(h, "getCurrentLanguage()"), runIn(h, "getCurrency()")], ["en", "USD"], "EN/EUR -> cambio valuta: resta EN");
    T.eq(nb(runIn(h, "formatCurrency(1234.5)")), "$1,234.50", "EN/USD dopo il cambio valuta");
    runIn(h, "setLanguage('it')");
    T.eq(nb(runIn(h, "formatCurrency(1234.5)")), "1.234,50 USD", "IT/USD dopo il cambio lingua");
    runIn(h, "setCurrency('EUR')");
    T.eq(nb(runIn(h, "formatCurrency(1234.5)")), "1.234,50 €", "IT/EUR dopo il cambio valuta");
    T.eq([h.store.aeLang, h.store.aeCurrency], ["it", "EUR"], "chiavi localStorage invariate (aeLang, aeCurrency)");
}

console.log("\n== F. Valori numerici invariati (la formattazione non tocca conversione, formule, input)");
{
    // v0.10.0: il tasso non e' piu' una costante in CONFIG; qui e' il tasso SIMULATO pre-caricato dalla sandbox (cache fresca)
    const rate = runIn(mk("en", "USD"), "getFxRate('EUR')");
    T.eq(rate, 0.86, "tasso simulato dalla sandbox: 1 USD = 0,86 EUR (valore invariato rispetto alle versioni precedenti)");
    const X = [0, 0.004, 1, 123.45, 1234.56, 54321.09, 987654.32];
    for (const [lang, cur] of COMBOS) {
        const h = mk(lang, cur);
        const conv = X.map(v => runIn(h, "convertToDisplay(" + v + ")"));
        T.eq(conv, X.map(v => cur === "EUR" ? v * rate : v), lang.toUpperCase() + "/" + cur + " convertToDisplay: valori identici alla formula");
        const back = X.map(v => runIn(h, "convertFromDisplay(convertToDisplay(" + v + "))"));
        T.ok(back.every((b, i) => Math.abs(b - X[i]) <= Math.abs(X[i]) * 1e-12), lang.toUpperCase() + "/" + cur + " convertFromDisplay(convertToDisplay(x)) = x");
        const before = JSON.stringify(X);
        runIn(h, "(function(){ const a = [" + X.join(",") + "]; a.forEach(function (v) { formatCurrency(v); formatCurrencyPrecise(v); formatMoneyDigits(v, 4); }); })()");
        T.eq(JSON.stringify(X), before, lang.toUpperCase() + "/" + cur + " la formattazione non modifica i valori in ingresso");
    }
    // Stessa rendita interna in tutte e 4 le combinazioni: cambia solo la conversione di valuta, mai la lingua
    const DATA = JSON.stringify({ profile: { name: "T" }, badges: 12, mayorTarget: 0, lands: { common: 60000, rare: 30000, epic: 15000, legendary: 5000 },
        passes: { explorer: false, mission: false }, goal: { type: "efficiency", incomeTargetUSD: 1, incomeTargetBoosted: true, landsTarget: 0 }, settings: { dailyLoginAB: 50, abBalance: 340 } });
    const inc = {};
    for (const [lang, cur] of COMBOS) {
        const h = load({ store: { aeLang: lang, aeCurrency: cur, aePrefsMigration: "1", aeCountryGroup: "EU_WEST", aeCompanionData: DATA } });
        inc[lang + cur] = evalIn(h, "[getDailyIncome(), getMonthlyIncome(), getYearlyIncome(), getBaseDailyIncome(), getSRBDailyIncomeEstimate(), getDailyIncomeConverted(), getYearlyIncomeConverted(), getSRBView().lowUSD, getSRBView().highUSD]");
    }
    T.eq(inc.itEUR, inc.enEUR, "rendita e conversione identiche IT/EUR = EN/EUR (la lingua non incide sui valori)");
    T.eq(inc.itUSD, inc.enUSD, "rendita e conversione identiche IT/USD = EN/USD");
    T.eq(inc.itEUR.slice(0, 5), inc.itUSD.slice(0, 5), "rendite interne (USD) identiche con EUR e USD");
    T.ok(Math.abs(inc.itEUR[5] - inc.itUSD[5] * rate) < 1e-9 && Math.abs(inc.itEUR[6] - inc.itUSD[6] * rate) < 1e-6, "valori mostrati in EUR = valori USD x cambio fisso");
}

console.log("\n== G. Le schermate usano la stessa funzione (strategia, SRB, assistente, consigli)");
{
    const DATA = JSON.stringify({ profile: { name: "T" }, badges: 12, mayorTarget: 0, lands: { common: 60000, rare: 30000, epic: 15000, legendary: 5000 },
        passes: { explorer: false, mission: false }, goal: { type: "efficiency", incomeTargetUSD: 1, incomeTargetBoosted: true, landsTarget: 0 }, settings: { dailyLoginAB: 50, abBalance: 340 } });
    for (const [lang, cur] of COMBOS) {
        const h = load({ store: { aeLang: lang, aeCurrency: cur, aePrefsMigration: "1", aeCountryGroup: "EU_WEST", aeCompanionData: DATA } });
        const d = evalIn(h, "getSRBDisplay()");
        const viaFn = [d.view.estimateUSD, d.view.lowUSD, d.view.highUSD].map(u => runIn(h, "formatCurrency(convertToDisplay(" + u + "))"));
        T.eq([d.estimate, d.low, d.high], viaFn, lang.toUpperCase() + "/" + cur + " getSRBDisplay = formatCurrency(convertToDisplay(...))");
        T.ok(d.view.lowUSD <= d.view.estimateUSD && d.view.estimateUSD <= d.view.highUSD, lang.toUpperCase() + "/" + cur + " intervallo SRB: min <= centrale <= max");
        const strat = runIn(h, "formatStrategyMoney(" + d.view.estimateUSD + ")");
        T.eq(strat, runIn(h, "formatMoneyDigits(convertToDisplay(" + d.view.estimateUSD + "), 2)"), lang.toUpperCase() + "/" + cur + " formatStrategyMoney = formatMoneyDigits");
        const reply = nb(runIn(h, lang === "it" ? "getAssistantReply('Quanto guadagno?')" : "getAssistantReply('How much do I earn?')"));
        const daily = nb(runIn(h, "formatCurrency(getDailyIncomeConverted())"));
        T.ok(reply.indexOf(daily) !== -1, lang.toUpperCase() + "/" + cur + " risposta assistente contiene l'importo giornaliero formattato (" + daily + ")");
        const rx = lang === "it" ? /\d[\d.]*,\d{2} (€|USD)/ : /[€$]\d[\d,]*\.\d{2}/;
        T.ok(rx.test(nb(d.estimate)), lang.toUpperCase() + "/" + cur + " importo SRB nel formato della lingua: " + nb(d.estimate));
    }
}

console.log("\n== H. Nessun simbolo o codice di valuta concatenato a mano, nessun Intl valutario fuori da money.js");
{
    const files = fs.readdirSync(path.join(root, "js")).filter(f => f.endsWith(".js"));
    const offenders = [];
    for (const f of files) {
        if (f === "money.js") continue;
        const src = fs.readFileSync(path.join(root, "js", f), "utf8");
        const code = f === "i18n.js" ? "" : src.replace(/\/\/.*$/gm, "");
        const rules = [
            [/style\s*:\s*["']currency["']/, "Intl currency fuori da money.js"],
            [/currencyDisplay/, "currencyDisplay fuori da money.js"],
            [/\+\s*["'`]\s?[€$]\s?["'`]|["'`]\s?[€$]\s?["'`]\s*\+/, "simbolo concatenato"],
            [/\+\s*["'`]\s?(USD|EUR)\s?["'`]|["'`]\s?(USD|EUR)\s?["'`]\s*\+/, "codice valuta concatenato"],
            [/toLocaleString\([^)]*currency/, "toLocaleString con currency"]
        ];
        for (const [rx, why] of rules) if (rx.test(code)) offenders.push(f + ": " + why);
        if (f === "i18n.js") {
            const tpl = /[€$]\s?\{(value|daily|monthly|yearly|low|high|estimate|gain|target|gap|current|currentDaily|gainFormatted)\}|\{(value|daily|monthly|yearly|low|high|estimate|gain|target|gap|current|currentDaily|gainFormatted)\}\s?[€$]|\{(value|daily|monthly|yearly|low|high|estimate)\}\s?(USD|EUR)\b/;
            src.split("\n").forEach((l, i) => { if (tpl.test(l)) offenders.push("i18n.js:" + (i + 1) + ": simbolo accanto a un importo gia' formattato"); });
        }
    }
    T.eq(offenders, [], "nessun file (i18n incluso) aggiunge simboli/codici attorno agli importi formattati");
    const defs = files.filter(f => /function\s+(formatCurrency|formatCurrencyPrecise|formatMoneyDigits)\s*\(/.test(fs.readFileSync(path.join(root, "js", f), "utf8")));
    T.eq(defs, ["money.js"], "formatCurrency, formatCurrencyPrecise e formatMoneyDigits sono definite solo in money.js");
}

console.log("\n== I. Motori Intl meno recenti: stesso risultato senza useGrouping 'always'");
{
    // Simula un motore che ignora useGrouping "always" (resta "auto": it-IT non raggruppa 4 cifre)
    const NO_ALWAYS = `(function(){ const Real = Intl; Intl = { DateTimeFormat: Real.DateTimeFormat, NumberFormat: function (l, o) { o = Object.assign({}, o); if (o.useGrouping === "always") delete o.useGrouping; return new Real.NumberFormat(l, o); } }; })();`;
    for (const [lang, cur] of COMBOS) {
        const h = mk(lang, cur, NO_ALWAYS);
        T.eq(runIn(h, "supportsGroupingAlways()"), false, lang.toUpperCase() + "/" + cur + " simulazione: useGrouping 'always' non supportato");
        let bad = [];
        for (const c of CASES) { const got = nb(runIn(h, "formatCurrency(" + c[0] + ")")); if (got !== expected(lang, cur, c)) bad.push(c[0] + " -> " + got); }
        T.eq(bad, [], lang.toUpperCase() + "/" + cur + " ripiego: tutti gli importi (1-7 cifre, < 1, decimali) formattati come sul percorso principale");
        T.eq(nb(runIn(h, "formatCurrencyPrecise(1234.5)")), lang === "it" ? "1.234,50000000 " + CUR_IT[cur] : SYM[cur] + "1,234.50000000", lang.toUpperCase() + "/" + cur + " ripiego: formatCurrencyPrecise a 4 cifre intere");
    }
}

T.done();
