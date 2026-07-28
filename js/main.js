//========================
// Haven 起動時
//========================

restoreWorkSession();

updateClock();
setInterval(updateClock, 1000);

loadWeather();

if (message && typeof getDailyFlowMessage === "function") {
    const eventLine = typeof window.getHavenEventDialogue === "function"
        ? window.getHavenEventDialogue("living")
        : "";
    message.textContent = eventLine || getDailyFlowMessage();
}
