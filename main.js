//========================
// 起動時
//========================

console.log("main.js 起動");

updateTimer();

updateClock();
setInterval(updateClock, 1000);

loadWeather();

preloadImages();
scheduleNextBlink();

console.log("起動処理完了");