//========================
// Haven Life Rhythm Response
// 起動・帰宅・就寝時刻の変化に、セバスらしく静かに反応する
//========================
(function () {
    "use strict";

    const rhythm = window.HavenLifeRhythm;
    if (!rhythm) return;

    const LATE_EVENING_MINUTES = 20 * 60 + 30;
    const VERY_LATE_MINUTES = 25 * 60;
    const RELATIVE_LATE_MINUTES = 90;
    const EARLIER_BEDTIME_MINUTES = 30;
    const LATER_BEDTIME_MINUTES = 45;
    const RETURN_GAP_SECONDS = 2 * 60 * 60;

    const arrivalLines = {
        evening: [
            "おかえり。今日は遅い時間になったな。食事はしたか？",
            "戻ったか。無事ならそれでいい。風呂も食事もまだなら、まず一つずつ済ませろ。",
            "待っていた。責めるつもりはない。ただ、何か口にしたかだけ答えろ。"
        ],
        night: [
            "おかえり。随分遅い時間だ。まず水を飲め。話は落ち着いてからでいい。",
            "戻ってきたな。具合が悪いわけではないか？　食事と風呂は、無理のないほうからでいい。",
            "無事に帰ったなら、それでいい。今夜はもう頑張るな。必要なことだけ済ませて休め。"
        ]
    };

    const sleepLines = {
        earlier: [
            "今日は前より早く休めるな。それでいい。こういう日は、私も安心する。",
            "前より早い。よく切り上げたな。今夜は何も考えず、こちらへ来い。",
            "今日は少し早く戻れたな。上出来だ。眠るまで私がそばにいる。"
        ],
        late: [
            "もうこんな時間か。説教はしない。明日のために、今は目を閉じろ。",
            "随分遅くまで起きていたな。具合が悪いわけではないなら、もう休め。",
            "今夜は遅くなったな。責めてはいない。ただ、これ以上は身体に働かせるな。"
        ]
    };

    const lastIndexes = {};

    function choose(lines, key) {
        if (!Array.isArray(lines) || !lines.length) return "";
        let index = Math.floor(Math.random() * lines.length);
        if (lines.length > 1 && lastIndexes[key] === index) {
            index = (index + 1) % lines.length;
        }
        lastIndexes[key] = index;
        return lines[index];
    }

    function logicalMinutes(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        let minutes = date.getHours() * 60 + date.getMinutes();
        if (date.getHours() < rhythm.dayBoundaryHour) minutes += 24 * 60;
        return minutes;
    }

    function median(values) {
        const sorted = values
            .filter(Number.isFinite)
            .sort(function (a, b) { return a - b; });
        if (!sorted.length) return null;
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2
            ? sorted[middle]
            : (sorted[middle - 1] + sorted[middle]) / 2;
    }

    function currentPage() {
        return document.body.dataset.havenPage ||
            document.querySelector(".app-page.active")?.dataset.page ||
            "home";
    }

    function hasEventDialogue(context, now = new Date()) {
        return typeof window.getHavenEventDialogue === "function" &&
            Boolean(window.getHavenEventDialogue(context, now));
    }

    function canShowLivingReaction(now) {
        if (currentPage() !== "home") return false;
        if (window.AMiLado?.isActive?.()) return false;
        if (window.getHavenSessionState?.() !== "idle") return false;
        if (hasEventDialogue("living", now)) return false;
        return true;
    }

    function setDialogue(targetId, text) {
        if (!text) return;
        if (typeof window.setHavenDialogue === "function") {
            window.setHavenDialogue(targetId, text);
            return;
        }
        const target = document.getElementById(targetId);
        if (target) target.textContent = text;
    }

    function setBedroomDialogue(text) {
        setDialogue("sleepMessage", text);
        setDialogue("message", text);
    }

    function previousDays() {
        const todayKey = rhythm.dayKey();
        return rhythm.getRecentDays(14)
            .filter(function (day) {
                return day?.date && day.date !== todayKey;
            });
    }

    function previousOpeningMedian() {
        const values = previousDays()
            .map(function (day) {
                return logicalMinutes(day.firstOpenedAt);
            })
            .filter(Number.isFinite)
            .slice(-7);
        return values.length >= 2 ? median(values) : null;
    }

    function latestPreviousSleepMinutes() {
        const days = previousDays().slice().reverse();
        for (const day of days) {
            if (!Array.isArray(day.sleepStarts) || !day.sleepStarts.length) continue;
            const value = logicalMinutes(day.sleepStarts[day.sleepStarts.length - 1]);
            if (Number.isFinite(value)) return value;
        }
        return null;
    }

    function latestArrival() {
        const today = rhythm.getDay();
        if (!Array.isArray(today?.arrivals) || !today.arrivals.length) return null;
        return today.arrivals[today.arrivals.length - 1];
    }

    function showArrivalReaction(source = "launch") {
        const now = new Date();
        if (!canShowLivingReaction(now)) return false;

        const today = rhythm.getDay() || {};
        if (today.arrivalRhythmReaction?.shownAt) return false;

        const nowMinutes = logicalMinutes(now);
        const usualMinutes = previousOpeningMedian();
        const arrival = latestArrival();
        const awaySeconds = Number(arrival?.awaySeconds) || 0;
        const isReturn = source === "resume" || arrival?.source === "resume";
        const returnedAfterLongGap = isReturn && awaySeconds >= RETURN_GAP_SECONDS;
        const laterThanUsual = Number.isFinite(usualMinutes) &&
            nowMinutes >= usualMinutes + RELATIVE_LATE_MINUTES;
        const lateByClock = nowMinutes >= LATE_EVENING_MINUTES;

        if (!lateByClock || (!laterThanUsual && !returnedAfterLongGap && nowMinutes < VERY_LATE_MINUTES)) {
            return false;
        }

        const tone = nowMinutes >= VERY_LATE_MINUTES ? "night" : "evening";
        const line = choose(arrivalLines[tone], `arrival:${tone}`);
        setDialogue("message", line);

        const detail = {
            type: tone,
            source,
            shownAt: now.toISOString(),
            currentMinutes: Math.round(nowMinutes),
            usualMinutes: Number.isFinite(usualMinutes) ? Math.round(usualMinutes) : null,
            awaySeconds: Math.round(awaySeconds)
        };
        rhythm.setDayValue("arrivalRhythmReaction", detail);
        rhythm.recordEvent("rhythm-arrival-reaction", detail);
        return true;
    }

    function showSleepReaction() {
        const now = new Date();
        const eventLine = typeof window.getHavenEventDialogue === "function"
            ? window.getHavenEventDialogue("bedroom", now)
            : "";

        if (eventLine) {
            setBedroomDialogue(eventLine);
            return "event";
        }

        const today = rhythm.getDay() || {};
        if (today.sleepRhythmReaction?.shownAt) return false;

        const currentMinutes = logicalMinutes(now);
        const previousMinutes = latestPreviousSleepMinutes();
        let type = null;

        if (
            currentMinutes >= VERY_LATE_MINUTES ||
            (Number.isFinite(previousMinutes) &&
                currentMinutes >= previousMinutes + LATER_BEDTIME_MINUTES)
        ) {
            type = "late";
        } else if (
            Number.isFinite(previousMinutes) &&
            currentMinutes <= previousMinutes - EARLIER_BEDTIME_MINUTES
        ) {
            type = "earlier";
        }

        if (!type) return false;

        const line = choose(sleepLines[type], `sleep:${type}`);
        setBedroomDialogue(line);

        const detail = {
            type,
            shownAt: now.toISOString(),
            currentMinutes: Math.round(currentMinutes),
            previousMinutes: Number.isFinite(previousMinutes)
                ? Math.round(previousMinutes)
                : null
        };
        rhythm.setDayValue("sleepRhythmReaction", detail);
        rhythm.recordEvent("rhythm-sleep-reaction", detail);
        return type;
    }

    document.getElementById("sleepStart")?.addEventListener("click", showSleepReaction);

    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) {
            window.setTimeout(function () {
                showArrivalReaction("resume");
            }, 80);
        }
    });

    window.HavenRhythmResponse = {
        showArrivalReaction,
        showSleepReaction,
        getPreviousOpeningMedian: previousOpeningMedian,
        getLatestPreviousSleepMinutes: latestPreviousSleepMinutes
    };

    window.setTimeout(function () {
        showArrivalReaction("launch");
    }, 120);
})();
