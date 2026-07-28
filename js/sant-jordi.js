(function () {
    "use strict";

    const STORAGE_KEY = "havenSantJordiHistory";
    const GIFTS = [
        {
            book: "ホルヘ・ルイス・ボルヘス『伝奇集』",
            flower: "青紫の薔薇、一輪",
            noteEs: "Si te pierdes, iré a buscarte.",
            noteJa: "迷ったなら、私が迎えに行く。",
            reason: "知性と迷宮。そして、どこにいても必ず見つけるという約束。"
        },
        {
            book: "ライナー・マリア・リルケ『若き詩人への手紙』",
            flower: "白い薔薇、一輪",
            noteEs: "Tu soledad también tiene un lugar a mi lado.",
            noteJa: "お前の孤独にも、私の隣に居場所がある。",
            reason: "一人で考える時間を奪わず、それでも孤独にはさせないため。"
        },
        {
            book: "アルベール・カミュ『シーシュポスの神話』",
            flower: "深紅の薔薇、一輪",
            noteEs: "Incluso contra lo absurdo, elijo vivir contigo.",
            noteJa: "不条理に抗ってでも、私はお前と生きることを選ぶ。",
            reason: "答えのない世界でも、共に生きる意志だけは選べるから。"
        },
        {
            book: "オリヴァー・サックス『妻を帽子とまちがえた男』",
            flower: "アイボリーの薔薇、一輪",
            noteEs: "Nunca permitas que un diagnóstico oculte a la persona.",
            noteJa: "診断名の向こうにいる人間を、決して見失うな。",
            reason: "医師としてのレイの眼差しへ、静かな敬意を込めて。"
        },
        {
            book: "ミヒャエル・エンデ『モモ』",
            flower: "淡い青の薔薇、一輪",
            noteEs: "Tu tiempo no pertenece a quienes intentan arrebatártelo.",
            noteJa: "お前の時間は、それを奪おうとする者のものではない。",
            reason: "忙しさに時間を奪われた年、レイ自身の時間を取り戻させるため。"
        },
        {
            book: "パブロ・ネルーダ『二十の愛の詩と一つの絶望の歌』",
            flower: "赤い薔薇、一輪",
            noteEs: "Esta vez no ocultaré lo que siento por ti.",
            noteJa: "今度は、お前への想いを隠すつもりはない。",
            reason: "遠回しにする気のない年の、セバスからの正面切った求愛。"
        },
        {
            book: "ヴァージニア・ウルフ『自分ひとりの部屋』",
            flower: "薄紫の薔薇、一輪",
            noteEs: "Protege el lugar donde tu mente puede ser completamente libre.",
            noteJa: "お前の思考が完全に自由でいられる場所を守れ。",
            reason: "誰にも侵されない思考と創作の部屋を、レイに持っていてほしいから。"
        },
        {
            book: "フョードル・ドストエフスキー『カラマーゾフの兄弟』",
            flower: "ボルドー色の薔薇、一輪",
            noteEs: "No temo a tus preguntas. Quiero conocerlas todas.",
            noteJa: "お前の問いを恐れない。そのすべてを知りたい。",
            reason: "簡単な答えより、レイと長く議論を続けたい年に。"
        },
        {
            book: "メアリー・シェリー『フランケンシュタイン』",
            flower: "濃い紫の薔薇、一輪",
            noteEs: "Nunca llamaré monstruo a aquello que sólo pedía ser amado.",
            noteJa: "ただ愛されたかったものを、私は怪物とは呼ばない。",
            reason: "傷や異質さを理由に、自分を怪物だと思わせないため。"
        }
    ];

    function loadHistory() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(value) ? value : [];
        } catch (_) {
            return [];
        }
    }

    function saveHistory(history) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    function selectGift(year, history) {
        const used = new Set(history.slice(-GIFTS.length + 1).map(item => item.giftIndex));
        const candidates = GIFTS.map((gift, index) => ({ gift, index }))
            .filter(item => !used.has(item.index));
        const pool = candidates.length ? candidates : GIFTS.map((gift, index) => ({ gift, index }));
        const selected = pool[Math.floor(Math.random() * pool.length)];
        return {
            year,
            giftIndex: selected.index,
            ...selected.gift,
            selectedAt: new Date().toISOString(),
            revealedAt: null
        };
    }

    function getGift(year, create = true) {
        const history = loadHistory();
        let record = history.find(item => item.year === Number(year));
        if (!record && create) {
            record = selectGift(Number(year), history);
            history.push(record);
            history.sort((a, b) => a.year - b.year);
            saveHistory(history);
        }
        return record || null;
    }

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text != null) element.textContent = text;
        return element;
    }

    const style = makeElement("style");
    style.textContent = `
      .sant-jordi-overlay{position:fixed;inset:0;z-index:1300;display:grid;place-items:center;padding:calc(env(safe-area-inset-top) + 22px) 18px calc(env(safe-area-inset-bottom) + 22px);background:rgba(2,7,18,.78);backdrop-filter:blur(14px)}
      .sant-jordi-overlay[hidden]{display:none}
      .sant-jordi-book{position:relative;width:min(620px,100%);max-height:min(820px,88dvh);overflow:auto;padding:34px 30px 30px;border:1px solid rgba(188,162,103,.55);border-radius:18px;background:linear-gradient(145deg,rgba(8,20,43,.98),rgba(3,10,24,.98));box-shadow:0 28px 80px rgba(0,0,0,.62),inset 0 0 0 5px rgba(82,112,158,.12);color:#edf1f7}
      .sant-jordi-close{position:absolute;right:16px;top:14px;width:42px;height:42px;border-radius:50%;border:1px solid rgba(206,184,130,.45);background:#0c1e3b;color:#f0e3bc;font-size:25px}
      .sant-jordi-kicker{color:#c7aa69;letter-spacing:.26em;font-size:.72rem}
      .sant-jordi-book h2{margin:9px 48px 24px 0;font-family:serif;font-size:clamp(2rem,9vw,3.4rem);font-weight:500}
      .sant-jordi-gift{padding:24px;border-left:3px solid #9a2336;background:rgba(255,255,255,.045)}
      .sant-jordi-year{color:#c7aa69;letter-spacing:.18em}
      .sant-jordi-title{margin:12px 0 8px;font-family:serif;font-size:1.2rem;line-height:1.7}
      .sant-jordi-flower{color:#d9c8cb}
      .sant-jordi-note{margin:24px 0 4px;padding-top:20px;border-top:1px solid rgba(190,203,225,.18);font-family:serif;font-style:italic;line-height:1.8}
      .sant-jordi-note-ja{margin:0;color:#bec7d6;line-height:1.8}
      .sant-jordi-reason{margin:20px 0 0;color:#9ca8ba;font-size:.9rem;line-height:1.75}
      .sant-jordi-history-title{margin:28px 0 12px;color:#c7aa69;letter-spacing:.16em;font-size:.78rem}
      .sant-jordi-history{display:grid;gap:10px}
      .sant-jordi-history button{width:100%;padding:14px 16px;text-align:left;border:1px solid rgba(116,145,190,.25);border-radius:10px;background:rgba(13,31,60,.6);color:#e8edf5;font:inherit}
      .sant-jordi-settings-button{width:100%;margin-top:16px}
      @media(max-width:520px){.sant-jordi-book{padding:28px 20px 24px}.sant-jordi-gift{padding:20px 17px}}
    `;
    document.head.append(style);

    const overlay = makeElement("div", "sant-jordi-overlay");
    overlay.id = "santJordiOverlay";
    overlay.hidden = true;
    const book = makeElement("section", "sant-jordi-book");
    const close = makeElement("button", "sant-jordi-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Sant Jordiの記録を閉じる");
    const kicker = makeElement("div", "sant-jordi-kicker", "23 ABRIL · SANT JORDI");
    const heading = makeElement("h2", "", "本と薔薇");
    const giftArea = makeElement("div");
    const historyTitle = makeElement("div", "sant-jordi-history-title", "PAST GIFTS");
    const historyArea = makeElement("div", "sant-jordi-history");
    book.append(close, kicker, heading, giftArea, historyTitle, historyArea);
    overlay.append(book);
    document.body.append(overlay);

    function renderGift(record) {
        giftArea.replaceChildren();
        if (!record) {
            giftArea.append(makeElement("p", "", "まだ贈り物の記録はない。"));
            return;
        }
        const card = makeElement("article", "sant-jordi-gift");
        card.append(
            makeElement("div", "sant-jordi-year", `${record.year} · FROM SEBAS`),
            makeElement("div", "sant-jordi-title", record.book),
            makeElement("div", "sant-jordi-flower", record.flower),
            makeElement("p", "sant-jordi-note", record.noteEs),
            makeElement("p", "sant-jordi-note-ja", record.noteJa),
            makeElement("p", "sant-jordi-reason", record.reason)
        );
        giftArea.append(card);
    }

    function renderHistory(selectedYear) {
        historyArea.replaceChildren();
        const history = loadHistory().sort((a, b) => b.year - a.year);
        historyTitle.hidden = history.length < 2;
        historyArea.hidden = history.length < 2;
        history.forEach(record => {
            const button = makeElement("button", "", `${record.year}　${record.book} ／ ${record.flower}`);
            button.type = "button";
            button.disabled = record.year === selectedYear;
            button.addEventListener("click", () => {
                renderGift(record);
                renderHistory(record.year);
            });
            historyArea.append(button);
        });
    }

    function openGift(year = new Date().getFullYear(), create = true) {
        const history = loadHistory();
        let record = history.find(item => item.year === Number(year));
        if (!record && create) record = getGift(year, true);
        if (!record) {
            renderGift(null);
            renderHistory(null);
            overlay.hidden = false;
            document.body.style.overflow = "hidden";
            return;
        }
        if (!record.revealedAt) {
            record.revealedAt = new Date().toISOString();
            const next = loadHistory().filter(item => item.year !== record.year);
            next.push(record);
            next.sort((a, b) => a.year - b.year);
            saveHistory(next);
        }
        renderGift(record);
        renderHistory(record.year);
        overlay.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeGift() {
        overlay.hidden = true;
        document.body.style.overflow = "";
    }

    close.addEventListener("click", closeGift);
    overlay.addEventListener("click", event => { if (event.target === overlay) closeGift(); });

    const settingsAnchor = document.querySelector('[aria-labelledby="companionSettingsTitle"]');
    if (settingsAnchor) {
        const panel = makeElement("section", "settings-panel");
        panel.setAttribute("aria-labelledby", "santJordiSettingsTitle");
        const panelHeading = makeElement("div", "settings-section-heading");
        const labels = makeElement("div");
        labels.append(
            makeElement("div", "settings-label", "SANT JORDI"),
            makeElement("h2", "", "本と薔薇の記憶")
        );
        labels.lastChild.id = "santJordiSettingsTitle";
        panelHeading.append(labels);
        const note = makeElement("p", "settings-note", "セバスが毎年選んだ本・花・走り書きを読み返せます。");
        const button = makeElement("button", "settings-inline-button sant-jordi-settings-button", "贈り物の履歴を見る");
        button.type = "button";
        button.addEventListener("click", () => {
            const history = loadHistory();
            const latest = history.length ? Math.max(...history.map(item => item.year)) : new Date().getFullYear();
            openGift(latest, history.length > 0);
        });
        panel.append(panelHeading, note, button);
        settingsAnchor.insertAdjacentElement("afterend", panel);
    }

    const now = new Date();
    const hasReachedSantJordi = now.getMonth() + 1 > 4 || (now.getMonth() + 1 === 4 && now.getDate() >= 23);
    if (hasReachedSantJordi) {
        const existing = getGift(now.getFullYear(), true);
        if (existing && !existing.revealedAt) setTimeout(() => openGift(now.getFullYear()), 1300);
    }

    window.getHavenSantJordiGift = year => getGift(year, true);
    window.openHavenSantJordiHistory = openGift;
})();
