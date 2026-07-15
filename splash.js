//========================
// Haven Orion Splash
//========================

(function () {
    const splash = document.getElementById("havenSplash");
    const skipButton = document.getElementById("skipSplash");

    if (!splash) {
        document.body.classList.remove("splash-active");
        return;
    }

    // Safariが前回の縦スクロール位置を復元しても、起動画面は必ず先頭に置く。
    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }

    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));

    let finished = false;
    let finishTimer = null;
    let removeTimer = null;

    function finishSplash() {
        if (finished) return;
        finished = true;

        window.clearTimeout(finishTimer);
        window.clearTimeout(removeTimer);

        splash.classList.add("is-leaving");
        document.body.classList.remove("splash-active");
        window.scrollTo(0, 0);

        removeTimer = window.setTimeout(() => {
            splash.remove();
            window.scrollTo(0, 0);

            const message = document.getElementById("message");
            if (message && Math.random() < 0.34) {
                message.textContent = "……来たか。";
            }
        }, 780);
    }

    // Orion演出全体は約6秒。ページ切替・睡眠モードでは再表示しない。
    finishTimer = window.setTimeout(finishSplash, 5450);

    if (skipButton) {
        skipButton.addEventListener("click", (event) => {
            event.stopPropagation();
            finishSplash();
        });
    }

    splash.addEventListener("pointerdown", (event) => {
        if (event.target === skipButton) return;
        finishSplash();
    });

    // 端末の向きが変わった場合も、画面中央基準を維持する。
    window.addEventListener("orientationchange", () => {
        window.setTimeout(() => window.scrollTo(0, 0), 120);
    }, { passive: true });

    // アニメーション停止時の安全弁。
    window.setTimeout(() => {
        if (!finished) finishSplash();
    }, 8500);
})();
