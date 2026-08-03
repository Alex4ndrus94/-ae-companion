// ======================================
// AE Companion - Navigazione a Tab
// ======================================

const TAB_KEY = "aeActiveTab";

function switchTab(tab) {

    document.querySelectorAll(".tab-view").forEach(function (view) {
        view.classList.toggle("active", view.id === "tab-" + tab);
    });

    document.querySelectorAll(".nav-btn").forEach(function (btn) {
        btn.classList.toggle("active", btn.getAttribute("data-tab") === tab);
    });

    localStorage.setItem(TAB_KEY, tab);

    window.scrollTo({ top: 0, behavior: "instant" });

}

window.addEventListener("DOMContentLoaded", function () {

    const saved = localStorage.getItem(TAB_KEY);

    if (saved && document.getElementById("tab-" + saved)) {
        switchTab(saved);
    }

});
