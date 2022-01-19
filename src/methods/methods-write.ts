import { App, Notice, TFile, MarkdownView } from 'obsidian';
import type { extraKeys, headings, keyValuePairs } from '../interfaces';
import type SKOSPlugin from '../main';

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
		//@ts-expect-error This type is finer and passed into a broader type
		await this.writeYaml(tfile, evt, keys, headingObj);
	}

	// Thank you for the inspiration: https://github.com/chhoumann/MetaEdit/blob/95e9fc662d170da52a8c83119e174e33dc58276b/src/metaController.ts#L38
	/**
	 * Depending on whether the Shift key is activated, it either starts to build up the YAML for the frontmatter
	 * YAML or inline YAML for use with {@link https://github.com/blacksmithgu/obsidian-dataview | Dataview}
	 * @param moreKeys - The object with additional keys
	 * @param tfile - The {@link TFile } of the current active {@link MarkdownView}
	 * @param evt - The keys which are pressed down or not of type {@link MouseEvent} or {@link KeyboardEvent}
	 * @param keys - The key-value pairs that are added to the YAML
	 */
	private async writeYaml(
		tfile: TFile,
		evt: KeyboardEvent | MouseEvent,
		keys: keyValuePairs,
		// will be made optional in the future for other vocabs that don't have BT/NT/RT relations
		moreKeys: extraKeys
	): Promise<void> {
		// the shift key is not activated
		if (!evt.shiftKey) {
			const fileContent: string = await this.app.vault.read(tfile);
			const fileCache = this.app.metadataCache.getFileCache(tfile);
			const splitContent = fileContent.split('\n');
			// if the current file has no frontmatter
			if (!fileCache?.frontmatter) {
				const newFrontMatter: string[] = ['---'];
				newFrontMatter.concat(
					this.buildYaml(newFrontMatter, keys, moreKeys)
				);
				newFrontMatter.push('---');
				const reversedFrontMatter = newFrontMatter.reverse();

				for (const property of reversedFrontMatter) {
					splitContent.unshift(property);
				}
				await this.writeYamlToFile(splitContent, tfile);
			} // the current file has frontmatter
			else {
				// destructures the file cache frontmatter position
				// start is the beginning and should return 0, the end returns
				// the line number of the last ---
				const {
					position: { start, end },
				} = fileCache.frontmatter;

				let addedFrontmatter: string[] = [];
				addedFrontmatter.concat(
					this.buildYaml(addedFrontmatter, keys, moreKeys)
				);

				let lineCount = 0;
				for (const line of addedFrontmatter) {
					splitContent.splice(end.line + lineCount, 0, line);
					lineCount++;
				}

				await this.writeYamlToFile(splitContent, tfile);
			}
		} // the shift key is activated
		else if (evt.shiftKey) {
			const newFrontMatter: string[] = [];
			const yaml: string[] = this.buildYaml(newFrontMatter, keys, moreKeys);
			let inlineYaml: string = '';
			for (const line of yaml) {
				inlineYaml += line.replace(':', '::') + '\n';
			}
			this.writeInlineYamlToSel(inlineYaml, tfile);
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
		headingObj?: extraKeys
	): string[] {
		for (const [key, value] of Object.entries(keys)) {
			newFrontMatter.push(key + ': ' + value);
		}
		if (headingObj !== undefined) {
			return this.addHeadings(headingObj, newFrontMatter);
		} else {
			return newFrontMatter;
		}
	}

	private addHeadings(headingObject: extraKeys, newFrontMatter: string[]) {
		const { settings } = this.plugin;
		/**
		 * It will be zero if there are no headings or when the user chose 0 in the settings,
		 * because {@link LCSHMethods.resolveUris} breaks if the number is 0 or at the user defined limit,
		 * so the array with headings will only contain as many headings as the user chose
		 */
		const headingObj = headingObject as unknown as headings;
		if (headingObj.broader.length > 0) {
			let broaderHeadings: string[] = headingObj.broader;
			broaderHeadings = this.surroundWithQuotes(broaderHeadings);
			newFrontMatter.push(
				settings.broaderKey + ': [' + broaderHeadings.toString() + ']'
			);
		}
		if (headingObj.narrower.length > 0) {
			let narrowerHeadings: string[] = headingObj.narrower;
			narrowerHeadings = this.surroundWithQuotes(narrowerHeadings);
			newFrontMatter.push(
				settings.narrowerKey + ': [' + narrowerHeadings.toString() + ']'
			);
		}
		if (headingObj.related.length > 0) {
			let relatedHeadings: string[] = headingObj.related;
			relatedHeadings = this.surroundWithQuotes(relatedHeadings);
			newFrontMatter.push(
				settings.relatedKey + ': [' + relatedHeadings.toString() + ']'
			);
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
	 * Writes the YAML to the currently active file, if it is active.
	 * @param splitContent - the currently active file, each line being one array element
	 * @param tfile - the currently active file, @see TFile
	 */
	private async writeYamlToFile(
		splitContent: string[],
		tfile: TFile
	): Promise<void> {
		const newFileContent = splitContent.join('\n');
		if (this.app.workspace.getActiveFile() === tfile) {
			await this.app.vault.modify(tfile, newFileContent);
		} else {
			new Notice(
				'You switched to another file before the content could be written.'
			);
		}
	}

	/**
	 * Insert the inline YAML at the current cursor position, if the file from the beginning is still active.
	 * @param inlineYaml - the inline YAML as string
	 * @param tfile - the currently active file, @see TFile
	 */
	private writeInlineYamlToSel(inlineYaml: string, tfile: TFile) {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (this.app.workspace.getActiveFile() === tfile) {
			const activeEditor = activeView?.editor;
			const editorRange = activeEditor?.getCursor('from');
			if (typeof editorRange !== 'undefined') {
				activeEditor?.replaceRange(inlineYaml, editorRange);
			} else {
				new Notice('Your cursor is not anymore in the same file.');
			}
		}
	}
}
