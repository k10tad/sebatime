//========================
// Haven ページ切替
//========================

const havenPages = Array.from(document.querySelectorAll(".app-page"));
const havenNavButtons = Array.from(document.querySelectorAll("[data-page-target]"));
const havenBackButtons = Array.from(document.querySelectorAll("[data-go-page]"));

function showHavenPage(pageName, options = {}) {
    const targetPage = document.querySelector(
        `.app-page[data-page="${pageName}"]`
    );

    if (!targetPage) return;

    const currentPage = document.querySelector(".app-page.active");
    const currentName = currentPage ? currentPage.dataset.page : null;
    const isActualChange = currentName !== pageName;

    havenPages.forEach(function (page) {
        const isTarget = page === targetPage;
        page.classList.toggle("active", isTarget);
        page.setAttribute("aria-hidden", String(!isTarget));
    });

    havenNavButtons.forEach(function (button) {
        button.classList.toggle(
            "active",
            button.dataset.pageTarget === pageName
        );
    });

    if (isActualChange && options.silent !== true) {
        if (typeof playPageStepSound === "function") {
            playPageStepSound();
        }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

havenNavButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        showHavenPage(button.dataset.pageTarget);
    });
});

havenBackButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        showHavenPage(button.dataset.goPage);
    });
});

// 起動時は足音を鳴らさずHomeを表示する。
showHavenPage("home", { silent: true });
