import { Command, Editor, MarkdownView, Plugin, View } from 'obsidian';
import SKOSSettingTab from './settings';
import { LCSHMethods } from './methods';
import type { SKOSSettings } from './interfaces';
import { SKOSModal } from './suggester';
import {
	CULTURAL_HER_ORGANIZATIONS,
	LCNAF,
	LC_CLASSIFICATION,
	SUBJECT_HEADINGS,
} from './constants';
import { AllSKOSModal } from './suggester-all';

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
	lcshFilterChar: ':',
	addLCSH: true,
	addLCC: false,
	addLCNAF: false,
	addCulHO: false,
	addAllLoc: false,
};

export default class SKOSPlugin extends Plugin {
	methods = new LCSHMethods(this.app, this);
	//@ts-ignore
	settings: SKOSSettings;

	/**
	 * override internal Obsidian function to get shorter name in command palette
	 * @param command - type Command
	 * @returns -
	 */
	addCommand = (command: Command) => {
		var t = this;
		return (
			(command.id = this.manifest.id + ':' + command.id),
			//command.name = this.manifest.name + ": " + command.name,
			(command.name = 'Linked Vocabs: ' + command.name),
			this.app.commands.addCommand(command),
			this.register(function () {
				return t.app.commands.removeCommand(command.id);
			}),
			command
		);
	};

	async onload() {
		console.log('loading Linked Data Vocabularies plugin');

		await this.loadSettings();

		/**
		 * universal commands for all collections with ability to filter
		 */
		if (this.settings.addAllLoc) {
			this.addCommand({
				id: 'query-all-loc',
				name: 'Query LOC linked data',
				editorCallback: (editor: Editor, view: MarkdownView) => {
					const tfile = view.file;
					const chooser = new AllSKOSModal(
						this.app,
						this,
						tfile
					).open();
					return chooser;
				},
			});
		}

		/**
		 * individual commands for the collections
		 */
		if (this.settings.addLCSH) {
			this.addCommand({
				id: 'query-lcsh-headings',
				name: 'Query LCSH headings',
				editorCallback: (editor: Editor, view: MarkdownView) => {
					const tfile = view.file;
					const chooser = new SKOSModal(
						this.app,
						this,
						tfile,
						SUBJECT_HEADINGS
					).open();
					return chooser;
				},
			});
		}

		if (this.settings.addLCC) {
			this.addCommand({
				id: 'query-lcc',
				name: 'Query LC Classification',
				editorCallback: (editor: Editor, view: MarkdownView) => {
					const tfile = view.file;
					const chooser = new SKOSModal(
						this.app,
						this,
						tfile,
						LC_CLASSIFICATION
					).open();
					return chooser;
				},
			});
		}

		if (this.settings.addLCNAF) {
			this.addCommand({
				id: 'query-lcnaf',
				name: 'Query LC Name Authority File',
				editorCallback: (editor: Editor, view: MarkdownView) => {
					const tfile = view.file;
					const chooser = new SKOSModal(
						this.app,
						this,
						tfile,
						LCNAF
					).open();
					return chooser;
				},
			});
		}

		if (this.settings.addCulHO) {
			this.addCommand({
				id: 'query-lc-chso',
				name: 'Query LC Cultural Heritage Organizations',
				editorCallback: (editor: Editor, view: MarkdownView) => {
					const tfile = view.file;
					const chooser = new SKOSModal(
						this.app,
						this,
						tfile,
						CULTURAL_HER_ORGANIZATIONS
					).open();
					return chooser;
				},
			});
		}

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
