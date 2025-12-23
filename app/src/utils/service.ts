/// <reference types="chrome"/>

export let selectedRegion: DOMRect | null = null;


chrome.runtime.onMessage.addListener((msg, _sender) => {
    if (msg.action === 'log-region-selected') {
    selectedRegion = msg.region;
    console.log('Selected region stored', msg.region);
    }
});