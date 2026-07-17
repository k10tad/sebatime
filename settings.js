//========================
// Haven Settings Engine
// 設定保存と画面反映だけを管理する
//========================

const HAVEN_SETTINGS_KEY = "havenSettings";
const HAVEN_FIXED_SLEEP_PERCENT = 78;

const havenDefaultSettings = {
    userName: "レイ",
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
    havenSettings = readSettingsForm();
    lastSavedUserName = havenSettings.userName;
    saveHavenSettings();
    updateVisibleName(oldName, havenSettings.userName);
    if (typeof applyHavenAudioSettings === "function") applyHavenAudioSettings();
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
