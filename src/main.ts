import { Command, Editor, MarkdownView, normalizePath, Notice, Plugin } from 'obsidian';
import SKOSSettingTab from './settings';
import { LCSHMethods } from './methods/methods-loc';
import type { SKOSSettings, SuggesterItem } from './interfaces';
import { SKOSModal } from './ui/LOC/suggester';
//import { AllSKOSModal } from './ui/LOC/suggester-all';
import { SUBJECT_HEADINGS } from './constants';

const DEFAULT_SETTINGS: SKOSSettings = {
    inputFolder: '',
    elementLimit: '500',
    broaderKey: 'broader',
    narrowerKey: 'narrower',
    relatedKey: 'related',
    headingKey: 'heading',
    uriKey: 'uri',
    broaderMax: '3',
    narrowerMax: '3',
    relatedMax: '3',
    lcSensitivity: '-10000',
    //loadLcsh: true,
    //lcshFilterChar: ':',
    addLCSH: true,
    //addLCC: false,
    //addLCNAF: false,
    //addCulHO: false,
    //addAllLoc: false,
};

export default class SKOSPlugin extends Plugin {
    methods_loc = new LCSHMethods(this.app, this);
    settings!: SKOSSettings;
    loadedLcshSuggester!: SuggesterItem[];

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

        // find a way for loading the file at the beginning without blocking
        // -- something for later
        //const { adapter } = this.app.vault;
        //const dir = this.settings.inputFolder;
        //setTimeout(async () => {
        //    const path = normalizePath(`${dir}/lcshSuggester.json`);
        //    if (await adapter.exists(path)) {
        //        const lcshSuggester = await adapter.read(path);
        //        this.loadedLcshSuggester = await JSON.parse(lcshSuggester);
        //    } else {
        //        const text = 'The JSON file could not be read.';
        //        new Notice(text);
        //        throw Error(text);
        //    }
        //}, 100);

        // commented commands shall be readded when they are re-implemented locally

        // /**
        //  * universal commands for all collections with ability to filter
        //  */
        // if (this.settings.addAllLoc) {
        // 	this.addCommand({
        // 		id: 'query-all-loc',
        // 		name: 'Query LOC linked data',
        // 		editorCallback: (editor: Editor, view: MarkdownView) => {
        // 			const tfile = view.file;
        // 			const chooser = new AllSKOSModal(
        // 				this.app,
        // 				this,
        // 				tfile
        // 			).open();
        // 			return chooser;
        // 		},
        // 	});
        // }

        // /**
        //  * individual commands for the collections
        //  */
        // if (this.settings.addLCSH) {
        this.addCommand({
            id: 'query-lcsh',
            name: 'Query LCSH (Subject Headings)',
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
        // }

        // if (this.settings.addLCC) {
        // 	this.addCommand({
        // 		id: 'query-lcc',
        // 		name: 'Query LCC (Classification)',
        // 		editorCallback: (editor: Editor, view: MarkdownView) => {
        // 			const tfile = view.file;
        // 			const chooser = new SKOSModal(
        // 				this.app,
        // 				this,
        // 				tfile,
        // 				LC_CLASSIFICATION
        // 			).open();
        // 			return chooser;
        // 		},
        // 	});
        // }

        // if (this.settings.addLCNAF) {
        // 	this.addCommand({
        // 		id: 'query-lcnaf',
        // 		name: 'Query LCNAF (Name Authority File)',
        // 		editorCallback: (editor: Editor, view: MarkdownView) => {
        // 			const tfile = view.file;
        // 			const chooser = new SKOSModal(
        // 				this.app,
        // 				this,
        // 				tfile,
        // 				LCNAF
        // 			).open();
        // 			return chooser;
        // 		},
        // 	});
        // }

        // if (this.settings.addCulHO) {
        // 	this.addCommand({
        // 		id: 'query-lc-chso',
        // 		name: 'Query LCCHO (Cultural Heritage Organizations)',
        // 		editorCallback: (editor: Editor, view: MarkdownView) => {
        // 			const tfile = view.file;
        // 			const chooser = new SKOSModal(
        // 				this.app,
        // 				this,
        // 				tfile,
        // 				CULTURAL_HER_ORGANIZATIONS
        // 			).open();
        // 			return chooser;
        // 		},
        // 	});
        // }

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
