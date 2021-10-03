import { App, Platform, SuggestModal, TFile } from 'obsidian';
import type SKOSPlugin from './main';
import type { passInformation, SuggesterItem } from './interfaces';
import { SUBDIVISIONS } from './constants';
export class SubSKOSModal extends SuggestModal<Promise<any[]>>{
	plugin: SKOSPlugin;
	tfile: TFile;
	suggestions: any;
	data: passInformation

	constructor(app: App, plugin: SKOSPlugin, tfile: TFile, data: passInformation) {
		super(app);
		this.plugin = plugin;
		this.tfile = tfile;
		this.data = data
		this.setPlaceholder('Please start typing...');
		this.scope.register(['Shift'], 'Enter', (evt: KeyboardEvent) => {
			// @ts-ignore
			this.chooser.useSelectedItem(evt);
			return false;
		});
		this.setInstructions([
			{
				command: 'shift ↵',
				purpose: 'to insert as inline YAML at selection',
			},
			{
				command: '↵',
				purpose: 'to insert as YAML',
			}
		]);
	}

	/**
	 * Add what function the Shift key has and refocus the cursor in it.
	 * For mobile it requires a timeout, because the modal needs time to appear until the cursor can be placed in it,
	 */
	onOpen() {
		if (Platform.isDesktopApp) {
			this.focusInput();
		} else if (Platform.isMobileApp) {
			setTimeout(this.focusInput, 400);
		}
	}

	focusInput() {
		//@ts-ignore
		document.getElementsByClassName('prompt-input')[0].focus();
		//@ts-ignore
		document.getElementsByClassName('prompt-input')[0].select();
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
		this.suggestions = await this.plugin.methods.findHeading(value, SUBDIVISIONS);
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
		const { display, vLabel, aLabel, subdivision } = value;

		const el1 = el.createEl('b');
		const heading = display.replace(/.+?\(USE (.+?)\)/, '$1');
		el1.appendText(heading);
		//el.createEl('br')
		const el2 = el.createEl('div');
		if (vLabel && vLabel !== display && subdivision) {
			el2.appendText(
				aLabel + ' — ' + vLabel + ' — Subdivision (inferred)'
			);
		} else if (vLabel && vLabel !== display && !subdivision) {
			el2.appendText(aLabel + ' — ' + vLabel);
		} else if (aLabel !== display && subdivision) {
			el2.appendText(aLabel + ' — Subdivision (inferred)');
		} else if (aLabel !== display && !subdivision) {
			el2.appendText(aLabel);
		} else if (subdivision) {
			el2.appendText('Subdivision (inferred)');
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
		let heading = item.display;
		heading = heading.replace(/.+?\(USE (.+?)\)/, '$1');
		//const headingUrl = item.url;
		//const headingObj = await this.plugin.methods.getURL(item);
		//const headings = await this.plugin.methods.parseSKOS(headingObj);
		const data = this.data

		await this.plugin.methods.writeYaml(
			data.headingObject,
			this.tfile,
			data.heading + '--' + heading,
			data.url,
			evt
		);
	}
}
