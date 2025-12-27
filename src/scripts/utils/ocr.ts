import { createWorker } from "tesseract.js";
import type { Worker } from "tesseract.js";
import type { endSelectionMsg, resultMsg } from "../../types/types";

let worker: Worker | null = null;
let intervalId: number | null = null;
let selectedRegion: DOMRect | null = null;

chrome.runtime.onMessage.addListener((msg: endSelectionMsg) => {
    if (msg.action === "end-selection") {
        selectedRegion = msg.selectedRegion;
        startLoop();
    }
});

// initialize tesseract.js worker and start the processing loop
async function startLoop() {
    // if the selectedRegion is not received from overlay.ts, return
    if (!selectedRegion) {
        return;
    }
    
    // create tesseract.js worker
    if (!worker) {
        worker = await createWorker("eng");
    }

    if (intervalId) {
        clearInterval(intervalId);
    }

    intervalId = window.setInterval(async () => {
        const canvas = captureSelectedRegion(selectedRegion!);
        const text = await runLoop(canvas);

        chrome.runtime.sendMessage<resultMsg>({
            action: "result",
            text
        });
    }, 3000);
}

function captureSelectedRegion(region: DOMRect): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const scale = window.devicePixelRatio;

    canvas.width = region.width * scale;
    canvas.height = region.height * scale;

    ctx.scale(scale, scale);
    ctx.drawImage(
        document.documentElement as unknown as CanvasImageSource,
        region.left,
        region.top,
        region.width,
        region.height,
        0,
        0,
        region.width,
        region.height
    );

    return canvas;
}

async function runLoop(canvas: HTMLCanvasElement): Promise<string> {
    if (!worker) {
        return "";
    }

    const {data: { text }} = await worker.recognize(canvas);
    return text.trim();
}