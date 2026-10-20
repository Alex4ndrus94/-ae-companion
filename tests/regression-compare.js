// Confronto di regressione tra due cartelle di progetto (es. v0.9.1 e v0.9.2).
// Uso: node tests/regression-compare.js <cartella-vecchia> <cartella-nuova>
// Carica i JS di logica in una sandbox (vm) con localStorage/Date finti e confronta
// rendita, boost, strategia (4 obiettivi), assistente e consigli AB in piu' scenari.
const fs = require("fs"), path = require("path"), vm = require("vm");
const [A, B] = process.argv.slice(2).filter(a => !a.startsWith("--"));
// --srb-text=same: la vecchia versione ha GIA' i testi SRB di v0.9.2 (confronto v0.9.2 -> v0.9.3): la risposta SRB generica deve restare IDENTICA.
// Senza flag (confronto con v0.9.1) il testo SRB generico deve invece essere cambiato.
const SRB_SAME = process.argv.includes("--srb-text=same");
// --money-format=normalized (v0.9.5): la vecchia versione formatta gli importi in modo diverso (it-IT: nessun separatore delle migliaia a 4 cifre).
// Nei TESTI si ignorano solo separatori, spazi e simboli/codici di valuta: cifre e numeri (valori grezzi) devono restare identici.
const MONEY_NORM = process.argv.includes("--money-format=normalized");
const normStr = x => MONEY_NORM ? String(x).replace(/[\s\u00a0\u202f.,$€]|USD|EUR/g, "") : String(x);
const normDeep = o => Array.isArray(o) ? o.map(normDeep) : (o && typeof o === "object") ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, normDeep(v)])) : (typeof o === "string" ? normStr(o) : o);
if (!A || !B) { console.error("Uso: node tests/regression-compare.js <vecchia> <nuova>"); process.exit(2); }
const FILES = ["config", "prefs", "i18n", "money", "countries", "player", "explorer", "storage", "playerEngine", "strategy", "calculator", "income", "advice", "assistant", "abtips", "components"];
const FIXED = Date.UTC(2026, 9, 9, 10, 0, 0);

function run(root, scenario) {
  // aeCurrency/aePrefsMigration sono ignorati dalla v0.8.1 e riproducono, nella nuova, la valuta che la vecchia mostrava (IT=EUR, EN=USD)
  const store = { aeLang: scenario.lang, aeCountryGroup: scenario.group, aeCompanionData: JSON.stringify(scenario.data), aeCurrency: scenario.lang === "it" ? "EUR" : "USD", aePrefsMigration: "1" };
  class FD extends Date { constructor(...a) { super(...(a.length ? a : [FIXED])); } static now() { return FIXED; } }
  const el = () => ({ style: {}, classList: { toggle() {}, add() {}, remove() {} }, setAttribute() {}, appendChild() {}, innerHTML: "", textContent: "" });
  const ctx = {
    console: { log() {}, error() {}, warn() {} }, Date: FD, Intl, Math, JSON, Object, Array, Number, String, parseInt, parseFloat, isNaN,
    navigator: { language: scenario.lang },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem(k, v) { store[k] = String(v); } },
    document: { documentElement: {}, title: "", querySelectorAll: () => [], querySelector: () => null, getElementById: () => null, createElement: el, addEventListener() {} },
    window: { addEventListener() {}, matchMedia: () => ({ matches: false }) }
  };
  vm.createContext(ctx);
  const code = FILES.filter(f => fs.existsSync(path.join(root, "js", f + ".js"))).map(f => fs.readFileSync(path.join(root, "js", f + ".js"), "utf8")).join("\n;\n");
  vm.runInContext(code + `
;this.__out = (function(){
  const o = {};
  o.income = [getDailyIncome(), getMonthlyIncome(), getYearlyIncome(), getBaseDailyIncome(), getBaseMonthlyIncome(), getBaseYearlyIncome(), getSRBDailyIncomeEstimate()];
  o.conv = [getDailyIncomeConverted(), getMonthlyIncomeConverted(), getYearlyIncomeConverted(), getIncomePerSecondConverted(), formatCurrency(getDailyIncomeConverted())];
  o.boost = [getBoostMultiplier(), getBoostPercent(), getTotalLands(), getBadgeBoostPercent(player.badges), getBracketTransitionRecovery(getTotalLands())];
  o.strategy = getStrategyModel();
  o.assistant = ["Cosa conviene comprare?", "Quanto manca al mio obiettivo?", "Quanto guadagno?", "What should I buy?", "How much do I earn?", "e se avessi 150 badge?", "e se avessi 300 terreni?", "What if I had 80 badges?", "What if I had 700 lands?", "quanti badge mancano?"].map(q => getAssistantReply(q));
  o.tips = getABSourceTips().map(x => x.icon);
  // v0.9.2: la risposta SRB dell'assistente e' l'UNICA parte che deve cambiare (testi + intervallo); la tengo separata
  o.srbReply = ["quanto rendo con il super potenziamento (srb)?", "srb"].map(q => getAssistantReply(q));
  // v0.9.3: domande SRB con profilo ipotetico (instradate al calcolo SRB; prima ai what-if ordinari): cambiano di proposito
  o.srbHypo = ["quanto renderei con 200.000 terreni durante l'srb?", "what would my rent be during srb with 200,000 parcels?"].map(q => getAssistantReply(q));
  return JSON.parse(JSON.stringify(o));
})();`, ctx);
  return ctx.__out;
}

// Il confronto ignora SOLO o.srbReply (testo SRB dell'assistente, cambiato di proposito in v0.9.2)
const strip0 = o => { const c = JSON.parse(JSON.stringify(o)); delete c.srbReply; delete c.srbHypo; return JSON.stringify(MONEY_NORM ? normDeep(c) : c); };

const base = { profile: { name: "Test" }, badges: 12, mayorTarget: 0, passes: { explorer: false, mission: false }, settings: { dailyLoginAB: 50, abBalance: 340 } };
const profiles = [
  { lands: { common: 40, rare: 20, epic: 10, legendary: 2 }, goal: { type: "efficiency", incomeTargetUSD: 1, incomeTargetBoosted: true, landsTarget: 0 } },
  { lands: { common: 120, rare: 60, epic: 30, legendary: 8 }, goal: { type: "income", incomeTargetUSD: 5, incomeTargetBoosted: true, landsTarget: 0 } },
  { lands: { common: 90, rare: 40, epic: 25, legendary: 5 }, goal: { type: "lands", incomeTargetUSD: 1, incomeTargetBoosted: false, landsTarget: 400 } },
  { lands: { common: 30, rare: 15, epic: 8, legendary: 1 }, goal: { type: "mayor", incomeTargetUSD: 1, incomeTargetBoosted: true, landsTarget: 0 }, mayorTarget: 220 },
  { lands: { common: 60, rare: 30, epic: 15, legendary: 3 }, goal: { type: "efficiency", incomeTargetUSD: 1, incomeTargetBoosted: true, landsTarget: 0 }, passes: { explorer: true, mission: true },
    explorer: { startDate: "2026-09-01", endDate: null, confirmedDay: 0, lastConfirmedRewardDate: null, addToBalance: true, claimed: {}, history: [] } }
];
const groups = ["US", "UK_CA_AU_ZA_IE_NZ", "EU_WEST", "NORDIC", "SE_ASIA", "ASIA_GULF", "BRAZIL", "MEXICO"];
let n = 0, bad = 0;
for (const g of groups) for (const lang of ["it", "en"]) for (const p of profiles) {
  const sc = { lang, group: g, data: Object.assign({}, base, p) };
  n++;
  let a, b;
  try { a = strip0(run(A, sc)); b = strip0(run(B, sc)); } catch (e) { if (!bad) console.log("ERRORE sandbox:", e.message); bad++; continue; }
  if (a !== b) { bad++; console.log("DIFF", g, lang, p.goal.type); }
}
console.log((bad ? "FAIL" : "PASS") + " regressione: " + (n - bad) + "/" + n + " scenari identici (" + groups.length + " gruppi Paese x 2 lingue x " + profiles.length + " profili)");

// ---- Casi di confine SRB (v0.9.2): la formula SRB NON cambia, quindi anche oltre 150.000 terreni tutti i valori numerici restano identici;
//      cambia solo il testo della risposta SRB dell'assistente (o.srbReply) ----
const goal = { type: "efficiency", incomeTargetUSD: 1, incomeTargetBoosted: true, landsTarget: 0 };
const edge = [
  { name: "149.999", lands: { common: 149999, rare: 0, epic: 0, legendary: 0 } },
  { name: "150.000", lands: { common: 150000, rare: 0, epic: 0, legendary: 0 } },
  { name: "150.000 misti", lands: { common: 75000, rare: 45000, epic: 22500, legendary: 7500 } },
  { name: "150.001", lands: { common: 150001, rare: 0, epic: 0, legendary: 0 } },
  { name: "150.100", lands: { common: 150100, rare: 0, epic: 0, legendary: 0 } },
  { name: "200.000 misti", lands: { common: 100000, rare: 60000, epic: 30000, legendary: 10000 } }
];
let m = 0, badEdge = 0, hypoChanged = 0, hypoTot = 0;
for (const e of edge) for (const lang of ["it", "en"]) for (const g of ["US", "EU_WEST", "SE_ASIA"]) {
  const sc = { lang, group: g, data: Object.assign({}, base, { lands: e.lands, goal }) };
  m++;
  let a, b;
  try { a = run(A, sc); b = run(B, sc); } catch (err) { console.log("ERRORE sandbox (confine " + e.name + "):", err.message); badEdge++; continue; }
  if (strip0(a) !== strip0(b)) { badEdge++; console.log("DIFF confine", e.name, g, lang, "(atteso identico: la formula SRB non e' cambiata)"); }
  if (SRB_SAME ? normStr(a.srbReply[1]) !== normStr(b.srbReply[1]) : a.srbReply[1] === b.srbReply[1]) { badEdge++; console.log("DIFF confine", e.name, g, lang, SRB_SAME ? "(atteso testo SRB generico identico a v0.9.2)" : "(il testo della risposta SRB deve essere cambiato)"); }
  if (SRB_SAME) { hypoChanged += normStr(a.srbHypo[0]) !== normStr(b.srbHypo[0]) ? 1 : 0; hypoTot++; }
}
console.log((badEdge ? "FAIL" : "PASS") + " confini SRB: " + (m - badEdge) + "/" + m + " scenari come atteso (tutti i numeri identici a v0.9.1; cambia solo il testo SRB dell'assistente)");
if (SRB_SAME) console.log("INFO domanda SRB ipotetica (200.000 terreni): risposta cambiata in " + hypoChanged + "/" + hypoTot + " scenari (atteso: instradamento corretto al calcolo SRB; prima finiva nei what-if ordinari)");
process.exit(bad || badEdge ? 1 : 0);
