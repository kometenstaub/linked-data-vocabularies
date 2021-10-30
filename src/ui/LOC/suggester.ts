import {
    App,
    normalizePath,
    Notice,
    Platform,
    SuggestModal,
    TFile,
} from 'obsidian';
import type SKOSPlugin from '../../main';
import type { headings, SuggesterItem } from '../../interfaces';
import { SubSKOSModal } from './suggester-sub';
import { SUBJECT_HEADINGS } from '../../constants';
import { WriteMethods } from 'src/methods/methods-write';
import * as fuzzysort from 'fuzzysort';
import { LCSHMethods } from 'src/methods/methods-loc';

export class SKOSModal extends SuggestModal<SuggesterItem> {
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
    onOpen() {
        if (Platform.isDesktopApp) {
            this.focusInput();
        } else if (Platform.isMobileApp) {
            setTimeout(this.focusInput, 400);
        }
    }

    focusInput() {
        //@ts-ignore
        document.getElementsByClassName('prompt-input')[0].focus();
    }

    getSuggestions(): SuggesterItem[] {
        let input = this.inputEl.value.trim();
        let results = [];
        const { settings } = this.plugin;
        if (this.lcshSuggester !== null) {
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
        const el1 = el0.createEl('b');
        el1.appendText(pL);
        //el.createEl('br')
        const el2 = el.createDiv();
        if (aL && note && aL !== pL) {
            if (lcc) {
                el0.appendText(' — LCC: ' + lcc);
                el2.appendText(aL + ' — ' + note);
            } else {
                el2.appendText(aL + ' — ' + note);
            }
        } else if (aL && !note && aL !== pL) {
            if (lcc) {
                el0.appendText(' — LCC: ' + lcc);
                el2.appendText(aL);
            } else {
                el2.appendText(aL);
            }
        } else if (!aL && note) {
            if (lcc) {
                el0.appendText(' — LCC: ' + lcc);
                el2.appendText(note);
            } else {
                el2.appendText(note);
            }
        } else if (lcc) {
            el0.appendText(' — LCC: ' + lcc);
        }
    }

    async onChooseSuggestion(
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
            const lcc = item.lcc;
            const writeMethods = new WriteMethods(this.app, this.plugin);
            if (lcc !== undefined) {
                await writeMethods.writeYaml(
                    headings,
                    this.tfile,
                    heading,
                    'https://id.loc.gov/authorities/subjects/' + item.uri,
                    evt,
                    lcc
                );
            } else {
                await writeMethods.writeYaml(
                    headings,
                    this.tfile,
                    heading,
                    'https://id.loc.gov/authorities/subjects/' + item.uri,
                    evt
                );
            }
        }
    }
}
