// Esegue tutti i test del progetto. Uso: node tests/run-all.js [cartella-v0.9.5-originale]
// Se si passa la cartella della v0.9.5 viene eseguito anche il confronto v0.9.5 -> v0.10.0 (tests/compare-v0100.js).
// NOTA v0.10.0: regression-compare.js e compare-numeric-v095.js confrontano coppie di versioni precedenti (v0.9.x) con una
// lista di file fissa e con i file protetti di allora (config.js, i18n.js, settings.js... che ora cambiano per scelta):
// restano nel repository come storico ma NON sono eseguiti qui; li sostituisce compare-v0100.js (vedi docs/15-REPORT-FASE2-v0.10.0.md).
const { spawnSync } = require("child_process"), path = require("path");
const root = path.join(__dirname, "..");
const jobs = [["check-seo.js"], ["check-lang-privacy.js"], ["check-prefs-currency.js"], ["check-parser.js"], ["check-i18n.js"], ["check-srb.js"], ["check-srb-range.js"], ["check-srb-routing.js"], ["check-srb-v094.js"], ["check-money-format.js"], ["check-fx.js"]];
if (process.argv[2]) jobs.push(["compare-v0100.js", path.resolve(process.argv[2]), root]);
let failed = 0;
for (const [f, ...args] of jobs) {
    const r = spawnSync("node", [path.join(__dirname, f), ...args], { encoding: "utf8" });
    const lines = r.stdout.trim().split("\n");
    console.log((r.status === 0 ? "OK   " : "FAIL ") + f + "  ->  " + lines[lines.length - 1]);
    if (r.status !== 0) { failed++; console.log(lines.filter(l => /^(FAIL|DIFF|ERRORE)/.test(l)).join("\n")); }
}
console.log(failed ? "\n" + failed + " suite fallite" : "\nTutte le suite superate");
process.exit(failed ? 1 : 0);
