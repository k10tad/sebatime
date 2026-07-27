//========================
// Haven 天気・気圧
//========================

const HAVEN_WEATHER_CACHE_KEY = "havenLastWeather";
const HAVEN_WEATHER_REFRESH_MS = 15 * 60 * 1000;
let havenWeatherRetryTimer = null;
let havenWeatherRequest = null;

function getPressurePresentation(pressureValue) {
    const hour = new Date().getHours();
    const isNight = hour >= 18 || hour < 5;

    if (pressureValue <= 1005) {
        return {
            level: "気圧：低め",
            comment: "今日は無理をするな。静かに進めればいい。"
        };
    }

    if (pressureValue >= 1017) {
        return {
            level: "気圧：高め",
            comment: isNight
                ? "頭は冴えそうだ。だが夜更かしはほどほどにな。"
                : "今日は調子が出そうだ。"
        };
    }

    return {
        level: "気圧：安定",
        comment: isNight
            ? "静かな夜だ。焦らず進めよう。"
            : "いいペースで進めよう。"
    };
}

function getWeatherIcon(code) {
    const hour = new Date().getHours();
    const isNight = hour >= 18 || hour < 5;

    if (code === 0) return isNight ? "☾" : "☀";
    if (code >= 1 && code <= 3) return isNight ? "☾" : "⛅";
    if (code >= 45 && code <= 48) return "🌫";
    if (code >= 51 && code <= 67) return "🌦";
    if (code >= 71 && code <= 77) return "❄";
    if (code >= 80 && code <= 99) return "🌧";
    return "☁";
}


function applyWeatherAtmosphere(code) {
    document.body.classList.remove("weather-rain", "weather-fog", "weather-snow");

    if (code >= 45 && code <= 48) {
        document.body.classList.add("weather-fog");
    } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 99)) {
        document.body.classList.add("weather-rain");
    } else if (code >= 71 && code <= 77) {
        document.body.classList.add("weather-snow");
    }
}

function renderWeather(current) {
    const temperature = document.getElementById("temperature");
    const pressure = document.getElementById("pressure");
    const humidity = document.getElementById("humidity");
    const weatherIcon = document.getElementById("weather-icon");
    const pressureLevel = document.getElementById("pressure-level");
    const weatherComment = document.getElementById("weather-comment");

    if (!temperature || !pressure || !humidity || !weatherIcon || !pressureLevel || !weatherComment) return false;

    const code = Number(current.weather_code);
    const pressureValue = Number(current.surface_pressure);
    const temperatureValue = Number(current.temperature_2m);
    const humidityValue = Number(current.relative_humidity_2m);

    if (![code, pressureValue, temperatureValue, humidityValue].every(Number.isFinite)) {
        throw new Error("Weather data contains invalid values");
    }

    const presentation = getPressurePresentation(pressureValue);
    temperature.textContent = `${Math.round(temperatureValue)}℃`;
    pressure.textContent = `${pressureValue.toFixed(1)} hPa`;
    humidity.textContent = `湿度 ${Math.round(humidityValue)}%`;
    weatherIcon.textContent = getWeatherIcon(code);
    pressureLevel.textContent = presentation.level;
    weatherComment.textContent = presentation.comment;
    applyWeatherAtmosphere(code);

    currentWeatherCode = code;
    currentPressure = pressureValue;
    return true;
}

function showWeatherUnavailable() {
    const temperature = document.getElementById("temperature");
    const pressure = document.getElementById("pressure");
    const humidity = document.getElementById("humidity");
    const weatherIcon = document.getElementById("weather-icon");
    const pressureLevel = document.getElementById("pressure-level");
    const weatherComment = document.getElementById("weather-comment");
    if (temperature) temperature.textContent = "--℃";
    if (pressure) pressure.textContent = "---- hPa";
    if (humidity) humidity.textContent = "湿度 --%";
    if (weatherIcon) weatherIcon.textContent = "✦";
    if (pressureLevel) pressureLevel.textContent = "気圧：再取得中";
    if (weatherComment) weatherComment.textContent = "通信を確かめている。少し待て。";
    document.body.classList.remove("weather-rain", "weather-fog", "weather-snow");
}

async function loadWeather() {
    if (havenWeatherRequest) return havenWeatherRequest;

    const location = typeof getHavenWeatherLocation === "function"
        ? getHavenWeatherLocation()
        : { latitude: 34.6937, longitude: 135.5023 };
    const parameters = new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        current: "temperature_2m,weather_code,surface_pressure,relative_humidity_2m",
        timezone: "Asia/Tokyo",
        forecast_days: "1"
    });
    const url = `https://api.open-meteo.com/v1/forecast?${parameters}`;

    havenWeatherRequest = (async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        try {
            const response = await fetch(url, {
                cache: "no-store",
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`Weather request failed: ${response.status}`);
            }

            const data = await response.json();
            if (!data.current) {
                throw new Error("Weather data is missing current values");
            }

            renderWeather(data.current);
            localStorage.setItem(HAVEN_WEATHER_CACHE_KEY, JSON.stringify({
                savedAt: Date.now(),
                current: data.current
            }));
            clearTimeout(havenWeatherRetryTimer);
        } catch (error) {
            let restored = false;
            try {
                const cached = JSON.parse(localStorage.getItem(HAVEN_WEATHER_CACHE_KEY));
                restored = Boolean(cached?.current) && renderWeather(cached.current);
            } catch (_) {}
            if (!restored) showWeatherUnavailable();
            clearTimeout(havenWeatherRetryTimer);
            havenWeatherRetryTimer = setTimeout(loadWeather, 20000);
            console.error("Haven weather error:", error);
        } finally {
            clearTimeout(timeout);
            havenWeatherRequest = null;
        }
    })();

    return havenWeatherRequest;
}

setInterval(loadWeather, HAVEN_WEATHER_REFRESH_MS);
