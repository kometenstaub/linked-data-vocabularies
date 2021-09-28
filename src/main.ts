import { Editor, MarkdownView, Plugin, View } from 'obsidian';
import SKOSSettingTab from './settings';
import { LCSHMethods } from './methods';
import type { SKOSSettings } from './interfaces';
import { SKOSFuzzyModal } from './suggester';


const DEFAULT_SETTINGS: SKOSSettings = {
	elementCounter: '10',
	broaderKey: 'broader',
	narrowerKey: 'narrower',
	relatedKey: 'related',
	lcshSearchType: 'keyword',
	headingKey: 'heading',
	urlKey: 'url',
};

// What suggest2 API method (https://id.loc.gov/techcenter/searching.html) returns as JSON
export default class SKOSPlugin extends Plugin {
	methods = new LCSHMethods(this.app, this);
	//@ts-ignore
	settings: SKOSSettings;

	async onload() {
		console.log('loading SKOS plugin');

		await this.loadSettings();

		this.addCommand({
			id: 'query-lcsh-data',
			name: 'Query LCSH data',
			editorCheckCallback: (
				checking: boolean,
				editor: Editor,
				view: View
			) => {
				if (checking) {
					return view instanceof MarkdownView;
				}
				if (!(view instanceof MarkdownView)) {
					// shouldn't happen
					return;
				}
				const currentView = view;
				const tfile = currentView.file;
				console.log('tTFile:');
				console.log(tfile);
				const chooser = new SKOSFuzzyModal(
					this.app,
					this,
					tfile
				).open();
				return chooser;
			},
		});

		this.addSettingTab(new SKOSSettingTab(this.app, this));
	}

	onunload() {
		console.log('unloading SKOS plugin');
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
