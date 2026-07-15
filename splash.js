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

        removeTimer = window.setTimeout(() => {
            splash.remove();

            const message = document.getElementById("message");
            if (message && Math.random() < 0.34) {
                message.textContent = "……来たか。";
            }
        }, 780);
    }

    // 通常は星座とロゴを見せたあと、Homeへ静かに移る。
    finishTimer = window.setTimeout(finishSplash, 5450);

    if (skipButton) {
        skipButton.addEventListener("click", finishSplash);
    }

    // 長押しや連続タップを必要とせず、画面のどこを押してもスキップ可能。
    splash.addEventListener("pointerdown", (event) => {
        if (event.target === skipButton) return;
        finishSplash();
    });

    // 何らかの理由でアニメーションが止まっても画面を塞ぎ続けない安全弁。
    window.setTimeout(() => {
        if (!finished) finishSplash();
    }, 8500);
})();
