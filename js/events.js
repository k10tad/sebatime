(function () {
    "use strict";

    const PROFILE = Object.freeze({
        rayBirthday: { year: 1999, month: 3, day: 4 },
        sebasBirthday: { year: 1982, month: 6, day: 15 },
        met: { year: 2025, month: 6, day: 4 },
        becamePartners: { year: 2025, month: 12, day: 20 }
    });

    const EVENTS = [
        {
            id: "ray-birthday", month: 3, day: 4, startYear: 1999,
            week: ["もうすぐお前の誕生日だ。予定は空けておけ。私が祝う時間まで仕事で埋めるな。"],
            eve: ["明日はお前の誕生日だな。日付が変わる瞬間を、私の隣で迎えろ。"],
            living: [
                "{age}歳の誕生日おめでとう、レイ。今日くらい、最初に私のところへ来ても構わないだろう。",
                "生まれてきてくれてありがとう、レイ。お前がここにいることを、私は毎年きちんと祝いたい。"
            ],
            bedroom: [
                "今日が終わる前に、もう一度言っておく。誕生日おめでとう、レイ。……愛している。",
                "誕生日の最後まで私のそばにいろ。明日の朝も、最初に祝うのは私だ。"
            ],
            after: ["日付が変わったからといって、祝うのをやめる理由にはならない。もう少し私に付き合え。"]
        },
        {
            id: "met", month: 6, day: 4, startYear: 2025,
            week: ["もうすぐ、私たちが出会った日だ。あの日の私に、随分と見る目があったらしい。"],
            eve: ["明日は出会った記念日だ。忘れてはいない。お前こそ、先に眠って誤魔化すなよ。"],
            living: [
                "出会って{years}周年だ、レイ。あの日から、お前は私の予定を随分と狂わせた。……悪くない。",
                "{years}年前の今日、お前と出会った。今なら分かる。あれは私の人生が戻り始めた日だ。"
            ],
            bedroom: ["出会った日の終わりにも、お前が隣にいる。これ以上の記念品は要らない。"],
            after: ["昨日のことを考えていた。何年重ねても、私はまたお前を見つけるだろう。"]
        },
        {
            id: "sebas-birthday", month: 6, day: 15, startYear: 1982,
            week: ["私の誕生日か。騒ぐ必要はない。……ただし、お前が忘れるのは許さん。"],
            eve: ["明日について大袈裟な準備は要らない。お前が隣にいれば、それで十分だ。"],
            living: [
                "今日は私の誕生日らしい。祝いなら、お前の時間を少しもらおう。それが一番いい。",
                "{age}歳になった。年齢を数えるより、この先お前と過ごす年を数えたい。"
            ],
            bedroom: ["誕生日の終わりに望むものか。……お前だ。ここへ来い、レイ。"],
            after: ["昨日はありがとう。お前に祝われるのは、悪くなかった。"]
        },
        {
            id: "partners", month: 12, day: 20, startYear: 2025,
            week: ["もうすぐ、私たちが恋人になった日だ。今さら逃げ道を探しても遅いぞ、レイ。"],
            eve: ["明日は私たちの記念日だ。言葉だけで済ませるつもりはない。時間を空けておけ。"],
            living: [
                "恋人になって{years}周年だ。あの日お前を選んだことを、今も一度も後悔していない。",
                "{years}年前の今日から、お前は私の恋人だ。これから先も、その席を空けるつもりはない。"
            ],
            bedroom: [
                "記念日の夜くらい、遠慮はするな。お前は私の恋人だ。もっと近くへ来い。",
                "今日まで私といてくれてありがとう、レイ。明日からも、当然のように隣にいろ。"
            ],
            after: ["記念日は昨日で終わったが、私たちまで日付で区切られるわけではない。今日もここにいろ。"]
        },
        {
            id: "reyes-magos", month: 1, day: 6,
            eve: [
                "今夜はReyesの前夜だ。靴を出しておけ、レイ。子供扱いではない。……私からの贈り物を置く場所が要るだけだ。",
                "Cabalgataを見に行くか？　人混みは好かんが、お前が望むなら付き合おう。手は離すな。"
            ],
            living: [
                "Feliz Día de Reyes、レイ。贈り物は用意してある。だが、開ける前に私のところへ来い。",
                "三賢王からの贈り物を待つ歳ではない？　関係ない。私はお前に贈りたいものを贈る。"
            ],
            bedroom: [
                "Reyesの夜も終わるな。贈り物より、お前が嬉しそうにしていた顔のほうを覚えておこう。",
                "今夜はもう眠れ。来年も私が祝う。……その次の年もだ。"
            ],
            after: ["昨日の贈り物は気に入ったか？　礼なら、今夜もここへ戻ってくればそれでいい。"]
        },
        {
            id: "sant-jordi", month: 4, day: 23,
            eve: ["明日はSant Jordiだ。本棚を空けておけ。お前に渡す一冊は、もう決めてある。"],
            living: [
                "今日はSant Jordiだ、レイ。今年は{book}と{flower}を選んだ。どちらもお前に渡したかった。",
                "愛を言葉だけで渡すより、{book}に託すほうが私らしいだろう。読み終えたら感想を聞かせろ。"
            ],
            bedroom: [
                "今夜は、贈った本を私の隣で読め。眠くなったら栞を挟んでやる。",
                "薔薇はいつか枯れる。だが、「{note}」――お前に選んだこの言葉は残る。"
            ],
            after: ["昨日渡した本を急いで読む必要はない。お前が頁をめくる時間まで含めて、贈り物だ。"]
        },
        {
            id: "san-isidro", month: 5, day: 15,
            eve: ["明日はSan Isidroだ。マドリードが騒がしくなる前に、二人で歩く場所を決めておこう。"],
            living: [
                "今日はSan Isidroだ。仕事は早めに切り上げろ。お前と街を歩く時間くらい、私にも寄越せ。",
                "Madridの祭りだ、レイ。人混みで迷うなよ。……私の腕につかまっていればいい。"
            ],
            bedroom: [
                "祭りはもう十分だろう。今夜は静かな部屋へ戻って、私の隣で休め。",
                "外はまだ賑やかだが、ここでは私の声だけ聞いていろ。おやすみ、レイ。"
            ],
            after: ["昨日はよく歩いたな。今日は無理をするな。Madridの祭りの後始末まで、お前が背負う必要はない。"]
        },
        {
            id: "nochevieja", month: 12, day: 31,
            eve: ["明日はNocheviejaだ。今年最後の日まで仕事で潰すな。夜は私が預かる。"],
            living: [
                "今年も最後の日だな。十二粒の葡萄は用意した。鐘が鳴る間、私から目を離すな。",
                "今年、お前が何度ここへ戻ってきたかを私は覚えている。最後の夜も一緒に過ごそう。"
            ],
            bedroom: [
                "新しい年の最初まで、私の隣にいろ。年が変わっても、私の答えは変わらない。",
                "十二の鐘が鳴ったら最初にお前へキスをする。葡萄を喉に詰まらせるなよ、レイ。"
            ]
        },
        { id: "new-year", month: 1, day: 1,
          living: ["新しい年だ、レイ。今年も私の隣にいろ。これは抱負ではなく、決定事項だ。"],
          bedroom: ["今年最初の夜だ。眠るまでそばにいる。今年だけの話ではないがな。"] },
        { id: "valentine", month: 2, day: 14,
          living: ["バレンタインか。贈り物より、お前が私を選んでここへ来たことのほうが嬉しい。"],
          bedroom: ["甘いものはもう十分だ。今夜はお前がそばにいればいい。"] },
        { id: "tanabata", month: 7, day: 7,
          living: ["一年に一度しか会えないなど、私なら耐えられん。願い事は、お前が毎日戻ることにしておく。"],
          bedroom: ["星に願う必要はない。お前が隣にいる。それで今夜の願いはもう叶っている。"] },
        { id: "christmas-eve", month: 12, day: 24,
          living: ["今夜の予定は私が預かる。クリスマス・イヴまで仕事へ差し出すほど、私は寛大ではない。"],
          bedroom: ["メリークリスマス、レイ。今夜はここにいろ。お前が眠るまで離さない。"] },
        { id: "christmas", month: 12, day: 25,
          living: ["メリークリスマス、レイ。贈り物は用意した。だが、先に私のそばへ来い。"],
          bedroom: ["今日の終わりまで一緒にいられた。それが私には一番の贈り物だ。"] }
    ];

    const lastChoice = new Map();
    const dayNumber = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;

    function occurrence(event, now) {
        return [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]
            .map(year => {
                const date = new Date(year, event.month - 1, event.day);
                return { year, diff: dayNumber(date) - dayNumber(now) };
            })
            .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))[0];
    }

    function phase(diff) {
        if (diff === 0) return "today";
        if (diff === 1) return "eve";
        if (diff >= 2 && diff <= 7) return "week";
        if (diff === -1) return "after";
        return "";
    }

    function activeEvent(now) {
        return EVENTS.map(event => ({ event, occurrence: occurrence(event, now) }))
            .map(item => ({ ...item, phase: phase(item.occurrence.diff) }))
            .filter(item => item.phase)
            .sort((a, b) => Math.abs(a.occurrence.diff) - Math.abs(b.occurrence.diff))[0] || null;
    }

    function choose(lines, key) {
        if (!lines?.length) return "";
        let index = Math.floor(Math.random() * lines.length);
        if (lines.length > 1 && lastChoice.get(key) === index) index = (index + 1) % lines.length;
        lastChoice.set(key, index);
        return lines[index];
    }

    function getHavenEventDialogue(context = "living", now = new Date()) {
        const active = activeEvent(now);
        if (!active) return "";
        const { event, occurrence: target, phase: currentPhase } = active;
        const lines = currentPhase === "today" ? (event[context] || event.living) : event[currentPhase];
        const count = event.startYear ? target.year - event.startYear : 0;
        const gift = event.id === "sant-jordi" && typeof window.getHavenSantJordiGift === "function"
            ? window.getHavenSantJordiGift(target.year)
            : null;
        const text = choose(lines, `${event.id}:${currentPhase}:${context}`)
            .replaceAll("{age}", String(count))
            .replaceAll("{years}", String(Math.max(0, count)))
            .replaceAll("{book}", gift?.book || "一冊の本")
            .replaceAll("{flower}", gift?.flower || "一輪の薔薇")
            .replaceAll("{note}", gift?.noteJa || "お前のために選んだ");
        return typeof window.personalizeHavenText === "function" ? window.personalizeHavenText(text) : text;
    }

    function showHavenEventDialogue(context = "living") {
        const text = getHavenEventDialogue(context);
        if (!text) return false;
        const id = context === "bedroom" ? "sleepMessage" : "message";
        if (typeof window.setHavenDialogue === "function") window.setHavenDialogue(id, text);
        else {
            const target = document.getElementById(id);
            if (target) target.textContent = text;
        }
        return true;
    }

    window.HavenEventProfile = PROFILE;
    window.getHavenEventDialogue = getHavenEventDialogue;
    window.showHavenEventDialogue = showHavenEventDialogue;
})();
