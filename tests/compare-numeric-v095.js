// Confronto dei VALORI NUMERICI tra la versione precedente (v0.9.4) e questa (v0.9.5).
// Uso: node tests/compare-numeric-v095.js <cartella-v0.9.4> [<cartella-v0.9.5>]
// La v0.9.5 cambia solo come gli importi vengono SCRITTI (separatore migliaia a 4 cifre in it-IT).
// Qui si verifica che: (1) i file di logica/dati protetti siano byte-identici; (2) ogni numero grezzo (rendita, boost,
// conversione EUR/USD, intervallo SRB, modello strategia, ...) sia IDENTICO (===) in tutti gli scenari; (3) i testi
// mostrati (importi nelle schermate, nell'assistente, nella strategia) contengano le stesse cifre una volta tolti
// separatori, spazi e simboli/codici di valuta; (4) il localStorage risulti identico dopo gli stessi passaggi.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const { load, runIn, evalIn } = require("./lib/sandbox");
const A = path.resolve(process.argv[2] || ""), B = path.resolve(process.argv[3] || path.join(__dirname, ".."));
if (!process.argv[2]) { console.error("Uso: node tests/compare-numeric-v095.js <vecchia> [<nuova>]"); process.exit(2); }
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL " + m); } };

// 1) file che NON devono cambiare (formule, costanti, tabelle regionali, profilo, preferenze, storage, SRB)
const PROTECTED = ["js/income.js", "js/config.js", "js/countries.js", "js/player.js", "js/storage.js", "js/prefs.js", "js/calculator.js",
    "js/playerEngine.js", "js/strategy.js", "js/advice.js", "js/assistant.js", "js/explorer.js", "js/i18n.js", "js/abtips.js", "js/settings.js", "js/sharecard.js"];
const sha = (root, f) => fs.existsSync(path.join(root, f)) ? crypto.createHash("sha256").update(fs.readFileSync(path.join(root, f))).digest("hex") : null;
for (const f of PROTECTED) ok(sha(A, f) === sha(B, f), "file protetto modificato: " + f);
console.log("file protetti byte-identici: " + PROTECTED.filter(f => sha(A, f) === sha(B, f)).length + "/" + PROTECTED.length);

// 2-4) scenari
const base = { profile: { name: "Test" }, badges: 12, mayorTarget: 0, passes: { explorer: false, mission: false }, settings: { dailyLoginAB: 50, abBalance: 340 } };
const mkGoal = (type, extra) => Object.assign({ type, incomeTargetUSD: 1, incomeTargetBoosted: true, landsTarget: 0 }, extra || {});
// terreni da poche decine a 200.000: importi giornalieri/mensili/annui/SRB da < 1 a 6+ cifre
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
const combos = [["it", "EUR"], ["it", "USD"], ["en", "EUR"], ["en", "USD"]];
const Q_IT = ["Cosa conviene comprare?", "Quanto manca al mio obiettivo?", "Quanto guadagno?", "e se avessi 150 badge?", "e se avessi 300 terreni?", "quanto rendo con il super potenziamento (srb)?", "quanto renderei con 200.000 terreni durante l'srb?"];
const Q_EN = ["What should I buy?", "How much do I earn?", "What if I had 80 badges?", "What if I had 700 lands?", "what would my rent be during srb with 200,000 parcels?", "srb"];

const EXPR = `(function(){
  const o = {};
  const b = getCurrentBoost(getTotalLands());
  o.num = {
    income: [getDailyIncome(), getMonthlyIncome(), getYearlyIncome(), getBaseDailyIncome(), getBaseMonthlyIncome(), getBaseYearlyIncome(), getSRBDailyIncomeEstimate()],
    conv: [getDailyIncomeConverted(), getMonthlyIncomeConverted(), getYearlyIncomeConverted(), getBaseDailyIncomeConverted(), getBaseMonthlyIncomeConverted(), getBaseYearlyIncomeConverted(), getIncomePerSecondConverted()],
    boost: [getBoostMultiplier(), getBoostPercent(), getTotalLands(), getBadgeBoostPercent(player.badges)],
    srb: (function(){ const v = getSRBView(); return [v.estimateUSD, v.lowUSD, v.highUSD, v.overLimit]; })(),
    srbDetails: getSRBBreakdown(getTotalLands(), player.badges, b),
    fx: [0, 0.004, 1, 123.45, 1234.56, 54321.09, 987654.32].map(function (v) { return [convertToDisplay(v), convertFromDisplay(v), convertFromDisplay(v, "EUR"), convertFromDisplay(v, "USD")]; }),
    rate: [CONFIG.exchangeRate, CONFIG.exchangeRateInfo && CONFIG.exchangeRateInfo.usdToEur],
    goal: player.goal.incomeTargetUSD,
    profile: JSON.stringify(player)
  };
  o.strategy = getStrategyModel();
  o.text = {
    shown: [formatCurrency(getDailyIncomeConverted()), formatCurrency(getMonthlyIncomeConverted()), formatCurrency(getYearlyIncomeConverted()), formatCurrencyPrecise(getIncomePerSecondConverted()),
            formatStrategyMoney(getDailyIncome()), formatStrategyMoney(getYearlyIncome()),
            formatCurrency(convertToDisplay(getSRBDailyIncomeEstimate() * 30)), formatCurrency(convertToDisplay(getSRBDailyIncomeEstimate() * 365))],   // SRB mensile/annuo come nelle risposte dell'assistente (fino a 6 cifre)
    srb: (function(){ const d = getSRBDisplay(); return [d.estimate, d.low, d.high, d.hasRange]; })(),
    assistant: QUESTIONS.map(function (q) { return getAssistantReply(q); }),
    tips: getABSourceTips().map(function (x) { return x.icon; })
  };
  return o;
})()`;

const norm = s => String(s).replace(/[\s\u00a0\u202f.,$€]|USD|EUR/g, "");
const leaves = (o, p, out) => { if (Array.isArray(o)) o.forEach((v, i) => leaves(v, p + "[" + i + "]", out)); else if (o && typeof o === "object") Object.keys(o).forEach(k => leaves(o[k], p + "." + k, out)); else out.push([p, o]); return out; };

function run(root, sc) {
    const data = Object.assign({}, base, { badges: sc.p.badges || base.badges, mayorTarget: sc.p.mayorTarget || 0 }, { lands: sc.p.lands, goal: sc.p.goal });
    const h = load({ root, store: { aeLang: sc.lang, aeCurrency: sc.cur, aePrefsMigration: "1", aeCountryGroup: sc.group, aeCompanionData: JSON.stringify(data) }, navLang: sc.lang });
    const out = evalIn(h, EXPR.replace("QUESTIONS", JSON.stringify(sc.lang === "it" ? Q_IT : Q_EN)));
    out.store = JSON.parse(JSON.stringify(h.store));
    return out;
}

let n = 0, numLeaves = 0, textLeaves = 0, errors = 0;
const digitBuckets = {};   // cifre intere degli importi giornalieri/annui/SRB mostrati (versione nuova), per documentare la copertura
for (const group of groups) for (const [lang, cur] of combos) for (const p of profiles) {
    const sc = { group, lang, cur, p }, tag = group + " " + lang + "/" + cur + " " + p.n;
    let a, b;
    try { a = run(A, sc); b = run(B, sc); } catch (e) { errors++; ok(false, "errore sandbox " + tag + ": " + e.message); continue; }
    n++;
    // numeri: identici (===), nessuna tolleranza
    const la = leaves({ num: a.num, strategy: a.strategy }, "", []), lb = leaves({ num: b.num, strategy: b.strategy }, "", []);
    ok(la.length === lb.length, tag + ": struttura dei dati diversa (" + la.length + " vs " + lb.length + ")");
    for (let i = 0; i < Math.min(la.length, lb.length); i++) {
        const [pa, va] = la[i], [pb, vb] = lb[i];
        if (typeof va === "number" || typeof vb === "number") { numLeaves++; ok(pa === pb && Object.is(va, vb), tag + ": numero diverso in " + pa + " (" + va + " -> " + vb + ")"); }
        else { textLeaves++; ok(pa === pb && norm(va) === norm(vb), tag + ": testo diverso (oltre alla formattazione) in " + pa + " (" + va + " -> " + vb + ")"); }
    }
    // testi mostrati: stesse cifre
    const ta = leaves(a.text, "", []), tb = leaves(b.text, "", []);
    ok(ta.length === tb.length, tag + ": struttura dei testi diversa");
    for (let i = 0; i < Math.min(ta.length, tb.length); i++) { textLeaves++; ok(norm(ta[i][1]) === norm(tb[i][1]), tag + ": testo mostrato diverso (oltre alla formattazione) in " + ta[i][0] + ": " + ta[i][1] + " -> " + tb[i][1]); }
    // localStorage identico (nessuna chiave nuova, nessun valore cambiato)
    ok(JSON.stringify(a.store) === JSON.stringify(b.store), tag + ": localStorage diverso");
    // copertura: cifre intere degli importi mostrati dalla versione nuova
    for (const s of b.text.shown.concat(b.text.srb.slice(0, 3))) {
        const m = String(s).replace(/[\u00a0\u202f]/g, " ").match(/\d[\d.,]*/); if (!m) continue;
        const intPart = lang === "it" ? m[0].split(",")[0].replace(/\./g, "") : m[0].split(".")[0].replace(/,/g, "");
        const k = intPart.replace(/^0+(?=\d)/, "").length + (intPart === "0" ? "(<1)" : ""); digitBuckets[k] = (digitBuckets[k] || 0) + 1;
    }
}
console.log("scenari: " + n + " (" + groups.length + " gruppi Paese x " + combos.length + " lingua/valuta x " + profiles.length + " profili), errori: " + errors);
console.log("valori numerici grezzi confrontati con ===: " + numLeaves + "; testi confrontati (cifre, senza formattazione): " + textLeaves);
console.log("copertura importi mostrati per cifre intere: " + Object.keys(digitBuckets).sort().map(k => k + "=" + digitBuckets[k]).join(", "));
console.log((fail ? "FAIL" : "PASS") + " confronto numerico v0.9.4 -> v0.9.5: " + pass + " controlli superati, " + fail + " falliti");
process.exit(fail ? 1 : 0);
