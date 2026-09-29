// ======================================
// AE Companion - Card Condivisibile
// Genera un'immagine (Canvas, lato client, nessun
// server) con le statistiche del giocatore, pronta
// per essere condivisa su Instagram/WhatsApp/altrove.
//
// È la versione condivisibile della Home: stessa struttura
// (hero, funzionalità, player card con Pass, rarità 2x2, stat),
// stessi token colore (le rarità sono lette da design-system.css),
// stessi font — Orbitron per titoli, nome giocatore e rarità
// (nome + numeri dei terreni), Inter per il resto. Entrambi vengono caricati dai file
// LOCALI in assets/fonts/ e registrati direttamente dai
// loro dati binari tramite l'API FontFace — non da Google
// Fonts: una richiesta di rete in più al momento della
// condivisione è un punto di fallimento in più, i file
// locali invece ci sono sempre, senza eccezioni.
// ======================================

const SHARE_CARD_W = 1080;

const SHARE_TITLE_FAMILY = "AECardTitleFont";
const SHARE_BODY_FAMILY = "AECardBodyFont";

const SHARE_FONT_TITLE = "'" + SHARE_TITLE_FAMILY + "', -apple-system, sans-serif";
const SHARE_FONT_BODY = "'" + SHARE_BODY_FAMILY + "', -apple-system, sans-serif";

let fontsReadyPromise = null;

// Carica i 4 file font locali (Orbitron 600/700, Inter 400/700)
// e li registra come FontFace direttamente dai loro dati binari.
// A differenza di document.fonts.ready (che su alcuni browser si
// risolve un istante troppo presto), il .load() di un singolo
// FontFace è un segnale diretto e affidabile.
//
// Se il caricamento fallisse per qualche motivo, NON deve
// bloccare la generazione della card: si torna al font di sistema
// (già previsto come fallback) invece di lasciare l'utente con
// un pulsante "condividi" che non fa nulla.
function ensureShareFontsLoaded() {

    if (fontsReadyPromise) return fontsReadyPromise;

    const fonts = [
        { family: SHARE_TITLE_FAMILY, weight: "600", url: "assets/fonts/Orbitron-SemiBold.woff2" },
        { family: SHARE_TITLE_FAMILY, weight: "700", url: "assets/fonts/Orbitron-Bold.woff2" },
        { family: SHARE_BODY_FAMILY, weight: "400", url: "assets/fonts/Inter-Regular.woff2" },
        { family: SHARE_BODY_FAMILY, weight: "700", url: "assets/fonts/Inter-Bold.woff2" }
    ];

    fontsReadyPromise = Promise.all(fonts.map(async function (f) {

        const fontRes = await fetch(f.url);

        if (!fontRes.ok) throw new Error("File font non trovato: " + f.url);

        const fontBuffer = await fontRes.arrayBuffer();

        const fontFace = new FontFace(f.family, fontBuffer, { weight: f.weight });

        await fontFace.load();

        document.fonts.add(fontFace);

    })).catch(function (e) {

        console.error("AE Companion: font locali non caricati, uso il fallback di sistema", e);

    });

    return fontsReadyPromise;

}

function loadImage(src) {

    return new Promise(function (resolve, reject) {

        const img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = reject;
        img.src = src;

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

// --------------------------------------
// Utility di disegno
// --------------------------------------

// Legge un token da design-system.css: così la card di condivisione
// e le card della dashboard usano SEMPRE la stessa palette rarità.
function cssVar(name, fallback) {

    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    return value || fallback;

}

// Esagono "flat-top" identico a .hex-icon-wrap del sito (clip-path 25%/75%)
function hexPath(ctx, x, y, w, h) {

    ctx.beginPath();
    ctx.moveTo(x + w * 0.25, y);
    ctx.lineTo(x + w * 0.75, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w * 0.75, y + h);
    ctx.lineTo(x + w * 0.25, y + h);
    ctx.lineTo(x, y + h / 2);
    ctx.closePath();

}

// Stessa costruzione di .hex-icon-wrap: esagono verde + esagono interno
// scuro (inset = 2px su 32px di larghezza) + icona al 55%
function drawHexIcon(ctx, cx, cy, w, iconImg, glow) {

    const h = w * 28 / 32;
    const inset = w * 2 / 32;
    const x = cx - w / 2;
    const y = cy - h / 2;

    ctx.save();

    if (glow) {
        ctx.shadowColor = "rgba(88,224,109,.35)";
        ctx.shadowBlur = 26;
    }

    hexPath(ctx, x, y, w, h);
    ctx.fillStyle = "#58E06D";
    ctx.fill();

    ctx.restore();

    hexPath(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2);
    ctx.fillStyle = "#262D38";
    ctx.fill();

    const iconSize = h * 0.55;
    ctx.drawImage(iconImg, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);

}

// Rettangolo arrotondato con bordo interno (il bordo non sporge dal rettangolo)
function drawBoxedRect(ctx, x, y, w, h, r, fill, stroke, lineWidth) {

    drawRoundedRect(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();

    if (stroke) {

        const half = lineWidth / 2;

        drawRoundedRect(ctx, x + half, y + half, w - lineWidth, h - lineWidth, Math.max(0, r - half));
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = stroke;
        ctx.stroke();

    }

}

function wrapLines(ctx, text, maxWidth) {

    const words = String(text).split(" ");
    const lines = [];
    let line = "";

    words.forEach(function (word) {

        const test = line ? line + " " + word : word;

        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }

    });

    if (line) lines.push(line);

    return lines;

}

// Riduce il corpo del testo finché non sta nella larghezza data
function fitFont(ctx, text, weight, family, size, maxWidth, minSize) {

    let s = size;

    ctx.font = weight + " " + s + "px " + family;

    while (ctx.measureText(text).width > maxWidth && s > minSize) {
        s -= 2;
        ctx.font = weight + " " + s + "px " + family;
    }

    return s;

}

// Stesso pattern esagonale di .hex-bg del sito (tessera 60x104, scala 2)
function drawHexPattern(ctx, w, h) {

    const k = 2;

    ctx.save();
    ctx.strokeStyle = "rgba(88,224,109,0.07)";
    ctx.lineWidth = 2;

    for (let ty = -35 * k; ty < h; ty += 104 * k) {

        for (let tx = 0; tx < w; tx += 60 * k) {

            [[0, 0], [0, 35]].forEach(function (off) {

                const oy = ty + off[1] * k;

                ctx.beginPath();
                ctx.moveTo(tx + 30 * k, oy);
                ctx.lineTo(tx + 60 * k, oy + 17 * k);
                ctx.lineTo(tx + 60 * k, oy + 52 * k);
                ctx.lineTo(tx + 30 * k, oy + 69 * k);
                ctx.lineTo(tx, oy + 52 * k);
                ctx.lineTo(tx, oy + 17 * k);
                ctx.closePath();
                ctx.stroke();

            });

        }

    }

    ctx.restore();

}

// Rarità: nome + colori presi dai token CSS (stessa identità della dashboard)
function getShareRarities() {

    return [
        { key: "common",    name: "COMMON",    value: player.lands.common },
        { key: "rare",      name: "RARE",      value: player.lands.rare },
        { key: "epic",      name: "EPIC",      value: player.lands.epic },
        { key: "legendary", name: "LEGENDARY", value: player.lands.legendary }
    ].map(function (r) {

        r.color = cssVar("--rarity-" + r.key, "#9AA4B2");
        r.fill = cssVar("--rarity-" + r.key + "-fill", "#262D38");
        r.glow = cssVar("--rarity-" + r.key + "-glow", "transparent");
        r.borderWidth = parseFloat(cssVar("--rarity-border-w", "3")) || 3;

        return r;

    });

}

async function generateShareCardCanvas() {

    const [boostImg, incomeImg, badgeImg, chatImg, ideaImg, checkImg, landsImg, logoImg, missionImg, explorerImg] = await Promise.all([
        loadImage("assets/icons/boost.svg"),
        loadImage("assets/icons/income.svg"),
        loadImage("assets/icons/badge.svg"),
        loadImage("assets/icons/chat.svg"),
        loadImage("assets/icons/idea.svg"),
        loadImage("assets/icons/check.svg"),
        loadImage("assets/icons/lands.svg"),
        loadImage("assets/logo.svg"),
        loadImage("assets/icons/mission-badge.svg"),
        loadImage("assets/icons/explorer-badge.svg"),
        ensureShareFontsLoaded()
    ]);

    // Scala: la Home è larga ~390px di contenuto, la card 976px → 2.5x
    const W = SHARE_CARD_W;
    const M = 52;
    const CW = W - M * 2;
    const cx = W / 2;
    const PAD = 48;

    const scratch = document.createElement("canvas").getContext("2d");

    // ---- Nota "tabelle ufficiali per Paese": misuro prima, per calcolare l'altezza
    const noteHex = 64;
    const noteTextX = M + 36 + noteHex + 26;
    const noteTextW = W - M - 36 - noteTextX;

    scratch.font = "700 30px " + SHARE_FONT_BODY;
    const noteTitleLines = wrapLines(scratch, t("countryNoteTitle"), noteTextW);

    scratch.font = "400 25px " + SHARE_FONT_BODY;
    const noteSubLines = wrapLines(scratch, t("countryNoteText"), noteTextW);

    const noteH = 34 * 2 + noteTitleLines.length * 40 + noteSubLines.length * 34 + 8;

    // ---- Layout verticale
    const logoSize = 170;
    const logoTop = 70;
    const titleY = logoTop + logoSize + 58;
    const tagY = titleY + 54;

    const featTop = tagY + 58;
    const featH = 250;

    const cardTop = featTop + featH + 40;
    const nameCy = cardTop + PAD + 38;
    const totalCy = nameCy + 100;
    const hr1Y = totalCy + 56;
    const rarityTop = hr1Y + 30;
    const rarityH = 150;
    const rarityGap = 24;
    const rarityBottom = rarityTop + rarityH * 2 + rarityGap;
    const hr2Y = rarityBottom + 30;
    const statTop = hr2Y + 30;
    const statH = 190;
    const cardBottom = statTop + statH + PAD;

    const noteTop = cardBottom + 36;
    const ctaY = noteTop + noteH + 76;

    const H = ctaY + 105 + 70;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // ==============================
    // Sfondo (come il body del sito: colore + pattern esagonale + due aloni)
    // ==============================

    ctx.fillStyle = "#10141B";
    ctx.fillRect(0, 0, W, H);

    drawHexPattern(ctx, W, H);

    const glow1 = ctx.createRadialGradient(W * 0.15, H * 0.06, 0, W * 0.15, H * 0.06, 760);
    glow1.addColorStop(0, "rgba(69,194,86,.16)");
    glow1.addColorStop(1, "rgba(69,194,86,0)");
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);

    const glow2 = ctx.createRadialGradient(W * 0.85, H * 0.3, 0, W * 0.85, H * 0.3, 700);
    glow2.addColorStop(0, "rgba(0,212,255,.10)");
    glow2.addColorStop(1, "rgba(0,212,255,0)");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    drawRoundedRect(ctx, 22, 22, W - 44, H - 44, 40);
    ctx.strokeStyle = "#313846";
    ctx.lineWidth = 2;
    ctx.stroke();

    // ==============================
    // Hero: logo reale + titolo + tagline (come l'header della Home)
    // ==============================

    ctx.save();
    ctx.shadowColor = "rgba(88,224,109,.35)";
    ctx.shadowBlur = 45;
    ctx.drawImage(logoImg, cx - logoSize / 2, logoTop, logoSize, logoSize);
    ctx.restore();

    const titleGrad = ctx.createLinearGradient(cx - 300, 0, cx + 300, 0);
    titleGrad.addColorStop(0, "#58E06D");
    titleGrad.addColorStop(1, "#00D4FF");

    ctx.font = "700 72px " + SHARE_FONT_TITLE;
    ctx.fillStyle = titleGrad;
    ctx.fillText(t("appName").toUpperCase(), cx, titleY);

    ctx.font = "700 26px " + SHARE_FONT_TITLE;
    ctx.fillStyle = "#9AA4B2";
    if ("letterSpacing" in ctx) ctx.letterSpacing = "6px";
    ctx.fillText(t("tagline").toUpperCase(), cx, tagY);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

    // ==============================
    // Funzionalità strategiche: stessi tre tile della Home
    // ==============================

    const features = [
        { icon: chatImg,  title: t("featureAssistantTitle"), sub: t("featureAssistantSub") },
        { icon: ideaImg,  title: t("featureAdviceTitle"),    sub: t("featureAdviceSub") },
        { icon: boostImg, title: t("featureTipsTitle"),      sub: t("featureTipsSub") }
    ];

    const featGap = 25;
    const featW = (CW - featGap * 2) / 3;

    features.forEach(function (f, i) {

        const x = M + i * (featW + featGap);
        const fcx = x + featW / 2;

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,.35)";
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 14;
        drawBoxedRect(ctx, x, featTop, featW, featH, 45, "#1A202A", null, 0);
        ctx.restore();

        drawBoxedRect(ctx, x, featTop, featW, featH, 45, "#1A202A", "#313846", 2.5);

        drawHexIcon(ctx, fcx, featTop + 90, 132, f.icon, true);

        fitFont(ctx, f.title.toUpperCase(), "700", SHARE_FONT_TITLE, 30, featW - 34, 18);
        ctx.fillStyle = "#F5F7FA";
        ctx.fillText(f.title.toUpperCase(), fcx, featTop + 186);

        fitFont(ctx, f.sub, "400", SHARE_FONT_BODY, 25, featW - 30, 16);
        ctx.fillStyle = "#9AA4B2";
        ctx.fillText(f.sub, fcx, featTop + 224);

    });

    // ==============================
    // Player card (come .player-card della Home)
    // ==============================

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.35)";
    ctx.shadowBlur = 65;
    ctx.shadowOffsetY = 20;
    drawBoxedRect(ctx, M, cardTop, CW, cardBottom - cardTop, 45, "#1A202A", null, 0);
    ctx.restore();

    drawBoxedRect(ctx, M, cardTop, CW, cardBottom - cardTop, 45, "#1A202A", "#313846", 2.5);

    const innerL = M + PAD;
    const innerR = M + CW - PAD;
    const innerW = CW - PAD * 2;

    // ---- Nome giocatore + icone dei Pass realmente attivi
    const activePasses = [];

    if (player.passes.mission === true) activePasses.push({ img: missionImg, glow: "rgba(58,134,255,.5)" });
    if (player.passes.explorer === true) activePasses.push({ img: explorerImg, glow: "rgba(155,92,255,.5)" });

    const badgeSize = 70;
    const badgeGap = 15;
    const nameGap = 25;
    const passesW = activePasses.length
        ? activePasses.length * badgeSize + (activePasses.length - 1) * badgeGap + nameGap
        : 0;

    const playerName = player.profile.name || "Player";

    const nameSize = fitFont(ctx, playerName, "700", SHARE_FONT_TITLE, 56, innerW - passesW, 28);
    ctx.font = "700 " + nameSize + "px " + SHARE_FONT_TITLE;

    const nameW = ctx.measureText(playerName).width;
    const rowW = nameW + passesW;
    const rowX = cx - rowW / 2;

    ctx.textAlign = "left";
    ctx.fillStyle = "#F5F7FA";
    ctx.fillText(playerName, rowX, nameCy);
    ctx.textAlign = "center";

    activePasses.forEach(function (p, i) {

        ctx.save();
        ctx.shadowColor = p.glow;
        ctx.shadowBlur = 12;
        ctx.drawImage(
            p.img,
            rowX + nameW + nameGap + i * (badgeSize + badgeGap),
            nameCy - badgeSize / 2,
            badgeSize,
            badgeSize
        );
        ctx.restore();

    });

    // ---- Terreni totali
    drawHexIcon(ctx, innerL + 28, totalCy, 56, landsImg, false);

    ctx.textAlign = "left";
    ctx.font = "700 44px " + SHARE_FONT_BODY;
    ctx.fillStyle = "#F5F7FA";
    ctx.fillText(t("lands"), innerL + 28 + 28 + 18, totalCy);

    ctx.textAlign = "right";
    ctx.fillText(formatK(getTotalLands()), innerR, totalCy);
    ctx.textAlign = "center";

    // ---- Separatore
    ctx.fillStyle = "#313846";
    ctx.fillRect(innerL, hr1Y, innerW, 2.5);

    // ---- Rarità 2x2: nome + numero in Orbitron (stesso font del nome player)
    const rarityGapX = 30;
    const rarityW = (innerW - rarityGapX) / 2;

    getShareRarities().forEach(function (r, i) {

        const col = i % 2;
        const row = Math.floor(i / 2);

        const x = innerL + col * (rarityW + rarityGapX);
        const y = rarityTop + row * (rarityH + rarityGap);
        const rcx = x + rarityW / 2;

        // riempimento: base della card + tinta della rarità (come sul sito)
        ctx.save();
        ctx.shadowColor = r.glow;
        ctx.shadowBlur = 30;
        drawBoxedRect(ctx, x, y, rarityW, rarityH, 30, "#1A202A", null, 0);
        ctx.restore();

        drawBoxedRect(ctx, x, y, rarityW, rarityH, 30, r.fill, null, 0);

        drawBoxedRect(ctx, x, y, rarityW, rarityH, 30, "rgba(0,0,0,0)", r.color, r.borderWidth * 2.5);

        ctx.font = "700 27px " + SHARE_FONT_TITLE;
        ctx.fillStyle = r.color;
        ctx.fillText(r.name, rcx, y + 44);

        const numText = formatK(r.value);
        fitFont(ctx, numText, "700", SHARE_FONT_TITLE, 56, rarityW - 40, 30);
        ctx.fillStyle = "#F5F7FA";
        ctx.fillText(numText, rcx, y + 100);

    });

    // ---- Separatore
    ctx.fillStyle = "#313846";
    ctx.fillRect(innerL, hr2Y, innerW, 2.5);

    // ---- Stat tile: boost, rendita giornaliera, bonus passaporto
    const stats = [
        { icon: boostImg,  value: "x" + getBoostMultiplier() },
        { icon: incomeImg, value: formatCurrency(getDailyIncomeConverted()) },
        { icon: badgeImg,  value: "+" + getBadgeBoostPercent(player.badges) + "%" }
    ];

    const statGap = 20;
    const statW = (innerW - statGap * 2) / 3;

    stats.forEach(function (stat, i) {

        const x = innerL + i * (statW + statGap);
        const scx = x + statW / 2;

        drawBoxedRect(ctx, x, statTop, statW, statH, 30, "#262D38", null, 0);

        drawHexIcon(ctx, scx, statTop + 68, 84, stat.icon, false);

        fitFont(ctx, stat.value, "700", SHARE_FONT_BODY, 38, statW - 24, 22);
        ctx.fillStyle = "#F5F7FA";
        ctx.fillText(stat.value, scx, statTop + 140);

    });

    // ==============================
    // Nota: tabelle ufficiali Atlas Earth, per Paese
    // ==============================

    drawBoxedRect(ctx, M, noteTop, CW, noteH, 35, "rgba(0,212,255,.06)", "rgba(0,212,255,.35)", 2.5);

    drawHexIcon(ctx, M + 36 + noteHex / 2, noteTop + noteH / 2, noteHex, checkImg, false);

    ctx.textAlign = "left";

    let lineY = noteTop + 34 + 20;

    ctx.font = "700 30px " + SHARE_FONT_BODY;
    ctx.fillStyle = "#00D4FF";

    noteTitleLines.forEach(function (line) {
        ctx.fillText(line, noteTextX, lineY);
        lineY += 40;
    });

    lineY += 4;
    ctx.font = "400 25px " + SHARE_FONT_BODY;
    ctx.fillStyle = "#9AA4B2";

    noteSubLines.forEach(function (line) {
        ctx.fillText(line, noteTextX, lineY);
        lineY += 34;
    });

    ctx.textAlign = "center";

    // ==============================
    // Footer / call to action
    // ==============================

    ctx.font = "400 30px " + SHARE_FONT_BODY;
    ctx.fillStyle = "#9AA4B2";
    ctx.fillText(t("shareCardCta"), cx, ctaY);

    ctx.font = "700 38px " + SHARE_FONT_TITLE;
    ctx.fillStyle = "#58E06D";
    ctx.fillText("alex4ndrus94.github.io/-ae-companion", cx, ctaY + 55);

    ctx.font = "400 24px " + SHARE_FONT_BODY;
    ctx.fillStyle = "#9AA4B2";
    ctx.fillText(t("shareCardFooter"), cx, ctaY + 105);

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
