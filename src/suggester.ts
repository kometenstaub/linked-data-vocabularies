import { App, SuggestModal } from 'obsidian';
import type SKOSPlugin from './main';

export interface SuggesterItem {
	display: string; // the heading that is displayed to the user
	url: string; // the URL for getting the necessary data
}

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
		// this doesn't get logged
		console.log(value.display)
		el.createEl('div', value.display)
		
	}
	// this can't be called because no suggestions are rendered
	onChooseSuggestion(item: SuggesterItem, evt: MouseEvent | KeyboardEvent) {
		this.plugin.methods.getURL(item).then( (success) => {
			this.plugin.methods.parseSKOS(success).then((success) => {
				console.log('success')
			})
		})
		
	}

}

