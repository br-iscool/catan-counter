import { createWorker } from "tesseract.js";
import type { Worker } from "tesseract.js";
import type { endSelectionMsg, imageMsg, requestMsg, resultMsg, SelectedRegion, stopResultMsg } from "../../types/types";

let worker: Worker | null = null;
let queue: Promise<void> = Promise.resolve();
let intervalId: number | null = null;

let selectedRegion: SelectedRegion | null = null;
let selectedDevicePixelRatio = 1;

let requestInFlight = false;
let requestInFlightTimeoutId: number | null = null;

let isUnloading = false;

function cleanup() {
    isUnloading = true;

    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }

    if (requestInFlightTimeoutId) {
        clearTimeout(requestInFlightTimeoutId);
        requestInFlightTimeoutId = null;
    }

    requestInFlight = false;
    selectedRegion = null;

    if (worker) {
        void worker.terminate().catch(() => {
            // ignore termination error
        });
        worker = null;
    }
}

window.addEventListener("pagehide", cleanup);
window.addEventListener("beforeunload", cleanup);

chrome.runtime.onMessage.addListener((msg: endSelectionMsg | imageMsg | stopResultMsg) => {
    if (isUnloading) {
        return;
    }

    if (msg.action === "stop-ocr") {
        cleanup();
        return;
    }

    if (msg.action === "end-selection") {
        selectedRegion = msg.selectedRegion;
        selectedDevicePixelRatio = msg.devicePixelRatio || 1;
        startRepeatingOcr();
        return;
    }

    if (msg.action !== "ocr-image") {
        return;
    }

    queue = queue
        .then(() => processOcr(msg))
        .catch((err) => {
            if (err instanceof Error) {
                console.error("Error, OCR failed:", err.message, err.stack);
            } else {
                console.error("Error, OCR failed:", err);
            }
        });
});

function startRepeatingOcr() {
    if (!selectedRegion) {
        return;
    }

    if (intervalId) {
        clearInterval(intervalId);
    }

    requestInFlight = false;
    if (requestInFlightTimeoutId) {
        clearTimeout(requestInFlightTimeoutId);
        requestInFlightTimeoutId = null;
    }

    void requestScreenshotForOcr();
    intervalId = window.setInterval(() => {
        void requestScreenshotForOcr();
    }, 3000);
}

async function requestScreenshotForOcr(): Promise<void> {
    if (!selectedRegion) {
        return;
    }

    if (requestInFlight) {
        return;
    }

    requestInFlight = true;
    if (requestInFlightTimeoutId) {
        clearTimeout(requestInFlightTimeoutId);
    }
    requestInFlightTimeoutId = window.setTimeout(() => {
        requestInFlight = false;
        requestInFlightTimeoutId = null;
    }, 15000);

    chrome.runtime.sendMessage<requestMsg>({
        action: "ocr-request",
        selectedRegion,
        devicePixelRatio: selectedDevicePixelRatio
    });
}

async function ensureWorker(): Promise<Worker> {
    if (!worker) {
        const workerPath = chrome.runtime.getURL("tesseract/worker.min.js");
        const corePath = chrome.runtime.getURL("tesseract/tesseract-core.wasm.js");

        worker = await createWorker(
            "eng",
            1,
            {
                workerPath,
                corePath,
                logger: (m) => {
                    console.log("OCR:", m.status, m.progress);
                    void m;
                },
                errorHandler: (err) => {
                    console.error("Error, Tesseract worker failed:", err);
                }
            }
        );
    }
    return worker;
}

async function processOcr(msg: imageMsg): Promise<void> {
    if (isUnloading) {
        requestInFlight = false;
        return;
    }

    const activeWorker = await ensureWorker();
    const canvas = await cropScreenshotToCanvas(
        msg.dataUrl,
        msg.selectedRegion,
        msg.devicePixelRatio
    );

    const { data: { text } } = await activeWorker.recognize(canvas);
    const cleaned = text.trim();

    console.log("Capture succeeded:", cleaned);

    requestInFlight = false;
    if (requestInFlightTimeoutId) {
        clearTimeout(requestInFlightTimeoutId);
        requestInFlightTimeoutId = null;
    }

    chrome.runtime.sendMessage<resultMsg>({
        action: "result",
        text: cleaned
    });
}

function cropScreenshotToCanvas(
    dataUrl: string,
    region: SelectedRegion,
    devicePixelRatio: number
): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const dpr = devicePixelRatio || 1;
            const sx = Math.max(0, Math.floor(region.left * dpr));
            const sy = Math.max(0, Math.floor(region.top * dpr));
            const sw = Math.max(1, Math.floor(region.width * dpr));
            const sh = Math.max(1, Math.floor(region.height * dpr));

            const maxW = img.naturalWidth || img.width;
            const maxH = img.naturalHeight || img.height;

            const clampedW = Math.max(1, Math.min(sw, maxW - sx));
            const clampedH = Math.max(1, Math.min(sh, maxH - sy));

            const canvas = document.createElement("canvas");
            canvas.width = clampedW;
            canvas.height = clampedH;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Error, failed to initialize 2D canvas context"));
                return;
            }

            ctx.drawImage(img, sx, sy, clampedW, clampedH, 0, 0, clampedW, clampedH);
            resolve(canvas);
        };
        img.onerror = () => reject(new Error("Error, failed to load screenshot image"));
        img.src = dataUrl;
    });
}