export type StartSelectionMsg = {
	action: "start-selection";
};

export type StopSelectionMsg = {
	action: "stop-selection";
};

export type EndSelectionMsg = {
	action: "end-selection";
	selectedRegion: SelectedRegion;
	devicePixelRatio: number;
};

export type ResultMsg = {
	action: "result";
	text: string;
}

export type StopResultMsg = {
	action: "stop-ocr";
};

export type RequestMsg = {
	action: "ocr-request";
	selectedRegion: SelectedRegion;
	devicePixelRatio: number;
};

export type ImageMsg = {
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

export type ResourceType = "brick" | "lumber" | "wool" | "grain" | "ore" | "unknown";

export type ResourceCounter = Record<ResourceType, number>;

export type CardCounter = Record<string, ResourceCounter>;
