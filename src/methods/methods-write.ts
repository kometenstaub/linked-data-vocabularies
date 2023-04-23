import { App, Notice, TFile, MarkdownView } from "obsidian";
import type { headings, keyValuePairs } from "../interfaces";
import type SKOSPlugin from "../main";
import {settingsKeys} from "../constants";

export class WriteMethods {
	app: App;
	plugin: SKOSPlugin;

	constructor(app: App, plugin: SKOSPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	public async writeLocYaml(
		tfile: TFile,
		evt: KeyboardEvent | MouseEvent,
		keys: keyValuePairs,
		headingObj: headings
	): Promise<void> {
		await this.writeYaml(tfile, evt, keys, headingObj);
	}

	// An earlier version of this code was based on: https://github.com/chhoumann/MetaEdit/blob/95e9fc662d170da52a8c83119e174e33dc58276b/src/metaController.ts#L38
	/**
	 * Depending on whether the Shift key is activated, it either starts to build up the YAML for the frontmatter
	 * YAML or inline YAML for use with {@link https://github.com/blacksmithgu/obsidian-dataview | Dataview}
	 * @param tfile - The {@link TFile } of the current active {@link MarkdownView}
	 * @param evt - The keys which are pressed down or not of type {@link MouseEvent} or {@link KeyboardEvent}
	 * @param keys - The key-value pairs that are added to the YAML
	 * @param moreKeys - The object with the headings
	 */
	private async writeYaml(
		tfile: TFile,
		evt: KeyboardEvent | MouseEvent,
		keys: keyValuePairs,
		// will be made optional in the future for other vocabs that don't have BT/NT/RT relations
		moreKeys: headings
	): Promise<void> {
		// the shift key is not activated
		if (!evt.shiftKey) {
			await this.app.fileManager.processFrontMatter(tfile, (frontmatter) => {
				const { settings } = this.plugin
				frontmatter[settings.headingKey] = undefined;
				frontmatter[settings.uriKey] = undefined;
				frontmatter[settings.lccKey] = undefined;
				frontmatter[settings.broaderKey] = undefined;
				frontmatter[settings.narrowerKey] = undefined;
				frontmatter[settings.relatedKey] = undefined;
			})
			await this.app.fileManager.processFrontMatter(tfile, (frontMatter) => {
				for (const [key, value] of Object.entries(keys)) {
					frontMatter[key] = value;
				}
				if (moreKeys.broader.length > 0) {
					frontMatter[this.plugin.settings.broaderKey] = moreKeys.broader;
				}
				if (moreKeys.narrower.length > 0) {
					frontMatter[this.plugin.settings.narrowerKey] = moreKeys.narrower;
				}
				if (moreKeys.related.length > 0) {
					frontMatter[this.plugin.settings.relatedKey] = moreKeys.related;
				}
			});
		} // the shift key is activated
		else if (evt.shiftKey) {
			const newFrontMatter: string[] = [];
			const yaml: string[] = this.buildYaml(newFrontMatter, keys, moreKeys);
			this.writeInlineYamlToSel(yaml.join("\n"), tfile);
		}
	}

	/**
	 *
	 * @param newFrontMatter - the array to which the YAML lines will be pushed
	 * @param headingObj - the object containing broader, narrower and related headings
	 * @param keys - The key-value pairs that are added to the YAML
	 * @returns - the YAML lines as an array which can then be written to the file
	 */
	private buildYaml(
		newFrontMatter: string[],
		keys: keyValuePairs,
		headingObj?: headings
	): string[] {
		for (const [key, value] of Object.entries(keys)) {
			if (key === this.plugin.settings.altLabel) {
				const newValue = this.surroundWithQuotes(value as string[])
				newFrontMatter.push(key + ":: " + `[${newValue}]`);
			} else {
				newFrontMatter.push(key + ":: " + `"${value}"`);
			}
		}
		if (headingObj) {
			return this.addHeadings(headingObj, newFrontMatter);
		} else {
			return newFrontMatter;
		}
	}

	private addHeadings(headingObject: headings, newFrontMatter: string[]) {
		const { settings } = this.plugin;
		/**
		 * It will be zero if there are no headings or when the user chose 0 in the settings,
		 * because {@link LCSHMethods.resolveUris} breaks if the number is 0 or at the user defined limit,
		 * so the array with headings will only contain as many headings as the user chose
		 */
		if (headingObject.broader.length > 0) {
			let broaderHeadings = headingObject.broader;
			broaderHeadings = this.surroundWithQuotes(broaderHeadings);
			newFrontMatter.push(settings.broaderKey + ":: [" + broaderHeadings.toString() + "]");
		}
		if (headingObject.narrower.length > 0) {
			let narrowerHeadings = headingObject.narrower;
			narrowerHeadings = this.surroundWithQuotes(narrowerHeadings);
			newFrontMatter.push(settings.narrowerKey + ":: [" + narrowerHeadings.toString() + "]");
		}
		if (headingObject.related.length > 0) {
			let relatedHeadings = headingObject.related;
			relatedHeadings = this.surroundWithQuotes(relatedHeadings);
			newFrontMatter.push(settings.relatedKey + ":: [" + relatedHeadings.toString() + "]");
		}
		return newFrontMatter;
	}

	/**
	 *
	 * @param headingsArray | the array of headings returned from {@link buildYaml}
	 * @returns - an array where each element is surrounded with double quotes
	 */
	private surroundWithQuotes(headingsArray: string[]): string[] {
		const newHeadingsArray: string[] = [];
		for (const heading of headingsArray) {
			newHeadingsArray.push('"' + heading + '"');
		}
		return newHeadingsArray;
	}

	/**
	 * Insert the inline YAML at the current cursor position, if the file from the beginning is still active.
	 * @param inlineYaml - the inline YAML as string
	 * @param tfile - the currently active file, @see TFile
	 */
	private writeInlineYamlToSel(inlineYaml: string, tfile: TFile) {
		const ed = this.app.workspace.activeEditor;
		if (ed?.editor) {
			const editorRange = ed.editor.getCursor("from");
			if (editorRange) {
				ed.editor.replaceRange(inlineYaml, editorRange);
			} else {
				new Notice("Your cursor is not anymore in the same file.");
			}
		}
	}
}
