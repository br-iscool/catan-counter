export default function App() {
    const startSelecting = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs?.[0]?.id;
            if (!tabId) return;
            chrome.tabs.sendMessage(tabId, { action: "start-selecting" });
        });
    };

    return (
        <div className="w-[340px] flex flex-col gap-4 bg-slate-50">
            <h1 className="mx-auto text-center text-white font-semibold tracking-tight">
                Colonist Card Counter
            </h1>

            <button
                onClick={startSelecting}
                className="mx-auto rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
                Select Area
            </button>
        </div>
    );
}
