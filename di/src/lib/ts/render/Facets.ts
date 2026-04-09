import type { Projected, O_Scene } from '../types/Interfaces';
import { vec3 } from 'gl-matrix';

// --- Endpoint identity types ---

export enum T_Endpoint {
	pierce            = 'pierce',
	cross             = 'cross',
	occlude           = 'occlude',
	corner            = 'corner',
}

export type EndpointID =
	| { type: T_Endpoint.pierce; edge: string; face: string }
	| { type: T_Endpoint.cross; edgeA: string; edgeB: string }
	| { type: T_Endpoint.occlude; edgeA: string; edgeB: string }
	| { type: T_Endpoint.corner; so: string; vertex: number };

/** Map vertex index to letter: obj 0: 0→A, 1→B, ... 7→H; obj 1: 0→I, 1→J, ... 7→P */
export function vtx(i: number, obj_idx = 0): string { return String.fromCharCode(65 + i + obj_idx * 8); }

/** Map edge key "3-5" to letter form "D-F", with object-based offset for BETA (I-P) etc. */
let _obj_idx_map: Map<string, number> = new Map();
export function set_obj_idx_map(m: Map<string, number>): void { _obj_idx_map = m; }

function edge_letters(ek: string): string {
	// Split on first ':', convert only vertex digits (after the SO id)
	const colon = ek.indexOf(':');
	if (colon < 0) return ek;
	const so = ek.slice(0, colon);
	const oi = _obj_idx_map.get(so) ?? 0;
	const rest = ek.slice(colon).replace(/(\d+)/g, (_, n) => vtx(parseInt(n), oi));
	return so + rest;
}

export function endpoint_key(id: EndpointID): string {
	switch (id.type) {
		case T_Endpoint.pierce:  return `pierce:${edge_letters(id.edge)}:${id.face}`;
		case T_Endpoint.cross:   return `cross:${edge_letters(id.edgeA)}:${edge_letters(id.edgeB)}`;
		case T_Endpoint.occlude: return `occlude:${edge_letters(id.edgeA)}:${edge_letters(id.edgeB)}`;
		case T_Endpoint.corner:  return `c:${id.so}:${vtx(id.vertex, _obj_idx_map.get(id.so) ?? 0)}`;
	}
}

// --- Segment types ---

export type SegmentType = 'edge' | 'intersection' | 'crossing';

export interface Segment {
	id: string;
	so: string;           // O_Scene id
	face: number;         // face index within the SO
	type: SegmentType;
	endpoints: [string, string];  // two endpoint keys
	screen: [{ x: number; y: number }, { x: number; y: number }];  // screen coords for drawing
}

// --- Facet ---

export interface Facet {
	endpoints: string[];  // endpoint keys in order
	so: string;           // SO this facet belongs to (from the first segment's SO)
	face: number;         // face index within the SO
}

/** Ray-casting point-in-polygon test (screen space) */
function point_in_polygon(px: number, py: number, poly: { x: number; y: number }[]): boolean {
	let inside = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const yi = poly[i].y, yj = poly[j].y;
		if ((yi > py) !== (yj > py)) {
			const xi = poly[i].x + (py - yi) / (yj - yi) * (poly[j].x - poly[i].x);
			if (px < xi) inside = !inside;
		}
	}
	return inside;
}

// --- Endpoint ---

export interface Endpoint {
	key: string;
	id: EndpointID;
	segments: string[];       // segment IDs connected here
	ordering: string[];       // segment IDs in cyclic order (computed from 3D topology)
	screen: { x: number; y: number };  // screen coords for drawing
	world: vec3;              // world coords for occlusion testing
	label: string;            // debug display label (assigned during paint_labels)
}

// --- Graph ---

export class Facets {
	static _trace_logged = false;
	static _occlusion_logged = false;
	static _last_label_log = '';
	segments = new Map<string, Segment>();
	endpoints = new Map<string, Endpoint>();
	private id_to_name = new Map<string, string>();
	private id_to_obj_idx = new Map<string, number>(); // SO id → object index (0=ALPHA, 1=BETA, ...)
	private face_labels = new Map<string, string>(); // "obj_id:face_idx" → "ABFE" etc
	/** Replace obj IDs and face indices with readable names */
	private pretty(s: string): string {
		for (const [id, name] of this.id_to_name) s = s.split(id).join(name);
		for (const [face_key, label] of this.face_labels) s = s.split(face_key).join(label);
		return s;
	}

	add_segment(seg: Segment): void {
		this.segments.set(seg.id, seg);
		for (const ep_key of seg.endpoints) {
			const ep = this.endpoints.get(ep_key);
			if (ep) ep.segments.push(seg.id);
		}
	}

	add_endpoint(ep: Endpoint): void {
		this.endpoints.set(ep.key, ep);
	}

	get_or_create_endpoint(id: EndpointID, screen: { x: number; y: number }, world: vec3): Endpoint {
		const key = endpoint_key(id);
		let ep = this.endpoints.get(key);
		if (!ep) {
			ep = { key, id, segments: [], ordering: [], screen, world, label: '' };
			this.endpoints.set(key, ep);
		}
		return ep;
	}


	/** Compute the cyclic ordering at each endpoint.
	 *  Sort outgoing segments by screen-space angle. */
	compute_cyclic_ordering(): void {
		for (const ep of this.endpoints.values()) {
			if (ep.segments.length < 2) {
				ep.ordering = [...ep.segments];
				continue;
			}

			const angles: { seg_id: string; angle: number }[] = [];
			for (const seg_id of ep.segments) {
				const seg = this.segments.get(seg_id);
				if (!seg) continue;

				const other_key = seg.endpoints[0] === ep.key ? seg.endpoints[1] : seg.endpoints[0];
				const other_ep = this.endpoints.get(other_key);
				if (!other_ep) continue;

				const dx = other_ep.screen.x - ep.screen.x;
				const dy = other_ep.screen.y - ep.screen.y;
				angles.push({ seg_id, angle: Math.atan2(dy, dx) });
			}

			angles.sort((a, b) => a.angle - b.angle);

			ep.ordering = angles.map(a => a.seg_id);

			if (ep.id.type === T_Endpoint.cross && ep.segments.length >= 6 && !Facets._trace_logged) {
				const descs = angles.map(a => {
					const s = this.segments.get(a.seg_id);
					if (!s) return '?';
					const ok = s.endpoints[0] === ep.key ? s.endpoints[1] : s.endpoints[0];
					const oep = this.endpoints.get(ok);
					let label: string;
					if (oep?.id.type === T_Endpoint.corner) {
						const oi = this.id_to_obj_idx.get(oep.id.so) ?? 0;
						label = String.fromCharCode(65 + oep.id.vertex + oi * 8);
					} else {
						label = `(${oep?.screen.x.toFixed(0)},${oep?.screen.y.toFixed(0)})`;
					}
					const face_label = this.pretty(`${s.so}:${s.face}`);
					return `${label} ${(a.angle * 180 / Math.PI).toFixed(1)}° ${s.type[0]} ${face_label}`;
				});
				console.log(`screen angles at merged cross (${ep.screen.x.toFixed(0)},${ep.screen.y.toFixed(0)}): ${descs.join(' | ')}`);
			}
		}
	}

	clear(): void {
		this.segments.clear();
		this.endpoints.clear();
		this._seg_counter = 0;
	}

	private _seg_counter = 0;

	/** Ingest precomputed segments and endpoints from Render's compute phase. */
	ingest_precomputed(
		computed_endpoints: Map<string, { key: string; id: EndpointID; screen: { x: number; y: number }; world: vec3 }>,
		edge_segments: Map<string, { edge_key: string; so: string; visible: [{ x: number; y: number }, { x: number; y: number }][]; endpoint_keys: [string, string][] }[]>,
		intersection_segments: { visible: [{ x: number; y: number }, { x: number; y: number }][]; endpoint_keys: [string, string][]; so_a: string; face_a: number; so_b: string; face_b: number }[],
		occluding_segments: { so: string; face: number; screen: [{ x: number; y: number }, { x: number; y: number }]; endpoint_keys: [string, string] }[],
		objects: O_Scene[],
		projected_map: Map<string, Projected[]>,
		face_winding: (face: number[], projected: Projected[]) => number,
	): void {
		this.id_to_name.clear();
		this.id_to_obj_idx.clear();
		const idx_map = new Map<string, number>();
		this.face_labels.clear();
		for (let oi = 0; oi < objects.length; oi++) {
			const obj = objects[oi];
			this.id_to_name.set(obj.id, obj.so.name);
			this.id_to_obj_idx.set(obj.id, oi);
			idx_map.set(obj.id, oi);
			if (obj.faces) {
				for (let fi = 0; fi < obj.faces.length; fi++) {
					const corners = obj.faces[fi].map(v => vtx(v, oi)).join('');
					this.face_labels.set(`${obj.so.name}:${fi}`, `${obj.so.name}:${corners}`);
					// Also handle edge_letters format: face:D (where D = vtx(3))
					this.face_labels.set(`face:${vtx(fi)}:`, `face:${corners}:`);
					this.face_labels.set(`face:${vtx(fi)}`, `face:${corners}`);
				}
			}
		}
		set_obj_idx_map(idx_map);
		// Import endpoints
		for (const [key, cep] of computed_endpoints) {
			if (!this.endpoints.has(key)) {
				this.endpoints.set(key, {
					key: cep.key,
					id: cep.id,
					segments: [],
					ordering: [],
					screen: cep.screen,
					world: cep.world,
					label: '',
				});
			}
		}

		// Import edge segments: for each SO, each edge, each visible clip
		for (const [so_id, segs] of edge_segments) {
			const obj = objects.find(o => o.id === so_id);
			if (!obj?.faces) continue;
			const projected = projected_map.get(so_id);
			if (!projected) continue;

			for (const seg of segs) {
				// Determine which faces this edge belongs to
				const faces_for_edge: number[] = [];
				for (let fi = 0; fi < obj.faces.length; fi++) {
					if (face_winding(obj.faces[fi], projected) >= 0) continue;
					const face = obj.faces[fi];
					for (let k = 0; k < face.length; k++) {
						const a = face[k], b = face[(k + 1) % face.length];
						const ek = `${Math.min(a, b)}-${Math.max(a, b)}`;
						if (ek === seg.edge_key) { faces_for_edge.push(fi); break; }
					}
				}

				for (let ci = 0; ci < seg.visible.length; ci++) {
					const [s, e] = seg.visible[ci];
					const [sk, ek] = seg.endpoint_keys[ci];
					for (const fi of faces_for_edge) {
						const sid = 'seg:' + this._seg_counter++;
						const segment: Segment = {
							id: sid,
							so: so_id,
							face: fi,
							type: 'edge',
							endpoints: [sk, ek],
							screen: [s, e],
						};
						this.add_segment(segment);
					}
				}
			}
		}

		// Import intersection segments — one per face per clip interval
		for (const iseg of intersection_segments) {
			for (const [sk, ek] of iseg.endpoint_keys) {
				const s_ep = this.endpoints.get(sk);
				const e_ep = this.endpoints.get(ek);
				if (!s_ep || !e_ep) continue;
				for (const { so, face } of [
					{ so: iseg.so_a, face: iseg.face_a },
					{ so: iseg.so_b, face: iseg.face_b },
				]) {
					const sid = 'seg:' + this._seg_counter++;
					const segment: Segment = {
						id: sid, so, face,
						type: 'intersection',
						endpoints: [sk, ek],
						screen: [s_ep.screen, e_ep.screen],
					};
					this.add_segment(segment);
				}
			}
		}

		// Import cross-face edge segments.
		// An edge from one object may be a boundary on another object's face.
		// Dihedral test: only import if the source edge is on the silhouette of the source object
		// (i.e., not both adjacent faces are front-facing). If both faces are visible,
		// the edge is interior to the source object's surface and can't be a boundary elsewhere.
		// Relaxed rule: at least one endpoint must have a segment on the target face,
		// and at least one endpoint must be a shared point (pierce or cross).
		for (const [so_id, segs] of edge_segments) {
			const source_obj = objects.find(o => o.id === so_id);
			if (!source_obj?.faces) continue;
			const source_projected = projected_map.get(so_id);
			if (!source_projected) continue;

			for (const seg of segs) {
				// Dihedral test: skip edges where both adjacent faces are front-facing
				const edge_vi = seg.edge_key.split('-').map(Number);
				let both_faces_visible = false;
				if (edge_vi.length === 2) {
					const adj_faces: number[] = [];
					for (let sfi = 0; sfi < source_obj.faces.length; sfi++) {
						const fv = source_obj.faces[sfi];
						if (fv.includes(edge_vi[0]) && fv.includes(edge_vi[1])) adj_faces.push(sfi);
					}
					if (adj_faces.length === 2) {
						const f0_front = face_winding(source_obj.faces[adj_faces[0]], source_projected) < 0;
						const f1_front = face_winding(source_obj.faces[adj_faces[1]], source_projected) < 0;
						both_faces_visible = f0_front && f1_front;
					}
				}
				if (both_faces_visible) continue;

				for (let ci = 0; ci < seg.visible.length; ci++) {
					const [s, e] = seg.visible[ci];
					const [sk, ek] = seg.endpoint_keys[ci];
					const sk_ep = this.endpoints.get(sk);
					const ek_ep = this.endpoints.get(ek);
					if (!sk_ep || !ek_ep) continue;
					// At least one endpoint must be a shared point (pierce, cross, or occlude)
					const sk_shared = sk_ep.id.type === T_Endpoint.pierce || sk_ep.id.type === T_Endpoint.cross || sk_ep.id.type === T_Endpoint.occlude;
					const ek_shared = ek_ep.id.type === T_Endpoint.pierce || ek_ep.id.type === T_Endpoint.cross || ek_ep.id.type === T_Endpoint.occlude;
					if (!sk_shared && !ek_shared) continue;
					for (const other_obj of objects) {
						if (other_obj.id === so_id) continue;
						if (!other_obj.faces) continue;
						const other_projected = projected_map.get(other_obj.id);
						if (!other_projected) continue;
						for (let fi = 0; fi < other_obj.faces.length; fi++) {
							if (face_winding(other_obj.faces[fi], other_projected) >= 0) continue;
							// At least one endpoint must have a segment on this face
							let has_sk = false, has_ek = false;
							for (const seg_id of sk_ep.segments) {
								const s2 = this.segments.get(seg_id);
								if (s2 && s2.so === other_obj.id && s2.face === fi) { has_sk = true; break; }
							}
							for (const seg_id of ek_ep.segments) {
								const s2 = this.segments.get(seg_id);
								if (s2 && s2.so === other_obj.id && s2.face === fi) { has_ek = true; break; }
							}
							if (!has_sk && !has_ek) continue;
							// Stipulation 9.5: if an endpoint is a corner of the source object,
							// it must be inside the target face on screen
							const face_verts = other_obj.faces[fi];
							const face_poly = face_verts.map((vi: number) => ({ x: other_projected[vi].x, y: other_projected[vi].y }));
							const sk_is_source_corner = sk_ep.id.type === T_Endpoint.corner && sk_ep.id.so === so_id;
							const ek_is_source_corner = ek_ep.id.type === T_Endpoint.corner && ek_ep.id.so === so_id;
							if (sk_is_source_corner && !point_in_polygon(s.x, s.y, face_poly)) continue;
							if (ek_is_source_corner && !point_in_polygon(e.x, e.y, face_poly)) continue;
							const sid = 'seg:' + this._seg_counter++;
							this.add_segment({
								id: sid, so: other_obj.id, face: fi,
								type: 'edge', endpoints: [sk, ek], screen: [s, e],
							});
						}
					}
				}
			}
		}

		// Import occluding edge segments
		for (const oseg of occluding_segments) {
			const [sk, ek] = oseg.endpoint_keys;
			const [s, e] = oseg.screen;
			if (!this.endpoints.has(sk) || !this.endpoints.has(ek)) continue;

			if (oseg.face >= 0) {
				// Known face — import directly
				const sid = 'seg:' + this._seg_counter++;
				this.add_segment({
					id: sid, so: oseg.so, face: oseg.face,
					type: 'crossing', endpoints: [sk, ek], screen: [s, e],
				});
			} else {
				// face=-1: find faces by checking which faces already have both endpoints
				// (via existing edge segments on those faces)
				const obj = objects.find(o => o.id === oseg.so);
				if (!obj?.faces) continue;
				const projected = projected_map.get(oseg.so);
				if (!projected) continue;
				for (let fi = 0; fi < obj.faces.length; fi++) {
					if (face_winding(obj.faces[fi], projected) >= 0) continue;
					// Check if both endpoints appear on segments of this face
					let has_sk = false, has_ek = false;
					for (const seg of this.segments.values()) {
						if (seg.so !== oseg.so || seg.face !== fi) continue;
						if (seg.endpoints.includes(sk)) has_sk = true;
						if (seg.endpoints.includes(ek)) has_ek = true;
						if (has_sk && has_ek) break;
					}
					if (has_sk && has_ek) {
						const sid = 'seg:' + this._seg_counter++;
						this.add_segment({
							id: sid, so: oseg.so, face: fi,
							type: 'crossing', endpoints: [sk, ek], screen: [s, e],
						});
					}
				}
			}
		}
	}

	/** Debug: dump all segments at specific endpoints */
	dump_endpoint_segments(labels: string[]): void {
		for (const ep of this.endpoints.values()) {
			if (!labels.includes(ep.label)) continue;
			const segs = ep.segments.map(sid => {
				const s = this.segments.get(sid);
				if (!s) return '?';
				const a = this.endpoints.get(s.endpoints[0])?.label || '?';
				const b = this.endpoints.get(s.endpoints[1])?.label || '?';
				return `${s.type[0]}:${a}→${b} on ${s.so}:${s.face}`;
			});
			console.log(`endpoint ${ep.label} (${ep.id.type}, key=${ep.key}): ${segs.length} segments — ${segs.join(', ')}`);
		}
	}

	/** Trace closed facets per face per the design in facets.md:
	 *  1. Per face, build a mutable set of segments (excluding collinear duplicates — handled by ordering dedup)
	 *  2. Start from an edge-type segment, orient clockwise around the face
	 *  3. At each endpoint, pick the next clockwise segment from the remaining set
	 *  4. If next clockwise is consumed — dud
	 *  5. If closed — keep
	 *  6. Repeat until set empty */
	trace_facets(only_so?: string, only_face?: number, objects?: O_Scene[]): Facet[] {
		const facets: Facet[] = [];
		const log = !Facets._trace_logged;

		// Assign labels matching paint_labels — same filters, same order
		if (log) {
			// Corners first
			for (const ep of this.endpoints.values()) {
				if (ep.label) continue;
				if (ep.id.type === T_Endpoint.corner) {
					const oi = this.id_to_obj_idx.get(ep.id.so) ?? 0;
					ep.label = vtx(ep.id.vertex, oi);
				}
			}
			// Non-corners: same filters as paint_labels
			let next_lower = 0;
			for (const ep of this.endpoints.values()) {
				if (ep.label) continue;
				if (ep.id.type === T_Endpoint.corner) continue;
				if (ep.segments.length < 2) continue;
				const has_edge = ep.segments.some(sid => {
					const s = this.segments.get(sid);
					return s?.type === 'edge';
				});
				if (!has_edge) continue;
				ep.label = next_lower < 26
					? String.fromCharCode(97 + next_lower)
					: String.fromCharCode(97 + Math.floor((next_lower - 26) / 26)) + String.fromCharCode(97 + (next_lower - 26) % 26);
				next_lower++;
			}
		}

		if (log) {
			const pretty_field = (s: string) => {
				s = edge_letters(s); // convert digits to letters BEFORE replacing SO ids
				for (const [id, name] of this.id_to_name) s = s.split(id).join(name);
				return s;
			};
			for (const ep of this.endpoints.values()) {
				if (!ep.label) continue; // skip unlabeled (filtered out)
				if (ep.id.type === T_Endpoint.corner) {
					const pos = `(${ep.screen.x.toFixed(0)}, ${ep.screen.y.toFixed(0)})`;
					const w = `world(${ep.world[0].toFixed(1)}, ${ep.world[1].toFixed(1)}, ${ep.world[2].toFixed(1)})`;
					console.log(`  ${ep.label} = corner at ${pos} ${w}`);
					continue;
				}
				const type_name = ep.id.type === T_Endpoint.cross ? 'cross'
					: ep.id.type === T_Endpoint.occlude ? 'occlude' : 'pierce';
				const detail = (ep.id.type === T_Endpoint.cross || ep.id.type === T_Endpoint.occlude)
					? `${pretty_field(ep.id.edgeA)} x ${pretty_field(ep.id.edgeB)}`
					: `${pretty_field(ep.id.edge)} on ${pretty_field(ep.id.face)}`;
				const pos = `(${ep.screen.x.toFixed(0)}, ${ep.screen.y.toFixed(0)})`;
				const w = `world(${ep.world[0].toFixed(1)}, ${ep.world[1].toFixed(1)}, ${ep.world[2].toFixed(1)})`;
				console.log(`  ${ep.label} = ${type_name}: ${detail} at ${pos} ${w}`);
			}
		}

		const ep_label = (key: string) => {
			const ep = this.endpoints.get(key);
			return ep?.label || '?';
		};
		const seg_desc = (s: Segment) => `${s.type[0]}:${ep_label(s.endpoints[0])}→${ep_label(s.endpoints[1])}`;

		// Directed half-edge key: "seg_id>>from_ep_key" — encodes traversal direction
		const SEP = '>>';
		const half = (seg_id: string, from_ep: string) => `${seg_id}${SEP}${from_ep}`;

		// Group directed half-edges by (so, face)
		const by_face = new Map<string, Set<string>>();
		// Also track which segment IDs belong to each face (for logging and start selection)
		const face_segs = new Map<string, Set<string>>();
		for (const seg of this.segments.values()) {
			const key = `${seg.so}:${seg.face}`;
			if (!by_face.has(key)) by_face.set(key, new Set());
			if (!face_segs.has(key)) face_segs.set(key, new Set());
			// Two directed half-edges per segment
			by_face.get(key)!.add(half(seg.id, seg.endpoints[0]));
			by_face.get(key)!.add(half(seg.id, seg.endpoints[1]));
			face_segs.get(key)!.add(seg.id);
		}

		for (const [face_key, remaining] of by_face) {
			const [so, face_str] = face_key.split(':');
			const face = parseInt(face_str);
			if (only_so !== undefined && so !== only_so) continue;
			if (only_face !== undefined && face !== only_face) continue;

			const seg_ids = face_segs.get(face_key)!;

			if (log) {
				const segs = [...seg_ids].map(sid => this.segments.get(sid)!);
				const ec = segs.filter(s => s.type === 'edge').length;
				const ic = segs.filter(s => s.type === 'intersection').length;
				const xc = segs.filter(s => s.type === 'crossing').length;
				console.log(`\ntrace: ${this.pretty(face_key)} — ${seg_ids.size} segs (${ec}e ${ic}i ${xc}x)`);
				for (const s of segs) console.log(`  ${seg_desc(s)}`);
			}

			let trace_num = 0;
			const facet_halves = new Set<string>();  // half-edges used by completed facets
			while (remaining.size > 0) {
				trace_num++;
				// Pick a start half-edge: prefer edge-type, skip if reverse already used by a facet
				let start_half = '';
				let start_seg: Segment | undefined;
				let go_left_ep = '';

				// Try to find an edge-type segment with a remaining half-edge
				for (const h of remaining) {
					const seg_id = h.slice(0, h.indexOf(SEP));
					const from_ep = h.slice(h.indexOf(SEP) + SEP.length);
					const s = this.segments.get(seg_id);
					if (!s) continue;
					// Skip if reverse half was used by a completed facet (would trace the same polygon backwards)
					const other = s.endpoints[0] === from_ep ? s.endpoints[1] : s.endpoints[0];
					if (facet_halves.has(half(seg_id, other))) continue;
					if (s.type === 'edge') {
						start_half = h;
						start_seg = s;
						break;
					}
				}
				if (!start_seg) {
					// Fall back to any remaining half-edge (skip reverse-used)
					for (const h of remaining) {
						const seg_id = h.slice(0, h.indexOf(SEP));
						const from_ep = h.slice(h.indexOf(SEP) + SEP.length);
						const s = this.segments.get(seg_id);
						if (!s) continue;
						const other = s.endpoints[0] === from_ep ? s.endpoints[1] : s.endpoints[0];
						if (facet_halves.has(half(seg_id, other))) continue;
						start_half = h;
						start_seg = s;
						break;
					}
				}
				if (!start_seg) {
					// All remaining are reverse-halves of completed facets — done
					break;
				}

				const so = start_seg.so;
				const face = start_seg.face;

				// Determine go_left_ep from the half-edge's from_ep
				const start_from_ep = start_half.slice(start_half.indexOf(SEP) + SEP.length);
				// For edge-type segments with two corners, use face winding to pick direction
				if (objects && start_seg.type === 'edge') {
					const obj = objects.find(o => o.id === so);
					if (obj?.faces) {
						const face_verts = obj.faces[face];
						if (face_verts) {
							const ep0 = this.endpoints.get(start_seg.endpoints[0]);
							const ep1 = this.endpoints.get(start_seg.endpoints[1]);
							if (ep0?.id.type === T_Endpoint.corner && ep1?.id.type === T_Endpoint.corner) {
								const v0 = ep0.id.vertex;
								const v1 = ep1.id.vertex;
								const idx0 = face_verts.indexOf(v0);
								const idx1 = face_verts.indexOf(v1);
								if (idx0 >= 0 && idx1 >= 0) {
									const follows_winding = (idx0 + 1) % face_verts.length === idx1;
									go_left_ep = follows_winding ? start_seg.endpoints[1] : start_seg.endpoints[0];
								}
							}
						}
					}
				}
				// If winding didn't determine it, use the half-edge's implied direction
				if (!go_left_ep) {
					// The half-edge "seg:from_ep" means we enter from from_ep, so go_left_ep = from_ep
					// (we walk from from_ep toward the other end)
					go_left_ep = start_from_ep;
				}

				// Pick the half-edge matching our chosen direction
				start_half = half(start_seg.id, go_left_ep);
				if (!remaining.has(start_half)) {
					// That direction already consumed, try the other
					const other_ep = start_seg.endpoints[0] === go_left_ep ? start_seg.endpoints[1] : start_seg.endpoints[0];
					start_half = half(start_seg.id, other_ep);
					if (!remaining.has(start_half)) {
						// Both consumed — remove stale entries and continue
						remaining.delete(half(start_seg.id, start_seg.endpoints[0]));
						remaining.delete(half(start_seg.id, start_seg.endpoints[1]));
						continue;
					}
					go_left_ep = other_ep;
				}

				remaining.delete(start_half);
				const trace_used: string[] = [start_half];  // half-edges consumed by this trace
				// Block the reverse half-edge for this trace (can't use both sides in one facet)
				const blocked = new Set<string>();
				const reverse_start = half(start_seg.id, start_seg.endpoints[0] === go_left_ep ? start_seg.endpoints[1] : start_seg.endpoints[0]);
				if (remaining.has(reverse_start)) {
					remaining.delete(reverse_start);
					blocked.add(reverse_start);
				}

				if (log) {
					// console.log(`  #${trace_num}: start=${seg_desc(start_seg)} go=${ep_label(go_left_ep)} rem=${remaining.size}`);
				}

				const loop: string[] = [];
				let cur_seg = start_seg;
				let cur_ep_key = go_left_ep;
				let dud = false;
				let dud_reason = '';
				let safe = 0;

				while (safe++ < 200) {
					const other_ep_key = cur_seg.endpoints[0] === cur_ep_key ? cur_seg.endpoints[1] : cur_seg.endpoints[0];
					loop.push(other_ep_key);

					if (other_ep_key === go_left_ep && loop.length >= 3) {
						// if (log) console.log(`    ${safe}: ${ep_label(other_ep_key)} CLOSED`);
						break;
					}

					const other_ep = this.endpoints.get(other_ep_key);
					if (!other_ep || other_ep.ordering.length < 2) {
						dud = true;
						if (!other_ep) {
							dud_reason = `missing ${ep_label(other_ep_key)}`;
						} else {
							// Show ALL segments connected to this endpoint across all faces
							const all_segs = other_ep.segments.map(sid => {
								const s = this.segments.get(sid);
								if (!s) return '?';
								return `${seg_desc(s)} on ${this.pretty(`${s.so}:${s.face}`)}`;
							});
							const on_this_face = other_ep.segments.filter(sid => {
								const s = this.segments.get(sid);
								return s && s.so === so && s.face === face;
							}).length;
							dud_reason = `dead-end ${ep_label(other_ep_key)}: ${on_this_face} seg on this face, ${other_ep.segments.length} total across all faces [${all_segs.join(', ')}]`;
						}
						break;
					}
					// SO check: reject corners from other objects UNLESS they have segments on this face
					if (other_ep.id.type === T_Endpoint.corner && other_ep.id.so !== so) {
						const has_seg_on_face = other_ep.segments.some(sid => {
							const s2 = this.segments.get(sid);
							return s2 && s2.so === so && s2.face === face;
						});
						if (!has_seg_on_face) {
							dud = true;
							dud_reason = `${ep_label(other_ep_key)}: wrong SO (${other_ep.id.so} != ${so})`;
							break;
						}
					}
					const face_order = other_ep.ordering.filter(sid => {
						const s = this.segments.get(sid);
						return s && s.so === so && s.face === face;
					});

					const idx = face_order.indexOf(cur_seg.id);
					if (idx < 0) {
						dud = true;
						const choices = face_order.map(sid => { const s = this.segments.get(sid); return s ? seg_desc(s) : '?'; });
						dud_reason = `${ep_label(other_ep_key)}: cur not in order [${choices.join(' | ')}]`;
						break;
					}

					const next_id = face_order[(idx - 1 + face_order.length) % face_order.length];
					// Log face-filtered ordering at the merged cross point
					if (log && other_ep.id.type === T_Endpoint.cross && other_ep.segments.length >= 6) {
						const order_descs = face_order.map((sid, fi) => {
							const s = this.segments.get(sid);
							if (!s) return '?';
							const ok = s.endpoints[0] === other_ep.key ? s.endpoints[1] : s.endpoints[0];
							const oep = this.endpoints.get(ok);
							const lbl = ep_label(ok);
							return `${fi === idx ? '*' : ''}${lbl}`;
						});
						const next_seg = this.segments.get(next_id);
						const next_lbl = next_seg ? ep_label(next_seg.endpoints[0] === other_ep.key ? next_seg.endpoints[1] : next_seg.endpoints[0]) : '?';
						console.log(`  tracer at ${ep_label(other_ep.key)} on ${this.pretty(`${so}:${face}`)}: order=[${order_descs.join(', ')}] cur=*${ep_label(cur_seg.endpoints[0] === other_ep.key ? cur_seg.endpoints[1] : cur_seg.endpoints[0])} → next=${next_lbl}`);
					}
					// Check if the directed half-edge is available (entering from other_ep_key)
					const next_half = half(next_id, other_ep_key);
					if (!remaining.has(next_half)) {
						dud = true;
						const next_seg = this.segments.get(next_id);
						dud_reason = `${ep_label(other_ep_key)}: next consumed ${next_seg ? seg_desc(next_seg) : next_id}`;
						break;
					}

					// if (log) {
					// 	const next_seg = this.segments.get(next_id)!;
					// 	const choices = face_order.map(sid => { const s = this.segments.get(sid); return s ? seg_desc(s) : '?'; });
					// 	console.log(`    ${safe}: ${ep_label(other_ep_key)} [${choices.join(' | ')}] →${idx + 1 < choices.length ? idx + 1 : 0}→ ${seg_desc(next_seg)}`);
					// }

					remaining.delete(next_half);
					trace_used.push(next_half);
					// Block the reverse half-edge for this trace
					const next_seg_obj = this.segments.get(next_id)!;
					const reverse_next = half(next_id, next_seg_obj.endpoints[0] === other_ep_key ? next_seg_obj.endpoints[1] : next_seg_obj.endpoints[0]);
					if (remaining.has(reverse_next)) {
						remaining.delete(reverse_next);
						blocked.add(reverse_next);
					}

					cur_seg = next_seg_obj;
					cur_ep_key = other_ep_key;
				}

				// Restore blocked reverse half-edges for use by subsequent traces
				for (const b of blocked) remaining.add(b);

				if (!dud && loop.length >= 3) {
					facets.push({ endpoints: loop, so, face });
					for (const h of trace_used) facet_halves.add(h);
					if (log) {
							// Compute screen winding: positive = clockwise (y-down), negative = counter-clockwise
							let area = 0;
							for (let li = 0; li < loop.length; li++) {
								const ep0 = this.endpoints.get(loop[li]);
								const ep1 = this.endpoints.get(loop[(li + 1) % loop.length]);
								if (ep0 && ep1) area += (ep1.screen.x - ep0.screen.x) * (ep1.screen.y + ep0.screen.y);
							}
							const wind = area > 0 ? 'CW' : 'CCW';
							console.log(`  #${trace_num}: FACET ${loop.map(ep_label).join('→')} [${wind}]`);
						}
				} else {
					if (log) console.log(`  #${trace_num}: DUD ${dud_reason} | ${loop.map(ep_label).join('→')}`);
				}
			}
		}

		// Investigation: for each dead-end endpoint, show what connects and what's missing
		if (log) {
			console.log(`\n--- dead-end investigation ---`);
			for (const [face_key] of by_face) {
				const [so, face_str] = face_key.split(':');
				const face = parseInt(face_str);
				if (only_so !== undefined && so !== only_so) continue;
				if (only_face !== undefined && face !== only_face) continue;

				// Find all endpoints on this face and classify them
				const face_ep_keys = new Set<string>();
				for (const seg of this.segments.values()) {
					if (seg.so !== so || seg.face !== face) continue;
					face_ep_keys.add(seg.endpoints[0]);
					face_ep_keys.add(seg.endpoints[1]);
				}

				const dead_ends: Endpoint[] = [];
				for (const ek of face_ep_keys) {
					const ep = this.endpoints.get(ek);
					if (!ep) continue;
					const face_seg_count = ep.segments.filter(sid => {
						const s = this.segments.get(sid);
						return s && s.so === so && s.face === face;
					}).length;
					if (face_seg_count < 2) dead_ends.push(ep);
				}

				if (dead_ends.length === 0) continue;

				const face_label = this.pretty(face_key);
				console.log(`\n${face_label}: ${dead_ends.length} dead ends`);

				for (const dep of dead_ends) {
					const type_name = dep.id.type === T_Endpoint.corner ? 'corner'
						: dep.id.type === T_Endpoint.cross ? 'crossing'
						: dep.id.type === T_Endpoint.occlude ? 'occlude'
						: dep.id.type === T_Endpoint.pierce ? 'pierce'
						: 'unknown';

					// What segments connect HERE on this face?
					const here_segs = dep.segments
						.map(sid => this.segments.get(sid))
						.filter(s => s && s.so === so && s.face === face)
						.map(s => `${s!.type[0]}:${ep_label(s!.endpoints[0])}→${ep_label(s!.endpoints[1])}`);

					// What's in the cyclic ordering?
					const ordering_descs = dep.ordering.map(sid => {
						const s = this.segments.get(sid);
						if (!s) return '?';
						return `${s.type[0]}:${ep_label(s.endpoints[0])}→${ep_label(s.endpoints[1])} on ${this.pretty(`${s.so}:${s.face}`)}`;
					});

					console.log(`  ${ep_label(dep.key)} (${type_name}): ${dep.segments.length} total segs, ${here_segs.length} on this face [${here_segs.join(', ')}], ordering has ${dep.ordering.length} [${ordering_descs.join(', ')}]`);
				}
			}
		}

		if (log) {
			console.log(`\ntrace_facets: ${facets.length} facets total`);
			Facets._trace_logged = true;
		}
		return facets;
	}

	/** Paint facets that pass the occlusion test.
	 *  For each facet, test one vertex: unproject to the face's world plane,
	 *  check depth against occluding faces. If not occluded, fill. */
	paint_facets(
		traced: Facet[],
		ctx: CanvasRenderingContext2D,
		color: string,
		so_id: string,
		face_screen_polys: Map<number, { x: number; y: number }[]>,
		show_labels = false,
	): void {
		// Group facets by face
		const by_face = new Map<number, Facet[]>();
		for (const facet of traced) {
			if (facet.endpoints.length < 3) continue;
			if (facet.so !== so_id) continue;
			if (!by_face.has(facet.face)) by_face.set(facet.face, []);
			by_face.get(facet.face)!.push(facet);
		}

		for (const [fi, face_facets] of by_face) {
			const face_poly = face_screen_polys.get(fi);
			if (!face_poly) continue;

			// Clip to this face's screen polygon
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(face_poly[0].x, face_poly[0].y);
			for (let i = 1; i < face_poly.length; i++) ctx.lineTo(face_poly[i].x, face_poly[i].y);
			ctx.closePath();
			ctx.clip();

			// All facets on this face as sub-paths, even-odd fill.
			// Islands (facets enclosed by other facets) are automatically subtracted.
			ctx.fillStyle = color;
			ctx.beginPath();
			for (const facet of face_facets) {
				const first = this.endpoints.get(facet.endpoints[0]);
				if (!first) continue;
				ctx.moveTo(first.screen.x, first.screen.y);
				for (let ei = 1; ei < facet.endpoints.length; ei++) {
					const ep = this.endpoints.get(facet.endpoints[ei]);
					if (ep) ctx.lineTo(ep.screen.x, ep.screen.y);
				}
				ctx.closePath();
			}
			ctx.fill('evenodd');

			ctx.restore();

			// Label vertices outside clip (debug only)
			if (show_labels) {
				ctx.fillStyle = 'red';
				ctx.font = '14px monospace';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				for (const facet of face_facets) {
					for (let i = 0; i < facet.endpoints.length; i++) {
						const ep = this.endpoints.get(facet.endpoints[i]);
						if (ep) ctx.fillText(`${i}`, ep.screen.x, ep.screen.y - 8);
					}
				}
			}
		}

	}

	/** Draw debug labels — call AFTER all lines are drawn so backgrounds aren't covered. */
	paint_labels(
		ctx: CanvasRenderingContext2D,
		so_id: string,
		sel_projected?: Projected[],
		visible_verts?: Set<number>,
		occluding_faces?: { n: vec3; d: number; poly: { x: number; y: number }[]; obj_id: string }[],
		occluding_index?: { search(minX: number, minY: number, maxX: number, maxY: number): number[] } | null,
		point_in_polygon_2d?: (px: number, py: number, poly: { x: number; y: number }[]) => boolean,
	): void {
		ctx.font = '11px monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		const is_occluded = (sx: number, sy: number, world_pt: vec3, _label?: string): boolean => {
			if (!occluding_faces || !point_in_polygon_2d) return false;
			const candidates = occluding_index
				? occluding_index.search(sx, sy, sx, sy)
				: occluding_faces.map((_, i) => i);
			let dominated = false;
			for (const fi of candidates) {
				const occ = occluding_faces[fi];
				const dist = vec3.dot(occ.n, world_pt) - occ.d;
				const in_poly = point_in_polygon_2d(sx, sy, occ.poly);
				// if (label && !Facets._occlusion_logged) {
				// 	if (in_poly) {
				// 		console.log(`  occlusion check "${label}": occ=${this.pretty(occ.obj_id)} dist=${dist.toFixed(4)} in_poly=true → ${dist > 0 ? 'NOT occluded' : 'OCCLUDED'}`);
				// 	} else {
				// 		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
				// 		for (const p of occ.poly) {
				// 			if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
				// 			if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
				// 		}
				// 		console.log(`  occlusion check "${label}": occ=${this.pretty(occ.obj_id)} dist=${dist.toFixed(4)} in_poly=false pt=(${sx.toFixed(0)},${sy.toFixed(0)}) bbox=(${minX.toFixed(0)},${minY.toFixed(0)})-(${maxX.toFixed(0)},${maxY.toFixed(0)})`);
				// 	}
				// }
				if (dist > 0) continue;
				if (in_poly) { dominated = true; break; }
			}
			// if (label && !Facets._occlusion_logged && !dominated) {
			// 	console.log(`  occlusion check "${label}": NOT occluded (${candidates.length} candidates)`);
			// }
			return dominated;
		};

		const draw = (x: number, y: number, label: string) => {
			const w = ctx.measureText(label).width + 6;
			ctx.fillStyle = 'rgba(255,255,255,0.85)';
			ctx.fillRect(x - w / 2, y - 8, w, 16);
			ctx.fillStyle = '#333';
			ctx.fillText(label, x, y);
		};

		// 1. Selected SO corners: uppercase A-H from projected vertices
		if (sel_projected) {
			for (let vi = 0; vi < sel_projected.length; vi++) {
				if (visible_verts && !visible_verts.has(vi)) continue;
				const p = sel_projected[vi];
				if (p.w < 0) continue;
				const sel_oi = this.id_to_obj_idx.get(so_id) ?? 0;
				draw(p.x, p.y, vtx(vi, sel_oi));
				const corner_key = endpoint_key({ type: T_Endpoint.corner, so: so_id, vertex: vi });
				const corner_ep = this.endpoints.get(corner_key);
				if (corner_ep) corner_ep.label = vtx(vi, sel_oi);
			}
		}

		// 2. All other endpoints (skip selected SO corners — already labeled above)
		const labeled = new Set<string>();
		const all_labels: { label: string; key: string; ep: Endpoint }[] = [];
		let next_lower = 0;
		for (const ep of this.endpoints.values()) {
			if (ep.id.type === T_Endpoint.corner && ep.id.so === so_id) continue;
			if (ep.segments.length < 2) continue;
			// Skip fi/ex endpoints with no edge segments — phantom intersection exits
			if (ep.id.type === T_Endpoint.pierce || ep.id.type === T_Endpoint.cross || ep.id.type === T_Endpoint.occlude) {
				const has_edge = ep.segments.some(sid => {
					const s = this.segments.get(sid);
					return s?.type === 'edge';
				});
				if (!has_edge) continue;
			}
			if (labeled.has(ep.key)) continue;

			let label: string;
			if (ep.id.type === T_Endpoint.corner) {
				const oi = this.id_to_obj_idx.get(ep.id.so) ?? 0;
				label = vtx(ep.id.vertex, oi);
			} else {
				if (next_lower < 26) {
					label = String.fromCharCode(97 + next_lower);
				} else {
					const first = Math.floor((next_lower - 26) / 26);
					const second = (next_lower - 26) % 26;
					label = String.fromCharCode(97 + first) + String.fromCharCode(97 + second);
				}
				next_lower++;
			}

			if (false && is_occluded(ep.screen.x, ep.screen.y, ep.world)) continue; // disabled — too many false positives
			labeled.add(ep.key);
			ep.label = label;
			all_labels.push({ label, key: ep.key, ep });
			draw(ep.screen.x, ep.screen.y, label);
		}
		}


}
