import { App, Notice, request, RequestParam, TFile } from 'obsidian';
import type { SuggesterItem } from './interfaces';
import type SKOSPlugin from './main';
import type { headings, suggest2 } from './interfaces';

export class LCSHMethods {
	app: App;
	plugin: SKOSPlugin;

	constructor(app: App, plugin: SKOSPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	private async requestHeadingURL(url: string): Promise<Object[]> {
		const response = await request({ url: url });
		const responseObject: {}[] = JSON.parse(response);
		return responseObject;
	}

	// input: heading from SuggestModal
	public async findHeading(heading: string): Promise<SuggesterItem[]> {
		let requestObject: RequestParam = {
			url: ''
		};

		// reading settings doesn't work, it returns undefined
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

		// calculate heading results from received json
		const headings: SuggesterItem[] = newData['hits'].map((suggestion) => {
			const display = suggestion.suggestLabel;
			const url = suggestion.uri;
			return { display, url }
		})

		// set data for modal
		return headings;
	}

	public async getURL(item: SuggesterItem): Promise<Object[]> {
		const url = item.url + '.json';
		const responseObject = await this.requestHeadingURL(url);
		return responseObject;
	}

	public async parseSKOS(responseObject: {}[]): Promise<headings> {
		let broaderURLs: string[] = [];
		let narrowerURLs: string[] = [];
		let relatedURLs: string[] = [];

		function fillURLs(type: string, element: { [key: string]: string | {}[] | string[] }, urlArr: string[]) {
			const item = element[type]
			if (item) {
				item.forEach(
					(id: { [x: string]: string; }) => {
						urlArr.push(id['@id']);
					}
				);
			}
		}

		responseObject.forEach(
			(element: { [key: string]: string | {}[] | string[] }) => {
				fillURLs(BROADER_URL, element, broaderURLs)
				fillURLs(NARROWER_URL, element, narrowerURLs)
				fillURLs(RELATED_URL, element, relatedURLs)
			}
		);

		let broaderHeadings: string[] = [];
		let narrowerHeadings: string[] = [];
		let relatedHeadings: string[] = [];

		const fillValues = async (urls: string[], headingsArr: string[]) => {
			for (let url of urls) {
				const responseObject = await this.requestHeadingURL(url + '.json');
				responseObject.forEach(
					//@ts-ignore
					(element: { [key: string]: string | {}[] | string[] }) => {
						if (element['@id'] === url) {
							element[
								AUTHORITATIVE_LABEL
								//@ts-expect-error
							].forEach((nameElement: { [key: string]: string }) => {
								if (nameElement['@language'] === 'en') {
									headingsArr.push(nameElement['@value']);
								}
							});
						}
					}
				);
			}
		}

		fillValues(broaderURLs, broaderHeadings)
		fillValues(narrowerURLs, narrowerHeadings)
		fillValues(relatedURLs, relatedHeadings)

		const headingObj: headings = {
			broader: broaderHeadings,
			narrower: narrowerHeadings,
			related: relatedHeadings,
		};

		return headingObj;
	}

	// Thank you for the inspiration: https://github.com/chhoumann/MetaEdit/blob/95e9fc662d170da52a8c83119e174e33dc58276b/src/metaController.ts#L38
	public async writeYaml(
		headingObj: headings,
		tfile: TFile,
		heading: string,
		url: string
	): Promise<void> {
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
	}
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

	buildYaml(
		newFrontMatter: string[],
		headingObj: headings,
		heading: string,
		url: string
	): string[] {
		const { settings } = this.plugin

		newFrontMatter.push(settings.headingKey + ': ' + heading);
		if (settings.urlKey !== '') {
			newFrontMatter.push(settings.urlKey + ': ' + url);
		}
		if (settings.broaderMax !== '0') {
			let broaderHeadings: string[] = headingObj.broader;
			if (headingObj.broader.length > 0) {
				if (settings.broaderMax !== '') {
					broaderHeadings = broaderHeadings.slice(
						0,
						parseInt(settings.broaderMax)
					);
				}
				newFrontMatter.push(
					settings.broaderKey +
					': [' +
					broaderHeadings +
					']'
				);
			}
		}
		if (settings.narrowerMax !== '0') {
			let narrowerHeadings: string[] = headingObj.narrower;
			if (headingObj.narrower.length > 0) {
				if (settings.narrowerMax !== '') {
					narrowerHeadings = narrowerHeadings.slice(
						0,
						parseInt(settings.narrowerMax)
					);
				}
				newFrontMatter.push(
					settings.narrowerKey +
					': [' +
					narrowerHeadings +
					']'
				);
			}
		}
		if (settings.relatedMax !== '0') {
			let relatedHeadings: string[] = headingObj.related;
			if (headingObj.related.length > 0) {
				if (settings.relatedMax !== '') {
					relatedHeadings = relatedHeadings.slice(
						0,
						parseInt(settings.relatedMax)
					);
				}
				newFrontMatter.push(
					settings.relatedKey +
					': [' +
					relatedHeadings +
					']'
				);
			}
		}
		return newFrontMatter;
	}
}
