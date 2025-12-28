export type startSelectionMsg = {
	action: "start-selection";
};

export type stopSelectionMsg = {
	action: "stop-selection";
};

export type endSelectionMsg = {
	action: "end-selection";
	selectedRegion: SelectedRegion;
	devicePixelRatio: number;
};

export type resultMsg = {
	action: "result";
	text: string;
}

export type stopResultMsg = {
	action: "stop-ocr";
};

export type requestMsg = {
	action: "ocr-request";
	selectedRegion: SelectedRegion;
	devicePixelRatio: number;
};

export type imageMsg = {
	action: "ocr-image";
	dataUrl: string;
	selectedRegion: SelectedRegion;
	devicePixelRatio: number;
};

export type SelectedRegion = {
	left: number;
	top: number;
	width: number;
	height: number;
};
