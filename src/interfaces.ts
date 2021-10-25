export interface SKOSSettings {
	inputFolder: string;
    elementLimit: string;
    broaderKey: string;
    narrowerKey: string;
    relatedKey: string;
    headingKey: string;
    uriKey: string;
    broaderMax: string;
    narrowerMax: string;
    relatedMax: string;
	lcSensitivity: string;
	//loadLcsh: boolean;
    //lcshFilterChar: string;
    addLCSH: boolean;
    //addLCC: boolean;
    //addLCNAF: boolean;
    //addCulHO: boolean;
    //addAllLoc: boolean;
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
//export interface SuggesterItem {
//	display: string; // the heading that is displayed to the user
//	url: string; // the URL for getting the necessary data
//	aLabel: string;
//	vLabel: string;
//	subdivision: boolean;
//}
declare module 'obsidian' {
    interface App {
        commands: {
            addCommand: any;
            removeCommand: any;
        };
		plugins: {
			plugins: {
				'linked-data-helper': {
					settings: {
						lcshOutputPath: string;
					}
				}
			}
		}
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
    aL?: string; //altLabel
    bt?: string[]; //broader
    nt?: string[]; // narrower
    rt?: string[]; //related
    note?: string;
}

export interface uriToPrefLabel {
    [key: string]: string;
}
