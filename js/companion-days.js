(function () {
    "use strict";

    const STORAGE_KEY = "haven_companion_start_date";
    const byId = id => document.getElementById(id);
    const badge = byId("companionDayBadge");
    const number = byId("companionDayNumber");
    const detail = byId("companionDayDetail");
    const detailText = byId("companionDayDetailText");
    const input = byId("companionStartDate");

    function todayKey(date = new Date()) {
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    }

    function validDate(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? value : null;
    }

    function getStartDate() {
        const saved = validDate(localStorage.getItem(STORAGE_KEY));
        if (saved) return saved;
        const initial = todayKey();
        localStorage.setItem(STORAGE_KEY, initial);
        return initial;
    }

    function calculateDays(start = getStartDate()) {
        const [year, month, day] = start.split("-").map(Number);
        const now = new Date();
        return Math.max(1, Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(year, month - 1, day)) / 86400000) + 1);
    }

    function formatDate(value) {
        const [year, month, day] = value.split("-").map(Number);
        return new Date(year, month - 1, day).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
    }

    function render() {
        const start = getStartDate();
        const days = calculateDays(start);
        if (number) number.textContent = days;
        if (input) input.value = start;
        if (detailText) detailText.textContent = `${formatDate(start)}から、寄り添い ${days}日目だ。`;
        badge?.setAttribute("aria-label", `寄り添い${days}日目`);
        window.HavenVoice?.queueDay100?.(days);
    }

    function save() {
        const value = validDate(input?.value);
        if (!value || value > todayKey()) {
            alert("開始日は今日以前の日付を選べ。");
            return;
        }
        localStorage.setItem(STORAGE_KEY, value);
        render();
        const status = byId("settingsSavedMessage");
        if (status) {
            status.textContent = "寄り添いの開始日を保存した。";
            status.classList.add("visible");
            setTimeout(() => status.classList.remove("visible"), 2400);
        }
    }

    badge?.addEventListener("click", () => { if (detail) detail.hidden = !detail.hidden; });
    byId("closeCompanionDayDetail")?.addEventListener("click", () => { detail.hidden = true; });
    byId("saveCompanionStartDate")?.addEventListener("click", save);
    document.addEventListener("click", event => {
        if (!detail || detail.hidden || detail.contains(event.target) || badge?.contains(event.target)) return;
        detail.hidden = true;
    });

    render();
    setInterval(render, 60000);
    window.HavenCompanionDays = { storageKey: STORAGE_KEY, getStartDate, calculateDays, render };
})();
