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
sleepBreath.volume = 0.20;
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

        replaySound(breathIdleSound);
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
    sleepBreath.volume = 0.20;
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
