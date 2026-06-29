//========================
// 起動時
//========================

console.log("main.js start");

updateTimer();
console.log("timer OK");

updateClock();
setInterval(updateClock, 1000);
console.log("clock OK");

loadWeather();
console.log("weather called");

preloadImages();
console.log("preload OK");

scheduleNextBlink();
console.log("blink called");

console.log("main end");

