//========================
// 音
//========================

const roomSound = new Audio("sound/clockloop.mp3");
roomSound.loop = true;
roomSound.volume = 0.15;

const startSound = new Audio("sound/start2.mp3");
startSound.volume = 0.4;

let penTimerId = null;

function playPenSound() {
    const sound = new Audio("sound/pen.mp3");
    sound.volume = 0.2;
    sound.play();

    const next = 15000 + Math.random() * 25000;
    penTimerId = setTimeout(playPenSound, next);
}

function startRoomSounds() {
    roomSound.play();

    if (penTimerId === null) {
        const firstPen = 8000 + Math.random() * 10000;
        penTimerId = setTimeout(playPenSound, firstPen);
    }
}

function stopPenSound() {
    clearTimeout(penTimerId);
    penTimerId = null;
}


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
    stopPenSound();

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
    stopPenSound();

    message.textContent = "止めた。だが戻ってこい。";
});

resetButton.addEventListener("click", function () {
    clearInterval(timerId);
    timerId = null;
    stopPenSound();

    mode = "work";
    timeLeft = 25 * 60;
    updateTimer();

    message.textContent = "仕切り直しだ、レイ。";
});

updateTimer();


//========================
// 瞬き
//========================

const sebas = document.getElementById("sebas");

const blinkFrames = [
    { src: "assets/blink05.jpg", time: 900 },
    { src: "assets/blink03.jpg", time: 1000 },
    { src: "assets/blink02.jpg", time: 80 },
    { src: "assets/blink01.jpg", time: 120 },
    { src: "assets/blink02.jpg", time: 80 },
    { src: "assets/blink03.jpg", time: 300 },
    { src: "assets/blink05.jpg", time: 600 }
];

function playBlink() {
    let i = 0;

    function nextFrame() {
        sebas.src = blinkFrames[i].src;
        const wait = blinkFrames[i].time;
        i++;

        if (i < blinkFrames.length) {
            setTimeout(nextFrame, wait);
        } else {
            scheduleNextBlink();
        }
    }

    nextFrame();
}

function scheduleNextBlink() {
    const randomWait = 10000 + Math.random() * 15000;
    setTimeout(playBlink, randomWait);
}

function preloadImages() {
    blinkFrames.forEach(frame => {
        const img = new Image();
        img.src = frame.src;
    });
}

preloadImages();
scheduleNextBlink();


//========================
// タスク追加
//========================

const taskInput = document.getElementById("taskInput");
const addTaskButton = document.getElementById("addTask");
const taskList = document.getElementById("taskList");

function addTask() {
    const text = taskInput.value.trim();

    if (text === "") return;

    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    const span = document.createElement("span");
    span.textContent = text;
    span.className = "task-text";

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "削除";
    deleteButton.className = "delete-task";

    checkbox.addEventListener("change", function () {
        span.classList.toggle("done");
    });

    deleteButton.addEventListener("click", function () {
        li.remove();
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteButton);

    taskList.appendChild(li);
    taskInput.value = "";
}

addTaskButton.addEventListener("click", addTask);

taskInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        addTask();
    }
});


//========================
// 時計
//========================

const clock = document.getElementById("clock");
const date = document.getElementById("date");

function updateClock() {
    const now = new Date();

    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    if (clock) {
        clock.textContent = `${hour}:${minute}:${second}`;
    }

    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    if (date) {
        date.textContent =
            `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }
}

updateClock();
setInterval(updateClock, 1000);


//========================
// 天気
//========================

async function loadWeather() {
    const temperature = document.getElementById("temperature");
    const pressure = document.getElementById("pressure");
    const humidity = document.getElementById("humidity");
    const weatherIcon = document.getElementById("weather-icon");

    if (!temperature || !pressure || !humidity || !weatherIcon) return;

    const url =
        "https://api.open-meteo.com/v1/forecast?latitude=34.6937&longitude=135.5023&current=temperature_2m,weather_code,surface_pressure,relative_humidity_2m";

    try {
        const response = await fetch(url);
        const data = await response.json();

        temperature.textContent = data.current.temperature_2m + "℃";
        pressure.textContent = data.current.surface_pressure + " hPa";
        humidity.textContent = "湿度 " + data.current.relative_humidity_2m + "%";

        const code = data.current.weather_code;
        currentWeatherCode = data.current.weather_code;
        currentPressure = data.current.surface_pressure;

        let icon = "☀";

        if (code >= 1 && code <= 3) icon = "⛅";
        if (code >= 45 && code <= 48) icon = "🌫";
        if (code >= 51 && code <= 67) icon = "🌦";
        if (code >= 71 && code <= 77) icon = "❄";
        if (code >= 80 && code <= 99) icon = "🌧";

        weatherIcon.textContent = icon;

    } catch (error) {
        temperature.textContent = "--℃";
        pressure.textContent = "---- hPa";
        humidity.textContent = "取得失敗";
        weatherIcon.textContent = "？";
    }
}

loadWeather();