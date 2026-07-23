// ======================================
// AE Companion - UI Engine
// ======================================

// Aggiorna un elemento tramite ID
function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}

// Aggiorna la larghezza della progress bar
function setWidth(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.style.width = value;
    }

}
