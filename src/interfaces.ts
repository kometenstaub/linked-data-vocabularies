import type { TFile } from "obsidian";

export interface SKOSSettings {
	inputFolder: string;
	elementLimit: string;
	broaderKey: string;
	narrowerKey: string;
	relatedKey: string;
	headingKey: string;
	altLabel: string;
	uriKey: string;
	lccKey: string;
	broaderMax: string;
	narrowerMax: string;
	relatedMax: string;
	lcSensitivity: string;
	loadLcsh: boolean;
}

export interface baseSetting {
	name: string;
	description: string;
	value: keyof SKOSSettings;
}

export interface textSetting extends baseSetting {
	placeholder: string;
}

export interface headings {
	broader: string[];
	narrower: string[];
	related: string[];
}

export interface keyValuePairs {
	[key: string]: string | string[];
}

declare module "obsidian" {
	interface App {
		commands: {
			addCommand: any;
			removeCommand: any;
		};
		plugins: {
			plugins: {
				"linked-data-helper": {
					settings: {
						lcshOutputPath: string;
					};
				};
			};
		};
	}
	interface Vault {
		getAvailablePathForAttachments: (
			fileName: string,
			extension?: string,
			currentFile?: TFile
		) => Promise<string>;
		config: {
			attachmentFolderPath: string;
		};
	}
}

export interface passInformation {
	suggestItem: SuggesterItem;
}

export interface SuggesterItem {
	pL: string;
	uri: string;
	aL?: string[]; //altLabel
	bt?: string[]; //broader
	nt?: string[]; // narrower
	rt?: string[]; //related
	note?: string;
	lcc?: string;
}

export interface uriToPrefLabel {
	[key: string]: string;
}
