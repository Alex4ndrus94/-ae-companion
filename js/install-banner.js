// ======================================
// AE Companion - Banner "Aggiungi alla Home"
// ======================================

const INSTALL_DISMISS_KEY = "aeInstallBannerDismissed";

let deferredInstallPrompt = null;

function isStandalone() {

    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );

}

function isIOS() {

    return /iphone|ipad|ipod/i.test(navigator.userAgent);

}

function dismissInstallBanner() {

    localStorage.setItem(INSTALL_DISMISS_KEY, "1");

    const banner = document.getElementById("install-banner");

    if (banner) banner.classList.remove("show");

}

function showInstallBanner(mode) {

    const banner = document.getElementById("install-banner");
    const text = document.getElementById("install-banner-text");
    const actionBtn = document.getElementById("install-banner-action");

    if (!banner) return;

    if (mode === "ios") {

        text.textContent = "Aggiungi AE Companion alla Home: tocca Condividi (□↑) e poi \"Aggiungi a Home\"";
        actionBtn.style.display = "none";

    } else {

        text.textContent = "Installa AE Companion sul tuo dispositivo per un accesso più rapido";
        actionBtn.style.display = "block";

        actionBtn.onclick = function () {

            if (!deferredInstallPrompt) return;

            deferredInstallPrompt.prompt();

            deferredInstallPrompt.userChoice.finally(function () {
                deferredInstallPrompt = null;
                dismissInstallBanner();
            });

        };

    }

    banner.classList.add("show");

}

window.addEventListener("DOMContentLoaded", function () {

    if (isStandalone()) return;

    if (localStorage.getItem(INSTALL_DISMISS_KEY)) return;

    if (isIOS()) {

        showInstallBanner("ios");

    }

});

// Android / Chrome: intercetta l'evento nativo di installazione
window.addEventListener("beforeinstallprompt", function (e) {

    e.preventDefault();

    deferredInstallPrompt = e;

    if (isStandalone()) return;

    if (localStorage.getItem(INSTALL_DISMISS_KEY)) return;

    showInstallBanner("android");

});
