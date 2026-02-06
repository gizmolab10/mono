import { T_Hit_Target } from '../types/Enumerations';
import S_Hit_Target from './S_Hit_Target';
import { k } from '../common/Constants';

// Formerly called Svelte Wrapper
// (?) style construction (by type and hid)
// manage signals and for debugging styles and DOM issues
// unique id assignment (of html elements) for DOM lookups

export default class S_Component extends S_Hit_Target {
	hid: number | null = null;

	// hit test (detect and rubberband), logger, emitter, handler and destroyer

	constructor(hid: number | null, type: T_Hit_Target) {
		super(type, `${type}-${hid ?? 'unknown'}`);
		this.hid = hid;
		this.id = this.component_id;
	}

	private get component_id(): string {
		return `${this.type}-${this.hid ?? 'no-hid'}`;
	}

	// ===== DEBUG LOGGING =====
	
	private get element_debug_style(): string {
		const element = this.html_element;
		if (!!element) {
			const indented = k.newLine + k.tab;
			const style = element.getAttribute('style');
			if (!!style) {
				return style.replace(/; /g, indented).replace(/ :/g, ':').replace(/: /g, '\t');
			}
		}
		return 'no style information';
	}

	private style_debug_info(prefix: string): string {
		const element = this.html_element;
		if (!!element) {
			const indented = k.newLine + k.tab;
			const computed = window.getComputedStyle(element);
			return [prefix,
				indented + k.title.line,
				indented + this.element_debug_style,
				indented + k.title.line,
				indented + 'isConnected', element.isConnected,
				indented + 'computed.backgroundColor', computed.backgroundColor,
				indented + 'computed.display', computed.display,
				indented + 'computed.visibility', computed.visibility,
				indented + 'ownerDocument', element.ownerDocument === document ? 'main document' : 'different document',
				indented + (element.offsetParent === element.parentElement) ? 'positioning is normal' : 'offset is not parent'
			].join(k.tab);
		}
		return 'no style information';
	}

	private element_debug_info(prefix: string, element: HTMLElement | null | undefined): string {
		const indented = k.newLine + k.tab + prefix + k.space;
		const array = !element ? [] : [
			k.newLine + k.tab + k.title.line,
			indented + 'tagName', element.tagName,
			indented + 'isConnected', element.isConnected,
			indented + 'getBoundingClientRect', JSON.stringify(element.getBoundingClientRect()),
			indented + 'ownerDocument.contains', element.ownerDocument?.contains(element),
			indented + 'getRootNode', element.getRootNode()?.nodeName,
			indented + 'compareDocumentPosition', element.compareDocumentPosition(document.body) & 0x8 ? 'body contains ' + prefix : prefix + ' is orphaned',
			indented + 'closest body', element.closest('body')?.tagName];
		return array.join(k.tab);
	}

	get isComponentLog_enabled(): boolean {
		const log_isEnabledFor_type: { [key: string]: boolean } = {
			breadcrumbs: false,
			branches: false,
			radial: false,
			reveal: false,
			widget: false,
			title: false,
			drag: false,
			line: false,
			none: false,
			tree: false,
			app: false,
		}
		return log_isEnabledFor_type[this.type] ?? false;
	}

	debug_log_style(prefix: string) {
		if (!this.isComponentLog_enabled) { return; }
		const information = this.style_debug_info(prefix);
		if (!!information) {
			console.log(information);
		}
	}

	debug_log_connection_state(prefix: string) {
		if (!this.isComponentLog_enabled) { return; }
		const element = this.html_element;
		if (!!element) {
			const indented = k.newLine + k.tab;
			const type = this.type.toUpperCase();
			const array = [type, prefix, 'connection state', `(at ${new Date().toLocaleString()})`,
				indented + k.title.line,
				indented + this.style_debug_info('component'),
				indented + k.title.line,
				indented + 'previousSibling', element.previousSibling?.nodeName,
				indented + 'nextSibling', element.nextSibling?.nodeName,
			];
			array.push(this.element_debug_info('ELEMENT', element));
			console.log(array.join(k.tab));
		}
	}

}
