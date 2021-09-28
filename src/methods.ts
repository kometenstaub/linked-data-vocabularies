import { App, request, RequestParam, TFile} from 'obsidian';
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

	// input: heading from FuzzySuggestModal
	// it needs to be called on every keystroke
	public async findHeading(heading: string): Promise<SuggesterItem[]> {
		//@ts-ignore
		let requestObject: RequestParam = {};
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
		url += '.json';

		requestObject.url = url;

		let data = await request(requestObject);
		const newData: suggest2 = JSON.parse(data);
		//TODO: remove when Modal implemented
		console.log(newData);

		// calculate heading results from received json
		let headings: SuggesterItem[] = [];

		newData['hits'].map((suggestion) => {
			const display = suggestion.suggestLabel;
			const url = suggestion.uri;
			headings.push({ display: display, url: url });
		});
		//TODO: remove when Modal implemented
		console.log(headings);

		// set data for modal
		return headings;

		// display results

		// //tests // that URL would need to be supplied by the user over the modal
		// // here it simply takes the first result
		//const testURL = headings[0].url + '.json';
		//const chosenHeading = headings[0].display;
		//console.log(chosenHeading)
		//const responseObject = await this.requestHeadingURL(testURL);
		////TODO: remove when Modal implemented
		//console.log(responseObject);
		//await this.parseSKOS(responseObject);
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
		responseObject.forEach(
			(element: { [key: string]: string | {}[] | string[] }) => {
				if (element['http://www.w3.org/2004/02/skos/core#broader']) {
					element[
						'http://www.w3.org/2004/02/skos/core#broader'
						//@ts-expect-error // it also contains strings, but not in what we're looking for
					].forEach(
						//@ts-expect-error // it also contains strings, but not in what we're looking for
						(id) => {
							broaderURLs.push(id['@id']);
						}
					);
				}
				if (element['http://www.w3.org/2004/02/skos/core#narrower']) {
					element[
						'http://www.w3.org/2004/02/skos/core#narrower'
						//@ts-expect-error // it also contains strings, but not in what we're looking for
					].forEach(
						//@ts-expect-error // it also contains strings, but not in what we're looking for
						(id) => {
							narrowerURLs.push(id['@id']);
						}
					);
				}
				if (element['http://www.w3.org/2004/02/skos/core#related']) {
					element[
						'http://www.w3.org/2004/02/skos/core#related'
						//@ts-expect-error // it also contains strings, but not in what we're looking for
					].forEach(
						//@ts-expect-error // it also contains strings, but not in what we're looking for
						(id) => {
							relatedURLs.push(id['@id']);
						}
					);
				}
			}
		);
		// the URLs get logged fine
		//console.log(JSON.stringify(broaderURLs, null, 2))
		let broaderHeadings: string[] = [];
		let narrowerHeadings: string[] = [];
		let relatedHeadings: string[] = [];

		//something is wrong here

		for (let url of broaderURLs) {
			const responseObject = await this.requestHeadingURL(url + '.json');
			responseObject.forEach(
				//@ts-ignore
				(element: { [key: string]: string | {}[] | string[] }) => {
					if (element['@id'] === url) {
						element[
							'http://www.loc.gov/mads/rdf/v1#authoritativeLabel'
							//@ts-expect-error
						].forEach((nameElement: { [key: string]: string }) => {
							if (nameElement['@language'] === 'en') {
								console.log("kello again it's me");
								broaderHeadings.push(nameElement['@value']);
							}
						});
					}
				}
			);
		}
		console.log(JSON.stringify(broaderHeadings, null, 2));
		for (let url of narrowerURLs) {
			const responseObject = await this.requestHeadingURL(url + '.json');
			responseObject.forEach(
				//@ts-ignore
				(element: { [key: string]: string | {}[] | string[] }) => {
					if (element['@id'] === url) {
						element[
							'http://www.loc.gov/mads/rdf/v1#authoritativeLabel'
							//@ts-expect-error
						].forEach((nameElement: { [key: string]: string }) => {
							if (nameElement['@language'] === 'en') {
								narrowerHeadings.push(nameElement['@value']);
							}
						});
					}
				}
			);
		}
		console.log(JSON.stringify(narrowerHeadings, null, 2));

		for (let url of relatedURLs) {
			const responseObject = await this.requestHeadingURL(url + '.json');
			responseObject.forEach(
				//@ts-ignore
				(element: { [key: string]: string | {}[] | string[] }) => {
					if (element['@id'] === url) {
						element[
							'http://www.loc.gov/mads/rdf/v1#authoritativeLabel'
							//@ts-expect-error
						].forEach((nameElement: { [key: string]: string }) => {
							if (nameElement['@language'] === 'en') {
								relatedHeadings.push(nameElement['@value']);
							}
						});
					}
				}
			);
		}
		console.log(JSON.stringify(relatedHeadings, null, 2));

		const headingObj: headings = {
			broader: broaderHeadings,
			narrower: narrowerHeadings,
			related: relatedHeadings,
		};

		console.log('does this work now?????');
		console.log(JSON.stringify(headingObj, null, 2));

		return headingObj;
	}

	// Thank you: https://github.com/chhoumann/MetaEdit/blob/95e9fc662d170da52a8c83119e174e33dc58276b/src/metaController.ts#L38
	public async writeYaml(
		headingObj: headings,
		tfile: TFile,
		heading: string,
		url: string
	) {
		const fileContent: string = await this.app.vault.read(tfile);

		const fileCache = this.app.metadataCache.getFileCache(tfile);
		// the current file has no frontmatter
		let splitContent = fileContent.split('\n');
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
			await this.writeYamlToFile(splitContent, tfile)
		} else {
			const {
				//@ts-ignore
				position: { start, end },
			} = this.app.metadataCache.getFileCache(tfile)?.frontmatter;
			console.log(this.app.metadataCache.getFileCache(tfile)?.frontmatter)
			console.log(start.line)
			console.log(end.line)

			let addedFrontmatter : string[] = []
			addedFrontmatter.concat(this.buildYaml(addedFrontmatter, headingObj, heading, url))
			console.log(addedFrontmatter)

			let lineCount : number = 0
			for (let line of addedFrontmatter) {
				splitContent.splice(end.line + lineCount, 0, line)
				lineCount++
			}

			await this.writeYamlToFile(splitContent, tfile)
			//const yamlContent = fileContent
			//	.split('\n')
			//	.slice(start.line, end.line)
			//	.join('\n');
			//const parsedYamlContent = parseYaml(yamlContent);
			//console.log(parsedYamlContent);
		}
	}
	async writeYamlToFile(splitContent : string[], tfile: TFile) {
			const newFileContent = splitContent.join('\n');
			await this.app.vault.modify(tfile, newFileContent);
	}

	buildYaml(
		newFrontMatter: string[],
		headingObj: headings,
		heading: string,
		url: string
	): string[] {
		newFrontMatter.push(this.plugin.settings.headingKey + ': ' + heading);
		if (this.plugin.settings.urlKey !== '') {
			newFrontMatter.push(this.plugin.settings.urlKey + ': ' + url);
		}
		if (headingObj.broader.length > 0) {
			newFrontMatter.push(
				this.plugin.settings.broaderKey +
					': [' +
					headingObj.broader.toString() +
					']'
			);
		}
		if (headingObj.narrower.length > 0) {
			newFrontMatter.push(
				this.plugin.settings.narrowerKey +
					': [' +
					headingObj.narrower.toString() +
					']'
			);
		}
		if (headingObj.related.length > 0) {
			newFrontMatter.push(
				this.plugin.settings.relatedKey +
					': [' +
					headingObj.related.toString() +
					']'
			);
		}
		return newFrontMatter;
	}
}
