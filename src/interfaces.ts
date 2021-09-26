import type { TFile } from "obsidian";
export interface SKOSSettings {
	testQuery: string;
	elementCounter: string;
	broaderKey: string;
	narrowerKey: string;
	relatedKey: string;
	lcshSearchType: string;
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
    [x: string]: any;
	broader: string[] | null;
	narrower: string[] | null;
	related: string[] | null;
}


// Thank you: https://github.com/OfficerHalf/obsidian-trello/blob/c1340ba43bedb962aadd8f9e8f0106ce59e7017f/src/interfaces.ts#L50
export interface MetaEditApi {
  createYamlProperty: (propertyName: string, propertyValue: string, file: TFile | string) => Promise<void>;
  update: (propertyName: string, propertyValue: string, file: TFile | string) => Promise<void>;
  getPropertyValue: (propertyName: string, file: TFile | string) => Promise<string | undefined>;
  deleteProperty: (propertyName: string, file: TFile | null) => Promise<void>;
}