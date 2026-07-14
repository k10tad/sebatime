//========================
// Haven 起動時
//========================

restoreWorkSession();

updateClock();
setInterval(updateClock, 1000);

loadWeather();

preloadImages();
scheduleNextBlink();

if (message && typeof getDailyFlowMessage === "function") {
    message.textContent = getDailyFlowMessage();
}

