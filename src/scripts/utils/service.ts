import type { resultMsg, startSelectionMsg } from "../../types/types";

chrome.runtime.onMessage.addListener(
    (msg: resultMsg | startSelectionMsg) => {

        if (msg.action === "result") {
            console.log("OCR Result (service):", msg.text);
        }

        return false;
    }
);