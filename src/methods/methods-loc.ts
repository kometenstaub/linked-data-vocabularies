import { App, Notice, request, RequestParam } from 'obsidian';
import type SKOSPlugin from '../main';
import type {
	headings,
	SuggesterItem,
} from '../interfaces';
import {
	SUBJECT_HEADINGS,
	SUBDIVISIONS,
} from '../constants';

export class LCSHMethods {
	app: App;
	plugin: SKOSPlugin;

	constructor(app: App, plugin: SKOSPlugin) {
		this.app = app;
		this.plugin = plugin;
	}


	/**
	 *
	 * @param heading | the input from the {@link SKOSModal.updateSuggestions | SuggesterModal }
	 * @returns - {@link SuggesterItem[] }, the array with information that populates
	 * 				SuggestModal in {@link SKOSModal.renderSuggestion }
	 */
	public async findHeading(
		heading: string,
		methodOf: string
	): Promise<SuggesterItem[]> {

		let counter = '';
		if (parseInt(this.plugin.settings.elementCounter)) {
			counter = this.plugin.settings.elementCounter;
		} else {
			new Notice(
				'The maximum number of elements to be shown is not an integer.'
			);
			throw Error(
				'The maximum number of elements to be shown is not an integer.'
			);
		}


		let formerHeading = '';
		// calculate heading results from received json
		const headings: SuggesterItem[] = newData['hits'].map((suggestion) => {
			const display = suggestion.suggestLabel;
			let subdivision = false;
			if (formerHeading === display) {
				subdivision = true;
			}
			formerHeading = display;
			const aLabel = suggestion.aLabel; // authoritative label
			const url = suggestion.uri;
			const vLabel = suggestion.vLabel; // variant label
			return { display, url, aLabel, vLabel, subdivision };
		});

		// return data for modal
		return headings;
	}


}
