//========================
// 睡眠記録 スマホ安定版
//========================

let sleepStartTime = Number(localStorage.getItem("sleepStartTime")) || null;
let sleepTimerId = null;
let sleepImageTimer1 = null;
let sleepImageTimer2 = null;

const sleepTimer = document.getElementById("sleepTimer");
const sleepStatus = document.getElementById("sleepStatus");
const sleepStartButton = document.getElementById("sleepStart");
const sleepStopButton = document.getElementById("sleepStop");
const sleepResetButton = document.getElementById("sleepReset");
const sleepLastRecord = document.getElementById("sleepLastRecord");
const sleepSebas = document.getElementById("sleepSebas");
const sleepMessage = document.getElementById("sleepMessage");

const wakeMessages = [
    "……おはよう、レイ。",
    "起きたか。",
    "朝だ。",
    "よく眠れたか？",
    "おはよう。体調はどうだ。",
    "……まだ眠そうだな。"
];

function pickMessage(list) {
    if (!Array.isArray(list) || list.length === 0) return "";
    return list[Math.floor(Math.random() * list.length)];
}

function getHomeSebasImg() {
    return document.getElementById("sebas");
}

function getHomeMessageBox() {
    return document.getElementById("message");
}

function setSleepImages(src) {
    const homeImg = getHomeSebasImg();
    if (homeImg) homeImg.src = src;
    if (sleepSebas) sleepSebas.src = src;
}

function setSleepMessages(text) {
    const homeBox = getHomeMessageBox();
    if (homeBox) homeBox.textContent = text;
    if (sleepMessage) sleepMessage.textContent = text;
}

function formatSleepTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return (
        String(hours).padStart(2, "0") + ":" +
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0")
    );
}

function updateSleepTimer() {
    if (!sleepStartTime || !sleepTimer) return;
    sleepTimer.textContent = formatSleepTime(Date.now() - sleepStartTime);
}

function startSleepRecord() {
    if (typeof unlockAudio === "function") unlockAudio();
    if (typeof armAlarmAudio === "function") armAlarmAudio();

    sleepStartTime = Date.now();
    localStorage.setItem("sleepStartTime", sleepStartTime);

    clearInterval(sleepTimerId);
    clearTimeout(sleepImageTimer1);
    clearTimeout(sleepImageTimer2);

    document.body.classList.add("sleep-mode");

    setSleepImages("assets/sleep.jpg");
    setSleepMessages("……おやすみ、レイ。今日はもう何も考えなくていい。");

    sleepImageTimer1 = setTimeout(function () {
        setSleepImages("assets/sleep2.jpg");
    }, 15000);

    sleepImageTimer2 = setTimeout(function () {
        setSleepImages("assets/sleep3.jpg");
    }, 30000);

    if (sleepStatus) sleepStatus.textContent = "睡眠中";

    updateSleepTimer();
    sleepTimerId = setInterval(updateSleepTimer, 1000);

    if (typeof startSleepBgm === "function") startSleepBgm();
}

function stopSleepRecord() {
    if (!sleepStartTime) return;

    const recordText = formatSleepTime(Date.now() - sleepStartTime);

    localStorage.setItem("lastSleepDuration", recordText);
    localStorage.setItem("lastSleepDate", new Date().toLocaleDateString());
    localStorage.removeItem("sleepStartTime");

    sleepStartTime = null;
    clearInterval(sleepTimerId);
    clearTimeout(sleepImageTimer1);
    clearTimeout(sleepImageTimer2);
    sleepTimerId = null;
    sleepImageTimer1 = null;
    sleepImageTimer2 = null;

    if (typeof stopSleepBgm === "function") stopSleepBgm();
    document.body.classList.remove("sleep-mode");

    setSleepImages("assets/blink05.jpg");
    if (typeof scheduleNextBlink === "function") scheduleNextBlink();

    if (sleepTimer) sleepTimer.textContent = recordText;
    if (sleepStatus) sleepStatus.textContent = "記録完了";
    if (sleepLastRecord) sleepLastRecord.textContent = "前回の睡眠：" + recordText;

    setSleepMessages(pickMessage(wakeMessages));
    setTimeout(function () {
        setSleepMessages(getSimpleSleepComment(recordText));
    }, 3000);
}

function resetSleepRecord() {
    localStorage.removeItem("sleepStartTime");
    localStorage.removeItem("lastSleepDuration");
    localStorage.removeItem("lastSleepDate");

    sleepStartTime = null;
    clearInterval(sleepTimerId);
    clearTimeout(sleepImageTimer1);
    clearTimeout(sleepImageTimer2);
    sleepTimerId = null;
    sleepImageTimer1 = null;
    sleepImageTimer2 = null;

    if (typeof stopSleepBgm === "function") stopSleepBgm();
    document.body.classList.remove("sleep-mode");

    setSleepImages("assets/blink05.jpg");
    if (typeof scheduleNextBlink === "function") scheduleNextBlink();

    if (sleepTimer) sleepTimer.textContent = "00:00:00";
    if (sleepStatus) sleepStatus.textContent = "まだ記録していません";
    if (sleepLastRecord) sleepLastRecord.textContent = "前回の睡眠：--";

    setSleepMessages("睡眠記録をリセットした。");
}

function getSimpleSleepComment(recordText) {
    const parts = recordText.split(":");
    const totalMinutes = Number(parts[0]) * 60 + Number(parts[1]);

    if (totalMinutes < 240) return "短いな。今日は無理をするな、レイ。";
    if (totalMinutes < 360) return "少し短い。だが、起きたなら水を飲め。";
    if (totalMinutes < 480) return "悪くない睡眠だ。よく戻ってきた。";
    return "よく眠れたな。今日は少し身体が軽いはずだ。";
}

function loadSleepRecord() {
    const lastSleepDuration = localStorage.getItem("lastSleepDuration");

    if (lastSleepDuration && sleepLastRecord) {
        sleepLastRecord.textContent = "前回の睡眠：" + lastSleepDuration;
    }

    if (sleepStartTime) {
        document.body.classList.add("sleep-mode");
        if (sleepStatus) sleepStatus.textContent = "睡眠中";

        setSleepImages("assets/sleep3.jpg");
        setSleepMessages("……睡眠中だ。");

        updateSleepTimer();
        clearInterval(sleepTimerId);
        sleepTimerId = setInterval(updateSleepTimer, 1000);

        if (typeof startSleepBgm === "function") startSleepBgm();
    } else {
        if (sleepSebas) sleepSebas.src = "assets/sleep.jpg";
    }
}

if (sleepStartButton) sleepStartButton.addEventListener("click", startSleepRecord);
if (sleepStopButton) sleepStopButton.addEventListener("click", stopSleepRecord);
if (sleepResetButton) sleepResetButton.addEventListener("click", resetSleepRecord);

loadSleepRecord();
