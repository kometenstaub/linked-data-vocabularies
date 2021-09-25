import { request, RequestParam, Setting } from 'obsidian';
import { SKOSFuzzyModal, SuggesterItem } from './suggester';
import type SKOSPlugin from './main';
import type { suggest2 } from './interfaces';

export class LCSHMethods {
	constructor(public plugin: SKOSPlugin) {}

	private async requestHeadingURL(url: string): Promise<Object[]> {
		const response = await request({ url: url });
		const responseObject: {}[] = JSON.parse(response);
		return responseObject;
	}

	// input: heading from FuzzySuggestModal
	// it needs to be called on every keystroke
	public async findHeading(heading: string): Promise<void> {
		//@ts-ignore
		let requestObject: RequestParam = {};
		// reading settings doesn't work, it returns undefined
		const counter = this.plugin.settings.elementCounter;
		const encodedHeading = encodeURIComponent(heading);
		let url: string =
			'https://id.loc.gov/authorities/subjects/suggest2?q=' +
			encodedHeading;
		url += '&counter=' + counter;
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
		SKOSFuzzyModal.data = headings;

		// display results

		//tests // that URL would need to be supplied by the user over the modal
		// here it simply takes the first result
		const testURL = headings[0].url + '.json';
		const chosenHeading = headings[0].display;
		const responseObject = await this.requestHeadingURL(testURL);
		//TODO: remove when Modal implemented
		console.log(responseObject);
		await this.parseSKOS(responseObject);
	}

	private async parseSKOS(responseObject: {}[]): Promise<void> {
		let broaderURLs: string[] = [];
		let narrowerURLs: string[] = [];
		let relatedURLs: string[] = [];
		responseObject.map(
			(element: { [key: string]: string | {}[] | string[] }) => {
				if (element['http://www.w3.org/2004/02/skos/core#broader']) {
					//@ts-expect-error // it also contains strings, but not in what we're looking for
					element['http://www.w3.org/2004/02/skos/core#broader'].map(
					//@ts-expect-error // it also contains strings, but not in what we're looking for
						(id) => {
							broaderURLs.push(id['@id']);
						}
					);
				}
				if (element['http://www.w3.org/2004/02/skos/core#narrower']) {
					//@ts-expect-error // it also contains strings, but not in what we're looking for
					element['http://www.w3.org/2004/02/skos/core#narrower'].map(
					//@ts-expect-error // it also contains strings, but not in what we're looking for
						(id) => {
							narrowerURLs.push(id['@id']);
						}
					);
				}
				if (element['http://www.w3.org/2004/02/skos/core#related']) {
					//@ts-expect-error // it also contains strings, but not in what we're looking for
					element['http://www.w3.org/2004/02/skos/core#related'].map(
					//@ts-expect-error // it also contains strings, but not in what we're looking for
						(id) => {
							relatedURLs.push(id['@id']);
						}
					);
				}
			}
		);
		let broaderHeadings: string[] = [];
		let narrowerHeadings: string[] = [];
		let relatedHeadings: string[] = [];

		broaderURLs.map(async (url) => {
			const responseObject = await this.requestHeadingURL(url + '.json');
			responseObject.map(
			//@ts-ignore
				(element: { [key: string]: string | {}[] | string[] }) => {
					if (element['@id'] === url) {
						element[
							'http://www.loc.gov/mads/rdf/v1#authoritativeLabel'
						//@ts-expect-error
						].map((nameElement: { [key: string]: string }) => {
							if (nameElement['@language'] === 'en') {
								broaderHeadings.push(nameElement['@value']);
							}
						});
					}
				}
			);
		});
		narrowerURLs.map(async (url) => {
			const responseObject = await this.requestHeadingURL(url + '.json');
			responseObject.map(
			//@ts-ignore
				(element: { [key: string]: string | {}[] | string[] }) => {
					if (element['@id'] === url) {
						element[
							'http://www.loc.gov/mads/rdf/v1#authoritativeLabel'
						//@ts-expect-error
						].map((nameElement: { [key: string]: string }) => {
							if (nameElement['@language'] === 'en') {
								narrowerHeadings.push(nameElement['@value']);
							}
						});
					}
				}
			);
		});
		relatedURLs.map(async (url) => {
			const responseObject = await this.requestHeadingURL(url + '.json');
			responseObject.map(
			//@ts-ignore
				(element: { [key: string]: string | {}[] | string[] }) => {
					if (element['@id'] === url) {
						element[
							'http://www.loc.gov/mads/rdf/v1#authoritativeLabel'
						//@ts-expect-error
						].map((nameElement: { [key: string]: string }) => {
							if (nameElement['@language'] === 'en') {
								relatedHeadings.push(nameElement['@value']);
							}
						});
					}
				}
			);
		});
		//TODO: remove when Modal implemented
		console.log('broader:');
		console.log(broaderHeadings);
		console.log('narrower:');
		console.log(narrowerHeadings);
		console.log('related:');
		console.log(relatedHeadings);
	}
}
