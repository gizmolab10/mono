import { k } from './Constants';
import { colors } from '../utilities/Colors';

class Configuration {

	/**
	 * Push the stacking-layer numbers onto the document root as CSS variables,
	 * so plain stylesheets (main.css) can read them with var(...). Called once at
	 * startup — the numbers are static. This is the bridge that lets CSS use the
	 * values that live in Constants (CSS can't import a TypeScript module).
	 */
	configure_layers(): void {
		const root = document.documentElement.style;
		root.setProperty('--z-common',           `${k.layer.common}`);
		root.setProperty('--z-hideable',         `${k.layer.hideable}`);
		root.setProperty('--z-controls',         `${k.layer.controls}`);
		root.setProperty('--z-frontmost',        `${k.layer.frontmost}`);
	}

	/**
	 * Push the static layout sizes onto the document root as CSS variables — the
	 * frame's inset/gap and the corner radius — so any stylesheet reads them from
	 * one place instead of the frame passing them down per element. Called once at
	 * startup alongside the layers.
	 */
	configure_metrics(): void {
		const root = document.documentElement.style;
		root.setProperty('--gap-tight',          `${k.gap.tight}px`);
		root.setProperty('--gap',                `${k.gap.default}px`);
		root.setProperty('--gap-details',        `${k.gap.details}px`);
		root.setProperty('--gap-preferences',    `${k.gap.preferences}px`);
		root.setProperty('--radius',             `${k.radius.corner.main}px`);
		root.setProperty('--radius-banner',      `${k.radius.corner.banner}px`);
		root.setProperty('--radius-build',       `${k.radius.corner.build}px`);
		root.setProperty('--radius-pill',        `${k.radius.corner.pill}px`);
		root.setProperty('--radius-percent',     `${k.radius.percent}%`);
		root.setProperty('--height-hideable',    `${k.height.hideable}px`);
		root.setProperty('--height-control',     `${k.height.control}px`);
		root.setProperty('--height-banner',      `${k.height.banner}px`);
		root.setProperty('--size-button',        `${k.size.button}px`);
		root.setProperty('--size-cross',         `${k.size.cross}px`);
		root.setProperty('--font-credit',        `${k.font.credit}px`);
		root.setProperty('--font-label',         `${k.font.label}px`);
		root.setProperty('--font-base',          `${k.font.base}px`);
		root.setProperty('--font-banner',        `${k.font.banner}px`);
		root.setProperty('--font-large',         `${k.font.large}px`);
		root.setProperty('--font-hero',          `${k.font.em.big}em`);
		root.setProperty('--font-drop',          `${k.font.em.small}em`);
		root.setProperty('--fw-normal',          `${k.font.weight.normal}`);
		root.setProperty('--fw-banner',          `${k.font.weight.banner}`);
		root.setProperty('--fw-title',           `${k.font.weight.title}`);
		root.setProperty('--inset-cluster',      `${k.inset.cluster}px`);
		root.setProperty('--inset-pill-top',     `${k.inset.pill.top}px`);
		root.setProperty('--inset-pill-left',    `${k.inset.pill.left}px`);
		root.setProperty('--inset-popup-edge',   `${k.inset.popup.edge}px`);
		root.setProperty('--inset-popup-side',   `${k.inset.popup.side}px`);
		root.setProperty('--inset-credit-bottom',`${k.inset.credit.bottom}px`);
		root.setProperty('--inset-credit-left',  `${k.inset.credit.left}px`);
		root.setProperty('--thickness-normal',   `${k.thickness.normal}px`);
		root.setProperty('--thickness-faint',    `${k.thickness.faint}px`);
		root.setProperty('--thickness-fat',      `${k.thickness.fat}px`);
		root.setProperty('--tracking',           `${k.font.em.tracking}em`);
		// Paddings pushed as ready-to-use shorthands (top/right/bottom/left where needed).
		root.setProperty('--pad-hamburger',      `${k.pad.hamburger.y}px ${k.pad.hamburger.x}px`);
		root.setProperty('--pad-control',        `${k.pad.control.y}px ${k.pad.control.x}px`);
		root.setProperty('--pad-modal',          `${k.pad.modal.y}px ${k.pad.modal.x}px`);
		root.setProperty('--pad-stepper',        `${k.pad.stepper.y}px ${k.pad.stepper.x}px`);
		root.setProperty('--pad-view',           `${k.pad.view.top}px ${k.pad.view.x}px ${k.pad.view.x}px`);
		root.setProperty('--pad-cell',           `${k.pad.cell.y}px ${k.pad.cell.x}px ${k.pad.cell.y}px 0`);
		root.setProperty('--margin-header',      `${k.margin.header}px`);
		root.setProperty('--notes-build',        `${k.table.build}px`);
		root.setProperty('--notes-date',         `${k.table.date}px`);
		root.setProperty('--shadow-modal',       `0 ${k.shadow.y}px ${k.shadow.blur}px color-mix(in srgb, var(--black) ${k.shadow.ink}%, transparent)`);
		root.setProperty('--opacity-drop',       `${k.opacity.drop}`);
		root.setProperty('--opacity-header',     `${k.opacity.header}`);
		root.setProperty('--opacity-label',      `${k.opacity.label}`);
	}

	/**
	 * Push the fixed (non-theme) ink colors onto the document root — one black for
	 * everything (never #000) and the muted gray. Static, so pushed once at startup.
	 */
	configure_inks(): void {
		const root = document.documentElement.style;
		root.setProperty('--black', colors.black);
		root.setProperty('--white', colors.white);
		root.setProperty('--gray',  colors.gray);
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
		root.setProperty('--focus-outline', `${k.thickness.bold}px solid ${focus}`);
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
