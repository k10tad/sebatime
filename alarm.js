//========================
// Haven 起床アラーム 完成版
//========================

const HAVEN_ALARM_KEYS = {
    time: "havenAlarmTime",
    enabled: "havenAlarmEnabled",
    lastTriggered: "havenAlarmLastTriggered",
    snoozeUntil: "havenAlarmSnoozeUntil"
};

const alarmTimeInput = document.getElementById("alarmTime");
const alarmEnabledInput = document.getElementById("alarmEnabled");
const saveAlarmButton = document.getElementById("saveAlarm");
const alarmStatus = document.getElementById("alarmStatus");
const alarmCountdown = document.getElementById("alarmCountdown");
const alarmRingingPanel = document.getElementById("alarmRingingPanel");
const alarmWakeMessage = document.getElementById("alarmWakeMessage");
const alarmWakeButton = document.getElementById("alarmWakeButton");
const alarmSnoozeButton = document.getElementById("alarmSnoozeButton");

const alarmSound = new Audio("sound/alarm.mp3");
alarmSound.loop = true;
alarmSound.volume = 0.45;
alarmSound.preload = "auto";

let alarmCheckTimer = null;
let alarmWakeTimer1 = null;
let alarmWakeTimer2 = null;
let alarmWakeTimer3 = null;
let alarmIsRinging = false;

function getSavedAlarmTime() {
    return localStorage.getItem(HAVEN_ALARM_KEYS.time) || "07:30";
}

function isSavedAlarmEnabled() {
    return localStorage.getItem(HAVEN_ALARM_KEYS.enabled) === "true";
}

function getSnoozeUntil() {
    const value = Number(localStorage.getItem(HAVEN_ALARM_KEYS.snoozeUntil));
    return Number.isFinite(value) && value > Date.now() ? value : null;
}

function getNextAlarmDate(timeText) {
    const [hourText, minuteText] = timeText.split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText);

    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;

    const now = new Date();
    const next = new Date();
    next.setHours(hour, minute, 0, 0);

    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
}

function formatAlarmRemaining(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours <= 0) return `あと ${Math.max(1, minutes)}分`;
    if (minutes === 0) return `あと ${hours}時間`;
    return `あと ${hours}時間 ${minutes}分`;
}

function getAlarmTargetTime() {
    const snoozeUntil = getSnoozeUntil();
    if (snoozeUntil) return snoozeUntil;

    const next = getNextAlarmDate(getSavedAlarmTime());
    return next ? next.getTime() : null;
}

function updateAlarmPreview() {
    if (!alarmStatus || !alarmCountdown) return;

    if (!isSavedAlarmEnabled()) {
        alarmStatus.textContent = "アラームは設定されていません";
        alarmCountdown.textContent = "";
        return;
    }

    const snoozeUntil = getSnoozeUntil();
    const target = getAlarmTargetTime();

    if (snoozeUntil) {
        alarmStatus.textContent = "5分後にもう一度起こす。";
    } else {
        alarmStatus.textContent = `${getSavedAlarmTime()} に起こす。`;
    }

    alarmCountdown.textContent = target
        ? formatAlarmRemaining(target - Date.now())
        : "";
}

function armAlarmAudio() {
    // iPhone Safariで、後の自動再生を通しやすくするため
    // 「寝る」などのユーザー操作時に一度だけ音声を解錠する。
    const previousVolume = alarmSound.volume;
    alarmSound.volume = 0;

    const playPromise = alarmSound.play();
    if (playPromise && typeof playPromise.then === "function") {
        playPromise
            .then(function () {
                alarmSound.pause();
                alarmSound.currentTime = 0;
                alarmSound.volume = previousVolume;
            })
            .catch(function () {
                alarmSound.volume = previousVolume;
            });
    } else {
        alarmSound.pause();
        alarmSound.currentTime = 0;
        alarmSound.volume = previousVolume;
    }
}

function saveAlarmSettings() {
    if (!alarmTimeInput || !alarmEnabledInput) return;

    const time = alarmTimeInput.value || "07:30";
    const enabled = alarmEnabledInput.checked;

    localStorage.setItem(HAVEN_ALARM_KEYS.time, time);
    localStorage.setItem(HAVEN_ALARM_KEYS.enabled, String(enabled));
    localStorage.removeItem(HAVEN_ALARM_KEYS.snoozeUntil);

    armAlarmAudio();
    updateAlarmPreview();

    if (typeof setSleepMessages === "function") {
        setSleepMessages(
            enabled
                ? `${time}だな。起こす。`
                : "アラームを外した。"
        );
    }
}

function setAlarmImage(src) {
    if (typeof setSleepImages === "function") {
        setSleepImages(src);
    }
}

function setAlarmMessage(text) {
    if (alarmWakeMessage) alarmWakeMessage.textContent = text;
    if (typeof setSleepMessages === "function") setSleepMessages(text);
}

function clearWakeSequence() {
    clearTimeout(alarmWakeTimer1);
    clearTimeout(alarmWakeTimer2);
    clearTimeout(alarmWakeTimer3);
    alarmWakeTimer1 = null;
    alarmWakeTimer2 = null;
    alarmWakeTimer3 = null;
}

function playAlarmSound() {
    alarmSound.currentTime = 0;
    alarmSound.volume = 0.45;

    const playPromise = alarmSound.play();
    if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function (error) {
            console.warn("アラーム音を再生できませんでした。", error);
            setAlarmMessage("……レイ。画面を触れ。起きる時間だ。");
        });
    }
}

function stopAlarmSound() {
    alarmSound.pause();
    alarmSound.currentTime = 0;
}

function triggerAlarm() {
    if (alarmIsRinging) return;

    alarmIsRinging = true;
    clearWakeSequence();

    const nowKey = new Date().toISOString().slice(0, 16);
    localStorage.setItem(HAVEN_ALARM_KEYS.lastTriggered, nowKey);
    localStorage.removeItem(HAVEN_ALARM_KEYS.snoozeUntil);

    if (typeof stopSleepBgm === "function") stopSleepBgm();

    document.body.classList.remove("sleep-mode");
    document.body.classList.add("alarm-mode");

    if (alarmRingingPanel) alarmRingingPanel.hidden = false;

    setAlarmImage("assets/sleep3.jpg");
    setAlarmMessage("……レイ。");

    alarmWakeTimer1 = setTimeout(function () {
        setAlarmImage("assets/sleep2.jpg");
        setAlarmMessage("起きる時間だ。");
    }, 2000);

    alarmWakeTimer2 = setTimeout(function () {
        setAlarmImage("assets/sleep.jpg");
    }, 4000);

    alarmWakeTimer3 = setTimeout(function () {
        setAlarmImage("assets/blink05.jpg");
        playAlarmSound();
    }, 6000);
}

function stopRingingUi() {
    alarmIsRinging = false;
    clearWakeSequence();
    stopAlarmSound();
    document.body.classList.remove("alarm-mode");
    if (alarmRingingPanel) alarmRingingPanel.hidden = true;
}

function wakeFromAlarm() {
    stopRingingUi();
    localStorage.removeItem(HAVEN_ALARM_KEYS.snoozeUntil);

    if (typeof stopSleepRecord === "function" && sleepStartTime) {
        stopSleepRecord();
    } else {
        setAlarmImage("assets/blink05.jpg");
        setAlarmMessage("……おはよう、レイ。");
        if (typeof scheduleNextBlink === "function") scheduleNextBlink();
    }

    updateAlarmPreview();
}

function snoozeAlarm() {
    stopRingingUi();

    const snoozeUntil = Date.now() + 5 * 60 * 1000;
    localStorage.setItem(HAVEN_ALARM_KEYS.snoozeUntil, String(snoozeUntil));

    document.body.classList.add("sleep-mode");
    setAlarmImage("assets/sleep3.jpg");
    setAlarmMessage("あと5分だ。……眠れ。");

    if (typeof startSleepBgm === "function") startSleepBgm();
    updateAlarmPreview();
}

function suppressAlarmForCurrentMinute() {
    const minuteKey = new Date().toISOString().slice(0, 16);
    localStorage.setItem(HAVEN_ALARM_KEYS.lastTriggered, minuteKey);
}

function shouldTriggerAlarm() {
    if (!isSavedAlarmEnabled() || alarmIsRinging) return false;

    // Havenのアラームは睡眠計測中だけ作動する。
    const activeSleepStart = Number(localStorage.getItem("sleepStartTime"));
    if (!activeSleepStart) return false;

    const now = Date.now();
    const snoozeUntil = getSnoozeUntil();

    if (snoozeUntil) return now >= snoozeUntil;

    const time = getSavedAlarmTime();
    const current = new Date();
    const currentTime =
        String(current.getHours()).padStart(2, "0") + ":" +
        String(current.getMinutes()).padStart(2, "0");

    if (currentTime !== time) return false;

    const minuteKey = current.toISOString().slice(0, 16);
    return localStorage.getItem(HAVEN_ALARM_KEYS.lastTriggered) !== minuteKey;
}

function checkAlarm() {
    if (shouldTriggerAlarm()) triggerAlarm();
    updateAlarmPreview();
}

function loadAlarmSettings() {
    if (alarmTimeInput) alarmTimeInput.value = getSavedAlarmTime();
    if (alarmEnabledInput) alarmEnabledInput.checked = isSavedAlarmEnabled();

    clearInterval(alarmCheckTimer);
    alarmCheckTimer = setInterval(checkAlarm, 1000);
    checkAlarm();
}

if (saveAlarmButton) saveAlarmButton.addEventListener("click", saveAlarmSettings);
if (alarmWakeButton) alarmWakeButton.addEventListener("click", wakeFromAlarm);
if (alarmSnoozeButton) alarmSnoozeButton.addEventListener("click", snoozeAlarm);

loadAlarmSettings();

