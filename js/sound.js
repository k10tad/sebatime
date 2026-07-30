// Haven native audio engine. Fixed mix is baked into the MP3 assets.
let audioMode = "idle";
let desiredAudioMode = "idle";
let audioUnlocked = false;
let bedroomAmbienceActive = false;
const havenAudio = {
    workBgm: new Audio("music/bgm.mp3"), breakBgm: new Audio("music/break.mp3"),
    clock: new Audio("sound/clockloop2.mp3"), pen: new Audio("sound/pen.mp3"),
    page: new Audio("sound/page.mp3"), breath: new Audio("sound/breath_idle.mp3"),
    tie: new Audio("sound/tie.mp3"), throat: new Audio("sound/throat.mp3"),
    sleepDeepBreath: new Audio("sound/sleep_deep_breath.mp3"),
    coffee: new Audio("sound/coffe.mp3"), cough: new Audio("sound/coughing.mp3"),
    coffeeCup: new Audio("sound/coffe cup.mp3"),
    shower: new Audio("sound/shower.mp3"), bathtub: new Audio("sound/bathtub.mp3"),
    blanket: new Audio("sound/blanket.mp3"),
    glass: new Audio("sound/glass.mp3"), wine: new Audio("sound/Wine.mp3"),
    step: new Audio("sound/step.mp3"), sleepBreath: new Audio("sound/sleep_breath.mp3"),
    heartbeat: new Audio("sound/heartbeat.mp3"), alarm: new Audio("sound/alarm.mp3")
};
["workBgm", "breakBgm", "clock", "sleepBreath", "heartbeat", "alarm"]
    .forEach(key => { havenAudio[key].loop = true; });
Object.values(havenAudio).forEach(audio => { audio.preload = "auto"; audio.volume = 1; });
let deskTimer, humanTimer, coffeeTimer, sleepDeepBreathTimer, coughStopTimer;
let lastLivingSound = null;

function safePlay(audio) {
    if (!audio) return Promise.resolve(false);
    try {
        const result = audio.play();
        return result?.then ? result.then(() => true).catch(() => false) : Promise.resolve(true);
    } catch (_) { return Promise.resolve(false); }
}
function stopAudio(audio, reset = true) {
    if (!audio) return;
    audio.pause();
    if (reset) try { audio.currentTime = 0; } catch (_) {}
}
function replay(audio) { stopAudio(audio); safePlay(audio); }
function clearAudioTimers() {
    [deskTimer, humanTimer, coffeeTimer, sleepDeepBreathTimer, coughStopTimer].forEach(clearTimeout);
    deskTimer = humanTimer = coffeeTimer = sleepDeepBreathTimer = coughStopTimer = null;
}
function stopAllAudioElements() { Object.values(havenAudio).forEach(audio => stopAudio(audio)); }
function randomBetween(min, max) { return min + Math.random() * (max - min); }
function chooseDifferent(list) {
    const candidates = list.filter(item => item.key !== lastLivingSound);
    const pool = candidates.length ? candidates : list;
    const item = pool[Math.floor(Math.random() * pool.length)];
    lastLivingSound = item.key;
    return item;
}
function playCoughExcerpt() {
    if (audioMode !== "work") return;
    replay(havenAudio.cough);
    clearTimeout(coughStopTimer);
    coughStopTimer = setTimeout(() => stopAudio(havenAudio.cough), 3000);
}
function scheduleDeskSound() {
    clearTimeout(deskTimer);
    if (audioMode !== "work") return;
    deskTimer = setTimeout(() => {
        if (audioMode !== "work") return;
        replay(chooseDifferent([{ key: "pen", audio: havenAudio.pen }, { key: "page", audio: havenAudio.page }]).audio);
        scheduleDeskSound();
    }, randomBetween(20000, 55000));
}
function scheduleHumanSound() {
    clearTimeout(humanTimer);
    if (audioMode !== "work") return;
    humanTimer = setTimeout(() => {
        if (audioMode !== "work") return;
        if (Math.random() < 0.16) { lastLivingSound = "cough"; playCoughExcerpt(); }
        else { lastLivingSound = "breath"; replay(havenAudio.breath); }
        scheduleHumanSound();
    }, randomBetween(55000, 140000));
}
function scheduleCoffeeSound() {
    clearTimeout(coffeeTimer);
    if (audioMode !== "work") return;
    coffeeTimer = setTimeout(() => {
        if (audioMode !== "work") return;
        lastLivingSound = "coffee";
        replay(havenAudio.coffee);
        scheduleCoffeeSound();
    }, randomBetween(240000, 540000));
}
function scheduleSleepDeepBreath() {
    clearTimeout(sleepDeepBreathTimer);
    if (audioMode !== "sleep") return;
    sleepDeepBreathTimer = setTimeout(() => {
        if (audioMode !== "sleep") return;
        replay(havenAudio.sleepDeepBreath);
        scheduleSleepDeepBreath();
    }, randomBetween(60000, 150000));
}
function syncBedroomHeartbeat() {
    if (bedroomAmbienceActive) safePlay(havenAudio.heartbeat);
    else stopAudio(havenAudio.heartbeat);
}
function setBedroomAmbience(isActive) {
    bedroomAmbienceActive = Boolean(isActive);
    if (bedroomAmbienceActive) unlockAudio();
    syncBedroomHeartbeat();
}
function setMode(nextMode) {
    desiredAudioMode = nextMode;
    clearAudioTimers();
    stopAllAudioElements();
    audioMode = nextMode;
    if (nextMode === "work") {
        safePlay(havenAudio.workBgm); safePlay(havenAudio.clock);
        scheduleDeskSound(); scheduleHumanSound(); scheduleCoffeeSound();
    } else if (nextMode === "break") safePlay(havenAudio.breakBgm);
    else if (nextMode === "sleep") { safePlay(havenAudio.sleepBreath); scheduleSleepDeepBreath(); }
    else if (nextMode === "alarm") safePlay(havenAudio.alarm);
    syncBedroomHeartbeat();
}
function unlockAudio() {
    if (audioUnlocked) {
        if (desiredAudioMode !== "idle" && audioMode !== desiredAudioMode) setMode(desiredAudioMode);
        return;
    }
    audioUnlocked = true;
    const wasMuted = havenAudio.alarm.muted;
    havenAudio.alarm.muted = true;
    safePlay(havenAudio.alarm).then(() => setTimeout(() => {
        stopAudio(havenAudio.alarm); havenAudio.alarm.muted = wasMuted;
        if (desiredAudioMode !== "idle") setMode(desiredAudioMode);
    }, 40));
}
function armAlarmAudio() { unlockAudio(); }
function startRoomSounds() { unlockAudio(); setMode("work"); }
function stopRoomSounds() { if (audioMode === "work") setMode("idle"); }
function startBreakBgm() { unlockAudio(); setMode("break"); }
function stopBreakBgm() { if (audioMode === "break") setMode("idle"); }
function startSleepBgm() { unlockAudio(); setMode("sleep"); }
function stopSleepBgm() { if (audioMode === "sleep") setMode("idle"); }
function startAlarmSound() { setMode("alarm"); }
function stopAlarmSound() { if (audioMode === "alarm") setMode("idle"); else stopAudio(havenAudio.alarm); }
function stopAllSounds() { setMode("idle"); }
function playPageStepSound() { if (audioMode !== "sleep" && audioMode !== "alarm") replay(havenAudio.step); }
function playHavenActivitySound(activityName) {
    if (!audioUnlocked || audioMode !== "idle" || document.hidden) return false;
    if (document.body.dataset.havenPage !== "home") return false;
    if (document.body.classList.contains("a-mi-lado-mode")) return false;

    const pools = {
        working: [
            havenAudio.pen,
            havenAudio.coffeeCup,
            havenAudio.page,
            havenAudio.tie
        ],
        reading: [
            havenAudio.page,
            havenAudio.coffeeCup,
            havenAudio.throat
        ],
        "after-shower": [
            havenAudio.shower,
            havenAudio.bathtub,
            havenAudio.blanket,
            havenAudio.breath
        ],
        drinking: [
            havenAudio.glass,
            havenAudio.wine
        ],
        "sofa-nap": [
            havenAudio.blanket,
            havenAudio.breath
        ]
    };
    const pool = pools[activityName];
    if (!pool || !pool.length) return false;

    replay(pool[Math.floor(Math.random() * pool.length)]);
    return true;
}
document.addEventListener("visibilitychange", () => {
    if (document.hidden || !audioUnlocked) return;
    if (audioMode === "work") { safePlay(havenAudio.workBgm); safePlay(havenAudio.clock); }
    else if (audioMode === "break") safePlay(havenAudio.breakBgm);
    else if (audioMode === "sleep") safePlay(havenAudio.sleepBreath);
    else if (audioMode === "alarm") safePlay(havenAudio.alarm);
    syncBedroomHeartbeat();
});
document.addEventListener("pointerdown", unlockAudio, { once: true, passive: true });
document.addEventListener("touchend", unlockAudio, { once: true, passive: true });
document.addEventListener("keydown", unlockAudio, { once: true });
window.setBedroomAmbience = setBedroomAmbience;
window.playHavenActivitySound = playHavenActivitySound;
