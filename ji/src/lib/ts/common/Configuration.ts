import { k } from './Constants';

class Configuration {

	/**
	 * Push the stacking-layer numbers onto the document root as CSS variables,
	 * so plain stylesheets (main.css) can read them with var(...). Called once at
	 * startup — the numbers are static. This is the bridge that lets CSS use the
	 * values that live in Constants (CSS can't import a TypeScript module).
	 */
	configure_layers(): void {
		const root = document.documentElement.style;
		root.setProperty('--z-common',       `${k.layer.common}`);
		root.setProperty('--z-hideable',     `${k.layer.hideable}`);
		root.setProperty('--z-controls',     `${k.layer.controls}`);
		root.setProperty('--z-intersection', `${k.layer.intersection}`);
	}

	/**
	 * Push the static layout sizes onto the document root as CSS variables — the
	 * frame's inset/gap and the corner radius — so any stylesheet reads them from
	 * one place instead of the frame passing them down per element. Called once at
	 * startup alongside the layers.
	 */
	configure_metrics(): void {
		const root = document.documentElement.style;
		root.setProperty('--l-gap',           `${k.gap.intersection}px`);
		root.setProperty('--radius',          `${k.radius.corner.main}px`);
		root.setProperty('--gap-details',     `${k.gap.details}px`);
		root.setProperty('--gap-preferences', `${k.gap.preferences}px`);
		root.setProperty('--radius-banner',   `${k.radius.corner.banner}px`);
		root.setProperty('--radius-build',    `${k.radius.corner.build}px`);
		root.setProperty('--radius-pill',     `${k.radius.corner.pill}px`);
		root.setProperty('--radius-percent',  `${k.radius.percent}%`);
		root.setProperty('--h-banner',        `${k.height.banner}px`);
		root.setProperty('--h-build',         `${k.height.build}px`);
		root.setProperty('--h-hideable',      `${k.height.hideable}px`);
		root.setProperty('--h-pill',          `${k.height.pill}px`);
		root.setProperty('--size-button',     `${k.size.button}px`);
	}

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
