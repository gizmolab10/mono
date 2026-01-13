import type { Dictionary, Signal_Signature } from '../types/Types';
import { T_Signal, T_Hit_Target } from '../common/Enumerations';
import { components } from '../managers/Components';
import S_Component from '../state/S_Component';
import Ancestry from '../runtime/Ancestry';
import { Signal } from 'typed-signals';
import { debug } from '../debug/Debug';
import { get } from 'svelte/store';
import { x } from '../managers/UX';

export class Signals {
	highestPriorities: Dictionary<number> = {};
	signal_emitter = new Signal<Signal_Signature>();
	signals_inFlight_dict_byT_Signal: Dictionary<boolean> = {};

	log_isEnabled_forSending(sending: boolean): boolean {
		return this.log_isEnabled_forDirection[sending ? 'sending' : 'handling'];
	}

	log_isEnabledFor_t_signal = {
		alteration : false,
		reposition : false,
		reattach   : false,
		rebuild	   : true,
		thing	   : false,
	}

	log_isEnabled_forDirection = {
		handling : true,
		sending  : false,
	}

	static readonly _____SENDING: unique symbol;

	// signal is called with a value and a type, but not a priority
	// emit is then called on the signal_emitter
	// for each priority (up to the highest requested for that type)
	// in increasing priority from 0 to highest
	
	signal_rebuildGraph_from(value: any = null, component: S_Component | null = null) { this.signal(T_Signal.rebuild, value, component); }
	signal_rebuildGraph_fromFocus(component: S_Component | null = null) { this.signal_rebuildGraph_from(get(x.w_ancestry_focus), component); }
	signal_blink_forAlteration(value: any = null, component: S_Component | null = null) { this.signal(T_Signal.alteration, value, component); }
	signal_reattach_widgets_from(value: any = null, component: S_Component | null = null) { this.signal(T_Signal.reattach, value, component); }
	signal_reposition_widgets_from(value: any = null, component: S_Component | null = null) { this.signal(T_Signal.reposition, value, component); }
	signal_reattach_widgets_fromFocus(component: S_Component | null = null) { this.signal_reattach_widgets_from(get(x.w_ancestry_focus), component); }
	signal_reposition_widgets_fromFocus(component: S_Component | null = null) { this.signal_reposition_widgets_from(get(x.w_ancestry_focus), component); }

	signal(t_signal: T_Signal, value: any = null, s_component: S_Component | null = null) {
		if (this.anySignal_isInFlight) {									// avoid sending multiple simultaneous signals
			debug.log_signal(`NOT SEND ${t_signal} in flight`);
		} else if (!this.signal_isInFlight_for(T_Signal.rebuild) ||			// also, if rebuild is in progress
			t_signal != T_Signal.reposition) {								// suppress reposition
			this.set_signal_isInFlight_for(t_signal, true);
			const highestPriority = this.highestPriorities[t_signal] ?? 0;
			const s_c = s_component ?? components.dummy;					// often no component is provided, use the dummy component	
			for (let priority = 0; priority <= highestPriority; priority++) {
				s_c.debug_log_signal(true, value, t_signal, priority);	// log components listening to this signal at this priority
				this.signal_emitter.emit(t_signal, priority, value);
			}
			this.set_signal_isInFlight_for(t_signal, false);
		}
	}

	static readonly _____RECEIVING: unique symbol;

	// each handler has a signal type, a priority and a closure
	// whereby, upon receipt of each signal,
	// whose type and priority are a match
	// the closure is called
	// with just the signal's type and value

	handle_signals_atPriority(t_signals: Array<T_Signal>, priority: number, ancestry: Ancestry | null, type: T_Hit_Target, onSignal: (t_signal: T_Signal, value: any | null) => any ): S_Component | null {
		this.adjust_highestPriority_forSignals(priority, t_signals);
		const s_component = components.component_forAncestry_andType_createUnique(ancestry, type);	// 1) create it
		const connection = this.signal_emitter.connect((received_t_signal, signalPriority, value) => {
			for (const t_signal of t_signals) {
				if (received_t_signal == t_signal && signalPriority == priority) {
					s_component?.debug_log_signal(false, value, received_t_signal, signalPriority);	// 4) use it
					onSignal(t_signal, value);
				}
			}
		});
		if (!!s_component) {
			s_component!.assure_hasConnection_atPriority(priority, connection);		// 2) register it
			return s_component;														// 3) return it
		}
		return null;
	}

	handle_anySignal_atPriority(priority: number, ancestry: Ancestry | null, type: T_Hit_Target, onSignal: (t_signal: T_Signal, value: any | null) => any ): S_Component | null {
		this.adjust_highestPriority_forAllSignals(priority);
		let s_component = components.component_forAncestry_andType_createUnique(ancestry, type);		// 1) create it
		const connection = this.signal_emitter.connect((received_t_signal, signalPriority, value) => {
			if (signalPriority == priority) {
				s_component?.debug_log_signal(false, value, received_t_signal, signalPriority);	// 4) use it
				onSignal(received_t_signal, value);
			}
		});
		if (!!s_component) {
			s_component!.assure_hasConnection_atPriority(priority, connection);		// 2) register it
			return s_component;														// 3) return it
		}
		return null;
	}

	handle_reposition_widgets_atPriority(priority: number, ancestry: Ancestry | null, type: T_Hit_Target, onSignal: (value: any | null) => any ) {
		return this.handle_signals_atPriority([T_Signal.reposition], priority, ancestry, type, onSignal);
	}

	static readonly _____TRACKING: unique symbol;

	get anySignal_isInFlight(): boolean {
		return Object.values(this.signals_inFlight_dict_byT_Signal).some(flag => !!flag);
	}

	set_signal_isInFlight_for(t_signal: T_Signal, flag: boolean) {
		this.signals_inFlight_dict_byT_Signal[t_signal] = flag;
	}

	signal_isInFlight_for(t_signal: T_Signal): boolean {
		return this.signals_inFlight_dict_byT_Signal[t_signal];
	}

	static readonly _____PRIORITY: unique symbol;

	// for each signal type, this array contains the highest requested priority
	// for each signal sent, a signal is emitted for each priority separately, in increasing priority from 0 to highest
	// each handler has a type and a priority, and ignores all emitted signals except the one matching its priority

	adjust_highestPriority_forSignals(priority: number, t_signals: Array<T_Signal>) {
		for (const t_signal of t_signals) {
			this.adjust_highestPriority_forSignal(priority, t_signal);
		}
	}

	adjust_highestPriority_forSignal(priority: number, t_signal: T_Signal) {
		const highestPriority = this.highestPriorities[t_signal];
		if (!highestPriority || priority > highestPriority) {
			this.highestPriorities[t_signal] = priority;
		}
	}

	adjust_highestPriority_forAllSignals(priority: number) {
		const all_t_signals = [T_Signal.thing, T_Signal.rebuild, T_Signal.reposition, T_Signal.alteration];
		for (const t_signal of all_t_signals) {
			this.adjust_highestPriority_forSignal(priority, t_signal);
		}
	}

}

export const signals = new Signals();
