import { mat4, vec4 } from 'gl-matrix';
import type { Projected, O_Scene } from '../types/Interfaces';
import { Size, Point3 } from '../types/Coordinates';
import { hits_3d } from '../managers/Hits_3D';
import { T_Hit_3D } from '../types/Enumerations';
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

  private render_object(obj: O_Scene): void {
    const world_matrix = this.get_world_matrix(obj);
    const projected = obj.vertices.map((v) => this.project_vertex(v, world_matrix));
    hits_3d.update_projected(obj.id, projected);

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
}

export const render = new Render();
