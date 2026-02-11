import type { Projected, O_Scene, Dimension_Rect } from '../types/Interfaces';
import { units, current_unit_system } from '../types/Units';
import type Smart_Object from '../runtime/Smart_Object';
import type { Axis } from '../runtime/Smart_Object';
import { Size, Point3 } from '../types/Coordinates';
import { mat4, vec3, vec4, quat } from 'gl-matrix';
import { T_Hit_3D } from '../types/Enumerations';
import { hits_3d } from '../managers/Hits_3D';
import { stores } from '../managers/Stores';
import { drag } from '../editors/Drag';
import { camera } from './Camera';
import { scene } from './Scene';
import Flatbush from 'flatbush';

class Render {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private size: Size = Size.zero;
  private dpr = 1;

  /** When true, faces render with debug colors. When false, faces are transparent. */
  debug = false;

  /** Per-frame list of front-facing faces for occlusion: world-space normal, offset, and screen-space polygon. */
  private occluding_faces: {
    n: vec3; d: number;            // face plane in world space (n·p = d)
    corners: vec3[];               // world-space corners
    poly: { x: number; y: number }[]; // screen-space polygon
    obj_id: string;
  }[] = [];

  /** Spatial index for screen-space face bounding boxes (rebuilt each frame). */
  private occluding_index: Flatbush | null = null;


  private mvp_matrix = mat4.create();

  /** Per-frame dimension rects for click-to-edit. Cleared each render(). */
  dimension_rects: Dimension_Rect[] = [];

  /** Logical (CSS) size — for external consumers like camera init. */
  get logical_size(): Size { return this.size; }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dpr = window.devicePixelRatio || 1;
    const w = canvas.width, h = canvas.height;
    this.size = new Size(w, h);
    this.apply_dpr(w, h);
  }

  resize(width: number, height: number): void {
    this.dpr = window.devicePixelRatio || 1;
    this.size = new Size(width, height);
    this.apply_dpr(width, height);
    camera.resize(this.size);
  }

  /** Set canvas buffer to physical pixels, CSS size to logical pixels. */
  private apply_dpr(w: number, h: number): void {
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }

  render(): void {
    this.ctx.clearRect(0, 0, this.size.width, this.size.height);
    this.dimension_rects = [];

    const objects = scene.get_all();
    const is_2d = stores.current_view_mode() === '2d';
    const solid = stores.is_solid();

    // Phase 1: project all vertices and update hit-test caches
    const projected_map = new Map<string, Projected[]>();
    for (const obj of objects) {
      const world_matrix = this.get_world_matrix(obj);
      const projected = obj.so.vertices.map((v) => this.project_vertex(v, world_matrix));
      projected_map.set(obj.id, projected);
      hits_3d.update_projected(obj.id, projected, world_matrix);
    }

    // Phase 2: fill front-facing faces (occlusion layer)
    // In solid mode, fill with white so rear edges are hidden.
    // Sort all front-facing faces back-to-front by average depth.
    if (!is_2d && solid) {
      const face_draws: { face: number[]; projected: Projected[]; z_avg: number; fi: number }[] = [];
      for (const obj of objects) {
        const projected = projected_map.get(obj.id)!;
        if (!obj.faces) continue;
        for (let fi = 0; fi < obj.faces.length; fi++) {
          const face = obj.faces[fi];
          if (this.face_winding(face, projected) >= 0) continue; // skip back-facing
          let z_sum = 0;
          for (const vi of face) z_sum += projected[vi].z;
          face_draws.push({ face, projected, z_avg: z_sum / face.length, fi });
        }
      }
      // Back-to-front: largest z (farthest) first
      face_draws.sort((a, b) => b.z_avg - a.z_avg);
      for (const { face, projected } of face_draws) {
        this.fill_face(face, projected, '#fff');
      }
    }

    // Phase 2b: debug face fills (non-solid mode)
    if (!is_2d && !solid) {
      for (const obj of objects) {
        const projected = projected_map.get(obj.id)!;
        if (!obj.faces) continue;
        // Back-facing first, then front-facing on top
        for (let fi = 0; fi < obj.faces.length; fi++) {
          if (this.face_winding(obj.faces[fi], projected) < 0) continue;
          this.draw_debug_face(obj.faces[fi], fi, projected);
        }
        for (let fi = 0; fi < obj.faces.length; fi++) {
          if (this.face_winding(obj.faces[fi], projected) >= 0) continue;
          this.draw_debug_face(obj.faces[fi], fi, projected);
        }
      }
    }

    // Build occluding face list for edge clipping (solid mode only)
    this.occluding_faces = [];
    if (!is_2d && solid) {
      for (const obj of objects) {
        const projected = projected_map.get(obj.id)!;
        if (!obj.faces) continue;
        const world = this.get_world_matrix(obj);
        const verts = obj.so.vertices;
        for (const face of obj.faces) {
          if (this.face_winding(face, projected) >= 0) continue;
          // Screen-space polygon
          const poly: { x: number; y: number }[] = [];
          let cam_behind = false;
          for (const vi of face) {
            if (projected[vi].w < 0) { cam_behind = true; break; }
            poly.push({ x: projected[vi].x, y: projected[vi].y });
          }
          if (cam_behind) continue;
          // World-space corners and plane
          const corners: vec3[] = [];
          for (const vi of face) {
            const lv = verts[vi];
            const wv = vec4.create();
            vec4.transformMat4(wv, [lv.x, lv.y, lv.z, 1], world);
            corners.push(vec3.fromValues(wv[0], wv[1], wv[2]));
          }
          const e1 = vec3.sub(vec3.create(), corners[1], corners[0]);
          const e2 = vec3.sub(vec3.create(), corners[3], corners[0]);
          const n = vec3.cross(vec3.create(), e1, e2);
          vec3.normalize(n, n);
          const d = vec3.dot(n, corners[0]);
          this.occluding_faces.push({ n, d, corners, poly, obj_id: obj.id });
        }
      }
      // Build spatial index from screen-space face bounding boxes
      if (this.occluding_faces.length > 0) {
        const index = new Flatbush(this.occluding_faces.length);
        for (const face of this.occluding_faces) {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const p of face.poly) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
          }
          index.add(minX, minY, maxX, maxY);
        }
        index.finish();
        this.occluding_index = index;
      } else {
        this.occluding_index = null;
      }
    }

    // Phase 2c: intersection lines between overlapping SOs
    if (!is_2d && objects.length > 1) {
      this.render_intersections(objects);
    }

    // Phase 3: draw edges
    for (const obj of objects) {
      const projected = projected_map.get(obj.id)!;
      const world = (!is_2d && solid) ? this.get_world_matrix(obj) : undefined;
      this.render_edges(obj, projected, is_2d, solid, world);
      this.render_face_names(obj, projected, world);
    }

    this.render_selection();
    if (stores.show_dimensionals()) this.render_dimensions();
    this.render_hover();
  }

  private get_world_matrix(obj: O_Scene): mat4 {
    const so = obj.so;
    const center: vec3 = [
      (so.x_min + so.x_max) / 2,
      (so.y_min + so.y_max) / 2,
      (so.z_min + so.z_max) / 2,
    ];
    const orientation = stores.current_view_mode() === '2d' ? quat.create() : so.orientation;
    const scale_vec = [obj.scale, obj.scale, obj.scale] as [number, number, number];

    // Rotate around the SO's exact 3D center: translate to center, rotate, translate back
    const local = mat4.create();
    mat4.fromTranslation(local, [-center[0], -center[1], -center[2]]);
    const rot = mat4.create();
    mat4.fromQuat(rot, orientation);
    mat4.multiply(local, rot, local);
    const from_center = mat4.create();
    mat4.fromTranslation(from_center, center);
    mat4.multiply(local, from_center, local);

    // Apply scale and position
    const scale_mat = mat4.create();
    mat4.fromScaling(scale_mat, scale_vec);
    mat4.multiply(local, scale_mat, local);
    const pos_mat = mat4.create();
    mat4.fromTranslation(pos_mat, obj.position);
    mat4.multiply(local, pos_mat, local);

    if (obj.parent) {
      const parent_world = this.get_world_matrix(obj.parent);
      mat4.multiply(local, parent_world, local);
    }

    return local;
  }

  private project_vertex(v: Point3, world_matrix: mat4): Projected {
    const point = vec4.fromValues(v.x, v.y, v.z, 1);

    mat4.multiply(this.mvp_matrix, camera.view, world_matrix);
    mat4.multiply(this.mvp_matrix, camera.projection, this.mvp_matrix);

    vec4.transformMat4(point, point, this.mvp_matrix);
    const w = point[3];
    return {
      x: (point[0] / w + 1) * 0.5 * this.size.width,
      y: (1 - point[1] / w) * 0.5 * this.size.height,
      z: point[2] / w,
      w,
    };
  }

  // Debug face colors: primary + secondary at 50% saturation
  // Face indices: 0=front(z_min), 1=back(z_max), 2=left(x_min), 3=right(x_max), 4=top(y_max), 5=bottom(y_min)
  private static readonly FACE_RGB = [
    [191, 64, 64],    // 0: front - red (50% sat)
    [64, 191, 64],    // 1: back - green
    [64, 64, 191],    // 2: left - blue
    [191, 191, 64],   // 3: right - yellow
    [64, 191, 191],   // 4: top - cyan
    [191, 64, 191],   // 5: bottom - magenta
  ];

  private fill_face(face: number[], projected: Projected[], color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(projected[face[0]].x, projected[face[0]].y);
    for (let i = 1; i < face.length; i++) {
      this.ctx.lineTo(projected[face[i]].x, projected[face[i]].y);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  private render_edges(obj: O_Scene, projected: Projected[], is_2d: boolean, solid: boolean, world?: mat4): void {
    const ctx = this.ctx;
    ctx.lineWidth = stores.line_thickness();
    ctx.lineCap = 'square';

    // In 2D or solid mode, only draw edges belonging to front-facing faces
    const front_edges = (is_2d || solid) ? this.front_face_edges(obj, projected) : null;

    // During face drag, highlight the guidance face's edges on the parent SO
    const guide = drag.guidance_face;
    const guidance_edges = (guide && guide.scene === obj) ? this.face_edge_keys(obj, guide.face_index) : null;

    if (solid && world) {
      // Solid mode: per-edge occlusion clipping, batch clipped segments by color
      const normal_path = new Path2D();
      const guide_path = new Path2D();

      for (const [i, j] of obj.edges) {
        const a = projected[i], b = projected[j];
        if (a.w < 0 || b.w < 0) continue;
        if (front_edges && !front_edges.has(`${Math.min(i, j)}-${Math.max(i, j)}`)) continue;

        const vi = obj.so.vertices[i], vj = obj.so.vertices[j];
        const wi = vec4.create(), wj = vec4.create();
        vec4.transformMat4(wi, [vi.x, vi.y, vi.z, 1], world);
        vec4.transformMat4(wj, [vj.x, vj.y, vj.z, 1], world);
        const w1 = vec3.fromValues(wi[0], wi[1], wi[2]);
        const w2 = vec3.fromValues(wj[0], wj[1], wj[2]);

        const visible = this.clip_segment_for_occlusion(
          { x: a.x, y: a.y }, { x: b.x, y: b.y }, w1, w2, obj.id
        );

        const edge_key = `${Math.min(i, j)}-${Math.max(i, j)}`;
        const path = guidance_edges?.has(edge_key) ? guide_path : normal_path;
        for (const [s, e] of visible) {
          path.moveTo(Math.round(s.x) + 0.5, Math.round(s.y) + 0.5);
          path.lineTo(Math.round(e.x) + 0.5, Math.round(e.y) + 0.5);
        }
      }

      ctx.strokeStyle = `${obj.color}1)`;
      ctx.stroke(normal_path);
      if (guidance_edges) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
        ctx.stroke(guide_path);
      }
    } else {
      // Non-solid: batch edges by color into single beginPath/stroke calls
      const normal_path = new Path2D();
      const guide_path = new Path2D();

      for (const [i, j] of obj.edges) {
        const a = projected[i], b = projected[j];
        if (a.w < 0 || b.w < 0) continue;
        if (front_edges && !front_edges.has(`${Math.min(i, j)}-${Math.max(i, j)}`)) continue;

        const ax = Math.round(a.x) + 0.5, ay = Math.round(a.y) + 0.5;
        const bx = Math.round(b.x) + 0.5, by = Math.round(b.y) + 0.5;

        const edge_key = `${Math.min(i, j)}-${Math.max(i, j)}`;
        const path = guidance_edges?.has(edge_key) ? guide_path : normal_path;
        path.moveTo(ax, ay);
        path.lineTo(bx, by);
      }

      ctx.strokeStyle = `${obj.color}1)`;
      ctx.stroke(normal_path);

      if (guidance_edges) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
        ctx.stroke(guide_path);
      }
    }
  }

  /**
   * Draw intersection lines between overlapping SOs (general case).
   * For each pair of faces (one from each SO), compute the plane-plane
   * intersection line, then clip it to both face quads.
   */
  private render_intersections(objects: O_Scene[]): void {
    const ctx = this.ctx;
    ctx.lineWidth = stores.line_thickness();

    // Build world-space face data for each object: normal, offset, 4 corner positions
    type WFace = { n: vec3; d: number; corners: vec3[] };
    const obj_faces: WFace[][] = [];

    for (const obj of objects) {
      const world = this.get_world_matrix(obj);

      const faces: WFace[] = [];
      const verts = obj.so.vertices; // local space
      const face_indices = obj.faces;
      if (!face_indices) { obj_faces.push([]); continue; }

      for (let fi = 0; fi < face_indices.length; fi++) {
        // Transform face corners to world space
        const corners: vec3[] = [];
        for (const vi of face_indices[fi]) {
          const lv = verts[vi];
          const wv = vec4.create();
          vec4.transformMat4(wv, [lv.x, lv.y, lv.z, 1], world);
          corners.push(vec3.fromValues(wv[0], wv[1], wv[2]));
        }

        // Derive normal from world-space corners (accounts for all transforms)
        const e1 = vec3.sub(vec3.create(), corners[1], corners[0]);
        const e2 = vec3.sub(vec3.create(), corners[3], corners[0]);
        const n = vec3.cross(vec3.create(), e1, e2);
        vec3.normalize(n, n);

        // Plane offset: d = n · p (any corner)
        const d = vec3.dot(n, corners[0]);
        faces.push({ n, d, corners });
      }
      obj_faces.push(faces);
    }

    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        for (const fA of obj_faces[i]) {
          for (const fB of obj_faces[j]) {
            this.intersect_face_pair(ctx, fA, fB, objects[j].color);
          }
        }
      }
    }
  }

  /**
   * Given two face planes in world space, compute their intersection line
   * and clip it to both face quads. Draw the resulting segment if any.
   */
  private intersect_face_pair(
    ctx: CanvasRenderingContext2D,
    fA: { n: vec3; d: number; corners: vec3[] },
    fB: { n: vec3; d: number; corners: vec3[] },
    color: string,
  ): void {
    const eps = 1e-8;

    // Line direction = cross(nA, nB)
    const dir = vec3.create();
    vec3.cross(dir, fA.n, fB.n);
    const dir_len = vec3.length(dir);
    if (dir_len < eps) return; // parallel planes
    vec3.scale(dir, dir, 1 / dir_len);

    // Find a point on the intersection line by solving
    // nA·p = dA, nB·p = dB as a 2×2 system.
    // Set the coordinate along dir's largest component to 0.
    const nA = fA.n, nB = fB.n, dA = fA.d, dB = fB.d;

    const abs_dir = [Math.abs(dir[0]), Math.abs(dir[1]), Math.abs(dir[2])];
    const max_axis = abs_dir[0] >= abs_dir[1] && abs_dir[0] >= abs_dir[2] ? 0
                   : abs_dir[1] >= abs_dir[2] ? 1 : 2;
    const a1 = (max_axis + 1) % 3, a2 = (max_axis + 2) % 3;

    const det = nA[a1] * nB[a2] - nA[a2] * nB[a1];
    if (Math.abs(det) < eps) return;

    const p0 = vec3.create();
    p0[a1] = (dA * nB[a2] - dB * nA[a2]) / det;
    p0[a2] = (nA[a1] * dB - nB[a1] * dA) / det;
    p0[max_axis] = 0;

    // Clip the infinite line (p0 + t*dir) to both face quads
    const result_a = this.clip_to_quad(p0, dir, fA.corners, fA.n, -1e6, 1e6);
    if (!result_a) return;

    const result = this.clip_to_quad(p0, dir, fB.corners, fB.n, result_a[0], result_a[1]);
    if (!result) return;

    const [tA, tB] = result;
    if (tA >= tB - eps) return;

    const start = vec3.scaleAndAdd(vec3.create(), p0, dir, tA);
    const end = vec3.scaleAndAdd(vec3.create(), p0, dir, tB);

    const identity = mat4.create();
    const s1 = this.project_vertex(new Point3(start[0], start[1], start[2]), identity);
    const s2 = this.project_vertex(new Point3(end[0], end[1], end[2]), identity);
    if (s1.w < 0 || s2.w < 0) return;

    ctx.strokeStyle = `${color}1)`;

    // Intersection lines: skip the two coplanar generating faces, not all faces from both objects
    const visible = this.clip_segment_for_occlusion(
      { x: s1.x, y: s1.y }, { x: s2.x, y: s2.y }, start, end, '', [fA, fB]
    );
    for (const [a, b] of visible) {
      ctx.beginPath();
      ctx.moveTo(Math.round(a.x) + 0.5, Math.round(a.y) + 0.5);
      ctx.lineTo(Math.round(b.x) + 0.5, Math.round(b.y) + 0.5);
      ctx.stroke();
    }
  }

  /**
   * Clip a segment against all occluding faces from other SOs.
   * Uses world-space face normals to determine which side of the face plane
   * each portion of the edge is on. The portion behind the face (and inside
   * the face's screen polygon) gets hidden.
   *
   * w1, w2: world-space endpoints of the edge segment.
   */
  private clip_segment_for_occlusion(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    w1: vec3,
    w2: vec3,
    skip_ids: string | string[],
    skip_planes?: { n: vec3; d: number }[],
  ): [{ x: number; y: number }, { x: number; y: number }][] {
    // Work entirely in screen space. World space is only used for front/behind test.
    let intervals: [number, number][] = [[0, 1]]; // screen-space t along p1→p2
    const skip = Array.isArray(skip_ids) ? skip_ids : [skip_ids];
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const identity = mat4.create();

    // Query spatial index for faces whose screen-space bounding boxes overlap this edge
    const edge_min_x = Math.min(p1.x, p2.x), edge_min_y = Math.min(p1.y, p2.y);
    const edge_max_x = Math.max(p1.x, p2.x), edge_max_y = Math.max(p1.y, p2.y);
    const candidates = this.occluding_index
      ? this.occluding_index.search(edge_min_x, edge_min_y, edge_max_x, edge_max_y)
      : this.occluding_faces.map((_, i) => i);

    for (const fi of candidates) {
      const face = this.occluding_faces[fi];
      if (!face) continue;
      if (skip.includes(face.obj_id)) continue;
      if (skip_planes && skip_planes.some(sp => {
        const dot = vec3.dot(sp.n, face.n);
        return (Math.abs(dot - 1) < 1e-6 && Math.abs(sp.d - face.d) < 1e-6) ||
               (Math.abs(dot + 1) < 1e-6 && Math.abs(sp.d + face.d) < 1e-6);
      })) continue;

      // Signed distances from edge endpoints to face plane (world space)
      const d1 = vec3.dot(face.n, w1) - face.d;
      const d2 = vec3.dot(face.n, w2) - face.d;

      if (d1 > 0 && d2 > 0) continue;

      // Find screen-space t where the segment crosses the face plane
      // by projecting the world-space crossing point to screen
      let s_behind_start = 0, s_behind_end = 1;
      if (d1 > 0 && d2 <= 0) {
        const t_cross = d1 / (d1 - d2);
        const wc = vec3.lerp(vec3.create(), w1, w2, t_cross);
        const pc = this.project_vertex(new Point3(wc[0], wc[1], wc[2]), identity);
        // Find screen t of the crossing point along p1→p2
        const cdx = pc.x - p1.x, cdy = pc.y - p1.y;
        s_behind_start = Math.abs(dx) > Math.abs(dy) ? cdx / dx : cdy / dy;
        s_behind_end = 1;
      } else if (d1 <= 0 && d2 > 0) {
        const t_cross = d1 / (d1 - d2);
        const wc = vec3.lerp(vec3.create(), w1, w2, t_cross);
        const pc = this.project_vertex(new Point3(wc[0], wc[1], wc[2]), identity);
        const cdx = pc.x - p1.x, cdy = pc.y - p1.y;
        s_behind_start = 0;
        s_behind_end = Math.abs(dx) > Math.abs(dy) ? cdx / dx : cdy / dy;
      }
      // else both behind: s_behind_start=0, s_behind_end=1

      // Clip the "behind" portion to the face's screen-space polygon
      const bs = { x: p1.x + dx * s_behind_start, y: p1.y + dy * s_behind_start };
      const be = { x: p1.x + dx * s_behind_end, y: p1.y + dy * s_behind_end };

      const clip = this.clip_segment_to_polygon_2d(bs, be, face.poly);
      if (!clip) continue;

      // Map clip t values back to the full screen-space [0,1] range
      const s_range = s_behind_end - s_behind_start;
      const s_enter = s_behind_start + clip[0] * s_range;
      const s_leave = s_behind_start + clip[1] * s_range;

      // Remove the occluded interval
      const new_intervals: [number, number][] = [];
      for (const [a, b] of intervals) {
        if (s_leave <= a || s_enter >= b) {
          new_intervals.push([a, b]);
          continue;
        }
        if (s_enter > a) new_intervals.push([a, s_enter]);
        if (s_leave < b) new_intervals.push([s_leave, b]);
      }
      intervals = new_intervals;
      if (intervals.length === 0) break;
    }

    return intervals.map(([a, b]) => [
      { x: p1.x + dx * a, y: p1.y + dy * a },
      { x: p1.x + dx * b, y: p1.y + dy * b },
    ]);
  }

  /**
   * 2D Cyrus-Beck: clip a segment (p1→p2, t in [0,1]) to a convex polygon.
   * Returns [t_enter, t_leave] or null if fully outside.
   */
  private clip_segment_to_polygon_2d(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    poly: { x: number; y: number }[],
  ): [number, number] | null {
    let t_enter = 0, t_leave = 1;
    const dx = p2.x - p1.x, dy = p2.y - p1.y;

    for (let i = 0; i < poly.length; i++) {
      const c0 = poly[i];
      const c1 = poly[(i + 1) % poly.length];

      // Inward-pointing normal for this edge (CW winding in screen space, Y-down)
      const ex = c1.x - c0.x, ey = c1.y - c0.y;
      const nx = ey, ny = -ex; // rotate edge 90 degrees right = inward for CW

      const denom = nx * dx + ny * dy;
      const num = nx * (p1.x - c0.x) + ny * (p1.y - c0.y);

      if (Math.abs(denom) < 1e-10) {
        // Segment parallel to edge — if outside, reject
        if (num < 0) return null;
        continue;
      }

      const t = -num / denom;
      if (denom > 0) {
        // Entering the half-plane
        if (t > t_enter) t_enter = t;
      } else {
        // Leaving the half-plane
        if (t < t_leave) t_leave = t;
      }

      if (t_enter > t_leave) return null;
    }

    if (t_enter >= t_leave) return null;
    return [t_enter, t_leave];
  }

  /**
   * Clip parameterized line (p0 + t*dir) to the interior of a convex quad.
   * Returns [t_min, t_max] or null if fully clipped away.
   * Uses Cyrus-Beck clipping against each edge of the quad.
   */
  private clip_to_quad(
    p0: vec3, dir: vec3,
    corners: vec3[], face_normal: vec3,
    t_min: number, t_max: number
  ): [number, number] | null {
    const n_edges = corners.length;
    for (let i = 0; i < n_edges; i++) {
      const c0 = corners[i];
      const c1 = corners[(i + 1) % n_edges];

      // Edge vector
      const edge = vec3.sub(vec3.create(), c1, c0);

      // Inward normal of this edge (cross of face normal with edge, pointing inward)
      const inward = vec3.cross(vec3.create(), face_normal, edge);

      // For the line p0 + t*dir, compute:
      //   dot(inward, p0 + t*dir - c0) >= 0  means "inside this edge"
      //   dot(inward, p0 - c0) + t * dot(inward, dir) >= 0
      const diff = vec3.sub(vec3.create(), p0, c0);
      const numer = vec3.dot(inward, diff);
      const alignment = vec3.dot(inward, dir);

      if (Math.abs(alignment) < 1e-12) {
        // Line parallel to edge — check which side
        if (numer < 0) return null; // outside
        continue;
      }

      const t = -numer / alignment;
      if (alignment > 0) {
        // Entering: line moves into inside half-plane
        if (t > t_min) t_min = t;
      } else {
        // Leaving: line moves out of inside half-plane
        if (t < t_max) t_max = t;
      }

      if (t_min > t_max) return null;
    }

    return [t_min, t_max];
  }

  private render_face_names(obj: O_Scene, projected: Projected[], world?: mat4): void {
    if (!obj.faces) return;
    const ctx = this.ctx;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const verts = obj.so.vertices;

    for (let fi = 0; fi < obj.faces.length; fi++) {
      const face = obj.faces[fi];
      const winding = this.face_winding(face, projected);
      if (winding >= 0 || Math.abs(winding) < 2000) continue; // skip back-facing and edge-on

      // Compute centroid of face in screen space
      let cx = 0, cy = 0, behind = false;
      for (const vi of face) {
        if (projected[vi].w < 0) { behind = true; break; }
        cx += projected[vi].x;
        cy += projected[vi].y;
      }
      if (behind) continue;
      cx /= face.length;
      cy /= face.length;

      // Occlusion: skip label if another SO's face is in front at this screen point
      if (world && this.is_point_occluded(cx, cy, face, verts, world, obj.id)) continue;

      ctx.fillText(obj.so.name, Math.round(cx), Math.round(cy));
    }
  }

  /** Check if a screen point is occluded by any front-facing face from a different object. */
  private is_point_occluded(
    sx: number, sy: number,
    face: number[], verts: Point3[], world: mat4,
    skip_id: string,
  ): boolean {
    if (this.occluding_faces.length === 0) return false;

    // World-space centroid of the face being labeled
    let wx = 0, wy = 0, wz = 0;
    for (const vi of face) {
      const lv = verts[vi];
      const wv = vec4.create();
      vec4.transformMat4(wv, [lv.x, lv.y, lv.z, 1], world);
      wx += wv[0]; wy += wv[1]; wz += wv[2];
    }
    wx /= face.length; wy /= face.length; wz /= face.length;
    const world_centroid: vec3 = [wx, wy, wz];

    // Query spatial index for candidate occluding faces near this screen point
    const candidates = this.occluding_index
      ? this.occluding_index.search(sx, sy, sx, sy)
      : this.occluding_faces.map((_, i) => i);

    for (const fi of candidates) {
      const occ = this.occluding_faces[fi];
      if (occ.obj_id === skip_id) continue;

      // Is the label centroid behind this face's plane?
      const dist = vec3.dot(occ.n, world_centroid) - occ.d;
      if (dist > 0) continue; // in front of this face, not occluded by it

      // Is the screen point inside this face's screen polygon?
      if (this.point_in_polygon_2d(sx, sy, occ.poly)) return true;
    }
    return false;
  }

  /** Ray-casting point-in-polygon test (2D screen space). */
  private point_in_polygon_2d(px: number, py: number, poly: { x: number; y: number }[]): boolean {
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

  private draw_debug_face(face: number[], fi: number, projected: Projected[]): void {
    const rgb = Render.FACE_RGB[fi] ?? [128, 128, 128];
    const alpha = this.debug ? 1 : 0;
    this.ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
    this.ctx.beginPath();
    this.ctx.moveTo(projected[face[0]].x, projected[face[0]].y);
    for (let i = 1; i < face.length; i++) {
      this.ctx.lineTo(projected[face[i]].x, projected[face[i]].y);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  private render_selection(): void {
    const sel = hits_3d.selection;
    if (!sel || !sel.so.scene) return;

    const projected = hits_3d.get_projected(sel.so.scene.id);
    if (!projected) return;

    this.ctx.fillStyle = 'blue';
    this.render_hit_dots(sel, projected);
  }

  private render_hover(): void {
    const hover = hits_3d.hover;
    if (!hover || !hover.so.scene) return;

    const projected = hits_3d.get_projected(hover.so.scene.id);
    if (!projected) return;

    this.ctx.fillStyle = 'red';
    this.render_hit_dots(hover, projected);
  }

  private render_hit_dots(hit: { so: { scene: O_Scene | null }, type: T_Hit_3D, index: number }, projected: Projected[]): void {
    if (!hit.so.scene) return;

    switch (hit.type) {
      case T_Hit_3D.corner:
        this.draw_dot(projected[hit.index]);
        break;
      case T_Hit_3D.edge:
        const [a, b] = hit.so.scene.edges[hit.index];
        const pa = projected[a], pb = projected[b];
        this.draw_dot(pa);
        this.draw_dot(pb);
        this.draw_dot(this.midpoint(pa, pb));
        break;
      case T_Hit_3D.face:
        const face = hit.so.scene.faces![hit.index];
        for (let i = 0; i < face.length; i++) {
          const p1 = projected[face[i]];
          const p2 = projected[face[(i + 1) % face.length]];
          this.draw_dot(p1);
          this.draw_dot(this.midpoint(p1, p2));
        }
        break;
    }
  }

  private draw_dot(p: Projected): void {
    if (p.w < 0) return;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private midpoint(a: Projected, b: Projected): Projected {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2, w: Math.min(a.w, b.w) };
  }

  // ═══════════════════════════════════════════════════════════════════
  // DIMENSION RENDERING
  // ═══════════════════════════════════════════════════════════════════

  private render_dimensions(): void {
    // Show dimensions for all objects, regardless of selection
    for (const obj of scene.get_all()) {
      const projected = hits_3d.get_projected(obj.id);
      if (!projected) continue;

      const so = obj.so;
      const world_matrix = this.get_world_matrix(obj);

      // In 2D mode, skip depth (z) — only show width and height
      const all_axes: Axis[] = stores.current_view_mode() === '2d' ? ['x', 'y'] : ['x', 'y', 'z'];
      for (const axis of all_axes) {
        this.render_axis_dimension(so, axis, projected, world_matrix);
      }
    }
  }

  private render_axis_dimension(
    so: Smart_Object,
    axis: Axis,
    projected: Projected[],
    world_matrix: mat4
  ): void {
    // Find the best edge for this axis
    const edge_info = this.find_best_edge_for_axis(so, axis, projected);
    if (!edge_info) return;

    const { v1_idx, v2_idx } = edge_info;
    const value = axis === 'x' ? so.width : axis === 'y' ? so.height : so.depth;

    // Get witness direction in screen space (perpendicular to edge on screen,
    // pointing away from object center). Fixed pixel distances regardless of scale.
    let witness_dir = this.edge_witness_direction(so, v1_idx, v2_idx, axis, projected, world_matrix);

    // Pick direction that points away from cube center
    const verts = so.vertices;
    const v1 = verts[v1_idx], v2 = verts[v2_idx];
    const edge_mid = new Point3((v1.x + v2.x) / 2, (v1.y + v2.y) / 2, (v1.z + v2.z) / 2);
    // Vector from SO center to edge midpoint — determines "outward"
    const cx = (so.x_min + so.x_max) / 2;
    const cy = (so.y_min + so.y_max) / 2;
    const cz = (so.z_min + so.z_max) / 2;
    const outward = new Point3(edge_mid.x - cx, edge_mid.y - cy, edge_mid.z - cz);
    const dot = witness_dir.x * outward.x + witness_dir.y * outward.y + witness_dir.z * outward.z;
    if (dot < 0) {
      witness_dir = new Point3(-witness_dir.x, -witness_dir.y, -witness_dir.z);
    }

    // Project edge endpoints to screen
    const p1 = projected[v1_idx], p2 = projected[v2_idx];
    if (p1.w < 0 || p2.w < 0) return;

    // Witness direction in screen space: project witness_dir via world matrix
    const origin_3d = new Point3(0, 0, 0);
    const p_origin = this.project_vertex(origin_3d, world_matrix);
    const p_witness = this.project_vertex(witness_dir, world_matrix);
    let wx = p_witness.x - p_origin.x, wy = p_witness.y - p_origin.y;
    const wlen = Math.sqrt(wx * wx + wy * wy);
    if (wlen < 0.001) return;
    wx /= wlen; wy /= wlen;

    // Fixed pixel distances
    const gap_px = 4;        // gap from edge to witness line start
    const dist_px = 20;      // edge to dimension line
    const ext_px = 8;        // extension past dimension line

    // Build all 6 screen-space points
    const pw1_start: Projected = { x: p1.x + wx * gap_px, y: p1.y + wy * gap_px, z: p1.z, w: p1.w };
    const pw2_start: Projected = { x: p2.x + wx * gap_px, y: p2.y + wy * gap_px, z: p2.z, w: p2.w };
    const pw1_end: Projected = { x: p1.x + wx * (dist_px + ext_px), y: p1.y + wy * (dist_px + ext_px), z: p1.z, w: p1.w };
    const pw2_end: Projected = { x: p2.x + wx * (dist_px + ext_px), y: p2.y + wy * (dist_px + ext_px), z: p2.z, w: p2.w };
    const pd1: Projected = { x: p1.x + wx * dist_px, y: p1.y + wy * dist_px, z: p1.z, w: p1.w };
    const pd2: Projected = { x: p2.x + wx * dist_px, y: p2.y + wy * dist_px, z: p2.z, w: p2.w };

    this.draw_dimension_3d(pw1_start, pw1_end, pw2_start, pw2_end, pd1, pd2, value, axis, so);
  }

  // Algorithm B: Pick the witness direction most perpendicular to the edge on screen.
  // The two candidates are the axes perpendicular to the edge axis in 3D.
  private edge_witness_direction(
    so: Smart_Object,
    v1_idx: number, v2_idx: number,
    edge_axis: Axis,
    projected: Projected[],
    world_matrix: mat4
  ): Point3 {

    // Edge direction on screen
    const ep1 = projected[v1_idx], ep2 = projected[v2_idx];
    const edge_dx = ep2.x - ep1.x, edge_dy = ep2.y - ep1.y;
    const edge_len = Math.sqrt(edge_dx * edge_dx + edge_dy * edge_dy);
    if (edge_len < 0.001) return so.axis_vector('x'); // degenerate
    const edge_ux = edge_dx / edge_len, edge_uy = edge_dy / edge_len;

    // The two candidate witness axes are perpendicular to the edge in 3D
    const all_axes: Axis[] = ['x', 'y', 'z'];
    const candidates = all_axes.filter(a => a !== edge_axis);

    // Project origin and each candidate unit vector to screen
    const origin = new Point3(0, 0, 0);
    const p0 = this.project_vertex(origin, world_matrix);

    let best_axis = candidates[0];
    let best_perp = -Infinity;

    for (const axis of candidates) {
      const unit_vec = axis === 'x' ? new Point3(1, 0, 0)
                     : axis === 'y' ? new Point3(0, 1, 0)
                     : new Point3(0, 0, 1);
      const p1 = this.project_vertex(unit_vec, world_matrix);
      const wx = p1.x - p0.x, wy = p1.y - p0.y;

      // Cross product magnitude = perpendicularity (scaled by witness length)
      const cross = Math.abs(edge_ux * wy - edge_uy * wx);

      if (cross > best_perp) {
        best_perp = cross;
        best_axis = axis;
      }
    }

    return so.axis_vector(best_axis);
  }

  // Algorithm A: Find the silhouette edge for a given axis.
  // A silhouette edge sits on the circumference — one adjacent face is front-facing,
  // the other is back-facing. There are always exactly 2 per axis; prefer the front one.
  private find_best_edge_for_axis(
    so: Smart_Object,
    axis: Axis,
    projected: Projected[]
  ): { p1: Projected; p2: Projected; v1_idx: number; v2_idx: number } | null {
    if (!so.scene?.faces) return null;
    const verts = so.vertices;
    const faces = so.scene.faces;
    const edges = so.scene.edges;

    // Build edge→face adjacency: for each edge, find which 2 faces contain it
    const edge_faces = (v1: number, v2: number): number[] => {
      const result: number[] = [];
      for (let fi = 0; fi < faces.length; fi++) {
        const face = faces[fi];
        // Check if both vertices appear adjacent in the face
        for (let i = 0; i < face.length; i++) {
          const a = face[i], b = face[(i + 1) % face.length];
          if ((a === v1 && b === v2) || (a === v2 && b === v1)) {
            result.push(fi);
            break;
          }
        }
      }
      return result;
    };

    type SilhouetteCandidate = {
      v1: number; v2: number;
      front_face: number;  // index of the front-facing adjacent face
    };
    const silhouettes: SilhouetteCandidate[] = [];

    // Check every edge in the topology
    for (const [v1, v2] of edges) {
      // Only consider edges along the target axis
      if (this.edge_axis(verts[v1], verts[v2]) !== axis) continue;

      const adj = edge_faces(v1, v2);
      if (adj.length !== 2) continue;

      const w0 = this.face_winding(faces[adj[0]], projected);
      const w1 = this.face_winding(faces[adj[1]], projected);

      // Silhouette: one front-facing (negative winding), one back-facing (positive)
      if (w0 < 0 && w1 >= 0) {
        silhouettes.push({ v1, v2, front_face: adj[0] });
      } else if (w1 < 0 && w0 >= 0) {
        silhouettes.push({ v1, v2, front_face: adj[1] });
      }
    }

    if (silhouettes.length === 0) return null;

    // Prefer the silhouette edge whose front-facing face is most toward the viewer
    // (most negative winding = most directly facing camera)
    silhouettes.sort((a, b) => {
      const wa = this.face_winding(faces[a.front_face], projected);
      const wb = this.face_winding(faces[b.front_face], projected);
      return wa - wb;  // most negative first
    });

    const best = silhouettes[0];
    const p1 = projected[best.v1], p2 = projected[best.v2];
    if (p1.w < 0 || p2.w < 0) return null;

    return { p1, p2, v1_idx: best.v1, v2_idx: best.v2 };
  }

  // Determine which axis an edge runs along (or null if diagonal)
  private edge_axis(v1: Point3, v2: Point3): Axis | null {
    const dx = Math.abs(v2.x - v1.x);
    const dy = Math.abs(v2.y - v1.y);
    const dz = Math.abs(v2.z - v1.z);
    const eps = 0.01;
    if (dx > eps && dy < eps && dz < eps) return 'x';
    if (dy > eps && dx < eps && dz < eps) return 'y';
    if (dz > eps && dx < eps && dy < eps) return 'z';
    return null;
  }

  /** Collect edge keys for a specific face (for guidance highlight). */
  private face_edge_keys(obj: O_Scene, face_index: number): Set<string> {
    const keys = new Set<string>();
    if (!obj.faces || face_index >= obj.faces.length) return keys;
    const face = obj.faces[face_index];
    for (let i = 0; i < face.length; i++) {
      const a = face[i], b = face[(i + 1) % face.length];
      keys.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
    }
    return keys;
  }

  /** Collect edge keys belonging to front-facing faces (for 2D mode). */
  private front_face_edges(obj: O_Scene, projected: Projected[]): Set<string> {
    const edges = new Set<string>();
    if (!obj.faces) return edges;
    for (const face of obj.faces) {
      if (this.face_winding(face, projected) >= 0) continue; // skip back-facing
      for (let i = 0; i < face.length; i++) {
        const a = face[i], b = face[(i + 1) % face.length];
        edges.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
      }
    }
    return edges;
  }

  // Compute face winding (negative = front-facing with CCW convention)
  private face_winding(face: number[], projected: Projected[]): number {
    if (face.length < 3) return Infinity;
    const p0 = projected[face[0]], p1 = projected[face[1]], p2 = projected[face[2]];
    if (p0.w < 0 || p1.w < 0 || p2.w < 0) return Infinity;
    return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
  }

  /** Check if a dimension's text rect is fully occluded by any front-facing face
   *  from a different SO that's closer to the camera.  Depth is computed by
   *  intersecting the camera ray through the dimension center with the face plane. */
  private dimension_occluded(
    cx: number, cy: number, w: number, h: number,
    dim_z: number, owner_id: string,
  ): boolean {
    const hw = w / 2 + 4, hh = h / 2 + 4;  // padding matches Dimensions.hit_test
    const rect_corners = [
      { x: cx - hw, y: cy - hh },
      { x: cx + hw, y: cy - hh },
      { x: cx + hw, y: cy + hh },
      { x: cx - hw, y: cy + hh },
    ];
    const center = new Point3(cx, cy, 0);  // screen point for ray cast

    for (const obj of scene.get_all()) {
      if (obj.so.id === owner_id) continue;
      if (!obj.faces) continue;
      const projected = hits_3d.get_projected(obj.id);
      if (!projected) continue;
      const world = this.get_world_matrix(obj);

      for (const face of obj.faces) {
        if (this.face_winding(face, projected) >= 0) continue;

        // Check all face vertices are in front of camera
        if (face.some(vi => projected[vi].w < 0)) continue;

        // Face polygon must contain all 4 corners of the text rect
        const poly = face.map(vi => ({ x: projected[vi].x, y: projected[vi].y }));
        if (!rect_corners.every(c => this.point_in_polygon_2d(c.x, c.y, poly))) continue;

        // Ray through dimension center → face plane intersection depth
        const face_z = hits_3d.face_depth_at(center, face, obj.so, world);
        if (face_z === null) continue;

        // Face is in front of the dimension → occluded
        if (face_z < dim_z) return true;
      }
    }
    return false;
  }

  private draw_dimension_3d(
    w1_start: Projected, w1_end: Projected,
    w2_start: Projected, w2_end: Projected,
    d1: Projected, d2: Projected,
    value: number,
    axis: Axis,
    so: Smart_Object
  ): void {
    // Check all points are in front of camera
    if (w1_start.w < 0 || w1_end.w < 0 || w2_start.w < 0 || w2_end.w < 0 || d1.w < 0 || d2.w < 0) return;

    const ctx = this.ctx;

    // Text setup
    ctx.font = '12px sans-serif';
    const text = units.format_for_system(value, current_unit_system(), stores.current_precision());
    const textWidth = ctx.measureText(text).width;
    const textHeight = 12; // approximate line height

    // Dimension line direction
    const midX = (d1.x + d2.x) / 2, midY = (d1.y + d2.y) / 2;
    const dim_z = (d1.z + d2.z) / 2;

    // Skip if occluded by a different SO's face
    if (this.dimension_occluded(midX, midY, textWidth, textHeight, dim_z, so.id)) return;

    const dx = d2.x - d1.x, dy = d2.y - d1.y;
    const lineLen = Math.sqrt(dx * dx + dy * dy);
    if (lineLen < 1) return;
    const ux = dx / lineLen, uy = dy / lineLen;

    // Algorithm C: compute gap as projected text bounding box onto dimension line
    const padding = 8;
    const gap = textWidth * Math.abs(ux) + textHeight * Math.abs(uy) + padding;
    const arrowSize = 20; // space needed for arrows in normal layout

    // Three cases based on available space
    if (lineLen < gap) {
      // Case 3: can't fit text at all — hide (including witness lines)
      return;
    }

    // Witness lines (only drawn if dimensional is visible)
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.7)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(w1_start.x, w1_start.y);
    ctx.lineTo(w1_end.x, w1_end.y);
    ctx.moveTo(w2_start.x, w2_start.y);
    ctx.lineTo(w2_end.x, w2_end.y);
    ctx.stroke();

    const halfGap = gap / 2;

    if (lineLen >= gap + arrowSize) {
      // Case 1: normal layout — arrows inside, pointing outward from text
      ctx.beginPath();
      ctx.moveTo(d1.x, d1.y);
      ctx.lineTo(midX - ux * halfGap, midY - uy * halfGap);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(midX + ux * halfGap, midY + uy * halfGap);
      ctx.lineTo(d2.x, d2.y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
      this.draw_arrow(d1.x, d1.y, dx, dy);
      this.draw_arrow(d2.x, d2.y, -dx, -dy);
    } else {
      // Case 2: inverted layout — extension lines go outward, arrows at witness lines point inward
      const extLen = 30; // how far extension lines go past witness lines

      // Extension lines go outward from d1 and d2
      ctx.beginPath();
      ctx.moveTo(d1.x, d1.y);
      ctx.lineTo(d1.x - ux * extLen, d1.y - uy * extLen);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(d2.x, d2.y);
      ctx.lineTo(d2.x + ux * extLen, d2.y + uy * extLen);
      ctx.stroke();

      // Arrows at d1/d2 (witness line positions), pointing inward toward text
      // draw_arrow: tip at (x,y), base extends in (dx,dy) direction
      ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
      this.draw_arrow(d1.x, d1.y, -dx, -dy);
      this.draw_arrow(d2.x, d2.y, dx, dy);
    }

    // Text centered between d1 and d2
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, midX, midY);

    // Record rect for click-to-edit (z = average depth of dimension line endpoints)
    this.dimension_rects.push({
      axis, so,
      x: midX, y: midY,
      w: textWidth, h: textHeight,
      z: (d1.z + d2.z) / 2,
    });
  }

  private draw_arrow(x: number, y: number, dx: number, dy: number): void {
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const ux = dx / len, uy = dy / len;
    const size = 6;

    // Arrow head pointing in direction (dx, dy)
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + ux * size - uy * size * 0.5, y + uy * size + ux * size * 0.5);
    ctx.lineTo(x + ux * size + uy * size * 0.5, y + uy * size - ux * size * 0.5);
    ctx.closePath();
    ctx.fill();
  }
}

export const render = new Render();
