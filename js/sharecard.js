// ======================================
// AE Companion - Card Condivisibile
// Genera un'immagine (Canvas, lato client, nessun
// server) con le statistiche del giocatore, pronta
// per essere condivisa su Instagram/WhatsApp/altrove.
//
// Stessi due font del sito: Orbitron per i titoli (il
// nome giocatore compreso — sul sito è un <h2>, quindi
// eredita Orbitron come tutti i titoli) e Inter per
// numeri/etichette. Entrambi vengono caricati dai file
// LOCALI in assets/fonts/ e registrati direttamente dai
// loro dati binari tramite l'API FontFace — non da Google
// Fonts: una richiesta di rete in più al momento della
// condivisione è un punto di fallimento in più, i file
// locali invece ci sono sempre, senza eccezioni.
// ======================================

const SHARE_CARD_W = 1080;
const SHARE_CARD_H = 1920;

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

async function generateShareCardCanvas() {

    const [boostImg, incomeImg, badgeImg, chatImg, ideaImg] = await Promise.all([
        loadImage("assets/icons/boost.svg"),
        loadImage("assets/icons/income.svg"),
        loadImage("assets/icons/badge.svg"),
        loadImage("assets/icons/chat.svg"),
        loadImage("assets/icons/idea.svg"),
        ensureShareFontsLoaded()
    ]);

    const canvas = document.createElement("canvas");
    canvas.width = SHARE_CARD_W;
    canvas.height = SHARE_CARD_H;

    const ctx = canvas.getContext("2d");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

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
    // Logo esagonale + "AE"
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

    ctx.font = "700 76px " + SHARE_FONT_BODY;
    ctx.fillStyle = logoGrad;
    ctx.fillText("AE", logoCx, logoCy + 6);

    // ==============================
    // Titolo
    // ==============================

    const titleGrad = ctx.createLinearGradient(0, 0, SHARE_CARD_W, 0);
    titleGrad.addColorStop(0, "#58E06D");
    titleGrad.addColorStop(1, "#00D4FF");

    ctx.font = "700 58px " + SHARE_FONT_TITLE;
    ctx.fillStyle = titleGrad;
    ctx.fillText("AE COMPANION", logoCx, 365);

    ctx.font = "700 26px " + SHARE_FONT_TITLE;
    ctx.fillStyle = "#9AA4B2";
    ctx.fillText("TRACK · PLAN · CONQUER", logoCx, 415);

    // ==============================
    // Nome giocatore
    // ==============================

    ctx.font = "700 54px " + SHARE_FONT_TITLE;
    ctx.fillStyle = "#F5F7FA";
    ctx.fillText(player.profile.name || "Player", logoCx, 510);

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

    ctx.font = "700 26px " + SHARE_FONT_TITLE;
    ctx.fillStyle = "#9AA4B2";
    ctx.fillText("TERRENI TOTALI", logoCx, 645);

    ctx.font = "700 124px " + SHARE_FONT_BODY;
    ctx.fillStyle = "#58E06D";
    ctx.fillText(formatK(totalLands), logoCx, 765);

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

        ctx.font = "700 40px " + SHARE_FONT_BODY;
        ctx.fillStyle = "#F5F7FA";
        ctx.fillText(stat.value, cx, statY + 150);

    });

    // ==============================
    // Rarità: nome + numero, per introdurre anche
    // chi non conosce ancora il funzionamento del gioco
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

        ctx.font = "700 17px " + SHARE_FONT_TITLE;
        ctx.fillStyle = r.color;
        ctx.fillText(r.name, cx, rarityY + 44);

        ctx.font = "700 40px " + SHARE_FONT_BODY;
        ctx.fillStyle = "#F5F7FA";
        ctx.fillText(formatK(r.value), cx, rarityY + 104);

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
        ctx.font = "700 " + fontSize + "px " + SHARE_FONT_BODY;
        let textWidth = ctx.measureText(feature.label).width;

        while (iconDiameter + gap + textWidth > maxFeatureWidth && fontSize > 22) {
            fontSize -= 2;
            ctx.font = "700 " + fontSize + "px " + SHARE_FONT_BODY;
            textWidth = ctx.measureText(feature.label).width;
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

        ctx.textAlign = "left";
        ctx.font = "700 " + row.fontSize + "px " + SHARE_FONT_BODY;
        ctx.fillStyle = "#F5F7FA";
        ctx.fillText(row.feature.label, textX, y + 2);
        ctx.textAlign = "center";

    });

    // ==============================
    // Footer / call to action
    // ==============================

    const footerY = featuresY + (features.length - 1) * featureRowH + 180;

    ctx.font = "400 30px " + SHARE_FONT_BODY;
    ctx.fillStyle = "#9AA4B2";
    ctx.fillText(t("shareCardCta"), logoCx, footerY);

    ctx.font = "700 38px " + SHARE_FONT_TITLE;
    ctx.fillStyle = "#58E06D";
    ctx.fillText("alex4ndrus94.github.io/-ae-companion", logoCx, footerY + 55);

    ctx.font = "400 24px " + SHARE_FONT_BODY;
    ctx.fillStyle = "#9AA4B2";
    ctx.fillText(t("shareCardFooter"), logoCx, footerY + 105);

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
