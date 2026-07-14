//========================
// Haven Settings
//========================

const HAVEN_SETTINGS_KEY = "havenSettings";

const havenDefaultSettings = {
    userName: "レイ",
    bgmVolume: 18,
    livingVolume: 15,
    sleepVolume: 20,
    idleFrequency: "normal"
};

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
const frequencyInputs = Array.from(
    document.querySelectorAll('input[name="idleFrequency"]')
);

function clampSetting(value, min, max) {
    return Math.min(max, Math.max(min, Number(value)));
}

function loadHavenSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(HAVEN_SETTINGS_KEY));

        if (!saved || typeof saved !== "object") {
            return { ...havenDefaultSettings };
        }

        return {
            ...havenDefaultSettings,
            ...saved,
            userName: String(saved.userName || "レイ").trim() || "レイ",
            bgmVolume: clampSetting(saved.bgmVolume ?? 18, 0, 100),
            livingVolume: clampSetting(saved.livingVolume ?? 15, 0, 100),
            sleepVolume: clampSetting(saved.sleepVolume ?? 20, 0, 100),
            idleFrequency: ["low", "normal", "high"].includes(saved.idleFrequency)
                ? saved.idleFrequency
                : "normal"
        };
    } catch (error) {
        console.warn("Haven settings could not be loaded.", error);
        return { ...havenDefaultSettings };
    }
}

function saveHavenSettings() {
    localStorage.setItem(HAVEN_SETTINGS_KEY, JSON.stringify(havenSettings));
}

function getHavenUserName() {
    return havenSettings.userName || "レイ";
}

function personalizeHavenText(text) {
    if (typeof text !== "string") return text;
    return text.replaceAll("レイ", getHavenUserName());
}

function updateVisibleName(oldName, newName) {
    [document.getElementById("message"), document.getElementById("sleepMessage")]
        .filter(Boolean)
        .forEach(function (element) {
            const current = element.textContent || "";
            element.textContent = current
                .replaceAll(oldName, newName)
                .replaceAll("レイ", newName);
        });
}

function updateVolumeLabel(input, output) {
    if (!input || !output) return;
    output.textContent = input.value + "%";
}

function setAudioVolume(audio, percent, multiplier = 1) {
    if (typeof audio === "undefined" || !audio) return;
    audio.volume = Math.min(1, Math.max(0, (percent / 100) * multiplier));
}

function applyHavenAudioSettings() {
    const bgmLevel = havenSettings.bgmVolume;
    const livingLevel = havenSettings.livingVolume;
    const sleepLevel = havenSettings.sleepVolume;

    if (typeof bgm !== "undefined") setAudioVolume(bgm, bgmLevel);
    if (typeof breakBgm !== "undefined") setAudioVolume(breakBgm, bgmLevel, 0.84);

    if (typeof roomSound !== "undefined") setAudioVolume(roomSound, livingLevel, 0.74);
    if (typeof penSound !== "undefined") setAudioVolume(penSound, livingLevel, 1.0);
    if (typeof pageSound !== "undefined") setAudioVolume(pageSound, livingLevel, 1.12);
    if (typeof breathIdleSound !== "undefined") setAudioVolume(breathIdleSound, livingLevel, 0.86);
    if (typeof coffeeSound !== "undefined") setAudioVolume(coffeeSound, livingLevel, 1.0);
    if (typeof coughingSound !== "undefined") setAudioVolume(coughingSound, livingLevel, 0.74);
    if (typeof stepSound !== "undefined") setAudioVolume(stepSound, livingLevel, 0.92);

    if (typeof sleepBreath !== "undefined") setAudioVolume(sleepBreath, sleepLevel);
}

function getHavenIdleDelay(stage = "next") {
    const ranges = {
        low: {
            first: { min: 180000, max: 300000 },
            next: { min: 420000, max: 720000 }
        },
        normal: {
            first: { min: 90000, max: 180000 },
            next: { min: 180000, max: 420000 }
        },
        high: {
            first: { min: 45000, max: 90000 },
            next: { min: 90000, max: 210000 }
        }
    };

    return ranges[havenSettings.idleFrequency][stage];
}

function fillSettingsForm() {
    if (userNameInput) userNameInput.value = havenSettings.userName;
    if (bgmVolumeInput) bgmVolumeInput.value = havenSettings.bgmVolume;
    if (livingVolumeInput) livingVolumeInput.value = havenSettings.livingVolume;
    if (sleepVolumeInput) sleepVolumeInput.value = havenSettings.sleepVolume;

    frequencyInputs.forEach(function (input) {
        input.checked = input.value === havenSettings.idleFrequency;
    });

    updateVolumeLabel(bgmVolumeInput, bgmVolumeValue);
    updateVolumeLabel(livingVolumeInput, livingVolumeValue);
    updateVolumeLabel(sleepVolumeInput, sleepVolumeValue);
}

function readSettingsForm() {
    const selectedFrequency = frequencyInputs.find(function (input) {
        return input.checked;
    });

    return {
        userName: String(userNameInput?.value || "レイ").trim() || "レイ",
        bgmVolume: clampSetting(bgmVolumeInput?.value ?? 18, 0, 100),
        livingVolume: clampSetting(livingVolumeInput?.value ?? 15, 0, 100),
        sleepVolume: clampSetting(sleepVolumeInput?.value ?? 20, 0, 100),
        idleFrequency: selectedFrequency?.value || "normal"
    };
}

function showSettingsSaved(text) {
    if (!settingsSavedMessage) return;

    settingsSavedMessage.textContent = text;
    settingsSavedMessage.classList.add("visible");

    window.clearTimeout(showSettingsSaved.timerId);
    showSettingsSaved.timerId = window.setTimeout(function () {
        settingsSavedMessage.classList.remove("visible");
    }, 2600);
}

function commitSettings() {
    const oldName = lastSavedUserName || "レイ";
    havenSettings = readSettingsForm();
    lastSavedUserName = havenSettings.userName;

    saveHavenSettings();
    applyHavenAudioSettings();
    updateVisibleName(oldName, havenSettings.userName);

    if (typeof stopIdleMessages === "function" &&
        typeof startIdleMessages === "function" &&
        typeof sessionState !== "undefined" &&
        sessionState === "work") {
        stopIdleMessages();
        startIdleMessages();
    }

    showSettingsSaved("保存した。これで呼び方を間違えない。");
}

function resetHavenSettings() {
    const oldName = lastSavedUserName || "レイ";
    havenSettings = { ...havenDefaultSettings };
    lastSavedUserName = havenSettings.userName;

    saveHavenSettings();
    fillSettingsForm();
    applyHavenAudioSettings();
    updateVisibleName(oldName, havenSettings.userName);

    showSettingsSaved("初期設定へ戻した。");
}

[bgmVolumeInput, livingVolumeInput, sleepVolumeInput].forEach(function (input) {
    if (!input) return;

    input.addEventListener("input", function () {
        updateVolumeLabel(bgmVolumeInput, bgmVolumeValue);
        updateVolumeLabel(livingVolumeInput, livingVolumeValue);
        updateVolumeLabel(sleepVolumeInput, sleepVolumeValue);

        const preview = readSettingsForm();
        const previous = havenSettings;
        havenSettings = preview;
        applyHavenAudioSettings();
        havenSettings = previous;
    });
});

if (saveSettingsButton) {
    saveSettingsButton.addEventListener("click", commitSettings);
}

if (resetSettingsButton) {
    resetSettingsButton.addEventListener("click", resetHavenSettings);
}

if (userNameInput) {
    userNameInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") commitSettings();
    });
}

fillSettingsForm();
applyHavenAudioSettings();
