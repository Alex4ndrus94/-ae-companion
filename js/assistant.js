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
function computeLandsWhatIf(targetLands, badgesOverride) {

    const currentTotal = getTotalLands();
    const currentRaw = getRawIncomePerSecond();

    let projectedRaw;

    if (targetLands <= currentTotal || currentTotal === 0) {

        projectedRaw = getExpectedRentPerSecondPerLand() * targetLands;

    } else {

        const additionalLands = targetLands - currentTotal;

        projectedRaw = currentRaw + (additionalLands * getExpectedRentPerSecondPerLand());

    }

    const badgesForBonus = (badgesOverride === undefined || badgesOverride === null) ? player.badges : badgesOverride;
    const badgeBonus = 1 + (getBadgeBoostPercent(badgesForBonus) / 100);
    const boost = getCurrentBoost(targetLands);

    return projectedRaw * badgeBonus * boost * 86400; // USD al giorno

}

// ======================================
// Parser dei numeri scritti dall'utente (separatori delle migliaia vs decimali)
// I conteggi (terreni, badge) sono sempre interi: "1.014" e "1,014" = 1014, non 14 ne' 1,014.
// status: "ok" | "invalid" (negativo, non intero, fuori scala) | "ambiguous" (serve conferma)
// ======================================

const ASSISTANT_MAX_COUNT = 1000000;

function parseCountToken(raw) {

    const res = { status: "invalid", value: null, raw: raw };

    if (typeof raw !== "string" || raw === "") return res;

    if (raw.charAt(0) === "-") return res;                       // negativo

    if (/^\d+$/.test(raw)) {
        const v = parseInt(raw, 10);
        if (v > ASSISTANT_MAX_COUNT) return res;
        return { status: "ok", value: v, raw: raw };
    }

    if (!/^\d[\d.,]*\d$/.test(raw)) return res;

    const hasDot = raw.indexOf(".") !== -1;
    const hasComma = raw.indexOf(",") !== -1;
    const isGroups = function (parts) {
        return /^\d{1,3}$/.test(parts[0]) && parts.slice(1).every(function (g) { return /^\d{3}$/.test(g); });
    };
    const finish = function (digits) {
        const v = parseInt(digits, 10);
        if (v > ASSISTANT_MAX_COUNT) return res;
        return { status: "ok", value: v, raw: raw };
    };

    if (hasDot && hasComma) {

        // L'ultimo separatore e' il decimale, l'altro e' delle migliaia
        const dec = raw.lastIndexOf(".") > raw.lastIndexOf(",") ? "." : ",";
        const thou = dec === "." ? "," : ".";
        const decParts = raw.split(dec);

        if (decParts.length !== 2) return res;

        const intParts = decParts[0].split(thou);

        if (!isGroups(intParts)) return res;
        if (!/^0+$/.test(decParts[1])) return res;               // parte decimale diversa da zero: non e' un conteggio intero

        return finish(intParts.join(""));

    }

    const sep = hasDot ? "." : ",";
    const parts = raw.split(sep);

    if (parts.length > 2) {
        return isGroups(parts) ? finish(parts.join("")) : res;
    }

    // un solo separatore
    if (/^\d{3}$/.test(parts[1])) {

        if (/^[1-9]\d{0,2}$/.test(parts[0])) return finish(parts.join(""));   // 1.014 / 1,014 -> 1014

        if (parts[0] === "0") {                                  // 0.500 / 0,500: decimale o 500? chiedi conferma
            return { status: "ambiguous", value: parseInt(parts[1], 10), raw: raw };
        }

        return res;

    }

    if (/^0+$/.test(parts[1])) return finish(parts[0]);          // 100.00 -> 100

    return res;                                                  // 1.5 / 1,25: non e' un numero intero di terreni/badge

}

const ASSISTANT_NUM = "(-?\\d(?:[\\d.,]*\\d)?)";

function extractQuantity(text, nounPattern) {

    const m = new RegExp(ASSISTANT_NUM + "\\s*(?:" + nounPattern + ")").exec(text);

    if (!m) return null;

    return parseCountToken(m[1]);

}

function extractAssistantQuantities(text) {

    const lands = extractQuantity(text, "terren[io]|lands?|parcels?|parcelle");
    const badges = extractQuantity(text, "badges?");

    if (!lands && !badges) return null;

    return { lands: lands, badges: badges };

}

// ======================================
// Riconoscimento delle domande sul Super Rent Boost (SRB)
// Il testo e' gia' normalizzato (minuscolo, senza accenti). Il riconoscimento e' SPECIFICO: una
// domanda generica come "quanto rendo?" o "cos'e' la zona morta?" NON e' una domanda SRB.
// ======================================

// v0.9.4: il riconoscimento SRB e' ESPLICITO. Solo nome/sigla (srb, super rent boost, super potenziamento, super boost) o x50
// portano al gestore SRB. «evento» + «guadagno/rendita/boost» NON bastano: l'evento potrebbe essere un'altra meccanica di
// gioco, quindi la domanda e' ambigua e si chiede un chiarimento (isAmbiguousEventQuestion). Le domande sugli AB / Airbucks
// (isABEventQuestion) non sono mai richieste di stima della rendita SRB.
function hasExplicitSRBTerm(text) {

    // sigla o nome esplicito: "srb", "super rent boost", "super potenziamento", "super boost"
    if (/(?:^|[^a-z0-9])srb(?![a-z0-9])/.test(text)) return true;
    if (/super[\s-]*rent[\s-]*boost/.test(text)) return true;
    if (/super[\s-]*potenziament/.test(text)) return true;
    if (/super[\s-]*boost/.test(text)) return true;

    // riferimento esplicito al x50 ("x50", "50x", "×50", "50×")
    return /(?:^|[^a-z0-9])(?:x\s?50|50\s?x|\u00d7\s?50|50\s?\u00d7)(?![0-9])/.test(text);

}

function hasABWord(text) {
    return /(?:^|[^a-z])(?:ab|airbucks?|air[\s-]bucks?)(?![a-z])/.test(text);
}

function hasEventWord(text) {
    return /(?:^|[^a-z])(?:event[oi]|events?)(?![a-z])/.test(text);
}

function isSRBQuestion(text) {

    return hasExplicitSRBTerm(text) && !hasABWord(text);

}

// Domande su AB / Airbucks legate all'evento o all'SRB («come guadagno AB durante l'SRB?», «how many AB during the event?»):
// risposta sulle fonti di AB, mai la stima di rendita SRB.
function isABEventQuestion(text) {

    return hasABWord(text) && (hasExplicitSRBTerm(text) || hasEventWord(text));

}

// «evento» + parola di rendita/guadagno o di boost, senza nome SRB e senza AB: intento ambiguo -> chiarimento, nessun importo.
function isAmbiguousEventQuestion(text) {

    if (!hasEventWord(text) || hasExplicitSRBTerm(text) || hasABWord(text)) return false;

    const hasBoostWord = /(?:rent[\s-]*boost|boost|potenziament)/.test(text);
    const hasIncomeWord = /(?:guadagn|(?:^|[^a-z])rend(?:o|e|ere|erei|erebbe|ita|imento)(?![a-z])|reddit|(?:^|[^a-z])(?:earn|earnings|income|rent|yield)(?![a-z]))/.test(text);

    return hasBoostWord || hasIncomeWord;

}

// ======================================
// Intenti riconosciuti
// ======================================

function getAssistantIntents() {

    const totalLands = getTotalLands();

    return [

        {
            // Priorita' ALTISSIMA (v0.9.3, v0.9.4: solo riferimenti ESPLICITI): una domanda SRB esplicita usa SEMPRE il calcolo SRB dedicato, anche quando contiene
            // numeri (profilo ipotetico). Deve stare PRIMA del gestore generico dei what-if (terreni/badge) e dei gestori
            // generici ("boost", "quanto rendo", "rendita", "income"). Le domande non-SRB proseguono invariate.
            test: function (text) {
                return isSRBQuestion(text) ? { quantities: extractAssistantQuantities(text) } : null;
            },
            handler: function (m) { return getSRBAssistantReply(m.quantities); }
        },

        {
            // v0.9.4: AB / Airbucks legati a evento o SRB -> fonti AB, non stima di rendita (prima dei what-if numerici).
            test: function (text) { return isABEventQuestion(text); },
            handler: function () { return t("assistantABSources"); }
        },

        {
            // v0.9.4: «evento» + guadagno/boost senza SRB esplicito -> chiarimento (l'evento potrebbe non essere l'SRB).
            test: function (text) { return isAmbiguousEventQuestion(text); },
            handler: function () { return t("assistantEventAmbiguous"); }
        },

        {
            test: function (text) {
                return extractAssistantQuantities(text);
            },
            handler: function (q) {

                const entities = [q.lands, q.badges].filter(Boolean);

                for (let i = 0; i < entities.length; i++) {

                    const e = entities[i];

                    if (e.status === "invalid") return t("assistantNumberInvalid", { raw: e.raw });

                    if (e.status === "ambiguous") return t("assistantNumberAmbiguous", { raw: e.raw, value: e.value });

                }

                if (q.lands && q.badges) {

                    const dailyUSD = computeLandsWhatIf(q.lands.value, q.badges.value);

                    return t("assistantWhatIfBoth", {
                        lands: q.lands.value,
                        badges: q.badges.value,
                        boost: getCurrentBoost(q.lands.value),
                        percent: getBadgeBoostPercent(q.badges.value),
                        daily: formatCurrency(convertToDisplay(dailyUSD)),
                        currentDaily: formatCurrency(getDailyIncomeConverted())
                    });

                }

                if (q.badges) {

                    const targetBadges = q.badges.value;

                    if (totalLands === 0) return t("tipNoData");

                    const dailyUSD = computeBadgeWhatIf(targetBadges);

                    return t("assistantWhatIfBadge", {
                        badges: targetBadges,
                        percent: getBadgeBoostPercent(targetBadges),
                        daily: formatCurrency(convertToDisplay(dailyUSD)),
                        monthly: formatCurrency(convertToDisplay(dailyUSD * 30)),
                        yearly: formatCurrency(convertToDisplay(dailyUSD * 365)),
                        currentDaily: formatCurrency(getDailyIncomeConverted())
                    });

                }

                const targetLands = q.lands.value;
                const dailyUSD = computeLandsWhatIf(targetLands);

                return t("assistantWhatIfLands", {
                    lands: targetLands,
                    boost: getCurrentBoost(targetLands),
                    daily: formatCurrency(convertToDisplay(dailyUSD)),
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

// Risposta SRB: stesse funzioni della dashboard (getSRBDisplay). Entro 150.000 terreni e' concisa e senza
// intervallo; oltre il limite mostra stima centrale, intervallo teorico, ipotesi essenziali e avvertenza.
// v0.9.3: `q` = quantita' estratte dalla domanda (terreni/badge) oppure null. Se la domanda indica un numero di terreni
// o di badge DIVERSO da quello del profilo salvato, il calcolo SRB (income.js) e' applicato a una COPIA ipotetica:
// `player` non viene mai modificato. I dati non indicati nella domanda vengono dal profilo; se mancano dati essenziali
// (nessun terreno ne' salvato ne' indicato) si chiede un chiarimento invece di inventare valori.
function getSRBAssistantReply(q) {

    const savedTotal = getTotalLands();
    const nf = new Intl.NumberFormat(getDisplayLocale());

    let hypo = null;

    if (q) {

        const entities = [q.lands, q.badges].filter(Boolean);

        for (let i = 0; i < entities.length; i++) {

            if (entities[i].status === "invalid") return t("assistantNumberInvalid", { raw: entities[i].raw });

            if (entities[i].status === "ambiguous") return t("assistantNumberAmbiguous", { raw: entities[i].raw, value: entities[i].value });

        }

        const landsDiffer = !!q.lands && q.lands.value !== savedTotal;
        const badgesDiffer = !!q.badges && q.badges.value !== player.badges;

        if (landsDiffer || badgesDiffer) {

            const targetTotal = q.lands ? q.lands.value : savedTotal;

            if (targetTotal <= 0) return t("assistantSRBNeedData");

            const proj = q.lands ? getProjectedLands(targetTotal) : { lands: getProjectedLands(savedTotal).lands, mode: "saved", extra: 0 };

            hypo = {
                lands: proj.lands,
                mode: proj.mode,
                extra: proj.extra,
                total: targetTotal,
                badges: q.badges ? q.badges.value : player.badges,
                badgesFromProfile: !q.badges
            };

        }

    }

    if (!hypo && savedTotal === 0) return t("assistantSRBNeedData");

    const d = hypo ? getSRBDisplay(hypo.lands, hypo.badges) : getSRBDisplay();
    const det = d.view.details;
    const split = { total: nf.format(det.totalLands), limit: nf.format(det.limit), rest: nf.format(det.ordinaryLands), boost: det.ordinaryBoost };

    let reply;

    if (hypo) {

        const odds = CONFIG.rarityOdds;
        const rarityKey = { odds: "assistantSRBRarityOdds", scaled: "assistantSRBRarityScaled", extended: "assistantSRBRarityExtended", saved: "assistantSRBRaritySaved" }[hypo.mode];
        const rarity = t(rarityKey, { extra: nf.format(hypo.extra), common: odds.common, rare: odds.rare, epic: odds.epic, legendary: odds.legendary });
        const head = {
            lands: nf.format(hypo.total),
            badges: nf.format(hypo.badges),
            badgeSrc: hypo.badgesFromProfile ? t("assistantSRBBadgesProfile") : "",
            rarity: rarity
        };

        if (d.hasRange) {

            reply = t("assistantSRBHypoRange", Object.assign({ value: d.estimate, low: d.low, high: d.high }, head, split));

        } else {

            reply = t("assistantSRBHypo", Object.assign({ value: d.estimate }, head));

            if (d.view.overLimit) reply += " " + t("assistantSRBHypoSplit", split);

        }

    } else if (d.hasRange) {

        reply = t("assistantSRBRange", Object.assign({ value: d.estimate, low: d.low, high: d.high }, split));

    } else {

        reply = t("assistantSRB", { value: d.estimate });

        if (d.view.overLimit) reply += " " + t("assistantSRBSplit", split);

    }

    if (isCurrencyEstimated()) reply += " " + getAssistantCurrencyNote();

    return reply;

}

// v0.10.0: se la risposta contiene importi e il cambio NON e' valido e aggiornato (non aggiornato / non disponibile /
// valuta non fornita), l'avviso viene aggiunto a QUALSIASI risposta con importi, non solo a quelle SRB.
function getAssistantReply(userText) {

    const before = moneyFormatCounter;
    const reply = getAssistantReplyCore(userText);

    return appendAssistantCurrencyStatus(reply, moneyFormatCounter !== before);

}

function getAssistantReplyCore(userText) {

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

// Cronologia strutturata: i messaggi del bot non sono testo "congelato" ma (domanda, tipo),
// cosi' al cambio di lingua o valuta vengono rigenerati nella lingua/valuta correnti.
// Nota: la rigenerazione usa i dati correnti del giocatore (non una copia di quelli del momento).
const assistantHistory = [];

function appendChatBubble(text, sender) {

    const messages = document.getElementById("assistant-messages");

    if (!messages) return;

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble " + sender;
    bubble.textContent = text;

    messages.appendChild(bubble);

    messages.scrollTop = messages.scrollHeight;

}

function getAssistantEntryText(entry) {

    if (entry.kind === "greeting") return t("assistantGreeting");

    if (entry.kind === "reply") return getAssistantReply(entry.query);

    return entry.text;

}

function refreshAssistantMessages() {

    const messages = document.getElementById("assistant-messages");

    if (!messages || assistantHistory.length === 0) return;

    messages.innerHTML = "";

    assistantHistory.forEach(function (entry) {
        appendChatBubble(getAssistantEntryText(entry), entry.sender);
    });

}

function sendAssistantMessage() {

    const input = document.getElementById("assistant-input");

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;

    assistantHistory.push({ sender: "user", kind: "text", text: text });
    appendChatBubble(text, "user");

    input.value = "";

    const entry = { sender: "bot", kind: "reply", query: text };

    setTimeout(function () {

        assistantHistory.push(entry);
        appendChatBubble(getAssistantEntryText(entry), "bot");

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

        const greeting = { sender: "bot", kind: "greeting" };
        assistantHistory.push(greeting);
        appendChatBubble(getAssistantEntryText(greeting), "bot");

    }

});
