//========================
// 起動時
//========================

updateTimer();

updateClock();
setInterval(updateClock, 1000);

loadWeather();

preloadImages();
scheduleNextBlink();

message.textContent = getWelcomeMessage();
