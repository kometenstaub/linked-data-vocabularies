import { Command, normalizePath, Notice, Plugin } from "obsidian";
import SKOSSettingTab from "./settings";
import { LCSHMethods } from "./methods/methods-loc";
import type { SKOSSettings, SuggesterItem } from "./interfaces";
import { SKOSModal } from "./ui/LOC/suggester";

//@ts-ignore
import Worker from "./workers/readJson.worker";

const DEFAULT_SETTINGS: SKOSSettings = {
	inputFolder: "",
	elementLimit: "100",
	broaderKey: "broader",
	narrowerKey: "narrower",
	relatedKey: "related",
	headingKey: "heading",
	altLabel: "altLabel",
	uriKey: "uri",
	lccKey: "lcc",
	broaderMax: "3",
	narrowerMax: "3",
	relatedMax: "3",
	lcSensitivity: "-10000",
	loadLcsh: false,
};

export default class SKOSPlugin extends Plugin {
	methods_loc = new LCSHMethods(this.app, this);
	settings!: SKOSSettings;
	loadedLcshSuggester!: SuggesterItem[];

	/**
	 * calls the base class's addCommand function, force overwrite the command name
	 * @param command - type Command
	 * @returns -
	 */
	addCommand = (command: Command): Command => {
		const commandName = command.name;
		const newCommand = super.addCommand(command);
		newCommand.name = "Linked Vocabs: " + commandName;
		return newCommand;
	};

	async onload() {
		console.log("loading Linked Data Vocabularies plugin");

		await this.loadSettings();
		this.addSettingTab(new SKOSSettingTab(this.app, this));

		this.addCommand({
			id: "query-lcsh",
			name: "Query LCSH (Subject Headings)",
			editorCallback: (editor, view) => {
				const tfile = view.file;
				if (tfile) {
					new SKOSModal(this.app, this, tfile).open();
				}
			},
		});

		if (this.settings.loadLcsh) {
			const { adapter } = this.app.vault;
			const dir = this.settings.inputFolder;
			const path = normalizePath(`${dir}/lcshSuggester.json`);
			if (await adapter.exists(path)) {
				const lcshSuggester = await adapter.read(path);
				// use web worker so that Obsidian is more responsive onload;
				let worker = Worker();
				worker.postMessage(lcshSuggester);
				worker.onerror = (event: any) => {
					new Notice("The LCSH Suggester JSON file could not be parsed.");
				};
				worker.onmessage = (event: any) => {
					this.loadedLcshSuggester = event.data;
					worker.terminate();
				};
			} else {
				const text = "The JSON file could not be read.";
				new Notice(text);
				throw Error(text);
			}
		}
	}

	onunload() {
		console.log("unloading Linked Data Vocabularies plugin");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
