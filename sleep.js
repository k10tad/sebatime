//========================
// Haven Sleep Engine
// 睡眠計測と寝顔だけを管理する
//========================

const HAVEN_SLEEP_KEYS = {
    start: "sleepStartTime",
    startedAt: "havenSleepStartedAt",
    lastDuration: "lastSleepDuration",
    lastDate: "lastSleepDate"
};

let sleepStartTime = Number(localStorage.getItem(HAVEN_SLEEP_KEYS.start)) || null;
let sleepTimerId = null;
let sleepImageTimer1 = null;
let sleepImageTimer2 = null;
let sleepCommentTimer = null;

const sleepTimer = document.getElementById("sleepTimer");
const sleepStatus = document.getElementById("sleepStatus");
const sleepStartButton = document.getElementById("sleepStart");
const sleepStopButton = document.getElementById("sleepStop");
const sleepResetButton = document.getElementById("sleepReset");
const sleepLastRecord = document.getElementById("sleepLastRecord");
const sleepSebas = document.getElementById("sleepSebas");
const sleepMessage = document.getElementById("sleepMessage");

function getHavenName() {
    return typeof getHavenUserName === "function" ? getHavenUserName() : "レイ";
}

function getHomeSebasImg() {
    return document.getElementById("sebas");
}

function getHomeMessageBox() {
    return document.getElementById("message");
}

function setSleepImages(src) {
    const home = getHomeSebasImg();
    if (home) home.src = src;
    if (sleepSebas) sleepSebas.src = src;
}

function setSleepMessages(text) {
    const home = getHomeMessageBox();
    if (home) home.textContent = text;
    if (sleepMessage) sleepMessage.textContent = text;
}

function formatSleepTime(milliseconds) {
    const total = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return [hours, minutes, seconds]
        .map(value => String(value).padStart(2, "0"))
        .join(":");
}

function updateSleepTimer() {
    if (!sleepStartTime || !sleepTimer) return;
    sleepTimer.textContent = formatSleepTime(Date.now() - sleepStartTime);
}

function clearSleepTimers() {
    clearInterval(sleepTimerId);
    clearTimeout(sleepImageTimer1);
    clearTimeout(sleepImageTimer2);
    clearTimeout(sleepCommentTimer);
    sleepTimerId = null;
    sleepImageTimer1 = null;
    sleepImageTimer2 = null;
    sleepCommentTimer = null;
}

function beginSleepVisuals() {
    clearTimeout(sleepImageTimer1);
    clearTimeout(sleepImageTimer2);
    document.body.classList.add("sleep-mode");
    setSleepImages("assets/sleep.jpg");

    sleepImageTimer1 = setTimeout(function () {
        setSleepImages("assets/sleep2.jpg");
    }, 15000);

    sleepImageTimer2 = setTimeout(function () {
        setSleepImages("assets/sleep3.jpg");
    }, 30000);
}

function startSleepRecord() {
    if (typeof cancelActiveAlarm === "function") cancelActiveAlarm();
    if (typeof armAlarmAudio === "function") armAlarmAudio();

    sleepStartTime = Date.now();
    localStorage.setItem(HAVEN_SLEEP_KEYS.start, String(sleepStartTime));
    localStorage.setItem(HAVEN_SLEEP_KEYS.startedAt, String(sleepStartTime));

    clearSleepTimers();
    beginSleepVisuals();

    if (sleepStatus) sleepStatus.textContent = "睡眠中";
    setSleepMessages(`……おやすみ、${getHavenName()}。今日はもう何も考えなくていい。`);

    updateSleepTimer();
    sleepTimerId = setInterval(updateSleepTimer, 1000);

    if (typeof startSleepBgm === "function") startSleepBgm();
}

function getSleepComment(recordText) {
    const [hours, minutes] = recordText.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    const name = getHavenName();

    if (totalMinutes < 240) return `短いな。今日は無理をするな、${name}。`;
    if (totalMinutes < 360) return "少し短い。起きたなら、まず水を飲め。";
    if (totalMinutes < 480) return "悪くない睡眠だ。よく戻ってきた。";
    return "よく眠れたな。今日は少し身体が軽いはずだ。";
}

function stopSleepRecord() {
    if (!sleepStartTime) return;

    const recordText = formatSleepTime(Date.now() - sleepStartTime);
    localStorage.setItem(HAVEN_SLEEP_KEYS.lastDuration, recordText);
    localStorage.setItem(HAVEN_SLEEP_KEYS.lastDate, new Date().toLocaleDateString());
    localStorage.removeItem(HAVEN_SLEEP_KEYS.start);
    localStorage.removeItem(HAVEN_SLEEP_KEYS.startedAt);

    sleepStartTime = null;
    clearSleepTimers();

    if (typeof stopSleepBgm === "function") stopSleepBgm();
    document.body.classList.remove("sleep-mode", "alarm-mode");

    setSleepImages("assets/blink05.jpg");
    if (typeof scheduleNextBlink === "function") scheduleNextBlink();

    if (sleepTimer) sleepTimer.textContent = recordText;
    if (sleepStatus) sleepStatus.textContent = "記録完了";
    if (sleepLastRecord) sleepLastRecord.textContent = "前回の睡眠：" + recordText;

    setSleepMessages(`……おはよう、${getHavenName()}。`);
    sleepCommentTimer = setTimeout(function () {
        setSleepMessages(getSleepComment(recordText));
    }, 3000);
}

function resetSleepRecord() {
    localStorage.removeItem(HAVEN_SLEEP_KEYS.start);
    localStorage.removeItem(HAVEN_SLEEP_KEYS.startedAt);
    localStorage.removeItem(HAVEN_SLEEP_KEYS.lastDuration);
    localStorage.removeItem(HAVEN_SLEEP_KEYS.lastDate);

    sleepStartTime = null;
    clearSleepTimers();

    if (typeof stopSleepBgm === "function") stopSleepBgm();
    if (typeof cancelActiveAlarm === "function") cancelActiveAlarm();
    document.body.classList.remove("sleep-mode", "alarm-mode");

    setSleepImages("assets/blink05.jpg");
    if (typeof scheduleNextBlink === "function") scheduleNextBlink();

    if (sleepTimer) sleepTimer.textContent = "00:00:00";
    if (sleepStatus) sleepStatus.textContent = "まだ記録していません";
    if (sleepLastRecord) sleepLastRecord.textContent = "前回の睡眠：--";
    setSleepMessages("睡眠記録をリセットした。");
}

function loadSleepRecord() {
    const last = localStorage.getItem(HAVEN_SLEEP_KEYS.lastDuration);
    if (last && sleepLastRecord) sleepLastRecord.textContent = "前回の睡眠：" + last;

    if (!sleepStartTime) {
        if (sleepSebas) sleepSebas.src = "assets/sleep.jpg";
        return;
    }

    document.body.classList.add("sleep-mode");
    setSleepImages("assets/sleep3.jpg");
    setSleepMessages("……睡眠中だ。");
    if (sleepStatus) sleepStatus.textContent = "睡眠中";

    updateSleepTimer();
    sleepTimerId = setInterval(updateSleepTimer, 1000);

    // 自動復元ではSafariの制約で鳴らない場合がある。
    // 最初のタップ時にsound.jsがdesired modeを再開する。
    if (typeof startSleepBgm === "function") startSleepBgm();
}

if (sleepStartButton) sleepStartButton.addEventListener("click", startSleepRecord);
if (sleepStopButton) sleepStopButton.addEventListener("click", stopSleepRecord);
if (sleepResetButton) sleepResetButton.addEventListener("click", resetSleepRecord);

loadSleepRecord();
