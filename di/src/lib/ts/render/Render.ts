import type { Projected, O_Scene, Dimension_Rect } from '../types/Interfaces';
import { units, current_unit_system } from '../types/Units';
import type Smart_Object from '../runtime/Smart_Object';
import type { Axis } from '../runtime/Smart_Object';
import { Size, Point3 } from '../types/Coordinates';
import { T_Hit_3D } from '../types/Enumerations';
import { hits_3d } from '../managers/Hits_3D';
import { mat4, vec4, quat } from 'gl-matrix';
import { current_view_mode, show_dimensionals, current_precision } from './Setup';
import { camera } from './Camera';
import { scene } from './Scene';

class Render {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private size: Size = Size.zero;

  /** When true, faces render with debug colors. When false, faces are transparent. */
  debug = false;

  private mvp_matrix = mat4.create();

  /** Per-frame dimension rects for click-to-edit. Cleared each render(). */
  dimension_rects: Dimension_Rect[] = [];

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.size = new Size(canvas.width, canvas.height);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.size = new Size(width, height);
    camera.resize(this.size);
  }

  render(): void {
    this.ctx.clearRect(0, 0, this.size.width, this.size.height);
    this.dimension_rects = [];
    for (const obj of scene.get_all()) {
      this.render_object(obj);
    }
    this.render_selection();
    if (show_dimensionals()) this.render_dimensions();
    this.render_hover();
  }

  private get_world_matrix(obj: O_Scene): mat4 {
    const local = mat4.create();
    const scale_vec = [obj.scale, obj.scale, obj.scale] as [number, number, number];
    const orientation = current_view_mode() === '2d' ? quat.create() : obj.so.orientation;
    mat4.fromRotationTranslationScale(local, orientation, obj.position, scale_vec);

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

  private render_object(obj: O_Scene): void {
    const world_matrix = this.get_world_matrix(obj);
    const projected = obj.so.vertices.map((v) => this.project_vertex(v, world_matrix));
    hits_3d.update_projected(obj.id, projected);

    // Draw faces with debug colors (back faces first, then front faces on top)
    // In 2D mode, skip face fills entirely — edges only
    if (obj.faces && current_view_mode() !== '2d') {
      // First pass: back-facing faces
      for (let fi = 0; fi < obj.faces.length; fi++) {
        const face = obj.faces[fi];
        if (this.face_winding(face, projected) < 0) continue;
        this.draw_debug_face(face, fi, projected);
      }
      // Second pass: front-facing faces
      for (let fi = 0; fi < obj.faces.length; fi++) {
        const face = obj.faces[fi];
        if (this.face_winding(face, projected) >= 0) continue;
        this.draw_debug_face(face, fi, projected);
      }
    }

    const is_2d = current_view_mode() === '2d';
    this.ctx.lineWidth = is_2d ? 2 / 3 : 2;
    this.ctx.lineCap = 'round';

    // In 2D mode, only draw edges belonging to front-facing faces
    const front_edges = is_2d ? this.front_face_edges(obj, projected) : null;

    for (const [i, j] of obj.edges) {
      const a = projected[i],
        b = projected[j];
      if (a.w < 0 || b.w < 0) continue;
      if (front_edges && !front_edges.has(`${Math.min(i, j)}-${Math.max(i, j)}`)) continue;
      const alpha = is_2d ? 1 : 0.3 + 0.7 * (1 - (a.z + b.z) / 2);
      this.ctx.strokeStyle = `${obj.color}${Math.max(0.2, Math.min(1, alpha)).toFixed(2)})`;
      this.ctx.beginPath();
      this.ctx.moveTo(a.x, a.y);
      this.ctx.lineTo(b.x, b.y);
      this.ctx.stroke();
    }

    // Draw SO name on each front-facing face
    this.render_face_names(obj, projected);
  }

  private render_face_names(obj: O_Scene, projected: Projected[]): void {
    if (!obj.faces) return;
    const ctx = this.ctx;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let fi = 0; fi < obj.faces.length; fi++) {
      const face = obj.faces[fi];
      if (this.face_winding(face, projected) >= 0) continue; // skip back-facing

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

      ctx.fillText(obj.so.name, cx, cy);
    }
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
      const all_axes: Axis[] = current_view_mode() === '2d' ? ['x', 'y'] : ['x', 'y', 'z'];
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
    const dot = witness_dir.x * edge_mid.x + witness_dir.y * edge_mid.y + witness_dir.z * edge_mid.z;
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
    const text = units.format_for_system(value, current_unit_system(), current_precision());
    const textWidth = ctx.measureText(text).width;
    const textHeight = 12; // approximate line height

    // Dimension line direction
    const midX = (d1.x + d2.x) / 2, midY = (d1.y + d2.y) / 2;
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
    ctx.lineWidth = 1;
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

    // Record rect for click-to-edit
    this.dimension_rects.push({
      axis, so,
      x: midX, y: midY,
      w: textWidth, h: textHeight,
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
