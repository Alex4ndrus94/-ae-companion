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

        boostActive: "⚡ Boost attivo x{mult} (+{percent}%)",
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
        tipNoData: "Inserisci i tuoi terreni dal pannello ✏️ per ricevere consigli personalizzati.",
        tipBoostUrgent: "Attenzione: ti mancano solo {remaining} terreni prima che il tuo boost scenda da x{current} a x{next}. Se hai budget, comprali ora per restare più a lungo nella fascia ad alto rendimento.",
        tipBoostRelaxed: "Hai ancora {remaining} terreni di margine prima che il boost scenda a x{next}: nessuna fretta, puoi accumulare AB con calma.",
        tipLastBreakpoint: "Hai raggiunto l'ultimo breakpoint disponibile: il tuo boost è ormai fisso, indipendentemente da quanti terreni comprerai ancora.",
        tipRarity: "Un terreno Legendary rende circa {mult}x un Common allo stesso costo ({cost} AB): se puoi scegliere la rarità, scarta sempre i Common quando possibile.",
        tipWhatIf: "Se aumentassi il tuo ritmo giornaliero da {daily} a {increased} AB (+20%), raggiungeresti il prossimo obiettivo circa {daysSaved} prima.",
        tipBadgeNextTier: "Ti mancano {remaining} badge per salire al bonus passaporto del +{percent}% (attualmente +{current}%): ogni badge in più aumenta la tua rendita in modo permanente.",
        tipBadgeMax: "Hai raggiunto il bonus massimo del passaporto (+25%): il tuo numero di badge è già ottimale per la rendita.",
        badgeBonusInfo: "🎖️ Bonus passaporto: +{percent}% ({badges} badge)",

        settingsTitleEdit: "✏️ Modifica dati",
        settingsTitleOnboarding: "👋 Benvenuto!",
        settingsIntro: "Inserisci il tuo nome e i tuoi dati di partenza. Resteranno salvati su questo dispositivo.",
        nameLabel: "Nome",
        countryLabel: "Paese",
        sectionLands: "Terreni",
        sectionOther: "Altri dati",
        badgeLabel: "Badge",
        mayorTargetLabel: "Obiettivo Mayor",
        dailyABLabel: "AB guadagnati al giorno",
        cancel: "Annulla",
        save: "Salva",

        installIOS: "Aggiungi AE Companion alla Home: tocca Condividi (□↑) e poi \"Aggiungi a Home\"",
        installAndroid: "Installa AE Companion sul tuo dispositivo per un accesso più rapido",
        installAction: "Installa",

        createdBy: "Creato da",
        igCta: "📩 Richieste o consigli? Scrivimi su Instagram",
        coffeeCta: "☕ Ti è utile? Offrimi un caffè",
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

        boostActive: "⚡ Active boost x{mult} (+{percent}%)",
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
        tipNoData: "Enter your lands from the ✏️ panel to get personalized tips.",
        tipBoostUrgent: "Heads up: only {remaining} more lands before your boost drops from x{current} to x{next}. If you have the budget, buy now to stay in the high-yield bracket longer.",
        tipBoostRelaxed: "You still have {remaining} lands of margin before your boost drops to x{next}: no rush, take your time accumulating AB.",
        tipLastBreakpoint: "You've reached the last available breakpoint: your boost is now fixed no matter how many more lands you buy.",
        tipRarity: "A Legendary land earns about {mult}x a Common one at the same cost ({cost} AB): if you can choose the rarity, always skip Commons when possible.",
        tipWhatIf: "If you increased your daily pace from {daily} to {increased} AB (+20%), you'd reach the next goal about {daysSaved} sooner.",
        tipBadgeNextTier: "You need {remaining} more badges to reach the +{percent}% passport bonus (currently +{current}%): every extra badge permanently boosts your income.",
        tipBadgeMax: "You've reached the maximum passport bonus (+25%): your badge count is already optimal for your income.",
        badgeBonusInfo: "🎖️ Passport bonus: +{percent}% ({badges} badges)",

        settingsTitleEdit: "✏️ Edit data",
        settingsTitleOnboarding: "👋 Welcome!",
        settingsIntro: "Enter your name and starting data. It will be saved on this device.",
        nameLabel: "Name",
        countryLabel: "Country",
        sectionLands: "Lands",
        sectionOther: "Other data",
        badgeLabel: "Badges",
        mayorTargetLabel: "Mayor goal",
        dailyABLabel: "AB earned per day",
        cancel: "Cancel",
        save: "Save",

        installIOS: "Add AE Companion to your Home Screen: tap Share (□↑) then \"Add to Home Screen\"",
        installAndroid: "Install AE Companion on your device for quicker access",
        installAction: "Install",

        createdBy: "Created by",
        igCta: "📩 Requests or feedback? Message me on Instagram",
        coffeeCta: "☕ Find this useful? Buy me a coffee",
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
