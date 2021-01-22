"use strict";

/* audio globals */

const audioContext = new AudioContext();
const mapping = new Map();

/* audio processing */

function enablePan(elem) {
    // set things up if this is a new element
    if (!mapping.has(elem)) {
        const panner = new StereoPannerNode(audioContext);
        mapping.set(elem, {
            track: audioContext.createMediaElementSource(elem),
            panner,
            setPan: pan => panner.pan.value = pan,
        });
    }

    const { track, panner } = mapping.get(elem);
    track.connect(panner).connect(audioContext.destination);
}

function disablePan(elem) {
    const { track, panner } = mapping.get(elem);
    track.disconnect(panner);
    track.connect(audioContext.destination);
}

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
    if (toggle) { // off -> on
        const mediaElems = document.querySelectorAll("audio, video");
        for (const elem of mediaElems) {
            enablePan(elem);
        }
    } else { // on -> off
        for (const elem of trackMap.keys()) {
            disablePan(elem);
        }
    }
});

addStateListener("pan", pan => {
    for (const { setPan } of mapping.values()) {
        setPan(pan);
    }
})

/* communication with controls */

browser.runtime.onMessage.addListener(([cmd, arg], sender, sendResponse) => {
    const [key, isQuery] = cmd[cmd.length - 1] === "?" ?
        [cmd.slice(0, -1), true] :
        [cmd, false];
    if (!state.hasOwnProperty(key)) {
        const verb = isQuery ? "get" : "set";
        return sendResponse(new Error(`Cannot ${verb} nonexistent state key '${key}'.`));
    }

    if (isQuery) {
        sendResponse(state[key]);
    } else {
        state[key] = arg;
        handleStateChange(key);
    }
});
