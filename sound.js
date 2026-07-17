//========================
// Haven Audio Engine
// 音声はこのファイルだけが管理する
//========================

let audioMode = "idle"; // idle / work / break / sleep / alarm

const HAVEN_AUDIO_SETTINGS_KEY = "havenSettings";
const HAVEN_FIXED_SLEEP_VOLUME = 0.78;
const HAVEN_FIXED_SLEEP_DEEP_BREATH_VOLUME = 0.045;

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
    alarm: new Audio("sound/alarm.mp3")
};

havenAudio.workBgm.loop = true;
havenAudio.breakBgm.loop = true;
havenAudio.clock.loop = true;
havenAudio.sleepBreath.loop = true;
havenAudio.alarm.loop = true;

Object.values(havenAudio).forEach(function (audio) {
    audio.preload = "auto";
});

let audioUnlocked = false;
let desiredAudioMode = "idle";
let deskTimer = null;
let humanTimer = null;
let coffeeTimer = null;
let sleepDeepBreathTimer = null;
let coughStopTimer = null;
let lastLivingSound = null;

function readAudioSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(HAVEN_AUDIO_SETTINGS_KEY));
        return {
            bgmVolume: Number(saved?.bgmVolume ?? 18),
            livingVolume: Number(saved?.livingVolume ?? 15)
        };
    } catch (_) {
        return { bgmVolume: 18, livingVolume: 15 };
    }
}

function clamp01(value) {
    return Math.min(1, Math.max(0, Number(value) || 0));
}

function applyHavenAudioSettings() {
    const settings = readAudioSettings();
    const bgm = clamp01(settings.bgmVolume / 100);
    const living = clamp01(settings.livingVolume / 100);

    havenAudio.workBgm.volume = bgm;
    havenAudio.breakBgm.volume = bgm * 0.84;
    havenAudio.clock.volume = living * 0.74;
    havenAudio.pen.volume = living;
    havenAudio.page.volume = living * 1.12;
    havenAudio.coffee.volume = living;
    havenAudio.cough.volume = living * 0.74;
    havenAudio.step.volume = living * 0.92;

    // 睡眠音はSettingsに依存させず、コード側で固定する。
    havenAudio.sleepBreath.volume = HAVEN_FIXED_SLEEP_VOLUME;
    havenAudio.breath.volume = audioMode === "sleep"
        ? HAVEN_FIXED_SLEEP_DEEP_BREATH_VOLUME
        : living * 0.86;
    havenAudio.alarm.volume = 0.48;
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
        havenAudio.breath.volume = HAVEN_FIXED_SLEEP_DEEP_BREATH_VOLUME;
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
}

function unlockAudio() {
    if (audioUnlocked) {
        if (desiredAudioMode !== "idle" && audioMode !== desiredAudioMode) {
            setMode(desiredAudioMode);
        }
        return;
    }

    audioUnlocked = true;
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
