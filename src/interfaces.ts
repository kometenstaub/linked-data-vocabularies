export interface SKOSSettings {
	elementCounter: string;
	broaderKey: string;
	narrowerKey: string;
	relatedKey: string;
	lcshSearchType: string;
	headingKey: string;
	urlKey: string;
}

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

export interface SuggesterItem {
	display: string; // the heading that is displayed to the user
	url: string; // the URL for getting the necessary data
}
