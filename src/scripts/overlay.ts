import type { StartSelectionMsg, EndSelectionMsg, StopSelectionMsg } from "../types/types";

let startX = 0;
let startY = 0;

let selectionBox: HTMLDivElement | null = null;
let overlay: HTMLDivElement | null = null;

declare global {
    var isInitialized: boolean | undefined;
}

if (!globalThis.isInitialized) {
    globalThis.isInitialized = true;

    chrome.runtime.onMessage.addListener((msg: StartSelectionMsg | StopSelectionMsg) => {
        if (msg.action === "start-selection") {
            createOverlay();
            return;
        }

        if (msg.action === "stop-selection") {
            removeOverlay();
        }
    });
}

function createOverlay() {
    removeOverlay();

    overlay = document.createElement("div");
    overlay.id = "overlay";
    document.body.appendChild(overlay);

    overlay.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown, true);
}

function removeOverlay() {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.removeEventListener("keydown", onKeyDown, true);

    document.querySelectorAll(`#overlay`).forEach((node) => node.remove());

    selectionBox = null;
    overlay = null;
}

function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
        e.preventDefault();
        removeOverlay();
    }
}

function onMouseDown(e: MouseEvent) {
    if (!overlay) {
        return;
    }

    startX = e.clientX;
    startY = e.clientY;

    selectionBox = document.createElement("div");
    selectionBox.classList.add("selection");
    overlay.appendChild(selectionBox);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(e: MouseEvent) {
    if (!selectionBox) {
        return;
    }

    const width = e.clientX - startX;
    const height = e.clientY - startY;
    
    selectionBox.style.left = `${Math.min(startX, e.clientX)}px`;
    selectionBox.style.top = `${Math.min(startY, e.clientY)}px`;
    selectionBox.style.width = `${Math.abs(width)}px`;
    selectionBox.style.height = `${Math.abs(height)}px`;
}

function onMouseUp() {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);

    if (!selectionBox) {
        removeOverlay();
        return;
    }

    const selectedRegion = selectionBox!.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;

    chrome.runtime.sendMessage<EndSelectionMsg>({
        action: "end-selection",
        selectedRegion: {
            left: selectedRegion.left,
            top: selectedRegion.top,
            width: selectedRegion.width,
            height: selectedRegion.height
        },
        devicePixelRatio
    });

    removeOverlay();
}