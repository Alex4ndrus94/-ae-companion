// ======================================
// AE Companion - Card Condivisibile
// Genera un'immagine (Canvas, lato client, nessun
// server) con le statistiche del giocatore, pronta
// per essere condivisa su Instagram/WhatsApp/altrove.
// Usa gli stessi font e colori del sito (Orbitron per
// titoli/etichette, Inter per nomi/numeri) per dare
// identità visiva coerente alla card.
// ======================================

const SHARE_CARD_W = 1080;
const SHARE_CARD_H = 1920;

const FONT_TITLE = "Orbitron";
const FONT_BODY = "Inter";

async function ensureShareFontsLoaded() {

    if (!document.fonts) return;

    try {

        await Promise.all([
            document.fonts.load('700 40px "' + FONT_TITLE + '"'),
            document.fonts.load('600 40px "' + FONT_TITLE + '"'),
            document.fonts.load('700 40px "' + FONT_BODY + '"'),
            document.fonts.load('600 40px "' + FONT_BODY + '"'),
            document.fonts.load('500 40px "' + FONT_BODY + '"')
        ]);

        await document.fonts.ready;

    } catch (e) {
        // se il caricamento fallisce, il canvas userà il font di sistema di riserva
    }

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

// Piccolo esagono decorativo (solo contorno), stessa lingua
// visiva delle icone del sito, usato come accento sopra le stat
function drawAccentHex(ctx, cx, cy, r, color) {

    drawHexagon(ctx, cx, cy, r);
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.stroke();

}

async function generateShareCardCanvas() {

    await ensureShareFontsLoaded();

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

    ctx.font = "700 76px " + FONT_BODY;
    ctx.fillStyle = logoGrad;
    ctx.fillText("AE", logoCx, logoCy + 6);

    // ==============================
    // Titolo (Orbitron, come h1 nel sito)
    // ==============================

    const titleGrad = ctx.createLinearGradient(0, 0, SHARE_CARD_W, 0);
    titleGrad.addColorStop(0, "#58E06D");
    titleGrad.addColorStop(1, "#00D4FF");

    ctx.font = "700 58px " + FONT_TITLE;
    ctx.fillStyle = titleGrad;
    ctx.fillText("AE COMPANION", logoCx, 365);

    ctx.font = "600 26px " + FONT_TITLE;
    ctx.fillStyle = "#9AA4B2";
    ctx.fillText("TRACK · PLAN · CONQUER", logoCx, 415);

    // ==============================
    // Nome giocatore (Inter, come nella card player)
    // ==============================

    ctx.font = "700 54px " + FONT_BODY;
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

    ctx.font = "600 26px " + FONT_TITLE;
    ctx.fillStyle = "#9AA4B2";
    ctx.fillText("TERRENI TOTALI", logoCx, 645);

    ctx.font = "700 124px " + FONT_BODY;
    ctx.fillStyle = "#58E06D";
    ctx.fillText(formatK(totalLands), logoCx, 765);

    // ==============================
    // Riga statistiche (boost, rendita, badge)
    // ==============================

    const boostMultiplier = getBoostMultiplier();
    const dailyIncome = formatCurrency(getDailyIncomeConverted());
    const badgePercent = getBadgeBoostPercent(player.badges);

    const statY = 900;
    const statW = (SHARE_CARD_W - 280 - 40) / 3;

    const stats = [
        { label: "BOOST", value: "x" + boostMultiplier, color: "#58E06D" },
        { label: "RENDITA/GIORNO", value: dailyIncome, color: "#00D4FF" },
        { label: "PASSAPORTO", value: "+" + badgePercent + "%", color: "#FFB322" }
    ];

    stats.forEach(function (stat, i) {

        const x = 140 + i * (statW + 20);
        const cx = x + statW / 2;

        drawRoundedRect(ctx, x, statY, statW, 210, 24);
        ctx.fillStyle = "#1A202A";
        ctx.fill();
        ctx.strokeStyle = "#313846";
        ctx.lineWidth = 2;
        ctx.stroke();

        drawAccentHex(ctx, cx, statY + 44, 20, stat.color);

        ctx.font = "600 20px " + FONT_TITLE;
        ctx.fillStyle = "#9AA4B2";
        ctx.fillText(stat.label, cx, statY + 100);

        ctx.font = "700 46px " + FONT_BODY;
        ctx.fillStyle = stat.color;
        ctx.fillText(stat.value, cx, statY + 165);

    });

    // ==============================
    // Rarità (riga colorata, come le rarity-card nel sito)
    // ==============================

    const rarityY = 1170;
    const rarities = [
        { label: player.lands.common, color: "#9AA4B2" },
        { label: player.lands.rare, color: "#3A86FF" },
        { label: player.lands.epic, color: "#9B5CFF" },
        { label: player.lands.legendary, color: "#FFB322" }
    ];

    const rarityW = (SHARE_CARD_W - 280 - 60) / 4;

    rarities.forEach(function (r, i) {

        const x = 140 + i * (rarityW + 20);

        drawRoundedRect(ctx, x, rarityY, rarityW, 130, 20);
        ctx.fillStyle = "#1A202A";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = r.color;
        ctx.stroke();

        ctx.font = "700 42px " + FONT_BODY;
        ctx.fillStyle = "#F5F7FA";
        ctx.fillText(formatK(r.label), x + rarityW / 2, rarityY + 78);

    });

    // ==============================
    // Footer / call to action
    // ==============================

    ctx.font = "500 30px " + FONT_BODY;
    ctx.fillStyle = "#9AA4B2";
    ctx.fillText(t("shareCardCta"), logoCx, 1730);

    ctx.font = "700 38px " + FONT_TITLE;
    ctx.fillStyle = "#58E06D";
    ctx.fillText("alex4ndrus94.github.io/-ae-companion", logoCx, 1785);

    ctx.font = "500 24px " + FONT_BODY;
    ctx.fillStyle = "#9AA4B2";
    ctx.fillText(t("shareCardFooter"), logoCx, 1845);

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
