import { App, Notice, SuggestModal, TFile } from 'obsidian';
import type SKOSPlugin from '../../main';
import type { keyValuePairs, SuggesterItem } from '../../interfaces';
//import { SUBDIVISIONS } from '../../constants';
import { WriteMethods } from 'src/methods/methods-write';
import * as fuzzysort from 'fuzzysort';
import { LCSHMethods } from 'src/methods/methods-loc';
import { focus } from './utils';
import { BASIC_INSTRUCTIONS } from '../../constants';

export class SubSKOSModal extends SuggestModal<SuggesterItem> {
	plugin: SKOSPlugin;
	tfile: TFile;
	lcshSubdivSuggester!: SuggesterItem[];
	data: SuggesterItem;

	constructor(
		app: App,
		plugin: SKOSPlugin,
		tfile: TFile,
		data: SuggesterItem
	) {
		super(app);
		this.plugin = plugin;
		this.tfile = tfile;
		this.data = data;
		this.setPlaceholder('Please start typing...');
		this.scope.register(['Shift'], 'Enter', (evt: KeyboardEvent) => {
			// @ts-ignore
			this.chooser.useSelectedItem(evt);
			return false;
		});
		this.setInstructions(BASIC_INSTRUCTIONS);

		const adapter = this.app.vault.adapter;
		const dir = this.plugin.settings.inputFolder;
		(async () => {
			if (await adapter.exists(`${dir}/lcshSubdivSuggester.json`)) {
				const lcshSubdivSuggester = await adapter.read(
					`${dir}/lcshSubdivSuggester.json`
				);
				this.lcshSubdivSuggester = await JSON.parse(
					lcshSubdivSuggester
				);
			} else {
				const text = 'The JSON file could not be read.';
				new Notice(text);
				throw Error(text);
			}
		})();
	}

	/**
	 * Add what function the Shift key has and refocus the cursor in it.
	 * For mobile, it requires a timeout, because the modal needs time to appear until the cursor can be placed in it,
	 */
	onOpen() {
		focus();
	}

	getSuggestions(): SuggesterItem[] {
		const input = this.inputEl.value.trim();
		const results = [];
		const { settings } = this.plugin;
		if (this.lcshSubdivSuggester !== null) {
			const fuzzyResult = fuzzysort.go(input, this.lcshSubdivSuggester, {
				key: 'pL',
				limit: parseInt(settings.elementLimit),
				threshold: parseInt(settings.lcSensitivity),
			});
			for (const el of fuzzyResult) {
				results.push(el.obj);
			}
		}
		//@ts-ignore
		return results;
	}

	/**
	 *
	 * @param item - takes the {@link SuggesterItem}
	 * @param el - append HTML to be displayed to it
	 */

	//@ts-ignore
	renderSuggestion(item: SuggesterItem, el: HTMLElement) {
		const { aL, pL, note } = item;
		const el0 = el.createDiv();
		const el1 = el0.createEl('b');
		el1.appendText(pL);
		//el.createEl('br')
		const el2 = el.createDiv();
		if (aL && note && aL !== pL) {
			el2.appendText(aL + ' — ' + note);
		} else if (aL && !note && aL !== pL) {
			el2.appendText(aL);
		} else if (!aL && note) {
			el2.appendText(note);
		}
	}

	/**
	 * Gets the JSON content for each URI
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
		const data = this.data;
		const { settings } = this.plugin;
		// subheading
		const heading = item.pL;
		// get relations for original heading
		const methods_loc = new LCSHMethods(this.app, this.plugin);
		const headings = await methods_loc.resolveUris(data);

		const keys: keyValuePairs = {
			[settings.headingKey]: data.pL + '--' + heading,
		};
		if (settings.uriKey !== '') {
			keys[settings.uriKey] =
				'https://id.loc.gov/authorities/subjects/' + data.uri;
		}
		if (data.lcc !== undefined && settings.lccKey !== '') {
			keys[settings.lccKey] = data.lcc;
		}

		const writeMethods = new WriteMethods(this.app, this.plugin);
		await writeMethods.writeLocYaml(this.tfile, evt, keys, headings);
	}
}
