//========================
// Haven Orion Splash — mobile-safe
//========================

(function () {
    const splash = document.getElementById("havenSplash");
    const skipButton = document.getElementById("skipSplash");

    if (!splash) {
        document.documentElement.classList.remove("splash-lock");
        document.body.classList.remove("splash-active");
        return;
    }

    document.documentElement.classList.add("splash-lock");
    document.body.classList.add("splash-active");

    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    let finished = false;
    let finishTimer = window.setTimeout(finishSplash, 5450);

    function finishSplash() {
        if (finished) return;
        finished = true;
        window.clearTimeout(finishTimer);

        splash.classList.add("is-leaving");
        document.documentElement.classList.remove("splash-lock");
        document.body.classList.remove("splash-active");

        window.setTimeout(function () {
            splash.remove();
            window.scrollTo(0, 0);

            const message = document.getElementById("message");
            if (message && Math.random() < 0.34) message.textContent = "……来たか。";
        }, 740);
    }

    if (skipButton) {
        skipButton.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            finishSplash();
        });
    }

    splash.addEventListener("pointerdown", function (event) {
        if (event.target === skipButton) return;
        finishSplash();
    });

    window.setTimeout(function () {
        if (!finished) finishSplash();
    }, 8000);
})();
