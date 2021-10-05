import { App, Platform, SuggestModal, TFile } from 'obsidian';
import type SKOSPlugin from './main';
import type { passInformation, SuggesterItem, headings } from './interfaces';
import { SubSKOSModal } from './suggester-sub';
import {
	CULTURAL_HER_ORGANIZATIONS,
	LCNAF,
	LC_CLASSIFICATION,
	SUBJECT_HEADINGS,
} from './constants';

export class AllSKOSModal extends SuggestModal<Promise<any[]>> {
	plugin: SKOSPlugin;
	tfile: TFile;
	suggestions: any;
	globalSearch: boolean;
	collection: string;

	constructor(app: App, plugin: SKOSPlugin, tfile: TFile) {
		super(app);
		this.plugin = plugin;
		this.tfile = tfile;
		this.globalSearch = false;
		this.collection = ''
		const filterChar = this.plugin.settings.lcshFilterChar;
		this.setPlaceholder(
			`available filters: ${filterChar}sh, ${filterChar}naf, ${filterChar}c, ${filterChar}cho`
		);
		//https://discord.com/channels/686053708261228577/840286264964022302/871783556576325662
		this.scope.register(['Shift'], 'Enter', (evt: KeyboardEvent) => {
			// @ts-ignore
			this.chooser.useSelectedItem(evt);
			return false;
		});
		this.scope.register(['Alt'], 'Enter', (evt: KeyboardEvent) => {
			// @ts-ignore
			this.chooser.useSelectedItem(evt);
			return false;
		});
		/**
		 * TODO:
		 * modify instructions depending on type of collection;
		 * only show alt + enter when LCSH
		 */
		this.setInstructions([
			{
				command: 'shift ↵',
				purpose: 'to insert as inline YAML at selection',
			},
			{
				command: '↵',
				purpose: 'to insert as YAML',
			},
			{
				command: 'alt ↵',
				purpose: 'to add a subdivision (only LCSH)',
			},
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
		let collection: string;
		try {
			if (value.charAt(0) === this.plugin.settings.lcshFilterChar) {
				// // show the list of available parameters
				// this.suggestions = ['sh', 'naf', 'c', 'cho', 'gft']
				// //@ts-ignore
				// await super.updateSuggestions();

				// search in subject headings
				if (value.slice(1, 4).toLowerCase() === 'sh ') {
					this.collection = SUBJECT_HEADINGS
					const search = value.slice(4);
					this.suggestions = await this.plugin.methods.findHeading(
						search,
						SUBJECT_HEADINGS
					);
				}
				// name authority file
				else if (value.slice(1, 5).toLowerCase() === 'naf ') {
					this.collection = LCNAF
					const search = value.slice(5);
					this.suggestions = await this.plugin.methods.findHeading(
						search,
						LCNAF
					);
				}
				// classification
				else if (value.slice(1, 3).toLowerCase() === 'c ') {
					this.collection = LC_CLASSIFICATION
					const search = value.slice(3);
					this.suggestions = await this.plugin.methods.findHeading(
						search,
						LC_CLASSIFICATION
					);
				}
				// cultural heritage organizations
				else if (value.slice(1, 5).toLowerCase() === 'cho ') {
					this.collection = CULTURAL_HER_ORGANIZATIONS
					const search = value.slice(5);
					this.suggestions = await this.plugin.methods.findHeading(
						search,
						CULTURAL_HER_ORGANIZATIONS
					);
				}

				//@ts-expect-error
				await super.updateSuggestions();
			} else {
				this.suggestions = await this.plugin.methods.findHeading(
					value,
					''
				);
				//@ts-expect-error
				await super.updateSuggestions();
			}
		} catch (error) {
			/// if error, then it hasn't been entered yet fully entered
		}
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
		const { display, url, vLabel, aLabel, subdivision } = value;
		/**
		 * would be relevant if I implemented a general search for LOC
		 * but that is not very realistic, because the data is too different
		 */
		//let collection: string;
		//if (this.globalSearch) {
		//	if (
		//		url.includes(
		//			'http://id.loc.gov/authorities/subjects/collection_LCSHAuthorizedHeadings'
		//		)
		//	) {
		//		collection = 'LC Subject Headings';
		//	} else if (
		//		url.includes(
		//			'http://id.loc.gov/authorities/subjects/collection_Subdivisions'
		//		)
		//	) {
		//		collection = 'LC Subdivisions';
		//	} else if (
		//		url.includes('http://id.loc.gov/authorities/classification')
		//	) {
		//		collection = 'LC Classification';
		//	} else if (url.includes('http://id.loc.gov/authorities/names')) {
		//		collection = 'LC Name Authority File';
		//	} else if (
		//		url.includes('http://id.loc.gov/vocabulary/organizations')
		//	) {
		//		collection = 'Cultural Heritage Organizations';
		//	} else if (
		//		url.includes('http://id.loc.gov/authorities/genreForms')
		//	) {
		//		collection = 'LC Genre/Form Terms';
		//	}
		//}

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
		const headingUrl = item.url;

		if (evt.altKey) {
			const data: passInformation = {
				suggestItem: item,
				heading: heading,
				url: headingUrl,
			};
			new SubSKOSModal(this.app, this.plugin, this.tfile, data).open();
		} else {
			// parse them here, otherwise if Alt key is pressed, the second modal is delayed
			const headingObj = await this.plugin.methods.getURL(item);
			let headings: headings;
			/**
			 * only parse relations for LCSH
			 * since writeYaml still checks for the length of every element, we need to pass
			 * an empty object
			 */
			if (this.collection === SUBJECT_HEADINGS || this.collection === '') {
				headings = await this.plugin.methods.parseSKOS(headingObj);
			} else {
				headings = {broader: [], narrower: [], related: []}
			}
			await this.plugin.methods.writeYaml(
				headings,
				this.tfile,
				heading,
				headingUrl,
				evt
			);
		}
	}
}
