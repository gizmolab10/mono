import { g, k, p, core, x, show, hits, Point, Angle, debug, signals, elements, g_graph_radial } from '../common/Global_Imports';
import { T_Startup, T_Preference, T_Hit_Target, T_Radial_Zone, T_Cluster_Pager } from '../common/Global_Imports';
import { G_Cluster, S_Rotation, S_Resizing } from '../common/Global_Imports';
import type { Dictionary } from '../types/Types';
import { G_Paging } from '../geometry/G_Paging';
import { G_Pages } from '../geometry/G_Pages';
import { get, writable } from 'svelte/store';

//////////////////////////////////
//								//
// 	manage rotation & resizing	//
//								//
//////////////////////////////////

export default class Radial {
	s_paging_dict_byName: Dictionary<S_Rotation> = {};
	g_pages_dict_byThingID: Dictionary<G_Pages> = {};
	cursor = k.cursor_default;
	zone = T_Radial_Zone.miss;
	s_resizing!: S_Resizing;
	s_rotation!: S_Rotation;
	s_paging!: S_Rotation;
	last_action = 0;

	w_rotate_angle	= writable<number>(0);
	w_g_paging		= writable<G_Paging>();
	w_g_cluster		= writable<G_Cluster | null>(null);
	w_resize_radius = writable<number>(k.radius.ring_minimum);
	
	constructor() {
		core.w_t_startup.subscribe((startup: T_Startup) => {
			if (startup == T_Startup.ready) {
				x.w_ancestry_focus.subscribe((ancestry) => {
					this.reset();
				});
			}
		});
	}

	get ring_radius(): number { return get(this.w_resize_radius); }
	get isDragging(): boolean { return this.s_hit_targets.some(s => s?.isDragging ?? false); }
	get s_pagings(): Array<S_Rotation> { return Object.values(this.s_paging_dict_byName); }
	get s_hit_targets(): Array<S_Rotation> { return [this.s_resizing, this.s_rotation, ...this.s_pagings]; }
	s_paging_forName_ofCluster(name: string): S_Rotation {
		return elements.assure_forKey_inDict(name, this.s_paging_dict_byName, () => {
			const s_paging = new S_Rotation(T_Hit_Target.paging);
			s_paging.cluster_name = name;
			s_paging.id = `${T_Hit_Target.paging}-${name}`;
			return s_paging;
		});
	}
	
	g_pages_forThingID(id: string | null | undefined): G_Pages | null {
		return !id ? null : elements.assure_forKey_inDict(id, this.g_pages_dict_byThingID, () => new G_Pages(id));
	}

	reset() {
		if (!this.s_paging) this.s_paging = new S_Rotation(T_Hit_Target.paging);
		if (!this.s_resizing) this.s_resizing = new S_Resizing();
		if (!this.s_rotation) this.s_rotation = new S_Rotation();
		this.s_pagings.map(s => s.reset());
		this.cursor = k.cursor_default;
		this.w_g_cluster.set(null);
		this.s_resizing.reset();
		this.s_rotation.reset();
		this.s_paging.reset();
		this.last_action = 0;
	}

	createAll_thing_pages_fromDict(dict: Dictionary | null) {
		if (!!dict) {
			for (const sub_dict of Object.values(dict)) {
				const g_pages = G_Pages.create_fromDict(sub_dict);
				if (!!g_pages) {
					this.g_pages_dict_byThingID[g_pages.thing_id] = g_pages;
				}
			}
		}
	}

	get cursor_forRingZone(): string {
		switch (this.ring_zone_atMouseLocation) {
			case T_Radial_Zone.resize: return this.s_resizing.cursor;
			case T_Radial_Zone.rotate: return this.s_rotation.cursor;
			case T_Radial_Zone.paging: return this.s_paging.cursor;
			default:				   return k.cursor_default;
		}
	}

	get ring_zone_atMouseLocation(): T_Radial_Zone {
		const mouse_vector = g.mouse_vector_ofOffset_fromGraphCenter();
		if (!!mouse_vector) {
			return this.ring_zone_atVector_relativeToGraphCenter(mouse_vector);
		}
		return T_Radial_Zone.miss;
	}

	update_fill_colors() {
		this.s_paging.update_fill_color();
		this.s_rotation.update_fill_color();
		this.s_resizing.update_fill_color();
	}

	static readonly _____RINGS: unique symbol;

	ring_zone_atScaled(scaled: Point): T_Radial_Zone {
		const mouse_vector = g.vector_fromScaled_mouseLocation_andOffset_fromGraphCenter(scaled);
		if (!!mouse_vector) {
			return this.ring_zone_atVector_relativeToGraphCenter(mouse_vector);
		}
		return T_Radial_Zone.miss;
	}

	ring_zone_atVector_relativeToGraphCenter(mouse_vector: Point): T_Radial_Zone {
		let ring_zone = T_Radial_Zone.miss;
		if (!!mouse_vector) {
			const show_cluster_sliders = get(show.w_t_cluster_pager) == T_Cluster_Pager.sliders;
			const g_cluster = g_graph_radial.g_cluster_atMouseLocation;
			const inner = get(radial.w_resize_radius);
			const distance = mouse_vector.magnitude;
			const thick = k.thickness.radial.ring;
			const thin = k.thickness.radial.arc;
			const outer = inner + thick;
			const thumb = inner + thin;
			if (!!distance) {
				if (distance < inner) {
					ring_zone = T_Radial_Zone.resize;
				} else if (distance < thumb && show_cluster_sliders && !!g_cluster && g_cluster.isMouse_insideThumb) {
					ring_zone = T_Radial_Zone.paging;
				} else if (distance <= outer) {
					ring_zone = T_Radial_Zone.rotate;
				}
			}
			debug.log_mouse(` ring zone ${ring_zone} ${distance.asInt()}`);
			debug.log_cursor(` ring zone ${ring_zone} ${mouse_vector.verbose}`);
		}
		return ring_zone;
	}

	handle_mouse_drag() {
		const mouse_vector = g.mouse_vector_ofOffset_fromGraphCenter();
		if (!!mouse_vector) {
			const rotate = this.s_rotation;
			const resize = this.s_resizing;
			const now = new Date().getTime();
			const g_cluster = get(this.w_g_cluster);
			const s_paging = g_cluster?.s_paging;
			const mouse_angle = mouse_vector.angle;
			if ((!!rotate && rotate.isDragging) || (!!resize && resize.isDragging) || !!g_cluster) {	// not overload DOM refresh
				window.getSelection()?.removeAllRanges();					// prevent text selection during dragging
			}
			if (!!resize && resize.isDragging && resize.basis_radius != null) {										// resize, check this FIRST (when both states return isDragging true, rotate should be ignored)
				const smallest = k.radius.ring_minimum;
				const largest = smallest * 3;
				const magnitude = mouse_vector.magnitude - resize.basis_radius;
				const distance = magnitude.force_between(smallest, largest);
				const ring_radius = get(this.w_resize_radius);
				const delta = distance - ring_radius;
				const radius = ring_radius + delta;
				resize.active_angle = mouse_angle + Angle.quarter;
				this.cursor = resize.cursor;
				if (Math.abs(delta) > 1 && ((now - this.last_action) > 500)) {				// granularity of 1 pixel & 1 tenth second
					this.last_action = now;
					debug.log_radial(` resize  D ${distance.asInt()}  R ${radius.asInt()}  + ${delta.toFixed(1)}`);
					this.w_resize_radius.set(radius);
					g.layout();
				}
			} else if (!!rotate && rotate.isDragging && rotate.basis_angle != null) {								// rotate clusters
				if (!signals.anySignal_isInFlight && ((now - this.last_action) > 75)) {		// 1 tenth second
					this.last_action = now;
					this.w_rotate_angle.set(mouse_angle.add_angle_normalized(-rotate.basis_angle));
					debug.log_radial(` rotate ${get(this.w_rotate_angle).asDegrees()}`);
					rotate.active_angle = mouse_angle;
					this.cursor = rotate.cursor;
					g.layout();										// reposition necklace widgets and arc sliders
				}
			} else if (!!g_cluster && !!s_paging && s_paging.active_angle != null) {
				const basis_angle = s_paging.basis_angle;
				const active_angle = s_paging.active_angle;
				const delta_angle = (active_angle - mouse_angle).angle_normalized_aroundZero();
				s_paging.active_angle = mouse_angle;
				this.cursor = s_paging.cursor;
				debug.log_radial(` page  ${delta_angle.asDegrees()}`);
				if (!!basis_angle && !!active_angle && basis_angle != active_angle && !!g_cluster && g_cluster.adjust_paging_index_byAdding_angle(delta_angle)) {
					g.layout();
				}
			}
		}
	}

	restore_radial_preferences() {
		this.w_rotate_angle.set( p.read_key(T_Preference.ring_angle) ?? 0);
		this.w_resize_radius.set( Math.max( p.read_key(T_Preference.ring_radius) ?? 0, k.radius.ring_minimum));
		core.w_t_startup.subscribe((startup: T_Startup) => {
			if (startup == T_Startup.ready) {
				this.w_rotate_angle.subscribe((angle: number) => {
					p.write_key(T_Preference.ring_angle, angle);
				});
				this.w_resize_radius.subscribe((radius: number) => {
					p.write_key(T_Preference.ring_radius, radius);
				});
				hits.w_s_hover.subscribe((s_hover) => {
					this.update_fill_colors();
				});
				this.w_g_paging.subscribe((g_paging: G_Paging) => {
					p.writeDB_key(T_Preference.paging, this.g_pages_dict_byThingID);
					if (!!g_paging) {
						g_graph_radial.layout_forChildren_cluster(g_paging.isCluster_ofChildren);
						g_graph_radial.layout_forPaging();
					}
				})
			}
		});
	}

}

export const radial = new Radial();