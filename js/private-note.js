(function () {
    "use strict";

    const STORAGE_KEY = "haven_private_notes";
    const $ = id => document.getElementById(id);
    const e = {
        open: $("openPrivateNote"),
        close: $("closePrivateNote"),
        overlay: $("privateNoteOverlay"),
        noteTab: $("privateNoteTab"),
        promiseTab: $("privatePromiseTab"),
        promiseSignal: $("privatePromiseSignal"),
        thread: $("privateNoteThread"),
        empty: $("privateNoteEmpty"),
        promiseThread: $("privatePromiseThread"),
        promiseEmpty: $("privatePromiseEmpty"),
        form: $("privateNoteForm"),
        input: $("privateNoteInput")
    };
    const replies = [
        "預かった。忘れない。",
        "分かった。こちらで覚えておく。",
        "確認した。必要になったら、またここへ来い。",
        "残しておけ。お前の言葉なら、俺が持っている。",
        "読んだ。……安心しろ、失くさない。"
    ];
    const timers = new Map();
    let editingId = "";
    let activeTab = "note";

    if (!e.overlay || !e.form || !e.thread) return;
    if (e.overlay.parentElement !== document.body) document.body.appendChild(e.overlay);

    function load() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(value) ? value : [];
        } catch (_) {
            return [];
        }
    }

    function save(notes) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }

    function makeId() {
        return crypto.randomUUID?.() || `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function formatTime(value) {
        return new Date(value).toLocaleString("ja-JP", {
            month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
    }

    function notePhase(note, now = Date.now()) {
        if (!note.readAt || !note.replyAt) return "replied";
        if (now >= note.replyAt) return "replied";
        if (now >= note.readAt) return "read";
        return "sent";
    }

    function bubble(text, role, time, noteId, statusText = "") {
        const group = document.createElement("div");
        group.className = `private-note-message-group private-note-message-group--${role}`;
        const article = document.createElement("article");
        article.className = `private-note-message private-note-message--${role}`;
        const body = document.createElement("p");
        body.textContent = text;
        const meta = document.createElement("div");
        meta.className = "private-note-message-meta";
        const stamp = document.createElement("time");
        stamp.dateTime = new Date(time).toISOString();
        stamp.textContent = formatTime(time);
        meta.append(stamp);
        if (role === "user" && statusText) {
            const delivery = document.createElement("span");
            delivery.className = "private-note-delivery";
            delivery.textContent = statusText;
            meta.append(delivery);
        }
        if (role === "user" && noteId) {
            const edit = document.createElement("button");
            edit.type = "button";
            edit.textContent = "編集";
            edit.addEventListener("click", () => beginEdit(noteId));
            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "削除";
            remove.addEventListener("click", () => deleteNote(noteId));
            meta.append(edit, remove);
        }
        article.append(body);
        group.append(article, meta);
        return group;
    }

    function typingBubble() {
        const article = document.createElement("article");
        article.className = "private-note-message private-note-message--sebas private-note-message--typing";
        article.setAttribute("aria-label", "セバスが入力中");
        article.innerHTML = "<span></span><span></span><span></span>";
        return article;
    }

    function deliveryLabel(phase) {
        if (phase === "sent") return "Enviado ✓";
        return "Leído ✓✓";
    }

    function clearTimers() {
        timers.forEach(timer => clearTimeout(timer));
        timers.clear();
    }

    function scheduleRefresh(notes) {
        clearTimers();
        const now = Date.now();
        notes.forEach(note => {
            if (!note.readAt || !note.replyAt) return;
            [note.readAt, note.replyAt].forEach((at, index) => {
                if (at <= now) return;
                const key = `${note.id}-${index}`;
                timers.set(key, setTimeout(() => {
                    timers.delete(key);
                    render({animateLast: index === 1});
                }, Math.max(0, at - Date.now()) + 20));
            });
        });
    }

    function setComposerPending(pending) {
        const submit = e.form.querySelector("button[type=submit]");
        submit.disabled = pending && !editingId;
        e.input.disabled = pending && !editingId;
        e.form.classList.toggle("is-waiting", pending && !editingId);
    }

    function render({animateLast = false} = {}) {
        const notes = load().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        const now = Date.now();
        e.thread.replaceChildren();
        if (!notes.length) {
            e.empty.hidden = false;
            e.thread.append(e.empty);
        }
        notes.forEach((note, index) => {
            const phase = notePhase(note, now);
            const hasDelivery = Boolean(note.readAt && note.replyAt);
            e.thread.append(bubble(
                note.text,
                "user",
                note.updatedAt || note.createdAt,
                note.id,
                hasDelivery ? deliveryLabel(phase) : "Leído ✓✓"
            ));
            if (phase === "read") {
                e.thread.append(typingBubble());
            } else if (phase === "replied") {
                const reply = bubble(note.reply, "sebas", note.replyAt || note.createdAt + 1, note.id);
                if (animateLast && index === notes.length - 1) reply.classList.add("private-note-message--arriving");
                e.thread.append(reply);
            }
        });
        const pending = notes.some(note => notePhase(note, now) !== "replied");
        setComposerPending(pending);
        scheduleRefresh(notes);
        requestAnimationFrame(() => { e.thread.scrollTop = e.thread.scrollHeight; });
    }

    function loadPromiseDays() {
        try {
            const state = JSON.parse(localStorage.getItem("havenLifeRhythmV1") || "{}");
            return Object.values(state.days || {})
                .filter(day => day && day.promise)
                .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
        } catch (_) {
            return [];
        }
    }

    function promiseQuestion(type) {
        return type === "return"
            ? "今日は何時頃に戻る？　待つ時間くらい、知っておきたい。"
            : "今夜は一緒に寝るか？　先に約束しておけば、お前も少しは切り上げるだろう。";
    }

    function promiseReply(promise) {
        if (promise.status === "declined") return "分かった。予定が決まらない日もある。無事に戻れば、それでいい。";
        return promise.type === "return"
            ? `${promise.label || "その時刻"}だな。分かった。気をつけて戻れ。`
            : "約束だ。今夜は、私の隣へ戻ってこい。";
    }

    function fulfilledReply(promise) {
        if (promise.status !== "fulfilled") return "";
        return promise.type === "return"
            ? "おかえり、レイ。待っていた。約束どおりだな。"
            : "約束どおり来たな。俺の隣へ横になれ。";
    }

    function statusLabel(promise) {
        if (promise.status === "fulfilled") return "達成";
        if (promise.status === "pending") return "約束中";
        return "未定";
    }

    function formatDateKey(value) {
        const [year, month, day] = String(value || "").split("-").map(Number);
        if (!year || !month || !day) return value || "日付なし";
        return new Date(year, month - 1, day, 12).toLocaleDateString("ja-JP", {
            year: "numeric", month: "long", day: "numeric", weekday: "short"
        });
    }

    function renderPromises() {
        const days = loadPromiseDays();
        e.promiseThread.replaceChildren();
        const pending = days.some(day => day.promise?.status === "pending");
        e.promiseSignal.hidden = !pending;
        if (!days.length) {
            e.promiseEmpty.hidden = false;
            e.promiseThread.append(e.promiseEmpty);
            return;
        }
        days.forEach((day, index) => {
            const promise = day.promise;
            const group = document.createElement("details");
            group.className = "private-promise-day";
            group.open = index === 0 || promise.status === "pending";
            const summary = document.createElement("summary");
            const date = document.createElement("span");
            date.textContent = formatDateKey(day.date);
            const status = document.createElement("strong");
            status.dataset.status = promise.status || "declined";
            status.textContent = statusLabel(promise);
            summary.append(date, status);
            const chat = document.createElement("div");
            chat.className = "private-promise-chat";
            chat.append(bubble(promiseQuestion(promise.type), "sebas", promise.createdAt || day.firstOpenedAt || Date.now(), ""));
            chat.append(bubble(promise.label || "未定", "user", promise.createdAt || day.firstOpenedAt || Date.now(), ""));
            chat.append(bubble(promiseReply(promise), "sebas", promise.createdAt || day.firstOpenedAt || Date.now(), ""));
            const fulfilled = fulfilledReply(promise);
            if (fulfilled) chat.append(bubble(fulfilled, "sebas", promise.fulfilledAt || promise.createdAt, ""));
            group.append(summary, chat);
            e.promiseThread.append(group);
        });
        requestAnimationFrame(() => { e.promiseThread.scrollTop = 0; });
    }

    function switchTab(tab) {
        activeTab = tab === "promise" ? "promise" : "note";
        const promises = activeTab === "promise";
        e.noteTab.classList.toggle("active", !promises);
        e.promiseTab.classList.toggle("active", promises);
        e.noteTab.setAttribute("aria-selected", String(!promises));
        e.promiseTab.setAttribute("aria-selected", String(promises));
        e.thread.hidden = promises;
        e.promiseThread.hidden = !promises;
        e.form.hidden = promises;
        if (promises) renderPromises();
        else render();
    }

    function signalLauncher() {
        if (!e.open) return;
        e.open.classList.remove("is-signaling");
        void e.open.offsetWidth;
        e.open.classList.add("is-signaling");
        setTimeout(() => e.open?.classList.remove("is-signaling"), 1500);
    }

    function open() {
        signalLauncher();
        renderPromises();
        switchTab(activeTab);
        e.overlay.hidden = false;
        document.body.classList.add("private-note-open");
    }

    function close() {
        e.overlay.hidden = true;
        document.body.classList.remove("private-note-open");
        cancelEdit();
    }

    function cancelEdit() {
        editingId = "";
        e.form.reset();
        e.form.querySelector("button[type=submit]").textContent = "Enviar";
        render();
    }

    function beginEdit(id) {
        const note = load().find(item => item.id === id);
        if (!note) return;
        editingId = id;
        e.input.disabled = false;
        e.input.value = note.text;
        e.form.querySelector("button[type=submit]").disabled = false;
        e.form.querySelector("button[type=submit]").textContent = "Actualizar";
        e.input.focus();
    }

    function deleteNote(id) {
        if (!confirm("この伝言を削除しますか？")) return;
        save(load().filter(note => note.id !== id));
        if (editingId === id) cancelEdit();
        else render();
    }

    function submit(event) {
        event.preventDefault();
        const text = e.input.value.trim();
        if (!text) return;
        const notes = load();
        if (editingId) {
            const note = notes.find(item => item.id === editingId);
            if (note) {
                note.text = text;
                note.updatedAt = Date.now();
            }
            save(notes);
            cancelEdit();
            return;
        }
        const createdAt = Date.now();
        const readDelay = 700 + Math.floor(Math.random() * 401);
        const replyDelay = Math.min(3500, Math.max(1800, 1500 + text.length * 38));
        notes.push({
            id: makeId(),
            text,
            reply: replies[Math.floor(Math.random() * replies.length)],
            createdAt,
            updatedAt: createdAt,
            readAt: createdAt + readDelay,
            replyAt: createdAt + readDelay + replyDelay
        });
        save(notes);
        e.form.reset();
        render();
    }

    e.open?.addEventListener("click", open);
    e.noteTab?.addEventListener("click", () => switchTab("note"));
    e.promiseTab?.addEventListener("click", () => switchTab("promise"));
    e.close?.addEventListener("click", close);
    e.form?.addEventListener("submit", submit);
    e.overlay?.addEventListener("click", event => { if (event.target === e.overlay) close(); });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !e.overlay?.hidden) close();
    });

    window.addEventListener("storage", event => {
        if (event.key === STORAGE_KEY && !e.overlay.hidden) render();
    });

    window.HavenPrivateNote = { open, render, renderPromises };
})();
