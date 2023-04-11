import type { Instruction } from 'obsidian';
import type {textSetting, SKOSSettings, baseSetting} from "./interfaces";

export const BASIC_INSTRUCTIONS: Instruction[] = [
	{
		command: 'shift ↵',
		purpose: 'to insert as inline YAML at selection',
	},
	{
		command: '↵',
		purpose: 'to insert as YAML',
	},
];

export const BROWSER_PURPOSE = 'to open in the browser';

export const BASE_URI = 'https://id.loc.gov/authorities/subjects/';


// setting values for key names
export const settingsKeys: textSetting[] = [
	{
		name: "YAML key for chosen heading",
		description: "You cannot leave this empty as the heading always needs to be added.",
		placeholder: "heading",
		value: "headingKey"
	},
	{
		name: "YAML Key for URI of chosen heading",
		description: "Leave empty if no URI YAML key should be added.",
		placeholder: "uri",
		value: "uriKey"
	},
	{
		name: "YAML Key for LC classification of chosen heading",
		description: "Leave empty if no LCC YAML key should be added.",
		placeholder: "lcc",
		value: "lccKey"
	},
	{
		name: "YAML Key for 'broader'",
		description: "This will be the YAML key for the broader headings.",
		placeholder: "broader",
		value: "broaderKey"
	},
	{
		name: "YAML Key for 'narrower'",
		description: "This will be the YAML key for the narrower headings.",
		placeholder: "narrower",
		value: "narrowerKey"
	},
	{
		name: "YAML Key for 'narrower'",
		description: "This will be the YAML key of the related headings.",
		placeholder: "related",
		value: "relatedKey"
	},
]

// setting values for limits
export function settingsMax(settings: SKOSSettings): baseSetting[] {
	return [
		{
			name: `Maximum number of entries for ${settings.broaderKey}`,
			description: "If set to 0, it will not be added. Leave empty to add all entries.",
			value: "broaderMax"
		},
		{
			name: `Maximum number of entries for ${settings.narrowerKey}`,
			description: "If set to 0, it will not be added. Leave empty to add all entries.",
			value: "narrowerMax"
		},
		{
			name: `Maximum number of entries for ${settings.relatedKey}`,
			description: "If set to 0, it will not be added. Leave empty to add all entries.",
			value: "relatedMax"
		},
	]
}