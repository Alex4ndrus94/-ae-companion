// Test F (+ parte di G): traduzioni, placeholder, lang HTML, contenuti dinamici, link locali, hreflang.
const fs = require("fs"), path = require("path");
const { load, runIn, suite } = require("./lib/sandbox");
const T = suite("i18n");
const ROOT = path.join(__dirname, "..");
const DATA = JSON.stringify({ profile: { name: "T" }, lands: { common: 40, rare: 20, epic: 10, legendary: 2 }, badges: 12, mayorTarget: 0,
    passes: { explorer: false, mission: false }, goal: { type: "income", incomeTargetUSD: 5, incomeTargetBoosted: true, landsTarget: 0 }, settings: { dailyLoginAB: 50, abBalance: 340 } });
const h = load({ store: { aeLang: "en", aeCurrency: "USD", aePrefsMigration: "1", aeCompanionData: DATA, aeCountryGroup: "EU_WEST" } });
const tr = JSON.parse(runIn(h, "JSON.stringify(translations)"));
const langs = Object.keys(tr);

console.log("== F. Chiavi e placeholder");
T.eq(langs.sort(), ["en", "it"], "lingue supportate: it, en");
const ph = s => (String(s).match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
const missing = [], badPh = [];
for (const k of Object.keys(tr.it)) { if (!(k in tr.en)) missing.push("en:" + k); else if (JSON.stringify(ph(tr.it[k])) !== JSON.stringify(ph(tr.en[k]))) badPh.push(k); }
for (const k of Object.keys(tr.en)) if (!(k in tr.it)) missing.push("it:" + k);
T.eq(missing, [], "ogni chiave presente in entrambe le lingue");
T.eq(badPh, [], "placeholder {x} identici tra IT e EN per ogni chiave");
const src = fs.readFileSync(path.join(ROOT, "js/i18n.js"), "utf8");
for (const l of langs) {
    const block = src.slice(src.indexOf("    " + l + ": {"), l === "it" ? src.indexOf("    en: {") : src.length);
    const keys = (block.match(/^\s{8}([A-Za-z0-9_]+):/gm) || []).map(x => x.trim().replace(":", ""));
    const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
    T.eq(dup, [], "nessuna chiave duplicata in " + l);
}
// chiavi usate dal codice esistenti
const used = new Set();
for (const f of fs.readdirSync(path.join(ROOT, "js"))) {
    const code = fs.readFileSync(path.join(ROOT, "js", f), "utf8");
    for (const m of code.matchAll(/\bt\(\s*["']([A-Za-z0-9_]+)["']\s*[,)]/g)) used.add(m[1]);
}
for (const m of fs.readFileSync(path.join(ROOT, "index.html"), "utf8").matchAll(/data-i18n(?:-placeholder)?="([A-Za-z0-9_]+)"/g)) used.add(m[1]);
T.eq([...used].filter(k => !(k in tr.en)), [], "tutte le chiavi usate in js/ e index.html esistono in EN");
T.eq([...used].filter(k => !(k in tr.it)), [], "tutte le chiavi usate in js/ e index.html esistono in IT");
T.ok(["currencyOptionEUR", "currencyOptionUSD"].every(k => k in tr.it && k in tr.en), "chiavi valuta (costruite dinamicamente) presenti in IT e EN");

console.log("\n== F. Lang HTML e contenuti dinamici");
const lh = load({ store: { aeLang: "it", aeCurrency: "EUR", aePrefsMigration: "1", aeCompanionData: DATA, aeCountryGroup: "EU_WEST" } });
runIn(lh, "applyTranslations()");
T.ok(runIn(lh, "document.documentElement.lang") === "it", "html lang = it con lingua italiana");
runIn(lh, "setLanguage('en')");
T.ok(runIn(lh, "document.documentElement.lang") === "en", "html lang = en dopo il cambio lingua");
// assistente: il messaggio del bot cambia lingua senza cambiare il numero
const dyn = load({ store: { aeLang: "it", aeCurrency: "EUR", aePrefsMigration: "1", aeCompanionData: DATA, aeCountryGroup: "EU_WEST" } });
const itReply = runIn(dyn, "getAssistantReply('300 terreni')");
runIn(dyn, "setLanguage('en')");
const enReply = runIn(dyn, "getAssistantReply('300 terreni')");
T.ok(/terreni/.test(itReply) && /lands/.test(enReply) && !/terreni/.test(enReply), "risposta assistente rigenerata nella lingua attiva");
const num = s => (s.match(/[\d.,]+\s?(?:€|\$|USD|EUR)|[€$][\d.,]+/g) || []).length;
T.ok(runIn(dyn, "getCurrency()") === "EUR" && /€/.test(enReply), "dopo il cambio lingua gli importi restano in EUR (valuta indipendente)");
const eu = JSON.stringify(JSON.parse(runIn(dyn, "JSON.stringify(getStrategyModel())")));
T.ok(!/\bstrategy[A-Z][A-Za-z]+\b/.test(eu), "strategia: nessuna chiave tecnica mostrata all'utente (EN)");
const tipsText = JSON.parse(runIn(dyn, "JSON.stringify(getABSourceTips().map(x=>x.text))")).join(" ");
T.ok(!/\bsrb[A-Z]|abTip[A-Z]/.test(tipsText), "consigli Extra AB: nessuna chiave tecnica mostrata");
// l'assistente conserva la cronologia strutturata
T.ok(runIn(dyn, "typeof refreshAssistantMessages === 'function' && Array.isArray(assistantHistory)"), "cronologia assistente strutturata + rigenerazione disponibili");
// nessun testo hardcoded dipendente dalla lingua nel dashboard
const app = fs.readFileSync(path.join(ROOT, "js/app.js"), "utf8");
T.ok(!/"giorno"\s*:\s*"day"/.test(app), "app.js non contiene piu' 'giorno'/'day' hardcoded");
const hard = [];
for (const f of fs.readdirSync(path.join(ROOT, "js"))) {
    if (/^(i18n|countries)\.js$/.test(f)) continue;
    const code = fs.readFileSync(path.join(ROOT, "js", f), "utf8");
    if (/getCurrentLanguage\(\)\s*===\s*"it"\s*\?\s*(CONFIG\.exchangeRate|"EUR")/.test(code) || /currency:\s*lang\s*===/.test(code)) hard.push(f);
}
T.eq(hard, [], "nessuna dipendenza valuta<-lingua residua nel codice");

console.log("\n== G. Link locali, hreflang, percorsi");
const pages = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "docs" || e.name === "tests") continue;
    const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith(".html")) pages.push(p); } })(ROOT);
let broken = [], hre = [];
for (const p of pages) {
    const html = fs.readFileSync(p, "utf8");
    for (const m of html.matchAll(/(?:href|src)="([^"#?]+)"/g)) {
        const u = m[1];
        if (/^(https?:)?\/\//.test(u) || u.startsWith("mailto:") || u.startsWith("data:") || u.startsWith("javascript")) continue;
        if (u.startsWith("/-ae-companion/")) continue;
        let target = u.startsWith("/") ? path.join(ROOT, u) : path.join(path.dirname(p), u);
        if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
        if (!fs.existsSync(target)) broken.push(path.relative(ROOT, p) + " -> " + u);
    }
    for (const m of html.matchAll(/<link[^>]+hreflang[^>]*>/g)) hre.push(path.relative(ROOT, p) + ": " + m[0]);
}
T.eq(broken, [], "link/risorse locali tutti raggiungibili (" + pages.length + " pagine HTML)");
T.eq(hre, [], "nessun hreflang presente (non esistono URL linguistici distinti: nessuna dichiarazione inventata)");
const sm = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
T.ok(locs.every(u => u.startsWith("https://alex4ndrus94.github.io/-ae-companion/")), "sitemap: tutti gli URL sotto il sottopercorso /-ae-companion/");
T.ok(!locs.some(u => /\/(en|it)\//.test(u.replace("https://alex4ndrus94.github.io/-ae-companion/", "/"))), "sitemap: nessuna pagina linguistica inesistente");
T.done();
