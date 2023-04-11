import { App, normalizePath, Notice } from "obsidian";
import type SKOSPlugin from "../main";
import type { headings, SuggesterItem, uriToPrefLabel } from "../interfaces";

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

		const broaderHeadings: string[] = [];
		const narrowerHeadings: string[] = [];
		const relatedHeadings: string[] = [];

		const adapter = this.app.vault.adapter;
		const dir = this.plugin.settings.inputFolder;
		const path = normalizePath(`${dir}/lcshUriToPrefLabel.json`);
		if (await adapter.exists(path)) {
			const lcshUriToPrefLabel = await adapter.read(path);
			this.lcshUriToPrefLabel = JSON.parse(lcshUriToPrefLabel);
		} else {
			const text = "The JSON file could not be read.";
			new Notice(text);
			throw Error(text);
		}

		const { settings } = this.plugin;
		let broaderMax = 0;
		settings.broaderMax !== "" ? (broaderMax = parseInt(settings.broaderMax)) : null;
		let narrowerMax = 0;
		settings.narrowerMax !== "" ? (narrowerMax = parseInt(settings.narrowerMax)) : null;
		let relatedMax = 0;
		settings.relatedMax !== "" ? (relatedMax = parseInt(settings.relatedMax)) : null;

		if (broader !== undefined && broaderMax > 0) {
			for (const uri of broader.slice(0, broaderMax)) {
				if (uri.startsWith("sh")) {
					const heading = this.lcshUriToPrefLabel[uri];
					broaderHeadings.push(heading);
				} else {
					// if it doesn't start with 'sh', then it's not a URI but an already resolved skolem IRI
					broaderHeadings.push(uri);
				}
			}
		}
		if (narrower !== undefined && narrowerMax > 0) {
			for (const uri of narrower.slice(0, narrowerMax)) {
				if (uri.startsWith("sh")) {
					const heading = this.lcshUriToPrefLabel[uri];
					narrowerHeadings.push(heading);
				} else {
					narrowerHeadings.push(uri);
				}
			}
		}
		if (related !== undefined && relatedMax > 0) {
			for (const uri of related.slice(0, relatedMax)) {
				if (uri.startsWith("sh")) {
					const heading = this.lcshUriToPrefLabel[uri];
					relatedHeadings.push(heading);
				} else {
					relatedHeadings.push(uri);
				}
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
