// Test SRB v0.9.1: limite di 150.000 terreni, boost ordinario oltre il limite, badge, valuta/lingua, conversione AB.
// Uso: node tests/check-srb.js
// I valori attesi sono calcolati a mano (vedi docs/10-REPORT-FASE1.1-v0.9.1.md), NON con la formula dell'app.
// Rendita per secondo: common 1,1e-9 | rare 1,6e-9 | epic 2,2e-9 | legendary 4,4e-9. 86400 s/giorno.
// Cluster EU_WEST: oltre 400 terreni il boost ordinario e' x2. Bonus badge tabella app: 12 badge = +10%.
const { load, evalIn, runIn, suite } = require("./lib/sandbox");
const T = suite("srb");
const close = (a, b, msg, tol) => T.ok(Math.abs(a - b) <= (tol || 1e-6), msg + "  (atteso " + b + ", ottenuto " + a + ")");

function profile(lands, badges, store) {
    const data = { profile: { name: "T" }, lands: Object.assign({ common: 0, rare: 0, epic: 0, legendary: 0 }, lands), badges: badges || 0, mayorTarget: 0,
        passes: { explorer: false, mission: false }, goal: { type: "efficiency", incomeTargetUSD: 1, incomeTargetBoosted: true, landsTarget: 0 },
        settings: { dailyLoginAB: 50, abBalance: 0 } };
    return load({ store: Object.assign({ aeLang: "en", aeCurrency: "USD", aePrefsMigration: "1", aeCountryGroup: "EU_WEST", aeCompanionData: JSON.stringify(data) }, store || {}) });
}
const srb = h => evalIn(h, "getSRBDailyIncomeEstimate()");
// formula della v0.9.0 (x50 su TUTTI i terreni): serve per dimostrare che i test la smascherano
const old = h => evalIn(h, "getBaseIncomePerSecond() * CONFIG.srbMultiplier * 86400");

console.log("== Casi di confine (tutti Common, 0 badge, EU_WEST)");
const COMMON50 = 0.004752;        // 1,1e-9 * 50 * 86400 per terreno
const COMMON2 = 0.00019008;       // 1,1e-9 * 2 * 86400 per terreno (boost ordinario x2)
let h = profile({ common: 0 });
close(srb(h), 0, "1. 0 terreni -> SRB = 0");
T.eq(evalIn(h, "getSRBDetails().overLimit"), false, "1b. 0 terreni: nessun limite superato");
h = profile({ common: 1 });
close(srb(h), COMMON50, "2. 1 terreno -> 0,004752 (x50)");
h = profile({ common: 149999 });
close(srb(h), 712.795248, "3. 149.999 terreni -> 712,795248 (tutti x50)");
T.eq(evalIn(h, "[getSRBDetails().srbLands, getSRBDetails().ordinaryLands]"), [149999, 0], "3b. 149.999: 149.999 a x50, 0 oltre il limite");
h = profile({ common: 150000 });
close(srb(h), 712.8, "4. esattamente 150.000 terreni -> 712,8 (tutti x50)");
T.eq(evalIn(h, "[getSRBDetails().srbLands, getSRBDetails().ordinaryLands, getSRBDetails().overLimit]"), [150000, 0, false], "4b. 150.000: nessun terreno oltre il limite");
h = profile({ common: 150001 });
close(srb(h), 712.8 + COMMON2, "5. 150.001 terreni -> 712,80019008 (150.000 a x50 + 1 a x2)");
T.eq(evalIn(h, "[getSRBDetails().srbLands, getSRBDetails().ordinaryLands]"), [150000, 1], "5b. 150.001: 150.000 a x50 e 1 a boost ordinario");
T.ok(Math.abs(srb(h) - old(h)) > 0.004, "5c. la vecchia formula (x50 a tutti) darebbe " + old(h) + ": il test la smaschera");
h = profile({ common: 150100 });
close(srb(h), 712.8 + 100 * COMMON2, "6. 150.100 terreni -> 712,819008");
T.eq(evalIn(h, "[getSRBDetails().srbLands, getSRBDetails().ordinaryLands]"), [150000, 100], "6b. 150.100: 150.000 a x50 e 100 a boost ordinario");
close(old(h), 150100 * COMMON50, "6c. (controllo) la vecchia formula darebbe 713,2752", 1e-6);
T.ok(srb(h) < old(h) - 0.4, "6d. SRB corretto inferiore alla vecchia formula di oltre 0,4 $/giorno");

console.log("\n== Distribuzione mista di rarita' oltre il limite");
// 200.000 terreni: 100.000 C, 60.000 R, 30.000 E, 10.000 L. Rendita grezza = 3,16e-4 $/s.
// Entro il limite (75% del portafoglio, ipotesi proporzionale): 2,37e-4 a x50; oltre (25%): 7,9e-5 a x2.
// (2,37e-4*50 + 7,9e-5*2) * 86400 = 1037,4912
h = profile({ common: 100000, rare: 60000, epic: 30000, legendary: 10000 });
close(srb(h), 1037.4912, "7. 200.000 terreni misti (50/30/15/5) -> 1037,4912");
T.eq(evalIn(h, "[getSRBDetails().srbLands, getSRBDetails().ordinaryLands, getSRBDetails().ordinaryBoost]"), [150000, 50000, 2], "7b. ripartizione: 150.000 a x50, 50.000 a x2");
close(old(h), 1365.12, "7c. (controllo) la vecchia formula darebbe 1365,12", 1e-6);
// intervallo dovuto all'ordine di acquisizione sconosciuto
const b = evalIn(h, "getSRBDailyBoundsUSD(player.lands, player.badges, getCurrentBoost(getTotalLands()))");
close(b.low, 842.5728, "7d. limite inferiore (terreni piu' redditizi tutti oltre il limite) = 842,5728");
close(b.high, 1137.024, "7e. limite superiore (terreni piu' redditizi tutti entro il limite) = 1137,024");
T.ok(b.low < srb(h) && srb(h) < b.high, "7f. la stima proporzionale cade dentro l'intervallo teorico");
// portafoglio con solo Legendary oltre soglia: la ripartizione proporzionale non inventa un ordine
h = profile({ legendary: 150100 });
close(srb(h), (150000 * 4.4e-9 * 50 + 100 * 4.4e-9 * 2) * 86400, "7g. 150.100 Legendary -> 150.000 x50 + 100 x2 = " + ((150000 * 4.4e-9 * 50 + 100 * 4.4e-9 * 2) * 86400));

console.log("\n== Eccedenti e scaglioni boost");
// Tabelle reali: l'ultimo scaglione e' aperto (min <= 1501 e max Infinity), quindi TUTTI i terreni oltre 150.000 stanno nello stesso scaglione.
const groups = ["US", "UK_CA_AU_ZA_IE_NZ", "EU_WEST", "NORDIC", "SE_ASIA", "ASIA_GULF", "BRAZIL", "MEXICO"];
const lastBoost = {};
groups.forEach(g => {
    const hh = profile({ common: 150100 }, 0, { aeCountryGroup: g });
    lastBoost[g] = evalIn(hh, "getSRBDetails().ordinaryBoost");
    close(srb(hh), 712.8 + 100 * 1.1e-9 * lastBoost[g] * 86400, "8a. cluster " + g + ": 150.100 terreni, eccedenti al boost dello scaglione (x" + lastBoost[g] + ")");
});
T.eq(Object.values(lastBoost), groups.map(() => 2), "8b. in tutte le tabelle attuali l'ultimo scaglione e' x2 (nessun cluster ha scaglioni distinti oltre 150.000)");
// Tabella SINTETICA con scaglioni oltre 150.000 per provare che il boost ordinario e' quello dello scaglione del TOTALE
const synth = "countryGroups.EU_WEST.breakpoints = [{min:1,max:150000,boost:7},{min:150001,max:200000,boost:4},{min:200001,max:Infinity,boost:3}];";
h = profile({ common: 150100 }); runIn(h, synth);
close(srb(h), 712.8 + 100 * 1.1e-9 * 4 * 86400, "8c. tabella sintetica, 150.100 terreni (scaglione x4): 712,838016");
h = profile({ common: 200100 }); runIn(h, synth);
close(srb(h), 712.8 + 50100 * 1.1e-9 * 3 * 86400, "8d. tabella sintetica, 200.100 terreni (scaglione x3): 727,084512");
T.eq(evalIn(h, "getSRBDetails().ordinaryBoost"), 3, "8e. il boost applicato agli eccedenti e' quello dello scaglione del totale (x3), non quello dei primi 150.000 (x7)");

console.log("\n== Bonus badge (una sola volta)");
// 12 badge = +10% nella tabella dell'app. Sia la quota x50 sia quella ordinaria sono moltiplicate per 1,1 una volta.
h = profile({ common: 150100 }, 12);
close(srb(h), (712.8 + 100 * COMMON2) * 1.1, "9. 150.100 terreni + 12 badge -> 784,1009088");
T.ok(Math.abs(srb(h) - (712.8 + 100 * COMMON2) * 1.1 * 1.1) > 1, "9b. il bonus non e' applicato due volte");
h = profile({ common: 100 }, 12);
close(srb(h), 100 * 1.1e-9 * 1.1 * 50 * 86400, "9c. 100 terreni + 12 badge: bonus applicato una volta alla quota x50");
const ordBadge = profile({ common: 150100 }, 12);
close(evalIn(ordBadge, "getDailyIncome()"), 150100 * COMMON2 * 1.1, "9d. rendita ORDINARIA 150.100 terreni + 12 badge: bonus una sola volta = 31,3841088");
h = profile({ common: 150100 }, 0);
close(evalIn(h, "getBadgeBoostPercent(0)"), 0, "9e. 0 badge: +0%"); close(evalIn(h, "getBadgeBoostPercent(10)"), 5, "9f. 10 badge: +5%"); close(evalIn(h, "getBadgeBoostPercent(11)"), 10, "9g. 11 badge: +10%");

console.log("\n== Valuta e lingua non alterano i valori interni");
const P = { common: 100000, rare: 60000, epic: 30000, legendary: 10000 };
const usdEn = profile(P, 12, { aeCurrency: "USD", aeLang: "en" });
const eurEn = profile(P, 12, { aeCurrency: "EUR", aeLang: "en" });
const usdIt = profile(P, 12, { aeCurrency: "USD", aeLang: "it" });
const eurIt = profile(P, 12, { aeCurrency: "EUR", aeLang: "it" });
const base = srb(usdEn);
close(srb(eurEn), base, "10. valuta EUR vs USD: SRB interno (USD) identico", 1e-12);
close(srb(usdIt), base, "11. lingua IT vs EN: SRB interno identico", 1e-12);
close(srb(eurIt), base, "11b. EUR+IT vs USD+EN: SRB interno identico", 1e-12);
close(evalIn(eurEn, "getSRBDailyIncomeEstimateConverted()"), base * 0.86, "10b. la VISUALIZZAZIONE in EUR e' il valore USD x 0,86 (cambio fisso indicativo)");
close(evalIn(usdEn, "getSRBDailyIncomeEstimateConverted()"), base, "10c. la visualizzazione in USD coincide col valore interno");
T.eq([evalIn(eurEn, "getSRBDetails().srbLands"), evalIn(eurEn, "getSRBDetails().ordinaryLands")], [150000, 50000], "10d. suddivisione x50 / ordinario indipendente dalla valuta");

console.log("\n== Rendita ordinaria vs SRB");
h = profile({ common: 100 }, 12);   // 100 terreni EU_WEST = fascia 71-100 = x15
const ord = evalIn(h, "getDailyIncome()"), sr = srb(h);
close(ord, 100 * 1.1e-9 * 1.1 * 15 * 86400, "12a. ordinaria (x15): 0,156816");
close(sr, 100 * 1.1e-9 * 1.1 * 50 * 86400, "12b. SRB (x50, entro il limite): 0,52272");
close(sr / ord, 50 / 15, "12c. entro il limite il rapporto SRB/ordinaria e' 50/boost", 1e-9);
h = profile({ common: 150100 }, 12);
const ord2 = evalIn(h, "getDailyIncome()"), sr2 = srb(h);
T.ok(ord2 < sr2 && sr2 < old(h), "12d. oltre il limite: ordinaria (" + ord2 + ") < SRB corretto (" + sr2 + ") < vecchia formula (" + old(h) + ")");
close(evalIn(h, "getBaseDailyIncome()"), 150100 * 1.1e-9 * 1.1 * 86400, "12e. la rendita base senza boost non dipende dalla correzione SRB");

console.log("\n== Conversione rendita -> AB (25 AB per 1 $ di rendita)");
T.eq(evalIn(usdEn, "convertRentUSDToAB(1)"), 25, "AB1. 1 $ di rendita = 25 AB");
T.eq(evalIn(usdEn, "convertRentUSDToAB(4)"), 100, "AB2. 4 $ di rendita = 100 AB");
const abOf = hh => evalIn(hh, "convertRentUSDToAB(getSRBDailyIncomeEstimate())");
close(abOf(usdEn), base * 25, "AB3. AB stimati dalla rendita SRB = USD x 25");
[eurEn, usdIt, eurIt].forEach((hh, i) => close(abOf(hh), abOf(usdEn), "AB4." + (i + 1) + " cambiare valuta/lingua non altera gli AB stimati", 1e-12));
const tipsOf = hh => evalIn(hh, "t('abTipRentConversion')");
const tIt = tipsOf(usdIt), tEn = tipsOf(usdEn);
T.ok(/25 AB/.test(tIt) && /25 AB/.test(tEn), "AB5. il testo indica 25 AB per 1 $ in IT e in EN");
T.ok(!/33/.test(tIt) && !/33/.test(tEn), "AB6. il vecchio '33 AB per euro' non compare piu'");
T.ok(!/€/.test(tIt) && !/€/.test(tEn) && /\$/.test(tIt) && /\$/.test(tEn), "AB7. il testo parla di dollari di rendita, non di euro");
T.eq(tipsOf(eurIt) === tIt && tipsOf(eurEn) === tEn, true, "AB8. il testo non cambia con la valuta scelta");

console.log("\n== Testi (IT/EN)");
const w = l => evalIn(profile({ common: 1 }, 0, { aeLang: l }), "t('dailyEstimateWarning')");
T.ok(/24 ore/.test(w("it")) && /non guadagni garantiti/.test(w("it")), "W1. avvertenza 24 h in italiano, senza garanzia di guadagno");
T.ok(/24 hours/.test(w("en")) && /not guaranteed/.test(w("en")), "W2. avvertenza 24 h in inglese, senza garanzia di guadagno");
const note = (l) => evalIn(profile({ common: 1 }, 0, { aeLang: l }), "t('srbLimitNote', {total:'150.100', srb:'150.000', boost:2, rest:'100'})");
T.ok(/150\.000/.test(note("it")) && /\{/.test(note("it")) === false, "W3. nota limite IT con segnaposto sostituiti");
T.ok(/150\.000/.test(note("en")) && /\{/.test(note("en")) === false, "W4. nota limite EN con segnaposto sostituiti");
// Dalla v0.9.2 anche "quanto rendo con il super potenziamento" raggiunge il gestore SRB (vedi tests/check-srb-range.js).
const asst = l => evalIn(profile({ common: 100000, rare: 60000, epic: 30000, legendary: 10000 }, 12, { aeLang: l, aeCurrency: "USD" }), "getAssistantReply('srb')");
T.ok(/150\.000/.test(asst("it")) && /150,000/.test(asst("en")), "W5. la risposta dell'assistente sull'SRB cita il limite dei 150.000 terreni (IT e EN)");
T.ok(asst("en").includes("$1,141.24"), "W6. l'assistente (EN, USD) riporta la stima corretta $1,141.24 (1037,4912 x 1,10 badge)");
T.ok(asst("it").includes("1.141,24"), "W7. l'assistente (IT, USD) riporta la stima corretta 1.141,24 (dalla v0.9.5 anche it-IT raggruppa i numeri a 4 cifre)");

T.done();
