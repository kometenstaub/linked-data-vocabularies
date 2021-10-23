import { App, FuzzySuggestModal, Notice, TFile } from 'obsidian';
import type SKOSPlugin from '../../main';
import type { headings, SuggesterItem } from '../../interfaces';
import { SubSKOSModal } from './suggester-sub';
import { SUBJECT_HEADINGS } from '../../constants';
import { WriteMethods } from 'src/methods/methods-write';
import * as fuzzysort from 'fuzzysort';
import { LCSHMethods } from 'src/methods/methods-loc';

export class SKOSModal extends FuzzySuggestModal<SuggesterItem> {
    plugin: SKOSPlugin;
    tfile: TFile;
    suggestions: any;
    collection: string;
    lcshSuggester!: SuggesterItem[];

    constructor(
        app: App,
        plugin: SKOSPlugin,
        tfile: TFile,
        collection: string
    ) {
        super(app);
        this.plugin = plugin;
        this.tfile = tfile;
        this.collection = collection;
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

        const adapter = this.app.vault.adapter;
        const dir = this.plugin.manifest.dir;
        (async () => {
            if (await adapter.exists(`${dir}/lcshSuggester.json`)) {
                const lcshSuggester = await adapter.read(
                    `${dir}/lcshSuggester.json`
                );
                this.lcshSuggester = await JSON.parse(lcshSuggester);
            } else {
                const text = 'The JSON file could not be read.';
                new Notice(text);
                throw Error(text);
            }
        })();
        if (collection === SUBJECT_HEADINGS) {
            this.setInstructions([
                {
                    command: 'shift ↵',
                    purpose: 'to insert as inline YAML at selection',
                },
                {
                    command: '↵',
                    purpose: 'to insert as YAML',
                },
                {
                    command: 'alt ↵',
                    purpose: 'to add a subdivision',
                },
            ]);
        } else {
            this.setInstructions([
                {
                    command: 'shift ↵',
                    purpose: 'to insert as inline YAML at selection',
                },
                {
                    command: '↵',
                    purpose: 'to insert as YAML',
                },
            ]);
        }
    }

    /**
     * Add what function the Shift key has and refocus the cursor in it.
     * For mobile it requires a timeout, because the modal needs time to appear until the cursor can be placed in it,
     */
    //onOpen() {
    //    if (Platform.isDesktopApp) {
    //        this.focusInput();
    //    } else if (Platform.isMobileApp) {
    //        setTimeout(this.focusInput, 400);
    //    }
    //}

    //focusInput() {
    //    //@ts-ignore
    //    document.getElementsByClassName('prompt-input')[0].focus();
    //    //@ts-ignore
    //    document.getElementsByClassName('prompt-input')[0].select();
    //}

    getItems(): SuggesterItem[] {
        let input = this.inputEl.value.trim();
        let results = [];
        if (this.lcshSuggester !== null) {
            const fuzzyResult = fuzzysort.go(input, this.lcshSuggester, {
                key: 'pL',
                limit: 500,
                threshold: -10000,
            });
            for (let el of fuzzyResult) {
                results.push(el.obj);
            }
        }
        //@ts-ignore
        return results;
    }
    getItemText(item: SuggesterItem): string {
        if (item.aL && item.note && item.aL !== item.pL) {
            return item.pL + ' — ' + item.aL + ' — ' + item.note;
        } else if (item.aL && !item.note && item.pL !== item.pL) {
            return item.pL + ' — ' + item.aL;
        } else if (!item.aL && item.note) {
            return item.pL + ' — ' + item.note;
        } else {
            return item.pL;
        }
    }

    async onChooseItem(
        item: SuggesterItem,
        evt: MouseEvent | KeyboardEvent
    ): Promise<void> {
        let heading = item.pL;
        if (evt.altKey) {
            new SubSKOSModal(this.app, this.plugin, this.tfile, item).open();
        } else {
            let headings: headings;
            const methods_loc = new LCSHMethods(this.app, this.plugin);
            // parse them here, otherwise if Alt key is pressed, the second modal is delayed
            /**
             * only parse relations for LCSH
             * since writeYaml still checks for the length of every element, we need to pass
             * an empty object
             */
            if (this.collection === SUBJECT_HEADINGS) {
                headings = await methods_loc.resolveUris(item);
            } else {
                headings = { broader: [], narrower: [], related: [] };
            }
            const writeMethods = new WriteMethods(this.app, this.plugin);
            await writeMethods.writeYaml(
                headings,
                this.tfile,
                heading,
                item.uri,
                evt
            );
        }
    }

}
