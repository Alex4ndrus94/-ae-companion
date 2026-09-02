// ======================================
// AE Companion - Card Condivisibile
// Genera un'immagine (Canvas, lato client, nessun
// server) con le statistiche del giocatore, pronta
// per essere condivisa su Instagram/WhatsApp/altrove.
// ======================================

const SHARE_CARD_W = 1080;
const SHARE_CARD_H = 1920;

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

function generateShareCardCanvas() {

    const canvas = document.createElement("canvas");
    canvas.width = SHARE_CARD_W;
    canvas.height = SHARE_CARD_H;

    const ctx = canvas.getContext("2d");

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

    // ==============================
    // Logo esagonale + "AE"
    // ==============================

    const logoCx = SHARE_CARD_W / 2;
    const logoCy = 210;

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

    ctx.font = "700 78px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = logoGrad;
    ctx.fillText("AE", logoCx, logoCy + 6);

    // ==============================
    // Titolo
    // ==============================

    const titleGrad = ctx.createLinearGradient(0, 0, SHARE_CARD_W, 0);
    titleGrad.addColorStop(0, "#58E06D");
    titleGrad.addColorStop(1, "#00D4FF");

    ctx.font = "700 64px Arial";
    ctx.fillStyle = titleGrad;
    ctx.fillText("AE COMPANION", logoCx, 350);

    ctx.font = "600 30px Arial";
    ctx.fillStyle = "#9AA4B2";
    ctx.fillText("TRACK · PLAN · CONQUER", logoCx, 400);

    // ==============================
    // Nome giocatore
    // ==============================

    ctx.font = "700 56px Arial";
    ctx.fillStyle = "#F5F7FA";
    ctx.fillText(player.profile.name || "Player", logoCx, 500);

    // ==============================
    // Box terreni totali (grande, centrale)
    // ==============================

    const totalLands = getTotalLands();

    drawRoundedRect(ctx, 140, 560, SHARE_CARD_W - 280, 280, 32);
    ctx.fillStyle = "#1A202A";
    ctx.fill();
    ctx.strokeStyle = "#313846";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "600 30px Arial";
    ctx.fillStyle = "#9AA4B2";
    ctx.fillText("TERRENI TOTALI", logoCx, 640);

    ctx.font = "700 130px Arial";
    ctx.fillStyle = "#58E06D";
    ctx.fillText(formatK(totalLands), logoCx, 760);

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

        drawRoundedRect(ctx, x, statY, statW, 200, 24);
        ctx.fillStyle = "#1A202A";
        ctx.fill();
        ctx.strokeStyle = "#313846";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = "600 22px Arial";
        ctx.fillStyle = "#9AA4B2";
        ctx.fillText(stat.label, x + statW / 2, statY + 60);

        ctx.font = "700 48px Arial";
        ctx.fillStyle = stat.color;
        ctx.fillText(stat.value, x + statW / 2, statY + 130);

    });

    // ==============================
    // Rarità (riga colorata)
    // ==============================

    const rarityY = 1160;
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

        ctx.font = "700 44px Arial";
        ctx.fillStyle = "#F5F7FA";
        ctx.fillText(formatK(r.label), x + rarityW / 2, rarityY + 78);

    });

    // ==============================
    // Footer / call to action
    // ==============================

    ctx.font = "600 32px Arial";
    ctx.fillStyle = "#9AA4B2";
    ctx.fillText(t("shareCardCta"), logoCx, 1720);

    ctx.font = "700 40px Arial";
    ctx.fillStyle = "#58E06D";
    ctx.fillText("alex4ndrus94.github.io/-ae-companion", logoCx, 1775);

    ctx.font = "500 26px Arial";
    ctx.fillStyle = "#9AA4B2";
    ctx.fillText(t("shareCardFooter"), logoCx, 1840);

    return canvas;

}

async function shareStatsCard() {

    const canvas = generateShareCardCanvas();

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
