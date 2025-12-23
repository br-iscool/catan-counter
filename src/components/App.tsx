export default function App() {
	const startSelecting = () => {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			chrome.tabs.sendMessage(tabs[0].id!, { action: "start-selecting" });
		});
	}
	return (
		<div className="p-4 w-50">
			<h1 className="font-bold text-lg mb-2">Colonist Card Counter</h1>
			<button 
				onClick={startSelecting}
				className="text-white slate-900 hover:slate-900/90 box-border border border-transparent font-medium leading-5 rounded-base text-sm px-4 py-2.5 text-center inline-flex items-center"
			>
				Select Area
			</button>
		</div>
	);
}
