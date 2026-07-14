//========================
// Haven ページ切替
//========================

const havenPages = document.querySelectorAll(".app-page");
const havenNavButtons = document.querySelectorAll("[data-page-target]");
const havenPageLinks = document.querySelectorAll("[data-go-page]");

function showHavenPage(pageName) {
    const targetPage = document.querySelector(
        `.app-page[data-page="${pageName}"]`
    );

    if (!targetPage) return;

    havenPages.forEach(page => {
        const isActive = page === targetPage;
        page.classList.toggle("active", isActive);
        page.setAttribute("aria-hidden", String(!isActive));
    });

    havenNavButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.pageTarget === pageName
        );
    });

    localStorage.setItem("havenCurrentPage", pageName);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

havenNavButtons.forEach(button => {
    button.addEventListener("click", function () {
        showHavenPage(button.dataset.pageTarget);
    });
});

havenPageLinks.forEach(button => {
    button.addEventListener("click", function () {
        showHavenPage(button.dataset.goPage);
    });
});

const savedHavenPage = localStorage.getItem("havenCurrentPage");

if (savedHavenPage && savedHavenPage !== "home") {
    showHavenPage(savedHavenPage);
}

