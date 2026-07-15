// ======================================
// AE Companion - Income Calculator
// ======================================

// Reddito al secondo (senza boost)
function getBaseIncomePerSecond() {

    return (
        player.lands.common * CONFIG.rentPerSecond.common +
        player.lands.rare * CONFIG.rentPerSecond.rare +
        player.lands.epic * CONFIG.rentPerSecond.epic +
        player.lands.legendary * CONFIG.rentPerSecond.legendary
    );

}

// Reddito al secondo con boost
function getBoostedIncomePerSecond() {

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
