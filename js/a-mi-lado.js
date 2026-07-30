//========================
// A Mi Lado
// セバスの生活音だけをそばに置く、静かな同席モード
//========================
(function () {
    "use strict";

    const STORAGE_KEY = "havenAMiLadoV1";
    const MAX_RESTORE_MS = 6 * 60 * 60 * 1000;
    const MIN_SOUND_DELAY = 18 * 1000;
    const MAX_SOUND_DELAY = 46 * 1000;

    const callButton = document.getElementById("callSebas");
    const message = document.getElementById("message");
    const replyChoices = document.getElementById("companionReplyChoices");
    const endChoices = document.getElementById("aMiLadoEndChoices");
    const endButton = endChoices?.querySelector('[data-a-mi-lado-action="end"]');
    const stayButton = endChoices?.querySelector('[data-a-mi-lado-action="stay"]');

    let state = loadState();
    let soundTimer = null;
    let breathingAudio = null;
    const transientAudio = new Set();

    const SOUND_SCENES = {
        working: [
            { src: "sound/pen.mp3", volume: 0.34, weight: 0.48 },
            { src: "sound/coffe cup.mp3", volume: 0.42, weight: 0.24 },
            { src: "sound/page.mp3", volume: 0.28, weight: 0.12 },
            { src: "sound/tie.mp3", volume: 0.38, weight: 0.16 }
        ],
        reading: [
            { src: "sound/page.mp3", volume: 0.4, weight: 0.56 },
            { src: "sound/coffe cup.mp3", volume: 0.38, weight: 0.28 },
            { src: "sound/throat.mp3", volume: 0.36, weight: 0.16 }
        ],
        "after-shower": [
            { src: "sound/shower.mp3", volume: 0.46, weight: 0.32 },
            { src: "sound/bathtub.mp3", volume: 0.42, weight: 0.2 },
            { src: "sound/blanket.mp3", volume: 0.4, weight: 0.32 },
            { src: "sound/breath_idle.mp3", volume: 0.48, weight: 0.16 }
        ],
        drinking: [
            { src: "sound/glass.mp3", volume: 0.48, weight: 0.58 },
            { src: "sound/Wine.mp3", volume: 0.5, weight: 0.42 }
        ],
        "sofa-nap": [
            { src: "sound/blanket.mp3", volume: 0.32, weight: 0.7 },
            { src: "sound/sleep_breath.mp3", volume: 0.42, weight: 0.3 }
        ]
    };

    const COMMON_SOUNDS = [
        { src: "sound/breath_idle.mp3", volume: 0.38, weight: 0.82 },
        { src: "sound/coughing.mp3", volume: 0.3, weight: 0.18 }
    ];

    function defaultState() {
        return {
            active: false,
            startedAt: null,
            activityId: null,
            activityLabel: null
        };
    }

    function loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!saved || typeof saved !== "object") return defaultState();
            if (
                saved.active &&
                (!saved.startedAt || Date.now() - Date.parse(saved.startedAt) > MAX_RESTORE_MS)
            ) {
                return defaultState();
            }
            return { ...defaultState(), ...saved };
        } catch (_) {
            return defaultState();
        }
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn("A Mi Lado state could not be saved.", error);
        }
    }

    function currentPage() {
        return document.body.dataset.havenPage ||
            document.querySelector(".app-page.active")?.dataset.page ||
            "home";
    }

    function sessionIsIdle() {
        return !window.getHavenSessionState ||
            window.getHavenSessionState() === "idle";
    }

    function setMessage(text) {
        if (message) message.textContent = text;
    }

    function setReplyChoicesVisible(visible) {
        if (replyChoices) replyChoices.hidden = !visible;
    }

    function setEndChoicesVisible(visible) {
        if (endChoices) endChoices.hidden = !visible;
    }

    function render() {
        document.body.classList.toggle("a-mi-lado-mode", state.active);
        if (!callButton) return;

        callButton.classList.toggle("a-mi-lado-active", state.active);
        if (state.active) {
            callButton.innerHTML = "<span>A Mi Lado</span><small>そばにいる</small>";
            callButton.setAttribute("aria-label", "A Mi Ladoを確認");
        } else {
            callButton.textContent = "Sebas";
            callButton.setAttribute("aria-label", "Sebasを呼ぶ");
        }
    }

    function weightedPick(items) {
        const total = items.reduce(function (sum, item) {
            return sum + (Number(item.weight) || 0);
        }, 0);
        let roll = Math.random() * (total || 1);
        for (const item of items) {
            roll -= Number(item.weight) || 0;
            if (roll <= 0) return item;
        }
        return items[items.length - 1];
    }

    function playSound(sound) {
        if (!sound || !state.active || document.hidden) return;

        const audio = new Audio(sound.src);
        audio.preload = "auto";
        audio.volume = Math.max(0, Math.min(1, Number(sound.volume) || 0));
        transientAudio.add(audio);

        const release = function () {
            transientAudio.delete(audio);
        };
        audio.addEventListener("ended", release, { once: true });
        audio.addEventListener("error", release, { once: true });
        audio.play().catch(release);
    }

    function sceneSounds() {
        return SOUND_SCENES[state.activityId] || SOUND_SCENES.reading;
    }

    function scheduleNextSound(initial = false) {
        window.clearTimeout(soundTimer);
        if (!state.active) return;

        const delay = initial
            ? 900
            : MIN_SOUND_DELAY + Math.random() * (MAX_SOUND_DELAY - MIN_SOUND_DELAY);

        soundTimer = window.setTimeout(function () {
            if (!state.active) return;
            if (!document.hidden) {
                const useCommonSound = Math.random() < 0.2;
                playSound(weightedPick(useCommonSound ? COMMON_SOUNDS : sceneSounds()));
            }
            scheduleNextSound(false);
        }, delay);
    }

    function startSofaBreathing() {
        if (state.activityId !== "sofa-nap" || breathingAudio) return;
        breathingAudio = new Audio("sound/sleep_breath.mp3");
        breathingAudio.loop = true;
        breathingAudio.preload = "auto";
        breathingAudio.volume = 0.72;
        breathingAudio.play().catch(function () {
            breathingAudio = null;
        });
    }

    function startSounds() {
        stopSounds();
        startSofaBreathing();
        if (state.activityId !== "sofa-nap") {
            playSound(weightedPick(sceneSounds()));
        }
        scheduleNextSound(false);
    }

    function stopSounds() {
        window.clearTimeout(soundTimer);
        soundTimer = null;

        transientAudio.forEach(function (audio) {
            audio.pause();
            audio.currentTime = 0;
        });
        transientAudio.clear();

        if (breathingAudio) {
            breathingAudio.pause();
            breathingAudio.currentTime = 0;
            breathingAudio = null;
        }
    }

    function recordStart() {
        const rhythm = window.HavenLifeRhythm;
        if (!rhythm) return;
        rhythm.recordEvent("a-mi-lado-start", {
            activityId: state.activityId,
            activityLabel: state.activityLabel
        });
    }

    function recordStop(reason) {
        const rhythm = window.HavenLifeRhythm;
        if (!rhythm || !state.startedAt) return;

        const endedAt = Date.now();
        const startedAt = Date.parse(state.startedAt);
        const durationSeconds = Number.isFinite(startedAt)
            ? Math.max(0, Math.round((endedAt - startedAt) / 1000))
            : 0;
        const today = rhythm.getDay() || {};
        const sessions = Array.isArray(today.aMiLadoSessions)
            ? today.aMiLadoSessions.slice(-11)
            : [];

        sessions.push({
            startedAt: state.startedAt,
            endedAt: new Date(endedAt).toISOString(),
            durationSeconds,
            activityId: state.activityId,
            activityLabel: state.activityLabel,
            reason
        });

        rhythm.increment("quietSeconds", durationSeconds);
        rhythm.increment("aMiLadoSeconds", durationSeconds);
        rhythm.setDayValue("aMiLadoSessions", sessions);
        rhythm.recordEvent("a-mi-lado-end", {
            durationSeconds,
            activityId: state.activityId,
            reason
        });
    }

    function start() {
        if (state.active) return;
        setReplyChoicesVisible(false);
        setEndChoicesVisible(false);

        if (currentPage() !== "home") {
            setMessage("ここではない。リビングへ戻れ。");
            return;
        }
        if (!sessionIsIdle()) {
            setMessage("今は作業を区切れ。終えたら、そばにいる。");
            return;
        }

        const activity = window.HavenActivity?.getCurrent?.() || {
            id: "reading",
            label: "読書中"
        };
        state = {
            active: true,
            startedAt: new Date().toISOString(),
            activityId: activity.id,
            activityLabel: activity.label
        };
        saveState();
        render();
        recordStart();
        setMessage("分かった。何も話さなくていい。……こちらへ来い。");
        startSounds();
    }

    function requestEnd() {
        if (!state.active) return;
        setReplyChoicesVisible(false);
        setEndChoicesVisible(true);
        setMessage("もう行くのか。それとも、まだここにいるか。");
    }

    function stop(reason = "manual", options = {}) {
        if (!state.active) return;
        recordStop(reason);
        stopSounds();
        state = defaultState();
        saveState();
        setEndChoicesVisible(false);
        render();
        if (!options.silent) {
            setMessage("分かった。だが、必要ならまた呼べ。");
        }
    }

    function stay() {
        if (!state.active) return;
        setEndChoicesVisible(false);
        setMessage("そうか。なら、もう少しここにいろ。");
        startSounds();
    }

    function handlePageChange(pageName) {
        if (state.active && pageName !== "home") {
            stop("page-change", { silent: true });
        }
    }

    endButton?.addEventListener("click", function () {
        stop("manual");
    });

    stayButton?.addEventListener("click", stay);

    document.addEventListener("visibilitychange", function () {
        if (!state.active) return;
        if (document.hidden) {
            stopSounds();
        } else if (currentPage() === "home" && sessionIsIdle()) {
            startSounds();
        }
    });

    window.addEventListener("pagehide", saveState);

    window.AMiLado = {
        start,
        stop,
        requestEnd,
        handlePageChange,
        isActive: function () {
            return state.active;
        },
        getState: function () {
            return { ...state };
        }
    };

    if (state.active && currentPage() === "home" && sessionIsIdle()) {
        render();
        setMessage("……まだここにいる。");
    } else if (state.active) {
        stop("restore-conflict", { silent: true });
    } else {
        render();
    }
})();
