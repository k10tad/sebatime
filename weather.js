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

        currentWeatherCode = code;
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
        console.error(error);
    }
}
