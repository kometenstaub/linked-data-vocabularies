export interface SKOSSettings {
	elementCounter: string;
	broaderKey: string;
	narrowerKey: string;
	relatedKey: string;
	lcshSearchType: string;
	headingKey: string;
	urlKey: string;
	broaderMax: string;
	narrowerMax: string;
	relatedMax: string;
}

/**
 * Represents the data which the Suggest2 Library of Congress API returns
 * {@link https://id.loc.gov/techcenter/searching.html} 
 */

export interface suggest2 {
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

export interface headings {
	broader: string[];
	narrower: string[];
	related: string[];
}

/**
 * Represents the data which is passed to {@link SKOSModal.renderSuggestion } after having called the {@link suggest2 | Suggest2 API}
 * from within {@link SKOSModal.async updateSuggestions}
 */
export interface SuggesterItem {
	display: string; // the heading that is displayed to the user
	url: string; // the URL for getting the necessary data
	aLabel: string;
	vLabel: string;
}
