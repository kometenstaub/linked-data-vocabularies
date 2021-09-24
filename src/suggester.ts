import { FuzzySuggestModal, FuzzyMatch} from 'obsidian';
import SKOSPlugin from './main';

export interface SuggesterItem {
	display: string; // the heading that is displayed to the user
	url: string; // the URL for getting the necessary data
}

//TODO: this needs to be implemented

export class SKOSFuzzyModal extends FuzzySuggestModal<SuggesterItem> {
	// this only needs to be called when the user has chosen a heading in the modal
	// it is the callback
	//this.requestHeadingURL;
	static data: SuggesterItem[];
    plugin: SKOSPlugin;
	

	constructor(plugin: SKOSPlugin) {
		super(plugin.app);
	}


	setSuggesterData(suggesterData: SuggesterItem[]): void {
		SKOSFuzzyModal.data = suggesterData;
	}

	//onOpen() {
	//	super.onOpen();
	//}

	//onClose() {
	//	const { contentEl } = this;
	//	contentEl.empty();
	//}

	getItems(): SuggesterItem[] {
		return SKOSFuzzyModal.data;
	}

	getItemText(item: SuggesterItem): string {
		return item.display;
	}

	async onChooseItem(item: SuggesterItem, evt: MouseEvent | KeyboardEvent): Promise<void> {
        this.close();
		await this.plugin.findHeading(item.display);
	} // required by TS - do we need this or can we use onSuggestion?

	renderSuggestion(item: FuzzyMatch<SuggesterItem>, el: HTMLElement): void {
		el.createEl('div', { text: item.item.display });
	}



}
