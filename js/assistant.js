// ======================================
// AE Companion - Assistente Strategico
// Non è un'AI: riconosce il tipo di domanda per parole
// chiave e risponde con gli stessi calcoli usati altrove
// nell'app, in forma di conversazione.
// ======================================

function normalizeText(str) {

    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // rimuove accenti

}

function matchesAny(text, keywords) {

    return keywords.some(function (k) {
        return text.indexOf(k) !== -1;
    });

}

// ======================================
// Scenari ipotetici ("e se avessi X badge/terreni?")
// Diversi dai consigli fissi: qui l'utente specifica un
// numero, e il calcolo usa quel numero al posto del dato reale.
// ======================================

// Badge ipotetici: calcolo ESATTO, perché i terreni restano
// gli stessi (nessuna stima sulla rarità di nuovi terreni)
function computeBadgeWhatIf(targetBadges) {

    const totalLands = getTotalLands();

    const raw = getRawIncomePerSecond();
    const badgeBonus = 1 + (getBadgeBoostPercent(targetBadges) / 100);
    const boost = getCurrentBoost(totalLands);

    return raw * badgeBonus * boost * 86400; // USD al giorno

}

// Terreni ipotetici: qui invece è una STIMA, perché la rarità
// dei terreni non ancora posseduti è assegnata a caso
function computeLandsWhatIf(targetLands) {

    const currentTotal = getTotalLands();
    const currentRaw = getRawIncomePerSecond();

    let projectedRaw;

    if (targetLands <= currentTotal || currentTotal === 0) {

        projectedRaw = getExpectedRentPerSecondPerLand() * targetLands;

    } else {

        const additionalLands = targetLands - currentTotal;

        projectedRaw = currentRaw + (additionalLands * getExpectedRentPerSecondPerLand());

    }

    const badgeBonus = 1 + (getBadgeBoostPercent(player.badges) / 100);
    const boost = getCurrentBoost(targetLands);

    return projectedRaw * badgeBonus * boost * 86400; // USD al giorno

}

// ======================================
// Intenti riconosciuti
// ======================================

function getAssistantIntents() {

    const totalLands = getTotalLands();

    return [

        {
            test: function (text) {
                return text.match(/(\d+)\s*badge/);
            },
            handler: function (match) {

                const targetBadges = parseInt(match[1], 10);

                if (totalLands === 0) return t("tipNoData");

                const dailyUSD = computeBadgeWhatIf(targetBadges);
                const percent = getBadgeBoostPercent(targetBadges);

                const convert = function (usd) {
                    return getCurrentLanguage() === "it" ? usd * CONFIG.exchangeRate : usd;
                };

                return t("assistantWhatIfBadge", {
                    badges: targetBadges,
                    percent: percent,
                    daily: formatCurrency(convert(dailyUSD)),
                    monthly: formatCurrency(convert(dailyUSD * 30)),
                    yearly: formatCurrency(convert(dailyUSD * 365)),
                    currentDaily: formatCurrency(getDailyIncomeConverted())
                });

            }
        },

        {
            test: function (text) {
                return text.match(/(\d+)\s*(terreni|lands|parcels|parcelle)/);
            },
            handler: function (match) {

                const targetLands = parseInt(match[1], 10);

                const dailyUSD = computeLandsWhatIf(targetLands);
                const boost = getCurrentBoost(targetLands);

                const convert = function (usd) {
                    return getCurrentLanguage() === "it" ? usd * CONFIG.exchangeRate : usd;
                };

                return t("assistantWhatIfLands", {
                    lands: targetLands,
                    boost: boost,
                    daily: formatCurrency(convert(dailyUSD)),
                    currentDaily: formatCurrency(getDailyIncomeConverted())
                });

            }
        },

        {
            keywords: ["ciao", "salve", "hey", "hello", "hi "],
            handler: function () { return t("assistantGreeting"); }
        },

        {
            keywords: ["aiuto", "help", "cosa sai fare", "cosa puoi fare", "esempi"],
            handler: function () { return t("assistantHelp"); }
        },

        {
            keywords: [
                "boost", "soglia", "scende", "fascia", "scala",
                "downgrade", "zona morta", "dead zone"
            ],
            handler: function () {
                return getBoostAdviceText(totalLands).text;
            }
        },

        {
            keywords: [
                "conviene comprare", "meglio comprare", "cosa compro",
                "cosa acquisto", "terreni o badge", "badge o terreni",
                "cosa conviene", "should i buy", "better to buy"
            ],
            handler: function () {
                if (totalLands === 0) return t("tipNoData");
                return getEfficiencyTip(totalLands);
            }
        },

        {
            keywords: [
                "obiettivo", "quanto manca", "quanto mi manca",
                "quando raggiungo", "target", "my goal", "how long until"
            ],
            handler: function () {
                if (totalLands === 0) return t("tipNoData");
                return getPrimaryGoalTip(totalLands).text;
            }
        },

        {
            keywords: [
                "quanto guadagno", "rendita", "reddito", "quanto rendo",
                "how much do i earn", "income"
            ],
            handler: function () {

                return t("assistantIncomeSummary", {
                    daily: formatCurrency(getDailyIncomeConverted()),
                    monthly: formatCurrency(getMonthlyIncomeConverted()),
                    yearly: formatCurrency(getYearlyIncomeConverted())
                });

            }
        },

        {
            keywords: ["mayor", "sindaco"],
            handler: function () { return t("tipMayorStrategy"); }
        },

        {
            keywords: [
                "badge mancano", "prossima soglia badge", "passaporto",
                "quanti badge"
            ],
            handler: function () {

                const currentPercent = getBadgeBoostPercent(player.badges);
                const nextTier = getNextBadgeTier(player.badges);

                if (!nextTier) return t("tipBadgeMaxAssistant", { percent: currentPercent });

                return t("assistantBadgeProgress", {
                    remaining: nextTier.min - player.badges,
                    percent: nextTier.percent,
                    current: currentPercent
                });

            }
        },

        {
            keywords: ["super potenziamento", "srb", "x50", "50x"],
            handler: function () {

                return t("assistantSRB", {
                    value: formatCurrency(getSRBDailyIncomeEstimateConverted())
                });

            }
        },

        {
            keywords: [
                "quanti ab ho", "saldo", "gruzzolo", "ab disponibili",
                "how much ab"
            ],
            handler: function () {
                return t("assistantABBalance", { balance: formatK(player.settings.abBalance) });
            }
        },

        {
            keywords: [
                "quanti terreni ho", "i miei terreni", "rarita",
                "how many lands"
            ],
            handler: function () {

                return t("assistantLandsBreakdown", {
                    total: formatK(totalLands),
                    common: formatK(player.lands.common),
                    rare: formatK(player.lands.rare),
                    epic: formatK(player.lands.epic),
                    legendary: formatK(player.lands.legendary)
                });

            }
        },

        {
            keywords: [
                "guadagno ab", "guadagnare ab", "piu ab", "arcade",
                "sondaggi", "mini-giochi", "minigiochi", "ottengo ab",
                "earn more ab", "earn ab", "more ab"
            ],
            handler: function () {
                return t("assistantABSources");
            }
        }

    ];

}

function getAssistantReply(userText) {

    const normalized = normalizeText(userText);

    const intents = getAssistantIntents();

    for (let i = 0; i < intents.length; i++) {

        const intent = intents[i];

        if (intent.test) {

            const match = intent.test(normalized);

            if (match) return intent.handler(match);

        } else if (matchesAny(normalized, intent.keywords)) {

            return intent.handler();

        }

    }

    return t("assistantFallback");

}

// ======================================
// Interfaccia chat
// ======================================

function appendChatBubble(text, sender) {

    const messages = document.getElementById("assistant-messages");

    if (!messages) return;

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble " + sender;
    bubble.textContent = text;

    messages.appendChild(bubble);

    messages.scrollTop = messages.scrollHeight;

}

function sendAssistantMessage() {

    const input = document.getElementById("assistant-input");

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;

    appendChatBubble(text, "user");

    input.value = "";

    const reply = getAssistantReply(text);

    setTimeout(function () {

        appendChatBubble(reply, "bot");

    }, 350);

}

function handleAssistantKeydown(event) {

    if (event.key === "Enter") {

        event.preventDefault();
        sendAssistantMessage();

    }

}

function askAssistantSuggestion(text) {

    const input = document.getElementById("assistant-input");

    if (input) input.value = text;

    sendAssistantMessage();

}

window.addEventListener("DOMContentLoaded", function () {

    const messages = document.getElementById("assistant-messages");

    if (messages && messages.children.length === 0) {

        appendChatBubble(t("assistantGreeting"), "bot");

    }

});
