import { App, SuggestModal } from 'obsidian';
import type SKOSPlugin from './main';



export interface SuggesterItem {
	display: string; // the heading that is displayed to the user
	url: string; // the URL for getting the necessary data
}

export class SKOSFuzzyModal extends SuggestModal<Promise<any[]>> {

	constructor(app: App, public plugin: SKOSPlugin) {
		super(app);
	}	
	
//	Property 'getSuggestions' in type 'SKOSFuzzyModal' is not assignable to the same property in base type 'SuggestModal<Promise<SuggesterItem>>'.
//  Type '(query: string) => Promise<SuggesterItem[]>' is not assignable to type '(query: string) => Promise<SuggesterItem>[]'.
//    Type 'Promise<SuggesterItem[]>' is missing the following properties from type 'Promise<SuggesterItem>[]': length, pop, push, concat, and 31 more.ts(2416)


	suggestions: any;
	async updateSuggestions() {
	  this.suggestions = await this.asyncGetSuggestions();
	  //@ts-expect-error
	  await super.updateSuggestions();
	  this.suggestions = null;
	}
	
	getSuggestions() {
	  return this.suggestions;
	}
	
	async asyncGetSuggestions() {
		const input = this.inputEl.value
	  return this.plugin.methods.findHeading(input)
	}

	
	renderSuggestion(value: any, el: HTMLElement) {
		// this doesn't get logged
		const newValue = value
		console.log(newValue.display)
		el.createEl('b', newValue.display)
		el.appendText(newValue.display)
		
	}
	// this can't be called because no suggestions are rendered
	async onChooseSuggestion(item: SuggesterItem, evt: MouseEvent | KeyboardEvent) {
		const newItem = item
		const url = await this.plugin.methods.getURL(newItem)
		this.plugin.methods.parseSKOS(url)
		
		
	}

}

