import {
    Command,
    Editor,
    MarkdownView,
    normalizePath,
    Notice,
    Plugin,
} from 'obsidian';
import SKOSSettingTab from './settings';
import { LCSHMethods } from './methods/methods-loc';
import type { SKOSSettings, SuggesterItem } from './interfaces';
import { SKOSModal } from './ui/LOC/suggester';
//import { AllSKOSModal } from './ui/LOC/suggester-all';

//@ts-ignore
import Worker from './workers/readJson.worker';

const DEFAULT_SETTINGS: SKOSSettings = {
    inputFolder: '',
    elementLimit: '100',
    broaderKey: 'broader',
    narrowerKey: 'narrower',
    relatedKey: 'related',
    headingKey: 'heading',
    uriKey: 'uri',
    lccKey: 'lcc',
    broaderMax: '3',
    narrowerMax: '3',
    relatedMax: '3',
    lcSensitivity: '-10000',
    loadLcsh: false,
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
     * calls the base class's addCommand function, force overwrite the command name
     * @param command - type Command
     * @returns -
     */
    addCommand = (command: Command): Command => {
        const newCommand = super.addCommand(command);
        newCommand.name = 'Linked Vocabs: ' + command.name;
        return newCommand;
    };

    async onload() {
        console.log('loading Linked Data Vocabularies plugin');

        await this.loadSettings();

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
                    new Notice(
                        'The LCSH Suggester JSON file could not be parsed.'
                    );
                };
                worker.onmessage = (event: any) => {
                    this.loadedLcshSuggester = event.data;
                    worker.terminate();
                };
            } else {
                const text = 'The JSON file could not be read.';
                new Notice(text);
                throw Error(text);
            }
        }

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
                const chooser = new SKOSModal(this.app, this, tfile).open();
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
