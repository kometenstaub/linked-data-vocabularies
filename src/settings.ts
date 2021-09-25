import { App, PluginSettingTab, Setting } from 'obsidian';
import type SKOSPlugin from './main';

export default class SKOSSettingTab extends PluginSettingTab {
	constructor(app: App, public plugin: SKOSPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'SKOS plugin settings.' });

		containerEl.createEl('h3', { text: 'Settings for LCSH' });

		new Setting(containerEl)
			.setName('Element limit')
			.setDesc(
				'The limit of elements that wil  be displayed when searching for a heading.'
			)
			.addText((text) => {
				text.setPlaceholder('Enter a number greater than 0.')
					.setValue(this.plugin.settings.elementCounter)
					.onChange(async (value) => {
						this.plugin.settings.elementCounter = value;
						this.plugin.saveSettings();
					});
			});
		// TODO: implement sorting for the API

		new Setting(containerEl)
			.setName('Test query')
			.setDesc('Enter a test query')
			.addText((text) => {
				text.setPlaceholder('philosophy')
					.setValue(this.plugin.settings.testQuery)
					.onChange(async (value) => {
						this.plugin.settings.testQuery = value;
						this.plugin.saveSettings();
					});
			});
	}
}
