class Configuration {

	/**
	 * Push the reactive color tokens onto the document root as CSS variables.
	 * Called from App.svelte's $effect block whenever any of the color stores
	 * change. Trimmed port of di's Configuration — the color-variable setter
	 * only, with none of di's engine/constants dependencies.
	 */
	configure_reactive_colors(
		background: string,
		selected: string,
		accent: string,
		hover: string,
		thumb: string,
		track: string,
		focus: string,
		text: string,
		tick: string
	): void {
		const root = document.documentElement.style;
		root.setProperty('--focus-outline', `1.5px solid ${focus}`);
		root.setProperty('--bg',             background);
		root.setProperty('--selected',       selected);
		root.setProperty('--accent',         accent);
		root.setProperty('--hover',          hover);
		root.setProperty('--c-thumb',        thumb);
		root.setProperty('--c-track',        track);
		root.setProperty('--c-focus',        focus);
		root.setProperty('--c-tick',         tick);
		root.setProperty('--text',           text);
	}

}

export const c = new Configuration();
