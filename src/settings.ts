import { App, PluginSettingTab, Setting } from 'obsidian';
import SKOSPlugin from './main';


export default class SKOSSettingTab extends PluginSettingTab {
	plugin: SKOSPlugin;

	constructor(app: App, plugin: SKOSPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'SKOS plugin settings.' });

		containerEl.createEl('h3', { text: 'Settings for LCSH' });

		new Setting(containerEl)
			.setName('Element limit')
			.setDesc(
				'The limit of elements that wil  be displayed when searching for a heading.'
			)
			.addText((text) => {
				text
					.setPlaceholder('Enter a number greater than 0.')
					.setValue(this.plugin.settings.elementCounter)
					.onChange(async (value) => {
						this.plugin.settings.elementCounter = value;
						this.plugin.saveSettings();
					})
                }
			);
	}
}