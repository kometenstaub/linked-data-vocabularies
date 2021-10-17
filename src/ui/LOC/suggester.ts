import { App, FuzzySuggestModal, Notice, Platform, TFile } from 'obsidian';
import type SKOSPlugin from '../../main';
import type {
    headings,
    passInformation,
    SuggesterItem,
    uriToPrefLabel,
} from '../../interfaces';
import { SubSKOSModal } from './suggester-sub';
import { SUBJECT_HEADINGS } from '../../constants';
import { WriteMethods } from 'src/methods/methods-write';

export class SKOSModal extends FuzzySuggestModal<SuggesterItem> {
    plugin: SKOSPlugin;
    tfile: TFile;
    suggestions: any;
    collection: string;
    lcshSuggester!: SuggesterItem[];
    lcshSubdivSuggester!: SuggesterItem[];
    lcshUriToPrefLabel!: uriToPrefLabel;

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
        setTimeout(async () => {
            if (
                (await adapter.exists(`${dir}/lcshSuggester.json`)) &&
                (await adapter.exists(`${dir}/lcshSubdivSuggester.json`)) &&
                (await adapter.exists(`${dir}/lcshUriToPrefLabel.json`))
            ) {
                const lcshSuggester = await adapter.read(
                    `${dir}/lcshSuggester.json`
                );
                const lcshSubdivSuggester = await adapter.read(
                    `${dir}/lcshSubdivSuggester.json`
                );
                const lcshUriToPrefLabel = await adapter.read(
                    `${dir}/lcshUriToPrefLabel.json`
                );
                this.lcshSuggester = await JSON.parse(lcshSuggester);
                this.lcshSubdivSuggester = await JSON.parse(
                    lcshSubdivSuggester
                );
                this.lcshUriToPrefLabel = await JSON.parse(lcshUriToPrefLabel);
            } else {
                const text = 'The three JSON files cannot be read.';
                new Notice(text);
                throw Error(text);
            }
        }, 100);
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
        //@ts-ignore
        document.getElementsByClassName('prompt-input')[0].select();
    }

    getItems(): SuggesterItem[] {
        let input = this.inputEl.value.trim();
        input = input.toLocaleLowerCase();
        let results = [];
        let matches = 0;
        if (this.lcshSuggester !== null) {
            for (
                let i = 0;
                i < this.lcshSuggester.length && matches < 1000;
                i++
            ) {
                let item = this.lcshSuggester[i];
                if (
                    item.pL.toLocaleLowerCase().startsWith(input) ||
                    item.aL?.toLocaleLowerCase().startsWith(input) //||
                    //item.pL.toLocaleLowerCase().includes(input) ||
                    //item.aL?.toLocaleLowerCase().includes(input)

                ) {
                    results.push(this.lcshSuggester[i]);
                    matches++;
                }
            }
        }
        // returns all the items, so it needs to be shortened
        return results;
    }
    getItemText(item: SuggesterItem): string {
        if (item.aL && item.note && (item.aL !== item.pL)) {
            return item.pL + ' -- ' + item.aL + ' -- ' + item.note;
        } else if (item.aL && !item.note && (item.pL !== item.pL)) {
            return item.pL + ' -- ' + item.aL 
        } else if (!item.aL && item.note) {
            return item.pL + ' -- ' + item.note 
        } else {
            return item.pL
        }
    }
    onChooseItem(item: SuggesterItem, evt: MouseEvent | KeyboardEvent): void {
        new Notice('You chose an item');
    }

    /**
     *
     * @param value - takes the {@link SuggesterItem}
     * @param el - append HTML to be displayed to it
     */

    //@ts-ignore
    // renderSuggestion(value: SuggesterItem, el: HTMLElement) {
    //     const { pL, aL, note } = value;

    //     const el1 = el.createEl('b');
    //     el1.appendText(pL);
    //     //el.createEl('br')
    //     const el2 = el.createEl('div');
    //     if (aL && aL !== pL) {
    //         el2.appendText(pL + ' — ' + aL);
    //     }
    // }

    //	getSuggestions(){
    //
    //	}
    //
    //    /**
    //     * Gets the JSON content for each URL
    //     * returns all the headings and parse them
    //     * then writes them to the current file's YAML
    //     *
    //     * @param item - @see the type definition
    //     * @param evt - @see the type definition
    //     */
    //
    //    //@ts-ignore
    //    async onChooseSuggestion(
    //        item: SuggesterItem,
    //        evt: MouseEvent | KeyboardEvent
    //    ) {
    //		new Notice('You chose an item')
    //		return
    //        let heading = item.display;
    //        heading = heading.replace(/.+?\(USE (.+?)\)/, '$1');
    //        const headingUrl = item.url;
    //
    //        if (evt.altKey) {
    //            const data: passInformation = {
    //                suggestItem: item,
    //                heading: heading,
    //                url: headingUrl,
    //            };
    //            new SubSKOSModal(this.app, this.plugin, this.tfile, data).open();
    //        } else {
    //            // parse them here, otherwise if Alt key is pressed, the second modal is delayed
    //            const headingObj = await this.plugin.methods_loc.getURL(item);
    //            let headings: headings;
    //            /**
    //             * only parse relations for LCSH
    //             * since writeYaml still checks for the length of every element, we need to pass
    //             * an empty object
    //             */
    //            if (this.collection === SUBJECT_HEADINGS) {
    //                headings = await this.plugin.methods_loc.parseSKOS(headingObj);
    //            } else {
    //                headings = { broader: [], narrower: [], related: [] };
    //            }
    //            const writeMethods = new WriteMethods(this.app, this.plugin);
    //            await writeMethods.writeYaml(
    //                headings,
    //                this.tfile,
    //                heading,
    //                headingUrl,
    //                evt
    //            );
    //        }
    //    }
}
