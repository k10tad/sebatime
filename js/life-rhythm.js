//========================
// Haven Life Rhythm Store
// 一日の過ごし方を、後続の生活・約束・週間記録機能で共有する
//========================
(function () {
    "use strict";

    const STORAGE_KEY = "havenLifeRhythmV1";
    const SCHEMA_VERSION = 1;
    const DAY_BOUNDARY_HOUR = 5;
    const MAX_DAYS = 120;
    const MAX_EVENTS_PER_DAY = 80;
    const ACTIVE_FLUSH_MS = 15000;
    const ARRIVAL_GAP_MS = 5 * 60 * 1000;

    let state = loadState();
    let activeSince = document.hidden ? null : Date.now();
    let hiddenAt = null;
    let currentPage = getCurrentPage();

    function iso(value = Date.now()) {
        return new Date(value).toISOString();
    }

    function logicalDate(value = Date.now()) {
        const date = new Date(value);
        date.setHours(date.getHours() - DAY_BOUNDARY_HOUR);
        return date;
    }

    function dayKey(value = Date.now()) {
        const date = logicalDate(value);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function emptyState() {
        const now = iso();
        return {
            schemaVersion: SCHEMA_VERSION,
            createdAt: now,
            updatedAt: now,
            lastOpenedAt: null,
            lastSeenAt: null,
            lastClosedAt: null,
            days: {}
        };
    }

    function loadState() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!parsed || typeof parsed !== "object") return emptyState();
            return {
                ...emptyState(),
                ...parsed,
                schemaVersion: SCHEMA_VERSION,
                days: parsed.days && typeof parsed.days === "object" ? parsed.days : {}
            };
        } catch (_) {
            return emptyState();
        }
    }

    function createDay(key) {
        return {
            date: key,
            firstOpenedAt: null,
            lastOpenedAt: null,
            launches: 0,
            arrivals: [],
            activeSeconds: 0,
            pageSeconds: {
                home: 0,
                sleep: 0,
                settings: 0
            },
            workSeconds: 0,
            breakSeconds: 0,
            sleepSeconds: 0,
            sleepStarts: [],
            calls: 0,
            quietSeconds: 0,
            promise: null,
            weeklyReviewShownAt: null,
            events: []
        };
    }

    function ensureDay(value = Date.now()) {
        const key = dayKey(value);
        if (!state.days[key]) state.days[key] = createDay(key);

        const day = state.days[key];
        day.pageSeconds = {
            home: 0,
            sleep: 0,
            settings: 0,
            ...(day.pageSeconds || {})
        };
        day.arrivals = Array.isArray(day.arrivals) ? day.arrivals : [];
        day.sleepStarts = Array.isArray(day.sleepStarts) ? day.sleepStarts : [];
        day.sleepSeconds = Math.max(0, Number(day.sleepSeconds) || 0);
        day.events = Array.isArray(day.events) ? day.events : [];
        return day;
    }

    function trimDays() {
        const keys = Object.keys(state.days).sort();
        keys.slice(0, Math.max(0, keys.length - MAX_DAYS)).forEach(key => {
            delete state.days[key];
        });
    }

    function saveState(now = Date.now()) {
        state.updatedAt = iso(now);
        state.lastSeenAt = iso(now);
        trimDays();
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn("Haven life rhythm could not be saved.", error);
        }
    }

    function getCurrentPage() {
        return document.body.dataset.havenPage ||
            document.querySelector(".app-page.active")?.dataset.page ||
            "home";
    }

    function addArrival(at, source, awaySeconds = 0) {
        const day = ensureDay(at);
        const previous = day.arrivals[day.arrivals.length - 1];
        if (previous && at - Date.parse(previous.at) < 60000) return;

        day.arrivals.push({
            at: iso(at),
            source,
            awaySeconds: Math.max(0, Math.round(Number(awaySeconds) || 0))
        });
        day.arrivals = day.arrivals.slice(-24);
    }

    function syncSessionTotals(value = Date.now()) {
        const day = ensureDay(value);
        const sessionDate = localStorage.getItem("havenSessionDate");
        const calendarDate = new Date(value);
        const calendarKey = [
            calendarDate.getFullYear(),
            String(calendarDate.getMonth() + 1).padStart(2, "0"),
            String(calendarDate.getDate()).padStart(2, "0")
        ].join("-");

        if (sessionDate !== calendarKey) return;
        day.workSeconds = Math.max(day.workSeconds || 0, Number(localStorage.getItem("havenWorkSeconds")) || 0);
        day.breakSeconds = Math.max(day.breakSeconds || 0, Number(localStorage.getItem("havenBreakSeconds")) || 0);
    }

    function flushActive(now = Date.now()) {
        if (activeSince == null) {
            syncSessionTotals(now);
            saveState(now);
            return;
        }

        const elapsed = Math.max(0, Math.min((now - activeSince) / 1000, ACTIVE_FLUSH_MS / 1000 + 2));
        if (elapsed > 0) {
            const day = ensureDay(now);
            day.activeSeconds = Math.round((day.activeSeconds || 0) + elapsed);
            const page = currentPage || "home";
            day.pageSeconds[page] = Math.round((day.pageSeconds[page] || 0) + elapsed);
        }

        activeSince = now;
        syncSessionTotals(now);
        saveState(now);
    }

    function recordEvent(type, detail = {}, value = Date.now()) {
        const day = ensureDay(value);
        day.events.push({
            type: String(type || "note"),
            at: iso(value),
            detail: detail && typeof detail === "object" ? detail : { value: detail }
        });
        day.events = day.events.slice(-MAX_EVENTS_PER_DAY);
        saveState(value);
    }

    function increment(field, amount = 1, value = Date.now()) {
        const day = ensureDay(value);
        day[field] = Math.max(0, Number(day[field]) || 0) + (Number(amount) || 0);
        saveState(value);
        return day[field];
    }

    function setDayValue(field, value, at = Date.now()) {
        const day = ensureDay(at);
        day[field] = value;
        saveState(at);
        return value;
    }

    function recordSleepStart(value = Date.now()) {
        const day = ensureDay(value);
        const timestamp = iso(value);
        const previous = day.sleepStarts[day.sleepStarts.length - 1];
        if (!previous || value - Date.parse(previous) > 60000) {
            day.sleepStarts.push(timestamp);
            day.sleepStarts = day.sleepStarts.slice(-6);
            recordEvent("sleep-start", {}, value);
        }
    }

    function getDay(key = dayKey()) {
        const day = state.days[key];
        return day ? structuredCloneSafe(day) : null;
    }

    function getRecentDays(count = 7, before = Date.now()) {
        const endKey = dayKey(before);
        return Object.keys(state.days)
            .filter(key => key <= endKey)
            .sort()
            .slice(-Math.max(1, Number(count) || 7))
            .map(key => structuredCloneSafe(state.days[key]));
    }

    function structuredCloneSafe(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function recordLaunch() {
        const now = Date.now();
        const day = ensureDay(now);
        const previousSeen = state.lastSeenAt ? Date.parse(state.lastSeenAt) : NaN;
        const awaySeconds = Number.isFinite(previousSeen) ? Math.max(0, (now - previousSeen) / 1000) : 0;

        day.launches = (Number(day.launches) || 0) + 1;
        day.firstOpenedAt ||= iso(now);
        day.lastOpenedAt = iso(now);
        state.lastOpenedAt = iso(now);
        addArrival(now, "launch", awaySeconds);
        syncSessionTotals(now);
        recordEvent("launch", { awaySeconds: Math.round(awaySeconds) }, now);
    }

    recordLaunch();

    const pageObserver = new MutationObserver(function () {
        const nextPage = getCurrentPage();
        if (nextPage === currentPage) return;
        flushActive();
        currentPage = nextPage;
    });
    pageObserver.observe(document.body, { attributes: true, attributeFilter: ["data-haven-page"] });

    document.getElementById("sleepStart")?.addEventListener("click", function () {
        recordSleepStart();
    });

    // sleep.js が記録を消す前に開始時刻を確保し、日ごとの睡眠時間へ加算する。
    document.getElementById("sleepStop")?.addEventListener("click", function () {
        const startedAt = Number(localStorage.getItem("sleepStartTime"));
        if (!Number.isFinite(startedAt) || startedAt <= 0) return;
        const seconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
        if (seconds < 1) return;
        increment("sleepSeconds", seconds);
        recordEvent("sleep-complete", { seconds });
    }, true);

    document.getElementById("callSebas")?.addEventListener("click", function () {
        increment("calls");
        recordEvent("call-sebas");
    });

    document.addEventListener("visibilitychange", function () {
        const now = Date.now();
        if (document.hidden) {
            flushActive(now);
            activeSince = null;
            hiddenAt = now;
            state.lastClosedAt = iso(now);
            saveState(now);
            return;
        }

        const awayMs = hiddenAt ? now - hiddenAt : 0;
        if (awayMs >= ARRIVAL_GAP_MS) addArrival(now, "resume", awayMs / 1000);
        activeSince = now;
        hiddenAt = null;
        saveState(now);
    });

    window.addEventListener("pagehide", function () {
        const now = Date.now();
        flushActive(now);
        state.lastClosedAt = iso(now);
        saveState(now);
    });

    const heartbeat = window.setInterval(function () {
        if (!document.hidden) flushActive();
    }, ACTIVE_FLUSH_MS);

    window.addEventListener("beforeunload", function () {
        window.clearInterval(heartbeat);
        flushActive();
    });

    window.HavenLifeRhythm = {
        storageKey: STORAGE_KEY,
        schemaVersion: SCHEMA_VERSION,
        dayBoundaryHour: DAY_BOUNDARY_HOUR,
        dayKey,
        getState: () => structuredCloneSafe(state),
        getDay,
        getRecentDays,
        recordEvent,
        increment,
        setDayValue,
        recordSleepStart,
        flush: flushActive
    };
})();
