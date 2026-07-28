(function () {
    "use strict";

    const targetIds = ["message", "sleepMessage", "alarmWakeMessage"];
    const states = new WeakMap();
    const observers = new WeakMap();

    function characterDelay(character) {
        if ("。！？!?".includes(character)) return 260;
        if ("、，,；;：:".includes(character)) return 135;
        if ("…".includes(character)) return 190;
        return 62;
    }

    function resolveTarget(targetOrId) {
        return typeof targetOrId === "string"
            ? document.getElementById(targetOrId)
            : targetOrId;
    }

    function cancelHavenTypewriter(targetOrId) {
        const target = resolveTarget(targetOrId);
        const state = target && states.get(target);
        if (!state) return;
        clearTimeout(state.timer);
        state.cancelled = true;
        states.delete(target);
    }

    function setHavenDialogue(targetOrId, value, options = {}) {
        const target = resolveTarget(targetOrId);
        if (!target) return;

        const text = String(value ?? "");
        cancelHavenTypewriter(target);

        if (!text || options.instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            const node = document.createTextNode(text);
            target.replaceChildren(node);
            states.set(target, { node, timer: null, cancelled: false, complete: true });
            return;
        }

        const node = document.createTextNode("");
        const state = { node, timer: null, cancelled: false, complete: false };
        states.set(target, state);
        target.replaceChildren(node);

        let index = 0;
        const writeNext = function () {
            if (state.cancelled || !target.isConnected || states.get(target) !== state) return;
            const character = text[index];
            node.data += character;
            index += 1;

            if (index < text.length) {
                state.timer = setTimeout(writeNext, characterDelay(character));
            } else {
                state.complete = true;
                state.timer = null;
            }
        };

        writeNext();
    }

    function watchDialogueTarget(target) {
        if (!target || observers.has(target)) return;

        const observer = new MutationObserver(function () {
            const state = states.get(target);
            if (state && target.childNodes.length === 1 && target.firstChild === state.node) return;

            const nextText = target.textContent || "";
            if (nextText) setHavenDialogue(target, nextText);
            else cancelHavenTypewriter(target);
        });

        observer.observe(target, { childList: true });
        observers.set(target, observer);

        const initialText = target.textContent || "";
        if (initialText) setHavenDialogue(target, initialText);
    }

    targetIds
        .map(id => document.getElementById(id))
        .filter(Boolean)
        .forEach(watchDialogueTarget);

    window.setHavenDialogue = setHavenDialogue;
    window.cancelHavenTypewriter = cancelHavenTypewriter;
})();
