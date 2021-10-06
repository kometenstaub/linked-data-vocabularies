import {
	App,
	Notice,
	request,
	RequestParam,
} from 'obsidian';
import type SKOSPlugin from '../main';
import type { headings, suggest2, returnObjectLcsh, HTTPIDLOCGovOntologiesRecordInfoLanguageOfCataloging, SuggesterItem} from '../interfaces';
import {
	BROADER_URL,
	NARROWER_URL,
	RELATED_URL,
	PREF_LABEL,
	SUBJECT_HEADINGS,
	SUBDIVISIONS,
	LC_CLASSIFICATION,
	LCNAF,
	CULTURAL_HER_ORGANIZATIONS,
} from '../constants';

export class LCSHMethods {
	app: App;
	plugin: SKOSPlugin;

	constructor(app: App, plugin: SKOSPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Gets the object which is needed to iterate over the headings
	 * @param url - the URL that is requested -> are all of this format: http://id.loc.gov/authorities/subjects/sh85055634
	 * @returns - a responseObject in form of {@link returnObjectLcsh[]}
	 */
	private async requestHeadingURL(url: string): Promise<returnObjectLcsh[]> {
		url = url.replace(/^https?:\/\//, 'https://');
		const requestObj: RequestParam = { url: url };
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
	public async findHeading(
		heading: string,
		methodOf: string
	): Promise<SuggesterItem[]> {
		let requestObject: RequestParam = {
			url: '',
		};

		let counter = '';
		if (parseInt(this.plugin.settings.elementCounter)) {
			counter = this.plugin.settings.elementCounter;
		} else {
			new Notice(
				'The maximum number of elements to be shown is not an integer.'
			);
			throw Error(
				'The maximum number of elements to be shown is not an integer.'
			);
		}
		const searchType = this.plugin.settings.lcshSearchType;
		const encodedHeading = encodeURIComponent(heading);
		let url: string = '';
		let urlEnd = '&counter=' + encodeURIComponent(counter);
		urlEnd += '&searchtype=' + encodeURIComponent(searchType);
		if (methodOf === '') {
			url =
				`https://id.loc.gov/authorities/subjects/suggest2?q=` +
				encodedHeading;
			url += '&counter=' + encodeURIComponent(counter);
			url += '&searchtype=' + encodeURIComponent(searchType);
		} else {
			switch (methodOf) {
				case SUBJECT_HEADINGS:
					url =
						`https://id.loc.gov/authorities/subjects/suggest2?q=` +
						encodedHeading;
					url += urlEnd;
					url += '&memberOf=' + methodOf;
					break;
				case SUBDIVISIONS:
					url =
						`https://id.loc.gov/authorities/subjects/suggest2?q=` +
						encodedHeading;
					url += urlEnd;
					url += '&memberOf=' + methodOf;
					break;
				case LC_CLASSIFICATION:
					url =
						`https://id.loc.gov/authorities/classification/suggest2?q=` +
						encodedHeading;
					url += urlEnd;
					break;
				case LCNAF:
					url =
						`https://id.loc.gov/authorities/names/suggest2?q=` +
						encodedHeading;
					url += urlEnd;
					break;
				case CULTURAL_HER_ORGANIZATIONS:
					url =
						`https://id.loc.gov/vocabulary/organizations/suggest2?q=` +
						encodedHeading;
					url += urlEnd;
					break;
				default:
					url =
						`https://id.loc.gov/authorities/subjects/suggest2?q=` +
						encodedHeading;
					url += urlEnd;
			}
		}
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
			if (formerHeading === display) {
				subdivision = true;
			}
			formerHeading = display;
			const aLabel = suggestion.aLabel; // authoritative label
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

}
