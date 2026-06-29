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
    return list[Math.floor(Math.random() * list.length)];
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
    "一つずつ片付けろ。"
];

let idleMessageTimer = null;

function showIdleMessage() {
    if (timerId === null) return;

    message.textContent = randomMessage(idleMessages);

    scheduleIdleMessage();
}

function scheduleIdleMessage() {
    const next = 180000 + Math.random() * 240000;
    idleMessageTimer = setTimeout(showIdleMessage, next);
}

function startIdleMessages() {
    if (idleMessageTimer !== null) return;

    const first = 90000 + Math.random() * 90000;
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

