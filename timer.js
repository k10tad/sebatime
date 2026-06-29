//========================
// ポモドーロタイマー
//========================

let mode = "work";
let timeLeft = 25 * 60;
let timerId = null;

const timer = document.getElementById("timer");
const startButton = document.getElementById("start");
const pauseButton = document.getElementById("pause");
const resetButton = document.getElementById("reset");
const message = document.getElementById("message");

let currentWeatherCode = null;
let currentPressure = null;

function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    timer.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");

    timer.style.transform = "scale(1.05)";
    setTimeout(() => {
        timer.style.transform = "scale(1)";
    }, 120);
}

function switchMode() {
   stopRoomSounds();

    if (mode === "work") {
        mode = "break";
        timeLeft = 5 * 60;
        message.textContent = randomMessage(breakMessages);
    } else {
        mode = "work";
        timeLeft = 25 * 60;
        message.textContent = randomMessage(getMessageList(currentWeatherCode, currentPressure));
    }

    updateTimer();
}

startButton.addEventListener("click", function () {
    if (timerId !== null) return;

    startSound.currentTime = 0;
    startSound.play();

    startRoomSounds();

    if (mode === "work") {
        message.textContent = randomMessage(getMessageList(currentWeatherCode, currentPressure));
    } else {
        message.textContent = randomMessage(breakMessages);
    }

    timerId = setInterval(function () {
        timeLeft--;
        updateTimer();

        if (timeLeft <= 0) {
            clearInterval(timerId);
            timerId = null;
            switchMode();
        }
    }, 1000);
});

pauseButton.addEventListener("click", function () {
    if (timerId === null) return;

    clearInterval(timerId);
    timerId = null;
    stopRoomSounds();

    message.textContent = "止めた。だが戻ってこい。";
});

resetButton.addEventListener("click", function () {
    clearInterval(timerId);
    timerId = null;
    stopRoomSounds();

    mode = "work";
    timeLeft = 25 * 60;
    updateTimer();

    message.textContent = "仕切り直しだ、レイ。";
});

updateTimer();