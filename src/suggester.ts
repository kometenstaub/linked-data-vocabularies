import { App, SuggestModal } from 'obsidian';
import type SKOSPlugin from './main';

export interface SuggesterItem {
	display: string; // the heading that is displayed to the user
	url: string; // the URL for getting the necessary data
}

//TODO: this needs to be implemented

export class SKOSFuzzyModal extends SuggestModal<SuggesterItem> {


	constructor(app: App, public plugin: SKOSPlugin) {
		super(app);
	}	
	

	getSuggestions(query: string): SuggesterItem[] {
		const input = this.inputEl.value
		let output : SuggesterItem[] = []
		this.plugin.methods.findHeading(input).then( (success) => {
			output = success
		})

		return output
	}

	renderSuggestion(value: SuggesterItem, el: HTMLElement) {
		//@ts-ignore
		el.createEl('b', value.display)
	}
	onChooseSuggestion(item: SuggesterItem, evt: MouseEvent | KeyboardEvent) {
		this.plugin.methods.getURL(item).then( (success) => {
			this.plugin.methods.parseSKOS(success).then((success) => {
				console.log('success')
			})
		})
		
	}

}

