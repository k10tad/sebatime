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