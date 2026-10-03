// ======================================
// AE Companion - Strategy UI
// Solo presentazione: riceve il modello di getStrategyModel()
// e lo disegna. Non contiene formule né condizioni per obiettivo.
// ======================================

function escapeStrategyHtml(value) {

    return String(value === null || value === undefined ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

}

function renderStrategyMetric(metric) {

    const classes = ["strategy-box"];

    if (metric.wide) classes.push("wide");

    const valueClasses = ["strategy-value"];

    if (metric.tone) valueClasses.push("tone-" + metric.tone);

    if (metric.small) valueClasses.push("small");

    return (
        '<div class="' + classes.join(" ") + '">' +
            '<div class="strategy-title">' + escapeStrategyHtml(metric.label) + '</div>' +
            '<div class="' + valueClasses.join(" ") + '">' + escapeStrategyHtml(metric.value) + '</div>' +
        '</div>'
    );

}

function renderStrategy(model) {

    const root = document.getElementById("strategy-dynamic");

    if (!root || !model) return;

    const e = escapeStrategyHtml;

    const isMissing = model.status === "missing";
    const actionTitle = model.status === "reached" ? t("strategyNextStepTitle") : t("strategyActionTitle");

    let html = "";

    // Intestazione: obiettivo + stato
    html +=
        '<div class="strategy-head">' +
            '<span class="hex-icon-wrap"><img src="assets/icons/' + e(model.icon) + '.svg" alt=""></span>' +
            '<div class="strategy-head-text">' +
                '<span class="strategy-eyebrow">' + e(t("strategyEyebrowGoal")) + '</span>' +
                '<span class="strategy-goal-title">' + e(model.goalTitle) + '</span>' +
            '</div>' +
            '<span class="strategy-status status-' + e(model.status) + '">' + e(model.statusLabel) + '</span>' +
        '</div>';

    if (model.goalDescription) {
        html += '<p class="strategy-desc">' + e(model.goalDescription) + '</p>';
    }

    // Metrica principale
    if (!isMissing) {

        html +=
            '<div class="strategy-hero">' +
                '<div class="strategy-hero-label">' + e(model.primaryMetric.label) + '</div>' +
                '<div class="strategy-hero-value">' + e(model.primaryMetric.value) + '</div>' +
                (model.primaryMetric.sub
                    ? '<div class="strategy-hero-sub">' + e(model.primaryMetric.sub) + '</div>'
                    : '') +
            '</div>';

    }

    // Metriche secondarie (il numero e la disposizione cambiano per obiettivo)
    if (model.secondaryMetrics.length) {

        html += '<div class="strategy-grid">' +
            model.secondaryMetrics.map(renderStrategyMetric).join("") +
        '</div>';

    }

    if (!isMissing) {
        html += '<p class="strategy-ab-line">' + e(model.abSummary.text) + '</p>';
    }

    // Azione consigliata + spiegazione
    html +=
        '<div class="strategy-action">' +
            '<div class="strategy-action-head">' +
                '<img src="assets/icons/' + e(model.recommendedAction.icon) + '.svg" class="icon-inline" alt="">' +
                '<div>' +
                    '<span class="strategy-eyebrow">' + e(actionTitle) + '</span>' +
                    '<span class="strategy-action-label">' + e(model.recommendedAction.label) + '</span>' +
                '</div>' +
            '</div>' +
            '<p class="strategy-explanation">' + e(model.explanation) + '</p>' +
            (model.note ? '<p class="strategy-note">' + e(model.note) + '</p>' : '') +
            (model.needsInput
                ? '<button class="strategy-cta" type="button" onclick="openSettings(false)">' + e(t("strategyEditData")) + '</button>'
                : '') +
        '</div>';

    if (model.warning) {

        html +=
            '<p class="icon-text-line breakpoint-warning visible">' +
                '<img src="assets/icons/warning.svg" class="icon-inline" alt=""> ' +
                '<span>' + e(model.warning) + '</span>' +
            '</p>';

    }

    // Barra di progresso coerente con l'obiettivo
    if (!isMissing) {

        const width = Math.max(0, Math.min(100, Number(model.progress) || 0));

        html +=
            '<h3>' + e(model.progressTitle) + '</h3>' +
            '<div class="progress">' +
                '<div class="progress-fill' + (model.progressWarning ? ' warning' : '') + '" id="progress-fill" style="width:' + width + '%"></div>' +
            '</div>' +
            '<p id="progress-text">' + e(model.progressText) + '</p>';

    }

    root.setAttribute("data-goal", model.goalType);
    root.setAttribute("data-status", model.status);
    root.innerHTML = html;

}
