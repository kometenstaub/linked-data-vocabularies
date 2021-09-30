import { Editor, MarkdownView, Plugin, View } from 'obsidian';
import SKOSSettingTab from './settings';
import { LCSHMethods } from './methods';
import type { SKOSSettings } from './interfaces';
import { SKOSModal } from './suggester';


const DEFAULT_SETTINGS: SKOSSettings = {
	elementCounter: '10',
	broaderKey: 'broader',
	narrowerKey: 'narrower',
	relatedKey: 'related',
	lcshSearchType: 'keyword',
	headingKey: 'heading',
	urlKey: 'url',
	broaderMax: '3',
	narrowerMax: '3',
	relatedMax: '3',
};

export default class SKOSPlugin extends Plugin {
	methods = new LCSHMethods(this.app, this);
	//@ts-ignore
	settings: SKOSSettings;

	async onload() {
		console.log('loading Linked Data Vocabularies plugin');

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
				const chooser = new SKOSModal(
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
		console.log('unloading Linked Data Vocabularies plugin');
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
