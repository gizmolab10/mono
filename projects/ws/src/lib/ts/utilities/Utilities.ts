// N.B., do not import these from Global Imports --> avoid dependency issues when importing Utilities class

import { Testworthy_Utilities } from './Testworthy_Utilities';
import { Rect, Size, Point } from '../types/Coordinates';
import Identifiable from '../runtime/Identifiable';
import { databases } from '../database/Databases';
import { controls } from '../managers/Controls';
import G_TreeLine from '../geometry/G_TreeLine';
import G_Widget from '../geometry/G_Widget';
import Ancestry from '../runtime/Ancestry';
import { Integer } from '../types/Types';
import { g } from '../managers/Geometry';
import { k } from '../common/Constants';
import { x } from '../managers/UX';
import { get } from 'svelte/store';
import { colors } from './Colors';
import { print } from './Print';

export class Utilities extends Testworthy_Utilities {
	
	descriptionBy_title(ancestries:		  Array<Ancestry> | null): string { return ancestries?.map(a => a?.title ?? k.unknown).join('-') ?? k.empty; }
	descriptionBy_titles(ancestries:	  Array<Ancestry> | null): string { return ancestries?.map(a => (a?.titles ?? [k.unknown])?.join(k.comma) ?? k.unknown).join('-') ?? k.unknown; }
	descriptionBy_sorted_HIDs(identifiables: Array<Identifiable>): string { return identifiables.map((a: Identifiable) => a?.hid ?? -1 as unknown as Integer).sort().join(k.comma); }
	descriptionBy_sorted_IDs(identifiables:  Array<Identifiable>): string { return identifiables.map((a: Identifiable) => a?.id ?? k.unknown).sort().join(k.comma); }
	sort_byOrder(ancestries: Array<Ancestry>):			  Array<Ancestry> { return ancestries.sort( (a: Ancestry, b: Ancestry) => { return a.order - b.order; }); }
	getWidthOf(s: string):										   number { return this.getWidth_ofString_withSize(s, `${k.font_size.common}px`); }

	ids_forDB(ancestries: Array<Ancestry>): string[] {
		return ancestries.filter(a => !!a && a?.t_database == get(databases.w_t_database)).map(a => a?.id ?? k.unknown);
	}

	resolve_signal_value(value: any): string {
		const type = value?.constructor?.name;
		return typeof value != 'object' ? value :
			(type === 'Ancestry' ? `Ancestry (${value.title})` : type ?? 'null');
	}

	getFontOf(element: HTMLElement): string {
		const style: CSSStyleDeclaration = window.getComputedStyle(element);
		const fontFamily: string = style.fontFamily;
		const fontSize: string = style.fontSize;
		return `${fontSize} ${fontFamily}`;
	}

	indexOf_withMatchingThingID_in(ancestry: Ancestry, ancestries: Array<Ancestry>): number {
		const thing = ancestry.thing;
		if (!!thing) {
			const index = ancestries.findIndex(a => a.thing?.id == thing.id);
			return index;
		}
		return -1;
	}

	sort_byTitleTop(ancestries: Array<Ancestry>): Array<Ancestry> {
		return ancestries.sort( (a: Ancestry, b: Ancestry) => {
			const aTop = a.rect_ofTitle?.origin.y;
			const bTop = b.rect_ofTitle?.origin.y;
			return (!aTop || !bTop) ? 0 : aTop - bTop;
		});
	}

	strip_hidDuplicates(ancestries: Array<Ancestry>): Array<Ancestry> {
		let ancestriesByHID: Record<number, Ancestry> = {};
		let stripped: Array<Ancestry> = [];
		for (const ancestry of ancestries) {
			const hid = ancestry.hid;
			if ((!!hid || hid == 0) && (!ancestriesByHID[hid])) {
				ancestriesByHID[hid] = ancestry;
				stripped.push(ancestry);
			}
		}
		return stripped;
	}

	strip_identifiableDuplicates(identifiables: Array<Identifiable>): Array<Identifiable> {
		let stripped: Array<Identifiable> = [];
		for (const identifiable of identifiables) {
			const hid = identifiable.hid;
			if ((!!hid || hid == 0)) {
				const index = stripped.findIndex(i => i.hid === hid);
				if (index == -1) {
					stripped.push(identifiable);
				} else if (stripped[index].hid < identifiable.hid) {
					stripped[index] = identifiable;		// assure array content is repeatable
				}
			}
		}
		return stripped;
	}

	strip_thingDuplicates_from(ancestries: Array<Ancestry>): Array<Ancestry> {
		let stripped: Array<Ancestry> = [];
		for (const ancestry of ancestries) {
			const hid = ancestry.thing?.hid;
			if ((!!hid || hid == 0)) {
				const index = stripped.findIndex(a => a.thing?.hid === hid);
				if (index == -1) {
					stripped.push(ancestry);
				} else if (stripped[index].depth < ancestry.depth) {
					stripped[index] = ancestry;		// assure array content is repeatable
				}
			}
		}
		return stripped;
	}

	hasMatching_bidirectional(bidirectionals: G_TreeLine[], g_line: G_TreeLine): boolean {
		return bidirectionals.some(b => 
			!!b.ancestry &&
			!!g_line.ancestry &&
			((b.ancestry.id == g_line.ancestry.id &&
			b.other_ancestry.id == g_line.other_ancestry.id) ||
			(b.ancestry.id == g_line.other_ancestry.id &&
			b.other_ancestry.id == g_line.ancestry.id)));
	}

	ancestries_orders_normalize(ancestries: Array<Ancestry>): void {
		const length = ancestries.length;
		if (length > 1) {
			this.sort_byOrder(ancestries);
			for (let index = 0; index < length; index++) {
				ancestries[index].order_setTo(index);
			}
		}
	}

	getWidth_ofString_withSize(str: string, fontSize: string): number {
		const element: HTMLElement = document.createElement('div');
		element.style.fontFamily = get(x.w_thing_fontFamily);
		element.style.left = '-9999px'; // offscreen
		element.style.padding = '0px 0px 0px 0px';
		element.style.position = 'absolute';
		element.style.fontSize = fontSize;
		element.style.whiteSpace = 'pre';
		element.textContent = str;
		document.body.appendChild(element);
		const width: number = element.getBoundingClientRect().width / get(g.w_scale_factor);
		document.body.removeChild(element);
		return width;
	}

	print_graph() {
		const rect = g.rect_ofAllWidgets;
		const className = controls.inTreeMode ? 'tree-graph' : 'radial-graph';
		print.print_element_byClassName_withRect(className, rect, get(x.w_ancestry_focus)?.title ?? '');
	}

	temporarily_setDefaults_while(closure: () => void) {
		const grabbed = x.si_grabs.items;
		const color = get(colors.w_background_color);
		colors.w_background_color.set('white');
		x.si_grabs.reset();	// triggers reactivity, takes time to percolate
		setTimeout(() => {
			closure();
			x.si_grabs.items = grabbed;
			colors.w_background_color.set(color);
		}, 10);
	}

	print_element_byClassName_withRect(className: string, rect: Rect, title: string) {
		const element = document.querySelector(`.${className}`) as HTMLElement;
		const printWindow = window.open('', '_blank');
		if (!!printWindow && !!element) {
			printWindow.document.write(`
				<!DOCTYPE html>
				<html>
					<head>
						<title>Print</title>
						<style>
							body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
							@media print {
								body { margin: 0; }
							}
						</style>
						<link rel='stylesheet' href='/path/to/your/styles.css'>
					</head>
					<body>
						${element.outerHTML}
					</body>
				</html>
			`);
		
			printWindow.document.close();
			printWindow.focus();
			printWindow.print();
			printWindow.close();
		}
	}

	get_rect_ofGraphDrawing_forAll_g_widgets(g_widgets: G_Widget[]): Rect {
		if (g_widgets.length === 0) {
			return Rect.zero;
		}
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		for (const g_widget of g_widgets) {
			const w_origin = g_widget.origin_ofGraphDrawing;
			const w_width = g_widget.width_ofWidget;
			const w_height = k.height.row - 1.5;
			const w_minX = w_origin.x;
			const w_minY = w_origin.y;
			const w_maxX = w_origin.x + w_width;
			const w_maxY = w_origin.y + w_height;
			minX = Math.min(minX, w_minX);
			minY = Math.min(minY, w_minY);
			maxX = Math.max(maxX, w_maxX);
			maxY = Math.max(maxY, w_maxY);
		}
		const width = maxX - minX;
		const height = maxY - minY;
		return new Rect(new Point(minX, minY), new Size(width, height));
	}

	convert_windowOffset_toCharacterOffset_in(offset: number, input: HTMLInputElement): number {
		const rect = input.getBoundingClientRect();
		const style = window.getComputedStyle(input);
		const paddingLeft = parseFloat(style.paddingLeft) || 0;
		const borderLeft = parseFloat(style.borderLeftWidth) || 0;
		const contentLeft = rect.left + borderLeft + paddingLeft;
		let relativeX = offset - contentLeft;
		if (relativeX < 0) {
			relativeX = 0;
		}
		const effectiveX = (relativeX + input.scrollLeft) / get(g.w_scale_factor);
		// Create a canvas context for measuring text.
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (!context) {
			return 0;
		}
		context.font = style.font || `${style.fontSize} ${style.fontFamily}`;
		const text = input.value;
		if (text.length === 0) {
			return 0;
		}
		// Use binary search to find the character index
		// whose measured width is as close as possible to effectiveX.
		let low = 0;
		let high = text.length;
		while (low < high) {
			const mid = Math.floor((low + high) / 2);
			const width = context.measureText(text.substring(0, mid)).width;
			if (width < effectiveX) {
				low = mid + 1;
			} else {
				high = mid;
			}
		}
		// low is now the smallest index where the width is >= effectiveX.
		// Optionally, check if the previous index was closer.
		if (low > 0) {
			const prevWidth = context.measureText(text.substring(0, low - 1)).width;
			const currWidth = context.measureText(text.substring(0, low)).width;
			if (Math.abs(effectiveX - prevWidth) < Math.abs(currWidth - effectiveX)) {
				return low - 1;
			}
		}
		return low;
	}

}

export const u = new Utilities();
