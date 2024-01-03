import { Notice, Setting } from "obsidian";
import type { SKOSSettings, textSetting } from "./interfaces";
import type SKOSPlugin from "./main";
import { settingsMax } from "./constants";

/**
 *
 * @param containerEl of the settings
 * @param plugin the plugin
 * @param settings the plugin settings
 * @param input the array which contains the necessary values
 */
export function simpleSetting(
	containerEl: HTMLElement,
	plugin: SKOSPlugin,
	settings: SKOSSettings,
	input: textSetting,
): void {
	new Setting(containerEl)
		.setName(input.name)
		.setDesc(input.description)
		.addText((text) => {
			text.setPlaceholder(input.placeholder)
				.setValue(settings[input.value] as string)
				.onChange(async (value) => {
					(settings[input.value] as string) = value.trim();
					await plugin.saveSettings();
				});
		});
}

export function maxSettings(
	containerEl: HTMLElement,
	plugin: SKOSPlugin,
	settings: SKOSSettings,
): void {
	const entries = settingsMax(settings);
	for (const entry of entries) {
		//whether to display and if so, how many
		new Setting(containerEl)
			.setName(entry.name)
			.setDesc(entry.description)
			.addText((text) => {
				text.setPlaceholder("")
					.setValue(settings[entry.value] as string)
					.onChange(async (value) => {
						const num = Number.parseInt(value);
						if ((Number.isInteger(num) && num >= 0) || value === "") {
							(settings[entry.value] as string) = value;
							await plugin.saveSettings();
						} else {
							new Notice("Please enter an integer greater than or equal to 0.");
						}
					});
			});
	}
}
