import { App, SuggestModal } from 'obsidian';
import type SKOSPlugin from './main';

export interface SuggesterItem {
	display: string; // the heading that is displayed to the user
	url: string; // the URL for getting the necessary data
}

export class SKOSFuzzyModal extends SuggestModal<Promise<any[]>> {
	constructor(app: App, public plugin: SKOSPlugin) {
		super(app);
		this.setPlaceholder('Start typing...');
	}

	// overwrites the updateSuggestions function (which isn't exposed in the API)
	// that's what runs the getSuggestions and does something with the results
	// Thank you Licat!
	suggestions: any;
	async updateSuggestions() {
		this.suggestions = await this.asyncGetSuggestions();
		//@ts-expect-error
		await super.updateSuggestions();
		//dereference suggestions for memory efficiency
		this.suggestions = null;
	}

	getSuggestions() {
		return this.suggestions;
	}

	async asyncGetSuggestions() {
		const input = this.inputEl.value;
		return this.plugin.methods.findHeading(input);
	}

	renderSuggestion(value: any, el: HTMLElement) {
		const newValue = value;
		el.createEl('b', newValue.display);
		el.appendText(newValue.display);
	}
	//@ts-ignore
	async onChooseSuggestion(
		item: SuggesterItem,
		evt: MouseEvent | KeyboardEvent
	) {
		const newItem = item;
		const url = await this.plugin.methods.getURL(newItem);
		this.plugin.methods.parseSKOS(url);
	}
}
