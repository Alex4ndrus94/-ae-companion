// ======================================
// AE Companion - Goal Engine
//
//   player.*  →  getStrategyModel()  →  renderStrategy(model)
//
// Questo file CALCOLA soltanto: restituisce un modello strategico
// strutturato in base all'obiettivo scelto dal player. Non tocca il DOM
// (la visualizzazione è in strategy-ui.js) e riusa i calcoli già presenti
// in calculator.js, income.js, advice.js e playerEngine.js.
// ======================================

// --------------------------------------
// Helper: AB, tempo, formattazione
// --------------------------------------

function getStrategyABState() {

    return {
        balance: Math.max(0, Number(player.settings.abBalance) || 0),
        // AB/day: automatici (reward table) se Explorer Club è in corso, altrimenti manuali
        daily: getEffectiveDailyAB()
    };

}

// Giorni necessari per arrivare a "ab" AB: prima il gruzzolo, poi il ritmo
// giornaliero. 0 = subito, null = impossibile stimare (nessun AB al giorno)
function getDaysForAB(ab) {

    if (ab === null || !isFinite(ab)) return null;

    const state = getStrategyABState();

    if (ab <= state.balance) return 0;

    // Explorer Club in corso: si sommano le reward giorno per giorno dalla
    // ladder (milestone inclusi), non AB/day × giorni
    const explorer = getExplorerState();

    if (isExplorerAutomatic(explorer)) return getExplorerDaysForAB(ab, state.balance, explorer);

    if (state.daily <= 0) return null;

    return Math.ceil((ab - state.balance) / state.daily);

}

function formatStrategyTime(ab) {

    const days = getDaysForAB(ab);

    if (days === null) return "—";

    if (days === 0) return t("strategyNow");

    return formatDays(days);

}

function formatStrategyAB(ab) {

    if (ab === null || !isFinite(ab)) return "—";

    return formatK(Math.ceil(ab)) + " AB";

}

// Importo (salvato in USD) nella valuta della lingua. Sotto 1 centesimo
// usa più decimali, altrimenti sparirebbe sempre come "0,00"
function formatStrategyMoney(usd) {

    const value = convertToDisplay(Number(usd) || 0);
    const lang = getCurrentLanguage();
    const digits = (value === 0 || Math.abs(value) >= 0.01) ? 2 : 4;

    return new Intl.NumberFormat(lang === "it" ? "it-IT" : "en-US", {
        style: "currency",
        currency: lang === "it" ? "EUR" : "USD",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    }).format(value);

}

function clampPercent(value) {

    if (!isFinite(value) || value < 0) return 0;

    return Math.min(100, value);

}

// ======================================
// Percorso terreni: soglie boost attraversate e zona morta
// tra "from" e "to" (usa i breakpoint del Paese attivo)
// ======================================

function getLandsPathInfo(from, to) {

    const breakpoints = getActiveBreakpoints();

    const crossed = breakpoints.filter(function (bp) {
        return bp.min > from && bp.min <= to;
    });

    let deadZone = null;

    for (let i = 0; i < breakpoints.length; i++) {

        const bp = breakpoints[i];

        if (isFinite(bp.max) && bp.max >= from && bp.max < to) {

            const recovery = getBracketTransitionRecovery(bp.min);

            if (recovery && recovery.hasDeadZone) {

                deadZone = {
                    cap: bp.max,
                    boostFrom: bp.boost,
                    boostTo: recovery.next.boost,
                    recoveryLands: recovery.recoveryLands,
                    endsInside: to < recovery.recoveryLands
                };

                break;

            }

        }

    }

    return {
        crossed: crossed,
        next: crossed.length ? crossed[0] : null,
        last: crossed.length ? crossed[crossed.length - 1] : null,
        deadZone: deadZone
    };

}

function getPathDeadZoneText(path, targetLands) {

    if (!path.deadZone) return null;

    const dz = path.deadZone;

    return t(dz.endsInside ? "strategyPathDeadZoneInside" : "strategyPathDeadZoneCross", {
        cap: dz.cap,
        from: dz.boostFrom,
        to: dz.boostTo,
        recovery: dz.recoveryLands,
        target: targetLands
    });

}

// ======================================
// Costruzione del modello (valori di default comuni)
// ======================================

const STRATEGY_GOAL_ICONS = {
    efficiency: "idea",
    income: "income",
    lands: "lands",
    mayor: "mayor"
};

function createStrategyModel(goalType, data) {

    const state = getStrategyABState();

    const model = {

        goalType: goalType,
        icon: STRATEGY_GOAL_ICONS[goalType] || "idea",
        goalTitle: "",
        goalDescription: "",

        // "active" | "reached" | "missing"
        status: "active",
        statusLabel: t("strategyStatusActive"),

        // Metrica principale mostrata in evidenza: { label, value, sub }
        primaryMetric: { label: "", value: "—", sub: "" },

        // Altre metriche: [{ label, value, tone, wide, small }]
        secondaryMetrics: [],

        currentValue: null,
        targetValue: null,
        remaining: null,

        abNeeded: null,
        daysRemaining: null,

        // { label, value } oppure null
        nextMilestone: null,

        // { label, icon }
        recommendedAction: { label: "", icon: "idea" },
        explanation: "",
        note: null,
        warning: null,
        needsInput: false,

        progress: 0,
        progressTitle: "",
        progressText: "",
        progressWarning: false,

        abSummary: {
            balance: state.balance,
            daily: state.daily,
            text: getExplorerState().status === "active"
                ? t("strategyAbLineExplorer", {
                    balance: formatK(Math.round(state.balance)),
                    daily: formatExplorerAB(state.daily, true)
                })
                : t("strategyAbLine", {
                    balance: formatK(Math.round(state.balance)),
                    daily: formatK(Math.round(state.daily))
                })
        },

        // Righe informative Explorer Club (vuote se il pass non è attivo)
        explorerLines: buildExplorerStrategyLines()

    };

    return Object.assign(model, data);

}

// Righe Explorer Club per la Strategia: milestone, reward da verificare,
// pass scaduto. Solo testo: i numeri arrivano da explorer.js
function buildExplorerStrategyLines() {

    const s = getExplorerState();
    const lines = [];

    if (s.status === "inactive" || s.status === "needsStart") return lines;

    if (s.status === "notStarted") {

        lines.push({
            icon: "star",
            text: t("strategyExplorerNotStarted", { date: formatExplorerDate(s.startDate) })
        });

    } else if (s.status === "expired") {

        lines.push({ icon: "warning", warn: true, text: t("strategyExplorerExpired") });

    } else {

        if (s.nextMilestone) {

            lines.push({
                icon: "star",
                text: s.nextMilestone.inDays === 0
                    ? t("explorerMilestoneToday", {
                        day: s.nextMilestone.day,
                        ab: formatExplorerAB(s.nextMilestone.totalAB, true)
                    })
                    : t("explorerNextMilestone", {
                        day: s.nextMilestone.day,
                        days: formatDays(s.nextMilestone.inDays),
                        ab: formatExplorerAB(s.nextMilestone.totalAB, true)
                    })
            });

        }

        // oggi, se non confermato, è nella stima; i giorni passati non confermati no
        const pastPending = s.pendingCount - 1;

        if (pastPending > 0) {

            lines.push({
                icon: "warning",
                warn: true,
                text: t("strategyExplorerPending", { count: pastPending })
            });

        }

        lines.push({ icon: "idea", text: t("strategyExplorerVariable") });

    }

    return lines;

}

// Stato "mancano dati": nessun valore inventato, solo invito a completarli
function createMissingStrategyModel(goalType, title, description, message) {

    return createStrategyModel(goalType, {
        goalTitle: title,
        goalDescription: description,
        status: "missing",
        statusLabel: t("strategyStatusMissing"),
        primaryMetric: { label: title, value: "—", sub: "" },
        recommendedAction: { label: t("strategyActComplete"), icon: "pencil" },
        explanation: message,
        needsInput: true,
        progress: 0,
        progressTitle: "",
        progressText: "—"
    });

}

// ======================================
// Analisi di efficienza (riusata anche come "prossimo passo"
// quando un obiettivo è già raggiunto)
// Riusa getEfficiencyComparison() e la logica della zona morta.
// ======================================

function getEfficiencyAnalysis() {

    const total = getTotalLands();
    const state = getStrategyABState();
    const c = getEfficiencyComparison(total);

    const currentBp = getCurrentBreakpoint(total);
    const current = currentBp || { min: 0, max: total || 1, boost: 1 };
    const next = getNextBreakpoint(total);
    const remainingToNext = getRemainingLandsToNextBreakpoint(total);
    const recovery = getBracketTransitionRecovery(total);

    let urgent = false;

    if (next && currentBp) {

        const bracketSize = next.min - current.min;

        urgent = remainingToNext <= Math.max(5, Math.round(bracketSize * 0.2));

    }

    const deadZoneUrgent = !!(recovery && recovery.hasDeadZone && urgent);

    const a = {
        total: total,
        boost: current.boost,
        priority: "lands",
        priorityLabel: t("strategyPrioLands"),
        action: { label: t("strategyActLands"), icon: "lands" },
        abNeeded: null,
        yieldUSD: null,
        yieldLabel: t("strategyMetricYieldLand"),
        milestone: null,
        progress: 0,
        progressText: "",
        progressWarning: false,
        explanation: "",
        note: null,
        warning: null
    };

    // Avviso inline già esistente: c'è una zona morta nella fascia attuale
    if (recovery && recovery.hasDeadZone) {

        a.warning = t("breakpointWarningInline", {
            cap: recovery.current.max,
            current: recovery.current.boost,
            next: recovery.next.boost,
            recoveryLands: recovery.recoveryLands
        });

    }

    const boostNote = total > 0 ? getBoostAdviceText(total).text : null;

    // 1. Né terreni né badge convengono: accumulare
    if (c.landEfficiency <= 0 && c.badgeEfficiency <= 0) {

        a.priority = "accumulate";
        a.priorityLabel = t("strategyPrioAccumulate");
        a.action = { label: t("strategyActAccumulate"), icon: "exchange" };
        a.explanation = t("tipAccumulate");
        a.progressText = t("strategyProgressAccumulate", { balance: formatK(Math.round(state.balance)) });

        return a;

    }

    // 2. I badge sono più efficienti dei terreni
    if (c.nextBadgeTier && c.badgeEfficiency > c.landEfficiency) {

        const tier = c.nextBadgeTier;
        const prevTier = CONFIG.badgeBoostTiers.find(function (x) {
            return player.badges >= x.min && player.badges <= x.max;
        });
        const base = prevTier ? prevTier.min : 0;
        const badgesLeft = tier.min - player.badges;

        a.priority = "badges";
        a.priorityLabel = t("strategyPrioBadges");
        a.action = { label: t("strategyActBadges"), icon: "badge" };
        a.abNeeded = c.abToNextBadgeTier;
        a.yieldUSD = c.badgeDailyGain;
        a.yieldLabel = t("strategyMetricYieldBadge");
        a.milestone = {
            label: t("strategyMetricMilestone"),
            value: t("strategyMilestoneBadgeValue", { badges: tier.min, percent: tier.percent })
        };
        a.progress = clampPercent(((player.badges - base) / (tier.min - base)) * 100);
        a.progressText = t("strategyProgressBadges", {
            badges: player.badges,
            target: tier.min,
            remaining: badgesLeft
        });
        a.explanation = getEfficiencyTip(total);
        a.note = boostNote;

        return a;

    }

    // 3. Terreni. Zona morta imminente: il vero traguardo è il recupero
    a.yieldUSD = c.landDailyGain;

    if (deadZoneUrgent) {

        const targetLands = recovery.recoveryLands;
        const ab = Math.max(0, targetLands - total) * CONFIG.landCostAB;
        const canJumpNow = state.balance >= ab;

        a.progressWarning = true;
        a.abNeeded = ab;
        a.milestone = {
            label: t("strategyMetricMilestone"),
            value: t("strategyMilestoneDeadZone", { lands: targetLands })
        };
        a.explanation = boostNote;

        if (canJumpNow) {

            a.priority = "lands";
            a.priorityLabel = t("strategyPrioLands");
            a.action = { label: t("strategyActDeadZone"), icon: "warning" };
            a.progress = clampPercent(((total - current.min) / (targetLands - current.min)) * 100);
            a.progressText = t("progressText", {
                total: total,
                next: targetLands,
                remaining: Math.max(0, targetLands - total)
            });

        } else {

            // Meglio fermarsi e accumulare: il progresso è quello degli AB
            a.priority = "accumulate";
            a.priorityLabel = t("strategyPrioAccumulate");
            a.action = { label: t("strategyActAccumulate"), icon: "exchange" };
            a.progress = clampPercent((state.balance / ab) * 100);
            a.progressText = t("strategyProgressAB", {
                balance: formatK(Math.round(state.balance)),
                needed: formatK(Math.ceil(ab))
            });

        }

        return a;

    }

    if (next) {

        a.abNeeded = (next.min - total) * CONFIG.landCostAB;
        a.milestone = {
            label: t("strategyMetricMilestone"),
            value: t("strategyThresholdValue", { lands: next.min, boost: next.boost })
        };
        a.progress = clampPercent(((total - current.min) / (next.min - current.min)) * 100);
        a.progressText = t("progressText", {
            total: total,
            next: next.min,
            remaining: next.min - total
        });

    } else {

        // Ultimo breakpoint: il boost è fisso, ogni terreno resta un acquisto singolo
        a.abNeeded = CONFIG.landCostAB;
        a.progress = 100;
        a.progressText = t("progressTextLast", { total: total });

    }

    a.explanation = getEfficiencyTip(total);
    a.note = boostNote;

    return a;

}

// ======================================
// OBIETTIVO 1 — Efficienza generale
// ======================================

function buildEfficiencyModel() {

    const title = t("strategyGoalEfficiency");
    const description = t("strategyDescEfficiency");

    if (getTotalLands() === 0) {

        return createMissingStrategyModel("efficiency", title, description, t("tipNoData"));

    }

    const a = getEfficiencyAnalysis();

    const metrics = [
        {
            label: t("strategyMetricMilestone"),
            value: a.milestone ? a.milestone.value : t("strategyLastBreakpoint", { boost: a.boost }),
            tone: "gold",
            wide: true
        },
        { label: t("strategyMetricABNeeded"), value: formatStrategyAB(a.abNeeded) },
        { label: t("strategyMetricTime"), value: formatStrategyTime(a.abNeeded), tone: "cyan" }
    ];

    if (a.yieldUSD !== null && a.yieldUSD > 0) {

        metrics.push({
            label: a.yieldLabel,
            value: "+" + formatStrategyMoney(a.yieldUSD) + t("strategyPerDay"),
            small: true,
            wide: true
        });

    }

    return createStrategyModel("efficiency", {

        goalTitle: title,
        goalDescription: description,

        primaryMetric: {
            label: t("strategyPriorityLabel"),
            value: a.priorityLabel,
            sub: t("strategyHeroEffSub", {
                boost: a.boost,
                lands: a.total,
                badges: player.badges
            })
        },

        secondaryMetrics: metrics,

        currentValue: a.total,
        targetValue: a.milestone ? a.milestone.value : null,

        abNeeded: a.abNeeded,
        daysRemaining: getDaysForAB(a.abNeeded),
        nextMilestone: a.milestone,

        recommendedAction: a.action,
        explanation: a.explanation,
        note: a.note,
        warning: a.warning,

        progress: a.progress,
        progressTitle: t("strategyProgressTitleEfficiency"),
        progressText: a.progressText,
        progressWarning: a.progressWarning

    });

}

// Dopo un obiettivo raggiunto: proposta del prossimo passo (NON cambia il target salvato)
function getReachedNextStep() {

    const a = getEfficiencyAnalysis();

    return {
        analysis: a,
        text: t("strategyReachedNext", { priority: a.priorityLabel }) + " " + a.explanation,
        metric: {
            label: t("strategyMetricNextStep"),
            value: a.priorityLabel + (a.milestone ? " — " + a.milestone.value : ""),
            tone: "gold",
            wide: true,
            small: true
        }
    };

}

// ======================================
// OBIETTIVO 2 — Rendita specifica
// ======================================

// Terreni in più (acquisto atteso, resa media ponderata sulle rarità)
// necessari per arrivare alla rendita obiettivo, tenendo conto dei
// breakpoint attraversati e del bonus badge indicato.
// Restituisce null se non raggiungibile.
function simulateLandsForIncome(targetUSD, boosted, badgePercent) {

    const total = getTotalLands();
    const rawDaily = getRawIncomePerSecond() * 86400;
    const perLand = getExpectedRentPerSecondPerLand() * 86400;
    const badgeMult = 1 + badgePercent / 100;

    for (let n = 0; n <= 100000; n++) {

        const boost = boosted ? getCurrentBoost(total + n) : 1;
        const income = (rawDaily + n * perLand) * badgeMult * boost;

        if (income >= targetUSD) return n;

    }

    return null;

}

function buildIncomeModel() {

    const goal = player.goal;
    const targetUSD = Number(goal.incomeTargetUSD) || 0;
    const boosted = !!goal.incomeTargetBoosted;
    const mode = t(boosted ? "strategyModeBoosted" : "strategyModePlain");
    const targetText = formatStrategyMoney(targetUSD) + t("strategyPerDay");

    const title = t("strategyGoalIncome");
    const description = t("strategyDescIncome", { target: targetText, mode: mode });

    if (targetUSD <= 0) {

        return createMissingStrategyModel("income", title, t("strategyDescIncomeEmpty"), t("strategyMissingIncome"));

    }

    const total = getTotalLands();

    if (total === 0) {

        return createMissingStrategyModel("income", title, description, t("tipNoData"));

    }

    const currentUSD = boosted ? getDailyIncome() : getBaseDailyIncome();
    const currentText = formatStrategyMoney(currentUSD) + t("strategyPerDay");
    const percentRaw = (currentUSD / targetUSD) * 100;
    const percent = clampPercent(percentRaw);

    const hero = {
        label: t("strategyHeroIncomeLabel"),
        value: currentText,
        sub: t("strategyHeroIncomeSub", { target: targetText, mode: mode })
    };

    // Obiettivo già raggiunto
    if (currentUSD >= targetUSD) {

        const next = getReachedNextStep();

        return createStrategyModel("income", {

            goalTitle: title,
            goalDescription: description,
            status: "reached",
            statusLabel: t("strategyStatusReached"),
            primaryMetric: hero,

            secondaryMetrics: [
                { label: t("strategyMetricTarget"), value: targetText, small: true },
                {
                    label: t("strategyMetricSurplus"),
                    value: "+" + formatStrategyMoney(currentUSD - targetUSD) + t("strategyPerDay"),
                    tone: "gold",
                    small: true
                },
                next.metric
            ],

            currentValue: currentUSD,
            targetValue: targetUSD,
            remaining: 0,
            abNeeded: 0,
            daysRemaining: 0,

            recommendedAction: { label: t("strategyActReached"), icon: "trophy" },
            explanation: t("strategyReachedIncome", { current: currentText, target: targetText }) + " " + next.text,
            note: next.analysis.note,

            progress: 100,
            progressTitle: t("strategyProgressTitleIncome"),
            progressText: t("strategyProgressIncome", { current: currentText, target: targetText, percent: Math.floor(percentRaw) })

        });

    }

    // Stima delle risorse: solo terreni, oppure badge + terreni
    const gapUSD = targetUSD - currentUSD;
    const c = getEfficiencyComparison(total);
    const badgePercent = getBadgeBoostPercent(player.badges);

    const nLands = simulateLandsForIncome(targetUSD, boosted, badgePercent);

    let route = null;

    if (nLands !== null) {
        route = { kind: "lands", lands: nLands, ab: nLands * CONFIG.landCostAB };
    }

    if (c.nextBadgeTier) {

        const nAfterBadge = simulateLandsForIncome(targetUSD, boosted, c.nextBadgeTier.percent);

        if (nAfterBadge !== null) {

            const badgeAB = c.abToNextBadgeTier + nAfterBadge * CONFIG.landCostAB;

            if (!route || badgeAB < route.ab) {

                route = {
                    kind: "badges",
                    lands: nAfterBadge,
                    ab: badgeAB,
                    tier: c.nextBadgeTier
                };

            }

        }

    }

    let milestone = null;
    let explanation = t("strategyIncomeUnreachable");
    let action = { label: t("strategyActAccumulate"), icon: "exchange" };
    let warning = null;
    let abNeeded = null;
    let landsMetric = "—";

    if (route) {

        abNeeded = route.ab;
        const timeText = formatStrategyTime(route.ab);
        const totalAfter = total + route.lands;

        if (route.kind === "badges") {

            action = { label: t("strategyActBadges"), icon: "badge" };

            if (route.lands > 0) {

                milestone = t("strategyMilestoneBadgeThenLands", {
                    badges: route.tier.min,
                    percent: route.tier.percent,
                    lands: totalAfter
                });

                explanation = t("strategyIncomeViaBadges", {
                    badges: route.tier.min,
                    percent: route.tier.percent,
                    lands: route.lands,
                    ab: formatK(Math.ceil(route.ab)),
                    time: timeText
                });

            } else {

                milestone = t("strategyMilestoneBadgeValue", { badges: route.tier.min, percent: route.tier.percent });

                explanation = t("strategyIncomeViaBadgesOnly", {
                    badges: route.tier.min,
                    percent: route.tier.percent,
                    ab: formatK(Math.ceil(route.ab)),
                    time: timeText
                });

            }

        } else {

            action = { label: t("strategyActLands"), icon: "lands" };

            milestone = t("strategyMilestoneLandsDelta", { lands: totalAfter, delta: route.lands });

            explanation = t("strategyIncomeViaLands", {
                target: targetText,
                lands: route.lands,
                ab: formatK(Math.ceil(route.ab)),
                time: timeText
            });

        }

        landsMetric = route.lands > 0 ? "+" + route.lands : "0";

        if (route.lands > 0) {

            const path = getLandsPathInfo(total, totalAfter);

            warning = getPathDeadZoneText(path, totalAfter);

            if (warning) {
                action = { label: t("strategyActDeadZonePlan"), icon: "warning" };
            }

        }

    }

    const metrics = [
        { label: t("strategyMetricRemaining"), value: formatStrategyMoney(gapUSD) + t("strategyPerDay"), small: true },
        { label: t("strategyMetricProgress"), value: Math.floor(percent) + "%", tone: "cyan" },
        { label: t("strategyMetricABEstimate"), value: formatStrategyAB(abNeeded) },
        { label: t("strategyMetricTime"), value: formatStrategyTime(abNeeded), tone: "cyan" },
        { label: t("strategyMetricLandsEstimate"), value: landsMetric, tone: "gold", wide: !milestone }
    ];

    if (milestone) {
        metrics.push({ label: t("strategyMetricMilestone"), value: milestone, tone: "gold", wide: true, small: true });
    }

    return createStrategyModel("income", {

        goalTitle: title,
        goalDescription: description,
        primaryMetric: hero,
        secondaryMetrics: metrics,

        currentValue: currentUSD,
        targetValue: targetUSD,
        remaining: gapUSD,

        abNeeded: abNeeded,
        daysRemaining: getDaysForAB(abNeeded),
        nextMilestone: milestone ? { label: t("strategyMetricMilestone"), value: milestone } : null,

        recommendedAction: action,
        explanation: explanation,
        warning: warning,

        progress: percent,
        progressTitle: t("strategyProgressTitleIncome"),
        progressText: t("strategyProgressIncome", { current: currentText, target: targetText, percent: Math.floor(percent) }),
        progressWarning: !!warning

    });

}

// ======================================
// Obiettivi basati sul numero di terreni (Terreni e Mayor)
// condividono lo stesso calcolo di percorso: cambia solo il traguardo.
// ======================================

function buildLandsPathData(targetLands, explain) {

    const total = getTotalLands();
    const remaining = Math.max(0, targetLands - total);
    const abNeeded = remaining * CONFIG.landCostAB;
    const state = getStrategyABState();
    const path = getLandsPathInfo(total, targetLands);
    const warning = getPathDeadZoneText(path, targetLands);
    const timeText = formatStrategyTime(abNeeded);

    let explanation = explain({
        remaining: remaining,
        target: targetLands,
        ab: formatK(Math.ceil(abNeeded)),
        time: timeText
    });

    if (path.crossed.length) {

        explanation += " " + t(path.crossed.length === 1 ? "strategyCrossingsOne" : "strategyCrossings", {
            count: path.crossed.length,
            boost: path.last.boost
        });

    }

    return {
        total: total,
        remaining: remaining,
        abNeeded: abNeeded,
        state: state,
        path: path,
        warning: warning,
        timeText: timeText,
        explanation: explanation,
        action: warning
            ? { label: t("strategyActDeadZonePlan"), icon: "warning" }
            : { label: t("strategyActLands"), icon: "lands" },
        progress: clampPercent((total / targetLands) * 100)
    };

}

// ======================================
// OBIETTIVO 3 — Numero di terreni
// ======================================

function buildLandsModel() {

    const target = Math.floor(Number(player.goal.landsTarget) || 0);

    const title = t("strategyGoalLands");

    if (target <= 0) {

        return createMissingStrategyModel("lands", title, t("strategyDescLandsEmpty"), t("strategyMissingLands"));

    }

    const description = t("strategyDescLands", { target: target });
    const total = getTotalLands();

    const hero = {
        label: t("strategyHeroLandsLabel"),
        value: total + " / " + target,
        sub: ""
    };

    if (total >= target) {

        const next = getReachedNextStep();

        return createStrategyModel("lands", {

            goalTitle: title,
            goalDescription: description,
            status: "reached",
            statusLabel: t("strategyStatusReached"),
            primaryMetric: hero,

            secondaryMetrics: [
                { label: t("strategyMetricTarget"), value: String(target) },
                { label: t("strategyMetricSurplus"), value: "+" + (total - target), tone: "gold" },
                next.metric
            ],

            currentValue: total,
            targetValue: target,
            remaining: 0,
            abNeeded: 0,
            daysRemaining: 0,

            recommendedAction: { label: t("strategyActReached"), icon: "trophy" },
            explanation: t("strategyReachedLands", { total: total, target: target }) + " " + next.text,
            note: next.analysis.note,

            progress: 100,
            progressTitle: t("strategyProgressTitleLands"),
            progressText: t("strategyProgressLands", { total: total, target: target, remaining: 0 })

        });

    }

    const p = buildLandsPathData(target, function (v) { return t("strategyLandsExplain", v); });

    const threshold = p.path.next
        ? t("strategyThresholdValue", { lands: p.path.next.min, boost: p.path.next.boost })
        : t("strategyNoThreshold", { boost: getBoostMultiplier() });

    return createStrategyModel("lands", {

        goalTitle: title,
        goalDescription: description,
        primaryMetric: hero,

        secondaryMetrics: [
            { label: t("strategyMetricRemaining"), value: String(p.remaining) },
            { label: t("strategyMetricABNeeded"), value: formatStrategyAB(p.abNeeded) },
            { label: t("strategyMetricABAvailable"), value: formatStrategyAB(p.state.balance), tone: "gold" },
            { label: t("strategyMetricTime"), value: p.timeText, tone: "cyan" },
            { label: t("strategyMetricNextThreshold"), value: threshold, tone: "gold", wide: true, small: true }
        ],

        currentValue: total,
        targetValue: target,
        remaining: p.remaining,

        abNeeded: p.abNeeded,
        daysRemaining: getDaysForAB(p.abNeeded),
        nextMilestone: { label: t("strategyMetricNextThreshold"), value: threshold },

        recommendedAction: p.action,
        explanation: p.explanation,
        warning: p.warning,

        progress: p.progress,
        progressTitle: t("strategyProgressTitleLands"),
        progressText: t("strategyProgressLands", { total: total, target: target, remaining: p.remaining }),
        progressWarning: !!p.warning

    });

}

// ======================================
// OBIETTIVO 4 — Diventare Mayor
// Il progetto NON ha un database di città o Mayor: l'unico dato reale è
// player.mayorTarget, interpretato come "terreni da superare".
// Il traguardo è quindi mayorTarget + 1.
// ======================================

function buildMayorModel() {

    const reference = Math.floor(Number(player.mayorTarget) || 0);

    const title = t("strategyGoalMayor");

    if (reference <= 0) {

        return createMissingStrategyModel("mayor", title, t("strategyDescMayorEmpty"), t("strategyMissingMayor"));

    }

    const target = reference + 1;
    const description = t("strategyDescMayor", { ref: reference });
    const total = getTotalLands();
    const note = t("strategyMayorNote");

    const hero = {
        label: t("strategyMetricLandsNow"),
        value: String(total),
        sub: t("strategyHeroMayorSub", { ref: reference, target: target })
    };

    if (total >= target) {

        const next = getReachedNextStep();

        return createStrategyModel("mayor", {

            goalTitle: title,
            goalDescription: description,
            status: "reached",
            statusLabel: t("strategyStatusReachedMayor"),
            primaryMetric: hero,

            secondaryMetrics: [
                { label: t("strategyMetricToBeat"), value: String(reference) },
                { label: t("strategyMetricSurplus"), value: "+" + (total - reference), tone: "gold" },
                next.metric
            ],

            currentValue: total,
            targetValue: target,
            remaining: 0,
            abNeeded: 0,
            daysRemaining: 0,

            recommendedAction: { label: t("strategyActReachedMayor"), icon: "trophy" },
            explanation: t("strategyReachedMayor", { total: total, ref: reference }) + " " + next.text,
            note: note,

            progress: 100,
            progressTitle: t("strategyProgressTitleMayor"),
            progressText: t("strategyProgressLands", { total: total, target: target, remaining: 0 })

        });

    }

    const p = buildLandsPathData(target, function (v) {
        return t("strategyMayorExplain", v) + " " + t("strategyMayorCost", v);
    });

    const step = t("strategyMilestoneNextMayor", { n: p.remaining, target: target });

    return createStrategyModel("mayor", {

        goalTitle: title,
        goalDescription: description,
        primaryMetric: hero,

        secondaryMetrics: [
            { label: t("strategyMetricToBeat"), value: String(reference) },
            { label: t("strategyMetricRemaining"), value: String(p.remaining), tone: "gold" },
            { label: t("strategyMetricABEstimate"), value: formatStrategyAB(p.abNeeded) },
            { label: t("strategyMetricTime"), value: p.timeText, tone: "cyan" },
            { label: t("strategyMetricNextStep"), value: step, tone: "gold", wide: true, small: true }
        ],

        currentValue: total,
        targetValue: target,
        remaining: p.remaining,

        abNeeded: p.abNeeded,
        daysRemaining: getDaysForAB(p.abNeeded),
        nextMilestone: { label: t("strategyMetricNextStep"), value: step },

        recommendedAction: p.action,
        explanation: p.explanation,
        note: note,
        warning: p.warning,

        progress: p.progress,
        progressTitle: t("strategyProgressTitleMayor"),
        progressText: t("strategyProgressLands", { total: total, target: target, remaining: p.remaining }),
        progressWarning: !!p.warning

    });

}

// ======================================
// Punto di ingresso unico: obiettivo → builder
// ======================================

const STRATEGY_GOAL_BUILDERS = {
    efficiency: buildEfficiencyModel,
    income: buildIncomeModel,
    lands: buildLandsModel,
    mayor: buildMayorModel
};

function getStrategyModel() {

    const builder = STRATEGY_GOAL_BUILDERS[player.goal.type] || STRATEGY_GOAL_BUILDERS.efficiency;

    return builder();

}

// ======================================
// Helper storici (breakpoint successivo): mantenuti per compatibilità
// ======================================

function getRemainingLands() {

    return getRemainingLandsToNextBreakpoint(getTotalLands());

}

function getRequiredAB() {

    return getABNeeded(getRemainingLands());

}

function getEstimatedStrategyDays() {

    return getEstimatedDays(getRemainingLands());

}

function getNextBreakpointTarget() {

    const next = getNextBreakpoint(getTotalLands());

    return next ? next.min : null;

}
