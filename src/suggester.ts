import { App, SuggestModal } from 'obsidian';
import type SKOSPlugin from './main';




export interface SuggesterItem {
	display: string; // the heading that is displayed to the user
	url: string; // the URL for getting the necessary data
}

export class SKOSFuzzyModal extends SuggestModal<Promise<SuggesterItem>> {

	constructor(app: App, public plugin: SKOSPlugin) {
		super(app);
	}	
	
//	Property 'getSuggestions' in type 'SKOSFuzzyModal' is not assignable to the same property in base type 'SuggestModal<Promise<SuggesterItem>>'.
//  Type '(query: string) => Promise<SuggesterItem[]>' is not assignable to type '(query: string) => Promise<SuggesterItem>[]'.
//    Type 'Promise<SuggesterItem[]>' is missing the following properties from type 'Promise<SuggesterItem>[]': length, pop, push, concat, and 31 more.ts(2416)
	async getSuggestions(query: string): Promise<SuggesterItem[]> {
		const input = this.inputEl.value
		let output : SuggesterItem[] = []
		output = await this.plugin.methods.findHeading(input)
		// works until here
		console.log(output)
		return output
		

	}
	async renderSuggestion(value: Promise<SuggesterItem>, el: HTMLElement) {
		// this doesn't get logged
		const newValue = await value
		console.log(newValue.display)
		el.createEl('div', newValue.display)
		
	}
	// this can't be called because no suggestions are rendered
	async onChooseSuggestion(item: Promise<SuggesterItem>, evt: MouseEvent | KeyboardEvent) {
		const newItem = await item
		const url = await this.plugin.methods.getURL(newItem)
		this.plugin.methods.parseSKOS(url)
		
		
	}

}

