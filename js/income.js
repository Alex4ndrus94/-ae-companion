// ======================================
// AE Companion - Income Calculator
// ======================================

// Reddito grezzo al secondo (nessun bonus badge, nessun boost terreni)
function getRawIncomePerSecond() {

    return (
        player.lands.common * CONFIG.rentPerSecond.common +
        player.lands.rare * CONFIG.rentPerSecond.rare +
        player.lands.epic * CONFIG.rentPerSecond.epic +
        player.lands.legendary * CONFIG.rentPerSecond.legendary
    );

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
// Stima SUPPLEMENTARE per il Super Rent Boost (x50)
// Non fa parte del calcolo ufficiale di rendita:
// si applica solo durante l'evento (~2,5 giorni/mese) e
// dipende da quanto l'utente riesce a tenerlo attivo.
// Basata sulla rendita base (con bonus badge, SENZA boost
// pubblicità terreni, perché non è confermato se i due
// moltiplicatori si sommino insieme in gioco).
// ======================================

function getSRBDailyIncomeEstimate() {

    return getBaseIncomePerSecond() * CONFIG.srbMultiplier * 86400;

}

function getSRBDailyIncomeEstimateConverted() {
    return getCurrentLanguage() === "it"
        ? getSRBDailyIncomeEstimate() * CONFIG.exchangeRate
        : getSRBDailyIncomeEstimate();
}

// Conversione nella valuta corretta in base alla lingua
// EN -> USD (valuta nativa del gioco) | IT -> EUR (convertita)
function getDailyIncomeConverted() {
    return getCurrentLanguage() === "it"
        ? getDailyIncome() * CONFIG.exchangeRate
        : getDailyIncome();
}

function getMonthlyIncomeConverted() {
    return getCurrentLanguage() === "it"
        ? getMonthlyIncome() * CONFIG.exchangeRate
        : getMonthlyIncome();
}

function getYearlyIncomeConverted() {
    return getCurrentLanguage() === "it"
        ? getYearlyIncome() * CONFIG.exchangeRate
        : getYearlyIncome();
}

function getBaseDailyIncomeConverted() {
    return getCurrentLanguage() === "it"
        ? getBaseDailyIncome() * CONFIG.exchangeRate
        : getBaseDailyIncome();
}

function getBaseMonthlyIncomeConverted() {
    return getCurrentLanguage() === "it"
        ? getBaseMonthlyIncome() * CONFIG.exchangeRate
        : getBaseMonthlyIncome();
}

function getBaseYearlyIncomeConverted() {
    return getCurrentLanguage() === "it"
        ? getBaseYearlyIncome() * CONFIG.exchangeRate
        : getBaseYearlyIncome();
}

function formatCurrency(value) {

    const lang = getCurrentLanguage();
    const currency = lang === "it" ? "EUR" : "USD";
    const locale = lang === "it" ? "it-IT" : "en-US";

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);

}
