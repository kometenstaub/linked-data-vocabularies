import {
	App,
	normalizePath,
	Notice,
	PluginSettingTab,
	Setting,
} from 'obsidian';
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

		new Setting(containerEl)
			.setName('Folder path')
			.setDesc(
				'Please input the path to where the JSON files are stored, relative from the vault root.'
			)
			.addText((text) => {
				text.setPlaceholder('Attachments/linked-data-vocabularies/')
					.setValue(settings.inputFolder)
					.onChange(async (value) => {
						settings.inputFolder = normalizePath(value);
						await this.plugin.saveSettings();
					});
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
				text.setPlaceholder(
					'Enter a number greater than 0. Default: 500'
				)
					.setValue(settings.elementLimit)
					.onChange(async (value) => {
						const num = Number.parseInt(value);
						if (Number.isInteger(num) && num > 0) {
							settings.elementLimit = value;
							await this.plugin.saveSettings();
						} else {
							new Notice(
								'Please enter an integer greater than 0.'
							);
						}
					});
			});

		new Setting(containerEl)
			.setName('Sensitivity')
			.setDesc(
				'How good should the matches be? 0 is a perfect match, the smaller it is, worse matches will be included.'
			)
			.addText((text) => {
				text.setPlaceholder(
					'Enter a number greater than 0. Default: -10000'
				)
					.setValue(settings.lcSensitivity)
					.onChange(async (value) => {
						const num = Number.parseInt(value);
						if (Number.isInteger(num) && num <= 0) {
							settings.lcSensitivity = value;
							await this.plugin.saveSettings();
						} else {
							new Notice(
								'Please enter an integer smaller or equal to 0.'
							);
						}
					});
			});


		// keys for YAML
		new Setting(containerEl)
			.setName('YAML Key for chosen heading')
			//.setDesc('')
			.addText((text) => {
				text.setPlaceholder('heading')
					.setValue(settings.headingKey)
					.onChange(async (value) => {
						settings.headingKey = value.trim();
						await this.plugin.saveSettings();
					});
			});
		new Setting(containerEl)
			.setName('YAML Key for URI of chosen heading')
			.setDesc('Leave empty if no URI YAML key should be added.')
			.addText((text) => {
				text.setPlaceholder('uri')
					.setValue(settings.uriKey)
					.onChange(async (value) => {
						settings.uriKey = value.trim();
						await this.plugin.saveSettings();
					});
			});
		new Setting(containerEl)
			.setName('YAML Key for LC classification of chosen heading')
			.setDesc('Leave empty if no LCC YAML key should be added.')
			.addText((text) => {
				text.setPlaceholder('lcc')
					.setValue(settings.lccKey)
					.onChange(async (value) => {
						settings.lccKey = value.trim();
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
				'If set to 0, it will not be added. Leave empty to add all entres.'
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
			.setDesc(
				'Add command to search LC Authorized Subject Headings. Keep this enabled, currently only LCSH is re-implemented.'
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.addLCSH)
					.onChange((state) => {
						this.plugin.settings.addLCSH = state;
						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('Load LCSH onload.')
			.setDesc(
				'This will increase performance when opening the modal, but will load the data into memory on startup.'
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.loadLcsh)
					.onChange((state) => {
						this.plugin.settings.loadLcsh = state;
						this.plugin.saveSettings();
					});
			});
	}
}
