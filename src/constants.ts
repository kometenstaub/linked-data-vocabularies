import type { Instruction } from 'obsidian';

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
