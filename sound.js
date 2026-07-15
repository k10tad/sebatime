//========================
// 音声管理
// スマホ・Safari対応版
// 睡眠BGMなし：溜息 + 寝息
//========================

let audioUnlocked = false;

let roomEffectTimer = null;
let breathTimer = null;
let sleepBreathEventTimer = null;

//========================
// 音声ファイル
//========================

const roomSound = new Audio("sound/clockloop.mp3");
roomSound.loop = true;
roomSound.volume = 0.12;
roomSound.preload = "auto";

const bgm = new Audio("music/bgm.mp3");
bgm.loop = true;
bgm.volume = 0.18;
bgm.preload = "auto";

const breakBgm = new Audio("music/break.mp3");
breakBgm.loop = true;
breakBgm.volume = 0.15;
breakBgm.preload = "auto";

// 互換用に残すが、睡眠BGMとしては使わない
const sleepBgm = new Audio("music/sleep.mp3");
sleepBgm.loop = true;
sleepBgm.volume = 0;
sleepBgm.muted = true;
sleepBgm.preload = "auto";

const sleepBreath = new Audio("sound/sleep_breath.mp3");
sleepBreath.loop = true;
sleepBreath.volume = 0.22;
sleepBreath.preload = "auto";

const startSound = new Audio("sound/page.mp3");
startSound.volume = 0.4;
startSound.preload = "auto";

const penSound = new Audio("sound/pen.mp3");
penSound.volume = 0.18;
penSound.preload = "auto";

const pageSound = new Audio("sound/page.mp3");
pageSound.volume = 0.18;
pageSound.preload = "auto";

const breathIdle = new Audio("sound/breath_idle.mp3");
breathIdle.volume = 0.16;
breathIdle.preload = "auto";

const roomEffects = [
    penSound,
    pageSound
];

//========================
// スマホ用 音声ロック解除
//========================

function unlockAudio() {
    if (audioUnlocked) return;

    const audioList = [
        roomSound,
        bgm,
        breakBgm,
        sleepBreath,
        startSound,
        penSound,
        pageSound,
        breathIdle
    ];

    audioList.forEach(function (audio) {
        audio.load();
    });

    startSound.muted = true;

    startSound.play()
        .then(function () {
            startSound.pause();
            startSound.currentTime = 0;
            startSound.muted = false;
            audioUnlocked = true;
        })
        .catch(function () {
            startSound.muted = false;
        });
}

document.addEventListener("touchstart", unlockAudio, { once: true });
document.addEventListener("click", unlockAudio, { once: true });

//========================
// 安全再生
//========================

function safePlay(audio) {
    if (!audio) return;

    audio.play().catch(function () {});
}

function replaySound(audio) {
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    safePlay(audio);
}

//========================
// 部屋の環境音
//========================

function playRandomRoomEffect() {
    if (document.body.classList.contains("sleep-mode")) return;

    const effect =
        roomEffects[Math.floor(Math.random() * roomEffects.length)];

    replaySound(effect);

    const next = 12000 + Math.random() * 25000;
    roomEffectTimer = setTimeout(playRandomRoomEffect, next);
}

function scheduleRoomEffect() {
    if (roomEffectTimer !== null) return;

    const first = 5000 + Math.random() * 8000;
    roomEffectTimer = setTimeout(playRandomRoomEffect, first);
}

function stopRoomEffect() {
    clearTimeout(roomEffectTimer);
    roomEffectTimer = null;

    penSound.pause();
    penSound.currentTime = 0;

    pageSound.pause();
    pageSound.currentTime = 0;
}

//========================
// 日常の溜息
//========================

function playBreathIdle() {
    if (document.body.classList.contains("sleep-mode")) return;
    if (!breathIdle.paused) return;

    breathIdle.currentTime = 0;
    safePlay(breathIdle);
}

function scheduleBreathIdle() {
    if (breathTimer !== null) return;

    const next = 25000 + Math.random() * 50000;

    breathTimer = setTimeout(function () {
        breathTimer = null;

        if (!document.body.classList.contains("sleep-mode")) {
            if (Math.random() < 0.3) {
                playBreathIdle();
            }
        }

        scheduleBreathIdle();
    }, next);
}

function stopBreathIdle() {
    clearTimeout(breathTimer);
    breathTimer = null;

    breathIdle.pause();
    breathIdle.currentTime = 0;
}

//========================
// 作業中BGM
//========================

function startRoomSounds() {
    unlockAudio();

    stopBreakBgm();
    stopSleepBgm();

    safePlay(roomSound);
    safePlay(bgm);

    scheduleRoomEffect();
    scheduleBreathIdle();
}

function stopRoomSounds() {
    roomSound.pause();
    roomSound.currentTime = 0;

    bgm.pause();
    bgm.currentTime = 0;

    stopRoomEffect();
    stopBreathIdle();
}

//========================
// 休憩BGM
//========================

function startBreakBgm() {
    unlockAudio();

    stopRoomSounds();
    stopSleepBgm();

    breakBgm.currentTime = 0;
    safePlay(breakBgm);
}

function stopBreakBgm() {
    breakBgm.pause();
    breakBgm.currentTime = 0;
}

//========================
// 睡眠中の呼吸イベント
//========================

function startSleepBreath() {
    sleepBreath.currentTime = 0;
    safePlay(sleepBreath);
}

function stopSleepBreath() {
    sleepBreath.pause();
    sleepBreath.currentTime = 0;
}

function scheduleSleepBreathEvent() {
    clearTimeout(sleepBreathEventTimer);

    const next = 180000 + Math.random() * 180000;

    sleepBreathEventTimer = setTimeout(function () {
        if (!document.body.classList.contains("sleep-mode")) return;

        if (Math.random() < 0.35) {
            sleepBreath.pause();

            breathIdle.currentTime = 0;
            safePlay(breathIdle);

            setTimeout(function () {
                if (!document.body.classList.contains("sleep-mode")) return;

                sleepBreath.currentTime = 0;
                safePlay(sleepBreath);

                scheduleSleepBreathEvent();
            }, 1200);

        } else {
            scheduleSleepBreathEvent();
        }
    }, next);
}

function stopSleepBreathEvent() {
    clearTimeout(sleepBreathEventTimer);
    sleepBreathEventTimer = null;
}

//========================
// 睡眠モード音声
//========================

function forceStopSleepMusic() {
    sleepBgm.pause();
    sleepBgm.currentTime = 0;
    sleepBgm.volume = 0;
    sleepBgm.muted = true;
}

function startSleepBgm() {
    unlockAudio();

    stopRoomSounds();
    stopBreakBgm();

    bgm.pause();
    bgm.currentTime = 0;

    breakBgm.pause();
    breakBgm.currentTime = 0;

    forceStopSleepMusic();

    breathIdle.currentTime = 0;
    safePlay(breathIdle);

    setTimeout(function () {
        if (!document.body.classList.contains("sleep-mode")) return;

        startSleepBreath();
        scheduleSleepBreathEvent();
    }, 1200);
}

function stopSleepBgm() {
    forceStopSleepMusic();

    stopSleepBreathEvent();
    stopSleepBreath();

    breathIdle.pause();
    breathIdle.currentTime = 0;
}

//========================
// 全停止
//========================

function stopAllSounds() {
    stopRoomSounds();
    stopBreakBgm();
    stopSleepBgm();
}
//========================
// Haven 音声管理
// 生活音・作業・休憩・睡眠モード統合版
//========================

let audioUnlocked = false;
let roomSoundsActive = false;
let lastLivingSoundKey = null;

let deskSoundTimer = null;
let humanSoundTimer = null;
let coffeeSoundTimer = null;
let sleepBreathIdleTimer = null;

//========================
// BGM・環境音
//========================

const roomSound = new Audio("sound/clockloop2.mp3");
roomSound.loop = true;
roomSound.volume = 0.11;
roomSound.preload = "auto";

const bgm = new Audio("music/bgm.mp3");
bgm.loop = true;
bgm.volume = 0.18;
bgm.preload = "auto";

const breakBgm = new Audio("music/break.mp3");
breakBgm.loop = true;
breakBgm.volume = 0.15;
breakBgm.preload = "auto";

const sleepBreath = new Audio("sound/sleep_breath.mp3");
sleepBreath.loop = true;
sleepBreath.volume = 0.38;
sleepBreath.preload = "auto";

//========================
// 生活音
// chair.mp3 と start2.mp3 は現時点では使用しない
//========================

const penSound = new Audio("sound/pen.mp3");
penSound.volume = 0.15;
penSound.preload = "auto";

const pageSound = new Audio("sound/page.mp3");
pageSound.volume = 0.17;
pageSound.preload = "auto";

const breathIdleSound = new Audio("sound/breath_idle.mp3");
breathIdleSound.volume = 0.13;
breathIdleSound.preload = "auto";

const coffeeSound = new Audio("sound/coffe.mp3");
coffeeSound.volume = 0.15;
coffeeSound.preload = "auto";

const coughingSound = new Audio("sound/coughing.mp3");
coughingSound.volume = 0.11;
coughingSound.preload = "auto";

const stepSound = new Audio("sound/step.mp3");
stepSound.volume = 0.14;
stepSound.preload = "auto";

const unlockSound = pageSound;

const allAudio = [
    roomSound,
    bgm,
    breakBgm,
    sleepBreath,
    penSound,
    pageSound,
    breathIdleSound,
    coffeeSound,
    coughingSound,
    stepSound
];

//========================
// 共通処理
//========================

function isSleepMode() {
    return document.body.classList.contains("sleep-mode");
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function safePlay(audio) {
    if (!audio) return;

    const promise = audio.play();
    if (promise && typeof promise.catch === "function") {
        promise.catch(function () {});
    }
}

function replaySound(audio) {
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    safePlay(audio);
}

function stopAudio(audio, reset = true) {
    if (!audio) return;

    audio.pause();
    if (reset) audio.currentTime = 0;
}

function chooseDifferent(items) {
    const candidates = items.filter(function (item) {
        return item.key !== lastLivingSoundKey;
    });

    const pool = candidates.length > 0 ? candidates : items;
    const totalWeight = pool.reduce(function (sum, item) {
        return sum + item.weight;
    }, 0);

    let value = Math.random() * totalWeight;

    for (const item of pool) {
        value -= item.weight;
        if (value <= 0) {
            lastLivingSoundKey = item.key;
            return item;
        }
    }

    const fallback = pool[pool.length - 1];
    lastLivingSoundKey = fallback.key;
    return fallback;
}

//========================
// iPhone / Safari 音声ロック解除
//========================

function unlockAudio() {
    if (audioUnlocked) return;

    allAudio.forEach(function (audio) {
        audio.load();
    });

    unlockSound.muted = true;

    const promise = unlockSound.play();
    if (!promise || typeof promise.then !== "function") return;

    promise
        .then(function () {
            unlockSound.pause();
            unlockSound.currentTime = 0;
            unlockSound.muted = false;
            audioUnlocked = true;
        })
        .catch(function () {
            unlockSound.muted = false;
        });
}

document.addEventListener("touchstart", unlockAudio, { once: true });
document.addEventListener("click", unlockAudio, { once: true });

//========================
// coughing.mp3 の冒頭3秒だけ再生
//========================

function playCoughingExcerpt() {
    if (isSleepMode() || !roomSoundsActive) return;

    coughingSound.pause();
    coughingSound.currentTime = 0;
    safePlay(coughingSound);

    window.setTimeout(function () {
        coughingSound.pause();
        coughingSound.currentTime = 0;
    }, 3000);
}

//========================
// 机まわりの生活音
// ペン・ページ：20〜55秒ごと
//========================

function scheduleDeskSound() {
    clearTimeout(deskSoundTimer);

    if (!roomSoundsActive || isSleepMode()) {
        deskSoundTimer = null;
        return;
    }

    deskSoundTimer = window.setTimeout(function () {
        deskSoundTimer = null;

        if (!roomSoundsActive || isSleepMode()) return;

        const choice = chooseDifferent([
            { key: "pen", audio: penSound, weight: 46 },
            { key: "page", audio: pageSound, weight: 54 }
        ]);

        replaySound(choice.audio);
        scheduleDeskSound();
    }, randomBetween(20000, 55000));
}

//========================
// 呼吸・咳払い：55秒〜2分20秒ごと
// 咳払いは低頻度、かつ冒頭3秒だけ
//========================

function scheduleHumanSound() {
    clearTimeout(humanSoundTimer);

    if (!roomSoundsActive || isSleepMode()) {
        humanSoundTimer = null;
        return;
    }

    humanSoundTimer = window.setTimeout(function () {
        humanSoundTimer = null;

        if (!roomSoundsActive || isSleepMode()) return;

        const choice = chooseDifferent([
            { key: "breath", audio: breathIdleSound, weight: 84 },
            { key: "cough", audio: coughingSound, weight: 16 }
        ]);

        if (choice.key === "cough") {
            playCoughingExcerpt();
        } else {
            replaySound(choice.audio);
        }

        scheduleHumanSound();
    }, randomBetween(55000, 140000));
}

//========================
// コーヒー：4〜9分ごと
//========================

function scheduleCoffeeSound() {
    clearTimeout(coffeeSoundTimer);

    if (!roomSoundsActive || isSleepMode()) {
        coffeeSoundTimer = null;
        return;
    }

    coffeeSoundTimer = window.setTimeout(function () {
        coffeeSoundTimer = null;

        if (!roomSoundsActive || isSleepMode()) return;

        lastLivingSoundKey = "coffee";
        replaySound(coffeeSound);
        scheduleCoffeeSound();
    }, randomBetween(240000, 540000));
}

function startLivingSounds() {
    roomSoundsActive = true;
    scheduleDeskSound();
    scheduleHumanSound();
    scheduleCoffeeSound();
}

function stopLivingSounds() {
    roomSoundsActive = false;

    clearTimeout(deskSoundTimer);
    clearTimeout(humanSoundTimer);
    clearTimeout(coffeeSoundTimer);

    deskSoundTimer = null;
    humanSoundTimer = null;
    coffeeSoundTimer = null;

    stopAudio(penSound);
    stopAudio(pageSound);
    stopAudio(breathIdleSound);
    stopAudio(coffeeSound);
    stopAudio(coughingSound);
}

//========================
// 作業モード
//========================

function startRoomSounds() {
    unlockAudio();

    stopBreakBgm();
    stopSleepBgm();

    safePlay(roomSound);
    safePlay(bgm);
    startLivingSounds();
}

function stopRoomSounds() {
    stopAudio(roomSound);
    stopAudio(bgm);
    stopLivingSounds();
}

//========================
// 休憩モード
// 生活音はいったん止め、穏やかなBGMだけにする
//========================

function startBreakBgm() {
    unlockAudio();

    stopRoomSounds();
    stopSleepBgm();

    breakBgm.currentTime = 0;
    safePlay(breakBgm);
}

function stopBreakBgm() {
    stopAudio(breakBgm);
}

//========================
// 睡眠モード
// 睡眠BGMは使わず、寝息＋時々の深い呼吸だけ
//========================

function scheduleSleepBreathIdle() {
    clearTimeout(sleepBreathIdleTimer);

    if (!isSleepMode()) {
        sleepBreathIdleTimer = null;
        return;
    }

    sleepBreathIdleTimer = window.setTimeout(function () {
        sleepBreathIdleTimer = null;

        if (!isSleepMode()) return;

        const previousVolume = breathIdleSound.volume;
        breathIdleSound.volume = Math.max(previousVolume, 0.24);
        replaySound(breathIdleSound);

        window.setTimeout(function () {
            breathIdleSound.volume = previousVolume;
        }, 6000);

        scheduleSleepBreathIdle();
    }, randomBetween(30000, 90000));
}

function startSleepBgm() {
    // sleep.js / alarm.jsとの互換性のため関数名はそのまま。
    // 実際にはBGMを流さず、寝息と深い呼吸だけを再生する。
    unlockAudio();

    stopRoomSounds();
    stopBreakBgm();

    clearTimeout(sleepBreathIdleTimer);
    sleepBreathIdleTimer = null;

    sleepBreath.currentTime = 0;
    sleepBreath.loop = true;
    sleepBreath.volume = 0.38;
    safePlay(sleepBreath);

    scheduleSleepBreathIdle();
}

function stopSleepBgm() {
    clearTimeout(sleepBreathIdleTimer);
    sleepBreathIdleTimer = null;

    stopAudio(sleepBreath);
    stopAudio(breathIdleSound);
}

//========================
// ページ切替時の足音
// navigation.js から呼ぶ
//========================

function playPageStepSound() {
    if (isSleepMode()) return;

    unlockAudio();
    replaySound(stepSound);
}

