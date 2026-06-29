//========================
// 起動時
//========================

checkNewDay();

updateTimer();
updateFocusDisplay();

updateClock();
setInterval(updateClock, 1000);

loadWeather();

preloadImages();
scheduleNextBlink();

message.textContent = getWelcomeMessage();
