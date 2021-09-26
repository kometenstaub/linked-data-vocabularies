import { App, SuggestModal, TFile } from 'obsidian';
import type SKOSPlugin from './main';
import { MetaEditWrapper } from './metaedit';
export interface SuggesterItem {
	display: string; // the heading that is displayed to the user
	url: string; // the URL for getting the necessary data
}

export class SKOSFuzzyModal extends SuggestModal<Promise<any[]>> {
	constructor(app: App, private plugin: SKOSPlugin, private tfile: TFile) {
		super(app);
		this.setPlaceholder('Start typing...');
	}

	metaedit = new MetaEditWrapper(this.plugin);

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
		const headings = await this.plugin.methods.parseSKOS(url);
		//https://discord.com/channels/686053708261228577/840286264964022302/891754092614017054
		//metaedit needs some time between edits for adding the YAML keys properly
		const addKey = (key: string, tfile : TFile) => {
			//if (headings[key].length > 0) {
				this.metaedit.updateOrCreateMeta(
					headings,
					key,
					tfile
				);
			//}
		}
		addKey('broader', this.tfile)
		//this.app.vault.on('modify', (tfile) => {
		//	addKey('narrower', this.tfile)
		//});
		//this.app.vault.on('modify', (tfile) => {
		//	addKey('related', this.tfile)
		//});
	}
}
