// Test v0.9.2: intervallo teorico SRB (UI + assistente), riconoscimento delle domande SRB, nessuna frequenza mensile.
// Uso: node tests/check-srb-range.js
// I valori attesi sono calcolati a mano con le costanti del gioco (NON richiamando le funzioni dell'app):
// rendita/s: common 1,1e-9 | rare 1,6e-9 | epic 2,2e-9 | legendary 4,4e-9; 86400 s/giorno;
// EU_WEST: oltre 400 terreni boost ordinario x2; 12 badge = +10%; cambio fisso indicativo 1 USD = 0,86 EUR.
const { load, evalIn, runIn, suite, ALL_FILES } = require("./lib/sandbox");
const T = suite("srb-range");
const close = (a, b, msg, tol) => T.ok(Math.abs(a - b) <= (tol || 1e-6), msg + "  (atteso " + b + ", ottenuto " + a + ")");
const R = { c: 1.1e-9, r: 1.6e-9, e: 2.2e-9, l: 4.4e-9 }, DAY = 86400;
const UI_FILES = ALL_FILES.concat(["ui", "settings", "strategy-ui", "explorer-ui", "app"]);

function profile(lands, badges, store, files) {
    const data = { profile: { name: "T" }, lands: Object.assign({ common: 0, rare: 0, epic: 0, legendary: 0 }, lands), badges: badges || 0, mayorTarget: 0,
        passes: { explorer: false, mission: false }, goal: { type: "efficiency", incomeTargetUSD: 1, incomeTargetBoosted: true, landsTarget: 0 },
        settings: { dailyLoginAB: 50, abBalance: 0 } };
    return load({ files, store: Object.assign({ aeLang: "en", aeCurrency: "USD", aePrefsMigration: "1", aeCountryGroup: "EU_WEST", aeCompanionData: JSON.stringify(data) }, store || {}) });
}
const view = h => evalIn(h, "getSRBView()");
const disp = h => evalIn(h, "getSRBDisplay()");
const reply = (h, q) => evalIn(h, "getAssistantReply(" + JSON.stringify(q) + ")");
const nb = s => String(s).replace(/\u00a0|\u202f/g, " ");

console.log("== SRB e intervallo: casi di confine");
let h = profile({});
let v = view(h);
close(v.estimateUSD, 0, "1. zero terreni: stima 0"); close(v.lowUSD, 0, "1b. zero terreni: limite inferiore 0"); close(v.highUSD, 0, "1c. zero terreni: limite superiore 0");
T.eq(disp(h).hasRange, false, "1d. zero terreni: nessun intervallo");
h = profile({ common: 1 }); v = view(h);
close(v.estimateUSD, R.c * 50 * DAY, "2. un terreno: stima = 0,004752"); T.ok(v.lowUSD === v.highUSD && v.lowUSD === v.estimateUSD, "2b. un terreno: estremi coincidenti con la stima");
T.eq(disp(h).hasRange, false, "2c. un terreno: nessun intervallo");
h = profile({ common: 75000, rare: 45000, epic: 22500, legendary: 7500 }); v = view(h);
const raw150 = 75000 * R.c + 45000 * R.r + 22500 * R.e + 7500 * R.l;
close(v.estimateUSD, raw150 * 50 * DAY, "3. 150.000 esatti (misti): stima = rendita x50 x 86400");
T.ok(v.lowUSD === v.estimateUSD && v.highUSD === v.estimateUSD, "3b. 150.000 esatti: intervallo coincidente con la stima (identico, non solo vicino)");
T.eq([v.overLimit, disp(h).hasRange], [false, false], "3c. 150.000 esatti: non oltre il limite, nessun intervallo");
// 150.001 con una sola rarita': gli estremi coincidono -> niente intervallo artificiale
h = profile({ common: 150001 }); v = view(h);
close(v.estimateUSD, (150000 * R.c * 50 + 1 * R.c * 2) * DAY, "4. 150.001 common: stima = 712,80019008");
T.ok(Math.abs(v.lowUSD - v.highUSD) < 1e-9, "4b. 150.001 common: estremi coincidenti (una sola rarita')");
T.eq([v.overLimit, disp(h).hasRange], [true, false], "4c. 150.001 common: oltre il limite ma NESSUN intervallo artificiale (estremi coincidenti)");
// 150.001 con rarita' mista: 150.000 common + 1 legendary
h = profile({ common: 150000, legendary: 1 }); v = view(h);
const lowA = (150000 * R.c * 50 + 1 * R.l * 2) * DAY;                 // il legendary sta OLTRE il limite
const highA = ((149999 * R.c + R.l) * 50 + 1 * R.c * 2) * DAY;        // il legendary sta ENTRO il limite
const rawA = 150000 * R.c + R.l, midA = (rawA * (150000 / 150001) * 50 + rawA * (1 / 150001) * 2) * DAY;
close(v.lowUSD, lowA, "4d. 150.001 (150.000 C + 1 L): limite inferiore"); close(v.highUSD, highA, "4e. 150.001 (150.000 C + 1 L): limite superiore"); close(v.estimateUSD, midA, "4f. 150.001 (150.000 C + 1 L): stima centrale proporzionale");
T.ok(v.lowUSD <= v.estimateUSD && v.estimateUSD <= v.highUSD, "4g. inferiore <= centrale <= superiore");
// 150.100: 100.000 common + 50.100 legendary
h = profile({ common: 100000, legendary: 50100 }); v = view(h);
const low5 = ((100000 * R.c + 50000 * R.l) * 50 + 100 * R.l * 2) * DAY;      // 100 legendary oltre il limite
const high5 = (50100 * R.l * 50 - 100 * R.l * 50 + 0 + 99900 * R.c * 50 + 100 * R.c * 2 + 50000 * 0) * DAY;
const high5b = ((50100 * R.l + 99900 * R.c) * 50 + 100 * R.c * 2) * DAY;     // tutti i legendary entro il limite, 100 common oltre
close(v.lowUSD, low5, "5. 150.100: limite inferiore"); close(v.highUSD, high5b, "5b. 150.100: limite superiore");
T.ok(v.lowUSD < v.estimateUSD && v.estimateUSD < v.highUSD, "5c. 150.100: stima strettamente dentro l'intervallo");
T.eq(disp(h).hasRange, true, "5d. 150.100 misti: intervallo mostrato");
// 200.000 misti (50/30/15/5) con e senza badge
h = profile({ common: 100000, rare: 60000, epic: 30000, legendary: 10000 }); v = view(h);
close(v.estimateUSD, 1037.4912, "6. 200.000 misti: centrale 1037,4912"); close(v.lowUSD, 842.5728, "6b. limite inferiore 842,5728"); close(v.highUSD, 1137.024, "6c. limite superiore 1137,024");
h = profile({ common: 100000, rare: 60000, epic: 30000, legendary: 10000 }, 12); v = view(h);
close(v.estimateUSD, 1037.4912 * 1.1, "7. 200.000 misti + 12 badge: centrale x1,10 (bonus una sola volta)"); close(v.lowUSD, 842.5728 * 1.1, "7b. inferiore x1,10"); close(v.highUSD, 1137.024 * 1.1, "7c. superiore x1,10");

console.log("\n== Proprieta' generali su profili diversi");
const mixes = [
    [{ common: 150001, rare: 5000 }, 0], [{ rare: 160000 }, 5], [{ common: 90000, epic: 70000 }, 12], [{ common: 1000, legendary: 149500 }, 30],
    [{ common: 50000, rare: 50000, epic: 50000, legendary: 50000 }, 60], [{ common: 300000, legendary: 3 }, 101], [{ epic: 149999, legendary: 2 }, 11],
    [{ common: 20000, rare: 500, epic: 20, legendary: 3 }, 12], [{ common: 150000 }, 12]
];
mixes.forEach(([L, b], i) => {
    const hh = profile(L, b), vv = view(hh), total = Object.values(L).reduce((a, x) => a + x, 0);
    const bonus = 1 + evalIn(hh, "getBadgeBoostPercent(" + b + ")") / 100;
    T.ok(vv.lowUSD <= vv.estimateUSD && vv.estimateUSD <= vv.highUSD, "8." + (i + 1) + " " + JSON.stringify(L) + " badge " + b + ": inferiore <= centrale <= superiore");
    if (total <= 150000) T.ok(vv.lowUSD === vv.estimateUSD && vv.highUSD === vv.estimateUSD, "9." + (i + 1) + " totale " + total + " <= 150.000: intervallo coincidente con la stima");
    const raw = (L.common || 0) * R.c + (L.rare || 0) * R.r + (L.epic || 0) * R.e + (L.legendary || 0) * R.l;
    const exp = total <= 150000 ? raw * bonus * 50 * DAY : (raw * (150000 / total) * 50 + raw * ((total - 150000) / total) * 2) * bonus * DAY;
    close(vv.estimateUSD, exp, "8b." + (i + 1) + " stima centrale = formula a mano (invariata dalla v0.9.1)", 1e-7);
});

console.log("\n== UI: intervallo mostrato nella dashboard (app.js reale nel sandbox)");
const node = (hh, id) => hh.nodes[id];
let ui = profile({ common: 100000, rare: 60000, epic: 30000, legendary: 10000 }, 12, { aeLang: "en", aeCurrency: "USD" }, UI_FILES);
T.eq(node(ui, "srb-range").hidden, false, "10. oltre 150.000 (misti): riga intervallo visibile");
T.ok(nb(node(ui, "srb-range").textContent).includes("$926.83") && nb(node(ui, "srb-range").textContent).includes("$1,250.73"), "10b. la riga mostra $926.83 e $1,250.73");
T.ok(nb(node(ui, "srb-estimate").textContent).includes("$1,141.24"), "10c. la stima centrale resta $1,141.24");
T.ok(/order/.test(node(ui, "srb-range-note").textContent) && /proportionally/.test(node(ui, "srb-range-note").textContent) && /not a statistical confidence interval/.test(node(ui, "srb-range-note").textContent) && /not a guarantee/.test(node(ui, "srb-range-note").textContent), "10d. nota: ordine sconosciuto, ripartizione proporzionale, non intervallo statistico, non garanzia");
T.eq(node(ui, "srb-range-note").hidden, false, "10e. nota esplicativa visibile");
ui = profile({ common: 75000, rare: 45000, epic: 22500, legendary: 7500 }, 12, {}, UI_FILES);
T.eq([node(ui, "srb-range").hidden, node(ui, "srb-range").textContent, node(ui, "srb-range-note").hidden], [true, "", true], "10f. 150.000 esatti: nessun intervallo ne' nota");
ui = profile({ common: 150100 }, 12, {}, UI_FILES);
T.eq(node(ui, "srb-range").hidden, true, "10g. 150.100 common (estremi coincidenti): nessun intervallo artificiale");
T.ok(/150,000/.test(node(ui, "srb-limit-note").textContent), "10h. la nota di ripartizione x50/ordinario resta visibile oltre il limite");
const idx = require("fs").readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8");
T.ok(!/2[,.]5\s*giorni|2[,.]5\s*days/i.test(idx), "10i. index.html non contiene piu' '2,5 giorni al mese'");

console.log("\n== Valori interni identici e formattazione IT/EN x EUR/USD");
const P = { common: 100000, rare: 60000, epic: 30000, legendary: 10000 };
const combos = [["it", "EUR"], ["it", "USD"], ["en", "EUR"], ["en", "USD"]];
const hs = {}; combos.forEach(([l, c]) => hs[l + c] = profile(P, 12, { aeLang: l, aeCurrency: c }, UI_FILES));
const ref = view(hs.enUSD);
combos.forEach(([l, c]) => { const vv = view(hs[l + c]); T.ok(vv.estimateUSD === ref.estimateUSD && vv.lowUSD === ref.lowUSD && vv.highUSD === ref.highUSD, "11. " + l.toUpperCase() + "+" + c + ": estimate/low/high interni (USD) identici a EN+USD"); });
// attesi: USD 1.141,24 / 926,83 / 1.250,73 ; EUR (x0,86) 981,47 / 797,07 / 1.075,62 (v0.9.5: raggruppamento migliaia anche a 4 cifre)
const exp = {
    itEUR: ["981,47 €", "797,07 €", "1.075,62 €"], itUSD: ["1.141,24", "926,83", "1.250,73"],
    enEUR: ["€981.47", "€797.07", "€1,075.62"], enUSD: ["$1,141.24", "$926.83", "$1,250.73"]
};
combos.forEach(([l, c]) => {
    const d = disp(hs[l + c]), e = exp[l + c], key = l.toUpperCase() + "+" + c;
    T.ok(nb(d.estimate).includes(e[0]) && nb(d.low).includes(e[1]) && nb(d.high).includes(e[2]), "12. " + key + ": importi " + e.join(" / ") + " (ottenuto " + nb(d.estimate) + " / " + nb(d.low) + " / " + nb(d.high) + ")");
    const line = nb(node(hs[l + c], "srb-range").textContent);
    T.ok(line.includes(e[1] + "–" + e[2]) || line.includes(nb(d.low) + "–" + nb(d.high)), "12b. " + key + ": riga intervallo con trattino 'basso–alto': " + line.slice(0, 60));
    if (c === "USD") T.ok(/\$|USD/.test(nb(d.estimate)), "12c. " + key + ": simbolo/sigla dollaro presente"); else T.ok(/€/.test(nb(d.estimate)) && /€/.test(nb(d.low)) && /€/.test(nb(d.high)), "12c. " + key + ": simbolo euro su stima e limiti");
});
close(evalIn(hs.itEUR, "convertToDisplay(getSRBView().lowUSD)"), ref.lowUSD * 0.86, "12d. EUR = USD x 0,86 (cambio fisso indicativo, invariato)", 1e-9);

console.log("\n== Assistente: le domande SRB raggiungono il gestore SRB");
const isSRB = (hh, q) => /Super Rent Boost/.test(reply(hh, q));
const bigEn = profile(P, 12, { aeLang: "en", aeCurrency: "USD" }), bigIt = profile(P, 12, { aeLang: "it", aeCurrency: "USD" }), smallIt = profile({ common: 100, rare: 40, epic: 10, legendary: 2 }, 12, { aeLang: "it" }), smallEn = profile({ common: 100, rare: 40, epic: 10, legendary: 2 }, 12, { aeLang: "en" });
T.ok(isSRB(smallIt, "Quanto rendo con il super potenziamento?"), "13. «Quanto rendo con il super potenziamento?» -> SRB (prima intercettata da 'quanto rendo')");
T.ok(isSRB(smallIt, "Quanto guadagno durante il Super Rent Boost?"), "14. «Quanto guadagno durante il Super Rent Boost?» -> SRB (prima intercettata da 'boost'/'quanto guadagno')");
T.ok(isSRB(smallIt, "Super Rent Boost x50"), "15. «Super Rent Boost x50» -> SRB (prima intercettata da 'boost')");
T.ok(isSRB(smallEn, "How much do I earn during Super Rent Boost?"), "16. «How much do I earn during Super Rent Boost?» -> SRB");
T.ok(isSRB(smallEn, "What would my rent be during SRB?"), "17. «What would my rent be during SRB?» -> SRB");
// v0.9.4: «rent boost / boost durante l'evento» (senza nome SRB) e' ambiguo -> chiarimento, non SRB; vedi tests/check-srb-v094.js (B).
["super boost", "Quanto rendo con il Super-Rent-Boost?", "x50", "50x", "quanto rendo con il ×50?", "SRB?", "Quanto rendo con il super potenziamento nella zona morta?", "Does the dead zone change my income during SRB?"]
    .forEach((q, i) => T.ok(isSRB(smallIt, q), "13+." + (i + 1) + " «" + q + "» -> SRB"));
const incomeIt = reply(smallIt, "Quanto rendo?");
T.ok(!/Super Rent Boost/.test(incomeIt) && /al giorno/.test(incomeIt), "18. «Quanto rendo?» (generica) -> riepilogo rendita, NON SRB");
T.ok(!isSRB(smallEn, "How much do I earn?") && !isSRB(smallEn, "What is my income?") && !isSRB(smallIt, "Qual è la mia rendita?"), "18b. altre domande generiche sulla rendita non sono SRB");
T.eq(reply(smallIt, "Cos'è la zona morta?"), evalIn(smallIt, "getBoostAdviceText(getTotalLands()).text"), "19. «Cos'è la zona morta?» -> consiglio boost/zona morta, NON SRB");
T.eq(reply(smallEn, "What is the dead zone?"), evalIn(smallEn, "getBoostAdviceText(getTotalLands()).text"), "19b. «What is the dead zone?» -> consiglio boost/zona morta");
["boost", "Quanto rendo con il boost?", "rent boost", "What is a rent boost?", "Quanti terreni per la prossima soglia di boost?", "x5 boost", "I have 250x more lands", "evento"].forEach((q, i) =>
    T.ok(!isSRB(smallIt, q) && !isSRB(smallEn, q), "19c." + (i + 1) + " «" + q + "» NON e' trattata come SRB"));
T.eq(reply(smallEn, "help"), evalIn(smallEn, "t('assistantHelp')"), "19d. «help» -> elenco di aiuto invariato");
T.ok(!/Super Rent Boost/.test(reply(smallEn, "hello there") + reply(smallEn, "what should I buy?")), "19e. saluti e consigli d'acquisto restano invariati");

console.log("\n== Assistente: contenuto della risposta");
const lim = evalIn(bigIt, "getSRBDisplay()");
let a = reply(bigIt, "Quanto rendo con il super potenziamento?");
T.ok(a.includes(lim.estimate) && a.includes(lim.low) && a.includes(lim.high), "20. >150.000 (IT): la risposta contiene stima centrale e intervallo teorico");
T.ok(/Stima centrale/.test(a) && /Intervallo teorico/.test(a) && /ordine di acquisizione/.test(a) && /proporzionalmente/.test(a) && /scenari teorici/.test(a) && /150\.000/.test(a) && /stima, non un guadagno garantito/.test(a), "20b. (IT) ipotesi essenziali + avvertenza: ordine di acquisizione, proporzionale, scenari teorici, limite, 'stima non garantita'");
a = reply(bigEn, "How much do I earn during Super Rent Boost?");
const limEn = evalIn(bigEn, "getSRBDisplay()");
T.ok(a.includes(limEn.estimate) && a.includes(limEn.low) && a.includes(limEn.high) && /Central estimate/.test(a) && /Theoretical range/.test(a) && /unknown order/.test(a) && /proportionally/.test(a) && /not guaranteed earnings/.test(a), "20c. >150.000 (EN): stima centrale, intervallo teorico, ordine sconosciuto, proporzionale, avvertenza");
a = reply(smallIt, "Quanto guadagno durante il Super Rent Boost?");
T.ok(!/[Ii]ntervallo/.test(a) && /stima, non un guadagno garantito/.test(a) && a.length < 420, "20d. <=150.000: risposta concisa, senza intervallo, con avvertenza (" + a.length + " caratteri)");
a = reply(smallEn, "What would my rent be during SRB?");
T.ok(!/[Rr]ange/.test(a) && /not guaranteed earnings/.test(a), "20e. <=150.000 (EN): senza intervallo, con avvertenza");
const lot = profile({ common: 150100 }, 0, { aeLang: "it" });
a = reply(lot, "srb");
T.ok(!/Intervallo/.test(a) && /150\.000/.test(a) && /boost ordinario/.test(a), "20f. >150.000 ma una sola rarita' (estremi coincidenti): nessun intervallo, ma ripartizione x50/ordinario indicata");
const eurIt = profile(P, 12, { aeLang: "it", aeCurrency: "EUR" }), eurEn = profile(P, 12, { aeLang: "en", aeCurrency: "EUR" });
a = reply(eurIt, "srb");
T.ok(/981,47 €/.test(nb(a)) && /797,07 €/.test(nb(a)) && /1\.075,62 €/.test(nb(a)) && /conversione indicativa/.test(a) && /non la rendita erogata dal gioco/.test(a), "20g. IT+EUR: importi in euro + avviso 'conversione indicativa, non la rendita erogata dal gioco'");
a = reply(eurEn, "srb");
T.ok(/€981\.47/.test(a) && /€797\.07/.test(a) && /€1,075\.62/.test(a) && /indicative conversion/.test(a) && /not the rent actually paid/.test(a), "20h. EN+EUR: importi in euro + avviso di conversione indicativa");
a = reply(bigEn, "srb");
T.ok(!/indicative conversion/.test(a), "20i. USD: nessun avviso di conversione");

console.log("\n== Cambio lingua durante la conversazione");
const sw = profile(P, 12, { aeLang: "it", aeCurrency: "USD" }, UI_FILES);
runIn(sw, "assistantHistory.push({ sender: 'bot', kind: 'reply', query: 'Quanto rendo con il super potenziamento?' })");
const before = evalIn(sw, "getAssistantEntryText(assistantHistory[assistantHistory.length - 1])");
const internalBefore = view(sw);
runIn(sw, "setLanguage('en')");
const after = evalIn(sw, "getAssistantEntryText(assistantHistory[assistantHistory.length - 1])");
T.ok(/Stima centrale/.test(before) && /Central estimate/.test(after) && !/Stima centrale/.test(after), "21. dopo il cambio IT->EN la stessa domanda viene rigenerata in inglese");
const internalAfter = view(sw);
T.ok(internalBefore.estimateUSD === internalAfter.estimateUSD && internalBefore.lowUSD === internalAfter.lowUSD && internalBefore.highUSD === internalAfter.highUSD, "21b. il cambio lingua non modifica i valori interni");
T.ok(after.includes("$1,141.24") && after.includes("$926.83") && after.includes("$1,250.73") && before.includes("1.141,24"), "21c. gli importi sono riformattati nella nuova lingua (1.141,24 -> $1,141.24)");

console.log("\n== Nessuna frequenza mensile presentata come regola");
const tr = JSON.parse(runIn(sw, "JSON.stringify(translations)"));
const srbKeys = Object.keys(tr.it).filter(k => /srb|SRB|SuperRent/.test(k));
const badMonthly = [];
["it", "en"].forEach(l => srbKeys.forEach(k => { if (/2[,.]5|al mese|per month|a month|\/mese|\/month|giorni al mese|days per month/i.test(tr[l][k])) badMonthly.push(l + ":" + k); }));
T.eq(badMonthly, [], "M1. nessun testo SRB (" + srbKeys.length + " chiavi) afferma una frequenza o un guadagno mensili");
T.ok(/non (?:stima|garantit)/i.test(tr.it.srbBoxNote) && /not (?:estimate|guaranteed)/i.test(tr.en.srbBoxNote), "M2. la nota SRB dichiara che durata/frequenza non sono garantite e che non c'e' stima mensile");
T.ok(!/2[,.]5/.test(tr.it.abTipSuperRentBoost + tr.en.abTipSuperRentBoost) && /non sono garantite/.test(tr.it.abTipSuperRentBoost) && /not guaranteed/.test(tr.en.abTipSuperRentBoost), "M3. il consiglio AB sull'SRB non cita piu' '~2,5 giorni al mese'");
T.eq(runIn(sw, "typeof CONFIG.srbDaysPerMonthAssumption"), "undefined", "M4. la costante srbDaysPerMonthAssumption (ipotesi non verificata) non esiste piu'");
const guide = require("fs").readFileSync(require("path").join(__dirname, "..", "guides/calcolo-rendita/index.html"), "utf8");
T.ok(!/2[,.]5\s*giorni/.test(guide) && /intervallo teorico/.test(guide), "M5. la guida 'calcolo rendita' non cita 2,5 giorni/mese e spiega l'intervallo teorico");

console.log("\n== Avvertenza boost ordinario 24 ore (invariata)");
T.ok(/24 ore su 24/.test(tr.it.dailyEstimateWarning) && /1 ora/.test(tr.it.dailyEstimateWarning) && /24 hours a day/.test(tr.en.dailyEstimateWarning) && /1 hour/.test(tr.en.dailyEstimateWarning), "B1. l'avvertenza dice che la stima assume il boost attivo 24 h e che ogni annuncio dura 1 ora");
T.ok(!/(un|un singolo|ogni) annuncio.{0,40}(intera giornata|tutto il giorno|24 ore)/i.test(tr.it.dailyEstimateWarning), "B2. nessun testo suggerisce che un annuncio mantenga il boost per tutta la giornata");

T.done();
