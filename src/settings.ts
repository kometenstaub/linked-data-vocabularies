import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type SKOSPlugin from './main';

export default class SKOSSettingTab extends PluginSettingTab {
	plugin: SKOSPlugin;

	constructor(app: App, plugin: SKOSPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const { settings } = this.plugin

		containerEl.empty();

		containerEl.createEl('h2', {
			text: 'Linked Data Vocabularies (SKOS) settings',
		});

		containerEl.createEl('h3', { text: 'Settings for LCSH' });

		new Setting(containerEl)
			.setName('Element limit')
			.setDesc(
				'The limit of elements that will be displayed when searching for a heading.'
			)
			.addText((text) => {
				text.setPlaceholder('Enter a number greater than 0.')
					.setValue(settings.elementCounter)
					.onChange(async (value) => {
						const num = Number.parseInt(value)

						if (Number.isInteger(num) && num > 0) {
							settings.elementCounter = value;
							await this.plugin.saveSettings();
						} else {
							new Notice('Please enter an integer greater than 0.')
						}
					});
			});

		new Setting(containerEl)
			.setName('Configure sorting order for Modal')
			.setDesc(
				'Choose the search type. \
		Left anchored searches are ordered alphabetically, are case and diacritic insensitive.\
		Keyword searches are in descending relevance order.'
			)
			.addDropdown((dropdown) => {
				dropdown.addOption('keyword', 'Keyword search');
				dropdown.addOption('leftanchored', 'Left anchored search');

				// select the currently saved option
				dropdown.setValue(settings.lcshSearchType);

				dropdown.onChange(async (newValue) => {
					// update and save the plugin settings
					settings.lcshSearchType = newValue;
					await this.plugin.saveSettings();
				});
			});

		// keys for YAML
		new Setting(containerEl)
			.setName('YAML Key for chosen heading')
			//.setDesc('')
			.addText((text) => {
				text.setPlaceholder('related')
					.setValue(settings.headingKey)
					.onChange(async (value) => {
						settings.headingKey = value.trim();
						await this.plugin.saveSettings();
					});
			});
		new Setting(containerEl)
			.setName('YAML Key for URL of chosen heading')
			.setDesc('Leave empty if no URL YAML key should be added.')
			.addText((text) => {
				text.setPlaceholder('related')
					.setValue(settings.urlKey)
					.onChange(async (value) => {
						settings.urlKey = value.trim();
						await this.plugin.saveSettings();
					});
			});
		new Setting(containerEl)
			.setName("YAML Key for 'broader'")
			.setDesc('This will be the YAML key for the broader headings.')
			.addText((text) => {
				text.setPlaceholder('broader')
					.setValue(settings.broaderKey)
					.onChange(async (value) => {
						settings.broaderKey = value.trim();
						await this.plugin.saveSettings();
					});
			});
		new Setting(containerEl)
			.setName("YAML Key for 'narrower'")
			.setDesc('This will be the YAML key for the narrower headings.')
			.addText((text) => {
				text.setPlaceholder('narrower')
					.setValue(settings.narrowerKey)
					.onChange(async (value) => {
						settings.narrowerKey = value.trim();
						await this.plugin.saveSettings();
					});
			});
		new Setting(containerEl)
			.setName("YAML Key for 'related'")
			.setDesc('This will be the YAML key for the related headings.')
			.addText((text) => {
				text.setPlaceholder('related')
					.setValue(settings.relatedKey)
					.onChange(async (value) => {
						settings.relatedKey = value.trim();
						await this.plugin.saveSettings();
					});
			});
		//whether to display and if so, how many
		new Setting(containerEl)
			.setName(`Maximum number of entries for '${settings.broaderKey}'`)
			.setDesc('If set to 0, it will not be added. Leave empty to add all entries.')
			.addText((text) => {
				text.setPlaceholder('')
					.setValue(settings.broaderMax)
					.onChange(async (value) => {
						const num = Number.parseInt(value);
						if ((Number.isInteger(num) && num >= 0) || value === '') {
							settings.broaderMax = value;
							await this.plugin.saveSettings();
						} else {
							new Notice('Please enter an integer greater than or equal to 0.')
						}
					});
			});
		new Setting(containerEl)
			.setName(`Maximum number of entries for '${settings.narrowerKey}'`)
			.setDesc('If set to 0, it will not be added. Leave empty to add all entries.')
			.addText((text) => {
				text.setPlaceholder('')
					.setValue(settings.narrowerMax)
					.onChange(async (value) => {
						const num = Number.parseInt(value);
						if ((Number.isInteger(num) && num >= 0) || value === '') {
							settings.narrowerMax = value;
							await this.plugin.saveSettings();
						} else {
							new Notice('Please enter an integer greater than or equal to 0.')
						}
					});
			});
		new Setting(containerEl)
			.setName(`Maximum number of entries for '${settings.relatedKey}'`)
			.setDesc('If set to 0, it will not be added. Leave empty to add all entries.')
			.addText((text) => {
				text.setPlaceholder('')
					.setValue(settings.relatedMax)
					.onChange(async (value) => {
						const num = Number.parseInt(value);
						if ((Number.isInteger(num) && num >= 0) || value === '') {
							settings.relatedMax = value;
							await this.plugin.saveSettings();
						} else {
							new Notice('Please enter an integer greater than or equal to 0.')
						}
					});
			});
	}
}
