export type startSelectionMsg = {
	action: "start-selection";
};

export type endSelectionMsg = {
	action: "end-selection";
	selectedRegion: DOMRect;
};

export type resultMsg = {
	action: "result";
	text: string;
}