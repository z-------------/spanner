"use strict";

/* audio globals */

const audioContext = new AudioContext();
const pannerMap = new Map();
const trackMap = new Map();

/* state apparatus */

const state = {
    toggle: false,
    pan: 0,
};

const [handleStateChange, addStateListener] = (() => {
    const keys = Object.keys(state);

    const prevState = {};
    const listeners = {};
    for (const key of keys) {
        prevState[key] = null;
        listeners[key] = [];
    }

    const result = [];
    result.push((key) => {
        if (state[key] !== prevState[key]) {
            for (const listener of listeners[key]) {
                listener(state[key]);
            }
        }
        prevState[key] = state[key];
    });
    result.push((key, listener) => {
        listeners[key].push(listener);
    });
    return result;
})();

/* state listeners */

addStateListener("toggle", toggle => {
    console.log("toggle listener:", toggle);

    if (toggle) { // off -> on
        // see if there are any new media elements
        const allMediaElems = document.querySelectorAll("audio, video");
        for (const elem of allMediaElems) {
            if (!trackMap.has(elem)) {
                trackMap.set(elem, audioContext.createMediaElementSource(elem));
            }
            if (!pannerMap.has(elem)) {
                pannerMap.set(elem, new StereoPannerNode(audioContext));
            }
        }
        console.log(trackMap, pannerMap);

        for (const [elem, track] of trackMap.entries()) {
            console.log("connect", track);
            const panner = pannerMap.get(elem);
            track.connect(panner).connect(audioContext.destination);
            console.log("to panner with pan =", panner.pan.value);
        }
    } else { // on -> off
        for (const [elem, track] of trackMap.entries()) {
            console.log("DISconnect", track);
            const panner = pannerMap.get(elem);
            track.disconnect(panner);
            track.connect(audioContext.destination);
            console.log("FROM panner with pan =", panner.pan.value);
        }
    }
});

addStateListener("pan", pan => {
    console.log("pan listener:", pan);
    for (const [, panner] of pannerMap.entries()) {
        panner.pan.value = pan;
    }
})

/* communication with controls */

browser.runtime.onMessage.addListener(([cmd, arg], sender, sendResponse) => {
    console.log("message:", cmd, arg);
    const [key, isQuery] = cmd[cmd.length - 1] === "?" ?
        [cmd.slice(0, -1), true] :
        [cmd, false];
    if (!state.hasOwnProperty(key)) {
        const verb = isQuery ? "get" : "set";
        return sendResponse(new Error(`Cannot ${verb} nonexistence state key '${key}'.`));
    }

    if (isQuery) {
        sendResponse(state[key]);
    } else {
        state[key] = arg;
        handleStateChange(key);
    }
});
