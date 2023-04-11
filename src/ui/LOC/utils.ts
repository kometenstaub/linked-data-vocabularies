import { Platform } from "obsidian";
import type { SuggesterItem } from "../../interfaces";
import { LV } from "../../constants";

export function focus() {
	if (Platform.isDesktopApp) {
		focusInput();
	} else if (Platform.isMobileApp) {
		setTimeout(focusInput, 400);
	}
}
function focusInput() {
	//@ts-ignore
	document.getElementsByClassName("prompt-input")[0].focus();
}

export function renderSug(item: SuggesterItem, el: HTMLElement) {
	// the suggester-sub didn't use the aL, so maybe it needs a condition
	const { aL, pL, note, lcc } = item;
	el.addClass(LV);
	const suggestionContent = el.createDiv({
		cls: "suggestion-content",
	});
	const suggestionTitle = suggestionContent.createDiv();
	// TODO: is there a better way?
	suggestionTitle.createEl("b", {
		text: pL,
	});
	if (lcc) {
		suggestionTitle.createSpan({
			text: ` — LCC: ${lcc}`,
		});
	}
	const secondLine = createDiv({
		cls: "u-muted",
	});
	if (aL) {
		let labels = "";
		for (let i = 0; i < aL.length; i++) {
			if (i < aL.length - 1) {
				labels += aL[i] + ", ";
			} else {
				labels += aL[i];
			}
		}
		secondLine.createSpan({
			text: labels,
		});
	}
	if (note) {
		let text = "";
		if (aL) {
			text += " — ";
		}
		secondLine.createSpan({
			text: text + note,
		});
	}
	suggestionContent.appendChild(secondLine);
}
