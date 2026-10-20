// Smoke test in browser reale (Chromium headless via puppeteer-core). OPZIONALE: non e' Safari/iOS.
// Uso: PUPPETEER_MODULE=<percorso puppeteer> CHROME_PATH=<percorso chrome> node tests/browser-smoke.js
const path = require("path");
let puppeteer;
try { puppeteer = require(process.env.PUPPETEER_MODULE || "puppeteer-core"); } catch (e) { console.log("SKIP puppeteer non disponibile"); process.exit(0); }
const exe = process.env.CHROME_PATH;
const url = "file://" + path.join(__dirname, "..", "index.html");
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? "PASS " : "FAIL ") + m); };
(async () => {
    const browser = await puppeteer.launch({ executablePath: exe, headless: "shell", args: ["--no-sandbox", "--allow-file-access-from-files"] });
    const errors = [];
    async function open(prefs, nav) {
        const bctx = await (browser.createBrowserContext ? browser.createBrowserContext() : browser.createIncognitoBrowserContext());   // storage isolato per scenario
        const page = await bctx.newPage();
        page.on("pageerror", e => errors.push(e.message));
        await page.setRequestInterception(true);
        page.on("request", r => (r.url().startsWith("file:") ? r.continue() : r.abort()));
        if (nav) await page.evaluateOnNewDocument(n => Object.defineProperty(navigator, "language", { get: () => n }), nav);
        if (prefs) await page.evaluateOnNewDocument(p => { if (!sessionStorage.__seeded) { Object.keys(p).forEach(k => localStorage.setItem(k, p[k])); sessionStorage.__seeded = "1"; } }, prefs);
        await page.goto(url, { waitUntil: "load" });
        return page;
    }
    const data = JSON.stringify({ profile: { name: "Ale" }, lands: { common: 40, rare: 20, epic: 10, legendary: 2 }, badges: 12, mayorTarget: 0,
        passes: { explorer: false, mission: false }, goal: { type: "efficiency", incomeTargetUSD: 1, incomeTargetBoosted: true, landsTarget: 0 }, settings: { dailyLoginAB: 50, abBalance: 340 } });

    // 1. nuovo utente, browser italiano: inglese + USD, onboarding aperto
    let p = await open(null, "it-IT");
    ok(await p.$eval("html", e => e.lang) === "en", "nuovo utente (browser it-IT): html lang=en");
    ok(await p.evaluate(() => getCurrency()) === "USD", "nuovo utente: valuta USD");
    ok(await p.$eval("#settings-overlay", e => e.classList.contains("open")), "onboarding aperto al primo avvio");
    ok(await p.$eval("#country-input", e => e.value) === "", "cluster: nessuna scelta preselezionata (serve scelta esplicita)");
    ok(await p.$eval("#country-suggestion", e => getComputedStyle(e).display !== "none"), "cluster: riquadro suggerimento visibile");
    await p.close();

    // 2. utente esistente italiano con EUR: dopo il caricamento vede EUR e IT
    p = await open({ aeCompanionData: data, aeLang: "it", aeCountryGroup: "EU_WEST" }, "it-IT");
    ok(await p.$eval("html", e => e.lang) === "it", "utente esistente IT: html lang=it");
    ok(/€/.test(await p.$eval("#dailyIncome", e => e.textContent)), "utente esistente IT: importi in EUR");
    ok(!(await p.$eval("#settings-overlay", e => e.classList.contains("open"))), "utente esistente: nessun onboarding");
    // cambio solo lingua -> valuta invariata
    await p.click('.lang-btn[data-lang="en"]');
    ok(await p.$eval("html", e => e.lang) === "en" && /€/.test(await p.$eval("#dailyIncome", e => e.textContent)), "cambio lingua IT->EN: html lang=en, importi ancora in EUR");
    ok(await p.evaluate(() => localStorage.getItem("aeCountryGroup")) === "EU_WEST", "cluster invariato dopo il cambio lingua");
    // impostazioni: cambia valuta in USD, annulla -> nessun salvataggio
    await p.click(".edit-btn");
    await p.select("#currency-input", "USD");
    await p.click("#settings-cancel");
    ok(await p.evaluate(() => localStorage.getItem("aeCurrency")) === "EUR", "Annulla impostazioni: valuta non salvata");
    // di nuovo, salva
    await p.click(".edit-btn");
    await p.select("#currency-input", "USD");
    await p.click(".btn-save");
    ok(await p.evaluate(() => localStorage.getItem("aeCurrency")) === "USD" && /\$/.test(await p.$eval("#dailyIncome", e => e.textContent)), "Salva: valuta USD salvata e mostrata");
    ok(await p.evaluate(() => localStorage.getItem("aeLang")) === "en", "cambio valuta: lingua invariata");
    // ricaricamento: preferenze mantenute
    await p.reload({ waitUntil: "load" });
    ok(await p.evaluate(() => [getCurrency(), getCurrentLanguage()].join()) === "USD,en", "ricaricamento: USD + EN mantenuti");
    await p.close();

    // 3. cluster: nessun salvataggio senza conferma; conferma + salva
    p = await open({ aeCompanionData: data, aeLang: "en" }, "en-GB");
    ok(await p.evaluate(() => localStorage.getItem("aeCountryGroup")) === null, "cluster non salvato automaticamente all'avvio");
    await p.click(".edit-btn");
    await p.click("#country-suggestion-btn");
    ok(await p.evaluate(() => localStorage.getItem("aeCountryGroup")) === null, "suggerimento accettato ma non ancora salvato (bozza)");
    await p.click(".btn-save");
    ok(await p.evaluate(() => localStorage.getItem("aeCountryGroup")) === "UK_CA_AU_ZA_IE_NZ", "dopo Salva il cluster suggerito e' persistito");
    // assistente: cambio lingua rigenera il messaggio
    await p.evaluate(() => { document.getElementById("assistant-input").value = "300 terreni"; sendAssistantMessage(); });
    await new Promise(r => setTimeout(r, 600));
    await p.evaluate(() => setLanguage("it"));
    const last = await p.$$eval(".chat-bubble.bot", els => els[els.length - 1].textContent);
    ok(/terreni/.test(last), "assistente: la risposta e' stata rigenerata in italiano al cambio lingua");
    ok(errors.length === 0, "nessun errore JavaScript nella pagina" + (errors.length ? ": " + errors.join(" | ") : ""));
    await browser.close();
    console.log("\nbrowser-smoke: " + pass + " ok, " + fail + " falliti");
    process.exit(fail ? 1 : 0);
})().catch(e => { console.log("ERRORE", e.message); process.exit(1); });
