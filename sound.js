//========================
// 音声管理
// スマホ・Safari対応版
//========================

let audioUnlocked = false;

let roomEffectTimer = null;
let breathTimer = null;

//========================
// 音声ファイル
//========================

const roomSound = new Audio("sound/clockloop.mp3");
roomSound.loop = true;
roomSound.volume = 0.15;
roomSound.preload = "auto";

const bgm = new Audio("music/bgm.mp3");
bgm.loop = true;
bgm.volume = 0.18;
bgm.preload = "auto";

const breakBgm = new Audio("music/break.mp3");
breakBgm.loop = true;
breakBgm.volume = 0.18;
breakBgm.preload = "auto";

const sleepBgm = new Audio("music/sleep.mp3");
sleepBgm.loop = true;
sleepBgm.volume = 0.18;
sleepBgm.preload = "auto";

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
breathIdle.volume = 0.28;
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
        sleepBgm,
        startSound,
        penSound,
        pageSound,
        breathIdle
    ];

    audioList.forEach(function (audio) {
        audio.muted = true;

        audio.play()
            .then(function () {
                audio.pause();
                audio.currentTime = 0;
                audio.muted = false;
            })
            .catch(function () {
                audio.muted = false;
            });
    });

    audioUnlocked = true;
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

    roomEffectTimer =
        setTimeout(playRandomRoomEffect, next);
}

function scheduleRoomEffect() {
    if (roomEffectTimer !== null) return;

    const first = 5000 + Math.random() * 8000;

    roomEffectTimer =
        setTimeout(playRandomRoomEffect, first);
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
// 睡眠BGM
//========================

function startSleepBgm() {
    stopRoomSounds();
    stopBreakBgm();

    sleepBgm.currentTime = 0;
    safePlay(sleepBgm);
}

function stopSleepBgm() {
    sleepBgm.pause();
    sleepBgm.currentTime = 0;
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
// フェード
//========================

function fadeOut(audio, duration = 3000) {
    if (!audio) return;

    const startVolume = audio.volume;
    const interval = 50;
    const step = startVolume / (duration / interval);

    const fade = setInterval(function () {
        audio.volume -= step;

        if (audio.volume <= 0) {
            audio.volume = 0;
            audio.pause();
            audio.currentTime = 0;
            clearInterval(fade);
        }
    }, interval);
}

function fadeIn(audio, target = 0.18, duration = 3000) {
    if (!audio) return;

    audio.volume = 0;
    safePlay(audio);

    const interval = 50;
    const step = target / (duration / interval);

    const fade = setInterval(function () {
        audio.volume += step;

        if (audio.volume >= target) {
            audio.volume = target;
            clearInterval(fade);
        }
    }, interval);
}
