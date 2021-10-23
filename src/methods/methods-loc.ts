import { App, Notice } from 'obsidian';
import type SKOSPlugin from '../main';
import type { headings, SuggesterItem, uriToPrefLabel } from '../interfaces';

export class LCSHMethods {
    app: App;
    plugin: SKOSPlugin;
    lcshUriToPrefLabel!: uriToPrefLabel;

    constructor(app: App, plugin: SKOSPlugin) {
        this.app = app;
        this.plugin = plugin;
    }

    public async resolveUris(item: SuggesterItem) {
        const broader = item.bt;
        const narrower = item.nt;
        const related = item.rt;

        let broaderHeadings: string[] = [];
        let narrowerHeadings: string[] = [];
        let relatedHeadings: string[] = [];

        const adapter = this.app.vault.adapter;
        const dir = this.plugin.manifest.dir;
        if (await adapter.exists(`${dir}/lcshUriToPrefLabel.json`)) {
            const lcshUriToPrefLabel = await adapter.read(
                `${dir}/lcshUriToPrefLabel.json`
            );
            this.lcshUriToPrefLabel = await JSON.parse(lcshUriToPrefLabel);
        } else {
            const text = 'The JSON file could not be read.';
            new Notice(text);
            throw Error(text);
        }

        if (broader !== undefined) {
            for (let uri of broader) {
                const heading = this.lcshUriToPrefLabel[uri];
                broaderHeadings.push(heading);
            }
        }
        if (narrower !== undefined) {
            for (let uri of narrower) {
                const heading = this.lcshUriToPrefLabel[uri];
                narrowerHeadings.push(heading);
            }
        }
        if (related !== undefined) {
            for (let uri of related) {
                const heading = this.lcshUriToPrefLabel[uri];
                relatedHeadings.push(heading);
            }
        }

        const returnItem: headings = {
            broader: broaderHeadings,
            narrower: narrowerHeadings,
            related: relatedHeadings,
        };

        return returnItem;
    }
}
