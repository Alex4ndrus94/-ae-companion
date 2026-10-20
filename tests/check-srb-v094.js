// Test v0.9.4: routing SRB esplicito / evento ambiguo / domande AB, profili ipotetici, integrita' del profilo,
// 4 combinazioni IT/EN x EUR/USD, intervallo teorico e casi di confine. Valori attesi calcolati a mano (costanti di gioco).
// Uso: node tests/check-srb-v094.js
const { load, evalIn, suite } = require("./lib/sandbox");
const T = suite("srb-v094");
const R = { common: 1.1e-9, rare: 1.6e-9, epic: 2.2e-9, legendary: 4.4e-9 }, DAY = 86400, RATE = 0.86;
const nb = s => String(s).replace(/[\u00a0\u202f]/g, " ");
const raw = L => Object.keys(R).reduce((a, k) => a + (L[k] || 0) * R[k], 0), tot = L => Object.keys(R).reduce((a, k) => a + (L[k] || 0), 0);
const srbHand = (L, bonus, ord) => { const n = tot(L), r = raw(L); return n <= 150000 ? r * bonus * 50 * DAY : (r * (150000 / n) * 50 + r * ((n - 150000) / n) * ord) * bonus * DAY; };
const S = { common: 100, rare: 40, epic: 10, legendary: 2 };           // 152 terreni salvati
const H200 = { common: 100 + 99924, rare: 40 + 59955, epic: 10 + 29977, legendary: 2 + 9992 };
function profile(lands, badges, lang, cur, group) {
    const data = { profile: { name: "T" }, lands: Object.assign({ common: 0, rare: 0, epic: 0, legendary: 0 }, lands), badges, mayorTarget: 0, passes: { explorer: false, mission: false },
        goal: { type: "efficiency", incomeTargetUSD: 1, incomeTargetBoosted: true, landsTarget: 0 }, settings: { dailyLoginAB: 50, abBalance: 0 } };
    return load({ store: { aeLang: lang, aeCurrency: cur, aePrefsMigration: "1", aeCountryGroup: group || "EU_WEST", aeCompanionData: JSON.stringify(data) } });
}
const ask = (h, q) => evalIn(h, "getAssistantReply(" + JSON.stringify(q) + ")");
const money = (n, lang, cur) => nb(new Intl.NumberFormat(lang === "it" ? "it-IT" : "en-US", { style: "currency", currency: cur, useGrouping: "always" }).format(cur === "EUR" ? n * RATE : n));
const isEstimate = s => /Stima (?:centrale|indicativa)|(?:Central|Rough) estimate/.test(s);
const isHypo = s => /Scenario ipotetico|Hypothetical scenario/.test(s);
const isClarify = s => /Non è chiaro a quale evento|It isn't clear which event/.test(s);
const isABsrc = s => /fonti principali di AB|main AB sources/.test(s);
const hasAmount = s => /[€$]\s?\d|\d\s?[€$]|\d[\d.,]*\s?(?:USD|EUR)/.test(nb(s));

console.log("== A. Domande SRB esplicite (gli esempi della richiesta) -> gestore SRB ipotetico, prima dei gestori numerici");
const combos = [["it", "EUR"], ["it", "USD"], ["en", "EUR"], ["en", "USD"]];
const A_IT = ["Quanto renderei con 200.000 terreni durante l'SRB?", "Calcola la rendita SRB con 200.000 terreni e 15 badge.", "Quanto guadagnerei durante il Super Rent Boost?"];
const A_EN = ["What would my rent be during SRB with 200,000 parcels?", "Calculate my Super Rent Boost income with 200,000 parcels and 15 badges."];
const exp200 = srbHand(H200, 1.10, 2), exp200b15 = srbHand(H200, 1.10, 2);   // 15 badge = ancora fascia 11-30 = +10% come i 12 salvati
combos.forEach(([lang, cur]) => {
    const h = profile(S, 12, lang, cur), tag = lang.toUpperCase() + "/" + cur;
    (lang === "it" ? A_IT : A_EN).concat(lang === "it" ? ["SRB con 200000 parcelle"] : ["SRB with 200000 lands"]).forEach(q => {
        const r = ask(h, q), hyp = /200\.?,?000|200,000/.test(q);
        T.ok(isEstimate(r), "A. " + tag + " «" + q + "» -> stima SRB (non what-if ordinario, non chiarimento)");
        T.ok(!/boost sarebbe|boost would be/.test(r) && !isClarify(r), "A2. " + tag + " «" + q + "» non e' finita ai gestori generici");
        if (hyp) {
            T.ok(isHypo(r), "A3. " + tag + " «" + q + "»: scenario ipotetico dichiarato, profilo salvato non modificato");
            T.ok(nb(r).includes(money(exp200, lang, cur)), "A4. " + tag + " «" + q + "»: stima centrale a mano " + money(exp200, lang, cur));
        }
    });
});

console.log("\n== B. «Evento» senza nome SRB: intento ambiguo -> chiarimento, nessun importo, nessun what-if");
const B = ["Quanto guadagnerei durante l'evento con 200000 parcelle?", "Quanto guadagnerei durante l'evento?", "boost durante l'evento", "rent boost durante l'evento", "Quanto rendo col boost durante l'evento?", "evento e rendita",
    "How much would I earn during the event with 200,000 parcels?", "How much would I earn during the event?", "rent boost during the event", "boost during the event", "what is my income during the event?"];
combos.forEach(([lang, cur]) => {
    const h = profile(S, 12, lang, cur), tag = lang.toUpperCase() + "/" + cur;
    B.forEach(q => {
        const r = ask(h, q);
        T.ok(isClarify(r) && !hasAmount(r) && !isEstimate(r) && !/boost sarebbe|boost would be/.test(r), "B. " + tag + " «" + q + "» -> chiarimento senza importi");
    });
    T.ok(lang === "it" ? !/\b(?:event is|Super Rent Boost \(×50\) \(|your)\b/i.test(ask(h, B[0])) : !/\b(?:terreni|evento|rendita)\b/i.test(ask(h, B[6])), "B2. " + tag + ": chiarimento nella lingua corretta");
});
T.ok(isClarify(ask(profile({}, 0, "it", "USD"), B[0])) && isClarify(ask(profile({}, 0, "en", "USD"), B[6])), "B3. profilo vuoto: stesso chiarimento (nessun valore inventato)");

console.log("\n== C. Domande su AB / Airbucks / ricompense evento: MAI stima di rendita SRB");
const C = ["Come guadagno AB durante l'SRB?", "Quanti AB ottengo con il Super Rent Boost?", "Quanti airbucks guadagno durante l'evento con 200000 parcelle?", "Come guadagno AB durante l'evento?",
    "How many AB do I get during SRB?", "how do I earn more AB during the event?", "How many airbucks can I earn during the event with 200,000 parcels?", "How do I earn AB during Super Rent Boost?"];
combos.forEach(([lang, cur]) => {
    const h = profile(S, 12, lang, cur), tag = lang.toUpperCase() + "/" + cur;
    C.forEach(q => { const r = ask(h, q); T.ok(isABsrc(r) && !isEstimate(r) && !isHypo(r) && !hasAmount(r), "C. " + tag + " «" + q + "» -> fonti AB, nessuna stima di rendita SRB"); });
});

console.log("\n== D. Domande generiche NON SRB restano ai gestori ordinari");
combos.forEach(([lang, cur]) => {
    const h = profile(S, 12, lang, cur), tag = lang.toUpperCase() + "/" + cur;
    (lang === "it" ? ["quanto rendo?", "Quanto guadagno?", "Quanto renderei con 200.000 terreni?", "e se avessi 150 badge?"] : ["how much do I earn?", "what if I had 300 lands?", "What if I had 80 badges?"]).forEach(q => {
        const r = ask(h, q); T.ok(!isEstimate(r) && !isClarify(r) && !isABsrc(r) && !/Super Rent Boost/.test(r), "D. " + tag + " «" + q + "» -> gestore ordinario");
    });
    ["Quando c'e' il prossimo evento?", "Che eventi ci sono?", "event", "when is the next event?"].forEach(q => { const r = ask(h, q); T.ok(!isEstimate(r) && !isClarify(r) && !hasAmount(r), "D2. " + tag + " «" + q + "» (evento senza rendita/boost) -> nessuna stima ne' chiarimento SRB"); });
});
T.ok(/boost sarebbe x2/.test(ask(profile(S, 12, "it", "USD"), "Quanto renderei con 200.000 terreni?")), "D3. what-if ordinario 200.000 terreni invariato");

console.log("\n== E. Falsi positivi del riconoscimento (parole che contengono 'rend'/'ab')");
["Cosa prende l'evento?", "Quando si apprende il nuovo evento?", "Il cab arriva all'evento"].forEach(q => T.ok(!isClarify(ask(profile(S, 12, "it", "USD"), q)), "E. «" + q + "»: nessun falso positivo da sottostringhe"));

console.log("\n== F. Ipotesi dichiarate e profilo originale intatto (152 salvati, 200.000 ipotizzati)");
const hP = profile(S, 12, "it", "EUR"), before = JSON.stringify(evalIn(hP, "[player, getTotalLands(), getDailyIncome()]")), w0 = hP.writes.length, storeBefore = JSON.stringify(hP.store);
const rF = ask(hP, "Quanto renderei con 200.000 terreni durante l'SRB?");
T.ok(/Terreni del tuo profilo mantenuti/.test(rF) && /199\.848 aggiuntivi/.test(rF), "F. metodo dichiarato: terreni salvati mantenuti + 199.848 aggiuntivi");
T.ok(/probabilità di assegnazione/.test(rF) && /ipotesi del modello, non la distribuzione reale/.test(rF) && /not your real distribution|not the real distribution/.test(ask(profile(S, 12, "en", "USD"), "SRB with 200,000 parcels") + ask(profile({}, 0, "en", "USD"), "SRB with 200,000 parcels")), "F2. la distribuzione delle rarita' e' dichiarata come ipotesi/modello, non come dato reale dell'utente");
T.ok(/12 badge \(dal tuo profilo\)/.test(rF), "F3. badge non indicati -> dal profilo, dichiarato");
T.ok(/Intervallo teorico/.test(rF) && /non un intervallo statistico/.test(rF) && /non sommato al ×50/.test(rF), "F4. intervallo teorico + nessuna cumulabilita'");
T.ok(!/al mese|per month|monthly|mensil/i.test(rF + ask(profile(S, 12, "en", "USD"), "SRB with 200,000 parcels")), "F5. nessuna frequenza mensile SRB");
T.eq(JSON.stringify(evalIn(hP, "[player, getTotalLands(), getDailyIncome()]")), before, "F6. player e rendita ordinaria identici");
T.eq(hP.writes.length, w0, "F7. nessuna scrittura in localStorage"); T.eq(JSON.stringify(hP.store), storeBefore, "F8. chiavi/valori localStorage invariati");
["Quanto guadagnerei durante l'evento con 200000 parcelle?", "Come guadagno AB durante l'SRB?", "SRB con 500000 terreni e 101 badge"].forEach(q => ask(hP, q));
T.eq(JSON.stringify(hP.store), storeBefore, "F9. localStorage invariato anche dopo chiarimenti, domande AB e altre ipotesi");

console.log("\n== G. Verifica matematica: 0, 1, 150.000, 150.001, 150.100 terreni; mix; singola rarita'; badge; boost ordinari");
const hM = profile(S, 12, "en", "USD");
const cases = [[{ common: 0 }, 0], [{ common: 1 }, 0], [{ common: 150000 }, 0], [{ common: 150001 }, 12], [{ common: 150100 }, 12], [{ common: 100000, rare: 50100 }, 31], [{ legendary: 150100 }, 101], [{ common: 75000, rare: 45000, epic: 22550, legendary: 7550 }, 61],
    [{ epic: 200000 }, 5], [{ common: 149999, legendary: 2 }, 12], [{ common: 1, legendary: 150099 }, 0]];
const pct = b => b === 0 ? 0 : b <= 10 ? 5 : b <= 30 ? 10 : b <= 60 ? 15 : b <= 100 ? 20 : 25;
const bandsBoost = (n, grp) => evalIn(hM, "getCurrentBoost(" + n + ")");
cases.forEach(([L, b], i) => {
    const full = Object.assign({ common: 0, rare: 0, epic: 0, legendary: 0 }, L), n = tot(full), v = evalIn(hM, "getSRBView(" + JSON.stringify(full) + "," + b + ")"), ord = bandsBoost(n);
    const exp = srbHand(full, 1 + pct(b) / 100, ord);
    T.ok(Math.abs(v.estimateUSD - exp) <= Math.max(1e-9, Math.abs(exp) * 1e-12), "G." + (i + 1) + " " + n + " terreni, " + b + " badge: centrale = formula a mano (" + exp + ")");
    T.ok(v.lowUSD <= v.estimateUSD && v.estimateUSD <= v.highUSD, "G." + (i + 1) + "b minimo <= centrale <= massimo");
    if (n <= 150000) T.ok(v.lowUSD === v.highUSD, "G." + (i + 1) + "c <= 150.000: estremi uguali (nessun intervallo)");
    if (n > 150000) { const rawIn = Object.keys(R); T.ok(v.details.srbLands === 150000 && v.details.ordinaryLands === n - 150000, "G." + (i + 1) + "d ×50 sui primi 150.000, resto al boost ordinario (nessuna somma al ×50)"); }
});
const dOne = evalIn(hM, "getSRBDisplay({common:0,rare:0,epic:200000,legendary:0}, 5)"); T.eq([dOne.view.overLimit, dOne.hasRange], [true, false], "G-r. una sola rarita': nessun intervallo artificiale");
const dMix = evalIn(hM, "getSRBDisplay({common:100000,rare:50100,epic:0,legendary:0}, 31)"); T.ok(dMix.hasRange, "G-m. rarita' miste oltre il limite: intervallo teorico presente");
// boost ordinari diversi per gruppo/paese: stessa regola, stesso risultato a mano
["EU_WEST", "USA", "EU_EAST"].forEach(g => { let h; try { h = profile(S, 12, "en", "USD", g); } catch (e) { return; } const v = evalIn(h, "getSRBView({common:200000,rare:0,epic:0,legendary:0}, 12)"), ord = evalIn(h, "getCurrentBoost(200000)"); T.ok(Math.abs(v.estimateUSD - srbHand({ common: 200000 }, 1.10, ord)) < 1e-6, "G-b. gruppo " + g + ": boost ordinario " + ord + " applicato solo all'eccedenza"); });

console.log("\n== H. Quattro combinazioni lingua/valuta: importi coerenti, nota cambio solo con EUR, nessuna lingua mista");
const itW = /\b(?:terreni|ipotetico|stima|ipotesi|garantito|rendono|profilo|intervallo)\b/i, enW = /\b(?:parcels|hypothetical|estimate|assumptions|guaranteed|range|profile)\b/i;
combos.forEach(([lang, cur]) => {
    const h = profile(S, 12, lang, cur), q = lang === "it" ? "Calcola la rendita SRB con 200.000 terreni e 15 badge." : "Calculate my Super Rent Boost income with 200,000 parcels and 15 badges.", r = ask(h, q), tag = lang.toUpperCase() + "/" + cur;
    T.ok(nb(r).includes(money(exp200b15, lang, cur)), "H. " + tag + ": stima centrale " + money(exp200b15, lang, cur));
    T.ok(cur === "EUR" ? /1 USD = 0[.,]86 EUR/.test(r) : !/1 USD = 0/.test(r), "H2. " + tag + ": nota sul cambio indicativo solo con EUR");
    T.ok(lang === "it" ? !enW.test(r.replace(/Super Rent Boost|scenario/gi, "")) : !itW.test(r), "H3. " + tag + ": nessuna parola nell'altra lingua");
});

console.log("\n== I. Regressioni ordinarie");
const hI = profile(S, 12, "it", "USD");
T.ok(/Super Rent Boost/.test(ask(hI, "Quanto rendo con il super potenziamento?")) && !isHypo(ask(hI, "Quanto rendo con il super potenziamento?")), "I. SRB generico sul profilo salvato invariato");
T.ok(/Super Rent Boost/.test(ask(hI, "SRB con 152 terreni")) && !isHypo(ask(hI, "SRB con 152 terreni")), "I2. numero uguale ai terreni salvati: profilo salvato, non ipotetico");
T.ok(/ambiguo/.test(ask(hI, "SRB con 0.500 terreni")) && /Non riesco a usare/.test(ask(hI, "SRB con 2.500.000 terreni")), "I3. numeri ambigui / oltre il massimo: invariati");

T.done();
