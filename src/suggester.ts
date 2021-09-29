import { App, SuggestModal, TFile } from 'obsidian';
import type SKOSPlugin from './main';
import type { SuggesterItem } from './interfaces';
export class SKOSModal extends SuggestModal<Promise<any[]>> {
	plugin: SKOSPlugin;
	tfile: TFile;
	suggestions: any;

	constructor(app: App, plugin: SKOSPlugin, tfile: TFile) {
		super(app);
		this.plugin = plugin;
		this.tfile = tfile;
		this.setPlaceholder('Start typing...');
	}

	// overwrites the updateSuggestions function (which isn't exposed in the API)
	// that's what runs the getSuggestions and does something with the results
	// Thank you Licat!
	async updateSuggestions() {
		const { value } = this.inputEl;
		this.suggestions = await this.plugin.methods.findHeading(value);

		//@ts-expect-error
		await super.updateSuggestions();
		//dereference suggestions for memory efficiency
		this.suggestions = null;
	}

	getSuggestions() {
		return this.suggestions;
	}

	// async asyncGetSuggestions() {
	// 	const input = this.inputEl.value;
	// 	return this.plugin.methods.findHeading(input);
	// }

	//@ts-ignore
	renderSuggestion(value: SuggesterItem, el: HTMLElement) {
		const { display, vLabel, aLabel } = value

		const el1 = el.createEl('b');
		el1.appendText(display);
		//el.createEl('br')
		const el2 = el.createEl('div');
		if (vLabel && vLabel !== display) {
			el2.appendText(aLabel + ' — ' + vLabel);
		} else if (aLabel !== display) {
			el2.appendText(aLabel);
		}
	}

	//@ts-ignore
	async onChooseSuggestion(
		item: SuggesterItem,
		evt: MouseEvent | KeyboardEvent
	) {
		const heading = item.display;
		const headingUrl = item.url;
		const url = await this.plugin.methods.getURL(item);
		const headings = await this.plugin.methods.parseSKOS(url);
		await this.plugin.methods.writeYaml(
			headings,
			this.tfile,
			heading,
			headingUrl
		);
	}
}
