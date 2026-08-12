//========================
// Haven 天気・気圧
//========================

const HAVEN_WEATHER_CACHE_KEY = "havenLastWeather";
const HAVEN_WEATHER_REFRESH_MS = 15 * 60 * 1000;
const HAVEN_WEATHER_CACHE_MS = 30 * 60 * 1000;
let havenWeatherRetryTimer = null;
let havenWeatherRequest = null;

function normalizeHavenRegionQuery(region) {
    return String(region || "").trim().replace(/\s+/g, " ");
}

function normalizeHavenPlaceName(value) {
    return String(value || "").trim().replace(/[市区町村都道府県]$/, "").toLocaleLowerCase("ja");
}

async function resolveHavenWeatherLocation(region) {
    const query = normalizeHavenRegionQuery(region);
    if (query.length < 2) throw new Error("地域名をもう少し詳しく入力しろ。");

    const parameters = new URLSearchParams({
        name: query,
        count: "10",
        language: "ja",
        format: "json"
    });
    if (/[ぁ-んァ-ヶ一-龠々]/.test(query)) parameters.set("countryCode", "JP");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${parameters}`, {
            cache: "no-store",
            signal: controller.signal
        });
        if (!response.ok) throw new Error("地域を確認できなかった。もう一度試せ。");

        const data = await response.json();
        const candidates = Array.isArray(data.results) ? data.results : [];
        const normalizedQuery = normalizeHavenPlaceName(query);
        const place = candidates.find(candidate => normalizeHavenPlaceName(candidate.name) === normalizedQuery)
            || candidates.find(candidate => normalizeHavenPlaceName(candidate.admin1) === normalizedQuery)
            || candidates[0];
        if (!place) throw new Error("地域が見つからなかった。市区町村名で試せ。");

        const names = [place.name, place.admin1, place.country]
            .filter(Boolean)
            .filter((value, index, values) => values.indexOf(value) === index);
        return {
            query,
            prefecture: String(place.admin1 || ""),
            city: String(place.name || query),
            displayName: names.join("・") || query,
            latitude: Number(place.latitude),
            longitude: Number(place.longitude),
            timezone: String(place.timezone || "auto")
        };
    } catch (error) {
        if (error?.name === "AbortError") throw new Error("地域の確認に時間がかかっている。通信を確かめろ。");
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

function getHavenWeatherLocationKey(location) {
    return `${Number(location.latitude).toFixed(4)},${Number(location.longitude).toFixed(4)}`;
}

function readHavenWeatherCache(location) {
    try {
        const cached = JSON.parse(localStorage.getItem(HAVEN_WEATHER_CACHE_KEY));
        const matchesLocation = !cached?.locationKey
            || cached.locationKey === getHavenWeatherLocationKey(location);
        if (cached?.current && matchesLocation && Date.now() - Number(cached.savedAt || 0) < HAVEN_WEATHER_CACHE_MS) {
            return cached.current;
        }
    } catch (_) {}
    return null;
}

function clearHavenWeatherCache() {
    localStorage.removeItem(HAVEN_WEATHER_CACHE_KEY);
}

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
    const pressureValue = Number(current.pressure_msl ?? current.surface_pressure);
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

async function loadWeather(force = false) {
    if (havenWeatherRequest) return havenWeatherRequest;

    const location = typeof getHavenWeatherLocation === "function"
        ? getHavenWeatherLocation()
        : { latitude: 34.6937, longitude: 135.5023, timezone: "Asia/Tokyo" };

    if (!force) {
        const cachedCurrent = readHavenWeatherCache(location);
        if (cachedCurrent) {
            renderWeather(cachedCurrent);
            return true;
        }
    }

    const parameters = new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        current: "temperature_2m,weather_code,pressure_msl,relative_humidity_2m",
        timezone: String(location.timezone || "auto"),
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
                locationKey: getHavenWeatherLocationKey(location),
                current: data.current
            }));
            clearTimeout(havenWeatherRetryTimer);
        } catch (error) {
            let restored = false;
            try {
                const cached = JSON.parse(localStorage.getItem(HAVEN_WEATHER_CACHE_KEY));
                const matchesLocation = !cached?.locationKey
                    || cached.locationKey === getHavenWeatherLocationKey(location);
                restored = Boolean(cached?.current) && matchesLocation && renderWeather(cached.current);
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

window.resolveHavenWeatherLocation = resolveHavenWeatherLocation;
window.clearHavenWeatherCache = clearHavenWeatherCache;
