import type { Projected, O_Scene } from '../types/Interfaces';
import { vec3, vec4, mat4 } from 'gl-matrix';

// --- Endpoint identity types ---

export enum T_Endpoint {
	face_intersection = 'face_intersection',
	occlusion_clip    = 'occlusion_clip',
	edge_crossing     = 'edge_crossing',
	corner            = 'corner',
}

export type EndpointID =
	| { type: T_Endpoint.face_intersection; faceA: string; faceB: string; end: 'start' | 'end' }
	| { type: T_Endpoint.occlusion_clip; edge: string; occluder_face: string; end: 'enter' | 'exit'; occluder_edge?: string }
	| { type: T_Endpoint.edge_crossing; edgeA: string; edgeB: string }
	| { type: T_Endpoint.corner; so: string; vertex: number };

/** Map vertex index to letter: 0→A, 1→B, ... 7→H */
export function vtx(i: number): string { return String.fromCharCode(65 + i); }

/** Map edge key "3-5" to letter form "D-F" */
function edge_letters(ek: string): string {
	// Split on first ':', convert only vertex digits (after the SO id)
	const colon = ek.indexOf(':');
	if (colon < 0) return ek;
	const so = ek.slice(0, colon);
	const rest = ek.slice(colon).replace(/(\d+)/g, (_, n) => vtx(parseInt(n)));
	return so + rest;
}

export function endpoint_key(id: EndpointID): string {
	switch (id.type) {
		case T_Endpoint.face_intersection: return `fi:${id.faceA}:${id.faceB}:${id.end}`;
		case T_Endpoint.occlusion_clip:    return `oc:${edge_letters(id.edge)}:${id.occluder_face}:${id.end}`;
		case T_Endpoint.edge_crossing:     return `ex:${edge_letters(id.edgeA)}:${edge_letters(id.edgeB)}`;
		case T_Endpoint.corner:            return `c:${id.so}:${vtx(id.vertex)}`;
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
	 *  For each face that has segments at this endpoint, project outgoing
	 *  segment directions onto the face's tangent plane and sort by angle. */
	compute_cyclic_ordering(
		objects: O_Scene[],
		projected_map: Map<string, Projected[]>,
		get_world_matrix: (obj: O_Scene) => mat4,
		face_winding: (face: number[], projected: Projected[]) => number,
	): void {
		// Build face tangent planes: for each (obj_id, face_index), store normal + u/v axes
		type TangentPlane = { n: vec3; u: vec3; v: vec3 };
		const planes = new Map<string, TangentPlane>();

		for (const obj of objects) {
			if (!obj.parent || !obj.faces) continue;
			const projected = projected_map.get(obj.id)!;
			const world = get_world_matrix(obj);
			const verts = obj.so.vertices;

			for (let fi = 0; fi < obj.faces.length; fi++) {
				const face = obj.faces[fi];
				if (face_winding(face, projected) >= 0) continue;

				const corners: vec3[] = [];
				for (const vi of face) {
					const wv = vec4.create();
					vec4.transformMat4(wv, [verts[vi][0], verts[vi][1], verts[vi][2], 1], world);
					corners.push(vec3.fromValues(wv[0], wv[1], wv[2]));
				}
				const e1 = vec3.sub(vec3.create(), corners[1], corners[0]);
				const e2 = vec3.sub(vec3.create(), corners[3], corners[0]);
				const n = vec3.cross(vec3.create(), e1, e2);
				vec3.normalize(n, n);
				const u = vec3.normalize(vec3.create(), e1);
				const v = vec3.cross(vec3.create(), n, u);
				vec3.normalize(v, v);
				planes.set(`${obj.id}:${fi}`, { n, u, v });
			}
		}

		// For each endpoint, compute ordering
		for (const ep of this.endpoints.values()) {
			if (ep.segments.length < 2) {
				ep.ordering = [...ep.segments];
				continue;
			}

			// Find a tangent plane — use the first segment's face
			const first_seg = this.segments.get(ep.segments[0]);
			if (!first_seg) continue;
			const plane = planes.get(`${first_seg.so}:${first_seg.face}`);
			if (!plane) continue;

			// Compute angle for each segment's outgoing direction
			const angles: { seg_id: string; angle: number }[] = [];
			for (const seg_id of ep.segments) {
				const seg = this.segments.get(seg_id);
				if (!seg) continue;

				// Find the other endpoint
				const other_key = seg.endpoints[0] === ep.key ? seg.endpoints[1] : seg.endpoints[0];
				const other_ep = this.endpoints.get(other_key);
				if (!other_ep) continue;

				// Direction from this endpoint to the other
				const dir = vec3.sub(vec3.create(), other_ep.world, ep.world);

				// Project onto tangent plane
				const du = vec3.dot(dir, plane.u);
				const dv = vec3.dot(dir, plane.v);

				angles.push({ seg_id, angle: Math.atan2(dv, du) });
			}

			angles.sort((a, b) => a.angle - b.angle);

			ep.ordering = angles.map(a => a.seg_id);
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
		this.face_labels.clear();
		for (const obj of objects) {
			this.id_to_name.set(obj.id, obj.so.name);
			if (obj.faces) {
				const p = obj === objects[1] ? "'" : '';
				for (let fi = 0; fi < obj.faces.length; fi++) {
					const corners = obj.faces[fi].map(v => vtx(v) + p).join('');
					this.face_labels.set(`${obj.so.name}:${fi}`, `${obj.so.name}:${corners}`);
					// Also handle edge_letters format: face:D (where D = vtx(3))
					this.face_labels.set(`face:${vtx(fi)}:`, `face:${corners}:`);
					this.face_labels.set(`face:${vtx(fi)}`, `face:${corners}`);
				}
			}
		}
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

		// Import occluding edge segments
		for (const oseg of occluding_segments) {
			const [sk, ek] = oseg.endpoint_keys;
			const [s, e] = oseg.screen;
			const sid = 'seg:' + this._seg_counter++;
			const segment: Segment = {
				id: sid,
				so: oseg.so,
				face: oseg.face,
				type: 'crossing',
				endpoints: [sk, ek],
				screen: [s, e],
			};
			this.add_segment(segment);
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
		const ep_label = (key: string) => {
			const ep = this.endpoints.get(key);
			return ep?.label || this.pretty(key);
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
						dud_reason = !other_ep ? `missing ${ep_label(other_ep_key)}` : `dead-end ${ep_label(other_ep_key)} (${other_ep.ordering.length} seg)`;
						break;
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

					const next_id = face_order[(idx + 1) % face_order.length];
					// Check if the directed half-edge is available (entering from other_ep_key)
					const next_half = half(next_id, other_ep_key);
					if (!remaining.has(next_half)) {
						dud = true;
						const next_seg = this.segments.get(next_id);
						dud_reason = `${ep_label(other_ep_key)}: next consumed ${next_seg ? seg_desc(next_seg) : next_id}`;
						break;
					}

					if (log) {
						const next_seg = this.segments.get(next_id)!;
						const choices = face_order.map(sid => { const s = this.segments.get(sid); return s ? seg_desc(s) : '?'; });
						// console.log(`    ${safe}: ${ep_label(other_ep_key)} [${choices.join(' | ')}] →${idx + 1 < choices.length ? idx + 1 : 0}→ ${seg_desc(next_seg)}`);
					}

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
					if (log) console.log(`  #${trace_num}: FACET ${loop.map(ep_label).join('→')}`);
				} else {
					if (log) console.log(`  #${trace_num}: DUD ${dud_reason} | ${loop.map(ep_label).join('→')}`);
				}
			}
		}

		if (log) {
			console.log(`trace_facets: ${facets.length} facets total`);
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

			for (const facet of face_facets) {
				ctx.fillStyle = color;
				ctx.beginPath();
				const first = this.endpoints.get(facet.endpoints[0])!;
				ctx.moveTo(first.screen.x, first.screen.y);
				for (let i = 1; i < facet.endpoints.length; i++) {
					const ep = this.endpoints.get(facet.endpoints[i]);
					if (ep) ctx.lineTo(ep.screen.x, ep.screen.y);
				}
				ctx.closePath();
				ctx.fill();

			}

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

		const is_occluded = (sx: number, sy: number, world_pt: vec3, label?: string): boolean => {
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
				draw(p.x, p.y, vtx(vi));
				const corner_key = endpoint_key({ type: T_Endpoint.corner, so: so_id, vertex: vi });
				const corner_ep = this.endpoints.get(corner_key);
				if (corner_ep) corner_ep.label = vtx(vi);
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
			if (ep.id.type === T_Endpoint.face_intersection || ep.id.type === T_Endpoint.edge_crossing) {
				const has_edge = ep.segments.some(sid => {
					const s = this.segments.get(sid);
					return s?.type === 'edge';
				});
				if (!has_edge) continue;
			}
			if (labeled.has(ep.key)) continue;

			let label: string;
			if (ep.id.type === T_Endpoint.corner) {
				label = vtx(ep.id.vertex) + "'";
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
