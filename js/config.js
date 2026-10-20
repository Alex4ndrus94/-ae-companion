// ======================================
// AE Companion Configuration - Italia
// Versione 1.0
// ======================================

const CONFIG = {

    country: "IT",

    // Valuta (storica, non piu' usata per decidere cosa mostrare: vedi js/money.js e prefs.js)
    currency: "EUR",

    // Tasso di conversione USD -> EUR: valore FISSO e INDICATIVO, non corrente ne' ufficiale.
    // Nessun servizio remoto lo aggiorna. Mantenuto invariato rispetto a v0.8.1.
    exchangeRate: 0.86,
    exchangeRateInfo: {
        usdToEur: 0.86,
        source: "valore fisso del progetto (v0.8.1), non verificato con una fonte aggiornata",
        updated: null
    },

    landCostAB: 100,

    // Conversione rendita -> AB: tasso fisso ufficiale di 25 AB per 1 USD di rendita virtuale
    // (Help Center, faq/35 e faq/248). La rendita e' sempre in USD: la valuta mostrata dall'app
    // NON influisce sugli AB ricevuti.
    abPerUSDRent: 25,

    badgeCostAB: 200,

    // Moltiplicatore del Super Rent Boost: "50X" e' indicato dall'Help Center ufficiale
    // (limite 150.000 terreni). Durata e frequenza degli eventi NON sono garantite: l'app mostra
    // solo la stima GIORNALIERA durante l'evento (dalla v0.9.2 nessuna ipotesi mensile).
    srbMultiplier: 50,
    // Limite ufficiale: il x50 vale per i primi 150.000 terreni; quelli oltre il limite rendono
    // al tasso standard del proprio scaglione (Help Center, faq/484). Vedi docs/10-REPORT-FASE1.1-v0.9.1.md e docs/11-REPORT-FASE1.2-v0.9.2.md.
    srbParcelLimit: 150000,

    // Costi indicativi dei pass a pagamento (fonte: Atlas Earth Help Center)
    passCosts: {
        explorerUSD: 49.99,   // Atlas Explorer Club, al mese
        missionUSD: 9.99      // Mission Pass (Season Pass sfide), al mese
    },

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
