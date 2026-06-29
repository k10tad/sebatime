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