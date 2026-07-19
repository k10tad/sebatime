const workMessages = [
    "……来たか、レイ。始めるぞ。",
    "机は逃げん。安心して取り掛かれ。",
    "今日は何を片付ける？",
    "集中しろ。俺はここにいる。"
];

const morningMessages = [
    "おはよう、レイ。",
    "まずは水を飲め。",
    "今日はどこまで進める？"
];

const breakMessages = [
    "休憩だ。",
    "少し歩け。",
    "目を休ませろ。"
];

const rainMessages = [
    "雨だ。温かいものでも飲め。",
    "今日は急がなくていい。",
    "雨音を聞きながら進めよう。"
];

const lowPressureMessages = [
    "今日は気圧が低い。",
    "頭痛が来そうなら無理するな。",
    "ゆっくりでいい。"
];

const nightMessages = [
    "夜更かしする気か。",
    "眠くなったら寝ろ。",
    "今日もよく頑張った。"
];

function randomMessage(list) {
    const text = list[Math.floor(Math.random() * list.length)];

    if (typeof personalizeHavenText === "function") {
        return personalizeHavenText(text);
    }

    return text;
}

function getMessageList(weatherCode, pressure){

    const hour = new Date().getHours();

    if (pressure !== null && pressure <= 1005) {
        return lowPressureMessages;
    }

    if (weatherCode !== null && weatherCode >= 80) {
        return rainMessages;
    }

    if (hour >= 5 && hour < 11) {
        return morningMessages;
    }

    if (hour >= 18) {
        return nightMessages;
    }

    return workMessages;
}

const welcomeMessages = {
    morning: [
        "おはよう、レイ。今日は無理なく始めろ。",
        "来たか。まず水を飲め、それから机だ。",
        "朝だな。昨日より少しだけ進めればいい。"
    ],
    afternoon: [
        "来たか、レイ。午後の分を片付けるぞ。",
        "眠そうな顔をしているな。だが座ったなら始めろ。",
        "今日はまだ時間がある。焦るな。"
    ],
    night: [
        "夜か。長引かせすぎるなよ。",
        "遅い時間だな。終わりを決めて始めろ。",
        "眠くなったら寝ろ。命令だ。"
    ],
    lowFocusYesterday: [
        "昨日はあまり進めていないな。今日は短くてもいい、始めろ。",
        "昨日の分を責めるな。今日の25分で取り返せる。"
    ],
    goodFocusYesterday: [
        "昨日はよく集中していたな。今日も同じ調子でいけ。",
        "昨日の記録は悪くない。今日はそれを少しだけ超えてみるか。"
    ]
};

function getWelcomeMessage() {
    const hour = new Date().getHours();

    const yesterdayFocus =
        Number(localStorage.getItem("yesterdayFocusSeconds")) || 0;

    if (yesterdayFocus >= 7200) {
        return randomMessage(welcomeMessages.goodFocusYesterday);
    }

    if (yesterdayFocus > 0 && yesterdayFocus < 1800) {
        return randomMessage(welcomeMessages.lowFocusYesterday);
    }

    if (hour >= 5 && hour < 11) {
        return randomMessage(welcomeMessages.morning);
    }

    if (hour >= 18) {
        return randomMessage(welcomeMessages.night);
    }

    return randomMessage(welcomeMessages.afternoon);
}

const idleMessages = [
    "……レイ。",
    "姿勢が崩れている。少し直せ。",
    "水は飲んだか。",
    "焦るな。今やっている分だけでいい。",
    "そのまま続けろ。俺は見ている。",
    "肩の力を抜け。",
    "……悪くない集中だ。",
    "今日は静かだな。",
    "眠くなったら無理をするな。",
    "一つずつ片付けろ。",
    "静かだな。",
    "少し肩を回してこい。",
    "呼吸が浅いぞ。",
    "時計を見る癖は悪くない。",
    "コーヒーの香りがする。",
    "今日は本を一冊読みたい気分だ。",
    "机は綺麗な方が好きだ。",
    "……悪くない。",
    "その調子だ。",
    "急がなくていい。",
    "俺はここにいる。",
];

const contextualIdleMessages = {

    morning: [
        "朝の集中力は貴重だ。",
        "午前中に一番難しい仕事を終わらせろ。",
        "今日は何から片付ける？"
    ],

    afternoon: [
        "昼を越えると判断が鈍る。",
        "少し歩いてくるのもいい。",
        "午後はペースを守れ。"
    ],

    night: [
        "もう夜だ。",
        "終わりを決める勇気も必要だ。",
        "今日はここまででも十分だ。"
    ],

    rain: [
        "雨音も悪くない。",
        "今日は静かな日だな。",
        "雨の日は焦らない方がいい。"
    ],

    sunny: [
        "こんな日は外の空気も悪くない。",
        "窓を開けてみるか？"
    ],

    cloudy: [
        "曇りの日は静かで好きだ。",
        "考え事には向いている。"
    ],

    storm: [
        "外は騒がしいな。",
        "今日は屋内で十分だ。"
    ],

    lowPressure: [
        "気圧が落ちている。",
        "今日は頭痛が来ても不思議じゃない。",
        "省エネで進めよう。"
    ],

    longFocus: [
        "二時間近く座っているぞ。",
        "立って身体を伸ばせ。",
        "水分補給だ。"
    ],

    midnight: [
        "まだ起きているのか。",
        "……俺も人のことは言えないが。"
    ]

};



//========================
// Companion Engine bridge
//========================

const HAVEN_COMPANION_ENGINE_ENABLED = true;
const HAVEN_COMPANION_DEBUG_LABEL = false;

function getCompanionEngineMessage() {
    if (
        HAVEN_COMPANION_ENGINE_ENABLED !== true ||
        !window.CompanionEngine ||
        typeof window.CompanionEngine.getMessage !== "function"
    ) {
        return "";
    }

    try {
        const generatedMessage = window.CompanionEngine.getMessage({
            weatherCode:
                typeof currentWeatherCode !== "undefined"
                    ? currentWeatherCode
                    : null,
            pressure:
                typeof currentPressure !== "undefined"
                    ? currentPressure
                    : null
        });

        if (!generatedMessage) return "";

        return HAVEN_COMPANION_DEBUG_LABEL
            ? `[Companion]\n${generatedMessage}`
            : generatedMessage;

    } catch (error) {
        console.warn("Companion Engine fallback:", error);
        return "";
    }
}

let idleMessageTimer = null;

function showIdleMessage() {
    if (typeof sessionState !== "undefined" && sessionState !== "work") return;

    const companionMessage = getCompanionEngineMessage();

    if (companionMessage) {
        message.textContent = companionMessage;
        scheduleIdleMessage();
        return;
    }

    const memoryMessage = getMemoryMessage();

if (memoryMessage && Math.random() < 0.25) {
    message.textContent = memoryMessage;
    scheduleIdleMessage();
    return;
}
    const hour = new Date().getHours();

    if (currentPressure && currentPressure <= 1005) {
        message.textContent =
            randomMessage(contextualIdleMessages.lowPressure);

    } else if (
        currentWeatherCode &&
        currentWeatherCode >= 80
    ) {
        message.textContent =
            randomMessage(contextualIdleMessages.rain);

    } else if (todayFocusSeconds >= 7200) {
        message.textContent =
            randomMessage(contextualIdleMessages.longFocus);

    } else if (hour >= 5 && hour < 12) {
        message.textContent =
            randomMessage(contextualIdleMessages.morning);

    } else if (hour >= 12 && hour < 18) {
        message.textContent =
            randomMessage(contextualIdleMessages.afternoon);

    } else if (hour >= 18) {
        message.textContent =
            randomMessage(contextualIdleMessages.night);

    } else {
        message.textContent =
            randomMessage(idleMessages);
    }

    scheduleIdleMessage();
}

function scheduleIdleMessage() {
    const fallback = { min: 180000, max: 420000 };
    const range = typeof getHavenIdleDelay === "function"
        ? getHavenIdleDelay("next")
        : fallback;

    const next = range.min + Math.random() * (range.max - range.min);
    idleMessageTimer = setTimeout(showIdleMessage, next);
}

function startIdleMessages() {
    if (idleMessageTimer !== null) return;

    const fallback = { min: 90000, max: 180000 };
    const range = typeof getHavenIdleDelay === "function"
        ? getHavenIdleDelay("first")
        : fallback;

    const first = range.min + Math.random() * (range.max - range.min);
    idleMessageTimer = setTimeout(showIdleMessage, first);
}

function stopIdleMessages() {
    clearTimeout(idleMessageTimer);
    idleMessageTimer = null;
}

function formatFocusTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}時間${minutes}分`;
    }

    return `${minutes}分`;
}

function getDailySummaryMessage() {
    const focusSeconds =
        Number(localStorage.getItem("todayFocusSeconds")) || 0;

    const count =
        Number(localStorage.getItem("pomodoroCount")) || 0;

    const focusText = formatFocusTime(focusSeconds);

    if (focusSeconds === 0) {
        return "今日はまだ記録がないな。……今から始めればいい。";
    }

    if (focusSeconds < 1800) {
        return `今日は${focusText}。短くても机に向かったなら十分だ。次はもう少しだけ続けるぞ。`;
    }

    if (focusSeconds < 7200) {
        return `今日は${focusText}、ポモドーロは${count}回だ。悪くない。積み上がっている。`;
    }

    return `今日は${focusText}、ポモドーロは${count}回。よくやった、レイ。今日はここまででもいい。`;
}

const sleepComments = {

    terrible: [
        "……レイ、その睡眠時間は報告書に書けないレベルだ。",
        "今日は命令だ。無理はするな。",
        "敵より先に睡魔に負けそうだな。",
        "集中する前に寝ろ。",
        "机に突っ伏す未来が見えている。",
        "俺は働けと言うが、倒れろとは言わん。",
        "その睡眠時間で手術は許可しない。",
        "今日は判断が鈍る。慎重に動け。"
    ],

    short: [
        "少し寝不足だな。",
        "コーヒーだけで解決する話じゃない。",
        "昼休みに目を閉じろ。",
        "今日は早めに切り上げてもいい。",
        "休憩は仕事の一部だ。",
        "無理をすると夜に響くぞ。",
        "あと一時間眠れたら理想だった。",
        "ペース配分を忘れるな。"
    ],

    good: [
        "悪くない睡眠だ。",
        "今日は頭が回りそうだな。",
        "いい朝だ。",
        "これなら集中できる。",
        "準備は十分だ。",
        "今日も一歩ずつ進めよう。",
        "調子は良さそうだな。",
        "安心して送り出せる。"
    ],

    perfect: [
        "理想的な睡眠だ。",
        "今日は期待している。",
        "身体も脳も万全だな。",
        "いいコンディションだ。",
        "ようやく人間らしい睡眠時間だ。",
        "今日はかなり進めそうだ。",
        "……褒めてやる。",
        "この調子を維持しろ。"
    ]

};

const dailyFlowMessages = {
    morning: [
        "おはよう、レイ。まず水を飲め。",
        "朝だ。最初の作業は軽く始めろ。",
        "今日は何から片付ける？"
    ],

    noon: [
        "昼だ。食事は済ませたか。",
        "昼を抜くな。午後に響く。",
        "少し席を立て。身体を固めるな。"
    ],

    evening: [
        "夕方だな。今日の残りを決めろ。",
        "ここからは欲張るな。必要な分だけでいい。",
        "今日の作業を締める準備をしろ。"
    ],

    night: [
        "夜だ。終わりの時間を決めておけ。",
        "長引かせすぎるなよ。",
        "眠くなったら寝ろ。命令だ。"
    ],

    midnight: [
        "……まだ起きているのか。",
        "深夜だ。判断力は落ちている。",
        "今日はもう畳んでもいい。"
    ]
};

function getDailyFlowMessage() {
    const companionMessage = getCompanionEngineMessage();

    if (companionMessage) {
        return companionMessage;
    }

    const hour = new Date().getHours();

    if (hour >= 5 && hour < 11) {
        return randomMessage(dailyFlowMessages.morning);
    }

    if (hour >= 11 && hour < 14) {
        return randomMessage(dailyFlowMessages.noon);
    }

    if (hour >= 17 && hour < 21) {
        return randomMessage(dailyFlowMessages.evening);
    }

    if (hour >= 21 && hour < 24) {
        return randomMessage(dailyFlowMessages.night);
    }

    if (hour >= 0 && hour < 5) {
        return randomMessage(dailyFlowMessages.midnight);
    }

    return randomMessage(dailyFlowMessages.morning);
}

//========================
// Sebas 呼びかけ
//========================

const callSebasButton = document.getElementById("callSebas");
let sebasCallCount = 0;
let sebasCallResetTimer = null;

function pickHavenDialogue(key) {
    const list = window.HavenDialogues?.[key];
    if (!Array.isArray(list) || list.length === 0) return "";

    const selected = list[Math.floor(Math.random() * list.length)];
    const name = typeof getHavenUserName === "function" ? getHavenUserName() : "レイ";
    return selected.replaceAll("{name}", name);
}

function callSebas() {
    sebasCallCount += 1;
    clearTimeout(sebasCallResetTimer);

    const key = sebasCallCount === 1 ? "normalCall" : "normalCallRepeat";
    const line = pickHavenDialogue(key);

    if (line && message) {
        message.textContent = line;
    }

    sebasCallResetTimer = setTimeout(function () {
        sebasCallCount = 0;
    }, 45000);
}

if (callSebasButton) {
    callSebasButton.addEventListener("click", callSebas);
}
