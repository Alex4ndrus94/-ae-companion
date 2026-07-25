// ======================================
// AE Companion Configuration - Italia
// Versione 1.0
// ======================================

const CONFIG = {

    country: "IT",

    // Valuta
    currency: "EUR",

    // Tasso di conversione USD -> EUR
    exchangeRate: 0.86,

    landCostAB: 100,

    badgeCostAB: 200,

    // Reddito per secondo ($) - costante globale del gioco
    rentPerSecond: {

        common: 0.0000000011,

        rare: 0.0000000016,

        epic: 0.0000000022,

        legendary: 0.0000000044

    },

    // Probabilità rarità
    rarityOdds: {

        common: 50,

        rare: 30,

        epic: 15,

        legendary: 5

    },

    // Bonus passaporto in base al numero di badge (percentuale permanente)
    badgeBoostTiers: [
        { min: 0,   max: 0,        percent: 0 },
        { min: 1,   max: 10,       percent: 5 },
        { min: 11,  max: 30,       percent: 10 },
        { min: 31,  max: 60,       percent: 15 },
        { min: 61,  max: 100,      percent: 20 },
        { min: 101, max: Infinity, percent: 25 }
    ]

};
