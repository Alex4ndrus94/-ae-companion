// ======================================
// AE Companion - Income Calculator
// ======================================

// Reddito grezzo al secondo di un insieme di terreni (nessun bonus badge, nessun boost)
function rawRentPerSecondOf(lands) {

    return (
        lands.common * CONFIG.rentPerSecond.common +
        lands.rare * CONFIG.rentPerSecond.rare +
        lands.epic * CONFIG.rentPerSecond.epic +
        lands.legendary * CONFIG.rentPerSecond.legendary
    );

}

// Reddito grezzo al secondo (nessun bonus badge, nessun boost terreni)
function getRawIncomePerSecond() {

    return rawRentPerSecondOf(player.lands);

}

// Reddito al secondo (senza boost pubblicità, ma con bonus passaporto badge)
function getBaseIncomePerSecond() {

    const badgeBonus = 1 + (getBadgeBoostPercent(player.badges) / 100);

    return getRawIncomePerSecond() * badgeBonus;

}

// Reddito al secondo con boost
function getBoostedIncomePerSecond() {

    const totalLands =
        player.lands.common +
        player.lands.rare +
        player.lands.epic +
        player.lands.legendary;

    return getBaseIncomePerSecond() * getCurrentBoost(totalLands);

}

// Reddito giornaliero
function getDailyIncome() {

    return getBoostedIncomePerSecond() * 86400;

}

// Reddito mensile (30 giorni)
function getMonthlyIncome() {

    return getDailyIncome() * 30;

}

// Reddito annuale
function getYearlyIncome() {

    return getDailyIncome() * 365;

}
// Reddito giornaliero SENZA boost
function getBaseDailyIncome() {
    return getBaseIncomePerSecond() * 86400;
}

function getBaseMonthlyIncome() {
    return getBaseDailyIncome() * 30;
}

function getBaseYearlyIncome() {
    return getBaseDailyIncome() * 365;
}

// ======================================
// Stima SUPPLEMENTARE per il Super Rent Boost (x50) - v0.9.1: limite di 150.000 terreni;
// v0.9.2: intervallo teorico mostrato in UI/assistente, nessuna frequenza mensile.
// v0.9.3: getSRBView/getSRBDisplay accettano un profilo ipotetico (copia, mai il profilo salvato).
// Regola ufficiale (Atlas Earth Help Center, faq/484, consultata il 15/10/2026): il x50 vale per i
// primi 150.000 terreni; i terreni oltre il limite rendono al tasso standard del proprio scaglione.
// Ipotesi dichiarate (vedi note in app, chiavi srbAssumptions / srbLimitNote):
//  - rendita base con bonus badge (applicato UNA sola volta a tutti i terreni), moltiplicata per x50
//    sui terreni entro il limite e per il boost ordinario dello scaglione sui terreni oltre il limite;
//  - NON si somma il boost ordinario al x50 sui terreni entro il limite (cumulabilita' non confermata);
//  - l'app NON conosce l'ordine di acquisizione dei terreni: entro il limite le rarita' sono ripartite
//    in proporzione alla composizione del portafoglio (valore atteso con rarita' assegnata a caso);
//  - il boost ordinario dei terreni oltre il limite e' quello dello scaglione del TOTALE dei terreni
//    (il boost dipende dal numero totale di terreni, non dalla posizione del singolo terreno);
//  - nessuna durata ne' frequenza garantite (nessuna stima mensile): e' una stima GIORNALIERA durante l'evento,
//    non un guadagno garantito ne' un calcolo ufficiale;
//  - l'intervallo teorico (getSRBDailyBoundsUSD) e' formato da due scenari estremi sull'ordine di acquisizione,
//    NON e' un intervallo statistico di confidenza.
// Fino a 150.000 terreni (compreso) il risultato e' IDENTICO alla formula di v0.9.0.
// Il calcolo ordinario (getDailyIncome) non viene toccato.
// ======================================

// Calcolo puro (testabile): non legge player ne' la valuta; tutto in USD.
// lands = {common, rare, epic, legendary}; ordinaryBoost = moltiplicatore dello scaglione ordinario.
function getSRBBreakdown(lands, badges, ordinaryBoost, limit, multiplier) {

    const cap = limit === undefined ? CONFIG.srbParcelLimit : limit;
    const mult = multiplier === undefined ? CONFIG.srbMultiplier : multiplier;
    const total = lands.common + lands.rare + lands.epic + lands.legendary;
    const badgeBonus = 1 + (getBadgeBoostPercent(badges) / 100);
    const raw = rawRentPerSecondOf(lands);

    let srbLands = total, ordinaryLands = 0, dailyUSD;

    if (total <= cap) {

        // stessa espressione (e stesso ordine di operazioni) di v0.9.0
        dailyUSD = raw * badgeBonus * mult * 86400;

    } else {

        srbLands = cap;
        ordinaryLands = total - cap;

        const rawSRB = raw * (cap / total);
        const rawOrdinary = raw * (ordinaryLands / total);

        dailyUSD = (rawSRB * mult + rawOrdinary * ordinaryBoost) * badgeBonus * 86400;

    }

    return {
        totalLands: total,
        limit: cap,
        overLimit: total > cap,
        srbLands: srbLands,
        ordinaryLands: ordinaryLands,
        srbMultiplier: mult,
        ordinaryBoost: ordinaryBoost,
        badgeBonus: badgeBonus,
        dailyUSD: dailyUSD
    };

}

// Intervallo teorico dovuto all'ordine di acquisizione sconosciuto (solo oltre il limite):
// low = i terreni che rendono di piu' stanno tutti OLTRE il limite; high = tutti ENTRO il limite.
function getSRBDailyBoundsUSD(lands, badges, ordinaryBoost, limit, multiplier) {

    const cap = limit === undefined ? CONFIG.srbParcelLimit : limit;
    const mult = multiplier === undefined ? CONFIG.srbMultiplier : multiplier;
    const total = lands.common + lands.rare + lands.epic + lands.legendary;
    const badgeBonus = 1 + (getBadgeBoostPercent(badges) / 100);

    if (total <= cap) {
        const v = getSRBBreakdown(lands, badges, ordinaryBoost, cap, mult).dailyUSD;
        return { low: v, high: v };
    }

    const order = ["legendary", "epic", "rare", "common"]; // dalla rendita piu' alta alla piu' bassa

    function split(rarities) {
        // assegna i primi `cap` terreni seguendo l'ordine dato, il resto va oltre il limite
        let left = cap, rawIn = 0, rawOut = 0;
        rarities.forEach(function (r) {
            const inside = Math.min(lands[r], left);
            left -= inside;
            rawIn += inside * CONFIG.rentPerSecond[r];
            rawOut += (lands[r] - inside) * CONFIG.rentPerSecond[r];
        });
        return (rawIn * mult + rawOut * ordinaryBoost) * badgeBonus * 86400;
    }

    return { low: split(order.slice().reverse()), high: split(order) };

}

function getSRBDailyIncomeEstimate() {

    const total = getTotalLands();

    return getSRBBreakdown(player.lands, player.badges, getCurrentBoost(total)).dailyUSD;

}

// Dettaglio della stima SRB per la UI (quota x50 / quota ordinaria)
function getSRBDetails() {

    const total = getTotalLands();

    return getSRBBreakdown(player.lands, player.badges, getCurrentBoost(total));

}

// Conversione rendita virtuale -> AB: dipende SOLO dai dollari di rendita (unita' canonica del
// gioco), mai dalla valuta o dalla lingua scelte per la visualizzazione.
function convertRentUSDToAB(usd) {

    return usd * CONFIG.abPerUSDRent;

}

function getSRBDailyIncomeEstimateConverted() {
    return convertToDisplay(getSRBDailyIncomeEstimate());
}

// Distribuzione intera di `total` terreni secondo dei pesi per rarita' (metodo del resto piu' grande):
// la somma e' sempre esattamente `total`; a parita' di resto vince la rarita' piu' comune (ordine fisso).
function distributeCountByWeights(total, weights) {

    const order = ["common", "rare", "epic", "legendary"];
    const sum = order.reduce(function (a, r) { return a + weights[r]; }, 0);
    const out = { common: 0, rare: 0, epic: 0, legendary: 0 };

    if (total <= 0 || sum <= 0) return out;

    // aritmetica INTERA (quoziente e resto di total*peso / somma pesi): nessun errore di virgola mobile nei pareggi
    let assigned = 0;
    const rema = [];

    order.forEach(function (r, i) {
        const num = total * weights[r];
        out[r] = Math.floor(num / sum);
        assigned += out[r];
        rema.push({ r: r, i: i, rem: num % sum });
    });

    rema.sort(function (a, b) { return (b.rem - a.rem) || (a.i - b.i); });

    for (let k = 0; assigned < total; k = (k + 1) % rema.length, assigned++) out[rema[k].r]++;

    return out;

}

// Composizione per rarita' di un profilo IPOTETICO di `targetTotal` terreni (non tocca `player`, restituisce una copia).
//  - nessun terreno salvato: rarita' ripartite secondo CONFIG.rarityOdds (stesse probabilita' dei what-if ordinari);
//  - targetTotal == terreni salvati: composizione salvata invariata;
//  - targetTotal  < terreni salvati: composizione salvata riscalata in proporzione;
//  - targetTotal  > terreni salvati: terreni salvati + quelli aggiuntivi ripartiti secondo CONFIG.rarityOdds.
function getProjectedLands(targetTotal, baseLands) {

    const base = baseLands || player.lands;
    const baseTotal = base.common + base.rare + base.epic + base.legendary;
    const copy = function (o) { return { common: o.common, rare: o.rare, epic: o.epic, legendary: o.legendary }; };

    if (baseTotal === 0) return { lands: distributeCountByWeights(targetTotal, CONFIG.rarityOdds), mode: "odds", extra: targetTotal };

    if (targetTotal === baseTotal) return { lands: copy(base), mode: "saved", extra: 0 };

    if (targetTotal < baseTotal) return { lands: distributeCountByWeights(targetTotal, base), mode: "scaled", extra: 0 };

    const add = distributeCountByWeights(targetTotal - baseTotal, CONFIG.rarityOdds);

    return {
        lands: { common: base.common + add.common, rare: base.rare + add.rare, epic: base.epic + add.epic, legendary: base.legendary + add.legendary },
        mode: "extended",
        extra: targetTotal - baseTotal
    };

}

// Vista unica della stima SRB per dashboard e assistente (nessuna formula nuova: riusa
// getSRBBreakdown e getSRBDailyBoundsUSD). Valori interni in USD, nessuna dipendenza da lingua/valuta.
// Senza argomenti usa il profilo salvato; con `landsOverride` / `badgesOverride` (v0.9.3) calcola uno scenario
// ipotetico su dati passati dal chiamante, SENZA leggere ne' modificare `player`.
function getSRBView(landsOverride, badgesOverride) {

    const lands = landsOverride || player.lands;
    const badges = badgesOverride === undefined || badgesOverride === null ? player.badges : badgesOverride;
    const total = lands.common + lands.rare + lands.epic + lands.legendary;
    const boost = getCurrentBoost(total);
    const d = getSRBBreakdown(lands, badges, boost);
    const b = getSRBDailyBoundsUSD(lands, badges, boost);

    // Gli estremi vengono calcolati con un ordine di operazioni diverso dalla stima centrale: il confronto
    // e' limitato per garantire low <= centrale <= high anche con rarita' singola (differenza solo di arrotondamento).
    return {
        details: d,
        overLimit: d.overLimit,
        estimateUSD: d.dailyUSD,
        lowUSD: Math.min(b.low, d.dailyUSD),
        highUSD: Math.max(b.high, d.dailyUSD)
    };

}

// Testi gia' formattati (valuta e lingua scelte) per la stima centrale e l'intervallo.
// hasRange e' vero solo oltre il limite E quando i due estremi, una volta formattati, sono diversi:
// se coincidono (es. una sola rarita') non si mostra un intervallo artificiale.
function getSRBDisplay(landsOverride, badgesOverride) {

    const v = getSRBView(landsOverride, badgesOverride);
    const estimate = formatCurrency(convertToDisplay(v.estimateUSD));
    const low = formatCurrency(convertToDisplay(v.lowUSD));
    const high = formatCurrency(convertToDisplay(v.highUSD));

    return {
        view: v,
        estimate: estimate,
        low: low,
        high: high,
        hasRange: v.overLimit && low !== high
    };

}

// Conversione nella valuta di visualizzazione scelta (js/money.js).
// Lingua e valuta sono indipendenti; i valori interni restano in USD.
function getDailyIncomeConverted() {
    return convertToDisplay(getDailyIncome());
}

function getMonthlyIncomeConverted() {
    return convertToDisplay(getMonthlyIncome());
}

function getYearlyIncomeConverted() {
    return convertToDisplay(getYearlyIncome());
}

function getBaseDailyIncomeConverted() {
    return convertToDisplay(getBaseDailyIncome());
}

function getBaseMonthlyIncomeConverted() {
    return convertToDisplay(getBaseMonthlyIncome());
}

function getBaseYearlyIncomeConverted() {
    return convertToDisplay(getBaseYearlyIncome());
}

// formatCurrency() e formatCurrencyPrecise() sono ora in js/money.js

// Rendita al secondo (con boost pubblicita' + bonus badge inclusi):
// e' semplicemente la somma dei terreni posseduti, mostrata
// come dato informativo a parte
function getIncomePerSecondConverted() {
    return getDailyIncomeConverted() / 86400;
}
