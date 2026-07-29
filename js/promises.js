//========================
// Haven Daily Promise
// 帰宅、または一緒に眠る約束を一日単位で記録する
//========================
(function () {
    "use strict";

    const rhythm = window.HavenLifeRhythm;
    if (!rhythm) return;

    const PROMPT_DELAY_MS = 1800;
    const RETURN_EARLY_WINDOW_MINUTES = 180;
    const RETURN_GRACE_MINUTES = 90;
    const MIN_RETURN_AWAY_SECONDS = 20 * 60;

    const RETURN_CHOICES = [
        { id: "18", label: "18時頃", targetMinutes: 18 * 60 },
        { id: "20", label: "20時頃", targetMinutes: 20 * 60 },
        { id: "22plus", label: "22時以降", targetMinutes: 22 * 60, openEnded: true },
        { id: "undecided", label: "今日は未定" }
    ];

    const SLEEP_CHOICES = [
        { id: "accept", label: "一緒に寝る" },
        { id: "decline", label: "今夜は未定" }
    ];

    let overlay = null;
    let statusTimer = null;
    let promptTimer = null;
    let completing = false;

    function localDateKey(value = new Date()) {
        const date = new Date(value);
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function nowMinutes(value = new Date()) {
        const date = new Date(value);
        return date.getHours() * 60 + date.getMinutes();
    }

    function currentPromptType(value = new Date()) {
        const hour = new Date(value).getHours();
        return hour >= 5 && hour < 12 ? "return" : "sleep";
    }

    function getToday() {
        return rhythm.getDay() || {};
    }

    function getPromise() {
        return getToday().promise || null;
    }

    function updatePromise(next) {
        rhythm.setDayValue("promise", next);
        return next;
    }

    function setMessage(targetId, text, options = {}) {
        if (typeof window.setHavenDialogue === "function") {
            window.setHavenDialogue(targetId, text, options);
            return;
        }
        const target = document.getElementById(targetId);
        if (target) target.textContent = text;
    }

    function setBothMessages(text, options = {}) {
        setMessage("message", text, options);
        setMessage("sleepMessage", text, options);
    }

    function canPrompt() {
        const today = getToday();
        if (today.promisePromptedAt || today.promise) return false;
        if (localStorage.getItem("sleepStartTime")) return false;
        if (window.AMiLado?.isActive?.()) return false;
        return !document.hidden;
    }

    function buildOverlay() {
        if (overlay) return overlay;

        document.body.insertAdjacentHTML("beforeend", `
            <div id="havenPromiseOverlay" class="haven-promise-overlay" hidden>
                <section class="haven-promise-notification" role="dialog" aria-modal="true" aria-labelledby="havenPromiseSender">
                    <header class="haven-promise-appbar">
                        <div class="haven-promise-avatar" aria-hidden="true">S</div>
                        <div id="havenPromiseSender" class="haven-promise-sender">
                            <strong>Sebas</strong>
                            <small>PRIVATE · NOW</small>
                        </div>
                        <button id="havenPromiseClose" class="haven-promise-close" type="button" aria-label="あとで閉じる">×</button>
                    </header>
                    <div id="havenPromiseChat" class="haven-promise-chat"></div>
                    <div id="havenPromiseOptions" class="haven-promise-options"></div>
                    <p id="havenPromiseStatus" class="haven-promise-status" role="status" aria-live="polite"></p>
                </section>
            </div>
        `);

        overlay = document.getElementById("havenPromiseOverlay");
        document.getElementById("havenPromiseClose")?.addEventListener("click", function () {
            dismissPrompt("closed");
        });
        overlay?.addEventListener("click", function (event) {
            if (event.target === overlay) dismissPrompt("backdrop");
        });
        return overlay;
    }

    function closeOverlay() {
        window.clearTimeout(statusTimer);
        if (overlay) overlay.hidden = true;
        document.body.classList.remove("haven-promise-open");
    }

    function markPrompted(type, detail = {}) {
        const prompt = {
            type,
            shownAt: new Date().toISOString(),
            ...detail
        };
        rhythm.setDayValue("promisePromptedAt", prompt.shownAt);
        rhythm.setDayValue("promisePrompt", prompt);
        rhythm.recordEvent("promise-prompt", prompt);
    }

    function dismissPrompt(reason) {
        const today = getToday();
        const type = today.promisePrompt?.type || currentPromptType();
        if (!today.promisePromptedAt) markPrompted(type);
        const detail = {
            ...(rhythm.getDay()?.promisePrompt || {}),
            dismissedAt: new Date().toISOString(),
            dismissReason: reason
        };
        rhythm.setDayValue("promisePrompt", detail);
        rhythm.recordEvent("promise-dismissed", { type, reason });
        closeOverlay();
    }

    function renderPrompt(type) {
        buildOverlay();
        const chat = document.getElementById("havenPromiseChat");
        const options = document.getElementById("havenPromiseOptions");
        const status = document.getElementById("havenPromiseStatus");
        if (!chat || !options || !status || !overlay) return;

        const question = type === "return"
            ? "今日は何時頃に戻る？　待つ時間くらい、知っておきたい。"
            : "今夜は一緒に寝るか？　先に約束しておけば、お前も少しは切り上げるだろう。";
        const choices = type === "return" ? RETURN_CHOICES : SLEEP_CHOICES;

        chat.replaceChildren();
        options.replaceChildren();
        status.textContent = type === "return"
            ? "帰宅時刻は目安で構わない。"
            : "約束は、今夜「寝る」を選んだ時に果たされる。";

        const bubble = document.createElement("p");
        bubble.className = "haven-promise-bubble";
        bubble.textContent = question;
        chat.append(bubble);

        choices.forEach(function (choice) {
            const button = document.createElement("button");
            button.type = "button";
            button.dataset.promiseChoice = choice.id;
            button.textContent = choice.label;
            button.addEventListener("click", function () {
                choosePromise(type, choice);
            });
            options.append(button);
        });

        markPrompted(type);
        overlay.hidden = false;
        document.body.classList.add("haven-promise-open");
    }

    function choosePromise(type, choice) {
        const now = new Date();
        const declined = choice.id === "undecided" || choice.id === "decline";
        const promise = {
            type,
            status: declined ? "declined" : "pending",
            choice: choice.id,
            label: choice.label,
            targetMinutes: Number.isFinite(choice.targetMinutes)
                ? choice.targetMinutes
                : null,
            openEnded: Boolean(choice.openEnded),
            createdAt: now.toISOString(),
            fulfilledAt: null
        };
        updatePromise(promise);
        rhythm.recordEvent(declined ? "promise-declined" : "promise-made", promise);

        const chat = document.getElementById("havenPromiseChat");
        const options = document.getElementById("havenPromiseOptions");
        const status = document.getElementById("havenPromiseStatus");
        if (options) options.replaceChildren();

        if (chat) {
            const answer = document.createElement("p");
            answer.className = "haven-promise-bubble haven-promise-answer";
            answer.textContent = choice.label;
            chat.append(answer);

            const reply = document.createElement("p");
            reply.className = "haven-promise-bubble";
            reply.textContent = declined
                ? "分かった。予定が決まらない日もある。無事に戻れば、それでいい。"
                : type === "return"
                    ? `${choice.label}だな。分かった。気をつけて戻れ。`
                    : "約束だ。今夜は、私の隣へ戻ってこい。";
            chat.append(reply);
        }

        if (status) status.textContent = declined
            ? "今日は約束を決めずにおきます。"
            : "今日の約束として記録しました。";

        statusTimer = window.setTimeout(closeOverlay, 1450);
    }

    function showPromptIfNeeded() {
        window.clearTimeout(promptTimer);
        if (!canPrompt()) return false;

        if (document.body.classList.contains("splash-active")) {
            promptTimer = window.setTimeout(showPromptIfNeeded, 600);
            return false;
        }

        renderPrompt(currentPromptType());
        return true;
    }

    function latestArrival() {
        const arrivals = getToday().arrivals;
        return Array.isArray(arrivals) && arrivals.length
            ? arrivals[arrivals.length - 1]
            : null;
    }

    function returnPromiseIsFulfilled(promise, value = new Date()) {
        const minutes = nowMinutes(value);
        const arrival = latestArrival();
        const awaySeconds = Number(arrival?.awaySeconds) || 0;
        if (awaySeconds < MIN_RETURN_AWAY_SECONDS) return false;

        const earliest = Math.max(12 * 60, promise.targetMinutes - RETURN_EARLY_WINDOW_MINUTES);
        if (minutes < earliest) return false;
        if (promise.openEnded) return true;
        return minutes <= promise.targetMinutes + RETURN_GRACE_MINUTES;
    }

    async function addVestigioEntry(promise, fulfilledAt) {
        if (!window.HavenHuella?.importEntries) return false;

        const dateKey = rhythm.dayKey(fulfilledAt);
        const isReturn = promise.type === "return";
        const quote = isReturn
            ? "おかえり、レイ。待っていた。"
            : "俺の隣へ横になれ。目を閉じる時、お前がここにいると感じていたい。";
        const body = isReturn
            ? `${promise.label}に戻る約束を守った。セバス：「${quote}」`
            : `今夜は一緒に寝る約束を守った。セバス：「${quote}」`;

        await window.HavenHuella.importEntries([{
            id: `haven-promise-${dateKey}-${promise.type}`,
            entryType: "diary",
            dateKey,
            title: isReturn ? "帰宅の約束" : "一緒に眠る約束",
            time: "",
            body,
            createdAt: fulfilledAt,
            updatedAt: fulfilledAt,
            systemType: "promise-fulfilled"
        }], { replace: false });
        return true;
    }

    function playFulfilledVoice(type) {
        if (!window.HavenVoice?.play) return;
        if (type === "return") {
            window.HavenVoice.play("normal", "message", [0]);
        } else {
            window.HavenVoice.play("bedtime", "sleepMessage", [1]);
        }
    }

    async function fulfillPromise(type, source) {
        if (completing) return false;
        const promise = getPromise();
        if (!promise || promise.type !== type || promise.status !== "pending") return false;

        completing = true;
        const fulfilledAt = Date.now();
        const completed = {
            ...promise,
            status: "fulfilled",
            fulfilledAt: new Date(fulfilledAt).toISOString(),
            fulfilledSource: source
        };
        updatePromise(completed);
        rhythm.recordEvent("promise-fulfilled", completed);

        const line = type === "return"
            ? "おかえり、レイ。待っていた。約束どおりだな。"
            : "約束どおり来たな。俺の隣へ横になれ。";
        if (type === "return") setMessage("message", line, { profile: "voice" });
        else setBothMessages(line, { profile: "voice" });

        // 就寝達成時は「寝る」の直接操作中に再生を始め、
        // iOSのユーザー操作制限を越えないようにする。
        playFulfilledVoice(type);

        try {
            await addVestigioEntry(completed, fulfilledAt);
        } catch (error) {
            console.warn("Promise entry could not be added to Vestigio.", error);
        }

        completing = false;
        return true;
    }

    function checkReturnPromise(source = "launch") {
        const promise = getPromise();
        if (!promise || promise.type !== "return" || promise.status !== "pending") return false;
        if (!returnPromiseIsFulfilled(promise)) return false;
        fulfillPromise("return", source);
        return true;
    }

    function checkSleepPromise() {
        const promise = getPromise();
        if (!promise || promise.type !== "sleep" || promise.status !== "pending") return false;
        fulfillPromise("sleep", "sleep-start");
        return true;
    }

    document.getElementById("sleepStart")?.addEventListener("click", checkSleepPromise);

    document.addEventListener("visibilitychange", function () {
        if (document.hidden) return;
        window.setTimeout(function () {
            if (!checkReturnPromise("resume")) showPromptIfNeeded();
        }, 120);
    });

    window.HavenPromises = {
        showPrompt: showPromptIfNeeded,
        checkReturn: checkReturnPromise,
        checkSleep: checkSleepPromise,
        getPromise,
        fulfill: fulfillPromise
    };

    promptTimer = window.setTimeout(function () {
        if (!checkReturnPromise("launch")) showPromptIfNeeded();
    }, PROMPT_DELAY_MS);
})();
