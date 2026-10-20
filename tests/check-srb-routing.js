// Test v0.9.3: routing delle domande SRB (anche con numeri / profilo ipotetico), IT + EN, EUR + USD.
// Uso: node tests/check-srb-routing.js
// I valori attesi sono calcolati a mano con le costanti del gioco (NON richiamando le funzioni di calcolo dell'app):
// rendita/s: common 1,1e-9 | rare 1,6e-9 | epic 2,2e-9 | legendary 4,4e-9; 86400 s/giorno; limite SRB 150.000; x50;
// EU_WEST: oltre 400 terreni boost ordinario x2; badge 1-10 +5%, 11-30 +10%, 31-60 +15%, 61-100 +20%, 101+ +25%;
// cambio fisso indicativo 1 USD = 0,86 EUR.
const { load, evalIn, runIn, suite } = require("./lib/sandbox");
const T = suite("srb-routing");
const R = { common: 1.1e-9, rare: 1.6e-9, epic: 2.2e-9, legendary: 4.4e-9 }, DAY = 86400, RATE = 0.86;
const close = (a, b, msg, tol) => T.ok(Math.abs(a - b) <= (tol || 1e-6), msg + "  (atteso " + b + ", ottenuto " + a + ")");
const nb = s => String(s).replace(/[\u00a0\u202f]/g, " ");
const raw = L => Object.keys(R).reduce((a, k) => a + (L[k] || 0) * R[k], 0);
const tot = L => Object.keys(R).reduce((a, k) => a + (L[k] || 0), 0);
// stima centrale SRB scritta a mano (formula documentata in js/income.js): primi 150.000 a x50, il resto al boost ordinario, bonus badge una volta
const srbHand = (L, bonus, ordBoost) => { const n = tot(L), r = raw(L); return n <= 150000 ? r * bonus * 50 * DAY : (r * (150000 / n) * 50 + r * ((n - 150000) / n) * ordBoost) * bonus * DAY; };

const S = { common: 100, rare: 40, epic: 10, legendary: 2 };            // profilo salvato di riferimento (152 terreni)
const SAVED_BADGES = 12;
function profile(lands, badges, lang, cur, group) {
    const data = { profile: { name: "T" }, lands: Object.assign({ common: 0, rare: 0, epic: 0, legendary: 0 }, lands), badges: badges, mayorTarget: 0,
        passes: { explorer: false, mission: false }, goal: { type: "efficiency", incomeTargetUSD: 1, incomeTargetBoosted: true, landsTarget: 0 },
        settings: { dailyLoginAB: 50, abBalance: 0 } };
    return load({ store: { aeLang: lang, aeCurrency: cur, aePrefsMigration: "1", aeCountryGroup: group || "EU_WEST", aeCompanionData: JSON.stringify(data) } });
}
const ask = (h, q) => evalIn(h, "getAssistantReply(" + JSON.stringify(q) + ")");
const isSRB = s => /Super Rent Boost/.test(s);
const isHypo = s => /Scenario ipotetico|Hypothetical scenario/.test(s);
const usd = (n, lang) => nb(new Intl.NumberFormat(lang === "it" ? "it-IT" : "en-US", { style: "currency", currency: "USD", useGrouping: "always" }).format(n));
const eur = (n, lang) => nb(new Intl.NumberFormat(lang === "it" ? "it-IT" : "en-US", { style: "currency", currency: "EUR", useGrouping: "always" }).format(n));

// composizione ipotetica attesa a mano per N = 200.000 con profilo S: S + 199.848 aggiuntivi (50/30/15/5 col metodo del resto piu' grande,
// pareggio tra rare e legendary risolto a favore della piu' comune): 99.924 / 59.955 / 29.977 / 9.992
const H200 = { common: 100 + 99924, rare: 40 + 59955, epic: 10 + 29977, legendary: 2 + 9992 };
T.eq(tot(H200), 200000, "0. composizione attesa a mano: somma 200.000");
const bonus12 = 1.10, bonus31 = 1.15, bonus101 = 1.25;

console.log("== 1. Domanda SRB generica: gestore SRB");
const itS = profile(S, SAVED_BADGES, "it", "USD"), enS = profile(S, SAVED_BADGES, "en", "USD");
["Quanto rendo con il super potenziamento?", "Quanto guadagno durante il Super Rent Boost?", "Quanto rendo con l'SRB?", "SRB"].forEach(q => {
    const r = ask(itS, q);
    T.ok(isSRB(r) && !isHypo(r), "1. IT «" + q + "» -> gestore SRB (profilo salvato)");
    T.ok(nb(r).includes(usd(srbHand(S, bonus12, 2), "it").replace(/\s/g, " ")), "1b. IT «" + q + "»: importo = formula a mano sul profilo salvato (" + usd(srbHand(S, bonus12, 2), "it") + ")");
});
["How much do I earn during Super Rent Boost?", "How much do I earn during SRB?", "What is my income with the super rent boost?"].forEach(q => {
    const r = ask(enS, q);
    T.ok(isSRB(r) && !isHypo(r), "1. EN «" + q + "» -> gestore SRB (profilo salvato)");
    T.ok(nb(r).includes(usd(srbHand(S, bonus12, 2), "en")), "1b. EN «" + q + "»: importo = " + usd(srbHand(S, bonus12, 2), "en"));
});

console.log("\n== 2. Domanda SRB con 200.000 terreni: calcolo SRB sul profilo ipotetico");
const exp200 = srbHand(H200, bonus12, 2);
// v0.9.4: le frasi «durante l'evento» SENZA nome SRB sono AMBIGUE (l'evento puo' essere un'altra meccanica): non sono piu' instradate
// al calcolo SRB ma a una richiesta di chiarimento; sono coperte in tests/check-srb-v094.js (sezione B).
const q2it = ["Quanto renderei con 200.000 terreni durante l'SRB?", "Calcola la rendita SRB con 200.000 terreni e 15 badge."];
const q2en = ["What would my rent be during SRB with 200,000 parcels?", "Calculate my Super Rent Boost income with 200,000 parcels and 15 badges."];
q2it.forEach(q => { const r = ask(itS, q); T.ok(isSRB(r) && isHypo(r), "2. IT «" + q + "» -> SRB ipotetico (non what-if ordinario)"); T.ok(/200\.000 terreni/.test(r), "2b. IT: 200.000 terreni citati"); T.ok(!/il boost sarebbe/.test(r), "2c. IT: non e' la risposta del what-if ordinario"); });
q2en.forEach(q => { const r = ask(enS, q); T.ok(isSRB(r) && isHypo(r), "2. EN «" + q + "» -> SRB ipotetico (non what-if ordinario)"); T.ok(/200,000 parcels/.test(r), "2b. EN: 200,000 parcels citati"); T.ok(!/your boost would be/.test(r), "2c. EN: non e' la risposta del what-if ordinario"); });
// importo: badge del profilo (12 -> +10%); intervallo e stima a mano
let r = ask(itS, "Quanto renderei con 200.000 terreni durante l'SRB?");
T.ok(nb(r).includes(usd(exp200, "it")), "2d. IT: stima centrale = formula a mano sulla composizione ipotetica (" + usd(exp200, "it") + ")");
T.ok(/12 badge \(dal tuo profilo\)/.test(r), "2e. IT: badge non indicati -> presi dal profilo e dichiarati");
T.ok(/Intervallo teorico/.test(r) && /non un intervallo statistico/.test(r) && /non sommato al ×50/.test(r) && /primi 150\.000/.test(r) && /×2/.test(r), "2f. IT: intervallo teorico + ipotesi esplicite (limite, boost ordinario sull'eccedenza, nessuna cumulabilita')");
r = ask(enS, "What would my rent be during SRB with 200,000 parcels?");
T.ok(nb(r).includes(usd(exp200, "en")), "2g. EN: stima centrale = " + usd(exp200, "en"));
T.ok(/Theoretical range/.test(r) && /not a statistical interval/.test(r) && /not added on top of ×50/.test(r) && /first 150,000/.test(r), "2h. EN: intervallo teorico + ipotesi esplicite");
// estremi a mano (tutti i legendary/epic... prima = limite superiore; ordine inverso = inferiore)
function hand(L, bonus, order) { let left = 150000, rin = 0, rout = 0; order.forEach(k => { const inside = Math.min(L[k], left); left -= inside; rin += inside * R[k]; rout += (L[k] - inside) * R[k]; }); return (rin * 50 + rout * 2) * bonus * DAY; }
const hi = hand(H200, bonus12, ["legendary", "epic", "rare", "common"]), lo = hand(H200, bonus12, ["common", "rare", "epic", "legendary"]);
T.ok(nb(r).includes(usd(lo, "en")) && nb(r).includes(usd(hi, "en")), "2i. EN: estremi " + usd(lo, "en") + "–" + usd(hi, "en") + " (a mano)");
T.ok(lo <= exp200 && exp200 <= hi, "2j. a mano: minimo <= centrale <= massimo");

console.log("\n== 2k. Modalita' di composizione (profilo piu' piccolo, uguale, piu' grande, vuoto)");
const BIG = { common: 150000, rare: 90000, epic: 45000, legendary: 15000 };   // 300.000 salvati, proporzioni 50/30/15/5
const hBig = profile(BIG, 12, "en", "USD");
r = ask(hBig, "What would my rent be during SRB with 200,000 parcels?");
T.ok(isHypo(r) && /in proportion to those in your profile/.test(r), "2k. profilo 300.000 > 200.000: rarita' riscalate in proporzione");
T.ok(nb(r).includes(usd(srbHand({ common: 100000, rare: 60000, epic: 30000, legendary: 10000 }, bonus12, 2), "en")), "2l. profilo riscalato 100.000/60.000/30.000/10.000: " + usd(srbHand({ common: 100000, rare: 60000, epic: 30000, legendary: 10000 }, bonus12, 2), "en"));
r = ask(itS, "Quanto renderei con 152 terreni durante l'SRB?");
T.ok(isSRB(r) && !isHypo(r), "2m. numero uguale ai terreni salvati: nessuno scenario ipotetico, profilo salvato");
const hEmpty = profile({}, 0, "en", "USD");
r = ask(hEmpty, "What would my rent be during SRB with 200,000 parcels?");
T.ok(isHypo(r) && /assignment odds used by the app \(common 50%, rare 30%, epic 15%, legendary 5%\)/.test(r) && /0 badges/.test(r), "2n. profilo vuoto: rarita' dalle probabilita' di assegnazione dichiarate; 0 badge dal profilo");
T.ok(nb(r).includes(usd(srbHand({ common: 100000, rare: 60000, epic: 30000, legendary: 10000 }, 1, 2), "en")), "2o. profilo vuoto: " + usd(srbHand({ common: 100000, rare: 60000, epic: 30000, legendary: 10000 }, 1, 2), "en"));

console.log("\n== 3. Badge espliciti");
r = ask(enS, "Calculate my Super Rent Boost income with 200,000 parcels and 31 badges.");
T.ok(/31 badges/.test(r) && !/from your profile/.test(r), "3. EN: 31 badge letti dalla domanda, non dal profilo");
T.ok(nb(r).includes(usd(srbHand(H200, bonus31, 2), "en")), "3b. EN: 31 badge -> +15%: " + usd(srbHand(H200, bonus31, 2), "en"));
r = ask(itS, "Calcola la rendita SRB con 200.000 terreni e 101 badge.");
T.ok(/101 badge/.test(r) && nb(r).includes(usd(srbHand(H200, bonus101, 2), "it")), "3c. IT: 101 badge -> +25%: " + usd(srbHand(H200, bonus101, 2), "it"));
r = ask(itS, "Quanto renderei con 40 badge durante l'SRB?");      // solo badge: terreni del profilo (152)
T.ok(isHypo(r) && /40 badge/.test(r) && /152 terreni/.test(r) && /Rarità dei terreni del tuo profilo/.test(r), "3d. IT: solo badge indicati -> terreni (152) e rarita' del profilo");
T.ok(nb(r).includes(usd(srbHand(S, bonus31, 2), "it")), "3e. IT: 40 badge (+15%) sul profilo salvato: " + usd(srbHand(S, bonus31, 2), "it"));

console.log("\n== 4. Dati mancanti: nessun valore inventato");
const needIt = /mi serve un numero di terreni maggiore di zero/, needEn = /I need a number of parcels greater than zero/;
r = ask(profile({}, 0, "it", "USD"), "Quanto renderei durante l'SRB?");
T.ok(needIt.test(r) && !/[\d.,]+\s?\$|\$\s?[\d.,]+/.test(r.replace(/200\.000/g, "")), "4. IT profilo vuoto, nessun numero nella domanda: chiarimento, nessun importo");
r = ask(profile({}, 0, "en", "USD"), "How much do I earn during Super Rent Boost?");
T.ok(needEn.test(r) && !/\$\s?\d/.test(r.replace(/\$?200,000/g, "")), "4b. EN profilo vuoto: chiarimento, nessun importo");
T.ok(needIt.test(ask(profile({}, 0, "it", "USD"), "Quanto renderei con 15 badge durante l'SRB?")), "4c. IT profilo vuoto + solo badge: chiarimento (i terreni non vengono inventati)");
T.ok(needEn.test(ask(profile({}, 0, "en", "USD"), "SRB with 0 parcels")), "4d. EN 0 terreni espliciti: chiarimento");
T.ok(needIt.test(ask(itS, "Quanto renderei con 0 terreni durante l'SRB?")), "4e. IT 0 terreni espliciti con profilo pieno: chiarimento");
T.ok(/ambiguo/.test(ask(itS, "Quanto renderei con 0.500 terreni durante l'SRB?")), "4f. IT «0.500 terreni»: ambiguo -> si chiede conferma, nessun calcolo");
T.ok(/can't use that number/.test(ask(enS, "SRB with 1.5 parcels")), "4g. EN «1.5 parcels»: numero non valido, nessun calcolo");
T.ok(/Non riesco a usare/.test(ask(itS, "SRB con 2.500.000 terreni")), "4h. IT oltre il massimo ammesso: non valido");
T.ok(/Non riesco a usare/.test(ask(itS, "SRB con -5 badge")), "4i. IT badge negativi: non validi");

console.log("\n== 5. Profilo salvato invariato dopo domande ipotetiche");
const before = evalIn(itS, "JSON.stringify([player, getTotalLands(), getDailyIncome(), getSRBView()])");
const writes0 = itS.writes.length;
q2it.concat(["Quanto renderei con 40 badge durante l'SRB?", "SRB con 500.000 terreni e 101 badge", "SRB con 10 terreni"]).forEach(q => ask(itS, q));
const after = evalIn(itS, "JSON.stringify([player, getTotalLands(), getDailyIncome(), getSRBView()])");
T.eq(after, before, "5. player, totale terreni, rendita ordinaria e vista SRB identici dopo 6 domande ipotetiche");
T.eq(itS.writes.length, writes0, "5b. nessuna scrittura in localStorage durante le domande ipotetiche");
T.eq(evalIn(itS, "player.lands"), S, "5c. terreni salvati invariati"); T.eq(evalIn(itS, "player.badges"), SAVED_BADGES, "5d. badge salvati invariati");
T.eq(evalIn(itS, "getSRBView(" + JSON.stringify(H200) + ", 31) && player.lands"), S, "5e. getSRBView(copia, badge) non muta player");
T.eq(evalIn(itS, "(function(){ const c = " + JSON.stringify(S) + "; getProjectedLands(5000, c); return c; })()"), S, "5f. getProjectedLands non muta la composizione passata");

console.log("\n== 6-8. Domande NON SRB: restano ai gestori ordinari");
const nonSrb = [
    ["it", "quanto rendo?", /guadagni circa/], ["it", "Quanto guadagno?", /guadagni circa/], ["it", "qual e' la mia rendita?", /guadagni circa/],
    ["en", "how much do I earn?", /you(?:'re| are) earning|you earn/], ["en", "what is my income?", /you(?:'re| are) earning|you earn/]
];
nonSrb.forEach(([lang, q, re]) => { const h = lang === "it" ? itS : enS, x = ask(h, q); T.ok(!isSRB(x) && re.test(x), "6. " + lang.toUpperCase() + " «" + q + "» -> gestore ordinario di rendita (non SRB)"); });
const boostIt = evalIn(itS, "getBoostAdviceText(getTotalLands()).text"), boostEn = evalIn(enS, "getBoostAdviceText(getTotalLands()).text");
["boost", "Come funziona il boost?", "rent boost", "soglia boost"].forEach(q => { const x = ask(itS, q); T.ok(!isSRB(x) && x === boostIt, "7. IT «" + q + "» -> consiglio boost ordinario, NON SRB"); });
["boost", "how does the boost work?", "regular rent boost"].forEach(q => { const x = ask(enS, q); T.ok(!isSRB(x) && x === boostEn, "7. EN «" + q + "» -> consiglio boost ordinario, NON SRB"); });
["zona morta", "Cos'e' la zona morta?", "dead zone"].forEach(q => { const x = ask(itS, q); T.ok(!isSRB(x) && x === boostIt, "8. «" + q + "» -> comportamento previsto (consiglio boost/zona morta)"); });
T.ok(ask(enS, "what is the dead zone?") === boostEn, "8b. EN dead zone -> consiglio boost/zona morta invariato");
// ambigue: «evento» da solo, evento + AB, nessun intento di rendita
["Quando c'e' il prossimo evento?", "Come guadagno AB durante l'evento?", "how do I earn more AB during the event?", "Che eventi ci sono?", "event"].forEach(q => T.ok(evalIn(itS, "isSRBQuestion(normalizeText(" + JSON.stringify(q) + "))") === false && !/Scenario ipotetico|Hypothetical|Stima (?:centrale|indicativa)|estimate for one day/.test(ask(itS, q) + ask(enS, q)), "9. «" + q + "» ambigua/non di rendita: NON classificata SRB (nessuna stima SRB)"));
// what-if ordinari invariati (numeri senza SRB)
T.ok(/boost sarebbe x2/.test(ask(itS, "Quanto renderei con 200.000 terreni?")) && !isSRB(ask(itS, "Quanto renderei con 200.000 terreni?")), "10. IT what-if ordinario «con 200.000 terreni» senza SRB: resta what-if");
T.ok(/your boost would be x5/.test(ask(enS, "what if I had 300 lands?")), "10b. EN what-if ordinario 300 lands invariato");
T.ok(/badge/.test(ask(itS, "e se avessi 150 badge?")) && !isSRB(ask(itS, "e se avessi 150 badge?")), "10c. IT what-if badge invariato");

console.log("\n== 11. Cambio lingua IT/EN: nessun testo nella lingua sbagliata");
const itHyp = ask(itS, "SRB con 200.000 terreni e 15 badge"), enHyp = ask(enS, "SRB with 200,000 parcels and 15 badges");
const itNeed = ask(profile({}, 0, "it", "USD"), "SRB"), enNeed = ask(profile({}, 0, "en", "USD"), "SRB");
const enWords = /\b(?:parcels|hypothetical|scenario|estimate|assumptions|guaranteed|badge bonus|range|profile)\b/i, itWords = /\b(?:terreni|ipotetico|stima|ipotesi|garantito|rendono|profilo|intervallo)\b/i;
[itHyp, itNeed].forEach((x, i) => T.ok(!enWords.test(x.replace(/Super Rent Boost/g, "").replace(/\bscenario\b/gi, "")), "11. IT risposta " + (i ? "dati mancanti" : "ipotetica") + ": nessuna parola inglese"));
[enHyp, enNeed].forEach((x, i) => T.ok(!itWords.test(x), "11b. EN risposta " + (i ? "dati mancanti" : "ipotetica") + ": nessuna parola italiana"));
// la stessa domanda, cambiando lingua, genera stessi numeri (USD) in formato locale
const itU = profile(S, 12, "it", "USD"), enU = profile(S, 12, "en", "USD");
T.ok(nb(ask(itU, "SRB con 200.000 terreni")).includes(usd(exp200, "it")) && nb(ask(enU, "SRB with 200,000 parcels")).includes(usd(exp200, "en")), "11c. IT/EN: stessa stima " + usd(exp200, "it") + " / " + usd(exp200, "en") + " nei rispettivi formati");
// rigenerazione dello storico al cambio lingua: stessa domanda, lingua nuova
const hSw = profile(S, 12, "it", "USD"); runIn(hSw, "assistantHistory.length = 0; assistantHistory.push({sender:'user',kind:'text',text:'SRB con 200.000 terreni'},{sender:'bot',kind:'reply',query:'SRB con 200.000 terreni'});");
runIn(hSw, "setLanguage && setLanguage('en')");
T.ok(isHypo(evalIn(hSw, "getAssistantEntryText(assistantHistory[1])")) && /Hypothetical scenario/.test(evalIn(hSw, "getAssistantEntryText(assistantHistory[1])")), "11d. cambio lingua IT->EN: la risposta dello storico viene rigenerata in inglese");

console.log("\n== 12. Cambio valuta EUR/USD");
const itE = profile(S, 12, "it", "EUR"), enE = profile(S, 12, "en", "EUR"), enD = profile(S, 12, "en", "USD");
const rE = ask(itE, "SRB con 200.000 terreni"), rD = ask(enD, "SRB with 200,000 parcels"), rE2 = ask(enE, "SRB with 200,000 parcels");
T.ok(nb(rE).includes(eur(exp200 * RATE, "it")), "12. IT+EUR: stima = USD x 0,86 = " + eur(exp200 * RATE, "it"));
T.ok(nb(rE2).includes(eur(exp200 * RATE, "en")) && nb(rE2).includes(eur(lo * RATE, "en")) && nb(rE2).includes(eur(hi * RATE, "en")), "12b. EN+EUR: stima e estremi convertiti e formattati (" + eur(lo * RATE, "en") + "–" + eur(hi * RATE, "en") + ")");
T.ok(/conversione indicativa/.test(rE) && /1 USD = 0,86 EUR/.test(rE) && /not the income paid out|indicative conversion/.test(rE2) && /1 USD = 0\.86 EUR/.test(rE2), "12c. con EUR: avviso di conversione indicativa (tasso fisso non ufficiale) in IT e EN");
T.ok(!/indicative conversion|conversione indicativa/.test(rD) && /\$/.test(rD), "12d. con USD: nessun avviso di conversione, simbolo $");
// l'unica cosa che cambia tra le valute e' la formattazione: stessi USD interni
close(evalIn(itE, "getSRBView(" + JSON.stringify(H200) + ").estimateUSD"), evalIn(enD, "getSRBView(" + JSON.stringify(H200) + ").estimateUSD"), "12e. USD interni identici con EUR e USD", 1e-9);

console.log("\n== 13. Parser dei numeri nelle domande SRB (coerenza con le regole esistenti)");
const same = ["SRB con 200.000 terreni", "SRB con 200,000 terreni", "SRB con 200000 terreni"].map(q => nb(ask(itU, q)));
T.ok(same[0] === same[1] && same[1] === same[2], "13. IT: «200.000», «200,000», «200000» terreni -> stessa risposta");
const same2 = ["SRB with 200.000 parcels", "SRB with 200,000 parcels", "SRB with 200000 parcels"].map(q => nb(ask(enU, q)));
T.ok(same2[0] === same2[1] && same2[1] === same2[2], "13b. EN: «200.000», «200,000», «200000» parcels -> stessa risposta");
T.ok(/200\.000 terreni/.test(same[0]) && /200,000 parcels/.test(same2[0]), "13c. il numero e' mostrato con i separatori della lingua della risposta");
T.ok(nb(same[0]).includes(usd(exp200, "it")), "13d. valore interpretato = 200.000 (non 200)");
// parser esistente: valori che gia' erano ambigui/non validi restano tali
T.ok(/ambiguo/.test(ask(itU, "SRB con 0,500 terreni")), "13e. «0,500» ambiguo anche in SRB");
T.ok(/Non riesco a usare/.test(ask(itU, "SRB con 1,25 terreni")) && /Non riesco a usare/.test(ask(itU, "SRB con 1.01.4 terreni")), "13f. «1,25», «1.01.4» non validi anche in SRB");
T.ok(nb(ask(itU, "SRB con 1.500.000 terreni")).includes("Non riesco"), "13g. 1.500.000 oltre il massimo ammesso (1.000.000): non valido");
T.ok(isHypo(ask(itU, "SRB con 1.000.000 terreni")), "13h. 1.000.000 (massimo ammesso) accettato");

console.log("\n== 14. Intervallo sugli scenari ipotetici: minimo <= centrale <= massimo");
const cases = [[{ common: 150000 }, 0], [{ common: 150001 }, 12], [{ common: 150000, legendary: 1 }, 12], [{ common: 100000, legendary: 50100 }, 5], [{ rare: 300000 }, 61],
    [{ common: 1 }, 0], [{ epic: 149999, legendary: 2 }, 101], [{ common: 90000, rare: 60001, epic: 5 }, 31], [H200, 12], [{ legendary: 1000000 }, 12]];
const hC = profile(S, 12, "en", "USD");
cases.forEach(([L, b], i) => {
    const full = Object.assign({ common: 0, rare: 0, epic: 0, legendary: 0 }, L), v = evalIn(hC, "getSRBView(" + JSON.stringify(full) + "," + b + ")"), d = evalIn(hC, "getSRBDisplay(" + JSON.stringify(full) + "," + b + ")");
    T.ok(v.lowUSD <= v.estimateUSD && v.estimateUSD <= v.highUSD, "14." + (i + 1) + " " + JSON.stringify(L) + " badge " + b + ": inferiore <= centrale <= superiore");
    const pct = evalIn(hC, "getBadgeBoostPercent(" + b + ")"), ord = evalIn(hC, "getCurrentBoost(" + tot(full) + ")");
    close(v.estimateUSD, srbHand(full, 1 + pct / 100, ord), "14b." + (i + 1) + " centrale = formula a mano", 1e-6);
    if (tot(full) <= 150000) T.ok(d.hasRange === false && v.lowUSD === v.highUSD, "14c." + (i + 1) + " <= 150.000: nessun intervallo");
});
const dOne = evalIn(hC, "getSRBDisplay({common:200000,rare:0,epic:0,legendary:0}, 12)");
T.eq([dOne.view.overLimit, dOne.hasRange], [true, false], "14d. 200.000 di una sola rarita': oltre il limite ma nessun intervallo artificiale");
const rOne = ask(hC, "x50"); T.ok(isSRB(rOne), "14e. «x50» riconosciuto come SRB");

console.log("\n== 15. Zero modifica a profilo/valori dopo tutte le domande");
T.eq(evalIn(hC, "player.lands"), S, "15. profilo del sandbox 14 invariato");

T.done();
