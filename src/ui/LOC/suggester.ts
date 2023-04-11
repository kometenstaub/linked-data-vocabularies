import {
	App,
	Instruction,
	Keymap,
	normalizePath,
	Notice,
	Platform,
	SuggestModal,
	TFile,
} from "obsidian";
import type SKOSPlugin from "../../main";
import type { headings, keyValuePairs, SuggesterItem } from "../../interfaces";
import { SubSKOSModal } from "./suggester-sub";
import { WriteMethods } from "src/methods/methods-write";
import * as fuzzysort from "fuzzysort";
import { LCSHMethods } from "src/methods/methods-loc";
import { focus } from "./utils";
import {
	AL,
	BASE_URI,
	BASIC_INSTRUCTIONS,
	BROWSER_PURPOSE,
	CLASSIFICATION,
	firstDiv, LCC, LCC_PRE,
	LV,
	NOTE,
	NOTE_PRE
} from "../../constants";



export class SKOSModal extends SuggestModal<SuggesterItem> {
	plugin: SKOSPlugin;
	tfile: TFile;
	lcshSuggester!: SuggesterItem[];

	constructor(app: App, plugin: SKOSPlugin, tfile: TFile) {
		super(app);
		this.plugin = plugin;
		this.tfile = tfile;
		this.setPlaceholder("Please start typing...");
		//https://discord.com/channels/686053708261228577/840286264964022302/871783556576325662
		this.scope.register(["Shift"], "Enter", (evt: KeyboardEvent) => {
			// @ts-ignore
			this.chooser.useSelectedItem(evt);
			return false;
		});
		this.scope.register(["Alt"], "Enter", (evt: KeyboardEvent) => {
			// @ts-ignore
			this.chooser.useSelectedItem(evt);
			return false;
		});
		this.scope.register(["Mod"], "Enter", (evt: KeyboardEvent) => {
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
					const text = "The JSON file could not be read.";
					new Notice(text);
					throw Error(text);
				}
			})();
		}
		const extraInstructions: Instruction[] = [
			{
				command: "alt ↵",
				purpose: "to add a subdivision",
			},
		];
		if (Platform.isMacOS) {
			extraInstructions.push({
				command: "cmd ↵",
				purpose: BROWSER_PURPOSE,
			});
		} else {
			extraInstructions.push({
				command: "ctrl ↵",
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
		const input = this.inputEl.value.trim();
		const results = [];
		const { settings } = this.plugin;
		if (this.lcshSuggester !== undefined) {
			const fuzzyResult = fuzzysort.go(input, this.lcshSuggester, {
				key: "pL",
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
	renderSuggestion(item: SuggesterItem, el: HTMLElement): void {
		const { aL, pL, note, lcc } = item;
		el.addClass(LV);
		const suggestionContent = el.createDiv({
			cls: "suggestion-content"
		});
		const suggestionTitle = suggestionContent.createDiv();
		// TODO: is there a better way?
		suggestionTitle.createEl("b", {
			text: pL,
		})
		if (lcc) {
			suggestionTitle.createSpan({
				text: ` — LCC: ${lcc}`
			})
		}
		const secondLine = createDiv({
			cls: "u-muted"
			})
		if (aL) {
			let labels = ""
			for (let i = 0; i < aL.length; i++) {
				if (i === aL.length - 1) {
					labels += aL[i]
				} else {
					labels += aL[i] + ", "
				}
			}
			secondLine.createSpan({
				text: labels
			})
		}
		if (note) {
			secondLine.createSpan({
				text: note,
			})
		}
		suggestionContent.appendChild(secondLine)
	}

	async onChooseSuggestion(item: SuggesterItem, evt: MouseEvent | KeyboardEvent): Promise<void> {
		const { settings } = this.plugin;
		const heading = item.pL;
		if (Keymap.isModEvent(evt)) {
			let itemUri = BASE_URI + item.uri;
			itemUri = encodeURI(itemUri);
			window.open(itemUri);
		} else if (evt.altKey) {
			new SubSKOSModal(this.app, this.plugin, this.tfile, item).open();
		} else {
			const methods_loc = new LCSHMethods(this.app, this.plugin);
			// parse them here and not
			// before condition, otherwise if Alt key is pressed, the second modal would be delayed
			const headings: headings = await methods_loc.resolveUris(item);
			const lcc = item.lcc;
			// the heading is always added
			const keys: keyValuePairs = {
				[settings.headingKey]: heading,
			};
			if (settings.uriKey !== "") {
				keys[settings.uriKey] = BASE_URI + item.uri;
			}
			if (lcc !== undefined && settings.lccKey !== "") {
				keys[settings.lccKey] = lcc;
			}
			const writeMethods = new WriteMethods(this.app, this.plugin);
			await writeMethods.writeLocYaml(this.tfile, evt, keys, headings);
		}
	}
}
