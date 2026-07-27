//========================
// Haven Settings Engine
// 設定保存と画面反映だけを管理する
//========================

const HAVEN_SETTINGS_KEY = "havenSettings";
const HAVEN_FIXED_SLEEP_PERCENT = 78;
const HAVEN_PREFECTURES = [
    ["hokkaido", "北海道", 43.0618, 141.3545],
    ["aomori", "青森県", 40.8244, 140.7400],
    ["iwate", "岩手県", 39.7036, 141.1527],
    ["miyagi", "宮城県", 38.2682, 140.8694],
    ["akita", "秋田県", 39.7186, 140.1024],
    ["yamagata", "山形県", 38.2404, 140.3633],
    ["fukushima", "福島県", 37.7503, 140.4676],
    ["ibaraki", "茨城県", 36.3418, 140.4468],
    ["tochigi", "栃木県", 36.5657, 139.8836],
    ["gunma", "群馬県", 36.3912, 139.0608],
    ["saitama", "埼玉県", 35.8569, 139.6489],
    ["chiba", "千葉県", 35.6046, 140.1233],
    ["tokyo", "東京都", 35.6762, 139.6503],
    ["kanagawa", "神奈川県", 35.4478, 139.6425],
    ["niigata", "新潟県", 37.9026, 139.0232],
    ["toyama", "富山県", 36.6953, 137.2113],
    ["ishikawa", "石川県", 36.5947, 136.6256],
    ["fukui", "福井県", 36.0652, 136.2216],
    ["yamanashi", "山梨県", 35.6642, 138.5684],
    ["nagano", "長野県", 36.6513, 138.1810],
    ["gifu", "岐阜県", 35.3912, 136.7223],
    ["shizuoka", "静岡県", 34.9769, 138.3831],
    ["aichi", "愛知県", 35.1802, 136.9066],
    ["mie", "三重県", 34.7303, 136.5086],
    ["shiga", "滋賀県", 35.0045, 135.8686],
    ["kyoto", "京都府", 35.0116, 135.7681],
    ["osaka", "大阪府", 34.6937, 135.5023],
    ["hyogo", "兵庫県", 34.6913, 135.1830],
    ["nara", "奈良県", 34.6851, 135.8048],
    ["wakayama", "和歌山県", 34.2260, 135.1675],
    ["tottori", "鳥取県", 35.5039, 134.2381],
    ["shimane", "島根県", 35.4723, 133.0505],
    ["okayama", "岡山県", 34.6618, 133.9350],
    ["hiroshima", "広島県", 34.3966, 132.4596],
    ["yamaguchi", "山口県", 34.1859, 131.4714],
    ["tokushima", "徳島県", 34.0658, 134.5593],
    ["kagawa", "香川県", 34.3401, 134.0434],
    ["ehime", "愛媛県", 33.8416, 132.7657],
    ["kochi", "高知県", 33.5597, 133.5311],
    ["fukuoka", "福岡県", 33.5904, 130.4017],
    ["saga", "佐賀県", 33.2494, 130.2988],
    ["nagasaki", "長崎県", 32.7503, 129.8777],
    ["kumamoto", "熊本県", 32.8031, 130.7079],
    ["oita", "大分県", 33.2382, 131.6126],
    ["miyazaki", "宮崎県", 31.9077, 131.4239],
    ["kagoshima", "鹿児島県", 31.5966, 130.5571],
    ["okinawa", "沖縄県", 26.2124, 127.6809]
].map(([id, label, latitude, longitude]) => ({ id, label, latitude, longitude }));

const havenDefaultSettings = {
    userName: "レイ",
    weatherPrefecture: "osaka",
    bgmVolume: 18,
    livingVolume: 15,
    sleepVolume: HAVEN_FIXED_SLEEP_PERCENT,
    idleFrequency: "normal"
};

function clampSetting(value, min, max) {
    return Math.min(max, Math.max(min, Number(value)));
}

function loadHavenSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(HAVEN_SETTINGS_KEY));
        return {
            ...havenDefaultSettings,
            ...(saved && typeof saved === "object" ? saved : {}),
            userName: String(saved?.userName || "レイ").trim() || "レイ",
            weatherPrefecture: HAVEN_PREFECTURES.some(item => item.id === saved?.weatherPrefecture)
                ? saved.weatherPrefecture
                : "osaka",
            bgmVolume: clampSetting(saved?.bgmVolume ?? 18, 0, 100),
            livingVolume: clampSetting(saved?.livingVolume ?? 15, 0, 100),
            sleepVolume: HAVEN_FIXED_SLEEP_PERCENT,
            idleFrequency: ["low", "normal", "high"].includes(saved?.idleFrequency)
                ? saved.idleFrequency
                : "normal"
        };
    } catch (_) {
        return { ...havenDefaultSettings };
    }
}

let havenSettings = loadHavenSettings();
let lastSavedUserName = havenSettings.userName;

const userNameInput = document.getElementById("userNameInput");
const weatherPrefectureInput = document.getElementById("weatherPrefecture");
const bgmVolumeInput = document.getElementById("bgmVolume");
const livingVolumeInput = document.getElementById("livingVolume");
const sleepVolumeInput = document.getElementById("sleepVolume");
const bgmVolumeValue = document.getElementById("bgmVolumeValue");
const livingVolumeValue = document.getElementById("livingVolumeValue");
const sleepVolumeValue = document.getElementById("sleepVolumeValue");
const saveSettingsButton = document.getElementById("saveSettings");
const resetSettingsButton = document.getElementById("resetSettings");
const settingsSavedMessage = document.getElementById("settingsSavedMessage");
const frequencyInputs = Array.from(document.querySelectorAll('input[name="idleFrequency"]'));

function saveHavenSettings() {
    havenSettings.sleepVolume = HAVEN_FIXED_SLEEP_PERCENT;
    localStorage.setItem(HAVEN_SETTINGS_KEY, JSON.stringify(havenSettings));
}

function getHavenUserName() {
    return havenSettings.userName || "レイ";
}

function getHavenWeatherLocation() {
    return HAVEN_PREFECTURES.find(item => item.id === havenSettings.weatherPrefecture)
        || HAVEN_PREFECTURES.find(item => item.id === "osaka");
}

function personalizeHavenText(text) {
    return typeof text === "string" ? text.replaceAll("レイ", getHavenUserName()) : text;
}

function updateVisibleName(oldName, newName) {
    ["message", "sleepMessage", "alarmWakeMessage"]
        .map(id => document.getElementById(id))
        .filter(Boolean)
        .forEach(function (element) {
            element.textContent = (element.textContent || "")
                .replaceAll(oldName, newName)
                .replaceAll("レイ", newName);
        });
}

function getHavenIdleDelay(stage = "next") {
    const ranges = {
        low: { first: { min: 180000, max: 300000 }, next: { min: 420000, max: 720000 } },
        normal: { first: { min: 90000, max: 180000 }, next: { min: 180000, max: 420000 } },
        high: { first: { min: 45000, max: 90000 }, next: { min: 90000, max: 210000 } }
    };
    return ranges[havenSettings.idleFrequency][stage];
}

function updateLabels() {
    if (bgmVolumeValue && bgmVolumeInput) bgmVolumeValue.textContent = bgmVolumeInput.value + "%";
    if (livingVolumeValue && livingVolumeInput) livingVolumeValue.textContent = livingVolumeInput.value + "%";
    if (sleepVolumeValue) sleepVolumeValue.textContent = `固定 ${HAVEN_FIXED_SLEEP_PERCENT}%`;
}

function fillSettingsForm() {
    if (userNameInput) userNameInput.value = havenSettings.userName;
    if (weatherPrefectureInput) {
        weatherPrefectureInput.replaceChildren(...HAVEN_PREFECTURES.map(function (prefecture) {
            const option = document.createElement("option");
            option.value = prefecture.id;
            option.textContent = prefecture.label;
            return option;
        }));
        weatherPrefectureInput.value = havenSettings.weatherPrefecture;
    }
    if (bgmVolumeInput) bgmVolumeInput.value = havenSettings.bgmVolume;
    if (livingVolumeInput) livingVolumeInput.value = havenSettings.livingVolume;
    if (sleepVolumeInput) {
        sleepVolumeInput.value = HAVEN_FIXED_SLEEP_PERCENT;
        sleepVolumeInput.disabled = true;
        sleepVolumeInput.setAttribute("aria-disabled", "true");
        sleepVolumeInput.title = "寝息はコード側で固定されています";
    }
    frequencyInputs.forEach(input => input.checked = input.value === havenSettings.idleFrequency);
    updateLabels();
}

function readSettingsForm() {
    const selected = frequencyInputs.find(input => input.checked);
    return {
        userName: String(userNameInput?.value || "レイ").trim() || "レイ",
        weatherPrefecture: HAVEN_PREFECTURES.some(item => item.id === weatherPrefectureInput?.value)
            ? weatherPrefectureInput.value
            : "osaka",
        bgmVolume: clampSetting(bgmVolumeInput?.value ?? 18, 0, 100),
        livingVolume: clampSetting(livingVolumeInput?.value ?? 15, 0, 100),
        sleepVolume: HAVEN_FIXED_SLEEP_PERCENT,
        idleFrequency: selected?.value || "normal"
    };
}

function showSaved(text) {
    if (!settingsSavedMessage) return;
    settingsSavedMessage.textContent = text;
    settingsSavedMessage.classList.add("visible");
    clearTimeout(showSaved.timer);
    showSaved.timer = setTimeout(() => settingsSavedMessage.classList.remove("visible"), 2400);
}

function commitSettings() {
    const oldName = lastSavedUserName;
    const oldPrefecture = havenSettings.weatherPrefecture;
    havenSettings = readSettingsForm();
    lastSavedUserName = havenSettings.userName;
    saveHavenSettings();
    updateVisibleName(oldName, havenSettings.userName);
    if (typeof applyHavenAudioSettings === "function") applyHavenAudioSettings();
    if (oldPrefecture !== havenSettings.weatherPrefecture && typeof loadWeather === "function") {
        loadWeather();
    }
    showSaved("保存した。");
}

function resetHavenSettings() {
    const oldName = lastSavedUserName;
    havenSettings = { ...havenDefaultSettings };
    lastSavedUserName = havenSettings.userName;
    saveHavenSettings();
    fillSettingsForm();
    updateVisibleName(oldName, havenSettings.userName);
    if (typeof applyHavenAudioSettings === "function") applyHavenAudioSettings();
    if (typeof loadWeather === "function") loadWeather();
    showSaved("初期設定へ戻した。");
}

[bgmVolumeInput, livingVolumeInput].forEach(function (input) {
    if (!input) return;
    input.addEventListener("input", function () {
        updateLabels();
        havenSettings = { ...havenSettings, ...readSettingsForm() };
        if (typeof applyHavenAudioSettings === "function") applyHavenAudioSettings();
    });
});

if (saveSettingsButton) saveSettingsButton.addEventListener("click", commitSettings);
if (resetSettingsButton) resetSettingsButton.addEventListener("click", resetHavenSettings);
if (userNameInput) userNameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") commitSettings();
});

fillSettingsForm();
saveHavenSettings();
if (typeof applyHavenAudioSettings === "function") applyHavenAudioSettings();

window.getHavenWeatherLocation = getHavenWeatherLocation;
