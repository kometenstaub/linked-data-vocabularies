// Thank you: https://github.com/OfficerHalf/obsidian-trello/blob/c1340ba43bedb962aadd8f9e8f0106ce59e7017f/src/meta-edit.ts
import { create } from 'domain';
import { Notice, TFile } from 'obsidian';
import type { headings, MetaEditApi } from './interfaces';
import type SKOSPlugin from './main';

export class MetaEditWrapper {
	constructor(private readonly skosPlugin: SKOSPlugin) {}

	get available(): boolean {
		const available = !!(this.skosPlugin.app as any).plugins.plugins[
			'metaedit'
		];
		if (!available) {
			const notice = 'MetaEdit is not installed. Please install it.';
			console.log(notice);
			new Notice(notice);
		}
		return available;
	}

	get plugin(): MetaEditApi {
		return {
			...(this.skosPlugin.app as any).plugins.plugins['metaedit'].api,
		};
	}

	/**
	 * Add or update a frontmatter key to a given file
	 * Make sure not to call this multiple times in a row,
	 * updates can get clobbered.
	 */
	async updateOrCreateMeta(
		object: headings,
		key: string,
		file: TFile
	): Promise<void> {
        const headingsObj = object
		const value = await this.plugin.getPropertyValue(key, file);
		if (typeof(value) === 'string') {
			const updateNotice = `Updating ${key}...`;
			console.log(updateNotice);
			new Notice(updateNotice);
			this.plugin.update(key, object[key], file);
		} else if (value === undefined){
            console.log('else condition')
            console.log(object)
			const newValue : string[]= headingsObj[key];
            console.log(newValue)
            //@ts-ignore
            let newValueString = '' 
            newValue.map(el => {
                return newValueString += el
                console.log(el)
            })
            console.log(newValueString)
			const createNotice = `Creating ${key} key with ${newValueString}`;
            console.log(createNotice)
            //newValue.map((el : string) => {
			await this.plugin.createYamlProperty(key, newValueString, file);
            //})
		}
	}
}
