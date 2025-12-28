import { useEffect, useState } from "react";

export default function App() {
    const [lastOcrText, setLastOcrText] = useState<string>("");
    const [lastOcrTime, setLastOcrTime] = useState<number | null>(null);

    useEffect(() => {
        chrome.storage.local.get(["lastOcrText", "lastOcrTime"], (res) => {
            if (typeof res.lastOcrText === "string") setLastOcrText(res.lastOcrText);
            if (typeof res.lastOcrTime === "number") setLastOcrTime(res.lastOcrTime);
        });

        const onChanged: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, areaName) => {
            if (areaName !== "local") return;
            if (changes.lastOcrText?.newValue !== undefined) {
                setLastOcrText(String(changes.lastOcrText.newValue ?? ""));
            }
            if (changes.lastOcrTime?.newValue !== undefined) {
                const v = changes.lastOcrTime.newValue;
                setLastOcrTime(typeof v === "number" ? v : null);
            }
        };

        chrome.storage.onChanged.addListener(onChanged);
        return () => chrome.storage.onChanged.removeListener(onChanged);
    }, []);

    const startSelecting = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs?.[0]?.id;
            if (!tabId) return;

            const sendStartSelection = () => {
                chrome.tabs.sendMessage(tabId, { action: "start-selection" }, () => {
                    const err = chrome.runtime.lastError;
                    if (!err) return;

                    chrome.scripting.insertCSS({
                        target: { tabId },
                        files: ["overlay.css"],
                    }, () => {
                        chrome.scripting.executeScript({
                            target: { tabId },
                            files: ["scripts/overlay.js", "scripts/utils/ocr.js"],
                        }, () => {
                            const injectErr = chrome.runtime.lastError;
                            if (injectErr) {
                                console.warn("Could not inject scripts:", injectErr.message);
                                return;
                            }

                            chrome.tabs.sendMessage(tabId, { action: "start-selection" });
                        });
                    });
                });
            };

            sendStartSelection();
        });
    };

    const stopSelecting = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs?.[0]?.id;
            if (!tabId) return;

            chrome.tabs.sendMessage(tabId, { action: "stop-selection" }, () => {
                void chrome.runtime.lastError;
            });

            chrome.tabs.sendMessage(tabId, { action: "stop-ocr" }, () => {
                void chrome.runtime.lastError;
            });
        });
    };

    return (
        <div className="min-h-100 min-w-87.5 flex flex-col justify-center gap-6 bg-[#242424] p-4">
            <h1 className="text-4xl mx-auto text-center text-slate-50 font-semibold">
                Colonist Card Counter
            </h1>

            <p className="mx-auto text-center text-slate-200/90">
                <span className="text-slate-200 font-semibold">Instructions: </span>
                Click the button below to select the area to detect at the start of a game. The extension will then automatically count the cards of every player and create an overlay to display the information.
            </p>

            <div className="mx-auto flex gap-3">
                <button
                    onClick={startSelecting}
                    className="text-white bg-neutral-900 px-5 py-2.5 rounded-lg border border-transparent transition cursor-pointer hover:border-indigo-500 hover:translate-y-[0.1rem]"
                >
                    Select Area
                </button>

                <button
                    onClick={stopSelecting}
                    className="text-white bg-neutral-900 px-5 py-2.5 rounded-lg border border-transparent transition cursor-pointer hover:border-indigo-500 hover:translate-y-[0.1rem]"
                >
                    Stop Recognition
                </button>
            </div>

            <div className="mx-auto w-full max-w-md rounded-lg border border-white/10 bg-neutral-900/40 p-3 text-slate-100">
                <div className="text-sm font-semibold text-slate-200">Last OCR result</div>
                <div className="text-xs text-slate-300/80">
                    {lastOcrTime ? new Date(lastOcrTime).toLocaleString() : "No OCR captured yet"}
                </div>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap wrap-break-word rounded bg-black/20 p-2 text-xs text-slate-100">
                    {lastOcrText || "(no text detected)"}
                </pre>
            </div>
        </div>
    );
}
