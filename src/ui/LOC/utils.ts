import { Platform } from 'obsidian';

export function focus() {
	if (Platform.isDesktopApp) {
		focusInput();
	} else if (Platform.isMobileApp) {
		setTimeout(focusInput, 400);
	}
}
function focusInput() {
	//@ts-ignore
	document.getElementsByClassName('prompt-input')[0].focus();
}
