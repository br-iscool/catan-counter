import type { EndSelectionMsg, ImageMsg, RequestMsg, ResultMsg, StartSelectionMsg } from "../../types/types";

chrome.runtime.onMessage.addListener(
    (msg: ResultMsg | StartSelectionMsg | RequestMsg | EndSelectionMsg, sender) => {

        if (msg.action === "end-selection") {
            const tabId = sender.tab?.id;
            if (!tabId) {
                console.warn("Error, area was not captured due to missing tab id");
                return false;
            }

            chrome.tabs.sendMessage(tabId, msg, () => {
                const sendErr = chrome.runtime.lastError;
                if (sendErr) {
                    console.warn("Error, failed to send captured area to tab:", sendErr.message);
                }
            });

            return false;
        }

        if (msg.action === "ocr-request") {
            const tabId = sender.tab?.id;
            const windowId = typeof sender.tab?.windowId === "number" ? sender.tab.windowId : chrome.windows.WINDOW_ID_CURRENT;

            if (!tabId) {
                console.warn("Error, area was not captured due to missing tab id");
                return false;
            }

            chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (dataUrl) => {
                const err = chrome.runtime.lastError;
                if (err) {
                    console.warn("Error, failed to capture tab:", err.message);
                    return;
                }
                if (!dataUrl) {
                    console.warn("Error, failed to capture tab: empty dataUrl");
                    return;
                }

                const payload: ImageMsg = {
                    action: "ocr-image",
                    dataUrl,
                    selectedRegion: msg.selectedRegion,
                    devicePixelRatio: msg.devicePixelRatio
                };

                chrome.tabs.sendMessage(tabId, payload, () => {
                    const sendErr = chrome.runtime.lastError;
                    if (sendErr) {
                        console.warn("Error, failed to send image to OCR:", sendErr.message);
                    }
                });
            });
        }

        if (msg.action === "result") {
            chrome.storage.local.set({
                lastOcrText: msg.text,
                lastOcrTime: Date.now()
            });
        }

        return false;
    }
);