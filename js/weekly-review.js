//========================
// Haven Weekly Review
// 日曜の夜に一週間を振り返り、Vestigioへ一度だけ残す
//========================
(function () {
    "use strict";

    const rhythm = window.HavenLifeRhythm;
    if (!rhythm) return;

    const STORAGE_KEY = "havenWeeklyReviewV1";
    const REVIEW_DAY = 0;
    const REVIEW_HOUR = 19;
    const OPEN_DELAY_MS = 2200;

    let overlay = null;
    let openTimer = null;
    let saving = false;

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function dateKey(value) {
        const date = new Date(value);
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function startOfWeek(value = new Date()) {
        const date = new Date(value);
        date.setHours(12, 0, 0, 0);
        const mondayOffset = date.getDay() === 0 ? -6 : 1 - date.getDay();
        date.setDate(date.getDate() + mondayOffset);
        return date;
    }

    function endOfWeek(value = new Date()) {
        const date = startOfWeek(value);
        date.setDate(date.getDate() + 6);
        return date;
    }

    function weekId(value = new Date()) {
        return dateKey(startOfWeek(value));
    }

    function loadReviewState() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (_) {
            return {};
        }
    }

    function saveReviewState(next) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }

    function isReviewTime(value = new Date()) {
        const date = new Date(value);
        return date.getDay() === REVIEW_DAY && date.getHours() >= REVIEW_HOUR;
    }

    function canShow(value = new Date()) {
        if (!isReviewTime(value) || document.hidden) return false;
        if (document.body.classList.contains("splash-active")) return false;
        if (document.body.classList.contains("haven-promise-open")) return false;
        if (window.AMiLado?.isActive?.()) return false;
        return loadReviewState().lastShownWeek !== weekId(value);
    }

    function weekDays(value = new Date()) {
        const start = startOfWeek(value);
        const end = endOfWeek(value);
        const state = rhythm.getState();
        return Object.keys(state.days || {})
            .filter(key => key >= dateKey(start) && key <= dateKey(end))
            .sort()
            .map(key => state.days[key]);
    }

    function sum(days, field) {
        return days.reduce((total, day) => total + (Number(day?.[field]) || 0), 0);
    }

    function formatDuration(seconds, compact = false) {
        const totalMinutes = Math.max(0, Math.round((Number(seconds) || 0) / 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (!hours) return `${minutes}分`;
        if (!minutes || compact) return `${hours}時間${minutes ? `${minutes}分` : ""}`;
        return `${hours}時間${minutes}分`;
    }

    function collect(value = new Date()) {
        rhythm.flush();
        const days = weekDays(value);
        const promises = days.map(day => day.promise).filter(Boolean);
        const promised = promises.filter(item => item.status === "pending" || item.status === "fulfilled").length;
        const fulfilled = promises.filter(item => item.status === "fulfilled").length;
        return {
            week: weekId(value),
            start: startOfWeek(value),
            end: endOfWeek(value),
            activeDays: days.filter(day =>
                (Number(day.launches) || 0) > 0 || (Number(day.activeSeconds) || 0) > 0
            ).length,
            launches: sum(days, "launches"),
            activeSeconds: sum(days, "activeSeconds"),
            workSeconds: sum(days, "workSeconds"),
            breakSeconds: sum(days, "breakSeconds"),
            sleepSeconds: sum(days, "sleepSeconds"),
            sleepSessions: days.reduce((total, day) =>
                total + (Array.isArray(day.sleepStarts) ? day.sleepStarts.length : 0), 0),
            calls: sum(days, "calls"),
            quietSeconds: sum(days, "quietSeconds"),
            promised,
            fulfilled
        };
    }

    function sebasComment(summary) {
        const lines = [];
        if (summary.activeDays >= 6) {
            lines.push("今週も、よく戻ってきた。お前の気配が途切れない一週間だった。");
        } else if (summary.activeDays >= 3) {
            lines.push("忙しい中でも、何度かここへ戻ってきたな。それで十分だ。");
        } else {
            lines.push("姿を見せない日が多かった。責めてはいない。ただ、少し心配はした。");
        }

        if (summary.workSeconds >= 15 * 3600) {
            lines.push("働きすぎだ。成果より先に、お前自身を摩耗させるな。");
        } else if (summary.workSeconds >= 5 * 3600) {
            lines.push("積み重ねた時間は、きちんと残っている。よくやった。");
        } else if (summary.workSeconds > 0) {
            lines.push("短くても集中した時間は無駄にならない。来週も、お前のペースでいい。");
        }

        if (summary.sleepSessions >= 1 && summary.sleepSeconds > 0 && summary.sleepSeconds / summary.sleepSessions < 5 * 3600) {
            lines.push("睡眠はまだ足りない。今夜くらいは、私の言うことを聞いて休め。");
        } else if (summary.sleepSessions >= 3) {
            lines.push("眠る時間を記録できたのはいい。身体は、後回しにする道具ではない。");
        }

        if (summary.promised > 0) {
            lines.push(summary.fulfilled === summary.promised
                ? "それから、交わした約束はすべて守った。……私は、そういうお前が好きだ。"
                : `交わした約束は${summary.promised}つ、そのうち${summary.fulfilled}つを守った。残りを責める気はない。次は一緒に守ろう。`);
        }
        return lines.slice(0, 3);
    }

    function metrics(summary) {
        const items = [
            ["ここへ来た日", `${summary.activeDays}日`],
            ["作業", formatDuration(summary.workSeconds, true)],
            ["休憩", formatDuration(summary.breakSeconds, true)],
            ["睡眠記録", `${summary.sleepSessions}回`]
        ];
        if (summary.sleepSeconds > 0) items[3][1] += ` · ${formatDuration(summary.sleepSeconds, true)}`;
        if (summary.quietSeconds > 0) items.push(["A Mi Lado", formatDuration(summary.quietSeconds, true)]);
        if (summary.calls > 0) items.push(["呼んだ回数", `${summary.calls}回`]);
        if (summary.promised > 0) items.push(["守った約束", `${summary.fulfilled}/${summary.promised}`]);
        return items;
    }

    function buildOverlay() {
        if (overlay) return overlay;
        document.body.insertAdjacentHTML("beforeend", `
            <div id="havenWeeklyOverlay" class="haven-weekly-overlay" hidden>
                <section class="haven-weekly-report" role="dialog" aria-modal="true" aria-labelledby="havenWeeklyTitle">
                    <button id="havenWeeklyClose" class="haven-weekly-close" type="button" aria-label="閉じる">×</button>
                    <p class="haven-weekly-kicker">SUNDAY · WEEKLY NOTE</p>
                    <h2 id="havenWeeklyTitle">今週のお前について</h2>
                    <p id="havenWeeklyRange" class="haven-weekly-range"></p>
                    <div id="havenWeeklyMetrics" class="haven-weekly-metrics"></div>
                    <div id="havenWeeklyComment" class="haven-weekly-comment"></div>
                    <p class="haven-weekly-signature">— Sebastián</p>
                </section>
            </div>
        `);
        overlay = document.getElementById("havenWeeklyOverlay");
        document.getElementById("havenWeeklyClose")?.addEventListener("click", close);
        overlay?.addEventListener("click", function (event) {
            if (event.target === overlay) close();
        });
        return overlay;
    }

    function rangeLabel(summary) {
        const start = summary.start;
        const end = summary.end;
        return `${start.getFullYear()}.${pad(start.getMonth() + 1)}.${pad(start.getDate())} — ${pad(end.getMonth() + 1)}.${pad(end.getDate())}`;
    }

    async function saveVestigio(summary, comments) {
        if (!window.HavenHuella?.importEntries) return;
        const body = [
            `ここへ来た日：${summary.activeDays}日`,
            `作業：${formatDuration(summary.workSeconds)}`,
            `休憩：${formatDuration(summary.breakSeconds)}`,
            `睡眠記録：${summary.sleepSessions}回${summary.sleepSeconds > 0 ? `（${formatDuration(summary.sleepSeconds)}）` : ""}`,
            summary.promised > 0 ? `守った約束：${summary.fulfilled}/${summary.promised}` : "",
            "",
            ...comments.map(line => `セバス：「${line}」`)
        ].filter(Boolean).join("\n");

        await window.HavenHuella.importEntries([{
            id: `haven-weekly-${summary.week}`,
            entryType: "diary",
            dateKey: dateKey(summary.end),
            title: "一週間の記録",
            time: "",
            body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            systemType: "weekly-review"
        }], { replace: false });
    }

    function markShown(summary) {
        const shownAt = new Date().toISOString();
        const state = loadReviewState();
        state.lastShownWeek = summary.week;
        state.lastShownAt = shownAt;
        saveReviewState(state);
        rhythm.setDayValue("weeklyReviewShownAt", shownAt);
        rhythm.recordEvent("weekly-review-shown", {
            week: summary.week,
            activeDays: summary.activeDays,
            workSeconds: summary.workSeconds,
            sleepSessions: summary.sleepSessions,
            promisesFulfilled: summary.fulfilled
        });
    }

    async function show(value = new Date(), force = false) {
        if (saving || (!force && !canShow(value))) return false;
        saving = true;
        const summary = collect(value);
        const comments = sebasComment(summary);
        buildOverlay();

        document.getElementById("havenWeeklyRange").textContent = rangeLabel(summary);
        const metricRoot = document.getElementById("havenWeeklyMetrics");
        metricRoot.replaceChildren();
        metrics(summary).forEach(function ([label, valueText]) {
            const item = document.createElement("div");
            const term = document.createElement("span");
            const value = document.createElement("strong");
            term.textContent = label;
            value.textContent = valueText;
            item.append(term, value);
            metricRoot.append(item);
        });

        const commentRoot = document.getElementById("havenWeeklyComment");
        commentRoot.replaceChildren();
        comments.forEach(function (line) {
            const paragraph = document.createElement("p");
            paragraph.textContent = line;
            commentRoot.append(paragraph);
        });

        markShown(summary);
        try {
            await saveVestigio(summary, comments);
        } catch (error) {
            console.warn("Weekly review could not be added to Vestigio.", error);
        }

        overlay.hidden = false;
        document.body.classList.add("haven-weekly-open");
        saving = false;
        return true;
    }

    function close() {
        if (overlay) overlay.hidden = true;
        document.body.classList.remove("haven-weekly-open");
    }

    function scheduleCheck(delay = OPEN_DELAY_MS) {
        window.clearTimeout(openTimer);
        openTimer = window.setTimeout(function () {
            if (!show()) {
                const state = loadReviewState();
                if (isReviewTime() && state.lastShownWeek !== weekId()) {
                    openTimer = window.setTimeout(() => show(), 1200);
                }
            }
        }, delay);
    }

    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) scheduleCheck(450);
    });

    window.HavenWeeklyReview = {
        show: () => show(new Date(), true),
        check: () => show(),
        collect,
        weekId,
        isReviewTime
    };

    scheduleCheck();
})();
