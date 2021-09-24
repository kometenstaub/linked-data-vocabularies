import {
	App,
	FileSystemAdapter,
	Plugin,
	request,
	Setting} from 'obsidian';
import  SKOSSettingTab from './settings';
import { SKOSFuzzyModal, SuggesterItem } from './suggester';

//const link = 'https://id.loc.gov/authorities/subjects/suggest2?q='


interface SKOSSettings {
	elementCounter: string;
}

const DEFAULT_SETTINGS: SKOSSettings = {
	elementCounter: '10',
};

// What suggest2 API method (https://id.loc.gov/techcenter/searching.html) returns as JSON
interface suggest2 {
	q: string;
	count: number;
	pagesize: number;
	start: number;
	sortmethod: string;
	searchtype: string;
	directory: string;
	hits: {
		suggestLabel: string;
		uri: string;
		aLabel: string;
		token: string;
		vLabel: string;
		code: string;
		rank: string;
	}[];
}

export default class SKOSPlugin extends Plugin {
    settings: SKOSSettings;
	plugin: SKOSPlugin;


	async requestHeadingURL(url: string): Promise<Object[]> {
		const response = await request({ url: url });
		const responseObject: {}[] = JSON.parse(response);
		return responseObject;
	}

	// input: heading from FuzzySuggestModal
	// it needs to be called on every keystroke
	async findHeading(heading: string): Promise<void> {

        //@ts-ignore
		let requestObject: RequestParam = {};
        // reading settings doesn't work, it returns undefined
		const counter = this.settings.elementCounter;
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
        const newData : suggest2 = JSON.parse(data)
	//TODO: remove when Modal implemented
        console.log(newData)

		// calculate heading results from received json
		let headings: SuggesterItem[] = [];

		newData["hits"].map((suggestion) => {
			const display = suggestion.suggestLabel;
			const url = suggestion.uri;
			headings.push({ display: display, url: url });
		});
	//TODO: remove when Modal implemented
        console.log(headings)

        // set data for modal
		SKOSFuzzyModal.data = headings;

		// display results


		//tests // that URL would need to be supplied by the user over the modal
		// here it simply takes the first result
		const testURL = headings[0].url + '.json'
		const responseObject = await this.requestHeadingURL(testURL)
	//TODO: remove when Modal implemented
		console.log(responseObject)
		await this.parseSKOS(responseObject)
	}

	async parseSKOS(responseObject : {}[]):Promise<void> {
		let broaderURLs : string[] = []
		let narrowerURLs : string[] = []
		let relatedURLs : string[] = []
		responseObject.map((element : { [key: string ]: string | {}[] | string[] }) => {
			if (element['http://www.w3.org/2004/02/skos/core#broader']) {
				//@ts-expect-error // it also contains strings, but not in what we're looking for
				element['http://www.w3.org/2004/02/skos/core#broader'].map((id) => {
					broaderURLs.push(id['@id'])
				})
			}
			if (element['http://www.w3.org/2004/02/skos/core#narrower']) {
				//@ts-expect-error // it also contains strings, but not in what we're looking for
				element['http://www.w3.org/2004/02/skos/core#narrower'].map((id) => {
					narrowerURLs.push(id['@id'])
				})
			}
			if (element['http://www.w3.org/2004/02/skos/core#related']) {
				//@ts-expect-error // it also contains strings, but not in what we're looking for
				element['http://www.w3.org/2004/02/skos/core#related'].map((id) => {
					relatedURLs.push(id['@id'])
				})
			}
		})
		let broaderHeadings : string[] = []
		let narrowerHeadings : string[] = []
		let relatedHeadings : string[] = []

		broaderURLs.map(async (url) => {
			const responseObject = await this.requestHeadingURL(url + '.json')
			responseObject.map((element : { [key: string ]: string | {}[] | string[] }) => {
				if (element['@id'] === url) {
					//@ts-expect-error
					element['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'].map((nameElement : { [key : string] : string}) => {
						if (nameElement['@language'] === 'en') {
							broaderHeadings.push(nameElement['@value'])
						}
					})
					
				}
			}
		)
	})
		narrowerURLs.map(async (url) => {
			const responseObject = await this.requestHeadingURL(url + '.json')
			responseObject.map((element : { [key: string ]: string | {}[] | string[] }) => {
				if (element['@id'] === url) {
					//@ts-expect-error
					element['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'].map((nameElement : { [key : string] : string}) => {
						if (nameElement['@language'] === 'en') {
							narrowerHeadings.push(nameElement['@value'])
						}
					})
					
				}
			}
		)
	})
		relatedURLs.map(async (url) => {
			const responseObject = await this.requestHeadingURL(url + '.json')
			responseObject.map((element : { [key: string ]: string | {}[] | string[] }) => {
				if (element['@id'] === url) {
					//@ts-expect-error
					element['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'].map((nameElement : { [key : string] : string}) => {
						if (nameElement['@language'] === 'en') {
							relatedHeadings.push(nameElement['@value'])
						}
					})
					
				}
			}
		)
	})
	//TODO: remove when Modal implemented
	console.log(broaderHeadings)
	console.log(narrowerHeadings)
	console.log(relatedHeadings)
}


	async onload() {
		console.log('loading SKOS plugin');

		await this.loadSettings();

		this.addCommand({
			id: 'query-lcsh-data',
			name: 'Query LCSH data',
			callback: () => {
				// doesn't work, returns undefined
				//const chooser = new SKOSFuzzyModal(this.plugin)
				//chooser.setPlaceholder('Enter query')
				//return chooser

				// input name for heading search here, this is just for testing
				// normally it would be supplied over the modal by the user
				this.findHeading('policy')
				
			},
		});


		this.addSettingTab(new SKOSSettingTab(this.app, this));
	}

	onunload() {
		console.log('unloading SKOS plugin');
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
