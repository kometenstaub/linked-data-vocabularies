import { App, Notice, TFile, MarkdownView } from 'obsidian';
import type { headings } from '../interfaces';
import type SKOSPlugin from '../main';

export class WriteMethods {
	app: App;
	plugin: SKOSPlugin;

	constructor(app: App, plugin: SKOSPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	// Thank you for the inspiration: https://github.com/chhoumann/MetaEdit/blob/95e9fc662d170da52a8c83119e174e33dc58276b/src/metaController.ts#L38
	/**
	 * Depending on whether the Shift key is activated, it either starts to build up the YAML for the frontmatter
	 * YAML or inline YAML or use with {@link https://github.com/blacksmithgu/obsidian-dataview | Dataview}
	 * @param headingObj - The object containing all the broader, narrower and related headings from {@link parseSKOS}
	 * @param tfile - The {@link TFile } of the current active {@link MarkdownView}
	 * @param heading - The selected heading from th heading from the SuggesterModal
	 * @param evt - The keys which are pressed down or not of type {@link MouseEvent} or {@link KeyboardEvent}
	 * @param lcc - The LC classification, if present
	 */
	public async writeYaml(
		headingObj: headings,
		tfile: TFile,
		heading: string,
		url: string,
		evt: KeyboardEvent | MouseEvent,
		lcc?: string
	): Promise<void> {
		// the shift key is not activated
		if (!evt.shiftKey) {
			const fileContent: string = await this.app.vault.read(tfile);
			const fileCache = this.app.metadataCache.getFileCache(tfile);
			let splitContent = fileContent.split('\n');
			// if the current file has no frontmatter
			if (!fileCache?.frontmatter) {
				let newFrontMatter: string[] = ['---'];
				if (lcc) {
					newFrontMatter.concat(
						this.buildYaml(
							newFrontMatter,
							headingObj,
							heading,
							url,
							lcc
						)
					);
				} else {
					newFrontMatter.concat(
						this.buildYaml(newFrontMatter, headingObj, heading, url)
					);
				}
				newFrontMatter.push('---');
				const reversedFrontMatter = newFrontMatter.reverse();

				for (let property of reversedFrontMatter) {
					splitContent.unshift(property);
				}
				await this.writeYamlToFile(splitContent, tfile);
			} // the current file has frontmatter
			else {
				// destructures the file cache frontmatter position
				// start is the beggining and should return 0, the end returns
				// the line number of the last ---
				const {
					position: { start, end },
				} = fileCache.frontmatter;

				let addedFrontmatter: string[] = [];
				if (lcc) {
					addedFrontmatter.concat(
						this.buildYaml(
							addedFrontmatter,
							headingObj,
							heading,
							url,
							lcc
						)
					);
				} else {
					addedFrontmatter.concat(
						this.buildYaml(
							addedFrontmatter,
							headingObj,
							heading,
							url
						)
					);
				}

				let lineCount: number = 0;
				for (let line of addedFrontmatter) {
					splitContent.splice(end.line + lineCount, 0, line);
					lineCount++;
				}

				await this.writeYamlToFile(splitContent, tfile);
			}
		} // the shift key is activated
		else if (evt.shiftKey) {
			let newFrontMatter: string[] = [];
			let yaml: string[] = [];
			if (lcc) {
				yaml = this.buildYaml(
					newFrontMatter,
					headingObj,
					heading,
					url,
					lcc
				);
			} else {
				yaml = this.buildYaml(newFrontMatter, headingObj, heading, url);
			}
			let inlineYaml: string = '';
			for (let line of yaml) {
				inlineYaml += line.replace(':', '::') + '\n';
			}
			this.writeInlineYamlToSel(inlineYaml, tfile);
		}
	}

	/**
	 *
	 * @param newFrontMatter - the array to which the YAML lines will be pushed
	 * @param headingObj - the object containing broader, narrower and related headings
	 * @param heading - the heading that was selected in the SuggestModal
	 * @param url - the URL of the heading that was selected in the SuggestModal
	 * @returns - the YAML lines as an array which can then be written to the file
	 */
	buildYaml(
		newFrontMatter: string[],
		headingObj: headings,
		heading: string,
		url: string,
		lcc?: string
	): string[] {
		const { settings } = this.plugin;

		newFrontMatter.push(settings.headingKey + ': ' + heading);
		if (settings.uriKey !== '') {
			newFrontMatter.push(settings.uriKey + ': ' + url);
		}
		if (lcc) {
			if (settings.lccKey !== '') {
				newFrontMatter.push(settings.lccKey + ': ' + lcc);
			}
		}
		/**
		 * It will be zero if there are no headings or when the user chose 0 in the settings,
		 * because {@link LCSHMethods.fillValues} breaks if the number is 0 or at the user defined limit,
		 * so the array with headings will only contain as many heaindgs as the user chose
		 */
		if (headingObj.broader.length > 0) {
			let broaderHeadings: string[] = headingObj.broader;
			broaderHeadings = this.surroundWithQuotes(broaderHeadings);
			newFrontMatter.push(
				this.plugin.settings.broaderKey +
					': [' +
					broaderHeadings.toString() +
					']'
			);
		}
		if (headingObj.narrower.length > 0) {
			let narrowerHeadings: string[] = headingObj.narrower;
			narrowerHeadings = this.surroundWithQuotes(narrowerHeadings);
			newFrontMatter.push(
				this.plugin.settings.narrowerKey +
					': [' +
					narrowerHeadings.toString() +
					']'
			);
		}
		if (headingObj.related.length > 0) {
			let relatedHeadings: string[] = headingObj.related;
			relatedHeadings = this.surroundWithQuotes(relatedHeadings);
			newFrontMatter.push(
				this.plugin.settings.relatedKey +
					': [' +
					relatedHeadings.toString() +
					']'
			);
		}
		return newFrontMatter;
	}
	/**
	 *
	 * @param headingsArray | the array of headings returned from {@link buildYaml}
	 * @returns - an array where each element is surrounded with double quotes
	 */
	surroundWithQuotes(headingsArray: string[]): string[] {
		let newHeadingsArray: string[] = [];
		for (let heading of headingsArray) {
			newHeadingsArray.push('"' + heading + '"');
		}
		return newHeadingsArray;
	}
	/**
	 * Writes the YAML to the currently active file, if it is active.
	 * @param splitContent - the curerntly active file, each line being one array element
	 * @param tfile - the currently active file, @see TFile
	 */
	async writeYamlToFile(splitContent: string[], tfile: TFile): Promise<void> {
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
	writeInlineYamlToSel(inlineYaml: string, tfile: TFile) {
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
