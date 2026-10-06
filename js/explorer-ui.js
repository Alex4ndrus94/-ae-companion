// ======================================
// AE Companion - Explorer Club UI
// Solo presentazione e azioni: i calcoli sono in explorer.js.
// Riusa le classi del design system (card, strategy-*, settings-*).
// ======================================

let explorerFeedback = "";
let explorerRenderedDay = explorerTodayKey();

function explorerBox(label, value, tone, wide, small, icon) {

    return (
        '<div class="strategy-box' + (wide ? ' wide' : '') + '">' +
            '<div class="strategy-title">' +
                (icon ? '<img src="assets/icons/' + icon + '.svg" class="icon-inline" alt=""> ' : '') +
                escapeStrategyHtml(label) +
            '</div>' +
            '<div class="strategy-value' + (tone ? ' tone-' + tone : '') + (small ? ' small' : '') + '">' +
                escapeStrategyHtml(value) +
            '</div>' +
        '</div>'
    );

}

function renderExplorerCard() {

    const root = document.getElementById("explorer-card");

    if (!root) return;

    const s = getExplorerState();
    const e = escapeStrategyHtml;

    explorerRenderedDay = s.today;

    if (s.status === "inactive") {
        root.style.display = "none";
        root.innerHTML = "";
        return;
    }

    const statusMap = {
        active: ["status-active", "explorerStatusActive"],
        notStarted: ["status-active", "explorerStatusNotStarted"],
        expired: ["status-missing", "explorerStatusExpired"],
        needsStart: ["status-missing", "explorerStatusSetup"]
    };

    const st = statusMap[s.status];

    let html =
        '<div class="strategy-head">' +
            '<span class="hex-icon-wrap"><img src="assets/icons/explorer-badge.svg" alt=""></span>' +
            '<div class="strategy-head-text">' +
                '<span class="strategy-goal-title">' + e(t("explorerTitle")) + '</span>' +
            '</div>' +
            '<span class="strategy-status ' + st[0] + '">' + e(t(st[1])) + '</span>' +
        '</div>';

    if (s.status === "needsStart") {

        html +=
            '<p class="strategy-desc"><strong>' + e(t("explorerSetupTitle")) + '</strong><br>' + e(t("explorerSetupText")) + '</p>' +
            '<button class="strategy-cta" type="button" onclick="openExplorerSheet(\'start\')">' + e(t("explorerSetupButton")) + '</button>';

    } else if (s.status === "notStarted") {

        html +=
            '<p class="strategy-desc">' + e(t("explorerNotStartedText", {
                date: formatExplorerDate(s.startDate),
                days: formatDays(s.daysUntilStart)
            })) + '</p>' +
            '<button class="strategy-cta" type="button" onclick="openExplorerSheet(\'start\')">' + e(t("explorerSheetStartTitle")) + '</button>';

    } else if (s.status === "expired") {

        html +=
            '<p class="strategy-desc">' + e(t("explorerExpiredText", { date: formatExplorerDate(s.endDate) })) + '</p>' +
            '<button class="strategy-cta" type="button" onclick="openExplorerSheet(\'start\')">' + e(t("explorerRenew")) + '</button>';

    } else {

        const r = s.reward;
        const width = Math.max(0, Math.min(100, (s.dayInCycle / s.cycleLength) * 100));

        html +=
            '<div class="strategy-hero">' +
                '<div class="strategy-hero-label">' + e(t("explorerStart", { date: formatExplorerDate(s.startDate) })) + '</div>' +
                '<div class="strategy-hero-value">' + e(t("explorerDayOf", { day: s.dayInCycle, total: s.cycleLength })) + '</div>' +
            '</div>' +
            '<div class="progress"><div class="progress-fill" style="width:' + width + '%"></div></div>' +
            '<div class="strategy-grid">' +
                explorerBox(t("explorerDailyLogin"), formatExplorerAB(r.dailyLoginAB, true), "", false, false, "income") +
                explorerBox(t("explorerClubReward"), formatExplorerAB(r.explorerClubAB, true), "", false, false, "star") +
                explorerBox(t("explorerABPerDay"), formatExplorerAB(s.abPerDay, true), "cyan", true, false, "exchange") +
                explorerBox(
                    t("explorerExtra"),
                    s.extraExplore === null ? t("explorerExtraIncluded") : String(s.extraExplore),
                    "", true, true, "dice"
                ) +
            '</div>' +
            '<p class="explorer-note">' + e(t("explorerExtraNote")) + '</p>';

        if (s.nextMilestone) {

            html +=
                '<p class="strategy-explorer-line"><img src="assets/icons/trophy.svg" class="icon-inline" alt=""> <span>' +
                e(s.nextMilestone.inDays === 0
                    ? t("explorerMilestoneToday", { day: s.nextMilestone.day, ab: formatExplorerAB(s.nextMilestone.totalAB, true) })
                    : t("explorerNextMilestone", {
                        day: s.nextMilestone.day,
                        days: formatDays(s.nextMilestone.inDays),
                        ab: formatExplorerAB(s.nextMilestone.totalAB, true)
                    })) +
                '</span></p>';

        }

        if (s.allConfirmed) {

            html +=
                '<p class="explorer-ok"><img src="assets/icons/check.svg" class="icon-inline" alt=""> <span>' +
                e(t("explorerAllConfirmed")) + '</span></p>';

        } else {

            const pendingText = s.pendingCount === 1
                ? t("explorerPendingOne")
                : t("explorerPendingMany", { count: s.pendingCount });

            const lastText = s.confirmedDay > 0
                ? t("explorerConfirmedUpTo", { day: s.confirmedDayInCycle })
                : t("explorerNoneConfirmed");

            html +=
                '<p class="icon-text-line breakpoint-warning visible">' +
                    '<img src="assets/icons/warning.svg" class="icon-inline" alt=""> ' +
                    '<span>' + e(pendingText) + '<br><small>' + e(lastText) + ' • ' +
                    e(formatExplorerAB(s.pendingAB, true)) + '</small></span>' +
                '</p>' +
                '<button class="strategy-cta" type="button" onclick="explorerConfirmAllClick()">' +
                    e(s.pendingCount === 1 ? t("explorerConfirmOne") : t("explorerConfirmAll")) +
                '</button>';

        }

        if (explorerFeedback) {
            html += '<p class="explorer-feedback">' + e(explorerFeedback) + '</p>';
        }

        html +=
            '<div class="explorer-links">' +
                '<button type="button" onclick="openExplorerSheet(\'fix\')">' + e(t("explorerFix")) + '</button>' +
                '<button type="button" onclick="openExplorerSheet(\'balance\')">' + e(t("explorerBalanceBtn")) + '</button>' +
            '</div>' +
            '<label class="goal-checkbox-field explorer-balance-toggle">' +
                '<input type="checkbox" onchange="explorerToggleAddToBalance(this.checked)"' +
                    (player.explorer.addToBalance ? ' checked' : '') + '>' +
                '<span>' + e(t("explorerAddToBalance")) + '<br><small>' + e(t("explorerAddToBalanceHint")) + '</small></span>' +
            '</label>';

    }

    root.style.display = "block";
    root.setAttribute("data-status", s.status);
    root.innerHTML = html;

}

// --------------------------------------
// Azioni della card
// --------------------------------------

function explorerShowResult(r) {

    if (!r || !r.ok || r.noop) return;

    if (r.ab < 0 || r.balanceDelta < 0) {

        explorerFeedback = t("explorerFeedbackRolledBack");

    } else if (r.balanceDelta > 0) {

        explorerFeedback = t("explorerFeedbackAdded", {
            days: r.days,
            ab: formatExplorerAB(r.balanceDelta, true)
        });

    } else {

        explorerFeedback = t("explorerFeedbackNotAdded", {
            days: r.days,
            ab: formatExplorerAB(r.ab, true)
        });

    }

}

// Il puntatore confirmedDay rende l'azione idempotente: un secondo tocco,
// un refresh o un'altra scheda non possono contare due volte la stessa reward
function explorerConfirmAllClick() {

    explorerShowResult(confirmAllExplorerRewards());

    renderDashboard();

}

function explorerToggleAddToBalance(flag) {

    setExplorerAddToBalance(flag);

}

// --------------------------------------
// Pannelli (bottom sheet con le stesse classi di Modifica dati)
// --------------------------------------

function explorerSheetField(label, inputHtml) {

    return '<label class="settings-field"><span class="field-label-row">' +
        '<span>' + escapeStrategyHtml(label) + '</span></span>' + inputHtml + '</label>';

}

function openExplorerSheet(kind) {

    const overlay = document.getElementById("explorer-overlay");
    const panel = document.getElementById("explorer-sheet");

    if (!overlay || !panel) return;

    explorerSyncFromStorage();

    const s = getExplorerState();
    const e = escapeStrategyHtml;
    const today = explorerTodayKey();
    const ex = player.explorer;

    let html = "";

    if (kind === "start") {

        html =
            '<h2>' + e(t("explorerSheetStartTitle")) + '</h2>' +
            explorerSheetField(t("explorerStartLabel"),
                '<input type="date" id="ex-start-input" value="' + e(ex.startDate || today) + '">') +
            explorerSheetField(t("explorerEndLabel"),
                '<input type="date" id="ex-end-input" value="' + e(ex.endDate || "") + '">') +
            '<p class="explorer-error" id="ex-sheet-msg"></p>' +
            '<div class="settings-actions">' +
                '<button class="btn-cancel" onclick="closeExplorerSheet()">' + e(t("cancel")) + '</button>' +
                '<button class="btn-save" onclick="explorerSaveStart()">' + e(t("save")) + '</button>' +
            '</div>';

    } else if (kind === "fix") {

        if (s.status !== "active" && s.status !== "expired") return;

        const defaultDay = Math.max(0, Math.min(s.dayInCycle, s.confirmedDay - s.cycleIndex * s.cycleLength));

        html =
            '<h2>' + e(t("explorerFixTitle")) + '</h2>' +
            '<p class="explorer-note">' + e(t("explorerFixIntro")) + '</p>' +
            explorerSheetField(t("explorerFixLastLabel"),
                '<input type="number" inputmode="numeric" id="ex-fix-day" min="0" max="' + s.dayInCycle + '" value="' + defaultDay + '">') +
            '<label class="goal-checkbox-field"><input type="checkbox" id="ex-fix-balance"' + (ex.addToBalance ? ' checked' : '') + '>' +
                '<span>' + e(t("explorerAddToBalance")) + '</span></label>' +
            '<p class="explorer-error" id="ex-sheet-msg"></p>' +
            '<div class="settings-actions">' +
                '<button class="btn-save" onclick="explorerApplyFix()">' + e(t("explorerFixApply")) + '</button>' +
            '</div>' +
            explorerSheetField(t("explorerFixRestartLabel"),
                '<input type="date" id="ex-restart-date" max="' + e(today) + '" value="' + e(today) + '">') +
            '<div class="settings-actions">' +
                '<button class="btn-cancel" onclick="closeExplorerSheet()">' + e(t("cancel")) + '</button>' +
                '<button class="btn-save" onclick="explorerApplyRestart()">' + e(t("explorerFixRestart")) + '</button>' +
            '</div>';

    } else if (kind === "balance") {

        html =
            '<h2>' + e(t("explorerBalanceTitle")) + '</h2>' +
            '<p class="explorer-note">' + e(t("explorerBalanceHint")) + '</p>' +
            explorerSheetField(t("abBalanceLabel"),
                '<input type="number" inputmode="numeric" id="ex-balance-input" min="0" value="' +
                    e(Number(player.settings.abBalance) || 0) + '">') +
            '<div class="settings-actions">' +
                '<button class="btn-cancel" onclick="closeExplorerSheet()">' + e(t("cancel")) + '</button>' +
                '<button class="btn-save" onclick="explorerSaveBalance()">' + e(t("save")) + '</button>' +
            '</div>';

    } else {

        return;

    }

    panel.innerHTML = html;
    overlay.classList.add("open");

}

function closeExplorerSheet() {

    const overlay = document.getElementById("explorer-overlay");

    if (overlay) overlay.classList.remove("open");

}

function explorerSheetMessage(text) {

    const el = document.getElementById("ex-sheet-msg");

    if (el) el.textContent = text || "";

}

function explorerSaveStart() {

    const start = document.getElementById("ex-start-input").value;
    const end = document.getElementById("ex-end-input").value;

    if (!explorerValidKey(start)) {
        explorerSheetMessage(t("explorerDateError"));
        return;
    }

    if (end && (!explorerValidKey(end) || explorerKeyToNum(end) < explorerKeyToNum(start))) {
        explorerSheetMessage(t("explorerDateError"));
        return;
    }

    restartExplorerStreak(start, end || null);

    explorerFeedback = "";
    closeExplorerSheet();
    renderDashboard();

}

function explorerApplyFix() {

    const s = getExplorerState();
    let day = Math.floor(Number(document.getElementById("ex-fix-day").value));

    if (!isFinite(day)) day = 0;

    day = Math.max(0, Math.min(s.dayInCycle, day));

    const r = correctExplorerConfirmedDay(day, {
        addToBalance: document.getElementById("ex-fix-balance").checked
    });

    if (!r.ok) {
        explorerSheetMessage(r.reason === "streakBroken" ? t("explorerFixBroken") : t("explorerDateError"));
        return;
    }

    explorerFeedback = "";
    explorerShowResult(r);
    closeExplorerSheet();
    renderDashboard();

}

function explorerApplyRestart() {

    const date = document.getElementById("ex-restart-date").value;

    if (!explorerValidKey(date) || explorerKeyToNum(date) > explorerKeyToNum(explorerTodayKey())) {
        explorerSheetMessage(t("explorerDateError"));
        return;
    }

    restartExplorerStreak(date);

    explorerFeedback = "";
    closeExplorerSheet();
    renderDashboard();

}

function explorerSaveBalance() {

    explorerSyncFromStorage();

    player.settings.abBalance = Math.max(0, Math.floor(Number(document.getElementById("ex-balance-input").value)) || 0);

    savePlayerData();
    closeExplorerSheet();
    renderDashboard();

}

// --------------------------------------
// Il tempo scorre da solo: nuovo giorno o ritorno all'app = ricalcolo
// --------------------------------------

document.addEventListener("visibilitychange", function () {

    if (document.hidden) return;

    explorerSyncFromStorage();
    renderDashboard();

});

setInterval(function () {

    if (explorerTodayKey() !== explorerRenderedDay) renderDashboard();

}, 60000);

window.addEventListener("DOMContentLoaded", function () {

    const overlay = document.getElementById("explorer-overlay");

    if (overlay) {

        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) closeExplorerSheet();
        });

    }

});
