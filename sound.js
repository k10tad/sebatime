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
breathIdle.volume = 0.22;
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
