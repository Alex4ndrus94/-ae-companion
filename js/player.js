// ======================================
// AE Companion - Player Profile
// ======================================

const player = {

    // ==================================
    // Profilo
    // ==================================

    profile: {

        name: "",
        country: "IT"

    },

    // ==================================
    // Terreni
    // ==================================

    lands: {

        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0

    },

    // ==================================
    // Badge
    // ==================================

    badges: 0,

    // ==================================
    // Mayor
    // ==================================

    mayorships: [],

    mayorTarget: 0,

    // ==================================
    // Pass
    // ==================================

    passes: {

        explorer: false,
        mission: false

    },

    // ==================================
    // Obiettivo principale
    // ==================================

    goal: {

        type: "efficiency",       // "efficiency" | "income" | "lands" | "mayor"
        incomeTargetUSD: 1,       // target rendita, sempre salvato in USD internamente
        incomeTargetBoosted: true, // true = obiettivo con boost, false = senza boost
        landsTarget: 0            // target numero totale di terreni

    },

    // ==================================
    // Impostazioni
    // ==================================

    settings: {

        dailyLoginAB: 50,
        abBalance: 0      // AB attualmente disponibili (gruzzolo accumulato)

    }

};
