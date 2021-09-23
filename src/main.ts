import { App, FileSystemAdapter, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { parse } from 'ndjson';
import { createReadStream, ReadStream } from 'fs';

interface LCSHHeadingsSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: LCSHHeadingsSettings = {
	mySetting: 'default'
}


export default class LCSHHeadingsPlugin extends Plugin {
	settings: LCSHHeadingsSettings;

	loadHeadingsData () : void{
		const path = this.getAbsolutePath('lcsh.both.ndjson')
		createReadStream(path)
			.pipe(parse())
			.on('data', function(obj){
			console.log(Object.keys(obj))
		});
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
		relativePath = `${this.app.vault.configDir}/plugins/obsidian-lcsh-headings/${fileName}`;
		// absolute path
		return `${basePath}/${relativePath}`;
	}

	async onload() {
		console.log('loading LCSH plugin');

		await this.loadSettings();

		this.addCommand({
			id: 'read-lcsh-headings-data',
			name: 'Read and log headings data',
			callback: () => {
				this.loadHeadingsData();
			},
			
		});

		this.addSettingTab(new LCSHHeadingsSettingTab(this.app, this));

	}

	onunload() {
		console.log('unloading LCSH plugin')
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class LCSHHeadingsModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}

class LCSHHeadingsSettingTab extends PluginSettingTab {
	plugin: LCSHHeadingsPlugin;

	constructor(app: App, plugin: LCSHHeadingsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'LCSH Headings plugin settings.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue('')
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
