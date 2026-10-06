// ======================================
// AE Companion - Explorer Club
//
//   rewardTable + startDate + stato pass  →  getExplorerState()
//
// Questo file CALCOLA soltanto (nessun DOM). La UI è in explorer-ui.js,
// la Strategia legge da qui (strategy.js). I valori della ladder vivono
// SOLO in EXPLORER_REWARD_TABLE: nessun altro file li duplica.
//
// Regole ufficiali (Atlas Earth Help Center):
//  - se un giorno non viene riscosso la streak riparte da Day 1 e il
//    giorno perso non si recupera;
//  - dopo Day 90 la streak termina e ne parte una nuova da Day 1.
//
// Due stati distinti:
//  - theoreticalDay: calcolato dal calendario, avanza da solo
//  - confirmedDay:   ultimo giorno che il player ha confermato di aver riscosso
// I giorni sono sempre "assoluti" dall'inizio della streak corrente
// (1, 2, 3 ... anche oltre 90); il Day mostrato è il giorno nel ciclo.
// ======================================

// --------------------------------------
// REWARD TABLE (single source of truth)
// Valori verificati dal proprietario dell'app nel gioco: non modificarli.
// dailyLoginAB, explorerClubAB e totalAB restano separati per ogni giorno.
// extraExplore è la risorsa diamanti/ruota: MAI sommata agli AB.
// null = quantità non ancora presente in tabella (nessun valore inventato).
// --------------------------------------

const EXPLORER_REWARD_TABLE = [

    { from: 1,  to: 6,  dailyLoginAB: 1,   explorerClubAB: 90,   totalAB: 91,   extraExplore: null },
    { from: 7,  to: 7,  dailyLoginAB: 8,   explorerClubAB: 180,  totalAB: 188,  extraExplore: null, milestone: true },
    { from: 8,  to: 13, dailyLoginAB: 1,   explorerClubAB: 90,   totalAB: 91,   extraExplore: null },
    { from: 14, to: 14, dailyLoginAB: 25,  explorerClubAB: 325,  totalAB: 350,  extraExplore: null, milestone: true },
    { from: 15, to: 29, dailyLoginAB: 1,   explorerClubAB: 90,   totalAB: 91,   extraExplore: null },
    { from: 30, to: 30, dailyLoginAB: 50,  explorerClubAB: 500,  totalAB: 550,  extraExplore: null, milestone: true },
    { from: 31, to: 59, dailyLoginAB: 1,   explorerClubAB: 90,   totalAB: 91,   extraExplore: null },
    { from: 60, to: 60, dailyLoginAB: 80,  explorerClubAB: 650,  totalAB: 730,  extraExplore: null, milestone: true },
    { from: 61, to: 89, dailyLoginAB: 1,   explorerClubAB: 90,   totalAB: 91,   extraExplore: null },
    { from: 90, to: 90, dailyLoginAB: 200, explorerClubAB: 1200, totalAB: 1400, extraExplore: null, milestone: true }

];

// Tabella espansa giorno per giorno (indice = Day nel ciclo, da 1)
const EXPLORER_DAYS = [null];

(function buildExplorerDays() {

    EXPLORER_REWARD_TABLE.forEach(function (row) {

        if (row.from !== EXPLORER_DAYS.length) {
            console.error("AE Companion: reward table Explorer Club non contigua al Day " + row.from);
        }

        if (row.dailyLoginAB + row.explorerClubAB !== row.totalAB) {
            console.error("AE Companion: reward table Explorer Club incoerente al Day " + row.from);
        }

        for (let day = row.from; day <= row.to; day++) {

            EXPLORER_DAYS[day] = {
                day: day,
                dailyLoginAB: row.dailyLoginAB,
                explorerClubAB: row.explorerClubAB,
                totalAB: row.totalAB,
                extraExplore: row.extraExplore,
                milestone: row.milestone === true
            };

        }

    });

})();

// Lunghezza del ciclo = ultimo Day della tabella (oggi 90)
const EXPLORER_CYCLE_LENGTH = EXPLORER_DAYS.length - 1;

// --------------------------------------
// Date: sempre giorni di calendario "YYYY-MM-DD", mai differenze di 24h.
// Si lavora su numeri di giorno UTC ricavati da anno/mese/giorno, quindi
// ora legale, mezzanotte e cambio mese/anno non possono sfasare i conteggi.
// --------------------------------------

function explorerTodayKey(now) {

    const d = now || new Date();

    return explorerPad(d.getFullYear(), 4) + "-" +
        explorerPad(d.getMonth() + 1, 2) + "-" +
        explorerPad(d.getDate(), 2);

}

function explorerPad(n, len) {

    let s = String(n);

    while (s.length < len) s = "0" + s;

    return s;

}

// "YYYY-MM-DD" → numero di giorno (intero) oppure null se non valida
function explorerKeyToNum(key) {

    if (typeof key !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;

    const y = Number(key.slice(0, 4));
    const m = Number(key.slice(5, 7));
    const d = Number(key.slice(8, 10));

    const ms = Date.UTC(y, m - 1, d);
    const check = new Date(ms);

    // scarta date impossibili (es. 2026-02-30)
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return null;

    return Math.round(ms / 86400000);

}

function explorerNumToKey(num) {

    const d = new Date(num * 86400000);

    return explorerPad(d.getUTCFullYear(), 4) + "-" +
        explorerPad(d.getUTCMonth() + 1, 2) + "-" +
        explorerPad(d.getUTCDate(), 2);

}

function explorerAddDays(key, days) {

    const n = explorerKeyToNum(key);

    return n === null ? null : explorerNumToKey(n + days);

}

function explorerValidKey(key) {

    return explorerKeyToNum(key) !== null;

}

// --------------------------------------
// Lettura reward table
// --------------------------------------

function explorerDayInCycle(absDay) {

    return ((absDay - 1) % EXPLORER_CYCLE_LENGTH) + 1;

}

function explorerCycleIndex(absDay) {

    return Math.floor((absDay - 1) / EXPLORER_CYCLE_LENGTH);

}

// Reward del giorno ASSOLUTO della streak (null se absDay < 1)
function getExplorerRewardForAbsDay(absDay) {

    if (!isFinite(absDay) || absDay < 1) return null;

    const r = EXPLORER_DAYS[explorerDayInCycle(absDay)];

    return r ? Object.assign({}, r) : null;

}

// --------------------------------------
// Dati salvati: default e sanificazione
// --------------------------------------

function createDefaultExplorerData() {

    return {

        startDate: null,                 // Day 1 della streak corrente
        endDate: null,                   // scadenza pass (facoltativa), ultimo giorno incluso
        confirmedDay: 0,                 // ultimo giorno assoluto confermato
        lastConfirmedRewardDate: null,   // data di calendario di quel giorno
        addToBalance: true,              // le reward confermate entrano nel saldo AB
        claimed: {},                     // { giornoAssoluto: { ab, added } }
        history: []                      // streak/pass precedenti

    };

}

function sanitizeExplorerData(src) {

    const out = createDefaultExplorerData();

    if (!src || typeof src !== "object") return out;

    if (explorerValidKey(src.startDate)) out.startDate = src.startDate;
    if (explorerValidKey(src.endDate)) out.endDate = src.endDate;

    if (out.startDate && out.endDate && explorerKeyToNum(out.endDate) < explorerKeyToNum(out.startDate)) {
        out.endDate = null;
    }

    const confirmed = Math.floor(Number(src.confirmedDay));

    if (isFinite(confirmed) && confirmed > 0) out.confirmedDay = confirmed;

    if (explorerValidKey(src.lastConfirmedRewardDate)) out.lastConfirmedRewardDate = src.lastConfirmedRewardDate;

    if (typeof src.addToBalance === "boolean") out.addToBalance = src.addToBalance;

    if (src.claimed && typeof src.claimed === "object") {

        Object.keys(src.claimed).forEach(function (k) {

            const day = Math.floor(Number(k));
            const entry = src.claimed[k];

            if (!isFinite(day) || day < 1 || !entry) return;

            const ab = Number(entry.ab);

            if (!isFinite(ab) || ab < 0) return;

            out.claimed[day] = { ab: ab, added: entry.added === true };

        });

    }

    if (Array.isArray(src.history)) {

        out.history = src.history.slice(-20).filter(function (h) {
            return h && typeof h === "object";
        }).map(function (h) {
            return {
                startDate: explorerValidKey(h.startDate) ? h.startDate : null,
                endedOn: explorerValidKey(h.endedOn) ? h.endedOn : null,
                confirmedDay: Math.max(0, Math.floor(Number(h.confirmedDay)) || 0),
                confirmedAB: Math.max(0, Number(h.confirmedAB) || 0)
            };
        });

    }

    return out;

}

// --------------------------------------
// Stato derivato (mai salvato: si ricalcola dalla data)
// --------------------------------------

// status:
//  "inactive"   pass Explorer non attivo
//  "needsStart" pass attivo ma data di inizio mancante
//  "notStarted" data di inizio nel futuro
//  "active"     reward in corso
//  "expired"    oltre la scadenza del pass
function getExplorerState(todayKey) {

    const ex = player.explorer;
    const today = todayKey || explorerTodayKey();

    const state = {

        status: "inactive",
        today: today,
        startDate: ex.startDate,
        endDate: ex.endDate,

        theoreticalDay: 0,        // assoluto, calcolato dal calendario
        confirmedDay: 0,          // assoluto, confermato dal player
        dayInCycle: 0,
        confirmedDayInCycle: 0,
        cycleIndex: 0,
        cycleLength: EXPLORER_CYCLE_LENGTH,
        daysUntilStart: 0,

        reward: null,             // reward del giorno teorico (null se non attiva)
        abPerDay: 0,              // AB/day automatici di oggi
        extraExplore: null,

        pendingCount: 0,
        pendingFromDay: 0,
        pendingToDay: 0,
        pendingAB: 0,
        allConfirmed: false,

        lastConfirmedRewardDate: ex.lastConfirmedRewardDate,
        confirmedABTotal: 0,

        nextMilestone: null,

        rawAbsToday: 0,
        lastRewardDay: Infinity

    };

    if (player.passes.explorer !== true) return state;

    const startNum = explorerKeyToNum(ex.startDate);

    if (startNum === null) {
        state.status = "needsStart";
        return state;
    }

    const todayNum = explorerKeyToNum(today);
    const rawAbs = todayNum - startNum + 1;   // può essere <= 0 se il pass non è ancora iniziato

    state.rawAbsToday = rawAbs;

    const endNum = explorerKeyToNum(ex.endDate);

    if (endNum !== null && endNum >= startNum) {
        state.lastRewardDay = endNum - startNum + 1;
    }

    if (rawAbs < 1) {
        state.status = "notStarted";
        state.daysUntilStart = 1 - rawAbs;
        return state;
    }

    state.theoreticalDay = Math.min(rawAbs, state.lastRewardDay);
    state.status = rawAbs > state.lastRewardDay ? "expired" : "active";

    state.dayInCycle = explorerDayInCycle(state.theoreticalDay);
    state.cycleIndex = explorerCycleIndex(state.theoreticalDay);

    // Il confermato non può superare il teorico (es. orologio del dispositivo spostato indietro)
    state.confirmedDay = Math.max(0, Math.min(ex.confirmedDay, state.theoreticalDay));
    state.confirmedDayInCycle = state.confirmedDay > 0 ? explorerDayInCycle(state.confirmedDay) : 0;

    if (state.status === "active") {
        state.reward = getExplorerRewardForAbsDay(state.theoreticalDay);
        state.abPerDay = state.reward.totalAB;
        state.extraExplore = state.reward.extraExplore;
    }

    state.pendingFromDay = state.confirmedDay + 1;
    state.pendingToDay = state.theoreticalDay;
    state.pendingCount = Math.max(0, state.pendingToDay - state.confirmedDay);
    state.allConfirmed = state.pendingCount === 0;

    for (let abs = state.pendingFromDay; abs <= state.pendingToDay; abs++) {
        state.pendingAB += getExplorerRewardForAbsDay(abs).totalAB;
    }

    Object.keys(ex.claimed).forEach(function (k) {
        state.confirmedABTotal += ex.claimed[k].ab;
    });

    state.nextMilestone = findNextExplorerMilestone(state);

    return state;

}

function findNextExplorerMilestone(state) {

    if (state.status !== "active") return null;

    for (let abs = state.theoreticalDay; abs <= state.theoreticalDay + EXPLORER_CYCLE_LENGTH; abs++) {

        if (abs > state.lastRewardDay) return null;

        const r = getExplorerRewardForAbsDay(abs);

        if (r.milestone) {

            return {
                day: r.day,
                absDay: abs,
                inDays: abs - state.theoreticalDay,
                totalAB: r.totalAB
            };

        }

    }

    return null;

}

// --------------------------------------
// AB/day e proiezione futura (la Strategia legge da qui)
// --------------------------------------

// true se Explorer Club sta fornendo i dati AB/day
function isExplorerAutomatic(state) {

    const s = state || getExplorerState();

    return s.status === "active" || s.status === "notStarted";

}

// AB/day da usare nei calcoli "piatti": automatici se Explorer è in corso,
// altrimenti il valore inserito a mano dal player
function getEffectiveDailyAB() {

    const s = getExplorerState();

    if (s.status === "active") return s.abPerDay;

    return Math.max(0, Number(player.settings.dailyLoginAB) || 0);

}

// Reward incassabili nei prossimi giorni, in ordine: il giorno k della
// proiezione guadagna lista[k-1]. Include la reward di oggi solo se non è
// ancora confermata; i giorni passati non confermati NON sono contati.
function getExplorerCollectableSequence(days, state) {

    const s = state || getExplorerState();
    const list = [];

    if (!isExplorerAutomatic(s)) return list;

    const todayCollectable =
        s.status === "active" && s.confirmedDay < s.theoreticalDay;

    const firstOffset = todayCollectable ? 0 : 1;

    for (let k = 0; k < days; k++) {

        const abs = s.rawAbsToday + firstOffset + k;

        if (abs < 1 || abs > s.lastRewardDay) {
            list.push(0);
        } else {
            list.push(getExplorerRewardForAbsDay(abs).totalAB);
        }

    }

    return list;

}

// Giorni per raggiungere "needed" AB partendo da "balance": somma giorno per
// giorno la ladder (niente AB/day × giorni). 0 = subito, null = mai
function getExplorerDaysForAB(needed, balance, state) {

    if (needed <= balance) return 0;

    const s = state || getExplorerState();

    if (!isExplorerAutomatic(s)) return null;

    const horizon = 3650;
    const seq = getExplorerCollectableSequence(horizon, s);

    let total = balance;

    for (let k = 0; k < seq.length; k++) {

        total += seq[k];

        if (total >= needed) return k + 1;

    }

    return null;

}

// --------------------------------------
// Azioni (idempotenti: il puntatore confirmedDay impedisce i doppi conteggi)
// --------------------------------------

// Rilegge i dati salvati: protegge da schede/finestre aperte con stato vecchio
function explorerSyncFromStorage() {

    if (typeof loadPlayerData === "function") loadPlayerData();

}

// Porta confirmedDay a "targetAbs" (avanti o indietro) e allinea claimed e saldo.
// Avanti: accredita le reward dei giorni nuovi. Indietro: annulla quelle
// che erano state accreditate. Chiamarla due volte con lo stesso valore non fa nulla.
function setExplorerConfirmedDay(targetAbs, options) {

    explorerSyncFromStorage();

    const opts = options || {};
    const ex = player.explorer;
    const s = getExplorerState();

    if (s.status !== "active" && s.status !== "expired") {
        return { ok: false, reason: "inactive" };
    }

    targetAbs = Math.floor(Number(targetAbs));

    if (!isFinite(targetAbs) || targetAbs < 0 || targetAbs > s.theoreticalDay) {
        return { ok: false, reason: "range" };
    }

    const current = s.confirmedDay;
    const addToBalance = opts.addToBalance !== undefined ? opts.addToBalance === true : ex.addToBalance === true;

    let deltaAB = 0;
    let balanceDelta = 0;

    if (targetAbs > current) {

        for (let abs = current + 1; abs <= targetAbs; abs++) {

            const ab = getExplorerRewardForAbsDay(abs).totalAB;

            ex.claimed[abs] = { ab: ab, added: addToBalance };
            deltaAB += ab;

            if (addToBalance) balanceDelta += ab;

        }

    } else if (targetAbs < current) {

        Object.keys(ex.claimed).forEach(function (k) {

            const abs = Number(k);

            if (abs <= targetAbs) return;

            deltaAB -= ex.claimed[k].ab;

            if (ex.claimed[k].added) balanceDelta -= ex.claimed[k].ab;

            delete ex.claimed[k];

        });

    } else {

        return { ok: true, noop: true, ab: 0, days: 0, balanceDelta: 0, confirmedDay: current };

    }

    ex.confirmedDay = targetAbs;
    ex.lastConfirmedRewardDate = targetAbs > 0 ? explorerAddDays(ex.startDate, targetAbs - 1) : null;

    if (balanceDelta !== 0) {
        player.settings.abBalance = Math.max(0, (Number(player.settings.abBalance) || 0) + balanceDelta);
    }

    savePlayerData();

    return {
        ok: true,
        noop: false,
        ab: deltaAB,
        days: Math.abs(targetAbs - current),
        balanceDelta: balanceDelta,
        confirmedDay: targetAbs
    };

}

// "Ho riscosso tutte": porta il confermato al giorno teorico
function confirmAllExplorerRewards(options) {

    explorerSyncFromStorage();

    const s = getExplorerState();

    if (s.status !== "active" && s.status !== "expired") return { ok: false, reason: "inactive" };

    return setExplorerConfirmedDay(s.theoreticalDay, options);

}

// Correzione: "ultimo Day riscosso" espresso come Day nel ciclo corrente (0..Day di oggi).
// Per le regole ufficiali, se manca almeno un giorno intero già chiuso la streak
// è ripartita: in quel caso non si indovina, si risponde "streakBroken".
function correctExplorerConfirmedDay(dayInCycle, options) {

    explorerSyncFromStorage();

    const s = getExplorerState();

    if (s.status !== "active" && s.status !== "expired") return { ok: false, reason: "inactive" };

    dayInCycle = Math.floor(Number(dayInCycle));

    if (!isFinite(dayInCycle) || dayInCycle < 0 || dayInCycle > s.dayInCycle) {
        return { ok: false, reason: "range" };
    }

    const abs = s.cycleIndex * EXPLORER_CYCLE_LENGTH + dayInCycle;

    // l'ultimo giorno riscosso deve essere oggi o ieri, altrimenti la streak si è interrotta
    if (abs < s.theoreticalDay - 1) return { ok: false, reason: "streakBroken" };

    return setExplorerConfirmedDay(abs, options);

}

function archiveExplorerStreak(replacedBy) {

    const ex = player.explorer;

    if (!ex.startDate) return;

    let total = 0;

    Object.keys(ex.claimed).forEach(function (k) { total += ex.claimed[k].ab; });

    ex.history.push({
        startDate: ex.startDate,
        endedOn: replacedBy,
        confirmedDay: ex.confirmedDay,
        confirmedAB: total
    });

    ex.history = ex.history.slice(-20);

}

// Nuova streak (dopo un giorno saltato) o nuovo pass: nuova data di Day 1.
// Il saldo AB non viene toccato; lo storico precedente viene archiviato.
function restartExplorerStreak(newStartKey, newEndKey, options) {

    // dal pannello Modifica dati i valori sono già in memoria: non rileggere
    if (!(options && options.skipSync)) explorerSyncFromStorage();

    const ex = player.explorer;

    if (!explorerValidKey(newStartKey)) return { ok: false, reason: "date" };

    const changed = ex.startDate !== newStartKey;

    if (changed) {

        archiveExplorerStreak(newStartKey);

        ex.startDate = newStartKey;
        ex.confirmedDay = 0;
        ex.lastConfirmedRewardDate = null;
        ex.claimed = {};

    }

    if (newEndKey !== undefined) {

        ex.endDate = explorerValidKey(newEndKey) &&
            explorerKeyToNum(newEndKey) >= explorerKeyToNum(newStartKey) ? newEndKey : null;

    } else if (ex.endDate && explorerKeyToNum(ex.endDate) < explorerKeyToNum(newStartKey)) {

        ex.endDate = null;

    }

    savePlayerData();

    return { ok: true, changed: changed };

}

function setExplorerAddToBalance(flag) {

    explorerSyncFromStorage();

    player.explorer.addToBalance = flag === true;

    savePlayerData();

}

// --------------------------------------
// Formattazione (lingua corrente)
// --------------------------------------

function formatExplorerAB(n, withSign) {

    const locale = getCurrentLanguage() === "it" ? "it-IT" : "en-US";

    return (withSign ? "+" : "") + Math.round(Number(n) || 0).toLocaleString(locale) + " AB";

}

function formatExplorerDate(key) {

    const num = explorerKeyToNum(key);

    if (num === null) return "—";

    const locale = getCurrentLanguage() === "it" ? "it-IT" : "en-US";

    return new Date(num * 86400000).toLocaleDateString(locale, {
        timeZone: "UTC",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

}
