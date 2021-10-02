import {
	App,
	MarkdownEditView,
	Notice,
	request,
	RequestParam,
	TFile,
	MarkdownView,
} from 'obsidian';
import type {
	HTTPIDLOCGovOntologiesRecordInfoLanguageOfCataloging,
	SuggesterItem,
} from './interfaces';
import type SKOSPlugin from './main';
import type { headings, suggest2, returnObjectLcsh } from './interfaces';
import {
	BROADER_URL,
	NARROWER_URL,
	RELATED_URL,
	PREF_LABEL,
} from './constants';

export class LCSHMethods {
	app: App;
	plugin: SKOSPlugin;

	constructor(app: App, plugin: SKOSPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Gets the object which is needed to iterate over the headings
	 * @param url - the URL that is requested
	 * @returns - a responseObject in form of {@link returnObjectLcsh[]}
	 */
	private async requestHeadingURL(url: string): Promise<returnObjectLcsh[]> {
		const httpsUrl = url.replace('http', 'https');
		const requestObj: RequestParam = { url: httpsUrl };
		const response = await request(requestObj);
		const responseObject: returnObjectLcsh[] = JSON.parse(response);
		return responseObject;
	}

	/**
	 *
	 * @param heading | the input from the {@link SKOSModal.updateSuggestions | SuggesterModal }
	 * @returns - {@link SuggesterItem[] }, the array with information that populates
	 * 				SuggestModal in {@link SKOSModal.renderSuggestion }
	 */
	public async findHeading(heading: string): Promise<SuggesterItem[]> {
		let requestObject: RequestParam = {
			url: '',
		};

		const counter = this.plugin.settings.elementCounter;
		const searchType = this.plugin.settings.lcshSearchType;
		const encodedHeading = encodeURIComponent(heading);
		let url: string =
			'https://id.loc.gov/authorities/subjects/suggest2?q=' +
			encodedHeading;
		url += '&counter=' + counter;
		url += '&searchtype=' + searchType;
		// more parameters could eventually go here; Documentation:
		//https://id.loc.gov/techcenter/searching.html

		requestObject.url = url;

		let data = await request(requestObject);
		const newData: suggest2 = JSON.parse(data);

		let formerHeading = '';
		// calculate heading results from received json
		const headings: SuggesterItem[] = newData['hits'].map((suggestion) => {
			const display = suggestion.suggestLabel;
			let subdivision = false;
			const aLabel = suggestion.aLabel; // authoritative label
			if (formerHeading === display) {
				subdivision = true;
			}
			formerHeading = display;
			const url = suggestion.uri;
			const vLabel = suggestion.vLabel; // variant label
			return { display, url, aLabel, vLabel, subdivision };
		});

		// return data for modal
		return headings;
	}

	/**
	 *
	 * @param item - the {@link SuggesterItem} which {@link SKOSModal.onChooseSuggestion} passes to this function
	 * @returns - a response object, which is the content that is needed to parse the broader, narrower and
	 * related headings in {@link LCSHMethods.async parseSKOS}
	 */
	public async getURL(item: SuggesterItem): Promise<returnObjectLcsh[]> {
		const url = item.url + '.json';
		const responseObject: returnObjectLcsh[] = await this.requestHeadingURL(
			url
		);
		return responseObject;
	}

	/**
	 *
	 * @param responseObject - passed from {@link SKOSModal.async onChooseSuggestion}, is
	 * what {@link LCSHMethods.async getURL} returns
	 * @returns - the headingObj of type {@link headings} which contains the broader, narrower and related headings
	 * which can then be written to the file with {@link LCSHMethods.writeYaml}
	 */
	public async parseSKOS(
		responseObject: returnObjectLcsh[]
	): Promise<headings> {
		let broaderURLs: string[] = [];
		let narrowerURLs: string[] = [];
		let relatedURLs: string[] = [];

		/**
		 * The broader, narrower and related URLs are all in one object in the array, therefore
		 * I can break after the last one and don't check the objects after it because no BT/NT/RT links
		 * would be in there; hence also three `if` and not else if (they're all in the same object)
		 */
		// prettier-ignore
		for (let element of responseObject) {
			//@ts-ignore
			let broaderItem: HTTPIDLOCGovOntologiesRecordInfoLanguageOfCataloging[] = element[BROADER_URL];
			//@ts-ignore
			let narrowerItem: HTTPIDLOCGovOntologiesRecordInfoLanguageOfCataloging[] = element[NARROWER_URL];
			//@ts-ignore
			let relatedItem: HTTPIDLOCGovOntologiesRecordInfoLanguageOfCataloging[] = element[RELATED_URL];
			if (broaderItem) {
				for (let element of broaderItem) {
					broaderURLs.push(element['@id']);
				}
			} if (narrowerItem) {
				for (let element of narrowerItem) {
					narrowerURLs.push(element['@id']);
				}
			} if (relatedItem) {
				for (let element of relatedItem) {
					relatedURLs.push(element['@id']);
				}
				break;
			}
		}

		let broaderHeadings: string[] = [];
		let narrowerHeadings: string[] = [];
		let relatedHeadings: string[] = [];

		/**
		 * Each JSON for each heading URL is requested and its name is resolved and added to the headingsArr
		 * @param urls - the URL arrays from above, @see broaderURLs, @see narrowerURLs, @see relatedURLs
		 * @param headingsArr - the array to be filled with values, @see broaderHeadings, @see narrowerHeadings, @see relatedHeadings
		 * @param numberOfHeadings - the number of maximum headings to be included, they are taken from the settings
		 */
		const fillValues = async (
			urls: string[],
			headingsArr: string[],
			numberOfHeadings: string
		) => {
			let count: number = 0;
			let limit: boolean = false;
			if (numberOfHeadings !== '') {
				limit = true;
				count = parseInt(numberOfHeadings);
			}
			for (let url of urls) {
				if (limit && count === 0) {
					break;
				}
				responseObject = await this.requestHeadingURL(url + '.json');

				for (let element of responseObject) {
					if (element['@id'] === url) {
						let subelement = element[PREF_LABEL];
						if (subelement !== undefined) {
							for (let subsubelement of subelement) {
								if (subsubelement['@language'] === 'en') {
									headingsArr.push(subsubelement['@value']);
								}
								if (limit) {
									count--;
								}
							}
						}
						// we already have the heading name, no need to check the other objects
						break;
					}
				}
			}
		};

		await fillValues(
			broaderURLs,
			broaderHeadings,
			this.plugin.settings.broaderMax
		);
		await fillValues(
			narrowerURLs,
			narrowerHeadings,
			this.plugin.settings.narrowerMax
		);
		await fillValues(
			relatedURLs,
			relatedHeadings,
			this.plugin.settings.relatedMax
		);

		const headingObj: headings = {
			broader: broaderHeadings,
			narrower: narrowerHeadings,
			related: relatedHeadings,
		};

		return headingObj;
	}

	// Thank you for the inspiration: https://github.com/chhoumann/MetaEdit/blob/95e9fc662d170da52a8c83119e174e33dc58276b/src/metaController.ts#L38
	/**
	 * Depending on whether the Shift key is activated, it either starts to build up the YAML for the frontmatter
	 * YAML or inline YAML or use with {@link https://github.com/blacksmithgu/obsidian-dataview | Dataview}
	 * @param headingObj - The object containing all the broader, narrower and related headings from {@link parseSKOS}
	 * @param tfile - The {@link TFile } of the current active {@link MarkdownView}
	 * @param heading - The selected heading from th heading from the SuggesterModal
	 * @param evt - The keys which are pressed down or not of type {@link MouseEvent} or {@link KeyboardEvent}
	 */
	public async writeYaml(
		headingObj: headings,
		tfile: TFile,
		heading: string,
		url: string,
		evt: KeyboardEvent | MouseEvent
	): Promise<void> {
		// the shift key is not activated
		if (!evt.shiftKey) {
			const fileContent: string = await this.app.vault.read(tfile);
			const fileCache = this.app.metadataCache.getFileCache(tfile);
			let splitContent = fileContent.split('\n');
			// if the current file has no frontmatter
			if (!fileCache?.frontmatter) {
				let newFrontMatter: string[] = ['---'];
				newFrontMatter.concat(
					this.buildYaml(newFrontMatter, headingObj, heading, url)
				);
				newFrontMatter.push('---');
				const reversedFrontMatter = newFrontMatter.reverse();

				for (let property of reversedFrontMatter) {
					splitContent.unshift(property);
				}
				await this.writeYamlToFile(splitContent, tfile);
			} // the current file has frontmatter
			else {
				// destructures the file cache frontmatter position
				// start is the beggining and should return 0, the end returns
				// the line number of the last ---
				const {
					position: { start, end },
				} = fileCache.frontmatter;

				let addedFrontmatter: string[] = [];
				addedFrontmatter.concat(
					this.buildYaml(addedFrontmatter, headingObj, heading, url)
				);

				let lineCount: number = 0;
				for (let line of addedFrontmatter) {
					splitContent.splice(end.line + lineCount, 0, line);
					lineCount++;
				}

				await this.writeYamlToFile(splitContent, tfile);
			}
		} // the shift key is activated
		else if (evt.shiftKey) {
			let newFrontMatter: string[] = [];
			const yaml = this.buildYaml(
				newFrontMatter,
				headingObj,
				heading,
				url
			);
			let inlineYaml: string = '';
			for (let line of yaml) {
				inlineYaml += line.replace(':', '::') + '\n';
			}
			this.writeInlineYamlToSel(inlineYaml, tfile);
		}
	}

	/**
	 * Writes the YAML to the currently active file, if it is active.
	 * @param splitContent - the curerntly active file, each line being one array element
	 * @param tfile - the currently active file, @see TFile
	 */
	async writeYamlToFile(splitContent: string[], tfile: TFile): Promise<void> {
		const newFileContent = splitContent.join('\n');
		if (this.app.workspace.getActiveFile() === tfile) {
			await this.app.vault.modify(tfile, newFileContent);
		} else {
			new Notice(
				'You switched to another file before the content could be written.'
			);
		}
	}

	/**
	 * Insert the inline YAML at the current cursor position, if the file from the beginning is still active.
	 * @param inlineYaml - the inline YAML as string
	 * @param tfile - the currently active file, @see TFile
	 */
	writeInlineYamlToSel(inlineYaml: string, tfile: TFile) {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (this.app.workspace.getActiveFile() === tfile) {
			const activeEditor = activeView?.editor;
			const editorRange = activeEditor?.getCursor('from');
			if (typeof editorRange !== 'undefined') {
				activeEditor?.replaceRange(inlineYaml, editorRange);
			} else {
				new Notice('Your cursor is not anymore in the same file.');
			}
		}
	}

	/**
	 *
	 * @param newFrontMatter - the array to which the YAML lines will be pushed
	 * @param headingObj - the object containing broader, narrower and related headings
	 * @param heading - the heading that was selected in the SuggestModal
	 * @param url - the URL of the heading that was selected in the SuggestModal
	 * @returns - the YAML lines as an array which can then be written to the file
	 */
	buildYaml(
		newFrontMatter: string[],
		headingObj: headings,
		heading: string,
		url: string
	): string[] {
		const { settings } = this.plugin;

		newFrontMatter.push(settings.headingKey + ': ' + heading);
		if (settings.urlKey !== '') {
			newFrontMatter.push(settings.urlKey + ': ' + url);
		}
		/**
		 * It will be zero if there are no headings or when the user chose 0 in the settings,
		 * because {@link LCSHMethods.fillValues} breaks if the number is 0 or at the user defined limit,
		 * so the array with headings will only contain as many heaindgs as the user chose
		 */
		if (headingObj.broader.length > 0) {
			let broaderHeadings: string[] = headingObj.broader;
			broaderHeadings = this.surroundWithQuotes(broaderHeadings);
			newFrontMatter.push(
				this.plugin.settings.broaderKey +
					': [' +
					broaderHeadings.toString() +
					']'
			);
		}
		if (headingObj.narrower.length > 0) {
			let narrowerHeadings: string[] = headingObj.narrower;
			narrowerHeadings = this.surroundWithQuotes(narrowerHeadings);
			newFrontMatter.push(
				this.plugin.settings.narrowerKey +
					': [' +
					narrowerHeadings.toString() +
					']'
			);
		}
		if (headingObj.related.length > 0) {
			let relatedHeadings: string[] = headingObj.related;
			relatedHeadings = this.surroundWithQuotes(relatedHeadings);
			newFrontMatter.push(
				this.plugin.settings.relatedKey +
					': [' +
					relatedHeadings.toString() +
					']'
			);
		}
		return newFrontMatter;
	}
	/**
	 *
	 * @param headingsArray | the array of headings returned from {@link buildYaml}
	 * @returns - an array where each element is surrounded with double quotes
	 */
	surroundWithQuotes(headingsArray: string[]): string[] {
		let newHeadingsArray: string[] = [];
		for (let heading of headingsArray) {
			newHeadingsArray.push('"' + heading + '"');
		}
		return newHeadingsArray;
	}
}
