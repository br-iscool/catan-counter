export default function App() {
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
                                console.warn("Could not inject content scripts:", injectErr.message);
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

    return (
        <div className="min-h-100 min-w-87.5 flex flex-col justify-center gap-6 bg-[#242424] p-2">
            <h1 className="text-4xl mx-auto text-center text-slate-50 font-semibold">
                Colonist Card Counter
            </h1>

            <p className="mx-auto text-center text-slate-200/90">
                <span className="text-slate-200 font-semibold">Instructions: </span>
                Click the button below to select the area to detect at the start of a game. The extension will then automatically count the cards of every player and create an overlay to display the information.
            </p>

            <button
                onClick={startSelecting}
                className="mx-auto text-white bg-neutral-900 px-5 py-2.5 rounded-lg border border-transparent transition cursor-pointer hover:border-indigo-500 hover:translate-y-[0.1rem]"
            >
                Select Area
            </button>
        </div>
    );
}
