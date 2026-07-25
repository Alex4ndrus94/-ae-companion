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
        tipCountdown: "Ti mancano {remaining} terreni per il prossimo obiettivo ({next} terreni). Al tuo ritmo attuale ({daily} AB/giorno) ci arrivi in circa {daysText}.",
        tipBoostDrop: "Attenzione: superata questa soglia il tuo boost scenderà da x{current} a x{next}. Se puoi, conviene accelerare gli acquisti ora mentre il boost è più alto.",
        tipLastBreakpoint: "Hai raggiunto l'ultimo breakpoint disponibile: il tuo boost è ormai fisso.",
        tipRarity: "A parità di costo ({cost} AB a terreno), un Legendary rende circa {mult}x un Common. Se puoi scegliere la rarità, punta sempre al livello più alto disponibile.",
        tipBadge: "Ogni badge costa {cost} AB, il doppio di un terreno: valuta se ti conviene ora in base ai tuoi obiettivi.",

        settingsTitleEdit: "✏️ Modifica dati",
        settingsTitleOnboarding: "👋 Benvenuto!",
        settingsIntro: "Inserisci il tuo nome e i tuoi dati di partenza. Resteranno salvati su questo dispositivo.",
        nameLabel: "Nome",
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
        tipCountdown: "You need {remaining} more lands to reach the next goal ({next} lands). At your current pace ({daily} AB/day) you'll get there in about {daysText}.",
        tipBoostDrop: "Heads up: once you pass this threshold your boost will drop from x{current} to x{next}. If you can, consider buying more now while the boost is higher.",
        tipLastBreakpoint: "You've reached the last available breakpoint: your boost is now fixed.",
        tipRarity: "At the same cost ({cost} AB per land), a Legendary earns about {mult}x a Common. If you can choose the rarity, always aim for the highest tier available.",
        tipBadge: "Each badge costs {cost} AB, double the cost of a land: consider whether it's worth it right now based on your goals.",

        settingsTitleEdit: "✏️ Edit data",
        settingsTitleOnboarding: "👋 Welcome!",
        settingsIntro: "Enter your name and starting data. It will be saved on this device.",
        nameLabel: "Name",
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

    if (typeof renderDashboard === "function") renderDashboard();

}

currentLang = detectLanguage();
