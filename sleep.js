//========================
// 睡眠記録
//========================

let sleepStartTime =
    Number(localStorage.getItem("sleepStartTime")) || null;

let sleepTimerId = null;

const sleepTimer = document.getElementById("sleepTimer");
const sleepStatus = document.getElementById("sleepStatus");
const sleepStartButton = document.getElementById("sleepStart");
const sleepStopButton = document.getElementById("sleepStop");
const sleepResetButton = document.getElementById("sleepReset");
const sleepLastRecord = document.getElementById("sleepLastRecord");

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

    const now = Date.now();
    sleepTimer.textContent = formatSleepTime(now - sleepStartTime);
}

function startSleepRecord() {
    sleepStartTime = Date.now();

    localStorage.setItem("sleepStartTime", sleepStartTime);

    if (sleepStatus) {
        sleepStatus.textContent = "睡眠中";
    }

    updateSleepTimer();
    sleepTimerId = setInterval(updateSleepTimer, 1000);

    if (message) {
        message.textContent = "寝ろ、レイ。明日の脳を守れ。";
    }
}

function stopSleepRecord() {
    if (!sleepStartTime) return;

    const endTime = Date.now();
    const sleepDuration = endTime - sleepStartTime;

    const recordText = formatSleepTime(sleepDuration);

    localStorage.setItem("lastSleepDuration", recordText);
    localStorage.setItem("lastSleepDate", new Date().toLocaleDateString());

    localStorage.removeItem("sleepStartTime");

    clearInterval(sleepTimerId);
    sleepTimerId = null;
    sleepStartTime = null;

    if (sleepTimer) {
        sleepTimer.textContent = recordText;
    }

    if (sleepStatus) {
        sleepStatus.textContent = "記録完了";
    }

    if (sleepLastRecord) {
        sleepLastRecord.textContent = "前回の睡眠：" + recordText;
    }

    if (message) {
        message.textContent = getSleepComment(recordText);
    }
}

function resetSleepRecord() {
    localStorage.removeItem("sleepStartTime");
    localStorage.removeItem("lastSleepDuration");
    localStorage.removeItem("lastSleepDate");

    clearInterval(sleepTimerId);
    sleepTimerId = null;
    sleepStartTime = null;

    if (sleepTimer) {
        sleepTimer.textContent = "00:00:00";
    }

    if (sleepStatus) {
        sleepStatus.textContent = "まだ記録していません";
    }

    if (sleepLastRecord) {
        sleepLastRecord.textContent = "前回の睡眠：--";
    }
}

function getSleepComment(recordText) {
    const parts = recordText.split(":");
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes < 240) {
        return randomMessage(sleepComments.terrible);
    }

    if (totalMinutes < 360) {
        return randomMessage(sleepComments.short);
    }

    if (totalMinutes < 480) {
        return randomMessage(sleepComments.good);
    }

    return randomMessage(sleepComments.perfect);
}

function loadSleepRecord() {
    const lastSleepDuration = localStorage.getItem("lastSleepDuration");

    if (lastSleepDuration && sleepLastRecord) {
        sleepLastRecord.textContent = "前回の睡眠：" + lastSleepDuration;
    }

    if (sleepStartTime) {
        if (sleepStatus) {
            sleepStatus.textContent = "睡眠中";
        }

        updateSleepTimer();
        sleepTimerId = setInterval(updateSleepTimer, 1000);
    }
}

if (sleepStartButton) {
    sleepStartButton.addEventListener("click", startSleepRecord);
}

if (sleepStopButton) {
    sleepStopButton.addEventListener("click", stopSleepRecord);
}

if (sleepResetButton) {
    sleepResetButton.addEventListener("click", resetSleepRecord);
}