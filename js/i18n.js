// ======================================
// AE Companion - Internazionalizzazione
// ======================================

const I18N_KEY = "aeLang";

const translations = {

    it: {

        appName: "AE Companion",
        tagline: "Track • Plan • Conquer",

        lands: "Terreni",
        income: "Rendita",
        today: "OGGI",
        month: "MESE",
        year: "ANNO",

        boostActive: "Boost attivo x{mult} (+{percent}%)",
        boostCompare: "Senza boost guadagneresti {base}/giorno anziché {boosted}",

        strategy: "Strategia",
        landsLabel: "Terreni",
        costLabel: "Costo",
        abPerDay: "AB/giorno",
        timeLabel: "Tempo",
        nextGoal: "Prossimo obiettivo",

        progressText: "{total} / {next} terreni • Ne manca {remaining}",
        progressTextLast: "{total} terreni • Ultimo breakpoint",

        day: "giorno",
        days: "giorni",

        tips: "Consigli",
        tipNoData: "Inserisci i tuoi terreni dal pannello Modifica dati per ricevere consigli personalizzati.",
        tipAccumulate: "Al momento acquistare terreni o badge non aumenterebbe la tua rendita in modo significativo: conviene accumulare AB prima di spendere.",
        tipRecommendLand: "Conviene puntare sui terreni: ogni {abCost} AB investiti ti danno circa {gainFormatted} di rendita giornaliera in più — al momento è l'opzione più efficiente rispetto ai badge. Puoi permettertelo: {timeText}.",
        tipRecommendBadge: "Conviene puntare sul passaporto: con {abNeeded} AB raggiungi la soglia dei badge che sblocca il bonus +{percent}%, circa {gainFormatted} di rendita giornaliera in più — più efficiente dei terreni in questo momento. Puoi permettertelo: {timeText}.",
        tipGoalIncomeReached: "Hai già raggiunto il tuo obiettivo di rendita ({targetFormatted}/giorno)! Puoi impostarne uno più ambizioso dal pannello Modifica dati.",
        tipGoalIncomeGap: "Per arrivare a {targetFormatted}/giorno di rendita ti mancano circa {gapFormatted}/giorno. Al ritmo più efficiente attuale servono circa {abNeeded} AB (~{daysText}).",
        tipGoalLandsReached: "Hai già raggiunto il tuo obiettivo di {target} terreni! Impostane uno nuovo dal pannello Modifica dati per continuare a monitorare i progressi.",
        tipGoalLandsGap: "Per arrivare a {target} terreni ti mancano {remaining} terreni (~{abNeeded} AB): circa {daysText} al tuo ritmo attuale.",
        tipBoostUrgent: "Attenzione: ti mancano solo {remaining} terreni prima che il tuo boost scenda da x{current} a x{next}. Puoi permetterteli: {timeText} — comprali appena possibile per restare più a lungo nella fascia ad alto rendimento.",
        tipBoostRelaxed: "Hai ancora {remaining} terreni di margine prima che il boost scenda a x{next}: nessuna fretta, puoi accumulare AB con calma.",
        tipLastBreakpoint: "Hai raggiunto l'ultimo breakpoint disponibile: il tuo boost è ormai fisso, indipendentemente da quanti terreni comprerai ancora.",
        tipRarity: "La rarità di ogni terreno che acquisti è assegnata casualmente: hai circa il {legendaryOdds}% di probabilità di ottenere un Legendary, che rende {mult}x un Common allo stesso costo ({cost} AB). Non puoi scegliere la rarità, ma più terreni compri, più occasioni hai di ottenerne uno di pregio.",
        tipMayorStrategy: "Diventare mayor richiede più terreni di chiunque altro in quella specifica città: prima di accumulare terreni ovunque, valuta se conviene concentrarti su una città con pochi giocatori attivi, dove superare l'attuale mayor costa meno.",
        badgeBonusInfo: "Bonus passaporto: +{percent}% ({badges} badge)",
        srbBoxTitle: "Con il Super Potenziamento attivo (x50)",
        srbBoxNote: "Stima supplementare, non inclusa nella rendita ufficiale sopra: attiva solo durante l'evento (~2,5 giorni/mese) e per la durata in cui riesci a mantenerlo attivo.",

        settingsTitleEdit: "Modifica dati",
        settingsTitleOnboarding: "Benvenuto!",
        settingsIntro: "Inserisci il tuo nome e i tuoi dati di partenza. Resteranno salvati su questo dispositivo.",
        nameLabel: "Nome",
        countryLabel: "Paese",
        sectionLands: "Terreni",
        sectionGoal: "Il tuo obiettivo",
        goalEfficiency: "Massimizzare l'efficienza generale",
        goalIncome: "Raggiungere una rendita specifica",
        goalLands: "Raggiungere un numero di terreni",
        goalMayor: "Diventare mayor di una città",
        goalIncomeTargetLabel: "Rendita giornaliera obiettivo",
        goalIncomeBoostedLabel: "Includi il boost pubblicità nel calcolo",
        goalLandsTargetLabel: "Numero di terreni obiettivo",
        sectionOther: "Altri dati",
        badgeLabel: "Badge",
        mayorTargetLabel: "Obiettivo Mayor",
        dailyABLabel: "AB guadagnati al giorno",
        abBalanceLabel: "AB disponibili ora (gruzzolo)",
        abAvailableNow: "puoi farlo subito con gli AB che hai già da parte",
        cancel: "Annulla",
        save: "Salva",

        installIOS: "Aggiungi AE Companion alla Home: tocca Condividi (□↑) e poi \"Aggiungi a Home\"",
        installAndroid: "Installa AE Companion sul tuo dispositivo per un accesso più rapido",
        installAction: "Installa",

        abTipsTitle: "Come guadagnare più AB",
        abTipsDisclaimer: "Valori indicativi basati sull'esperienza della community, non dati ufficiali: possono variare.",
        abTipArcade: "Arcade: da 1 a 340 AB a partita, in base al livello e al gioco proposto. Se disponibile, la missione Arcade dà anche punti premio su una scala che va da 5-60 AB (gratis) a 25-260 AB (con Mission Pass).",
        abTipMinigames: "Mini-giochi disponibili: Atlas Golf, Atlas Warship, Atlas Bowling, Atlas Racer, Atlas Fishing — altra fonte di AB oltre all'Arcade.",
        abTipRentConversion: "Bonus conversione affitto: circa 33 AB per ogni € convertito dall'affitto.",
        abTipSurveyBoost: "Potenziamento sondaggi: aumenta gli AB guadagnati completando i sondaggi nella sezione Guadagna.",
        abTipSuperRentBoost: "Super Potenziamento Affitto (SRB): durante l'evento (circa 2,5 giorni al mese) l'affitto si accumula fino a 50x più veloce — pianifica gli acquisti di terreni prima di questo evento per sfruttarlo al massimo.",

        createdBy: "Creato da",
        igCta: "Richieste o consigli? Scrivimi su Instagram",
        coffeeCta: "Ti è utile? Offrimi un caffè",
        lastUpdate: "Ultimo aggiornamento",
        withoutBoost: "senza boost"

    },

    en: {

        appName: "AE Companion",
        tagline: "Track • Plan • Conquer",

        lands: "Lands",
        income: "Income",
        today: "TODAY",
        month: "MONTH",
        year: "YEAR",

        boostActive: "Active boost x{mult} (+{percent}%)",
        boostCompare: "Without boost you'd earn {base}/day instead of {boosted}",

        strategy: "Strategy",
        landsLabel: "Lands",
        costLabel: "Cost",
        abPerDay: "AB/day",
        timeLabel: "Time",
        nextGoal: "Next goal",

        progressText: "{total} / {next} lands • {remaining} to go",
        progressTextLast: "{total} lands • Last breakpoint",

        day: "day",
        days: "days",

        tips: "Tips",
        tipNoData: "Enter your lands from the Edit data panel to get personalized tips.",
        tipAccumulate: "Right now buying lands or badges wouldn't meaningfully increase your income: it's worth accumulating AB before spending.",
        tipRecommendLand: "Lands are the better move right now: every {abCost} AB invested gets you about {gainFormatted} more daily income — more efficient than badges at the moment. You can afford it: {timeText}.",
        tipRecommendBadge: "The passport is the better move right now: {abNeeded} AB gets you to the badge threshold that unlocks the +{percent}% bonus, about {gainFormatted} more daily income — more efficient than lands at the moment. You can afford it: {timeText}.",
        tipGoalIncomeReached: "You've already reached your income goal ({targetFormatted}/day)! You can set a more ambitious one from the Edit data panel.",
        tipGoalIncomeGap: "You need about {gapFormatted}/day more to reach {targetFormatted}/day. At the current most efficient pace, that's about {abNeeded} AB (~{daysText}).",
        tipGoalLandsReached: "You've already reached your goal of {target} lands! Set a new one from the Edit data panel to keep tracking your progress.",
        tipGoalLandsGap: "You need {remaining} more lands to reach {target} (~{abNeeded} AB): about {daysText} at your current pace.",
        tipBoostUrgent: "Heads up: only {remaining} more lands before your boost drops from x{current} to x{next}. You can afford it: {timeText} — buy as soon as you can to stay in the high-yield bracket longer.",
        tipBoostRelaxed: "You still have {remaining} lands of margin before your boost drops to x{next}: no rush, take your time accumulating AB.",
        tipLastBreakpoint: "You've reached the last available breakpoint: your boost is now fixed no matter how many more lands you buy.",
        tipRarity: "The rarity of each land you buy is assigned randomly: you have about a {legendaryOdds}% chance of getting a Legendary, which earns {mult}x a Common one at the same cost ({cost} AB). You can't choose the rarity, but the more lands you buy, the more chances you get a valuable one.",
        tipMayorStrategy: "Becoming mayor requires owning more lands than anyone else in that specific city: before buying lands everywhere, consider focusing on a city with few active players, where overtaking the current mayor costs less.",
        badgeBonusInfo: "Passport bonus: +{percent}% ({badges} badges)",
        srbBoxTitle: "With Super Rent Boost active (x50)",
        srbBoxNote: "Supplementary estimate, not included in the official income above: only active during the event (~2.5 days/month) and for as long as you can keep it active.",

        settingsTitleEdit: "Edit data",
        settingsTitleOnboarding: "Welcome!",
        settingsIntro: "Enter your name and starting data. It will be saved on this device.",
        nameLabel: "Name",
        countryLabel: "Country",
        sectionLands: "Lands",
        sectionGoal: "Your goal",
        goalEfficiency: "Maximize overall efficiency",
        goalIncome: "Reach a specific income",
        goalLands: "Reach a number of lands",
        goalMayor: "Become mayor of a city",
        goalIncomeTargetLabel: "Target daily income",
        goalIncomeBoostedLabel: "Include ad boost in the calculation",
        goalLandsTargetLabel: "Target number of lands",
        sectionOther: "Other data",
        badgeLabel: "Badges",
        mayorTargetLabel: "Mayor goal",
        dailyABLabel: "AB earned per day",
        abBalanceLabel: "AB available now (savings)",
        abAvailableNow: "you can do it right now with the AB you already have saved",
        cancel: "Cancel",
        save: "Save",

        installIOS: "Add AE Companion to your Home Screen: tap Share (□↑) then \"Add to Home Screen\"",
        installAndroid: "Install AE Companion on your device for quicker access",
        installAction: "Install",

        abTipsTitle: "How to earn more AB",
        abTipsDisclaimer: "Indicative values based on community experience, not official data: they may vary.",
        abTipArcade: "Arcade: 1 to 340 AB per game, depending on your level and the game offered. If available, the Arcade mission also gives reward points on a scale from 5-60 AB (free) to 25-260 AB (with Mission Pass).",
        abTipMinigames: "Available mini-games: Atlas Golf, Atlas Warship, Atlas Bowling, Atlas Racer, Atlas Fishing — another AB source besides Arcade.",
        abTipRentConversion: "Rent conversion bonus: about 33 AB for every € converted from rent.",
        abTipSurveyBoost: "Survey boost: increases the AB earned by completing surveys in the Earn section.",
        abTipSuperRentBoost: "Super Rent Boost (SRB): during the event (about 2.5 days per month) rent accrues up to 50x faster — plan your land purchases ahead of this event to make the most of it.",

        createdBy: "Created by",
        igCta: "Requests or feedback? Message me on Instagram",
        coffeeCta: "Find this useful? Buy me a coffee",
        lastUpdate: "Last update",
        withoutBoost: "without boost"

    }

};

let currentLang = "it";

function detectLanguage() {

    const saved = localStorage.getItem(I18N_KEY);

    if (saved && translations[saved]) return saved;

    const nav = (navigator.language || "en").toLowerCase();

    return nav.startsWith("it") ? "it" : "en";

}

function getCurrentLanguage() {

    return currentLang;

}

function t(key, vars) {

    let str = (translations[currentLang] && translations[currentLang][key])
        || translations.en[key]
        || key;

    if (vars) {

        Object.keys(vars).forEach(function (k) {
            str = str.replace("{" + k + "}", vars[k]);
        });

    }

    return str;

}

// Formatta "N giorno/giorni" o "N day/days" nella lingua corrente
function formatDays(n) {

    const unit = n === 1 ? t("day") : t("days");

    return n + " " + unit;

}

function applyTranslations() {

    document.documentElement.lang = currentLang;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {

        el.textContent = t(el.getAttribute("data-i18n"));

    });

    document.querySelectorAll(".lang-btn").forEach(function (btn) {

        btn.classList.toggle("active", btn.getAttribute("data-lang") === currentLang);

    });

}

function setLanguage(lang) {

    if (!translations[lang]) return;

    currentLang = lang;

    localStorage.setItem(I18N_KEY, lang);

    applyTranslations();

    if (typeof populateCountrySelect === "function") populateCountrySelect();

    if (typeof renderDashboard === "function") renderDashboard();

}

currentLang = detectLanguage();
