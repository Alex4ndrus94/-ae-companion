// ======================================
// AE Companion Configuration - Italia
// Versione 1.0
// ======================================

const CONFIG = {

    country: "IT",

    landCostAB: 100,

    badgeCostAB: 200,

    // Reddito per secondo ($)
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
    breakpoints: [

        { min: 0,   max: 70,  boost: 20 },

        { min: 71,  max: 100, boost: 15 },

        { min: 101, max: 135, boost: 10 },

        { min: 136, max: 170, boost: 8 },

        { min: 171, max: 200, boost: 7 },

        { min: 201, max: 250, boost: 6 },

        { min: 251, max: 300, boost: 5 },

        { min: 301, max: 350, boost: 4 },

        { min: 351, max: 400, boost: 3 },

        { min: 401, max: 500, boost: 2 }

    ]

};
