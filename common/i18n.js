document.addEventListener("DOMContentLoaded", () => {
    const elems = document.querySelectorAll("[data-i18n]");
    for (const elem of elems) {
        const key = elem.dataset.i18n;
        elem.textContent = browser.i18n.getMessage(key);
    }
});
