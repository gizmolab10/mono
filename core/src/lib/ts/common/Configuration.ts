import { colors } from '../utilities';
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
		root.setProperty('--gap-micro',          `${k.gap.micro}px`);
		root.setProperty('--gap-faint',          `${k.gap.faint}px`);
		root.setProperty('--gap-tiny',           `${k.gap.tiny}px`);
		root.setProperty('--gap-small',          `${k.gap.small}px`);
		root.setProperty('--gap',                `${k.gap.normal}px`);
		root.setProperty('--gap-big',            `${k.gap.big}px`);
		root.setProperty('--gap-fat',            `${k.gap.fat}px`);
		root.setProperty('--gap-huge',           `${k.gap.huge}px`);
		root.setProperty('--thick-faint',        `${k.thickness.faint}px`);
		root.setProperty('--thick-small',        `${k.thickness.small}px`);
		root.setProperty('--thick',              `${k.thickness.normal}px`);
		root.setProperty('--thick-big',          `${k.thickness.big}px`);
		root.setProperty('--thick-fat',          `${k.thickness.fat}px`);
		root.setProperty('--thick-huge',         `${k.thickness.huge}px`);
		root.setProperty('--radius-tiny',        `${k.radius.corner.tiny}px`);
		root.setProperty('--radius-small',       `${k.radius.corner.small}px`);
		root.setProperty('--radius',             `${k.radius.corner.normal}px`);
		root.setProperty('--radius-pill',        `${k.radius.corner.pill}px`);
		root.setProperty('--radius-percent',     `${k.radius.percent}%`);
		root.setProperty('--height',             `${k.height.normal}px`);
		root.setProperty('--height-small',       `${k.height.small}px`);
		root.setProperty('--height-tiny',        `${k.height.tiny}px`);
		root.setProperty('--height-big',         `${k.height.big}px`);
		root.setProperty('--height-fat',         `${k.height.fat}px`);
		root.setProperty('--width-tiny',         `${k.width.tiny}px`);
		root.setProperty('--size-small',         `${k.size.small}px`);
		root.setProperty('--size',               `${k.size.normal}px`);
		root.setProperty('--size-big',           `${k.size.big}px`);
		root.setProperty('--size-big',           `${k.size.big}px`);
		root.setProperty('--size-fat',           `${k.size.fat}px`);
		root.setProperty('--font-micro',         `${k.font.micro}px`);
		root.setProperty('--font-faint',         `${k.font.faint}px`);
		root.setProperty('--font-tiny',          `${k.font.tiny}px`);
		root.setProperty('--font-small',         `${k.font.small}px`);
		root.setProperty('--font',               `${k.font.normal}px`);
		root.setProperty('--font-big',           `${k.font.big}px`);
		root.setProperty('--font-fat',           `${k.font.fat}px`);
		root.setProperty('--font-huge',          `${k.font.huge}px`);
		root.setProperty('--slide',              `${k.timeout.slide}ms`);
		root.setProperty('--slide-rows',         `${k.timeout.rows}ms`);
		root.setProperty('--fade',               `${k.timeout.fade}ms`);
		root.setProperty('--hover-fade',         `${k.timeout.hover}ms`);
		root.setProperty('--hover-fade-section', `${k.timeout.hover_section}ms`);
		root.setProperty('--rest',               `${k.timeout.rest}ms`);
		root.setProperty('--em-tiny',            `${k.font.em.tiny}em`);
		root.setProperty('--em-small',           `${k.font.em.small}em`);
		root.setProperty('--em',                 `${k.font.em.normal}em`);
		root.setProperty('--em-big',             `${k.font.em.big}em`);
		root.setProperty('--fw',                 `${k.font.weight.normal}`);
		root.setProperty('--fw-big',             `${k.font.weight.big}`);
		root.setProperty('--fw-huge',            `${k.font.weight.huge}`);
		root.setProperty('--inset-numbers',      `${k.inset.numbers}px`);
		root.setProperty('--inset-list',         `${k.inset.list}px`);
		root.setProperty('--inset-pill-top',     `${k.inset.pill.top}px`);
		root.setProperty('--inset-pill-left',    `${k.inset.pill.left}px`);
		root.setProperty('--inset-popup-edge',   `${k.inset.popup.edge}px`);
		root.setProperty('--inset-popup-side',   `${k.inset.popup.side}px`);
		root.setProperty('--inset-credit-left',  `${k.inset.credit.left}px`);
		root.setProperty('--inset-show-folders', `${k.inset.show_folders}px`);
		root.setProperty('--inset-credit-bottom',`${k.inset.credit.bottom}px`);
		root.setProperty('--pad-hamburger',      `${k.pad.hamburger.y}px ${k.pad.hamburger.x}px`);
		root.setProperty('--pad-control',        `${k.pad.control.top}px ${k.pad.control.x}px ${k.pad.control.bottom}px`);
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
		root.setProperty('--gray',       colors.gray);
		root.setProperty('--black',      colors.black);
		root.setProperty('--white',      colors.white);
		root.setProperty('--offwhite',   colors.offwhite);
		root.setProperty('--darkgray',   colors.darkgray);
		root.setProperty('--lightgray',  colors.lightgray);
		root.setProperty('--faintgray',  colors.faintgray);
		root.setProperty('--green',      colors.green);
	}

	/**
	 * Push the reactive color tokens onto the document root as CSS variables.
	 * Called from App.svelte's $effect block whenever any of the color stores
	 * change. Trimmed port of di's Configuration — the color-variable setter
	 * only, with none of di's engine/constants dependencies.
	 */
	configure_reactive_colors(
		background: string,
		accent: string,
		hover: string,
		text: string
	): void {
		const root = document.documentElement.style;
		root.setProperty('--bg',     background);
		root.setProperty('--accent', accent);
		root.setProperty('--hover',  hover);
		root.setProperty('--text',   text);
	}

}

export const c = new Configuration();
