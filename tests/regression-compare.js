// Confronto di regressione tra due cartelle di progetto (es. v0.8 e v0.8.1).
// Uso: node tests/regression-compare.js <cartella-vecchia> <cartella-nuova>
// Carica i JS di logica in una sandbox (vm) con localStorage/Date finti e confronta
// rendita, boost, strategia (4 obiettivi), assistente e consigli AB in piu' scenari.
const fs = require("fs"), path = require("path"), vm = require("vm");
const [A, B] = process.argv.slice(2);
if (!A || !B) { console.error("Uso: node tests/regression-compare.js <vecchia> <nuova>"); process.exit(2); }
const FILES = ["config", "i18n", "countries", "player", "explorer", "storage", "playerEngine", "strategy", "calculator", "income", "advice", "assistant", "abtips", "components"];
const FIXED = Date.UTC(2026, 9, 9, 10, 0, 0);

function run(root, scenario) {
  const store = { aeLang: scenario.lang, aeCountryGroup: scenario.group, aeCompanionData: JSON.stringify(scenario.data) };
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
  const code = FILES.map(f => fs.readFileSync(path.join(root, "js", f + ".js"), "utf8")).join("\n;\n");
  vm.runInContext(code + `
;this.__out = (function(){
  const o = {};
  o.income = [getDailyIncome(), getMonthlyIncome(), getYearlyIncome(), getBaseDailyIncome(), getBaseMonthlyIncome(), getBaseYearlyIncome(), getSRBDailyIncomeEstimate()];
  o.conv = [getDailyIncomeConverted(), getMonthlyIncomeConverted(), getYearlyIncomeConverted(), getIncomePerSecondConverted(), formatCurrency(getDailyIncomeConverted())];
  o.boost = [getBoostMultiplier(), getBoostPercent(), getTotalLands(), getBadgeBoostPercent(player.badges), getBracketTransitionRecovery(getTotalLands())];
  o.strategy = getStrategyModel();
  o.assistant = ["Cosa conviene comprare?", "Quanto manca al mio obiettivo?", "Quanto guadagno?", "What should I buy?", "How much do I earn?"].map(q => getAssistantReply(q));
  o.tips = getABSourceTips();
  return JSON.parse(JSON.stringify(o));
})();`, ctx);
  return ctx.__out;
}

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
  try { a = JSON.stringify(run(A, sc)); b = JSON.stringify(run(B, sc)); } catch (e) { if (!bad) console.log("ERRORE sandbox:", e.message); bad++; continue; }
  if (a !== b) { bad++; console.log("DIFF", g, lang, p.goal.type); }
}
console.log((bad ? "FAIL" : "PASS") + " regressione: " + (n - bad) + "/" + n + " scenari identici (" + groups.length + " gruppi Paese x 2 lingue x " + profiles.length + " profili)");
process.exit(bad ? 1 : 0);
