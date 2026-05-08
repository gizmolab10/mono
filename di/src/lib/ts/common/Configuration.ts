import { preferences } from '../managers/Preferences';
import { T_Browser } from '../types/Enumerations';
import { colors } from '../utilities/Colors';
import MobileDetect from 'mobile-detect';
import { writable } from 'svelte/store';
import { k } from './Constants';
import { debug } from './Debug'

export enum T_Configuration_Keys {
	clear = 'clear',
}

export class Configuration {

	w_device_isMobile = writable<boolean>(false);

	queryStrings = typeof window !== 'undefined'
		? new URLSearchParams(window.location.search)
		: new URLSearchParams();

	/**
	 * First-thing-called bootstrap. Reads URL flags and acts on them
	 * before any other module reads the persistent state the flags
	 * might want to clear. Wired from main.ts via the side-effect call
	 * below the class.
	 */
	configure(): void {
		this.configure_css();
		debug.apply_queryStrings(this.queryStrings);
		preferences.apply_queryStrings(this.queryStrings);
	}

	get device_isMobile(): boolean {
		const md = new MobileDetect(window.navigator.userAgent);
		return !!md.mobile();
	}

	get isServerLocal(): boolean {
		const hostname = window.location.hostname;
		return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
	}

	get siteTitle(): string {
		const host = this.isServerLocal ? 'local' : 'remote';
		return `Design Intuition ${host}`;
	}

	get browserType(): T_Browser {
		const userAgent: string = navigator.userAgent;
		switch (true) {
			case /msie (\d+)/i.test(userAgent) ||
				/trident\/.*; rv:(\d+)/i.test(userAgent):  return T_Browser.explorer;
			case /(chrome|crios)\/(\d+)/i.test(userAgent): return T_Browser.chrome;
			case /firefox\/(\d+)/i.test(userAgent):		   return T_Browser.firefox;
			case /opr\/(\d+)/i.test(userAgent):			   return T_Browser.opera;
			case /orion\/(\d+)/i.test(userAgent):		   return T_Browser.orion;
			case /safari\/(\d+)/i.test(userAgent):		   return T_Browser.safari;
			default:									   return T_Browser.unknown
		}
	}

	/**
	 * One-time injection of static design tokens onto the document root as
	 * CSS variables. Sourced from the constants module and the colors module.
	 * Reactive color tokens (accent, bg, text, selected) are watched in
	 * App.svelte via $effect — they are not handled here.
	 */
	configure_css(): void {
		const root = document.documentElement.style;

		root.setProperty('--focus-outline',    `1.5px solid ${colors.focus}`);

		root.setProperty('--window-min-width', `${k.width.window_min}`);

		root.setProperty('--white',             'white');
		root.setProperty('--c-default',         colors.default);
		root.setProperty('--c-slider-border',   colors.border);
		root.setProperty('--c-focus',           colors.focus);
		root.setProperty('--c-thumb',           colors.thumb);
		root.setProperty('--c-track',           colors.track);

		root.setProperty('--font-monster',     `${k.height.font.monster}px`);
		root.setProperty('--font-common',      `${k.height.font.common}px`);
		root.setProperty('--font-large',       `${k.height.font.large}px`);
		root.setProperty('--font-small',       `${k.height.font.small}px`);
		root.setProperty('--font-reset',       `${k.height.font.reset}px`);
		root.setProperty('--font-tiny',        `${k.height.font.tiny}px`);
		root.setProperty('--font-huge',        `${k.height.font.huge}px`);

		root.setProperty('--l-letter-spacing', `${k.layout.letter_spacing}px`);
		root.setProperty('--l-padding-small',  `${k.layout.padding_small}px`);
		root.setProperty('--l-gap-large',      `${k.layout.gap_large}px`);
		root.setProperty('--l-gap-small',      `${k.layout.gap_small}px`);
		root.setProperty('--l-gap-tiny',       `${k.layout.gap_tiny}px`);
		root.setProperty('--l-padding',        `${k.layout.padding}px`);
		root.setProperty('--l-margin',         `${k.layout.margin}px`);
		root.setProperty('--l-gap',            `${k.layout.gap}px`);

		root.setProperty('--th-tick',          `${k.thickness.tick}px`);
		root.setProperty('--th-track',         `${k.thickness.track}px`);
		root.setProperty('--th-thumb',         `${k.thickness.thumb}px`);
		root.setProperty('--th-border',        `${k.thickness.border}px`);
		root.setProperty('--th-sep',           `${k.thickness.separator.main}px`);
		root.setProperty('--th-thin-sep',      `${k.thickness.separator.content}px`);
		root.setProperty('--th-banners-sep',   `${k.thickness.separator.banners}px`);
		root.setProperty('--th-content-sep',   `${k.thickness.separator.content}px`);

		root.setProperty('--corner-common',    `${k.corner.common}px`);
		root.setProperty('--corner-banner',    `${k.corner.banner}px`);
		root.setProperty('--corner-input',     `${k.corner.input}px`);
		root.setProperty('--corner-box',       `${k.corner.box}px`);

		root.setProperty('--z-common',         `${k.z.common}`);
		root.setProperty('--z-layout',         `${k.z.layout}`);
		root.setProperty('--z-action',         `${k.z.action}`);
		root.setProperty('--z-frontmost',      `${k.z.frontmost}`);

		root.setProperty('--h-button-tiny',    `${k.height.button.tiny}px`);
		root.setProperty('--h-button-small',   `${k.height.button.small}px`);
		root.setProperty('--h-button-common',  `${k.height.button.common}px`);
		root.setProperty('--w-build-button',   `${k.width.build_button}px`);
		root.setProperty('--w-guides-slider',  `${k.width.guides_slider}px`);
		root.setProperty('--h-controls',       `${k.height.controls}px`);
		root.setProperty('--h-collapse',       `${k.height.collapse}px`);
		root.setProperty('--h-banner',         `${k.height.banner}px`);
		root.setProperty('--h-slider',         `${k.height.slider}px`);
		root.setProperty('--h-cell',           `${k.height.cell}px`);

		root.setProperty('--w-title',          `${k.width.title}px`);
		root.setProperty('--w-small',          `${k.width.small}px`);

		root.setProperty('--c-r-main',         `${k.radius.main}px`);
		root.setProperty('--c-r-table',        `${k.radius.table}px`);
		root.setProperty('--c-r-content',      `${k.radius.content}px`);
	}

	/**
	 * Push the four reactive color tokens onto the document root as CSS
	 * variables. Called from App.svelte's $effect block whenever any of
	 * the four color stores change.
	 */
	configure_reactive_colors(text: string, accent: string, selected: string, bg: string): void {
		const root = document.documentElement.style;
		root.setProperty('--text',     text);
		root.setProperty('--accent',   accent);
		root.setProperty('--hover',    accent);
		root.setProperty('--selected', selected);
		root.setProperty('--bg',       bg);
	}

}

export const c = new Configuration();
c.configure();