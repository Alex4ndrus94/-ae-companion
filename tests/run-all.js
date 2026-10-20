// Esegue tutti i test del progetto. Uso: node tests/run-all.js [cartella-v0.8.1-originale]
// Se si passa la cartella della versione precedente viene eseguito anche il confronto di regressione.
// Con la v0.9.4 come base (v0.9.5): node tests/run-all.js <cartella-v0.9.4> --srb-text=same
const { spawnSync } = require("child_process"), path = require("path");
const root = path.join(__dirname, "..");
const jobs = [["check-seo.js"], ["check-lang-privacy.js"], ["check-prefs-currency.js"], ["check-parser.js"], ["check-i18n.js"], ["check-srb.js"], ["check-srb-range.js"], ["check-srb-routing.js"], ["check-srb-v094.js"], ["check-money-format.js"]];
if (process.argv[2]) jobs.push(["regression-compare.js", path.resolve(process.argv[2]), root, "--money-format=normalized"].concat(process.argv[3] ? [process.argv[3]] : []));
// v0.9.5: confronto dei valori numerici tra la versione precedente e questa (la formattazione puo' cambiare, i numeri no)
if (process.argv[2]) jobs.push(["compare-numeric-v095.js", path.resolve(process.argv[2]), root]);
let failed = 0;
for (const [f, ...args] of jobs) {
    const r = spawnSync("node", [path.join(__dirname, f), ...args], { encoding: "utf8" });
    const lines = r.stdout.trim().split("\n");
    console.log((r.status === 0 ? "OK   " : "FAIL ") + f + "  ->  " + lines[lines.length - 1]);
    if (r.status !== 0) { failed++; console.log(lines.filter(l => /^(FAIL|DIFF|ERRORE)/.test(l)).join("\n")); }
}
console.log(failed ? "\n" + failed + " suite fallite" : "\nTutte le suite superate");
process.exit(failed ? 1 : 0);
