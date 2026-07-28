//========================
// Haven Audio Engine
// 音声はこのファイルだけが管理する
//========================

let audioMode = "idle"; // idle / work / break / sleep / alarm

const HAVEN_AUDIO_SETTINGS_KEY = "havenSettings";
const HAVEN_SLEEP_BREATH_GAIN = 5;
const HAVEN_HEARTBEAT_GAIN = 1.45;
const HAVEN_SLEEP_DEEP_BREATH_RATIO = 0.045;

const havenAudio = {
    workBgm: new Audio("music/bgm.mp3"),
    breakBgm: new Audio("music/break.mp3"),
    clock: new Audio("sound/clockloop2.mp3"),
    pen: new Audio("sound/pen.mp3"),
    page: new Audio("sound/page.mp3"),
    breath: new Audio("sound/breath_idle.mp3"),
    coffee: new Audio("sound/coffe.mp3"),
    cough: new Audio("sound/coughing.mp3"),
    step: new Audio("sound/step.mp3"),
    sleepBreath: new Audio("sound/sleep_breath.mp3"),
    heartbeat: new Audio("sound/heartbeat.mp3"),
    alarm: new Audio("sound/alarm.mp3")
};

havenAudio.workBgm.loop = true;
havenAudio.breakBgm.loop = true;
havenAudio.clock.loop = true;
havenAudio.sleepBreath.loop = true;
havenAudio.heartbeat.loop = true;
havenAudio.alarm.loop = true;

Object.values(havenAudio).forEach(function (audio) {
    audio.preload = "auto";
});

let audioUnlocked = false;
let desiredAudioMode = "idle";
let bedroomAmbienceActive = false;
let havenAudioContext = null;
let audioGraphAttempted = false;
const havenGainNodes = new WeakMap();
let deskTimer = null;
let humanTimer = null;
let coffeeTimer = null;
let sleepDeepBreathTimer = null;
let coughStopTimer = null;
let lastLivingSound = null;
let activeAudioSettings = null;

function readAudioSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(HAVEN_AUDIO_SETTINGS_KEY));
        return {
            bgmVolume: Number(saved?.bgmVolume ?? 18),
            livingVolume: Number(saved?.livingVolume ?? 15),
            sleepVolume: Number(saved?.sleepVolume ?? 100),
            heartbeatVolume: Number(saved?.heartbeatVolume ?? 100),
            alarmVolume: Number(saved?.alarmVolume ?? 48)
        };
    } catch (_) {
        return {
            bgmVolume: 18,
            livingVolume: 15,
            sleepVolume: 100,
            heartbeatVolume: 100,
            alarmVolume: 48
        };
    }
}

function clamp01(value) {
    return Math.min(1, Math.max(0, Number(value) || 0));
}

function connectHavenAudioElement(audio) {
    if (!audio || !havenAudioContext) return null;
    const existing = havenGainNodes.get(audio);
    if (existing) return existing;

    try {
        const source = havenAudioContext.createMediaElementSource(audio);
        const gainNode = havenAudioContext.createGain();
        source.connect(gainNode).connect(havenAudioContext.destination);
        havenGainNodes.set(audio, gainNode);
        return gainNode;
    } catch (error) {
        console.warn("Haven audio routing is unavailable for one source:", error);
        return null;
    }
}

function setHavenAudioLevel(audio, level, boost = 1) {
    const normalized = clamp01(level);
    const gainNode = havenGainNodes.get(audio);

    if (gainNode) {
        try { audio.volume = 1; } catch (_) {}
        gainNode.gain.value = normalized * boost;
        return;
    }

    try { audio.volume = normalized; } catch (_) {}
}

function applyHavenAudioSettings(previewSettings) {
    const settings = previewSettings && typeof previewSettings === "object"
        ? previewSettings
        : activeAudioSettings || readAudioSettings();
    activeAudioSettings = {
        bgmVolume: Number(settings.bgmVolume ?? 18),
        livingVolume: Number(settings.livingVolume ?? 15),
        sleepVolume: Number(settings.sleepVolume ?? 100),
        heartbeatVolume: Number(settings.heartbeatVolume ?? 100),
        alarmVolume: Number(settings.alarmVolume ?? 48)
    };
    const bgm = clamp01(activeAudioSettings.bgmVolume / 100);
    const living = clamp01(activeAudioSettings.livingVolume / 100);
    const sleep = clamp01(activeAudioSettings.sleepVolume / 100);
    const heartbeat = clamp01(activeAudioSettings.heartbeatVolume / 100);
    const alarm = clamp01(activeAudioSettings.alarmVolume / 100);

    setHavenAudioLevel(havenAudio.workBgm, bgm);
    setHavenAudioLevel(havenAudio.breakBgm, bgm * 0.84);
    setHavenAudioLevel(havenAudio.clock, living * 0.74);
    setHavenAudioLevel(havenAudio.pen, living);
    setHavenAudioLevel(havenAudio.page, living * 1.12);
    setHavenAudioLevel(havenAudio.coffee, living);
    setHavenAudioLevel(havenAudio.cough, living * 0.74);
    setHavenAudioLevel(havenAudio.step, living * 0.92);
    setHavenAudioLevel(
        havenAudio.breath,
        audioMode === "sleep" ? sleep * HAVEN_SLEEP_DEEP_BREATH_RATIO : living * 0.86
    );
    setHavenAudioLevel(havenAudio.sleepBreath, sleep, HAVEN_SLEEP_BREATH_GAIN);
    setHavenAudioLevel(havenAudio.heartbeat, heartbeat, HAVEN_HEARTBEAT_GAIN);
    setHavenAudioLevel(havenAudio.alarm, alarm);
}

function ensureBoostedBedroomAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioGraphAttempted) {
        audioGraphAttempted = true;
        try {
            havenAudioContext = new AudioContextClass();
            Object.values(havenAudio).forEach(connectHavenAudioElement);
            applyHavenAudioSettings(activeAudioSettings || readAudioSettings());
        } catch (error) {
            console.warn("Haven Web Audio routing is unavailable:", error);
        }
    }

    if (havenAudioContext?.state === "suspended") {
        const resumeResult = havenAudioContext.resume();
        if (resumeResult && typeof resumeResult.catch === "function") {
            resumeResult.catch(() => {});
        }
    }
}

function setHavenDynamicAudioVolume(audio, level) {
    if (!audio) return;
    ensureBoostedBedroomAudio();
    connectHavenAudioElement(audio);
    setHavenAudioLevel(audio, level);
}

function syncBedroomHeartbeat() {
    if (!bedroomAmbienceActive) {
        stopAudio(havenAudio.heartbeat);
        return;
    }

    ensureBoostedBedroomAudio();
    safePlay(havenAudio.heartbeat);
}

function setBedroomAmbience(isActive) {
    bedroomAmbienceActive = Boolean(isActive);
    if (bedroomAmbienceActive) unlockAudio();
    syncBedroomHeartbeat();
}

function safePlay(audio) {
    if (!audio) return Promise.resolve(false);
    try {
        const result = audio.play();
        if (result && typeof result.then === "function") {
            return result.then(() => true).catch(() => false);
        }
        return Promise.resolve(true);
    } catch (_) {
        return Promise.resolve(false);
    }
}

function stopAudio(audio, reset = true) {
    if (!audio) return;
    audio.pause();
    if (reset) {
        try { audio.currentTime = 0; } catch (_) {}
    }
}

function replay(audio) {
    stopAudio(audio);
    safePlay(audio);
}

function clearAudioTimers() {
    clearTimeout(deskTimer);
    clearTimeout(humanTimer);
    clearTimeout(coffeeTimer);
    clearTimeout(sleepDeepBreathTimer);
    clearTimeout(coughStopTimer);
    deskTimer = null;
    humanTimer = null;
    coffeeTimer = null;
    sleepDeepBreathTimer = null;
    coughStopTimer = null;
}

function stopAllAudioElements() {
    Object.values(havenAudio).forEach(audio => stopAudio(audio));
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function chooseDifferent(list) {
    const candidates = list.filter(item => item.key !== lastLivingSound);
    const pool = candidates.length ? candidates : list;
    const item = pool[Math.floor(Math.random() * pool.length)];
    lastLivingSound = item.key;
    return item;
}

function playCoughExcerpt() {
    if (audioMode !== "work") return;
    stopAudio(havenAudio.cough);
    safePlay(havenAudio.cough);
    clearTimeout(coughStopTimer);
    coughStopTimer = setTimeout(function () {
        stopAudio(havenAudio.cough);
    }, 3000);
}

function scheduleDeskSound() {
    clearTimeout(deskTimer);
    if (audioMode !== "work") return;

    deskTimer = setTimeout(function () {
        if (audioMode !== "work") return;
        const choice = chooseDifferent([
            { key: "pen", audio: havenAudio.pen },
            { key: "page", audio: havenAudio.page }
        ]);
        replay(choice.audio);
        scheduleDeskSound();
    }, randomBetween(20000, 55000));
}

function scheduleHumanSound() {
    clearTimeout(humanTimer);
    if (audioMode !== "work") return;

    humanTimer = setTimeout(function () {
        if (audioMode !== "work") return;
        if (Math.random() < 0.16) {
            lastLivingSound = "cough";
            playCoughExcerpt();
        } else {
            lastLivingSound = "breath";
            replay(havenAudio.breath);
        }
        scheduleHumanSound();
    }, randomBetween(55000, 140000));
}

function scheduleCoffeeSound() {
    clearTimeout(coffeeTimer);
    if (audioMode !== "work") return;

    coffeeTimer = setTimeout(function () {
        if (audioMode !== "work") return;
        lastLivingSound = "coffee";
        replay(havenAudio.coffee);
        scheduleCoffeeSound();
    }, randomBetween(240000, 540000));
}

function scheduleSleepDeepBreath() {
    clearTimeout(sleepDeepBreathTimer);
    if (audioMode !== "sleep") return;

    sleepDeepBreathTimer = setTimeout(function () {
        if (audioMode !== "sleep") return;
        const settings = activeAudioSettings || readAudioSettings();
        setHavenAudioLevel(
            havenAudio.breath,
            clamp01(settings.sleepVolume / 100) * HAVEN_SLEEP_DEEP_BREATH_RATIO
        );
        replay(havenAudio.breath);
        scheduleSleepDeepBreath();
    }, randomBetween(60000, 150000));
}

function setMode(nextMode) {
    desiredAudioMode = nextMode;
    clearAudioTimers();
    stopAllAudioElements();
    audioMode = nextMode;
    applyHavenAudioSettings();

    if (nextMode === "work") {
        safePlay(havenAudio.workBgm);
        safePlay(havenAudio.clock);
        scheduleDeskSound();
        scheduleHumanSound();
        scheduleCoffeeSound();
    } else if (nextMode === "break") {
        safePlay(havenAudio.breakBgm);
    } else if (nextMode === "sleep") {
        safePlay(havenAudio.sleepBreath);
        scheduleSleepDeepBreath();
    } else if (nextMode === "alarm") {
        safePlay(havenAudio.alarm);
    }

    syncBedroomHeartbeat();
}

function unlockAudio() {
    if (audioUnlocked) {
        if (desiredAudioMode !== "idle" && audioMode !== desiredAudioMode) {
            setMode(desiredAudioMode);
        }
        return;
    }

    audioUnlocked = true;
    ensureBoostedBedroomAudio();
    applyHavenAudioSettings();

    // ユーザー操作の中でアラーム音を無音再生し、後の自動再生を許可しやすくする。
    const previous = havenAudio.alarm.volume;
    havenAudio.alarm.volume = 0.001;
    safePlay(havenAudio.alarm).then(function () {
        setTimeout(function () {
            stopAudio(havenAudio.alarm);
            havenAudio.alarm.volume = previous;
            if (desiredAudioMode !== "idle") setMode(desiredAudioMode);
        }, 40);
    });
}

function armAlarmAudio() {
    unlockAudio();
}

function startRoomSounds() {
    unlockAudio();
    setMode("work");
}

function stopRoomSounds() {
    if (audioMode === "work") setMode("idle");
}

function startBreakBgm() {
    unlockAudio();
    setMode("break");
}

function stopBreakBgm() {
    if (audioMode === "break") setMode("idle");
}

function startSleepBgm() {
    unlockAudio();
    setMode("sleep");
}

function stopSleepBgm() {
    if (audioMode === "sleep") setMode("idle");
}

function startAlarmSound() {
    setMode("alarm");
}

function stopAlarmSound() {
    if (audioMode === "alarm") setMode("idle");
    else stopAudio(havenAudio.alarm);
}

function stopAllSounds() {
    setMode("idle");
}

function playPageStepSound() {
    if (audioMode === "sleep" || audioMode === "alarm") return;
    applyHavenAudioSettings();
    replay(havenAudio.step);
}

// 最初のユーザー操作で音声を解錠する。
document.addEventListener("pointerdown", unlockAudio, { once: true, passive: true });
document.addEventListener("touchend", unlockAudio, { once: true, passive: true });
document.addEventListener("keydown", unlockAudio, { once: true });

applyHavenAudioSettings();
window.setBedroomAmbience = setBedroomAmbience;
window.applyHavenAudioSettings = applyHavenAudioSettings;
window.setHavenDynamicAudioVolume = setHavenDynamicAudioVolume;
