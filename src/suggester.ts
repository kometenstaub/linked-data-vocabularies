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

	/**
	 * overwrites the updateSuggestions method (which isn't exposed in the API)
	 * to make it asynchronous
	 *
	 * @remarks
	 *
	 * (because of the data that is requested in {@link LCSHMethods.findHeading}
	 * it needs to be async)
	 *
	 * {@link SKOSModal.updateSuggestion | super.updateSuggestions} calls
	 * {@link SKOSModal.getSuggestions | getSuggestions } that returns the suggestions,
	 * a property which was set by {@link SKOSModal.asyncGetSuggestions | asyncGetSuggestions } before
	 *
	 * Thank you Licat!
	 *
	 *
	 * */
	async updateSuggestions() {
		const { value } = this.inputEl;
		this.suggestions = await this.plugin.methods.findHeading(value);
		//@ts-expect-error
		await super.updateSuggestions();
		/**
		 * dereference suggestions for memory efficiency
		 */
		this.suggestions = null;
	}

	getSuggestions() {
		return this.suggestions;
	}

	/**
	 *
	 * @param value - takes the {@link SuggesterItem}
	 * @param el - append HTML to be displayed to it
	 */

	//@ts-ignore
	renderSuggestion(value: SuggesterItem, el: HTMLElement) {
		const { display, vLabel, aLabel } = value;

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

	/**
	 * Gets the JSON content for each URL
	 * returns all the headings and parse them
	 * then writes them to the current file's YAML
	 *
	 * @param item - @see the type definition
	 * @param evt - @see the type definition
	 */

	//@ts-ignore
	async onChooseSuggestion(
		item: SuggesterItem,
		evt: MouseEvent | KeyboardEvent
	) {
		//console.log(evt);
		const heading = item.display;
		const headingUrl = item.url;
		const url = await this.plugin.methods.getURL(item);
		const headings = await this.plugin.methods.parseSKOS(url);

		//const { altKey, ctrlKey, metaKey, shiftKey } = evt;
		await this.plugin.methods.writeYaml(
			headings,
			this.tfile,
			heading,
			headingUrl,
			evt
		);
	}
}
