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
		const { settings } = this.plugin;

		containerEl.empty();

		containerEl.createEl('h2', {
			text: 'Linked Data Vocabularies (SKOS) settings',
		});

		containerEl.createEl('h3', {
			text: 'Settings for Library of Congress Linked Data',
		});

		new Setting(containerEl)
			.setName('Element limit')
			.setDesc(
				'The limit of elements that will be displayed when searching for a heading.'
			)
			.addText((text) => {
				text.setPlaceholder('Enter a number greater than 0.')
					.setValue(settings.elementCounter)
					.onChange(async (value) => {
						const num = Number.parseInt(value);

						if (Number.isInteger(num) && num > 0) {
							settings.elementCounter = value;
							await this.plugin.saveSettings();
						} else {
							new Notice(
								'Please enter an integer greater than 0.'
							);
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
			.setDesc(
				'If set to 0, it will not be added. Leave empty to add all entries.'
			)
			.addText((text) => {
				text.setPlaceholder('')
					.setValue(settings.broaderMax)
					.onChange(async (value) => {
						const num = Number.parseInt(value);
						if (
							(Number.isInteger(num) && num >= 0) ||
							value === ''
						) {
							settings.broaderMax = value;
							await this.plugin.saveSettings();
						} else {
							new Notice(
								'Please enter an integer greater than or equal to 0.'
							);
						}
					});
			});
		new Setting(containerEl)
			.setName(`Maximum number of entries for '${settings.narrowerKey}'`)
			.setDesc(
				'If set to 0, it will not be added. Leave empty to add all entries.'
			)
			.addText((text) => {
				text.setPlaceholder('')
					.setValue(settings.narrowerMax)
					.onChange(async (value) => {
						const num = Number.parseInt(value);
						if (
							(Number.isInteger(num) && num >= 0) ||
							value === ''
						) {
							settings.narrowerMax = value;
							await this.plugin.saveSettings();
						} else {
							new Notice(
								'Please enter an integer greater than or equal to 0.'
							);
						}
					});
			});
		new Setting(containerEl)
			.setName(`Maximum number of entries for '${settings.relatedKey}'`)
			.setDesc(
				'If set to 0, it will not be added. Leave empty to add all entries.'
			)
			.addText((text) => {
				text.setPlaceholder('')
					.setValue(settings.relatedMax)
					.onChange(async (value) => {
						const num = Number.parseInt(value);
						if (
							(Number.isInteger(num) && num >= 0) ||
							value === ''
						) {
							settings.relatedMax = value;
							await this.plugin.saveSettings();
						} else {
							new Notice(
								'Please enter an integer greater than or equal to 0.'
							);
						}
					});
			});

		containerEl.createEl('h4', {
			text: 'Reload required for these changes to take effect.',
		});


		new Setting(containerEl)
			.setName('Add LCSH command')
			.setDesc('Add command to search LC Authorized Subject Headings. Keep this enabled if all commands below are disabled.')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.addLCSH)
					.onChange((state) => {
						this.plugin.settings.addLCSH = state;
						this.plugin.saveSettings();
					});
			});

		containerEl.createEl('hr')
		containerEl.createEl('h4', {
			text: 'Experimental implementation!',
		});
		containerEl.createEl('p', {
			text: "LCC, LCNAF and LCCHO are very different from the Subject Headings. Their implementation is experimental and they don't give BT/NT/RT in most cases, so it is only recommended for librarians.",
		});


		new Setting(containerEl)
			.setName('Add LOC command')
			.setDesc('Add command to search all implemented LOC collections.')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.addAllLoc)
					.onChange((state) => {
						this.plugin.settings.addAllLoc = state;
						this.plugin.saveSettings();
					});
			});

		// setting for global loc parameter
		new Setting(containerEl)
			.setName('Configure LOC filter parameter')
			.setDesc(
				'Pick one of the options that will filter the collections in the LOC search.'
			)
			.addDropdown((dropdown) => {
				dropdown.addOption(':', 'colon');
				dropdown.addOption(';', 'semi-colon');
				dropdown.addOption(',', 'comma');
				dropdown.addOption('.', 'dot');

				// select the currently saved option
				dropdown.setValue(settings.lcshFilterChar);

				dropdown.onChange(async (newValue) => {
					// update and save the plugin settings
					settings.lcshFilterChar = newValue;
					await this.plugin.saveSettings();
				});
			});


		new Setting(containerEl)
			.setName('Add LCC command')
			.setDesc('Add command to search LC Classification.')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.addLCC)
					.onChange((state) => {
						this.plugin.settings.addLCC = state;
						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Add LCNAF command')
			.setDesc('Add command to search LC Name Authority File.')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.addLCNAF)
					.onChange((state) => {
						this.plugin.settings.addLCNAF = state;
						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Add LC Cultural Heritage Organizations command')
			.setDesc('Add command to search LC Cultural Heritage Organizations.')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.addCulHO)
					.onChange((state) => {
						this.plugin.settings.addCulHO = state;
						this.plugin.saveSettings();
					});
			});
	}
}
