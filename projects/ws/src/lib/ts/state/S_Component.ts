import { Rect, Point, S_Hit_Target, T_Signal, T_Hit_Target } from '../common/Global_Imports';
import { k, u, debug, signals, Ancestry } from '../common/Global_Imports';
import { Integer, SignalConnection_atPriority } from '../types/Types';
import Identifiable from '../runtime/Identifiable';
import { SignalConnection } from 'typed-signals';

// formerly called Svelte Wrapper
// (?) style construction (by type and hid)
// manage signals and for debugging styles and DOM issues
// unique id assignment (of html elements) for DOM lookups
// provide Ancestry access to an associated svelte component's main element (and vice versa)

export default class S_Component extends S_Hit_Target {
    signal_handlers: SignalConnection_atPriority[] = [];
	hid: Integer | null = null;

    // hit test (detect and rubberband), logger, emitter, handler and destroyer

    constructor(identifiable: Identifiable | null, type: T_Hit_Target) {
        super(type, identifiable);
        this.hid = identifiable?.hid ?? -1 as Integer;
        this.id = this.component_id;
    }

    static readonly _____SIGNALS: unique symbol;

    assure_hasConnection_atPriority(priority: number, connection: SignalConnection) {
        for (const handler of this.signal_handlers) {
            if (handler.priority == priority) {
                handler.connection = connection;
            }
        }
    }

    disconnect() {
        for (const handler of this.signal_handlers) {
            handler.connection?.disconnect();
            handler.connection = null;
        }
    }

    private get description(): string { return this.type; }

    private get component_id(): string {
        const a = this.ancestry;
        return `${this.type}-${!a ? 'no-ancestry' : (a.kind + '-' + a.titles)}`;
    }

    static readonly _____DEBUG_LOGGING: unique symbol;
    
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
			return [prefix, this.ancestry?.titles,
                indented + k.title.line,
                indented + this.element_debug_style,
				indented + k.title.line,
				indented + 'isConnected', element.isConnected,
				indented + 'computed.backgroundColor', computed.backgroundColor,
				indented + 'computed.display', computed.display,
				indented + 'computed.visibility', computed.visibility,
				indented + 'ownerDocument', element.ownerDocument === document ? 'main document' :'different document',
				indented + (element.offsetParent === element.parentElement) ? 'positioning is normal' :'offset is not parent'
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
        const log_isEnabledFor_type = {
            breadcrumbs : false,
            branches	: false,
            radial		: false,
            reveal		: false,
            widget		: false,
            title		: false,
            drag		: false,
            line		: false,
            none		: false,
            tree		: false,
            app			: false,
        }
        const type = this.type as keyof typeof log_isEnabledFor_type;
        return log_isEnabledFor_type[type] ?? false;
    }

	debug_log_style(prefix: string) {
        if (!this.isComponentLog_enabled) { return; }
        const information = this.style_debug_info(prefix);
        if (!!information) {
            debug.log_component(information);
        }
	}

	debug_log_signal(sending: boolean, value: any | null, t_signal: T_Signal, priority: number) {
        if (signals.log_isEnabledFor_t_signal[t_signal] && signals.log_isEnabled_forSending(sending) && this.isComponentLog_enabled) {
            const resolved = u.resolve_signal_value(value);
            const first = sending ? '[s]---->' : '---->[h]';
			const second = sending ? 'from' : 'in';
			debug.log_signal(`${first} "${t_signal}" @ ${priority} ${second} ${this.description} with ${resolved}`);
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
				indented + this.style_debug_info('ancestry'),
				indented + k.title.line,
				indented + 'ancestry.isGrabbed', this.ancestry?.isGrabbed,
				indented + 'ancestry.isEditing', this.ancestry?.isEditing,
				indented + 'ancestry.isFocus', this.ancestry?.isFocus,
				indented + 'previousSibling', element.previousSibling?.nodeName,
				indented + 'nextSibling', element.nextSibling?.nodeName,
			];
			array.push(this.element_debug_info('ELEMENT', element));
			// array.push(this.element_debug_info('PARENT', element.parentElement));
			// array.push(this.element_debug_info('GRAND-PARENT', element.parentElement?.parentElement));
			debug.log_component(array.join(k.tab));
		}
	}

}
