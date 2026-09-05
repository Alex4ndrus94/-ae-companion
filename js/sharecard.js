// ======================================
// AE Companion - Card Condivisibile
// Genera un'immagine (Canvas, lato client, nessun
// server) con le statistiche del giocatore, pronta
// per essere condivisa su Instagram/WhatsApp/altrove.
//
// Approccio a due livelli:
// - Forme, gradienti e icone -> disegnati col Canvas 2D
//   (funzionano bene, nessun problema di font qui)
// - TUTTO il testo -> renderizzato come SVG e poi
//   sovrapposto come immagine. Canvas 2D ha un sistema
//   di caricamento dei web font indipendente e meno
//   affidabile; SVG <text> usa lo stesso motore CSS del
//   resto della pagina, quindi eredita i font già
//   caricati (Orbitron/Inter) in modo molto più solido.
// ======================================

const SHARE_CARD_W = 1080;
const SHARE_CARD_H = 1920;

const FONT_TITLE = "Orbitron";
const FONT_BODY = "Inter";

function loadImage(src) {

    return new Promise(function (resolve, reject) {

        const img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = reject;
        img.src = src;

    });

}

function escapeXml(str) {

    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

}

// Costruisce l'intero livello di testo come un unico SVG e lo
// restituisce come immagine pronta da sovrapporre al canvas
function buildTextLayerSvg(lines) {

    const textElements = lines.map(function (l) {

        const weight = l.weight || 600;
        const anchor = l.anchor || "middle";
        const family = l.family === "title" ? FONT_TITLE : FONT_BODY;
        const letterSpacing = l.letterSpacing ? ' letter-spacing="' + l.letterSpacing + '"' : "";

        return '<text x="' + l.x + '" y="' + l.y + '" ' +
            'font-family="' + family + ', sans-serif" ' +
            'font-weight="' + weight + '" ' +
            'font-size="' + l.size + '" ' +
            'fill="' + l.color + '" ' +
            'text-anchor="' + anchor + '" ' +
            'dominant-baseline="central"' + letterSpacing + '>' +
            escapeXml(l.text) + '</text>';

    }).join("");

    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="' + SHARE_CARD_W + '" height="' + SHARE_CARD_H + '">' +
        '<style>text{font-synthesis:none;}</style>' +
        textElements +
        '</svg>';

    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    return loadImage(url).finally(function () {
        URL.revokeObjectURL(url);
    });

}

function drawRoundedRect(ctx, x, y, w, h, r) {

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();

}

function drawHexagon(ctx, cx, cy, r) {

    ctx.beginPath();

    for (let i = 0; i < 6; i++) {

        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);

        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);

    }

    ctx.closePath();

}

// Esagono con icona reale dentro, stesso linguaggio visivo
// di .hex-icon-wrap nel sito (sfondo scuro, bordo verde, icona centrata)
function drawIconHex(ctx, cx, cy, r, iconImg) {

    drawHexagon(ctx, cx, cy, r);
    ctx.fillStyle = "#262D38";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#58E06D";
    ctx.stroke();

    const iconSize = r * 1.15;
    ctx.drawImage(iconImg, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);

}

// Stima larghezza testo senza dipendere dal font caricato nel
// canvas (usata solo per decisioni di layout, non per il disegno
// vero e proprio: bastano metriche approssimative)
function estimateTextWidth(text, fontSizePx, weight) {

    const avgCharWidth = fontSizePx * (weight >= 700 ? 0.62 : 0.56);
    return text.length * avgCharWidth;

}

async function generateShareCardCanvas() {

    const [boostImg, incomeImg, badgeImg, chatImg, ideaImg] = await Promise.all([
        loadImage("assets/icons/boost.svg"),
        loadImage("assets/icons/income.svg"),
        loadImage("assets/icons/badge.svg"),
        loadImage("assets/icons/chat.svg"),
        loadImage("assets/icons/idea.svg")
    ]);

    const canvas = document.createElement("canvas");
    canvas.width = SHARE_CARD_W;
    canvas.height = SHARE_CARD_H;

    const ctx = canvas.getContext("2d");

    const textLines = [];

    // ==============================
    // Sfondo
    // ==============================

    ctx.fillStyle = "#10141B";
    ctx.fillRect(0, 0, SHARE_CARD_W, SHARE_CARD_H);

    const glow1 = ctx.createRadialGradient(180, 200, 0, 180, 200, 700);
    glow1.addColorStop(0, "rgba(69,194,86,.16)");
    glow1.addColorStop(1, "rgba(69,194,86,0)");
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, SHARE_CARD_W, SHARE_CARD_H);

    const glow2 = ctx.createRadialGradient(920, 1700, 0, 920, 1700, 700);
    glow2.addColorStop(0, "rgba(0,212,255,.10)");
    glow2.addColorStop(1, "rgba(0,212,255,0)");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, SHARE_CARD_W, SHARE_CARD_H);

    // Cornice esterna, come una grande "card" del sito
    drawRoundedRect(ctx, 30, 30, SHARE_CARD_W - 60, SHARE_CARD_H - 60, 40);
    ctx.strokeStyle = "#313846";
    ctx.lineWidth = 2;
    ctx.stroke();

    const logoCx = SHARE_CARD_W / 2;

    // ==============================
    // Logo esagonale
    // ==============================

    const logoCy = 220;

    const logoGrad = ctx.createLinearGradient(logoCx - 90, logoCy - 90, logoCx + 90, logoCy + 90);
    logoGrad.addColorStop(0, "#58E06D");
    logoGrad.addColorStop(1, "#2FA84A");

    ctx.save();
    ctx.shadowColor = "rgba(88,224,109,.55)";
    ctx.shadowBlur = 40;
    drawHexagon(ctx, logoCx, logoCy, 90);
    ctx.fillStyle = "#10141B";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = logoGrad;
    ctx.stroke();
    ctx.restore();

    textLines.push({ x: logoCx, y: logoCy + 6, text: "AE", family: "body", weight: 700, size: 76, color: "#58E06D" });

    // ==============================
    // Titolo + nome giocatore
    // ==============================

    textLines.push({ x: logoCx, y: 365, text: "AE COMPANION", family: "title", weight: 700, size: 58, color: "#58E06D", letterSpacing: 2 });
    textLines.push({ x: logoCx, y: 415, text: "TRACK · PLAN · CONQUER", family: "title", weight: 600, size: 26, color: "#9AA4B2", letterSpacing: 3 });
    textLines.push({ x: logoCx, y: 510, text: player.profile.name || "Player", family: "body", weight: 700, size: 54, color: "#F5F7FA" });

    // ==============================
    // Box terreni totali
    // ==============================

    const totalLands = getTotalLands();

    drawRoundedRect(ctx, 140, 570, SHARE_CARD_W - 280, 270, 32);
    ctx.fillStyle = "#1A202A";
    ctx.fill();
    ctx.strokeStyle = "#313846";
    ctx.lineWidth = 2;
    ctx.stroke();

    textLines.push({ x: logoCx, y: 645, text: "TERRENI TOTALI", family: "title", weight: 600, size: 26, color: "#9AA4B2", letterSpacing: 2 });
    textLines.push({ x: logoCx, y: 765, text: formatK(totalLands), family: "body", weight: 700, size: 124, color: "#58E06D" });

    // ==============================
    // Riga statistiche: icona esagonale reale + numero
    // ==============================

    const boostMultiplier = getBoostMultiplier();
    const dailyIncome = formatCurrency(getDailyIncomeConverted());
    const badgePercent = getBadgeBoostPercent(player.badges);

    const statY = 900;
    const statW = (SHARE_CARD_W - 280 - 40) / 3;
    const statH = 200;

    const stats = [
        { icon: boostImg, value: "x" + boostMultiplier },
        { icon: incomeImg, value: dailyIncome },
        { icon: badgeImg, value: "+" + badgePercent + "%" }
    ];

    stats.forEach(function (stat, i) {

        const x = 140 + i * (statW + 20);
        const cx = x + statW / 2;

        drawRoundedRect(ctx, x, statY, statW, statH, 24);
        ctx.fillStyle = "#1A202A";
        ctx.fill();
        ctx.strokeStyle = "#313846";
        ctx.lineWidth = 2;
        ctx.stroke();

        drawIconHex(ctx, cx, statY + 58, 34, stat.icon);

        textLines.push({ x: cx, y: statY + 150, text: stat.value, family: "body", weight: 700, size: 40, color: "#F5F7FA" });

    });

    // ==============================
    // Rarità: nome + numero, come richiesto, per
    // introdurre anche chi non conosce il gioco
    // ==============================

    const rarityY = 1150;
    const rarityH = 160;

    const rarities = [
        { name: "COMMON", value: player.lands.common, color: "#9AA4B2" },
        { name: "RARE", value: player.lands.rare, color: "#3A86FF" },
        { name: "EPIC", value: player.lands.epic, color: "#9B5CFF" },
        { name: "LEGENDARY", value: player.lands.legendary, color: "#FFB322" }
    ];

    const rarityW = (SHARE_CARD_W - 280 - 60) / 4;

    rarities.forEach(function (r, i) {

        const x = 140 + i * (rarityW + 20);
        const cx = x + rarityW / 2;

        drawRoundedRect(ctx, x, rarityY, rarityW, rarityH, 20);
        ctx.fillStyle = "#1A202A";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = r.color;
        ctx.stroke();

        textLines.push({ x: cx, y: rarityY + 44, text: r.name, family: "title", weight: 600, size: 17, color: r.color, letterSpacing: 1 });
        textLines.push({ x: cx, y: rarityY + 104, text: formatK(r.value), family: "body", weight: 700, size: 40, color: "#F5F7FA" });

    });

    // ==============================
    // Cosa ci distingue
    // ==============================

    const features = [
        { icon: chatImg, label: t("shareCardFeatureAssistant") },
        { icon: ideaImg, label: t("shareCardFeatureStrategy") },
        { icon: boostImg, label: t("shareCardFeatureCommunity") }
    ];

    const featuresY = rarityY + rarityH + 200;
    const featureRowH = 100;
    const iconDiameter = 60;
    const gap = 24;

    const maxFeatureWidth = SHARE_CARD_W - 200;

    const rows = features.map(function (feature) {

        let fontSize = 34;
        let textWidth = estimateTextWidth(feature.label, fontSize, 600);

        while (iconDiameter + gap + textWidth > maxFeatureWidth && fontSize > 22) {
            fontSize -= 2;
            textWidth = estimateTextWidth(feature.label, fontSize, 600);
        }

        return { feature: feature, fontSize: fontSize, textWidth: textWidth };

    });

    const widestTextWidth = Math.max.apply(null, rows.map(function (r) { return r.textWidth; }));
    const blockWidth = iconDiameter + gap + widestTextWidth;
    const startX = logoCx - blockWidth / 2;
    const iconCx = startX + iconDiameter / 2;
    const textX = startX + iconDiameter + gap;

    rows.forEach(function (row, i) {

        const y = featuresY + i * featureRowH;

        drawIconHex(ctx, iconCx, y, 30, row.feature.icon);

        textLines.push({ x: textX, y: y + 2, text: row.feature.label, family: "body", weight: 600, size: row.fontSize, color: "#F5F7FA", anchor: "start" });

    });

    // ==============================
    // Footer / call to action
    // ==============================

    const footerY = featuresY + (features.length - 1) * featureRowH + 180;

    textLines.push({ x: logoCx, y: footerY, text: t("shareCardCta"), family: "body", weight: 400, size: 30, color: "#9AA4B2" });
    textLines.push({ x: logoCx, y: footerY + 55, text: "alex4ndrus94.github.io/-ae-companion", family: "title", weight: 700, size: 38, color: "#58E06D" });
    textLines.push({ x: logoCx, y: footerY + 105, text: t("shareCardFooter"), family: "body", weight: 400, size: 24, color: "#9AA4B2" });

    // ==============================
    // Sovrappongo l'intero livello di testo (SVG -> immagine)
    // ==============================

    const textLayerImg = await buildTextLayerSvg(textLines);
    ctx.drawImage(textLayerImg, 0, 0, SHARE_CARD_W, SHARE_CARD_H);

    return canvas;

}

async function shareStatsCard() {

    const canvas = await generateShareCardCanvas();

    canvas.toBlob(async function (blob) {

        if (!blob) return;

        const fileName = "ae-companion-stats.png";
        const file = new File([blob], fileName, { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {

            try {

                await navigator.share({
                    files: [file],
                    title: "AE Companion",
                    text: t("shareCardShareText")
                });

            } catch (e) {
                // utente ha annullato la condivisione: nessun errore da mostrare
            }

        } else {

            // Fallback: scarica l'immagine (browser senza Web Share API con file)
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        }

    }, "image/png");

}
