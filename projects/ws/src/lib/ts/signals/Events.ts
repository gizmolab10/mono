import { c, g, h, k, u, x, hits, g_graph_tree, debug, search, radial } from '../common/Global_Imports';
import { details, signals, controls, elements, features } from '../common/Global_Imports';
import { T_File_Extension, T_Predicate, T_Alteration } from '../common/Global_Imports';
import { T_Search, T_Action, T_Control } from '../common/Global_Imports';
import { Point, Ancestry, Predicate } from '../common/Global_Imports';
import { S_Mouse, S_Alteration } from '../common/Global_Imports';

import type { Dictionary } from '../types/Types';
import { get, writable } from 'svelte/store';
import Mouse_Timer from './Mouse_Timer';

export class Events {
	throttle_timers: Dictionary<ReturnType<typeof setTimeout> | null> = {};
	mouse_timer_dict_byName: Dictionary<Mouse_Timer> = {};
	initialTouch: Point | null = null;
	alterationTimer!: Mouse_Timer;

	w_count_details			= writable<number>(0);
	w_count_rebuild			= writable<number>(0);
	w_count_window_resized	= writable<number>(0);
	w_count_mouse_down		= writable<number>(0);
	w_count_mouse_up		= writable<number>(0);
	w_control_key_down		= writable<boolean>(false);
	w_mouse_button_down		= writable<boolean>(false);
	w_scaled_movement		= writable<Point | null>(null);
	w_mouse_location		= writable<Point>();
	w_mouse_location_scaled	= writable<Point>();

	static readonly _____UTILITIES: unique symbol;

	mouse_timer_forName(name: string): Mouse_Timer {
		return elements.assure_forKey_inDict(name, this.mouse_timer_dict_byName, () => new Mouse_Timer(name));
	}

	name_ofActionAt(t_action: number, column: number): string {
		return Object.keys(this.actions[T_Action[t_action]])[column];
	}

	throttle(key: string, defer_for: number = 50, callback: () => void): void {
		if (!this.throttle_timers[key]) {
			callback();
			this.throttle_timers[key] = setTimeout(() => {
				this.throttle_timers[key] = null;
			}, defer_for);
		}
	}

	static readonly _____SUBSCRIPTIONS: unique symbol;

	setup() {
		x.w_s_alteration.subscribe((s_alteration: S_Alteration | null) => { this.handle_s_alteration(s_alteration); });
		c.w_device_isMobile.subscribe((isMobile: boolean) => { this.subscribeTo_events(); });
	}

	private update_window_listener(name: string, handler: EventListenerOrEventListenerObject) {
		window.removeEventListener(name, handler);
		window.addEventListener(name, handler, { passive: false });
	}

	private update_document_listener(name: string, handler: EventListenerOrEventListenerObject) {
		document.removeEventListener(name, handler);
		document.addEventListener(name, handler, { passive: false });
	}

	private clear_event_subscriptions() {
		document.removeEventListener('mouseup',				this.handle_mouse_up);
		document.removeEventListener('mousemove',			this.handle_mouse_move);
		document.removeEventListener('touchend',			this.handle_touch_end);
		document.removeEventListener('touchmove',			this.handle_touch_move);
		document.removeEventListener('touchstart',			this.handle_touch_start);
	}

	private subscribeTo_events() {
		this.clear_event_subscriptions();
		this.update_document_listener('wheel',				this.handle_wheel);
		this.update_document_listener('keyup',				this.handle_key_up);
		this.update_document_listener('keydown',			this.handle_key_down);
		this.update_window_listener('resize',				this.handle_window_resize);
		this.update_document_listener('orientationchange',	this.handle_orientation_change);
		if (c.device_isMobile) {
			debug.log_action(`  mobile subscribe GRAPH`);
			document.addEventListener('touchend',			this.handle_touch_end, { passive: false });
			document.addEventListener('touchmove',			this.handle_touch_move, { passive: false });
			document.addEventListener('touchstart',			this.handle_touch_start, { passive: false });
		} else {
			document.addEventListener('mouseup',			this.handle_mouse_up, { passive: false });
			document.addEventListener('mousedown',			this.handle_mouse_down, { passive: false });
			document.addEventListener('mousemove',			this.handle_mouse_move, { passive: false });
		}
	}

	static readonly _____EVENT_HANDLERS: unique symbol;

	private handle_touch_end(event: TouchEvent) { this.initialTouch = null; }

	private handle_mouse_down = (event: MouseEvent) => {
		const location = new Point(event.clientX, event.clientY);
		const scaled = location.dividedEquallyBy(get(g.w_scale_factor));
		hits.handle_s_mouse_at(scaled, S_Mouse.down(event, null));
		hits.disable_hover = true;
		this.w_count_mouse_down.update(n => n + 1);
		this.w_scaled_movement.set(Point.zero);
		this.w_mouse_button_down.set(true);
	}

	private handle_mouse_up = (event: MouseEvent) => {
		const location = new Point(event.clientX, event.clientY);
		const scaled = location.dividedEquallyBy(get(g.w_scale_factor));
		hits.handle_s_mouse_at(scaled, S_Mouse.up(event, null));
		hits.disable_hover = false;
		this.w_scaled_movement.set(null);
		this.w_count_mouse_up.update(n => n + 1);
		this.w_mouse_button_down.set(false);
	}

	private handle_key_up(ev: Event) {
		const event = ev as KeyboardEvent;
		if (!!event && event.type == 'keyup') {
			e.w_control_key_down.set(event.ctrlKey);
		}
	}

	private handle_orientation_change(event: Event) {
		const isMobile = c.device_isMobile;
		debug.log_action(` orientation change [is${isMobile ? '' : ' not'} mobile] STATE`);
		c.w_device_isMobile.set(isMobile);
		g.restore_preferences();
	}

	private handle_touch_start(event: TouchEvent) {
		if (event.touches.length == 2) {
			const touch = event.touches[0];
			this.initialTouch = new Point(touch.clientX, touch.clientY);
			debug.log_action(` two-finger touches GRAPH`);
		}
	}

	private handle_window_resize = (event: Event) => {
		// on COMMAND +/-
		// and on simulator switches platform
		const isMobile = c.device_isMobile;
		this.w_count_window_resized.update(n => n + 1);		// observed by controls
		c.w_device_isMobile.set(isMobile);					// force reaction (unchanged)
		g.restore_preferences();
	}

	private handle_wheel(event: Event) {
		u.consume_event(event);
		if (!c.device_isMobile) {
			const e = event as WheelEvent;
			const userOffset = get(g.w_user_graph_offset);
			const delta = new Point(-e.deltaX, -e.deltaY);
			if (!!userOffset && features.allow_h_scrolling && delta.magnitude > 1) {
				debug.log_action(` wheel GRAPH`);
				g.set_user_graph_offsetTo(userOffset.offsetBy(delta));
			}
		}
	}

	private handle_touch_move(event: TouchEvent) {
		if (event.touches.length == 2) {
			u.consume_event(event);
			if (this.initialTouch) {
				const touch = event.touches[0];
				const deltaX = touch.clientX - this.initialTouch.x;
				const deltaY = touch.clientY - this.initialTouch.y;
				g.set_user_graph_offsetTo(new Point(deltaX, deltaY));
				debug.log_action(` two-finger touch move GRAPH`);
			}
		}
	}

	private handle_s_alteration(s_alteration: S_Alteration | null) {
		if (!this.alterationTimer) {
			this.alterationTimer = this.mouse_timer_forName('alteration');
		}
		if (!!s_alteration) {
			this.alterationTimer.alteration_start((invert) => {
				signals.signal_blink_forAlteration(invert);
			});
		} else {
			this.alterationTimer.alteration_stop();
			signals.signal_blink_forAlteration(false);
		}
	}

	private handle_mouse_move = (event: MouseEvent) => {
		const location = new Point(event.clientX, event.clientY);
		const scaled = location.dividedEquallyBy(get(g.w_scale_factor));
		const prior_scaled = get(this.w_mouse_location_scaled);
		const delta = prior_scaled?.vector_to(scaled) ?? null;
		if (!!delta && delta.magnitude > 1) {
			this.w_scaled_movement.set(delta);
		}
		this.w_mouse_location.set(location);
		this.w_mouse_location_scaled.set(scaled);
		hits.handle_mouse_movement_at(scaled);
	}

	handle_s_mouseFor_t_control(s_mouse: S_Mouse, t_control: T_Control) {
		if (s_mouse.isDown) {
			switch (t_control) {
				case T_Control.help:	controls.showHelp_home(); break;
				case T_Control.search:	search.activate(); break;
				// case T_Control.grow:	g.scaleBy(k.ratio.zoom_in) - 20; break;
				// case T_Control.shrink:	g.scaleBy(k.ratio.zoom_out) - 20; break;
				case T_Control.details: details.details_toggle_visibility(); break;
				default:				controls.togglePopupID(t_control); break;
			}
		}
	}

	handle_singleClick_onDragDot(shiftKey: boolean, ancestry: Ancestry) {
		if (ancestry.isBidirectional && ancestry.thing?.isRoot) {
			this.handle_singleClick_onDragDot(shiftKey, h.rootAncestry);
		} else if (!radial.isDragging) {
			x.w_s_title_edit?.set(null);
			if (!!get(x.w_s_alteration)) {
				h.ancestry_alter_connectionTo_maybe(ancestry);
				g.grand_build();
				return;
			} else if (!shiftKey) {
				let focus = ancestry;
				if (ancestry.isFocus && !!ancestry.parentAncestry) {
					focus = ancestry.parentAncestry;
				}
				if (focus.becomeFocus()) {
					g.grand_build();
					return;
				}
			} else if (shiftKey || ancestry.isGrabbed) {
				ancestry.toggleGrab();
			} else {
				ancestry.grabOnly();
			}
			g.layout();
		}
	}

	async handle_key_down(ev: Event) {
		const event = ev as KeyboardEvent;
		const isEditing = get(x.w_s_title_edit)?.isActive ?? false;
		if (!!event && event.type == 'keydown' && !isEditing) {
			const key = event.key.toLowerCase();
			const ancestry = get(x.w_ancestry_forDetails);
			const modifiers = ['alt',	'meta',	'shift',	'control'];
			let graph_needsSweep = false;
			e.w_control_key_down.set(event.ctrlKey);
			if (!!ancestry && !modifiers.includes(key)) {
				const OPTION = event.altKey;
				const SHIFT = event.shiftKey;
				const COMMAND = event.metaKey;
				const EXTREME = SHIFT && OPTION;
				if (get(search.w_t_search) != T_Search.off) {
					switch (key) {
						case 'enter':	
						case 'escape':
						case 'arrowright':	    search.deactivate_focus_and_grab(); break;	// stop searching		
						case 'arrowleft':		u.consume_event(event); search.activate(); break;
						case 'arrowup':			u.consume_event(event); search.next_row(false); break;
						case 'arrowdown':		u.consume_event(event); search.next_row(true); break;
						case 'tab':				search.selected_row = 0; break;
						case 'f':				search.activate(); break;			
					}
				} else {
					if (features.allow_graph_editing) {
						if (!!ancestry && features.allow_title_editing) {
							switch (key) {
								case 'enter':	ancestry.startEdit(); break;
								case 'd':		await h.thing_edit_persistentDuplicate(ancestry); break;
								case ' ':		await h.ancestry_edit_persistentCreateChildOf(ancestry); break;
								case '-':		if (!COMMAND) { await h.thing_edit_persistentAddLine(ancestry); } break;
								case 'tab':		await h.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break; // S_Title_Edit editor also makes this call
							}
						}
						switch (key) {
							case 'delete':
							case 'backspace':	await h.ancestries_rebuild_traverse_persistentDelete(x.si_grabs.items); break;
						}
					}
					if (!!ancestry) {
						switch (key) {
							case '/':			graph_needsSweep = ancestry.becomeFocus(); break;
							case 'arrowright':	u.consume_event(event); await h.ancestry_rebuild_persistentMoveRight(ancestry,  true, SHIFT, OPTION, EXTREME, false); break;
							case 'arrowleft':	u.consume_event(event); await h.ancestry_rebuild_persistentMoveRight(ancestry, false, SHIFT, OPTION, EXTREME, false); break;
						}
					}
					switch (key) {
						case 'a':				u.consume_event(event); break;
						case '!':				g.grand_adjust_toFit(); break;
						case '?':				controls.showHelp_home(); return;
						case 'm':				controls.toggle_graph_type(); break;
						case ']':				x.ancestry_next_focusOn(true); break;
						case '[':				x.ancestry_next_focusOn(false); break;
						case '>':				g_graph_tree.increase_depth_limit_by(1); break;
						case '<':				g_graph_tree.increase_depth_limit_by(-1); break;
						case 'p':				if (!COMMAND) { u.print_graph(); }; break;
						case 'f':				search.activate(); break;
						case 's':				h.persist_toFile(T_File_Extension.json); return;
						case 'c':				g.set_user_graph_offsetTo(Point.zero); return;
						case 'o':				h.select_file_toUpload(T_File_Extension.json, event.shiftKey); break;
						case '/':				if (!ancestry) { graph_needsSweep = h.rootAncestry?.becomeFocus(); } break;
						case 'escape':			if (!!get(x.w_s_alteration)) { h.stop_alteration(); }; search.deactivate(); break;
						case 'arrowup':			h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe( true, SHIFT, OPTION, EXTREME); break;
						case 'arrowdown':		h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe(false, SHIFT, OPTION, EXTREME); break;
					}
				}
			}
			if (graph_needsSweep) {
				g.grand_sweep();
			}
			if (features.allow_autoSave && !!h && h.db.isPersistent && h.isDirty) {
				setTimeout( async () => {
					await h.db.persist_all();
				}, 1);
			}
		}
	}

	async handle_action_clickedAt(s_mouse: S_Mouse, t_action: number, column: number, name: string) {
		const ancestry = get(x.w_ancestry_forDetails);	
		if (get(e.w_control_key_down)) {
			controls.showHelp_for(t_action, column);
		} else if (!!ancestry && !this.isAction_disabledAt(t_action, column) && !!h) {
			const a = this.actions;
			switch (t_action) {
				case T_Action.browse:			switch (column) {
					case a.browse.up:				h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe( true, false, false, false); break;
					case a.browse.down:				h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe(false, false, false, false); break;
					case a.browse.left:				await h.ancestry_rebuild_persistentMoveRight(ancestry, false, false, false, false, false); break;
					case a.browse.right:			await h.ancestry_rebuild_persistentMoveRight(ancestry,  true, false, false, false, false); break;
				}								break;
				case T_Action.focus:			switch (column) {
					case a.focus.selection:			ancestry.becomeFocus(); break;
					case a.focus.parent:			ancestry.collapse(); ancestry.parentAncestry?.becomeFocus(); break;
				}								break;
				case T_Action.show:				switch (column) {
					case a.show.selection:			break;
					case a.show.list:				h.ancestry_rebuild_persistentMoveRight(ancestry, !ancestry.isExpanded, false, false, false, true); break;
					case a.show.graph:				g.grand_adjust_toFit(); break;
				}								break;
				case T_Action.center:			switch (column) {
					case a.center.focus:			g.ancestry_place_atCenter(get(x.w_ancestry_focus)); break;
					case a.center.selection:		g.ancestry_place_atCenter(ancestry); break;
					case a.center.graph:			g.set_user_graph_offsetTo(Point.zero); break;
				}								break;
				case T_Action.add:				switch (column) {
					case a.add.child:				await h.ancestry_edit_persistentCreateChildOf(ancestry); break;
					case a.add.sibling:				await h.ancestry_edit_persistentCreateChildOf(ancestry.parentAncestry); break;
					case a.add.line:				await h.thing_edit_persistentAddLine(ancestry); break;
					case a.add.parent:				controls.toggle_alteration(ancestry, T_Alteration.add, Predicate.contains); break;
					case a.add.related:				controls.toggle_alteration(ancestry, T_Alteration.add, Predicate.isRelated); break;
				}								break;
				case T_Action.delete:			switch (column) {
					case a.delete.selection:		await h.ancestries_rebuild_traverse_persistentDelete(x.si_grabs.items); break;
					case a.delete.parent:			controls.toggle_alteration(ancestry, T_Alteration.delete, Predicate.contains); break;
					case a.delete.related:			controls.toggle_alteration(ancestry, T_Alteration.delete, Predicate.isRelated); break;
				}								break;
				case T_Action.move:				switch (column) {
					case a.move.up:					h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe( true, false, true, false); break;
					case a.move.down:				h.ancestry_rebuild_persistent_grabbed_atEnd_moveUp_maybe(false, false, true, false); break;
					case a.move.left:				await h.ancestry_rebuild_persistentMoveRight(ancestry, false, false, true, false, false); break;
					case a.move.right:				await h.ancestry_rebuild_persistentMoveRight(ancestry,  true, false, true, false, false); break;
				}								break;
			}
		}
	}

	isAction_disabledAt(t_action: number, column: number): boolean {		// true means disabled
		const ancestry = get(x.w_ancestry_forDetails);
		if (!!ancestry) {
			const is_altering = !!get(x.w_s_alteration);
			const no_children = !ancestry.hasChildren;
			const no_siblings = !ancestry.hasSiblings;
			const is_root = ancestry.isRoot;
			const a = this.actions;
			const disable_revealConceal = no_children || is_root || (controls.inRadialMode && ancestry.isFocus);
			switch (t_action) {
				case T_Action.browse:			switch (column) {
					case a.browse.left:				return is_root;
					case a.browse.up:				return no_siblings;
					case a.browse.down:				return no_siblings;
					case a.browse.right:			return no_children;
				}								break;
				case T_Action.focus:			switch (column) {
					case a.focus.selection:			return ancestry.isFocus;
					case a.focus.parent:			return !ancestry.parentAncestry || ancestry.parentAncestry.isFocus;
				}								break;
				case T_Action.show:				switch (column) {
					case a.show.selection:			return ancestry.isVisible;
					case a.show.list:				return disable_revealConceal;
					case a.show.graph:				return false;
				}								break;
				case T_Action.center:			switch (column) {
					case a.center.focus:			return g.ancestry_isCentered(get(x.w_ancestry_focus));
					case a.center.selection:		return g.ancestry_isCentered(ancestry);
					case a.center.graph:			return get(g.w_user_graph_offset).magnitude < 1;
				}								break;
				case T_Action.add:				switch (column) {
					case a.add.child:				return is_altering;
					case a.add.sibling:				return is_altering || is_root;
					case a.add.line:				return is_altering || is_root;
					case a.add.parent:				return is_root;
					case a.add.related:				return false;
				}								break;
				case T_Action.delete:			switch (column) {
					case a.delete.selection:		return is_altering || is_root;
					case a.delete.parent:			return !ancestry.hasParents_ofKind(T_Predicate.contains);
					case a.delete.related:			return !ancestry.hasParents_ofKind(T_Predicate.isRelated);
				}								break;
				case T_Action.move:				switch (column) {
					case a.move.left:				return is_root;
					case a.move.up:					return no_siblings || is_root;
					case a.move.down:				return no_siblings || is_root;
					case a.move.right:				return no_children || is_root;
				}								break;
			}
		}
		return true;
	}

	help_page_forActionAt(t_action: number, column: number): string {
		const a = this.actions;
		switch (t_action) {
			case T_Action.browse: 				return 'actions/browse';
			case T_Action.focus: 				return 'actions/focus';
			case T_Action.show:					switch (column) {
					case a.show.selection:			return 'actions/select';
					case a.show.list:				return 'actions/dots';
				}								break;
			case T_Action.center:				switch (column) {
					case a.center.focus:			return 'actions/focus';
					case a.center.selection:		return 'actions/select';
					case a.center.graph:			return 'looks/graph';
				}								break;
			default:							return 'actions/organize';
		}
		return k.empty;
	}

	private actions: Dictionary<Dictionary<number>> = {
		browse: {
			left: 0,
			up: 1,
			down: 2,
			right: 3,
		},
		focus: {
			selection: 0,
			parent: 1,
		},
		show: {
			selection: 0,
			list: 1,
			graph: 2,
		},
		center: {
			focus: 0,
			selection: 1,
			graph: 2,
		},
		add: {
			child: 0,
			sibling: 1,
			line: 2,
			parent: 3,
			related: 4,
		},
		delete: {
			selection: 0,
			parent: 1,
			related: 2,
		},
		move: {
			left: 0,
			up: 1,
			down: 2,
			right: 3,
		},
	};

}

export const e = new Events();
