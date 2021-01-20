"use strict";

console.log("popup.js loaded.");

async function getCurrentTabId() {
    const m = await browser.tabs.query({ active: true, currentWindow: true });
    return m[0].id;
}

async function setupControl(name, valueAttrName = "value") {
    const elem = document.getElementById(`control-${name}`);
    elem[valueAttrName] = await browser.tabs.sendMessage(await getCurrentTabId(), [name + "?"]);
    elem.addEventListener("change", async e => {
        await browser.tabs.sendMessage(await getCurrentTabId(), [name, e.target[valueAttrName]]);
    });
}

(async () => {
    await setupControl("toggle", "checked");
    await setupControl("pan");
})();
