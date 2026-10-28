// ======================================
// AE Companion Configuration - Italia
// Versione 1.0
// ======================================

const CONFIG = {

    country: "IT",

    // Valuta (storica, non piu' usata per decidere cosa mostrare: vedi js/money.js e prefs.js)
    currency: "EUR",

    // Cambio di VISUALIZZAZIONE (v0.10.0): nessun tasso e' scritto nel codice. I tassi USD -> valuta mostrata
    // arrivano dall'API Frankfurter (v2, senza chiave) e vengono messi in cache in localStorage (js/fx.js).
    // Le formule di gioco restano in USD: la conversione avviene solo al confine di visualizzazione.
    fx: {
        endpoint: "https://api.frankfurter.dev/v2/rates",     // GET ?base=USD -> [{date, base, quote, rate}, ...]
        docsUrl: "https://frankfurter.dev/",
        sourceName: "Frankfurter",
        cacheKey: "aeFxRates.v1",                              // chiave NUOVA e versionabile; non tocca profilo e preferenze
        cacheTtlMs: 12 * 60 * 60 * 1000,                       // oltre 12 h il dato e' scaduto e viene riscaricato
        maxRateAgeDays: 7,                                     // data del tasso piu' vecchia di 7 giorni di calendario (UTC) = non aggiornato
        // Date nel futuro (v0.10.2): la data di un tasso e' un giorno di calendario. Si confronta con la data UTC dell'orologio del
        // dispositivo. Il giorno di calendario di un fuso gia' avanti (fino a UTC+14) puo' superare di 1 la data UTC: +1 giorno e'
        // quindi giustificato; oltre +1 e' sospetto e il record viene scartato (non usato, non mostrato come aggiornato).
        // Osservato sulla risposta reale del 2026-10-24: molte valute principali datate 2026-10-25 (e il 25/10 EUR datato 26/10).
        // v0.10.3: un tasso con data futura ENTRO la tolleranza e' usato ma marcato PROVVISORIO (stato "provisional", avviso visibile),
        // mai dichiarato aggiornato. La tolleranza e' una scelta prudenziale, NON una garanzia del fornitore. 0 = rifiuta ogni data futura.
        futureToleranceDays: 1,
        retryCooldownMs: 60 * 1000,                            // dopo un errore non si riprova prima di 60 s (salvo ritorno online)
        timeoutMs: 8000,
        // Valute selezionabili (codici ISO 4217). Un codice e' usabile solo se la risposta dell'API lo contiene davvero.
        currencies: ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "NZD", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON",
            "TRY", "BRL", "MXN", "ARS", "CLP", "COP", "INR", "CNY", "HKD", "SGD", "KRW", "THB", "PHP", "IDR", "MYR",
            "ILS", "AED", "SAR", "ZAR", "KWD", "BHD"]
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
