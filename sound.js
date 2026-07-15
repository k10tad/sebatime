//========================
// Haven 音声管理
// 作業・休憩・睡眠を完全分離した安定版
//========================

let roomSoundsActive = false;
let lastLivingSoundKey = null;

let deskSoundTimer = null;
let humanSoundTimer = null;
let sleepBreathIdleTimer = null;
let coughStopTimer = null;

//========================
// 音声ファイル
//========================

const roomSound = new Audio("sound/clockloop2.mp3");
roomSound.loop = true;
roomSound.preload = "auto";

const bgm = new Audio("music/bgm.mp3");
bgm.loop = true;
bgm.preload = "auto";

const breakBgm = new Audio("music/break.mp3");
breakBgm.loop = true;
breakBgm.preload = "auto";

const sleepBreath = new Audio("sound/sleep_breath.mp3");
sleepBreath.loop = true;
sleepBreath.preload = "auto";

const penSound = new Audio("sound/pen.mp3");
penSound.preload = "auto";

const pageSound = new Audio("sound/page.mp3");
pageSound.preload = "auto";

const breathIdleSound = new Audio("sound/breath_idle.mp3");
breathIdleSound.preload = "auto";

const coughingSound = new Audio("sound/coughing.mp3");
coughingSound.preload = "auto";

const stepSound = new Audio("sound/step.mp3");
stepSound.preload = "auto";

// Settingsがまだ読み込まれていない瞬間の初期値
roomSound.volume = 0.11;
bgm.volume = 0.18;
breakBgm.volume = 0.15;
sleepBreath.volume = 0.38;
penSound.volume = 0.15;
pageSound.volume = 0.17;
breathIdleSound.volume = 0.13;
coughingSound.volume = 0.11;
stepSound.volume = 0.14;

const havenAudioList = [
    roomSound,
    bgm,
    breakBgm,
    sleepBreath,
    penSound,
    pageSound,
    breathIdleSound,
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
        promise.catch(function (error) {
            console.warn("Audio playback was blocked:", audio.src, error);
        });
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

// iPhone Safariでは、実際の再生は必ずボタン操作の中で行う。
// ここでは読み込み準備だけにして、別の音を誤再生させない。
function unlockAudio() {
    havenAudioList.forEach(function (audio) {
        try {
            audio.load();
        } catch (error) {}
    });
}

function chooseDifferent(items) {
    const candidates = items.filter(function (item) {
        return item.key !== lastLivingSoundKey;
    });

    const pool = candidates.length ? candidates : items;
    const total = pool.reduce(function (sum, item) {
        return sum + item.weight;
    }, 0);

    let value = Math.random() * total;

    for (const item of pool) {
        value -= item.weight;
        if (value <= 0) {
            lastLivingSoundKey = item.key;
            return item;
        }
    }

    return pool[0];
}

//========================
// 作業中の生活音
//========================

function playCoughingExcerpt() {
    if (!roomSoundsActive || isSleepMode()) return;

    clearTimeout(coughStopTimer);
    coughingSound.pause();
    coughingSound.currentTime = 0;
    safePlay(coughingSound);

    coughStopTimer = setTimeout(function () {
        coughingSound.pause();
        coughingSound.currentTime = 0;
    }, 3000);
}

function scheduleDeskSound() {
    clearTimeout(deskSoundTimer);

    if (!roomSoundsActive || isSleepMode()) {
        deskSoundTimer = null;
        return;
    }

    deskSoundTimer = setTimeout(function () {
        if (!roomSoundsActive || isSleepMode()) return;

        const choice = chooseDifferent([
            { key: "pen", audio: penSound, weight: 46 },
            { key: "page", audio: pageSound, weight: 54 }
        ]);

        replaySound(choice.audio);
        scheduleDeskSound();
    }, randomBetween(20000, 55000));
}

function scheduleHumanSound() {
    clearTimeout(humanSoundTimer);

    if (!roomSoundsActive || isSleepMode()) {
        humanSoundTimer = null;
        return;
    }

    humanSoundTimer = setTimeout(function () {
        if (!roomSoundsActive || isSleepMode()) return;

        const choice = chooseDifferent([
            { key: "breath", audio: breathIdleSound, weight: 86 },
            { key: "cough", audio: coughingSound, weight: 14 }
        ]);

        if (choice.key === "cough") {
            playCoughingExcerpt();
        } else {
            replaySound(choice.audio);
        }

        scheduleHumanSound();
    }, randomBetween(55000, 140000));
}

function startLivingSounds() {
    roomSoundsActive = true;
    scheduleDeskSound();
    scheduleHumanSound();
}

function stopLivingSounds() {
    roomSoundsActive = false;

    clearTimeout(deskSoundTimer);
    clearTimeout(humanSoundTimer);
    clearTimeout(coughStopTimer);

    deskSoundTimer = null;
    humanSoundTimer = null;
    coughStopTimer = null;

    stopAudio(penSound);
    stopAudio(pageSound);
    stopAudio(breathIdleSound);
    stopAudio(coughingSound);
}

//========================
// 作業モード
//========================

function startRoomSounds() {
    // 作業ボタンのクリック中に直接実行されるため、iPhoneでも再生可能。
    stopBreakBgm();
    stopSleepBgm();

    roomSound.currentTime = 0;
    bgm.currentTime = 0;

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
//========================

function startBreakBgm() {
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
// 寝息ループ + 30〜90秒ごとの深い呼吸
//========================

function scheduleSleepBreathIdle() {
    clearTimeout(sleepBreathIdleTimer);

    if (!isSleepMode()) {
        sleepBreathIdleTimer = null;
        return;
    }

    sleepBreathIdleTimer = setTimeout(function () {
        if (!isSleepMode()) return;

        replaySound(breathIdleSound);
        scheduleSleepBreathIdle();
    }, randomBetween(30000, 90000));
}

function startSleepBgm() {
    // 関数名はsleep.js / alarm.jsとの互換用。
    // 実際には睡眠BGMを一切使わない。
    stopRoomSounds();
    stopBreakBgm();

    // アラーム音が残っていた場合も、睡眠開始時には必ず止める。
    if (typeof stopAlarmSound === "function") {
        stopAlarmSound();
    }

    clearTimeout(sleepBreathIdleTimer);

    sleepBreath.currentTime = 0;
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
// ページ切替の足音
//========================

function playPageStepSound() {
    if (isSleepMode()) return;
    replaySound(stepSound);
}

//========================
// 全停止
//========================

function stopAllSounds() {
    stopRoomSounds();
    stopBreakBgm();
    stopSleepBgm();
}
