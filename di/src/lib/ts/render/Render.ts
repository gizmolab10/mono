import { mat4, vec4 } from 'gl-matrix';
import type { Projected, O_Scene } from '../types/Interfaces';
import { Size, Point3 } from '../types/Coordinates';
import { hits_3d } from '../managers/Hits_3D';
import { T_Hit_3D } from '../types/Enumerations';
import type Smart_Object from '../runtime/Smart_Object';
import type { Axis } from '../runtime/Smart_Object';
import { camera } from './Camera';
import { scene } from './Scene';

class Render {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private size: Size = Size.zero;

  private mvp_matrix = mat4.create();

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
    for (const obj of scene.get_all()) {
      this.render_object(obj);
    }
    this.render_selection();
    this.render_dimensions();
    this.render_hover();
  }

  private get_world_matrix(obj: O_Scene): mat4 {
    const local = mat4.create();
    const scale_vec = [obj.scale, obj.scale, obj.scale] as [number, number, number];
    mat4.fromRotationTranslationScale(local, obj.orientation, obj.position, scale_vec);

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
    if (obj.faces) {
      // First pass: back-facing faces
      for (let fi = 0; fi < obj.faces.length; fi++) {
        const face = obj.faces[fi];
        if (this.face_winding(face, projected) < 0) continue; // skip front-facing
        this.draw_debug_face(face, fi, projected);
      }
      // Second pass: front-facing faces
      for (let fi = 0; fi < obj.faces.length; fi++) {
        const face = obj.faces[fi];
        if (this.face_winding(face, projected) >= 0) continue; // skip back-facing
        this.draw_debug_face(face, fi, projected);
      }
    }

    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';

    for (const [i, j] of obj.edges) {
      const a = projected[i],
        b = projected[j];
      if (a.w < 0 || b.w < 0) continue;
      const alpha = 0.3 + 0.7 * (1 - (a.z + b.z) / 2);
      this.ctx.strokeStyle = `${obj.color}${Math.max(0.2, Math.min(1, alpha)).toFixed(2)})`;
      this.ctx.beginPath();
      this.ctx.moveTo(a.x, a.y);
      this.ctx.lineTo(b.x, b.y);
      this.ctx.stroke();
    }
  }

  private draw_debug_face(face: number[], fi: number, projected: Projected[]): void {
    const rgb = Render.FACE_RGB[fi] ?? [128, 128, 128];
    this.ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`;
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

  private draw_corner_dot(p: Projected, color: string): void {
    if (p.w < 0) return;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private draw_edge_highlight(a: Projected, b: Projected, color: string): void {
    if (a.w < 0 || b.w < 0) return;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(a.x, a.y);
    this.ctx.lineTo(b.x, b.y);
    this.ctx.stroke();
  }

  private draw_face_highlight(verts: Projected[], color: string): void {
    if (verts.some(v => v.w < 0)) return;
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < verts.length; i++) {
      this.ctx.lineTo(verts[i].x, verts[i].y);
    }
    this.ctx.closePath();
    this.ctx.fill();
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

      // Show all 3 dimensions (width, height, depth)
      const all_axes: Axis[] = ['x', 'y', 'z'];
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

    const { p1, p2, v1_idx, v2_idx } = edge_info;
    const value = axis === 'x' ? so.width : axis === 'y' ? so.height : so.depth;

    // Get witness direction from the most front-facing adjacent face
    let witness_dir = this.edge_witness_direction(so, v1_idx, v2_idx, axis, projected);

    // Pick direction that points away from cube center
    const verts = so.vertices;
    const v1 = verts[v1_idx], v2 = verts[v2_idx];
    const edge_mid = new Point3((v1.x + v2.x) / 2, (v1.y + v2.y) / 2, (v1.z + v2.z) / 2);
    const dot = witness_dir.x * edge_mid.x + witness_dir.y * edge_mid.y + witness_dir.z * edge_mid.z;
    if (dot < 0) {
      witness_dir = new Point3(-witness_dir.x, -witness_dir.y, -witness_dir.z);
    }

    // Compute witness line endpoints in 3D, then project
    // Scale witness distance relative to object size for consistent appearance
    const avg_size = (so.width + so.height + so.depth) / 3;
    const witness_dist = avg_size * 0.15;  // distance from edge to dimension line
    const witness_ext = avg_size * 0.1;   // extension past dimension line

    // Witness line start (small offset from edge)
    const gap = avg_size * 0.05;
    const w1_start = new Point3(v1.x + witness_dir.x * gap, v1.y + witness_dir.y * gap, v1.z + witness_dir.z * gap);
    const w2_start = new Point3(v2.x + witness_dir.x * gap, v2.y + witness_dir.y * gap, v2.z + witness_dir.z * gap);

    // Witness line end (past dimension line)
    const w1_end = new Point3(v1.x + witness_dir.x * (witness_dist + witness_ext), v1.y + witness_dir.y * (witness_dist + witness_ext), v1.z + witness_dir.z * (witness_dist + witness_ext));
    const w2_end = new Point3(v2.x + witness_dir.x * (witness_dist + witness_ext), v2.y + witness_dir.y * (witness_dist + witness_ext), v2.z + witness_dir.z * (witness_dist + witness_ext));

    // Dimension line endpoints (at witness_dist from edge)
    const d1 = new Point3(v1.x + witness_dir.x * witness_dist, v1.y + witness_dir.y * witness_dist, v1.z + witness_dir.z * witness_dist);
    const d2 = new Point3(v2.x + witness_dir.x * witness_dist, v2.y + witness_dir.y * witness_dist, v2.z + witness_dir.z * witness_dist);

    // Project all points
    const pw1_start = this.project_vertex(w1_start, world_matrix);
    const pw1_end = this.project_vertex(w1_end, world_matrix);
    const pw2_start = this.project_vertex(w2_start, world_matrix);
    const pw2_end = this.project_vertex(w2_end, world_matrix);
    const pd1 = this.project_vertex(d1, world_matrix);
    const pd2 = this.project_vertex(d2, world_matrix);

    this.draw_dimension_3d(pw1_start, pw1_end, pw2_start, pw2_end, pd1, pd2, value);
  }

  // Get witness direction from the most front-facing face that contains the edge's axis
  // This may be ANY face (including the back face), not just faces adjacent to the edge
  private edge_witness_direction(
    so: Smart_Object,
    v1: number, v2: number,
    edge_axis: Axis,
    projected: Projected[]
  ): Point3 {
    if (!so.scene?.faces) return new Point3(0, 0, 1);

    // Find all faces that contain this axis (i.e., faces where the edge axis is one of their axes)
    // Face axes: 0,1 (front/back) have x,y; 2,3 (left/right) have y,z; 4,5 (top/bottom) have x,z
    const candidate_faces: number[] = [];
    for (let fi = 0; fi < so.scene.faces.length; fi++) {
      const face_axes = so.face_axes(fi);
      if (face_axes.includes(edge_axis)) {
        candidate_faces.push(fi);
      }
    }

    if (candidate_faces.length === 0) return new Point3(0, 0, 1);

    // Pick the most front-facing face (most negative winding = most toward viewer)
    let best_face = candidate_faces[0];
    let best_winding = this.face_winding(so.scene.faces[best_face], projected);

    for (const fi of candidate_faces) {
      const winding = this.face_winding(so.scene.faces[fi], projected);
      if (winding < best_winding) {
        best_winding = winding;
        best_face = fi;
      }
    }

    // Witness direction: the other axis in this face's plane (not the edge axis)
    const face_axes = so.face_axes(best_face);
    const witness_axis = face_axes.find(a => a !== edge_axis) ?? face_axes[0];
    return so.axis_vector(witness_axis);
  }

  // Find the best edge along a given axis (for dimensioning)
  // Must be on a front-facing face
  private find_best_edge_for_axis(
    so: Smart_Object,
    axis: Axis,
    projected: Projected[]
  ): { p1: Projected; p2: Projected; v1_idx: number; v2_idx: number } | null {
    if (!so.scene?.faces) return null;
    const verts = so.vertices;
    const faces = so.scene.faces;

    // Face info: index, fixed axis, and whether front-facing
    // Faces: 0=front(z), 1=back(z), 2=left(x), 3=right(x), 4=top(y), 5=bottom(y)
    const face_fixed_axes: Axis[] = ['z', 'z', 'x', 'x', 'y', 'y'];

    type EdgeCandidate = {
      v1: number; v2: number;
      midX: number; midY: number;
    };
    const candidates: EdgeCandidate[] = [];

    for (let fi = 0; fi < faces.length; fi++) {
      const face = faces[fi];
      const fixed_axis = face_fixed_axes[fi];

      // Skip faces whose fixed axis matches the dimension axis
      // (those faces don't have edges along this axis)
      if (fixed_axis === axis) continue;

      // Check if face is front-facing (CCW winding = negative cross product)
      const cross = this.face_winding(face, projected);
      if (cross >= 0) continue; // back-facing, skip

      // Find the edge in this face that runs along the target axis
      const face_axes = so.face_axes(fi);
      if (!face_axes.includes(axis)) continue;

      // Find an edge along the target axis in this face
      for (let i = 0; i < face.length; i++) {
        const v1 = face[i];
        const v2 = face[(i + 1) % face.length];
        const vert1 = verts[v1], vert2 = verts[v2];

        // Check if this edge runs along the target axis
        const edge_axis = this.edge_axis(vert1, vert2);
        if (edge_axis !== axis) continue;

        const p1 = projected[v1], p2 = projected[v2];
        if (p1.w < 0 || p2.w < 0) continue;

        // Score by distance from cube center — further = more "outside"
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        candidates.push({ v1, v2, midX, midY });
      }
    }

    if (candidates.length === 0) return null;

    // Compute cube center in screen space
    const center = this.project_vertex(new Point3(0, 0, 0), this.get_world_matrix(so.scene!));

    // Score each candidate by distance from center — furthest = most "outside"
    candidates.sort((a, b) => {
      const distA = (a.midX - center.x) ** 2 + (a.midY - center.y) ** 2;
      const distB = (b.midX - center.x) ** 2 + (b.midY - center.y) ** 2;
      return distB - distA;
    });
    const best = candidates[0];

    return {
      p1: projected[best.v1],
      p2: projected[best.v2],
      v1_idx: best.v1,
      v2_idx: best.v2
    };
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

  // Compute face winding (negative = front-facing with CCW convention)
  private face_winding(face: number[], projected: Projected[]): number {
    if (face.length < 3) return Infinity;
    const p0 = projected[face[0]], p1 = projected[face[1]], p2 = projected[face[2]];
    if (p0.w < 0 || p1.w < 0 || p2.w < 0) return Infinity;
    return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
  }

  private face_center(face_verts: number[], projected: Projected[]): { x: number; y: number } {
    let x = 0, y = 0;
    for (const v of face_verts) {
      x += projected[v].x;
      y += projected[v].y;
    }
    return { x: x / face_verts.length, y: y / face_verts.length };
  }

  private draw_dimension_3d(
    w1_start: Projected, w1_end: Projected,
    w2_start: Projected, w2_end: Projected,
    d1: Projected, d2: Projected,
    value: number
  ): void {
    // Check all points are in front of camera
    if (w1_start.w < 0 || w1_end.w < 0 || w2_start.w < 0 || w2_end.w < 0 || d1.w < 0 || d2.w < 0) return;

    const ctx = this.ctx;

    // Witness lines (projected in 3D)
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w1_start.x, w1_start.y);
    ctx.lineTo(w1_end.x, w1_end.y);
    ctx.moveTo(w2_start.x, w2_start.y);
    ctx.lineTo(w2_end.x, w2_end.y);
    ctx.stroke();

    // Text setup (need dimensions for gap)
    ctx.font = '12px sans-serif';
    const text = value.toFixed(2);
    const textWidth = ctx.measureText(text).width;
    const gap = textWidth + 8; // padding around text

    // Dimension line with gap for text
    const midX = (d1.x + d2.x) / 2, midY = (d1.y + d2.y) / 2;
    const dx = d2.x - d1.x, dy = d2.y - d1.y;
    const lineLen = Math.sqrt(dx * dx + dy * dy);
    if (lineLen < 1) return;
    const ux = dx / lineLen, uy = dy / lineLen;
    const halfGap = gap / 2;

    // Left segment: d1 to gap start
    ctx.beginPath();
    ctx.moveTo(d1.x, d1.y);
    ctx.lineTo(midX - ux * halfGap, midY - uy * halfGap);
    ctx.stroke();

    // Right segment: gap end to d2
    ctx.beginPath();
    ctx.moveTo(midX + ux * halfGap, midY + uy * halfGap);
    ctx.lineTo(d2.x, d2.y);
    ctx.stroke();

    // Arrows
    ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
    this.draw_arrow(d1.x, d1.y, d2.x - d1.x, d2.y - d1.y);
    this.draw_arrow(d2.x, d2.y, d1.x - d2.x, d1.y - d2.y);

    // Text centered in gap
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, midX, midY);
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
