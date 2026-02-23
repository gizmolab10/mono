import type { Compact_Attribute, Portable_Attribute, Portable_Axis, Repeater } from '../types/Interfaces';
import type { ConstantEntry } from '../algebra/User_Constants';
import type { Axis_Name, Bound } from '../types/Types';
import { Identifiable } from '../runtime';

export const CURRENT_VERSION = '7';

export interface Portable_SO {
	rotation_lock?: number;            // rotation axis: 0=x, 1=y, 2=z (default 0)
	repeater?: Repeater;
	parent_id?: string;
	x: Portable_Axis;
	y: Portable_Axis;
	z: Portable_Axis;
	name: string;
	id: string;
}

export interface Portable_Scene {
	camera: { eye: number[]; center: number[]; up: number[] };
	smart_objects: Portable_SO[];
	constants?: ConstantEntry[];
	selected_face?: number;
	selected_id?: string;
	root_id: string;
}

export interface Exported_File {
	scene: Portable_Scene;
	version: string;
}

/** Legacy v2 shape (flat bounds, orientation) — used only by migration code. */
interface Portable_SO_v2 {
	rotations?: { axis: Axis_Name; angle: number }[];
	formulas?: Record<string, string>;
	bounds: Record<Bound, number>;
	orientation?: number[];
	invariants?: number[];
	parent_name?: string;
	position?: number[];
	parent_id?: string;
	name: string;
	id: string;
}

/**
 * Versions — version-based migration chain.
 * Each step upgrades from version N to N+1.
 * Version comes from Exported_File wrapper (files) or CURRENT_VERSION fallback (bare localStorage).
 */
class Versions {

	migrate(raw: unknown, version: string): Portable_Scene {
		const v = parseInt(version) || 0;
		if (v >= parseInt(CURRENT_VERSION)) return raw as Portable_Scene;

		let data = raw as Record<string, unknown>;
		let sos = data.smart_objects as Record<string, unknown>[];
		if (!sos?.length) return raw as Portable_Scene;

		// v1/v2 → v3: legacy bounds → axis format (includes ID minting for v1)
		if (v < 3) {
			const result = this.migrate_legacy(data, sos as unknown as Portable_SO_v2[]);
			data = result as unknown as Record<string, unknown>;
			sos = data.smart_objects as unknown as Record<string, unknown>[];
		}

		// v3 → v4: array attributes → keyed object
		if (v < 4) {
			for (const so of sos) {
				for (const axis_name of ['x', 'y', 'z']) {
					const axis = (so as Record<string, Record<string, unknown>>)[axis_name];
					if (axis && Array.isArray(axis.attributes)) {
						const arr = axis.attributes as Portable_Attribute[];
						axis.attributes = { origin: arr[0], extent: arr[1], length: arr[2], angle: arr[3] };
					}
				}
			}
		}

		// v4 → v5: absolute child values → parent-relative offsets
		if (v < 5) {
			this.migrate_to_offsets(data as unknown as Portable_Scene);
		}

		// v5 → v6: rename standard_dimensions → constants
		if (v < 6) {
			if ('standard_dimensions' in data) {
				data.constants = data.standard_dimensions;
				delete data.standard_dimensions;
			}
		}

		// v6 → v7: repeater support — no data transformation needed

		return data as unknown as Portable_Scene;
	}

	/** v4 → v5: child position values become offsets from parent.
	 *  Old format stored absolute values + optional offset field.
	 *  New format: value IS the offset. */
	private migrate_to_offsets(scene_data: Portable_Scene): Portable_Scene {
		const sos = scene_data.smart_objects;
		if (!sos?.length) return scene_data;

		const has_children = sos.some(so => so.parent_id);
		if (!has_children) return scene_data;

		const by_id = new Map(sos.map(so => [so.id, so]));

		const read_value = (attr: Compact_Attribute): number =>
			typeof attr === 'number' ? attr : (attr.value ?? 0);

		for (const so of sos) {
			if (!so.parent_id) continue;
			const parent = by_id.get(so.parent_id);
			if (!parent) continue;
			for (const axis_name of ['x', 'y', 'z'] as const) {
				const child_attrs = so[axis_name].attributes;
				const parent_attrs = parent[axis_name].attributes;
				for (const key of ['origin', 'extent'] as const) {
					const child_attr = child_attrs[key];
					// Skip formula attrs — they produce absolute values at runtime
					if (typeof child_attr === 'object' && child_attr.formula) continue;
					// Old data with explicit offset field (pre-v5): use the offset directly
					const legacy = child_attr as Record<string, unknown>;
					if (typeof child_attr === 'object' && legacy.offset !== undefined) {
						child_attrs[key] = legacy.offset as number;
						continue;
					}
					// Otherwise compute offset: child_absolute - parent_absolute
					child_attrs[key] = read_value(child_attr) - read_value(parent_attrs[key]);
				}
			}
		}
		return scene_data;
	}

	private migrate_legacy(data: Record<string, unknown>, legacy_sos: Portable_SO_v2[]): Portable_Scene {
		// v1 → v2: mint ids if missing
		const needs_ids = legacy_sos.some(so => !so.id);
		const name_to_id = new Map<string, string>();

		if (needs_ids) {
			for (const so of legacy_sos) {
				if (!so.id) so.id = Identifiable.newID();
				name_to_id.set(so.name, so.id);
			}
			for (const so of legacy_sos) {
				if (so.parent_name && !so.parent_id) {
					so.parent_id = name_to_id.get(so.parent_name);
				}
				if (so.formulas) {
					for (const [bound, formula] of Object.entries(so.formulas)) {
						let rewritten = formula;
						for (const [name, id] of name_to_id) {
							rewritten = rewritten.replace(new RegExp(`\\b${this.escape_regex(name)}\\.`, 'g'), `${id}.`);
						}
						so.formulas[bound] = rewritten;
					}
				}
			}
		}

		// v2 → current: convert each SO
		const migrated: Portable_SO[] = legacy_sos.map(old => this.migrate_so(old));

		// Resolve root_id and selected_id from legacy name fields if needed
		let root_id = (data.root_id as string) ?? '';
		let selected_id = data.selected_id as string | undefined;
		if (!root_id && data.root_name) {
			root_id = name_to_id.get(data.root_name as string) ?? migrated[0]?.id ?? '';
		}
		if (!selected_id && data.selected_name) {
			selected_id = name_to_id.get(data.selected_name as string);
		}
		if (!root_id && migrated.length > 0) {
			root_id = migrated[0].id;
		}

		return {
			smart_objects: migrated,
			camera: data.camera as Portable_Scene['camera'],
			root_id,
			selected_id,
			selected_face: data.selected_face as number | undefined,
		};
	}

	/** Convert a single legacy Portable_SO_v2 → Portable_SO */
	private migrate_so(old: Portable_SO_v2): Portable_SO {
		const bounds = old.bounds;
		const axis_names: Axis_Name[] = ['x', 'y', 'z'];
		const axes: Record<string, Portable_Axis> = {};

		for (let i = 0; i < 3; i++) {
			const name = axis_names[i];
			const min_key = `${name}_min` as Bound;
			const max_key = `${name}_max` as Bound;
			const start: Portable_Attribute = { value: bounds[min_key] };
			const end: Portable_Attribute = { value: bounds[max_key] };
			if (old.formulas?.[min_key]) start.formula = old.formulas[min_key];
			if (old.formulas?.[max_key]) end.formula = old.formulas[max_key];
			const length: Portable_Attribute = { value: bounds[max_key] - bounds[min_key] };
			let angle: Portable_Attribute = { value: 0 };
			if (old.rotations) {
				const rot = old.rotations.find(r => r.axis === name);
				if (rot && Math.abs(rot.angle) > 1e-10) angle = { value: rot.angle };
			}
			const pa: Portable_Axis = { attributes: { origin: start, extent: end, length, angle } };
			if (old.invariants && old.invariants[i] !== 2) pa.invariant = old.invariants[i];
			axes[name] = pa;
		}

		const result: Portable_SO = {
			id: old.id,
			name: old.name,
			x: axes.x,
			y: axes.y,
			z: axes.z,
		};

		if (old.parent_id) result.parent_id = old.parent_id;

		return result;
	}

	private escape_regex(s: string): string {
		return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}

export const versions = new Versions();
