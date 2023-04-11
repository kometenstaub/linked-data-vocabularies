import { App, normalizePath, Notice, PluginSettingTab, Setting } from "obsidian";
import type SKOSPlugin from "./main";
import { settingsKeys } from "./constants";
import { maxSettings, simpleSetting } from "./utils";

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

		containerEl.createEl("h2", {
			text: "Linked Data Vocabularies (SKOS) settings",
		});

		new Setting(containerEl)
			.setName("Folder path")
			.setDesc(
				"Please input the path to where the JSON files are stored, relative from the vault root."
			)
			.addText((text) => {
				text.setPlaceholder("Attachments/linked-data-vocabularies/")
					.setValue(settings.inputFolder)
					.onChange(async (value) => {
						settings.inputFolder = normalizePath(value);
						await this.plugin.saveSettings();
					});
			});

		containerEl.createEl("h3", {
			text: "Settings for Library of Congress Linked Data",
		});

		new Setting(containerEl)
			.setName("Element limit")
			.setDesc("The limit of elements that will be displayed when searching for a heading.")
			.addText((text) => {
				text.setPlaceholder("Enter a number greater than 0. Default: 500")
					.setValue(settings.elementLimit)
					.onChange(async (value) => {
						const num = Number.parseInt(value);
						if (Number.isInteger(num) && num > 0) {
							settings.elementLimit = value;
							await this.plugin.saveSettings();
						} else {
							new Notice("Please enter an integer greater than 0.");
						}
					});
			});

		new Setting(containerEl)
			.setName("Sensitivity")
			.setDesc(
				"How good should the matches be? 0 is a perfect match, the smaller it is, worse matches will be included."
			)
			.addText((text) => {
				text.setPlaceholder("Enter a number greater than 0. Default: -10000")
					.setValue(settings.lcSensitivity)
					.onChange(async (value) => {
						const num = Number.parseInt(value);
						if (Number.isInteger(num) && num <= 0) {
							settings.lcSensitivity = value;
							await this.plugin.saveSettings();
						} else {
							new Notice("Please enter an integer smaller or equal to 0.");
						}
					});
			});

		// create the key name settings
		for (const setting of settingsKeys) {
			simpleSetting(containerEl, this.plugin, settings, setting);
		}

		// max number of relations to be added
		maxSettings(containerEl, this.plugin, settings);

		containerEl.createEl("h4", {
			text: "Reload required for these changes to take effect.",
		});

		// new Setting(containerEl)
		// 	.setName('Add LCSH command')
		// 	.setDesc(
		// 		'Add command to search LC Authorized Subject Headings. Keep this enabled, currently only LCSH is re-implemented.'
		// 	)
		// 	.addToggle((toggle) => {
		// 		toggle
		// 			.setValue(this.plugin.settings.addLCSH)
		// 			.onChange(async (state) => {
		// 				this.plugin.settings.addLCSH = state;
		// 				await this.plugin.saveSettings();
		// 			});
		// 	});

		new Setting(containerEl)
			.setName("Load LCSH onload")
			.setDesc(
				"This will increase performance when opening the modal, but will load the data into memory on startup."
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.loadLcsh).onChange(async (state) => {
					this.plugin.settings.loadLcsh = state;
					await this.plugin.saveSettings();
				});
			});
	}
}
