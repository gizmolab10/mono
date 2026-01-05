import { mat4, vec4 } from 'gl-matrix';
import { Projected, O_Scene } from '../types/Interfaces';
import { Size } from '../types/Coordinates';
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

  render(): void {
    this.ctx.clearRect(0, 0, this.size.width, this.size.height);
    for (const obj of scene.get_all()) {
      this.render_object(obj);
    }
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

  private project_vertex(v: [number, number, number], world_matrix: mat4): Projected {
    const point = vec4.fromValues(v[0], v[1], v[2], 1);

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
}

export const render = new Render();
