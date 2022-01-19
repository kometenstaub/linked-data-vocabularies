import {
	App,
	Instruction,
	Keymap,
	normalizePath,
	Notice,
	Platform,
	SuggestModal,
	TFile,
} from 'obsidian';
import type SKOSPlugin from '../../main';
import type { headings, keyValuePairs, SuggesterItem } from '../../interfaces';
import { SubSKOSModal } from './suggester-sub';
import { WriteMethods } from 'src/methods/methods-write';
import * as fuzzysort from 'fuzzysort';
import { LCSHMethods } from 'src/methods/methods-loc';
import { focus } from './utils';
import { BASE_URI, BASIC_INSTRUCTIONS, BROWSER_PURPOSE } from '../../constants';

export class SKOSModal extends SuggestModal<SuggesterItem> {
	plugin: SKOSPlugin;
	tfile: TFile;
	lcshSuggester!: SuggesterItem[];

	constructor(app: App, plugin: SKOSPlugin, tfile: TFile) {
		super(app);
		this.plugin = plugin;
		this.tfile = tfile;
		this.setPlaceholder('Please start typing...');
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
		this.scope.register(['Mod'], 'Enter', (evt: KeyboardEvent) => {
			// @ts-ignore
			this.chooser.useSelectedItem(evt);
			return false;
		});

		//const dir = this.plugin.manifest.dir;
		// when loading onload is implemented, the condition needs to be checked
		if (this.plugin.settings.loadLcsh) {
			this.lcshSuggester = this.plugin.loadedLcshSuggester;
		} else {
			const { adapter } = this.app.vault;
			const dir = this.plugin.settings.inputFolder;
			(async () => {
				const path = normalizePath(`${dir}/lcshSuggester.json`);
				if (await adapter.exists(path)) {
					const lcshSuggester = await adapter.read(path);
					this.lcshSuggester = JSON.parse(lcshSuggester);
				} else {
					const text = 'The JSON file could not be read.';
					new Notice(text);
					throw Error(text);
				}
			})();
		}
		const extraInstructions: Instruction[] = [
			{
				command: 'alt ↵',
				purpose: 'to add a subdivision',
			},
		];
		if (Platform.isMacOS) {
			extraInstructions.push({
				command: 'cmd ↵',
				purpose: BROWSER_PURPOSE,
			});
		} else {
			extraInstructions.push({
				command: 'ctrl ↵',
				purpose: BROWSER_PURPOSE,
			});
		}
		this.setInstructions(BASIC_INSTRUCTIONS.concat(extraInstructions));
	}

	/**
	 * Add what function the Shift key has and refocus the cursor in it.
	 * For mobile it requires a timeout, because the modal needs time to appear until the cursor can be placed in it,
	 */
	onOpen() {
		focus();
	}

	getSuggestions(): SuggesterItem[] {
		let input = this.inputEl.value.trim();
		let results = [];
		const { settings } = this.plugin;
		if (this.lcshSuggester !== undefined) {
			const fuzzyResult = fuzzysort.go(input, this.lcshSuggester, {
				key: 'pL',
				limit: parseInt(settings.elementLimit),
				threshold: parseInt(settings.lcSensitivity),
			});
			for (let el of fuzzyResult) {
				results.push(el.obj);
			}
		}
		//@ts-ignore
		return results;
	}
	renderSuggestion(item: SuggesterItem, el: HTMLElement): void {
		const { aL, pL, note, lcc } = item;
		const el0 = el.createDiv();
		const el1 = el0.createEl('b', {
			cls: ['linked-vocabs', 'lcsh-prefLabel'],
		});
		el1.appendText(pL);
		//el.createEl('br')
		if (aL && note && aL !== pL) {
			if (lcc) {
				el0.createEl('div', {
					text: ' — ',
					cls: ['linked-vocabs', 'lcsh-lcc-pre'],
				});
				el0.createEl('div', {
					text: 'LCC: ',
					cls: ['linked-vocabs', 'lcsh-lcc'],
				});
				el0.createEl('div', {
					text: lcc,
					cls: ['linked-vocabs', 'lcsh-lcc-classification'],
				});
				const subDiv = el.createDiv();
				subDiv.createEl('div', {
					text: aL,
					cls: ['linked-vocabs', 'lcsh-altLabel'],
				});
				subDiv.createEl('div', {
					text: ' — ',
					cls: ['linked-vocabs', 'lcsh-note-pre'],
				});
				subDiv.createEl('div', {
					text: note,
					cls: ['linked-vocabs', 'lcsh-note'],
				});
			} else {
				el.createEl('div', {
					text: aL,
					cls: ['linked-vocabs', 'lcsh-altLabel'],
				});
				el.createEl('div', {
					text: ' — ',
					cls: ['linked-vocabs', 'lcsh-note-pre'],
				});
				el.createEl('div', {
					text: note,
					cls: ['linked-vocabs', 'lcsh-note'],
				});
			}
		} else if (aL && !note && aL !== pL) {
			if (lcc) {
				el0.createEl('div', {
					text: ' — ',
					cls: ['linked-vocabs', 'lcsh-lcc-pre'],
				});
				el0.createEl('div', {
					text: 'LCC: ',
					cls: ['linked-vocabs', 'lcsh-lcc'],
				});
				el0.createEl('div', {
					text: lcc,
					cls: ['linked-vocabs', 'lcsh-lcc-classification'],
				});
				const subDiv = el.createDiv();
				subDiv.createEl('div', {
					text: aL,
					cls: ['linked-vocabs', 'lcsh-altLabel'],
				});
			} else {
				el.createEl('div', {
					text: aL,
					cls: ['linked-vocabs', 'lcsh-altLabel'],
				});
			}
		} else if (!aL && note) {
			if (lcc) {
				el0.createEl('div', {
					text: ' — ',
					cls: ['linked-vocabs', 'lcsh-lcc-pre'],
				});
				el0.createEl('div', {
					text: 'LCC: ',
					cls: ['linked-vocabs', 'lcsh-lcc'],
				});
				el0.createEl('div', {
					text: lcc,
					cls: ['linked-vocabs', 'lcsh-lcc-classification'],
				});
				const subDiv = el.createDiv();
				subDiv.createEl('div', {
					text: note,
					cls: ['linked-vocabs', 'lcsh-note'],
				});
			} else {
				el.createEl('div', {
					text: note,
					cls: ['linked-vocabs', 'lcsh-note'],
				});
			}
		} else if (lcc) {
			el0.createEl('div', {
				text: ' — ',
				cls: ['linked-vocabs', 'lcsh-lcc-pre'],
			});
			el0.createEl('div', {
				text: 'LCC: ',
				cls: ['linked-vocabs', 'lcsh-lcc'],
			});
			el0.createEl('div', {
				text: lcc,
				cls: ['linked-vocabs', 'lcsh-lcc-classification'],
			});
		}
	}

	async onChooseSuggestion(
		item: SuggesterItem,
		evt: MouseEvent | KeyboardEvent
	): Promise<void> {
		const { settings } = this.plugin;
		let heading = item.pL;
		if (Keymap.isModEvent(evt)) {
			let itemUri = BASE_URI + item.uri;
			itemUri = encodeURI(itemUri);
			window.open(itemUri);
		} else if (evt.altKey) {
			new SubSKOSModal(this.app, this.plugin, this.tfile, item).open();
		} else {
			let headings: headings;
			const methods_loc = new LCSHMethods(this.app, this.plugin);
			// parse them here and not
			// before condition, otherwise if Alt key is pressed, the second modal would be delayed
			headings = await methods_loc.resolveUris(item);
			const lcc = item.lcc;
			// the heading is always added
			const keys: keyValuePairs = {
				[settings.headingKey]: heading,
			};
			if (settings.uriKey !== '') {
				keys[settings.uriKey] = BASE_URI + item.uri;
			}
			if (lcc !== undefined && settings.lccKey !== '') {
				keys[settings.lccKey] = lcc;
			}
			const writeMethods = new WriteMethods(this.app, this.plugin);
			await writeMethods.writeLocYaml(this.tfile, evt, keys, headings);
		}
	}
}
