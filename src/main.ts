import {
	App,
	FileSystemAdapter,
	Modal,
	Plugin,
	PluginSettingTab,
	request,
	Setting,
} from 'obsidian';
import { parse } from 'ndjson';
import { createReadStream, writeFileSync } from 'fs';

const link = 'https://id.loc.gov/authorities/label/';

let headings = new Set();

interface LCSHSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: LCSHSettings = {
	mySetting: 'default',
};

export default class LCSHPlugin extends Plugin {
	settings: LCSHSettings;

	loadHeadingsData(): void {
		const path = this.getAbsolutePath('lcsh.skos.ndjson');
		createReadStream(path)
			.pipe(parse())
			.on('data', function (obj) {
				obj['@graph'].map(
					(element: { [x: string]: { [y: string]: string } }) => {
						try {
							if (
								element['skos:prefLabel']['@language'] === 'en'
							) {
								headings.add(
									element['skos:prefLabel']['@value']
								);
							}
						} catch {
							//console.log('error')
						}
					}
				);
			});
		console.log(headings);
		//const writeSetPath = this.getAbsolutePath('set.json');
		//const json = JSON.stringify(Array.from(headings), null, 2);
		//writeFileSync(writeSetPath, json);
	}

	getHeading(input: string): string {
		const iterator = headings.values();
		for (let heading in iterator.next()) {
			if (heading.includes(input)) {
				return heading;
			}
		}
	}

	async requestJSON(heading: string): Promise<void> {
		const url = link + encodeURIComponent(heading);
		const json = await request({ url: url });
	}

	getAbsolutePath(fileName: string): string {
		let basePath;
		let relativePath;
		// base path
		if (this.app.vault.adapter instanceof FileSystemAdapter) {
			basePath = (
				this.app.vault.adapter as FileSystemAdapter
			).getBasePath();
		} else {
			throw new Error('Cannot determine base path.');
		}
		// relative path
		relativePath = `${this.app.vault.configDir}/plugins/obsidian-lcsh/${fileName}`;
		// absolute path
		return `${basePath}/${relativePath}`;
	}

	async onload() {
		console.log('loading LCSH plugin');

		await this.loadSettings();

		this.addCommand({
			id: 'read-lcsh-data',
			name: 'Read and log headings data',
			callback: () => {
				this.loadHeadingsData();
			},
		});

		this.addSettingTab(new LCSHSettingTab(this.app, this));
	}

	onunload() {
		console.log('unloading LCSH plugin');
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

class LCSHModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}

class LCSHSettingTab extends PluginSettingTab {
	plugin: LCSHPlugin;

	constructor(app: App, plugin: LCSHPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'LCSH Headings plugin settings.' });

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder('Enter your secret')
					.setValue('')
					.onChange(async (value) => {
						console.log('Secret: ' + value);
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
